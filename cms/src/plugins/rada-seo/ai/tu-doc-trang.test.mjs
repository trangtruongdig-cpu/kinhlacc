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

/**
 * Hàng đợi giả GIỮ ĐÚNG cái kẹp của `layViec` thật: tối đa `capLo` trang mỗi lượt gọi, và trang
 * đã giao thì không giao lại. Cái kẹp này là thứ phép kiểm cũ thiếu — và vì thiếu nó, lỗi "ca
 * chỉ đọc 10/40 trang" lọt qua toàn bộ phép kiểm, chỉ lượt chạy thật mới lộ.
 */
const khoGia = (n, { capLo = 10, conLaiDemNay = 99 } = {}) => {
	let i = 0;
	const lo = [];
	const layViec = async ({ soTrang }) => {
		const lay = Math.max(0, Math.min(soTrang, capLo, n - i));
		const trang = Array.from({ length: lay }, (_, j) => ({ id: `u${i + j}`, url: `/p${i + j}`, chu: "chữ" }));
		i += lay;
		lo.push(lay);
		return { trang, conLaiDemNay, conTrongHangCho: n - i };
	};
	return { layViec, lo, daGiao: () => i };
};

/** Thu lại những gì ghiPhanTich NHẬN ĐƯỢC — đó là phần quan trọng nhất của khâu này. */
const ghiGia = (thu) => {
	thu.ketQua = []; thu.boQua = []; thu.soLanGoi = 0;
	return async ({ ketQua, boQua }) => {
		thu.soLanGoi++;
		thu.ketQua.push(...ketQua); thu.boQua.push(...boQua);
		return { daGhi: ketQua.length, boQua: [], soThieuChuDe: 0, soDaBoQua: boQua.length };
	};
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
	const kho = khoGia(2);
	const r = await tuDocTrang({
		s: {}, kv: {}, nghiMs: 0,
		goiModel: modelGia(() => (++n === 1
			? { ok: true, chu: '{"chuDe":"Mất ngủ","tuKhoa":["mất ngủ"],"tomTat":["a"]}' }
			: { ok: true, chu: "tôi không đọc được" })),
		layViec: kho.layViec,
		ghiPhanTich: ghiGia(thu),
	});
	assert.deepEqual([r.daDoc, r.daGhi, r.boQua], [1, 1, 1]);
	assert.equal(thu.ketQua[0].chuDe, "Mất ngủ");
	assert.match(thu.boQua[0].lyDo, /không đúng dạng JSON/);
});

// Bắt được bằng lượt chạy THẬT 02/10/2026, không phải bằng phép kiểm: `layViec` kẹp cứng 10
// trang mỗi lượt gọi, nên gọi nó một lần rồi xin 40 là ca đêm chỉ đọc 10 trang.
test("hàng đợi kẹp 10 trang/lượt thì ca VẪN đọc hết hạn mức, bằng cách lấy nhiều lô", async () => {
	const thu = {};
	const kho = khoGia(25, { capLo: 10 });
	const r = await tuDocTrang({
		s: {}, kv: {}, nghiMs: 0, soTrang: 40,
		goiModel: modelGia({ ok: true, chu: '{"chuDe":"X","tuKhoa":["y"]}' }),
		layViec: kho.layViec,
		ghiPhanTich: ghiGia(thu),
	});
	assert.deepEqual([r.daDoc, r.daGhi, r.luotGoi], [25, 25, 25], "đọc hết 25 trang, không dừng ở 10");
	assert.deepEqual(kho.lo, [10, 10, 5, 0], "lấy việc theo lô cho tới khi hàng đợi hết");
	assert.equal(r.soLo, 3);
	// Ghi NGAY từng lô: ca bị ngắt giữa đường thì phần đã đọc không mất.
	assert.equal(thu.soLanGoi, 3, "mỗi lô ghi một lần, không dồn tới cuối ca");
	// Hết hàng đợi GIỮA ca là bình thường — nói "trống" lúc đó là báo sai.
	assert.doesNotMatch(r.ghiChu.join(" "), /Hàng đợi trống/);
});

