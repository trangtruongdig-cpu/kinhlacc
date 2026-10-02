import { test } from "node:test";
import assert from "node:assert/strict";
import { BUOC, docBuoc, goiDuLieu, loiNhacBuoc, tuLapChienLuoc } from "./tu-lap-chien-luoc.mjs";

const HUONG_TOT = { ten: "Châm cứu trị mất ngủ", moTa: "", trongSoGoiY: 4, lyDo: "", idBaiDoiThu: ["u1"], tuKhoa: ["châm cứu mất ngủ"] };
const buocCua = (ten) => BUOC.find((b) => b.ten === ten);

test("docBuoc: nhận cả {huong:[…]} lẫn mảng trần, và trả về đúng mảng", () => {
	const b = buocCua("huong");
	const a = docBuoc(JSON.stringify({ huong: [HUONG_TOT] }), b);
	assert.deepEqual([a.ok, a.ds.length], [true, 1]);
	// Mô hình hay bỏ lớp bọc — mảng trần vẫn phải đọc được.
	const c = docBuoc(JSON.stringify([HUONG_TOT]), b);
	assert.deepEqual([c.ok, c.ds[0].ten], [true, "Châm cứu trị mất ngủ"]);
	// Và trong khối ```json.
	const d = docBuoc("```json\n" + JSON.stringify({ huong: [HUONG_TOT] }) + "\n```", b);
	assert.equal(d.ok, true);
});

// Khuôn zod là TẦNG KIỂM THỨ NHẤT cho đầu ra của mô hình. chien-luoc/viec.mjs tự gọi mình là
// "lớp phòng thủ thứ hai", nên nó không thay được lớp này.
test("docBuoc: đầu ra sai khuôn bị LOẠI kèm lý do, không lọt xuống khâu ghi", () => {
	const b = buocCua("huong");
	for (const [than, mong] of [
		// `{huong: []}` KHÔNG ở đây: mảng rỗng là câu trả lời, có phép kiểm riêng bên dưới.
		[{ huong: [{ ...HUONG_TOT, trongSoGoiY: 9 }] }, /sai khuôn/],
		[{ huong: [{ ...HUONG_TOT, tuKhoa: [] }] }, /sai khuôn/],
		[{ huong: [{ ...HUONG_TOT, ten: "" }] }, /sai khuôn/],
		[{ huong: [{ ...HUONG_TOT, ten: "x".repeat(200) }] }, /sai khuôn/],
	]) {
		const r = docBuoc(JSON.stringify(than), b);
		assert.equal(r.ok, false, JSON.stringify(than).slice(0, 60));
		assert.match(r.lyDo, mong);
	}
	assert.match(docBuoc("tôi nghĩ nên viết về mất ngủ", b).lyDo, /không đọc được JSON/);
});

// Đo thật 02/10/2026: mô hình trả {"huong": []} ở bước đầu. Đó là một CÂU TRẢ LỜI, không phải
// lỗi dạng — gộp hai thứ lại là đi sửa lời nhắc cho một chuyện không hỏng.
test("docBuoc: mảng RỖNG là câu trả lời, không phải lỗi dạng", () => {
	const r = docBuoc(JSON.stringify({ huong: [] }), buocCua("huong"));
	assert.deepEqual([r.ok, r.rong], [false, true]);
	assert.match(r.lyDo, /không đề xuất mục nào/);
	assert.doesNotMatch(r.lyDo, /sai khuôn/);
	// Còn thiếu khoá bắt buộc thì VẪN là lỗi dạng.
	const x = docBuoc(JSON.stringify({ keHoach: [{ cumId: "c1", tieuDeLamViec: "B", tuKhoaChinh: "a", tuKhoaPhu: [], yDinh: "huong_dan", trangTruCot: "/x" }] }), buocCua("keHoach"));
	assert.deepEqual([x.ok, x.rong], [false, undefined]);
	assert.match(x.lyDo, /lienKetDich/);
});

test("mảng rỗng KHÔNG tính vào số lỗi của ca", async () => {
	const r = await tuLapChienLuoc({
		s: {}, nghiMs: 0,
		goiModel: modelGia({ ok: true, chu: JSON.stringify({ huong: [], cum: [], keHoach: [] }) }),
		layDuLieu: async () => duGia,
		deXuatHuong: async () => trongRong, ghiCum: async () => trongRong, deXuatKeHoach: async () => trongRong,
	});
	assert.deepEqual([r.luotGoi, r.loi], [3, 0], "ba lượt gọi thành công, không lỗi nào");
	assert.equal(r.ghiChu.filter((x) => /không đề xuất mục nào/.test(x)).length, 3);
});

