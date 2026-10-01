// /blog/sitemap.xml — sitemap ĐỘNG của blog: /blog/ + mọi bài đã đăng.
//
// Vì sao tách khỏi dist/sitemap.xml: tệp đó do khâu build sinh, bài vừa Publish trong CMS
// chưa có trong đó cho tới lần build sau. Tệp này luôn mới; khai thêm trong robots.txt.
// URL có "/" cuối, lastmod = ngay_cap_nhat ?? ngày đăng, bỏ bài noindex.
import type { APIRoute } from "astro";

import { sitemapBlog } from "../../lib/khung-blog.mjs";
import { docBaiDaDang, gocBlog } from "../../lib/doc-bai-blog";

export const GET: APIRoute = async ({ cache }) => {
	const { bai, cacheHint } = await docBaiDaDang();
	// PHẢI gắn tag của bộ bai_viet: đường này khớp routeRules "/blog/[...slug]" nên bị đệm
	// 1 giờ (+1 ngày swr). Không có tag thì Publish/Unpublish không xoá được bản đệm — đo
	// trên bàn thử 01/10/2026: bài đã lên danh sách mà sitemap vẫn chỉ có /blog/.
	if (cache?.enabled) cache.set(cacheHint);
	return new Response(sitemapBlog(bai, { domain: gocBlog() }), {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=600",
		},
	});
};
