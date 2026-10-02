import { test } from "node:test";
import assert from "node:assert/strict";
import { doTrang } from "./do-trang.mjs";

const TU_KHOA = "huyệt thần môn";

// Trang A: trả lời ngay đoạn đầu, có bảng, FAQ (JSON-LD), tác giả, nguồn ngoài.
const HTML_A = `<!doctype html><html><head>
<title>Huyệt Thần Môn: vị trí và cách bấm</title>
<meta content="Thần Môn nằm ở nếp gấp cổ tay." name="description">
<meta name="author" content="Lương y A">
<meta property="article:modified_time" content="2026-08-01T10:00:00+07:00">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[
 {"@type":"Article","headline":"x","dateModified":"2026-07-01","author":{"@type":"Person","name":"A"}},
 {"@type":["FAQPage"],"mainEntity":[]}]}</script>
<style>.a{color:red}</style>
</head><body>
<header><nav><a href="https://menu.example/">Trang chủ menu rất nhiều chữ</a></nav></header>
<main><article>
<h1>Huyệt Thần Môn</h1>
<p>Huyệt Thần Môn nằm ở nếp gấp cổ tay, phía xương đậu.</p>
<h2>Vị trí</h2><h3>Cách xác định</h3>
<table><tr><td>Kinh</td><td>Tâm</td></tr></table>
<ul><li>Ngồi thẳng</li></ul><ol><li>Bấm nhẹ</li></ol>
<img src="/a.png" alt="a"><img src="/b.png" alt="b">
<p>Tham khảo <a href="https://pubmed.ncbi.nlm.nih.gov/1">PubMed</a>, <a href="https://who.int/x">WHO</a>,
<a href="https://www.hs.vn/khac">trang mình</a>, <a href="/huyet/noi-bo/">nội bộ</a>, <a href="https://who.int/x">WHO lặp</a>.</p>
<script>var x = "huyệt thần môn rác";</script>
</article></main>
<aside>Bài liên quan: huyệt thần môn ở aside</aside>
<footer>Chân trang <a href="https://fb.com/x">fb</a></footer>
</body></html>`;

// Trang B: trả lời muộn, không nguồn, không tác giả, ngày chỉ có ở <time>.
const LOI_DAN = Array.from({ length: 40 }, (_, i) => `chữ${i}`).join(" ");
const HTML_B = `<html><head><title>Bài B</title></head><body>
<h1>Mọi điều về giấc ngủ</h1>
<p>${LOI_DAN}</p>
<p>${LOI_DAN}</p>
<time datetime="2023-01-05">5/1/2023</time>
<h2>Câu hỏi thường gặp</h2>
<p>Thần Môn là huyệt gì? Huyệt Thần Môn thuộc kinh Tâm.</p>
<a href="https://b.vn/khac">nội bộ tuyệt đối</a>
</body></html>`;

test("trang A: trả lời sớm, bảng, FAQ, tác giả, nguồn ngoài", () => {
	const d = doTrang(HTML_A, { tuKhoa: TU_KHOA, url: "https://hs.vn/huyet-than-mon" });
	assert.equal(d.tieuDe, "Huyệt Thần Môn: vị trí và cách bấm");
	assert.equal(d.moTa, "Thần Môn nằm ở nếp gấp cổ tay.");
	// Chỉ có "Huyệt Thần Môn" (tiêu đề h1, 3 chữ) đứng trước đoạn trả lời.
	assert.equal(d.viTriTraLoi, 3);
	assert.equal(d.soH2, 1);
	assert.equal(d.soH3, 1);
	assert.equal(d.coBang, true);
	assert.equal(d.soDanhSach, 2);
	assert.equal(d.soHinh, 2);
	assert.equal(d.coFaq, true);
	assert.deepEqual([...d.loaiJsonLd].sort(), ["Article", "FAQPage", "Person"]);
	// article:modified_time thắng JSON-LD dateModified.
	assert.equal(d.ngayCapNhat, "2026-08-01T10:00:00+07:00");
	assert.equal(d.coTacGia, true);
	// pubmed + who.int (lặp tính một); www.hs.vn cùng miền; /huyet/ nội bộ; nav/footer không tính.
	assert.equal(d.soNguonNgoai, 2);
	assert.doesNotMatch(d.chu, /menu|aside|Chân trang|rác|color/);
	assert.doesNotMatch(d.chu, /\s{2}/);
	assert.equal(d.soChu, d.chu.split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length);
	// Dấu câu không thành "chữ" lẻ khi bóc thẻ.
	assert.match(d.chu, /PubMed, WHO/);
});

