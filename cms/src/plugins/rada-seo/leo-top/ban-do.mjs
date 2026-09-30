// Bản đồ sơ hở của một SERP + phiếu sửa cho trang mình (thuần). MÁY CHỦ dựng; mô hình chỉ
// báo từng trang nói những ý gì (`y`), chỗ nào rườm (`ruom`), ý nào khó dùng (`khoDung`).
// Lý do: gom ý giữa 10 trang, đếm tỉ lệ và so với trang mình là việc đếm — để mô hình tự
// kết luận "ý cốt lõi" thì mỗi lượt ra một bản đồ khác nhau và không ai kiểm được.
//
// TRIẾT LÝ (người dùng chốt): trang #1 là trang ÍT SƠ HỞ nhất, trải nghiệm tốt nhất — KHÔNG
// phải trang dài nhất. Nên ở đây không có phép tính nào đọc `soChu`/`chu`, và phiếu không bao
// giờ khuyên "viết dài hơn". Phép kiểm "đổi số chữ mọi trang → kết quả y hệt" giữ luật này.
import { chuanHoaManh } from "../luat/chuan-hoa.mjs";
import { doGiong } from "../luat/trung-lap.mjs";
import { timViPham } from "../luat/pham-vi-y-sy.mjs";
import { timTrongChiMuc } from "../noi-bo/chi-muc.mjs";

export const NGUONG_Y = 0.5;
export const NGUONG_COT_LOI = 0.6;
export const NGUONG_THUA = 0.2;
/** Câu trả lời đứng sau quá chừng này chữ thì người đọc phải cuộn mới thấy. */
export const TRAN_TRA_LOI_DAU = 150;
const THANG_CU = 24;
const HANG_TAI_SAN = new Set(["dung", "ten_khac", "chua"]);

/**
 * Tập cặp từ của một ý. KHÔNG dùng tapKhoa/tachTu của thước chống trùng: tập từ dừng của nó
 * bỏ "vi tri", "cach", "luu y" — đúng những chữ làm nên tên ý ("Vị trí huyệt", "Lưu ý").
 */
function khoaY(ten) {
	const k = chuanHoaManh(ten);
	const tu = k ? k.split(" ") : [];
	const cap = new Set();
	for (let i = 0; i < tu.length - 1; i++) cap.add(`${tu[i]}_${tu[i + 1]}`);
	return { k, motTu: tu.length === 1, cap };
}

function giongY(a, b) {
	if (!a.k || !b.k) return false;
	if (a.motTu || b.motTu) return a.k === b.k; // ý một từ không có cặp → so đẳng thức
	return doGiong(a.cap, b.cap) >= NGUONG_Y;
}

/** Gom liên kết đơn (bắc cầu); trả chỉ số nhóm cho từng phần tử, nhóm đánh số theo lần gặp đầu. */
function gomChiSo(ds) {
	const khoa = ds.map(khoaY);
	const cha = ds.map((_, i) => i);
	const goc = (i) => (cha[i] === i ? i : (cha[i] = goc(cha[i])));
	for (let i = 0; i < ds.length; i++)
		for (let j = i + 1; j < ds.length; j++) if (giongY(khoa[i], khoa[j])) cha[goc(j)] = goc(i);
	const so = new Map();
	return ds.map((_, i) => {
		const g = goc(i);
		if (!so.has(g)) so.set(g, so.size);
		return so.get(g);
	});
}

/** Gom các cách viết của cùng một ý. @returns {string[][]} */
export function gomY(ds) {
	const nhom = [];
	gomChiSo(ds).forEach((g, i) => (nhom[g] ??= []).push(ds[i]));
	return nhom;
}

const traLoiMuon = (sd) => sd?.viTriTraLoi == null || sd.viTriTraLoi > TRAN_TRA_LOI_DAU;
/** "Trả lời ở đầu": nhận định của Claude nếu có, không thì theo số đo. */
const traLoiDau = (t) => (t.cauTraLoiO ? t.cauTraLoiO === "dau" : !traLoiMuon(t.soDo));

