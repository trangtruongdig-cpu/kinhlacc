-- Seed dữ liệu cho bảng benh_dong_y_hien_dai (theo dongyhiendai.md).
-- Chạy SAU khi đã tạo bảng bằng create-benh-dong-y-hien-dai.sql.
--
-- Quy ước:
--   • code        = HD### (số thứ tự trong file md).
--   • output_cell = ô AD trong công thức gốc (vị trí chứa tên bệnh trên sheet).
--   • excel_formula     = nguyên văn công thức Excel (giữ dấu chấm phẩy locale VN).
--   • logic_expression  = chuỗi AND/OR/clause để engine đánh giá. Mệnh đề pure-AND
--                         dùng dạng "Em>n AND Ek<n" để engine hiện tại parse được.
--                         Các quy tắc dùng OR / nhân (×) / so chuỗi / LEN() — engine
--                         hiện tại CHƯA hỗ trợ; nội dung được lưu nguyên dạng để
--                         người dùng tra cứu, sẽ không khớp trong /chan-doan đến khi
--                         mở rộng parser.
--   • sql_case_text / sql_case_boolean = mô tả SQL CASE tham khảo (giữ nguyên điều
--                         kiện Excel để khớp với chuẩn của benh_dong_y_excel).

INSERT INTO benh_dong_y_hien_dai (code, name, output_cell, excel_formula, logic_expression, sql_case_text, sql_case_boolean) VALUES
('HD001', 'Giãn động Mạch Vành', 'AD2',
 '=IF(OR(AND(E10<0;E11>0;E15<0);AND(E13>0;E15<0);AND(E11>0;E13>0;E15<0));AD2&", ";"")',
 'OR(AND(E10<0;E11>0;E15<0);AND(E13>0;E15<0);AND(E11>0;E13>0;E15<0))',
 'CASE WHEN (E10<0 AND E11>0 AND E15<0) OR (E13>0 AND E15<0) OR (E11>0 AND E13>0 AND E15<0) THEN ''Giãn động Mạch Vành'' ELSE '''' END',
 'CASE WHEN (E10<0 AND E11>0 AND E15<0) OR (E13>0 AND E15<0) OR (E11>0 AND E13>0 AND E15<0) THEN TRUE ELSE FALSE END'),

('HD002', 'Bệnh Tuyến Giáp đơn thuần', 'AD3',
 '=IF(AND(E11>0;E15>0;E25>0);AD3&", ";"")',
 'E11>0 AND E15>0 AND E25>0',
 'CASE WHEN E11>0 AND E15>0 AND E25>0 THEN ''Bệnh Tuyến Giáp đơn thuần'' ELSE '''' END',
 'CASE WHEN E11>0 AND E15>0 AND E25>0 THEN TRUE ELSE FALSE END'),

('HD003', 'Bệnh cường Tuyến Giáp', 'AD4',
 '=IF(AND(E11>0;E15>0;E23>0;E25>0);AD4&", ";"")',
 'E11>0 AND E15>0 AND E23>0 AND E25>0',
 'CASE WHEN E11>0 AND E15>0 AND E23>0 AND E25>0 THEN ''Bệnh cường Tuyến Giáp'' ELSE '''' END',
 'CASE WHEN E11>0 AND E15>0 AND E23>0 AND E25>0 THEN TRUE ELSE FALSE END'),

('HD004', 'Bệnh suy Tuyến Giáp', 'AD5',
 '=IF(AND(E11>0;E15>0;E23<0;E25>0);AD5&", ";"")',
 'E11>0 AND E15>0 AND E23<0 AND E25>0',
 'CASE WHEN E11>0 AND E15>0 AND E23<0 AND E25>0 THEN ''Bệnh suy Tuyến Giáp'' ELSE '''' END',
 'CASE WHEN E11>0 AND E15>0 AND E23<0 AND E25>0 THEN TRUE ELSE FALSE END'),

