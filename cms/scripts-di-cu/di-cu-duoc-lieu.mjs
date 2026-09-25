// di-cu-duoc-lieu.mjs — Chép 1.045 vị thuốc từ DB chính sang CMS.
//
// Nguồn nằm ở database khác (defaultdb của app), CMS ở kinhlac_cms — role cms_kinhlac
// KHÔNG đọc được defaultdb, nên phải mở HAI kết nối chứ không JOIN được.
//
// ⚠️ URL của bản tĩnh là /duoc-lieu/<ID SỐ>/, KHÔNG phải slug chữ. Đã kiểm trên site
// thật: /duoc-lieu/1/ ra "Ma Hoàng — Vị thuốc Đông Y", còn /duoc-lieu/ma-hoang/ chỉ ra
// vỏ SPA. (Mã trả 200 ở cả hai vì SPA nhận mọi đường — đừng tin mã trả về, phải xem
// <title>.) Nên slug trong CMS ĐẶT BẰNG ID để địa chỉ cũ không đổi.
//
//   node scripts-di-cu/di-cu-duoc-lieu.mjs --thu
//   node scripts-di-cu/di-cu-duoc-lieu.mjs

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
const slugHoa = (s) =>
	String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
		.replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

const app = new Client({
	host: be.DB_HOST, port: +be.DB_PORT, user: be.DB_USER, password: be.DB_PASSWORD,
	database: be.DB_NAME, ssl: { ca, rejectUnauthorized: true },
});
await app.connect();

const rows = (await app.query(`
	SELECT id, ten_vi_thuoc, tinh, vi, quy_kinh, lieu_dung, ten_khoa_hoc, ten_han, ten_pinyin,
	       bo_phan_dung, xuat_xu, ho_khoa_hoc, ten_khac, mo_ta, thanh_phan, duoc_ly,
	       tinh_vi_quy_kinh, nuoi_duong, bao_che, don_thuoc, chu_tri, tham_khao,
	       anh_dai_dien, cong_dung_tom_tat
	FROM vi_thuoc ORDER BY id`)).rows;

// Bảng phụ: gom về từng vị thuốc.
const gomPhu = async (sql) => {
	const m = new Map();
	for (const r of (await app.query(sql)).rows) {
		if (!m.has(r.id_vi_thuoc)) m.set(r.id_vi_thuoc, []);
		m.get(r.id_vi_thuoc).push(r.ten);
	}
	return m;
};
const congDung = await gomPhu(
	`SELECT vtc.id_vi_thuoc, cd.ten_cong_dung AS ten FROM vi_thuoc_cong_dung vtc
	 JOIN cong_dung cd ON cd.id = vtc.id_cong_dung`);
const kiengKy = await gomPhu(
	`SELECT vtk.id_vi_thuoc, kk.ten_kieng_ky AS ten FROM vi_thuoc_kieng_ky vtk
	 JOIN kieng_ky kk ON kk.id = vtk.id_kieng_ky`);
const tenGoiKhac = await gomPhu(
	`SELECT id_vi_thuoc, ten_goi_khac AS ten FROM vi_thuoc_ten_goi_khac`);
await app.end();

console.log(`Vị thuốc trong DB chính: ${rows.length}`);

