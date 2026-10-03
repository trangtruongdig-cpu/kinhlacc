// Một ca radar (plugin, KHÔNG gọi mô hình): quét sitemap mọi đối thủ → trích chữ các URL mới
// (có trần) để Claude đọc sau qua MCP → dò xu hướng → tính lại khoảng trống từ những gì Claude
// đã đọc → ghi nhật ký ca. `ghi=false` (chạy thử) chỉ quét và đếm, không ghi URL hay cụm —
// nhưng VẪN ghi nhật ký ca để thấy lần thử đã chạy.
import { thuThapUrl } from "./radar/sitemap.mjs";
import { trichTrang } from "./radar/trich.mjs";
import { timXuHuong } from "./radar/xu-huong.mjs";
import { timKhoangTrong } from "./radar/khoang-trong.mjs";
import * as kho from "./kho.mjs";
import { denLuotChienLuoc } from "./ai/tu-lap-chien-luoc.mjs";

/** Nghỉ giữa các lượt tải trang: CMS còn phục vụ ảnh, khu quản trị và blog cho người thật. */
export const NGHI_GIUA_LUOT_MS = 300;

/**
 * Van hàng chờ: quá chừng này trang 'cho_ai' thì ca không trích thêm. Claude đọc tối đa 40
 * trang/đêm (TRAN_TRANG_MOI_DEM) mà ca radar trích tới 30 trang MỖI đối thủ — trích tiếp chỉ
 * chất chữ vào kho (trường `chu` nặng nhất) để rồi trang mốc meo tới lượt đọc. Vẫn quét
 * sitemap và ghi URL mới ('cho'): rẻ, và khi hàng chờ vơi thì ca sau trích tiếp từ đó.
 */
export const NGUONG_HANG_CHO = 80;
/** Ngưỡng thật dùng khi chạy — đè bằng `RADA_SEO_NGUONG_HANG_CHO`. Nâng trần đọc mà quên nâng
 *  cái này thì khâu trích vẫn đứng ở 80 trang và hàng đợi không bao giờ dài ra để mà đọc nhanh. */
export const nguongHangCho = () => {
	const n = Number(process.env.RADA_SEO_NGUONG_HANG_CHO);
	return Number.isFinite(n) && n > 0 ? Math.floor(n) : NGUONG_HANG_CHO;
};

const cho = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Tính lại danh sách khoảng trống từ các URL đã đọc. Dùng ở cuối ca radar VÀ khi routine ngoài
 * báo đọc xong (mcp-viec.mjs) — nên tách riêng.
 *
 * ⚠️ TRẢ VỀ CẢ SỐ ĐẦU VÀO, không chỉ số cụm đã ghi. Lý do đã trả giá: ngày 02/10/2026 khâu này
 * ghi `soCum: 0` suốt 5 ca liền và con số đó KHÔNG phân biệt được ba chuyện khác nhau hẳn —
 * chưa trang nào được đọc (đầu vào rỗng), luật không tìm ra cụm nào, hay cụm tính ra rồi mà
 * khâu ghi lọc sạch vì trùng cụm đã khoá. Phải đọc nhật ký container mới lần ra được, và
 * nhật ký thì cuộn mất. Một con số cho ba trạng thái là một con số vô dụng.
 *
 * @returns {Promise<{soCum: number, soChuDeMinh: number, soChuDeDoiThu: number, soCumTinh: number}>}
 */
export async function capNhatKhoangTrong(s, { xuHuong, now, nghi }) {
	const doiThu = await kho.dsDoiThu(s);
	const { minh, doiThu: dt } = await kho.chuDeDaPhanTich(s, doiThu);
	const cum = await timKhoangTrong({ chuDeMinh: minh, chuDeDoiThu: dt, xuHuong });
	const soCum = await kho.thayCum(s, cum, now, { nghi });
	return { soCum, soChuDeMinh: minh.length, soChuDeDoiThu: dt.length, soCumTinh: cum.length };
}

/** Trần dòng lỗi tải giữ lại trong một ca — chỉ để đọc, không để thống kê. */
export const TRAN_LOI_TAI = 300;

/**
 * Gom các lượt tải hỏng theo LÝ DO, không liệt kê từng URL: 12 lượt Google suggest cùng hỏng vì
 * "lỗi giao thức" là MỘT chuyện, không phải 12 chuyện. Kèm một URL làm ví dụ để tra lại được.
 * @param {{url: string, lyDo: string}[]} ds
 */
