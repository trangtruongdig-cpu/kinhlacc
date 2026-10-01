// Chạy: cd cms && node --test src/lib/khung-blog.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

import {
	SITE,
	escText,
	escAttr,
	hrefAnToan,
	portableTextSangHtml,
	vanBanTran,
	urlAnhBia,
	mang,
	ngay,
	baiTuEntry,
	chonBaiLienQuan,
	trangBai,
	trangDanhSach,
	trang404,
	sitemapBlog,
	gocCongKhai,
	topbar,
	footer,
} from "./khung-blog.mjs";

const span = (text, marks = []) => ({ _type: "span", text, marks });
const khoi = (style, children, them = {}) => ({ _type: "block", style, children, markDefs: [], ...them });

// ───────────────────────── Portable Text → HTML ─────────────────────────

test("khối thường, tiêu đề, trích dẫn ra đúng thẻ bản tĩnh dùng", () => {
	const html = portableTextSangHtml([
		khoi("normal", [span("Đoạn văn.")]),
		khoi("h2", [span("Mục hai")]),
		khoi("h3", [span("Mục ba")]),
		khoi("h4", [span("Mục bốn")]),
		khoi("blockquote", [span("Lời trích")]),
	]);
	assert.equal(
		html,
		"<p>Đoạn văn.</p>\n<h2>Mục hai</h2>\n<h3>Mục ba</h3>\n<h4>Mục bốn</h4>\n<blockquote><p>Lời trích</p></blockquote>",
	);
});

test("h1 trong thân bài hạ xuống h2 (trang chỉ có MỘT h1), kiểu lạ về p", () => {
	assert.equal(portableTextSangHtml([khoi("h1", [span("A")])]), "<h2>A</h2>");
	assert.equal(portableTextSangHtml([khoi("la-lung", [span("A")])]), "<p>A</p>");
});

test("khối rỗng bị bỏ, không sinh <p></p>", () => {
	assert.equal(portableTextSangHtml([khoi("normal", [span("")]), khoi("normal", [span("  ")])]), "");
});

test("dấu strong/em/code/strike-through", () => {
	const html = portableTextSangHtml([
		khoi("normal", [
			span("đậm", ["strong"]),
			span(" "),
			span("nghiêng", ["em"]),
			span(" "),
			span("mã", ["code"]),
			span(" "),
			span("gạch", ["strike-through"]),
			span(" "),
			span("cả hai", ["strong", "em"]),
		]),
	]);
	assert.equal(
		html,
		"<p><strong>đậm</strong> <em>nghiêng</em> <code>mã</code> <s>gạch</s> <strong><em>cả hai</em></strong></p>",
	);
});

test("link: chỉ nhận /…, http(s)://…, mailto:", () => {
	const b = (href) =>
		portableTextSangHtml([
			{ _type: "block", style: "normal", markDefs: [{ _key: "k", _type: "link", href }], children: [span("chữ", ["k"])] },
		]);
	assert.equal(b("/huyet/hop-coc/"), '<p><a href="/huyet/hop-coc/">chữ</a></p>');
	assert.equal(b("https://vi.wikipedia.org/a?b=1&c=2"), '<p><a href="https://vi.wikipedia.org/a?b=1&amp;c=2">chữ</a></p>');
	assert.equal(b("mailto:a@b.vn"), '<p><a href="mailto:a@b.vn">chữ</a></p>');
	// Bị từ chối → còn chữ, mất link.
	for (const xau of [
		"javascript:alert(1)",
		"JaVaScRiPt:alert(1)",
		" javascript:alert(1)",
		"java\tscript:alert(1)",
		"data:text/html,<script>alert(1)</script>",
		"vbscript:x",
		"//evil.example/x",
		"/\\evil.example",
		"blog/tuong-doi",
		"",
		null,
		42,
	]) {
		assert.equal(b(xau), "<p>chữ</p>", `phải loại href: ${String(xau)}`);
	}
});

