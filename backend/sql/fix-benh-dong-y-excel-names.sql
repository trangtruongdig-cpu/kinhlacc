-- Sửa lỗi chính tả tên thể bệnh trong engine chẩn đoán đo kinh lạc (bảng benh_dong_y_excel).
--
-- Chỉ sửa cột `name` (tên hiển thị). GIỮ NGUYÊN cột `code` — đó là định danh nội bộ,
-- các bảng quan hệ (benh_dong_y_excel_phap_tri, ..._bai_thuoc, ..._trieu_chung) tham
-- chiếu theo id, nên đổi code là không cần thiết và dễ gây lệch dữ liệu.
--
-- DB lưu chữ thường (sentence case) như mọi tên khác; Title Case ("Can Dương Thượng
-- Cang", "Đởm Nhiệt") do CSS `text-transform: capitalize` lo ở giao diện — giống phần mềm.
--
--   "Can dương thượng sang" -> "Can dương thượng cang"
--   "Đảm nhiệt"             -> "Đởm nhiệt"

-- Tiền đề: bảng có trigger BEFORE UPDATE gán NEW.updated_at = NOW(); nếu cột updated_at
-- chưa tồn tại thì MỌI lệnh UPDATE đều lỗi. Bổ sung cột (idempotent) trước khi sửa tên.
ALTER TABLE benh_dong_y_excel
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE benh_dong_y_excel SET name = 'Can dương thượng cang' WHERE code = 'can_duong_thuong_sang';
UPDATE benh_dong_y_excel SET name = 'Đởm nhiệt'             WHERE code = 'dam_nhiet';
