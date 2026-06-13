-- Triệu chứng trong phap_tri.trieu_chung_mo_ta mà chưa có trong trieu_chung → tạo bản ghi mới.
-- Tách token: , ， 、 ; ； xuống dòng; bỏ tiền tố dạng "- ", "• " (giống app).
-- Khớp danh mục: không phân biệt hoa thường.
-- Sau khi chạy INSERT, nên chạy lại migrate-phap-tri-trieu-chung-m2m-backfill.sql để đổ đầy phap_tri_trieu_chung.

-- ─── Bước A: chỉ xem (chạy riêng nếu muốn kiểm tra) ───
WITH expanded AS (
    SELECT DISTINCT
        trim(
            both
            from
            regexp_replace(t.tok, '^\s*[-•*·]\s+', '', 'g')
        ) AS name
    FROM phap_tri p
        CROSS JOIN LATERAL regexp_split_to_table(
            coalesce(p.trieu_chung_mo_ta, ''),
            E'[,，、;；\n\r]+'
        ) AS t(tok)
    WHERE coalesce(trim(both from p.trieu_chung_mo_ta), '') <> ''
),
missing AS (
    SELECT e.name
    FROM expanded e
    WHERE e.name <> ''
      AND NOT EXISTS (
          SELECT 1
          FROM trieu_chung tc
          WHERE lower(trim(both from tc.ten_trieu_chung)) = lower(e.name)
      )
)
SELECT name AS trieu_chung_chua_co_trong_danh_muc
FROM missing
ORDER BY lower(name), name;

-- ─── Bước B: tạo mới (chạy sau khi đã xem A; cùng logic lọc) ───
WITH expanded AS (
    SELECT DISTINCT
        trim(
            both
            from
            regexp_replace(t.tok, '^\s*[-•*·]\s+', '', 'g')
        ) AS name
    FROM phap_tri p
        CROSS JOIN LATERAL regexp_split_to_table(
            coalesce(p.trieu_chung_mo_ta, ''),
            E'[,，、;；\n\r]+'
        ) AS t(tok)
    WHERE coalesce(trim(both from p.trieu_chung_mo_ta), '') <> ''
),
missing AS (
    SELECT e.name
    FROM expanded e
    WHERE e.name <> ''
      AND NOT EXISTS (
          SELECT 1
          FROM trieu_chung tc
          WHERE lower(trim(both from tc.ten_trieu_chung)) = lower(e.name)
      )
)
INSERT INTO trieu_chung (ten_trieu_chung)
SELECT DISTINCT ON (lower(m.name)) left(m.name, 255)
FROM missing m
ORDER BY lower(m.name), length(m.name), m.name;