test("href có nháy kép không thoát ra khỏi thuộc tính", () => {
	const html = portableTextSangHtml([
		{
			_type: "block",
			style: "normal",
			markDefs: [{ _key: "k", _type: "link", href: 'https://a.vn/"><script>alert(1)</script>' }],
			children: [span("x", ["k"])],
		},
	]);
	assert.ok(!html.includes("<script>"));
	assert.ok(html.includes("&quot;&gt;&lt;script&gt;"));
});

test('chữ chứa "><script> được escape ở mọi nơi', () => {
	const xau = '"><script>alert(1)</script>';
	const html = portableTextSangHtml([
		khoi("normal", [span(xau)]),
		khoi("h2", [span(xau, ["strong"])]),
		khoi("normal", [span(xau)], { listItem: "bullet", level: 1 }),
		{ _type: "image", asset: { url: "/_emdash/api/media/file/abc.webp" }, alt: xau, caption: xau },
		{ _type: "code", code: xau },
	]);
	assert.ok(!html.includes("<script>"), html);
	assert.ok(!/alt="[^"]*"[^ >\/]/.test(html.replace(/alt="[^"]*" loading/g, "")), "alt không được vỡ thuộc tính");
	assert.ok(html.includes('alt="&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"'));
});

test("danh sách bullet/number, có lồng cấp", () => {
	const li = (t, listItem, level) => khoi("normal", [span(t)], { listItem, level });
	assert.equal(
		portableTextSangHtml([li("a", "bullet", 1), li("b", "bullet", 1)]),
		"<ul><li>a</li><li>b</li></ul>",
	);
	assert.equal(
		portableTextSangHtml([li("a", "number", 1), li("a1", "bullet", 2), li("a2", "bullet", 2), li("b", "number", 1)]),
		"<ol><li>a<ul><li>a1</li><li>a2</li></ul></li><li>b</li></ol>",
	);
	// Đổi kiểu ở cùng cấp → đóng danh sách cũ, mở danh sách mới.
	assert.equal(
		portableTextSangHtml([li("a", "bullet", 1), li("b", "number", 1)]),
		"<ul><li>a</li></ul>\n<ol><li>b</li></ol>",
	);
	// Danh sách kết thúc khi gặp khối thường.
	assert.equal(
		portableTextSangHtml([li("a", "bullet", 1), khoi("normal", [span("sau")])]),
		"<ul><li>a</li></ul>\n<p>sau</p>",
	);
	// level thiếu/vô lý không làm treo hay sinh thẻ lệch.
	const le = portableTextSangHtml([li("a", "bullet", undefined), li("b", "bullet", 99)]);
	assert.equal((le.match(/<ul>/g) || []).length, (le.match(/<\/ul>/g) || []).length);
	assert.equal((le.match(/<li>/g) || []).length, (le.match(/<\/li>/g) || []).length);
});

test("ảnh trong thân: chỉ nhận ba tiền tố đã duyệt", () => {
	const anh = (url, them = {}) => portableTextSangHtml([{ _type: "image", asset: { url }, ...them }]);
	assert.equal(
		anh("/_emdash/api/media/file/01ABC.webp", { alt: "Huyệt Hợp Cốc" }),
		'<p><img src="/_emdash/api/media/file/01ABC.webp" alt="Huyệt Hợp Cốc" loading="lazy"></p>',
	);
	assert.ok(anh("/kinhmach3d/images/a.jpg").includes('src="/kinhmach3d/images/a.jpg"'));
	assert.ok(anh("/blog-images/a.webp").includes('src="/blog-images/a.webp"'));
	for (const xau of [
		"https://evil.example/a.png",
		"javascript:alert(1)",
		"/khac/a.png",
		"/_emdash/api/media/file/../../admin",
		'/blog-images/a.png" onerror="alert(1)',
		"",
		undefined,
	]) {
		assert.equal(anh(xau), "", `phải bỏ ảnh: ${String(xau)}`);
	}
	// Không có asset → bỏ, không ném lỗi.
	assert.equal(portableTextSangHtml([{ _type: "image" }]), "");
});

