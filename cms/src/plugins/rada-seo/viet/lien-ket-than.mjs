// Soát link trong thân bài lò viết trước khi thành nháp.
//
// - Link nội bộ (bắt đầu "/" hoặc gốc site) nằm trong kế hoạch (trụ cột + link đích — đã được
//   kiểm sống lúc duyệt kế hoạch) → giữ, không tải lại.
// - Link nội bộ NGOÀI kế hoạch → hỏi bộ kiểm đường (kiem-duong.mjs) với chữ neo làm tên mong
//   (thử cả bản bỏ tiền tố: "huyệt Bách Hội" → "Bách Hội"). Đạt giữ; trượt GỠ link, giữ chữ.
// - Link ngoài (http khác gốc, mailto, …) → GỠ, giữ chữ: nguồn đi vào trường nguon_tham_khao
//   đã qua xacMinhNguon, không rải trong thân.
// - Neo "#…" → gỡ: trang CMS chưa dựng neo mục.
// Ảnh markdown `![…](…)` không đụng tới (khuôn bài đã chặn riêng); khối ``` giữ nguyên.
import { bienThe } from "../noi-bo/chi-muc.mjs";
import { chuanDuong } from "../luat/loc-nguon-link.mjs";

const LINK = /(?<!!)\[([^\]\n]+)\]\(\s*<?([^)\s>]+)>?(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;
const SO_DICH_TOI_THIEU = 5;

/** Chuỗi đường từ mục kế hoạch dạng chuỗi hoặc {duong}. */
const layDuong = (x) => (typeof x === "string" ? x : x?.duong ? String(x.duong) : "");

/** Đường nội bộ đã chuẩn nếu href là nội bộ; null nếu không. */
function duongNoiBo(href, goc) {
	if (href.startsWith("/") && !href.startsWith("//")) return chuanDuong(href);
	const g = String(goc ?? "").replace(/\/+$/, "");
	if (g && (href === g || href.startsWith(`${g}/`) || href.startsWith(`${g}?`) || href.startsWith(`${g}#`)))
		return chuanDuong(href.slice(g.length) || "/");
	return null;
}

/** Tách md thành đoạn thường / khối code (```/~~~), để chỉ soát đoạn thường. */
function tachKhoiCode(md) {
	const ra = [];
	let dem = "", trongCode = false, rao = "";
	for (const dong of md.split(/(?<=\n)/)) {
		const m = dong.match(/^\s{0,3}(`{3,}|~{3,})/);
		if (!trongCode && m) {
			if (dem) ra.push({ code: false, chu: dem });
			dem = dong;
			trongCode = true;
			rao = m[1][0];
			continue;
		}
		dem += dong;
		if (trongCode && m && m[1][0] === rao) {
			ra.push({ code: true, chu: dem });
			dem = "";
			trongCode = false;
		}
	}
	if (dem) ra.push({ code: trongCode, chu: dem });
	return ra;
}

/**
 * @param {string} md
 * @param {{keHoach: {trangTruCot?: string|{duong}, lienKetDich?: (string|{duong})[]},
 *   kiemDuong: (duong: string, ten?: string) => Promise<boolean>, goc?: string}} tuyChon
 * @returns {Promise<{md: string, soDich: number, coTruCot: boolean, dat: boolean,
 *   goBo: {href: string, neo: string, lyDo: "link_ngoai"|"khong_dat"|"loi_kiem"|"neo_trong_trang"}[]}>}
 */
export async function kiemLienKetThan(md, { keHoach = {}, kiemDuong, goc = "https://kinhlac.online" } = {}) {
	const truCot = layDuong(keHoach?.trangTruCot) ? chuanDuong(layDuong(keHoach.trangTruCot)) : "";
	const dich = new Set((keHoach?.lienKetDich ?? []).map(layDuong).filter(Boolean).map(chuanDuong));
	if (truCot) dich.delete(truCot);
	const trongKeHoach = new Set([...dich, ...(truCot ? [truCot] : [])]);

	const goBo = [];
	const conDich = new Set();
	let coTruCot = false;
	const daKiem = new Map(); // `${duong}\n${neo}` → promise<"dat"|"khong_dat"|"loi_kiem">
	const kiemNeo = (duong, neo) => {
		const k = `${duong}\n${neo}`;
		if (!daKiem.has(k))
			daKiem.set(
				k,
				(async () => {
					try {
						for (const ten of bienThe(neo)) if (await kiemDuong(duong, ten)) return "dat";
						return "khong_dat";
					} catch {
						return "loi_kiem";
					}
				})(),
			);
		return daKiem.get(k);
	};

	const phan = [];
	for (const khoi of tachKhoiCode(String(md ?? ""))) {
		if (khoi.code) {
			phan.push(khoi.chu);
			continue;
		}
		let cuoi = 0;
		for (const m of khoi.chu.matchAll(LINK)) {
			phan.push(khoi.chu.slice(cuoi, m.index));
			cuoi = m.index + m[0].length;
			const [toan, neo, href] = m;
			const go = (lyDo) => {
				goBo.push({ href, neo, lyDo });
				return neo;
			};
			if (href.startsWith("#")) {
				phan.push(go("neo_trong_trang"));
				continue;
			}
			const duong = duongNoiBo(href, goc);
			if (!duong) {
				phan.push(go("link_ngoai"));
				continue;
			}
			if (trongKeHoach.has(duong)) {
				if (duong === truCot) coTruCot = true;
				else conDich.add(duong);
				phan.push(toan);
				continue;
			}
			const kq = await kiemNeo(duong, neo);
			phan.push(kq === "dat" ? toan : go(kq));
		}
		phan.push(khoi.chu.slice(cuoi));
	}
	const soDich = conDich.size;
	return { md: phan.join(""), soDich, coTruCot, dat: soDich >= SO_DICH_TOI_THIEU && coTruCot, goBo };
}
