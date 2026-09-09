-- Phục hồi các index bị TypeORM DB_SYNCHRONIZE=true xoá nhầm trên production (2026-09-09) —
-- xem git log cho bối cảnh sự cố (backend crash-loop 502 → fix entity → DB_SYNCHRONIZE=true
-- vẫn bật → synchronize tự DROP COLUMN "inputData" + hàng loạt index không khớp entity metadata
-- trước khi kịp tắt DB_SYNCHRONIZE).
--
-- Định nghĩa lấy nguyên văn từ add-meridian-measurements.sql, add-performance-indexes.sql,
-- add-performance-indexes-v2.sql (bản v2 dùng camelCase đúng schema examinations/patients thật;
-- v1 dùng snake_case cũ đã sai, giữ lại 1 index compound của v1 là idx_meridian_exam_measured
-- vì cột trên bảng meridian_measurements vốn dĩ đã là snake_case thật).
--
-- Mỗi CREATE INDEX CONCURRENTLY phải chạy RIÊNG (không được gộp transaction) — script chạy qua
-- node/pg từng câu một, xem cách chạy trong PR/commit liên quan.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exam_patient_id
  ON examinations("patientId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exam_created_at
  ON examinations("createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_deleted_at
  ON patients("deletedAt")
  WHERE "deletedAt" IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meridian_meas_examination_id
  ON meridian_measurements(examination_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meridian_meas_measured_at
  ON meridian_measurements(measured_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meridian_exam_measured
  ON meridian_measurements(examination_id, measured_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_examinations_appointmentid
  ON examinations("appointmentId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_examinations_deletedat
  ON examinations("deletedAt") WHERE "deletedAt" IS NULL;
