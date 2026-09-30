// Dữ liệu của Rada SEO trong storage của plugin (bảng theo namespace plugin, ở kho CMS).
// Mọi hàm nhận `s` = ctx.storage để thử được bằng kho giả.
import { createHash } from "node:crypto";
import { timTrung } from "./luat/trung-lap.mjs";

export const KHAI_BAO_KHO = {
	doi_thu: { indexes: ["tenMien"] },
	url: { indexes: ["doiThuId", "trangThai", ["doiThuId", "trangThai"]] },
	cum: { indexes: ["trangThai", "diem"] },
	ca: { indexes: ["batDau"] },
};

export const TRANG_THAI_CUM = ["cho_viet", "co_nhap", "da_dang", "bo_qua", "phu_boi_tu_dien"];

/**
 * Nghỉ giữa hai lô ghi. CMS chỉ có MỘT kết nối trong pool (astro.config: max 1, chờ tối đa
 * 10 s). putMany của EmDash chạy một INSERT mỗi dòng trong MỘT giao dịch; ở RTT ~88 ms tới
 * Aiven, 300 dòng giữ kết nối đó ~26 s → blog và khu quản trị hết hạn chờ. Chia lô 20 dòng
 * (~1,8 s) và nghỉ giữa các lô để request của người thật chen vào được.
 */
export const NGHI_GIUA_LO_MS = 150;
const choThat = (ms) => new Promise((r) => setTimeout(r, ms));

/** putMany theo lô `co` mục, nghỉ NGHI_GIUA_LO_MS giữa hai lô (không nghỉ sau lô cuối). */
export async function ghiTheoLo(col, items, { nghi = choThat, co = 20 } = {}) {
	for (let i = 0; i < items.length; i += co) {
		if (i > 0) await nghi(NGHI_GIUA_LO_MS);
		await col.putMany(items.slice(i, i + co));
	}
}

const bam = (s) => createHash("sha1").update(s).digest("hex").slice(0, 24);
export const idUrl = (url) => bam(url);

/** Đọc hết các trang của một truy vấn. */
export async function tatCa(col, opts = {}) {
	const ra = [];
	let cursor;
	do {
		const r = await col.query({ ...opts, limit: 100, cursor });
		ra.push(...r.items);
		cursor = r.hasMore ? r.cursor : undefined;
	} while (cursor);
	return ra;
}

export async function dsDoiThu(s) {
	return (await tatCa(s.doi_thu)).map((r) => ({ id: r.id, ...r.data }));
}

/** Khoá tự nhiên là tên miền → thêm lại cùng tên miền chỉ cập nhật. */
export async function luuDoiThu(s, { tenMien, ten, laCuaMinh }, now) {
	const cu = await s.doi_thu.get(tenMien);
	await s.doi_thu.put(tenMien, { tenMien, ten: ten || tenMien, laCuaMinh: !!laCuaMinh, taoLuc: cu?.taoLuc ?? now });
}

export async function xoaDoiThu(s, tenMien) {
	const urls = await tatCa(s.url, { where: { doiThuId: tenMien } });
	if (urls.length) await s.url.deleteMany(urls.map((r) => r.id));
	await s.doi_thu.delete(tenMien);
	return urls.length;
}

/** Thêm URL chưa có; trả số URL mới. `ghi=false` chỉ đếm. */
export async function themUrlMoi(s, tenMien, urls, { ghi, now, nghi }) {
	const ids = urls.map(idUrl);
	const daCo = await s.url.getMany(ids);
	const moi = urls.filter((u, i) => !daCo.has(ids[i]));
	if (ghi && moi.length)
		await ghiTheoLo(s.url, moi.map((url) => ({ id: idUrl(url), data: { doiThuId: tenMien, url, trangThai: "cho", taoLuc: now } })), { nghi });
	return moi.length;
}

export async function layUrlCho(s, tenMien, n) {
	const r = await s.url.query({ where: { doiThuId: tenMien, trangThai: "cho" }, limit: Math.min(n, 100) });
	return r.items.map((x) => ({ id: x.id, ...x.data }));
}

export async function capNhatUrl(s, id, patch) {
	const cu = await s.url.get(id);
	if (cu) await s.url.put(id, { ...cu, ...patch });
}

/**
 * Đưa mọi URL 'loi' của một đối thủ về 'cho' để ca sau thử lại (lỗi mạng tạm, trang chặn
 * nhất thời). Bỏ trường `loi` cũ. @returns {Promise<number>} số URL đã đặt lại
 */
