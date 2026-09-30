// Việc của routine CHIẾN LƯỢC hằng tuần (thuần): đưa dữ liệu đối thủ cho Claude, nhận đề
// xuất HƯỚNG → CỤM → BÀI DỰ KIẾN, và chặn mọi thứ không qua rào TRƯỚC khi vào kho.
//
// Nguyên tắc: Claude đề xuất, máy chủ đo và chấm. Điểm Claude tự gắn bị bỏ; id bài đối thủ
// phải có thật; link phải sống trên site thật; chữ phải trong phạm vi Y sỹ. Tên hướng/cụm/bài
// do Claude sinh ra từ chữ đối thủ là dữ liệu KHÔNG tin cậy — trả lại cho routine thì bọc dấu mốc.
import * as kho from "../kho.mjs";
import { xuHuongGanNhat } from "../ca-radar.mjs";
import { chuanHoaManh } from "../luat/chuan-hoa.mjs";
import { timViPham, kiemPhamVi } from "../luat/pham-vi-y-sy.mjs";
import { timTrung, trungTuDien, tapKhoa, doGiong, NGUONG_TRUNG } from "../luat/trung-lap.mjs";
import { layChiMuc } from "../noi-bo/nap.mjs";
import { tinhChiSo, diemHuong, diemCum, taoBoChuDe, timKhop, laTuKhoaDai } from "./chi-so.mjs";
import { LOI_NHAC_DE_XUAT_HUONG, LOI_NHAC_PHAN_CUM, LOI_NHAC_LAP_KE_HOACH } from "../loi-dan.mjs";

export const TRAN_HUONG_MOI_LUOT = 8;
export const TRAN_CUM_MOI_LUOT = 20;
export const TRAN_KE_HOACH_MOI_LUOT = 10;
export const SO_BAI_DOI_THU_TOI_THIEU = 3;
export const SO_LINK_DICH_TOI_THIEU = 5;
/** Ý định tìm kiếm của bài dự kiến: tra cứu / tìm hiểu / so sánh / hướng dẫn. */
export const Y_DINH = ["tra_cuu", "tim_hieu", "so_sanh", "huong_dan"];
/** Số bài đối thủ tối đa gắn làm bằng chứng cho một hướng/cụm/bài dự kiến. */
const SO_BAI_BANG_CHUNG = 5;
/**
 * Kiểm trang thật trong MỘT lời gọi deXuatKeHoach: một hàng đợi chung cho mọi bài (trụ cột +
 * link), 4 trang đồng thời, tối đa 40 lượt tải MỚI (trang đã có trong đệm không tính) và 80 s.
 * 10 bài × 13 đường mà đệm nguội, tuần tự từng bài, là hàng trăm giây — quá hạn chờ của công cụ
 * MCP, và giữ nginx site thật đang phục vụ người đọc.
 */
export const NGAN_SACH_KIEM = { dongThoi: 4, toiDaKiem: 40, hanMs: 80_000 };
/** Giống trong khoảng này (dưới ngưỡng trùng) thì nhận nhưng ghi cảnh báo cho người duyệt. */
const NGUONG_CANH_BAO_TRUNG = 0.2;
/**
 * Độ giống để HIỂN THỊ cạnh ngưỡng trùng 0,30: làm tròn XUỐNG 3 chữ số. Làm tròn thường 2 chữ
 * số thì 0,296 hiện "0.30" — người duyệt tưởng đã chạm ngưỡng mà máy vẫn nhận.
 */
export const soGiongHienThi = (v) => Math.floor(v * 1000 + 1e-9) / 1000;
/** Hướng mới trùng tập chủ đề đối thủ với một hướng đã bỏ từ chừng này trở lên → cùng hướng. */
const NGUONG_JACCARD_BO = 0.5;

/**
 * Bọc dữ liệu không tin cậy trong dấu mốc, cùng cách thoát như chữ trang ở mcp-viec.mjs:
 * "<<<"/">>>" trong dữ liệu bị đổi đi để không tự chèn được dấu kết thúc giả. Xuống dòng gộp
 * thành khoảng trắng — mỗi mục đúng MỘT dòng.
 */
