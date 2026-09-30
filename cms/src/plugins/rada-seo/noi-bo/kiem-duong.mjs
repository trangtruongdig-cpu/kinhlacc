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

const thoatRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** `ten` có mặt trong `chu` theo RANH GIỚI TỪ: "ho" không khớp trong "hoàng kỳ". */
function coTenTron(chu, ten) {
	return new RegExp(`(?<![\\p{L}\\p{N}\\p{M}])${thoatRegex(ten)}(?![\\p{L}\\p{N}\\p{M}])`, "u").test(chu);
}

/**
 * Đệm LRU có trần cho kết quả tải trang: khoá = URL, giá trị = { v: {song, tieuDe} | null, het }.
 * CHỈ giữ cờ sống + tiêu đề đã rút — không bao giờ giữ HTML (2.000 trang HTML là hàng chục MB).
 */
export function taoDemKiem({ toiDa = 2000 } = {}) {
	const m = new Map();
	return {
		get(k) {
			const x = m.get(k);
			if (x) {
				m.delete(k);
				m.set(k, x);
			}
			return x;
		},
		set(k, x) {
			m.delete(k);
			m.set(k, x);
			while (m.size > toiDa) m.delete(m.keys().next().value);
		},
		kichThuoc: () => m.size,
		giaTri: () => [...m.values()].map((x) => x.v),
		xoa: () => m.clear(),
	};
}

/**
 * Đệm DÙNG CHUNG của tiến trình: route mcp-tim-lien-ket dựng bộ kiểm mới mỗi lời gọi, nhưng
 * lượt đêm gọi nhiều lần với các cụm lặp lại — đệm ở mức module mới tránh tải lại. Một container
 * CMS, cùng giả định với chỉ mục (nap.mjs) và khoá ca.
 */
export const DEM_KIEM_CHUNG = taoDemKiem();

/** Lỗi mạng (null) chỉ nhớ ngắn: một lần chập mạng không được xoá link cả đêm. */
const TTL_LOI_MANG_MS = 5 * 60 * 1000;

/**
 * @param {(url: string) => Promise<{status: number, xRobots: string, html: string} | null>} docTrang
 *   null = lỗi mạng / không tải được
 * @returns {(duong: string, tenMong?: string) => Promise<boolean>}
 */
export function taoKiemDuong(
	docTrang,
	{ goc = process.env.RADA_SEO_SITE ?? "https://kinhlac.online", ttlMs = 24 * 3600 * 1000, ttlLoiMs = TTL_LOI_MANG_MS, now = Date.now, dem = DEM_KIEM_CHUNG } = {},
) {
	/** url → promise đang tải: lời gọi đồng thời cho cùng trang (Âm/Ẩm Khích chung slug_goc) chờ chung. */
	const dangTai = new Map();
	const tai = (url) => {
		const cu = dem.get(url);
		if (cu && now() < cu.het) return Promise.resolve(cu.v);
		if (dangTai.has(url)) return dangTai.get(url);
		const p = Promise.resolve()
			.then(() => docTrang(url))
			.catch(() => null)
			.then((trang) => {
				const v = trang
					? { song: trang.status === 200 && !/noindex/i.test(trang.xRobots ?? ""), tieuDe: tieuDeTrang(trang.html ?? "") }
					: null;
				dem.set(url, { v, het: now() + (v ? ttlMs : ttlLoiMs) });
				return v;
			})
			.finally(() => dangTai.delete(url));
		dangTai.set(url, p);
		return p;
	};
	return async (duong, tenMong) => {
		const v = await tai(`${goc}${duong}`);
		if (!v || !v.song) return false;
		if (!tenMong) return true;
		const ten = chuanCoDau(tenMong);
		return v.tieuDe.some((t) => coTenTron(t, ten));
	};
}

/** Đường ĐẦU TIÊN của mục qua được bộ kiểm với tên mục; null nếu không đường nào đạt. */
export async function chonDuong(kiemDuong, muc) {
	for (const d of muc.duong ?? []) if (await kiemDuong(d, muc.ten)) return d;
	return null;
}
