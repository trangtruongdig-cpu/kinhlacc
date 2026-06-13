// build-dict.mjs — Sinh TRANG TĨNH cho từ điển (huyệt vị + đường kinh) chuẩn SEO/AEO.
//
// LỚP VIEW: chỉ render HTML. Dữ liệu/phân loại/quyết-noindex/slug lấy từ dict-data.mjs
// (nguồn sự thật chung với gen-sitemap.mjs & indexnow.mjs).
//
// Triết lý "THƯ VIỆN TRUNG THÀNH": in NGUYÊN VĂN y văn, không AI viết lại. Bố cục
// "Hồ sơ đóng hộp" (infobox-top). Mô hình TRỤ–NHÁNH: /kinh/<slug>/ ↔ /huyet/<slug>/.
//
// Chạy SAU `vite build` (cần dist/), hoặc DIST_DIR=… để thử. LIMIT_HUYET=N → sinh thử N huyệt.
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import {
  head, topbar, footer, disclaimer, ld, escText, escAttr,
  DOMAIN, SITE, DEFAULT_REVIEWER,
} from './seo-html.mjs'
import {
  meridianList, records, classify, recOfPoint, sec, kinhSlugOf,
  LOAI_LABEL, HUYET_SECTIONS, KINH_SECTIONS, huyetIndexable, kinhIndexable,
  BENH, BENH_SETS, benhIndexable, benhCross, huyetLinkTargets,
  traitsByAcuId,
} from './dict-data.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const distDir = process.env.DIST_DIR ? resolve(process.env.DIST_DIR) : resolve(root, 'dist')
const BUILD_DATE = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10)
const LIMIT_HUYET = process.env.LIMIT_HUYET ? parseInt(process.env.LIMIT_HUYET, 10) : 0

const ASSET_BASE = '/kinhmach3d/'
const GENERIC_OG = `${DOMAIN}/kinhmach3d/images/meridians/kinh-01-sodo.jpg` // ảnh CÓ THẬT (tránh OG 404)

// ───────────────────────── Tiện ích render ──────────────────────────────────
// Cắt gọn ≤ max: ưu tiên ranh giới câu → từ; cân đối ngoặc kép “ ”.
function clip(t, max = 160) {
  const s = String(t || '').replace(/\s+/g, ' ').trim()
  if (s.length <= max) return s
  let cut = s.slice(0, max)
  const dot = cut.lastIndexOf('. ')
  const sp = cut.lastIndexOf(' ')
  cut = dot > 60 ? cut.slice(0, dot + 1) : sp > 60 ? cut.slice(0, sp).replace(/[,;:]$/, '') + '…' : cut + '…'
  const op = (cut.match(/“/g) || []).length
  const cl = (cut.match(/”/g) || []).length
  if (op > cl) cut = cut.replace(/“[^”]*$/, '').replace(/[\s,;:]+$/, '') + '…'
  return cut
}
function para(t) {
  return String(t || '').split(/\n+/).map((s) => s.trim()).filter(Boolean)
    .map((s) => `<p>${escText(s)}</p>`).join('')
}
function infoRow(label, valueHtml) {
  return valueHtml ? `<tr><th>${escText(label)}</th><td>${valueHtml}</td></tr>` : ''
}
// Mục thân bài (đóng khung cảnh báo nếu là thủ thuật châm/cứu — giữ nguyên văn nhưng cảnh báo).
function bodySection(label, body, caution) {
  if (!body) return ''
  const note = caution
    ? `<p class="dl-caution-note">⚠️ Thủ thuật châm/cứu phải do người có chuyên môn thực hiện; thông tin liều lượng dưới đây chỉ để <strong>tra cứu học thuật</strong>, không tự áp dụng.</p>`
    : ''
  return `<section class="dl-sec${caution ? ' dl-caution' : ''}"><h2>${escText(label)}</h2>${note}${para(body)}</section>`
}

