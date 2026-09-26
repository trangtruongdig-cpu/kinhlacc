// va-ngoac-nguon.mjs — Trả lại dấu ")" bị khâu nhập cắt mất ở thư mục nguồn y văn.
//
// LỖI (phát hiện 26/09/2026): 165 mục trong thư mục nguồn có dấu "(" mở mà không bao giờ
// đóng — trang công khai đang hiện đúng như thế:
//     /nguon/linh-khu/                     "Linh Khu (Hoàng Đế Nội Kinh"
//     /nguon/thien-kinh-mach-linh-khu-10/  "Thiên 'Kinh Mạch' (Linh Khu 10"
//     tác giả:                             "Hoàng Phủ Mật (皇甫謐"
//
// KHÔNG phải rác mã hoá, nên `audit-rac-tu-dien.sql` không bắt được. Đây là khâu tách
// "tên sách" khỏi "số quyển" lúc dựng thư mục: nó cắt ĐÚNG tại dấu ")" mà quên giữ lại
// chính ký tự đó. Bằng chứng ba lớp, không đoán:
//
//   1. Tệp gốc `frontend/public/kinhmach3d/data/dict-sources.json` có 0 chuỗi hụt ngoặc;
//      46 mục đối chiếu được từng ký tự, sai lệch duy nhất là thiếu ")" ở đuôi.
//   2. `phuong_thang.xuat_xu` giữ nguyên văn: "Đông Y Bảo Giám (Ngoại Hình), Q.2." — ký
//      tự ngay sau chỗ bị cắt là ")" ở 117/118 tên đối chiếu được.
//   3. Mọi chỗ hụt đều nằm ở ĐUÔI chuỗi (0 chỗ ở giữa) — đúng dấu vết của một phép cắt.
//
// Lỗi có trong CẢ bốn bản sao lưu 18/09/2026, tức nó có từ khâu nhập đầu tiên; các script
// clean-*/gop-* không gây ra và cũng không chữa được.
//
// BA HẠNG VÁ, xếp theo độ chắc chắn giảm dần — hạng nào cũng in ra ở --thu:
//   A. có trong dict-sources.json  → chép nguyên văn bản gốc (chắc nhất)
//   B. xuat_xu xác nhận ký tự kế tiếp → vá theo đúng ký tự đó
//   C. không đối chiếu được         → thêm ")" theo luật chung
//
// `ten_khac` là DANH SÁCH các cách viết cũ gộp bằng " | " (do gop-nguon-trung-dau-cau.sql
// dồn vào). Phải vá TỪNG phần tử: mục `chung-tri-chuan-thang-loai-phuong` có phần tử hỏng
// nằm ở GIỮA chuỗi, thêm ")" vào đuôi cả chuỗi là vá trượt. (Đã kiểm: không mục ten_khac
// nào chứa ký tự xuống dòng, nên " | " là dấu tách duy nhất.)
//
// Vá CẢ HAI kho: `nguon` của app (builder đọc) và `ec_nguon_y_van` của CMS (kho biên tập).
// Bỏ một bên là lần đồng bộ sau kéo bản hỏng trở lại.
//
// ⚠️ Vá xong trang tĩnh CHƯA đổi — phải dựng lại frontend thì người đọc mới thấy.
//
//   node scripts-di-cu/va-ngoac-nguon.mjs --thu
//   node scripts-di-cu/va-ngoac-nguon.mjs

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

// Trần an toàn: thư mục có 2.139 mục, số hụt đo được là 165. Vượt xa ngưỡng này nghĩa là
// phép dò đã bắt nhầm thứ khác — dừng lại còn hơn ghi bừa.
const TRAN = 250;

const COT = [
	["ten", "title", "ten"],
	["tac_gia", "tac_gia", "tacGia"],
	["nien_dai", "nien_dai", "nienDai"],
	["ten_khac", "ten_khac", null],
	["ghi_chu", "ghi_chu", "ghiChu"],
];

