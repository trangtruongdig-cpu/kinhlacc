-- Nguyên nhân CÓ CẤU TRÚC của thể đo (nhom: tinh-than | sinh-hoat | tang-phu). Idempotent.
-- Song song với phap_tri_nguyen_nhan, dành cho benh_dong_y_excel.
CREATE TABLE IF NOT EXISTS benh_dong_y_excel_nguyen_nhan (
  id                    SERIAL PRIMARY KEY,
  id_benh_dong_y_excel  INTEGER NOT NULL REFERENCES benh_dong_y_excel(id) ON DELETE CASCADE,
  nhom                  VARCHAR(40),
  noi_dung              TEXT,
  thu_tu                INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_bdyenn_benh_dong_y_excel ON benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel);
