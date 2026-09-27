/**
 * NHÀ CUNG CẤP XÁC THỰC "kinhlac" — đăng nhập một lần từ app sang khu quản trị.
 *
 * EmDash công bố đúng ba móc mà việc này cần, và đây là chỗ khai cả ba:
 *
 *  - `routes`      → route được inject lúc build (xem `injectAuthProviderRoutes`).
 *  - `publicRoutes`→ đường được middleware xác thực BỎ QUA (xem `isPublicEmDashRoute`).
 *                    Bắt buộc: người đổi vé chính là người chưa có phiên.
 *  - `adminEntry`  → component React hiện trên trang đăng nhập.
 *
 * ⚠️ Đây là `authProviders` (thêm một cách đăng nhập), KHÔNG phải `auth` (thay toàn
 * bộ cách đăng nhập). Chọn nhầm sang `auth` là mất passkey: ở production middleware
 * ép chế độ external cho MỌI đường, kể cả `/_emdash/admin/login`, nên trang đăng nhập
 * thành vô dụng và app backend sập là không ai vào được CMS nữa.
 *
 * ⚠️ `publicRoutes` kết thúc bằng "/" được hiểu là TIỀN TỐ, không có "/" là khớp
 * chính xác — xem `isPublicEmDashRoute`. Ở đây dùng tiền tố để sau này thêm route
 * cùng họ không phải sửa hai chỗ rồi quên một.
 */

import { fileURLToPath } from "node:url";

/** Đường tuyệt đối — module ảo sinh ra `authProviders` không có vị trí trên đĩa nên
 *  đường tương đối trong đó không phân giải được. */
const tep = (ten: string) => fileURLToPath(new URL(ten, import.meta.url));

export function kinhlac() {
	return {
		id: "kinhlac",
		label: "Tài khoản Kinh Lạc",
		adminEntry: tep("./nut-dang-nhap.tsx"),
		routes: [
			{
				pattern: "/_emdash/api/auth/kinhlac/vao",
				entrypoint: tep("./vao.ts"),
			},
		],
		publicRoutes: ["/_emdash/api/auth/kinhlac/"],
	};
}
