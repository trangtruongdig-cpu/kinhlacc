// Lò viết TỰ CHẠY: nhận bài dự kiến đã duyệt, gọi model viết, nộp qua đúng cổng kiểm.
//
// Trước khâu này, chuỗi dừng ở "đã tạo bài dự kiến": `layBaiCanViet` chỉ giao việc, còn ai viết
// thì phải là một phiên MCP bên ngoài kéo về. Không có phiên nào thì bài dự kiến nằm im mãi —
// đúng tình trạng đo được 02/10/2026.
//
// ⚠️ DÙNG LẠI `layBaiCanViet` / `nopBai`, KHÔNG viết đường ghi riêng. Chúng giữ: hạn ngạch bài
// mỗi đêm, khoá chống giao trùng, trần 25 nháp chờ duyệt, 3 lượt nộp mỗi bài, và TOÀN BỘ cổng
// kiểm (khuôn bài, phạm vi Y sỹ, trùng lặp, nguồn, liên kết thân). Viết đường thứ hai là có hai
// bộ luật, và bộ thứ hai sẽ lệch.
//
// ⚠️ VÒNG SỬA LÀ PHẦN CHỊU LỰC, không phải phần thêm thắt. Đo thật trên cụm "chảy máu cam":
// lượt đầu của model trượt 3 lỗi phạm vi Y sỹ ("chuyên trị", "tận gốc"). Trả lỗi lại cho model
// rồi để nó sửa chính là cơ chế `soLanNopConLai` sinh ra để làm. Hết lượt mà vẫn trượt thì
// `nopBai` tự chuyển kế hoạch sang `can_xem` cho người duyệt — không cần làm gì thêm ở đây.
//
// ⚠️ 503 "high demand" là chuyện thường của bậc miễn phí Google AI Studio (đo 02/10/2026: hai
// lượt liên tiếp). Không thử lại thì một bài hỏng vì lý do chẳng liên quan tới nội dung.

import { jsonTuChu } from "./goi-model.mjs";

/** Nghỉ giữa hai bài: ca chạy trong tiến trình CMS đang phục vụ người thật. */
export const NGHI_GIUA_BAI_MS = 1000;
/** Chờ trước khi thử lại khi nhà cung cấp trả 5xx. */
export const CHO_THU_LAI_MS = 20_000;
export const SO_LAN_THU_LAI = 2;

const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

/** Lời dặn đuôi: model phải trả JSON thuần, không gọi công cụ nào (ở đây không có công cụ). */
const DUOI_NHAC = `\n\nKHÔNG gọi công cụ nào. Trả lời CHỈ bằng MỘT đối tượng JSON: {"tieuDe":"","moTa":"","md":"","tuKhoa":[],"faq":[{"q":"","a":""}],"nguon":[{"title":"","url":""}]}`;

/** Gói lỗi của cổng thành lời dặn sửa — giữ nguyên mã lỗi để model biết sửa đúng chỗ. */
export function nhacSuaLoi(loi) {
	return [
		"Bài bị trả lại. Sửa ĐÚNG những lỗi sau rồi nộp lại toàn bộ JSON:",
		...loi.map((l) => `- [${l.ma}] ${l.ghiChu}`),
		"",
		"Giữ nguyên phần đã đạt. Không thêm liên kết ngoài danh sách trong bài dự kiến.",
	].join("\n");
}

/**
 * Viết MỘT bài: gọi model, nộp, nhận lỗi, sửa — tối đa `soLanNopConLai` lượt.
 * @returns {Promise<{keHoachId: string, daTao: boolean, soLuot: number, loi: string[], contentId?: string, adminUrl?: string}>}
 */
