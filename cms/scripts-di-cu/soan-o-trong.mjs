// soan-o-trong.mjs — Soạn HỒ SƠ (không ghi CSDL) cho 60 ô còn trống của ec_huyet_vi:
// giai_phau (4), tac_dung (33), pho_huyet (23) — trên 358 huyệt có mã quốc tế.
//
// CHỈ ĐỌC csdl để lấy danh sách ô trống, rồi đối chiếu với hai nguồn tĩnh:
//   - cms/.tam-focks/hoso.json            — 359 mục bóc từ Atlas of Acupuncture (Focks),
//                                            bản Việt hoá Phùng Văn Chiến. {ma,ten,trang,tacDung,nguyenVan}
//   - backend/src/acu-solver/giai-phau-data.json — 361 mục giải phẫu CÓ CẤU TRÚC
//                                            (duoiDa/thanKinh/tietDoan/goc/sau/huong/gpRaw).
// Bản viết lại (banVietLai) do người soạn (Claude) đọc nguồn rồi diễn đạt lại bằng lời
// riêng — nằm trong bảng DUYET dưới đây, KHÔNG sinh tự động, để giữ đúng lối văn của
// từng mục (giải phẫu / cổ văn tác dụng / phối huyệt có trích dẫn).
//
// Đầu ra: cms/.tam-focks/o-trong.json — mỗi dòng
//   {slug, ma, ten, o, trangSach, nhapTuSach, banVietLai, khongCoNguon, daDuyet:false}
// Không ghi bảng ec_huyet_vi. Một kết nối, đóng ngay sau khi đọc xong.
//
//   node scripts-di-cu/soan-o-trong.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const goc = resolve(here, "../..");
const require = createRequire(import.meta.url);
const { Client } = require(resolve(goc, "cms/node_modules/pg"));

