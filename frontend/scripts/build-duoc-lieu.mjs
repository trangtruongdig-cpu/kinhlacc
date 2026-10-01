// build-duoc-lieu.mjs — Prerender SEO cho TỪNG vị thuốc/dược liệu (/duoc-lieu/<id>/index.html) từ DB vi_thuoc.
// Mirror build-phuong.mjs: chèn title/meta/canonical/OG/JSON-LD + khối nội dung tĩnh (có link nội bộ sang
// /bai-thuoc/<slug>/) vào dist/index.html; Vue mount sẽ thay #app → user thấy SPA, bot thấy nội dung.
// Chạy SAU vite build (cần dist/index.html). Cũng nạp URL dược liệu vào dist/sitemap.xml.
//
// Khác build-phuong.mjs: vi_thuoc không có 1 cột JSON gộp hết — công dụng/chủ trị/kiêng kỵ/kinh mạch/tên
// gọi khác/ảnh nằm ở 6 bảng liên kết riêng. Để tránh ~1.043 × 6 query, mỗi bảng liên kết chỉ query 1 lần
// (lấy toàn bộ), rồi group theo id_vi_thuoc trong JS trước khi ghép với hàng vi_thuoc.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
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
  console.warn('⚠ build-duoc-lieu: không nạp được module pg (' + e.message + ') — BỎ QUA prerender dược liệu (build vẫn tiếp tục).')
  process.exit(0)
}
try { require(join(BE, 'node_modules/dotenv')).config({ path: join(BE, '.env') }) } catch { /* env đã có sẵn từ môi trường runtime */ }

import { napGhiDe, seoTrang, luuTuSinh } from './seo-cms.mjs'
import { tieuDeSeo, toAbs, SITE, OG_IMAGE } from './seo-html.mjs'
import { dungMucLuc } from './muc-luc.mjs'

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
// Mô tả ghép từ nhiều mảnh, mảnh nào có thì thêm. Trước đây vị chưa biên soạn chỉ ra
// "Vị thuốc Tất Ma Tử." (195 trang dưới 70 ký tự) dù đã có sẵn quy kinh, công dụng,
// số bài thuốc dùng vị đó — những thứ người tìm kiếm cần đọc thấy ngay ở kết quả.
const cau = (t) => String(t || '').replace(/\s+/g, ' ').trim().replace(/[\s.;,:]+$/, '')
const moTaViThuoc = (v, rel, congDung) => {
  const tv = [v.tinh && `tính ${cau(v.tinh).toLowerCase()}`, v.vi && `vị ${cau(v.vi).toLowerCase()}`].filter(Boolean)
  const phan = [`Vị thuốc ${v.ten_vi_thuoc}${v.ten_khoa_hoc ? ` (${cau(v.ten_khoa_hoc)})` : ''}${tv.length ? ': ' + tv.join(', ') : ''}.`]
  const kinh = (rel.kinhMach.get(v.id) || []).map((r) => r.ten)
  if (kinh.length) phan.push(`Quy kinh ${kinh.join(', ')}.`)
  const vanXuoi = cau(v.mo_ta || v.chu_tri)
  if (vanXuoi) phan.push(vanXuoi + '.')
  else if (congDung.length) phan.push(`Công dụng: ${congDung.slice(0, 6).join(', ')}.`)
  const soBai = new Set((rel.baiThuoc.get(v.id) || []).map((r) => r.slug)).size
  if (soBai) phan.push(`Có mặt trong ${soBai} bài thuốc.`)
  return clipMoTa(phan.join(' '))
}


const distDir = process.env.DIST_DIR ? resolve(process.env.DIST_DIR) : resolve(root, 'dist')
const DOMAIN = (process.env.SITE_DOMAIN || 'https://kinhlac.online').replace(/\/+$/, '')
const indexPath = resolve(distDir, 'index.html')
if (!existsSync(indexPath)) { console.error('✗ Chưa có dist/index.html — chạy vite build trước.'); process.exit(1) }
const baseHtml = readFileSync(indexPath, 'utf8')

