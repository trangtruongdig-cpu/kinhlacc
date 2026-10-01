// CTR so với KỲ VỌNG THEO VỊ TRÍ (thuần, không I/O).
//
// VÌ SAO CÓ TỆP NÀY
// `gsc.mjs` lấy `clicks` từ Search Console về, đặt vào trường `nhap` — rồi không dùng ở đâu
// nữa (đo 01/10/2026). Điểm chọn từ khoá là `hienThi × (51 − viTri)`: thuần hiển thị và
// khoảng cách tới top. Nghĩa là hai trang rất khác nhau bị xếp chung một hàng đợi:
//   - trang người ta THẤY mà không bấm  → lỗi tiêu đề/mô tả, sửa trong vài phút;
//   - trang người ta bấm bình thường mà hạng không lên → lỗi nội dung/ý định, mới cần cả
//     một ca soi SERP (tốn lượt Claude + lượt tải trang đối thủ).
// Soi SERP cho trang loại một là dùng dao mổ để bẻ khoá.
//
// ⚠️ CTR THÔ VÔ DỤNG, và đây là chỗ dễ sai nhất. Hạng 1 luôn được nhấp nhiều hơn hạng 8, nên
// "CTR thấp" ở hạng 8 là chuyện bình thường. Chỉ phần LỆCH so với kỳ vọng-theo-hạng mới là
// tín hiệu. Hai bằng sáng chế nói đúng việc này: US8938463 (mô hình thiên lệch trình bày) và
// US8706748 (chuẩn hoá CTR theo kỳ vọng của từng vị trí).
//
// ĐƯỜNG CONG DỰNG TỪ DỮ LIỆU CỦA CHÍNH SITE, không lấy bảng CTR của ngành khác: ngách Đông y
// tiếng Việt có hình SERP riêng (hộp "Mọi người cũng hỏi", kết quả ảnh), và một bảng vay mượn
// sẽ vu oan hàng loạt. Tự hiệu chuẩn nên cũng tự đúng khi Google đổi cách trình bày.

/** Bậc vị trí xa hơn thì GSC gần như không còn hiển thị — khớp viTriMax của layTuKhoaLeoTop. */
export const VI_TRI_TOI_DA = 50;
/** Dưới chừng này hàng trong một bậc vị trí thì trung vị là nhiễu → bậc đó coi như trống. */
export const MAU_TOI_THIEU = 5;
/** Làm trơn bằng cửa sổ 3 bậc: dữ liệu thật nhiễu theo bậc, một bậc lệch cao làm vu oan cả bậc. */
export const CUA_SO_TRON = 1;
/** ctr ≤ 60% kỳ vọng → nghi lỗi tiêu đề/mô tả. */
export const NGUONG_THAP = 0.6;
/** ctr ≥ 90% kỳ vọng → CTR ổn, hạng không lên là lỗi nội dung/ý định. */
export const NGUONG_DU = 0.9;
/**
 * Dưới chừng này lượt hiển thị thì CTR của một hàng là nhiễu thống kê — 1 nhấp trên 7 hiển
 * thị ra 14%, không nói được gì. Những hàng đó vẫn vào đường cong (chúng góp vào trung vị)
 * nhưng KHÔNG bị phân loại.
 */
export const HIEN_THI_TIN_DUOC = 20;

/** Trọng số theo loại việc khi xếp hàng đợi soi SERP. */
export const TRONG_SO_LOAI = Object.freeze({ noi_dung: 1, chua_ro: 0.7, tieu_de: 0.25 });

const bac = (viTri) => {
	const v = Math.round(Number(viTri) || 0);
	return v >= 1 && v <= VI_TRI_TOI_DA ? v : null;
};

function trungVi(xs) {
	if (!xs.length) return null;
	const s = [...xs].sort((a, b) => a - b);
	const g = s.length >> 1;
	return s.length % 2 ? s[g] : (s[g - 1] + s[g]) / 2;
}

