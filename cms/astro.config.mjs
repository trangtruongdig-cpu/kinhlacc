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