test("trang B: trả lời muộn, không nguồn, không tác giả, ngày từ <time>, FAQ theo tiêu đề", () => {
	const d = doTrang(HTML_B, { tuKhoa: TU_KHOA, url: "https://b.vn/bai" });
	// h1 5 chữ + 2 × 40 chữ + <time> 1 chữ + h2 4 chữ = 90 chữ đứng trước.
	assert.equal(d.viTriTraLoi, 90);
	assert.equal(d.coBang, false);
	assert.equal(d.soNguonNgoai, 0);
	assert.equal(d.coTacGia, false);
	assert.equal(d.ngayCapNhat, "2023-01-05");
	assert.equal(d.coFaq, true);
	assert.deepEqual(d.loaiJsonLd, []);
	assert.equal(d.moTa, "");
});

test("ngày: không có meta thì lấy JSON-LD dateModified; tác giả qua chữ 'Tham vấn'", () => {
	const html = `<head><script type="application/ld+json">{"@type":"WebPage","dateModified":"2025-03-02"}</script></head>
<body><p>Tham vấn chuyên môn: Y sỹ B</p><time datetime="2020-01-01">x</time></body>`;
	const d = doTrang(html, { tuKhoa: TU_KHOA, url: "https://c.vn/" });
	assert.equal(d.ngayCapNhat, "2025-03-02");
	assert.equal(d.coTacGia, true);
	assert.equal(d.viTriTraLoi, null);
});

test("trang rỗng / JSON-LD hỏng không ném lỗi", () => {
	for (const html of ["", null, `<script type="application/ld+json">{hỏng</script>`]) {
		const d = doTrang(html, { tuKhoa: TU_KHOA, url: "https://d.vn/" });
		assert.equal(d.tieuDe, "");
		assert.equal(d.soChu, 0);
		assert.equal(d.chu, "");
		assert.equal(d.viTriTraLoi, null);
		assert.equal(d.soH2, 0);
		assert.equal(d.coBang, false);
		assert.equal(d.soDanhSach, 0);
		assert.equal(d.soHinh, 0);
		assert.equal(d.coFaq, false);
		assert.deepEqual(d.loaiJsonLd, []);
		assert.equal(d.ngayCapNhat, null);
		assert.equal(d.coTacGia, false);
		assert.equal(d.soNguonNgoai, 0);
	}
});

test("so từ khoá bỏ dấu, cần ≥ 60% từ: 'than mon' trong đoạn đủ 2/3 từ", () => {
	const html = `<body><h2>Mở đầu</h2><li>than mon o co tay</li></body>`;
	assert.equal(doTrang(html, { tuKhoa: TU_KHOA, url: "https://e.vn/" }).viTriTraLoi, 2);
	const html2 = `<body><p>chỉ có chữ môn</p></body>`;
	assert.equal(doTrang(html2, { tuKhoa: TU_KHOA, url: "https://e.vn/" }).viTriTraLoi, null);
});