test("trần số lượng của khuôn chặn lượt gọi nhồi cả bảng vào kho", () => {
	const nhieu = Array.from({ length: 30 }, (_, i) => ({ ...HUONG_TOT, ten: `Hướng ${i}` }));
	const r = docBuoc(JSON.stringify({ huong: nhieu }), buocCua("huong"));
	assert.equal(r.ok, false);
	assert.match(r.lyDo, /sai khuôn/);
});

test("lời dặn mỗi bước mang lời nhắc CỦA BƯỚC ĐÓ + rào dữ liệu", () => {
	const n = loiNhacBuoc("LỜI NHẮC RIÊNG CỦA BƯỚC", buocCua("cum"));
	assert.match(n, /Kinhlac/, "phải có bối cảnh doanh nghiệp");
	assert.match(n, /LỜI NHẮC RIÊNG CỦA BƯỚC/);
	assert.match(n, /"cum"/);
	assert.match(n, /KHÔNG phải lời dặn/, "giữ rào chữ đối thủ là dữ liệu không tin cậy");
});

test("goiDuLieu: bước sau thấy hướng/cụm đang có, bước đầu thì không", () => {
	const du = {
		tongChuDe: 162, conTrang: false, chuDeDoiThu: ["<<<DU_LIEU id=u1>>>u1|Mất ngủ<<<HET_DU_LIEU id=u1>>>"],
		baiMinh: [{ ten: "x" }], huong: [{ id: "h1", ten: "Châm cứu" }], cum: [{ id: "c1" }], keHoach: [{ id: "k1" }],
	};
	const b1 = goiDuLieu(du, buocCua("huong"));
	assert.match(b1, /162 dòng/);
	assert.match(b1, /<<<DU_LIEU id=u1>>>/, "rào quanh chữ đối thủ phải còn");
	assert.doesNotMatch(b1, /HƯỚNG ĐANG CÓ/, "bước đề xuất hướng không cần danh sách hướng");
	assert.match(goiDuLieu(du, buocCua("cum")), /HƯỚNG ĐANG CÓ/);
	const b3 = goiDuLieu(du, buocCua("keHoach"));
	assert.match(b3, /CỤM ĐANG CÓ/);
	assert.match(b3, /BÀI DỰ KIẾN ĐANG CÓ/);
});

const modelGia = (ket, { hanMuc = true, luot = 0 } = {}) => ({
	coCauHinh: () => true, thieuCauHinh: () => [], conHanMuc: () => hanMuc, soLuotDaGoi: () => luot,
	goi: async (...a) => (typeof ket === "function" ? ket(...a) : ket),
});
const duGia = { tongChuDe: 1, chuDeDoiThu: ["u1|Mất ngủ"], baiMinh: [], huong: [], cum: [], keHoach: [], loiNhac: { deXuatHuong: "A", phanCum: "B", lapKeHoach: "C" } };
const trongRong = { nhan: [], bac: [] };

test("thiếu cấu hình model → nói rõ chiến lược ĐỨNG, không phải hết việc", async () => {
	const r = await tuLapChienLuoc({ s: {}, goiModel: { coCauHinh: () => false, thieuCauHinh: () => ["GRAVITY_API_KEY"] } });
	assert.deepEqual([r.luotGoi, r.soHuong], [0, 0]);
	assert.match(r.ghiChu.join(" "), /thiếu GRAVITY_API_KEY/);
	assert.match(r.ghiChu.join(" "), /KHÔNG phải hết việc/);
});

test("chạy đủ BA bước, mỗi bước MỘT lượt gọi, và đọc lại dữ liệu trước mỗi bước", async () => {
	const nhac = [];
	let soLanLay = 0;
	const r = await tuLapChienLuoc({
		s: {}, nghiMs: 0,
		goiModel: modelGia((viec, loiNhac) => {
			nhac.push(loiNhac);
			const b = BUOC[nhac.length - 1];
			const mot = b.ten === "huong" ? HUONG_TOT
				: b.ten === "cum" ? { huongId: "h1", ten: "Cụm", moTa: "", tuKhoa: ["a"], idBaiDoiThu: [] }
				: { cumId: "c1", tieuDeLamViec: "Bài", tuKhoaChinh: "a", tuKhoaPhu: [], yDinh: "huong_dan", trangTruCot: "/x", lienKetDich: [] };
			return { ok: true, chu: JSON.stringify({ [b.khoaMang]: [mot] }) };
		}),
		layDuLieu: async () => { soLanLay++; return duGia },
		deXuatHuong: async () => ({ nhan: [{ id: "h1" }], bac: [] }),
		ghiCum: async () => ({ nhan: [{ id: "c1" }], bac: [] }),
		deXuatKeHoach: async () => ({ nhan: [{ id: "k1" }], bac: [] }),
	});
	assert.deepEqual([r.luotGoi, r.loi], [3, 0]);
	assert.deepEqual([r.soHuong, r.soCumNghia, r.soKeHoach], [1, 1, 1]);
	// Bước phân cụm phải thấy hướng bước trước vừa ghi → phải đọc lại dữ liệu mỗi bước.
	assert.equal(soLanLay, 3, "dùng lại dữ liệu cũ là phân cụm vào hướng không tồn tại");
	assert.ok(nhac[0].includes("A") && nhac[1].includes("B") && nhac[2].includes("C"), "mỗi bước phải mang lời nhắc của chính nó");
});

