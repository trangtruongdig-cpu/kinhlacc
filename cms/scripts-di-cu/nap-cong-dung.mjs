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
// LÔ 1/4: 93 huyệt bốn kinh LI (Đại Trường, 20), ST (Vị, 44 huyệt có trong nguồn —
// nguồn không có ST17), SP (Tỳ, 20 huyệt có trong nguồn — nguồn không có SP20), HE
// (Tâm, 9). Mỗi bullet "●" trong nguyenVan của nguồn ↔ một phần tử "nhom", TRỪ LI5:
// nguồn có 3 bullet nhưng bullet thứ 3 ("Rối loạn tâm thần như bồn chồn kèm theo sốt,
// trạng thái phấn khích.") không mang tên nhóm riêng — gộp vào bullet 2 ("Thanh hỏa
// dương minh, an thần") để giữ đúng khuôn "Nhóm: chỉ định", không bịa thêm sự kiện.
//
// ⚠️ MÃ CSDL LỆCH QUY ƯỚC: kinh Tâm dùng tiền tố HE (không phải HT như nguồn Focks/
// Phùng Văn Chiến ghi) — khoá HO_SO dưới đây dùng HE1..HE9 để khớp cột ma_huyet. Đã
// kiểm bằng truy vấn trước khi ghi (xem báo cáo lô), không giả định.
//
// ⚠️ HÌNH DẠNG JSON — đã ĐO THẬT bằng cách gọi thẳng hàm td_chu() (cms/sql/chi-muc-
// tra-cuu.sql) trước khi chốt, KHÔNG đoán:
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
//   node scripts-di-cu/nap-cong-dung.mjs --kinh=LI,ST     # giới hạn lô ghi theo kinh (mặc định: cả lô)
//   node scripts-di-cu/nap-cong-dung.mjs
//
// ⚠️ Bốn lô (LI/ST/SP/HE rồi ba kinh còn lại) đều ghi qua bản HO_SO của CHÍNH LÔ ĐÓ —
// đừng chạy lại lô cũ sau khi đã thay HO_SO bằng lô mới, dữ liệu lô cũ sẽ không được
// ghi lại (không mất, chỉ là không có tác dụng gì).
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

// ⚠️ Hai lệch mã PHÁT HIỆN KHI KIỂM (không phải chuyện HE/HT đã biết trước) — đo bằng
// truy vấn, không đoán:
//   ST3 (Cự Liêu, mặt, dưới Tứ Bạch/ST2): CSDL đang gán ma_huyet='GB29' cho ĐÚNG hàng
//     này (slug cu-lieu-2) — lệch mã liên kinh có sẵn từ trước (kiểu lỗi giống
//     loi-trung-ten-huyet-bo-dau.md). Hàng slug='cu-lieu' (không có mã, VỊ TRÍ đúng là
//     hông — tức GB29 thật) mới là chỗ đáng lẽ phải mang mã GB29. Sửa ma_huyet không
//     nằm trong phạm vi việc này (đụng sang kinh Đởm) nên BỎ QUA, không ghi.
//   ST7 (Hạ Quan, trước tai dưới gò má): CSDL không có hàng nào mang ma_huyet='ST7' —
//     hàng slug='ha-quan' đúng vị trí ST7 nhưng ma_huyet đang NULL (thiếu mã, không
//     phải lệch mã). Ghi theo slug cho riêng trường hợp này, không đụng cột ma_huyet.
const BO_QUA_MA_LECH = {
	ST3: "ma_huyet='GB29' đang gán nhầm cho hàng slug=cu-lieu-2 (vị trí mặt, đúng là ST3); GB29 thật (slug=cu-lieu, vị trí hông) lại không có mã — lệch mã liên kinh có sẵn từ trước, sửa ma_huyet nằm ngoài phạm vi việc này nên bỏ qua.",
};
const KHOP_THEO_SLUG = {
	ST7: "ha-quan",
};

