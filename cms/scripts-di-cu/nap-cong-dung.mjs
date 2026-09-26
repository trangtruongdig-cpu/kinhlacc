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
// LÔ 4/4 (LÔ CUỐI): 52 huyệt hai mạch CV — Nhâm mạch (24) và GV — Đốc mạch (28).
// Lô 1 (LI/ST/SP/HE, 92), lô 2 (SI/BL/KI, 113), lô 3 (PC/TE/GB trừ GB29/LR, 89) đã ghi
// xong — bản HO_SO của ba lô đó không còn trong file này (xem lịch sử git nếu cần tra
// lại), theo đúng quy ước "mỗi lô ghi qua bản HO_SO của chính lô đó" ở dưới. Sau lô này
// khép đủ 11 + 92 + 113 + 89 + 52 = 357 huyệt.
//
// ⚠️ NHÂM/ĐỐC LÀ MẠCH, KHÔNG PHẢI KINH CHÍNH: nhiều huyệt ở đây là huyệt Mộ hoặc huyệt
// then chốt của cả một tạng phủ (CV4 Quan Nguyên, CV6 Khí Hải, CV12 Trung Quản, CV17
// Chiên Trung/Đản Trung, GV4 Mệnh Môn, GV14 Đại Chuỳ, GV20 Bách Hội, GV26 Nhân Trung) —
// đây là nhóm người mới học tra nhiều nhất trong cả bộ.
//
// Mỗi phần tử "nhom" ứng với một cụm gạch đầu dòng "●" trong nguyenVan của nguồn (đã
// tách đúng theo nguyenVan — không dùng tacDung vì tacDung bị PDF-extract ngắt dòng
// giữa câu, xuống dòng sai chỗ); một số huyệt nguồn không có bullet "●" (một đoạn văn
// liền, ví dụ CV4, CV6, CV8, CV10, CV11, GV18, GV19, GV21, GV22, GV25, GV28) — những
// huyệt đó chỉ có 1–2 phần tử "nhom" tách theo Ý của chính đoạn văn, không bịa thêm cụm.
//
// ⚠️ NHIỄU OCR trong nguồn: nhiều "nguyenVan" có chèn dòng chân trang giữa câu
// ("Phùng Văn Chiến (Việt hoá, biên soạn, chế hình) HUYỆT VỊ CHÂM CỨU THƯỜNG DÙNG
// <số trang>") do PDF ngắt trang giữa một gạch đầu dòng — đã lọc bỏ khi viết lại,
// không phải sự kiện thật của huyệt. Nhiều huyệt (GV3, GV16) có kèm một khối chú giải
// dài về "hội chứng Bi/Tý" (đau khớp/cơ, khó co duỗi) giống hệt lô 3 — chỉ rút gọn còn
// "hội chứng tý (đau khớp/cơ, khó co duỗi)", không chép lại cả khối 4 loại tý.
// Nhiều huyệt (CV3, CV5, CV7, CV13, GV5) có kèm định nghĩa dài "bôn đồn khí (ben tun qi
// 奔豚气: heo con chạy...)" — rút gọn còn "khí nghịch từ bụng dưới xông lên ngực (bôn
// đồn khí)", giữ đúng nghĩa lâm sàng, bỏ phần diễn giải ẩn dụ.
//
// ⚠️ HAI CHỖ NGỜ SAI/NHIỄU CỦA NGUỒN — đã né, không chép nguyên văn:
//   1. GV8 (Cân Súc): tacDung liệt "co thắt, bồn chồn, màng não, đau tim" — từ "màng
//      não" (một danh từ giải phẫu) chen giữa các triệu chứng cơ năng không rõ liên hệ,
//      nhiều khả năng là mảnh dịch lạc của thuật ngữ "Meningismus" (một triệu chứng,
//      không phải bộ phận) trong bản gốc tiếng Đức — không chắc nên KHÔNG chép từ này,
//      chỉ giữ các chỉ định lâm sàng rõ nghĩa còn lại.
//   2. GV10/GV13/GV14: tacDung ghi "suy nhược cơ thể (ví dụ: bệnh loãng xương
//      ("Knochendampferkrankung"))" — từ Đức "Knochendampf" (hơi/chưng xương) khớp
//      nghĩa với "cốt chưng" (chứng sốt về chiều do Âm hư trong Đông Y) hơn là "loãng
//      xương" (osteoporosis, nghĩa ngược lại). Vì đây là suy luận riêng, KHÔNG chắc
//      chắn như trường hợp PC6/Âm Kiều ở lô 3 (có căn cứ bát mạch giao hội chuẩn), nên
//      KHÔNG tự sửa thành "cốt chưng" — giữ nguyên "loãng xương" như bản dịch đã ghi
//      (cùng cách dùng đã duyệt ở BL23 lô 2: "Bổ xương tuỷ: loãng xương, nhuyễn xương."),
//      chỉ bỏ phần chú thích tiếng Đức trong ngoặc vì đó là nhiễu OCR/dịch, không phải
//      sự kiện lâm sàng.
//
// ⚠️ CẢNH BÁO GIỮ LẠI TỪ NGUỒN (không tự thêm cảnh báo nguồn không có):
//   - CV9 (Thuỷ Phân): nguồn ghi rõ trị cổ trướng "khi đó nên dùng cứu ngải" — giữ
//     nguyên trong chỉ định.
//   - CV15 (Cưu Vĩ): nguồn phân biệt Hư/Thực cho lạc mạch Nhâm ("Hư: ngứa da bụng.
//     Thực: da bụng đau nhức") — giữ nguyên, không gộp chung.
//   - GV26 (Nhân Trung): nguồn liệt huyệt này dùng khi "sốc cấp tính mất ý thức... gãy
//     kim [khi châm]" — đây là huyệt cấp cứu kinh điển, giữ nguyên các chỉ định cấp cứu.
//   - CV8 (Thần Khuyết): nguồn CHỈ ghi "Làm ấm, ổn định dương và ruột..." — KHÔNG có
//     dòng nào nói "cấm châm, chỉ cứu" trong tacDung/nguyenVan đã bóc (đã kiểm lại toàn
//     bộ object, chỉ có 5 khoá ma/ten/trang/tacDung/nguyenVan, không có trường cảnh báo
//     riêng). Dù đây là kiến thức phổ biến trong Đông Y, nguồn KHÔNG nêu nên KHÔNG tự
//     thêm — theo đúng luật "đừng tự thêm cảnh báo sách không có".
//
// ⚠️ MÃ CSDL — đã kiểm bằng truy vấn (--kiem) trước khi ghi, không giả định "mọi mã
// Đốc Mạch đều là GV" như yêu cầu. Kết quả: 52/52 mã (CV1…CV24, GV1…GV28) khớp THẲNG
// theo ma_huyet, không có ca nào NULL hoặc lệch tiền tố kiểu GB3/GB29 ở lô 3. Vì vậy
// BO_QUA_MA_LECH, KHOP_THEO_SLUG, KHOP_THEO_MA_KHAC đều RỖNG ở lô này — giữ biến để
// logic ghi/kiểm dùng chung với ba lô trước.
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
//   node scripts-di-cu/nap-cong-dung.mjs --kinh=CV,GV     # giới hạn lô ghi theo kinh (mặc định: cả lô)
//   node scripts-di-cu/nap-cong-dung.mjs
//
// ⚠️ Bốn lô (LI/ST/SP/HE, rồi SI/BL/KI, rồi PC/TE/GB/LR, rồi CV/GV — LÔ NÀY) đều ghi
// qua bản HO_SO của CHÍNH LÔ ĐÓ — đừng chạy lại lô cũ sau khi đã thay HO_SO bằng lô
// mới, dữ liệu lô cũ sẽ không được ghi lại (không mất, chỉ là không có tác dụng gì).
//
// ĐỦ CẢ BỐN LÔ rồi — bước tiếp theo (KHÔNG chạy trong việc này, người dùng tự chạy):
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

