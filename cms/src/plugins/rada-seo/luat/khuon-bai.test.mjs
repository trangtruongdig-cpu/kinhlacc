import { test } from "node:test";
import assert from "node:assert/strict";
import { kiemKhuon } from "./khuon-bai.mjs";

const maLoi = (r) => r.loi.map((x) => x.ma).sort();
const maCanh = (r) => r.canhBao.map((x) => x.ma).sort();

// ~1.000 từ để khỏi dính cảnh báo độ dài trong các test không nói về độ dài.
const DEM = Array.from({ length: 330 }, () => "khí huyết lưu").join(" ");

function bai({ dan = "Huyệt Túc Tam Lý là huyệt hợp của kinh Vị, hay dùng để bồi bổ.", diem = 4, than = "", them = "" } = {}) {
	return [
		dan,
		"",
		"## Điểm chính",
		"",
		...Array.from({ length: diem }, (_, i) => `- Ý chính số ${i + 1}`),
		"",
		"## Vị trí",
		"",
		DEM,
		"",
		"## Tác dụng",
		"",
		"### Theo Đông Y",
		"",
		"Điều hoà Tỳ Vị." + than,
		"",
		"## Cách xác định",
		"",
		"Đo bốn thốn dưới gối.",
		them,
	].join("\n");
}

test("bài đúng khuôn: không lỗi, không cảnh báo", () => {
	const r = kiemKhuon(bai(), { tuKhoaChinh: "huyệt túc tam lý" });
	assert.deepEqual(r.loi, []);
	assert.deepEqual(r.canhBao, []);
	assert.ok(r.soTu >= 900 && r.soTu <= 2200, String(r.soTu));
});

test("H1 trong thân là lỗi (tiêu đề là trường riêng)", () => {
	assert.deepEqual(maLoi(kiemKhuon("# Huyệt Túc Tam Lý\n\n" + bai(), {})), ["h1_trong_than"]);
});

test("bảng markdown là lỗi", () => {
	const r = kiemKhuon(bai({ them: "\n| Huyệt | Kinh |\n|---|---|\n| ST36 | Vị |" }), {});
	assert.deepEqual(maLoi(r), ["bang"]);
	assert.deepEqual(maLoi(kiemKhuon(bai({ them: "\n| a | b |\n| :-- | --: |\n| 1 | 2 |" }), {})), ["bang"]);
});

test("ảnh markdown là lỗi", () => {
	assert.deepEqual(maLoi(kiemKhuon(bai({ them: "\n![Huyệt](https://x/y.jpg)" }), {})), ["anh_md"]);
});

test("mục FAQ / nguồn tham khảo / miễn trừ trong thân là lỗi", () => {
	assert.deepEqual(maLoi(kiemKhuon(bai({ them: "\n## Câu hỏi thường gặp\n\nHỏi đáp." }), {})), ["muc_faq"]);
	assert.deepEqual(maLoi(kiemKhuon(bai({ them: "\n### FAQ\n\nHỏi đáp." }), {})), ["muc_faq"]);
	assert.deepEqual(maLoi(kiemKhuon(bai({ them: "\n## Nguồn tham khảo\n\n- Sách A" }), {})), ["muc_nguon"]);
	assert.deepEqual(maLoi(kiemKhuon(bai({ them: "\n## Tài liệu tham khảo\n\n- Sách A" }), {})), ["muc_nguon"]);
	const mt =
		"\nBài viết chỉ mang tính tham khảo & học tập theo lý luận Đông Y, không thay thế việc thăm khám, chẩn đoán hay điều trị của thầy thuốc có chuyên môn.";
	assert.deepEqual(maLoi(kiemKhuon(bai({ them: mt }), {})), ["mien_tru"]);
	assert.deepEqual(maLoi(kiemKhuon(bai({ them: "\n## Miễn trừ trách nhiệm\n\nXem trang." }), {})), ["mien_tru"]);
});

test("không vu oan: câu thường có 'không thay thế' nhưng không phải miễn trừ", () => {
	assert.deepEqual(maLoi(kiemKhuon(bai({ than: " Châm cứu không thay thế được việc ngủ đủ giấc." }), {})), []);
});

