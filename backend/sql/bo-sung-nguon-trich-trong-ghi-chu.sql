-- =====================================================================
-- BỔ SUNG NGUỒN ĐƯỢC TRÍCH TRONG GHI CHÚ + GẮN LIÊN KẾT TRA CỨU
-- ---------------------------------------------------------------------
-- Chạy:
--   psql "$DATABASE_URL?sslmode=require" -f backend/sql/bo-sung-nguon-trich-trong-ghi-chu.sql
--
-- VẤN ĐỀ: nội dung ghi_chu của 13.942 bài thuốc trích 798 cụm nguồn khác
-- nhau trong ngoặc đơn, nhưng sổ cái nguon chỉ khớp 373. Những sách được
-- trích NHIỀU NHẤT lại chưa có mục từ, nên người đọc bấm vào không đi đâu:
--   Cổ Đại Bổ Thận Tráng Dương Danh Phương   290 lần
--   Kim Quỹ Yếu Lược Thang Chứng Luận Trị    202
--   Trung Hoa Danh Y Phương Tễ Đại Toàn      135
--   Trung Y Vạn Đại Danh Phương Tập Thành    118
--   Phương Tễ Học Giảng Nghĩa                 65 (+26 lần bản sai chính tả)
--   Thành Đô Phương Tễ Học                    37
--
-- File này làm 2 việc:
--   1. Thêm 26 nguồn còn thiếu (đã lọc tay khỏi 33 ứng viên tự động: bỏ
--      "Cam thảo + Hoạt thạch", "Khung, Quy, Thục, Thược", "Trung Quốc"…
--      vì đó là tên vị thuốc / cụm quá chung, không phải sách)
--   2. Gắn liên kết nguon_phuong_thang với context 'ghi_chu' cho MỌI nguồn
--      (cũ và mới) được trích trong ghi_chu — trước đây chỉ gắn 'xuat_xu'
--      và 'tac_gia', nên trang nguồn không biết bài nào tham chiếu tới nó
--      trong phần bàn luận.
--
-- Khớp tên theo chuẩn hoá MẠNH (bỏ dấu thanh và mọi dấu câu) để các biến
-- thể "Tam Nhân Cực - …" / "Tam Nhân Cực–…" cùng trỏ về một mục.
-- =====================================================================

\pset pager off
\timing on

begin;

create table if not exists nguon_bak_bosung_20260918 as select * from nguon;
create table if not exists nguon_phuong_thang_bak_bosung_20260918 as select * from nguon_phuong_thang;

-- Chuẩn hoá mạnh: bỏ dấu thanh, đ->d, bỏ mọi ký tự không phải chữ/số
create or replace function pg_temp.norm(t text) returns text language sql immutable as $$
  select regexp_replace(
    lower(normalize(replace(replace(coalesce(t, ''), 'Đ', 'D'), 'đ', 'd'), NFD)),
    '[^a-z0-9]+', '', 'g')
$$;

-- fold: như hàm fold() trong backend/src/controllers/nguon.controller.ts
-- (bỏ dấu, đ->d, hạ thường, gộp khoảng trắng) — dùng sinh norm_key/slug.
-- PHẢI xoá dấu thanh tổ hợp TRƯỚC, rồi mới gộp khoảng trắng: làm ngược lại
-- thì mỗi dấu thanh biến thành một khoảng trắng và "Cổ Đại" ra "co da i".
create or replace function pg_temp.fold(t text) returns text language sql immutable as $$
  select btrim(regexp_replace(
    regexp_replace(
      lower(normalize(replace(replace(coalesce(t, ''), 'Đ', 'D'), 'đ', 'd'), NFD)),
      '[^a-z0-9 ]', '', 'g'),     -- xoá dấu thanh tổ hợp và dấu câu
    ' +', ' ', 'g'))              -- gộp khoảng trắng
$$;

-- ---------------------------------------------------------------------
-- 1. THÊM 26 NGUỒN CÒN THIẾU
--    Cột 2 (ten_khac) dùng cho biến thể chính tả gặp trong dữ liệu; backend
--    tra cứu đọc cả ten_khac nên biến thể vẫn link về đúng mục.
-- ---------------------------------------------------------------------
create temp table nguon_moi (ten text, ten_khac text);
insert into nguon_moi (ten, ten_khac) values
  ('Cổ Đại Bổ Thận Tráng Dương Danh Phương', null),
  ('Kim Quỹ Yếu Lược Thang Chứng Luận Trị', null),
  ('Trung Hoa Danh Y Phương Tễ Đại Toàn', null),
  ('Trung Y Vạn Đại Danh Phương Tập Thành', null),
  ('Phương Tễ Học Giảng Nghĩa', 'Phương Tễ Học Giảng Nghiã'),
  ('Thành Đô Phương Tễ Học', null),
  ('Sổ Tay Các Bài Thuốc Thường Dùng', null),
  ('Sổ Tay Những Bài Thuốc Thường Dùng', null),
  ('Phụ Khoa Trung Y Học', null),
  ('Thương Hàn Nhập Môn', null),
  ('Trung Y Phương Tễ Đại Từ Điển', null),
  ('Phó Thanh Chủ Nữ Khoa', null),
  ('Giản Minh Trung Y Phụ Khoa Học', null),
  ('Tụ Trân Phương', null),
  ('Nội Khoa Học Thượng Hải', null),
  ('Thiên Kim Phương Diễn Nghĩa', null),
  ('Tạp Loại Danh Phương', null),
  ('Chính Nhân Mạch Trị', null),
  ('Thiên Kim Phương Giảng Nghĩa', null),
  ('Thương Hàn Tiêu Bản', null),
  ('Bản Sự Phương Thích Nghĩa', null),
  ('Bản Thảo Kinh Sơ', null),
  ('Trung Y Vạn Đại Danh Phương Đại Toàn', null),
  ('Thiên Kim Yếu Phương', null),
  ('Thương Hàn Kinh Chú', null),
  -- Bộ sách của Hải Thượng Lãn Ông: trong ghi_chu thường ghi ghép
  -- "Châu Ngọc Cách Ngôn – Hải Thượng Y Tôn Tâm Lĩnh" nên cả cụm không khớp,
  -- nhưng riêng tên bộ sách thì cần có mục từ.
  ('Hải Thượng Y Tôn Tâm Lĩnh', null);

