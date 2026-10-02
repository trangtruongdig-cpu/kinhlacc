// Sinh ảnh minh hoạ cho bài: MỘT ảnh bìa + MỘT ảnh cho mỗi mục "##".
//
// Cách làm theo yêu cầu người dùng (02/10/2026): đọc nội dung mục, viết một lời nhắc mô tả
// bức ảnh cần có, gọi model sinh ảnh, nạp thẳng vào thư viện CMS rồi chèn vào bài.
//
// ⚠️ CẦN QUOTA SINH ẢNH. Đo 02/10/2026: cả sáu model ảnh của Google AI Studio
// (gemini-2.5-flash-image, gemini-3-pro-image, gemini-3.1-flash-image…) đều trả 429 trên bậc
// miễn phí — phải bật thanh toán. Thiếu quota thì khâu này NẰM IM và bài vẫn ra bình thường,
// không gãy; phiếu bài ghi lý do.
//
// ⚠️ ẢNH SINH RA KHÔNG PHẢI TÀI LIỆU GIẢI PHẪU. Model không biết huyệt Túc Tam Lý nằm ở đâu.
// Vì vậy lời nhắc luôn đòi ảnh BỐI CẢNH (thảo dược, không gian phòng chẩn trị, động tác đời
// thường) và CẤM vẽ sơ đồ huyệt, đường kinh, mũi tên chỉ vị trí, chữ trên ảnh — một sơ đồ huyệt
// sai trông đáng tin hơn là không có ảnh, và đó là loại sai tệ nhất trên trang y khoa.

/** Phong cách chung cho cả bài: ảnh rời rạc mỗi cái một kiểu làm trang trông chắp vá. */
export const PHONG_CACH =
	"Phong cách: ảnh minh hoạ phẳng (flat illustration), nét mềm, bảng màu ấm nâu–kem–xanh lá trầm, ánh sáng dịu, bố cục thoáng, không chữ, không watermark, không người nhìn thẳng ống kính.";

/** Những thứ model KHÔNG được vẽ — lý do ở đầu tệp. */
export const CAM =
	"KHÔNG vẽ: sơ đồ huyệt vị, đường kinh lạc, mũi tên chỉ vị trí trên cơ thể, hình giải phẫu, kim châm cứu cắm trên da, chữ hoặc nhãn trong ảnh, logo.";

