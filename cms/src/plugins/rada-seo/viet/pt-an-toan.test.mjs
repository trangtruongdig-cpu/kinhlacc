import { test } from "node:test";
import assert from "node:assert/strict";
import { markdownToPortableText } from "emdash/client";
import { timHtmlTho, kiemPtAnToan, chuTuPt, ptSangMd } from "./pt-an-toan.mjs";

// Rà soát 2C-3 C2: bộ chuyển EmDash JSON.parse NGUYÊN VĂN dòng `<!--ec:block {…} -->` vào Portable
// Text. Hai lớp chặn: dòng HTML thô bị từ chối trước khi chuyển; PT sau chuyển đi qua danh sách trắng.
const pt = (md) => markdownToPortableText(md);

test("timHtmlTho: bắt mọi dòng có '<!--' hoặc thẻ HTML ('<' + chữ cái hoặc '/'); không vu oan so sánh", () => {
	const md = [
		"Đoạn thường.",
		'<!--ec:block {"_type":"image","asset":{"url":"https://x.vn/a.png"}} -->',
		"  <!-- ghi chú -->",
		'Chữ <a href="javascript:alert(1)">bấm</a> giữa dòng.',
		"</div>",
		"Nhiệt độ a < b và 3<5 vẫn được.",
		"<https://evil.com>",
	].join("\n");
	assert.deepEqual(timHtmlTho(md).map((x) => x.dong), [2, 3, 4, 5, 7]);
	assert.deepEqual(timHtmlTho("a < b\n5 <= 6"), []);
});

test("kiemPtAnToan: PT từ markdown thường (đoạn, ##/###/####, danh sách, trích, đậm/nghiêng/mã/gạch, link nội bộ) đạt", () => {
	const p = pt("Mở **đậm** _nghiêng_ `mã` ~~gạch~~ [Thần Môn](/huyet/than-mon/).\n\n## A\n\n### B\n\n#### C\n\n- một\n1. hai\n\n> trích");
	assert.deepEqual(kiemPtAnToan(p), []);
});

test("kiemPtAnToan: khối opaque từ bộ chuyển thật (ảnh ngoài, kiểu lạ, span lạ, mark lạ, href ngoài) → lỗi tiếng Việt", () => {
	const khoi = (o) => `<!--ec:block ${JSON.stringify(o)} -->`;
	const md = [
		khoi({ _type: "image", _key: "i", asset: { url: "https://evil.com/a.png" } }),
		khoi({ _type: "block", _key: "b", style: "h1", markDefs: [], children: [{ _type: "span", _key: "s", text: "x", marks: [] }] }),
		khoi({ _type: "block", _key: "c", style: "normal", markDefs: [{ _type: "link", _key: "l", href: "javascript:alert(1)" }], children: [{ _type: "span", _key: "s2", text: "x", marks: ["l", "blink"] }] }),
		khoi({ _type: "block", _key: "d", style: "normal", markDefs: [], children: [{ _type: "hinh", _key: "s3" }], onclick: "x" }),
		"```js\nma()\n```",
	].join("\n");
	const p = pt(md);
	assert.equal(p[0]._type, "image"); // tiền đề: bộ chuyển thật đưa khối opaque vào nguyên văn
	const loi = kiemPtAnToan(p);
	const noi = loi.join("\n");
	assert.match(noi, /khối 1: kiểu "image"/);
	assert.match(noi, /khối 2: kiểu chữ "h1"/);
	assert.match(noi, /khối 3: link "javascript:alert\(1\)"/);
	assert.match(noi, /khối 3: định dạng "blink"/);
	assert.match(noi, /khối 4: trường lạ "onclick"/);
	assert.match(noi, /khối 4: phần tử con kiểu "hinh"/);
	assert.match(noi, /khối 5: kiểu "code"/);
});

test("kiemPtAnToan: rác không phải đối tượng / không phải mảng", () => {
	assert.equal(kiemPtAnToan(null).length, 1);
	assert.match(kiemPtAnToan([5, "x"]).join("\n"), /khối 1/);
	// Chỉ link đường nội bộ "/…" (không "//") được sống.
	const p = [{ _type: "block", _key: "a", style: "normal", markDefs: [{ _type: "link", _key: "l", href: "https://kinhlac.online/x/" }], children: [{ _type: "span", _key: "s", text: "x", marks: ["l"] }] }];
	assert.match(kiemPtAnToan(p).join(), /link/);
});

test("chuTuPt / ptSangMd: rút từ PT cuối — chữ escape JSON trong khối opaque cũng lộ ra", () => {
	const p = pt(`## Tiêu đề\n\nĐoạn [Thần Môn](/huyet/than-mon/) **đậm**.\n\n- mục\n1. số\n\n> trích\n<!--ec:block {"_type":"block","_key":"z","style":"normal","markDefs":[],"children":[{"_type":"span","_key":"q","text":"ch\\u1eefa d\\u1ee9t \\u0111i\\u1ec3m","marks":[]}]} -->`);
	assert.equal(chuTuPt(p), "Tiêu đề\nĐoạn Thần Môn đậm.\nmục\nsố\ntrích\nchữa dứt điểm");
	assert.equal(ptSangMd(p), "## Tiêu đề\n\nĐoạn [Thần Môn](/huyet/than-mon/) **đậm**.\n\n- mục\n1. số\n\n> trích\n\nchữa dứt điểm");
});
