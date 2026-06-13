// link-blog-images.mjs — Tự gắn ảnh bìa vào bài: nếu có file public/blog/assets/<slug>.(webp|jpg|png)
// thì điền frontmatter `image` cho content/blog/<slug>.md. CHỈ gắn khi file ảnh CÓ thật → không bao giờ ảnh vỡ.
//
// Chèn/sửa ĐÚNG dòng `image:` trên frontmatter gốc (regex), KHÔNG re-serialize toàn bộ → giữ nguyên
// mọi field & định dạng khác (kể cả field do script/người khác thêm).
//
// Cách dùng:
//   1. Lưu ảnh vào public/blog/assets/ ĐẶT TÊN = slug bài, vd: 12-duong-kinh-chinh.webp
//   2. npm run link-images        (thêm --force để ghi đè bài đã có image)
//   3. npm run build-blog
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { CONTENT_DIR } from './blog-lib.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const assetsDir = process.env.BLOG_ASSETS_DIR
  ? resolve(process.env.BLOG_ASSETS_DIR)
  : resolve(here, '../public/blog/assets')
const force = process.argv.includes('--force')
const EXTS = ['webp', 'jpg', 'jpeg', 'png']

let n = 0
for (const f of readdirSync(CONTENT_DIR)) {
  if (!f.endsWith('.md') || f.startsWith('_') || f.toLowerCase() === 'readme.md') continue
  const slug = f.replace(/\.md$/, '')
  const ext = EXTS.find((e) => existsSync(join(assetsDir, `${slug}.${e}`)))
  if (!ext) continue

  const file = join(CONTENT_DIR, f)
  const txt = readFileSync(file, 'utf8')
  const m = txt.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/)
  if (!m) {
    console.error(`  ✗ ${slug}: không tách được frontmatter`)
    continue
  }
  const hasImage = /^image:/m.test(m[2])
  if (hasImage && !force) continue

  const imageLine = `image: ${JSON.stringify('/blog/assets/' + slug + '.' + ext)}`
  const fmBody = hasImage ? m[2].replace(/^image:.*$/m, imageLine) : m[2] + '\n' + imageLine
  writeFileSync(file, m[1] + fmBody + m[3] + txt.slice(m[0].length), 'utf8')
  n++
  console.log(`  ✓ ${slug} → /blog/assets/${slug}.${ext}`)
}
console.log(
  n
    ? `✓ link-blog-images: gắn ảnh bìa cho ${n} bài. Nhớ chạy: npm run build-blog`
    : '… chưa thấy ảnh nào khớp slug trong public/blog/assets/ (đặt tên file = slug bài).',
)
