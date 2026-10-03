// Kéo CÂU HỎI THẬT từ Search Console về cho khâu build dùng.
//
// VÌ SAO Ở ĐÂY MÀ KHÔNG Ở PLUGIN: FAQ của trang từ điển sinh ở KHÂU BUILD (`build-dict.mjs`,
// hàm `huyetFaq`) bằng câu mẫu đóng cứng — "{tên} nằm ở đâu?", "{tên} có tác dụng gì?". Trang
// đã dựng là HTML tĩnh, không chèn gì vào được lúc chạy. Nên muốn trang TỰ THÍCH NGHI theo nhu
// cầu thật thì phải đổi ở đúng chỗ sinh ra nó.
//
// Đo 03/10/2026 trên `/huyet/phuc-tho/`: FAQ có "Huyệt Phục Thố NẰM ở đâu?" trong khi người ta
// gõ "huyệt phục thỏ Ở ĐÂU" và "VỊ TRÍ huyệt phục thỏ" — nội dung đúng, chữ không khớp, nên máy
// không nhặt ra. 51/97 lượt hiển thị của riêng trang đó đang chờ đúng việc này.
//
// Chạy: node scripts/cau-hoi-gsc.mjs        (ghi scripts/du-lieu/cau-hoi-that.json)
//       node scripts/cau-hoi-gsc.mjs --thu  (in ra, không ghi)
//
// ⚠️ THIẾU BIẾN GSC THÌ NẰM IM, KHÔNG GÃY BUILD. Tệp cũ giữ nguyên, `build-dict` chạy như
// trước. Cùng lối với mọi khâu phụ thuộc dịch vụ ngoài trong repo này.

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const GOC = dirname(fileURLToPath(import.meta.url));
export const DUONG_TEP = join(GOC, "du-lieu", "cau-hoi-that.json");
const URL_TOKEN = "https://oauth2.googleapis.com/token";
const URL_API = "https://searchconsole.googleapis.com/webmasters/v3/sites/";
const SITE = process.env.GSC_SITE_URL || "https://kinhlac.online/";
/** Dưới ngần này lượt hiển thị thì chưa đủ căn cứ để sửa FAQ theo nó. */
export const TOI_THIEU_HIEN_THI = 3;
/** Mỗi trang thêm nhiều nhất chừng này câu — FAQ dài quá thì chính nó thành rác. */
export const TOI_DA_CAU_MOI = 4;

const thieu = () => ["GSC_OAUTH_CLIENT_ID", "GSC_OAUTH_CLIENT_SECRET", "GSC_OAUTH_REFRESH_TOKEN"].filter((k) => !String(process.env[k] ?? "").trim());

async function layToken() {
	const r = await fetch(URL_TOKEN, {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: process.env.GSC_OAUTH_CLIENT_ID,
			client_secret: process.env.GSC_OAUTH_CLIENT_SECRET,
			refresh_token: process.env.GSC_OAUTH_REFRESH_TOKEN,
			grant_type: "refresh_token",
		}),
	});
	const j = await r.json();
	if (!r.ok || !j.access_token) throw new Error(`đổi refresh token hỏng: ${j.error_description ?? j.error ?? r.status}`);
	return j.access_token;
}

/** Đường dẫn của một URL, luôn có "/" cuối — khoá dùng chung với build-dict. */
export const duongCua = (u) => {
	try {
		const p = new URL(u).pathname;
		return p.endsWith("/") ? p : `${p}/`;
	} catch {
		return "";
	}
};

export async function keoCauHoi({ ngay = 28 } = {}) {
	const tk = await layToken();
	const ket = new Date();
	const dau = new Date(ket.getTime() - ngay * 86_400_000);
	const r = await fetch(`${URL_API}${encodeURIComponent(SITE)}/searchAnalytics/query`, {
		method: "POST",
		headers: { authorization: `Bearer ${tk}`, "content-type": "application/json" },
		body: JSON.stringify({
			startDate: dau.toISOString().slice(0, 10),
			endDate: ket.toISOString().slice(0, 10),
			dimensions: ["query", "page"],
			rowLimit: 25000,
			dataState: "all",
		}),
	});
	const j = await r.json();
	if (!r.ok) throw new Error(`GSC trả lỗi: ${j?.error?.message ?? r.status}`);
	const theo = new Map();
	for (const row of j.rows ?? []) {
		const [tuKhoa, trang] = row.keys ?? [];
		const d = duongCua(trang);
		if (!d || !tuKhoa) continue;
		if (!theo.has(d)) theo.set(d, []);
		theo.get(d).push({ tuKhoa, hienThi: Number(row.impressions) || 0, viTri: Math.round((Number(row.position) || 0) * 10) / 10 });
	}
	// Mỗi trang: nhiều hiển thị trước, cắt ở TOI_DA_CAU_MOI × 3 (build-dict còn lọc tiếp theo ý định).
	const ra = {};
	for (const [d, ds] of theo) {
		const loc = ds.filter((x) => x.hienThi >= TOI_THIEU_HIEN_THI).sort((a, b) => b.hienThi - a.hienThi).slice(0, TOI_DA_CAU_MOI * 3);
		if (loc.length) ra[d] = loc;
	}
	return ra;
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const thu = process.argv.includes("--thu");
	const k = thieu();
	if (k.length) {
		console.log(`cau-hoi-gsc: thiếu ${k.join(", ")} — BỎ QUA, giữ nguyên tệp cũ.`);
		process.exit(0);
	}
	try {
		const ra = await keoCauHoi();
		const soTrang = Object.keys(ra).length;
		const soCau = Object.values(ra).reduce((n, x) => n + x.length, 0);
		console.log(`cau-hoi-gsc: ${soTrang} trang · ${soCau} câu hỏi thật (≥ ${TOI_THIEU_HIEN_THI} lượt hiển thị)`);
		if (thu) {
			for (const [d, ds] of Object.entries(ra).slice(0, 5)) console.log(`  ${d}\n    ${ds.map((x) => `"${x.tuKhoa}" (${x.hienThi})`).join(" · ")}`);
		} else {
			if (!existsSync(dirname(DUONG_TEP))) mkdirSync(dirname(DUONG_TEP), { recursive: true });
			writeFileSync(DUONG_TEP, JSON.stringify(ra, null, 1));
			console.log(`→ ${DUONG_TEP}`);
		}
	} catch (e) {
		// Hỏng thì KHÔNG gãy build: tệp cũ còn đó, FAQ vẫn là bản câu mẫu như trước.
		console.log(`cau-hoi-gsc: không lấy được (${String(e?.message ?? e).slice(0, 160)}) — giữ nguyên tệp cũ.`);
	}
}
