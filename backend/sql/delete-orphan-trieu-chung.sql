-- =============================================================================
-- 🧹  XOÁ các TRIỆU CHỨNG "mồ côi" — không được tham chiếu bởi BẤT KỲ bảng nào khác
-- =============================================================================
-- Lệnh này KHÔNG THỂ HOÀN TÁC nếu chưa backup.
-- Khuyến nghị backup trước khi chạy:
--   pg_dump -t trieu_chung -Fc -f trieu-chung-backup-$(date +%F).dump $DATABASE
--
-- Một triệu chứng được coi là "có liên quan" nếu id của nó xuất hiện (qua cột
-- id_trieu_chung) ở ÍT NHẤT một trong các bảng nối sau. Mọi triệu chứng KHÔNG có
-- mặt ở bất kỳ bảng nào trong đây sẽ bị xoá:
--   1. bai_thuoc_trieu_chung          (bài thuốc ↔ triệu chứng)
--   2. quan_he_benh_trieu_chung       (bệnh Tây Y ↔ triệu chứng)
--   3. phap_tri_trieu_chung           (pháp trị / thể bệnh Đông Y ↔ triệu chứng)
--   4. benh_dong_y_trieu_chung        (bệnh Đông Y ↔ triệu chứng)
--   5. benh_dong_y_excel_trieu_chung  (bệnh Đông Y - Excel ↔ triệu chứng)
--
-- Nếu sau này phát sinh thêm bảng nối mới có cột id_trieu_chung, hãy dùng phiên
-- bản ĐỘNG ở cuối file (tự dò mọi bảng, không cần cập nhật danh sách tay).
-- =============================================================================

-- Bọc trong transaction để có thể ROLLBACK nếu chạy nhầm.
-- Đọc kỹ output trước khi COMMIT.
BEGIN;

-- 1) XEM TRƯỚC: danh sách triệu chứng mồ côi sẽ bị xoá.
SELECT tc.id, tc.ten_trieu_chung
FROM trieu_chung tc
WHERE NOT EXISTS (SELECT 1 FROM bai_thuoc_trieu_chung         x WHERE x.id_trieu_chung = tc.id)
  AND NOT EXISTS (SELECT 1 FROM quan_he_benh_trieu_chung      x WHERE x.id_trieu_chung = tc.id)
  AND NOT EXISTS (SELECT 1 FROM phap_tri_trieu_chung          x WHERE x.id_trieu_chung = tc.id)
  AND NOT EXISTS (SELECT 1 FROM benh_dong_y_trieu_chung       x WHERE x.id_trieu_chung = tc.id)
  AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_trieu_chung x WHERE x.id_trieu_chung = tc.id)
ORDER BY tc.id;

-- 2) Đếm phạm vi: tổng số / số mồ côi (số mồ côi = số dòng sắp bị xoá).
SELECT
  (SELECT COUNT(*) FROM trieu_chung) AS tong_so,
  COUNT(*) FILTER (
    WHERE NOT EXISTS (SELECT 1 FROM bai_thuoc_trieu_chung         x WHERE x.id_trieu_chung = tc.id)
      AND NOT EXISTS (SELECT 1 FROM quan_he_benh_trieu_chung      x WHERE x.id_trieu_chung = tc.id)
      AND NOT EXISTS (SELECT 1 FROM phap_tri_trieu_chung          x WHERE x.id_trieu_chung = tc.id)
      AND NOT EXISTS (SELECT 1 FROM benh_dong_y_trieu_chung       x WHERE x.id_trieu_chung = tc.id)
      AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_trieu_chung x WHERE x.id_trieu_chung = tc.id)
  ) AS so_mo_coi
FROM trieu_chung tc;

-- 3) XOÁ các triệu chứng mồ côi.
DELETE FROM trieu_chung tc
WHERE NOT EXISTS (SELECT 1 FROM bai_thuoc_trieu_chung         x WHERE x.id_trieu_chung = tc.id)
  AND NOT EXISTS (SELECT 1 FROM quan_he_benh_trieu_chung      x WHERE x.id_trieu_chung = tc.id)
  AND NOT EXISTS (SELECT 1 FROM phap_tri_trieu_chung          x WHERE x.id_trieu_chung = tc.id)
  AND NOT EXISTS (SELECT 1 FROM benh_dong_y_trieu_chung       x WHERE x.id_trieu_chung = tc.id)
  AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_trieu_chung x WHERE x.id_trieu_chung = tc.id);

-- 4) Kiểm tra lại: số mồ côi còn lại PHẢI = 0.
SELECT COUNT(*) AS mo_coi_con_lai
FROM trieu_chung tc
WHERE NOT EXISTS (SELECT 1 FROM bai_thuoc_trieu_chung         x WHERE x.id_trieu_chung = tc.id)
  AND NOT EXISTS (SELECT 1 FROM quan_he_benh_trieu_chung      x WHERE x.id_trieu_chung = tc.id)
  AND NOT EXISTS (SELECT 1 FROM phap_tri_trieu_chung          x WHERE x.id_trieu_chung = tc.id)
  AND NOT EXISTS (SELECT 1 FROM benh_dong_y_trieu_chung       x WHERE x.id_trieu_chung = tc.id)
  AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_trieu_chung x WHERE x.id_trieu_chung = tc.id);

-- ⚠️  Bước cuối: kiểm tra kết quả trên rồi GÕ MỘT TRONG HAI lệnh sau:
--     COMMIT;     -- chấp nhận xoá vĩnh viễn
--     ROLLBACK;   -- huỷ xoá, trả về trạng thái cũ


-- =============================================================================
-- (TUỲ CHỌN) PHIÊN BẢN ĐỘNG — tự dò MỌI bảng có cột id_trieu_chung
-- =============================================================================
-- Dùng khi không muốn liệt kê bảng nối bằng tay (vd. có thể phát sinh bảng mới).
-- Bỏ comment cả khối DO bên dưới để chạy THAY CHO bước 3 ở trên.
-- An toàn: nếu không tìm thấy bảng nối nào, sẽ RAISE EXCEPTION thay vì xoá sạch.
--
-- BEGIN;
-- DO $$
-- DECLARE
--   r    RECORD;
--   cond TEXT := '';
--   q    TEXT;
-- BEGIN
--   FOR r IN
--     SELECT c.table_name
--     FROM information_schema.columns c
--     WHERE c.column_name  = 'id_trieu_chung'
--       AND c.table_schema = current_schema()
--       AND c.table_name  <> 'trieu_chung'
--   LOOP
--     cond := cond || format(
--       ' AND NOT EXISTS (SELECT 1 FROM %I x WHERE x.id_trieu_chung = tc.id)',
--       r.table_name
--     );
--   END LOOP;
--
--   IF cond = '' THEN
--     RAISE EXCEPTION 'Không tìm thấy bảng nối nào tham chiếu id_trieu_chung — huỷ để tránh xoá toàn bộ.';
--   END IF;
--
--   q := 'DELETE FROM trieu_chung tc WHERE TRUE' || cond;
--   RAISE NOTICE 'Đang chạy: %', q;
--   EXECUTE q;
-- END $$;
-- COMMIT;   -- hoặc ROLLBACK;
