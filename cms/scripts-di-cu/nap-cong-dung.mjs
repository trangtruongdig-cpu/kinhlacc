// nap-cong-dung.mjs — Nạp hồ sơ ĐÃ DUYỆT vào cột ec_huyet_vi.cong_dung_nhom.
//
// Việc 9 (giọng văn thí điểm ở 11 huyệt kinh Phế — ĐÃ DUYỆT): từ điển hiện chỉ có mục
// TÁC DỤNG viết lối cổ văn ("Khu phong, hoá đàm, lý Phế, chỉ khát") — đúng nhưng người
// MỚI HỌC đọc không ra. Mục MỚI này viết lại theo lối "nhóm công dụng: chỉ định cụ
// thể", đặt CẠNH mục cổ văn (KHÔNG thay). Nội dung đối chiếu SỰ KIỆN với
// cms/.tam-focks/hoso.json (bóc từ Atlas of Acupuncture — Claudia Focks, bản Việt hoá
// Phùng Văn Chiến) nhưng diễn đạt lại bằng lời riêng, không chép nguyên khối — vừa để
// người mới học đọc dễ, vừa để trang không bị Google xếp trùng lặp với bản PDF đang
// lưu hành khắp các nhóm.
//
// LÔ 2/4: 113 huyệt ba kinh SI (Tiểu Trường, 19), BL (Bàng Quang, 67), KI (Thận, 27).
// Lô 1 (LI/ST/SP/HE, 93 huyệt) đã ghi xong — bản HO_SO của lô đó không còn trong file
// này (xem lịch sử git nếu cần tra lại), theo đúng quy ước "mỗi lô ghi qua bản HO_SO
// của chính lô đó" ở dưới. Mỗi phần tử "nhom" ứng với một cụm gạch đầu dòng "●" trong
// nguyenVan của nguồn (đã tách đúng theo nguyenVan — không dùng tacDung vì tacDung bị
// PDF-extract ngắt dòng giữa câu, xuống dòng sai chỗ).
//
// ⚠️ NHIỄU OCR trong nguồn: nhiều "nguyenVan" có chèn dòng chân trang giữa câu
// ("Phùng Văn Chiến (Việt hoá, biên soạn, chế hình) HUYỆT VỊ CHÂM CỨU THƯỜNG DÙNG
// <số trang>") do PDF ngắt trang giữa một gạch đầu dòng — đã lọc bỏ khi viết lại,
// không phải sự kiện thật của huyệt.
//
// ⚠️ MÃ CSDL LỆCH QUY ƯỚC — cả hai đo bằng truy vấn trước khi ghi, không giả định:
//   KI15 (Trung Chú, tr224): CSDL có hàng đúng vị trí (title='Trung Chú') nhưng
//     ma_huyet đang NULL — ghi theo slug='trung-chu' (KHOP_THEO_SLUG).
//   KI23 (Thần Phong, tr232): CSDL lưu ma_huyet='K23' (thiếu chữ I), không phải
//     'KI23' — ghi theo mã thật 'K23' (KHOP_THEO_MA_KHAC), KHÔNG sửa ma_huyet (việc
//     sửa mã lệch nằm ngoài phạm vi việc này, tương tự lý do bỏ qua ST3/GB29 ở lô 1).
// Không có huyệt nào trong BO_QUA_MA_LECH ở lô này (khác lô 1 có ST3) — cả 113 huyệt
// SI/BL/KI đều ghi được, chỉ khác đường dẫn ghi (thẳng theo ma_huyet, theo slug, hay
// theo mã khác).
//
// ⚠️ HÌNH DẠNG JSON — đã ĐO THẬT bằng cách gọi thẳng hàm td_chu() (cms/sql/chi-muc-
// tra-cuu.sql) trước khi chốt ở lô 1, KHÔNG đoán:
//   { trang: 16, nhom: ["chuỗi một", "chuỗi hai"] }   → td_chu gộp lại "chuỗi một chuỗi hai" ✓
//   { trang: 16, nhom: [{nhom:"..", chiDinh:".."}] }  → td_chu trả về CHUỖI RỖNG      ✗
// Lý do: td_chu chỉ nhặt chữ ở GIÁ TRỊ CHUỖI khi khoá đúng là 'text' (khớp hình dạng
// Portable Text {children:[{text:'..'}]}) hoặc đệ quy tiếp khi giá trị là mảng/đối
// tượng. Khoá "nhom"/"chiDinh" không phải 'text' nên bị bỏ qua HOÀN TOÀN — mất trắng
// mà KHÔNG có lỗi nào báo. Vì vậy mỗi mục "nhom" ở đây là MỘT CHUỖI "Nhóm: Chỉ định."
// (giữ nguyên hoà giọng câu gốc "A: B" của sách), không phải một object con.
//
//   node scripts-di-cu/nap-cong-dung.mjs --thu            # in ra, không ghi, không nối CSDL
//   node scripts-di-cu/nap-cong-dung.mjs --kiem           # nối CSDL, chỉ đối chiếu mã huyệt, KHÔNG ghi
//   node scripts-di-cu/nap-cong-dung.mjs --kinh=SI,BL     # giới hạn lô ghi theo kinh (mặc định: cả lô)
//   node scripts-di-cu/nap-cong-dung.mjs
//
// ⚠️ Bốn lô (LI/ST/SP/HE, rồi SI/BL/KI, rồi hai lô còn lại) đều ghi qua bản HO_SO của
// CHÍNH LÔ ĐÓ — đừng chạy lại lô cũ sau khi đã thay HO_SO bằng lô mới, dữ liệu lô cũ
// sẽ không được ghi lại (không mất, chỉ là không có tác dụng gì).
//
// Đợi ĐỦ CẢ BỐN LÔ rồi mới chạy một lượt (không chạy giữa lô — tốn công vô ích):
//   node scripts-di-cu/dung-chi-muc.mjs huyet_vi
//   node scripts-di-cu/xuat-huyet-js.mjs

import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const goc = resolve(here, "../..");
const require = createRequire(import.meta.url);
const { Client } = require("pg");
const chiThu = process.argv.includes("--thu");
const chiKiem = process.argv.includes("--kiem");
const gioiHanKinh = (() => {
	const arg = process.argv.find((a) => a.startsWith("--kinh="));
	if (!arg) return null;
	return new Set(
		arg
			.slice("--kinh=".length)
			.split(",")
			.map((s) => s.trim().toUpperCase())
			.filter(Boolean),
	);
})();
const tienToKinh = (ma) => ma.replace(/[0-9]+$/, "");

// Không có mã nào phải BỎ QUA hoàn toàn ở lô này (khác lô 1 có ST3 lệch mã liên kinh
// chưa xử lý). Giữ biến này rỗng để logic ghi/kiểm bên dưới dùng chung với lô 1.
const BO_QUA_MA_LECH = {};

// KI15 (Trung Chú): ma_huyet NULL trong CSDL, hàng đúng vị trí nằm ở slug='trung-chu'.
const KHOP_THEO_SLUG = {
	KI15: "trung-chu",
};

// KI23 (Thần Phong): CSDL lưu ma_huyet='K23' (lệch tiền tố, thiếu chữ I) — ghi theo mã
// thật, KHÔNG sửa ma_huyet (sửa mã lệch nằm ngoài phạm vi việc này).
const KHOP_THEO_MA_KHAC = {
	KI23: "K23",
};

