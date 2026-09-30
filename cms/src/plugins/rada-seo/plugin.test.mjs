import { test } from "node:test";
import assert from "node:assert/strict";
import { createPlugin, LICH_RADAR, GIO_UTC_CHAY } from "./plugin.mjs";
import * as kho from "./kho.mjs";
import { taoKhoGia, taoKvGia } from "./__test__/kho-gia.mjs";
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

test("MCP: 12 công cụ, mỗi cái trỏ route có thật, có permission bậc contributor và khuôn zod", () => {
	const p = createPlugin();
	const tools = p.mcp.tools;
	assert.deepEqual(Object.keys(tools).sort(), [
		"rada_de_xuat_huong", "rada_de_xuat_ke_hoach", "rada_ghi_cum", "rada_ghi_phan_tich", "rada_ghi_so_ho",
		"rada_lay_du_lieu_chien_luoc", "rada_lay_trang_serp", "rada_lay_tu_khoa_leo_top", "rada_lay_viec",
		"rada_nop_serp", "rada_tim_lien_ket", "rada_xong_phan_tich",
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

	const [k] = await kho.themKeHoach(ctx.storage, [{ cumId: "c_1", huongId: "h_nhan", tieuDeLamViec: "Bài", tuKhoaChinh: "bài" }], "t");
	// Hướng của bài chưa nhận → không duyệt được bài (400, lời tiếng Việt).
	await ctx.storage.huong.put("h_nhan", { ten: "N", trangThai: "de_xuat" });
	await assert.rejects(p.routes["ke-hoach-dat"].handler({ ...ctx, input: { id: k.id, trangThai: "da_duyet" } }), (e) => loiRoute(400)(e) && /chưa được nhận/.test(e.message));
	await ctx.storage.huong.put("h_nhan", { ten: "N", trangThai: "da_nhan", trongSo: 3 });
	await p.routes["ke-hoach-dat"].handler({ ...ctx, input: { id: k.id, trangThai: "da_duyet" } });
	assert.equal((await ctx.storage.ke_hoach.get(k.id)).trangThai, "da_duyet");
	// Màn duyệt chỉ duyệt / bỏ / khôi phục; các trạng thái viết do lò viết đặt.
	await assert.rejects(p.routes["ke-hoach-dat"].handler({ ...ctx, input: { id: k.id, trangThai: "da_dang" } }), loiRoute(400));
	await assert.rejects(p.routes["ke-hoach-dat"].handler({ ...ctx, input: { id: k.id, trangThai: "bo_qua" } }), loiRoute(400));
	await assert.rejects(p.routes["ke-hoach-dat"].handler({ ...ctx, input: { id: "k_khong", trangThai: "da_duyet" } }), loiRoute(404));
	// can_xem (lò viết bỏ cuộc): màn duyệt đưa về da_duyet ("Duyệt lại", đặt lại bộ đếm) hoặc bo_qua; không đặt can_xem tay.
	await assert.rejects(p.routes["ke-hoach-dat"].handler({ ...ctx, input: { id: k.id, trangThai: "can_xem" } }), loiRoute(400));
	await ctx.storage.ke_hoach.put(k.id, { ...(await ctx.storage.ke_hoach.get(k.id)), trangThai: "can_xem", soLanNop: 3, loiCuoi: ["x"] });
	await assert.rejects(p.routes["ke-hoach-dat"].handler({ ...ctx, input: { id: k.id, trangThai: "de_xuat" } }), (e) => loiRoute(400)(e) && /cần xem lại/.test(e.message));
	await p.routes["ke-hoach-dat"].handler({ ...ctx, input: { id: k.id, trangThai: "da_duyet" } });
	const lai = await ctx.storage.ke_hoach.get(k.id);
	assert.equal(lai.trangThai, "da_duyet");
	assert.equal(lai.soLanNop, undefined);
	for (const r of ["huong-dat", "ke-hoach-dat", "chien-luoc-tong-quan"]) assert.equal(p.routes[r].permission, undefined, `${r} giữ quyền mặc định plugins:manage`);

	const tq = await p.routes["chien-luoc-tong-quan"].handler(ctx);
	assert.deepEqual(tq.huong.map((x) => x.id).sort(), [h.id, "h_nhan"].sort());
	assert.equal(tq.huong.find((x) => x.id === h.id).diem, 50);
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
	const c = await p.routes["mcp-ghi-cum"].handler({ ...ctx, input: { cum: [{ ...CUM, tuKhoa: ["mất ngủ"], huongId }] } });
	assert.equal(c.nhan.length, 1);

	const kq = await p.routes["mcp-de-xuat-ke-hoach"].handler({ ...ctx, input: { keHoach: [{ ...KH, cumId: c.nhan[0].id }] } });
	assert.deepEqual(kq.bac, []);
	assert.equal(kq.nhan.length, 1);
	assert.deepEqual(kq.loiNap, []);
	const tq = await p.routes["chien-luoc-tong-quan"].handler(ctx);
	assert.equal(tq.keHoach[0].bangChung.soDoiThu, 3, "máy chủ tự dò: 3 bài 'Mất ngủ' của 3 đối thủ, dù cụm chỉ dẫn 1 id");
	assert.equal(kq.daCatBot, false);
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

test("route MCP kế hoạch: ngân sách kiểm — ≤ 40 lượt tải trang chưa đệm mỗi lời gọi, trang đã đệm không tính", async () => {
	xoaDemChiMuc();
	DEM_KIEM_CHUNG.xoa();
	const p = createPlugin();
	const ctx = ctxChienLuoc({});
	let soTai = 0;
	const fetchGoc = ctx.http.fetch;
	ctx.http.fetch = async (url) => {
		soTai++;
		const d = new URL(url).pathname;
		return d.startsWith("/huyet/") ? fetchGoc(url) : new Response(`<title>x</title>`);
	};
	const s = ctx.storage;
	await s.huong.put("h_1", { ten: "H", trangThai: "da_nhan", trongSo: 3 });
	await s.cum_nghia.put("c_1", { huongId: "h_1", ten: "C", trangThai: "de_xuat", chiSo: {}, baiDoiThu: [] });
	const ds = Array.from({ length: 10 }, (_, i) => ({
		...KH, tieuDeLamViec: `Chủ đề riêng ${i} q${i}`, tuKhoaChinh: `chu de ${i} q${i}`,
		trangTruCot: `/tru/${i}/`, lienKetDich: Array.from({ length: 5 }, (_, j) => `/lk/${i}-${j}/`),
	}));
	const kq = await p.routes["mcp-de-xuat-ke-hoach"].handler({ ...ctx, input: { keHoach: ds } });
	assert.equal(soTai, 40);
	assert.equal(kq.daCatBot, true);
	assert.equal(kq.nhan.length, 6);
	// Gọi lại: 36 trang đã đệm (bài đã nhận thì bị bác vì trùng, nhưng vẫn không tải lại).
	soTai = 0;
	const lai = await p.routes["mcp-de-xuat-ke-hoach"].handler({ ...ctx, input: { keHoach: ds.slice(6) } });
	assert.equal(lai.daCatBot, false);
	assert.equal(lai.nhan.length, 4);
	assert.equal(soTai, 20, "4 trang của bài thứ 7 đã đệm từ lượt trước");
	xoaDemChiMuc();
	DEM_KIEM_CHUNG.xoa();
});

// ---- Leo top (2D) ----

const MINH = "https://kinhlac.online/huyet/than-mon/";
const GSC_ENV = { GSC_OAUTH_CLIENT_ID: "cid", GSC_OAUTH_CLIENT_SECRET: "csec", GSC_OAUTH_REFRESH_TOKEN: "rt", GSC_SITE_URL: "https://kinhlac.online/" };
/** Đặt/xoá nhiều biến môi trường trong lúc chạy fn. */
const coEnv = (bang, fn) => async () => {
	const cu = Object.fromEntries(Object.keys(bang).map((k) => [k, process.env[k]]));
	for (const [k, v] of Object.entries(bang)) if (v === undefined) delete process.env[k]; else process.env[k] = v;
	try { await fn(); } finally { for (const [k, v] of Object.entries(cu)) if (v === undefined) delete process.env[k]; else process.env[k] = v; }
};
const KHONG_GSC = Object.fromEntries(Object.keys(GSC_ENV).map((k) => [k, undefined]));

test("công cụ leo top: route có thật, lấy chữ là content:read_drafts, ba công cụ ghi là content:create, mô tả không gọi tên trần", () => {
	const p = createPlugin();
	const t = p.mcp.tools;
	const quyen = (ten) => p.routes[t[ten].route].permission;
	assert.equal(quyen("rada_lay_trang_serp"), "content:read_drafts");
	for (const ten of ["rada_lay_tu_khoa_leo_top", "rada_nop_serp", "rada_ghi_so_ho"]) assert.equal(quyen(ten), "content:create", ten);
	for (const ten of ["rada_lay_tu_khoa_leo_top", "rada_nop_serp", "rada_lay_trang_serp", "rada_ghi_so_ho"]) {
		assert.match(t[ten].description, /Rada SEO/);
		assert.doesNotMatch(t[ten].description, /(?<!kết thúc bằng )\brada_\w+/, `${ten} gọi tên trần công cụ khác`);
	}
	assert.match(t.rada_lay_trang_serp.description, /<<<TRANG_SERP/);
});

test("khuôn leo top: nhận mẫu hợp lệ, bác vượt trần", () => {
	const p = createPlugin();
	const k = (ten) => p.routes[p.mcp.tools[ten].route].input;
	const ok = (ten, v) => assert.equal(k(ten).safeParse(v).success, true, `${ten} phải nhận ${JSON.stringify(v).slice(0, 80)}`);
	const sai = (ten, v) => assert.equal(k(ten).safeParse(v).success, false, `${ten} phải bác ${JSON.stringify(v).slice(0, 80)}`);
	ok("rada_lay_tu_khoa_leo_top", {});
	ok("rada_nop_serp", { phienId: "lt_1", urls: ["https://a.vn/1"] });
	sai("rada_nop_serp", { phienId: "lt_1", urls: [] });
	sai("rada_nop_serp", { phienId: "lt_1", urls: Array(11).fill("https://a.vn/1") });
	sai("rada_nop_serp", { phienId: "lt_1", urls: ["không phải url"] });
	sai("rada_nop_serp", { urls: ["https://a.vn/1"] });
	ok("rada_lay_trang_serp", { phienId: "lt_1" });
	sai("rada_lay_trang_serp", {});
	const T = { url: "https://a.vn/1", y: ["Vị trí huyệt"], cauTraLoiO: "dau", ruom: [], thieuCanCu: [], khoDung: [] };
	ok("rada_ghi_so_ho", { phienId: "lt_1", trang: [T] });
	sai("rada_ghi_so_ho", { phienId: "lt_1", trang: [] });
	sai("rada_ghi_so_ho", { phienId: "lt_1", trang: Array(13).fill(T) });
	sai("rada_ghi_so_ho", { phienId: "lt_1", trang: [{ ...T, y: Array(16).fill("ý") }] });
	sai("rada_ghi_so_ho", { phienId: "lt_1", trang: [{ ...T, ruom: Array(9).fill("r") }] });
	sai("rada_ghi_so_ho", { phienId: "lt_1", trang: [{ ...T, thieuCanCu: Array(9).fill("r") }] });
	sai("rada_ghi_so_ho", { phienId: "lt_1", trang: [{ ...T, khoDung: Array(9).fill("r") }] });
	sai("rada_ghi_so_ho", { phienId: "lt_1", trang: [{ ...T, cauTraLoiO: "tren" }] });
	sai("rada_ghi_so_ho", { phienId: "lt_1", trang: [{ ...T, y: ["x".repeat(121)] }] });
});

test("route leo top: GSC → phiên → nộp SERP (tải trang thật qua ctx.http) → lấy chữ → ghi sơ hở → phiếu", coEnv(GSC_ENV, async () => {
	xoaDemChiMuc();
	const p = createPlugin();
	const tai = [];
	const html = (y) => `<html><head><title>t</title></head><body><p>Huyệt thần môn: ${y}</p></body></html>`;
	const ctx = {
		...taoCtx(),
		kv: taoKvGia(),
		content: { async list() { return { items: [], hasMore: false }; } },
		http: {
			async fetch(url) {
				url = String(url);
				if (url.startsWith("https://oauth2.googleapis.com/")) return Response.json({ access_token: "tok", expires_in: 3600 });
				if (url.startsWith("https://searchconsole.googleapis.com/"))
					return Response.json({ rows: [{ keys: ["huyệt thần môn", MINH], position: 8, impressions: 300, clicks: 1 }] });
				tai.push(url);
				return new Response(html(url));
			},
		},
	};
	const kq = await p.routes["mcp-lay-tu-khoa-leo-top"].handler({ ...ctx, input: {} });
	assert.equal(kq.loi, undefined);
	assert.equal(kq.moi.length, 1);
	const id = kq.moi[0].id;

	const nop = await p.routes["mcp-nop-serp"].handler({ ...ctx, input: { phienId: id, urls: ["https://a.vn/1", "https://b.vn/1", "https://c.vn/1"] } });
	assert.equal(nop.soTrangDo, 4);
	assert.deepEqual(tai.sort(), ["https://a.vn/1", "https://b.vn/1", "https://c.vn/1", MINH].sort());

	const chu = await p.routes["mcp-lay-trang-serp"].handler({ ...ctx, input: { phienId: id } });
	assert.equal(chu.trang.length, 4);
	assert.match(chu.huongDan, /PHẠM VI Y SỸ/);

	const b = (url, y) => ({ url, y, cauTraLoiO: "dau", ruom: [], thieuCanCu: [], khoDung: [] });
	const Y = ["Vị trí huyệt", "Cách bấm huyệt"];
	// Thiếu trang đối thủ → 400 kèm lý do tiếng Việt, phiên vẫn cho_doc để gửi lại.
	await assert.rejects(
		p.routes["mcp-ghi-so-ho"].handler({ ...ctx, input: { phienId: id, trang: [b("https://a.vn/1", Y), b(MINH, Y)] } }),
		(e) => e?.name === "PluginRouteError" && e.status === 400 && /1 trang đối thủ.*cần ít nhất 2/.test(e.message),
	);
	assert.equal((await ctx.storage.leo_top.get(id)).trangThai, "cho_doc");
	const so = await p.routes["mcp-ghi-so-ho"].handler({
		...ctx,
		input: { phienId: id, trang: [b("https://a.vn/1", Y), b("https://b.vn/1", Y), b("https://c.vn/1", Y), b(MINH, ["Vị trí huyệt"])] },
	});
	assert.equal(so.trangThai, "co_phieu");
	assert.deepEqual(so.phieu.themY, ["Cách bấm huyệt"]);

	// Màn quản trị: tổng quan không kèm chữ trang; báo đã sửa.
	const tq = await p.routes["leo-top-tong-quan"].handler(ctx);
	assert.equal(tq.gscCoCauHinh, true);
	assert.equal(tq.phien.length, 1);
	assert.ok(tq.phien[0].serp.every((t) => t.chu === undefined));
	const homNay = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
	const ds = await p.routes["leo-top-da-sua"].handler({ ...ctx, input: { id, ngay: homNay } });
	assert.equal(ds.trangThai, "da_sua");
	assert.equal(ds.ngaySua, homNay);
	// Ngày tương lai bị bác bằng PluginRouteError 400.
	await assert.rejects(p.routes["leo-top-da-sua"].handler({ ...ctx, input: { id, ngay: "2999-01-01" } }), (e) => e?.name === "PluginRouteError" && e.status === 400);
	xoaDemChiMuc();
}));

test("route leo top: thiếu biến GSC → lời báo tiếng Việt trong phản hồi, không ném; phiên sai bước → PluginRouteError", coEnv(KHONG_GSC, async () => {
	const p = createPlugin();
	let goi = 0;
	xoaDemChiMuc();
	const ctx = {
		...taoCtx(),
		kv: taoKvGia(),
		http: { async fetch() { goi++; return new Response(""); } },
		content: { async list() { return { items: [], hasMore: false }; } },
	};
	const kq = await p.routes["mcp-lay-tu-khoa-leo-top"].handler({ ...ctx, input: {} });
	assert.match(kq.loi, /Chưa cấu hình Search Console/);
	assert.equal(goi, 0, "không gọi mạng khi thiếu cấu hình");
	assert.equal((await p.routes["leo-top-tong-quan"].handler(ctx)).gscCoCauHinh, false);

	const loiRoute = (status) => (e) => e?.name === "PluginRouteError" && e.status === status;
	await assert.rejects(p.routes["mcp-lay-trang-serp"].handler({ ...ctx, input: { phienId: "khong-co" } }), loiRoute(404));
	const phien = await kho.taoPhienLeoTop(ctx.storage, { tuKhoa: "k", trang: MINH, viTri: 9, hienThi: 50 }, new Date().toISOString());
	await assert.rejects(p.routes["mcp-lay-trang-serp"].handler({ ...ctx, input: { phienId: phien.id } }), loiRoute(400));
	await assert.rejects(p.routes["mcp-nop-serp"].handler({ ...ctx, input: { phienId: "khong-co", urls: ["https://a.vn/1"] } }), loiRoute(404));
	await assert.rejects(p.routes["mcp-ghi-so-ho"].handler({ ...ctx, input: { phienId: phien.id, trang: [] } }), loiRoute(400));
	await assert.rejects(p.routes["leo-top-da-sua"].handler({ ...ctx, input: { id: phien.id } }), loiRoute(400));
	await assert.rejects(p.routes["leo-top-da-sua"].handler({ ...ctx, input: { id: phien.id, ngay: "hôm qua" } }), loiRoute(400));
	xoaDemChiMuc();
}));

test("leo-top-da-sua: không truyền ngày → lấy ngày hôm nay (giờ Việt Nam)", async () => {
	const p = createPlugin();
	const ctx = taoCtx();
	const phien = await kho.taoPhienLeoTop(ctx.storage, { tuKhoa: "k", trang: MINH, viTri: 9, hienThi: 50 }, new Date().toISOString());
	await ctx.storage.leo_top.put(phien.id, { ...(await ctx.storage.leo_top.get(phien.id)), trangThai: "co_phieu" });
	const kq = await p.routes["leo-top-da-sua"].handler({ ...ctx, input: { id: phien.id } });
	assert.equal(kq.ngaySua, new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10));
});

// ---- Tự động hoá: tự hẹn lịch khi mở màn, tự chạy ca đầu khi lưu đối thủ ----
const demHen = (ctx) => {
	let n = 0;
	const goc = ctx.cron.schedule.bind(ctx.cron);
	ctx.cron.schedule = async (...a) => { n++; return goc(...a); };
	return () => n;
};
const choNen = () => new Promise((r) => setTimeout(r, 30));

test("tong-quan: máy chủ (RADA_SEO_CA_DEM=1) tự hẹn lịch 'radar' khi chưa có; có rồi thì không hẹn lại", coBien("RADA_SEO_CA_DEM", "1", async () => {
	const p = createPlugin();
	const ctx = taoCtx();
	const soLan = demHen(ctx);
	let kq = await p.routes["tong-quan"].handler(ctx);
	assert.deepEqual(ctx.cron.lich, { ten: "radar", schedule: LICH_RADAR });
	assert.equal(soLan(), 1);
	assert.equal(kq.tuDongHenLich, true);
	assert.ok(kq.lich.length === 1);
	// EmDash list() trả { name, … }: khi đã có thì KHÔNG hẹn lại (hẹn lại là đẩy next_run_at).
	ctx.cron.list = async () => [{ name: "radar", schedule: LICH_RADAR }];
	kq = await p.routes["tong-quan"].handler(ctx);
	assert.equal(soLan(), 1);
	assert.equal(kq.tuDongHenLich, false);
}));

test("tong-quan: máy lập trình (không bật RADA_SEO_CA_DEM) KHÔNG hẹn lịch — bảng cron dùng chung", coBien("RADA_SEO_CA_DEM", undefined, async () => {
	const p = createPlugin();
	const ctx = taoCtx();
	const soLan = demHen(ctx);
	const kq = await p.routes["tong-quan"].handler(ctx);
	assert.equal(soLan(), 0);
	assert.equal(kq.tuDongHenLich, false);
}));

test("tong-quan: hẹn lịch hỏng không làm hỏng màn điều khiển", coBien("RADA_SEO_CA_DEM", "1", async () => {
	const p = createPlugin();
	const ctx = taoCtx();
	ctx.cron.schedule = async () => { throw new Error("db"); };
	const kq = await p.routes["tong-quan"].handler(ctx);
	assert.equal(kq.tuDongHenLich, false);
	assert.ok(ctx._log.some(([m]) => m === "error"));
}));

test("tong-quan: trả tinhTrang (lịch, ca gần nhất, trang chờ, Claude đã từng đọc chưa)", coBien("RADA_SEO_CA_DEM", undefined, async () => {
	const p = createPlugin();
	const ctx = taoCtx();
	let kq = await p.routes["tong-quan"].handler(ctx);
	assert.ok(Array.isArray(kq.tinhTrang));
	assert.match(kq.tinhTrang.map((x) => x.chu).join("\n"), /cần tạo routine trên claude\.ai/);
	// Một URL đã phân tích = Claude đã từng đọc, dù ca 'claude' đã trôi khỏi nhật ký.
	await ctx.storage.url.put("u1", { doiThuId: "a.vn", url: "https://a.vn/1", trangThai: "da_phan_tich" });
	kq = await p.routes["tong-quan"].handler(ctx);
	assert.doesNotMatch(kq.tinhTrang.map((x) => x.chu).join("\n"), /cần tạo routine/);
}));

const ctxThat = () => ({ ...taoCtx(), kv: taoKvGia() });

test("doi-thu-luu: máy chủ, chưa từng có ca radar thật → thả ca thật đầu tiên (qua khoá), trả caDauTien", coBien("RADA_SEO_CA_DEM", "1", async () => {
	const p = createPlugin();
	const ctx = ctxThat();
	const kq = await p.routes["doi-thu-luu"].handler({ ...ctx, input: { tenMien: "a.vn", ten: "A" } });
	assert.equal(kq.caDauTien, true);
	await choNen();
	// ctx không có http → chayCaRadar ném trong try → chayCa ghi dòng lỗi với ghi:true. Chứng minh
	// đã gọi đúng chayCa(ctx, true), và khoá đã được nhả.
	const ca = await kho.dsCa(ctx.storage);
	assert.equal(ca.length, 1);
	assert.equal(ca[0].ghi, true);
	assert.equal(await ctx.kv.get("ca:dang-chay"), null);
}));

test("doi-thu-luu: KHÔNG thả ca khi máy không bật ca đêm / đã có ca thật thành công / đang có ca chạy", async () => {
	const p = createPlugin();
	await coBien("RADA_SEO_CA_DEM", undefined, async () => {
		const ctx = ctxThat();
		const kq = await p.routes["doi-thu-luu"].handler({ ...ctx, input: { tenMien: "a.vn" } });
		assert.equal(kq.caDauTien, false);
		await choNen();
		assert.equal((await kho.dsCa(ctx.storage)).length, 0);
	})();
	await coBien("RADA_SEO_CA_DEM", "1", async () => {
		const ctx = ctxThat();
		const t = new Date().toISOString();
		await kho.ghiCa(ctx.storage, { loai: "radar", batDau: t, ketThuc: t, ghi: true, soSeTrich: 5, loi: [] });
		const kq = await p.routes["doi-thu-luu"].handler({ ...ctx, input: { tenMien: "a.vn" } });
		assert.equal(kq.caDauTien, false);
		await choNen();
		assert.equal((await kho.dsCa(ctx.storage)).length, 1);
	})();
	await coBien("RADA_SEO_CA_DEM", "1", async () => {
		const ctx = ctxThat();
		await ctx.kv.set("ca:dang-chay", { tu: "x", het: Date.now() + 60_000 });
		const kq = await p.routes["doi-thu-luu"].handler({ ...ctx, input: { tenMien: "a.vn" } });
		assert.equal(kq.caDauTien, false);
		await choNen();
		assert.equal((await kho.dsCa(ctx.storage)).length, 0);
	})();
});

test("doi-thu-luu: ca thử (ghi:false) không tính là ca thật — vẫn thả ca đầu", coBien("RADA_SEO_CA_DEM", "1", async () => {
	const p = createPlugin();
	const ctx = ctxThat();
	const t = new Date(Date.now() - 1000).toISOString();
	await kho.ghiCa(ctx.storage, { loai: "radar", batDau: t, ketThuc: t, ghi: false, soSeTrich: 5, loi: [] });
	const kq = await p.routes["doi-thu-luu"].handler({ ...ctx, input: { tenMien: "a.vn" } });
	assert.equal(kq.caDauTien, true);
	await choNen();
}));
