import { test } from "node:test";
import assert from "node:assert/strict";
import { timViPham, kiemPhamVi, sachChu } from "./pham-vi-y-sy.mjs";
import { LOI_NHAC_VIET } from "../loi-dan.mjs";

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
	assert.deepEqual(ma("Bài viết không thay thế việc thăm khám và điều trị của bác sĩ có chuyên môn."), []);
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

// ---- Sửa sau rà soát 2C-3 ----

test("C1: miễn trừ CHỈ đúng cụm danh từ của câu miễn trừ — câu không dấu phẩy không còn lọt", () => {
	assert.deepEqual(maXep("Châm cứu không thay thế thuốc mà còn chữa khỏi hẳn mất ngủ"), ["chua", "hua_khoi"]);
	assert.deepEqual(ma("Nó không thay thế được thuốc nhưng chữa được mất ngủ"), ["chua"]);
	assert.deepEqual(maXep("Bài này không thay thế – mà chữa dứt điểm"), ["chua", "hua_khoi"]);
	// Danh sách chỉ gồm các danh từ cho phép; "chữa trị" không nằm trong đó.
	assert.deepEqual(maXep("Bài viết không thay thế việc thăm khám và chữa trị của bác sĩ có chuyên môn."), ["chua", "tri"]);
	// Các dạng câu miễn trừ hợp lệ vẫn sạch.
	for (const s of [
		"Nội dung không thể thay thế cho việc khám, chẩn đoán và điều trị của nhân viên y tế.",
		"Bài viết không thay thế tư vấn hoặc ý kiến của thầy thuốc.",
		"Không thay thế việc thăm khám của bác sĩ.",
	]) assert.deepEqual(ma(s), [], s);
	// Đuôi "của thầy thuốc…" có vi phạm thì KHÔNG được miễn.
	assert.deepEqual(ma("Không thay thế việc thăm khám của thầy thuốc chữa dứt điểm mất ngủ."), ["chua", "hua_khoi"]);
});

test("ký tự vô hình / gạch mềm không lách được luật", () => {
	for (const c of ["​", "‌", "‍", "⁠", "­", "﻿"]) assert.deepEqual(ma(`Châm cứu ch${c}ữa mất ngủ`), ["chua"], JSON.stringify(c));
});

test("'Phòng-khám' (gạch nối) không bị bắt oan", () => {
	assert.deepEqual(ma("Phần mềm cho Phòng-khám Đông Y."), []);
});

test("chế độ thường: thêm tận gốc / đặc trị / khỏi 100% / cam kết khỏi vào hua_khoi; giữ ngoại lệ cũ", () => {
	for (const s of ["Châm cứu giúp hết tận gốc đau lưng", "Bài thuốc đặc trị mất ngủ", "Hiệu quả khỏi 100% sau 10 buổi", "Chúng tôi cam kết khỏi bệnh"])
		assert.ok(ma(s).includes("hua_khoi"), s);
	assert.deepEqual(ma("Khách hàng dùng phần mềm để khám bệnh nhân và lưu hồ sơ"), []);
	assert.deepEqual(ma("Bác sĩ Đông y sẽ bắt mạch cho bạn."), []);
});

