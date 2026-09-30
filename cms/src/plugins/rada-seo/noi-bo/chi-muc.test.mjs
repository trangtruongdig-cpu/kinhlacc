import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dungChiMuc, timTrongChiMuc, duongUngVien, bienThe } from "./chi-muc.mjs";

const MAU = JSON.parse(readFileSync(new URL("./__fixture__/muc-noi-bo-30-09.json", import.meta.url), "utf8"));
const DS = Object.entries(MAU).flatMap(([bo, a]) => a.map((m) => ({ bo, ...m })));
const CM = dungChiMuc(DS);
const dau = (q) => timTrongChiMuc(CM, q)[0];

test("đường ứng viên: slug trước slug_goc; kinh chỉ slug ngắn; blog CÓ '/' cuối (bản không '/' bị 301)", () => {
	assert.deepEqual(duongUngVien("huyet_vi", { slug: "am-khich-2", slug_goc: "am-khich" }), ["/huyet/am-khich-2/", "/huyet/am-khich/"]);
	assert.deepEqual(duongUngVien("kinh_mach", { slug: "phe", slug_goc: "kinh-thu-thai-am-phe" }), ["/kinh/phe/"]);
	assert.deepEqual(duongUngVien("duoc_lieu", { slug: "61" }), ["/duoc-lieu/61/"]);
	assert.deepEqual(duongUngVien("bai_viet", { slug: "dong-ho-kinh-lac" }), ["/blog/dong-ho-kinh-lac/"]);
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

test("khác dấu là khác mục: cụm có dấu chỉ khớp tên CÓ DẤU trùng khít", () => {
	const ten = (q) => timTrongChiMuc(CM, q, { toiDa: 10 }).map((x) => x.ten);
	assert.equal(ten("ẩm khích")[0], "Ẩm Khích");
	assert.ok(!ten("ẩm khích").includes("Âm Khích"));
	assert.equal(ten("Âm Khích")[0], "Âm Khích");
	assert.ok(!ten("Âm Khích").includes("Ẩm Khích"));
	// Cụm KHÔNG dấu thì chưa phân định được: trả cả hai, bộ kiểm đường so tên trên trang.
	assert.ok(ten("am khich").includes("Âm Khích") && ten("am khich").includes("Ẩm Khích"));
});

test("tiền tố chỉ bỏ ở CỤM, không bỏ ở tên mục: 'Mạch Môn' không ra huyệt Huyết Môn", () => {
	assert.ok(!timTrongChiMuc(CM, "Mạch Môn", { toiDa: 10 }).some((x) => x.ten === "Huyết Môn"));
});

test("'tâm lý' không ra Túc Tam Lý (tên khác 'Tam Lý' chỉ trùng khi bỏ dấu)", () => {
	assert.ok(!timTrongChiMuc(CM, "tâm lý", { toiDa: 10 }).some((x) => x.ten === "Túc Tam Lý"));
});

test("cụm không dấu vẫn khớp bỏ dấu: 'tam am giao' → Tam Âm Giao", () => {
	assert.equal(dau("tam am giao").ten, "Tam Âm Giao");
});

test("cụm nằm trong tên dài hơn: nhãn 'mot_phan', sau 'chua', tối đa 2 mục", () => {
	const ds = timTrongChiMuc(CM, "thần kinh", { toiDa: 10 });
	const mp = ds.filter((x) => x.khop === "mot_phan");
	assert.ok(mp.length >= 1 && mp.length <= 2, `mot_phan: ${mp.length}`);
	const hang = { dung: 0, ten_khac: 1, chua: 2, mot_phan: 3 };
	for (let i = 1; i < ds.length; i++) assert.ok(hang[ds[i - 1].khop] <= hang[ds[i].khop]);
});

test("bienThe: giữ cụm gốc và thêm bản bỏ tiền tố, giữ nguyên chữ hoa/dấu", () => {
	assert.deepEqual(bienThe("bài thuốc Quy Tỳ Thang"), ["bài thuốc Quy Tỳ Thang", "Quy Tỳ Thang"]);
	assert.deepEqual(bienThe(" Quy Tỳ Thang "), ["Quy Tỳ Thang"]);
	assert.deepEqual(bienThe("huyệt Tam Âm Giao"), ["huyệt Tam Âm Giao", "Tam Âm Giao"]);
});

test("tên 1 từ không 'chứa' bừa: 'tâm' không kéo mọi thứ có chữ tâm", () => {
	const ds = timTrongChiMuc(CM, "an tâm ngủ ngon", { toiDa: 10 });
	assert.ok(!ds.some((x) => x.khop === "chua" && x.ten.split(/\s+/).length < 2));
});

test("không có gì → mảng rỗng", () => {
	assert.deepEqual(timTrongChiMuc(CM, "máy tính bảng"), []);
});