// Hồ sơ ĐÃ DUYỆT — lô 1: LI1…LI20, ST1…ST45 (trừ ST17), SP1…SP21 (trừ SP20), HE1…HE9.
// `trang` là số trang trong bản dịch Focks/Phùng Văn Chiến đã đối chiếu (để truy
// nguồn); mỗi phần tử của `nhom` là "Tên nhóm công dụng: chỉ định cụ thể" viết lại
// bằng lời riêng, giữ nguyên SỰ KIỆN so với cms/.tam-focks/hoso.json.
const HO_SO = {
	// ── LI — Đại Trường (20) ──────────────────────────────────────────────
	LI1: {
		trang: 20,
		nhom: [
			"Thanh nhiệt, tiêu sưng: đau họng, viêm họng, đau răng, sưng hàm dưới, sốt cao, ù tai, điếc tai.",
			"Thông kinh lạc: đau vai gáy lan xuống hố xương đòn, tê các ngón tay.",
			"Khai khiếu, hồi tỉnh: suy sụp, bất tỉnh.",
		],
	},
	LI2: {
		trang: 21,
		nhom: [
			"Thanh nhiệt, khu phong, tiêu sưng giảm đau: đau nhức răng, khô miệng, chảy máu cam, đau họng, viêm họng, viêm thanh quản, viêm kết mạc mắt.",
		],
	},
	LI3: {
		trang: 22,
		nhom: [
			"Khu phong, thanh nhiệt, lợi họng răng: viêm nhiễm vùng mặt và miệng, viêm họng, đau răng, chảy máu cam, đau mắt cấp.",
			"Tiêu trướng, cầm tiêu chảy: tiêu chảy, sôi bụng.",
			"Thông kinh lạc tại chỗ: cứng, sưng, đau ở ngón tay và mu bàn tay (thường phối với huyệt Hậu Khê — SI3).",
		],
	},
	LI4: {
		trang: 23,
		nhom: [
			"Giải biểu, khu phong: cảm mạo, nhiễm trùng.",
			"Điều hoà vùng đầu mặt: các chứng ở đầu, đặc biệt vùng mặt, liệt mặt.",
			"Điều hoà vệ khí, cầm/điều tiết mồ hôi: rối loạn ra mồ hôi.",
			"Thông kinh lạc, giảm đau: đau, co cứng chi trên, giảm đau toàn thân nói chung.",
			"Trợ sinh: hỗ trợ, thúc đẩy chuyển dạ.",
			"Hồi dương cứu nghịch: suy sụp, ngất xỉu, bất tỉnh.",
		],
	},
	LI5: {
		trang: 24,
		nhom: [
			"Lợi khớp cổ tay: các vấn đề ở cổ tay, đau gân cơ tại chỗ.",
			"Thanh hoả Dương Minh, an thần: viêm xoang, chảy máu cam, viêm mắt, viêm tai giữa, viêm họng, đau răng; rối loạn tâm thần như bồn chồn kèm sốt, trạng thái hưng phấn.",
		],
	},
	LI6: {
		trang: 25,
		nhom: [
			"Khu phong, thanh nhiệt (nhất là vùng mặt): đau răng, các vấn đề về hàm, viêm kết mạc, viêm mũi, bệnh về tai giai đoạn cấp.",
			"Thông điều thuỷ đạo: phù nề, rối loạn tiểu tiện, ứ dịch gây phù.",
			"Thông kinh lạc: các chứng vùng thượng tiêu theo đường kinh.",
		],
	},
	LI7: {
		trang: 26,
		nhom: [
			"Trị chứng cấp: hội chứng đau vai – cánh tay, đau/viêm vùng mặt và cổ.",
			"Thanh nhiệt, giải độc: mụn nhọt, viêm da mặt, viêm họng, viêm amidan, liệt mặt.",
			"Thanh nhiệt Dương Minh, an thần: trạng thái kích động, hưng phấn.",
			"Điều hoà Vị Trường: đau bụng, đầy hơi, táo bón.",
		],
	},
	LI8: {
		trang: 27,
		nhom: [
			"Thông kinh lạc, khu phong, thanh nhiệt: đau nhức, tê bì, dị cảm hoặc liệt cánh tay, nhức đầu dọc kinh Đại Trường; kể cả viêm tuyến vú.",
			"Điều hoà Tiểu Trường: đầy bụng, đau bụng.",
			"Thanh nhiệt Dương Minh, an thần: trạng thái kích động, hưng phấn.",
		],
	},
	LI9: {
		trang: 27,
		nhom: [
			"Thông kinh lạc, giảm đau: đau nhức, tê bì, dị cảm hoặc liệt tứ chi, nhất là vùng vai và khuỷu tay.",
			"Điều hoà Đại Trường: sôi bụng, đau bụng, đầy hơi, tiêu chảy.",
		],
	},
	LI10: {
		trang: 28,
		nhom: [
			"Điều hoà khí huyết, thông kinh lạc, giảm đau: tê bì, đau và liệt chi trên, đau lưng nặng đến mức không nằm được, đau răng hàm trên, liệt mặt.",
			"Điều hoà Vị Trường: rối loạn tiêu hoá (ít dùng).",
		],
	},
	LI11: {
		trang: 29,
		nhom: [
			"Thanh nhiệt, tả hoả Dương Minh: sốt cao, viêm nhiễm vùng đầu và họng; theo Tôn Tư Mạc còn là một trong \"thập tam quỷ huyệt\" dùng cho hưng cảm, động kinh.",
			"Lương huyết, trừ thấp, khu phong, chỉ ngứa: bệnh ngoài da như mày đay, ban đỏ, giời leo (zona).",
			"Thông kinh lạc, giảm đau: đau chi trên nhất là vùng khuỷu tay, liệt chi dưới, đau mắt cá chân.",
		],
	},
	LI12: {
		trang: 30,
		nhom: [
			"Thông kinh lạc, giảm đau, lợi khớp khuỷu: đau nhức, tê bì, cứng khớp khuỷu tay và các chứng ở phần trên cánh tay.",
		],
	},
	LI13: {
		trang: 31,
		nhom: [
			"Thông kinh lạc, giảm đau: đau vùng khuỷu tay, cánh tay trên và vai.",
			"Hành khí, trừ thấp, hoá đờm: lao hạch (tràng nhạc), bướu cổ, đau vùng ngực (phối cùng LI14, LI15, LI16).",
			"Chỉ khái: ho, thở khò khè.",
		],
	},
	LI14: {
		trang: 32,
		nhom: [
			"Thông kinh lạc, giảm đau: các chứng ở vai và hố thượng đòn, hạn chế vận động vai – khuỷu tay.",
			"Minh mục: bệnh về mắt như đỏ, sưng, nóng.",
			"Hành khí, tán kết đờm: bướu cổ, đau vùng ngực (phối cùng LI13, LI15, LI16).",
		],
	},
	LI15: {
		trang: 33,
		nhom: [
			"Khu phong trừ thấp, thông kinh lạc, giảm đau, lợi khớp vai: các chứng ở vai và chi trên.",
			"Khu phong, điều hoà khí huyết: mày đay.",
			"Hành khí, tán kết đờm: bướu cổ (phối cùng LI13, LI14, LI16).",
		],
	},
	LI16: {
		trang: 34,
		nhom: [
			"Thông kinh lạc, giảm đau, lợi khớp vai: các bệnh ở khớp vai như rách/viêm chóp xoay, hội chứng chèn ép, hội chứng vai – cánh tay.",
			"Điều hoà khí huyết, tán kết đờm: ứ huyết vùng ngực, nôn ra máu, bướu cổ, lao hạch (phối cùng LI13, LI14, LI15).",
		],
	},
	LI17: {
		trang: 35,
		nhom: ["Lợi hầu họng: đau họng, viêm họng, khó nuốt, khàn tiếng, mất tiếng cấp, lao hạch, bướu cổ."],
	},
	LI18: {
		trang: 36,
		nhom: [
			"Lợi hầu họng: đau họng, viêm họng, mất tiếng, khàn tiếng cấp và mạn, khó nuốt, rối loạn dây thanh, lao hạch, bướu cổ.",
			"Chỉ khái, bình suyễn: ho, thở khò khè.",
		],
	},
	LI19: {
		trang: 37,
		nhom: [
			"Giải biểu, thông mũi: nghẹt mũi, viêm mũi, rối loạn khứu giác, polyp mũi, liệt mặt lệch miệng, cứng hàm.",
		],
	},
	LI20: {
		trang: 37,
		nhom: [
			"Thông mũi, khu phong, thanh nhiệt: bệnh về mũi (chảy máu cam, polyp mũi, viêm mũi, viêm xoang, rối loạn khứu giác), các chứng vùng mặt thuộc kinh Dương Minh (Đại Trường, Vị) như liệt mặt, máy giật cơ mặt, đau dây thần kinh sinh ba, ngứa/sưng/phù mặt, mụn trứng cá quanh miệng mũi, viêm kết mạc.",
		],
	},

	// ── ST — Vị (44 huyệt có trong nguồn; nguồn không có ST17) ────────────
	ST1: {
		trang: 40,
		nhom: ["Khu phong, thanh nhiệt, dưỡng mắt: bệnh về mắt, máy giật cơ mặt, liệt mặt."],
	},
	ST2: {
		trang: 41,
		nhom: [
			"Dưỡng mắt, thanh nhiệt, khu phong: bệnh về mắt, viêm mắt dị ứng, viêm mũi, liệt mặt, đau dây thần kinh sinh ba, giật mí mắt.",
		],
	},
	ST3: {
		trang: 42,
		nhom: [
			"Khu phong, hoạt huyết tán ứ, thông kinh lạc, giảm đau: sưng tấy tại chỗ, chảy máu cam, liệt mặt, giật cơ mặt, đau dây thần kinh mặt, đau răng, nhức đầu.",
		],
	},
	ST4: {
		trang: 43,
		nhom: [
			"Khu phong vùng mặt, thông kinh lạc, giảm đau, thư giãn cơ mặt: liệt mặt, giật cơ vùng miệng má, đau dây thần kinh sinh ba (nhánh 3), bệnh vùng hàm trên, đau răng, tiết nhiều nước bọt, khó nói do liệt vận động; hỗ trợ gây tê khi nhổ răng hàm trên.",
			"Huyệt xa (ít dùng): một số bệnh ở chân.",
		],
	},
	ST5: {
		trang: 44,
		nhom: [
			"Khu phong, thông kinh lạc, tiêu sưng: đau răng hàm dưới, sưng tấy tại chỗ, đau dây thần kinh mặt, liệt mặt, cứng hàm, liệt lưỡi.",
		],
	},
	ST6: {
		trang: 45,
		nhom: [
			"Khu phong, lợi hàm răng, thông kinh lạc, giảm đau: các chứng ở răng, miệng, má, hàm.",
			"Một trong \"thập tam quỷ huyệt\" của Tôn Tư Mạc: giúp mở hàm cắn chặt trong cơn động kinh.",
		],
	},
	ST7: {
		trang: 46,
		nhom: [
			"Thông kinh lạc, lợi răng hàm và tai, giảm đau: đau nhức răng, miệng, má, hàm (nhất là hàm dưới), đau dây thần kinh sinh ba, bệnh về tai.",
		],
	},
	ST8: {
		trang: 47,
		nhom: [
			"Khu phong hàn (cả ngoại cảm lẫn nội sinh) vùng đầu mắt, dưỡng mắt, giảm đau: nhức đầu, đau nửa đầu, chóng mặt, các chứng ở mắt.",
		],
	},
	ST9: {
		trang: 48,
		nhom: [
			"Điều hoà khí huyết, giáng nghịch khí: nhức đầu, đỏ bừng mặt, chóng mặt, huyết áp cao hoặc thấp, suy sụp, ho, khò khè, khó thở, tức ngực, nôn mửa.",
			"Thông kinh lạc, giảm đau: đau thắt lưng, hội chứng cột sống thắt lưng.",
			"Lợi hầu họng: sưng viêm đau họng, bướu cổ, lao hạch (tràng nhạc).",
		],
	},
	ST10: {
		trang: 49,
		nhom: [
			"Điều hoà Phế khí: ho, khó thở, hen phế quản.",
			"Lợi hầu họng: viêm thanh quản, viêm họng, lao hạch, bướu cổ.",
		],
	},
	ST11: {
		trang: 50,
		nhom: [
			"Lợi hầu họng: viêm họng, viêm thanh quản, cứng cổ nhất là khi xoay đầu, bướu cổ.",
			"Giáng khí: ho, khó thở, hen phế quản, cơn bốc hoả.",
		],
	},
	ST12: {
		trang: 51,
		nhom: [
			"Bổ Phế khí, thanh nhiệt vùng ngực: ho, khó thở, hen phế quản, viêm họng, khó nuốt.",
			"Thông kinh lạc, giảm đau: đau hố thượng đòn, đau vai lan xuống cổ, đau tứ chi.",
		],
	},
	ST13: {
		trang: 52,
		nhom: [
			"Giáng nghịch khí: ho, khó thở, cơn bốc hoả, hen phế quản.",
			"Khoan khoái lồng ngực: tức ngực, căng ngực, đau vai lan ra bên ngực và cổ.",
		],
	},
	ST14: {
		trang: 53,
		nhom: [
			"Giáng nghịch khí, điều khí: ho, khó thở.",
			"Khoan khoái lồng ngực: đau tức, nặng ngực và vùng sườn bên.",
		],
	},
	ST15: {
		trang: 54,
		nhom: [
			"Giáng Phế khí: ho, khó thở, hen phế quản.",
			"Khoan khoái lồng ngực: đau tức ngực và vùng sườn bên.",
			"Lợi tuyến vú: viêm tuyến vú, bệnh lý ở vú.",
			"Chỉ thống, chỉ dưỡng ngoài da: ngứa toàn thân, nặng nề và sưng nề cơ thể, đau da.",
		],
	},
	ST16: {
		trang: 55,
		nhom: [
			"Điều khí, chỉ khái bình suyễn, khoan khoái lồng ngực: ho, hen phế quản, đau tức ngực và vùng sườn.",
			"Lợi tuyến vú: viêm tuyến vú, bệnh lý ở vú.",
		],
	},
	ST18: {
		trang: 57,
		nhom: [
			"Lợi tuyến vú, tiêu sưng: rối loạn tiết sữa, viêm tuyến vú, bệnh lý ở vú; một số tác giả còn dùng hỗ trợ chuyển dạ.",
			"Khoan khoái lồng ngực, chỉ khái bình suyễn: ho, khó thở, hen phế quản, đau tức ngực và vùng sườn.",
			"Điều hoà Phế khí (hỗ trợ chung các rối loạn về khí ở Phế).",
		],
	},
	ST19: {
		trang: 58,
		nhom: [
			"Điều hoà trung tiêu, giáng nghịch khí: chán ăn, buồn nôn, nôn, đau dạ dày, viêm dạ dày, đầy bụng, sôi bụng.",
			"Bổ Phế khí: ho, khó thở, hen phế quản.",
		],
	},
	ST20: {
		trang: 59,
		nhom: [
			"Điều hoà trung tiêu, giáng nghịch khí ở Phế và Vị: ăn không tiêu, chán ăn, buồn nôn, nôn, đau dạ dày, đầy bụng, cùng các bệnh hô hấp như ho, khó thở, hen phế quản.",
		],
	},
	ST21: {
		trang: 60,
		nhom: [
			"Điều khí, kiện trung tiêu, bổ khí, cầm tiêu chảy: đầy hơi, đau vùng thượng vị, nôn mửa, tiêu chảy, sôi bụng.",
		],
	},
	ST22: {
		trang: 61,
		nhom: [
			"Điều khí, điều hoà Trường Vị, giảm đau: đau bụng nhất là quanh rốn, đầy chướng bụng, chán ăn, tiêu chảy, sôi bụng, táo bón.",
			"Lợi thuỷ: phù nề, cổ trướng, đái dầm.",
		],
	},
	ST23: {
		trang: 62,
		nhom: [
			"Điều hoà trung tiêu, hoá đờm: chán ăn, đau dạ dày, đau bụng, ăn không tiêu, tiêu chảy; và chứng sán khí (thoát vị, bệnh vùng sinh dục ngoài, đau bụng dữ dội kèm táo bón – bí tiểu).",
			"An thần: bồn chồn, kích động, hưng cảm.",
		],
	},
	ST24: {
		trang: 63,
		nhom: [
			"Hoà Vị, chỉ nôn: buồn nôn, nôn, đau bụng.",
			"Hoá đờm, an thần: rối loạn tâm thần, trạng thái hưng cảm.",
		],
	},
	ST25: {
		trang: 64,
		nhom: [
			"Điều hoà Tỳ Vị Trường, trừ thấp và thấp nhiệt: rối loạn tiêu hoá như táo bón, tiêu chảy, sôi bụng, đầy hơi; rối loạn tiểu tiện, phù nề.",
			"Điều hoà khí huyết, hành khí tán ứ: khí trệ, đau bụng và quanh rốn, rối loạn kinh nguyệt, chứng sán khí (thoát vị, bệnh vùng sinh dục ngoài, đau bụng dữ dội kèm táo bón – bí tiểu).",
		],
	},
	ST26: {
		trang: 65,
		nhom: [
			"Hành khí, giảm đau: đau bụng dữ dội, đầy bụng, rối loạn kinh nguyệt như thống kinh, vô kinh, và chứng sán khí (thoát vị, bệnh vùng sinh dục ngoài).",
		],
	},
	ST27: {
		trang: 65,
		nhom: [
			"Hành khí: căng tức, đầy bụng dưới.",
			"Bổ Thận, cố tinh: tiểu khó, rối loạn tiểu tiện, bí tiểu, rối loạn xuất tinh, rối loạn kinh nguyệt, hồi hộp đánh trống ngực, rối loạn giấc ngủ.",
		],
	},
	ST28: {
		trang: 67,
		nhom: [
			"Thanh nhiệt, ích hạ tiêu, hành khí: căng đau bụng dưới, viêm nhiễm đường tiết niệu – sinh dục, rối loạn kinh nguyệt như đau bụng kinh lan xuống thắt lưng và đùi, vô sinh, sót nhau, u xơ tử cung, đau lưng, đau vai lưng, chứng sán khí.",
		],
	},
	ST29: {
		trang: 68,
		nhom: [
			"Ôn hạ tiêu, điều kinh, ích sinh dục: đau bụng dưới, rối loạn kinh nguyệt như vô kinh, u xơ tử cung, sa tử cung, vô sinh, khí hư, tinh hoàn ẩn, liệt dương, đau dương vật, tiểu đêm, chứng sán khí.",
		],
	},
	ST30: {
		trang: 69,
		nhom: [
			"Hành khí hạ tiêu: đau bụng, rối loạn tiểu tiện, rối loạn chức năng tình dục, thoát vị bẹn, bệnh vùng sinh dục ngoài.",
			"Điều hoà mạch Xung: rối loạn phụ khoa, cơn bốc hoả khó chịu kiểu \"lợn con chạy\".",
			"Kiện Vị, tăng hấp thu: hỗ trợ người mới ốm dậy, chán ăn.",
		],
	},
	ST31: {
		trang: 70,
		nhom: [
			"Thông kinh lạc, khu phong trừ thấp, giảm đau: đau, hạn chế vận động, tê bì hoặc liệt chi dưới, đau khớp háng và khớp gối, teo cơ, co rút gối, đau thắt lưng; tê đau lan dọc hông – chân thường phối với Túc Tam Lý (ST36) và Giải Khê (ST41).",
		],
	},
	ST32: {
		trang: 71,
		nhom: [
			"Thông kinh lạc, khu phong trừ thấp, giảm đau: đau, khó vận động, tê bì hoặc liệt hai chi dưới, đau khớp háng và gối, teo cơ, co rút cơ, chứng sán khí.",
		],
	},
	ST33: {
		trang: 72,
		nhom: [
			"Thông kinh lạc, khu phong trừ thấp, giảm đau: đau, hạn chế vận động, rối loạn cảm giác hoặc liệt chi dưới, lệch khớp gối, teo cơ, co rút cơ, chứng sán khí.",
		],
	},
	ST34: {
		trang: 73,
		nhom: [
			"Điều hoà Vị khí, trị chứng cấp (Khích huyệt): đau dạ dày cấp tính.",
			"Thông kinh lạc, giảm đau: đau và rối loạn vận động khớp gối, viêm tuyến vú.",
		],
	},
	ST35: {
		trang: 74,
		nhom: ["Khu phong trừ thấp, thông kinh lạc, tiêu sưng giảm đau: các chứng ở khớp gối."],
	},
	ST36: {
		trang: 75,
		nhom: [
			"Hoà Vị, kiện Tỳ, trừ thấp: các rối loạn tiêu hoá nói chung.",
			"Bổ khí huyết, cường tráng: nâng cao sức đề kháng, dùng khi cơ thể suy nhược, chóng mặt, dị ứng, suy sụp.",
			"An thần: bồn chồn, trạng thái hưng cảm.",
			"Thông kinh lạc, giảm đau: các chứng đau dọc theo đường kinh Vị.",
		],
	},
	ST37: {
		trang: 76,
		nhom: [
			"Điều hoà Tỳ Vị Trường, trừ ứ trệ, thanh thấp nhiệt: rối loạn tiêu hoá, nhất là viêm dạ dày – ruột cấp, tiêu chảy, chướng bụng, đầy hơi, hội chứng ruột kích thích.",
			"Thông kinh lạc, giảm đau: các chứng ở chi dưới dọc theo đường kinh.",
		],
	},
	ST38: {
		trang: 77,
		nhom: [
			"Khu phong trừ thấp, thông kinh lạc, giảm đau, lợi khớp vai: dùng làm huyệt xa trị đau vai cấp và co rút khớp vai; đồng thời là huyệt tại chỗ cho các chứng ở chi dưới theo đường kinh.",
		],
	},
	ST39: {
		trang: 78,
		nhom: [
			"Hành khí Tiểu Trường, điều hoà Trường, thanh thấp nhiệt: viêm dạ dày – ruột cấp, tiêu chảy, đầy hơi, đau bụng dưới lan đến vùng tinh hoàn.",
			"Thông kinh lạc, giảm đau: các chứng ở chi dưới dọc theo đường kinh.",
		],
	},
	ST40: {
		trang: 79,
		nhom: [
			"Hoá đờm trừ thấp, thanh đờm ở Phế và Tâm, chỉ khái, an thần: đờm hữu hình như bệnh hô hấp, tiêu chảy; và đờm vô hình như hạch dưới da, bướu cổ, u xơ, đau/tê dọc đường kinh, buồn ngủ, chóng mặt, hưng cảm, động kinh, choáng váng — các chứng thuộc \"phong đàm\".",
		],
	},
	ST41: {
		trang: 81,
		nhom: [
			"Thanh Vị nhiệt: các chứng ở mắt, mặt, trán như sưng, đau, đỏ, viêm; rối loạn tiêu hoá do Vị nhiệt.",
			"An thần: bồn chồn, lú lẫn, hưng cảm, kích động, tăng huyết áp.",
			"Thông kinh lạc, giảm đau: các chứng ở cổ chân, cẳng chân, đầu gối; phối với Bễ Quan (ST31), Túc Tam Lý (ST36) trong chứng teo cơ.",
		],
	},
	ST42: {
		trang: 82,
		nhom: [
			"Thanh Vị nhiệt, hoà Vị: các chứng vùng đầu và bụng dọc kinh Vị như liệt mặt, đau răng, sưng đau vùng thượng vị.",
			"An thần: trạng thái hưng cảm.",
			"Thông kinh lạc, giảm đau: sưng đau ở cẳng chân và mu bàn chân.",
		],
	},
	ST43: {
		trang: 83,
		nhom: [
			"Điều hoà Tỳ Vị Trường, tiêu phù: đầy hơi, sôi bụng, nấc cụt, phù và sưng ở mặt và quanh mắt; hội chứng phong – nhiệt – thấp với sưng đỏ đau khớp nói chung, nhất là ngón chân và mu bàn chân.",
		],
	},
	ST44: {
		trang: 85,
		nhom: [
			"Thanh Vị nhiệt, thông kinh lạc, giảm đau: đau nhức và viêm vùng mặt như đau răng, viêm xoang hàm trên, chảy máu cam, đau dây thần kinh sinh ba, viêm họng.",
			"Điều hoà Trường, trừ thấp nhiệt: đau bụng, tiêu chảy, đầy hơi.",
			"An thần: bồn chồn, khó chịu trong người.",
		],
	},
	ST45: {
		trang: 86,
		nhom: [
			"Thanh Vị nhiệt, thông kinh lạc: đau và viêm vùng mặt như đau răng, viêm xoang hàm trên, chảy máu cam, đau dây thần kinh sinh ba, đau họng, sốt do nhiễm trùng.",
			"Khai khiếu, an thần: trạng thái hưng cảm, mất ngủ, ác mộng, bất tỉnh, trầm cảm, bồn chồn.",
		],
	},

	// ── SP — Tỳ (20 huyệt có trong nguồn; nguồn không có SP20) ────────────
	SP1: {
		trang: 87,
		nhom: [
			"Chỉ huyết (do Tỳ không nhiếp huyết, thường cứu ngải; do nhiệt thì chích huyết): băng huyết, rong huyết, chảy máu cam, tiểu ra máu, đại tiện ra máu.",
			"Điều hoà Tỳ Vị: tiêu chảy, viêm dạ dày – ruột cấp, đầy hơi cấp.",
			"Khoan khoái lồng ngực: tức ngực, căng ngực.",
			"Dưỡng Tâm an thần, khai khiếu: mất ngủ hay mơ, động kinh ở trẻ em, rối loạn tâm thần với bồn chồn, hưng cảm, bất tỉnh.",
		],
	},
	SP2: {
		trang: 89,
		nhom: [
			"Điều hoà Tỳ, thanh nhiệt trừ thấp: bệnh đường tiêu hoá như viêm dạ dày – ruột cấp và mạn, viêm dạ dày, táo bón, đau bụng, chướng bụng, buồn nôn, phù nề, sốt nhiễm trùng không ra mồ hôi.",
			"Tại chỗ: các chứng ở ngón chân cái.",
		],
	},
	SP3: {
		trang: 90,
		nhom: [
			"Bổ Tỳ Vị, điều khí: rối loạn tiêu hoá như tiêu chảy, táo bón, chướng bụng, nôn mửa.",
			"Trừ thấp, thanh thấp nhiệt: cảm giác nặng nề cơ thể, đau nhức xương khớp do thấp.",
			"Tại chỗ: các chứng ở ngón chân cái và khớp bàn ngón chân thứ nhất.",
		],
	},
	SP4: {
		trang: 91,
		nhom: [
			"Bổ Tỳ, điều hoà trung tiêu, điều khí trừ thấp: rối loạn tiêu hoá như nôn mửa, tiêu chảy cấp, đau bụng nhất là vùng thượng vị và quanh rốn, đầy hơi.",
			"Huyệt Lạc, an thần: rối loạn tâm thần như hưng cảm, mất ngủ kèm bồn chồn.",
			"Thông mạch Xung, dưỡng Tâm ngực: đau vùng tim ngực dọc kinh Tỳ/mạch Xung, phù mặt, bệnh phụ khoa như đau bụng kinh, sót nhau, rối loạn khí hư.",
			"Tại chỗ: đau vùng xương bàn chân.",
		],
	},
	SP5: {
		trang: 93,
		nhom: [
			"Bổ Tỳ, trừ thấp, lợi gân xương: rối loạn tiêu hoá; hội chứng thấp với cứng/sưng/nặng nề cơ khớp có thể tiến triển thành đau biến dạng khớp; rối loạn tại khớp cổ chân.",
			"An thần: trầm cảm hay suy nghĩ vẩn vơ, mất ngủ kèm ác mộng, bồn chồn.",
		],
	},
	SP6: {
		trang: 94,
		nhom: [
			"Bổ Tỳ Vị, hoá thấp: các chứng về đường tiêu hoá.",
			"Dưỡng âm huyết, điều kinh, thúc đẻ: các tình trạng suy nhược, chủ yếu trong bệnh phụ khoa – sản khoa.",
			"Điều hoà tiết niệu, ích sinh dục: bệnh tiết niệu ở nam, rối loạn tình dục, bệnh vùng sinh dục.",
			"An thần: rối loạn tâm thần, mất ngủ.",
		],
	},
	SP7: {
		trang: 95,
		nhom: [
			"Bổ Tỳ, trừ thấp, lợi tiểu: đầy chướng bụng, đầy hơi, bí tiểu, phù nề, teo cơ, tê hoặc lạnh chi dưới.",
		],
	},
	SP8: {
		trang: 96,
		nhom: [
			"Điều kinh, hoạt huyết, trị chứng cấp (Khích huyệt): đau bụng kinh cấp, kinh nguyệt không đều, u xơ.",
			"Điều hoà Tỳ Vị, trừ thấp: tức đầy bụng, chán ăn, tiêu chảy cấp và mạn, rối loạn tiểu tiện, phù nề.",
		],
	},
	SP9: {
		trang: 97,
		nhom: [
			"Điều hoà Tỳ Vị, trừ thấp, lợi thuỷ, ích hạ tiêu: bệnh đường tiết niệu và tiêu hoá thuộc trung – hạ tiêu, phù nề, hội chứng thấp ở bất kỳ vị trí nào trên cơ thể.",
			"Tại chỗ: các vấn đề ở khớp gối, nhất là khi sưng tấy.",
		],
	},
	SP10: {
		trang: 98,
		nhom: [
			"Bổ khí huyết, hoạt huyết, lương huyết, chỉ huyết, điều kinh, dưỡng da: các bệnh về huyết nói chung, bệnh phụ khoa do huyết nhiệt hoặc huyết ứ, bệnh ngoài da do huyết nhiệt, huyết ứ, huyết hư.",
			"Tại chỗ: các vấn đề ở khớp gối.",
		],
	},
	SP11: {
		trang: 99,
		nhom: [
			"Điều hoà tiểu tiện, trừ thấp, thanh nhiệt: tiểu khó, bí tiểu, đái dầm, chàm và ngứa sinh dục ngoài, sưng viêm đau vùng bẹn và bụng dưới.",
		],
	},
	SP12: {
		trang: 100,
		nhom: [
			"Bổ khí huyết, hành khí hạ tiêu, giảm đau: đau bụng dưới và vùng háng, lạc nội mạc tử cung, u xơ, u nang buồng trứng, đau lan từ hông xuống háng, chứng sán khí.",
			"An thai, giáng nghịch khí (thông mạch Âm Duy): chướng đầy bụng, đau vùng bụng và ngực khi mang thai giai đoạn cuối.",
			"Thanh nhiệt, trừ thấp, điều hoà tiểu tiện: bệnh đường tiết niệu, khí hư nhiều.",
		],
	},
	SP13: {
		trang: 101,
		nhom: [
			"Hành khí, giảm đau: tức đau bụng dưới, đau háng, bệnh phụ khoa như u xơ, u nang buồng trứng, táo bón, chứng sán khí.",
		],
	},
	SP14: {
		trang: 102,
		nhom: [
			"Ôn hạ tiêu, giáng nghịch khí: tiêu chảy do lạnh, táo bón, căng bụng, đau quanh rốn, các chứng ở tim và ho do khí nghịch, chứng sán khí.",
		],
	},
	SP15: {
		trang: 103,
		nhom: [
			"Hành khí, điều hoà Trường: táo bón (thường được ưa dùng hơn Thiên Khu — ST25), tiêu chảy nhất là do lạnh – thấp.",
			"Về mặt tâm lý – cảm xúc: hay khóc, buồn bã, trầm cảm.",
		],
	},
	SP16: {
		trang: 104,
		nhom: ["Điều hoà khí Đại Trường: đau bụng quanh rốn, rối loạn tiêu hoá như tiêu chảy, táo bón."],
	},
	SP17: {
		trang: 105,
		nhom: [
			"Tiêu tích trệ, kiện Vị: đầy tức sau ăn do ứ đọng thức ăn, trào ngược, đau tức vùng ngực và sườn bên, đau dây thần kinh liên sườn.",
		],
	},
	SP18: {
		trang: 106,
		nhom: [
			"Giáng khí, khoan khoái lồng ngực: ho, khó thở, mụn nhọt, đau tức vùng ngực bên, đau dây thần kinh liên sườn.",
			"Lợi tuyến vú: viêm tuyến vú, đau ngực, rối loạn tiết sữa.",
		],
	},
	SP19: {
		trang: 107,
		nhom: ["Giáng khí: ho, khó thở, hụt hơi.", "Khoan khoái lồng ngực: căng đau vùng ngực bên."],
	},
	SP21: {
		trang: 108,
		nhom: [
			"Điều hoà khí huyết toàn thân, lợi gân khớp (Đại Lạc của Tỳ, thống lĩnh các lạc mạch): đau nhức khắp cơ thể khi lạc mạch thực, mỏi yếu toàn thân khi lạc mạch hư; các bệnh đau như đau cơ xơ hoá, thấp khớp.",
			"Khoan khoái lồng ngực: đau tức vùng ngực bên, đau dây thần kinh liên sườn, khó thở.",
		],
	},

	// ── HE — Tâm (9) — ⚠️ mã CSDL dùng HE, nguồn Focks/Phùng Văn Chiến ghi HT ──
	HE1: {
		trang: 110,
		nhom: [
			"Khoan khoái lồng ngực: đau vùng sườn và tim, đau thắt ngực, hồi hộp.",
			"Thông kinh lạc, lợi cánh tay: đau, hạn chế vận động, rối loạn cảm giác ở chi trên.",
		],
	},
	HE2: {
		trang: 111,
		nhom: ["Thông kinh lạc, giảm đau: đau, hạn chế cử động ở vai, cánh tay trên và vùng nách."],
	},
	HE3: {
		trang: 112,
		nhom: [
			"Hoá đờm, thanh Tâm nhiệt, an thần: rối loạn tâm thần, mất ngủ, hưng cảm, đầu óc lú lẫn do Tâm nhiệt, đỏ mắt, loét miệng lưỡi.",
			"Thông kinh lạc: đau, liệt, run hoặc rối loạn vận động ở khuỷu tay và dọc đường kinh.",
		],
	},
	HE4: {
		trang: 113,
		nhom: [
			"Thông kinh lạc, thư cân: đau, co cứng cơ cánh tay, đau dây thần kinh trụ.",
			"An thần: mất ngủ hay mơ, lo âu, buồn bã, động kinh, trạng thái bồn chồn thuộc thể âm hư.",
			"Lợi thanh âm: khàn tiếng, mất tiếng đột ngột.",
		],
	},
	HE5: {
		trang: 114,
		nhom: [
			"Điều hoà Tâm khí, ổn định nhịp tim (huyệt chính): rối loạn chức năng tim, loạn nhịp tim.",
			"An thần: rối loạn tâm thần.",
			"Lợi thiệt: điểm mấu chốt trong các rối loạn ngôn ngữ.",
			"Thông qua kinh Thái Dương hỗ trợ bàng quang: rối loạn bài tiết nước tiểu.",
			"Thông kinh lạc, giảm đau: đau cổ tay, cẳng tay.",
		],
	},
	HE6: {
		trang: 115,
		nhom: [
			"Bổ dưỡng Tâm âm – Tâm huyết, thanh nhiệt, an thần, trị chứng cấp (Khích huyệt): đổ mồ hôi trộm ban đêm, cảm giác nóng hầm hập trong xương, bồn chồn, rối loạn chức năng tim mạch, nhịp tim nhanh, đau thắt ngực.",
		],
	},
	HE7: {
		trang: 116,
		nhom: [
			"Điều hoà và bổ Tâm, an thần: rối loạn chức năng tim, hồi hộp đánh trống ngực, rối loạn tâm lý, mất ngủ; hỗ trợ ổn định tâm lý khi cai nghiện và trong sản khoa.",
			"Thanh Tâm nhiệt (thông qua kinh Thái Dương): rối loạn bài tiết nước tiểu.",
			"Tại chỗ: các chứng ở vùng cổ tay.",
		],
	},
	HE8: {
		trang: 117,
		nhom: [
			"Thanh nhiệt ở Tâm và Tiểu Trường: ngứa hoặc đau vùng sinh dục, tiểu khó, đái dầm, bàng quang kích thích, kể cả sa tử cung.",
			"Điều hoà Tâm khí, an thần: rối loạn chức năng tim, đánh trống ngực, trầm cảm, sợ hãi ám ảnh, cảm giác nghẹn ở họng (hội chứng \"mai hạch khí\"), kích động, động kinh.",
			"Thông kinh lạc, giảm đau: co rút ngón tay, nóng lòng bàn tay, các chứng dọc đường kinh.",
		],
	},
	HE9: {
		trang: 118,
		nhom: [
			"Khai khiếu, hồi tỉnh (huyệt cấp cứu): suy sụp, bất tỉnh.",
			"Thanh nhiệt, lợi mắt lưỡi họng: viêm đau vùng mắt, lưỡi, họng.",
			"Điều khí lồng ngực, an thần: đánh trống ngực, loạn nhịp tim, tức ngực, đau thắt ngực, bồn chồn lo âu, trầm cảm.",
			"Thông kinh lạc: đau, hạn chế vận động, rối loạn cảm giác và tuần hoàn ở chi trên.",
		],
	},
};

