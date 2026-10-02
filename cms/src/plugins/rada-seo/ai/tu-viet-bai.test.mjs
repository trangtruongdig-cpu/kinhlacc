import { test } from "node:test";
import assert from "node:assert/strict";
import { chayLoViet, vietMotBai, nhacSuaLoi } from "./tu-viet-bai.mjs";

const BAI = {
	keHoachId: "k1",
	tieuDeLamViec: "Chảy máu cam theo Đông y",
	khuonBai: "KHUÔN BÀI",
	hoSoCum: { soBaiThuoc: 55 },
	soLanNopConLai: 3,
};
const JSON_BAI = JSON.stringify({ tieuDe: "T", moTa: "M", md: "## A", tuKhoa: ["x"], faq: [], nguon: [] });
const modelGia = (traLoi) => {
	let i = 0;
	return {
		coCauHinh: () => true,
		thieuCauHinh: () => [],
		soLuotDaGoi: () => i,
		modelCua: () => "model-gia",
		goi: async () => {
			const r = traLoi[Math.min(i, traLoi.length - 1)];
			i++;
			return r;
		},
	};
};

test("viết đạt ngay lượt đầu", async () => {
	const kq = await vietMotBai({
		bai: BAI,
		goiModel: modelGia([{ ok: true, chu: JSON_BAI, loi: "" }]),
		nopMot: async () => ({ daTao: true, contentId: "c1", adminUrl: "/x" }),
	});
	assert.equal(kq.daTao, true);
	assert.equal(kq.soLuot, 1);
	assert.equal(kq.contentId, "c1");
});

test("bị trả lỗi thì SỬA rồi nộp lại, không bỏ cuộc ngay", async () => {
	// Đo thật 02/10/2026: lượt đầu của model trượt "chuyên trị" và "tận gốc". Vòng sửa là phần
	// chịu lực của lò viết, không phải phần thêm thắt.
	const hoiThoaiDaGui = [];
	const model = {
		coCauHinh: () => true,
		thieuCauHinh: () => [],
		soLuotDaGoi: () => hoiThoaiDaGui.length,
		goi: async (_v, _nhac, _chu, opt) => {
			hoiThoaiDaGui.push(opt?.hoiThoai ?? []);
			return { ok: true, chu: JSON_BAI, loi: "" };
		},
	};
	let lan = 0;
	const kq = await vietMotBai({
		bai: BAI,
		goiModel: model,
		nopMot: async () => (++lan === 1 ? { daTao: false, loi: [{ ma: "pham_vi_tri", ghiChu: '"trị" trong câu X' }] } : { daTao: true, contentId: "c2" }),
	});
	assert.equal(kq.daTao, true);
	assert.equal(kq.soLuot, 2);
	// Lượt hai phải là HỘI THOẠI THẬT: user (dữ liệu) → assistant (bản cũ) → user (lỗi). Gộp hết
	// vào một `user` thì model tưởng phải viết tiếp văn bản cũ và trả về thứ không phải JSON
	// (đo 02/10/2026: lượt sửa 2 và 3 đều hỏng vì vậy).
	const lan2 = hoiThoaiDaGui[1];
	assert.equal(lan2.length, 3);
	assert.deepEqual(lan2.map((m) => m.role), ["user", "assistant", "user"]);
	assert.match(lan2[2].content, /pham_vi_tri/);
	assert.match(lan2[2].content, /Sửa ĐÚNG những lỗi sau/);
});

test("hết lượt mà vẫn trượt: trả daTao false kèm lỗi từng lượt", async () => {
	const kq = await vietMotBai({
		bai: { ...BAI, soLanNopConLai: 2 },
		goiModel: modelGia([{ ok: true, chu: JSON_BAI, loi: "" }]),
		nopMot: async () => ({ daTao: false, loi: [{ ma: "it_nguon", ghiChu: "cần ít nhất 2 nguồn" }] }),
	});
	assert.equal(kq.daTao, false);
	assert.equal(kq.loi.length, 2);
	assert.match(kq.loi[0], /it_nguon/);
});

test("lỗi 5xx của nhà cung cấp được THỬ LẠI, không tiêu lượt nộp", async () => {
	// 503 "high demand" là chuyện thường của bậc miễn phí — đo hai lượt liên tiếp ngày 02/10/2026.
	const traLoi = [
		{ ok: false, loi: "HTTP 503: high demand", chu: "" },
		{ ok: true, chu: JSON_BAI, loi: "" },
	];
	let soNop = 0;
	const kq = await vietMotBai({
		bai: BAI,
		goiModel: modelGia(traLoi),
		nopMot: async () => (soNop++, { daTao: true, contentId: "c3" }),
		nghiMs: 1,
	});
	assert.equal(kq.daTao, true);
	assert.equal(soNop, 1, "lượt 503 không được tính là một lượt nộp");
});

