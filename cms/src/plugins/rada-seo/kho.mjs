// Dữ liệu của Rada SEO trong storage của plugin (bảng theo namespace plugin, ở kho CMS).
// Mọi hàm nhận `s` = ctx.storage để thử được bằng kho giả.
import { createHash } from "node:crypto";
import { timTrung } from "./luat/trung-lap.mjs";
import { chuanHoaManh } from "./luat/chuan-hoa.mjs";

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
