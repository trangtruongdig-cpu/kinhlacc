import { test } from "node:test";
import assert from "node:assert/strict";
import * as dang from "./dang.mjs";
import * as kho from "../kho.mjs";
import { taoKhoGia } from "../__test__/kho-gia.mjs";

const khoi = (chu, them = {}) => ({ _type: "block", _key: `k${chu.length}`, style: "normal", markDefs: [], children: [{ _type: "span", _key: "s", text: chu, marks: [] }], ...them });
const ANH_DUNG = { _type: "image", _key: "a1", asset: { _ref: "m1", url: "/_emdash/api/media/file/01M3SB41DRC7B9SQMJRP74P0JF.png" }, alt: "Huyệt" };
/** Dạng event đo được ở spike 4d: content là mục đầy đủ, trường ở content.data (đã trộn bản nháp). */
const suKien = (data, { id = "c1", collection = "bai_viet" } = {}) => ({
	collection,
	content: { id, slug: "x", status: "draft", data, liveData: {} },
	origin: { source: "api" },
	actor: { id: "u", role: 50, source: "api" },
});
const logGia = () => {
	const ghi = [];
	return { ghi, log: { warn: (...a) => ghi.push(["warn", ...a]), error: (...a) => ghi.push(["error", ...a]), info: (...a) => ghi.push(["info", ...a]) } };
};
const ctxGia = () => ({ storage: taoKhoGia(), ...logGia() });

test("anhHong: khối ảnh PT chỉ đạt khi asset.url = /_emdash/api/media/file/<key có đuôi>; khối kiểu lạ khác không bị xét", () => {
	const pt = [
		khoi("Mở bài"),
		ANH_DUNG,
		{ _type: "image", _key: "a2", asset: { _ref: "m2" } }, // _ref trần → 404
		{ _type: "image", _key: "a3", asset: { _ref: "m3", url: "/_emdash/api/media/asset/m3/a.png" } }, // url media.list → 401
		{ _type: "image", _key: "a4", asset: { url: "/_emdash/api/media/file/01ABC" } }, // thiếu đuôi
		{ _type: "image", _key: "a5", asset: { url: "https://ngoai.vn/_emdash/api/media/file/a.png" } },
		{ _type: "image", _key: "a6", asset: { url: "/_emdash/api/media/file/../x.png" } },
		{ _type: "callout", _key: "c", text: "khối lạ do người biên tập chèn" },
	];
	assert.deepEqual(dang.anhHong(pt), [3, 4, 5, 6, 7]);
	assert.deepEqual(dang.anhHong(undefined), []);
});

test("soatBai: Y sỹ trên tiêu đề, mô tả, thân (rút từ PT) và FAQ; bài người viết dùng chế độ THƯỜNG, bài máy viết NGHIÊM", () => {
	const data = {
		title: "Châm cứu chữa mất ngủ",
		description: "Mô tả sạch.",
		content: [khoi("Đoạn một sạch."), khoi("Cam kết khỏi hẳn sau 3 buổi.")],
		faq: [{ q: "Có đau không?", a: "Đi khám bệnh ở phòng chẩn trị." }],
	};
	const thuong = dang.soatBai(data);
	assert.deepEqual(thuong.viPham.map((v) => [v.cho, v.ma]), [["tiêu đề", "chua"], ["thân bài", "hua_khoi"], ["FAQ", "kham_benh"]]);
	// "bác sĩ" trần: chế độ thường cho qua, nghiêm thì bắt.
	const bs = { title: "Tiêu đề sạch", description: "Hỏi ý kiến bác sĩ trước khi dùng.", content: [] };
	assert.deepEqual(dang.soatBai(bs).viPham, []);
	assert.deepEqual(dang.soatBai(bs, { nghiem: true }).viPham.map((v) => v.ma), ["bac_si"]);
});