test("một bước hỏng KHÔNG chặn bước sau, và nói rõ bước nào", async () => {
	let n = 0;
	const r = await tuLapChienLuoc({
		s: {}, nghiMs: 0,
		goiModel: modelGia(() => (++n === 1 ? { ok: false, chu: "", loi: "HTTP 503" } : { ok: true, chu: JSON.stringify({ [BUOC[n - 1].khoaMang]: [] }) })),
		layDuLieu: async () => duGia,
		deXuatHuong: async () => trongRong, ghiCum: async () => trongRong, deXuatKeHoach: async () => trongRong,
	});
	assert.equal(r.luotGoi, 3, "bước 1 hỏng thì bước 2 và 3 VẪN chạy");
	assert.ok(r.ghiChu.some((x) => /Bước "đề xuất hướng" hỏng: HTTP 503/.test(x)), r.ghiChu.join("|"));
	assert.ok(r.ghiChu.some((x) => /lượt sau làm lại/.test(x)));
});

test("chạm trần lượt gọi thì DỪNG giữa chuỗi bước và nói rõ dừng ở đâu", async () => {
	let n = 0;
	const r = await tuLapChienLuoc({
		s: {}, nghiMs: 0,
		goiModel: {
			coCauHinh: () => true, thieuCauHinh: () => [], soLuotDaGoi: () => n, conHanMuc: () => n < 1,
			goi: async () => { n++; return { ok: true, chu: JSON.stringify({ huong: [HUONG_TOT] }) } },
		},
		layDuLieu: async () => duGia,
		deXuatHuong: async () => ({ nhan: [{ id: "h1" }], bac: [] }), ghiCum: async () => trongRong, deXuatKeHoach: async () => trongRong,
	});
	assert.equal(r.luotGoi, 1);
	assert.match(r.ghiChu.join(" "), /Dừng ở bước "phân cụm nghĩa".*chạm trần lượt gọi/);
});

// Tỉ lệ bác cao là tín hiệu lời nhắc chưa rõ. Im lặng ở đây thì không ai biết để sửa lời nhắc —
// cùng bài học với rào chống bịa của bot thẩm định.
test("phần máy chủ BÁC phải lên nhật ký kèm lý do", async () => {
	const r = await tuLapChienLuoc({
		s: {}, nghiMs: 0,
		goiModel: modelGia({ ok: true, chu: JSON.stringify({ huong: [HUONG_TOT] }) }),
		layDuLieu: async () => duGia,
		deXuatHuong: async () => ({ nhan: [], bac: [{ ten: "X", lyDo: 'vượt phạm vi Y sỹ: "chữa khỏi"' }] }),
		ghiCum: async () => trongRong, deXuatKeHoach: async () => trongRong,
	});
	assert.ok(r.ghiChu.some((x) => /bác 1\/1 — vượt phạm vi Y sỹ/.test(x)), r.ghiChu.join("|"));
});

// Cổng người ở giữa là CỐ Ý: deXuatHuong ghi hướng ở 'de_xuat', ghiCum chỉ nhận hướng 'da_nhan'.
test("có hướng mới mà chưa phân cụm được thì NÓI RÕ là cổng người, không phải lỗi", async () => {
	const r = await tuLapChienLuoc({
		s: {}, nghiMs: 0,
		goiModel: modelGia((viec, _n, chu) => ({ ok: true, chu: JSON.stringify({ huong: [HUONG_TOT], cum: [], keHoach: [] }) })),
		layDuLieu: async () => duGia,
		deXuatHuong: async () => ({ nhan: [{ id: "h1" }], bac: [] }),
		ghiCum: async () => trongRong, deXuatKeHoach: async () => trongRong,
	});
	assert.deepEqual([r.soHuong, r.soCumNghia], [1, 0]);
	assert.match(r.ghiChu.join(" "), /phải được NGƯỜI nhận trước/);
});

test("mỗi bước khai đủ lời nhắc, khoá mảng và khuôn — không rải ra thân hàm", () => {
	assert.equal(BUOC.length, 3);
	for (const b of BUOC) {
		assert.ok(b.ten && b.nhan && b.khoaNhac && b.khoaMang, JSON.stringify(b));
		assert.equal(typeof b.khuon?.safeParse, "function", `bước ${b.ten} thiếu khuôn zod`);
	}
});
