// Việc của lò viết bài (2C-3), thuần: mọi phụ thuộc (storage, kv, content, media, bộ chuyển
// Markdown → Portable Text, tải trang, kiểm đường) đều TIÊM vào để thử được bằng đồ giả.
//
// Vòng đời một bài dự kiến: da_duyet → dang_viet (layBaiCanViet giữ chỗ, ghi giuLuc, soLanGiao+1)
// → co_nhap (nopBai đã tạo nháp bai_viet, ghi contentId) → da_dang (người duyệt Publish).
// dang_viet quá GIO_GIU_CHO giờ không nộp được → trả về da_duyet (dọn ở layBaiCanViet); hết hạn
// lần thứ hai, hoặc nộp hết SO_LAN_NOP_TOI_DA lượt đều trượt → can_xem (kèm loiCuoi): chỉ người
// quản trị gỡ được ("Duyệt lại" / "Bỏ"). Bộ đếm KHÔNG bao giờ bị đặt lại lặng lẽ.
//
// Claude viết, máy chủ chặn. Rào ở nopBai CHẶN (không tạo gì, trả lỗi tiếng Việt đủ để viết lại)
// những thứ người duyệt không được phép phải tự bắt: khuôn bài, HTML/khối lạ, phạm vi Y sỹ (pháp
// lý), trùng bài, nguồn bịa, link hỏng. Còn lại (SEO, YMYL, độ dài) chỉ là cờ trong phiếu.
// Mọi rào trên thân bài chạy trên Portable Text CUỐI CÙNG (thứ thật sự được lưu), không chỉ trên
// markdown Claude gửi — xem viet/pt-an-toan.mjs.
import { z } from "zod";
import * as kho from "../kho.mjs";
import { bocDuLieu } from "../chien-luoc/viec.mjs";
import { LOI_NHAC_VIET } from "../loi-dan.mjs";
import { kiemKhuon } from "../luat/khuon-bai.mjs";
import { chuanHoaMd } from "../luat/md-sang-pt.mjs";
import { slugKhongDau } from "../luat/slug.mjs";
import { timViPham, sachChu } from "../luat/pham-vi-y-sy.mjs";
import { chuanDuong } from "../luat/loc-nguon-link.mjs";
import { doYmyl } from "../luat/ymyl.mjs";
import { chamSeo } from "../luat/seo.mjs";
import { taoBoKhoa, timTrungBo, trungTuDien } from "../luat/trung-lap.mjs";
import { layChiMuc } from "../noi-bo/nap.mjs";
import { layChiMucAnh, maTheoTenTuChiMuc, chonAnhBia } from "./anh.mjs";
import { xacMinhNguon } from "./nguon.mjs";
import { kiemLienKetThan } from "./lien-ket-than.mjs";
import { kemCauNguon, kemCauLink, hrefDayDu, trichHref } from "./ly-do.mjs";
import { timHtmlTho, kiemPtAnToan, chuTuPt, ptSangMd } from "./pt-an-toan.mjs";

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
/** Khoá KV quanh lượt giao bài (thu hồi + chọn + ghi giữ chỗ). */
export const KHOA_GIAO_BAI = "viet:khoa-giao";
const HAN_KHOA_GIAO_MS = 2 * 60 * 1000;
/** Khoá KV quanh một lượt nộp của MỘT kế hoạch — đủ dài cho xác minh nguồn (60 s) + link (30 s). */
export const khoaNop = (keHoachId) => `viet:nop:${keHoachId}`;
const HAN_KHOA_NOP_MS = 5 * 60 * 1000;
/** Khoá hạn ngạch đêm giữ chừng này ngày rồi dọn (như donKhoaCu của mcp-viec.mjs). */
const GIU_KHOA_GIAO_NGAY = 7;

export const khoaGiao = (ngay) => `viet:giao:${ngay}`;

