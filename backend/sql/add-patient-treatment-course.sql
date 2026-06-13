-- Thêm "liệu trình" (treatment course) cho bệnh nhân.
--
-- Mô hình (Cách B):
--   * treatmentTarget       — số buổi MỤC TIÊU của liệu trình hiện tại (NULL = chưa thiết lập).
--   * treatmentCourseStart  — ngày BẮT ĐẦU liệu trình hiện tại.
--
-- "Số buổi đã trị" KHÔNG lưu trong bảng này: nó được ĐẾM động từ bảng
-- appointment_slots (số vé có status = 'COMPLETED' và slotDate >= treatmentCourseStart).
-- Nhờ vậy mỗi lần "Hoàn thành" một vé bên phần Đặt Lịch là số buổi tự tăng,
-- và khi bắt đầu liệu trình mới (đổi treatmentCourseStart = hôm nay) thì đếm lại từ đầu.
--
-- An toàn khi chạy lại nhiều lần (IF NOT EXISTS). Không xoá / không sửa dữ liệu cũ.
-- Cột dùng camelCase (có nháy kép) để khớp convention TypeORM của bảng patients.

BEGIN;

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS "treatmentTarget" INT,
  ADD COLUMN IF NOT EXISTS "treatmentCourseStart" DATE;

COMMENT ON COLUMN patients."treatmentTarget"
  IS 'Số buổi mục tiêu của liệu trình hiện tại (NULL = chưa thiết lập liệu trình)';
COMMENT ON COLUMN patients."treatmentCourseStart"
  IS 'Ngày bắt đầu liệu trình hiện tại; chỉ đếm buổi COMPLETED kể từ ngày này';

COMMIT;
