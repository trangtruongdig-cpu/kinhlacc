-- =============================================================================
-- SEO Radar — "soi" chiến lược nội dung đối thủ + tìm khoảng trống (gap analysis)
-- =============================================================================
-- Cổng dữ liệu cho module `seo` (port từ các n8n workflow vào trong app).
--   seo_doi_thu : mỗi domain đối thủ (hoặc site của chính mình để so sánh)
--   seo_url     : từng URL blog gom được từ sitemap + kết quả AI bóc tách
--   seo_cum     : các cụm chủ đề AI gợi ý nên viết (kết quả gap analysis)
--
-- Idempotent (IF NOT EXISTS) — chạy lại nhiều lần an toàn.
-- Chạy tay bằng psql (xem backend/sql/README.md). Aiven có thể trễ migration,
-- đừng giả định bảng đã có ở môi trường khác.
-- =============================================================================

-- ---- Đối thủ (hoặc site của mình) ------------------------------------------
CREATE TABLE IF NOT EXISTS seo_doi_thu (
  id          SERIAL PRIMARY KEY,
  domain      VARCHAR(255) NOT NULL,                 -- đã chuẩn hoá: không http, không www, không path
  ten         VARCHAR(255),                          -- tên gợi nhớ (tuỳ chọn)
  la_cua_minh BOOLEAN NOT NULL DEFAULT false,        -- true = site của mình (dùng làm mốc so sánh)
  ghi_chu     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mỗi domain chỉ 1 dòng (so khớp không phân biệt hoa/thường).
CREATE UNIQUE INDEX IF NOT EXISTS uq_seo_doi_thu_domain
  ON seo_doi_thu (lower(domain));

-- ---- URL blog + kết quả phân tích ------------------------------------------
CREATE TABLE IF NOT EXISTS seo_url (
  id          SERIAL PRIMARY KEY,
  doi_thu_id  INTEGER NOT NULL REFERENCES seo_doi_thu(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  trang_thai  VARCHAR(20) NOT NULL DEFAULT 'cho',    -- cho | da_phan_tich | loi
  chu_de      TEXT,                                  -- AI: chủ đề chính
  tu_khoa     TEXT,                                  -- AI: 3 từ khoá SEO (cách nhau dấu phẩy)
  tom_tat     TEXT,                                  -- AI: tóm tắt bullet
  loi         TEXT,                                  -- thông báo lỗi khi trang_thai='loi'
  analyzed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chống trùng URL (md5 vì URL có thể dài hơn giới hạn index B-tree).
CREATE UNIQUE INDEX IF NOT EXISTS uq_seo_url_md5
  ON seo_url (md5(url));
CREATE INDEX IF NOT EXISTS idx_seo_url_doi_thu     ON seo_url (doi_thu_id);
CREATE INDEX IF NOT EXISTS idx_seo_url_trang_thai  ON seo_url (trang_thai);

-- ---- Cụm chủ đề gợi ý (gap analysis) ---------------------------------------
CREATE TABLE IF NOT EXISTS seo_cum (
  id               SERIAL PRIMARY KEY,
  ten_cum          VARCHAR(255) NOT NULL,
  diem_uu_tien     INTEGER NOT NULL DEFAULT 0,       -- điểm ưu tiên tổng (càng cao càng nên viết)
  tu_khoa_muc_tieu TEXT,                             -- từ khoá mục tiêu (cách nhau dấu phẩy)
  y_tuong_noi_dung TEXT,                             -- vài ý tưởng bài viết
  ly_do            TEXT,                             -- vì sao AI gợi ý cụm này
  doi_thu_id       INTEGER REFERENCES seo_doi_thu(id) ON DELETE CASCADE, -- so với đối thủ nào (gom nhóm); NULL = gộp tất cả
  trang_thai       VARCHAR(20) NOT NULL DEFAULT 'de_xuat', -- de_xuat | da_chon | da_viet | bo_qua
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_cum_trang_thai ON seo_cum (trang_thai);
CREATE INDEX IF NOT EXISTS idx_seo_cum_doi_thu ON seo_cum (doi_thu_id);
