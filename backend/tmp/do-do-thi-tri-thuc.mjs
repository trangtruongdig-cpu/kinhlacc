// do-do-thi-tri-thuc.mjs — CHỈ ĐỌC. Đo đồ thị tri thức: cạnh nào có thật, phủ bao nhiêu, và
// cạnh nào đang nối SAI KHÔNG GIAN DANH TÍNH.
//
// Đặc tả: docs/superpowers/specs/2026-10-02-do-thi-tri-thuc-thap-va-truc-ngang.md
// Chạy: node backend/tmp/do-do-thi-tri-thuc.mjs
// Mã thoát 1 khi có cạnh nào trượt phép kiểm không gian id.
//
// VÌ SAO TỆP NÀY TỒN TẠI
// Mọi con số về đồ thị trong đặc tả phải kiểm lại được bằng MỘT lệnh. Không có nó thì câu
// "triệu chứng → huyệt: 0 cạnh" chỉ là lời kể, và sáu tuần sau không ai biết nó còn đúng không.
//
// ⚠️ BẪY CHỊU LỰC: HAI KHÔNG GIAN DANH TÍNH HUYỆT.
//   huyet_vi.id_huyet              1–456  (445 dòng) — không gian APP (bảng lâm sàng)
//   nguon_huyet.huyet_id           1–1059 (1.036 id) — không gian TỪ ĐIỂN (khớp ec_huyet_vi)
// Cầu nối là huyet_vi.id_tu_dien, và nó chỉ phủ 411/445 dòng app.
// Cả hai đều là số nguyên nhỏ, nên `JOIN huyet_vi h ON h.id_huyet = n.huyet_id` trên
// nguon_huyet vẫn trả về 432 dòng — KHÔNG lỗi, KHÔNG cảnh báo, và mỗi dòng là một cặp
// (nguồn, huyệt) SAI. Một đồ thị dựng trên đó sẽ nói "sách X bàn về huyệt Y" trong khi sách X
// chưa từng nhắc huyệt Y. Với nội dung y khoa đó là loại sai tệ nhất: trông có căn cứ.
// Phép kiểm KHONG_GIAN dưới đây bắt đúng chuyện này.

import { readFileSync } from "node:fs";
import pg from "pg";

const GOC = "/Users/truongtrang/Desktop/kinhlacc/backend";

