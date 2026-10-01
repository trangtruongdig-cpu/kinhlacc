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
  // 29/09/2026: TỔNG 9.206 → 7.373 CÓ CHỦ Ý — bỏ 772 bài thuốc trùng (canonical về bản
  // chính) và 1.276 nguồn mỏng (luật mới ≥3 trích dẫn). Xem docs/superpowers/plans/2026-09-29-seo-thong-nhat.md.
  ['TỔNG',            null,                  6200, 7373],
  ['/bai-thuoc/',     '/bai-thuoc/',         4000, 5427],
  ['/duoc-lieu/',     '/duoc-lieu/',          150,  268],
  ['/huyet/',         '/huyet/',              600,  662],
  ['/cham-cuu-tri-benh/', '/cham-cuu-tri-benh/', 80,  101],
  ['/benh-hoc/',      '/benh-hoc/',            80,  101],
  ['/blog/',          '/blog/',                 8,   12],
  // Thư mục nguồn: 2.139 nguồn. Từ 29/09/2026 chỉ index nguồn có ≥3 trích dẫn hoặc có mô
  // tả (trước đó ≥1 → 2.045 URL, trung vị 47 từ — trang mỏng). Ngưỡng ≈ 73% số thật.
  ['/nguon/',         '/nguon/',              560,  769],
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

// LASTMOD BẰNG NGÀY BUILD — ngưỡng 50%. Đo 01/10/2026 trên site thật: 6.634/7.400 URL mang
// cùng một lastmod = ngày build, vì bốn builder đều truyền `new Date()`. Google bỏ qua
// lastmod khi nó đổi mỗi lần phát hành, nên cả kho phát một tín hiệu RỖNG mà không gì báo.
//
// ⚠️ Chốt này canh "bằng NGÀY BUILD", KHÔNG canh "nhiều URL trùng ngày". Kho này trùng ngày
// là bình thường và ĐÚNG: `updated_at` của CMS phần lớn là 2026-09-25, ngày nhập liệu hàng
// loạt (ec_bai_thuoc 13.898/13.942 mục). Một chốt kiểu "quá 60% cùng lastmod thì gãy" sẽ
// gãy oan ngay lần chạy đầu — đã tính và bỏ.
const homNay = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10)
const lastmods = sm.match(/<lastmod>[^<]*<\/lastmod>/g) || []
const soNgayBuild = lastmods.filter((l) => l.includes(homNay)).length
const tiLe = locs.length ? soNgayBuild / locs.length : 0
const TRAN_NGAY_BUILD = 0.5
console.log('── kiem-sitemap: lastmod có mang tin không ──')
const datNgay = tiLe < TRAN_NGAY_BUILD
console.log(
  `  ${datNgay ? '✓' : '✗'} lastmod = ngày build  ${String(soNgayBuild).padStart(6)}` +
  `  (${(tiLe * 100).toFixed(1)}% số URL, phải dưới ${TRAN_NGAY_BUILD * 100}%)`,
)
if (!datNgay) {
  hong++
  console.log(
    `      Builder nào đó đang truyền ngày build làm lastmod. Ngày sửa thật lấy qua` +
    `\n      scripts/ngay-cms.mjs (updated_at của CMS); tra không ra thì BỎ HẲN thẻ lastmod.`,
  )
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
