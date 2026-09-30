import { test } from "node:test";
import assert from "node:assert/strict";
import { layLoc, chuanTenMien, laUrlNoiDung, thuThapUrl } from "./sitemap.mjs";
import { webGia } from "../__test__/kho-gia.mjs";

test("chuanTenMien", () => {
	assert.equal(chuanTenMien("https://www.Vinmec.com/vi/"), "vinmec.com");
	assert.equal(chuanTenMien("nhathuoclongchau.com.vn"), "nhathuoclongchau.com.vn");
	assert.equal(chuanTenMien("khong co cham"), "");
});

test("layLoc giải mã thực thể XML", () => {
	assert.deepEqual(layLoc("<url><loc> https://a.com/x?a=1&amp;b=2 </loc></url>"), ["https://a.com/x?a=1&b=2"]);
});

test("laUrlNoiDung: bỏ trang chủ, tệp, và URL khác tên miền", () => {
	assert.equal(laUrlNoiDung("https://www.a.com/bai-1", "a.com"), true);
	assert.equal(laUrlNoiDung("https://a.com/", "a.com"), false);
	assert.equal(laUrlNoiDung("https://a.com/anh.jpg", "a.com"), false);
	assert.equal(laUrlNoiDung("https://b.com/bai", "a.com"), false);
});

test("thuThapUrl: robots → index → sitemap con; bỏ sitemap trỏ ra ngoài và .gz; khử trùng; có trần", async () => {
	const web = webGia({
		"https://a.com/robots.txt": "Sitemap: https://a.com/idx.xml\nSitemap: http://backend:3000/noi-bo.xml",
		"https://a.com/idx.xml": "<sitemapindex><sitemap><loc>https://a.com/s1.xml</loc></sitemap><sitemap><loc>https://evil.com/s.xml</loc></sitemap><sitemap><loc>https://a.com/s2.xml.gz</loc></sitemap></sitemapindex>",
		"https://a.com/s1.xml": "<urlset><url><loc>https://a.com/b1</loc></url><url><loc>https://a.com/b2</loc></url><url><loc>https://a.com/b1</loc></url><url><loc>https://a.com/</loc></url></urlset>",
		"https://a.com/sitemap.xml": "<urlset><url><loc>https://www.a.com/b3</loc></url></urlset>",
	});
	assert.deepEqual((await thuThapUrl("a.com", web)).sort(), ["https://a.com/b1", "https://a.com/b2", "https://www.a.com/b3"]);
	assert.equal((await thuThapUrl("a.com", web, { tranUrl: 2 })).length, 2);
});

test("thuThapUrl: lấy bài MỚI NHẤT trước khi áp trần (Yoast liệt kê cũ trước)", async () => {
	const url = (loc, lastmod) => `<url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
	const web = webGia({
		// Sitemap con MỚI đứng THỨ HAI trong index; trong mỗi sitemap con, bài cũ đứng trước.
		"https://a.com/sitemap.xml":
			"<sitemapindex><sitemap><loc>https://a.com/s-cu.xml</loc><lastmod>2024-03-01</lastmod></sitemap>" +
			"<sitemap><loc>https://a.com/s-moi.xml</loc><lastmod>2026-09-01T10:00:00+07:00</lastmod></sitemap></sitemapindex>",
		"https://a.com/s-cu.xml": `<urlset>${url("https://a.com/p1", "2024-01-01")}${url("https://a.com/p2", "2024-02-01")}</urlset>`,
		"https://a.com/s-moi.xml": `<urlset>${url("https://a.com/p3", "2026-01-01")}${url("https://a.com/khong-ngay")}${url("https://a.com/p4", "2026-03-01")}</urlset>`,
	});
	assert.deepEqual(await thuThapUrl("a.com", web, { tranUrl: 2 }), ["https://a.com/p4", "https://a.com/p3"]);
	// Không trần: mục có ngày xếp mới→cũ, mục không ngày xếp sau, giữ thứ tự gặp.
	assert.deepEqual(await thuThapUrl("a.com", web), ["https://a.com/p4", "https://a.com/p3", "https://a.com/p2", "https://a.com/p1", "https://a.com/khong-ngay"]);
});
