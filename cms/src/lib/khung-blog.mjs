// khung-blog.mjs — Khuôn HTML của blog công khai, bản CHÉP sang CMS.
//
// Nguồn gốc: frontend/scripts/build-blog.mjs (articlePage, indexPage) + phần
// frontend/scripts/seo-html.mjs mà nó dùng (head, topbar, footer, MUC_LUC, ld, escape).
// CSS vẫn là /blog/blog.css do nginx phục vụ từ frontend/dist — tệp này KHÔNG mang CSS.
//
// Vì sao chép chứ không import: cms/ build trong Docker với context ./cms, không với tới
// frontend/. Bản chép được canh bằng phép kiểm chống lệch trong khung-blog.test.mjs: cùng
// đầu vào thì trang ở đây phải TRÙNG TỪNG KÝ TỰ với trang build-blog.mjs dựng ra. Sửa khuôn
// thì sửa CẢ HAI nơi rồi chạy: cd cms && node --test src/lib/khung-blog.test.mjs
//
// Chỗ CỐ Ý khác bản tĩnh (bản tĩnh qua cổng duyệt blog:pre, bài CMS thì không):
//   - "✔ Đã rà soát chuyên môn" và JSON-LD reviewedBy chỉ in khi bài CÓ nguoi_duyet.
//     Bản tĩnh lùi về người duyệt mặc định; ở đây không — tuyên bố rà soát phải có thật.
//   - href của nguồn tham khảo và CTA đi qua hrefAnToan (bản tĩnh tin frontmatter).
//
// Tệp thuần: không import gì, không đọc đĩa, không đọc process.env — để Astro gói được và
// để phép kiểm chạy bằng node trần.

export const SITE = "Kinh Lạc Trương Gia";
export const DOMAIN_MAC_DINH = "https://kinhlac.online";
export const GA_ID_MAC_DINH = "G-E71BLBZXFH";
export const DEFAULT_AUTHOR = "Ban Biên Tập Kinh Lạc";
const TIEN_TO_MEDIA = "/_emdash/api/media/file/";
// Ảnh trong thân bài chỉ được trỏ vào ba kho của chính site.
const TIEN_TO_ANH_THAN = [TIEN_TO_MEDIA, "/kinhmach3d/", "/blog-images/"];

/** Origin công khai (https). Astro.url.origin sau Caddy+nginx là http:// nên không dùng được. */
export const gocCongKhai = (v) => String(v || DOMAIN_MAC_DINH).replace(/\/+$/, "") || DOMAIN_MAC_DINH;

