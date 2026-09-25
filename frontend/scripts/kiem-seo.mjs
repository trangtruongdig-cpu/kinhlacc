// kiem-seo.mjs — CHỐT CHẶN thứ hai của build: thẻ SEO có ĐẠT không?
//
// Vì sao cần: kiem-sitemap.mjs chỉ ĐẾM số URL. Nó bắt được thảm hoạ "cả bước prerender
// bị bỏ qua", nhưng hoàn toàn mù với chất lượng: 16.364 trang có thể đủ mặt trong
// sitemap mà vẫn mất sạch thẻ canonical, hoặc dùng chung một mô tả. Không có chốt này
// thì mọi câu "đã tối ưu SEO" chỉ là cảm tính.
//
// HAI HẠNG PHÉP KIỂM
//   · TUYỆT ĐỐI (ngưỡng 0) — thiếu title/description/canonical/JSON-LD, hoặc canonical
//     trỏ sai chính đường dẫn của nó. Đây là hỏng, không phải "chưa tối ưu".
//   · TỈ LỆ — mô tả quá dài/quá ngắn, tiêu đề hoặc mô tả trùng nhau. Đặt theo SỐ ĐO
//     THẬT tại thời điểm viết cộng biên, để giữ CHỐT XUÔI: trạng thái hôm nay đi lọt,
//     mọi bước lùi thì gãy. Dùng TỈ LỆ chứ không dùng số tuyệt đối vì số trang còn
//     tăng (vừa thêm 2.139 trang nguồn); ngưỡng tuyệt đối sẽ tự hỏng theo.
//
// ⚠️ Khi sửa được thật (vd viết lại mô tả cho ngắn) thì phải HẠ ngưỡng xuống theo,
// không thì chốt hết tác dụng canh chừng.
//
//   node scripts/kiem-seo.mjs          # chạy trong build, gãy build nếu không đạt
//   node scripts/kiem-seo.mjs --bao    # chỉ in báo cáo, luôn thoát 0

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join, relative } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const distDir = process.env.DIST_DIR ? resolve(process.env.DIST_DIR) : resolve(root, 'dist')
const chiBao = process.argv.includes('--bao')

// Ngưỡng TỈ LỆ (phần trăm số trang). Số trong ngoặc là số đo thật ngày 26/09/2026.
const NGUONG_TI_LE = {
  // Đo lần đầu: 53,1% mô tả quá dài, gần hết là /bai-thuoc/ (8.492/13.943) do generator
  // cắt cứng ở 300 ký tự. Sửa gốc bằng clipMoTa() cắt ở ranh giới từ tại 158 → còn
  // 0,02%. Ngưỡng hạ theo số MỚI, đúng luật ghi ở đầu tệp: không hạ thì chốt vô dụng.
  moTaQuaDai: [1, 0.02], // mô tả > 165 ký tự: Google cắt cụt
  moTaQuaNgan: [4, 2.81], // mô tả < 70 ký tự: không đủ chào mời
  tieuDeTrung: [0.5, 0.12],
  moTaTrung: [0.5, 0.11],
}
const DAI_TOI_DA = 165
const NGAN_TOI_THIEU = 70

const trang = []
;(function quet(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const q = join(d, e.name)
    if (e.isDirectory()) quet(q)
    else if (e.name === 'index.html') trang.push(q)
  }
})(distDir)

if (!trang.length) {
  console.error(`✗ kiem-seo: không thấy trang nào trong ${distDir}. Bước build đã không chạy.`)
  process.exit(1)
}

const lay = (h, re) => {
  const m = h.match(re)
  return m ? m[1] : ''
}

const demTieuDe = new Map()
const demMoTa = new Map()
const loi = { thieuTieuDe: [], thieuMoTa: [], thieuCanonical: [], thieuLd: [], canonicalLech: [] }
let moTaQuaDai = 0
let moTaQuaNgan = 0