test("không vượt hạn mức trang của ca dù hàng đợi còn nhiều", async () => {
	const thu = {};
	const kho = khoGia(100, { capLo: 10 });
	const r = await tuDocTrang({
		s: {}, kv: {}, nghiMs: 0, soTrang: 40,
		goiModel: modelGia({ ok: true, chu: '{"chuDe":"X","tuKhoa":["y"]}' }),
		layViec: kho.layViec, ghiPhanTich: ghiGia(thu),
	});
	assert.deepEqual([r.daDoc, r.soLo, kho.daGiao()], [40, 4, 40]);
	assert.equal(r.conTrongHangCho, 60, "báo đúng phần còn chờ để người đọc nhật ký biết còn việc");
});

// Phân biệt lỗi CỦA MÌNH với trang không đọc được: lỗi mạng/trần thì trang phải được giao lại
// đêm sau, nên KHÔNG được đưa vào boQua (boQua là đánh dấu "đừng giao nữa").
test("lượt gọi HỎNG thì trang GIỮ trong hàng đợi, không vào boQua", async () => {
	const thu = {};
	const kho = khoGia(3);
	const r = await tuDocTrang({
		s: {}, kv: {}, nghiMs: 0,
		goiModel: modelGia({ ok: false, chu: "", loi: "HTTP 503" }),
		layViec: kho.layViec,
		ghiPhanTich: ghiGia(thu),
	});
	assert.deepEqual([r.daDoc, r.loi, r.boQua], [0, 3, 0]);
	assert.deepEqual(thu.boQua, [], "lỗi của mình KHÔNG được đánh dấu bỏ qua");
	assert.equal(thu.soLanGoi, 0, "không có gì để ghi thì không gọi khâu ghi");
	assert.match(r.ghiChu.join(" "), /GIỮ trong hàng đợi/);
});

test("chạm trần lượt gọi giữa ca thì DỪNG, nói rõ, và vẫn ghi phần đã đọc", async () => {
	const thu = {};
	let n = 0;
	const kho = khoGia(5);
	const r = await tuDocTrang({
		s: {}, kv: {}, nghiMs: 0,
		goiModel: {
			coCauHinh: () => true, thieuCauHinh: () => [], soLuotDaGoi: () => n,
			conHanMuc: () => n < 2,
			goi: async () => { n++; return { ok: true, chu: '{"chuDe":"X","tuKhoa":["y"]}' } },
		},
		layViec: kho.layViec,
		ghiPhanTich: ghiGia(thu),
	});
	assert.equal(r.luotGoi, 2, "dừng ngay khi hết hạn mức");
	assert.equal(r.daGhi, 2, "phần đã đọc vẫn được ghi, không mất");
	assert.match(r.ghiChu.join(" "), /chạm trần lượt gọi/);
});

test("chạm trần lượt gọi NGAY TỪ ĐẦU thì không lấy việc — không đốt oan lượt giao", async () => {
	const kho = khoGia(10);
	const r = await tuDocTrang({
		s: {}, kv: {}, nghiMs: 0,
		goiModel: modelGia({ ok: true, chu: "{}" }, { hanMuc: false, luot: 300 }),
		layViec: kho.layViec,
	});
	assert.deepEqual([r.daDoc, r.luotGoi, kho.daGiao()], [0, 0, 0], "layViec cộng soLanGiao, gọi nó khi không đọc nổi là làm trang mục oan");
	assert.match(r.ghiChu.join(" "), /chạm trần lượt gọi/);
});

test("hàng đợi trống thì nói 'trống', không nói lỗi", async () => {
	const r = await tuDocTrang({ s: {}, kv: {}, goiModel: modelGia({ ok: true, chu: "{}" }), layViec: async () => ({ trang: [], conLaiDemNay: 10, conTrongHangCho: 0 }) });
	assert.match(r.ghiChu.join(" "), /Hàng đợi trống/);
});

test("chạm trần trang/đêm thì nói đúng lý do đó, không nói 'trống'", async () => {
	const r = await tuDocTrang({ s: {}, kv: {}, goiModel: modelGia({ ok: true, chu: "{}" }), layViec: async () => ({ trang: [], conLaiDemNay: 0, conTrongHangCho: 7 }) });
	assert.match(r.ghiChu.join(" "), /chạm trần trang\/đêm/);
});
