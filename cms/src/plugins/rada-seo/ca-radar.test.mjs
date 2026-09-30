import { test } from "node:test";
import assert from "node:assert/strict";
import { chayCaRadar } from "./ca-radar.mjs";
import { taoNganSach } from "./lib/claude.mjs";
import * as kho from "./kho.mjs";
import { taoKhoGia, webGia } from "./__test__/kho-gia.mjs";

const trang = (tieuDe) => `<html><head><title>${tieuDe}</title></head><body><p>${tieuDe}. Nội dung Đông y đủ dài để phân tích về huyệt vị và kinh lạc.</p></body></html>`;
const WEB = webGia({
	"https://a.vn/sitemap.xml": "<urlset><url><loc>https://a.vn/mat-ngu</loc></url><url><loc>https://a.vn/huyet-ap</loc></url></urlset>",
	"https://a.vn/mat-ngu": trang("Bấm huyệt trị mất ngủ"),
	"https://a.vn/huyet-ap": "<html><head><title>Tăng huyết áp</title></head><body><p>Huyết áp cao là bệnh tim mạch thường gặp ở người lớn tuổi.</p></body></html>",
	"https://b.vn/sitemap.xml": "<urlset><url><loc>https://b.vn/mat-ngu-2</loc></url></urlset>",
	// Tiêu đề phải có cụm Đông y ("bấm huyệt"): "huyệt" đứng một mình cố ý không tính.
	"https://b.vn/mat-ngu-2": trang("Bấm huyệt trị mất ngủ hiệu quả"),
});
// Claude giả vẫn trừ ngân sách như bản thật (taoClaude trừ trước khi gọi).
const claudeGia = (ns) => ({
	goi: 0,
	async traJson(_s, user) {
		ns.dung();
		this.goi++;
		const t = user.match(/TIÊU ĐỀ: (.*)/)[1];
		return { chu_de: t, tu_khoa: ["bấm huyệt trị mất ngủ", t.toLowerCase()], tom_tat: [] };
	},
});
const khoiTao = async () => {
	const s = taoKhoGia();
	await kho.luuDoiThu(s, { tenMien: "a.vn" }, "t");
	await kho.luuDoiThu(s, { tenMien: "b.vn" }, "t");
	return s;
};
const nghi = async () => {};

test("chạy thử: chỉ quét + đếm, không gọi Claude, không ghi URL/cụm, vẫn ghi nhật ký", async () => {
	const s = await khoiTao();
	const ns = taoNganSach(10);
	const claude = claudeGia(ns);
	const ca = await chayCaRadar({ s, docWeb: WEB, claude, nganSach: ns, ghi: false, nghi });
	assert.equal(ca.ghi, false);
	assert.equal(ca.soUrlMoi, 3);
	assert.equal(claude.goi, 0);
	assert.equal(s.url._m.size, 0);
	assert.equal(s.cum._m.size, 0);
	assert.equal((await kho.dsCa(s)).length, 1);
	// Xem trước: a.vn 2 mới + b.vn 1 mới, trần 30 → 3.
	assert.equal(ca.soSePhanTich, 3);
	// Trần 1 mỗi đối thủ → 1 + 1 = 2.
	const ca1 = await chayCaRadar({ s, docWeb: WEB, claude, nganSach: ns, ghi: false, tranMoiDoiThu: 1, nghi });
	assert.equal(ca1.soSePhanTich, 2);
});

test("chạy thật: phân tích, lọc ngoài ngành không tốn lượt, ra khoảng trống 2 đối thủ", async () => {
	const s = await khoiTao();
	const ns = taoNganSach(10);
	const claude = claudeGia(ns);
	const ca = await chayCaRadar({ s, docWeb: WEB, claude, nganSach: ns, ghi: true, nghi });
	assert.equal(ca.soPhanTich, 2);
	assert.equal(ca.soNgoaiNganh, 1);
	assert.equal(ca.soLuotGoi, 2);
	assert.equal(claude.goi, 2);
	const cum = await kho.dsCum(s);
	assert.equal(cum[0].soDoiThu, 2);
	assert.equal(cum[0].trangThai, "cho_viet");
	// Chạy lại: không còn URL chờ → không gọi thêm.
	await chayCaRadar({ s, docWeb: WEB, claude, nganSach: ns, ghi: true, nghi });
	assert.equal(claude.goi, 2);
});

test("hết ngân sách: dừng gọi, ghi lỗi vào nhật ký, vẫn tính khoảng trống", async () => {
	const s = await khoiTao();
	const ns = taoNganSach(1);
	const ca = await chayCaRadar({ s, docWeb: WEB, claude: claudeGia(ns), nganSach: ns, ghi: true, nghi });
	assert.equal(ca.soPhanTich, 1);
	assert.ok(ca.loi.some((l) => l.includes("Hết ngân sách")));
	assert.equal((await kho.dsCa(s))[0].soLuotGoi, 1);
});
