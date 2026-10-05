/**
 * HÀNG ĐỢI VIỆC — gom bốn nguồn thành một danh sách "giờ tôi làm gì".
 *
 * Màn Rada SEO trước 06/10/2026 mở ra là bảy ngăn DỮ LIỆU, trong khi câu người dùng cần trả lời
 * trong 5 giây đầu là "giờ tôi làm gì" (họ chốt điều đó 06/10/2026). Module này giữ phần CHỊU
 * LỰC của màn Việc — gom việc, gắn lý do, xếp thứ tự — tách khỏi `admin.jsx` vì JSX không có hạ
 * tầng test ở repo này.
 *
 * ⚠️ Xếp theo "CHẶN trước, RẺ sau", KHÁC "rẻ trước" thuần của `leo-top/so-ho-ai.mjs`. Lý do cụ
 * thể: một hướng không nhận là bot đứng im cả tuần (`ghiCum` chỉ nhận cụm thuộc hướng `da_nhan`)
 * dù việc chỉ mất 10 giây; một dòng FAQ không thêm thì chỉ mất vài lượt nhấp. Trong CÙNG một bậc
 * thì nhiều lượt hiển thị trước.
 */

/**
 * Bậc càng nhỏ càng lên trước. `viSao` là câu hiện DƯỚI mỗi dòng việc — đó là chỗ chữa "không
 * hiểu nó đang làm gì": lời giải thích đi kèm TỪNG việc, không nằm trong tài liệu không ai đọc.
 * `hanhDong` là MÃ; UI tra bảng để dựng nút, module này không biết gì về nút.
 */
export const LOAI_VIEC = {
	nhan_huong: {
		bac: 1,
		nhan: "Nhận hướng",
		hanhDong: ["nhan", "bo"],
		viSao: "Bot đang đứng chờ — chưa nhận hướng thì khâu phân cụm, lập bài và lò viết nằm im cả tuần.",
	},
	duyet_nhap: {
		bac: 2,
		nhan: "Duyệt nháp",
		hanhDong: ["mo_nhap"],
		viSao: "Model đã viết xong và đã tốn tiền gọi API. Chưa duyệt thì khoản đó nằm im, không ai đọc được bài.",
	},
	duyet_ke_hoach: {
		bac: 3,
		nhan: "Duyệt bài dự kiến",
		hanhDong: ["duyet", "bo"],
		viSao: "Duyệt rồi thì ca lò viết 03:30 mới viết bài này; chưa duyệt thì nó không vào hàng.",
	},
	them_faq: {
		bac: 4,
		nhan: "Thêm 1 dòng FAQ",
		hanhDong: ["xem_phieu", "da_sua"],
		viSao: "Thân bài ĐÃ trả lời câu này, chỉ thiếu một dòng FAQ bằng đúng chữ người ta gõ. Việc hai phút.",
	},
	them_tieu_de: {
		bac: 5,
		nhan: "Thêm tiêu đề mục",
		hanhDong: ["xem_phieu", "da_sua"],
		viSao: "Mọi từ của truy vấn đều có trong bài, chỉ khác diễn đạt nên máy không nhặt ra được.",
	},
	lam_phieu_leo_top: {
		bac: 6,
		nhan: "Làm theo phiếu leo top",
		hanhDong: ["xem_phieu", "da_sua"],
		viSao: "Ca soi SERP đã dựng phiếu sơ hở cho trang này — sửa rồi bấm Đã sửa để chụp mốc hạng mà so sau.",
	},
	mang_nhen_co_neo: {
		bac: 7,
		nhan: "Chèn link sang bài này (có neo sẵn)",
		hanhDong: ["mo_bai_cu"],
		viSao: "Một bài cũ đã có sẵn cụm để bọc thành link trỏ sang bài này — chỉ cần bọc, không phải viết thêm.",
	},
	mang_nhen_can_viet: {
		bac: 8,
		nhan: "Chèn link sang bài này (phải viết thêm câu)",
		hanhDong: ["mo_bai_cu"],
		viSao: "Bài cũ không có cụm nào khớp để bọc, nên phải viết thêm một câu rồi mới chèn được link sang bài này. Việc đắt hơn.",
	},
	thieu_noi_dung: {
		bac: 9,
		nhan: "Viết thêm nội dung",
		hanhDong: ["xem_phieu"],
		viSao: "Trang thật sự không trả lời câu này — đây mới là việc viết, nên nó xếp cuối hàng đợi.",
	},
	do_so_ho: {
		bac: 10,
		nhan: "Dò sơ hở AI",
		hanhDong: ["do"],
		viSao: "Chưa dò lần nào trong 30 phút qua, nên chưa biết trang nào đang thiếu một dòng FAQ. Dò tải thật 15 trang, mất khoảng 30 giây.",
	},
};

