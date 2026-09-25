// anh-duoc-lieu.mjs — Kéo ảnh vị thuốc về CMS, kèm số bài thuốc dùng vị đó.
//
// Ảnh gốc là LIÊN KẾT NGOÀI tới thư viện Đại học Baptist Hồng Kông
// (sys01.lib.hkbu.edu.hk) — 536/1.045 vị có. Họ chặn theo nhịp: bắn dồn thì trả 403,
// giãn ~400ms thì 200. Đo được 12/12 thành công khi giãn nhịp.
//
// Vì sao phải kéo về: đó là máy chủ của người khác. Họ đổi đường dẫn, siết chặn hay
// ngừng phục vụ là 536 ảnh của thư viện mình trắng hết, mà mình không làm gì được.
// Kéo về thì ảnh nằm trong thư viện ảnh của CMS, thay được ngay trong trang quản trị.
//
//   node scripts-di-cu/anh-duoc-lieu.mjs --thu
//   node scripts-di-cu/anh-duoc-lieu.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify, parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const chay = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const cmsDir = resolve(here, "..");
const goc = resolve(here, "../..");
const BIN = resolve(cmsDir, "node_modules/.bin/emdash");
const TAM = resolve(cmsDir, ".tam-anh/duoc-lieu");
const GIAN_NHIP = 420; // ms giữa hai lần tải — dưới mức này là bị 403
const chiThu = process.argv.includes("--thu");

const require = createRequire(import.meta.url);
const { Client } = require("pg");

const ca = readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8");
const be = parseEnv(readFileSync(resolve(goc, "backend/.env"), "utf8"));
const cms = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));

const app = new Client({
	host: be.DB_HOST, port: +be.DB_PORT, user: be.DB_USER, password: be.DB_PASSWORD,
	database: be.DB_NAME, ssl: { ca, rejectUnauthorized: true },
});
await app.connect();
const ds = (await app.query(
	`SELECT id, ten_vi_thuoc, anh_dai_dien, so_bai_thuoc
	 FROM vi_thuoc ORDER BY id`)).rows;
await app.end();

const coAnh = ds.filter((r) => String(r.anh_dai_dien || "").trim());
console.log(`Vị thuốc: ${ds.length} · có ảnh: ${coAnh.length} · có số bài thuốc: ${ds.filter((r) => r.so_bai_thuoc).length}`);

if (chiThu) {
	for (const r of coAnh.slice(0, 4)) {
		console.log(`  ${String(r.id).padStart(4)} ${String(r.ten_vi_thuoc).padEnd(16)} ${r.so_bai_thuoc || 0} bài · ${r.anh_dai_dien}`);
	}
	console.log(`\n  Ước lượng: ${coAnh.length} ảnh × ${GIAN_NHIP}ms ≈ ${Math.ceil((coAnh.length * GIAN_NHIP) / 60000)} phút tải.`);
	process.exit(0);
}

mkdirSync(TAM, { recursive: true });
const kho = new Client({
	host: cms.PGHOST, port: +cms.PGPORT, user: cms.PGUSER, password: cms.PGPASSWORD,
	database: cms.PGDATABASE, ssl: { ca, rejectUnauthorized: true },
});
await kho.connect();
await kho.query("ALTER TABLE ec_duoc_lieu DISABLE TRIGGER USER").catch(() => {});

// ── 1. Số bài thuốc: một câu lệnh cho cả 1.045 hàng ────────────────────
const coSo = ds.filter((r) => r.so_bai_thuoc);
await kho.query(
	`UPDATE ec_duoc_lieu e SET so_bai_thuoc = v.n::int
	 FROM (SELECT unnest($1::text[]) AS slug, unnest($2::int[]) AS n) v
	 WHERE e.slug = v.slug AND e.deleted_at IS NULL`,
	[coSo.map((r) => String(r.id)), coSo.map((r) => r.so_bai_thuoc)],
);
console.log(`① Số bài thuốc: gán cho ${coSo.length} vị.`);

