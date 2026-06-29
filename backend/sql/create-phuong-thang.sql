-- Bảng PHƯƠNG THANG (từ điển bài thuốc/cổ phương công khai, chỉ đọc) — tách khỏi bai_thuoc admin.
-- Nguồn: app Đông Y Dược 2004 (E:\Data\Remedy.*), trích bằng tools/extract-remedy.cjs (13.942 bài).
CREATE TABLE IF NOT EXISTS phuong_thang (
  id             SERIAL PRIMARY KEY,
  ten            TEXT NOT NULL,
  slug           TEXT UNIQUE NOT NULL,
  xuat_xu        TEXT,
  tac_gia        TEXT,
  thanh_phan     JSONB,          -- [{ "ten": "...", "lieu": "..." }] (cặp vị–liều)
  cach_dung      TEXT,           -- phần bào chế / cách dùng (cuối phần thành phần)
  thanh_phan_raw TEXT,           -- nguyên văn (fallback)
  tac_dung       TEXT,
  ghi_chu        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phuong_thang_ten ON phuong_thang (ten);
CREATE INDEX IF NOT EXISTS idx_phuong_thang_ten_lower ON phuong_thang (lower(ten));
-- Tra cứu NGƯỢC: bài thuốc nào chứa vị thuốc id X → WHERE thanh_phan @> '[{"id":X}]'
-- (thanh_phan = [{ten, lieu, id}], id = vi_thuoc.id khớp được; null nếu chưa khớp).
CREATE INDEX IF NOT EXISTS idx_phuong_thang_tp_gin ON phuong_thang USING gin (thanh_phan jsonb_path_ops);
