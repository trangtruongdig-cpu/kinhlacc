-- ============================================================================
-- Phan loai lai 17/21 the vua them: dang la mo hinh BAT CUONG TANG PHU kieu YHCT
-- (Tam/Can/Ty/Vi... hu/thuc, tinh chi gay benh) nhung bi dua nham vao
-- benh_dong_y_hien_dai (YHHD) — chuyen sang benh_dong_y_excel (YHCT) cho dung
-- phan loai, khop voi phong cach 47 the goc cua bang nay (Tam Khi Hu, Can Am Bat
-- Tuc...). Giu nguyen 4 the con lai o hien_dai vi la ten benh/dieu kien mang tinh
-- 'benh danh hien dai' (Than kinh chuc nang, Huyen van do huyet ap cao) — dung
-- phong cach voi cac the goc cua bang hien_dai (Gian dong Mach Vanh, Dau lung do...).
--
-- output_cell doi tu AD-series (hien_dai) sang AG-series (excel, tiep sau AG48)
-- de khop quy uoc cua bang dich; noi dung logic_expression GIU NGUYEN khong doi.
-- ============================================================================

BEGIN;

-- legacy_tam_duong_bat_tuc_tam_khi_hu
DELETE FROM benh_dong_y_hien_dai WHERE code = 'legacy_tam_duong_bat_tuc_tam_khi_hu';
INSERT INTO benh_dong_y_excel (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tam_duong_bat_tuc_tam_khi_hu', 'Tâm dương bất túc - Tâm khí hư', 'AG49',
   '=IF(AND(E11<0;E12<0;E26<0;AN11<0;AQ11<0);AG49&", ";"")',
   '(E11 < 0) AND (E12 < 0) AND (E26 < 0) AND (AN11 < 0) AND (AQ11 < 0)',
   'CASE WHEN E11 < 0 AND E12 < 0 AND E26 < 0 AND AN11 < 0 AND AQ11 < 0 THEN CONCAT(AG49, '', '') ELSE '''' END',
   'CASE WHEN E11 < 0 AND E12 < 0 AND E26 < 0 AND AN11 < 0 AND AQ11 < 0 THEN 1 ELSE 0 END')
ON CONFLICT (code) DO NOTHING;

-- legacy_tam_duong_bat_tuc_tam_duong_hu
DELETE FROM benh_dong_y_hien_dai WHERE code = 'legacy_tam_duong_bat_tuc_tam_duong_hu';
INSERT INTO benh_dong_y_excel (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tam_duong_bat_tuc_tam_duong_hu', 'Tâm dương bất túc - Tâm dương hư', 'AG50',
   '=IF(AND(E11<0;E23<0;AN11<0;AQ11<0);AG50&", ";"")',
   '(E11 < 0) AND (E23 < 0) AND (AN11 < 0) AND (AQ11 < 0)',
   'CASE WHEN E11 < 0 AND E23 < 0 AND AN11 < 0 AND AQ11 < 0 THEN CONCAT(AG50, '', '') ELSE '''' END',
   'CASE WHEN E11 < 0 AND E23 < 0 AND AN11 < 0 AND AQ11 < 0 THEN 1 ELSE 0 END')
ON CONFLICT (code) DO NOTHING;

