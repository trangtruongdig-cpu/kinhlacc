// Slug không dấu cho bài lò viết: "Châm cứu hỗ trợ giấc ngủ: 5 huyệt…" → "cham-cuu-ho-tro-giac-ngu-5-huyet…".
// boDau đã lo cả đ/Đ → d (chữ đ không tách được dấu bằng NFD nên phải thay riêng — xem chuan-hoa.mjs).

import { boDau } from "./chuan-hoa.mjs";

/**
 * @param {string} tieuDe
 * @param {{toiDa?: number}} [tuyChon]
 * @returns {string}
 */
export function slugKhongDau(tieuDe, { toiDa = 70 } = {}) {
	const s = boDau(String(tieuDe ?? "").normalize("NFC"))
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	if (s.length <= toiDa) return s;
	// Cắt ở ranh giới từ: lấy tới dấu "-" cuối cùng còn nằm trong toiDa (kể cả dấu ngay sau toiDa).
	const cat = s.slice(0, toiDa + 1);
	const vt = cat.lastIndexOf("-");
	// Từ đầu tiên đã dài hơn toiDa: cắt cứng, còn hơn trả slug rỗng.
	return vt > 0 ? cat.slice(0, vt) : s.slice(0, toiDa);
}
