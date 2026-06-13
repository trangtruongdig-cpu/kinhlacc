-- Chuẩn hóa triệu chứng về bảng trieu_chung + các bảng nối.
-- Mục tiêu: trieu_chung trở thành nguồn dữ liệu chuẩn; cột text chỉ giữ vai trò mirror tương thích.

CREATE TABLE IF NOT EXISTS bai_thuoc_trieu_chung (
  id_bai_thuoc INTEGER NOT NULL REFERENCES bai_thuoc(id) ON DELETE CASCADE,
  id_trieu_chung INTEGER NOT NULL REFERENCES trieu_chung(id) ON DELETE CASCADE,
  PRIMARY KEY (id_bai_thuoc, id_trieu_chung)
);

CREATE INDEX IF NOT EXISTS idx_bt_tc_id_trieu_chung ON bai_thuoc_trieu_chung (id_trieu_chung);

-- 1) Backfill từ bai_thuoc.trieu_chung -> bai_thuoc_trieu_chung
WITH parts AS (
  SELECT
    bt.id AS id_bai_thuoc,
    lower(left(trim(x), 255)) AS tc_key,
    left(trim(x), 255) AS tc_name
  FROM bai_thuoc bt,
       regexp_split_to_table(coalesce(bt.trieu_chung, ''), '[,\n\r;，、]+') AS x
  WHERE trim(x) <> ''
),
ins_tc AS (
  INSERT INTO trieu_chung (ten_trieu_chung)
  SELECT DISTINCT p.tc_name
  FROM parts p
  LEFT JOIN trieu_chung tc ON lower(trim(tc.ten_trieu_chung)) = p.tc_key
  WHERE tc.id IS NULL
  ON CONFLICT DO NOTHING
)
INSERT INTO bai_thuoc_trieu_chung (id_bai_thuoc, id_trieu_chung)
SELECT DISTINCT p.id_bai_thuoc, tc.id
FROM parts p
JOIN trieu_chung tc ON lower(trim(tc.ten_trieu_chung)) = p.tc_key
ON CONFLICT DO NOTHING;

-- 2) Backfill từ benh_dong_y.trieuchung -> benh_dong_y_trieu_chung
WITH parts AS (
  SELECT
    b.id AS id_benh_dong_y,
    lower(left(trim(x), 255)) AS tc_key,
    left(trim(x), 255) AS tc_name
  FROM benh_dong_y b,
       regexp_split_to_table(coalesce(b.trieuchung, ''), '[,\n\r;，、]+') AS x
  WHERE trim(x) <> ''
),
ins_tc AS (
  INSERT INTO trieu_chung (ten_trieu_chung)
  SELECT DISTINCT p.tc_name
  FROM parts p
  LEFT JOIN trieu_chung tc ON lower(trim(tc.ten_trieu_chung)) = p.tc_key
  WHERE tc.id IS NULL
  ON CONFLICT DO NOTHING
)
INSERT INTO benh_dong_y_trieu_chung (id_benh_dong_y, id_trieu_chung)
SELECT DISTINCT p.id_benh_dong_y, tc.id
FROM parts p
JOIN trieu_chung tc ON lower(trim(tc.ten_trieu_chung)) = p.tc_key
ON CONFLICT DO NOTHING;

-- 3) Backfill từ phap_tri.trieu_chung_mo_ta -> phap_tri_trieu_chung
WITH parts AS (
  SELECT
    pt.id AS id_phap_tri,
    lower(left(trim(x), 255)) AS tc_key,
    left(trim(x), 255) AS tc_name
  FROM phap_tri pt,
       regexp_split_to_table(coalesce(pt.trieu_chung_mo_ta, ''), '[,\n\r;，、]+') AS x
  WHERE trim(x) <> ''
),
ins_tc AS (
  INSERT INTO trieu_chung (ten_trieu_chung)
  SELECT DISTINCT p.tc_name
  FROM parts p
  LEFT JOIN trieu_chung tc ON lower(trim(tc.ten_trieu_chung)) = p.tc_key
  WHERE tc.id IS NULL
  ON CONFLICT DO NOTHING
)
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung)
SELECT DISTINCT p.id_phap_tri, tc.id
FROM parts p
JOIN trieu_chung tc ON lower(trim(tc.ten_trieu_chung)) = p.tc_key
ON CONFLICT DO NOTHING;