-- legacy_tam_duong_bat_tuc_tam_duong_hu_suy
DELETE FROM benh_dong_y_hien_dai WHERE code = 'legacy_tam_duong_bat_tuc_tam_duong_hu_suy';
INSERT INTO benh_dong_y_excel (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tam_duong_bat_tuc_tam_duong_hu_suy', 'Tâm dương bất túc - Tâm dương hư suy', 'AG51',
   '=IF(AND(E11<0;E12<0;E15>0;E22<0;E26<0;AN11<0;AQ11<0);AG51&", ";"")',
   '(E11 < 0) AND (E12 < 0) AND (E15 > 0) AND (E22 < 0) AND (E26 < 0) AND (AN11 < 0) AND (AQ11 < 0)',
   'CASE WHEN E11 < 0 AND E12 < 0 AND E15 > 0 AND E22 < 0 AND E26 < 0 AND AN11 < 0 AND AQ11 < 0 THEN CONCAT(AG51, '', '') ELSE '''' END',
   'CASE WHEN E11 < 0 AND E12 < 0 AND E15 > 0 AND E22 < 0 AND E26 < 0 AND AN11 < 0 AND AQ11 < 0 THEN 1 ELSE 0 END')
ON CONFLICT (code) DO NOTHING;

-- legacy_tam_am_bat_tuc_tam_am_hu
DELETE FROM benh_dong_y_hien_dai WHERE code = 'legacy_tam_am_bat_tuc_tam_am_hu';
INSERT INTO benh_dong_y_excel (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tam_am_bat_tuc_tam_am_hu', 'Tâm âm bất túc - Tâm âm hư', 'AG52',
   '=IF(AND(E11<0;E15>0;E23>0;AN11<0;AQ11<0);AG52&", ";"")',
   '(E11 < 0) AND (E15 > 0) AND (E23 > 0) AND (AN11 < 0) AND (AQ11 < 0)',
   'CASE WHEN E11 < 0 AND E15 > 0 AND E23 > 0 AND AN11 < 0 AND AQ11 < 0 THEN CONCAT(AG52, '', '') ELSE '''' END',
   'CASE WHEN E11 < 0 AND E15 > 0 AND E23 > 0 AND AN11 < 0 AND AQ11 < 0 THEN 1 ELSE 0 END')
ON CONFLICT (code) DO NOTHING;

-- legacy_tam_am_bat_tuc_tam_huyet_hu
DELETE FROM benh_dong_y_hien_dai WHERE code = 'legacy_tam_am_bat_tuc_tam_huyet_hu';
INSERT INTO benh_dong_y_excel (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tam_am_bat_tuc_tam_huyet_hu', 'Tâm âm bất túc - Tâm huyết hư', 'AG53',
   '=IF(AND(E11>0;E15>0;E22<0;E23>0;E25<0;E26<0;AN11>0;AQ11>0);AG53&", ";"")',
   '(E11 > 0) AND (E15 > 0) AND (E22 < 0) AND (E23 > 0) AND (E25 < 0) AND (E26 < 0) AND (AN11 > 0) AND (AQ11 > 0)',
   'CASE WHEN E11 > 0 AND E15 > 0 AND E22 < 0 AND E23 > 0 AND E25 < 0 AND E26 < 0 AND AN11 > 0 AND AQ11 > 0 THEN CONCAT(AG53, '', '') ELSE '''' END',
   'CASE WHEN E11 > 0 AND E15 > 0 AND E22 < 0 AND E23 > 0 AND E25 < 0 AND E26 < 0 AND AN11 > 0 AND AQ11 > 0 THEN 1 ELSE 0 END')
ON CONFLICT (code) DO NOTHING;

-- legacy_tam_hoa_thuong_vien_tam_hoa_cang_thinh
DELETE FROM benh_dong_y_hien_dai WHERE code = 'legacy_tam_hoa_thuong_vien_tam_hoa_cang_thinh';
INSERT INTO benh_dong_y_excel (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tam_hoa_thuong_vien_tam_hoa_cang_thinh', 'Tâm hoả thượng viên (Tâm hoả cang thịnh)', 'AG54',
   '=IF(AND(E11>0;E12>0;E13>0;E15>0;E23>0;E24>0;E25>0;E26>0;AN11>0;AQ11>0;AN24>0;AQ24>0);AG54&", ";"")',
   '(E11 > 0) AND (E12 > 0) AND (E13 > 0) AND (E15 > 0) AND (E23 > 0) AND (E24 > 0) AND (E25 > 0) AND (E26 > 0) AND (AN11 > 0) AND (AQ11 > 0) AND (AN24 > 0) AND (AQ24 > 0)',
   'CASE WHEN E11 > 0 AND E12 > 0 AND E13 > 0 AND E15 > 0 AND E23 > 0 AND E24 > 0 AND E25 > 0 AND E26 > 0 AND AN11 > 0 AND AQ11 > 0 AND AN24 > 0 AND AQ24 > 0 THEN CONCAT(AG54, '', '') ELSE '''' END',
   'CASE WHEN E11 > 0 AND E12 > 0 AND E13 > 0 AND E15 > 0 AND E23 > 0 AND E24 > 0 AND E25 > 0 AND E26 > 0 AND AN11 > 0 AND AQ11 > 0 AND AN24 > 0 AND AQ24 > 0 THEN 1 ELSE 0 END')
