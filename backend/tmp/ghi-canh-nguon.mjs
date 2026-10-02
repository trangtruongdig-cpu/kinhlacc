// ghi-canh-nguon.mjs — Ghi cạnh "y văn dẫn mục này" vào kho. CHẠY THỬ là mặc định.
//
// Đặc tả: docs/superpowers/specs/2026-10-02-do-thi-tri-thuc-thap-va-truc-ngang.md (GĐ 1)
// Chạy thử:  node backend/tmp/ghi-canh-nguon.mjs
// Ghi thật:  node backend/tmp/ghi-canh-nguon.mjs --ghi
//
// CHỈ GHI CẠNH CHẮC CHẮN: cụm dẫn trong kho KHỚP NGUYÊN VĂN (sau chuẩn hoá mạnh) tên một mục
// `/nguon/` đã có. Những cụm KHÔNG khớp là việc của do-nguon-con-thieu.mjs → người duyệt phán
// → nhập thư mục → chạy lại tệp này. Tệp này không bao giờ tạo mục nguồn mới.
//
// ⚠️ KHOÁ BẰNG SLUG cho ba bảng mới, bằng ID cho nguon_huyet — xem ghi chú trong
// schema-bootstrap.service.ts. Id tĩnh của bệnh học / châm cứu là số thứ tự 1–100 và TRÙNG
// nhau giữa hai bộ, nên khoá bằng id là mời lỗi im lặng khi sinh lại benh.js.
//
// ⚠️ Postgres KHÔNG canh giúp cột slug (không có khoá ngoại sang tệp tĩnh). Nên trước khi
// chèn, tệp này tự đối chiếu mọi slug với danh mục tĩnh và DỪNG nếu có slug lạ — đó là chỗ
// duy nhất còn canh được.

import { readFileSync } from "node:fs";
import pg from "pg";

const GOC = "/Users/truongtrang/Desktop/kinhlacc";
const GHI = process.argv.includes("--ghi");
const TAO_BANG = process.argv.includes("--tao-bang");
/** Số dòng mỗi lô INSERT — xem ghi chú ở khâu ghi. */
const LO = 200;

/**
 * DDL ba bảng mới. ⚠️ PHẢI GIỐNG HỆT khối trong `src/schema-bootstrap.service.ts` — service đó
 * chạy cùng DDL này mỗi lần backend khởi động, nên đây chỉ là đường TẮT để nghiệm thu trước khi
 * deploy. Sửa một bên mà quên bên kia là có hai hình bảng khác nhau giữa máy dev và production.
 */
const DDL = [
	`CREATE TABLE IF NOT EXISTS nguon_benh_hoc (nguon_id INTEGER NOT NULL REFERENCES nguon(id) ON DELETE CASCADE, slug VARCHAR(200) NOT NULL, PRIMARY KEY (nguon_id, slug))`,
	`CREATE INDEX IF NOT EXISTS idx_nguon_benh_hoc_slug ON nguon_benh_hoc (slug)`,
	`CREATE TABLE IF NOT EXISTS nguon_cham_cuu (nguon_id INTEGER NOT NULL REFERENCES nguon(id) ON DELETE CASCADE, slug VARCHAR(200) NOT NULL, PRIMARY KEY (nguon_id, slug))`,
	`CREATE INDEX IF NOT EXISTS idx_nguon_cham_cuu_slug ON nguon_cham_cuu (slug)`,
	`CREATE TABLE IF NOT EXISTS nguon_kinh (nguon_id INTEGER NOT NULL REFERENCES nguon(id) ON DELETE CASCADE, slug VARCHAR(200) NOT NULL, PRIMARY KEY (nguon_id, slug))`,
	`CREATE INDEX IF NOT EXISTS idx_nguon_kinh_slug ON nguon_kinh (slug)`,
];

