// Khoảng trống nội dung bằng LUẬT, không gọi mô hình: chủ đề đối thủ có mà mình chưa có,
// gom nhóm theo độ giống (cùng thước với chống trùng), rồi chấm điểm.
//
// Điểm = 3 × số đối thủ cùng viết (tối đa 3) + số bài (tối đa 5) + 3 nếu trúng xu hướng
//        − 8 nếu tên/từ khoá cụm nghiêng chữa trị hay hứa kết quả.
// Nhiều đối thủ cùng viết = có người tìm thật; đó là tín hiệu mạnh nhất nên nhân 3.
import { boDau } from "../luat/chuan-hoa.mjs";
import { doGiong, gomNhom, tapKhoa, timTrung } from "../luat/trung-lap.mjs";
import { timViPham } from "../luat/pham-vi-y-sy.mjs";
import { doYmyl } from "../luat/ymyl.mjs";

export const TRAN_CUM = 50;

/** Chủ đề đại diện của nhóm: bài giống các bài còn lại nhất. */
function daiDien(baiNhom) {
	const tap = baiNhom.map((b) => tapKhoa({ tieuDe: b.chuDe, tuKhoa: b.tuKhoa }));
	let tot = 0, diemTot = -1;
	tap.forEach((a, i) => {
		const d = tap.reduce((s, b, j) => (i === j ? s : s + doGiong(a, b)), 0);
		if (d > diemTot) (diemTot = d), (tot = i);
	});
	return baiNhom[tot];
}

/** 6 từ khoá xuất hiện nhiều nhất trong nhóm (khử trùng theo dạng bỏ dấu). */
function tuKhoaNhom(baiNhom) {
	const dem = new Map();
	for (const b of baiNhom)
		for (const k of b.tuKhoa) {
			const kk = boDau(k).trim();
			if (!kk) continue;
			const cu = dem.get(kk) ?? { chu: k.trim(), n: 0 };
			cu.n++;
			dem.set(kk, cu);
		}
	return [...dem.values()].sort((a, b) => b.n - a.n).slice(0, 6).map((x) => x.chu);
}

/** Trúng xu hướng khi một cụm tìm kiếm chứa trọn một từ khoá ≥ 2 từ của nhóm, hoặc ngược lại. */
export function trungXuHuong(tuKhoa, xuHuong) {
	const xh = xuHuong.map((x) => boDau(x));
	return tuKhoa.some((k) => {
		const kk = boDau(k).trim();
		if (kk.split(/\s+/).length < 2) return false;
		return xh.some((x) => x.includes(kk) || kk.includes(x));
	});
}

export function chamDiem({ soDoiThu, soBai, coXuHuong, viPham }) {
	return 3 * Math.min(soDoiThu, 3) + Math.min(soBai, 5) + (coXuHuong ? 3 : 0) - (viPham ? 8 : 0);
}

/**
 * @param {{
 *   chuDeMinh: {chuDe: string, tuKhoa: string[]}[],
 *   chuDeDoiThu: {id: string, doiThuId: string, chuDe: string, tuKhoa: string[]}[],
 *   xuHuong: string[],
 * }} o
 * @returns {{tenCum: string, tuKhoa: string[], soDoiThu: number, soBai: number, coXuHuong: boolean, viPham: boolean, diem: number, viDu: string[]}[]}
 */
export function timKhoangTrong({ chuDeMinh, chuDeDoiThu, xuHuong }) {
	const minh = chuDeMinh.map((m, i) => ({ id: `m${i}`, tieuDe: m.chuDe, tuKhoa: m.tuKhoa }));
	const thieu = chuDeDoiThu.filter((t) => !timTrung({ tieuDe: t.chuDe, tuKhoa: t.tuKhoa }, minh));
	const theoId = new Map(thieu.map((t) => [t.id, t]));
	const nhom = gomNhom(thieu.map((t) => ({ id: t.id, tieuDe: t.chuDe, tuKhoa: t.tuKhoa })));
	const ra = nhom.map((ids) => {
		const bai = ids.map((id) => theoId.get(id));
		const tuKhoa = tuKhoaNhom(bai);
		const tenCum = daiDien(bai).chuDe;
		const chu = `${tenCum}. ${tuKhoa.join(", ")}`;
		const viPham = timViPham(chu).length > 0 || doYmyl(chu).some((v) => v.loai === "hua_hen");
		const soDoiThu = new Set(bai.map((b) => b.doiThuId)).size;
		const coXuHuong = trungXuHuong(tuKhoa, xuHuong);
		return {
			tenCum,
			tuKhoa,
			soDoiThu,
			soBai: bai.length,
			coXuHuong,
			viPham,
			diem: chamDiem({ soDoiThu, soBai: bai.length, coXuHuong, viPham }),
			viDu: bai.slice(0, 5).map((b) => b.chuDe),
		};
	});
	return ra.sort((a, b) => b.diem - a.diem || b.soBai - a.soBai).slice(0, TRAN_CUM);
}
