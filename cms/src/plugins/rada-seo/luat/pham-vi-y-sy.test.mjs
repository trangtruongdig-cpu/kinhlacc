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
