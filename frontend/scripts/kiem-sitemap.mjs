// kiem-sitemap.mjs — CHỐT CHẶN cuối cùng của build: sitemap có đủ trang không?
//
// Vì sao cần: build-dict / build-phuong / build-duoc-lieu / build-nhom-duoc-ly đều được viết để
// "BỎ QUA, build vẫn tiếp tục" khi không nối được DB. Ý đồ tốt (không làm gãy deploy vì một sự
// cố mạng), nhưng nó đã GIẤU một lỗi suốt nhiều tháng: cả ba bước prerender bị bỏ qua ở MỌI lần
// build, 15.054 trang chưa từng vào sitemap, mà build vẫn báo ✓ thành công.
//
// Chốt này đọc sitemap ĐÃ SINH RA và so với ngưỡng tối thiểu. Thiếu → exit 1 → build gãy →
// deploy dừng ngay, thay vì âm thầm đẩy lên một site mất hàng nghìn trang.
//
// Ngưỡng đặt ở khoảng 70–80% số thật (đo 25/09/2026) — đủ thấp để dao động dữ liệu bình thường
// không báo động giả, đủ cao để bắt được thảm hoạ "bỏ qua cả bước".
// ⚠️ Nếu cố ý siết luật index (vd hạ số trang bài thuốc) thì phải hạ ngưỡng ở đây cùng lúc,
// không thì build gãy oan.
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const distDir = process.env.DIST_DIR ? resolve(process.env.DIST_DIR) : resolve(root, 'dist')
const smPath = resolve(distDir, 'sitemap.xml')

// [nhãn, mẫu khớp, ngưỡng tối thiểu, số thật lúc đo]
const NGUONG = [
  ['TỔNG',            null,                  7800, 9206],
  ['/bai-thuoc/',     '/bai-thuoc/',         4000, 5984],
  ['/duoc-lieu/',     '/duoc-lieu/',          150,  268],
  ['/huyet/',         '/huyet/',              600,  662],
  ['/cham-cuu-tri-benh/', '/cham-cuu-tri-benh/', 80,  101],
  ['/benh-hoc/',      '/benh-hoc/',            80,  101],
  ['/blog/',          '/blog/',                 8,   12],
  // Thư mục nguồn: 2.139 nguồn, 2.044 có ít nhất một mục trích dẫn (95 nguồn không ai
  // trích → noindex, không vào sitemap). Ngưỡng 1500 ≈ 73% số thật, cùng cỡ các nhóm khác.
  ['/nguon/',         '/nguon/',             1500, 2045],
]

if (!existsSync(smPath)) {
  console.error(`✗ kiem-sitemap: KHÔNG có ${smPath}. Bước sinh sitemap đã không chạy.`)
  process.exit(1)
}

const sm = readFileSync(smPath, 'utf8')
const locs = sm.match(/<loc>[^<]*<\/loc>/g) || []
const dem = (mau) => (mau === null ? locs.length : locs.filter((l) => l.includes(mau)).length)

let hong = 0

// URL TRÙNG — ngưỡng 0. Vì sao phải kiểm: các builder chèn URL bằng cách ghép vào trước
// </urlset>; ba trong bốn builder từng chỉ kiểm `includes('</urlset>')` (là kiểm sitemap có
// đúng dạng, KHÔNG phải chặn trùng), nên chạy lại một builder là URL của nó vào lần thứ hai.
// Đo thật 26/09/2026: 62 URL /duoc-lieu/nhom/ trùng đúng 2 lần.
//
// Trùng lặp CHE MẤT chính thứ chốt này canh: một bộ mất 62 trang cộng một bộ trùng 62 lần
// thì TỔNG vẫn "đạt ngưỡng". Đã chữa gốc bằng sitemap-chen.mjs (xoá rồi chèn lại), phép
// kiểm này là lưới thứ hai.
const soLan = new Map()
for (const l of locs) soLan.set(l, (soLan.get(l) || 0) + 1)
const trung = [...soLan.entries()].filter(([, n]) => n > 1)
const soTrung = trung.reduce((a, [, n]) => a + n - 1, 0)
console.log('── kiem-sitemap: URL trùng ──')
console.log(`  ${soTrung === 0 ? '✓' : '✗'} URL trùng lặp        ${String(soTrung).padStart(6)}  (phải bằng 0)`)
if (soTrung) {
  hong++
  for (const [l, n] of trung.slice(0, 5)) console.log(`      ×${n}  ${l.replace(/<\/?loc>/g, '')}`)
  if (trung.length > 5) console.log(`      … và ${trung.length - 5} URL nữa`)
}

console.log('── kiem-sitemap: đối chiếu với ngưỡng tối thiểu ──')
for (const [nhan, mau, min, lucDo] of NGUONG) {
  const n = dem(mau)
  const dat = n >= min
  if (!dat) hong++
  console.log(
    `  ${dat ? '✓' : '✗'} ${nhan.padEnd(22)} ${String(n).padStart(6)}` +
    `  (tối thiểu ${min}, lúc đo 25/09/2026 là ${lucDo})`,
  )
}

if (hong) {
  console.error(
    `\n✗ kiem-sitemap: ${hong} nhóm THIẾU trang. Gần như chắc chắn là một bước prerender đã âm thầm` +
    `\n  bỏ qua vì không nối được DB (sai mật khẩu, sai chứng chỉ, Aiven chặn IP, mạng hỏng).` +
    `\n  Đọc ngược lên log tìm dòng "⚠ ... BỎ QUA prerender" để biết bước nào.` +
    `\n  DỪNG BUILD — không đẩy lên site một bản mất hàng nghìn trang.`,
  )
  process.exit(1)
}
console.log(`✓ kiem-sitemap: ${locs.length} URL, tất cả các nhóm đều đạt ngưỡng.`)