export const escText = (s) =>
	String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const escAttr = (s) => escText(s).replace(/"/g, "&quot;");
export const ld = (obj) =>
	`<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;
const toAbs = (s, domain) => (/^https?:/.test(s) ? s : domain + (String(s).startsWith("/") ? s : "/" + s));

/**
 * Chỉ nhận đường nội bộ (/…, không phải //… hay /\…), http(s):// và mailto:.
 * Trả null cho mọi thứ khác — javascript:, data:, đường tương đối, không phải chuỗi.
 */
export function hrefAnToan(href) {
	if (typeof href !== "string") return null;
	if (/^\/(?![/\\])/.test(href)) return href;
	if (/^https?:\/\/[^\s]/i.test(href)) return href;
	if (/^mailto:[^\s]/i.test(href)) return href;
	return null;
}

// Nhãn nút CTA về tính năng phần mềm — chép từ seo-html.mjs.
export const CTA_LABELS = {
	"/xem-ket-qua-do": "Xem Demo Kết Quả Đo Kinh Lạc →",
	"/xem-3d": "Khám Phá Đồ Hình Kinh Lạc 3D →",
	"/xem-bai-thuoc": "Xem Phân Tích Bài Thuốc →",
	"/thu-vien": "Tra Cứu Từ Điển Huyệt Vị →",
	"/app": "Dùng Thử Phần Mềm →",
};

/** <head> chuẩn SEO — chép từ seo-html.mjs (bỏ extraHead, blog không dùng). */
export function head({
	title,
	description,
	canonical,
	jsonLds = [],
	ogType = "article",
	index = true,
	ogImage,
	domain = DOMAIN_MAC_DINH,
	gaId = GA_ID_MAC_DINH,
}) {
	const anh = ogImage || `${domain}/og-default.png`;
	return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#6b4423">
  <script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');</script>
  <!-- ?v=2 — xem ghi chú ở frontend/index.html: Chrome giữ favicon cũ trong kho riêng,
       đổi URL mới đẩy được bản mới tới khách đã ghé trước đây. -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2">
  <link rel="alternate icon" href="/favicon.ico?v=2">
  <title>${escText(title)}</title>
  <meta name="description" content="${escAttr(description)}">
  <meta name="robots" content="${index === false ? "noindex, nofollow" : "index, follow"}">
  <link rel="canonical" href="${escAttr(canonical)}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:site_name" content="${SITE}">
  <meta property="og:locale" content="vi_VN">
  <meta property="og:title" content="${escAttr(title)}">
  <meta property="og:description" content="${escAttr(description)}">
  <meta property="og:url" content="${escAttr(canonical)}">
  <meta property="og:image" content="${escAttr(anh)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escAttr(title)}">
  <meta name="twitter:description" content="${escAttr(description)}">
  <meta name="twitter:image" content="${escAttr(anh)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/blog/blog.css">
  ${jsonLds.join("\n  ")}
</head>`;
}

export const LOGO_SVG = `<svg class="bl-brand-mark" width="26" height="26" viewBox="0 0 64 64" fill="none" aria-hidden="true">
  <circle cx="32" cy="32" r="30" stroke="#cfad78" stroke-width="2"/>
  <path d="M32 12C32 12 20 22 20 32C20 38.627 25.373 44 32 44C38.627 44 44 38.627 44 32C44 22 32 12 32 12Z" fill="#8a5e28"/>
  <circle cx="32" cy="32" r="4" fill="#ffffff"/>
</svg>`;

export const topbar = `<header class="bl-top"><div class="bl-top-in">
  <a class="bl-brand" href="/">${LOGO_SVG}<span>${SITE}</span></a>
  <nav class="bl-nav"><a href="/blog/">Cẩm Nang</a><a href="/thu-vien">Từ Điển</a><a href="/xem-3d">Đồ Hình 3D</a><a class="bl-nav-cta" href="/app">Vào Phần Mềm</a></nav>
</div></header>`;

export const MUC_LUC = [
	["/huyet/", "Huyệt Vị"],
	["/kinh/", "Kinh Mạch"],
	["/benh-hoc/", "Bệnh Học"],
	["/cham-cuu-tri-benh/", "Châm Cứu Trị Bệnh"],
	["/bai-thuoc/muc-luc/", "Bài Thuốc A–Z"],
	["/duoc-lieu/muc-luc/", "Dược Liệu A–Z"],
	["/nguon/", "Nguồn Y Văn"],
	["/blog/", "Cẩm Nang"],
];
export const navMucLuc = `<nav aria-label="Mục lục từ điển">${MUC_LUC.map(([h, t]) => `<a href="${h}">${t}</a>`).join(" · ")}</nav>`;

export const footer = `<footer class="bl-foot"><div class="bl-foot-in">
  <p><strong>${SITE}</strong> — Đông Y nghìn năm, giờ đọc được bằng dữ liệu.</p>
  <p><a href="/">Trang Chủ</a> · <a href="/blog/">Cẩm Nang</a> · <a href="/huyet/">Tra Cứu Huyệt</a> · <a href="/kinh/">12 Đường Kinh</a> · <a href="/thu-vien">Từ Điển</a> · <a href="/xem-ket-qua-do">Demo Đo Kinh Lạc</a></p>
  <p>Từ điển: ${navMucLuc}</p>
  <p class="bl-foot-note">Nội dung mang tính tham khảo theo lý luận Đông Y, không thay thế chẩn đoán/điều trị của thầy thuốc.</p>
</div></footer>`;

