import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dungChiMuc, timTrongChiMuc, duongUngVien } from "./chi-muc.mjs";

const MAU = JSON.parse(readFileSync(new URL("./__fixture__/muc-noi-bo-30-09.json", import.meta.url), "utf8"));
const DS = Object.entries(MAU).flatMap(([bo, a]) => a.map((m) => ({ bo, ...m })));
const CM = dungChiMuc(DS);
const dau = (q) => timTrongChiMuc(CM, q)[0];

test("đường ứng viên: slug trước slug_goc; kinh chỉ slug ngắn; blog không '/' cuối", () => {
	assert.deepEqual(duongUngVien("huyet_vi", { slug: "am-khich-2", slug_goc: "am-khich" }), ["/huyet/am-khich-2/", "/huyet/am-khich/"]);
	assert.deepEqual(duongUngVien("kinh_mach", { slug: "phe", slug_goc: "kinh-thu-thai-am-phe" }), ["/kinh/phe/"]);
	assert.deepEqual(duongUngVien("duoc_lieu", { slug: "61" }), ["/duoc-lieu/61/"]);
	assert.deepEqual(duongUngVien("bai_viet", { slug: "dong-ho-kinh-lac" }), ["/blog/dong-ho-kinh-lac"]);
});

test("khớp đúng tên, bỏ tiền tố 'huyệt', không phân biệt hoa", () => {
	const r = dau("huyệt Tam Âm Giao");
	assert.equal(r.ten, "Tam Âm Giao");
	assert.equal(r.khop, "dung");
	assert.deepEqual(r.duong, ["/huyet/tam-am-giao/"]);
});

test("khớp theo mã huyệt và tên khác", () => {
	assert.equal(dau("SP6").ten, "Tam Âm Giao");
	assert.equal(dau("Thừa Mạng").khop, "ten_khac");
	assert.equal(dau("Thừa Mạng").ten, "Tam Âm Giao");
});

test("kinh theo tên ngắn: 'kinh Tỳ' → /kinh/ty/", () => {
	const r = dau("kinh Tỳ");
	assert.equal(r.loai, "kinh");
	assert.deepEqual(r.duong, ["/kinh/ty/"]);
});

test("bệnh: 'mất ngủ' ra cả bệnh học và châm cứu trị bệnh, bệnh học trước", () => {
	const ds = timTrongChiMuc(CM, "mất ngủ");
	assert.deepEqual(ds.slice(0, 2).map((x) => x.loai), ["benh_hoc", "cham_cuu"]);
	assert.deepEqual(ds[0].duong, ["/benh-hoc/mat-ngu/"]);
});

test("cụm dài chứa tên: 'bấm huyệt Thần Môn chữa mất ngủ' ra Thần Môn (chua)", () => {
	const ds = timTrongChiMuc(CM, "bấm huyệt Thần Môn chữa mất ngủ", { toiDa: 10 });
	assert.ok(ds.some((x) => x.ten === "Thần Môn" && x.khop === "chua"));
});

test("hai huyệt khác dấu vẫn là hai mục; cùng khoá không dấu thì trả cả hai để bộ kiểm đường chọn", () => {
	const ds = timTrongChiMuc(CM, "Âm Khích", { toiDa: 10 });
	assert.ok(ds.some((x) => x.ten === "Âm Khích"));
	assert.ok(ds.some((x) => x.ten === "Ẩm Khích"));
});

test("tên 1 từ không 'chứa' bừa: 'tâm' không kéo mọi thứ có chữ tâm", () => {
	const ds = timTrongChiMuc(CM, "an tâm ngủ ngon", { toiDa: 10 });
	assert.ok(!ds.some((x) => x.khop === "chua" && x.ten.split(/\s+/).length < 2));
});

test("không có gì → mảng rỗng", () => {
	assert.deepEqual(timTrongChiMuc(CM, "máy tính bảng"), []);
});
