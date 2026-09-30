import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dungChiMuc } from "../noi-bo/chi-muc.mjs";
import { dungBanDo, gomY } from "./ban-do.mjs";

const MAU = JSON.parse(readFileSync(new URL("../noi-bo/__fixture__/muc-noi-bo-30-09.json", import.meta.url), "utf8"));
const CM = dungChiMuc(Object.entries(MAU).flatMap(([bo, a]) => a.map((m) => ({ bo, ...m }))));
const NOW = Date.parse("2026-09-30T00:00:00Z");

const TOT = { viTriTraLoi: 20, coBang: true, soNguonNgoai: 3, coTacGia: true, ngayCapNhat: "2026-05-01", soChu: 1200 };
const KEM = { viTriTraLoi: null, coBang: false, soNguonNgoai: 0, coTacGia: false, ngayCapNhat: "2022-01-01", soChu: 5000 };
const trang = (url, thuTu, y, soDo, them = {}) => ({
	url, thuTu, laMinh: false, y, soDo, cauTraLoiO: "dau", ruom: [], thieuCanCu: [], khoDung: [], ...them,
});

// 5 trang đối thủ + trang mình. Top 3 chung "vị trí huyệt", "cách bấm", "lưu ý" (viết khác nhau).
const TRANG = [
	trang("https://a.vn/1", 1, ["Vị trí huyệt Thần Môn", "Cách bấm huyệt", "Lưu ý", "Tác dụng chữa mất ngủ"], TOT),
	trang("https://b.vn/2", 2, ["vị trí huyệt", "cách bấm", "lưu ý", "tác dụng chữa mất ngủ", "Vị trí huyệt"], TOT),
	trang("https://c.vn/3", 3, ["Vị trí huyệt", "Cách bấm huyệt", "Lưu ý"], TOT),
	trang("https://d.vn/4", 4, ["Vị trí huyệt", "Tác dụng chữa mất ngủ", "Phong thuỷ"], KEM, { cauTraLoiO: "cuoi" }),
	trang("https://e.vn/5", 5, ["Vị trí huyệt Thần Môn", "Cách bấm huyệt"], { ...KEM, viTriTraLoi: 30, coTacGia: true }),
	trang(
		"https://kinhlac.online/huyet/than-mon/",
		8,
		["Vị trí huyệt", "Cách bấm", "Lịch sử tên gọi"],
		{ viTriTraLoi: 400, coBang: false, soNguonNgoai: 0, coTacGia: true, ngayCapNhat: "2026-09-01", soChu: 300 },
		{ laMinh: true, cauTraLoiO: "giua", ruom: ["Đoạn mở đầu kể chuyện không liên quan"], khoDung: ["so sánh A", "liệt kê B", "so sánh C"] },
	),
];
const VAO = { tuKhoa: "huyệt thần môn", trang: TRANG, chiMuc: CM, now: NOW };

test("gom ý: Jaccard cặp từ ≥ 0,5; ý một từ so bằng đẳng thức", () => {
	const nhom = gomY(["Vị trí huyệt Thần Môn", "vị trí huyệt", "Cách bấm huyệt", "cách bấm", "Lưu ý khi bấm", "lưu ý", "Mệnh", "mệnh", "Mệnh cung"]);
	const tim = (s) => nhom.findIndex((n) => n.includes(s));
	assert.equal(tim("Vị trí huyệt Thần Môn"), tim("vị trí huyệt"));
	assert.equal(tim("Cách bấm huyệt"), tim("cách bấm"));
	assert.notEqual(tim("Vị trí huyệt Thần Môn"), tim("Cách bấm huyệt"));
	assert.notEqual(tim("Lưu ý khi bấm"), tim("lưu ý")); // {luu_y} vs 3 cặp → 1/3
	assert.equal(tim("Mệnh"), tim("mệnh"));
	assert.notEqual(tim("Mệnh"), tim("Mệnh cung"));
});

test("ý cốt lõi ≥ 60% đối thủ (không tính trang mình); tên = cách viết nhiều nhất", () => {
	const bd = dungBanDo(VAO);
	const ten = bd.yCotLoi.map((y) => y.ten);
	assert.deepEqual([...ten].sort(), ["Cách bấm huyệt", "Lưu ý", "Tác dụng chữa mất ngủ", "Vị trí huyệt"].sort());
	const viTri = bd.yCotLoi.find((y) => y.ten === "Vị trí huyệt");
	assert.equal(viTri.tiLe, 1); // trang b nhắc hai lần vẫn tính một
	const luuY = bd.yCotLoi.find((y) => y.ten === "Lưu ý");
	assert.equal(luuY.tiLe, 0.6);
	assert.deepEqual(luuY.trangCo, ["https://a.vn/1", "https://b.vn/2", "https://c.vn/3"]);
	assert.ok(luuY.trangThieu.includes("https://kinhlac.online/huyet/than-mon/"));
	assert.ok(luuY.trangThieu.includes("https://d.vn/4"));
	// Xếp theo tỉ lệ giảm dần.
	assert.deepEqual(bd.yCotLoi.map((y) => y.tiLe), [...bd.yCotLoi.map((y) => y.tiLe)].sort((a, b) => b - a));
});

