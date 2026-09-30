import { test } from "node:test";
import assert from "node:assert/strict";
import { locNguon, locLink, chuanDuong } from "./loc-nguon-link.mjs";

const DUONG = new Set(["/huyet/tam-am-giao/", "/kinh/ty/", "/nguon/hoang-de-noi-kinh/", "/blog/dong-ho-kinh-lac/"]);

test("chuanDuong", () => {
	assert.equal(chuanDuong("/huyet/tam-am-giao?x=1#a"), "/huyet/tam-am-giao/");
});

test("locNguon: giữ URL đã quét và trang /nguon/ có thật, loại sách nhớ ra", () => {
	const r = locNguon(
		[
			{ ten: "Vinmec", url: "https://www.vinmec.com/bai-a/" },
			{ ten: "Hoàng Đế Nội Kinh", url: "/nguon/hoang-de-noi-kinh" },
			{ ten: "Châm cứu học, NXB Y học 2005" },
			{ ten: "Trang bịa", url: "https://example.com/khong-co" },
		],
		{ urlDaQuet: new Set(["https://www.vinmec.com/bai-a"]), duongCoThat: DUONG },
	);
	assert.deepEqual(r.giu.map((n) => n.ten), ["Vinmec", "Hoàng Đế Nội Kinh"]);
	assert.deepEqual(r.bo.map((n) => n.ten), ["Châm cứu học, NXB Y học 2005", "Trang bịa"]);
});

test("locLink: gỡ link chết giữ chữ, đếm link từ điển, không đụng ảnh và link ngoài", () => {
	const md = "Xem [Tam Âm Giao](/huyet/tam-am-giao) và [kinh Tỳ](/kinh/ty/), [bài cũ](/blog/dong-ho-kinh-lac/), [ma](/huyet/khong-co/). ![ảnh](/x.png) [ngoài](https://a.vn)";
	const r = locLink(md, DUONG);
	assert.deepEqual(r.goBo, ["/huyet/khong-co/"]);
	assert.equal(r.soLinkTuDien, 2);
	assert.ok(r.md.includes(", ma."));
	assert.ok(r.md.includes("![ảnh](/x.png)"));
	assert.ok(r.md.includes("[ngoài](https://a.vn)"));
});
