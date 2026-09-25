// Endpoint kiểm sức khoẻ CHO DOCKER, gọi nội bộ trong container (127.0.0.1:4321).
// Không đi qua nginx nên không lộ ra ngoài internet.
//
// Vì sao phải tự viết: EmDash không có sẵn endpoint nào phân biệt được "sống" với "khoẻ".
//   /_emdash/admin/login      -> trang tĩnh, luôn 200 kể cả khi DB chết
//   /_emdash/api/media        -> 401 kể cả khi CMS chưa khởi tạo được  ← bẫy, đã mắc
//   /_emdash/api/content/...  -> 500 khi chưa khởi tạo, nhưng phụ thuộc tên collection
//
// Ở đây đọc thẳng một collection: nối được database và schema có thật thì mới trả 200.
import type { APIRoute } from "astro";
import { getEmDashCollection } from "emdash";

export const GET: APIRoute = async () => {
	try {
		const { entries } = await getEmDashCollection("bai_viet", { limit: 1 });
		return new Response(JSON.stringify({ ok: true, doc: Array.isArray(entries) ? entries.length : 0 }), {
			status: 200,
			headers: { "content-type": "application/json", "cache-control": "no-store" },
		});
	} catch (e) {
		return new Response(JSON.stringify({ ok: false, loi: String((e as Error)?.message || e).slice(0, 300) }), {
			status: 503,
			headers: { "content-type": "application/json", "cache-control": "no-store" },
		});
	}
};
