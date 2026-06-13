// apply-article-fix.mjs — Áp kết quả viết lại MỘT bài (từ JSON workflow) vào content/blog/<file>.
// Cập nhật title/description/keywords/faq + thân bài; GIỮ NGUYÊN frontmatter còn lại (slug/date/author/cta/seoCumId/aiModel…).
// Dùng: node scripts/apply-article-fix.mjs "<json>" "<đường-dẫn-file.md>"
import { readFileSync, writeFileSync } from 'node:fs'

const [, , src, file] = process.argv
if (!src || !file) {
  console.error('Dùng: node scripts/apply-article-fix.mjs <json> <file.md>')
  process.exit(1)
}
const raw = JSON.parse(readFileSync(src, 'utf8'))
const r = raw.result || raw
const decode = (s) =>
  String(s ?? '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&amp;/g, '&')

const txt = readFileSync(file, 'utf8')
const m = txt.match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n)([\s\S]*)$/)
if (!m) {
  console.error('✗ không tách được frontmatter')
  process.exit(1)
}
let fm = m[1]
if (r.newTitle) fm = fm.replace(/^title:.*$/m, 'title: ' + JSON.stringify(decode(r.newTitle)))
if (r.newDescription) fm = fm.replace(/^description:.*$/m, 'description: ' + JSON.stringify(decode(r.newDescription)))
if (Array.isArray(r.newKeywords)) fm = fm.replace(/^keywords:.*$/m, 'keywords: ' + JSON.stringify(r.newKeywords.map(decode)))
if (Array.isArray(r.faq)) fm = fm.replace(/^faq:.*$/m, 'faq: ' + JSON.stringify(r.faq.map((f) => ({ q: decode(f.q), a: decode(f.a) }))))
const body = r.newBody ? decode(r.newBody).trim() + '\n' : m[2]
writeFileSync(file, fm + body, 'utf8')
console.log('✓ applied: ' + file)
