// Bốn việc Claude làm qua MCP cho "leo top" (2D): lấy từ khoá từ GSC → nộp danh sách URL top
// (Claude tìm web; máy chủ KHÔNG cào Google) → lấy chữ từng trang đã tải → ghi báo cáo ý của
// từng trang để máy chủ dựng bản đồ sơ hở + phiếu. Thuần: nhận `s` (storage), `kv`, `gsc`, `docTrang`.
import * as kho from "./kho.mjs";
import { urlDocDuoc } from "./lib/doc-web.mjs";
import { doTrang } from "./leo-top/do-trang.mjs";
import { LOI_NHAC_LEO_TOP, LOI_NHAC_SO_HO } from "./loi-dan.mjs";

/** Phiên mới tối đa mỗi lượt gọi (còn bị chặn thêm bởi kho.TRAN_PHIEN_MO toàn kho). */
export const TRAN_PHIEN_MOI = 5;
/** URL Claude gửi mỗi lượt (khuôn zod cũng chặn đúng số này). */
export const TRAN_URL_SERP = 10;
/** Trang tải mỗi phiên: 10 URL + trang mình. */
export const TRAN_TRANG_SERP = TRAN_URL_SERP + 1;
/** Tải đồng thời: CMS còn phục vụ người thật; lời gọi MCP có hạn chờ nên cũng không tải tuần tự. */
export const DONG_THOI_TAI = 3;
/** Một tên miền chiếm cả top (diễn đàn, báo lớn) thì bản đồ thành bản đồ của MỘT site. */
export const TRAN_MOI_TEN_MIEN = 2;
export const TRAN_CHU_TRANG = 6000;
/** Hạn tải mỗi trang RIÊNG cho đường này, gồm cả đọc thân (mặc định 30 s của doc-web giữ cho radar). */
export const HAN_TAI_MS = 10_000;
/**
 * Hạn CẢ lượt nộp SERP. nginx cắt /_emdash/ ở 120 s: quá đó Claude nhận 504, gọi lại, còn lượt
 * đầu vẫn chạy và ghi — hai lứa tải chồng nhau. 60 s để dư cho GSC/kho và hạn chờ của máy khách MCP.
 */
export const HAN_TONG_MS = 60_000;
export const LOI_HET_GIO_TONG = "het_gio_tong";
/** Khoá KV quanh bước tạo phiên: hai lượt gọi cùng lúc không được cùng đọc "chưa soi" rồi cùng tạo. */
export const KHOA_TAO_PHIEN = "leo_top:khoa_tao";
/**
 * Hạn khoá tạo phiên, đo theo trường hợp XẤU NHẤT của gsc.mjs: lấy token 30 s + 4 trang truy
 * vấn × 30 s + đọc json (cũng có hạn 30 s mỗi lượt) ≈ 270 s, cộng dư cho kho → 330 s. Khoá
 * vẫn có thể hết hạn (máy treo) nên ngay trước khi ghi phiên còn kiểm lại mình còn giữ khoá.
 */
export const HAN_KHOA_TAO_MS = 330_000;

/** Trần chuỗi số đo từ trang LẠ (tiêu đề/mô tả/JSON-LD là thứ trang thù địch tự đặt). */
const TRAN_SO_DO = { tieuDe: 300, moTa: 300, ngayCapNhat: 40, soLoaiJsonLd: 20, loaiJsonLd: 60 };

/** Bọc dữ liệu một dòng trong dấu mốc; "<<<"/">>>" bên trong bị đổi để không tự đóng vùng dữ liệu. */
const thoat = (x) => String(x ?? "").replace(/<{3,}/g, "‹‹‹").replace(/>{3,}/g, "›››");
/** Từ khoá GSC là chữ NGƯỜI LẠ gõ vào Google → đưa cho Claude trong dấu mốc như chữ trang. */
export const bocTuKhoa = (t) => `<<<TU_KHOA>>>${thoat(t)}<<<HET_TU_KHOA>>>`;

