import { test } from "node:test";
import assert from "node:assert/strict";
import { urlDocDuoc, taoDocWeb, taoDocTrang, voiHanGio, TRAN_BYTE_THAN } from "./doc-web.mjs";

test("urlDocDuoc chặn đường vào mạng nội bộ", () => {
	assert.equal(urlDocDuoc("https://www.vinmec.com/a"), true);
	for (const u of ["http://backend:3000/x", "http://localhost/x", "http://127.0.0.1/x", "http://[::1]/x", "ftp://a.com/x", "rác"])
		assert.equal(urlDocDuoc(u), false, u);
});

test("taoDocWeb: trả chữ khi 200, rỗng khi lỗi/không 2xx/URL cấm, không bao giờ ném", async () => {
	const goi = [];
	const fetchGia = async (url) => {
		goi.push(url);
		if (url.includes("hong")) throw new Error("mạng");
		return new Response(url.includes("404") ? "x" : "chào", { status: url.includes("404") ? 404 : 200 });
	};
	const doc = taoDocWeb(fetchGia);
	assert.equal(await doc("https://a.com/ok"), "chào");
	assert.equal(await doc("https://a.com/404"), "");
	assert.equal(await doc("https://a.com/hong"), "");
	assert.equal(await doc("http://backend:3000/"), "");
	assert.deepEqual(goi, ["https://a.com/ok", "https://a.com/404", "https://a.com/hong"]);
});

test("voiHanGio ném khi quá hạn", async () => {
	await assert.rejects(voiHanGio(new Promise(() => {}), 20, "thử"), /thử quá hạn 20ms/);
});

test("taoDocTrang: trả status + x-robots-tag + html kể cả khi không 2xx; URL cấm hay lỗi mạng → null", async () => {
	const goi = [];
	const fetchGia = async (url) => {
		goi.push(url);
		if (url.includes("hong")) throw new Error("mạng");
		if (url.includes("404")) return new Response("mất", { status: 404 });
		return new Response("<title>x</title>", { status: 200, headers: { "X-Robots-Tag": "noindex" } });
	};
	const doc = taoDocTrang(fetchGia);
	assert.deepEqual(await doc("https://a.com/ok"), { status: 200, xRobots: "noindex", html: "<title>x</title>" });
	assert.deepEqual(await doc("https://a.com/404"), { status: 404, xRobots: "", html: "mất" });
	assert.equal(await doc("https://a.com/hong"), null);
	assert.equal(await doc("http://127.0.0.1/huyet/"), null);
	assert.deepEqual(goi, ["https://a.com/ok", "https://a.com/404", "https://a.com/hong"]);
});

// ---- Trần cỡ thân (fix round 1) ----
/** Response thân luồng: `soKhoi` khối × `coKhoi` byte; `treo` = không bao giờ đóng luồng. */
function phanHoiLuong({ soKhoi = 0, coKhoi = 64 * 1024, treo = false, status = 200 } = {}) {
	const dem = { khoi: 0, huy: false };
	const khoi = new TextEncoder().encode("a".repeat(coKhoi));
	const body = new ReadableStream({
		pull(c) {
			if (dem.khoi < soKhoi) {
				dem.khoi++;
				c.enqueue(khoi);
			} else if (!treo) c.close();
			else return new Promise(() => {});
		},
		cancel() {
			dem.huy = true;
		},
	});
	return { res: new Response(body, { status }), dem };
}

test("taoDocWeb / taoDocTrang: đọc tối đa 1,5 MB rồi huỷ luồng; taoDocTrang đánh dấu catBot", async () => {
	const a = phanHoiLuong({ soKhoi: 80 }); // 5 MB
	const html = await taoDocWeb(async () => a.res)("https://a.com/to");
	assert.equal(html.length, TRAN_BYTE_THAN);
	assert.equal(a.dem.huy, true);
	assert.ok(a.dem.khoi < 30, `đọc ${a.dem.khoi} khối — không được đọc hết luồng`);

	const b = phanHoiLuong({ soKhoi: 80 });
	const r = await taoDocTrang(async () => b.res)("https://a.com/to");
	assert.equal(r.html.length, TRAN_BYTE_THAN);
	assert.equal(r.catBot, true);
	assert.equal(b.dem.huy, true);

	// Trang nhỏ: nguyên vẹn, không có cờ catBot.
	const c = phanHoiLuong({ soKhoi: 2, coKhoi: 10 });
	assert.deepEqual(await taoDocTrang(async () => c.res)("https://a.com/nho"), { status: 200, xRobots: "", html: "a".repeat(20) });
});

test("thân không có luồng (fetch giả chỉ có text()) vẫn bị cắt ở trần", async () => {
	const res = { ok: true, status: 200, headers: new Headers(), body: null, text: async () => "b".repeat(TRAN_BYTE_THAN + 10) };
	assert.equal((await taoDocWeb(async () => res)("https://a.com/x")).length, TRAN_BYTE_THAN);
	const r = await taoDocTrang(async () => res)("https://a.com/x");
	assert.equal(r.html.length, TRAN_BYTE_THAN);
	assert.equal(r.catBot, true);
});

test("hạn giờ phủ cả khâu đọc thân: header về ngay mà thân treo → hết hạn, không treo ca", async () => {
	const t0 = Date.now();
	const a = phanHoiLuong({ soKhoi: 1, treo: true });
	assert.equal(await taoDocWeb(async () => a.res, { hanGioMs: 80 })("https://a.com/treo"), "");
	const b = phanHoiLuong({ soKhoi: 1, treo: true });
	assert.equal(await taoDocTrang(async () => b.res, { hanGioMs: 80 })("https://a.com/treo"), null);
	assert.ok(Date.now() - t0 < 1000);
	assert.equal(b.dem.huy, true, "hết hạn thì huỷ luồng, không để nó chạy ngầm");
});
