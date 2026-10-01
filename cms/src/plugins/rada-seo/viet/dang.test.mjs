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

// ---- Sửa sau rà soát việc 4 ----

test("truocKhiDang: vi phạm ở chế độ THƯỜNG → chặn ngay, KHÔNG chạm sổ nháp", async () => {
	const ctx = ctxGia();
	let goi = 0;
	ctx.storage.nhap.get = async () => {
		goi++;
		return null;
	};
	ctx.storage.ke_hoach.query = async () => {
		goi++;
		return { items: [], hasMore: false };
	};
	const kq = await dang.truocKhiDang(suKien({ title: "Châm cứu chữa mất ngủ", content: [] }), ctx);
	assert.equal(kq?.cancel, true);
	assert.equal(goi, 0);
});

test("truocKhiDang: sổ nháp CHẬM → hết hạn tra thì giữ kết quả chế độ thường (cho qua), ghi warn, không đợi kho", async () => {
	assert.equal(dang.HAN_TRA_NHAP_MS, 600);
	const ctx = ctxGia();
	ctx.storage.nhap.get = () => new Promise((r) => setTimeout(() => r({ keHoachId: "k1" }), 3000).unref());
	const data = { title: "Tiêu đề sạch", description: "Nên hỏi bác sĩ.", content: [] };
	const t0 = performance.now();
	const kq = await dang.truocKhiDang(suKien(data), ctx, { hanTraMs: 40 });
	assert.equal(kq, undefined, "hết hạn → chế độ thường, 'bác sĩ' trần được qua");
	assert.ok(performance.now() - t0 < 500);
	assert.ok(ctx.ghi.some((g) => g[0] === "warn"));
	// Mặc định (600 ms) vẫn dưới timeout 4000 của hook.
	const t1 = performance.now();
	assert.equal(await dang.truocKhiDang(suKien(data), ctx), undefined);
	const ms = performance.now() - t1;
	assert.ok(ms >= 550 && ms < 1500, `${ms} ms`);
});

test("truocKhiDang: nháp MỒ CÔI (kế hoạch mang contentId, không có bản ghi nhap) cũng soát NGHIÊM", async () => {
	const ctx = ctxGia();
	const data = { title: "Tiêu đề sạch", description: "Nên hỏi bác sĩ.", content: [] };
	await ctx.storage.ke_hoach.put("k2", { trangThai: "can_xem", contentId: "c1", taoLuc: "t" });
	assert.equal((await dang.truocKhiDang(suKien(data), ctx))?.cancel, true);
	const ctx2 = ctxGia();
	await ctx2.storage.ke_hoach.put("k3", { trangThai: "dang_viet", contentId: "c1", taoLuc: "t" });
	assert.equal((await dang.truocKhiDang(suKien(data), ctx2))?.cancel, true);
	// Kế hoạch mang contentId KHÁC → bài người viết, thường.
	assert.equal(await dang.truocKhiDang(suKien(data, { id: "c7" }), ctx), undefined);
});

test("truocKhiDang dùng cho content:beforeSchedule: event có scheduledAt → lời nói 'hẹn giờ', cùng hình {cancel, reason}", async () => {
	const ev = { ...suKien({ title: "Châm cứu chữa mất ngủ", content: [] }), scheduledAt: "2026-10-01T00:00:00.000Z" };
	const kq = await dang.truocKhiDang(ev, ctxGia());
	assert.deepEqual(Object.keys(kq).sort(), ["cancel", "reason"]);
	assert.match(kq.reason, /^Chưa hẹn giờ đăng được\./);
	assert.match((await dang.truocKhiDang(suKien({ title: "Chữa" }), ctxGia())).reason, /^Chưa đăng được\./);
});