test("lỗi cấu hình thì KHÔNG thử lại và KHÔNG tiêu lượt nộp", async () => {
	let soGoi = 0;
	const model = {
		coCauHinh: () => true,
		thieuCauHinh: () => [],
		soLuotDaGoi: () => soGoi,
		goi: async () => (soGoi++, { ok: false, loi: "chưa khai model cho tác vụ viet_bai", chu: "" }),
	};
	const kq = await vietMotBai({ bai: BAI, goiModel: model, nopMot: async () => assert.fail("không được nộp"), nghiMs: 1 });
	assert.equal(kq.daTao, false);
	assert.equal(soGoi, 1, "lỗi cấu hình thì thử lại cũng thế");
});

test("model trả lời sai dạng JSON: nhắc lại khuôn, không nộp rác", async () => {
	let soNop = 0;
	const kq = await vietMotBai({
		bai: { ...BAI, soLanNopConLai: 2 },
		goiModel: modelGia([{ ok: true, chu: "xin lỗi tôi không thể", loi: "" }]),
		nopMot: async () => (soNop++, { daTao: true }),
	});
	assert.equal(soNop, 0);
	assert.equal(kq.daTao, false);
	assert.match(kq.loi[0], /không đúng dạng JSON/);
});

test("thiếu cấu hình model: nói rõ thiếu gì, KHÔNG báo 'hết việc'", async () => {
	const ra = await chayLoViet({
		goiModel: { coCauHinh: () => false, thieuCauHinh: () => ["GRAVITY_API_KEY"] },
		layBai: async () => assert.fail("không được lấy bài khi chưa gọi được model"),
		nopMot: async () => ({}),
	});
	assert.equal(ra.soBai, 0);
	assert.match(ra.ghiChu[0], /GRAVITY_API_KEY/);
	assert.match(ra.ghiChu[0], /KHÔNG chạy, không phải hết việc/);
});

test("không có bài được giao: giữ nguyên ghi chú của layBaiCanViet", async () => {
	const ra = await chayLoViet({
		goiModel: modelGia([{ ok: true, chu: JSON_BAI, loi: "" }]),
		layBai: async () => ({ bai: [], ghiChu: "hết hạn ngạch bài đêm nay" }),
		nopMot: async () => ({}),
	});
	assert.deepEqual(ra.ghiChu, ["hết hạn ngạch bài đêm nay"]);
});

test("chayLoViet đếm đúng số bài tạo được và lượt model", async () => {
	const ra = await chayLoViet({
		goiModel: modelGia([{ ok: true, chu: JSON_BAI, loi: "" }]),
		layBai: async () => ({ bai: [BAI, { ...BAI, keHoachId: "k2" }] }),
		nopMot: async (d) => (d.keHoachId === "k1" ? { daTao: true, contentId: "c1" } : { daTao: false, loi: [{ ma: "x", ghiChu: "y" }] }),
		nghiGiuaBaiMs: 0,
	});
	assert.equal(ra.soBai, 2);
	assert.equal(ra.daTao, 1);
	assert.ok(ra.soLuotModel >= 2);
	assert.match(ra.ghiChu[0], /k2/);
});

test("nhacSuaLoi giữ nguyên mã lỗi để model sửa đúng chỗ", () => {
	const n = nhacSuaLoi([{ ma: "pham_vi_hua_khoi", ghiChu: '"tận gốc"' }]);
	assert.match(n, /pham_vi_hua_khoi/);
	assert.match(n, /tận gốc/);
	assert.match(n, /Không thêm liên kết ngoài danh sách/);
});

test("lò viết chết giữa chừng (chưa nộp lần nào) thì TRẢ bài về 'chờ viết', không để kẹt 36 giờ", async () => {
	// Đo 02/10/2026: bài treo "Đang viết" 28 phút vì model hỏng mà nopBai chưa từng chạy, nên
	// không ai trả kế hoạch về — người dùng nhìn mãi một dòng không đổi.
	const daThuHoi = [];
	const ra = await chayLoViet({
		goiModel: modelGia([{ ok: false, loi: "HTTP 503: high demand", chu: "" }]),
		layBai: async () => ({ bai: [BAI] }),
		nopMot: async () => assert.fail("không được nộp khi model hỏng"),
		thuHoi: async (id) => daThuHoi.push(id),
		nghiGiuaBaiMs: 0,
		nghiMs: 1,
	});
	assert.equal(ra.daTao, 0);
	assert.deepEqual(daThuHoi, ["k1"]);
	assert.ok(ra.ghiChu.some((g) => /chờ viết/.test(g)));
});

test("nộp rồi mới trượt thì KHÔNG thu hồi — nopBai đã xử lý lượt nộp đúng cách", async () => {
	const daThuHoi = [];
	await chayLoViet({
		goiModel: modelGia([{ ok: true, chu: JSON_BAI, loi: "" }]),
		layBai: async () => ({ bai: [{ ...BAI, soLanNopConLai: 1 }] }),
		nopMot: async () => ({ daTao: false, loi: [{ ma: "it_nguon", ghiChu: "cần 2 nguồn" }] }),
		thuHoi: async (id) => daThuHoi.push(id),
		nghiGiuaBaiMs: 0,
	});
	assert.deepEqual(daThuHoi, [], "có lượt nộp thì để nopBai quyết, không giành việc của nó");
});
