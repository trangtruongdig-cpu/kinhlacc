// dong-bo-lien-ket.mjs — Đồng bộ hai trường DANH SÁCH của dược liệu (công dụng, kiêng kỵ)
// từ CMS sang các bảng NỐI của app.
//
// Vì sao tách khỏi dong-bo-app.mjs: app không lưu chúng thành chữ mà lưu bằng KHOÁ NGOẠI
// tới bảng tra cứu dùng chung (`cong_dung` 1.243 mục, `kieng_ky` 1.397 mục).
//
// ⚠️ NGUYÊN TẮC CỐT LÕI: CHỈ KHỚP TỪ VỰNG CÓ SẴN, TUYỆT ĐỐI KHÔNG TỰ TẠO MỤC TRA CỨU MỚI.
// Lý do không phải sự cẩn thận suông — đo được:
//   · `chu_tri` (3.588 mục) dùng chung với CẢ `huyet_vi` và `nhom_nho_chu_tri`. Một lỗi gõ
//     sinh ra mục mới là làm bẩn luôn phần huyệt vị, rất khó lần ngược.
//   · `kinh_mach` là TẬP ĐÓNG 18 dòng (12 kinh + 8 mạch... thực 18). Thêm dòng là sai hiển nhiên.
// Từ nào không khớp thì BÁO RA và KHÔNG ghi, để người biên tập chọn lại hoặc xin thêm từ vựng.
// Đây là từ vựng có kiểm soát, không phải chữ tự do.
//
// ⚠️ DẤU TÁCH LÀ XUỐNG DÒNG, KHÔNG PHẢI `;`. Bản nhập đầu gộp bằng `; ` và điều đó MẤT DỮ
// LIỆU: đo được 1 mục kiêng kỵ chứa chính dấu `;` (vị 1004), tách ngược ra thành hai mục.
// Đã kiểm cả ba bảng tra cứu: KHÔNG mục nào chứa xuống dòng (cong_dung 0, kieng_ky 0,
// chu_tri 0), nên xuống dòng là dấu tách an toàn.
//
// `ghi_chu` của bảng nối rỗng ở CẢ 4.040 dòng nên thay dòng không mất gì. Nếu sau này có
// dữ liệu ở đó thì PHẢI sửa cách ghi (đang xoá-rồi-chèn).
//
//   node scripts-di-cu/dong-bo-lien-ket.mjs --nap-lai   # nạp lại cột CMS từ app, tách bằng xuống dòng
//   node scripts-di-cu/dong-bo-lien-ket.mjs             # chạy thử
//   node scripts-di-cu/dong-bo-lien-ket.mjs --ghi       # ghi thật

import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const goc = resolve(here, "../..");
const require = createRequire(import.meta.url);
const { Client } = require("pg");
const napLai = process.argv.includes("--nap-lai");
const seGhi = process.argv.includes("--ghi");
const TRAN_VI = 200; // số vị được đổi trong một lượt

const BO = [
	{ cot: "cong_dung_ds", noi: "vi_thuoc_cong_dung", fk: "id_cong_dung", tra: "cong_dung", ten: "ten_cong_dung", nhan: "Công dụng" },
	{ cot: "kieng_ky_ds", noi: "vi_thuoc_kieng_ky", fk: "id_kieng_ky", tra: "kieng_ky", ten: "ten_kieng_ky", nhan: "Kiêng kỵ" },
];