// ── Bảng bản nháp do người soạn viết tay, khoá theo "MA|o" (MA = ma_huyet THẬT trong CSDL,
// kể cả hai mã lệch: "K23" thiếu chữ I, "HE2/HE4/HE6" dùng tiền tố HE thay vì HT của nguồn) ──
const DUYET = {
	// ===== giai_phau (4 ô) — chỉ HT6/Ẩm Khích có đủ dữ liệu giải phẫu có cấu trúc =====
	"HE6|giai_phau": {
		banVietLai:
			"Dưới da là khe giữa gân cơ trụ trước và gân cơ gấp chung nông các ngón tay, bờ trong gân cơ gấp chung sâu các ngón tay, cơ sấp vuông, xương trụ.\n" +
			"Thần kinh vận động cơ là các nhánh của dây thần kinh giữa và dây thần kinh trụ.\n" +
			"Da vùng huyệt chi phối bởi tiết đoạn thần kinh D1.",
	},
	"GB33|giai_phau": { khongCoNguon: true },
	"LR14|giai_phau": { khongCoNguon: true },
	"ST25|giai_phau": { khongCoNguon: true },

	// ===== tac_dung (33 ô) — cô đọng lại cụm ĐỘNG TỪ cổ văn từ nguyenVan (bỏ danh sách
	// chỉ định lâm sàng — phần đó đã có ở mục "Công dụng theo nhóm chỉ định"), giữ nguyên
	// các cụm Hán Việt nguồn tự ngoặc rõ (vd. "(bình suyễn)", "(định phách)") =====
	"BL10|tac_dung": {
		banVietLai:
			"Điều hòa khí, bình phong, an thần, hỗ trợ đầu và các giác quan; khai thông kinh lạc, giảm đau; tăng cường sức mạnh vùng lưng dưới.",
	},
	"BL29|tac_dung": {
		banVietLai: "Tăng cường sức mạnh vùng lưng dưới; chữa cảm, cầm tiêu chảy.",
	},
	"BL37|tac_dung": {
		banVietLai: "Thông kinh mạch, giảm đau, hỗ trợ vùng lưng dưới.",
	},
	"BL38|tac_dung": {
		banVietLai: "Thư giãn gân cốt, giảm đau; thanh nhiệt (ở ruột non).",
	},
	"BL42|tac_dung": {
		banVietLai:
			"Bổ dưỡng Phế, bình suyễn, định phách; thông kinh lạc, giảm đau; thanh Phế nhiệt.",
	},
	"BL46|tac_dung": {
		banVietLai:
			"Điều hòa cơ hoành, giáng khí nghịch, điều hòa trung tiêu; thông kinh mạch, giảm đau.",
	},
	"CV2|tac_dung": {
		banVietLai: "Lợi tiểu tiện, ôn dương, bổ Thận; điều hòa (khí huyết) chi dưới.",
	},
	"CV21|tac_dung": {
		banVietLai: "Mở lồng ngực, hỗ trợ họng, giảm khí nghịch.",
	},
	"GB10|tac_dung": {
		banVietLai: "Thanh nhiệt, thông họng, thông kinh, giảm đau.",
	},
	"GB35|tac_dung": {
		banVietLai:
			"Thông kinh mạch, giảm đau (chứng tý ở chi dưới); điều hòa Đảm khí, an thần.",
	},
	"GB38|tac_dung": {
		banVietLai:
			"Thông kinh mạch, thanh nhiệt, giảm đau, lợi gân xương; điều hòa kinh Thiếu Dương.",
	},
	"GV28|tac_dung": {
		banVietLai: "Thanh nhiệt, lợi nướu răng, mắt và mũi.",
	},
	"HE4|tac_dung": {
		banVietLai: "Thông kinh, thư giãn gân cơ; an thần; lợi giọng nói.",
	},
	"HE6|tac_dung": {
		banVietLai:
			"Bổ và điều hòa Tâm âm, Tâm huyết; thanh nhiệt, trấn Tâm; trị các chứng cấp.",
	},
	"K23|tac_dung": {
		banVietLai:
			"Điều hòa Phế khí và Vị khí nghịch, khai thông lồng ngực; hỗ trợ sản phụ.",
	},
	"KI17|tac_dung": { banVietLai: "Trừ ứ trệ, giảm đau." },
	"KI18|tac_dung": {
		banVietLai:
			"Điều hòa khí và hạ tiêu, vận hành huyết ứ, điều hòa dạ dày, giảm đau.",
	},
	"KI19|tac_dung": { banVietLai: "Điều hòa nghịch khí, điều hòa dạ dày." },
	"KI25|tac_dung": { banVietLai: "Điều hòa Phế khí và Vị khí nghịch; mở ngực." },
	"KI26|tac_dung": {
		banVietLai: "Điều hòa Phế khí và Vị khí nghịch, hóa đàm; mở ngực; hỗ trợ sản phụ.",
	},
	"KI27|tac_dung": {
		banVietLai: "Điều hòa Phế khí và Vị khí nghịch, hóa đàm; mở ngực.",
	},
	"LR10|tac_dung": { banVietLai: "Thanh nhiệt, lợi tiểu tiện; thư giãn gân cơ." },
	"LR11|tac_dung": { banVietLai: "Hỗ trợ tử cung; thư giãn gân." },
	"LR14|tac_dung": {
		banVietLai:
			"Điều hòa Can khí, Can huyết (nhất là ở thượng và trung tiêu), lương huyết, tiêu tích trệ, điều hòa Can Vị.",
	},
	"SI10|tac_dung": { banVietLai: "Thông kinh mạch, thư giãn gân." },
	"SI5|tac_dung": {
		banVietLai:
			"Thanh nhiệt, tiêu sưng; là huyệt Hỏa của kinh Tiểu Trường, tả nhiệt ở Tâm qua quan hệ biểu-lý, kiêm an thần.",
	},
	"SP20|tac_dung": { khongCoNguon: true },
	"SP7|tac_dung": { banVietLai: "Bổ Tỳ, trừ thấp, lợi tiểu tiện." },
	"ST14|tac_dung": { banVietLai: "Giáng nghịch khí, điều khí; mở lồng ngực." },
	"ST15|tac_dung": {
		banVietLai:
			"Hạ Phế khí nghịch; mở lồng ngực; hỗ trợ (nhũ) ngực; giảm đau và ngứa ngoài da.",
	},
	"ST17|tac_dung": { khongCoNguon: true },
	"ST32|tac_dung": { banVietLai: "Thông kinh lạc, giảm đau, trừ phong thấp." },
	"TE13|tac_dung": { banVietLai: "Thông kinh lạc, giảm đau; hành khí, hóa đàm." },

	// ===== pho_huyet (23 ô) — không nguồn nào (hoso.json lẫn giai-phau-data.json) có
	// công thức phối huyệt kèm trích dẫn kinh điển; để trống hết theo đúng luật
	// "không bịa trích dẫn khi nguồn không nói" =====
};

const KHONG_CO_NGUON_MAC_DINH_PHO_HUYET =
	"Không có nguồn: hoso.json (Focks) chỉ có mục 'tacDung'/'nguyenVan' — mô tả công năng " +
	"& chỉ định lâm sàng, KHÔNG có công thức phối huyệt kèm trích dẫn kinh điển (kiểu " +
	"'Phối X (mã) trị Y (Sách Z)'). giai-phau-data.json cũng không có trường phối huyệt. " +
	"Không bịa trích dẫn khi nguồn không nói → để khongCoNguon.";

