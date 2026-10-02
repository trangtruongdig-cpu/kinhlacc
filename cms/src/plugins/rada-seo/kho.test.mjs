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
	assert.deepEqual(kho.TRANG_THAI_KE_HOACH, ["de_xuat", "da_duyet", "bo_qua", "dang_viet", "co_nhap", "da_dang", "can_xem"]);
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

// ---- Leo top (2D) ----

const NGAY_MS = 86_400_000;
const T0 = Date.parse("2026-10-01T00:00:00.000Z");
const MINH = "https://kinhlac.online/huyet/than-mon/";
const PHIEN = { tuKhoa: "huyệt thần môn", trang: MINH, viTri: 8.4, hienThi: 300 };
const soDo = (them = {}) => ({ viTriTraLoi: 20, coBang: true, soNguonNgoai: 2, coTacGia: true, ngayCapNhat: "2026-06-01", soChu: 900, ...them });
const serpMau = () => [
	...["a", "b", "c", "d", "e"].map((x, i) => ({ url: `https://${x}.vn/1`, thuTu: i + 1, laMinh: false, trangThai: "ok", soDo: soDo(), chu: "chữ trang " + x })),
	{ url: "https://f.vn/1", thuTu: 6, laMinh: false, trangThai: "loi", loi: "không tải được" },
	{ url: MINH, thuTu: 9, laMinh: true, trangThai: "ok", soDo: soDo({ viTriTraLoi: 400 }), chu: "chữ trang mình" },
];
const bao = (url, y, them = {}) => ({ url, y, cauTraLoiO: "dau", ruom: [], thieuCanCu: [], khoDung: [], ...them });

test("leo top: khai báo bộ leo_top có index trangThai + taoLuc", () => {
	assert.deepEqual(kho.KHAI_BAO_KHO.leo_top, { indexes: ["trangThai", "taoLuc"] });
	assert.deepEqual(kho.TRANG_THAI_LEO_TOP, ["cho_serp", "cho_doc", "co_phieu", "da_sua", "xong", "bo"]);
});

test("leo top: vòng đời cho_serp → cho_doc → co_phieu → da_sua; sai bước thì ném", async () => {
	const s = taoKhoGia();
	const p = await kho.taoPhienLeoTop(s, PHIEN, new Date(T0).toISOString());
	assert.equal(p.trangThai, "cho_serp");
	assert.equal(p.tuKhoa, "huyệt thần môn");
	assert.equal(p.trangMinh, MINH);
	assert.equal(p.viTriBanDau, 8.4);
	assert.equal(p.hienThi, 300);
	assert.deepEqual(p.serp, []);
	assert.deepEqual(p.doLai, []);
	assert.equal(p.banDo, null);
	assert.equal(p.phieu, null);

	// Chưa có SERP thì chưa ghi sơ hở, chưa đặt đã sửa.
	await assert.rejects(kho.ghiSoHo(s, p.id, [bao("https://a.vn/1", ["x"])], { nowMs: T0 }), /cho_doc/);
	const SAU = { nowMs: T0 + 5 * NGAY_MS };
	await assert.rejects(kho.datDaSua(s, p.id, "2026-10-02", SAU), /co_phieu/);
	await assert.rejects(kho.ghiSerp(s, "khong-co", serpMau()), /Không có/);

	await kho.ghiSerp(s, p.id, serpMau());
	assert.equal((await s.leo_top.get(p.id)).trangThai, "cho_doc");
	// Nộp lại SERP khi còn cho_doc: thay lứa cũ.
	await kho.ghiSerp(s, p.id, serpMau().slice(1));
	assert.equal((await s.leo_top.get(p.id)).serp.length, 6);
	await kho.ghiSerp(s, p.id, serpMau());

	const Y = ["Vị trí huyệt", "Cách bấm huyệt", "Lưu ý"];
	const kq = await kho.ghiSoHo(
		s,
		p.id,
		[
			...["a", "b", "c", "d"].map((x) => bao(`https://${x}.vn/1`, Y)),
			bao(MINH, ["Vị trí huyệt", "Lịch sử tên gọi"], { cauTraLoiO: "giua", ruom: ["Mở đầu dài"] }),
			bao("https://la.vn/1", ["x"]),
		],
		{ nowMs: T0 },
	);
	assert.deepEqual(kq.boQua, ["https://la.vn/1"], "URL không nằm trong SERP");
	assert.deepEqual(kq.thieuBaoCao, ["https://e.vn/1"], "trang đo được mà chưa báo ý → không đưa vào bản đồ");
	const d = await s.leo_top.get(p.id);
	assert.equal(d.trangThai, "co_phieu");
	assert.ok(d.banDo.yCotLoi.some((y) => y.ten === "Cách bấm huyệt"));
	assert.ok(d.phieu.themY.some((y) => /Cách bấm/.test(y)));
	assert.ok(d.phieu.cat.includes("Mở đầu dài"));
	// Chữ trang bỏ sau khi ghi sơ hở; báo cáo của Claude và số đo giữ.
	for (const t of d.serp) assert.equal(t.chu, undefined, t.url);
	assert.deepEqual(d.serp[0].y, Y);
	assert.equal(d.serp[0].soDo.viTriTraLoi, 20);
	// Ghi lại sơ hở khi đã co_phieu thì ném.
	await assert.rejects(kho.ghiSoHo(s, p.id, [bao("https://a.vn/1", Y)], { nowMs: T0 }), /cho_doc/);

	await assert.rejects(kho.datDaSua(s, p.id, "02/10/2026", SAU), /YYYY-MM-DD/);
	await kho.datDaSua(s, p.id, "2026-10-02", SAU);
	const ds = await s.leo_top.get(p.id);
	assert.equal(ds.trangThai, "da_sua");
	assert.equal(ds.ngaySua, "2026-10-02");
	// Sửa lại ngày khi còn da_sua được phép.
	await kho.datDaSua(s, p.id, "2026-10-03", SAU);
	assert.equal((await s.leo_top.get(p.id)).ngaySua, "2026-10-03");
});