// Hồ sơ ĐÃ DUYỆT — lô 2: SI1…SI19, BL1…BL67, KI1…KI27 (KI15 ghi theo slug, KI23 ghi
// theo mã khác — xem hai bảng ánh xạ ở trên). `trang` là số trang trong bản dịch
// Focks/Phùng Văn Chiến đã đối chiếu (để truy nguồn); mỗi phần tử của `nhom` là "Tên
// nhóm công dụng: chỉ định cụ thể" viết lại bằng lời riêng, giữ nguyên SỰ KIỆN so với
// cms/.tam-focks/hoso.json.
const HO_SO = {

	// ── SI — Tiểu Trường (19) ───────────────────────────────────────
	SI1: {
		trang: 120,
		nhom: [
			"Thanh nhiệt, tiêu sưng: sưng đau vùng miệng và mặt, mắt đỏ, chảy máu cam, sốt nhiễm trùng cấp.",
			"Thông khiếu ngũ quan: giảm thị lực, giảm thính lực, rối loạn vận động lưỡi.",
			"Khai khiếu, hồi tỉnh (huyệt cấp cứu): ngất xỉu, suy sụp.",
			"Lợi sữa: rối loạn tiết sữa, viêm tuyến vú.",
			"Thông kinh lạc: đau dọc cẳng tay phía xương trụ, cánh tay trên, vai và cổ.",
		],
	},
	SI2: {
		trang: 121,
		nhom: [
			"Thanh nhiệt, khu phong, tiêu sưng: sốt nhiễm trùng, viêm họng, viêm kết mạc, giảm thị lực, viêm tai giữa, ù tai giảm thính lực, sưng má, viêm mũi, đau răng.",
			"Thông kinh lạc, giảm đau: đau ngón tay và khớp bàn ngón, rối loạn cảm giác và các chứng khác dọc đường kinh.",
		],
	},
	SI3: {
		trang: 123,
		nhom: [
			"Thanh nhiệt, khu phong nhiệt: sốt nhiễm trùng, sưng đau họng và má.",
			"Thanh nhiệt, lợi ngũ quan: bệnh ở da mặt, mắt, tai; đổ mồ hôi trộm ban đêm (phối Âm Khích — HE6).",
			"Điều hoà mạch Đốc, an thần: chuột rút, run rẩy, chóng mặt, động kinh.",
			"Thông kinh lạc, giảm đau, lợi cổ gáy: đau cổ, vai, cánh tay, cột sống, nhức đầu vùng chẩm, đau khớp ngón tay nhất là ngón út và ngón áp út.",
		],
	},
	SI4: {
		trang: 124,
		nhom: [
			"Thanh nhiệt, thông kinh lạc, tiêu sưng giảm đau: đau các ngón tay, cổ tay phía xương trụ, cánh tay, khuỷu tay, vai, cổ, sưng má, ù tai.",
			"Thanh nhiệt, lợi đảm (huyệt kinh nghiệm): vàng da.",
		],
	},
	SI5: {
		trang: 126,
		nhom: [
			"Thanh nhiệt, tiêu sưng: sưng viêm cổ và dưới hàm, sốt nhiễm trùng, đau răng, viêm mắt và tai, cứng hàm; tại chỗ trị các chứng ở cổ tay.",
			"Tả hoả (huyệt Hoả của kinh Tiểu Trường, dẫn nhiệt từ Tâm qua quan hệ biểu lý), an thần: rối loạn tâm thần với trạng thái hưng cảm.",
		],
	},
	SI6: {
		trang: 127,
		nhom: [
			"Thông kinh lạc, giảm đau, lợi vai và cánh tay, trị chứng cấp: đau vai/cổ, đau thắt lưng cấp, các vấn đề ở khớp cổ chân.",
			"Hỗ trợ mắt: các bệnh về mắt như giảm thị lực.",
		],
	},
	SI7: {
		trang: 128,
		nhom: [
			"Thông kinh lạc: đau và hạn chế vận động ở cánh tay, vai và cổ.",
			"Giải biểu: sốt nhiễm trùng, đau nhức mình mẩy.",
			"An thần: bồn chồn, lo âu, trạng thái hưng phấn quá mức.",
		],
	},
	SI8: {
		trang: 129,
		nhom: [
			"Thông kinh lạc: đau mỏm lồi cầu trong khuỷu tay, đau dọc mặt sau-trong cánh tay trên, vai và xương bả vai.",
			"An thần: bồn chồn, lo âu, trạng thái hưng phấn quá mức.",
			"Thanh nhiệt, tiêu sưng: đau họng, sưng má, đau răng, nhức đầu.",
		],
	},
	SI9: {
		trang: 130,
		nhom: [
			"Thông kinh lạc, khu phong, lợi khớp vai: đau và hạn chế vận động vùng xương bả vai bên, khớp vai phía sau và mặt sau cánh tay trên.",
		],
	},
	SI10: {
		trang: 131,
		nhom: [
			"Thông kinh lạc, thư cân: đau và hạn chế vận động vùng xương bả vai bên, khớp vai phía sau và cánh tay trên, hội chứng 'vai đông cứng'.",
		],
	},
	SI11: {
		trang: 132,
		nhom: [
			"Thông kinh lạc, giảm đau, hành khí, khoan khoái vùng ngực sườn: các chứng ở vai và xương bả vai (nhất là hạn chế xoay ngoài), và các chứng dọc đường kinh như đau vùng hàm dưới lan ra cánh tay.",
			"Lợi sữa: phối cùng Đản Trung (CV17), Nhũ Căn (ST18), Thiếu Trạch (SI1) trị rối loạn tiết sữa và viêm tuyến vú cấp.",
		],
	},
	SI12: {
		trang: 133,
		nhom: [
			"Khu phong, lợi vai và xương bả vai: đau nhức vùng vai và cổ, nhất là khi do phong tà gây bệnh.",
		],
	},
	SI13: {
		trang: 134,
		nhom: [
			"Thông kinh lạc, lợi vai và xương bả vai: đau và hạn chế vận động vùng bả vai phía trong, vai, và đoạn cột sống cổ dưới — ngực trên.",
		],
	},
	SI14: {
		trang: 135,
		nhom: [
			"Thông kinh lạc, giảm đau: đau và hạn chế vận động vùng vai và đoạn cột sống cổ dưới — ngực trên.",
			"Trừ phong hàn: đau nhức, căng cứng cơ sau khi nhiễm lạnh, trúng gió.",
		],
	},
	SI15: {
		trang: 136,
		nhom: [
			"Thông kinh lạc, giảm đau: đau và hạn chế vận động vùng vai và đoạn cột sống cổ dưới — ngực trên.",
			"Giáng Phế khí: bệnh hô hấp như ho.",
		],
	},
	SI16: {
		trang: 137,
		nhom: [
			"Là huyệt cửa sổ bầu trời (khai thông vùng đầu cổ), lợi hầu họng — tai — giọng nói, điều khí, an thần: đau họng, khàn giọng, bướu cổ, sưng bìu, nhức đầu, sưng mặt và má, rối loạn tâm thần như hưng cảm và trầm cảm.",
			"Thông kinh lạc, giảm đau: các chứng ở vùng cổ và vai.",
		],
	},
	SI17: {
		trang: 138,
		nhom: [
			"Là huyệt cửa sổ bầu trời, lợi tai — cổ — họng, giáng nghịch khí, tiêu sưng, an thần: đau họng, khàn giọng, ù tai, rối loạn ở tai, bướu cổ, sưng bìu, nhức đầu, sưng mặt và má, rối loạn tâm thần như hưng cảm và trầm cảm.",
		],
	},
	SI18: {
		trang: 138,
		nhom: [
			"Khu phong, thanh nhiệt, tiêu sưng giảm đau: liệt mặt, giật cơ mặt, đau dây thần kinh sinh ba (nhánh 2), viêm xoang hàm trên, hội chứng đau cân cơ mặt, sưng phù, hỗ trợ chỉnh nha, đau răng hàm trên; dùng châm tê khi nhổ răng.",
		],
	},
	SI19: {
		trang: 140,
		nhom: [
			"Lợi tai: các bệnh về tai, rối loạn khớp thái dương hàm (huyệt Thính Hội — GB2 hiệu quả hơn cho khớp hàm).",
			"An thần: rối loạn tâm thần.",
		],
	},

	// ── BL — Bàng Quang (67) ────────────────────────────────────────
	BL1: {
		trang: 142,
		nhom: [
			"Khu phong, thanh nhiệt, dưỡng mắt: các bệnh về mắt, liệt mặt.",
		],
	},
	BL2: {
		trang: 143,
		nhom: [
			"Dưỡng mắt: các bệnh về mắt.",
			"Khu phong, thanh nhiệt: sốt nhiễm trùng ở mũi và mắt, viêm mũi dị ứng, viêm xoang.",
			"Thanh đầu, giảm đau: giật cơ mặt, liệt mặt, đau dây thần kinh sinh ba (nhánh 1), nhức đầu vùng trán, đau nửa đầu.",
			"Hành khí theo nhánh phụ của kinh Bàng Quang: đau do trĩ.",
		],
	},
	BL3: {
		trang: 144,
		nhom: [
			"Khu phong, thanh nhiệt vùng trán đầu, lợi mũi và mắt: viêm mũi, viêm xoang, nhức đầu vùng trán, nhức đầu dọc đường kinh, chóng mặt, rối loạn thị giác, động kinh.",
		],
	},
	BL4: {
		trang: 145,
		nhom: [
			"Thanh nhiệt vùng đầu, lợi mắt mũi: sốt nhiễm trùng kèm đỏ mắt, viêm mũi, viêm xoang, chảy máu cam, nhức đầu vùng trán và đỉnh đầu, chóng mặt, rối loạn thị giác.",
		],
	},
	BL5: {
		trang: 146,
		nhom: [
			"Khu phong, thanh nhiệt vùng đầu mũi, tiềm dương: sốt nhiễm trùng, viêm mũi, viêm xoang, nhức đầu vùng trán — đỉnh, cứng cột sống, buồn ngủ nhiều, chóng mặt, động kinh.",
		],
	},
	BL6: {
		trang: 147,
		nhom: [
			"Khu phong, thanh nhiệt vùng đầu, nhất là mắt và mũi: rối loạn thị giác, viêm mũi, viêm xoang, mất khứu giác, nhức đầu đỉnh đầu, chóng mặt (cấp tính hoặc từng cơn), liệt mặt.",
		],
	},
	BL7: {
		trang: 148,
		nhom: [
			"Thanh khiếu đầu, đặc biệt lợi mũi: bệnh về mũi (chảy máu cam, polyp mũi, viêm mũi, viêm xoang, mất khứu giác), nhức đầu đỉnh đầu, liệt mặt, cứng cổ, rối loạn điều hoà tư thế.",
		],
	},
	BL8: {
		trang: 149,
		nhom: [
			"Khai khiếu, bình phong (nội phong), hoá đờm, an thần: viêm mũi, mất khứu giác, ù tai, liệt mặt, bướu cổ, chóng mặt, rối loạn điều hoà tư thế, ngất xỉu, lú lẫn, hưng cảm, động kinh.",
		],
	},
	BL9: {
		trang: 150,
		nhom: [
			"Trừ phong hàn, giảm đau, lợi mũi và mắt: sốt nhiễm trùng, viêm mũi, viêm xoang, mất khứu giác, bệnh về mắt, đau vùng mắt và má, nhức đầu kèm cảm giác nặng vùng sau đầu — cổ, trạng thái khó chịu lú lẫn, rối loạn điều hoà tư thế, động kinh.",
		],
	},
	BL10: {
		trang: 151,
		nhom: [
			"Điều khí, bình phong (nội phong), an thần, lợi đầu và ngũ quan: sốt nhiễm trùng, viêm mũi, viêm xoang, bệnh về mắt (đỏ, đau, rối loạn thị giác), chóng mặt, mất ngủ, kích động, hưng cảm, động kinh.",
			"Thông kinh lạc, giảm đau: nhức đầu vùng cổ — đỉnh kèm hạn chế vận động cột sống cổ.",
			"Tăng cường sức mạnh lưng dưới: huyệt trọng điểm cho đau thắt lưng cấp tính hai bên.",
		],
	},
	BL11: {
		trang: 152,
		nhom: [
			"Điều hoà Phế khí, chỉ khái: bệnh hô hấp như ho, khó thở, hen phế quản, tức ngực, viêm họng.",
			"Hội huyệt của xương, lợi xương khớp: các chứng ở cổ, bả vai, cột sống cổ — ngực, và các bệnh xương khớp nói chung.",
		],
	},
	BL12: {
		trang: 153,
		nhom: [
			"Trừ phong, giải biểu, lợi mũi: sốt kèm ớn lạnh sợ gió, nhức đầu, đau nhức mình mẩy, viêm mũi, viêm xoang, chảy máu cam.",
			"Điều hoà và giáng Phế khí: bệnh đường hô hấp.",
			"Bổ vệ khí, cố biểu: dễ bị nhiễm trùng, viêm mũi dị ứng, mệt mỏi kéo dài lúc dưỡng bệnh.",
			"Thông kinh lạc: đau cơ vùng cổ, ngực và đai vai.",
		],
	},
	BL13: {
		trang: 154,
		nhom: [
			"Bổ và điều giáng Phế khí, bổ Phế âm (Du huyệt của Phế): bệnh hô hấp như ho, khó thở, hen phế quản; kèm theo trong bệnh dạ dày có ho gây nôn và đầy bụng; dễ nhiễm trùng, tự ra mồ hôi, suy nhược cơ thể, đổ mồ hôi đêm kèm khô miệng họng, bệnh phổi mạn tính hao mòn, ngứa da, nổi mề đay.",
			"Thanh Phế nhiệt: cảm giác đầy tức ở phổi; sách cổ còn ghi nhận dùng cho rối loạn tâm thần thể hưng cảm.",
			"Giải biểu: nhiễm trùng cấp tính kèm run rẩy, sợ lạnh trong và sau khi bị bệnh.",
			"Thông kinh lạc: các chứng ở vùng cổ, lưng, vai.",
		],
	},
	BL14: {
		trang: 155,
		nhom: [
			"Sơ Can khí, điều giáng khí, khoan khoái lồng ngực, điều hoà Tâm (Du huyệt của Tâm bào): tức ngực bó chặt kiểu đau thắt ngực kèm kích động, bệnh về tim, ho, nôn mửa, đau vùng ngực và mạn sườn.",
		],
	},
	BL15: {
		trang: 156,
		nhom: [
			"Điều hoà Tâm khí, bổ Tâm, an thần (Du huyệt của Tâm): hồi hộp đánh trống ngực kèm lo âu, loạn nhịp tim, trẻ chậm nói (qua liên hệ lưỡi — Tâm), các rối loạn tâm lý — thần kinh thực vật như trầm cảm, kiệt sức, mất ngủ, sợ hãi, bồn chồn, khó tập trung, căng thẳng khi học hành thi cử.",
			"Sơ thông lồng ngực, hoá ứ huyết: đau vùng ngực và xương sườn, đau thắt ngực, ho, nổi mẩn.",
			"Thanh nhiệt, an thần: rối loạn tâm thần với hoảng sợ, ám ảnh, kích động, mất ngủ nặng kèm nhiều mộng mị (kể cả di tinh do mộng tinh), trạng thái hưng cảm, hay quên, động kinh.",
		],
	},
	BL16: {
		trang: 157,
		nhom: [
			"Sơ thông lồng ngực, điều khí ngực — bụng: đau thắt ngực, đau vùng ngực và mạn sườn, chướng bụng, bệnh ngoài da như ngứa, vảy nến, rụng tóc.",
		],
	},
	BL17: {
		trang: 158,
		nhom: [
			"Lương huyết, chỉ huyết, hoá ứ huyết, dưỡng và điều hoà khí huyết (Hội huyệt của huyết): bệnh về máu do huyết nhiệt, huyết ứ hoặc huyết hư, đau thắt ngực, các chứng đau do ứ huyết nhất là ở thượng — trung tiêu, bệnh ngoài da, chóng mặt, đổ mồ hôi đêm, sốt kèm ra mồ hôi đêm trong bệnh loãng xương (do huyết và âm hư), bệnh tâm thần nặng do ứ huyết, chứng tý mạn tính.",
			"Điều hoà cơ hoành, giáng khí nghịch: ho, khó thở, trào ngược, co thắt thực quản, rối loạn cơ hoành.",
			"Tại chỗ/theo kinh: các chứng ở vùng cột sống ngực, cứng khớp, đau dây thần kinh liên sườn.",
		],
	},
	BL18: {
		trang: 159,
		nhom: [
			"Sơ Can khí, dưỡng Can huyết, thanh Can hoả và thấp nhiệt, bình nội phong (Du huyệt của Can): rối loạn do Can khí uất kết hoặc thấp nhiệt như căng đau vùng ngực, thượng vị, mạn sườn; bệnh Can — Đởm; chảy máu do Can hoả; chóng mặt; rối loạn kinh nguyệt; rối loạn tâm thần với trạng thái hung hãn, hưng cảm; động kinh.",
			"Dưỡng mắt, lợi gân: giảm thị lực, viêm kết mạc, co thắt cơ, co rút gân.",
		],
	},
	BL19: {
		trang: 160,
		nhom: [
			"Thanh thấp nhiệt ở Can — Đởm (Du huyệt của Đởm): bệnh Can — Đởm với vàng da, đắng miệng, đau ngực và mạn sườn, rối loạn tiêu hoá.",
			"Trừ tà ở kinh Thiếu Dương: hội chứng Thiếu Dương.",
			"Bổ và điều hoà Đởm khí: lo lắng, bồn chồn.",
		],
	},
	BL20: {
		trang: 161,
		nhom: [
			"Bổ Tỳ khí và Tỳ dương, kiện trung khí, bổ khí dưỡng huyết, nhiếp huyết (Du huyệt của Tỳ): rối loạn tiêu hoá như tiêu chảy, đầy bụng, chán ăn; kiệt sức cả tâm lý lẫn thể chất; teo cơ, sa nội tạng, thiếu máu, các chứng xuất huyết.",
			"Hoá thấp: hội chứng thấp như phù nề, sưng nề, cảm giác nặng nề toàn thân.",
		],
	},
	BL21: {
		trang: 162,
		nhom: [
			"Hoà Vị, giáng nghịch khí, điều trung tiêu, trừ thấp và thức ăn ứ trệ (Du huyệt của Vị): rối loạn tiêu hoá như đau thượng vị, đầy hơi đầy bụng, rối loạn cảm giác thèm ăn, chán ăn, tiêu chảy, khối u ở bụng, phù nề.",
			"Thông kinh lạc tại chỗ: rối loạn ở vùng cột sống ngực — thắt lưng, cứng khớp, đau dây thần kinh liên sườn.",
		],
	},
	BL22: {
		trang: 163,
		nhom: [
			"Điều hoà Tam Tiêu — Vị — Tỳ, trừ thấp, tiêu khối u bụng (Du huyệt của Tam Tiêu): rối loạn tiêu hoá như đầy hơi đầy bụng, khối u bụng, khó tiêu, rối loạn thèm ăn, sôi bụng; nhức đầu, chóng mặt.",
			"Thông điều thuỷ đạo: bệnh đường tiết niệu, phù thũng.",
			"Hoà Thiếu Dương: hội chứng Thiếu Dương.",
			"Thông kinh lạc tại chỗ: rối loạn vùng thắt lưng và vai, bệnh cơ xơ hoá.",
		],
	},
	BL23: {
		trang: 164,
		nhom: [
			"Bổ Thận khí, Thận dương và Thận âm, ích tinh (Du huyệt của Thận): suy nhược mạn tính, suy giảm trí nhớ, chóng mặt, khó thở.",
			"Điều hoà hạ tiêu, hỗ trợ tử cung: bệnh mạn tính vùng tiết niệu — sinh dục.",
			"Bổ xương tuỷ: loãng xương, nhuyễn xương.",
			"Dưỡng mắt và tai: bệnh mạn tính về mắt và tai.",
			"Tăng cường sức mạnh lưng dưới: các vấn đề mạn tính ở thắt lưng và chân.",
		],
	},
	BL24: {
		trang: 165,
		nhom: [
			"Lợi thắt lưng và chân: đau lưng lan xuống chân (cả kiểu rễ thần kinh và không theo rễ).",
			"Bổ và điều hoà khí huyết hạ tiêu: rối loạn kinh nguyệt như đau bụng kinh, trĩ, tiêu chảy.",
		],
	},
	BL25: {
		trang: 166,
		nhom: [
			"Điều hoà Đại Trường, hành khí (Du huyệt của Đại Trường): rối loạn đường ruột như buồn nôn, tiêu chảy, đầy hơi, tiểu tiện và đại tiện khó khăn.",
			"Tăng cường sức mạnh lưng dưới: đau, hạn chế vận động vùng thắt lưng, các chứng ở chi dưới dọc đường kinh.",
		],
	},
	BL26: {
		trang: 168,
		nhom: [
			"Tăng cường sức mạnh lưng dưới, nhất là khi có suy Thận: đau lưng mạn tính hay tái phát.",
			"Điều hoà tiêu hoá: đầy hơi, tiêu chảy, táo bón, u xơ tử cung, bệnh đường tiết niệu, tiểu không tự chủ, rối loạn xuất tinh, viêm phần phụ.",
		],
	},
	BL27: {
		trang: 169,
		nhom: [
			"Điều hoà khí Tiểu Trường, Đại Trường và Bàng Quang (Du huyệt của Tiểu Trường): bệnh đường tiết niệu, đại tiện — tiểu tiện khó khăn, phù nề, đau bụng dưới, viêm khớp cùng chậu tại chỗ, chứng sán khí.",
			"Trừ thấp, thấp nhiệt: phù nề, tiêu chảy, viêm ruột, trĩ, táo bón.",
		],
	},
	BL28: {
		trang: 170,
		nhom: [
			"Điều hoà Bàng Quang, thanh thấp nhiệt hạ tiêu, hoá ứ, tiêu khối (Du huyệt của Bàng Quang): bệnh tiết niệu — sinh dục, tiêu chảy, khối u ở bụng.",
			"Lợi lưng dưới và chân: các vấn đề vùng thắt lưng và xương cùng.",
		],
	},
	BL29: {
		trang: 171,
		nhom: [
			"Tăng cường sức mạnh lưng dưới: đau và cứng vùng thắt lưng.",
			"Ôn trung, cầm tiêu chảy: lạnh bụng, kiết lỵ, tiêu chảy, đầy bụng, giảm tiết mồ hôi, chứng sán khí.",
		],
	},
	BL30: {
		trang: 172,
		nhom: [
			"Tăng cường sức mạnh lưng và chân: đau thắt lưng — xương cùng nặng lên khi đứng/ngồi, viêm khớp háng.",
			"Điều kinh, cầm khí hư và di tinh: khí hư (bạch đới), rối loạn xuất tinh, rối loạn kinh nguyệt như đau bụng kinh và kinh nguyệt không đều, sa trực tràng.",
		],
	},
	BL31: {
		trang: 173,
		nhom: [
			"Điều hoà hạ tiêu, lợi tiểu tiện (một trong 8 huyệt Bát Liêu ở xương cùng): rối loạn tiết niệu — sinh dục như đau bụng kinh, các chứng ở bộ phận sinh dục ngoài, khí hư âm đạo.",
			"Bổ Thận ích tinh, lợi đại tiện, hỗ trợ cơn co thắt khi sinh, lợi vùng thắt lưng cùng: công dụng chung của cả bốn huyệt Bát Liêu, được ghi nhận rõ nhất lần lượt ở Trung Liêu (BL33, bổ Thận), Hạ Liêu (BL34, lợi đại tiện) và Thứ Liêu (BL32, hỗ trợ sinh nở và vùng thắt lưng cùng).",
		],
	},
	BL32: {
		trang: 173,
		nhom: [
			"Điều hoà hạ tiêu, lợi tiểu tiện — cùng Trung Liêu (BL33) là hai huyệt Bát Liêu tác dụng mạnh nhất với bệnh tiết niệu: rối loạn tiết niệu — sinh dục như đau bụng kinh, các chứng ở bộ phận sinh dục ngoài, khí hư âm đạo.",
			"Bổ Thận ích tinh, hỗ trợ sinh sản: theo G. Maciocia là huyệt quan trọng trong điều trị hiếm muộn ở nữ.",
			"Hỗ trợ cơn co thắt khi sinh (thường phối điện châm): cơn co thắt chậm hoặc yếu trong sản khoa.",
			"Lợi vùng thắt lưng cùng — cùng Trung Liêu (BL33) là hai huyệt tác dụng mạnh nhất: đau, rối loạn cảm giác, liệt chi dưới.",
			"Hỗ trợ đại tiện: công dụng chung của nhóm Bát Liêu.",
		],
	},
	BL33: {
		trang: 173,
		nhom: [
			"Điều hoà hạ tiêu, lợi tiểu tiện — cùng Thứ Liêu (BL32) là hai huyệt Bát Liêu tác dụng mạnh nhất với bệnh tiết niệu: rối loạn tiết niệu — sinh dục như đau bụng kinh, các chứng ở bộ phận sinh dục ngoài, khí hư âm đạo.",
			"Bổ Thận ích tinh: dùng khi cơ thể kiệt sức.",
			"Lợi vùng thắt lưng cùng — cùng Thứ Liêu (BL32) là hai huyệt tác dụng mạnh nhất: đau, rối loạn cảm giác, liệt chi dưới.",
			"Hỗ trợ đại tiện: công dụng chung của nhóm Bát Liêu.",
		],
	},
	BL34: {
		trang: 173,
		nhom: [
			"Điều hoà hạ tiêu, lợi tiểu tiện — chuyên về bệnh sinh dục trong nhóm Bát Liêu: rối loạn tiết niệu — sinh dục như đau bụng kinh, các chứng ở bộ phận sinh dục ngoài, khí hư âm đạo.",
			"Hỗ trợ đại tiện: huyệt có phổ tác dụng rộng nhất trong 4 huyệt Bát Liêu về mặt này.",
			"Lợi vùng thắt lưng cùng, hỗ trợ cơn co thắt khi sinh: công dụng chung của nhóm Bát Liêu.",
		],
	},
	BL35: {
		trang: 174,
		nhom: [
			"Thanh thấp nhiệt hạ tiêu: kiết lỵ, tiêu chảy, ngứa sinh dục, khí hư.",
			"Trị trĩ: trĩ, sa trực tràng, rối loạn cương dương.",
			"Tại chỗ: giảm đau xương cụt.",
		],
	},
	BL36: {
		trang: 175,
		nhom: [
			"Thông kinh lạc, giảm đau, thư cân: đau thắt lưng cùng lan dọc đường kinh, teo cơ chân, đau lưng kèm căng cứng cơ, bệnh ở gân cơ vùng chậu và mông.",
			"Điều hoà đại tiểu tiện, tại chỗ: đại tiện — tiểu tiện khó khăn, đau vùng sinh dục, trĩ.",
		],
	},
	BL37: {
		trang: 176,
		nhom: [
			"Thông kinh lạc, giảm đau, lợi lưng dưới: đau lưng lan dọc đường kinh (không theo rễ thần kinh), teo cơ, đau và hạn chế vận động vùng thắt lưng — chân.",
		],
	},
	BL38: {
		trang: 177,
		nhom: [
			"Thư cân, giảm đau: co rút, co thắt khớp gối, đau và rối loạn cảm giác dọc đường kinh.",
			"Thanh nhiệt: rối loạn đường ruột kiểu 'nhiệt ở Tiểu Trường', táo bón.",
		],
	},
	BL39: {
		trang: 178,
		nhom: [
			"Điều hoà Tam Tiêu, thông điều thuỷ đạo (Hạ hợp huyệt của Tam Tiêu): bệnh tiết niệu như tiểu khó, bí tiểu, đái dầm, phù thũng.",
			"Thông kinh lạc, giảm đau: đau khớp gối, đau sưng vùng nách (dọc kinh cân), đầy trướng bụng, trĩ, táo bón.",
		],
	},
	BL40: {
		trang: 179,
		nhom: [
			"Thanh nhiệt (nhất là nhiệt mùa hè), cầm nôn và tiêu chảy: viêm dạ dày — ruột cấp, đầy trướng bụng, say nắng.",
			"Lương huyết: bệnh ngoài da như chàm, viêm quầng, mụn nhọt, dị ứng.",
			"Lợi Bàng Quang (Hạ hợp huyệt của Bàng Quang): bệnh đường tiết niệu.",
			"Thông kinh lạc, giảm đau, lợi lưng và gối: đau khớp gối, vùng thắt lưng cùng và chi dưới, kể cả liệt.",
		],
	},
	BL41: {
		trang: 180,
		nhom: [
			"Trừ phong hàn: đau vai, cổ, lưng trong các bệnh nhiễm trùng cấp.",
			"Thông kinh lạc, giảm đau: đau, hạn chế vận động, giảm cảm giác vùng vai, cổ, lưng trên và khuỷu tay (do nguyên nhân cơ hoặc thần kinh).",
		],
	},
	BL42: {
		trang: 181,
		nhom: [
			"Bổ dưỡng Phế, chỉ khái bình suyễn, an thần định phách: bệnh phổi mạn tính do suy nhược, hen phế quản, ho, khó thở.",
			"Thông kinh lạc, giảm đau: đau, hạn chế vận động vùng cổ, vai, lưng trên.",
			"Thanh Phế nhiệt.",
		],
	},
	BL43: {
		trang: 182,
		nhom: [
			"Bổ dưỡng Phế — Tâm — Thận — Vị — Tỳ, bổ âm, thanh hư nhiệt: các hội chứng suy nhược tạng phủ tương ứng, bệnh phổi mạn tính với ho, hen phế quản, đổ mồ hôi đêm, chứng loãng xương.",
			"An thần: mất ngủ, lú lẫn, suy giảm trí nhớ.",
			"Bổ nguyên khí: trạng thái suy yếu, kiệt sức.",
			"Hoá đờm: đờm tích tụ trong các bệnh mạn tính.",
		],
	},
	BL44: {
		trang: 183,
		nhom: [
			"Điều khí thượng tiêu, khoan khoái lồng ngực: ho, hen phế quản, tức ngực, khó nuốt.",
			"Thông kinh lạc, giảm đau: đau, hạn chế vận động vùng cột sống cổ, vai, lưng trên.",
		],
	},
	BL45: {
		trang: 184,
		nhom: [
			"Khu phong, thanh nhiệt, giáng Phế khí: sốt nhiễm trùng không ra mồ hôi, chóng mặt, ho, khó thở.",
			"Bổ khí huyết, giảm đau: nhức đầu, đau vai, ngực, xương bả vai, mạn sườn, lưng, thắt lưng, đầy bụng.",
		],
	},
	BL46: {
		trang: 185,
		nhom: [
			"Điều hoà cơ hoành, giáng nghịch khí, hoà trung tiêu: ợ chua, ợ hơi, nôn mửa, tăng tiết nước bọt, chán ăn, cảm giác đầy no.",
			"Thông kinh lạc, giảm đau: đau, cứng vùng lưng bên và ngực dọc đường kinh.",
		],
	},
	BL47: {
		trang: 186,
		nhom: [
			"Sơ Can khí, thư cân: căng đau ở vùng nối ngực — mạn sườn, co rút gân, các bệnh về khớp và xương.",
			"Điều hoà trung tiêu: viêm dạ dày — ruột, tiêu chảy, nôn mửa, khó tiêu.",
		],
	},
	BL48: {
		trang: 187,
		nhom: [
			"Điều hoà Đởm, thanh nhiệt, hoà trung tiêu: đau vùng nối ngực — mạn sườn, đau thượng vị, rối loạn dạ dày — ruột, vàng da, viêm túi mật, tiêu chảy, viêm ruột, chán ăn.",
		],
	},
	BL49: {
		trang: 188,
		nhom: [
			"Thanh nhiệt: viêm ruột, vàng da, viêm gan, tiểu khó kèm nước tiểu sẫm màu.",
			"Điều hoà Tỳ Vị: viêm dạ dày — ruột, đầy hơi, nôn mửa, cảm giác đầy no.",
			"Tại chỗ: rối loạn vùng nối thắt lưng — ngực kèm sợ lạnh.",
		],
	},
	BL50: {
		trang: 189,
		nhom: [
			"Điều hoà trung tiêu: căng bụng, viêm dạ dày — ruột, đầy hơi, nôn mửa, khó tiêu.",
			"Tại chỗ: rối loạn vùng nối thắt lưng — ngực kèm sợ lạnh.",
		],
	},
	BL51: {
		trang: 190,
		nhom: [
			"Hành khí, tiêu ứ trệ: căng bụng, bệnh dạ dày, táo bón.",
			"Huyệt xa trị vú: viêm tuyến vú, bệnh lý ở vú.",
		],
	},
	BL52: {
		trang: 191,
		nhom: [
			"Bổ Thận ích tinh, điều hoà tiểu tiện: rối loạn chức năng tình dục như liệt dương, rối loạn xuất tinh, bệnh ở cơ quan sinh dục, rối loạn tiểu tiện, phù thũng.",
			"Lợi lưng dưới: hạn chế vận động cột sống thắt lưng.",
		],
	},
	BL53: {
		trang: 192,
		nhom: [
			"Thông kinh lạc, giảm đau, lợi lưng dưới: đau thắt lưng hoặc xương cùng, đau thần kinh toạ, cứng khớp chân.",
			"Điều hoà hạ tiêu: tiểu khó, xu hướng phù nề, phì đại tuyến tiền liệt, táo bón.",
		],
	},
	BL54: {
		trang: 193,
		nhom: [
			"Thông kinh lạc, giảm đau, lợi lưng dưới: các chứng ở thắt lưng, mông và chi dưới, đau thần kinh toạ.",
			"Điều hoà tiểu tiện, trị trĩ: bí tiểu, tiểu khó, phì đại tuyến tiền liệt, trĩ.",
		],
	},
	BL55: {
		trang: 194,
		nhom: [
			"Thông kinh lạc, giảm đau: đau lưng kiểu rễ thần kinh lan xuống bụng, sinh dục hoặc chân, có thể kèm liệt, rối loạn cảm giác nóng mặt trong đùi.",
			"Cầm máu tử cung, giảm đau sinh dục: rong huyết cơ năng, đau vùng sinh dục, chứng sán khí, khí hư.",
		],
	},
	BL56: {
		trang: 195,
		nhom: [
			"Thư cân, thông kinh lạc, giảm đau: chuột rút bắp chân, co giật — co thắt cơ dọc lưng cơ thể, đau gót chân và mu bàn chân, sưng nách (theo kinh cân Bàng Quang).",
			"Trị trĩ (theo kinh): huyệt kinh nghiệm cắt trĩ, đại tiện khó, nứt hậu môn, sa trực tràng.",
		],
	},
	BL57: {
		trang: 196,
		nhom: [
			"Thư cân, thông kinh lạc, giảm đau: đau, chuột rút bắp chân, cẳng chân, gót chân, các chứng ở vùng lưng — thắt lưng.",
			"Trị trĩ (theo kinh): huyệt kinh nghiệm cắt trĩ, đại tiện khó, nứt hậu môn, sa trực tràng.",
		],
	},
	BL58: {
		trang: 197,
		nhom: [
			"Thông kinh lạc, giảm đau: đau thắt lưng, các chứng ở bắp chân, cẳng chân.",
			"Khu phong, điều hoà trên — dưới (Lạc huyệt): sốt nhiễm trùng không ra mồ hôi, nhức đầu, chóng mặt, nóng đầu, chảy máu cam, hưng cảm, động kinh.",
			"Trị trĩ (theo kinh): bệnh trĩ.",
		],
	},
	BL59: {
		trang: 198,
		nhom: [
			"Thông kinh lạc, giảm đau, lợi lưng và chân: đau lưng và chân do rễ thần kinh hoặc thần kinh ngoại biên, loét chân, đau cổ chân, co giật cơ, chuột rút, đau mắt.",
			"Thông mạch Dương Kiều (Khích huyệt): hội chứng phong thấp với sưng khớp và đau lan toả, nhất là một bên cơ thể.",
		],
	},
	BL60: {
		trang: 199,
		nhom: [
			"Thanh nhiệt, tả thực chứng ở đầu, bình phong (Huyệt Kinh): nhức đầu các loại (nhất là vùng chẩm), chóng mặt, chảy máu cam, bệnh về mắt, động kinh, cứng hàm, đau răng hàm trên.",
			"Thông kinh lạc, thư cân, giảm đau, lợi lưng: các chứng dọc đường kinh ở cột sống cổ, vẹo cổ, vai, lưng, đau thắt lưng mạn tính, rối loạn khớp cổ chân.",
			"Trợ sinh: chuyển dạ kéo dài, sót nhau.",
		],
	},
	BL61: {
		trang: 200,
		nhom: [
			"Thông kinh lạc, thư cân, giảm đau: nhức đầu, đau lưng, thắt lưng, đầu gối, gót chân, chuột rút chân, tiểu khó, cảm giác nặng đầu, động kinh, hưng cảm, rối loạn tâm thần.",
		],
	},
	BL62: {
		trang: 201,
		nhom: [
			"Bình nội phong, thanh nhiệt vùng đầu, an thần, dưỡng mắt: nhức đầu, chóng mặt, động kinh, hưng cảm, bệnh về mắt.",
			"Khu phong tà: sốt nhiễm trùng.",
			"Thông điều mạch Dương Kiều: rối loạn giấc ngủ.",
			"Thông kinh lạc, giảm đau: các chứng ở cột sống, dọc đường kinh, vùng cổ chân — gót chân.",
			"Theo kinh cân: sưng vùng nách và cổ.",
		],
	},
	BL63: {
		trang: 202,
		nhom: [
			"Thông kinh lạc, trị chứng cấp (Khích huyệt): đau cấp tính và hạn chế vận động dọc đường kinh, nhất là vùng thắt lưng và chi dưới, chứng sán khí cấp.",
			"Bình nội phong, an thần: hưng cảm, động kinh, động kinh cục bộ ở trẻ em.",
		],
	},
	BL64: {
		trang: 204,
		nhom: [
			"Thanh sáng đầu mắt, bình phong (Nguyên huyệt): nhức đầu dữ dội kiểu muốn vỡ đầu, nặng đầu, rối loạn thị giác, chóng mặt, phát ban khoé mắt trong, viêm mũi.",
			"An thần: hồi hộp đánh trống ngực, hưng cảm, lo âu, bồn chồn, động kinh.",
			"Thông kinh lạc, giảm đau: các chứng ở cổ, lưng, chân.",
		],
	},
	BL65: {
		trang: 205,
		nhom: [
			"Thanh sáng đầu mắt: nhức đầu vùng chẩm, cứng cổ, điếc, chóng mặt, bệnh về mắt.",
			"Thanh nhiệt, tiêu sưng: sốt nhiễm trùng, bệnh ngoài da như nhọt, trĩ, tiêu chảy.",
			"Thông kinh lạc, giảm đau: các chứng ở lưng, thắt lưng, chân.",
		],
	},
	BL66: {
		trang: 207,
		nhom: [
			"Thanh nhiệt, trừ tà ở đầu: nhức đầu, đau họng, chóng mặt, viêm kết mạc, chảy máu cam, hưng cảm, bồn chồn.",
			"Giáng Phế khí và Vị khí: ho, khó thở, tức ngực, nôn mửa, ợ hơi, khó nuốt, thức ăn không tiêu ra theo phân.",
		],
	},
	BL67: {
		trang: 208,
		nhom: [
			"Chuyển ngôi thai (đã có bằng chứng khoa học): xoay thai ngôi mông về ngôi đầu trước sinh — cứu ngải hoặc châm vào huyệt này đạt hiệu quả cao (khoảng 70–80%).",
			"Trợ sinh: điều hoà và kích thích cơn co thắt tử cung khi chuyển dạ.",
			"Khu phong, sáng mắt và đầu, nhất là chứng cấp tính: nhức đầu vùng đỉnh — chẩm, viêm kết mạc, đau mắt, viêm mũi, đau họng, điếc, ù tai, đau dây thần kinh liên sườn.",
			"Điều hoà âm dương, thông điều thuỷ đạo: tiểu khó, cảm giác nóng ở bàn chân.",
		],
	},

	// ── KI — Thận (27) ──────────────────────────────────────────────
	KI1: {
		trang: 211,
		nhom: [
			"Hồi dương cứu nghịch (chứng thoát dương): suy sụp, bất tỉnh, sốc.",
			"Giáng nghịch, hạ áp, thanh đầu não: nhức đầu dữ dội, đau nửa đầu, chóng mặt, huyết áp cao, co giật, ngất xỉu, cảm giác khí xông ngược từ bụng dưới lên ngực (chứng Bôn Đồn).",
			"An thần: bồn chồn, hưng cảm, kích động, mất ngủ nặng.",
		],
	},
	KI2: {
		trang: 212,
		nhom: [
			"Thanh hư nhiệt: đau họng kèm khô miệng, khàn tiếng, ra mồ hôi trộm ban đêm, nóng lòng bàn chân, hội chứng chân không yên.",
			"Điều hoà Thận và tiểu tiện: ngứa sinh dục, rối loạn kinh nguyệt, vô sinh, sa tử cung, giảm ham muốn tình dục, liệt dương.",
			"Tại chỗ: đau hoặc phù nề vùng xương bàn chân.",
		],
	},
	KI3: {
		trang: 213,
		nhom: [
			"Bổ Thận âm lẫn Thận dương, thanh hư nhiệt, giúp Thận nạp khí cho Phế (Nguyên huyệt của Thận): suy nhược mạn tính, giảm thính lực, ù tai, chóng mặt, mất ngủ, bệnh hô hấp mạn tính, táo bón do âm hư, bệnh mạn tính đường sinh dục — tiết niệu (rối loạn tiểu tiện, rối loạn kinh nguyệt, triệu chứng mãn kinh, hiếm muộn), rối loạn chức năng tình dục như liệt dương.",
			"Tăng cường sức mạnh lưng dưới, tại chỗ: các vấn đề mạn tính ở thắt lưng, đầu gối, cổ chân.",
		],
	},
	KI4: {
		trang: 214,
		nhom: [
			"Bổ Thận khí, trợ Phế (Lạc huyệt): mệt mỏi kiệt sức, khó thở, hen phế quản, khô họng, hội chứng cột sống thắt lưng, tiểu khó.",
			"Ích chí, an thần: yếu ý chí, lo âu, kích động, hồi hộp khi lo lắng, mất ngủ.",
			"Tại chỗ: đau gót chân, đau nhức cơ, cứng đau vùng thắt lưng.",
		],
	},
	KI5: {
		trang: 215,
		nhom: [
			"Điều hoà mạch Xung — Nhâm, lợi kinh nguyệt và tiểu tiện (Khích huyệt): đau bụng kinh, kinh nguyệt không đều, vô kinh (cả thể hư lẫn thực), nhiễm trùng đường tiết niệu cấp, tiểu khó.",
		],
	},
	KI6: {
		trang: 215,
		nhom: [
			"Bổ Thận âm, thanh hư nhiệt, lợi họng, điều hoà hạ tiêu và mạch Âm Kiều: bệnh mạn tính ở mắt và họng, đau họng, chóng mặt, táo bón do âm hư, rối loạn đường sinh dục, rối loạn kinh nguyệt (đau bụng kinh, vô kinh, chu kỳ không đều), chuyển dạ kéo dài, sa tử cung, triệu chứng mãn kinh, chứng sán khí, căng cứng mặt trong hai chân, đầy bụng.",
			"An thần: mất ngủ, bồn chồn, kích động, hoặc ngược lại buồn ngủ nhiều.",
			"Tại chỗ: đau, rối loạn vận động khớp cổ chân (sấp/ngửa).",
		],
	},
	KI7: {
		trang: 216,
		nhom: [
			"Thông điều thuỷ đạo, tiêu phù, bổ Thận (nhất là Thận dương), trừ thấp — thấp nhiệt: các loại phù nề, bệnh tiết niệu (rối loạn bài tiết nước tiểu, nhiễm trùng tiết niệu, di tinh), bệnh đường ruột do thấp nhiệt như tiêu chảy, viêm ruột; là huyệt Kinh nên còn trị khô miệng lưỡi.",
			"Điều hoà việc ra mồ hôi: rối loạn tiết mồ hôi.",
			"Tăng cường sức mạnh vùng thắt lưng: đau thắt lưng do khí trệ và Thận hư.",
		],
	},
	KI8: {
		trang: 217,
		nhom: [
			"Điều kinh, điều hoà mạch Nhâm — Xung, thông mạch Âm Kiều (Khích huyệt): rối loạn kinh nguyệt, chảy máu tử cung, sa tử cung, đau cột sống thắt lưng lan mặt trong chân.",
			"Thanh nhiệt, trừ thấp hạ tiêu: viêm đau ngứa sưng vùng sinh dục (viêm phần phụ, viêm tuyến tiền liệt), tiểu khó, bí tiểu, tiêu chảy, đại tiện khó.",
		],
	},
	KI9: {
		trang: 218,
		nhom: [
			"Thanh nhiệt, hoá đờm, an thần: rối loạn tâm thần như trầm cảm, bồn chồn, hưng cảm, kích động.",
			"Điều khí, giảm đau: đau mặt trong hai chân, chuột rút bắp chân.",
		],
	},
	KI10: {
		trang: 219,
		nhom: [
			"Dẫn thấp nhiệt ra khỏi hạ tiêu, bổ trợ Thận: bệnh vùng sinh dục như rối loạn tiểu tiện, đau ngứa sinh dục, đau bụng dưới lan xuống sinh dục và mặt trong đùi, chảy máu tử cung, rối loạn cương dương, hiếm muộn.",
			"Thông kinh lạc, giảm đau: đau mặt trong đầu gối và đùi.",
		],
	},
	KI11: {
		trang: 220,
		nhom: [
			"Điều hoà hạ tiêu và đường tiểu, bổ Thận: bệnh nam khoa — tiết niệu như tiểu khó, bí tiểu, đái dầm, viêm tuyến tiền liệt, hiếm muộn, liệt dương, rối loạn xuất tinh, đau vùng chậu và sinh dục, sa tử cung, sa trực tràng.",
		],
	},
	KI12: {
		trang: 221,
		nhom: [
			"Bổ Thận, ích tinh khí: đau vùng sinh dục nhất là dương vật, rối loạn cương dương (liệt dương, rối loạn xuất tinh), khí hư, sa tử cung.",
		],
	},
	KI13: {
		trang: 222,
		nhom: [
			"Điều hoà hạ tiêu, mạch Xung — Nhâm: rối loạn kinh nguyệt như chu kỳ không đều, vô kinh, chảy máu tử cung, khí hư, hiếm muộn, bệnh tiết niệu như tiểu khó, bí tiểu, đái dầm, đau bụng và thắt lưng, tiêu chảy mạn tính, cảm giác khí xông ngược từ bụng dưới lên ngực (chứng Bôn Đồn).",
		],
	},
	KI14: {
		trang: 223,
		nhom: [
			"Điều hoà hạ tiêu, hành khí, hoá ứ huyết, giảm đau: rối loạn kinh nguyệt như chu kỳ không đều, đau bụng kinh, khí hư, đau sau sinh, bế kinh, rối loạn xuất tinh, tiêu chảy, cảm giác khí xông ngược lên ngực (chứng Bôn Đồn).",
			"Thông điều thuỷ đạo: phù nề, cổ trướng.",
		],
	},
	KI15: {
		trang: 224,
		nhom: [
			"Điều hoà Trường và hạ tiêu: rối loạn đường ruột như táo bón, phân khô, tiêu chảy, đau bụng, các chứng ở cột sống thắt lưng, cảm giác nóng bụng dưới, kinh nguyệt không đều, cảm giác khí xông ngược lên ngực (chứng Bôn Đồn).",
		],
	},
	KI16: {
		trang: 225,
		nhom: [
			"Điều khí, ôn ấm và điều hoà Vị Trường (nhất là khi có hàn tích hoặc Thận dương hư): táo bón, phân khô, tiêu chảy, đau bụng, đầy hơi, buồn nôn, nôn, đau bụng từng cơn; y học hiện đại còn dùng cho rối loạn nhau bong non.",
		],
	},
	KI17: {
		trang: 226,
		nhom: [
			"Trừ ứ trệ, giảm đau: rối loạn tiêu hoá như khối u ở bụng, chán ăn, táo bón, tiêu chảy, nôn mửa.",
		],
	},
	KI18: {
		trang: 227,
		nhom: [
			"Điều khí hạ tiêu, hoạt huyết hoá ứ, hoà Vị, giảm đau: rối loạn tiêu hoá như buồn nôn, nôn, tăng tiết nước bọt, đau bụng kiểu ứ huyết, táo bón, đau sau sinh, đau vùng bụng và mạn sườn, ứ huyết tử cung, hiếm muộn.",
		],
	},
	KI19: {
		trang: 228,
		nhom: [
			"Giáng nghịch khí, hoà Vị: buồn nôn, nôn, đầy đau vùng bụng trên và thượng vị, táo bón, hiếm muộn, rong huyết tử cung, ho, tức ngực.",
		],
	},
	KI20: {
		trang: 229,
		nhom: [
			"Điều hoà trung tiêu, khoan khoái lồng ngực, hoá đờm: buồn nôn, nôn, đau vùng bụng trên và mạn sườn, viêm dạ dày, đầy hơi, táo bón, thức ăn ứ đọng, ho, khó thở, hồi hộp đánh trống ngực.",
		],
	},
	KI21: {
		trang: 230,
		nhom: [
			"Kiện Tỳ, hoà Vị, giáng nghịch khí, sơ Can: buồn nôn, nôn, đầy bụng, chán ăn, ợ nóng, viêm dạ dày, tăng tiết nước bọt, nấc cụt, nôn nghén khi mang thai, căng tức mạn sườn, viêm tuyến vú.",
		],
	},
	KI22: {
		trang: 231,
		nhom: [
			"Điều hoà Phế khí, giáng Vị khí nghịch, khoan khoái lồng ngực: ho, khó thở, hen suyễn, tức ngực, buồn nôn, chán ăn, viêm tuyến vú.",
		],
	},
	KI23: {
		trang: 232,
		nhom: [
			"Điều hoà Phế khí, giáng Vị khí nghịch, khoan khoái lồng ngực: ho, khó thở, hen suyễn, tức ngực, buồn nôn, nôn, chán ăn.",
			"Lợi sữa: viêm tuyến vú, rối loạn tiết sữa.",
		],
	},
	KI24: {
		trang: 233,
		nhom: [
			"Điều hoà Phế khí, giáng Vị khí nghịch: ho, khó thở, hen phế quản, buồn nôn, nôn, chán ăn.",
			"Khoan khoái lồng ngực: tức nặng ngực, hồi hộp đánh trống ngực, bồn chồn.",
			"Lợi sữa: viêm tuyến vú.",
		],
	},
	KI25: {
		trang: 234,
		nhom: [
			"Điều hoà Phế khí, giáng Vị khí nghịch: ho, khó thở, hen phế quản, buồn nôn, nôn, chán ăn.",
			"Khoan khoái lồng ngực: tức ngực, đau dây thần kinh liên sườn.",
		],
	},
	KI26: {
		trang: 235,
		nhom: [
			"Điều hoà Phế khí, giáng Vị khí nghịch, hoá đờm: ho, khó thở, hen phế quản, tắc nghẽn đường hô hấp dưới, nôn mửa, tăng tiết nước bọt.",
			"Khoan khoái lồng ngực: tức ngực, đau dây thần kinh liên sườn, hồi hộp đánh trống ngực.",
			"Lợi sữa: viêm tuyến vú.",
		],
	},
	KI27: {
		trang: 236,
		nhom: [
			"Điều hoà Phế khí, giáng Vị khí nghịch, hoá đờm: ho, khó thở, hen phế quản, đờm ở đường hô hấp dưới, buồn nôn, nôn, tăng tiết nước bọt, căng bụng, đầy hơi.",
			"Khoan khoái lồng ngực: tức ngực, đau dây thần kinh liên sườn.",
		],
	},
};
let boSo = Object.entries(HO_SO);
if (gioiHanKinh) boSo = boSo.filter(([ma]) => gioiHanKinh.has(tienToKinh(ma)));

