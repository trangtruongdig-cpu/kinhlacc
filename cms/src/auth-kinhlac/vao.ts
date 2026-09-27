/**
 * POST /_emdash/api/auth/kinhlac/vao
 *
 * Đổi một VÉ do app Kinh Lạc cấp lấy PHIÊN ĐĂNG NHẬP của EmDash.
 *
 * Đây là toàn bộ phần "đăng nhập một lần": người đã đăng nhập vào kinhlac.online và có
 * quyền Biên Tập / Quản Trị Nội Dung thì không phải đăng nhập lần nữa ở khu quản trị.
 *
 * ⚠️ Chỉ POST, và vé đi trong THÂN bài chứ không phải trên URL. Vé trên URL là vé nằm
 * trong log của nginx, trong lịch sử trình duyệt, và trong header Referer gửi cho bên
 * thứ ba. 60 giây vẫn là quá dài cho ba chỗ đó.
 *
 * ⚠️ Route này nằm trong `publicRoutes` của nhà cung cấp (xem `nha-cung-cap.ts`) nên
 * middleware xác thực của EmDash bỏ qua nó — bắt buộc phải thế, vì người gọi chính là
 * người CHƯA có phiên. Nó tự gác lấy mình bằng chữ ký của vé.
 *
 * Đường lùi vẫn còn nguyên: passkey ở /_emdash/admin/login không bị động tới.
 */

import type { APIRoute } from "astro";
import { ulid } from "ulidx";

import { docVe, tieuVe, VeKhongHopLe } from "./ve.js";

export const prerender = false;

/** Một lời từ chối DUY NHẤT cho mọi kiểu vé hỏng — vé sai không được dùng làm máy dò. */
const TU_CHOI = "Vé không hợp lệ hoặc đã hết hạn. Hãy mở lại từ trang Kinh Lạc.";

function traLoi(ok: boolean, thongDiep: string, ma: number): Response {
	return new Response(JSON.stringify({ ok, thongDiep }), {
		status: ma,
		headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
	});
}

export const POST: APIRoute = async ({ request, locals, session }) => {
	const emdash = locals.emdash;
	if (!emdash?.db) return traLoi(false, "CMS chưa sẵn sàng.", 500);

	const biMat = process.env.CMS_SSO_SECRET;
	if (!biMat) {
		// Nói thẳng ra là thiếu cấu hình. Gộp nó vào TU_CHOI thì người vận hành sẽ đi
		// tìm lỗi ở phía app suốt buổi, trong khi thứ thiếu nằm ngay trong cms/.env.
		console.error("[kinhlac-sso] Thiếu CMS_SSO_SECRET — không đổi vé được.");
		return traLoi(false, "Máy chủ CMS chưa cấu hình CMS_SSO_SECRET.", 503);
	}

	let ve: Awaited<ReturnType<typeof docVe>>;
	try {
		const than = (await request.json()) as { ve?: unknown };
		if (typeof than?.ve !== "string" || !than.ve) return traLoi(false, TU_CHOI, 401);
		ve = await docVe(than.ve, biMat);
	} catch (loi) {
		if (loi instanceof VeKhongHopLe) {
			console.warn(`[kinhlac-sso] Vé bị từ chối (${loi.ma}): ${loi.message}`);
		} else {
			console.warn("[kinhlac-sso] Không đọc được thân request:", loi);
		}
		return traLoi(false, TU_CHOI, 401);
	}

	// Dùng một lần. Đặt SAU khi chữ ký đã đạt, để vé bịa không làm bẩn sổ.
	if (!tieuVe(ve.jti, ve.exp)) {
		console.warn(`[kinhlac-sso] Vé ${ve.jti} bị dùng lại.`);
		return traLoi(false, TU_CHOI, 401);
	}

	try {
		// Truy vấn thẳng bằng kysely thay vì qua `@emdash-cms/auth` — theo đúng lối mà
		// route dev-bypass của EmDash đã chọn, để khỏi kéo cả gói xác thực vào đây.
		const dangCo = await emdash.db
			.selectFrom("users")
			.selectAll()
			.where("email", "=", ve.email)
			.executeTakeFirst();

		const bayGio = new Date().toISOString();
		let id: string;

		if (!dangCo) {
			id = ulid();
			await emdash.db
				.insertInto("users")
				.values({
					id,
					email: ve.email,
					name: ve.ten,
					role: ve.vaiTro,
					email_verified: 1,
					created_at: bayGio,
					updated_at: bayGio,
				})
				.execute();
			console.log(`[kinhlac-sso] Lập người dùng mới: ${ve.email} (bậc ${ve.vaiTro})`);
		} else {
			if (dangCo.disabled) {
				// Khoá bên CMS phải THẮNG quyền bên app: đó là cách duy nhất chặn tức thì
				// một người đang có quyền mà mình cần tống ra ngay.
				console.warn(`[kinhlac-sso] Từ chối ${ve.email}: tài khoản bị khoá trong CMS.`);
				return traLoi(false, "Tài khoản này đã bị khoá trong khu quản trị nội dung.", 403);
			}
			id = dangCo.id;

			// Đồng bộ tên và bậc theo quyền HIỆN TẠI bên app. Hạ bậc cũng là đồng bộ:
			// bỏ tick "quản trị nội dung" thì lần vào sau chỉ còn là biên tập.
			const doi: Record<string, unknown> = {};
			if (ve.ten && dangCo.name !== ve.ten) doi.name = ve.ten;
			if (dangCo.role !== ve.vaiTro) doi.role = ve.vaiTro;
			if (Object.keys(doi).length) {
				doi.updated_at = bayGio;
				await emdash.db.updateTable("users").set(doi).where("id", "=", id).execute();
				console.log(`[kinhlac-sso] Cập nhật ${ve.email}: ${Object.keys(doi).join(", ")}`);
			}
		}

		if (!session) {
			console.error("[kinhlac-sso] Astro session không bật — không lập được phiên.");
			return traLoi(false, "CMS chưa bật phiên đăng nhập.", 500);
		}
		// Hình dạng này do EmDash quy định: middleware đọc `user.id` rồi tự nạp lại
		// người dùng từ kho mỗi request. Xem `handlePasskeyAuth` trong middleware/auth.
		session.set("user", { id });

		return traLoi(true, "Đã vào khu quản trị nội dung.", 200);
	} catch (loi) {
		console.error("[kinhlac-sso] Lỗi khi lập phiên:", loi);
		return traLoi(false, "Không lập được phiên đăng nhập. Xem log của CMS.", 500);
	}
};
