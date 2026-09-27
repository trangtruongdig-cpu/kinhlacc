/**
 * MIDDLEWARE CỦA RIÊNG KINH LẠC — ba việc nhỏ, đều ở tầng máy chủ.
 *
 * Vì sao ở đây mà không sửa giao diện admin: khu quản trị là gói `@emdash-cms/admin`
 * nằm trong `node_modules`, không có điểm cắm nào cho thanh công cụ hay ô slug. Mọi thứ
 * làm được ở tầng HTTP thì làm ở đây — nó sống sót qua mỗi lần nâng cấp EmDash, còn mã
 * sửa DOM thì không.
 *
 * ⚠️ Middleware này KHÔNG BAO GIỜ được làm hỏng một request. Mọi nhánh thêm vào đều
 * nằm trong try/catch và khi có lỗi thì trả nguyên phản hồi gốc. Khu quản trị và đường
 * đăng nhập đi qua đây — hỏng ở đây là không ai vào được CMS nữa.
 *
 * Ba việc:
 *
 *   1. ĐƯA ĐƯỜNG TRANG TỪ ĐIỂN VỀ SITE THẬT (chỉ ở máy lập trình).
 *   2. DỊCH LỜI TỪ CHỐI TRÙNG SLUG sang tiếng Việt, kèm tên mục đang giữ slug đó.
 *   3. DỊCH LỖI MỐC THỜI GIAN SAI DẠNG — câu tiếng Anh của EmDash không nhắc tới mục
 *      nào nên rất dễ bị đoán nhầm sang "trùng link". Đã mất một buổi vì chuyện đó.
 */

import type { MiddlewareHandler } from "astro";

import { boHopLe, dichLoiEmDash } from "./lib/loi-tieng-viet.ts";
import { scriptTroGiupAdmin } from "./lib/tro-giup-admin.ts";

// ── 1. Đưa đường trang từ điển về site thật ────────────────────────────────────
//
// Thư viện từ điển là HTML TĨNH do nginx phục vụ (xem CLAUDE.md, mục "Thư viện từ
// điển: CMS là KHO"). CMS không có route nào cho `/huyet/`, `/nguon/`, `/bai-thuoc/`…
// Hệ quả: ở máy lập trình, nút "xem bản live" của EmDash — nút dựng đường từ
// `url_pattern` của bộ — luôn ra 404, và trang 404 của CMS dùng chung layout blog nên
// trông y như trang chủ. Đã có người đi chẩn đoán nhầm sang lỗi kết nối CSDL.
//
// Thay vì sửa nút, sửa cái đích: đường nào CMS không có thì đẩy sang site đang chạy
// thật. Nút sẵn có lập tức đúng, và không phải đụng một dòng nào trong `node_modules`.
//
// ⚠️ CHỈ BẬT KHI CÓ `URL_SITE_THAT`, và CỐ Ý không dùng lại `EMDASH_SITE_URL`: trên
// production `EMDASH_SITE_URL` chính là origin của CMS, nên lấy nó làm đích là tự đẩy
// mình vào VÒNG LẶP CHUYỂN HƯỚNG. Biến này chỉ khai ở `cms/.env` của máy lập trình;
// trên VPS không khai thì cả nhánh này nằm im.
const URL_SITE_THAT = process.env.URL_SITE_THAT?.replace(/\/+$/, "");

/** Đường của CMS, không bao giờ được đẩy đi đâu cả. */
const CUA_CMS = ["/_emdash", "/_astro", "/_image", "/trang/", "/blog/", "/chuyen-muc/", "/cum/"];

function dayVeSiteThat(url: URL): Response | null {
	if (!URL_SITE_THAT) return null;
	// Tự đẩy về chính mình là vòng lặp. Chặn bằng phép so host, không bằng lòng tin.
	if (new URL(URL_SITE_THAT).host === url.host) return null;
	if (CUA_CMS.some((d) => url.pathname.startsWith(d))) return null;
	return Response.redirect(`${URL_SITE_THAT}${url.pathname}${url.search}`, 302);
}

// ── 2 & 3. Nói lại lời từ chối của API bằng tiếng Việt ─────────────────────────

/**
 * Mục nào đang giữ slug này? Câu tiếng Anh của EmDash chỉ nói "đã tồn tại" mà không
 * nói của ai, nên người biên tập phải đi tìm tay. Tra một câu là đỡ hẳn.
 *
 * Dùng `locals.emdash.db` — kết nối SẴN CÓ của EmDash. ⚠️ Tuyệt đối không mở pool
 * riêng: Aiven chỉ có 20 slot và đã có ngày 8 endpoint ngã vì hết slot (xem chú thích
 * `pool` trong astro.config.mjs).
 */
