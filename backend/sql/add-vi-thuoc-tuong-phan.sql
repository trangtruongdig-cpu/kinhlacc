-- ============================================================================
-- Cấm kỵ phối ngũ: cặp vị thuốc TƯƠNG PHẢN (十八反) / TƯƠNG ÚY (十九畏)
-- ----------------------------------------------------------------------------
-- Bảng tham chiếu (không phải entity TypeORM) — engine phân tích bài thuốc quét
-- mọi cặp vị trong bài, trúng cặp nào thì cảnh báo.
--
-- An toàn để chạy lại nhiều lần (idempotent): CREATE TABLE IF NOT EXISTS + ON CONFLICT.
-- Seed map theo TÊN vị thuốc hiện có (khớp không phân biệt hoa/thường). Cặp nào có
-- vị chưa tồn tại trong `vi_thuoc` sẽ bị bỏ qua — xem SELECT chẩn đoán ở cuối.
-- ============================================================================

CREATE TABLE IF NOT EXISTS vi_thuoc_tuong_phan (
  id            SERIAL PRIMARY KEY,
  id_vi_thuoc_a INT NOT NULL REFERENCES vi_thuoc(id) ON DELETE CASCADE,
  id_vi_thuoc_b INT NOT NULL REFERENCES vi_thuoc(id) ON DELETE CASCADE,
  loai          VARCHAR(20) NOT NULL DEFAULT 'phản', -- 'phản' (tương phản) | 'úy' (tương úy)
  ghi_chu       TEXT,
  CONSTRAINT uq_vi_thuoc_tuong_phan UNIQUE (id_vi_thuoc_a, id_vi_thuoc_b, loai)
);

-- Phân giải tên vị thuốc → id: ưu tiên khớp đúng, rồi tiền tố ("Ô đầu" → "Ô Đầu Chế"), rồi tên gọi khác.
CREATE OR REPLACE FUNCTION resolve_vi_thuoc(p_name text) RETURNS int AS $$
  SELECT v.id FROM vi_thuoc v
  WHERE lower(btrim(v.ten_vi_thuoc)) = lower(btrim(p_name))
     OR lower(btrim(v.ten_vi_thuoc)) LIKE lower(btrim(p_name)) || ' %'
     OR v.id IN (
       SELECT id_vi_thuoc FROM vi_thuoc_ten_goi_khac
       WHERE lower(btrim(ten_goi_khac)) = lower(btrim(p_name))
     )
  ORDER BY (lower(btrim(v.ten_vi_thuoc)) = lower(btrim(p_name))) DESC, length(v.ten_vi_thuoc)
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Danh mục cặp kinh điển (tên_a, tên_b, loại, ghi chú nhóm).
WITH pairs(ten_a, ten_b, loai, ghi_chu) AS (
  VALUES
    -- ── 18 PHẢN ── Cam thảo phản tứ vị
    ('Cam thảo', 'Cam toại',   'phản', 'Cam thảo phản'),
    ('Cam thảo', 'Đại kích',   'phản', 'Cam thảo phản'),
    ('Cam thảo', 'Hải tảo',    'phản', 'Cam thảo phản'),
    ('Cam thảo', 'Nguyên hoa', 'phản', 'Cam thảo phản'),
    -- Ô đầu / Phụ tử (cùng nhóm ô đầu) phản
    ('Ô đầu',   'Bán hạ',    'phản', 'Ô đầu phản'),
    ('Ô đầu',   'Qua lâu',   'phản', 'Ô đầu phản'),
    ('Ô đầu',   'Bối mẫu',   'phản', 'Ô đầu phản'),
    ('Ô đầu',   'Bạch liễm', 'phản', 'Ô đầu phản'),
    ('Ô đầu',   'Bạch cập',  'phản', 'Ô đầu phản'),
    ('Phụ tử',  'Bán hạ',    'phản', 'Ô đầu phản (Phụ tử cùng nhóm)'),
    ('Phụ tử',  'Qua lâu',   'phản', 'Ô đầu phản (Phụ tử cùng nhóm)'),
    ('Phụ tử',  'Bối mẫu',   'phản', 'Ô đầu phản (Phụ tử cùng nhóm)'),
    ('Phụ tử',  'Bạch liễm', 'phản', 'Ô đầu phản (Phụ tử cùng nhóm)'),
    ('Phụ tử',  'Bạch cập',  'phản', 'Ô đầu phản (Phụ tử cùng nhóm)'),
    -- Lê lô phản chư sâm + tế tân + thược dược
    ('Lê lô', 'Nhân sâm',   'phản', 'Lê lô phản'),
    ('Lê lô', 'Đảng sâm',   'phản', 'Lê lô phản'),
    ('Lê lô', 'Sa sâm',     'phản', 'Lê lô phản'),
    ('Lê lô', 'Đan sâm',    'phản', 'Lê lô phản'),
    ('Lê lô', 'Huyền sâm',  'phản', 'Lê lô phản'),
    ('Lê lô', 'Khổ sâm',    'phản', 'Lê lô phản'),
    ('Lê lô', 'Tế tân',     'phản', 'Lê lô phản'),
    ('Lê lô', 'Bạch thược', 'phản', 'Lê lô phản'),
    ('Lê lô', 'Xích thược', 'phản', 'Lê lô phản'),
    -- ── 19 ÚY ──
    ('Lưu hoàng',  'Phác tiêu',     'úy', '19 úy'),
    ('Thủy ngân',  'Phê sương',     'úy', '19 úy'),
    ('Lang độc',   'Mật đà tăng',   'úy', '19 úy'),
    ('Ba đậu',     'Khiên ngưu',    'úy', '19 úy'),
    ('Đinh hương', 'Uất kim',       'úy', '19 úy'),
    ('Xuyên ô',    'Tê giác',       'úy', '19 úy'),
    ('Thảo ô',     'Tê giác',       'úy', '19 úy'),
    ('Nha tiêu',   'Tam lăng',      'úy', '19 úy'),
    ('Mang tiêu',  'Tam lăng',      'úy', '19 úy'),
    ('Nhục quế',   'Xích thạch chi','úy', '19 úy'),
    ('Quan quế',   'Xích thạch chi','úy', '19 úy'),
    ('Nhân sâm',   'Ngũ linh chi',  'úy', '19 úy')
),
resolved AS (
  SELECT p.loai, p.ghi_chu, p.ten_a, p.ten_b,
         resolve_vi_thuoc(p.ten_a) AS id_a,
         resolve_vi_thuoc(p.ten_b) AS id_b
  FROM pairs p
)
INSERT INTO vi_thuoc_tuong_phan (id_vi_thuoc_a, id_vi_thuoc_b, loai, ghi_chu)
SELECT LEAST(id_a, id_b), GREATEST(id_a, id_b), loai, ghi_chu
FROM resolved
WHERE id_a IS NOT NULL AND id_b IS NOT NULL AND id_a <> id_b
ON CONFLICT (id_vi_thuoc_a, id_vi_thuoc_b, loai) DO NOTHING;

