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

/**
 * Van hàng chờ: quá chừng này trang 'cho_ai' thì ca không trích thêm. Claude đọc tối đa 40
 * trang/đêm (TRAN_TRANG_MOI_DEM) mà ca radar trích tới 30 trang MỖI đối thủ — trích tiếp chỉ
 * chất chữ vào kho (trường `chu` nặng nhất) để rồi trang mốc meo tới lượt đọc. Vẫn quét
 * sitemap và ghi URL mới ('cho'): rẻ, và khi hàng chờ vơi thì ca sau trích tiếp từ đó.
 */
export const NGUONG_HANG_CHO = 80;

const cho = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Tính lại danh sách khoảng trống từ các URL Claude đã đọc. Dùng ở cuối ca radar VÀ khi
 * Claude báo đọc xong (mcp-viec.mjs) — nên tách riêng.
 * @returns {Promise<number>} số cụm đã ghi
 */
export async function capNhatKhoangTrong(s, { xuHuong, now, nghi }) {
	const doiThu = await kho.dsDoiThu(s);
	const { minh, doiThu: dt } = await kho.chuDeDaPhanTich(s, doiThu);
	const cum = await timKhoangTrong({ chuDeMinh: minh, chuDeDoiThu: dt, xuHuong });
	return kho.thayCum(s, cum, now, { nghi });
}

/** Xu hướng mà ca radar gần nhất (có ghi) đã dò — để lần tính lại sau đó dùng tiếp. */
export async function xuHuongGanNhat(s) {
	const ca = await kho.dsCa(s, 20);
	return ca.find((c) => c.loai === "radar" && c.ghi && Array.isArray(c.xuHuong))?.xuHuong ?? [];
}

/**
 * Đo lại hạng các phiên leo top đã sửa tới mốc +14/+28 ngày (kho.phienCanDoLai, ngày lịch VN).
 *
 * CỬA SỔ GSC — tính bằng ngày lịch, CẢ HAI ĐẦU (gsc.mjs lấy [hôm nay UTC − n, hôm nay UTC]):
 *   mở  = ngày sửa + NGAY_TRE_GSC (bỏ 3 ngày đầu: GSC trễ 2–3 ngày và Google chưa thu thập lại
 *         trang — tính vào là trộn hạng CŨ vào số "sau khi sửa");
 *   đóng = hôm nay theo UTC (ngày GSC mới nhất có thể có).
 *   n = số ngày lịch từ "mở" tới "đóng"; cửa sổ dài n + 1 ngày (lưu vào `cuaSoNgay`).
 * Ca chạy 02:30 VN = 19:30 UTC HÔM TRƯỚC, nên đúng đêm mốc m (VN = sửa + m) thì UTC = sửa + m − 1
 * → n = m − NGAY_TRE_GSC − 1 (10 / 24) → cửa sổ [sửa + 3, sửa + m − 1] = 11 / 25 ngày. (Trước đây
 * lùi m − 3 ngày từ ngày UTC nên cửa sổ mở ở sửa + 2 — lẫn một ngày hạng cũ.) Ca lỡ đêm mốc thì
 * cửa sổ DÀI ra phía sau, vẫn mở ở sửa + 3. Mốc so sánh là `cuaSoBanDau` của phiên (29 ngày lịch
 * tính tới ngày mở phiên) — cửa sổ dài khác nhau nên chỉ so hạng và hiển thị/ngày (`hienThiNgay`).
 * Không có GSC thì BỎ QUA với một dòng thongTin — ca radar vẫn là việc chính, thiếu GSC không
 * phải lỗi của ca. Lỗi GSC của từng phiên vào ca.loi; phiên đó KHÔNG ghi mốc để đêm sau thử lại.
 */
async function doLaiLeoTop({ s, gsc, nowMs, ca }) {
	if (!gsc || !gsc.coCauHinh()) {
		ca.thongTin.push("Đo lại leo top: bỏ qua — plugin chưa cấu hình Search Console (biến GSC_OAUTH_* trong cms/.env)");
		return;
	}
	const ngay = kho.ngayVN(nowMs);
	const homNayUtc = new Date(nowMs).toISOString().slice(0, 10);
	for (const p of await kho.phienCanDoLai(s, nowMs)) {
		try {
			const mo = kho.congNgay(p.ngaySua, kho.NGAY_TRE_GSC);
			const n = Math.max(1, kho.soNgayLich(mo, homNayUtc));
			const cuaSoNgay = n + 1;
			const r = await gsc.layViTri({ tuKhoa: p.tuKhoa, trang: p.trangMinh, ngay: n });
			// ngaySua: người quản trị đổi ngày sửa trong lúc chờ GSC → con số thuộc ngày cũ, không ghi.
			if (await kho.ghiDoLai(s, p.id, { ngaySua: p.ngaySua, ngay, sauNgay: p.moc, viTri: r?.viTri ?? null, hienThi: r?.hienThi ?? 0, cuaSoNgay })) ca.soDoLai++;
		} catch (e) {
			ca.loi.push(`đo lại leo top "${p.tuKhoa}": ${String(e?.message ?? e).slice(0, 300)}`);
		}
	}
}

