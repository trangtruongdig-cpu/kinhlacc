import { test } from "node:test";
import assert from "node:assert/strict";
import { timViPham, kiemPhamVi } from "./pham-vi-y-sy.mjs";

const ma = (s) => timViPham(s).map((v) => v.ma);

test("bắt đúng các tiêu đề/từ khoá thật đã lọt ngày 30/09", () => {
	assert.deepEqual(ma("Ứng dụng châm cứu chữa bệnh hiệu quả và kỹ thuật châm cứu an toàn"), ["chua"]);
	assert.deepEqual(ma("đông y chữa thoái hóa khớp"), ["chua"]);
	assert.deepEqual(ma("trị đau khớp bằng đông y"), ["tri"]);
	assert.deepEqual(ma("thuốc nam trị ho"), ["tri"]);
});

test("không vu oan thuật ngữ YHCT và từ đồng dạng", () => {
	for (const s of [
		"Biện Chứng Luận Trị Theo Kinh Lạc: Chìa Khóa Chẩn Đoán Và Điều Trị Đông Y",
		"Khám Phá Bài Thuốc Xương Khớp Đông Y",
		"giá trị dinh dưỡng của hạt sen",
		"trị số nhiệt độ ở tỉnh huyệt",
		"pháp trị và chủ trị của bài thuốc",
		"Hồ Sơ Chẩn Trị",
		"vật lý trị liệu kết hợp châm cứu",
		"Phần mềm Đông Y: Giải pháp Số hóa Toàn diện cho Phòng khám",
		"Phần mềm giúp quản trị phòng chẩn trị hiệu quả hơn",
		"Khách hàng dùng phần mềm để khám bệnh nhân và lưu hồ sơ",
		"Kỹ thuật viên sửa chữa thiết bị đo kinh lạc định kỳ",
	]) assert.deepEqual(ma(s), [], s);
});

test("câu miễn trừ nói về người khác được bỏ qua", () => {
	assert.deepEqual(ma("Bài viết không thay thế việc thăm khám và chữa trị của bác sĩ có chuyên môn."), []);
});

test("bắt khám bệnh, hứa khỏi, bác sĩ-của-mình", () => {
	assert.deepEqual(ma("Hãy đến khám bệnh sớm."), ["kham_benh"]);
	assert.deepEqual(ma("Giúp khỏi hẳn đau lưng."), ["hua_khoi"]);
	assert.deepEqual(ma("Đội ngũ bác sĩ giàu kinh nghiệm."), ["bac_si_minh"]);
});

test("kiemPhamVi: chặn khi lỗi ở tiêu đề, chỉ cờ khi lỗi ở thân", () => {
	assert.equal(kiemPhamVi({ tieuDe: "Châm cứu chữa bệnh", noiDung: "" }).chan, true);
	const r = kiemPhamVi({ tieuDe: "Châm cứu là gì", noiDung: "Châm cứu giúp chữa mất ngủ." });
	assert.equal(r.chan, false);
	assert.equal(r.viPhamThan.length, 1);
});

test("câu miễn trừ chỉ gỡ ĐÚNG mệnh đề miễn trừ; phần còn lại của câu vẫn bị soát", () => {
	const r = ma("Châm cứu chữa khỏi hẳn mất ngủ, nhưng bạn nên tham khảo ý kiến thầy thuốc.");
	assert.ok(r.includes("chua") && r.includes("hua_khoi"), r.join(","));
	assert.deepEqual(ma("Bạn nên tham khảo ý kiến thầy thuốc, vì bấm huyệt trị dứt điểm mất ngủ."), ["tri", "hua_khoi"]);
});

test("chữ dựng sẵn dạng NFD vẫn bị bắt", () => {
	const nfd = "Châm cứu chữa bệnh hiệu quả".normalize("NFD");
	assert.notEqual(nfd, "Châm cứu chữa bệnh hiệu quả");
	assert.deepEqual(ma(nfd), ["chua"]);
});

test("không vu oan 'trị' trong chính trị, cấp/hoãn trị, trị giá", () => {
	for (const s of ["Bàn chuyện chính trị", "cấp trị tiêu, hoãn trị bản", "Trị giá 5 triệu đồng"]) assert.deepEqual(ma(s), [], s);
});

// Lỗ "thăm khám" (đo 30/09/2026): MIEN_TRU cũ gỡ mọi thứ từ "thăm khám"/"tham khảo ý kiến" tới
// dấu câu kế tiếp, nên ba câu dưới đây từng ra [] trọn vẹn.
const maXep = (s) => ma(s).sort();

test("thăm khám / tham khảo ý kiến KHÔNG còn là dấu hiệu miễn trừ", () => {
	assert.deepEqual(maXep("Chúng tôi thăm khám và chữa mất ngủ bằng châm cứu."), ["chua", "kham_benh"]);
	const r = timViPham("Y sỹ sẽ thăm khám cho bạn.");
	assert.deepEqual(r.map((v) => v.ma), ["kham_benh"]);
	assert.equal(r[0].tu, "thăm khám");
	assert.equal(r[0].goiY, "đo kinh lạc / tư vấn");
	assert.deepEqual(maXep("Tham khảo ý kiến thầy thuốc rồi châm cứu trị dứt điểm"), ["hua_khoi", "tri"]);
});

test("kham_benh: 'khám' đứng làm động từ", () => {
	for (const s of [
		"Hãy đi khám sớm.",
		"Bạn sẽ được khám miễn phí.",
		"Y sỹ khám cho người bệnh.",
		"Chúng tôi khám và tư vấn.",
		"Dịch vụ khám chữa bằng Đông Y.",
		"Hãy đến khám bệnh sớm.",
		"Lịch thăm khám mở cả tuần.",
	]) assert.deepEqual(ma(s), s.includes("chữa") ? ["chua", "kham_benh"] : ["kham_benh"], s);
});

test("kham_benh: không bắt phòng khám, khám phá, khám nghiệm, khám bệnh nhân", () => {
	for (const s of [
		"Phần mềm cho phòng khám Đông Y.",
		"Khám phá huyệt Túc Tam Lý.",
		"Báo cáo khám nghiệm hiện trường.",
		"Khách hàng dùng phần mềm để khám bệnh nhân và lưu hồ sơ",
		"Phòng  khám mở cửa lúc 8 giờ.",
	]) assert.deepEqual(ma(s), [], s);
});

test("miễn trừ CHỈ mệnh đề 'không (thể) thay thế' tới dấu câu kế tiếp", () => {
	assert.deepEqual(ma("Châm cứu không thể thay thế việc thăm khám của thầy thuốc."), []);
	// Phần sau dấu phẩy không còn nằm trong mệnh đề miễn trừ.
	assert.deepEqual(ma("Bài này không thay thế thầy thuốc, nhưng châm cứu chữa được mất ngủ."), ["chua"]);
});

test("câu miễn trừ chuẩn của trang (KhungSeoBaiViet.astro) ra sạch", () => {
	const s =
		"Bài viết chỉ mang tính tham khảo & học tập theo lý luận Đông Y, không thay thế việc thăm khám, chẩn đoán hay điều trị của thầy thuốc có chuyên môn. Khi có vấn đề sức khoẻ, hãy đến cơ sở y tế.";
	assert.deepEqual(timViPham(s), []);
	assert.deepEqual(timViPham(s.normalize("NFD")), []);
});
