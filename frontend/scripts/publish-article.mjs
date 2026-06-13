// publish-article.mjs — CẦU NỐI: nhận bài viết dạng JSON (từ module SEO Radar / DB) → ghi content/blog/<slug>.md.
//
// Dùng:
//   node scripts/publish-article.mjs --from bai.json          # 1 file JSON (1 bài, mảng, {articles:[]} hoặc {result:{articles:[]}})
//   cat bai.json | node scripts/publish-article.mjs --stdin    # backend pipe qua stdin
//   node scripts/publish-article.mjs --from bai.json --out /tmp/x   # ghi ra thư mục khác (để test)
//
// Sau khi ghi xong, chạy `npm run build` (hoặc deploy) để build-blog sinh HTML + cập nhật sitemap.
//
// JSON 1 bài chấp nhận các field (alias DB ở ngoặc):
//   slug, title, description, body|markdownBody (body_markdown), date, author,
//   category, cluster, cta, keywords[], faq[{q,a}], sources[string|{title,url}],
//   index (false=noindex/chờ duyệt), image, seoCumId (seo_cum_id), aiModel (ai_model)
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { writeArticle } from './blog-lib.mjs'

const args = process.argv.slice(2)
const getOpt = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

let rawText
if (args.includes('--stdin')) {
  rawText = readFileSync(0, 'utf8')
} else {
  const f = getOpt('--from') || args.find((a) => !a.startsWith('--'))
  if (!f) {
    console.error('Dùng: node scripts/publish-article.mjs --from <file.json> | --stdin   [--out <dir>]')
    process.exit(1)
  }
  rawText = readFileSync(f, 'utf8')
}

const parsed = JSON.parse(rawText)
const list = Array.isArray(parsed)
  ? parsed
  : parsed.articles || (parsed.result && parsed.result.articles) || [parsed]

const outDir = getOpt('--out') ? resolve(getOpt('--out')) : undefined

// Giải mã thực thể HTML (AI hay trả &gt; &amp; …).
const decode = (s) =>
  String(s ?? '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')

const DATE = process.env.ARTICLE_DATE || new Date().toISOString().slice(0, 10)

let n = 0
for (const a of list) {
  if (!a || !(a.slug || a.title)) continue
  const article = {
    slug: a.slug,
    title: decode(a.title),
    description: decode(a.description || ''),
    date: a.date || DATE,
    author: a.author || 'Ban Biên Tập Kinh Lạc',
    category: a.category ? decode(a.category) : undefined,
    cluster: a.cluster || undefined,
    cta: a.cta || undefined,
    keywords: Array.isArray(a.keywords) ? a.keywords.map(decode) : undefined,
    faq: Array.isArray(a.faq) ? a.faq.map((f) => ({ q: decode(f.q), a: decode(f.a) })) : undefined,
    sources: Array.isArray(a.sources)
      ? a.sources
          .map((s) =>
            typeof s === 'string'
              ? decode(s)
              : { title: decode(s.title || s.ten || s.url || ''), ...(s.url ? { url: String(s.url).trim() } : {}) },
          )
          .filter((s) => (typeof s === 'string' ? s : s.title))
      : undefined,
    index: a.index === false ? false : undefined, // chỉ ghi khi false (noindex / chờ duyệt)
    image: a.image || undefined,
    seoCumId: a.seoCumId ?? a.seo_cum_id ?? undefined,
    aiModel: a.aiModel || a.ai_model || undefined,
    body: decode(a.body ?? a.markdownBody ?? a.body_markdown ?? ''),
  }
  const slug = writeArticle(article, outDir)
  n++
  console.log(`  ✓ ${slug}.md${article.index === false ? ' (noindex/chờ duyệt)' : ''}`)
}
console.log(`✓ publish-article: ${n} bài → ${outDir || 'content/blog/'}`)
