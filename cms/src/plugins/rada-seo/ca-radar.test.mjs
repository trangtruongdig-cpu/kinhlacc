import { test } from "node:test";
import assert from "node:assert/strict";
import { chayCaRadar, xuHuongGanNhat } from "./ca-radar.mjs";
import * as kho from "./kho.mjs";
import { taoKhoGia, webGia } from "./__test__/kho-gia.mjs";

const trang = (tieuDe) => `<html><head><title>${tieuDe}</title></head><body><p>${tieuDe}. Nội dung Đông y đủ dài để phân tích về huyệt vị và kinh lạc.</p></body></html>`;
const BANG = {
	"https://a.vn/sitemap.xml": "<urlset><url><loc>https://a.vn/mat-ngu</loc></url><url><loc>https://a.vn/huyet-ap</loc></url></urlset>",
	"https://a.vn/mat-ngu": trang("Bấm huyệt trị mất ngủ"),
	"https://a.vn/huyet-ap": "<html><head><title>Tăng huyết áp</title></head><body><p>Huyết áp cao là bệnh tim mạch thường gặp ở người lớn tuổi.</p></body></html>",
	"https://b.vn/sitemap.xml": "<urlset><url><loc>https://b.vn/mat-ngu-2</loc></url><url><loc>https://b.vn/het</loc></url></urlset>",
	// Tiêu đề phải có cụm Đông y ("bấm huyệt"): "huyệt" đứng một mình cố ý không tính.
	"https://b.vn/mat-ngu-2": trang("Bấm huyệt trị mất ngủ hiệu quả"),
};
const WEB = webGia(BANG);
const khoiTao = async () => {
	const s = taoKhoGia();
	await kho.luuDoiThu(s, { tenMien: "a.vn" }, "t");
	await kho.luuDoiThu(s, { tenMien: "b.vn" }, "t");
	return s;
};
const nghi = async () => {};

test("chạy thử: chỉ quét + đếm, không ghi URL/cụm, báo trước số trang sẽ trích, vẫn ghi nhật ký", async () => {
	const s = await khoiTao();
	const ca = await chayCaRadar({ s, docWeb: WEB, ghi: false, nghi });
	assert.equal(ca.ghi, false);
	assert.equal(ca.soUrlMoi, 4);
	assert.equal(ca.soSeTrich, 4);
	assert.equal(s.url._m.size, 0);
	assert.equal(s.cum._m.size, 0);
	assert.equal((await kho.dsCa(s)).length, 1);
	const ca1 = await chayCaRadar({ s, docWeb: WEB, ghi: false, tranMoiDoiThu: 1, nghi });
	assert.equal(ca1.soSeTrich, 2);
});

test("chạy thật: trích chữ → 'cho_ai', ngoài ngành & lỗi tải tách riêng, không ai bị gọi", async () => {
	const s = await khoiTao();
	const ca = await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi });
	assert.equal(ca.soTrich, 2);
	assert.equal(ca.soNgoaiNganh, 1);
	assert.equal(ca.soLoiTrang, 1);
	assert.equal(await kho.demChoAi(s), 2);
	const [mot] = await kho.layUrlChoAi(s, 1);
	assert.ok(mot.chu.startsWith("TIÊU ĐỀ: Bấm huyệt trị mất ngủ"));
	// Chưa ai đọc → chưa có khoảng trống.
	assert.equal(ca.soCum, 0);
	// Chạy lại: không còn URL 'cho' → không tải lại trang.
	let taiTrang = 0;
	await chayCaRadar({ s, docWeb: async (u) => {
		if (/^https:\/\/[ab]\.vn\/(?!sitemap|robots)/.test(u)) taiTrang++;
		return BANG[u] ?? "";
	}, ghi: true, nghi });
	assert.equal(taiTrang, 0);
});

test("xu hướng của ca radar gần nhất được lưu để lần tính lại sau dùng", async () => {
	const s = await khoiTao();
	const web = async (u) => (u.startsWith("https://suggestqueries") ? '["q",["bấm huyệt trị mất ngủ"]]' : BANG[u] ?? "");
	await chayCaRadar({ s, docWeb: web, ghi: true, nghi });
	assert.ok((await xuHuongGanNhat(s)).includes("bấm huyệt trị mất ngủ"));
	await chayCaRadar({ s, docWeb: web, ghi: false, nghi });
	assert.ok((await xuHuongGanNhat(s)).length > 0, "ca thử không che xu hướng của ca thật");
});

test("hạn chót đã qua: không trích trang nào, ghi chú vào nhật ký", async () => {
	const s = await khoiTao();
	const ca = await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi, hanChot: Date.now() - 1 });
	assert.equal(ca.soTrich, 0);
	assert.ok(ca.loi.includes("Dừng trích: chạm hạn ca"));
});
