// build-nguon.mjs — Sinh trang tĩnh cho THƯ MỤC NGUỒN (/nguon/<slug>/).
//
// VÌ SAO CÓ TỆP NÀY
// Đo trên dist/ trước khi viết: `find dist/nguon` ra 0 trang, và 0 trang nào trong
// 16.364 trang tĩnh có link tới /nguon/. Xuất xứ trên 13.937 bài thuốc chỉ là chữ chết
// trong thẻ <strong>. Đây là mỏ liên kết nội bộ lớn nhất đang bỏ không.
//
// Quan hệ KHÔNG phải đoán bằng khớp chuỗi — đã có sẵn trong kho app:
//   nguon                2.139 mục (1.661 sách + 478 tác giả)
//   nguon_phuong_thang  32.194 liên kết → 13.939/13.942 bài thuốc có nguồn
//   nguon_vi_thuoc       1.322 liên kết
// Mỗi bài thuốc thường có 2 nguồn (một sách + một tác giả).
//
// KIỂU TRANG: tĩnh ĐỘC LẬP, giống /huyet/ và /benh-hoc/ — KHÔNG phải vỏ SPA như
// /bai-thuoc/. Đã kiểm: trang huyệt không có <div id="app">, không mount Vue, và
// nginx `try_files $uri $uri/` phục vụ thẳng. Nhờ vậy KHÔNG phải thêm route Vue nào;
// thêm route mà quên thì cùng một địa chỉ ra hai nội dung khác nhau.
//
// Chạy SAU build-phuong/build-duoc-lieu (để link trỏ tới trang đã có).
//   node scripts/build-nguon.mjs
//   DIST_DIR=/tmp/thu node scripts/build-nguon.mjs   # sinh thử

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { chenUrl } from './sitemap-chen.mjs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { createRequire } from 'node:module'
import { sslConfig } from './db-ssl.mjs'
import {
  head, topbar, footer, disclaimer, ld, escText, escAttr,
  DOMAIN, SITE, DEFAULT_REVIEWER,
} from './seo-html.mjs'
import { napGhiDe, apGhiDe } from './seo-cms.mjs'
import { napNguonCms } from './nguon-cms.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const BE = join(resolve(root, '..'), 'backend')
const require = createRequire(import.meta.url)

let Client
try {
  try { ({ Client } = require('pg')) } catch { ({ Client } = require(join(BE, 'node_modules/pg'))) }
} catch (e) {
  console.warn('⚠ build-nguon: không nạp được pg (' + e.message + ') — BỎ QUA (build vẫn tiếp tục).')
  process.exit(0)
}
try { require(join(BE, 'node_modules/dotenv')).config({ path: join(BE, '.env') }) } catch { /* env từ runtime */ }

const distDir = process.env.DIST_DIR ? resolve(process.env.DIST_DIR) : resolve(root, 'dist')
const BUILD_DATE = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10)
const GENERIC_OG = `${DOMAIN}/kinhmach3d/images/meridians/kinh-01-sodo.jpg`

const NGUON_STYLE = `<style>
  .ng-meta{font-size:.85rem;color:#7a6a55;margin:.2rem 0 1.2rem}
  .ng-info{border:1px solid #e3d6c2;border-radius:12px;background:#faf6ef;padding:.9rem 1.1rem;margin:0 0 1.4rem}
  .ng-info dt{font-weight:600;color:#6b4423;float:left;clear:left;width:9rem}
  .ng-info dd{margin:0 0 .35rem 9rem}
  .ng-list{columns:2;column-gap:2rem;padding-left:1.1rem}
  .ng-list li{break-inside:avoid;margin:.18rem 0}
  @media (max-width:640px){.ng-list{columns:1}.ng-info dt{float:none;width:auto}.ng-info dd{margin-left:0}}
  .ng-az{display:flex;flex-wrap:wrap;gap:.35rem;margin:0 0 1.2rem}
  .ng-az a{display:inline-block;padding:.2rem .55rem;border:1px solid #e3d6c2;border-radius:6px;background:#faf6ef;text-decoration:none}
</style>`

const clip = (t, max = 160) => {
  const s = String(t || '').replace(/\s+/g, ' ').trim()
  return s.length <= max ? s : s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…'
}