/** Từ khoá phụ của phiên, mỗi từ khoá bọc dấu mốc như từ khoá chính. */
const bocTuKhoaPhu = (p) => (p.tuKhoaPhu ?? []).map((x) => ({ ...x, tuKhoa: bocTuKhoa(x.tuKhoa) }));

const tomTatPhien = (p) => ({
	id: p.id, tuKhoa: bocTuKhoa(p.tuKhoa), tuKhoaPhu: bocTuKhoaPhu(p), trangMinh: p.trangMinh, viTriBanDau: p.viTriBanDau, hienThi: p.hienThi, trangThai: p.trangThai,
});

/**
 * Gom hàng GSC (từ khoá × trang) theo TRANG (kho.khoaUrl): mỗi trang một ứng viên phiên. Từ
 * khoá chính = nhiều hiển thị nhất (hoà → hạng tốt hơn); các từ khoá còn lại của trang, xếp theo
 * hiển thị, vào `tuKhoaPhu` (≤ kho.TRAN_TU_KHOA_PHU). Trang trong `trangBoQua` bị bỏ cả trang.
 * Trang xếp theo tổng `coHoi` của mọi từ khoá (hàng GSC đã xếp theo coHoi; hoà giữ thứ tự đó).
 */
export function gomTheoTrang(ds, trangBoQua = new Set()) {
	const nhom = new Map();
	for (const x of ds) {
		const k = kho.khoaUrl(x.trang);
		if (trangBoQua.has(k)) continue;
		if (!nhom.has(k)) nhom.set(k, []);
		nhom.get(k).push(x);
	}
	const ra = [];
	for (const hang of nhom.values()) {
		const xep = [...hang].sort((a, b) => b.hienThi - a.hienThi || a.viTri - b.viTri);
		const [chinh, ...khac] = xep;
		const daCo = new Set([chinh.tuKhoa]);
		const phu = [];
		for (const x of khac) {
			if (daCo.has(x.tuKhoa)) continue;
			daCo.add(x.tuKhoa);
			if (phu.length < kho.TRAN_TU_KHOA_PHU) phu.push({ tuKhoa: x.tuKhoa, viTri: x.viTri, hienThi: x.hienThi });
		}
		const diem = hang.reduce((t, x) => t + (Number(x.coHoi) || 0), 0);
		ra.push({ tuKhoa: chinh.tuKhoa, trang: chinh.trang, viTri: chinh.viTri, hienThi: chinh.hienThi, tuKhoaPhu: phu, diem });
	}
	return ra.sort((a, b) => b.diem - a.diem);
}

/** cho_serp/cho_doc, CŨ NHẤT TRƯỚC: làm hết phiên đang dở rồi mới tới phiên mới. */
async function phienDangMo(s) {
	const ra = [];
	for (const t of ["cho_serp", "cho_doc"]) ra.push(...(await kho.dsLeoTop(s, { trangThai: t })));
	return ra.sort((a, b) => String(a.taoLuc).localeCompare(String(b.taoLuc))).map(tomTatPhien);
}

/** @returns {Promise<{revision: string, token: string}|null>} khoá vừa giành, null nếu lượt khác đang giữ. */
async function giuKhoaTao(kv, nowMs) {
	const cu = await kv.getVersioned(KHOA_TAO_PHIEN);
	if (cu && cu.value?.het > nowMs) return null;
	const token = globalThis.crypto.randomUUID();
	const r = await kv.compareAndSet(KHOA_TAO_PHIEN, cu?.revision ?? null, { het: nowMs + HAN_KHOA_TAO_MS, token });
	return r?.applied ? { revision: r.revision, token } : null;
}

/** Khoá còn là của mình? (hết hạn giữa chừng rồi bị lượt khác giành thì không). */
const conGiuKhoa = async (kv, token) => (await kv.get(KHOA_TAO_PHIEN))?.token === token;

/**
 * Trả phiên đang mở (cũ nhất trước) + tạo phiên mới từ GSC, nhưng chỉ tới khi tổng phiên mở
 * (cho_serp/cho_doc + co_phieu ra phiếu trong 30 ngày, xem kho.demPhienMo) chạm kho.TRAN_PHIEN_MO. Gọi lặp (kể cả thử lại sau khi mất phản
 * hồi) không đẻ thêm phiên. Trước đó bỏ (bo) phiên cho_serp/cho_doc để yên quá 7 ngày.
 * GSC chưa cấu hình / lỗi / khoá bận → trường `loi` tiếng Việt, KHÔNG ném: phiên đang mở vẫn làm tiếp được.
 */