// Vị nào ĐÃ có ảnh trong CMS thì bỏ qua — chạy lại script không nạp trùng vào thư
// viện ảnh. Cần chốt này vì lần chạy đầu bị đứt giữa chừng (dev server sập, mà
// `emdash media upload` gọi qua chính dev server đó).
const daCo = new Set(
	(await kho.query("SELECT slug FROM ec_duoc_lieu WHERE anh IS NOT NULL AND deleted_at IS NULL")).rows.map((r) => r.slug),
);
if (daCo.size) console.log(`   (bỏ qua ${daCo.size} vị đã có ảnh)`);

// ── 2. Ảnh: tải → nạp vào thư viện ảnh → gắn ──────────────────────────
console.log(`② Ảnh: tải ${coAnh.length} tệp (giãn ${GIAN_NHIP}ms/lần)…`);
let gan = 0, hongTai = 0, hongNap = 0;

for (const r of coAnh) {
	if (daCo.has(String(r.id))) continue;
	const url = String(r.anh_dai_dien).trim();
	const duoi = (url.match(/\.(jpe?g|png|webp|gif)(\?|$)/i) || [, "jpg"])[1].toLowerCase();
	const duong = join(TAM, `${r.id}.${duoi}`);

	if (!existsSync(duong) || statSync(duong).size === 0) {
		try {
			const res = await fetch(url, {
				headers: {
					"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
					Referer: "https://sys01.lib.hkbu.edu.hk/cmed/mmid/",
				},
			});
			if (!res.ok) { console.log(`  ✗ ${r.id} ${r.ten_vi_thuoc}: HTTP ${res.status}`); hongTai++; continue; }
			const buf = Buffer.from(await res.arrayBuffer());
			if (buf.length < 1024) { console.log(`  ✗ ${r.id}: tệp ${buf.length}B — không phải ảnh`); hongTai++; continue; }
			writeFileSync(duong, buf);
		} catch (e) {
			console.log(`  ✗ ${r.id}: ${e instanceof Error ? e.message : e}`);
			hongTai++; continue;
		}
		await new Promise((s) => setTimeout(s, GIAN_NHIP));
	}

	let j;
	try {
		const { stdout } = await chay(BIN, ["media", "upload", duong, "--alt", `Vị thuốc ${r.ten_vi_thuoc}`], {
			cwd: cmsDir, maxBuffer: 16 << 20,
		});
		j = JSON.parse(stdout.slice(stdout.indexOf("{")));
	} catch (e) {
		// Bỏ dòng con quay ("◐ Uploading …") để lấy được dòng lỗi thật — lần chạy trước
		// mọi thông báo đều ra "◐ Uploading x.jpg..." nên không biết vì sao hỏng.
		const loi = String(e.stderr || e.stdout || e.message)
			.split("\n").map((x) => x.replace(/[◐◓◑◒✔✗]/g, "").trim())
			.filter((x) => x && !/^Uploading/i.test(x))
			.slice(-1)[0] || "không rõ";
		console.log(`  ✗ nạp ${r.id}: ${loi}`);
		hongNap++; continue;
	}

	// Trường kiểu image cần { id, meta: { storageKey } } — chỉ id thì ảnh 404 mà thẻ
	// <img> vẫn hiện, nhìn qua tưởng có ảnh.
	await kho.query(
		"UPDATE ec_duoc_lieu SET anh = $1 WHERE slug = $2 AND deleted_at IS NULL",
		[JSON.stringify({ id: j.id, meta: { storageKey: j.storageKey || j.storage_key } }), String(r.id)],
	);
	gan++;
	if (gan % 50 === 0) console.log(`  …${gan}/${coAnh.length}`);
}

await kho.query("ALTER TABLE ec_duoc_lieu ENABLE TRIGGER USER").catch(() => {});
const n = await kho.query(
	"SELECT count(*) FILTER (WHERE anh IS NOT NULL)::int a, count(*) FILTER (WHERE so_bai_thuoc IS NOT NULL)::int b FROM ec_duoc_lieu WHERE deleted_at IS NULL",
);
console.log(`\nTrong CMS: ${n.rows[0].a} vị có ảnh · ${n.rows[0].b} vị có số bài thuốc.`);
if (hongTai) console.log(`${hongTai} ảnh tải không được.`);
if (hongNap) console.log(`${hongNap} ảnh nạp lỗi.`);
console.log("→ Chạy tiếp: node scripts-di-cu/dung-chi-muc.mjs duoc_lieu");
await kho.end();
