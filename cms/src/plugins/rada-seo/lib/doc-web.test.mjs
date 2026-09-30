import { test } from "node:test";
import assert from "node:assert/strict";
import { urlDocDuoc, taoDocWeb, voiHanGio } from "./doc-web.mjs";

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
