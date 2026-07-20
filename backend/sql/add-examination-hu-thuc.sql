-- Thêm cột "huThuc" cho ca khám: cương Hư-Thực ĐỘC LẬP (biên độ/diện rộng phản ứng toàn thân),
-- KHÔNG còn gắn với Khí/Huyết chi trên/chi dưới (2 cột đó giữ nguyên, chỉ đổi vai trò hiển thị
-- sang tham khảo). Xem công thức đầy đủ ở meridian.controller.ts's analyze().
-- Chạy thủ công sau khi backup DB (cũng tự áp dụng qua SchemaBootstrapService khi backend khởi động).

ALTER TABLE examinations ADD COLUMN IF NOT EXISTS "huThuc" VARCHAR(50);
