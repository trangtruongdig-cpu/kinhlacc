// Descriptor native của Rada SEO cho mảng `plugins` trong astro.config.mjs.
// Dạng này (entrypoint TUYỆT ĐỐI, adminEntry "/src/…" tính từ gốc cms) là dạng DUY NHẤT đo
// được là chạy ở EmDash 0.39.1 — "./src/…" gãy build với UNRESOLVED_IMPORT.
import { fileURLToPath } from "node:url";

export const radaSeo = {
	id: "rada-seo",
	version: "0.1.0",
	format: "native",
	entrypoint: fileURLToPath(new URL("./plugin.mjs", import.meta.url)),
	adminEntry: "/src/plugins/rada-seo/admin.jsx",
	// KHÔNG khai adminPages ở đây: với format "native" EmDash 0.39.1 không đọc nó (đo ở nghiệm
	// thu 2A — manifest vẫn ra adminPages:[]). Mục thanh bên khai trong definePlugin({admin}) ở plugin.mjs.
};
