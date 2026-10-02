// kiem-seo.mjs — CHỐT CHẶN thứ hai của build: thẻ SEO có ĐẠT không?
//
// Vì sao cần: kiem-sitemap.mjs chỉ ĐẾM số URL. Nó bắt được thảm hoạ "cả bước prerender
// bị bỏ qua", nhưng hoàn toàn mù với chất lượng: 16.364 trang có thể đủ mặt trong
// sitemap mà vẫn mất sạch thẻ canonical, hoặc dùng chung một mô tả. Không có chốt này
// thì mọi câu "đã tối ưu SEO" chỉ là cảm tính.
//
// HAI HẠNG PHÉP KIỂM — và chúng đếm trên HAI MẪU KHÁC NHAU
//   · TUYỆT ĐỐI (ngưỡng 0) — thiếu title/description/canonical/JSON-LD, hoặc canonical
//     trỏ sai chính đường dẫn của nó. Đây là hỏng, không phải "chưa tối ưu". Tính trên
//     MỌI trang, kể cả noindex: thẻ hỏng là thẻ hỏng.
//   · TỈ LỆ — mô tả quá dài/quá ngắn, tiêu đề hoặc mô tả trùng nhau. Chỉ tính trên trang
//     ĐƯỢC INDEX, vì đây là chất lượng của chữ HIỆN TRÊN SERP: trang noindex không bao
//     giờ hiện ra nên mô tả của nó không phán được gì. ⚠️ Mẫu này là phần CHỊU LỰC của
//     chốt — đổi nó phải ĐO LẠI cả 5 ngưỡng, đừng đổi một mình. Đặt theo SỐ ĐO
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
  moTaQuaDai: [1, 0.03], // mô tả > 165 ký tự: Google cắt cụt
  // 29/09/2026: 2,81% → 0,60% nhờ công thức mô tả ghép nhiều mảnh (nguồn, dược liệu, kinh).
  // 02/10/2026: chốt gãy build VPS ở 2,46%. Đo ra: 492 mô tả ngắn, 430 trong số đó nằm ở
  // trang NOINDEX (/trieu-chung/ mồ côi, builder mới). Chữa bằng cách đếm đúng mẫu (chỉ
  // trang được index) — KHÔNG nới trần — rồi sửa tiếp công thức mô tả /phap-tri/.
  // 02/10/2026 (mẫu mới): 0,69% → 0,10% sau khi build-phap-tri ghép thêm lục kinh, kinh
  // mạch và tác dụng bài thuốc — 53 pháp trị có bài thuốc mà không có cạnh triệu chứng.
  moTaQuaNgan: [1, 0.1], // mô tả < 70 ký tự: không đủ chào mời
  // ⚠️ Mốc của BA phép dưới TĂNG ngày 02/10/2026 mà chất lượng KHÔNG tụt: mẫu chia đổi từ
  // 19.998 trang sang 9.025 trang được index, cùng một số trang lỗi thì tỉ lệ cao hơn.
  // Biên của tieuDeTrung nay chỉ còn 0,23 điểm — nhóm trang mới nào mang tên trùng là gãy.
  tieuDeTrung: [0.5, 0.27],
  moTaTrung: [0.5, 0.13],
  // Trước 29/09/2026: 99,5% (18.400/18.504) — mọi bộ ghép cứng đuôi + tên thương hiệu. Sau
  // tieuDeSeo(): 0,57% (phần còn lại là tên riêng tự nó đã dài hơn 60 ký tự).
  tieuDeQuaDai: [1, 0.69],
}
const DAI_TOI_DA = 165
const TIEU_DE_TOI_DA = 60 // Google cắt tiêu đề ở ~60 ký tự (tieuDeSeo trong seo-html.mjs)
const giaiMa = (t) => t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
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
const loi = { thieuTieuDe: [], thieuMoTa: [], thieuCanonical: [], thieuLd: [], canonicalLech: [], twitterLech: [] }
// Canonical trỏ sang trang KHÁC là hợp lệ đúng một trường hợp: bản trùng trỏ về bản chính
// (trung-lap-bai-thuoc.mjs). Kiểm ở cuối: đích phải tồn tại và tự trỏ về chính nó (không
// chuỗi canonical), và trang nguồn không được nằm trong sitemap.
const canonicalKhac = []
const canonicalCua = new Map()
let tieuDeQuaDai = 0
let moTaQuaDai = 0
let moTaQuaNgan = 0
let soIndex = 0