/** `now` là mốc ms. Chuỗi ISO (quy ước của kho.mjs) lọt vào đây thì ngayVN ném và thu hồi ra NaN → thu hồi MỌI kế hoạch. */
function kiemNow(now) {
	if (typeof now !== "number" || !Number.isFinite(now)) throw new TypeError(`now phải là mốc ms (số), nhận ${typeof now}`);
}

/**
 * Giành khoá KV (cùng lối giuKhoa của plugin.mjs): chỉ khi chưa ai giữ hoặc khoá cũ đã quá hạn
 * (coi như lượt giữ nó đã chết). @returns {Promise<string|null>} revision để nhả bằng compareAndDelete.
 */
async function giuKhoaKv(kv, khoa, nowMs, hanMs) {
	const cu = await kv.getVersioned(khoa);
	if (cu && cu.value?.het > nowMs) return null;
	const r = await kv.compareAndSet(khoa, cu?.revision ?? null, { tu: new Date(nowMs).toISOString(), het: nowMs + hanMs });
	return r.applied ? r.revision : null;
}

/**
 * Nhả khoá KV trong `finally`: KHÔNG bao giờ ném. Ném ở đây sẽ nuốt kết quả của cả lượt (vd danh
 * sách bài vừa chuyển dang_viet — kẹt 36 h, mất hạn ngạch). Khoá không nhả được thì tự hết hạn.
 */
async function nhaKhoaKv(ctx, khoa, rev) {
	try {
		await ctx.kv.compareAndDelete(khoa, rev);
	} catch (e) {
		try {
			ctx.log?.warn?.(`Rada SEO: không nhả được khoá ${khoa} — sẽ tự hết hạn`, e);
		} catch {
			// Ghi log hỏng cũng không được làm hỏng lượt.
		}
	}
}

async function donKhoaGiaoCu(kv, nowMs) {
	const han = kho.ngayVN(nowMs - GIU_KHOA_GIAO_NGAY * 24 * GIO_MS);
	for (const { key } of await kv.list("viet:giao:")) {
		const m = /^viet:giao:(\d{4}-\d{2}-\d{2})$/.exec(key);
		if (m && m[1] < han) await kv.delete(key);
	}
}

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

/**
 * dang_viet giữ quá GIO_GIU_CHO giờ → da_duyet (GIỮ lượt nộp đã dùng); đã giao ≥ 2 lần mà vẫn hết
 * hạn → can_xem: kế hoạch không viết nổi (vd link đích chết sau lúc duyệt) không được ăn hạn ngạch
 * đêm mãi. @returns {Promise<number>}
 */
