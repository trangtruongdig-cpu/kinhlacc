// Soát link trong thân bài lò viết trước khi thành nháp — chạy trên PORTABLE TEXT, sau bộ chuyển
// `markdownToPortableText` của EmDash (rà soát 2C-3 H1). Bản cũ tách link trên markdown bằng
// regex riêng; bộ chuyển tách bằng regex KHÁC (`\[(.+?)\]\((.+?)\)`), nên `[a]b](//evil.com)`
// lọt khỏi bộ soát mà vẫn thành link sống trong nháp. Nay thứ được soát chính là thứ được lưu.
//
// - Link nội bộ ("/…" không phải "//", hoặc cùng gốc site) nằm trong kế hoạch (trụ cột + link
//   đích — đã được kiểm sống lúc duyệt kế hoạch) → giữ, không tải lại. href đổi về đường chuẩn.
// - Link nội bộ NGOÀI kế hoạch → hỏi bộ kiểm đường (kiem-duong.mjs) với chữ neo làm tên mong
//   (thử cả bản bỏ tiền tố: "huyệt Bách Hội" → "Bách Hội"). Đạt giữ; trượt GỠ link, giữ chữ.
//   Tối đa TOI_DA_KIEM đường mới mỗi lượt và HAN_TONG_MS cho cả lượt: md 40.000 ký tự có thể
//   mang hàng trăm đường, mỗi đường chờ tới 10 s — lượt MCP treo thì client thử lại.
// - Link ngoài (http khác gốc, mailto) → GỠ, giữ chữ: nguồn đi vào trường nguon_tham_khao đã qua
//   xacMinhNguon, không rải trong thân.
// - href NGUY HIỂM (javascript:/data:/scheme lạ, "//…", có "\", có khoảng trắng hay ký tự điều
//   khiển) → gỡ VÀ báo trong `nguyHiem` để nopBai từ chối cả bài.
// - Neo "#…" → gỡ: trang CMS chưa dựng neo mục.
import { bienThe } from "../noi-bo/chi-muc.mjs";
import { chuanDuong } from "../luat/loc-nguon-link.mjs";
import { voiHanGio } from "../lib/doc-web.mjs";

const SO_DICH_TOI_THIEU = 5;
export const TOI_DA_KIEM = 20;
export const HAN_TONG_MS = 30_000;

/** Chuỗi đường từ mục kế hoạch dạng chuỗi hoặc {duong}. */
const layDuong = (x) => (typeof x === "string" ? x : x?.duong ? String(x.duong) : "");

/** href không được phép tồn tại dưới bất kỳ dạng nào (kể cả để gỡ lặng lẽ). */
export function hrefNguyHiem(href) {
	const h = String(href ?? "");
	// Khoảng trắng / ký tự điều khiển: "java script:" hay "java\tscript:" bị trình duyệt gộp lại.
	if (/[\s\u0000-\u001f\u007f\\]/u.test(h)) return true;
	if (h.startsWith("//")) return true;
	const scheme = h.match(/^([a-z][a-z0-9+.-]*):/i);
	return !!scheme && !["http", "https", "mailto"].includes(scheme[1].toLowerCase());
}

/** Đường nội bộ đã chuẩn nếu href là nội bộ; null nếu không. */
function duongNoiBo(href, goc) {
	if (href.startsWith("/") && !href.startsWith("//")) return chuanDuong(href);
	const g = String(goc ?? "").replace(/\/+$/, "");
	if (g && (href === g || href.startsWith(`${g}/`) || href.startsWith(`${g}?`) || href.startsWith(`${g}#`)))
		return chuanDuong(href.slice(g.length) || "/");
	return null;
}

const HET_GIO = Symbol("het_gio");

/**
 * @param {object[]} pt  Portable Text từ bộ chuyển (không bị sửa)
 * @param {{keHoach: {trangTruCot?: string|{duong}, lienKetDich?: (string|{duong})[]},
 *   kiemDuong: (duong: string, ten?: string) => Promise<boolean>, goc?: string,
 *   toiDaKiem?: number, hanTongMs?: number, now?: () => number}} tuyChon
 * @returns {Promise<{pt: object[], soDich: number, coTruCot: boolean, dat: boolean,
 *   goBo: {href: string, neo: string, lyDo: "link_ngoai"|"khong_dat"|"loi_kiem"|"neo_trong_trang"|"vuot_tran"|"het_gio"}[],
 *   nguyHiem: {href: string, neo: string}[]}>}
 */
