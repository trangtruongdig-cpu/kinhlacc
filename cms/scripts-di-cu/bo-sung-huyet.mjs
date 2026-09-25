// bo-sung-huyet.mjs — Nạp nốt những trường mà bản nhập đầu tiên BỎ SÓT.
//
// Vì sao cần: kế hoạch là cho CMS thành nguồn dữ liệu cho chính giao diện cũ, bằng
// cách SINH LẠI acupoints.js từ CMS. Muốn sinh lại không mất gì thì CMS phải giữ ĐỦ
// mọi trường mà tệp đó có. Đối chiếu ra 5 trường còn thiếu:
//
//   noi_dung_goc  — CHỮ GỐC. Bản nhập đầu chỉ lấy sections (phần hiển thị), mà
//                   sections thiếu 1.304/15.289 dòng (8,5%) so với chữ gốc. Chữ đó
//                   KHÔNG hiển thị ở đâu cả — app cũ chỉ dùng nó để TÌM KIẾM
//                   (TuDienView dòng 481, gộp vào chuỗi _s). Không giữ thì mỗi lần
//                   sinh lại là ô tìm kiếm mất 8,5% chữ.
//   thu_tu_muc    — Thứ tự các mục KHÁC NHAU ở từng huyệt: đo được 33 kiểu. Hợp Cốc
//                   có GIẢI PHẪU ở cuối, A Thị Huyệt không có mục đó. Sinh lại bằng
//                   một thứ tự cố định là đảo lộn cách trình bày của 1.059 trang.
//   anh_duong_dan — Đường dẫn ảnh gốc (images/acupoints/…). Trường `anh` trong CMS
//                   trỏ vào thư viện ảnh của CMS, KHÁC đường dẫn mà app đang dùng.
//   ma_gach       — Mã dạng gạch nối (LU-9), khác international_code (LU9).
//   chi_dinh      — Danh sách chỉ định (AcuKG), app dùng để lọc và để tìm kiếm.
//
//   node scripts-di-cu/bo-sung-huyet.mjs --thu
//   node scripts-di-cu/bo-sung-huyet.mjs

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

const hang = D.ACU.records
	.map((r) => ({
		slug: r._slug || r.slug,
		noi_dung_goc: r.noiDung || null,
		thu_tu_muc: JSON.stringify((r.sections || []).map((s) => s.h)),
		anh_duong_dan: r.image || null,
		ma_gach: r.code_dash || null,
		chi_dinh: JSON.stringify(r.indications || []),
	}))
	.filter((x) => x.slug);

const dem = (k) => hang.filter((x) => x[k] && x[k] !== "[]").length;
console.log(`Huyệt: ${hang.length}`);
console.log(
	`  chữ gốc ${dem("noi_dung_goc")} · thứ tự mục ${dem("thu_tu_muc")} · ` +
		`ảnh ${dem("anh_duong_dan")} · mã gạch ${dem("ma_gach")} · chỉ định ${dem("chi_dinh")}`,
);

if (chiThu) {
	const x = hang.find((h) => h.slug === "hop-coc") || hang[0];
	console.log(`\n  ví dụ ${x.slug}:`);
	console.log(`    thứ tự mục: ${x.thu_tu_muc}`);
	console.log(`    ảnh: ${x.anh_duong_dan} · mã gạch: ${x.ma_gach}`);
	console.log(`    chỉ định: ${String(x.chi_dinh).slice(0, 100)}`);
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

const r = await kho.query(
	`UPDATE ec_huyet_vi e SET
		noi_dung_goc  = v.nd,
		thu_tu_muc    = v.tt::json,
		anh_duong_dan = v.ad,
		ma_gach       = v.mg,
		chi_dinh      = v.cd::json
	 FROM (
		SELECT unnest($1::text[]) AS slug, unnest($2::text[]) AS nd, unnest($3::text[]) AS tt,
		       unnest($4::text[]) AS ad, unnest($5::text[]) AS mg, unnest($6::text[]) AS cd
	 ) v
	 WHERE e.slug = v.slug AND e.deleted_at IS NULL`,
	[
		hang.map((x) => x.slug),
		hang.map((x) => x.noi_dung_goc),
		hang.map((x) => x.thu_tu_muc),
		hang.map((x) => x.anh_duong_dan),
		hang.map((x) => x.ma_gach),
		hang.map((x) => x.chi_dinh),
	],
);

await kho.query("ALTER TABLE ec_huyet_vi ENABLE TRIGGER USER").catch(() => {});
console.log(`\nGán ${r.rowCount} huyệt.`);
console.log("→ Chạy tiếp: node scripts-di-cu/dung-chi-muc.mjs huyet_vi");
await kho.end();