// ───────────────────────── TRANG HUYỆT ──────────────────────────────────────
function leadHuyet(rec, cls) {
  let h
  if (cls.loai === 'kinh') h = `Huyệt ${rec.ten}${cls.code ? ` (${cls.code})` : ''} thuộc ${cls.kinhTen}.`
  else if (cls.loai === 'athi') h = `${rec.ten} là huyệt lấy theo điểm đau (A Thị Huyệt), không cố định vị trí.`
  else h = `${rec.ten} là một kỳ huyệt, nằm ngoài mười hai đường kinh chính.`
  const vt = clip(sec(rec, 'VỊ TRÍ'), 150)
  const ct = clip(sec(rec, 'CHỦ TRỊ') || sec(rec, 'TÁC DỤNG'), 150)
  return [h, vt && `Vị trí: ${vt}`, ct && `Chủ trị: ${ct}`].filter(Boolean).join(' ')
}

function huyetPage(rec) {
  const cls = classify(rec)
  const slug = rec._slug
  const url = `${DOMAIN}/huyet/${slug}/`
  const namePrefix = /huyệt/i.test(rec.ten) ? '' : 'Huyệt '
  const title = `${namePrefix}${rec.ten}${cls.loai === 'kinh' && cls.code ? ` (${cls.code})` : ''}`
  const lead = leadHuyet(rec, cls)
  const img = rec.image ? ASSET_BASE + String(rec.image).replace(/^\/+/, '') : null
  const ogImg = img
    ? DOMAIN + img
    : cls.loai === 'kinh' && cls.mer && cls.mer.images
      ? DOMAIN + ASSET_BASE + String(cls.mer.images.chinh || cls.mer.images.sodo || cls.mer.images.gen || '').replace(/^\/+/, '')
      : GENERIC_OG
  const indexable = huyetIndexable(rec)

  const traitNames = traitsByAcuId.get(rec.id) || []
  const traitHtml = traitNames.map((t) => `<span class="dl-trait-chip">${escText(t)}</span>`).join(' ')
  const chineseHtml = rec.chinese
    ? `<span class="dl-cn-char">${escText(rec.chinese)}</span>${rec.pinyin ? ` <em class="dl-cn-pinyin">${escText(rec.pinyin)}</em>` : ''}`
    : ''
  const infoRows = [
    infoRow('Mã WHO', cls.code ? `<strong>${escText(cls.code)}</strong>` : ''),
    infoRow('Tên khác', escText(sec(rec, 'TÊN KHÁC'))),
    infoRow('Đường kinh', cls.loai === 'kinh' ? `<a href="/kinh/${escAttr(cls.kinhSlug)}/">${escText(cls.kinhTen)}</a>` : ''),
    infoRow('Loại huyệt', escText(LOAI_LABEL[cls.loai])),
    infoRow('Phân Loại', traitHtml),
    infoRow('Hán Tự', chineseHtml),
    infoRow('Tiếng Anh', rec.english ? escText(rec.english) : ''),
    infoRow('Vị trí', escText(clip(sec(rec, 'VỊ TRÍ'), 140))),
  ].join('')
  const infobox = `<aside class="dl-info">
    <div class="dl-info-head">Hồ Sơ Huyệt</div>
    <div class="dl-info-body">
      ${img ? `<img class="dl-info-img" src="${escAttr(img)}" alt="Sơ đồ huyệt ${escAttr(rec.ten)}" loading="eager" width="320" height="320">` : ''}
      <table class="dl-info-tb"><tbody>${infoRows}</tbody></table>
    </div>
  </aside>`

  let body = ''
  for (const [h, label, caution] of HUYET_SECTIONS) body += bodySection(label, sec(rec, h), caution)
  body += bodySection('Phối Huyệt', rec.phoiHuyet, false)
  body += bodySection('Ghi Chú', rec.ghiChu, false)
  if (rec.thamKhao) body += `<section class="dl-sec dl-ref"><h2>Tham Khảo</h2>${para(rec.thamKhao)}</section>`

  let cungKinhHtml = ''
  if (cls.loai === 'kinh' && cls.mer) {
    const sibs = (cls.mer.points || [])
      .map((p) => recOfPoint(p))
      .filter((r) => r && r.id !== rec.id)
      .map((r) => ({ ten: r.ten, slug: r._slug }))
      .slice(0, 14)
    if (sibs.length)
      cungKinhHtml = `<section class="dl-rel"><h2>Huyệt Cùng ${escText(cls.kinhTen)}</h2><ul class="dl-rel-list">${sibs
        .map((p) => `<li><a href="/huyet/${escAttr(p.slug)}/">${escText(p.ten)}</a></li>`).join('')}</ul></section>`
  }

  const badge = cls.loai === 'kinh'
    ? `<span class="dl-badge">${escText(cls.kinhTen)}${cls.code ? ` · ${escText(cls.code)}` : ''}</span>`
    : `<span class="dl-badge dl-badge-alt">${escText(LOAI_LABEL[cls.loai])}</span>`

  const crumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Trang Chủ', item: DOMAIN + '/' },
    { '@type': 'ListItem', position: 2, name: 'Từ Điển Huyệt Vị', item: DOMAIN + '/thu-vien' },
  ]
  if (cls.loai === 'kinh') crumbItems.push({ '@type': 'ListItem', position: 3, name: cls.kinhTen, item: `${DOMAIN}/kinh/${cls.kinhSlug}/` })
  crumbItems.push({ '@type': 'ListItem', position: crumbItems.length + 1, name: title, item: url })

  const jsonLds = [
    ld({
      '@context': 'https://schema.org', '@type': 'MedicalWebPage',
      name: title, description: clip(lead, 200), inLanguage: 'vi', url,
      about: {
        '@type': 'MedicalEntity', name: rec.ten,
        ...(cls.code ? { code: { '@type': 'MedicalCode', code: cls.code, codingSystem: 'WHO Standard Acupuncture Point Locations' } } : {}),
      },
      publisher: { '@type': 'Organization', name: SITE, logo: { '@type': 'ImageObject', url: `${DOMAIN}/favicon.svg` } },
      image: ogImg,
    }),
    ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbItems }),
  ]

  const crumbHtml = `<nav class="bl-crumb"><a href="/">Trang Chủ</a> › <a href="/thu-vien">Từ Điển</a>${
    cls.loai === 'kinh' ? ` › <a href="/kinh/${escAttr(cls.kinhSlug)}/">${escText(cls.kinhTen)}</a>` : ''
  } › <span>${escText(rec.ten)}</span></nav>`

  const htmlDoc = head({
    title: `${title} — ${SITE}`, description: clip(lead, 160), canonical: url,
    jsonLds, ogImage: ogImg, index: indexable, extraHead: DICT_STYLE,
  }) +
    `<body>${topbar}
<main class="bl-main"><article class="bl-article dl-article">
  ${crumbHtml}
  <h1>${escText(title)} ${badge}</h1>
  <p class="dl-byline"><span class="bl-review-badge">✔ Đã rà soát chuyên môn</span> ${escText(DEFAULT_REVIEWER)} · Cập nhật ${escText(BUILD_DATE)}</p>
  ${infobox}
  <p class="dl-lead">${escText(lead)}</p>
  <div class="bl-body">${body}</div>
  <div class="bl-cta"><a href="/xem-3d">Khám Phá Đồ Hình Kinh Lạc 3D →</a></div>
  ${cungKinhHtml}
  ${cls.loai === 'kinh' ? `<p class="dl-up">↑ <a href="/kinh/${escAttr(cls.kinhSlug)}/">Về ${escText(cls.kinhTen)}</a></p>` : ''}
  ${disclaimer({ note: 'Thông tin huyệt vị trên trang này' })}
</article></main>
${footer}</body></html>`
  return { htmlDoc, indexable, loai: cls.loai, hasImg: !!img }
}

