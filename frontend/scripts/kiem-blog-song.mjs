#!/usr/bin/env node
// kiem-blog-song.mjs — Phép đo SAU DEPLOY cho /blog/ (kế hoạch 3: tĩnh trước, CMS đỡ sau).
//
// CHỈ ĐỌC: chỉ gửi GET tới site, không ghi gì ở đâu. Chạy tay sau mỗi lần deploy đụng tới
// frontend/nginx.conf, cms/src/pages/blog/ hay build-blog:
//
//   node frontend/scripts/kiem-blog-song.mjs                      # đo https://kinhlac.online
//   node frontend/scripts/kiem-blog-song.mjs http://localhost:8088 # đo một gốc khác
//
// Mã thoát 1 khi có BẤT KỲ phép nào trượt. Phép "so từng byte với bản tĩnh" chỉ chạy khi máy
// đang có frontend/dist/blog/ (bản build của ĐÚNG commit đang chạy trên site) — không có thì
// bỏ qua và nói rõ, không tính là trượt.
//
// Vì sao không dùng curl tay: 11 bài cũ đang nằm trong Google, và cả chuỗi nginx → tệp tĩnh →
// CMS → backend cũ có sáu ngã rẽ. Lệch một ngã (vd thêm `^~` vào location /blog/) thì site
// trông vẫn bình thường — blog.css vẫn ra, chỉ mất header; bài cũ vẫn ra, chỉ là do CMS dựng.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const goc = String(process.argv[2] || 'https://kinhlac.online').replace(/\/+$/, '')
const GOC_CONG_KHAI = 'https://kinhlac.online'
const HAN_MS = 20_000

if (!/^https?:\/\/[^/]+$/.test(goc)) {
  console.error(`Gốc không hợp lệ: "${goc}" — cần dạng https://ten-mien (không kèm đường dẫn).`)
  process.exit(1)
}

let truot = 0
let dat = 0
let boQua = 0
const ok = (ten, chiTiet = '') => { dat++; console.log(`  ✔ ${ten}${chiTiet ? ` — ${chiTiet}` : ''}`) }
const hong = (ten, chiTiet = '') => { truot++; console.log(`  ✖ ${ten}${chiTiet ? ` — ${chiTiet}` : ''}`) }
const bo = (ten, chiTiet = '') => { boQua++; console.log(`  – ${ten}${chiTiet ? ` — ${chiTiet}` : ''} (bỏ qua)`) }
const kiem = (dieuKien, ten, chiTiet) => (dieuKien ? ok(ten, chiTiet) : hong(ten, chiTiet))

/** GET không theo redirect. Không bao giờ ném: lỗi mạng trả { status: 0, loi }. */
async function lay(duong) {
  try {
    const r = await fetch(goc + duong, {
      redirect: 'manual',
      signal: AbortSignal.timeout(HAN_MS),
      headers: { 'User-Agent': 'kiem-blog-song/1 (+kinhlac.online)', 'Cache-Control': 'no-cache' },
    })
    const than = Buffer.from(await r.arrayBuffer())
    return { status: r.status, kieu: r.headers.get('content-type') || '', dich: r.headers.get('location') || '', than, dau: r.headers }
  } catch (e) {
    return { status: 0, kieu: '', dich: '', than: Buffer.alloc(0), dau: new Headers(), loi: String(e?.cause?.code || e?.message || e) }
  }
}
const ma = (r) => (r.status === 0 ? `lỗi mạng (${r.loi})` : `mã ${r.status}`)

// ── 11 slug gốc: lấy từ frontend/content/blog/*.md (nguồn của bản tĩnh) ──
const thuMucMd = join(root, 'content', 'blog')
const slugTinh = existsSync(thuMucMd)
  ? readdirSync(thuMucMd).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)).sort()
  : []
const thuMucDist = join(root, 'dist', 'blog')
const coDist = existsSync(join(thuMucDist, 'index.html'))

console.log(`Đo blog tại ${goc} — ${slugTinh.length} bài tĩnh trong content/blog/`)
if (!slugTinh.length) hong('Đọc danh sách bài tĩnh', `không thấy tệp .md nào trong ${thuMucMd}`)

