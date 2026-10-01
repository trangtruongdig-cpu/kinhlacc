// Mạng nhện HAI CHIỀU — chiều cũ → mới (thuần, không I/O).
//
// VÌ SAO CÓ TỆP NÀY
// Lò viết đã chèn link mới → cũ (`lien-ket-than.mjs`: mỗi bài mới gắn ≥ 5 link vào từ điển và
// 1 link lên trụ cột). Nhưng bài CŨ không bao giờ biết có bài mới ra đời, nên mạng nhện chỉ
// mọc một chiều: bài mới nhận 0 link nội bộ, và nó là bài cần nhất. Cả video ai5phut lẫn ba
// workflow n8n đối chiếu đều chỉ làm chiều mới → cũ — chỗ này là phần họ bỏ.
//
// Đáng làm vì cấu trúc liên kết nội bộ là nhóm tín hiệu có đồng thuận HAI bộ máy: Yandex nói
// thẳng "URL tới được từ trang chủ quan trọng hơn, trang mồ côi bị phạt"; leak Google đặt
// `navDemotion` vào nhóm TRỪ ĐIỂM và họ Reasonable Surfer (US7716225 → US10152520) cho thấy
// link TRONG CÂU truyền giá trị khác link trong danh sách cuối trang.
//
// ⚠️ KHÔNG TỰ CHÈN. Máy chỉ ĐỀ XUẤT trong khung "Phiếu Rada" của bài cũ; người biên tập bấm
// mới chèn. Tự sửa thân bài đã đăng là đổi nội dung người đọc đang xem mà không ai duyệt —
// cùng lý lẽ với ba lớp chặn của bot thẩm định, và ở đây còn nặng hơn vì đây là bài y khoa.
//
// ⚠️ NEO PHẢI CÓ THẬT TRONG BÀI CŨ. Đề xuất một chữ neo không xuất hiện trong bài cũ thì người
// biên tập phải tự viết lại câu — lúc đó đề xuất thành việc thêm chứ không phải việc đỡ. Nên
// thước tự nó hạ cấp: có cụm khớp nguyên văn thì đề xuất cụm đó, không thì đề xuất tiêu đề và
// NÓI RÕ là phải viết thêm câu.

import { chuanHoaManh } from "../luat/chuan-hoa.mjs";
import { doGiong, tapKhoa, NGUONG_TRUNG } from "../luat/trung-lap.mjs";
import { chuTuPt, ptSangMd } from "./pt-an-toan.mjs";

const BO = "bai_viet";

/** Mỗi bài cũ chỉ giữ chừng này đề xuất: quá nhiều thì không ai bấm, và bài cũ thành bãi link. */
export const TRAN_MOI_BAI_CU = 3;
/** Một bài mới chỉ nhờ chừng này bài cũ trỏ sang — đủ để Google thấy, chưa thành cụm link bất thường. */
export const TRAN_BAI_CU = 5;
/** Dưới ngưỡng giống này thì hai bài không cùng mảng nhu cầu → đừng nối. Cùng thước với chống trùng. */
export const NGUONG_LIEN_QUAN = NGUONG_TRUNG;

/** Đường dẫn công khai của một bài blog. */
export const duongBai = (slug) => `/blog/${String(slug ?? "").replace(/^\/+|\/+$/g, "")}/`;

/**
 * Bài cũ đã trỏ sang bài mới chưa. Soát trên THÂN THÔ (markdown hoặc HTML) vì link nằm ở đó;
 * so cả dạng có và không có "/" cuối, và cả URL tuyệt đối.
 */
export function daCoLink(thanTho, slugMoi) {
	const t = String(thanTho ?? "");
	const d = duongBai(slugMoi);
	if (!d || d === "/blog//") return false;
	const khongDuoi = d.replace(/\/$/, "");
	return t.includes(d) || new RegExp(`${khongDuoi.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w/-])`).test(t);
}

/**
 * Chữ neo nên dùng: cụm từ khoá của bài MỚI mà bài CŨ đã có sẵn trong chữ (khớp theo ranh giới
 * từ, bỏ dấu). Trả null khi không cụm nào có sẵn — lúc đó người biên tập phải viết thêm câu.
 */
export function chonNeo({ tuKhoa = [], tieuDe = "" }, chuCu) {
	const hay = ` ${chuanHoaManh(chuCu)} `;
	// Cụm DÀI trước: "huyệt tam âm giao" làm neo tốt hơn "huyệt".
	const ungVien = [...tuKhoa, tieuDe].map((x) => String(x ?? "").trim()).filter((x) => x.length >= 4);
	ungVien.sort((a, b) => b.length - a.length);
	for (const u of ungVien) {
		const k = chuanHoaManh(u);
		if (k && hay.includes(` ${k} `)) return u;
	}
	return null;
}

