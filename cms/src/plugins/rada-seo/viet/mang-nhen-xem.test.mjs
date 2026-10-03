import { test } from "node:test";
import assert from "node:assert/strict";
import { gomMangNhen, toaDoNanHoa } from "./mang-nhen-xem.mjs";

const SO = [
	{ id: "cu1", ds: [{ slug: "moi-a", tieuDe: "Bài A", neo: "mất ngủ", canVietThem: false }] },
	{ id: "cu2", ds: [{ slug: "moi-a", tieuDe: "Bài A", neo: "", canVietThem: true, lyDo: "chưa có cụm nào" }] },
	{ id: "cu3", ds: [{ slug: "moi-b", tieuDe: "Bài B", neo: "đau lưng", canVietThem: false }] },
];
const TEN = new Map([["cu1", { tieuDe: "Bài cũ 1", slug: "cu-1" }]]);

test("lật ngược sổ: mỗi BÀI MỚI thành một trung tâm, bài cũ là nan", () => {
	const r = gomMangNhen(SO, TEN);
	assert.equal(r.trungTam.length, 2);
	assert.equal(r.trungTam[0].slug, "moi-a");
	assert.equal(r.trungTam[0].soNan, 2);
	assert.equal(r.soDeXuat, 3);
	assert.equal(r.soBaiCu, 3);
	assert.equal(r.soCanVietThem, 1);
});

test("nan CÓ NEO SẴN xếp trước nan phải viết thêm — việc rẻ trước", () => {
	const t = gomMangNhen(SO, TEN).trungTam[0];
	assert.equal(t.nan[0].canVietThem, false);
	assert.equal(t.nan[1].canVietThem, true);
	assert.equal(t.soCanVietThem, 1);
});

test("tên bài cũ tra được thì hiện, không tra được thì để trống chứ không bịa", () => {
	const t = gomMangNhen(SO, TEN).trungTam[0];
	assert.equal(t.nan.find((x) => x.id === "cu1").tieuDeCu, "Bài cũ 1");
	assert.equal(t.nan.find((x) => x.id === "cu2").tieuDeCu, "");
});

test("sổ rỗng ra số 0, không ném", () => {
	assert.deepEqual(gomMangNhen([]), { trungTam: [], soDeXuat: 0, soBaiCu: 0, soCanVietThem: 0 });
	assert.equal(gomMangNhen(null).soDeXuat, 0);
});

test("toaDoNanHoa: nan đầu nằm trên ĐỈNH, các nan rải đều", () => {
	const t = toaDoNanHoa(4, { r: 100, cx: 100, cy: 100 });
	assert.deepEqual(t[0], { x: 100, y: 0 });
	assert.deepEqual(t[2], { x: 100, y: 200 });
	assert.equal(t.length, 4);
	assert.deepEqual(toaDoNanHoa(0), []);
});
