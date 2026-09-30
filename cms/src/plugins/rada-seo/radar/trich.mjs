// Trích chữ MỘT trang đối thủ cho Claude đọc sau (qua MCP). Plugin KHÔNG gọi mô hình nào:
// việc hiểu nội dung do Claude trong tài khoản của người dùng làm theo lịch đêm (đặc tả, mục
// "Nguồn AI"). Ở đây chỉ tải, lọc ngách (không tốn gì) và cắt chữ sẵn.
import { htmlSangChu, laDongY, TRAN_KY_TU } from "./trang.mjs";

/**
 * @param {{url: string, docWeb: (u: string) => Promise<string>, epBuoc?: boolean}} o
 * @returns {Promise<{trangThai: 'cho_ai', chu: string} | {trangThai: 'ngoai_nganh'} | {trangThai: 'loi', loi: string}>}
 */
export async function trichTrang({ url, docWeb, epBuoc = false }) {
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
	// Lọc ngách chỉ theo URL + tiêu đề + mô tả: thân bài có menu toàn trang.
	if (!epBuoc && !laDongY(`${url}\n${tieuDe}\n${moTa}`)) return { trangThai: "ngoai_nganh" };
	return { trangThai: "cho_ai", chu };
}
