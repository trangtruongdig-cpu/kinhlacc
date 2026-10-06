/**
 * NGHIỆM THU hàng đợi việc (màn Việc, phần A) — CHỈ ĐỌC.
 *
 * Phép kiểm trong `lib/xep-viec.test.mjs` chạy trên bàn thử, nên nó chứng minh LUẬT đúng chứ
 * không chứng minh kho thật có việc. Script này dựng `PluginStorageRepository` ngoài Astro bằng
 * Kysely + pg.Pool — cùng lối đã dùng để lần ra lỗi `mcp-bridge.mjs` — rồi chạy đúng phép gom
 * của route `viec`.
 *
 * ⚠️ Mở MỘT kết nối rồi đóng ngay: Aiven trần 20 và hệ thống của chính Aiven đã ăn 8.
 *
 *   node cms/scripts-di-cu/nghiem-thu-hang-doi-viec.mjs
 */
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { PluginStorageRepository } from "emdash";
import { xepHangDoi, tomTatTuan } from "../src/plugins/rada-seo/lib/xep-viec.mjs";
import { tongHopLoaiSua } from "../src/plugins/rada-seo/leo-top/vong-hoc.mjs";
import { laySucKhoeNen } from "../src/plugins/rada-seo/khoang-trong/ho-so.mjs";
import * as kho from "../src/plugins/rada-seo/kho.mjs";
import { KHAI_BAO_KHO } from "../src/plugins/rada-seo/kho.mjs";

const bien = (...ten) => {
	for (const t of ten) if (process.env[t]) return process.env[t];
	return undefined;
};

const pool = new pg.Pool({
	host: bien("DB_HOST", "PGHOST"),
	port: Number(bien("DB_PORT", "PGPORT") ?? 5432),
	user: bien("DB_USER", "PGUSER"),
	password: bien("DB_PASSWORD", "PGPASSWORD"),
	database: bien("DB_NAME", "PGDATABASE"),
	ssl: { rejectUnauthorized: false },
	max: 1,
	idleTimeoutMillis: 1000,
});
const db = new Kysely({ dialect: new PostgresDialect({ pool }) });

// ⚠️ Index phải lấy từ KHAI_BAO_KHO, không đoán: EmDash chỉ cho `orderBy` trên trường CÓ index,
// và `dsHuong` xếp theo `diem`, `dsKeHoach`/`dsLeoTop` theo `taoLuc`. Truyền `undefined` thì
// constructor ném ngay ("indexes is not iterable").
const bo = (ten) => new PluginStorageRepository(db, "rada-seo", ten, KHAI_BAO_KHO[ten]?.indexes ?? []);
const storage = { huong: bo("huong"), ke_hoach: bo("ke_hoach"), leo_top: bo("leo_top"), goi_y_nguoc: bo("goi_y_nguoc") };

try {
	const vao = { huong: [], keHoach: [], leoTop: [], goiYNguoc: [], suaNho: null, loiKho: "" };
	try {
		vao.huong = await kho.dsHuong(storage);
		vao.keHoach = await kho.dsKeHoach(storage);
		vao.leoTop = await kho.dsLeoTop(storage);
		vao.goiYNguoc = await kho.tatCa(storage.goi_y_nguoc);
	} catch (e) {
		vao.loiKho = String(e?.message ?? e).slice(0, 160);
	}

	console.log("KHO THẬT:");
	console.log(`  hướng        ${vao.huong.length}\t(chờ nhận: ${vao.huong.filter((h) => h.trangThai === "de_xuat").length})`);
	console.log(`  bài dự kiến  ${vao.keHoach.length}\t(chờ duyệt: ${vao.keHoach.filter((k) => k.trangThai === "de_xuat").length}, có nháp/cần xem: ${vao.keHoach.filter((k) => k.trangThai === "co_nhap" || k.trangThai === "can_xem").length})`);
	console.log(`  phiên leo top ${vao.leoTop.length}\t(có phiếu: ${vao.leoTop.filter((p) => p.trangThai === "co_phieu").length})`);
	console.log(`  sổ mạng nhện ${vao.goiYNguoc.length}\t(đề xuất: ${vao.goiYNguoc.reduce((n, r) => n + (r.data?.ds?.length ?? 0), 0)})`);
	if (vao.loiKho) console.log(`  ⚠️ đọc kho hỏng: ${vao.loiKho}`);

	// Hai lượt: CHƯA dò sơ hở (như lúc mở màn lần đầu) và ĐÃ dò nhưng rỗng.
	for (const [nhan, suaNho] of [["chưa dò sơ hở", null], ["đã dò, không có việc rẻ", { kq: { ds: [] } }]]) {
		const r = xepHangDoi({ ...vao, suaNho });
		console.log(`\nHÀNG ĐỢI (${nhan}): ${r.tong} việc`);
		if (r.cauRong) console.log(`  rỗng vì: ${r.cauRong}`);
		for (const v of r.viec.slice(0, 12)) console.log(`  ${String(v.bac).padStart(2)}. ${v.nhan} — ${String(v.ten ?? "").slice(0, 60)}`);
		if (r.tong > 12) console.log(`  … và ${r.tong - 12} việc nữa`);
		console.log(`  huy hiệu theo tab: ${JSON.stringify(r.demTab)}`);
	}

	// VÒNG NỀN — hỏi sang backend. Hỏng thì NÓI RA, không im lặng.
	const n = await laySucKhoeNen();
	if (n.ok) vao.nen = n.nen;
	else vao.loiNen = n.loi;
	const rNen = xepHangDoi(vao);
	console.log("\nVÒNG NỀN:");
	if (n.ok) {
		for (const b of n.nen?.nguon ?? []) console.log(`  ${b.ten.padEnd(12)} ${String(b.co).padStart(6)}/${String(b.tong).padEnd(7)} ${b.pt === null ? "chưa có mục" : b.pt + "%"}`);
		console.log(`  semantic: ${n.nen?.semantic?.soCum} cụm · ${n.nen?.semantic?.chuTriNhieuCum} chủ trị nằm nhiều cụm`);
	} else console.log(`  ⚠️ ${n.loi}`);
	console.log(`  KHOANG VÁ NỀN: ${rNen.vaNen.length} việc (trần 3)`);
	for (const v of rNen.vaNen) console.log(`    · ${v.ten}`);
	if (rNen.cauNen) console.log(`    ${rNen.cauNen}`);

	const tuan = tomTatTuan(vao);
	console.log(`\nSỔ VIỆC TUẦN: ${tuan.cau}`);
	const vh = tongHopLoaiSua(vao.leoTop);
	console.log(`VÒNG HỌC: ${vh.bang.length} loại sửa có số đo · ${vh.soPhienDoDuoc} phiên đo được · ${vh.soPhienChuaDu} phiên chưa đủ`);
	for (const g of vh.ghiChu ?? []) console.log(`  ⚠️ ${g}`);
} finally {
	await db.destroy();
}