ON CONFLICT (code) DO NOTHING;

-- legacy_tieu_truong_thuc_nhiet_tam_di_nhiet_sang_tieu_truong
DELETE FROM benh_dong_y_hien_dai WHERE code = 'legacy_tieu_truong_thuc_nhiet_tam_di_nhiet_sang_tieu_truong';
INSERT INTO benh_dong_y_excel (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tieu_truong_thuc_nhiet_tam_di_nhiet_sang_tieu_truong', 'Tiểu trường thực nhiệt (Tâm di nhiệt sang tiểu trường)', 'AG55',
   '=IF(AND(E10>0;E11>0;E15>0;E21>0;AN11>0;AQ11>0);AG55&", ";"")',
   '(E10 > 0) AND (E11 > 0) AND (E15 > 0) AND (E21 > 0) AND (AN11 > 0) AND (AQ11 > 0)',
   'CASE WHEN E10 > 0 AND E11 > 0 AND E15 > 0 AND E21 > 0 AND AN11 > 0 AND AQ11 > 0 THEN CONCAT(AG55, '', '') ELSE '''' END',
   'CASE WHEN E10 > 0 AND E11 > 0 AND E15 > 0 AND E21 > 0 AND AN11 > 0 AND AQ11 > 0 THEN 1 ELSE 0 END')
ON CONFLICT (code) DO NOTHING;

-- legacy_can_uat_can_khi_uat_ket_can_khi_bat_thu_can_khi_khong_tha_lo
DELETE FROM benh_dong_y_hien_dai WHERE code = 'legacy_can_uat_can_khi_uat_ket_can_khi_bat_thu_can_khi_khong_tha_lo';
INSERT INTO benh_dong_y_excel (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_can_uat_can_khi_uat_ket_can_khi_bat_thu_can_khi_khong_tha_lo', 'Can uất (can khí uất kết, can khí bất thư) (can khí không thả lỏng):', 'AG56',
   '=IF(AND(E23<0;E25>0;AN25>0;AQ25>0);AG56&", ";"")',
   '(E23 < 0) AND (E25 > 0) AND (AN25 > 0) AND (AQ25 > 0)',
   'CASE WHEN E23 < 0 AND E25 > 0 AND AN25 > 0 AND AQ25 > 0 THEN CONCAT(AG56, '', '') ELSE '''' END',
   'CASE WHEN E23 < 0 AND E25 > 0 AND AN25 > 0 AND AQ25 > 0 THEN 1 ELSE 0 END')
ON CONFLICT (code) DO NOTHING;

