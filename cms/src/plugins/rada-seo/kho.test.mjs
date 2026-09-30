import { test } from "node:test";
import assert from "node:assert/strict";
import * as kho from "./kho.mjs";
import { taoKhoGia } from "./__test__/kho-gia.mjs";

const NOW = "2026-10-01T00:00:00.000Z";

test("đối thủ: khoá là tên miền, xoá kéo theo URL", async () => {
	const s = taoKhoGia();
	await kho.luuDoiThu(s, { tenMien: "a.vn", ten: "A" }, NOW);
	await kho.luuDoiThu(s, { tenMien: "a.vn", ten: "A2", laCuaMinh: true }, "sau");
	const ds = await kho.dsDoiThu(s);
	assert.equal(ds.length, 1);
	assert.equal(ds[0].taoLuc, NOW);
	assert.equal(ds[0].laCuaMinh, true);
	await kho.themUrlMoi(s, "a.vn", ["https://a.vn/1", "https://a.vn/2"], { ghi: true, now: NOW });
	assert.equal(await kho.xoaDoiThu(s, "a.vn"), 2);
	assert.equal(s.url._m.size, 0);
});

test("themUrlMoi: chỉ thêm URL chưa có; ghi=false chỉ đếm", async () => {
	const s = taoKhoGia();
	assert.equal(await kho.themUrlMoi(s, "a.vn", ["https://a.vn/1"], { ghi: true, now: NOW }), 1);
	assert.equal(await kho.themUrlMoi(s, "a.vn", ["https://a.vn/1", "https://a.vn/2"], { ghi: false, now: NOW }), 1);
	assert.equal(s.url._m.size, 1);
	assert.deepEqual(await kho.demUrl(s, "a.vn"), { cho: 1, cho_ai: 0, da_phan_tich: 0, ngoai_nganh: 0, loi: 0 });
});

test("thayCum: giữ cụm đã bỏ qua và không thêm lại cụm giống nó", async () => {
	const s = taoKhoGia();
	const c1 = { tenCum: "Bấm huyệt trị mất ngủ tại nhà", tuKhoa: ["bấm huyệt trị mất ngủ"], diem: 10 };
	const c2 = { tenCum: "Ngũ hành và ăn uống theo mùa", tuKhoa: ["ngũ hành ăn uống"], diem: 5 };
	assert.equal(await kho.thayCum(s, [c1, c2], NOW), 2);
	const [dau] = await kho.dsCum(s);
	await kho.datTrangThaiCum(s, dau.id, "bo_qua");
	const c1DemSau = { tenCum: "Bấm huyệt trị mất ngủ tại nhà hiệu quả", tuKhoa: ["bấm huyệt trị mất ngủ"], diem: 11 };
	assert.equal(await kho.thayCum(s, [c1DemSau, c2], NOW), 1);
	const ds = await kho.dsCum(s);
	assert.equal(ds.length, 2);
	assert.equal(ds.filter((c) => c.trangThai === "bo_qua").length, 1);
	await assert.rejects(kho.datTrangThaiCum(s, dau.id, "linh_tinh"), /không hợp lệ/);
});

test("ghiTheoLo: 45 mục → 3 lượt putMany (20/20/5), nghỉ GIỮA các lô", async () => {
	const s = taoKhoGia();
	const lo = [];
	const goc = s.url.putMany;
	s.url.putMany = async (items) => { lo.push(items.length); return goc(items); };
	let nghi = 0;
	const items = Array.from({ length: 45 }, (_, i) => ({ id: `u${i}`, data: { i } }));
	await kho.ghiTheoLo(s.url, items, { nghi: async (ms) => { assert.equal(ms, kho.NGHI_GIUA_LO_MS); nghi++; } });
	assert.deepEqual(lo, [20, 20, 5]);
	assert.equal(nghi, 2);
	assert.equal(s.url._m.size, 45);
});

