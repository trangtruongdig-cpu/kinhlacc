// qa-auto-articles.mjs — VAN AN TOÀN YMYL cho bài viết TỰ ĐỘNG (do Lò Viết Bài/Yescale tạo).
//
// "Bài auto" = frontmatter có `aiModel` hoặc `seoCumId`. "Đã duyệt" = frontmatter `approved: true`.
// Bài auto CHƯA duyệt sẽ bị đặt `index: false` → noindex + KHÔNG vào sitemap/danh sách (vẫn xem được qua URL
// để người có chuyên môn rà). Sau khi duyệt, bỏ cờ để bài lên Google.
//
// Cách dùng:
//   node scripts/qa-auto-articles.mjs                      # BÁO CÁO (không sửa): liệt kê bài auto + trạng thái
//   node scripts/qa-auto-articles.mjs --gate               # ĐẶT noindex cho bài auto CHƯA duyệt (van an toàn)
//   node scripts/qa-auto-articles.mjs --approve <slug>...  # DUYỆT: approved=true + bỏ index:false
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { CONTENT_DIR, parseFrontmatter } from './blog-lib.mjs'

const args = process.argv.slice(2)
const mode = args.includes('--gate') ? 'gate' : args.includes('--approve') ? 'approve' : 'report'
const approveSlugs = args.filter((a) => !a.startsWith('--'))

const files = readdirSync(CONTENT_DIR).filter(
  (f) => f.endsWith('.md') && !f.startsWith('_') && f.toLowerCase() !== 'readme.md',
)

const isAuto = (d) => d.aiModel != null || d.seoCumId != null

// Sửa frontmatter gốc bằng regex (giữ nguyên field/định dạng khác).
function setField(txt, key, literal) {
  const m = txt.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/)
  const re = new RegExp('^' + key + ':.*$', 'm')
  let fm = re.test(m[2]) ? m[2].replace(re, key + ': ' + literal) : m[2] + '\n' + key + ': ' + literal
  return m[1] + fm + m[3] + txt.slice(m[0].length)
}
function removeField(txt, key) {
  const m = txt.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/)
  const fm = m[2].replace(new RegExp('^' + key + ':.*$\\r?\\n?', 'm'), '')
  return m[1] + fm + m[3] + txt.slice(m[0].length)
}

if (mode === 'approve') {
  if (!approveSlugs.length) {
    console.error('Cần ít nhất 1 slug. Vd: node scripts/qa-auto-articles.mjs --approve do-nhiet-do-kinh-lac')
    process.exit(1)
  }
  let n = 0
  for (const slug of approveSlugs) {
    const file = join(CONTENT_DIR, `${slug}.md`)
    let txt
    try {
      txt = readFileSync(file, 'utf8')
    } catch {
      console.error(`  ✗ ${slug}: không thấy file`)
      continue
    }
    txt = setField(txt, 'approved', 'true')
    txt = removeField(txt, 'index') // bỏ noindex để bài lên Google
    writeFileSync(file, txt, 'utf8')
    n++
    console.log(`  ✓ duyệt: ${slug}`)
  }
  console.log(`✓ Đã duyệt ${n} bài. Nhớ chạy: npm run build-blog && npm run sitemap`)
  process.exit(0)
}

// report | gate
const review = []
for (const f of files) {
  const file = join(CONTENT_DIR, f)
  const txt = readFileSync(file, 'utf8')
  const { data } = parseFrontmatter(txt)
  if (!isAuto(data)) continue
  const slug = data.slug || f.replace(/\.md$/, '')
  if (data.approved === true) {
    console.log(`  ✓ đã duyệt: ${slug}`)
    continue
  }
  const alreadyGated = data.index === false
  if (mode === 'gate' && !alreadyGated) {
    writeFileSync(file, setField(txt, 'index', 'false'), 'utf8')
  }
  review.push(slug)
  console.log(`  ${mode === 'gate' ? '⛔ đặt noindex (chờ duyệt)' : '⚠️ chưa duyệt'}: ${slug}`)
}

console.log('')
if (!review.length) {
  console.log('✓ Không có bài auto nào chờ duyệt.')
} else if (mode === 'gate') {
  console.log(`⛔ ${review.length} bài auto chưa duyệt → đã đặt noindex. Sau khi rà, duyệt bằng:`)
  console.log(`   node scripts/qa-auto-articles.mjs --approve ${review.join(' ')}`)
  console.log('   Rồi: npm run build-blog && npm run sitemap')
} else {
  console.log(`⚠️ ${review.length} bài auto CHƯA duyệt. Đặt noindex bằng: npm run blog:gate`)
}
