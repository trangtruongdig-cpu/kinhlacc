// sitemap-chen.mjs — Chèn URL vào dist/sitemap.xml một cách BẤT BIẾN (chạy lại không nhân đôi).
//
// VÌ SAO CÓ TỆP NÀY — lỗi thật, 26/09/2026:
// Ba trong bốn builder chèn sitemap chỉ kiểm `sm.includes('</urlset>')`. Đó là kiểm sitemap
// có đúng dạng, KHÔNG phải chặn trùng. Chạy lại một builder mà không dựng lại từ đầu là
// URL của nó vào lần thứ hai. Hôm nay đo được 62 URL /duoc-lieu/nhom/ trùng đúng 2 lần.
//
// Trùng lặp không làm Google báo lỗi — nó chỉ làm SỐ ĐẾM của kiem-sitemap phồng lên, tức
// là che mất chính thứ mà chốt đó canh. Một bộ mất 62 trang cộng một bộ trùng 62 lần thì
// tổng vẫn "đạt ngưỡng".
//
// Cách chữa là XOÁ RỒI CHÈN LẠI, không phải "thấy có rồi thì bỏ qua": bỏ qua nghĩa là
// chạy lại với dữ liệu mới cũng không cập nhật được.
//
// ⚠️ Tiền tố chồng nhau: /duoc-lieu/ chứa cả /duoc-lieu/nhom/. build-duoc-lieu phải
// truyền `loaiTru` để không xoá mất phần của build-nhom-duoc-ly.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'

/**
 * @param smPath  đường dẫn dist/sitemap.xml
 * @param tienTo  tiền tố đường dẫn mà builder này sở hữu, vd '/bai-thuoc/'
 * @param urls    danh sách URL tuyệt đối cần chèn
 * @param opts    { loaiTru?: string[], priority?: string, changefreq?: string }
 * @returns       { xoa, chen } hoặc null nếu không có sitemap
 */
export function chenUrl(smPath, tienTo, urls, opts = {}) {
  if (!existsSync(smPath)) return null
  const sm = readFileSync(smPath, 'utf8')
  if (!sm.includes('</urlset>')) return null

  const loaiTru = opts.loaiTru || []
  const duong = (loc) => {
    try { return new URL(loc).pathname } catch { return loc }
  }
  // Đường dẫn mà chính builder này cấp trong lượt chạy hiện tại.
  const tuMinh = new Set(urls.map(duong))
  const cuaToi = (loc) => {
    const d = duong(loc)
    if (!d.startsWith(tienTo)) return false
    if (loaiTru.some((x) => d.startsWith(x))) return false
    // ⚠️ URL TRANG GOM đúng bằng tiền tố (vd /bai-thuoc/, /duoc-lieu/) nằm trong bản gốc
    // public/sitemap.xml, do gen-sitemap sinh — builder chi tiết KHÔNG cấp lại nó. Xoá nó
    // là mất luôn trang gom khỏi sitemap. Lỗi này tôi tự gây khi viết bản đầu của tệp
    // này: sitemap tụt 9.206 → 9.204, đúng hai URL /bai-thuoc/ và /duoc-lieu/.
    // Chỉ xoá URL bằng đúng tiền tố khi builder tự cấp lại nó (build-nhom-duoc-ly có
    // trang gom /duoc-lieu/nhom/ của riêng nó).
    if (d === tienTo && !tuMinh.has(d)) return false
    return true
  }

  // Gỡ mọi khối <url>…</url> mà <loc> của nó thuộc tiền tố này.
  let xoa = 0
  const conLai = sm.replace(/<url>[\s\S]*?<\/url>/g, (khoi) => {
    const m = khoi.match(/<loc>([^<]*)<\/loc>/)
    if (m && cuaToi(m[1])) { xoa++; return '' }
    return khoi
  })

  const cf = opts.changefreq || 'monthly'
  const pr = opts.priority || '0.5'
  const lm = opts.lastmod ? `<lastmod>${opts.lastmod}</lastmod>` : ''
  const them = urls
    .map((u) => `<url><loc>${u}</loc>${lm}<changefreq>${cf}</changefreq><priority>${pr}</priority></url>`)
    .join('')
  writeFileSync(smPath, conLai.replace('</urlset>', them + '</urlset>'), 'utf8')
  return { xoa, chen: urls.length }
}