const trangSo = (x) => `https://kinhlac.online/huyet/${x}/`;

test("leo top: dsLeoTop xếp mới nhất trước, lọc theo trạng thái; trangDaSoi chặn TRANG soi trong 28 ngày và trang đang chờ đo lại", async () => {
	const s = taoKhoGia();
	const iso = (ngay) => new Date(T0 - ngay * NGAY_MS).toISOString();
	const cu = await kho.taoPhienLeoTop(s, { ...PHIEN, tuKhoa: "cũ", trang: trangSo("cu") }, iso(40));
	await s.leo_top.put(cu.id, { ...(await s.leo_top.get(cu.id)), trangThai: "xong" });
	const moi = await kho.taoPhienLeoTop(s, { ...PHIEN, tuKhoa: "mới", trang: trangSo("moi") }, iso(3));
	const cho = await kho.taoPhienLeoTop(s, { ...PHIEN, tuKhoa: "chờ đo", trang: trangSo("cho") }, iso(35));
	await s.leo_top.put(cho.id, { ...(await s.leo_top.get(cho.id)), trangThai: "da_sua", ngaySua: "2026-09-20" });
	assert.deepEqual((await kho.dsLeoTop(s)).map((p) => p.tuKhoa), ["mới", "chờ đo", "cũ"]);
	assert.deepEqual((await kho.dsLeoTop(s, { trangThai: "da_sua" })).map((p) => p.id), [cho.id]);
	const bo = await kho.trangDaSoi(s, T0);
	// Khoá là khoaUrl của trang (bỏ "/" cuối), không kèm từ khoá.
	assert.deepEqual(bo, new Set([kho.khoaUrl(trangSo("moi")), kho.khoaUrl(trangSo("cho"))]));
	// Cùng từ khoá soi lại sau 28 ngày → phiên MỚI, không đè phiên cũ.
	const lai = await kho.taoPhienLeoTop(s, { ...PHIEN, tuKhoa: "cũ" }, iso(0));
	assert.notEqual(lai.id, cu.id);
	assert.equal(s.leo_top._m.size, 4);
	assert.ok(moi.id);
});

