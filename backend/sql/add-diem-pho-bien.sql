-- Điểm "thông dụng" cho mỗi BÀI THUỐC = tổng so_bai_thuoc của các vị trong bài.
-- Bài gồm toàn vị hay dùng (Tứ Quân, Bát Trân…) → điểm cao → lên đầu. Tiện nhập thuốc/châm cứu.
-- (Dữ liệu legacy không có link bệnh nên dùng độ thường-dùng-của-vị làm proxy "thông dụng".)
-- Chạy SAU add-so-bai-thuoc.sql (cần vi_thuoc.so_bai_thuoc).
ALTER TABLE phuong_thang ADD COLUMN IF NOT EXISTS diem_pho_bien INT NOT NULL DEFAULT 0;

-- Điểm = (TỔNG so_bai_thuoc các vị khớp được) / (TỔNG số vị trong bài). Chia cho TỔNG số vị (kể cả vị
-- chưa khớp) nên bài có nhiều vị lạ/hiếm bị phạt → nổi cổ phương gồm TOÀN vị quen (Tứ Quân, Tứ Vật…),
-- không méo như avg-chỉ-trên-vị-khớp (1 vị Cam Thảo khớp ≠ cả bài thông dụng).
UPDATE phuong_thang p SET diem_pho_bien = (
  COALESCE((
    SELECT sum(v.so_bai_thuoc)
    FROM jsonb_array_elements(COALESCE(p.thanh_phan, '[]'::jsonb)) e
    JOIN vi_thuoc v ON v.id = NULLIF(e->>'id', '')::int
  ), 0) / GREATEST(jsonb_array_length(COALESCE(p.thanh_phan, '[]'::jsonb)), 1)
)::int;

CREATE INDEX IF NOT EXISTS idx_phuong_thang_pho_bien ON phuong_thang (diem_pho_bien DESC);
