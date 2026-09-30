// Chỉ số và điểm của một HƯỚNG nội dung / một CỤM trong hướng (thuần).
//
// Claude đề xuất hướng và trọng số GỢI Ý, nhưng KHÔNG tự chấm: ngày 30/09/2026 mô hình đã gắn
// "An toàn" cho "Ứng dụng châm cứu chữa bệnh hiệu quả…". Nên điểm ở đây chỉ đi ra từ số đo:
// đối thủ nào viết thật (id bài có trong kho), mình đã có bao nhiêu bài, từ điển của mình có
// bao nhiêu trang để dẫn link, và các rào phạm vi Y sỹ / YMYL dùng chung với phần còn lại.
import { chuanHoaManh } from "../luat/chuan-hoa.mjs";
import { taoBoKhoa, tapKhoa, doGiong, tachTu, NGUONG_TRUNG } from "../luat/trung-lap.mjs";
import { timViPham } from "../luat/pham-vi-y-sy.mjs";
import { doYmyl } from "../luat/ymyl.mjs";
import { timTrongChiMuc } from "../noi-bo/chi-muc.mjs";
import { trungXuHuong } from "../radar/khoang-trong.mjs";

/**
 * Cụm từ cho thấy hướng có đường dẫn tự nhiên về sản phẩm (dạng chuanHoaManh). CHỈ là điểm
 * cộng nhỏ (+5): người dùng chốt 30/09/2026 không khai cứng dịch vụ, tự nhốt vào ngách hẹp.
 */
export const TU_SAN_PHAM = ["do kinh lac", "do nhiet do kinh lac", "24 tinh huyet", "phan mem", "3d", "tra cuu huyet", "tu dien"];

/** Hạng khớp chỉ mục được tính là tài sản; "mot_phan" (cụm chỉ là mảnh của tên dài) thì không. */
const HANG_TAI_SAN = new Set(["dung", "ten_khac", "chua"]);
const TRAN_TAI_SAN = 10;
const TAI_SAN_MOI_TU_KHOA = 2;

/** `kim` (đã chuẩn hoá) nằm trọn theo ranh giới từ trong `hay` (đã chuẩn hoá). */
const chuaTron = (hay, kim) => !!kim && ` ${hay} `.includes(` ${kim} `);

/**
 * Từ khoá "đủ nghĩa" để đo: còn ≥ 2 từ sau khi bỏ dấu và bỏ từ dừng của thước chống trùng.
 * Từ khoá một từ ("huyệt", "ngủ") hay toàn từ dừng ("đông y") khớp gần như mọi bài → một mẫu
 * dò 30/09/2026 đã thổi hướng "Giảm cân nhanh" lên 78 điểm bằng đúng mấy từ khoá chung chung đó.
 */
export const laTuKhoaDai = (k) => tachTu(k).length >= 2;

/**
 * Bộ chủ đề tính sẵn để so NHIỀU hướng với cùng 1.500 chủ đề mà không tách từ lại.
 * @param {{id: string, chuDe?: string, tieuDe?: string, tuKhoa?: string[]}[]} ds
 */
export function taoBoChuDe(ds) {
	const bo = taoBoKhoa(ds.map((x) => ({ id: x.id, tieuDe: x.chuDe ?? x.tieuDe ?? "", tuKhoa: x.tuKhoa ?? [] })));
	return {
		laBoChuDe: true,
		goc: ds,
		bo,
		// Từng trường chuẩn hoá RIÊNG: cụm khớp không được bắc qua ranh giới hai trường.
		truong: bo.ds.map((x) => [x.tieuDe, ...x.tuKhoa].map(chuanHoaManh)),
	};
}

/** Ngưỡng "cụm quá chung" của timKhop — xem ở đó. */
const TI_LE_CHUNG = 0.1;
const SAN_CHUNG = 30;

const layBo = (x) => (x?.laBoChuDe ? x : taoBoChuDe(x instanceof Map ? [...x].map(([id, v]) => ({ id, ...v })) : (x ?? []).map((v, i) => ({ id: v.id ?? i, ...v }))));

/**
 * Chủ đề nào thuộc hướng — MÁY CHỦ tự dò, không tin id mô hình dẫn. Khớp khi giống (Jaccard cặp từ như timTrungBo,
 * ngưỡng 0,30) mẫu {tieuDe: tên, tuKhoa}, HOẶC một trường của chủ đề chứa trọn (bỏ dấu, theo ranh
 * giới từ) một từ khoá đủ nghĩa hay chính tên hướng.
 * @returns {number[]} chỉ số trong bộ
 */
export function timKhop({ ten = "", tuKhoa = [] }, boChuDe, { locChung = true } = {}) {
	const b = layBo(boChuDe);
	const n = b.bo.ds.length;
	// Cụm "đủ nghĩa" mà vẫn chung chung ("bài thuốc", "huyệt vị") thì khớp cả kho. Đo ngay trên
	// bộ: cụm nào chứa trong quá 10% số chủ đề (và quá 30 bài) thì không dùng làm phép chứa.
	// Tắt khi đo bài của MÌNH: ở đó cụm phủ nhiều bài là "đã phủ", không phải "quá chung".
	const tran = locChung ? Math.max(SAN_CHUNG, n * TI_LE_CHUNG) : Infinity;
	const tkDai = [...new Set([...tuKhoa, ten].filter(laTuKhoaDai).map(chuanHoaManh))].filter((k) => {
		let dem = 0;
		for (let i = 0; i < n && dem <= tran; i++) if (b.truong[i].some((t) => chuaTron(t, k))) dem++;
		return dem <= tran;
	});
	// Cùng phép đo của timTrungBo (Jaccard cặp từ), tính tập của mẫu MỘT lần cho cả bộ.
	const mau = tapKhoa({ tieuDe: ten, tuKhoa });
	const ra = [];
	for (let i = 0; i < n; i++) {
		const chua = tkDai.some((k) => b.truong[i].some((t) => chuaTron(t, k)));
		if (chua || doGiong(mau, b.bo.tap[i]) >= NGUONG_TRUNG) ra.push(i);
	}
	return ra;
}