test("leo top: phienCanDoLai đúng mốc +14/+28, không đo lặp; ghiDoLai đủ mốc 28 → xong", async () => {
	const s = taoKhoGia();
	const p = await kho.taoPhienLeoTop(s, PHIEN, new Date(T0).toISOString());
	await s.leo_top.put(p.id, { ...(await s.leo_top.get(p.id)), trangThai: "da_sua", ngaySua: "2026-10-01" });
	const luc = (ngay) => T0 + ngay * NGAY_MS + 3600_000;
	assert.deepEqual(await kho.phienCanDoLai(s, luc(13)), []);
	let can = await kho.phienCanDoLai(s, luc(14));
	assert.deepEqual(can.map((x) => [x.id, x.moc, x.tuKhoa, x.trangMinh]), [[p.id, 14, PHIEN.tuKhoa, MINH]]);
	await kho.ghiDoLai(s, p.id, { ngay: "2026-10-15", sauNgay: 14, viTri: 6.1, hienThi: 120 });
	assert.equal((await s.leo_top.get(p.id)).trangThai, "da_sua");
	assert.deepEqual(await kho.phienCanDoLai(s, luc(20)), [], "mốc 14 đã đo → không đo lặp");
	// Ghi trùng mốc bị bỏ qua.
	await kho.ghiDoLai(s, p.id, { ngay: "2026-10-16", sauNgay: 14, viTri: 1, hienThi: 1 });
	assert.equal((await s.leo_top.get(p.id)).doLai.length, 1);
	can = await kho.phienCanDoLai(s, luc(28));
	assert.deepEqual(can.map((x) => x.moc), [28]);
	await kho.ghiDoLai(s, p.id, { ngay: "2026-10-29", sauNgay: 28, viTri: 4.2, hienThi: 200 });
	const d = await s.leo_top.get(p.id);
	assert.equal(d.trangThai, "xong");
	assert.deepEqual(d.doLai.map((x) => x.sauNgay), [14, 28]);
	assert.deepEqual(await kho.phienCanDoLai(s, luc(60)), []);
});

test("leo top: ca bỏ lỡ mốc 14 (đã qua 30 ngày) → chỉ đo MỘT lần ở mốc 28", async () => {
	const s = taoKhoGia();
	const p = await kho.taoPhienLeoTop(s, PHIEN, new Date(T0).toISOString());
	await s.leo_top.put(p.id, { ...(await s.leo_top.get(p.id)), trangThai: "da_sua", ngaySua: "2026-10-01" });
	assert.deepEqual((await kho.phienCanDoLai(s, T0 + 30 * NGAY_MS)).map((x) => x.moc), [28]);
});

test("leo top: trangDaSoi chặn MỌI phiên chưa kết thúc dù cũ (co_phieu 40 ngày, cho_doc); phiên bo/xong cũ thì mở lại được", async () => {
	const s = taoKhoGia();
	const iso = (ngay) => new Date(T0 - ngay * NGAY_MS).toISOString();
	for (const [tuKhoa, trangThai] of [["phiếu cũ", "co_phieu"], ["đọc dở", "cho_doc"], ["bỏ dở", "bo"], ["xong rồi", "xong"]]) {
		const p = await kho.taoPhienLeoTop(s, { ...PHIEN, tuKhoa, trang: trangSo(trangThai) }, iso(40));
		await s.leo_top.put(p.id, { ...(await s.leo_top.get(p.id)), trangThai });
	}
	const bo = await kho.trangDaSoi(s, T0);
	assert.deepEqual(bo, new Set([kho.khoaUrl(trangSo("cho_doc")), kho.khoaUrl(trangSo("co_phieu"))]));
});

