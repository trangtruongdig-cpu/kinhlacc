-- Tạo bảng ton_thuong_tac_nhan (trước đây là enum "Lục kinh" hardcoded ở frontend).
-- Bảng chứa danh mục các "Tổn thương - Tác nhân" để chọn khi tạo / sửa pháp trị.
-- Giá trị được lưu vào cột phap_tri.luc_kinh (TEXT, có thể nhiều, cách nhau bằng ", ") — không thay đổi schema bảng phap_tri.

CREATE TABLE IF NOT EXISTS ton_thuong_tac_nhan (
  id SERIAL PRIMARY KEY,
  ten VARCHAR(255) NOT NULL UNIQUE,
  ghi_chu TEXT
);

-- Migration cho bản trước đó đã tạo bảng với cột `thu_tu` (đổi sang `ghi_chu`).
DROP INDEX IF EXISTS idx_ton_thuong_tac_nhan_thu_tu;
ALTER TABLE ton_thuong_tac_nhan ADD COLUMN IF NOT EXISTS ghi_chu TEXT;
ALTER TABLE ton_thuong_tac_nhan DROP COLUMN IF EXISTS thu_tu;

-- Seed các giá trị enum hiện tại trong TreatmentsView (LUC_KINH_OPTIONS).
INSERT INTO ton_thuong_tac_nhan (ten, ghi_chu) VALUES
  ('Thái Dương Kinh Chứng', NULL),
  ('Dương Minh Kinh Chứng', NULL),
  ('Thiếu Dương Kinh Chứng', NULL),
  ('Thái Âm Kinh Chứng', NULL),
  ('Quyết Âm Kinh Chứng', NULL),
  ('Thiếu Âm Kinh Chứng', NULL),
  ('Vệ Phận', NULL),
  ('Khí Phận', NULL),
  ('Dinh Phận', NULL),
  ('Huyết Phận', NULL)
ON CONFLICT (ten) DO NOTHING;
