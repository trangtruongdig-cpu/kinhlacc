// vá-benh-chinh-xac.mjs — Nhập LẠI hai bộ bệnh cho ĐÚNG TỪNG KÝ TỰ.
//
// Vì sao cần: bản nhập đầu (di-cu-benh.mjs) đẩy chữ qua MARKDOWN của CLI EmDash.
// Markdown nuốt trọn CỤM DẪN ĐẦU DÒNG. Đối chiếu từng dòng tệp ↔ CMS: 991 dòng lệch
// (ccdt 970 / bệnh học 21). Mất cả cụm chứ không chỉ dấu chấm:
//
//   "10. Phong trì (Đ 20) + …"   → CMS giữ "Phong trì (Đ 20) + …"   (danh sách đánh số)
//   "- Theo YHCT:"               → CMS giữ "Theo YHCT:"             (gạch đầu dòng)
//   "> 40 200–239mg/dl"          → CMS giữ "40 200–239mg/dl"        (trích dẫn)
//
// Số thứ tự phác đồ châm cứu KHÔNG phải trang trí — "10." là phác đồ thứ mười.
//
// Ở đây dựng THẲNG Portable Text: mỗi dòng nguồn = một khối, chữ giữ nguyên si.
// Không markdown thì không có gì để nuốt.
//
// Nhập luôn 5 trường bản nhập đầu KHÔNG BIẾT tới (đo bằng cách đếm khoá của 200 bản ghi):
//   ccdt   : _meta 89/100 · chanDoan 8/100 · thamKhao 6/100
//   benhhoc: trieuChung 18/100 · coChe 8/100
// Trường xuất hiện thưa vẫn là trường thật; bỏ chúng là sinh lại thiếu chữ.
//
//   node scripts-di-cu/vá-benh-chinh-xac.mjs --thu
//   node scripts-di-cu/vá-benh-chinh-xac.mjs

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
const khoa = () => `b${++dem}`;
// KHÔNG trim, KHÔNG bỏ dòng rỗng, KHÔNG qua markdown.
const doan = (s) => {
	if (s === null || s === undefined) return null;
	return JSON.stringify(
		String(s)
			.split(/\n/)
			.map((t) => ({
				_type: "block", _key: khoa(), style: "normal", markDefs: [],
				children: [{ _type: "span", _key: khoa(), text: t, marks: [] }],
			})),
	);
};

// Cột chữ (Portable Text) của từng bộ ↔ khoá trong benh.js.
const BO = {
	ccdt: {
		bang: "ec_cham_cuu_tri_benh",
		meta: "ten_khac", // metaLabel của bộ này là "Tên Khác"
		chu: { dai_cuong: "daiCuong", nguyen_nhan: "nguyenNhan", trieu_chung: "trieuChung",
		       chan_doan: "chanDoan", dieu_tri: "dieuTri", tham_khao: "thamKhao" },
	},
	benhhoc: {
		bang: "ec_benh_hoc",
		meta: "doi_chieu_benh_danh", // metaLabel: "Đối Chiếu Bệnh Danh"
		chu: { dai_cuong: "daiCuong", nguyen_nhan: "nguyenNhan", co_che: "coChe",
		       trieu_chung: "trieuChung", chan_doan: "chanDoan", dieu_tri: "dieuTri",
		       benh_an: "benhAn", tham_khao: "thamKhao" },
	},
};

// slug THÔ của tệp vs slug KHỬ TRÙNG mà CMS dùng làm khoá — giống hệt bẫy đã gặp ở
// huyệt vị (Âm Khích / Ẩm Khích cùng "am-khich"). Đếm ra để biết có phải giữ slug_goc.
let soTrung = 0;
for (const k of Object.keys(BO)) {
	const recs = D.BENH[k].records;
	soTrung += recs.filter((r) => r._slug && r._slug !== r.slug).length;
}
console.log(`slug bị khử trùng: ${soTrung} (phải giữ slug_goc nếu > 0)`);

if (chiThu) {
	const r = D.BENH.ccdt.records.find((x) => x.slug === "amidan-viem-cap");
	console.log("\nví dụ ccdt/amidan-viem-cap · dieuTri, 3 dòng quanh chỗ hỏng:");
	for (const l of String(r.dieuTri).split("\n").slice(8, 11)) console.log("   |" + l.slice(0, 64));
	process.exit(0);
}

const env = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const kho = new Client({
	host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
	database: env.PGDATABASE,
	ssl: { ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();

for (const [k, cfg] of Object.entries(BO)) {
	// ma_cu / slug_goc là sổ sách để sinh ngược, KHÔNG phải nội dung biên tập —
	// nên thêm bằng DDL chứ không khai vào lược đồ EmDash.
	await kho.query(`ALTER TABLE ${cfg.bang} ADD COLUMN IF NOT EXISTS ma_cu integer`);
	await kho.query(`ALTER TABLE ${cfg.bang} ADD COLUMN IF NOT EXISTS slug_goc text`);
	await kho.query(`ALTER TABLE ${cfg.bang} DISABLE TRIGGER USER`).catch(() => {});

	const cotChu = Object.keys(cfg.chu);
	const recs = D.BENH[k].records;
	const cot = ["slug", "ma_cu", "slug_goc", cfg.meta, ...cotChu];
	const giaTri = recs.map((r) => [
		r._slug || r.slug,
		r.id ?? null,
		r.slug ?? null,
		r._meta ?? null,
		...cotChu.map((c) => doan(r[cfg.chu[c]])),
	]);

	const dat = cot
		.slice(1)
		.map((c, i) => (cotChu.includes(c) ? `${c} = v.c${i}::json` : c === "ma_cu" ? `${c} = v.c${i}::int` : `${c} = v.c${i}`))
		.join(",\n\t\t\t");
	const unnest = cot.map((_, i) => `unnest($${i + 1}::text[]) AS ${i === 0 ? "slug" : "c" + (i - 1)}`).join(", ");

	const r = await kho.query(
		`UPDATE ${cfg.bang} e SET
			${dat}
		 FROM (SELECT ${unnest}) v
		 WHERE e.slug = v.slug AND e.deleted_at IS NULL`,
		cot.map((_, i) => giaTri.map((g) => (g[i] === null ? null : String(g[i])))),
	);

	await kho.query(`ALTER TABLE ${cfg.bang} ENABLE TRIGGER USER`).catch(() => {});
	console.log(`${k.padEnd(8)} → ${cfg.bang}: gán ${r.rowCount}/${recs.length} bản ghi, ${cotChu.length} trường chữ`);
}

await kho.end();
console.log("\n→ Chạy tiếp: node scripts-di-cu/xuat-benh-js.mjs --kiem");
