-- ════════════════════════════════════════════════════════════════════════════
-- SỔ CÁI TRÍCH DẪN THỐNG NHẤT (Thư Mục Nguồn)
-- Gom MỌI trích dẫn về một mối: tên sách / y văn (loai='sach') + tác giả người (loai='tac_gia').
-- Được tham chiếu 2 chiều bởi: huyệt vị (tĩnh, theo huyet_id), vị thuốc (vi_thuoc), bài thuốc (phuong_thang).
-- Dedup theo norm_key (fold dấu + lower) → cùng một sách trích ở nhiều nơi chỉ 1 mục duy nhất.
-- Áp thủ công bằng psql. Idempotent (IF NOT EXISTS).
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS nguon (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,          -- = id facet với nguồn huyệt (vd 'giap-at-kinh') để link cũ vẫn chạy
  ten         TEXT NOT NULL,                 -- tên chuẩn hiển thị (vd 'Giáp Ất Kinh', 'Vương Hoài Ẩn')
  loai        TEXT NOT NULL DEFAULT 'sach',  -- 'sach' (sách/y văn) | 'tac_gia' (người)
  norm_key    TEXT NOT NULL,                 -- khoá chuẩn hoá để khớp/dedup
  ten_khac    TEXT,                          -- biến thể tên, nối bằng ' | '
  tac_gia     TEXT,                          -- tác giả (với sách)
  nien_dai    TEXT,                          -- niên đại
  link        TEXT,                          -- link tham khảo (Wikipedia…)
  ghi_chu     TEXT,                          -- ghi chú
  mo_ta       TEXT,                          -- mô tả (biên tập tay qua CRUD)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nguon_normkey_loai ON nguon (norm_key, loai);
CREATE INDEX IF NOT EXISTS idx_nguon_loai ON nguon (loai);
CREATE INDEX IF NOT EXISTS idx_nguon_ten_lower ON nguon (lower(ten));

-- ── Link: nguồn ↔ HUYỆT VỊ (huyệt là dữ liệu tĩnh acupoints.js → chỉ lưu id số) ──
CREATE TABLE IF NOT EXISTS nguon_huyet (
  nguon_id  INT NOT NULL REFERENCES nguon(id) ON DELETE CASCADE,
  huyet_id  INT NOT NULL,
  PRIMARY KEY (nguon_id, huyet_id)
);
CREATE INDEX IF NOT EXISTS idx_nh_nguon ON nguon_huyet (nguon_id);

-- ── Link: nguồn ↔ VỊ THUỐC (context: 'xuat_xu' | 'ten_khac') ──
CREATE TABLE IF NOT EXISTS nguon_vi_thuoc (
  nguon_id     INT NOT NULL REFERENCES nguon(id) ON DELETE CASCADE,
  vi_thuoc_id  INT NOT NULL,
  context      TEXT NOT NULL DEFAULT 'xuat_xu',
  PRIMARY KEY (nguon_id, vi_thuoc_id, context)
);
CREATE INDEX IF NOT EXISTS idx_nvt_nguon ON nguon_vi_thuoc (nguon_id);
CREATE INDEX IF NOT EXISTS idx_nvt_vi ON nguon_vi_thuoc (vi_thuoc_id);

-- ── Link: nguồn ↔ BÀI THUỐC (context: 'xuat_xu' | 'tac_gia') ──
CREATE TABLE IF NOT EXISTS nguon_phuong_thang (
  nguon_id          INT NOT NULL REFERENCES nguon(id) ON DELETE CASCADE,
  phuong_thang_id   INT NOT NULL,
  context           TEXT NOT NULL DEFAULT 'xuat_xu',
  PRIMARY KEY (nguon_id, phuong_thang_id, context)
);
CREATE INDEX IF NOT EXISTS idx_npt_nguon ON nguon_phuong_thang (nguon_id);
CREATE INDEX IF NOT EXISTS idx_npt_pt ON nguon_phuong_thang (phuong_thang_id);