/**
 * Bài cũ nào nên chèn link ngược tới bài mới.
 *
 * @param {{slug: string, tieuDe: string, tuKhoa?: string[], cumId?: string|null}} moi
 * @param {{id: string, slug: string, tieuDe: string, tuKhoa?: string[], cumId?: string|null,
 *   chu?: string, than?: string}[]} cu  `chu` = chữ thuần để chọn neo; `than` = thân thô để dò link đã có
 * @returns {{id: string, slug: string, tieuDe: string, neo: string|null, canVietThem: boolean,
 *   lyDo: string, diem: number}[]}  xếp điểm giảm dần, tối đa TRAN_BAI_CU
 */
export function timBaiNenLinkNguoc(moi, cu = [], { tranBaiCu = TRAN_BAI_CU } = {}) {
	const slugMoi = String(moi?.slug ?? "").trim();
	if (!slugMoi) return [];
	const mauMoi = tapKhoa({ tieuDe: moi?.tieuDe ?? "", tuKhoa: moi?.tuKhoa ?? [] });
	const ra = [];
	for (const b of cu) {
		const slugCu = String(b?.slug ?? "").trim();
		if (!slugCu || slugCu === slugMoi) continue;
		// Bài cũ đã trỏ sang rồi thì im lặng — đề xuất lại là bảo người ta làm việc đã làm.
		if (daCoLink(b.than ?? b.chu ?? "", slugMoi)) continue;
		const cungCum = !!moi?.cumId && !!b?.cumId && String(moi.cumId) === String(b.cumId);
		const giong = doGiong(mauMoi, tapKhoa({ tieuDe: b?.tieuDe ?? "", tuKhoa: b?.tuKhoa ?? [] }));
		if (!cungCum && giong < NGUONG_LIEN_QUAN) continue;
		const neo = chonNeo({ tuKhoa: moi?.tuKhoa ?? [], tieuDe: moi?.tieuDe ?? "" }, b?.chu ?? "");
		// Điểm: cùng cụm là căn cứ mạnh nhất; có neo sẵn thì việc rẻ hơn nên ưu tiên.
		const diem = (cungCum ? 100 : 0) + Math.round(giong * 50) + (neo ? 10 : 0);
		ra.push({
			id: String(b.id ?? ""),
			slug: slugCu,
			tieuDe: String(b?.tieuDe ?? ""),
			neo,
			canVietThem: !neo,
			lyDo: cungCum
				? `Cùng cụm nội dung${neo ? ` và đã có sẵn cụm “${neo}” trong bài` : " (chưa có cụm nào của bài mới trong chữ — phải viết thêm một câu)"}`
				: `Từ khoá trùng ${Math.round(giong * 100)}%${neo ? ` và đã có sẵn cụm “${neo}”` : " (phải viết thêm một câu)"}`,
			diem,
		});
	}
	return ra.sort((a, b) => b.diem - a.diem || a.slug.localeCompare(b.slug)).slice(0, Math.max(1, tranBaiCu));
}

/**
 * Trộn đề xuất mới vào sổ của MỘT bài cũ, khử trùng theo slug bài mới, giữ bản mới nhất lên
 * trước và cắt theo TRAN_MOI_BAI_CU.
 *
 * @param {{ds?: object[]}|null} soCu
 * @param {{slug: string, tieuDe: string, neo: string|null, canVietThem: boolean, lyDo: string}} moi
 */
export function tronSo(soCu, moi, luc, { tran = TRAN_MOI_BAI_CU } = {}) {
	const cu = Array.isArray(soCu?.ds) ? soCu.ds : [];
	const giu = cu.filter((x) => String(x?.slug ?? "") !== String(moi.slug));
	return { capNhat: luc, ds: [{ ...moi, luc }, ...giu].slice(0, Math.max(1, tran)) };
}

// ── Phần có I/O ───────────────────────────────────────────────────────────────────────────

/** Trần trang khi liệt kê bài (như docMoiBaiBlog của viec.mjs) — chặn vòng lặp nếu cursor hỏng. */
const TRAN_TRANG = 200;

/**
 * Mọi bài ĐÃ ĐĂNG, kèm chữ thuần (chọn neo) và thân markdown (dò link đã có). Bài nháp không
 * tính: đề xuất chèn link vào một bài chưa ai đọc là việc vô ích.
 */