/**
 * @param {{s: object, docWeb: Function, ghi: boolean, tranMoiDoiThu?: number,
 *          nghi?: (ms: number) => Promise<void>, now?: () => string, hanChot?: number,
 *          gsc?: {coCauHinh: () => boolean, layViTri: Function}}} o
 *   hanChot: mốc epoch ms — quá mốc thì thôi trích (khoá ca sắp hết hạn)
 *   gsc: leo-top/gsc.mjs — đo lại hạng phiên leo top đã sửa; thiếu thì bỏ qua bước đó
 */
export async function chayCaRadar({ s, docWeb, ghi, tranMoiDoiThu = 30, nghi = cho, now = () => new Date().toISOString(), hanChot = Infinity, gsc, kv, goiModel, tuDoc, log }) {
	const ca = {
		loai: "radar", batDau: now(), ketThuc: null, ghi,
		soUrlMoi: 0, soSeTrich: 0, soTrich: 0, soNgoaiNganh: 0, soLoiTrang: 0,
		soXuHuong: 0, soCum: 0, xuHuong: [], loi: [], sitemapBo: [], dungTrich: false,
		soDoLai: 0, thongTin: [],
		// Khâu TỰ ĐỌC bằng model (02/10/2026) — trước đây phải chờ routine bên ngoài kéo việc.
		soDocAi: 0, soLuotModel: 0, soLoiModel: 0,
	};
	const doiThu = await kho.dsDoiThu(s);
	let dung = null;
	for (const d of doiThu) {
		try {
			const { urls, sitemapBo } = await thuThapUrl(d.tenMien, docWeb);
			// Nhật ký ghi tên sitemap đã bỏ để người quản trị soát luật phân loại (cắt 20 dòng).
			ca.sitemapBo.push(...sitemapBo.slice(0, 20 - ca.sitemapBo.length));
			const soMoi = await kho.themUrlMoi(s, d.tenMien, urls, { ghi, now: now(), nghi });
			ca.soUrlMoi += soMoi;
			const hang = await kho.layUrlCho(s, d.tenMien, tranMoiDoiThu);
			// Chạy thử không ghi URL mới nên layUrlCho không thấy chúng — cộng tay để bản xem trước
			// báo đúng số trang ca thật SẼ trích (vẫn chặn bởi trần mỗi đối thủ).
			ca.soSeTrich += ghi ? hang.length : Math.min(tranMoiDoiThu, hang.length + soMoi);
			if (!ghi || dung) continue;
			if (ca.dungTrich) continue;
			const choAi = await kho.demChoAi(s);
			if (choAi > NGUONG_HANG_CHO) {
				ca.dungTrich = true;
				ca.loi.push(`Tạm ngừng trích: hàng chờ Claude đọc đang ${choAi} trang (> ${NGUONG_HANG_CHO})`);
				continue;
			}
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
		try {
			await doLaiLeoTop({ s, gsc, nowMs: Date.parse(now()), ca });
		} catch (e) {
			ca.loi.push(`đo lại leo top: ${String(e?.message ?? e).slice(0, 300)}`);
		}
	}
	// ── Tự đọc trang bằng model, NGAY TRONG CA ─────────────────────────────────────────
	// Chỉ chạy khi ca được phép GHI và có đủ ba thứ: kv (sổ giữ chỗ), goiModel, hàm tuDoc.
	// Thiếu thứ nào thì ghi một dòng thông tin — im lặng ở đây nghĩa là hàng đợi đứng mà
	// nhật ký vẫn báo ca thành công.
	if (ghi && tuDoc && goiModel && kv) {
		try {
			const d = await tuDoc({ s, kv, goiModel, log, nowMs: Date.parse(ca.batDau) || Date.now() });
			ca.soDocAi = d.daGhi;
			ca.soLuotModel = d.luotGoi;
			ca.soLoiModel = d.loi;
			for (const g of d.ghiChu ?? []) ca.thongTin.push(`đọc trang: ${g}`);
		} catch (e) {
			ca.loi.push(`Khâu tự đọc trang hỏng: ${String(e?.message ?? e)} — phần quét vẫn xong`);
		}
	} else if (ghi) {
		ca.thongTin.push("Khâu tự đọc trang KHÔNG chạy (thiếu kv / goiModel) — hàng đợi sẽ đứng.");
	}

	ca.ketThuc = now();
	await kho.ghiCa(s, ca);
	return ca;
}
