// Một ca radar: quét sitemap mọi đối thủ → phân tích URL mới (có trần) → dò xu hướng →
// tìm khoảng trống → ghi nhật ký ca. `ghi=false` (chạy thử) chỉ quét và đếm: KHÔNG gọi
// Claude, KHÔNG ghi URL hay cụm — nhưng VẪN ghi nhật ký ca để thấy lần thử đã chạy.
import { thuThapUrl } from "./radar/sitemap.mjs";
import { phanTichTrang } from "./radar/phan-tich.mjs";
import { timXuHuong } from "./radar/xu-huong.mjs";
import { timKhoangTrong } from "./radar/khoang-trong.mjs";
import { HetNganSach } from "./lib/claude.mjs";
import * as kho from "./kho.mjs";

/** Nghỉ giữa các lượt đọc/gọi: CMS còn phục vụ ảnh, khu quản trị và blog cho người thật. */
export const NGHI_GIUA_LUOT_MS = 300;

const cho = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {{s: object, docWeb: Function, claude: {traJson: Function}|null, nganSach: {daDung: number},
 *          ghi: boolean, tranMoiDoiThu?: number, nghi?: (ms: number) => Promise<void>, now?: () => string}} o
 */
export async function chayCaRadar({ s, docWeb, claude, nganSach, ghi, tranMoiDoiThu = 30, nghi = cho, now = () => new Date().toISOString() }) {
	const ca = {
		loai: "radar", batDau: now(), ketThuc: null, ghi,
		soUrlMoi: 0, soSePhanTich: 0, soPhanTich: 0, soNgoaiNganh: 0, soLoiTrang: 0,
		soXuHuong: 0, soCum: 0, soLuotGoi: 0, loi: [],
	};
	const doiThu = await kho.dsDoiThu(s);
	let hetTien = false;
	for (const d of doiThu) {
		try {
			const urls = await thuThapUrl(d.tenMien, docWeb);
			const soMoi = await kho.themUrlMoi(s, d.tenMien, urls, { ghi, now: now() });
			ca.soUrlMoi += soMoi;
			const hang = await kho.layUrlCho(s, d.tenMien, tranMoiDoiThu);
			// Chạy thử không ghi URL mới nên layUrlCho không thấy chúng — cộng tay để bản xem trước
			// báo đúng số trang ca thật SẼ phân tích (vẫn chặn bởi trần mỗi đối thủ).
			ca.soSePhanTich += ghi ? hang.length : Math.min(tranMoiDoiThu, hang.length + soMoi);
			if (!ghi || hetTien) continue;
			for (const u of hang) {
				let kq;
				try {
					kq = await phanTichTrang({ url: u.url, docWeb, claude });
				} catch (e) {
					if (e instanceof HetNganSach) {
						hetTien = true;
						ca.loi.push(e.message);
						break;
					}
					kq = { trangThai: "loi", loi: String(e?.message ?? e).slice(0, 300) };
				}
				await kho.capNhatUrl(s, u.id, { ...kq, phanTichLuc: now() });
				if (kq.trangThai === "da_phan_tich") ca.soPhanTich++;
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
			const xuHuong = await timXuHuong({ docWeb });
			ca.soXuHuong = xuHuong.length;
			const { minh, doiThu: dt } = await kho.chuDeDaPhanTich(s, doiThu);
			const cum = timKhoangTrong({ chuDeMinh: minh, chuDeDoiThu: dt, xuHuong });
			ca.soCum = await kho.thayCum(s, cum, now());
		} catch (e) {
			ca.loi.push(`khoảng trống: ${String(e?.message ?? e).slice(0, 300)}`);
		}
	}
	ca.soLuotGoi = nganSach?.daDung ?? 0;
	ca.ketThuc = now();
	await kho.ghiCa(s, ca);
	return ca;
}