for (const q of trang) {
  const h = readFileSync(q, 'utf8')
  const ten = '/' + relative(distDir, q).replace(/index\.html$/, '')
  const tieuDe = lay(h, /<title>([\s\S]*?)<\/title>/)
  const moTa = lay(h, /<meta name="description" content="([\s\S]*?)"/)
  const canonical = lay(h, /<link rel="canonical" href="([^"]*)"/)

  if (!tieuDe.trim()) loi.thieuTieuDe.push(ten)
  if (!moTa.trim()) loi.thieuMoTa.push(ten)
  else {
    if (moTa.length > DAI_TOI_DA) moTaQuaDai++
    if (moTa.length < NGAN_TOI_THIEU) moTaQuaNgan++
    demMoTa.set(moTa, (demMoTa.get(moTa) || 0) + 1)
  }
  if (!canonical) loi.thieuCanonical.push(ten)
  else {
    // canonical phải trỏ về CHÍNH trang này. Trỏ lệch là lỗi chết người: Google gộp
    // mọi trang về một địa chỉ và số còn lại biến mất khỏi kết quả tìm kiếm.
    let duong = ''
    try { duong = new URL(canonical).pathname } catch { duong = canonical }
    const mong = ten.endsWith('/') ? ten : ten + '/'
    const thuc = duong.endsWith('/') ? duong : duong + '/'
    if (thuc !== mong) loi.canonicalLech.push(`${ten} → ${duong}`)
  }
  if (!/application\/ld\+json/.test(h)) loi.thieuLd.push(ten)
  if (tieuDe.trim()) demTieuDe.set(tieuDe, (demTieuDe.get(tieuDe) || 0) + 1)
}

const soTrung = (m) => [...m.values()].filter((v) => v > 1).reduce((a, b) => a + b, 0)
const tiLe = (n) => (n / trang.length) * 100
const doDuoc = {
  moTaQuaDai: tiLe(moTaQuaDai),
  moTaQuaNgan: tiLe(moTaQuaNgan),
  tieuDeTrung: tiLe(soTrung(demTieuDe)),
  moTaTrung: tiLe(soTrung(demMoTa)),
}

console.log(`── kiem-seo: ${trang.length} trang tĩnh trong ${relative(root, distDir) || 'dist'} ──`)

let hong = 0
const NHAN = {
  thieuTieuDe: 'thiếu <title>',
  thieuMoTa: 'thiếu description',
  thieuCanonical: 'thiếu canonical',
  thieuLd: 'thiếu JSON-LD',
  canonicalLech: 'canonical TRỎ LỆCH',
}
for (const [k, ds] of Object.entries(loi)) {
  const dat = ds.length === 0
  if (!dat) hong++
  console.log(`  ${dat ? '✓' : '✗'} ${NHAN[k].padEnd(22)} ${String(ds.length).padStart(6)}  (phải bằng 0)`)
  if (!dat) for (const x of ds.slice(0, 5)) console.log(`        ${x}`)
}

const NHAN2 = {
  moTaQuaDai: `mô tả > ${DAI_TOI_DA} ký tự`,
  moTaQuaNgan: `mô tả < ${NGAN_TOI_THIEU} ký tự`,
  tieuDeTrung: 'tiêu đề trùng nhau',
  moTaTrung: 'mô tả trùng nhau',
}
for (const [k, [tran, moc]] of Object.entries(NGUONG_TI_LE)) {
  const v = doDuoc[k]
  const dat = v <= tran
  if (!dat) hong++
  console.log(
    `  ${dat ? '✓' : '✗'} ${NHAN2[k].padEnd(22)} ${v.toFixed(2).padStart(6)}%  (trần ${tran}% · mốc ${moc}%)`,
  )
}

if (hong) {
  console.error(`\n✗ kiem-seo: ${hong} phép kiểm KHÔNG đạt.`)
  console.error('  Nếu đây là thay đổi CÓ CHỦ Ý thì sửa ngưỡng trong kiem-seo.mjs cùng lúc.')
  if (!chiBao) process.exit(1)
} else {
  console.log(`\n✓ kiem-seo: tất cả ${Object.keys(loi).length + Object.keys(NGUONG_TI_LE).length} phép kiểm đều đạt.`)
}
