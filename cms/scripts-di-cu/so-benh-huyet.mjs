// so-benh-huyet.mjs — Đếm "số bệnh dùng huyệt này" rồi lưu vào CMS.
//
// Bản cũ hiện con số đó thành huy hiệu .acu-nbenh trong danh sách trái ("141 bệnh"),
// và dùng chính nó để sắp "Thường dùng" — là kiểu sắp MẶC ĐỊNH của tab Huyệt Vị.
// Không có số này thì cột trái mất huy hiệu và mất luôn thứ tự mặc định.
//
// Cách đếm CHÉP NGUYÊN thuật toán benhAcuIdsIn của bản cũ: dò tên huyệt trong thân bài
// của Châm Cứu Trị Bệnh + Bệnh Học, khoá GIỮ DẤU (lkey), tên ≥2 âm tiết, ưu tiên cụm
// DÀI nhất và mỗi âm tiết chỉ dùng một lần. Giữ dấu là điều bắt buộc: bỏ dấu thì
// "thận dương" đụng huyệt "Thần Đường".
//
//   node scripts-di-cu/so-benh-huyet.mjs --thu
//   node scripts-di-cu/so-benh-huyet.mjs

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

// lkey của bản cũ: thường-hoá, dời dấu thanh về nguyên âm đầu cụm uy/oa/oe (uỷ↔ủy),
// gộp mọi dấu câu thành khoảng trắng — NHƯNG KHÔNG bỏ dấu thanh.
const lkey = (s) =>
	String(s || "")
		.normalize("NFD")
		.toLowerCase()
		.replace(/([ou])([aey])([̣̀́̃̉])/g, "$1$3$2")
		.normalize("NFC")
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.trim();

// Bản đồ tên huyệt → id. Chỉ nhận tên ≥2 âm tiết: tên một âm tiết đụng từ thường quá nhiều.
const khoaHuyet = new Map();
let maxN = 0;
for (const r of D.ACU.records) {
	const k = lkey(r.ten);
	const n = k ? k.split(" ").length : 0;
	if (n >= 2 && !khoaHuyet.has(k)) {
		khoaHuyet.set(k, r.id);
		if (n > maxN) maxN = n;
	}
}

function huyetTrongBai(text) {
	const phan = String(text || "").split(/([\p{L}\p{N}]+)/u);
	const wi = [];
	for (let i = 0; i < phan.length; i++) if (/[\p{L}\p{N}]/u.test(phan[i])) wi.push(i);
	const tu = wi.map((i) => lkey(phan[i]));
	const dung = new Array(wi.length).fill(false);
	const ids = [];
	for (let a = 0; a < wi.length; a++) {
		if (dung[a]) continue;
		// Ưu tiên cụm DÀI nhất: "Túc Tam Lý" phải thắng "Tam Lý".
		for (let n = Math.min(maxN, wi.length - a); n >= 2; n--) {
			const id = khoaHuyet.get(tu.slice(a, a + n).join(" "));
			if (id != null) {
				ids.push(id);
				for (let k = a; k < a + n; k++) dung[k] = true;
				break;
			}
		}
	}
	return ids;
}

// Quét cả hai bộ bệnh; mỗi huyệt chỉ tính MỘT lần cho mỗi bệnh.
// Giữ cả DANH SÁCH bệnh, không chỉ con số: bản cũ dựng khối "Bệnh Dùng Huyệt Này"
// với chip bấm được, gom theo hai bộ.
const dem = new Map();
const ds_benh = new Map();
let soBai = 0;
for (const key of ["ccdt", "benhhoc"]) {
	const bo = D.BENH[key];
	if (!bo?.records?.length) continue;
	for (const r of bo.records) {
		soBai++;
		const than = bo.fields.map(([k]) => r[k] || "");
		const ids = new Set();
		for (const b of than) if (b) for (const id of huyetTrongBai(String(b))) ids.add(id);
		for (const id of ids) {
			dem.set(id, (dem.get(id) || 0) + 1);
			if (!ds_benh.has(id)) ds_benh.set(id, []);
			ds_benh.get(id).push({ bo: key, slug: r._slug || r.slug, ten: r.ten });
		}
	}
}

const slugTheoId = new Map(D.ACU.records.map((r) => [r.id, r._slug || r.slug]));
const cap = [...dem.entries()]
	.map(([id, n]) => [slugTheoId.get(id), n, JSON.stringify(ds_benh.get(id) || [])])
	.filter(([s]) => s);

console.log(`Quét ${soBai} bài bệnh · ${cap.length}/${D.ACU.records.length} huyệt được nhắc tới`);

if (chiThu) {
	const top = [...dem.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 8)
		.map(([id, n]) => `${D.ACU.records.find((r) => r.id === id)?.ten} ${n}`);
	console.log("  nhiều nhất:", top.join(" · "));
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
	`UPDATE ec_huyet_vi e SET so_benh = v.n::int, benh_dung = v.ds::json
	 FROM (SELECT unnest($1::text[]) AS slug, unnest($2::int[]) AS n, unnest($3::text[]) AS ds) v
	 WHERE e.slug = v.slug AND e.deleted_at IS NULL`,
	[cap.map((x) => x[0]), cap.map((x) => x[1]), cap.map((x) => x[2])],
);
await kho.query("ALTER TABLE ec_huyet_vi ENABLE TRIGGER USER").catch(() => {});
console.log(`Gán ${r.rowCount} huyệt.`);
await kho.end();
