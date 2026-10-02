// Tự chấm SEO bằng luật. Chỉ cảnh báo (vàng), không chặn: SEO sai thì người duyệt sửa được
// trong vài giây, khác với lỗi phạm vi Y sỹ.
import { boDau } from "./chuan-hoa.mjs";

/**
 * Dải ĐẠT của phiếu chấm, theo chỗ Google hay cắt trên SERP. Đây là CHỖ DUY NHẤT khai dải
 * này: lời dặn cho mô hình (`loi-dan.mjs`) đọc từ đây, nên lời dặn và phiếu không thể lệch.
 *
 * ⚠️ Trước 01/10/2026 hai chỗ khai hai dải khác nhau: lời dặn nói tiêu đề 30–70 và mô tả
 * 100–170, còn phiếu chấm đạt 30–60 và 120–160. Bài viết ĐÚNG lời dặn (tiêu đề 65 ký tự,
 * mô tả 110) vẫn bị phiếu báo trượt hai mục. Một phiếu báo sai thì người duyệt học cách bỏ
 * qua cả phiếu — kể cả những mục quan trọng như phạm vi Y sỹ nằm ngay bên cạnh.
 *
 * Rào CỨNG lúc nộp (`KHUON_NOP` trong `viet/viec.mjs`) rộng hơn dải này một biên, có ý:
 * bài 63 ký tự phải được NHẬN rồi hiện vàng, không bị trả lại và tốn một lượt nộp.
 * Phép kiểm `seo.test.mjs` canh rào cứng luôn chứa trọn dải đạt.
 */
export const NGUONG = Object.freeze({ tieuDe: [30, 60], moTa: [120, 160] });

const dai = (k) => `${NGUONG[k][0]}–${NGUONG[k][1]}`;
const trongDai = (s, k) => s.length >= NGUONG[k][0] && s.length <= NGUONG[k][1];

/** Câu mô tả dải cho lời dặn — để lời dặn không gõ lại con số. */
export const CAU_NGUONG = `tieuDe ${dai("tieuDe")} ký tự, có từ khoá chính; moTa ${dai("moTa")} ký tự`;

/**
 * Từ khoá "có mặt" trong văn bản: khớp nguyên cụm, HOẶC đủ mọi từ của cụm (mỗi từ là một từ
 * trọn vẹn, không phải khớp giữa chữ).
 *
 * ⚠️ Vì sao không chỉ `includes` nguyên cụm: tiêu đề "Chảy máu cam: Nguyên nhân và cách hỗ trợ
 * theo Đông y" chứa đủ từ khoá "chảy máu cam theo đông y" nhưng không liền mạch, nên phép chấm
 * cũ báo TRƯỢT một tiêu đề đúng (đo 02/10/2026). Phiếu báo sai thì người duyệt học cách bỏ qua
 * cả phiếu — kể cả mục phạm vi Y sỹ nằm ngay bên cạnh.
 */
const co = (vanBan, tuKhoa) => {
	const v = boDau(vanBan);
	const k = boDau(tuKhoa).trim();
	if (!k) return false;
	if (v.includes(k)) return true;
	return k.split(/\s+/).every((tu) => new RegExp(`(?:^|[^a-z0-9])${tu.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[^a-z0-9]|$)`).test(v));
};

/** Đoạn văn đầu tiên không phải tiêu đề mục, không phải ảnh. */
function doanDau(md) {
	for (const k of String(md ?? "").split(/\n\s*\n/)) {
		const t = k.trim();
		if (t && !t.startsWith("#") && !t.startsWith("![")) return t;
	}
	return "";
}

/**
 * @param {{tieuDe:string, moTa:string, noiDungMd:string, tuKhoaChinh:string, faq:unknown[], soAnhThieuAlt:number}} b
 * @returns {{ma:string, dat:boolean, ghiChu:string}[]}
 */
export function chamSeo({ tieuDe = "", moTa = "", noiDungMd = "", tuKhoaChinh = "", faq = [], soAnhThieuAlt = 0 }) {
	const soH2 = (String(noiDungMd).match(/^## /gm) || []).length;
	return [
		{ ma: "tieu_de_dai", dat: trongDai(tieuDe, "tieuDe"), ghiChu: `tiêu đề ${tieuDe.length} ký tự (${dai("tieuDe")})` },
		{ ma: "mo_ta_dai", dat: trongDai(moTa, "moTa"), ghiChu: `mô tả ${moTa.length} ký tự (${dai("moTa")})` },
		{ ma: "tu_khoa_tieu_de", dat: !!tuKhoaChinh && co(tieuDe, tuKhoaChinh), ghiChu: `từ khoá chính "${tuKhoaChinh}" trong tiêu đề` },
		{ ma: "tu_khoa_doan_dau", dat: !!tuKhoaChinh && co(doanDau(noiDungMd), tuKhoaChinh), ghiChu: "từ khoá chính trong đoạn đầu" },
		{ ma: "co_h2", dat: soH2 >= 2, ghiChu: `${soH2} mục H2 (≥2)` },
		{ ma: "co_faq", dat: Array.isArray(faq) && faq.length >= 3, ghiChu: `${Array.isArray(faq) ? faq.length : 0} câu FAQ (≥3)` },
		{ ma: "anh_alt", dat: soAnhThieuAlt === 0, ghiChu: `${soAnhThieuAlt} ảnh thiếu alt` },
	];
}
