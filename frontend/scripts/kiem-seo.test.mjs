// kiem-seo.test.mjs — neo PHẠM VI của hai hạng phép kiểm.
//
// Vì sao có tệp này: ngày 02/10/2026 chốt gãy build trên VPS vì phép TỈ LỆ đếm cả trang
// noindex. Số đo lúc đó: 492 mô tả < 70 ký tự, trong đó 430 nằm ở trang NOINDEX (nhóm
// /trieu-chung/ mồ côi). Mô tả của trang noindex không bao giờ lên SERP, nên đếm chúng
// là hỏi sai câu — nhưng cách chữa SAI là nới trần, nên phải có phép kiểm neo lại:
//   · TỈ LỆ (chất lượng thẻ hiện trên SERP) → chỉ tính trên trang ĐƯỢC INDEX.
//   · TUYỆT ĐỐI (thẻ hỏng) → tính trên MỌI trang, kể cả noindex.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const KIEM = join(here, 'kiem-seo.mjs')

const MOTA_DAT = 'Mô tả đạt chuẩn dài hơn bảy mươi ký tự để Google có đủ chữ mà hiển thị trên trang kết quả.'

function trang({ tieuDe = 'Tiêu đề trang', moTa = MOTA_DAT, canonical, noindex = false, ld = true } = {}) {
  return [
    '<!doctype html><html><head>',
    `<title>${tieuDe}</title>`,
    `<meta name="description" content="${moTa}">`,
    canonical === null ? '' : `<link rel="canonical" href="https://kinhlac.online${canonical}">`,
    noindex ? '<meta name="robots" content="noindex, follow">' : '',
    ld ? '<script type="application/ld+json">{}</script>' : '',
    '</head><body></body></html>',
  ].join('')
}

function dungDist(danhSach) {
  const d = mkdtempSync(join(tmpdir(), 'kiem-seo-'))
  const loc = []
  for (const t of danhSach) {
    mkdirSync(join(d, t.duong), { recursive: true })
    writeFileSync(join(d, t.duong, 'index.html'), trang({ ...t, canonical: t.canonical === null ? null : `/${t.duong}/` }))
    if (!t.noindex) loc.push(`<url><loc>https://kinhlac.online/${t.duong}/</loc></url>`)
  }
  writeFileSync(join(d, 'sitemap.xml'), `<urlset>${loc.join('')}</urlset>`)
  return d
}

const chay = (dist) => spawnSync(process.execPath, [KIEM], { env: { ...process.env, DIST_DIR: dist }, encoding: 'utf8' })

// Mỗi trang có tên riêng để không dính phép "tiêu đề/mô tả trùng nhau".
const nhieu = (n, f) => Array.from({ length: n }, (_, i) => f(i))

test('mô tả ngắn ở trang NOINDEX không làm gãy chốt', () => {
  const dist = dungDist([
    ...nhieu(10, (i) => ({ duong: `dat-${i}`, tieuDe: `Trang đạt ${i}`, moTa: `${MOTA_DAT} Số ${i}.` })),
    ...nhieu(10, (i) => ({ duong: `moi-${i}`, tieuDe: `Trang mồ côi ${i}`, moTa: `Mục ${i} ngắn.`, noindex: true })),
  ])
  const r = chay(dist)
  assert.equal(r.status, 0, `phải ĐẠT, nhưng gãy:\n${r.stdout}${r.stderr}`)
})

test('mô tả ngắn ở trang ĐƯỢC INDEX vẫn làm gãy chốt', () => {
  const dist = dungDist([
    ...nhieu(10, (i) => ({ duong: `dat-${i}`, tieuDe: `Trang đạt ${i}`, moTa: `${MOTA_DAT} Số ${i}.` })),
    ...nhieu(10, (i) => ({ duong: `ngan-${i}`, tieuDe: `Trang ngắn ${i}`, moTa: `Mục ${i} ngắn.` })),
  ])
  const r = chay(dist)
  assert.equal(r.status, 1, 'mô tả ngắn trên trang được index phải làm gãy chốt')
  assert.match(r.stdout, /✗ mô tả < 70/)
})

test('phép TUYỆT ĐỐI vẫn bắt lỗi trên trang noindex', () => {
  const dist = dungDist([
    ...nhieu(10, (i) => ({ duong: `dat-${i}`, tieuDe: `Trang đạt ${i}`, moTa: `${MOTA_DAT} Số ${i}.` })),
    { duong: 'moi-coi-thieu-canonical', tieuDe: 'Mồ côi thiếu canonical', noindex: true, canonical: null },
  ])
  const r = chay(dist)
  assert.equal(r.status, 1, 'thiếu canonical ở trang noindex vẫn là thẻ HỎNG')
  assert.match(r.stdout, /✗ thiếu canonical/)
})

test('báo cáo nói rõ mẫu đếm là trang được index', () => {
  const dist = dungDist(nhieu(3, (i) => ({ duong: `dat-${i}`, tieuDe: `Trang đạt ${i}`, moTa: `${MOTA_DAT} Số ${i}.` })))
  const r = chay(dist)
  assert.match(r.stdout, /được index/, 'phải in ra số trang được index để biết tỉ lệ tính trên mẫu nào')
})
