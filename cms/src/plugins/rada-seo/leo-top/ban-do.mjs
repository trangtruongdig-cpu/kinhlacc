// Bản đồ sơ hở của một SERP + phiếu sửa cho trang mình (thuần). MÁY CHỦ dựng; mô hình chỉ
// báo từng trang nói những ý gì (`y`), chỗ nào rườm (`ruom`), ý nào khó dùng (`khoDung`).
// Lý do: gom ý giữa 10 trang, đếm tỉ lệ và so với trang mình là việc đếm — để mô hình tự
// kết luận "ý cốt lõi" thì mỗi lượt ra một bản đồ khác nhau và không ai kiểm được.
//
// TRIẾT LÝ (người dùng chốt): trang #1 là trang ÍT SƠ HỞ nhất, trải nghiệm tốt nhất — KHÔNG
// phải trang dài nhất. Nên ở đây không có phép tính nào đọc `soChu`/`chu`, và phiếu không bao
// giờ khuyên "viết dài hơn". Phép kiểm "đổi số chữ mọi trang → kết quả y hệt" giữ luật này.
import { chuanHoaManh } from "../luat/chuan-hoa.mjs";
import { timViPham } from "../luat/pham-vi-y-sy.mjs";
import { timTrongChiMuc } from "../noi-bo/chi-muc.mjs";

/** Hai ý chung nhóm khi |A∩B| / min(|A|,|B|) ≥ ngưỡng này (và chung ≥ 1 từ). */
export const NGUONG_Y = 0.6;
export const NGUONG_COT_LOI = 0.6;
export const NGUONG_THUA = 0.2;
/** Câu trả lời đứng sau quá chừng này chữ thì người đọc phải cuộn mới thấy. */
export const TRAN_TRA_LOI_DAU = 150;
const THANG_CU = 24;
const HANG_TAI_SAN = new Set(["dung", "ten_khac", "chua"]);
/** Dưới chừng này trang đối thủ thì "≤ 20% trang có" là 0 hay 1 trang — chưa đủ để gọi là thừa. */
export const SO_TRANG_KET_LUAN_THUA = 5;

/**
 * Hư từ: không mang nghĩa của TÊN ý ("vị trí CỦA huyệt", "NHỮNG lưu ý", "CÁCH xác định…").
 * KHÔNG dùng tập từ dừng của thước chống trùng: nó bỏ cả "vi tri", "luu y" — đúng tên ý.
 */
const HU_TU = new Set(["cua", "nhung", "cac", "khi", "la", "ve", "va", "cho", "trong", "voi", "cach"]);

/**
 * Tập từ của một ý, đã bỏ hư từ và từ của TỪ KHOÁ: mọi trang trong SERP đều nói về từ khoá,
 * nên "vị trí HUYỆT" và "vị trí" là một ý; và với "bài thuốc Lục Vị Địa Hoàng Hoàn", các mục
 * "Thành phần"/"Cách dùng" không được dính nhau qua tên bài. Bỏ hết mà rỗng (ý chính là từ
 * khoá) thì giữ nguyên tập từ để còn so đẳng thức.
 */
function khoaY(ten, boTu) {
	const tatCa = chuanHoaManh(ten).split(" ").filter(Boolean);
	const loc = tatCa.filter((w) => !HU_TU.has(w) && !boTu.has(w));
	const tu = new Set(loc.length ? loc : tatCa);
	return { tu, chuoi: [...tu].sort().join(" "), cuc: cucCua(tatCa) };
}

/**
 * Từ ĐẢO NGHĨA / hạn định của một ý (chữ bỏ dấu). "Chỉ định" và "Chống chỉ định", "Tác dụng" và
 * "Tác dụng phụ", "nên dùng" và "không nên dùng" chung gần hết chữ nên phép bao hàm gộp làm một —
 * và trang mình có "Chỉ định" là phiếu im lặng về mục CHỐNG chỉ định mà 60% đối thủ có. Trên
 * trang Đông Y đó là mục an toàn, mất nó là mất thứ tệ nhất. Hai ý khác nhau ở bất kỳ từ nào dưới
 * đây thì KHÔNG bao giờ chung nhóm. Đọc trên CẢ tập từ (trước khi bỏ từ khoá), để từ khoá
 * "… không nên ăn gì" không xoá mất chữ "không" của ý.
 * Chấp nhận: "phu" (phụ nữ), "cam" (cảm), "ky" (chu kỳ) cũng tính — chỉ làm tách thêm nhóm,
 * không bao giờ gộp nhầm.
 */
const TU_CUC = new Set(["chong", "khong", "phu", "ky", "cam", "kieng", "tranh"]);
const CUM_CUC = ["tac hai", "rui ro", "bien chung"];
function cucCua(tatCa) {
	const c = tatCa.filter((w) => TU_CUC.has(w));
	const noi = ` ${tatCa.join(" ")} `;
	for (const cum of CUM_CUC) if (noi.includes(` ${cum} `)) c.push(cum);
	return [...new Set(c)].sort().join("|");
}