const kho = new Client({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  host: process.env.DB_HOST || process.env.POSTGRES_HOST,
  port: Number(process.env.DB_PORT || process.env.POSTGRES_PORT || 5432),
  user: process.env.DB_USER || process.env.POSTGRES_USER,
  password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD,
  database: process.env.DB_NAME || process.env.POSTGRES_DATABASE,
  ssl: sslConfig(),
})

try {
  await kho.connect()
} catch (e) {
  console.warn('⚠ build-nguon: không nối được kho (' + e.message + ') — BỎ QUA prerender nguồn.')
  process.exit(0)
}

// Vẫn đọc bảng `nguon` của app để lấy ID — bảng nối nguon_phuong_thang / nguon_vi_thuoc
// khoá theo id đó. Nhưng phần CHỮ thì lấy từ CMS (xem dưới).
const nguon = (await kho.query(
  `SELECT id, slug, ten, loai, tac_gia, nien_dai, ten_khac, mo_ta, ghi_chu FROM nguon ORDER BY ten`,
)).rows

// Lấy TOÀN BỘ liên kết trong 2 lần truy vấn rồi gom trong JS — 2.139 nguồn × 2 truy vấn
// là 4.278 lượt đi-về, đủ để biến một khâu 3 giây thành vài phút.
const baiTheoNguon = new Map()
for (const r of (await kho.query(
  `SELECT np.nguon_id, p.slug, p.ten FROM nguon_phuong_thang np
   JOIN phuong_thang p ON p.id = np.phuong_thang_id
   WHERE p.slug IS NOT NULL AND p.slug <> '' ORDER BY p.ten`,
)).rows) {
  if (!baiTheoNguon.has(r.nguon_id)) baiTheoNguon.set(r.nguon_id, [])
  baiTheoNguon.get(r.nguon_id).push(r)
}
const viTheoNguon = new Map()
for (const r of (await kho.query(
  `SELECT nv.nguon_id, v.id, v.ten_vi_thuoc AS ten FROM nguon_vi_thuoc nv
   JOIN vi_thuoc v ON v.id = nv.vi_thuoc_id ORDER BY v.ten_vi_thuoc`,
)).rows) {
  if (!viTheoNguon.has(r.nguon_id)) viTheoNguon.set(r.nguon_id, [])
  viTheoNguon.get(r.nguon_id).push(r)
}
await kho.end()

const ghiDeSEO = await napGhiDe()

// Chữ của mục nguồn lấy từ CMS — đây là chỗ người biên tập sửa được.
// Đối chiếu trước khi chuyển: 2.139/2.139 mục khớp app TUYỆT ĐỐI, 0 ô lệch, nên bước này
// không đổi một trang nào ở thời điểm chuyển. Cột `mo_ta` bên app rỗng ở CẢ 2.139 mục
// (trang nguồn chưa từng có văn xuôi); nay CMS có trường Mô Tả để viết.
// Không nối được CMS thì RƠI VỀ chữ của app — trang vẫn dựng, chỉ không thấy phần biên
// tập mới. napNguonCms đã in cảnh báo, đừng nuốt thêm.
const chuCms = await napNguonCms()
for (const n of nguon) {
  const c = chuCms(n.slug)
  if (!c) continue
  for (const k of ['ten', 'loai', 'tac_gia', 'nien_dai', 'ten_khac', 'ghi_chu', 'mo_ta']) {
    if (c[k] !== null && c[k] !== undefined) n[k] = c[k]
  }
}

const LOAI_NHAN = { sach: 'Sách', tac_gia: 'Tác giả' }
const chuCai = (s) =>
  String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').trim().charAt(0).toUpperCase() || '#'

