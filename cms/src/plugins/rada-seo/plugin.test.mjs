import { test } from "node:test";
import assert from "node:assert/strict";
import { createPlugin, LICH_RADAR, GIO_UTC_CHAY } from "./plugin.mjs";
import * as kho from "./kho.mjs";
import { taoKhoGia } from "./__test__/kho-gia.mjs";
import { xoaDemChiMuc } from "./noi-bo/nap.mjs";
import { DEM_KIEM_CHUNG } from "./noi-bo/kiem-duong.mjs";
import { Y_DINH } from "./chien-luoc/viec.mjs";

const taoCtx = () => {
	const log = [];
	return {
		storage: taoKhoGia(),
		log: { warn: (m) => log.push(["warn", m]), error: (m) => log.push(["error", m]), info: (m) => log.push(["info", m]) },
		_log: log,
		kv: {
			async get() { return null; },
			async getVersioned() { return null; },
			async compareAndSet() { return { applied: false }; },
			async compareAndDelete() {},
		},
		cron: { lich: null, async schedule(ten, o) { this.lich = { ten, ...o }; }, async list() { return this.lich ? [this.lich] : []; } },
	};
};
const coBien = (ten, giaTri, fn) => async () => {
	const cu = process.env[ten];
	if (giaTri === undefined) delete process.env[ten];
	else process.env[ten] = giaTri;
	try { await fn(); } finally { if (cu === undefined) delete process.env[ten]; else process.env[ten] = cu; }
};

test("lịch chạy mỗi giờ phút 30 (giống nhau ở mọi múi giờ tròn giờ), ca thật chốt ở 19 giờ UTC", () => {
	assert.equal(LICH_RADAR, "30 * * * *");
	assert.equal(GIO_UTC_CHAY, 19);
});

test("cron: ngoài giờ 19 UTC thì trả ngay, không ghi, không log — kể cả máy không bật ca đêm", coBien("RADA_SEO_CA_DEM", undefined, async (t) => {
	const p = createPlugin();
	for (const gioLech of [0, 5, 12, 18, 20, 23]) {
		const ctx = taoCtx();
		const goc = Date.prototype.getUTCHours;
		Date.prototype.getUTCHours = () => gioLech;
		try {
			await p.hooks.cron.handler({ name: "radar" }, ctx);
		} finally {
			Date.prototype.getUTCHours = goc;
		}
		assert.equal(ctx.storage.ca._m.size, 0, `giờ ${gioLech}`);
		assert.equal(ctx._log.length, 0, `giờ ${gioLech}`);
	}
}));

test("cron: đúng 19 giờ UTC trên máy không bật ca đêm → ghi dòng 'nhả ca'", coBien("RADA_SEO_CA_DEM", undefined, async () => {
	const p = createPlugin();
	const ctx = taoCtx();
	const goc = Date.prototype.getUTCHours;
	Date.prototype.getUTCHours = () => GIO_UTC_CHAY;
	try {
		await p.hooks.cron.handler({ name: "radar" }, ctx);
	} finally {
		Date.prototype.getUTCHours = goc;
	}
	const ca = await kho.dsCa(ctx.storage);
	assert.equal(ca.length, 1);
	assert.match(ca[0].loi[0], /RADA_SEO_CA_DEM/);
}));

test("lich-bat: chỉ đòi RADA_SEO_CA_DEM=1, không còn đòi múi giờ UTC", async () => {
	const p = createPlugin();
	await coBien("RADA_SEO_CA_DEM", undefined, async () => {
		await assert.rejects(p.routes["lich-bat"].handler(taoCtx()), /RADA_SEO_CA_DEM/);
	})();
	await coBien("RADA_SEO_CA_DEM", "1", async () => {
		const goc = Date.prototype.getTimezoneOffset;
		Date.prototype.getTimezoneOffset = () => -420; // giờ Việt Nam
		try {
			const ctx = taoCtx();
			await p.routes["lich-bat"].handler(ctx);
			assert.deepEqual(ctx.cron.lich, { ten: "radar", schedule: LICH_RADAR });
		} finally {
			Date.prototype.getTimezoneOffset = goc;
		}
	})();
});

