-- ============================================================================
-- Ra soat toan bo (khong chi 21 the moi them): phat hien 4 the CO SAN tu truoc
-- (khong phai do session nay them) dang dung ten benh danh hien dai/giai phau cu
-- the (viem loet, hep mon vi, gan lach sung to) nhung lai nam trong
-- benh_dong_y_excel (YHCT, dung cho mo hinh Bat Cuong tang phu hu/thuc/han/nhiet).
-- Chuyen ca 4 sang benh_dong_y_hien_dai cho dung phan loai, giu nguyen ma/logic/aliases.
-- ============================================================================

BEGIN;

-- viem_loet_da_day_ta_trang
DELETE FROM benh_dong_y_excel WHERE code = 'viem_loet_da_day_ta_trang';
INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean, aliases) VALUES
  ('viem_loet_da_day_ta_trang', 'Viêm loét dạ dày tá tràng', 'AD44',
   '=IF(AND(E11>0;E13>0;E14>0;E15>0;E24>0;E25>0;E26>0);AD44&", ";"")',
   '(E11 > 0) AND (E13 > 0) AND (E14 > 0) AND (E15 > 0) AND (E24 > 0) AND (E25 > 0) AND (E26 > 0)',
   'CASE WHEN E11 > 0 AND E13 > 0 AND E14 > 0 AND E15 > 0 AND E24 > 0 AND E25 > 0 AND E26 > 0 THEN ''Viêm loét dạ dày tá tràng'' ELSE '''' END',
   'CASE WHEN E11 > 0 AND E13 > 0 AND E14 > 0 AND E15 > 0 AND E24 > 0 AND E25 > 0 AND E26 > 0 THEN TRUE ELSE FALSE END',
   '["Vị quản thống do Tỳ Thực"]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- dau_da_day_hep_mon_vi
DELETE FROM benh_dong_y_excel WHERE code = 'dau_da_day_hep_mon_vi';
INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean, aliases) VALUES
  ('dau_da_day_hep_mon_vi', 'Đau dạ dày hẹp môn vị', 'AD45',
   '=IF(AND(E23>0;E24>0;E25>0;E26>0);AD45&", ";"")',
   '(E23 > 0) AND (E24 > 0) AND (E25 > 0) AND (E26 > 0)',
   'CASE WHEN E23 > 0 AND E24 > 0 AND E25 > 0 AND E26 > 0 THEN ''Đau dạ dày hẹp môn vị'' ELSE '''' END',
   'CASE WHEN E23 > 0 AND E24 > 0 AND E25 > 0 AND E26 > 0 THEN TRUE ELSE FALSE END',
   '["Vị quản thống do Đảm Thực"]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- chung_hep_mon_vi
DELETE FROM benh_dong_y_excel WHERE code = 'chung_hep_mon_vi';
INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean, aliases) VALUES
  ('chung_hep_mon_vi', 'Chứng hẹp môn vị', 'AD46',
   '=IF(AND(E23>E18;E24>E18;E25>E18);AD46&", ";"")',
   '(E23 > E18) AND (E24 > E18) AND (E25 > E18)',
   'CASE WHEN E23 > E18 AND E24 > E18 AND E25 > E18 THEN ''Chứng hẹp môn vị'' ELSE '''' END',
   'CASE WHEN E23 > E18 AND E24 > E18 AND E25 > E18 THEN TRUE ELSE FALSE END',
   '[]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- chung_gan_lach_sung_to
DELETE FROM benh_dong_y_excel WHERE code = 'chung_gan_lach_sung_to';
INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean, aliases) VALUES
  ('chung_gan_lach_sung_to', 'Chứng gan lách sưng to', 'AD47',
   '=IF(AND(E25>E18;E26>E18;E23<0;ABS(E23)>E18);AD47&", ";"")',
   '(E25 > E18) AND (E26 > E18) AND (E23 < 0) AND (ABS(E23) > E18)',
   'CASE WHEN E25 > E18 AND E26 > E18 AND E23 < 0 AND ABS(E23) > E18 THEN ''Chứng gan lách sưng to'' ELSE '''' END',
   'CASE WHEN E25 > E18 AND E26 > E18 AND E23 < 0 AND ABS(E23) > E18 THEN TRUE ELSE FALSE END',
   '[]'::jsonb)
ON CONFLICT (code) DO NOTHING;

COMMIT;