// ───────────────────────── TRANG KINH (TRỤ) ─────────────────────────────────
function kinhPage(m) {
  const slug = kinhSlugOf(m)
  const url = `${DOMAIN}/kinh/${slug}/`
  const sodo = m.images && (m.images.chinh || m.images.sodo || m.images.gen)
  const img = sodo ? ASSET_BASE + String(sodo).replace(/^\/+/, '') : null
  const ogImg = img ? DOMAIN + img : GENERIC_OG
  const lead = [
    `${m.ten}${m.code ? ` (mã ${m.code})` : ''}.`,
    m.pointSummary ? clip(m.pointSummary, 120) : '',
    clip(m.desc || m.dacTinh || '', 140),
  ].filter(Boolean).join(' ')

  const infoRows = [
    infoRow('Mã', m.code ? `<strong>${escText(m.code)}</strong>` : ''),
    infoRow('Tên khác', escText(m.nameAlt || '')),
    infoRow('Số huyệt', m.pointSummary ? escText(m.pointSummary.replace(/\n[\s\S]*/, '')) : ''),
  ].join('')
  const infobox = `<aside class="dl-info">
    <div class="dl-info-head">Hồ Sơ Đường Kinh</div>
    <div class="dl-info-body">
      ${img ? `<img class="dl-info-img" src="${escAttr(img)}" alt="Sơ đồ ${escAttr(m.ten)}" loading="eager">` : ''}
      <table class="dl-info-tb"><tbody>${infoRows}</tbody></table>
    </div>
  </aside>`

  let body = ''
  for (const [k, label, caution] of KINH_SECTIONS) body += bodySection(label, m[k], caution)

  const pts = (m.points || []).map((p) => ({ rec: recOfPoint(p), ten: p.ten, code: p.code }))
  const ptsHtml = pts.length
    ? `<section class="dl-rel"><h2>Các Huyệt Trên ${escText(m.ten)}</h2><ul class="dl-rel-list">${pts
        .map((p) => p.rec
          ? `<li><a href="/huyet/${escAttr(p.rec._slug)}/">${escText(p.rec.ten)}${p.code ? ` <small>${escText(p.code)}</small>` : ''}</a></li>`
          : `<li>${escText(p.ten)}${p.code ? ` <small>${escText(p.code)}</small>` : ''}</li>`).join('')}</ul></section>`
    : ''

  const indexable = kinhIndexable(m)
  const jsonLds = [
    ld({
      '@context': 'https://schema.org', '@type': 'MedicalWebPage',
      name: m.ten, description: clip(lead, 200), inLanguage: 'vi', url,
      about: { '@type': 'MedicalEntity', name: m.ten },
      publisher: { '@type': 'Organization', name: SITE, logo: { '@type': 'ImageObject', url: `${DOMAIN}/favicon.svg` } },
      image: ogImg,
    }),
    ld({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang Chủ', item: DOMAIN + '/' },
        { '@type': 'ListItem', position: 2, name: 'Từ Điển', item: DOMAIN + '/thu-vien' },
        { '@type': 'ListItem', position: 3, name: m.ten, item: url },
      ],
    }),
  ]

  const htmlDoc = head({
    title: `${m.ten} — Đồ Hình, Huyệt Vị & Chủ Trị — ${SITE}`,
    description: clip(lead, 160), canonical: url, jsonLds, ogImage: ogImg, index: indexable, extraHead: DICT_STYLE,
  }) +
    `<body>${topbar}
<main class="bl-main"><article class="bl-article dl-article">
  <nav class="bl-crumb"><a href="/">Trang Chủ</a> › <a href="/thu-vien">Từ Điển</a> › <span>${escText(m.ten)}</span></nav>
  <h1>${escText(m.ten)} <span class="dl-badge">${escText(m.code || 'Đường kinh')}</span></h1>
  <p class="dl-byline"><span class="bl-review-badge">✔ Đã rà soát chuyên môn</span> ${escText(DEFAULT_REVIEWER)} · Cập nhật ${escText(BUILD_DATE)}</p>
  ${infobox}
  <p class="dl-lead">${escText(lead)}</p>
  <div class="bl-body">${body}</div>
  ${ptsHtml}
  <div class="bl-cta"><a href="/xem-3d">Khám Phá ${escText(m.ten)} Trên Mô Hình 3D →</a></div>
  ${disclaimer({ note: 'Thông tin đường kinh trên trang này' })}
</article></main>
${footer}</body></html>`
  return { htmlDoc, indexable }
}

