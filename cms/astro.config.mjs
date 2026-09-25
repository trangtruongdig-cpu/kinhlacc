import node from "@astrojs/node";
import react from "@astrojs/react";
import auditLog from "@emdash-cms/plugin-audit-log";
import { defineConfig, fontProviders } from "astro/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import emdash, { local } from "emdash/astro";
import { postgres } from "emdash/db";

export default defineConfig({
	output: "server",
	adapter: node({
		mode: "standalone",
	}),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			// Postgres RIÊNG trên cụm Aiven (database kinhlac_cms, role cms_kinhlac SỞ HỮU nó).
			// KHÔNG dùng chung role với backend: role này không đọc được patients/examinations
			// trong defaultdb — đã kiểm bằng phép thử, đều trả "permission denied".
			//
			// ssl là OBJECT chứ không phải true: Aiven ký bằng CA riêng nên `ssl: true` sẽ lỗi
			// "self-signed certificate in certificate chain". Kiểu PostgresConfig khai ssl?: boolean
			// nhưng runtime truyền thẳng vào new Pool() của pg, mà pg nhận object — file này là
			// JavaScript nên không bị type-check chặn.
			//
			// CA đọc từ file, không qua biến môi trường: PEM trải 26 dòng, nhét vào .env là vỡ.
			// Chứng chỉ CA là công khai (xác minh máy chủ, không phải khoá bí mật) nên commit được.
			database: postgres({
				host: process.env.DB_HOST,
				port: Number(process.env.DB_PORT ?? 5432),
				database: process.env.DB_NAME,
				user: process.env.DB_USER,
				password: process.env.DB_PASSWORD,
				ssl: {
					ca: readFileSync(fileURLToPath(new URL("./aiven-ca.pem", import.meta.url)), "utf8"),
					rejectUnauthorized: true,
				},
				// ⚠️ BẮT BUỘC đặt max. EmDash mặc định min:0 max:10 — lúc rảnh không giữ kết nối
				// nào (nên đo lúc yên sẽ thấy 0 và tưởng vô hại), nhưng lúc có tải mở tới 10.
				//
				// Aiven đang ở max_connections=20, trong đó 3 dành cho superuser và ~10 do chính
				// Aiven giữ → chỉ còn ~7 cho toàn bộ ứng dụng, mà backend đã lấy 5 (DB_POOL_MAX).
				// CMS mở thêm 10 là vỡ chắc chắn. Ngày 25/09/2026 đã có một cơn thật: 8 endpoint
				// ngã trong 3 giây với "remaining connection slots are reserved for roles with
				// the SUPERUSER attribute", gồm cả /auth/me — không ai đăng nhập được.
				//
				// 2 là đủ để render blog: mỗi request chỉ đọc vài truy vấn ngắn rồi trả kết nối.
				// max=1 chứ không phải 2: ĐO thấy EmDash tạo NHIỀU pool (runtime, middleware, admin
				// API), mỗi pool tôn trọng max riêng nên tổng vượt gấp đôi. Với max=2 đỉnh đo
				// được là 4-5 kết nối; với max=1 đỉnh xuống 2-3. Đo bằng cách bắn 16 request
				// song song vào bản production rồi đếm pg_stat_activity, KHÔNG đo lúc yên —
				// lúc yên pool đóng hết nên thấy 0 và tưởng vô hại.
				pool: {
					min: 0,
					max: 1,
					connectionTimeoutMillis: 10_000,
					idleTimeoutMillis: 10_000,
				},
			}),
			storage: local({
				directory: "./uploads",
				baseUrl: "/_emdash/api/media/file",
			}),
			plugins: [auditLog],
		}),
	],
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Inter",
			cssVariable: "--font-body",
			weights: [400, 500, 600, 700],
			fallbacks: ["sans-serif"],
		},
		{
			provider: fontProviders.google(),
			name: "JetBrains Mono",
			cssVariable: "--font-mono",
			weights: [400, 500],
			fallbacks: ["monospace"],
		},
	],
	devToolbar: { enabled: false },
});
