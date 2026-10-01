// Rào phạm vi hành nghề Y sỹ: chữ nào hàm ý "khám bệnh, chữa bệnh" thì không được đứng
// trong bài máy viết. Đây là LUẬT, không nhờ mô hình tự chấm — ngày 30/09/2026 mô hình đã
// gắn "An toàn" cho "Ứng dụng châm cứu chữa bệnh hiệu quả…".
//
// GIỮ NGUYÊN (thuật ngữ YHCT chuẩn): điều trị, chẩn trị, pháp trị, chủ trị, luận trị, chẩn đoán, quản trị, sửa chữa, khám bệnh nhân.
// "Phòng khám" KHÔNG chặn: trong blog nó gần như luôn nói về khách hàng mua phần mềm.
// Cụm miễn trừ ("không thay thế việc thăm khám…") được GỠ ra rồi mới soát phần còn lại
// của câu — nó nói về người KHÁC. Trước đây cả câu được miễn, nên "Châm cứu chữa khỏi hẳn mất
// ngủ, nhưng bạn nên tham khảo ý kiến thầy thuốc." lọt qua trọn vẹn.
// Dấu hiệu miễn trừ CHỈ còn "không (thể) thay thế". "thăm khám"/"tham khảo ý kiến" từng là dấu
// hiệu, và chính nó là lỗ: "Chúng tôi thăm khám và chữa mất ngủ…" ra [] (đo 30/09/2026).
// Bỏ sót ở đây là rủi ro pháp lý, bắt thừa chỉ tốn một lần viết lại — nghiêng về bắt thừa.

// Chế độ NGHIÊM (`{nghiem: true}`) dành cho bài MÁY viết (nopBai của lò viết, hook trước khi đăng
// bài máy): chặn mọi "bác sĩ" (Y sỹ không được xưng/nhắc "bác sĩ" trong giọng của phòng chẩn trị),
// bỏ ngoại lệ "khám bệnh nhân" (ngoại lệ đó viết cho bài về PHẦN MỀM, còn lò viết là giọng của
// chính phòng chẩn trị), và bắt lời hứa rộng hơn. Chế độ thường giữ ngoại lệ cũ cho bài người viết.

const HUA_KHOI_THUONG = "khỏi (?:hẳn|bệnh|hoàn toàn)|dứt điểm|tận gốc|đặc trị|khỏi \\d{1,3} ?%|cam kết khỏi";
// Chế độ nghiêm phải chặn ĐÚNG những gì LOI_NHAC_VIET (loi-dan.mjs, dòng "Không hứa kết quả") dặn
// là máy chủ chặn — test "N2: lời dặn … nói cùng một thứ" ghim hai bên lại với nhau.
const HUA_KHOI_NGHIEM = `${HUA_KHOI_THUONG}|hết hẳn|đều khỏi|vĩnh viễn|khỏi ngay|hết ngay|cam kết hiệu quả|hiệu quả \\d{1,3} ?%|hiệu quả tức thì`;

const luatChua = { ma: "chua", mau: /(?<!sửa )(?<!\p{L})chữa(?!\p{L})/u, goiY: "hỗ trợ / cải thiện / theo lý luận Đông Y" };
const luatTri = {
	ma: "tri",
	// Loại: điều trị, chẩn trị, pháp trị, chủ trị, luận trị, giá trị, cai trị, quản trị, chính trị,
	// cấp trị / hoãn trị ("cấp trị tiêu, hoãn trị bản"); trị liệu, trị số, trị giá.
	mau: /(?<!(?:điều|chẩn|pháp|chủ|luận|giá|cai|quản|chính|cấp|hoãn) )(?<!\p{L})trị(?!\p{L})(?! (?:liệu|số|giá)(?!\p{L}))/u,
	goiY: "hỗ trợ / điều hoà",
};
// "khám" đứng làm động từ: thăm khám, khám bệnh, khám chữa, đi/được khám, khám cho, khám và…
// Loại: phòng khám (cả "Phòng-khám"), khám phá, khám nghiệm, và — chỉ ở chế độ thường — khám bệnh
// nhân. "thăm " được nuốt vào `tu` để gợi ý chỉ đúng cụm cần thay.
const luatKham = (nghiem) => ({
	ma: "kham_benh",
	mau: nghiem
		? /(?<!\p{L})(?:thăm )?(?<!phòng[ -])khám(?!\p{L})(?! (?:phá|nghiệm)(?!\p{L}))/u
		: /(?<!\p{L})(?:thăm )?(?<!phòng[ -])khám(?!\p{L})(?! (?:phá|nghiệm|bệnh nhân)(?!\p{L}))/u,
	goiY: "đo kinh lạc / tư vấn",
});
const luatHua = (nghiem) => ({
	ma: "hua_khoi",
	mau: new RegExp(`(?<!\\p{L})(?:${nghiem ? HUA_KHOI_NGHIEM : HUA_KHOI_THUONG})(?!\\p{L})`, "u"),
	goiY: "bỏ lời hứa kết quả",
});
// "khỏi" làm KẾT QUẢ ("chữa khỏi mất ngủ", "hỗ trợ khỏi mất ngủ", "bệnh sẽ khỏi") — nghiệm thu 2C-3,
// Bất ngờ 4: trước đây "chữa khỏi" chỉ báo chữ "chữa", người sửa thay bằng "hỗ trợ" là qua cổng.
// Nhận diện bằng chữ ĐỨNG TRƯỚC (động từ chữa/giúp, phó từ thời) chứ không cấm mọi "khỏi": làm giới
// từ ("ra khỏi", "tránh khỏi", "thoát khỏi", "khỏi phải", "khỏi bị") nó rất thường gặp và vô hại.
// Cụm luật hứa-khỏi đã bắt ("khỏi hẳn", "khỏi bệnh"…) không báo lần hai — timViPham lọc chồng lấn.
const luatKhoi = {
	ma: "khoi_benh",
	mau: /(?<=(?<!\p{L})(?:chữa|trị|hỗ trợ|giúp|mau|nhanh|chóng|sẽ|đã|sắp|tự|có thể|bệnh) )khỏi(?!\p{L})(?! (?:phải|cần|lo|nói|bàn|bị|mất công|tốn)(?!\p{L}))/u,
	goiY: "bỏ lời hứa kết quả",
};
const GOI_Y_BAC_SI = "thầy thuốc / Y sỹ Y học cổ truyền";