test("url-dat-lai: tên miền sai → badRequest; đúng → đặt lại URL lỗi", async () => {
	const p = createPlugin();
	await assert.rejects(p.routes["url-dat-lai"].handler({ ...taoCtx(), input: { tenMien: "khong co cham" } }), (e) => e?.name === "PluginRouteError" || /không hợp lệ/.test(e.message));
	const ctx = { ...taoCtx(), input: { tenMien: "https://www.A.vn/" } };
	await kho.themUrlMoi(ctx.storage, "a.vn", ["https://a.vn/1"], { ghi: true, now: "t" });
	await kho.capNhatUrl(ctx.storage, kho.idUrl("https://a.vn/1"), { trangThai: "loi" });
	assert.deepEqual(await p.routes["url-dat-lai"].handler(ctx), { tenMien: "a.vn", soUrlDatLai: 1 });
});

test("MCP: 8 công cụ, mỗi cái trỏ route có thật, có permission bậc contributor và khuôn zod", () => {
	const p = createPlugin();
	const tools = p.mcp.tools;
	assert.deepEqual(Object.keys(tools).sort(), [
		"rada_de_xuat_huong", "rada_de_xuat_ke_hoach", "rada_ghi_cum", "rada_ghi_phan_tich",
		"rada_lay_du_lieu_chien_luoc", "rada_lay_viec", "rada_tim_lien_ket", "rada_xong_phan_tich",
	]);
	for (const [ten, t] of Object.entries(tools)) {
		const r = p.routes[t.route];
		assert.ok(r, `${ten} → route ${t.route}`);
		assert.ok(["content:read_drafts", "content:create"].includes(r.permission), `${ten} permission`);
		assert.equal(typeof r.input?.safeParse, "function", `${ten} route input zod`);
		assert.equal(t.input, r.input, `${ten} dùng chung khuôn với route`);
		assert.equal(t.destructive, false);
		assert.match(ten, /^[A-Za-z0-9_-]+$/);
	}
	// Khuôn ghi chặn lô quá 10 và mục thiếu từ khoá.
	const ghi = p.routes["mcp-ghi-phan-tich"].input;
	const muc = { id: "u", chuDe: "x", tuKhoa: ["a"], tomTat: [] };
	assert.equal(ghi.safeParse({ ketQua: Array(11).fill(muc) }).success, false);
	assert.equal(ghi.safeParse({ ketQua: [{ ...muc, tuKhoa: [] }] }).success, false);
	assert.equal(ghi.safeParse({ ketQua: [muc] }).success, true);
	// boQua: Claude chủ động bỏ trang; phải có ít nhất một trong hai mảng.
	assert.equal(ghi.safeParse({ boQua: [{ id: "u", lyDo: "rác" }] }).success, true);
	assert.equal(ghi.safeParse({ ketQua: [muc], boQua: [{ id: "v", lyDo: "rác" }] }).success, true);
	assert.equal(ghi.safeParse({}).success, false);
	assert.equal(ghi.safeParse({ ketQua: [], boQua: [] }).success, false);
	assert.equal(ghi.safeParse({ boQua: [{ id: "u", lyDo: "" }] }).success, false);
	assert.equal(ghi.safeParse({ boQua: [{ id: "u", lyDo: "x".repeat(201) }] }).success, false);
	assert.equal(ghi.safeParse({ boQua: Array(11).fill({ id: "u", lyDo: "x" }) }).success, false);
	// Mô tả công cụ không gọi tên trần của công cụ khác (EmDash thêm tiền tố rada-seo__).
	assert.match(tools.rada_ghi_phan_tich.description, /kết thúc bằng rada_lay_viec/);
});

test("mcp-ghi-phan-tich route: chuyển boQua xuống ghiPhanTich", async () => {
	const p = createPlugin();
	const ctx = taoCtx();
	await ctx.storage.url.put("u1", { doiThuId: "a.vn", url: "https://a.vn/1", trangThai: "cho_ai", chu: "x" });
	const kq = await p.routes["mcp-ghi-phan-tich"].handler({ ...ctx, input: { boQua: [{ id: "u1", lyDo: "rác" }] } });
	assert.equal(kq.soDaBoQua, 1);
	assert.equal((await ctx.storage.url.get("u1")).trangThai, "loi");
});

