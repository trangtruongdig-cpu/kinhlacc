// Việc của lò viết bài (2C-3), thuần: mọi phụ thuộc (storage, kv, content, media, bộ chuyển
// Markdown → Portable Text, tải trang, kiểm đường) đều TIÊM vào để thử được bằng đồ giả.
//
// Vòng đời một bài dự kiến: da_duyet → dang_viet (layBaiCanViet giữ chỗ, ghi giuLuc) →
// co_nhap (nopBai đã tạo nháp bai_viet, ghi contentId) → da_dang (người duyệt Publish).
// dang_viet quá GIO_GIU_CHO giờ không nộp được → trả về da_duyet (dọn ở layBaiCanViet).
//
// Claude viết, máy chủ chặn. Rào ở nopBai CHẶN (không tạo gì, trả lỗi tiếng Việt đủ để viết lại)
// những thứ người duyệt không được phép phải tự bắt: khuôn bài, phạm vi Y sỹ (pháp lý), trùng
// bài, nguồn bịa, link hỏng. Còn lại (SEO, YMYL, độ dài) chỉ là cờ trong phiếu.
import { z } from "zod";
import * as kho from "../kho.mjs";
import { bocDuLieu } from "../chien-luoc/viec.mjs";
import { LOI_NHAC_VIET } from "../loi-dan.mjs";
import { kiemKhuon } from "../luat/khuon-bai.mjs";
import { chuanHoaMd } from "../luat/md-sang-pt.mjs";
import { slugKhongDau } from "../luat/slug.mjs";
import { timViPham } from "../luat/pham-vi-y-sy.mjs";
import { doYmyl } from "../luat/ymyl.mjs";
import { chamSeo } from "../luat/seo.mjs";
import { taoBoKhoa, timTrungBo, trungTuDien } from "../luat/trung-lap.mjs";
import { layChiMuc } from "../noi-bo/nap.mjs";
import { layChiMucAnh, maTheoTenTuChiMuc, chonAnhBia } from "./anh.mjs";
import { xacMinhNguon } from "./nguon.mjs";
import { kiemLienKetThan } from "./lien-ket-than.mjs";

export const KHOA_CAI_DAT_BAI_MOI_DEM = "cai_dat:bai_moi_dem";
export const BAI_MOI_DEM_MAC_DINH = 2;
export const BAI_MOI_DEM_TOI_DA = 5;
/** Tồn nháp chờ duyệt tới chừng này thì thôi giao bài mới: người duyệt không đọc kịp. */
export const TRAN_NHAP_CHO_DUYET = 25;
export const GIO_GIU_CHO = 36;
export const SO_LAN_NOP_TOI_DA = 3;
export const SO_NGUON_TOI_THIEU = 2;
export const TAC_GIA = "Ban Biên Tập Kinh Lạc";
export const CTA = "/xem-ket-qua-do";
const BO = "bai_viet";
const GIO_MS = 3600 * 1000;

export const khoaGiao = (ngay) => `viet:giao:${ngay}`;

/** Trần bài mỗi đêm từ kv (số nguyên 0..5); thiếu hoặc rác → mặc định. */
export async function traBaiMoiDem(kv) {
	const tho = await kv.get(KHOA_CAI_DAT_BAI_MOI_DEM);
	const v = typeof tho === "number" || (typeof tho === "string" && tho.trim()) ? Number(tho) : NaN;
	if (!Number.isFinite(v)) return BAI_MOI_DEM_MAC_DINH;
	return Math.max(0, Math.min(BAI_MOI_DEM_TOI_DA, Math.trunc(v)));
}

// ---- Bộ đếm hạn ngạch (CAS, cùng lối mcp-viec.mjs) ----

async function cong(kv, khoa, them) {
	for (let i = 0; i < 5; i++) {
		const cu = await kv.getVersioned(khoa);
		const moi = Math.max(0, (cu?.value ?? 0) + them);
		const r = await kv.compareAndSet(khoa, cu?.revision ?? null, moi);
		if (r.applied) return moi;
	}
	throw new Error("Không cập nhật được bộ đếm bài viết (tranh chấp)");
}

