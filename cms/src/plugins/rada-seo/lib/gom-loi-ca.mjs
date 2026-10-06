/**
 * Gom lỗi của các ca gần nhất theo LÝ DO.
 *
 * Vì sao: đo trên màn thật 06/10/2026 — 10 dòng nhật ký, 7 dòng ghi đúng hai chữ "1 lỗi". Bảng
 * đó không nói được lỗi gì, nên muốn biết phải bấm ▸ bảy lần mới thấy chúng là CÙNG một lỗi.
 * Một câu "7/10 ca gần nhất lỗi · hay gặp nhất: …" trả lời ngay điều người ta cần.
 *
 * Cùng lối tab Góp Ý & Lỗi: gom theo lý do đã CHUẨN HOÁ, vì "tải 12 trang hỏng" và "tải 97 trang
 * hỏng" là một chuyện — không chuẩn hoá thì mỗi ca một nhóm và việc gom thành vô nghĩa.
 */

/** Bỏ số và gộp khoảng trắng. Giữ nguyên chữ: lý do là chữ người đọc, không phải vân tay băm. */
const chuanHoa = (s) =>
	String(s ?? "")
		.replace(/\d+/g, "#")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 120);

/**
 * @param {{loi?: string[]}[]} ca Các ca gần nhất (thứ tự nào cũng được).
 * @returns {{soCaLoi: number, tong: number, nhom: {lyDo: string, lan: number}[], cau: string}}
 *   `cau` rỗng khi không ca nào lỗi — im lặng ở đó là đúng.
 */
export function gomLoiCa(ca) {
	const ds = Array.isArray(ca) ? ca : [];
	const dem = new Map();
	let soCaLoi = 0;
	for (const c of ds) {
		const loi = Array.isArray(c?.loi) ? c.loi : [];
		if (loi.length === 0) continue;
		soCaLoi++;
		// Một ca mang nhiều lỗi thì mỗi LÝ DO chỉ đếm một lần cho ca đó — không thì một ca ồn ào
		// tự mình định nghĩa cả bảng.
		for (const k of new Set(loi.map(chuanHoa))) {
			if (!k) continue;
			const cu = dem.get(k);
			if (cu) cu.lan++;
			else dem.set(k, { lyDo: loi.find((x) => chuanHoa(x) === k) ?? k, lan: 1 });
		}
	}
	const nhom = [...dem.values()].sort((a, b) => b.lan - a.lan);
	return {
		soCaLoi,
		tong: ds.length,
		nhom,
		cau: soCaLoi ? `${soCaLoi}/${ds.length} ca gần nhất có lỗi · hay gặp nhất: ${nhom[0].lyDo}${nhom.length > 1 ? ` (và ${nhom.length - 1} lý do khác)` : ""}` : "",
	};
}
