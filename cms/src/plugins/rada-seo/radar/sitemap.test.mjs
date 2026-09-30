import { test } from "node:test";
import assert from "node:assert/strict";
import { layLoc, chuanTenMien, laUrlNoiDung, thuThapUrl, phanLoaiSitemap } from "./sitemap.mjs";
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
	assert.deepEqual((await thuThapUrl("a.com", web)).urls.sort(), ["https://a.com/b1", "https://a.com/b2", "https://www.a.com/b3"]);
	assert.equal((await thuThapUrl("a.com", web, { tranUrl: 2 })).urls.length, 2);
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
	assert.deepEqual((await thuThapUrl("a.com", web, { tranUrl: 2 })).urls, ["https://a.com/p4", "https://a.com/p3"]);
	// Không trần: mục có ngày xếp mới→cũ, mục không ngày xếp sau, giữ thứ tự gặp.
	assert.deepEqual((await thuThapUrl("a.com", web)).urls, ["https://a.com/p4", "https://a.com/p3", "https://a.com/p2", "https://a.com/p1", "https://a.com/khong-ngay"]);
});

test("phanLoaiSitemap: giữ bài viết, bỏ bác sĩ/dịch vụ/danh mục, không rõ thì giữ", () => {
	for (const u of ["https://a.vn/post-sitemap.xml", "https://a.vn/post-sitemap2.xml", "https://a.vn/tin-tuc-sitemap.xml", "https://a.vn/sitemap-blog.xml", "https://a.vn/cam-nang/sitemap.xml"])
		assert.equal(phanLoaiSitemap(u), "bai_viet", u);
	for (const u of ["https://a.vn/page-sitemap.xml", "https://a.vn/category-sitemap.xml", "https://a.vn/bac-si-sitemap.xml", "https://a.vn/chi-nhanh-sitemap.xml", "https://a.vn/dich-vu-sitemap.xml", "https://a.vn/tuyen-dung-sitemap.xml", "https://a.vn/post_tag-sitemap.xml", "https://a.vn/author-sitemap.xml"])
		assert.equal(phanLoaiSitemap(u), "bo", u);
	assert.equal(phanLoaiSitemap("https://a.vn/sitemap-3.xml"), "khong_ro");
});

test("phanLoaiSitemap: sitemap lõi WordPress (wp-sitemap-*) và tên có gạch dưới", () => {
	for (const u of [
		"https://a.vn/wp-sitemap-posts-page-1.xml",
		"https://a.vn/wp-sitemap-posts-dich_vu-1.xml",
		"https://a.vn/wp-sitemap-posts-bac_si-1.xml",
		"https://a.vn/wp-sitemap-posts-chi_nhanh-1.xml",
		"https://a.vn/wp-sitemap-posts-chuyen_gia-1.xml",
		"https://a.vn/wp-sitemap-users-1.xml",
		"https://a.vn/wp-sitemap-posts-elementor_library-1.xml",
		"https://a.vn/wp-sitemap-taxonomies-category-1.xml",
	])
		assert.equal(phanLoaiSitemap(u), "bo", u);
	assert.equal(phanLoaiSitemap("https://a.vn/wp-sitemap-posts-post-1.xml"), "bai_viet");
});

test("thuThapUrl: bỏ sitemap con loại 'bo', trả danh sách đã bỏ", async () => {
	const web = webGia({
		"https://a.com/sitemap.xml": "<sitemapindex><sitemap><loc>https://a.com/post-sitemap.xml</loc></sitemap><sitemap><loc>https://a.com/bac-si-sitemap.xml</loc></sitemap><sitemap><loc>https://a.com/sitemap-9.xml</loc></sitemap></sitemapindex>",
		"https://a.com/post-sitemap.xml": "<urlset><url><loc>https://a.com/bai-1</loc></url></urlset>",
		"https://a.com/bac-si-sitemap.xml": "<urlset><url><loc>https://a.com/bs-an</loc></url></urlset>",
		"https://a.com/sitemap-9.xml": "<urlset><url><loc>https://a.com/khac</loc></url></urlset>",
	});
	const kq = await thuThapUrl("a.com", web);
	assert.deepEqual(kq.urls.sort(), ["https://a.com/bai-1", "https://a.com/khac"]);
	assert.deepEqual(kq.sitemapBo, ["https://a.com/bac-si-sitemap.xml"]);
});