// ───────────────────────── Portable Text → HTML ─────────────────────────

const THE_KHOI = { normal: "p", h1: "h2", h2: "h2", h3: "h3", h4: "h4", h5: "h4", h6: "h4" };
// Thứ tự bọc cố định (ngoài → trong) để HTML ra ổn định bất kể thứ tự marks trong dữ liệu.
const THE_DAU = [
	["strong", "strong"],
	["em", "em"],
	["strike-through", "s"],
	["code", "code"],
];

function spanSangHtml(children, markDefs) {
	if (!Array.isArray(children)) return "";
	const defs = new Map();
	for (const d of Array.isArray(markDefs) ? markDefs : []) {
		if (d && typeof d._key === "string") defs.set(d._key, d);
	}
	let out = "";
	for (const c of children) {
		if (!c || typeof c !== "object" || c._type !== "span" || typeof c.text !== "string" || c.text === "") continue;
		const marks = Array.isArray(c.marks) ? c.marks : [];
		let s = escText(c.text).replace(/\r?\n/g, "<br>");
		for (let i = THE_DAU.length - 1; i >= 0; i--) {
			const [dau, the] = THE_DAU[i];
			if (marks.includes(dau)) s = `<${the}>${s}</${the}>`;
		}
		for (const m of marks) {
			const d = defs.get(m);
			if (!d || d._type !== "link") continue;
			const href = hrefAnToan(d.href);
			if (href) s = `<a href="${escAttr(href)}">${s}</a>`;
			break; // một span chỉ mang một link
		}
		out += s;
	}
	return out;
}

function anhThanSangHtml(b) {
	const url = b?.asset?.url;
	if (typeof url !== "string") return "";
	if (!TIEN_TO_ANH_THAN.some((t) => url.startsWith(t))) return "";
	// Đường sạch: không "..", không khoảng trắng/nháy/ngoặc — thứ không có trong URL ảnh thật.
	if (url.includes("..") || !/^[A-Za-z0-9_\-./%~]+$/.test(url)) return "";
	const img = `<p><img src="${escAttr(url)}" alt="${escAttr(b.alt ?? "")}" loading="lazy"></p>`;
	const chuThich = typeof b.caption === "string" && b.caption.trim() ? `\n<p><em>${escText(b.caption)}</em></p>` : "";
	return img + chuThich;
}

/**
 * Portable Text → HTML với đúng bộ thẻ bản tĩnh dùng (h2/h3/h4/p/ul/ol/blockquote/a/strong/
 * em/code/s/img). Mọi chữ đều escape; loại khối không biết thì BỎ (kể cả khối html thô).
 */