/** Giữ tối đa `muon` chỗ dưới trần `tran`. @returns {Promise<number>} số chỗ đã giữ */
async function giuCho(kv, khoa, muon, tran) {
	for (let i = 0; i < 5; i++) {
		const cu = await kv.getVersioned(khoa);
		const daGiao = cu?.value ?? 0;
		const them = Math.max(0, Math.min(muon, tran - daGiao));
		if (them === 0) return 0;
		const r = await kv.compareAndSet(khoa, cu?.revision ?? null, daGiao + them);
		if (r.applied) return them;
	}
	throw new Error("Không giữ được chỗ trong hạn ngạch bài mỗi đêm (tranh chấp)");
}

// ---- layBaiCanViet ----

/** dang_viet giữ quá GIO_GIU_CHO giờ → da_duyet, đặt lại lượt nộp. @returns {Promise<number>} */
export async function thuHoiGiuCho(s, nowMs) {
	const han = nowMs - GIO_GIU_CHO * GIO_MS;
	const qua = (await kho.dsKeHoach(s, { trangThai: "dang_viet" })).filter((k) => !(Date.parse(k.giuLuc) >= han));
	for (const { id, ...k } of qua) {
		const moi = { ...k, trangThai: "da_duyet", soLanNop: 0 };
		delete moi.giuLuc;
		await s.ke_hoach.put(id, moi);
	}
	return qua.length;
}

/** Tên trang theo đường, từ chỉ mục nội bộ (mục nào có `duong` chứa đúng đường đó). */
function bangTenTheoDuong(chiMuc) {
	const m = new Map();
	for (const x of chiMuc?.muc ?? []) for (const d of x.duong ?? []) if (!m.has(d)) m.set(d, x.ten);
	return m;
}
const kemTen = (bang, duong) => ({ duong, ten: bang.get(duong) ?? "" });

/** Kế hoạch da_duyet xếp theo điểm cụm × trọng số hướng (giảm dần), rồi cũ trước. Bỏ hướng không còn nhận. */
async function xepKeHoach(s) {
	const ds = await kho.dsKeHoach(s, { trangThai: "da_duyet" });
	const cum = await s.cum_nghia.getMany([...new Set(ds.map((k) => k.cumId).filter(Boolean))]);
	const huongIds = new Set(ds.map((k) => k.huongId ?? cum.get(k.cumId)?.huongId).filter(Boolean));
	const huong = await s.huong.getMany([...huongIds]);
	return ds
		.map((k) => {
			const h = huong.get(k.huongId ?? cum.get(k.cumId)?.huongId);
			return { k, h, diem: (Number(cum.get(k.cumId)?.diem) || 0) * (Number(h?.trongSo) || 1) };
		})
		.filter(({ h }) => !h || h.trangThai === "da_nhan")
		.sort((a, b) => b.diem - a.diem || String(a.k.taoLuc).localeCompare(String(b.k.taoLuc)))
		.map(({ k }) => k);
}

function baiChoClaude(k, tenTheoDuong) {
	const id = k.id;
	return {
		keHoachId: id,
		tieuDeLamViec: bocDuLieu(id, k.tieuDeLamViec),
		tuKhoaChinh: bocDuLieu(`${id}:chinh`, k.tuKhoaChinh),
		tuKhoaPhu: (k.tuKhoaPhu ?? []).map((t, i) => bocDuLieu(`${id}:phu${i}`, t)),
		yDinh: bocDuLieu(`${id}:ydinh`, k.yDinh),
		goiYNguon: (k.goiYNguon ?? []).map((t, i) => bocDuLieu(`${id}:nguon${i}`, t)),
		trangTruCot: kemTen(tenTheoDuong, k.trangTruCot),
		lienKetDich: (k.lienKetDich ?? []).map((d) => kemTen(tenTheoDuong, d)),
		khuonBai: LOI_NHAC_VIET,
		soLanNopConLai: Math.max(0, SO_LAN_NOP_TOI_DA - (k.soLanNop ?? 0)),
	};
}

/**
 * Giao bài cho routine viết đêm nay. Hạn ngạch đêm (giờ VN) giữ bằng CAS TRƯỚC khi chọn, phần
 * không dùng (hết kế hoạch, hoặc lỗi giữa chừng) được hoàn.
 * @param {{storage: object, kv: object, content?: object}} ctx
 * @param {{now?: number, chiMuc?: object}} [tuyChon]
 * @returns {Promise<{bai: object[], conLaiDemNay: number, soNhapChoDuyet: number, ghiChu?: string}>}
 */
