// anh-huyet.mjs — Kéo ảnh huyệt từ site thật về, nạp vào thư viện ảnh CMS, gắn vào huyệt.
//
// Ảnh KHÔNG có trong repo: .gitignore dòng 60 loại frontend/public/kinhmach3d/images/,
// nên tệp chỉ nằm trên VPS. Đây là lần chuyển một chiều: sau bước này ảnh sống trong
// thư viện ảnh của CMS và thay được ngay trong trang quản trị.
//
// 684/1.059 huyệt có ảnh; 375 huyệt vốn không có.
//
//   node scripts-di-cu/anh-huyet.mjs --thu     # chỉ đếm, không tải không ghi
//   node scripts-di-cu/anh-huyet.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, resolve, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const chay = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const cmsDir = resolve(here, "..");
const goc = resolve(here, "../..");
const BIN = resolve(cmsDir, "node_modules/.bin/emdash");
const SITE = "https://kinhlac.online/kinhmach3d/";
const TAM = resolve(cmsDir, ".tam-anh/huyet");
const SONG_SONG = 4;
const chiThu = process.argv.includes("--thu");

const require = createRequire(import.meta.url);
const { Client } = require("pg");
const D = await import(resolve(goc, "frontend/scripts/dict-data.mjs"));

const ds = D.ACU.records
	.filter((r) => r.image)
	.map((r) => ({ slug: r._slug || r.slug, ten: r.ten, anh: r.image }));
console.log(`Huyệt có ảnh: ${ds.length}/${D.ACU.records.length}`);

if (chiThu) {
	console.log("  5 mục đầu:");
	for (const x of ds.slice(0, 5)) console.log(`    ${x.slug.padEnd(20)} ${x.anh}`);
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

let xong = 0, hongTai = 0, hongNap = 0, gan = 0;

async function lamMot(x) {
	const ten = basename(x.anh);
	const duong = join(TAM, ten);

	// 1. Tải về (bỏ qua nếu đã có — chạy lại script không tải lại)
	if (!existsSync(duong) || statSync(duong).size === 0) {
		const r = await fetch(SITE + x.anh);
		if (!r.ok) { hongTai++; return; }
		writeFileSync(duong, Buffer.from(await r.arrayBuffer()));
	}

	// 2. Nạp vào thư viện ảnh
	let j;
	try {
		const { stdout } = await chay(BIN, ["media", "upload", duong, "--alt", `Huyệt ${x.ten}`], {
			cwd: cmsDir, maxBuffer: 4 << 20,
		});
		j = JSON.parse(stdout.slice(stdout.indexOf("{")));
	} catch {
		hongNap++; return;
	}

	// 3. Gắn vào huyệt. Trường kiểu image cần { id, meta: { storageKey } } — dựng URL chỉ
	//    bằng id thì /_emdash/api/media/file/<id> trả 404 và ảnh vỡ dù thẻ img vẫn có.
	await kho.query(
		`UPDATE ec_huyet_vi SET anh = $1 WHERE slug = $2 AND deleted_at IS NULL`,
		[JSON.stringify({ id: j.id, meta: { storageKey: j.storageKey || j.storage_key } }), x.slug],
	);
	gan++;
}

// Chạy song song có giới hạn — nạp tuần tự mất ~18 phút, 4 luồng còn khoảng 5.
const hangDoi = [...ds];
await Promise.all(
	Array.from({ length: SONG_SONG }, async () => {
		for (;;) {
			const x = hangDoi.shift();
			if (!x) return;
			await lamMot(x);
			if (++xong % 100 === 0) console.log(`  …${xong}/${ds.length} (gắn ${gan})`);
		}
	}),
);

const n = await kho.query(
	"SELECT count(*)::int n FROM ec_huyet_vi WHERE anh IS NOT NULL AND deleted_at IS NULL",
);
console.log(
	`\nGắn ảnh cho ${gan} huyệt. Trong CMS: ${n.rows[0].n}/${ds.length} huyệt có ảnh.` +
		(hongTai ? ` ${hongTai} ảnh tải không được.` : "") +
		(hongNap ? ` ${hongNap} ảnh nạp lỗi.` : ""),
);
await kho.end();
