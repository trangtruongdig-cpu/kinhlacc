// di-cu-huyet.mjs — Chép 1.059 huyệt từ dữ liệu tĩnh của app sang CMS.
//
// Ghi thẳng bảng chứ không qua CLI: CLI mất ~7 giây mỗi mục, 1.059 mục là hơn hai tiếng.
// Giữ NGUYÊN slug cũ để /huyet/<slug> không đổi địa chỉ.
//
//   node scripts-di-cu/di-cu-huyet.mjs --thu    # xem trước, không ghi
//   node scripts-di-cu/di-cu-huyet.mjs

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

// ── Portable Text ─────────────────────────────────────────────────────
// EmDash lưu chữ dạng khối. Dựng tay vì đi đường CLI thì quá chậm; hình dạng dưới đây
// đối chiếu với khối do chính EmDash sinh ra (block → children → span).
let dem = 0;
const khoa = () => `k${++dem}`;
const khoi = (t) => ({
	_type: "block",
	_key: khoa(),
	style: "normal",
	markDefs: [],
	children: [{ _type: "span", _key: khoa(), text: t, marks: [] }],
});
const doan = (s) => {
	const ds = String(s ?? "")
		.split(/\n+/)
		.map((x) => x.trim())
		.filter(Boolean);
	return ds.length ? ds.map(khoi) : null;
};

// Tiêu đề mục trong sách → tên trường trong CMS.
const MUC = {
	"TÊN HUYỆT": "y_nghia_ten",
	"ĐẶC TÍNH": "dac_tinh",
	"VỊ TRÍ": "vi_tri",
	"GIẢI PHẪU": "giai_phau",
	"TÁC DỤNG": "tac_dung",
	"CHỦ TRỊ": "chu_tri",
	"CHÂM CỨU": "cham_cuu",
	"XUẤT XỨ": "xuat_xu",
};

const ABC = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const ulid = () => {
	let s = "";
	for (let i = 0; i < 26; i++) s += ABC[Math.floor(Math.random() * 32)];
	return s;
};

const ds = D.ACU.records;
console.log(`Huyệt trong dữ liệu tĩnh: ${ds.length}`);

if (chiThu) {
	const thieuSlug = ds.filter((r) => !(r._slug || r.slug)).length;
	const trung = ds.length - new Set(ds.map((r) => r._slug || r.slug)).size;
	if (trung) { console.error(`✗ còn ${trung} slug trùng — dừng`); process.exit(1); }
	const coMa = ds.filter((r) => r.international_code).length;
	console.log(`  thiếu slug: ${thieuSlug} · có mã quốc tế: ${coMa}`);
	console.log("\n3 mục đầu:");
	for (const r of ds.slice(0, 3)) {
		const co = (r.sections || []).map((s) => MUC[s.h] || `(bỏ:${s.h})`);
		console.log(`  ${(r._slug || r.slug).padEnd(22)} ${r.ten.padEnd(20)} ${r.international_code || "—"} · ${co.join(", ")}`);
	}
	process.exit(0);
}

const cms = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const kho = new Client({
	host: cms.PGHOST,
	port: +cms.PGPORT,
	user: cms.PGUSER,
	password: cms.PGPASSWORD,
	database: cms.PGDATABASE,
	ssl: { ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();

const daCo = new Set((await kho.query("SELECT slug FROM ec_huyet_vi")).rows.map((r) => r.slug));
const COT = [
	"y_nghia_ten", "dac_tinh", "vi_tri", "giai_phau",
	"tac_dung", "chu_tri", "cham_cuu", "xuat_xu",
];

let them = 0, bo = 0;
for (const r of ds) {
	// _slug TRƯỚC: đó là slug đã khử trùng (am-khich, am-khich-2…) mà trang tĩnh đang
	// dùng. Lấy r.slug thì 15 cặp như Âm Khích/Ẩm Khích, Hạ Quan/Hạ Quản, Từ Cung/Tử
	// Cung dồn về một địa chỉ và mất bản thứ hai.
	const slug = r._slug || r.slug;
	if (!slug || daCo.has(slug)) { bo++; continue; }
	daCo.add(slug);

	const phan = {};
	let tenKhac = "";
	for (const s of r.sections || []) {
		if (s.h === "TÊN KHÁC") { tenKhac = String(s.body || "").trim(); continue; }
		const cot = MUC[s.h];
		if (cot) phan[cot] = doan(s.body);
	}

	await kho.query(
		`INSERT INTO ec_huyet_vi
			(id, slug, status, created_at, updated_at, published_at, version, locale, translation_group,
			 title, ma_huyet, ten_khac, ten_han, pinyin, ten_anh,
			 pho_huyet, ghi_chu, tham_khao, cho_index,
			 ${COT.join(", ")})
		 VALUES ($1,$2,'published',now(),now(),now(),1,'en',$1,
			 $3,$4,$5,$6,$7,$8,
			 $9,$10,$11,1,
			 ${COT.map((_, i) => `$${12 + i}`).join(", ")})`,
		[
			ulid(), slug,
			r.ten, r.international_code || null, tenKhac || null, r.chinese || null,
			r.pinyin || null, r.english || null,
			r.phoiHuyet || null, r.ghiChu || null, r.thamKhao || null,
			...COT.map((c) => (phan[c] ? JSON.stringify(phan[c]) : null)),
		],
	);
	them++;
	if (them % 200 === 0) console.log(`  …${them}/${ds.length}`);
}

const tong = await kho.query("SELECT count(*)::int n FROM ec_huyet_vi WHERE deleted_at IS NULL");
console.log(`\nThêm ${them} huyệt${bo ? `, bỏ ${bo} (trùng slug hoặc thiếu slug)` : ""}. Tổng trong CMS: ${tong.rows[0].n}`);
await kho.end();