// ---- Chống trang thù địch (fix round 1) ----
const doGio = (f) => {
	const t0 = performance.now();
	const r = f();
	return { r, ms: performance.now() - t0 };
};
const THU_DICH = {
	"50k <a href=\"x không đóng": `<body><article>${'<a href="x'.repeat(50_000)}`,
	"20k <p> không </p>": `<body><p>${"huyệt thần môn chữ <p>".repeat(20_000)}`,
	"20k <p> thiếu từ khoá không </p>": `<body>${"<p>chữ ".repeat(20_000)}`,
	"20k <h2> không đóng": `<body>${"<h2>x ".repeat(20_000)}`,
	"20k <li> + <time + <meta không đóng": `<html><head>${'<meta name="author" content="x'.repeat(20_000)}</head><body>${"<li>x <time datetime=".repeat(20_000)}`,
	"20k <script ld+json không đóng": `<body>${'<script type="application/ld+json">{"a":'.repeat(20_000)}`,
	"20k <body không đóng": "<body x".repeat(20_000),
	"20k <nav/<header không đóng": `<body>${"<nav><header>x".repeat(20_000)}`,
};
/**
 * Nhanh NHẤT trong 3 lượt. Chốt này canh BÙNG NỔ QUAY LUI của biểu thức, nhưng đo bằng đồng hồ
 * treo tường — và tải máy chỉ làm chậm thêm, không bao giờ làm nhanh hơn, nên `min` là số gần
 * sự thật nhất. Bùng nổ thì CẢ BA lượt đều chậm, chốt vẫn bắt.
 *
 * ⚠️ Đừng quay về đo một lượt: đo thật 02/10/2026 cùng một phép, cùng một máy — 94 ms khi chạy
 * riêng, 631 ms khi chạy cùng ca radar. Ngưỡng 500 ms hoá ra đỏ vì máy có việc khác, và một
 * chốt hay vu oan thì người ta thôi đọc màu đỏ.
 */
const doGioNhanhNhat = (f, lan = 3) => {
	let min = Infinity;
	for (let i = 0; i < lan; i++) min = Math.min(min, doGio(f).ms);
	return min;
};
for (const [ten, html] of Object.entries(THU_DICH))
	test(`doTrang tuyến tính: ${ten} < 500 ms`, () => {
		const ms = doGioNhanhNhat(() => doTrang(html, { tuKhoa: TU_KHOA, url: "https://x.vn/" }));
		assert.ok(ms < 500, `${ms.toFixed(0)} ms (nhanh nhất trong 3 lượt)`);
	});

test("JSON-LD lồng 20.000 tầng: không ném, không tràn ngăn xếp, vẫn đọc khối khác", () => {
	// {"a":{"a":…}} 20.000 tầng ≈ 120 KB — dưới trần 200 KB nên thật sự được JSON.parse + duyệt.
	const sau = '{"@type":"T","a":'.repeat(1) + '{"a":'.repeat(20_000) + "1" + "}".repeat(20_001);
	assert.ok(sau.length < 200_000);
	const html = `<script type="application/ld+json">${sau}</script>
<script type="application/ld+json">{"@type":"Article","dateModified":"2026-01-02"}</script><body><p>x</p></body>`;
	const { r, ms } = doGio(() => doTrang(html, { tuKhoa: TU_KHOA, url: "https://x.vn/" }));
	assert.ok(ms < 500, `${ms.toFixed(0)} ms`);
	assert.ok(r.loaiJsonLd.includes("T"), "khối sâu vẫn được đọc phần nông");
	assert.ok(r.loaiJsonLd.includes("Article"));
	assert.equal(r.ngayCapNhat, "2026-01-02");
});

