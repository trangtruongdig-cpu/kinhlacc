// build-phap-tri.mjs — Prerender SEO cho 380 pháp trị (/phap-tri/<slug>/index.html) từ DB phap_tri.
//
// Đặc tả: docs/superpowers/specs/2026-10-02-do-thi-tri-thuc-thap-va-truc-ngang.md (GĐ 2)
// Người dùng CHỐT phương án (b): nhóm trang mới cho TẤT CẢ — mỗi thể bệnh/pháp trị được trang
// riêng. Luật index: trang vào sitemap khi có ≥ 1 cạnh (triệu chứng HOẶC bài thuốc). Trang không
// đạt vẫn sống cho liên kết nội bộ, chỉ không mời bot vào.
//
// Mirror build-duoc-lieu.mjs: chèn title/meta/canonical/OG/JSON-LD + khối nội dung tĩnh vào
// dist/index.html; Vue mount sẽ thay #app → user thấy SPA, bot thấy nội dung.
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
  console.warn('⚠ build-phap-tri: không nạp được module pg (' + e.message + ') — BỎ QUA prerender pháp trị (build vẫn tiếp tục).')
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

// Cùng thuật toán slug với các builder khác — PHẢI khớp để link chéo không 404.
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

// Bản đồ ký hiệu quốc tế → slug trang /kinh/ — PHẢI khớp dict-data.mjs KINH_SLUG_BY_CODE.
const KINH_SLUG = {
  LU: 'phe', LI: 'dai-truong', ST: 'vi', SP: 'ty', HT: 'tam', SI: 'tieu-truong',
  BL: 'bang-quang', KI: 'than', PC: 'tam-bao', TE: 'tam-tieu', SJ: 'tam-tieu',
  GB: 'dom', LR: 'can', LIV: 'can', GV: 'doc', CV: 'nham',
}

// Cắt text thành <p> theo dòng trống.
function paras(text) {
  return String(text ?? '')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `<p>${escText(s)}</p>`)
    .join('')
}

const distDir = process.env.DIST_DIR ? resolve(process.env.DIST_DIR) : resolve(root, 'dist')
const DOMAIN = (process.env.SITE_DOMAIN || 'https://kinhlac.online').replace(/\/+$/, '')
const indexPath = resolve(distDir, 'index.html')
if (!existsSync(indexPath)) { console.error('✗ Chưa có dist/index.html — chạy vite build trước.'); process.exit(1) }
const baseHtml = readFileSync(indexPath, 'utf8')

function groupBy(rows, key) {
  const m = new Map()
  for (const r of rows) {
    const k = r[key]
    if (!m.has(k)) m.set(k, [])
    m.get(k).push(r)
  }
  return m
}