export async function vietMotBai({ bai, goiModel, nopMot, log, nghiMs = CHO_THU_LAI_MS }) {
	const { khuonBai, hoSoCum, soLanNopConLai, ...duLieu } = bai;
	const toiDa = Math.max(1, Math.min(3, soLanNopConLai ?? 3));
	const nhacHeThong = `${khuonBai}${DUOI_NHAC}`;
	// Hội thoại THẬT: user (dữ liệu) → assistant (bản vừa nộp) → user (lỗi cần sửa). Gộp tất cả
	// vào một `user` thì model không phân biệt được đâu là bài cũ của mình, đâu là yêu cầu mới.
	const hoiThoai = [{ role: "user", content: `<<<DU_LIEU id=bai>>>\n${JSON.stringify({ ...duLieu, hoSoCum }, null, 1)}\n<<<HET_DU_LIEU id=bai>>>` }];
	const loiCuoi = [];
	let coNop = false; // đã gọi nopMot lần nào chưa — quyết định có cần thu hồi không

	for (let luot = 1; luot <= toiDa; luot++) {
		let r = null;
		// Thử model chính vài lần, rồi MỚI đổi sang model dự phòng. Đo 02/10/2026: ba lượt liên
		// tiếp đều 503 "high demand" nên chỉ thử lại cùng một model là chưa đủ — bài hỏng vì lý do
		// chẳng liên quan tới nội dung. Model nhẹ hơn thường còn chỗ.
		const duPhong = goiModel.modelDuPhong?.("viet_bai") || "";
		let dungDuPhong = false;
		for (let thu = 0; thu <= SO_LAN_THU_LAI + (duPhong ? 1 : 0); thu++) {
			const model = dungDuPhong || (duPhong && thu > SO_LAN_THU_LAI) ? duPhong : undefined;
			r = await goiModel.goi("viet_bai", nhacHeThong, "", { hoiThoai, ...(model ? { model } : {}) });
			if (r.ok) break;
			// 429 = HẾT QUOTA model đó. Chờ rồi thử lại cùng model là vô ích — đổi NGAY sang model
			// dự phòng, không nghỉ. Đo 02/10/2026: gemini-3.6-flash hết quota trong khi
			// gemini-3.1-flash-lite vẫn trả 200, mà lò viết vẫn đâm đầu vào model đã cạn.
			if (/HTTP 429/.test(r.loi) && duPhong && !dungDuPhong) {
				dungDuPhong = true;
				log?.warn?.(`Rada SEO lò viết: hết quota model chính — đổi sang ${duPhong}`);
				continue;
			}
			// 5xx là nghẽn tạm: chờ rồi thử lại. Lỗi cấu hình thì thử mấy lần cũng thế.
			if (!/HTTP 5\d\d|quá hạn/.test(r.loi) || thu >= SO_LAN_THU_LAI + (duPhong ? 1 : 0)) break;
			log?.warn?.(`Rada SEO lò viết: ${r.loi} — chờ ${nghiMs} ms rồi thử lại`);
			await nghi(nghiMs);
		}
		if (!r?.ok) {
			loiCuoi.push(`lượt ${luot}: không gọi được model — ${r?.loi ?? "không rõ"}`);
			break; // lỗi phía mình: KHÔNG tiêu lượt nộp, để ca sau viết lại
		}
		const soan = jsonTuChu(r.chu);
		if (!soan) {
			loiCuoi.push(`lượt ${luot}: model trả lời không đúng dạng JSON`);
			hoiThoai.push({ role: "assistant", content: r.chu }, { role: "user", content: "Trả lời sai dạng. Chỉ trả về MỘT đối tượng JSON đúng khuôn đã nêu, không thêm chữ nào khác." });
			continue;
		}
		coNop = true;
		const kq = await nopMot({ ...soan, keHoachId: duLieu.keHoachId });
		if (kq.daTao) return { keHoachId: duLieu.keHoachId, daTao: true, soLuot: luot, loi: [], coNop, contentId: kq.contentId, adminUrl: kq.adminUrl };
		const ds = (kq.loi ?? []).map((l) => `${l.ma}: ${l.ghiChu}`);
		loiCuoi.push(`lượt ${luot}: ${ds.join(" · ")}`);
		if (luot < toiDa) hoiThoai.push({ role: "assistant", content: r.chu }, { role: "user", content: nhacSuaLoi(kq.loi ?? []) });
	}
	return { keHoachId: duLieu.keHoachId, daTao: false, soLuot: toiDa, loi: loiCuoi, coNop };
}