export async function datLaiUrlLoi(s, tenMien, { nghi } = {}) {
	const rows = await tatCa(s.url, { where: { doiThuId: tenMien, trangThai: "loi" } });
	await ghiTheoLo(
		s.url,
		rows.map((r) => {
			const { loi: _bo, ...con } = r.data;
			return { id: r.id, data: { ...con, trangThai: "cho" } };
		}),
		{ nghi },
	);
	return rows.length;
}

/**
 * Vòng đời một URL: cho (mới gom) → cho_ai (đã trích chữ, chờ Claude đọc qua MCP)
 * → da_phan_tich (Claude đã ghi chủ đề). Nhánh cụt: ngoai_nganh, loi.
 */
export const TRANG_THAI_URL = ["cho", "cho_ai", "da_phan_tich", "ngoai_nganh", "loi"];

export async function demUrl(s, tenMien) {
	const ra = {};
	for (const t of TRANG_THAI_URL) ra[t] = await s.url.count({ doiThuId: tenMien, trangThai: t });
	return ra;
}

/** Trang đã trích chữ, chờ Claude đọc (mọi đối thủ). */
export async function layUrlChoAi(s, n) {
	if (n <= 0) return [];
	const r = await s.url.query({ where: { trangThai: "cho_ai" }, limit: Math.min(n, 100) });
	return r.items.map((x) => ({ id: x.id, url: x.data.url, doiThuId: x.data.doiThuId, chu: x.data.chu }));
}

/**
 * Chọn trang để giao cho Claude đêm `ngay`, và dọn trang kẹt gặp trên đường.
 * - Bỏ qua trang đã giao trong đêm nay (`giaoDem === ngay`): giao lại trong cùng đêm chỉ tốn
 *   hạn ngạch mà Claude vẫn đang (hoặc đã không thể) đọc nó.
 * - Trang đã giao `soLanToiDa` lần ở các đêm trước mà vẫn 'cho_ai' → 'loi', bỏ `chu`. Không
 *   có bước này thì một trang Claude không bao giờ xử lý được sẽ đứng đầu hàng đợi mãi.
 * - Trang được chọn đóng dấu `giaoDem` và `soLanGiao + 1`.
 * Storage không lọc được "khác", nên quét 'cho_ai' theo trang rồi lọc trong bộ nhớ; ghi dồn
 * SAU khi quét để việc đổi trạng thái không làm lệch con trỏ phân trang.
 * @returns {Promise<{trang: {id: string, url: string, doiThuId: string, chu: string}[], soChuyenLoi: number}>}
 */
export async function chonUrlChoAi(s, n, { ngay, soLanToiDa }) {
	const chon = [], loi = [];
	if (n <= 0) return { trang: [], soChuyenLoi: 0 };
	const lo = Math.min(100, n * 5);
	let cursor;
	do {
		const r = await s.url.query({ where: { trangThai: "cho_ai" }, limit: lo, cursor });
		for (const x of r.items) {
			const d = x.data;
			if (d.giaoDem === ngay) continue;
			if ((d.soLanGiao ?? 0) >= soLanToiDa) {
				const { chu: _bo, ...con } = d;
				loi.push({ id: x.id, data: { ...con, trangThai: "loi", loi: `Claude không đọc được sau ${soLanToiDa} lần giao` } });
				continue;
			}
			if (chon.length < n) chon.push({ id: x.id, data: { ...d, giaoDem: ngay, soLanGiao: (d.soLanGiao ?? 0) + 1 } });
		}
		cursor = chon.length < n && r.hasMore ? r.cursor : undefined;
	} while (cursor);
	const ghi = [...chon, ...loi];
	if (ghi.length) await s.url.putMany(ghi);
	return {
		trang: chon.map(({ id, data }) => ({ id, url: data.url, doiThuId: data.doiThuId, chu: data.chu })),
		soChuyenLoi: loi.length,
	};
}

/**
 * Claude chủ động bỏ trang (rác, không đọc được). Chỉ với trang đang 'cho_ai'.
 * @param {{id: string, lyDo: string}[]} items
 * @returns {Promise<{daBoQua: number, khongHop: string[]}>}
 */
export async function boQuaUrlChoAi(s, items) {
	if (!items.length) return { daBoQua: 0, khongHop: [] };
	const cu = await s.url.getMany(items.map((x) => x.id));
	const ghi = [], khongHop = [];
	for (const x of items) {
		const d = cu.get(x.id);
		if (!d || d.trangThai !== "cho_ai") {
			khongHop.push(x.id);
			continue;
		}
		const { chu: _bo, ...con } = d;
		ghi.push({ id: x.id, data: { ...con, trangThai: "loi", loi: `Claude bỏ qua: ${x.lyDo}` } });
	}
	if (ghi.length) await s.url.putMany(ghi);
	return { daBoQua: ghi.length, khongHop };
}

