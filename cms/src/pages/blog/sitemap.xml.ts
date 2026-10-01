// /blog/sitemap.xml — sitemap ĐỘNG của blog: /blog/ + mọi bài đã đăng.
//
// Vì sao tách khỏi dist/sitemap.xml: tệp đó do khâu build sinh, bài vừa Publish trong CMS
// chưa có trong đó cho tới lần build sau. Tệp này luôn mới; khai thêm trong robots.txt.
// URL có "/" cuối, lastmod = ngay_cap_nhat ?? ngày đăng, bỏ bài noindex.
import type { APIRoute } from "astro";

import { sitemapBlog } from "../../lib/khung-blog.mjs";
import { docBaiDaDang, gocBlog } from "../../lib/doc-bai-blog";

export const GET: APIRoute = async () => {
	const { bai } = await docBaiDaDang();
	return new Response(sitemapBlog(bai, { domain: gocBlog() }), {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=600",
		},
	});
};
