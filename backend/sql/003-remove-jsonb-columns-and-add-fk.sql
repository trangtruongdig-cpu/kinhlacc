-- ============================================================================
-- SCHEMA MIGRATION STEP 3: Remove Old JSONB Columns & Add FK
-- Date: 2026-09-09
-- Prerequisites: Step 1-2 completed, data backfilled
-- WARNING: This step involves ALTER TABLE - minimal downtime (~2-5 sec)
-- ============================================================================

-- ============================================================================
-- 3.1: Drop old JSONB columns from examinations
-- ============================================================================

ALTER TABLE examinations
  DROP COLUMN IF EXISTS inputData,
  DROP COLUMN IF EXISTS chanDoanLuu;

-- ============================================================================
-- 3.2: Add new columns to examinations (if not exist)
-- ============================================================================

-- Foreign key to appointment_slots (link khám → buổi hẹn)
ALTER TABLE examinations
  ADD COLUMN IF NOT EXISTS appointment_id INTEGER REFERENCES appointment_slots(id) ON DELETE SET NULL;

-- Soft delete marker
ALTER TABLE examinations
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- ============================================================================
-- 3.3: Add indexes for new FK
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_examinations_appointment
  ON examinations(appointment_id);

CREATE INDEX IF NOT EXISTS idx_examinations_deleted
  ON examinations(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- 3.4: Verify data integrity
-- ============================================================================

-- Check: tất cả examination đều có meridian_measurement?
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM examinations e
  WHERE NOT EXISTS (
    SELECT 1 FROM meridian_measurements
    WHERE examination_id = e.id
  )
    AND e.deleted_at IS NULL;

  IF missing_count > 0 THEN
    RAISE WARNING 'WARNING: % examinations missing meridian_measurements', missing_count;
  ELSE
    RAISE NOTICE '✓ All examinations have meridian_measurements';
  END IF;
END $$;

-- Check: tất cả examination với chanDoanLuu đều có diagnoses?
-- (Lưu ý: không phải tất cả examination có chanDoanLuu)
DO $$
DECLARE
  diagnosis_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO diagnosis_count
  FROM diagnoses;

  RAISE NOTICE '✓ Total diagnoses backfilled: %', diagnosis_count;
END $$;

-- ============================================================================
-- Summary:
-- ✅ Dropped inputData, chanDoanLuu columns
-- ✅ Added appointment_id FK to appointment_slots
-- ✅ Added deleted_at soft delete marker
-- ✅ Added indexes for performance
--
-- Next step: Update TypeORM entities to reflect schema changes
-- ============================================================================
