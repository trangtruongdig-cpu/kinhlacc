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
// LÔ 3/4: 89 huyệt bốn kinh PC (Tâm Bào, 9), TE (Tam Tiêu, 23), GB (Đởm, 44 huyệt có
// trong nguồn nhưng BỎ GB29 → còn 43 — xem cảnh báo mã lệch bên dưới), LR (Can, 14).
// Lô 1 (LI/ST/SP/HE, 93 huyệt) và lô 2 (SI/BL/KI, 113 huyệt) đã ghi xong — bản HO_SO
// của hai lô đó không còn trong file này (xem lịch sử git nếu cần tra lại), theo đúng
// quy ước "mỗi lô ghi qua bản HO_SO của chính lô đó" ở dưới. Lô 4/4 (dự kiến, chưa
// làm): CV — Nhâm mạch (24), GV — Đốc mạch (28), khép đủ 359 huyệt của hoso.json. Mỗi
// phần tử "nhom" ứng với một cụm gạch đầu dòng "●" trong nguyenVan của nguồn (đã tách
// đúng theo nguyenVan — không dùng tacDung vì tacDung bị PDF-extract ngắt dòng giữa
// câu, xuống dòng sai chỗ); vài huyệt nguồn không có bullet "●" (một đoạn văn liền) —
// những huyệt đó chỉ có 1–2 phần tử "nhom" tách theo ý, không bịa thêm cụm.
//
// ⚠️ NHIỄU OCR trong nguồn: nhiều "nguyenVan" có chèn dòng chân trang giữa câu
// ("Phùng Văn Chiến (Việt hoá, biên soạn, chế hình) HUYỆT VỊ CHÂM CỨU THƯỜNG DÙNG
// <số trang>") do PDF ngắt trang giữa một gạch đầu dòng — đã lọc bỏ khi viết lại,
// không phải sự kiện thật của huyệt. Nhiều huyệt GB (GB31/32/33/35/38/39) có kèm một
// khối chú giải dài về "hội chứng Bi/Tý" (đau khớp/cơ, khó co duỗi) lặp lại gần như
// nguyên văn ở mỗi huyệt — đó là một chú thích thuật ngữ dùng chung trong sách, KHÔNG
// phải sự kiện riêng của từng huyệt, nên chỉ rút gọn còn "hội chứng tý (đau khớp/cơ,
// khó co duỗi)" một lần, không chép lại cả khối 4 loại tý (Hành/Thống/Trước/Nhiệt tý)
// ở mỗi huyệt — chép đủ 6 lần sẽ thành nội dung lặp, không thêm thông tin gì mới.
//
// ⚠️ MỘT CHỖ NGỜ SAI CỦA NGUỒN — đã né, không chép theo: PC6 (Nội Quan), tacDung ghi
// "Mở mạch Âm kiều" — nhưng theo bát mạch giao hội chuẩn, Nội Quan (PC6) là huyệt giao
// hội với mạch ÂM DUY, còn Âm Kiều giao hội ở Chiếu Hải (KI6). Không rõ đây là lỗi bản
// dịch hay lỗi gốc của Focks; vì không chắc, bản ghi ở đây KHÔNG nêu tên mạch (bỏ luôn
// "Âm kiều"/"Âm duy"), chỉ giữ lại các chỉ định lâm sàng thật (hồi hộp, lo âu, mất ngủ,
// chức năng tim) — đó mới là sự kiện chắc chắn đúng, phần gán tên mạch mới là chỗ ngờ.
//
// ⚠️ GB29 (CỰ LIÊU) — CHỦ ĐỘNG LOẠI KHỎI LÔ NÀY, không ghi bất kỳ nội dung nào:
//   CSDL có HAI hàng cùng tên "Cự Liêu" bị gán mã lẫn nhau (lỗi có sẵn trong từ điển
//   gốc, đang chờ xử lý riêng — KHÔNG sửa ma_huyet trong việc này):
//     slug='cu-lieu'   (vị trí hông, giữa gai chậu trước trên và mấu chuyển lớn, tự
//       khai "huyệt thứ 29 kinh Đởm" — tức GB29 THẬT) — ma_huyet đang RỖNG (NULL).
//     slug='cu-lieu-2' (vị trí mặt, dưới huyệt Tứ Bạch — Vi 2, tự khai "huyệt thứ 3
//       kinh Vị" — tức ST3 THẬT) — ma_huyet đang lưu SAI thành 'GB29'.
//   Nếu ghi theo mã ma_huyet='GB29' như các mã khác trong lô, nội dung huyệt HÔNG sẽ
//   bị dán nhầm vào trang huyệt MẶT (slug='cu-lieu-2'/ST3). Không có cách ghi đúng nào
//   trong phạm vi việc này (ghi theo slug='cu-lieu' cũng sai vì đó là sửa né tránh mã
//   lệch, thuộc phạm vi việc sửa ma_huyet đang thống nhất riêng) — nên KHÔNG GHI GB29,
//   không đưa vào HO_SO, không có trong BO_QUA_MA_LECH (không cần, vì không hề nằm
//   trong danh sách 89 mã sẽ kiểm/ghi của lô này). Tương tự lý do bỏ ST3 ở lô 1.
//
// ⚠️ MÃ CSDL — đã kiểm bằng truy vấn (--kiem) trước khi ghi, không giả định. 88/89 mã
// khớp THẲNG theo ma_huyet. Một trường hợp lệch, PHÁT HIỆN KHI KIỂM (không phải chuyện
// biết trước như GB29):
//   GB3 (Thượng Quan, tr274): CSDL không có hàng nào mang ma_huyet='GB3' — hàng
//     slug='thuong-quan' đúng vị trí/tên nhưng ma_huyet đang NULL (thiếu mã, không
//     phải lệch mã liên kinh như GB29/ST3). Ghi theo slug (KHOP_THEO_SLUG), KHÔNG đụng
//     cột ma_huyet.
// BO_QUA_MA_LECH và KHOP_THEO_MA_KHAC rỗng ở lô này (không có ca nào cần dùng đến),
// giữ biến để logic dùng chung với hai lô trước.
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
//   node scripts-di-cu/nap-cong-dung.mjs --kinh=PC,TE     # giới hạn lô ghi theo kinh (mặc định: cả lô)
//   node scripts-di-cu/nap-cong-dung.mjs
//
// ⚠️ Bốn lô (LI/ST/SP/HE, rồi SI/BL/KI, rồi PC/TE/GB/LR, rồi CV/GV dự kiến) đều ghi qua
// bản HO_SO của CHÍNH LÔ ĐÓ — đừng chạy lại lô cũ sau khi đã thay HO_SO bằng lô mới,
// dữ liệu lô cũ sẽ không được ghi lại (không mất, chỉ là không có tác dụng gì).
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

