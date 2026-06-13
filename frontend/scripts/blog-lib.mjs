// blog-lib.mjs — Đọc/ghi & phân tích bài blog Markdown. Dùng chung cho build-blog.mjs, gen-sitemap.mjs, publish-article.mjs.
//
// Mỗi bài là 1 file content/blog/<slug>.md có frontmatter giữa hai dòng "---".
// Giá trị frontmatter: thử JSON.parse trước (cho mảng/đối tượng như keywords, faq, index:false);
// nếu không phải JSON thì coi là chuỗi thường.
//
// ĐÂY LÀ ĐỊNH DẠNG HỢP ĐỒNG để module khác (vd backend SEO Radar) ghi bài vào pipeline blog.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
// Cho ghi đè qua BLOG_CONTENT_DIR (tiện test trên thư mục tạm).
export const CONTENT_DIR = process.env.BLOG_CONTENT_DIR
  ? resolve(process.env.BLOG_CONTENT_DIR)
  : resolve(here, '../content/blog')

export function parseFrontmatter(raw) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!m) return { data: {}, body: raw }
  const data = {}
  for (const line of m[1].split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const idx = t.indexOf(':')
    if (idx === -1) continue
    const key = t.slice(0, idx).trim()
    const rawVal = t.slice(idx + 1).trim()
    let val
    try {
      val = JSON.parse(rawVal)
    } catch {
      val = rawVal.replace(/^["']|["']$/g, '')
    }
    data[key] = val
  }
  return { data, body: m[2] }
}

export function readArticles() {
  if (!existsSync(CONTENT_DIR)) return []
  return readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_') && f.toLowerCase() !== 'readme.md')
    .map((f) => {
      const raw = readFileSync(join(CONTENT_DIR, f), 'utf8')
      const { data, body } = parseFrontmatter(raw)
      return { ...data, slug: data.slug || f.replace(/\.md$/, ''), bodyMarkdown: body }
    })
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
}

// slug an toàn từ tiêu đề tiếng Việt (bỏ dấu, đ->d).
export function slugify(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Thứ tự field trong frontmatter (KHÔNG gồm body — body viết sau khối ---).
const FM_ORDER = [
  'title',
  'description',
  'slug',
  'date',
  'updated',
  'author',
  'reviewer',
  'reviewerTitle',
  'category',
  'cluster',
  'cta',
  'keywords',
  'faq',
  'sources',
  'index',
  'image',
  'seoCumId',
  'aiModel',
]

export function serializeFrontmatter(data) {
  const lines = ['---']
  for (const key of FM_ORDER) {
    if (data[key] === undefined || data[key] === null) continue
    lines.push(`${key}: ${JSON.stringify(data[key])}`)
  }
  lines.push('---', '')
  return lines.join('\n')
}

// Ghi 1 bài ra content/blog/<slug>.md theo đúng định dạng hợp đồng.
// article: { slug?, title, description, date?, author?, category?, cluster?, cta?,
//            keywords?, faq?, index?, image?, seoCumId?, aiModel?, body|markdownBody }
export function writeArticle(article, outDir = CONTENT_DIR) {
  mkdirSync(outDir, { recursive: true })
  const slug = article.slug || slugify(article.title)
  const body = String(article.body ?? article.markdownBody ?? '').trim()
  const fm = serializeFrontmatter({ ...article, slug })
  writeFileSync(join(outDir, `${slug}.md`), fm + body + '\n', 'utf8')
  return slug
}
