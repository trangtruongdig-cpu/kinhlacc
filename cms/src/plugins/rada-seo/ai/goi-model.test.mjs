import { test } from "node:test";
import assert from "node:assert/strict";
import { taoGoiModel, noiDungTuThan, jsonTuChu, VIEC } from "./goi-model.mjs";

const ENV = {
	GRAVITY_API_URL: "https://gravity.test/v1",
	GRAVITY_API_KEY: "k",
	GRAVITY_MODEL_DOC_TRANG: "nhanh-1",
	GRAVITY_MODEL_MAC_DINH: "chung-1",
};
const tra = (than, { ok = true, status = 200, ct = "application/json" } = {}) => ({
	ok, status, text: async () => than, headers: new Map([["content-type", ct]]),
});

// BẪY 1: nhà cung cấp gắn text/plain cho model Claude → SDK trả về đối tượng không có
// `choices` và lời gọi trông như "mô hình không trả lời", dù đã bị tính tiền.
test("tự parse thân, KHÔNG tin content-type", () => {
	const than = JSON.stringify({ choices: [{ message: { content: " xong " } }] });
	assert.equal(noiDungTuThan(than), "xong");
	// Dạng Anthropic trần cũng đọc được.
	assert.equal(noiDungTuThan(JSON.stringify({ content: [{ text: "abc" }] })), "abc");
	assert.equal(noiDungTuThan("không phải json"), "");
	assert.equal(noiDungTuThan(""), "");
});

test("thiếu cấu hình thì NÓI RÕ thiếu biến nào, không nằm im", async () => {
	const g = taoGoiModel({ fetch: async () => tra("{}"), env: {} });
	assert.deepEqual(g.thieuCauHinh(), ["GRAVITY_API_URL", "GRAVITY_API_KEY"]);
	const r = await g.goi("doc_trang", "x", "y");
	assert.equal(r.ok, false);
	assert.match(r.loi, /GRAVITY_API_URL/);
});

test("mỗi tác vụ một model; chưa khai thì rơi về mặc định", () => {
	const g = taoGoiModel({ fetch: async () => tra("{}"), env: ENV });
	assert.equal(g.modelCua("doc_trang"), "nhanh-1");
	assert.equal(g.modelCua("viet_bai"), "chung-1");
	// Mọi tác vụ đều phải có biến riêng khai sẵn trong VIEC.
	for (const [k, v] of Object.entries(VIEC)) assert.match(v.bien, /^GRAVITY_MODEL_/, `tác vụ ${k} thiếu biến`);
});

// BẪY 3: không đếm lượt hỏng thì một sự cố bên nhà cung cấp thành vòng lặp gọi vô hạn.
test("lượt HỎNG vẫn tính vào trần", async () => {
	const g = taoGoiModel({ fetch: async () => tra("lỗi", { ok: false, status: 500 }), env: { ...ENV, GRAVITY_TRAN_LUOT: "2" } });
	assert.equal((await g.goi("doc_trang", "x", "y")).ok, false);
	assert.equal((await g.goi("doc_trang", "x", "y")).ok, false);
	assert.equal(g.soLuotDaGoi(), 2);
	const r = await g.goi("doc_trang", "x", "y");
	assert.match(r.loi, /chạm trần/);
	assert.equal(g.soLuotDaGoi(), 2, "chạm trần thì KHÔNG đếm thêm");
});

// BẪY 2: mặc định SDK là 600 s × 2 lần thử; đã đo một lượt treo 2005 giây.
test("quá hạn thì báo quá hạn, không treo", async () => {
	const g = taoGoiModel({
		fetch: (_u, o) => new Promise((_r, rej) => o.signal.addEventListener("abort", () => rej(Object.assign(new Error("abort"), { name: "AbortError" })))),
		env: ENV,
	});
	const r = await g.goi("doc_trang", "x", "y", { hanGioMs: 30 });
	assert.equal(r.ok, false);
	assert.match(r.loi, /quá hạn 30 ms/);
});

// BẪY 4: "0 kết quả" không được lẫn với "chưa đọc được".
test("thân rỗng là LỖI, không phải kết quả rỗng", async () => {
	const g = taoGoiModel({ fetch: async () => tra(JSON.stringify({ choices: [] })), env: ENV });
	const r = await g.goi("doc_trang", "x", "y");
	assert.equal(r.ok, false);
	assert.match(r.loi, /không có nội dung/);
});

test("gọi được thì trả chữ + tên model đã dùng", async () => {
	let thay = null;
	const g = taoGoiModel({
		fetch: async (u, o) => { thay = { u, body: JSON.parse(o.body) }; return tra(JSON.stringify({ choices: [{ message: { content: "ok" } }] })) },
		env: ENV,
	});
	const r = await g.goi("doc_trang", "lời dặn", "dữ liệu");
	assert.deepEqual([r.ok, r.chu, r.model], [true, "ok", "nhanh-1"]);
	assert.match(thay.u, /\/v1\/chat\/completions$/);
	// Dữ liệu người dùng phải ở vai "user", KHÔNG trộn vào lời dặn hệ thống.
	assert.equal(thay.body.messages[0].role, "system");
	assert.equal(thay.body.messages[1].content, "dữ liệu");
	assert.equal(thay.body.model, "nhanh-1");
});

test("jsonTuChu: bóc được JSON trong ```json, có lời dẫn, và trả null khi không đọc được", () => {
	assert.deepEqual(jsonTuChu('```json\n{"a":1}\n```'), { a: 1 });
	assert.deepEqual(jsonTuChu('Đây là kết quả: [{"b":2}] — hết.'), [{ b: 2 }]);
	assert.deepEqual(jsonTuChu('{"c":3}'), { c: 3 });
	assert.equal(jsonTuChu("không có json"), null, "null để người gọi phân biệt với mảng rỗng");
	assert.equal(jsonTuChu(""), null);
});