// ───────────────────────── CSS riêng cho từ điển ────────────────────────────
const DICT_STYLE = `<style>
  .dl-article .dl-badge{display:inline-block;font-size:.5em;font-weight:600;vertical-align:middle;background:#6b4423;color:#fff;padding:.18em .6em;border-radius:999px;margin-left:.4em}
  .dl-article .dl-badge-alt{background:#9a7b53}
  .dl-byline{font-size:.85rem;color:#7a6a55;margin:.2rem 0 1rem}
  .dl-info{border:1px solid #e3d6c2;border-radius:12px;background:#faf6ef;margin:0 0 1.4rem;overflow:hidden}
  .dl-info-head{background:#6b4423;color:#fff;font-weight:600;padding:.5rem .9rem;letter-spacing:.02em}
  .dl-info-body{display:flex;gap:1rem;flex-wrap:wrap;padding:1rem;align-items:flex-start}
  .dl-info-img{width:200px;height:auto;border-radius:8px;object-fit:cover;background:#fff}
  .dl-info-tb{border-collapse:collapse;flex:1;min-width:240px}
  .dl-info-tb th{text-align:left;vertical-align:top;color:#7a6a55;font-weight:600;padding:.32rem .8rem .32rem 0;white-space:nowrap;width:1%}
  .dl-info-tb td{vertical-align:top;padding:.32rem 0;border-bottom:1px solid #efe6d6}
  .dl-lead{font-size:1.08rem;line-height:1.7;background:#fffdf8;border-left:4px solid #6b4423;padding:.8rem 1rem;border-radius:0 8px 8px 0;margin:0 0 1.6rem}
  .dl-cross{margin:0 0 1.5rem;padding:.7rem 1rem;background:#f3ebdd;border:1px solid #e3d6c2;border-left:4px solid #9a7b53;border-radius:0 8px 8px 0}
  .dl-cross a{font-weight:600;color:#5a4427;text-decoration:none}
  .dl-cross a:hover{text-decoration:underline}
  .dl-caution{background:#fbf4ea;border:1px solid #ecdcc2;border-radius:10px;padding:.4rem 1rem;margin:1rem 0}
  .dl-caution-note{font-size:.88rem;color:#8a5a2b;background:#f6e9d6;border-radius:8px;padding:.5rem .8rem;margin:.4rem 0}
  .dl-rel{margin-top:2rem;border-top:1px dashed #e3d6c2;padding-top:1rem}
  .dl-rel-list{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:.5rem}
  .dl-rel-list li a,.dl-rel-list li{display:inline-block;background:#f3ebdd;border-radius:8px;padding:.3rem .7rem;font-size:.92rem;text-decoration:none;color:#5a4427}
  .dl-rel-list li a:hover{background:#e7d8bf}
  .dl-rel-list small{opacity:.7}
  .dl-up{margin-top:1.2rem;font-weight:600}
  .dl-ref{font-size:.9rem;color:#6a5a45}
  .dl-trait-chip{display:inline-block;background:#f3ebdd;border:1px solid #d4b896;border-radius:6px;padding:.1em .55em;font-size:.85rem;color:#5a4427;margin:.1em .2em .1em 0}
  .dl-cn-char{font-size:1.15rem;font-weight:700;color:#3d2b0e}
  .dl-cn-pinyin{font-size:.88rem;color:#7a6a55;font-style:italic}
  @media(max-width:560px){.dl-info-img{width:100%}}
</style>`