for (const q of trang) {
  const h = readFileSync(q, 'utf8')
  const ten = '/' + relative(distDir, q).replace(/index\.html$/, '')
  const tieuDe = lay(h, /<title>([\s\S]*?)<\/title>/)
  const moTa = lay(h, /<meta name="description" content="([\s\S]*?)"/)
  const canonical = lay(h, /<link rel="canonical" href="([^"]*)"/)
  // Mẫu của hạng TỈ LỆ: trang mời bot vào. `noindex` ở đây là thẻ robots do chính builder
  // ghi (luật "đủ dày" của từng bộ) — trang mồ côi vẫn sống cho liên kết nội bộ.
  const laIndex = !/<meta name="robots"[^>]*noindex/i.test(h)
  if (laIndex) soIndex++

  if (!tieuDe.trim()) loi.thieuTieuDe.push(ten)
  else if (laIndex && giaiMa(tieuDe).length > TIEU_DE_TOI_DA) tieuDeQuaDai++
  // twitter:title phải là của CHÍNH trang — trước 29/09/2026 15.056 trang vỏ SPA mang câu
  // chào của trang chủ ở đây.
  const twTitle = lay(h, /<meta name="twitter:title" content="([\s\S]*?)"/)
  if (twTitle && tieuDe && giaiMa(twTitle) !== giaiMa(tieuDe)) loi.twitterLech.push(ten)
  if (!moTa.trim()) loi.thieuMoTa.push(ten)
  else if (laIndex) {
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
    canonicalCua.set(mong, thuc)
    if (thuc !== mong) canonicalKhac.push([mong, thuc])
  }
  if (!/application\/ld\+json/.test(h)) loi.thieuLd.push(ten)
  if (tieuDe.trim() && laIndex) demTieuDe.set(tieuDe, (demTieuDe.get(tieuDe) || 0) + 1)
}

const smXml = (() => { try { return readFileSync(join(distDir, 'sitemap.xml'), 'utf8') } catch { return '' } })()
const trongSm = new Set([...smXml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => {
  let d = m[1]; try { d = new URL(m[1]).pathname } catch {}
  return d.endsWith('/') ? d : d + '/'
}))
for (const [nguon, dich] of canonicalKhac) {
  if (!canonicalCua.has(dich)) loi.canonicalLech.push(`${nguon} → ${dich} (đích KHÔNG tồn tại)`)
  else if (canonicalCua.get(dich) !== dich) loi.canonicalLech.push(`${nguon} → ${dich} → ${canonicalCua.get(dich)} (chuỗi canonical)`)
  else if (trongSm.has(nguon)) loi.canonicalLech.push(`${nguon} → ${dich} (bản phụ vẫn nằm trong sitemap)`)
}

const soTrung = (m) => [...m.values()].filter((v) => v > 1).reduce((a, b) => a + b, 0)
// Chia cho SỐ TRANG ĐƯỢC INDEX, không chia cho tổng số trang: xem ghi chú đầu tệp.
const tiLe = (n) => (soIndex ? (n / soIndex) * 100 : 0)
const doDuoc = {
  moTaQuaDai: tiLe(moTaQuaDai),
  moTaQuaNgan: tiLe(moTaQuaNgan),
  tieuDeTrung: tiLe(soTrung(demTieuDe)),
  moTaTrung: tiLe(soTrung(demMoTa)),
  tieuDeQuaDai: tiLe(tieuDeQuaDai),
}

console.log(
  `── kiem-seo: ${trang.length} trang tĩnh trong ${relative(root, distDir) || 'dist'}`
  + ` — ${soIndex} được index, ${trang.length - soIndex} noindex ──`,
)
console.log('  · phép TUYỆT ĐỐI tính trên mọi trang · phép TỈ LỆ chỉ trên trang được index')
if (!soIndex) console.log('  ⚠ KHÔNG có trang nào được index — mọi phép tỉ lệ thành 0, chốt không phán được gì.')
console.log(`  · ${canonicalKhac.length} trang bản trùng trỏ canonical về bản chính (đã xác minh đích)`)

let hong = 0
const NHAN = {
  thieuTieuDe: 'thiếu <title>',
  thieuMoTa: 'thiếu description',
  thieuCanonical: 'thiếu canonical',
  thieuLd: 'thiếu JSON-LD',
  canonicalLech: 'canonical TRỎ LỆCH',
  twitterLech: 'twitter:title lệch title',
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
  tieuDeQuaDai: `tiêu đề > ${TIEU_DE_TOI_DA} ký tự`,
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