test("leo top: boPhienCu — cho_serp/cho_doc không đụng > 7 ngày → bo (bỏ chữ trang); phiên vừa nộp SERP và co_phieu cũ giữ nguyên; demPhienMo", async () => {
	const s = taoKhoGia();
	const iso = (ngay) => new Date(T0 - ngay * NGAY_MS).toISOString();
	const cu = await kho.taoPhienLeoTop(s, { ...PHIEN, tuKhoa: "cũ" }, iso(8));
	const docCu = await kho.taoPhienLeoTop(s, { ...PHIEN, tuKhoa: "đọc cũ" }, iso(12));
	await kho.ghiSerp(s, docCu.id, serpMau(), iso(9));
	const docMoi = await kho.taoPhienLeoTop(s, { ...PHIEN, tuKhoa: "đọc mới" }, iso(12));
	await kho.ghiSerp(s, docMoi.id, serpMau(), iso(2));
	const phieu = await kho.taoPhienLeoTop(s, { ...PHIEN, tuKhoa: "phiếu" }, iso(30));
	await s.leo_top.put(phieu.id, { ...(await s.leo_top.get(phieu.id)), trangThai: "co_phieu" });
	assert.equal(await kho.demPhienMo(s, T0), 3, "co_phieu ra phiếu 30 ngày trước không tính vào trần");
	assert.equal(await kho.boPhienCu(s, T0), 2);
	const tt = async (id) => (await s.leo_top.get(id)).trangThai;
	assert.deepEqual([await tt(cu.id), await tt(docCu.id), await tt(docMoi.id), await tt(phieu.id)], ["bo", "bo", "cho_doc", "co_phieu"]);
	assert.ok((await s.leo_top.get(docCu.id)).serp.every((t) => t.chu === undefined), "phiên bỏ không giữ chữ trang");
	assert.ok((await s.leo_top.get(docMoi.id)).serp.some((t) => t.chu), "phiên còn cho_doc giữ chữ để Claude đọc");
	assert.equal(await kho.demPhienMo(s, T0), 1);
	// Danh sách không bao giờ trả chữ trang.
	assert.ok((await kho.dsLeoTop(s)).every((p) => p.serp.every((t) => t.chu === undefined)));
});

test("leo top: ghiSoHo từ chối (trạng thái giữ cho_doc) khi trang mình lỗi/thiếu báo cáo hoặc < 2 trang đối thủ có báo cáo; nộp lại SERP để gỡ", async () => {
	const s = taoKhoGia();
	const p = await kho.taoPhienLeoTop(s, PHIEN, new Date(T0).toISOString());
	const Y = ["Vị trí huyệt"];
	const doiThu = ["a", "b", "c"].map((x) => bao(`https://${x}.vn/1`, Y));
	// Trang mình tải lỗi.
	await kho.ghiSerp(s, p.id, serpMau().map((t) => (t.laMinh ? { ...t, trangThai: "loi", loi: "HTTP 500", soDo: undefined, chu: undefined } : t)));
	await assert.rejects(kho.ghiSoHo(s, p.id, [...doiThu, bao(MINH, Y)], { nowMs: T0 }), /trang của mình không tải/);
	assert.equal((await s.leo_top.get(p.id)).trangThai, "cho_doc");
	// Nộp lại SERP (vẫn cho_doc) — trang mình đo được.
	await kho.ghiSerp(s, p.id, serpMau());
	await assert.rejects(kho.ghiSoHo(s, p.id, doiThu, { nowMs: T0 }), /thiếu báo cáo cho trang của mình/);
	await assert.rejects(kho.ghiSoHo(s, p.id, [doiThu[0], bao(MINH, Y), bao("https://f.vn/1", Y)], { nowMs: T0 }), /mới có 1 trang đối thủ.*ít nhất 2.*rada_nop_serp/);
	const d = await s.leo_top.get(p.id);
	assert.equal(d.trangThai, "cho_doc");
	assert.ok(d.serp.some((t) => t.chu), "bị từ chối thì chữ trang còn nguyên");
	const kq = await kho.ghiSoHo(s, p.id, [doiThu[0], doiThu[1], bao(MINH, Y)], { nowMs: T0 });
	assert.equal(kq.soTrangDoiThu, 2);
});

