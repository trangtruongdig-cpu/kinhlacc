import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { timKhoangTrong, chamDiem, trungXuHuong } from "./khoang-trong.mjs";

// "Của mình" = 22 bài thật ngày 30/09/2026.
const MINH = JSON.parse(readFileSync(new URL("../luat/__fixture__/bai-viet-30-09.json", import.meta.url), "utf8")).map((b) => ({ chuDe: b.tieuDe, tuKhoa: b.tuKhoa }));

const DT = [
	{ id: "1", doiThuId: "a.vn", chuDe: "Bấm huyệt trị mất ngủ tại nhà", tuKhoa: ["bấm huyệt trị mất ngủ", "huyệt thần môn"] },
	{ id: "2", doiThuId: "b.vn", chuDe: "Các huyệt trị mất ngủ hiệu quả", tuKhoa: ["huyệt trị mất ngủ", "bấm huyệt trị mất ngủ"] },
	{ id: "3", doiThuId: "c.vn", chuDe: "Bấm huyệt trị mất ngủ cho người già", tuKhoa: ["bấm huyệt trị mất ngủ", "mất ngủ người già"] },
	// Mình ĐÃ có (7 bài 24 tỉnh huyệt) → không phải khoảng trống.
	{ id: "4", doiThuId: "a.vn", chuDe: "Đo nhiệt độ kinh lạc bằng 24 tỉnh huyệt", tuKhoa: ["đo nhiệt độ kinh lạc", "24 tỉnh huyệt"] },
	{ id: "5", doiThuId: "b.vn", chuDe: "Ngũ hành và ăn uống theo mùa", tuKhoa: ["ngũ hành ăn uống", "ăn uống theo mùa"] },
];

test("chủ đề mình đã có bị loại; nhiều đối thủ cùng viết đứng đầu", () => {
	const kq = timKhoangTrong({ chuDeMinh: MINH, chuDeDoiThu: DT, xuHuong: [] });
	assert.ok(!kq.some((c) => c.viDu.some((v) => v.includes("24 tỉnh huyệt"))));
	assert.equal(kq[0].soDoiThu, 3);
	assert.equal(kq[0].soBai, 3);
	assert.ok(kq[0].tuKhoa.includes("bấm huyệt trị mất ngủ"));
	assert.ok(kq.some((c) => c.tenCum === "Ngũ hành và ăn uống theo mùa" && c.soDoiThu === 1));
});

test("cụm nghiêng chữa trị bị phạt 8 điểm", () => {
	const kq = timKhoangTrong({ chuDeMinh: [], chuDeDoiThu: [{ id: "x", doiThuId: "a", chuDe: "Châm cứu chữa liệt mặt", tuKhoa: ["châm cứu chữa liệt"] }], xuHuong: [] });
	assert.equal(kq[0].viPham, true);
	assert.equal(kq[0].diem, chamDiem({ soDoiThu: 1, soBai: 1, coXuHuong: false, viPham: true }));
	assert.equal(kq[0].diem, -4);
});

test("trungXuHuong chỉ tính từ khoá ≥ 2 từ", () => {
	assert.equal(trungXuHuong(["bấm huyệt trị mất ngủ"], ["bam huyet tri mat ngu o dau"]), true);
	assert.equal(trungXuHuong(["huyệt"], ["huyệt thái dương"]), false);
});
