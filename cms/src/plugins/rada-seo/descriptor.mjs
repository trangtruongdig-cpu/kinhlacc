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
	adminPages: [{ path: "/rada", label: "Rada SEO", icon: "chart" }],
};
