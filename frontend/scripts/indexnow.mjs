// indexnow.mjs — Báo công cụ tìm kiếm (Bing, Yandex, Cốc Cốc, Seznam, Naver) về URL mới/cập nhật
// qua giao thức IndexNow → index gần như tức thì.
//
// ⚠️ Google KHÔNG dùng IndexNow — Google index qua sitemap.xml + Google Search Console.
//    (Cốc Cốc CÓ dùng IndexNow → rất hữu ích cho lượng tìm kiếm tại Việt Nam.)
//
// Khoá IndexNow = file public/<key>.txt (nội dung = <key>), phục vụ tại https://kinhlac.online/<key>.txt
// để công cụ tìm kiếm xác minh quyền sở hữu.
//
// Dùng (CHẠY SAU KHI DEPLOY — lúc URL đã sống thật):
//   node scripts/indexnow.mjs                 # gửi tất cả URL công khai + blog (bỏ index:false)
//   node scripts/indexnow.mjs --blog          # chỉ URL blog
//   node scripts/indexnow.mjs <url> <url> ... # gửi đúng các URL chỉ định (vd 1 bài vừa đăng)
//   node scripts/indexnow.mjs --dry           # chỉ in payload, KHÔNG gửi
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { readArticles } from './blog-lib.mjs'
import { listDictPages } from './dict-data.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const publicDir = resolve(root, 'public')
const seo = JSON.parse(readFileSync(resolve(root, 'src/seo/route-seo.json'), 'utf8'))
const DOMAIN = seo.domain.replace(/\/+$/, '')
const HOST = new URL(DOMAIN).host

const args = process.argv.slice(2)
const dry = args.includes('--dry')
const blogOnly = args.includes('--blog')
const explicitUrls = args.filter((a) => a.startsWith('http'))

// Tìm khoá: ưu tiên env INDEXNOW_KEY, nếu không thì dò file public/<key>.txt có nội dung == tên file.
function findKey() {
  if (process.env.INDEXNOW_KEY) return process.env.INDEXNOW_KEY.trim()
  for (const f of readdirSync(publicDir)) {
    if (!/^[a-z0-9]{16,}\.txt$/i.test(f)) continue
    const content = readFileSync(join(publicDir, f), 'utf8').trim()
    if (f === `${content}.txt`) return content
  }
  return null
}

function collectUrls() {
  if (explicitUrls.length) return explicitUrls
  const urls = []
  if (!blogOnly) for (const p of seo.pages) urls.push(DOMAIN + p.path)
  const posts = readArticles().filter((p) => p.index !== false)
  if (posts.length) {
    urls.push(`${DOMAIN}/blog/`)
    for (const p of posts) urls.push(`${DOMAIN}/blog/${p.slug}/`)
  }
  // Từ điển: 2 hub + trang kinh + huyệt index:true (bỏ corrupt/mỏng). --blog để chỉ gửi blog.
  if (!blogOnly) for (const p of listDictPages()) if (p.index) urls.push(DOMAIN + p.loc)
  return urls
}

const key = findKey()
if (!key) {
  console.error('✗ Không tìm thấy khoá IndexNow (public/<key>.txt) — đặt INDEXNOW_KEY hoặc tạo file khoá.')
  process.exit(1)
}

const urlList = [...new Set(collectUrls())]
if (!urlList.length) {
  console.log('Không có URL nào để gửi.')
  process.exit(0)
}

const payload = { host: HOST, key, keyLocation: `${DOMAIN}/${key}.txt`, urlList }

if (dry) {
  console.log('— DRY RUN — sẽ gửi (không thực sự gửi):')
  console.log(JSON.stringify(payload, null, 2))
  process.exit(0)
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
})
const ok = res.status >= 200 && res.status < 300
console.log(`IndexNow: HTTP ${res.status} ${res.statusText} — gửi ${urlList.length} URL ${ok ? '✓' : '✗'}`)
if (!ok) {
  console.error(await res.text().catch(() => ''))
  process.exit(1)
}