-- legacy_am_nhiet_can_am_thap_nhiet
DELETE FROM benh_dong_y_hien_dai WHERE code = 'legacy_am_nhiet_can_am_thap_nhiet';
INSERT INTO benh_dong_y_excel (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_am_nhiet_can_am_thap_nhiet', 'Đảm nhiệt (can đảm thấp nhiệt)', 'AG57',
   '=IF(AND(E23>0;AN23>0;AQ23>0);AG57&", ";"")',
   '(E23 > 0) AND (AN23 > 0) AND (AQ23 > 0)',
   'CASE WHEN E23 > 0 AND AN23 > 0 AND AQ23 > 0 THEN CONCAT(AG57, '', '') ELSE '''' END',
   'CASE WHEN E23 > 0 AND AN23 > 0 AND AQ23 > 0 THEN 1 ELSE 0 END')
ON CONFLICT (code) DO NOTHING;

-- legacy_tam_ty_luong_hu
DELETE FROM benh_dong_y_hien_dai WHERE code = 'legacy_tam_ty_luong_hu';
INSERT INTO benh_dong_y_excel (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tam_ty_luong_hu', 'Tâm tỳ lường hư', 'AG58',
   '=IF(AND(E11<0;E26<0;AN11<0;AQ11<0;AN26<0;AQ26<0);AG58&", ";"")',
   '(E11 < 0) AND (E26 < 0) AND (AN11 < 0) AND (AQ11 < 0) AND (AN26 < 0) AND (AQ26 < 0)',
   'CASE WHEN E11 < 0 AND E26 < 0 AND AN11 < 0 AND AQ11 < 0 AND AN26 < 0 AND AQ26 < 0 THEN CONCAT(AG58, '', '') ELSE '''' END',
   'CASE WHEN E11 < 0 AND E26 < 0 AND AN11 < 0 AND AQ11 < 0 AND AN26 < 0 AND AQ26 < 0 THEN 1 ELSE 0 END')
ON CONFLICT (code) DO NOTHING;

-- legacy_vi_quan_thong_do_ty_thuc
DELETE FROM benh_dong_y_hien_dai WHERE code = 'legacy_vi_quan_thong_do_ty_thuc';
INSERT INTO benh_dong_y_excel (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_vi_quan_thong_do_ty_thuc', 'Vị quản thống do Tỳ Thực', 'AG59',
   '=IF(AND(E11>0;E13>0;E14>0;E15>0;E24>0;E25>0;E26>0);AG59&", ";"")',
   '(E11 > 0) AND (E13 > 0) AND (E14 > 0) AND (E15 > 0) AND (E24 > 0) AND (E25 > 0) AND (E26 > 0)',
   'CASE WHEN E11 > 0 AND E13 > 0 AND E14 > 0 AND E15 > 0 AND E24 > 0 AND E25 > 0 AND E26 > 0 THEN CONCAT(AG59, '', '') ELSE '''' END',
   'CASE WHEN E11 > 0 AND E13 > 0 AND E14 > 0 AND E15 > 0 AND E24 > 0 AND E25 > 0 AND E26 > 0 THEN 1 ELSE 0 END')
ON CONFLICT (code) DO NOTHING;

-- legacy_vi_quan_thong_do_am_thuc
DELETE FROM benh_dong_y_hien_dai WHERE code = 'legacy_vi_quan_thong_do_am_thuc';
INSERT INTO benh_dong_y_excel (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_vi_quan_thong_do_am_thuc', 'Vị quản thống do Đảm Thực', 'AG60',
   '=IF(AND(E23>0;E24>0;E25>0;E26>0);AG60&", ";"")',
   '(E23 > 0) AND (E24 > 0) AND (E25 > 0) AND (E26 > 0)',
   'CASE WHEN E23 > 0 AND E24 > 0 AND E25 > 0 AND E26 > 0 THEN CONCAT(AG60, '', '') ELSE '''' END',
   'CASE WHEN E23 > 0 AND E24 > 0 AND E25 > 0 AND E26 > 0 THEN 1 ELSE 0 END')
ON CONFLICT (code) DO NOTHING;

