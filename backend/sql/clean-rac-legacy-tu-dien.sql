-- =====================================================================
-- LÀM SẠCH RÁC KÝ TỰ TRONG TỪ ĐIỂN (di sản nhập từ app Windows legacy)
-- ---------------------------------------------------------------------
-- Chạy audit TRƯỚC và SAU để đối chiếu:
--   psql "$DATABASE_URL?sslmode=require" -f backend/sql/audit-rac-tu-dien.sql
--
-- Chạy file này:
--   psql "$DATABASE_URL?sslmode=require" -f backend/sql/clean-rac-legacy-tu-dien.sql
--
-- File TỰ SAO LƯU 5 bảng bị sửa thành *_bak_rac_20260918 trước khi ghi.
-- Toàn bộ nằm trong MỘT transaction: lỗi giữa đường thì không sửa gì.
--
-- PHẠM VI (chỉ D1 + D2 trong audit — rác ký tự và dấu thanh hỏng):
--   phuong_thang  ghi_chu 2788 / thanh_phan_raw 446 / thanh_phan 443
--                 xuat_xu 17 / tac_dung 8 / cach_dung 4 bản ghi
--   cong_dung     ten_cong_dung 24 bản ghi (chỉ xoá rác ký tự)
--   chu_tri       ten_chu_tri 5 bản ghi
--   nguon         ten 6 + norm_key 6 bản ghi
--   vi_thuoc      8 bản ghi rải ở ten_han/xuat_xu/chu_tri/don_thuoc/
--                 duoc_ly/tham_khao
--
-- KHÔNG nằm trong phạm vi (phải quyết riêng, xem báo cáo audit):
--   D3 cong_dung 122 bản ghi bị trộn nội dung trường khác (107 mồ côi,
--      15 đang gắn vào vị thuốc) — cần đối chiếu sách, không tự sửa được
--   D4 chữ Hán chưa dịch (29 + 12 + 8 + 7 bản ghi)
--   D5 mojibake examinations.notes 311 bản ghi (dữ liệu khám bệnh nhân)
--   D6 TCVN3 trong patients (3 bản ghi, dữ liệu bệnh nhân thật)
--   Các bản ghi bị CỤT chữ, liệt kê ở cuối file — cần tra sách gốc
-- =====================================================================

\pset pager off
\timing on

begin;

-- ---------------------------------------------------------------------
-- 0. SAO LƯU
-- ---------------------------------------------------------------------
create table if not exists phuong_thang_bak_rac_20260918 as select * from phuong_thang;
create table if not exists cong_dung_bak_rac_20260918    as select * from cong_dung;
create table if not exists chu_tri_bak_rac_20260918      as select * from chu_tri;
create table if not exists nguon_bak_rac_20260918        as select * from nguon;
create table if not exists vi_thuoc_bak_rac_20260918     as select * from vi_thuoc;

-- ---------------------------------------------------------------------
-- 1. TẬP KÝ TỰ HỢP LỆ (giữ khớp với audit-rac-tu-dien.sql)
-- ---------------------------------------------------------------------
create temp table wl_range (lo int, hi int);

insert into wl_range (lo, hi) values
  (9, 9), (10, 10), (13, 13),
  (32, 126),
  (160, 160),
  (ascii('°'), ascii('°')), (ascii('±'), ascii('±')), (ascii('·'), ascii('·')),
  (ascii('©'), ascii('©')), (ascii('®'), ascii('®')), (ascii('µ'), ascii('µ')),
  (ascii('×'), ascii('×')), (ascii('÷'), ascii('÷')),
  (ascii('«'), ascii('«')), (ascii('»'), ascii('»')),
  (188, 190),
  (ascii('ç'), ascii('ç')),
  (ascii('À'), ascii('Ã')), (ascii('È'), ascii('Ê')), (ascii('Ì'), ascii('Í')),
  (ascii('Ò'), ascii('Õ')), (ascii('Ù'), ascii('Ú')), (ascii('Ý'), ascii('Ý')),
  (ascii('à'), ascii('ã')), (ascii('è'), ascii('ê')), (ascii('ì'), ascii('í')),
  (ascii('ò'), ascii('õ')), (ascii('ù'), ascii('ú')), (ascii('ý'), ascii('ý')),
  (ascii('Ă'), ascii('ă')), (ascii('Đ'), ascii('đ')), (ascii('Ĩ'), ascii('ĩ')),
  (ascii('Ũ'), ascii('ũ')), (ascii('Ơ'), ascii('ơ')), (ascii('Ư'), ascii('ư')),
  (768, 771), (774, 774), (777, 777), (795, 795), (803, 803),
  (ascii('Α'), ascii('ω')),
  (ascii('Ạ'), ascii('ỹ')),
  (8192, 8303),
  (ascii('₫'), ascii('₫')),
  (8592, 8703), (8704, 8959),
  (9312, 9471), (9472, 10175),
  (12288, 12351),
  (13312, 19903), (19968, 40959), (63744, 64255);

