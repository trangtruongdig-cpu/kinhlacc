// Khuôn bài của lò viết (đặc tả 2C mục 5): đoạn dẫn → "## Điểm chính" (3–6 gạch đầu dòng) →
// thân bài ##/###. Máy chủ chấm bằng LUẬT, không nhờ mô hình tự chấm bài của chính nó.
//
// `loi` CHẶN tạo nháp. Mỗi lỗi có lý do cụ thể ở khâu sau:
// - H1 trong thân: tiêu đề là trường riêng, trang tự in H1 → hai H1.
// - Mục FAQ / nguồn tham khảo / câu miễn trừ trong thân: ba thứ này là TRƯỜNG riêng (`faq`,
//   `nguon_tham_khao`) hoặc trang tự in (miễn trừ) → để trong thân là in HAI lần.
// - Bảng: bộ chuyển Portable Text không hỗ trợ bảng, mỗi dòng thành một đoạn rác.
// - Ảnh markdown: ảnh do máy chủ chọn từ thư viện, mô hình không được tự gắn URL.
// `canhBao` KHÔNG chặn: độ dài và từ khoá trong đoạn dẫn.
// Người dùng chốt: không bao giờ khuyên "viết dài hơn" — cảnh báo độ dài chỉ ghi SỐ.
// Mục lục KHÔNG bắt buộc: trang CMS chưa dựng neo cho tiêu đề.

import { boDau, chuanHoaManh } from "./chuan-hoa.mjs";

const SO_TU_MIN = 900;
const SO_TU_MAX = 2200;

const TIEU_DE = /^(#{1,6})\s+(.*?)\s*#*\s*$/u;
// Chỉ cấp ngoài cùng (thụt ≤ 3 cách): ý phụ lồng bên dưới không tính vào 3–6 mục.
const GACH_DAU_DONG = /^ {0,3}(?:[-*+]|\d+[.)])\s+/u;
/**
 * Dòng phân cách của bảng GFM: |---|:--:|. Ô nào cũng chỉ có gạch (≥ 1) và dấu hai chấm. Hai cột
 * trở lên thì | ở hai đầu là tuỳ; một cột thì phải có đủ hai | (không thì là đường kẻ "---").
 */
const DONG_BANG = /^\s*(?:\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)+\|?|\|\s*:?-+:?\s*\|)\s*$/u;
const ANH_MD = /!\[[^\]]*\]\([^)]*\)/u;

// So trên chữ đã bỏ dấu (boDau) để "Câu Hỏi Thường Gặp" và "cau hoi thuong gap" cùng khớp.
const MUC_FAQ = /cau hoi thuong gap|hoi dap|(?<![a-z])faq(?![a-z])/u;
const MUC_NGUON = /(?:nguon|tai lieu) tham khao/u;
const MUC_MIEN_TRU = /mien tru|tuyen bo/u;
// Câu miễn trừ trong thân: hẹp có chủ ý. "Châm cứu không thay thế được việc ngủ đủ giấc" là câu
// thường, không được chặn — chỉ bắt khi "không thay thế" đi với việc của thầy thuốc.
const CAU_MIEN_TRU =
	/chi mang tinh tham khao|khong (?:the )?thay the (?:cho )?(?:viec )?(?:tham kham|kham|chan doan|dieu tri|y kien|loi khuyen|thay thuoc|bac si)/u;

