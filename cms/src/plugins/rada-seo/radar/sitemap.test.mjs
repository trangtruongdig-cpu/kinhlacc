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

// ---- Đào sâu: ca sau phải đi TIẾP, không gom lại 300 URL cũ (03/10/2026) ----

const webSau = (chiMuc, con) => async (u) => (u.endsWith("robots.txt") ? "" : u.includes("sitemap_index") ? chiMuc : (con[u] ?? ""));
const sm = (loc, lastmod) => `<sitemap><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</sitemap>`;
const bai = (...u) => `<urlset>${u.map((x) => `<url><loc>${x}</loc></url>`).join("")}</urlset>`;

test("URL đã có trong kho KHÔNG ăn vào trần — ca sau lấy được URL thật sự mới", async () => {
	const web = webSau(`<sitemapindex>${sm("https://a.com/post-sitemap1.xml", "2026-10-01")}</sitemapindex>`, {
		"https://a.com/post-sitemap1.xml": bai("https://a.com/p1", "https://a.com/p2", "https://a.com/p3", "https://a.com/p4"),
	});
	// Lượt 1: trần 2 → lấy 2 bài, sitemap KHÔNG được ghi sổ vì còn sót.
	const l1 = await thuThapUrl("a.com", web, { tranUrl: 2 });
	assert.equal(l1.urls.length, 2);
	assert.deepEqual(l1.daDoc, [], "cắt mất một phần thì KHÔNG được ghi 'đã đọc xong'");
	assert.deepEqual(l1.conSot, ["https://a.com/post-sitemap1.xml"]);
	// Lượt 2: hai URL kia đã vào kho → trần dành cho hai URL còn lại, và giờ mới ghi sổ.
	const daCo = new Set(l1.urls);
	const l2 = await thuThapUrl("a.com", web, { tranUrl: 2, locMoi: (ds) => ds.filter((x) => !daCo.has(x)) });
	assert.equal(l2.urls.length, 2);
	assert.equal(l2.urls.some((u) => daCo.has(u)), false, "ca sau không được gom lại URL cũ");
	assert.equal(l2.daDoc.length, 1);
});

test("sổ sitemap: bỏ qua sitemap đã đọc xong, nhờ đó trần sitemap dành cho phần CHƯA đọc", async () => {
	const chiMuc = `<sitemapindex>${sm("https://a.com/s1.xml", "2026-09-01")}${sm("https://a.com/s2.xml", "2026-09-02")}</sitemapindex>`;
	const daTai = [];
	const web = async (u) => {
		daTai.push(u);
		return u.endsWith("robots.txt") ? "" : u.includes("sitemap_index") ? chiMuc : u.includes("s1") ? bai("https://a.com/a1") : bai("https://a.com/b1");
	};
	const kq = await thuThapUrl("a.com", web, { daDocSitemap: { "https://a.com/s1.xml": { lastmod: Date.parse("2026-09-01"), luc: Date.now() } } });
	assert.equal(kq.soSitemapBoQua, 1);
	assert.equal(daTai.includes("https://a.com/s1.xml"), false, "sitemap đã đọc xong và không đổi thì không tải lại");
	assert.deepEqual(kq.urls, ["https://a.com/b1"]);
});

test("sitemap đã đọc xong nhưng lastmod MỚI HƠN thì phải đọc lại — không thì bỏ sót bài mới", async () => {
	const chiMuc = `<sitemapindex>${sm("https://a.com/s1.xml", "2026-10-02")}</sitemapindex>`;
	const web = webSau(chiMuc, { "https://a.com/s1.xml": bai("https://a.com/moi") });
	const kq = await thuThapUrl("a.com", web, { daDocSitemap: { "https://a.com/s1.xml": { lastmod: Date.parse("2026-09-01"), luc: Date.now() } } });
	assert.deepEqual(kq.urls, ["https://a.com/moi"]);
	assert.equal(kq.soSitemapBoQua, 0);
});

test("index KHÔNG khai lastmod: đọc lại theo chu kỳ, không phải mỗi đêm", async () => {
	const chiMuc = `<sitemapindex>${sm("https://a.com/s1.xml")}</sitemapindex>`;
	const web = webSau(chiMuc, { "https://a.com/s1.xml": bai("https://a.com/x1") });
	const now = Date.parse("2026-10-03T00:00:00Z");
	const moi = { "https://a.com/s1.xml": { lastmod: null, luc: now - 2 * 86_400_000 } };
	assert.equal((await thuThapUrl("a.com", web, { daDocSitemap: moi, now })).soSitemapBoQua, 1, "đọc 2 ngày trước thì chưa cần đọc lại");
	const cu = { "https://a.com/s1.xml": { lastmod: null, luc: now - 9 * 86_400_000 } };
	assert.deepEqual((await thuThapUrl("a.com", web, { daDocSitemap: cu, now })).urls, ["https://a.com/x1"], "quá HAN_DOC_LAI_MS thì đọc lại");
});
