// Google Search Console trong plugin — nguồn từ khoá "leo top": từ khoá mà trang của mình
// ĐÃ đứng hạng 4–50. Chỉ những từ khoá này mới đáng soi đối thủ: Google đã coi trang mình
// là ứng viên, chỉ còn thiếu vài chỗ; từ khoá chưa có hạng thì là việc của hướng nội dung.
//
// Chép logic từ backend (gsc.controller.ts: strikingDistance, siteUrl, thông điệp lỗi) nhưng
// gọi thẳng REST bằng fetch: plugin chạy trong CMS, không kéo thêm thư viện googleapis
// (hàng chục MB) chỉ để làm HAI lời gọi POST. Chỉ hỗ trợ OAuth refresh token — đó là cách
// backend đang dùng thật; service account của backend là đường lùi cũ.

import { voiHanGio } from "../lib/doc-web.mjs";
import { duongCongCtr, gan } from "./ctr.mjs";

const URL_TOKEN = "https://oauth2.googleapis.com/token";
const URL_API = "https://searchconsole.googleapis.com/webmasters/v3/sites/";
/** Cùng trần hàng của backend (CANNIBAL_ROW_LIMIT) — tối đa một trang kết quả của API. */
const TRAN_HANG = 25000;
/** Trang đầy 25.000 hàng nghĩa là còn nữa → hỏi tiếp startRow, tối đa chừng này trang (100k hàng). */
const TRAN_TRANG_GSC = 4;
/** Hạn chờ mỗi lời gọi Google: không có thì một kết nối treo giữ cả ca radar/leo top. */
const HAN_GIO_MS = 30_000;
/** Lấy token mới sớm 60 s: token hết hạn giữa lúc đang gọi là lỗi 401 khó hiểu. */
const DEM_TOKEN_MS = 60_000;
const BIEN_BAT_BUOC = ["GSC_OAUTH_CLIENT_ID", "GSC_OAUTH_CLIENT_SECRET", "GSC_OAUTH_REFRESH_TOKEN"];
/** Mặc định KHỚP property hiện có (kiểu "Tiền tố URL", nhớ "/" cuối) — như backend. */
const SITE_MAC_DINH = "https://kinhlac.online/";

/** Thân không phải JSON → {} (thông điệp lỗi theo mã HTTP); nhưng QUÁ HẠN thì phải nổi lên nguyên văn. */
const thanHongThanhRong = (e) => {
	if (/quá hạn/.test(e?.message ?? "")) throw e;
	return {};
};

const ngayIso = (ms) => new Date(ms).toISOString().slice(0, 10);

/** URL trang để so khớp: bỏ giao thức, "www.", "/" cuối; host chữ thường. GSC ghi đúng dạng Google thấy. */
export function chuanHoaUrlTrang(u) {
	const s = String(u ?? "").trim();
	try {
		const x = new URL(s);
		return `${x.hostname.toLowerCase().replace(/^www\./, "")}${x.pathname.replace(/\/+$/, "")}${x.search}`;
	} catch {
		return s.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
	}
}

/**
 * @param {{fetch: typeof fetch, env?: Record<string,string|undefined>, now?: () => number, hanGioMs?: number}} p
 */
