-- ============================================================================
-- Them cot aliases (ten goi khac) + gop 4 cap "trung cong thuc" phat hien khi
-- doi chieu 21 the moi voi du lieu hien co — theo lua chon ten chinh cua nguoi
-- dung. Ten bi gop duoc GIU LAI trong aliases (khong mat du lieu), hien o man
-- chi tiet/sua.
-- ============================================================================

BEGIN;

ALTER TABLE benh_dong_y_excel ADD COLUMN IF NOT EXISTS aliases jsonb DEFAULT '[]'::jsonb;
ALTER TABLE benh_dong_y_hien_dai ADD COLUMN IF NOT EXISTS aliases jsonb DEFAULT '[]'::jsonb;

-- (1) Viêm loét dạ dày tá tràng  <-  Vị quản thống do Tỳ Thực
UPDATE benh_dong_y_excel SET aliases = aliases || '["Vị quản thống do Tỳ Thực"]'::jsonb
WHERE code = 'viem_loet_da_day_ta_trang';
DELETE FROM benh_dong_y_excel WHERE code = 'legacy_vi_quan_thong_do_ty_thuc';

-- (2) Đau dạ dày hẹp môn vị  <-  Vị quản thống do Đảm Thực
UPDATE benh_dong_y_excel SET aliases = aliases || '["Vị quản thống do Đảm Thực"]'::jsonb
WHERE code = 'dau_da_day_hep_mon_vi';
DELETE FROM benh_dong_y_excel WHERE code = 'legacy_vi_quan_thong_do_am_thuc';

-- (3) Thực tiết (Chứng đau bụng trên)  <-  Đau bụng trên sôi lục bục
UPDATE benh_dong_y_excel SET aliases = aliases || '["Đau bụng trên sôi lục bục"]'::jsonb
WHERE code = 'legacy_thuc_tiet_chung_au_bung_tren';
DELETE FROM benh_dong_y_excel WHERE code = 'dau_bung_tren_soi_luc_buc';

-- (4) Bệnh suy Tuyến Giáp (hien_dai)  <-  Oan uất thành bệnh (excel)
UPDATE benh_dong_y_hien_dai SET aliases = aliases || '["Oan uất thành bệnh"]'::jsonb
WHERE code = 'HD004';
DELETE FROM benh_dong_y_excel WHERE code = 'legacy_oan_uat_thanh_benh';

COMMIT;
