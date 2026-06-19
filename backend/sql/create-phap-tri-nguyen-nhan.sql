-- Nguyên nhân CÓ CẤU TRÚC của pháp trị (nhom: tinh-than | sinh-hoat | tang-phu). Idempotent.
CREATE TABLE IF NOT EXISTS phap_tri_nguyen_nhan (
  id          SERIAL PRIMARY KEY,
  id_phap_tri INTEGER NOT NULL REFERENCES phap_tri(id) ON DELETE CASCADE,
  nhom        VARCHAR(40),
  noi_dung    TEXT,
  thu_tu      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ptnn_phap_tri ON phap_tri_nguyen_nhan (id_phap_tri);
