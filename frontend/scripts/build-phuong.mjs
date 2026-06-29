// build-phuong.mjs — Prerender SEO cho TỪNG bài thuốc (/bai-thuoc/<slug>/index.html) từ DB phuong_thang.
// Mirror prerender-seo.mjs: chèn title/meta/canonical/OG/JSON-LD + khối nội dung tĩnh (có link nội bộ
// sang /duoc-lieu/<id>/) vào dist/index.html; Vue mount sẽ thay #app → user thấy SPA, bot thấy nội dung.
// Chạy SAU vite build (cần dist/index.html). Cũng nạp URL bài thuốc vào dist/sitemap.xml.
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { createRequire } from 'node:module'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')            // frontend/
const repoRoot = resolve(root, '..')        // repo
const BE = join(repoRoot, 'backend')
const require = createRequire(import.meta.url)
// Nạp pg linh hoạt: thử pg của frontend trước, rồi tới backend. Nếu môi trường build KHÔNG có
// (vd build Docker frontend tách rời) → BỎ QUA prerender thay vì làm gãy cả build.
let Client
try {
  try { ({ Client } = require('pg')) } catch { ({ Client } = require(join(BE, 'node_modules/pg'))) }
} catch (e) {
  console.warn('⚠ build-phuong: không nạp được module pg (' + e.message + ') — BỎ QUA prerender cổ phương (build vẫn tiếp tục).')
  process.exit(0)
}
try { require(join(BE, 'node_modules/dotenv')).config({ path: join(BE, '.env') }) } catch { /* env đã có sẵn từ môi trường runtime */ }

const distDir = process.env.DIST_DIR ? resolve(process.env.DIST_DIR) : resolve(root, 'dist')
const DOMAIN = (process.env.SITE_DOMAIN || 'https://kinhlac.online').replace(/\/+$/, '')
const indexPath = resolve(distDir, 'index.html')
if (!existsSync(indexPath)) { console.error('✗ Chưa có dist/index.html — chạy vite build trước.'); process.exit(1) }
const baseHtml = readFileSync(indexPath, 'utf8')

