// Chỉ mục nội bộ (thuần): tên các trang CÓ THẬT của kinhlac.online — từ điển + blog — để
// Claude gắn liên kết nội bộ bằng đường đã biết chứ không đoán slug.
//
// Sự thật đã ĐO (30/09/2026) quyết định hình dạng của nó:
// - `slug_goc` KHÔNG đáng tin cho huyệt: "Âm Khích" (HT6, slug am-khich) và "Ẩm Khích" (HE6,
//   slug am-khich-2) cùng slug_goc = am-khich. Nên mỗi mục mang DANH SÁCH đường ứng viên
//   (slug trước, slug_goc sau); bộ kiểm đường (kiem-duong.mjs) so tên CÓ DẤU trên trang thật.
// - Kinh chỉ sống ở slug NGẮN (/kinh/phe/); đường theo slug_goc dài trả 404.
// - Blog sống ở /blog/<slug>/ — bản không "/" cuối bị 301.
//
// Luật khớp (vòng sửa 1, sau khi đo ra link SAI thật): chữ Việt khác dấu là khác nghĩa —
// "ẩm khích" ≠ "Âm Khích", "Mạch Môn" (vị thuốc) ≠ "Huyết Môn", "tâm lý" ≠ "Tam Lý". Nên:
// - Tiền tố ("huyệt", "kinh", "mạch"…) chỉ bỏ ở CỤM người viết, KHÔNG BAO GIỜ bỏ ở tên mục
//   (bỏ ở cả hai thì "Mạch Môn" và "Huyết Môn" cùng còn "môn").
// - Mỗi khoá có hai bản: bỏ dấu và CÓ DẤU. Cụm có dấu chỉ nhận khớp có dấu; khớp chỉ-bỏ-dấu
//   chỉ được dùng khi cụm KHÔNG có dấu nào ("tam am giao", "SP6").
import { chuanHoaManh, boDau } from "../luat/chuan-hoa.mjs";

/** Bộ CMS → loại, tiền tố đường công khai, cách lấy slug (dược liệu: cột slug = id số). */
export const MUC_BO = {
	huyet_vi: { loai: "huyet", tienTo: "/huyet/", laySlug: (m) => String(m.slug ?? "") },
	kinh_mach: { loai: "kinh", tienTo: "/kinh/", laySlug: (m) => String(m.slug ?? "") },
	benh_hoc: { loai: "benh_hoc", tienTo: "/benh-hoc/", laySlug: (m) => String(m.slug ?? "") },
	cham_cuu_tri_benh: { loai: "cham_cuu", tienTo: "/cham-cuu-tri-benh/", laySlug: (m) => String(m.slug ?? "") },
	duoc_lieu: { loai: "duoc_lieu", tienTo: "/duoc-lieu/", laySlug: (m) => String(m.slug ?? m.id ?? "") },
	nguon_y_van: { loai: "nguon", tienTo: "/nguon/", laySlug: (m) => String(m.slug ?? "") },
	// Blog: /blog/<slug>/ (canonical có "/"; /blog/<slug> trả 301 — đo 30/09/2026).
	bai_viet: { loai: "bai_viet", tienTo: "/blog/", laySlug: (m) => String(m.slug ?? "") },
};

/** Cùng hạng khớp thì loại nào đứng trước: trang từ điển cốt lõi trước, blog sau cùng. */
const THU_TU_LOAI = ["kinh", "huyet", "benh_hoc", "cham_cuu", "duoc_lieu", "nguon", "bai_viet"];
const HANG_KHOP = { dung: 0, ten_khac: 1, chua: 2, mot_phan: 3 };
/** Cụm nằm trọn trong tên dài hơn ("thần kinh" → 5 bệnh): giữ nhưng chỉ vài mục. */
const TRAN_MOT_PHAN = 2;

/** Tiền tố người viết hay đặt trước tên riêng: "huyệt Tam Âm Giao", "kinh Tỳ", "bài thuốc …". */
const TIEN_TO = /^(bai thuoc|vi thuoc|huyet|kinh|mach|benh|cay|sach) /;

/** Khoá CÓ DẤU: NFC, chữ thường, mọi thứ không phải chữ/số → một khoảng trắng. */
export function khoaCoDau(s) {
	return String(s ?? "")
		.normalize("NFC")
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.trim();
}

/** Chuỗi có dấu thanh/dấu mũ/đ của chữ Việt không. */
export function coDauViet(s) {
	return /[\u0300-\u036f]|đ/i.test(String(s ?? "").normalize("NFD"));
}