// Không có mã nào phải BỎ QUA/KHỚP THEO SLUG/KHỚP THEO MÃ KHÁC ở lô này — đã kiểm bằng
// --kiem trước khi chốt bản này: 52/52 mã CV/GV khớp thẳng theo ma_huyet. Giữ ba biến
// này rỗng để logic ghi/kiểm dùng chung với ba lô trước.
const BO_QUA_MA_LECH = {};
const KHOP_THEO_SLUG = {};
const KHOP_THEO_MA_KHAC = {};

// Hồ sơ ĐÃ DUYỆT — lô 4 (LÔ CUỐI): CV1…CV24 (Nhâm mạch, 24), GV1…GV28 (Đốc mạch, 28).
// `trang` là số trang trong bản dịch Focks/Phùng Văn Chiến đã đối chiếu (để truy
// nguồn); mỗi phần tử của `nhom` là "Tên nhóm công dụng: chỉ định cụ thể" viết lại
// bằng lời riêng, giữ nguyên SỰ KIỆN so với cms/.tam-focks/hoso.json.
const HO_SO = {
	// ── CV — Nhâm Mạch (24) ──────────────────────────────────────
	CV1: {
		trang: 339,
		nhom: [
			"Điều hoà nhị tiện, trừ thấp nhiệt: rối loạn đại tiện và tiểu tiện, bí tiểu, viêm tuyến tiền liệt, bệnh ở cơ quan sinh dục ngoài, sa trực tràng, trĩ, đau vùng hậu môn, kinh nguyệt không đều hoặc vô kinh, sa tử cung, bệnh sán khí (thoát vị tạng bụng, bệnh sinh dục ngoài, đau bụng dữ dội kèm táo bón — bí tiểu).",
			"An thần, hồi phục ý thức (một trong thập tam quỷ huyệt của Tôn Tư Mạc, dùng cấp cứu): động kinh, hưng cảm, sau khi ngạt nước (hỗ trợ đẩy nước ra khỏi phổi).",
		],
	},
	CV2: {
		trang: 340,
		nhom: [
			"Lợi tiểu tiện, ôn dương bổ Thận: bệnh nam khoa — tiết niệu như tiểu khó, bí tiểu, tiểu không tự chủ, viêm đường tiết niệu, di tinh, liệt dương, bệnh sán khí; kiệt sức do cảm lạnh.",
			"Điều hoà hạ tiêu: khó chịu vùng chậu, kinh nguyệt không đều, khí hư, bệnh ở cơ quan sinh dục ngoài.",
		],
	},
	CV3: {
		trang: 341,
		nhom: [
			"Hỗ trợ Bàng Quang, trừ thấp nhiệt, hỗ trợ hạ tiêu: bệnh tiết niệu — sinh dục như tiểu khó, phù nề, ngứa — đau — sưng vùng sinh dục, bệnh sán khí, viêm tuyến tiền liệt, rối loạn chức năng tình dục như liệt dương, di tinh.",
			"Điều hoà kinh nguyệt: đau bụng kinh, khí nghịch từ bụng dưới xông lên ngực (bôn đồn khí).",
			"Bổ Thận (thường dùng Quan Nguyên — CV4 — hơn): đau vùng thắt lưng.",
		],
	},
	CV4: {
		trang: 342,
		nhom: [
			"Bồi bổ nguyên khí, ôn bổ Thận dương, ích tinh: suy nhược cơ thể, thể trạng kiệt sức cần dưỡng bệnh.",
			"Kiện Tỳ, hỗ trợ tử cung, điều hoà sinh dục: bệnh phụ khoa, rối loạn chức năng tình dục, tiêu chảy, đại tiện không tự chủ ở người già, bệnh sán khí, bệnh tiết niệu như bí tiểu — tiểu khó — phù nề, đau và lạnh vùng thắt lưng.",
		],
	},
	CV5: {
		trang: 343,
		nhom: [
			"Điều hoà, thông lợi thuỷ đạo: rối loạn tiểu tiện như tiểu khó, bí tiểu, phù nề, tiêu chảy.",
			"Điều khí hạ tiêu, giảm đau: đau vùng bụng dưới và quanh rốn, đau — ngứa vùng sinh dục, khí nghịch từ bụng dưới xông lên ngực (bôn đồn khí).",
			"Điều hoà tử cung: khí hư kéo dài, rong huyết tử cung, khối u vùng bụng.",
		],
	},
	CV6: {
		trang: 344,
		nhom: [
			"Bồi nguyên khí, bổ Thận (nhất là Thận dương), điều khí, điều huyết: kiệt sức và suy nhược mạn tính, bệnh phụ khoa như kinh nguyệt không đều (cả do huyết ứ), sa tử cung.",
			"Bổ hạ tiêu: rối loạn sinh sản, khí hư, rối loạn chức năng tình dục như liệt dương — di tinh, bệnh tiết niệu, bệnh tiêu hoá.",
		],
	},
	CV7: {
		trang: 345,
		nhom: [
			"Điều hoà kinh nguyệt: kinh nguyệt không đều, vô kinh, rong huyết tử cung, khí hư kéo dài.",
			"Điều khí vùng bụng dưới và sinh dục: đau quanh rốn, đau bụng dưới lan xuống sinh dục, bệnh sán khí, vô sinh, ngứa sinh dục, bí đại tiểu tiện, khó chịu vùng thắt lưng và chi dưới, khí nghịch từ bụng dưới xông lên ngực (bôn đồn khí).",
		],
	},
	CV8: {
		trang: 346,
		nhom: [
			"Ôn dương, cố ruột: đau bụng và tiêu chảy do lạnh, đau quanh rốn, mất ý thức do dương khí suy sụp (thoát dương).",
		],
	},
	CV9: {
		trang: 347,
		nhom: [
			"Điều hoà, thông lợi thuỷ đạo, tiêu phù: phù thũng, cổ trướng (khi đó nên dùng cứu ngải).",
			"Điều hoà Trường Vị, tiêu tích trệ: chán ăn, ợ chua, nôn, đau quanh rốn, tiêu chảy.",
			"Hỗ trợ trẻ nhỏ: thóp chậm đóng.",
		],
	},
	CV10: {
		trang: 348,
		nhom: [
			"Bổ khí, điều khí Tỳ Vị, tiêu tích trệ: chán ăn, buồn nôn, nôn, chướng bụng, đau vùng bụng trên, khó tiêu.",
		],
	},
	CV11: {
		trang: 349,
		nhom: [
			"Điều hoà trung tiêu, điều khí: chán ăn, buồn nôn, nôn, đầy hơi chướng bụng, đau dạ dày, đau thắt ngực, phù nề.",
		],
	},
	CV12: {
		trang: 350,
		nhom: [
			"Điều hoà, bồi bổ trung tiêu, giáng nghịch khí, giảm đau: các bệnh đường tiêu hoá nói chung.",
			"Trừ thấp trọc: mệt mỏi, nặng nề toàn thân, đau âm ỉ cố định, tiết dịch đục.",
		],
	},
	CV13: {
		trang: 351,
		nhom: [
			"Hoà Vị, giáng nghịch khí: ợ nóng, buồn nôn, nôn, ợ chua, đau dạ dày, đầy bụng sau ăn, khí nghịch từ bụng dưới xông lên ngực (bôn đồn khí).",
			"Điều hoà Tâm: đau vùng tim (chức năng), hồi hộp, bồn chồn vùng ngực.",
		],
	},
	CV14: {
		trang: 352,
		nhom: [
			"Điều hoà Tâm, khai thông lồng ngực, hạ khí Phế và Vị: đau ngực do tim — phổi — xương ức, ho, khó thở, rối loạn tiêu hoá.",
			"Hoá đờm, an thần: mất ngủ, bồn chồn, hưng cảm liên quan Tâm; huyệt chính trị đau ngực do huyết ứ hoặc đờm trệ tại chỗ.",
		],
	},
	CV15: {
		trang: 353,
		nhom: [
			"Điều hoà Tâm, an thần: lo âu, bồn chồn, trạng thái hưng cảm, động kinh.",
			"Giáng khí Phế và Vị, khai thông lồng ngực: cảm giác đè nặng vùng tim — ngực, ho, khó thở, rối loạn tiêu hoá, trào ngược.",
			"Lạc huyệt của mạch Nhâm: hư thì ngứa da bụng, thực thì da bụng đau nhức.",
		],
	},
	CV16: {
		trang: 354,
		nhom: [
			"Khai thông lồng ngực: tức ngực, đau trước tim, căng tức ngực và mạn sườn, khó nuốt.",
			"Hoà Vị, giáng khí nghịch: buồn nôn, nôn.",
		],
	},
	CV17: {
		trang: 355,
		nhom: [
			"Điều khí, bổ khí, khai thông lồng ngực, giáng khí nghịch Phế và Vị: bệnh đường hô hấp, nôn, trào ngược, đau dây thần kinh liên sườn.",
			"Hỗ trợ sản phụ: rối loạn tiết sữa, viêm tuyến vú.",
		],
	},
	CV18: {
		trang: 356,
		nhom: [
			"Khai thông lồng ngực, điều khí, hạ khí nghịch: đau và tức vùng thượng vị — ngực — mạn sườn, đau họng, khó nuốt, ho, khó thở, hen phế quản, đau vùng trước tim, nôn, bệnh về vú.",
		],
	},
	CV19: {
		trang: 357,
		nhom: [
			"Khai thông lồng ngực: đau, căng cứng vùng ngực và xương ức.",
			"Điều khí, hạ khí nghịch: ho, khó thở, hen phế quản, nôn, co thắt thực quản, khó nuốt, kích động, đau xương.",
		],
	},
	CV20: {
		trang: 358,
		nhom: [
			"Khai thông lồng ngực: đau, căng tức ngực và mạn sườn, co thắt thực quản, khó nuốt.",
			"Điều khí, hạ khí nghịch: ho, khó thở, hen phế quản.",
		],
	},
	CV21: {
		trang: 359,
		nhom: [
			"Khai thông lồng ngực: đau, tức ngực và mạn sườn.",
			"Lợi họng: viêm họng.",
			"Giáng khí nghịch: ho, khó thở, hen phế quản, đầy trệ do ăn uống, co thắt thực quản, khó nuốt.",
		],
	},
	CV22: {
		trang: 360,
		nhom: [
			"Giáng khí nghịch, chỉ ho, hạ đờm, lợi họng: bệnh đường hô hấp như ho — khó thở — hen phế quản — viêm phế quản — viêm thanh quản — viêm họng — bệnh dây thanh âm, sốt nhiễm trùng cấp (do phong nhiệt) kèm đau họng và cảm giác nghẹn, bướu cổ, co thắt thực quản, mụn nhọt, khó nuốt.",
		],
	},
	CV23: {
		trang: 361,
		nhom: [
			"Hỗ trợ lưỡi: đau hoặc viêm gốc lưỡi, lưỡi yếu hoặc co rút, mất ngôn ngữ (nhất là sau đột quỵ), khó nuốt.",
			"Hạ khí, chỉ ho: khàn giọng, đau họng, khít hàm, khó thở.",
		],
	},
	CV24: {
		trang: 362,
		nhom: [
			"Trừ phong, nâng đỡ mặt, điều hoà mạch Nhâm: liệt mặt, đau dây thần kinh sinh ba (nhánh 3), sưng đau hàm dưới, viêm nướu, loét miệng lưỡi, chảy nhiều nước bọt, đau răng cửa dưới hoặc đau khi nhổ răng.",
			"Một trong thập tam quỷ huyệt của Tôn Tư Mạc: động kinh, hưng cảm.",
		],
	},

	// ── GV — Đốc Mạch (28) ───────────────────────────────────────
	GV1: {
		trang: 364,
		nhom: [
			"Hỗ trợ nhị tiện: tiểu khó, bí tiểu, trĩ, sa trực tràng, đại tiện đau khó, rối loạn cương dương, rối loạn chức năng tình dục.",
			"Thông kinh lạc, giảm đau: đau thắt lưng cùng, nặng đầu, run.",
			"An thần: hưng cảm, bồn chồn, co thắt, động kinh.",
		],
	},
	GV2: {
		trang: 365,
		nhom: [
			"Tăng cường sức mạnh vùng thắt lưng và chi dưới: đau thắt lưng cùng kèm hạn chế vận động, đau lưng do rễ thần kinh kèm teo cơ chi dưới.",
			"Trừ phong thấp: kinh nguyệt không đều, trĩ, tiểu khó, khí hư.",
		],
	},
	GV3: {
		trang: 366,
		nhom: [
			"Trừ phong thấp, tăng cường sức mạnh vùng thắt lưng và chi dưới: hội chứng tý (đau khớp/cơ, khó co duỗi) ở lưng — chân, co rút gân.",
			"Điều hoà khí hư: đau bụng kinh, khí hư (bạch đới), liệt dương, di tinh.",
		],
	},
	GV4: {
		trang: 367,
		nhom: [
			"Bổ Thận dương, ôn ấm khí huyết (nhất là khi phối cứu ngải), điều hoà mạch Đốc, tăng cường vùng thắt lưng: bệnh tiết niệu, rối loạn chức năng tình dục, sa trực tràng, trĩ, suy nhược mạn tính do Thận dương hư hoặc thiếu tinh, bệnh cột sống thắt lưng mạn tính kèm yếu chi dưới.",
			"Bình phong ở mạch Đốc: nhức đầu, động kinh.",
		],
	},
	GV5: {
		trang: 368,
		nhom: [
			"Tăng cường sức mạnh cột sống thắt lưng: cứng, đau vùng thắt lưng.",
			"Điều hoà hạ tiêu: tiêu chảy, thức ăn không tiêu lẫn trong phân, bệnh sán khí, tinh hoàn lạc chỗ, khí nghịch từ bụng dưới xông lên ngực (bôn đồn khí).",
		],
	},
	GV6: {
		trang: 369,
		nhom: [
			"Kiện Tỳ, hoá thấp: chướng bụng, khối u vùng bụng, vàng da, tiêu chảy, trĩ, sa trực tràng.",
			"Thông lợi cột sống: hạn chế vận động cột sống thắt lưng, động kinh.",
		],
	},
	GV7: {
		trang: 370,
		nhom: [
			"Điều hoà trung tiêu: đầy bụng, chán ăn, vàng da, vô kinh.",
			"Thông lợi cột sống: đau lưng.",
		],
	},
	GV8: {
		trang: 371,
		nhom: [
			"Bình Can phong, giảm co thắt: vàng da, uất ức dễ nổi giận, đau dạ dày, co thắt cơ, bồn chồn, đau tim.",
			"An thần: động kinh, trạng thái hưng cảm.",
		],
	},
	GV9: {
		trang: 372,
		nhom: [
			"Bổ Tỳ, trừ thấp và thấp nhiệt, điều hoà trung tiêu: đầy bụng hoặc cảm giác lạnh bụng, chán ăn, suy nhược kèm đau đớn, vàng da.",
			"Khai thông lồng ngực: đau thắt ngực, căng tức vùng ngực và mạn sườn, ho, khó thở, các vấn đề cột sống.",
		],
	},
	GV10: {
		trang: 373,
		nhom: [
			"Giáng nghịch khí Phế, chỉ ho, bình suyễn: khó thở, hen phế quản, ho mạn tính, suy nhược cơ thể (như loãng xương).",
			"Thanh nhiệt, giải độc: bệnh ngoài da như nhọt, mụn nhọt.",
			"Thông kinh lạc tại chỗ: các chứng ở vùng cổ và lưng như đau, hạn chế vận động.",
		],
	},
	GV11: {
		trang: 374,
		nhom: [
			"Bổ Tâm và Phế, an thần: khó thở, lo âu, hồi hộp, lú lẫn, suy giảm trí nhớ, tâm trạng chán nản, động kinh, bồn chồn, co thắt.",
			"Thanh nhiệt, trừ phong: sốt nhiễm trùng kèm đau đầu, ho, chóng mặt.",
			"Thông kinh lạc tại chỗ: các chứng vùng lưng trên.",
		],
	},
	GV12: {
		trang: 375,
		nhom: [
			"Bình phong: chảy máu cam, sốt co giật, ngạt thở, động kinh.",
			"An thần: kích động, trạng thái hưng cảm.",
			"Thanh nhiệt Phế và Tâm: ho, khó thở, sốt, sốt nhiễm trùng.",
		],
	},
	GV13: {
		trang: 376,
		nhom: [
			"Thanh nhiệt: sốt rét luân phiên (hàn nhiệt vãng lai), các hội chứng nhiệt, suy nhược cơ thể (như loãng xương).",
			"Điều hoà: nhức đầu, đau lưng dọc đường giữa lưng, chóng mặt, co giật, kích động, lú lẫn.",
		],
	},
	GV14: {
		trang: 377,
		nhom: [
			"Trừ ngoại phong, cố biểu: nhiễm trùng sốt, điều hoà ra mồ hôi (huyệt chính trị đổ mồ hôi bất thường).",
			"Thanh nhiệt: sốt, các bệnh nhiệt, bệnh ngoài da do phong nhiệt, chảy máu cam, suy nhược cơ thể (như loãng xương).",
			"Bình nội phong, an thần: mất ngủ, bồn chồn, động kinh, tăng huyết áp.",
			"Bổ hư: trạng thái kiệt sức.",
			"Hỗ trợ cột sống (nhất là cột sống cổ): hội chứng cột sống cổ, các vấn đề vùng cổ.",
		],
	},
	GV15: {
		trang: 378,
		nhom: [
			"Hỗ trợ lưỡi, thính giác, cổ và cột sống: cứng lưỡi, liệt lưỡi, mất ngôn ngữ, giảm thính lực, cứng cổ và cột sống.",
			"Bình phong: phù thũng, động kinh, trạng thái hưng cảm.",
			"Thanh dương nhiệt: sốt cao, cảm giác nóng bức, mất ý thức có dấu hiệu viêm, tiểu ít, nhịp tim nhanh, kích động, lú lẫn, chảy máu cam.",
		],
	},
	GV16: {
		trang: 379,
		nhom: [
			"Trừ ngoại phong: nhiễm trùng sốt, liệt mặt ngoại biên, hội chứng phong tý (đau buốt di chuyển không cố định, thường kèm sốt).",
			"Bình nội phong, an thần: bệnh về thần kinh nhất là vùng đầu, đau đầu vùng chẩm — thái dương — trán, đau nửa đầu, choáng váng, chóng mặt, chảy máu cam, trạng thái hưng cảm, động kinh.",
			"Bổ bể tuỷ, hỗ trợ đầu cổ: chóng mặt, ù tai, rối loạn thị giác, cứng cổ.",
		],
	},
	GV17: {
		trang: 381,
		nhom: [
			"Trừ phong, giảm đau: nặng đầu, đau đầu, sưng tấy vùng đầu, đau và cứng cổ.",
			"Sáng mắt: rối loạn thị giác như cận thị, đau mắt, chảy nước mắt, vàng da.",
			"An thần: trạng thái hưng cảm, mất ngôn ngữ, khít hàm.",
		],
	},
	GV18: {
		trang: 382,
		nhom: [
			"Trừ phong (nhất là nội phong), giảm đau, làm dịu triệu chứng: chóng mặt kèm buồn nôn — nôn, động kinh, các vấn đề vùng cổ, run đầu, co giật, kích động, mất ngủ, trạng thái hưng cảm.",
		],
	},
	GV19: {
		trang: 383,
		nhom: [
			"Trừ phong, giảm đau, làm dịu triệu chứng: chóng mặt, động kinh, đau đỉnh đầu, cứng cổ, run đầu, rối loạn giấc ngủ.",
		],
	},
	GV20: {
		trang: 384,
		nhom: [
			"Bình phong, bình dương, hỗ trợ trí não và các cơ quan cảm giác, an thần: chóng mặt, ù tai, nhức đầu, choáng váng, rối loạn tâm lý, rối loạn giấc ngủ, hội chứng cai nghiện.",
			"Bồi bổ bể tuỷ, thăng dương: chóng mặt, sa các tạng.",
		],
	},
	GV21: {
		trang: 385,
		nhom: [
			"Trừ nội phong, giảm co rút, làm dịu triệu chứng: chóng mặt, động kinh, viêm mũi chảy nhiều dịch trong, phù mặt, nhức đầu (đỉnh), sưng mặt (có thể hơi xanh), bồn chồn.",
		],
	},
	GV22: {
		trang: 386,
		nhom: [
			"Trừ phong (nội phong), hỗ trợ mũi và đầu: chóng mặt, động kinh, co giật, nhức đầu, các vấn đề về mũi như chảy máu cam — nghẹt mũi — polyp — mất khứu giác, bồn chồn, buồn ngủ.",
		],
	},
	GV23: {
		trang: 387,
		nhom: [
			"Trừ phong, hỗ trợ đầu — mặt — mũi — mắt, giảm sưng: các vấn đề về mũi như chảy máu cam — nghẹt mũi — polyp — viêm mũi — mất khứu giác, đỏ và sưng mặt, bệnh về mắt, chóng mặt.",
			"An thần: trạng thái hưng cảm.",
		],
	},
	GV24: {
		trang: 388,
		nhom: [
			"Hỗ trợ não và đầu, trừ nội phong, an thần: trạng thái hưng cảm, kích động tâm thần, bồn chồn, rối loạn giấc ngủ, suy giảm ý thức, động kinh, chóng mặt kèm nôn, đau đầu, ngất xỉu.",
			"Hỗ trợ mắt và mũi: các vấn đề về mũi như chảy máu cam — nghẹt mũi — polyp — viêm mũi — mất khứu giác, chảy nước mắt, rối loạn thị giác.",
		],
	},
	GV25: {
		trang: 389,
		nhom: [
			"Hỗ trợ mũi: các vấn đề về mũi như chảy máu cam, nghẹt mũi, polyp, viêm mũi, mất khứu giác.",
			"Điều hoà khí: khó thở, tăng huyết áp.",
		],
	},
	GV26: {
		trang: 390,
		nhom: [
			"Khai khiếu, hồi tỉnh (huyệt cấp cứu): sốc cấp mất ý thức, sốc do mất thể dịch, sốc nhiệt (say nắng), sự cố gãy kim khi châm, động kinh, hưng cảm, rối loạn tâm thần kèm mất ý thức.",
			"Hỗ trợ mặt và mũi, trừ ngoại phong: các vấn đề về mũi, giật cơ mặt, khít hàm, liệt mặt, sưng mặt, phù toàn thân.",
			"Hỗ trợ cột sống: đau thắt lưng cấp, nhất là khi đau ngay trên đường giữa cột sống.",
			"Một trong thập tam quỷ huyệt của Tôn Tư Mạc: trạng thái hưng cảm, động kinh.",
		],
	},
	GV27: {
		trang: 391,
		nhom: [
			"Thanh nhiệt, sinh tân dịch, hỗ trợ miệng: khát nước do nhiệt, khô miệng, viêm miệng, viêm nha chu, sưng hoặc cứng môi, chảy máu cam — nghẹt mũi.",
			"An thần: trạng thái hưng cảm, động kinh, khít hàm.",
		],
	},
	GV28: {
		trang: 392,
		nhom: [
			"Thanh nhiệt, hỗ trợ nướu — mắt — mũi: bệnh về nướu như viêm nha chu — tụt nướu — chảy máu, viêm hoặc dị ứng mắt, các vấn đề về mũi như nghẹt mũi — polyp — viêm mũi — viêm xoang, đỏ mặt bồn chồn, vàng da, cứng khớp cổ.",
		],
	},
};
let boSo = Object.entries(HO_SO);
if (gioiHanKinh) boSo = boSo.filter(([ma]) => gioiHanKinh.has(tienToKinh(ma)));