export async function kiemLienKetThan(
	pt,
	{ keHoach = {}, kiemDuong, goc = "https://kinhlac.online", toiDaKiem = TOI_DA_KIEM, hanTongMs = HAN_TONG_MS, now = Date.now } = {},
) {
	const truCot = layDuong(keHoach?.trangTruCot) ? chuanDuong(layDuong(keHoach.trangTruCot)) : "";
	const dich = new Set((keHoach?.lienKetDich ?? []).map(layDuong).filter(Boolean).map(chuanDuong));
	if (truCot) dich.delete(truCot);
	const trongKeHoach = new Set([...dich, ...(truCot ? [truCot] : [])]);

	const goBo = [], nguyHiem = [];
	const conDich = new Set();
	let coTruCot = false;
	const batDau = now();
	const daKiem = new Map(); // `${duong}\n${neo}` → promise<"dat"|"khong_dat"|"loi_kiem"|"het_gio">
	const kiemNeo = (duong, neo) => {
		const k = `${duong}\n${neo}`;
		if (daKiem.has(k)) return daKiem.get(k);
		if (daKiem.size >= toiDaKiem) return "vuot_tran";
		const conLai = hanTongMs - (now() - batDau);
		if (conLai <= 0) return "het_gio";
		const viec = (async () => {
			for (const ten of bienThe(neo)) if (await kiemDuong(duong, ten)) return "dat";
			return "khong_dat";
		})();
		const p = voiHanGio(viec, Math.max(1, conLai), "kiểm link").catch((e) => (/quá hạn/.test(String(e?.message)) ? "het_gio" : "loi_kiem"));
		viec.catch(() => {});
		daKiem.set(k, p);
		return p;
	};

	const ra = [];
	for (const khoi of Array.isArray(pt) ? pt : []) {
		if (!khoi || typeof khoi !== "object" || !Array.isArray(khoi.markDefs) || !khoi.markDefs.length) {
			ra.push(khoi);
			continue;
		}
		const children = Array.isArray(khoi.children) ? khoi.children : [];
		const neoCua = (key) => children.filter((c) => Array.isArray(c?.marks) && c.marks.includes(key)).map((c) => String(c.text ?? "")).join("");
		const giuDefs = [];
		const boKhoa = new Set();
		for (const def of khoi.markDefs) {
			if (def?._type !== "link") {
				giuDefs.push(def);
				continue;
			}
			const href = String(def.href ?? "");
			const neo = neoCua(def._key);
			const go = (lyDo) => {
				goBo.push({ href, neo, lyDo });
				boKhoa.add(def._key);
			};
			if (hrefNguyHiem(href)) {
				nguyHiem.push({ href, neo });
				boKhoa.add(def._key);
				continue;
			}
			if (href.startsWith("#")) {
				go("neo_trong_trang");
				continue;
			}
			const duong = duongNoiBo(href, goc);
			if (!duong) {
				go("link_ngoai");
				continue;
			}
			if (trongKeHoach.has(duong)) {
				if (duong === truCot) coTruCot = true;
				else conDich.add(duong);
				giuDefs.push({ ...def, href: duong });
				continue;
			}
			const kq = await kiemNeo(duong, neo);
			if (kq === "dat") giuDefs.push({ ...def, href: duong });
			else go(kq);
		}
		ra.push({
			...khoi,
			markDefs: giuDefs,
			children: children.map((c) => (Array.isArray(c?.marks) && c.marks.some((m) => boKhoa.has(m)) ? { ...c, marks: c.marks.filter((m) => !boKhoa.has(m)) } : c)),
		});
	}
	const soDich = conDich.size;
	return { pt: ra, soDich, coTruCot, dat: soDich >= SO_DICH_TOI_THIEU && coTruCot, goBo, nguyHiem };
}
