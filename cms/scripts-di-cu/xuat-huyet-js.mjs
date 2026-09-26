// xuat-huyet-js.mjs — Sinh lại acupoints.js TỪ CMS.
//
// Đây là chỗ "cắm CMS vào" theo cách A: KHÔNG sửa một dòng nào trong TuDienView.vue.
// Giao diện vẫn đọc window.ACUPOINTS như trước; chỉ khác là tệp đó nay do CMS sinh ra.
// Cùng một tệp phục vụ CẢ giao diện SPA lẫn các trang tĩnh (dict-data.mjs đọc nó).
//
//   node scripts-di-cu/xuat-huyet-js.mjs --kiem   # sinh ra rồi ĐỐI CHIẾU với tệp đang
//                                                 # dùng, KHÔNG ghi đè. Chạy cái này
//                                                 # trước, mọi lần.
//   node scripts-di-cu/xuat-huyet-js.mjs          # ghi đè tệp thật
//
// ⚠️ Phép đối chiếu vòng tròn là thứ duy nhất chứng minh CMS không làm mất dữ liệu.
// Dữ liệu trong CMS vốn ĐƯỢC NHẬP TỪ chính tệp này, nên sinh ngược lại phải ra y hệt.
// Lệch một ký tự cũng là dấu hiệu bản nhập đã đánh rơi thứ gì đó.

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
const DICH = resolve(goc, "frontend/public/kinhmach3d/data/acupoints.js");