const LUAT_THUONG = [
	luatChua,
	luatTri,
	luatKham(false),
	luatHua(false),
	luatKhoi,
	{ ma: "bac_si_minh", mau: /(?:đội ngũ bác s[ĩỹ]|bác s[ĩỹ] (?:của chúng tôi|kinh lạc))/u, goiY: GOI_Y_BAC_SI },
];
const LUAT_NGHIEM = [luatChua, luatTri, luatKham(true), luatHua(true), luatKhoi, { ma: "bac_si", mau: /(?<!\p{L})bác s[ĩỹi](?!\p{L})/u, goiY: GOI_Y_BAC_SI }];

/**
 * Cụm danh từ của câu miễn trừ: "không (thể) thay thế [được] [cho] [việc] <danh sách>" với danh sách
 * CHỈ gồm các danh từ dưới đây, nối bằng dấu phẩy / hay / hoặc / và. Miễn ĐÚNG cụm đó, không miễn
 * phần câu phía sau: "không thay thế thuốc mà còn chữa khỏi hẳn…" không có danh từ nào trong danh
 * sách nên không được miễn gì (lỗ đo 30/09/2026 — MIEN_TRU cũ nuốt tới dấu câu kế tiếp).
 */
const MUC_MIEN = "(?:thăm khám|khám|chẩn đoán|điều trị|tư vấn|ý kiến)(?!\\p{L})";
const MIEN_TRU = new RegExp(`không (?:thể )?thay thế (?:được )?(?:cho )?(?:việc )?${MUC_MIEN}(?:(?:,? (?:hay|hoặc|và) |, )${MUC_MIEN})*`, "gu");
/** Đuôi "của thầy thuốc…" tới hết câu — chỉ miễn khi chính nó không vi phạm luật nào. */
const DUOI_MIEN = /^ của (?:thầy thuốc|bác s[ĩỹi]|nhân viên y tế)[^.!?]*/u;

function goMienTru(thuong, luat) {
	let ra = "", i = 0;
	for (const m of thuong.matchAll(MIEN_TRU)) {
		if (m.index < i) continue;
		ra += `${thuong.slice(i, m.index)} `;
		i = m.index + m[0].length;
		const duoi = thuong.slice(i).match(DUOI_MIEN);
		if (duoi && !luat.some((l) => l.mau.test(duoi[0]))) i += duoi[0].length;
	}
	return ra + thuong.slice(i);
}

/**
 * Ký tự vô hình: chèn vào giữa chữ ("ch\u200bữa") là lách được mọi mẫu. Bỏ MỌI ký tự định dạng
 * (\p{Cf}: gạch mềm, ZWSP/ZWJ, LRM/RLM, điều khiển hướng 202A–202E / 2066–2069, 2061–2064, BOM…)
 * cộng CGJ (U+034F, loại Mn) và U+180E — liệt kê tay từng thiếu LRM, RLO, LRI (đo 30/09/2026).
 */
const VO_HINH = /[\p{Cf}\u034F\u180E]/gu;

/**
 * Chuẩn chữ trước MỌI phép soát luật: NFC (chữ dán từ macOS/Word có thể ở dạng NFD — "ư" = u +
 * móc — và không khớp mẫu nào) và bỏ ký tự vô hình / gạch mềm.
 */
export function sachChu(s) {
	return String(s ?? "").normalize("NFC").replace(VO_HINH, "");
}

/** Tách câu theo dấu kết câu và xuống dòng. */
function tachCau(s) {
	return String(s ?? "").split(/(?<=[.!?])\s+|\n+/u).filter((c) => c.trim());
}

/**
 * @param {string} vanBan
 * @param {{nghiem?: boolean}} [tuyChon]  nghiem: bài máy viết (xem đầu tệp)
 * @returns {{ma:string, tu:string, cau:string, goiY:string}[]}
 */
export function timViPham(vanBan, { nghiem = false } = {}) {
	const luat = nghiem ? LUAT_NGHIEM : LUAT_THUONG;
	const ra = [];
	for (const cau of tachCau(sachChu(vanBan))) {
		// Gộp khoảng trắng (kể cả NBSP) trước: "phòng  khám" hai dấu cách không được lọt ngoại lệ.
		const thuong = goMienTru(cau.toLowerCase().replace(/\s+/gu, " "), luat);
		let hua = null; // khoảng [đầu, cuối) của cụm hứa-khỏi trong câu này
		for (const l of luat) {
			const m = thuong.match(l.mau);
			if (!m) continue;
			if (l.ma === "hua_khoi") hua = [m.index, m.index + m[0].length];
			// "khỏi" nằm trong cụm hứa-khỏi vừa báo ("giúp khỏi hẳn") là MỘT chỗ sửa, không phải hai.
			if (l === luatKhoi && hua && m.index >= hua[0] && m.index < hua[1]) continue;
			ra.push({ ma: l.ma, tu: m[0], cau: cau.trim(), goiY: l.goiY });
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
