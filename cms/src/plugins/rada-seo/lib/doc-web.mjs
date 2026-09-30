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
 * Trần thân trang: 1,5 MB. Một trang (hay một sitemap trỏ nhầm tới tệp nén/video) nặng hàng
 * trăm MB thì res.text() nuốt hết RAM của container CMS — mà container đó chính là khu quản
 * trị. Quá trần thì dừng đọc và huỷ luồng; phần đã đọc vẫn dùng được (đầu trang có title,
 * meta, đoạn mở đầu). Tính theo byte của luồng; bản lùi res.text() (không có luồng) thì cắt theo
 * ký tự và chỉ chạy khi content-length ≤ TRAN_BYTE_KHONG_LUONG.
 */
export const TRAN_BYTE_THAN = 1_500_000;

/**
 * Không có luồng thì res.text() nuốt CẢ thân rồi mới cắt được — trần 1,5 MB không bảo vệ gì. Nên
 * chỉ đi đường đó khi header content-length khai ≤ 5 MB; lớn hơn hay KHÔNG khai (không biết
 * trước) thì từ chối: taoDocWeb trả "", taoDocTrang trả null.
 */
export const TRAN_BYTE_KHONG_LUONG = 5_000_000;

/** Lỗi "trang quá lớn" (loi = "qua_lon") — đọc về là hỏng, như lỗi mạng. */
function loiQuaLon(len) {
	return Object.assign(new Error(`thân không có luồng, content-length ${len ?? "không khai"} — từ chối đọc`), { loi: "qua_lon" });
}

/** Đọc thân tối đa `tran` byte. @returns {Promise<{html: string, catBot: boolean}>} */
async function docThan(res, tran, huy) {
	const reader = res.body && typeof res.body.getReader === "function" ? res.body.getReader() : null;
	if (!reader) {
		const khai = res.headers?.get?.("content-length");
		const len = khai == null || String(khai).trim() === "" ? NaN : Number(khai);
		if (!Number.isFinite(len) || len < 0 || len > TRAN_BYTE_KHONG_LUONG) throw loiQuaLon(khai);
		const t = String(await res.text());
		return t.length > tran ? { html: t.slice(0, tran), catBot: true } : { html: t, catBot: false };
	}
	huy.reader = reader;
	const giai = new TextDecoder("utf-8");
	let html = "", da = 0, catBot = false;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		let khoi = value;
		if (da + khoi.byteLength > tran) {
			khoi = khoi.subarray(0, tran - da);
			catBot = true;
		}
		da += khoi.byteLength;
		html += giai.decode(khoi, { stream: true });
		if (catBot) {
			reader.cancel().catch(() => {});
			break;
		}
	}
	html += giai.decode();
	// Cắt ngang một ký tự nhiều byte để lại ký tự thay thế ở cuối — bỏ đi.
	return { html: catBot ? html.replace(/\uFFFD+$/, "") : html, catBot };
}

/**
 * Tải + đọc thân trong CÙNG một hạn giờ. Hạn chỉ bọc fetch() là chưa đủ: header về ngay
 * còn thân nhỏ giọt thì res.text() treo cả ca. Hết hạn → huỷ yêu cầu và luồng.
 */
async function taiVaDoc(fetchFn, url, accept, hanGioMs) {
	const ac = typeof AbortController === "function" ? new AbortController() : null;
	const huy = { reader: null };
	const viec = (async () => {
		const res = await fetchFn(url, { redirect: "follow", signal: ac?.signal, headers: { "User-Agent": UA, Accept: accept } });
		const than = await docThan(res, TRAN_BYTE_THAN, huy);
		return { res, ...than };
	})();
	try {
		return await voiHanGio(viec, hanGioMs, "tải trang");
	} catch (e) {
		ac?.abort();
		huy.reader?.cancel().catch(() => {});
		viec.catch(() => {});
		throw e;
	}
}

/**
 * Hạn chờ mỗi trang 30 s (gồm cả đọc thân). Bản đầu là 15 s và đo ở nghiệm thu 2B-1: MỌI trang của
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
			const r = await taiVaDoc(fetchFn, url, "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", hanGioMs);
			return r.res.ok ? r.html : "";
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
 * Thân quá TRAN_BYTE_THAN thì bị cắt và kết quả có thêm `catBot: true`.
 * @param {(url: string, init?: RequestInit) => Promise<Response>} fetchFn  ctx.http.fetch
 * @returns {(url: string) => Promise<{status: number, xRobots: string, html: string, catBot?: true} | null>}
 */
export function taoDocTrang(fetchFn, { hanGioMs = 30_000 } = {}) {
	return async (url) => {
		if (!urlDocDuoc(url)) return null;
		try {
			const r = await taiVaDoc(fetchFn, url, "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8", hanGioMs);
			const kq = { status: r.res.status, xRobots: r.res.headers?.get?.("x-robots-tag") ?? "", html: r.html };
			return r.catBot ? { ...kq, catBot: true } : kq;
		} catch {
			return null;
		}
	};
}
