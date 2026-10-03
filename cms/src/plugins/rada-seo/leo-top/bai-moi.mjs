// Khép vòng: bài do lò viết đăng ra thì SAU ĐÓ thế nào?
//
// Đây là chỗ nối tab Khoảng trống → Kế hoạch → Nháp → Leo top. Trước 02/10/2026 tab Leo top
// chỉ biết những từ khoá Search Console đưa tới, nên bài mình vừa đăng từ một khoảng trống
// biến mất khỏi màn hình cho tới khi nó tự lọt hạng 4–50 — tức là đúng lúc không ai theo dõi
// thì không có gì để xem, và lúc có số thì không còn biết bài ấy sinh ra từ cụm nào.
//
// ⚠️ ĐỪNG KẾT TỘI BÀI CÒN NON. Số của Search Console chậm 2–3 ngày, và một trang mới cần nhiều
// tuần mới ổn hạng. Vì vậy bài dưới TUOI_DU_KET_LUAN ngày luôn là hạng "moi" — KHÔNG phán xét,
// kể cả khi 0 hiển thị. Cùng lý lẽ với các phép dò khác của repo này: ở đây vu oan đắt hơn bỏ
// sót, vì "bài này thất bại" là câu khiến người ta đi sửa một bài vốn chưa có gì sai.

/** Dưới chừng này ngày thì chưa kết luận gì về một trang mới. */
export const TUOI_DU_KET_LUAN = 14;
const NGAY_MS = 86_400_000;

/** Hạng của bài, xếp theo mức CẦN LÀM GÌ — không phải theo hạng Google. */
export const HANG_BAI = {
	tam_leo: { nhan: "Đúng tầm leo top", mo: "Hạng 4–50: ca đêm sẽ nhận từ khoá của trang này.", mau: "#15803d" },
	chua_hien: { nhan: "Chưa có hiển thị", mo: "Quá 14 ngày mà Search Console chưa thấy lượt nào — kiểm index.", mau: "#b91c1c" },
	ngoai_50: { nhan: "Ngoài top 50", mo: "Đã có hiển thị nhưng còn xa: việc của nội dung, chưa phải việc leo top.", mau: "#92400e" },
	dau_bang: { nhan: "Đầu bảng", mo: "Hạng 1–3: không còn gì phải leo.", mau: "#1d4ed8" },
	moi: { nhan: "Còn non", mo: "Chưa đủ 14 ngày — chưa kết luận.", mau: "#6b7280" },
};
/** Thứ tự hiện trên màn: việc gấp nhất lên đầu (xem ghi chú UI ở admin.jsx). */
const THU_TU = ["tam_leo", "chua_hien", "ngoai_50", "moi", "dau_bang"];

export const duongBlog = (slug) => `/blog/${String(slug ?? "").replace(/^\/+|\/+$/gu, "")}/`;

/**
 * @param {{slug?: string, dangLuc?: string, tieuDeLamViec?: string, cum?: string, cumId?: string, contentId?: string}[]} keHoach
 *   kế hoạch đã đăng (trangThai da_dang).
 * @param {Map<string, {nhap:number,hienThi:number,viTri:number,ctr:number}>|null} theoTrang
 *   số liệu GSC theo trang; `null` = chưa cấu hình GSC → mọi bài về hạng "moi" (không có căn cứ).
 * @param {{now?: number, chuanHoa: (u: string) => string, goc?: string}} p
 */
export function xepBaiMoi(keHoach, theoTrang, { now = Date.now(), chuanHoa, goc = "https://kinhlac.online" } = {}) {
	const ds = [];
	for (const k of keHoach ?? []) {
		if (!k?.slug) continue;
		const duong = duongBlog(k.slug);
		const t = Date.parse(k.dangLuc ?? "");
		const tuoi = Number.isFinite(t) ? Math.floor((now - t) / NGAY_MS) : null;
		const so = theoTrang?.get(chuanHoa(`${goc}${duong}`)) ?? null;
		ds.push({
			keHoachId: k.id,
			slug: k.slug,
			duong,
			tieuDe: k.tieuDeLamViec ?? k.slug,
			cum: k.cum ?? "",
			cumId: k.cumId ?? "",
			contentId: k.contentId ?? "",
			dangLuc: k.dangLuc ?? "",
			tuoi,
			so,
			hang: xepHang({ tuoi, so, coGsc: !!theoTrang }),
		});
	}
	// Trong cùng hạng: bài nhiều hiển thị trước (số to hơn thì đáng nhìn trước), rồi bài mới hơn.
	return ds.sort(
		(a, b) =>
			THU_TU.indexOf(a.hang) - THU_TU.indexOf(b.hang) ||
			(b.so?.hienThi ?? 0) - (a.so?.hienThi ?? 0) ||
			String(b.dangLuc).localeCompare(String(a.dangLuc)),
	);
}

function xepHang({ tuoi, so, coGsc }) {
	// Chưa có GSC, hoặc chưa đủ tuổi, hoặc không biết tuổi → không phán xét.
	if (!coGsc || tuoi == null || tuoi < TUOI_DU_KET_LUAN) return "moi";
	if (!so || !so.hienThi) return "chua_hien";
	if (so.viTri <= 3) return "dau_bang";
	if (so.viTri <= 50) return "tam_leo";
	return "ngoai_50";
}

/** Đếm theo hạng, giữ thứ tự THU_TU — để dải số trên màn luôn cùng một thứ tự. */
export function demTheoHang(ds) {
	const d = {};
	for (const k of THU_TU) d[k] = 0;
	for (const x of ds ?? []) d[x.hang] = (d[x.hang] ?? 0) + 1;
	return d;
}

/**
 * Phiên leo top ↔ bài của lò viết: trang nào là bài mình viết từ một cụm thì gắn tên cụm vào,
 * để người xem phiên biết nó sinh ra từ khoảng trống nào mà không phải tự đi tra.
 * @returns {Map<string, {cum: string, cumId: string, keHoachId: string}>} khoá là trang đã chuẩn hoá
 */
export function banDoTrangCum(keHoach, { chuanHoa, goc = "https://kinhlac.online" } = {}) {
	const m = new Map();
	for (const k of keHoach ?? []) {
		if (!k?.slug) continue;
		m.set(chuanHoa(`${goc}${duongBlog(k.slug)}`), { cum: k.cum ?? "", cumId: k.cumId ?? "", keHoachId: k.id });
	}
	return m;
}