const hutNgoac = (s) => typeof s === "string" && s.includes("(") && !s.includes(")");

const src = JSON.parse(
	readFileSync(resolve(goc, "frontend/public/kinhmach3d/data/dict-sources.json"), "utf8"),
).sources;

const be = parseEnv(readFileSync(resolve(goc, "backend/.env"), "utf8"));
const cmsEnv = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const ca = readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8");

const app = new Client({
	host: be.DB_HOST, port: +be.DB_PORT, user: be.DB_USER, password: be.DB_PASSWORD,
	database: be.DB_NAME, ssl: { ca: be.CA_CERTIFICATE ?? ca, rejectUnauthorized: true },
});
await app.connect();

const dong = (await app.query(
	`SELECT id, slug, ten, tac_gia, nien_dai, ten_khac, ghi_chu FROM nguon ORDER BY id`,
)).rows;

const va = [];
const demHang = { A: 0, B: 0, C: 0 };

/**
 * Quyết định bản vá cho MỘT chuỗi hụt ngoặc, theo ba hạng A → B → C.
 * Trả về { moi, hang }.
 */
async function quyetDinh(cu, slug, khoaGoc) {
	// A — bản gốc trong tệp di sản
	const g = khoaGoc && src[slug]?.[khoaGoc];
	if (typeof g === "string" && g.startsWith(cu) && !hutNgoac(g)) return { moi: g, hang: "A" };

	// B — xuất xứ bài thuốc giữ nguyên văn, đọc phần ngay sau chỗ cắt
	const xx = (await app.query(
		`SELECT DISTINCT xuat_xu FROM phuong_thang
		 WHERE xuat_xu LIKE $1 AND length(xuat_xu) > $2 LIMIT 20`,
		[cu + "%", cu.length],
	)).rows.map((x) => x.xuat_xu);
	const duoi = xx.map((x) => x.slice(cu.length));
	// ngoặc đóng ngay sát (cho phép một khoảng trắng chen vào)
	const sat = duoi.find((d) => {
		const i = d.indexOf(")");
		return i >= 0 && i <= 2 && !d.slice(0, i).trim();
	});
	if (sat !== undefined) return { moi: cu + sat.slice(0, sat.indexOf(")") + 1), hang: "B" };
	// ngoặc đóng xa hơn: chuỗi bị cắt mất cả một cụm, lấy trọn tới ")"
	const xa = duoi.find((d) => d.includes(")"));
	if (xa !== undefined) return { moi: cu + xa.slice(0, xa.indexOf(")") + 1), hang: "B" };

	// C — không đối chiếu được, áp luật chung
	return { moi: cu + ")", hang: "C" };
}

for (const r of dong) {
	const sua = {};
	for (const [cotApp, , khoaGoc] of COT) {
		const gocCot = r[cotApp];
		if (typeof gocCot !== "string" || !gocCot) continue;

		// ten_khac là danh sách — vá từng phần tử rồi ráp lại bằng đúng dấu tách cũ.
		if (cotApp === "ten_khac") {
			const phan = gocCot.split(" | ");
			if (!phan.some(hutNgoac)) continue;
			let hangXau = "A";
			const vaPhan = [];
			for (const p of phan) {
				if (!hutNgoac(p)) { vaPhan.push(p); continue; }
				const kq = await quyetDinh(p, r.slug, null);
				vaPhan.push(kq.moi);
				if (kq.hang > hangXau) hangXau = kq.hang;
			}
			sua[cotApp] = { moi: vaPhan.join(" | "), hang: hangXau };
			continue;
		}

		const cu = gocCot;
		if (!hutNgoac(cu)) continue;

		sua[cotApp] = await quyetDinh(cu, r.slug, khoaGoc);
	}
	if (Object.keys(sua).length) {
		va.push({ id: r.id, slug: r.slug, sua });
		for (const v of Object.values(sua)) demHang[v.hang]++;
	}
}

