-- Bổ sung 3 cột mà entity Examination (src/models/examination.model.ts) đã khai báo
-- từ trước nhưng chưa từng được migrate lên DB thật: appointmentId, deletedAt, updatedAt.
--
-- Phát hiện khi GET /patients lỗi 500 "column e.deletedAt does not exist" — TypeORM tự
-- thêm điều kiện `"deletedAt" IS NULL` cho MỌI query trên Examination vì entity có
-- @DeleteDateColumn(), dù query đó không hề chọn cột này.
--
-- CHỦ Ý KHÔNG đụng tới inputData/chanDoanLuu (khác với backend/sql/003-remove-jsonb-columns-and-add-fk.sql
-- — file đó DROP hai cột này nhưng code hiện tại (PatientsService.findPaginated, buildThongKeDataset)
-- vẫn đang đọc inputData; chạy 003 nguyên bản lúc này sẽ đổi lỗi 500 này sang lỗi 500 khác).
--
-- Dùng camelCase có ngoặc kép để khớp naming convention TypeORM (giống add-patient-soft-delete.sql).
-- An toàn khi chạy lại nhiều lần (IF NOT EXISTS). Không xoá / không sửa dữ liệu cũ.

BEGIN;

ALTER TABLE examinations
  ADD COLUMN IF NOT EXISTS "appointmentId" INTEGER NULL
    REFERENCES appointment_slots(id) ON DELETE SET NULL;

ALTER TABLE examinations
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;

ALTER TABLE examinations
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_examinations_appointmentid
  ON examinations("appointmentId");

CREATE INDEX IF NOT EXISTS idx_examinations_deletedat
  ON examinations("deletedAt") WHERE "deletedAt" IS NULL;

COMMENT ON COLUMN examinations."appointmentId"
  IS 'FK tới appointment_slots — buổi hẹn gắn với ca khám này (nullable, ca khám cũ chưa có).';
COMMENT ON COLUMN examinations."deletedAt"
  IS 'Soft delete — khớp @DeleteDateColumn() trong Examination entity. NULL = đang hoạt động.';

COMMIT;