test("themUrlMoi và thayCum ghi theo lô 20", async () => {
	const s = taoKhoGia();
	const lo = [];
	for (const col of [s.url, s.cum]) {
		const goc = col.putMany;
		col.putMany = async (items) => { lo.push(items.length); return goc(items); };
	}
	const nghi = async () => {};
	const urls = Array.from({ length: 45 }, (_, i) => `https://a.vn/${i}`);
	assert.equal(await kho.themUrlMoi(s, "a.vn", urls, { ghi: true, now: NOW, nghi }), 45);
	assert.deepEqual(lo, [20, 20, 5]);
	lo.length = 0;
	const cum = Array.from({ length: 25 }, (_, i) => ({ tenCum: `Cụm số ${i} riêng biệt ${"x".repeat(i)}`, tuKhoa: [`khoa${i}`], diem: i }));
	assert.equal(await kho.thayCum(s, cum, NOW, { nghi }), 25);
	assert.deepEqual(lo, [20, 5]);
});

test("datLaiUrlLoi: chỉ URL 'loi' của đúng đối thủ về 'cho'", async () => {
	const s = taoKhoGia();
	await kho.themUrlMoi(s, "a.vn", ["https://a.vn/1", "https://a.vn/2", "https://a.vn/3"], { ghi: true, now: NOW });
	await kho.themUrlMoi(s, "b.vn", ["https://b.vn/1"], { ghi: true, now: NOW });
	await kho.capNhatUrl(s, kho.idUrl("https://a.vn/1"), { trangThai: "loi", loi: "x" });
	await kho.capNhatUrl(s, kho.idUrl("https://a.vn/2"), { trangThai: "loi", loi: "y" });
	await kho.capNhatUrl(s, kho.idUrl("https://a.vn/3"), { trangThai: "da_phan_tich" });
	await kho.capNhatUrl(s, kho.idUrl("https://b.vn/1"), { trangThai: "loi" });
	assert.equal(await kho.datLaiUrlLoi(s, "a.vn", { nghi: async () => {} }), 2);
	assert.deepEqual(await kho.demUrl(s, "a.vn"), { cho: 2, cho_ai: 0, da_phan_tich: 1, ngoai_nganh: 0, loi: 0 });
	assert.deepEqual(await kho.demUrl(s, "b.vn"), { cho: 0, cho_ai: 0, da_phan_tich: 0, ngoai_nganh: 0, loi: 1 });
	const r = await s.url.get(kho.idUrl("https://a.vn/1"));
	assert.equal(r.loi, undefined);
});

test("layUrlChoAi + ghiPhanTich: chỉ nhận URL đang 'cho_ai', bỏ trường chu, báo id bỏ qua", async () => {
	const s = taoKhoGia();
	await s.url.put("u1", { doiThuId: "a.vn", url: "https://a.vn/1", trangThai: "cho_ai", chu: "TIÊU ĐỀ: x" });
	await s.url.put("u2", { doiThuId: "a.vn", url: "https://a.vn/2", trangThai: "da_phan_tich", chuDe: "cũ" });
	const cho = await kho.layUrlChoAi(s, 10);
	assert.deepEqual(cho, [{ id: "u1", url: "https://a.vn/1", doiThuId: "a.vn", chu: "TIÊU ĐỀ: x" }]);
	assert.equal(await kho.demChoAi(s), 1);
	const kq = await kho.ghiPhanTich(s, [
		{ id: "u1", chuDe: "Bấm huyệt", tuKhoa: ["bấm huyệt"], tomTat: ["a"] },
		{ id: "u2", chuDe: "đè", tuKhoa: ["x"], tomTat: [] },
		{ id: "khong-co", chuDe: "x", tuKhoa: ["x"], tomTat: [] },
	], NOW);
	assert.deepEqual(kq, { daGhi: 1, boQua: ["u2", "khong-co"] });
	const u1 = await s.url.get("u1");
	assert.equal(u1.trangThai, "da_phan_tich");
	assert.equal(u1.chu, undefined);
	assert.equal((await s.url.get("u2")).chuDe, "cũ");
	assert.deepEqual(await kho.layUrlChoAi(s, 0), []);
});