test("tong-quan: báo đỏ Claude khi có trang chờ mà chưa có ca 'claude' trong 26 giờ", async () => {
	const p = createPlugin();
	const ctx = taoCtx();
	await ctx.storage.url.put("u1", { doiThuId: "a.vn", url: "https://a.vn/1", trangThai: "cho_ai", chu: "x" });
	let kq = await p.routes["tong-quan"].handler(ctx);
	assert.equal(kq.choAi, 1);
	assert.equal(kq.canhBaoClaude, true);
	const vua = new Date().toISOString();
	await kho.ghiCa(ctx.storage, { loai: "claude", batDau: vua, ketThuc: vua, ghi: true, soDoc: 3, loi: [] });
	kq = await p.routes["tong-quan"].handler(ctx);
	assert.equal(kq.canhBaoClaude, false);
});

test("tong-quan: ca 'claude' đọc 0 trang KHÔNG tắt cảnh báo", async () => {
	const p = createPlugin();
	const ctx = taoCtx();
	await ctx.storage.url.put("u1", { doiThuId: "a.vn", url: "https://a.vn/1", trangThai: "cho_ai", chu: "x" });
	const cu = new Date(Date.now() - 30 * 3600e3).toISOString();
	await kho.ghiCa(ctx.storage, { loai: "claude", batDau: cu, ketThuc: cu, ghi: true, soDoc: 5, loi: [] });
	const vua = new Date().toISOString();
	await kho.ghiCa(ctx.storage, { loai: "claude", batDau: vua, ketThuc: vua, ghi: true, soDoc: 0, loi: [] });
	assert.equal((await p.routes["tong-quan"].handler(ctx)).canhBaoClaude, true);
});

test("rada_tim_lien_ket: route content:read_drafts, khuôn chung, bác mảng rỗng và > 20 cụm; plugin có content:read", () => {
	const p = createPlugin();
	const t = p.mcp.tools.rada_tim_lien_ket;
	assert.equal(t.route, "mcp-tim-lien-ket");
	const r = p.routes[t.route];
	assert.equal(r.permission, "content:read_drafts");
	assert.equal(t.input, r.input);
	assert.equal(t.destructive, false);
	assert.match(t.description, /CÓ THẬT/);
	assert.equal(r.input.safeParse({ cumTu: [] }).success, false);
	assert.equal(r.input.safeParse({ cumTu: Array(21).fill("mất ngủ") }).success, false);
	assert.equal(r.input.safeParse({ cumTu: ["x"] }).success, false);
	assert.equal(r.input.safeParse({ cumTu: ["mất ngủ", "huyệt Tam Âm Giao"] }).success, true);
	assert.ok(p.capabilities.includes("content:read"));
	assert.ok(p.capabilities.includes("network:request:unrestricted"));
});

test("mcp-tim-lien-ket route: nối chỉ mục CMS + tra bài thuốc + kiểm trang thật; trả loiNap + thongKe", async () => {
	xoaDemChiMuc();
	DEM_KIEM_CHUNG.xoa();
	const p = createPlugin();
	const tai = [];
	const ctx = {
		...taoCtx(),
		input: { cumTu: ["huyệt Tam Âm Giao", "Quy Tỳ Thang"] },
		content: {
			async list(bo, opts) {
				assert.equal(opts.where.status, "published");
				if (bo !== "huyet_vi") throw new Error("Collection not found");
				return { items: [{ slug: "tam-am-giao", data: { title: "Tam Âm Giao", slug_goc: "tam-am-giao" } }], hasMore: false };
			},
		},
		http: {
			async fetch(url, init) {
				tai.push(url);
				if (url.endsWith("/api/tra-cuu/ten")) {
					assert.deepEqual(JSON.parse(init.body).ten, ["Quy Tỳ Thang"]);
					return Response.json({ "Quy Tỳ Thang": [{ loai: "bai_thuoc", ten: "Quy Tỳ Thang", slug: "quy-ty-thang" }] });
				}
				if (url === "https://kinhlac.online/huyet/tam-am-giao/") return new Response("<title>Huyệt Tam Âm Giao (SP6)</title>");
				if (url === "https://kinhlac.online/bai-thuoc/quy-ty-thang/") return new Response("<h1>Quy Tỳ Thang</h1>");
				return new Response("", { status: 404 });
			},
		},
	};
	const kq = await p.routes["mcp-tim-lien-ket"].handler(ctx);
	assert.equal(kq.daCatBot, false);
	assert.deepEqual(kq.ketQua.map((x) => x.ketQua.map((k) => k.duong)), [["/huyet/tam-am-giao/"], ["/bai-thuoc/quy-ty-thang/"]]);
	// Chỉ mục què (mọi bộ trừ huyet_vi lỗi) phải LỘ ra trong phản hồi, không im lặng.
	assert.ok(kq.loiNap.some((l) => l.bo === "kinh_mach"));
	assert.ok(!kq.loiNap.some((l) => l.bo === "huyet_vi"));
	assert.deepEqual(kq.thongKe.soMuc, { huyet_vi: 1 });
	assert.equal(typeof kq.thongKe.msDung, "number");
	// Gọi lại route: đệm kiểm đường dùng chung → không tải lại trang huyệt.
	const truoc = tai.filter((u) => u.endsWith("/huyet/tam-am-giao/")).length;
	await p.routes["mcp-tim-lien-ket"].handler(ctx);
	assert.equal(tai.filter((u) => u.endsWith("/huyet/tam-am-giao/")).length, truoc);
	xoaDemChiMuc();
	DEM_KIEM_CHUNG.xoa();
});