const escAttr = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escText = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function setTitle(h, t) { return h.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escText(t)}</title>`) }
function setMeta(h, attr, key, content) {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"[^>]*\\scontent=")[^"]*(")`, 'i')
  return re.test(h) ? h.replace(re, `$1${escAttr(content)}$2`)
    : h.replace(/<\/head>/i, `    <meta ${attr}="${key}" content="${escAttr(content)}">\n  </head>`)
}
function setCanonical(h, href) {
  const re = /(<link\s+rel="canonical"[^>]*\shref=")[^"]*(")/i
  return re.test(h) ? h.replace(re, `$1${escAttr(href)}$2`)
    : h.replace(/<\/head>/i, `    <link rel="canonical" href="${escAttr(href)}">\n  </head>`)
}
function setJsonLd(h, obj) {
  const json = JSON.stringify(obj).replace(/</g, '\\u003c')
  return h.replace(/\s*<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/i, '')
    .replace(/<\/head>/i, `    <script type="application/ld+json" id="seo-jsonld">${json}</script>\n  </head>`)
}

function stub(b) {
  const tp = Array.isArray(b.thanh_phan) ? b.thanh_phan : []
  const ing = tp.map((t) => {
    const name = escText(t.ten) + (t.lieu ? ` <span>${escText(t.lieu)}</span>` : '')
    return t.id ? `<li><a href="/duoc-lieu/${t.id}/">${escText(t.ten)}</a>${t.lieu ? ` <span>${escText(t.lieu)}</span>` : ''}</li>` : `<li>${name}</li>`
  }).join('')
  return '<div data-seo-stub>'
    + `<nav aria-label="Breadcrumb"><a href="/">Trang Chủ</a> › <a href="/bai-thuoc/">Từ Điển Bài Thuốc</a> › ${escText(b.ten)}</nav>`
    + `<h1>${escText(b.ten)}</h1>`
    + (b.xuat_xu ? `<p>Xuất xứ: <strong>${escText(b.xuat_xu)}</strong></p>` : '')
    + (b.tac_gia ? `<p>Tác giả: <strong>${escText(b.tac_gia)}</strong></p>` : '')
    + (b.tac_dung ? `<h2>Tác dụng</h2><p>${escText(b.tac_dung)}</p>` : '')
    + (ing ? `<h2>Thành phần (${tp.length} vị)</h2><ul>${ing}</ul>` : '')
    + (b.cach_dung ? `<h2>Cách bào chế & sử dụng</h2><p>${escText(b.cach_dung)}</p>` : '')
    + (b.ghi_chu ? `<h2>Ghi chú</h2><p>${escText(b.ghi_chu)}</p>` : '')
    + `<p>Cổ phương tham khảo — không tự ý dùng, hãy hỏi thầy thuốc Y Học Cổ Truyền.</p>`
    + `<p>Đang tải ứng dụng…</p></div>`
}

;(async () => {
  // Thiếu cấu hình DB (vd Docker build không truyền env) → bỏ qua, không làm gãy build.
  const hasDb = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DB_HOST || process.env.POSTGRES_HOST
  if (!hasDb) {
    console.warn('⚠ build-phuong: thiếu cấu hình DB — BỎ QUA prerender cổ phương (build vẫn tiếp tục).')
    process.exit(0)
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    host: process.env.DB_HOST || process.env.POSTGRES_HOST,
    port: Number(process.env.DB_PORT || process.env.POSTGRES_PORT || 5432),
    user: process.env.DB_USER || process.env.POSTGRES_USER,
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD,
    database: process.env.DB_NAME || process.env.POSTGRES_DATABASE,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  })
  try {
    await client.connect()
  } catch (e) {
    console.warn('⚠ build-phuong: không kết nối được DB (' + e.message + ') — BỎ QUA prerender cổ phương (build vẫn tiếp tục).')
    process.exit(0)
  }
  const rows = (await client.query(
    'SELECT id, ten, slug, xuat_xu, tac_gia, thanh_phan, cach_dung, tac_dung, ghi_chu FROM phuong_thang ORDER BY id',
  )).rows
  await client.end()

  const urls = []
  let n = 0
  for (const b of rows) {
    const url = `${DOMAIN}/bai-thuoc/${b.slug}/`
    const vi = (Array.isArray(b.thanh_phan) ? b.thanh_phan : []).map((t) => t.ten).filter(Boolean)
    const title = `${b.ten} — bài thuốc Đông Y${b.xuat_xu ? ' (' + b.xuat_xu + ')' : ''} | Kinh Lạc Trương Gia`
    const desc = `Bài thuốc ${b.ten}${b.tac_dung ? ' — ' + b.tac_dung : ''}. Thành phần: ${vi.slice(0, 8).join(', ')}.`.slice(0, 300)
    const jsonLd = {
      '@context': 'https://schema.org', '@type': 'MedicalWebPage', inLanguage: 'vi', url,
      name: b.ten, description: desc, isAccessibleForFree: true,
      about: { '@type': 'Drug', name: b.ten, ...(b.tac_dung ? { description: b.tac_dung } : {}), ...(vi.length ? { activeIngredient: vi } : {}) },
    }
    let html = baseHtml
    html = setTitle(html, title)
    html = setMeta(html, 'name', 'description', desc)
    html = setMeta(html, 'name', 'robots', 'index, follow')
    html = setCanonical(html, url)
    html = setMeta(html, 'property', 'og:title', title)
    html = setMeta(html, 'property', 'og:description', desc)
    html = setMeta(html, 'property', 'og:type', 'article')
    html = setMeta(html, 'property', 'og:url', url)
    html = setJsonLd(html, jsonLd)
    html = html.replace(/<div id="app">\s*<\/div>/i, `<div id="app">${stub(b)}</div>`)

    const outDir = join(distDir, 'bai-thuoc', b.slug)
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'index.html'), html, 'utf8')
    urls.push(url)
    if (++n % 2000 === 0) console.log(`  …${n}/${rows.length}`)
  }

  // Nạp URL bài thuốc vào sitemap (chèn trước </urlset>); nếu chưa có sitemap thì bỏ qua.
  const smPath = resolve(distDir, 'sitemap.xml')
  if (existsSync(smPath)) {
    const lastmod = new Date().toISOString().slice(0, 10)
    const entries = urls.map((u) => `<url><loc>${u}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`).join('\n')
    const sm = readFileSync(smPath, 'utf8')
    if (sm.includes('</urlset>')) writeFileSync(smPath, sm.replace('</urlset>', entries + '\n</urlset>'), 'utf8')
  }

  console.log(`✓ build-phuong: ${n} trang bài thuốc tĩnh + ${urls.length} URL vào sitemap.`)
})().catch((e) => { console.warn('⚠ build-phuong: lỗi khi prerender (' + (e && e.message) + ') — BỎ QUA, build vẫn tiếp tục.'); process.exit(0) })
