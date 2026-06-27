// prerender-seo.mjs — "Mini-prerender" chạy bằng Node thuần (KHÔNG cần trình duyệt ảo).
//
// Sau khi `vite build` xong, với MỖI trang công khai trong route-seo.json, script tạo file
// dist/<đường-dẫn>/index.html chứa sẵn <title>, meta description, Open Graph, canonical, JSON-LD
// ĐÚNG TRANG ĐÓ + một khối chữ tĩnh (H1 + mô tả + link) làm "đáy" cho bot/không-JS đọc.
//
// Vì sao cách này: app là SPA + deploy trên VPS Alpine RAM thấp → KHÔNG dùng headless Chrome
// (dễ vỡ build) và KHÔNG refactor main.ts/router/auth (dễ vỡ login). Cách này chạy thuần Node,
// không đụng mã chạy của app, mà vẫn cho Google/Facebook/Zalo metadata đúng từng trang.
//
// Vue khi mount sẽ tự xoá nội dung trong #app → người dùng KHÔNG thấy khối chữ tĩnh; chỉ bot thấy.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
// Mặc định ghi vào dist/. Cho ghi đè qua DIST_DIR để test trên thư mục tạm.
const distDir = process.env.DIST_DIR ? resolve(process.env.DIST_DIR) : resolve(root, 'dist')
const seo = JSON.parse(readFileSync(resolve(root, 'src/seo/route-seo.json'), 'utf8'))

const indexPath = resolve(distDir, 'index.html')
if (!existsSync(indexPath)) {
  console.error('✗ Chưa có dist/index.html — hãy chạy `vite build` (npm run build-only) trước.')
  process.exit(1)
}
const baseHtml = readFileSync(indexPath, 'utf8')

const escAttr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Chuẩn hoá path sang dạng CÓ dấu "/" cuối (trừ trang chủ). Phải KHỚP canonical Google đã chọn +
// redirect "thêm /" của host (nginx try_files / Vercel) — nếu lệch, Google báo "Page with redirect"
// và KHÔNG index trang. Áp cho canonical, og:url và link điều hướng trong khối stub.
const slashify = (p) => (p === '/' ? '/' : '/' + p.replace(/^\/+|\/+$/g, '') + '/')

function setTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escText(title)}</title>`)
}

function setMeta(html, attr, key, content) {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"[^>]*\\scontent=")[^"]*(")`, 'i')
  if (re.test(html)) return html.replace(re, `$1${escAttr(content)}$2`)
  return html.replace(/<\/head>/i, `    <meta ${attr}="${key}" content="${escAttr(content)}">\n  </head>`)
}

function setCanonical(html, href) {
  const re = /(<link\s+rel="canonical"[^>]*\shref=")[^"]*(")/i
  if (re.test(html)) return html.replace(re, `$1${escAttr(href)}$2`)
  return html.replace(/<\/head>/i, `    <link rel="canonical" href="${escAttr(href)}">\n  </head>`)
}

function setJsonLd(html, obj) {
  // <  ->  < để không bao giờ vô tình đóng thẻ </script>
  const json = JSON.stringify(obj).replace(/</g, '\\u003c')
  const cleaned = html.replace(/\s*<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/i, '')
  return cleaned.replace(
    /<\/head>/i,
    `    <script type="application/ld+json" id="seo-jsonld">${json}</script>\n  </head>`,
  )
}

function injectStub(html, page) {
  const links = seo.pages
    .filter((p) => p.path !== page.path)
    .map((p) => `<a href="${escAttr(slashify(p.path))}">${escText(p.title)}</a>`)
    .join(' · ')
  const stub =
    `<div data-seo-stub>` +
    `<h1>${escText(page.title)}</h1>` +
    `<p>${escText(page.description)}</p>` +
    `<nav aria-label="Trang công khai">${links}</nav>` +
    `<p>Đang tải ứng dụng…</p>` +
    `</div>`
  return html.replace(/<div id="app">\s*<\/div>/i, `<div id="app">${stub}</div>`)
}

let count = 0
for (const page of seo.pages) {
  const url = seo.domain + slashify(page.path)
  let html = baseHtml
  html = setTitle(html, page.title)
  html = setMeta(html, 'name', 'description', page.description)
  if (page.keywords?.length) html = setMeta(html, 'name', 'keywords', page.keywords.join(', '))
  html = setMeta(html, 'name', 'robots', page.index === false ? 'noindex, nofollow' : 'index, follow')
  html = setCanonical(html, url)
  html = setMeta(html, 'property', 'og:title', page.title)
  html = setMeta(html, 'property', 'og:description', page.description)
  html = setMeta(html, 'property', 'og:type', page.ogType || 'website')
  html = setMeta(html, 'property', 'og:url', url)
  html = setMeta(html, 'name', 'twitter:title', page.title)
  html = setMeta(html, 'name', 'twitter:description', page.description)
  if (page.jsonLd) html = setJsonLd(html, page.jsonLd)
  html = injectStub(html, page)

  let outDir = distDir
  if (page.path !== '/') {
    outDir = join(distDir, page.path.replace(/^\/+/, '').replace(/\/+$/, ''))
    mkdirSync(outDir, { recursive: true })
  }
  writeFileSync(join(outDir, 'index.html'), html, 'utf8')
  count++
  console.log(`  ✓ ${page.path}`)
}
console.log(`✓ prerender-seo: ${count} trang công khai (meta + JSON-LD + nội dung tĩnh).`)
