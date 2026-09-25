// anh-huyet-3d.mjs — Ảnh huyệt dựng từ mô hình giải phẫu 3D: PNG xưởng → WebP → thư viện
// ảnh CMS → gắn vào bốn cột anh_da/anh_gp/anh_lan/anh_kinh của từng huyệt.
//
// Nạp SONG SONG có giới hạn 4 luồng: mỗi lần gọi `emdash media upload` là một tiến trình
// mới (~1,6 giây/ảnh), chạy tuần tự 1.444 ảnh (Việc 12) mất gần 40 phút. Bốn luồng còn
// khoảng 10 phút. Theo đúng lối hàng đợi + Promise.all của anh-huyet.mjs.
//
//   node scripts-di-cu/anh-huyet-3d.mjs --thu    # chỉ chuyển WebP và ĐO, không nạp không ghi
//   node scripts-di-cu/anh-huyet-3d.mjs
//
// Trần cứng 1,5GB (spec): vượt thì DỪNG, không nạp. Volume ./uploads không có bản sao.
// KHÔNG đụng cột `anh` — đó là ảnh webp 600px cũ (684 huyệt), ảnh dự bị cho 698 huyệt
// không có toạ độ 3D. Bốn cột anh_da/anh_gp/anh_lan/anh_kinh là ảnh mới, tách riêng.

