-- =============================================================================
-- SEO Radar — gắn đối thủ vào cụm khoảng trống (để gom nhóm theo từng đối thủ)
-- =============================================================================
-- Thêm cột seo_cum.doi_thu_id: khoảng trống này tìm ra khi so với đối thủ nào.
--   • NULL  = cụm cũ / chế độ gộp tất cả đối thủ.
--   • có id = cụm thuộc đúng 1 đối thủ → frontend gom nhóm theo đối thủ đó.
-- Xoá đối thủ thì cụm của nó tự xoá theo (ON DELETE CASCADE).
--
-- Idempotent (IF NOT EXISTS) — chạy lại nhiều lần an toàn.
-- Chạy tay bằng psql (xem backend/sql/README.md). Aiven có thể trễ migration.
-- =============================================================================

ALTER TABLE seo_cum
  ADD COLUMN IF NOT EXISTS doi_thu_id INTEGER REFERENCES seo_doi_thu(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_seo_cum_doi_thu ON seo_cum (doi_thu_id);
