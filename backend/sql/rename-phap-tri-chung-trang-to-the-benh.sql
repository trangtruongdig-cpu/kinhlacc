-- Đổi tên cột phap_tri.chung_trang -> phap_tri.the_benh (PostgreSQL).
-- An toàn khi chạy nhiều lần.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'phap_tri'
      AND column_name = 'chung_trang'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'phap_tri'
      AND column_name = 'the_benh'
  ) THEN
    EXECUTE 'ALTER TABLE public.phap_tri RENAME COLUMN chung_trang TO the_benh';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'phap_tri'
      AND column_name = 'nguyen_tac'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'phap_tri'
      AND column_name = 'phap_tri'
  ) THEN
    EXECUTE 'ALTER TABLE public.phap_tri RENAME COLUMN nguyen_tac TO phap_tri';
  END IF;
END $$;