console.log(
	`Hồ sơ đã duyệt (lô 2 — SI/BL/KI): ${Object.keys(HO_SO).length} huyệt.` +
		(gioiHanKinh ? ` --kinh giới hạn còn ${boSo.length}.` : ""),
);
if (chiThu) {
	for (const [ma, v] of boSo) console.log(`  ${ma.padEnd(5)} tr${v.trang}  ${v.nhom.length} nhóm`);
	process.exit(0);
}

const env = parseEnv(readFileSync(resolve(goc, "cms/.env"), "utf8"));
const kho = new Client({
	host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
	database: env.PGDATABASE,
	ssl: { ca: readFileSync(resolve(goc, "cms/aiven-ca.pem"), "utf8"), rejectUnauthorized: true },
});
await kho.connect();

// Phép kiểm 1 (TRƯỚC khi ghi): đối chiếu mã huyệt trong hồ sơ với mã huyệt có thật
// trong CSDL — bắt sai lệch tiền tố (như KI23→K23) trước khi UPDATE âm thầm ghi trượt
// 0 hàng.
const maCanKiem = boSo.map(([ma]) => ma);
const coTrongKho = await kho.query(
	"SELECT ma_huyet FROM ec_huyet_vi WHERE ma_huyet = ANY($1::text[]) AND deleted_at IS NULL",
	[maCanKiem],
);
const boCoTrongKho = new Set(coTrongKho.rows.map((r) => r.ma_huyet));
const thieuTrongKho = maCanKiem.filter((ma) => !boCoTrongKho.has(ma));
console.log(
	`\nĐối chiếu mã huyệt: ${maCanKiem.length} mã trong hồ sơ, ${boCoTrongKho.size} mã tìm thấy trong CSDL (khớp thẳng theo ma_huyet).`,
);
if (thieuTrongKho.length) {
	console.log(`  ✗ KHÔNG khớp thẳng theo ma_huyet: ${thieuTrongKho.join(", ")}`);
	for (const ma of thieuTrongKho) {
		if (BO_QUA_MA_LECH[ma]) console.log(`     · ${ma} (BỎ QUA): ${BO_QUA_MA_LECH[ma]}`);
		else if (KHOP_THEO_SLUG[ma]) console.log(`     · ${ma} (ghi theo slug='${KHOP_THEO_SLUG[ma]}'): mã ma_huyet đang NULL, vị trí đã đối chiếu khớp huyệt này.`);
		else if (KHOP_THEO_MA_KHAC[ma]) console.log(`     · ${ma} (ghi theo mã khác='${KHOP_THEO_MA_KHAC[ma]}'): CSDL lưu mã lệch tiền tố, đã đối chiếu khớp huyệt này bằng title/slug.`);
		else console.log(`     · ${ma}: KHÔNG có ánh xạ dự phòng — sẽ ghi trượt 0 hàng, cần soát tay.`);
	}
} else console.log("  ✓ khớp đủ, không lệch mã.");