export const bocDuLieu = (id, chu) =>
	`<<<DU_LIEU id=${id}>>>${String(chu ?? "").replace(/<{3,}/g, "‹‹‹").replace(/>{3,}/g, "›››").replace(/\s*\n\s*/g, " ")}<<<HET_DU_LIEU id=${id}>>>`;

/** Một trường trong dòng "id|chủ đề|từ khoá|tên miền": "|" trong chữ đối thủ làm lệch cột. */
const truong = (s) => String(s ?? "").replace(/\|/g, "/").trim();

const blogMinh = (chiMuc) => (chiMuc?.muc ?? []).filter((m) => m.loai === "bai_viet").map((m) => ({ tieuDe: m.ten, tuKhoa: [] }));

/** Bài của mình: blog đã đăng (chỉ mục CMS) + chủ đề Claude đã đọc từ site của mình. */
export async function layBaiMinh(s, chiMuc, doiThu) {
	const ra = blogMinh(chiMuc);
	for (const d of doiThu.filter((x) => x.laCuaMinh))
		for (const r of await kho.tatCa(s.url, { where: { doiThuId: d.id, trangThai: "da_phan_tich" } }))
			ra.push({ tieuDe: r.data.chuDe ?? "", tuKhoa: r.data.tuKhoa ?? [] });
	return ra;
}

/**
 * Nguồn đo cho MỘT lời gọi: 1.500 chủ đề đối thủ mới nhất (cùng tập đã đưa cho Claude ở
 * layDuLieu) + bài của mình, nạp MỘT lần rồi tính sẵn bộ khoá để so nhiều hướng/cụm.
 */
async function napNguon(s, chiMuc) {
	const doiThu = await kho.dsDoiThu(s);
	const { minh, doiThu: dt } = await kho.chuDeDaPhanTich(s, doiThu, { toiDa: kho.TRAN_CHU_DE_DOI_THU });
	const baiMinh = [...blogMinh(chiMuc), ...minh.map((t) => ({ tieuDe: t.chuDe ?? "", tuKhoa: t.tuKhoa ?? [] }))];
	return {
		boDoiThu: taoBoChuDe(dt),
		theoId: new Map(dt.map((t) => [String(t.id), t])),
		boMinh: taoBoChuDe(baiMinh.map((b, i) => ({ id: `minh:${i}`, ...b }))),
		xuHuong: await xuHuongGanNhat(s),
	};
}

/**
 * Đo một hướng/cụm trên nguồn đã nạp. Id mô hình dẫn chỉ được giữ làm BẰNG CHỨNG khi nằm trong
 * tập máy chủ tự dò ra; bằng chứng hiển thị lấy id đã dẫn trước rồi bù bằng chủ đề khớp khác.
 */
function doChiSo(nguon, { ten, tuKhoa, idBaiDoiThu, chiMuc, gioiHan }) {
	const { idKhop: tatCaKhop, ...chiSo } = tinhChiSo({ ten, tuKhoa, idBaiDoiThu, chuDeDoiThu: nguon.boDoiThu, baiMinh: nguon.boMinh, xuHuong: nguon.xuHuong, chiMuc });
	let idKhop = tatCaKhop;
	if (gioiHan) {
		// Cụm: chỉ đếm chủ đề cũng thuộc hướng — cụm không mượn được nhu cầu từ ngoài hướng.
		idKhop = tatCaKhop.filter((id) => gioiHan.has(id));
		const bai = idKhop.map((id) => nguon.theoId.get(id));
		chiSo.soBai = bai.length;
		chiSo.soDoiThu = new Set(bai.map((b) => b.doiThuId)).size;
		chiSo.soBangChungBoQua = [...new Set(idBaiDoiThu)].filter((id) => !idKhop.includes(id)).length;
	}
	const khop = new Set(idKhop);
	const idBangChung = [...new Set(idBaiDoiThu)].filter((id) => khop.has(id));
	const baiDoiThu = [...new Set([...idBangChung, ...idKhop])]
		.slice(0, SO_BAI_BANG_CHUNG)
		.map((id) => nguon.theoId.get(id))
		.map((b) => ({ url: b.url, chuDe: b.chuDe }));
	return { chiSo, idKhop, idBangChung, baiDoiThu };
}

