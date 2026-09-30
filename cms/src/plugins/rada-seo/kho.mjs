// Dữ liệu của Rada SEO trong storage của plugin (bảng theo namespace plugin, ở kho CMS).
// Mọi hàm nhận `s` = ctx.storage để thử được bằng kho giả.
import { createHash } from "node:crypto";
import { timTrung } from "./luat/trung-lap.mjs";
import { chuanHoaManh } from "./luat/chuan-hoa.mjs";
import { dungBanDo } from "./leo-top/ban-do.mjs";

export const KHAI_BAO_KHO = {
	doi_thu: { indexes: ["tenMien"] },
	// phanTichLuc: chuDeDaPhanTich xếp theo nó (EmDash chỉ cho orderBy trên trường có index).
	url: { indexes: ["doiThuId", "trangThai", ["doiThuId", "trangThai"], "phanTichLuc"] },
	cum: { indexes: ["trangThai", "diem"] },
	ca: { indexes: ["batDau"] },
	// Tầng chiến lược (2C-2). Bộ `cum` ở trên (khoảng trống bằng luật) GIỮ, nay chỉ là bằng chứng.
	huong: { indexes: ["trangThai", "diem"] },
	cum_nghia: { indexes: ["huongId", "trangThai", "diem"] },
	ke_hoach: { indexes: ["cumId", "trangThai", "taoLuc"] },
	// Leo top (2D): một phiên = một cặp (từ khoá, trang mình) đang đứng hạng 4–50 trên GSC.
	leo_top: { indexes: ["trangThai", "taoLuc"] },
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

/** Trần chủ đề đối thủ đưa vào tính khoảng trống — xem chuDeDaPhanTich. */
export const TRAN_CHU_DE_DOI_THU = 1500;

/**
 * Chủ đề đã phân tích, tách theo "của mình" hay đối thủ.
 * Đối thủ chỉ lấy `toiDa` dòng MỚI NHẤT theo phanTichLuc: timKhoangTrong so từng cặp (O(n²)),
 * kho cứ lớn mỗi đêm thì phép tính cứ dài ra và giữ tiến trình CMS đang phục vụ người thật.
 * Của mình thì lấy HẾT (ít bài, và cắt đi là thấy "khoảng trống" giả ở chính chỗ mình đã viết).
 * Dòng cũ không có phanTichLuc vẫn được lấy nhưng xếp CUỐI. EmDash xếp dòng thiếu khoá lên
 * ĐẦU khi "desc" (hạng null, PluginStorageRepository 0.39.1) nên phải gom riêng rồi nối sau,
 * không trông vào thứ tự truy vấn.
 */
export async function chuDeDaPhanTich(s, doiThu, { toiDa = TRAN_CHU_DE_DOI_THU } = {}) {
	const cuaMinh = new Set(doiThu.filter((d) => d.laCuaMinh).map((d) => d.id));
	const thanh = (r) => ({ id: r.id, doiThuId: r.data.doiThuId, chuDe: r.data.chuDe, tuKhoa: r.data.tuKhoa ?? [], url: r.data.url });
	const minh = [];
	for (const id of cuaMinh)
		for (const r of await tatCa(s.url, { where: { doiThuId: id, trangThai: "da_phan_tich" } })) minh.push(thanh(r));
	const coMoc = [], khongMoc = [];
	let cursor;
	do {
		const r = await s.url.query({ where: { trangThai: "da_phan_tich" }, orderBy: { phanTichLuc: "desc" }, limit: 100, cursor });
		for (const x of r.items) {
			if (cuaMinh.has(x.data.doiThuId)) continue;
			(x.data.phanTichLuc ? coMoc : khongMoc).push(thanh(x));
		}
		cursor = r.hasMore && coMoc.length < toiDa ? r.cursor : undefined;
	} while (cursor);
	return { minh, doiThu: [...coMoc, ...khongMoc].slice(0, toiDa) };
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

// ---- Hướng nội dung → cụm theo nghĩa → kế hoạch (bài dự kiến) — 2C-2 ----
// Duyệt HAI chỗ: người quản trị nhận/bỏ HƯỚNG, rồi duyệt/bỏ từng BÀI DỰ KIẾN. Claude đề xuất
// lại mỗi tuần, nên mọi hàm ghi lứa mới phải GIỮ quyết định người dùng đã đặt.

export const TRANG_THAI_HUONG = ["de_xuat", "da_nhan", "bo_qua"];
export const TRANG_THAI_KE_HOACH = ["de_xuat", "da_duyet", "bo_qua", "dang_viet", "co_nhap", "da_dang"];
/**
 * "cu": cụm bị lứa phân cụm mới thay đi nhưng còn bài dự kiến chưa bỏ → giữ để bài không mồ côi,
 * vẫn hiện trên màn, nhưng không nhận bài dự kiến MỚI.
 */
export const TRANG_THAI_CUM_NGHIA = ["de_xuat", "cu"];

/** Id theo tên chuẩn hoá mạnh: Claude viết lại "Mất ngủ theo Đông y!" tuần sau vẫn trúng dòng cũ. */
export const idHuong = (ten) => `h_${bam(chuanHoaManh(ten))}`;
export const idCumNghia = (huongId, ten) => `c_${bam(`${huongId}|${chuanHoaManh(ten)}`)}`;
const idKeHoach = (cumId, tieuDe) => `k_${bam(`${cumId}|${chuanHoaManh(tieuDe)}`)}`;

/** Không truyền `where: undefined` xuống storage thật — chỉ thêm khoá khi có điều kiện. */
const loc = (where, orderBy) => (where ? { where, orderBy } : { orderBy });

const lyDoSach = (x) => String(x ?? "").trim().slice(0, 300);

export async function dsHuong(s, { trangThai } = {}) {
	const r = await tatCa(s.huong, loc(trangThai && { trangThai }, { diem: "desc" }));
	return r.map((x) => ({ id: x.id, ...x.data }));
}

/**
 * Ghi lứa hướng Claude đề xuất (đã chấm điểm). Hướng cùng tên đã có → cập nhật chỉ số/điểm/
 * mô tả, GIỮ trangThai/trongSo/lyDoBo/taoLuc — không thì mỗi tuần Claude đề xuất lại là xoá
 * quyết định của người dùng. @returns {Promise<{id: string, ten: string, diem: number}[]>}
 */
export async function luuHuongMoi(s, ds, now, { nghi } = {}) {
	const ids = ds.map((h) => idHuong(h.ten));
	const cu = await s.huong.getMany(ids);
	const ghi = new Map();
	ds.forEach((h, i) => {
		const c = cu.get(ids[i]);
		const giu = c ? { trangThai: c.trangThai, trongSo: c.trongSo, lyDoBo: c.lyDoBo, taoLuc: c.taoLuc } : { trangThai: "de_xuat", taoLuc: now };
		for (const k of Object.keys(giu)) if (giu[k] === undefined) delete giu[k];
		ghi.set(ids[i], { ...h, ...giu, capNhatLuc: now });
	});
	await ghiTheoLo(s.huong, [...ghi].map(([id, data]) => ({ id, data })), { nghi });
	return [...ghi].map(([id, d]) => ({ id, ten: d.ten, diem: d.diem }));
}

/** Người quản trị đặt trạng thái hướng. Nhận phải kèm trọng số 1..5; bỏ phải kèm lý do (Claude đọc lại). */
export async function datHuong(s, id, { trangThai, trongSo, lyDoBo } = {}) {
	if (!TRANG_THAI_HUONG.includes(trangThai)) throw new Error(`Trạng thái hướng không hợp lệ: ${trangThai}`);
	const cu = await s.huong.get(id);
	if (!cu) throw new Error("Không có hướng này");
	const moi = { ...cu, trangThai };
	if (trangThai === "da_nhan") {
		if (!Number.isInteger(trongSo) || trongSo < 1 || trongSo > 5) throw new Error("Nhận hướng cần trọng số nguyên 1..5");
		moi.trongSo = trongSo;
	}
	if (trangThai === "bo_qua") {
		if (!lyDoSach(lyDoBo)) throw new Error("Bỏ hướng cần lý do");
		moi.lyDoBo = lyDoSach(lyDoBo);
	} else delete moi.lyDoBo;
	await s.huong.put(id, moi);
	return { id, ...moi };
}

export async function dsCumNghia(s, { huongId } = {}) {
	const r = await tatCa(s.cum_nghia, loc(huongId && { huongId }, { diem: "desc" }));
	return r.map((x) => ({ id: x.id, ...x.data }));
}

/**
 * Thay lứa cụm của MỘT hướng. Cụm cũ không có trong lứa mới: còn bài dự kiến ở trạng thái nào
 * khác bo_qua (kể cả de_xuat CHƯA duyệt) → giữ, đặt trangThai "cu"; không còn → xoá (bài bo_qua
 * của nó ở lại làm trí nhớ chống đề xuất lại). Không bài dự kiến nào bị xoá ở đây: trước đây
 * Claude đổi tên một cụm (hoặc gửi cụm của một hướng qua hai lượt) là bài chưa duyệt biến mất
 * trước khi người dùng kịp xem. Cụm mới cùng tên một cụm cũ → cùng id, cập nhật chỉ số, sống lại
 * (de_xuat). @returns {Promise<{id: string, ten: string, diem: number}[]>}
 */
export async function thayCumNghia(s, huongId, ds, now, { nghi } = {}) {
	const cu = await tatCa(s.cum_nghia, { where: { huongId } });
	const kh = cu.length ? await tatCa(s.ke_hoach, { where: { cumId: { in: cu.map((r) => r.id) } } }) : [];
	const conBai = new Set(kh.filter((k) => k.data.trangThai !== "bo_qua").map((k) => k.data.cumId));
	const theoId = new Map(cu.map((r) => [r.id, r.data]));
	const ghi = new Map();
	for (const c of ds) {
		const id = idCumNghia(huongId, c.ten);
		const c0 = theoId.get(id);
		ghi.set(id, { ...c, huongId, trangThai: "de_xuat", taoLuc: c0?.taoLuc ?? now, capNhatLuc: now });
	}
	const biThay = cu.filter((r) => !ghi.has(r.id));
	const xoa = biThay.filter((r) => !conBai.has(r.id)).map((r) => r.id);
	const giu = biThay.filter((r) => conBai.has(r.id) && r.data.trangThai !== "cu").map((r) => ({ id: r.id, data: { ...r.data, trangThai: "cu", capNhatLuc: now } }));
	if (xoa.length) await s.cum_nghia.deleteMany(xoa);
	await ghiTheoLo(s.cum_nghia, [...[...ghi].map(([id, data]) => ({ id, data })), ...giu], { nghi });
	return [...ghi].map(([id, d]) => ({ id, ten: d.ten, diem: d.diem }));
}

export async function dsKeHoach(s, { trangThai } = {}) {
	const r = await tatCa(s.ke_hoach, loc(trangThai && { trangThai }, { taoLuc: "desc" }));
	return r.map((x) => ({ id: x.id, ...x.data }));
}

/**
 * Thêm bài dự kiến (đã qua rào ở chien-luoc/viec.mjs), trạng thái de_xuat. Id đã có (cùng cụm,
 * cùng tiêu đề chuẩn hoá) → cập nhật nội dung nhưng GIỮ trangThai/lyDoBo/taoLuc người dùng đã đặt.
 * @returns {Promise<{id: string, tieuDeLamViec: string}[]>}
 */
export async function themKeHoach(s, ds, now, { nghi } = {}) {
	const ids = ds.map((k) => idKeHoach(k.cumId, k.tieuDeLamViec));
	const cu = await s.ke_hoach.getMany(ids);
	const ghi = new Map();
	ds.forEach((k, i) => {
		const c = cu.get(ids[i]);
		const giu = c ? { trangThai: c.trangThai, lyDoBo: c.lyDoBo, taoLuc: c.taoLuc } : { trangThai: "de_xuat", taoLuc: now };
		for (const x of Object.keys(giu)) if (giu[x] === undefined) delete giu[x];
		ghi.set(ids[i], { ...k, ...giu, ...(c ? { capNhatLuc: now } : {}) });
	});
	const items = [...ghi].map(([id, data]) => ({ id, data }));
	await ghiTheoLo(s.ke_hoach, items, { nghi });
	return items.map((x) => ({ id: x.id, tieuDeLamViec: x.data.tieuDeLamViec }));
}

/** Hướng của một bài dự kiến: theo huongId đã lưu, không có thì qua cụm. */
async function huongCuaKeHoach(s, k) {
	const huongId = k.huongId ?? (await s.cum_nghia.get(k.cumId))?.huongId;
	return huongId ? await s.huong.get(huongId) : null;
}

export async function datKeHoach(s, id, { trangThai, lyDoBo } = {}) {
	if (!TRANG_THAI_KE_HOACH.includes(trangThai)) throw new Error(`Trạng thái bài dự kiến không hợp lệ: ${trangThai}`);
	const cu = await s.ke_hoach.get(id);
	if (!cu) throw new Error("Không có bài dự kiến này");
	// Duyệt hai chỗ theo thứ tự: hướng bị bỏ (hoặc chưa nhận) thì bài trong đó chưa được duyệt.
	if (trangThai === "da_duyet" && (await huongCuaKeHoach(s, cu))?.trangThai !== "da_nhan")
		throw new Error("Hướng của bài dự kiến này chưa được nhận — nhận hướng trước rồi mới duyệt bài");
	const moi = { ...cu, trangThai };
	if (trangThai === "bo_qua") {
		if (!lyDoSach(lyDoBo)) throw new Error("Bỏ bài dự kiến cần lý do");
		moi.lyDoBo = lyDoSach(lyDoBo);
	} else delete moi.lyDoBo;
	await s.ke_hoach.put(id, moi);
	return { id, ...moi };
}

// ---- Leo top (2D) ----
// Vòng đời một phiên: cho_serp (vừa lấy từ GSC, chờ Claude tìm web gửi danh sách URL top)
// → cho_doc (máy chủ đã tải + đo từng trang, chờ Claude đọc báo ý) → co_phieu (máy chủ dựng
// bản đồ sơ hở + phiếu sửa) → da_sua (người quản trị báo đã sửa trang) → xong (đã đo lại hạng
// ở mốc +28 ngày). Mốc +14 là mốc giữa, không đóng phiên. Phiên cho_serp/cho_doc để yên quá
// NGAY_BO_PHIEN ngày → bo (bỏ dở): không ai làm tiếp thì đừng giữ chỗ trong trần phiên mở.

export const TRANG_THAI_LEO_TOP = ["cho_serp", "cho_doc", "co_phieu", "da_sua", "xong", "bo"];
/** Trạng thái còn "mở" — tính vào trần TRAN_PHIEN_MO. da_sua chỉ chờ ca đo lại, không tốn lượt Claude. */
export const TRANG_THAI_MO = ["cho_serp", "cho_doc", "co_phieu"];
/** Trần phiên mở toàn kho: mỗi phiên kéo theo ~11 trang Claude phải đọc; gọi lặp không được đẻ thêm. */
export const TRAN_PHIEN_MO = 10;
/** cho_serp/cho_doc không ai đụng tới chừng này ngày → bo. */
export const NGAY_BO_PHIEN = 7;
/** Mốc đo lại hạng sau ngày sửa. Mốc cuối đóng phiên. */
export const MOC_DO_LAI = [14, 28];
/**
 * GSC trễ 2–3 ngày và Google còn phải thu thập lại trang: số liệu mấy ngày đầu sau khi sửa
 * vẫn là hạng CŨ. Cửa sổ đo lại bỏ chừng này ngày đầu.
 */
export const NGAY_TRE_GSC = 3;
/**
 * Cửa sổ GSC lúc mở phiên (mốc so sánh) — khớp mặc định `ngay` của gsc.layTuKhoaLeoTop. Lưu ý
 * gsc.mjs lấy [hôm nay − ngay, hôm nay] CẢ HAI ĐẦU, tức ngay + 1 ngày lịch: số hiển thị/ngày
 * phải chia cho số ngày lịch thật, không phải cho tham số.
 */
export const CUA_SO_BAN_DAU_NGAY = 28;
/**
 * Phiên co_phieu chỉ giữ chỗ trong trần phiên mở chừng này ngày kể từ lúc ra phiếu. Quá hạn
 * mà người quản trị chưa bấm "Đã sửa theo phiếu" thì nó vẫn là co_phieu (vẫn đánh dấu đã sửa
 * được, cặp từ khoá vẫn không bị soi đè) nhưng thôi chặn phiên mới.
 */
export const NGAY_PHIEU_TINH_TRAN = 30;
/** Cùng cặp (từ khoá, trang) soi lại trước chừng này ngày là quá sớm: Google chưa kịp phản ánh. */
export const NGAY_KHONG_SOI_LAI = 28;
/** Trang đối thủ tối thiểu (đo được VÀ có báo cáo) để bản đồ sơ hở có nghĩa. */
export const TOI_THIEU_DOI_THU = 2;
const NGAY_MS = 86_400_000;

/** "2026-10-01" theo giờ Việt Nam (UTC+7). Ngày sửa, ngày đo lại, mốc hạn đều tính theo lịch VN. */
export function ngayVN(ms) {
	return new Date(ms + 7 * 3600 * 1000).toISOString().slice(0, 10);
}
/** Số ngày lịch giữa hai ngày "YYYY-MM-DD" (b − a). */
const soNgayLich = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / NGAY_MS);

/** Cộng `n` ngày lịch vào "YYYY-MM-DD". */
export const congNgay = (x, n) => new Date(Date.parse(`${x}T00:00:00Z`) + n * NGAY_MS).toISOString().slice(0, 10);
export { soNgayLich };

/**
 * Hiển thị bình quân MỖI NGÀY (2 chữ số lẻ). Cửa sổ mốc ban đầu (29 ngày) và cửa sổ đo lại
 * (11 / 25 ngày) dài khác nhau: so TỔNG hiển thị là so táo với cam — chỉ so con số này.
 */
/** GSC chưa có số cho ~2 ngày cuối cửa sổ (cửa sổ luôn kết thúc hôm nay) — bỏ khỏi mẫu số,
 * không thì cửa sổ ngắn (+14: 11 ngày) bị hạ 8–20% còn cửa sổ gốc 29 ngày chỉ 3–10%, bản sửa
 * trông như tụt dù không tụt. */
export const NGAY_GSC_CHUA_CO = 2;
export function hienThiMoiNgay(hienThi, soNgay) {
	if (hienThi == null || !Number.isFinite(Number(hienThi)) || !(soNgay > 0)) return null;
	const ngayCo = Math.max(1, soNgay - NGAY_GSC_CHUA_CO);
	return Math.round((Number(hienThi) / ngayCo) * 100) / 100;
}

/** Khoá so URL: bỏ #, bỏ "/" cuối — Claude và GSC hay viết lệch nhau đúng hai chỗ đó. */
export function khoaUrl(u) {
	try {
		const x = new URL(String(u).trim());
		x.hash = "";
		return x.href.replace(/\/$/, "");
	} catch {
		return String(u ?? "").trim();
	}
}

async function layPhien(s, id) {
	const d = await s.leo_top.get(id);
	if (!d) throw new Error("Không có phiên leo top này");
	return d;
}

function canTrangThai(d, ds, viec) {
	if (!ds.includes(d.trangThai))
		throw new Error(`Phiên đang ở trạng thái "${d.trangThai}" — ${viec} chỉ làm được khi ${ds.map((t) => `"${t}"`).join(" hoặc ")}`);
}

const boChu = (serp) => (serp ?? []).map(({ chu: _bo, ...t }) => t);

/** Phiên mới (cho_serp). Id kèm mốc tạo: soi lại cùng cặp sau 28 ngày là phiên MỚI, không đè phiên cũ. */
export async function taoPhienLeoTop(s, { tuKhoa, trang, viTri, hienThi }, now) {
	const id = `lt_${bam(`${tuKhoa}|${trang}|${now}`)}`;
	// Mốc so sánh của lần đo lại: hạng ban đầu là bình quân cửa sổ GSC [den − 28, den] (ngày UTC,
	// như gsc.mjs tính) — 29 ngày lịch.
	const den = String(now).slice(0, 10);
	const soNgay = CUA_SO_BAN_DAU_NGAY + 1;
	const data = {
		tuKhoa, trangMinh: trang, viTriBanDau: viTri, hienThi, hienThiNgay: hienThiMoiNgay(hienThi, soNgay), trangThai: "cho_serp",
		cuaSoBanDau: { soNgay, tu: congNgay(den, -CUA_SO_BAN_DAU_NGAY), den },
		serp: [], banDo: null, phieu: null, doLai: [], taoLuc: now, capNhatLuc: now,
	};
	await s.leo_top.put(id, data);
	return { id, ...data };
}

/** Danh sách phiên, KHÔNG kèm chữ trang (`chu` chỉ để rada_lay_trang_serp đọc qua get). */
export async function dsLeoTop(s, { trangThai } = {}) {
	const r = await tatCa(s.leo_top, loc(trangThai && { trangThai }, { taoLuc: "desc" }));
	return r.map((x) => ({ id: x.id, ...x.data, serp: boChu(x.data.serp) }));
}

/** Mốc ra phiếu của một phiên (soHoLuc; bản ghi cũ thiếu thì taoLuc), epoch ms hoặc NaN. */
const mocPhieu = (d) => Date.parse(d.soHoLuc ?? d.taoLuc);

/**
 * Số phiên đang giữ chỗ trong trần: cho_serp/cho_doc (đếm, không đọc bản ghi) + co_phieu ra
 * phiếu trong NGAY_PHIEU_TINH_TRAN ngày. co_phieu quá hạn không tự đổi trạng thái — chỉ thôi
 * chặn phiên mới (không thì một người quản trị bận là trần đầy mãi).
 */
export async function demPhienMo(s, nowMs = Date.now()) {
	const dang = await s.leo_top.count({ trangThai: { in: ["cho_serp", "cho_doc"] } });
	const moc = nowMs - NGAY_PHIEU_TINH_TRAN * NGAY_MS;
	let phieu = 0;
	for (const r of await tatCa(s.leo_top, { where: { trangThai: "co_phieu" } })) {
		const t = mocPhieu(r.data);
		if (!Number.isFinite(t) || t > moc) phieu++;
	}
	return dang + phieu;
}

/**
 * cho_serp/cho_doc không được đụng (capNhatLuc) quá NGAY_BO_PHIEN ngày → bo, bỏ luôn chữ trang.
 * @returns {Promise<number>} số phiên vừa bỏ
 */
export async function boPhienCu(s, nowMs, { ngay = NGAY_BO_PHIEN } = {}) {
	const moc = nowMs - ngay * NGAY_MS;
	const bo = [];
	for (const r of await tatCa(s.leo_top, { where: { trangThai: { in: ["cho_serp", "cho_doc"] } } })) {
		const t = Date.parse(r.data.capNhatLuc ?? r.data.taoLuc);
		if (Number.isFinite(t) && t < moc)
			bo.push({ id: r.id, data: { ...r.data, serp: boChu(r.data.serp), trangThai: "bo", boLuc: new Date(nowMs).toISOString() } });
	}
	if (bo.length) await ghiTheoLo(s.leo_top, bo);
	return bo.length;
}

/**
 * Khoá `tuKhoa|trang` KHÔNG được mở phiên mới: mọi phiên chưa kết thúc (khác xong/bo) dù cũ
 * tới đâu — mở phiên thứ hai lúc đó là soi đè; và phiên xong/bo tạo trong NGAY_KHONG_SOI_LAI
 * ngày — soi lại quá sớm Google chưa kịp phản ánh.
 */
export async function tuKhoaDaSoi(s, nowMs, { ngay = NGAY_KHONG_SOI_LAI } = {}) {
	const moc = nowMs - ngay * NGAY_MS;
	const ra = new Set();
	for (const r of await tatCa(s.leo_top)) {
		const t = Date.parse(r.data.taoLuc);
		const ketThuc = r.data.trangThai === "xong" || r.data.trangThai === "bo";
		if (!ketThuc || (Number.isFinite(t) && t >= moc)) ra.add(`${r.data.tuKhoa}|${r.data.trangMinh}`);
	}
	return ra;
}

/** Lưu SERP đã tải + đo (thay lứa cũ nếu nộp lại khi còn cho_doc) → cho_doc. */
export async function ghiSerp(s, id, serp, now = new Date().toISOString()) {
	const d = await layPhien(s, id);
	canTrangThai(d, ["cho_serp", "cho_doc"], "nộp SERP");
	await s.leo_top.put(id, { ...d, serp, trangThai: "cho_doc", capNhatLuc: now });
}

/** Dấu vân tay của lượt báo cáo — gửi lại y hệt (thử lại sau khi mất phản hồi) thì trả phiếu đã lưu. */
export const bamBaoCao = (baoCao) => bam(JSON.stringify(baoCao ?? []));

/** Phiên đã co_phieu từ ĐÚNG lượt báo cáo này → kết quả đã lưu; không thì null. */
export function soHoDaGhi(d, baoCao) {
	if (d?.trangThai !== "co_phieu" || !d.soHo || d.soHo.bam !== bamBaoCao(baoCao)) return null;
	const { bam: _b, ...kq } = d.soHo;
	return { banDo: d.banDo, phieu: d.phieu, ...kq };
}

/**
 * Ghép báo cáo với SERP; ném (lý do tiếng Việt, KHÔNG đổi trạng thái) khi bản đồ sẽ vô nghĩa:
 * trang mình không đo được / không có báo cáo, hoặc dưới TOI_THIEU_DOI_THU trang đối thủ vừa
 * đo được vừa có báo cáo. Gỡ: gửi lại báo cáo đủ trang, hoặc nộp lại SERP (phiên vẫn cho_doc).
 */
export function ghepBaoCao(d, baoCao) {
	const theoUrl = new Map(d.serp.map((t, i) => [khoaUrl(t.url), i]));
	const bc = new Map();
	const boQua = [];
	for (const b of baoCao) {
		const i = theoUrl.get(khoaUrl(b.url));
		if (i === undefined || d.serp[i].trangThai !== "ok") boQua.push(b.url);
		else bc.set(i, b);
	}
	const goLai = "Phiên vẫn ở cho_doc: gửi lại báo cáo đủ trang, hoặc nộp lại danh sách URL bằng công cụ có tên kết thúc bằng rada_nop_serp.";
	const iMinh = d.serp.findIndex((t) => t.laMinh);
	if (iMinh < 0 || d.serp[iMinh].trangThai !== "ok")
		throw new Error(`Chưa ghi được sơ hở: trang của mình không tải/đo được nên không có gì để so. ${goLai}`);
	if (!bc.has(iMinh)) throw new Error(`Chưa ghi được sơ hở: thiếu báo cáo cho trang của mình (laMinh: true). ${goLai}`);
	const soDoiThu = [...bc.keys()].filter((i) => !d.serp[i].laMinh).length;
	if (soDoiThu < TOI_THIEU_DOI_THU)
		throw new Error(`Chưa ghi được sơ hở: mới có ${soDoiThu} trang đối thủ vừa đo được vừa có báo cáo, cần ít nhất ${TOI_THIEU_DOI_THU}. ${goLai}`);
	return { bc, boQua };
}

/**
 * Ghi báo cáo Claude đọc từng trang → máy chủ dựng bản đồ sơ hở + phiếu (dungBanDo) → co_phieu.
 * Chỉ trang ĐO ĐƯỢC (trangThai "ok") VÀ có báo cáo mới vào bản đồ: trang không báo ý mà vẫn
 * tính là "đã đo" thì hạ tỉ lệ mọi ý và ý cốt lõi thật rơi khỏi ngưỡng 60%. Bỏ `chu` của mọi
 * trang sau bước này — không ai cần nó nữa mà nó nặng nhất. Gửi lại đúng lượt báo cáo cũ khi
 * đã co_phieu → trả kết quả đã lưu (không dựng lại, không ném).
 * @param {{url: string, y: string[], cauTraLoiO: string, ruom: string[], thieuCanCu: string[], khoDung: string[]}[]} baoCao
 * @returns {Promise<{banDo: object, phieu: object, boQua: string[], thieuBaoCao: string[], soTrangDoiThu: number}>}
 */
export async function ghiSoHo(s, id, baoCao, { chiMuc, nowMs = Date.now() } = {}) {
	const d = await layPhien(s, id);
	const cu = soHoDaGhi(d, baoCao);
	if (cu) return cu;
	canTrangThai(d, ["cho_doc"], "ghi sơ hở");
	const { bc, boQua } = ghepBaoCao(d, baoCao);
	const serp = boChu(d.serp).map((con, i) => {
		const b = bc.get(i);
		return b
			? { ...con, y: b.y ?? [], cauTraLoiO: b.cauTraLoiO, ruom: b.ruom ?? [], thieuCanCu: b.thieuCanCu ?? [], khoDung: b.khoDung ?? [] }
			: con;
	});
	const vao = serp.filter((_, i) => bc.has(i));
	const thieuBaoCao = serp.filter((t, i) => t.trangThai === "ok" && !bc.has(i)).map((t) => t.url);
	const { phieu, ...banDo } = dungBanDo({ tuKhoa: d.tuKhoa, trang: vao, chiMuc, now: nowMs });
	const tomTat = { boQua, thieuBaoCao, soTrangDoiThu: vao.filter((t) => !t.laMinh).length };
	const luc = new Date(nowMs).toISOString();
	await s.leo_top.put(id, {
		...d, serp, banDo, phieu, trangThai: "co_phieu", soHoLuc: luc, capNhatLuc: luc,
		soHo: { bam: bamBaoCao(baoCao), ...tomTat },
	});
	return { banDo, phieu, ...tomTat };
}

/** Ngày lịch thật "YYYY-MM-DD" (2026-02-31 bị bác — Date.parse tự dời nó sang 03-03). */
const ngayThat = (x) => /^\d{4}-\d{2}-\d{2}$/.test(x) && Number.isFinite(Date.parse(`${x}T00:00:00Z`)) && new Date(`${x}T00:00:00Z`).toISOString().slice(0, 10) === x;

/**
 * Người quản trị báo đã sửa trang theo phiếu (hoặc chỉnh lại ngày khi còn da_sua). Ngày tính
 * theo lịch VN: không sau hôm nay, không trước ngày ra phiếu. Đổi ngày → xoá các lần đo lại
 * cũ (chúng đo theo ngày sửa cũ).
 */
export async function datDaSua(s, id, ngay, { nowMs = Date.now() } = {}) {
	const x = String(ngay);
	if (!ngayThat(x)) throw new Error("Ngày sửa phải là ngày có thật, dạng YYYY-MM-DD");
	const d = await layPhien(s, id);
	canTrangThai(d, ["co_phieu", "da_sua"], "đặt đã sửa");
	const homNay = ngayVN(nowMs);
	if (x > homNay) throw new Error(`Ngày sửa ${x} ở tương lai (hôm nay ${homNay} theo giờ Việt Nam)`);
	const moc = d.soHoLuc ?? d.taoLuc;
	const ngayPhieu = moc && Number.isFinite(Date.parse(moc)) ? ngayVN(Date.parse(moc)) : null;
	if (ngayPhieu && x < ngayPhieu) throw new Error(`Ngày sửa ${x} trước ngày ra phiếu ${ngayPhieu}`);
	const moi = { ...d, trangThai: "da_sua", ngaySua: x, doLai: d.ngaySua === x ? (d.doLai ?? []) : [] };
	await s.leo_top.put(id, moi);
	return { id, ...moi, serp: boChu(moi.serp) };
}

/**
 * Phiên da_sua tới hạn đo lại: mốc LỚN NHẤT đã qua mà chưa đo, tính bằng NGÀY LỊCH VN từ ngày
 * sửa. Ca lỡ mốc 14 (vd máy chủ tắt hai tuần) thì chỉ đo một lần ở mốc 28 — đo cả hai lúc đó
 * ra cùng một con số.
 * @returns {Promise<{id: string, tuKhoa: string, trangMinh: string, moc: number}[]>}
 */
export async function phienCanDoLai(s, nowMs) {
	const ra = [];
	const homNay = ngayVN(nowMs);
	for (const r of await tatCa(s.leo_top, { where: { trangThai: "da_sua" } })) {
		if (!ngayThat(String(r.data.ngaySua))) continue;
		const soNgay = soNgayLich(r.data.ngaySua, homNay);
		const moc = [...MOC_DO_LAI].reverse().find((m) => soNgay >= m);
		if (moc === undefined || (r.data.doLai ?? []).some((x) => x.sauNgay === moc)) continue;
		ra.push({ id: r.id, tuKhoa: r.data.tuKhoa, trangMinh: r.data.trangMinh, moc, ngaySua: r.data.ngaySua });
	}
	return ra;
}

/**
 * Thêm một lần đo lại; mốc đã có thì bỏ qua. Mốc cuối → xong. `ngaySua`: ngày sửa mà ca đã
 * dùng để tính mốc + cửa sổ — người quản trị đổi ngày giữa lúc ca đọc và lúc ghi thì con số
 * thuộc về ngày cũ, KHÔNG ghi (ca sau tính lại theo ngày mới).
 * @returns {Promise<boolean>} đã ghi
 */
export async function ghiDoLai(s, id, { ngaySua, ngay, sauNgay, viTri, hienThi, cuaSoNgay }) {
	const d = await layPhien(s, id);
	if (d.trangThai !== "da_sua" || (d.doLai ?? []).some((x) => x.sauNgay === sauNgay)) return false;
	if (ngaySua !== undefined && d.ngaySua !== ngaySua) return false;
	const lan = { ngay, sauNgay, viTri, hienThi };
	if (cuaSoNgay !== undefined) {
		lan.cuaSoNgay = cuaSoNgay;
		lan.hienThiNgay = hienThiMoiNgay(hienThi, cuaSoNgay);
	}
	const doLai = [...(d.doLai ?? []), lan];
	const xong = sauNgay >= MOC_DO_LAI[MOC_DO_LAI.length - 1];
	await s.leo_top.put(id, { ...d, doLai, trangThai: xong ? "xong" : "da_sua" });
	return true;
}
