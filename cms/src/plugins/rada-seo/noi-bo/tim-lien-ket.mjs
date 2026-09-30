// Công cụ rada_tim_lien_ket (thuần): cụm từ → trang CÓ THẬT của kinhlac.online để gắn liên
// kết nội bộ. Ba nguồn theo thứ tự rẻ → đắt: chỉ mục trong bộ nhớ (từ điển + blog), API tra
// bài thuốc (một lượt cho mọi cụm còn thiếu), rồi tải trang thật để kiểm từng ứng viên.
//
// Chỉ trả ứng viên ĐÃ KIỂM ĐẠT: một link nội bộ chết (hay trỏ nhầm "Âm Khích" sang trang
// "Ẩm Khích") tệ hơn không có link — Claude sẽ tin kết quả này mà không tự mở trang.
import { timTrongChiMuc } from "./chi-muc.mjs";
import { chonDuong } from "./kiem-duong.mjs";

/** Kiểm đồng thời tối đa chừng này trang: nginx site thật phục vụ cả người đọc. */
const DONG_THOI = 3;

/**
 * @param {{
 *   chiMuc: object, cumTu: string[],
 *   traBaiThuoc: (ten: string[]) => Promise<Record<string, {ten: string, loai: string, duong: string}[]>>,
 *   kiemDuong: (duong: string, tenMong?: string) => Promise<boolean>,
 *   toiDaMoiCum?: number, toiDaKiem?: number,
 * }} o  toiDaKiem: trần số lần gọi kiemDuong cho cả lượt (mỗi lần có thể là một lần tải trang)
 * @returns {Promise<{cumTu: string, ketQua: {ten: string, loai: string, duong: string, khop: string}[], daCatBot?: true}[]>}
 *   daCatBot: cụm có ứng viên bị bỏ vì chạm trần kiểm
 */
export async function timLienKet({ chiMuc, cumTu, traBaiThuoc, kiemDuong, toiDaMoiCum = 5, toiDaKiem = 40 }) {
	const ungVien = cumTu.map((c) => timTrongChiMuc(chiMuc, c, { toiDa: toiDaMoiCum }));

	// Cụm chưa có kết quả khớp tên/tên khác trong chỉ mục → có thể là bài thuốc/vị thuốc/nguồn.
	const canTra = cumTu.filter((_, i) => !ungVien[i].some((x) => x.khop === "dung" || x.khop === "ten_khac"));
	if (canTra.length) {
		let tra = {};
		try {
			tra = (await traBaiThuoc(canTra)) ?? {};
		} catch {
			// tra hỏng thì chỉ mất phần bài thuốc, phần từ điển vẫn trả
		}
		cumTu.forEach((c, i) => {
			const them = (tra[c] ?? []).map((x) => ({ ten: x.ten, loai: x.loai, duong: [x.duong], khop: "dung" }));
			// API khớp NGUYÊN tên nên đứng trước các khớp "chua" của chỉ mục.
			if (them.length) ungVien[i] = [...them, ...ungVien[i]].slice(0, toiDaMoiCum);
		});
	}

	const ra = cumTu.map((c) => ({ cumTu: c, ketQua: [] }));
	const viec = ungVien.flatMap((ds, i) => ds.map((uv, j) => ({ i, j, uv })));
	const dat = new Map(); // "i:j" → đường đạt

	let daGoi = 0;
	/** kiemDuong có trần: hết lượt thì trả false (ứng viên bỏ) và đánh dấu cụm bị cắt. */
	const kiemCoTran = (i) => async (duong, ten) => {
		if (daGoi >= toiDaKiem) {
			ra[i].daCatBot = true;
			return false;
		}
		daGoi++;
		try {
			return await kiemDuong(duong, ten);
		} catch {
			return false;
		}
	};

	let tiep = 0;
	const tho = async () => {
		while (tiep < viec.length) {
			const { i, j, uv } = viec[tiep++];
			const d = await chonDuong(kiemCoTran(i), uv);
			if (d) dat.set(`${i}:${j}`, d);
		}
	};
	await Promise.all(Array.from({ length: Math.min(DONG_THOI, viec.length) }, tho));

	// Giữ thứ tự hạng của từng cụm, không theo thứ tự kiểm xong.
	for (const { i, j, uv } of viec) {
		const d = dat.get(`${i}:${j}`);
		if (d) ra[i].ketQua.push({ ten: uv.ten, loai: uv.loai, duong: d, khop: uv.khop });
	}
	return ra;
}
