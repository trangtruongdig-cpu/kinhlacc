import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dungChiMuc } from "../noi-bo/chi-muc.mjs";
import { tinhChiSo, diemHuong, diemCum, TU_SAN_PHAM, timKhop, taoBoChuDe, laTuKhoaDai } from "./chi-so.mjs";

const MAU = JSON.parse(readFileSync(new URL("../noi-bo/__fixture__/muc-noi-bo-30-09.json", import.meta.url), "utf8"));
const CM = dungChiMuc(Object.entries(MAU).flatMap(([bo, a]) => a.map((m) => ({ bo, ...m }))));

// 6 bài của 3 đối thủ quanh "mất ngủ" / "Thần Môn".
const CHU_DE = new Map([
	["d1", { doiThuId: "a.vn", chuDe: "Mất ngủ theo Đông y: nguyên nhân và cách cải thiện", tuKhoa: ["mất ngủ", "mất ngủ đông y"] }],
	["d2", { doiThuId: "a.vn", chuDe: "Bấm huyệt Thần Môn giúp ngủ ngon", tuKhoa: ["huyệt thần môn", "bấm huyệt ngủ ngon"] }],
	["d3", { doiThuId: "b.vn", chuDe: "Mất ngủ kéo dài do Tâm Tỳ hư", tuKhoa: ["mất ngủ kéo dài", "tâm tỳ hư"] }],
	["d4", { doiThuId: "b.vn", chuDe: "Trà an thần từ thảo dược", tuKhoa: ["trà an thần", "thảo dược an thần"] }],
	["d5", { doiThuId: "c.vn", chuDe: "Huyệt Thần Môn nằm ở đâu", tuKhoa: ["huyệt thần môn", "vị trí thần môn"] }],
	["d6", { doiThuId: "c.vn", chuDe: "Ngủ sâu giấc với dưỡng sinh", tuKhoa: ["ngủ sâu giấc"] }],
]);
const IDS = ["d1", "d2", "d3", "d4", "d5", "id-la"];
const TK = ["mất ngủ", "huyệt thần môn", "an thần"];
const BAI_KHAC = [{ tieuDe: "Đồng hồ kinh lạc: 12 đường kinh vượng theo giờ", tuKhoa: ["đồng hồ kinh lạc"] }];
const co = (o = {}) => tinhChiSo({ ten: "Mất ngủ theo Đông y", tuKhoa: TK, idBaiDoiThu: IDS, chuDeDoiThu: CHU_DE, baiMinh: BAI_KHAC, xuHuong: [], chiMuc: CM, ...o });

test("hướng 'mất ngủ': máy chủ TỰ dò chủ đề khớp (id dẫn chỉ là bằng chứng), tài sản từ điển thật, không vi phạm", () => {
	const c = co();
	assert.equal(c.soDoiThu, 3);
	assert.equal(c.soBai, 5);
	assert.deepEqual(c.idKhop, ["d1", "d2", "d3", "d4", "d5"], "d6 'Ngủ sâu giấc' không khớp");
	assert.equal(c.soBangChungBoQua, 1, "id lạ bị bỏ, và đếm ra");
	// Không dẫn id nào thì nhu cầu vẫn y hệt: số đo không phụ thuộc lời mô hình.
	const khongDan = co({ idBaiDoiThu: [] });
	assert.equal(khongDan.soBai, 5);
	assert.equal(diemHuong(khongDan), diemHuong(c));
	assert.equal(c.soBaiMinh, 0);
	assert.equal(c.viPham, false);
	assert.equal(c.ganSanPham, false);
	const duong = c.taiSan.map((x) => x.duong);
	assert.ok(duong.includes("/benh-hoc/mat-ngu/"), duong.join(","));
	assert.ok(duong.includes("/huyet/than-mon/"), duong.join(","));
	assert.equal(c.soTaiSan, c.taiSan.length);
	assert.equal(new Set(duong).size, duong.length, "khử trùng theo đường");
	assert.ok(c.taiSan.every((x) => x.ten && x.loai));
});

test("mẫu dò 'Giảm cân nhanh': từ khoá chung chung + dẫn cả 6 id không liên quan → không có nhu cầu, không có tài sản", () => {
	const c = co({ ten: "Giảm cân nhanh", tuKhoa: ["giảm cân", "huyệt", "ngủ", "đông y", "an"], idBaiDoiThu: [...CHU_DE.keys()] });
	assert.equal(c.soBai, 0);
	assert.equal(c.soDoiThu, 0);
	assert.equal(c.soBangChungBoQua, 6);
	assert.equal(c.soTaiSan, 0, "từ khoá một từ / toàn từ dừng không bão hoà số hạng tài sản");
	assert.ok(diemHuong(c) <= 30, String(diemHuong(c)));
	assert.equal(laTuKhoaDai("đông y"), false);
	assert.equal(laTuKhoaDai("huyệt"), false);
	assert.equal(laTuKhoaDai("mất ngủ"), true);
});

