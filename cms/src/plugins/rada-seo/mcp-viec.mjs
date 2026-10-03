// Ba việc Claude (lịch đêm trong tài khoản của người dùng) làm qua MCP: lấy trang đã trích →
// ghi kết quả đọc → báo xong để tính lại khoảng trống. Thuần: nhận `s` (storage) và `kv`.
//
// TRẦN PHÍA MÁY CHỦ: mỗi đêm (theo giờ Việt Nam) giao tối đa TRAN_TRANG_MOI_DEM trang. Đó là
// thứ giữ hạn mức gói Claude của người dùng — lời dặn trong routine có thể bị bỏ qua, trần
// ở đây thì không.
import * as kho from "./kho.mjs";
import { capNhatKhoangTrong, cauKhoangTrong, xuHuongGanNhat } from "./ca-radar.mjs";
import { BOI_CANH, LOI_NHAC_TRICH } from "./loi-dan.mjs";

export const TRAN_TRANG_MOI_DEM = 40;
export const TRAN_TRANG_MOI_LUOT = 10;

/** "2026-10-01" theo giờ Việt Nam (UTC+7) — đêm 02:00 VN vẫn thuộc ngày đó. Một bản duy nhất ở kho.mjs. */
export const ngayVN = kho.ngayVN;

/** Trang giao chừng ấy đêm mà vẫn chưa được ghi thì coi như Claude không đọc được → 'loi'. */
export const SO_LAN_GIAO_TOI_DA = 3;

/** Giữ kv `claude:giao:*` / `claude:doc:*` bấy nhiêu ngày VN — chỉ để xem lịch sử gần, dọn phần cũ hơn. */
export const GIU_KHOA_NGAY = 7;

/**
 * Dọn kv `claude:giao:YYYY-MM-DD` / `claude:doc:YYYY-MM-DD` cũ hơn GIU_KHOA_NGAY ngày VN.
 * Lỗi được ném lên cho người gọi tự quyết cách xử lý (xongPhanTich bắt và ghi vào `loi`,
 * không để một lượt `kv.list` hỏng làm mất kết quả tính khoảng trống).
 */
async function donKhoaCu(kv, nowMs) {
	const hanNgay = ngayVN(nowMs - GIU_KHOA_NGAY * 24 * 3600 * 1000);
	const items = await kv.list("claude:");
	const cu = items.filter(({ key }) => {
		const m = /^claude:(giao|doc):(\d{4}-\d{2}-\d{2})$/.exec(key);
		return m && m[2] < hanNgay;
	});
	for (const { key } of cu) await kv.delete(key);
}

/**
 * Cộng kv số nguyên, chịu tranh chấp (CAS, thử lại tối đa 5 lần). `them` có thể âm; kết quả
 * không xuống dưới 0.
 */
async function cong(kv, khoa, them) {
	for (let i = 0; i < 5; i++) {
		const cu = await kv.getVersioned(khoa);
		const moi = Math.max(0, (cu?.value ?? 0) + them);
		const r = await kv.compareAndSet(khoa, cu?.revision ?? null, moi);
		if (r.applied) return moi;
	}
	throw new Error("Không cập nhật được bộ đếm (tranh chấp)");
}

/**
 * Giữ chỗ trong hạn ngạch đêm TRƯỚC khi lấy trang (CAS): hai lượt gọi đồng thời không thể
 * cùng thấy "còn 12" rồi cùng giao 10. @returns {Promise<number>} số chỗ đã giữ
 */
async function giuCho(kv, khoa, muon) {
	for (let i = 0; i < 5; i++) {
		const cu = await kv.getVersioned(khoa);
		const daGiao = cu?.value ?? 0;
		const them = Math.max(0, Math.min(muon, TRAN_TRANG_MOI_DEM - daGiao));
		if (them === 0) return 0;
		const r = await kv.compareAndSet(khoa, cu?.revision ?? null, daGiao + them);
		if (r.applied) return them;
	}
	throw new Error("Không giữ được chỗ trong hạn ngạch đêm (tranh chấp)");
}

/**
 * Bọc chữ trang đối thủ trong dấu ranh giới — lời dặn bảo Claude coi phần giữa là DỮ LIỆU.
 * Chuỗi "<<<"/">>>" trong chữ trang bị đổi đi, để trang không tự chèn dấu kết thúc giả mà
 * thoát ra ngoài vùng dữ liệu.
 */
const boc = (id, chu) =>
	`<<<TRANG_DOI_THU id=${id}>>>\n${String(chu ?? "").replace(/<{3,}/g, "‹‹‹").replace(/>{3,}/g, "›››")}\n<<<HET_TRANG id=${id}>>>`;

/**
 * @returns {Promise<{trang: {id: string, url: string, chu: string}[], conLaiDemNay: number,
 *   conTrongHangCho: number, soChuyenLoi: number, boiCanh: string, huongDan: string}>}
 */
