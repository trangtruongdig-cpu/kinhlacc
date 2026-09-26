// khai-url-pattern.mjs — Khai `url_pattern` cho từng bộ sưu tập trong CMS.
//
// LỖI ĐÃ GẶP (26/09/2026): người dùng bấm xem trang một bài viết trong CMS và nhận 404 ở
// `/bai_viet/huyet-tam-am-giao`. Nguyên nhân: cả 9 bộ đều có `url_pattern = NULL` trong
// `_emdash_collections`, nên EmDash suy đường dẫn công khai từ CHÍNH TÊN BỘ —
// `/bai_viet/<slug>` (gạch dưới) — trong khi route thật là `/blog/<slug>`.
//
// Lỗi này ảnh hưởng CẢ 9 BỘ, không riêng bài viết: 7 bộ từ điển có trang thật do nginx
// phục vụ tĩnh (`/huyet/<slug>/`, `/nguon/<slug>/`…), tên bộ thì gạch dưới (`huyet_vi`),
// nên link "xem trang" trong trang quản trị 404 ở cả môi trường thật.
//
// Khai đúng còn mở thêm một thứ đang nằm im: EmDash dùng `url_pattern` để TỰ TẠO CHUYỂN
// HƯỚNG 301 khi slug đổi (`createAutoRedirect`). Bảng `_emdash_redirects` rỗng chính vì
// thiếu nó — tức đổi slug một mục từ là mất sạch thứ hạng của nó, không có gì bắt lại.
//
// Cú pháp token: `{slug}`, `{id}`, và các token ngày `{year}`/`{month}`/… (đọc từ
// resolve-*.mjs của EmDash). Ở đây chỉ cần `{slug}`.
//
// Dạng đường dẫn lấy từ canonical THẬT của trang đã dựng, không đoán:
//   7 bộ từ điển  → CÓ dấu / cuối (trang tĩnh là thư mục + index.html)
//   bài viết/trang → KHÔNG có dấu / cuối (route của Astro)
//
//   node scripts-di-cu/khai-url-pattern.mjs --thu
//   node scripts-di-cu/khai-url-pattern.mjs

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

const MAU = {
	huyet_vi: "/huyet/{slug}/",
	kinh_mach: "/kinh/{slug}/",
	benh_hoc: "/benh-hoc/{slug}/",
	cham_cuu_tri_benh: "/cham-cuu-tri-benh/{slug}/",
	duoc_lieu: "/duoc-lieu/{slug}/", // slug của bộ này LÀ id số → /duoc-lieu/45/
	bai_thuoc: "/bai-thuoc/{slug}/",
	nguon_y_van: "/nguon/{slug}/",
	bai_viet: "/blog/{slug}", // route Astro, không dấu / cuối
	trang: "/trang/{slug}",
};

const env = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const kho = new Client({
	host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
	database: env.PGDATABASE,
	ssl: { ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();

const hienCo = (await kho.query(`SELECT slug, url_pattern FROM _emdash_collections`)).rows;
const theoSlug = new Map(hienCo.map((x) => [x.slug, x.url_pattern]));

// Bộ nào có trong kho mà mình chưa khai thì PHẢI kêu, đừng lặng lẽ bỏ — đó là bộ sẽ
// tiếp tục sinh link 404.
const chuaKhai = hienCo.map((x) => x.slug).filter((s) => !(s in MAU));
if (chuaKhai.length) console.warn(`⚠ Bộ có trong kho mà CHƯA khai mẫu: ${chuaKhai.join(", ")}`);

const doi = [];
for (const [slug, mau] of Object.entries(MAU)) {
	if (!theoSlug.has(slug)) { console.warn(`⚠ Kho không có bộ "${slug}" — bỏ qua.`); continue; }
	if (theoSlug.get(slug) === mau) continue;
	doi.push([slug, mau, theoSlug.get(slug)]);
}

console.log(`Bộ sưu tập: ${hienCo.length} · sẽ khai ${doi.length}`);
for (const [s, mau, cu] of doi) console.log(`  ${s.padEnd(20)} ${JSON.stringify(cu)} → ${mau}`);

if (chiThu || !doi.length) {
	console.log(doi.length ? "\nChạy lại không có --thu để áp." : "\nKhông có gì để đổi.");
	await kho.end();
	process.exit(0);
}

const r = await kho.query(
	`UPDATE _emdash_collections c SET url_pattern = v.mau
	 FROM (SELECT unnest($1::text[]) AS slug, unnest($2::text[]) AS mau) v
	 WHERE c.slug = v.slug`,
	[doi.map((x) => x[0]), doi.map((x) => x[1])],
);
console.log(`\n✓ Khai ${r.rowCount} bộ.`);
await kho.end();