// ── Chuẩn hoá mã để tra hoso.json / giai-phau-data.json (hai lỗi lệch mã đã đo được) ──
function chuanHoaMa(ma) {
	let m = ma;
	if (/^K\d+$/.test(m)) m = "KI" + m.slice(1); // CSDL gõ thiếu chữ I
	if (/^HE\d+$/.test(m)) m = "HT" + m.slice(2); // CSDL dùng HE (Heart), nguồn Focks dùng HT
	return m;
}

// Dọn nhiễu OCR/PDF: dòng chân trang lặp "Phùng Văn Chiến... HUYỆT VỊ CHÂM CỨU THƯỜNG DÙNG <số trang>"
function donNguyenVan(nv) {
	if (!nv) return "";
	return nv
		.replace(/Phùng Văn Chiến \(Việt hoá, biên soạn, chế hình\)\s*/g, "")
		.replace(/HUYỆT VỊ CHÂM CỨU THƯỜNG DÙNG\s*\d*/g, "")
		.replace(/[ \t]*\n[ \t]*/g, " ")
		.replace(/\s{2,}/g, " ")
		.replace(/●/g, "\n●")
		.trim();
}

async function main() {
	const env = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
	const kho = new Client({
		host: env.PGHOST,
		port: +env.PGPORT,
		user: env.PGUSER,
		password: env.PGPASSWORD,
		database: env.PGDATABASE,
		ssl: {
			ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"),
			rejectUnauthorized: true,
		},
	});
	await kho.connect();

	const rong = (col) => `(${col} IS NULL OR ${col}::text = '[]' OR ${col}::text = 'null')`;

	// (1) đếm trước khi soạn — để đối chiếu lại ở cuối, chứng minh KHÔNG có ghi nào xảy ra
	const demTruoc = await kho.query(`
		SELECT
			COUNT(*) FILTER (WHERE ${rong("giai_phau")}) AS giai_phau,
			COUNT(*) FILTER (WHERE ${rong("tac_dung")}) AS tac_dung,
			COUNT(*) FILTER (WHERE pho_huyet IS NULL OR pho_huyet = '') AS pho_huyet
		FROM ec_huyet_vi
		WHERE deleted_at IS NULL AND ma_huyet IS NOT NULL AND ma_huyet <> ''`);

	// (2) danh sách 60 ô
	const rows = await kho.query(`
		SELECT slug, ma_huyet AS ma, title AS ten,
			${rong("giai_phau")} AS thieu_gp,
			${rong("tac_dung")} AS thieu_td,
			(pho_huyet IS NULL OR pho_huyet = '') AS thieu_ph
		FROM ec_huyet_vi
		WHERE deleted_at IS NULL AND ma_huyet IS NOT NULL AND ma_huyet <> ''
			AND (${rong("giai_phau")} OR ${rong("tac_dung")} OR (pho_huyet IS NULL OR pho_huyet = ''))
		ORDER BY ma_huyet`);

	await kho.end(); // đóng kết nối NGAY sau khi đọc xong — không giữ, không ghi gì

	const oTrong = [];
	for (const r of rows.rows) {
		const cot = [];
		if (r.thieu_gp) cot.push("giai_phau");
		if (r.thieu_td) cot.push("tac_dung");
		if (r.thieu_ph) cot.push("pho_huyet");
		for (const o of cot) oTrong.push({ slug: r.slug, ma: r.ma, ten: r.ten, o });
	}

	if (oTrong.length !== 60) {
		console.error(`⚠️  Đếm được ${oTrong.length} ô, KHÔNG phải 60 như đặc tả — dừng lại để kiểm tra.`);
		process.exit(1);
	}

	// nguồn tĩnh
	const hoso = JSON.parse(readFileSync(resolve(goc, "cms/.tam-focks/hoso.json"), "utf8"));
	const hosoByMa = new Map(hoso.map((h) => [h.ma.toUpperCase(), h]));
	const giaiPhau = JSON.parse(
		readFileSync(resolve(goc, "backend/src/acu-solver/giai-phau-data.json"), "utf8"),
	).points;

	const ketQua = oTrong.map((row) => {
		const maChuan = chuanHoaMa(row.ma);
		const h = hosoByMa.get(maChuan) || null;
		const gp = giaiPhau[maChuan] || null;
		const duyet = DUYET[`${row.ma}|${row.o}`];

		let trangSach = h ? h.trang : null;
		let nhapTuSach = "";
		let banVietLai = "";
		let khongCoNguon = true;

		if (row.o === "giai_phau") {
			const coGiaiPhauThat = gp && (gp.gpRaw || gp.duoiDa?.length || gp.thanKinh || gp.tietDoan);
			if (coGiaiPhauThat) {
				nhapTuSach =
					`[Nguồn: backend/src/acu-solver/giai-phau-data.json, mã ${maChuan} — dữ liệu giải phẫu ` +
					`có cấu trúc của app, KHÔNG phải trích sách Focks]\n${gp.gpRaw}`;
				trangSach = null; // không phải trang sách — nguồn là tệp JSON, ghi rõ trong nhapTuSach
			} else {
				nhapTuSach =
					`hoso.json (Focks, tr. ${h ? h.trang : "?"}, mã ${maChuan}) chỉ có mục 'tacDung' ` +
					`(công năng & chỉ định lâm sàng), KHÔNG có mục giải phẫu. ` +
					`giai-phau-data.json có mã ${maChuan} nhưng duoiDa=[], thanKinh='', tietDoan='' ` +
					`(chỉ có thông số kỹ thuật châm: goc=${JSON.stringify(gp?.goc)}, sau=${JSON.stringify(gp?.sau)}) ` +
					`— không đủ để viết một mục giải phẫu đúng nghĩa.`;
				trangSach = h ? h.trang : null;
			}
		} else if (row.o === "tac_dung") {
			if (h) {
				nhapTuSach = `(hoso.json, Focks tr. ${h.trang}, mã ${maChuan})\n${donNguyenVan(h.nguyenVan)}`;
			} else {
				nhapTuSach =
					`Không có mục ứng với mã ${maChuan} trong hoso.json (359 mục bóc từ Atlas Focks — ` +
					`sách không có phần công năng cho huyệt này, hoặc bị bỏ sót khi bóc PDF). ` +
					`giai-phau-data.json có mã ${maChuan} nhưng chỉ chứa dữ liệu giải phẫu, không có công năng cổ văn.`;
			}
		} else if (row.o === "pho_huyet") {
			nhapTuSach = h
				? `(hoso.json, Focks tr. ${h.trang}, mã ${maChuan}) — không có đoạn phối huyệt tương ứng.\n` +
					KHONG_CO_NGUON_MAC_DINH_PHO_HUYET
				: KHONG_CO_NGUON_MAC_DINH_PHO_HUYET;
		}

		if (duyet && duyet.banVietLai) {
			banVietLai = duyet.banVietLai;
			khongCoNguon = false;
		} else {
			banVietLai = "";
			khongCoNguon = true;
		}

		return {
			slug: row.slug,
			ma: row.ma,
			ten: row.ten,
			o: row.o,
			trangSach,
			nhapTuSach,
			banVietLai,
			khongCoNguon,
			daDuyet: false,
		};
	});

	writeFileSync(
		resolve(goc, "cms/.tam-focks/o-trong.json"),
		JSON.stringify(ketQua, null, 2),
		"utf8",
	);

	// (3) đếm lại SAU khi soạn xong, mở một kết nối MỚI, ngắn, chỉ đọc — chứng minh không đổi
	const kho2 = new Client({
		host: env.PGHOST,
		port: +env.PGPORT,
		user: env.PGUSER,
		password: env.PGPASSWORD,
		database: env.PGDATABASE,
		ssl: {
			ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"),
			rejectUnauthorized: true,
		},
	});
	await kho2.connect();
	const demSau = await kho2.query(`
		SELECT
			COUNT(*) FILTER (WHERE ${rong("giai_phau")}) AS giai_phau,
			COUNT(*) FILTER (WHERE ${rong("tac_dung")}) AS tac_dung,
			COUNT(*) FILTER (WHERE pho_huyet IS NULL OR pho_huyet = '') AS pho_huyet
		FROM ec_huyet_vi
		WHERE deleted_at IS NULL AND ma_huyet IS NOT NULL AND ma_huyet <> ''`);
	await kho2.end();

	console.log(`Đã xuất ${ketQua.length} dòng vào cms/.tam-focks/o-trong.json`);
	console.log(
		`  có nguồn để viết: ${ketQua.filter((r) => !r.khongCoNguon).length} · khongCoNguon: ${ketQua.filter((r) => r.khongCoNguon).length}`,
	);
	for (const o of ["giai_phau", "tac_dung", "pho_huyet"]) {
		const cua = ketQua.filter((r) => r.o === o);
		console.log(
			`  ${o}: tổng ${cua.length} · có nguồn ${cua.filter((r) => !r.khongCoNguon).length} · khongCoNguon ${cua.filter((r) => r.khongCoNguon).length}`,
		);
	}
	console.log("\nĐếm ô trống TRƯỚC khi chạy:", demTruoc.rows[0]);
	console.log("Đếm ô trống SAU khi chạy:  ", demSau.rows[0]);
	const khop =
		demTruoc.rows[0].giai_phau === demSau.rows[0].giai_phau &&
		demTruoc.rows[0].tac_dung === demSau.rows[0].tac_dung &&
		demTruoc.rows[0].pho_huyet === demSau.rows[0].pho_huyet;
	console.log(khop ? "✓ KHỚP — CSDL không bị ghi gì." : "✗ LỆCH — cần kiểm tra ngay!");
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
