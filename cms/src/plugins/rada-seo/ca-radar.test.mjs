import { test } from "node:test";
import assert from "node:assert/strict";
import { chayCaRadar, xuHuongGanNhat, cauKhoangTrong, tomTatLoiTai } from "./ca-radar.mjs";
import { denLuotChienLuoc } from "./ai/tu-lap-chien-luoc.mjs";
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
const LUC = "2026-10-15T20:00:00.000Z"; // = 2026-10-16 03:00 giờ VN: ngày sửa 2026-10-01 + 15 ngày lịch VN
const phienDaSua = async (s, tuKhoa, ngaySua = "2026-10-01") => {
	const p = await kho.taoPhienLeoTop(s, { tuKhoa, trang: MINH, viTri: 9, hienThi: 100 }, "2026-09-30T00:00:00.000Z");
	await s.leo_top.put(p.id, { ...(await s.leo_top.get(p.id)), trangThai: "co_phieu" });
	await kho.datDaSua(s, p.id, ngaySua, { nowMs: Date.parse(`${ngaySua}T05:00:00.000Z`) });
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
	// Ca trễ một đêm (VN 16/10 = sửa + 15): cửa sổ vẫn MỞ ở sửa + 3 (04/10) và đóng ở ngày UTC
	// hôm nay (15/10) — gsc lùi 11 ngày, gồm cả hai đầu = 12 ngày lịch.
	assert.deepEqual(gsc.goi, [{ tuKhoa: "huyệt thần môn", trang: MINH, ngay: 11 }]);
	assert.equal(ca.soDoLai, 1);
	const d = await s.leo_top.get(id);
	assert.deepEqual(d.doLai, [{ ngay: "2026-10-16", sauNgay: 14, viTri: 5.5, hienThi: 140, cuaSoNgay: 12, hienThiNgay: 14 }]);
	assert.equal(d.trangThai, "da_sua");
	await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi, gsc, now: () => LUC });
	assert.equal(gsc.goi.length, 1, "mốc 14 đã đo → không gọi lại");
	// Mốc 28 → xong.
	await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi, gsc, now: () => "2026-10-29T20:00:00.000Z" });
	assert.equal((await s.leo_top.get(id)).trangThai, "xong");
});

test("đo lại leo top: mốc tính theo NGÀY LỊCH VN — ca 19:30 UTC ngày 14/10 đã là 15/10 ở VN (ngày sửa 01/10 + 14)", async () => {
	const s = taoKhoGia();
	const id = await phienDaSua(s, "huyệt thần môn");
	const gsc = gscGia();
	await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi, gsc, now: () => "2026-10-14T19:30:00.000Z" });
	const d = await s.leo_top.get(id);
	// Ca đúng đêm mốc: lùi moc − NGAY_TRE_GSC − 1 = 10 ngày từ ngày UTC 14/10 → [04/10, 14/10] = 11 ngày lịch.
	assert.deepEqual(d.doLai.map((x) => [x.ngay, x.sauNgay, x.cuaSoNgay]), [["2026-10-15", 14, 11]]);
	// Mốc 28: lùi 24 ngày → [04/10, 28/10] = 25 ngày lịch.
	await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi, gsc, now: () => "2026-10-28T19:30:00.000Z" });
	assert.deepEqual(gsc.goi.map((q) => q.ngay), [10, 24]);
	assert.equal((await s.leo_top.get(id)).trangThai, "xong");
});

test("đo lại leo top: GSC không có số liệu → vẫn ghi mốc (viTri null) để không hỏi lại mỗi đêm", async () => {
	const s = taoKhoGia();
	const id = await phienDaSua(s, "huyệt thần môn");
	await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi, gsc: gscGia(async () => null), now: () => LUC });
	assert.deepEqual((await s.leo_top.get(id)).doLai, [{ ngay: "2026-10-16", sauNgay: 14, viTri: null, hienThi: 0, cuaSoNgay: 12, hienThiNgay: 0 }]);
});

