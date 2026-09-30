// Dò xu hướng tìm kiếm qua gợi ý của Google (không khoá, không mô hình).
import { boDau } from "../luat/chuan-hoa.mjs";

export const HAT_GIONG = [
	"đo kinh lạc", "đo nhiệt độ kinh lạc", "huyệt", "bấm huyệt", "kinh lạc",
	"châm cứu", "bài thuốc đông y", "tính vị quy kinh", "huyệt đạo", "12 đường kinh",
];

/** Đọc phản hồi của suggestqueries (client=firefox): ["q", ["gợi ý", …]]. */
export function docGoiY(chu) {
	try {
		const d = JSON.parse(chu);
		return Array.isArray(d) && Array.isArray(d[1]) ? d[1].map(String) : [];
	} catch {
		return [];
	}
}

/**
 * @param {{docWeb: (u: string) => Promise<string>, hatGiong?: string[], tran?: number}} o
 * @returns {Promise<string[]>} cụm tìm kiếm, khử trùng theo dạng bỏ dấu
 */
export async function timXuHuong({ docWeb, hatGiong = HAT_GIONG, tran = 50 }) {
	const gap = new Map();
	for (const h of hatGiong.slice(0, 12)) {
		const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=vi&gl=vn&ie=utf-8&oe=utf-8&q=${encodeURIComponent(h)}`;
		for (const g of docGoiY(await docWeb(url))) {
			const k = boDau(g).trim();
			if (k && !gap.has(k)) gap.set(k, g.trim());
		}
	}
	return [...gap.values()].slice(0, tran);
}
