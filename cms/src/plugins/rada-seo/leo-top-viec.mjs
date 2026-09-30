// Bốn việc Claude làm qua MCP cho "leo top" (2D): lấy từ khoá từ GSC → nộp danh sách URL top
// (Claude tìm web; máy chủ KHÔNG cào Google) → lấy chữ từng trang đã tải → ghi báo cáo ý của
// từng trang để máy chủ dựng bản đồ sơ hở + phiếu. Thuần: nhận `s` (storage), `gsc`, `docTrang`.
import * as kho from "./kho.mjs";
import { urlDocDuoc } from "./lib/doc-web.mjs";
import { doTrang } from "./leo-top/do-trang.mjs";
import { LOI_NHAC_LEO_TOP, LOI_NHAC_SO_HO } from "./loi-dan.mjs";

/** Phiên mới mỗi lượt gọi: mỗi phiên kéo theo ~11 trang Claude phải đọc — trần giữ hạn mức gói. */
export const TRAN_PHIEN_MOI = 5;
/** Trần trang tải mỗi phiên (10 URL Claude gửi + trang mình, dư một). */
export const TRAN_TRANG_SERP = 12;
/** Tải đồng thời: CMS còn phục vụ người thật; lời gọi MCP có hạn chờ nên cũng không tải tuần tự. */
export const DONG_THOI_TAI = 3;
/** Một tên miền chiếm cả top (diễn đàn, báo lớn) thì bản đồ thành bản đồ của MỘT site. */
export const TRAN_MOI_TEN_MIEN = 2;
export const TRAN_CHU_TRANG = 6000;
/** Hạn tải mỗi trang RIÊNG cho đường này (mặc định 30 s của doc-web giữ cho radar). */
export const HAN_TAI_MS = 10_000;

const tomTatPhien = (p) => ({
	id: p.id, tuKhoa: p.tuKhoa, trangMinh: p.trangMinh, viTriBanDau: p.viTriBanDau, hienThi: p.hienThi, trangThai: p.trangThai,
});

async function phienDangMo(s) {
	const ra = [];
	for (const t of ["cho_serp", "cho_doc"]) ra.push(...(await kho.dsLeoTop(s, { trangThai: t })));
	return ra.map(tomTatPhien);
}

/**
 * Tạo tối đa TRAN_PHIEN_MOI phiên mới từ GSC (bỏ cặp đã soi trong 28 ngày) + trả phiên đang mở.
 * GSC chưa cấu hình / lỗi → trường `loi` tiếng Việt, KHÔNG ném: phiên đang mở vẫn làm tiếp được.
 */
export async function layTuKhoaLeoTop({ s, gsc, nowMs = Date.now() }) {
	const ra = { moi: [], dangMo: [], huongDan: LOI_NHAC_LEO_TOP };
	try {
		const boQua = await kho.tuKhoaDaSoi(s, nowMs);
		const ds = await gsc.layTuKhoaLeoTop({ toiDa: TRAN_PHIEN_MOI, boQua });
		const now = new Date(nowMs).toISOString();
		for (const x of ds.slice(0, TRAN_PHIEN_MOI))
			ra.moi.push(tomTatPhien(await kho.taoPhienLeoTop(s, { tuKhoa: x.tuKhoa, trang: x.trang, viTri: x.viTri, hienThi: x.hienThi }, now)));
	} catch (e) {
		ra.loi = String(e?.message ?? e).slice(0, 600);
	}
	ra.dangMo = await phienDangMo(s);
	return ra;
}

const tenMien = (u) => new URL(u).hostname.toLowerCase().replace(/^www\./, "");

/** Chạy `viec` trên từng phần tử, tối đa `n` việc cùng lúc; giữ thứ tự kết quả. */
async function chayDongThoi(ds, n, viec) {
	const ra = new Array(ds.length);
	let i = 0;
	const tho = async () => {
		while (i < ds.length) {
			const k = i++;
			ra[k] = await viec(ds[k]);
		}
	};
	await Promise.all(Array.from({ length: Math.min(n, ds.length) }, tho));
	return ra;
}

/**
 * Nhận danh sách URL top Claude tìm được, lọc (chống SSRF, trùng, ≤ 2/tên miền), thêm trang
 * mình nếu thiếu, tải + đo từng trang, lưu → cho_doc. `thuTu` là hạng trong danh sách GỬI LÊN
 * (URL bị loại vẫn giữ chỗ), trang mình thêm vào thì thuTu null.
 */
