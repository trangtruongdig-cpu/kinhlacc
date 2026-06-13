-- Phác đồ điều trị (tên + kế thừa + danh sách huyệt riêng)
-- PostgreSQL. Chạy một lần trên DB đã có benh_dong_y, huyet_vi.

CREATE TABLE IF NOT EXISTS phac_do_chuan (
  id SERIAL PRIMARY KEY,
  ten VARCHAR(255) NOT NULL,
  id_ke_thua INTEGER REFERENCES phac_do_chuan(id) ON DELETE SET NULL,
  id_benh_dong_y INTEGER REFERENCES benh_dong_y(id) ON DELETE SET NULL,
  ghi_chu TEXT,
  thu_tu_hien_thi INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_phac_do_chuan_benh ON phac_do_chuan(id_benh_dong_y);
CREATE INDEX IF NOT EXISTS idx_phac_do_chuan_ke_thua ON phac_do_chuan(id_ke_thua);

CREATE TABLE IF NOT EXISTS phac_do_chuan_huyet (
  id SERIAL PRIMARY KEY,
  id_phac_do_chuan INTEGER NOT NULL REFERENCES phac_do_chuan(id) ON DELETE CASCADE,
  id_huyet INTEGER NOT NULL REFERENCES huyet_vi(id_huyet) ON DELETE CASCADE,
  thu_tu INTEGER NOT NULL DEFAULT 0,
  vai_tro_huyet VARCHAR(255),
  phuong_phap_tac_dong VARCHAR(255),
  ghi_chu_ky_thuat TEXT,
  UNIQUE (id_phac_do_chuan, id_huyet)
);

CREATE INDEX IF NOT EXISTS idx_phac_do_chuan_huyet_pd ON phac_do_chuan_huyet(id_phac_do_chuan);