test("chuDeDaPhanTich: đối thủ chỉ lấy toiDa dòng MỚI NHẤT theo phanTichLuc, dòng không mốc xếp cuối; của mình lấy hết", async () => {
	const s = taoKhoGia();
	await kho.luuDoiThu(s, { tenMien: "a.vn" }, NOW);
	await kho.luuDoiThu(s, { tenMien: "kinhlac.online", laCuaMinh: true }, NOW);
	const moc = ["2026-09-01", "2026-09-05", "2026-09-03", "2026-09-04", "2026-09-02"];
	for (const [i, m] of moc.entries())
		await s.url.put(`d${i}`, { doiThuId: "a.vn", trangThai: "da_phan_tich", chuDe: `bài ${m}`, tuKhoa: ["k"], phanTichLuc: `${m}T00:00:00.000Z` });
	await s.url.put("cu", { doiThuId: "a.vn", trangThai: "da_phan_tich", chuDe: "bài 2A", tuKhoa: [] });
	await s.url.put("m1", { doiThuId: "kinhlac.online", trangThai: "da_phan_tich", chuDe: "của mình", tuKhoa: [], phanTichLuc: "2020-01-01T00:00:00.000Z" });
	const doiThu = await kho.dsDoiThu(s);
	const kq = await kho.chuDeDaPhanTich(s, doiThu, { toiDa: 3 });
	assert.deepEqual(kq.doiThu.map((t) => t.chuDe), ["bài 2026-09-05", "bài 2026-09-04", "bài 2026-09-03"]);
	assert.deepEqual(kq.minh.map((t) => t.chuDe), ["của mình"]);
	// Đủ chỗ thì dòng cũ (2A, không mốc) vẫn được lấy, đứng cuối.
	const het = await kho.chuDeDaPhanTich(s, doiThu, { toiDa: 10 });
	assert.equal(het.doiThu.length, 6);
	assert.equal(het.doiThu.at(-1).chuDe, "bài 2A");
	assert.ok(kho.KHAI_BAO_KHO.url.indexes.includes("phanTichLuc"));
});

// ---- Hướng nội dung, cụm theo nghĩa, kế hoạch (2C-2) ----

const HUONG_MAT_NGU = { ten: "Mất ngủ theo Đông y", moTa: "m", trongSoGoiY: 4, lyDo: "3 đối thủ", tuKhoa: ["mất ngủ"], idBaiDoiThu: ["u1"], chiSo: { soDoiThu: 3 }, diem: 60 };

test("luuHuongMoi: cùng tên (khác hoa/dấu câu) → cập nhật chỉ số, GIỮ trạng thái/trọng số/lý do người dùng đặt", async () => {
	const s = taoKhoGia();
	const [a] = await kho.luuHuongMoi(s, [HUONG_MAT_NGU], NOW);
	assert.match(a.id, /^h_/);
	assert.equal((await s.huong.get(a.id)).trangThai, "de_xuat");
	await kho.datHuong(s, a.id, { trangThai: "da_nhan", trongSo: 5 });
	const [b] = await kho.luuHuongMoi(s, [{ ...HUONG_MAT_NGU, ten: "mất ngủ theo đông y!", diem: 72, chiSo: { soDoiThu: 4 } }], "sau");
	assert.equal(b.id, a.id);
	const r = await s.huong.get(a.id);
	assert.equal(r.trangThai, "da_nhan");
	assert.equal(r.trongSo, 5);
	assert.equal(r.diem, 72);
	assert.equal(r.chiSo.soDoiThu, 4);
	assert.equal(r.taoLuc, NOW);
	assert.equal(r.capNhatLuc, "sau");
	await kho.datHuong(s, a.id, { trangThai: "bo_qua", lyDoBo: "ngoài ngách" });
	await kho.luuHuongMoi(s, [HUONG_MAT_NGU], "sau nữa");
	const bo = await s.huong.get(a.id);
	assert.equal(bo.trangThai, "bo_qua");
	assert.equal(bo.lyDoBo, "ngoài ngách");
	assert.deepEqual((await kho.dsHuong(s, { trangThai: "bo_qua" })).map((h) => h.id), [a.id]);
	assert.deepEqual(await kho.dsHuong(s, { trangThai: "da_nhan" }), []);
});

