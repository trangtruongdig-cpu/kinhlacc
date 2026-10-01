// Ô "Máy đang tự làm gì" đầu tab Radar: câu tiếng Việt thường, tính từ dữ liệu thật.
// Người dùng nhập đối thủ xong là mong mọi thứ tự chạy — ô này nói rõ phần nào ĐÃ tự chạy,
// phần nào còn thiếu. Hàm thuần để kiểm được; màn điều khiển chỉ hiển thị.
//
// Mỗi dòng: { muc: "ok" | "cho" | "thieu", chu, luc? }. Có `luc` (ISO) thì màn điều khiển thay
// "{luc}" trong `chu` bằng giờ địa phương của trình duyệt — máy chủ không biết múi giờ người xem.

/**
 * @param {{ caDemBat: boolean, lichBat: boolean, soDoiThu: number, dangChay: boolean,
 *   caRadar: { ketThuc: string, soTrich?: number, loi?: string[] } | null,
 *   choAi: number, daTungDoc: boolean, lucClaudeDoc: string | null, soCanXem?: number }} v
 *   soCanXem: số bài dự kiến ở "can_xem" (lò viết bỏ cuộc) — tab Kế hoạch mở ở bộ lọc "Chờ duyệt"
 *   nên không có dòng này thì chúng nằm im không ai thấy (nghiệm thu 2C-3, Bất ngờ 2).
 */
export function tinhTrangTuDong(v) {
	const ds = [];

	if (v.lichBat) ds.push({ muc: "ok", chu: "Lịch đêm đã bật: 02:30 mỗi đêm máy tự quét trang mới của các đối thủ." });
	else if (v.caDemBat) ds.push({ muc: "thieu", chu: "Lịch đêm chưa bật được — bấm “Bật lịch” bên dưới." });
	else ds.push({ muc: "cho", chu: "Máy này không chạy ca đêm; lịch đêm chạy trên máy chủ thật." });

	if (!v.soDoiThu) ds.push({ muc: "thieu", chu: "Chưa có đối thủ nào — nhập tên miền ở mục Đối thủ bên dưới." });

	if (v.dangChay) ds.push({ muc: "cho", chu: "Ca radar đang chạy — vài phút nữa bấm “Tải lại”." });
	else if (v.caRadar) {
		const coLoi = (v.caRadar.loi ?? []).length > 0;
		ds.push({
			muc: coLoi ? "cho" : "ok",
			chu: `Ca radar gần nhất xong lúc {luc}, lấy chữ ${v.caRadar.soTrich ?? 0} trang${coLoi ? " (có ghi chú lỗi — xem Nhật ký ca)" : ""}.`,
			luc: v.caRadar.ketThuc,
		});
	} else
		ds.push({
			muc: "cho",
			chu: v.caDemBat
				? "Chưa có ca radar nào chạy xong — ca đầu tự chạy khi lưu đối thủ, hoặc đêm nay lúc 02:30."
				: "Chưa có ca radar nào chạy xong trên máy chủ.",
		});

	if (v.choAi > 0) ds.push({ muc: "cho", chu: `${v.choAi} trang đã lấy chữ, đang chờ Claude đọc.` });

	if (!v.daTungDoc)
		ds.push({ muc: "thieu", chu: "Phần Claude đọc bài chưa chạy: cần tạo routine trên claude.ai (một lần) — xem DEPLOYMENT.md mục Rada SEO." });
	else if (v.lucClaudeDoc) ds.push({ muc: "ok", chu: "Claude đã đọc bài đối thủ, lần gần nhất lúc {luc}.", luc: v.lucClaudeDoc });
	else ds.push({ muc: "ok", chu: "Claude đã từng đọc bài đối thủ." });

	if (v.soCanXem > 0)
		ds.push({ muc: "thieu", chu: `${v.soCanXem} bài máy viết chưa đạt — cần bạn xem lại ở tab Kế hoạch (lọc “Cần xem lại”).` });

	return ds;
}
