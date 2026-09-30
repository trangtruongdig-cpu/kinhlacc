// Tự chấm SEO bằng luật. Chỉ cảnh báo (vàng), không chặn: SEO sai thì người duyệt sửa được
// trong vài giây, khác với lỗi phạm vi Y sỹ.
import { boDau } from "./chuan-hoa.mjs";

const co = (vanBan, tuKhoa) => boDau(vanBan).includes(boDau(tuKhoa));

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
		{ ma: "tieu_de_dai", dat: tieuDe.length >= 30 && tieuDe.length <= 60, ghiChu: `tiêu đề ${tieuDe.length} ký tự (30–60)` },
		{ ma: "mo_ta_dai", dat: moTa.length >= 120 && moTa.length <= 160, ghiChu: `mô tả ${moTa.length} ký tự (120–160)` },
		{ ma: "tu_khoa_tieu_de", dat: !!tuKhoaChinh && co(tieuDe, tuKhoaChinh), ghiChu: `từ khoá chính "${tuKhoaChinh}" trong tiêu đề` },
		{ ma: "tu_khoa_doan_dau", dat: !!tuKhoaChinh && co(doanDau(noiDungMd), tuKhoaChinh), ghiChu: "từ khoá chính trong đoạn đầu" },
		{ ma: "co_h2", dat: soH2 >= 2, ghiChu: `${soH2} mục H2 (≥2)` },
		{ ma: "co_faq", dat: Array.isArray(faq) && faq.length >= 3, ghiChu: `${Array.isArray(faq) ? faq.length : 0} câu FAQ (≥3)` },
		{ ma: "anh_alt", dat: soAnhThieuAlt === 0, ghiChu: `${soAnhThieuAlt} ảnh thiếu alt` },
	];
}