export async function demChoAi(s) {
	return s.url.count({ trangThai: "cho_ai" });
}

/**
 * Ghi kết quả Claude đọc. Chỉ nhận URL đang 'cho_ai' — id lạ hay URL đã đọc rồi thì bỏ qua
 * và báo lại, không ghi đè. Bỏ trường `chu` sau khi đọc: không ai cần nó nữa mà nó nặng nhất.
 * @param {{id: string, chuDe: string, tuKhoa: string[], tomTat: string[]}[]} items
 * @returns {Promise<{daGhi: number, boQua: string[]}>}
 */
export async function ghiPhanTich(s, items, now) {
	const cu = await s.url.getMany(items.map((x) => x.id));
	const ghi = [], boQua = [];
	for (const x of items) {
		const d = cu.get(x.id);
		if (!d || d.trangThai !== "cho_ai") {
			boQua.push(x.id);
			continue;
		}
		const { chu: _bo, ...conLai } = d;
		ghi.push({ id: x.id, data: { ...conLai, trangThai: "da_phan_tich", chuDe: x.chuDe, tuKhoa: x.tuKhoa, tomTat: x.tomTat, phanTichLuc: now } });
	}
	if (ghi.length) await s.url.putMany(ghi);
	return { daGhi: ghi.length, boQua };
}

/** Chủ đề đã phân tích, tách theo "của mình" hay đối thủ. */
export async function chuDeDaPhanTich(s, doiThu) {
	const cuaMinh = new Set(doiThu.filter((d) => d.laCuaMinh).map((d) => d.id));
	const rows = await tatCa(s.url, { where: { trangThai: "da_phan_tich" } });
	const minh = [], doiThuTopics = [];
	for (const r of rows) {
		const t = { id: r.id, doiThuId: r.data.doiThuId, chuDe: r.data.chuDe, tuKhoa: r.data.tuKhoa ?? [] };
		(cuaMinh.has(t.doiThuId) ? minh : doiThuTopics).push(t);
	}
	return { minh, doiThu: doiThuTopics };
}

export async function dsCum(s, n = 100) {
	const r = await s.cum.query({ orderBy: { diem: "desc" }, limit: Math.min(n, 100) });
	return r.items.map((x) => ({ id: x.id, ...x.data }));
}

/**
 * Thay các cụm "cho_viet" bằng lứa mới. Cụm đã khoá (bỏ qua / có nháp / đã đăng / phủ bởi từ
 * điển) được GIỮ, và cụm mới nào giống một cụm đã khoá thì không thêm — nhờ vậy bấm "Bỏ qua"
 * có tác dụng qua các đêm dù tên cụm mỗi đêm hơi khác.
 * @returns {Promise<number>} số cụm đã ghi
 */
export async function thayCum(s, cumMoi, now, { nghi } = {}) {
	const cu = await tatCa(s.cum);
	const khoa = cu.filter((r) => r.data.trangThai !== "cho_viet").map((r) => ({ id: r.id, tieuDe: r.data.tenCum, tuKhoa: r.data.tuKhoa }));
	const xoa = cu.filter((r) => r.data.trangThai === "cho_viet").map((r) => r.id);
	if (xoa.length) await s.cum.deleteMany(xoa);
	const ghi = cumMoi.filter((c) => !timTrung({ tieuDe: c.tenCum, tuKhoa: c.tuKhoa }, khoa));
	if (ghi.length) await ghiTheoLo(s.cum, ghi.map((c) => ({ id: bam(c.tenCum), data: { ...c, trangThai: "cho_viet", capNhatLuc: now } })), { nghi });
	return ghi.length;
}

export async function datTrangThaiCum(s, id, trangThai) {
	if (!TRANG_THAI_CUM.includes(trangThai)) throw new Error(`Trạng thái cụm không hợp lệ: ${trangThai}`);
	const cu = await s.cum.get(id);
	if (!cu) throw new Error("Không có cụm này");
	await s.cum.put(id, { ...cu, trangThai });
}

export async function ghiCa(s, ca) {
	await s.ca.put(`${ca.batDau}-${ca.loai}`, ca);
}

export async function dsCa(s, n = 10) {
	const r = await s.ca.query({ orderBy: { batDau: "desc" }, limit: n });
	return r.items.map((x) => x.data);
}