test("sauKhiGo (afterUnpublish): nháp da_dang → cho_duyet, kế hoạch da_dang → co_nhap; mồ côi → can_xem; bộ khác / lỗi kho không làm gì", async () => {
	const ctx = ctxGia();
	const s = ctx.storage;
	await s.ke_hoach.put("k1", { trangThai: "da_dang", contentId: "c1", dangLuc: "x", taoLuc: "t" });
	await kho.themNhap(s, { keHoachId: "k1", contentId: "c1", slug: "s", tieuDe: "A", phieu: {} }, "2026-09-30T00:00:00.000Z");
	await s.nhap.put("c1", { ...(await s.nhap.get("c1")), trangThai: "da_dang", dangLuc: "2026-09-30T10:00:00.000Z" });
	await dang.sauKhiGo({ collection: "huyet_vi", content: { id: "c1" } }, ctx);
	assert.equal((await s.nhap.get("c1")).trangThai, "da_dang");
	await dang.sauKhiGo({ collection: "bai_viet", content: { id: "c1", status: "draft" } }, ctx);
	const n = await s.nhap.get("c1");
	assert.equal(n.trangThai, "cho_duyet");
	assert.equal(n.dangLuc, undefined);
	const k = await s.ke_hoach.get("k1");
	assert.equal(k.trangThai, "co_nhap");
	assert.equal(k.dangLuc, undefined);
	// Mồ côi: kế hoạch da_dang mang contentId, không có nhap → can_xem (để tab Nháp còn thấy nó).
	await s.ke_hoach.put("k2", { trangThai: "da_dang", contentId: "c9", taoLuc: "t" });
	await dang.sauKhiGo({ collection: "bai_viet", content: { id: "c9" } }, ctx);
	const k2 = await s.ke_hoach.get("k2");
	assert.equal(k2.trangThai, "can_xem");
	assert.match(k2.lyDoCanXem, /gỡ/);
	// Bài người viết: im lặng.
	await dang.sauKhiGo({ collection: "bai_viet", content: { id: "zzz" } }, ctx);
	assert.equal(ctx.ghi.filter((g) => g[0] === "error").length, 0);
	const ctx2 = ctxGia();
	ctx2.storage.nhap.get = async () => {
		throw new Error("kho sập");
	};
	await dang.sauKhiGo({ collection: "bai_viet", content: { id: "c1" } }, ctx2);
	assert.ok(ctx2.ghi.some((g) => g[0] === "error"));
});

const ctxPanel = (content, id = "c1") => ({ ...ctxGia(), content, ui: { entry: { collection: "bai_viet", id } } });

test("taiPanel: có draftRevisionId + getRevision → soát trên CỘT trộn REVISION (bỏ khoá '_'), nhãn 'bản nháp đã lưu gần nhất'", async () => {
	const goi = [];
	const content = {
		async get(bo, id) {
			return { id, draftRevisionId: "r9", data: { title: "Tiêu đề chữa bệnh cũ", description: "Sạch.", content: [] } };
		},
		async getRevision(bo, id, rev) {
			goi.push([bo, id, rev]);
			return { id: rev, data: { title: "Tiêu đề đã sửa sạch", description: "Nên hỏi bác sĩ.", _slug: "chữa-bệnh" } };
		},
	};
	const ctx = ctxPanel(content);
	await kho.themNhap(ctx.storage, { keHoachId: "k1", contentId: "c1", slug: "s", tieuDe: "Tiêu đề máy viết", phieu: {} }, "2026-09-30T00:00:00.000Z");
	const kq = await dang.taiPanel(ctx);
	assert.deepEqual(goi, [["bai_viet", "c1", "r9"]]);
	const chu = JSON.stringify(kq.blocks);
	assert.doesNotMatch(chu, /"chữa"/, "chữ đã sửa trong revision không còn bị báo");
	assert.match(chu, /bác sĩ/, "chữ mới thêm trong revision bị báo (bài máy viết → nghiêm)");
	assert.match(chu, /bản nháp đã lưu gần nhất/);
	assert.doesNotMatch(chu, /XUẤT BẢN/);
});

