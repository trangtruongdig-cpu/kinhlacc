// Chỉ số và điểm của một HƯỚNG nội dung / một CỤM trong hướng (thuần).
//
// Claude đề xuất hướng và trọng số GỢI Ý, nhưng KHÔNG tự chấm: ngày 30/09/2026 mô hình đã gắn
// "An toàn" cho "Ứng dụng châm cứu chữa bệnh hiệu quả…". Nên điểm ở đây chỉ đi ra từ số đo:
// đối thủ nào viết thật (id bài có trong kho), mình đã có bao nhiêu bài, từ điển của mình có
// bao nhiêu trang để dẫn link, và các rào phạm vi Y sỹ / YMYL dùng chung với phần còn lại.
import { chuanHoaManh } from "../luat/chuan-hoa.mjs";
import { taoBoKhoa, timTrungBo } from "../luat/trung-lap.mjs";
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
const TRAN_TAI_SAN = 15;

/** `kim` (đã chuẩn hoá) nằm trọn theo ranh giới từ trong `hay` (đã chuẩn hoá). */
const chuaTron = (hay, kim) => !!kim && ` ${hay} `.includes(` ${kim} `);

/**
 * @param {{
 *   tuKhoa: string[], idBaiDoiThu: string[],
 *   chuDeDoiThu: Map<string, {doiThuId: string, chuDe: string, tuKhoa: string[]}>,
 *   baiMinh: {tieuDe: string, tuKhoa: string[]}[], xuHuong: string[], chiMuc: object, sanPham?: string[],
 * }} o
 * @returns {{soDoiThu: number, soBai: number, trungXuHuong: boolean, soBaiMinh: number,
 *   taiSan: {ten: string, duong: string, loai: string}[], soTaiSan: number, viPham: boolean, ganSanPham: boolean}}
 */
export function tinhChiSo({ tuKhoa = [], idBaiDoiThu = [], chuDeDoiThu, baiMinh = [], xuHuong = [], chiMuc, sanPham = TU_SAN_PHAM }) {
	// Chỉ đếm id có thật trong kho: id mô hình bịa ra không được thổi phồng nhu cầu.
	const bai = [...new Set(idBaiDoiThu)].map((id) => chuDeDoiThu.get(id)).filter(Boolean);
	const soDoiThu = new Set(bai.map((b) => b.doiThuId)).size;

	// Bài của mình "đã phủ" hướng: giống theo cùng thước chống trùng, HOẶC nhắc trọn một từ khoá
	// ≥ 2 từ. Nhánh thứ hai cần vì tiêu đề blog hay dài ("Mất ngủ và đồng hồ kinh lạc") nên
	// Jaccard cặp từ tụt dưới ngưỡng dù bài nói đúng chuyện đó.
	const mau = { tieuDe: tuKhoa[0] ?? "", tuKhoa };
	const tkDai = tuKhoa.map(chuanHoaManh).filter((k) => k.split(" ").length >= 2);
	const bo = taoBoKhoa(baiMinh.map((b, i) => ({ id: i, tieuDe: b.tieuDe ?? "", tuKhoa: b.tuKhoa ?? [] })));
	let soBaiMinh = 0;
	bo.ds.forEach((b, i) => {
		const giong = timTrungBo(mau, { ds: [b], tap: [bo.tap[i]] });
		const chu = chuanHoaManh(`${b.tieuDe} ${b.tuKhoa.join(" ")}`);
		if (giong || tkDai.some((k) => chuaTron(chu, k))) soBaiMinh++;
	});

	// Tài sản nội bộ: trang từ điển/blog có thật để bài trong hướng dẫn link vào.
	const taiSan = [];
	const daCo = new Set();
	for (const tk of tuKhoa) {
		for (const m of timTrongChiMuc(chiMuc, tk, { toiDa: 5 })) {
			const d = m.duong?.[0];
			if (!HANG_TAI_SAN.has(m.khop) || !d || daCo.has(d)) continue;
			daCo.add(d);
			taiSan.push({ ten: m.ten, duong: d, loai: m.loai });
		}
		if (taiSan.length >= TRAN_TAI_SAN) break;
	}
	taiSan.splice(TRAN_TAI_SAN);

	const chu = tuKhoa.join(", ");
	const viPham = timViPham(chu).length > 0 || doYmyl(chu).some((v) => v.loai === "hua_hen");
	const tkChuan = tuKhoa.map(chuanHoaManh);
	const ganSanPham = tkChuan.some((k) => sanPham.some((sp) => chuaTron(k, sp)));

	return {
		soDoiThu,
		soBai: bai.length,
		trungXuHuong: trungXuHuong(tuKhoa, xuHuong),
		soBaiMinh,
		taiSan,
		soTaiSan: taiSan.length,
		viPham,
		ganSanPham,
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