('HD005', 'Đau lưng do viêm đại tràng', 'AD6',
 '=IF(AND(E13>0;E14>0;E15>0;LEN(AP14)>0;OR(AND(AN21*AQ21<0;AN22*AQ22<0);AND(AN21*AQ21>0;AN22*AQ22>0;H21>D18;H22>D18)));AD6&", ";"")',
 'E13>0 AND E14>0 AND E15>0 AND AP14!="" AND OR(AND(AN21*AQ21<0;AN22*AQ22<0);AND(AN21*AQ21>0;AN22*AQ22>0;H21>D18;H22>D18))',
 'CASE WHEN E13>0 AND E14>0 AND E15>0 AND AP14<>'''' AND ((AN21*AQ21<0 AND AN22*AQ22<0) OR (AN21*AQ21>0 AND AN22*AQ22>0 AND H21>D18 AND H22>D18)) THEN ''Đau lưng do viêm đại tràng'' ELSE '''' END',
 'CASE WHEN E13>0 AND E14>0 AND E15>0 AND AP14<>'''' AND ((AN21*AQ21<0 AND AN22*AQ22<0) OR (AN21*AQ21>0 AND AN22*AQ22>0 AND H21>D18 AND H22>D18)) THEN TRUE ELSE FALSE END'),

('HD006', 'Bệnh cảm cúm', 'AD8',
 '=IF(AND(E11>0;E15>0;E25>0;E26>0);AD8&", ";"")',
 'E11>0 AND E15>0 AND E25>0 AND E26>0',
 'CASE WHEN E11>0 AND E15>0 AND E25>0 AND E26>0 THEN ''Bệnh cảm cúm'' ELSE '''' END',
 'CASE WHEN E11>0 AND E15>0 AND E25>0 AND E26>0 THEN TRUE ELSE FALSE END'),

('HD007', 'Chứng viêm', 'AD9',
 '=IF(AND(E11>0;E13>0;E14>0;E15>0);AD9&", ";"")',
 'E11>0 AND E13>0 AND E14>0 AND E15>0',
 'CASE WHEN E11>0 AND E13>0 AND E14>0 AND E15>0 THEN ''Chứng viêm'' ELSE '''' END',
 'CASE WHEN E11>0 AND E13>0 AND E14>0 AND E15>0 THEN TRUE ELSE FALSE END'),

('HD008', 'Khối kết', 'AD10',
 '=IF(AND(E10<0;E11<0;E12<0;ABS(E10)>E7; ABS(E11)>E7; ABS(E12)>E7;E13>0;E14>0;E15>0);AD10&", ";"")',
 'E10<0 AND E11<0 AND E12<0 AND ABS(E10)>E7 AND ABS(E11)>E7 AND ABS(E12)>E7 AND E13>0 AND E14>0 AND E15>0',
 'CASE WHEN E10<0 AND E11<0 AND E12<0 AND ABS(E10)>E7 AND ABS(E11)>E7 AND ABS(E12)>E7 AND E13>0 AND E14>0 AND E15>0 THEN ''Khối kết'' ELSE '''' END',
 'CASE WHEN E10<0 AND E11<0 AND E12<0 AND ABS(E10)>E7 AND ABS(E11)>E7 AND ABS(E12)>E7 AND E13>0 AND E14>0 AND E15>0 THEN TRUE ELSE FALSE END'),

('HD009', 'Ký Sinh Trùng đường ruột', 'AD11',
 '=IF(E23<0;AD11&", ";"")',
 'E23<0',
 'CASE WHEN E23<0 THEN ''Ký Sinh Trùng đường ruột'' ELSE '''' END',
 'CASE WHEN E23<0 THEN TRUE ELSE FALSE END'),

('HD010', 'Viêm cấp tính đường Tiết Niệu (nước tiểu có máu)', 'AD12',
 '=IF(AND(E15>0;E21>0);AD12&", ";"")',
 'E15>0 AND E21>0',
 'CASE WHEN E15>0 AND E21>0 THEN ''Viêm cấp tính đường Tiết Niệu (nước tiểu có máu)'' ELSE '''' END',
 'CASE WHEN E15>0 AND E21>0 THEN TRUE ELSE FALSE END'),