/** CTR của một hàng GSC; hiển thị 0 → null (không chia cho 0, và hàng đó không nói gì). */
export const ctrCua = (h) => {
	const hi = Number(h?.hienThi) || 0;
	if (hi <= 0) return null;
	return (Number(h?.nhap) || 0) / hi;
};

/**
 * Đường cong CTR kỳ vọng theo bậc vị trí, dựng từ chính các hàng GSC của site.
 *
 * Dùng TRUNG VỊ của CTR từng hàng, không dùng (tổng nhấp / tổng hiển thị) của bậc: một từ
 * khoá thương hiệu đổ hàng nghìn hiển thị sẽ một mình định nghĩa cả bậc nếu tính theo tổng.
 * Trung vị trả lời đúng câu đang hỏi: "một trang BÌNH THƯỜNG ở hạng này được nhấp bao nhiêu".
 *
 * Bậc thiếu mẫu được nội suy tuyến tính từ hai bậc đầy gần nhất; ngoài hai đầu thì lấy bậc
 * đầy gần nhất. Không bậc nào đủ mẫu → trả đường cong RỖNG, và mọi hàng thành "chua_ro":
 * thà không kết luận còn hơn kết luận trên một đường cong bịa.
 *
 * @param {{viTri: number, hienThi: number, nhap: number}[]} hang
 * @returns {{ky: (viTri: number) => number|null, soBac: number, bac: Map<number, number>}}
 */
export function duongCongCtr(hang, { mauToiThieu = MAU_TOI_THIEU, cuaSo = CUA_SO_TRON } = {}) {
	const theoBac = new Map();
	for (const h of hang ?? []) {
		const b = bac(h?.viTri);
		const c = ctrCua(h);
		if (b === null || c === null) continue;
		if (!theoBac.has(b)) theoBac.set(b, []);
		theoBac.get(b).push(c);
	}
	// Làm trơn: mỗi bậc gộp mẫu của chính nó và các bậc kề trong cửa sổ.
	const tho = new Map();
	for (let b = 1; b <= VI_TRI_TOI_DA; b++) {
		const gop = [];
		for (let k = b - cuaSo; k <= b + cuaSo; k++) gop.push(...(theoBac.get(k) ?? []));
		if (gop.length >= mauToiThieu) tho.set(b, trungVi(gop));
	}
	const day = [...tho.keys()].sort((a, b) => a - b);
	const bang = new Map();
	if (day.length) {
		for (let b = 1; b <= VI_TRI_TOI_DA; b++) {
			if (tho.has(b)) {
				bang.set(b, tho.get(b));
				continue;
			}
			const duoi = day.filter((x) => x < b).pop();
			const tren = day.find((x) => x > b);
			if (duoi === undefined) bang.set(b, tho.get(tren));
			else if (tren === undefined) bang.set(b, tho.get(duoi));
			else {
				const t = (b - duoi) / (tren - duoi);
				bang.set(b, tho.get(duoi) + (tho.get(tren) - tho.get(duoi)) * t);
			}
		}
	}
	return {
		bac: bang,
		soBac: tho.size,
		ky: (viTri) => {
			const b = bac(viTri);
			return b === null ? null : (bang.get(b) ?? null);
		},
	};
}

/**
 * Một hàng GSC thuộc loại việc nào.
 *
 * - `tieu_de`  — người ta THẤY mà không bấm (ctr ≤ 60% kỳ vọng). Việc rẻ: sửa tiêu đề, mô tả,
 *                đoạn trích. KHÔNG cần soi SERP.
 * - `noi_dung` — ctr đạt ≥ 90% kỳ vọng mà hạng vẫn 4–50: người tìm bấm vào rồi mà Google vẫn
 *                không đẩy lên. Đây mới là việc của ca soi SERP.
 * - `chua_ro`  — chưa đủ căn cứ: ít hiển thị, hoặc không có đường cong, hoặc nằm giữa hai ngưỡng.
 *
 * @returns {{loai: 'tieu_de'|'noi_dung'|'chua_ro', ctr: number|null, ctrKyVong: number|null,
 *   lech: number|null, thieuCtr: number, nhapDangMat: number, ly: string}}
 */
