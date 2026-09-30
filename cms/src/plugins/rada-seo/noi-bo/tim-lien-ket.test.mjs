import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dungChiMuc } from "./chi-muc.mjs";
import { timLienKet } from "./tim-lien-ket.mjs";

const MAU = JSON.parse(readFileSync(new URL("./__fixture__/muc-noi-bo-30-09.json", import.meta.url), "utf8"));
const CM = dungChiMuc(Object.entries(MAU).flatMap(([bo, a]) => a.map((m) => ({ bo, ...m }))));

function gia() {
	const goiKiem = [], goiTra = [];
	return {
		goiKiem, goiTra,
		kiemDuong: async (duong, ten) => { goiKiem.push([duong, ten]); return duong !== "/huyet/am-khich/"; },
		traBaiThuoc: async (ten) => {
			goiTra.push(ten);
			return { "Quy Tỳ Thang": [{ ten: "Quy Tỳ Thang", loai: "bai_thuoc", duong: "/bai-thuoc/quy-ty-thang/" }] };
		},
	};
}

test("timLienKet: chỉ mục trước, cụm chưa khớp gom tra bài thuốc MỘT lượt, cụm không có gì ra rỗng", async () => {
	const g = gia();
	const kq = await timLienKet({ chiMuc: CM, cumTu: ["huyệt Tam Âm Giao", "Quy Tỳ Thang", "máy tính bảng"], traBaiThuoc: g.traBaiThuoc, kiemDuong: g.kiemDuong });
	assert.equal(kq.length, 3);
	assert.deepEqual(kq.map((x) => x.cumTu), ["huyệt Tam Âm Giao", "Quy Tỳ Thang", "máy tính bảng"]);
	assert.ok(kq[0].ketQua.some((x) => x.duong === "/huyet/tam-am-giao/" && x.ten === "Tam Âm Giao"));
	assert.ok(kq[1].ketQua.some((x) => x.duong === "/bai-thuoc/quy-ty-thang/" && x.loai === "bai_thuoc"));
	assert.deepEqual(kq[2].ketQua, []);
	assert.deepEqual(g.goiTra, [["Quy Tỳ Thang", "máy tính bảng"]]);
	assert.ok(kq.every((x) => !x.daCatBot));
});

test("timLienKet: chỉ trả ứng viên có đường ĐẠT; cụm có dấu không lẫn Âm Khích / Ẩm Khích", async () => {
	const g = gia();
	const [a, b] = await timLienKet({ chiMuc: CM, cumTu: ["Âm Khích", "Ẩm Khích"], traBaiThuoc: g.traBaiThuoc, kiemDuong: g.kiemDuong });
	// Âm Khích chỉ có đường /huyet/am-khich/ và đường đó trượt → rỗng; KHÔNG được thay bằng Ẩm Khích.
	assert.deepEqual(a.ketQua, []);
	assert.deepEqual(b.ketQua.map((x) => [x.ten, x.duong]), [["Ẩm Khích", "/huyet/am-khich-2/"]]);
	assert.deepEqual(g.goiTra, [], "cụm đã khớp đúng tên thì không tra bài thuốc");
});

test("timLienKet: tra bài thuốc gửi cả bản bỏ tiền tố; khớp kết quả theo khoá đã gấp (hoa/thường, khoảng trắng)", async () => {
	const goiTra = [];
	const [a] = await timLienKet({
		chiMuc: CM,
		cumTu: ["bài thuốc Quy Tỳ Thang"],
		// API trả khoá khác chữ hoa + thừa khoảng trắng so với cụm gửi đi.
		traBaiThuoc: async (ten) => { goiTra.push(ten); return { "quy tỳ  thang ": [{ ten: "Quy Tỳ Thang", loai: "bai_thuoc", duong: "/bai-thuoc/quy-ty-thang/" }] }; },
		kiemDuong: async () => true,
	});
	assert.deepEqual(goiTra, [["bài thuốc Quy Tỳ Thang", "Quy Tỳ Thang"]]);
	assert.deepEqual(a.ketQua.map((x) => x.duong), ["/bai-thuoc/quy-ty-thang/"]);
});

test("timLienKet: trần toiDaKiem → dừng kiểm, đánh daCatBot", async () => {
	const g = gia();
	const kq = await timLienKet({ chiMuc: CM, cumTu: ["huyệt Tam Âm Giao", "mất ngủ", "Thần Môn", "Quy Tỳ Thang"], traBaiThuoc: g.traBaiThuoc, kiemDuong: g.kiemDuong, toiDaKiem: 2 });
	assert.ok(g.goiKiem.length <= 2, `đã kiểm ${g.goiKiem.length} lần`);
	assert.ok(kq.some((x) => x.daCatBot === true));
	assert.equal(kq.flatMap((x) => x.ketQua).length, 2);
});

test("timLienKet: kiểm đồng thời tối đa 3", async () => {
	let dang = 0, dinh = 0;
	const kiemDuong = async () => { dang++; dinh = Math.max(dinh, dang); await new Promise((r) => setTimeout(r, 5)); dang--; return true; };
	await timLienKet({ chiMuc: CM, cumTu: ["mất ngủ", "Thần Môn", "Tam Âm Giao", "Âm Khích", "kinh Tỳ"], traBaiThuoc: async () => ({}), kiemDuong });
	assert.ok(dinh <= 3 && dinh >= 2, `đỉnh ${dinh}`);
});
