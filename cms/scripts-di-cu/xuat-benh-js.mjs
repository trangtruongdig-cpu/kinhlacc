// xuat-benh-js.mjs — Sinh lại benh.js TỪ CMS. Cùng cách A như xuat-huyet-js.mjs:
// KHÔNG sửa một dòng giao diện nào, chỉ đổi NGUỒN của tệp dữ liệu.
//
//   node scripts-di-cu/xuat-benh-js.mjs --kiem   # đối chiếu, KHÔNG ghi. Chạy trước, mọi lần.
//   node scripts-di-cu/xuat-benh-js.mjs          # ghi đè tệp thật
//
// ⚠️ Phép kiểm so SÂU cả đối tượng bằng JSON.stringify, không so vài trường liệt kê tay.
// Ở huyệt vị tôi từng so theo danh sách tự chọn và bỏ lọt 386 bản ghi mất khoá `image`:
// phép kiểm hẹp hơn thứ nó phải chứng minh thì nó không chứng minh được gì.
//
// Thứ tự khoá của bản ghi phải giữ y hệt (đo từ tệp gốc, 18 và 33 kiểu):
//   id, ten, slug, _meta (nếu có), rồi các trường theo ĐÚNG thứ tự khai trong `fields`,
//   bỏ qua trường không có dữ liệu. Sai thứ tự thì JSON.stringify lệch dù chữ y nguyên.

import { readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { docBanGoc, soTapCon, bao } from "./kiem-goc.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const goc = resolve(here, "../..");
const require = createRequire(import.meta.url);
const { Client } = require("pg");
const chiKiem = process.argv.includes("--kiem");
const kiemGoc = process.argv.includes("--kiem-goc");
const DICH = resolve(goc, "frontend/public/kinhmach3d/data/benh.js");

// Siêu dữ liệu của hai bộ: nhãn và thứ tự trường là HẰNG SỐ của tệp gốc, không suy ra
// được từ dữ liệu. `fields` vừa là nhãn hiển thị vừa là THỨ TỰ khoá của bản ghi.
const BO = [
	{
		key: "ccdt", bang: "ec_cham_cuu_tri_benh",
		title: "Châm Cứu Trị Bệnh", metaLabel: "Tên Khác", metaCot: "ten_khac",
		fields: [
			["daiCuong", "Đại Cương", "dai_cuong"],
			["nguyenNhan", "Nguyên Nhân", "nguyen_nhan"],
			["trieuChung", "Triệu Chứng", "trieu_chung"],
			["chanDoan", "Chẩn Đoán", "chan_doan"],
			["dieuTri", "Điều Trị (Châm Cứu)", "dieu_tri"],
			["thamKhao", "Tham Khảo", "tham_khao"],
		],
	},
	{
		key: "benhhoc", bang: "ec_benh_hoc",
		title: "Bệnh Học", metaLabel: "Đối Chiếu Bệnh Danh", metaCot: "doi_chieu_benh_danh",
		fields: [
			["daiCuong", "Đại Cương", "dai_cuong"],
			["nguyenNhan", "Nguyên Nhân", "nguyen_nhan"],
			["coChe", "Cơ Chế Bệnh Sinh", "co_che"],
			["trieuChung", "Triệu Chứng", "trieu_chung"],
			["chanDoan", "Chẩn Đoán", "chan_doan"],
			["dieuTri", "Biện Chứng Luận Trị", "dieu_tri"],
			["benhAn", "Bệnh Án", "benh_an"],
			["thamKhao", "Tham Khảo", "tham_khao"],
		],
	},
];

const env = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const kho = new Client({
	host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
	database: env.PGDATABASE,
	ssl: { ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();

// THỨ TỰ bản ghi trong tệp gốc: bỏ DẤU THANH nhưng GIỮ chữ "đ", rồi đối chiếu tiếng Việt.
// Dò ra bằng cách thử 5 kiểu sắp trên chính tệp gốc — chỉ kiểu này khớp cả 200 bản ghi.
// Giữ "đ" là mấu chốt: "Âm Dưỡng" đứng TRƯỚC "Âm Đạo Viêm" (d < đ), còn cả hai đứng
// trước "Amiđan Viêm Cấp" (dấu cách < chữ i). Bỏ luôn "đ" thành "d" là sai thứ tự.
const doiChieu = new Intl.Collator("vi");
const khoaSap = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const sapXep = (a, b) => doiChieu.compare(khoaSap(a.ten), khoaSap(b.ten));

// Portable Text → chữ. Mỗi khối một dòng, KHÔNG lọc dòng rỗng.
const chu = (v) => {
	if (v === null || v === undefined) return null;
	const b = typeof v === "string" ? JSON.parse(v) : v;
	if (!Array.isArray(b)) return null;
	return b.map((k) => (Array.isArray(k?.children) ? k.children.map((c) => String(c?.text ?? "")).join("") : "")).join("\n");
};

const ra = {};
for (const bo of BO) {
	const cot = bo.fields.map((f) => f[2]);
	const r = await kho.query(
		`SELECT ma_cu, title, slug_goc, slug, ${bo.metaCot}, ${cot.join(", ")}
		 FROM ${bo.bang} WHERE deleted_at IS NULL AND status = 'published'`,
	);
	ra[bo.key] = {
		title: bo.title,
		metaLabel: bo.metaLabel,
		fields: bo.fields.map((f) => [f[0], f[1]]),
		count: r.rows.length,
		records: r.rows.map((x) => {
			const o = { id: x.ma_cu, ten: x.title, slug: x.slug_goc || x.slug };
			if (x[bo.metaCot] != null) o._meta = x[bo.metaCot];
			for (const [khoa, , c] of bo.fields) {
				const t = chu(x[c]);
				if (t != null) o[khoa] = t;
			}
			return o;
		}).sort(sapXep),
	};
}
await kho.end();

const DAU = "/* TỰ SINH bởi _build-benh.cjs — KHÔNG sửa tay. window.BENH = { ccdt, benhhoc }. */\n";
const noiDungMoi = DAU + "window.BENH = " + JSON.stringify(ra) + ";\n";

if (kiemGoc) {
	// So với BẢN GỐC trong git theo TẬP CON: khoá gốc phải còn nguyên, khoá thêm mới
	// thì cho phép. Đây là chốt sống lâu hơn `cmp`, xem kiem-goc.mjs.
	const { du, rev } = docBanGoc("benh.js", "BENH", goc);
	process.exit(bao("benh.js", rev, soTapCon(du, ra)) === 0 ? 0 : 1);
}

if (!chiKiem) {
	writeFileSync(DICH, noiDungMoi);
	console.log(`✓ Ghi ${BO.map((b) => `${b.key} ${ra[b.key].records.length}`).join(" · ")} → ${DICH.replace(goc + "/", "")}`);
	process.exit(0);
}

// ── Đối chiếu vòng tròn ───────────────────────────────────────────────
const w = {};
new Function("window", readFileSync(DICH, "utf8"))(w);
let tongLech = 0;

for (const bo of BO) {
	const moi = ra[bo.key], cu = w.BENH[bo.key];
	const dauMoi = JSON.stringify({ title: moi.title, metaLabel: moi.metaLabel, fields: moi.fields, count: moi.count });
	const dauCu = JSON.stringify({ title: cu.title, metaLabel: cu.metaLabel, fields: cu.fields, count: cu.count });
	const cuTheoId = new Map(cu.records.map((x) => [x.id, x]));
	let lech = 0, thieu = 0;
	const ten = [];
	for (const m of moi.records) {
		const c = cuTheoId.get(m.id);
		if (!c) { thieu++; ten.push(`${m.ten} (không có trong tệp)`); continue; }
		if (JSON.stringify(m) !== JSON.stringify(c)) { lech++; if (ten.length < 5) ten.push(m.ten); }
	}
	console.log(`▸ ${bo.key}: CMS ${moi.records.length} · tệp ${cu.records.length}`);
	console.log(`   phần đầu: ${dauMoi === dauCu ? "✓ khớp" : "✗ lệch\n     mới: " + dauMoi + "\n     cũ : " + dauCu}`);
	console.log(`   bản ghi : ${lech + thieu ? "✗ lệch " + (lech + thieu) + " (" + ten.join(", ") + ")" : "✓ khớp cả " + moi.records.length}`);
	tongLech += lech + thieu + (dauMoi === dauCu ? 0 : 1);
}

console.log(tongLech === 0 ? "\n✓ KHỚP HOÀN TOÀN — sinh lại từ CMS không mất gì." : `\n✗ Còn ${tongLech} chỗ lệch — ĐỪNG ghi đè cho tới khi hết.`);
process.exit(tongLech === 0 ? 0 : 1);
