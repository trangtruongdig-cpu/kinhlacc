// Đọc một trang web cho radar: có hạn giờ, không bao giờ ném lỗi (trả "" khi hỏng).
//
// CHỐNG SSRF: CMS chạy chung mạng docker với backend, nên sitemap của đối thủ mà trỏ tới
// http://backend:3000/… thì plugin sẽ gọi vào trong. Chỉ cho phép http(s) tới tên miền có
// dấu chấm, không phải địa chỉ IP, không phải localhost. Radar còn chặn thêm một lớp: chỉ
// đọc URL cùng tên miền với đối thủ đã khai (xem sitemap.mjs).

import { canThuTrungGian, duongTrungGian, HAN_GIO_TRUNG_GIAN_MS } from "./doc-qua-trung-gian.mjs";

const UA = "Mozilla/5.0 (compatible; KinhlacSEOBot/1.0; +https://kinhlac.online)";

/**
 * true nếu URL được phép đọc. Đây chỉ là lớp kiểm CHỮ (rẻ, trả lý do sớm). Lớp chặn thật với
 * tên miền trỏ về IP nội bộ (`*.nip.io`, `localtest.me`) và chuyển hướng sang 127.0.0.1/169.254.x
 * nằm ở `ctx.http.fetch` của plugin: đó là `ssrfSafeFetch` của EmDash — phân giải DNS qua DoH,
 * chặn mọi IP không công khai, và kiểm lại TỪNG bước chuyển hướng (đã đo, rà soát 2C-3 M1).
 * Đừng gọi `fetch` toàn cục thay cho nó.
 */
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
 * ⚠️ Hàm này trả CHUỖI RỖNG khi tải hỏng, nên người gọi không phân biệt được "trang rỗng" với
 * "không đọc được". Đã trả giá đúng chỗ đó: ngày 02/10/2026 `timXuHuong` ra 0 xu hướng suốt một
 * ca, nhật ký ca sạch bong, mà chạy cùng hàm ngoài ca thì ra 50 xu hướng trong 844 ms. Phải đọc
 * log container mới lần ra, và log thì cuộn mất.
 *
 * Giá trị trả về GIỮ NGUYÊN (mọi chỗ gọi đang dựa vào chuỗi rỗng); lý do đi ra qua `ghiLoi`.
 * Chỗ gọi nào có nhật ký thì PHẢI truyền `ghiLoi` — xem `chayCa` trong plugin.mjs.
 *
 * @param {(url: string, init?: RequestInit) => Promise<Response>} fetchFn  ctx.http.fetch
 * @param {{hanGioMs?: number, ghiLoi?: (x: {url: string, lyDo: string}) => void}} [o]
 * @returns {(url: string) => Promise<string>}
 */
export function taoDocWeb(fetchFn, { hanGioMs = 30_000, ghiLoi, gocTrungGian = "" } = {}) {
	const bao = (url, lyDo) => {
		// Bản thân việc báo lỗi không bao giờ được làm hỏng lượt đọc.
		try {
			ghiLoi?.({ url, lyDo });
		} catch {}
	};
	return async (url) => {
		if (!urlDocDuoc(url)) {
			bao(url, "đường dẫn không đọc được (địa chỉ nội bộ hay giao thức lạ)");
			return "";
		}
		try {
			const r = await taiVaDoc(fetchFn, url, ACCEPT_WEB, hanGioMs);
			if (r.res.ok) return r.html;
			// Mã TỪ CHỐI BOT → thử lại qua dịch vụ trung gian (mặc định TẮT).
			if (canThuTrungGian(r.res.status)) {
				const qua = await thuTrungGian(fetchFn, url, gocTrungGian);
				if (qua.html !== null) return qua.html;
				bao(url, `HTTP ${r.res.status}${qua.lyDo ? `, đã thử qua trung gian: ${qua.lyDo}` : ""}`);
				return "";
			}
			bao(url, `HTTP ${r.res.status}`);
			return "";
		} catch (e) {
			bao(url, lyDoLoiTai(e, url, hanGioMs));
			return "";
		}
	};
}

const ACCEPT_WEB = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";

/**
 * Thử đọc lại qua dịch vụ trung gian. KHÔNG bao giờ ném.
 *
 * ⚠️ Hạn giờ dùng `HAN_GIO_TRUNG_GIAN_MS` chứ KHÔNG dùng `hanGioMs` của người gọi: đo
 * 07/10/2026, một sitemap 1,09 MB qua trung gian mất 40,2 s — dùng chung hạn 30 s thì mọi
 * sitemap lớn đều "quá hạn", tức vẫn 0 URL, chỉ khác lý do ghi trong nhật ký.
 *
 * @returns {Promise<{html: string|null, lyDo?: string}>} html = null khi không đi được hoặc hỏng.
 */
async function thuTrungGian(fetchFn, url, gocTrungGian) {
	const duong = duongTrungGian(url, gocTrungGian);
	if (!duong) return { html: null };
	try {
		const r = await taiVaDoc(fetchFn, duong, ACCEPT_WEB, HAN_GIO_TRUNG_GIAN_MS);
		if (r.res.ok) return { html: r.html };
		return { html: null, lyDo: `HTTP ${r.res.status}` };
	} catch (e) {
		return { html: null, lyDo: lyDoLoiTai(e, duong, HAN_GIO_TRUNG_GIAN_MS) };
	}
}