('HD011', 'Công năng Tình Dục tăng tiến', 'AD13',
 '=IF(AND(E13>0;E22>0;E23>0;E24>0;E25>0;E26>0);AD13&", ";"")',
 'E13>0 AND E22>0 AND E23>0 AND E24>0 AND E25>0 AND E26>0',
 'CASE WHEN E13>0 AND E22>0 AND E23>0 AND E24>0 AND E25>0 AND E26>0 THEN ''Công năng Tình Dục tăng tiến'' ELSE '''' END',
 'CASE WHEN E13>0 AND E22>0 AND E23>0 AND E24>0 AND E25>0 AND E26>0 THEN TRUE ELSE FALSE END'),

('HD012', 'Phù nề dạ dày', 'AD14',
 '=IF(AND(E22>0;E23<0;E24<0;E25>0;E26<0);AD14&", ";"")',
 'E22>0 AND E23<0 AND E24<0 AND E25>0 AND E26<0',
 'CASE WHEN E22>0 AND E23<0 AND E24<0 AND E25>0 AND E26<0 THEN ''Phù nề dạ dày'' ELSE '''' END',
 'CASE WHEN E22>0 AND E23<0 AND E24<0 AND E25>0 AND E26<0 THEN TRUE ELSE FALSE END'),

('HD013', 'Bệnh đốt sống cổ', 'AD15',
 '=IF(OR(AND(B10="+";G10="0";B11="-";G11="+";B12="-";G12="+");AND(B10="-";G10="-";B11="+";G11="-";B12="-";G12="0");AND(B10="-";G10="0";B11="-";G11="+";B12="+";G12="0");AND(B10="-";G10="-";B11="-";G11="-";B12="-";G12="0");AND(B10="-";G10="-";E10<0;B11="+";E11=0;G11="-";B12="-";E12<0;G12="-"));AD15&", ";"")',
 'OR(AND(B10="+";G10="0";B11="-";G11="+";B12="-";G12="+");AND(B10="-";G10="-";B11="+";G11="-";B12="-";G12="0");AND(B10="-";G10="0";B11="-";G11="+";B12="+";G12="0");AND(B10="-";G10="-";B11="-";G11="-";B12="-";G12="0");AND(B10="-";G10="-";E10<0;B11="+";E11=0;G11="-";B12="-";E12<0;G12="-"))',
 'CASE WHEN /* tổ hợp 5 nhánh OR dựa trên B10/G10..B12/G12 và E10/E11/E12 — xem excel_formula */ FALSE THEN ''Bệnh đốt sống cổ'' ELSE '''' END',
 'CASE WHEN /* xem excel_formula */ FALSE THEN TRUE ELSE FALSE END'),

('HD014', 'Bệnh đau lưng', 'AD16',
 '=IF(OR(AND(AN21*AQ21<0;AN22*AQ22<0);AND(AN21*AQ21>0;AN22*AQ22>0;H21>D18;H22>D18));AD16&", ";"")',
 'OR(AND(AN21*AQ21<0;AN22*AQ22<0);AND(AN21*AQ21>0;AN22*AQ22>0;H21>D18;H22>D18))',
 'CASE WHEN (AN21*AQ21<0 AND AN22*AQ22<0) OR (AN21*AQ21>0 AND AN22*AQ22>0 AND H21>D18 AND H22>D18) THEN ''Bệnh đau lưng'' ELSE '''' END',
 'CASE WHEN (AN21*AQ21<0 AND AN22*AQ22<0) OR (AN21*AQ21>0 AND AN22*AQ22>0 AND H21>D18 AND H22>D18) THEN TRUE ELSE FALSE END'),

