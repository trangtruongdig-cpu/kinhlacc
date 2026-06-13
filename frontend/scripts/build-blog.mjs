// build-blog.mjs — Sinh blog tĩnh (Markdown -> HTML) vào dist/blog/.
//
// Vì sao tĩnh: bot Google/Facebook/Zalo đọc 100% không cần JS, tải nhanh, chuẩn SEO nhất.
// Chạy SAU `vite build` (cần dist/ tồn tại). Cho ghi đè thư mục ra qua DIST_DIR để test.
//
// Mỗi bài -> dist/blog/<slug>/index.html (đủ meta + Open Graph + JSON-LD Article/Breadcrumb/FAQ).
// Trang danh sách -> dist/blog/index.html.
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { marked } from 'marked'
import { readArticles } from './blog-lib.mjs'
// Khung <head>/header/footer/escape/JSON-LD/CTA dùng CHUNG với build-dict (gỡ "2 nguồn sự thật").
import {
  DOMAIN, SITE, OG_IMAGE, DEFAULT_AUTHOR, DEFAULT_REVIEWER, DEFAULT_REVIEWER_TITLE,
  escText, escAttr, ld, toAbs, CTA_LABELS, head, topbar, footer,
} from './seo-html.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const distDir = process.env.DIST_DIR ? resolve(process.env.DIST_DIR) : resolve(root, 'dist')
const blogOut = join(distDir, 'blog')

function articlePage(a, all) {
  const url = `${DOMAIN}/blog/${a.slug}/`
  const bodyHtml = marked.parse(a.bodyMarkdown || '')
  const faq = Array.isArray(a.faq) ? a.faq : []
  const faqHtml = faq.length
    ? `<section class="bl-faq"><h2>Câu Hỏi Thường Gặp</h2>${faq
        .map((f) => `<details><summary>${escText(f.q)}</summary><p>${escText(f.a)}</p></details>`)
        .join('')}</section>`
    : ''

  const ctaPath = a.cta && CTA_LABELS[a.cta] ? a.cta : '/xem-ket-qua-do'
  const ctaLabel = CTA_LABELS[ctaPath]

  // Dệt mạng nội bộ blog↔blog: ưu tiên cùng CỤM (cluster) → cùng chuyên mục → còn lại.
  // Nhóm theo cụm tạo liên kết 2 chiều tự nhiên (các bài cùng cụm trỏ qua lại nhau) → tăng topical authority.
  const pool = all.filter((x) => x.slug !== a.slug)
  const sameCluster = a.cluster ? pool.filter((x) => x.cluster === a.cluster) : []
  const sameCat = pool.filter((x) => x.category === a.category && !sameCluster.includes(x))
  const others = pool.filter((x) => !sameCluster.includes(x) && !sameCat.includes(x))
  const related = [...sameCluster, ...sameCat, ...others].slice(0, 4)
  const relatedHtml = related.length
    ? `<section class="bl-related"><h2>Bài Liên Quan</h2><ul>${related
        .map((r) => `<li><a href="/blog/${escAttr(r.slug)}/">${escText(r.title)}</a></li>`)
        .join('')}</ul></section>`
    : ''

  const author = a.author || DEFAULT_AUTHOR
  const reviewer = a.reviewer || DEFAULT_REVIEWER
  const reviewerTitle = a.reviewerTitle || DEFAULT_REVIEWER_TITLE
  const updated = a.updated || a.date
  const sources = Array.isArray(a.sources) ? a.sources : []
  const cover = a.image ? toAbs(a.image) : null

  // Khối tác giả / người duyệt + ngày (E-E-A-T) hiển thị dưới tiêu đề.
  const bylineHtml = `<div class="bl-byline">
    <p class="bl-byline-line"><span class="bl-byline-by">${escText(author)}</span><span class="bl-byline-sep">·</span><span>Đăng ${escText(a.date || '')}</span>${
      updated && updated !== a.date ? `<span class="bl-byline-sep">·</span><span>Cập nhật ${escText(updated)}</span>` : ''
    }</p>
    <p class="bl-byline-review"><span class="bl-review-badge">✔ Đã rà soát chuyên môn</span> ${escText(reviewer)} — ${escText(reviewerTitle)}</p>
  </div>`

  // Mục "Nguồn Tham Khảo" — chỉ hiện khi bài có field sources (KHÔNG bịa nguồn).
  const sourcesHtml = sources.length
    ? `<section class="bl-sources"><h2>Nguồn Tham Khảo</h2><ul>${sources
        .map((s) => {
          if (typeof s === 'string') return `<li>${escText(s)}</li>`
          const label = escText(s.title || s.url || '')
          return s.url
            ? `<li><a href="${escAttr(s.url)}" target="_blank" rel="noopener noreferrer">${label}</a></li>`
            : `<li>${label}</li>`
        })
        .join('')}</ul></section>`
    : ''

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
      publisher: { '@type': 'Organization', name: SITE, logo: { '@type': 'ImageObject', url: `${DOMAIN}/favicon.svg` } },
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
  ]
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
    )

  return (
    head({ title: `${a.title} — ${SITE}`, description: a.description, canonical: url, jsonLds, index: a.index !== false, ogImage: cover || OG_IMAGE }) +
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
  )
}