export function portableTextSangHtml(blocks) {
	if (!Array.isArray(blocks)) return "";
	const out = [];
	let dem = ""; // danh sách đang mở
	const chong = []; // 'ul' | 'ol' theo cấp
	const dongToi = (n) => {
		while (chong.length > n) dem += `</li></${chong.pop()}>`;
		if (chong.length === 0 && dem) {
			out.push(dem);
			dem = "";
		}
	};

	for (const b of blocks) {
		if (!b || typeof b !== "object") continue;

		if (b._type === "block" && (b.listItem === "bullet" || b.listItem === "number")) {
			const noiDung = spanSangHtml(b.children, b.markDefs);
			if (!noiDung.trim()) continue;
			const the = b.listItem === "number" ? "ol" : "ul";
			let cap = Number.isInteger(b.level) && b.level >= 1 ? b.level : 1;
			cap = Math.min(cap, chong.length + 1, 6);
			while (chong.length > cap) dem += `</li></${chong.pop()}>`;
			if (chong.length === cap && chong[cap - 1] !== the) {
				dem += `</li></${chong.pop()}>`;
				if (chong.length === 0) {
					out.push(dem);
					dem = "";
				}
			}
			if (chong.length === cap) dem += "</li><li>";
			else {
				chong.push(the);
				dem += `<${the}><li>`;
			}
			dem += noiDung;
			continue;
		}

		dongToi(0);

		if (b._type === "block") {
			const noiDung = spanSangHtml(b.children, b.markDefs);
			if (!noiDung.trim()) continue;
			if (b.style === "blockquote") out.push(`<blockquote><p>${noiDung}</p></blockquote>`);
			else {
				const the = (typeof b.style === "string" && Object.hasOwn(THE_KHOI, b.style) && THE_KHOI[b.style]) || "p";
				out.push(`<${the}>${noiDung}</${the}>`);
			}
		} else if (b._type === "image") {
			const h = anhThanSangHtml(b);
			if (h) out.push(h);
		} else if (b._type === "code" && typeof b.code === "string" && b.code) {
			out.push(`<pre><code>${escText(b.code)}</code></pre>`);
		}
		// loại khác: bỏ
	}
	dongToi(0);
	return out.join("\n");
}

/** Chữ thuần của thân bài — dùng làm mô tả dự phòng khi bài để trống description. */
export function vanBanTran(blocks) {
	if (!Array.isArray(blocks)) return "";
	const doan = [];
	for (const b of blocks) {
		if (!b || b._type !== "block" || !Array.isArray(b.children)) continue;
		const t = b.children.map((c) => (c && typeof c.text === "string" ? c.text : "")).join("");
		if (t.trim()) doan.push(t.trim());
	}
	return doan.join(" ").replace(/\s+/g, " ").trim();
}

// ───────────────────────── Chuẩn hoá dữ liệu bai_viet ─────────────────────────

/** Trường json về dạng chuỗi hoặc mảng tuỳ đường ghi — chuẩn hoá một lần. */
export function mang(v) {
	if (Array.isArray(v)) return v;
	if (typeof v === "string" && v.trim()) {
		try {
			const x = JSON.parse(v);
			return Array.isArray(x) ? x : [];
		} catch {
			return [];
		}
	}
	return [];
}

/** Mốc thời gian (Date, ISO, hoặc dạng now() của Postgres) → 'YYYY-MM-DD'; không đọc được → ''. */
export function ngay(v) {
	if (!v) return "";
	if (v instanceof Date) return Number.isNaN(v.getTime()) ? "" : v.toISOString().slice(0, 10);
	const m = String(v).match(/^\d{4}-\d{2}-\d{2}/);
	return m ? m[0] : "";
}

/**
 * Đường dẫn ảnh bìa (tương đối) từ trường image của EmDash, hoặc undefined.
 * Nhận: object { meta: { storageKey } }, object { src }, chuỗi JSON của một trong hai.
 * KHÔNG dựng URL từ id: tệp trên đĩa đặt tên theo storageKey, /file/<id> trả 404 mà thẻ
 * <img> vẫn render. Chỉ có id (chuỗi trần hay object thiếu storageKey) → không có ảnh.
 */
export function urlAnhBia(img) {
	if (typeof img === "string") {
		const t = img.trim();
		if (!t.startsWith("{")) return undefined;
		try {
			img = JSON.parse(t);
		} catch {
			return undefined;
		}
	}
	if (!img || typeof img !== "object") return undefined;
	if (typeof img.src === "string" && img.src) {
		const s = hrefAnToan(img.src);
		return s && !s.toLowerCase().startsWith("mailto:") ? s : undefined;
	}
	const khoa = img.meta && typeof img.meta === "object" ? img.meta.storageKey : undefined;
	if (typeof khoa !== "string" || !khoa) return undefined;
	if (khoa.includes("..") || !/^[A-Za-z0-9_\-./]+$/.test(khoa) || khoa.startsWith("/")) return undefined;
	return TIEN_TO_MEDIA + khoa;
}

