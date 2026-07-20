-- Thêm cột "donThuoc" (jsonb) vào bảng examinations: lưu ĐƠN THUỐC TÙY CHỈNH
-- (thang đặc trị) cho mỗi ca khám — song song với cột "chanDoan".
-- Cột đặt camelCase (khớp entity Examination, không dùng naming-strategy snake_case)
-- nên PHẢI để trong ngoặc kép. Chạy an toàn nhiều lần nhờ IF NOT EXISTS.
ALTER TABLE examinations
  ADD COLUMN IF NOT EXISTS "donThuoc" jsonb;