test("tài sản: ≤ 2 trang mỗi từ khoá, ≤ 10 cả hướng", () => {
	const tk = ["huyệt thần môn", "mất ngủ", "an thần", "tam âm giao", "nội quan", "bách hội", "thái xung", "phong trì"];
	const c = co({ tuKhoa: tk });
	assert.ok(c.soTaiSan <= 10);
	const mot = co({ tuKhoa: ["huyệt thần môn"] });
	assert.ok(mot.soTaiSan <= 2, String(mot.soTaiSan));
});

test("timKhop: cụm đủ nghĩa nhưng có mặt ở quá 10% (và > 30) chủ đề thì không dùng làm phép chứa", () => {
	const ds = Array.from({ length: 100 }, (_, i) => ({ id: `x${i}`, doiThuId: "a.vn", chuDe: `Bài thuốc số ${i} cho người già`, tuKhoa: [`bài thuốc ${i}`] }));
	ds.push({ id: "mn", doiThuId: "b.vn", chuDe: "Bài thuốc an thần trị mất ngủ", tuKhoa: ["mất ngủ"] });
	const bo = taoBoChuDe(ds);
	assert.deepEqual(timKhop({ ten: "Bài thuốc", tuKhoa: ["bài thuốc", "mất ngủ"] }, bo).map((i) => ds[i].id), ["mn"]);
});

test("trungXuHuong dùng đúng luật của khoang-trong (từ khoá ≥ 2 từ)", () => {
	assert.equal(co({ xuHuong: ["mất ngủ về đêm"] }).trungXuHuong, true);
	assert.equal(co({ xuHuong: ["giảm cân"] }).trungXuHuong, false);
});

test("mình đã có 2 bài 'mất ngủ' → soBaiMinh = 2 và điểm THẤP hơn", () => {
	const sach = co();
	const daCo = co({
		baiMinh: [
			...BAI_KHAC,
			{ tieuDe: "Mất ngủ và đồng hồ kinh lạc", tuKhoa: [] },
			{ tieuDe: "5 huyệt giúp ngủ ngon", tuKhoa: ["mất ngủ", "huyệt thần môn"] },
		],
	});
	assert.equal(daCo.soBaiMinh, 2);
	assert.ok(diemHuong(daCo) < diemHuong(sach), `${diemHuong(daCo)} < ${diemHuong(sach)}`);
});

test("'châm cứu chữa liệt mặt' → viPham, trừ 40 (kẹp 0)", () => {
	const sach = co({ tuKhoa: ["châm cứu liệt mặt"] });
	const pham = co({ tuKhoa: ["châm cứu chữa liệt mặt"] });
	assert.equal(sach.viPham, false);
	assert.equal(pham.viPham, true);
	assert.ok(diemHuong(pham) <= Math.max(0, diemHuong(sach) - 40), `${diemHuong(pham)} vs ${diemHuong(sach)}`);
	// Lời hứa kết quả (YMYL) cũng là vi phạm.
	assert.equal(co({ tuKhoa: ["cam kết hết mất ngủ"] }).viPham, true);
});

test("'đo nhiệt độ kinh lạc' → gần sản phẩm, cộng đúng 5", () => {
	const c = co({ tuKhoa: ["đo nhiệt độ kinh lạc"] });
	assert.equal(c.ganSanPham, true);
	assert.equal(diemHuong(c), diemHuong({ ...c, ganSanPham: false }) + 5);
	assert.ok(TU_SAN_PHAM.includes("do nhiet do kinh lac"));
});

test("công thức điểm hướng đúng từng số hạng", () => {
	const c = { soDoiThu: 5, soBai: 20, trungXuHuong: true, soBaiMinh: 0, soTaiSan: 10, viPham: false, ganSanPham: false };
	assert.equal(diemHuong(c), 100);
	assert.equal(diemHuong({ ...c, ganSanPham: true }), 100, "kẹp 100");
	// nhuCau = 0.6*2/5 + 0.3*4/20 = 0.3 ; khoangTrong = 1/2 ; taiSan = 0.3
	assert.equal(diemHuong({ soDoiThu: 2, soBai: 4, trungXuHuong: false, soBaiMinh: 1, soTaiSan: 3, viPham: false, ganSanPham: false }), Math.round(100 * (0.4 * 0.3 + 0.3 * 0.5 + 0.3 * 0.3)));
	assert.equal(diemHuong({ soDoiThu: 0, soBai: 0, trungXuHuong: false, soBaiMinh: 9, soTaiSan: 0, viPham: true, ganSanPham: false }), 0, "kẹp 0");
});

test("diemCum tăng đơn điệu theo trọng số; diemHuong luôn trong [0,100]", () => {
	const c = co();
	const ds = [1, 2, 3, 4, 5].map((t) => diemCum(c, t));
	for (let i = 1; i < ds.length; i++) assert.ok(ds[i] > ds[i - 1], ds.join(","));
	assert.equal(diemCum(c, 4), Math.round(diemHuong(c) * 1.0));
	for (const o of [{}, { tuKhoa: ["châm cứu chữa liệt mặt"] }, { tuKhoa: ["đo nhiệt độ kinh lạc"] }, { idBaiDoiThu: [] }]) {
		const d = diemHuong(co(o));
		assert.ok(Number.isInteger(d) && d >= 0 && d <= 100, String(d));
	}
});
