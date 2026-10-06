import test from "node:test";
import assert from "node:assert/strict";
import { chonTrangDoiThu, TRAN_URL_MOI_PHIEN, NHAN_NGUON } from "./nguon-serp.mjs";

const trang = (url, chuDe, tuKhoa = []) => ({ url, chuDe, tuKhoa });
const kho = [
	trang("https://a.vn/dau-lung", "Đau lưng", ["đau lưng", "thoát vị"]),
	trang("https://b.vn/dau-that-lung", "Cơ xương khớp", ["đau thắt lưng"]),
	trang("https://c.vn/mat-ngu", "Mất ngủ", ["mất ngủ"]),
	trang("https://d.vn/khac", "Khác", []),
	trang("https://a.vn/dau-lung-2", "Đau lưng", ["đau lưng mạn tính"]),
];

test("chọn trang CÙNG CHỦ ĐỀ với từ khoá đang leo", () => {
	const r = chonTrangDoiThu(kho, "đau lưng");
	assert.ok(r.length > 0);
	assert.ok(r.every((x) => /dau-lung|dau-that-lung/.test(x.url)), `chọn nhầm: ${r.map((x) => x.url).join(", ")}`);
});

test('chủ đề "Khác" KHÔNG bao giờ được chọn — đó là nhãn model trả về khi nó không đọc ra chủ đề', () => {
	// Có thật trong kho (đo 06/10/2026). Nó khớp mọi thứ nếu không chặn.
	assert.equal(chonTrangDoiThu(kho, "khác").length, 0);
	assert.ok(!chonTrangDoiThu(kho, "đau lưng").some((x) => x.url.includes("khac")));
});

test("không khớp thì trả RỖNG, không trả bừa trang nào đó", () => {
	// ⚠️ Trả bừa là dựng một phiếu sơ hở từ trang chẳng liên quan — phiếu trông như phát hiện
	// thật và người đọc không có cách nào biết. Rỗng thì ca nói ra là không đủ nguyên liệu.
	assert.deepEqual(chonTrangDoiThu(kho, "ung thư gan"), []);
	assert.deepEqual(chonTrangDoiThu([], "đau lưng"), []);
	assert.deepEqual(chonTrangDoiThu(undefined, "đau lưng"), []);
	assert.deepEqual(chonTrangDoiThu(kho, ""), []);
});

test("không lấy quá trần URL mỗi phiên", () => {
	const nhieu = Array.from({ length: 30 }, (_, i) => trang(`https://x${i}.vn/dau-lung`, "Đau lưng", ["đau lưng"]));
	assert.ok(chonTrangDoiThu(nhieu, "đau lưng").length <= TRAN_URL_MOI_PHIEN);
});

test("mỗi TÊN MIỀN chỉ một trang — SERP thật không bao giờ toàn một site", () => {
	const mot = Array.from({ length: 10 }, (_, i) => trang(`https://a.vn/dau-lung-${i}`, "Đau lưng", ["đau lưng"]));
	assert.equal(chonTrangDoiThu(mot, "đau lưng").length, 1);
});

test("NHÃN NGUỒN phải nói THẲNG đây không phải SERP thật", () => {
	// ⚠️ Phần chịu lực của cả tính năng. Phiếu dựng từ kho đối thủ nói được "đối thủ có ý này mà
	// mình thiếu", KHÔNG nói được "trang đang đứng trên mình có ý này". Gọi nó là SERP là nói dối
	// người đọc về nguồn gốc của mọi kết luận sau đó.
	// Nhãn PHẢI phủ định rõ, nên nó ĐƯỢC chứa chữ "top 10" — miễn là đi kèm phủ định.
	assert.match(NHAN_NGUON.kho_doi_thu, /KHÔNG phải top 10/i);
	assert.match(NHAN_NGUON.kho_doi_thu, /đối thủ có ý này mà mình thiếu/i);
	// Và KHÔNG được khẳng định cái nó không có.
	assert.equal(/^Dựng từ top 10|là top 10 Google/i.test(NHAN_NGUON.kho_doi_thu), false);
	assert.match(NHAN_NGUON.serp_that, /tìm kiếm thật/i);
});
