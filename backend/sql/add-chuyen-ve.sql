-- Chuyển vé sang ca khác (29/09/2026).
-- SchemaBootstrapService tự chạy đúng các lệnh này mỗi lần khởi động; file này để ghi sổ
-- và để chạy tay khi cần.
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS "movedToId"   INTEGER;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS "movedToDate" DATE;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS "movedToTime" TIME;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS "movedFromId" INTEGER;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS "movedAt"     TIMESTAMPTZ;

ALTER TABLE appointment_bookings DROP CONSTRAINT IF EXISTS appointment_bookings_status_check;
ALTER TABLE appointment_bookings ADD CONSTRAINT appointment_bookings_status_check
  CHECK (status IN ('BOOKED', 'CANCELLED', 'COMPLETED', 'MOVED'));
