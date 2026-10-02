import { test } from "node:test";
import assert from "node:assert/strict";
import { loiNhacAnhMuc, loiNhacAnhBia, cacMucH2, sinhVaNap, sinhAnhChoBai, CAM } from "./sinh-anh-bai.mjs";

const MD = `Mở đầu bài.

## Điểm chính
- a
- b

## Thể tỳ hư
Người bệnh đại tiện lỏng, ăn kém. Dùng [Bạch truật](/duoc-lieu/23/) để kiện tỳ.

## Khi nào cần tới cơ sở y tế
Mất nước nhiều, sốt cao.`;

test("cacMucH2 cắt đúng các mục, giữ thứ tự", () => {
	assert.deepEqual(cacMucH2(MD).map((m) => m.tieuDe), ["Điểm chính", "Thể tỳ hư", "Khi nào cần tới cơ sở y tế"]);
	assert.match(cacMucH2(MD)[1].noiDung, /kiện tỳ/);
	assert.deepEqual(cacMucH2(""), []);
});

test("lời nhắc mang NỘI DUNG mục, không chỉ tiêu đề", () => {
	// Ảnh chỉ ăn nhập khi model biết đoạn nói gì; đưa mỗi tiêu đề thì ra tranh trang trí.
	const n = loiNhacAnhMuc({ tieuDeBai: "Tiêu chảy theo Đông y", tieuDeMuc: "Thể tỳ hư", noiDung: cacMucH2(MD)[1].noiDung });
	assert.match(n, /Thể tỳ hư/);
	assert.match(n, /đại tiện lỏng/);
	assert.match(n, /Bạch truật/);
	assert.doesNotMatch(n, /\/duoc-lieu\//, "link phải bị bóc, chỉ giữ chữ neo");
});

test("mọi lời nhắc đều CẤM vẽ sơ đồ huyệt và đường kinh", () => {
	// Model không biết huyệt nằm ở đâu; một sơ đồ huyệt sai trông đáng tin hơn là không có ảnh.
	for (const n of [
		loiNhacAnhMuc({ tieuDeBai: "x", tieuDeMuc: "y", noiDung: "z" }),
		loiNhacAnhBia({ tieuDe: "x", moTa: "y" }),
	]) {
		assert.ok(n.includes(CAM));
		assert.match(n, /KHÔNG vẽ: sơ đồ huyệt vị, đường kinh/);
	}
});

test("sinhVaNap: model hỏng thì trả null kèm lý do, KHÔNG ném", async () => {
	const loi = [];
	const r = await sinhVaNap({
		goiModel: { sinhAnh: async () => ({ ok: false, anh: null, loi: "HTTP 429: quota" }) },
		media: { upload: async () => assert.fail("không được nạp khi không có ảnh") },
		loiNhac: "x",
		alt: "a",
		ten: "t",
		ghiLoi: (x) => loi.push(x),
	});
	assert.equal(r, null);
	assert.match(loi[0], /429/);
});

test("sinhVaNap: nạp ảnh thành công trả mediaId", async () => {
	let daNap = null;
	const r = await sinhVaNap({
		goiModel: { sinhAnh: async () => ({ ok: true, anh: { base64: Buffer.from("xyz").toString("base64"), kieu: "image/png" }, loi: "" }) },
		media: { upload: async (ten, kieu, bytes) => ((daNap = { ten, kieu, so: bytes.byteLength }), { mediaId: "m9" }) },
		loiNhac: "x",
		alt: "Ảnh bìa",
		ten: "bai-bia",
	});
	assert.deepEqual(r, { mediaId: "m9", alt: "Ảnh bìa" });
	assert.equal(daNap.ten, "bai-bia.png");
	assert.equal(daNap.kieu, "image/png");
});

test("hết quota ở ảnh bìa thì DỪNG, không đốt thêm lượt gọi cho từng mục", async () => {
	let soGoi = 0;
	const ra = await sinhAnhChoBai({
		goiModel: { sinhAnh: async () => (soGoi++, { ok: false, anh: null, loi: "HTTP 429: quota" }) },
		media: { upload: async () => ({ mediaId: "x" }) },
		tieuDe: "T", moTa: "M", md: MD, nghiMs: 0,
	});
	assert.equal(soGoi, 1, "chỉ gọi một lần rồi dừng");
	assert.equal(ra.bia, null);
	assert.equal(ra.muc.length, 0);
	assert.ok(ra.loi.some((x) => /429/.test(x)));
});

test("bỏ qua mục 'Điểm chính' và tôn trọng trần số mục", async () => {
	const nhac = [];
	const ra = await sinhAnhChoBai({
		goiModel: { sinhAnh: async (n) => (nhac.push(n), { ok: true, anh: { base64: "AA==", kieu: "image/png" }, loi: "" }) },
		media: { upload: async () => ({ mediaId: `m${nhac.length}` }) },
		tieuDe: "T", moTa: "M", md: MD, toiDaMuc: 1, nghiMs: 0,
	});
	assert.equal(ra.bia.mediaId, "m1");
	assert.deepEqual(ra.muc.map((m) => m.tieuDe), ["Thể tỳ hư"], "Điểm chính là danh sách gạch đầu dòng, không cần ảnh");
});

test("thiếu model hoặc thiếu quyền nạp ảnh: nói rõ, không ném", async () => {
	const a = await sinhAnhChoBai({ goiModel: {}, media: { upload: async () => ({}) }, tieuDe: "T", moTa: "M", md: MD });
	assert.match(a.loi[0], /media:write|model sinh ảnh/);
	const b = await sinhAnhChoBai({ goiModel: { sinhAnh: async () => ({}) }, media: {}, tieuDe: "T", moTa: "M", md: MD });
	assert.match(b.loi[0], /media:write|model sinh ảnh/);
});

test("hạn TỔNG: hết giờ thì dừng, bài vẫn ra với số ảnh đã có", async () => {
	// Cả khâu ảnh nằm trong khoá nộp bài 5 phút. Không có hạn tổng thì 7 ảnh × 45 s vẫn có thể
	// chạm khoá, và mất khoá giữa chừng là một lượt nộp khác tạo nháp thứ hai cho cùng kế hoạch.
	let t = 0;
	const ra = await sinhAnhChoBai({
		goiModel: { sinhAnh: async () => ((t += 60_000), { ok: true, anh: { base64: "AA==", kieu: "image/png" }, loi: "" }) },
		media: { upload: async () => ({ mediaId: `m${t}` }) },
		tieuDe: "T", moTa: "M",
		md: "## A\nx\n\n## B\ny\n\n## C\nz",
		nghiMs: 0,
		hanTongMs: 90_000,
		now: () => t,
	});
	assert.ok(ra.muc.length < 3, `phải dừng sớm, nhận ${ra.muc.length}/3`);
	assert.ok(ra.loi.some((x) => /hết hạn/.test(x)), "phải nói rõ vì sao dừng");
});
