// ma-cu-huyet.mjs — Lưu MÃ SỐ CŨ của từng huyệt (id trong bộ Từ Điển 1.059) vào CMS.
//
// Vì sao cần: Kết Quả Đo và ngăn kéo Kinh Mạch 3D đẩy link dạng ?acu=<id số>. CMS định
// danh bằng slug nên không đổi được id sang địa chỉ. Lưu id cũ lại thì mở được đường
// /huyet/id/<n> để chuyển tiếp, và gỡ được tab Từ Điển trong app mà không gãy link nào.
//
//   node scripts-di-cu/ma-cu-huyet.mjs --thu
//   node scripts-di-cu/ma-cu-huyet.mjs

import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const goc = resolve(here, "../..");
const require = createRequire(import.meta.url);
const { Client } = require("pg");
const chiThu = process.argv.includes("--thu");

const D = await import(resolve(goc, "frontend/scripts/dict-data.mjs"));
const cap = D.ACU.records
	.filter((r) => r.id && (r._slug || r.slug))
	.map((r) => [r.id, r._slug || r.slug]);

console.log(`Huyệt có mã cũ: ${cap.length}/${D.ACU.records.length}`);
if (chiThu) {
	for (const [id, slug] of cap.slice(0, 5)) console.log(`  ${String(id).padStart(5)} → /huyet/${slug}/`);
	process.exit(0);
}

const env = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const kho = new Client({
	host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
	database: env.PGDATABASE,
	ssl: { ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();
// Trigger chỉ mục chạy từng hàng; tắt đi rồi dựng lại một lượt.
await kho.query("ALTER TABLE ec_huyet_vi DISABLE TRIGGER USER").catch(() => {});

// Một câu lệnh cho cả 1.059 hàng.
const r = await kho.query(
	`UPDATE ec_huyet_vi e SET ma_cu = v.ma::int
	 FROM (SELECT unnest($1::int[]) AS ma, unnest($2::text[]) AS slug) v
	 WHERE e.slug = v.slug AND e.deleted_at IS NULL`,
	[cap.map(([id]) => id), cap.map(([, s]) => s)],
);

await kho.query("ALTER TABLE ec_huyet_vi ENABLE TRIGGER USER").catch(() => {});
const kiem = await kho.query(
	"SELECT count(*)::int co, count(*) FILTER (WHERE ma_cu IS NULL)::int thieu FROM ec_huyet_vi WHERE deleted_at IS NULL",
);
console.log(`Gán ${r.rowCount} hàng. Trong CMS: ${kiem.rows[0].co} huyệt, ${kiem.rows[0].thieu} huyệt chưa có mã cũ.`);
await kho.end();