const tuKhoaDai = (tuKhoa) => new Set((tuKhoa ?? []).filter(laTuKhoaDai).map(chuanHoaManh));
const coChung = (a, b) => [...a].some((x) => b.has(x));
function jaccard(a, b) {
	if (!a.size || !b.size) return 0;
	let chung = 0;
	for (const x of a) if (b.has(x)) chung++;
	return chung / (a.size + b.size - chung);
}

const sachMang = (a, n) => (Array.isArray(a) ? a.map((v) => String(v).trim()).filter(Boolean).slice(0, n) : []);

/**
 * Dữ liệu cho routine chiến lược. Chủ đề đối thủ: 1.500 dòng mới nhất (trần của
 * chuDeDaPhanTich), chia trang `coTrang` dòng. Hướng/cụm/kế hoạch hiện có chỉ gửi ở trang 0.
 */
export async function layDuLieu({ s, content, chiMuc, trang = 0, coTrang = 500 }) {
	const cm = chiMuc ?? (await layChiMuc(content));
	const doiThu = await kho.dsDoiThu(s);
	const { doiThu: dt } = await kho.chuDeDaPhanTich(s, doiThu, { toiDa: kho.TRAN_CHU_DE_DOI_THU });
	const tu = trang * coTrang;
	const chuDeDoiThu = dt
		.slice(tu, tu + coTrang)
		.map((t) => bocDuLieu(t.id, [t.id, truong(t.chuDe), (t.tuKhoa ?? []).slice(0, 3).map(truong).join("; "), t.doiThuId].join("|")));
	const ra = {
		chuDeDoiThu,
		tongChuDe: dt.length,
		conTrang: tu + coTrang < dt.length,
		baiMinh: await layBaiMinh(s, cm, doiThu),
		loiNhac: { deXuatHuong: LOI_NHAC_DE_XUAT_HUONG, phanCum: LOI_NHAC_PHAN_CUM, lapKeHoach: LOI_NHAC_LAP_KE_HOACH },
	};
	if (trang === 0) {
		// Mục đã bỏ đi kèm lyDoBo (người quản trị viết) để Claude khỏi đề xuất lại.
		ra.huong = (await kho.dsHuong(s)).map((h) => ({
			id: h.id, ten: bocDuLieu(h.id, h.ten), trangThai: h.trangThai,
			...(h.trongSo ? { trongSo: h.trongSo } : {}), ...(h.lyDoBo ? { lyDoBo: h.lyDoBo } : {}),
		}));
		ra.cum = (await kho.dsCumNghia(s)).map((c) => ({ id: c.id, huongId: c.huongId, ten: bocDuLieu(c.id, c.ten), trangThai: c.trangThai }));
		ra.keHoach = (await kho.dsKeHoach(s)).map((k) => ({
			id: k.id, cumId: k.cumId, tieuDeLamViec: bocDuLieu(k.id, k.tieuDeLamViec), trangThai: k.trangThai,
			...(k.lyDoBo ? { lyDoBo: k.lyDoBo } : {}),
		}));
	}
	return ra;
}

/** Tách phần trong trần và phần vượt trần (bác kèm lý do, không lặng lẽ bỏ). */
function catTran(ds, tran, ten, nhan) {
	const bac = ds.slice(tran).map((x) => ({ [ten]: x[ten], lyDo: `quá trần: tối đa ${tran} ${nhan}/lượt` }));
	return { trong: ds.slice(0, tran), bac };
}

const viPhamChu = (...chu) => timViPham(chu.join(". "));

/** Hướng đã bỏ mà đề xuất này quay lại: trùng từ khoá đủ nghĩa, giống tên (timTrung), hoặc cùng tập chủ đề đối thủ. */
function timHuongBo(de, daBo) {
	for (const b of daBo) {
		if (coChung(de.tk, b.tk)) return { b, vi: "cùng từ khoá" };
		if (timTrung({ tieuDe: de.ten, tuKhoa: de.tuKhoa }, [{ id: b.id, tieuDe: b.ten, tuKhoa: b.tuKhoa }])) return { b, vi: "tên giống" };
		if (jaccard(de.idKhop, b.idKhop) >= NGUONG_JACCARD_BO) return { b, vi: "cùng nhóm bài đối thủ" };
	}
	return null;
}

