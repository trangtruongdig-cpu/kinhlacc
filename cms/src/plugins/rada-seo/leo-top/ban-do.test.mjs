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

test("gom ý: bỏ hư từ + từ của từ khoá, so bao hàm ≥ 0,6; ý một từ so đẳng thức", () => {
	const TK = { tuKhoa: "huyệt thần môn" };
	const nhom = gomY(["Vị trí huyệt Thần Môn", "vị trí huyệt", "Cách bấm huyệt", "cách bấm", "Lưu ý khi bấm", "lưu ý", "Mệnh", "mệnh", "Mệnh cung"], TK);
	const tim = (s) => nhom.findIndex((n) => n.includes(s));
	assert.equal(tim("Vị trí huyệt Thần Môn"), tim("vị trí huyệt"));
	assert.equal(tim("Cách bấm huyệt"), tim("cách bấm"));
	assert.notEqual(tim("Vị trí huyệt Thần Môn"), tim("Cách bấm huyệt"));
	assert.equal(tim("Lưu ý khi bấm"), tim("lưu ý")); // {luu, y, bam} ⊇ {luu, y}
	assert.equal(tim("Mệnh"), tim("mệnh"));
	assert.notEqual(tim("Mệnh"), tim("Mệnh cung"));
});

test("gom ý: các cách viết thật của cùng một ý về một nhóm", () => {
	const cung = (ds, tuKhoa) => assert.equal(gomY(ds, { tuKhoa }).length, 1, ds.join(" | "));
	cung(["vị trí huyệt", "vị trí của huyệt", "cách xác định vị trí huyệt"], "huyệt thần môn");
	cung(["tác dụng", "tác dụng của huyệt"], "huyệt thần môn");
	cung(["lưu ý khi bấm", "những lưu ý"], "huyệt thần môn");
});

test("gom ý: các mục của một bài thuốc KHÔNG bị gom chung (từ của tên bài bị bỏ trước khi so)", () => {
	const nhom = gomY(["Thành phần", "Cách dùng", "Lưu ý khi dùng"], { tuKhoa: "bài thuốc Lục Vị Địa Hoàng Hoàn" });
	assert.equal(nhom.length, 3);
});

test("gom ý: so với ĐẠI DIỆN nhóm, không bắc cầu", () => {
	// A ⊂ B, C ⊂ B, nhưng A ∩ C chỉ 1/3 → A và C không được chung nhóm qua cầu B.
	const nhom = gomY(["rễ thân cành", "rễ thân cành hoa quả", "cành hoa quả"], { tuKhoa: "" });
	const tim = (s) => nhom.findIndex((n) => n.includes(s));
	assert.equal(tim("rễ thân cành"), tim("rễ thân cành hoa quả"));
	assert.notEqual(tim("rễ thân cành"), tim("cành hoa quả"));
});

