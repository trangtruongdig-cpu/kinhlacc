// SƠ HỞ KHIẾN AI KHÔNG LẤY ĐƯỢC — và cách sửa RẺ NHẤT cho từng sơ hở.
//
// Trục thứ tư, và nó ngược chiều với ba trục kia. Radar/khoảng trống/semantic đều hỏi "nên VIẾT
// GÌ MỚI". Search Console hỏi câu khác: **người ta đang hỏi gì mà trang mình CÓ CÂU TRẢ LỜI
// nhưng máy không nhặt ra được**. Sửa chỗ đó rẻ hơn viết bài mới một bậc.
//
// Bằng chứng mở đầu (đo 03/10/2026 trên `/huyet/phuc-tho/`, 61 lượt hiển thị/28 ngày):
// trang ĐÃ có FAQPage JSON-LD với câu "Huyệt Phục Thố **nằm ở đâu**?", và câu trả lời đúng
// nằm ngay trong hồ sơ đầu trang. Nhưng người ta gõ "huyệt phục thỏ **ở đâu**" và "**vị trí**
// huyệt phục thỏ" — không khớp nguyên cụm với câu nào trong FAQ. Nội dung có, chữ không khớp.
// Việc phải làm là THÊM MỘT DÒNG FAQ bằng đúng chữ người ta gõ, không phải viết lại bài.
//
// ⚠️ XẾP VIỆC THEO GIÁ, TỪ RẺ TỚI ĐẮT. Đây là điểm cốt lõi: một phiếu nói "viết lại bài" thì
// người ta để đó, còn phiếu nói "thêm một dòng FAQ" thì làm trong hai phút. Phân loại sai về
// phía đắt là giết chính cái phiếu.

import { boDau, chuanHoaManh } from "../luat/chuan-hoa.mjs";

/** Việc cần làm, RẺ TRƯỚC. `da_du` nghĩa là không phải làm gì. */
export const VIEC = {
	da_du: { nhan: "Đã đủ", gia: 0, mo: "Truy vấn đã khớp nguyên cụm trong FAQ hoặc tiêu đề mục." },
	them_faq: { nhan: "Thêm dòng FAQ", gia: 1, mo: "Thân bài đã trả lời; chỉ cần một dòng FAQ bằng ĐÚNG chữ người ta gõ." },
	them_tieu_de: { nhan: "Thêm tiêu đề mục", gia: 2, mo: "Thân bài đã trả lời nhưng không có tiêu đề nào mang chữ đó." },
	thieu_noi_dung: { nhan: "Thiếu nội dung", gia: 3, mo: "Trang không trả lời câu này — đây mới là việc viết thật." },
};

const bo = (s) => chuanHoaManh(s);

/** Bỏ thẻ, giữ khoảng trắng giữa các khối. */
const chuTran = (html) =>
	String(html ?? "")
		.replace(/<script[\s\S]*?<\/script>/gi, " ")
		.replace(/<style[\s\S]*?<\/style>/gi, " ")
		.replace(/<[^>]+>/g, " ");

/** Câu hỏi trong FAQPage JSON-LD + tiêu đề mục nhìn thấy được. */
export function docCauHoi(html) {
	const h = String(html ?? "");
	const faq = [];
	for (const m of h.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
		let d;
		try {
			d = JSON.parse(m[1]);
		} catch {
			continue; // JSON-LD hỏng là chuyện thường trên trang thật; bỏ qua khối đó, không gãy cả phép đo.
		}
		const duyet = (o) => {
			if (!o || typeof o !== "object") return;
			if (Array.isArray(o)) return o.forEach(duyet);
			if (typeof o.name === "string" && o.acceptedAnswer) faq.push(o.name);
			for (const v of Object.values(o)) if (v && typeof v === "object") duyet(v);
		};
		duyet(d);
	}
	const tieuDe = [...h.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => chuTran(m[2]).replace(/\s+/g, " ").trim());
	return { faq, tieuDe };
}

/**
 * Một truy vấn có được trang này đáp ở dạng MÁY NHẶT ĐƯỢC không, và nếu chưa thì việc rẻ nhất
 * là gì.
 *
 * ⚠️ Khớp NGUYÊN CỤM sau khi chuẩn hoá mạnh (bỏ dấu thanh + dấu câu). Không khớp lỏng theo từ:
 * "huyệt phục thỏ ở đâu" và "huyệt phục thố nằm ở đâu" dùng chung gần hết số từ, nhưng cái sau
 * KHÔNG chứa nguyên cụm cái trước — và đó đúng là lý do câu hỏi của người dùng không được nhặt.
 */
export function xetTruyVan(truyVan, { faq, tieuDe, than }) {
	const k = bo(truyVan);
	if (!k) return { viec: "da_du", trong: {} };
	const trong = {
		faq: faq.some((x) => bo(x).includes(k)),
		tieuDe: tieuDe.some((x) => bo(x).includes(k)),
		than: bo(than).includes(k),
	};
	if (trong.faq || trong.tieuDe) return { viec: "da_du", trong };
	if (trong.than) return { viec: "them_faq", trong };
	// Không có nguyên cụm trong thân: nếu MỌI TỪ của truy vấn đều có mặt thì nội dung gần như
	// chắc chắn đã ở đó, chỉ là diễn đạt khác — việc vẫn rẻ (thêm tiêu đề/FAQ theo chữ người
	// dùng), không phải viết mới.
	const tu = bo(truyVan).split(" ").filter((x) => x.length > 1);
	const chuThan = new Set(bo(than).split(" "));
	if (tu.length && tu.every((x) => chuThan.has(x))) return { viec: "them_tieu_de", trong };
	return { viec: "thieu_noi_dung", trong };
}

/**
 * Phiếu sửa nhỏ cho MỘT trang.
 * @param {{trang: string, html: string, truyVan: {tuKhoa: string, hienThi: number, nhap: number, viTri: number}[]}} p
 */
export function phieuSuaNho({ trang, html, truyVan }) {
	const { faq, tieuDe } = docCauHoi(html);
	const than = chuTran(html);
	const dong = (truyVan ?? []).map((t) => {
		const r = xetTruyVan(t.tuKhoa, { faq, tieuDe, than });
		return { ...t, ...r };
	});
	const canLam = dong.filter((d) => d.viec !== "da_du");
	return {
		trang,
		coFaq: faq.length > 0,
		soCauHoiFaq: faq.length,
		soTruyVan: dong.length,
		// Lượt hiển thị đang ĐỢI một việc rẻ — con số để xếp thứ tự giữa các trang.
		hienThiChoSua: canLam.reduce((n, d) => n + (d.hienThi ?? 0), 0),
		// Rẻ trước, trong cùng giá thì nhiều hiển thị trước.
		dong: canLam.sort((a, b) => VIEC[a.viec].gia - VIEC[b.viec].gia || (b.hienThi ?? 0) - (a.hienThi ?? 0)),
	};
}

/** Gộp nhiều phiếu, xếp trang đáng làm trước. */
export function xepPhieu(ds) {
	return [...(ds ?? [])].filter((p) => p.dong.length).sort((a, b) => b.hienThiChoSua - a.hienThiChoSua);
}

export { boDau };
