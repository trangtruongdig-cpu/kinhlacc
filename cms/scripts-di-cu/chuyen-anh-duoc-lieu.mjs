// chuyen-anh-duoc-lieu.mjs — Đổi ảnh đại diện dược liệu sang ảnh do CMS giữ.
//
// Khác huyệt vị và kinh mạch: trang dược liệu do SPA dựng qua API, không phải trang tĩnh.
// `assetUrl()` (frontend/src/services/api.ts) cho URL tuyệt đối đi qua NGUYÊN VẸN, nên đổi
// giá trị cột là đủ — KHÔNG phải sửa một dòng giao diện nào.
//
// ⚠️ ĐÁNH ĐỔI ĐÃ BIẾT: thẻ <img> của SPA không có onerror, nên bộ này KHÔNG có đường lùi
// như trang huyệt/kinh. Ảnh chưa vào đệm nginx mà CMS sập thì hiện ảnh vỡ. Muốn có đường
// lùi thì phải sửa component, tức đụng giao diện — điều người dùng đã dặn không làm.
// Bù lại: nginx đệm ảnh CMS 365 ngày (khối ^~ /_emdash/api/media/file/), và ảnh đã đệm
// vẫn sống khi CMS sập (đã đo).
//
// VÌ SAO PHẢI ĐỔI QUA CMS CHỨ KHÔNG ĐỔI THẲNG `vi_thuoc.anh_dai_dien`:
// dong-bo-app.mjs đối chiếu vi_thuoc ↔ ec_duoc_lieu. Đổi thẳng bên app là lần đồng bộ sau
// thấy 536 ô "lệch" rồi ĐẨY ĐƯỜNG DẪN CŨ TRỞ LẠI — vừa mất thay đổi vừa phá tính chất
// "chưa ai sửa thì đồng bộ ra 0 ô". Nên đổi ở CMS rồi để đồng bộ mang sang.
//
// HOÀN NGUYÊN ĐƯỢC: đường dẫn tĩnh gốc được cất vào cột anh_dai_dien_tinh trước khi ghi đè.
// `--hoan` phục hồi từ đó. Cột này cũng là chỗ lấy đường lùi nếu sau này dựng ảnh vào
// trang tĩnh /duoc-lieu/<id>/ (hiện trang đó không có thẻ ảnh nào).
//
//   node scripts-di-cu/chuyen-anh-duoc-lieu.mjs          # chạy thử
//   node scripts-di-cu/chuyen-anh-duoc-lieu.mjs --ghi    # đổi thật
//   node scripts-di-cu/chuyen-anh-duoc-lieu.mjs --hoan   # trả về đường dẫn tĩnh
// Sau --ghi hoặc --hoan PHẢI chạy: node scripts-di-cu/dong-bo-app.mjs --thu

import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const goc = resolve(here, "../..");
const require = createRequire(import.meta.url);
const { Client } = require("pg");
const seGhi = process.argv.includes("--ghi");
const seHoan = process.argv.includes("--hoan");

const env = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const kho = new Client({
	host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
	database: env.PGDATABASE,
	ssl: { ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();
await kho.query(`ALTER TABLE ec_duoc_lieu ADD COLUMN IF NOT EXISTS anh_dai_dien_tinh text`);

// Cất đường dẫn tĩnh MỘT LẦN, và chỉ khi nó đang thật sự là đường dẫn tĩnh. Chạy lại sau
// khi đã đổi thì điều kiện này giữ cho bản cất không bị ghi đè bằng URL của CMS.
const cat = await kho.query(
	`UPDATE ec_duoc_lieu SET anh_dai_dien_tinh = anh_dai_dien
	 WHERE deleted_at IS NULL AND anh_dai_dien IS NOT NULL
	   AND anh_dai_dien NOT LIKE '/_emdash/%' AND anh_dai_dien_tinh IS NULL`,
);
if (cat.rowCount) console.log(`Cất đường dẫn tĩnh của ${cat.rowCount} vị vào anh_dai_dien_tinh.`);

if (seHoan) {
	const r = await kho.query(
		`UPDATE ec_duoc_lieu SET anh_dai_dien = anh_dai_dien_tinh
		 WHERE deleted_at IS NULL AND anh_dai_dien_tinh IS NOT NULL AND anh_dai_dien LIKE '/_emdash/%'`,
	);
	console.log(`✓ Hoàn nguyên ${r.rowCount} vị về đường dẫn tĩnh.`);
	console.log("→ Chạy tiếp: node scripts-di-cu/dong-bo-app.mjs --thu");
	await kho.end();
	process.exit(0);
}

const rows = (await kho.query(
	`SELECT slug, anh, anh_dai_dien, anh_dai_dien_tinh FROM ec_duoc_lieu
	 WHERE deleted_at IS NULL AND anh IS NOT NULL`,
)).rows;

const urlCms = (v) => {
	let o = v;
	if (typeof o === "string") { try { o = JSON.parse(o); } catch { return null; } }
	const khoa = o?.meta?.storageKey;
	// KHÔNG rơi về o.id: URL dựng bằng id trần trả 404 mà thẻ <img> vẫn render — lỗi
	// không lộ khi chỉ nhìn trang.
	return khoa ? `/_emdash/api/media/file/${khoa}` : null;
};

const doi = [];
let thieuKhoa = 0, daDoi = 0;
for (const x of rows) {
	const u = urlCms(x.anh);
	if (!u) { thieuKhoa++; continue; }
	if (x.anh_dai_dien === u) { daDoi++; continue; }
	doi.push([x.slug, u, x.anh_dai_dien]);
}

console.log(`Dược liệu có ảnh CMS: ${rows.length} · sẽ đổi ${doi.length} · đã đổi rồi ${daDoi}` +
	`${thieuKhoa ? ` · BỎ QUA ${thieuKhoa} vì thiếu storageKey` : ""}`);
for (const [s, u, cu] of doi.slice(0, 3)) console.log(`  vị ${s}: ${cu} → ${u}`);
if (doi.length > 3) console.log(`  … và ${doi.length - 3} vị nữa`);

if (!seGhi) {
	console.log(doi.length ? "\nChạy lại với --ghi để áp." : "\nKhông có gì để đổi.");
	await kho.end();
	process.exit(0);
}

await kho.query("ALTER TABLE ec_duoc_lieu DISABLE TRIGGER USER").catch(() => {});
const r = await kho.query(
	`UPDATE ec_duoc_lieu e SET anh_dai_dien = v.u
	 FROM (SELECT unnest($1::text[]) AS slug, unnest($2::text[]) AS u) v
	 WHERE e.slug = v.slug AND e.deleted_at IS NULL`,
	[doi.map((x) => x[0]), doi.map((x) => x[1])],
);
await kho.query("ALTER TABLE ec_duoc_lieu ENABLE TRIGGER USER").catch(() => {});
console.log(`\n✓ Đổi ${r.rowCount} vị sang ảnh CMS.`);
console.log("→ Chạy tiếp: node scripts-di-cu/dong-bo-app.mjs --thu   (phải thấy đúng số này)");
await kho.end();
