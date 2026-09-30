// Đọc một trang web cho radar: có hạn giờ, không bao giờ ném lỗi (trả "" khi hỏng).
//
// CHỐNG SSRF: CMS chạy chung mạng docker với backend, nên sitemap của đối thủ mà trỏ tới
// http://backend:3000/… thì plugin sẽ gọi vào trong. Chỉ cho phép http(s) tới tên miền có
// dấu chấm, không phải địa chỉ IP, không phải localhost. Radar còn chặn thêm một lớp: chỉ
// đọc URL cùng tên miền với đối thủ đã khai (xem sitemap.mjs).

const UA = "Mozilla/5.0 (compatible; KinhlacSEOBot/1.0; +https://kinhlac.online)";

/** true nếu URL được phép đọc. */
export function urlDocDuoc(url) {
	let u;
	try {
		u = new URL(url);
	} catch {
		return false;
	}
	if (u.protocol !== "http:" && u.protocol !== "https:") return false;
	const h = u.hostname.toLowerCase();
	if (!h.includes(".") || h === "localhost" || h.endsWith(".localhost")) return false;
	if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h) || h.startsWith("[")) return false;
	return true;
}

/** Chạy promise với hạn giờ; hết giờ thì ném lỗi "quá hạn". */
export function voiHanGio(promise, ms, tenViec = "yêu cầu") {
	let hen;
	const het = new Promise((_, reject) => {
		hen = setTimeout(() => reject(new Error(`${tenViec} quá hạn ${ms}ms`)), ms);
	});
	return Promise.race([promise, het]).finally(() => clearTimeout(hen));
}

/**
 * Hạn chờ mỗi trang 30 s. Bản đầu là 15 s và đo ở nghiệm thu 2B-1: MỌI trang của
 * benhvienyhoccotruyentrunguong.vn tải mất ~16 s (curl 200 sau 16,0 s) nên cả đối thủ đó
 * thành 'loi' mà không trang nào tới được Claude. Ca radar đã có hạn chót nên chờ lâu hơn
 * không làm ca chạy chồng.
 * @param {(url: string, init?: RequestInit) => Promise<Response>} fetchFn  ctx.http.fetch
 * @returns {(url: string) => Promise<string>}
 */
export function taoDocWeb(fetchFn, { hanGioMs = 30_000 } = {}) {
	return async (url) => {
		if (!urlDocDuoc(url)) return "";
		try {
			const res = await voiHanGio(
				fetchFn(url, {
					redirect: "follow",
					headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
				}),
				hanGioMs,
				"tải trang",
			);
			if (!res.ok) return "";
			return await res.text();
		} catch {
			return "";
		}
	};
}

/**
 * Như taoDocWeb nhưng trả CẢ trạng thái và header x-robots-tag, kể cả khi không 2xx — cho bộ
 * kiểm đường nội bộ (noi-bo/kiem-duong.mjs). Cần header vì đã ĐO: trang bài thuốc/dược liệu
 * KHÔNG tồn tại vẫn trả 200 (vỏ SPA) kèm `x-robots-tag: noindex`; chỉ nhìn mã 200 là gắn
 * link chết. Cùng lớp chặn SSRF (urlDocDuoc); không bao giờ ném — hỏng thì null.
 * @param {(url: string, init?: RequestInit) => Promise<Response>} fetchFn  ctx.http.fetch
 * @returns {(url: string) => Promise<{status: number, xRobots: string, html: string} | null>}
 */
export function taoDocTrang(fetchFn, { hanGioMs = 30_000 } = {}) {
	return async (url) => {
		if (!urlDocDuoc(url)) return null;
		try {
			const res = await voiHanGio(
				fetchFn(url, { redirect: "follow", headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8" } }),
				hanGioMs,
				"tải trang",
			);
			return { status: res.status, xRobots: res.headers.get("x-robots-tag") ?? "", html: await res.text() };
		} catch {
			return null;
		}
	};
}