export function phanLoaiViec(h, duongCong) {
	const ctr = ctrCua(h);
	const ky = duongCong?.ky ? duongCong.ky(h?.viTri) : null;
	const hienThi = Number(h?.hienThi) || 0;
	const chung = { ctr, ctrKyVong: ky, lech: null, thieuCtr: 0, nhapDangMat: 0 };
	if (ctr === null || ky === null || !ky) {
		return { ...chung, loai: "chua_ro", ly: ky ? "không tính được CTR của hàng này" : "chưa dựng được đường cong CTR cho vị trí này" };
	}
	const lech = ctr / ky;
	// Nhấp đang mất: phần CTR thiếu so với kỳ vọng × số hiển thị. Đây là con số làm người ta
	// chịu đi sửa tiêu đề, nên tính cả khi loại không phải tieu_de.
	const thieuCtr = Math.max(0, 1 - lech);
	const nhapDangMat = Math.max(0, Math.round((ky - ctr) * hienThi));
	const ra = { ...chung, lech, thieuCtr, nhapDangMat };
	if (hienThi < HIEN_THI_TIN_DUOC) {
		return { ...ra, loai: "chua_ro", ly: `chỉ ${hienThi} lượt hiển thị (cần ≥ ${HIEN_THI_TIN_DUOC}) — CTR còn là nhiễu` };
	}
	if (lech <= NGUONG_THAP) {
		return {
			...ra,
			loai: "tieu_de",
			ly: `CTR ${(ctr * 100).toFixed(1)}% chỉ bằng ${Math.round(lech * 100)}% mức thường thấy ở hạng ${Math.round(h.viTri)} (${(ky * 100).toFixed(1)}%) — ước mất ${nhapDangMat} lượt nhấp. Sửa tiêu đề/mô tả trước, chưa cần soi SERP.`,
		};
	}
	if (lech >= NGUONG_DU) {
		return {
			...ra,
			loai: "noi_dung",
			ly: `CTR ${(ctr * 100).toFixed(1)}% đạt mức thường thấy ở hạng ${Math.round(h.viTri)} mà hạng vẫn không lên — việc của ca soi SERP.`,
		};
	}
	return { ...ra, loai: "chua_ro", ly: `CTR bằng ${Math.round(lech * 100)}% kỳ vọng — nằm giữa hai ngưỡng (${NGUONG_THAP * 100}%–${NGUONG_DU * 100}%), chưa kết luận.` };
}

/**
 * Gắn phân loại vào cả lô và tính `uuTien` để xếp hàng đợi soi SERP.
 *
 * `coHoi` giữ nguyên nghĩa cũ (hiển thị × khoảng cách tới top) để số cũ còn đọc được; `uuTien`
 * là thứ dùng để XẾP: cùng cơ hội thì trang "noi_dung" đáng một ca soi hơn trang "tieu_de"
 * gấp bốn lần, vì ca soi không chữa được lỗi tiêu đề.
 *
 * @param {{viTri: number, hienThi: number, nhap: number, coHoi: number}[]} hang
 */
export function gan(hang, duongCong) {
	return (hang ?? []).map((h) => {
		const pl = phanLoaiViec(h, duongCong);
		return {
			...h,
			ctr: pl.ctr,
			ctrKyVong: pl.ctrKyVong,
			lechCtr: pl.lech,
			loaiViec: pl.loai,
			lyLoaiViec: pl.ly,
			nhapDangMat: pl.nhapDangMat,
			uuTien: Math.round((Number(h.coHoi) || 0) * TRONG_SO_LOAI[pl.loai]),
		};
	});
}
