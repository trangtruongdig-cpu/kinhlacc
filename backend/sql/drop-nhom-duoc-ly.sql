-- Xoá toàn bộ "nhóm dược lý": cả bảng + dữ liệu + các ràng buộc liên quan.
-- Bao gồm:
--   - phap_tri_nhom_duoc_ly_nho   (join M2M phap_tri ↔ nhom_duoc_ly_nho)
--   - phap_tri.id_nhom_duoc_ly_nho (FK đơn từ phap_tri)
--   - vi_thuoc_nhom_nho           (link vi_thuoc ↔ nhom_duoc_ly_nho)
--   - nhom_duoc_ly_nho            (nhóm nhỏ)
--   - nhom_duoc_ly_lon            (nhóm lớn)
--
-- PostgreSQL. Sao lưu DB trước khi chạy.
-- Đồng bộ với code app: 3 model + router + service + DTO đã được gỡ.

BEGIN;

-- Join table M2M (phap_tri ↔ nhom_duoc_ly_nho)
DROP TABLE IF EXISTS phap_tri_nhom_duoc_ly_nho CASCADE;

-- FK đơn từ phap_tri sang nhom_duoc_ly_nho
ALTER TABLE phap_tri DROP COLUMN IF EXISTS id_nhom_duoc_ly_nho;

-- Bảng link vi_thuoc ↔ nhom_duoc_ly_nho
DROP TABLE IF EXISTS vi_thuoc_nhom_nho CASCADE;

-- Hai bảng nhóm dược lý (xoá nhỏ trước rồi tới lớn; CASCADE để chắc chắn)
DROP TABLE IF EXISTS nhom_duoc_ly_nho CASCADE;
DROP TABLE IF EXISTS nhom_duoc_ly_lon CASCADE;

COMMIT;
