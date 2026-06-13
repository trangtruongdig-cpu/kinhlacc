// _build-acu-index.mjs — Quét kho ảnh huyệt (public/kinhmach3d/images/acupoints/NNNN-<ten>.png)
// → sinh manifest public/blog-assets/acu-index.json để chọn ẢNH BÌA + ẢNH THÂN BÀI khớp tên huyệt.
//
// Manifest = mảng [ten_khong_dau_cach_bang_dau_cach, duong_dan_anh], SẮP THEO ĐỘ DÀI TÊN GIẢM DẦN
// (để khi dò trong tiêu đề/bài, tên DÀI khớp trước — vd "tam am giao" thắng "tam").
//
// Dùng:  node scripts/_build-acu-index.mjs
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const acuDir = resolve(here, '../public/kinhmach3d/images/acupoints')
const outDir = resolve(here, '../public/blog-assets')
const outFile = join(outDir, 'acu-index.json')

const files = readdirSync(acuDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))

// Tên huyệt = bỏ tiền tố số "0352-" và đuôi ảnh; "-" → khoảng trắng. Giữ luôn bản BỎ hậu tố biến thể "-1/-2".
const byName = new Map() // ten -> file (giữ bản đầu tiên gặp)
for (const f of files.sort()) {
  const base = f.replace(/\.(png|jpe?g|webp)$/i, '').replace(/^\d+-/, '')
  const path = `/kinhmach3d/images/acupoints/${f}`
  const full = base.replace(/-/g, ' ').trim()
  const numless = full.replace(/\s+\d+$/, '').trim() // "an mien 1" -> "an mien"
  for (const name of [full, numless]) {
    if (name.length >= 3 && !byName.has(name)) byName.set(name, path)
  }
}

// Bỏ tên 1 âm tiết quá ngắn (dễ khớp nhầm trong văn bản): yêu cầu >=2 từ HOẶC >=5 ký tự.
const entries = [...byName.entries()]
  .filter(([name]) => name.includes(' ') || name.length >= 5)
  .sort((a, b) => b[0].length - a[0].length)

mkdirSync(outDir, { recursive: true })
writeFileSync(outFile, JSON.stringify(entries), 'utf8')
console.log(`✓ acu-index: ${entries.length} tên huyệt → ${outFile}`)
console.log('  Ví dụ:', entries.slice(0, 5).map(([n]) => n).join(' · '))