/** Hướng/bài/phiếu ở trạng thái nào thì CÒN CHỜ NGƯỜI. */
const HUONG_CHO = "de_xuat";
const KE_HOACH_CHO_DUYET = new Set(["de_xuat"]);
// can_xem: lò viết bỏ cuộc (nộp hết lượt đều trượt / giữ chỗ hết hạn lần 2) — phải có người quyết.
const KE_HOACH_CHO_XEM = new Set(["co_nhap", "can_xem"]);
const LEO_TOP_CHO = "co_phieu";

const mang = (x) => (Array.isArray(x) ? x : []);

/** Một dòng việc: trộn luật của LOAI_VIEC với dữ liệu của bản ghi. */
const dong = (loai, { id, ten, duong, hienThi = 0, meta }) => ({
	loai,
	// Khoá DUY NHẤT trong hàng đợi. `id` một mình không đủ: nó là id của bản ghi nguồn, và hai
	// loại việc khác nhau có thể trỏ cùng một bản ghi — xoá theo `id` là có thể xoá nhầm dòng.
	khoa: `${loai}|${id}`,
	bac: LOAI_VIEC[loai].bac,
	nhan: LOAI_VIEC[loai].nhan,
	viSao: LOAI_VIEC[loai].viSao,
	hanhDong: LOAI_VIEC[loai].hanhDong,
	id,
	ten,
	duong,
	hienThi,
	meta,
});

/**
 * Việc từ đệm phiếu sửa nhỏ. ⚠️ ĐỌC ĐỆM, không tự tải trang: route `leo-top-sua-nho` tải THẬT
 * 15 trang và nghỉ 150 ms mỗi lượt, nên gọi nó trong đường mở màn là phá đúng phần vừa cắt được
 * 19 lượt đi-về xuống 4.
 */
function viecSuaNho(suaNho) {
	// `null`/`undefined` = CHƯA HỎI → một dòng khởi động. `{ kq: null }` = đã hỏi mà kết quả sai
	// dạng → không có việc, nhưng cũng không dặn dò lại (sẽ là dặn sai).
	if (suaNho === null || suaNho === undefined) return [dong("do_so_ho", { id: "do-so-ho" })];
	const ds = [];
	for (const t of mang(suaNho?.kq?.ds)) {
		for (const d of mang(t.dong)) {
			if (!LOAI_VIEC[d.viec]) continue; // `da_du` và mã lạ đều bỏ
			ds.push(dong(d.viec, { id: `${t.trang}|${d.tuKhoa}`, ten: d.tuKhoa, duong: t.trang, hienThi: d.hienThi ?? 0, meta: { trang: t.trang } }));
		}
	}
	return ds;
}

/**
 * Gom và xếp hàng đợi việc.
 *
 * @param {{huong?: object[], keHoach?: object[], leoTop?: object[],
 *   goiYNguoc?: {id: string, data?: {ds?: object[]}}[], suaNho?: object|null, loiKho?: string}} vao
 * @returns {{viec: object[], tong: number, cauRong: string, theoLoai: Record<string, number>}}
 */
