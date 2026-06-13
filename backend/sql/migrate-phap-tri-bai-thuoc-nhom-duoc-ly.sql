-- Pháp trị (khớp entity TypeORM PhapTri): FK trực tiếp id_bai_thuoc, id_nhom_duoc_ly_nho;
-- id_benh_dong_y nullable UNIQUE; kinh mạch qua bảng phap_tri_kinh_mach.

-- Chỉ DROP những bảng schema hiện tại dùng (tránh NOTICE «does not exist» của PG cho bảng legacy chưa từng tạo).
-- Nếu DB cũ còn phap_tri_bai_thuoc / phap_tri_nhom_duoc_ly_nho: xóa tay hoặc thêm DROP riêng.
DROP TABLE IF EXISTS phap_tri_kinh_mach CASCADE;
DROP TABLE IF EXISTS phap_tri CASCADE;

CREATE TABLE phap_tri (
  id SERIAL PRIMARY KEY,
  id_benh_dong_y INTEGER UNIQUE REFERENCES benh_dong_y(id) ON DELETE SET NULL,
  chung_trang TEXT,
  nguyen_tac TEXT,
  y_nghia_co_che TEXT,
  bat_phap TEXT,
  bat_cuong TEXT,
  luc_dam TEXT,
  trieu_chung_mo_ta TEXT,
  id_bai_thuoc INTEGER REFERENCES bai_thuoc(id) ON DELETE SET NULL,
  id_nhom_duoc_ly_nho INTEGER REFERENCES nhom_duoc_ly_nho(id) ON DELETE SET NULL
);

CREATE INDEX idx_phap_tri_benh ON phap_tri(id_benh_dong_y);

CREATE TABLE phap_tri_kinh_mach (
  id_phap_tri INTEGER NOT NULL REFERENCES phap_tri(id) ON DELETE CASCADE,
  id_kinh_mach INTEGER NOT NULL REFERENCES kinh_mach(id_kinh_mach) ON DELETE CASCADE,
  PRIMARY KEY (id_phap_tri, id_kinh_mach)
);