// ---- Chiến lược (2C-2) ----

test("công cụ chiến lược: lấy dữ liệu chỉ đọc (content:read_drafts), ba công cụ ghi là content:create", () => {
	const p = createPlugin();
	const t = p.mcp.tools;
	const quyen = (ten) => p.routes[t[ten].route].permission;
	assert.equal(quyen("rada_lay_du_lieu_chien_luoc"), "content:read_drafts");
	for (const ten of ["rada_de_xuat_huong", "rada_ghi_cum", "rada_de_xuat_ke_hoach"]) assert.equal(quyen(ten), "content:create", ten);
	for (const ten of ["rada_lay_du_lieu_chien_luoc", "rada_de_xuat_huong", "rada_ghi_cum", "rada_de_xuat_ke_hoach"]) {
		assert.match(t[ten].description, /Rada SEO/);
		assert.doesNotMatch(t[ten].description, /(?<!kết thúc bằng )\brada_(?!lay_du_lieu_chien_luoc|de_xuat_huong|ghi_cum|de_xuat_ke_hoach)\w+/, `${ten} gọi tên trần công cụ khác`);
	}
});

const HUONG = { ten: "Mất ngủ theo Đông y", moTa: "m", trongSoGoiY: 4, lyDo: "l", idBaiDoiThu: ["a", "b", "c"], tuKhoa: ["mất ngủ"] };
const CUM = { huongId: "h_1", ten: "Huyệt giúp ngủ", moTa: "m", tuKhoa: ["huyệt thần môn"], idBaiDoiThu: ["a"] };
const KH = {
	cumId: "c_1", tieuDeLamViec: "Mất ngủ về đêm", tuKhoaChinh: "mất ngủ về đêm", tuKhoaPhu: ["a", "b"], yDinh: "huong_dan",
	trangTruCot: "/benh-hoc/mat-ngu/", lienKetDich: ["/huyet/a/", "/huyet/b/", "/huyet/c/", "/huyet/d/", "/huyet/e/"], goiYNguon: [],
};