if (chiKiem) {
	await kho.end();
	process.exit(0);
}

await kho.query("ALTER TABLE ec_huyet_vi DISABLE TRIGGER USER").catch(() => {});

let n = 0;
const boQua = [];
for (const [ma, v] of boSo) {
	if (BO_QUA_MA_LECH[ma]) { boQua.push(ma); continue; }
	const slugThayThe = KHOP_THEO_SLUG[ma];
	const maThucGhi = KHOP_THEO_MA_KHAC[ma] || ma;
	const r = slugThayThe
		? await kho.query(
				"UPDATE ec_huyet_vi SET cong_dung_nhom = $1 WHERE slug = $2 AND deleted_at IS NULL",
				[JSON.stringify(v), slugThayThe],
			)
		: await kho.query(
				"UPDATE ec_huyet_vi SET cong_dung_nhom = $1 WHERE ma_huyet = $2 AND deleted_at IS NULL",
				[JSON.stringify(v), maThucGhi],
			);
	n += r.rowCount;
}

await kho.query("ALTER TABLE ec_huyet_vi ENABLE TRIGGER USER").catch(() => {});
console.log(`\nGhi cong_dung_nhom cho ${n} huyệt.` + (boQua.length ? ` Bỏ qua ${boQua.length}: ${boQua.join(", ")} (xem BO_QUA_MA_LECH ở đầu file).` : ""));