const chuoi = (v) => (typeof v === "string" ? v.trim() : "");

function catMoTa(s, toiDa = 160) {
	if (s.length <= toiDa) return s;
	const cat = s.slice(0, toiDa - 1);
	const i = cat.lastIndexOf(" ");
	return (i > 60 ? cat.slice(0, i) : cat).replace(/[\s,;:.–—-]+$/, "") + "…";
}

/**
 * Entry bai_viet của EmDash → dữ liệu khung (cùng tên khoá với frontmatter bản tĩnh:
 * slug, title, description, date, updated, author, reviewer, reviewerTitle, category,
 * cluster, cta, keywords, faq, sources, image, index) + bodyHtml + seo (ghi đè từ _emdash_seo).
 * `them`: { category, cluster } lấy từ taxonomy chuyen_muc / cum — trang tự tra rồi đưa vào.
 */
export function baiTuEntry(entry, them = {}) {
	const d = entry?.data ?? {};
	const seo = entry?.seo ?? d.seo ?? {};
	const date = ngay(d.ngay_dang) || ngay(d.publishedAt) || ngay(entry?.publishedAt);
	const tuKhoa = Array.isArray(d.tu_khoa) || (typeof d.tu_khoa === "string" && d.tu_khoa.trim().startsWith("["))
		? mang(d.tu_khoa)
		: chuoi(d.tu_khoa).split(",");
	return {
		slug: chuoi(entry?.slug) || chuoi(d.slug) || String(entry?.id ?? d.id ?? ""),
		title: chuoi(d.title),
		description: chuoi(d.description) || catMoTa(vanBanTran(d.content)),
		date,
		updated: ngay(d.ngay_cap_nhat) || date,
		author: chuoi(d.tac_gia),
		reviewer: chuoi(d.nguoi_duyet),
		reviewerTitle: chuoi(d.chuc_danh_nguoi_duyet),
		category: chuoi(them.category) || undefined,
		cluster: chuoi(them.cluster) || undefined,
		cta: chuoi(d.cta),
		keywords: tuKhoa.map((k) => chuoi(k)).filter(Boolean),
		faq: mang(d.faq).filter((f) => f && chuoi(f.q) && chuoi(f.a)).map((f) => ({ q: chuoi(f.q), a: chuoi(f.a) })),
		sources: mang(d.nguon_tham_khao).filter((s) => (typeof s === "string" ? s.trim() : s && (chuoi(s.title) || chuoi(s.url)))),
		image: urlAnhBia(d.featured_image),
		index: !seo.noIndex && d.cho_index !== false,
		bodyHtml: portableTextSangHtml(d.content),
		seo: {
			title: chuoi(seo.title),
			description: chuoi(seo.description),
			image: chuoi(seo.image),
			canonical: chuoi(seo.canonical),
		},
	};
}

/**
 * Dệt mạng nội bộ blog↔blog: cùng CỤM → cùng chuyên mục → còn lại, tối đa 4.
 * Chép nguyên từ build-blog.mjs.
 */
export function chonBaiLienQuan(a, all) {
	const pool = (Array.isArray(all) ? all : []).filter((x) => x.slug !== a.slug);
	const sameCluster = a.cluster ? pool.filter((x) => x.cluster === a.cluster) : [];
	const sameCat = pool.filter((x) => x.category === a.category && !sameCluster.includes(x));
	const others = pool.filter((x) => !sameCluster.includes(x) && !sameCat.includes(x));
	return [...sameCluster, ...sameCat, ...others].slice(0, 4);
}

// ───────────────────────── Trang ─────────────────────────

const DAI_XEM_TRUOC = `<div role="alert" style="background:#fff4d6;border-bottom:1px solid #e0c36a;color:#5b4300;padding:10px 16px;text-align:center;font-size:14px"><strong>Bản nháp — đang xem trước.</strong> Trang này chưa đăng, người đọc và Google không thấy được.</div>`;