function soThang(ngay, now) {
	const ms = Date.parse(String(ngay ?? ""));
	return Number.isFinite(ms) ? (now - ms) / (30.44 * 86_400_000) : null;
}
const moiCapNhat = (sd, now) => {
	const t = soThang(sd?.ngayCapNhat, now);
	return t != null && t <= THANG_CU;
};

/** Sơ hở trải nghiệm đo được từ `soDo` (không cờ nào đọc số chữ). */
function soHoTraiNghiem(t, now) {
	const sd = t.soDo ?? {};
	const ra = [];
	if (sd.viTriTraLoi == null) ra.push("Không có đoạn trả lời thẳng từ khoá");
	else if (sd.viTriTraLoi > TRAN_TRA_LOI_DAU) ra.push(`Trả lời muộn: đoạn trả lời đứng sau ${sd.viTriTraLoi} chữ`);
	if (!sd.coBang && (t.khoDung?.length ?? 0) >= 3) ra.push("Không có bảng dù có ≥ 3 ý dạng so sánh/liệt kê");
	if (!sd.soNguonNgoai) ra.push("Không dẫn nguồn ngoài nào");
	if (!sd.coTacGia) ra.push("Không ghi tác giả/người duyệt");
	const thang = soThang(sd.ngayCapNhat, now);
	if (thang == null) ra.push("Không ghi ngày cập nhật");
	else if (thang > THANG_CU) ra.push(`Cập nhật lần cuối quá 24 tháng (${String(sd.ngayCapNhat).slice(0, 10)})`);
	return ra;
}

/** Đặc điểm để so top 3 với hạng 4–10. */
const DAC_DIEM = [
	{ ten: "Trả lời thẳng từ khoá ngay ở đầu bài", co: (t) => traLoiDau(t) },
	{ ten: "Có bảng tóm tắt/so sánh", co: (t) => !!t.soDo?.coBang },
	{ ten: "Dẫn nguồn ngoài", co: (t) => (t.soDo?.soNguonNgoai ?? 0) > 0 },
	{ ten: "Ghi tác giả/người duyệt", co: (t) => !!t.soDo?.coTacGia },
	{ ten: "Cập nhật trong 24 tháng", co: (t, now) => moiCapNhat(t.soDo, now) },
];

/** Ý mang tính chữa trị: phiếu vẫn giữ ý nhưng nhắc diễn đạt trong phạm vi Y sỹ. */
function ghiChuPhamVi(ten) {
	const s = String(ten).normalize("NFC").toLowerCase();
	return timViPham(ten).length || /điều trị|chủ trị/.test(s) ? `${ten} (diễn đạt theo phạm vi Y sỹ)` : ten;
}

function taiSan(chiMuc, tuKhoa) {
	if (!chiMuc) return [];
	return timTrongChiMuc(chiMuc, tuKhoa, { toiDa: 5 })
		.filter((m) => HANG_TAI_SAN.has(m.khop))
		.map((m) => {
			const d = m.duong[0];
			if (m.loai === "huyet") return `Ảnh huyệt 3D + liên kết trang huyệt ${m.ten} (${d})`;
			if (m.loai === "kinh") return `Đồ hình đường kinh + liên kết ${m.ten} (${d})`;
			return `Liên kết từ điển: ${m.ten} (${d})`;
		});
}

const lamTron = (x) => Math.round(x * 100) / 100;

/**
 * @param {{tuKhoa: string, trang: {url: string, laMinh?: boolean, thuTu?: number, soDo?: object,
 *   y?: string[], cauTraLoiO?: "dau"|"giua"|"cuoi"|"khong", ruom?: string[], thieuCanCu?: string[],
 *   khoDung?: string[]}[], chiMuc?: object, now?: number}} p
 */