export async function layBaiCanViet(ctx, { now = Date.now(), chiMuc } = {}) {
	const s = ctx.storage, kv = ctx.kv;
	const khoa = khoaGiao(kho.ngayVN(now));
	const tran = await traBaiMoiDem(kv);
	await thuHoiGiuCho(s, now);
	const conLai = async () => Math.max(0, tran - ((await kv.get(khoa)) ?? 0));

	const soNhapChoDuyet = await kho.demNhap(s, "cho_duyet");
	if (soNhapChoDuyet >= TRAN_NHAP_CHO_DUYET)
		return { bai: [], conLaiDemNay: await conLai(), soNhapChoDuyet, ghiChu: `đủ ${TRAN_NHAP_CHO_DUYET} nháp chờ duyệt — chờ người duyệt đọc bớt rồi mới viết tiếp` };

	const giu = await giuCho(kv, khoa, Math.min(tran, TRAN_NHAP_CHO_DUYET - soNhapChoDuyet), tran);
	const chon = [];
	try {
		if (giu > 0) {
			const giuLuc = new Date(now).toISOString();
			for (const k of (await xepKeHoach(s)).slice(0, giu)) {
				const { id, ...data } = k;
				const moi = { ...data, trangThai: "dang_viet", giuLuc };
				await s.ke_hoach.put(id, moi);
				chon.push({ id, ...moi });
			}
		}
	} finally {
		if (giu > chon.length) await cong(kv, khoa, chon.length - giu);
	}
	const ra = { bai: [], conLaiDemNay: await conLai(), soNhapChoDuyet };
	if (!chon.length) {
		if (giu === 0 && tran > 0) ra.ghiChu = "hết hạn ngạch bài đêm nay";
		else if (tran === 0) ra.ghiChu = "trần bài mỗi đêm đang đặt 0";
		else ra.ghiChu = "không còn bài dự kiến đã duyệt nào";
		return ra;
	}
	const bang = bangTenTheoDuong(chiMuc ?? (await layChiMuc(ctx.content)));
	ra.bai = chon.map((k) => baiChoClaude(k, bang));
	return ra;
}

// ---- nopBai ----

export const KHUON_NOP = z
	.object({
		keHoachId: z.string().min(1).max(64),
		tieuDe: z.string().trim().min(30).max(70),
		moTa: z.string().trim().min(100).max(170),
		md: z.string().min(1).max(40_000),
		tuKhoa: z.array(z.string().trim().min(1).max(120)).min(1).max(8),
		faq: z.array(z.object({ q: z.string().trim().min(1).max(300), a: z.string().trim().min(1).max(2000) }).strict()).min(3).max(6),
		nguon: z.array(z.object({ title: z.string().trim().min(1).max(300), url: z.string().trim().max(2000).optional() }).strict()).min(1).max(12),
	})
	.strict();

/** Lời zod → tiếng Việt, mỗi vấn đề một dòng, kèm tên trường. */
function loiKhuon(issues) {
	return issues
		.map((i) => {
			const truong = i.path.length ? i.path.join(".") : "(gốc)";
			const don = i.origin === "string" ? "ký tự" : i.origin === "array" ? "mục" : "";
			switch (i.code) {
				case "too_small":
					return `${truong}: cần ít nhất ${i.minimum} ${don}`.trim();
				case "too_big":
					return `${truong}: tối đa ${i.maximum} ${don}`.trim();
				case "unrecognized_keys":
					return `${truong}: trường thừa không nhận: ${i.keys.join(", ")}`;
				case "invalid_type":
					return `${truong}: sai kiểu hoặc thiếu`;
				default:
					return `${truong}: không hợp lệ`;
			}
		})
		.join("; ");
}

/**
 * In nghiêng MỘT dấu sao ("*chữ*"): bộ chuyển Portable Text giữ nguyên dấu sao. Bỏ qua **đậm**,
 * gạch đầu dòng "* ", dấu sao đứng trơ và mã `…`.
 * @returns {string[]} các đoạn vi phạm
 */
