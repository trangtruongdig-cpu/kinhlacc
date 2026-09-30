// HTML → chữ, và bộ lọc ngách Đông Y (chép từ SeoService của app, 30/09/2026).
import { boDau } from "../luat/chuan-hoa.mjs";

export const TRAN_KY_TU = 5000;

// So khớp KHÔNG dấu. Tránh "huyet" trần (trùng "huyết áp" Tây Y) → chỉ cụm cụ thể.
export const TU_DONG_Y = [
	"dong y", "y hoc co truyen", "yhct", "co truyen",
	"kinh lac", "kinh mach", "duong kinh", "12 duong kinh", "tinh huyet",
	"cham cuu", "bam huyet", "an huyet", "huyet vi", "huyet dao", "xoa bop",
	"bai thuoc", "vi thuoc", "thao duoc", "thuoc nam", "thuoc bac", "duoc lieu", "thang thuoc",
	"tinh vi quy kinh", "quy kinh", "tu khi ngu vi",
	"bien chung luan tri", "luan tri", "bat cuong", "tang phu", "khi huyet", "am duong", "ngu hanh",
	"cay chi", "dien chan", "thuy cham", "cuu ngai", "mach chan", "vong chan",
];

function giaiMaHtml(s) {
	return s
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/&quot;/gi, '"')
		.replace(/&(?:#39|apos);/gi, "'")
		.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

/** @returns {{tieuDe: string, moTa: string, than: string}} */
export function htmlSangChu(html) {
	const h = String(html ?? "");
	const tieuDe = (h.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
	const moTa = (
		h.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i)?.[1] ||
		h.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']/i)?.[1] ||
		""
	).trim();
	const than = giaiMaHtml(
		h
			.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
			.replace(/<!--[\s\S]*?-->/g, " ")
			.replace(/<[^>]+>/g, " "),
	)
		.replace(/\s+/g, " ")
		.trim();
	return { tieuDe: giaiMaHtml(tieuDe), moTa: giaiMaHtml(moTa), than };
}

/**
 * Có thuộc ngách Đông Y không. CHỈ xét URL + tiêu đề + mô tả, KHÔNG xét thân bài: thân có
 * menu toàn trang nên trang nào của một bệnh viện có mục "Đông y" cũng sẽ khớp.
 */
export function laDongY(vanBan) {
	const t = boDau(vanBan).replace(/\s+/g, " ");
	return TU_DONG_Y.some((k) => t.includes(k));
}