/** Mã lỗi của cả chuỗi `cause` (undici gói lỗi thật trong TypeError "fetch failed"). */
function chuoiLoi(e) {
	const ra = [];
	for (let x = e, i = 0; x && i < 6; x = x.cause, i++) ra.push({ code: String(x.code ?? ""), msg: String(x.message ?? x), name: String(x.name ?? "") });
	return ra;
}

/**
 * Lý do tải hỏng bằng tiếng Việt, đúng NGUYÊN NHÂN. Bản đầu gộp mọi lỗi thành "quá hạn 10 s, bị
 * chặn hoặc lỗi mạng" — nghiệm thu 2D đo được lượt 1,2 s mà vẫn báo quá hạn, trong khi thật ra là
 * HTTP/2 PROTOCOL_ERROR, tên miền AMP đã chết, hay chuyển hướng sang tên miền khác.
 * Nguồn lỗi: voiHanGio (quá hạn), ctx.http.fetch của EmDash ('blocked fetch to "host": <SsrfError>',
 * 'too many redirects'), và undici (TypeError "fetch failed" + cause.code).
 * @param {unknown} e  @param {string} url  URL đã gửi (so tên miền để nhận ra chuyển hướng)
 */
export function lyDoLoiTai(e, url, hanGioMs) {
	if (e?.loi === "qua_lon") return "trang quá lớn (không khai cỡ)";
	const ds = chuoiLoi(e);
	const co = (re) => ds.some((x) => re.test(x.code) || re.test(x.msg));
	if (ds.some((x) => /quá hạn/.test(x.msg))) return `quá hạn ${hanGioMs / 1000} s`;
	const chan = ds.map((x) => x.msg.match(/blocked fetch to "([^"]*)": ([\s\S]*)/)).find(Boolean);
	if (chan) {
		let hostGui = "";
		try {
			hostGui = new URL(url).hostname.toLowerCase();
		} catch {}
		if (/could not resolve hostname|resolved to no addresses/i.test(chan[2])) return "không phân giải được tên miền";
		if (chan[1] && chan[1].toLowerCase() !== hostGui) return `chuyển hướng sang tên miền khác bị chặn (${chan[1]})`;
		return "bị chặn (địa chỉ nội bộ)";
	}
	if (co(/too many redirects/i)) return "chuyển hướng quá nhiều lần";
	if (co(/not allowed to fetch from host|redirect mode/i)) return "chuyển hướng sang tên miền khác bị chặn";
	if (co(/^(ENOTFOUND|EAI_AGAIN|EAI_NONAME|EAI_NODATA)$/) || co(/could not resolve hostname/i)) return "không phân giải được tên miền";
	if (ds.some((x) => x.code === "SSRF_BLOCKED" || x.name === "SsrfError")) return "bị chặn (địa chỉ nội bộ)";
	if (co(/^(HPE_|ERR_HTTP2|ERR_INVALID_HTTP|UND_ERR_INFO)/) || co(/PROTOCOL_ERROR|protocol error/i)) return "lỗi giao thức";
	if (ds.some((x) => x.name === "AbortError" || x.name === "TimeoutError") || co(/^(ETIMEDOUT|UND_ERR_CONNECT_TIMEOUT|UND_ERR_HEADERS_TIMEOUT|UND_ERR_BODY_TIMEOUT)$/))
		return "quá hạn kết nối";
	if (co(/^ECONNREFUSED$/)) return "máy chủ từ chối kết nối";
	if (co(/^(ECONNRESET|UND_ERR_SOCKET|EPIPE)$/)) return "kết nối bị ngắt giữa chừng";
	if (co(/CERT|SSL|TLS/i)) return "lỗi chứng chỉ TLS";
	const cuoi = ds[ds.length - 1];
	return `lỗi mạng: ${(cuoi?.code || cuoi?.msg || "không rõ").slice(0, 120)}`;
}

/**
 * Như taoDocWeb nhưng trả CẢ trạng thái và header x-robots-tag, kể cả khi không 2xx — cho bộ
 * kiểm đường nội bộ (noi-bo/kiem-duong.mjs). Cần header vì đã ĐO: trang bài thuốc/dược liệu
 * KHÔNG tồn tại vẫn trả 200 (vỏ SPA) kèm `x-robots-tag: noindex`; chỉ nhìn mã 200 là gắn
 * link chết. Cùng lớp chặn SSRF (urlDocDuoc); không bao giờ ném — hỏng thì null.
 * Thân quá TRAN_BYTE_THAN thì bị cắt và kết quả có thêm `catBot: true`.
 * `traLyDo: true` (đường leo top): hỏng thì trả `{ loi }` — lý do tiếng Việt (lyDoLoiTai) — thay cho null.
 * @param {(url: string, init?: RequestInit) => Promise<Response>} fetchFn  ctx.http.fetch
 * @returns {(url: string) => Promise<{status: number, xRobots: string, html: string, catBot?: true} | null>}
 */
export function taoDocTrang(fetchFn, { hanGioMs = 30_000, traLyDo = false } = {}) {
	return async (url) => {
		if (!urlDocDuoc(url)) return traLyDo ? { loi: "bị chặn (địa chỉ nội bộ)" } : null;
		try {
			const r = await taiVaDoc(fetchFn, url, "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8", hanGioMs);
			const kq = { status: r.res.status, xRobots: r.res.headers?.get?.("x-robots-tag") ?? "", html: r.html };
			return r.catBot ? { ...kq, catBot: true } : kq;
		} catch (e) {
			return traLyDo ? { loi: lyDoLoiTai(e, url, hanGioMs) } : null;
		}
	};
}
