import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { timKhoangTrong, chamDiem, trungXuHuong, nhomKhoangTrong } from "./khoang-trong.mjs";
import { gomNhom, timTrung } from "../luat/trung-lap.mjs";

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

test("chủ đề mình đã có bị loại; nhiều đối thủ cùng viết đứng đầu", async () => {
	const kq = await timKhoangTrong({ chuDeMinh: MINH, chuDeDoiThu: DT, xuHuong: [] });
	assert.ok(!kq.some((c) => c.viDu.some((v) => v.includes("24 tỉnh huyệt"))));
	assert.equal(kq[0].soDoiThu, 3);
	assert.equal(kq[0].soBai, 3);
	assert.ok(kq[0].tuKhoa.includes("bấm huyệt trị mất ngủ"));
	assert.ok(kq.some((c) => c.tenCum === "Ngũ hành và ăn uống theo mùa" && c.soDoiThu === 1));
});

test("cụm nghiêng chữa trị bị phạt 8 điểm", async () => {
	const kq = await timKhoangTrong({ chuDeMinh: [], chuDeDoiThu: [{ id: "x", doiThuId: "a", chuDe: "Châm cứu chữa liệt mặt", tuKhoa: ["châm cứu chữa liệt"] }], xuHuong: [] });
	assert.equal(kq[0].viPham, true);
	assert.equal(kq[0].diem, chamDiem({ soDoiThu: 1, soBai: 1, coXuHuong: false, viPham: true }));
	assert.equal(kq[0].diem, -4);
});

test("trungXuHuong chỉ tính từ khoá ≥ 2 từ", () => {
	assert.equal(trungXuHuong(["bấm huyệt trị mất ngủ"], ["bam huyet tri mat ngu o dau"]), true);
	assert.equal(trungXuHuong(["huyệt"], ["huyệt thái dương"]), false);
});

// Chủ đề đối thủ giả: DT + biến thể của chính 22 bài (phần lớn phải bị loại vì mình đã có)
// + tổ hợp từ một vốn từ nhỏ để có nhóm bắc cầu nhiều tầng.
const VON = ["bấm huyệt", "mất ngủ", "đau lưng", "ngũ hành", "kinh lạc", "thần môn", "tam âm giao", "ăn uống", "theo mùa", "người già"];
const GIA = [
	...DT,
	...MINH.map((m, i) => ({ id: `f${i}`, doiThuId: `d${i % 3}.vn`, chuDe: `${m.chuDe} mới nhất`, tuKhoa: m.tuKhoa.slice(0, 2) })),
	...Array.from({ length: 60 }, (_, i) => ({
		id: `g${i}`, doiThuId: `d${i % 4}.vn`,
		chuDe: `${VON[i % 10]} ${VON[(i * 3 + 1) % 10]} ${VON[(i * 7 + 2) % 10]}`,
		tuKhoa: [`${VON[i % 10]} ${VON[(i + 1) % 10]}`],
	})),
];

test("bản async cho ra ĐÚNG nhóm như timTrung + gomNhom gốc", async () => {
	const minh = MINH.map((m, i) => ({ id: `m${i}`, tieuDe: m.chuDe, tuKhoa: m.tuKhoa }));
	const thieu = GIA.filter((t) => !timTrung({ tieuDe: t.chuDe, tuKhoa: t.tuKhoa }, minh));
	const mong = gomNhom(thieu.map((t) => ({ id: t.id, tieuDe: t.chuDe, tuKhoa: t.tuKhoa })));
	assert.ok(thieu.length < GIA.length, "phải có chủ đề bị loại vì mình đã có");
	assert.ok(mong.some((n) => n.length > 2), "phải có nhóm nhiều bài");
	assert.deepEqual(await nhomKhoangTrong({ chuDeMinh: MINH, chuDeDoiThu: GIA }), mong);
});

test("nhường tiến trình: 1.000 chủ đề đối thủ → gọi setImmediate ≥ 4 lần", async () => {
	const nhieu = Array.from({ length: 1000 }, (_, i) => ({ id: `n${i}`, doiThuId: `d${i % 5}.vn`, chuDe: `Chủ đề số ${i} về ${VON[i % 10]}`, tuKhoa: [`${VON[i % 10]} số ${i}`] }));
	const goc = globalThis.setImmediate;
	let dem = 0;
	globalThis.setImmediate = (...a) => { dem++; return goc(...a); };
	try {
		await timKhoangTrong({ chuDeMinh: MINH, chuDeDoiThu: nhieu, xuHuong: [] });
	} finally {
		globalThis.setImmediate = goc;
	}
	assert.ok(dem >= 4, `chỉ nhường ${dem} lần`);
});