test("JSON-LD: khối > 200 KB bị bỏ; mảng rất rộng dừng ở 5.000 nút; bọc CDATA vẫn đọc được", () => {
	const to = `{"@type":"Recipe","x":"${"a".repeat(210_000)}"}`;
	const rong = `[${Array.from({ length: 10_000 }, () => '{"@type":"Rong"}').join(",")},{"@type":"Cuoi"}]`;
	const html = `<script type="application/ld+json">${to}</script>
<script type="application/ld+json">${rong}</script>
<script type="application/ld+json">/*<![CDATA[*/{"@type":"FAQPage"}/*]]>*/</script>
<script type='application/ld+json'><![CDATA[{"@type":"HowTo"}]]></script>`;
	assert.ok(rong.length < 200_000);
	const { r, ms } = doGio(() => doTrang(html, { tuKhoa: TU_KHOA, url: "https://x.vn/" }));
	assert.ok(ms < 500, `${ms.toFixed(0)} ms`);
	assert.ok(!r.loaiJsonLd.includes("Recipe"));
	assert.ok(r.loaiJsonLd.includes("Rong"));
	assert.ok(!r.loaiJsonLd.includes("Cuoi"), "quá 5.000 nút thì dừng duyệt");
	assert.equal(r.coFaq, true);
	assert.ok(r.loaiJsonLd.includes("HowTo"));
});

test("doTrang không bao giờ ném: html kiểu lạ", () => {
	for (const html of [{}, 12, "<p>&#99999999;</p>", `<script type="application/ld+json">null</script>`, `<script type="application/ld+json">"chuỗi"</script>`])
		assert.doesNotThrow(() => doTrang(html, { tuKhoa: TU_KHOA, url: "rác" }));
	assert.doesNotThrow(() => doTrang("<p>x</p>", {}));
});

// ---- Vị trí câu trả lời: bỏ mục lục + đoạn nhắc lại câu hỏi (fix round 1, mục 6) ----
test("vị trí trả lời: bỏ qua mục lục (li chỉ có link neo) và đoạn chỉ nhắc lại câu hỏi", () => {
	const html = `<body><article>
<h1>Huyệt Thần Môn</h1>
<ol class="toc"><li><a href="#vi-tri">Vị trí huyệt Thần Môn</a></li><li>1. <a href="#tac-dung">Tác dụng huyệt Thần Môn</a></li></ol>
<p>Huyệt Thần Môn là gì?</p>
<p>Tìm hiểu huyệt Thần Môn</p>
<p>Huyệt Thần Môn nằm ở nếp gấp cổ tay, phía xương đậu.</p>
</article></body>`;
	const d = doTrang(html, { tuKhoa: TU_KHOA, url: "https://x.vn/" });
	// Đứng trước: h1 (3) + mục lục (5 + 6, "1." là một chữ) + "Huyệt Thần Môn là gì?" (5) + "Tìm hiểu huyệt Thần Môn" (5).
	assert.equal(d.viTriTraLoi, 24);
});

// ---- Tác giả: chỉ dòng ký tên (mục 7) ----
test("tác giả: dòng ký tên trong <header> của bài vẫn bắt; 'tham vấn ý kiến' không phải ký tên", () => {
	const coTG = (than, dau = "") => doTrang(`<html><head>${dau}</head><body>${than}</body></html>`, { tuKhoa: TU_KHOA, url: "https://x.vn/" }).coTacGia;
	assert.equal(coTG(`<article><header><span>Tác giả: Lương y Minh</span></header><p>x</p></article>`), true);
	assert.equal(coTG(`<main><header>Người viết: A</header><p>x</p></main>`), true);
	assert.equal(coTG(`<p>Bài viết được Tham vấn y khoa bởi Y sỹ B</p>`), true);
	assert.equal(coTG(`<p>Cố vấn chuyên môn: Lương y C</p>`), true);
	assert.equal(coTG(`<p>Người duyệt: D</p>`), true);
	assert.equal(coTG(`<p>Biên tập: E</p>`), true);
	assert.equal(coTG(`<p>Nên tham vấn ý kiến thầy thuốc trước khi bấm huyệt.</p>`), false);
	assert.equal(coTG(`<p>Theo tác giả của nghiên cứu, huyệt này…</p>`), false);
	// meta author chung chung (admin, tên site) không tính.
	assert.equal(coTG(`<p>x</p>`, `<meta name="author" content="admin">`), false);
	assert.equal(coTG(`<p>x</p>`, `<meta name="author" content="Administrator">`), false);
	assert.equal(coTG(`<p>x</p>`, `<meta property="og:site_name" content="Nhà Thuốc X"><meta name="author" content="Nhà thuốc X">`), false);
	assert.equal(coTG(`<p>x</p>`, `<meta name="author" content="X.vn">`), false);
	assert.equal(coTG(`<p>x</p>`, `<meta name="author" content="Lương y Minh">`), true);
	// JSON-LD author là chính tổ chức/site → không tính; là người thật → tính.
	const ld = (a) => `<script type="application/ld+json">${JSON.stringify({ "@type": "Article", author: a })}</script>`;
	assert.equal(coTG(`<p>x</p>`, ld({ "@type": "Organization", name: "admin" })), false);
	assert.equal(coTG(`<p>x</p>`, ld([{ "@type": "Person", name: "Y sỹ B" }])), true);
	// header/footer NGOÀI bài vẫn bị bỏ khỏi chữ; TRONG <article> thì giữ.
	const d = doTrang(`<body><header>Menu site</header><article><header>Tác giả: A</header><p>thân</p><footer>Nguồn: sách</footer></article><footer>Chân</footer></body>`, { tuKhoa: TU_KHOA, url: "https://x.vn/" });
	assert.equal(d.chu, "Tác giả: A thân Nguồn: sách");
});

