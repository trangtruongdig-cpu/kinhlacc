// build-nhom-duoc-ly.mjs — Sinh trang tĩnh CHỦ ĐỀ theo phân loại dược lý Trung Dược Học:
// nhóm lớn (21) → nhóm nhỏ (47) → danh sách vị thuốc thuộc nhóm. Trả lời đúng ý định tìm
// kiếm dạng "thuốc trị mất ngủ", "thuốc bổ khí"... bằng dữ liệu ĐÃ CHUẨN HOÁ (khác công
// dụng/chủ trị thô — nhãn tự do, rời rạc, không dùng ở đây).
//
// Kiến trúc LAI: DB trực tiếp như build-duoc-lieu.mjs (dữ liệu chỉ có ở Postgres, không có
// snapshot tĩnh) + khung HTML độc lập (không Vue) như build-dict.mjs, dùng chung seo-html.mjs.
// Chạy SAU vite build (cần dist/index.html KHÔNG bắt buộc — trang này không cần clone SPA
// shell vì không nhúng vào #app). Cũng nạp URL vào dist/sitemap.xml.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { createRequire } from 'node:module'
import { head, topbar, footer, disclaimer, ld, escText, escAttr, DOMAIN, SITE, OG_IMAGE } from './seo-html.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const repoRoot = resolve(root, '..')
const BE = join(repoRoot, 'backend')
const require = createRequire(import.meta.url)

let Client
try {
  try { ({ Client } = require('pg')) } catch { ({ Client } = require(join(BE, 'node_modules/pg'))) }
} catch (e) {
  console.warn('⚠ build-nhom-duoc-ly: không nạp được module pg (' + e.message + ') — BỎ QUA (build vẫn tiếp tục).')
  process.exit(0)
}
try { require(join(BE, 'node_modules/dotenv')).config({ path: join(BE, '.env') }) } catch { /* env đã có sẵn từ môi trường runtime */ }

const distDir = process.env.DIST_DIR ? resolve(process.env.DIST_DIR) : resolve(root, 'dist')

// Vietnamese slug — bản sao gọn của dict-data.mjs's slugify() (không import cả module để
// tránh nạp kèm 2 file JSON huyệt/bệnh ~5MB không liên quan).
function slugify(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'muc'
}

const chip = (href, text, small) =>
  `<li><a href="${escAttr(href)}">${escText(text)}${small ? ` <small>${escText(small)}</small>` : ''}</a></li>`

const NHOM_STYLE = `<style>
  .dl-article .dl-badge{display:inline-block;font-size:.5em;font-weight:600;vertical-align:middle;background:#6b4423;color:#fff;padding:.18em .6em;border-radius:999px;margin-left:.4em}
  .dl-lead{font-size:1.08rem;line-height:1.7;background:#fffdf8;border-left:4px solid #6b4423;padding:.8rem 1rem;border-radius:0 8px 8px 0;margin:0 0 1.6rem}
  .dl-rel{margin-top:1.4rem}
  .dl-rel-list{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:.5rem}
  .dl-rel-list li a,.dl-rel-list li{display:inline-block;background:#f3ebdd;border-radius:8px;padding:.3rem .7rem;font-size:.92rem;text-decoration:none;color:#5a4427}
  .dl-rel-list li a:hover{background:#e7d8bf}
  .dl-rel-list small{opacity:.7}
</style>`

function writePage(kind, slugPath, html) {
  const dir = join(distDir, kind, ...slugPath)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html, 'utf8')
}

function breadcrumbLd(items) {
  return ld({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
  })
}

function crumbHtml(items) {
  return `<nav class="bl-crumb">${items.map(([name, href], i) =>
    i === items.length - 1 ? `<span>${escText(name)}</span>` : `<a href="${escAttr(href)}">${escText(name)}</a> › `).join('')}</nav>`
}

