// seo-blog.renderer.ts — Render 1 bài blog TỪ DỮ LIỆU DB thành HTML hoàn chỉnh,
// để backend phục vụ trực tiếp /blog/<slug>/ khi CHƯA có bản tĩnh (build-blog).
//
// Vì sao: đăng bài trên server chỉ đánh dấu DB (không ghi .md) → trang tĩnh chưa có.
// nginx sẽ "thử file tĩnh trước, thiếu thì proxy sang backend" → bài "Đã đăng" XEM ĐƯỢC NGAY.
//
// PHẢI giữ ĐỒNG BỘ cấu trúc (class bl-*, JSON-LD, disclaimer) với frontend/scripts/build-blog.mjs
// để trang động và trang tĩnh nhìn như một, và chuẩn SEO (bot đọc 100% không cần JS).

const DOMAIN = 'https://kinhlac.online';
const SITE = 'Kinh Lạc Trương Gia';
const GA_ID = 'G-E71BLBZXFH';
const OG_IMAGE = `${DOMAIN}/og-default.png`;
const DEFAULT_AUTHOR = 'Ban Biên Tập Kinh Lạc';
const DEFAULT_REVIEWER = 'Trương Đình Trang';
const DEFAULT_REVIEWER_TITLE = 'Y Sỹ Y Học Cổ Truyền (đang theo học)';

export interface RenderArticle {
  slug: string;
  title: string;
  description?: string;
  bodyMarkdown: string;
  date?: string;
  updated?: string;
  author?: string;
  reviewer?: string;
  reviewerTitle?: string;
  category?: string;
  cta?: string;
  image?: string | null;
  keywords?: string[];
  faq?: { q: string; a: string }[];
  sources?: ({ title: string; url?: string } | string)[];
  index?: boolean;
}

const escText = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s: unknown) => escText(s).replace(/"/g, '&quot;');
const ld = (obj: unknown) =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const toAbs = (s: string) => (/^https?:/.test(s) ? s : DOMAIN + (s.startsWith('/') ? s : '/' + s));

const CTA_LABELS: Record<string, string> = {
  '/xem-ket-qua-do': 'Xem Demo Kết Quả Đo Kinh Lạc →',
  '/xem-3d': 'Khám Phá Đồ Hình Kinh Lạc 3D →',
  '/xem-bai-thuoc': 'Xem Phân Tích Bài Thuốc →',
  '/thu-vien': 'Tra Cứu Từ Điển Huyệt Vị →',
  '/app': 'Dùng Thử Phần Mềm →',
};

// ---- Markdown → HTML (gọn nhẹ, đủ cho bài AI: heading, đậm/nghiêng, link, danh sách, trích dẫn) ----
function inline(s: string): string {
  let t = escText(s);
  t = t.replace(/`([^`]+)`/g, (_m, c) => `<code>${c}</code>`);
  // Ảnh ![alt](url) — XỬ LÝ TRƯỚC link để không biến thành !<a>…
  t = t.replace(
    /!\[([^\]]*)\]\(([^)\s]+)\)/g,
    (_m, alt, url) => `<img src="${escAttr(url)}" alt="${escAttr(alt)}" loading="lazy">`,
  );
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text, url) => {
    const u = String(url);
    const ext = /^https?:/.test(u);
    return `<a href="${escAttr(u)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
  });
  return t;
}

function mdToHtml(md: string): string {
  const lines = String(md || '').replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  const isBlock = (l: string) => /^(#{1,4}\s|>\s?|[-*]\s+|\d+\.\s+)/.test(l);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const level = Math.min(h[1].length, 4);
      out.push(`<h${level}>${inline(h[2].trim())}</h${level}>`);
      i++;
      continue;
    }
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^[-*]\s+/, ''))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\d+\.\s+/, ''))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !isBlock(lines[i])) {
      buf.push(lines[i].trim());
      i++;
    }
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}

