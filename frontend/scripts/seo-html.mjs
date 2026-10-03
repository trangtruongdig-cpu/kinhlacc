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

// Ráp <title> cho vừa ô kết quả tìm kiếm. Google cắt tiêu đề ở ~60 ký tự; đo ngày
// 29/09/2026 thấy 18.400/18.500 trang vượt mức đó vì mọi bộ sinh đều ghép cứng
// "tên + đuôi mô tả + — Kinh Lạc Trương Gia", còn bài thuốc nhét cả tên sách (94–110 ký tự).
// Thứ tự ưu tiên: TÊN (từ khoá chính) > đuôi mô tả > tên thương hiệu. `duoi` là các
// phương án đuôi, dài nhất trước, đã kèm dấu nối (vd ': Vị Trí & Tác Dụng'). Không phương
// án nào vừa thì trả về tên trần — thà dài còn hơn cắt cụt tên riêng.
export const TIEU_DE_TOI_DA = 60
export function tieuDeSeo(ten, ...duoi) {
  for (const d of [...duoi, '']) {
    const goc = `${ten}${d}`
    if (`${goc} — ${SITE}`.length <= TIEU_DE_TOI_DA) return `${goc} — ${SITE}`
    if (goc.length <= TIEU_DE_TOI_DA) return goc
  }
  return String(ten)
}

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
  <!-- ?v=2 — xem ghi chú ở frontend/index.html: Chrome giữ favicon cũ trong kho riêng,
       đổi URL mới đẩy được bản mới tới khách đã ghé trước đây. -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2">
  <link rel="alternate icon" href="/favicon.ico?v=2">
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

// Dấu hiệu thương hiệu — CHÍNH LÀ logo ở public/favicon.svg và ở ba component Vue
// (PublicTopBar / LandingView / SiteFooter). Trước đây chỗ này dùng emoji 🌿 nên trang
// tĩnh (/huyet/, /blog/, /nguon/…) đội logo KHÁC hẳn phần SPA. Màu viết cứng theo
// --brown-300 / --brown-600 của main.css vì blog.css là biểu khác, không dùng chung biến.
export const LOGO_SVG = `<svg class="bl-brand-mark" width="26" height="26" viewBox="0 0 64 64" fill="none" aria-hidden="true">
  <circle cx="32" cy="32" r="30" stroke="#cfad78" stroke-width="2"/>
  <path d="M32 12C32 12 20 22 20 32C20 38.627 25.373 44 32 44C38.627 44 44 38.627 44 32C44 22 32 12 32 12Z" fill="#8a5e28"/>
  <circle cx="32" cy="32" r="4" fill="#ffffff"/>
</svg>`

// Thanh đầu trang — link sang các khu công khai (giống build-blog).
export const topbar = `<header class="bl-top"><div class="bl-top-in">
  <a class="bl-brand" href="/">${LOGO_SVG}<span>${SITE}</span></a>
  <nav class="bl-nav"><a href="/blog/">Cẩm Nang</a><a href="/thu-vien">Từ Điển</a><a href="/xem-3d">Đồ Hình 3D</a><a class="bl-nav-cta" href="/app">Vào Phần Mềm</a></nav>
</div></header>`

// Các trang MỤC LỤC của kho từ điển. Có mặt ở chân MỌI trang tĩnh và trong khối tĩnh của
// trang chủ + /thu-vien/ (prerender-seo.mjs). Vì sao: đo 30/09/2026, theo HTML tĩnh trang chủ
// không dẫn tới trang từ điển nào, và khi đã chạy JS thì 3.853 bài thuốc vẫn nằm ở độ sâu 6
// — trang có trong sitemap mà không ai trỏ tới thường chỉ được "phát hiện", không được index.
export const MUC_LUC = [
  ['/huyet/', 'Huyệt Vị'],
  ['/kinh/', 'Kinh Mạch'],
  ['/benh-hoc/', 'Bệnh Học'],
  ['/cham-cuu-tri-benh/', 'Châm Cứu Trị Bệnh'],
  ['/bai-thuoc/muc-luc/', 'Bài Thuốc A–Z'],
  ['/duoc-lieu/muc-luc/', 'Dược Liệu A–Z'],
  ['/nguon/', 'Nguồn Y Văn'],
  ['/blog/', 'Cẩm Nang'],
]
/**
 * Khối "Tóm tắt trang này bằng AI" — ba nút mở thẳng ChatGPT / Claude / Google AI Mode với lời
 * nhắc đã điền sẵn và URL của chính trang.
 *
 * VÌ SAO CÓ: người đọc nay hỏi trợ lý AI thay vì đọc hết trang, và trợ lý chỉ lấy được nội dung
 * nào nó TÌM RA. Nút này là đường ngắn nhất từ trang của mình vào ngữ cảnh của AI — người dùng
 * bấm, AI tải đúng URL này, và phần trả lời dẫn lại nguồn.
 *
 * ⚠️ CHỈ LÀ LIÊN KẾT, không chạy JS, không gọi API, không gửi gì đi. Trang từ điển là HTML tĩnh
 * và phải giữ nguyên như vậy.
 * ⚠️ `rel="nofollow noopener"`: đây là link ra ngoài do người dùng bấm, không phải link biên
 * tập — để nó truyền tín hiệu xếp hạng sang ba tên miền đó là không có lý do gì.
 */