/**
 * @param {{
 *   ten?: string, tuKhoa: string[], idBaiDoiThu?: string[],
 *   chuDeDoiThu: ReturnType<typeof taoBoChuDe> | {id: string, doiThuId: string, chuDe: string, tuKhoa: string[]}[] | Map<string, object>,
 *   baiMinh: ReturnType<typeof taoBoChuDe> | {tieuDe: string, tuKhoa: string[]}[], xuHuong: string[], chiMuc: object, sanPham?: string[],
 * }} o
 * @returns {{soDoiThu: number, soBai: number, trungXuHuong: boolean, soBaiMinh: number,
 *   taiSan: {ten: string, duong: string, loai: string}[], soTaiSan: number, viPham: boolean, ganSanPham: boolean,
 *   soBangChungBoQua: number, idKhop: string[]}}
 *   `idKhop` (id các chủ đề đối thủ khớp) là để máy chủ dùng tiếp — đừng lưu nguyên vào kho.
 */
export function tinhChiSo({ ten = "", tuKhoa = [], idBaiDoiThu = [], chuDeDoiThu, baiMinh = [], xuHuong = [], chiMuc, sanPham = TU_SAN_PHAM }) {
	// Nhu cầu do máy chủ tự đếm trên chủ đề đối thủ; id mô hình dẫn chỉ còn là bằng chứng hiển thị.
	const boDt = layBo(chuDeDoiThu);
	const khop = timKhop({ ten, tuKhoa }, boDt).map((i) => boDt.goc[i]);
	const idKhop = khop.map((b) => String(b.id));
	const setKhop = new Set(idKhop);
	const soBangChungBoQua = [...new Set(idBaiDoiThu.map(String))].filter((id) => !setKhop.has(id)).length;

	// Bài của mình "đã phủ" hướng: cùng phép dò, có tên hướng → chọn từ khoá lệch cũng không né được.
	const soBaiMinh = timKhop({ ten, tuKhoa }, layBo(baiMinh), { locChung: false }).length;

	// Tài sản nội bộ: trang từ điển/blog có thật để bài trong hướng dẫn link vào. Chỉ từ khoá đủ
	// nghĩa, ≤ 2 trang mỗi từ khoá, ≤ 10 cả hướng — không để một từ khoá chung chung bão hoà số hạng.
	const taiSan = [];
	const daCo = new Set();
	for (const tk of tuKhoa.filter(laTuKhoaDai)) {
		let n = 0;
		for (const m of timTrongChiMuc(chiMuc, tk, { toiDa: 5 })) {
			const d = m.duong?.[0];
			if (!HANG_TAI_SAN.has(m.khop) || !d || daCo.has(d)) continue;
			daCo.add(d);
			taiSan.push({ ten: m.ten, duong: d, loai: m.loai });
			if (++n >= TAI_SAN_MOI_TU_KHOA || taiSan.length >= TRAN_TAI_SAN) break;
		}
		if (taiSan.length >= TRAN_TAI_SAN) break;
	}

	const chu = [ten, ...tuKhoa].filter(Boolean).join(", ");
	const viPham = timViPham(chu).length > 0 || doYmyl(chu).some((v) => v.loai === "hua_hen");
	const tkChuan = tuKhoa.map(chuanHoaManh);
	const ganSanPham = tkChuan.some((k) => sanPham.some((sp) => chuaTron(k, sp)));

	return {
		soDoiThu: new Set(khop.map((b) => b.doiThuId)).size,
		soBai: khop.length,
		trungXuHuong: trungXuHuong(tuKhoa, xuHuong),
		soBaiMinh,
		taiSan,
		soTaiSan: taiSan.length,
		viPham,
		ganSanPham,
		soBangChungBoQua,
		idKhop,
	};
}

const kep = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/**
 * 0..100. Nhu cầu (đối thủ dồn lực, xu hướng) 40%, khoảng trống của mình 30%, tài sản nội bộ
 * 30%. Vi phạm trừ 40 chứ không loại hẳn: loại hẳn là việc của rào ở khâu nhận đề xuất.
 */
export function diemHuong({ soDoiThu = 0, soBai = 0, trungXuHuong: xh = false, soBaiMinh = 0, soTaiSan = 0, viPham = false, ganSanPham = false }) {
	const nhuCau = (Math.min(soDoiThu, 5) / 5) * 0.6 + (Math.min(soBai, 20) / 20) * 0.3 + (xh ? 0.1 : 0);
	const khoangTrong = 1 / (1 + soBaiMinh);
	const taiSan = Math.min(soTaiSan, 10) / 10;
	const diem = 100 * (0.4 * nhuCau + 0.3 * khoangTrong + 0.3 * taiSan) + (ganSanPham ? 5 : 0) - (viPham ? 40 : 0);
	return Math.round(kep(diem, 0, 100));
}

/** Điểm cụm = điểm (theo số đo của riêng cụm) × hệ số trọng số NGƯỜI DÙNG đã chọn cho hướng (1..5). */
export function diemCum(chiSo, trongSo) {
	const t = kep(Math.round(Number(trongSo) || 1), 1, 5);
	return Math.round(diemHuong(chiSo) * (0.6 + 0.1 * t));
}