test("truocKhiDang: bài sạch → cho qua (undefined); bộ khác bai_viet không bị xét", async () => {
	const ctx = ctxGia();
	assert.equal(await dang.truocKhiDang(suKien({ title: "Sạch", description: "Sạch", content: [khoi("Sạch."), ANH_DUNG] }), ctx), undefined);
	assert.equal(await dang.truocKhiDang(suKien({ title: "Châm cứu chữa bệnh" }, { collection: "huyet_vi" }), ctx), undefined);
});

test("truocKhiDang: vi phạm → {cancel, reason} liệt kê ≤ 3 chữ kèm gợi ý + số chỗ còn lại; ảnh hỏng → nêu khối", async () => {
	const ctx = ctxGia();
	const kq = await dang.truocKhiDang(
		suKien({
			title: "Châm cứu chữa mất ngủ",
			description: "Thăm khám miễn phí.",
			content: [khoi("Trị dứt điểm."), khoi("Đặc trị đau lưng."), { _type: "image", _key: "x", asset: { _ref: "m" } }],
		}),
		ctx,
	);
	assert.equal(Object.keys(kq).length, 2);
	assert.equal(kq.cancel, true);
	assert.match(kq.reason, /phạm vi hành nghề Y sỹ/);
	assert.match(kq.reason, /"chữa" \(tiêu đề\) → hỗ trợ/);
	assert.match(kq.reason, /"thăm khám" \(mô tả\)/);
	assert.match(kq.reason, /và 2 chỗ khác/); // trị (hai lần, gộp), dứt điểm, đặc trị → 5 chữ khác nhau, nêu 3
	assert.match(kq.reason, /khối 3/);
	assert.match(kq.reason, /\/_emdash\/api\/media\/file\//);
	assert.ok([...kq.reason].length <= 500);
	// Không ký tự điều khiển cấm (EmDash coi quyết định có chúng là KHÔNG hợp lệ).
	assert.ok(![...kq.reason].some((c) => c.codePointAt(0) < 32 && !"\t\n\r".includes(c)));
});

test("truocKhiDang: lý do rất dài vẫn ≤ 500 ký tự (trần của EmDash)", async () => {
	const dai = "chữa ".repeat(10) + "x".repeat(900);
	const kq = await dang.truocKhiDang(suKien({ title: dai, description: dai, content: [khoi(`Chữa ${"y".repeat(900)}`)] }), ctxGia());
	assert.equal(kq.cancel, true);
	assert.ok([...kq.reason].length <= 500, `dài ${[...kq.reason].length}`);
});

test("truocKhiDang: bài MÁY viết (có bản ghi nhap) soát NGHIÊM — 'bác sĩ' bị chặn", async () => {
	const ctx = ctxGia();
	const data = { title: "Tiêu đề sạch", description: "Nên hỏi bác sĩ.", content: [] };
	assert.equal(await dang.truocKhiDang(suKien(data), ctx), undefined);
	await kho.themNhap(ctx.storage, { keHoachId: "k1", contentId: "c1", slug: "s", tieuDe: "t", phieu: {} }, "2026-09-30T00:00:00.000Z");
	const kq = await dang.truocKhiDang(suKien(data), ctx);
	assert.equal(kq?.cancel, true);
	assert.match(kq.reason, /bác sĩ/);
});

test("truocKhiDang: lỗi nội bộ (event dị dạng, kho hỏng) → KHÔNG chặn, ghi log", async () => {
	const ctx = ctxGia();
	ctx.storage.nhap.get = async () => {
		throw new Error("kho sập");
	};
	// Kho hỏng: vẫn soát (chế độ thường) và vẫn chặn vi phạm thật; không ném.
	const kq = await dang.truocKhiDang(suKien({ title: "Chữa bệnh", content: [] }), ctx);
	assert.equal(kq?.cancel, true);
	// Event dị dạng: cho qua + log lỗi.
	const ctx2 = ctxGia();
	const hong = { collection: "bai_viet", get content() { throw new Error("dị dạng"); } };
	assert.equal(await dang.truocKhiDang(hong, ctx2), undefined);
	assert.ok(ctx2.ghi.some((g) => g[0] === "error"));
	assert.equal(await dang.truocKhiDang(null, ctx2), undefined);
});

test("truocKhiDang: nhanh — bài 40.000 ký tự, 400 khối < 1 s", async () => {
	const content = Array.from({ length: 400 }, (_, i) => khoi(`Đoạn ${i} nói về huyệt Thần Môn và giấc ngủ theo lý luận Đông y. `.repeat(2)));
	const t0 = performance.now();
	await dang.truocKhiDang(suKien({ title: "Sạch", description: "Sạch", content }), ctxGia());
	assert.ok(performance.now() - t0 < 1000);
});

test("sauKhiDang: nháp → da_dang, kế hoạch → da_dang (kể cả đang can_xem); bộ khác / id lạ thì không làm gì", async () => {
	const ctx = ctxGia();
	const s = ctx.storage;
	await s.ke_hoach.put("k1", { trangThai: "co_nhap", contentId: "c1", tieuDeLamViec: "A" });
	await kho.themNhap(s, { keHoachId: "k1", contentId: "c1", slug: "s", tieuDe: "A", phieu: {} }, "2026-09-30T00:00:00.000Z");
	await dang.sauKhiDang({ collection: "huyet_vi", content: { id: "c1" } }, ctx);
	assert.equal((await s.nhap.get("c1")).trangThai, "cho_duyet");
	await dang.sauKhiDang({ collection: "bai_viet", content: { id: "c1", status: "published", publishedAt: "2026-09-30T10:00:00.000Z" } }, ctx);
	const n = await s.nhap.get("c1");
	assert.equal(n.trangThai, "da_dang");
	assert.equal(n.dangLuc, "2026-09-30T10:00:00.000Z");
	assert.equal((await s.ke_hoach.get("k1")).trangThai, "da_dang");
	// Bài người viết (không có nhap): im lặng.
	await dang.sauKhiDang({ collection: "bai_viet", content: { id: "zzz" } }, ctx);
	assert.equal(ctx.ghi.filter((g) => g[0] === "error").length, 0);
});

test("sauKhiDang: nháp mồ côi (kế hoạch can_xem mang contentId, không có bản ghi nhap) → kế hoạch da_dang", async () => {
	const ctx = ctxGia();
	await ctx.storage.ke_hoach.put("k2", { trangThai: "can_xem", contentId: "c9", lyDoCanXem: "x", taoLuc: "t" });
	await ctx.storage.ke_hoach.put("k3", { trangThai: "can_xem", contentId: "c8", taoLuc: "t" });
	await dang.sauKhiDang({ collection: "bai_viet", content: { id: "c9" } }, ctx);
	assert.equal((await ctx.storage.ke_hoach.get("k2")).trangThai, "da_dang");
	assert.equal((await ctx.storage.ke_hoach.get("k3")).trangThai, "can_xem");
});

test("sauKhiDang: lỗi kho → không ném, ghi log", async () => {
	const ctx = ctxGia();
	ctx.storage.nhap.get = async () => {
		throw new Error("kho sập");
	};
	await dang.sauKhiDang({ collection: "bai_viet", content: { id: "c1" } }, ctx);
	assert.ok(ctx.ghi.some((g) => g[0] === "error"));
});

const PHIEU = {
	seo: [{ ma: "a", dat: true, ghiChu: "ok" }, { ma: "b", dat: false, ghiChu: "Tiêu đề thiếu từ khoá" }],
	ymyl: [{ loai: "lieu", doan: "6g" }],
	khuonCanhBao: [{ ma: "do_dai", ghiChu: "800 từ, ngoài khoảng 900–2.200" }],
	nguonBo: [{ title: "X", lyDo: "khong_doc_duoc" }],
	linkGo: [],
	anh: { mediaId: "m1", alt: "Huyệt Thần Môn", lyDo: "trụ cột" },
	soTu: 800,
};

test("tomTatPhieu: đếm SEO đạt/tổng, tiêu chí trượt, YMYL, cảnh báo, nguồn/link bị bỏ, ảnh; KHÔNG khuyên viết dài", () => {
	const t = dang.tomTatPhieu(PHIEU);
	assert.equal(t.seo, "1/2");
	assert.deepEqual(t.seoTruot, ["Tiêu đề thiếu từ khoá"]);
	assert.equal(t.ymyl, 1);
	assert.deepEqual(t.canhBao, ["800 từ, ngoài khoảng 900–2.200"]);
	assert.equal(t.nguonBo, 1);
	assert.equal(t.linkGo, 0);
	assert.equal(t.anh, "Huyệt Thần Môn");
	assert.equal(t.soTu, 800);
	assert.doesNotMatch(JSON.stringify(t), /dài hơn/);
	assert.deepEqual(dang.tomTatPhieu(undefined).seo, "0/0");
});

test("khoiPanel: bài máy viết → phiếu + soát Y sỹ hiện tại; bài người viết → chỉ soát; chưa lưu → lời nhắc", () => {
	const may = dang.khoiPanel({ nhap: { keHoachId: "k1", trangThai: "cho_duyet", taoLuc: "2026-09-30T00:00:00.000Z", phieu: PHIEU }, soat: { viPham: [], anhHong: [] } });
	const chu = JSON.stringify(may);
	assert.equal(may[0].type, "header");
	assert.match(chu, /1\/2/);
	assert.match(chu, /Không thấy chữ vượt phạm vi Y sỹ/);
	for (const b of may) assert.ok(["header", "section", "fields", "context", "divider", "banner"].includes(b.type), b.type);
	const nguoi = dang.khoiPanel({ nhap: null, soat: { viPham: [{ cho: "tiêu đề", ma: "chua", tu: "chữa", goiY: "hỗ trợ" }], anhHong: [2] } });
	const c2 = JSON.stringify(nguoi);
	assert.match(c2, /chữa/);
	assert.match(c2, /khối 2/);
	assert.match(c2, /không do Rada SEO viết/);
	assert.match(JSON.stringify(dang.khoiPanel({ chuaLuu: true })), /Lưu bài/);
});

test("dsNhapChoTab: nháp (mới trước) kèm tên kế hoạch + phiếu tóm tắt + link trình sửa; kế hoạch can_xem có contentId mà không có nhap → mồ côi", async () => {
	const s = taoKhoGia();
	await s.ke_hoach.put("k1", { trangThai: "co_nhap", tieuDeLamViec: "Mất ngủ", contentId: "c1", taoLuc: "t" });
	await s.ke_hoach.put("k2", { trangThai: "can_xem", tieuDeLamViec: "Đau lưng", contentId: "c2", slug: "dau-lung", lyDoCanXem: "hết lượt", taoLuc: "t" });
	await s.ke_hoach.put("k3", { trangThai: "can_xem", tieuDeLamViec: "Không nháp", taoLuc: "t" });
	await kho.themNhap(s, { keHoachId: "k1", contentId: "c1", slug: "mat-ngu", tieuDe: "Mất ngủ theo Đông y", phieu: PHIEU }, "2026-09-29T00:00:00.000Z");
	await kho.themNhap(s, { keHoachId: "kx", contentId: "c0", slug: "cu", tieuDe: "Cũ", phieu: {} }, "2026-09-28T00:00:00.000Z");
	const r = await dang.dsNhapChoTab(s);
	assert.deepEqual(r.nhap.map((n) => n.id), ["c1", "c0"]);
	assert.equal(r.nhap[0].tenKeHoach, "Mất ngủ");
	assert.equal(r.nhap[0].trangThaiKeHoach, "co_nhap");
	assert.equal(r.nhap[0].adminUrl, "/_emdash/admin/content/bai_viet/c1");
	assert.equal(r.nhap[0].tomTat.seo, "1/2");
	assert.equal(r.nhap[0].phieu, undefined); // gọn: chỉ tóm tắt
	assert.equal(r.nhap[1].tenKeHoach, "");
	assert.deepEqual(r.moCoi.map((k) => [k.id, k.contentId, k.adminUrl]), [["k2", "c2", "/_emdash/admin/content/bai_viet/c2"]]);
});
