// vá-duoc-lieu-chinh-xac.mjs — Nhập LẠI 10 trường văn xuôi của dược liệu cho ĐÚNG TỪNG
// KÝ TỰ, lấy bảng `vi_thuoc` của DB app làm bản gốc.
//
// VÌ SAO CẦN: sắp đồng bộ MỘT CHIỀU CMS → DB app. Muốn đồng bộ an toàn thì phải có một
// tính chất: *khi chưa ai sửa gì trong CMS, phép đồng bộ phải ra ĐÚNG 0 ô thay đổi*.
// Có thế thì mỗi ô lệch về sau mới đọc được là "người biên tập đã sửa", chứ không phải
// "lỗi chuyển đổi". Không có tính chất đó thì `--thu` in ra hàng trăm dòng rác và người
// dùng sẽ bấm qua mà không đọc — lúc đó chế độ thử thành vô nghĩa.
//
// Đo được 57 ô lệch, và CHỈ lệch ở khoảng trắng: bản nhập đầu gọi .trim() từng dòng nên
// cắt mất dấu cách cuối dòng (vd vị 381, tham_khao, ký tự 2768: app có " \n", CMS có "\n").
// Không có ô nào hỏng markdown — khác hai bộ bệnh.
//
// KHÔNG vá cột ten_khac. Bản nhập đầu GỘP `vi_thuoc.ten_khac` (văn xuôi kèm nguồn) với
// các dòng của bảng `vi_thuoc_ten_goi_khac` vào một cột (di-cu-duoc-lieu.mjs:120). Tách
// ngược không an toàn, nên `ten_khac` bị loại khỏi phép đồng bộ — xem dong-bo-app.mjs.
//
//   node scripts-di-cu/vá-duoc-lieu-chinh-xac.mjs --thu
//   node scripts-di-cu/vá-duoc-lieu-chinh-xac.mjs

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

// [cột CMS, cột app]
const TRUONG = [
	["xuat_xu", "xuat_xu"], ["mo_ta", "mo_ta"], ["duoc_ly", "duoc_ly"],
	["tinh_vi_quy_kinh", "tinh_vi_quy_kinh"], ["nuoi_duong", "nuoi_duong"],
	["bao_che", "bao_che"], ["don_thuoc", "don_thuoc"], ["chu_tri", "chu_tri"],
	["tham_khao", "tham_khao"], ["thanh_phan_hoa_hoc", "thanh_phan"],
];

let dem = 0;
const khoa = () => `b${++dem}`;
// KHÔNG trim, KHÔNG bỏ dòng rỗng — đó chính là chỗ bản nhập đầu làm mất chữ.
const doan = (s) => {
	if (s === null || s === undefined || s === "") return null;
	return JSON.stringify(
		String(s).split(/\n/).map((t) => ({
			_type: "block", _key: khoa(), style: "normal", markDefs: [],
			children: [{ _type: "span", _key: khoa(), text: t, marks: [] }],
		})),
	);
};

const envA = parseEnv(readFileSync(resolve(goc, "backend/.env"), "utf8"));
const app = new Client({
	host: envA.DB_HOST, port: +envA.DB_PORT, user: envA.DB_USER, password: envA.DB_PASSWORD,
	database: envA.DB_NAME, ssl: { ca: envA.CA_CERTIFICATE, rejectUnauthorized: true },
});
await app.connect();
const rows = (await app.query(`SELECT id, ${TRUONG.map((x) => x[1]).join(", ")} FROM vi_thuoc`)).rows;
await app.end();

const hang = rows.map((r) => ({
	slug: String(r.id), // slug của ec_duoc_lieu LÀ id số của vi_thuoc
	...Object.fromEntries(TRUONG.map(([cc, ca]) => [cc, doan(r[ca])])),
}));

console.log(`Dược liệu: ${hang.length} vị · ${TRUONG.length} trường văn xuôi (KHÔNG gồm ten_khac)`);
if (chiThu) {
	const x = hang.find((h) => h.slug === "381") || hang[0];
	console.log(`  ví dụ vị ${x.slug}: tham_khao ${x.tham_khao ? x.tham_khao.length + " ký tự JSON" : "rỗng"}`);
	process.exit(0);
}

const envC = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const kho = new Client({
	host: envC.PGHOST, port: +envC.PGPORT, user: envC.PGUSER, password: envC.PGPASSWORD,
	database: envC.PGDATABASE,
	ssl: { ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();
await kho.query("ALTER TABLE ec_duoc_lieu DISABLE TRIGGER USER").catch(() => {});

const cot = ["slug", ...TRUONG.map((x) => x[0])];
const dat = cot.slice(1).map((c, i) => `${c} = v.c${i}::json`).join(",\n\t\t");
const unnest = cot.map((_, i) => `unnest($${i + 1}::text[]) AS ${i === 0 ? "slug" : "c" + (i - 1)}`).join(", ");
const r = await kho.query(
	`UPDATE ec_duoc_lieu e SET
		${dat}
	 FROM (SELECT ${unnest}) v
	 WHERE e.slug = v.slug AND e.deleted_at IS NULL`,
	cot.map((c) => hang.map((h) => (h[c] === null || h[c] === undefined ? null : String(h[c])))),
);

await kho.query("ALTER TABLE ec_duoc_lieu ENABLE TRIGGER USER").catch(() => {});
console.log(`Gán ${r.rowCount}/${hang.length} vị.`);
console.log("→ Chạy tiếp: node scripts-di-cu/dong-bo-app.mjs --thu");
await kho.end();
