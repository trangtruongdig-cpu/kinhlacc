// apply-reframe.mjs — Áp kết quả workflow rà định vị vào content/blog/*.md.
// CHỈ thay thân bài (+ title/description nếu workflow đề xuất); GIỮ NGUYÊN toàn bộ frontmatter còn lại
// (kể cả field do phiên khác thêm: reviewer, sources, updated…).
//
// Dùng: node scripts/apply-reframe.mjs "<file-json-ket-qua>"
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const src = process.argv[2]
if (!src) {
  console.error('Cần đường dẫn file JSON kết quả. Vd: node scripts/apply-reframe.mjs result.json')
  process.exit(1)
}
const raw = JSON.parse(readFileSync(src, 'utf8'))
const results = raw.results || (raw.result && raw.result.results) || (Array.isArray(raw) ? raw : [])

const decode = (s) =>
  String(s ?? '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')

// Sửa lỗi đánh máy thương hiệu: đúng là "Kinh Lạc Trương Gia" (họ Trương), KHÔNG phải "Trường Gia".
const fixBrand = (s) => String(s ?? '').replace(/Trường Gia/g, 'Trương Gia')
const clean = (s) => fixBrand(decode(s))

const here = dirname(fileURLToPath(import.meta.url))
const blogDir = resolve(here, '../content/blog')

let n = 0
let skipped = 0
for (const r of results) {
  if (!r || !r.slug) continue
  if (!r.changed) {
    skipped++
    console.log(`  - ${r.slug}: ${r.notes || 'không đổi'}`)
    continue
  }
  const file = join(blogDir, `${r.slug}.md`)
  let txt
  try {
    txt = readFileSync(file, 'utf8')
  } catch {
    console.error(`  ✗ ${r.slug}: không tìm thấy file`)
    continue
  }
  const m = txt.match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n)([\s\S]*)$/)
  if (!m) {
    console.error(`  ✗ ${r.slug}: không tách được frontmatter`)
    continue
  }
  let fm = m[1]
  let body = m[2]
  if (r.newTitle) fm = fm.replace(/^title:.*$/m, 'title: ' + JSON.stringify(clean(r.newTitle)))
  if (r.newDescription)
    fm = fm.replace(/^description:.*$/m, 'description: ' + JSON.stringify(clean(r.newDescription)))
  if (r.newBody) body = clean(r.newBody).trim() + '\n'
  writeFileSync(file, fm + body, 'utf8')
  n++
  console.log(`  ✓ ${r.slug}: ${r.notes || 'đã sửa'}`)
}
console.log(`✓ apply-reframe: sửa ${n} bài, giữ nguyên ${skipped} bài.`)
