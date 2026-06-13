-- =============================================================================
-- ⚠️  XOÁ TOÀN BỘ DỮ LIỆU vi_thuoc + bai_thuoc + mọi liên kết phụ thuộc
-- =============================================================================
-- Lệnh này KHÔNG THỂ HOÀN TÁC nếu chưa backup.
-- Khuyến nghị backup trước khi chạy:
--   pg_dump -t vi_thuoc -t bai_thuoc \
--           -t bai_thuoc_chi_tiet -t bai_thuoc_phap_tri -t bai_thuoc_trieu_chung \
--           -t vi_thuoc_chu_tri -t vi_thuoc_cong_dung \
--           -t vi_thuoc_kieng_ky -t vi_thuoc_ten_goi_khac \
--           -t nhom_nho_vi_thuoc \
--           -Fc -f vi-thuoc-bai-thuoc-backup-$(date +%F).dump $DATABASE
--
-- Các bảng có FK -> vi_thuoc(id):  (ON DELETE CASCADE)
--   - bai_thuoc_chi_tiet     (thành phần các bài thuốc)
--   - vi_thuoc_chu_tri       (link vị thuốc ↔ chủ trị)
--   - vi_thuoc_cong_dung     (link vị thuốc ↔ công dụng)
--   - vi_thuoc_kieng_ky      (link vị thuốc ↔ kiêng kỵ)
--   - vi_thuoc_ten_goi_khac  (tên gọi khác của vị thuốc)
--   - nhom_nho_vi_thuoc      (link nhóm nhỏ dược lý ↔ vị thuốc)
--
-- Các bảng có FK -> bai_thuoc(id):  (CASCADE / theo định nghĩa TypeORM)
--   - bai_thuoc_chi_tiet     (cũng bị wipe do FK vi_thuoc)
--   - bai_thuoc_phap_tri     (link bài thuốc ↔ pháp trị)
--   - bai_thuoc_trieu_chung  (link bài thuốc ↔ triệu chứng)
--
-- TRUNCATE ... CASCADE sẽ tự dọn TẤT CẢ bảng trên và reset sequence id về 1.
-- =============================================================================

-- Bọc trong transaction để có thể ROLLBACK nếu chạy nhầm.
-- Đọc kỹ output COUNT trước khi COMMIT.
BEGIN;

-- Đếm trước khi xoá (để xác nhận phạm vi):
SELECT 'vi_thuoc'             AS tbl, COUNT(*) AS rows FROM vi_thuoc
UNION ALL SELECT 'bai_thuoc',              COUNT(*) FROM bai_thuoc
UNION ALL SELECT 'bai_thuoc_chi_tiet',     COUNT(*) FROM bai_thuoc_chi_tiet
UNION ALL SELECT 'bai_thuoc_phap_tri',     COUNT(*) FROM bai_thuoc_phap_tri
UNION ALL SELECT 'bai_thuoc_trieu_chung',  COUNT(*) FROM bai_thuoc_trieu_chung
UNION ALL SELECT 'vi_thuoc_chu_tri',       COUNT(*) FROM vi_thuoc_chu_tri
UNION ALL SELECT 'vi_thuoc_cong_dung',     COUNT(*) FROM vi_thuoc_cong_dung
UNION ALL SELECT 'vi_thuoc_kieng_ky',      COUNT(*) FROM vi_thuoc_kieng_ky
UNION ALL SELECT 'vi_thuoc_ten_goi_khac',  COUNT(*) FROM vi_thuoc_ten_goi_khac
UNION ALL SELECT 'nhom_nho_vi_thuoc',      COUNT(*) FROM nhom_nho_vi_thuoc;

-- Truncate cả 2 bảng cha trong cùng 1 lệnh: PostgreSQL sẽ cascade hết các bảng con.
TRUNCATE TABLE vi_thuoc, bai_thuoc RESTART IDENTITY CASCADE;

-- Đếm lại sau xoá (phải = 0):
SELECT 'vi_thuoc'             AS tbl, COUNT(*) AS rows FROM vi_thuoc
UNION ALL SELECT 'bai_thuoc',              COUNT(*) FROM bai_thuoc
UNION ALL SELECT 'bai_thuoc_chi_tiet',     COUNT(*) FROM bai_thuoc_chi_tiet
UNION ALL SELECT 'bai_thuoc_phap_tri',     COUNT(*) FROM bai_thuoc_phap_tri
UNION ALL SELECT 'bai_thuoc_trieu_chung',  COUNT(*) FROM bai_thuoc_trieu_chung
UNION ALL SELECT 'vi_thuoc_chu_tri',       COUNT(*) FROM vi_thuoc_chu_tri
UNION ALL SELECT 'vi_thuoc_cong_dung',     COUNT(*) FROM vi_thuoc_cong_dung
UNION ALL SELECT 'vi_thuoc_kieng_ky',      COUNT(*) FROM vi_thuoc_kieng_ky
UNION ALL SELECT 'vi_thuoc_ten_goi_khac',  COUNT(*) FROM vi_thuoc_ten_goi_khac
UNION ALL SELECT 'nhom_nho_vi_thuoc',      COUNT(*) FROM nhom_nho_vi_thuoc;

-- ⚠️  Bước cuối: kiểm tra kết quả trên rồi GÕ MỘT TRONG HAI lệnh sau:
--     COMMIT;     -- chấp nhận xoá vĩnh viễn
--     ROLLBACK;   -- huỷ xoá, trả về trạng thái cũ