test("leo top: ghiSoHo gửi lại ĐÚNG lượt đã ghi → trả phiếu đã lưu (không ném); lượt khác → ném", async () => {
	const s = taoKhoGia();
	const p = await kho.taoPhienLeoTop(s, PHIEN, new Date(T0).toISOString());
	await kho.ghiSerp(s, p.id, serpMau());
	const lo = [...["a", "b", "c"].map((x) => bao(`https://${x}.vn/1`, ["Vị trí huyệt", "Cách bấm"])), bao(MINH, ["Vị trí huyệt"])];
	const dau = await kho.ghiSoHo(s, p.id, lo, { nowMs: T0 });
	const lai = await kho.ghiSoHo(s, p.id, structuredClone(lo), { nowMs: T0 + 60_000 });
	assert.deepEqual(lai, dau);
	assert.equal((await s.leo_top.get(p.id)).soHoLuc, new Date(T0).toISOString(), "không dựng lại");
	await assert.rejects(kho.ghiSoHo(s, p.id, lo.slice(1), { nowMs: T0 }), /co_phieu/);
});

test("leo top: datDaSua — chỉ ngày có thật, không tương lai (lịch VN), không trước ngày ra phiếu; đổi ngày thì xoá doLai cũ", async () => {
	const s = taoKhoGia();
	const p = await kho.taoPhienLeoTop(s, PHIEN, new Date(T0 - 2 * NGAY_MS).toISOString());
	// Phiếu ra 2026-10-01 07:00 giờ VN.
	await s.leo_top.put(p.id, { ...(await s.leo_top.get(p.id)), trangThai: "co_phieu", soHoLuc: new Date(T0).toISOString() });
	const luc = { nowMs: Date.parse("2026-10-20T18:00:00.000Z") }; // = 2026-10-21 01:00 VN
	await assert.rejects(kho.datDaSua(s, p.id, "2026-02-31", luc), /ngày có thật/);
	await assert.rejects(kho.datDaSua(s, p.id, "2026-10-22", luc), /tương lai/);
	await assert.rejects(kho.datDaSua(s, p.id, "2026-09-30", luc), /trước ngày ra phiếu 2026-10-01/);
	await kho.datDaSua(s, p.id, "2026-10-21", luc); // hôm nay theo VN dù UTC còn 20/10
	await kho.datDaSua(s, p.id, "2026-10-01", luc);
	await kho.ghiDoLai(s, p.id, { ngay: "2026-10-15", sauNgay: 14, viTri: 5, hienThi: 9 });
	await kho.datDaSua(s, p.id, "2026-10-01", luc);
	assert.equal((await s.leo_top.get(p.id)).doLai.length, 1, "cùng ngày → giữ lần đo");
	await kho.datDaSua(s, p.id, "2026-10-05", luc);
	const d = await s.leo_top.get(p.id);
	assert.deepEqual(d.doLai, [], "đổi ngày sửa → đo lại từ đầu");
	assert.equal(d.ngaySua, "2026-10-05");
});

// ---- Task 6: trần phiên mở, hiển thị/ngày, đo lại theo ngày sửa ----

test("leo top: demPhienMo chỉ tính co_phieu ra phiếu trong 30 ngày; co_phieu cũ hơn vẫn giữ trạng thái và vẫn chặn cặp", async () => {
	assert.equal(kho.NGAY_PHIEU_TINH_TRAN, 30);
	const s = taoKhoGia();
	const iso = (ngay) => new Date(T0 - ngay * NGAY_MS).toISOString();
	await kho.taoPhienLeoTop(s, { ...PHIEN, tuKhoa: "chờ serp" }, iso(1));
	const moi = await kho.taoPhienLeoTop(s, { ...PHIEN, tuKhoa: "phiếu mới" }, iso(40));
	await s.leo_top.put(moi.id, { ...(await s.leo_top.get(moi.id)), trangThai: "co_phieu", soHoLuc: iso(29) });
	const cu = await kho.taoPhienLeoTop(s, { ...PHIEN, tuKhoa: "phiếu cũ" }, iso(40));
	await s.leo_top.put(cu.id, { ...(await s.leo_top.get(cu.id)), trangThai: "co_phieu", soHoLuc: iso(31) });
	// Không có soHoLuc (bản ghi cũ) → lùi về taoLuc.
	const khongMoc = await kho.taoPhienLeoTop(s, { ...PHIEN, tuKhoa: "không mốc" }, iso(45));
	await s.leo_top.put(khongMoc.id, { ...(await s.leo_top.get(khongMoc.id)), trangThai: "co_phieu" });
	assert.equal(await kho.demPhienMo(s, T0), 2, "chờ serp + phiếu mới");
	assert.equal((await s.leo_top.get(cu.id)).trangThai, "co_phieu", "không tự đổi trạng thái");
	const bo = await kho.trangDaSoi(s, T0);
	assert.ok(bo.has(kho.khoaUrl(MINH)), "trang của phiếu cũ vẫn bị chặn soi lại");
	// Vẫn đánh dấu đã sửa được.
	await kho.datDaSua(s, cu.id, "2026-10-01", { nowMs: T0 + 12 * 3600_000 });
	assert.equal((await s.leo_top.get(cu.id)).trangThai, "da_sua");
});

