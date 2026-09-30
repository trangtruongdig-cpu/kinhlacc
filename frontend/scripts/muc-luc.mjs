// muc-luc.mjs — Trang MỤC LỤC A–Z tĩnh cho bộ có hàng nghìn mục (bài thuốc, dược liệu).
//
// VÌ SAO: /bai-thuoc/ và /duoc-lieu/ là VỎ SPA — danh sách do Vue dựng bằng @click, không
// có <a href> nào trong HTML. Đo 30/09/2026: 3.853 bài thuốc chỉ tới được ở độ sâu 6 (đi
// vòng qua nguồn → bài thuốc). Trang mục lục tĩnh đưa mọi mục được index về độ sâu 2–3:
// trang chủ → /bai-thuoc/muc-luc/ → /bai-thuoc/muc-luc/a/ → bài.
//
// Không đụng giao diện TuDienView (CLAUDE.md: đã bác 3 lần dựng lại). Trang này độc lập,
// không mount Vue, dùng chung khung seo-html.mjs như huyệt/nguồn.
//
// CHỈ liệt kê mục được index (không liệt kê bản trùng đã trỏ canonical đi, không liệt kê
// trang mỏng noindex): dẫn bot vào trang ta đã bảo nó đừng index là phí ngân sách thu thập.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { head, topbar, footer, ld, escText, escAttr, DOMAIN, OG_IMAGE } from './seo-html.mjs'

const STYLE = `<style>
  .ml-az{display:flex;flex-wrap:wrap;gap:.35rem;margin:0 0 1.2rem}
  .ml-az a{display:inline-block;padding:.2rem .55rem;border:1px solid #e3d6c2;border-radius:6px;background:#faf6ef;text-decoration:none}
  .ml-az a[aria-current]{background:#8a5e28;color:#fff;border-color:#8a5e28}
  .ml-list{list-style:none;padding:0;margin:0}
  .ml-list li{padding:.35rem 0;border-bottom:1px solid #f0e8dc}
  .ml-list small{display:block;color:#7a6a58}
</style>`

/** Chữ cái đầu, bỏ dấu (Đ → D). Không phải chữ cái → "khac". */
export function chuDau(ten) {
  const c = String(ten || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').trim().charAt(0).toLowerCase()
  return /[a-z]/.test(c) ? c : 'khac'
}
const nhanChu = (c) => (c === 'khac' ? '#' : c.toUpperCase())
// Cắt ở ranh giới từ (như clipMoTa của builder) — slice() thuần cắt giữa chữ.
const cat = (t, max = 158) => (t.length <= max ? t : t.slice(0, max - 1).replace(/\s+\S*$/, '') + '…')

/**
 * @param o.distDir   thư mục dist
 * @param o.dir       'bai-thuoc' | 'duoc-lieu'
 * @param o.ten       'Bài Thuốc' — danh từ số nhiều dùng trong tiêu đề
 * @param o.gioiThieu một câu mở trang gốc
 * @param o.muc       [{ ten, url (tuyệt đối), phu? }] — CHỈ mục được index
 * @returns           danh sách URL tuyệt đối đã dựng (để chèn sitemap)
 */
export function dungMucLuc({ distDir, dir, ten, gioiThieu, muc }) {
  const theoChu = new Map()
  for (const m of [...muc].sort((a, b) => a.ten.localeCompare(b.ten, 'vi'))) {
    const c = chuDau(m.ten)
    if (!theoChu.has(c)) theoChu.set(c, [])
    theoChu.get(c).push(m)
  }
  const chuSap = [...theoChu.keys()].sort((a, b) => (a === 'khac') - (b === 'khac') || a.localeCompare(b))
  const goc = `${DOMAIN}/${dir}/muc-luc/`
  const az = (hienTai) =>
    `<nav class="ml-az" aria-label="Chữ cái">${chuSap
      .map((c) => `<a href="/${dir}/muc-luc/${c}/"${c === hienTai ? ' aria-current="page"' : ''}>${nhanChu(c)} <small>${theoChu.get(c).length}</small></a>`)
      .join('')}</nav>`
  const vun = (crumbs) =>
    ld({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: crumbs.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
    })
  const ghi = (duong, html) => {
    const d = join(distDir, duong)
    mkdirSync(d, { recursive: true })
    writeFileSync(join(d, 'index.html'), html, 'utf8')
  }
  const urls = [goc]

  // Trang gốc: bảng chữ cái + số mục mỗi vần.
  ghi(`${dir}/muc-luc`,
    head({
      title: `Mục Lục ${ten} Đông Y A–Z (${muc.length})`,
      description: cat(`${gioiThieu} Tra theo vần A–Z: ${muc.length} mục, mỗi vần một trang.`),
      canonical: goc, ogImage: OG_IMAGE, ogType: 'website', extraHead: STYLE,
      jsonLds: [
        ld({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: `Mục Lục ${ten}`, inLanguage: 'vi', url: goc }),
        vun([['Trang Chủ', DOMAIN + '/'], [ten, `${DOMAIN}/${dir}/`], ['Mục Lục A–Z', goc]]),
      ],
    }) +
    `<body>${topbar}
<main class="bl-main"><article class="bl-article">
  <nav class="bl-crumb"><a href="/">Trang Chủ</a> › <a href="/${dir}/">${escText(ten)}</a> › <span>Mục Lục A–Z</span></nav>
  <h1>Mục Lục ${escText(ten)} A–Z</h1>
  <p>${escText(gioiThieu)} ${muc.length} mục, sắp theo vần.</p>
  ${az(null)}
</article></main>
${footer}</body></html>`)

  for (const c of chuSap) {
    const ds = theoChu.get(c)
    const url = `${goc}${c}/`
    urls.push(url)
    ghi(`${dir}/muc-luc/${c}`,
      head({
        title: `${ten} Đông Y Vần ${nhanChu(c)} (${ds.length})`,
        // Câu đuôi cố định giữ mô tả ≥70 ký tự cả ở vần chỉ có 1–2 mục.
        description: cat(`${ten} Đông Y vần ${nhanChu(c)} (${ds.length}): ${ds.slice(0, 5).map((m) => m.ten).join(', ')}${ds.length > 5 ? '…' : ''}. ${gioiThieu}`),
        canonical: url, ogImage: OG_IMAGE, ogType: 'website', extraHead: STYLE,
        jsonLds: [
          ld({
            '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${ten} vần ${nhanChu(c)}`, inLanguage: 'vi', url,
            mainEntity: { '@type': 'ItemList', numberOfItems: ds.length },
          }),
          vun([['Trang Chủ', DOMAIN + '/'], [ten, `${DOMAIN}/${dir}/`], ['Mục Lục A–Z', goc], [`Vần ${nhanChu(c)}`, url]]),
        ],
      }) +
      `<body>${topbar}
<main class="bl-main"><article class="bl-article">
  <nav class="bl-crumb"><a href="/">Trang Chủ</a> › <a href="/${dir}/">${escText(ten)}</a> › <a href="/${dir}/muc-luc/">Mục Lục A–Z</a> › <span>Vần ${nhanChu(c)}</span></nav>
  <h1>${escText(ten)} Vần ${nhanChu(c)}</h1>
  ${az(c)}
  <ul class="ml-list">${ds
    .map((m) => `<li><a href="${escAttr(new URL(m.url).pathname)}">${escText(m.ten)}</a>${m.phu ? `<small>${escText(m.phu)}</small>` : ''}</li>`)
    .join('')}</ul>
</article></main>
${footer}</body></html>`)
  }
  return urls
}