function trangNguon(n) {
  const bai = baiTheoNguon.get(n.id) || []
  const vi = viTheoNguon.get(n.id) || []
  const url = `${DOMAIN}/nguon/${n.slug}/`
  const loai = LOAI_NHAN[n.loai] || 'Nguồn'
  // NOINDEX cho nguồn KHÔNG trích dẫn gì: trang chỉ có mỗi cái tên là trang mỏng,
  // đẩy vào chỉ mục chỉ làm loãng. Đo thật: 95/2.139 nguồn rơi vào diện này.
  const indexable = bai.length + vi.length > 0

  const seoTitle = `${n.ten} — ${loai} Đông Y: ${bai.length} bài thuốc trích dẫn`
  const metaDesc = clip(
    `${n.ten}${n.tac_gia ? ` — ${n.tac_gia}` : ''}${n.nien_dai ? ` (${n.nien_dai})` : ''}. ` +
      `Thư mục nguồn y văn: ${bai.length} bài thuốc${vi.length ? ` và ${vi.length} vị thuốc` : ''} trích từ tài liệu này.`,
    158,
  )

  const jsonLds = [
    ld({
      '@context': 'https://schema.org',
      '@type': n.loai === 'tac_gia' ? 'Person' : 'Book',
      name: n.ten, inLanguage: 'vi', url,
      ...(n.ten_khac ? { alternateName: n.ten_khac } : {}),
      ...(n.loai !== 'tac_gia' && n.tac_gia ? { author: { '@type': 'Person', name: n.tac_gia } } : {}),
      ...(n.mo_ta ? { description: clip(n.mo_ta, 300) } : {}),
    }),
    ld({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang Chủ', item: DOMAIN + '/' },
        { '@type': 'ListItem', position: 2, name: 'Thư Mục Nguồn', item: `${DOMAIN}/nguon/` },
        { '@type': 'ListItem', position: 3, name: n.ten, item: url },
      ],
    }),
  ]

  const hang = [
    ['Loại', escText(loai)],
    ['Tác giả', n.tac_gia ? escText(n.tac_gia) : ''],
    ['Niên đại', n.nien_dai ? escText(n.nien_dai) : ''],
    ['Tên khác', n.ten_khac ? escText(n.ten_khac) : ''],
  ].filter((x) => x[1])

  const htmlDoc = head(apGhiDe({
    title: `${seoTitle} — ${SITE}`, description: metaDesc, canonical: url,
    jsonLds, ogImage: GENERIC_OG, index: indexable, extraHead: NGUON_STYLE,
  }, ghiDeSEO('nguon_y_van', n.slug))) +
    `<body>${topbar}
<main class="bl-main"><article class="bl-article dl-article">
  <nav class="bl-crumb"><a href="/">Trang Chủ</a> › <a href="/nguon/">Thư Mục Nguồn</a> › <span>${escText(n.ten)}</span></nav>
  <h1>${escText(n.ten)}</h1>
  <p class="ng-meta">${escText(loai)} · Cập nhật ${escText(BUILD_DATE)} · Rà soát: ${escText(DEFAULT_REVIEWER)}</p>
  ${hang.length ? `<dl class="ng-info">${hang.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>` : ''}
  ${n.mo_ta ? `<p>${escText(n.mo_ta)}</p>` : ''}
  ${
    bai.length
      ? `<h2>Bài thuốc trích từ nguồn này (${bai.length})</h2>
  <ul class="ng-list">${bai.map((b) => `<li><a href="/bai-thuoc/${escAttr(b.slug)}/">${escText(b.ten)}</a></li>`).join('')}</ul>`
      : ''
  }
  ${
    vi.length
      ? `<h2>Vị thuốc trích từ nguồn này (${vi.length})</h2>
  <ul class="ng-list">${vi.map((v) => `<li><a href="/duoc-lieu/${escAttr(v.id)}/">${escText(v.ten)}</a></li>`).join('')}</ul>`
      : ''
  }
  ${
    // Câu này chỉ đúng khi CẢ HAI danh sách đều rỗng. Trước đây nó treo vào mỗi
    // `vi.length`, nên trang có 3 bài thuốc vẫn in ngay bên dưới "Chưa có mục nào
    // trích dẫn nguồn này trong kho" — tự mâu thuẫn với chính khối vừa liệt kê.
    !bai.length && !vi.length
      ? '<p><em>Chưa có mục nào trích dẫn nguồn này trong kho.</em></p>'
      : ''
  }
  ${n.ghi_chu ? `<h2>Ghi chú</h2><p>${escText(n.ghi_chu)}</p>` : ''}
  ${disclaimer({})}
</article></main>${footer}</body></html>`

  return { htmlDoc, indexable, url }
}