/**
 * Trang một bài. `a` theo hình baiTuEntry trả về; `all` là các bài ĐÃ ĐĂNG (để chọn bài liên quan).
 * opt: { domain, gaId, xemTruoc }.
 */
export function trangBai(a, all = [], opt = {}) {
	const domain = gocCongKhai(opt.domain);
	const ogMacDinh = `${domain}/og-default.png`;
	const url = `${domain}/blog/${a.slug}/`;
	const seo = a.seo ?? {};
	const faq = Array.isArray(a.faq) ? a.faq : [];
	const faqHtml = faq.length
		? `<section class="bl-faq"><h2>Câu Hỏi Thường Gặp</h2>${faq
				.map((f) => `<details><summary>${escText(f.q)}</summary><p>${escText(f.a)}</p></details>`)
				.join("")}</section>`
		: "";

	const ctaPath = typeof a.cta === "string" && Object.hasOwn(CTA_LABELS, a.cta) ? a.cta : "/xem-ket-qua-do";
	const ctaLabel = CTA_LABELS[ctaPath];

	const related = chonBaiLienQuan(a, all);
	const relatedHtml = related.length
		? `<section class="bl-related"><h2>Bài Liên Quan</h2><ul>${related
				.map((r) => `<li><a href="/blog/${escAttr(r.slug)}/">${escText(r.title)}</a></li>`)
				.join("")}</ul></section>`
		: "";

	const author = a.author || DEFAULT_AUTHOR;
	// KHÔNG lùi về người duyệt mặc định: nhãn rà soát chỉ in khi bài khai người duyệt thật.
	const reviewer = a.reviewer || "";
	const reviewerTitle = reviewer ? a.reviewerTitle || "" : "";
	const updated = a.updated || a.date;
	const sources = Array.isArray(a.sources) ? a.sources : [];
	const cover = a.image ? toAbs(a.image, domain) : null;

	const bylineHtml = `<div class="bl-byline">
    <p class="bl-byline-line"><span class="bl-byline-by">${escText(author)}</span><span class="bl-byline-sep">·</span><span>Đăng ${escText(a.date || "")}</span>${
			updated && updated !== a.date ? `<span class="bl-byline-sep">·</span><span>Cập nhật ${escText(updated)}</span>` : ""
		}</p>${
			reviewer
				? `
    <p class="bl-byline-review"><span class="bl-review-badge">✔ Đã rà soát chuyên môn</span> ${escText(reviewer)}${reviewerTitle ? ` — ${escText(reviewerTitle)}` : ""}</p>`
				: ""
		}
  </div>`;

	const sourcesHtml = sources.length
		? `<section class="bl-sources"><h2>Nguồn Tham Khảo</h2><ul>${sources
				.map((s) => {
					if (typeof s === "string") return `<li>${escText(s)}</li>`;
					const label = escText(s.title || s.url || "");
					const href = hrefAnToan(s.url);
					return href && !/^mailto:/i.test(href)
						? `<li><a href="${escAttr(href)}" target="_blank" rel="noopener noreferrer">${label}</a></li>`
						: `<li>${label}</li>`;
				})
				.join("")}</ul></section>`
		: "";

	const jsonLds = [
		ld({
			"@context": "https://schema.org",
			"@type": "Article",
			headline: a.title,
			description: a.description,
			inLanguage: "vi",
			datePublished: a.date,
			dateModified: updated,
			author: { "@type": "Organization", name: author },
			...(reviewer
				? { reviewedBy: { "@type": "Person", name: reviewer, ...(reviewerTitle ? { jobTitle: reviewerTitle } : {}) } }
				: {}),
			publisher: { "@type": "Organization", name: SITE, logo: { "@type": "ImageObject", url: `${domain}/logo-512.png` } },
			mainEntityOfPage: { "@type": "WebPage", "@id": url },
			image: cover || ogMacDinh,
			keywords: (a.keywords || []).join(", "),
			...(sources.length
				? { citation: sources.map((s) => (typeof s === "string" ? s : s.title || s.url || "")) }
				: {}),
		}),
		ld({
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: "Trang Chủ", item: domain + "/" },
				{ "@type": "ListItem", position: 2, name: "Cẩm Nang", item: domain + "/blog/" },
				{ "@type": "ListItem", position: 3, name: a.title, item: url },
			],
		}),
	];
	if (faq.length)
		jsonLds.push(
			ld({
				"@context": "https://schema.org",
				"@type": "FAQPage",
				mainEntity: faq.map((f) => ({
					"@type": "Question",
					name: f.q,
					acceptedAnswer: { "@type": "Answer", text: f.a },
				})),
			}),
		);

	// Ghi đè từ _emdash_seo: ô nào trống thì GIỮ bản tự sinh (bổ sung, không thay thế).
	const tieuDe = seo.title ? (seo.title.includes(SITE) ? seo.title : `${seo.title} — ${SITE}`) : `${a.title} — ${SITE}`;
	const moTa = seo.description || a.description;
	const canonicalSeo = seo.canonical && /^(https?:\/\/|\/(?![/\\]))/i.test(seo.canonical) ? toAbs(seo.canonical, domain) : "";
	const anhSeo = seo.image && /^(https?:\/\/|\/(?![/\\]))/i.test(seo.image) ? toAbs(seo.image, domain) : "";

	return (
		head({
			title: tieuDe,
			description: moTa,
			canonical: canonicalSeo || url,
			jsonLds,
			index: a.index !== false && !opt.xemTruoc,
			ogImage: anhSeo || cover || ogMacDinh,
			domain,
			gaId: opt.gaId,
		}) +
		`<body>${topbar}${opt.xemTruoc ? "\n" + DAI_XEM_TRUOC : ""}
<main class="bl-main"><article class="bl-article">
  <nav class="bl-crumb"><a href="/">Trang Chủ</a> › <a href="/blog/">Cẩm Nang</a> › <span>${escText(a.category || "Bài Viết")}</span></nav>
  ${a.category ? `<p class="bl-cat">${escText(a.category)}</p>` : ""}
  <h1>${escText(a.title)}</h1>
  ${bylineHtml}
  ${a.image ? `<img class="bl-hero-img" src="${escAttr(a.image)}" alt="${escAttr(a.title)}" width="1200" height="630" loading="eager">` : ""}
  <div class="bl-body">${a.bodyHtml || ""}</div>
  ${faqHtml}
  <div class="bl-cta"><a href="${escAttr(ctaPath)}">${ctaLabel}</a></div>
  ${sourcesHtml}
  <aside class="bl-disclaimer" role="note">
    <p class="bl-disc-title">⚕️ Miễn Trừ Y Tế</p>
    <p>Bài viết chỉ mang tính <strong>tham khảo &amp; học tập</strong> theo lý luận Đông Y, không thay thế việc thăm khám, chẩn đoán hay điều trị của thầy thuốc/bác sỹ có chuyên môn. Khi có vấn đề sức khoẻ, hãy đến cơ sở y tế.</p>
    <p class="bl-disc-meta">Biên soạn với sự hỗ trợ của công cụ AI · ${
			reviewer ? `Rà soát chuyên môn: ${escText(reviewer)}${reviewerTitle ? ` (${escText(reviewerTitle)})` : ""} · ` : ""
		}Xem <a href="/quy-trinh-bien-tap">Quy Trình Biên Tập</a>.</p>
  </aside>
  ${relatedHtml}
</article></main>
${footer}</body></html>`
	);
}