function stub(pt, rel, baiThuoc) {
  const trieuChungs = rel.trieuChung.get(pt.id) || []
  const kinhMachs = rel.kinhMach.get(pt.id) || []

  const tcHtml = trieuChungs.length
    ? `<h2>Triệu chứng (${trieuChungs.length})</h2><ul>${trieuChungs.map((tc) =>
        `<li><a href="/trieu-chung/${escAttr(slugify(tc.ten_trieu_chung))}/">${escText(tc.ten_trieu_chung)}</a></li>`
      ).join('')}</ul>`
    : ''

  const kmHtml = kinhMachs.length
    ? `<p>Kinh mạch liên quan: ${kinhMachs.map((km) => {
        const kSlug = KINH_SLUG[km.ky_hieu_quoc_te] || slugify(km.ten_kinh_mach)
        return `<a href="/kinh/${escAttr(kSlug)}/">${escText(km.ten_kinh_mach)}</a>`
      }).join(', ')}</p>`
    : ''

  const btHtml = baiThuoc
    ? `<h2>Bài thuốc chủ phương</h2><p><a href="/bai-thuoc/${escAttr(baiThuoc.slug)}/">${escText(baiThuoc.ten)}</a>${baiThuoc.tac_dung ? ': ' + escText(cau(baiThuoc.tac_dung)) : ''}</p>`
    : ''

  // Phân tích bát cương từ cột luc_kinh (nếu có)
  const batCuong = pt.luc_kinh
    ? `<p>Lục kinh: <strong>${escText(pt.luc_kinh)}</strong></p>`
    : ''

  return '<div data-seo-stub>'
    + `<nav aria-label="Breadcrumb"><a href="/">Trang Chủ</a> › <a href="/phap-tri/">Pháp Trị</a> › ${escText(pt.the_benh)}</nav>`
    + `<h1>${escText(pt.the_benh)}</h1>`
    + (pt.nguyen_tac ? `<p>Nguyên tắc điều trị: <strong>${escText(pt.nguyen_tac)}</strong></p>` : '')
    + batCuong
    + kmHtml
    + tcHtml
    + (pt.trieu_chung_mo_ta ? `<h2>Mô tả lâm sàng</h2>${paras(pt.trieu_chung_mo_ta)}` : '')
    + (pt.y_nghia_co_che ? `<h2>Ý nghĩa cơ chế</h2>${paras(pt.y_nghia_co_che)}` : '')
    + btHtml
    + `<p>Thông tin tra cứu Đông Y — không tự ý dùng, hãy hỏi thầy thuốc Y Học Cổ Truyền.</p>`
    + `<p>Đang tải ứng dụng…</p></div>`
}

