-- Bảng lưu kết quả đo kinh lạc từ 12 ô trên bảng đo
-- Theo map.md:
--   C10-C15 = 6 ô trên (tương ứng 6 ô đo chi trên của các kinh)
--   F10-F15 = 6 ô dưới (tương ứng 6 ô đo chi dưới của các kinh)
-- Từ 12 ô này input vào BenhDongYExcel rule engine → output bệnh Y học hiện đại

CREATE TABLE IF NOT EXISTS meridian_measurements (
  id SERIAL PRIMARY KEY,
  examination_id INT NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,

  -- 6 ô chiều trên (C10-C15 trên bảng Excel)
  chi_tren_c10 INT,          -- Kinh 1 (Tâm/Phổi?)
  chi_tren_c11 INT,          -- Kinh 2
  chi_tren_c12 INT,          -- Kinh 3
  chi_tren_c13 INT,          -- Kinh 4
  chi_tren_c14 INT,          -- Kinh 5
  chi_tren_c15 INT,          -- Kinh 6

  -- 6 ô chiều dưới (F10-F15 trên bảng Excel)
  chi_duoi_f10 INT,          -- Kinh 1 dưới
  chi_duoi_f11 INT,          -- Kinh 2 dưới
  chi_duoi_f12 INT,          -- Kinh 3 dưới
  chi_duoi_f13 INT,          -- Kinh 4 dưới
  chi_duoi_f14 INT,          -- Kinh 5 dưới
  chi_duoi_f15 INT,          -- Kinh 6 dưới

  -- Metadata
  measured_by_admin_id INT REFERENCES admins(id) ON DELETE SET NULL,
  measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Index cho query nhanh
  UNIQUE(examination_id)
);

CREATE INDEX idx_meridian_measurements_examination_id ON meridian_measurements(examination_id);
CREATE INDEX idx_meridian_measurements_measured_at ON meridian_measurements(measured_at DESC);

COMMENT ON TABLE meridian_measurements IS 'Kết quả đo 12 ô kinh lạc (6 ô trên + 6 ô dưới). Input cho rule engine BenhDongYExcel để chẩn đoán bệnh Y học hiện đại';
COMMENT ON COLUMN meridian_measurements.chi_tren_c10 IS 'Giá trị ô C10 từ bảng đo (chiều trên)';
COMMENT ON COLUMN meridian_measurements.chi_duoi_f10 IS 'Giá trị ô F10 từ bảng đo (chiều dưới)';
