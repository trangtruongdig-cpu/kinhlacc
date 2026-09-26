// Sinh public/sitemap.xml từ NGUỒN CHUNG src/seo/route-seo.json + các bài blog trong content/blog.
//
// ⚠️ BẪY ĐÃ CẮN MỘT LẦN (26/09/2026) — đọc trước khi chạy build tay:
// Tệp này ghi ra public/sitemap.xml, và `vite build` CHÉP CẢ public/ ĐÈ LÊN dist/. Nghĩa là
// MỌI lần chạy vite build đều đặt lại dist/sitemap.xml về bản gốc 911 URL, xoá sạch phần mà
// build-phuong / build-duoc-lieu / build-nhom-duoc-ly / build-nguon đã chèn thêm (tổng 9.206).
// Chuyện này xảy ra với MỌI lối gọi — `npm run build`, `npm run build-only`, `npx vite build`
// — và `emptyOutDir: false` KHÔNG đỡ được, vì đây là ghi đè từng tệp chứ không phải xoá thư mục.
//
// Vậy nên: chạy vite build xong thì LUÔN chạy `npm run blog:post`. Chuỗi đó chèn lại URL rồi
// kết bằng hai chốt kiem-sitemap + kiem-seo, cả hai đều gãy build khi thiếu.
// Lần cắn thật: một phiên chạy `npx vite build` để đổi bundle, sitemap tụt 9.206 → 911 mà
// trang HTML vẫn đủ 18.504 — site trông hoàn toàn bình thường. Chỉ chốt phát hiện ra.
// Tự chạy trước mỗi lần build (script "prebuild") hoặc gọi tay: npm run sitemap
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readArticles } from './blog-lib.mjs'
import { listDictPages } from './dict-data.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const seo = JSON.parse(readFileSync(resolve(here, '../src/seo/route-seo.json'), 'utf8'))
const DOMAIN = seo.domain
// Chuẩn hoá path sang dạng CÓ dấu "/" cuối (trừ trang chủ) — KHỚP canonical + redirect "thêm /" của host.
// Nếu sitemap liệt kê bản KHÔNG "/" (vd /thu-vien) trong khi host redirect sang /thu-vien/ → Google
// coi là "Page with redirect" và bỏ index. Blog/từ điển vốn đã có "/" nên không đổi.
const slashify = (p) => (p === '/' ? '/' : '/' + p.replace(/^\/+|\/+$/g, '') + '/')
const today = process.env.SITEMAP_DATE || new Date().toISOString().slice(0, 10)

// 1) Trang công khai của app — BỎ trang noindex (vd /xoa-tai-khoan) khỏi sitemap để khớp robots meta.
const routes = seo.pages
  .filter((p) => p.index !== false)
  .map((p) => ({
    path: p.path,
    priority: p.priority || '0.8',
    changefreq: p.changefreq || 'monthly',
    lastmod: today,
  }))

// 2) Blog (trang index + từng bài). Bỏ bài index:false (bản nháp/chờ duyệt) khỏi sitemap.
const posts = readArticles().filter((p) => p.index !== false)
if (posts.length) {
  routes.push({ path: '/blog/', priority: '0.7', changefreq: 'weekly', lastmod: posts[0].date || today })
  for (const p of posts) {
    routes.push({ path: `/blog/${p.slug}/`, priority: '0.7', changefreq: 'monthly', lastmod: p.date || today })
  }
}

// 3) Từ điển: trang kinh (trụ) + huyệt (nhánh) — CHỈ trang index:true (bỏ corrupt/mỏng → không spam Google).
let nDict = 0
for (const p of listDictPages()) {
  if (!p.index) continue
  routes.push({
    path: p.loc,
    priority: p.kind === 'index' ? '0.8' : p.kind === 'kinh' ? '0.7' : '0.6',
    changefreq: 'monthly',
    lastmod: today,
    anh: p.anh || [],
  })
  nDict++
}

// Tên ảnh vào XML phải thoát ký tự, nếu không một dấu & là hỏng cả sitemap.
const escXml = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const urls = routes
  .map(
    (r) => `  <url>
    <loc>${DOMAIN}${slashify(r.path)}</loc>
    <lastmod>${r.lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>${(r.anh || [])
      .map((a) => `
    <image:image><image:loc>${DOMAIN}${a.url}</image:loc><image:title>${escXml(a.ten)}</image:title></image:image>`)
      .join('')}
  </url>`,
  )
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>
`

const out = resolve(here, '../public/sitemap.xml')
writeFileSync(out, xml, 'utf8')
console.log(`✓ sitemap.xml: ${routes.length} URL (${posts.length} bài blog · ${nDict} từ điển) → ${out}`)
