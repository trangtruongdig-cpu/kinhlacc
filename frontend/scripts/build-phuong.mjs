// build-phuong.mjs — Prerender SEO cho TỪNG bài thuốc (/bai-thuoc/<slug>/index.html) từ DB phuong_thang.
// Mirror prerender-seo.mjs: chèn title/meta/canonical/OG/JSON-LD + khối nội dung tĩnh (có link nội bộ
// sang /duoc-lieu/<id>/) vào dist/index.html; Vue mount sẽ thay #app → user thấy SPA, bot thấy nội dung.
// Chạy SAU vite build (cần dist/index.html). Cũng nạp URL bài thuốc vào dist/sitemap.xml.
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'node:fs'
import { chenUrl } from './sitemap-chen.mjs'
import { datMetaSeo, setJsonLd } from './seo-vo-spa.mjs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { sslConfig, HEN_GIO_DB } from './db-ssl.mjs'
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

import { napGhiDe, seoTrang, luuTuSinh } from './seo-cms.mjs'
import { tieuDeSeo, SITE, OG_IMAGE } from './seo-html.mjs'
import { timTrung } from './trung-lap-bai-thuoc.mjs'

// Ghi đè SEO người biên tập gõ trong CMS. Nạp một lần ở đây; không nối được kho thì
// hàm trả null và trang dùng bản tự sinh (seo-cms.mjs đã kêu, đừng nuốt cảnh báo).
const ghiDeSEO = await napGhiDe()
// Cắt mô tả cho vừa ô kết quả tìm kiếm. Trước đây cắt cứng ở 300 ký tự, mà Google chỉ
// hiện ~155–160: đo trên dist/ thấy 8.492/13.943 trang bài thuốc (61%) bị cắt cụt giữa
// chừng. Cắt ở RANH GIỚI TỪ rồi thêm "…" để câu còn đọc được.
const clipMoTa = (t, max = 158) => {
  const s = String(t || '').replace(/\s+/g, ' ').trim()
  return s.length <= max ? s : s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…'
}
// Bỏ dấu câu cuối trước khi nối thêm "." — trước đây tac_dung vốn đã kết bằng dấu chấm
// nên ra "Trị thủy thũng.. Thành phần: ." (45 trang), kèm cả nhãn thành phần rỗng.
const cau = (t) => String(t || '').replace(/\s+/g, ' ').trim().replace(/[\s.;,:]+$/, '')
const moTaBaiThuoc = (b, vi, tenKhac = []) => {
  // Bản chính gom các bản trùng mang TÊN KHÁC (Tả Bạch Tán = Tả Phế Tán…): nêu tên khác
  // ngay đầu mô tả, không thì canonical làm mất luôn từ khoá người ta gõ tìm.
  const goiLa = tenKhac.length ? ` (còn gọi ${tenKhac.slice(0, 3).join(', ')})` : ''
  const phan = [`Bài thuốc ${b.ten}${goiLa}${cau(b.tac_dung) ? ': ' + cau(b.tac_dung) : ''}.`]
  if (vi.length) phan.push(`Thành phần: ${vi.slice(0, 8).join(', ')}${vi.length > 8 ? '…' : '.'}`)
  if (cau(b.xuat_xu)) phan.push(`Xuất xứ: ${cau(b.xuat_xu)}.`)
  return clipMoTa(phan.join(' '))
}


const distDir = process.env.DIST_DIR ? resolve(process.env.DIST_DIR) : resolve(root, 'dist')
const DOMAIN = (process.env.SITE_DOMAIN || 'https://kinhlac.online').replace(/\/+$/, '')
const indexPath = resolve(distDir, 'index.html')
if (!existsSync(indexPath)) { console.error('✗ Chưa có dist/index.html — chạy vite build trước.'); process.exit(1) }
const baseHtml = readFileSync(indexPath, 'utf8')

const escAttr = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escText = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')



