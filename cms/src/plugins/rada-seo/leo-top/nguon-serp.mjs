/**
 * NGUỒN "SERP" cho ca leo top tự hành — một CỔNG, hai bản cài.
 *
 * ⚠️ ĐỌC TRƯỚC KHI DÙNG SỐ CỦA TÍNH NĂNG NÀY. Khâu `nopSerp` đòi danh sách URL top 10 Google,
 * và repo KHÔNG có nguồn nào lấy được nó: `doc_serp` là tác vụ ĐỌC trang SERP chứ không TÌM,
 * còn `radar/xu-huong.mjs` chỉ gọi suggestqueries (gợi ý từ khoá, không phải kết quả tìm kiếm).
 * Chỉ máy khách MCP — nơi một người/agent thật tự tra Google — mới cấp được SERP thật.
 *
 * Người dùng chốt 06/10/2026: dựng đường tự hành bằng KHO ĐỐI THỦ ĐÃ ĐỌC trước, cắm API SERP
 * trả tiền sau, và viết sao cho đổi nguồn chỉ là đổi một hàm.
 *
 * ⚠️ HAI NGUỒN NÓI HAI CHUYỆN KHÁC NHAU, và mọi chỗ hiển thị phải nói ra:
 *   · `kho_doi_thu` → "đối thủ có ý này mà mình thiếu"
 *   · `serp_that`   → "trang ĐANG ĐỨNG TRÊN mình có ý này"
 * Gọi cái thứ nhất là SERP là nói dối người đọc về nguồn gốc của mọi kết luận sau đó.
 */

/** Một phiên lấy tối đa ngần này trang — khớp tinh thần "top 10" mà không giả vờ là top 10. */
export const TRAN_URL_MOI_PHIEN = 8;

export const NHAN_NGUON = Object.freeze({
	kho_doi_thu: "Dựng từ KHO TRANG ĐỐI THỦ đã đọc — đây KHÔNG phải top 10 Google. Phiếu nói “đối thủ có ý này mà mình thiếu”, không nói “trang đang đứng trên mình có ý này”.",
	serp_that: "Dựng từ kết quả tìm kiếm thật.",
});

/** Chủ đề model trả về khi nó KHÔNG đọc ra chủ đề — có thật trong kho, và nó khớp mọi thứ. */
const CHU_DE_RONG = new Set(["khác", "khac", "", "null", "undefined"]);

const chuan = (s) =>
	String(s ?? "")
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.trim();

const mien = (u) => {
	try {
		return new URL(String(u)).hostname.replace(/^www\./, "");
	} catch {
		return "";
	}
};

/**
 * Chọn trang đối thủ cùng chủ đề với `tuKhoa`.
 *
 * ⚠️ Không khớp thì trả RỖNG, KHÔNG trả bừa: một phiếu sơ hở dựng từ trang chẳng liên quan
 * trông y như phát hiện thật, và người đọc không có cách nào biết. Rỗng thì ca nói ra được là
 * "không đủ nguyên liệu cho từ khoá này".
 *
 * ⚠️ Mỗi TÊN MIỀN chỉ một trang: SERP thật không bao giờ toàn một site, và lấy 8 trang của cùng
 * một đối thủ là đo chính site đó chứ không đo ngách.
 *
 * @param {{url: string, chuDe?: string, tuKhoa?: string[]}[]} kho Trang đối thủ ĐÃ đọc.
 * @returns {{url: string, chuDe: string, diem: number}[]}
 */
export function chonTrangDoiThu(kho, tuKhoa) {
	const k = chuan(tuKhoa);
	if (!k) return [];
	const tuK = new Set(k.split(" ").filter((x) => x.length > 1));
	if (!tuK.size) return [];

	const cham = [];
	for (const t of Array.isArray(kho) ? kho : []) {
		const cd = chuan(t?.chuDe);
		if (CHU_DE_RONG.has(cd)) continue;
		// Điểm = số từ của từ khoá xuất hiện trong chủ đề (×2, tín hiệu mạnh) hoặc trong từ khoá
		// của trang. Không dùng chuỗi con: "ho" không được khớp trong "hoàng" — cùng bài học với
		// thước tháp.
		const tuTrang = new Set([...cd.split(" "), ...(t?.tuKhoa ?? []).flatMap((x) => chuan(x).split(" "))].filter(Boolean));
		let diem = 0;
		for (const w of tuK) if (cd.split(" ").includes(w)) diem += 2;
		else if (tuTrang.has(w)) diem += 1;
		if (diem > 0) cham.push({ url: t.url, chuDe: t.chuDe, diem, mien: mien(t.url) });
	}

	cham.sort((a, b) => b.diem - a.diem || a.url.localeCompare(b.url));
	const daCo = new Set();
	const ra = [];
	for (const x of cham) {
		if (daCo.has(x.mien)) continue;
		daCo.add(x.mien);
		ra.push({ url: x.url, chuDe: x.chuDe, diem: x.diem });
		if (ra.length >= TRAN_URL_MOI_PHIEN) break;
	}
	return ra;
}
