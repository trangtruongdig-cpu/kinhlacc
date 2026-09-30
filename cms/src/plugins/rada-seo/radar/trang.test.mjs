import { test } from "node:test";
import assert from "node:assert/strict";
import { htmlSangChu } from "./trang.mjs";

// Trang THÙ ĐỊCH (hoặc chỉ hỏng): thẻ mở không đóng lặp hàng chục nghìn lần. Biểu thức kiểu
// `<[^>]+>` hay `<(script)[\s\S]*?<\/\1>` quét tới cuối chuỗi từ MỖI thẻ mở → bậc hai, treo ca radar.
const doGio = (f) => {
	const t0 = performance.now();
	const r = f();
	return { r, ms: performance.now() - t0 };
};
const THU = {
	"50k <a href=\"x không đóng": '<a href="x'.repeat(50_000),
	"20k <p> không </p>": "<p>chữ ".repeat(20_000),
	"20k <script không đóng": "<script>x".repeat(20_000),
	"20k <!-- không đóng": "<!-- x".repeat(20_000),
	"20k <title không đóng": "<title>x".repeat(20_000),
	"20k <meta name=description không đóng": '<meta name="description" content="x'.repeat(20_000),
};

for (const [ten, html] of Object.entries(THU))
	test(`htmlSangChu tuyến tính: ${ten} < 500 ms`, () => {
		const { ms } = doGio(() => htmlSangChu(html));
		assert.ok(ms < 500, `${ms.toFixed(0)} ms`);
	});

test("HTML bình thường: kết quả như cũ", () => {
	const html = `<html><head><title>Huyệt &amp; kinh</title>
<meta name="description" content="Mô tả ngắn"></head><body>
<script>var a = "<b>rác</b>";</script><style>.x{}</style><!-- chú thích --><svg><text>vẽ</text></svg>
<noscript>bật JS</noscript><p>Đoạn <b>một</b>.</p><ul><li>hai</li></ul></body></html>`;
	assert.deepEqual(htmlSangChu(html), { tieuDe: "Huyệt & kinh", moTa: "Mô tả ngắn", than: "Huyệt & kinh Đoạn một . hai" });
	// og:description làm đường lùi; thứ tự content trước name vẫn đọc được.
	assert.equal(htmlSangChu(`<meta property="og:description" content="OG">`).moTa, "OG");
	assert.equal(htmlSangChu(`<meta content="Ngược" name="description">`).moTa, "Ngược");
	// Thẻ script không đóng: giữ hành vi cũ — không nuốt phần còn lại của trang.
	assert.equal(htmlSangChu("<p>a</p><script>b").than, "a b");
});

test("thực thể số ngoài bảng mã không làm ném lỗi", () => {
	assert.equal(htmlSangChu("<p>a &#99999999; &#65;</p>").than, "a &#99999999; A");
});

// ---- M1: chữ thường GIỮ ĐỘ DÀI ("İ" thành 2 đơn vị mã khi toLowerCase) ----
test("'İ' đứng trước <script>: vị trí không trôi, không mất chữ phía sau", async () => {
	const { boKhoi, thuongGiuDo } = await import("./trang.mjs");
	const html = `${"İ".repeat(20)}<script>BAD</script>ok`;
	assert.equal(thuongGiuDo(html).length, html.length);
	assert.equal(boKhoi(html, ["script"]), `${"İ".repeat(20)} ok`);
	const r = htmlSangChu(`${"İ".repeat(20)}<title>Tiêu đề</title><script>BAD</script><p>ok</p>`);
	assert.equal(r.tieuDe, "Tiêu đề");
	assert.match(r.than, /ok$/);
	assert.doesNotMatch(r.than, /BAD/);
});
