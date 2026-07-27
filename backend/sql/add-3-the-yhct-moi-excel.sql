-- Thêm 3 thể YHCT gốc MỚI vào benh_dong_y_excel (bộ "48 thể YHCT" → 51), CÔNG THỨC ĐỂ TRỐNG.
-- Là thể gốc cho quan hệ nhân-quả benh_cau_thanh (Yêu thống thoái hoá/tổn thương/Chứng kết khối ⇐
-- Can Kinh Huyết Ứ; Công năng tình dục tăng ⇐ Thận Hư Hỏa Vượng; Chứng viêm ⇐ Nhiệt Độc).
-- logic_expression RỖNG → evaluateLogicExpression() trả false → KHÔNG bao giờ khớp (an toàn cho chẩn
-- đoán). Bác sĩ điền công thức sau qua màn Quản Lý. An toàn chạy lại nhiều lần.
INSERT INTO benh_dong_y_excel (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean, aliases)
SELECT v.code, v.name, '', '', '', '', '', '[]'::jsonb
FROM (VALUES
  ('can_kinh_huyet_u',  'Can Kinh Huyết Ứ'),
  ('than_hu_hoa_vuong', 'Thận Hư Hỏa Vượng'),
  ('nhiet_doc',         'Nhiệt Độc')
) AS v(code, name)
WHERE NOT EXISTS (SELECT 1 FROM benh_dong_y_excel e WHERE e.code = v.code OR e.name ILIKE v.name);