/**
 * Các biến thể của CỤM để tra: cụm gốc (đã trim) và — nếu mở đầu bằng tiền tố — bản bỏ MỘT
 * tiền tố, giữ nguyên chữ hoa và dấu ("bài thuốc Quy Tỳ Thang" → "Quy Tỳ Thang").
 */
export function bienThe(cumTu) {
	const goc = String(cumTu ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
	if (!goc) return [];
	const tu = goc.split(" ");
	const m = chuanHoaManh(goc).match(TIEN_TO);
	if (!m) return [goc];
	const soTu = m[1].split(" ").length;
	// Tiền tố phải là đúng các TỪ đầu (không phải "huyệt:" dính dấu câu lạ làm lệch đếm từ).
	if (chuanHoaManh(tu.slice(0, soTu).join(" ")) !== m[1]) return [goc];
	const bo = tu.slice(soTu).join(" ");
	return bo ? [goc, bo] : [goc];
}

/** chuanHoaManh + bỏ MỘT tiền tố ở đầu. Chỉ dùng cho CỤM, không dùng cho tên mục. */
export function khoaSo(s) {
	return chuanHoaManh(s).replace(TIEN_TO, "");
}

/** Đường ứng viên theo thứ tự thử: slug trước, slug_goc sau (nếu khác); kinh chỉ slug. */
export function duongUngVien(bo, muc) {
	const cfg = MUC_BO[bo];
	if (!cfg) return [];
	const slugs = [cfg.laySlug(muc)];
	if (bo !== "kinh_mach" && muc.slug_goc && muc.slug_goc !== slugs[0]) slugs.push(String(muc.slug_goc));
	return slugs.filter(Boolean).map((sl) => `${cfg.tienTo}${sl}/`);
}

/** Một khoá tên khác: bản bỏ dấu `k` và bản có dấu `d` (null nếu chỉ có bản bỏ dấu, vd slug). */
const cap = (x) => ({ k: chuanHoaManh(x), d: khoaCoDau(x) });

/** Tên khác: tách theo , ; . — bỏ phần trong ngoặc (tên sách dẫn), bỏ mục < 3 ký tự. */
function tachTenKhac(s) {
	return String(s ?? "")
		.replace(/\([^)]*\)?/g, " ")
		.split(/[,;.]/)
		.map(cap)
		.filter((x) => x.k.length >= 3);
}

/** Tên bệnh đối chiếu ("Insomnia – Insomie"): tách theo gạch nối có cách, , ; */
function tachDoiChieu(s) {
	return String(s ?? "")
		.split(/\s[–—-]\s|[,;]/)
		.map(cap)
		.filter((x) => x.k.length >= 3);
}

const DOI_KINH = /^(thai am|thai duong|thieu am|thieu duong|duong minh|quyet am) /;

/**
 * Khoá phụ của kinh: người viết gọi "kinh Tỳ", "kinh Tâm Bào", "Thái Âm Tỳ" chứ ít ai viết đủ
 * "Kinh Túc Thái Âm Tỳ". Dựng TƯỜNG MINH từ tên (đây là tên gọi khác thật của kinh, không phải
 * phép bỏ tiền tố chung): tên bỏ "kinh", bỏ "thủ/túc", bỏ cặp lục kinh ("tỳ"), và slug ngắn
 * ("tam bao" — chỉ có bản bỏ dấu).
 */
function khoaKinh(muc) {
	const ra = [];
	if (muc.slug) ra.push({ k: chuanHoaManh(String(muc.slug).replace(/-/g, " ")), d: null });
	let tu = khoaCoDau(muc.title).split(" ");
	const boDauTu = (i) => boDau(tu.slice(0, i).join(" "));
	if (boDauTu(1) === "kinh") tu = tu.slice(1);
	ra.push(cap(tu.join(" ")));
	if (["thu", "tuc"].includes(boDauTu(1))) tu = tu.slice(1);
	ra.push(cap(tu.join(" ")));
	if (DOI_KINH.test(`${boDauTu(2)} `)) ra.push(cap(tu.slice(2).join(" ")));
	return ra.filter((x) => x.k);
}

/**
 * @param {{bo: string, title: string, slug: string, slug_goc?: string, ten_khac?: string,
 *          ma_huyet?: string, ma?: string, doi_chieu_benh_danh?: string}[]} dsMuc
 * @returns {{muc: {ten: string, loai: string, duong: string[], khoaTen: string, khoaTenCoDau: string,
 *           khoaKhac: string[], khoaKhacCoDau: string[]}[]}}
 */
