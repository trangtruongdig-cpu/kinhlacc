/**
 * SỨC KHOẺ BOT → dòng việc ở màn Việc.
 *
 * Vì sao có file này: người dùng cần biết bot có kẹt không, NHƯNG tín hiệu đó nằm ở tab Radar —
 * tab họ ít mở (họ nói thẳng 06/10/2026). Nên việc đúng không phải làm tab Radar đẹp hơn, mà là
 * đưa tín hiệu kẹt ra khỏi nó, sang tab mặc định.
 *
 * ⚠️ File này KHÔNG tính lại luật cảnh báo. Luật sống ở route `tong-quan`
 * (`canhBaoCaDem` / `canhBaoClaude`) và đã trả giá qua nhiều ghi chú ở đó — ví dụ "không đòi
 * `loi` rỗng, không thì cảnh báo 26 giờ đỏ vĩnh viễn dù đêm nào ca cũng chạy xong". Viết bản thứ
 * hai là hai luật lệch nhau mà không ai biết. Ở đây chỉ DỊCH cờ thành dòng việc.
 */

/** Hệ thống kẹt đứng TRÊN mọi việc nội dung: hàng đợi không chảy thì mọi thứ phía sau đứng theo. */
const BAC = 0;

const dong = (ma, ten, viSao, heQua) => ({
	loai: "he_thong_ket",
	khoa: `he_thong_ket|${ma}`,
	id: ma,
	bac: BAC,
	nhan: "Hệ thống kẹt",
	ten,
	viSao,
	heQua,
	hanhDong: ["mo_radar"],
	hienThi: 0,
});

/**
 * @param {{canhBaoCaDem?: boolean, canhBaoClaude?: boolean, choAi?: number, coModel?: boolean}} t
 *   `canhBaoCaDem` / `canhBaoClaude` lấy nguyên từ `tong-quan`; `coModel` = đã khai khoá model chưa.
 * @returns {object[]} 0–2 dòng việc. Rỗng nghĩa là mọi thứ đang chạy — im lặng ở đây là đúng.
 */
export function viecHeThong(t) {
	const v = t ?? {};
	const ds = [];

	if (v.canhBaoCaDem)
		ds.push(
			dong(
				"ca-dem",
				"Ca radar đêm chưa chạy xong lần nào trong hơn 26 giờ",
				"Ca 02:30 là nguồn của mọi thứ phía sau: không có URL mới thì khoảng trống, hướng và lò viết đều đứng. Mở tab Radar xem Nhật ký ca để biết hỏng ở khâu nào.",
				"Mở Radar → cuộn xuống Nhật ký ca, bấm ▸ ở dòng có lỗi để xem lý do.",
			),
		);

	if (v.canhBaoClaude) {
		// ⚠️ "Chưa khai khoá" và "có khoá mà gọi hỏng" dẫn tới hai việc khác hẳn. Gộp là bảo người
		// ta đi kiểm hạn mức của một khoá chưa tồn tại.
		const viSao = v.coModel
			? `${v.choAi ?? 0} trang đã trích chữ xong và đang chờ model đọc, nhưng 26 giờ qua không đọc được trang nào. Kiểm GRAVITY_API_KEY trong cms/.env và hạn mức của khoá — hết quota trả HTTP 429.`
			: `${v.choAi ?? 0} trang đang chờ model đọc, mà khoá model chưa khai. Khai GRAVITY_API_KEY trong cms/.env rồi khởi động lại CMS.`;
		ds.push(dong("model-khong-doc", `${v.choAi ?? 0} trang chờ đọc mà bot không đọc được trang nào`, viSao, "Sửa xong thì bấm “Chạy thật” ở tab Radar để thử ngay, không phải chờ ca 02:30 đêm sau."));
	}

	return ds;
}
