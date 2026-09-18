-- =====================================================================
-- GỘP CÁC NGUỒN TRÙNG NHAU CHỈ KHÁC DẤU CÂU
-- ---------------------------------------------------------------------
-- Chạy:
--   psql "$DATABASE_URL?sslmode=require" -f backend/sql/gop-nguon-trung-dau-cau.sql
--
-- Sổ cái có 42 bản ghi là cùng một cuốn sách, khác nhau đúng ở dấu gạch
-- hoặc dấu phẩy — người nhập mỗi lần đánh một kiểu:
--   Tam Nhân Cực - Bệnh Chứng Phương Luận
--   Tam Nhân Cực – Bệnh Chứng Phương Luận
--   Tam Nhân Cực-Bệnh Chứng Phương Luận
--   Tam Nhân Cực–Bệnh Chứng Phương Luận
--   Tam Nhân Cực –Bệnh Chứng Phương Luận
-- Mỗi biến thể là một mục từ riêng, nên Thư Mục Nguồn hiện 5 dòng cho
-- một cuốn và phần "bài thuốc trích nguồn này" bị xé thành 5 mảnh.
--
-- LUẬT GỘP: trong mỗi nhóm (chuẩn hoá mạnh: bỏ dấu thanh + mọi dấu câu),
-- giữ bản ghi được TRÍCH NHIỀU NHẤT; bằng điểm thì giữ id nhỏ nhất.
-- Tên các biến thể được dồn vào ten_khac của bản giữ, nên tra cứu theo
-- cách viết cũ vẫn tìm ra (backend tra cả ten_khac).
--
-- Dữ liệu cũ KHÔNG mất: mọi liên kết huyệt / vị thuốc / bài thuốc của bản
-- thừa được chuyển sang bản giữ trước khi xoá.
-- =====================================================================

\pset pager off
\timing on

begin;

create table if not exists nguon_bak_gop_20260918 as select * from nguon;
create table if not exists nguon_phuong_thang_bak_gop_20260918 as select * from nguon_phuong_thang;
create table if not exists nguon_vi_thuoc_bak_gop_20260918 as select * from nguon_vi_thuoc;
create table if not exists nguon_huyet_bak_gop_20260918 as select * from nguon_huyet;

create or replace function pg_temp.norm(t text) returns text language sql immutable as $$
  select regexp_replace(
    lower(normalize(replace(replace(coalesce(t, ''), 'Đ', 'D'), 'đ', 'd'), NFD)),
    '[^a-z0-9]+', '', 'g')
$$;

-- ---------------------------------------------------------------------
-- 1. Xác định nhóm trùng và bản ghi được giữ
-- ---------------------------------------------------------------------
create temp table diem as
select n.id, pg_temp.norm(n.ten) as k, n.ten,
       (select count(*) from nguon_phuong_thang x where x.nguon_id = n.id)
     + (select count(*) from nguon_vi_thuoc y where y.nguon_id = n.id)
     + (select count(*) from nguon_huyet z where z.nguon_id = n.id) as do_trich
from nguon n;

create temp table gop as
select d.id as thua, g.giu
from diem d
join (
  select k, (array_agg(id order by do_trich desc, id))[1] as giu
  from diem group by k having count(*) > 1
) g on g.k = d.k
where d.id <> g.giu;

\echo
\echo '=== Sẽ gộp bao nhiêu bản ghi ======================================='
\echo

select count(*) as ban_ghi_thua, count(distinct giu) as nhom_trung from gop;

-- ---------------------------------------------------------------------
-- 2. Dồn tên biến thể vào ten_khac của bản giữ (để tra cứu cách viết cũ)
-- ---------------------------------------------------------------------
update nguon n
set ten_khac = btrim(
      concat_ws(' | ', nullif(btrim(coalesce(n.ten_khac, '')), ''), t.ten_thua), ' |')
from (
  select g.giu, string_agg(distinct d.ten, ' | ') as ten_thua
  from gop g join diem d on d.id = g.thua
  group by g.giu
) t
where n.id = t.giu;

-- ---------------------------------------------------------------------
-- 3. Chuyển liên kết sang bản giữ (bỏ trước những cặp sẽ trùng khoá)
-- ---------------------------------------------------------------------
delete from nguon_phuong_thang v using gop g
where v.nguon_id = g.thua
  and exists (select 1 from nguon_phuong_thang x
              where x.nguon_id = g.giu and x.phuong_thang_id = v.phuong_thang_id and x.context = v.context);
update nguon_phuong_thang v set nguon_id = g.giu from gop g where v.nguon_id = g.thua;

delete from nguon_vi_thuoc v using gop g
where v.nguon_id = g.thua
  and exists (select 1 from nguon_vi_thuoc x
              where x.nguon_id = g.giu and x.vi_thuoc_id = v.vi_thuoc_id and x.context = v.context);
update nguon_vi_thuoc v set nguon_id = g.giu from gop g where v.nguon_id = g.thua;

delete from nguon_huyet v using gop g
where v.nguon_id = g.thua
  and exists (select 1 from nguon_huyet x where x.nguon_id = g.giu and x.huyet_id = v.huyet_id);
update nguon_huyet v set nguon_id = g.giu from gop g where v.nguon_id = g.thua;

-- ---------------------------------------------------------------------
-- 4. Xoá bản ghi thừa
-- ---------------------------------------------------------------------
delete from nguon where id in (select thua from gop);

-- ---------------------------------------------------------------------
-- 5. KIỂM CHỨNG
-- ---------------------------------------------------------------------
\echo
\echo '=== Còn nhóm trùng nào không (phải rỗng) =========================='
\echo

select pg_temp.norm(ten) as k, count(*), string_agg(ten, ' | ' order by id) as cac_ten
from nguon group by 1 having count(*) > 1 limit 10;

\echo
\echo '=== Sổ nguồn và liên kết trước/sau ================================'
\echo

select (select count(*) from nguon_bak_gop_20260918) as nguon_truoc,
       (select count(*) from nguon) as nguon_sau,
       (select count(*) from nguon_phuong_thang_bak_gop_20260918) as lk_bai_truoc,
       (select count(*) from nguon_phuong_thang) as lk_bai_sau,
       (select count(*) from nguon_vi_thuoc_bak_gop_20260918) as lk_vi_truoc,
       (select count(*) from nguon_vi_thuoc) as lk_vi_sau,
       (select count(*) from nguon_huyet_bak_gop_20260918) as lk_huyet_truoc,
       (select count(*) from nguon_huyet) as lk_huyet_sau;

\echo
\echo '=== Các mục sau khi gộp (nhiều biến thể nhất) ======================'
\echo

select n.ten, left(coalesce(n.ten_khac, ''), 90) as ten_khac_da_don,
       (select count(*) from nguon_phuong_thang x where x.nguon_id = n.id) as so_lk_bai
from nguon n
where n.id in (select distinct giu from gop)
order by length(coalesce(n.ten_khac, '')) desc
limit 8;

commit;
