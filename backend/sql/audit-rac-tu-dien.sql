-- =====================================================================
-- AUDIT RÁC KÝ TỰ TRONG TỪ ĐIỂN  (CHỈ ĐỌC — không ghi gì vào DB)
-- ---------------------------------------------------------------------
-- Dò dữ liệu bị hỏng do nhập từ app Windows legacy (Kinhlac/*.dat):
-- bộ đọc file legacy trượt offset nên chèn byte nhị phân vào đầu/cuối
-- chuỗi, làm dấu thanh tiếng Việt hỏng, và sinh ra bản ghi rác.
--
-- Cách chạy (xem backend/sql/README.md và skill chay-migration-sql-production):
--   psql "$DATABASE_URL?sslmode=require" -f backend/sql/audit-rac-tu-dien.sql
--
-- SÁU dạng lỗi được dò:
--   D1 rác nhị phân  — control char, Cyrillic/Armenian/Tamil, và "chữ Hán
--                      giả" do 2 byte rác ghép lại (圀 稅 阀 …)
--   D2 chữ Việt hỏng — dấu thanh biến thành ký tự lạ ("Ba·c hà" = "Bạc hà")
--   D3 bản ghi trộn  — ranh giới bản ghi legacy sai, nội dung trường khác
--                      lẫn vào (cong_dung chứa "— Dùng: …")
--   D4 chữ Hán chưa dịch lẫn trong câu tiếng Việt ("Tiêu痞 tán kết")
--   D5 mojibake      — UTF-8 bị đọc như Latin-1 ("Triá»‡u chá»©ng")
--   D6 TCVN3/ABC     — bảng mã font cũ chưa chuyển ("NguyÔn Ngäc Bich")
--
-- D1–D4 dò bằng tập ký tự hợp lệ. D5–D6 PHẢI dò riêng: mọi ký tự của
-- chúng đều "hợp lệ" nên phép kiểm tập ký tự không thấy gì.
-- =====================================================================

\pset pager off
\timing off

-- ---------------------------------------------------------------------
-- Tập ký tự HỢP LỆ. Viết bằng ascii('<ký tự thật>') để đọc được bằng mắt;
-- dải nào không có ký tự hiển thị được thì ghi số kèm chú thích.
-- ---------------------------------------------------------------------
create temp table wl_range (lo int, hi int);

insert into wl_range (lo, hi) values
  (9, 9), (10, 10), (13, 13),                      -- tab, xuống dòng, CR
  (32, 126),                                       -- ASCII in được
  (160, 160),                                      -- nbsp
  (ascii('°'), ascii('°')), (ascii('±'), ascii('±')), (ascii('·'), ascii('·')),
  (ascii('©'), ascii('©')), (ascii('®'), ascii('®')), (ascii('µ'), ascii('µ')),
  (ascii('×'), ascii('×')), (ascii('÷'), ascii('÷')),
  (ascii('«'), ascii('«')), (ascii('»'), ascii('»')),
  (188, 190),                                      -- ¼ ½ ¾
  (ascii('ç'), ascii('ç')),                        -- Behçet
  -- nguyên âm có dấu tiếng Việt nằm trong Latin-1
  (ascii('À'), ascii('Ã')), (ascii('È'), ascii('Ê')), (ascii('Ì'), ascii('Í')),
  (ascii('Ò'), ascii('Õ')), (ascii('Ù'), ascii('Ú')), (ascii('Ý'), ascii('Ý')),
  (ascii('à'), ascii('ã')), (ascii('è'), ascii('ê')), (ascii('ì'), ascii('í')),
  (ascii('ò'), ascii('õ')), (ascii('ù'), ascii('ú')), (ascii('ý'), ascii('ý')),
  -- Ăă Đđ Ĩĩ Ũũ Ơơ Ưư
  (ascii('Ă'), ascii('ă')), (ascii('Đ'), ascii('đ')), (ascii('Ĩ'), ascii('ĩ')),
  (ascii('Ũ'), ascii('ũ')), (ascii('Ơ'), ascii('ơ')), (ascii('Ư'), ascii('ư')),
  -- dấu thanh tổ hợp (chuỗi dạng NFD)
  (768, 771), (774, 774), (777, 777), (795, 795), (803, 803),
  (ascii('Α'), ascii('ω')),                        -- Hy Lạp: α-pinen, β-sitosterol
  (ascii('Ạ'), ascii('ỹ')),                        -- Latin Extended Additional (tiếng Việt)
  (8192, 8303),                                    -- dấu câu Unicode: – — “ ” ‘ ’ … •
  (ascii('₫'), ascii('₫')),
  (8592, 8703), (8704, 8959),                      -- mũi tên, ký hiệu toán
  (9312, 9471),                                    -- ① ② ③ … dùng trong bảng Thương Hàn
  (9472, 10175),                                   -- khung, bullet, ✓ ⚠
  (12288, 12351),                                  -- dấu câu CJK 《 》
  (13312, 19903), (19968, 40959), (63744, 64255);  -- chữ Hán

-- Cột có bộ ký tự riêng, KHÔNG áp tập hợp lệ tiếng Việt ở trên:
--   ten_pinyin dùng dấu thanh pinyin (ā ē ǐ ǒ ū ǘ …)
create temp table cot_bo_qua (tbl text, col text);
insert into cot_bo_qua values ('vi_thuoc', 'ten_pinyin');

-- Dải chữ Hán, tách riêng để dò D4 (chữ Hán lẫn trong câu tiếng Việt)
create temp table han_range (lo int, hi int);
insert into han_range (lo, hi) values (13312, 19903), (19968, 40959), (63744, 64255);

-- Dựng regex class từ bảng dải ở trên (tránh phải viết escape tay)
create temp table cls as
select
  '[' || string_agg(
    case when lo = hi then '\u' || lpad(to_hex(lo), 4, '0')
         else '\u' || lpad(to_hex(lo), 4, '0') || '-\u' || lpad(to_hex(hi), 4, '0') end,
    '' order by lo) || ']' as hop_le,
  -- class chỉ gồm CHỮ CÁI Việt/Latin, dùng để phân biệt "dòng rác" với
  -- "dòng có chữ thật": dòng rác không có 3 chữ cái liên tiếp nào
  '[a-zA-ZÀ-ÃÈ-ÊÌ-ÍÒ-ÕÙ-ÚÝà-ãè-êì-íò-õù-úýĂ-ăĐ-đĨ-ĩŨ-ũƠ-ơƯ-ưẠ-ỹ]' as chu_viet
from wl_range;

create temp table han as
select '[' || string_agg('\u' || lpad(to_hex(lo), 4, '0') || '-\u' || lpad(to_hex(hi), 4, '0'), '') || ']' as re
from han_range;

\echo
\echo '=== D1+D2. RÁC KÝ TỰ THEO TỪNG CỘT (bỏ qua bảng *_bak_*) ==========='
\echo '   so_dong  = số bản ghi có ký tự ngoài tập hợp lệ'
\echo '   ma_ky_tu = codepoint hex của các ký tự lạ tìm được'
\echo

select tbl as bang, col as cot, n as so_dong, left(cps, 110) as ma_ky_tu
from (
  select c.table_name as tbl, c.column_name as col,
         (xpath('/row/n/text()', q.x))[1]::text::bigint as n,
         (xpath('/row/c/text()', q.x))[1]::text as cps
  from information_schema.columns c
  cross join cls
  cross join lateral (
    select query_to_xml(
      format($fmt$
        with b as (
          select regexp_replace(%I::text, %L, '', 'g') as bad
          from %I.%I
          where %I::text ~ %L
        )
        select (select count(*) from b) as n,
               (select string_agg(distinct lpad(to_hex(ascii(ch)), 4, '0'), ' ')
                  from b, unnest(string_to_array(b.bad, NULL)) ch) as c
      $fmt$,
        c.column_name, cls.hop_le,
        c.table_schema, c.table_name,
        c.column_name, '[^' || substring(cls.hop_le from 2)),
      false, true, '') as x
  ) q
  where c.table_schema = 'public'
    and c.table_name not like '%\_bak\_%'
    and c.data_type in ('text', 'character varying', 'character', 'jsonb', 'json')
    and not exists (select 1 from cot_bo_qua b
                    where b.tbl = c.table_name and b.col = c.column_name)
) s
where n > 0
order by n desc, bang, cot;

\echo
\echo '=== D1 vs D2. DÒNG RÁC THUẦN vs RÁC XEN TRONG CHỮ (phuong_thang) ==='
\echo '   dong_rac_thuan   = xoá cả dòng được, tự động'
\echo '   dong_co_chu_that = rác nằm giữa chữ, phải sửa tay'
\echo

with r as (
  select id, 'ghi_chu' as cot, unnest(string_to_array(ghi_chu, chr(10))) as ln from phuong_thang
  union all select id, 'thanh_phan_raw', unnest(string_to_array(thanh_phan_raw, chr(10))) from phuong_thang
  union all select id, 'tac_dung', unnest(string_to_array(tac_dung, chr(10))) from phuong_thang
  union all select id, 'cach_dung', unnest(string_to_array(cach_dung, chr(10))) from phuong_thang
  union all select id, 'xuat_xu', unnest(string_to_array(xuat_xu, chr(10))) from phuong_thang
  union all select id, 'thanh_phan', unnest(string_to_array(thanh_phan::text, chr(10))) from phuong_thang
)
select r.cot, count(*) as so_dong_co_rac, count(distinct r.id) as so_ban_ghi,
       count(*) filter (where r.ln !~ (cls.chu_viet || '{3}')) as dong_rac_thuan,
       count(*) filter (where r.ln ~  (cls.chu_viet || '{3}')) as dong_co_chu_that
from r cross join cls
where r.ln ~ ('[^' || substring(cls.hop_le from 2))
group by r.cot
order by so_dong_co_rac desc;

\echo
\echo '--- Phần tử vị thuốc GIẢ trong phuong_thang.thanh_phan (JSONB) ---'
\echo

with e as (
  select p.id, el->>'ten' as ten
  from phuong_thang p, jsonb_array_elements(p.thanh_phan) el
  cross join cls
  where (el->>'ten') ~ ('[^' || substring(cls.hop_le from 2))
)
select count(*) as phan_tu_loi, count(distinct id) as so_bai_thuoc,
       count(*) filter (where ten !~ (select chu_viet || '{3}' from cls)) as phan_tu_gia_xoa_duoc,
       count(*) filter (where ten ~  (select chu_viet || '{3}' from cls)) as ten_that_dinh_rac
from e;

\echo
\echo '=== D3. BẢN GHI BỊ TRỘN / CỤT (cong_dung, chu_tri) ================='
\echo '   Hai bảng này chứa cụm từ NGẮN (trung bình ~20 ký tự).'
\echo '   Bản ghi chứa "Dùng:" hoặc dài quá 60 ký tự là mảnh của trường khác.'
\echo

select 'cong_dung' as bang, count(*) as tong,
       count(*) filter (where ten_cong_dung like '%Dùng:%') as chua_cum_dung,
       count(*) filter (where length(ten_cong_dung) > 60) as dai_qua_60,
       count(*) filter (where ten_cong_dung ~ (select '[^' || substring(hop_le from 2) from cls)) as co_rac_ky_tu,
       count(*) filter (where ten_cong_dung ~ (select re from han)) as co_chu_han
from cong_dung
union all
select 'chu_tri', count(*),
       count(*) filter (where ten_chu_tri like '%Dùng:%'),
       count(*) filter (where length(ten_chu_tri) > 60),
       count(*) filter (where ten_chu_tri ~ (select '[^' || substring(hop_le from 2) from cls)),
       count(*) filter (where ten_chu_tri ~ (select re from han))
from chu_tri;

\echo
\echo '--- cong_dung lỗi: bao nhiêu đang gắn vào vị thuốc (phải sửa, không xoá) ---'
\echo

with loi as (
  select id from cong_dung
  where ten_cong_dung like '%Dùng:%'
     or length(ten_cong_dung) > 60
     or ten_cong_dung ~ (select '[^' || substring(hop_le from 2) from cls)
     or ten_cong_dung ~ (select re from han)
)
select (select count(*) from loi) as tong_ban_ghi_loi,
       count(*) filter (where exists (select 1 from vi_thuoc_cong_dung v where v.id_cong_dung = l.id)) as dang_gan_vao_vi_thuoc,
       count(*) filter (where not exists (select 1 from vi_thuoc_cong_dung v where v.id_cong_dung = l.id)) as mo_coi_khong_ai_dung
from loi l;

\echo
\echo '=== D4. CHỮ HÁN CHƯA DỊCH LẪN TRONG CỘT TIẾNG VIỆT ================='
\echo '   (ten_han / ten_khac / ten_pinyin là cột chữ Hán chính thức, không tính)'
\echo

select 'vi_thuoc.cong_dung_tom_tat' as cot, count(*) as so_dong from vi_thuoc, han where cong_dung_tom_tat ~ han.re
union all select 'vi_thuoc.bo_phan_dung', count(*) from vi_thuoc, han where bo_phan_dung ~ han.re
union all select 'vi_thuoc.tinh', count(*) from vi_thuoc, han where tinh ~ han.re
union all select 'vi_thuoc.vi', count(*) from vi_thuoc, han where vi ~ han.re
union all select 'vi_thuoc.quy_kinh', count(*) from vi_thuoc, han where quy_kinh ~ han.re
union all select 'vi_thuoc.mo_ta', count(*) from vi_thuoc, han where mo_ta ~ han.re
union all select 'cong_dung.ten_cong_dung', count(*) from cong_dung, han where ten_cong_dung ~ han.re
union all select 'chu_tri.ten_chu_tri', count(*) from chu_tri, han where ten_chu_tri ~ han.re
order by so_dong desc;

\echo
\echo '=== D5. MOJIBAKE (UTF-8 bị đọc như Latin-1) ========================'
\echo '   Dấu hiệu: chuỗi chứa "Ã" "á»" "â€" "Ä" "Æ".'
\echo '   Lưu ý: ở phuong_thang đây thường là rác D1 chứ không phải mojibake thật.'
\echo

select tbl as bang, col as cot, n as so_dong
from (
  select c.table_name as tbl, c.column_name as col,
         (xpath('/row/n/text()', q.x))[1]::text::bigint as n
  from information_schema.columns c
  cross join lateral (
    select query_to_xml(
      format($f$select count(*) as n from %I.%I
              where %I::text like '%%Ã%%' or %I::text like '%%á»%%'
                 or %I::text like '%%â€%%' or %I::text like '%%Ä%%'
                 or %I::text like '%%Æ%%'$f$,
        c.table_schema, c.table_name,
        c.column_name, c.column_name, c.column_name, c.column_name, c.column_name),
      false, true, '') as x
  ) q
  where c.table_schema = 'public'
    and c.table_name not like '%\_bak\_%'
    and c.data_type in ('text', 'character varying', 'character', 'jsonb', 'json')
) s
where n > 0
order by n desc;

\echo
\echo '=== D6. BẢNG MÃ TCVN3/ABC CHƯA CHUYỂN =============================='
\echo '   Dấu hiệu: chuỗi chứa ® ¬ ¹ § Þ ë ("NguyÔn Ngäc Bich").'
\echo

select tbl as bang, col as cot, n as so_dong
from (
  select c.table_name as tbl, c.column_name as col,
         (xpath('/row/n/text()', q.x))[1]::text::bigint as n
  from information_schema.columns c
  cross join lateral (
    select query_to_xml(
      format($f$select count(*) as n from %I.%I
              where %I::text like '%%®%%' or %I::text like '%%¬%%'
                 or %I::text like '%%¹%%' or %I::text like '%%§%%'
                 or %I::text like '%%Þ%%' or %I::text like '%%ë%%'$f$,
        c.table_schema, c.table_name,
        c.column_name, c.column_name, c.column_name,
        c.column_name, c.column_name, c.column_name),
      false, true, '') as x
  ) q
  where c.table_schema = 'public'
    and c.table_name not like '%\_bak\_%'
    and c.data_type in ('text', 'character varying', 'character', 'jsonb', 'json')
) s
where n > 0
order by n desc;

\echo
\echo '=== SẠCH khi mọi số ở D1–D6 đều bằng 0 ============================='
\echo
