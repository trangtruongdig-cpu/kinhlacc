// Kiểm một đường nội bộ trên SITE THẬT trước khi đưa cho Claude gắn link.
//
// Ba sự thật đã ĐO (30/09/2026) quyết định luật ĐẠT:
// - Trang bài thuốc/dược liệu không tồn tại vẫn trả 200 (vỏ SPA) kèm `x-robots-tag: noindex`
//   → noindex coi như không có trang.
// - "Âm Khích" và "Ẩm Khích" cùng slug_goc; chỉ tên CÓ DẤU trong <title>/<h1> phân định được
//   trang nào là của mục nào → so tên có dấu (NFC, chữ thường), KHÔNG bỏ dấu.
// - Đường sai trên nginx có thể rơi về vỏ app mã 200 → không tin mã 200 trần.

/** Giải vài thực thể HTML hay gặp trong <title>. */
function giaiThucThe(s) {
	return s
		.replace(/&nbsp;/g, " ")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&(?:apos|#39);/g, "'")
		.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
		.replace(/&amp;/g, "&");
}

/** NFC, chữ thường, gộp khoảng trắng — GIỮ dấu. */
export function chuanCoDau(s) {
	return giaiThucThe(String(s ?? ""))
		.normalize("NFC")
		.toLowerCase()
		.replace(/\s+/g, " ")
		.trim();
}

/** Chữ trong <title> và mọi <h1> (bỏ thẻ con), đã chuẩn hoá. */
function tieuDeTrang(html) {
	const ra = [];
	const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
	if (t) ra.push(t[1]);
	for (const m of html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)) ra.push(m[1].replace(/<[^>]+>/g, " "));
	return ra.map(chuanCoDau);
}

/**
 * @param {(url: string) => Promise<{status: number, xRobots: string, html: string} | null>} docTrang
 * @returns {(duong: string, tenMong?: string) => Promise<boolean>}
 */
export function taoKiemDuong(docTrang, { goc = process.env.RADA_SEO_SITE ?? "https://kinhlac.online", ttlMs = 24 * 3600 * 1000, now = Date.now } = {}) {
	/** `duong|tenMong` → { kq: Promise<boolean>, het }. Đệm cả trượt: trang chết không tải lại cả đêm. */
	const dem = new Map();
	/** duong → { p: Promise<trang>, het }: cùng đường mà khác tên mong (hai mục chung slug_goc) tải MỘT lần. */
	const demTrang = new Map();
	const tai = (duong) => {
		const cu = demTrang.get(duong);
		if (cu && now() < cu.het) return cu.p;
		const p = docTrang(`${goc}${duong}`);
		demTrang.set(duong, { p, het: now() + ttlMs });
		return p;
	};
	const kiem = async (duong, tenMong) => {
		const trang = await tai(duong);
		if (!trang || trang.status !== 200 || /noindex/i.test(trang.xRobots ?? "")) return false;
		if (!tenMong) return true;
		const ten = chuanCoDau(tenMong);
		return tieuDeTrang(trang.html ?? "").some((t) => t.includes(ten));
	};
	return (duong, tenMong) => {
		const khoa = `${duong}|${tenMong ?? ""}`;
		const cu = dem.get(khoa);
		if (cu && now() < cu.het) return cu.kq;
		const kq = kiem(duong, tenMong).catch(() => false);
		dem.set(khoa, { kq, het: now() + ttlMs });
		return kq;
	};
}

/** Đường ĐẦU TIÊN của mục qua được bộ kiểm với tên mục; null nếu không đường nào đạt. */
export async function chonDuong(kiemDuong, muc) {
	for (const d of muc.duong ?? []) if (await kiemDuong(d, muc.ten)) return d;
	return null;
}