test("đầu-cuối: đối thủ 'Vị trí huyệt' ×4, trang mình 'Vị trí của huyệt' → không đòi thêm, không đòi cắt", () => {
	const vao = {
		tuKhoa: "huyệt thần môn",
		now: NOW,
		trang: [
			...[1, 2, 3, 4].map((i) => trang(`https://d${i}.vn/`, i, ["Vị trí huyệt"], TOT)),
			trang("https://kinhlac.online/huyet/than-mon/", 9, ["Vị trí của huyệt"], TOT, { laMinh: true }),
		],
	};
	const { phieu, yCotLoi } = dungBanDo(vao);
	assert.equal(yCotLoi.length, 1);
	assert.deepEqual(phieu.themY, []);
	assert.deepEqual(phieu.cat, []);
	assert.deepEqual(phieu.khacBiet, []);
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

test("ý thừa ≤ 20% (đủ 5 trang đối thủ); ý CHỈ trang mình có là khác biệt — giữ, không phải thừa", () => {
	const bd = dungBanDo(VAO);
	assert.deepEqual(bd.yThua.map((y) => y.ten), ["Phong thuỷ"]);
	assert.equal(bd.yThua[0].tiLe, 0.2);
	assert.deepEqual(bd.yThua[0].trangCo, ["https://d.vn/4"]);
	assert.deepEqual(bd.phieu.khacBiet, ["Lịch sử tên gọi"]);
	assert.ok(!bd.phieu.cat.includes("Lịch sử tên gọi"));
	assert.deepEqual(bd.ghiChu, []);
});

test("dưới 5 trang đối thủ: không kết luận ý thừa, ghi chú lý do", () => {
	const bd = dungBanDo({ ...VAO, trang: TRANG.filter((t) => t.thuTu !== 5) });
	assert.deepEqual(bd.yThua, []);
	assert.equal(bd.ghiChu.length, 1);
	assert.match(bd.ghiChu[0], /4 trang đối thủ/);
	// Trang mình có ý hiếm cũng không bị đòi cắt khi chưa đủ căn cứ.
	const t2 = TRANG.filter((t) => t.thuTu !== 5).map((t) => (t.laMinh ? { ...t, y: [...t.y, "Phong thuỷ"] } : t));
	assert.ok(!dungBanDo({ ...VAO, trang: t2 }).phieu.cat.includes("Phong thuỷ"));
	// Đủ 5 trang thì ý hiếm trang mình có (và 1 đối thủ có) mới vào mục cắt.
	const t3 = TRANG.map((t) => (t.laMinh ? { ...t, y: [...t.y, "Phong thuỷ"] } : t));
	assert.ok(dungBanDo({ ...VAO, trang: t3 }).phieu.cat.includes("Phong thuỷ"));
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
	// "Tác dụng chữa mất ngủ" vượt phạm vi Y sỹ → không vào themY, chỉ ghi chú cách diễn đạt.
	assert.deepEqual(phieu.themY, ["Lưu ý"]);
	assert.equal(phieu.ghiChu.length, 1);
	assert.match(phieu.ghiChu[0], /Tác dụng chữa mất ngủ/);
	assert.match(phieu.ghiChu[0], /hỗ trợ/);
	assert.deepEqual(phieu.cat, ["Đoạn mở đầu kể chuyện không liên quan"]);
	assert.deepEqual(phieu.khacBiet, ["Lịch sử tên gọi"]);
	assert.equal(phieu.duaTraLoiLenDau, true);
	assert.equal(phieu.traiNghiem.length, 3);
	// Trang mình CHÍNH LÀ trang huyệt Thần Môn → không tự gợi ý liên kết tới chính nó (xem phép riêng bên dưới).
	assert.ok(!phieu.taiSanRieng.some((t) => t.includes("(/huyet/than-mon/)")));
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
	assert.deepEqual(bd.phieu, { themY: [], duaTraLoiLenDau: false, cat: [], khacBiet: [], traiNghiem: [], boSungCanCu: [], taiSanRieng: [], ghiChu: [] });
	assert.equal(bd.yCotLoi.length, 4);
});

test("ý điều trị/chủ trị (thuật ngữ chuẩn) vẫn vào themY kèm nhắc phạm vi", () => {
	const t = TRANG.map((x) => (x.laMinh ? x : { ...x, y: [...x.y, "Chủ trị"] }));
	assert.ok(dungBanDo({ ...VAO, trang: t }).phieu.themY.includes("Chủ trị (diễn đạt theo phạm vi Y sỹ)"));
});

test("thiếu căn cứ: vào soHo từng trang, của trang mình vào phiếu boSungCanCu", () => {
	const t = TRANG.map((x) =>
		x.laMinh ? { ...x, thieuCanCu: ["Bấm 5 phút mỗi ngày hết mất ngủ", " "] } : x.thuTu === 1 ? { ...x, thieuCanCu: ["Liều 10g"] } : x,
	);
	const bd = dungBanDo({ ...VAO, trang: t });
	const ho = Object.fromEntries(bd.soHo.map((s) => [s.url, s]));
	assert.deepEqual(ho["https://a.vn/1"].thieuCanCu, ["Liều 10g"]);
	assert.deepEqual(ho["https://b.vn/2"].thieuCanCu, []);
	assert.deepEqual(bd.phieu.boSungCanCu, ["Bấm 5 phút mỗi ngày hết mất ngủ"]);
});

test("trả lời muộn của trang mình: chỉ kết luận khi Claude và số đo cùng nói muộn (hoặc Claude không báo)", () => {
	const voi = (cauTraLoiO, viTriTraLoi) =>
		dungBanDo({ ...VAO, trang: TRANG.map((x) => (x.laMinh ? { ...x, cauTraLoiO, soDo: { ...x.soDo, viTriTraLoi } } : x)) }).phieu;
	// Số đo 400 chữ nhưng Claude đọc thấy trả lời ở đầu (số đo vướng mục lục lạ) → không đòi.
	assert.equal(voi("dau", 400).duaTraLoiLenDau, false);
	assert.ok(!voi("dau", 400).traiNghiem.some((t) => /muộn|trả lời thẳng/.test(t)));
	// Claude nói giữa bài nhưng số đo thấy ở chữ thứ 20 → hai tín hiệu lệch → không kết luận.
	assert.equal(voi("giua", 20).duaTraLoiLenDau, false);
	// Cùng nói muộn → đòi.
	assert.equal(voi("giua", 400).duaTraLoiLenDau, true);
	// Claude không báo → theo số đo.
	assert.equal(voi(undefined, 400).duaTraLoiLenDau, true);
	assert.equal(voi(undefined, 20).duaTraLoiLenDau, false);
});

test("cat bỏ mục khuyên độ dài nhưng GIỮ đoạn rườm vượt phạm vi Y sỹ (đó chính là đoạn phải cắt); themY bỏ ý khuyên độ dài", () => {
	const t = TRANG.map((x) =>
		x.laMinh
			? { ...x, ruom: ["Đoạn mở đầu kể chuyện không liên quan", "Cần viết dài hơn phần vị trí", "Thêm chữ cho phần tác dụng", "Đoạn hứa chữa khỏi hẳn mất ngủ"] }
			: { ...x, y: [...x.y, "Viết dày phần lịch sử"] },
	);
	const { phieu } = dungBanDo({ ...VAO, trang: t });
	assert.deepEqual(phieu.cat, ["Đoạn mở đầu kể chuyện không liên quan", "Đoạn hứa chữa khỏi hẳn mất ngủ"]);
	assert.ok(!phieu.themY.some((y) => /dày/.test(y)));
});

test("ruom: chỉ lọc bốn kiểu khuyên độ dài; đoạn 'chữa khỏi hẳn', 'cam kết 100%' vẫn vào cat", () => {
	const ruom = ["Mở bài dài hơn cần thiết", "Nên thêm chữ", "Số chữ quá ít", "Viết dày thêm", "Khẳng định chữa khỏi hẳn", "Cam kết khỏi 100%"];
	const t = TRANG.map((x) => (x.laMinh ? { ...x, ruom } : x));
	assert.deepEqual(dungBanDo({ ...VAO, trang: t }).phieu.cat, ["Khẳng định chữa khỏi hẳn", "Cam kết khỏi 100%"]);
});

test("tài sản riêng không trỏ về chính trang mình", () => {
	const minh = TRANG.find((t) => t.laMinh);
	const tai = dungBanDo(VAO).phieu.taiSanRieng;
	assert.ok(!tai.some((x) => x.includes(`(${new URL(minh.url).pathname})`)));
	// Trang mình ở đường khác → tài sản trang huyệt được gợi ý.
	const khac = TRANG.map((t) => (t.laMinh ? { ...t, url: "https://kinhlac.online/blog/mat-ngu/" } : t));
	assert.ok(dungBanDo({ ...VAO, trang: khac }).phieu.taiSanRieng.some((x) => x.includes("/huyet/than-mon/")));
});
