// seo-html.mjs — Khung HTML/SEO DÙNG CHUNG cho các dây chuyền sinh trang tĩnh.
//
// Vì sao tách riêng: blog (build-blog.mjs) và từ điển (build-dict.mjs) cần CÙNG bộ
// <head> meta/OG, header, footer, khối miễn trừ y tế… → gom 1 chỗ để đổi domain/giao
// diện MỘT nơi duy nhất, không lệch canonical/ảnh chia sẻ giữa hai pipeline.
//
// Đầu ra trùng khít build-blog.mjs hiện tại (cùng <head>, cùng /blog/blog.css) nên về
// sau có thể refactor build-blog import thẳng từ đây mà KHÔNG đổi HTML xuất ra.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

// Domain/site/OG đọc CHUNG từ src/seo/route-seo.json (giống build-blog/indexnow/sitemap).
const seoCfg = JSON.parse(readFileSync(resolve(root, 'src/seo/route-seo.json'), 'utf8'))
export const DOMAIN = String(seoCfg.domain || 'https://kinhlac.online').replace(/\/+$/, '')
export const SITE = seoCfg.siteName || 'Kinh Lạc Trương Gia'
export const OG_IMAGE = seoCfg.ogImage || `${DOMAIN}/og-default.png`
export const GA_ID = process.env.GA_ID || 'G-E71BLBZXFH'
export const DEFAULT_AUTHOR = 'Ban Biên Tập Kinh Lạc'
// Người duyệt chuyên môn mặc định (E-E-A-T).
export const DEFAULT_REVIEWER = 'Trương Đình Trang'
export const DEFAULT_REVIEWER_TITLE = 'Y Sỹ Y Học Cổ Truyền (đang theo học)'

export const escText = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export const escAttr = (s) => escText(s).replace(/"/g, '&quot;')
export const ld = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`
// Ảnh -> URL tuyệt đối cho og:image (social cần URL đầy đủ).
export const toAbs = (s) => (/^https?:/.test(s) ? s : DOMAIN + (String(s).startsWith('/') ? s : '/' + s))

// Nhãn nút CTA về tính năng phần mềm (dùng chung blog + từ điển).
export const CTA_LABELS = {
  '/xem-ket-qua-do': 'Xem Demo Kết Quả Đo Kinh Lạc →',
  '/xem-3d': 'Khám Phá Đồ Hình Kinh Lạc 3D →',
  '/xem-bai-thuoc': 'Xem Phân Tích Bài Thuốc →',
  '/thu-vien': 'Tra Cứu Từ Điển Huyệt Vị →',
  '/app': 'Dùng Thử Phần Mềm →',
}

/**
 * <head> chuẩn SEO (title, description, robots, canonical, OG/Twitter, fonts, blog.css).
 * extraHead: chèn thêm trước </head> (vd <style> riêng của từ điển) — bỏ trống thì xuất
 * y hệt build-blog.mjs để giữ tương thích.
 */
export function head({
  title,
  description,
  canonical,
  jsonLds = [],
  ogType = 'article',
  index = true,
  ogImage = OG_IMAGE,
  extraHead = '',
}) {
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
  <meta property="og:image" content="${escAttr(ogImage)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escAttr(title)}">
  <meta name="twitter:description" content="${escAttr(description)}">
  <meta name="twitter:image" content="${escAttr(ogImage)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/blog/blog.css">
  ${jsonLds.join('\n  ')}${extraHead ? '\n  ' + extraHead : ''}
</head>`
}

// Thanh đầu trang — link sang các khu công khai (giống build-blog).
export const topbar = `<header class="bl-top"><div class="bl-top-in">
  <a class="bl-brand" href="/">🌿 ${SITE}</a>
  <nav class="bl-nav"><a href="/blog/">Cẩm Nang</a><a href="/thu-vien">Từ Điển</a><a href="/xem-3d">Đồ Hình 3D</a><a class="bl-nav-cta" href="/app">Vào Phần Mềm</a></nav>
</div></header>`

export const footer = `<footer class="bl-foot"><div class="bl-foot-in">
  <p><strong>${SITE}</strong> — Đông Y nghìn năm, giờ đọc được bằng dữ liệu.</p>
  <p><a href="/">Trang Chủ</a> · <a href="/blog/">Cẩm Nang</a> · <a href="/huyet/">Tra Cứu Huyệt</a> · <a href="/kinh/">12 Đường Kinh</a> · <a href="/thu-vien">Từ Điển</a> · <a href="/xem-ket-qua-do">Demo Đo Kinh Lạc</a></p>
  <p class="bl-foot-note">Nội dung mang tính tham khảo theo lý luận Đông Y, không thay thế chẩn đoán/điều trị của thầy thuốc.</p>
</div></footer>`

/**
 * Khối miễn trừ y tế (YMYL/E-E-A-T) — dùng chung blog + từ điển.
 * note: câu mở bài đầu (vd "Bài viết" cho blog, "Trang tra cứu này" cho từ điển).
 */
export function disclaimer({
  reviewer = DEFAULT_REVIEWER,
  reviewerTitle = DEFAULT_REVIEWER_TITLE,
  note = 'Nội dung',
} = {}) {
  return `<aside class="bl-disclaimer" role="note">
    <p class="bl-disc-title">⚕️ Miễn Trừ Y Tế</p>
    <p>${escText(note)} được trích dẫn trung thành theo <strong>y văn cổ truyền</strong>, chỉ mang tính <strong>tham khảo &amp; học tập</strong>, không thay thế việc thăm khám, chẩn đoán hay điều trị của thầy thuốc/bác sỹ có chuyên môn. Khi có vấn đề sức khoẻ, hãy đến cơ sở y tế.</p>
    <p class="bl-disc-meta">Rà soát chuyên môn: ${escText(reviewer)} (${escText(reviewerTitle)}) · Xem <a href="/quy-trinh-bien-tap">Quy Trình Biên Tập</a>.</p>
  </aside>`
}
