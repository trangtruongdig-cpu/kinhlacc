-- =====================================================================
-- GỘP BẢN GHI TRÙNG TRONG BẢNG TỪ VỰNG cong_dung
-- ---------------------------------------------------------------------
-- Chạy SAU backend/sql/dich-chu-han-lan-tieng-viet.sql
--   psql "$DATABASE_URL?sslmode=require" -f backend/sql/gop-cong-dung-trung-sau-dich.sql
--
-- Các bản ghi còn chữ Hán vốn là BẢN TRÙNG của bản đã có sẵn dạng tiếng
-- Việt ("Tán hàn止痛" và "Tán hàn chỉ thống" là một). Dịch xong thì trùng
-- lộ ra: 5 cụm, 11 bản ghi.
--
-- Luật gộp: giữ bản ghi có NHIỀU liên kết vị thuốc nhất (bản gốc được
-- dùng thật), dồn liên kết của bản thừa sang đó, rồi xoá bản thừa.
--   giữ 211 (bài nùng) — 937 chỉ khác hoa/thường, cùng 1 liên kết
--   giữ 733 (hóa đàm chỉ khái, 4)   xoá 1059 (0)
--   giữ 700 (súc liễm chỉ huyết, 5) xoá 747 (1)
--   giữ 603 (tán hàn chỉ thống, 11) xoá 962 (2), 1058 (0)
--   giữ 857 (trợ dương chỉ tả, 1)   xoá 964 (1)
-- =====================================================================

\pset pager off
\timing on

begin;

create table if not exists cong_dung_bak_gop_20260918 as select * from cong_dung;
create table if not exists vi_thuoc_cong_dung_bak_gop_20260918 as select * from vi_thuoc_cong_dung;

-- Bảng gộp: bản thừa -> bản giữ
create temp table gop (thua int, giu int);
insert into gop (thua, giu) values
  (937, 211),    -- Bài nùng
  (1059, 733),   -- Hóa đàm chỉ khái
  (747, 700),    -- Súc liễm chỉ huyết
  (962, 603),    -- Tán hàn chỉ thống
  (1058, 603),
  (964, 857);    -- Trợ dương chỉ tả

-- 1. Dồn liên kết sang bản giữ, bỏ những cặp đã tồn tại để không vi phạm khoá
delete from vi_thuoc_cong_dung v
using gop g
where v.id_cong_dung = g.thua
  and exists (select 1 from vi_thuoc_cong_dung x
              where x.id_vi_thuoc = v.id_vi_thuoc and x.id_cong_dung = g.giu);

update vi_thuoc_cong_dung v
set id_cong_dung = g.giu
from gop g
where v.id_cong_dung = g.thua;

-- 2. Xoá bản ghi từ vựng thừa
delete from cong_dung where id in (select thua from gop);

-- ---------------------------------------------------------------------
-- KIỂM CHỨNG
-- ---------------------------------------------------------------------
\echo
\echo '=== Còn bản ghi trùng trong cong_dung? (phải rỗng) ================'
\echo

select lower(ten_cong_dung) as ten, count(*), string_agg(id::text, ', ' order by id) as cac_id
from cong_dung group by lower(ten_cong_dung) having count(*) > 1 order by 2 desc limit 10;

\echo
\echo '=== Không mất liên kết: tổng liên kết trước/sau ==================='
\echo

select (select count(*) from vi_thuoc_cong_dung_bak_gop_20260918) as truoc,
       (select count(*) from vi_thuoc_cong_dung) as sau,
       (select count(*) from vi_thuoc_cong_dung_bak_gop_20260918) - (select count(*) from vi_thuoc_cong_dung) as chenh_lech_do_trung_lap;

\echo
\echo '=== Các bản ghi giữ lại và số liên kết sau khi dồn ================'
\echo

select c.id, c.ten_cong_dung,
       (select count(*) from vi_thuoc_cong_dung v where v.id_cong_dung = c.id) as so_lien_ket
from cong_dung c where c.id in (211, 733, 700, 603, 857) order by c.id;

commit;