// ───────────────────────── TRANG HUB (mục lục — "đường vào") ────────────────
const chip = (href, text, small) =>
  `<li><a href="${escAttr(href)}">${escText(text)}${small ? ` <small>${escText(small)}</small>` : ''}</a></li>`

function hubDoc({ title, h1, badge, intro, top = '', sections, url, desc }) {
  const jsonLds = [
    ld({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: h1, inLanguage: 'vi', url }),
    ld({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang Chủ', item: DOMAIN + '/' },
        { '@type': 'ListItem', position: 2, name: 'Từ Điển', item: DOMAIN + '/thu-vien' },
        { '@type': 'ListItem', position: 3, name: h1, item: url },
      ],
    }),
  ]
  return head({ title, description: desc, canonical: url, jsonLds, ogImage: GENERIC_OG, extraHead: DICT_STYLE }) +
    `<body>${topbar}
<main class="bl-main"><article class="bl-article dl-article">
  <nav class="bl-crumb"><a href="/">Trang Chủ</a> › <a href="/thu-vien">Từ Điển</a> › <span>${escText(h1)}</span></nav>
  <h1>${escText(h1)} <span class="dl-badge">${escText(badge)}</span></h1>
  <p class="dl-lead">${escText(intro)}</p>
  ${top}
  ${sections}
  <div class="bl-cta"><a href="/xem-3d">Khám Phá Đồ Hình Kinh Lạc 3D →</a></div>
  ${disclaimer({ note: 'Thông tin kinh lạc – huyệt vị trên trang này' })}
</article></main>
${footer}</body></html>`
}