/**
 * @param {{s: object, ds: {ten: string, moTa: string, trongSoGoiY: number, lyDo: string,
 *   idBaiDoiThu: string[], tuKhoa: string[]}[], chiMuc: object, now: string}} o
 * @returns {Promise<{nhan: {id: string, ten: string, diem: number}[], bac: {ten: string, lyDo: string}[],
 *   gop: {ten: string, vaoId: string, vaoTen: string}[]}>}
 *   `gop`: đề xuất gần một hướng ĐANG CÓ (chưa bỏ) → gộp vào hướng đó (cập nhật số đo, giữ phần
 *   người dùng đặt) thay vì đẻ hướng trùng. `vaoTen` bọc dấu mốc (tên do Claude sinh tuần trước).
 */
export async function deXuatHuong({ s, ds = [], chiMuc, now }) {
	const { trong, bac } = catTran(ds, TRAN_HUONG_MOI_LUOT, "ten", "hướng");
	const nguon = await napNguon(s, chiMuc);
	const idsCua = (h) => new Set(timKhop({ ten: h.ten, tuKhoa: h.tuKhoa ?? [] }, nguon.boDoiThu).map((i) => String(nguon.boDoiThu.goc[i].id)));
	const coSan = await kho.dsHuong(s);
	const daBo = coSan.filter((h) => h.trangThai === "bo_qua").map((h) => ({ ...h, tuKhoa: h.tuKhoa ?? [], tk: tuKhoaDai(h.tuKhoa), idKhop: idsCua(h) }));
	const dangCo = coSan.filter((h) => h.trangThai !== "bo_qua").map((h) => ({ h, id: h.id, ten: h.ten, tuKhoa: h.tuKhoa ?? [], tk: tuKhoaDai(h.tuKhoa) }));
	const ghi = new Map();
	const idMoi = new Set();
	const gop = [];
	for (const h of trong) {
		const ten = String(h.ten ?? "").trim();
		const tuKhoa = sachMang(h.tuKhoa, 8);
		const vp = viPhamChu(ten, tuKhoa.join(", "));
		if (vp.length) {
			bac.unshift({ ten, lyDo: `vượt phạm vi Y sỹ: "${vp[0].tu}" — ${vp[0].goiY}` });
			continue;
		}
		const daDan = sachMang(h.idBaiDoiThu, 50);
		const { chiSo, idKhop, idBangChung, baiDoiThu } = doChiSo(nguon, { ten, tuKhoa, idBaiDoiThu: daDan, chiMuc });
		const tk = tuKhoaDai(tuKhoa);
		const bo = timHuongBo({ ten, tuKhoa, tk, idKhop: new Set(idKhop) }, daBo);
		if (bo) {
			bac.unshift({ ten, lyDo: `đã bị bỏ: ${bo.b.lyDoBo ?? ""} (${bo.vi} với hướng ${bocDuLieu(bo.b.id, bo.b.ten)})` });
			continue;
		}
		// Gần một hướng đang có → gộp (xét TRƯỚC luật bằng chứng: đây là bản trùng, không phải hướng mới).
		const id = kho.idHuong(ten);
		const tenMau = [{ id: "_", tieuDe: ten, tuKhoa }];
		const gan = dangCo.find((x) => x.id !== id && (coChung(tk, x.tk) || timTrung({ tieuDe: x.ten, tuKhoa: x.tuKhoa }, tenMau)));
		if (gan) {
			gop.push({ ten, vaoId: gan.id, vaoTen: bocDuLieu(gan.id, gan.ten) });
			// Hướng mới của CHÍNH lượt này đã đo rồi; hướng cũ thì đo lại theo tên/từ khoá của nó.
			if (gan.h && !ghi.has(gan.id)) {
				const { id: _id, ...cu } = gan.h;
				const d = doChiSo(nguon, { ten: cu.ten, tuKhoa: cu.tuKhoa ?? [], idBaiDoiThu: [...(cu.idBaiDoiThu ?? []), ...daDan], chiMuc });
				ghi.set(gan.id, { ...cu, idBaiDoiThu: d.idBangChung, baiDoiThu: d.baiDoiThu, chiSo: d.chiSo, diem: diemHuong(d.chiSo) });
			}
			continue;
		}
		if (chiSo.soBai < SO_BAI_DOI_THU_TOI_THIEU) {
			bac.unshift({ ten, lyDo: `không đủ bài đối thủ khớp hướng: máy chủ dò được ${chiSo.soBai} bài trong ${nguon.boDoiThu.goc.length} chủ đề mới nhất (cần ≥ ${SO_BAI_DOI_THU_TOI_THIEU}) — id dẫn không khớp tên/từ khoá không được tính` });
			continue;
		}
		ghi.set(id, {
			ten,
			moTa: String(h.moTa ?? "").trim(),
			lyDo: String(h.lyDo ?? "").trim(),
			trongSoGoiY: Math.min(5, Math.max(1, Math.round(Number(h.trongSoGoiY) || 3))),
			tuKhoa,
			idBaiDoiThu: idBangChung,
			baiDoiThu,
			chiSo,
			diem: diemHuong(chiSo),
		});
		idMoi.add(id);
		if (!dangCo.some((x) => x.id === id)) dangCo.push({ id, ten, tuKhoa, tk });
	}
	const luu = ghi.size ? await kho.luuHuongMoi(s, [...ghi.values()], now) : [];
	return { nhan: luu.filter((x) => idMoi.has(x.id)), bac: xepBac(bac, ds, "ten"), gop };
}

