// do-mat-do-man — ĐẾM MẬT ĐỘ THỊ GIÁC của một màn. CHỈ ĐỌC.
//
// Có vì "giao diện nặng nề" là nhận xét không sửa được: không biết nặng bao nhiêu thì không
// biết đã nhẹ chưa. Script này biến nó thành số — và chính nó đã chẩn ra gốc vấn đề ngày
// 22/10/2026: riêng bước 1 của màn Kết Quả Đo có 219 phần tử, 41 nút, 13 cỡ chữ, nhỏ nhất 9px.
//
// Dùng:  node scripts/do-mat-do-man.mjs <url> [rộng] [cao]
//
// Màn trong /app đòi đăng nhập, mà Playwright mở trình duyệt SẠCH — không có phiên nào. Nạp
// token vào bằng biến môi trường (lấy từ DevTools của trình duyệt đang đăng nhập:
// Application → Local Storage → access_token):
//
//   TOKEN=<access_token> node scripts/do-mat-do-man.mjs "https://kinhlac.online/app/..."
//
// Thiếu TOKEN thì script vẫn chạy nhưng đo nhầm trang đăng nhập — nên nó NÓI RA thay vì
// im lặng trả một con số vô nghĩa.
//
// ⚠️ CHỐT TỰ KIỂM: đo HAI lượt liên tiếp không thao tác gì; khác nhau thì số không tin được.
//    Màn này vẽ đồ hình theo nhu cầu và nạp mesh giai đoạn hai, nên so ảnh chụp là phép đo
//    DỐI (xem memory `phep-do-ui-phai-co-chot-tu-kiem`). Đếm phần tử thì ổn định.
import { chromium } from 'playwright'

const URL = process.argv[2]
const W = Number(process.argv[3] || 1440)
const H = Number(process.argv[4] || 692)
if (!URL) { console.error('Dùng: node scripts/do-mat-do-man.mjs <url> [rộng] [cao]'); process.exit(1) }

const dem = () => {
  const man = innerHeight
  const all = [...document.querySelectorAll('.content-area *, main *')].filter((e) => {
    const r = e.getBoundingClientRect()
    return r.top < man && r.bottom > 0 && r.width > 2 && r.height > 2
  })
  const cu = new Set(), mau = new Set(), bong = new Set()
  let nut = 0, nhoNhat = 99
  for (const e of all) {
    const s = getComputedStyle(e)
    cu.add(s.fontSize); mau.add(s.color)
    if (s.boxShadow !== 'none') bong.add(s.boxShadow)
    const px = parseFloat(s.fontSize)
    if (e.textContent?.trim() && px && px < nhoNhat) nhoNhat = px
    if (/^(BUTTON|A)$/.test(e.tagName) || e.getAttribute('role') === 'button') nut++
  }
  return { pt: all.length, nut, cu: cu.size, mau: mau.size, bong: bong.size, nhoNhat }
}

const br = await chromium.launch()
const ctx = await br.newContext({ viewport: { width: W, height: H } })
if (process.env.TOKEN) {
  const t = process.env.TOKEN
  await ctx.addInitScript((tk) => { try { localStorage.setItem('access_token', tk) } catch {} }, t)
}
const pg = await ctx.newPage()
await pg.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
await pg.waitForTimeout(15000)
const a = await pg.evaluate(dem)
await pg.waitForTimeout(1500)
const b = await pg.evaluate(dem)
const on = JSON.stringify(a) === JSON.stringify(b)

// Đo nhầm trang đăng nhập là cái bẫy im lặng nhất ở đây: nó vẫn ra một con số đẹp.
const daVao = await pg.evaluate(() => !/\/login|\/khach-hang/.test(location.pathname))
if (!daVao) console.log('  ⚠ ĐANG Ở TRANG ĐĂNG NHẬP — số dưới KHÔNG phải của màn bạn muốn đo. Đặt TOKEN=…')

console.log(`  chốt dụng cụ : hai lượt không thao tác ${on ? '✓ GIỐNG — số dưới tin được' : '✗ KHÁC — số dưới KHÔNG tin được'}`)
console.log(`  phần tử ${a.pt} · nút ${a.nut} · cỡ chữ ${a.cu} · màu chữ ${a.mau} · bóng ${a.bong} · nhỏ nhất ${a.nhoNhat}px`)
console.log('')
console.log('  Đích của spec 2026-10-22: phần tử ≤35 · nút ≤8 · cỡ chữ ≤5 · nhỏ nhất ≥12px · bóng 0')
await br.close()
