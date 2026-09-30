// Nạp chỉ mục nội bộ từ CMS (ctx.content) và tra bài thuốc/vị thuốc qua API công khai của app.
//
// Vì sao bài thuốc KHÔNG nằm trong chỉ mục: 13.942 bài thuốc sống ở DB app (`phuong_thang`),
// không phải bộ CMS nào Claude đọc được qua ctx.content — và nạp cả 13.942 tên vào bộ nhớ CMS
// chỉ để tra vài cụm mỗi đêm là phí. API `POST /api/tra-cuu/ten` (công khai, ≤ 200 tên/lượt,
// tên ≥ 4 ký tự) đã có sẵn cho chính việc này ở trang từ điển.
import { MUC_BO, dungChiMuc } from "./chi-muc.mjs";

/** Trần trang mỗi bộ (100 mục/trang): nguồn 2.139 mục = 22 trang; chặn vòng lặp khi cursor hỏng. */
const TRAN_TRANG_MOI_BO = 200;

/**
 * Đọc mọi mục ĐÃ XUẤT BẢN của các bộ trong MUC_BO rồi dựng chỉ mục. `where.status` là bắt buộc:
 * đã đo — không truyền thì content.list trả cả nháp, và link tới bản nháp là link 404.
 * Bộ nào lỗi (vd bàn thử không có bộ đó) thì bỏ qua, ghi vào `loiNap` — không ném.
 * thongKe: thời gian dựng và số mục đọc được mỗi bộ — để thấy một chỉ mục rỗng/què từ phản hồi.
 * @returns {Promise<{muc: object[], loiNap: {bo: string, loi: string}[], dungLuc: number,
 *   thongKe: {msDung: number, soMuc: Record<string, number>}}>}
 */
export async function napMucNoiBo(content, { now = Date.now } = {}) {
	const batDau = now();
	const ds = [], loiNap = [], soMuc = {};
	for (const bo of Object.keys(MUC_BO)) {
		try {
			soMuc[bo] = 0; // bộ đọc được mà rỗng vẫn hiện 0; bộ lỗi ngay trang đầu thì vắng
			let cursor, soTrang = 0;
			do {
				const r = await content.list(bo, { limit: 100, cursor, where: { status: "published" } });
				for (const it of r.items ?? []) {
					soMuc[bo]++;
					const d = it.data ?? {};
					ds.push({
						bo,
						title: d.title,
						slug: it.slug ?? d.slug,
						slug_goc: d.slug_goc,
						ten_khac: d.ten_khac,
						ma_huyet: d.ma_huyet,
						ma: d.ma,
						doi_chieu_benh_danh: d.doi_chieu_benh_danh,
					});
				}
				cursor = r.hasMore && r.cursor && ++soTrang < TRAN_TRANG_MOI_BO ? r.cursor : undefined;
			} while (cursor);
		} catch (e) {
			if (!soMuc[bo]) delete soMuc[bo];
			loiNap.push({ bo, loi: String(e?.message ?? e).slice(0, 200) });
		}
	}
	const dungLuc = now();
	return { ...dungChiMuc(ds), loiNap, dungLuc, thongKe: { msDung: dungLuc - batDau, soMuc } };
}

/**
 * Chỉ mục nhớ trong tiến trình (một container CMS — cùng giả định với khoá ca và bộ đếm
 * KV). Nội dung từ điển đổi chậm nên 24 giờ là đủ; lần nạp có bộ lỗi chỉ giữ 10 phút để một
 * lần chập kho không để lại chỉ mục què cả ngày.
 */
let dem = null; // { chiMuc, het }
let dang = null; // promise đang dựng — lời gọi đồng thời chờ chung
const GIU_KHI_LOI_MS = 10 * 60 * 1000;

export async function layChiMuc(content, { ttlMs = 24 * 3600 * 1000, now = Date.now } = {}) {
	if (dem && now() < dem.het) return dem.chiMuc;
	if (!dang)
		dang = napMucNoiBo(content, { now })
			.then((chiMuc) => {
				dem = { chiMuc, het: now() + (chiMuc.loiNap.length ? Math.min(ttlMs, GIU_KHI_LOI_MS) : ttlMs) };
				return chiMuc;
			})
			.finally(() => {
				dang = null;
			});
	return dang;
}

/** Cho phép kiểm: bỏ chỉ mục đã nhớ. */
export function xoaDemChiMuc() {
	dem = null;
	dang = null;
}

const TRAN_TEN_MOI_LUOT = 200;
const DO_DAI_TOI_THIEU = 4;

/** Mục của API → đường công khai. */
function duongTuMuc(x) {
	if (x?.loai === "bai_thuoc" && x.slug) return { ten: x.ten, loai: "bai_thuoc", duong: `/bai-thuoc/${x.slug}/` };
	if (x?.loai === "vi_thuoc" && x.id != null) return { ten: x.ten, loai: "duoc_lieu", duong: `/duoc-lieu/${x.id}/` };
	if (x?.loai === "nguon" && x.slug) return { ten: x.ten, loai: "nguon", duong: `/nguon/${x.slug}/` };
	return null;
}

/**
 * Tra tên qua `POST ${goc}/api/tra-cuu/ten`. Không bao giờ ném: lượt nào hỏng thì bỏ lượt đó
 * (Claude chỉ mất gợi ý liên kết, không mất cả đêm).
 * @returns {Promise<Record<string, {ten: string, loai: "bai_thuoc"|"duoc_lieu"|"nguon", duong: string}[]>>}
 */
export async function traBaiThuoc(fetchFn, ten, { goc = process.env.RADA_SEO_SITE ?? "https://kinhlac.online" } = {}) {
	const hop = [...new Set(ten.map((t) => String(t ?? "").trim()).filter((t) => t.length >= DO_DAI_TOI_THIEU))];
	const ra = {};
	for (let i = 0; i < hop.length; i += TRAN_TEN_MOI_LUOT) {
		try {
			const res = await fetchFn(`${goc}/api/tra-cuu/ten`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json" },
				body: JSON.stringify({ ten: hop.slice(i, i + TRAN_TEN_MOI_LUOT) }),
			});
			if (!res.ok) continue;
			const json = await res.json();
			for (const [k, v] of Object.entries(json ?? {})) {
				const ds = (Array.isArray(v) ? v : [v]).map(duongTuMuc).filter(Boolean);
				if (ds.length) ra[k] = ds;
			}
		} catch {
			// lỗi mạng / thân hỏng: bỏ lượt này
		}
	}
	return ra;
}
