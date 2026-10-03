// Ý ĐỊNH của một truy vấn — người gõ câu đó muốn gì.
//
// VÌ SAO TỒN TẠI: tháp (`ungVien`, `cumNguNghia`) đo CUNG — kho mình có bao nhiêu vị thuốc, bài
// thuốc, huyệt đứng sau một nhu cầu. Nó không biết gì về CẦU. Search Console biết, và nó nói
// một điều mà tháp không nói nổi: **người ta hỏi gì khi tới trang của mình**.
//
// Số đo 03/10/2026 (28 ngày, 135 cặp từ khoá × trang, 989 lượt hiển thị): phần lớn truy vấn là
// TRA TÊN ("huyệt phục thỏ", "lãi câu") và VỊ TRÍ ("huyệt hạ quan ở đâu", "vị trí huyệt phục
// thỏ"). Gần như không ai hỏi "chữa bệnh gì". Tức trang huyệt phải trả lời CHỖ NẰM ngay đầu
// bài; viết thêm một mục chủ trị dài không kéo được lượt nhấp nào.
//
// ⚠️ PHÂN LOẠI THEO DẠNG CÂU, KHÔNG ĐOÁN NGHĨA. Chỉ nhận những dạng hỏi không thể nhầm. Câu
// không khớp dạng nào thì về `tra_ten` nếu nó NGẮN (đúng kiểu gõ tên để tra) và `khac` nếu dài
// — chứ không gán bừa cho dạng đông nhất.

import { boDau } from "../luat/chuan-hoa.mjs";

/** Thứ tự XÉT quan trọng: "cách bấm huyệt X ở đâu" là câu hỏi CÁCH LÀM, không phải vị trí. */
const DANG = [
	["an_toan", /(co nguy hiem|co sao khong|kieng (gi|ky)|chong chi dinh|tac hai|co nen|lam sao cho an toan)/],
	["cach_lam", /(cach (bam|day|cham|xoa|massage|chua|tri)|huong dan|the nao cho dung|bao lau|may lan|lieu trinh)/],
	["tac_dung", /(tac dung|cong dung|chua (benh )?gi|tri (benh )?gi|chua duoc gi|chu tri)/],
	["dinh_nghia", /(la gi|la huyet gi|nghia la|thuoc kinh nao|ten khac|con goi la)/],
	["vi_tri", /(o dau|nam o dau|vi tri|cho nao|xac dinh|tim huyet|cach lay huyet|giai phau)/],
];

/** Truy vấn dài hơn chừng này TỪ thì không còn là "gõ tên để tra" nữa. */
export const TOI_DA_TU_TRA_TEN = 5;

/** @returns {"an_toan"|"cach_lam"|"tac_dung"|"dinh_nghia"|"vi_tri"|"tra_ten"|"khac"} */
export function yDinh(tuKhoa) {
	const t = boDau(tuKhoa).replace(/\s+/g, " ").trim();
	if (!t) return "khac";
	for (const [ten, re] of DANG) if (re.test(t)) return ten;
	return t.split(" ").length <= TOI_DA_TU_TRA_TEN ? "tra_ten" : "khac";
}

export const NHAN_Y_DINH = {
	tra_ten: "tra tên",
	vi_tri: "hỏi vị trí",
	dinh_nghia: "hỏi định nghĩa",
	tac_dung: "hỏi tác dụng",
	cach_lam: "hỏi cách làm",
	an_toan: "hỏi an toàn",
	khac: "khác",
};

/**
 * Gộp một danh sách truy vấn thành bức tranh cầu.
 * @param {{tuKhoa: string, hienThi: number, nhap: number, viTri: number}[]} ds
 * @returns {{soTuKhoa, hienThi, nhap, yDinh: {ma, nhan, soTuKhoa, hienThi}[], dauBang: object[]}}
 */
export function gomCau(ds) {
	const theoY = new Map();
	let hienThi = 0;
	let nhap = 0;
	for (const x of ds ?? []) {
		const y = yDinh(x.tuKhoa);
		const o = theoY.get(y) ?? { ma: y, nhan: NHAN_Y_DINH[y] ?? y, soTuKhoa: 0, hienThi: 0 };
		o.soTuKhoa++;
		o.hienThi += x.hienThi ?? 0;
		theoY.set(y, o);
		hienThi += x.hienThi ?? 0;
		nhap += x.nhap ?? 0;
	}
	return {
		soTuKhoa: (ds ?? []).length,
		hienThi,
		nhap,
		// Xếp theo HIỂN THỊ, không theo số từ khoá: một dạng hỏi có 2 truy vấn mà 300 lượt hiển
		// thị quan trọng hơn dạng có 20 truy vấn mà 20 lượt.
		yDinh: [...theoY.values()].sort((a, b) => b.hienThi - a.hienThi),
		dauBang: [...(ds ?? [])].sort((a, b) => (b.hienThi ?? 0) - (a.hienThi ?? 0)).slice(0, 8),
	};
}