console.log(
	`Hồ sơ đã duyệt (lô 4 — CV/GV, LÔ CUỐI): ${Object.keys(HO_SO).length} huyệt.` +
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
// trong CSDL — bắt sai lệch tiền tố trước khi UPDATE âm thầm ghi trượt 0 hàng.
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
} else console.log("  ✓ khớp đủ, không lệch mã — 52/52 mã CV/GV khớp thẳng theo ma_huyet (không giả định 'mọi mã Đốc Mạch là GV', đã kiểm bằng truy vấn tiền tố riêng trước khi chốt bản này).");

// Đối chiếu số huyệt CV/GV trong nguồn hoso.json so với số tìm được trong CSDL.
const hoso = JSON.parse(readFileSync(resolve(goc, "cms/.tam-focks/hoso.json"), "utf8"));
const maTrongNguon = hoso
	.map((h) => h.ma)
	.filter((ma) => /^(CV|GV)[0-9]+$/.test(ma));
console.log(
	`\nĐối chiếu với nguồn hoso.json: ${maTrongNguon.length} huyệt CV/GV có trong nguồn,` +
		` ${maCanKiem.length} huyệt sẽ ghi ở lô này — chênh lệch ${maTrongNguon.length - maCanKiem.length} (kỳ vọng 0, không có ca loại trừ kiểu GB29 ở lô 3).`,
);

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

