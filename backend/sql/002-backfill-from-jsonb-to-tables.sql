-- ============================================================================
-- SCHEMA MIGRATION STEP 2: Backfill Data from JSONB to New Tables
-- Date: 2026-09-09
-- Prerequisites: Step 1 SQL executed (new tables created)
-- ============================================================================

-- ============================================================================
-- 2.1: Backfill meridian_measurements from examinations.inputData
-- ============================================================================

-- Lấy dữ liệu từ inputData JSONB → insert vào meridian_measurements
-- inputData format: { "C10": 45, "C11": 52, ..., "F10": 48, ..., "F15": 61 }
INSERT INTO meridian_measurements (
  examination_id,
  chi_tren_c10, chi_tren_c11, chi_tren_c12, chi_tren_c13, chi_tren_c14, chi_tren_c15,
  chi_duoi_f10, chi_duoi_f11, chi_duoi_f12, chi_duoi_f13, chi_duoi_f14, chi_duoi_f15,
  measurements_raw,
  measured_at,
  created_at,
  updated_at
)
SELECT
  e.id,
  -- Chi trên (C10-C15)
  (e.inputData->>'C10')::INTEGER,
  (e.inputData->>'C11')::INTEGER,
  (e.inputData->>'C12')::INTEGER,
  (e.inputData->>'C13')::INTEGER,
  (e.inputData->>'C14')::INTEGER,
  (e.inputData->>'C15')::INTEGER,
  -- Chi dưới (F10-F15)
  (e.inputData->>'F10')::INTEGER,
  (e.inputData->>'F11')::INTEGER,
  (e.inputData->>'F12')::INTEGER,
  (e.inputData->>'F13')::INTEGER,
  (e.inputData->>'F14')::INTEGER,
  (e.inputData->>'F15')::INTEGER,
  -- Keep raw data for reference
  e.inputData,
  e.createdAt,
  e.createdAt,
  e.updatedAt
FROM examinations e
WHERE e.inputData IS NOT NULL
  AND e.id NOT IN (SELECT examination_id FROM meridian_measurements);

-- Log backfill result
DO $$
DECLARE
  count_backfilled INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_backfilled FROM meridian_measurements;
  RAISE NOTICE 'Backfilled % meridian measurements', count_backfilled;
END $$;

-- ============================================================================
-- 2.2: Backfill diagnoses from examinations.chanDoanLuu
-- ============================================================================

-- Lấy dữ liệu từ chanDoanLuu JSONB → insert vào diagnoses
-- chanDoanLuu format: {
--   "ket_luan": "Khí hư",
--   "ket_luan_items": [{ "label": "...", "key": "tdo:123" }],
--   "xep_hang": [{ "label": "...", "percent": 80, "is_kep": false }],
--   "trieu_chung": [{ "id": 1, "ten": "...", "tra_loi": "co" }],
--   "ghi_chu": "..."
-- }
INSERT INTO diagnoses (
  examination_id,
  primary_disease_code,
  confidence_score,
  matched_diseases,
  concluded_patterns,
  symptoms_answered,
  ranking,
  notes,
  diagnosed_at,
  created_at,
  updated_at
)
SELECT
  e.id,
  -- Primary disease: extract từ ket_luan_items[0] hoặc từ benh_dong_y_hien_dai match
  COALESCE(
    (e.chanDoanLuu->'ket_luan_items'->0->>'key')::VARCHAR,
    NULL
  ),
  -- Confidence score: lấy từ xep_hang[0].percent (nếu có)
  COALESCE((e.chanDoanLuu->'xep_hang'->0->>'percent')::INTEGER, 0),
  -- Matched diseases (giữ nguyên JSONB)
  NULL::JSONB, -- TODO: parse ket_luan_items nếu cần
  -- Concluded patterns
  e.chanDoanLuu->'ket_luan_items',
  -- Symptoms answered
  e.chanDoanLuu->'trieu_chung',
  -- Ranking
  e.chanDoanLuu->'xep_hang',
  -- Notes
  (e.chanDoanLuu->>'ghi_chu')::TEXT,
  -- Diagnosed at: lấy từ createdAt hoặc timestamp trong chanDoanLuu
  e.createdAt,
  e.createdAt,
  e.updatedAt
FROM examinations e
WHERE e.chanDoanLuu IS NOT NULL
  AND e.id NOT IN (SELECT examination_id FROM diagnoses);

-- Log backfill result
DO $$
DECLARE
  count_backfilled INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_backfilled FROM diagnoses;
  RAISE NOTICE 'Backfilled % diagnoses', count_backfilled;
END $$;

-- ============================================================================
-- 2.3: Backfill bai_thuoc_the_benh from bai_thuoc.the_benh (comma-separated text)
-- ============================================================================

-- Parse bai_thuoc.the_benh (format: "1,2,3") → insert M:N table
INSERT INTO bai_thuoc_the_benh (id_bai_thuoc, id_the_benh)
SELECT DISTINCT
  b.id AS id_bai_thuoc,
  CAST(TRIM(the_benh_id) AS INTEGER) AS id_the_benh
FROM bai_thuoc b
CROSS JOIN LATERAL STRING_TO_TABLE(b.the_benh, ',') AS the_benh_id
WHERE b.the_benh IS NOT NULL
  AND b.the_benh != ''
  AND TRIM(the_benh_id) ~ '^\d+$'  -- Only numeric IDs
  AND NOT EXISTS (
    SELECT 1 FROM bai_thuoc_the_benh
    WHERE id_bai_thuoc = b.id
      AND id_the_benh = CAST(TRIM(the_benh_id) AS INTEGER)
  );

-- Log backfill result
DO $$
DECLARE
  count_backfilled INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_backfilled FROM bai_thuoc_the_benh;
  RAISE NOTICE 'Backfilled % bai_thuoc_the_benh relationships', count_backfilled;
END $$;

-- ============================================================================
-- 2.4: Initialize patient_audit_log with creation record for existing patients
-- ============================================================================

-- Thêm một entry audit cho mỗi bệnh nhân: "Tạo tài khoản"
INSERT INTO patient_audit_log (
  patient_id, field_name, old_value, new_value, changed_by_admin_id, changed_at
)
SELECT
  p.id,
  'patient_created',
  NULL,
  'CREATED',
  NULL,  -- Không biết admin nào tạo → NULL
  p.createdAt
FROM patients p
WHERE NOT EXISTS (
  SELECT 1 FROM patient_audit_log
  WHERE patient_id = p.id
);

-- Log init result
DO $$
DECLARE
  count_inited INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_inited FROM patient_audit_log;
  RAISE NOTICE 'Initialized % audit log entries', count_inited;
END $$;

-- ============================================================================
-- Summary:
-- ✅ meridian_measurements: backfill từ examinations.inputData
-- ✅ diagnoses: backfill từ examinations.chanDoanLuu
-- ✅ bai_thuoc_the_benh: normalize từ bai_thuoc.the_benh text
-- ✅ patient_audit_log: init với creation records
--
-- Verify: SELECT COUNT(*) FROM meridian_measurements, diagnoses, bai_thuoc_the_benh
-- ============================================================================
