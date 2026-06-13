-- =============================================================================
-- Dược lý: Nhóm lớn → Nhóm nhỏ → (Vị thuốc, Chủ trị) + liều lượng dùng chung
-- =============================================================================
-- Quan hệ:
--   1 nhom_lon_duoc_ly  có nhiều  nhom_nho_duoc_ly
--   1 nhom_nho_duoc_ly  có 1 liều lượng chung (cột lieu_luong)
--   1 nhom_nho_duoc_ly  M:N với vi_thuoc qua bảng nhom_nho_vi_thuoc
--   1 nhom_nho_duoc_ly  M:N với chu_tri  qua bảng nhom_nho_chu_tri
-- =============================================================================

CREATE TABLE IF NOT EXISTS nhom_lon_duoc_ly (
  id      SERIAL PRIMARY KEY,
  ten_nhom VARCHAR(255) NOT NULL,
  mo_ta   TEXT,
  thu_tu  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS nhom_nho_duoc_ly (
  id          SERIAL PRIMARY KEY,
  id_nhom_lon INTEGER NOT NULL REFERENCES nhom_lon_duoc_ly(id) ON DELETE CASCADE,
  ten_nhom    VARCHAR(255) NOT NULL,
  lieu_luong  VARCHAR(255),
  mo_ta       TEXT,
  thu_tu      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_nhom_nho_duoc_ly_nhom_lon
  ON nhom_nho_duoc_ly(id_nhom_lon);

CREATE TABLE IF NOT EXISTS nhom_nho_vi_thuoc (
  id_nhom_nho INTEGER NOT NULL REFERENCES nhom_nho_duoc_ly(id) ON DELETE CASCADE,
  id_vi_thuoc INTEGER NOT NULL REFERENCES vi_thuoc(id)          ON DELETE CASCADE,
  thu_tu      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id_nhom_nho, id_vi_thuoc)
);

CREATE INDEX IF NOT EXISTS idx_nhom_nho_vi_thuoc_vi
  ON nhom_nho_vi_thuoc(id_vi_thuoc);

CREATE TABLE IF NOT EXISTS nhom_nho_chu_tri (
  id_nhom_nho INTEGER NOT NULL REFERENCES nhom_nho_duoc_ly(id) ON DELETE CASCADE,
  id_chu_tri  INTEGER NOT NULL REFERENCES chu_tri(id)           ON DELETE CASCADE,
  thu_tu      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id_nhom_nho, id_chu_tri)
);

CREATE INDEX IF NOT EXISTS idx_nhom_nho_chu_tri_ct
  ON nhom_nho_chu_tri(id_chu_tri);
