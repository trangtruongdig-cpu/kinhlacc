import { test } from "node:test";
import assert from "node:assert/strict";
import { yDinh, gomCau, TOI_DA_TU_TRA_TEN } from "./y-dinh.mjs";

test("dạng hỏi rõ ràng được nhận đúng", () => {
	assert.equal(yDinh("huyệt hạ quan ở đâu"), "vi_tri");
	assert.equal(yDinh("vị trí huyệt phục thỏ"), "vi_tri");
	assert.equal(yDinh("hạ quan là gì"), "dinh_nghia");
	assert.equal(yDinh("huyệt túc tam lý có tác dụng gì"), "tac_dung");
	assert.equal(yDinh("cách bấm huyệt hợp cốc"), "cach_lam");
	assert.equal(yDinh("bấm huyệt có nguy hiểm không"), "an_toan");
});

test("gõ TÊN để tra là một ý định, không phải 'khác'", () => {
	// 70% lượt hiển thị của site này là dạng đó (đo 03/10/2026) — dồn vào "khác" thì bức tranh
	// cầu mất đúng phần lớn nhất của nó.
	assert.equal(yDinh("huyệt phục thỏ"), "tra_ten");
	assert.equal(yDinh("lãi câu"), "tra_ten");
	assert.equal(yDinh("phục thỏ huyệt"), "tra_ten");
});

test("thứ tự xét: câu vừa có 'cách' vừa có 'ở đâu' là hỏi CÁCH LÀM", () => {
	assert.equal(yDinh("cách bấm huyệt hợp cốc ở đâu"), "cach_lam");
	// Và câu dài không khớp dạng nào thì KHÔNG bị gán bừa vào tra_ten.
	assert.equal(yDinh("toi muon tim hieu them ve he thong kinh lac co the nguoi"), "khac");
	assert.ok(TOI_DA_TU_TRA_TEN >= 3);
});

test("truy vấn rỗng → khác, không ném", () => {
	assert.equal(yDinh(""), "khac");
	assert.equal(yDinh(null), "khac");
});

test("gomCau xếp dạng hỏi theo HIỂN THỊ, không theo số truy vấn", () => {
	// Một dạng có 2 truy vấn mà 300 hiển thị quan trọng hơn dạng 20 truy vấn mà 20 hiển thị.
	const c = gomCau([
		{ tuKhoa: "huyệt a ở đâu", hienThi: 300, nhap: 5 },
		...Array.from({ length: 20 }, (_, i) => ({ tuKhoa: `huyệt b${i}`, hienThi: 1, nhap: 0 })),
	]);
	assert.equal(c.yDinh[0].ma, "vi_tri");
	assert.equal(c.yDinh[0].hienThi, 300);
	assert.equal(c.yDinh[1].ma, "tra_ten");
	assert.equal(c.soTuKhoa, 21);
	assert.equal(c.hienThi, 320);
	assert.equal(c.nhap, 5);
	assert.equal(c.dauBang[0].tuKhoa, "huyệt a ở đâu");
});

test("gomCau với danh sách rỗng trả số 0, không ném", () => {
	const c = gomCau([]);
	assert.deepEqual([c.soTuKhoa, c.hienThi, c.nhap, c.yDinh.length, c.dauBang.length], [0, 0, 0, 0, 0]);
	assert.equal(gomCau(null).soTuKhoa, 0);
});
