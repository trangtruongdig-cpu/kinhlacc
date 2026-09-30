import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gomNhom, timTrung, trungTuDien, tapKhoa, doGiong } from "./trung-lap.mjs";

const BAI = JSON.parse(readFileSync(new URL("./__fixture__/bai-viet-30-09.json", import.meta.url), "utf8"));

test("phép kiểm vàng: 7 bài '24 tỉnh huyệt' chung một nhóm, còn lại đứng riêng", () => {
	const nhieu = gomNhom(BAI).filter((n) => n.length > 1);
	assert.deepEqual(nhieu, [[1, 13, 16, 17, 19, 21, 22]]);
});

test("hai bài châm cứu #10–#20 dưới ngưỡng (0,27) — mốc biên đã đo", () => {
	const a = BAI.find((b) => b.id === 10), b = BAI.find((b) => b.id === 20);
	const v = doGiong(tapKhoa(a), tapKhoa(b));
	assert.ok(v > 0.25 && v < 0.3, `đo được ${v}`);
});

test("chủ đề mới về 24 tỉnh huyệt bị bắt trùng", () => {
	const r = timTrung({ tieuDe: "Phương pháp đo nhiệt độ 24 tỉnh huyệt trong chẩn đoán kinh lạc", tuKhoa: ["đo nhiệt độ kinh lạc"] }, BAI);
	assert.ok(r && [1, 13, 16, 17, 19, 21, 22].includes(r.id));
});

test("chủ đề mới khác hẳn không bị bắt", () => {
	assert.equal(timTrung({ tieuDe: "Ngũ hành tương sinh tương khắc trong ăn uống", tuKhoa: ["ngũ hành ăn uống"] }, BAI), null);
});

test("trùng từ điển: bỏ tiền tố 'huyệt'", () => {
	const ten = new Set(["tam am giao", "tuc tam ly", "quan nguyen"]);
	assert.equal(trungTuDien("huyệt tam âm giao", ten), "tam am giao");
	assert.equal(trungTuDien("Huyệt Quan Nguyên", ten), "quan nguyen");
	assert.equal(trungTuDien("đo nhiệt độ kinh lạc", ten), null);
});