/** Độ giống: bao hàm |A∩B|/min; ý một từ chỉ so đẳng thức (một từ chung thì bao hàm luôn = 1). */
function doGiongY(a, b) {
	if (!a.tu.size || !b.tu.size) return 0;
	if (a.cuc !== b.cuc) return 0; // khác cực (chống/không/phụ/kiêng…) → hai ý khác nhau
	if (a.tu.size === 1 || b.tu.size === 1) return a.chuoi === b.chuoi ? 1 : 0;
	let chung = 0;
	for (const w of a.tu) if (b.tu.has(w)) chung++;
	return chung ? chung / Math.min(a.tu.size, b.tu.size) : 0;
}

const tuCuaTuKhoa = (tuKhoa) => new Set(chuanHoaManh(tuKhoa).split(" ").filter(Boolean));

/**
 * Gom theo ĐẠI DIỆN nhóm (phần tử đầu tiên), không bắc cầu: gom liên kết đơn từng để
 * "bấm" ~ "bấm xoa" ~ "xoa" kéo hai ý không chung chữ nào về một nhóm. Mỗi ý vào nhóm có
 * đại diện giống nhất (≥ NGUONG_Y), không có thì mở nhóm mới.
 * @returns {number[]} chỉ số nhóm cho từng phần tử, đánh số theo lần gặp đầu
 */
function gomChiSo(ds, tuKhoa = "") {
	const bo = tuCuaTuKhoa(tuKhoa);
	const daiDien = [];
	return ds.map((ten) => {
		const k = khoaY(ten, bo);
		let tot = -1, diem = 0;
		daiDien.forEach((d, i) => {
			const g = doGiongY(k, d);
			if (g >= NGUONG_Y && g > diem) [tot, diem] = [i, g];
		});
		if (tot === -1) {
			daiDien.push(k);
			return daiDien.length - 1;
		}
		return tot;
	});
}

/** Gom các cách viết của cùng một ý. @returns {string[][]} */
export function gomY(ds, { tuKhoa = "" } = {}) {
	const nhom = [];
	gomChiSo(ds, tuKhoa).forEach((g, i) => (nhom[g] ??= []).push(ds[i]));
	return nhom;
}

/** Cụm khuyên độ dài — phiếu không bao giờ nói "viết dài hơn" (triết lý người dùng chốt). */
const CUM_DO_DAI = ["dài hơn", "thêm chữ", "số chữ", "viết dày", "viết dài", "độ dài", "dài thêm"];
const khuyenDoDai = (s) => {
	const t = String(s).normalize("NFC").toLowerCase();
	return CUM_DO_DAI.some((c) => t.includes(c));
};
/** Mục Claude báo được dùng cho phiếu: không rỗng, không khuyên độ dài, không vượt phạm vi Y sỹ. */
const mucDung = (s) => !!String(s ?? "").trim() && !khuyenDoDai(s) && !timViPham(s).length;
const sach = (ds) => (Array.isArray(ds) ? ds : []).map((x) => String(x ?? "").trim()).filter(Boolean);

const doMuon = (sd) => sd?.viTriTraLoi == null || sd.viTriTraLoi > TRAN_TRA_LOI_DAU;
/**
 * "Trả lời muộn" chỉ khi Claude (đã ĐỌC trang) và số đo cùng nói thế, hoặc Claude không báo.
 * Số đo một mình dễ trượt (mục lục lạ, đoạn mở đầu kiểu câu hỏi) — đã gặp phiếu đòi "đưa câu
 * trả lời lên đầu" cho trang trả lời ngay câu thứ hai.
 */
const traLoiMuon = (t) => (t.cauTraLoiO ? t.cauTraLoiO !== "dau" && doMuon(t.soDo) : doMuon(t.soDo));
/** "Trả lời ở đầu": nhận định của Claude nếu có, không thì theo số đo. */
const traLoiDau = (t) => (t.cauTraLoiO ? t.cauTraLoiO === "dau" : !doMuon(t.soDo));

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
	if (traLoiMuon(t)) {
		if (sd.viTriTraLoi == null) ra.push("Không có đoạn trả lời thẳng từ khoá");
		else ra.push(`Trả lời muộn: đoạn trả lời đứng sau ${sd.viTriTraLoi} chữ`);
	}
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

/** Ý dùng thuật ngữ chuẩn "điều trị/chủ trị": giữ, nhắc diễn đạt trong phạm vi Y sỹ. */
function ghiChuPhamVi(ten) {
	const s = String(ten).normalize("NFC").toLowerCase();
	return /điều trị|chủ trị/.test(s) ? `${ten} (diễn đạt theo phạm vi Y sỹ)` : ten;
}

const duongCua = (u) => {
	try {
		return new URL(u).pathname.replace(/\/+$/, "") || "/";
	} catch {
		return String(u ?? "").replace(/\/+$/, "");
	}
};