// Không có mã nào phải BỎ QUA vì lệch quy ước ở lô này (GB29 không nằm trong danh
// sách 89 mã của lô — xem cảnh báo "GB29 — CHỦ ĐỘNG LOẠI KHỎI LÔ NÀY" ở trên; đây là
// loại khỏi HO_SO hoàn toàn, khác với BO_QUA_MA_LECH vốn dùng cho mã CÓ mặt trong
// HO_SO nhưng phải bỏ qua lúc ghi). Giữ ba biến này rỗng để logic ghi/kiểm dùng chung
// với hai lô trước.
const BO_QUA_MA_LECH = {};
// GB3 (Thượng Quan): ma_huyet đang NULL trong CSDL, hàng đúng vị trí nằm ở
// slug='thuong-quan' — phát hiện khi chạy --kiem, không phải biết trước.
const KHOP_THEO_SLUG = {
	GB3: "thuong-quan",
};
const KHOP_THEO_MA_KHAC = {};

// Hồ sơ ĐÃ DUYỆT — lô 3: PC1…PC9, TE1…TE23, GB1…GB28+GB30…GB44 (43 mã, TRỪ GB29), LR1…
// LR14. `trang` là số trang trong bản dịch Focks/Phùng Văn Chiến đã đối chiếu (để truy
// nguồn); mỗi phần tử của `nhom` là "Tên nhóm công dụng: chỉ định cụ thể" viết lại
// bằng lời riêng, giữ nguyên SỰ KIỆN so với cms/.tam-focks/hoso.json.
const HO_SO = {
	// ── PC — Tâm Bào (9) ─────────────────────────────────────────
	PC1: {
		trang: 237,
		nhom: [
			"Giáng nghịch khí ở Phế: ho, thở khò khè, hen phế quản.",
			"Khai thông lồng ngực, điều khí, hoá đàm: tức ngực, đau dây thần kinh liên sườn (kể cả sau zona), sưng hạch và đau vùng nách, bồn chồn do co thắt cơ hoành.",
			"Lợi sữa: rối loạn tiết sữa, viêm tuyến vú.",
		],
	},
	PC2: {
		trang: 239,
		nhom: [
			"Khai thông lồng ngực: cảm giác tức ngực, căng tức.",
			"Dưỡng huyết, hoạt huyết, giảm đau: đau thắt ngực, đau nhói vùng tim, đau lan cả lồng ngực — lưng và mặt trong cánh tay.",
			"An thần: hồi hộp đánh trống ngực.",
		],
	},
	PC3: {
		trang: 240,
		nhom: [
			"Thanh nhiệt, tả hoả (thường chích nặn máu): sốt cao, say nắng.",
			"Điều hoà Vị Trường, chỉ ẩu: rối loạn tiêu hoá như đau bụng, viêm dạ dày ruột cấp do nắng nóng mùa hè.",
			"Thông kinh lạc, giảm đau: đau và co thắt vùng khuỷu — cánh tay, run tay, đau thắt ngực dọc đường kinh.",
		],
	},
	PC4: {
		trang: 241,
		nhom: [
			"Hành khí hoạt huyết, hoá ứ (Khích huyệt): giảm đau trong cơn đau thắt ngực cấp, rối loạn nhịp tim.",
			"An thần: mất ngủ, bồn chồn lo lắng do huyết ứ.",
			"Lương huyết, chỉ huyết: sốt cao, bệnh ngoài da.",
			"Thông kinh lạc: các chứng dọc đường kinh.",
		],
	},
	PC5: {
		trang: 242,
		nhom: [
			"Điều hoà trung tiêu, hoá đàm, an thần: cảm giác nghẹn ở họng (mai hạch khí), buồn nôn/nôn, tiêu chảy, rối loạn tâm lý do đờm như bồn chồn, hưng cảm, động kinh.",
			"Điều hoà kinh nguyệt: kinh nguyệt không đều, đau bụng kinh, nhau bong non, khí hư.",
			"Thông kinh lạc tại chỗ: hạch u, liệt, dị cảm (tê, kiến bò…) dọc đường kinh.",
		],
	},
	PC6: {
		trang: 243,
		nhom: [
			"An thần, điều hoà Tâm: hồi hộp, lo âu, bồn chồn, mất ngủ, các vấn đề liên quan chức năng tim.",
			"Khai thông lồng ngực, điều khí: đau ngực do tim, phổi hoặc xương ức.",
			"Hoà Vị, giáng nghịch: buồn nôn, nôn, đầy bụng, đầy thượng vị.",
			"Thanh nhiệt: sốt, tiểu khó, nứt lưỡi.",
			"Thông kinh lạc tại chỗ: đau vùng cẳng tay (ống cổ tay) và cổ tay.",
		],
	},
	PC7: {
		trang: 244,
		nhom: [
			"Thanh Tâm nhiệt, an thần: bồn chồn lo âu, mất ngủ, tiểu khó và tiểu ra máu khi hoả từ Tâm dồn xuống Bàng Quang.",
			"Điều hoà Vị Trường: rối loạn tiêu hoá.",
			"Khoan khoái lồng ngực: đau vùng ngực và mạn sườn, khó thở.",
			"Lương huyết: sốt cao, bệnh ngoài da do huyết nhiệt.",
			"Thông kinh lạc tại chỗ: bệnh vùng cổ tay, ngón tay.",
		],
	},
	PC8: {
		trang: 245,
		nhom: [
			"Thanh Tâm và Tâm bào nhiệt, khai khiếu tỉnh thần, lương huyết, an thần: sốt cao, bất tỉnh, đột quỵ, tăng huyết áp, rối loạn tâm thần thể hưng cảm/kích động, động kinh, viêm miệng, bệnh ngoài da do huyết nhiệt; tại chỗ trị chàm, nấm da tay, ra mồ hôi tay, bong da, run tay.",
			"Điều hoà và thanh nhiệt trung tiêu: nôn (có thể ra máu), viêm dạ dày.",
		],
	},
	PC9: {
		trang: 246,
		nhom: [
			"Khai khiếu, hồi tỉnh (huyệt Tỉnh, cấp cứu): bất tỉnh, sốc, suy sụp, say nắng, đột quỵ, động kinh ở trẻ em.",
			"Thanh nhiệt (Tâm, Tâm bào), an thần: sốt cao kèm kích động, nhức đầu do nhiệt, đau thắt ngực, tăng trương lực cơ, mất ngôn ngữ, cứng/đau lưỡi, viêm miệng, tiêu chảy cấp mùa hè, trẻ hay giật mình sợ hãi ban đêm.",
		],
	},

	// ── TE — Tam Tiêu (23) ───────────────────────────────────────
	TE1: {
		trang: 248,
		nhom: [
			"Thanh nhiệt thượng tiêu (huyệt Tỉnh): sốt kèm kích động, nóng ngực, đau vùng tim, tức ngực.",
			"Lợi tai lưỡi: ù tai, giảm thính lực, đau tai, cứng lưỡi, viêm lưỡi, rối loạn vị giác.",
			"Thông kinh lạc, giảm đau (dùng cho đau cấp): đau khuỷu tay, vai, cổ, ngực nhất là khi xoay vặn.",
		],
	},
	TE2: {
		trang: 249,
		nhom: [
			"Thanh nhiệt thượng tiêu: nhức đầu, đau răng, đau họng, đỏ mặt và đầu, viêm nha chu.",
			"Lợi tai, an thần khi có nhiệt: giảm thính lực (kể cả đột ngột), ù tai, đau tai, tim đập nhanh sau khi hoảng sợ, bồn chồn, ảo giác, hưng cảm, động kinh.",
			"Thông kinh lạc, giảm đau: đau tay/cánh tay (có thể do viêm khớp), hội chứng vai — cánh tay, viêm khớp ngón tay, đau họng.",
		],
	},
	TE3: {
		trang: 250,
		nhom: [
			"Bổ tai, thanh nhiệt đầu mắt: bệnh về tai, nhức đầu một bên, chóng mặt, viêm kết mạc, sốt nhiễm trùng nhất là phong nhiệt, hội chứng Thiếu Dương.",
			"Thông kinh lạc, giảm đau: các chứng ở chi trên, co thắt/liệt ngón tay.",
		],
	},
	TE4: {
		trang: 251,
		nhom: [
			"Thanh nhiệt, thư cân, giảm đau: đau họng, nhức đầu một bên, bệnh về tai; huyệt viễn đạo trị khớp cổ chân; tại chỗ/theo kinh trị vai, cánh tay (nhất là đau vai) và cổ tay.",
		],
	},
	TE5: {
		trang: 252,
		nhom: [
			"Trừ phong, giải biểu, lợi đầu tai, thanh nhiệt, khai thông mạch Dương Duy: sốt kèm sợ lạnh, bệnh về tai, viêm kết mạc, đau dây thần kinh sinh ba, nhức đầu, hội chứng Thiếu Dương, tức ngực.",
			"Thông kinh lạc, giảm đau: đau cổ/cột sống cổ nhất là khi khó cúi ngửa xoay, đau khuỷu tay, vai, cánh tay, bàn tay và ngón tay.",
		],
	},
	TE6: {
		trang: 253,
		nhom: [
			"Điều khí, thanh nhiệt Tam Tiêu, lợi mạn sườn, thông đại tiện: táo bón, kiết lỵ cấp tính, đau vùng sườn ngoài/hạ sườn; dùng làm huyệt châm tê trong phẫu thuật lồng ngực.",
			"Lợi họng, phục hồi giọng nói: mất tiếng cấp tính.",
			"Thông kinh lạc, giảm đau: các chứng dọc đường kinh.",
		],
	},
	TE7: {
		trang: 254,
		nhom: [
			"Thông kinh Tam Tiêu, lợi tai: ù tai, mất thính lực đột ngột, giảm thính lực; giảm đau và rối loạn cảm giác tại chỗ/theo kinh ở cánh tay.",
		],
	},
	TE8: {
		trang: 255,
		nhom: [
			"Thông lợi kinh Tam Tiêu: mất giọng cấp, mất thính lực cấp, đau răng, sốt.",
			"Thông kinh lạc, giảm đau: đau cánh tay và cột sống thắt lưng.",
		],
	},
	TE9: {
		trang: 256,
		nhom: [
			"Lợi họng tai: đau hàm dưới, đau răng họng, mất thính lực đột ngột, ù tai, mất giọng cấp.",
			"Thông kinh lạc tại chỗ: đau cẳng tay.",
		],
	},
	TE10: {
		trang: 257,
		nhom: [
			"Hoá đàm, tiêu u nhọt: ho có nhiều đờm, hạch bìu.",
			"Điều khí, giáng nghịch: đầy tức ngực, chán ăn kèm cảm giác no.",
			"An thần: động kinh, hưng phấn, bồn chồn, rối loạn nhịp tim, ngủ nhiều.",
			"Thanh nhiệt kinh Tam Tiêu: viêm/đau vùng thái dương và họng, mày đay, trĩ.",
			"Thông kinh lạc, giảm đau: đau dọc đường kinh (kèm teo cơ/co rút), đau nửa đầu, đau dây thần kinh liên sườn, đau thắt lưng sau chấn thương.",
		],
	},
	TE11: {
		trang: 258,
		nhom: [
			"Trừ phong thấp, thông kinh lạc: nhức đầu, đau vai và cánh tay kèm nặng nề, đau hàm dưới.",
			"Trừ thấp nhiệt: vàng da.",
		],
	},
	TE12: {
		trang: 259,
		nhom: [
			"Thông kinh lạc, giảm đau: nhức đầu, đau răng, đau cổ, đau cột sống ngực, đau cánh tay, cứng cổ, chóng mặt.",
		],
	},
	TE13: {
		trang: 260,
		nhom: [
			"Thông kinh lạc, giảm đau: đau, sưng, hạn chế vận động ở vai, cánh tay trên, xương bả vai.",
			"Hành khí, hoá đàm, tán kết: bướu cổ, hạch cổ, động kinh, bệnh về mắt.",
		],
	},
	TE14: {
		trang: 261,
		nhom: [
			"Trừ phong thấp, lợi khớp vai, thông kinh lạc, giảm đau: hạn chế vận động và đau vai nhất là khi giang tay, xoay ngoài; khó chịu và dị cảm ở chi trên.",
		],
	},
	TE15: {
		trang: 262,
		nhom: [
			"Thông kinh lạc, giảm đau: đau vai, cổ, lưng trên, có thể hạn chế vận động.",
			"Trừ phong thấp, khai thông lồng ngực, điều khí: sốt nhiễm trùng, tức ngực kèm bồn chồn.",
		],
	},
	TE16: {
		trang: 263,
		nhom: [
			"Lợi đầu và ngũ quan: giảm thính lực (kể cả đột ngột), giảm thị lực, giảm khứu giác và vị giác, viêm mũi.",
			"Hạ khí: sưng mặt và cổ, chóng mặt, hạch bướu cổ.",
			"Thông kinh lạc, giảm đau: nhức đầu vùng thái dương, đau cổ, cứng cổ.",
		],
	},
	TE17: {
		trang: 264,
		nhom: [
			"Trừ ngoại phong, lợi tai, thanh nhiệt, thông kinh lạc, giảm đau: bệnh về tai do mọi nguyên nhân, viêm tuyến mang tai, khít hàm, rối loạn khớp thái dương hàm, liệt mặt, đau dây thần kinh sinh ba.",
		],
	},
	TE18: {
		trang: 265,
		nhom: [
			"Trừ phong (và kinh phong ở trẻ): liệt mặt, động kinh, đau đầu, trẻ co giật do sợ hãi.",
			"Lợi tai: giảm thính lực (kể cả đột ngột), ù tai.",
		],
	},
	TE19: {
		trang: 266,
		nhom: [
			"Trấn kinh, chống co giật: chóng mặt, nhức đầu, liệt mặt, động kinh trẻ em.",
			"Lợi tai, thanh nhiệt: giảm thính lực đột ngột, ù tai.",
		],
	},
	TE20: {
		trang: 267,
		nhom: [
			"Thanh nhiệt, lợi tai răng môi: ù tai, giảm thính lực, viêm tai giữa, nhiễm trùng tai, bệnh về mắt, đau răng, sâu răng, viêm nha chu, viêm tuyến mang tai, khô miệng, cứng cổ.",
		],
	},
	TE21: {
		trang: 268,
		nhom: [
			"Thanh nhiệt, lợi tai: bệnh về tai, hội chứng Ménière (chóng mặt, buồn nôn, ù tai, nghe kém), khít hàm, đau răng, đau họng, nhức đầu, cứng môi, đau dây thần kinh sinh ba.",
		],
	},
	TE22: {
		trang: 269,
		nhom: [
			"Trừ phong: liệt mặt, ù tai, giảm thính lực đột ngột, viêm mũi.",
			"Thông kinh lạc, giảm đau: nhức đầu kèm nặng đầu, cứng hàm, co thắt hàm dưới.",
		],
	},
	TE23: {
		trang: 270,
		nhom: [
			"Dưỡng mắt, trừ phong, giảm đau: rối loạn thị giác, viêm kết mạc, bệnh về mí mắt, liệt mặt và giật cơ mặt, nhức đầu nhất là một bên và vùng mắt, đau nửa đầu, chóng mặt, động kinh và co giật ở trẻ em.",
		],
	},

	// ── GB — Đởm (44, TRỪ GB29 — xem BO_QUA_MA_LECH ở trên) ───────
	GB1: {
		trang: 272,
		nhom: [
			"Trừ phong, thanh nhiệt, dưỡng mắt: bệnh về mắt, nhức đầu, liệt mặt.",
		],
	},
	GB2: {
		trang: 273,
		nhom: [
			"Trừ phong, thanh nhiệt, lợi tai và khớp hàm, thông kinh lạc, giảm đau: bệnh về tai do mọi nguyên nhân, hội chứng Ménière, đau răng, rối loạn khớp thái dương hàm, liệt mặt, đau dây thần kinh sinh ba.",
		],
	},
	GB3: {
		trang: 274,
		nhom: [
			"Trừ phong, lợi tai, thông kinh lạc, giảm đau: nhức đầu, đau mặt và đau răng hàm trên, cứng môi, khít hàm, bệnh về tai (ù tai, giảm thính lực, viêm tai giữa), liệt mặt.",
		],
	},
	GB4: {
		trang: 275,
		nhom: [
			"Trừ phong, thanh nhiệt, thông kinh lạc, giảm đau: nhức đầu một bên, chóng mặt, động kinh, bệnh về tai, liệt mặt, đau mặt ngoài mắt, khít hàm, đau cổ tay.",
		],
	},
	GB5: {
		trang: 277,
		nhom: [
			"Trừ phong, thanh nhiệt, thông kinh lạc, giảm đau: nhức đầu một bên, đau vùng ngoài mắt, đau răng, đau mặt, sưng đỏ mặt, viêm mũi, viêm xoang, sốt nhiễm trùng kèm co giật.",
		],
	},
	GB6: {
		trang: 278,
		nhom: [
			"Trừ phong, thanh nhiệt, thông kinh lạc, giảm đau: nhức đầu một bên, đỏ bừng mặt, đau vùng ngoài mắt, đau răng, ù tai, hắt hơi, nóng vùng thượng vị.",
		],
	},
	GB7: {
		trang: 279,
		nhom: [
			"Trừ phong, lợi miệng hàm: nhức đầu, sưng má, viêm tuyến mang tai, quai bị, cứng cổ, khít hàm, mất tiếng, liệt mặt, đau cơ.",
		],
	},
	GB8: {
		trang: 280,
		nhom: [
			"Trừ phong, lợi đầu, giảm đau, điều hoà cơ hoành và Vị: đau đầu một bên nhất là kèm nôn (như đau nửa đầu hoặc do say rượu), liệt mặt, chóng mặt, bệnh về mắt.",
		],
	},
	GB9: {
		trang: 281,
		nhom: [
			"Thanh nhiệt kinh lạc, trấn kinh an thần: nhức đầu, ù tai, ngứa và ẩm sau tai, đau răng, sưng nướu, viêm nha chu, bướu cổ, dễ giật mình, động kinh.",
		],
	},
	GB10: {
		trang: 282,
		nhom: [
			"Thanh nhiệt, lợi họng, thông kinh lạc, giảm đau: nhức đầu, đau họng, đau răng, sốt nhiễm trùng, ù tai, giảm thính lực (kể cả đột ngột), bướu cổ, đau và hạn chế vận động vai — cánh tay, chân yếu.",
		],
	},
	GB11: {
		trang: 283,
		nhom: [
			"Làm nhẹ đầu, lợi ngũ quan, thông kinh lạc, giảm đau: nhức đầu, đau mắt, đau tai, đau họng, chóng mặt, lở loét, viêm tuyến mang tai, bệnh về tai (giảm thính lực, ù tai), cứng cổ, bướu cổ, ho, co rút gân tứ chi.",
		],
	},
	GB12: {
		trang: 284,
		nhom: [
			"Trừ phong, lợi đầu, giảm đau và sưng, an thần: nhức đầu, đau cổ, đau họng, đau răng, liệt mặt, sưng má, bệnh về tai (ù tai), mất ngủ, hưng cảm, động kinh.",
		],
	},
	GB13: {
		trang: 285,
		nhom: [
			"Trừ phong đàm, an thần: nhức đầu, chóng mặt, ngủ gà, liệt mặt, động kinh, ngất xỉu.",
		],
	},
	GB14: {
		trang: 286,
		nhom: [
			"Trừ phong (cả nội phong và ngoại phong), lợi đầu mắt, giảm đau: đau đầu vùng trán, dưới ổ mắt, thái dương, đỉnh đầu; đau dây thần kinh sinh ba nhánh 1; liệt mặt và giật cơ mặt (tic); bệnh về mắt và mí mắt.",
		],
	},
	GB15: {
		trang: 287,
		nhom: [
			"Trừ phong, lợi đầu mũi mắt, giảm đau: nhức đầu vùng trên hốc mắt, trán, chẩm; chóng mặt; bệnh về mắt; chảy nước mắt do gió; viêm mũi; viêm xoang; đột quỵ; động kinh.",
		],
	},
	GB16: {
		trang: 288,
		nhom: [
			"Trừ phong, dưỡng mắt, giảm đau: bệnh về mắt, viêm mũi, viêm xoang nhất là kèm đau đầu thái dương, sưng mặt và đầu, đau răng hàm trên, viêm nha chu, sốt nhiễm trùng, chóng mặt, động kinh.",
		],
	},
	GB17: {
		trang: 289,
		nhom: [
			"Lợi đầu, điều hoà Vị, giảm đau: nhức đầu một bên, đau răng hàm trên, chóng mặt, buồn nôn và nôn, cứng cổ, sợ gió lạnh.",
		],
	},
	GB18: {
		trang: 290,
		nhom: [
			"Lợi đầu mũi, nhuận Phế, giảm đau: nhức đầu và đau mắt, chóng mặt, viêm mũi, chảy máu cam, sợ gió lạnh.",
		],
	},
	GB19: {
		trang: 291,
		nhom: [
			"Trừ phong, lợi mắt và đầu, tỉnh thần, thông kinh lạc, giảm đau: đau đầu cổ, cứng cổ, bệnh về mắt, sưng mắt, viêm mũi, chảy máu cam, giảm thính lực và ù tai, chóng mặt, lú lẫn do phong.",
		],
	},
	GB20: {
		trang: 292,
		nhom: [
			"Trừ phong, lợi mắt và đầu, thanh lợi ngũ quan: nhức đầu, đau nửa đầu, chóng mặt, đau tai, bệnh về mắt và mũi, khít hàm, sưng mặt, mề đay, liệt mặt.",
			"Thông kinh lạc, giảm đau, an thần: các chứng ở cột sống cổ — vai — lưng trên, tăng huyết áp, động kinh, mất ngủ, suy giảm trí nhớ.",
		],
	},
	GB21: {
		trang: 293,
		nhom: [
			"Điều khí, hoá đàm, tán kết: \"bệnh đờm\" tích tụ, ho, khó thở, cơn hen cấp.",
			"Thông kinh lạc, giảm đau: các chứng ở vai/cổ.",
			"Trợ sinh, lợi sữa: hỗ trợ chuyển dạ, sổ nhau, lợi sữa, viêm tuyến vú.",
		],
	},
	GB22: {
		trang: 294,
		nhom: [
			"Điều khí, khai thông lồng ngực, lợi nách: ho, tức ngực, đau dây thần kinh liên sườn, sưng hạch nách, đau vai — cánh tay kèm hạn chế vận động.",
		],
	},
	GB23: {
		trang: 295,
		nhom: [
			"Khai thông lồng ngực, điều hoà khí và Tam Tiêu: ho, khó thở, hen phế quản, tức ngực, buồn nôn, nôn, ợ hơi, ợ chua, mất ngủ, tâm trạng chán nản, đau cánh tay và mạn sườn, đau dây thần kinh liên sườn.",
		],
	},
	GB24: {
		trang: 297,
		nhom: [
			"Lợi Đởm, sơ Can khí, trừ thấp nhiệt, giáng nghịch, điều hoà trung tiêu (Mộ huyệt của Đởm): bệnh gan mật, rối loạn tiêu hoá, đau mạn sườn và bụng, đau dây thần kinh liên sườn.",
		],
	},
	GB25: {
		trang: 298,
		nhom: [
			"Bổ Thận, điều hoà thuỷ đạo (Mộ huyệt của Thận): bệnh về thận và đường tiết niệu.",
			"Bổ Tỳ, điều hoà đường ruột: bệnh về tiêu hoá.",
			"Lợi vùng thắt lưng: các vấn đề thắt lưng — hông, đau bụng do thận.",
		],
	},
	GB26: {
		trang: 299,
		nhom: [
			"Điều hoà mạch Đới, trừ thấp, điều hoà tử cung: khí hư, kinh nguyệt không đều, đau bụng kinh, hiếm muộn, sa tử cung.",
			"Thông kinh lạc, giảm đau: đau vùng thắt lưng và mạn sườn, mót rặn, co thắt, bệnh sán khí (thoát vị, bệnh sinh dục ngoài).",
		],
	},
	GB27: {
		trang: 300,
		nhom: [
			"Điều hoà mạch Đới và hạ tiêu, trừ ứ trệ: khí hư, kinh nguyệt không đều, sa tử cung, đau vùng chậu, đau tinh hoàn, mót rặn, táo bón, đau lưng — thắt lưng — hồi tràng, co thắt, bệnh sán khí, các vấn đề khớp hông.",
		],
	},
	GB28: {
		trang: 301,
		nhom: [
			"Điều hoà mạch Đới và hạ tiêu, trừ ứ trệ: khí hư, kinh nguyệt không đều, sa tử cung, đau bụng dưới, đau thắt lưng — hồi tràng, bệnh sán khí.",
		],
	},
	GB30: {
		trang: 303,
		nhom: [
			"Thông kinh lạc, giảm đau, lợi chân và khớp hông, trừ phong thấp: các chứng ở thắt lưng, chậu, hông; đau thắt lưng lan xuống chân (đau thần kinh toạ); các chứng khớp cùng chậu và cơ hình lê; bệnh ngoài da như mề đay, chàm.",
		],
	},
	GB31: {
		trang: 304,
		nhom: [
			"Khu phong, giảm ngứa, thông kinh lạc, giảm đau: hội chứng tý (đau khớp/cơ, khó co duỗi) ở chi dưới, vùng thắt lưng và hông, đau thần kinh toạ, liệt nửa người, ngứa, mề đay.",
		],
	},
	GB32: {
		trang: 305,
		nhom: [
			"Khu phong, giảm ngứa, thông kinh lạc, giảm đau: hội chứng tý ở chi dưới, vùng thắt lưng và hông, đau thần kinh toạ, liệt nửa người, ngứa, mề đay.",
		],
	},
	GB33: {
		trang: 306,
		nhom: [
			"Trừ phong thấp, thư cân, lợi khớp: hội chứng tý ở vùng gối và cẳng chân, các vấn đề ở khớp gối (đau, dị cảm, hạn chế vận động).",
		],
	},
	GB34: {
		trang: 307,
		nhom: [
			"Lợi cân và khớp, thông kinh lạc, giảm đau (Hội huyệt của Cân): bệnh về gân như co rút, rối loạn vận động, cứng cơ, cứng khớp, hội chứng tý nhất là ở chi dưới; các chứng dọc đường kinh.",
			"Thanh thấp nhiệt ở Can Đởm: bệnh túi mật, vàng da.",
			"Điều hoà Thiếu Dương: hội chứng Thiếu Dương.",
		],
	},
	GB35: {
		trang: 309,
		nhom: [
			"Thông kinh lạc, giảm đau: hội chứng tý ở chi dưới, các vấn đề ở khớp gối.",
			"Điều hoà Đởm khí, an thần: căng tức vùng mạn sườn và hạ sườn, lo lắng, cáu gắt, khó quyết định.",
		],
	},
	GB36: {
		trang: 310,
		nhom: [
			"Điều hoà Đởm khí và Can khí: co thắt cơ/đau ở chi dưới.",
			"Trừ thấp nhiệt: co thắt dạ dày sau khi ăn đồ nóng, béo.",
			"Thư cân: căng cứng cổ.",
			"An thần: động kinh, hưng cảm.",
		],
	},
	GB37: {
		trang: 311,
		nhom: [
			"Dưỡng mắt: bệnh về mắt.",
			"Trừ phong thấp, thông kinh lạc, giảm đau: bệnh vú, rối loạn tiết sữa, đau đầu một bên, đau nửa đầu, đau đầu gối, các chứng vùng cẳng chân.",
		],
	},
	GB38: {
		trang: 312,
		nhom: [
			"Thông kinh lạc, thanh nhiệt, giảm đau, lợi cân xương: nhức đầu một bên, đau nửa đầu, các chứng dọc đường kinh, sốt, đau khớp lan toả (hội chứng tý).",
			"Điều hoà Thiếu Dương: hội chứng Thiếu Dương.",
		],
	},
	GB39: {
		trang: 314,
		nhom: [
			"Thông kinh lạc, lợi cân cốt, trừ phong thấp (Hội huyệt của Tuỷ): các chứng dọc đường kinh, hội chứng tý và chứng nuy (teo, liệt) mạn tính.",
			"Thanh Đởm nhiệt: căng đầy vùng mạn sườn và bụng.",
		],
	},
	GB40: {
		trang: 315,
		nhom: [
			"Thông kinh lạc, giảm đau, lợi khớp (Nguyên huyệt của Đởm): các chứng dọc đường kinh, đau thần kinh toạ, nhức đầu một bên, đau khớp cổ chân tại chỗ.",
			"Sơ Can khí, thanh thấp nhiệt ở Đởm: bệnh về mắt, đầy tức ngực và mạn sườn, mụn rộp (zona).",
			"Điều hoà Thiếu Dương: hội chứng Thiếu Dương.",
		],
	},
	GB41: {
		trang: 316,
		nhom: [
			"Sơ Can khí, lợi mạn sườn — ngực — vú, hoá đàm tán kết: Can khí uất kết và các chứng dọc đường kinh, viêm tuyến vú, cai sữa.",
			"Làm nhẹ đầu, dưỡng mắt: nhức đầu, chóng mặt, bệnh về mắt/tai.",
		],
	},
	GB42: {
		trang: 318,
		nhom: [
			"Điều hoà Can khí: nhức đầu, viêm kết mạc, ù tai, giảm thính lực, đau tại chỗ ở mu bàn chân.",
			"Thanh Đởm nhiệt: đầy tức ngực và mạn sườn, sưng hạch nách, viêm tuyến vú.",
		],
	},
	GB43: {
		trang: 319,
		nhom: [
			"Thanh nhiệt, lợi mắt tai đầu, trừ thấp nhiệt kinh lạc, giảm sưng: bệnh về mắt và tai, đau mặt, nhức đỉnh đầu, viêm tuyến mang tai, viêm kết mạc, tăng trương lực, ù tai, mất thính lực đột ngột, đau dây thần kinh liên sườn, đầy tức vùng sườn — thượng vị, viêm tuyến vú, sốt nhiễm trùng, đau khớp lan toả, đau và co rút ngón chân.",
		],
	},
	GB44: {
		trang: 320,
		nhom: [
			"Thanh nhiệt, lợi đầu và ngực: đau nửa đầu, nhức đầu, đau mắt, chóng mặt, viêm kết mạc, ù tai, giảm thính lực đột ngột, đau họng, cứng lưỡi, căng tức vùng sườn, sốt nhiễm trùng.",
			"An thần: mất ngủ, kích động.",
		],
	},

	// ── LR — Can (14) ────────────────────────────────────────────
	LR1: {
		trang: 322,
		nhom: [
			"Điều hoà đường tiểu, lợi sinh dục, giảm đau: đau, viêm, phù nề vùng bụng dưới và sinh dục, bệnh sán khí, khó chịu ở tinh hoàn, tiểu khó, bí tiểu, đái dầm, tiểu buốt.",
			"Sơ Can khí, cầm máu: rong huyết/băng huyết tử cung, kinh nguyệt không đều, sa tử cung.",
			"Hồi dương, an thần (huyệt cấp cứu): bất tỉnh, choáng váng, động kinh.",
		],
	},
	LR2: {
		trang: 323,
		nhom: [
			"Thanh Can nhiệt, sơ Can khí, bình Can phong, cầm máu, lợi hạ tiêu: các chứng thực nhiệt vùng đầu như động kinh/co giật ở trẻ, nhức đầu nhất là đỉnh đầu, đau nửa đầu, tăng huyết áp, chóng mặt, ù tai, bồn chồn, hưng cảm, mất ngủ, bệnh về mắt, viêm đường tiết niệu, rối loạn kinh nguyệt như rong kinh, ngứa/đau vùng sinh dục ngoài, khí hư, bệnh sán khí.",
		],
	},
	LR3: {
		trang: 324,
		nhom: [
			"Sơ Can khí, sáng mắt, lợi đầu, dưỡng Can huyết và âm huyết, điều kinh, lợi hạ tiêu (Nguyên huyệt của Can): Can khí uất kết với cảm giác căng tức, đau nhức nhiều nơi (đầu, mắt, cổ, ngực, tim, tiêu hoá, sinh dục), rối loạn tâm lý — thần kinh thực vật, căng cơ/co thắt.",
			"Trừ nội phong, bình Can dương: nhức đầu, chóng mặt, động kinh.",
		],
	},
	LR4: {
		trang: 325,
		nhom: [
			"Thông kinh lạc, sơ Can khí, thanh nhiệt kinh Can, điều hoà hạ tiêu: đau bụng dưới và sinh dục ngoài, tiểu khó, rối loạn xuất tinh, các vấn đề khớp cổ chân, bệnh sán khí.",
		],
	},
	LR5: {
		trang: 327,
		nhom: [
			"Điều hoà Can khí, lợi sinh dục, trừ thấp nhiệt hạ tiêu, điều kinh: bệnh đường sinh dục (ngứa/sưng/đau), rối loạn kinh nguyệt, khí hư, bệnh sán khí, rối loạn tiểu tiện, cảm giác nghẹn ở họng (mai hạch khí).",
			"Thông kinh lạc tại chỗ: các chứng ở cẳng chân.",
		],
	},
	LR6: {
		trang: 328,
		nhom: [
			"Bổ Can khí, điều hoà hạ tiêu, điều huyết, trừ thấp: khí hư, rong huyết tử cung, dị cảm và teo cơ chi dưới nhất là do thấp nhiệt, bệnh sán khí.",
		],
	},
	LR7: {
		trang: 329,
		nhom: [
			"Lợi khớp gối, thư cân: đau và viêm vùng trong khớp gối.",
			"Trừ phong thấp: sưng đau khớp gối, hạn chế vận động khớp gối.",
		],
	},
	LR8: {
		trang: 330,
		nhom: [
			"Trừ thấp nhiệt hạ tiêu (tác dụng chính), lợi sinh dục và tử cung: rối loạn tiết niệu, đau/sưng/ngứa vùng sinh dục ngoài, rối loạn chức năng tình dục.",
			"Dưỡng âm huyết: nhức đầu, chóng mặt, rối loạn kinh nguyệt.",
			"Thông kinh lạc tại chỗ: đau khớp gối và cẳng chân.",
		],
	},
	LR9: {
		trang: 331,
		nhom: [
			"Lợi hạ tiêu: tiểu khó, bí tiểu, tiểu không tự chủ, đái dầm, rối loạn kinh nguyệt.",
			"Thông kinh lạc: đau, liệt, dị cảm vùng đùi, đau thắt lưng cùng lan xuống bụng.",
		],
	},
	LR10: {
		trang: 332,
		nhom: [
			"Thanh nhiệt, lợi tiểu tiện: khó chịu vùng chậu, viêm/u tuyến tiền liệt, chàm sinh dục, tiểu khó, bí tiểu, đái dầm.",
			"Thư cân: đau và hạn chế vận động ở đùi.",
		],
	},
	LR11: {
		trang: 333,
		nhom: [
			"Lợi tử cung: rối loạn kinh nguyệt, hiếm muộn.",
			"Thư cân: đau và hạn chế vận động vùng háng và đùi.",
		],
	},
	LR12: {
		trang: 334,
		nhom: [
			"Tán hàn kinh Can, lợi hạ tiêu: đau bụng dưới lan xuống sinh dục, đau háng, sa tử cung, bệnh sán khí.",
		],
	},
	LR13: {
		trang: 335,
		nhom: [
			"Điều hoà Can và Tỳ, sơ Can khí (nhất là trung — hạ tiêu), bổ Tỳ (Mộ huyệt của Tỳ, Hội huyệt của Tạng): bệnh tiêu hoá nhất là khi Can khí phạm Tỳ Vị, đau hạ sườn/ngực bên, các chứng cột sống hông — thắt lưng nhất là khi xoay người.",
		],
	},
	LR14: {
		trang: 336,
		nhom: [
			"Điều hoà Can khí và Can huyết (nhất là thượng — trung tiêu), lương huyết, tiêu tích, điều hoà Can — Vị (Mộ huyệt của Can): bệnh tiêu hoá, bệnh túi mật và gan, căng cứng ngực — vú — hạ sườn — bụng, ho, khó thở, đau dây thần kinh liên sườn, bệnh lý tuyến vú.",
		],
	},
};
let boSo = Object.entries(HO_SO);
if (gioiHanKinh) boSo = boSo.filter(([ma]) => gioiHanKinh.has(tienToKinh(ma)));