function indexPage(all) {
  const url = `${DOMAIN}/blog/`
  const cards = all
    .map(
      (a) => `<a class="bl-card" href="/blog/${escAttr(a.slug)}/">
    ${a.image ? `<img class="bl-card-thumb" src="${escAttr(a.image)}" alt="" loading="lazy">` : ''}
    ${a.category ? `<span class="bl-card-cat">${escText(a.category)}</span>` : ''}
    <h2>${escText(a.title)}</h2>
    <p>${escText(a.description)}</p>
    <span class="bl-card-meta">${escText(a.date || '')}</span>
  </a>`,
    )
    .join('\n')

  const jsonLds = [
    ld({
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: `Cẩm Nang Đông Y — ${SITE}`,
      description: 'Cẩm nang đo kinh lạc, huyệt vị, kinh lạc và bài thuốc Đông Y.',
      url,
      inLanguage: 'vi',
      blogPost: all.map((a) => ({
        '@type': 'BlogPosting',
        headline: a.title,
        url: `${DOMAIN}/blog/${a.slug}/`,
        datePublished: a.date,
      })),
    }),
  ]

  return (
    head({
      title: `Cẩm Nang Đông Y: Đo Kinh Lạc, Huyệt Vị & Bài Thuốc — ${SITE}`,
      description:
        'Cẩm nang Đông Y: hướng dẫn đo nhiệt độ kinh lạc, tra cứu huyệt vị, 12 đường kinh và phân tích bài thuốc. Kiến thức chuẩn, dễ hiểu.',
      canonical: url,
      jsonLds,
      ogType: 'website',
    }) +
    `<body>${topbar}
<main class="bl-main">
  <header class="bl-hero"><h1>Cẩm Nang Đông Y</h1><p>Hướng dẫn đo kinh lạc, tra cứu huyệt vị, kinh lạc và bài thuốc — viết để học và để hành nghề.</p></header>
  <div class="bl-grid">${cards}</div>
</main>
${footer}</body></html>`
  )
}

const all = readArticles()
if (!all.length) {
  console.log('… chưa có bài blog nào trong content/blog — bỏ qua build-blog.')
  process.exit(0)
}
// index:false = bản nháp/chờ duyệt → vẫn sinh trang (để duyệt) nhưng noindex + không vào index/sitemap.
const published = all.filter((a) => a.index !== false)
mkdirSync(blogOut, { recursive: true })
writeFileSync(join(blogOut, 'index.html'), indexPage(published), 'utf8')
let n = 0
for (const a of all) {
  const dir = join(blogOut, a.slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), articlePage(a, published), 'utf8')
  n++
}
const drafts = all.length - published.length
console.log(`✓ build-blog: ${n} trang (${published.length} hiển thị${drafts ? ` + ${drafts} noindex` : ''}) + index /blog/`)
