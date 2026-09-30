import { test } from "node:test";
import assert from "node:assert/strict";
import { doYmyl } from "./ymyl.mjs";

const loai = (s) => doYmyl(s).map((v) => v.loai);

test("bắt liều lượng", () => {
	assert.deepEqual(loai("Bán hạ 6g, Trần bì 4,5 g"), ["lieu", "lieu"]);
	assert.deepEqual(loai("uống 2 viên"), ["lieu"]);
});

test("bắt phác đồ", () => {
	assert.deepEqual(loai("Ngày uống 1 thang, chia 2 lần"), ["lieu", "phac_do"]);
	assert.deepEqual(loai("liệu trình 10 ngày"), ["phac_do"]);
});

test("bắt lời hứa — đúng tiêu đề bài #6 đã đăng", () => {
	assert.deepEqual(loai("Bệnh Hô Hấp Đông Y: Chẩn Đoán, Điều Trị Ho, Viêm Phế Quản Hiệu Quả"), ["hua_hen"]);
});

test("không bắt số không phải liều", () => {
	assert.deepEqual(loai("12 đường kinh và 24 tỉnh huyệt, năm 1983"), []);
});
