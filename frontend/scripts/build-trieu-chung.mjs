// build-trieu-chung.mjs — Prerender SEO cho 1.033 triệu chứng (/trieu-chung/<slug>/index.html).
//
// Đặc tả: docs/superpowers/specs/2026-10-02-do-thi-tri-thuc-thap-va-truc-ngang.md (GĐ 2)
// Người dùng CHỐT phương án (b): mỗi triệu chứng được trang riêng. 478/1.033 đang mồ côi
// (0 cạnh pháp trị) → noindex nhưng vẫn sống để liên kết nội bộ chạy, mở dần khi thêm cạnh.
//
// Mỗi trang triệu chứng hiện: tên + nhóm + danh sách pháp trị có triệu chứng này (link tới
// /phap-tri/<slug>/) + bài thuốc chủ phương của mỗi pháp trị (link /bai-thuoc/).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { chenUrl } from './sitemap-chen.mjs'
import { datMetaSeo, setJsonLd } from './seo-vo-spa.mjs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { sslConfig, HEN_GIO_DB } from './db-ssl.mjs'
import { createRequire } from 'node:module'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const repoRoot = resolve(root, '..')
const BE = join(repoRoot, 'backend')
const require = createRequire(import.meta.url)

let Client
try {
  try { ({ Client } = require('pg')) } catch { ({ Client } = require(join(BE, 'node_modules/pg'))) }
} catch (e) {
  console.warn('⚠ build-trieu-chung: không nạp được module pg (' + e.message + ') — BỎ QUA prerender triệu chứng (build vẫn tiếp tục).')
  process.exit(0)
}
try { require(join(BE, 'node_modules/dotenv')).config({ path: join(BE, '.env') }) } catch {}

import { napGhiDe, seoTrang, luuTuSinh } from './seo-cms.mjs'
import { tieuDeSeo, SITE, OG_IMAGE } from './seo-html.mjs'
import { dungMucLuc } from './muc-luc.mjs'

const ghiDeSEO = await napGhiDe()

const clipMoTa = (t, max = 158) => {
  const s = String(t || '').replace(/\s+/g, ' ').trim()
  return s.length <= max ? s : s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…'
}
const cau = (t) => String(t || '').replace(/\s+/g, ' ').trim().replace(/[\s.;,:]+$/, '')

function slugify(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'muc'
}

const escAttr = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escText = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const distDir = process.env.DIST_DIR ? resolve(process.env.DIST_DIR) : resolve(root, 'dist')
const DOMAIN = (process.env.SITE_DOMAIN || 'https://kinhlac.online').replace(/\/+$/, '')
const indexPath = resolve(distDir, 'index.html')
if (!existsSync(indexPath)) { console.error('✗ Chưa có dist/index.html — chạy vite build trước.'); process.exit(1) }
const baseHtml = readFileSync(indexPath, 'utf8')

// Tên nhóm triệu chứng hiện thị (slug → label).
const TEN_NHOM = {
  'than-kinh-co-the': 'Thần kinh - Cơ thể',
  'tieu-hoa': 'Tiêu hoá',
  'toan-trang': 'Toàn trạng',
  'luoi-mach': 'Lưỡi - Mạch',
  'tinh-than': 'Tinh thần',
  'phu-khoa': 'Phụ khoa',
  'khac': 'Khác',
}

function groupBy(rows, key) {
  const m = new Map()
  for (const r of rows) {
    const k = r[key]
    if (!m.has(k)) m.set(k, [])
    m.get(k).push(r)
  }
  return m
}

function stub(tc, phapTris, baiThuocById) {
  const nhomLabel = TEN_NHOM[tc.nhom] || tc.nhom || ''

  const ptHtml = phapTris.length
    ? `<h2>Pháp trị liên quan (${phapTris.length})</h2><ul>${phapTris.map((pt) => {
        const bt = pt.id_bai_thuoc != null ? baiThuocById.get(pt.id_bai_thuoc) : null
        return `<li><a href="/phap-tri/${escAttr(slugify(pt.the_benh))}/">${escText(pt.the_benh)}</a>`
          + (pt.nguyen_tac ? ` — ${escText(pt.nguyen_tac)}` : '')
          + (bt ? ` · Bài thuốc: <a href="/bai-thuoc/${escAttr(bt.slug)}/">${escText(bt.ten)}</a>` : '')
          + '</li>'
      }).join('')}</ul>`
    : ''

  return '<div data-seo-stub>'
    + `<nav aria-label="Breadcrumb"><a href="/">Trang Chủ</a> › <a href="/trieu-chung/">Triệu Chứng</a> › ${escText(tc.ten_trieu_chung)}</nav>`
    + `<h1>${escText(tc.ten_trieu_chung)}</h1>`
    + (nhomLabel ? `<p>Nhóm: <strong>${escText(nhomLabel)}</strong></p>` : '')
    + ptHtml
    + `<p>Thông tin tra cứu Đông Y — không tự ý dùng, hãy hỏi thầy thuốc Y Học Cổ Truyền.</p>`
    + `<p>Đang tải ứng dụng…</p></div>`
}

