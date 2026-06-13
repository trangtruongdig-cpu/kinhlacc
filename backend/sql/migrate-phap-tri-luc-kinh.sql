-- Bảng pháp trị: thêm cột luc_kinh (Lục kinh — phân loại theo Thương Hàn Luận).
-- Lưu text tự do, ví dụ: "Thái dương", "Dương minh", "Thiếu dương", "Thái âm", "Thiếu âm", "Quyết âm".
-- Chạy sau migrate-phap-tri-tcm-bang-columns.sql.

ALTER TABLE phap_tri ADD COLUMN IF NOT EXISTS luc_kinh TEXT;