export function dungBanDo({ tuKhoa, trang = [], chiMuc, now = Date.now() }) {
	const doiThu = trang.filter((t) => !t.laMinh);
	const minh = trang.find((t) => t.laMinh) ?? null;

	// Mọi lần nhắc ý, của mọi trang (kể cả trang mình), gom một lượt để cùng một bộ nhóm.
	const lanNhac = [];
	trang.forEach((t, ti) => {
		for (const y of t.y ?? []) {
			const ten = String(y ?? "").trim();
			if (chuanHoaManh(ten)) lanNhac.push({ ti, ten });
		}
	});
	const nhomCua = gomChiSo(lanNhac.map((x) => x.ten));
	const nhom = [];
	lanNhac.forEach((x, i) => {
		const n = (nhom[nhomCua[i]] ??= { trang: new Set(), cachViet: new Map() });
		n.trang.add(x.ti);
		n.cachViet.set(x.ten, (n.cachViet.get(x.ten) ?? 0) + 1);
	});
	const Y = nhom.map((n) => {
		let ten = "", nhieu = 0;
		for (const [c, so] of n.cachViet) if (so > nhieu) [ten, nhieu] = [c, so]; // hoà → cách viết gặp trước
		const coDoiThu = [...n.trang].filter((ti) => !trang[ti].laMinh).length;
		return { ten, trang: n.trang, tiLe: doiThu.length ? lamTron(coDoiThu / doiThu.length) : 0 };
	});
	const urlCo = (y) => trang.filter((_, ti) => y.trang.has(ti)).map((t) => t.url);
	const theoTiLe = (a, b) => b.tiLe - a.tiLe;

	const cotLoi = doiThu.length ? Y.filter((y) => y.tiLe >= NGUONG_COT_LOI).sort(theoTiLe) : [];
	const thua = doiThu.length ? Y.filter((y) => y.tiLe <= NGUONG_THUA && y.tiLe < NGUONG_COT_LOI).sort(theoTiLe) : [];

	const yCotLoi = cotLoi.map((y) => ({
		ten: y.ten,
		tiLe: y.tiLe,
		trangCo: urlCo(y),
		trangThieu: trang.filter((_, ti) => !y.trang.has(ti)).map((t) => t.url),
	}));
	const yThua = thua.map((y) => ({ ten: y.ten, tiLe: y.tiLe, trangCo: urlCo(y) }));

	const soHo = trang.map((t, ti) => ({
		url: t.url,
		thieuY: cotLoi.filter((y) => !y.trang.has(ti)).map((y) => y.ten),
		traiNghiem: soHoTraiNghiem(t, now),
	}));

	// Dấu hiệu thắng: cần đủ 3 trang top và ít nhất một trang hạng 4–10 để có cái mà so.
	const top3 = doiThu.filter((t) => t.thuTu >= 1 && t.thuTu <= 3);
	const giua = doiThu.filter((t) => t.thuTu >= 4 && t.thuTu <= 10);
	const dauHieuThang =
		top3.length >= 3 && giua.length
			? DAC_DIEM.filter((d) => top3.every((t) => d.co(t, now)) && giua.filter((t) => d.co(t, now)).length / giua.length < 0.5).map(
					(d) => d.ten,
				)
			: [];

	let phieu = { themY: [], duaTraLoiLenDau: false, cat: [], traiNghiem: [], taiSanRieng: [] };
	if (minh) {
		const im = trang.indexOf(minh);
		const cat = [...(minh.ruom ?? []), ...thua.filter((y) => y.trang.has(im)).map((y) => y.ten)];
		phieu = {
			themY: soHo[im].thieuY.map(ghiChuPhamVi),
			duaTraLoiLenDau: traLoiMuon(minh.soDo) && top3.filter(traLoiDau).length >= 2,
			cat: [...new Set(cat)],
			traiNghiem: soHo[im].traiNghiem,
			taiSanRieng: taiSan(chiMuc, tuKhoa),
		};
	}

	return { yCotLoi, yThua, soHo, dauHieuThang, phieu };
}