/** Giữ thứ tự bác theo thứ tự đề xuất gửi lên — dễ đọc cho Claude khi đối chiếu. */
function xepBac(bac, ds, ten) {
	const viTri = new Map(ds.map((x, i) => [String(x[ten] ?? "").trim(), i]));
	return [...bac].sort((a, b) => (viTri.get(a[ten]) ?? 0) - (viTri.get(b[ten]) ?? 0));
}

/**
 * Cụm theo nghĩa trong các hướng ĐÃ NHẬN. Mỗi hướng: lứa cụm gửi lên THAY lứa cũ (kho.thayCumNghia).
 * Số đo của cụm do máy chủ tự dò, và chỉ trong các chủ đề thuộc hướng của nó.
 * @returns {Promise<{nhan: {id: string, ten: string, huongId: string, diem: number}[], bac: {ten: string, lyDo: string}[]}>}
 */
export async function ghiCum({ s, ds = [], chiMuc, now }) {
	const { trong, bac } = catTran(ds, TRAN_CUM_MOI_LUOT, "ten", "cụm");
	const nguon = await napNguon(s, chiMuc);
	const huongIds = [...new Set(trong.map((c) => String(c.huongId)))];
	const huong = await s.huong.getMany(huongIds);
	const trongHuong = new Map();
	const theoHuong = new Map();
	for (const c of trong) {
		const ten = String(c.ten ?? "").trim();
		const huongId = String(c.huongId);
		const h = huong.get(huongId);
		if (!h || h.trangThai !== "da_nhan") {
			bac.unshift({ ten, lyDo: "hướng chưa được nhận (hoặc không có) — chỉ phân cụm trong hướng đã nhận" });
			continue;
		}
		const tuKhoa = sachMang(c.tuKhoa, 8);
		const vp = viPhamChu(ten, tuKhoa.join(", "));
		if (vp.length) {
			bac.unshift({ ten, lyDo: `vượt phạm vi Y sỹ: "${vp[0].tu}" — ${vp[0].goiY}` });
			continue;
		}
		if (!trongHuong.has(huongId))
			trongHuong.set(huongId, new Set(timKhop({ ten: h.ten ?? "", tuKhoa: h.tuKhoa ?? [] }, nguon.boDoiThu).map((i) => String(nguon.boDoiThu.goc[i].id))));
		const { chiSo, idBangChung, baiDoiThu } = doChiSo(nguon, { ten, tuKhoa, idBaiDoiThu: sachMang(c.idBaiDoiThu, 50), chiMuc, gioiHan: trongHuong.get(huongId) });
		if (!theoHuong.has(huongId)) theoHuong.set(huongId, []);
		theoHuong.get(huongId).push({ ten, moTa: String(c.moTa ?? "").trim(), tuKhoa, idBaiDoiThu: idBangChung, baiDoiThu, chiSo, diem: diemCum(chiSo, h.trongSo) });
	}
	const nhan = [];
	for (const [huongId, cum] of theoHuong)
		for (const x of await kho.thayCumNghia(s, huongId, cum, now)) nhan.push({ ...x, huongId });
	return { nhan, bac: xepBac(bac, ds, "ten") };
}

