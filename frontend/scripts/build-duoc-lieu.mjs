// build-duoc-lieu.mjs — Prerender SEO cho TỪNG vị thuốc/dược liệu (/duoc-lieu/<id>/index.html) từ DB vi_thuoc.
// Mirror build-phuong.mjs: chèn title/meta/canonical/OG/JSON-LD + khối nội dung tĩnh (có link nội bộ sang
// /bai-thuoc/<slug>/) vào dist/index.html; Vue mount sẽ thay #app → user thấy SPA, bot thấy nội dung.
// Chạy SAU vite build (cần dist/index.html). Cũng nạp URL dược liệu vào dist/sitemap.xml.
//
// Khác build-phuong.mjs: vi_thuoc không có 1 cột JSON gộp hết — công dụng/chủ trị/kiêng kỵ/kinh mạch/tên
// gọi khác/ảnh nằm ở 6 bảng liên kết riêng. Để tránh ~1.043 × 6 query, mỗi bảng liên kết chỉ query 1 lần
// (lấy toàn bộ), rồi group theo id_vi_thuoc trong JS trước khi ghép với hàng vi_thuoc.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
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
  console.warn('⚠ build-duoc-lieu: không nạp được module pg (' + e.message + ') — BỎ QUA prerender dược liệu (build vẫn tiếp tục).')
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

// Cắt text tự do thành các <p> theo dòng trống/xuống dòng (y văn thường nhiều đoạn).
function paras(text) {
  return String(text ?? '')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `<p>${escText(s)}</p>`)
    .join('')
}