test("datHuong: da_nhan bắt buộc trọng số 1..5; trạng thái lạ, bỏ không lý do, id lạ → ném", async () => {
	const s = taoKhoGia();
	const [a] = await kho.luuHuongMoi(s, [HUONG_MAT_NGU], NOW);
	await assert.rejects(kho.datHuong(s, a.id, { trangThai: "da_nhan" }), /trọng số/);
	await assert.rejects(kho.datHuong(s, a.id, { trangThai: "da_nhan", trongSo: 6 }), /trọng số/);
	await assert.rejects(kho.datHuong(s, a.id, { trangThai: "da_nhan", trongSo: 2.5 }), /trọng số/);
	await assert.rejects(kho.datHuong(s, a.id, { trangThai: "linh_tinh" }), /không hợp lệ/);
	await assert.rejects(kho.datHuong(s, a.id, { trangThai: "bo_qua" }), /lý do/);
	await assert.rejects(kho.datHuong(s, "h_khong_co", { trangThai: "de_xuat" }), /Không có hướng/);
	await kho.datHuong(s, a.id, { trangThai: "bo_qua", lyDoBo: "x" });
	// Khôi phục: bỏ lý do cũ.
	await kho.datHuong(s, a.id, { trangThai: "de_xuat" });
	assert.equal((await s.huong.get(a.id)).lyDoBo, undefined);
	assert.deepEqual(kho.TRANG_THAI_HUONG, ["de_xuat", "da_nhan", "bo_qua"]);
});

test("dsHuong xếp điểm giảm dần", async () => {
	const s = taoKhoGia();
	await kho.luuHuongMoi(s, [{ ...HUONG_MAT_NGU, ten: "A", diem: 10 }, { ...HUONG_MAT_NGU, ten: "B", diem: 90 }, { ...HUONG_MAT_NGU, ten: "C", diem: 50 }], NOW);
	assert.deepEqual((await kho.dsHuong(s)).map((h) => h.ten), ["B", "C", "A"]);
});

test("thayCumNghia: thay cụm của đúng hướng; cụm còn bài dự kiến (kể cả CHƯA duyệt) thành 'cu' chứ không xoá; cụm cùng tên giữ id", async () => {
	const s = taoKhoGia();
	await s.huong.put("h_1", { ten: "H", trangThai: "da_nhan", trongSo: 3 });
	const c = (ten, diem = 1) => ({ ten, moTa: "", tuKhoa: [ten], idBaiDoiThu: [], chiSo: {}, diem });
	const lan1 = await kho.thayCumNghia(s, "h_1", [c("Huyệt an thần"), c("Trà thảo dược"), c("Giấc ngủ trẻ em"), c("Ngủ ngày")], NOW);
	await kho.thayCumNghia(s, "h_2", [c("Khác hướng")], NOW);
	const [anThan, tra, treEm, nguNgay] = lan1.map((x) => x.id);
	await kho.themKeHoach(s, [{ cumId: anThan, huongId: "h_1", tieuDeLamViec: "Huyệt an thần dễ bấm", tuKhoaChinh: "huyệt an thần" }], NOW);
	const [kh] = await kho.dsKeHoach(s);
	await kho.datKeHoach(s, kh.id, { trangThai: "da_duyet" });
	await kho.themKeHoach(s, [{ cumId: tra, huongId: "h_1", tieuDeLamViec: "Trà hoa cúc", tuKhoaChinh: "trà hoa cúc" }], NOW);
	const [kb] = await kho.themKeHoach(s, [{ cumId: nguNgay, huongId: "h_1", tieuDeLamViec: "Ngủ ngày nhiều", tuKhoaChinh: "ngủ ngày" }], NOW);
	await kho.datKeHoach(s, kb.id, { trangThai: "bo_qua", lyDoBo: "ngoài ngách" });
	const lan2 = await kho.thayCumNghia(s, "h_1", [c("Giấc ngủ trẻ em", 9), c("Ngủ trưa")], "sau");
	assert.equal(lan2.find((x) => x.ten === "Giấc ngủ trẻ em").id, treEm);
	const con = Object.fromEntries((await kho.dsCumNghia(s, { huongId: "h_1" })).map((x) => [x.ten, x.trangThai]));
	// Trà thảo dược chỉ có bài CHƯA duyệt — trước đây bị xoá cùng bài; nay giữ ở dạng "cu".
	// Ngủ ngày chỉ còn bài đã bỏ → cụm xoá, bài bo_qua ở lại làm trí nhớ.
	assert.deepEqual(con, { "Giấc ngủ trẻ em": "de_xuat", "Huyệt an thần": "cu", "Ngủ trưa": "de_xuat", "Trà thảo dược": "cu" });
	assert.equal((await s.cum_nghia.get(treEm)).diem, 9);
	assert.equal((await kho.dsCumNghia(s, { huongId: "h_2" })).length, 1);
	assert.deepEqual((await kho.dsKeHoach(s)).map((k) => k.tieuDeLamViec).sort(), ["Huyệt an thần dễ bấm", "Ngủ ngày nhiều", "Trà hoa cúc"]);
	assert.deepEqual(kho.TRANG_THAI_CUM_NGHIA, ["de_xuat", "cu"]);
	// Tên cũ quay lại ở lứa sau → cụm "cu" sống lại (de_xuat), giữ id.
	const lan3 = await kho.thayCumNghia(s, "h_1", [c("Trà thảo dược")], "sau nữa");
	assert.equal(lan3[0].id, tra);
	assert.equal((await s.cum_nghia.get(tra)).trangThai, "de_xuat");
});