test("khuôn chiến lược: nhận mẫu hợp lệ, bác vượt trần số lượng và độ dài", () => {
	const p = createPlugin();
	const k = (ten) => p.routes[p.mcp.tools[ten].route].input;
	const ok = (ten, v) => assert.equal(k(ten).safeParse(v).success, true, `${ten} phải nhận ${JSON.stringify(v).slice(0, 80)}`);
	const sai = (ten, v) => assert.equal(k(ten).safeParse(v).success, false, `${ten} phải bác ${JSON.stringify(v).slice(0, 80)}`);
	ok("rada_lay_du_lieu_chien_luoc", {});
	ok("rada_lay_du_lieu_chien_luoc", { trang: 2 });
	sai("rada_lay_du_lieu_chien_luoc", { trang: -1 });
	sai("rada_lay_du_lieu_chien_luoc", { trang: 1.5 });

	ok("rada_de_xuat_huong", { huong: [HUONG] });
	sai("rada_de_xuat_huong", { huong: [] });
	sai("rada_de_xuat_huong", { huong: Array(9).fill(HUONG) });
	sai("rada_de_xuat_huong", { huong: [{ ...HUONG, ten: "x".repeat(121) }] });
	sai("rada_de_xuat_huong", { huong: [{ ...HUONG, moTa: "x".repeat(401) }] });
	sai("rada_de_xuat_huong", { huong: [{ ...HUONG, tuKhoa: Array(9).fill("k") }] });
	sai("rada_de_xuat_huong", { huong: [{ ...HUONG, tuKhoa: ["x".repeat(81)] }] });
	sai("rada_de_xuat_huong", { huong: [{ ...HUONG, idBaiDoiThu: ["x".repeat(65)] }] });
	sai("rada_de_xuat_huong", { huong: [{ ...HUONG, trongSoGoiY: 6 }] });

	ok("rada_ghi_cum", { cum: [CUM] });
	sai("rada_ghi_cum", { cum: Array(21).fill(CUM) });
	sai("rada_ghi_cum", { cum: [{ ...CUM, huongId: "x".repeat(65) }] });

	ok("rada_de_xuat_ke_hoach", { keHoach: [KH] });
	sai("rada_de_xuat_ke_hoach", { keHoach: Array(11).fill(KH) });
	sai("rada_de_xuat_ke_hoach", { keHoach: [{ ...KH, lienKetDich: Array(13).fill("/huyet/a/") }] });
	sai("rada_de_xuat_ke_hoach", { keHoach: [{ ...KH, tuKhoaPhu: Array(9).fill("k") }] });
	sai("rada_de_xuat_ke_hoach", { keHoach: [{ ...KH, yDinh: "ban_hang" }] });
	for (const y of Y_DINH) ok("rada_de_xuat_ke_hoach", { keHoach: [{ ...KH, yDinh: y }] });
});

const loiRoute = (status) => (e) => e?.name === "PluginRouteError" && e.status === status;

test("route quản trị huong-dat / ke-hoach-dat gọi đúng hàm kho; lỗi đi qua PluginRouteError", async () => {
	const p = createPlugin();
	const ctx = taoCtx();
	const [h] = await kho.luuHuongMoi(ctx.storage, [{ ...HUONG, diem: 50 }], "t");
	await assert.rejects(p.routes["huong-dat"].handler({ ...ctx, input: { id: h.id, trangThai: "da_nhan" } }), loiRoute(400));
	await assert.rejects(p.routes["huong-dat"].handler({ ...ctx, input: { id: "h_khong", trangThai: "de_xuat" } }), loiRoute(404));
	await p.routes["huong-dat"].handler({ ...ctx, input: { id: h.id, trangThai: "da_nhan", trongSo: "3" } });
	assert.equal((await ctx.storage.huong.get(h.id)).trongSo, 3);
	await p.routes["huong-dat"].handler({ ...ctx, input: { id: h.id, trangThai: "bo_qua", lyDoBo: "ngoài ngách" } });
	assert.equal((await ctx.storage.huong.get(h.id)).lyDoBo, "ngoài ngách");

	const [k] = await kho.themKeHoach(ctx.storage, [{ cumId: "c_1", tieuDeLamViec: "Bài", tuKhoaChinh: "bài" }], "t");
	await p.routes["ke-hoach-dat"].handler({ ...ctx, input: { id: k.id, trangThai: "da_duyet" } });
	assert.equal((await ctx.storage.ke_hoach.get(k.id)).trangThai, "da_duyet");
	// Màn duyệt chỉ duyệt / bỏ / khôi phục; các trạng thái viết do lò viết đặt.
	await assert.rejects(p.routes["ke-hoach-dat"].handler({ ...ctx, input: { id: k.id, trangThai: "da_dang" } }), loiRoute(400));
	await assert.rejects(p.routes["ke-hoach-dat"].handler({ ...ctx, input: { id: k.id, trangThai: "bo_qua" } }), loiRoute(400));
	await assert.rejects(p.routes["ke-hoach-dat"].handler({ ...ctx, input: { id: "k_khong", trangThai: "da_duyet" } }), loiRoute(404));
	for (const r of ["huong-dat", "ke-hoach-dat", "chien-luoc-tong-quan"]) assert.equal(p.routes[r].permission, undefined, `${r} giữ quyền mặc định plugins:manage`);

	const tq = await p.routes["chien-luoc-tong-quan"].handler(ctx);
	assert.deepEqual(tq.huong.map((x) => x.id), [h.id]);
	assert.equal(tq.huong[0].diem, 50);
	assert.deepEqual(tq.keHoach.map((x) => x.id), [k.id]);
	assert.deepEqual(tq.cum, []);
});