// Phép kiểm 2 (SAU khi ghi): đếm theo kinh.
const cacKinh = [...new Set(boSo.map(([ma]) => tienToKinh(ma)))];
const demTheoKinh = await kho.query(
	`SELECT substring(ma_huyet from '^[A-Za-z]+') AS kinh, count(*)::int n
	 FROM ec_huyet_vi
	 WHERE cong_dung_nhom IS NOT NULL AND deleted_at IS NULL
	   AND substring(ma_huyet from '^[A-Za-z]+') = ANY($1::text[])
	 GROUP BY 1 ORDER BY 1`,
	[cacKinh],
);
console.log("\nSố huyệt có cong_dung_nhom theo kinh (đếm theo tiền tố ma_huyet, KHÔNG gồm các mã ghi qua slug/mã khác — xem hai dòng dưới):");
for (const row of demTheoKinh.rows) console.log(`  ${row.kinh}: ${row.n}`);
const slugTargets = Object.values(KHOP_THEO_SLUG);
if (slugTargets.length) {
	const demTheoSlug = await kho.query(
		"SELECT slug, (cong_dung_nhom IS NOT NULL) AS co FROM ec_huyet_vi WHERE slug = ANY($1::text[]) AND deleted_at IS NULL",
		[slugTargets],
	);
	for (const row of demTheoSlug.rows) console.log(`  (khớp theo slug, ma_huyet NULL) ${row.slug}: ${row.co ? "đã ghi" : "chưa ghi"}`);
}
const maKhacTargets = Object.values(KHOP_THEO_MA_KHAC);
if (maKhacTargets.length) {
	const demTheoMaKhac = await kho.query(
		"SELECT ma_huyet, (cong_dung_nhom IS NOT NULL) AS co FROM ec_huyet_vi WHERE ma_huyet = ANY($1::text[]) AND deleted_at IS NULL",
		[maKhacTargets],
	);
	for (const row of demTheoMaKhac.rows) console.log(`  (khớp theo mã khác, lệch tiền tố) ${row.ma_huyet}: ${row.co ? "đã ghi" : "chưa ghi"}`);
}