/** Trang danh sách /blog/ — `all` là các bài ĐÃ ĐĂNG và được index, mới nhất trước. */
export function trangDanhSach(all = [], opt = {}) {
	const domain = gocCongKhai(opt.domain);
	const url = `${domain}/blog/`;
	const cards = all
		.map(
			(a) => `<a class="bl-card" href="/blog/${escAttr(a.slug)}/">
    ${a.image ? `<img class="bl-card-thumb" src="${escAttr(a.image)}" alt="" loading="lazy">` : ""}
    ${a.category ? `<span class="bl-card-cat">${escText(a.category)}</span>` : ""}
    <h2>${escText(a.title)}</h2>
    <p>${escText(a.description)}</p>
    <span class="bl-card-meta">${escText(a.date || "")}</span>
  </a>`,
		)
		.join("\n");

	const jsonLds = [
		ld({
			"@context": "https://schema.org",
			"@type": "Blog",
			name: `Cẩm Nang Đông Y — ${SITE}`,
			description: "Cẩm nang đo kinh lạc, huyệt vị, kinh lạc và bài thuốc Đông Y.",
			url,
			inLanguage: "vi",
			blogPost: all.map((a) => ({
				"@type": "BlogPosting",
				headline: a.title,
				url: `${domain}/blog/${a.slug}/`,
				datePublished: a.date,
			})),
		}),
	];

	return (
		head({
			title: `Cẩm Nang Đông Y: Đo Kinh Lạc, Huyệt Vị & Bài Thuốc — ${SITE}`,
			description:
				"Cẩm nang Đông Y: hướng dẫn đo nhiệt độ kinh lạc, tra cứu huyệt vị, 12 đường kinh và phân tích bài thuốc. Kiến thức chuẩn, dễ hiểu.",
			canonical: url,
			jsonLds,
			ogType: "website",
			domain,
			gaId: opt.gaId,
		}) +
		`<body>${topbar}
<main class="bl-main">
  <header class="bl-hero"><h1>Cẩm Nang Đông Y</h1><p>Hướng dẫn đo kinh lạc, tra cứu huyệt vị, kinh lạc và bài thuốc — viết để học và để hành nghề.</p></header>
  <div class="bl-grid">${cards}</div>
</main>
${footer}</body></html>`
	);
}