;(async () => {
  const hasDb = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DB_HOST || process.env.POSTGRES_HOST
  if (!hasDb) {
    console.warn('⚠ build-trieu-chung: thiếu cấu hình DB — BỎ QUA prerender triệu chứng (build vẫn tiếp tục).')
    process.exit(0)
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    host: process.env.DB_HOST || process.env.POSTGRES_HOST,
    port: Number(process.env.DB_PORT || process.env.POSTGRES_PORT || 5432),
    user: process.env.DB_USER || process.env.POSTGRES_USER,
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD,
    database: process.env.DB_NAME || process.env.POSTGRES_DATABASE,
    ssl: sslConfig(),
    ...HEN_GIO_DB,
  })
  try {
    await client.connect()
  } catch (e) {
    console.warn('⚠ build-trieu-chung: không kết nối được DB (' + e.message + ') — BỎ QUA prerender triệu chứng (build vẫn tiếp tục).')
    process.exit(0)
  }

  const tcQ = await client.query(
    `SELECT id, ten_trieu_chung, nhom FROM trieu_chung ORDER BY id`,
  )

  // Pháp trị liên kết qua phap_tri_trieu_chung (đảo chiều: mỗi triệu chứng → các pháp trị)
  const ptcQ = await client.query(
    `SELECT ptc.id_trieu_chung, pt.id, pt.the_benh, pt.nguyen_tac, pt.id_bai_thuoc
     FROM phap_tri_trieu_chung ptc
     JOIN phap_tri pt ON pt.id = ptc.id_phap_tri
     ORDER BY pt.the_benh`,
  )

  // Bài thuốc (để link chéo)
  const btQ = await client.query(
    `SELECT id, ten, slug FROM phuong_thang WHERE slug IS NOT NULL AND slug <> ''`,
  )
  const baiThuocById = new Map()
  for (const r of btQ.rows) baiThuocById.set(r.id, r)

  await client.end()

  const rows = tcQ.rows
  const phapTriByTC = groupBy(ptcQ.rows, 'id_trieu_chung')

  // ── Luật index ────────────────────────────────────────────────────────────
  // Trang vào sitemap khi có ≥ 1 pháp trị liên kết. Đo: 555/1.033 đạt.
  // 478 trang mồ côi vẫn sống, chỉ noindex.
  const duDay = (tc) => (phapTriByTC.get(tc.id) || []).length > 0

  const urls = []
  const mucLuc = []
  let n = 0
  let nNoindex = 0
  const seenSlugs = new Set()
  for (const tc of rows) {
    let slug = slugify(tc.ten_trieu_chung) || `trieu-chung-${tc.id}`
    if (seenSlugs.has(slug)) {
      slug = `${slug}-${tc.id}`
    }
    seenSlugs.add(slug)
    const url = `${DOMAIN}/trieu-chung/${slug}/`
    const pts = phapTriByTC.get(tc.id) || []
    const nhomLabel = TEN_NHOM[tc.nhom] || tc.nhom || ''
    const moTa = clipMoTa(
      `Triệu chứng ${tc.ten_trieu_chung}${nhomLabel ? ' (' + nhomLabel + ')' : ''} trong Y Học Cổ Truyền. `
      + (pts.length ? `Có trong ${pts.length} thể bệnh: ${pts.slice(0, 5).map((p) => p.the_benh).join(', ')}.` : ''),
    )
    const seo = seoTrang(ghiDeSEO, 'trieu_chung', slug, {
      title: tieuDeSeo(tc.ten_trieu_chung, ': Thể Bệnh & Pháp Trị', ' — Triệu Chứng Đông Y', ' — Triệu Chứng'),
      description: moTa,
      canonical: url,
      ogImage: OG_IMAGE,
      index: duDay(tc),
    })
    const index = seo.index !== false && seo.canonical === url
    if (!index) nNoindex++
    const jsonLd = [
      {
        '@context': 'https://schema.org', '@type': 'MedicalWebPage', inLanguage: 'vi', url,
        name: tc.ten_trieu_chung, description: seo.description, isAccessibleForFree: true,
        publisher: { '@type': 'Organization', name: SITE, logo: { '@type': 'ImageObject', url: `${DOMAIN}/logo-512.png` } },
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang Chủ', item: DOMAIN + '/' },
          { '@type': 'ListItem', position: 2, name: 'Triệu Chứng', item: `${DOMAIN}/trieu-chung/` },
          { '@type': 'ListItem', position: 3, name: tc.ten_trieu_chung, item: url },
        ],
      },
    ]
    let html = datMetaSeo(baseHtml, seo, url)
    html = setJsonLd(html, jsonLd)
    html = html.replace(/<div id="app">[\s\S]*?<\/div>/i, `<div id="app">${stub(tc, pts, baiThuocById)}</div>`)

    const outDir = join(distDir, 'trieu-chung', slug)
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'index.html'), html, 'utf8')
    if (index) {
      urls.push(url)
      mucLuc.push({ ten: tc.ten_trieu_chung, url, phu: nhomLabel })
    }
    if (++n % 500 === 0) console.log(`  …${n}/${rows.length}`)
  }

  // Mục lục A–Z tĩnh
  const urlMucLuc = dungMucLuc({
    distDir, dir: 'trieu-chung', ten: 'Triệu Chứng', muc: mucLuc,
    gioiThieu: 'Danh mục triệu chứng Đông Y: phân loại theo nhóm, thể bệnh và pháp trị liên quan.',
  })
  urls.push(...urlMucLuc)
  console.log(`  mục lục A–Z: ${urlMucLuc.length} trang, ${mucLuc.length} triệu chứng.`)

  const smPath = resolve(distDir, 'sitemap.xml')
  chenUrl(smPath, '/trieu-chung/', urls, { priority: '0.5' })

  luuTuSinh()
  console.log(`✓ build-trieu-chung: ${n} trang triệu chứng tĩnh (${nNoindex} noindex: mồ côi) + ${urls.length} URL vào sitemap.`)
})().catch((e) => { console.warn('⚠ build-trieu-chung: lỗi khi prerender (' + (e && e.message) + ') — BỎ QUA, build vẫn tiếp tục.'); process.exit(0) })