import { readFileSync, mkdirSync, statSync, existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify, parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const chay = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const cmsDir = resolve(here, "..");
const goc = resolve(here, "../..");
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const { Client } = require("pg");

const BIN = resolve(cmsDir, "node_modules/.bin/emdash");
const VAO = process.env.ANHDIR || resolve(goc, ".anh-huyet");
const RA = resolve(cmsDir, ".tam-anh/huyet3d");
const TRAN_MB = 1536;
const SONG_SONG = 4;
const chiThu = process.argv.includes("--thu");
// 'kinh' là ảnh toàn thân nên cần to; ba kiểu kia đọc trên trang chỉ cần 800px.
const RONG = { kinh: 1400, da: 800, gp: 800, lan: 800 };

// --kinh=LU lọc hồ sơ theo tiền tố mã huyệt (nhiều tiền tố cách nhau bằng dấu phẩy).
// Dùng khi hoso.json có lẫn mục cũ của lượt kiểm khác (vd. GB34) chưa muốn nạp cùng đợt.
// Không truyền cờ này thì xử lý TRỌN hồ sơ — đây là chế độ Việc 12 sẽ dùng cho 1.444 ảnh.
const coLoc = process.argv.find((a) => a.startsWith("--kinh="));
const tienToLoc = coLoc ? coLoc.slice("--kinh=".length).split(",") : null;

const hosoGoc = JSON.parse(readFileSync(join(VAO, "hoso.json"), "utf8"));
const hoso = tienToLoc ? hosoGoc.filter((x) => tienToLoc.some((p) => x.ma.startsWith(p))) : hosoGoc;
console.log(`Hồ sơ: ${hosoGoc.length} ảnh${tienToLoc ? ` · lọc theo [${tienToLoc.join(", ")}]: ${hoso.length} ảnh` : ""}`);
mkdirSync(RA, { recursive: true });

// ── Bước 1: chuyển WebP + ĐO (luôn chạy, kể cả khi nạp thật, để có số KB làm cơ sở) ──
let tong = 0;
const ds = [];
const theoKieu = {};
for (const x of hoso) {
	const vao = join(VAO, x.tep);
	if (!existsSync(vao)) {
		console.error(`  ✗ thiếu ${x.tep}`);
		continue;
	}
	const ra = join(RA, x.tep.replace(/\.png$/, ".webp"));
	await sharp(vao).resize({ width: RONG[x.kieu] || 800 }).webp({ quality: 80 }).toFile(ra);
	const kb = statSync(ra).size / 1024;
	tong += kb;
	(theoKieu[x.kieu] ||= []).push(kb);
	ds.push({ ...x, webp: ra, kb });
}

const mb = tong / 1024;
const uocTatCa = (mb / ds.length) * 361 * 4;
console.log(`\nĐÃ CHUYỂN ${ds.length} ảnh · ${mb.toFixed(1)}MB · trung bình ${(tong / ds.length).toFixed(0)}KB/ảnh`);
for (const [kieu, ksList] of Object.entries(theoKieu)) {
	const tb = ksList.reduce((a, b) => a + b, 0) / ksList.length;
	console.log(`  ▸ ${kieu}: ${ksList.length} ảnh · trung bình ${tb.toFixed(0)}KB/ảnh`);
}

// Kho ảnh CMS đã có sẵn dung lượng của các phiên khác — phải cộng vào trước khi so trần.
let khoHienCo = 0;
try {
	const r = await chay("du", ["-sm", resolve(cmsDir, "uploads")]);
	khoHienCo = parseInt(r.stdout, 10) || 0;
} catch {
	/* thư mục uploads chưa có thì coi như 0 */
}
const uocTongCong = uocTatCa + khoHienCo;
console.log(`\nKho ảnh CMS hiện có: ${khoHienCo}MB`);
console.log(`ƯỚC CHO 361 HUYỆT × 4 KIỂU: ${uocTatCa.toFixed(0)}MB · CỘNG KHO HIỆN CÓ: ${uocTongCong.toFixed(0)}MB (trần ${TRAN_MB}MB)`);
if (uocTongCong > TRAN_MB) {
	console.error(`\n✗ VƯỢT TRẦN. Dừng lại, báo người dùng trước khi nạp.`);
	process.exit(1);
}
if (chiThu) {
	console.log("\n--thu: dừng ở đây, chưa nạp gì.");
	process.exit(0);
}

// ── Bước 2: nạp thật — mở kết nối CSDL, tắt trigger trước khi ghi lô ──
const env = parseEnv(readFileSync(resolve(cmsDir, ".env"), "utf8"));
const kho = new Client({
	host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
	database: env.PGDATABASE,
	ssl: { ca: readFileSync(resolve(cmsDir, "aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();
await kho.query("ALTER TABLE ec_huyet_vi DISABLE TRIGGER USER").catch(() => {});

const NHAN = { da: "vị trí trên da", gp: "lớp giải phẫu", lan: "các huyệt lân cận", kinh: "trên đường kinh" };
let xong = 0, gan = 0, hong = 0;

async function lamMot(x) {
	let j;
	try {
		const { stdout } = await chay(
			BIN,
			["media", "upload", x.webp, "--alt", `Huyệt ${x.ma} — ${NHAN[x.kieu]}`],
			{ cwd: cmsDir, maxBuffer: 4 << 20 },
		);
		j = JSON.parse(stdout.slice(stdout.indexOf("{")));
	} catch {
		hong++;
		return;
	}
	// Trường kiểu image cần { id, meta: { storageKey } } — dựng URL chỉ bằng id thì
	// /_emdash/api/media/file/<id> trả 404 và ảnh vỡ dù thẻ <img> vẫn có.
	const storageKey = j.storageKey || j.storage_key;
	try {
		const r = await kho.query(
			`UPDATE ec_huyet_vi SET anh_${x.kieu} = $1
			 WHERE upper(replace(ma_huyet,'-','')) IN ($2, $3) AND deleted_at IS NULL`,
			[JSON.stringify({ id: j.id, meta: { storageKey } }),
				x.ma, x.ma.replace(/^HT/, "HE").replace(/^KI/, "K")],
		);
		gan += r.rowCount;
	} catch {
		hong++;
	}
}

// Hàng đợi + Promise.all với 4 nhánh (lối anh-huyet.mjs) — một tệp lỗi không làm chết cả lượt.
const hangDoi = [...ds];
await Promise.all(
	Array.from({ length: SONG_SONG }, async () => {
		for (;;) {
			const x = hangDoi.shift();
			if (!x) return;
			await lamMot(x);
			xong++;
			if (xong % 50 === 0) console.log(`  …${xong}/${ds.length} (gắn ${gan}, lỗi ${hong})`);
		}
	}),
);

// Ghi chú dưới ảnh: cấu trúc mô hình không có + cảnh báo huyệt hạng B. Gộp theo huyệt vì
// bốn kiểu ảnh của cùng một huyệt dùng chung một ghi chú.
const theoHuyet = new Map();
for (const x of ds) {
	if (!theoHuyet.has(x.ma)) theoHuyet.set(x.ma, { khongCo: x.khongCo || [], hang: x.hang });
}
let ganGhiChu = 0;
for (const [ma, v] of theoHuyet) {
	const phan = [];
	if (v.khongCo.length)
		phan.push(`Mô hình 3D không chứa các cấu trúc sau nên ảnh không tô được, xem mục Giải Phẫu: ${v.khongCo.join(", ")}.`);
	if (v.hang === "B")
		phan.push("Vị trí huyệt này do engine dựng, chưa có bằng chứng đối chiếu ngoài engine.");
	if (!phan.length) continue;
	const r = await kho.query(
		`UPDATE ec_huyet_vi SET anh_ghi_chu = $1
		 WHERE upper(replace(ma_huyet,'-','')) IN ($2, $3) AND deleted_at IS NULL`,
		[phan.join(" "), ma, ma.replace(/^HT/, "HE").replace(/^KI/, "K")],
	);
	ganGhiChu += r.rowCount;
}

await kho.query("ALTER TABLE ec_huyet_vi ENABLE TRIGGER USER").catch(() => {});
console.log(`\nGắn ${gan} ảnh${hong ? `, ${hong} ảnh nạp lỗi` : ""}. Ghi chú: ${ganGhiChu} huyệt.`);
console.log("→ Chạy tiếp: node scripts-di-cu/dung-chi-muc.mjs huyet_vi");
await kho.end();
