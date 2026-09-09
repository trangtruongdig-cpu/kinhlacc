-- ============================================================================
-- SCHEMA MIGRATION STEP 1: Create New Tables for Optimized Schema
-- Date: 2026-09-09
-- Backward compatible: YES (new tables, no drops)
-- ============================================================================

-- 1. Meridian Measurements (thay thế inputData generic)
-- Lưu dữ liệu 12 ô đo kinh lạc rõ ràng (C10-C15 trên, F10-F15 dưới)
CREATE TABLE IF NOT EXISTS meridian_measurements (
  id SERIAL PRIMARY KEY,
  examination_id INTEGER NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,

  -- 12 ô đo (chi trên: C10-C15, chi dưới: F10-F15)
  -- Giá trị 0-100 hoặc NULL nếu không đo
  chi_tren_c10 INTEGER,
  chi_tren_c11 INTEGER,
  chi_tren_c12 INTEGER,
  chi_tren_c13 INTEGER,
  chi_tren_c14 INTEGER,
  chi_tren_c15 INTEGER,

  chi_duoi_f10 INTEGER,
  chi_duoi_f11 INTEGER,
  chi_duoi_f12 INTEGER,
  chi_duoi_f13 INTEGER,
  chi_duoi_f14 INTEGER,
  chi_duoi_f15 INTEGER,

  -- Raw measurements JSONB (keep original untuk reference)
  measurements_raw JSONB,

  measured_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_meridian_measurements_exam
  ON meridian_measurements(examination_id);
CREATE INDEX idx_meridian_measurements_time
  ON meridian_measurements(measured_at DESC);

-- 2. Diagnoses (normalize từ examinations.chanDoanLuu JSONB)
-- Lưu chẩn đoán với confidence score + triệu chứng
CREATE TABLE IF NOT EXISTS diagnoses (
  id SERIAL PRIMARY KEY,
  examination_id INTEGER NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,

  -- Bệnh Y học hiện đại chính (code từ benh_dong_y_hien_dai)
  primary_disease_code VARCHAR(120) REFERENCES benh_dong_y_hien_dai(code) ON DELETE SET NULL,

  -- Độ tin cậy của công thức rule engine (0-100)
  confidence_score INTEGER DEFAULT 0,

  -- Danh sách tất cả bệnh khớp + điểm số (JSONB)
  -- Format: [{ code, name, score, is_primary }, ...]
  matched_diseases JSONB,

  -- Danh sách thể bệnh (YHCT pattern) kết luận
  -- Format: [{ label, key }, ...]
  concluded_patterns JSONB,

  -- Triệu chứng đã hỏi + câu trả lời
  -- Format: [{ id, ten, nhom, tra_loi: 'co'|'khong'|'kho' }, ...]
  symptoms_answered JSONB,

  -- Xếp hạng các ứng viên (snapshot từ khi chốt)
  -- Format: [{ label, percent, is_kep }, ...]
  ranking JSONB,

  -- Ghi chú bác sĩ
  notes TEXT,

  -- Ai đã chốt chẩn đoán (admin_id từ bảng admins nếu có)
  diagnosed_by_admin_id INTEGER,
  diagnosed_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_diagnoses_exam
  ON diagnoses(examination_id);
CREATE INDEX idx_diagnoses_disease
  ON diagnoses(primary_disease_code);
CREATE INDEX idx_diagnoses_time
  ON diagnoses(created_at DESC);

-- 3. Patient Audit Log (track thay đổi bệnh nhân)
-- Lưu lại mỗi lần sửa bệnh nhân: ai/khi nào/sửa gì
CREATE TABLE IF NOT EXISTS patient_audit_log (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

  -- Trường nào thay đổi (fullName, medicalHistory, phone, ...)
  field_name VARCHAR(255) NOT NULL,

  -- Giá trị cũ / mới
  old_value TEXT,
  new_value TEXT,

  -- Ai sửa: admin hay bệnh nhân tự sửa
  changed_by_admin_id INTEGER,
  changed_by_patient_id INTEGER,

  -- Thời gian thay đổi
  changed_at TIMESTAMP NOT NULL DEFAULT now(),

  -- Constraint: phải có ít nhất 1 người sửa
  CONSTRAINT chk_audit_who_changed CHECK (
    (changed_by_admin_id IS NOT NULL AND changed_by_patient_id IS NULL) OR
    (changed_by_admin_id IS NULL AND changed_by_patient_id IS NOT NULL)
  )
);

CREATE INDEX idx_patient_audit_patient
  ON patient_audit_log(patient_id);
CREATE INDEX idx_patient_audit_time
  ON patient_audit_log(changed_at DESC);

-- 4. Bai Thuoc The Benh (normalize comma-separated từ bai_thuoc.the_benh)
CREATE TABLE IF NOT EXISTS bai_thuoc_the_benh (
  id_bai_thuoc INTEGER NOT NULL REFERENCES bai_thuoc(id) ON DELETE CASCADE,
  id_the_benh INTEGER NOT NULL REFERENCES the_benh(id) ON DELETE CASCADE,

  PRIMARY KEY (id_bai_thuoc, id_the_benh)
);

CREATE INDEX idx_bai_thuoc_the_benh_thebenh
  ON bai_thuoc_the_benh(id_the_benh);

-- ============================================================================
-- Summary:
-- - meridian_measurements: 12 ô đo kinh lạc (thay inputData JSONB generic)
-- - diagnoses: chẩn đoán + confidence score (normalize từ chanDoanLuu JSONB)
-- - patient_audit_log: audit trail bệnh nhân (ai/khi/sửa gì)
-- - bai_thuoc_the_benh: M:N table (normalize từ the_benh text column)
--
-- Các bảng này EMPTY lúc này, sẽ backfill từ dữ liệu cũ ở step 2.
-- ============================================================================
