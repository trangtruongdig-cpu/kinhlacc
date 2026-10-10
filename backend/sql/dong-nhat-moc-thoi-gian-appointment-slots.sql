-- Đồng nhất kiểu mốc thời gian của appointment_slots với appointment_bookings.
-- ĐÃ CHẠY trên production 10/10/2026.
--
-- Vì sao: `appointment_slots."createdAt"/"updatedAt"` là `timestamp WITHOUT time zone` còn
-- `appointment_bookings` là `WITH`. Hai bảng của CÙNG một nghiệp vụ, hai hệ quy chiếu — mọi phép
-- so hoặc sắp xếp trộn hai bảng lệch 7 giờ. Một truy vấn chẩn đoán đã trả về 0 dòng vì đúng lý
-- do này mà không báo lỗi gì; và comment đầu lớp AppointmentBooking từng khẳng định hai bảng
-- "khớp nhau", điều đó SAI.
--
-- ⚠️ ĐO LẠI trước khi chạy ở bất kỳ môi trường nào khác. Câu USING dưới đây chỉ đúng khi giá trị
-- đang lưu là UTC. Phép đo 10/10/2026 trên production: max(slots) = 13:29:00 (trần) so với
-- now() = 14:07:17+00 → lệch 0,64 giờ, tức ĐANG LÀ UTC. Nếu lệch đúng ~7 giờ thì giá trị là giờ
-- VN và câu này sẽ đẩy toàn bộ mốc lịch hẹn sai 7 tiếng.
--
-- ⚠️ SAO LƯU trước (xem backend/sql/README.md):
--   CREATE TABLE IF NOT EXISTS appointment_slots_moc_backup AS
--     SELECT id, "createdAt", "updatedAt" FROM appointment_slots;
-- Nghiệm thu đã chạy: 513/513 dòng, giá trị giữ nguyên từng micro giây sau khi đổi kiểu.
-- Dọn bảng sao lưu khi đã yên tâm: DROP TABLE appointment_slots_moc_backup;

ALTER TABLE appointment_slots
  ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';
