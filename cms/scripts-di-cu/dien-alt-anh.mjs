// Điền ALT cho ảnh trong thư viện CMS.
//
// Đo 06/10/2026: bảng `media` có **2.561 ảnh và 0 ảnh có alt** — rỗng 100%. Hậu quả đã ghi
// trong CLAUDE.md: đường lùi chọn ảnh theo alt của lò viết (`viet/anh.mjs`) KHÔNG dùng được,
// vì nó khớp theo alt mà không ảnh nào có.
//
// ⚠️ Trang từ điển TĨNH thì KHÔNG hỏng: `build-dict.mjs` tự dựng alt từ tên mục
// ("Huyệt Hợp Cốc — trên da"). Chỗ thủng là bản ghi trong CMS — tức mọi nơi đọc alt từ kho:
// lò viết, khu quản trị, và bất kỳ trang nào do CMS dựng.
//
// SUY ALT TỪ ĐÂU: tên tệp có cấu trúc và nó là dữ liệu THẬT, không phải đoán.
//   <MÃ WHO>-<vai trò>.jpg   →  LI4-da.jpg, BL14-gp.jpg, KI7-lan.jpg, ST13-kinh.jpg
//   kinh-<NN>-<kiểu>.jpg     →  kinh-03-chinh.jpg, kinh-12-sodo.jpg
// Mã WHO tra sang `ec_huyet_vi.ma_huyet` để lấy TÊN THẬT. Không tra ra mã thì BỎ QUA ảnh đó —
// đặt alt bằng chính tên tệp là đổi một ô rỗng lấy một ô vô nghĩa, và sau này không ai phân
// biệt được "chưa điền" với "đã điền bằng rác".
//
// Chạy thử là mặc định; `--ghi` mới ghi thật — cùng lối `dong-bo-app.mjs`.

import pg from "pg";
import { readFileSync } from "node:fs";

/** Đúng chữ `ANH3D_NHAN` của build-dict.mjs: alt trong CMS và alt trên trang tĩnh phải khớp nhau. */
export const VAI_TRO = {
	da: "trên da",
	gp: "trên giải phẫu",
	lan: "huyệt lân cận",
	kinh: "toàn đường kinh",
	chinh: "sơ đồ đường kinh",
	ngang: "lát cắt ngang",
	sodo: "sơ đồ tổng quát",
};

/** @returns {{ma: string, vaiTro: string}|null} — null nghĩa là KHÔNG suy được, phải bỏ qua. */
export function docTenTep(ten) {
	const t = String(ten ?? "").replace(/\.[a-z0-9]+$/i, "");
	// Ảnh đường kinh: kinh-03-chinh / mach-02-sodo
	let m = t.match(/^(kinh|mach)-(\d+)-([a-z]+)$/i);
	if (m) return { ma: `${m[1].toLowerCase()}-${m[2]}`, vaiTro: m[3].toLowerCase(), loai: "kinh" };
	// Ảnh huyệt theo MÃ WHO: LI4-da / BL14-gp
	m = t.match(/^([A-Z]{2,3}\d{1,2}|GV\d{1,2}|CV\d{1,2})-([a-z]+)$/);
	if (m) return { ma: m[1].toUpperCase(), vaiTro: m[2].toLowerCase(), loai: "huyet" };
	// Ảnh đặt theo SLUG kèm số thứ tự: 1234-ha-quan.webp, 5678-an-mien-2.webp
	// Không có đuôi vai trò → ảnh đại diện, alt chỉ gồm tên mục. Vẫn hơn hẳn ô rỗng.
	m = t.match(/^\d+-([a-z0-9-]+?)(?:-\d+)?$/);
	if (m && m[1].length >= 2) return { ma: m[1], vaiTro: "", loai: "slug" };
	return null;
}

/**
 * Alt từ tên mục + vai trò. Không có tên mục hoặc không biết vai trò → null (bỏ qua).
 * @param {{ten: string, ma?: string}} muc
 */
export function dungAlt(muc, vaiTro) {
	if (!muc?.ten) return null;
	const ten = `${muc.ten}${muc.ma ? ` (${muc.ma})` : ""}`;
	// Không có vai trò (ảnh đặt theo slug) thì alt chỉ là tên mục — KHÔNG bịa thêm "trên da".
	if (!vaiTro) return ten;
	const v = VAI_TRO[vaiTro];
	return v ? `${ten} — ${v}` : null;
}

