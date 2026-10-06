-- Chỉ mục GIN trigram cho `phuong_thang.tac_dung` và `vi_thuoc.chu_tri`.
--
-- VÌ SAO: Rada SEO khớp chủ trị vào `tac_dung` bằng `ILIKE '%…%'` (tới 8 mệnh đề mỗi lời gọi
-- `/rada/ho-so-cum`), và `%` ở đầu thì không chỉ mục B-tree nào đỡ được. Số đo 06/10/2026:
--
--   phuong_thang  33 MB  ·  3.875 lượt quét tuần tự  ·  51.751.295 dòng đọc
--   vi_thuoc     3,2 MB  ·    731 lượt quét tuần tự  ·     756.308 dòng đọc
--
-- Tab Góp Ý & Lỗi đã ghi hậu quả: 308 lượt "chậm" ở `/thu-vien` trên ba endpoint đụng đúng hai
-- bảng này (`/duoc-lieu` 120 lần, `/nguon` 97, `/phuong-thang` 91).
--
-- ⚠️ CONCURRENTLY: KHÔNG khoá bảng ghi. Bắt buộc ở đây vì đây là CSDL phòng chẩn trị đang chạy.
-- Đổi lại: lệnh này KHÔNG chạy được trong transaction, và nếu đứt giữa chừng nó để lại một chỉ
-- mục INVALID — phải `DROP INDEX` rồi tạo lại chứ không tự lành.
--
-- ⚠️ Chạy TỪNG LỆNH một, đừng bọc trong BEGIN/COMMIT.
--
-- Hoàn nguyên:
--   DROP INDEX CONCURRENTLY IF EXISTS idx_phuong_thang_tac_dung_trgm;
--   DROP INDEX CONCURRENTLY IF EXISTS idx_vi_thuoc_chu_tri_trgm;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_phuong_thang_tac_dung_trgm
  ON phuong_thang USING gin (tac_dung gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vi_thuoc_chu_tri_trgm
  ON vi_thuoc USING gin (chu_tri gin_trgm_ops);

-- Kiểm sau khi chạy (phải thấy "Bitmap Index Scan ... trgm", không còn "Seq Scan"):
--   EXPLAIN SELECT id FROM phuong_thang WHERE tac_dung ILIKE '%chảy máu cam%';
