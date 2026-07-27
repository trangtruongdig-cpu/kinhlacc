-- ============================================================================
-- Doi chieu thuat toan app goc (legacy_meridian_syndromes) vs app hien tai
-- ----------------------------------------------------------------------------
-- Chay thu cong bang psql (TypeORM synchronize dang TAT). Boc trong 1 transaction
-- de rollback duoc toan bo neu co loi giua chung.
--
-- (1) benh_dong_y_excel: sua 3 cong thuc logic_expression MAU THUAN THAT SU voi
--     mau dau app goc khai bao (phat hien qua bo danh gia 3-trang-thai doi chieu
--     tung dieu kien voi legacy_meridian_syndromes) — chi doi dau 1 to chuc bi dao
--     nguoc trong moi cong thuc, giu nguyen cac dieu kien khac (ke ca nguong bien
--     do ABS()>E7/E18 khong xac nhan duoc tu du lieu app goc, giu nguyen vi khong co
--     bang chung sai).
--
-- (2) benh_dong_y: sua 1 ban ghi bi dao TRAI<->PHAI toan bo 12 kinh so voi app goc
--     ('Trung Phong (Ket Dong Mach Nao)', id=66) — phat hien qua so cot truc tiep
--     (benh_dong_y cung schema voi legacy_meridian_syndromes).
--     LUU Y: 'Ty Duong Hu' (id=16) ban dau bi bao nham la loi trong 1 lan doi chieu
--     truoc — do 1 ban ghi TRUNG TEN rong (id=25) gay va cham khi so khop theo ten;
--     id=16 von da KHOP HOAN TOAN voi app goc, KHONG can sua, khong dong trong file nay.
--
-- (3) benh_dong_y_hien_dai: them 21 the con thieu (trong 22 the 'gap' phat hien khi
--     doi chieu 84 chung app goc — rieng 'Ty vi hu han' KHONG co du lieu dau to chuc
--     nao trong app goc (toan bo = 0, chi co mo ta van ban) nen KHONG dua vao day,
--     de nguoi dung tu bo sung sau khi co tai lieu). Cong thuc la KHUNG DE XUAT dich
--     nguyen tu dau app goc (E-cell + AN/AQ), CHUA co nguong bien do (app goc khong
--     luu do lon) — nen ra soat lam sang truoc khi dua vao su dung that.
-- ============================================================================

BEGIN;

-- ---- (1) benh_dong_y_excel: sua 3 cong thuc mau thuan voi app goc ----

-- phe_khi_hu: E15<0 -> E15>0 (app goc: Phe duong, khong am, cho chung nay)
UPDATE benh_dong_y_excel SET
  excel_formula = '=IF(AND(E13>0;E15>0;ABS(E15)>E7;E21<0;E22>0;E23<0;E26<0);AG32&", ";"")',
  logic_expression = '(E13 > 0) AND (E15 > 0) AND (ABS(E15) > E7) AND (E21 < 0) AND (E22 > 0) AND (E23 < 0) AND (E26 < 0)',
  sql_case_text = 'CASE WHEN E13 > 0 AND E15 > 0 AND ABS(E15) > E7 AND E21 < 0 AND E22 > 0 AND E23 < 0 AND E26 < 0 THEN CONCAT(AG32, '', '') ELSE '''' END',
  sql_case_boolean = 'CASE WHEN E13 > 0 AND E15 > 0 AND ABS(E15) > E7 AND E21 < 0 AND E22 > 0 AND E23 < 0 AND E26 < 0 THEN 1 ELSE 0 END'
WHERE code = 'phe_khi_hu';

-- ty_duong_hu: E26<0 -> E26>0 (app goc: Ty duong, khong am, cho chung nay)
UPDATE benh_dong_y_excel SET
  excel_formula = '=IF(AND(E23<0;E26>0;ABS(E26)>E18);AG17&", ";"")',
  logic_expression = '(E23 < 0) AND (E26 > 0) AND (ABS(E26) > E18)',
  sql_case_text = 'CASE WHEN E23 < 0 AND E26 > 0 AND ABS(E26) > E18 THEN CONCAT(AG17, '', '') ELSE '''' END',
  sql_case_boolean = 'CASE WHEN E23 < 0 AND E26 > 0 AND ABS(E26) > E18 THEN 1 ELSE 0 END'