function docEnv(d) {
	const ra = {};
	let khoa = null,
		dem = [];
	for (const dong of readFileSync(d, "utf8").split("\n")) {
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
		if (v.startsWith('"') && !v.slice(1).endsWith('"')) {
			khoa = k;
			dem = [v.slice(1)];
		} else ra[k] = v.replace(/^"(.*)"$/, "$1");
	}
	return ra;
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const GHI = process.argv.includes("--ghi");
	const e = docEnv(new URL("../../backend/.env", import.meta.url).pathname);
	const c = new pg.Client({
		host: e.CMS_DB_HOST ?? e.DB_HOST,
		port: Number(e.CMS_DB_PORT || e.DB_PORT || 5432),
		user: e.CMS_DB_USER ?? e.DB_USER,
		password: e.CMS_DB_PASSWORD ?? e.DB_PASSWORD,
		database: e.CMS_DB_NAME ?? "kinhlac_cms",
		ssl: e.CA_CERTIFICATE ? { ca: e.CA_CERTIFICATE, rejectUnauthorized: true } : { rejectUnauthorized: false },
		connectionTimeoutMillis: 30_000,
	});
	await c.connect();
	const q = async (s, p) => (await c.query(s, p)).rows;

	const huyet = new Map();
	for (const r of await q(`SELECT ma_huyet, title FROM ec_huyet_vi WHERE coalesce(trim(ma_huyet),'')<>''`))
		huyet.set(String(r.ma_huyet).trim().toUpperCase(), { ten: r.title, ma: String(r.ma_huyet).trim() });
	const kinh = new Map();
	for (const r of await q(`SELECT slug, title FROM ec_kinh_mach`)) kinh.set(String(r.slug), { ten: r.title });
	const kinhTheoSo = [...kinh.values()];

	// CHỈ ảnh đang RỖNG. Ảnh ai đó đã viết alt thì không đụng — đó là chữ của người.
	// Tra theo SLUG cho nhóm ảnh đặt tên kiểu `<số>-<slug>`. Hai bộ có ảnh: huyệt và dược liệu.
	const theoSlug = new Map();
	for (const [bang, maCot] of [["ec_huyet_vi", "ma_huyet"], ["ec_duoc_lieu", null]]) {
		try {
			for (const r of await q(`SELECT slug, title${maCot ? `, ${maCot} AS ma` : ""} FROM ${bang}`))
				if (!theoSlug.has(r.slug)) theoSlug.set(r.slug, { ten: r.title, ma: r.ma ? String(r.ma).trim() : "" });
		} catch {
			// Bộ không tồn tại thì bỏ qua — không gãy cả lượt chạy.
		}
	}

	const anh = await q(`SELECT id, filename FROM media WHERE coalesce(trim(alt),'') = '' ORDER BY filename`);
	const ghi = [];
	const boQua = { khongDocDuocTen: 0, khongTraRaMuc: 0, khongBietVaiTro: 0 };
	for (const a of anh) {
		const t = docTenTep(a.filename);
		if (!t) {
			boQua.khongDocDuocTen++;
			continue;
		}
		if (t.vaiTro && !VAI_TRO[t.vaiTro]) {
			boQua.khongBietVaiTro++;
			continue;
		}
		const muc = t.loai === "huyet" ? huyet.get(t.ma) : t.loai === "slug" ? theoSlug.get(t.ma) : kinhTheoSo[Number(t.ma.split("-")[1]) - 1];
		const alt = dungAlt(muc, t.vaiTro);
		if (!alt) {
			boQua.khongTraRaMuc++;
			continue;
		}
		ghi.push({ id: a.id, filename: a.filename, alt });
	}

	console.log(`${GHI ? "GHI THẬT" : "CHẠY THỬ"} — ${anh.length} ảnh đang rỗng alt`);
	console.log(`  điền được: ${ghi.length}`);
	console.log(`  bỏ qua: ${boQua.khongDocDuocTen} không đọc được tên · ${boQua.khongBietVaiTro} không biết vai trò · ${boQua.khongTraRaMuc} không tra ra mục`);
	for (const x of ghi.slice(0, 8)) console.log(`     ${x.filename} → "${x.alt}"`);
	if (GHI && ghi.length) {
		// Một giao dịch, ghi theo lô — RTT tới Aiven ~99 ms, ghi lẻ 2.500 lượt là hơn 4 phút.
		await c.query("BEGIN");
		for (let i = 0; i < ghi.length; i += 200) {
			const lo = ghi.slice(i, i + 200);
			await c.query(
				`UPDATE media AS m SET alt = v.alt FROM (SELECT * FROM unnest($1::text[], $2::text[]) AS t(id, alt)) AS v WHERE m.id = v.id AND coalesce(trim(m.alt),'') = ''`,
				[lo.map((x) => x.id), lo.map((x) => x.alt)],
			);
		}
		await c.query("COMMIT");
		console.log(`\nĐã ghi ${ghi.length} ô alt. Hoàn nguyên: UPDATE media SET alt='' WHERE ...`);
	} else if (!GHI) console.log("\nThêm --ghi để ghi thật.");
	await c.end();
}