/** Thân trang 404 — cùng khung, noindex. Trang gọi phải tự đặt status 404. */
export function trang404(opt = {}) {
	const domain = gocCongKhai(opt.domain);
	return (
		head({
			title: `Không tìm thấy bài viết — ${SITE}`,
			description: "Bài viết này không tồn tại hoặc chưa được đăng.",
			canonical: `${domain}/blog/`,
			index: false,
			ogType: "website",
			domain,
			gaId: opt.gaId,
		}) +
		`<body>${topbar}
<main class="bl-main">
  <header class="bl-hero"><h1>Không tìm thấy bài viết</h1><p>Bài viết này không tồn tại hoặc chưa được đăng. Mời bạn xem danh sách bài trong <a href="/blog/">Cẩm Nang Đông Y</a>.</p></header>
</main>
${footer}</body></html>`
	);
}

const escXml = (s) => escAttr(s).replace(/'/g, "&apos;");

/**
 * sitemap của blog: /blog/ + mọi bài được index. `bai` theo hình baiTuEntry
 * (cần slug, index, updated|date). lastmod của /blog/ = bài mới sửa nhất.
 */
export function sitemapBlog(bai = [], opt = {}) {
	const domain = gocCongKhai(opt.domain);
	const duoc = bai.filter((a) => a && a.slug && a.index !== false);
	const dong = (loc, lm) => `  <url><loc>${escXml(loc)}</loc>${lm ? `<lastmod>${escXml(lm)}</lastmod>` : ""}</url>`;
	const moiNhat = duoc.map((a) => ngay(a.updated) || ngay(a.date)).filter(Boolean).sort().pop();
	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[dong(`${domain}/blog/`, moiNhat), ...duoc.map((a) => dong(`${domain}/blog/${a.slug}/`, ngay(a.updated) || ngay(a.date)))].join("\n")}
</urlset>
`;
}