// Bản tự sinh → seoTrang (ghi nhận để điền ô CMS + áp phần người biên tập sửa tay).
function apGhiDeBaiThuoc(gd, b, url, chinh, vi, tenHien, tenKhac) {
  return seoTrang(() => gd, 'bai_thuoc', b.slug, {
    // Tên sách không vào tiêu đề (đẩy lên 94–110 ký tự, Google cắt) — trừ khi tên ĐỤNG
    // tên phương khác, lúc đó nó là thứ duy nhất phân biệt hai trang.
    title: tieuDeSeo(tenHien, ' — Bài Thuốc Đông Y', ' — Bài Thuốc'),
    description: moTaBaiThuoc(b, vi, tenKhac),
    canonical: chinh ? `${DOMAIN}/bai-thuoc/${chinh}/` : url,
    ogImage: OG_IMAGE,
    index: duDay(b),
  })
}

// Liên kết qua lại giữa bản chính và bản trùng — người đọc biết hai trang là một bài, và
// bot đi theo được tới bản chính.
function khoiTrung(b, chinh, banPhu, theoSlug) {
  if (chinh) {
    const c = theoSlug.get(chinh)
    return `<p>Cùng bài thuốc (cùng thành phần) với <a href="/bai-thuoc/${escAttr(chinh)}/">${escText(c?.ten || chinh)}</a>${c?.xuat_xu ? ` — ${escText(cau(c.xuat_xu))}` : ''}.</p>`
  }
  const phu = banPhu.get(b.slug)
  if (!phu?.length) return ''
  return `<p>Bài này còn được chép ở: ${phu
    .map((x) => `<a href="/bai-thuoc/${escAttr(x.slug)}/">${escText(x.ten)}</a>${x.xuat_xu ? ` (${escText(cau(x.xuat_xu))})` : ''}`)
    .join(', ')}.</p>`
}

// ── Van chống thin/doorway trên site YMYL ───────────────────────────────────
// Cùng tinh thần MIN_BODY_CHARS của dict-data.mjs, nhưng đo theo CHỮ NGƯỜI ĐỌC THẤY
// (văn xuôi + tên vị + liều, đúng như stub() dựng) — KHÔNG tính cú pháp JSON của
// thanh_phan, vì mỗi bài sẽ bị cộng khống ~570 ký tự dấu ngoặc và tên trường.
// Đo trên 13.942 bài (25/09/2026): trung vị 236 ký tự, p25 173, p75 340.
// Ngưỡng 250 giữ 5.983 bài (42,9%). Nới xuống 150 sẽ thành 11.057 bài (79,3%).
const MIN_CHU_HIEN = 250
const MIN_SO_VI = 3

const chuoi = (v) => (v == null ? '' : String(v)).trim()
const dsVi = (b) => (Array.isArray(b.thanh_phan) ? b.thanh_phan : [])
const soVi = (b) => dsVi(b).filter((t) => chuoi(t.ten)).length
const chuNhinThay = (b) =>
  (chuoi(b.tac_dung) + ' ' + chuoi(b.cach_dung) + ' ' + chuoi(b.ghi_chu) + ' ' +
   dsVi(b).map((t) => chuoi(t.ten) + ' ' + chuoi(t.lieu)).join(' ')).replace(/\s+/g, ' ').trim()

/** Trang đủ dày để MỜI bot vào? Không đủ thì vẫn dựng (liên kết nội bộ vẫn chạy), chỉ không index. */
const duDay = (b) =>
  soVi(b) >= MIN_SO_VI && chuoi(b.tac_dung).length > 0 && chuNhinThay(b).length >= MIN_CHU_HIEN

