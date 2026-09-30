// Chống trùng chủ đề: so một chủ đề với các bài đã có (kể cả nháp) và với tên mục từ điển.
//
// Đo trên 22 bài thật ngày 30/09/2026 (__fixture__/bai-viet-30-09.json): nhóm "đo nhiệt độ
// 24 tỉnh huyệt" (7 bài) nối liền ở ngưỡng 0,30; cặp khác đề tài giống nhất là #10–#20 (0,27).
// Đổi tập từ dừng hay cách tách cặp từ là đổi mọi con số này — chạy lại phép kiểm vàng.
import { boDau, chuanHoaManh } from "./chuan-hoa.mjs";

export const NGUONG_TRUNG = 0.3;

const TU_DUNG = new Set(
	(
		"va cua trong theo cho voi cac nhung mot la gi tu den hien dai hieu qua quan trong " +
		"cach giai phap kham pha luu y tac dung vi tri dong y hoc co truyen"
	).split(" "),
);

/** Tách từ đã bỏ dấu, bỏ từ dừng. */
export function tachTu(s) {
	return boDau(s)
		.replace(/[^a-z0-9 ]/g, " ")
		.split(/\s+/)
		.filter((w) => w && !TU_DUNG.has(w));
}

/**
 * Tập CẶP TỪ liền nhau từ tiêu đề + 3 từ khoá đầu. Dùng cặp chứ không dùng từ lẻ vì
 * "tỉnh huyệt", "kinh lạc" mới mang nghĩa; từ lẻ "huyet" có ở mọi bài.
 */
export function tapKhoa({ tieuDe = "", tuKhoa = [] }) {
	const t = [...tachTu(tieuDe), ...tachTu(tuKhoa.slice(0, 3).join(" "))];
	const tap = new Set();
	for (let i = 0; i < t.length - 1; i++) tap.add(`${t[i]}_${t[i + 1]}`);
	return tap;
}

/** Hệ số Jaccard giữa hai tập. */
export function doGiong(a, b) {
	let chung = 0;
	for (const x of a) if (b.has(x)) chung++;
	const hop = a.size + b.size - chung;
	return hop === 0 ? 0 : chung / hop;
}

/**
 * Gom nhóm liên kết đơn: hai bài giống ≥ ngưỡng thì chung nhóm, bắc cầu.
 * @param {{id:number|string, tieuDe:string, tuKhoa:string[]}[]} ds
 * @returns {(number|string)[][]} mọi nhóm (kể cả nhóm một bài), mỗi nhóm xếp theo id
 */
export function gomNhom(ds, nguong = NGUONG_TRUNG) {
	const tap = ds.map(tapKhoa);
	const cha = ds.map((_, i) => i);
	const goc = (i) => (cha[i] === i ? i : (cha[i] = goc(cha[i])));
	for (let i = 0; i < ds.length; i++)
		for (let j = i + 1; j < ds.length; j++)
			if (doGiong(tap[i], tap[j]) >= nguong) cha[goc(i)] = goc(j);
	const nhom = new Map();
	ds.forEach((b, i) => {
		const g = goc(i);
		if (!nhom.has(g)) nhom.set(g, []);
		nhom.get(g).push(b.id);
	});
	return [...nhom.values()].map((n) => n.sort((x, y) => (x > y ? 1 : -1)));
}

/**
 * Bài có sẵn giống chủ đề mới nhất, nếu vượt ngưỡng.
 * @returns {{id:number|string, doGiong:number} | null}
 */
export function timTrung(moi, ds, nguong = NGUONG_TRUNG) {
	const a = tapKhoa(moi);
	let tot = null;
	for (const b of ds) {
		const v = doGiong(a, tapKhoa(b));
		if (v >= nguong && (!tot || v > tot.doGiong)) tot = { id: b.id, doGiong: v };
	}
	return tot;
}

/**
 * Tính sẵn tập khoá của một danh sách để so NHIỀU lần — timTrung dựng lại tapKhoa của mọi bài
 * có sẵn ở mỗi lời gọi, nên lọc n chủ đề qua m bài tốn n×m lần tách từ thay vì m.
 * @returns {{ds: object[], tap: Set<string>[]}}
 */
export function taoBoKhoa(ds) {
	return { ds, tap: ds.map(tapKhoa) };
}

/** Như timTrung nhưng dùng bộ khoá tính sẵn (taoBoKhoa). Cùng kết quả. */
export function timTrungBo(moi, bo, nguong = NGUONG_TRUNG) {
	const a = tapKhoa(moi);
	let tot = null;
	for (let i = 0; i < bo.ds.length; i++) {
		const v = doGiong(a, bo.tap[i]);
		if (v >= nguong && (!tot || v > tot.doGiong)) tot = { id: bo.ds[i].id, doGiong: v };
	}
	return tot;
}

const TIEN_TO = /^(huyet|kinh|bai thuoc|vi thuoc|duoc lieu|cay|benh) /;

/**
 * Từ khoá chính có trùng tên một mục từ điển không. `tenTuDien` là Set các tên đã qua
 * chuanHoaManh. Thử cả nguyên dạng lẫn dạng bỏ tiền tố ("huyệt tam âm giao" → "tam am giao").
 * @returns {string|null} tên khớp
 */
export function trungTuDien(tuKhoaChinh, tenTuDien) {
	const k = chuanHoaManh(tuKhoaChinh);
	if (tenTuDien.has(k)) return k;
	const bo = k.replace(TIEN_TO, "");
	return bo !== k && tenTuDien.has(bo) ? bo : null;
}