// Trang hub dùng chung cho cả 3 cấp (hub-of-hubs, nhóm lớn, nhóm nhỏ) — cùng 1 khuôn hình
// như hubDoc() trong build-dict.mjs, viết lại gọn vì không export được từ đó.
function hubDoc({ title, desc, url, crumb, h1, badge, intro, sections, index = true }) {
  const jsonLds = [
    ld({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: h1, inLanguage: 'vi', url }),
    breadcrumbLd(crumb.map(([name, href]) => [name, href.startsWith('http') ? href : DOMAIN + href])),
  ]
  return head({ title, description: desc, canonical: url, jsonLds, ogImage: OG_IMAGE, index, extraHead: NHOM_STYLE }) +
    `<body>${topbar}
<main class="bl-main"><article class="bl-article dl-article">
  ${crumbHtml(crumb)}
  <h1>${escText(h1)}${badge ? ` <span class="dl-badge">${escText(badge)}</span>` : ''}</h1>
  <p class="dl-lead">${escText(intro)}</p>
  ${sections}
  <div class="bl-cta"><a href="/duoc-lieu/">Tra Cứu Từ Điển Dược Liệu →</a></div>
  ${disclaimer({ note: 'Thông tin phân loại dược lý trên trang này' })}
</article></main>
${footer}</body></html>`
}

function groupBy(rows, key) {
  const m = new Map()
  for (const r of rows) {
    if (!m.has(r[key])) m.set(r[key], [])
    m.get(r[key]).push(r)
  }
  return m
}