/**
 * Một ca lò viết: lấy bài được giao rồi viết từng bài.
 *
 * `layBai` và `nopMot` tiêm vào để phép kiểm chạy vòng thật mà không cần kho; plugin.mjs truyền
 * hai hàm thật (`layBaiCanViet`, `nopBai`).
 *
 * @returns {Promise<{soBai: number, daTao: number, soLuotModel: number, ghiChu: string[], chiTiet: object[]}>}
 */
export async function chayLoViet({ layBai, nopMot, goiModel, log, thuHoi, ghiCa, nghiGiuaBaiMs = NGHI_GIUA_BAI_MS, nghiMs }) {
	const ra = { soBai: 0, daTao: 0, soLuotModel: 0, ghiChu: [], chiTiet: [] };
	// Kết quả ca phải GHI LẠI, không chỉ log: route trả lời ngay khi ca bắt đầu, nên lý do thất
	// bại (hết quota, model trả sai dạng) không bao giờ về tới màn hình nếu không lưu.
	const xong = async () => {
		if (!ghiCa) return ra;
		try {
			await ghiCa({ luc: new Date().toISOString(), soBai: ra.soBai, daTao: ra.daTao, soLuotModel: ra.soLuotModel, ghiChu: ra.ghiChu });
		} catch (e) {
			log?.warn?.(`Rada SEO lò viết: không ghi được nhật ký ca — ${e?.message ?? e}`);
		}
		return ra;
	};
	if (!goiModel?.coCauHinh?.()) {
		const thieu = goiModel?.thieuCauHinh?.() ?? ["goiModel"];
		// Im lặng ở đây nghĩa là bài dự kiến nằm im mà nhật ký vẫn báo ca thành công.
		ra.ghiChu.push(`Chưa gọi được model: thiếu ${thieu.join(", ")} — lò viết KHÔNG chạy, không phải hết việc.`);
		return xong();
	}
	const giao = await layBai();
	ra.soBai = giao.bai?.length ?? 0;
	if (!ra.soBai) {
		ra.ghiChu.push(giao.ghiChu ?? "không có bài dự kiến nào được giao");
		return xong();
	}
	for (const bai of giao.bai) {
		const truoc = goiModel.soLuotDaGoi?.() ?? 0;
		const kq = await vietMotBai({ bai, goiModel, nopMot, log, nghiMs });
		ra.soLuotModel += (goiModel.soLuotDaGoi?.() ?? 0) - truoc;
		ra.chiTiet.push(kq);
		if (kq.daTao) ra.daTao++;
		else {
			ra.ghiChu.push(`${kq.keHoachId}: ${kq.loi.join(" | ").slice(0, 300)}`);
			// ⚠️ KHÔNG để bài kẹt ở "đang viết". Khi lò viết chết vì lỗi phía mình (model 5xx, mạng
			// chập) thì nopBai chưa từng chạy, nên không ai trả kế hoạch về — nó treo đúng
			// GIO_GIU_CHO = 36 giờ và người dùng nhìn mãi một dòng "Đang viết" (đo 02/10/2026).
			// Chỉ thu hồi khi KHÔNG có lượt nộp nào: nộp mà trượt thì nopBai đã xử lý đúng rồi.
			if (thuHoi && !kq.coNop) {
				try {
					await thuHoi(kq.keHoachId);
					ra.ghiChu.push(`${kq.keHoachId}: đã trả về "chờ viết" để viết lại`);
				} catch (e) {
					log?.warn?.(`Rada SEO lò viết: không thu hồi được ${kq.keHoachId} — ${e?.message ?? e}`);
				}
			}
		}
		if (nghiGiuaBaiMs) await nghi(nghiGiuaBaiMs);
	}
	return xong();
}