// ---- Nguồn ngoài (mục 8) ----
test("nguồn ngoài: chỉ trong bài; bỏ mạng xã hội/nút chia sẻ, miền con của chính site, rel sponsored", () => {
	const html = `<body><div class="sidebar"><a href="https://ngoai-bai.vn/x">quảng cáo bên</a></div><article>
<p><a href="https://pubmed.ncbi.nlm.nih.gov/1">PubMed</a>
<a href="https://www.facebook.com/sharer/sharer.php?u=x">fb</a> <a href="https://twitter.com/intent/tweet">tw</a> <a href="https://x.com/share">x</a>
<a href="https://zalo.me/share">zalo</a> <a href="https://pinterest.com/pin/create">pin</a> <a href="https://www.linkedin.com/shareArticle">in</a>
<a href="https://t.me/share/url">tg</a> <a href="https://www.youtube.com/share?x">yt</a> <a href="https://www.addtoany.com/share">a2a</a>
<a href="https://ws.sharethis.com/x">st</a> <a href="https://cdn.hs.com.vn/a.pdf">miền con</a> <a href="https://shop.hs.com.vn/">shop</a>
<a rel="nofollow sponsored" href="https://quang-cao.vn/">tài trợ</a> <a href="https://www.youtube.com/watch?v=1">video</a>
<a href="https://moh.gov.vn/x">Bộ Y tế</a></p></article></body>`;
	const d = doTrang(html, { tuKhoa: TU_KHOA, url: "https://www.hs.com.vn/bai" });
	assert.equal(d.soNguonNgoai, 3); // pubmed, youtube watch, moh.gov.vn
	// Không có <article>/<main> thì cả thân (trừ nav/header/footer/aside) như trước.
	assert.equal(doTrang(`<body><p><a href="https://who.int/a">WHO</a></p></body>`, { tuKhoa: TU_KHOA, url: "https://x.vn/" }).soNguonNgoai, 1);
});

// ---- Ngày cập nhật (minor) ----
test("ngày: <time> chỉ tính trong bài; đọc 'Cập nhật: dd/mm/yyyy' và dd/mm/yyyy trong <time>", () => {
	const ng = (than) => doTrang(`<body>${than}</body>`, { tuKhoa: TU_KHOA, url: "https://x.vn/" }).ngayCapNhat;
	assert.equal(ng(`<aside><time datetime="2026-09-01">x</time></aside><article><p>Cập nhật: 05/03/2024</p></article>`), "2024-03-05");
	assert.equal(ng(`<article><p>Ngày cập nhật lần cuối 7-11-2025</p></article>`), "2025-11-07");
	assert.equal(ng(`<article><time>12/08/2025</time></article>`), "2025-08-12");
	assert.equal(ng(`<div><time datetime="2026-09-01">bài liên quan</time></div><article><p>x</p></article>`), null);
	assert.equal(ng(`<article><p>Cập nhật: 31/02/2024</p></article>`), null, "ngày không có thật");
});

