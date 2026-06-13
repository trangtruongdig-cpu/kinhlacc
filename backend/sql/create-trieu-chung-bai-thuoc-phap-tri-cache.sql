-- =============================================================================
-- Bảng cache: liên kết Triệu Chứng ↔ Bài Thuốc DẪN XUẤT QUA Pháp Trị.
--
-- Mô hình: triệu chứng "chỉ ở bên Pháp Trị"; mỗi Pháp Trị đã gắn sẵn Bài Thuốc,
-- nên triệu chứng *thừa hưởng* Bài Thuốc QUA Pháp Trị (không nối thẳng).
--
-- Bảng này do auto-sync SỞ HỮU HOÀN TOÀN — xem
-- PhapTriService.syncDerivedTrieuChungBaiThuoc() (backend/src/controllers/phap-tri.controller.ts).
-- Mỗi lần create/update/delete một Pháp Trị, các hàng liên quan được sinh lại.
--
-- KHÔNG nhập tay vào bảng này. Bảng `bai_thuoc_trieu_chung` (triệu chứng curated
-- TRỰC TIẾP cho Bài Thuốc ở tab Bài Thuốc) là bảng RIÊNG, độc lập, không bị động tới.
--
-- Idempotent: chạy lại an toàn (IF NOT EXISTS + ON CONFLICT DO NOTHING).
-- =============================================================================

CREATE TABLE IF NOT EXISTS trieu_chung_bai_thuoc_phap_tri (
  id_trieu_chung integer NOT NULL REFERENCES trieu_chung(id) ON DELETE CASCADE,
  id_bai_thuoc   integer NOT NULL REFERENCES bai_thuoc(id)   ON DELETE CASCADE,
  PRIMARY KEY (id_trieu_chung, id_bai_thuoc)
);

CREATE INDEX IF NOT EXISTS idx_tcbtpt_bai_thuoc
  ON trieu_chung_bai_thuoc_phap_tri (id_bai_thuoc);

-- Backfill toàn bộ từ đồ thị Pháp Trị hiện có:
--   (triệu chứng của Pháp Trị) × (bài thuốc của Pháp Trị)
-- Bài thuốc của một Pháp Trị = bai_thuoc_phap_tri (nhiều, có thứ tự) ∪ phap_tri.id_bai_thuoc (bài chính).
INSERT INTO trieu_chung_bai_thuoc_phap_tri (id_trieu_chung, id_bai_thuoc)
SELECT DISTINCT ptc.id_trieu_chung, src.id_bai_thuoc
FROM phap_tri_trieu_chung ptc
JOIN (
  SELECT id_phap_tri, id_bai_thuoc FROM bai_thuoc_phap_tri
  UNION
  SELECT id AS id_phap_tri, id_bai_thuoc FROM phap_tri WHERE id_bai_thuoc IS NOT NULL
) src ON src.id_phap_tri = ptc.id_phap_tri
ON CONFLICT DO NOTHING;
