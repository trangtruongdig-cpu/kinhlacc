// add-covers.mjs — Gắn/đổi ảnh bìa (frontmatter `image`) cho content/blog/*.md.
//
// Ảnh bìa = ảnh "của nhà" KHỚP chủ đề, chọn bằng cover-lib.mjs (3 tầng: tên huyệt → tên kinh → sơ đồ).
// CÙNG thuật toán với backend (pickCoverImage) & editor (coverImageFor) để nhất quán.
//
// Cần chạy `node scripts/_build-acu-index.mjs` trước (sinh acu-index.json) để bật tầng "tên huyệt".
//
// Dùng:  node scripts/add-covers.mjs          (bỏ qua bài đã có image)
//        node scripts/add-covers.mjs --force  (ghi đè image cũ — nên dùng để sửa ảnh trùng/lệch)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { pickCover, loadAcuIndex, existingCoverFor } from './cover-lib.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const dir = resolve(here, '../content/blog')

const acu = loadAcuIndex()
if (!acu.length) {
  console.warn('⚠ Chưa có acu-index.json — chạy: node scripts/_build-acu-index.mjs (tạm bỏ tầng tên huyệt).')
}

// Lấy 1 trường frontmatter dạng chuỗi (title/slug) hoặc mảng JSON (keywords).
function fmField(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
  if (!m) return ''
  const raw = m[1].trim()
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.join(' ') : String(v)
  } catch {
    return raw.replace(/^["']|["']$/g, '')
  }
}

const force = process.argv.includes('--force')
let n = 0
const all = readdirSync(dir).filter((x) => x.endsWith('.md') && x.toLowerCase() !== 'readme.md')
for (const f of all) {
  const p = join(dir, f)
  let raw = readFileSync(p, 'utf8')
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!m) {
    console.log('  bỏ qua (không có frontmatter):', f)
    continue
  }
  let fm = m[1]
  if (/^image:/m.test(fm) && !force) {
    console.log('  đã có image, bỏ qua:', f)
    continue
  }
  const slug = (fmField(fm, 'slug') || f.replace(/\.md$/, '')).trim()
  // Ưu tiên ảnh bìa AI đã vẽ riêng (cover.*); chưa có thì mới chọn ảnh "của nhà" theo chủ đề.
  const img = existingCoverFor(slug) || pickCover(slug, fmField(fm, 'title'), fmField(fm, 'keywords'), acu)

  // gỡ image cũ (nếu --force) rồi chèn lại — đặt ngay sau dòng slug cho gọn.
  fm = fm
    .split('\n')
    .filter((line) => !/^image:/.test(line.trim()))
    .join('\n')
  if (/^slug:.*$/m.test(fm)) fm = fm.replace(/^(slug:.*)$/m, (s) => `${s}\nimage: "${img}"`)
  else fm = `${fm}\nimage: "${img}"`

  raw = raw.replace(m[0], () => `---\n${fm}\n---`)
  writeFileSync(p, raw, 'utf8')
  console.log(`  ✓ ${f} → ${img}`)
  n++
}
console.log(`✓ add-covers: gắn ảnh bìa cho ${n} bài (tổng ${all.length} bài).`)