-- re_la  : khớp ký tự KHÔNG hợp lệ
-- re_chu : khớp 3 chữ cái Việt/Latin liên tiếp — dấu hiệu "dòng có chữ thật"
create temp table cls as
select
  '[^' || string_agg(
    case when lo = hi then '\u' || lpad(to_hex(lo), 4, '0')
         else '\u' || lpad(to_hex(lo), 4, '0') || '-\u' || lpad(to_hex(hi), 4, '0') end,
    '' order by lo) || ']' as re_la,
  '[a-zA-ZÀ-ÃÈ-ÊÌ-ÍÒ-ÕÙ-ÚÝà-ãè-êì-íò-õù-úýĂ-ăĐ-đĨ-ĩŨ-ũƠ-ơƯ-ưẠ-ỹ]{3}' as re_chu
from wl_range;

-- ---------------------------------------------------------------------
-- 2. XOÁ CẢ DÒNG RÁC ở cột nhiều dòng
--    Bộ đọc legacy chèn nguyên khối byte rác thành dòng riêng sau nội
--    dung thật. Dòng nào có ký tự lạ mà KHÔNG có 3 chữ cái liên tiếp
--    thì là dòng rác, xoá cả dòng. Dòng có chữ thật thì giữ, sang bước 3.
-- ---------------------------------------------------------------------
update phuong_thang p
set ghi_chu = nullif(btrim((
      select coalesce(string_agg(ln, chr(10) order by ord), '')
      from unnest(string_to_array(p.ghi_chu, chr(10))) with ordinality u(ln, ord)
      where ln !~ (select re_la from cls) or ln ~ (select re_chu from cls)
    ), E' \n\r\t'), '')
where p.ghi_chu ~ (select re_la from cls);

update phuong_thang p
set thanh_phan_raw = nullif(btrim((
      select coalesce(string_agg(ln, chr(10) order by ord), '')
      from unnest(string_to_array(p.thanh_phan_raw, chr(10))) with ordinality u(ln, ord)
      where ln !~ (select re_la from cls) or ln ~ (select re_chu from cls)
    ), E' \n\r\t'), '')
where p.thanh_phan_raw ~ (select re_la from cls);

-- ---------------------------------------------------------------------
-- 3. XOÁ KÝ TỰ RÁC XEN TRONG CHỮ (cột một dòng + phần còn lại của B2)
--    Ký tự rác ở đây là DẤU THANH bị hỏng, nên xoá nó đi chữ sẽ mất dấu
--    ("Ba·c hà" -> "Bac hà"). Bước 4 trả lại dấu cho từng ca.
-- ---------------------------------------------------------------------
update phuong_thang set ghi_chu        = btrim(regexp_replace(ghi_chu,        (select re_la from cls), '', 'g'), E' \n\r\t') where ghi_chu        ~ (select re_la from cls);
update phuong_thang set thanh_phan_raw = btrim(regexp_replace(thanh_phan_raw, (select re_la from cls), '', 'g'), E' \n\r\t') where thanh_phan_raw ~ (select re_la from cls);
update phuong_thang set xuat_xu        = btrim(regexp_replace(xuat_xu,        (select re_la from cls), '', 'g'))             where xuat_xu        ~ (select re_la from cls);
update phuong_thang set tac_dung       = btrim(regexp_replace(tac_dung,       (select re_la from cls), '', 'g'), E' \n\r\t') where tac_dung       ~ (select re_la from cls);
update phuong_thang set cach_dung      = btrim(regexp_replace(cach_dung,      (select re_la from cls), '', 'g'), E' \n\r\t') where cach_dung      ~ (select re_la from cls);

update cong_dung set ten_cong_dung = btrim(regexp_replace(ten_cong_dung, (select re_la from cls), '', 'g')) where ten_cong_dung ~ (select re_la from cls);
update chu_tri   set ten_chu_tri   = btrim(regexp_replace(ten_chu_tri,   (select re_la from cls), '', 'g')) where ten_chu_tri   ~ (select re_la from cls);
update nguon     set ten           = btrim(regexp_replace(ten,           (select re_la from cls), '', 'g')) where ten           ~ (select re_la from cls);

