-- ============================================================================
-- SCHEMA MIGRATION STEP 4: Normalize bai_thuoc.the_benh (Optional Optimization)
-- Date: 2026-09-09
-- Prerequisites: bai_thuoc_the_benh already backfilled from step 2
-- Note: Only drop the_benh column if M:N table is being used exclusively
--       Keep it if you need backward compatibility (comment this step out)
-- ============================================================================

-- ============================================================================
-- 4.1: Verify bai_thuoc_the_benh is complete
-- ============================================================================

DO $$
DECLARE
  count_m2m INTEGER;
  count_text_col INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_m2m FROM bai_thuoc_the_benh;
  SELECT COUNT(*) INTO count_text_col FROM bai_thuoc WHERE the_benh IS NOT NULL AND the_benh != '';

  RAISE NOTICE '✓ M:N relationships: %', count_m2m;
  RAISE NOTICE '✓ Text column entries: %', count_text_col;

  IF count_m2m < count_text_col THEN
    RAISE WARNING 'WARNING: M:N count (%) < text column count (%). Check backfill!', count_m2m, count_text_col;
  ELSE
    RAISE NOTICE '✓ All the_benh entries normalized to M:N';
  END IF;
END $$;

-- ============================================================================
-- 4.2: OPTIONAL - Drop the_benh text column (if confident M:N is complete)
-- ============================================================================

-- Uncomment below ONLY if you're sure M:N backfill is 100% complete
-- ALTER TABLE bai_thuoc DROP COLUMN IF EXISTS the_benh;
-- RAISE NOTICE '✓ Dropped bai_thuoc.the_benh text column';

-- For now, keep it for backward compatibility. You can drop manually after verification.

-- ============================================================================
-- 4.3: Add index on bai_thuoc_the_benh for common queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bai_thuoc_the_benh_bai
  ON bai_thuoc_the_benh(id_bai_thuoc);

-- ============================================================================
-- Summary:
-- ✓ M:N table bai_thuoc_the_benh ready
-- • Text column bai_thuoc.the_benh kept for backward compatibility
-- • To complete: manually drop the_benh column after code review
--
-- Next: Update frontend to query M:N instead of text column
-- ============================================================================
