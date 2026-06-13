-- Liên kết phap_tri ↔ trieu_chung từ cột trieu_chung_mo_ta (tách đơn giản theo dấu phẩy).
-- Chạy sau khi bảng phap_tri_trieu_chung đã được tạo (TypeORM synchronize hoặc migration DDL).

INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung)
SELECT DISTINCT p.id, tc.id
FROM phap_tri p
CROSS JOIN LATERAL unnest(string_to_array(coalesce(p.trieu_chung_mo_ta, ''), ',')) AS u(raw_tok)
JOIN trieu_chung tc
  ON lower(trim(both from u.raw_tok)) = lower(trim(both from tc.ten_trieu_chung))
WHERE coalesce(trim(both from p.trieu_chung_mo_ta), '') <> ''
  AND trim(both from u.raw_tok) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM phap_tri_trieu_chung x
    WHERE x.id_phap_tri = p.id AND x.id_trieu_chung = tc.id
  );
