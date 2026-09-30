// Google Search Console trong plugin — nguồn từ khoá "leo top": từ khoá mà trang của mình
// ĐÃ đứng hạng 4–50. Chỉ những từ khoá này mới đáng soi đối thủ: Google đã coi trang mình
// là ứng viên, chỉ còn thiếu vài chỗ; từ khoá chưa có hạng thì là việc của hướng nội dung.
//
// Chép logic từ backend (gsc.controller.ts: strikingDistance, siteUrl, thông điệp lỗi) nhưng
// gọi thẳng REST bằng fetch: plugin chạy trong CMS, không kéo thêm thư viện googleapis
// (hàng chục MB) chỉ để làm HAI lời gọi POST. Chỉ hỗ trợ OAuth refresh token — đó là cách
// backend đang dùng thật; service account của backend là đường lùi cũ.

const URL_TOKEN = "https://oauth2.googleapis.com/token";
const URL_API = "https://searchconsole.googleapis.com/webmasters/v3/sites/";
/** Cùng trần hàng của backend (CANNIBAL_ROW_LIMIT) — tối đa một trang kết quả của API. */
const TRAN_HANG = 25000;
/** Lấy token mới sớm 60 s: token hết hạn giữa lúc đang gọi là lỗi 401 khó hiểu. */
const DEM_TOKEN_MS = 60_000;
const BIEN_BAT_BUOC = ["GSC_OAUTH_CLIENT_ID", "GSC_OAUTH_CLIENT_SECRET", "GSC_OAUTH_REFRESH_TOKEN"];
/** Mặc định KHỚP property hiện có (kiểu "Tiền tố URL", nhớ "/" cuối) — như backend. */
const SITE_MAC_DINH = "https://kinhlac.online/";

const ngayIso = (ms) => new Date(ms).toISOString().slice(0, 10);

/**
 * @param {{fetch: typeof fetch, env?: Record<string,string|undefined>, now?: () => number}} p
 */
export function taoGsc({ fetch, env = process.env, now = Date.now }) {
	const bien = (k) => String(env?.[k] ?? "").trim();
	const thieu = () => BIEN_BAT_BUOC.filter((k) => !bien(k));
	const siteUrl = () => bien("GSC_SITE_URL") || SITE_MAC_DINH;
	let token = null; // { giaTri, hetHan }

	function kiemCauHinh() {
		const t = thieu();
		if (t.length)
			throw new Error(
				`Chưa cấu hình Search Console cho plugin: thiếu biến ${t.join(", ")} trong cms/.env ` +
					"(chép từ backend/.env; cùng tài khoản OAuth). Khai xong phải khởi động lại CMS.",
			);
	}

	async function layToken() {
		if (token && now() < token.hetHan) return token.giaTri;
		const r = await fetch(URL_TOKEN, {
			method: "POST",
			headers: { "content-type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				client_id: bien("GSC_OAUTH_CLIENT_ID"),
				client_secret: bien("GSC_OAUTH_CLIENT_SECRET"),
				refresh_token: bien("GSC_OAUTH_REFRESH_TOKEN"),
				grant_type: "refresh_token",
			}).toString(),
		});
		const j = await r.json().catch(() => ({}));
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
		const r = await fetch(`${URL_API}${encodeURIComponent(site)}/searchAnalytics/query`, {
			method: "POST",
			headers: { authorization: `Bearer ${tk}`, "content-type": "application/json" },
			body: JSON.stringify(body),
		});
		const j = await r.json().catch(() => ({}));
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

	const khoang = (ngay) => {
		const n = Math.max(1, Math.floor(Number(ngay) || 28));
		const ket = now();
		return { startDate: ngayIso(ket - n * 86_400_000), endDate: ngayIso(ket) };
	};

	return {
		coCauHinh: () => thieu().length === 0,

		/**
		 * Từ khoá mà trang mình đang đứng hạng [viTriMin, viTriMax], xếp theo điểm cơ hội.
		 * `boQua`: khoá `tuKhoa|trang` đã soi trong 28 ngày — soi lại quá sớm chỉ tốn lượt
		 * mà Google chưa kịp phản ánh bản sửa.
		 */
		async layTuKhoaLeoTop({ ngay = 28, viTriMin = 4, viTriMax = 50, hienThiMin = 5, toiDa = 5, boQua = new Set() } = {}) {
			const rows = await truyVan({ ...khoang(ngay), dimensions: ["query", "page"], rowLimit: TRAN_HANG, dataState: "all" });
			return rows
				.map((r) => {
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
				})
				.filter(
					(x) =>
						x.tuKhoa &&
						x.trang &&
						x.viTri >= viTriMin &&
						x.viTri <= viTriMax &&
						x.hienThi >= hienThiMin &&
						!boQua.has(`${x.tuKhoa}|${x.trang}`),
				)
				.sort((a, b) => b.coHoi - a.coHoi)
				.slice(0, Math.max(1, toiDa));
		},

		/** Hạng trung bình của đúng cặp (từ khoá, trang) trong `ngay` ngày; không có số liệu → null. */
		async layViTri({ tuKhoa, trang, ngay = 14 }) {
			const rows = await truyVan({
				...khoang(ngay),
				dimensions: ["query", "page"],
				dimensionFilterGroups: [
					{
						filters: [
							{ dimension: "query", operator: "equals", expression: tuKhoa },
							{ dimension: "page", operator: "equals", expression: trang },
						],
					},
				],
				rowLimit: 10,
				dataState: "all",
			});
			const r = rows[0];
			if (!r) return null;
			return { viTri: Number(r.position) || 0, hienThi: Number(r.impressions) || 0 };
		},
	};
}
