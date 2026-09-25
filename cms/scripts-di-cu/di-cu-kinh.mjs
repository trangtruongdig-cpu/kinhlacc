// di-cu-kinh.mjs — Chép 20 đường kinh (12 chính kinh + 8 mạch) sang CMS.
// Giữ nguyên slug để /kinh/<slug> không đổi địa chỉ.
//
//   node scripts-di-cu/di-cu-kinh.mjs --thu
//   node scripts-di-cu/di-cu-kinh.mjs

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

let dem = 0;
const khoa = () => `k${++dem}`;
const khoi = (t) => ({
	_type: "block", _key: khoa(), style: "normal", markDefs: [],
	children: [{ _type: "span", _key: khoa(), text: t, marks: [] }],
});
const doan = (s) => {
	const ds = String(s ?? "").split(/\n+/).map((x) => x.trim()).filter(Boolean);
	return ds.length ? ds.map(khoi) : null;
};

// khoá trong dữ liệu tĩnh → cột trong CMS
const CHUYEN = {
	desc: "dai_cuong", dacTinh: "dac_tinh", vanHanh: "van_hanh",
	chinh: "duong_chinh", can: "kinh_can", biet: "kinh_biet",
	doc: "lac_doc", ngang: "lac_ngang", trieuChung: "trieu_chung",
	chuTri: "chu_tri", dieuTri: "dieu_tri",
};
const COT = Object.values(CHUYEN);

const ds = D.meridianList;
console.log(`Đường kinh: ${ds.length}`);

if (chiThu) {
	for (const m of ds) {
		const co = Object.keys(CHUYEN).filter((k) => String(m[k] || "").trim()).length;
		console.log(`  ${D.kinhSlugOf(m).padEnd(16)} ${String(m.ten).padEnd(28)} ${m.code || "—"} · ${co}/11 mục · ${Object.keys(m.images || {}).length} sơ đồ`);
	}
	process.exit(0);
}

const ABC = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const ulid = () => { let s = ""; for (let i = 0; i < 26; i++) s += ABC[Math.floor(Math.random() * 32)]; return s; };

const env = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const kho = new Client({
	host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
	database: env.PGDATABASE,
	ssl: { ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();

const daCo = new Set((await kho.query("SELECT slug FROM ec_kinh_mach")).rows.map((r) => r.slug));
let them = 0, bo = 0;

for (const m of ds) {
	const slug = D.kinhSlugOf(m);
	if (!slug || daCo.has(slug)) { bo++; continue; }
	daCo.add(slug);

	const phan = {};
	for (const [k, cot] of Object.entries(CHUYEN)) phan[cot] = doan(m[k]);

	await kho.query(
		`INSERT INTO ec_kinh_mach
			(id, slug, status, created_at, updated_at, published_at, version, locale, translation_group,
			 title, ten_khac, ma, loai, huyet_ds, tom_tat_huyet, ${COT.join(", ")})
		 VALUES ($1,$2,'published',now(),now(),now(),1,'en',$1,
			 $3,$4,$5,$6,$7,$8, ${COT.map((_, i) => `$${9 + i}`).join(", ")})`,
		[
			ulid(), slug,
			m.ten, m.nameAlt || null, m.code || null, m.type || null,
			m.huyet || null, m.pointSummary || null,
			...COT.map((c) => (phan[c] ? JSON.stringify(phan[c]) : null)),
		],
	);
	them++;
}

const tong = await kho.query("SELECT count(*)::int n FROM ec_kinh_mach WHERE deleted_at IS NULL");
console.log(`\nThêm ${them} đường kinh${bo ? `, bỏ ${bo}` : ""}. Tổng trong CMS: ${tong.rows[0].n}`);
await kho.end();