test("loại khối lạ bị bỏ qua; đầu vào hỏng không ném lỗi", () => {
	assert.equal(portableTextSangHtml([{ _type: "htmlBlock", html: "<script>x</script>" }, { _type: "table" }]), "");
	assert.equal(portableTextSangHtml(null), "");
	assert.equal(portableTextSangHtml("chuỗi"), "");
	assert.equal(portableTextSangHtml([null, 3, "x", { _type: "block" }]), "");
});

test("xuống dòng trong span thành <br>", () => {
	assert.equal(portableTextSangHtml([khoi("normal", [span("a\nb")])]), "<p>a<br>b</p>");
});

test("vanBanTran rút chữ thuần để làm mô tả dự phòng", () => {
	assert.equal(vanBanTran([khoi("h2", [span("Một")]), khoi("normal", [span("hai "), span("ba")])]), "Một hai ba");
	assert.equal(vanBanTran(undefined), "");
});

// ───────────────────────── Tiện ích ─────────────────────────

test("hrefAnToan / escText / escAttr", () => {
	assert.equal(hrefAnToan("/a"), "/a");
	assert.equal(hrefAnToan("HTTPS://a.vn"), "HTTPS://a.vn");
	assert.equal(hrefAnToan("javascript:1"), null);
	assert.equal(escText("<a & b>"), "&lt;a &amp; b&gt;");
	assert.equal(escAttr('"x"'), "&quot;x&quot;");
});

test("urlAnhBia: object có storageKey, chuỗi JSON, src; id trần → không dựng ảnh", () => {
	assert.equal(urlAnhBia({ id: "01ID", meta: { storageKey: "01KEY.webp" } }), "/_emdash/api/media/file/01KEY.webp");
	assert.equal(
		urlAnhBia(JSON.stringify({ id: "01ID", meta: { storageKey: "01KEY.webp" } })),
		"/_emdash/api/media/file/01KEY.webp",
	);
	assert.equal(urlAnhBia({ src: "/blog-images/a.webp" }), "/blog-images/a.webp");
	assert.equal(urlAnhBia({ src: "https://kinhlac.online/a.png" }), "https://kinhlac.online/a.png");
	// id KHÁC storageKey: /file/<id> trả 404 mà <img> vẫn render → thà không có ảnh.
	assert.equal(urlAnhBia("01ID"), undefined);
	assert.equal(urlAnhBia({ id: "01ID" }), undefined);
	assert.equal(urlAnhBia({ id: "01ID", meta: {} }), undefined);
	// Hỏng / độc.
	assert.equal(urlAnhBia("{hỏng"), undefined);
	assert.equal(urlAnhBia({ meta: { storageKey: '../x" onerror="1' } }), undefined);
	assert.equal(urlAnhBia({ meta: { storageKey: "../../etc/passwd" } }), undefined);
	assert.equal(urlAnhBia({ src: "javascript:alert(1)" }), undefined);
	assert.equal(urlAnhBia(null), undefined);
	assert.equal(urlAnhBia(undefined), undefined);
});

test("mang / ngay chuẩn hoá trường json và mốc thời gian", () => {
	assert.deepEqual(mang('[{"q":"a","a":"b"}]'), [{ q: "a", a: "b" }]);
	assert.deepEqual(mang([1]), [1]);
	assert.deepEqual(mang("hỏng"), []);
	assert.deepEqual(mang(null), []);
	assert.equal(ngay("2026-09-25T14:56:41.321Z"), "2026-09-25");
	assert.equal(ngay(new Date("2026-09-25T14:56:41.321Z")), "2026-09-25");
	assert.equal(ngay("2026-09-25 14:56:41.321454+00"), "2026-09-25");
	assert.equal(ngay("rác"), "");
	assert.equal(ngay(null), "");
	assert.equal(ngay(new Date("rác")), "");
});

test("gocCongKhai: bỏ / cuối, mặc định https://kinhlac.online", () => {
	assert.equal(gocCongKhai("https://kinhlac.online/"), "https://kinhlac.online");
	assert.equal(gocCongKhai(undefined), "https://kinhlac.online");
	assert.equal(gocCongKhai(""), "https://kinhlac.online");
});

