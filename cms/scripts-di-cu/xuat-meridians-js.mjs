// xuat-meridians-js.mjs — Sinh lại meridians.js TỪ CMS. Cùng cách A như huyệt vị và
// hai bộ bệnh: KHÔNG sửa một dòng giao diện nào, chỉ đổi NGUỒN của tệp dữ liệu.
//
//   node scripts-di-cu/xuat-meridians-js.mjs --kiem   # đối chiếu, KHÔNG ghi
//   node scripts-di-cu/xuat-meridians-js.mjs          # ghi đè tệp thật
//
// ⚠️ Phép kiểm so SÂU cả đối tượng. Nhưng nó khớp theo (loai, id) nên KHÔNG bắt được
// thứ tự — chỉ `cmp` với bản gốc mới bắt. Đã cắn một lần ở benh.js.
//
// Ba chỗ riêng của tệp này:
//  · In THỤT LỀ 2 dấu cách (JSON.stringify(…, 2)), khác benh.js in một dòng.
//  · `id` của kinh (1–12) và mạch (1–8) TRÙNG NHAU → khoá là cặp (loai, id).
//  · `slug` trong tệp là bản DÀI (kinh-thu-thai-am-phe), còn CMS lấy bản NGẮN làm khoá
//    URL (phe) — 15/20 khác nhau, phải đọc từ slug_goc.

import { readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { docBanGoc, soTapCon, bao, SUA_GOC } from "./kiem-goc.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const goc = resolve(here, "../..");
const require = createRequire(import.meta.url);
const { Client } = require("pg");
const chiKiem = process.argv.includes("--kiem");
const kiemGoc = process.argv.includes("--kiem-goc");
const DICH = resolve(goc, "frontend/public/kinhmach3d/data/meridians.js");

// Nhãn là HẰNG SỐ của tệp gốc, không suy ra được từ dữ liệu.
const LABELS = {
	desc: "Đại cương", chinh: "Đường kinh chính", can: "Kinh cân", biet: "Kinh biệt",
	doc: "Lạc dọc", ngang: "Lạc ngang", chuTri: "Chủ trị", huyet: "Các huyệt",
	descTab: "Bảng huyệt", dacTinh: "Đặc tính", vanHanh: "Vận hành",
	trieuChung: "Triệu chứng", dieuTri: "Điều trị", nameAlt: "Tên khác",
};
const IMAGE_LABELS = {
	chinh: "Sơ đồ kinh chính", can: "Sơ đồ kinh cân", biet: "Sơ đồ kinh biệt",
	doc: "Lạc dọc", ngang: "Lạc ngang", gen: "Sơ đồ tổng quát", sodo: "Sơ đồ", pic: "Sơ đồ",
};

// THỨ TỰ KHOÁ của bản ghi — đo từ tệp gốc, mỗi nhóm đúng MỘT kiểu. Sai thứ tự thì
// JSON.stringify lệch dù chữ y nguyên.
const KHOA_KINH = ["id", "type", "ten", "desc", "chinh", "can", "biet", "doc", "ngang",
	"chuTri", "huyet", "images", "pointSummary", "code", "points", "slug", "anhCms"];
const KHOA_MACH = ["id", "type", "ten", "dacTinh", "vanHanh", "trieuChung", "dieuTri",
	"huyet", "nameAlt", "images", "pointSummary", "code", "points", "slug", "anhCms"];

const CHU = {
	desc: "dai_cuong", chinh: "duong_chinh", can: "kinh_can", biet: "kinh_biet",
	doc: "lac_doc", ngang: "lac_ngang", chuTri: "chu_tri", dacTinh: "dac_tinh",
	vanHanh: "van_hanh", trieuChung: "trieu_chung", dieuTri: "dieu_tri",
};
const THO = { ten: "title", nameAlt: "ten_khac", code: "ma", type: "loai",
	huyet: "huyet_ds", pointSummary: "tom_tat_huyet" };

const env = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const kho = new Client({
	host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
	database: env.PGDATABASE,
	ssl: { ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();
const rows = (await kho.query(
	`SELECT slug, slug_goc, ma_cu, diem, anh_goc, anh_chinh, anh_so_do, anh_tong_quat,
	        ${Object.values(THO).join(", ")}, ${Object.values(CHU).join(", ")}
	 FROM ec_kinh_mach WHERE deleted_at IS NULL AND status = 'published' ORDER BY loai DESC, ma_cu`,
)).rows;
await kho.end();

const chu = (v) => {
	if (v === null || v === undefined) return null;
	const b = typeof v === "string" ? JSON.parse(v) : v;
	if (!Array.isArray(b)) return null;
	return b.map((k) => (Array.isArray(k?.children) ? k.children.map((c) => String(c?.text ?? "")).join("") : "")).join("\n");
};
const js = (v) => (typeof v === "string" ? JSON.parse(v) : v);

// URL ảnh do CMS giữ. Cột kiểu image là TEXT chứa CHUỖI JSON khi truy vấn SQL thô (khác
// API EmDash vốn trả object) nên phải JSON.parse. Dùng meta.storageKey, KHÔNG dùng id:
// URL dựng bằng id trần trả 404 mà thẻ <img> vẫn render — lỗi không lộ khi nhìn trang.
// Thứ tự ưu tiên khớp cách kinhPage chọn ảnh: chính → sơ đồ → tổng quát.
const urlCms = (...vs) => {
	for (const v of vs) {
		if (!v) continue;
		let o = v;
		if (typeof o === "string") { try { o = JSON.parse(o); } catch { continue; } }
		const khoa = o?.meta?.storageKey;
		if (khoa) return `/_emdash/api/media/file/${khoa}`;
	}
	return null;
};

const dung = (x, thuTu) => {
	const o = {};
	for (const k of thuTu) {
		if (k === "id") o.id = x.ma_cu;
		else if (k === "slug") o.slug = x.slug_goc || x.slug;
		else if (k === "images") o.images = js(x.anh_goc) || {};
		else if (k === "points") o.points = js(x.diem) || [];
		else if (k === "anhCms") o.anhCms = urlCms(x.anh_chinh, x.anh_so_do, x.anh_tong_quat);
		else if (k in THO) o[k] = x[THO[k]];
		else if (k in CHU) o[k] = chu(x[CHU[k]]);
	}
	return o;
};

const ra = {
	title: "Kinh lạc – Hệ kinh mạch",
	labels: LABELS,
	imageLabels: IMAGE_LABELS,
	kinh: rows.filter((x) => x.loai === "kinh").map((x) => dung(x, KHOA_KINH)),
	circuits: rows.filter((x) => x.loai === "mach").map((x) => dung(x, KHOA_MACH)),
	count: 0,
};
ra.count = ra.kinh.length + ra.circuits.length;

const noiDungMoi = "window.MERIDIANS = " + JSON.stringify(ra, null, 2) + ";\n";

if (kiemGoc) {
	// So với BẢN GỐC trong git theo TẬP CON: khoá gốc phải còn nguyên, khoá thêm mới
	// thì cho phép. Đây là chốt sống lâu hơn `cmp`, xem kiem-goc.mjs.
	const { du, rev } = docBanGoc("meridians.js", "MERIDIANS", goc);
	const tha = SUA_GOC.filter((x) => x.tep === "meridians.js");
	process.exit(bao("meridians.js", rev, soTapCon(du, ra, "", tha), tha) === 0 ? 0 : 1);
}

if (!chiKiem) {
	writeFileSync(DICH, noiDungMoi);
	console.log(`✓ Ghi ${ra.kinh.length} kinh + ${ra.circuits.length} mạch → ${DICH.replace(goc + "/", "")}`);
	process.exit(0);
}

const w = {};
new Function("window", readFileSync(DICH, "utf8"))(w);
const cu = w.MERIDIANS;
let tongLech = 0;

const dauMoi = JSON.stringify({ title: ra.title, labels: ra.labels, imageLabels: ra.imageLabels, count: ra.count });
const dauCu = JSON.stringify({ title: cu.title, labels: cu.labels, imageLabels: cu.imageLabels, count: cu.count });
console.log(`phần đầu tệp: ${dauMoi === dauCu ? "✓ khớp" : "✗ lệch"}`);
if (dauMoi !== dauCu) { tongLech++; console.log("  mới: " + dauMoi + "\n  cũ : " + dauCu); }

for (const [nhom, moi, banCu] of [["kinh", ra.kinh, cu.kinh], ["circuits", ra.circuits, cu.circuits]]) {
	const theoId = new Map(banCu.map((x) => [x.id, x]));
	let lech = 0;
	const ten = [];
	for (const m of moi) {
		const c = theoId.get(m.id);
		if (!c) { lech++; ten.push(`${m.ten} (không có trong tệp)`); continue; }
		if (JSON.stringify(m) !== JSON.stringify(c)) { lech++; if (ten.length < 5) ten.push(m.ten); }
	}
	console.log(`${nhom.padEnd(9)}: CMS ${moi.length} · tệp ${banCu.length} · ${lech ? "✗ lệch " + lech + " (" + ten.join(", ") + ")" : "✓ khớp cả " + moi.length}`);
	tongLech += lech;
}

console.log(tongLech === 0 ? "\n✓ KHỚP HOÀN TOÀN — sinh lại từ CMS không mất gì." : `\n✗ Còn ${tongLech} chỗ lệch — ĐỪNG ghi đè cho tới khi hết.`);
process.exit(tongLech === 0 ? 0 : 1);
