-- Thêm cột "biểu hiện tắc nghẽn" cho kinh mạch: mô tả biểu hiện lâm sàng khi kinh này
-- bị tắc nghẽn/rối loạn (vd Can: uất ức, dễ nổi giận, kinh nguyệt không đều...).
-- Dùng để hiện trong popup "Chi tiết kinh mạch" ở trang kết quả đo.
-- Chạy thủ công sau khi backup DB (cũng tự áp dụng qua SchemaBootstrapService khi backend khởi động).

ALTER TABLE kinh_mach ADD COLUMN IF NOT EXISTS bieu_hien_tac_nghen TEXT;