test("thiếu Điểm chính, hoặc Điểm chính không đủ 3–6 gạch đầu dòng, là lỗi", () => {
	const r = kiemKhuon(bai().replace("## Điểm chính", "## Tóm lược"), {});
	assert.ok(maLoi(r).includes("thieu_diem_chinh"), maLoi(r).join(","));
	assert.deepEqual(maLoi(kiemKhuon(bai({ diem: 2 }), {})), ["diem_chinh_so_muc"]);
	assert.deepEqual(maLoi(kiemKhuon(bai({ diem: 7 }), {})), ["diem_chinh_so_muc"]);
	assert.deepEqual(maLoi(kiemKhuon(bai({ diem: 3 }), {})), []);
	assert.deepEqual(maLoi(kiemKhuon(bai({ diem: 6 }), {})), []);
});

test("dưới 3 mục ## thân bài là lỗi (Điểm chính không tính)", () => {
	const md = bai().replace("## Cách xác định", "### Cách xác định");
	assert.deepEqual(maLoi(kiemKhuon(md, {})), ["it_muc_h2"]);
});

test("khối code không bị soát (# hay | trong code không tính)", () => {
	assert.deepEqual(maLoi(kiemKhuon(bai({ them: "\n```\n# không phải H1\n|---|---|\n```" }), {})), []);
});

test("cảnh báo độ dài chỉ ghi số, không khuyên", () => {
	const ngan = kiemKhuon("Dẫn.\n\n## Điểm chính\n\n- a\n- b\n- c\n\n## A\n\nx\n\n## B\n\ny\n\n## C\n\nz", {});
	assert.deepEqual(maLoi(ngan), []);
	assert.deepEqual(maCanh(ngan), ["do_dai"]);
	const g = ngan.canhBao[0].ghiChu;
	assert.ok(g.includes(String(ngan.soTu)) && g.includes("900") && g.includes("2.200"), g);
	assert.ok(!/viết|thêm|dài hơn|nên/iu.test(g), g);
	const dai = kiemKhuon(bai({ than: " " + DEM + " " + DEM }), {});
	assert.deepEqual(maCanh(dai), ["do_dai"]);
});

test("soTu đếm từ theo khoảng trắng, bỏ dấu markdown", () => {
	assert.equal(kiemKhuon("## Điểm chính\n\n- Bồi bổ khí huyết", {}).soTu, 6);
});

test("từ khoá chính so không dấu với đoạn dẫn", () => {
	assert.deepEqual(maCanh(kiemKhuon(bai(), { tuKhoaChinh: "Huyet tuc tam ly" })), []);
	const r = kiemKhuon(bai(), { tuKhoaChinh: "đo kinh lạc" });
	assert.deepEqual(maCanh(r), ["tu_khoa_doan_dan"]);
	// Từ khoá chỉ nằm ở thân, không ở đoạn dẫn → vẫn cảnh báo.
	assert.deepEqual(maCanh(kiemKhuon(bai({ than: " Tỳ Vị hư." }), { tuKhoaChinh: "tỳ vị hư" })), ["tu_khoa_doan_dan"]);
	// Không có đoạn dẫn (mở bằng tiêu đề) → từ khoá không có trong đoạn dẫn.
	assert.deepEqual(maCanh(kiemKhuon(bai({ dan: "" }), { tuKhoaChinh: "túc tam lý" })), ["tu_khoa_doan_dan"]);
});

test("đường kẻ ngang '---' không phải bảng", () => {
	assert.deepEqual(maLoi(kiemKhuon(bai({ them: "\n---\n\nHết." }), {})), []);
});

test("Điểm chính chỉ đếm gạch đầu dòng cấp ngoài cùng", () => {
	const md = bai({ diem: 6 }).replace("- Ý chính số 6", "- Ý chính số 6\n    - ý phụ a\n    - ý phụ b");
	assert.deepEqual(maLoi(kiemKhuon(md, {})), []);
});