let boSo = Object.entries(HO_SO);
if (gioiHanKinh) boSo = boSo.filter(([ma]) => gioiHanKinh.has(tienToKinh(ma)));

console.log(
	`Hồ sơ đã duyệt (lô 1 — LI/ST/SP/HE): ${Object.keys(HO_SO).length} huyệt.` +
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
// trong CSDL — bắt sai lệch tiền tố (như HE/HT) trước khi UPDATE âm thầm ghi trượt 0 hàng.
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
	const r = slugThayThe
		? await kho.query(
				"UPDATE ec_huyet_vi SET cong_dung_nhom = $1 WHERE slug = $2 AND deleted_at IS NULL",
				[JSON.stringify(v), slugThayThe],
			)
		: await kho.query(
				"UPDATE ec_huyet_vi SET cong_dung_nhom = $1 WHERE ma_huyet = $2 AND deleted_at IS NULL",
				[JSON.stringify(v), ma],
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
console.log("\nSố huyệt có cong_dung_nhom theo kinh (đếm theo tiền tố ma_huyet):");
for (const row of demTheoKinh.rows) console.log(`  ${row.kinh}: ${row.n}`);
const slugTargets = Object.values(KHOP_THEO_SLUG);
if (slugTargets.length) {
	const demTheoSlug = await kho.query(
		"SELECT slug, (cong_dung_nhom IS NOT NULL) AS co FROM ec_huyet_vi WHERE slug = ANY($1::text[]) AND deleted_at IS NULL",
		[slugTargets],
	);
	for (const row of demTheoSlug.rows) console.log(`  (khớp theo slug, ma_huyet NULL) ${row.slug}: ${row.co ? "đã ghi" : "chưa ghi"}`);
}

// Phép kiểm 3: in ST36 (Túc Tam Lý) và HE7 (Thần Môn) để soát giọng văn.
const mauSoat = await kho.query(
	"SELECT ma_huyet, title, cong_dung_nhom FROM ec_huyet_vi WHERE ma_huyet = ANY($1::text[]) AND deleted_at IS NULL",
	[["ST36", "HE7"]],
);
console.log("\nMẫu soát giọng văn:");
for (const row of mauSoat.rows) console.log(`  ${row.ma_huyet} ${row.title}:\n`, JSON.stringify(row.cong_dung_nhom, null, 2));

// Phép kiểm 4: hình dạng — mọi cong_dung_nhom vừa ghi phải có "nhom" là mảng CHUỖI,
// không được lẫn object con (đó là thứ làm td_chu() nuốt trắng mà không báo lỗi).
// ⚠️ Cột cong_dung_nhom là kiểu `json` (không phải `jsonb`) — dùng json_array_elements/
// json_typeof, KHÔNG dùng bản jsonb_* (đã đo: jsonb_array_elements(json) báo lỗi 42883
// "function ... does not exist", không lặng lẽ tự ép kiểu).
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
	[maCanKiem, slugTargets],
);
console.log(
	`\nKiểm hình dạng: ${
		kiemHinh.rows.length
			? "✗ CÓ " + kiemHinh.rows.length + " huyệt lẫn object trong nhom: " + kiemHinh.rows.map((r) => r.dinh_danh).join(", ")
			: "✓ tất cả cong_dung_nhom.nhom vừa ghi đều là mảng chuỗi, không lẫn object."
	}`,
);

console.log("\n→ Đợi ĐỦ CẢ BỐN LÔ rồi mới chạy một lượt (KHÔNG chạy giữa lô):");
console.log("   node scripts-di-cu/dung-chi-muc.mjs huyet_vi");
console.log("   node scripts-di-cu/xuat-huyet-js.mjs");
await kho.end();
