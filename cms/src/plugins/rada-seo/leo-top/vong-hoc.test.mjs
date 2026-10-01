import { test } from "node:test";
import assert from "node:assert/strict";
import { ketQuaPhien, loaiSuaCuaPhieu, tongHopLoaiSua, LOAI_SUA, TOI_THIEU_KET_LUAN, NGUONG_DOI_HANG } from "./vong-hoc.mjs";

const phien = (viTriBanDau, doLai, phieu = {}) => ({ viTriBanDau, doLai, phieu });
const PHIEU_THEM_Y = { themY: ["Chống chỉ định"], cat: [], traiNghiem: [], boSungCanCu: [], taiSanRieng: [], duaTraLoiLenDau: false };

test("loaiSuaCuaPhieu: mục rỗng KHÔNG tính; cờ boolean phải đúng true", () => {
	assert.deepEqual(loaiSuaCuaPhieu(PHIEU_THEM_Y), ["themY"]);
	assert.deepEqual(loaiSuaCuaPhieu({ ...PHIEU_THEM_Y, duaTraLoiLenDau: true }), ["themY", "duaTraLoiLenDau"]);
	assert.deepEqual(loaiSuaCuaPhieu({ themY: [], cat: [] }), []);
	assert.deepEqual(loaiSuaCuaPhieu(null), []);
	// Khoá lạ không được lọt vào bảng.
	assert.deepEqual(loaiSuaCuaPhieu({ khoaLa: ["x"] }), []);
});

test("ketQuaPhien: lấy mốc đo CUỐI, hạng nhỏ hơn là lên", () => {
	const k = ketQuaPhien(phien(12, [{ sauNgay: 14, viTri: 10 }, { sauNgay: 28, viTri: 7.5 }]));
	assert.equal(k.ketQua, "len");
	assert.equal(k.mocCuoi, 28);
	assert.equal(k.doi, 4.5);
	// Mốc đo không theo thứ tự trong mảng vẫn phải lấy mốc lớn nhất.
	assert.equal(ketQuaPhien(phien(12, [{ sauNgay: 28, viTri: 14 }, { sauNgay: 14, viTri: 7 }])).ketQua, "tut");
});

test(`xê dịch trong ±${NGUONG_DOI_HANG} là ĐỨNG YÊN, không gọi là lên`, () => {
	assert.equal(ketQuaPhien(phien(10, [{ sauNgay: 28, viTri: 9.6 }])).ketQua, "yen");
	assert.equal(ketQuaPhien(phien(10, [{ sauNgay: 28, viTri: 10.4 }])).ketQua, "yen");
	assert.equal(ketQuaPhien(phien(10, [{ sauNgay: 28, viTri: 9.4 }])).ketQua, "len");
});

test("chưa có lần đo nào → chua_du, không bị tính là đứng yên", () => {
	assert.equal(ketQuaPhien(phien(10, [])).ketQua, "chua_du");
	assert.equal(ketQuaPhien(phien(10, undefined)).ketQua, "chua_du");
	assert.equal(ketQuaPhien({}).ketQua, "chua_du");
	// Lần đo thiếu viTri thì không dùng được.
	assert.equal(ketQuaPhien(phien(10, [{ sauNgay: 28 }])).ketQua, "chua_du");
});

test("tongHopLoaiSua: đếm theo loại, phiên chưa đo xong KHÔNG vào bảng", () => {
	const t = tongHopLoaiSua([
		phien(12, [{ sauNgay: 28, viTri: 7 }], PHIEU_THEM_Y),
		phien(12, [{ sauNgay: 28, viTri: 15 }], PHIEU_THEM_Y),
		phien(12, [], PHIEU_THEM_Y),
	]);
	assert.equal(t.soPhienDoDuoc, 2);
	assert.equal(t.soPhienChuaDu, 1);
	const r = t.bang.find((x) => x.ma === "themY");
	assert.deepEqual([r.soPhien, r.len, r.tut], [2, 1, 1]);
});

// Chỗ dễ sai nhất của cả tính năng: 1/1 phiên lên hạng là 100% mà chẳng nói được gì.
test(`dưới ${TOI_THIEU_KET_LUAN} phiên thì duKetLuan false và có lời cảnh báo`, () => {
	const t = tongHopLoaiSua([phien(12, [{ sauNgay: 28, viTri: 5 }], PHIEU_THEM_Y)]);
	assert.equal(t.bang[0].duKetLuan, false);
	assert.ok(t.ghiChu.some((g) => /ĐỪNG kết luận/.test(g)));
});

test(`đủ ${TOI_THIEU_KET_LUAN} phiên thì duKetLuan true`, () => {
	const ds = Array.from({ length: TOI_THIEU_KET_LUAN }, () => phien(12, [{ sauNgay: 28, viTri: 8 }], PHIEU_THEM_Y));
	const t = tongHopLoaiSua(ds);
	assert.equal(t.bang[0].duKetLuan, true);
	assert.ok(!t.ghiChu.some((g) => /ĐỪNG kết luận/.test(g)));
});

// Lời cảnh báo nhân quả phải LUÔN có, kể cả khi cỡ mẫu đã đủ: một phiếu mang nhiều loại sửa
// cùng lúc nên không bao giờ quy được công cho một loại.
test("ghi chú đồng xuất hiện ≠ nhân quả luôn có mặt", () => {
	for (const ds of [[], [phien(12, [{ sauNgay: 28, viTri: 8 }], PHIEU_THEM_Y)]]) {
		assert.ok(tongHopLoaiSua(ds).ghiChu.some((g) => /không phải nhân quả/i.test(g)));
	}
});

test("bảng rỗng nói rõ là THIẾU DỮ LIỆU, không phải việc vô ích", () => {
	const t = tongHopLoaiSua([phien(12, [], PHIEU_THEM_Y)]);
	assert.deepEqual(t.bang, []);
	assert.ok(t.ghiChu.some((g) => /chưa có dữ liệu/i.test(g)));
});

test("xếp theo SỐ PHIÊN trước, không theo tỉ lệ lên", () => {
	const ds = [
		// themY: 1 phiên, lên 100%
		phien(12, [{ sauNgay: 28, viTri: 5 }], { themY: ["a"] }),
		// cat: 3 phiên, lên 1/3
		...Array.from({ length: 3 }, (_, i) => phien(12, [{ sauNgay: 28, viTri: i === 0 ? 5 : 12 }], { cat: ["b"] })),
	];
	assert.equal(tongHopLoaiSua(ds).bang[0].ma, "cat");
});

test("tên loại sửa dùng chung LOAI_SUA, không gõ lại chữ", () => {
	const t = tongHopLoaiSua([phien(12, [{ sauNgay: 28, viTri: 5 }], PHIEU_THEM_Y)]);
	assert.equal(t.bang[0].ten, LOAI_SUA.themY);
});

test("không ném với dữ liệu rỗng/hỏng", () => {
	assert.equal(tongHopLoaiSua().soPhienDoDuoc, 0);
	assert.equal(tongHopLoaiSua([null, {}, { phieu: 5 }]).bang.length, 0);
});
