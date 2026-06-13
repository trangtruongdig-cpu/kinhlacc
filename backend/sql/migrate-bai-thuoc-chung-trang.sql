-- Gộp bien_chung + phap_tri (bảng bai_thuoc) → cột mới chung_trang, cách nhau bởi ", ".
-- PostgreSQL. Chạy sau khi sao lưu DB.

BEGIN;

ALTER TABLE bai_thuoc
  ADD COLUMN IF NOT EXISTS chung_trang TEXT;

-- Bỏ chuỗi rỗng; CONCAT_WS chỉ nối các phần khác NULL
UPDATE bai_thuoc
SET chung_trang = NULLIF(
  TRIM(CONCAT_WS(
    ', ',
    NULLIF(TRIM(COALESCE(bien_chung, '')), ''),
    NULLIF(TRIM(COALESCE(phap_tri, '')), '')
  )),
  ''
);

ALTER TABLE bai_thuoc DROP COLUMN IF EXISTS bien_chung;
ALTER TABLE bai_thuoc DROP COLUMN IF EXISTS phap_tri;

COMMIT;