// ── 1. Bài tĩnh: 200, và giống từng byte với bản build ──
console.log('\n1. Bài tĩnh (đang nằm trong Google) — phải 200 và do TỆP TĨNH phục vụ')
if (!coDist) bo('So từng byte với frontend/dist/blog/', 'máy này chưa có bản build (npm run build trong frontend/)')
for (const slug of slugTinh) {
  const r = await lay(`/blog/${slug}/`)
  if (r.status !== 200) { hong(`/blog/${slug}/`, ma(r)); continue }
  if (!/text\/html/i.test(r.kieu)) { hong(`/blog/${slug}/`, `200 nhưng content-type "${r.kieu}"`); continue }
  const tep = join(thuMucDist, slug, 'index.html')
  if (!coDist) { ok(`/blog/${slug}/`, `200, ${r.than.length} byte`); continue }
  if (!existsSync(tep)) { hong(`/blog/${slug}/`, '200 nhưng bản build ở máy này không có tệp của bài — build lại rồi đo') ; continue }
  const goc_ = readFileSync(tep)
  if (Buffer.compare(goc_, r.than) === 0) ok(`/blog/${slug}/`, `200, giống từng byte (${r.than.length} byte)`)
  else hong(`/blog/${slug}/`, `200 nhưng KHÁC bản tĩnh (site ${r.than.length} byte, tệp ${goc_.length} byte) — bài cũ không còn do tệp tĩnh phục vụ, hoặc bản build ở máy khác commit đang chạy`)
}