test("leo top: hiển thị/ngày — mốc ban đầu chia cho số ngày LỊCH của cửa sổ GSC (28 ngày lùi + hôm nay = 29)", async () => {
	const s = taoKhoGia();
	const p = await kho.taoPhienLeoTop(s, { ...PHIEN, hienThi: 290 }, new Date(T0).toISOString());
	assert.deepEqual(p.cuaSoBanDau, { soNgay: 29, tu: "2026-09-03", den: "2026-10-01" });
	assert.equal(p.hienThiNgay, 10.74); // 290 / (29 − 2 ngày GSC chưa có số)
	assert.equal(kho.hienThiMoiNgay(100, 11), 11.11); // 100 / (11 − 2 ngày GSC chưa có số)
	assert.equal(kho.hienThiMoiNgay(29, 29), 1.07);
	assert.equal(kho.hienThiMoiNgay(10, 2), 10);
	assert.equal(kho.hienThiMoiNgay(5, 0), null);
	assert.equal(kho.hienThiMoiNgay(null, 11), null);
});

test("leo top: ghiDoLai lưu hienThiNgay; bỏ qua khi ngày sửa của phiên đã đổi so với lúc ca tính", async () => {
	const s = taoKhoGia();
	const p = await kho.taoPhienLeoTop(s, PHIEN, new Date(T0).toISOString());
	await s.leo_top.put(p.id, { ...(await s.leo_top.get(p.id)), trangThai: "da_sua", ngaySua: "2026-10-05" });
	// Ca đã tính theo ngày sửa 01/10, người quản trị đổi sang 05/10 giữa chừng → không ghi.
	assert.equal(await kho.ghiDoLai(s, p.id, { ngaySua: "2026-10-01", ngay: "2026-10-15", sauNgay: 14, viTri: 5, hienThi: 110, cuaSoNgay: 11 }), false);
	assert.deepEqual((await s.leo_top.get(p.id)).doLai, []);
	assert.equal(await kho.ghiDoLai(s, p.id, { ngaySua: "2026-10-05", ngay: "2026-10-19", sauNgay: 14, viTri: 5, hienThi: 110, cuaSoNgay: 11 }), true);
	assert.deepEqual((await s.leo_top.get(p.id)).doLai, [{ ngay: "2026-10-19", sauNgay: 14, viTri: 5, hienThi: 110, cuaSoNgay: 11, hienThiNgay: 12.22 }]);
});

test("leo top: phienCanDoLai trả kèm ngaySua (để ghiDoLai so lại)", async () => {
	const s = taoKhoGia();
	const p = await kho.taoPhienLeoTop(s, PHIEN, new Date(T0).toISOString());
	await s.leo_top.put(p.id, { ...(await s.leo_top.get(p.id)), trangThai: "da_sua", ngaySua: "2026-10-01" });
	const [x] = await kho.phienCanDoLai(s, T0 + 14 * NGAY_MS + 3600_000);
	assert.equal(x.ngaySua, "2026-10-01");
});

// ---- Sửa sau nghiệm thu 2D ----

