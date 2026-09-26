// the-duong-kinh.mjs — Thêm thẻ nhóm "Đường Kinh" (12 chính kinh + Mạch Nhâm + Mạch Đốc) vào
// the_loai của từng huyệt, để lọc được huyệt theo đường kinh trong thư viện CMS.
//
// NGUỒN: suy từ chính bộ khớp huyệt↔kinh mà build-dict.mjs/frontend đã dùng (dict-data.mjs
// classify(), khớp qua MÃ WHO trong acu-index.js) — KHÔNG suy bằng cách parse chuỗi mã huyệt.
// Vì sao: đã đo, cột ma_huyet trong CHÍNH CSDL CMS này lệch quy ước ở hai chỗ — kinh Tâm ghi
// "HE1..HE9" (không phải "HT"), và huyệt Thận "Thận Phong" ghi "K23" (không phải "KI23", làm
// đứt dãy KI22→KI24). dict-data.classify() không đụng cột ma_huyet nên tránh được lỗi này
// hoàn toàn — đã đối chiếu 361/361 huyệt-thuộc-kinh suy ra đều khớp đúng slug có thật trong
// ec_huyet_vi (0 thiếu).
//
// ⚠️ the_loai đã có 1.323 thẻ RÀ TAY (Loại Huyệt/Ngũ Hành/Ngũ Du Huyệt/Huyệt Đặc Dụng) của
// phiên khác. Script này CHỈ NỐI THÊM: đọc mảng cũ, bỏ thẻ "Đường Kinh" CŨ (nếu có, để chạy
// lại không nhân đôi) rồi thêm thẻ "Đường Kinh" MỚI, ghi lại NGUYÊN mảng — không đụng thẻ
// của 4 nhóm kia.
//
//   node scripts-di-cu/the-duong-kinh.mjs --thu
//   node scripts-di-cu/the-duong-kinh.mjs

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

// slug huyệt → thẻ Đường Kinh. Chỉ huyệt NẰM TRÊN một đường kinh mới có thẻ này — kỳ huyệt
// và A Thị huyệt (loai !== 'kinh') không thuộc kinh nào nên không gắn.
const theo = new Map();
for (const rec of D.records) {
	if (!rec || !rec.ten || !rec._slug) continue;
	const cls = D.classify(rec);
	if (cls.loai !== "kinh" || !cls.kinhSlug) continue;
	theo.set(rec._slug, { ma: cls.kinhSlug, ten: cls.kinhTen, nhom: "Đường Kinh" });
}

console.log(`Đường Kinh: ${theo.size} huyệt thuộc kinh (khớp qua mã WHO, dict-data.classify()).`);

if (chiThu) {
	const theoKinh = new Map();
	for (const t of theo.values()) theoKinh.set(t.ten, (theoKinh.get(t.ten) || 0) + 1);
	for (const [ten, n] of theoKinh) console.log(`  ▸ ${ten}: ${n} huyệt`);
	const vd = [...theo.entries()].find(([s]) => s === "thai-uyen");
	if (vd) console.log(`\n  ví dụ thai-uyen: ${JSON.stringify(vd[1])}`);
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

let nSua = 0;
let nBoQua = 0;
for (const [slug, tag] of theo) {
	const cu = await kho.query(
		"SELECT the_loai FROM ec_huyet_vi WHERE slug = $1 AND deleted_at IS NULL",
		[slug],
	);
	if (!cu.rowCount) { nBoQua++; continue; }
	const mangCu = Array.isArray(cu.rows[0].the_loai) ? cu.rows[0].the_loai : [];
	// Bỏ thẻ "Đường Kinh" CŨ (nếu có) rồi thêm thẻ MỚI — nhờ vậy chạy lại lần hai KHÔNG nhân đôi.
	const giuLai = mangCu.filter((t) => t && t.nhom !== "Đường Kinh");
	const mangMoi = [...giuLai, tag];
	const r = await kho.query(
		"UPDATE ec_huyet_vi SET the_loai = $1 WHERE slug = $2 AND deleted_at IS NULL",
		[JSON.stringify(mangMoi), slug],
	);
	nSua += r.rowCount;
}

await kho.query("ALTER TABLE ec_huyet_vi ENABLE TRIGGER USER").catch(() => {});

// Xác nhận trigger đã bật lại thật (đừng chỉ tin câu lệnh không báo lỗi).
const kiemTrigger = await kho.query(
	"SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid = 'ec_huyet_vi'::regclass AND NOT tgisinternal",
);
const conTat = kiemTrigger.rows.filter((r) => r.tgenabled === "D");
if (conTat.length) {
	console.error(`✗ CẢNH BÁO: vẫn còn trigger TẮT trên ec_huyet_vi: ${conTat.map((r) => r.tgname).join(", ")}`);
} else {
	console.log(`✓ Đã xác nhận qua pg_trigger.tgenabled: cả ${kiemTrigger.rows.length} trigger user trên ec_huyet_vi đều BẬT lại.`);
}

console.log(`\nGắn thẻ Đường Kinh cho ${nSua} huyệt (${nBoQua} không khớp slug trong CMS).`);
console.log("→ Chạy tiếp: node scripts-di-cu/dung-chi-muc.mjs huyet_vi");
await kho.end();
