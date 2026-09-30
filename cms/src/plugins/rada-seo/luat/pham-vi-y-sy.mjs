// Rào phạm vi hành nghề Y sỹ: chữ nào hàm ý "khám bệnh, chữa bệnh" thì không được đứng
// trong bài máy viết. Đây là LUẬT, không nhờ mô hình tự chấm — ngày 30/09/2026 mô hình đã
// gắn "An toàn" cho "Ứng dụng châm cứu chữa bệnh hiệu quả…".
//
// GIỮ NGUYÊN (thuật ngữ YHCT chuẩn): điều trị, chẩn trị, pháp trị, chủ trị, luận trị, chẩn đoán, quản trị, sửa chữa, khám bệnh nhân.
// "Phòng khám" KHÔNG chặn: trong blog nó gần như luôn nói về khách hàng mua phần mềm.
// Câu miễn trừ ("không thay thế… thăm khám… bác sĩ") được bỏ qua — nó nói về người KHÁC.

const LUAT = [
	{ ma: "chua", mau: /(?<!sửa )(?<!\p{L})chữa(?!\p{L})/u, goiY: "hỗ trợ / cải thiện / theo lý luận Đông Y" },
	{
		ma: "tri",
		// Loại: điều trị, chẩn trị, pháp trị, chủ trị, luận trị, giá trị, cai trị, quản trị; trị liệu, trị số.
		mau: /(?<!(?:điều|chẩn|pháp|chủ|luận|giá|cai|quản) )(?<!\p{L})trị(?!\p{L})(?! (?:liệu|số)(?!\p{L}))/u,
		goiY: "hỗ trợ / điều hoà",
	},
	{ ma: "kham_benh", mau: /(?<!\p{L})khám (?:bệnh(?! nhân)|chữa)(?!\p{L})/u, goiY: "đo kinh lạc / tư vấn" },
	{ ma: "hua_khoi", mau: /(?<!\p{L})(?:khỏi (?:hẳn|bệnh|hoàn toàn)|dứt điểm)(?!\p{L})/u, goiY: "bỏ lời hứa kết quả" },
	{ ma: "bac_si_minh", mau: /(?:đội ngũ bác s[ĩỹ]|bác s[ĩỹ] (?:của chúng tôi|kinh lạc))/u, goiY: "thầy thuốc / Y sỹ Y học cổ truyền" },
];

const MIEN_TRU = /không thay thế|thăm khám|tham khảo ý kiến/u;

/** Tách câu theo dấu kết câu và xuống dòng. */
function tachCau(s) {
	return String(s ?? "").split(/(?<=[.!?])\s+|\n+/u).filter((c) => c.trim());
}

/**
 * @returns {{ma:string, tu:string, cau:string, goiY:string}[]}
 */
export function timViPham(vanBan) {
	const ra = [];
	for (const cau of tachCau(vanBan)) {
		const thuong = cau.toLowerCase();
		if (MIEN_TRU.test(thuong)) continue;
		for (const l of LUAT) {
			const m = thuong.match(l.mau);
			if (m) ra.push({ ma: l.ma, tu: m[0], cau: cau.trim(), goiY: l.goiY });
		}
	}
	return ra;
}

/**
 * `chan` = vi phạm ở tiêu đề hoặc mô tả → không tạo nháp nếu viết lại vẫn trượt.
 * Vi phạm trong thân bài → viết lại một lần, còn thì cờ đỏ.
 */
export function kiemPhamVi({ tieuDe = "", moTa = "", noiDung = "" }) {
	const dau = [...timViPham(tieuDe), ...timViPham(moTa)];
	const than = timViPham(noiDung);
	return { chan: dau.length > 0, viPhamDau: dau, viPhamThan: than };
}
