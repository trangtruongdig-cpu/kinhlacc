-- Thêm liên kết: 1 bệnh đông y (benh_dong_y_excel) → 1 pháp trị (phap_tri)
-- ON DELETE SET NULL để xóa pháp trị không phá quy tắc.
ALTER TABLE benh_dong_y_excel
  ADD COLUMN IF NOT EXISTS id_phap_tri INTEGER;

-- Trigger set_benh_dong_y_excel_updated_at() set NEW.updated_at = NOW(),
-- nhưng bảng không có cột updated_at → mọi UPDATE đều fail.
-- Bổ sung cột với DEFAULT NOW() để trigger chạy được.
ALTER TABLE benh_dong_y_excel
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_benh_dong_y_excel_phap_tri'
      AND table_name = 'benh_dong_y_excel'
  ) THEN
    ALTER TABLE benh_dong_y_excel
      ADD CONSTRAINT fk_benh_dong_y_excel_phap_tri
      FOREIGN KEY (id_phap_tri) REFERENCES phap_tri(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_benh_dong_y_excel_phap_tri ON benh_dong_y_excel(id_phap_tri);