const escAttr = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escText = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')


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
  const nguon = rel.nguon.get(v.id) || []

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
    + (nguon.length
        ? `<p>Nguồn y văn: ${nguon.map((g) => `<a href="/nguon/${escAttr(g.slug)}/">${escText(g.ten)}</a>`).join(', ')}</p>`
        : '')
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
    ssl: sslConfig(),
    ...HEN_GIO_DB,
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
      nuoi_duong, bao_che, don_thuoc, chu_tri, tham_khao, anh_dai_dien FROM vi_thuoc ORDER BY id`)
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

  // Liên kết VỀ NGUỒN. Trước đây trang dược liệu không trỏ về thư mục nguồn nào.
  // Quan hệ lấy từ bảng nối nguon_vi_thuoc (1.322 liên kết), KHÔNG khớp chuỗi.
  let nguonQ = { rows: [] }
  try {
    nguonQ = await client.query(
      `SELECT nv.vi_thuoc_id AS id_vi_thuoc, n.slug, n.ten FROM nguon_vi_thuoc nv
       JOIN nguon n ON n.id = nv.nguon_id
       WHERE n.slug IS NOT NULL AND n.slug <> '' ORDER BY n.ten`)
  } catch (e) {
    console.warn('⚠ build-duoc-lieu: không đọc được nguon_vi_thuoc (' + e.message + ') — bỏ khối liên kết nguồn.')
  }
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
    nguon: groupBy(nguonQ.rows, 'id_vi_thuoc'),
  }

  // ── Van chống thin/doorway trên site YMYL ─────────────────────────────────
  // Đo trên 1.045 vị (25/09/2026): 840 vị (80,4%) RỖNG hoàn toàn 9 trường văn xuôi —
  // chỉ có tên + tính + vị + quy kinh. 205 vị đã biên soạn thì rất dày (p90 ~7.957 ký tự).
  // Luật: chỉ MỜI bot vào trang đã có người biên soạn. Trang chưa biên soạn vẫn dựng để
  // liên kết nội bộ chạy, mở dần khi kho nội dung đầy lên.
  const VAN_XUOI = ['mo_ta', 'thanh_phan', 'duoc_ly', 'tinh_vi_quy_kinh', 'nuoi_duong',
                    'bao_che', 'don_thuoc', 'chu_tri', 'tham_khao']
  const daBienSoan = (v) => VAN_XUOI.some((f) => String(v[f] ?? '').trim().length > 0)

  const urls = []
  const mucLuc = []
  let n = 0
  let nNoindex = 0
  for (const v of rows) {
    const url = `${DOMAIN}/duoc-lieu/${v.id}/`
    const congDungNames = (rel.congDung.get(v.id) || []).map((r) => r.ten)
    // Ảnh chia sẻ: ảnh đại diện của vị (URL CMS) khi có — trước đây cả 1.113 trang dùng
    // ảnh mặc định dù 536 vị đã có ảnh riêng.
    const anh = String(v.anh_dai_dien || '').trim()
    const seo = seoTrang(ghiDeSEO, 'duoc_lieu', String(v.id), {
      // Tên sách không vào tiêu đề (xem tieuDeSeo trong seo-html.mjs).
      title: tieuDeSeo(v.ten_vi_thuoc, ': Tính Vị, Công Dụng & Cách Dùng', ' — Vị Thuốc Đông Y', ' — Vị Thuốc'),
      description: moTaViThuoc(v, rel, congDungNames),
      canonical: url,
      ogImage: anh ? toAbs(anh) : OG_IMAGE,
      index: daBienSoan(v),
    })
    const index = seo.index !== false && seo.canonical === url
    if (!index) nNoindex++
    const jsonLd = [
      {
        '@context': 'https://schema.org', '@type': 'MedicalWebPage', inLanguage: 'vi', url,
        name: v.ten_vi_thuoc, description: seo.description, isAccessibleForFree: true,
        image: seo.ogImage,
        publisher: { '@type': 'Organization', name: SITE, logo: { '@type': 'ImageObject', url: `${DOMAIN}/logo-512.png` } },
        about: {
          '@type': 'Drug', name: v.ten_vi_thuoc,
          ...(v.ten_khoa_hoc ? { alternateName: v.ten_khoa_hoc } : {}),
          ...(v.mo_ta ? { description: v.mo_ta.slice(0, 500) } : {}),
          ...(congDungNames.length ? { indication: congDungNames } : {}),
        },
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang Chủ', item: DOMAIN + '/' },
          { '@type': 'ListItem', position: 2, name: 'Từ Điển Dược Liệu', item: `${DOMAIN}/duoc-lieu/` },
          { '@type': 'ListItem', position: 3, name: v.ten_vi_thuoc, item: url },
        ],
      },
    ]
    let html = datMetaSeo(baseHtml, seo, url)
    html = setJsonLd(html, jsonLd)
    // Không dùng \s* (chỉ khớp div RỖNG) — xem chú thích cùng chỗ trong build-phuong.mjs:
    // prerender-seo.mjs chạy trước đã làm div không còn rỗng, [\s\S]*? khớp và thay đúng.
    html = html.replace(/<div id="app">[\s\S]*?<\/div>/i, `<div id="app">${stub(v, rel)}</div>`)

    const outDir = join(distDir, 'duoc-lieu', String(v.id))
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'index.html'), html, 'utf8')
    if (index) {
      urls.push(url)
      mucLuc.push({ ten: v.ten_vi_thuoc, url, phu: [v.ten_khoa_hoc, [v.tinh && `tính ${cau(v.tinh).toLowerCase()}`, v.vi && `vị ${cau(v.vi).toLowerCase()}`].filter(Boolean).join(', ')].filter(Boolean).join(' — ') })
    }
    if (++n % 500 === 0) console.log(`  …${n}/${rows.length}`)
  }

  // Mục lục A–Z tĩnh — xem muc-luc.mjs.
  const urlMucLuc = dungMucLuc({
    distDir, dir: 'duoc-lieu', ten: 'Dược Liệu', muc: mucLuc,
    gioiThieu: 'Từ điển dược liệu Đông Y: tính vị, quy kinh, công dụng, chủ trị và bài thuốc có dùng vị đó.',
  })
  urls.push(...urlMucLuc)
  console.log(`  mục lục A–Z: ${urlMucLuc.length} trang, ${mucLuc.length} vị.`)

  // Nạp URL dược liệu vào sitemap (chèn trước </urlset>); nếu chưa có sitemap thì bỏ qua.
  const smPath = resolve(distDir, 'sitemap.xml')
  // ⚠️ loaiTru: /duoc-lieu/ chứa cả /duoc-lieu/nhom/ của build-nhom-duoc-ly — không loại
  // ra thì bước này xoá mất 62 URL nhóm dược lý mỗi lần chạy.
  chenUrl(smPath, '/duoc-lieu/', urls, {
    // KHÔNG còn lastmod = ngày build (xem ngay-cms.mjs): đường dẫn ở đây là /duoc-lieu/<id>/
    // theo id của app, còn CMS khoá theo slug — chưa có bảng nối nên chưa tra được ngày sửa
    // thật. Bỏ hẳn thẻ lastmod tốt hơn là điền một ngày luôn đổi mỗi lần phát hành.
    loaiTru: ['/duoc-lieu/nhom/'], priority: '0.6',
  })

  luuTuSinh()
  console.log(`✓ build-duoc-lieu: ${n} trang dược liệu tĩnh (${nNoindex} noindex: chưa biên soạn văn xuôi) + ${urls.length} URL vào sitemap.`)
})().catch((e) => { console.warn('⚠ build-duoc-lieu: lỗi khi prerender (' + (e && e.message) + ') — BỎ QUA, build vẫn tiếp tục.'); process.exit(0) })