console.log(
	`Hồ sơ đã duyệt (lô 3 — PC/TE/GB/LR): ${Object.keys(HO_SO).length} huyệt.` +
		(gioiHanKinh ? ` --kinh giới hạn còn ${boSo.length}.` : ""),
);
console.log(
	"GB29 (Cự Liêu) CHỦ ĐỘNG LOẠI KHỎI danh sách sẽ ghi của lô này: " +
		(boSo.some(([ma]) => ma === "GB29")
			? "✗ VẪN CÒN trong HO_SO — LỖI, phải bỏ trước khi ghi."
			: "✓ không có trong HO_SO/boSo (lý do: xem cảnh báo ở đầu file — ma_huyet='GB29' hiện đang gán cho hàng slug=cu-lieu-2, thực chất là ST3 ở mặt)."),
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
} else console.log("  ✓ khớp đủ, không lệch mã.");

// Đối chiếu số huyệt bốn kinh này trong nguồn hoso.json so với số tìm được trong CSDL
// (yêu cầu riêng của lô này — so PC/TE/GB/LR trong nguồn gốc, KHÔNG chỉ so với HO_SO
// đã lọc GB29, để thấy rõ 90 huyệt nguồn → 89 sẽ ghi, chênh đúng 1 là GB29).
const hoso = JSON.parse(readFileSync(resolve(goc, "cms/.tam-focks/hoso.json"), "utf8"));
const maTrongNguon = hoso
	.map((h) => h.ma)
	.filter((ma) => /^(PC|TE|GB|LR)[0-9]+$/.test(ma));