test("thayCumNghia: đổi tên cụm không làm mất bài dự kiến chưa duyệt", async () => {
	const s = taoKhoGia();
	const [a] = await kho.thayCumNghia(s, "h_1", [{ ten: "Huyệt an thần", tuKhoa: [] }], NOW);
	await kho.themKeHoach(s, [{ cumId: a.id, huongId: "h_1", tieuDeLamViec: "Bài A", tuKhoaChinh: "bài a" }], NOW);
	await kho.thayCumNghia(s, "h_1", [{ ten: "Huyệt giúp an thần", tuKhoa: [] }], "sau");
	assert.equal((await kho.dsKeHoach(s)).length, 1);
	assert.equal((await s.cum_nghia.get(a.id)).trangThai, "cu");
});

test("thayCumNghia: routine gửi cụm của MỘT hướng qua hai lượt → cụm lượt đầu có bài vẫn còn", async () => {
	const s = taoKhoGia();
	const [a, b] = await kho.thayCumNghia(s, "h_1", [{ ten: "Cụm A", tuKhoa: [] }, { ten: "Cụm B", tuKhoa: [] }], NOW);
	await kho.themKeHoach(s, [{ cumId: a.id, huongId: "h_1", tieuDeLamViec: "Bài A", tuKhoaChinh: "bài a" }], NOW);
	await kho.thayCumNghia(s, "h_1", [{ ten: "Cụm C", tuKhoa: [] }], NOW);
	const con = Object.fromEntries((await kho.dsCumNghia(s, { huongId: "h_1" })).map((x) => [x.id, x.trangThai]));
	assert.equal(con[a.id], "cu");
	assert.equal(con[b.id], undefined, "cụm không có bài thì bị thay như cũ");
	assert.equal((await kho.dsKeHoach(s))[0].trangThai, "de_xuat");
});

test("themKeHoach: id đã có → GIỮ trạng thái / lý do bỏ / taoLuc của bài cũ", async () => {
	const s = taoKhoGia();
	const [k] = await kho.themKeHoach(s, [{ cumId: "c_1", tieuDeLamViec: "Trà hoa cúc", tuKhoaChinh: "trà hoa cúc" }], NOW);
	await kho.datKeHoach(s, k.id, { trangThai: "bo_qua", lyDoBo: "ngoài ngách" });
	await kho.themKeHoach(s, [{ cumId: "c_1", tieuDeLamViec: "trà hoa cúc!", tuKhoaChinh: "trà hoa cúc", lienKetDich: ["/x/"] }], "sau");
	const r = await s.ke_hoach.get(k.id);
	assert.equal(r.trangThai, "bo_qua");
	assert.equal(r.lyDoBo, "ngoài ngách");
	assert.equal(r.taoLuc, NOW);
	assert.deepEqual(r.lienKetDich, ["/x/"]);
});

test("datKeHoach: không duyệt được bài thuộc hướng chưa nhận", async () => {
	const s = taoKhoGia();
	await s.huong.put("h_1", { ten: "H", trangThai: "de_xuat" });
	await s.cum_nghia.put("c_1", { huongId: "h_1", ten: "C", trangThai: "de_xuat" });
	const [k] = await kho.themKeHoach(s, [{ cumId: "c_1", tieuDeLamViec: "Bài", tuKhoaChinh: "bài" }], NOW);
	await assert.rejects(kho.datKeHoach(s, k.id, { trangThai: "da_duyet" }), /chưa được nhận/);
	// Bỏ thì vẫn được.
	await kho.datKeHoach(s, k.id, { trangThai: "bo_qua", lyDoBo: "x" });
	await kho.datHuong(s, "h_1", { trangThai: "da_nhan", trongSo: 3 });
	await kho.datKeHoach(s, k.id, { trangThai: "da_duyet" });
	assert.equal((await s.ke_hoach.get(k.id)).trangThai, "da_duyet");
});