test("đo lại leo top: chưa cấu hình GSC → bỏ qua, có dòng thongTin, không phải lỗi, ca vẫn xong", async () => {
	for (const gsc of [undefined, { coCauHinh: () => false, async layViTri() { throw new Error("không được gọi"); } }]) {
		const s = taoKhoGia();
		const id = await phienDaSua(s, "huyệt thần môn");
		const ca = await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi, gsc, now: () => LUC });
		assert.equal(ca.loi.length, 0);
		// Kiểm CÓ dòng nói về Search Console, không kiểm TỔNG SỐ dòng: ca còn ghi thông tin của
		// các khâu khác (vd khâu tự đọc trang không chạy vì thiếu GRAVITY_API_KEY), và đếm tổng
		// làm phép kiểm gãy mỗi lần thêm một khâu — gãy vì lý do không liên quan đến điều nó canh.
		assert.equal(ca.thongTin.filter((x) => /Search Console/.test(x)).length, 1);
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

test("đo lại leo top: cửa sổ GSC THẬT (gsc.mjs, ngày hai đầu) bắt đầu ĐÚNG ngày sửa + 3, không lẫn ngày sửa + 2", async () => {
	const { taoGsc } = await import("./leo-top/gsc.mjs");
	for (const [luc, tu, den, soNgay] of [
		["2026-10-14T19:30:00.000Z", "2026-10-04", "2026-10-14", 11], // đúng đêm mốc 14 (02:30 VN 15/10)
		["2026-10-15T20:00:00.000Z", "2026-10-04", "2026-10-15", 12], // trễ một đêm
	]) {
		const s = taoKhoGia();
		const id = await phienDaSua(s, "huyệt thần môn");
		const body = [];
		const fetch = async (url, init) => {
			if (String(url).startsWith("https://oauth2")) return new Response(JSON.stringify({ access_token: "t", expires_in: 3600 }), { status: 200 });
			body.push(JSON.parse(init.body));
			return new Response(JSON.stringify({ rows: [{ keys: ["huyệt thần môn", MINH], position: 5, impressions: 110 }] }), { status: 200 });
		};
		const env = { GSC_OAUTH_CLIENT_ID: "a", GSC_OAUTH_CLIENT_SECRET: "b", GSC_OAUTH_REFRESH_TOKEN: "c" };
		const gsc = taoGsc({ fetch, env, now: () => Date.parse(luc) });
		await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi, gsc, now: () => luc });
		assert.deepEqual([body[0].startDate, body[0].endDate], [tu, den], luc);
		// Số ngày lịch gồm cả hai đầu = số lưu trong cuaSoNgay (mẫu số của hienThiNgay trừ đi NGAY_GSC_CHUA_CO).
		const soNgayLich = (Date.parse(den) - Date.parse(tu)) / 86_400_000 + 1;
		assert.equal(soNgayLich, soNgay);
		const [lan] = (await s.leo_top.get(id)).doLai;
		assert.equal(lan.cuaSoNgay, soNgay);
		assert.equal(lan.hienThiNgay, Math.round((110 / (soNgay - kho.NGAY_GSC_CHUA_CO)) * 100) / 100);
	}
});

test("đo lại leo top: người quản trị đổi ngày sửa trong lúc ca đang hỏi GSC → không ghi mốc theo ngày cũ", async () => {
	const s = taoKhoGia();
	const id = await phienDaSua(s, "huyệt thần môn");
	const gsc = gscGia(async () => {
		await kho.datDaSua(s, id, "2026-10-10", { nowMs: Date.parse(LUC) });
		return { viTri: 5, hienThi: 50 };
	});
	const ca = await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi, gsc, now: () => LUC });
	assert.equal(ca.soDoLai, 0);
	const d = await s.leo_top.get(id);
	assert.equal(d.ngaySua, "2026-10-10");
	assert.deepEqual(d.doLai, []);
});

// Thứ tự các khâu là thứ CHỊU LỰC, không phải chuyện sắp xếp cho đẹp: `capNhatKhoangTrong` chỉ
// nhìn URL đã 'da_phan_tich', nên đọc trang SAU nó thì 40 trang vừa đọc chỉ vào bảng khoảng
// trống ở đêm hôm sau — ca vẫn báo đủ số và không chỗ nào nói ra là chậm một ngày. Phép kiểm
// neo vào HẬU QUẢ quan sát được (có cụm trong chính ca đó), không neo vào thứ tự gọi hàm.
test("tự đọc trang chạy TRƯỚC khâu khoảng trống: trang đọc trong ca vào bảng khoảng trống NGAY ca đó", async () => {
	const s = await khoiTao();
	// tuDoc giả làm đúng việc của bản thật: chuyển trang 'cho_ai' thành 'da_phan_tich' kèm chủ đề.
	const tuDoc = async ({ s }) => {
		const r = await s.url.query({ where: { trangThai: "cho_ai" }, limit: 50 });
		const items = r.items.map((x, i) => ({ id: x.id, chuDe: `Bấm huyệt chữa mất ngủ ${i}`, tuKhoa: ["bấm huyệt", "mất ngủ"], tomTat: [] }));
		const kq = await kho.ghiPhanTich(s, items, LUC);
		return { daDoc: kq.daGhi, daGhi: kq.daGhi, loi: 0, boQua: 0, luotGoi: kq.daGhi, soLo: 1, conTrongHangCho: 0, ghiChu: [] };
	};
	const ca = await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi, kv: {}, goiModel: {}, tuDoc, now: () => LUC });
	assert.ok(ca.soDocAi > 0, "phải đọc được ít nhất một trang vừa trích trong ca");
	assert.ok(ca.soCum > 0, `khoảng trống của chính ca này phải thấy trang vừa đọc, soCum=${ca.soCum}`);
});