// ───────────────────────── baiTuEntry ─────────────────────────

const entryMau = (them = {}) => ({
	id: "01ID",
	slug: "huyet-hop-coc",
	data: {
		id: "01ID",
		title: "Huyệt Hợp Cốc",
		description: "Vị trí và tác dụng huyệt Hợp Cốc.",
		content: [khoi("normal", [span("Thân bài.")])],
		featured_image: { id: "01ID", meta: { storageKey: "01KEY.webp" } },
		ngay_dang: "2026-09-01",
		ngay_cap_nhat: "2026-09-20",
		tac_gia: "Ban Biên Tập Kinh Lạc",
		nguoi_duyet: "Trương Đình Trang",
		chuc_danh_nguoi_duyet: "Y Sỹ Y Học Cổ Truyền (đang theo học)",
		cta: "/xem-3d",
		tu_khoa: ["hợp cốc", "huyệt vị"],
		faq: [{ q: "Hợp Cốc ở đâu?", a: "Ở mu bàn tay." }, { q: "", a: "bỏ" }],
		nguon_tham_khao: [{ title: "Châm Cứu Học", url: "https://example.vn/sach" }],
		cho_index: true,
		publishedAt: new Date("2026-09-25T00:00:00Z"),
		...them,
	},
});

test("baiTuEntry: ánh xạ trường bai_viet sang dữ liệu khung", () => {
	const a = baiTuEntry(entryMau(), { category: "Huyệt Vị", cluster: "huyet-vi" });
	assert.equal(a.slug, "huyet-hop-coc");
	assert.equal(a.title, "Huyệt Hợp Cốc");
	assert.equal(a.date, "2026-09-01");
	assert.equal(a.updated, "2026-09-20");
	assert.equal(a.image, "/_emdash/api/media/file/01KEY.webp");
	assert.equal(a.reviewer, "Trương Đình Trang");
	assert.equal(a.category, "Huyệt Vị");
	assert.equal(a.cluster, "huyet-vi");
	assert.equal(a.bodyHtml, "<p>Thân bài.</p>");
	assert.deepEqual(a.faq, [{ q: "Hợp Cốc ở đâu?", a: "Ở mu bàn tay." }]);
	assert.deepEqual(a.keywords, ["hợp cốc", "huyệt vị"]);
	assert.equal(a.index, true);
});

test("baiTuEntry: ngày đăng lùi về publishedAt; không tự bịa người duyệt", () => {
	const a = baiTuEntry(entryMau({ ngay_dang: undefined, ngay_cap_nhat: undefined, nguoi_duyet: "  ", chuc_danh_nguoi_duyet: "" }));
	assert.equal(a.date, "2026-09-25");
	assert.equal(a.updated, "2026-09-25");
	assert.equal(a.reviewer, "");
});

test("baiTuEntry: noindex khi _emdash_seo.noIndex hoặc cho_index = false", () => {
	assert.equal(baiTuEntry({ ...entryMau(), seo: { noIndex: true } }).index, false);
	assert.equal(baiTuEntry(entryMau({ seo: { noIndex: true } })).index, false);
	assert.equal(baiTuEntry(entryMau({ cho_index: false })).index, false);
	assert.equal(baiTuEntry(entryMau({ cho_index: undefined })).index, true);
});

test("baiTuEntry: mô tả trống thì rút từ thân bài, cắt gọn", () => {
	const dai = "chữ ".repeat(100);
	const a = baiTuEntry(entryMau({ description: "", content: [khoi("normal", [span(dai)])] }));
	assert.ok(a.description.length > 20 && a.description.length <= 160);
});

test("baiTuEntry: slug thiếu thì dùng id", () => {
	assert.equal(baiTuEntry({ id: "01X", slug: null, data: { title: "T" } }).slug, "01X");
});

// ───────────────────────── Trang bài ─────────────────────────

const GOC = "https://kinhlac.online";

