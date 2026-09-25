// the-loai-huyet.mjs — Chép 22 đặc tính huyệt (thẻ lọc) từ dữ liệu tĩnh sang CMS.
//
// Đây là dữ liệu ĐÃ RÀ TAY trong DICT_FACETS (Kỳ Huyệt, Ngũ Du, Ngũ Hành, Huyệt Đặc
// Dụng…), KHÔNG phải suy ra từ văn xuôi bằng regex. Chép nguyên vào trường the_loai
// của từng huyệt để sửa được trong trang quản trị, rồi dựng lại thẻ lọc từ đó.
//
//   node scripts-di-cu/the-loai-huyet.mjs --thu
//   node scripts-di-cu/the-loai-huyet.mjs

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
const traits = D.DICT_FACETS.traits;

// id huyệt → danh sách thẻ; đồng thời đổi id sang slug để khớp với CMS.
const slugTheoId = new Map(D.ACU.records.map((r) => [r.id, r._slug || r.slug]));
const theo = new Map();
for (const [ma, t] of Object.entries(traits)) {
	for (const id of t.huyetIds || []) {
		const slug = slugTheoId.get(id);
		if (!slug) continue;
		if (!theo.has(slug)) theo.set(slug, []);
		theo.get(slug).push({ ma, ten: t.ten, nhom: t.nhom });
	}
}

console.log(`Đặc tính: ${Object.keys(traits).length} thẻ · gắn cho ${theo.size} huyệt`);

if (chiThu) {
	const nhom = {};
	for (const t of Object.values(traits)) (nhom[t.nhom] ||= []).push(`${t.ten} (${t.count})`);
	for (const [n, ds] of Object.entries(nhom)) console.log(`  ▸ ${n}: ${ds.join(", ")}`);
	const vd = [...theo.entries()].find(([s]) => s === "hop-coc");
	if (vd) console.log(`\n  ví dụ hop-coc: ${vd[1].map((x) => x.ten).join(", ")}`);
	process.exit(0);
}

const env = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const kho = new Client({
	host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
	database: env.PGDATABASE,
	ssl: { ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();
await kho.query("ALTER TABLE ec_huyet_vi DISABLE TRIGGER USER").catch(() => {});

let n = 0;
for (const [slug, ds] of theo) {
	const r = await kho.query(
		"UPDATE ec_huyet_vi SET the_loai = $1 WHERE slug = $2 AND deleted_at IS NULL",
		[JSON.stringify(ds), slug],
	);
	n += r.rowCount;
}

await kho.query("ALTER TABLE ec_huyet_vi ENABLE TRIGGER USER").catch(() => {});
console.log(`\nGắn thẻ cho ${n} huyệt.`);
console.log("→ Chạy tiếp: node scripts-di-cu/dung-chi-muc.mjs huyet_vi");
await kho.end();