function kinhIndexPage() {
  const items = meridianList.filter((m) => m && m.ten)
    .map((m) => chip(`/kinh/${kinhSlugOf(m)}/`, m.ten, m.code)).join('')
  return hubDoc({
    title: `Hệ Kinh Mạch: 12 Đường Kinh & 8 Mạch — ${SITE}`,
    desc: 'Danh mục đầy đủ 12 đường kinh chính và 8 mạch (Nhâm, Đốc, kỳ kinh bát mạch): đồ hình, huyệt vị, chủ trị theo y văn cổ truyền.',
    url: `${DOMAIN}/kinh/`, h1: 'Hệ Kinh Mạch', badge: `${meridianList.length} đường`,
    intro: 'Mười hai đường kinh chính và tám mạch (Nhâm, Đốc cùng kỳ kinh bát mạch) — bấm vào từng kinh để xem đồ hình, danh sách huyệt và chủ trị.',
    sections: `<section class="dl-rel"><ul class="dl-rel-list">${items}</ul></section>`,
  })
}

function huyetIndexPage() {
  const kinhIds = new Set()
  let sections = ''
  for (const m of meridianList) {
    if (!m || !m.ten) continue
    const recs = (m.points || []).map((p) => recOfPoint(p)).filter(Boolean)
    for (const r of recs) kinhIds.add(r.id)
    if (!recs.length) continue
    sections += `<section class="dl-rel"><h2><a href="/kinh/${escAttr(kinhSlugOf(m))}/">${escText(m.ten)}</a></h2><ul class="dl-rel-list">${recs.map((r) => chip(`/huyet/${r._slug}/`, r.ten)).join('')}</ul></section>`
  }
  // Kỳ huyệt / A Thị: KHÔNG nằm trên kinh nào → trang hub này là ĐƯỜNG VÀO duy nhất cho chúng.
  const others = records.filter((r) => r && r.ten && !kinhIds.has(r.id))
  if (others.length)
    sections += `<section class="dl-rel"><h2>Kỳ Huyệt &amp; Huyệt Ngoài Kinh (${others.length})</h2><ul class="dl-rel-list">${others.map((r) => chip(`/huyet/${r._slug}/`, r.ten)).join('')}</ul></section>`
  return hubDoc({
    title: `Tra Cứu Huyệt Vị: ${records.length} Huyệt Theo Đường Kinh — ${SITE}`,
    desc: `Danh mục ${records.length} huyệt vị châm cứu sắp theo 12 đường kinh và nhóm kỳ huyệt: vị trí, chủ trị, cách châm cứu theo y văn cổ truyền.`,
    url: `${DOMAIN}/huyet/`, h1: 'Tra Cứu Huyệt Vị', badge: `${records.length} huyệt`,
    intro: 'Toàn bộ huyệt vị sắp theo đường kinh; nhóm cuối là kỳ huyệt & huyệt ngoài kinh. Bấm tên huyệt để xem hồ sơ đầy đủ (vị trí, chủ trị, châm cứu).',
    top: `<p><a href="/kinh/">→ Xem theo 12 đường kinh &amp; 8 mạch</a></p>`,
    sections,
  })
}