test("chuDeDaPhanTich trả kèm url (bằng chứng đọc thẳng từ bộ đã nạp)", async () => {
	const s = taoKhoGia();
	await kho.luuDoiThu(s, { tenMien: "a.vn" }, NOW);
	await s.url.put("d1", { doiThuId: "a.vn", url: "https://a.vn/1", trangThai: "da_phan_tich", chuDe: "x", tuKhoa: [], phanTichLuc: NOW });
	const kq = await kho.chuDeDaPhanTich(s, await kho.dsDoiThu(s));
	assert.equal(kq.doiThu[0].url, "https://a.vn/1");
});

test("kế hoạch: themKeHoach đặt de_xuat; datKeHoach bác trạng thái lạ, bỏ không lý do, id lạ; lọc theo trạng thái", async () => {
	const s = taoKhoGia();
	const ra = await kho.themKeHoach(s, [
		{ cumId: "c_1", huongId: "h_1", tieuDeLamViec: "Một", tuKhoaChinh: "một" },
		{ cumId: "c_1", huongId: "h_1", tieuDeLamViec: "Hai", tuKhoaChinh: "hai" },
	], NOW);
	assert.equal(ra.length, 2);
	assert.ok(ra.every((x) => /^k_/.test(x.id)));
	assert.equal((await kho.dsKeHoach(s, { trangThai: "de_xuat" })).length, 2);
	await assert.rejects(kho.datKeHoach(s, ra[0].id, { trangThai: "linh_tinh" }), /không hợp lệ/);
	await assert.rejects(kho.datKeHoach(s, ra[0].id, { trangThai: "bo_qua" }), /lý do/);
	await assert.rejects(kho.datKeHoach(s, "k_khong", { trangThai: "da_duyet" }), /Không có bài dự kiến/);
	await kho.datKeHoach(s, ra[0].id, { trangThai: "bo_qua", lyDoBo: "trùng ý" });
	const bo = await kho.dsKeHoach(s, { trangThai: "bo_qua" });
	assert.deepEqual(bo.map((k) => [k.tieuDeLamViec, k.lyDoBo, k.taoLuc]), [["Một", "trùng ý", NOW]]);
	assert.deepEqual(kho.TRANG_THAI_KE_HOACH, ["de_xuat", "da_duyet", "bo_qua", "dang_viet", "co_nhap", "da_dang"]);
	for (const b of ["huong", "cum_nghia", "ke_hoach"]) assert.ok(kho.KHAI_BAO_KHO[b], b);
	assert.ok(kho.KHAI_BAO_KHO.cum, "bộ cum cũ vẫn giữ");
});

test("hướng/cụm/kế hoạch ghi nhiều dòng theo lô 20", async () => {
	const s = taoKhoGia();
	const lo = [];
	for (const col of [s.huong, s.cum_nghia, s.ke_hoach]) {
		const goc = col.putMany;
		col.putMany = async (items) => { lo.push(items.length); return goc(items); };
	}
	const nghi = async () => {};
	await kho.luuHuongMoi(s, Array.from({ length: 25 }, (_, i) => ({ ...HUONG_MAT_NGU, ten: `Hướng ${i}` })), NOW, { nghi });
	assert.deepEqual(lo, [20, 5]);
	lo.length = 0;
	await kho.thayCumNghia(s, "h_1", Array.from({ length: 21 }, (_, i) => ({ ten: `Cụm ${i}`, tuKhoa: [] })), NOW, { nghi });
	assert.deepEqual(lo, [20, 1]);
	lo.length = 0;
	await kho.themKeHoach(s, Array.from({ length: 22 }, (_, i) => ({ cumId: "c", tieuDeLamViec: `Bài ${i}`, tuKhoaChinh: `k${i}` })), NOW, { nghi });
	assert.deepEqual(lo, [20, 2]);
});
