// Chỉ mục nội bộ (thuần): tên các trang CÓ THẬT của kinhlac.online — từ điển + blog — để
// Claude gắn liên kết nội bộ bằng đường đã biết chứ không đoán slug.
//
// Hai sự thật đã ĐO (30/09/2026) quyết định hình dạng của nó:
// - `slug_goc` KHÔNG đáng tin cho huyệt: "Âm Khích" (HT6, slug am-khich) và "Ẩm Khích" (HE6,
//   slug am-khich-2) cùng slug_goc = am-khich. Nên mỗi mục mang DANH SÁCH đường ứng viên
//   (slug trước, slug_goc sau), và khoá so khớp ở đây là khoá BỎ DẤU — hai huyệt đó cùng khoá
//   thì trả CẢ HAI; bộ kiểm đường (kiem-duong.mjs) mới so tên CÓ DẤU trên trang thật để chọn.
// - Kinh chỉ sống ở slug NGẮN (/kinh/phe/); đường theo slug_goc dài trả 404.
import { chuanHoaManh } from "../luat/chuan-hoa.mjs";

/** Bộ CMS → loại, tiền tố đường công khai, cách lấy slug (dược liệu: cột slug = id số). */
export const MUC_BO = {
	huyet_vi: { loai: "huyet", tienTo: "/huyet/", laySlug: (m) => String(m.slug ?? "") },
	kinh_mach: { loai: "kinh", tienTo: "/kinh/", laySlug: (m) => String(m.slug ?? "") },
	benh_hoc: { loai: "benh_hoc", tienTo: "/benh-hoc/", laySlug: (m) => String(m.slug ?? "") },
	cham_cuu_tri_benh: { loai: "cham_cuu", tienTo: "/cham-cuu-tri-benh/", laySlug: (m) => String(m.slug ?? "") },
	duoc_lieu: { loai: "duoc_lieu", tienTo: "/duoc-lieu/", laySlug: (m) => String(m.slug ?? m.id ?? "") },
	nguon_y_van: { loai: "nguon", tienTo: "/nguon/", laySlug: (m) => String(m.slug ?? "") },
	// Blog do Astro phục vụ ở /blog/<slug>, KHÔNG có "/" cuối.
	bai_viet: { loai: "bai_viet", tienTo: "/blog/", laySlug: (m) => String(m.slug ?? "") },
};

/** Cùng hạng khớp thì loại nào đứng trước: trang từ điển cốt lõi trước, blog sau cùng. */
const THU_TU_LOAI = ["kinh", "huyet", "benh_hoc", "cham_cuu", "duoc_lieu", "nguon", "bai_viet"];
const HANG_KHOP = { dung: 0, ten_khac: 1, chua: 2 };

/** Tiền tố người viết hay đặt trước tên riêng: "huyệt Tam Âm Giao", "kinh Tỳ", "bài thuốc …". */
const TIEN_TO = /^(bai thuoc|vi thuoc|huyet|kinh|mach|benh|cay|sach) /;

/** chuanHoaManh + bỏ MỘT tiền tố ở đầu. */
export function khoaSo(s) {
	return chuanHoaManh(s).replace(TIEN_TO, "");
}

/** Đường ứng viên theo thứ tự thử: slug trước, slug_goc sau (nếu khác); kinh chỉ slug. */
export function duongUngVien(bo, muc) {
	const cfg = MUC_BO[bo];
	if (!cfg) return [];
	const cuoi = bo === "bai_viet" ? "" : "/";
	const slugs = [cfg.laySlug(muc)];
	if (bo !== "kinh_mach" && muc.slug_goc && muc.slug_goc !== slugs[0]) slugs.push(String(muc.slug_goc));
	return slugs.filter(Boolean).map((sl) => `${cfg.tienTo}${sl}${cuoi}`);
}

/** Tên khác: tách theo , ; . — bỏ phần trong ngoặc (tên sách dẫn), bỏ mục < 3 ký tự. */
function tachTenKhac(s) {
	return String(s ?? "")
		.replace(/\([^)]*\)?/g, " ")
		.split(/[,;.]/)
		.map((x) => khoaSo(x))
		.filter((x) => x.length >= 3);
}

