// di-cu-anh-len-s3.mjs — Đưa 2.561 tệp ảnh từ đĩa máy lập trình lên kho S3 dùng chung.
//
// VÌ SAO: xem chú thích kho ảnh trong astro.config.mjs. Tóm lại: CSDL dùng chung nhưng
// `storage: local` cất ảnh trên đĩa từng máy, nên deploy xong ảnh trả 404 trên VPS.
//
// ⚠️ GIỮ NGUYÊN TÊN KHOÁ. Tên tệp trên đĩa ĐÚNG BẰNG `meta.storageKey` trong CSDL, nên đẩy
// lên với cùng tên là KHÔNG phải sửa một dòng CSDL nào, KHÔNG phải sinh lại acupoints.js,
// KHÔNG phải build lại. Đổi tên khoá ở bước này là tự tạo việc vá 2.561 bản ghi.
//
// Chạy nhiều lần được: mặc định BỎ QUA tệp đã có trên S3 với đúng kích thước. Nhờ vậy
// nạp thêm ảnh rồi chạy lại chỉ đẩy phần mới.
//
//   node scripts-di-cu/di-cu-anh-len-s3.mjs            # chạy thử: đếm, không đẩy
//   node scripts-di-cu/di-cu-anh-len-s3.mjs --ghi      # đẩy thật
//   node scripts-di-cu/di-cu-anh-len-s3.mjs --kiem     # đối chiếu CSDL ↔ S3, không đẩy

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, join, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const goc = resolve(here, "../..");
const require = createRequire(import.meta.url);
const seGhi = process.argv.includes("--ghi");
const chiKiem = process.argv.includes("--kiem");

const env = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const thieu = ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"].filter((k) => !env[k]);
if (thieu.length) {
	console.error(`✗ cms/.env còn thiếu: ${thieu.join(", ")}`);
	console.error("  Tạo bucket R2 (quyền Object Read & Write, để RIÊNG TƯ) rồi khai 4 dòng đó.");
	process.exit(1);
}

const KIEU = { ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
	".png": "image/png", ".gif": "image/gif", ".svg": "image/svg+xml", ".avif": "image/avif" };

const thuMuc = join(goc, "cms/uploads");
if (!existsSync(thuMuc)) { console.error(`✗ không thấy ${thuMuc}`); process.exit(1); }
const tep = readdirSync(thuMuc, { withFileTypes: true })
	.filter((e) => e.isFile() && !e.name.startsWith("."))
	.map((e) => ({ khoa: e.name, duong: join(thuMuc, e.name), co: statSync(join(thuMuc, e.name)).size }));

const tongByte = tep.reduce((a, x) => a + x.co, 0);
console.log(`Đĩa: ${tep.length} tệp · ${(tongByte / 1048576).toFixed(1)} MB`);

// ── Đối chiếu với CSDL: tệp nào MỒ CÔI, bản ghi nào THIẾU tệp ──────────
const { Client } = require("pg");
const kho = new Client({
	host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
	database: env.PGDATABASE,
	ssl: { ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();
const cotKhoa = (await kho.query(
	`SELECT column_name FROM information_schema.columns WHERE table_name='media' AND column_name IN ('storage_key','storageKey','key')`,
)).rows[0]?.column_name;
const trongCsdl = new Set();
if (cotKhoa) {
	for (const r of (await kho.query(`SELECT ${cotKhoa} AS k FROM media WHERE ${cotKhoa} IS NOT NULL`)).rows) trongCsdl.add(r.k);
}
await kho.end();

const tenTep = new Set(tep.map((x) => x.khoa));
const moCoi = [...tenTep].filter((k) => !trongCsdl.has(k));
const thieuTep = [...trongCsdl].filter((k) => !tenTep.has(k));
console.log(`CSDL: ${trongCsdl.size} bản ghi media${cotKhoa ? "" : " (KHÔNG đọc được cột khoá — bỏ phép đối chiếu)"}`);
if (cotKhoa) {
	console.log(`  tệp trên đĩa KHÔNG có bản ghi : ${moCoi.length}${moCoi.length ? " (đẩy lên cũng vô hại, chỉ chiếm chỗ)" : ""}`);
	console.log(`  bản ghi KHÔNG có tệp trên đĩa : ${thieuTep.length}${thieuTep.length ? " ← những ảnh này sẽ 404 ở MỌI nơi" : ""}`);
	for (const k of thieuTep.slice(0, 5)) console.log(`      ${k}`);
}
if (chiKiem) process.exit(thieuTep.length ? 1 : 0);

// ── Đẩy lên ────────────────────────────────────────────────────────────
const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const s3 = new S3Client({
	region: env.S3_REGION || "auto",
	endpoint: env.S3_ENDPOINT,
	credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
});
const Bucket = env.S3_BUCKET;

// Đã có trên S3 với ĐÚNG kích thước thì bỏ qua. So kích thước chứ không chỉ so sự tồn tại:
// một lần đẩy bị cắt giữa đường để lại tệp ngắn, mà "đã tồn tại" thì không phát hiện được.
let daCo = 0, daDay = 0, loi = 0, byteDay = 0;
const canDay = [];
process.stdout.write("Dò tệp đã có trên S3… ");
for (const x of tep) {
	try {
		const h = await s3.send(new HeadObjectCommand({ Bucket, Key: x.khoa }));
		if (Number(h.ContentLength) === x.co) { daCo++; continue; }
	} catch { /* chưa có */ }
	canDay.push(x);
}
console.log(`đã có ${daCo} · cần đẩy ${canDay.length}`);

if (!seGhi) {
	console.log(`\nSẽ đẩy ${canDay.length} tệp · ${(canDay.reduce((a, x) => a + x.co, 0) / 1048576).toFixed(1)} MB`);
	console.log("Chạy lại với --ghi để đẩy thật.");
	process.exit(0);
}

for (const [i, x] of canDay.entries()) {
	try {
		await s3.send(new PutObjectCommand({
			Bucket, Key: x.khoa, Body: readFileSync(x.duong),
			ContentType: KIEU[extname(x.khoa).toLowerCase()] || "application/octet-stream",
			CacheControl: "public, max-age=31536000, immutable",
		}));
		daDay++; byteDay += x.co;
	} catch (e) {
		loi++;
		if (loi <= 5) console.error(`  ✗ ${x.khoa}: ${e.message}`);
	}
	if ((i + 1) % 200 === 0) console.log(`  …${i + 1}/${canDay.length}`);
}
console.log(`\n✓ Đẩy ${daDay} tệp · ${(byteDay / 1048576).toFixed(1)} MB${loi ? ` · LỖI ${loi} tệp` : ""}`);
console.log("→ Khai 4 dòng S3_* vào cms/.env của VPS rồi deploy, ảnh sẽ đọc từ kho chung.");
process.exit(loi ? 1 : 0);