export function xepHangDoi(vao) {
	const v = vao ?? {};
	const ds = [];

	for (const h of mang(v.huong)) if (h?.trangThai === HUONG_CHO) ds.push(dong("nhan_huong", { id: h.id, ten: h.ten, hienThi: h.diem ?? 0 }));

	for (const k of mang(v.keHoach)) {
		if (KE_HOACH_CHO_XEM.has(k?.trangThai)) ds.push(dong("duyet_nhap", { id: k.id, ten: k.tieuDeLamViec, meta: { trangThai: k.trangThai } }));
		else if (KE_HOACH_CHO_DUYET.has(k?.trangThai)) ds.push(dong("duyet_ke_hoach", { id: k.id, ten: k.tieuDeLamViec, meta: { cumId: k.cumId } }));
	}

	for (const p of mang(v.leoTop))
		if (p?.trangThai === LEO_TOP_CHO) ds.push(dong("lam_phieu_leo_top", { id: p.id, ten: p.tuKhoa ?? p.trangMinh, duong: p.trangMinh, meta: { viTriBanDau: p.viTriBanDau } }));

	// ⚠️ Sổ `goi_y_nguoc` khoá theo contentId bài CŨ, và mỗi mục trong `ds` là bài MỚI:
	// { slug, tieuDe, neo, canVietThem, lyDo } — đo cấu trúc thật 06/10/2026. Tên bài CŨ KHÔNG
	// nằm trong sổ (phải tra sang CMS), nên dòng việc nói tên bài MỚI và việc là "chèn link TỪ
	// một bài cũ SANG bài này". Bịa một cái tên cho bài cũ là nói dối người đọc.
	for (const c of mang(v.goiYNguoc))
		for (const g of mang(c?.data?.ds))
			ds.push(
				dong(g?.canVietThem ? "mang_nhen_can_viet" : "mang_nhen_co_neo", {
					id: `${c.id}|${g?.slug ?? ""}`,
					ten: g?.tieuDe || "(chưa tra ra tên bài mới)",
					meta: { contentIdCu: c.id, slugMoi: g?.slug, neo: g?.neo ?? null, lyDo: g?.lyDo ?? "" },
				}),
			);

	ds.push(...viecSuaNho(v.suaNho));

	// Bậc quyết định thứ tự; trong cùng bậc thì nhiều lượt hiển thị trước. `hienThi` KHÔNG được
	// kéo việc đắt lên đầu — một phiếu "viết lại bài" với 900 lượt hiển thị vẫn là việc người ta
	// để đó, còn "thêm một dòng FAQ" với 5 lượt thì làm trong hai phút.
	ds.sort((a, b) => a.bac - b.bac || (b.hienThi ?? 0) - (a.hienThi ?? 0));

	const theoLoai = {};
	for (const x of ds) theoLoai[x.loai] = (theoLoai[x.loai] ?? 0) + 1;
	return { viec: ds, tong: ds.length, cauRong: ds.length ? "" : cauRong(v), theoLoai, demTab: demTheoTab(ds) };
}

/**
 * Loại việc → tab nào chịu trách nhiệm. Dùng cho huy hiệu trên thanh quy trình, nên nó bỏ được
 * route `viec-dem` — route đó đọc lại đúng dsKeHoach + dsLeoTop + goi_y_nguoc mà hàng đợi đã đọc.
 *
 * `do_so_ho` KHÔNG có tab: nó là lời mời đi dò, không phải việc đang chờ. Đếm nó vào huy hiệu là
 * báo "có việc" trong khi chưa biết có việc hay không.
 */
const TAB_CUA_LOAI = {
	nhan_huong: "huong",
	duyet_ke_hoach: "ke-hoach",
	duyet_nhap: "nhap",
	them_faq: "leo-top",
	them_tieu_de: "leo-top",
	lam_phieu_leo_top: "leo-top",
	thieu_noi_dung: "leo-top",
	mang_nhen_co_neo: "mang-nhen",
	mang_nhen_can_viet: "mang-nhen",
};

/** Đếm việc theo tab. Tab không có việc thì KHÔNG có khoá — huy hiệu "0" khắp nơi làm mắt thôi nhìn vào huy hiệu. */
function demTheoTab(ds) {
	const d = {};
	for (const x of ds) {
		const t = TAB_CUA_LOAI[x.loai];
		if (t) d[t] = (d[t] ?? 0) + 1;
	}
	return d;
}

/**
 * ⚠️ Hàng đợi rỗng phải nói VÌ SAO rỗng. Ba trạng thái khác hẳn nhau và rỗng trơn thì cả ba đọc
 * ra như "không có việc" — cùng bài học `cauKhoangTrong()` và tab Mạng nhện (rỗng vì chưa ai dò,
 * mà đọc ra như "chưa có việc").
 */
function cauRong(v) {
	if (v.loiKho) return `Không đọc được kho việc: ${v.loiKho}. Đây KHÔNG phải "hết việc" — chưa hỏi được thì chưa biết có việc hay không.`;
	if (v.suaNho === null || v.suaNho === undefined)
		return "Chưa dò sơ hở AI lần nào, nên phần việc rẻ nhất (thêm một dòng FAQ) chưa được tính. Bấm Dò sơ hở để biết.";
	return "Không có việc nào chờ bạn. Ca đêm vẫn chạy: 02:30 quét đối thủ, 03:30 lò viết, 04:00 tự sửa lỗi hình thức.";
}
