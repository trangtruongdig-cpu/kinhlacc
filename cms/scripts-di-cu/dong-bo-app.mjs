// dong-bo-app.mjs — Đồng bộ MỘT CHIỀU: CMS → bảng của app (`vi_thuoc`, `phuong_thang`).
//
// Dược liệu và bài thuốc KHÔNG đi qua tệp tĩnh như huyệt vị / bệnh / kinh mạch — chúng
// nằm thẳng trong DB app, cả builder lẫn API đều đọc trực tiếp. Nên không có "tệp để
// sinh lại"; muốn CMS quản được thì phải ĐẨY sang.
//
// ⚠️ ĐÂY LÀ TỆP DUY NHẤT TRONG cms/ GHI VÀO DB CỦA PHÒNG CHẨN TRỊ. Vì vậy:
//   · CHẠY THỬ LÀ MẶC ĐỊNH. Phải gõ --ghi mới thật sự ghi.
//   · Ghi trong MỘT giao dịch: hỏng giữa chừng thì không để lại nửa vời.
//   · Có TRẦN AN TOÀN. Một lỗi đọc nhầm cột sẽ làm cả nghìn ô "đổi" cùng lúc; trần
//     chặn lại thay vì xoá sạch từ điển rồi mới phát hiện.
//
// TÍNH CHẤT NỀN MÓNG: khi chưa ai sửa gì trong CMS, phép đồng bộ phải ra ĐÚNG 0 ô.
// Đã dựng được tính chất đó (xem vá-duoc-lieu-chinh-xac.mjs — vá 57 ô lệch khoảng
// trắng). Nhờ vậy mỗi ô hiện ra trong --thu đọc được là "người biên tập đã sửa", chứ
// không phải "lỗi chuyển đổi". Mất tính chất này thì chế độ thử in ra hàng trăm dòng
// rác và người dùng sẽ bấm qua mà không đọc.
//
// KHÔNG ĐỒNG BỘ, và vì sao:
//   · ten_khac (dược liệu) — bản nhập GỘP cột `vi_thuoc.ten_khac` với bảng
//     `vi_thuoc_ten_goi_khac` vào một cột CMS. Ghi ngược là app hiện tên khác HAI LẦN.
//   · cong_dung_ds, kieng_ky_ds, chu_tri (danh sách), kinh_mach — app lưu bằng KHOÁ
//     NGOẠI tới bảng tra cứu dùng chung (id_cong_dung…), không phải chữ tự do. Ghi
//     ngược từ chuỗi sẽ phải tự tạo mục tra cứu mới mỗi khi có lỗi gõ, làm bẩn bảng
//     dùng chung mà rất khó lần ngược.
//   · so_bai_thuoc, so_benh — số ĐẾM ĐƯỢC, không phải nội dung biên tập.
//   · slug, id — khoá.
//   Sửa những trường đó trong CMS sẽ KHÔNG tới app. Đây là giới hạn đã biết.
//
//   node scripts-di-cu/dong-bo-app.mjs              # chạy thử, in ra ô sắp đổi
//   node scripts-di-cu/dong-bo-app.mjs --ghi        # ghi thật
//   node scripts-di-cu/dong-bo-app.mjs --bo duoc_lieu   # chỉ một bộ

import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const goc = resolve(here, "../..");
const require = createRequire(import.meta.url);
const { Client } = require("pg");

const args = process.argv.slice(2);
const seGhi = args.includes("--ghi");
const choNhieu = args.includes("--nhieu");
const choXoaNhieu = args.includes("--xoa-nhieu");
const chiBo = args.includes("--bo") ? args[args.indexOf("--bo") + 1] : null;

const TRAN_DOI = 300; // tổng ô được đổi trong một lượt
const TRAN_XOA = 20; // ô đang CÓ chữ mà bị làm rỗng

