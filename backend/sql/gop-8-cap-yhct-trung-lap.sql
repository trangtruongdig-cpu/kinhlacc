-- ============================================================================
-- Gop 8 cap the trung lap (cung 1 khai niem Dong Y kinh dien, chi khac cach viet)
-- phat hien qua hoi dong 3 giam khao doc lap (thuat ngu / cong thuc / an toan
-- lam sang) — 3/3 hoac 2/3 phieu MERGE cho tung cap. 2 cap con lai (Tam Khi Hu
-- vs Tam duong bat tuc-Tam khi hu; Tam huyet hu vs Tam am bat tuc-Tam huyet hu)
-- ca 3 giam khao deu KEEP_SEPARATE vi cong thuc khac THANH PHAN TANG PHU thuc
-- su (co to chuc ma ben kia hoan toan khong co) — KHONG gop.
-- ============================================================================

BEGIN;

-- p2: legacy_tam_duong_bat_tuc_tam_duong_hu -> tam_duong_hu (3/3 MERGE)
UPDATE benh_dong_y_excel SET aliases = aliases || '["Tâm dương bất túc - Tâm dương hư"]'::jsonb
WHERE code = 'tam_duong_hu';
DELETE FROM benh_dong_y_excel WHERE code = 'legacy_tam_duong_bat_tuc_tam_duong_hu';

-- p3: legacy_tam_duong_bat_tuc_tam_duong_hu_suy -> tam_duong_hu_suy (3/3 MERGE)
UPDATE benh_dong_y_excel SET aliases = aliases || '["Tâm dương bất túc - Tâm dương hư suy"]'::jsonb
WHERE code = 'tam_duong_hu_suy';
DELETE FROM benh_dong_y_excel WHERE code = 'legacy_tam_duong_bat_tuc_tam_duong_hu_suy';

-- p4: legacy_tam_am_bat_tuc_tam_am_hu -> tam_am_hu (3/3 MERGE)
UPDATE benh_dong_y_excel SET aliases = aliases || '["Tâm âm bất túc - Tâm âm hư"]'::jsonb
WHERE code = 'tam_am_hu';
DELETE FROM benh_dong_y_excel WHERE code = 'legacy_tam_am_bat_tuc_tam_am_hu';

-- p6: legacy_tam_hoa_thuong_vien_tam_hoa_cang_thinh -> tam_hoa_thuong_viem (2/3 MERGE)
UPDATE benh_dong_y_excel SET aliases = aliases || '["Tâm hoả thượng viên (Tâm hoả cang thịnh)"]'::jsonb
WHERE code = 'tam_hoa_thuong_viem';
DELETE FROM benh_dong_y_excel WHERE code = 'legacy_tam_hoa_thuong_vien_tam_hoa_cang_thinh';

-- p7: legacy_tieu_truong_thuc_nhiet_tam_di_nhiet_sang_tieu_truong -> tam_di_nhiet_sang_tieu_truong (3/3 MERGE)
UPDATE benh_dong_y_excel SET aliases = aliases || '["Tiểu trường thực nhiệt (Tâm di nhiệt sang tiểu trường)"]'::jsonb
WHERE code = 'tam_di_nhiet_sang_tieu_truong';
DELETE FROM benh_dong_y_excel WHERE code = 'legacy_tieu_truong_thuc_nhiet_tam_di_nhiet_sang_tieu_truong';

-- p8: legacy_can_uat_can_khi_uat_ket_can_khi_bat_thu_can_khi_khong_tha_lo -> can_khi_uat_ket (3/3 MERGE)
UPDATE benh_dong_y_excel SET aliases = aliases || '["Can uất (can khí uất kết, can khí bất thư) (can khí không thả lỏng):"]'::jsonb
WHERE code = 'can_khi_uat_ket';
DELETE FROM benh_dong_y_excel WHERE code = 'legacy_can_uat_can_khi_uat_ket_can_khi_bat_thu_can_khi_khong_tha_lo';

-- p9: legacy_am_nhiet_can_am_thap_nhiet -> dam_nhiet (3/3 MERGE)
UPDATE benh_dong_y_excel SET aliases = aliases || '["Đởm nhiệt (can đởm thấp nhiệt)"]'::jsonb
WHERE code = 'dam_nhiet';
DELETE FROM benh_dong_y_excel WHERE code = 'legacy_am_nhiet_can_am_thap_nhiet';

-- p10: legacy_tam_ty_luong_hu -> tam_ty_luong_hu (3/3 MERGE)
UPDATE benh_dong_y_excel SET aliases = aliases || '["Tâm tỳ lường hư"]'::jsonb
WHERE code = 'tam_ty_luong_hu';
DELETE FROM benh_dong_y_excel WHERE code = 'legacy_tam_ty_luong_hu';

COMMIT;