if (chiThu) {
	const coMoTa = rows.filter((r) => String(r.mo_ta || "").trim()).length;
	console.log(`  có mô tả: ${coMoTa} · có công dụng (bảng phụ): ${congDung.size} · có tên gọi khác: ${tenGoiKhac.size}`);
	console.log("\n3 mục đầu:");
	for (const r of rows.slice(0, 3)) {
		console.log(`  /duoc-lieu/${String(r.id).padEnd(6)} ${String(r.ten_vi_thuoc).padEnd(24)} ${r.tinh || "—"}/${r.vi || "—"} · ${(congDung.get(r.id) || []).length} công dụng`);
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

// Trigger chỉ mục chạy cho TỪNG hàng; với hàng nghìn hàng thì tắt đi rồi dựng lại một
// lượt bằng td_dung_lai() nhanh hơn hẳn.
await kho.query("ALTER TABLE ec_duoc_lieu DISABLE TRIGGER USER").catch(() => {});

const daCo = new Set((await kho.query("SELECT slug FROM ec_duoc_lieu")).rows.map((r) => r.slug));
// Cùng phép chặn với build-duoc-lieu.mjs: vị nào chưa có chữ nào trong 9 trường văn
// xuôi thì KHÔNG cho lên chỉ mục. Vẫn sửa được trong CMS, chỉ là chưa mời Google vào.
const VAN_XUOI = ["mo_ta", "thanh_phan", "duoc_ly", "tinh_vi_quy_kinh", "nuoi_duong",
                  "bao_che", "don_thuoc", "chu_tri", "tham_khao"];
const daBienSoan = (v) => VAN_XUOI.some((f) => String(v[f] ?? "").trim().length > 0);

const VAN = [
	["mo_ta", "mo_ta"], ["thanh_phan", "thanh_phan_hoa_hoc"], ["duoc_ly", "duoc_ly"],
	["tinh_vi_quy_kinh", "tinh_vi_quy_kinh"], ["nuoi_duong", "nuoi_duong"], ["bao_che", "bao_che"],
	["chu_tri", "chu_tri"], ["don_thuoc", "don_thuoc"], ["xuat_xu", "xuat_xu"], ["tham_khao", "tham_khao"],
];

let them = 0, bo = 0;
for (const r of rows) {
	const slug = String(r.id);
	if (!slug || daCo.has(slug)) { bo++; continue; }
	daCo.add(slug);

	const khac = [r.ten_khac, ...(tenGoiKhac.get(r.id) || [])]
		.map((x) => String(x || "").trim()).filter(Boolean);

	await kho.query(
		`INSERT INTO ec_duoc_lieu
			(id, slug, status, created_at, updated_at, published_at, version, locale, translation_group,
			 title, ten_khac, ten_khoa_hoc, ten_han, ten_pinyin, ho_khoa_hoc, bo_phan_dung,
			 tinh, vi, quy_kinh, lieu_dung, cong_dung_tom_tat, cong_dung_ds, kieng_ky_ds,
			 anh_dai_dien, cho_index, ${VAN.map(([, c]) => c).join(", ")})
		 VALUES ($1,$2,'published',now(),now(),now(),1,'en',$1,
			 $3,$4,$5,$6,$7,$8,$9,
			 $10,$11,$12,$13,$14,$15,$16,
			 $17,$18, ${VAN.map((_, i) => `$${19 + i}`).join(", ")})`,
		[
			ulid(), slug,
			r.ten_vi_thuoc, khac.join("; ") || null, r.ten_khoa_hoc, r.ten_han, r.ten_pinyin,
			r.ho_khoa_hoc, r.bo_phan_dung,
			r.tinh, r.vi, r.quy_kinh, r.lieu_dung, r.cong_dung_tom_tat,
			(congDung.get(r.id) || []).join("; ") || null,
			(kiengKy.get(r.id) || []).join("; ") || null,
			r.anh_dai_dien, daBienSoan(r) ? 1 : 0,
			...VAN.map(([k]) => { const b = doan(r[k]); return b ? JSON.stringify(b) : null; }),
		],
	);
	them++;
	if (them % 200 === 0) console.log(`  …${them}/${rows.length}`);
}

await kho.query("ALTER TABLE ec_duoc_lieu ENABLE TRIGGER USER").catch(() => {});
const tong = await kho.query("SELECT count(*)::int n FROM ec_duoc_lieu WHERE deleted_at IS NULL");
const chiMuc = await kho.query("SELECT count(*)::int n FROM ec_duoc_lieu WHERE cho_index = 1 AND deleted_at IS NULL");
console.log(`\nThêm ${them} vị thuốc${bo ? `, bỏ ${bo} (trùng slug)` : ""}. Tổng trong CMS: ${tong.rows[0].n}`);
console.log(`Cho lên chỉ mục: ${chiMuc.rows[0].n} (số còn lại chưa có phần văn xuôi).`);
console.log("→ Chạy tiếp: node scripts-di-cu/dung-chi-muc.mjs duoc_lieu");
await kho.end();