export async function nopSerp({ s, docTrang, id, urls }) {
	const d = await s.leo_top.get(id);
	if (!d) throw new Error("Không có phiên leo top này");
	if (!["cho_serp", "cho_doc"].includes(d.trangThai))
		throw new Error(`Phiên đang ở trạng thái "${d.trangThai}" — nộp SERP chỉ làm được khi "cho_serp" hoặc "cho_doc"`);
	const khoaMinh = kho.khoaUrl(d.trangMinh);
	const chon = [], boQua = [], daCo = new Set(), demMien = new Map();
	urls.forEach((u, i) => {
		const url = String(u ?? "").trim();
		if (!urlDocDuoc(url)) return boQua.push({ url, lyDo: "URL không đọc được (chỉ http/https tới tên miền công khai)" });
		const k = kho.khoaUrl(url);
		if (daCo.has(k)) return boQua.push({ url, lyDo: "trùng URL đã có" });
		const laMinh = k === khoaMinh;
		const m = tenMien(url);
		if (!laMinh && (demMien.get(m) ?? 0) >= TRAN_MOI_TEN_MIEN)
			return boQua.push({ url, lyDo: `quá ${TRAN_MOI_TEN_MIEN} trang cùng tên miền ${m}` });
		daCo.add(k);
		if (!laMinh) demMien.set(m, (demMien.get(m) ?? 0) + 1);
		chon.push({ url, thuTu: i + 1, laMinh });
	});
	if (!chon.some((t) => t.laMinh)) chon.push({ url: d.trangMinh, thuTu: null, laMinh: true });
	// Trần trang: trang mình luôn giữ, cắt bớt trang đối thủ cuối danh sách.
	const giu = new Set(chon.filter((t) => !t.laMinh).slice(0, TRAN_TRANG_SERP - 1));
	const tai = chon.filter((t) => t.laMinh || giu.has(t));
	for (const t of chon) if (!tai.includes(t)) boQua.push({ url: t.url, lyDo: `quá trần ${TRAN_TRANG_SERP} trang mỗi phiên` });

	const serp = await chayDongThoi(tai, DONG_THOI_TAI, async (t) => {
		const r = await docTrang(t.url);
		if (!r) return { ...t, trangThai: "loi", loi: `không tải được (quá hạn ${HAN_TAI_MS / 1000} s, bị chặn hoặc lỗi mạng)` };
		if (r.status < 200 || r.status >= 300 || !r.html) return { ...t, trangThai: "loi", loi: `HTTP ${r.status}${r.html ? "" : ", trang rỗng"}` };
		const { chu, ...soDo } = doTrang(r.html, { tuKhoa: d.tuKhoa, url: t.url });
		return { ...t, trangThai: "ok", soDo: r.catBot ? { ...soDo, catBot: true } : soDo, chu: String(chu ?? "").slice(0, TRAN_CHU_TRANG) };
	});
	await kho.ghiSerp(s, id, serp);
	return {
		phienId: id,
		trangThai: "cho_doc",
		soTrangDo: serp.filter((t) => t.trangThai === "ok").length,
		trang: serp.map(({ url, thuTu, laMinh, trangThai, loi }) => (loi ? { url, thuTu, laMinh, trangThai, loi } : { url, thuTu, laMinh, trangThai })),
		boQua,
	};
}

/** Bọc chữ trang trong dấu mốc; "<<<"/">>>" trong chữ bị đổi để trang không tự đóng vùng dữ liệu (như mcp-viec.mjs). */
const boc = (id, chu) =>
	`<<<TRANG_SERP id=${id}>>>\n${String(chu ?? "").replace(/<{3,}/g, "‹‹‹").replace(/>{3,}/g, "›››")}\n<<<HET_TRANG_SERP id=${id}>>>`;

/** Chữ các trang đo được của một phiên cho_doc, kèm lời dặn đọc. */
export async function layTrangSerp({ s, id }) {
	const d = await s.leo_top.get(id);
	if (!d) throw new Error("Không có phiên leo top này");
	if (d.trangThai !== "cho_doc") throw new Error(`Phiên đang ở trạng thái "${d.trangThai}" — lấy chữ trang chỉ làm được khi "cho_doc"`);
	const trang = [];
	d.serp.forEach((t, i) => {
		if (t.trangThai === "ok") trang.push({ url: t.url, thuTu: t.thuTu, laMinh: !!t.laMinh, chu: boc(i + 1, t.chu) });
	});
	return { phienId: id, tuKhoa: d.tuKhoa, trangMinh: d.trangMinh, trang, huongDan: LOI_NHAC_SO_HO };
}

/** Ghi báo cáo ý của từng trang → máy chủ dựng bản đồ + phiếu (kho.ghiSoHo) → tóm tắt cho Claude. */
export async function ghiSoHo({ s, id, trang, chiMuc, nowMs = Date.now() }) {
	const d = await s.leo_top.get(id);
	const kq = await kho.ghiSoHo(s, id, trang, { chiMuc, nowMs });
	return {
		phienId: id,
		tuKhoa: d?.tuKhoa,
		trangThai: "co_phieu",
		soTrangDoiThu: kq.soTrangDoiThu,
		yCotLoi: kq.banDo.yCotLoi.map((y) => `${y.ten} (${Math.round(y.tiLe * 100)}%)`),
		dauHieuThang: kq.banDo.dauHieuThang,
		phieu: kq.phieu,
		boQua: kq.boQua,
		thieuBaoCao: kq.thieuBaoCao,
	};
}