update vi_thuoc set xuat_xu   = btrim(regexp_replace(xuat_xu,   (select re_la from cls), '', 'g'))             where xuat_xu   ~ (select re_la from cls);
update vi_thuoc set chu_tri   = btrim(regexp_replace(chu_tri,   (select re_la from cls), '', 'g'), E' \n\r\t') where chu_tri   ~ (select re_la from cls);
update vi_thuoc set don_thuoc = btrim(regexp_replace(don_thuoc, (select re_la from cls), '', 'g'), E' \n\r\t') where don_thuoc ~ (select re_la from cls);
update vi_thuoc set duoc_ly   = btrim(regexp_replace(duoc_ly,   (select re_la from cls), '', 'g'), E' \n\r\t') where duoc_ly   ~ (select re_la from cls);
update vi_thuoc set tham_khao = btrim(regexp_replace(tham_khao, (select re_la from cls), '', 'g'), E' \n\r\t') where tham_khao ~ (select re_la from cls);
update vi_thuoc set cong_dung_tom_tat = btrim(regexp_replace(cong_dung_tom_tat, (select re_la from cls), '', 'g')) where cong_dung_tom_tat ~ (select re_la from cls);

-- ten_han của 2 vị này rác toàn bộ, không còn chữ Hán nào -> để trống
update vi_thuoc set ten_han = null
where ten_han ~ (select re_la from cls)
   or btrim(regexp_replace(coalesce(ten_han, ''), (select re_la from cls), '', 'g')) = '';

-- ---------------------------------------------------------------------
-- 4. JSONB phuong_thang.thanh_phan
--    4a. Bỏ phần tử vị thuốc GIẢ: "ten" toàn rác, không có chữ thật nào
--        (492 phần tử trên 443 bài thuốc)
--    4b. Làm sạch 5 phần tử có tên THẬT bị dính rác
-- ---------------------------------------------------------------------
update phuong_thang p
set thanh_phan = coalesce((
      select jsonb_agg(el order by ord)
      from jsonb_array_elements(p.thanh_phan) with ordinality a(el, ord)
      where (el->>'ten') !~ (select re_la from cls)
         or (el->>'ten') ~  (select re_chu from cls)
    ), '[]'::jsonb)
where p.thanh_phan::text ~ (select re_la from cls);

update phuong_thang p
set thanh_phan = (
      select jsonb_agg(
               case when (el->>'ten') ~ (select re_la from cls)
                    then jsonb_set(el, '{ten}',
                           to_jsonb(btrim(regexp_replace(el->>'ten', (select re_la from cls), '', 'g'))))
                    else el end
               order by ord)
      from jsonb_array_elements(p.thanh_phan) with ordinality a(el, ord)
    )
where p.thanh_phan::text ~ (select re_la from cls);

-- ---------------------------------------------------------------------
-- 5. TRẢ LẠI DẤU THANH cho các ca bước 3 làm mất dấu.
--    Mỗi dòng dưới đây đã đối chiếu ngữ cảnh câu và thuật ngữ Đông Y.
-- ---------------------------------------------------------------------
update phuong_thang set ghi_chu = replace(ghi_chu, 'Bac hà',  'Bạc hà')  where id = 3202;
update phuong_thang set ghi_chu = replace(ghi_chu, 'Quy Lôc', 'Quy Lộc') where id = 5949;
update phuong_thang set ghi_chu = replace(ghi_chu, 'chi ẩu',  'chỉ ẩu')  where id = 6951;

update phuong_thang set tac_dung = replace(tac_dung, 'tri phong thấp', 'trị phong thấp') where id = 4752;
update phuong_thang set tac_dung = replace(tac_dung, 'Tri ho đờm',     'Trị ho đờm')     where id = 10198;
update phuong_thang set tac_dung = replace(tac_dung, 'đơn đôc',        'đơn độc')        where id = 10466;
update phuong_thang set tac_dung = replace(tac_dung, 'Ơ hơi',          'Ợ hơi')          where id = 12623;

update phuong_thang set cach_dung = replace(cach_dung, 'lưỡi đo,',     'lưỡi đỏ,')      where id = 8602;
update phuong_thang set cach_dung = replace(cach_dung, 'hôt đậu xanh', 'hột đậu xanh')  where id = 9054;
update phuong_thang set cach_dung = replace(cach_dung, 'Câu kỷ tư',    'Câu kỷ tử')     where id = 13766;

