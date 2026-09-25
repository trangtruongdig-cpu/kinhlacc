// Nhà gửi email của CMS — gọi thẳng API Resend.
//
// VÌ SAO TỰ VIẾT thay vì dùng `emdash-plugin-resend` trên npm:
// gói đó (0.2.0, khai peer "emdash ^0.5.0") gọi `definePlugin({...})` KHÔNG kèm `id` ngay ở
// đầu module sandbox-entry, vì với EmDash 0.5 danh tính plugin đến từ emdash-plugin.jsonc.
// `definePlugin` của 0.39.1 lại bắt buộc có `id`, nên vừa nạp module là ném
// "definePlugin() requires 'id' (got undefined)" và MỌI trang trả 500. Đã đo ngày 25/09/2026.
//
// ⚠️ Lỗi đó KHÔNG hiện ra lúc `npm run build` — build chỉ đóng gói module chứ không chạy nó.
// Bản dựng xanh 58 giây rồi server chết khi khởi động. Với plugin, phép kiểm duy nhất đáng tin
// là CHẠY THẬT rồi mở một trang.
//
// Plugin native (có id + version, nằm trong mảng `plugins`) chạy thẳng trong tiến trình Node,
// không qua sandbox — sandbox của EmDash chỉ có trên Cloudflare Worker Loader.
import { definePlugin } from "emdash";

/** Địa chỉ người gửi mặc định của Resend khi tên miền chưa xác minh. */
const NGUOI_GUI_MAC_DINH = "onboarding@resend.dev";

export default definePlugin({
	id: "resend-kinhlac",
	version: "1.0.0",
	// Cùng capability mà nhà gửi "console" của EmDash dùng ở chế độ dev.
	capabilities: ["hooks.email-transport:register"],
	hooks: {
		"email:deliver": {
			// Hook độc quyền: chỉ MỘT nhà gửi được chọn. Ở máy dev còn có nhà gửi console
			// nên EmDash bỏ trống lựa chọn cho tới khi có người chọn trong
			// Admin → Settings → Email; lựa chọn đó cất trong database dùng chung.
			exclusive: true,
			handler: async (event) => {
				// ĐỌC BIẾN TRONG HANDLER, không phải ở đầu file: astro.config.mjs chạy lúc
				// build nên mọi process.env đọc ở tầng module có nguy cơ bị đóng băng vào bản
				// dựng. Trong handler thì lấy đúng giá trị lúc chạy.
				const khoa = process.env.RESEND_API_KEY;
				if (!khoa) throw new Error("Thiếu RESEND_API_KEY — chưa gửi được email.");

				const { message } = event;
				const traLoi = await fetch("https://api.resend.com/emails", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${khoa}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						from: process.env.RESEND_FROM || NGUOI_GUI_MAC_DINH,
						to: message.to,
						subject: message.subject,
						text: message.text,
						...(message.html ? { html: message.html } : {}),
					}),
				});

				if (!traLoi.ok) {
					// Thân lỗi của Resend nói rõ nguyên nhân (khoá sai, tên miền chưa xác minh,
					// người nhận không được phép khi còn ở chế độ thử). Giữ nguyên để đọc log
					// là biết, khỏi đoán.
					throw new Error(`Resend trả ${traLoi.status}: ${await traLoi.text()}`);
				}
			},
		},
	},
});
