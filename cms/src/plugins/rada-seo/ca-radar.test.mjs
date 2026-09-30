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

test("sitemap con loại 'bo' của mọi đối thủ ghi vào ca.sitemapBo (cắt 20)", async () => {
	const s = taoKhoGia();
	const bang = {};
	for (const tm of ["a.vn", "b.vn"]) {
		await kho.luuDoiThu(s, { tenMien: tm }, "t");
		const con = Array.from({ length: 12 }, (_, i) => `https://${tm}/bac-si-sitemap${i}.xml`);
		bang[`https://${tm}/sitemap.xml`] = `<sitemapindex>${[...con, `https://${tm}/post-sitemap.xml`].map((u) => `<sitemap><loc>${u}</loc></sitemap>`).join("")}</sitemapindex>`;
		bang[`https://${tm}/post-sitemap.xml`] = `<urlset><url><loc>https://${tm}/bai</loc></url></urlset>`;
	}
	const ca = await chayCaRadar({ s, docWeb: webGia(bang), ghi: false, nghi });
	assert.equal(ca.soUrlMoi, 2);
	assert.equal(ca.sitemapBo.length, 20);
	assert.ok(ca.sitemapBo.includes("https://a.vn/bac-si-sitemap0.xml"));
	assert.ok(ca.sitemapBo.includes("https://b.vn/bac-si-sitemap0.xml"));
	assert.equal((await kho.dsCa(s))[0].sitemapBo.length, 20);
});

test("van hàng chờ: > 80 trang chờ Claude đọc → không trích, vẫn gom URL mới, ghi MỘT dòng", async () => {
	const s = await khoiTao();
	for (let i = 0; i < 81; i++) await s.url.put(`cu${i}`, { doiThuId: "z.vn", url: `https://z.vn/${i}`, trangThai: "cho_ai", chu: "x" });
	let taiTrang = 0;
	const web = async (u) => {
		if (/^https:\/\/[ab]\.vn\/(?!sitemap|robots)/.test(u)) taiTrang++;
		return BANG[u] ?? "";
	};
	const ca = await chayCaRadar({ s, docWeb: web, ghi: true, nghi });
	assert.equal(ca.soTrich, 0);
	assert.equal(taiTrang, 0);
	assert.equal(ca.dungTrich, true);
	assert.equal(ca.soUrlMoi, 4);
	assert.equal(s.url._m.size, 85);
	const dong = ca.loi.filter((l) => l.startsWith("Tạm ngừng trích"));
	assert.deepEqual(dong, ["Tạm ngừng trích: hàng chờ Claude đọc đang 81 trang (> 80)"]);
});

// ---- Đo lại hạng leo top (2D) ----

const MINH = "https://kinhlac.online/huyet/than-mon/";
const LUC = "2026-10-15T20:00:00.000Z"; // ngày sửa 2026-10-01 + 14 ngày
const phienDaSua = async (s, tuKhoa, ngaySua = "2026-10-01") => {
	const p = await kho.taoPhienLeoTop(s, { tuKhoa, trang: MINH, viTri: 9, hienThi: 100 }, "2026-09-30T00:00:00.000Z");
	await s.leo_top.put(p.id, { ...(await s.leo_top.get(p.id)), trangThai: "co_phieu" });
	await kho.datDaSua(s, p.id, ngaySua);
	return p.id;
};
const gscGia = (tra = async () => ({ viTri: 5.5, hienThi: 140 })) => {
	const goi = [];
	return { goi, coCauHinh: () => true, async layViTri(q) { goi.push(q); return tra(q); } };
};

test("đo lại leo top: phiên da_sua tới mốc +14 → gọi GSC đúng cặp, ghi doLai; ca sau không đo lặp", async () => {
	const s = taoKhoGia();
	const id = await phienDaSua(s, "huyệt thần môn");
	await phienDaSua(s, "chưa tới hạn", "2026-10-10");
	const gsc = gscGia();
	const ca = await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi, gsc, now: () => LUC });
	assert.deepEqual(gsc.goi, [{ tuKhoa: "huyệt thần môn", trang: MINH, ngay: 14 }]);
	assert.equal(ca.soDoLai, 1);
	const d = await s.leo_top.get(id);
	assert.deepEqual(d.doLai, [{ ngay: "2026-10-15", sauNgay: 14, viTri: 5.5, hienThi: 140 }]);
	assert.equal(d.trangThai, "da_sua");
	await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi, gsc, now: () => LUC });
	assert.equal(gsc.goi.length, 1, "mốc 14 đã đo → không gọi lại");
	// Mốc 28 → xong.
	await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi, gsc, now: () => "2026-10-29T20:00:00.000Z" });
	assert.equal((await s.leo_top.get(id)).trangThai, "xong");
});

test("đo lại leo top: GSC không có số liệu → vẫn ghi mốc (viTri null) để không hỏi lại mỗi đêm", async () => {
	const s = taoKhoGia();
	const id = await phienDaSua(s, "huyệt thần môn");
	await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi, gsc: gscGia(async () => null), now: () => LUC });
	assert.deepEqual((await s.leo_top.get(id)).doLai, [{ ngay: "2026-10-15", sauNgay: 14, viTri: null, hienThi: 0 }]);
});

test("đo lại leo top: chưa cấu hình GSC → bỏ qua, MỘT dòng thongTin, không phải lỗi, ca vẫn xong", async () => {
	for (const gsc of [undefined, { coCauHinh: () => false, async layViTri() { throw new Error("không được gọi"); } }]) {
		const s = taoKhoGia();
		const id = await phienDaSua(s, "huyệt thần môn");
		const ca = await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi, gsc, now: () => LUC });
		assert.equal(ca.loi.length, 0);
		assert.equal(ca.thongTin.length, 1);
		assert.match(ca.thongTin[0], /Search Console/);
		assert.equal(ca.soDoLai, 0);
		assert.deepEqual((await s.leo_top.get(id)).doLai, []);
		assert.equal((await kho.dsCa(s)).length, 1);
	}
});

test("đo lại leo top: lỗi GSC của một phiên vào ca.loi, phiên khác vẫn đo; chạy thử không đo", async () => {
	const s = taoKhoGia();
	const hong = await phienDaSua(s, "hỏng");
	const tot = await phienDaSua(s, "tốt");
	const gsc = gscGia(async (q) => {
		if (q.tuKhoa === "hỏng") throw new Error("GSC truy vấn lỗi: denied");
		return { viTri: 3, hienThi: 50 };
	});
	const thu = await chayCaRadar({ s, docWeb: WEB, ghi: false, nghi, gsc, now: () => LUC });
	assert.equal(gsc.goi.length, 0);
	assert.equal(thu.soDoLai, 0);
	const ca = await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi, gsc, now: () => LUC });
	assert.equal(ca.soDoLai, 1);
	assert.ok(ca.loi.some((l) => /^đo lại leo top "hỏng": GSC truy vấn lỗi/.test(l)), ca.loi.join("|"));
	assert.deepEqual((await s.leo_top.get(hong)).doLai, []);
	assert.equal((await s.leo_top.get(tot)).doLai.length, 1);
});
