-- Đếm sẵn số BÀI THUỐC mỗi vị thuốc xuất hiện (để sắp "vị thường dùng" lên đầu + hiện badge).
-- Nguồn đếm: phuong_thang.thanh_phan (JSONB) chứa {id: <vi_thuoc.id>} — có GIN index nên nhanh.
-- Chạy lại bất cứ lúc nào để cập nhật (vd sau khi nạp thêm bài thuốc).
ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS so_bai_thuoc INT NOT NULL DEFAULT 0;

UPDATE vi_thuoc v SET so_bai_thuoc = COALESCE((
  SELECT count(*) FROM phuong_thang p
  WHERE p.thanh_phan @> jsonb_build_array(jsonb_build_object('id', v.id))
), 0);

CREATE INDEX IF NOT EXISTS idx_vi_thuoc_so_bai ON vi_thuoc (so_bai_thuoc DESC);