export function timNghiengMotSao(md) {
	const ra = [];
	for (const dong of String(md ?? "").split("\n")) {
		const sach = dong.replace(/`[^`]*`/g, " ").replace(/\*\*/g, "  ");
		for (const m of sach.matchAll(/(?<![*\p{L}\p{N}])\*(?![\s*])([^*\n]*?[^\s*])\*(?![*\p{L}\p{N}])/gu)) ra.push(m[0]);
	}
	return ra;
}

/**
 * Đổi mọi `_key` thành `<slug>-<n>` (duy nhất trong bài; khoá của bộ chuyển chỉ duy nhất trong
 * một lượt gọi). Mark trỏ tới markDef được đổi theo. Không sửa mảng vào.
 */
export function doiKhoa(pt, slug) {
	const moi = new Map();
	const defs = new Set();
	const gom = (x, laDef) => {
		if (Array.isArray(x)) return x.forEach((y) => gom(y, laDef));
		if (!x || typeof x !== "object") return;
		if (typeof x._key === "string" && !moi.has(x._key)) moi.set(x._key, `${slug}-${moi.size + 1}`);
		if (laDef && typeof x._key === "string") defs.add(x._key);
		for (const [k, v] of Object.entries(x)) gom(v, k === "markDefs");
	};
	gom(pt, false);
	const dung = (x) => {
		if (Array.isArray(x)) return x.map(dung);
		if (!x || typeof x !== "object") return x;
		const ra = {};
		for (const [k, v] of Object.entries(x)) {
			if (k === "_key" && moi.has(v)) ra[k] = moi.get(v);
			else if (k === "marks" && Array.isArray(v)) ra[k] = v.map((m) => (defs.has(m) ? moi.get(m) : m));
			else ra[k] = dung(v);
		}
		return ra;
	};
	return dung(pt);
}

const loi = (ma, ghiChu) => ({ ma, ghiChu });
const catCau = (c) => (c.length > 160 ? `${c.slice(0, 157)}…` : c);

/** Mọi bài blog (nháp lẫn đã đăng): KHÔNG lọc status. */
async function docMoiBaiBlog(content) {
	const ra = [];
	let cursor, trang = 0;
	do {
		const r = await content.list(BO, { limit: 100, cursor });
		for (const it of r.items ?? []) {
			const d = it.data ?? {};
			ra.push({ id: `bai:${it.id}`, tieuDe: String(d.title ?? ""), tuKhoa: Array.isArray(d.tu_khoa) ? d.tu_khoa.map(String) : [] });
		}
		cursor = r.hasMore && r.cursor && ++trang < 200 ? r.cursor : undefined;
	} while (cursor);
	return ra;
}

function soatPhamVi(dv) {
	const cho = [
		["tiêu đề", dv.tieuDe],
		["mô tả", dv.moTa],
		["thân bài", dv.md],
		...dv.faq.flatMap((f, i) => [
			[`FAQ ${i + 1} (hỏi)`, f.q],
			[`FAQ ${i + 1} (đáp)`, f.a],
		]),
	];
	const ra = [];
	for (const [noi, chu] of cho)
		for (const v of timViPham(chu)) ra.push(loi("pham_vi", `${noi}: "${v.tu}" trong câu "${catCau(v.cau)}" — ${v.goiY}`));
	return ra;
}

/**
 * Nhận bài Claude viết. Lỗi trả về (không ném) dạng `{daTao: false, loi: [{ma, ghiChu}], soLanNopConLai}`.
 * @param {{storage: object, kv?: object, content: object, media?: object}} ctx
 * @param {unknown} dauVao  khuôn KHUON_NOP
 * @param {{now?: number, markdownToPortableText: (md: string) => object[], docTrang: Function,
 *   kiemDuong: (duong: string, ten?: string) => Promise<boolean>, chiMuc?: object, chiMucAnh?: object}} phuThuoc
 * @returns {Promise<{daTao: true, contentId: string, slug: string, adminUrl: string, phieu: object}
 *   | {daTao: false, loi: {ma: string, ghiChu: string}[], soLanNopConLai?: number}>}
 */
export async function nopBai(ctx, dauVao, { now = Date.now(), markdownToPortableText, docTrang, kiemDuong, chiMuc, chiMucAnh } = {}) {
	const s = ctx.storage;
	const kq = KHUON_NOP.safeParse(dauVao);
	if (!kq.success) return { daTao: false, loi: [loi("dau_vao", loiKhuon(kq.error.issues))] };
	const dv = kq.data;

	const keHoach = await s.ke_hoach.get(dv.keHoachId);
	if (!keHoach) return { daTao: false, loi: [loi("khong_co_ke_hoach", `Không có bài dự kiến ${dv.keHoachId}`)] };
	if (keHoach.trangThai !== "dang_viet")
		return { daTao: false, loi: [loi("sai_trang_thai", `Bài dự kiến đang ở "${keHoach.trangThai}", không phải "dang_viet" — lấy bài qua layBaiCanViet trước`)] };
	const daNop = keHoach.soLanNop ?? 0;
	if (daNop >= SO_LAN_NOP_TOI_DA)
		return { daTao: false, loi: [loi("het_luot_nop", `Đã nộp ${daNop}/${SO_LAN_NOP_TOI_DA} lượt cho bài này — dừng, người quản trị sẽ xem lại`)], soLanNopConLai: 0 };
	// Đếm lượt TRƯỚC khi chấm: lượt bị trả lỗi vẫn tính.
	const kh = { ...keHoach, soLanNop: daNop + 1 };
	await s.ke_hoach.put(dv.keHoachId, kh);
	const soLanNopConLai = SO_LAN_NOP_TOI_DA - kh.soLanNop;

	const cm = chiMuc ?? (await layChiMuc(ctx.content));
	const tuKhoaChinh = kh.tuKhoaChinh ?? dv.tuKhoa[0];
	const dsLoi = [];

	// Rào rẻ.
	const khuon = kiemKhuon(dv.md, { tuKhoaChinh });
	for (const l of khuon.loi) dsLoi.push(loi(`khuon:${l.ma}`, l.ghiChu));
	dsLoi.push(...soatPhamVi(dv));
	const nghieng = timNghiengMotSao(dv.md);
	if (nghieng.length)
		dsLoi.push(loi("nghieng_mot_sao", `In nghiêng một dấu sao không hiển thị được (dấu sao in ra trang): ${nghieng.slice(0, 5).join(", ")} — bỏ nghiêng hoặc dùng **đậm**`));

	const baiCo = [...(await docMoiBaiBlog(ctx.content)), ...(await kho.dsNhap(s)).map((n) => ({ id: `nhap:${n.id}`, tieuDe: String(n.tieuDe ?? ""), tuKhoa: n.tuKhoa ?? [] }))];
	const trung = timTrungBo({ tieuDe: dv.tieuDe, tuKhoa: dv.tuKhoa }, taoBoKhoa(baiCo));
	if (trung) {
		const x = baiCo.find((b) => b.id === trung.id);
		dsLoi.push(loi("trung_blog", `Trùng bài đã có "${x?.tieuDe ?? ""}" (độ giống ${Math.floor(trung.doGiong * 100) / 100}) — đổi góc nhìn hoặc ý định để bài khác hẳn`));
	}
	const tenTuDien = new Map();
	for (const m of cm?.muc ?? []) if (m.loai !== "bai_viet" && m.khoaTen && !tenTuDien.has(m.khoaTen)) tenTuDien.set(m.khoaTen, m.ten);
	for (const [nhan, chu] of [["Từ khoá chính", dv.tuKhoa[0]], ["Tiêu đề", dv.tieuDe]]) {
		const t = trungTuDien(chu, tenTuDien);
		if (t) {
			dsLoi.push(loi("trung_tu_dien", `${nhan} trùng tên mục từ điển "${tenTuDien.get(t)}" — trang từ điển đã phủ; nhắm ý rộng hơn và link về trang đó`));
			break;
		}
	}

	// Rào tốn mạng — vẫn chạy khi đã có lỗi, để Claude sửa mọi thứ trong MỘT lượt viết lại.
	const nguon = await xacMinhNguon(dv.nguon, { docTrang, chiMuc: cm, kiemDuong });
	if (nguon.giu.length < SO_NGUON_TOI_THIEU) {
		const bo = nguon.bo.map((b) => `${b.title}${b.url ? ` (${b.url})` : ""}: ${b.chiTiet ?? b.lyDo}`).join("; ");
		dsLoi.push(loi("nguon_thieu", `Chỉ giữ được ${nguon.giu.length} nguồn (cần ≥ ${SO_NGUON_TOI_THIEU}). Bị bỏ: ${bo || "không có"}`));
	}
	const lk = await kiemLienKetThan(dv.md, { keHoach: { trangTruCot: kh.trangTruCot, lienKetDich: kh.lienKetDich }, kiemDuong });
	if (!lk.dat) {
		const thieu = [];
		if (!lk.coTruCot) thieu.push(`thiếu link tới trang trụ cột ${kh.trangTruCot}`);
		if (lk.soDich < 5) thieu.push(`chỉ ${lk.soDich} link tới trang đích của bài dự kiến (cần ≥ 5, không tính trụ cột)`);
		dsLoi.push(loi("lien_ket", `${thieu.join("; ")}. Link bị gỡ: ${lk.goBo.map((g) => `${g.href} (${g.lyDo})`).join(", ") || "không có"}`));
	}

	if (dsLoi.length) return { daTao: false, loi: dsLoi, soLanNopConLai };

	// Qua cổng: ảnh bìa + phiếu + tạo nháp.
	const bangTen = bangTenTheoDuong(cm);
	const cmAnh = chiMucAnh ?? (await layChiMucAnh(ctx.media, { maTheoTen: maTheoTenTuChiMuc(cm) }));
	const anh = chonAnhBia(cmAnh, {
		tieuDe: dv.tieuDe,
		tuKhoaChinh,
		tuKhoaPhu: kh.tuKhoaPhu ?? [],
		trangTruCot: kemTen(bangTen, kh.trangTruCot),
		lienKetDich: (kh.lienKetDich ?? []).map((d) => kemTen(bangTen, d)),
	});
	const phieu = {
		seo: chamSeo({ tieuDe: dv.tieuDe, moTa: dv.moTa, noiDungMd: lk.md, tuKhoaChinh, faq: dv.faq }),
		ymyl: doYmyl([lk.md, ...dv.faq.map((f) => f.a)].join("\n")),
		khuonCanhBao: khuon.canhBao,
		nguonBo: nguon.bo,
		linkGo: lk.goBo,
		anh: anh ?? null,
		soTu: khuon.soTu,
	};

	const slugTieuDe = slugKhongDau(dv.tieuDe);
	const content = doiKhoa(markdownToPortableText(chuanHoaMd(lk.md)), slugTieuDe);
	const truong = {
		description: dv.moTa,
		content,
		...(anh ? { featured_image: anh.mediaId } : {}),
		tu_khoa: dv.tuKhoa,
		faq: dv.faq,
		nguon_tham_khao: nguon.giu,
		tac_gia: TAC_GIA,
		cta: CTA,
		cho_index: false,
	};
	// Slug sinh từ title và GIỮ dấu → tạo bằng tiêu đề không dấu rồi update tiêu đề thật.
	const tao = await ctx.content.create(BO, { title: slugTieuDe, ...truong });
	const contentId = String(tao.id);
	const slug = String(tao.slug ?? slugTieuDe);
	try {
		await ctx.content.update(BO, contentId, { title: dv.tieuDe, ...truong });
	} catch (e) {
		// Nháp đã có trong CMS: vẫn ghi sổ để nó không mồ côi; người duyệt sửa tiêu đề tay.
		phieu.loiCapNhat = `Tạo được nháp nhưng không cập nhật được tiêu đề có dấu và các trường: ${String(e?.message ?? e).slice(0, 200)}`;
	}
	const nowIso = new Date(now).toISOString();
	await kho.themNhap(s, { keHoachId: dv.keHoachId, contentId, slug, tieuDe: dv.tieuDe, tuKhoa: dv.tuKhoa, phieu }, nowIso);
	await s.ke_hoach.put(dv.keHoachId, { ...kh, trangThai: "co_nhap", contentId });
	return { daTao: true, contentId, slug, adminUrl: `/_emdash/admin/content/${BO}/${contentId}`, phieu };
}