test("trangBai: head đủ thẻ, canonical https có / cuối, nạp /blog/blog.css", () => {
	const a = baiTuEntry(entryMau(), { category: "Huyệt Vị" });
	const html = trangBai(a, [a], { domain: GOC });
	assert.ok(html.startsWith("<!DOCTYPE html>\n<html lang=\"vi\">"));
	assert.ok(html.includes(`<title>Huyệt Hợp Cốc — ${SITE}</title>`));
	assert.ok(html.includes('<link rel="canonical" href="https://kinhlac.online/blog/huyet-hop-coc/">'));
	assert.ok(html.includes('<meta property="og:url" content="https://kinhlac.online/blog/huyet-hop-coc/">'));
	assert.ok(html.includes('<link rel="stylesheet" href="/blog/blog.css">'));
	assert.ok(html.includes('<meta name="robots" content="index, follow">'));
	assert.ok(html.includes('<meta property="og:image" content="https://kinhlac.online/_emdash/api/media/file/01KEY.webp">'));
	assert.ok(html.includes('<img class="bl-hero-img" src="/_emdash/api/media/file/01KEY.webp"'));
	assert.ok(html.includes(topbar) && html.includes(footer));
	assert.ok(html.trimEnd().endsWith("</body></html>"));
});

const docLd = (html) =>
	[...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));

test("trangBai: JSON-LD Article + image + BreadcrumbList + FAQPage", () => {
	const a = baiTuEntry(entryMau());
	const lds = docLd(trangBai(a, [a], { domain: GOC }));
	const art = lds.find((x) => x["@type"] === "Article");
	assert.equal(art.headline, "Huyệt Hợp Cốc");
	assert.equal(art.datePublished, "2026-09-01");
	assert.equal(art.dateModified, "2026-09-20");
	assert.equal(art.image, "https://kinhlac.online/_emdash/api/media/file/01KEY.webp");
	assert.equal(art.mainEntityOfPage["@id"], "https://kinhlac.online/blog/huyet-hop-coc/");
	assert.deepEqual(art.reviewedBy, { "@type": "Person", name: "Trương Đình Trang", jobTitle: "Y Sỹ Y Học Cổ Truyền (đang theo học)" });
	assert.deepEqual(art.citation, ["Châm Cứu Học"]);
	const bc = lds.find((x) => x["@type"] === "BreadcrumbList");
	assert.equal(bc.itemListElement[2].item, "https://kinhlac.online/blog/huyet-hop-coc/");
	const faq = lds.find((x) => x["@type"] === "FAQPage");
	assert.equal(faq.mainEntity.length, 1);
});

test("trangBai: KHÔNG có người duyệt → không nhãn rà soát, không reviewedBy, không tên mặc định", () => {
	const a = baiTuEntry(entryMau({ nguoi_duyet: "", chuc_danh_nguoi_duyet: "" }));
	const html = trangBai(a, [a], { domain: GOC });
	assert.ok(!html.includes("Đã rà soát chuyên môn"));
	assert.ok(!html.includes("bl-byline-review"));
	assert.ok(!html.includes("Rà soát chuyên môn:"));
	assert.ok(!html.includes("Trương Đình Trang"));
	const art = docLd(html).find((x) => x["@type"] === "Article");
	assert.equal("reviewedBy" in art, false);
	// Miễn trừ y tế vẫn còn.
	assert.ok(html.includes("Miễn Trừ Y Tế"));
});

test("trangBai: có người duyệt → in nhãn + tên + chức danh", () => {
	const a = baiTuEntry(entryMau());
	const html = trangBai(a, [a], { domain: GOC });
	assert.ok(html.includes('<span class="bl-review-badge">✔ Đã rà soát chuyên môn</span> Trương Đình Trang — Y Sỹ Y Học Cổ Truyền (đang theo học)'));
});

test("trangBai: không ảnh bìa → không thẻ <img> bìa, og:image về ảnh mặc định", () => {
	const a = baiTuEntry(entryMau({ featured_image: "01ID-tran" }));
	const html = trangBai(a, [a], { domain: GOC });
	assert.ok(!html.includes("bl-hero-img"));
	assert.ok(html.includes('<meta property="og:image" content="https://kinhlac.online/og-default.png">'));
});

