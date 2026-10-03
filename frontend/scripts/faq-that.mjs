// Trộn CÂU HỎI THẬT (Search Console) vào FAQ do khuôn sinh.
//
// `huyetFaq`/`benhFaq` của build-dict dựng FAQ bằng câu mẫu đóng cứng: "{tên} nằm ở đâu?",
// "{tên} có tác dụng gì?". Câu mẫu đúng nghĩa nhưng KHÔNG trùng chữ người ta gõ, nên máy không
// nhặt ra được. Module này thêm vào đúng những câu người ta đã gõ thật, và ghép mỗi câu với
// MỤC NỘI DUNG ĐÃ CÓ của trang — không sinh câu trả lời mới, không đụng thân bài.
//
// ⚠️ ĐÂY LÀ BẢN SAO Ý TƯỞNG của `cms/src/plugins/rada-seo/leo-top/y-dinh.mjs`, cố ý tách đôi:
// `frontend/` và `cms/` build với context riêng và không import chéo được (cùng lý do với
// `cms/src/lib/khung-blog.mjs`). Sửa phép phân loại một bên thì sửa bên kia.

/** Bỏ dấu thanh + dấu câu, dùng để so khớp. */
export const chuan = (s) =>
	String(s ?? "")
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/đ/gi, "d")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim();

const DANG = [
	["an_toan", /(co nguy hiem|co sao khong|kieng|chong chi dinh|tac hai|co nen)/],
	["cach_lam", /(cach (bam|day|cham|xoa|massage|xac dinh|lay|tim)|huong dan|the nao|bao lau|may lan)/],
	["tac_dung", /(tac dung|cong dung|chua (benh )?gi|tri (benh )?gi|chu tri)/],
	["dinh_nghia", /(la gi|la huyet gi|thuoc kinh nao|thuoc duong kinh|ten khac|con goi la)/],
	["vi_tri", /(o dau|nam o dau|vi tri|cho nao|giai phau)/],
];

/** @returns {"an_toan"|"cach_lam"|"tac_dung"|"dinh_nghia"|"vi_tri"|"tra_ten"|"khac"} */
export function yDinhCau(q) {
	const t = chuan(q);
	if (!t) return "khac";
	for (const [ten, re] of DANG) if (re.test(t)) return ten;
	return t.split(" ").length <= 5 ? "tra_ten" : "khac";
}

/** Chữ hoa đầu câu và thêm dấu hỏi — truy vấn người ta gõ thường viết thường, không dấu câu. */
export const thanhCauHoi = (q) => {
	const s = String(q ?? "").trim();
	if (!s) return "";
	const hoa = s[0].toUpperCase() + s.slice(1);
	return /[?？]$/.test(hoa) ? hoa : `${hoa}?`;
};

/**
 * @param {{faq: {q: string, a: string}[], cauHoiThat: {tuKhoa: string, hienThi: number}[],
 *          mucTheoY: Record<string, string>, toiDa?: number}} p
 *   `mucTheoY`: ý định → ĐOẠN NỘI DUNG ĐÃ CÓ trên trang trả lời cho ý đó.
 * @returns {{faq: {q, a, tuGsc?: boolean, hienThi?: number}[], daThem: string[]}}
 */
export function tronCauHoiThat({ faq = [], cauHoiThat = [], mucTheoY = {}, toiDa = 4 }) {
	const ra = [...faq];
	const daThem = [];
	// Đã có câu nào CHỨA NGUYÊN CỤM truy vấn thì thôi — đó đúng là thước mà máy dùng để nhặt.
	const daCo = (k) => ra.some((f) => chuan(f.q).includes(k));
	for (const x of [...cauHoiThat].sort((a, b) => (b.hienThi ?? 0) - (a.hienThi ?? 0))) {
		if (daThem.length >= toiDa) break;
		const k = chuan(x.tuKhoa);
		if (!k || daCo(k)) continue;
		const y = yDinhCau(x.tuKhoa);
		// `tra_ten` là gõ TÊN để tra, không phải một câu hỏi — thêm vào FAQ thì thành câu rỗng
		// nghĩa ("Phục thỏ huyệt?"). 70% truy vấn của site này thuộc dạng đó, nên bỏ qua ở đây
		// là bỏ qua phần đông nhất, và đúng.
		const dap = mucTheoY[y];
		if (!dap) continue;
		ra.push({ q: thanhCauHoi(x.tuKhoa), a: dap, tuGsc: true, hienThi: x.hienThi ?? 0 });
		daThem.push(x.tuKhoa);
	}
	return { faq: ra, daThem };
}