export async function layViec({ s, kv, nowMs = Date.now(), soTrang = TRAN_TRANG_MOI_LUOT, doiThuId }) {
	const ngay = ngayVN(nowMs);
	const khoa = `claude:giao:${ngay}`;
	const muon = Math.max(0, Math.min(soTrang, TRAN_TRANG_MOI_LUOT));
	const giu = muon ? await giuCho(kv, khoa, muon) : 0;
	let trang = [], soChuyenLoi = 0;
	try {
		({ trang, soChuyenLoi } = await kho.chonUrlChoAi(s, giu, { ngay, soLanToiDa: SO_LAN_GIAO_TOI_DA, doiThuId }));
	} finally {
		// Hoàn phần giữ mà không dùng (hàng đợi hết, hoặc lỗi khi lấy).
		if (giu > trang.length) await cong(kv, khoa, trang.length - giu);
	}
	const daGiao = (await kv.get(khoa)) ?? 0;
	return {
		trang: trang.map(({ id, url, chu }) => ({ id, url, chu: boc(id, chu) })),
		conLaiDemNay: Math.max(0, TRAN_TRANG_MOI_DEM - daGiao),
		conTrongHangCho: await kho.demChoAi(s),
		soChuyenLoi,
		boiCanh: BOI_CANH,
		huongDan: LOI_NHAC_TRICH,
	};
}

/** Chuẩn hoá một kết quả Claude gửi lên (khuôn đã kiểm ở route; đây là lớp phòng thủ thứ hai). */
function chuan(x) {
	const sach = (a, n) => (Array.isArray(a) ? a.map((v) => String(v).trim()).filter(Boolean).slice(0, n) : []);
	return { id: String(x.id), chuDe: String(x.chuDe ?? "").trim(), tuKhoa: sach(x.tuKhoa, 8), tomTat: sach(x.tomTat, 8) };
}

/**
 * `ketQua`: trang đã đọc. `boQua` (đầu vào): trang Claude chủ động bỏ, kèm lý do → 'loi'.
 * Kết quả `boQua`: các id KHÔNG xử lý được (lạ / không còn 'cho_ai') từ cả hai mảng.
 * @returns {Promise<{daGhi: number, boQua: string[], soThieuChuDe: number, soDaBoQua: number}>}
 */
export async function ghiPhanTich({ s, kv, ketQua = [], boQua = [], nowMs = Date.now() }) {
	const items = ketQua.map(chuan).filter((x) => x.chuDe && x.tuKhoa.length);
	const hong = ketQua.length - items.length;
	const kq = await kho.ghiPhanTich(s, items, new Date(nowMs).toISOString());
	if (kq.daGhi) await cong(kv, `claude:doc:${ngayVN(nowMs)}`, kq.daGhi);
	const bo = boQua
		.map((x) => ({ id: String(x.id), lyDo: String(x.lyDo ?? "").trim().slice(0, 200) }))
		.filter((x) => x.lyDo);
	const kqBo = await kho.boQuaUrlChoAi(s, bo);
	return { daGhi: kq.daGhi, boQua: [...kq.boQua, ...kqBo.khongHop], soThieuChuDe: hong, soDaBoQua: kqBo.daBoQua };
}

/** Tính lại khoảng trống và ghi một dòng nhật ký loại "claude". */
export async function xongPhanTich({ s, kv, nowMs = Date.now(), nghi }) {
	const batDau = new Date(nowMs).toISOString();
	const ngay = ngayVN(nowMs);
	const ca = { loai: "claude", batDau, ketThuc: null, ghi: true, soDoc: (await kv.get(`claude:doc:${ngay}`)) ?? 0, soCum: 0, loi: [], thongTin: [] };
	try {
		const kt = await capNhatKhoangTrong(s, { xuHuong: await xuHuongGanNhat(s), now: batDau, nghi });
		ca.soCum = kt.soCum;
		ca.soChuDeDoiThu = kt.soChuDeDoiThu;
		ca.soChuDeMinh = kt.soChuDeMinh;
		ca.soCumTinh = kt.soCumTinh;
		ca.thongTin.push(cauKhoangTrong(kt));
	} catch (e) {
		ca.loi.push(`khoảng trống: ${String(e?.message ?? e).slice(0, 300)}`);
	}
	try {
		await donKhoaCu(kv, nowMs);
	} catch (e) {
		ca.loi.push(`dọn khoá cũ: ${String(e?.message ?? e).slice(0, 300)}`);
	}
	ca.ketThuc = new Date(nowMs).toISOString();
	await kho.ghiCa(s, ca);
	return { soDocDemNay: ca.soDoc, soCum: ca.soCum, conTrongHangCho: await kho.demChoAi(s), loi: ca.loi };
}
