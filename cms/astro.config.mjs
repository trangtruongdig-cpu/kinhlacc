import node from "@astrojs/node";
import react from "@astrojs/react";
import auditLog from "@emdash-cms/plugin-audit-log";
import { defineConfig, fontProviders, memoryCache } from "astro/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import emdash, { local } from "emdash/astro";
import { postgres } from "emdash/db";

export default defineConfig({
	output: "server",
	// ĐÓNG BĂNG TRANG ĐÃ DỰNG — điểm mà WordPress phải cắm plugin mới có.
	//
	// Quản trị thì động (sửa trong CMS, lưu vào Postgres), nhưng người đọc nhận một trang đã
	// dựng sẵn: không chạm database, không render lại. Mã đã gọi Astro.cache.set(cacheHint) ở
	// mọi trang, nhưng KHÔNG có provider thì Astro.cache.enabled = false và mọi lời gọi đó chạy
	// rỗng — đó là tình trạng trước dòng này.
	//
	// cacheHint của EmDash mang tag là tên collection, nên khi sửa/đăng/xoá một bài, EmDash tự
	// xoá đúng những trang dính tag đó. Người đọc không bao giờ thấy bản cũ.
	//
	// memoryCache: bộ nhớ của chính tiến trình. Hợp với mô hình một container như ở đây. Nếu
	// sau này chạy nhiều bản sao thì phải đổi sang provider dùng chung, không thì mỗi bản sao
	// giữ một bản cache riêng và xoá không tới nhau.
	//
	// ⚠️ Dev KHÔNG cache (Astro cố ý). Muốn đo phải chạy bản dựng: node ./dist/server/entry.mjs
	cache: { provider: memoryCache() },
	// Thời gian sống theo từng nhóm. swr = trả bản cũ ngay rồi dựng lại ngầm, nên người đọc
	// không bao giờ phải chờ. Không cần đặt ngắn để "cho mới": EmDash xoá theo tag ngay khi
	// nội dung đổi, nên các số này chỉ là lưới an toàn.
	routeRules: {
		"/blog/[...slug]": { maxAge: 3600, swr: 86400 },
		"/chuyen-muc/[...slug]": { maxAge: 3600, swr: 86400 },
		"/cum/[...slug]": { maxAge: 3600, swr: 86400 },
		"/trang/[...slug]": { maxAge: 3600, swr: 86400 },
		// Khu quản trị và endpoint kiểm sức khoẻ KHÔNG được cache: người biên tập phải thấy
		// ngay thứ mình vừa sửa, và healthcheck phải chạm database thật mỗi lần.
		// RouteRule chỉ nhận object, không nhận false — maxAge 0 là cách tắt.
		"/_emdash/[...path]": { maxAge: 0, swr: 0 },
		"/kiem-suc-khoe.json": { maxAge: 0, swr: 0 },
	},
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
				// KHÔNG truyền host/port/user/password/database ở đây — CỐ Ý.
				//
				// astro.config.mjs chạy lúc BUILD, nên mọi process.env đọc ở đây bị ĐÓNG BĂNG
				// vào bản dựng. Build trong Docker không có biến DB, nên trước đây chúng đóng
				// băng thành undefined và pg rơi về mặc định localhost:5432 — container trên VPS
				// báo ECONNREFUSED 127.0.0.1:5432 dù .env đủ biến. Còn nếu truyền biến vào lúc
				// build thì MẬT KHẨU bị nhúng vĩnh viễn vào image.
				//
				// Để trống thì pg tự đọc PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE từ môi
				// trường LÚC CHẠY — mật khẩu ở lại trong env, không vào image.
				// (Đo được: grep "aivencloud.com" trong dist/ ra 1 file khi truyền tay, 0 khi để trống.)
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