async function aiDangGiuSlug(
	db: any,
	bo: string,
	slug: string,
): Promise<{ title: string | null; id: string } | null> {
	// `bo` đến từ đường dẫn nên phải chặn trước khi ghép vào tên bảng.
	if (!boHopLe(bo) || !slug) return null;
	try {
		const r = await db
			.selectFrom(`ec_${bo}`)
			.select(["id", "title"])
			.where("slug", "=", slug)
			.where("deleted_at", "is", null)
			.executeTakeFirst();
		return r ?? null;
	} catch {
		// Bộ không có cột `title`, bảng không tồn tại… — mất phần trang trí, không mất
		// lời từ chối. Chỗ gọi vẫn dịch được câu chính.
		return null;
	}
}

/** Viết lại `error.message` trong một phản hồi JSON, giữ nguyên mọi thứ khác. */
function thayLoi(than: any, cauMoi: string): any {
	return { ...than, error: { ...than.error, message: cauMoi } };
}

export const onRequest: MiddlewareHandler = async (ctx, next) => {
	const url = new URL(ctx.request.url);

	// Nút "View Site" ở thanh trên của khu quản trị có `href="/"` ĐÓNG CỨNG trong
	// `@emdash-cms/admin` — không cấu hình được. Ở máy lập trình nó dẫn tới trang blog
	// mẫu của template EmDash, thứ không ai dùng: khách đọc HTML tĩnh do nginx phục vụ,
	// và trên VPS nginx còn không đẩy `/` sang CMS. Nên ở local, gốc đi thẳng ra site
	// thật — nút ấy có nghĩa trở lại mà không phải đụng vào node_modules.
	//
	// Muốn xem lại trang blog mẫu thì bỏ `URL_SITE_THAT` khỏi `cms/.env`.
	if (url.pathname === "/" && ctx.request.method === "GET") {
		const day = dayVeSiteThat(url);
		if (day) return day;
	}

	const traLoi = await next();

	try {
		// ── 4. Chèn mảnh trợ giúp vào khu quản trị ──
		// Nhúng thẳng chứ không dẫn tới tệp rời: nginx trên VPS chỉ đẩy `/_emdash/`,
		// `/_astro/`, `/trang/` sang container cms, nên một tệp ở đường khác sẽ chạy
		// ngon ở máy lập trình rồi 404 trên site thật. CSP của khu quản trị có
		// `script-src 'self' 'unsafe-inline'` nên mã nội tuyến được phép (đã đo).
		if (
			url.pathname.startsWith("/_emdash/admin") &&
			traLoi.ok &&
			(traLoi.headers.get("content-type") ?? "").includes("text/html")
		) {
			const html = await traLoi.clone().text();
			if (html.includes("</head>")) {
				const daChen = html.replace(
					"</head>",
					`<script>${scriptTroGiupAdmin(URL_SITE_THAT ?? "")}</script></head>`,
				);
				const dau = new Headers(traLoi.headers);
				// Thân dài ra thì con số cũ thành lời nói dối — trình duyệt sẽ cắt cụt trang.
				dau.delete("content-length");
				return new Response(daChen, { status: traLoi.status, headers: dau });
			}
		}

		// ── 1 ──
		if (
			traLoi.status === 404 &&
			ctx.request.method === "GET" &&
			(traLoi.headers.get("content-type") ?? "").includes("text/html")
		) {
			const day = dayVeSiteThat(url);
			if (day) return day;
		}

		// ── 2 & 3 ──
		// Chỉ đụng vào API nội dung, và chỉ khi phản hồi là JSON lỗi. Đọc thân một
		// phản hồi HTML của khu quản trị chỉ để dò chuỗi là vừa tốn vừa liều.
		const laApiNoiDung = url.pathname.startsWith("/_emdash/api/content/");
		const laJson = (traLoi.headers.get("content-type") ?? "").includes("application/json");
		if (!laApiNoiDung || !laJson || traLoi.ok) return traLoi;

		const than = await traLoi.clone().json();
		const cau: string = than?.error?.message ?? "";
		if (!cau) return traLoi;

		// Lượt một: nhận dạng câu. Không nhận ra thì trả nguyên phản hồi gốc — dịch nửa
		// vời còn tệ hơn để tiếng Anh, vì người đọc mất luôn khả năng tra câu gốc.
		const so = dichLoiEmDash(cau);
		if (!so) return traLoi;

		// Lượt hai: chỉ riêng ca trùng slug mới cần tra CSDL xem AI đang giữ nó.
		const chu =
			so.loai === "trung-slug" && so.slug
				? await aiDangGiuSlug((ctx.locals as any).emdash?.db, url.pathname.split("/")[4] ?? "", so.slug)
				: null;
		const daDich = chu ? dichLoiEmDash(cau, chu) : so;

		return Response.json(thayLoi(than, daDich!.cau), {
			status: traLoi.status,
			headers: traLoi.headers,
		});
	} catch (loi) {
		// Không bao giờ để một tiện ích phụ làm hỏng phản hồi thật.
		console.warn("[kinhlac-middleware] bỏ qua vì lỗi:", loi);
	}

	return traLoi;
};
