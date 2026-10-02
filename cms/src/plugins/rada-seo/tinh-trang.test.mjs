import { test } from "node:test";
import assert from "node:assert/strict";
import { tinhTrangTuDong } from "./tinh-trang.mjs";

const goc = { caDemBat: true, lichBat: true, soDoiThu: 2, dangChay: false, caRadar: null, choAi: 0, daTungDoc: false, lucClaudeDoc: null };
const chu = (ds) => ds.map((x) => x.chu).join("\n");

test("tinhTrangTuDong: lịch đêm đã bật → báo tự chạy 02:30; chưa bật trên máy chủ → thiếu, chỉ nút Bật lịch", () => {
	let ds = tinhTrangTuDong(goc);
	assert.equal(ds[0].muc, "ok");
	assert.match(ds[0].chu, /02:30/);
	ds = tinhTrangTuDong({ ...goc, lichBat: false });
	assert.equal(ds[0].muc, "thieu");
	assert.match(ds[0].chu, /Bật lịch/);
	// Máy lập trình: không phải lỗi, chỉ nói rõ ca đêm chạy ở máy chủ.
	ds = tinhTrangTuDong({ ...goc, caDemBat: false, lichBat: false });
	assert.equal(ds[0].muc, "cho");
	assert.match(ds[0].chu, /máy chủ/);
});

test("tinhTrangTuDong: chưa có đối thủ → thiếu; đang chạy / chưa có ca / ca gần nhất", () => {
	assert.ok(tinhTrangTuDong({ ...goc, soDoiThu: 0 }).some((x) => x.muc === "thieu" && /Chưa có đối thủ/.test(x.chu)));
	assert.ok(tinhTrangTuDong({ ...goc, dangChay: true }).some((x) => /đang chạy/.test(x.chu)));
	assert.ok(tinhTrangTuDong(goc).some((x) => /Chưa có ca radar/.test(x.chu)));
	const ds = tinhTrangTuDong({ ...goc, caRadar: { ketThuc: "2026-09-30T19:40:00.000Z", soTrich: 12, loi: [] } });
	const d = ds.find((x) => x.luc === "2026-09-30T19:40:00.000Z");
	assert.ok(d && /\{luc\}/.test(d.chu) && /12 trang/.test(d.chu) && d.muc === "ok");
	// Ca có lỗi vẫn hoàn tất → báo "cho" để người dùng xem nhật ký, không đỏ.
	assert.equal(tinhTrangTuDong({ ...goc, caRadar: { ketThuc: "x", soTrich: 0, loi: ["a"] } }).find((x) => x.luc === "x").muc, "cho");
});

test("tinhTrangTuDong: Claude chưa từng đọc → câu chỉ đường routine; đã đọc → ok; có trang chờ thì báo số", () => {
	let t = chu(tinhTrangTuDong(goc));
	assert.match(t, /đọc bài chưa chạy/);
	assert.match(t, /Rada SEO/);
	t = chu(tinhTrangTuDong({ ...goc, choAi: 7 }));
	assert.match(t, /7 trang .*đang chờ .*đọc/);
	const ds = tinhTrangTuDong({ ...goc, daTungDoc: true, lucClaudeDoc: "L" });
	assert.doesNotMatch(chu(ds), /cần tạo routine/);
	assert.ok(ds.some((x) => x.muc === "ok" && x.luc === "L" && /Gravity|Claude/.test(x.chu)));
	// Đã đọc nhưng ngoài cửa sổ nhật ký: vẫn ok, không kèm giờ.
	assert.ok(tinhTrangTuDong({ ...goc, daTungDoc: true }).some((x) => x.muc === "ok" && /Gravity|Claude/.test(x.chu) && !x.luc));
});

test("tinhTrangTuDong: có bài can_xem → dòng 'thiếu' nêu số bài và chỉ sang tab Kế hoạch; 0 thì không có dòng", () => {
	const ds = tinhTrangTuDong({ ...goc, soCanXem: 2 });
	const d = ds.find((x) => /2 bài máy viết chưa đạt — cần bạn xem lại/.test(x.chu));
	assert.ok(d, chu(ds));
	assert.equal(d.muc, "thieu");
	assert.match(d.chu, /Kế hoạch/);
	assert.doesNotMatch(chu(tinhTrangTuDong({ ...goc, soCanXem: 0 })), /cần bạn xem lại/);
	assert.doesNotMatch(chu(tinhTrangTuDong(goc)), /cần bạn xem lại/);
});