// ---- Fix round 2 ----
test("I2 tác giả: chỉ NHÃN ký tên (đầu dòng/khối + ':' hay '–' + tên), không câu khuyên, không khung chân trang", () => {
	const coTG = (than) => doTrang(`<html><body>${than}</body></html>`, { tuKhoa: TU_KHOA, url: "https://x.vn/" }).coTacGia;
	assert.equal(coTG(`<p>Cần tham vấn y khoa nếu đau.</p>`), false);
	assert.equal(coTG(`<p>Bạn nên tham vấn chuyên môn trước khi bấm huyệt.</p>`), false);
	assert.equal(coTG(`<p>Hãy tham vấn y học cổ truyền.</p>`), false);
	assert.equal(coTG(`<p>x</p><footer><p>Tổng biên tập: Nguyễn Văn A</p><p>Giấy phép số 12/GP-BTTTT</p></footer>`), false);
	// Khung chân trang nằm trong khối thường (không có <footer>) vẫn không tính.
	assert.equal(coTG(`<p>x</p><div class="ft"><p>Tổng biên tập: Nguyễn Văn A</p><p>Phó tổng biên tập: Trần B</p><p>Chịu trách nhiệm nội dung: Lê C</p></div>`), false);
	assert.equal(coTG(`<article><p>Tham vấn y khoa: ThS.BS Trần B</p><p>x</p></article>`), true);
	assert.equal(coTG(`<p>Tác giả: Lê C</p>`), true);
	assert.equal(coTG(`<p><strong>Tác giả:</strong> Lê C</p>`), true);
	assert.equal(coTG(`<p>Tác giả – BS. Lê C</p>`), true);
	assert.equal(coTG(`<p>Người viết: lương y Minh</p>`), true);
	assert.equal(coTG(`<p>Chúng tôi có đội ngũ cố vấn chuyên môn giàu kinh nghiệm.</p>`), false);
	assert.equal(coTG(`<p>Cố vấn chuyên môn: giàu kinh nghiệm</p>`), false, "sau nhãn phải là tên");
	assert.equal(coTG(`<p>Xem thêm tác giả: Lê C</p>`), false, "nhãn phải đứng đầu dòng");
	// Có <article> thì chỉ soi trong bài: ký tên ở khung bên ngoài không tính.
	assert.equal(coTG(`<div>Tác giả: Lê C</div><article><p>x</p></article>`), false);
});

test("M2 trả lời ngắn kiểu 'Từ khoá: cụm ngắn' được tính; đoạn kết thúc '?' chỉ là nhắc lại khi ≤ 12 chữ", () => {
	const vt = (than) => doTrang(`<body><h1>Mở</h1>${than}</body>`, { tuKhoa: TU_KHOA, url: "https://x.vn/" }).viTriTraLoi;
	assert.equal(vt(`<p>Huyệt Thần Môn: cổ tay</p>`), 1);
	assert.equal(vt(`<p>Huyệt Thần Môn: là gì</p>`), null, "sau dấu hai chấm chỉ có hư từ → vẫn là nhắc lại");
	assert.equal(vt(`<p>Huyệt Thần Môn nằm ở nếp gấp cổ tay, phía xương đậu, bạn đã biết chưa?</p>`), 1);
	assert.equal(vt(`<p>Huyệt Thần Môn nằm ở đâu trên cổ tay?</p>`), null);
});