-- legacy_thuc_tiet_chung_au_bung_tren
DELETE FROM benh_dong_y_hien_dai WHERE code = 'legacy_thuc_tiet_chung_au_bung_tren';
INSERT INTO benh_dong_y_excel (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_thuc_tiet_chung_au_bung_tren', 'Thực tiết (Chứng đau bụng trên)', 'AG61',
   '=IF(AND(E12>0;E13>0;E14>0;E15>0;E22>0;E24>0;E25>0);AG61&", ";"")',
   '(E12 > 0) AND (E13 > 0) AND (E14 > 0) AND (E15 > 0) AND (E22 > 0) AND (E24 > 0) AND (E25 > 0)',
   'CASE WHEN E12 > 0 AND E13 > 0 AND E14 > 0 AND E15 > 0 AND E22 > 0 AND E24 > 0 AND E25 > 0 THEN CONCAT(AG61, '', '') ELSE '''' END',
   'CASE WHEN E12 > 0 AND E13 > 0 AND E14 > 0 AND E15 > 0 AND E22 > 0 AND E24 > 0 AND E25 > 0 THEN 1 ELSE 0 END')
ON CONFLICT (code) DO NOTHING;

-- legacy_tuc_gian_thanh_benh
DELETE FROM benh_dong_y_hien_dai WHERE code = 'legacy_tuc_gian_thanh_benh';
INSERT INTO benh_dong_y_excel (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tuc_gian_thanh_benh', 'Tức giận thành bệnh', 'AG62',
   '=IF(AND(E11>0;E25>0);AG62&", ";"")',
   '(E11 > 0) AND (E25 > 0)',
   'CASE WHEN E11 > 0 AND E25 > 0 THEN CONCAT(AG62, '', '') ELSE '''' END',
   'CASE WHEN E11 > 0 AND E25 > 0 THEN 1 ELSE 0 END')
ON CONFLICT (code) DO NOTHING;

-- legacy_tiec_xot_thanh_benh
DELETE FROM benh_dong_y_hien_dai WHERE code = 'legacy_tiec_xot_thanh_benh';
INSERT INTO benh_dong_y_excel (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tiec_xot_thanh_benh', 'Tiếc xót thành bệnh', 'AG63',
   '=IF(AND(E11>0;E22>0);AG63&", ";"")',
   '(E11 > 0) AND (E22 > 0)',
   'CASE WHEN E11 > 0 AND E22 > 0 THEN CONCAT(AG63, '', '') ELSE '''' END',
   'CASE WHEN E11 > 0 AND E22 > 0 THEN 1 ELSE 0 END')
ON CONFLICT (code) DO NOTHING;

-- legacy_oan_uat_thanh_benh
DELETE FROM benh_dong_y_hien_dai WHERE code = 'legacy_oan_uat_thanh_benh';
INSERT INTO benh_dong_y_excel (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_oan_uat_thanh_benh', 'Oan uất thành bệnh', 'AG64',
   '=IF(AND(E11>0;E15>0;E23<0;E25>0);AG64&", ";"")',
   '(E11 > 0) AND (E15 > 0) AND (E23 < 0) AND (E25 > 0)',
   'CASE WHEN E11 > 0 AND E15 > 0 AND E23 < 0 AND E25 > 0 THEN CONCAT(AG64, '', '') ELSE '''' END',
   'CASE WHEN E11 > 0 AND E15 > 0 AND E23 < 0 AND E25 > 0 THEN 1 ELSE 0 END')
ON CONFLICT (code) DO NOTHING;

-- legacy_lo_nghi_thanh_benh
DELETE FROM benh_dong_y_hien_dai WHERE code = 'legacy_lo_nghi_thanh_benh';
INSERT INTO benh_dong_y_excel (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_lo_nghi_thanh_benh', 'Lo nghĩ thành bệnh', 'AG65',
   '=IF(AND(E11>0;E26>0);AG65&", ";"")',
   '(E11 > 0) AND (E26 > 0)',
   'CASE WHEN E11 > 0 AND E26 > 0 THEN CONCAT(AG65, '', '') ELSE '''' END',
   'CASE WHEN E11 > 0 AND E26 > 0 THEN 1 ELSE 0 END')
ON CONFLICT (code) DO NOTHING;

COMMIT;