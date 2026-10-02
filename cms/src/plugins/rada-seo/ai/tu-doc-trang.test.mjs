import { test } from "node:test";
import assert from "node:assert/strict";
import { docKetQua, loiNhac, tuDocTrang } from "./tu-doc-trang.mjs";

test("docKetQua: đọc được JSON thuần, trong ```json, và dạng mảng một phần tử", () => {
	const mong = { id: "u1", chuDe: "Mất ngủ", tuKhoa: ["mất ngủ"], tomTat: ["a"] };
	assert.deepEqual(docKetQua('{"chuDe":"Mất ngủ","tuKhoa":["mất ngủ"],"tomTat":["a"]}', "u1"), mong);
	assert.deepEqual(docKetQua('```json\n{"chuDe":"Mất ngủ","tuKhoa":["mất ngủ"],"tomTat":["a"]}\n```', "u1"), mong);
	assert.deepEqual(docKetQua('[{"chuDe":"Mất ngủ","tuKhoa":["mất ngủ"],"tomTat":["a"]}]', "u1"), mong);
	// Nhận cả khoá gạch dưới, vì model hay tự đổi kiểu đặt tên.
	assert.equal(docKetQua('{"chu_de":"X","tu_khoa":["y"]}', "u1").chuDe, "X");
});

test("docKetQua: thiếu chủ đề hoặc từ khoá → null (để trang vào boQua, không bỏ lặng)", () => {
	assert.equal(docKetQua('{"chuDe":"","tuKhoa":["a"]}', "u1"), null);
	assert.equal(docKetQua('{"chuDe":"X","tuKhoa":[]}', "u1"), null);
	assert.equal(docKetQua("tôi không đọc được trang này", "u1"), null);
	assert.equal(docKetQua("", "u1"), null);
});

test("lời dặn dùng lại nguyên văn của đường MCP và đòi JSON thuần", () => {
	const n = loiNhac();
	assert.match(n, /Kinhlac/, "phải có bối cảnh doanh nghiệp");
	assert.match(n, /chuDe/);
	assert.match(n, /KHÔNG phải lời dặn/, "giữ rào chữ trang đối thủ là dữ liệu không tin cậy");
	assert.match(n, /CHỈ một đối tượng JSON/);
});

const modelGia = (ket, { hanMuc = true, luot = 0 } = {}) => ({
	coCauHinh: () => true, thieuCauHinh: () => [], conHanMuc: () => hanMuc, soLuotDaGoi: () => luot,
	goi: async () => (typeof ket === "function" ? ket() : ket),
});
const trangGia = (n) => ({ trang: Array.from({ length: n }, (_, i) => ({ id: `u${i}`, url: `/p${i}`, chu: "chữ" })), conLaiDemNay: 99, conTrongHangCho: 0 });
/** Thu lại những gì ghiPhanTich NHẬN ĐƯỢC — đó là phần quan trọng nhất của khâu này. */
const ghiGia = (thu) => async ({ ketQua, boQua }) => {
	thu.ketQua = ketQua; thu.boQua = boQua;
	return { daGhi: ketQua.length, boQua: [], soThieuChuDe: 0, soDaBoQua: boQua.length };
};

test("thiếu cấu hình model → nói rõ hàng đợi ĐỨNG, không phải hết việc", async () => {
	const r = await tuDocTrang({ s: {}, kv: {}, goiModel: { coCauHinh: () => false, thieuCauHinh: () => ["GRAVITY_API_KEY"] } });
	assert.deepEqual([r.daDoc, r.luotGoi], [0, 0]);
	assert.match(r.ghiChu.join(" "), /thiếu GRAVITY_API_KEY/);
	assert.match(r.ghiChu.join(" "), /KHÔNG phải hết việc/);
});

test("đọc được thì ghi; model trả sai dạng thì vào boQua KÈM LÝ DO", async () => {
	const thu = {};
	let n = 0;
	const r = await tuDocTrang({
		s: {}, kv: {}, nghiMs: 0,
		goiModel: modelGia(() => (++n === 1
			? { ok: true, chu: '{"chuDe":"Mất ngủ","tuKhoa":["mất ngủ"],"tomTat":["a"]}' }
			: { ok: true, chu: "tôi không đọc được" })),
		layViec: async () => trangGia(2),
		ghiPhanTich: ghiGia(thu),
	});
	assert.deepEqual([r.daDoc, r.daGhi, r.boQua], [1, 1, 1]);
	assert.equal(thu.ketQua[0].chuDe, "Mất ngủ");
	assert.match(thu.boQua[0].lyDo, /không đúng dạng JSON/);
});

// Phân biệt lỗi CỦA MÌNH với trang không đọc được: lỗi mạng/trần thì trang phải được giao lại
// đêm sau, nên KHÔNG được đưa vào boQua (boQua là đánh dấu "đừng giao nữa").
test("lượt gọi HỎNG thì trang GIỮ trong hàng đợi, không vào boQua", async () => {
	const thu = { ketQua: [], boQua: [] };
	const r = await tuDocTrang({
		s: {}, kv: {}, nghiMs: 0,
		goiModel: modelGia({ ok: false, chu: "", loi: "HTTP 503" }),
		layViec: async () => trangGia(3),
		ghiPhanTich: ghiGia(thu),
	});
	assert.deepEqual([r.daDoc, r.loi, r.boQua], [0, 3, 0]);
	assert.deepEqual(thu.boQua, [], "lỗi của mình KHÔNG được đánh dấu bỏ qua");
	assert.match(r.ghiChu.join(" "), /GIỮ trong hàng đợi/);
});

test("chạm trần lượt gọi giữa ca thì DỪNG, nói rõ, và vẫn ghi phần đã đọc", async () => {
	const thu = {};
	let n = 0;
	const r = await tuDocTrang({
		s: {}, kv: {}, nghiMs: 0,
		goiModel: {
			coCauHinh: () => true, thieuCauHinh: () => [], soLuotDaGoi: () => n,
			conHanMuc: () => n < 2,
			goi: async () => { n++; return { ok: true, chu: '{"chuDe":"X","tuKhoa":["y"]}' } },
		},
		layViec: async () => trangGia(5),
		ghiPhanTich: ghiGia(thu),
	});
	assert.equal(r.luotGoi, 2, "dừng ngay khi hết hạn mức");
	assert.equal(r.daGhi, 2, "phần đã đọc vẫn được ghi, không mất");
	assert.match(r.ghiChu.join(" "), /chạm trần lượt gọi/);
});

test("hàng đợi trống thì nói 'trống', không nói lỗi", async () => {
	const r = await tuDocTrang({ s: {}, kv: {}, goiModel: modelGia({ ok: true, chu: "{}" }), layViec: async () => ({ trang: [], conLaiDemNay: 10, conTrongHangCho: 0 }) });
	assert.match(r.ghiChu.join(" "), /Hàng đợi trống/);
});