const gonChu = (s, n) =>
	String(s ?? "")
		.replace(/\[([^\]]*)\]\([^)]*\)/gu, "$1") // bỏ link, giữ chữ neo
		.replace(/[*_`#>]/gu, "")
		.replace(/\s+/gu, " ")
		.trim()
		.slice(0, n);

/**
 * Lời nhắc sinh ảnh cho MỘT mục. Mô tả ý của đoạn rồi mới tả ảnh — model cần biết đoạn nói gì
 * thì ảnh mới ăn nhập, chứ không chỉ là một bức tranh đẹp cạnh tiêu đề.
 */
export function loiNhacAnhMuc({ tieuDeBai, tieuDeMuc, noiDung }) {
	return [
		`Vẽ một ảnh minh hoạ nằm ngang cho mục "${gonChu(tieuDeMuc, 120)}" trong bài về ${gonChu(tieuDeBai, 120)} (y học cổ truyền Việt Nam).`,
		`Nội dung mục này nói về: ${gonChu(noiDung, 700)}`,
		"Ảnh phải gợi đúng ý trên bằng BỐI CẢNH đời thường hoặc hình thảo dược, không phải sơ đồ.",
		PHONG_CACH,
		CAM,
	].join("\n");
}

/** Lời nhắc cho ảnh bìa: nói chủ đề cả bài, không sa vào một mục. */
export function loiNhacAnhBia({ tieuDe, moTa }) {
	return [
		`Vẽ ảnh bìa nằm ngang cho bài viết y học cổ truyền Việt Nam: "${gonChu(tieuDe, 160)}".`,
		`Tóm tắt bài: ${gonChu(moTa, 400)}`,
		"Ảnh gợi không khí chung của chủ đề (thảo dược khô, ấm sắc thuốc, không gian phòng chẩn trị Đông y), không mô tả một thao tác cụ thể.",
		PHONG_CACH,
		CAM,
	].join("\n");
}

/** Cắt bài thành các mục "##": trả [{tieuDe, noiDung}] theo đúng thứ tự. */
export function cacMucH2(md) {
	const ra = [];
	for (const khuc of String(md ?? "").split(/\n(?=##\s)/u)) {
		const m = khuc.match(/^##\s+(.+)$/mu);
		if (!m) continue;
		ra.push({ tieuDe: m[1].trim(), noiDung: khuc.slice(khuc.indexOf("\n") + 1) });
	}
	return ra;
}

const KIEU_DUOI = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp" };
const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Hạn TỔNG cho cả khâu ảnh của một bài. Khâu này chạy TRONG khoá nộp bài
 * (HAN_KHOA_NOP_MS = 5 phút ở viet/viec.mjs), nên phải xong trước khoá — thừa chỗ cho phần
 * kiểm nguồn và kiểm link vốn cũng tốn thời gian.
 */
export const HAN_TONG_MS = 150_000;

/**
 * Sinh và nạp MỘT ảnh. Không bao giờ ném — trả `null` kèm lý do trong `loi`.
 * @returns {Promise<{mediaId: string, alt: string}|null>}
 */
export async function sinhVaNap({ goiModel, media, loiNhac, alt, ten, ghiLoi }) {
	const r = await goiModel.sinhAnh(loiNhac);
	if (!r.ok || !r.anh) {
		ghiLoi?.(r.loi || "model không trả ảnh");
		return null;
	}
	try {
		const bytes = Buffer.from(r.anh.base64, "base64");
		const duoi = KIEU_DUOI[r.anh.kieu] ?? ".png";
		const kq = await media.upload(`${ten}${duoi}`, r.anh.kieu, bytes);
		return { mediaId: String(kq.mediaId), alt };
	} catch (e) {
		ghiLoi?.(`nạp ảnh hỏng: ${String(e?.message ?? e).slice(0, 160)}`);
		return null;
	}
}

/**
 * Sinh trọn bộ ảnh cho một bài.
 *
 * Nghỉ giữa các lượt vì cùng lý do với mọi việc nền khác: tiến trình CMS đang phục vụ người thật.
 *
 * @returns {Promise<{bia: {mediaId,alt}|null, muc: {tieuDe,mediaId,alt}[], loi: string[]}>}
 */
export async function sinhAnhChoBai({ goiModel, media, tieuDe, moTa, md, slug = "bai", toiDaMuc = 6, nghiMs = 500, hanTongMs = HAN_TONG_MS, now = Date.now }) {
	const hetGio = now() + hanTongMs;
	const ra = { bia: null, muc: [], loi: [] };
	if (!goiModel?.sinhAnh || !media?.upload) {
		ra.loi.push("chưa có model sinh ảnh hoặc chưa có quyền nạp ảnh (media:write)");
		return ra;
	}
	const ghi = (x) => {
		if (!ra.loi.includes(x)) ra.loi.push(x);
	};

	ra.bia = await sinhVaNap({
		goiModel,
		media,
		loiNhac: loiNhacAnhBia({ tieuDe, moTa }),
		alt: `Ảnh bìa: ${tieuDe}`,
		ten: `${slug}-bia`,
		ghiLoi: ghi,
	});
	// Bìa hỏng vì hết quota thì các mục cũng sẽ hỏng — dừng sớm, đừng đốt thêm lượt gọi.
	if (!ra.bia && ra.loi.some((x) => /429|quota/i.test(x))) return ra;

	const muc = cacMucH2(md).filter((m) => !/^điểm chính$/iu.test(m.tieuDe)).slice(0, toiDaMuc);
	for (const [i, m] of muc.entries()) {
		// ⚠️ Hạn TỔNG, không chỉ hạn mỗi ảnh: cả khâu này nằm trong khoá nộp bài 5 phút. Hết giờ
		// thì thôi sinh tiếp — bài vẫn ra với số ảnh đã có, còn hơn mất khoá rồi tạo nháp thứ hai.
		if (now() > hetGio) {
			ghi(`hết hạn ${Math.round(hanTongMs / 1000)} s cho khâu ảnh — dừng ở ${ra.muc.length}/${muc.length} mục`);
			break;
		}
		if (nghiMs) await nghi(nghiMs);
		const a = await sinhVaNap({
			goiModel,
			media,
			loiNhac: loiNhacAnhMuc({ tieuDeBai: tieuDe, tieuDeMuc: m.tieuDe, noiDung: m.noiDung }),
			alt: `${m.tieuDe} — ${tieuDe}`,
			ten: `${slug}-muc-${i + 1}`,
			ghiLoi: ghi,
		});
		if (a) ra.muc.push({ tieuDe: m.tieuDe, ...a });
		else if (ra.loi.some((x) => /429|quota/i.test(x))) break; // hết quota: thôi thử tiếp
	}
	return ra;
}