;(async () => {
  const hasDb = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DB_HOST || process.env.POSTGRES_HOST
  if (!hasDb) {
    console.warn('⚠ build-phap-tri: thiếu cấu hình DB — BỎ QUA prerender pháp trị (build vẫn tiếp tục).')
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
    console.warn('⚠ build-phap-tri: không kết nối được DB (' + e.message + ') — BỎ QUA prerender pháp trị (build vẫn tiếp tục).')
    process.exit(0)
  }

  // Tuần tự — pg.Client 1 connection, không chạy query đồng thời.
  const ptQ = await client.query(
    `SELECT id, the_benh, nguyen_tac, y_nghia_co_che, trieu_chung_mo_ta, id_bai_thuoc, luc_kinh FROM phap_tri ORDER BY id`,
  )

  // Triệu chứng liên kết qua phap_tri_trieu_chung
  const tcQ = await client.query(
    `SELECT ptc.id_phap_tri, tc.id AS id_trieu_chung, tc.ten_trieu_chung, tc.nhom
     FROM phap_tri_trieu_chung ptc
     JOIN trieu_chung tc ON tc.id = ptc.id_trieu_chung
     ORDER BY tc.ten_trieu_chung`,
  )

  // Kinh mạch liên kết qua phap_tri_kinh_mach
  const kmQ = await client.query(
    `SELECT ptkm.id_phap_tri, km.id_kinh_mach, km.ten_kinh_mach, km.ky_hieu_quoc_te
     FROM phap_tri_kinh_mach ptkm
     JOIN kinh_mach km ON km.id_kinh_mach = ptkm.id_kinh_mach
     ORDER BY km.ten_kinh_mach`,
  )

  // Bài thuốc chủ phương
  const btQ = await client.query(
    `SELECT id, ten, slug, tac_dung FROM phuong_thang WHERE slug IS NOT NULL AND slug <> ''`,
  )
  const baiThuocById = new Map()
  for (const r of btQ.rows) baiThuocById.set(r.id, r)

  await client.end()

  const rows = ptQ.rows
  const rel = {
    trieuChung: groupBy(tcQ.rows, 'id_phap_tri'),
    kinhMach: groupBy(kmQ.rows, 'id_phap_tri'),
    baiThuoc: baiThuocById,
  }

  // ── Luật index ────────────────────────────────────────────────────────────
  // Trang vào sitemap khi có ≥ 1 cạnh triệu chứng HOẶC có bài thuốc. Đo: 373/380 đạt.
  // 7 trang mồ côi vẫn sống, chỉ noindex.
  const duDay = (pt) => {
    const coTC = (rel.trieuChung.get(pt.id) || []).length > 0
    const coBT = pt.id_bai_thuoc != null && baiThuocById.has(pt.id_bai_thuoc)
    return coTC || coBT
  }

  const urls = []
  const mucLuc = []
  let n = 0
  let nNoindex = 0
  for (const pt of rows) {
    const slug = slugify(pt.the_benh)
    const url = `${DOMAIN}/phap-tri/${slug}/`
    const tcNames = (rel.trieuChung.get(pt.id) || []).map((tc) => tc.ten_trieu_chung)
    const bt = pt.id_bai_thuoc != null ? baiThuocById.get(pt.id_bai_thuoc) : null
    const moTa = clipMoTa(
      `${pt.the_benh}${pt.nguyen_tac ? ' — ' + pt.nguyen_tac : ''}. `
      + (tcNames.length ? `Triệu chứng: ${tcNames.slice(0, 6).join(', ')}. ` : '')
      + (bt ? `Bài thuốc: ${bt.ten}.` : ''),
    )
    const seo = seoTrang(ghiDeSEO, 'phap_tri', slug, {
      title: tieuDeSeo(pt.the_benh, `: ${pt.nguyen_tac || 'Pháp Trị'}`, ' — Pháp Trị Đông Y', ' — Pháp Trị'),
      description: moTa,
      canonical: url,
      ogImage: OG_IMAGE,
      index: duDay(pt),
    })
    const index = seo.index !== false && seo.canonical === url
    if (!index) nNoindex++
    const jsonLd = [
      {
        '@context': 'https://schema.org', '@type': 'MedicalWebPage', inLanguage: 'vi', url,
        name: pt.the_benh, description: seo.description, isAccessibleForFree: true,
        publisher: { '@type': 'Organization', name: SITE, logo: { '@type': 'ImageObject', url: `${DOMAIN}/logo-512.png` } },
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang Chủ', item: DOMAIN + '/' },
          { '@type': 'ListItem', position: 2, name: 'Pháp Trị', item: `${DOMAIN}/phap-tri/` },
          { '@type': 'ListItem', position: 3, name: pt.the_benh, item: url },
        ],
      },
    ]
    let html = datMetaSeo(baseHtml, seo, url)
    html = setJsonLd(html, jsonLd)

    html = html.replace(/<div id="app">[\s\S]*?<\/div>/i, `<div id="app">${stub(pt, rel, bt)}</div>`)

    const outDir = join(distDir, 'phap-tri', slug)
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'index.html'), html, 'utf8')
    if (index) {
      urls.push(url)
      mucLuc.push({ ten: pt.the_benh, url, phu: pt.nguyen_tac || '' })
    }
    n++
  }

  // Mục lục A–Z tĩnh
  const urlMucLuc = dungMucLuc({
    distDir, dir: 'phap-tri', ten: 'Pháp Trị', muc: mucLuc,
    gioiThieu: 'Danh mục pháp trị Đông Y: thể bệnh, nguyên tắc điều trị, triệu chứng và bài thuốc chủ phương.',
  })
  urls.push(...urlMucLuc)
  console.log(`  mục lục A–Z: ${urlMucLuc.length} trang, ${mucLuc.length} pháp trị.`)

  const smPath = resolve(distDir, 'sitemap.xml')
  chenUrl(smPath, '/phap-tri/', urls, { priority: '0.6' })

  luuTuSinh()
  console.log(`✓ build-phap-tri: ${n} trang pháp trị tĩnh (${nNoindex} noindex: mồ côi) + ${urls.length} URL vào sitemap.`)
})().catch((e) => { console.warn('⚠ build-phap-tri: lỗi khi prerender (' + (e && e.message) + ') — BỎ QUA, build vẫn tiếp tục.'); process.exit(0) })