test("taiPanel: không có getRevision / getRevision hỏng / không draftRevisionId → soát trên cột, nhãn TRUNG THỰC; content.get null → 'Không tìm thấy bài'", async () => {
	const cot = { title: "tieu-de-may-viet", description: "Sạch.", content: [] };
	const nhanCot = /XUẤT BẢN \/ tạo lần đầu — bản nháp đang sửa có thể khác/;
	// Thiếu quyền content:revisions:read → không có hàm getRevision.
	const ctx = ctxPanel({ async get(bo, id) { return { id, draftRevisionId: "r1", data: cot }; } });
	await kho.themNhap(ctx.storage, { keHoachId: "k1", contentId: "c1", slug: "tieu-de-may-viet", tieuDe: "Tiêu đề máy viết chữa bệnh", phieu: {} }, "2026-09-30T00:00:00.000Z");
	const a = JSON.stringify((await dang.taiPanel(ctx)).blocks);
	assert.match(a, nhanCot);
	assert.match(a, /chữa/, "cột giữ tiêu đề không dấu → thay bằng nhap.tieuDe");
	assert.doesNotMatch(a, /bản nháp đã lưu gần nhất/);
	// getRevision ném → cùng lối lùi + warn.
	const ctx2 = ctxPanel({ async get(bo, id) { return { id, draftRevisionId: "r1", data: cot }; }, async getRevision() { throw new Error("x"); } });
	const b = JSON.stringify((await dang.taiPanel(ctx2)).blocks);
	assert.match(b, nhanCot);
	assert.ok(ctx2.ghi.some((g) => g[0] === "warn"));
	// getRevision trả null → lối lùi.
	const ctx3 = ctxPanel({ async get(bo, id) { return { id, draftRevisionId: "r1", data: cot }; }, async getRevision() { return null; } });
	assert.match(JSON.stringify((await dang.taiPanel(ctx3)).blocks), nhanCot);
	// Không draftRevisionId → không gọi getRevision, nhãn cột.
	let goi = 0;
	const ctx4 = ctxPanel({ async get(bo, id) { return { id, draftRevisionId: null, data: cot }; }, async getRevision() { goi++; return null; } });
	assert.match(JSON.stringify((await dang.taiPanel(ctx4)).blocks), nhanCot);
	assert.equal(goi, 0);
	// Bài không có (đã xoá / id lạ).
	const ctx5 = ctxPanel({ async get() { return null; } });
	const e = await dang.taiPanel(ctx5);
	const ce = JSON.stringify(e.blocks);
	assert.match(ce, /Không tìm thấy bài/);
	assert.doesNotMatch(ce, /Không thấy chữ vượt phạm vi/);
});

test("dsNhapChoTab: đường hiển thị — thiếu slug thì '(chưa có slug)', không '/undefined'", async () => {
	const s = taoKhoGia();
	await kho.themNhap(s, { keHoachId: "k1", contentId: "c1", slug: "mat-ngu", tieuDe: "A", phieu: {} }, "2026-09-29T00:00:00.000Z");
	await s.nhap.put("c2", { keHoachId: "k2", contentId: "c2", tieuDe: "B", trangThai: "cho_duyet", taoLuc: "2026-09-28T00:00:00.000Z" });
	const r = await dang.dsNhapChoTab(s);
	assert.deepEqual(r.nhap.map((n) => n.duong), ["/mat-ngu", "(chưa có slug)"]);
});

// ---- Dọn sau nghiệm thu 2C-3 ----

test("tomTatPhieu.canXemKy: cờ cho tab Nháp — độ dài ngoài khoảng (chỉ SỐ), YMYL, nguồn bỏ, link gỡ, không ảnh bìa; phiếu sạch → rỗng", () => {
	const t = dang.tomTatPhieu({ ...PHIEU, linkGo: [{ href: "https://x.vn/", neo: "x", lyDo: "link_ngoai" }], anh: null });
	assert.deepEqual(t.canXemKy.map((x) => x.ma), ["do_dai", "ymyl", "nguon_bo", "link_go", "khong_anh_bia"]);
	assert.match(t.canXemKy[0].chu, /800 từ/);
	const chu = JSON.stringify(t);
	assert.doesNotMatch(chu, /dài hơn|viết thêm|quá ngắn|ngắn quá/);
	const sach = dang.tomTatPhieu({ seo: [], ymyl: [], khuonCanhBao: [], nguonBo: [], linkGo: [], anh: { mediaId: "m", alt: "A" }, soTu: 1200 });
	assert.deepEqual(sach.canXemKy, []);
	// Cảnh báo khuôn khác do_dai (từ khoá trong đoạn dẫn) không phải cờ "đọc kỹ".
	assert.deepEqual(dang.tomTatPhieu({ khuonCanhBao: [{ ma: "tu_khoa_doan_dan", ghiChu: "x" }], anh: { mediaId: "m" } }).canXemKy, []);
});

test("khoiPanel: nguồn bị bỏ / link bị gỡ hiện CÂU tiếng Việt kèm mã — cả phiếu mới (có ma) lẫn phiếu cũ (lyDo là mã)", () => {
	const phieu = {
		...PHIEU,
		nguonBo: [
			{ title: "Sách bịa", lyDo: "khong_co_trang_nguon" }, // phiếu cũ
			{ title: "Trang chết", url: "https://example.com/mat/", ma: "http_404", lyDo: "máy chủ của nguồn trả mã 404 (cần 200)" }, // phiếu mới
		],
		linkGo: [{ href: "https://x.vn/a", neo: "x", lyDo: "vuot_tran" }],
	};
	const chu = dang.khoiPanel({ nhap: { trangThai: "cho_duyet", taoLuc: "2026-09-30T00:00:00.000Z", phieu }, soat: { viPham: [], anhHong: [] } }).map((b) => b.text ?? "").join("\n");
	assert.match(chu, /Sách bịa — [^\n]*\/nguon\/[^\n]*\(khong_co_trang_nguon\)/);
	assert.match(chu, /Trang chết[^\n]*404[^\n]*\(http_404\)/);
	assert.match(chu, /https:\/\/x\.vn\/a — [^\n]*\(vuot_tran\)/);
});