/** Tài sản riêng của site cho từ khoá — trừ chính trang đang được sửa (tự liên kết tới mình là vô nghĩa). */
function taiSan(chiMuc, tuKhoa, urlMinh) {
	if (!chiMuc) return [];
	const minh = duongCua(urlMinh);
	return timTrongChiMuc(chiMuc, tuKhoa, { toiDa: 5 })
		.filter((m) => HANG_TAI_SAN.has(m.khop) && duongCua(m.duong[0]) !== minh)
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
	const ghiChu = [];

	// Mọi lần nhắc ý, của mọi trang (kể cả trang mình), gom một lượt để cùng một bộ nhóm.
	// Ý khuyên độ dài ("viết dày phần…") là nhận xét lạc chỗ, không phải ý của trang → bỏ.
	const lanNhac = [];
	trang.forEach((t, ti) => {
		for (const y of t.y ?? []) {
			const ten = String(y ?? "").trim();
			if (chuanHoaManh(ten) && !khuyenDoDai(ten)) lanNhac.push({ ti, ten });
		}
	});
	const nhomCua = gomChiSo(
		lanNhac.map((x) => x.ten),
		tuKhoa,
	);
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
		return { ten, trang: n.trang, coDoiThu, tiLe: doiThu.length ? lamTron(coDoiThu / doiThu.length) : 0 };
	});
	const urlCo = (y) => trang.filter((_, ti) => y.trang.has(ti)).map((t) => t.url);
	const theoTiLe = (a, b) => b.tiLe - a.tiLe;

	const cotLoi = doiThu.length ? Y.filter((y) => y.tiLe >= NGUONG_COT_LOI).sort(theoTiLe) : [];
	// Ý thừa: đối thủ CÓ nói nhưng hiếm (≤ 20%). Ý không đối thủ nào có là của riêng trang
	// mình — khác biệt, giữ — không bao giờ là thừa. Ít hơn 5 trang đối thủ thì chưa kết luận.
	const duThua = doiThu.length >= SO_TRANG_KET_LUAN_THUA;
	if (doiThu.length && !duThua)
		ghiChu.push(
			`Chỉ đo được ${doiThu.length} trang đối thủ (cần ≥ ${SO_TRANG_KET_LUAN_THUA}) — chưa kết luận ý nào là thừa.`,
		);
	const thua = duThua ? Y.filter((y) => y.coDoiThu > 0 && y.tiLe <= NGUONG_THUA && y.tiLe < NGUONG_COT_LOI).sort(theoTiLe) : [];

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
		thieuCanCu: sach(t.thieuCanCu),
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

	let phieu = { themY: [], duaTraLoiLenDau: false, cat: [], khacBiet: [], traiNghiem: [], boSungCanCu: [], taiSanRieng: [], ghiChu: [] };
	if (minh) {
		const im = trang.indexOf(minh);
		const phieuGhiChu = [];
		const themY = [];
		for (const ten of soHo[im].thieuY) {
			const vp = timViPham(ten);
			if (vp.length) phieuGhiChu.push(`Ý cốt lõi "${ten}" có chữ vượt phạm vi Y sỹ — nếu thêm, diễn đạt: ${vp[0].goiY}.`);
			else if (!khuyenDoDai(ten)) themY.push(ghiChuPhamVi(ten));
		}
		// Đoạn rườm là thứ CẮT đi: đoạn "chữa khỏi hẳn" vượt phạm vi Y sỹ càng phải cắt, nên chỉ lọc
		// lời khuyên độ dài, KHÔNG lọc phạm vi Y sỹ ở đây (lọc đó giữ cho ý THÊM vào).
		const cat = [...sach(minh.ruom).filter((x) => !khuyenDoDai(x)), ...thua.filter((y) => y.trang.has(im)).map((y) => y.ten).filter(mucDung)];
		phieu = {
			themY,
			duaTraLoiLenDau: traLoiMuon(minh) && top3.filter(traLoiDau).length >= 2,
			cat: [...new Set(cat)],
			khacBiet: Y.filter((y) => y.coDoiThu === 0 && y.trang.has(im)).map((y) => y.ten),
			traiNghiem: soHo[im].traiNghiem,
			boSungCanCu: soHo[im].thieuCanCu,
			taiSanRieng: taiSan(chiMuc, tuKhoa, minh.url),
			ghiChu: phieuGhiChu,
		};
		// Khác biệt (khuyên GIỮ) và căn cứ cần bổ sung cũng là chữ đi vào bài: mục vượt phạm vi Y sỹ
		// ("Chữa khỏi mất ngủ") không được khuyên giữ nguyên — sang ghiChu kèm cách diễn đạt.
		const quaRao = (ds, nhan) =>
			ds.filter((x) => {
				const vp = timViPham(x);
				if (vp.length) phieuGhiChu.push(`${nhan} "${x}" có chữ vượt phạm vi Y sỹ — diễn đạt lại: ${vp[0].goiY}.`);
				return !vp.length;
			});
		phieu.khacBiet = quaRao(phieu.khacBiet, "Ý khác biệt");
		phieu.boSungCanCu = quaRao(phieu.boSungCanCu, "Căn cứ cần bổ sung");
	}

	return { yCotLoi, yThua, soHo, dauHieuThang, ghiChu, phieu };
}
