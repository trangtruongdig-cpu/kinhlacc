// anh-kinh.mjs — Kéo sơ đồ kinh mạch từ site thật vào thư viện ảnh CMS.
//
// Mỗi chính kinh có tới 7 sơ đồ (tổng quát, kinh chính, kinh cân, kinh biệt, lạc dọc,
// lạc ngang, sơ đồ); tám mạch chỉ có 1. Ảnh không nằm trong repo — .gitignore loại
// frontend/public/kinhmach3d/images/.
//
//   node scripts-di-cu/anh-kinh.mjs --thu
//   node scripts-di-cu/anh-kinh.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify, parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, resolve, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const chay = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const cmsDir = resolve(here, "..");
const goc = resolve(here, "../..");
const BIN = resolve(cmsDir, "node_modules/.bin/emdash");
const SITE = "https://kinhlac.online/kinhmach3d/";
const TAM = resolve(cmsDir, ".tam-anh/kinh");
const chiThu = process.argv.includes("--thu");

const require = createRequire(import.meta.url);
const { Client } = require("pg");
const D = await import(resolve(goc, "frontend/scripts/dict-data.mjs"));

// khoá ảnh trong dữ liệu tĩnh → cột ảnh trong CMS
const CHUYEN = {
	gen: "anh_tong_quat", chinh: "anh_chinh", can: "anh_can", biet: "anh_biet",
	doc: "anh_doc", ngang: "anh_ngang", sodo: "anh_so_do",
};

const viec = [];
for (const m of D.meridianList) {
	const slug = D.kinhSlugOf(m);
	for (const [k, cot] of Object.entries(CHUYEN)) {
		const p = (m.images || {})[k];
		if (p) viec.push({ slug, ten: m.ten, cot, anh: p });
	}
}
console.log(`Sơ đồ cần chuyển: ${viec.length} (trên ${D.meridianList.length} đường kinh)`);

if (chiThu) {
	for (const x of viec.slice(0, 6)) console.log(`  ${x.slug.padEnd(16)} ${x.cot.padEnd(14)} ${x.anh}`);
	process.exit(0);
}

mkdirSync(TAM, { recursive: true });
const env = parseEnv(readFileSync(resolve(cmsDir, ".env"), "utf8"));
const kho = new Client({
	host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
	database: env.PGDATABASE,
	ssl: { ca: readFileSync(resolve(cmsDir, "aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();

let gan = 0, hongTai = 0, hongNap = 0;
for (const x of viec) {
	const ten = basename(x.anh);
	const duong = join(TAM, ten);
	if (!existsSync(duong) || statSync(duong).size === 0) {
		const r = await fetch(SITE + x.anh);
		if (!r.ok) { console.log(`  ✗ ${x.slug}/${x.cot}: ${r.status}`); hongTai++; continue; }
		writeFileSync(duong, Buffer.from(await r.arrayBuffer()));
	}
	let j;
	try {
		const { stdout } = await chay(BIN, ["media", "upload", duong, "--alt", `${x.cot} — ${x.ten}`], {
			cwd: cmsDir, maxBuffer: 8 << 20,
		});
		j = JSON.parse(stdout.slice(stdout.indexOf("{")));
	} catch (e) {
		console.log(`  ✗ nạp ${ten}: ${String(e.stderr || e.message).split("\n")[0]}`);
		hongNap++; continue;
	}
	await kho.query(
		`UPDATE ec_kinh_mach SET ${x.cot} = $1 WHERE slug = $2 AND deleted_at IS NULL`,
		[JSON.stringify({ id: j.id, meta: { storageKey: j.storageKey || j.storage_key } }), x.slug],
	);
	gan++;
	if (gan % 20 === 0) console.log(`  …${gan}/${viec.length}`);
}

console.log(`\nGắn ${gan} sơ đồ.${hongTai ? ` ${hongTai} ảnh tải không được.` : ""}${hongNap ? ` ${hongNap} ảnh nạp lỗi.` : ""}`);
await kho.end();
