/**
 * Cập nhật CỤC BỘ một danh sách sau khi máy chủ xác nhận — thay cho việc gọi lại route tổng quan.
 *
 * Vì sao: `lamCL("ke-hoach-dat", …)` duyệt MỘT bài rồi kéo lại cả `chien-luoc-tong-quan` (3 lượt
 * đọc kho trên pool max:1). Nút "Đã sửa" của Leo top còn đắt hơn: `leo-top-tong-quan` tốn
 * `dsLeoTop` + `dsKeHoach` + HAI lượt GSC. Dòng vừa đổi là thông tin đã có trong phản hồi; hỏi
 * lại kho để biết điều mình đã biết là trả một vòng mạng không mua gì.
 *
 * ⚠️ Cả hai hàm trả mảng MỚI. Sửa tại chỗ thì React so tham chiếu thấy y nguyên và KHÔNG vẽ lại —
 * người bấm thấy màn đứng im rồi bấm tiếp, mà cú bấm thứ hai mới là thứ xếp thêm một lượt vào
 * hàng trên pool max:1.
 */

/**
 * Bỏ dòng có `id` khỏi `ds`. Không có thì trả bản sao nội dung y nguyên.
 *
 * ⚠️ Dùng cho HÀNG ĐỢI VIỆC (phần A), nơi làm xong là dòng rời hàng đợi thật. KHÔNG dùng cho
 * các bảng có bộ lọc/bộ đếm theo trạng thái — tab Kế hoạch là một: xoá dòng ở đó làm bài vừa
 * duyệt biến mất khỏi nhóm "Đã duyệt" lẫn "Tất cả" và bộ đếm sai theo. Chỗ đó dùng `datDong`.
 */
export function boDong(ds, id) {
	return (Array.isArray(ds) ? ds : []).filter((x) => x?.id !== id);
}

/**
 * Gộp `thay` vào dòng có `id`. Các khoá không khai trong `thay` giữ nguyên.
 *
 * `thay` rỗng hoặc undefined thì dòng còn nguyên — route trả `{ ok: true }` thay vì bản ghi đã
 * cập nhật là chuyện thường, và lúc đó mất dòng còn tệ hơn là không cập nhật gì.
 */
export function datDong(ds, id, thay) {
	return (Array.isArray(ds) ? ds : []).map((x) => (x?.id === id ? { ...x, ...thay } : x));
}
