// cover-lib.mjs — Chọn ẢNH BÌA "của nhà" KHỚP chủ đề bài (dùng cho add-covers.mjs, gen-blog-images.mjs).
//
// 3 tầng, ưu tiên đúng chủ đề + chống trùng:
//   1. Khớp TÊN HUYỆT (từ acu-index.json, 678 huyệt) → ảnh huyệt thật.  → gần như không trùng.
//   2. Khớp TÊN KINH/TẠNG → 1 trong 7 biến thể của đúng kinh đó (xoay theo slug).
//   3. Không khớp → sơ đồ kinh phân bố ỔN ĐỊNH theo slug trên kho 36 ảnh (12 kinh × 3 biến thể "bìa").
//
// LƯU Ý: backend (seo.controller.ts → pickCoverImage) và editor (SeoRadarView.vue → coverImageFor)
// PHẢI giữ cùng thuật toán này để bản xem trước khớp bài đăng.
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const ACU_INDEX_PATH = resolve(here, '../public/blog-assets/acu-index.json')
const BLOG_IMAGES_DIR = resolve(here, '../public/blog-images')

// Ảnh bìa AI đã vẽ riêng cho bài (blog-images/<slug>/cover.*) — nếu có thì ƯU TIÊN hơn ảnh "của nhà".
export function existingCoverFor(slug) {
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    if (existsSync(resolve(BLOG_IMAGES_DIR, slug, `cover.${ext}`))) return `/blog-images/${slug}/cover.${ext}`
  }
  return null
}

// Nạp 1 lần (mảng [ten, path] đã sắp tên DÀI trước).
let _acu = null
export function loadAcuIndex() {
  if (_acu) return _acu
  _acu = existsSync(ACU_INDEX_PATH) ? JSON.parse(readFileSync(ACU_INDEX_PATH, 'utf8')) : []
  return _acu
}

// Cụm chữ ĐẶC TRƯNG (đã bỏ dấu) → chỉ số đường kinh (giống backend/editor).
export const MERIDIAN_KEYWORDS = [
  { idx: 1, phrases: ['kinh phe', 'tang phe', 'thai am phe', 'phoi', 'lung'] },
  { idx: 2, phrases: ['dai truong', 'duong minh dai truong', 'hop coc', 'large intestine'] },
  { idx: 3, phrases: ['kinh vi', 'tang vi', 'duong minh vi', 'da day', 'tuc tam ly', 'stomach'] },
  { idx: 4, phrases: ['kinh ty', 'tang ty', 'thai am ty', 'tam am giao', 'lach', 'spleen'] },
  { idx: 5, phrases: ['kinh tam', 'tang tam', 'thieu am tam', 'tim mach', 'benh tim', 'heart'] },
  { idx: 6, phrases: ['tieu truong', 'thai duong tieu truong', 'small intestine'] },
  { idx: 7, phrases: ['bang quang', 'thai duong bang quang', 'bladder'] },
  { idx: 8, phrases: ['kinh than', 'tang than', 'thieu am than', 'bo than', 'kidney'] },
  { idx: 9, phrases: ['tam bao', 'quyet am tam bao', 'pericardium'] },
  { idx: 10, phrases: ['tam tieu', 'thieu duong tam tieu', 'san jiao', 'triple energizer'] },
  { idx: 11, phrases: ['kinh dom', 'tang dom', 'thieu duong dom', 'tui mat', 'gallbladder'] },
  { idx: 12, phrases: ['kinh can', 'tang can', 'quyet am can', 'la gan', 'bo gan', 'gan mat', 'liver'] },
]
const MERIDIAN_VARIANTS = ['sodo', 'chinh', 'biet', 'can', 'doc', 'ngang', 'gen']
const COVER_VARIANTS = ['sodo', 'chinh', 'ngang'] // biến thể "đẹp làm bìa" cho tầng 3

export function normLoose(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}
function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}
const meridianImg = (idx, variant) =>
  `/kinhmach3d/images/meridians/kinh-${String(idx).padStart(2, '0')}-${variant}.jpg`

// Chuỗi "cỏ khô" để dò khớp nguyên cụm (có khoảng trắng 2 đầu).
export function hayOf(...parts) {
  return ` ${normLoose(parts.filter(Boolean).join(' '))
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `
}

/** Chọn ảnh bìa khớp chủ đề. acuIndex = mảng [ten,path]; bỏ trống → tự nạp. */
export function pickCover(slug, tieuDe = '', tuKhoa = '', acuIndex = null) {
  const acu = acuIndex || loadAcuIndex()
  const hay = hayOf(tieuDe, tuKhoa, slug)

  // Tầng 1: tên huyệt (đã sắp DÀI trước → khớp cụm dài thắng).
  // CHỈ chạy khi bài thực sự nói về "huyệt" — tránh bài khái niệm khớp nhầm (vd "tính vị" ≠ huyệt Ngũ Vị).
  if (hay.includes(' huyet ')) {
    for (const [name, file] of acu) {
      if (hay.includes(` ${name} `)) return file
    }
  }
  // Tầng 2: tên kinh/tạng → biến thể xoay theo slug.
  for (const m of MERIDIAN_KEYWORDS) {
    if (m.phrases.some((p) => hay.includes(` ${p} `))) {
      return meridianImg(m.idx, MERIDIAN_VARIANTS[hashStr(slug || '') % MERIDIAN_VARIANTS.length])
    }
  }
  // Tầng 3: phân bố ổn định theo slug trên 12×3 ảnh bìa. (>>> = dịch KHÔNG dấu, tránh chỉ số âm.)
  const h = hashStr(slug || 'bai-viet')
  return meridianImg((h % 12) + 1, COVER_VARIANTS[(h >>> 4) % COVER_VARIANTS.length])
}
