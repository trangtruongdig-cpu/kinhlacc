// /thu-vien/goi-y.json?q=… — Gợi ý cho ô tra cứu.
//
// Chỉ khớp TÊN (tiêu đề + tên gọi khác), không lục thân bài: gợi ý phải trả lời trong
// vài chục mili-giây, còn tra sâu là việc của trang /thu-vien/tra.
import type { APIRoute } from "astro";
import { goiY } from "../../lib/traCuu";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	const q = (url.searchParams.get("q") || "").trim().slice(0, 80);
	const bo = url.searchParams.get("bo") || undefined;
	if (q.length < 2) {
		return new Response("[]", { headers: { "content-type": "application/json" } });
	}

	try {
		const ds = await goiY(q, 8);
		const loc = bo ? ds.filter((x) => x.bo === bo) : ds;
		return new Response(
			JSON.stringify(
				loc.map((x) => ({
					tieu_de: x.tieu_de,
					ten_khac: x.ten_khac,
					slug: x.slug,
					duong_dan: x.duong_dan,
					nhan: x.nhan,
				})),
			),
			{
				headers: {
					"content-type": "application/json",
					// Cùng một chữ gõ ra thì cùng một gợi ý — cho trình duyệt và nginx giữ
					// lại một lúc, đỡ một vòng vào database cho mỗi phím.
					"cache-control": "public, max-age=60",
				},
			},
		);
	} catch (e) {
		console.error("[goi-y]", e instanceof Error ? e.message : e);
		return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
	}
};
