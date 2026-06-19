-- Thêm cột phân nhóm triệu chứng (tinh-than | tieu-hoa | than-kinh-co-the | phu-khoa | luoi-mach | toan-trang | khac).
-- Idempotent.
ALTER TABLE trieu_chung ADD COLUMN IF NOT EXISTS nhom VARCHAR(40);
CREATE INDEX IF NOT EXISTS idx_trieu_chung_nhom ON trieu_chung (nhom);
