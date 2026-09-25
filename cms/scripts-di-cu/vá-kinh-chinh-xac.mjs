// vá-kinh-chinh-xac.mjs — Nhập LẠI 20 đường kinh/mạch cho ĐÚNG TỪNG KÝ TỰ, và lưu
// những trường mà bản nhập đầu không giữ.
//
// Đối chiếu tệp meridians.js ↔ CMS lộ ra bốn chỗ:
//
//  1. Vài trường chữ LỆCH (trieuChung/dieuTri của mấy mạch) — cùng bệnh với hai bộ
//     bệnh: bản nhập đầu đẩy chữ qua markdown nên nuốt cụm dẫn đầu dòng. Ở đây dựng
//     THẲNG Portable Text, mỗi dòng một khối.
//  2. SLUG khác nhau. CMS dùng slug NGẮN cho URL (`/kinh/phe/`), còn tệp giữ slug DÀI
//     (`kinh-thu-thai-am-phe`) — 15/20 khác nhau. Phải lưu slug_goc, không thì sinh lại
//     đổi địa chỉ của 15 mục.
//  3. Cột ảnh trong CMS giữ ĐỐI TƯỢNG media của CMS ({id, meta.storageKey}), khác hẳn
//     đường dẫn mà app đang dùng (`images/meridians/kinh-01-chinh.jpg`). Lưu nguyên cả
//     đối tượng `images` vào anh_goc để sinh lại không mất.
//  4. Thiếu hẳn `points` (361 mục, có mã huyệt) và `id` số.
//
// ⚠️ `id` của kinh chạy 1–12 và của mạch chạy 1–8 — TRÙNG NHAU. Khoá định danh là CẶP
// (loai, ma_cu), không phải mình ma_cu.
//
//   node scripts-di-cu/vá-kinh-chinh-xac.mjs --thu
//   node scripts-di-cu/vá-kinh-chinh-xac.mjs

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
const w = {};
new Function("window", readFileSync(resolve(goc, "frontend/public/kinhmach3d/data/meridians.js"), "utf8"))(w);
const M = w.MERIDIANS;

let dem = 0;
const khoa = () => `b${++dem}`;
const doan = (s) => {
	if (s === null || s === undefined) return null;
	return JSON.stringify(
		String(s).split(/\n/).map((t) => ({
			_type: "block", _key: khoa(), style: "normal", markDefs: [],
			children: [{ _type: "span", _key: khoa(), text: t, marks: [] }],
		})),
	);
};

// cột CMS ↔ khoá trong tệp
const CHU = {
	dai_cuong: "desc", duong_chinh: "chinh", kinh_can: "can", kinh_biet: "biet",
	lac_doc: "doc", lac_ngang: "ngang", chu_tri: "chuTri", dac_tinh: "dacTinh",
	van_hanh: "vanHanh", trieu_chung: "trieuChung", dieu_tri: "dieuTri",
};
const THO = {
	title: "ten", ten_khac: "nameAlt", ma: "code", loai: "type",
	huyet_ds: "huyet", tom_tat_huyet: "pointSummary",
};

const hang = [...M.kinh, ...M.circuits].map((r) => ({
	slug: D.kinhSlugOf(r),
	slug_goc: r.slug ?? null,
	ma_cu: r.id ?? null,
	diem: JSON.stringify(r.points || []),
	anh_goc: JSON.stringify(r.images || {}),
	...Object.fromEntries(Object.entries(THO).map(([c, f]) => [c, r[f] ?? null])),
	...Object.fromEntries(Object.entries(CHU).map(([c, f]) => [c, doan(r[f])])),
}));

console.log(`Kinh/mạch: ${hang.length} · điểm huyệt: ${[...M.kinh, ...M.circuits].reduce((a, b) => a + (b.points || []).length, 0)}`);

if (chiThu) {
	const x = hang[0];
	console.log(`  ví dụ ${x.slug}: slug_goc=${x.slug_goc} · ma_cu=${x.ma_cu} · loai=${x.loai}`);
	console.log(`    anh_goc: ${x.anh_goc.slice(0, 110)}…`);
	console.log(`    diem   : ${x.diem.slice(0, 90)}…`);
	process.exit(0);
}

const env = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const kho = new Client({
	host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
	database: env.PGDATABASE,
	ssl: { ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();
for (const c of ["ma_cu integer", "slug_goc text", "diem json", "anh_goc json"]) {
	await kho.query(`ALTER TABLE ec_kinh_mach ADD COLUMN IF NOT EXISTS ${c}`);
}
await kho.query("ALTER TABLE ec_kinh_mach DISABLE TRIGGER USER").catch(() => {});

const cot = ["slug", "slug_goc", "ma_cu", "diem", "anh_goc", ...Object.keys(THO), ...Object.keys(CHU)];
const kieu = (c) =>
	c === "ma_cu" ? "::int" : c === "diem" || c === "anh_goc" || c in CHU ? "::json" : "";
const dat = cot.slice(1).map((c, i) => `${c} = v.c${i}${kieu(c)}`).join(",\n\t\t");
const unnest = cot.map((_, i) => `unnest($${i + 1}::text[]) AS ${i === 0 ? "slug" : "c" + (i - 1)}`).join(", ");

const r = await kho.query(
	`UPDATE ec_kinh_mach e SET
		${dat}
	 FROM (SELECT ${unnest}) v
	 WHERE e.slug = v.slug AND e.deleted_at IS NULL`,
	cot.map((c) => hang.map((h) => (h[c] === null || h[c] === undefined ? null : String(h[c])))),
);

await kho.query("ALTER TABLE ec_kinh_mach ENABLE TRIGGER USER").catch(() => {});
console.log(`Gán ${r.rowCount}/${hang.length} kinh/mạch.`);
console.log("→ Chạy tiếp: node scripts-di-cu/xuat-meridians-js.mjs --kiem");
await kho.end();