// ───────────────────────── TRANG BỆNH (bệnh học / châm cứu trị bệnh) ─────────
// "Thư viện trung thành": in NGUYÊN VĂN từng trường (theo set.fields), không AI viết lại.
function benhPage(rec, set, cfg) {
  const slug = rec._slug
  const url = `${DOMAIN}/${cfg.dir}/${slug}/`
  const title = rec.ten
  const firstBody = (() => { for (const [k] of set.fields) if (rec[k]) return rec[k]; return '' })()
  const lead = clip(
    [`${rec.ten}${rec._meta ? ` (${set.metaLabel}: ${rec._meta})` : ''}.`, clip(firstBody, 170)].filter(Boolean).join(' '),
    240,
  )
  const indexable = benhIndexable(rec, set.fields)

  // Thân bài: in nguyên văn từng trường có nội dung; trường "điều trị" châm cứu → đóng khung cảnh báo.
  let body = ''
  for (const [k, label] of set.fields) {
    if (!rec[k]) continue
    body += bodySection(label, rec[k], cfg.cautionKey === k)
  }

  // Bệnh liên quan cùng bộ (lân cận trong danh mục) — tăng liên kết nội bộ + độ sâu crawl.
  const idx = set.records.indexOf(rec)
  const around = []
  for (let d = 1; around.length < 12 && d < set.records.length; d++) {
    const b = set.records[idx + d], a = set.records[idx - d]
    if (b && b.ten && b._slug !== slug) around.push(b)
    if (a && a.ten && a._slug !== slug) around.push(a)
  }
  const relHtml = around.length
    ? `<section class="dl-rel"><h2>Bệnh Khác Trong ${escText(set.title)}</h2><ul class="dl-rel-list">${around
        .slice(0, 12).map((r) => `<li><a href="/${escAttr(cfg.dir)}/${escAttr(r._slug)}/">${escText(r.ten)}</a></li>`).join('')}</ul></section>`
    : ''

  // Lớp 1 — cùng tên bệnh ở bộ KIA (2 góc nhìn) → khối nổi bật gần đầu trang.
  const cross = benhCross(rec, cfg.key)
  const crossCfg = cross ? BENH_SETS.find((c) => c.key !== cfg.key) : null
  const crossHtml = cross && crossCfg
    ? `<div class="dl-cross"><a href="/${escAttr(crossCfg.dir)}/${escAttr(cross._slug)}/">${crossCfg.key === 'ccdt' ? '🩺 Xem cách Châm Cứu Trị' : '📖 Xem Bệnh Học về'} “${escText(rec.ten)}” →</a></div>`
    : ''

  // Lớp 2 — huyệt được NHẮC trong nội dung → khối "Huyệt Vị Liên Quan" (KHÔNG sửa nguyên văn thân bài).
  const fullText = set.fields.map(([k]) => rec[k] || '').join('\n')
  const huyetHits = []
  const seenHuyet = new Set()
  for (const t of huyetLinkTargets()) {
    if (huyetHits.length >= 16) break
    if (seenHuyet.has(t.slug)) continue
    if (t.re.test(fullText)) { huyetHits.push(t); seenHuyet.add(t.slug) }
  }
  const huyetRelHtml = huyetHits.length
    ? `<section class="dl-rel"><h2>Huyệt Vị Nhắc Trong Bài (${huyetHits.length})</h2><ul class="dl-rel-list">${huyetHits
        .map((t) => `<li><a href="/huyet/${escAttr(t.slug)}/">${escText(t.ten)}</a></li>`).join('')}</ul></section>`
    : ''

  const infobox = rec._meta
    ? `<aside class="dl-info"><div class="dl-info-head">Hồ Sơ ${escText(set.title)}</div><div class="dl-info-body"><table class="dl-info-tb"><tbody>${infoRow(set.metaLabel, escText(rec._meta))}</tbody></table></div></aside>`
    : ''

  const jsonLds = [
    ld({
      '@context': 'https://schema.org', '@type': 'MedicalWebPage',
      name: title, description: clip(lead, 200), inLanguage: 'vi', url,
      about: { '@type': cfg.aboutType, name: rec.ten, ...(rec._meta ? { alternateName: rec._meta } : {}) },
      publisher: { '@type': 'Organization', name: SITE, logo: { '@type': 'ImageObject', url: `${DOMAIN}/favicon.svg` } },
      image: GENERIC_OG,
    }),
    ld({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang Chủ', item: DOMAIN + '/' },
        { '@type': 'ListItem', position: 2, name: 'Từ Điển', item: DOMAIN + '/thu-vien' },
        { '@type': 'ListItem', position: 3, name: set.title, item: `${DOMAIN}/${cfg.dir}/` },
        { '@type': 'ListItem', position: 4, name: title, item: url },
      ],
    }),
  ]

  const htmlDoc = head({
    title: `${title} — ${set.title} — ${SITE}`,
    description: clip(lead, 160), canonical: url, jsonLds, ogImage: GENERIC_OG, index: indexable, extraHead: DICT_STYLE,
  }) +
    `<body>${topbar}
<main class="bl-main"><article class="bl-article dl-article">
  <nav class="bl-crumb"><a href="/">Trang Chủ</a> › <a href="/thu-vien">Từ Điển</a> › <a href="/${escAttr(cfg.dir)}/">${escText(set.title)}</a> › <span>${escText(title)}</span></nav>
  <h1>${escText(title)} <span class="dl-badge dl-badge-alt">${escText(set.title)}</span></h1>
  <p class="dl-byline"><span class="bl-review-badge">✔ Đã rà soát chuyên môn</span> ${escText(DEFAULT_REVIEWER)} · Cập nhật ${escText(BUILD_DATE)}</p>
  ${infobox}
  <p class="dl-lead">${escText(lead)}</p>
  ${crossHtml}
  <div class="bl-body">${body}</div>
  <div class="bl-cta"><a href="/xem-ket-qua-do">Đo Kinh Lạc — Đọc Kết Quả Thành Biểu Đồ →</a></div>
  ${huyetRelHtml}
  ${relHtml}
  <p class="dl-up">↑ <a href="/${escAttr(cfg.dir)}/">Về danh mục ${escText(set.title)}</a></p>
  ${disclaimer({ note: `Thông tin về ${rec.ten} trên trang này` })}
</article></main>
${footer}</body></html>`
  return { htmlDoc, indexable }
}

