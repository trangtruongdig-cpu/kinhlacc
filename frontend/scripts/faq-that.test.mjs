import { test } from "node:test";
import assert from "node:assert/strict";
import { yDinhCau, thanhCauHoi, tronCauHoiThat } from "./faq-that.mjs";

const MUC = { vi_tri: "Cách xương bánh chè 6 thốn.", tac_dung: "Trị chi dưới đau và liệt.", cach_lam: "Châm thẳng 1–1,5 thốn.", dinh_nghia: "Thuộc Kinh Túc Dương Minh Vị." };
const FAQ = [{ q: "Huyệt Phục Thố nằm ở đâu?", a: MUC.vi_tri }];

test("thêm đúng câu người ta gõ, ghép với MỤC NỘI DUNG ĐÃ CÓ", () => {
	const { faq, daThem } = tronCauHoiThat({
		faq: FAQ,
		cauHoiThat: [{ tuKhoa: "vị trí huyệt phục thỏ", hienThi: 15 }, { tuKhoa: "cách xác định huyệt hạ quan", hienThi: 11 }],
		mucTheoY: MUC,
	});
	assert.equal(daThem.length, 2);
	assert.equal(faq[1].q, "Vị trí huyệt phục thỏ?");
	assert.equal(faq[1].a, MUC.vi_tri, "câu trả lời phải là nội dung ĐÃ CÓ, không sinh mới");
	assert.equal(faq[2].a, MUC.cach_lam);
	assert.ok(faq.every((f) => f.a));
});

test("câu mẫu đã CHỨA NGUYÊN CỤM truy vấn thì không thêm trùng", () => {
	const { daThem } = tronCauHoiThat({ faq: FAQ, cauHoiThat: [{ tuKhoa: "phục thố nằm ở đâu", hienThi: 20 }], mucTheoY: MUC });
	assert.deepEqual(daThem, []);
});

test('gõ TÊN để tra KHÔNG thành câu hỏi — "Phục thỏ huyệt?" là câu rỗng nghĩa', () => {
	// 70% truy vấn của site này là dạng gõ tên; thêm hết vào FAQ là biến FAQ thành rác.
	const { daThem } = tronCauHoiThat({
		faq: [],
		cauHoiThat: [{ tuKhoa: "phục thỏ huyệt", hienThi: 99 }, { tuKhoa: "lãi câu", hienThi: 50 }],
		mucTheoY: MUC,
	});
	assert.deepEqual(daThem, []);
	assert.equal(yDinhCau("phục thỏ huyệt"), "tra_ten");
});

test("không có mục nội dung tương ứng thì KHÔNG thêm — tuyệt đối không bịa câu trả lời", () => {
	const { daThem } = tronCauHoiThat({ faq: [], cauHoiThat: [{ tuKhoa: "huyệt này có nguy hiểm không", hienThi: 30 }], mucTheoY: MUC });
	assert.deepEqual(daThem, [], "ý định an_toan không có mục nào trả lời → bỏ qua");
});

test("trần số câu thêm, và nhiều hiển thị được ưu tiên", () => {
	const { daThem } = tronCauHoiThat({
		faq: [],
		cauHoiThat: [
			{ tuKhoa: "vị trí huyệt a", hienThi: 1 },
			{ tuKhoa: "huyệt a có tác dụng gì không", hienThi: 99 },
		],
		mucTheoY: MUC,
		toiDa: 1,
	});
	assert.deepEqual(daThem, ["huyệt a có tác dụng gì không"]);
});

test("thanhCauHoi: viết hoa đầu câu, thêm dấu hỏi, không thêm hai lần", () => {
	assert.equal(thanhCauHoi("huyệt hạ quan ở đâu"), "Huyệt hạ quan ở đâu?");
	assert.equal(thanhCauHoi("hạ quan là gì?"), "Hạ quan là gì?");
	assert.equal(thanhCauHoi(""), "");
});

test("không có câu hỏi thật thì trả nguyên FAQ cũ — build chạy y như trước", () => {
	const { faq, daThem } = tronCauHoiThat({ faq: FAQ, cauHoiThat: [], mucTheoY: MUC });
	assert.deepEqual(faq, FAQ);
	assert.deepEqual(daThem, []);
});