const HET_LUOT = Symbol("het_luot");

/**
 * Chạy hàng đợi kiểm trang với ngân sách: `dongThoi` việc cùng lúc, ≤ `toiDaKiem` lượt tải MỚI
 * (`daDem(duong)` = trang đã có trong đệm, không tốn lượt), ≤ `hanMs` tính từ lúc bắt đầu.
 * Việc chưa kịp chạy khi hết ngân sách trả HET_LUOT — không bao giờ coi là "link chết".
 */
async function kiemTheoNganSach(dsDuong, kiem, { daDem, dongThoi, toiDaKiem, hanMs, dongHo }) {
	const batDau = dongHo();
	const datCho = new Set();
	let soMoi = 0;
	let i = 0;
	const kq = new Array(dsDuong.length);
	const chay = async (d) => {
		if (typeof d !== "string" || !d.startsWith("/")) return false;
		if (dongHo() - batDau >= hanMs) return HET_LUOT;
		if (!datCho.has(d) && !daDem(d)) {
			if (soMoi >= toiDaKiem) return HET_LUOT;
			soMoi++;
			datCho.add(d);
		}
		return kiem(d);
	};
	await Promise.all(
		Array.from({ length: Math.min(dongThoi, dsDuong.length) }, async () => {
			while (i < dsDuong.length) {
				const j = i++;
				kq[j] = await chay(dsDuong[j]);
			}
		}),
	);
	return { kq, soMoi };
}

/**
 * Bài dự kiến trong cụm thuộc hướng ĐÃ NHẬN. Rào theo thứ tự rẻ → đắt: cụm/hướng, ý định,
 * phạm vi Y sỹ, trùng tên từ điển, trùng bài có sẵn / kế hoạch (kể cả đã bỏ), rồi mới tải
 * trang thật — MỘT hàng đợi chung cho mọi bài, có ngân sách (NGAN_SACH_KIEM). Hết ngân sách thì
 * các bài chưa kiểm xong bị bác "hết lượt kiểm" và `daCatBot: true`.
 * @param {{s: object, ds: object[], chiMuc: object, kiemDuong: (duong: string, ten?: string) => Promise<boolean>,
 *   daDem?: (duong: string) => boolean, nganSach?: Partial<typeof NGAN_SACH_KIEM>, dongHo?: () => number,
 *   baiDaCo: {tieuDe: string, tuKhoa: string[]}[], now: string}} o
 * @returns {Promise<{nhan: {id: string, tieuDeLamViec: string}[], bac: {tieuDeLamViec: string, lyDo: string}[], daCatBot: boolean}>}
 */
