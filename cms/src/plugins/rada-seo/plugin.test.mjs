import { test } from "node:test";
import assert from "node:assert/strict";
import { createPlugin, LICH_RADAR, GIO_UTC_CHAY } from "./plugin.mjs";
import * as kho from "./kho.mjs";
import { taoKhoGia } from "./__test__/kho-gia.mjs";
import { xoaDemChiMuc } from "./noi-bo/nap.mjs";
import { DEM_KIEM_CHUNG } from "./noi-bo/kiem-duong.mjs";

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

test("MCP: 4 công cụ, mỗi cái trỏ route có thật, có permission bậc contributor và khuôn zod", () => {
	const p = createPlugin();
	const tools = p.mcp.tools;
	assert.deepEqual(Object.keys(tools).sort(), ["rada_ghi_phan_tich", "rada_lay_viec", "rada_tim_lien_ket", "rada_xong_phan_tich"]);
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