test("leo top: taoPhienLeoTop lưu tuKhoaPhu (≤ 5, chỉ tuKhoa/viTri/hienThi); thiếu thì mảng rỗng", async () => {
	const s = taoKhoGia();
	const phu = Array.from({ length: 7 }, (_, i) => ({ tuKhoa: `phụ ${i}`, viTri: 9.123, hienThi: 50 - i, trang: "x", coHoi: 3 }));
	const p = await kho.taoPhienLeoTop(s, { ...PHIEN, tuKhoaPhu: phu }, new Date(T0).toISOString());
	const d = await s.leo_top.get(p.id);
	assert.equal(d.tuKhoaPhu.length, 5);
	assert.deepEqual(d.tuKhoaPhu[0], { tuKhoa: "phụ 0", viTri: 9.12, hienThi: 50 });
	const k = await kho.taoPhienLeoTop(s, { ...PHIEN, tuKhoa: "khác" }, new Date(T0 + 1).toISOString());
	assert.deepEqual(k.tuKhoaPhu, []);
});

// ---- Nháp lò viết (2C-3) ----
test("nhap: khai báo bộ + trạng thái", () => {
	assert.deepEqual(kho.KHAI_BAO_KHO.nhap, { indexes: ["keHoachId", "trangThai", "taoLuc"] });
	assert.deepEqual(kho.TRANG_THAI_NHAP, ["cho_duyet", "da_dang"]);
	assert.ok(taoKhoGia().nhap, "kho giả phải có bộ nhap");
});

test("nhap: ghi theo contentId, đếm và liệt kê theo trạng thái", async () => {
	const s = taoKhoGia();
	await kho.themNhap(s, { keHoachId: "k_1", contentId: "c1", slug: "a", tieuDe: "A", tuKhoa: ["x"], phieu: {} }, NOW);
	await kho.themNhap(s, { keHoachId: "k_2", contentId: "c2", slug: "b", tieuDe: "B", tuKhoa: [], phieu: {} }, NOW);
	await s.nhap.put("c3", { keHoachId: "k_3", contentId: "c3", trangThai: "da_dang", taoLuc: NOW });
	const c1 = await s.nhap.get("c1");
	assert.equal(c1.trangThai, "cho_duyet");
	assert.equal(c1.taoLuc, NOW);
	assert.equal(await kho.demNhap(s, "cho_duyet"), 2);
	assert.equal((await kho.dsNhap(s)).length, 3);
	assert.deepEqual((await kho.dsNhap(s, { trangThai: "da_dang" })).map((n) => n.id), ["c3"]);
});

test("nhap: contentId trống bị từ chối", async () => {
	await assert.rejects(() => kho.themNhap(taoKhoGia(), { keHoachId: "k", contentId: "" }, NOW), /contentId/);
});

// ---- Sửa sau rà soát 2C-3 (I3): trạng thái can_xem ----

test("can_xem: có trong TRANG_THAI_KE_HOACH; người quản trị chỉ đưa về da_duyet (đặt lại bộ đếm lò viết) hoặc bo_qua", async () => {
	assert.ok(kho.TRANG_THAI_KE_HOACH.includes("can_xem"));
	const s = taoKhoGia();
	await s.huong.put("h_1", { ten: "H", trangThai: "da_nhan", trongSo: 3 });
	await s.cum_nghia.put("c_1", { huongId: "h_1", ten: "C", trangThai: "de_xuat" });
	const [k] = await kho.themKeHoach(s, [{ cumId: "c_1", huongId: "h_1", tieuDeLamViec: "Bài", tuKhoaChinh: "bài" }], NOW);
	const cx = { ...(await s.ke_hoach.get(k.id)), trangThai: "can_xem", soLanNop: 3, soLanGiao: 2, giuLuc: NOW, loiCuoi: ["lien_ket: thiếu"], lyDoCanXem: "nộp 3 lượt đều trượt" };
	await s.ke_hoach.put(k.id, cx);
	await assert.rejects(kho.datKeHoach(s, k.id, { trangThai: "de_xuat" }), /cần xem lại/);
	await kho.datKeHoach(s, k.id, { trangThai: "da_duyet" });
	const r = await s.ke_hoach.get(k.id);
	assert.equal(r.trangThai, "da_duyet");
	for (const x of ["soLanNop", "soLanGiao", "giuLuc", "loiCuoi", "lyDoCanXem"]) assert.ok(!(x in r), x);
	await s.ke_hoach.put(k.id, cx);
	await kho.datKeHoach(s, k.id, { trangThai: "bo_qua", lyDoBo: "link đích chết" });
	assert.equal((await s.ke_hoach.get(k.id)).trangThai, "bo_qua");
});