test("trangBai: noindex khi bài bị chặn index; bản xem trước luôn noindex + có dải báo", () => {
	const kin = baiTuEntry(entryMau({ cho_index: false }));
	assert.ok(trangBai(kin, [], { domain: GOC }).includes('<meta name="robots" content="noindex, nofollow">'));
	const a = baiTuEntry(entryMau());
	const xt = trangBai(a, [a], { domain: GOC, xemTruoc: true });
	assert.ok(xt.includes('<meta name="robots" content="noindex, nofollow">'));
	assert.ok(xt.includes("Bản nháp — đang xem trước"));
	assert.ok(!trangBai(a, [a], { domain: GOC }).includes("Bản nháp — đang xem trước"));
});

test("trangBai: ghi đè SEO từ _emdash_seo (title, description, canonical, image)", () => {
	const a = baiTuEntry({
		...entryMau(),
		seo: { title: "Tiêu đề SEO", description: "Mô tả SEO", canonical: "https://kinhlac.online/blog/khac/", image: null, noIndex: false },
	});
	const html = trangBai(a, [a], { domain: GOC });
	assert.ok(html.includes(`<title>Tiêu đề SEO — ${SITE}</title>`));
	assert.ok(html.includes('<meta name="description" content="Mô tả SEO">'));
	assert.ok(html.includes('<link rel="canonical" href="https://kinhlac.online/blog/khac/">'));
	// h1 vẫn là tiêu đề bài.
	assert.ok(html.includes("<h1>Huyệt Hợp Cốc</h1>"));
	// Tiêu đề SEO đã kèm tên site thì không gắn hai lần.
	const b = baiTuEntry({ ...entryMau(), seo: { title: `Tiêu đề — ${SITE}` } });
	assert.ok(trangBai(b, [b], { domain: GOC }).includes(`<title>Tiêu đề — ${SITE}</title>`));
	// canonical bậy bị bỏ, quay về URL của bài.
	const c = baiTuEntry({ ...entryMau(), seo: { canonical: "javascript:alert(1)" } });
	assert.ok(trangBai(c, [c], { domain: GOC }).includes('<link rel="canonical" href="https://kinhlac.online/blog/huyet-hop-coc/">'));
});

test("trangBai: dữ liệu độc trong mọi trường không lọt ra HTML", () => {
	const xau = '"><script>alert(1)</script>';
	const a = baiTuEntry(
		entryMau({
			title: xau,
			description: xau,
			tac_gia: xau,
			nguoi_duyet: xau,
			chuc_danh_nguoi_duyet: xau,
			cta: xau,
			tu_khoa: [xau],
			faq: [{ q: xau, a: xau }],
			nguon_tham_khao: [{ title: xau, url: "javascript:alert(1)" }, { title: xau, url: `https://a.vn/${xau}` }, xau],
			content: [khoi("normal", [span(xau)])],
		}),
		{ category: xau },
	);
	a.slug = xau;
	const html = trangBai(a, [a, { ...a, slug: "khac" }], { domain: GOC });
	assert.ok(!html.includes("<script>alert(1)"), "không được có <script> sống");
	assert.ok(!html.includes('href="javascript:'), "nguồn có href javascript: phải mất link");
	// JSON-LD vẫn parse được.
	assert.ok(docLd(html).length >= 2);
	// CTA lạ → về mặc định.
	assert.ok(html.includes('<div class="bl-cta"><a href="/xem-ket-qua-do">'));
});

test("trangBai: bài liên quan — cùng cụm trước, rồi cùng chuyên mục, tối đa 4, không tự trỏ", () => {
	const b = (slug, category, cluster) => ({ slug, title: slug, category, cluster });
	const a = b("a", "X", "c1");
	const tat = [a, b("k1", "Y", null), b("k2", "X", null), b("k3", "Z", "c1"), b("k4", "Y", null), b("k5", "Y", null)];
	assert.deepEqual(chonBaiLienQuan(a, tat).map((x) => x.slug), ["k3", "k2", "k1", "k4"]);
	const html = trangBai({ ...baiTuEntry(entryMau()), slug: "a", category: "X", cluster: "c1" }, tat, { domain: GOC });
	assert.ok(html.includes('<section class="bl-related"><h2>Bài Liên Quan</h2><ul><li><a href="/blog/k3/">k3</a></li>'));
	assert.ok(!html.includes('href="/blog/a/"'));
});

