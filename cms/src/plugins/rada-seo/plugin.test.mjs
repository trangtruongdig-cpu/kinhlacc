import { test } from "node:test";
import assert from "node:assert/strict";
import { createPlugin, LICH_RADAR, GIO_UTC_CHAY } from "./plugin.mjs";
import * as kho from "./kho.mjs";
import { taoKhoGia } from "./__test__/kho-gia.mjs";

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