('HD015', 'Đau lưng do trĩ', 'AD17',
 '=IF(AND(E13>0;E14>0;E15>0;AN14*AQ14<0;H14>D7;OR(AND(AN21*AQ21<0;AN22*AQ22<0);AND(AN21*AQ21>0;AN22*AQ22>0;H21>D18;H22>D18)));AD17&", ";"")',
 'E13>0 AND E14>0 AND E15>0 AND AN14*AQ14<0 AND H14>D7 AND OR(AND(AN21*AQ21<0;AN22*AQ22<0);AND(AN21*AQ21>0;AN22*AQ22>0;H21>D18;H22>D18))',
 'CASE WHEN E13>0 AND E14>0 AND E15>0 AND AN14*AQ14<0 AND H14>D7 AND ((AN21*AQ21<0 AND AN22*AQ22<0) OR (AN21*AQ21>0 AND AN22*AQ22>0 AND H21>D18 AND H22>D18)) THEN ''Đau lưng do trĩ'' ELSE '''' END',
 'CASE WHEN E13>0 AND E14>0 AND E15>0 AND AN14*AQ14<0 AND H14>D7 AND ((AN21*AQ21<0 AND AN22*AQ22<0) OR (AN21*AQ21>0 AND AN22*AQ22>0 AND H21>D18 AND H22>D18)) THEN TRUE ELSE FALSE END'),

('HD016', 'Đau lưng do thoái hóa đĩa đệm', 'AD18',
 '=IF(AND(E23>0;AN23*AQ23<0;OR(AND(AN21*AQ21<0;AN22*AQ22<0);AND(AN21*AQ21>0;AN22*AQ22>0;H21>D18;H22>D18)));AD18&", ";"")',
 'E23>0 AND AN23*AQ23<0 AND OR(AND(AN21*AQ21<0;AN22*AQ22<0);AND(AN21*AQ21>0;AN22*AQ22>0;H21>D18;H22>D18))',
 'CASE WHEN E23>0 AND AN23*AQ23<0 AND ((AN21*AQ21<0 AND AN22*AQ22<0) OR (AN21*AQ21>0 AND AN22*AQ22>0 AND H21>D18 AND H22>D18)) THEN ''Đau lưng do thoái hóa đĩa đệm'' ELSE '''' END',
 'CASE WHEN E23>0 AND AN23*AQ23<0 AND ((AN21*AQ21<0 AND AN22*AQ22<0) OR (AN21*AQ21>0 AND AN22*AQ22>0 AND H21>D18 AND H22>D18)) THEN TRUE ELSE FALSE END'),