// ---- Sửa sau nghiệm thu 2D ----
test("ngày: dạng ISO sau 'Cập nhật' (có/không dấu hai chấm) — đúng dòng byline trang từ điển của mình", () => {
	const ng = (than, head = "") => doTrang(`<html><head>${head}</head><body>${than}</body></html>`, { tuKhoa: TU_KHOA, url: "https://kinhlac.online/huyet/ha-quan/" }).ngayCapNhat;
	assert.equal(ng(`<p class="dl-byline">Biên soạn: Ban Biên Tập · Theo y văn cổ truyền · Cập nhật 2026-09-30</p>`), "2026-09-30");
	// Bố cục thật của build-dict.mjs: byline nằm trong <main><article> ngay dưới h1.
	assert.equal(ng(`<main class="bl-main"><article class="bl-article dl-article"><nav>Trang chủ › Huyệt</nav><h1>Hạ Quan</h1><p class="dl-byline">Biên soạn: Ban Biên Tập · Theo y văn cổ truyền · Cập nhật 2026-09-30</p><p class="dl-lead">x</p></article></main>`), "2026-09-30");
	assert.equal(ng(`<article><p>Ngày cập nhật: 2025-3-7</p></article>`), "2025-03-07");
	assert.equal(ng(`<article><p>Cập nhật lần cuối 2024-12-01</p></article>`), "2024-12-01");
	assert.equal(ng(`<article><p>Cập nhật 2026-02-31</p></article>`), null, "ngày không có thật");
	// dd/mm/yyyy vẫn đọc như cũ.
	assert.equal(ng(`<article><p>Cập nhật: 05/03/2024</p></article>`), "2024-03-05");
	// Chỉ có <meta property="article:modified_time">.
	assert.equal(ng(`<p>x</p>`, `<meta property="article:modified_time" content="2026-09-30T08:00:00+07:00">`), "2026-09-30T08:00:00+07:00");
});

// ── Quảng cáo & khối dính (01/10/2026) ────────────────────────────────────────────────────
// FI_ADV là hình phạt đơn lẻ nặng nhất trong bộ trọng số Yandex bị lộ, nên đáng đo. Nhưng ta
// chỉ có HTML thô: bẫy ở đây là VU OAN, không phải đếm thiếu.
test("đếm khối quảng cáo từ mạng quảng cáo đã biết", () => {
	const h = `<html><body>
		<script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
		<ins class="adsbygoogle" data-ad-slot="1"></ins>
		<iframe src="https://ad.doubleclick.net/x"></iframe>
		<p>Nội dung thật</p></body></html>`;
	assert.ok(doTrang(h, { tuKhoa: "x", url: "https://a.vn/" }).soQuangCao >= 3);
});

test("KHÔNG vu oan: lớp tên 'ads'/'banner' của chính site không phải quảng cáo", () => {
	const h = `<html><body>
		<div class="ads-noi-bo"><a href="/khoa-hoc/">Khoá học của chúng tôi</a></div>
		<div class="banner"><img src="/img/bia.jpg" alt="bìa"></div>
		<p>Nội dung thật</p></body></html>`;
	assert.equal(doTrang(h, { tuKhoa: "x", url: "https://a.vn/" }).soQuangCao, 0);
});

test("khối dính đếm theo style nội tuyến, không đếm chuỗi nằm trong JS", () => {
	const h = `<html><body>
		<div style="position:fixed;bottom:0">thanh dính</div>
		<div style="position: sticky; top: 0">thanh dính 2</div>
		<script>var css = "position:fixed"; var x = "position:sticky"</script>
		<p>Nội dung</p></body></html>`;
	assert.equal(doTrang(h, { tuKhoa: "x", url: "https://a.vn/" }).soDinh, 2);
});

test("trang sạch → 0 quảng cáo, 0 khối dính", () => {
	const r = doTrang(`<html><body><article><p>Chữ sạch</p></article></body></html>`, { tuKhoa: "x", url: "https://a.vn/" });
	assert.equal(r.soQuangCao, 0);
	assert.equal(r.soDinh, 0);
});