test("thiếu goiModel/kv thì NÓI RA là hàng đợi sẽ đứng, không im lặng báo ca thành công", async () => {
	const s = await khoiTao();
	const ca = await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi, now: () => LUC });
	assert.deepEqual([ca.soDocAi, ca.soLuotModel], [0, 0]);
	assert.ok(ca.thongTin.some((x) => /tự đọc trang KHÔNG chạy/.test(x)), ca.thongTin.join("|"));
});

// ── Số 0 phải tự giải thích ────────────────────────────────────────────────────────────────
// Ngày 02/10/2026 khâu khoảng trống ghi soCum=0 suốt 5 ca liền. Con số đó đúng ở 4 ca (chưa
// trang nào được đọc) và SAI ở ca thứ 5, mà không cách nào phân biệt từ nhật ký. Ba câu dưới
// là thứ phân biệt được, nên chúng phải khác nhau rõ ràng.
test("cauKhoangTrong: ba trạng thái của số 0 ra ba câu KHÁC nhau", () => {
	const chuaDoc = cauKhoangTrong({ soCum: 0, soChuDeMinh: 60, soChuDeDoiThu: 0, soCumTinh: 0 });
	const luatTrong = cauKhoangTrong({ soCum: 0, soChuDeMinh: 60, soChuDeDoiThu: 160, soCumTinh: 0 });
	const bILoc = cauKhoangTrong({ soCum: 0, soChuDeMinh: 60, soChuDeDoiThu: 160, soCumTinh: 50 });
	assert.match(chuaDoc, /Chưa trang ĐỐI THỦ nào được đọc/);
	assert.match(chuaDoc, /không phải lỗi của luật/);
	assert.match(luatTrong, /luật không ra cụm nào/);
	assert.match(bILoc, /khâu ghi lọc sạch/);
	assert.equal(new Set([chuaDoc, luatTrong, bILoc]).size, 3);
	// Ca bình thường thì chỉ nêu số, không phán gì.
	const thuong = cauKhoangTrong({ soCum: 50, soChuDeMinh: 60, soChuDeDoiThu: 160, soCumTinh: 50 });
	assert.match(thuong, /160 chủ đề đối thủ/);
	assert.doesNotMatch(thuong, /không phải|lọc sạch/);
});

test("tomTatLoiTai: gom theo LÝ DO kèm ví dụ, không liệt kê từng URL", () => {
	const c = tomTatLoiTai([
		{ url: "https://a/1", lyDo: "lỗi giao thức" },
		{ url: "https://a/2", lyDo: "lỗi giao thức" },
		{ url: "https://b/1", lyDo: "quá hạn 30 s" },
	]);
	assert.match(c, /Tải hỏng 3 lượt/);
	assert.match(c, /2× lỗi giao thức \(vd https:\/\/a\/1\)/);
	assert.match(c, /1× quá hạn 30 s/);
	// Lý do nhiều lượt nhất đứng trước.
	assert.ok(c.indexOf("lỗi giao thức") < c.indexOf("quá hạn"), c);
});

test("ca ghi lại lượt tải HỎNG mà docWeb đã nuốt", async () => {
	const s = await khoiTao();
	const loiTai = [];
	// docWeb hỏng mọi thứ, y như taoDocWeb khi gọi hỏng: trả chuỗi rỗng rồi báo qua ghiLoi.
	const hong = async (u) => {
		loiTai.push({ url: u, lyDo: "lỗi giao thức" });
		return "";
	};
	const ca = await chayCaRadar({ s, docWeb: hong, ghi: true, nghi, loiTai, now: () => LUC });
	assert.ok(ca.thongTin.some((x) => /Tải hỏng \d+ lượt.*lỗi giao thức/.test(x)), ca.thongTin.join("|"));
	// Và khâu khoảng trống vẫn nói ra vì sao nó ra 0.
	assert.ok(ca.thongTin.some((x) => /Chưa trang ĐỐI THỦ nào được đọc/.test(x)), ca.thongTin.join("|"));
});

test("xu hướng ra 0 thì ca NÓI RA là nghi lời gọi hỏng", async () => {
	const s = await khoiTao();
	const ca = await chayCaRadar({ s, docWeb: async () => "", ghi: true, nghi, now: () => LUC });
	assert.equal(ca.soXuHuong, 0);
	assert.ok(ca.thongTin.some((x) => /nghi lời gọi hỏng/.test(x)), ca.thongTin.join("|"));
});

