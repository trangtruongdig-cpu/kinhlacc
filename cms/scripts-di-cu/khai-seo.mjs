// khai-seo.mjs — Bật ô nhập SEO trong trang quản trị cho những bộ còn thiếu.
//
// LỖI ĐÃ GẶP (26/09/2026): rà soát thấy `has_seo = 0` ở 5 trong 9 bộ — bai_thuoc
// (13.942 mục), nguon_y_van (2.139), duoc_lieu (1.045), cham_cuu_tri_benh (100) và
// kinh_mach (20). Tức 17.246 trang KHÔNG có ô nhập SEO cho người biên tập, trong khi
// tài liệu của dự án vẫn ghi "mọi bộ đều khai hasSeo: true".
//
// Hậu quả im lặng: `frontend/scripts/seo-cms.mjs` đọc bảng `_emdash_seo` để ghi đè thẻ
// SEO lúc build. Không có ô nhập thì bảng đó không bao giờ có dòng nào cho 5 bộ này —
// và đúng là nó đang RỖNG HOÀN TOÀN. Khâu ghi đè chạy mà không có gì để ghi đè, build
// vẫn xanh, không ai biết.
//
// Cột quyết định là `has_seo` — trang quản trị đọc `collectionConfig.hasSeo` để hiện ô.
// `supports` cập nhật kèm cho khớp 4 bộ đã bật, và vì registry của EmDash suy ngược
// `hasSeo ?? supports.includes("seo")` khi dựng lại bộ từ seed.
//
// ⚠️ KHÔNG thêm "search" vào supports dù 4 bộ kia có: `search()` của EmDash là FTS5 của
// SQLite, trên Postgres nó là lệnh rỗng — bật lên chỉ tạo ảo giác có tìm kiếm. Tầng tra
// cứu thật nằm ở `cms/sql/chi-muc-tra-cuu.sql` + `cms/src/lib/traCuu.ts`.
//
// Bật ô nhập KHÔNG đổi một thẻ SEO nào đang có: ô để trống thì seo-cms.mjs giữ nguyên
// bản tự sinh của builder. Đây là mở đường cho người biên tập, không phải thay thế.
//
//   node scripts-di-cu/khai-seo.mjs --thu
//   node scripts-di-cu/khai-seo.mjs

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

// Cả 9 bộ đều là trang công khai có mặt trong sitemap → đều cần ô SEO.
const CAN_SEO = [
	"bai_thuoc",
	"bai_viet",
	"benh_hoc",
	"cham_cuu_tri_benh",
	"duoc_lieu",
	"huyet_vi",
	"kinh_mach",
	"nguon_y_van",
	"trang",
];

const env = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const kho = new Client({
	host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
	database: env.PGDATABASE,
	ssl: { ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();

const hienCo = (await kho.query(`SELECT slug, has_seo, supports FROM _emdash_collections`)).rows;

// Bộ có trong kho mà mình chưa liệt kê thì PHẢI kêu — đó là bộ sẽ tiếp tục không có ô SEO.
const chuaKhai = hienCo.map((x) => x.slug).filter((s) => !CAN_SEO.includes(s));
if (chuaKhai.length) console.warn(`⚠ Bộ có trong kho mà CHƯA liệt kê: ${chuaKhai.join(", ")}`);

const doi = [];
for (const slug of CAN_SEO) {
	const b = hienCo.find((x) => x.slug === slug);
	if (!b) { console.warn(`⚠ Kho không có bộ "${slug}" — bỏ qua.`); continue; }
	const sup = JSON.parse(b.supports ?? "[]");
	const thieuCot = b.has_seo !== 1;
	const thieuSup = !sup.includes("seo");
	if (!thieuCot && !thieuSup) continue;
	doi.push([slug, JSON.stringify([...sup, "seo"]), thieuCot, thieuSup]);
}

console.log(`Bộ sưu tập: ${hienCo.length} · sẽ bật SEO cho ${doi.length}`);
for (const [s, , cot, sup] of doi) {
	const phan = [cot && "has_seo=0→1", sup && 'supports +"seo"'].filter(Boolean).join(", ");
	console.log(`  ${s.padEnd(20)} ${phan}`);
}

if (chiThu || !doi.length) {
	console.log(doi.length ? "\nChạy lại không có --thu để áp." : "\nKhông có gì để đổi.");
	await kho.end();
	process.exit(0);
}

const r = await kho.query(
	`UPDATE _emdash_collections c SET has_seo = 1, supports = v.sup
	 FROM (SELECT unnest($1::text[]) AS slug, unnest($2::text[]) AS sup) v
	 WHERE c.slug = v.slug`,
	[doi.map((x) => x[0]), doi.map((x) => x[1])],
);
console.log(`\n✓ Bật SEO cho ${r.rowCount} bộ.`);
console.log("  Ô nhập SEO đã mở; thẻ đang chạy không đổi cho tới khi có người điền.");
await kho.end();