// Cùng thuật toán slug với build-nhom-duoc-ly.mjs — PHẢI khớp để link chéo không 404.
function slugify(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'muc'
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

function stub(v, rel) {
  const congDung = rel.congDung.get(v.id) || []
  const chuTriLinks = rel.chuTri.get(v.id) || []
  const kiengKy = rel.kiengKy.get(v.id) || []
  const kinhMach = rel.kinhMach.get(v.id) || []
  const tenGoiKhac = rel.tenGoiKhac.get(v.id) || []
  const anh = rel.anh.get(v.id) || []
  const baiThuoc = rel.baiThuoc.get(v.id) || []
  const nhom = rel.nhom.get(v.id) || []

  const chipList = (label, rows, field) => rows.length
    ? `<h2>${label}</h2><ul>${rows.map((r) => `<li>${escText(r[field])}</li>`).join('')}</ul>`
    : ''

  const idBlock = [
    v.ten_han ? `Tên Hán: <strong>${escText(v.ten_han)}</strong>` : '',
    v.ten_pinyin ? `Pinyin: <strong>${escText(v.ten_pinyin)}</strong>` : '',
    v.ten_khoa_hoc ? `Tên khoa học: <strong>${escText(v.ten_khoa_hoc)}</strong>` : '',
    v.ho_khoa_hoc ? `Họ khoa học: <strong>${escText(v.ho_khoa_hoc)}</strong>` : '',
    v.bo_phan_dung ? `Bộ phận dùng: <strong>${escText(v.bo_phan_dung)}</strong>` : '',
    v.xuat_xu ? `Xuất xứ: <strong>${escText(v.xuat_xu)}</strong>` : '',
  ].filter(Boolean).join(' · ')

  const tvqk = [
    v.tinh ? `Tính: <strong>${escText(v.tinh)}</strong>` : '',
    v.vi ? `Vị: <strong>${escText(v.vi)}</strong>` : '',
    v.quy_kinh ? `Quy kinh: <strong>${escText(v.quy_kinh)}</strong>` : '',
    v.lieu_dung ? `Liều dùng: <strong>${escText(v.lieu_dung)}</strong>` : '',
  ].filter(Boolean).join(' · ')

  const nhomLine = nhom.length
    ? `<p>Nhóm dược lý: ${nhom.map((g) => `<a href="/duoc-lieu/nhom/${escAttr(slugify(g.lon_ten))}/${escAttr(slugify(g.nho_ten))}/">${escText(g.nho_ten)}</a>`).join(', ')}</p>`
    : ''

  const gallery = anh.length
    ? `<h2>Hình ảnh</h2>` + anh.map((a) => `<img src="${escAttr(a.url)}" alt="${escAttr(v.ten_vi_thuoc)}${a.giai_doan ? ' — ' + escAttr(a.giai_doan) : ''}" loading="lazy">`).join('')
    : ''

  const baiThuocLinks = baiThuoc.length
    ? `<h2>Bài thuốc có dùng vị này (${baiThuoc.length})</h2><ul>${baiThuoc.slice(0, 100).map((b) => `<li><a href="/bai-thuoc/${escAttr(b.slug)}/">${escText(b.ten)}</a></li>`).join('')}</ul>`
    : ''

  return '<div data-seo-stub>'
    + `<nav aria-label="Breadcrumb"><a href="/">Trang Chủ</a> › <a href="/duoc-lieu/">Từ Điển Dược Liệu</a> › ${escText(v.ten_vi_thuoc)}</nav>`
    + `<h1>${escText(v.ten_vi_thuoc)}</h1>`
    + (idBlock ? `<p>${idBlock}</p>` : '')
    + (tvqk ? `<p>${tvqk}</p>` : '')
    + nhomLine
    + (tenGoiKhac.length ? `<p>Tên gọi khác: ${tenGoiKhac.map((t) => escText(t.ten)).join(', ')}</p>` : '')
    + chipList('Công dụng', congDung, 'ten')
    + chipList('Chủ trị', chuTriLinks, 'ten')
    + chipList('Kiêng kỵ', kiengKy, 'ten')
    + chipList('Quy kinh (đường kinh)', kinhMach, 'ten')
    + (v.mo_ta ? `<h2>Mô tả</h2>${paras(v.mo_ta)}` : '')
    + (v.thanh_phan ? `<h2>Thành phần hoá học</h2>${paras(v.thanh_phan)}` : '')
    + (v.duoc_ly ? `<h2>Dược lý</h2>${paras(v.duoc_ly)}` : '')
    + (v.tinh_vi_quy_kinh ? `<h2>Tính vị quy kinh (y văn)</h2>${paras(v.tinh_vi_quy_kinh)}` : '')
    + (v.chu_tri ? `<h2>Chủ trị (y văn)</h2>${paras(v.chu_tri)}` : '')
    + (v.nuoi_duong ? `<h2>Nuôi trồng</h2>${paras(v.nuoi_duong)}` : '')
    + (v.bao_che ? `<h2>Bào chế</h2>${paras(v.bao_che)}` : '')
    + (v.don_thuoc ? `<h2>Đơn thuốc tham khảo</h2>${paras(v.don_thuoc)}` : '')
    + (v.tham_khao ? `<h2>Tham khảo</h2>${paras(v.tham_khao)}` : '')
    + gallery
    + baiThuocLinks
    + `<p>Thông tin tra cứu Đông Y — không tự ý dùng, hãy hỏi thầy thuốc Y Học Cổ Truyền.</p>`
    + `<p>Đang tải ứng dụng…</p></div>`
}

;(async () => {
  // Thiếu cấu hình DB (vd Docker build không truyền env) → bỏ qua, không làm gãy build.
  const hasDb = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DB_HOST || process.env.POSTGRES_HOST
  if (!hasDb) {
    console.warn('⚠ build-duoc-lieu: thiếu cấu hình DB — BỎ QUA prerender dược liệu (build vẫn tiếp tục).')
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
    console.warn('⚠ build-duoc-lieu: không kết nối được DB (' + e.message + ') — BỎ QUA prerender dược liệu (build vẫn tiếp tục).')
    process.exit(0)
  }

  // Tuần tự (không Promise.all) — pg.Client dùng 1 connection, chạy nhiều query đồng thời trên
  // cùng client là hành vi deprecated (sẽ bị bỏ ở pg@9).
  const rowsQ = await client.query(`SELECT id, ten_vi_thuoc, tinh, vi, quy_kinh, lieu_dung, ten_khoa_hoc, ten_han, ten_pinyin,
      bo_phan_dung, xuat_xu, ho_khoa_hoc, ten_khac, mo_ta, thanh_phan, duoc_ly, tinh_vi_quy_kinh,
      nuoi_duong, bao_che, don_thuoc, chu_tri, tham_khao FROM vi_thuoc ORDER BY id`)
  const congDungQ = await client.query(`SELECT vtc.id_vi_thuoc, cd.ten_cong_dung AS ten FROM vi_thuoc_cong_dung vtc
      JOIN cong_dung cd ON cd.id = vtc.id_cong_dung`)
  const chuTriQ = await client.query(`SELECT vtc.id_vi_thuoc, ct.ten_chu_tri AS ten FROM vi_thuoc_chu_tri vtc
      JOIN chu_tri ct ON ct.id = vtc.id_chu_tri`)
  const kiengKyQ = await client.query(`SELECT vtk.id_vi_thuoc, kk.ten_kieng_ky AS ten FROM vi_thuoc_kieng_ky vtk
      JOIN kieng_ky kk ON kk.id = vtk.id_kieng_ky`)
  const kinhMachQ = await client.query(`SELECT vkm.id_vi_thuoc, km.ten_kinh_mach AS ten FROM vi_thuoc_kinh_mach vkm
      JOIN kinh_mach km ON km.id_kinh_mach = vkm.id_kinh_mach`)
  const tenGoiKhacQ = await client.query(`SELECT id_vi_thuoc, ten_goi_khac AS ten FROM vi_thuoc_ten_goi_khac`)
  const anhQ = await client.query(`SELECT id_vi_thuoc, url, giai_doan FROM vi_thuoc_anh ORDER BY id_vi_thuoc, thu_tu`)
  const baiThuocQ = await client.query(`SELECT (e->>'id')::int AS id_vi_thuoc, p.ten, p.slug FROM phuong_thang p,
      jsonb_array_elements(p.thanh_phan) e WHERE p.thanh_phan IS NOT NULL`)
  const nhomQ = await client.query(`SELECT nnv.id_vi_thuoc, nn.id AS nho_id, nn.ten_nhom AS nho_ten, nl.id AS lon_id, nl.ten_nhom AS lon_ten
      FROM nhom_nho_vi_thuoc nnv
      JOIN nhom_nho_duoc_ly nn ON nn.id = nnv.id_nhom_nho
      JOIN nhom_lon_duoc_ly nl ON nl.id = nn.id_nhom_lon`)
  await client.end()

  const rows = rowsQ.rows
  const rel = {
    congDung: groupBy(congDungQ.rows, 'id_vi_thuoc'),
    chuTri: groupBy(chuTriQ.rows, 'id_vi_thuoc'),
    kiengKy: groupBy(kiengKyQ.rows, 'id_vi_thuoc'),
    kinhMach: groupBy(kinhMachQ.rows, 'id_vi_thuoc'),
    tenGoiKhac: groupBy(tenGoiKhacQ.rows, 'id_vi_thuoc'),
    anh: groupBy(anhQ.rows, 'id_vi_thuoc'),
    baiThuoc: groupBy(baiThuocQ.rows, 'id_vi_thuoc'),
    nhom: groupBy(nhomQ.rows, 'id_vi_thuoc'),
  }

  const urls = []
  let n = 0
  for (const v of rows) {
    const url = `${DOMAIN}/duoc-lieu/${v.id}/`
    const congDungNames = (rel.congDung.get(v.id) || []).map((r) => r.ten)
    const title = `${v.ten_vi_thuoc} — Vị thuốc Đông Y${v.xuat_xu ? ' (' + v.xuat_xu + ')' : ''} | Kinh Lạc Trương Gia`
    const descSrc = v.mo_ta || v.chu_tri || (congDungNames.length ? `Công dụng: ${congDungNames.join(', ')}.` : '')
    const desc = `Vị thuốc ${v.ten_vi_thuoc}${v.tinh || v.vi ? ` — tính ${v.tinh || '?'}, vị ${v.vi || '?'}` : ''}. ${descSrc}`.slice(0, 300)
    const jsonLd = {
      '@context': 'https://schema.org', '@type': 'MedicalWebPage', inLanguage: 'vi', url,
      name: v.ten_vi_thuoc, description: desc, isAccessibleForFree: true,
      about: {
        '@type': 'Drug', name: v.ten_vi_thuoc,
        ...(v.ten_khoa_hoc ? { alternateName: v.ten_khoa_hoc } : {}),
        ...(v.mo_ta ? { description: v.mo_ta.slice(0, 500) } : {}),
        ...(congDungNames.length ? { indication: congDungNames } : {}),
      },
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
    // Không dùng \s* (chỉ khớp div RỖNG) — xem chú thích cùng chỗ trong build-phuong.mjs:
    // prerender-seo.mjs chạy trước đã làm div không còn rỗng, [\s\S]*? khớp và thay đúng.
    html = html.replace(/<div id="app">[\s\S]*?<\/div>/i, `<div id="app">${stub(v, rel)}</div>`)

    const outDir = join(distDir, 'duoc-lieu', String(v.id))
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'index.html'), html, 'utf8')
    urls.push(url)
    if (++n % 500 === 0) console.log(`  …${n}/${rows.length}`)
  }

  // Nạp URL dược liệu vào sitemap (chèn trước </urlset>); nếu chưa có sitemap thì bỏ qua.
  const smPath = resolve(distDir, 'sitemap.xml')
  if (existsSync(smPath)) {
    const lastmod = new Date().toISOString().slice(0, 10)
    const entries = urls.map((u) => `<url><loc>${u}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`).join('\n')
    const sm = readFileSync(smPath, 'utf8')
    if (sm.includes('</urlset>')) writeFileSync(smPath, sm.replace('</urlset>', entries + '\n</urlset>'), 'utf8')
  }

  console.log(`✓ build-duoc-lieu: ${n} trang dược liệu tĩnh + ${urls.length} URL vào sitemap.`)
})().catch((e) => { console.warn('⚠ build-duoc-lieu: lỗi khi prerender (' + (e && e.message) + ') — BỎ QUA, build vẫn tiếp tục.'); process.exit(0) })