// Phép kiểm 3: in BL23 (Thận Du), BL40 (Uỷ Trung) và KI3 (Thái Khê) để soát giọng văn
// — ba huyệt kinh điển, đại diện nhóm Bối Du huyệt (BL23) và Hợp huyệt (BL40, KI3
// là Nguyên huyệt).
const mauSoat = await kho.query(
	"SELECT ma_huyet, title, cong_dung_nhom FROM ec_huyet_vi WHERE ma_huyet = ANY($1::text[]) AND deleted_at IS NULL",
	[["BL23", "BL40", "KI3"]],
);
console.log("\nMẫu soát giọng văn:");
for (const row of mauSoat.rows) console.log(`  ${row.ma_huyet} ${row.title}:\n`, JSON.stringify(row.cong_dung_nhom, null, 2));

// Phép kiểm 4: hình dạng — mọi cong_dung_nhom vừa ghi phải có "nhom" là mảng CHUỖI,
// không được lẫn object con (đó là thứ làm td_chu() nuốt trắng mà không báo lỗi).
// ⚠️ Cột cong_dung_nhom là kiểu `json` (không phải `jsonb`) — dùng json_array_elements/
// json_typeof, KHÔNG dùng bản jsonb_* (đã đo: jsonb_array_elements(json) báo lỗi 42883
// "function ... does not exist", không lặng lẽ tự ép kiểu).
// Gộp cả mã ghi qua slug/mã-khác vào tập kiểm để không bỏ sót KI15/KI23.
const maThucTeDaGhi = boSo
	.filter(([ma]) => !BO_QUA_MA_LECH[ma])
	.map(([ma]) => KHOP_THEO_MA_KHAC[ma] || ma);