// ── Lập chiến lược: việc TUẦN nằm trong ca ĐÊM ─────────────────────────────────────────────
test("denLuotChienLuoc: đúng một ngày UTC trong tuần", () => {
	// 2026-10-05 là thứ Hai. Giờ 19:30 UTC để giống mốc ca thật.
	assert.equal(denLuotChienLuoc(Date.parse("2026-10-05T19:30:00Z")), true);
	for (const d of ["04", "06", "07", "08", "09", "10"])
		assert.equal(denLuotChienLuoc(Date.parse(`2026-10-${d}T19:30:00Z`)), false, d);
	// Đổi ngày được, để không phải sửa mã khi muốn chạy ngày khác.
	assert.equal(denLuotChienLuoc(Date.parse("2026-10-07T19:30:00Z"), 3), true);
});

test("ca ĐÊM THƯỜNG không chạy chiến lược; đúng ngày thì chạy và cộng số vào nhật ký", async () => {
	const s = await khoiTao();
	let goi = 0;
	const tuChienLuoc = async () => {
		goi++;
		return { soHuong: 2, soCumNghia: 5, soKeHoach: 3, luotGoi: 3, loi: 1, ghiChu: ["bác 1/2 — vượt phạm vi"] };
	};
	// Thứ Ba — không phải ngày chiến lược.
	const thuong = await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi, goiModel: {}, tuChienLuoc, now: () => "2026-10-06T19:30:00.000Z" });
	assert.deepEqual([goi, thuong.soHuong, thuong.soCumNghia], [0, 0, 0]);

	// Thứ Hai — đến lượt.
	const s2 = await khoiTao();
	const ca = await chayCaRadar({ s: s2, docWeb: WEB, ghi: true, nghi, goiModel: {}, tuChienLuoc, now: () => "2026-10-05T19:30:00.000Z" });
	assert.equal(goi, 1);
	assert.deepEqual([ca.soHuong, ca.soCumNghia, ca.soKeHoachMoi], [2, 5, 3]);
	assert.deepEqual([ca.soLuotModel, ca.soLoiModel], [3, 1], "lượt gọi của chiến lược phải CỘNG vào tổng của ca");
	assert.ok(ca.thongTin.some((x) => /^chiến lược: bác 1\/2/.test(x)), ca.thongTin.join("|"));
});

test("khâu chiến lược ném lỗi thì ca VẪN xong và vẫn ghi nhật ký", async () => {
	const s = await khoiTao();
	const ca = await chayCaRadar({
		s, docWeb: WEB, ghi: true, nghi, goiModel: {},
		tuChienLuoc: async () => { throw new Error("kho sập") },
		now: () => "2026-10-05T19:30:00.000Z",
	});
	assert.ok(ca.ketThuc, "ca phải hoàn tất");
	assert.ok(ca.loi.some((x) => /lập chiến lược hỏng: kho sập/.test(x)), ca.loi.join("|"));
	assert.equal((await kho.dsCa(s)).length, 1);
});

// Vòng ca-radar → tu-lap-chien-luoc → khuon → viec → … → ca-radar đã làm BA tệp phép kiểm chết
// hẳn lúc nạp với `ReferenceError: Cannot access … before initialization` ở chỗ chẳng liên quan.
// Trần nay ở `chien-luoc/tran.mjs` (tệp không import gì). Chốt này bắt lại nếu ai nối vòng mới.
test("chien-luoc/tran.mjs KHÔNG import gì — đó là thứ cắt vòng import", async () => {
	const { readFile } = await import("node:fs/promises");
	const chu = await readFile(new URL("./chien-luoc/tran.mjs", import.meta.url), "utf8");
	assert.doesNotMatch(chu, /^\s*import\s/m, "thêm import vào tệp này là nối lại vòng");
	const t = await import("./chien-luoc/tran.mjs");
	for (const k of ["TRAN_HUONG_MOI_LUOT", "TRAN_CUM_MOI_LUOT", "TRAN_KE_HOACH_MOI_LUOT", "Y_DINH"])
		assert.ok(t[k] !== undefined, `thiếu ${k}`);
	// Và `viec.mjs` vẫn xuất lại, nên chỗ gọi cũ không vỡ.
	const v = await import("./chien-luoc/viec.mjs");
	assert.equal(v.TRAN_HUONG_MOI_LUOT, t.TRAN_HUONG_MOI_LUOT);
	assert.deepEqual(v.Y_DINH, t.Y_DINH);
});