async function docBaiDaDang(content) {
	const ra = [];
	let cursor, trang = 0;
	do {
		const r = await content.list(BO, { limit: 100, cursor, where: { status: "published" } });
		for (const it of r.items ?? []) {
			const d = it.data ?? {};
			let chu = "";
			let than = "";
			try {
				chu = chuTuPt(d.noi_dung);
				than = ptSangMd(d.noi_dung);
			} catch {
				// Thân hỏng thì vẫn giữ bài: nó chỉ mất cơ hội được chọn làm neo, không làm gãy ca.
			}
			ra.push({
				id: String(it.id ?? ""),
				slug: String(d.slug ?? it.id ?? ""),
				tieuDe: String(d.title ?? ""),
				tuKhoa: Array.isArray(d.tu_khoa) ? d.tu_khoa.map(String) : [],
				chu,
				than,
			});
		}
		cursor = r.hasMore && r.cursor && ++trang < TRAN_TRANG ? r.cursor : undefined;
	} while (cursor);
	return ra;
}

/** Cụm của một bài, suy qua sổ nháp → kế hoạch. Bài người viết không có sổ nháp → null. */
async function cumCuaBai(s, id) {
	try {
		const nhap = await s.nhap.get(String(id));
		if (!nhap?.keHoachId) return null;
		const k = await s.ke_hoach.get(String(nhap.keHoachId));
		return k?.cumId ? String(k.cumId) : null;
	} catch {
		return null;
	}
}

/**
 * Dựng và GHI đề xuất chèn link ngược cho các bài cũ, sau khi một bài được Publish.
 * Không ném: bài đã lên rồi, một lỗi ở đây không được làm gì hỏng thêm.
 * @returns {Promise<{soBaiCu: number, daGhi: number}>}
 */
export async function dungGoiYNguoc(event, ctx) {
	const ra = { soBaiCu: 0, daGhi: 0 };
	try {
		if (event?.collection !== BO || !ctx) return ra;
		const c = event.content ?? {};
		const slug = typeof c.slug === "string" ? c.slug.trim() : "";
		if (!slug) return ra;
		// Bài đặt noindex thì đừng nhờ bài khác trỏ sang: chính mình đang bảo bot bỏ qua nó.
		if (c.seo?.noIndex === true) return ra;
		const s = ctx.storage;
		const cu = (await docBaiDaDang(ctx.content)).filter((b) => b.id !== String(c.id ?? ""));
		ra.soBaiCu = cu.length;
		const moi = {
			slug,
			tieuDe: String(c.title ?? ""),
			tuKhoa: Array.isArray(c.tu_khoa) ? c.tu_khoa.map(String) : [],
			cumId: await cumCuaBai(s, c.id),
		};
		if (moi.cumId) for (const b of cu) b.cumId = await cumCuaBai(s, b.id);
		const ds = timBaiNenLinkNguoc(moi, cu);
		const luc = new Date().toISOString();
		for (const g of ds) {
			if (!g.id) continue;
			const so = await s.goi_y_nguoc.get(g.id).catch(() => null);
			await s.goi_y_nguoc.put(
				g.id,
				tronSo(so, { slug: moi.slug, tieuDe: moi.tieuDe, neo: g.neo, canVietThem: g.canVietThem, lyDo: g.lyDo }, luc),
			);
			ra.daGhi++;
		}
		ctx.log?.info?.(`Rada SEO: mạng nhện ngược — ${ra.daGhi}/${ra.soBaiCu} bài cũ được gợi ý trỏ sang /blog/${slug}/`);
		return ra;
	} catch (e) {
		try {
			ctx?.log?.error?.("Rada SEO: dựng gợi ý link ngược hỏng (bài vẫn đã lên)", e);
		} catch {
			// bỏ qua
		}
		return ra;
	}
}

/**
 * Thả `dungGoiYNguoc` chạy NỀN, không await — cùng lối `thaIndexNow`/`thaCaNen`: liệt kê mọi
 * bài đã đăng có thể mất vài giây, quá hạn 5 s mà EmDash bọc quanh hook.
 */
export function thaMangNhen(event, ctx) {
	try {
		return dungGoiYNguoc(event, ctx);
	} catch (e) {
		try {
			ctx?.log?.error?.("Rada SEO: không thả được việc dựng link ngược", e);
		} catch {
			// bỏ qua
		}
		return null;
	}
}

/** Đề xuất đang chờ của MỘT bài (cho khung Phiếu Rada). Không ném. */
export async function docGoiYNguoc(s, id) {
	try {
		const so = await s.goi_y_nguoc.get(String(id));
		return Array.isArray(so?.ds) ? so.ds : [];
	} catch {
		return [];
	}
}