const soO = demHang.A + demHang.B + demHang.C;
console.log(`Thư mục nguồn: ${dong.length} mục · cần vá ${va.length} mục / ${soO} ô`);
console.log(`  A (tệp gốc di sản): ${demHang.A}   B (xuất xứ bài thuốc): ${demHang.B}   C (luật chung): ${demHang.C}`);

if (soO > TRAN) {
	console.error(`\n✗ ${soO} ô vượt trần an toàn ${TRAN} — dừng. Xem lại phép dò trước khi ghi.`);
	await app.end();
	process.exit(1);
}

const hangC = va.flatMap((v) => Object.entries(v.sua).filter(([, x]) => x.hang === "C").map(([c, x]) => [v.slug, c, x.moi]));
console.log(`\n=== 12 ô đầu ===`);
for (const v of va.slice(0, 12)) {
	for (const [c, x] of Object.entries(v.sua)) console.log(`  [${x.hang}] ${v.slug.padEnd(34)} ${c}: "${x.moi}"`);
}
if (hangC.length) {
	console.log(`\n=== hạng C — suy theo luật chung, nên liếc qua (${hangC.length} ô) ===`);
	for (const [s, c, m] of hangC.slice(0, 15)) console.log(`  ${s.padEnd(34)} ${c}: "${m}"`);
}

if (chiThu || !va.length) {
	console.log(va.length ? "\nChạy lại không có --thu để áp." : "\nKhông có gì để vá.");
	await app.end();
	process.exit(0);
}

// ── Ghi: app trước, CMS sau; mỗi kho một giao dịch ──────────────────────────────
let soApp = 0;
await app.query("BEGIN");
try {
	for (const v of va) {
		const cot = Object.keys(v.sua);
		const set = cot.map((c, i) => `"${c}" = $${i + 2}`).join(", ");
		const r = await app.query(`UPDATE nguon SET ${set} WHERE id = $1`, [v.id, ...cot.map((c) => v.sua[c].moi)]);
		soApp += r.rowCount;
	}
	await app.query("COMMIT");
} catch (err) {
	await app.query("ROLLBACK");
	console.error("✗ Lỗi khi ghi kho app, đã hoàn tác:", err.message);
	await app.end();
	process.exit(1);
}
await app.end();
console.log(`\n✓ app.nguon: ${soApp} mục`);

const kho = new Client({
	host: cmsEnv.PGHOST, port: +cmsEnv.PGPORT, user: cmsEnv.PGUSER,
	password: cmsEnv.PGPASSWORD, database: cmsEnv.PGDATABASE,
	ssl: { ca, rejectUnauthorized: true },
});
await kho.connect();
let soCms = 0, khongThay = 0;
await kho.query("BEGIN");
try {
	for (const v of va) {
		const cot = Object.entries(v.sua).map(([c, x]) => [COT.find((k) => k[0] === c)[1], x.moi]);
		const set = cot.map(([c], i) => `"${c}" = $${i + 2}`).join(", ");
		const r = await kho.query(
			`UPDATE ec_nguon_y_van SET ${set} WHERE slug = $1 AND deleted_at IS NULL`,
			[v.slug, ...cot.map((x) => x[1])],
		);
		if (r.rowCount) soCms += r.rowCount; else khongThay++;
	}
	await kho.query("COMMIT");
} catch (err) {
	await kho.query("ROLLBACK");
	console.error("✗ Lỗi khi ghi kho CMS, đã hoàn tác:", err.message);
	console.error("  ⚠ Kho app ĐÃ ghi xong — chạy lại script, phần đã đúng sẽ tự bỏ qua.");
	await kho.end();
	process.exit(1);
}
await kho.end();
console.log(`✓ cms.ec_nguon_y_van: ${soCms} mục` + (khongThay ? ` (${khongThay} slug không có trong CMS)` : ""));
console.log("\n⚠ Trang tĩnh chưa đổi — dựng lại frontend thì người đọc mới thấy.");
