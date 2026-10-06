import test from "node:test";
import assert from "node:assert/strict";
import { viecHeThong } from "./suc-khoe-bot.mjs";

test("bot kẹt → MỘT dòng việc, và nó nói ĐÚNG việc phải làm", () => {
	// ⚠️ Module này KHÔNG tính lại luật cảnh báo. Luật sống ở `tong-quan` (canhBaoCaDem /
	// canhBaoClaude) và đã trả giá qua nhiều ghi chú ở đó — viết bản thứ hai là hai luật lệch
	// nhau mà không ai biết. Ở đây chỉ DỊCH cờ thành dòng việc.
	const ds = viecHeThong({ canhBaoClaude: true, choAi: 104, coModel: true });
	assert.equal(ds.length, 1);
	assert.equal(ds[0].loai, "he_thong_ket");
	assert.equal(ds[0].bac, 0, "phải đứng TRÊN mọi việc nội dung: hàng đợi không chảy thì mọi thứ sau đứng theo");
	assert.match(ds[0].ten, /104/);
	assert.match(ds[0].viSao, /GRAVITY_API_KEY/);
});

test("CHƯA KHAI khoá model là chuyện KHÁC 'có khoá mà gọi hỏng'", () => {
	// Gộp hai câu là bảo người ta đi kiểm hạn mức của một khoá chưa tồn tại.
	const ds = viecHeThong({ canhBaoClaude: true, choAi: 104, coModel: false });
	assert.match(ds[0].viSao, /chưa khai/i);
	assert.equal(/hạn mức/.test(ds[0].viSao), false);
});

test("ca đêm không chạy và model không đọc được là HAI việc khác nhau", () => {
	const ds = viecHeThong({ canhBaoCaDem: true, canhBaoClaude: true, choAi: 104, coModel: true });
	assert.equal(ds.length, 2);
	assert.notEqual(ds[0].ten, ds[1].ten);
	assert.ok(ds.every((v) => v.bac === 0));
});

test("KHÔNG có cờ nào thì KHÔNG có dòng nào — im lặng khi mọi thứ chạy", () => {
	assert.deepEqual(viecHeThong({ canhBaoCaDem: false, canhBaoClaude: false, choAi: 104, coModel: true }), []);
	assert.deepEqual(viecHeThong({}), []);
	assert.deepEqual(viecHeThong(undefined), []);
});

test("mỗi dòng mang hệ quả và hành động như mọi việc khác", () => {
	const v = viecHeThong({ canhBaoCaDem: true })[0];
	assert.ok(v.heQua?.length > 15);
	assert.deepEqual(v.hanhDong, ["mo_radar"]);
	assert.ok(v.khoa, "phải có khoá duy nhất như mọi dòng việc");
});
