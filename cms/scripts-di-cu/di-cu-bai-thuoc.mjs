// di-cu-bai-thuoc.mjs — Chép 13.942 bài thuốc (phuong_thang) từ DB chính sang CMS.
//
// URL bản tĩnh là /bai-thuoc/<slug CHỮ>/ — đã kiểm trên site thật: /bai-thuoc/ta-can-thang/
// ra đúng "Tả Can Thang — bài thuốc Đông Y", còn /bai-thuoc/1/ chỉ ra vỏ SPA. (Khác dược
// liệu, vốn dùng ID số.) Nên giữ nguyên cột slug.
//
//   node scripts-di-cu/di-cu-bai-thuoc.mjs --thu
//   node scripts-di-cu/di-cu-bai-thuoc.mjs

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

const ca = readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8");
const be = parseEnv(readFileSync(resolve(goc, "backend/.env"), "utf8"));
const cms = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));

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

// ── Cổng chặn nội dung mỏng — CHÉP NGUYÊN từ build-phuong.mjs ──────────
// Đổi mấy con số này là đổi luôn tập bài thuốc mời Google vào, nên phải giữ khớp.
const MIN_CHU_HIEN = 250;
const MIN_SO_VI = 3;
const chuoi = (v) => (v == null ? "" : String(v)).trim();
const dsVi = (b) => (Array.isArray(b.thanh_phan) ? b.thanh_phan : []);
const soVi = (b) => dsVi(b).filter((t) => chuoi(t.ten)).length;
const chuNhinThay = (b) =>
	(chuoi(b.tac_dung) + " " + chuoi(b.cach_dung) + " " + chuoi(b.ghi_chu) + " " +
		dsVi(b).map((t) => chuoi(t.ten) + " " + chuoi(t.lieu)).join(" "))
		.replace(/\s+/g, " ").trim();
const duDay = (b) =>
	soVi(b) >= MIN_SO_VI && chuoi(b.tac_dung).length > 0 && chuNhinThay(b).length >= MIN_CHU_HIEN;

const app = new Client({
	host: be.DB_HOST, port: +be.DB_PORT, user: be.DB_USER, password: be.DB_PASSWORD,
	database: be.DB_NAME, ssl: { ca, rejectUnauthorized: true },
});
await app.connect();
const rows = (await app.query(
	`SELECT id, ten, slug, xuat_xu, tac_gia, thanh_phan, cach_dung, tac_dung, ghi_chu
	 FROM phuong_thang ORDER BY id`)).rows;
await app.end();

const day = rows.filter(duDay).length;
console.log(`Bài thuốc trong DB chính: ${rows.length} · đủ dày để lên chỉ mục: ${day}`);

if (chiThu) {
	const thieuSlug = rows.filter((r) => !chuoi(r.slug)).length;
	const trung = rows.length - new Set(rows.map((r) => r.slug)).size;
	console.log(`  thiếu slug: ${thieuSlug} · slug trùng: ${trung}`);
	console.log("\n3 mục đầu:");
	for (const r of rows.slice(0, 3)) {
		console.log(`  /bai-thuoc/${String(r.slug).padEnd(28)} ${String(r.ten).padEnd(24)} ${soVi(r)} vị · ${chuNhinThay(r).length} ký tự · ${duDay(r) ? "chỉ mục" : "ẩn"}`);
	}
	process.exit(0);
}

const ABC = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const ulid = () => { let s = ""; for (let i = 0; i < 26; i++) s += ABC[Math.floor(Math.random() * 32)]; return s; };

const kho = new Client({
	host: cms.PGHOST, port: +cms.PGPORT, user: cms.PGUSER, password: cms.PGPASSWORD,
	database: cms.PGDATABASE, ssl: { ca, rejectUnauthorized: true },
});
await kho.connect();

// 13.942 hàng × một lượt trigger mỗi hàng là quá tốn. Tắt trigger, nhập xong dựng chỉ
// mục một lượt bằng td_dung_lai().
await kho.query("ALTER TABLE ec_bai_thuoc DISABLE TRIGGER USER").catch(() => {});

const daCo = new Set((await kho.query("SELECT slug FROM ec_bai_thuoc")).rows.map((r) => r.slug));
let them = 0, bo = 0;

// Gộp nhiều hàng vào một câu lệnh — 13.942 lần đi về mạng riêng lẻ là phần chậm nhất.
const LO = 200;
let lo = [];
const xaLo = async () => {
	if (!lo.length) return;
	const cot = 15;
	const cho = lo.map((_, i) =>
		`($${i * cot + 1},$${i * cot + 2},'published',now(),now(),now(),1,'en',$${i * cot + 1},` +
		Array.from({ length: cot - 2 }, (_, j) => `$${i * cot + 3 + j}`).join(",") + ")").join(",");
	await kho.query(
		`INSERT INTO ec_bai_thuoc
			(id, slug, status, created_at, updated_at, published_at, version, locale, translation_group,
			 title, xuat_xu, tac_gia, thanh_phan, cach_dung, tac_dung, ghi_chu, cho_index,
			 author_id, primary_byline_id, live_revision_id, draft_revision_id, scheduled_at)
		 VALUES ${cho}`,
		lo.flat(),
	);
	them += lo.length;
	lo = [];
	if (them % 2000 < LO) console.log(`  …${them}/${rows.length}`);
};

for (const r of rows) {
	const slug = chuoi(r.slug);
	if (!slug || daCo.has(slug)) { bo++; continue; }
	daCo.add(slug);
	const cd = doan(r.cach_dung), td = doan(r.tac_dung), gc = doan(r.ghi_chu);
	lo.push([
		ulid(), slug, r.ten, r.xuat_xu, r.tac_gia,
		r.thanh_phan ? JSON.stringify(r.thanh_phan) : null,
		cd ? JSON.stringify(cd) : null, td ? JSON.stringify(td) : null, gc ? JSON.stringify(gc) : null,
		duDay(r) ? 1 : 0,
		null, null, null, null, null,
	]);
	if (lo.length >= LO) await xaLo();
}
await xaLo();

await kho.query("ALTER TABLE ec_bai_thuoc ENABLE TRIGGER USER").catch(() => {});
const tong = await kho.query("SELECT count(*)::int n FROM ec_bai_thuoc WHERE deleted_at IS NULL");
const chiMuc = await kho.query("SELECT count(*)::int n FROM ec_bai_thuoc WHERE cho_index = 1 AND deleted_at IS NULL");
console.log(`\nThêm ${them} bài thuốc${bo ? `, bỏ ${bo} (trùng hoặc thiếu slug)` : ""}. Tổng trong CMS: ${tong.rows[0].n}`);
console.log(`Cho lên chỉ mục: ${chiMuc.rows[0].n}`);
console.log("→ Chạy tiếp: node scripts-di-cu/dung-chi-muc.mjs bai_thuoc");
await kho.end();