export function tomTatLoiTai(ds) {
	const theo = new Map();
	for (const { url, lyDo } of ds) {
		const o = theo.get(lyDo) ?? { n: 0, viDu: url };
		o.n++;
		theo.set(lyDo, o);
	}
	const phan = [...theo.entries()]
		.sort((a, b) => b[1].n - a[1].n)
		.map(([lyDo, o]) => `${o.n}× ${lyDo} (vd ${o.viDu})`);
	return `Tải hỏng ${ds.length} lượt: ${phan.join(" · ")}`;
}

/** Câu giải thích vì sao ra bao nhiêu cụm — vào `ca.thongTin` để không phải đi đọc log. */
export function cauKhoangTrong({ soCum, soChuDeMinh, soChuDeDoiThu, soCumTinh }) {
	const dau = `khoảng trống: đọc được ${soChuDeDoiThu} chủ đề đối thủ + ${soChuDeMinh} của mình → tính ra ${soCumTinh} cụm → ghi ${soCum}`;
	if (!soChuDeDoiThu) return `${dau}. Chưa trang ĐỐI THỦ nào được đọc, nên 0 cụm là đúng — không phải lỗi của luật.`;
	if (!soCumTinh) return `${dau}. Có đầu vào mà luật không ra cụm nào — xem lại ngưỡng gom nhóm.`;
	if (!soCum) return `${dau}. Tính ra cụm nhưng khâu ghi lọc sạch (trùng cụm đã khoá) — không phải thiếu đầu vào.`;
	return dau;
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
 *   chiTenMien: chỉ chạy cho MỘT site (nút "Chạy" ở từng dòng đối thủ)
 *   bao: báo tiến độ ra ngoài (ghi vào KV) — không bao giờ được ném, xem baoAnToan
 *
 * ⚠️ CA MỘT SITE BỎ các khâu TOÀN KHO: dò xu hướng, tính lại khoảng trống, lập chiến lược
 * tuần, đo lại hạng leo top. Chúng đọc dữ liệu của MỌI đối thủ, nên chạy chúng trong một ca
 * hẹp là lấy kết quả toàn kho gắn vào một lượt bấm của một site — số đúng nhưng đọc nhật ký
 * thì tưởng site đó sinh ra chúng. Ca đêm vẫn làm đủ.
 */
export async function chayCaRadar({ s, docWeb, ghi, tranMoiDoiThu = 30, tranSitemap, tranUrlMoiDoiThu, nghi = cho, now = () => new Date().toISOString(), hanChot = Infinity, gsc, kv, goiModel, tuDoc, log, loiTai, tuChienLuoc, content, chiMuc, kiemDuong, chiTenMien = "", bao }) {
	const ca = {
		loai: "radar", batDau: now(), ketThuc: null, ghi,
		soUrlMoi: 0, soSeTrich: 0, soTrich: 0, soNgoaiNganh: 0, soLoiTrang: 0,
		soXuHuong: 0, soCum: 0, xuHuong: [], loi: [], sitemapBo: [], dungTrich: false,
		soDoLai: 0, thongTin: [],
		// Đào sâu sitemap: bao nhiêu sitemap con đọc xong (ghi sổ) và bao nhiêu bỏ qua vì sổ đã có.
		soSitemapDaDoc: 0, soSitemapBoQua: 0,
		// Số ĐẦU VÀO của khâu khoảng trống — xem capNhatKhoangTrong.
		soChuDeDoiThu: 0, soChuDeMinh: 0, soCumTinh: 0,
		// Khâu TỰ ĐỌC bằng model (02/10/2026) — trước đây phải chờ routine bên ngoài kéo việc.
		soDocAi: 0, soLuotModel: 0, soLoiModel: 0,
		// Khâu LẬP CHIẾN LƯỢC (tuần). `soKeHoachMoi` chứ không phải `soKeHoach`: màn điều khiển
		// đã dùng tên sau cho TỔNG kế hoạch trong kho, trùng tên là hai số đè nhau.
		soHuong: 0, soCumNghia: 0, soKeHoachMoi: 0,
	};
	const tatCaDoiThu = await kho.dsDoiThu(s);
	const doiThu = chiTenMien ? tatCaDoiThu.filter((d) => d.id === chiTenMien || d.tenMien === chiTenMien) : tatCaDoiThu;
	if (chiTenMien) {
		ca.tenMien = chiTenMien;
		ca.motSite = true;
		if (!doiThu.length) ca.loi.push(`Không có đối thủ "${chiTenMien}" trong kho — ca không làm gì.`);
	}
	// Báo tiến độ KHÔNG được làm hỏng ca: một lỗi KV lúc ghi tiến độ mà làm đứt ca là đổi một
	// thứ để xem lấy chính thứ cần xem.
	const baoAnToan = async (x) => {
		try {
			await bao?.({ tenMien: chiTenMien || null, luc: now(), ...x });
		} catch (e) {
			log?.warn?.(`Rada SEO: không ghi được tiến độ — ${String(e?.message ?? e)}`);
		}
	};
	let dung = null;
	for (const [iDoiThu, d] of doiThu.entries()) {
		await baoAnToan({ pha: "thu-thap", site: d.id, siteSo: iDoiThu + 1, soSite: doiThu.length, da: 0, tong: 0 });
		try {
			// ĐÀO SÂU: bỏ qua sitemap con đã đọc xong ở ca trước, và không để URL đã có trong kho
			// ăn vào trần. Thiếu hai thứ này thì ca nào cũng gom lại đúng 300 URL mới nhất và
			// `themUrlMoi` đếm 0 — kho đứng ở 300 trang/đối thủ trong khi site có hàng nghìn bài.
			const { urls, sitemapBo, daDoc, conSot, soSitemapBoQua } = await thuThapUrl(d.tenMien, docWeb, {
				tranSitemap,
				tranUrl: tranUrlMoiDoiThu,
				daDocSitemap: await kho.soSitemap(s, d.tenMien),
				locMoi: (ds) => kho.locUrlMoi(s, ds),
			});
			// Nhật ký ghi tên sitemap đã bỏ để người quản trị soát luật phân loại (cắt 20 dòng).
			ca.sitemapBo.push(...sitemapBo.slice(0, 20 - ca.sitemapBo.length));
			ca.soSitemapDaDoc += daDoc.length;
			ca.soSitemapBoQua += soSitemapBoQua;
			const soMoi = await kho.themUrlMoi(s, d.tenMien, urls, { ghi, now: now(), nghi });
			ca.soUrlMoi += soMoi;
			// Chỉ ghi sổ khi ca được phép GHI: chạy thử không ghi URL, ghi sổ thì ca thật sau đó
			// tưởng đã đọc xong những sitemap mà kho chưa có một URL nào của chúng.
			if (ghi) await kho.ghiSoSitemap(s, d.tenMien, { daDoc, conSot }, Date.parse(ca.batDau) || Date.now());
			const hang = await kho.layUrlCho(s, d.tenMien, tranMoiDoiThu);
			// Chạy thử không ghi URL mới nên layUrlCho không thấy chúng — cộng tay để bản xem trước
			// báo đúng số trang ca thật SẼ trích (vẫn chặn bởi trần mỗi đối thủ).
			ca.soSeTrich += ghi ? hang.length : Math.min(tranMoiDoiThu, hang.length + soMoi);
			if (!ghi || dung) continue;
			if (ca.dungTrich) continue;
			const choAi = await kho.demChoAi(s);
			if (choAi > nguongHangCho()) {
				ca.dungTrich = true;
				ca.loi.push(`Tạm ngừng trích: hàng chờ model đọc đang ${choAi} trang (> ${nguongHangCho()})`);
				continue;
			}
			await baoAnToan({ pha: "trich", site: d.id, siteSo: iDoiThu + 1, soSite: doiThu.length, da: 0, tong: hang.length });
			let daTrich = 0;
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
				daTrich++;
				await baoAnToan({ pha: "trich", site: d.id, siteSo: iDoiThu + 1, soSite: doiThu.length, da: daTrich, tong: hang.length });
				await nghi(NGHI_GIUA_LUOT_MS);
			}
		} catch (e) {
			ca.loi.push(`${d.tenMien}: ${String(e?.message ?? e).slice(0, 300)}`);
		}
	}
	// ── Tự đọc trang bằng model, NGAY TRONG CA ─────────────────────────────────────────
	// Chỉ chạy khi ca được phép GHI và có đủ ba thứ: kv (sổ giữ chỗ), goiModel, hàm tuDoc.
	// Thiếu thứ nào thì ghi một dòng thông tin — im lặng ở đây nghĩa là hàng đợi đứng mà
	// nhật ký vẫn báo ca thành công.
	//
	// ⚠️ PHẢI ĐỨNG TRƯỚC khâu tính khoảng trống. `capNhatKhoangTrong` chỉ nhìn URL đã
	// 'da_phan_tich', nên đọc SAU nó thì 40 trang vừa đọc không vào bảng khoảng trống cho tới
	// đêm hôm sau — ca vẫn báo đủ số, chỉ là chậm một ngày mà không chỗ nào nói ra. (Thứ tự cũ
	// đúng khi việc đọc nằm ngoài ca: lúc ấy routine gọi `xongPhanTich` để tính lại.)
	// Khoá ca dài HAN_KHOA_MS = 3 giờ, đọc 40 trang hết chừng 2 phút, nên dời lên không chạm hạn.
	if (ghi && tuDoc && goiModel && kv) {
		try {
			await baoAnToan({ pha: "doc", site: chiTenMien || null, da: 0, tong: 0 });
			// Ca một site chỉ đọc trang CỦA SITE ĐÓ: hàng đợi chung thì lượt bấm "chạy cho VinMEC"
			// lại đi đọc trang của Medlatec, và bảng tiến độ của VinMEC đứng im.
			const d = await tuDoc({ s, kv, goiModel, log, nowMs: Date.parse(ca.batDau) || Date.now(), doiThuId: chiTenMien || undefined });
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

	// ── Lập chiến lược, MỖI TUẦN MỘT LẦN ───────────────────────────────────────────────
	// Đứng SAU khâu tự đọc trang, vì `layDuLieu` đọc CHỦ ĐỀ ĐỐI THỦ (bảng `url`, trạng thái
	// 'da_phan_tich') — chạy trước là lập chiến lược trên kho thiếu phần vừa đọc đêm nay.
	// Nó KHÔNG đọc bảng `cum` (khoảng trống): bảng đó nay chỉ là bằng chứng, nên thứ tự so với
	// khâu khoảng trống không quan trọng. Chỉ có một task cron nên phép chọn ngày nằm trong
	// `denLuotChienLuoc` (hàm thuần, kiểm được mà không phải chờ tới thứ Hai).
	// Hỏng thì ghi vào `ca.loi` rồi đi tiếp: chiến lược là việc tuần, mất một tuần không làm
	// hỏng việc đêm.
	if (ghi && !chiTenMien && tuChienLuoc && goiModel && denLuotChienLuoc(Date.parse(ca.batDau) || Date.now())) {
		try {
			const c = await tuChienLuoc({ s, content, chiMuc, kiemDuong, goiModel, log, now: now() });
			ca.soHuong = c.soHuong;
			ca.soCumNghia = c.soCumNghia;
			ca.soKeHoachMoi = c.soKeHoach;
			ca.soLuotModel += c.luotGoi;
			ca.soLoiModel += c.loi;
			for (const g of c.ghiChu ?? []) ca.thongTin.push(`chiến lược: ${g}`);
		} catch (e) {
			ca.loi.push(`Khâu lập chiến lược hỏng: ${String(e?.message ?? e).slice(0, 300)} — phần còn lại của ca vẫn xong`);
		}
	}

	if (ghi && chiTenMien) {
		ca.thongTin.push("Ca một site: bỏ qua dò xu hướng, tính lại khoảng trống, chiến lược tuần và đo lại leo top — đó là việc toàn kho của ca đêm.");
	}
	if (ghi && !chiTenMien) {
		try {
			ca.xuHuong = await timXuHuong({ docWeb });
			ca.soXuHuong = ca.xuHuong.length;
			// 0 xu hướng KHÔNG phải chuyện nhỏ: điểm cụm mất phần thưởng "trúng xu hướng" (+3) nên
			// thứ tự việc đổi hẳn. Và nó từng ra 0 vì lời gọi hỏng chứ không vì hết xu hướng — đo
			// 02/10/2026: ngoài ca ra 50 xu hướng trong 844 ms, trong ca ra 0 và nhật ký sạch bong.
			if (!ca.soXuHuong) ca.thongTin.push("Dò xu hướng ra 0 — chạy ngoài ca thì ra ~50, nên nghi lời gọi hỏng chứ không phải hết xu hướng.");
			const kt = await capNhatKhoangTrong(s, { xuHuong: ca.xuHuong, now: now(), nghi });
			ca.soCum = kt.soCum;
			ca.soChuDeDoiThu = kt.soChuDeDoiThu;
			ca.soChuDeMinh = kt.soChuDeMinh;
			ca.soCumTinh = kt.soCumTinh;
			ca.thongTin.push(cauKhoangTrong(kt));
		} catch (e) {
			ca.loi.push(`khoảng trống: ${String(e?.message ?? e).slice(0, 300)}`);
		}
		try {
			await doLaiLeoTop({ s, gsc, nowMs: Date.parse(now()), ca });
		} catch (e) {
			ca.loi.push(`đo lại leo top: ${String(e?.message ?? e).slice(0, 300)}`);
		}
	}

	// Lượt tải hỏng mà docWeb đã NUỐT (nó trả chuỗi rỗng) — gom vào nhật ký, không thì
	// "0 xu hướng" và "0 sitemap" vĩnh viễn không giải thích được. Xem taoDocWeb.
	if (loiTai?.length) ca.thongTin.push(tomTatLoiTai(loiTai.slice(0, TRAN_LOI_TAI)));

	ca.ketThuc = now();
	await baoAnToan({ pha: "xong", site: chiTenMien || null, da: 0, tong: 0 });
	await kho.ghiCa(s, ca);
	return ca;
}