// Phép kiểm 2 (SAU khi ghi): đếm theo kinh. CV phải là 24, GV phải là 28.
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
const maKhacTargets = Object.values(KHOP_THEO_MA_KHAC);
if (maKhacTargets.length) {
	const demTheoMaKhac = await kho.query(
		"SELECT ma_huyet, (cong_dung_nhom IS NOT NULL) AS co FROM ec_huyet_vi WHERE ma_huyet = ANY($1::text[]) AND deleted_at IS NULL",
		[maKhacTargets],
	);
	for (const row of demTheoMaKhac.rows) console.log(`  (khớp theo mã khác, lệch tiền tố) ${row.ma_huyet}: ${row.co ? "đã ghi" : "chưa ghi"}`);
}

// Phép kiểm 2b (yêu cầu riêng của lô CUỐI này): đếm TỔNG toàn bảng ec_huyet_vi, không
// giới hạn theo kinh — kỳ vọng 357 = 11 (thí điểm Phế) + 92 (lô 1) + 113 (lô 2) +
// 89 (lô 3) + 52 (lô 4, lô này).
const demTong = await kho.query(
	"SELECT count(*)::int n FROM ec_huyet_vi WHERE cong_dung_nhom IS NOT NULL AND deleted_at IS NULL",
);
console.log(
	`\nTổng TOÀN BẢNG ec_huyet_vi có cong_dung_nhom: ${demTong.rows[0].n} (kỳ vọng 357).`,
);