// kiểu: 0 = chữ thường, 1 = Portable Text → chữ, 2 = JSON giữ nguyên
const BO = [
	{
		ten: "duoc_lieu", nhan: "Dược Liệu",
		bangC: "ec_duoc_lieu", bangA: "vi_thuoc", khoaC: "slug", khoaA: "id", khoaSo: true,
		cot: [
			["ten_vi_thuoc", "title", 0], ["tinh", "tinh", 0], ["vi", "vi", 0],
			["quy_kinh", "quy_kinh", 0], ["lieu_dung", "lieu_dung", 0],
			["ten_khoa_hoc", "ten_khoa_hoc", 0], ["ten_han", "ten_han", 0],
			["ten_pinyin", "ten_pinyin", 0], ["bo_phan_dung", "bo_phan_dung", 0],
			["ho_khoa_hoc", "ho_khoa_hoc", 0], ["cong_dung_tom_tat", "cong_dung_tom_tat", 0],
			["anh_dai_dien", "anh_dai_dien", 0],
			["xuat_xu", "xuat_xu", 1], ["mo_ta", "mo_ta", 1], ["duoc_ly", "duoc_ly", 1],
			["tinh_vi_quy_kinh", "tinh_vi_quy_kinh", 1], ["nuoi_duong", "nuoi_duong", 1],
			["bao_che", "bao_che", 1], ["don_thuoc", "don_thuoc", 1], ["chu_tri", "chu_tri", 1],
			["tham_khao", "tham_khao", 1], ["thanh_phan", "thanh_phan_hoa_hoc", 1],
		],
	},
	{
		ten: "bai_thuoc", nhan: "Bài Thuốc",
		bangC: "ec_bai_thuoc", bangA: "phuong_thang", khoaC: "slug", khoaA: "slug", khoaSo: false,
		cot: [
			["ten", "title", 0], ["xuat_xu", "xuat_xu", 0], ["tac_gia", "tac_gia", 0],
			["cach_dung", "cach_dung", 1], ["tac_dung", "tac_dung", 1], ["ghi_chu", "ghi_chu", 1],
			["thanh_phan", "thanh_phan", 2],
		],
	},
];

const chu = (v) => {
	if (v === null || v === undefined) return null;
	const b = typeof v === "string" ? JSON.parse(v) : v;
	if (!Array.isArray(b)) return null;
	return b.map((k) => (Array.isArray(k?.children) ? k.children.map((c) => String(c?.text ?? "")).join("") : "")).join("\n");
};
const js = (v) => (v === null || v === undefined ? null : typeof v === "string" ? v : JSON.stringify(v));
const rong = (s) => s === null || s === undefined || s === "";
const bang = (a, b) => (rong(a) && rong(b)) || String(a) === String(b);

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

console.log(seGhi ? "── dong-bo-app: GHI THẬT ──" : "── dong-bo-app: CHẠY THỬ (thêm --ghi để ghi thật) ──");

let tongDoi = 0;
let tongXoa = 0;
const viecGhi = [];