/** ctx có chỉ mục CMS giả (một bộ bệnh học) và site thật giả. */
function ctxChienLuoc(input, song = () => true) {
	const ctx = taoCtx();
	return {
		...ctx,
		input,
		content: {
			async list(bo) {
				if (bo === "benh_hoc") return { items: [{ slug: "mat-ngu", data: { title: "Mất Ngủ" } }], hasMore: false };
				if (bo === "huyet_vi") return { items: "abcde".split("").map((x) => ({ slug: x, data: { title: `Huyệt ${x.toUpperCase()}` } })), hasMore: false };
				return { items: [], hasMore: false };
			},
		},
		http: {
			async fetch(url) {
				const d = new URL(url).pathname;
				if (!song(d)) return new Response("", { status: 404 });
				const ten = d === "/benh-hoc/mat-ngu/" ? "Mất Ngủ" : `Huyệt ${d.split("/")[2].toUpperCase()}`;
				return new Response(`<title>${ten}</title>`);
			},
		},
	};
}

test("route MCP chiến lược: nối kho + chỉ mục CMS + kiểm trang thật", async () => {
	xoaDemChiMuc();
	DEM_KIEM_CHUNG.xoa();
	const p = createPlugin();
	const ctx = ctxChienLuoc({});
	const s = ctx.storage;
	for (const tm of ["a.vn", "b.vn", "c.vn"]) await kho.luuDoiThu(s, { tenMien: tm }, "t");
	for (const [id, tm] of [["a", "a.vn"], ["b", "b.vn"], ["c", "c.vn"]])
		await s.url.put(id, { doiThuId: tm, url: `https://${tm}/${id}`, trangThai: "da_phan_tich", chuDe: `Mất ngủ ${id}`, tuKhoa: ["mất ngủ"], phanTichLuc: "2026-09-30T00:00:00.000Z" });

	const d = await p.routes["mcp-lay-du-lieu-chien-luoc"].handler(ctx);
	assert.equal(d.tongChuDe, 3);
	assert.ok(d.loiNhac.deXuatHuong);

	const h = await p.routes["mcp-de-xuat-huong"].handler({ ...ctx, input: { huong: [HUONG] } });
	assert.equal(h.nhan.length, 1);
	assert.ok(h.nhan[0].diem > 0);
	const huongId = h.nhan[0].id;
	// Hướng chưa nhận → cụm bị bác.
	assert.equal((await p.routes["mcp-ghi-cum"].handler({ ...ctx, input: { cum: [{ ...CUM, huongId }] } })).bac.length, 1);
	await p.routes["huong-dat"].handler({ ...ctx, input: { id: huongId, trangThai: "da_nhan", trongSo: 4 } });
	const c = await p.routes["mcp-ghi-cum"].handler({ ...ctx, input: { cum: [{ ...CUM, huongId }] } });
	assert.equal(c.nhan.length, 1);

	const kq = await p.routes["mcp-de-xuat-ke-hoach"].handler({ ...ctx, input: { keHoach: [{ ...KH, cumId: c.nhan[0].id }] } });
	assert.deepEqual(kq.bac, []);
	assert.equal(kq.nhan.length, 1);
	assert.deepEqual(kq.loiNap, []);
	const tq = await p.routes["chien-luoc-tong-quan"].handler(ctx);
	assert.equal(tq.keHoach[0].bangChung.soDoiThu, 1);
	xoaDemChiMuc();
	DEM_KIEM_CHUNG.xoa();
});

test("route MCP kế hoạch: link đích chết trên site thật → bài bị bác", async () => {
	xoaDemChiMuc();
	DEM_KIEM_CHUNG.xoa();
	const p = createPlugin();
	const ctx = ctxChienLuoc({}, (d) => !["/huyet/d/", "/huyet/e/"].includes(d));
	const s = ctx.storage;
	await s.huong.put("h_1", { ten: "H", trangThai: "da_nhan", trongSo: 3 });
	await s.cum_nghia.put("c_1", { huongId: "h_1", ten: "C", trangThai: "de_xuat", chiSo: {}, baiDoiThu: [] });
	const kq = await p.routes["mcp-de-xuat-ke-hoach"].handler({ ...ctx, input: { keHoach: [KH] } });
	assert.equal(kq.nhan.length, 0);
	assert.match(kq.bac[0].lyDo, /3 link đích/);
	xoaDemChiMuc();
	DEM_KIEM_CHUNG.xoa();
});
