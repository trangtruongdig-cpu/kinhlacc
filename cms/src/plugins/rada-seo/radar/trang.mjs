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
		.replace(/&#(\d{1,7});/g, (x, n) => (Number(n) <= 0x10ffff ? String.fromCodePoint(Number(n)) : x));
}

// ---- Quét TUYẾN TÍNH ----
// Trang đọc về là dữ liệu của người khác (có khi cố ý phá, có khi chỉ hỏng). Biểu thức kiểu
// `<[^>]+>`, `<(script)[\s\S]*?<\/\1>` hay `<meta[^>]+…` quét tới CUỐI chuỗi từ MỖI thẻ mở
// không đóng → bậc hai: đo 30/09/2026, 50k `<a href="x` mất 57,8 s, 20k `<meta` 32 s — cả ca
// radar treo trên một trang. Mọi phép dưới đây hoặc có lớp ký tự bị chặn bởi "<" (dừng ở thẻ
// kế tiếp), hoặc tìm thẻ đóng bằng indexOf có NHỚ vị trí (mỗi đoạn chuỗi chỉ quét một lần).

/**
 * Tìm lần xuất hiện kế tiếp của `kim` trong `chu` với các truy vấn có `tu` KHÔNG giảm; nhớ kết
 * quả nên tổng công quét là O(n) dù gọi bao nhiêu lần. Không còn thì -1 mãi mãi.
 */
export function timTiep(chu, kim) {
	let p = -2;
	return (tu) => {
		if (p === -1) return -1;
		if (p === -2 || p < tu) p = chu.indexOf(kim, tu);
		return p;
	};
}

/**
 * Thay mọi khối <ten …>…</ten> bằng `thay`. Thẻ mở không có thẻ đóng phía sau thì để nguyên
 * (như biểu thức cũ: không nuốt phần còn lại của trang).
 * @param {string} html
 * @param {string[]} ten  tên thẻ, chữ thường
 */
export function boKhoi(html, ten, thay = " ") {
	const thap = html.toLowerCase();
	const reMo = new RegExp(`<(${ten.join("|")})\\b`, "gi");
	const dong = Object.fromEntries(ten.map((t) => [t, timTiep(thap, `</${t}`)]));
	const lon = timTiep(thap, ">");
	let ra = "", tu = 0, m;
	while ((m = reMo.exec(html))) {
		const d = dong[m[1].toLowerCase()](m.index);
		if (d === -1) continue;
		const g = lon(d);
		const cuoi = g === -1 ? html.length : g + 1;
		ra += html.slice(tu, m.index) + thay;
		tu = reMo.lastIndex = cuoi;
	}
	return ra + html.slice(tu);
}

/** Bỏ chú thích <!-- … -->; chú thích không đóng thì để nguyên. */
export function boChuThich(html) {
	const mo = timTiep(html, "<!--");
	const dong = timTiep(html, "-->");
	let ra = "", tu = 0;
	for (;;) {
		const a = mo(tu);
		if (a === -1) break;
		const b = dong(a + 4);
		if (b === -1) break;
		ra += html.slice(tu, a) + " ";
		tu = b + 3;
	}
	return ra + html.slice(tu);
}

/** Đọc thuộc tính của một thẻ bất kể thứ tự ("content" trước "name" vẫn gặp ở trang thật). */
export function thuocTinh(the, ten) {
	const m = the.match(new RegExp(`\\s${ten}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
	return m ? (m[1] ?? m[2] ?? m[3] ?? "") : null;
}

/** Thẻ mở `<ten …>` (dài ≤ 2000 ký tự, không chứa "<"): mọi lần gặp, theo thứ tự. */
export const reTheMo = (ten) => new RegExp(`<${ten}\\b[^<>]{0,2000}>`, "gi");

/** Nội dung của thẻ <meta> đầu tiên có `khoa`=`giaTri` (khoa: name | property). */
export function meta(html, khoa, giaTri) {
	for (const the of html.match(reTheMo("meta")) || []) {
		const v = thuocTinh(the, khoa);
		if (v && v.toLowerCase() === giaTri) return thuocTinh(the, "content");
	}
	return null;
}

/** @returns {{tieuDe: string, moTa: string, than: string}} */
export function htmlSangChu(html) {
	const h = String(html ?? "");
	let tieuDe = "";
	const mo = reTheMo("title").exec(h);
	if (mo) {
		const tu = mo.index + mo[0].length;
		const d = h.toLowerCase().indexOf("</title", tu);
		if (d !== -1) tieuDe = h.slice(tu, d).trim();
	}
	const moTa = (meta(h, "name", "description") || meta(h, "property", "og:description") || "").trim();
	const than = giaiMaHtml(boChuThich(boKhoi(h, ["script", "style", "noscript", "svg"])).replace(/<[^<>]+>/g, " "))
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
