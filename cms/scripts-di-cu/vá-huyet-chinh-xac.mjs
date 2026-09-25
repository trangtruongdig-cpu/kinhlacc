// vá-huyet-chinh-xac.mjs — Nhập LẠI 8 trường mục cho ĐÚNG TỪNG KÝ TỰ, và lưu slug gốc.
//
// Bản nhập đầu gọi .trim() trên từng dòng → cắt mất dấu cách đầu dòng ở 13 huyệt.
// Khoảng trắng thôi, nhưng mục tiêu là sinh lại acupoints.js từ CMS mà không lệch một
// ký tự — lệch ký tự là dấu hiệu bản nhập đánh rơi thứ gì đó, không thể bỏ qua.
//
// Cũng lưu slug_goc: tệp giữ slug THÔ (Âm Khích và Ẩm Khích cùng "am-khich"), còn CMS
// lấy bản KHỬ TRÙNG làm khoá. Không giữ slug thô thì sinh lại sẽ đổi 15 huyệt.
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const goc = resolve(here, "../..");
const require = createRequire(import.meta.url);
const { Client } = require("pg");

const D = await import(resolve(goc, "frontend/scripts/dict-data.mjs"));

let dem = 0;
const khoa = () => `k${++dem}`;
// KHÔNG trim, KHÔNG bỏ dòng rỗng: 3 huyệt có dòng trống GIỮA thân bài ("\n\n") và
// 1 huyệt có mục thân rỗng hoàn toàn. Lọc chúng đi là sinh lại không khớp tệp gốc.
const doan = (s) => {
	if (s === null || s === undefined) return null;
	const ds = String(s).split(/\n/);
	return ds.map((t) => ({
				_type: "block", _key: khoa(), style: "normal", markDefs: [],
				children: [{ _type: "span", _key: khoa(), text: t, marks: [] }],
	}));
};

const MUC = {
	"TÊN HUYỆT": "y_nghia_ten", "ĐẶC TÍNH": "dac_tinh", "VỊ TRÍ": "vi_tri",
	"GIẢI PHẪU": "giai_phau", "TÁC DỤNG": "tac_dung", "CHỦ TRỊ": "chu_tri",
	"CHÂM CỨU": "cham_cuu", "XUẤT XỨ": "xuat_xu",
};
const COT = Object.values(MUC);

const env = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const kho = new Client({
	host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
	database: env.PGDATABASE,
	ssl: { ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();
await kho.query("ALTER TABLE ec_huyet_vi DISABLE TRIGGER USER").catch(() => {});

let n = 0;
for (const r of D.ACU.records) {
	const slug = r._slug || r.slug;
	if (!slug) continue;
	const phan = {};
	let tenKhac = null;
	for (const s of r.sections || []) {
		if (s.h === "TÊN KHÁC") { tenKhac = s.body; continue; }
		const cot = MUC[s.h];
		if (cot) phan[cot] = doan(s.body);
	}
	await kho.query(
		`UPDATE ec_huyet_vi SET slug_goc = $2, ten_khac = $3, ${COT.map((c, i) => `${c} = $${4 + i}`).join(", ")}
		 WHERE slug = $1 AND deleted_at IS NULL`,
		[slug, r.slug, tenKhac, ...COT.map((c) => (phan[c] ? JSON.stringify(phan[c]) : null))],
	);
	n++;
}

await kho.query("ALTER TABLE ec_huyet_vi ENABLE TRIGGER USER").catch(() => {});
console.log(`Vá ${n} huyệt (giữ nguyên dấu cách đầu dòng + lưu slug gốc).`);
await kho.end();
