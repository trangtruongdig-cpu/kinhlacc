import { test } from "node:test";
import assert from "node:assert/strict";
import { docCauHoi, xetTruyVan, phieuSuaNho, xepPhieu, VIEC } from "./so-ho-ai.mjs";

const TRANG = `<html><head>
<script type="application/ld+json">{"@type":"FAQPage","mainEntity":[
 {"@type":"Question","name":"Huyệt Phục Thố nằm ở đâu?","acceptedAnswer":{"@type":"Answer","text":"Cách xương bánh chè 6 thốn."}}]}</script>
</head><body><h1>Huyệt Phục Thố (ST32)</h1><h2>Vị Trí</h2>
<p>Ở điểm cách góc trên phía ngoài xương bánh chè 6 thốn.</p>
<h2>Chủ Trị</h2><p>Trị chi dưới đau và liệt.</p></body></html>`;

test("đọc được câu hỏi FAQ trong JSON-LD và tiêu đề mục", () => {
	const { faq, tieuDe } = docCauHoi(TRANG);
	assert.deepEqual(faq, ["Huyệt Phục Thố nằm ở đâu?"]);
	assert.ok(tieuDe.includes("Vị Trí"));
});

test("JSON-LD hỏng thì bỏ qua khối đó, KHÔNG gãy cả phép đo", () => {
	const { faq } = docCauHoi(`<script type="application/ld+json">{ hỏng }</script><h2>Vị Trí</h2>`);
	assert.deepEqual(faq, []);
	assert.deepEqual(docCauHoi(null), { faq: [], tieuDe: [] });
});

test("truy vấn khớp nguyên cụm trong FAQ → không phải làm gì", () => {
	const p = phieuSuaNho({ trang: "/x/", html: TRANG, truyVan: [{ tuKhoa: "huyệt phục thố nằm ở đâu", hienThi: 10 }] });
	assert.equal(p.dong.length, 0);
	assert.equal(p.hienThiChoSua, 0);
});

test('CÙNG Ý nhưng KHÁC CHỮ thì vẫn là việc — đây là lý do phiếu này tồn tại', () => {
	// Đo thật trên /huyet/phuc-tho/: FAQ có "Huyệt Phục Thố NẰM ở đâu?" còn người ta gõ "huyệt
	// phục thỏ ở đâu". Nội dung có, chữ không khớp, nên máy không nhặt ra.
	const p = phieuSuaNho({
		trang: "/x/",
		html: TRANG,
		truyVan: [{ tuKhoa: "huyệt phục thỏ ở đâu", hienThi: 22 }, { tuKhoa: "vị trí huyệt phục thố", hienThi: 15 }],
	});
	assert.equal(p.dong.length, 2);
	assert.ok(p.dong.every((d) => d.viec !== "thieu_noi_dung"), "nội dung đã có thì KHÔNG được xếp là việc viết");
	assert.equal(p.hienThiChoSua, 37);
});

test("thân bài có nguyên cụm mà FAQ/tiêu đề chưa có → chỉ cần THÊM DÒNG FAQ (việc rẻ nhất)", () => {
	const p = phieuSuaNho({ trang: "/x/", html: TRANG, truyVan: [{ tuKhoa: "xương bánh chè 6 thốn", hienThi: 5 }] });
	assert.equal(p.dong[0].viec, "them_faq");
	assert.equal(VIEC.them_faq.gia, 1);
});

test("trang KHÔNG trả lời câu đó mới là việc viết thật", () => {
	const p = phieuSuaNho({ trang: "/x/", html: TRANG, truyVan: [{ tuKhoa: "huyệt này chữa mất ngủ không", hienThi: 9 }] });
	assert.equal(p.dong[0].viec, "thieu_noi_dung");
});

test("xếp RẺ TRƯỚC, cùng giá thì nhiều hiển thị trước", () => {
	// Phiếu nói "viết lại bài" thì người ta để đó; phiếu nói "thêm một dòng FAQ" thì làm ngay.
	const p = phieuSuaNho({
		trang: "/x/",
		html: TRANG,
		truyVan: [
			{ tuKhoa: "huyệt này chữa mất ngủ không", hienThi: 99 },
			{ tuKhoa: "xương bánh chè 6 thốn", hienThi: 1 },
			{ tuKhoa: "trị chi dưới đau và liệt", hienThi: 50 },
		],
	});
	assert.deepEqual(p.dong.map((d) => d.viec), ["them_faq", "them_faq", "thieu_noi_dung"]);
	assert.equal(p.dong[0].hienThi, 50, "cùng giá thì nhiều hiển thị đứng trước");
});

test("xepPhieu bỏ trang không còn việc, xếp theo lượt hiển thị đang chờ sửa", () => {
	const a = { trang: "/a/", hienThiChoSua: 5, dong: [{}] };
	const b = { trang: "/b/", hienThiChoSua: 50, dong: [{}] };
	const c = { trang: "/c/", hienThiChoSua: 0, dong: [] };
	assert.deepEqual(xepPhieu([a, b, c]).map((x) => x.trang), ["/b/", "/a/"]);
});
