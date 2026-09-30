// Rào phạm vi hành nghề Y sỹ: chữ nào hàm ý "khám bệnh, chữa bệnh" thì không được đứng
// trong bài máy viết. Đây là LUẬT, không nhờ mô hình tự chấm — ngày 30/09/2026 mô hình đã
// gắn "An toàn" cho "Ứng dụng châm cứu chữa bệnh hiệu quả…".
//
// GIỮ NGUYÊN (thuật ngữ YHCT chuẩn): điều trị, chẩn trị, pháp trị, chủ trị, luận trị, chẩn đoán, quản trị, sửa chữa, khám bệnh nhân.
// "Phòng khám" KHÔNG chặn: trong blog nó gần như luôn nói về khách hàng mua phần mềm.
// Mệnh đề miễn trừ ("không thay thế việc thăm khám…") được GỠ ra rồi mới soát phần còn lại
// của câu — nó nói về người KHÁC. Trước đây cả câu được miễn, nên "Châm cứu chữa khỏi hẳn mất
// ngủ, nhưng bạn nên tham khảo ý kiến thầy thuốc." lọt qua trọn vẹn.
// Dấu hiệu miễn trừ CHỈ còn "không (thể) thay thế". "thăm khám"/"tham khảo ý kiến" từng là dấu
// hiệu, và chính nó là lỗ: "Chúng tôi thăm khám và chữa mất ngủ…" ra [] (đo 30/09/2026).
// Bỏ sót ở đây là rủi ro pháp lý, bắt thừa chỉ tốn một lần viết lại — nghiêng về bắt thừa.

const LUAT = [
	{ ma: "chua", mau: /(?<!sửa )(?<!\p{L})chữa(?!\p{L})/u, goiY: "hỗ trợ / cải thiện / theo lý luận Đông Y" },
	{
		ma: "tri",
		// Loại: điều trị, chẩn trị, pháp trị, chủ trị, luận trị, giá trị, cai trị, quản trị, chính trị,
		// cấp trị / hoãn trị ("cấp trị tiêu, hoãn trị bản"); trị liệu, trị số, trị giá.
		mau: /(?<!(?:điều|chẩn|pháp|chủ|luận|giá|cai|quản|chính|cấp|hoãn) )(?<!\p{L})trị(?!\p{L})(?! (?:liệu|số|giá)(?!\p{L}))/u,
		goiY: "hỗ trợ / điều hoà",
	},
	{
		ma: "kham_benh",
		// "khám" đứng làm động từ: thăm khám, khám bệnh, khám chữa, đi/được khám, khám cho, khám và…
		// Loại: phòng khám, khám phá, khám nghiệm, khám bệnh nhân (khách hàng dùng phần mềm khám bệnh
		// nhân — xem đầu tệp). "thăm " được nuốt vào `tu` để gợi ý chỉ đúng cụm cần thay.
		mau: /(?<!\p{L})(?:thăm )?(?<!phòng )khám(?!\p{L})(?! (?:phá|nghiệm|bệnh nhân)(?!\p{L}))/u,
		goiY: "đo kinh lạc / tư vấn",
	},
	{ ma: "hua_khoi", mau: /(?<!\p{L})(?:khỏi (?:hẳn|bệnh|hoàn toàn)|dứt điểm)(?!\p{L})/u, goiY: "bỏ lời hứa kết quả" },
	{ ma: "bac_si_minh", mau: /(?:đội ngũ bác s[ĩỹ]|bác s[ĩỹ] (?:của chúng tôi|kinh lạc))/u, goiY: "thầy thuốc / Y sỹ Y học cổ truyền" },
];

/** Mệnh đề miễn trừ: từ dấu hiệu tới dấu câu kế tiếp (gồm cả dấu đó) hoặc hết câu. */
const MIEN_TRU = /không (?:thể )?thay thế[^,;.!?]*[,;.!?]?/gu;

/** Tách câu theo dấu kết câu và xuống dòng. */
function tachCau(s) {
	return String(s ?? "").split(/(?<=[.!?])\s+|\n+/u).filter((c) => c.trim());
}

/**
 * @returns {{ma:string, tu:string, cau:string, goiY:string}[]}
 */
export function timViPham(vanBan) {
	const ra = [];
	// NFC trước: chữ dán từ macOS/Word có thể ở dạng NFD ("ư" = u + móc) và không khớp mẫu nào.
	for (const cau of tachCau(String(vanBan ?? "").normalize("NFC"))) {
		// Gộp khoảng trắng (kể cả NBSP) trước: "phòng  khám" hai dấu cách không được lọt ngoại lệ.
		const thuong = cau.toLowerCase().replace(/\s+/gu, " ").replace(MIEN_TRU, " ");
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