const env = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const kho = new Client({
	host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
	database: env.PGDATABASE,
	ssl: { ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();

// Tám trường mục ↔ tiêu đề trong sections. TÊN KHÁC nằm ở cột riêng ten_khac.
const MUC = {
	"TÊN HUYỆT": "y_nghia_ten",
	"ĐẶC TÍNH": "dac_tinh",
	"VỊ TRÍ": "vi_tri",
	"GIẢI PHẪU": "giai_phau",
	"TÁC DỤNG": "tac_dung",
	"CHỦ TRỊ": "chu_tri",
	"CHÂM CỨU": "cham_cuu",
	"XUẤT XỨ": "xuat_xu",
};

const r = await kho.query(`
	SELECT ma_cu, title, slug, slug_goc, ten_khac, muc_goc, ma_huyet, ma_gach, ten_han, pinyin, ten_anh,
	       pho_huyet, ghi_chu, tham_khao, noi_dung_goc, thu_tu_muc, anh_duong_dan, chi_dinh,
	       y_nghia_ten, dac_tinh, vi_tri, giai_phau, tac_dung, chu_tri, cham_cuu, xuat_xu,
	       anh_da, anh_gp, anh_lan, anh_kinh, anh_ghi_chu, anh, cong_dung_nhom
	FROM ec_huyet_vi
	WHERE deleted_at IS NULL AND status = 'published'
	ORDER BY ma_cu
`);
await kho.end();

// URL ảnh 3D từ cột kiểu image — cột này là TEXT chứa CHUỖI JSON khi truy vấn SQL thô
// (khác API EmDash, vốn trả object), nên phải JSON.parse rồi mới lấy meta.storageKey.
// storageKey KHÁC id: dựng URL bằng id trần thì /_emdash/api/media/file/<id> trả 404
// mà thẻ <img> vẫn render ra — lỗi không lộ khi chỉ nhìn trang. Theo đúng cách
// cms/src/utils/anh.ts đã làm cho các trang CMS khác.
const urlAnh3d = (v) => {
	if (!v) return null;
	let o = v;
	if (typeof o === "string") {
		try {
			o = JSON.parse(o);
		} catch {
			return null;
		}
	}
	if (!o || typeof o !== "object") return null;
	// KHÔNG rơi về o.id khi thiếu storageKey — đó chính là cái bẫy 404-mà-vẫn-render
	// đã cảnh báo ở trên. Thiếu storageKey thì coi như chưa có ảnh, trả null.
	const khoa = o.meta?.storageKey;
	return khoa ? `/_emdash/api/media/file/${khoa}` : null;
};

// Portable Text → từng dòng chữ, đúng cách đã nhập vào (mỗi khối một dòng).
const chu = (v) => {
	if (!v) return "";
	if (typeof v === "string") return v;
	if (!Array.isArray(v)) return "";
	// KHÔNG lọc dòng rỗng: 3 huyệt có dòng trống GIỮA thân bài, lọc đi là lệch tệp gốc.
	return v
		.map((k) => (Array.isArray(k?.children) ? k.children.map((c) => String(c?.text ?? "")).join("") : ""))
		.join("\n");
};

const records = r.rows.map((x) => {
	// Dựng lại sections theo ĐÚNG thứ tự đã lưu của từng huyệt.
	//
	// Xét theo CỘT CÓ DỮ LIỆU hay không, KHÔNG xét theo thân rỗng: Thiên Cù Bàng Huyệt
	// có mục CHÂM CỨU thân rỗng mà vẫn phải xuất ra để khớp tệp gốc.
	//
	// muc_goc: bản ghi có TIÊU ĐỀ MỤC TRÙNG (đo được đúng 1 — Trường Cường, thực chất
	// là hai huyệt bị gộp nhầm trong dữ liệu gốc) không biểu diễn nổi bằng mô hình
	// mỗi-mục-một-cột. Giữ nguyên bản gốc cho riêng nó để sinh lại không mất chữ; khi
	// nào tách được thành hai mục từ trong CMS thì xoá muc_goc đi.
	const thuTu = Array.isArray(x.thu_tu_muc) ? x.thu_tu_muc : [];
	const sections =
		Array.isArray(x.muc_goc) && x.muc_goc.length
			? x.muc_goc
			: thuTu
					.map((h) => {
						if (h === "TÊN KHÁC") return x.ten_khac != null ? { h, body: x.ten_khac } : null;
						const cot = MUC[h];
						if (!cot || x[cot] == null) return null;
						return { h, body: chu(x[cot]) };
					})
					.filter(Boolean);

	// Bốn ảnh 3D gộp vào MỘT khoá anh3d, không phải bốn khoá phẳng — thoả thuận với
	// phiên kinhlacc-12 (chủ của tệp sinh này). null khi huyệt chưa có ảnh nào, y như
	// cách khoá `image` cũ dùng null chứ không bỏ khoá.
	const coAnh3d = x.anh_da || x.anh_gp || x.anh_lan || x.anh_kinh;
	const anh3d = coAnh3d
		? {
				da: urlAnh3d(x.anh_da),
				gp: urlAnh3d(x.anh_gp),
				lan: urlAnh3d(x.anh_lan),
				kinh: urlAnh3d(x.anh_kinh),
				ghiChu: x.anh_ghi_chu || null,
			}
		: null;

	// CHÍNH SÁCH KHOÁ — đo từ tệp gốc, phải giữ y hệt:
	//  · 9 khoá LUÔN CÓ ở cả 1.059 bản ghi, kể cả khi rỗng: image là null chứ KHÔNG
	//    phải bỏ khoá. Bỏ khoá thì 386 bản ghi đổi hình dạng.
	//  · 6 khoá chỉ có ở 357 bản ghi có mã quốc tế, và có ĐỦ CẢ SÁU cùng lúc
	//    (indications có thể là mảng rỗng, vẫn phải xuất).
	//  · anh3d là khoá MỚI (Việc 7) — phải có mặt ở CẢ 1.059 bản ghi, null khi rỗng,
	//    đúng luật trên chứ không phải luật riêng.
	const o = {
		id: x.ma_cu,
		ten: x.title,
		noiDung: x.noi_dung_goc || "",
		phoiHuyet: x.pho_huyet || "",
		ghiChu: x.ghi_chu || "",
		thamKhao: x.tham_khao || "",
		sections,
		slug: x.slug_goc || x.slug,
		image: x.anh_duong_dan || null,
		// anhCms — ảnh sơ đồ huyệt do CMS giữ (684/1.059 huyệt). Khoá MỚI, luôn có mặt,
		// null khi CMS chưa có ảnh; `image` (đường dẫn tĩnh) GIỮ NGUYÊN làm đường lùi.
		//
		// Vì sao cần: 1.312 ảnh từ điển KHÔNG có trong git và KHÔNG có trên máy lập trình
		// — chúng chỉ nằm trên ổ đĩa VPS. Bản sao trong CMS hiện là bản lưu duy nhất. Cho
		// CMS làm nguồn chính vừa đúng yêu cầu "CMS quản lý hình ảnh", vừa gỡ được chỗ
		// hỏng-một-phát-mất-hết đó.
		//
		// KHÔNG ghi đè `image`: đổi giá trị của khoá gốc là làm --kiem-goc báo MẤT, và
		// mất luôn đường lùi khi CMS sập lúc ảnh chưa vào đệm nginx.
		anhCms: urlAnh3d(x.anh),
		anh3d,
		// congDung — Việc 9, thí điểm 11 huyệt kinh Phế. Cột json ở CMS đã ĐÚNG hình dạng
		// { trang, nhom: [chuỗi] } (chuỗi phẳng, không phải object con — xem chú thích ở
		// đầu nap-cong-dung.mjs vì sao). pg trả JSON đã parse sẵn thành object JS, không
		// cần JSON.parse. Khoá MỚI, luôn có mặt ở cả 1.059 bản ghi, null khi chưa có —
		// đúng luật khoá đã chốt với anh3d, KHÔNG bỏ khoá khi rỗng.
		congDung: x.cong_dung_nhom || null,
	};
	if (x.ma_huyet) {
		o.international_code = x.ma_huyet;
		o.code_dash = x.ma_gach || null;
		o.chinese = x.ten_han || null;
		o.pinyin = x.pinyin || null;
		o.english = x.ten_anh || null;
		o.indications = Array.isArray(x.chi_dinh) ? x.chi_dinh : [];
	}
	return o;
});

const raGoc = {
	category: "acupoints",
	title: "Huyệt vị – Châm cứu",
	labels: { noiDung: "Mô tả huyệt", phoiHuyet: "Phối huyệt", ghiChu: "Ghi chú", thamKhao: "Tham khảo" },
	// 1058 là con số trong tệp gốc. KHÔNG suy ra được từ dữ liệu — cả 1.059 bản ghi đều
	// có sections. Giữ nguyên để tệp sinh ra không lệch phần đầu.
	count: 1058,
	records,
};
const noiDungMoi = "window.ACUPOINTS = " + JSON.stringify(raGoc, null, 2) + ";\n";

if (kiemGoc) {
	// So với BẢN GỐC trong git theo TẬP CON: khoá gốc phải còn nguyên, khoá thêm mới
	// thì cho phép. Đây là chốt sống lâu hơn `cmp`, xem kiem-goc.mjs.
	const { du, rev } = docBanGoc("acupoints.js", "ACUPOINTS", goc);
	process.exit(bao("acupoints.js", rev, soTapCon(du, raGoc)) === 0 ? 0 : 1);
}

if (!chiKiem) {
	writeFileSync(DICH, noiDungMoi);
	console.log(`✓ Ghi ${records.length} huyệt → ${DICH.replace(goc + "/", "")}`);
	console.log("  Chạy tiếp: cd frontend && npm run build");
	process.exit(0);
}

// ── Đối chiếu vòng tròn ───────────────────────────────────────────────
const w = {};
new Function("window", readFileSync(DICH, "utf8"))(w);
const cu = w.ACUPOINTS;

console.log(`Đối chiếu bản sinh từ CMS với tệp đang dùng:`);
console.log(`  số huyệt: CMS ${records.length} · tệp ${cu.records.length}`);

const cuTheoId = new Map(cu.records.map((x) => [x.id, x]));
let lech = 0, thieu = 0;
const ten = [];

// So SÂU cả đối tượng, không chỉ vài trường liệt kê tay. Lần trước tôi so theo danh
// sách trường tự chọn nên bỏ lọt 386 bản ghi mất khoá `image` — phép kiểm hẹp hơn
// thứ nó phải chứng minh thì nó không chứng minh được gì.
for (const m of records) {
	const c = cuTheoId.get(m.id);
	if (!c) { thieu++; ten.push(m.ten + " (không có trong tệp)"); continue; }
	if (JSON.stringify(m) !== JSON.stringify(c)) { lech++; if (ten.length < 6) ten.push(m.ten); }
}

const dauFile = JSON.stringify({ category: raGoc.category, title: raGoc.title, labels: raGoc.labels, count: raGoc.count });
const dauCu = JSON.stringify({ category: cu.category, title: cu.title, labels: cu.labels, count: cu.count });
console.log(`  phần đầu tệp: ${dauFile === dauCu ? "✓ khớp" : "✗ lệch\n    mới: " + dauFile + "\n    cũ : " + dauCu}`);
console.log(`  bản ghi: ${lech + thieu ? "✗ lệch " + (lech + thieu) + " (" + ten.join(", ") + ")" : "✓ khớp cả " + records.length}`);

const tongLech = lech + thieu + (dauFile === dauCu ? 0 : 1);
console.log(tongLech === 0 ? "\n✓ KHỚP HOÀN TOÀN — sinh lại từ CMS không mất gì." : `\n✗ Còn ${tongLech} chỗ lệch — ĐỪNG ghi đè cho tới khi hết.`);
process.exit(tongLech === 0 ? 0 : 1);