console.log(
	`\nĐối chiếu với nguồn hoso.json: ${maTrongNguon.length} huyệt PC/TE/GB/LR có trong nguồn` +
		` (gồm cả GB29), ${maCanKiem.length} huyệt sẽ ghi ở lô này (đã trừ GB29) — chênh lệch ${maTrongNguon.length - maCanKiem.length} đúng bằng số mã GB29 bị loại.`,
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

// Phép kiểm 2 (SAU khi ghi): đếm theo kinh. GB phải là 43, không phải 44.
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

// Phép kiểm 3: in PC6 (Nội Quan), GB20 (Phong Trì) và LR3 (Thái Xung) để soát giọng
// văn — ba huyệt người mới học tra rất nhiều trong lô này.
const mauSoat = await kho.query(
	"SELECT ma_huyet, title, cong_dung_nhom FROM ec_huyet_vi WHERE ma_huyet = ANY($1::text[]) AND deleted_at IS NULL",
	[["PC6", "GB20", "LR3"]],
);
console.log("\nMẫu soát giọng văn:");
for (const row of mauSoat.rows) console.log(`  ${row.ma_huyet} ${row.title}:\n`, JSON.stringify(row.cong_dung_nhom, null, 2));

// Phép kiểm 4: hình dạng — mọi cong_dung_nhom vừa ghi phải có "nhom" là mảng CHUỖI,
// không được lẫn object con (đó là thứ làm td_chu() nuốt trắng mà không báo lỗi).
// ⚠️ Cột cong_dung_nhom là kiểu `json` (không phải `jsonb`) — dùng json_array_elements/
// json_typeof, KHÔNG dùng bản jsonb_* (đã đo: jsonb_array_elements(json) báo lỗi 42883
// "function ... does not exist", không lặng lẽ tự ép kiểu).
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

// Phép kiểm 6 (riêng cho lô này): slug='cu-lieu-2' (ma_huyet='GB29', thực chất là ST3
// ở mặt) phải VẪN CÒN NULL sau lô — xác nhận không có gì bị dán nhầm vào đó.
const kiemCuLieu2 = await kho.query(
	"SELECT slug, title, ma_huyet, cong_dung_nhom FROM ec_huyet_vi WHERE slug = 'cu-lieu-2' AND deleted_at IS NULL",
);
console.log("\nKiểm riêng cu-lieu-2 (phải còn NULL sau lô này):");
for (const row of kiemCuLieu2.rows) {
	console.log(
		`  slug=${row.slug} title=${row.title} ma_huyet=${row.ma_huyet} cong_dung_nhom=${
			row.cong_dung_nhom === null ? "NULL ✓" : "✗ KHÔNG NULL: " + JSON.stringify(row.cong_dung_nhom)
		}`,
	);
}
if (!kiemCuLieu2.rows.length) console.log("  ✗ không tìm thấy hàng slug='cu-lieu-2' — cần soát tay.");

console.log("\n→ Đợi ĐỦ CẢ BỐN LÔ rồi mới chạy một lượt (KHÔNG chạy giữa lô):");
console.log("   node scripts-di-cu/dung-chi-muc.mjs huyet_vi");
console.log("   node scripts-di-cu/xuat-huyet-js.mjs");
await kho.end();