;(async () => {
  const hasDb = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DB_HOST || process.env.POSTGRES_HOST
  if (!hasDb) {
    console.warn('⚠ build-nhom-duoc-ly: thiếu cấu hình DB — BỎ QUA (build vẫn tiếp tục).')
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
    console.warn('⚠ build-nhom-duoc-ly: không kết nối được DB (' + e.message + ') — BỎ QUA (build vẫn tiếp tục).')
    process.exit(0)
  }

  const lonQ = await client.query(`SELECT id, ten_nhom, mo_ta, thu_tu FROM nhom_lon_duoc_ly ORDER BY thu_tu, id`)
  const nhoQ = await client.query(`SELECT id, id_nhom_lon, ten_nhom, lieu_luong, mo_ta, thu_tu FROM nhom_nho_duoc_ly ORDER BY thu_tu, id`)
  const herbQ = await client.query(`SELECT nnv.id_nhom_nho, v.id, v.ten_vi_thuoc FROM nhom_nho_vi_thuoc nnv
      JOIN vi_thuoc v ON v.id = nnv.id_vi_thuoc ORDER BY nnv.id_nhom_nho, nnv.thu_tu`)
  const chuTriQ = await client.query(`SELECT nnc.id_nhom_nho, ct.ten_chu_tri FROM nhom_nho_chu_tri nnc
      JOIN chu_tri ct ON ct.id = nnc.id_chu_tri ORDER BY nnc.id_nhom_nho, nnc.thu_tu`)
  await client.end()

  const herbByNho = groupBy(herbQ.rows, 'id_nhom_nho')
  const chuTriByNho = groupBy(chuTriQ.rows, 'id_nhom_nho')
  const nhoByLon = groupBy(nhoQ.rows, 'id_nhom_lon')

  // Slug + cảnh báo trùng (21+47 tên chuẩn giáo trình, va chạm gần như không xảy ra).
  const lonSlug = new Map()
  const seenLonSlug = new Set()
  for (const l of lonQ.rows) {
    const s = slugify(l.ten_nhom)
    if (seenLonSlug.has(s)) console.warn(`⚠ build-nhom-duoc-ly: trùng slug nhóm lớn "${s}" (id=${l.id})`)
    seenLonSlug.add(s)
    lonSlug.set(l.id, s)
  }
  const nhoSlug = new Map()
  for (const l of lonQ.rows) {
    const seen = new Set()
    for (const n of nhoByLon.get(l.id) || []) {
      const s = slugify(n.ten_nhom)
      if (seen.has(s)) console.warn(`⚠ build-nhom-duoc-ly: trùng slug nhóm nhỏ "${s}" trong nhóm lớn "${l.ten_nhom}" (id=${n.id})`)
      seen.add(s)
      nhoSlug.set(n.id, s)
    }
  }

  // Tổng số vị thuốc mỗi nhóm lớn (gộp từ các nhóm nhỏ con) — để loại nhóm rỗng ("Chưa Phân Loại").
  const lonHerbCount = new Map()
  for (const l of lonQ.rows) {
    const total = (nhoByLon.get(l.id) || []).reduce((sum, n) => sum + (herbByNho.get(n.id) || []).length, 0)
    lonHerbCount.set(l.id, total)
  }
  const lonRows = lonQ.rows.filter((l) => lonHerbCount.get(l.id) > 0)

  const urls = []
  const addUrl = (path, index) => { if (index !== false) urls.push(`${DOMAIN}${path}`) }

  // ── Cấp 1: hub-of-hubs /duoc-lieu/nhom/ ──
  const lonItems = lonRows.map((l) => chip(`/duoc-lieu/nhom/${lonSlug.get(l.id)}/`, l.ten_nhom, `${lonHerbCount.get(l.id)} vị`)).join('')
  writePage('duoc-lieu', ['nhom'], hubDoc({
    title: `Nhóm Dược Lý — Phân Loại Vị Thuốc Đông Y Theo Công Dụng | ${SITE}`,
    desc: `Danh mục ${lonRows.length} nhóm dược lý theo Trung Dược Học: giải biểu, thanh nhiệt, bổ hư, an thần... mỗi nhóm liệt kê đầy đủ vị thuốc thuộc nhóm.`,
    url: `${DOMAIN}/duoc-lieu/nhom/`,
    crumb: [['Trang Chủ', '/'], ['Từ Điển Dược Liệu', '/duoc-lieu'], ['Nhóm Dược Lý', '/duoc-lieu/nhom/']],
    h1: 'Nhóm Dược Lý', badge: `${lonRows.length} nhóm`,
    intro: 'Vị thuốc Đông Y phân theo nhóm dược lý (Trung Dược Học) — bấm vào từng nhóm để xem các nhóm nhỏ và danh sách vị thuốc tương ứng, giúp tra cứu nhanh theo nhu cầu (vd trị mất ngủ, bổ khí huyết, giải cảm...).',
    sections: `<section class="dl-rel"><ul class="dl-rel-list">${lonItems}</ul></section>`,
  }))
  addUrl('/duoc-lieu/nhom/', true)

  // ── Cấp 2 + 3 ──
  let nLon = 0, nNho = 0, nNhoNoindex = 0
  for (const l of lonRows) {
    const lSlug = lonSlug.get(l.id)
    const children = (nhoByLon.get(l.id) || []).filter((n) => (herbByNho.get(n.id) || []).length > 0)
    if (!children.length) continue
    nLon++

    const nhoItems = children.map((n) =>
      chip(`/duoc-lieu/nhom/${lSlug}/${nhoSlug.get(n.id)}/`, n.ten_nhom, `${(herbByNho.get(n.id) || []).length} vị`)).join('')
    writePage('duoc-lieu', ['nhom', lSlug], hubDoc({
      title: `${l.ten_nhom} — Nhóm Dược Lý Đông Y (${lonHerbCount.get(l.id)} Vị Thuốc) | ${SITE}`,
      desc: `${l.mo_ta || `Nhóm dược lý "${l.ten_nhom}"`}: ${children.length} nhóm nhỏ, tổng ${lonHerbCount.get(l.id)} vị thuốc Đông Y theo Trung Dược Học.`,
      url: `${DOMAIN}/duoc-lieu/nhom/${lSlug}/`,
      crumb: [['Trang Chủ', '/'], ['Từ Điển Dược Liệu', '/duoc-lieu'], ['Nhóm Dược Lý', '/duoc-lieu/nhom/'], [l.ten_nhom, `/duoc-lieu/nhom/${lSlug}/`]],
      h1: l.ten_nhom, badge: `${lonHerbCount.get(l.id)} vị thuốc`,
      intro: l.mo_ta || `Nhóm dược lý "${l.ten_nhom}" gồm ${children.length} nhóm nhỏ, tổng cộng ${lonHerbCount.get(l.id)} vị thuốc Đông Y.`,
      sections: `<section class="dl-rel"><ul class="dl-rel-list">${nhoItems}</ul></section>`,
    }))
    addUrl(`/duoc-lieu/nhom/${lSlug}/`, true)

    for (const n of children) {
      const nSlug = nhoSlug.get(n.id)
      const herbs = herbByNho.get(n.id) || []
      const chuTriNames = (chuTriByNho.get(n.id) || []).map((r) => r.ten_chu_tri)
      const index = herbs.length >= 3 // <3 vị → noindex, tránh trang mỏng, vẫn build để liên kết nội bộ hoạt động
      if (!index) nNhoNoindex++
      nNho++

      const introParts = []
      if (n.mo_ta) introParts.push(n.mo_ta)
      if (n.lieu_luong) introParts.push(`Liều dùng tham khảo: ${n.lieu_luong}.`)
      if (chuTriNames.length) introParts.push(`Thường dùng trị: ${chuTriNames.slice(0, 10).join(', ')}.`)
      const intro = introParts.join(' ') || `Nhóm nhỏ "${n.ten_nhom}" thuộc nhóm dược lý "${l.ten_nhom}", gồm ${herbs.length} vị thuốc.`
      const desc = `${n.ten_nhom} (thuộc nhóm ${l.ten_nhom}): ${herbs.length} vị thuốc Đông Y${chuTriNames.length ? ' — trị ' + chuTriNames.slice(0, 5).join(', ') : ''}.`.slice(0, 300)

      const herbItems = herbs.map((h) => chip(`/duoc-lieu/${h.id}/`, h.ten_vi_thuoc)).join('')
      writePage('duoc-lieu', ['nhom', lSlug, nSlug], hubDoc({
        title: `${n.ten_nhom} — ${herbs.length} Vị Thuốc Đông Y | ${SITE}`,
        desc,
        url: `${DOMAIN}/duoc-lieu/nhom/${lSlug}/${nSlug}/`,
        crumb: [['Trang Chủ', '/'], ['Từ Điển Dược Liệu', '/duoc-lieu'], ['Nhóm Dược Lý', '/duoc-lieu/nhom/'], [l.ten_nhom, `/duoc-lieu/nhom/${lSlug}/`], [n.ten_nhom, `/duoc-lieu/nhom/${lSlug}/${nSlug}/`]],
        h1: n.ten_nhom, badge: `${herbs.length} vị thuốc`,
        intro, index,
        sections: `<section class="dl-rel"><h2>Danh Sách Vị Thuốc</h2><ul class="dl-rel-list">${herbItems}</ul></section>`,
      }))
      addUrl(`/duoc-lieu/nhom/${lSlug}/${nSlug}/`, index)
    }
  }

  // Nạp URL vào sitemap (chèn trước </urlset>); nếu chưa có sitemap thì bỏ qua.
  const smPath = resolve(distDir, 'sitemap.xml')
  if (existsSync(smPath)) {
    const lastmod = new Date().toISOString().slice(0, 10)
    const entries = urls.map((u) => `<url><loc>${u}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`).join('\n')
    const sm = readFileSync(smPath, 'utf8')
    if (sm.includes('</urlset>')) writeFileSync(smPath, sm.replace('</urlset>', entries + '\n</urlset>'), 'utf8')
  }

  console.log(`✓ build-nhom-duoc-ly: 1 hub + ${nLon} nhóm lớn + ${nNho} nhóm nhỏ (${nNhoNoindex} noindex, <3 vị) + ${urls.length} URL vào sitemap.`)
})().catch((e) => { console.warn('⚠ build-nhom-duoc-ly: lỗi khi prerender (' + (e && e.message) + ') — BỎ QUA, build vẫn tiếp tục.'); process.exit(0) })
