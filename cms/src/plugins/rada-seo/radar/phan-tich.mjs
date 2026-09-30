// Phân tích MỘT trang đối thủ: tải → lọc ngách (không tốn lượt gọi) → Claude trích chủ đề.
import { z } from "zod";
import { htmlSangChu, laDongY, TRAN_KY_TU } from "./trang.mjs";

export const BOI_CANH = `Lĩnh vực kinh doanh của chúng tôi (Kinhlac): Y học cổ truyền / Đông Y, tập trung ngách:
- Đo nhiệt độ kinh lạc / chẩn đoán kinh lạc (phương pháp 24 tỉnh huyệt)
- Huyệt vị, đường kinh, châm cứu (tra cứu + đồ hình 3D)
- Vị thuốc, bài thuốc (tính vị quy kinh), biện chứng luận trị
- Phần mềm số hoá / quản lý phòng khám Đông Y`;

// Chép từ EXTRACT_SYSTEM_PROMPT của app; bỏ phần quy định định dạng JSON vì khuôn zod lo.
export const LOI_NHAC_TRICH = `Bạn là thành viên của một đội ngũ SEO chuyên nghiệp trong lĩnh vực Y học cổ truyền (Đông Y).
Nhiệm vụ: phân tích NỘI DUNG một bài blog của đối thủ (đã được trích sẵn text) để giúp team xây chiến lược nội dung & từ khoá.

Hãy xác định:
- chu_de: chủ đề chính của bài blog (1 câu ngắn).
- tu_khoa: 3 từ khoá SEO hàng đầu trong bài, liên quan tới lĩnh vực kinh doanh của chúng tôi. Kết hợp từ khoá dài (long tail) và ngắn (short tail). Từ khoá phải thực sự xuất hiện/đúng trọng tâm bài.
- tom_tat: các ý phụ khác nhau của bài, mỗi phần tử một ý ngắn gọn.

Tiếng Việt có dấu, viết hoa chữ cái đầu. Nếu nội dung quá mỏng, vẫn suy luận từ tiêu đề & mô tả; tuyệt đối không bịa số liệu.`;

export const KHUON_TRICH = z.object({
	chu_de: z.string(),
	tu_khoa: z.array(z.string()),
	tom_tat: z.array(z.string()),
});

/**
 * @param {{url: string, docWeb: (u: string) => Promise<string>, claude: {traJson: Function}, epBuoc?: boolean}} o
 * @returns {Promise<{trangThai: 'da_phan_tich'|'ngoai_nganh'|'loi', chuDe?: string, tuKhoa?: string[], tomTat?: string[], loi?: string}>}
 */
export async function phanTichTrang({ url, docWeb, claude, epBuoc = false }) {
	const html = await docWeb(url);
	if (!html) return { trangThai: "loi", loi: "Không tải được trang (rỗng hoặc bị chặn)" };
	const { tieuDe, moTa, than } = htmlSangChu(html);
	const chu = [
		tieuDe && `TIÊU ĐỀ: ${tieuDe}`,
		moTa && `MÔ TẢ: ${moTa}`,
		than && `NỘI DUNG: ${than.slice(0, TRAN_KY_TU)}`,
	]
		.filter(Boolean)
		.join("\n");
	if (chu.replace(/\s/g, "").length < 40) return { trangThai: "loi", loi: "Trang gần như không có chữ" };
	if (!epBuoc && !laDongY(`${url}\n${tieuDe}\n${moTa}`)) return { trangThai: "ngoai_nganh" };
	const user = `${BOI_CANH}\n\nURL bài blog đối thủ: ${url}\n\nNỘI DUNG ĐÃ TRÍCH:\n"""\n${chu}\n"""`;
	const kq = await claude.traJson(LOI_NHAC_TRICH, user, KHUON_TRICH, 800);
	return {
		trangThai: "da_phan_tich",
		chuDe: kq.chu_de.trim(),
		tuKhoa: kq.tu_khoa.map((s) => s.trim()).filter(Boolean).slice(0, 5),
		tomTat: kq.tom_tat.map((s) => s.trim()).filter(Boolean).slice(0, 8),
	};
}
