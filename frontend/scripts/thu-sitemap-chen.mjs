// thu-sitemap-chen.mjs — Phép thử cho sitemap-chen.mjs. Chạy: node scripts/thu-sitemap-chen.mjs
//
// Năm phép thử này đều neo vào lỗi THẬT đã xảy ra ngày 26/09/2026, không phải tình huống
// tưởng tượng:
//  1. Bản đầu của chenUrl xoá cả URL TRANG GOM (/bai-thuoc/, /duoc-lieu/) vì chúng khớp
//     tiền tố, mà builder chi tiết không cấp lại → sitemap tụt 9.206 → 9.204. Hai chốt
//     vẫn báo XANH vì 9.204 còn vượt ngưỡng 7.800: ngưỡng tối thiểu không bắt được mất
//     mát nhỏ. Chỉ đối chiếu số với lượt trước mới thấy.
//  2. Trước khi có chenUrl, ba builder chỉ kiểm `includes('</urlset>')` nên chạy lại là
//     nhân đôi: đo được 62 URL /duoc-lieu/nhom/ trùng 2 lần.
//  3. Chốt kiểu "thấy có rồi thì bỏ qua" chặn được trùng nhưng chặn luôn việc CẬP NHẬT.
//  4. /duoc-lieu/ chứa cả /duoc-lieu/nhom/ — không loại trừ thì xoá mất phần của builder khác.
//
import { writeFileSync, readFileSync } from 'node:fs'
import { chenUrl } from './sitemap-chen.mjs'
const F = '/tmp/kinhlac-sm-thu.xml'
const D = 'https://kinhlac.online'
const goc = `<?xml version="1.0"?><urlset>` +
  [`${D}/`, `${D}/bai-thuoc/`, `${D}/duoc-lieu/`, `${D}/nguon/`].map(u=>`<url><loc>${u}</loc></url>`).join('') +
  `</urlset>`
const loc = () => [...readFileSync(F,'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1])

const thu = [
  ['trang gom /bai-thuoc/ PHẢI còn sau khi chèn chi tiết', () => {
    writeFileSync(F, goc)
    chenUrl(F, '/bai-thuoc/', [`${D}/bai-thuoc/abc/`, `${D}/bai-thuoc/xyz/`])
    return loc().includes(`${D}/bai-thuoc/`) && loc().length === 6
  }],
  ['chạy LẠI không nhân đôi', () => {
    chenUrl(F, '/bai-thuoc/', [`${D}/bai-thuoc/abc/`, `${D}/bai-thuoc/xyz/`])
    const u = loc(); return new Set(u).size === u.length && u.length === 6
  }],
  ['chèn ít hơn thì URL cũ BỊ GỠ (cập nhật được)', () => {
    chenUrl(F, '/bai-thuoc/', [`${D}/bai-thuoc/abc/`])
    return loc().length === 5 && !loc().includes(`${D}/bai-thuoc/xyz/`)
  }],
  ['/duoc-lieu/ KHÔNG xoá mất /duoc-lieu/nhom/', () => {
    writeFileSync(F, goc)
    chenUrl(F, '/duoc-lieu/nhom/', [`${D}/duoc-lieu/nhom/`, `${D}/duoc-lieu/nhom/a/`])
    chenUrl(F, '/duoc-lieu/', [`${D}/duoc-lieu/1/`], { loaiTru: ['/duoc-lieu/nhom/'] })
    const u = loc()
    return u.includes(`${D}/duoc-lieu/nhom/a/`) && u.includes(`${D}/duoc-lieu/`) && u.includes(`${D}/duoc-lieu/1/`)
  }],
  ['builder TỰ cấp trang gom thì de-dup được nó', () => {
    writeFileSync(F, goc)
    chenUrl(F, '/nguon/', [`${D}/nguon/`, `${D}/nguon/a/`])
    chenUrl(F, '/nguon/', [`${D}/nguon/`, `${D}/nguon/a/`])
    const u = loc(); return u.filter(x=>x===`${D}/nguon/`).length === 1
  }],
]
let hong = 0
for (const [ten, f] of thu) {
  let ok = false
  try { ok = f() } catch (e) { ok = false }
  if (!ok) hong++
  console.log(`${ok ? '✓' : '✗'} ${ten}`)
}
process.exit(hong ? 1 : 0)
