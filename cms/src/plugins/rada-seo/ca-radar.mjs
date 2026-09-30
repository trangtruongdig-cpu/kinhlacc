// Một ca radar (plugin, KHÔNG gọi mô hình): quét sitemap mọi đối thủ → trích chữ các URL mới
// (có trần) để Claude đọc sau qua MCP → dò xu hướng → tính lại khoảng trống từ những gì Claude
// đã đọc → ghi nhật ký ca. `ghi=false` (chạy thử) chỉ quét và đếm, không ghi URL hay cụm —
// nhưng VẪN ghi nhật ký ca để thấy lần thử đã chạy.
import { thuThapUrl } from "./radar/sitemap.mjs";
import { trichTrang } from "./radar/trich.mjs";
import { timXuHuong } from "./radar/xu-huong.mjs";
import { timKhoangTrong } from "./radar/khoang-trong.mjs";
import * as kho from "./kho.mjs";

/** Nghỉ giữa các lượt tải trang: CMS còn phục vụ ảnh, khu quản trị và blog cho người thật. */
export const NGHI_GIUA_LUOT_MS = 300;

const cho = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Tính lại danh sách khoảng trống từ các URL Claude đã đọc. Dùng ở cuối ca radar VÀ khi
 * Claude báo đọc xong (mcp-viec.mjs) — nên tách riêng.
 * @returns {Promise<number>} số cụm đã ghi
 */
export async function capNhatKhoangTrong(s, { xuHuong, now, nghi }) {
	const doiThu = await kho.dsDoiThu(s);
	const { minh, doiThu: dt } = await kho.chuDeDaPhanTich(s, doiThu);
	const cum = timKhoangTrong({ chuDeMinh: minh, chuDeDoiThu: dt, xuHuong });
	return kho.thayCum(s, cum, now, { nghi });
}

/** Xu hướng mà ca radar gần nhất (có ghi) đã dò — để lần tính lại sau đó dùng tiếp. */
export async function xuHuongGanNhat(s) {
	const ca = await kho.dsCa(s, 20);
	return ca.find((c) => c.loai === "radar" && c.ghi && Array.isArray(c.xuHuong))?.xuHuong ?? [];
}

/**
 * @param {{s: object, docWeb: Function, ghi: boolean, tranMoiDoiThu?: number,
 *          nghi?: (ms: number) => Promise<void>, now?: () => string, hanChot?: number}} o
 *   hanChot: mốc epoch ms — quá mốc thì thôi trích (khoá ca sắp hết hạn)
 */
export async function chayCaRadar({ s, docWeb, ghi, tranMoiDoiThu = 30, nghi = cho, now = () => new Date().toISOString(), hanChot = Infinity }) {
	const ca = {
		loai: "radar", batDau: now(), ketThuc: null, ghi,
		soUrlMoi: 0, soSeTrich: 0, soTrich: 0, soNgoaiNganh: 0, soLoiTrang: 0,
		soXuHuong: 0, soCum: 0, xuHuong: [], loi: [],
	};
	const doiThu = await kho.dsDoiThu(s);
	let dung = null;
	for (const d of doiThu) {
		try {
			const urls = await thuThapUrl(d.tenMien, docWeb);
			const soMoi = await kho.themUrlMoi(s, d.tenMien, urls, { ghi, now: now(), nghi });
			ca.soUrlMoi += soMoi;
			const hang = await kho.layUrlCho(s, d.tenMien, tranMoiDoiThu);
			// Chạy thử không ghi URL mới nên layUrlCho không thấy chúng — cộng tay để bản xem trước
			// báo đúng số trang ca thật SẼ trích (vẫn chặn bởi trần mỗi đối thủ).
			ca.soSeTrich += ghi ? hang.length : Math.min(tranMoiDoiThu, hang.length + soMoi);
			if (!ghi || dung) continue;
			for (const u of hang) {
				if (Date.now() > hanChot) {
					dung = "Dừng trích: chạm hạn ca";
					ca.loi.push(dung);
					break;
				}
				const kq = await trichTrang({ url: u.url, docWeb });
				await kho.capNhatUrl(s, u.id, { ...kq, trichLuc: now() });
				if (kq.trangThai === "cho_ai") ca.soTrich++;
				else if (kq.trangThai === "ngoai_nganh") ca.soNgoaiNganh++;
				else ca.soLoiTrang++;
				await nghi(NGHI_GIUA_LUOT_MS);
			}
		} catch (e) {
			ca.loi.push(`${d.tenMien}: ${String(e?.message ?? e).slice(0, 300)}`);
		}
	}
	if (ghi) {
		try {
			ca.xuHuong = await timXuHuong({ docWeb });
			ca.soXuHuong = ca.xuHuong.length;
			ca.soCum = await capNhatKhoangTrong(s, { xuHuong: ca.xuHuong, now: now(), nghi });
		} catch (e) {
			ca.loi.push(`khoảng trống: ${String(e?.message ?? e).slice(0, 300)}`);
		}
	}
	ca.ketThuc = now();
	await kho.ghiCa(s, ca);
	return ca;
}
