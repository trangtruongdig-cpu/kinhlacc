CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exam_patient_id ON examinations("patientId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exam_created_at ON examinations("createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_name_lower ON patients(lower("fullName"));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_deleted_at ON patients("deletedAt") WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vi_thuoc_name_lower ON vi_thuoc(lower(ten_vi_thuoc));