export async function layTuKhoaLeoTop({ s, kv, gsc, nowMs = Date.now() }) {
	const ra = { dangMo: [], moi: [], huongDan: LOI_NHAC_LEO_TOP };
	const khoa = await giuKhoaTao(kv, nowMs);
	if (!khoa) {
		ra.loi = "Đang có một lượt lấy từ khoá leo top khác chạy — không mở thêm phiên lần này; các phiên đang mở bên dưới vẫn làm tiếp được.";
	} else {
		try {
			await kho.boPhienCu(s, nowMs);
			const mo = await kho.demPhienMo(s, nowMs);
			const conCho = Math.min(TRAN_PHIEN_MOI, kho.TRAN_PHIEN_MO - mo);
			if (conCho <= 0) {
				ra.ghiChu = `Đã có ${mo} phiên chưa xong (trần ${kho.TRAN_PHIEN_MO}) nên không mở phiên mới: làm tiếp các phiên đang mở; phiên co_phieu (ra phiếu trong ${kho.NGAY_PHIEU_TINH_TRAN} ngày) chờ người quản trị sửa trang rồi báo đã sửa.`;
			} else {
				const boQua = await kho.trangDaSoi(s, nowMs);
				// Lấy HẾT hàng đủ điều kiện (gsc đã đọc hết mọi trang truy vấn; cắt chỉ là cắt
				// trong bộ nhớ) rồi gom theo trang ở đây: cắt trước khi gom là mất trang.
				const ds = gomTheoTrang(await gsc.layTuKhoaLeoTop({ toiDa: Infinity }), boQua);
				const now = new Date(nowMs).toISOString();
				// GSC có thể chậm hơn cả hạn khoá: lượt khác đã giành khoá thì nó cũng đang tạo
				// phiên từ cùng danh sách — ghi tiếp là đẻ cặp trùng.
				if (ds.length && !(await conGiuKhoa(kv, khoa.token)))
					throw new Error("Lượt này đã mất khoá tạo phiên (GSC trả lời quá lâu, lượt khác đã giành) — không mở phiên mới; gọi lại sau.");
				for (const x of ds.slice(0, conCho)) {
					ra.moi.push(tomTatPhien(await kho.taoPhienLeoTop(s, { tuKhoa: x.tuKhoa, trang: x.trang, viTri: x.viTri, hienThi: x.hienThi, tuKhoaPhu: x.tuKhoaPhu }, now)));
				}
			}
		} catch (e) {
			ra.loi = String(e?.message ?? e).slice(0, 600);
		} finally {
			await kv.compareAndDelete(KHOA_TAO_PHIEN, khoa.revision);
		}
	}
	// dangMo = chỉ phiên đã mở TRƯỚC lượt này: phiên vừa tạo đã nằm trong moi, lặp lại ở đây thì
	// một mô hình đọc máy móc làm mỗi phiên hai lần (nghiệm thu 2D).
	const vuaTao = new Set(ra.moi.map((p) => p.id));
	ra.dangMo = (await phienDangMo(s)).filter((p) => !vuaTao.has(p.id));
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

const HET = Symbol("het");
/** `p` hoặc HET sau `ms`; lượt tải thua cuộc vẫn tự dừng ở hạn riêng của nó (HAN_TAI_MS). */
function hoacHet(p, ms) {
	let t;
	const hen = new Promise((r) => (t = setTimeout(() => r(HET), ms)));
	return Promise.race([p, hen]).finally(() => clearTimeout(t));
}

const cat = (x, n) => (x == null ? x : String(x).slice(0, n));
/** Cắt các chuỗi số đo mà trang lạ tự đặt trước khi lưu kho và đưa cho Claude/quản trị. */
export function gonSoDo(sd) {
	const ra = { ...sd, tieuDe: cat(sd.tieuDe, TRAN_SO_DO.tieuDe), moTa: cat(sd.moTa, TRAN_SO_DO.moTa), ngayCapNhat: cat(sd.ngayCapNhat, TRAN_SO_DO.ngayCapNhat) };
	if (Array.isArray(sd.loaiJsonLd)) ra.loaiJsonLd = sd.loaiJsonLd.slice(0, TRAN_SO_DO.soLoaiJsonLd).map((x) => cat(x, TRAN_SO_DO.loaiJsonLd));
	return ra;
}

/**
 * Nhận danh sách URL top Claude tìm được, lọc (chống SSRF sơ bộ, trùng, ≤ 2/tên miền), thêm
 * trang mình nếu thiếu, tải + đo từng trang, lưu → cho_doc. Nộp lại khi còn cho_doc thì THAY
 * lứa cũ (đường gỡ khi ghi sơ hở bị bác). `thuTu` là hạng trong danh sách GỬI LÊN (URL bị loại
 * vẫn giữ chỗ), trang mình thêm vào thì thuTu null. Cả lượt có hạn `hanTongMs`: trang chưa xong
 * lúc hết hạn → loi "het_gio_tong".
 */
export async function nopSerp({ s, docTrang, id, urls, hanTongMs = HAN_TONG_MS }) {
	const batDau = Date.now();
	const d = await s.leo_top.get(id);
	if (!d) throw new Error("Không có phiên leo top này");
	if (!["cho_serp", "cho_doc"].includes(d.trangThai))
		throw new Error(`Phiên đang ở trạng thái "${d.trangThai}" — nộp SERP chỉ làm được khi "cho_serp" hoặc "cho_doc"`);
	const khoaMinh = kho.khoaUrl(d.trangMinh);
	const chon = [], boQua = [], daCo = new Set(), demMien = new Map();
	urls.forEach((u, i) => {
		const url = String(u ?? "").trim();
		if (i >= TRAN_URL_SERP) return boQua.push({ url, lyDo: `quá ${TRAN_URL_SERP} URL mỗi lượt` });
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

	const hanChot = batDau + hanTongMs;
	const hetGio = (t) => ({ ...t, trangThai: "loi", loi: LOI_HET_GIO_TONG });
	// Trang mình tải TRƯỚC: thiếu nó thì cả phiên vô nghĩa (ghiSoHo từ chối), nên nó không được
	// là trang xếp hàng cuối rồi rơi vào het_gio_tong. Kết quả vẫn giữ thứ tự hạng.
	const thuTuTai = [...chon.filter((t) => t.laMinh), ...chon.filter((t) => !t.laMinh)];
	const daTai = await chayDongThoi(thuTuTai, DONG_THOI_TAI, async (t) => {
		const conLai = hanChot - Date.now();
		if (conLai <= 0) return hetGio(t);
		// Một trang ném (fetch hỏng kiểu lạ, máy đo gặp HTML dị) chỉ hỏng trang đó, không hỏng
		// cả lượt: mất cả lứa nghĩa là Claude phải tìm web lại từ đầu.
		try {
			const r = await hoacHet(Promise.resolve().then(() => docTrang(t.url)), conLai);
			if (r === HET) return hetGio(t);
			// docTrang (taoDocTrang traLyDo) nói đúng nguyên nhân: quá hạn / tên miền / giao thức / chuyển hướng.
			if (!r) return { ...t, trangThai: "loi", loi: "không tải được (không rõ lý do)" };
			if (r.loi && r.status == null) return { ...t, trangThai: "loi", loi: `không tải được: ${String(r.loi).slice(0, 200)}` };
			if (r.status < 200 || r.status >= 300 || !r.html) return { ...t, trangThai: "loi", loi: `HTTP ${r.status}${r.html ? "" : ", trang rỗng"}` };
			const { chu, ...soDo } = doTrang(r.html, { tuKhoa: d.tuKhoa, url: t.url });
			const sd = gonSoDo(soDo);
			return { ...t, trangThai: "ok", soDo: r.catBot ? { ...sd, catBot: true } : sd, chu: String(chu ?? "").slice(0, TRAN_CHU_TRANG) };
		} catch (e) {
			return { ...t, trangThai: "loi", loi: `lỗi khi tải/đo: ${String(e?.message ?? e).slice(0, 200)}` };
		}
	});
	const serp = chon.map((t) => daTai[thuTuTai.indexOf(t)]);
	await kho.ghiSerp(s, id, serp);
	return {
		phienId: id,
		trangThai: "cho_doc",
		soTrangDo: serp.filter((t) => t.trangThai === "ok").length,
		trang: serp.map(({ url, thuTu, laMinh, trangThai, loi }) => (loi ? { url, thuTu, laMinh, trangThai, loi } : { url, thuTu, laMinh, trangThai })),
		boQua,
	};
}

/** Bọc chữ trang trong dấu mốc (như mcp-viec.mjs). */
const boc = (id, chu) => `<<<TRANG_SERP id=${id}>>>\n${thoat(chu)}\n<<<HET_TRANG_SERP id=${id}>>>`;

/** Chữ các trang đo được của một phiên cho_doc, kèm lời dặn đọc. */
export async function layTrangSerp({ s, id }) {
	const d = await s.leo_top.get(id);
	if (!d) throw new Error("Không có phiên leo top này");
	if (d.trangThai !== "cho_doc") throw new Error(`Phiên đang ở trạng thái "${d.trangThai}" — lấy chữ trang chỉ làm được khi "cho_doc"`);
	const trang = [];
	d.serp.forEach((t, i) => {
		if (t.trangThai === "ok") trang.push({ url: t.url, thuTu: t.thuTu, laMinh: !!t.laMinh, chu: boc(i + 1, t.chu) });
	});
	return { phienId: id, tuKhoa: bocTuKhoa(d.tuKhoa), tuKhoaPhu: bocTuKhoaPhu(d), trangMinh: d.trangMinh, trang, huongDan: LOI_NHAC_SO_HO };
}

const tomTatSoHo = (id, d, kq, loiNap) => ({
	phienId: id,
	tuKhoa: bocTuKhoa(d.tuKhoa),
	trangThai: "co_phieu",
	soTrangDoiThu: kq.soTrangDoiThu,
	yCotLoi: kq.banDo.yCotLoi.map((y) => `${y.ten} (${Math.round(y.tiLe * 100)}%)`),
	dauHieuThang: kq.banDo.dauHieuThang,
	ghiChu: kq.banDo.ghiChu,
	phieu: kq.phieu,
	boQua: kq.boQua,
	thieuBaoCao: kq.thieuBaoCao,
	loiNap,
});

/**
 * Ghi báo cáo ý của từng trang → máy chủ dựng bản đồ + phiếu (kho.ghiSoHo) → tóm tắt cho Claude.
 * Kiểm trạng thái + đủ trang TRƯỚC khi nạp chỉ mục (`layChiMuc`, nặng); gửi lại đúng lượt đã
 * ghi → trả phiếu đã lưu.
 * @param {{chiMuc?: object, layChiMuc?: () => Promise<object>}} o
 */
export async function ghiSoHo({ s, id, trang, chiMuc, layChiMuc, nowMs = Date.now() }) {
	const d = await s.leo_top.get(id);
	if (!d) throw new Error("Không có phiên leo top này");
	const cu = kho.soHoDaGhi(d, trang);
	if (cu) return { ...tomTatSoHo(id, d, cu, []), daGhiTruoc: true };
	if (d.trangThai !== "cho_doc") throw new Error(`Phiên đang ở trạng thái "${d.trangThai}" — ghi sơ hở chỉ làm được khi "cho_doc"`);
	kho.ghepBaoCao(d, trang); // ném lý do tiếng Việt, trạng thái giữ nguyên
	const cm = chiMuc ?? (layChiMuc ? await layChiMuc() : undefined);
	const kq = await kho.ghiSoHo(s, id, trang, { chiMuc: cm, nowMs });
	// loiNap: chỉ mục què thì phiếu thiếu "tài sản riêng" — phải lộ ra, không im lặng.
	return tomTatSoHo(id, d, kq, cm?.loiNap ?? []);
}