// ───────────────────────── Danh sách, 404, sitemap ─────────────────────────

test("trangDanhSach: thẻ bài, JSON-LD Blog, canonical /blog/", () => {
	const a = baiTuEntry(entryMau(), { category: "Huyệt Vị" });
	const html = trangDanhSach([a], { domain: GOC });
	assert.ok(html.includes('<link rel="canonical" href="https://kinhlac.online/blog/">'));
	assert.ok(html.includes('<meta property="og:type" content="website">'));
	assert.ok(html.includes('<a class="bl-card" href="/blog/huyet-hop-coc/">'));
	assert.ok(html.includes('<span class="bl-card-cat">Huyệt Vị</span>'));
	const blog = docLd(html).find((x) => x["@type"] === "Blog");
	assert.equal(blog.blogPost[0].url, "https://kinhlac.online/blog/huyet-hop-coc/");
	// Không bài nào → vẫn ra trang hợp lệ.
	assert.ok(trangDanhSach([], { domain: GOC }).includes('<div class="bl-grid"></div>'));
});

test("trang404: cùng khung, noindex, tiếng Việt", () => {
	const html = trang404({ domain: GOC });
	assert.ok(html.includes('<meta name="robots" content="noindex, nofollow">'));
	assert.ok(html.includes('<link rel="stylesheet" href="/blog/blog.css">'));
	assert.ok(html.includes("Không tìm thấy bài viết"));
	assert.ok(html.includes(topbar) && html.includes(footer));
	assert.ok(html.includes('href="/blog/"'));
});

test("sitemapBlog: /blog/ + từng bài, / cuối, lastmod ISO, bỏ bài noindex", () => {
	const a = baiTuEntry(entryMau());
	const kin = { ...baiTuEntry(entryMau({ cho_index: false })), slug: "kin" };
	const khongNgay = { slug: "khong-ngay", index: true };
	const xml = sitemapBlog([a, kin, khongNgay], { domain: GOC });
	assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
	assert.ok(xml.includes("<url><loc>https://kinhlac.online/blog/</loc><lastmod>2026-09-20</lastmod></url>"));
	assert.ok(xml.includes("<url><loc>https://kinhlac.online/blog/huyet-hop-coc/</loc><lastmod>2026-09-20</lastmod></url>"));
	assert.ok(xml.includes("<url><loc>https://kinhlac.online/blog/khong-ngay/</loc></url>"));
	assert.ok(!xml.includes("/blog/kin/"));
	// Ký tự XML trong slug được escape.
	assert.ok(sitemapBlog([{ slug: "a&b<c", index: true }], { domain: GOC }).includes("/blog/a&amp;b&lt;c/"));
	// Không bài nào → /blog/ không lastmod.
	assert.ok(sitemapBlog([], { domain: GOC }).includes("<url><loc>https://kinhlac.online/blog/</loc></url>"));
});

// ───────────────────────── Chống lệch với bản tĩnh ─────────────────────────
// cms/ build trong Docker với context ./cms nên KHÔNG import được frontend/ — khuôn là bản
// CHÉP. Phép kiểm này chạy ở repo để bản chép không trôi khỏi bản gốc; trong Docker thì bỏ qua.

const here = dirname(fileURLToPath(import.meta.url));
const duongTinh = resolve(here, "../../../frontend/scripts/build-blog.mjs");
const coTinh = existsSync(duongTinh) && existsSync(resolve(here, "../../../frontend/node_modules/marked"));

const lopCss = (html) => [...new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)))].sort();

