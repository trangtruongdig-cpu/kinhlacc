-- Chuyển quan hệ benh_dong_y_excel <-> phap_tri sang many-to-many.
-- Trước đây mỗi bệnh chỉ map được 1 pháp trị qua cột benh_dong_y_excel.id_phap_tri.
-- Sau migration: dùng bảng nối benh_dong_y_excel_phap_tri, cột cũ bị drop.

CREATE TABLE IF NOT EXISTS benh_dong_y_excel_phap_tri (
  id_benh_dong_y_excel INTEGER NOT NULL,
  id_phap_tri INTEGER NOT NULL,
  PRIMARY KEY (id_benh_dong_y_excel, id_phap_tri),
  CONSTRAINT fk_bdyexcel_pt_benh
    FOREIGN KEY (id_benh_dong_y_excel) REFERENCES benh_dong_y_excel(id) ON DELETE CASCADE,
  CONSTRAINT fk_bdyexcel_pt_phap_tri
    FOREIGN KEY (id_phap_tri) REFERENCES phap_tri(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bdyexcel_pt_benh
  ON benh_dong_y_excel_phap_tri(id_benh_dong_y_excel);
CREATE INDEX IF NOT EXISTS idx_bdyexcel_pt_phap_tri
  ON benh_dong_y_excel_phap_tri(id_phap_tri);

-- Backfill dữ liệu cũ từ cột id_phap_tri (nếu cột vẫn còn tồn tại).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'benh_dong_y_excel' AND column_name = 'id_phap_tri'
  ) THEN
    INSERT INTO benh_dong_y_excel_phap_tri (id_benh_dong_y_excel, id_phap_tri)
    SELECT id, id_phap_tri
    FROM benh_dong_y_excel
    WHERE id_phap_tri IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Gỡ FK + index + cột cũ.
ALTER TABLE benh_dong_y_excel
  DROP CONSTRAINT IF EXISTS fk_benh_dong_y_excel_phap_tri;

DROP INDEX IF EXISTS idx_benh_dong_y_excel_phap_tri;

ALTER TABLE benh_dong_y_excel
  DROP COLUMN IF EXISTS id_phap_tri;