export async function deXuatKeHoach({ s, ds = [], chiMuc, kiemDuong, daDem = () => false, nganSach = {}, dongHo = Date.now, baiDaCo = [], now }) {
	const ns = { ...NGAN_SACH_KIEM, ...nganSach };
	const { trong, bac } = catTran(ds, TRAN_KE_HOACH_MOI_LUOT, "tieuDeLamViec", "bài");
	const cum = await s.cum_nghia.getMany([...new Set(trong.map((k) => String(k.cumId)))]);
	const huong = await s.huong.getMany([...new Set([...cum.values()].map((c) => c.huongId))]);
	// Tên từ điển (không gồm blog — trùng blog do phép so bài có sẵn lo). Tên mục theo đường,
	// để kiểm trang KÈM tên có dấu: "Âm Khích" và "Ẩm Khích" chung slug_goc.
	// khoá chuẩn hoá → tên gốc: lời bác phải in "Thần Môn", không in khoá "than mon".
	const tenTuDien = new Map();
	const tenTheoDuong = new Map();
	for (const m of chiMuc?.muc ?? []) {
		if (m.loai !== "bai_viet" && !tenTuDien.has(m.khoaTen)) tenTuDien.set(m.khoaTen, m.ten);
		for (const d of m.duong ?? []) if (!tenTheoDuong.has(d)) tenTheoDuong.set(d, m.ten);
	}
	const keHoachCo = await kho.dsKeHoach(s);
	const soSanh = [
		...baiDaCo.map((b, i) => ({ id: `bai:${i}`, tieuDe: b.tieuDe ?? "", tuKhoa: b.tuKhoa ?? [] })),
		...keHoachCo.map((k) => ({ id: k.id, tieuDe: k.tieuDeLamViec, tuKhoa: [k.tuKhoaChinh, ...(k.tuKhoaPhu ?? [])].filter(Boolean), trangThai: k.trangThai, lyDoBo: k.lyDoBo })),
	];
	// Kế hoạch đã bỏ: cùng từ khoá chính (chuẩn hoá) là cùng bài, dù tiêu đề viết khác hẳn.
	const tkChinhBo = new Map(keHoachCo.filter((k) => k.trangThai === "bo_qua" && k.tuKhoaChinh).map((k) => [chuanHoaManh(k.tuKhoaChinh), k]));
	const kiem = async (d) => {
		try {
			return await kiemDuong(d, tenTheoDuong.get(d));
		} catch {
			return false;
		}
	};

	// Vòng 1 — rào rẻ, tuần tự.
	const cho = [];
	for (const k of trong) {
		const tieuDeLamViec = String(k.tieuDeLamViec ?? "").trim();
		const tuKhoaChinh = String(k.tuKhoaChinh ?? "").trim();
		const tuKhoaPhu = sachMang(k.tuKhoaPhu, 8);
		const bo = (lyDo) => bac.unshift({ tieuDeLamViec, lyDo });
		const c = cum.get(String(k.cumId));
		if (!c || huong.get(c.huongId)?.trangThai !== "da_nhan") {
			bo(c ? "cụm thuộc hướng chưa được nhận" : "Không có cụm này — hoặc hướng của nó chưa được nhận");
			continue;
		}
		if (c.trangThai === "cu") {
			bo("cụm đã cũ (bị thay ở lứa phân cụm mới) — chỉ lập bài trong cụm đang đề xuất");
			continue;
		}
		if (!Y_DINH.includes(k.yDinh)) {
			bo(`ý định phải là một trong: ${Y_DINH.join(", ")}`);
			continue;
		}
		// Từ khoá phụ cũng soát: chúng đi vào tiêu đề SEO và đoạn đầu của bài.
		const pv = kiemPhamVi({ tieuDe: tieuDeLamViec, moTa: [tuKhoaChinh, ...tuKhoaPhu].join(". ") });
		if (pv.chan) {
			bo(`vượt phạm vi Y sỹ: "${pv.viPhamDau[0].tu}" — ${pv.viPhamDau[0].goiY}`);
			continue;
		}
		const tuDien = trungTuDien(tuKhoaChinh, tenTuDien);
		if (tuDien) {
			bo(`từ khoá chính trùng tên mục từ điển "${tenTuDien.get(tuDien) ?? tuDien}" — trang từ điển đã phủ; nhắm ý định rộng hơn và link về trang đó`);
			continue;
		}
		const daBo = tkChinhBo.get(chuanHoaManh(tuKhoaChinh));
		if (daBo) {
			bo(`đã bị bỏ: ${daBo.lyDoBo ?? ""} (cùng từ khoá chính với ${bocDuLieu(daBo.id, daBo.tieuDeLamViec)})`);
			continue;
		}
		const mau = { tieuDe: tieuDeLamViec, tuKhoa: [tuKhoaChinh, ...tuKhoaPhu] };
		const trung = timTrung(mau, soSanh);
		if (trung) {
			const x = soSanh.find((y) => y.id === trung.id);
			bo(x?.trangThai === "bo_qua" ? `đã bị bỏ: ${x.lyDoBo ?? ""} (giống ${bocDuLieu(x.id, x.tieuDe)})` : `trùng bài đã có hoặc bài dự kiến đang có: ${bocDuLieu(x?.id, x?.tieuDe ?? "")}`);
			continue;
		}
		// Giống vừa phải (0,20–0,30): nhận, nhưng người duyệt phải thấy bài gần nó.
		const tapMau = tapKhoa(mau);
		const canhBaoTrung = soSanh
			.map((y) => ({ y, v: doGiong(tapMau, tapKhoa(y)) }))
			.filter(({ v }) => v >= NGUONG_CANH_BAO_TRUNG && v < NGUONG_TRUNG)
			.sort((a, b) => b.v - a.v)
			.slice(0, 3)
			.map(({ y, v }) => ({ tieuDe: y.tieuDe, doGiong: soGiongHienThi(v) }));
		const truCot = String(k.trangTruCot ?? "").trim();
		if (!truCot.startsWith("/")) {
			bo(`trang trụ cột ${truCot || "(trống)"} không sống hoặc không đúng trang trên kinhlac.online`);
			continue;
		}
		// Trụ cột KHÔNG tính vào số link đích: bài phải link lên trụ cột VÀ ≥ 5 trang khác.
		const dich = [...new Set(sachMang(k.lienKetDich, 12))].filter((d) => d !== truCot);
		cho.push({ k, c, tieuDeLamViec, tuKhoaChinh, tuKhoaPhu, mau, truCot, dich, canhBaoTrung, bo });
	}

	// Vòng 2 — kiểm trang thật: một hàng đợi chung, theo thứ tự bài gửi lên.
	const viec = cho.flatMap((x, n) => [x.truCot, ...x.dich].map((duong) => ({ n, duong })));
	const { kq } = await kiemTheoNganSach(viec.map((v) => v.duong), kiem, { daDem, dongThoi: ns.dongThoi, toiDaKiem: ns.toiDaKiem, hanMs: ns.hanMs, dongHo });
	const theoBai = cho.map(() => new Map());
	viec.forEach((v, i) => theoBai[v.n].set(v.duong, kq[i]));

	// Vòng 3 — xét từng bài.
	let daCatBot = false;
	const ghi = [];
	const daNhan = [];
	cho.forEach((x, n) => {
		const kqBai = theoBai[n];
		if ([...kqBai.values()].includes(HET_LUOT)) {
			daCatBot = true;
			x.bo(`hết lượt kiểm — gọi lại với ít bài hơn (mỗi lượt tối đa ${ns.toiDaKiem} trang chưa có trong đệm, ${Math.round(ns.hanMs / 1000)} s)`);
			return;
		}
		if (!kqBai.get(x.truCot)) {
			x.bo(`trang trụ cột ${x.truCot} không sống hoặc không đúng trang trên kinhlac.online`);
			return;
		}
		const lienKetDich = x.dich.filter((d) => kqBai.get(d) === true);
		if (lienKetDich.length < SO_LINK_DICH_TOI_THIEU) {
			x.bo(`chỉ còn ${lienKetDich.length} link đích sống (cần ≥ ${SO_LINK_DICH_TOI_THIEU}, không tính trụ cột) — lấy thêm từ rada_tim_lien_ket`);
			return;
		}
		// Hai bài trùng nhau trong CÙNG lượt: chỉ nhận bài đầu ĐƯỢC NHẬN (bài trượt kiểm trang không chặn bài sau).
		const trungLuot = timTrung(x.mau, daNhan);
		if (trungLuot) {
			x.bo(`trùng bài dự kiến vừa nhận trong cùng lượt: ${bocDuLieu(trungLuot.id, daNhan.find((y) => y.id === trungLuot.id)?.tieuDe ?? "")}`);
			return;
		}
		daNhan.push({ id: `moi:${n}`, ...x.mau });
		ghi.push({
			cumId: String(x.k.cumId),
			huongId: x.c.huongId,
			tieuDeLamViec: x.tieuDeLamViec,
			tuKhoaChinh: x.tuKhoaChinh,
			tuKhoaPhu: x.tuKhoaPhu,
			yDinh: x.k.yDinh,
			trangTruCot: x.truCot,
			lienKetDich,
			linkBiGo: x.dich.filter((d) => kqBai.get(d) !== true),
			goiYNguon: sachMang(x.k.goiYNguon, 12),
			bangChung: {
				soDoiThu: x.c.chiSo?.soDoiThu ?? 0,
				soBai: x.c.chiSo?.soBai ?? 0,
				trungXuHuong: !!x.c.chiSo?.trungXuHuong,
				baiDoiThu: (x.c.baiDoiThu ?? []).slice(0, SO_BAI_BANG_CHUNG),
				canhBaoTrung: x.canhBaoTrung,
			},
		});
	});
	const nhan = ghi.length ? await kho.themKeHoach(s, ghi, now) : [];
	return { nhan, bac: xepBac(bac, ds, "tieuDeLamViec"), daCatBot };
}