update phuong_thang set thanh_phan_raw = replace(thanh_phan_raw, 'lưỡi đo,',     'lưỡi đỏ,')     where id = 8602;
update phuong_thang set thanh_phan_raw = replace(thanh_phan_raw, 'hôt đậu xanh', 'hột đậu xanh') where id = 9054;
update phuong_thang set thanh_phan_raw = replace(thanh_phan_raw, 'Câu kỷ tư',    'Câu kỷ tử')    where id = 13766;
update phuong_thang set thanh_phan_raw = replace(thanh_phan_raw, 'Hài nhi tra',  'Hài nhi trà')  where id = 3405;
update phuong_thang set thanh_phan_raw = replace(thanh_phan_raw, 'Ngưu bàng tư', 'Ngưu bàng tử') where id = 13645;

-- Cùng các tên đó trong JSONB thanh_phan
update phuong_thang p
set thanh_phan = (
      select jsonb_agg(
               case when el->>'ten' = 'Câu kỷ tư'    then jsonb_set(el, '{ten}', '"Câu kỷ tử"'::jsonb)
                    when el->>'ten' = 'Hài nhi tra'  then jsonb_set(el, '{ten}', '"Hài nhi trà"'::jsonb)
                    when el->>'ten' = 'Ngưu bàng tư' then jsonb_set(el, '{ten}', '"Ngưu bàng tử"'::jsonb)
                    else el end
               order by ord)
      from jsonb_array_elements(p.thanh_phan) with ordinality a(el, ord)
    )
where p.id in (13766, 3405, 13645);

update chu_tri set ten_chu_tri = 'Khí hư suyễn hoặc ho lâu' where id = 942  and ten_chu_tri = 'Khí hưsuyễn hoặc ho lâu';
update chu_tri set ten_chu_tri = 'Bệnh Behçet'              where id = 2989 and ten_chu_tri = 'Bệnh Behet';
update chu_tri set ten_chu_tri = 'Huyết hư vi yếu'          where id = 1136 and ten_chu_tri = 'Huyết hư vi ếu';

update nguon    set ten     = 'Bản Kinh' where id = 216 and ten     = 'Ban Kinh';
update vi_thuoc set xuat_xu = 'Bản Kinh' where id = 77  and xuat_xu = 'Ban Kinh';

-- norm_key của nguon = fold(ten): bỏ dấu, đ->d, lowercase, gộp khoảng trắng
-- (xem fold() trong backend/src/controllers/nguon.controller.ts).
-- 6 bản ghi dưới đây có norm_key sinh từ tên còn rác nên tra cứu trượt.
update nguon set norm_key = 'ban kinh'                                where id = 216;
update nguon set norm_key = 'lan that bi tang (tap benh mon)'          where id = 964;
update nguon set norm_key = 'y phuong loai tu.'                        where id = 1344;
update nguon set norm_key = 'bang ngoc duong kinh nghiem phuong'       where id = 1833;
update nguon set norm_key = 'bien thuoc tam thu (than phuong)'         where id = 2001;
update nguon set norm_key = 'dieu thuc cam, bao cao 330 ca viem phe quan man tinh dieu tri bang bai thuoc co ban khai suyen hoan, bao thiem tay trung y tap chi 1986, 7 (3), 109.' where id = 1956;

-- Dọn khoảng trắng đôi do xoá ký tự rác ở giữa (chỉ cột một dòng)
update phuong_thang set xuat_xu = regexp_replace(xuat_xu, ' {2,}', ' ', 'g') where xuat_xu ~ '  ';
update cong_dung set ten_cong_dung = regexp_replace(ten_cong_dung, ' {2,}', ' ', 'g') where ten_cong_dung ~ '  ';
update chu_tri   set ten_chu_tri   = regexp_replace(ten_chu_tri,   ' {2,}', ' ', 'g') where ten_chu_tri   ~ '  ';
update nguon     set ten           = regexp_replace(ten,           ' {2,}', ' ', 'g') where ten           ~ '  ';

-- ---------------------------------------------------------------------
-- 6. KIỂM CHỨNG — mọi số phải bằng 0 trước khi commit
-- ---------------------------------------------------------------------
\echo
\echo '=== CÒN RÁC KÝ TỰ Ở ĐÂU (phải rỗng) ==============================='
\echo

