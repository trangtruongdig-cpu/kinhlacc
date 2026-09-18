-- =====================================================================
-- LÀM SẠCH D5 (mojibake) + D6 (TCVN3) TRONG HỒ SƠ KHÁM & BỆNH NHÂN
-- ---------------------------------------------------------------------
-- Đi kèm: backend/sql/audit-rac-tu-dien.sql  (chạy trước/sau để đối chiếu)
--         backend/sql/clean-rac-legacy-tu-dien.sql  (đã xử lý phần từ điển)
--
-- Chạy:
--   psql "$DATABASE_URL?sslmode=require" -f backend/sql/clean-mojibake-tcvn3-ho-so.sql
--
-- ĐÂY LÀ DỮ LIỆU BỆNH NHÂN THẬT. Nguyên tắc áp dụng:
--   * chỉ CHUYỂN MÃ, không "đoán" thêm chữ người nhập bỏ sót
--     (giữ "Dịc", "Too", "nGOC kHÁNH" y nguyên — đó là lỗi đánh máy
--      của người dùng, không phải lỗi mã hoá)
--   * sửa tường minh theo id, không sửa hàng loạt bằng suy đoán
--   * sao lưu 2 bảng trước khi ghi, tất cả trong một transaction
--
-- D5 mojibake: UTF-8 bị đọc như Latin-1. Quét 312 bản ghi
--     examinations.notes cho thấy CHỈ hỏng đúng một cụm: prefix
--     "Triệu chứng" do đợt nhập dữ liệu cũ (ngày khám 2008–2025) sinh ra.
--     Code hiện tại (frontend/src/views/NewExaminationView.vue:203) ghi
--     prefix này ĐÚNG UTF-8, nên lỗi không tái sinh.
--
-- D6 TCVN3: bảng mã font ABC/VnTime cũ, các mã dùng ở đây:
--     Ô = ễ   ä = ọ   Þ = ị   ô = ụ   ® = đ   å = ồ
--     và Ð (U+00D0 Eth) bị dùng thay cho Đ (U+0110).
-- =====================================================================

\pset pager off
\timing on

begin;

-- ---------------------------------------------------------------------
-- 0. SAO LƯU
-- ---------------------------------------------------------------------
create table if not exists examinations_bak_mojibake_20260918 as
  select id, notes from examinations where notes is not null;
create table if not exists patients_bak_tcvn3_20260918 as
  select * from patients where id in (319, 3684, 3685, 5148);

-- ---------------------------------------------------------------------
-- 1. D5 — prefix "Triệu chứng" trong hồ sơ khám (312 bản ghi)
-- ---------------------------------------------------------------------
update examinations
set notes = replace(notes, 'Triá»‡u chá»©ng', 'Triệu chứng')
where notes like '%Triá»‡u chá»©ng%';

-- ---------------------------------------------------------------------
-- 2. D6 — TCVN3 và Ð/Đ trong bảng bệnh nhân (4 bản ghi)
-- ---------------------------------------------------------------------

-- 3684: "NguyÔn Ngäc Bich" -> Ô=ễ, ä=ọ  ("Bich" giữ nguyên, người nhập
--       vốn không đánh dấu)
update patients set "fullName" = 'Nguyễn Ngọc Bich'
where id = 3684 and "fullName" = 'NguyÔn Ngäc Bich';

-- 3684: "DÞc vô ®ång mai" -> Þ=ị, ô=ụ, ®=đ, å=ồ
update patients set address = 'Dịc vụ đồng mai'
where id = 3684 and address = 'DÞc vô ®ång mai';

-- 3685: "Too 1 ®ång mai" -> ®=đ, å=ồ
update patients set address = 'Too 1 đồng mai'
where id = 3685 and address = 'Too 1 ®ång mai';

-- 5148: Ð (U+00D0 Eth) -> Đ (U+0110)
update patients set "fullName" = 'Đỗ Văn Hưởng'
where id = 5148 and "fullName" = 'Ðỗ Văn Hưởng';

-- 319: mojibake "mÃ" -> "mã"  (phần "nGOC kHÁNH" là caps của người nhập)
update patients set address = replace(address, 'mÃ', 'mã')
where id = 319 and address like '%mÃ%';

-- KHÔNG sửa: patients 3193, cột phone chứa "0984825476  Ô XÃ".
-- "Ô XÃ" không suy được chắc chắn (có thể "Ở XÃ"), lại nằm ở cột điện
-- thoại nên không ảnh hưởng hiển thị tên/địa chỉ. Để người dùng tự đối
-- chiếu sổ giấy.

-- ---------------------------------------------------------------------
-- 3. KIỂM CHỨNG
-- ---------------------------------------------------------------------
\echo
\echo '=== D5: còn mojibake trong examinations.notes (phải 0) ============'
\echo

select count(*) as con_mojibake from examinations
where notes like '%Ã%' or notes like '%á»%' or notes like '%â€%';

\echo
\echo '=== D5: đối chiếu trước/sau, 3 bản ghi mẫu ========================'
\echo

select e.id, left(b.notes, 42) as truoc, left(e.notes, 42) as sau
from examinations e join examinations_bak_mojibake_20260918 b using (id)
where b.notes is distinct from e.notes
order by e.id limit 3;

\echo
\echo '=== D5: tổng số hồ sơ đã sửa ======================================'
\echo

select count(*) as so_ho_so_da_sua
from examinations e join examinations_bak_mojibake_20260918 b using (id)
where b.notes is distinct from e.notes;

\echo
\echo '=== D6: đối chiếu trước/sau bảng bệnh nhân ========================'
\echo

select p.id, b."fullName" as ten_truoc, p."fullName" as ten_sau,
       b.address as dia_chi_truoc, p.address as dia_chi_sau
from patients p join patients_bak_tcvn3_20260918 b using (id)
order by p.id;

commit;
