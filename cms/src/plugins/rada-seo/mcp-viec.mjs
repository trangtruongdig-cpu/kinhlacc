// Ba việc Claude (lịch đêm trong tài khoản của người dùng) làm qua MCP: lấy trang đã trích →
// ghi kết quả đọc → báo xong để tính lại khoảng trống. Thuần: nhận `s` (storage) và `kv`.
//
// TRẦN PHÍA MÁY CHỦ: mỗi đêm (theo giờ Việt Nam) giao tối đa TRAN_TRANG_MOI_DEM trang. Đó là
// thứ giữ hạn mức gói Claude của người dùng — lời dặn trong routine có thể bị bỏ qua, trần
// ở đây thì không.
import * as kho from "./kho.mjs";
import { capNhatKhoangTrong, xuHuongGanNhat } from "./ca-radar.mjs";
import { BOI_CANH, LOI_NHAC_TRICH } from "./loi-dan.mjs";

export const TRAN_TRANG_MOI_DEM = 40;
export const TRAN_TRANG_MOI_LUOT = 10;

/** "2026-10-01" theo giờ Việt Nam (UTC+7) — đêm 02:00 VN vẫn thuộc ngày đó. */
export function ngayVN(ms) {
	return new Date(ms + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

/** Cộng kv số nguyên, chịu tranh chấp (CAS, thử lại tối đa 5 lần). */
async function cong(kv, khoa, them) {
	for (let i = 0; i < 5; i++) {
		const cu = await kv.getVersioned(khoa);
		const moi = (cu?.value ?? 0) + them;
		const r = await kv.compareAndSet(khoa, cu?.revision ?? null, moi);
		if (r.applied) return moi;
	}
	throw new Error("Không cập nhật được bộ đếm (tranh chấp)");
}

/**
 * @returns {Promise<{trang: {id: string, url: string, chu: string}[], conLaiDemNay: number,
 *   conTrongHangCho: number, boiCanh: string, huongDan: string}>}
 */
export async function layViec({ s, kv, nowMs = Date.now(), soTrang = TRAN_TRANG_MOI_LUOT }) {
	const khoa = `claude:giao:${ngayVN(nowMs)}`;
	const daGiao = (await kv.get(khoa)) ?? 0;
	const duocLay = Math.max(0, Math.min(soTrang, TRAN_TRANG_MOI_LUOT, TRAN_TRANG_MOI_DEM - daGiao));
	const trang = await kho.layUrlChoAi(s, duocLay);
	const tong = trang.length ? await cong(kv, khoa, trang.length) : daGiao;
	return {
		trang: trang.map(({ id, url, chu }) => ({ id, url, chu })),
		conLaiDemNay: TRAN_TRANG_MOI_DEM - tong,
		conTrongHangCho: await kho.demChoAi(s),
		boiCanh: BOI_CANH,
		huongDan: LOI_NHAC_TRICH,
	};
}

/** Chuẩn hoá một kết quả Claude gửi lên (khuôn đã kiểm ở route; đây là lớp phòng thủ thứ hai). */
function chuan(x) {
	const sach = (a, n) => (Array.isArray(a) ? a.map((v) => String(v).trim()).filter(Boolean).slice(0, n) : []);
	return { id: String(x.id), chuDe: String(x.chuDe ?? "").trim(), tuKhoa: sach(x.tuKhoa, 8), tomTat: sach(x.tomTat, 8) };
}

/** @returns {Promise<{daGhi: number, boQua: string[]}>} */
export async function ghiPhanTich({ s, kv, ketQua, nowMs = Date.now() }) {
	const items = ketQua.map(chuan).filter((x) => x.chuDe && x.tuKhoa.length);
	const hong = ketQua.length - items.length;
	const kq = await kho.ghiPhanTich(s, items, new Date(nowMs).toISOString());
	if (kq.daGhi) await cong(kv, `claude:doc:${ngayVN(nowMs)}`, kq.daGhi);
	return { daGhi: kq.daGhi, boQua: kq.boQua, soThieuChuDe: hong };
}

/** Tính lại khoảng trống và ghi một dòng nhật ký loại "claude". */
export async function xongPhanTich({ s, kv, nowMs = Date.now(), nghi }) {
	const batDau = new Date(nowMs).toISOString();
	const ngay = ngayVN(nowMs);
	const ca = { loai: "claude", batDau, ketThuc: null, ghi: true, soDoc: (await kv.get(`claude:doc:${ngay}`)) ?? 0, soCum: 0, loi: [] };
	try {
		ca.soCum = await capNhatKhoangTrong(s, { xuHuong: await xuHuongGanNhat(s), now: batDau, nghi });
	} catch (e) {
		ca.loi.push(`khoảng trống: ${String(e?.message ?? e).slice(0, 300)}`);
	}
	ca.ketThuc = new Date().toISOString();
	await kho.ghiCa(s, ca);
	return { soDocDemNay: ca.soDoc, soCum: ca.soCum, conTrongHangCho: await kho.demChoAi(s), loi: ca.loi };
}