select 'phuong_thang.ghi_chu' as cot, count(*) from phuong_thang where ghi_chu ~ (select re_la from cls)
union all select 'phuong_thang.thanh_phan_raw', count(*) from phuong_thang where thanh_phan_raw ~ (select re_la from cls)
union all select 'phuong_thang.thanh_phan',     count(*) from phuong_thang where thanh_phan::text ~ (select re_la from cls)
union all select 'phuong_thang.xuat_xu',        count(*) from phuong_thang where xuat_xu ~ (select re_la from cls)
union all select 'phuong_thang.tac_dung',       count(*) from phuong_thang where tac_dung ~ (select re_la from cls)
union all select 'phuong_thang.cach_dung',      count(*) from phuong_thang where cach_dung ~ (select re_la from cls)
union all select 'cong_dung.ten_cong_dung',     count(*) from cong_dung where ten_cong_dung ~ (select re_la from cls)
union all select 'chu_tri.ten_chu_tri',         count(*) from chu_tri where ten_chu_tri ~ (select re_la from cls)
union all select 'nguon.ten',                   count(*) from nguon where ten ~ (select re_la from cls)
union all select 'nguon.norm_key',              count(*) from nguon where norm_key ~ (select re_la from cls)
union all select 'vi_thuoc (mọi cột đã sửa)',   count(*) from vi_thuoc
  where coalesce(xuat_xu,'') ~ (select re_la from cls) or coalesce(chu_tri,'') ~ (select re_la from cls)
     or coalesce(don_thuoc,'') ~ (select re_la from cls) or coalesce(duoc_ly,'') ~ (select re_la from cls)
     or coalesce(tham_khao,'') ~ (select re_la from cls) or coalesce(ten_han,'') ~ (select re_la from cls)
     or coalesce(cong_dung_tom_tat,'') ~ (select re_la from cls)
order by 2 desc;

\echo
\echo '=== KHÔNG ĐƯỢC MẤT NỘI DUNG: bản ghi bị xoá trắng (phải là 0) ====='
\echo

select count(*) as ghi_chu_thanh_rong from phuong_thang p
  join phuong_thang_bak_rac_20260918 b using (id)
 where b.ghi_chu is not null and p.ghi_chu is null;

select count(*) as thanh_phan_thanh_rong from phuong_thang p
  join phuong_thang_bak_rac_20260918 b using (id)
 where jsonb_array_length(coalesce(b.thanh_phan, '[]')) > 0
   and jsonb_array_length(coalesce(p.thanh_phan, '[]')) = 0;

\echo
\echo '=== 10 bản ghi mất nhiều ký tự nhất (soi xem có mất nội dung thật) '
\echo

select p.id, left(p.ten, 30) as ten,
       length(b.ghi_chu) - length(p.ghi_chu) as so_ky_tu_da_xoa
from phuong_thang p join phuong_thang_bak_rac_20260918 b using (id)
where b.ghi_chu is distinct from p.ghi_chu
order by 3 desc nulls last
limit 10;

commit;

-- =====================================================================
-- CÒN LẠI: BẢN GHI BỊ CỤT CHỮ — cần tra sách gốc, KHÔNG sửa tự động
-- ---------------------------------------------------------------------
-- Rác đã ăn mất một hoặc vài chữ. Sau khi chạy file này chúng hết ký tự
-- lạ nhưng câu vẫn thiếu chữ. Cột trái là giá trị hiện tại, cột phải là
-- phỏng đoán cần người đối chiếu:
--
--   chu_tri  446  'TRỊ: t lạp chuyên trị hạ lỵ'  -> 'Bạch lạp …'?
--                 (đi cùng vi_thuoc 1152 Bạch Lạp, cột chu_tri)
--   chu_tri 1134  'Uy th'                        -> ?
--   chu_tri 1463  'T tinh'                       -> ?
--   chu_tri 1580  'Thiếu'                        -> ?
--   chu_tri 2098  'Tiên lưu sản'                 -> 'Tiên triệu lưu sản'?
--   chu_tri 2123  'Đàm đầu thống'                -> 'Đàm quyết đầu thống'?
--   chu_tri 2515  'Đi đả tổn thương'             -> 'Điệt đả tổn thương'?
--   chu_tri 2845  'Lạc nh'                       -> ?
--   chu_tri 2864  'Khí hư huyết'                 -> 'Khí hư huyết ứ'?
--   chu_tri 2982  'Đi đả thương'                 -> 'Điệt đả thương'?
--   chu_tri 2989  đã sửa thành 'Bệnh Behçet'
--   chu_tri 3423  'Ma mộc thán'                  -> ?
--   cong_dung 524 'Nhiếp t'                      -> ?
--   cong_dung 644 'Tiệt n'                       -> ?
--
-- HOÀN NGUYÊN nếu cần:
--   begin;
--   update phuong_thang p set ghi_chu = b.ghi_chu, thanh_phan = b.thanh_phan,
--          thanh_phan_raw = b.thanh_phan_raw, xuat_xu = b.xuat_xu,
--          tac_dung = b.tac_dung, cach_dung = b.cach_dung
--     from phuong_thang_bak_rac_20260918 b where b.id = p.id;
--   -- tương tự cho cong_dung / chu_tri / nguon / vi_thuoc
--   commit;
-- =====================================================================
