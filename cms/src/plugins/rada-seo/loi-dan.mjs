// Lời dặn cho Claude khi đọc trang đối thủ. Trả về trong kết quả của công cụ MCP
// `rada_lay_viec`, nên routine luôn đọc bản ĐANG CHẠY trên máy chủ — sửa ở đây là đủ,
// không phải sửa lời dặn đã dán trong claude.ai.

export const BOI_CANH = `Lĩnh vực kinh doanh của chúng tôi (Kinhlac): Y học cổ truyền / Đông Y, tập trung ngách:
- Đo nhiệt độ kinh lạc / chẩn đoán kinh lạc (phương pháp 24 tỉnh huyệt)
- Huyệt vị, đường kinh, châm cứu (tra cứu + đồ hình 3D)
- Vị thuốc, bài thuốc (tính vị quy kinh), biện chứng luận trị
- Phần mềm số hoá / quản lý phòng khám Đông Y`;

export const LOI_NHAC_TRICH = `Với MỖI trang (chữ đã trích sẵn trong trường "chu"), xác định:
- chuDe: chủ đề chính của bài (1 câu ngắn, tiếng Việt có dấu, viết hoa chữ cái đầu).
- tuKhoa: 3 từ khoá SEO hàng đầu, liên quan tới lĩnh vực trên; kết hợp dài và ngắn; phải thực sự xuất hiện/đúng trọng tâm bài.
- tomTat: các ý phụ khác nhau của bài, tối đa 6 ý, mỗi ý một câu ngắn.
Nội dung mỏng thì suy luận từ tiêu đề và mô tả; tuyệt đối không bịa số liệu. Gửi kết quả bằng rada_ghi_phan_tich, mỗi lượt tối đa 10 trang, giữ nguyên "id".`;