export async function thuHoiGiuCho(s, nowMs) {
	kiemNow(nowMs);
	const han = nowMs - GIO_GIU_CHO * GIO_MS;
	const qua = (await kho.dsKeHoach(s, { trangThai: "dang_viet" })).filter((k) => !(Date.parse(k.giuLuc) >= han));
	for (const { id, ...k } of qua) {
		const lan = k.soLanGiao ?? 0;
		const moi =
			lan >= 2
				? { ...k, trangThai: "can_xem", lyDoCanXem: `Hết hạn giữ chỗ ${GIO_GIU_CHO} h lần thứ ${lan} mà chưa nộp được bài` }
				: { ...k, trangThai: "da_duyet" };
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
/** Đường + tên trang đi sang routine như DỮ LIỆU: đường chuẩn (bỏ query/hash) rồi bọc dấu mốc. */
function kemTenBoc(bang, duong, id) {
	const d = duong ? chuanDuong(duong) : "";
	return { duong: bocDuLieu(id, d), ten: bocDuLieu(`${id}:ten`, bang.get(duong) ?? bang.get(d) ?? "") };
}

/**
 * Kế hoạch da_duyet xếp theo điểm cụm (giảm dần), rồi cũ trước. Bỏ hướng không còn nhận.
 * `cum.diem` ĐÃ gồm trọng số hướng (chien-luoc/chi-so.mjs: diemHuong × (0,6 + 0,1·trọngSố)) —
 * nhân thêm trongSo ở đây là tính hai lần.
 */
async function xepKeHoach(s) {
	const ds = await kho.dsKeHoach(s, { trangThai: "da_duyet" });
	const cum = await s.cum_nghia.getMany([...new Set(ds.map((k) => k.cumId).filter(Boolean))]);
	const huongIds = new Set(ds.map((k) => k.huongId ?? cum.get(k.cumId)?.huongId).filter(Boolean));
	const huong = await s.huong.getMany([...huongIds]);
	return ds
		.map((k) => {
			const h = huong.get(k.huongId ?? cum.get(k.cumId)?.huongId);
			return { k, h, diem: Number(cum.get(k.cumId)?.diem) || 0 };
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
		trangTruCot: kemTenBoc(tenTheoDuong, k.trangTruCot, `${id}:truCot`),
		lienKetDich: (k.lienKetDich ?? []).map((d, i) => kemTenBoc(tenTheoDuong, d, `${id}:dich${i}`)),
		khuonBai: LOI_NHAC_VIET,
		soLanNopConLai: Math.max(0, SO_LAN_NOP_TOI_DA - (k.soLanNop ?? 0)),
	};
}

/**
 * Giao bài cho routine viết đêm nay. Cả lượt (thu hồi + chọn + ghi giữ chỗ) nằm trong khoá KV
 * KHOA_GIAO_BAI: hai lượt gọi đồng thời không chọn trùng một kế hoạch. Hạn ngạch đêm (giờ VN) giữ
 * bằng CAS TRƯỚC khi chọn, phần không dùng (hết kế hoạch, hoặc lỗi giữa chừng) được hoàn. Chỉ mục
 * nội bộ nạp TRƯỚC khi giành khoá (N5): lần nạp nguội (~18k mục) có thể quá hạn khoá 2 phút, để
 * lượt thứ hai giành khoá hợp lệ và chọn trùng kế hoạch; nạp hỏng thì chưa có gì bị giữ.
 * @param {{storage: object, kv: object, content?: object}} ctx
 * @param {{now?: number, chiMuc?: object}} [tuyChon]  now: mốc ms
 * @returns {Promise<{bai: object[], conLaiDemNay: number, soNhapChoDuyet: number, ghiChu?: string}>}
 */
export async function layBaiCanViet(ctx, { now = Date.now(), chiMuc } = {}) {
	kiemNow(now);
	const s = ctx.storage, kv = ctx.kv;
	const khoa = khoaGiao(kho.ngayVN(now));
	const tran = await traBaiMoiDem(kv);
	const conLai = async () => Math.max(0, tran - ((await kv.get(khoa)) ?? 0));
	const bang = bangTenTheoDuong(chiMuc ?? (await layChiMuc(ctx.content)));

	const rev = await giuKhoaKv(kv, KHOA_GIAO_BAI, now, HAN_KHOA_GIAO_MS);
	if (!rev)
		return { bai: [], conLaiDemNay: await conLai(), soNhapChoDuyet: await kho.demNhap(s, "cho_duyet"), ghiChu: "đang có lượt lấy bài khác — thử lại sau ít phút" };
	try {
		try {
			await donKhoaGiaoCu(kv, now);
		} catch {
			// Dọn khoá cũ chỉ là giữ kho gọn; hỏng thì lượt sau dọn.
		}
		await thuHoiGiuCho(s, now);

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
					const moi = { ...data, trangThai: "dang_viet", giuLuc, soLanGiao: (data.soLanGiao ?? 0) + 1 };
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
		ra.bai = chon.map((k) => baiChoClaude(k, bang));
		return ra;
	} finally {
		await nhaKhoaKv(ctx, KHOA_GIAO_BAI, rev);
	}
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
		// Khoá gốc phải duy nhất: hai nút cùng khoá gốc sẽ nhận CÙNG khoá mới. Bộ chuyển không sinh
		// khoá trùng; chỉ khối lạ (đã bị pt-an-toan chặn) mới làm được — gặp thì ném, đừng lưu.
		if (typeof x._key === "string" && moi.has(x._key)) throw new Error(`Portable Text có _key trùng "${x._key}"`);
		if (typeof x._key === "string") moi.set(x._key, `${slug}-${moi.size + 1}`);
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

/** Chuẩn mọi chữ Claude nộp (NFC, bỏ ký tự vô hình / gạch mềm) — trước mọi rào, và là bản được lưu. */
function sachDauVao(dv) {
	return {
		...dv,
		tieuDe: sachChu(dv.tieuDe).trim(),
		moTa: sachChu(dv.moTa).trim(),
		md: sachChu(dv.md),
		tuKhoa: dv.tuKhoa.map((t) => sachChu(t).trim()),
		faq: dv.faq.map((f) => ({ q: sachChu(f.q).trim(), a: sachChu(f.a).trim() })),
		nguon: dv.nguon.map((n) => ({ ...n, title: sachChu(n.title).trim(), ...(n.url !== undefined ? { url: sachChu(n.url).trim() } : {}) })),
	};
}

/**
 * Phạm vi Y sỹ, chế độ NGHIÊM (bài máy viết). Thân bài soát trên chữ rút từ PT cuối (nguồn duy
 * nhất — chữ escape JSON trong khối lạ cũng lộ ra), cộng vi phạm thấy trên md thô mà PT không có.
 */
function soatPhamVi(dv, chuThan) {
	const nghiem = { nghiem: true };
	const cho = [
		["tiêu đề", dv.tieuDe],
		["mô tả", dv.moTa],
		...dv.tuKhoa.map((t, i) => [`từ khoá ${i + 1}`, t]),
		["thân bài", chuThan],
		...dv.faq.flatMap((f, i) => [
			[`FAQ ${i + 1} (hỏi)`, f.q],
			[`FAQ ${i + 1} (đáp)`, f.a],
		]),
		...dv.nguon.map((n, i) => [`nguồn ${i + 1}`, n.title]),
	];
	const ra = [];
	const baoCao = (noi, v) => ra.push(loi("pham_vi", `${noi}: "${v.tu}" trong câu "${catCau(v.cau)}" — ${v.goiY}`));
	for (const [noi, chu] of cho) for (const v of timViPham(chu, nghiem)) baoCao(noi, v);
	const daThay = new Set(timViPham(chuThan, nghiem).map((v) => `${v.ma}|${v.tu}`));
	for (const v of timViPham(dv.md, nghiem)) if (!daThay.has(`${v.ma}|${v.tu}`)) baoCao("thân bài", v);
	return ra;
}

const adminUrl = (contentId) => `/_emdash/admin/content/${BO}/${contentId}`;

/** Nháp lò viết đã ghi cho kế hoạch (nếu có). */
async function nhapCuaKeHoach(s, keHoachId) {
	const r = await s.nhap.query({ where: { keHoachId }, limit: 1 });
	const x = r.items?.[0];
	return x ? { id: x.id, ...x.data } : null;
}

/** Kế hoạch đã create nháp trong CMS mà chưa có bản ghi nhap: người quản trị phải biết nháp đó. */
function ghiChuNhapMoCoi(k) {
	return k.contentId ? `; đã có nháp mồ côi trong CMS (contentId ${k.contentId}${k.slug ? `, slug ${k.slug}` : ""}) — xem lại hoặc xoá nó` : "";
}

/**
 * Lượt nộp trượt: lưu loiCuoi (lỗi lượt này) lên kế hoạch; lượt cuối cùng trượt → can_xem.
 * Hạn ngạch đêm KHÔNG được hoàn khi một kế hoạch trượt hết lượt (M12, chấp nhận): chỗ đã giao là
 * đã tiêu — hoàn lại thì một kế hoạch hỏng mở đường cho vòng giao-trượt-giao trong cùng đêm.
 */
async function ghiTruot(s, id, dsLoi) {
	const hien = await s.ke_hoach.get(id);
	if (!hien) return;
	const moi = { ...hien, loiCuoi: dsLoi.slice(0, 20).map((l) => `${l.ma}: ${l.ghiChu}`.slice(0, 500)) };
	if (hien.trangThai === "dang_viet" && (hien.soLanNop ?? 0) >= SO_LAN_NOP_TOI_DA) {
		moi.trangThai = "can_xem";
		moi.lyDoCanXem = `Nộp ${hien.soLanNop} lượt đều trượt — lỗi của lượt cuối ở loiCuoi${ghiChuNhapMoCoi(hien)}`;
		delete moi.giuLuc;
	}
	await s.ke_hoach.put(id, moi);
}

/** Trường ảnh đã chuẩn hoá (object của ĐÚNG mediaId, có meta.storageKey) hoặc null. */
function anhDay(v, mediaId) {
	if (typeof v === "string" && v.trim().startsWith("{")) {
		try {
			v = JSON.parse(v);
		} catch {
			return null;
		}
	}
	if (!v || typeof v !== "object" || String(v.id ?? "") !== String(mediaId)) return null;
	return typeof v.meta?.storageKey === "string" && v.meta.storageKey ? v : null;
}

/**
 * Object ảnh bìa mà EmDash đã chuẩn hoá lúc create: lấy từ item create trả về, không có thì đọc
 * lại nháp. Không bao giờ ném — không lấy được thì trả null, nơi gọi lùi về id trần như cũ.
 */
async function anhDaChuanHoa(ctx, contentId, mediaId, daTao) {
	const tuTao = anhDay(daTao?.data?.featured_image, mediaId);
	if (tuTao) return tuTao;
	try {
		const item = await ctx.content.get?.(BO, contentId);
		return anhDay(item?.data?.featured_image, mediaId);
	} catch {
		return null;
	}
}

/**
 * Nhận bài Claude viết. Lỗi trả về (không ném) dạng `{daTao: false, loi: [{ma, ghiChu}], soLanNopConLai}`.
 * Lặp an toàn: kế hoạch đã có nháp → trả lại nháp đó (`daCo: true`). Cả lượt nằm trong khoá KV
 * theo kế hoạch: lượt MCP bị client thử lại sau khi mạng chập không tạo nháp thứ hai.
 * @param {{storage: object, kv: object, content: object, media?: object}} ctx
 * @param {unknown} dauVao  khuôn KHUON_NOP
 * @param {{now?: number, markdownToPortableText: (md: string) => object[], docTrang: Function,
 *   kiemDuong: (duong: string, ten?: string) => Promise<boolean>, chiMuc?: object, chiMucAnh?: object}} phuThuoc
 * @returns {Promise<{daTao: true, daCo?: true, contentId: string, slug: string, adminUrl: string, phieu: object}
 *   | {daTao: false, loi: {ma: string, ghiChu: string}[], soLanNopConLai?: number}>}
 */
export async function nopBai(ctx, dauVao, phuThuoc = {}) {
	const { now = Date.now() } = phuThuoc;
	kiemNow(now);
	const kq = KHUON_NOP.safeParse(dauVao);
	if (!kq.success) return { daTao: false, loi: [loi("dau_vao", loiKhuon(kq.error.issues))] };
	const dv = sachDauVao(kq.data);

	const kv = ctx.kv;
	const k = khoaNop(dv.keHoachId);
	const rev = await giuKhoaKv(kv, k, now, HAN_KHOA_NOP_MS);
	if (!rev)
		return { daTao: false, loi: [loi("dang_nop", "Một lượt nộp khác cho bài này đang chạy — chờ nó xong rồi gọi lại (lượt này không tính)")] };
	try {
		return await nopTrongKhoa(ctx, dv, { ...phuThuoc, now });
	} finally {
		await nhaKhoaKv(ctx, k, rev);
	}
}

async function nopTrongKhoa(ctx, dv, { now, markdownToPortableText, docTrang, kiemDuong, chiMuc, chiMucAnh }) {
	const s = ctx.storage;
	const id = dv.keHoachId;

	const daCo = await nhapCuaKeHoach(s, id);
	if (daCo) {
		// N4: hỏng giữa themNhap và put co_nhap → kế hoạch kẹt dang_viet; sửa luôn ở đây.
		const kh = await s.ke_hoach.get(id);
		if (kh?.trangThai === "dang_viet") {
			const sua = { ...kh, trangThai: "co_nhap", contentId: String(daCo.contentId ?? daCo.id), slug: String(daCo.slug ?? "") };
			delete sua.loiCuoi;
			await s.ke_hoach.put(id, sua);
		}
		return { daTao: true, daCo: true, contentId: String(daCo.id), slug: String(daCo.slug ?? ""), adminUrl: adminUrl(daCo.id), phieu: daCo.phieu ?? {} };
	}

	const keHoach = await s.ke_hoach.get(id);
	if (!keHoach) return { daTao: false, loi: [loi("khong_co_ke_hoach", `Không có bài dự kiến ${id}`)] };
	if (keHoach.trangThai === "can_xem")
		return { daTao: false, loi: [loi("can_xem", `Bài dự kiến đã chuyển sang "cần xem lại" (${keHoach.lyDoCanXem ?? "hết lượt"}) — dừng, người quản trị sẽ xem lại`)], soLanNopConLai: 0 };
	if (keHoach.trangThai !== "dang_viet")
		return { daTao: false, loi: [loi("sai_trang_thai", `Bài dự kiến đang ở "${keHoach.trangThai}", không phải "dang_viet" — lấy bài qua layBaiCanViet trước`)] };
	const daNop = keHoach.soLanNop ?? 0;
	// N3: kế hoạch đã có contentId mà chưa có nháp = lượt trước create xong rồi hỏng khi ghi sổ.
	// Khôi phục chạy TRƯỚC phép kiểm hết lượt và không tính thêm lượt — không thì hỏng ở lượt cuối
	// đẩy bài sang can_xem trong khi nháp nằm trong CMS mà tab Nháp không thấy. Chỉ được một lượt
	// khôi phục: trượt thì ghiTruot đưa sang can_xem (soLanNop vẫn ≥ trần).
	const khoiPhuc = daNop >= SO_LAN_NOP_TOI_DA && Boolean(keHoach.contentId);
	if (daNop >= SO_LAN_NOP_TOI_DA && !khoiPhuc) {
		// Kế hoạch cũ (trước khi có can_xem) kẹt ở đây: đưa sang người quản trị thay vì nằm im.
		await s.ke_hoach.put(id, { ...keHoach, trangThai: "can_xem", lyDoCanXem: keHoach.lyDoCanXem ?? `Đã nộp ${daNop}/${SO_LAN_NOP_TOI_DA} lượt${ghiChuNhapMoCoi(keHoach)}` });
		return { daTao: false, loi: [loi("het_luot_nop", `Đã nộp ${daNop}/${SO_LAN_NOP_TOI_DA} lượt cho bài này — dừng, người quản trị sẽ xem lại`)], soLanNopConLai: 0 };
	}
	// Đếm lượt TRƯỚC khi chấm: lượt bị trả lỗi vẫn tính.
	const kh = { ...keHoach, soLanNop: khoiPhuc ? daNop : daNop + 1 };
	if (!khoiPhuc) await s.ke_hoach.put(id, kh);
	const soLanNopConLai = Math.max(0, SO_LAN_NOP_TOI_DA - kh.soLanNop);

	const cm = chiMuc ?? (await layChiMuc(ctx.content));
	const tuKhoaChinh = kh.tuKhoaChinh ?? dv.tuKhoa[0];
	const dsLoi = [];

	// Rào rẻ trên markdown.
	const khuon = kiemKhuon(dv.md, { tuKhoaChinh });
	for (const l of khuon.loi) dsLoi.push(loi(`khuon:${l.ma}`, l.ghiChu));
	const html = timHtmlTho(dv.md);
	if (html.length)
		dsLoi.push(loi("khuon:html", `Thân bài có HTML hoặc chú thích "<!-- -->" (không được phép — chỉ Markdown): ${html.slice(0, 5).map((h) => `dòng ${h.dong} "${h.chu}"`).join("; ")}`));
	const nghieng = timNghiengMotSao(dv.md);
	if (nghieng.length)
		dsLoi.push(loi("nghieng_mot_sao", `In nghiêng một dấu sao không hiển thị được (dấu sao in ra trang): ${nghieng.slice(0, 5).join(", ")} — bỏ nghiêng hoặc dùng **đậm**`));

	// Chuyển MỘT lần; mọi rào thân bài sau đây chạy trên PT (thứ được lưu).
	const ptTho = markdownToPortableText(chuanHoaMd(dv.md));
	const lk = await kiemLienKetThan(ptTho, { keHoach: { trangTruCot: kh.trangTruCot, lienKetDich: kh.lienKetDich }, kiemDuong });
	if (lk.nguyHiem.length)
		dsLoi.push(loi("lien_ket_nguy_hiem", `Link không được phép (chỉ dùng đường nội bộ dạng /duong/): ${lk.nguyHiem.slice(0, 5).map((x) => `"${trichHref(hrefDayDu(dv.md, x.href))}"`).join(", ")}`));
	const loiPt = kiemPtAnToan(lk.pt);
	if (loiPt.length) dsLoi.push(loi("khuon:khoi_la", `Thân bài sau khi chuyển có thành phần không được phép: ${loiPt.slice(0, 8).join("; ")}`));
	dsLoi.push(...soatPhamVi(dv, chuTuPt(lk.pt)));

	// Bài của chính kế hoạch này (nháp mồ côi đang được khôi phục — M9) không tính là trùng.
	const baiCo = [
		...(await docMoiBaiBlog(ctx.content)).filter((b) => !kh.contentId || b.id !== `bai:${kh.contentId}`),
		...(await kho.dsNhap(s)).map((n) => ({ id: `nhap:${n.id}`, tieuDe: String(n.tieuDe ?? ""), tuKhoa: n.tuKhoa ?? [] })),
	];
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
	// Lý do ra CÂU tiếng Việt, mã giữ ở `ma` (viet/ly-do.mjs): lời bác tới Claude, loiCuoi và phiếu dùng chung.
	const nguonBo = nguon.bo.map(kemCauNguon);
	const linkGo = lk.goBo.map(kemCauLink);
	if (nguon.giu.length < SO_NGUON_TOI_THIEU) {
		const bo = nguonBo.map((b) => `${b.title}${b.url ? ` (${b.url})` : ""}: ${b.lyDo} [${b.ma}]`).join("; ");
		dsLoi.push(loi("nguon_thieu", `Chỉ giữ được ${nguon.giu.length} nguồn (cần ≥ ${SO_NGUON_TOI_THIEU}). Bị bỏ: ${bo || "không có"}`));
	}
	if (!lk.dat) {
		const thieu = [];
		if (!lk.coTruCot) thieu.push(`thiếu link tới trang trụ cột ${kh.trangTruCot}`);
		if (lk.soDich < 5) thieu.push(`chỉ ${lk.soDich} link tới trang đích của bài dự kiến (cần ≥ 5, không tính trụ cột)`);
		dsLoi.push(loi("lien_ket", `${thieu.join("; ")}. Link bị gỡ: ${linkGo.map((g) => `${trichHref(g.href)}: ${g.lyDo} [${g.ma}]`).join("; ") || "không có"}`));
	}

	if (dsLoi.length) {
		await ghiTruot(s, id, dsLoi);
		return { daTao: false, loi: dsLoi, soLanNopConLai };
	}

	// Đọc lại kế hoạch NGAY trước khi tạo: trong lúc chấm (tới cả phút mạng) người quản trị có thể
	// đã bỏ nó, hoặc thu hồi đã trả nó về.
	const hienTai = await s.ke_hoach.get(id);
	if (!hienTai || hienTai.trangThai !== "dang_viet")
		return { daTao: false, loi: [loi("sai_trang_thai", `Bài dự kiến vừa chuyển sang "${hienTai?.trangThai ?? "đã xoá"}" trong lúc chấm — không tạo nháp`)] };

	// Qua cổng: ảnh bìa + phiếu + tạo nháp.
	const mdCuoi = ptSangMd(lk.pt);
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
		seo: chamSeo({ tieuDe: dv.tieuDe, moTa: dv.moTa, noiDungMd: mdCuoi, tuKhoaChinh, faq: dv.faq }),
		ymyl: doYmyl([mdCuoi, ...dv.faq.map((f) => f.a)].join("\n")),
		khuonCanhBao: khuon.canhBao,
		nguonBo,
		linkGo,
		anh: anh ?? null,
		soTu: khuon.soTu,
	};

	const slugTieuDe = slugKhongDau(dv.tieuDe);
	const content = doiKhoa(lk.pt, slugTieuDe);
	const truong = {
		description: dv.moTa,
		content,
		...(anh ? { featured_image: anh.mediaId } : {}),
		tu_khoa: dv.tuKhoa,
		faq: dv.faq,
		nguon_tham_khao: nguon.giu,
		tac_gia: TAC_GIA,
		cta: CTA,
		cho_index: true, // nháp không công khai; người duyệt bấm Publish = chấp thuận cho index (trang blog coi false là noindex)
	};
	let contentId, slug;
	let daTao = null; // item mà create trả về (nếu lượt này có tạo)
	if (hienTai.contentId) {
		// Lượt trước đã create rồi hỏng trước khi ghi sổ (M9): dùng lại nháp đó, không tạo cái thứ hai.
		contentId = String(hienTai.contentId);
		slug = String(hienTai.slug ?? slugTieuDe);
		phieu.khoiPhuc = `Dùng lại nháp ${contentId} do lượt nộp trước tạo mà chưa ghi sổ`;
	} else {
		// Slug sinh từ title và GIỮ dấu → tạo bằng tiêu đề không dấu rồi update tiêu đề thật.
		const tao = await ctx.content.create(BO, { title: slugTieuDe, ...truong });
		daTao = tao;
		contentId = String(tao.id);
		slug = String(tao.slug ?? slugTieuDe);
		// Ghi contentId lên kế hoạch TRƯỚC mọi bước có thể hỏng: lượt sau khôi phục được nháp.
		await s.ke_hoach.put(id, { ...hienTai, contentId, slug });
	}
	// Ảnh bìa: create CHUẨN HOÁ id trần thành object có meta.storageKey, update thì KHÔNG — nó ghi
	// nguyên id trần vào revision nháp, Publish chép revision đó lên cột, và trang /blog/ (chỉ dựng
	// <img> khi có storageKey, vì /file/<id> trả 404) mất ảnh bìa. Đo trên bàn thử kế hoạch 3
	// (01/10/2026). Nên đưa lại cho update đúng object mà create đã chuẩn hoá.
	if (anh) truong.featured_image = (await anhDaChuanHoa(ctx, contentId, anh.mediaId, daTao)) ?? anh.mediaId;
	try {
		await ctx.content.update(BO, contentId, { title: dv.tieuDe, ...truong });
	} catch (e) {
		// Nháp đã có trong CMS: vẫn ghi sổ để nó không mồ côi; người duyệt sửa tiêu đề tay.
		phieu.loiCapNhat = `Tạo được nháp nhưng không cập nhật được tiêu đề có dấu và các trường: ${String(e?.message ?? e).slice(0, 200)}`;
	}
	const nowIso = new Date(now).toISOString();
	await kho.themNhap(s, { keHoachId: id, contentId, slug, tieuDe: dv.tieuDe, tuKhoa: dv.tuKhoa, phieu }, nowIso);
	const cuoi = { ...hienTai, trangThai: "co_nhap", contentId, slug };
	delete cuoi.loiCuoi;
	await s.ke_hoach.put(id, cuoi);
	return { daTao: true, contentId, slug, adminUrl: adminUrl(contentId), phieu };
}