test("ý thừa ≤ 20%: 'phong thuỷ' (1 trang) và ý chỉ trang mình có", () => {
	const bd = dungBanDo(VAO);
	const thua = Object.fromEntries(bd.yThua.map((y) => [y.ten, y]));
	assert.deepEqual(Object.keys(thua).sort(), ["Lịch sử tên gọi", "Phong thuỷ"]);
	assert.equal(thua["Phong thuỷ"].tiLe, 0.2);
	assert.deepEqual(thua["Phong thuỷ"].trangCo, ["https://d.vn/4"]);
	assert.equal(thua["Lịch sử tên gọi"].tiLe, 0);
});

test("sơ hở từng trang: ý cốt lõi thiếu + sơ hở trải nghiệm đo được", () => {
	const bd = dungBanDo(VAO);
	const ho = Object.fromEntries(bd.soHo.map((s) => [s.url, s]));
	assert.equal(bd.soHo.length, 6);
	assert.deepEqual(ho["https://a.vn/1"].thieuY, []);
	assert.deepEqual(ho["https://a.vn/1"].traiNghiem, []);
	const d = ho["https://d.vn/4"];
	assert.deepEqual([...d.thieuY].sort(), ["Cách bấm huyệt", "Lưu ý"]);
	assert.equal(d.traiNghiem.length, 4); // trả lời muộn, không nguồn, không tác giả, cũ > 24 tháng
	assert.ok(d.traiNghiem.some((t) => /nguồn/.test(t)));
	assert.ok(d.traiNghiem.some((t) => /tác giả/.test(t)));
	assert.ok(d.traiNghiem.some((t) => /24 tháng/.test(t)));
	// Không bảng chỉ là sơ hở khi có ≥ 3 ý khó dùng (so sánh/liệt kê).
	assert.ok(!d.traiNghiem.some((t) => /bảng/.test(t)));
	const minh = ho["https://kinhlac.online/huyet/than-mon/"].traiNghiem;
	assert.equal(minh.length, 3);
	assert.ok(minh.some((t) => /bảng/.test(t)));
	assert.ok(minh.some((t) => /400 chữ/.test(t)));
});

test("dấu hiệu thắng: cả top 3 có, còn < 50% trang hạng 4–10 có", () => {
	const bd = dungBanDo(VAO);
	// Trang 5 có trả lời ở đầu + tác giả → 1/2 = 50%, không đạt; bảng, nguồn ngoài, mới cập nhật đạt.
	assert.equal(bd.dauHieuThang.length, 3);
	assert.ok(bd.dauHieuThang.some((t) => /bảng/.test(t)));
	assert.ok(bd.dauHieuThang.some((t) => /nguồn/.test(t)));
	assert.ok(bd.dauHieuThang.some((t) => /cập nhật/i.test(t)));
	assert.ok(!bd.dauHieuThang.some((t) => /tác giả/.test(t)));
	// Không đủ 3 trang top thì không kết luận.
	assert.deepEqual(dungBanDo({ ...VAO, trang: TRANG.filter((t) => t.thuTu !== 2) }).dauHieuThang, []);
});

test("phiếu cho trang mình", () => {
	const { phieu } = dungBanDo(VAO);
	assert.equal(phieu.themY.length, 2);
	assert.ok(phieu.themY.includes("Lưu ý"));
	// Ý cốt lõi mang tính chữa trị được ghi chú phạm vi Y sỹ.
	assert.ok(phieu.themY.includes("Tác dụng chữa mất ngủ (diễn đạt theo phạm vi Y sỹ)"));
	assert.deepEqual(phieu.cat, ["Đoạn mở đầu kể chuyện không liên quan", "Lịch sử tên gọi"]);
	assert.equal(phieu.duaTraLoiLenDau, true);
	assert.equal(phieu.traiNghiem.length, 3);
	assert.ok(phieu.taiSanRieng.some((t) => t.includes("/huyet/than-mon/") && /3D/.test(t)));
	// Không có chỉ mục thì không bịa tài sản.
	assert.deepEqual(dungBanDo({ ...VAO, chiMuc: undefined }).phieu.taiSanRieng, []);
	// Trang mình trả lời muộn nhưng top 3 cũng không trả lời ở đầu → không đòi đưa lên.
	const khongDau = TRANG.map((t) => (t.thuTu <= 2 ? { ...t, cauTraLoiO: "giua" } : t));
	assert.equal(dungBanDo({ ...VAO, trang: khongDau }).phieu.duaTraLoiLenDau, false);
});

test("KHÔNG mục nào dựa trên độ dài: đổi số chữ/chữ thân bài của mọi trang, kết quả y hệt", () => {
	const goc = dungBanDo(VAO);
	for (const heSo of [0, 0.01, 100]) {
		const doi = TRANG.map((t, i) => ({
			...t,
			soDo: { ...t.soDo, soChu: Math.round((t.soDo.soChu || 1) * heSo * (i + 1)), chu: "x ".repeat(i * 50) },
		}));
		assert.deepEqual(dungBanDo({ ...VAO, trang: doi }), goc);
	}
	const chu = JSON.stringify(goc).normalize("NFC").toLowerCase();
	for (const cam of ["dài hơn", "viết dài", "viết thêm chữ", "số chữ", "độ dài", "tăng độ dài", "longer", "word count"])
		assert.ok(!chu.includes(cam), `phiếu không được khuyên "${cam}"`);
});

test("không có trang mình: phiếu rỗng, không ném lỗi", () => {
	const bd = dungBanDo({ ...VAO, trang: TRANG.filter((t) => !t.laMinh) });
	assert.deepEqual(bd.phieu, { themY: [], duaTraLoiLenDau: false, cat: [], traiNghiem: [], taiSanRieng: [] });
	assert.equal(bd.yCotLoi.length, 4);
});