function head(o: {
  title: string;
  description?: string;
  canonical: string;
  jsonLds: string[];
  ogType?: string;
  index?: boolean;
  ogImage?: string;
}): string {
  const {
    title,
    description = '',
    canonical,
    jsonLds,
    ogType = 'article',
    index = true,
    ogImage = OG_IMAGE,
  } = o;
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#6b4423">
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');</script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="alternate icon" href="/favicon.ico">
  <title>${escText(title)}</title>
  <meta name="description" content="${escAttr(description)}">
  <meta name="robots" content="${index === false ? 'noindex, nofollow' : 'index, follow'}">
  <link rel="canonical" href="${escAttr(canonical)}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:site_name" content="${SITE}">
  <meta property="og:locale" content="vi_VN">
  <meta property="og:title" content="${escAttr(title)}">
  <meta property="og:description" content="${escAttr(description)}">
  <meta property="og:url" content="${escAttr(canonical)}">
  <meta property="og:image" content="${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escAttr(title)}">
  <meta name="twitter:description" content="${escAttr(description)}">
  <meta name="twitter:image" content="${ogImage}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/blog/blog.css">
  ${jsonLds.join('\n  ')}
</head>`;
}

const topbar = `<header class="bl-top"><div class="bl-top-in">
  <a class="bl-brand" href="/">🌿 ${SITE}</a>
  <nav class="bl-nav"><a href="/blog/">Cẩm Nang</a><a href="/thu-vien">Từ Điển</a><a href="/xem-3d">Đồ Hình 3D</a><a class="bl-nav-cta" href="/app">Vào Phần Mềm</a></nav>
</div></header>`;

const footer = `<footer class="bl-foot"><div class="bl-foot-in">
  <p><strong>${SITE}</strong> — Đông Y nghìn năm, giờ đọc được bằng dữ liệu.</p>
  <p><a href="/">Trang Chủ</a> · <a href="/blog/">Cẩm Nang</a> · <a href="/thu-vien">Từ Điển</a> · <a href="/xem-ket-qua-do">Demo Đo Kinh Lạc</a></p>
  <p class="bl-foot-note">Nội dung mang tính tham khảo theo lý luận Đông Y, không thay thế chẩn đoán/điều trị của thầy thuốc.</p>
</div></footer>`;

/** Render 1 bài thành trang HTML hoàn chỉnh (giống build-blog.mjs). `related` = vài bài khác để dệt link nội bộ. */
export function renderArticleHtml(a: RenderArticle, related: { slug: string; title: string }[] = []): string {
  const url = `${DOMAIN}/blog/${a.slug}/`;
  const bodyHtml = mdToHtml(a.bodyMarkdown || '');
  const faq = Array.isArray(a.faq) ? a.faq : [];
  const faqHtml = faq.length
    ? `<section class="bl-faq"><h2>Câu Hỏi Thường Gặp</h2>${faq
        .map((f) => `<details><summary>${escText(f.q)}</summary><p>${escText(f.a)}</p></details>`)
        .join('')}</section>`
    : '';

  const ctaPath = a.cta && CTA_LABELS[a.cta] ? a.cta : '/xem-ket-qua-do';
  const ctaLabel = CTA_LABELS[ctaPath];

  const relatedHtml = related.length
    ? `<section class="bl-related"><h2>Bài Liên Quan</h2><ul>${related
        .slice(0, 4)
        .map((r) => `<li><a href="/blog/${escAttr(r.slug)}/">${escText(r.title)}</a></li>`)
        .join('')}</ul></section>`
    : '';

  const author = a.author || DEFAULT_AUTHOR;
  const reviewer = a.reviewer || DEFAULT_REVIEWER;
  const reviewerTitle = a.reviewerTitle || DEFAULT_REVIEWER_TITLE;
  const updated = a.updated || a.date;
  const sources = Array.isArray(a.sources) ? a.sources : [];
  const cover = a.image ? toAbs(a.image) : null;

  const bylineHtml = `<div class="bl-byline">
    <p class="bl-byline-line"><span class="bl-byline-by">${escText(author)}</span><span class="bl-byline-sep">·</span><span>Đăng ${escText(a.date || '')}</span>${
      updated && updated !== a.date ? `<span class="bl-byline-sep">·</span><span>Cập nhật ${escText(updated)}</span>` : ''
    }</p>
    <p class="bl-byline-review"><span class="bl-review-badge">✔ Đã rà soát chuyên môn</span> ${escText(reviewer)} — ${escText(reviewerTitle)}</p>
  </div>`;

  const sourcesHtml = sources.length
    ? `<section class="bl-sources"><h2>Nguồn Tham Khảo</h2><ul>${sources
        .map((s) => {
          if (typeof s === 'string') return `<li>${escText(s)}</li>`;
          const label = escText(s.title || s.url || '');
          return s.url
            ? `<li><a href="${escAttr(s.url)}" target="_blank" rel="noopener noreferrer">${label}</a></li>`
            : `<li>${label}</li>`;
        })
        .join('')}</ul></section>`
    : '';

  const jsonLds = [
    ld({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: a.title,
      description: a.description,
      inLanguage: 'vi',
      datePublished: a.date,
      dateModified: updated,
      author: { '@type': 'Organization', name: author },
      reviewedBy: { '@type': 'Person', name: reviewer, jobTitle: reviewerTitle },
      publisher: {
        '@type': 'Organization',
        name: SITE,
        logo: { '@type': 'ImageObject', url: `${DOMAIN}/favicon.svg` },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      image: cover || OG_IMAGE,
      keywords: (a.keywords || []).join(', '),
      ...(sources.length
        ? { citation: sources.map((s) => (typeof s === 'string' ? s : s.title || s.url || '')) }
        : {}),
    }),
    ld({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang Chủ', item: DOMAIN + '/' },
        { '@type': 'ListItem', position: 2, name: 'Cẩm Nang', item: DOMAIN + '/blog/' },
        { '@type': 'ListItem', position: 3, name: a.title, item: url },
      ],
    }),
  ];
  if (faq.length)
    jsonLds.push(
      ld({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }),
    );

  return (
    '<!-- rendered:backend-dynamic -->\n' +
    head({
      title: `${a.title} — ${SITE}`,
      description: a.description,
      canonical: url,
      jsonLds,
      index: a.index !== false,
      ogImage: cover || OG_IMAGE,
    }) +
    `<body>${topbar}
<main class="bl-main"><article class="bl-article">
  <nav class="bl-crumb"><a href="/">Trang Chủ</a> › <a href="/blog/">Cẩm Nang</a> › <span>${escText(a.category || 'Bài Viết')}</span></nav>
  ${a.category ? `<p class="bl-cat">${escText(a.category)}</p>` : ''}
  <h1>${escText(a.title)}</h1>
  ${bylineHtml}
  ${a.image ? `<img class="bl-hero-img" src="${escAttr(a.image)}" alt="${escAttr(a.title)}" width="1200" height="630" loading="eager">` : ''}
  <div class="bl-body">${bodyHtml}</div>
  ${faqHtml}
  <div class="bl-cta"><a href="${escAttr(ctaPath)}">${ctaLabel}</a></div>
  ${sourcesHtml}
  <aside class="bl-disclaimer" role="note">
    <p class="bl-disc-title">⚕️ Miễn Trừ Y Tế</p>
    <p>Bài viết chỉ mang tính <strong>tham khảo &amp; học tập</strong> theo lý luận Đông Y, không thay thế việc thăm khám, chẩn đoán hay điều trị của thầy thuốc/bác sỹ có chuyên môn. Khi có vấn đề sức khoẻ, hãy đến cơ sở y tế.</p>
    <p class="bl-disc-meta">Biên soạn với sự hỗ trợ của công cụ AI · Rà soát chuyên môn: ${escText(reviewer)} (${escText(reviewerTitle)}) · Xem <a href="/quy-trinh-bien-tap">Quy Trình Biên Tập</a>.</p>
  </aside>
  ${relatedHtml}
</article></main>
${footer}</body></html>`
  );
}

/** Trang 404 tối giản (vẫn có style blog) khi không tìm thấy bài đã đăng. */
export function renderNotFoundHtml(slug: string): string {
  return (
    head({
      title: `Không tìm thấy bài viết — ${SITE}`,
      description: 'Bài viết không tồn tại hoặc chưa được đăng.',
      canonical: `${DOMAIN}/blog/`,
      jsonLds: [],
      index: false,
    }) +
    `<body>${topbar}
<main class="bl-main"><article class="bl-article">
  <h1>Không tìm thấy bài viết</h1>
  <p>Bài “${escText(slug)}” không tồn tại hoặc chưa được đăng. Mời bạn quay lại <a href="/blog/">Cẩm Nang</a>.</p>
</article></main>
${footer}</body></html>`
  );
}