/** Đếm từ tiếng Việt theo khoảng trắng; dấu markdown (#, -, >, |) không có chữ/số nên không tính. */
function demTu(s) {
	return s.split(/\s+/u).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

/**
 * @param {string} md
 * @param {{tuKhoaChinh?: string}} [tuyChon]
 * @returns {{loi: {ma:string, ghiChu:string}[], canhBao: {ma:string, ghiChu:string}[], soTu:number}}
 */
export function kiemKhuon(md, { tuKhoaChinh = "" } = {}) {
	const loi = [];
	const canhBao = [];
	const daBao = new Set();
	const baoLoi = (ma, ghiChu) => {
		if (daBao.has(ma)) return;
		daBao.add(ma);
		loi.push({ ma, ghiChu });
	};

	const dong = String(md ?? "").normalize("NFC").replace(/\r\n?/gu, "\n").split("\n");
	const chu = []; // các dòng ngoài khối code, để đếm từ
	const doanDan = []; // chữ trước tiêu đề đầu tiên
	let daGapTieuDe = false;
	let trongCode = false;
	let soH2Than = 0;
	let trongDiemChinh = false;
	let coDiemChinh = false;
	let soMucDiemChinh = 0;

	for (const d of dong) {
		if (/^\s*```/u.test(d)) {
			trongCode = !trongCode;
			continue;
		}
		if (trongCode) continue;
		chu.push(d);

		const td = d.match(TIEU_DE);
		if (td) {
			daGapTieuDe = true;
			const cap = td[1].length;
			const ten = boDau(td[2]);
			if (cap === 1) baoLoi("h1_trong_than", `H1 trong thân: "${td[2]}" — tiêu đề là trường riêng`);
			if (MUC_FAQ.test(ten)) baoLoi("muc_faq", `Mục "${td[2]}" — FAQ là trường riêng (faq)`);
			if (MUC_NGUON.test(ten)) baoLoi("muc_nguon", `Mục "${td[2]}" — nguồn là trường riêng (nguon_tham_khao)`);
			if (MUC_MIEN_TRU.test(ten)) baoLoi("mien_tru", `Mục "${td[2]}" — trang tự in câu miễn trừ`);
			// "Điểm chính" chỉ tính ở cấp ##; mọi tiêu đề kế tiếp đều đóng nó lại.
			trongDiemChinh = cap === 2 && chuanHoaManh(td[2]) === "diem chinh";
			if (trongDiemChinh) coDiemChinh = true;
			else if (cap === 2) soH2Than++;
			continue;
		}

		if (!daGapTieuDe && d.trim()) doanDan.push(d);
		if (trongDiemChinh && GACH_DAU_DONG.test(d)) soMucDiemChinh++;
		if (DONG_BANG.test(d)) baoLoi("bang", "Bảng markdown — bộ chuyển Portable Text không hỗ trợ bảng");
		if (ANH_MD.test(d)) baoLoi("anh_md", "Ảnh markdown — ảnh do máy chủ chọn từ thư viện");
		if (CAU_MIEN_TRU.test(boDau(d))) baoLoi("mien_tru", "Câu miễn trừ trong thân — trang tự in câu này");
	}

	if (!coDiemChinh) baoLoi("thieu_diem_chinh", 'Thiếu mục "## Điểm chính"');
	else if (soMucDiemChinh < 3 || soMucDiemChinh > 6)
		baoLoi("diem_chinh_so_muc", `"Điểm chính" có ${soMucDiemChinh} gạch đầu dòng (khuôn: 3–6)`);
	if (soH2Than < 3) baoLoi("it_muc_h2", `Thân bài có ${soH2Than} mục ## (khuôn: ≥ 3, không tính "Điểm chính")`);

	const soTu = demTu(chu.join("\n"));
	if (soTu < SO_TU_MIN || soTu > SO_TU_MAX)
		canhBao.push({ ma: "do_dai", ghiChu: `${soTu} từ, ngoài khoảng 900–2.200` });

	const tk = chuanHoaManh(tuKhoaChinh);
	// Bọc khoảng trắng hai đầu để "ly" không khớp giữa chữ "lyn…".
	if (tk && !` ${chuanHoaManh(doanDan.join(" "))} `.includes(` ${tk} `))
		canhBao.push({ ma: "tu_khoa_doan_dan", ghiChu: `Đoạn dẫn không có từ khoá chính "${tuKhoaChinh}"` });

	return { loi, canhBao, soTu };
}