test("chống lệch: khung CMS trùng khung build-blog.mjs của bản tĩnh", { skip: !coTinh && "không có frontend/ (build Docker)" }, async () => {
	const tinh = await import(pathToFileURL(duongTinh).href);
	const seo = await import(pathToFileURL(resolve(here, "../../../frontend/scripts/seo-html.mjs")).href);
	assert.equal(typeof tinh.articlePage, "function", "build-blog.mjs phải export articlePage");
	assert.equal(typeof tinh.indexPage, "function", "build-blog.mjs phải export indexPage");

	// Hằng số chép tay phải khớp nguồn.
	assert.equal(topbar, seo.topbar, "topbar lệch seo-html.mjs");
	assert.equal(footer, seo.footer, "footer lệch seo-html.mjs");

	const bodyMarkdown = "## Vị trí\n\nỞ **mu bàn tay**, xem [Hợp Cốc](/huyet/hop-coc/).\n\n- một\n- hai\n";
	const { marked } = await import(pathToFileURL(resolve(here, "../../../frontend/node_modules/marked/lib/marked.esm.js")).href);
	const mau = {
		slug: "bai-mau",
		title: 'Bài Mẫu "có nháy" & <thẻ>',
		description: "Mô tả bài mẫu.",
		date: "2026-09-01",
		updated: "2026-09-20",
		author: "Ban Biên Tập Kinh Lạc",
		reviewer: "Người Duyệt Mẫu",
		reviewerTitle: "Y Sỹ Y Học Cổ Truyền",
		category: "Huyệt Vị",
		cluster: "huyet-vi",
		cta: "/xem-3d",
		keywords: ["a", "b"],
		faq: [{ q: "Hỏi?", a: "Đáp." }],
		sources: [{ title: "Sách", url: "https://example.vn/s" }, "Nguồn chữ trần", { title: "Không link" }],
		image: "/blog-images/bai-mau.webp",
		index: true,
	};
	const khac = [
		{ ...mau, slug: "khac-1", title: "Khác 1", cluster: "huyet-vi" },
		{ ...mau, slug: "khac-2", title: "Khác 2", cluster: "x", category: "Kinh Lạc", image: undefined },
	];
	const tat = [mau, ...khac];
	const opt = { domain: seo.DOMAIN, gaId: seo.GA_ID };

	// Trang bài: cùng đầu vào → TRÙNG TỪNG KÝ TỰ (chặt hơn "cùng topbar/footer/lớp CSS").
	const tinhBai = tinh.articlePage({ ...mau, bodyMarkdown }, tat);
	const cmsBai = trangBai({ ...mau, bodyHtml: marked.parse(bodyMarkdown) }, tat, opt);
	assert.equal(cmsBai, tinhBai);

	// Bài không ảnh, không FAQ, không nguồn, không cập nhật.
	const gon = { ...mau, slug: "gon", image: undefined, faq: [], sources: [], updated: undefined, category: undefined, cta: undefined };
	assert.equal(
		trangBai({ ...gon, bodyHtml: marked.parse(bodyMarkdown) }, tat, opt),
		tinh.articlePage({ ...gon, bodyMarkdown }, tat),
	);

	// Trang danh sách.
	assert.equal(trangDanhSach(tat, opt), tinh.indexPage(tat));

	// Ba điều đề bài nêu đích danh — giữ riêng để khi phép so toàn trang gãy thì biết gãy ở đâu.
	assert.ok(cmsBai.includes('<link rel="stylesheet" href="/blog/blog.css">'));
	assert.ok(cmsBai.includes(seo.topbar) && cmsBai.includes(seo.footer));
	assert.deepEqual(lopCss(cmsBai), lopCss(tinhBai));

	// 404 và bài không người duyệt không được dùng lớp CSS nào ngoài bộ của bản tĩnh.
	const boLop = new Set([...lopCss(tinhBai), ...lopCss(tinh.indexPage(tat))]);
	const khongDuyet = trangBai({ ...mau, reviewer: "", bodyHtml: "" }, tat, opt);
	for (const l of [...lopCss(khongDuyet), ...lopCss(trang404(opt))]) assert.ok(boLop.has(l), `lớp CSS lạ: ${l}`);
});
