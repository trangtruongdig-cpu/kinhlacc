import { test } from "node:test";
import assert from "node:assert/strict";
import { chuanHoaMd } from "./md-sang-pt.mjs";

test("nối các dòng liền nhau của cùng một đoạn văn", () => {
	assert.equal(chuanHoaMd("Huyệt Túc Tam Lý\nnằm dưới gối\nbốn thốn.\n\nĐoạn hai."), "Huyệt Túc Tam Lý nằm dưới gối bốn thốn.\n\nĐoạn hai.");
});

test("không nối vào tiêu đề, danh sách, trích dẫn", () => {
	const md = "## Vị trí\nDưới gối.\n- mục một\n- mục hai\n1. bước một\n2. bước hai\n* sao\n+ cộng\n> trích một\n> trích hai\nHết.";
	assert.equal(chuanHoaMd(md), md);
});

test("đoạn văn ngay sau tiêu đề vẫn nối các dòng của nó", () => {
	assert.equal(chuanHoaMd("## Vị trí\nDưới gối\nbốn thốn."), "## Vị trí\nDưới gối bốn thốn.");
});

test("gộp dòng tiếp nối (thụt lề, không dấu mục) vào mục danh sách", () => {
	assert.equal(chuanHoaMd("- Bồi bổ\n  khí huyết\n  cho Tỳ Vị\n- Mục hai"), "- Bồi bổ khí huyết cho Tỳ Vị\n- Mục hai");
	assert.equal(chuanHoaMd("1. Bước một\n   tiếp theo"), "1. Bước một tiếp theo");
	// Mục lồng có dấu mục thì giữ nguyên dòng.
	assert.equal(chuanHoaMd("- Cha\n  - Con"), "- Cha\n  - Con");
});

test("khối code giữ nguyên từng dòng, kể cả dòng trống", () => {
	const md = "Trước.\n\n```\ndòng một\ndòng hai\n\n\n# không phải tiêu đề\n```\n\nSau\nnữa.";
	assert.equal(chuanHoaMd(md), "Trước.\n\n```\ndòng một\ndòng hai\n\n\n# không phải tiêu đề\n```\n\nSau nữa.");
});

test("chuẩn hoá \\r\\n, bỏ khoảng trắng cuối dòng, tối đa một dòng trống", () => {
	assert.equal(chuanHoaMd("Một   \r\nhai\t\r\n\r\n\r\n\r\n## Ba  \r\n"), "Một hai\n\n## Ba");
	assert.equal(chuanHoaMd("A\n  \n \t\nB"), "A\n\nB");
});

test("bảng và đường kẻ không bị nối", () => {
	assert.equal(chuanHoaMd("Chữ\n---\n| a | b |\n|---|---|"), "Chữ\n---\n| a | b |\n|---|---|");
});

test("đầu vào rỗng/null", () => {
	assert.equal(chuanHoaMd(""), "");
	assert.equal(chuanHoaMd(null), "");
});