// ── 2. Trang danh sách ──
console.log('\n2. Trang danh sách /blog/')
const ds = await lay('/blog/')
const htmlDs = ds.than.toString('utf8')
const baiTrongDs = new Set([...htmlDs.matchAll(/class="bl-card" href="\/blog\/([^"/]+)\/"/g)].map((m) => m[1]))
if (ds.status !== 200) hong('/blog/', ma(ds))
else {
  const nguon = ds.dau.get('x-blog-nguon')
  kiem(baiTrongDs.size >= 11, '/blog/ 200 và liệt kê ≥ 11 bài', `${baiTrongDs.size} bài`)
  const thieu = slugTinh.filter((s) => !baiTrongDs.has(s))
  kiem(thieu.length === 0, 'Đủ mọi bài tĩnh trong danh sách', thieu.length ? `thiếu: ${thieu.join(', ')}` : `${slugTinh.length}/${slugTinh.length}`)
  if (nguon) hong('Danh sách do CMS dựng', `đang là bản dự phòng (X-Blog-Nguon: ${nguon}) — CMS không trả lời /blog/`)
  else ok('Danh sách do CMS dựng', 'không mang X-Blog-Nguon')
  kiem(htmlDs.includes('href="/blog/blog.css"'), 'Danh sách nạp /blog/blog.css')
}
const r301 = await lay('/blog')
kiem(r301.status === 301 && /\/blog\/$/.test(r301.dich), '/blog → 301 /blog/', `${ma(r301)}${r301.dich ? ` → ${r301.dich}` : ''}`)

// ── 3. Sitemap ──
console.log('\n3. /blog/sitemap.xml')
const sm = await lay('/blog/sitemap.xml')
const xml = sm.than.toString('utf8')
const loc = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
if (sm.status !== 200) hong('/blog/sitemap.xml', ma(sm))
else {
  kiem(/(application|text)\/xml/i.test(sm.kieu), 'content-type là xml', sm.kieu)
  kiem(/^<\?xml[^>]*\?>\s*<urlset[^>]*xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/.test(xml) && /<\/urlset>\s*$/.test(xml), 'Là một <urlset> hợp lệ')
  kiem(loc.length >= 12, 'Có ≥ 12 <loc> (/blog/ + 11 bài)', `${loc.length} <loc>`)
  const khongSlash = loc.filter((u) => !u.endsWith('/'))
  kiem(khongSlash.length === 0, 'Mọi <loc> kết thúc bằng "/"', khongSlash.slice(0, 3).join(', '))
  const laGoc = loc.filter((u) => !u.startsWith(`${GOC_CONG_KHAI}/blog/`))
  kiem(laGoc.length === 0, `Mọi <loc> bắt đầu bằng ${GOC_CONG_KHAI}/blog/`, laGoc.slice(0, 3).join(', '))
  kiem(new Set(loc).size === loc.length, 'Không <loc> nào trùng')
  const thieuSm = slugTinh.filter((s) => !loc.includes(`${GOC_CONG_KHAI}/blog/${s}/`))
  kiem(thieuSm.length === 0, 'Đủ mọi bài tĩnh trong sitemap', thieuSm.length ? `thiếu: ${thieuSm.join(', ')}` : '')
}
const robots = await lay('/robots.txt')
if (robots.status === 200) kiem(/^Sitemap:\s*https:\/\/kinhlac\.online\/blog\/sitemap\.xml\s*$/m.test(robots.than.toString('utf8')), 'robots.txt khai sitemap blog')
else hong('robots.txt', ma(robots))

// ── 4. 404 thật, blog.css, 301 thêm "/" ──
console.log('\n4. 404 thật, tệp tĩnh, chuyển hướng')
const slugMa = `khong-co-bai-nay-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
const r404 = await lay(`/blog/${slugMa}/`)
kiem(r404.status === 404, `/blog/${slugMa}/ → 404 thật`, r404.status === 200 ? 'mã 200 — soft 404, Google sẽ giữ URL chết' : ma(r404))
const css = await lay('/blog/blog.css')
kiem(css.status === 200 && /^text\/css/i.test(css.kieu), '/blog/blog.css 200 text/css', `${ma(css)}, "${css.kieu}"`)
if (css.status === 200) kiem(/no-cache/i.test(css.dau.get('cache-control') || ''), 'blog.css mang Cache-Control: no-cache (khối đuôi tệp của nginx phục vụ)', css.dau.get('cache-control') || 'không có header')
if (slugTinh.length) {
  const s = slugTinh[0]
  const r = await lay(`/blog/${s}`)
  kiem(r.status === 301 && r.dich.endsWith(`/blog/${s}/`), `/blog/${s} → 301 thêm "/"`, `${ma(r)}${r.dich ? ` → ${r.dich}` : ''}`)
  if (r.status === 301 && /^http:\/\//i.test(r.dich) && goc.startsWith('https://')) hong('Đích 301 giữ https', r.dich)
}

// ── 5. Bài CHỈ có trong CMS (nếu sitemap có bài ngoài 11 bài tĩnh) ──
console.log('\n5. Bài chỉ có trong CMS')
const chiCms = loc
  .map((u) => /^https:\/\/kinhlac\.online\/blog\/([^/]+)\/$/.exec(u)?.[1])
  .filter((s) => s && !slugTinh.includes(s))
if (!chiCms.length) bo('Canonical của bài chỉ có trong CMS', 'sitemap chưa có bài nào ngoài các bài tĩnh')
else {
  const s = chiCms[0]
  const r = await lay(`/blog/${s}/`)
  const html = r.than.toString('utf8')
  const canon = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1] || ''
  if (r.status !== 200) hong(`/blog/${s}/`, `${ma(r)} — bài có trong sitemap mà trang không lên`)
  else {
    ok(`/blog/${s}/ 200`, `${chiCms.length} bài chỉ có trong CMS`)
    kiem(canon === `${GOC_CONG_KHAI}/blog/${s}/`, 'Canonical là https và có "/" cuối', canon || 'không có thẻ canonical')
    kiem(html.includes('href="/blog/blog.css"'), 'Bài CMS nạp /blog/blog.css (cùng khuôn bản tĩnh)')
    kiem(!/<meta name="robots" content="[^"]*noindex/i.test(html), 'Bài trong sitemap không mang noindex')
    kiem(baiTrongDs.has(s), 'Bài có trong danh sách /blog/')
    const anh = /<img class="bl-hero-img" src="([^"]+)"/.exec(html)?.[1]
    if (!anh) bo('Ảnh bìa của bài CMS', 'bài không có ảnh bìa')
    else {
      const ra = await lay(anh.startsWith('http') ? new URL(anh).pathname : anh)
      kiem(ra.status === 200 && /^image\//i.test(ra.kieu), 'Ảnh bìa của bài CMS trả 200', `${ma(ra)}, "${ra.kieu}" — ${anh}`)
    }
  }
}

console.log(`\nKết quả: ${dat} đạt, ${truot} trượt, ${boQua} bỏ qua.`)
if (truot) {
  console.log('CÓ PHÉP TRƯỢT — xem các dòng ✖ ở trên. Đường lùi nginx: frontend/nginx.conf, mục "ĐƯỜNG LÙI".')
  process.exit(1)
}
console.log('Blog đạt mọi phép đo.')
