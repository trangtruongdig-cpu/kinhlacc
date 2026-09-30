import { test } from "node:test";
import assert from "node:assert/strict";
import { layViec, ghiPhanTich, xongPhanTich, ngayVN, TRAN_TRANG_MOI_DEM } from "./mcp-viec.mjs";
import * as kho from "./kho.mjs";
import { taoKhoGia, taoKvGia } from "./__test__/kho-gia.mjs";

// 01:30 giờ VN ngày 2026-10-01 = 18:30Z ngày 2026-09-30.
const DEM = Date.parse("2026-09-30T18:30:00.000Z");
const nghi = async () => {};

async function khoCo(n) {
	const s = taoKhoGia();
	await kho.luuDoiThu(s, { tenMien: "minh.vn", laCuaMinh: true }, "t");
	await kho.luuDoiThu(s, { tenMien: "a.vn" }, "t");
	for (let i = 0; i < n; i++) await s.url.put(`u${i}`, { doiThuId: i % 2 ? "a.vn" : "b.vn", url: `https://a.vn/${i}`, trangThai: "cho_ai", chu: `TIÊU ĐỀ: bài ${i}` });
	return s;
}

test("ngayVN tính theo UTC+7", () => {
	assert.equal(ngayVN(DEM), "2026-10-01");
	assert.equal(ngayVN(Date.parse("2026-09-30T16:59:00Z")), "2026-09-30");
});

test("layViec: giao tối đa 10 trang/lượt, kèm lời dặn; trần 40 trang/đêm giữ ở máy chủ", async () => {
	const s = await khoCo(60);
	const kv = taoKvGia();
	const v1 = await layViec({ s, kv, nowMs: DEM, soTrang: 50 });
	assert.equal(v1.trang.length, 10);
	assert.ok(v1.trang[0].chu.startsWith("TIÊU ĐỀ"));
	assert.ok(v1.boiCanh.includes("Kinhlac") && v1.huongDan.includes("rada_ghi_phan_tich"));
	assert.equal(v1.conLaiDemNay, TRAN_TRANG_MOI_DEM - 10);
	for (let i = 0; i < 3; i++) await layViec({ s, kv, nowMs: DEM });
	const het = await layViec({ s, kv, nowMs: DEM });
	assert.equal(het.trang.length, 0);
	assert.equal(het.conLaiDemNay, 0);
	// Đêm sau: hạn ngạch mới.
	assert.equal((await layViec({ s, kv, nowMs: DEM + 24 * 3600e3 })).trang.length, 10);
});

test("ghiPhanTich: chuẩn hoá, bỏ mục thiếu chủ đề/từ khoá, đếm số đã đọc trong đêm", async () => {
	const s = await khoCo(3);
	const kv = taoKvGia();
	const kq = await ghiPhanTich({
		s, kv, nowMs: DEM,
		ketQua: [
			{ id: "u0", chuDe: " Bấm huyệt trị mất ngủ ", tuKhoa: ["bấm huyệt trị mất ngủ", " "], tomTat: ["a"] },
			{ id: "u1", chuDe: "", tuKhoa: ["x"], tomTat: [] },
			{ id: "u9", chuDe: "lạ", tuKhoa: ["x"], tomTat: [] },
		],
	});
	assert.deepEqual(kq, { daGhi: 1, boQua: ["u9"], soThieuChuDe: 1 });
	const u0 = await s.url.get("u0");
	assert.equal(u0.chuDe, "Bấm huyệt trị mất ngủ");
	assert.deepEqual(u0.tuKhoa, ["bấm huyệt trị mất ngủ"]);
	assert.equal(await kv.get("claude:doc:2026-10-01"), 1);
});

test("xongPhanTich: tính khoảng trống từ những gì Claude đã đọc, ghi nhật ký 'claude'", async () => {
	const s = await khoCo(0);
	const kv = taoKvGia();
	await s.url.put("m1", { doiThuId: "minh.vn", url: "https://minh.vn/1", trangThai: "cho_ai", chu: "x" });
	await s.url.put("d1", { doiThuId: "a.vn", url: "https://a.vn/1", trangThai: "cho_ai", chu: "x" });
	await s.url.put("d2", { doiThuId: "b.vn", url: "https://b.vn/1", trangThai: "cho_ai", chu: "x" });
	await ghiPhanTich({
		s, kv, nowMs: DEM,
		ketQua: [
			{ id: "m1", chuDe: "Đồng hồ kinh lạc 12 canh giờ", tuKhoa: ["đồng hồ kinh lạc"], tomTat: [] },
			{ id: "d1", chuDe: "Bấm huyệt trị mất ngủ tại nhà", tuKhoa: ["bấm huyệt trị mất ngủ"], tomTat: [] },
			{ id: "d2", chuDe: "Bấm huyệt trị mất ngủ cho người già", tuKhoa: ["bấm huyệt trị mất ngủ"], tomTat: [] },
		],
	});
	const kq = await xongPhanTich({ s, kv, nowMs: DEM, nghi });
	assert.equal(kq.soDocDemNay, 3);
	assert.equal(kq.soCum, 1);
	const [cum] = await kho.dsCum(s);
	assert.equal(cum.soDoiThu, 2);
	const [ca] = await kho.dsCa(s);
	assert.equal(ca.loai, "claude");
	assert.equal(ca.soDoc, 3);
});