function docEnv(duong) {
	const ra = {};
	let khoa = null;
	let dem = [];
	for (const dong of readFileSync(duong, "utf8").split("\n")) {
		if (khoa) {
			dem.push(dong);
			if (dong.trimEnd().endsWith('"')) {
				ra[khoa] = dem.join("\n").replace(/"$/, "");
				khoa = null;
				dem = [];
			}
			continue;
		}
		const m = dong.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
		if (!m) continue;
		const [, k, v] = m;
		// CA_CERTIFICATE là PEM nhiều dòng trong nháy kép (xem CLAUDE.md) — phải gom nhiều dòng.
		if (v.startsWith('"') && !v.slice(1).endsWith('"')) {
			khoa = k;
			dem = [v.slice(1)];
		} else {
			ra[k] = v.replace(/^"(.*)"$/, "$1");
		}
	}
	return ra;
}

/**
 * Khai NGUYÊN HÌNH từng cạnh của đồ thị. `kg` là không gian danh tính của đầu bên phải:
 * "app" = huyet_vi.id_huyet, "tu_dien" = id của bộ từ điển (1–1059), null = không phải huyệt.
 * Đây là chỗ DUY NHẤT khai việc đó — thêm cạnh mới thì khai ở đây, không rải trong truy vấn.
 */
const CANH = [
	// ── T1 đỉnh tháp: nguồn y văn → thực thể nền ──
	{ tang: "T1", ten: "nguồn → bài thuốc", bang: "nguon_phuong_thang", trai: "nguon_id", phai: "phuong_thang_id", goc: "phuong_thang", gocKhoa: "id", kg: null },
	{ tang: "T1", ten: "nguồn → vị thuốc", bang: "nguon_vi_thuoc", trai: "nguon_id", phai: "vi_thuoc_id", goc: "vi_thuoc", gocKhoa: "id", kg: null },
	{ tang: "T1", ten: "nguồn → huyệt", bang: "nguon_huyet", trai: "nguon_id", phai: "huyet_id", goc: null, gocKhoa: null, kg: "tu_dien" },
	// Ba cạnh dưới KHOÁ BẰNG SLUG (không gian tệp tĩnh), không có khoá ngoại — xem ghi chú
	// trong schema-bootstrap.service.ts. Dựng 02/10/2026 bởi tmp/ghi-canh-nguon.mjs.
	{ tang: "T1", ten: "nguồn → kinh", bang: "nguon_kinh", trai: "nguon_id", phai: "slug", goc: null, gocKhoa: null, kg: "slug" },
	{ tang: "T1", ten: "nguồn → bệnh học", bang: "nguon_benh_hoc", trai: "nguon_id", phai: "slug", goc: null, gocKhoa: null, kg: "slug" },
	{ tang: "T1", ten: "nguồn → châm cứu trị bệnh", bang: "nguon_cham_cuu", trai: "nguon_id", phai: "slug", goc: null, gocKhoa: null, kg: "slug" },
	// ── T2 tầng nền nối nhau ──
	{ tang: "T2", ten: "vị thuốc → quy kinh", bang: "vi_thuoc_kinh_mach", trai: "id_kinh_mach", phai: "id_vi_thuoc", goc: "vi_thuoc", gocKhoa: "id", kg: null },
	{ tang: "T2", ten: "vị thuốc → chủ trị", bang: "vi_thuoc_chu_tri", trai: "id_chu_tri", phai: "id_vi_thuoc", goc: "vi_thuoc", gocKhoa: "id", kg: null },
	// ── T3 tầng pháp ──
	{ tang: "T3", ten: "pháp trị → bài thuốc", bang: "bai_thuoc_phap_tri", trai: "id_bai_thuoc", phai: "id_phap_tri", goc: "phap_tri", gocKhoa: "id", kg: null },
	{ tang: "T3", ten: "pháp trị → kinh mạch", bang: "phap_tri_kinh_mach", trai: "id_kinh_mach", phai: "id_phap_tri", goc: "phap_tri", gocKhoa: "id", kg: null },
	{ tang: "T3", ten: "thể bệnh → phương huyệt", bang: "the_benh_phuong_huyet", trai: "id_huyet", phai: "id_the_benh", goc: "the_benh", gocKhoa: "id", kg: "app" },
	// ── T4 tầng người tìm ──
	{ tang: "T4", ten: "triệu chứng → pháp trị", bang: "phap_tri_trieu_chung", trai: "id_phap_tri", phai: "id_trieu_chung", goc: "trieu_chung", gocKhoa: "id", kg: null },
	{ tang: "T4", ten: "triệu chứng → bài thuốc", bang: "trieu_chung_bai_thuoc_phap_tri", trai: "id_bai_thuoc", phai: "id_trieu_chung", goc: "trieu_chung", gocKhoa: "id", kg: null },
	{ tang: "T4", ten: "triệu chứng → bệnh", bang: "quan_he_benh_trieu_chung", trai: "id_benh_tay_y", phai: "id_trieu_chung", goc: "trieu_chung", gocKhoa: "id", kg: null },
	{ tang: "T4", ten: "triệu chứng → HUYỆT", bang: null, trai: null, phai: null, goc: "trieu_chung", gocKhoa: "id", kg: null, lo: "không có bảng — người tìm gõ triệu chứng mà không tới được huyệt nào" },
];

const n0 = (x) => Number(x ?? 0) || 0;

async function main() {
	const e = docEnv(`${GOC}/.env`);
	const kho = new pg.Client({
		host: e.DB_HOST,
		port: Number(e.DB_PORT || 5432),
		user: e.DB_USER,
		password: e.DB_PASSWORD,
		database: e.DB_NAME,
		ssl: e.CA_CERTIFICATE ? { ca: e.CA_CERTIFICATE, rejectUnauthorized: true } : { rejectUnauthorized: false },
		connectionTimeoutMillis: 30_000,
	});
	await kho.connect();
	const q = async (sql) => (await kho.query(sql)).rows;
	let hong = 0;

	console.log("ĐỒ THỊ TRI THỨC — đo " + new Date().toISOString().slice(0, 10) + " trên " + e.DB_NAME + "\n");
	console.log("  tầng  cạnh                            số cạnh   phủ đầu phải");
	console.log("  ────  ──────────────────────────────  ───────   ────────────");
	let tangTruoc = "";
	for (const c of CANH) {
		if (c.tang !== tangTruoc && tangTruoc) console.log("");
		tangTruoc = c.tang;
		let soCanh = 0;
		let phu = "";
		if (!c.bang) {
			const tong = c.goc ? n0((await q(`SELECT count(*)::int n FROM ${c.goc}`))[0].n) : 0;
			phu = `0 / ${tong} = 0%  ← LỖ: ${c.lo}`;
		} else {
			soCanh = n0((await q(`SELECT count(*)::int n FROM ${c.bang}`))[0].n);
			const co = n0((await q(`SELECT count(DISTINCT ${c.phai})::int n FROM ${c.bang}`))[0].n);
			if (c.goc) {
				const tong = n0((await q(`SELECT count(*)::int n FROM ${c.goc}`))[0].n);
				phu = `${co} / ${tong} = ${tong ? Math.round((co / tong) * 100) : 0}%`;
			} else {
				phu = `${co} mục (khoá ${c.kg})`;
			}
		}
		console.log(`  ${c.tang}    ${c.ten.padEnd(30)}  ${String(soCanh).padStart(7)}   ${phu}`);
	}

	// ── Mồ côi: nút của tầng người tìm không nối gì ──────────────────────────────────────
	const moCoi = n0(
		(
			await q(`SELECT count(*)::int n FROM trieu_chung t
			 WHERE NOT EXISTS (SELECT 1 FROM phap_tri_trieu_chung p WHERE p.id_trieu_chung = t.id)
			   AND NOT EXISTS (SELECT 1 FROM trieu_chung_bai_thuoc_phap_tri b WHERE b.id_trieu_chung = t.id)
			   AND NOT EXISTS (SELECT 1 FROM quan_he_benh_trieu_chung k WHERE k.id_trieu_chung = t.id)`)
		)[0].n,
	);
	const tongTc = n0((await q(`SELECT count(*)::int n FROM trieu_chung`))[0].n);
	console.log(`\n  triệu chứng MỒ CÔI (không nối gì): ${moCoi} / ${tongTc} = ${Math.round((moCoi / tongTc) * 100)}%`);

	// ── Phép kiểm KHÔNG GIAN: nối sai phải bị bắt ────────────────────────────────────────
	console.log("\n── phép kiểm không gian danh tính huyệt ──");
	const dai = async (b, c) => (await q(`SELECT min(${c})::int lo, max(${c})::int hi, count(DISTINCT ${c})::int n FROM ${b}`))[0];
	const app = await dai("huyet_vi", "id_huyet");
	const td = await dai("nguon_huyet", "huyet_id");
	const cau = n0((await q(`SELECT count(id_tu_dien)::int n FROM huyet_vi`))[0].n);
	console.log(`  huyet_vi.id_huyet    ${app.lo}–${app.hi} (${app.n} id) — không gian app`);
	console.log(`  nguon_huyet.huyet_id ${td.lo}–${td.hi} (${td.n} id) — không gian từ điển`);
	console.log(`  cầu huyet_vi.id_tu_dien phủ ${cau} / ${app.n} dòng app`);

	// Nối SAI (id_huyet) so với nối ĐÚNG (id_tu_dien). Nối sai vẫn ra số → phải khác nhau rõ.
	const sai = n0((await q(`SELECT count(DISTINCT n.huyet_id)::int n FROM nguon_huyet n JOIN huyet_vi h ON h.id_huyet = n.huyet_id`))[0].n);
	const dung = n0((await q(`SELECT count(DISTINCT n.huyet_id)::int n FROM nguon_huyet n JOIN huyet_vi h ON h.id_tu_dien = n.huyet_id`))[0].n);
	const batDuoc = sai !== dung;
	console.log(`  nối SAI  (ON h.id_huyet   = n.huyet_id): ${sai} id — KHÔNG lỗi, KHÔNG cảnh báo, và SAI`);
	console.log(`  nối ĐÚNG (ON h.id_tu_dien = n.huyet_id): ${dung} id`);
	console.log(`  ${batDuoc ? "✓" : "✗"} hai cách nối cho số khác nhau → phép kiểm còn bắt được bẫy`);
	if (!batDuoc) {
		hong++;
		console.log("    ✗ Hai cách nối ra cùng một số: phép kiểm này mất tác dụng canh chừng.");
		console.log("      Hoặc dữ liệu đã đổi, hoặc hai không gian đã được gộp — đọc lại đặc tả trước khi tin.");
	}
	// Mọi bảng khai kg:"app" phải khớp 100% vào huyet_vi.id_huyet, nếu không là khai sai.
	for (const c of CANH.filter((x) => x.kg === "app" && x.bang)) {
		const tong = n0((await q(`SELECT count(DISTINCT ${c.trai})::int n FROM ${c.bang}`))[0].n);
		const khop = n0((await q(`SELECT count(DISTINCT t.${c.trai})::int n FROM ${c.bang} t JOIN huyet_vi h ON h.id_huyet = t.${c.trai}`))[0].n);
		const dat = tong === khop;
		if (!dat) hong++;
		console.log(`  ${dat ? "✓" : "✗"} ${c.bang}.${c.trai} khai "app": khớp ${khop}/${tong} vào huyet_vi.id_huyet`);
	}

	console.log("\n── trục ngang: từ vựng dùng chung ──");
	for (const b of ["chu_tri", "cong_dung", "kieng_ky", "trieu_chung"]) {
		console.log(`  ${b.padEnd(12)} ${String(n0((await q(`SELECT count(*)::int n FROM ${b}`))[0].n)).padStart(5)} mục`);
	}
	const dungChuTri = n0((await q(`SELECT count(*)::int n FROM chu_tri c WHERE EXISTS (SELECT 1 FROM vi_thuoc_chu_tri v WHERE v.id_chu_tri = c.id)`))[0].n);
	console.log(`  trong đó chu_tri đang được vị thuốc dùng: ${dungChuTri}`);

	await kho.end();
	console.log(hong ? `\n✗ ${hong} phép kiểm không gian TRƯỢT — đừng dựng cạnh mới trước khi gỡ.` : "\n✓ Mọi phép kiểm không gian đều đạt.");
	process.exit(hong ? 1 : 0);
}

main().catch((e) => {
	console.error("✗ lỗi:", e?.message ?? e);
	process.exit(2);
});