function benhIndexPage(set, cfg) {
  const items = set.records.filter((r) => r && r.ten).map((r) => chip(`/${cfg.dir}/${r._slug}/`, r.ten)).join('')
  const fieldNames = (set.fields || []).map((f) => f[1]).slice(0, 4).join(', ')
  return hubDoc({
    title: `${set.title}: ${set.records.length} Bệnh Theo Y Văn Cổ Truyền — ${SITE}`,
    desc: `Danh mục ${set.records.length} bệnh trong "${set.title}" theo y văn Đông Y: ${fieldNames}…`,
    url: `${DOMAIN}/${cfg.dir}/`, h1: set.title, badge: `${set.records.length} bệnh`,
    intro: `Toàn bộ ${set.records.length} bệnh trong phần "${set.title}", trình bày nguyên văn theo y văn cổ truyền. Bấm tên bệnh để xem chi tiết (${fieldNames}…).`,
    sections: `<section class="dl-rel"><ul class="dl-rel-list">${items}</ul></section>`,
  })
}

// ───────────────────────── Chạy ─────────────────────────────────────────────
function writePage(kind, slug, html) {
  const dir = join(distDir, kind, slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html, 'utf8')
}

// Hai trang HUB mục lục ("đường vào") — nhất là cho 727 kỳ huyệt vốn không nằm trên kinh nào.
writePage('kinh', '', kinhIndexPage())
writePage('huyet', '', huyetIndexPage())

let nKinh = 0
let nKinhNoindex = 0
for (const m of meridianList) {
  if (!m || !m.ten) continue
  const { htmlDoc, indexable } = kinhPage(m)
  writePage('kinh', kinhSlugOf(m), htmlDoc)
  nKinh++
  if (!indexable) nKinhNoindex++
}

const subset = LIMIT_HUYET > 0 ? records.slice(0, LIMIT_HUYET) : records
let nHuyet = 0
const stat = { kinh: 0, ky: 0, athi: 0, noimg: 0, noindex: 0 }
for (const rec of subset) {
  if (!rec || !rec.ten) continue
  const { htmlDoc, indexable, loai, hasImg } = huyetPage(rec)
  writePage('huyet', rec._slug, htmlDoc)
  nHuyet++
  stat[loai]++
  if (!hasImg) stat.noimg++
  if (!indexable) stat.noindex++
}

console.log(`✓ build-dict: ${nKinh} trang kinh (${nKinhNoindex} noindex) + ${nHuyet} trang huyệt → ${distDir}`)
console.log(`  Huyệt: Kinh ${stat.kinh} · Kỳ ${stat.ky} · A Thị ${stat.athi} | noindex (corrupt/mỏng) ${stat.noindex} · thiếu ảnh ${stat.noimg}`)

// ── Bệnh học + Châm cứu trị bệnh (2 nhánh riêng) ──
let nBenh = 0
for (const cfg of BENH_SETS) {
  const set = BENH[cfg.key]
  if (!set || !Array.isArray(set.records)) continue
  writePage(cfg.dir, '', benhIndexPage(set, cfg)) // hub mục lục
  let n = 0
  let noindex = 0
  for (const rec of set.records) {
    if (!rec || !rec.ten) continue
    const { htmlDoc, indexable } = benhPage(rec, set, cfg)
    writePage(cfg.dir, rec._slug, htmlDoc)
    n++
    nBenh++
    if (!indexable) noindex++
  }
  console.log(`  ${set.title}: ${n} trang (${noindex} noindex) → /${cfg.dir}/`)
}
console.log(`✓ build-dict bệnh: tổng ${nBenh} trang.`)