('HD017', 'Đau lưng do Thận hư', 'AD19',
 '=IF(AND(E23<0;E21<0;E22<0;AN23*AQ23<0;OR(AND(AN21*AQ21<0;AN22*AQ22<0);AND(AN21*AQ21>0;AN22*AQ22>0;H21>D18;H22>D18)));AD19&", ";"")',
 'E23<0 AND E21<0 AND E22<0 AND AN23*AQ23<0 AND OR(AND(AN21*AQ21<0;AN22*AQ22<0);AND(AN21*AQ21>0;AN22*AQ22>0;H21>D18;H22>D18))',
 'CASE WHEN E23<0 AND E21<0 AND E22<0 AND AN23*AQ23<0 AND ((AN21*AQ21<0 AND AN22*AQ22<0) OR (AN21*AQ21>0 AND AN22*AQ22>0 AND H21>D18 AND H22>D18)) THEN ''Đau lưng do Thận hư'' ELSE '''' END',
 'CASE WHEN E23<0 AND E21<0 AND E22<0 AND AN23*AQ23<0 AND ((AN21*AQ21<0 AND AN22*AQ22<0) OR (AN21*AQ21>0 AND AN22*AQ22>0 AND H21>D18 AND H22>D18)) THEN TRUE ELSE FALSE END'),

('HD018', 'Đau lưng do tổn thương vùng phần mềm thắt lưng', 'AD20',
 '=IF(AND(E25>0;E26>0;AN25*AQ25<0;AN26*AQ26<0;OR(AND(AN21*AQ21<0;AN22*AQ22<0);AND(AN21*AQ21>0;AN22*AQ22>0;H21>D18;H22>D18)));AD20&", ";"")',
 'E25>0 AND E26>0 AND AN25*AQ25<0 AND AN26*AQ26<0 AND OR(AND(AN21*AQ21<0;AN22*AQ22<0);AND(AN21*AQ21>0;AN22*AQ22>0;H21>D18;H22>D18))',
 'CASE WHEN E25>0 AND E26>0 AND AN25*AQ25<0 AND AN26*AQ26<0 AND ((AN21*AQ21<0 AND AN22*AQ22<0) OR (AN21*AQ21>0 AND AN22*AQ22>0 AND H21>D18 AND H22>D18)) THEN ''Đau lưng do tổn thương vùng phần mềm thắt lưng'' ELSE '''' END',
 'CASE WHEN E25>0 AND E26>0 AND AN25*AQ25<0 AND AN26*AQ26<0 AND ((AN21*AQ21<0 AND AN22*AQ22<0) OR (AN21*AQ21>0 AND AN22*AQ22>0 AND H21>D18 AND H22>D18)) THEN TRUE ELSE FALSE END'),

('HD019', 'Rối loạn cảm giác Họng do suy Tuyến Giáp', 'AD21',
 '=IF(AND(E11>E7; E15>E7;E25>E18;E23<0;ABS(E23)>E18);AD21&", ";"")',
 'E11>E7 AND E15>E7 AND E25>E18 AND E23<0 AND ABS(E23)>E18',
 'CASE WHEN E11>E7 AND E15>E7 AND E25>E18 AND E23<0 AND ABS(E23)>E18 THEN ''Rối loạn cảm giác Họng do suy Tuyến Giáp'' ELSE '''' END',
 'CASE WHEN E11>E7 AND E15>E7 AND E25>E18 AND E23<0 AND ABS(E23)>E18 THEN TRUE ELSE FALSE END'),

('HD020', 'Rối loạn cảm giác Họng do cường Tuyến Giáp', 'AD22',
 '=IF(AND(E11>E8; E15>E8;E25>E18;E23>E18);AD22&", ";"")',
 'E11>E8 AND E15>E8 AND E25>E18 AND E23>E18',
 'CASE WHEN E11>E8 AND E15>E8 AND E25>E18 AND E23>E18 THEN ''Rối loạn cảm giác Họng do cường Tuyến Giáp'' ELSE '''' END',
 'CASE WHEN E11>E8 AND E15>E8 AND E25>E18 AND E23>E18 THEN TRUE ELSE FALSE END'),

('HD021', 'Rối loạn cảm giác Họng do cường Tuyến Giáp nặng', 'AD23',
 '=IF(AND(E11>E9; E15>E9;E25>E18;E23>E18;E13>0;E14>0;E15>0);AD23&", ";"")',
 'E11>E9 AND E15>E9 AND E25>E18 AND E23>E18 AND E13>0 AND E14>0 AND E15>0',
 'CASE WHEN E11>E9 AND E15>E9 AND E25>E18 AND E23>E18 AND E13>0 AND E14>0 AND E15>0 THEN ''Rối loạn cảm giác Họng do cường Tuyến Giáp nặng'' ELSE '''' END',
 'CASE WHEN E11>E9 AND E15>E9 AND E25>E18 AND E23>E18 AND E13>0 AND E14>0 AND E15>0 THEN TRUE ELSE FALSE END'),

('HD022', 'Bệnh tình chí', 'AD32',
 '=IF(AND(E11>E7;E13>0;E11>E13);AD32&", ";"")',
 'E11>E7 AND E13>0 AND E11>E13',
 'CASE WHEN E11>E7 AND E13>0 AND E11>E13 THEN ''Bệnh tình chí'' ELSE '''' END',
 'CASE WHEN E11>E7 AND E13>0 AND E11>E13 THEN TRUE ELSE FALSE END'),

