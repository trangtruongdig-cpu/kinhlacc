import { test } from "node:test";
import assert from "node:assert/strict";
import { slugKhongDau } from "./slug.mjs";

test("tiêu đề mẫu của đặc tả", () => {
	assert.equal(slugKhongDau("Châm cứu hỗ trợ giấc ngủ: 5 huyệt Đông y hay dùng"), "cham-cuu-ho-tro-giac-ngu-5-huyet-dong-y-hay-dung");
});

test("đ/Đ → d, gộp và cắt '-' hai đầu", () => {
	assert.equal(slugKhongDau("  Đường đi — kinh Đởm!!  "), "duong-di-kinh-dom");
	assert.equal(slugKhongDau("Huyệt Quan Nguyên (CV4)"), "huyet-quan-nguyen-cv4");
});

test("chữ dạng NFD cho cùng kết quả", () => {
	assert.equal(slugKhongDau("Tỳ Vị hư".normalize("NFD")), "ty-vi-hu");
});

test("cắt ở ranh giới từ, không vượt toiDa", () => {
	const s = slugKhongDau("Huyệt Túc Tam Lý: vị trí, tác dụng bồi bổ và cách xác định chuẩn theo sách", { toiDa: 30 });
	assert.ok(s.length <= 30, s);
	assert.equal(s, "huyet-tuc-tam-ly-vi-tri-tac");
	// Mặc định 70.
	const dai = slugKhongDau(Array.from({ length: 30 }, () => "kinh lạc").join(" "));
	assert.ok(dai.length <= 70 && !dai.endsWith("-") && dai.split("-").every((t) => t === "kinh" || t === "lac"), dai);
	// Vừa đúng toiDa thì giữ nguyên.
	assert.equal(slugKhongDau("abc def", { toiDa: 7 }), "abc-def");
});

test("một từ dài hơn toiDa thì cắt cứng (không trả rỗng)", () => {
	assert.equal(slugKhongDau("abcdefghij", { toiDa: 4 }), "abcd");
});

test("đầu vào rỗng/null", () => {
	assert.equal(slugKhongDau(""), "");
	assert.equal(slugKhongDau(null), "");
	assert.equal(slugKhongDau("!!!"), "");
});