const kiemHinh = await kho.query(
	`SELECT coalesce(ma_huyet, slug) AS dinh_danh
	 FROM ec_huyet_vi
	 WHERE deleted_at IS NULL
	   AND (ma_huyet = ANY($1::text[]) OR slug = ANY($2::text[]))
	   AND cong_dung_nhom IS NOT NULL
	   AND EXISTS (
	     SELECT 1 FROM json_array_elements(cong_dung_nhom->'nhom') AS phan_tu
	     WHERE json_typeof(phan_tu) <> 'string'
	   )`,
	[maThucTeDaGhi, slugTargets],
);
console.log(
	`\nKiểm hình dạng: ${
		kiemHinh.rows.length
			? "✗ CÓ " + kiemHinh.rows.length + " huyệt lẫn object trong nhom: " + kiemHinh.rows.map((r) => r.dinh_danh).join(", ")
			: "✓ tất cả cong_dung_nhom.nhom vừa ghi đều là mảng chuỗi, không lẫn object."
	}`,
);

// Phép kiểm 5: xác nhận trigger USER đã bật lại (tgenabled='O' = origin/bật;
// 'D' = disabled). Chạy bằng pg_trigger vì ALTER ... ENABLE TRIGGER USER có thể
// "thành công" theo nghĩa không báo lỗi ngay cả khi không có trigger nào bị tắt.
const trig = await kho.query(
	"SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid = 'ec_huyet_vi'::regclass AND NOT tgisinternal ORDER BY tgname",
);
console.log("\nTrạng thái trigger USER trên ec_huyet_vi sau khi bật lại (tgenabled='O' là đang bật):");
if (trig.rows.length) for (const row of trig.rows) console.log(`  ${row.tgname}: tgenabled=${row.tgenabled}`);
else console.log("  (không có trigger USER nào trên bảng — không có gì để bật/tắt)");

console.log("\n→ Đợi ĐỦ CẢ BỐN LÔ rồi mới chạy một lượt (KHÔNG chạy giữa lô):");
console.log("   node scripts-di-cu/dung-chi-muc.mjs huyet_vi");
console.log("   node scripts-di-cu/xuat-huyet-js.mjs");
await kho.end();
