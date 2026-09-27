/**
 * node --test src/lib/loi-tieng-viet.test.ts
 *
 * Câu gốc trong các phép kiểm dưới đây là câu THẬT, chép từ `emdash/dist` và từ ảnh
 * chụp màn hình của người dùng ngày 26/09/2026 — không phải câu tôi bịa ra cho khớp
 * regex. Nếu EmDash đổi lời, phép kiểm này phải đỏ chứ không được im.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { boHopLe, dichLoiEmDash } from "./loi-tieng-viet.ts";

test("mốc thời gian sai dạng: dịch và nói rõ KHÔNG phải trùng link", () => {
	// Chép từ ảnh người dùng gửi — chính mục "Kim Quỹ Yếu Lược" của bộ Nguồn Y Văn.
	const goc = 'Datetime "2026-09-25 14:18:14.08303+00" is not a valid ISO 8601 datetime';
	const r = dichLoiEmDash(goc);
	assert.ok(r, "phải nhận ra câu này");
	assert.equal(r.loai, "moc-thoi-gian");
	assert.match(r.cau, /KHÔNG phải lỗi trùng đường dẫn/);
	assert.match(r.cau, /va-moc-thoi-gian\.mjs/);
	// Giá trị gốc phải còn trong câu: mất nó là mất manh mối để lần ra mục nào.
	assert.match(r.cau, /2026-09-25 14:18:14\.08303\+00/);
});

test("trùng slug: chỉ đích danh mục đang giữ, khi tra được", () => {
	// api-BB5BoQbN.mjs, nhánh handleContentUpdate.
	const goc = "Slug 'kim-quy-yeau-luoc' already exists in collection 'nguon_y_van'";
	const r = dichLoiEmDash(goc, { id: "01M3", title: "Kim Quỹ Yếu Lược" });
	assert.ok(r, "phải nhận ra câu này");
	assert.equal(r.loai, "trung-slug");
	assert.equal(r.slug, "kim-quy-yeau-luoc");
	assert.match(r.cau, /Kim Quỹ Yếu Lược/);
});

test("trùng slug: tra không ra chủ thì vẫn đứng vững", () => {
	const r = dichLoiEmDash("Slug 'abc' already exists in collection 'huyet_vi'", null);
	assert.ok(r, "phải nhận ra câu này");
	assert.equal(r.loai, "trung-slug");
	assert.match(r.cau, /"abc"/);
	assert.doesNotMatch(r.cau, /undefined|null/);
});

test("trùng slug: bộ không có cột title thì lùi về id", () => {
	const r = dichLoiEmDash("Slug 'abc' already exists", { id: "01ABC", title: null });
	assert.ok(r, "phải nhận ra câu này");
	assert.match(r.cau, /01ABC/);
});

test("slug dàn sẵn trong bản nháp — câu gốc KHÔNG chứa slug", () => {
	// Nhánh handleContentPublish: slug đổi trong bản nháp, chỉ va nhau lúc đăng.
	const r = dichLoiEmDash("The staged slug is already used by another entry in collection 'bai_thuoc'");
	assert.ok(r, "phải nhận ra câu này");
	assert.equal(r.loai, "trung-slug");
	assert.match(r.cau, /đã có mục khác/);
	assert.doesNotMatch(r.cau, /""/); // không được để lại cặp ngoặc rỗng
});

test("câu lạ thì trả null — không nhận bừa", () => {
	assert.equal(dichLoiEmDash("Failed to publish content"), null);
	assert.equal(dichLoiEmDash(""), null);
});

test("tên bộ phải chặn được thứ ghép vào tên bảng", () => {
	assert.equal(boHopLe("nguon_y_van"), true);
	assert.equal(boHopLe('bai_thuoc"; DROP TABLE users--'), false);
	assert.equal(boHopLe("ec_x; select 1"), false);
	assert.equal(boHopLe(""), false);
});