export function dungChiMuc(dsMuc) {
	const muc = [];
	for (const m of dsMuc) {
		const cfg = MUC_BO[m.bo];
		if (!cfg || !m.title) continue;
		const duong = duongUngVien(m.bo, m);
		if (!duong.length) continue;
		// Tên mục giữ NGUYÊN — không bỏ tiền tố (xem đầu tệp).
		const khoaTen = chuanHoaManh(m.title);
		const khoaTenCoDau = khoaCoDau(m.title);
		if (!khoaTen) continue;
		const ds = [...tachTenKhac(m.ten_khac), ...tachDoiChieu(m.doi_chieu_benh_danh)];
		// Mã huyệt/mã kinh ngắn ("LU") nên KHÔNG qua ngưỡng 3 ký tự của tên khác.
		for (const ma of [m.ma_huyet, m.ma]) if (ma) ds.push(cap(ma));
		if (m.bo === "kinh_mach") ds.push(...khoaKinh(m));
		const khac = new Set(ds.map((x) => x.k));
		const khacCoDau = new Set(ds.map((x) => x.d).filter(Boolean));
		khac.delete(khoaTen);
		khac.delete("");
		khacCoDau.delete(khoaTenCoDau);
		khacCoDau.delete("");
		muc.push({ ten: m.title, loai: cfg.loai, duong, khoaTen, khoaTenCoDau, khoaKhac: [...khac], khoaKhacCoDau: [...khacCoDau] });
	}
	return { muc };
}

/** `kim` (≥ 2 từ) nằm trọn theo ranh giới từ trong `hay`. */
function chuaTron(hay, kim) {
	return kim.includes(" ") && ` ${hay} `.includes(` ${kim} `);
}

/** Hạng khớp của MỘT mục với MỘT khoá cụm, theo một cặp khoá (bỏ dấu hoặc có dấu). */
function hangKhop(q, ten, khac) {
	if (!q) return null;
	if (ten === q) return "dung";
	if (khac.includes(q)) return "ten_khac";
	if (chuaTron(q, ten)) return "chua";
	if (chuaTron(ten, q)) return "mot_phan";
	return null;
}

/**
 * Tìm các mục khớp một cụm từ. Hạng: dung (tên = cụm) > ten_khac (cụm = một tên khác) > chua
 * (tên ≥ 2 từ nằm trọn trong cụm) > mot_phan (cụm ≥ 2 từ nằm trọn trong tên dài hơn; tối đa
 * TRAN_MOT_PHAN mục). "chua" đòi ≥ 2 từ vì tên một từ ("Tâm", "Tỳ") có mặt trong gần như mọi
 * câu Đông y. Thử cụm gốc và bản bỏ tiền tố (bienThe). Cụm có dấu: CHỈ khớp có dấu. Cụm không
 * dấu: khớp có dấu trùng khít (vd "SP6", "alzheimer") thắng; không có thì nhận khớp bỏ dấu.
 * @returns {{ten: string, loai: string, duong: string[], khop: "dung"|"ten_khac"|"chua"|"mot_phan"}[]}
 */
export function timTrongChiMuc(chiMuc, cumTu, { toiDa = 5 } = {}) {
	const bt = bienThe(cumTu);
	if (!bt.length) return [];
	const qCoDau = bt.map(khoaCoDau).filter(Boolean);
	const qBoDau = bt.map(chuanHoaManh).filter(Boolean);
	const choBoDau = !coDauViet(cumTu);
	const tot = (a, b) => (!a ? b : !b ? a : HANG_KHOP[b] < HANG_KHOP[a] ? b : a);
	const coDau = [], boDauChi = [];
	for (const m of chiMuc.muc) {
		let kd = null;
		for (const q of qCoDau) kd = tot(kd, hangKhop(q, m.khoaTenCoDau ?? "", m.khoaKhacCoDau ?? []));
		if (kd) {
			coDau.push({ ten: m.ten, loai: m.loai, duong: m.duong, khop: kd });
			continue;
		}
		if (!choBoDau) continue;
		let kb = null;
		for (const q of qBoDau) kb = tot(kb, hangKhop(q, m.khoaTen, m.khoaKhac));
		if (kb) boDauChi.push({ ten: m.ten, loai: m.loai, duong: m.duong, khop: kb });
	}
	// Đã có khớp CÓ DẤU thì bỏ mọi khớp chỉ trùng khi bỏ dấu.
	const ra = coDau.length ? coDau : boDauChi;
	ra.sort(
		(a, b) =>
			HANG_KHOP[a.khop] - HANG_KHOP[b.khop] ||
			THU_TU_LOAI.indexOf(a.loai) - THU_TU_LOAI.indexOf(b.loai) ||
			a.ten.length - b.ten.length,
	);
	let soMotPhan = 0;
	return ra.filter((x) => x.khop !== "mot_phan" || ++soMotPhan <= TRAN_MOT_PHAN).slice(0, toiDa);
}
