-- Tách LƯỢT ĐẶT khỏi Ô GIỜ: bảng appointment_bookings.
--
-- VÌ SAO: appointment_slots.patientId bị GHI ĐÈ khi ô giờ được đặt lại. Chị A đặt 9h rồi huỷ
-- (cancel() giữ nguyên patientId ở trạng thái CANCELLED), anh B đặt đúng ô đó (book() nhận cả
-- slot CANCELLED) -> lượt đặt của chị A biến mất khỏi /appointment-slots/my (lọc theo patientId)
-- và phòng khám mất bằng chứng ai từng đặt / ai từng huỷ.
--
-- Từ nay: ô giờ giữ TRẠNG THÁI HIỆN TẠI, bảng này giữ LỊCH SỬ bất biến.
--
-- KHÔNG CẦN CHẠY TAY: SchemaBootstrapService chạy đúng bộ câu này mỗi lần backend khởi động.
-- File này chỉ để repo có bản ghi (xem backend/sql/README.md). Idempotent, chạy lại vô hại.
--
-- Kiểm tra sau khi chạy:
--   SELECT count(*) FROM appointment_bookings;
--   -- Không còn ô giờ CANCELLED nào dính bệnh nhân:
--   SELECT count(*) FROM appointment_slots WHERE status='CANCELLED' AND "patientId" IS NOT NULL;

CREATE TABLE IF NOT EXISTS appointment_bookings (
       id            SERIAL PRIMARY KEY,
       "slotId"      INTEGER NOT NULL,
       "patientId"   INTEGER NOT NULL,
       "slotDate"    DATE NOT NULL,
       "slotTime"    TIME NOT NULL,
       status        VARCHAR(20) NOT NULL DEFAULT 'BOOKED',
       reason        TEXT,
       notes         TEXT,
       "cancelledBy" VARCHAR(10),
       -- TIMESTAMPTZ cho khớp appointment_slots (xem rebuild-appointment-system.sql).
       -- Dùng TIMESTAMP trần ở đây thì backfill bên dưới chép từ timestamptz sang sẽ lệch 7 tiếng.
       "cancelledAt" TIMESTAMPTZ,
       "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
       "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
       CONSTRAINT appointment_bookings_status_check
         CHECK (status IN ('BOOKED', 'CANCELLED', 'COMPLETED'))
     );

CREATE INDEX IF NOT EXISTS idx_appt_booking_slot ON appointment_bookings ("slotId");

CREATE INDEX IF NOT EXISTS idx_appt_booking_patient ON appointment_bookings ("patientId", "slotDate" DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_appt_booking_active
       ON appointment_bookings ("slotId") WHERE status = 'BOOKED';

INSERT INTO appointment_bookings
       ("slotId", "patientId", "slotDate", "slotTime", status, reason, notes, "cancelledAt", "createdAt", "updatedAt")
     SELECT s.id, s."patientId", s."slotDate", s."slotTime",
            CASE WHEN s.status IN ('BOOKED','COMPLETED','CANCELLED') THEN s.status ELSE 'BOOKED' END,
            s.reason, s.notes,
            CASE WHEN s.status = 'CANCELLED' THEN s."updatedAt" ELSE NULL END,
            s."createdAt", s."updatedAt"
       FROM appointment_slots s
      WHERE s."patientId" IS NOT NULL
        AND s.status IN ('BOOKED','COMPLETED','CANCELLED')
        AND NOT EXISTS (SELECT 1 FROM appointment_bookings b WHERE b."slotId" = s.id);

UPDATE appointment_slots
        SET "patientId" = NULL, reason = NULL, notes = NULL,
            "reminded1h" = false, "reminded30m" = false, "reminded15m" = false,
            status = 'OPEN'
      WHERE status = 'CANCELLED';