export const khoiHoiAi = (duong, tieuDe) => {
  const url = toAbs(duong)
  const nhac = `Tóm tắt nội dung trang này và cho biết nó trả lời được câu hỏi gì: ${url}`
  const q = encodeURIComponent(nhac)
  const nut = [
    ['Hỏi ChatGPT', `https://chatgpt.com/?q=${q}`],
    ['Hỏi Claude', `https://claude.ai/new?q=${q}`],
    ['Google AI Mode', `https://www.google.com/search?udm=50&q=${q}`],
  ]
  return (
    `<aside class="dl-ai" aria-label="Tóm tắt bằng AI">` +
    `<b>Tóm tắt trang này bằng AI</b>` +
    `<div class="dl-ai-nut">${nut
      .map(([t, h]) => `<a href="${escAttr(h)}" target="_blank" rel="nofollow noopener">${escText(t)}</a>`)
      .join('')}</div>` +
    `<span class="dl-ai-ghi">Mở trợ lý AI kèm đường dẫn trang${tieuDe ? ` “${escText(tieuDe)}”` : ''} để hỏi tiếp.</span>` +
    `</aside>`
  )
}

/** CSS của khối trên — nhúng cùng chỗ với CSS trang tĩnh, không thêm tệp rời. */
export const cssHoiAi = `
  .dl-ai{margin:1rem 0;padding:.7rem .9rem;border:1px solid #e3d6c2;border-radius:10px;background:#faf6ef}
  .dl-ai>b{display:block;font-size:.95rem;color:#5a4427;margin-bottom:.45rem}
  .dl-ai-nut{display:flex;flex-wrap:wrap;gap:.45rem}
  .dl-ai-nut a{display:inline-block;padding:.35rem .7rem;border:1px solid #d9c9ad;border-radius:999px;background:#fff;color:#6b4423;text-decoration:none;font-size:.88rem}
  .dl-ai-nut a:hover{background:#f3e9d9}
  .dl-ai-ghi{display:block;margin-top:.4rem;font-size:.8rem;color:#8a7a63}
`

export const navMucLuc = `<nav aria-label="Mục lục từ điển">${MUC_LUC.map(([h, t]) => `<a href="${h}">${t}</a>`).join(' · ')}</nav>`

export const footer = `<footer class="bl-foot"><div class="bl-foot-in">
  <p><strong>${SITE}</strong> — Đông Y nghìn năm, giờ đọc được bằng dữ liệu.</p>
  <p><a href="/">Trang Chủ</a> · <a href="/blog/">Cẩm Nang</a> · <a href="/huyet/">Tra Cứu Huyệt</a> · <a href="/kinh/">12 Đường Kinh</a> · <a href="/thu-vien">Từ Điển</a> · <a href="/xem-ket-qua-do">Demo Đo Kinh Lạc</a></p>
  <p>Từ điển: ${navMucLuc}</p>
  <p class="bl-foot-note">Nội dung mang tính tham khảo theo lý luận Đông Y, không thay thế chẩn đoán/điều trị của thầy thuốc.</p>
</div></footer>`

/**
 * Dòng tác giả của trang TỪ ĐIỂN. Trước 30/09/2026 mọi trang huyệt/kinh/bệnh/nguồn in
 * "✔ Đã rà soát chuyên môn" + tên người duyệt — ~1.300 trang, không có dấu vết duyệt từng
 * trang. Với nội dung y tế (YMYL), tuyên bố rà soát không kiểm chứng được là điểm yếu E-E-A-T,
 * nên kho từ điển chỉ ghi điều có thật. Blog GIỮ nhãn: mỗi bài qua cổng duyệt của blog:pre
 * và khai người duyệt riêng (reviewedBy trong JSON-LD).
 */
export const bylineTuDien = (ngay) =>
  `<p class="dl-byline">Biên soạn: ${escText(DEFAULT_AUTHOR)} · Theo y văn cổ truyền · Cập nhật ${escText(ngay)}</p>`

/**
 * Khối miễn trừ y tế (YMYL/E-E-A-T) — dùng chung blog + từ điển.
 * note: câu mở bài đầu (vd "Bài viết" cho blog, "Trang tra cứu này" cho từ điển).
 */
export function disclaimer({
  // null = trang CHƯA có người duyệt từng trang (mặc định cho kho từ điển) — xem bylineTuDien.
  reviewer = null,
  reviewerTitle = DEFAULT_REVIEWER_TITLE,
  note = 'Nội dung',
} = {}) {
  return `<aside class="bl-disclaimer" role="note">
    <p class="bl-disc-title">⚕️ Miễn Trừ Y Tế</p>
    <p>${escText(note)} được trích dẫn trung thành theo <strong>y văn cổ truyền</strong>, chỉ mang tính <strong>tham khảo &amp; học tập</strong>, không thay thế việc thăm khám, chẩn đoán hay điều trị của thầy thuốc/bác sỹ có chuyên môn. Khi có vấn đề sức khoẻ, hãy đến cơ sở y tế.</p>
    <p class="bl-disc-meta">${reviewer
      ? `Rà soát chuyên môn: ${escText(reviewer)} (${escText(reviewerTitle)})`
      : `Biên soạn: ${escText(DEFAULT_AUTHOR)}, trích theo y văn cổ truyền`} · Xem <a href="/quy-trinh-bien-tap">Quy Trình Biên Tập</a>.</p>
  </aside>`
}