test("anhBiaTu: featured_image là id trần HOẶC object (hoặc chuỗi JSON của object) đều đọc được; rỗng → null", () => {
	assert.deepEqual(dang.anhBiaTu("01M3SFW56A0T"), { id: "01M3SFW56A0T", alt: "" });
	assert.deepEqual(dang.anhBiaTu({ id: "01M3SFW56A0T", alt: "Huyệt Thần Môn", src: "/_emdash/api/media/file/k.webp", meta: { storageKey: "k.webp" } }), { id: "01M3SFW56A0T", alt: "Huyệt Thần Môn" });
	assert.deepEqual(dang.anhBiaTu('{"id":"m9","alt":"A"}'), { id: "m9", alt: "A" });
	// Object không có id nhưng có src (hình { src, alt } của trang công khai) vẫn là "có ảnh".
	assert.deepEqual(dang.anhBiaTu({ src: "/_emdash/api/media/file/k.webp", alt: "B" }), { id: "", alt: "B" });
	for (const x of [undefined, null, "", "  ", {}, [], 0, "{hỏng"]) {
		const kq = dang.anhBiaTu(x);
		if (x === "{hỏng") assert.deepEqual(kq, { id: "{hỏng", alt: "" });
		else assert.equal(kq, null, JSON.stringify(x));
	}
});

test("soatBai + truocKhiDang: ảnh bìa ở cả hai hình không làm cổng đăng ném hay chặn; soatBai trả anhBia", async () => {
	const nen = { title: "Sạch", description: "Sạch", content: [khoi("Sạch."), ANH_DUNG] };
	for (const fi of ["01M3SFW56A0T", { id: "01M3SFW56A0T", alt: "Huyệt Thần Môn" }]) {
		const ctx = ctxGia();
		assert.equal(await dang.truocKhiDang(suKien({ ...nen, featured_image: fi }), ctx), undefined);
		assert.equal(ctx.ghi.length, 0, "không log lỗi");
		assert.equal(dang.soatBai({ ...nen, featured_image: fi }).anhBia.id, "01M3SFW56A0T");
	}
	assert.equal(dang.soatBai(nen).anhBia, null);
});

test("taiPanel: revision nháp mang featured_image id trần (plugin ghi) hoặc object (trình soạn ghi) → khung đều báo có ảnh bìa; không có → 'không có ảnh bìa'", async () => {
	const dung = async (fi) => {
		const content = {
			async get(bo, id) { return { id, draftRevisionId: "r1", data: { title: "Sạch", description: "Sạch.", content: [] } }; },
			async getRevision() { return { id: "r1", data: fi === undefined ? { title: "Sạch" } : { title: "Sạch", featured_image: fi } }; },
		};
		const ctx = ctxPanel(content);
		await kho.themNhap(ctx.storage, { keHoachId: "k1", contentId: "c1", slug: "s", tieuDe: "Sạch", phieu: { anh: { mediaId: "m1", alt: "Huyệt Thần Môn" } } }, "2026-09-30T00:00:00.000Z");
		const kq = await dang.taiPanel(ctx);
		assert.ok(!ctx.ghi.some((g) => g[0] === "warn" || g[0] === "error"), JSON.stringify(ctx.ghi));
		return kq.blocks.map((b) => b.text ?? "").join("\n");
	};
	// Id trần trùng ảnh máy chọn → mượn alt của phiếu.
	assert.match(await dung("m1"), /Ảnh bìa của bản đang soát: có \(Huyệt Thần Môn\)/);
	assert.match(await dung({ id: "m7", alt: "Kinh Tâm" }), /Ảnh bìa của bản đang soát: có \(Kinh Tâm\)/);
	assert.match(await dung("m8"), /Ảnh bìa của bản đang soát: có/);
	assert.match(await dung(undefined), /Ảnh bìa của bản đang soát: không có/);
});