export function taoGsc({ fetch, env = process.env, now = Date.now, hanGioMs = HAN_GIO_MS }) {
	const bien = (k) => String(env?.[k] ?? "").trim();
	const thieu = () => BIEN_BAT_BUOC.filter((k) => !bien(k));
	const siteUrl = () => bien("GSC_SITE_URL") || SITE_MAC_DINH;
	let token = null; // { giaTri, hetHan }
	let dangLay = null; // lượt lấy token đang bay — lời gọi song song dùng chung, không đổi token hai lần
	/** Hết hạn thì HUỶ luôn fetch bên dưới (không chỉ bỏ chờ): không thì socket còn treo sau khi ca đã báo lỗi. */
	const goi = (url, init, viec) => {
		const ac = typeof AbortController === "function" ? new AbortController() : null;
		const p = Promise.resolve().then(() => fetch(url, ac ? { ...init, signal: ac.signal } : init));
		return voiHanGio(p, hanGioMs, `GSC: ${viec}`).catch((e) => {
			if (/quá hạn/.test(e?.message ?? "")) {
				ac?.abort();
				p.catch(() => {});
			}
			throw e;
		});
	};

	function kiemCauHinh() {
		const t = thieu();
		if (t.length)
			throw new Error(
				`Chưa cấu hình Search Console cho plugin: thiếu biến ${t.join(", ")} trong cms/.env ` +
					"(chép từ backend/.env; cùng tài khoản OAuth). Khai xong phải khởi động lại CMS.",
			);
	}

	function layToken() {
		if (token && now() < token.hetHan) return Promise.resolve(token.giaTri);
		dangLay ??= layTokenMoi().finally(() => {
			dangLay = null;
		});
		return dangLay;
	}

	async function layTokenMoi() {
		const r = await goi(URL_TOKEN, {
			method: "POST",
			headers: { "content-type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				client_id: bien("GSC_OAUTH_CLIENT_ID"),
				client_secret: bien("GSC_OAUTH_CLIENT_SECRET"),
				refresh_token: bien("GSC_OAUTH_REFRESH_TOKEN"),
				grant_type: "refresh_token",
			}).toString(),
		}, "lấy access token");
		const j = await voiHanGio(r.json(), hanGioMs, "GSC: đọc token").catch(thanHongThanhRong);
		if (!r.ok || !j.access_token) {
			const ly = j.error_description || j.error || `HTTP ${r.status}`;
			throw new Error(
				`GSC: không đổi được refresh token lấy access token (${ly}) — GSC_OAUTH_REFRESH_TOKEN sai/hết hạn ` +
					"hoặc không khớp GSC_OAUTH_CLIENT_ID/GSC_OAUTH_CLIENT_SECRET. Chạy lại backend/tmp/gsc-oauth.mjs " +
					'để lấy token mới (app OAuth ở chế độ "Testing" làm token hết hạn sau 7 ngày → hãy Publish app).',
			);
		}
		const song = Math.max(0, Number(j.expires_in || 3600) * 1000 - DEM_TOKEN_MS);
		token = { giaTri: j.access_token, hetHan: now() + song };
		return token.giaTri;
	}

	/** Gọi searchAnalytics.query thô; dịch lỗi của Google sang lời nhắc tiếng Việt chỉ đúng biến. */
	async function truyVan(body) {
		kiemCauHinh();
		const tk = await layToken();
		const site = siteUrl();
		const r = await goi(`${URL_API}${encodeURIComponent(site)}/searchAnalytics/query`, {
			method: "POST",
			headers: { authorization: `Bearer ${tk}`, "content-type": "application/json" },
			body: JSON.stringify(body),
		}, "truy vấn searchAnalytics");
		const j = await voiHanGio(r.json(), hanGioMs, "GSC: đọc kết quả").catch(thanHongThanhRong);
		if (!r.ok) {
			const gMsg = j?.error?.message || `HTTP ${r.status}`;
			let goiY = "";
			if (r.status === 403)
				goiY =
					` — Tài khoản OAuth chưa có quyền trên property "${site}". Kiểm tra GSC_SITE_URL khớp đúng property, ` +
					"và refresh token lấy bằng đúng tài khoản chủ sở hữu (Search Console → Cài đặt → Người dùng và quyền).";
			else if (r.status === 401) {
				token = null; // token bị thu hồi giữa chừng — lần sau lấy lại
				goiY = " — Access token bị từ chối: GSC_OAUTH_REFRESH_TOKEN có thể đã bị thu hồi, lấy token mới.";
			} else if (r.status === 404)
				goiY = ` — Không tìm thấy property "${site}". Kiểm tra GSC_SITE_URL (URL-prefix có "/" cuối, hoặc "sc-domain:…").`;
			throw new Error(`GSC truy vấn lỗi: ${gMsg}${goiY}`);
		}
		return Array.isArray(j.rows) ? j.rows : [];
	}

	/** Như truyVan nhưng lấy hết: trang đầy TRAN_HANG hàng thì hỏi tiếp startRow (tối đa TRAN_TRANG_GSC trang). */
	async function truyVanHet(body) {
		const tatCa = [];
		for (let i = 0; i < TRAN_TRANG_GSC; i++) {
			const rows = await truyVan(i ? { ...body, startRow: i * TRAN_HANG } : body);
			tatCa.push(...rows);
			if (rows.length < TRAN_HANG) break;
		}
		return tatCa;
	}

	const khoang = (ngay) => {
		const n = Math.max(1, Math.floor(Number(ngay) || 28));
		const ket = now();
		return { startDate: ngayIso(ket - n * 86_400_000), endDate: ngayIso(ket) };
	};

	return {
		coCauHinh: () => thieu().length === 0,

		/**
		 * Từ khoá mà trang mình đang đứng hạng [viTriMin, viTriMax], xếp theo điểm cơ hội.
		 * `boQua`: khoá `tuKhoa|trang` đã soi trong 28 ngày (Set hoặc mảng) — soi lại quá sớm
		 * chỉ tốn lượt mà Google chưa kịp phản ánh bản sửa.
		 */
		async layTuKhoaLeoTop({ ngay = 28, viTriMin = 4, viTriMax = 50, hienThiMin = 5, toiDa = 5, boQua = new Set() } = {}) {
			const bo = boQua instanceof Set ? boQua : new Set(Array.isArray(boQua) ? boQua : []);
			const rows = await truyVanHet({ ...khoang(ngay), dimensions: ["query", "page"], rowLimit: TRAN_HANG, dataState: "all" });
			const hang = rows.map((r) => {
				const viTri = Number(r.position) || 0;
				const hienThi = Number(r.impressions) || 0;
				return {
					tuKhoa: r.keys?.[0] ?? "",
					trang: r.keys?.[1] ?? "",
					viTri,
					hienThi,
					nhap: Number(r.clicks) || 0,
					// Như backend: nhiều người tìm + càng gần top → đáng làm TRƯỚC.
					coHoi: Math.round(hienThi * (viTriMax + 1 - viTri)),
				};
			});
			// Đường cong CTR kỳ vọng dựng trên TOÀN BỘ hàng, kể cả hạng 1–3 và hàng bị lọc bỏ
			// bên dưới: càng nhiều mẫu thì kỳ vọng từng bậc càng vững, và chính hạng 1–3 là
			// phần neo đầu đường cong. Lọc trước rồi mới dựng là tự cắt mất mẫu.
			const duongCong = duongCongCtr(hang);
			return gan(hang, duongCong)
				.filter(
					(x) =>
						x.tuKhoa &&
						x.trang &&
						x.viTri >= viTriMin &&
						x.viTri <= viTriMax &&
						x.hienThi >= hienThiMin &&
						!bo.has(`${x.tuKhoa}|${x.trang}`),
				)
				// Xếp theo `uuTien` (cơ hội × trọng số loại việc), không theo `coHoi` trần: ca
				// soi SERP không chữa được lỗi tiêu đề, nên trang "tieu_de" phải nhường chỗ cho
				// trang "noi_dung" dù cơ hội bằng nhau. Hoà thì giữ thứ tự cơ hội như cũ.
				.sort((a, b) => b.uuTien - a.uuTien || b.coHoi - a.coHoi)
				.slice(0, Math.max(1, toiDa));
		},

		/**
		 * HÀNG ĐỢI RẺ: trang người ta THẤY mà không bấm. Không cần ca soi SERP, không tốn lượt
		 * mô hình — người quản trị đọc rồi sửa tiêu đề/mô tả là xong.
		 *
		 * Xếp theo `nhapDangMat` (hiển thị × phần CTR thiếu so với kỳ vọng) chứ không theo CTR
		 * thấp nhất: một từ khoá CTR 0% trên 25 hiển thị không đáng bằng từ khoá mất 300 lượt
		 * nhấp mỗi tháng.
		 */
		async layViecTieuDe({ ngay = 28, viTriMin = 1, viTriMax = 50, toiDa = 20 } = {}) {
			const rows = await truyVanHet({ ...khoang(ngay), dimensions: ["query", "page"], rowLimit: TRAN_HANG, dataState: "all" });
			const hang = rows.map((r) => ({
				tuKhoa: r.keys?.[0] ?? "",
				trang: r.keys?.[1] ?? "",
				viTri: Number(r.position) || 0,
				hienThi: Number(r.impressions) || 0,
				nhap: Number(r.clicks) || 0,
				coHoi: 0,
			}));
			const duongCong = duongCongCtr(hang);
			const ds = gan(hang, duongCong)
				.filter((x) => x.tuKhoa && x.trang && x.loaiViec === "tieu_de" && x.viTri >= viTriMin && x.viTri <= viTriMax)
				.sort((a, b) => b.nhapDangMat - a.nhapDangMat)
				.slice(0, Math.max(1, toiDa));
			return {
				ds,
				soBacDuongCong: duongCong.soBac,
				// Đường cong rỗng nghĩa là KHÔNG kết luận được gì, khác hẳn với "không có việc nào".
				ghiChu: duongCong.soBac
					? `Đường cong CTR dựng từ ${duongCong.soBac} bậc vị trí có đủ mẫu.`
					: "CHƯA dựng được đường cong CTR (không bậc vị trí nào đủ mẫu) — danh sách này rỗng vì thiếu căn cứ, không phải vì không có việc.",
			};
		},

		/**
		 * Số liệu theo TRANG (không theo từ khoá) trong `ngay` ngày — MỘT lời gọi cho cả danh sách
		 * trang mình quan tâm. Dùng cho khối "bài mới đăng": hỏi từng trang một là N lời gọi và
		 * cùng một hạn mức API, trong khi số hàng theo trang của site này chỉ cỡ nghìn.
		 *
		 * `dataState: "all"` cố ý: bỏ nó đi thì 2–3 ngày gần nhất biến mất, mà bài mới đăng thì
		 * ĐÚNG mấy ngày đó mới có số — bài vừa lên trông như "Google chưa thấy".
		 *
		 * @returns {Promise<Map<string, {nhap: number, hienThi: number, viTri: number, ctr: number}>>}
		 *   khoá là `chuanHoaUrlTrang(url)`.
		 */
		async layTheoTrang({ ngay = 28 } = {}) {
			const rows = await truyVanHet({ ...khoang(ngay), dimensions: ["page"], rowLimit: TRAN_HANG, dataState: "all" });
			const m = new Map();
			for (const r of rows) {
				const k = chuanHoaUrlTrang(r.keys?.[0]);
				if (!k) continue;
				m.set(k, {
					nhap: Number(r.clicks) || 0,
					hienThi: Number(r.impressions) || 0,
					viTri: Math.round((Number(r.position) || 0) * 100) / 100,
					ctr: Number(r.ctr) || 0,
				});
			}
			return m;
		},

		/**
		 * SOI MỘT URL bằng URL Inspection API — trả lời câu "Google đã index chưa".
		 *
		 * ⚠️ Đây là thứ phân định được hai trạng thái mà `layTheoTrang` KHÔNG phân biệt nổi:
		 * một trang 0 lượt hiển thị có thể là **chưa được index** (việc kỹ thuật) hoặc **đã index
		 * mà không ai tìm tới** (việc nội dung). Trước đó tab Leo top chỉ dám nói "0 lượt hiển
		 * thị" rồi dừng — đúng nhưng không dùng được.
		 *
		 * ⚠️ HẠN MỨC RIÊNG, KHÁC searchAnalytics: 2.000 lượt/ngày và 600 lượt/phút cho mỗi
		 * property. Nên đây là đường gọi THEO YÊU CẦU, có trần và có đệm — không bao giờ quét cả
		 * site. Gọi lẻ từng URL, API không nhận lô.
		 *
		 * @returns {Promise<{ketLuan, trangThai, robots, lanCrawlCuoi, canonicalGoogle, canonicalMinh}|null>}
		 */
		async soiUrl(url) {
			kiemCauHinh();
			const tk = await layToken();
			const r = await goi(
				"https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
				{
					method: "POST",
					headers: { authorization: `Bearer ${tk}`, "content-type": "application/json" },
					body: JSON.stringify({ inspectionUrl: url, siteUrl: siteUrl(), languageCode: "vi" }),
				},
				"soi URL",
			);
			const j = await voiHanGio(r.json(), hanGioMs, "GSC: đọc kết quả soi URL").catch(thanHongThanhRong);
			if (!r.ok) {
				const m = j?.error?.message || `HTTP ${r.status}`;
				// 403 ở ĐÂY khác 403 của searchAnalytics: URL Inspection đòi property khớp CHÍNH
				// XÁC, và `sc-domain:` không soi được URL của property tiền tố và ngược lại.
				throw new Error(`GSC soi URL lỗi: ${m}${r.status === 403 ? ` — kiểm GSC_SITE_URL ("${siteUrl()}") có đúng property chứa URL này không.` : ""}`);
			}
			const k = j?.inspectionResult?.indexStatusResult;
			if (!k) return null;
			return {
				ketLuan: k.verdict ?? "",
				trangThai: k.coverageState ?? "",
				robots: k.robotsTxtState ?? "",
				lanCrawlCuoi: k.lastCrawlTime ?? null,
				canonicalGoogle: k.googleCanonical ?? "",
				canonicalMinh: k.userCanonical ?? "",
			};
		},

		/**
		 * Hạng trung bình của đúng cặp (từ khoá, trang) trong `ngay` ngày; không có số liệu → null.
		 * Lọc từ khoá ở Google, còn TRANG so ở phía mình sau khi chuẩn hoá: filter "equals" của
		 * GSC so chuỗi y nguyên, nên trang lưu thiếu "/" cuối hay khác http/https là ra null mãi.
		 * Nhiều biến thể cùng khớp thì cộng hiển thị, hạng lấy bình quân theo hiển thị.
		 */
		async layViTri({ tuKhoa, trang, ngay = 14 }) {
			const rows = await truyVan({
				...khoang(ngay),
				dimensions: ["query", "page"],
				dimensionFilterGroups: [{ filters: [{ dimension: "query", operator: "equals", expression: tuKhoa }] }],
				rowLimit: 1000,
				dataState: "all",
			});
			const dich = chuanHoaUrlTrang(trang);
			const khop = rows.filter((r) => chuanHoaUrlTrang(r.keys?.[1]) === dich);
			if (!khop.length) return null;
			const hienThi = khop.reduce((t, r) => t + (Number(r.impressions) || 0), 0);
			const viTri = hienThi
				? khop.reduce((t, r) => t + (Number(r.position) || 0) * (Number(r.impressions) || 0), 0) / hienThi
				: Number(khop[0].position) || 0;
			return { viTri: Math.round(viTri * 100) / 100, hienThi };
		},
	};
}