// Phép kiểm 3: in CV4 (Quan Nguyên), CV17 (Chiên Trung/Đản Trung), GV20 (Bách Hội),
// GV26 (Nhân Trung) để soát giọng văn — bốn huyệt người mới học tra nhiều nhất lô này.
const mauSoat = await kho.query(
	"SELECT ma_huyet, title, cong_dung_nhom FROM ec_huyet_vi WHERE ma_huyet = ANY($1::text[]) AND deleted_at IS NULL",
	[["CV4", "CV17", "GV20", "GV26"]],
);
console.log("\nMẫu soát giọng văn:");
for (const row of mauSoat.rows) console.log(`  ${row.ma_huyet} ${row.title}:\n`, JSON.stringify(row.cong_dung_nhom, null, 2));

// Phép kiểm 4: hình dạng trên TOÀN BỘ cột (không chỉ lô này) — mọi cong_dung_nhom hiện
// có trong CẢ BẢNG phải có "nhom" là mảng CHUỖI, không được lẫn object con (đó là thứ
// làm td_chu() nuốt trắng mà không báo lỗi).
// ⚠️ Cột cong_dung_nhom là kiểu `json` (không phải `jsonb`) — dùng json_array_elements/
// json_typeof, KHÔNG dùng bản jsonb_* (đã đo: jsonb_array_elements(json) báo lỗi 42883
// "function ... does not exist", không lặng lẽ tự ép kiểu).
const kiemHinhToanBang = await kho.query(
	`SELECT coalesce(ma_huyet, slug) AS dinh_danh
	 FROM ec_huyet_vi
	 WHERE deleted_at IS NULL
	   AND cong_dung_nhom IS NOT NULL
	   AND EXISTS (
	     SELECT 1 FROM json_array_elements(cong_dung_nhom->'nhom') AS phan_tu
	     WHERE json_typeof(phan_tu) <> 'string'
	   )`,
);
console.log(
	`\nKiểm hình dạng TOÀN BỘ cột cong_dung_nhom (357 huyệt kỳ vọng): ${
		kiemHinhToanBang.rows.length
			? "✗ CÓ " + kiemHinhToanBang.rows.length + " huyệt lẫn object trong nhom: " + kiemHinhToanBang.rows.map((r) => r.dinh_danh).join(", ")
			: "✓ tất cả cong_dung_nhom.nhom hiện có trong toàn bảng đều là mảng chuỗi, không lẫn object."
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

// Phép kiểm 6 (kế thừa từ lô 3): slug='cu-lieu-2' (ma_huyet='GB29', thực chất là ST3
// ở mặt) phải VẪN CÒN NULL — xác nhận lô CV/GV này không đụng gì tới huyệt GB/ST.
const kiemCuLieu2 = await kho.query(
	"SELECT slug, title, ma_huyet, cong_dung_nhom FROM ec_huyet_vi WHERE slug = 'cu-lieu-2' AND deleted_at IS NULL",
);
console.log("\nKiểm riêng cu-lieu-2 (phải còn NULL):");
for (const row of kiemCuLieu2.rows) {
	console.log(
		`  slug=${row.slug} title=${row.title} ma_huyet=${row.ma_huyet} cong_dung_nhom=${
			row.cong_dung_nhom === null ? "NULL ✓" : "✗ KHÔNG NULL: " + JSON.stringify(row.cong_dung_nhom)
		}`,
	);
}
if (!kiemCuLieu2.rows.length) console.log("  ✗ không tìm thấy hàng slug='cu-lieu-2' — cần soát tay.");

console.log("\n→ ĐỦ CẢ BỐN LÔ. Bước tiếp theo (người dùng tự chạy, không chạy trong việc này):");
console.log("   node scripts-di-cu/dung-chi-muc.mjs huyet_vi");
console.log("   node scripts-di-cu/xuat-huyet-js.mjs");
await kho.end();