test("chế độ nghiêm (bài máy viết): mọi 'bác sĩ', 'khám bệnh nhân', lời hứa rộng", () => {
	const mn = (s) => timViPham(s, { nghiem: true }).map((v) => v.ma).sort();
	for (const s of ["Bác sĩ Đông y của phòng khám sẽ tư vấn", "Bác sỹ Nguyễn Văn A", "Hỏi bác si trước khi dùng"]) assert.ok(mn(s).includes("bac_si"), s);
	assert.deepEqual(mn("Chúng tôi khám bệnh nhân miễn phí."), ["kham_benh"]);
	for (const s of [
		"Cam kết khỏi 100% sau 10 buổi",
		"Hết hẳn đau lưng",
		"Người bệnh đều khỏi",
		"Chấm dứt mất ngủ vĩnh viễn",
		"Giải quyết tận gốc",
		"Bài thuốc đặc trị",
		"Châm cứu trị tận gốc",
		"Đông y chữa tận gốc",
	])
		assert.ok(mn(s).includes("hua_khoi"), s);
	// Câu miễn trừ chuẩn vẫn sạch ở chế độ nghiêm; "Phòng-khám"/"phòng khám" vẫn không bị bắt.
	const chuan =
		"Bài viết chỉ mang tính tham khảo & học tập theo lý luận Đông Y, không thay thế việc thăm khám, chẩn đoán hay điều trị của thầy thuốc có chuyên môn. Khi có vấn đề sức khoẻ, hãy đến cơ sở y tế.";
	assert.deepEqual(timViPham(chuan, { nghiem: true }), []);
	assert.deepEqual(mn("Phần mềm cho Phòng-khám và phòng khám Đông Y."), []);
	// Đuôi "của bác sĩ" ở chế độ nghiêm là vi phạm (máy không được viết "bác sĩ").
	assert.deepEqual(mn("Không thay thế việc thăm khám của bác sĩ."), ["bac_si"]);
});

test("N1: mọi ký tự định dạng (\\p{Cf}) và CGJ bị bỏ — LRM, RLO, LRI, CGJ trong 'chữa' không lách được cả hai chế độ", () => {
	for (const cp of [0x200e, 0x200f, 0x202a, 0x202e, 0x2061, 0x2066, 0x2069, 0x180e, 0x034f]) {
		const c = String.fromCodePoint(cp);
		const s = `Châm cứu ch${c}ữa mất ngủ`;
		assert.deepEqual(ma(s), ["chua"], cp.toString(16));
		assert.deepEqual(timViPham(s, { nghiem: true }).map((v) => v.ma), ["chua"], cp.toString(16));
		assert.equal(sachChu(`ch${c}ữa`), "chữa", cp.toString(16));
	}
	// Vẫn chuẩn NFC.
	assert.equal(sachChu("chu\u031b\u0303a"), "chữa");
});

const LOI_HUA_MOI = ["Cam kết hiệu quả sau 10 buổi", "Hiệu quả 100%", "Hiệu quả 90 % sau liệu trình", "Hiệu quả tức thì", "Đau lưng khỏi ngay sau một lần", "Mất ngủ hết ngay"];

test("N2: chế độ nghiêm bắt 'cam kết hiệu quả', 'hiệu quả N%', 'hiệu quả tức thì', 'khỏi ngay', 'hết ngay'; chế độ thường không đổi", () => {
	for (const s of LOI_HUA_MOI) {
		assert.ok(timViPham(s, { nghiem: true }).some((v) => v.ma === "hua_khoi"), s);
		assert.ok(!ma(s).includes("hua_khoi"), `thường: ${s}`);
	}
});

test("N2: lời dặn LOI_NHAC_VIET và luật nghiêm nói cùng một thứ — mọi cụm 'không hứa kết quả' trong lời dặn đều bị chặn", () => {
	const dong = LOI_NHAC_VIET.split("\n").find((d) => d.includes("Không hứa kết quả"));
	assert.ok(dong, "thiếu dòng 'Không hứa kết quả'");
	const cum = [...dong.matchAll(/"([^"]+)"/gu)].map((m) => m[1].replace(/\bN\b/u, "90"));
	for (const x of ["khỏi ngay", "hết ngay", "cam kết hiệu quả", "hiệu quả tức thì", "hiệu quả 90%"]) assert.ok(cum.includes(x), `lời dặn thiếu "${x}"`);
	for (const x of cum) assert.ok(timViPham(`Bài viết: ${x}.`, { nghiem: true }).some((v) => v.ma === "hua_khoi"), `luật không chặn "${x}" mà lời dặn hứa chặn`);
});