function stub(b, nguonCua, trungHtml = '') {
  const tp = Array.isArray(b.thanh_phan) ? b.thanh_phan : []
  const ing = tp.map((t) => {
    const name = escText(t.ten) + (t.lieu ? ` <span>${escText(t.lieu)}</span>` : '')
    return t.id ? `<li><a href="/duoc-lieu/${t.id}/">${escText(t.ten)}</a>${t.lieu ? ` <span>${escText(t.lieu)}</span>` : ''}</li>` : `<li>${name}</li>`
  }).join('')
  return '<div data-seo-stub>'
    + `<nav aria-label="Breadcrumb"><a href="/">Trang Chủ</a> › <a href="/bai-thuoc/">Từ Điển Bài Thuốc</a> › ${escText(b.ten)}</nav>`
    + `<h1>${escText(b.ten)}</h1>`
    + trungHtml
    + (b.xuat_xu ? `<p>Xuất xứ: <strong>${escText(b.xuat_xu)}</strong></p>` : '')
    + (b.tac_gia ? `<p>Tác giả: <strong>${escText(b.tac_gia)}</strong></p>` : '')
    // Liên kết VỀ NGUỒN. Trước đây xuất xứ chỉ là chữ chết trong <strong>: 13.937 trang
    // ghi tên sách mà không trỏ đi đâu. Quan hệ lấy từ bảng nối nguon_phuong_thang
    // (32.194 liên kết) chứ KHÔNG khớp chuỗi — chuỗi xuat_xu có 3.217 biến thể.
    + (nguonCua.length
        ? `<p>Nguồn y văn: ${nguonCua
            .map((g) => `<a href="/nguon/${escAttr(g.slug)}/">${escText(g.ten)}</a>`)
            .join(', ')}</p>`
        : '')
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
    ssl: sslConfig(),
    ...HEN_GIO_DB,
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

  // Bản đồ bài thuốc → nguồn, lấy MỘT lần rồi gom trong JS. Truy vấn theo từng bài là
  // 13.942 lượt đi-về tới Aiven — đủ để biến khâu này thành hàng chục phút.
  const nguonTheoBai = new Map()
  try {
    for (const r of (await client.query(
      `SELECT np.phuong_thang_id AS pid, n.slug, n.ten FROM nguon_phuong_thang np
       JOIN nguon n ON n.id = np.nguon_id
       WHERE n.slug IS NOT NULL AND n.slug <> '' ORDER BY n.ten`,
    )).rows) {
      if (!nguonTheoBai.has(r.pid)) nguonTheoBai.set(r.pid, [])
      nguonTheoBai.get(r.pid).push(r)
    }
    console.log(`  nguồn y văn: ${nguonTheoBai.size} bài thuốc có liên kết về nguồn.`)
  } catch (e) {
    // Bảng nối chưa có thì trang vẫn dựng, chỉ mất phần link — KHÔNG làm gãy build.
    console.warn('⚠ build-phuong: không đọc được nguon_phuong_thang (' + e.message + ') — bỏ khối liên kết nguồn.')
  }
  await client.end()

  // Bài TRÙNG (cùng tập vị + cùng tên gốc hoặc cùng tác dụng) → canonical về bản chính.
  // Luật và lý do ở trung-lap-bai-thuoc.mjs.
  const { veChinh, banPhu } = timTrung(rows, (b) => chuNhinThay(b).length)
  const theoSlug = new Map(rows.map((b) => [b.slug, b]))
  console.log(`  trùng lặp: ${veChinh.size} bài trỏ canonical về ${banPhu.size} bản chính.`)
  // Tên đụng nhau (phương KHÁC nhau chung tên) → kèm tên sách vào tiêu đề cho khỏi trùng.
  const demTen = new Map()
  for (const b of rows) { const k = chuoi(b.ten).toLowerCase(); demTen.set(k, (demTen.get(k) || 0) + 1) }
  const sachNgan = (x) => clipMoTa(cau(String(x || '').split(/[,(;]/)[0]), 28)
  // Cùng tên VÀ cùng sách mà khác vị (có thật: 10 cặp) → "bản 2", "bản 3" theo id.
  const thuTuTenSach = new Map()
  const demTenSach = new Map()
  for (const b of [...rows].sort((a, c) => a.id - c.id)) {
    const k = chuoi(b.ten).toLowerCase() + '|' + sachNgan(b.xuat_xu)
    demTenSach.set(k, (demTenSach.get(k) || 0) + 1)
    thuTuTenSach.set(b.slug, demTenSach.get(k))
  }
  const tenHienCua = (b) => {
    if (!(demTen.get(chuoi(b.ten).toLowerCase()) > 1)) return b.ten
    const sach = sachNgan(b.xuat_xu)
    const thu = thuTuTenSach.get(b.slug)
    return sach ? `${b.ten} (${sach}${thu > 1 ? `, bản ${thu}` : ''})` : thu > 1 ? `${b.ten} (bản ${thu})` : b.ten
  }

  const urls = []
  let n = 0
  let nNoindex = 0
  let nCanonical = 0
  for (const b of rows) {
    const gd = ghiDeSEO('bai_thuoc', b.slug)
    const url = `${DOMAIN}/bai-thuoc/${b.slug}/`
    const chinh = veChinh.get(b.slug)
    const vi = (Array.isArray(b.thanh_phan) ? b.thanh_phan : []).map((t) => t.ten).filter(Boolean)
    const tenKhac = [...new Set((banPhu.get(b.slug) || []).map((x) => x.ten).filter((t) => chuoi(t).toLowerCase() !== chuoi(b.ten).toLowerCase()))]
    const seo = apGhiDeBaiThuoc(gd, b, url, chinh, vi, tenHienCua(b), tenKhac)
    const index = seo.index !== false && seo.canonical === url
    if (seo.canonical !== url) nCanonical++
    else if (!index) nNoindex++
    const jsonLd = [
      {
        '@context': 'https://schema.org', '@type': 'MedicalWebPage', inLanguage: 'vi', url,
        name: b.ten, description: seo.description, isAccessibleForFree: true,
        publisher: { '@type': 'Organization', name: SITE, logo: { '@type': 'ImageObject', url: `${DOMAIN}/logo-512.png` } },
        about: { '@type': 'Drug', name: b.ten, ...(tenKhac.length ? { alternateName: tenKhac } : {}), ...(b.tac_dung ? { description: b.tac_dung } : {}), ...(vi.length ? { activeIngredient: vi } : {}) },
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang Chủ', item: DOMAIN + '/' },
          { '@type': 'ListItem', position: 2, name: 'Từ Điển Bài Thuốc', item: `${DOMAIN}/bai-thuoc/` },
          { '@type': 'ListItem', position: 3, name: b.ten, item: url },
        ],
      },
    ]
    let html = datMetaSeo(baseHtml, seo, url)
    html = setJsonLd(html, jsonLd)
    // Không dùng \s* (chỉ khớp div RỖNG): nếu prerender-seo.mjs (route "/") chạy trước và đã
    // ghi đè dist/index.html với stub của TRANG CHỦ, div không còn rỗng nữa → [\s\S]*? khớp
    // được nội dung cũ và thay đúng, tránh mọi trang bài thuốc lặp lại nội dung trang chủ.
    html = html.replace(/<div id="app">[\s\S]*?<\/div>/i, `<div id="app">${stub(b, nguonTheoBai.get(b.id) || [], khoiTrung(b, chinh, banPhu, theoSlug))}</div>`)

    const outDir = join(distDir, 'bai-thuoc', b.slug)
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'index.html'), html, 'utf8')
    if (index) urls.push(url)
    if (++n % 2000 === 0) console.log(`  …${n}/${rows.length}`)
  }

  // Nạp URL bài thuốc vào sitemap (chèn trước </urlset>); nếu chưa có sitemap thì bỏ qua.
  const smPath = resolve(distDir, 'sitemap.xml')
  // chenUrl XOÁ phần cũ của /bai-thuoc/ rồi chèn lại — chạy lại không nhân đôi.
  chenUrl(smPath, '/bai-thuoc/', urls, {
    lastmod: new Date().toISOString().slice(0, 10), priority: '0.6',
  })

  luuTuSinh()
  console.log(`✓ build-phuong: ${n} trang bài thuốc tĩnh (${nNoindex} noindex: <${MIN_SO_VI} vị / thiếu tác dụng / <${MIN_CHU_HIEN} ký tự · ${nCanonical} canonical về bản chính) + ${urls.length} URL vào sitemap.`)
})().catch((e) => { console.warn('⚠ build-phuong: lỗi khi prerender (' + (e && e.message) + ') — BỎ QUA, build vẫn tiếp tục.'); process.exit(0) })