for (const bo of BO) {
	if (chiBo && chiBo !== bo.ten) continue;
	const cotC = [...new Set(bo.cot.map((x) => x[1]))];
	const cotA = [...new Set(bo.cot.map((x) => x[0]))];
	const c = await cms.query(
		`SELECT ${bo.khoaC}, ${cotC.join(", ")} FROM ${bo.bangC} WHERE deleted_at IS NULL AND status = 'published'`,
	);
	const a = await app.query(`SELECT ${bo.khoaA}, ${cotA.join(", ")} FROM ${bo.bangA}`);
	const theoKhoa = new Map(a.rows.map((r) => [String(r[bo.khoaA]), r]));

	const dem = {};
	const viDu = {};
	let doi = 0, xoa = 0, khongThay = 0;
	const capNhat = [];

	for (const x of c.rows) {
		const y = theoKhoa.get(String(x[bo.khoaC]));
		if (!y) { khongThay++; continue; }
		const oDoi = [];
		for (const [ca, cc, kieu] of bo.cot) {
			const moi = kieu === 1 ? chu(x[cc]) : kieu === 2 ? js(x[cc]) : x[cc];
			const cu = kieu === 2 ? js(y[ca]) : y[ca];
			if (bang(moi, cu)) continue;
			oDoi.push([ca, moi]);
			doi++;
			dem[ca] = (dem[ca] || 0) + 1;
			if (!rong(cu) && rong(moi)) xoa++;
			if (!viDu[ca]) {
				viDu[ca] = `${x[bo.khoaC]}\n        app: ${JSON.stringify(String(cu ?? "").slice(0, 68))}\n        CMS: ${JSON.stringify(String(moi ?? "").slice(0, 68))}`;
			}
		}
		if (oDoi.length) capNhat.push([String(x[bo.khoaC]), oDoi]);
	}

	console.log(`\n▸ ${bo.nhan}: ${c.rows.length} mục CMS${khongThay ? ` (${khongThay} không có bên app)` : ""} · ${bo.cot.length} cột`);
	if (!doi) console.log("   ✓ không ô nào đổi — CMS và app đang khớp.");
	for (const [k, v] of Object.entries(dem).sort((p, q) => q[1] - p[1])) {
		console.log(`   ${k.padEnd(18)} ${String(v).padStart(5)} ô   ← ${viDu[k]}`);
	}
	tongDoi += doi;
	tongXoa += xoa;
	if (capNhat.length) viecGhi.push([bo, capNhat]);
}

console.log(`\nTổng: ${tongDoi} ô sẽ đổi (${tongXoa} ô đang có chữ sẽ bị làm rỗng).`);

if (!seGhi) {
	console.log(tongDoi ? "Chạy lại với --ghi để áp." : "Không có gì để ghi.");
	await cms.end(); await app.end();
	process.exit(0);
}

// ── Trần an toàn ──────────────────────────────────────────────────────
if (tongDoi > TRAN_DOI && !choNhieu) {
	console.error(`\n✗ DỪNG: ${tongDoi} ô vượt trần ${TRAN_DOI}. Đây thường là dấu hiệu đọc nhầm cột,`);
	console.error("  không phải người biên tập sửa nhiều thế. Đọc lại phần in ở trên; nếu đúng ý thì thêm --nhieu.");
	await cms.end(); await app.end();
	process.exit(1);
}
if (tongXoa > TRAN_XOA && !choXoaNhieu) {
	console.error(`\n✗ DỪNG: ${tongXoa} ô đang CÓ chữ sẽ bị làm rỗng, vượt trần ${TRAN_XOA}.`);
	console.error("  Nếu đúng là cố ý xoá thì thêm --xoa-nhieu.");
	await cms.end(); await app.end();
	process.exit(1);
}

let soDong = 0;
try {
	await app.query("BEGIN");
	for (const [bo, capNhat] of viecGhi) {
		for (const [khoa, oDoi] of capNhat) {
			const dat = oDoi.map(([ca], i) => `${ca} = $${i + 2}${ca === "thanh_phan" && bo.ten === "bai_thuoc" ? "::jsonb" : ""}`).join(", ");
			await app.query(
				`UPDATE ${bo.bangA} SET ${dat} WHERE ${bo.khoaA} = $1`,
				[bo.khoaSo ? Number(khoa) : khoa, ...oDoi.map(([, v]) => v)],
			);
			soDong++;
		}
	}
	await app.query("COMMIT");
} catch (e) {
	await app.query("ROLLBACK").catch(() => {});
	console.error(`\n✗ Lỗi khi ghi (${e.message}) — đã HOÀN TÁC toàn bộ, DB app không đổi gì.`);
	await cms.end(); await app.end();
	process.exit(1);
}

console.log(`\n✓ Đã ghi ${tongDoi} ô trên ${soDong} mục.`);
console.log("→ Trang tĩnh chỉ đổi sau khi build lại: cd frontend && npm run build");
await cms.end();
await app.end();