WHERE code = 'ty_duong_hu';

-- ty_vi_khi_hu: E24<0->E24>0, E26<0->E26>0 (app goc: Vi va Ty deu duong cho chung nay)
UPDATE benh_dong_y_excel SET
  excel_formula = '=IF(AND(E15<0;E24>0;E26>0;E25>0;ABS(E24)>E18;ABS(E26)>E18);AG18&", ";"")',
  logic_expression = '(E15 < 0) AND (E24 > 0) AND (E26 > 0) AND (E25 > 0) AND (ABS(E24) > E18) AND (ABS(E26) > E18)',
  sql_case_text = 'CASE WHEN E15 < 0 AND E24 > 0 AND E26 > 0 AND E25 > 0 AND ABS(E24) > E18 AND ABS(E26) > E18 THEN CONCAT(AG18, '', '') ELSE '''' END',
  sql_case_boolean = 'CASE WHEN E15 < 0 AND E24 > 0 AND E26 > 0 AND E25 > 0 AND ABS(E24) > E18 AND ABS(E26) > E18 THEN 1 ELSE 0 END'
WHERE code = 'ty_vi_khi_hu';

-- ---- (2) benh_dong_y: sua ban ghi bi dao trai<->phai toan bo (id=66) ----
UPDATE benh_dong_y SET
  tieutruong_c8 = -1, tieutruong = 0, tieutruong_c11 = 1,
  tam_c8 = -1, tam = 0, tam_c11 = 1,
  tamtieu_c8 = -1, tamtieu = 0, tamtieu_c11 = 1,
  tambao_c8 = -1, tambao = 0, tambao_c11 = 1,
  daitrang_c8 = -1, daitrang = 0, daitrang_c11 = 1,
  phe_c8 = -1, phe = 0, phe_c11 = 1,
  bangquang_c8 = 1, bangquang = 0, bangquang_c11 = -1,
  than_c8 = 1, than = 0, than_c11 = -1,
  dam_c8 = 1, dam = 0, dam_c11 = -1,
  vi_c8 = 1, vi = 0, vi_c11 = -1,
  can_c8 = 1, can = 0, can_c11 = -1,
  ty_c8 = 1, ty = 0, ty_c11 = -1
WHERE id = 66;

-- ---- (3) benh_dong_y_hien_dai: them 21 the con thieu (khung de xuat) ----
INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tam_duong_bat_tuc_tam_khi_hu', 'Tâm dương bất túc - Tâm khí hư', 'AD24',
   '=IF(AND(E11<0;E12<0;E26<0;AN11<0;AQ11<0);AD24&", ";"")',
   '(E11 < 0) AND (E12 < 0) AND (E26 < 0) AND (AN11 < 0) AND (AQ11 < 0)',
   'CASE WHEN E11 < 0 AND E12 < 0 AND E26 < 0 AND AN11 < 0 AND AQ11 < 0 THEN ''Tâm dương bất túc - Tâm khí hư'' ELSE '''' END',
   'CASE WHEN E11 < 0 AND E12 < 0 AND E26 < 0 AND AN11 < 0 AND AQ11 < 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tam_duong_bat_tuc_tam_duong_hu', 'Tâm dương bất túc - Tâm dương hư', 'AD25',
   '=IF(AND(E11<0;E23<0;AN11<0;AQ11<0);AD25&", ";"")',
   '(E11 < 0) AND (E23 < 0) AND (AN11 < 0) AND (AQ11 < 0)',
   'CASE WHEN E11 < 0 AND E23 < 0 AND AN11 < 0 AND AQ11 < 0 THEN ''Tâm dương bất túc - Tâm dương hư'' ELSE '''' END',
   'CASE WHEN E11 < 0 AND E23 < 0 AND AN11 < 0 AND AQ11 < 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tam_duong_bat_tuc_tam_duong_hu_suy', 'Tâm dương bất túc - Tâm dương hư suy', 'AD26',
   '=IF(AND(E11<0;E12<0;E15>0;E22<0;E26<0;AN11<0;AQ11<0);AD26&", ";"")',
   '(E11 < 0) AND (E12 < 0) AND (E15 > 0) AND (E22 < 0) AND (E26 < 0) AND (AN11 < 0) AND (AQ11 < 0)',
   'CASE WHEN E11 < 0 AND E12 < 0 AND E15 > 0 AND E22 < 0 AND E26 < 0 AND AN11 < 0 AND AQ11 < 0 THEN ''Tâm dương bất túc - Tâm dương hư suy'' ELSE '''' END',
   'CASE WHEN E11 < 0 AND E12 < 0 AND E15 > 0 AND E22 < 0 AND E26 < 0 AND AN11 < 0 AND AQ11 < 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tam_am_bat_tuc_tam_am_hu', 'Tâm âm bất túc - Tâm âm hư', 'AD27',
   '=IF(AND(E11<0;E15>0;E23>0;AN11<0;AQ11<0);AD27&", ";"")',
   '(E11 < 0) AND (E15 > 0) AND (E23 > 0) AND (AN11 < 0) AND (AQ11 < 0)',
   'CASE WHEN E11 < 0 AND E15 > 0 AND E23 > 0 AND AN11 < 0 AND AQ11 < 0 THEN ''Tâm âm bất túc - Tâm âm hư'' ELSE '''' END',
   'CASE WHEN E11 < 0 AND E15 > 0 AND E23 > 0 AND AN11 < 0 AND AQ11 < 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tam_am_bat_tuc_tam_huyet_hu', 'Tâm âm bất túc - Tâm huyết hư', 'AD28',
   '=IF(AND(E11>0;E15>0;E22<0;E23>0;E25<0;E26<0;AN11>0;AQ11>0);AD28&", ";"")',
   '(E11 > 0) AND (E15 > 0) AND (E22 < 0) AND (E23 > 0) AND (E25 < 0) AND (E26 < 0) AND (AN11 > 0) AND (AQ11 > 0)',
   'CASE WHEN E11 > 0 AND E15 > 0 AND E22 < 0 AND E23 > 0 AND E25 < 0 AND E26 < 0 AND AN11 > 0 AND AQ11 > 0 THEN ''Tâm âm bất túc - Tâm huyết hư'' ELSE '''' END',
   'CASE WHEN E11 > 0 AND E15 > 0 AND E22 < 0 AND E23 > 0 AND E25 < 0 AND E26 < 0 AND AN11 > 0 AND AQ11 > 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tam_hoa_thuong_vien_tam_hoa_cang_thinh', 'Tâm hoả thượng viên (Tâm hoả cang thịnh)', 'AD29',
   '=IF(AND(E11>0;E12>0;E13>0;E15>0;E23>0;E24>0;E25>0;E26>0;AN11>0;AQ11>0;AN24>0;AQ24>0);AD29&", ";"")',
   '(E11 > 0) AND (E12 > 0) AND (E13 > 0) AND (E15 > 0) AND (E23 > 0) AND (E24 > 0) AND (E25 > 0) AND (E26 > 0) AND (AN11 > 0) AND (AQ11 > 0) AND (AN24 > 0) AND (AQ24 > 0)',
   'CASE WHEN E11 > 0 AND E12 > 0 AND E13 > 0 AND E15 > 0 AND E23 > 0 AND E24 > 0 AND E25 > 0 AND E26 > 0 AND AN11 > 0 AND AQ11 > 0 AND AN24 > 0 AND AQ24 > 0 THEN ''Tâm hoả thượng viên (Tâm hoả cang thịnh)'' ELSE '''' END',
   'CASE WHEN E11 > 0 AND E12 > 0 AND E13 > 0 AND E15 > 0 AND E23 > 0 AND E24 > 0 AND E25 > 0 AND E26 > 0 AND AN11 > 0 AND AQ11 > 0 AND AN24 > 0 AND AQ24 > 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tieu_truong_thuc_nhiet_tam_di_nhiet_sang_tieu_truong', 'Tiểu trường thực nhiệt (Tâm di nhiệt sang tiểu trường)', 'AD30',
   '=IF(AND(E10>0;E11>0;E15>0;E21>0;AN11>0;AQ11>0);AD30&", ";"")',
   '(E10 > 0) AND (E11 > 0) AND (E15 > 0) AND (E21 > 0) AND (AN11 > 0) AND (AQ11 > 0)',
   'CASE WHEN E10 > 0 AND E11 > 0 AND E15 > 0 AND E21 > 0 AND AN11 > 0 AND AQ11 > 0 THEN ''Tiểu trường thực nhiệt (Tâm di nhiệt sang tiểu trường)'' ELSE '''' END',
   'CASE WHEN E10 > 0 AND E11 > 0 AND E15 > 0 AND E21 > 0 AND AN11 > 0 AND AQ11 > 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_can_uat_can_khi_uat_ket_can_khi_bat_thu_can_khi_khong_tha_lo', 'Can uất (can khí uất kết, can khí bất thư) (can khí không thả lỏng):', 'AD31',
   '=IF(AND(E23<0;E25>0;AN25>0;AQ25>0);AD31&", ";"")',
   '(E23 < 0) AND (E25 > 0) AND (AN25 > 0) AND (AQ25 > 0)',
   'CASE WHEN E23 < 0 AND E25 > 0 AND AN25 > 0 AND AQ25 > 0 THEN ''Can uất (can khí uất kết, can khí bất thư) (can khí không thả lỏng):'' ELSE '''' END',
   'CASE WHEN E23 < 0 AND E25 > 0 AND AN25 > 0 AND AQ25 > 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_am_nhiet_can_am_thap_nhiet', 'Đảm nhiệt (can đảm thấp nhiệt)', 'AD32',
   '=IF(AND(E23>0;AN23>0;AQ23>0);AD32&", ";"")',
   '(E23 > 0) AND (AN23 > 0) AND (AQ23 > 0)',
   'CASE WHEN E23 > 0 AND AN23 > 0 AND AQ23 > 0 THEN ''Đảm nhiệt (can đảm thấp nhiệt)'' ELSE '''' END',
   'CASE WHEN E23 > 0 AND AN23 > 0 AND AQ23 > 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tam_ty_luong_hu', 'Tâm tỳ lường hư', 'AD33',
   '=IF(AND(E11<0;E26<0;AN11<0;AQ11<0;AN26<0;AQ26<0);AD33&", ";"")',
   '(E11 < 0) AND (E26 < 0) AND (AN11 < 0) AND (AQ11 < 0) AND (AN26 < 0) AND (AQ26 < 0)',
   'CASE WHEN E11 < 0 AND E26 < 0 AND AN11 < 0 AND AQ11 < 0 AND AN26 < 0 AND AQ26 < 0 THEN ''Tâm tỳ lường hư'' ELSE '''' END',
   'CASE WHEN E11 < 0 AND E26 < 0 AND AN11 < 0 AND AQ11 < 0 AND AN26 < 0 AND AQ26 < 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_vi_quan_thong_do_ty_thuc', 'Vị quản thống do Tỳ Thực', 'AD34',
   '=IF(AND(E11>0;E13>0;E14>0;E15>0;E24>0;E25>0;E26>0);AD34&", ";"")',
   '(E11 > 0) AND (E13 > 0) AND (E14 > 0) AND (E15 > 0) AND (E24 > 0) AND (E25 > 0) AND (E26 > 0)',
   'CASE WHEN E11 > 0 AND E13 > 0 AND E14 > 0 AND E15 > 0 AND E24 > 0 AND E25 > 0 AND E26 > 0 THEN ''Vị quản thống do Tỳ Thực'' ELSE '''' END',
   'CASE WHEN E11 > 0 AND E13 > 0 AND E14 > 0 AND E15 > 0 AND E24 > 0 AND E25 > 0 AND E26 > 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_vi_quan_thong_do_am_thuc', 'Vị quản thống do Đảm Thực', 'AD35',
   '=IF(AND(E23>0;E24>0;E25>0;E26>0);AD35&", ";"")',
   '(E23 > 0) AND (E24 > 0) AND (E25 > 0) AND (E26 > 0)',
   'CASE WHEN E23 > 0 AND E24 > 0 AND E25 > 0 AND E26 > 0 THEN ''Vị quản thống do Đảm Thực'' ELSE '''' END',
   'CASE WHEN E23 > 0 AND E24 > 0 AND E25 > 0 AND E26 > 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_thuc_tiet_chung_au_bung_tren', 'Thực tiết (Chứng đau bụng trên)', 'AD36',
   '=IF(AND(E12>0;E13>0;E14>0;E15>0;E22>0;E24>0;E25>0);AD36&", ";"")',
   '(E12 > 0) AND (E13 > 0) AND (E14 > 0) AND (E15 > 0) AND (E22 > 0) AND (E24 > 0) AND (E25 > 0)',
   'CASE WHEN E12 > 0 AND E13 > 0 AND E14 > 0 AND E15 > 0 AND E22 > 0 AND E24 > 0 AND E25 > 0 THEN ''Thực tiết (Chứng đau bụng trên)'' ELSE '''' END',
   'CASE WHEN E12 > 0 AND E13 > 0 AND E14 > 0 AND E15 > 0 AND E22 > 0 AND E24 > 0 AND E25 > 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tuc_gian_thanh_benh', 'Tức giận thành bệnh', 'AD37',
   '=IF(AND(E11>0;E25>0);AD37&", ";"")',
   '(E11 > 0) AND (E25 > 0)',
   'CASE WHEN E11 > 0 AND E25 > 0 THEN ''Tức giận thành bệnh'' ELSE '''' END',
   'CASE WHEN E11 > 0 AND E25 > 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_tiec_xot_thanh_benh', 'Tiếc xót thành bệnh', 'AD38',
   '=IF(AND(E11>0;E22>0);AD38&", ";"")',
   '(E11 > 0) AND (E22 > 0)',
   'CASE WHEN E11 > 0 AND E22 > 0 THEN ''Tiếc xót thành bệnh'' ELSE '''' END',
   'CASE WHEN E11 > 0 AND E22 > 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_oan_uat_thanh_benh', 'Oan uất thành bệnh', 'AD39',
   '=IF(AND(E11>0;E15>0;E23<0;E25>0);AD39&", ";"")',
   '(E11 > 0) AND (E15 > 0) AND (E23 < 0) AND (E25 > 0)',
   'CASE WHEN E11 > 0 AND E15 > 0 AND E23 < 0 AND E25 > 0 THEN ''Oan uất thành bệnh'' ELSE '''' END',
   'CASE WHEN E11 > 0 AND E15 > 0 AND E23 < 0 AND E25 > 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_benh_than_kinh_chuc_nang_2', 'Bệnh thần kinh chức năng (2)', 'AD40',
   '=IF(AND(E13>0);AD40&", ";"")',
   '(E13 > 0)',
   'CASE WHEN E13 > 0 THEN ''Bệnh thần kinh chức năng (2)'' ELSE '''' END',
   'CASE WHEN E13 > 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_benh_than_kinh_chuc_nang_3', 'Bệnh thần kinh chức năng (3)', 'AD41',
   '=IF(AND(E11<0;E13>0);AD41&", ";"")',
   '(E11 < 0) AND (E13 > 0)',
   'CASE WHEN E11 < 0 AND E13 > 0 THEN ''Bệnh thần kinh chức năng (3)'' ELSE '''' END',
   'CASE WHEN E11 < 0 AND E13 > 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_huyen_van_sung_huyet_nao_do_huyet_ap_cao', 'Huyễn vận (Sung huyết não do huyết áp cao) — biến thể 1', 'AD42',
   '=IF(AND(AN10<0;AQ10>0;AN11<0;AQ11>0;AN12<0;AQ12>0;AN13<0;AQ13>0;AN14<0;AQ14>0;AN15<0;AQ15>0;AN21<0;AQ21>0;AN22<0;AQ22>0;AN23<0;AQ23>0;AN24<0;AQ24>0;AN25<0;AQ25>0;AN26<0;AQ26>0);AD42&", ";"")',
   '(AN10 < 0) AND (AQ10 > 0) AND (AN11 < 0) AND (AQ11 > 0) AND (AN12 < 0) AND (AQ12 > 0) AND (AN13 < 0) AND (AQ13 > 0) AND (AN14 < 0) AND (AQ14 > 0) AND (AN15 < 0) AND (AQ15 > 0) AND (AN21 < 0) AND (AQ21 > 0) AND (AN22 < 0) AND (AQ22 > 0) AND (AN23 < 0) AND (AQ23 > 0) AND (AN24 < 0) AND (AQ24 > 0) AND (AN25 < 0) AND (AQ25 > 0) AND (AN26 < 0) AND (AQ26 > 0)',
   'CASE WHEN AN10 < 0 AND AQ10 > 0 AND AN11 < 0 AND AQ11 > 0 AND AN12 < 0 AND AQ12 > 0 AND AN13 < 0 AND AQ13 > 0 AND AN14 < 0 AND AQ14 > 0 AND AN15 < 0 AND AQ15 > 0 AND AN21 < 0 AND AQ21 > 0 AND AN22 < 0 AND AQ22 > 0 AND AN23 < 0 AND AQ23 > 0 AND AN24 < 0 AND AQ24 > 0 AND AN25 < 0 AND AQ25 > 0 AND AN26 < 0 AND AQ26 > 0 THEN ''Huyễn vận (Sung huyết não do huyết áp cao) — biến thể 1'' ELSE '''' END',
   'CASE WHEN AN10 < 0 AND AQ10 > 0 AND AN11 < 0 AND AQ11 > 0 AND AN12 < 0 AND AQ12 > 0 AND AN13 < 0 AND AQ13 > 0 AND AN14 < 0 AND AQ14 > 0 AND AN15 < 0 AND AQ15 > 0 AND AN21 < 0 AND AQ21 > 0 AND AN22 < 0 AND AQ22 > 0 AND AN23 < 0 AND AQ23 > 0 AND AN24 < 0 AND AQ24 > 0 AND AN25 < 0 AND AQ25 > 0 AND AN26 < 0 AND AQ26 > 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_huyen_van_sung_huyet_nao_do_huyet_ap_cao_2', 'Huyễn vận (Sung huyết não do huyết áp cao) — biến thể 2', 'AD43',
   '=IF(AND(AN10>0;AQ10<0;AN11>0;AQ11<0;AN12>0;AQ12<0;AN13>0;AQ13<0;AN14>0;AQ14<0;AN15>0;AQ15<0;AN21>0;AQ21<0;AN22>0;AQ22<0;AN23>0;AQ23<0;AN24>0;AQ24<0;AN25>0;AQ25<0;AN26>0;AQ26<0);AD43&", ";"")',
   '(AN10 > 0) AND (AQ10 < 0) AND (AN11 > 0) AND (AQ11 < 0) AND (AN12 > 0) AND (AQ12 < 0) AND (AN13 > 0) AND (AQ13 < 0) AND (AN14 > 0) AND (AQ14 < 0) AND (AN15 > 0) AND (AQ15 < 0) AND (AN21 > 0) AND (AQ21 < 0) AND (AN22 > 0) AND (AQ22 < 0) AND (AN23 > 0) AND (AQ23 < 0) AND (AN24 > 0) AND (AQ24 < 0) AND (AN25 > 0) AND (AQ25 < 0) AND (AN26 > 0) AND (AQ26 < 0)',
   'CASE WHEN AN10 > 0 AND AQ10 < 0 AND AN11 > 0 AND AQ11 < 0 AND AN12 > 0 AND AQ12 < 0 AND AN13 > 0 AND AQ13 < 0 AND AN14 > 0 AND AQ14 < 0 AND AN15 > 0 AND AQ15 < 0 AND AN21 > 0 AND AQ21 < 0 AND AN22 > 0 AND AQ22 < 0 AND AN23 > 0 AND AQ23 < 0 AND AN24 > 0 AND AQ24 < 0 AND AN25 > 0 AND AQ25 < 0 AND AN26 > 0 AND AQ26 < 0 THEN ''Huyễn vận (Sung huyết não do huyết áp cao) — biến thể 2'' ELSE '''' END',
   'CASE WHEN AN10 > 0 AND AQ10 < 0 AND AN11 > 0 AND AQ11 < 0 AND AN12 > 0 AND AQ12 < 0 AND AN13 > 0 AND AQ13 < 0 AND AN14 > 0 AND AQ14 < 0 AND AN15 > 0 AND AQ15 < 0 AND AN21 > 0 AND AQ21 < 0 AND AN22 > 0 AND AQ22 < 0 AND AN23 > 0 AND AQ23 < 0 AND AN24 > 0 AND AQ24 < 0 AND AN25 > 0 AND AQ25 < 0 AND AN26 > 0 AND AQ26 < 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
  ('legacy_lo_nghi_thanh_benh', 'Lo nghĩ thành bệnh', 'AD44',
   '=IF(AND(E11>0;E26>0);AD44&", ";"")',
   '(E11 > 0) AND (E26 > 0)',
   'CASE WHEN E11 > 0 AND E26 > 0 THEN ''Lo nghĩ thành bệnh'' ELSE '''' END',
   'CASE WHEN E11 > 0 AND E26 > 0 THEN TRUE ELSE FALSE END')
ON CONFLICT (code) DO NOTHING;

COMMIT;