function docEnv(duong) {
	const ra = {};
	let khoa = null;
	let dem = [];
	for (const dong of readFileSync(duong, "utf8").split("\n")) {
		if (khoa) {
			dem.push(dong);
			if (dong.trimEnd().endsWith('"')) { ra[khoa] = dem.join("\n").replace(/"$/, ""); khoa = null; dem = []; }
			continue;
		}
		const m = dong.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
		if (!m) continue;
		const [, k, v] = m;
		if (v.startsWith('"') && !v.slice(1).endsWith('"')) { khoa = k; dem = [v.slice(1)]; }
		else ra[k] = v.replace(/^"(.*)"$/, "$1");
	}
	return ra;
}

const chuan = (s) =>
	String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const RE_NGOAC = /\(([^()]{3,80})\)/g;
const RE_SACH = /sách\s+([A-ZĐÂÊÔƠƯĂ][^,.;:()"”'’\n]{2,60}?)\s+(?:ghi|chép|viết|nói|rằng|có)/gu;
const CO_SO = /\d/;
const DON_VI = /\b(?:g|gam|ml|thốn|phân|lượng|chỉ|%)\b/i;

function cumDan(chu) {
	const ra = [];
	const s = String(chu ?? "");
	for (const m of s.matchAll(RE_NGOAC)) ra.push(m[1].trim());
	for (const m of s.matchAll(RE_SACH)) ra.push(m[1].trim());
	return ra.filter((c) => {
		if (CO_SO.test(c) || DON_VI.test(c)) return false;
		const n = c.split(/\s+/).filter(Boolean).length;
		return n >= 2 && n <= 12;
	});
}

async function main() {
	const e = docEnv(`${GOC}/backend/.env`);
	const kho = new pg.Client({
		host: e.DB_HOST, port: Number(e.DB_PORT || 5432), user: e.DB_USER, password: e.DB_PASSWORD,
		database: e.DB_NAME,
		ssl: e.CA_CERTIFICATE ? { ca: e.CA_CERTIFICATE, rejectUnauthorized: true } : { rejectUnauthorized: false },
		connectionTimeoutMillis: 30_000,
	});
	await kho.connect();

	const nguon = new Map();
	for (const r of (await kho.query(`SELECT id, ten FROM nguon WHERE ten IS NOT NULL`)).rows) {
		const k = chuan(r.ten);
		if (k && !nguon.has(k)) nguon.set(k, { id: r.id, ten: r.ten });
	}

	const d = await import(`${GOC}/frontend/scripts/dict-data.mjs`);
	/** @type {{bang: string, cot: string, canh: Map<string, Set<string|number>>, hopLe: Set<string>}[]} */
	const bo = [];
	const them = (bang, cot, mucs, khoaCua, chuCua) => {
		const canh = new Map();
		const hopLe = new Set();
		for (const m of mucs) {
			const khoa = khoaCua(m);
			if (khoa === undefined || khoa === null || khoa === "") continue;
			hopLe.add(String(khoa));
			for (const c of cumDan(chuCua(m))) {
				const n = nguon.get(chuan(c));
				if (!n) continue;
				if (!canh.has(String(n.id))) canh.set(String(n.id), new Set());
				canh.get(String(n.id)).add(khoa);
			}
		}
		bo.push({ bang, cot, canh, hopLe });
	};

	const huyet = Object.values(d.ACU.records);
	them("nguon_huyet", "huyet_id", huyet, (h) => Number(h.id), (h) =>
		[h.noiDung, h.phoiHuyet, h.ghiChu, h.thamKhao, h.congDung].filter(Boolean).join("\n"));
	them("nguon_kinh", "slug", Object.values(d.MER.kinh), (m) => d.kinhSlugOf(m), (m) =>
		d.KINH_SECTIONS.map(([k]) => String(m[k] ?? "")).join("\n"));
	const chuBenh = (r) =>
		Object.entries(r).filter(([k]) => !k.startsWith("_") && k !== "slug" && k !== "id").map(([, v]) => (typeof v === "string" ? v : "")).join("\n");
	them("nguon_benh_hoc", "slug", Object.values(d.BENH.benhhoc.records), (r) => r._slug ?? r.slug, chuBenh);
	them("nguon_cham_cuu", "slug", Object.values(d.BENH.ccdt.records), (r) => r._slug ?? r.slug, chuBenh);

	if (TAO_BANG) {
		for (const sql of DDL) await kho.query(sql);
		console.log("✓ đã chạy DDL ba bảng (idempotent, y nguyên bản trong schema-bootstrap.service.ts)\n");
	}
	// Bảng chưa có thì nói rõ cách tạo, đừng để lỗi SQL thô đập vào mặt người chạy.
	for (const b of ["nguon_benh_hoc", "nguon_cham_cuu", "nguon_kinh"]) {
		const co = (await kho.query(`SELECT to_regclass($1) AS t`, [b])).rows[0].t;
		if (!co) {
			console.log(`✗ chưa có bảng ${b}. Khởi động lại backend một lần (SchemaBootstrapService tự tạo),`);
			console.log(`  hoặc chạy tệp này với --tao-bang để tạo ngay.`);
			await kho.end();
			process.exit(1);
		}
	}
	// ── Vị thuốc: chữ nằm trong DB, và bảng có cột `context` ghi NGUỒN GỐC BẰNG CHỨNG
	// (`ten_khac` 1.122 · `xuat_xu` 200 dòng đã có). Cạnh dò từ trích dẫn nên context =
	// "tham_khao": cùng cặp (nguồn, vị) đến từ hai đường khác nhau là HAI bằng chứng độc lập,
	// không phải trùng — khối hiển thị tự khử trùng theo tên sách.
	{
		const vt = (await kho.query(`SELECT id, tham_khao, don_thuoc, chu_tri FROM vi_thuoc`)).rows;
		const canh = new Map();
		const hopLe = new Set();
		for (const v of vt) {
			hopLe.add(String(v.id));
			for (const c of cumDan([v.tham_khao, v.don_thuoc, v.chu_tri].filter(Boolean).join("\n"))) {
				const n = nguon.get(chuan(c));
				if (!n) continue;
				if (!canh.has(String(n.id))) canh.set(String(n.id), new Set());
				canh.get(String(n.id)).add(Number(v.id));
			}
		}
		bo.push({ bang: "nguon_vi_thuoc", cot: "vi_thuoc_id", canh, hopLe, context: "tham_khao" });
	}

	console.log(`${GHI ? "GHI THẬT" : "CHẠY THỬ (thêm --ghi để ghi)"} · thư mục nguồn: ${nguon.size} quyển\n`);
	let tong = 0;
	let hong = 0;
	for (const b of bo) {
		let soCanh = 0;
		const la = new Set();
		for (const [, tap] of b.canh) for (const k of tap) { soCanh++; if (!b.hopLe.has(String(k))) la.add(k); }
		tong += soCanh;
		// Chốt chặn duy nhất còn lại cho cột không có khoá ngoại.
		if (la.size) { hong++; console.log(`  ✗ ${b.bang}: ${la.size} khoá LẠ không có trong danh mục tĩnh — ${[...la].slice(0, 5).join(", ")}`); }
		console.log(`  ${b.bang.padEnd(16)} ${String(soCanh).padStart(5)} cạnh · ${b.canh.size} quyển · ${new Set([...b.canh.values()].flatMap((s) => [...s])).size} mục được dẫn`);
	}
	console.log(`\n  tổng: ${tong} cạnh`);
	if (hong) { console.log("\n✗ Có khoá lạ — KHÔNG ghi gì. Xem lại danh mục tĩnh trước."); await kho.end(); process.exit(1); }

	if (!GHI) {
		console.log("\n(chạy thử — chưa ghi gì)");
		await kho.end();
		return;
	}

	// Ghi trong MỘT giao dịch; ON CONFLICT DO NOTHING nên chạy lại không nhân đôi.
	await kho.query("BEGIN");
	try {
		for (const b of bo) {
			// ⚠️ GHI THEO LÔ. Lần đầu tệp này chèn lẻ từng dòng: 4.149 lượt đi-về × RTT 88ms tới
			// Aiven = hơn 6 phút mỗi lượt chạy (đã vấp thật 02/10/2026). Cùng bài học với
			// `ghiHoSoLo` của bot thẩm định. Mỗi lô 200 dòng, vẫn trong MỘT giao dịch.
			const hang = [];
			for (const [nguonId, tap] of b.canh)
				for (const k of tap) hang.push([Number(nguonId), b.cot === "slug" ? String(k) : Number(k)]);
			let moi = 0;
			for (let i = 0; i < hang.length; i += LO) {
				const lo = hang.slice(i, i + LO);
				const cot = b.context ? `(nguon_id, ${b.cot}, context)` : `(nguon_id, ${b.cot})`;
				const n = b.context ? 3 : 2;
				const cho = lo.map((_, j) => `($${j * n + 1}, $${j * n + 2}${b.context ? `, $${j * n + 3}` : ""})`).join(",");
				const tham = lo.flatMap((x) => (b.context ? [...x, b.context] : x));
				const r = await kho.query(`INSERT INTO ${b.bang} ${cot} VALUES ${cho} ON CONFLICT DO NOTHING`, tham);
				moi += r.rowCount ?? 0;
			}
			console.log(`  ✓ ${b.bang.padEnd(16)} chèn mới ${moi} (số còn lại đã có sẵn)`);
		}
		await kho.query("COMMIT");
		console.log("\n✓ xong (một giao dịch)");
	} catch (err) {
		await kho.query("ROLLBACK");
		console.error("✗ lỗi — đã rollback:", err?.message ?? err);
		process.exitCode = 1;
	}
	await kho.end();
}

main().catch((err) => { console.error("✗ lỗi:", err?.message ?? err); process.exit(2); });
