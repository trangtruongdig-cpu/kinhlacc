-- Cờ chống gửi trùng cho AppointmentReminderService (nhắc trước 1h / 30p / 15p).
--
-- BỐI CẢNH: 3 cột này đã được ALTER thẳng lên DB production mà không ghi lại vào repo, nên
-- code và backend/sql/ lệch nhau. File này chép lại đúng hiện trạng để môi trường dựng mới
-- không gãy. Idempotent — chạy lại nhiều lần vô hại.
--
-- Kiểm tra sau khi chạy:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'appointment_slots' AND column_name LIKE 'reminded%';

ALTER TABLE appointment_slots
  ADD COLUMN IF NOT EXISTS "reminded1h"  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "reminded30m" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "reminded15m" boolean NOT NULL DEFAULT false;
