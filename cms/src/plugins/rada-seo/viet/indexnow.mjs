// IndexNow khi một bài bai_viet được Publish / Unpublish (kế hoạch 3, việc 2).
// Thuần: nhận fetch/kho/kv qua tham số, không import emdash — plugin.mjs chỉ nối.
//
// - Chỉ máy có RADA_SEO_CA_DEM=1 (VPS) mới báo; máy lập trình nối chung kho CMS thì im.
// - Chạy NỀN: hook content:afterPublish bị EmDash bọc hạn 5 s, mà riêng việc chờ trang lên đã
//   có thể mất 9 s. thaIndexNow quyết định đồng bộ rồi thả việc, hook không await.
// - Đăng: chờ trang công khai trả 200 rồi mới báo (bộ đệm trang của CMS có thể còn giữ bản
//   "chưa đăng" vài giây — báo sớm là mời bot tới đọc một trang 404).
// - KIỂM mã trả về: chỉ 200/202 là được nhận. Bản ở backend (seo.controller.ts indexNowPing)
//   không kiểm nên 403 "sai khoá" vẫn được đếm là đã báo.
// - Không bao giờ in khoá ra nhật ký.
import { ghiCa } from "../kho.mjs";
import { taoDocTrang, voiHanGio } from "../lib/doc-web.mjs";

const BO = "bai_viet";
const KHOA_MAC_DINH = "3ca42ea20a96a20d494868c1877e263c";
const GOC_MAC_DINH = "https://kinhlac.online";
export const DIEM_BAO = "https://api.indexnow.org/indexnow";
/** Chờ trang lên: 4 lần thử, cách nhau 3 s. */
export const SO_LAN_THU = 4;
export const CACH_LAN_THU_MS = 3000;
/** Cùng một slug (cùng kiểu đăng/gỡ) không báo quá một lần trong 10 phút. */
export const CHONG_LAP_MS = 10 * 60 * 1000;
const HAN_TAI_TRANG_MS = 10_000;
const HAN_GOI_MS = 15_000;
const TRAN_THAN_LOI = 200;

const choThat = (ms) => new Promise((r) => setTimeout(r, ms));

/** @returns {{bat: boolean, key: string, goc: string, host: string, keyLocation: string}} */
export function cauHinh(env = process.env) {
	const key = String(env?.INDEXNOW_KEY ?? "").trim() || KHOA_MAC_DINH;
	let u;
	try {
		u = new URL(String(env?.EMDASH_SITE_URL ?? GOC_MAC_DINH));
		if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("giao thức lạ");
	} catch {
		u = new URL(GOC_MAC_DINH);
	}
	return { bat: env?.RADA_SEO_CA_DEM === "1", key, goc: u.origin, host: u.host, keyLocation: `${u.origin}/${key}.txt` };
}

/** Hai URL báo cho mỗi bài: trang bài (CÓ dấu / cuối, đúng canonical) và trang danh sách. */
export const urlBao = (goc, slug) => [`${goc}/blog/${encodeURIComponent(slug)}/`, `${goc}/blog/`];

const khoaKv = (kieu, slug) => `indexnow:${kieu}:${slug}`;

/** Chờ trang bài trả 200. @returns {Promise<string|null>} null = đã lên; chuỗi = lý do không báo. */
async function choTrangLen(docTrang, url, nghi) {
	let cuoi = "";
	for (let i = 0; i < SO_LAN_THU; i++) {
		if (i > 0) await nghi(CACH_LAN_THU_MS);
		const r = await docTrang(url);
		if (r?.status === 200) {
			if (/noindex/i.test(String(r.xRobots ?? ""))) return "trang mang x-robots-tag noindex — không báo";
			return null;
		}
		cuoi = r?.loi ? String(r.loi) : `HTTP ${r?.status ?? "?"}`;
	}
	return `trang bài chưa lên 200 sau ${SO_LAN_THU} lần thử (lần cuối: ${cuoi}) — không báo`;
}

/** POST tới IndexNow, KIỂM mã. Không ném. @returns {Promise<{ok: boolean, ma: number|null, loi?: string}>} */
export async function guiIndexNow(fetchFn, ch, urlList) {
	try {
		const viec = (async () => {
			const res = await fetchFn(DIEM_BAO, {
				method: "POST",
				headers: { "Content-Type": "application/json; charset=utf-8" },
				body: JSON.stringify({ host: ch.host, key: ch.key, keyLocation: ch.keyLocation, urlList }),
			});
			const ma = Number(res?.status);
			if (ma === 200 || ma === 202) return { ok: true, ma };
			let than = "";
			try {
				than = String(await res.text()).slice(0, TRAN_THAN_LOI);
			} catch {
				// thân không đọc được: mã là đủ
			}
			return { ok: false, ma, loi: than ? `HTTP ${ma}: ${than}` : `HTTP ${ma}` };
		})();
		viec.catch(() => {});
		return await voiHanGio(viec, HAN_GOI_MS, "gọi IndexNow");
	} catch (e) {
		return { ok: false, ma: null, loi: `không gọi được IndexNow: ${String(e?.message ?? e).slice(0, TRAN_THAN_LOI)}` };
	}
}

/**
 * Báo IndexNow cho một bài và GHI kết quả: `nhap.indexNow = {luc, ok, ma, loi?}` nếu bài có bản
 * ghi nháp (bài máy viết), và luôn một dòng nhật ký `ca` kiểu "indexnow". KHÔNG BAO GIỜ ném.
 * @param {{id?: string, slug: string, kieu: "dang"|"go"}} viec
 * @param {{s: object, kv: object, log?: object, fetch: Function, env?: object, nghi?: Function, now?: () => number}} phuThuoc
 * @returns {Promise<{ok: boolean, ma: number|null, loi?: string} | {boQua: string}>}
 */
