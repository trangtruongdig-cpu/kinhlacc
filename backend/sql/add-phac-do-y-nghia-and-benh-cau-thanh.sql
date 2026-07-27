-- ============================================================================
-- Phương huyệt: (1) Ý NGHĨA từng huyệt + (2) GỘP THỂ KÉP
-- ----------------------------------------------------------------------------
-- Chạy thủ công bằng psql (TypeORM synchronize đang TẮT). An toàn chạy lại nhiều
-- lần (IF NOT EXISTS / ON CONFLICT). Không xoá dữ liệu.
--
--  (1) y_nghia_huyet: ý nghĩa châm huyệt đó TRONG BỐI CẢNH 1 chứng — vd "Bổ Tỳ Vị",
--      "Tứ hoa liệu pháp — bồi bổ khí huyết". KHÁC ghi_chu_ky_thuat (kỹ thuật châm:
--      độ sâu, bổ/tả pháp…). Soạn từ phần "giải nghĩa phương huyệt" (giainghia_phuyet
--      / phuyet_chamcuu của benh_dong_y).
--
--  (2) benh_cau_thanh: khai báo 1 chứng "kép / lưỡng hư" GỒM những chứng ĐƠN nào.
--      Khi hiển thị phương huyệt cho thể kép → gộp phương huyệt các thể đơn + huyệt
--      riêng của thể kép (khử trùng theo huyệt). Thay cho bảng alias gán cứng ở FE.
-- ============================================================================

BEGIN;

-- (1) Cột ý nghĩa từng huyệt trong 1 phác đồ
ALTER TABLE phac_do_dieu_tri
  ADD COLUMN IF NOT EXISTS y_nghia_huyet text;

-- (2) Bảng cấu thành thể kép (compound → component), cùng trỏ về benh_dong_y
CREATE TABLE IF NOT EXISTS benh_cau_thanh (
  id           serial PRIMARY KEY,
  compound_id  integer NOT NULL REFERENCES benh_dong_y(id) ON DELETE CASCADE,
  component_id integer NOT NULL REFERENCES benh_dong_y(id) ON DELETE CASCADE,
  thu_tu       integer NOT NULL DEFAULT 0,
  ghi_chu      text,
  CONSTRAINT benh_cau_thanh_uniq UNIQUE (compound_id, component_id)
);

CREATE INDEX IF NOT EXISTS benh_cau_thanh_compound_idx ON benh_cau_thanh (compound_id);

COMMIT;