-- Chẩn đoán: các cặp KHÔNG seed được vì thiếu vị thuốc trong DB (để bổ sung tên/dữ liệu sau).
WITH pairs(ten_a, ten_b, loai) AS (
  VALUES
    ('Cam thảo','Cam toại','phản'),('Cam thảo','Đại kích','phản'),('Cam thảo','Hải tảo','phản'),('Cam thảo','Nguyên hoa','phản'),
    ('Ô đầu','Bán hạ','phản'),('Ô đầu','Qua lâu','phản'),('Ô đầu','Bối mẫu','phản'),('Ô đầu','Bạch liễm','phản'),('Ô đầu','Bạch cập','phản'),
    ('Phụ tử','Bán hạ','phản'),('Phụ tử','Qua lâu','phản'),('Phụ tử','Bối mẫu','phản'),('Phụ tử','Bạch liễm','phản'),('Phụ tử','Bạch cập','phản'),
    ('Lê lô','Nhân sâm','phản'),('Lê lô','Đảng sâm','phản'),('Lê lô','Sa sâm','phản'),('Lê lô','Đan sâm','phản'),('Lê lô','Huyền sâm','phản'),('Lê lô','Khổ sâm','phản'),('Lê lô','Tế tân','phản'),('Lê lô','Bạch thược','phản'),('Lê lô','Xích thược','phản'),
    ('Lưu hoàng','Phác tiêu','úy'),('Thủy ngân','Phê sương','úy'),('Lang độc','Mật đà tăng','úy'),('Ba đậu','Khiên ngưu','úy'),('Đinh hương','Uất kim','úy'),('Xuyên ô','Tê giác','úy'),('Thảo ô','Tê giác','úy'),('Nha tiêu','Tam lăng','úy'),('Mang tiêu','Tam lăng','úy'),('Nhục quế','Xích thạch chi','úy'),('Quan quế','Xích thạch chi','úy'),('Nhân sâm','Ngũ linh chi','úy')
)
SELECT p.loai, p.ten_a, p.ten_b,
       (resolve_vi_thuoc(p.ten_a) IS NOT NULL) AS co_a,
       (resolve_vi_thuoc(p.ten_b) IS NOT NULL) AS co_b
FROM pairs p
WHERE resolve_vi_thuoc(p.ten_a) IS NULL OR resolve_vi_thuoc(p.ten_b) IS NULL
ORDER BY p.loai, p.ten_a, p.ten_b;
