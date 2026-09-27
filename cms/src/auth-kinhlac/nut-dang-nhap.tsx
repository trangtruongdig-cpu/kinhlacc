/**
 * Nút "Tài khoản Kinh Lạc" trên trang đăng nhập của khu quản trị.
 *
 * Vì sao cần, khi đã có mục trong thanh bên của app: người ta BOOKMARK
 * `/_emdash/admin/`. Ai mở thẳng đường ấy sẽ rơi vào trang đăng nhập passkey và
 * không có cách nào biết rằng mình chỉ cần quay về app là vào được. Nút này đóng
 * đúng cái khe đó — bấm một cái là sang trang cầu nối bên app, rồi tự quay lại.
 *
 * Nó KHÔNG thay thế passkey: passkey vẫn là đường lùi khi app backend trục trặc.
 *
 * ⚠️ Không import `@cloudflare/kumo` dù trang quản trị dùng bộ đó: ở đây nó chỉ là
 * phụ thuộc bắc cầu của `@emdash-cms/admin`, một lần dedupe là mất. Thẻ `<a>` thuần
 * với chính lớp Tailwind mà trang quản trị đang nạp thì không phụ thuộc vào ai.
 */

import * as React from "react";

/** Trang cầu nối bên app — xem `frontend/src/views/VaoCmsView.vue`. */
const DUONG_CAU_NOI = "/vao-cms";

function LaThuoc({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
			<path d="M12 21c0-6 3-10 8-12-1 7-4 10-8 12Z" strokeLinejoin="round" />
			<path d="M12 21C8 19 5 16 4 9c5 2 8 6 8 12Z" strokeLinejoin="round" />
		</svg>
	);
}

export function LoginButton() {
	// Trang đăng nhập của EmDash mang sẵn ?redirect=<đường người ta định vào>.
	// Chuyển tiếp nó qua app để sau khi lập phiên xong thì quay về ĐÚNG chỗ đó,
	// chứ không phải luôn luôn về bảng điều khiển.
	let href = DUONG_CAU_NOI;
	if (typeof window !== "undefined") {
		const dich = new URLSearchParams(window.location.search).get("redirect");
		if (dich) href += `?dich=${encodeURIComponent(dich)}`;
	}

	return (
		<a
			href={href}
			className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-kumo-line px-3 py-2 text-sm font-medium hover:bg-kumo-surface"
		>
			<LaThuoc className="h-5 w-5" />
			<span>Tài khoản Kinh Lạc</span>
		</a>
	);
}