('HD023', 'Bệnh do tình chí', 'AD33',
 '=IF(OR(E11>0;AND(E11>0;E13<0));AD33&", ";"")',
 'OR(E11>0;AND(E11>0;E13<0))',
 'CASE WHEN E11>0 OR (E11>0 AND E13<0) THEN ''Bệnh do tình chí'' ELSE '''' END',
 'CASE WHEN E11>0 OR (E11>0 AND E13<0) THEN TRUE ELSE FALSE END'),

('HD024', 'Tức giận thành bệnh', 'AD34',
 '=IF(AND(E11>0;E25>0);AD34&", ";"")',
 'E11>0 AND E25>0',
 'CASE WHEN E11>0 AND E25>0 THEN ''Tức giận thành bệnh'' ELSE '''' END',
 'CASE WHEN E11>0 AND E25>0 THEN TRUE ELSE FALSE END'),

('HD025', 'Lo nghĩ thành bệnh', 'AD35',
 '=IF(AND(E11>0;E26>0);AD35&", ";"")',
 'E11>0 AND E26>0',
 'CASE WHEN E11>0 AND E26>0 THEN ''Lo nghĩ thành bệnh'' ELSE '''' END',
 'CASE WHEN E11>0 AND E26>0 THEN TRUE ELSE FALSE END'),

('HD026', 'Tiếc xót thành bệnh', 'AD36',
 '=IF(AND(E11>0;E22>0);AD36&", ";"")',
 'E11>0 AND E22>0',
 'CASE WHEN E11>0 AND E22>0 THEN ''Tiếc xót thành bệnh'' ELSE '''' END',
 'CASE WHEN E11>0 AND E22>0 THEN TRUE ELSE FALSE END'),

('HD027', 'Buồn thành bệnh', 'AD37',
 '=IF(AND(E11>0;E15>0);AD37&", ";"")',
 'E11>0 AND E15>0',
 'CASE WHEN E11>0 AND E15>0 THEN ''Buồn thành bệnh'' ELSE '''' END',
 'CASE WHEN E11>0 AND E15>0 THEN TRUE ELSE FALSE END'),

('HD028', 'Oan uất thành bệnh', 'AD38',
 '=IF(AND(E11>0;E15>0;E23<0;E25>0);AD38&", ";"")',
 'E11>0 AND E15>0 AND E23<0 AND E25>0',
 'CASE WHEN E11>0 AND E15>0 AND E23<0 AND E25>0 THEN ''Oan uất thành bệnh'' ELSE '''' END',
 'CASE WHEN E11>0 AND E15>0 AND E23<0 AND E25>0 THEN TRUE ELSE FALSE END'),

('HD029', 'Bệnh thần kinh chức năng', 'AD39',
 '=IF(AND(E13>0;E13>E11);AD39&", ";"")',
 'E13>0 AND E13>E11',
 'CASE WHEN E13>0 AND E13>E11 THEN ''Bệnh thần kinh chức năng'' ELSE '''' END',
 'CASE WHEN E13>0 AND E13>E11 THEN TRUE ELSE FALSE END')

ON CONFLICT (code) DO UPDATE SET
  name             = EXCLUDED.name,
  output_cell      = EXCLUDED.output_cell,
  excel_formula    = EXCLUDED.excel_formula,
  logic_expression = EXCLUDED.logic_expression,
  sql_case_text    = EXCLUDED.sql_case_text,
  sql_case_boolean = EXCLUDED.sql_case_boolean;