export async function baoIndexNow({ id, slug, kieu }, { s, kv, log, fetch: fetchFn, env = process.env, nghi = choThat, now = Date.now }) {
	const ghiLog = (muc, ...a) => {
		try {
			log?.[muc]?.(...a);
		} catch {
			// log hỏng không được làm hỏng việc nền
		}
	};
	try {
		const ch = cauHinh(env);
		const batDauMs = now();
		const khoa = khoaKv(kieu, slug);
		const cu = await kv.get(khoa);
		if (cu && typeof cu.luc === "number" && batDauMs - cu.luc < CHONG_LAP_MS) return { boQua: "vua_bao" };
		// Đặt mốc TRƯỚC khi làm: hai lần Publish sát nhau không cùng lọt qua trong lúc chờ trang lên.
		await kv.set(khoa, { luc: batDauMs });
		const urls = urlBao(ch.goc, slug);
		let kq = null;
		if (kieu === "dang") {
			const chua = await choTrangLen(taoDocTrang(fetchFn, { hanGioMs: HAN_TAI_TRANG_MS, traLyDo: true }), urls[0], nghi);
			if (chua) kq = { ok: false, ma: null, loi: chua };
		}
		// Gỡ bài: không chờ gì — trang đã (hoặc sắp) 404, báo để máy tìm kiếm tới đọc lại.
		kq ??= await guiIndexNow(fetchFn, ch, urls);
		if (!kq.ok) {
			// Chưa báo được thì gỡ mốc: sửa xong đăng lại trong 10 phút vẫn được thử.
			try {
				await kv.delete(khoa);
			} catch (e) {
				ghiLog("warn", "Rada SEO: không gỡ được mốc chống lặp IndexNow", e);
			}
			ghiLog("warn", `Rada SEO: IndexNow không báo được cho /blog/${slug}/ — ${kq.loi}`);
		}
		const luc = new Date(now()).toISOString();
		try {
			await ghiCa(s, {
				loai: "indexnow", kieu, slug, batDau: new Date(batDauMs).toISOString(), ketThuc: luc, ghi: true,
				ok: kq.ok, ma: kq.ma,
				loi: kq.ok ? [] : [`/blog/${slug}/: ${kq.loi}`],
				thongTin: kq.ok ? [`IndexNow nhận (HTTP ${kq.ma}): /blog/${slug}/ và /blog/`] : [],
			});
			const nhap = id ? await s.nhap.get(String(id)) : null;
			if (nhap) await s.nhap.put(String(id), { ...nhap, indexNow: { luc, ok: kq.ok, ma: kq.ma, ...(kq.ok ? {} : { loi: kq.loi }) } });
		} catch (e) {
			ghiLog("error", "Rada SEO: không ghi được kết quả IndexNow", e);
		}
		return kq;
	} catch (e) {
		ghiLog("error", "Rada SEO: việc báo IndexNow hỏng", e);
		return { ok: false, ma: null, loi: String(e?.message ?? e).slice(0, TRAN_THAN_LOI) };
	}
}

/**
 * Gọi từ hook content:afterPublish ("dang") / content:afterUnpublish ("go"). Quyết định ĐỒNG BỘ,
 * rồi THẢ việc chạy nền và trả promise của nó (hook KHÔNG await; phép kiểm thì await).
 * Không ném. Trả null khi không có gì để làm.
 * @param {{env?: object, nghi?: Function, now?: () => number}} [tuyChon]  chỉ cho phép kiểm
 */
export function thaIndexNow(event, ctx, kieu, { env = process.env, nghi, now } = {}) {
	try {
		if (!cauHinh(env).bat) return null;
		if (event?.collection !== BO || !ctx) return null;
		const c = event.content ?? {};
		const slug = typeof c.slug === "string" ? c.slug.trim() : "";
		if (!slug) return null;
		// Bài người biên tập đã đặt noindex thì không mời bot tới.
		if (c.seo?.noIndex === true) return null;
		return baoIndexNow(
			{ id: c.id, slug, kieu },
			{ s: ctx.storage, kv: ctx.kv, log: ctx.log, fetch: (...a) => ctx.http.fetch(...a), env, ...(nghi ? { nghi } : {}), ...(now ? { now } : {}) },
		);
	} catch (e) {
		try {
			ctx?.log?.error?.("Rada SEO: không thả được việc báo IndexNow", e);
		} catch {
			// bỏ qua
		}
		return null;
	}
}

/** Chữ cho tab Nháp: "IndexNow: đã báo HH:mm DD/MM" (giờ Việt Nam) hoặc "IndexNow: lỗi <lý do>". */
export function chuIndexNow(x) {
	if (!x || typeof x !== "object") return "";
	if (!x.ok) return `IndexNow: lỗi ${x.loi ? String(x.loi) : "không rõ"}`;
	const t = Date.parse(x.luc ?? "");
	if (!Number.isFinite(t)) return "IndexNow: đã báo";
	// Giờ VN = UTC+7 cố định (không đổi giờ mùa) — khỏi phụ thuộc ICU của Node trong container.
	const d = new Date(t + 7 * 3600 * 1000);
	const hai = (n) => String(n).padStart(2, "0");
	return `IndexNow: đã báo ${hai(d.getUTCHours())}:${hai(d.getUTCMinutes())} ${hai(d.getUTCDate())}/${hai(d.getUTCMonth() + 1)}`;
}
