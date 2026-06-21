-- Thêm cột "tác dụng" cho huyệt vị: mô tả huyệt này dùng để làm gì.
-- Dùng để in vào phiếu kết quả cho bệnh nhân tự day bấm tại nhà.
-- Chạy thủ công sau khi backup DB.

ALTER TABLE huyet_vi ADD COLUMN IF NOT EXISTS tac_dung TEXT;