test("themKeHoach: đề xuất lại một bài đang ở lò viết → GIỮ bộ đếm, giữ chỗ, contentId, loiCuoi (không đặt lại lặng lẽ)", async () => {
	const s = taoKhoGia();
	const [k] = await kho.themKeHoach(s, [{ cumId: "c_1", tieuDeLamViec: "Trà hoa cúc", tuKhoaChinh: "trà hoa cúc" }], NOW);
	const lo = { trangThai: "dang_viet", giuLuc: NOW, soLanNop: 2, soLanGiao: 1, contentId: "c9", slug: "tra", loiCuoi: ["x"], lyDoCanXem: "y" };
	await s.ke_hoach.put(k.id, { ...(await s.ke_hoach.get(k.id)), ...lo });
	await kho.themKeHoach(s, [{ cumId: "c_1", tieuDeLamViec: "trà hoa cúc!", tuKhoaChinh: "trà hoa cúc" }], "sau");
	const r = await s.ke_hoach.get(k.id);
	for (const [x, v] of Object.entries(lo)) assert.deepEqual(r[x], v, x);
});

test("ghiCa: dòng có slug (kiểu indexnow) mang khoá riêng theo kiểu + slug — hai bài báo cùng mili-giây không đè nhau; ca radar giữ khoá cũ", async () => {
	const s = taoKhoGia();
	const luc = "2026-10-01T07:05:00.000Z";
	await kho.ghiCa(s, { loai: "indexnow", kieu: "dang", slug: "a", batDau: luc });
	await kho.ghiCa(s, { loai: "indexnow", kieu: "dang", slug: "b", batDau: luc });
	await kho.ghiCa(s, { loai: "indexnow", kieu: "go", slug: "a", batDau: luc });
	await kho.ghiCa(s, { loai: "radar", batDau: luc });
	assert.equal((await kho.dsCa(s, 10)).length, 4);
	assert.ok(await s.ca.get(`${luc}-radar`), "khoá ca radar không đổi");
});

// Khoá của cụm là băm của TÊN, nên hai cụm trùng tên đè nhau. Bản cũ trả về số mục NỘP: ngày
// 02/10/2026 nó báo "ghi 27" trong khi kho chỉ có 24 dòng. Con số phải khớp số dòng thật.
test("thayCum: cụm trùng tên gộp lại, trả về số DÒNG thật và giữ bản điểm cao hơn", async () => {
	const s = taoKhoGia();
	const n = await kho.thayCum(s, [
		{ tenCum: "Đau lưng", tuKhoa: ["đau lưng"], diem: 4, soBai: 1 },
		{ tenCum: "Đau lưng", tuKhoa: ["đau lưng", "thoát vị"], diem: 9, soBai: 5 },
		{ tenCum: "Mất ngủ", tuKhoa: ["mất ngủ"], diem: 6, soBai: 2 },
	], "2026-10-02T00:00:00.000Z", { nghi: async () => {} });
	const trong = (await s.cum.query({ limit: 100 })).items;
	assert.equal(n, 2, "phải đếm số dòng thật, không đếm số mục nộp");
	assert.equal(trong.length, n, "số trả về PHẢI khớp số dòng trong kho");
	const dauLung = trong.find((x) => x.data.tenCum === "Đau lưng");
	assert.equal(dauLung.data.diem, 9, "cùng tên thì giữ bản điểm cao hơn");
	assert.deepEqual(dauLung.data.tuKhoa, ["đau lưng", "thoát vị"]);
});