/** Tên bệnh đối chiếu ("Insomnia – Insomie"): tách theo gạch nối có cách, , ; */
function tachDoiChieu(s) {
	return String(s ?? "")
		.split(/\s[–—-]\s|[,;]/)
		.map((x) => khoaSo(x))
		.filter((x) => x.length >= 3);
}

const DOI_KINH = /^(thai am|thai duong|thieu am|thieu duong|duong minh|quyet am) /;

/**
 * Khoá phụ của kinh: người viết gọi "kinh Tỳ", "kinh Tâm Bào", "Thái Âm Tỳ" chứ ít ai viết đủ
 * "Kinh Túc Thái Âm Tỳ". Nên thêm slug ngắn ("tam bao"), tên bỏ "thủ/túc" ("thai am ty") và
 * tên tạng phủ trần ("ty").
 */
function khoaKinh(muc) {
	const ra = [];
	if (muc.slug) ra.push(chuanHoaManh(String(muc.slug).replace(/-/g, " ")));
	const boThuTuc = khoaSo(muc.title).replace(/^(thu|tuc) /, "");
	ra.push(boThuTuc, boThuTuc.replace(DOI_KINH, ""));
	return ra;
}

/**
 * @param {{bo: string, title: string, slug: string, slug_goc?: string, ten_khac?: string,
 *          ma_huyet?: string, ma?: string, doi_chieu_benh_danh?: string}[]} dsMuc
 * @returns {{muc: {ten: string, loai: string, duong: string[], khoaTen: string, khoaKhac: string[]}[]}}
 */
export function dungChiMuc(dsMuc) {
	const muc = [];
	for (const m of dsMuc) {
		const cfg = MUC_BO[m.bo];
		if (!cfg || !m.title) continue;
		const duong = duongUngVien(m.bo, m);
		if (!duong.length) continue;
		const khoaTen = khoaSo(m.title);
		if (!khoaTen) continue;
		const khac = new Set([...tachTenKhac(m.ten_khac), ...tachDoiChieu(m.doi_chieu_benh_danh)]);
		// Mã huyệt/mã kinh ngắn ("LU") nên KHÔNG qua ngưỡng 3 ký tự của tên khác.
		for (const ma of [m.ma_huyet, m.ma]) if (ma) khac.add(chuanHoaManh(ma));
		if (m.bo === "kinh_mach") for (const k of khoaKinh(m)) khac.add(k);
		khac.delete(khoaTen);
		khac.delete("");
		muc.push({ ten: m.title, loai: cfg.loai, duong, khoaTen, khoaKhac: [...khac] });
	}
	return { muc };
}

/** `kim` (≥ 2 từ) nằm trọn theo ranh giới từ trong `hay`. */
function chuaTron(hay, kim) {
	return kim.includes(" ") && ` ${hay} `.includes(` ${kim} `);
}

/**
 * Tìm các mục khớp một cụm từ. Hạng: dung (khoá tên = khoá cụm) > ten_khac (khoá cụm = một
 * khoá khác) > chua (khoá tên ≥ 2 từ nằm trọn trong khoá cụm, hoặc ngược lại). "chua" đòi ≥ 2
 * từ vì tên một từ ("Tâm", "Tỳ") có mặt trong gần như mọi câu Đông y.
 * @returns {{ten: string, loai: string, duong: string[], khop: "dung"|"ten_khac"|"chua"}[]}
 */
export function timTrongChiMuc(chiMuc, cumTu, { toiDa = 5 } = {}) {
	const q = khoaSo(cumTu);
	if (!q) return [];
	const ra = [];
	for (const m of chiMuc.muc) {
		let khop = null;
		if (m.khoaTen === q) khop = "dung";
		else if (m.khoaKhac.includes(q)) khop = "ten_khac";
		else if (chuaTron(q, m.khoaTen) || chuaTron(m.khoaTen, q)) khop = "chua";
		if (khop) ra.push({ ten: m.ten, loai: m.loai, duong: m.duong, khop });
	}
	ra.sort(
		(a, b) =>
			HANG_KHOP[a.khop] - HANG_KHOP[b.khop] ||
			THU_TU_LOAI.indexOf(a.loai) - THU_TU_LOAI.indexOf(b.loai) ||
			a.ten.length - b.ten.length,
	);
	return ra.slice(0, toiDa);
}