insert into nguon (ten, slug, loai, norm_key, ten_khac)
select m.ten,
       replace(pg_temp.fold(m.ten), ' ', '-'),
       'sach',
       pg_temp.fold(m.ten),
       m.ten_khac
from nguon_moi m
where not exists (select 1 from nguon n where pg_temp.norm(n.ten) = pg_temp.norm(m.ten))
  and not exists (select 1 from nguon n where n.slug = replace(pg_temp.fold(m.ten), ' ', '-'));

-- ---------------------------------------------------------------------
-- 2. GẮN LIÊN KẾT 'ghi_chu': nguồn nào được trích trong ghi chú bài nào
--    Trích cụm trong ngoặc đơn rồi đối khớp theo chuẩn hoá mạnh — nhanh và
--    chính xác hơn LIKE trên toàn văn, lại không bắt nhầm "(30g)".
-- ---------------------------------------------------------------------
-- Lấy cả cụm nguyên VÀ từng phần khi nguồn được ghi ghép bằng gạch ngang
-- ("Châu Ngọc Cách Ngôn – Hải Thượng Y Tôn Tâm Lĩnh" = thiên – bộ sách):
-- cả cụm thường không có mục từ, nhưng từng phần thì có.
create temp table cum_trich as
with cum as (
  select p.id as phuong_thang_id, btrim(m[1]) as ten
  from phuong_thang p,
       regexp_matches(coalesce(p.ghi_chu, ''), '\(([^()]{4,140})\)', 'g') m
  where length(btrim(m[1])) >= 4
)
select distinct phuong_thang_id, pg_temp.norm(ten) as k from cum
union
select distinct c.phuong_thang_id, pg_temp.norm(btrim(p)) as k
from cum c, unnest(regexp_split_to_array(c.ten, '\s*[–-]\s*')) p
where length(btrim(p)) >= 4;

create temp table nguon_khoa as
select id as nguon_id, pg_temp.norm(ten) as k from nguon where ten is not null
union
select id, pg_temp.norm(tk) from nguon, unnest(string_to_array(coalesce(ten_khac, ''), ' | ')) tk
where length(btrim(tk)) >= 4;

insert into nguon_phuong_thang (nguon_id, phuong_thang_id, context)
select distinct nk.nguon_id, ct.phuong_thang_id, 'ghi_chu'
from cum_trich ct
join nguon_khoa nk using (k)
where not exists (
  select 1 from nguon_phuong_thang x
  where x.nguon_id = nk.nguon_id and x.phuong_thang_id = ct.phuong_thang_id and x.context = 'ghi_chu'
);

-- ---------------------------------------------------------------------
-- 3. KIỂM CHỨNG
-- ---------------------------------------------------------------------
\echo
\echo '=== Sổ nguồn trước/sau ============================================'
\echo

select (select count(*) from nguon_bak_bosung_20260918) as truoc,
       (select count(*) from nguon) as sau,
       (select count(*) from nguon) - (select count(*) from nguon_bak_bosung_20260918) as them_moi;

\echo
\echo '=== Liên kết trích dẫn theo ngữ cảnh ==============================='
\echo

select context, count(*) as so_lien_ket, count(distinct nguon_id) as so_nguon,
       count(distinct phuong_thang_id) as so_bai
from nguon_phuong_thang group by context order by 2 desc;

\echo
\echo '=== Độ phủ: cụm nguồn trong ghi_chu đã tra được bao nhiêu =========='
\echo

with cum as (
  select btrim(m[1]) as ten, count(*) as lan
  from phuong_thang, regexp_matches(coalesce(ghi_chu, ''), '\(([^()]{4,140})\)', 'g') m
  group by btrim(m[1])
)
select count(*) as cum_khac_nhau,
       sum(lan) as tong_lan_trich,
       count(*) filter (where exists (select 1 from nguon_khoa nk where nk.k = pg_temp.norm(cum.ten))) as cum_tra_duoc,
       sum(lan) filter (where exists (select 1 from nguon_khoa nk where nk.k = pg_temp.norm(cum.ten))) as lan_tra_duoc
from cum;

\echo
\echo '=== 26 nguồn vừa thêm: đã gắn được bao nhiêu bài ==================='
\echo

select n.ten, n.slug,
       (select count(*) from nguon_phuong_thang x where x.nguon_id = n.id and x.context = 'ghi_chu') as so_bai_trich
from nguon n
join nguon_moi m on pg_temp.norm(m.ten) = pg_temp.norm(n.ten)
order by 3 desc;

commit;
