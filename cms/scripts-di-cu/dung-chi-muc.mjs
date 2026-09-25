#!/usr/bin/env node
// dung-chi-muc.mjs — Cài tầng tra cứu (sql/chi-muc-tra-cuu.sql), khai báo các mục
// thư viện, gắn trigger đồng bộ và dựng lại chỉ mục.
//
// Chạy lại được bao nhiêu lần cũng được.
//   node scripts-di-cu/dung-chi-muc.mjs           # cài + dựng lại tất cả
//   node scripts-di-cu/dung-chi-muc.mjs benh_hoc  # chỉ dựng lại một bộ

import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const { Client } = require("pg");
const GOC = join(dirname(fileURLToPath(import.meta.url)), "..");

// ── Khai báo các mục của thư viện ──────────────────────────────────────
// Thêm mục mới: chèn một dòng ở đây rồi chạy lại script. `than` là những cột
// góp vào phần tìm theo nội dung; `tenKhac` góp vào phần tìm theo tên gọi khác.
export const MUC = [
	{
		bo: "huyet_vi", nhan: "Huyệt Vị · Châm Cứu", duongDan: "/huyet/", thuTu: 10,
		moTa: "Vị trí, tác dụng, chủ trị và cách châm cứu từng huyệt.",
		tenKhac: ["ma_huyet"], than: ["noi_dung", "pho_huyet", "ghi_chu", "tham_khao"],
	},
	{
		bo: "kinh_mach", nhan: "Lý Thuyết · Tra Cứu Kinh", duongDan: "/kinh/", thuTu: 20,
		moTa: "Mười hai chính kinh, tám mạch kỳ kinh: đường vận hành và chủ trị.",
		tenKhac: ["ten_khac", "ma", "tom_tat_huyet"],
		than: ["dai_cuong", "dac_tinh", "van_hanh", "duong_chinh", "kinh_can", "kinh_biet", "lac_doc", "lac_ngang", "trieu_chung", "chu_tri", "dieu_tri"],
	},
	{
		bo: "cham_cuu_tri_benh", nhan: "Châm Cứu Trị Bệnh", duongDan: "/cham-cuu-tri-benh/", thuTu: 30,
		moTa: "Phép châm cứu theo từng chứng bệnh.",
		tenKhac: [], than: ["dai_cuong", "nguyen_nhan", "trieu_chung", "dieu_tri"],
	},
	{
		bo: "benh_hoc", nhan: "Bệnh Học", duongDan: "/benh-hoc/", thuTu: 40,
		moTa: "Bệnh danh Đông Y: nguyên nhân, chẩn đoán, điều trị, bệnh án.",
		tenKhac: ["doi_chieu_benh_danh"],
		than: ["dai_cuong", "nguyen_nhan", "chan_doan", "dieu_tri", "benh_an", "tham_khao"],
	},
	{
		bo: "duoc_lieu", nhan: "Dược Liệu", duongDan: "/duoc-lieu/", thuTu: 50,
		moTa: "Vị thuốc: tính vị, quy kinh, công dụng, liều dùng, kiêng kỵ.",
		tenKhac: ["ten_khac", "ten_khoa_hoc", "ten_han"],
		than: ["mo_ta", "tinh_vi", "cong_dung", "chu_tri", "lieu_dung", "bao_che", "kieng_ky", "don_thuoc", "tham_khao"],
	},
	{
		bo: "bai_thuoc", nhan: "Bài Thuốc", duongDan: "/bai-thuoc/", thuTu: 60,
		moTa: "Cổ phương: thành phần, cách dùng, tác dụng, xuất xứ.",
		tenKhac: [], than: ["thanh_phan", "cach_dung", "tac_dung", "xuat_xu", "ghi_chu"],
	},
	{
		bo: "nguon_y_van", nhan: "Thư Mục Nguồn", duongDan: "/nguon/", thuTu: 70,
		moTa: "Sổ cái y văn: sách và tác giả được trích dẫn trong thư viện.",
		tenKhac: ["ten_khac", "tac_gia"], than: ["ghi_chu", "nien_dai", "loai"],
	},
	{
		bo: "bai_viet", nhan: "Bài Viết", duongDan: "/blog/", thuTu: 90,
		moTa: "Bài viết biên soạn mới.",
		tenKhac: [], than: ["description", "content"],
	},
];

async function noi() {
	const env = parseEnv(readFileSync(join(GOC, ".env"), "utf8"));
	const c = new Client({
		host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER,
		password: env.PGPASSWORD, database: env.PGDATABASE,
		ssl: { ca: readFileSync(join(GOC, "aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
	});
	await c.connect();
	return c;
}

const chiMot = process.argv[2];
const c = await noi();

try {
	console.log("① Cài hàm, bảng, trigger…");
	await c.query(readFileSync(join(GOC, "sql/chi-muc-tra-cuu.sql"), "utf8"));

	console.log("② Khai báo các mục thư viện…");
	for (const m of MUC) {
		await c.query(
			`INSERT INTO td_cau_hinh (bo, nhan, duong_dan, cot_ten_khac, cot_than, thu_tu, mo_ta)
			 VALUES ($1,$2,$3,$4,$5,$6,$7)
			 ON CONFLICT (bo) DO UPDATE SET nhan=EXCLUDED.nhan, duong_dan=EXCLUDED.duong_dan,
			   cot_ten_khac=EXCLUDED.cot_ten_khac, cot_than=EXCLUDED.cot_than,
			   thu_tu=EXCLUDED.thu_tu, mo_ta=EXCLUDED.mo_ta`,
			[m.bo, m.nhan, m.duongDan, m.tenKhac, m.than, m.thuTu, m.moTa],
		);
	}

	console.log("③ Gắn trigger + dựng lại chỉ mục…");
	for (const m of MUC) {
		if (chiMot && m.bo !== chiMot) continue;
		const co = await c.query("SELECT to_regclass($1) IS NOT NULL AS co", [`ec_${m.bo}`]);
		if (!co.rows[0].co) {
			console.log(`   ⟂ ${m.nhan.padEnd(24)} chưa có bảng ec_${m.bo} — bỏ qua`);
			continue;
		}
		await c.query("SELECT td_gan_trigger($1)", [m.bo]);
		const t0 = Date.now();
		const n = await c.query("SELECT td_dung_lai($1) AS n", [m.bo]);
		console.log(`   ✓ ${m.nhan.padEnd(24)} ${String(n.rows[0].n).padStart(6)} mục  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
	}

	const tong = await c.query("SELECT count(*)::int n FROM td_muc");
	console.log(`\nTổng chỉ mục: ${tong.rows[0].n} mục từ.`);
} finally {
	await c.end();
}
