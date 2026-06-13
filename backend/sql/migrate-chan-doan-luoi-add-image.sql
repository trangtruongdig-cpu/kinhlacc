-- Thêm cột ảnh lưỡi và kết quả AI vào bảng chan_doan_luoi
ALTER TABLE chan_doan_luoi ADD COLUMN IF NOT EXISTS anh_luoi TEXT;
ALTER TABLE chan_doan_luoi ADD COLUMN IF NOT EXISTS ket_qua_ai TEXT;