const envC = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const envA = parseEnv(readFileSync(resolve(goc, "backend/.env"), "utf8"));
const cms = new Client({
	host: envC.PGHOST, port: +envC.PGPORT, user: envC.PGUSER, password: envC.PGPASSWORD,
	database: envC.PGDATABASE,
	ssl: { ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
const app = new Client({
	host: envA.DB_HOST, port: +envA.DB_PORT, user: envA.DB_USER, password: envA.DB_PASSWORD,
	database: envA.DB_NAME, ssl: { ca: envA.CA_CERTIFICATE, rejectUnauthorized: true },
});
await cms.connect();
await app.connect();

// Danh sách của một vị, đọc từ app, sắp theo tên cho ổn định.
async function dsTheoVi(bo) {
	const r = await app.query(
		`SELECT n.id_vi_thuoc AS vi, t.${bo.ten} AS ten FROM ${bo.noi} n
		 JOIN ${bo.tra} t ON t.id = n.${bo.fk} ORDER BY n.id_vi_thuoc, t.${bo.ten}`,
	);
	const m = new Map();
	for (const x of r.rows) {
		const k = String(x.vi);
		if (!m.has(k)) m.set(k, []);
		m.get(k).push(String(x.ten));
	}
	return m;
}

if (napLai) {
	for (const bo of BO) {
		const m = await dsTheoVi(bo);
		const slug = [...m.keys()];
		const gt = slug.map((s) => m.get(s).join("\n"));
		await cms.query(`ALTER TABLE ec_duoc_lieu DISABLE TRIGGER USER`).catch(() => {});
		const r = await cms.query(
			`UPDATE ec_duoc_lieu e SET ${bo.cot} = v.g
			 FROM (SELECT unnest($1::text[]) AS slug, unnest($2::text[]) AS g) v
			 WHERE e.slug = v.slug AND e.deleted_at IS NULL`,
			[slug, gt],
		);
		await cms.query(`ALTER TABLE ec_duoc_lieu ENABLE TRIGGER USER`).catch(() => {});
		console.log(`${bo.nhan}: nạp lại ${r.rowCount} vị (tách bằng xuống dòng).`);
	}
	console.log("→ Chạy tiếp: node scripts-di-cu/dung-chi-muc.mjs duoc_lieu   (chỉ mục đọc hai cột này)");
	await cms.end(); await app.end();
	process.exit(0);
}

let tongDoi = 0, tongKhongKhop = 0;
const viecGhi = [];

for (const bo of BO) {
	// Từ vựng: tên → id. Khoá so sánh là tên đã cắt khoảng trắng hai đầu, KHÔNG bỏ dấu —
	// bỏ dấu là mở đường cho hai mục khác nghĩa gộp thành một.
	const tv = new Map();
	for (const x of (await app.query(`SELECT id, ${bo.ten} AS ten FROM ${bo.tra}`)).rows) {
		const k = String(x.ten).trim();
		if (!tv.has(k)) tv.set(k, x.id);
	}
	const hienTai = await dsTheoVi(bo);
	const c = await cms.query(
		`SELECT slug, ${bo.cot} AS ds FROM ec_duoc_lieu WHERE deleted_at IS NULL AND status = 'published'`,
	);

	const capNhat = [];
	const khongKhop = new Map();
	for (const x of c.rows) {
		// CHỈ tách bằng xuống dòng. Từng nhận cả `;` cho "tương thích bản cũ" — và chính
		// điều đó TÁI TẠO đúng lỗi vừa sửa: mục kiêng kỵ của vị 1004 chứa dấu `;` bị chẻ
		// làm hai rồi cả hai nửa thành "từ lạ". Muốn dùng dữ liệu cũ thì chạy --nap-lai.
		const muon = String(x.ds || "").split(/\n/).map((s) => s.trim()).filter(Boolean);
		const dangCo = (hienTai.get(x.slug) || []).map((s) => s.trim());
		const ids = [];
		let hong = false;
		for (const t of muon) {
			const id = tv.get(t);
			if (id === undefined) {
				hong = true;
				khongKhop.set(t, (khongKhop.get(t) || 0) + 1);
			} else ids.push(id);
		}
		if (hong) continue; // vị nào có từ lạ thì BỎ QUA CẢ VỊ, không ghi một nửa
		if (JSON.stringify([...muon].sort()) === JSON.stringify([...dangCo].sort())) continue;
		capNhat.push([x.slug, ids, dangCo.length, muon.length]);
	}

	console.log(`\n▸ ${bo.nhan}: ${c.rows.length} vị · sẽ đổi ${capNhat.length} · từ vựng ${tv.size} mục`);
	for (const [s, , cu, moi] of capNhat.slice(0, 5)) console.log(`   vị ${s}: ${cu} → ${moi} mục`);
	if (capNhat.length > 5) console.log(`   … và ${capNhat.length - 5} vị nữa`);
	if (khongKhop.size) {
		console.log(`   ✗ ${khongKhop.size} từ KHÔNG có trong từ vựng — vị chứa chúng bị BỎ QUA CẢ VỊ:`);
		for (const [t, n] of [...khongKhop.entries()].slice(0, 6)) console.log(`      ×${n}  ${JSON.stringify(t.slice(0, 70))}`);
		if (khongKhop.size > 6) console.log(`      … và ${khongKhop.size - 6} từ nữa`);
		console.log("      → chọn lại từ có sẵn, hoặc thêm vào bảng tra cứu TRƯỚC rồi chạy lại.");
	}
	tongDoi += capNhat.length;
	tongKhongKhop += khongKhop.size;
	if (capNhat.length) viecGhi.push([bo, capNhat]);
}

console.log(`\nTổng: ${tongDoi} vị sẽ đổi · ${tongKhongKhop} từ lạ bị chặn.`);
if (!seGhi) {
	console.log(tongDoi ? "Chạy lại với --ghi để áp." : "Không có gì để ghi.");
	await cms.end(); await app.end();
	process.exit(0);
}
if (tongDoi > TRAN_VI) {
	console.error(`\n✗ DỪNG: ${tongDoi} vị vượt trần ${TRAN_VI}. Thường là dấu hiệu đọc nhầm cột hoặc sai dấu tách.`);
	await cms.end(); await app.end();
	process.exit(1);
}

try {
	await app.query("BEGIN");
	for (const [bo, capNhat] of viecGhi) {
		for (const [slug, ids] of capNhat) {
			await app.query(`DELETE FROM ${bo.noi} WHERE id_vi_thuoc = $1`, [Number(slug)]);
			for (const id of ids) {
				await app.query(`INSERT INTO ${bo.noi} (id_vi_thuoc, ${bo.fk}) VALUES ($1, $2)`, [Number(slug), id]);
			}
		}
	}
	await app.query("COMMIT");
} catch (e) {
	await app.query("ROLLBACK").catch(() => {});
	console.error(`\n✗ Lỗi khi ghi (${e.message}) — đã HOÀN TÁC, DB app không đổi gì.`);
	await cms.end(); await app.end();
	process.exit(1);
}
console.log(`\n✓ Đã ghi ${tongDoi} vị.`);
await cms.end();
await app.end();
