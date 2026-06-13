-- =============================================================================
-- SEO Phase 2 — Lò Viết Bài: bản nháp blog do AI sinh + van an toàn YMYL
-- =============================================================================
-- seo_bai_viet: mỗi bản nháp blog (Markdown) sinh từ 1 cụm chủ đề (seo_cum)
-- hoặc từ chủ đề tự nhập. `do_rui_ro` = van an toàn YMYL:
--   an_toan = nội dung tra cứu/dữ kiện (huyệt, đường kinh, tính vị quy kinh…) → có thể đăng.
--   rui_ro  = có lời khuyên chẩn đoán/điều trị/liều lượng → BẮT BUỘC người duyệt + nên noindex.
--
-- Idempotent. KHÔNG tạo trigger updated_at (TypeORM tự set qua @UpdateDateColumn) —
-- tránh lặp lại sự cố trigger-thiếu-cột ở Aiven trước đây.
-- =============================================================================

CREATE TABLE IF NOT EXISTS seo_bai_viet (
  id               SERIAL PRIMARY KEY,
  cum_id           INTEGER REFERENCES seo_cum(id) ON DELETE SET NULL, -- cụm nguồn (nếu có)
  tieu_de          VARCHAR(500) NOT NULL DEFAULT '',
  slug             VARCHAR(255),
  meta_description TEXT,
  tu_khoa          TEXT,                               -- từ khoá, cách nhau dấu phẩy (xuất ra keywords[])
  category         VARCHAR(100),                        -- chuyên mục (frontmatter category)
  cta              VARCHAR(100),                        -- đường dẫn CTA (vd /xem-ket-qua-do)
  faq              TEXT,                                -- JSON [{q,a}] cho FAQPage schema
  noi_dung_md      TEXT NOT NULL DEFAULT '',           -- thân bài dạng Markdown (không có H1, không kèm FAQ)
  do_rui_ro        VARCHAR(20) NOT NULL DEFAULT 'an_toan', -- an_toan | rui_ro
  ly_do_rui_ro     TEXT,
  trang_thai       VARCHAR(20) NOT NULL DEFAULT 'nhap',    -- nhap | da_duyet | bo_qua | da_dang
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_bai_viet_trang_thai ON seo_bai_viet (trang_thai);
CREATE INDEX IF NOT EXISTS idx_seo_bai_viet_cum        ON seo_bai_viet (cum_id);

-- Bổ sung sau (idempotent): nguồn tham khảo uy tín (E-E-A-T) — JSON [{title, url?}] → frontmatter `sources`.
ALTER TABLE seo_bai_viet ADD COLUMN IF NOT EXISTS nguon_tham_khao TEXT;

-- Bổ sung (idempotent): checklist kiểm duyệt thủ công trước khi đăng (van YMYL nhiều bước).
-- JSON {"yKhoa":bool,"seo":bool,"nguon":bool,"anh":bool}. Phải đủ 4 mục true mới cho chuyển sang "da_duyet".
ALTER TABLE seo_bai_viet ADD COLUMN IF NOT EXISTS kiem_duyet TEXT;