function trangMucLuc() {
  const url = `${DOMAIN}/nguon/`
  const theoChu = new Map()
  for (const n of nguon) {
    const c = chuCai(n.ten)
    if (!theoChu.has(c)) theoChu.set(c, [])
    theoChu.get(c).push(n)
  }
  const chuSap = [...theoChu.keys()].sort((a, b) => a.localeCompare(b, 'vi'))
  const soBai = nguon.reduce((s, n) => s + (baiTheoNguon.get(n.id)?.length || 0), 0)

  const jsonLds = [
    ld({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Thư Mục Nguồn Y Văn', inLanguage: 'vi', url }),
    ld({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang Chủ', item: DOMAIN + '/' },
        { '@type': 'ListItem', position: 2, name: 'Thư Mục Nguồn', item: url },
      ],
    }),
  ]

  return head({
    title: `Thư Mục Nguồn Y Văn: ${nguon.length} Sách & Tác Giả Đông Y — ${SITE}`,
    description: clip(
      `Thư mục ${nguon.length} nguồn y văn cổ truyền (sách và tác giả) được trích dẫn trong ${soBai} bài thuốc của từ điển Đông Y.`,
      158,
    ),
    canonical: url, jsonLds, ogImage: GENERIC_OG, extraHead: NGUON_STYLE,
  }) +
    `<body>${topbar}
<main class="bl-main"><article class="bl-article dl-article">
  <nav class="bl-crumb"><a href="/">Trang Chủ</a> › <span>Thư Mục Nguồn</span></nav>
  <h1>Thư Mục Nguồn Y Văn</h1>
  <p class="ng-meta">${nguon.length} nguồn · ${soBai} lượt trích dẫn trong kho bài thuốc · Cập nhật ${escText(BUILD_DATE)}</p>
  <p>Mỗi bài thuốc trong từ điển đều ghi xuất xứ. Trang này gom toàn bộ sách và tác giả
  được trích dẫn, để tra ngược: một nguồn đã cho ra những bài thuốc nào.</p>
  <nav class="ng-az">${chuSap.map((c) => `<a href="#chu-${escAttr(c)}">${escText(c)}</a>`).join('')}</nav>
  ${chuSap
    .map(
      (c) => `<h2 id="chu-${escAttr(c)}">${escText(c)}</h2>
  <ul class="ng-list">${theoChu
    .get(c)
    .map((n) => {
      const s = (baiTheoNguon.get(n.id)?.length || 0) + (viTheoNguon.get(n.id)?.length || 0)
      return `<li><a href="/nguon/${escAttr(n.slug)}/">${escText(n.ten)}</a>${s ? ` <small>(${s})</small>` : ''}</li>`
    })
    .join('')}</ul>`,
    )
    .join('')}
  ${disclaimer({})}
</article></main>${footer}</body></html>`
}

mkdirSync(join(distDir, 'nguon'), { recursive: true })
writeFileSync(join(distDir, 'nguon', 'index.html'), trangMucLuc(), 'utf8')

const urls = []
let n = 0
let nNoindex = 0
for (const x of nguon) {
  if (!x.slug) continue
  const { htmlDoc, indexable, url } = trangNguon(x)
  const dir = join(distDir, 'nguon', x.slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), htmlDoc, 'utf8')
  n++
  if (indexable) urls.push(url)
  else nNoindex++
}

// Nạp vào sitemap — cùng cách build-phuong làm: chèn trước </urlset>.
const smPath = join(distDir, 'sitemap.xml')
// Trước đây chốt ở đây là "thấy /nguon/ rồi thì bỏ qua" — chặn được trùng nhưng cũng chặn
// luôn việc CẬP NHẬT khi số nguồn đổi. chenUrl xoá phần cũ rồi chèn lại nên vừa không
// trùng vừa cập nhật được.
if (urls.length) chenUrl(smPath, '/nguon/', [`${DOMAIN}/nguon/`, ...urls], { priority: '0.5' })

console.log(
  `✓ build-nguon: ${n} trang nguồn (${nNoindex} noindex: không mục nào trích dẫn) + 1 trang mục lục` +
    `${urls.length ? ` + ${urls.length + 1} URL vào sitemap` : ''}`,
)
