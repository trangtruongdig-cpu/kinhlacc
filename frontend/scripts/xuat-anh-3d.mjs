// xuat-anh-3d.mjs — Xuất 1.440 ảnh 3D huyệt từ kho CMS ra TỆP TĨNH có tên CÓ NGHĨA.
//
// VÌ SAO KHÔNG DÙNG URL CỦA CMS (`/_emdash/api/media/file/<ULID>.webp`):
//
//  1. BYTE ẢNH KHÔNG CÓ TRÊN VPS. EmDash cất ảnh trên đĩa TỪNG MÁY, còn CSDL thì dùng
//     chung — nên deploy xong, trang dựng đủ chữ mà ảnh trả 404. Đã xảy ra thật.
//     Không chuyển tệp lên được: VPS không mở cổng SSH nào (dò 7 cổng, chỉ 443 mở).
//     Xuất thành tệp tĩnh thì ảnh ĐI THEO GIT, có mặt ở mọi nơi có mã nguồn.
//
//  2. TÊN TỆP ULID LÀ BƯỚC LÙI VỀ SEO ẢNH. Google dùng tên tệp và đường dẫn làm tín
//     hiệu xếp hạng. `01M3DPQ6M6....webp` không nói gì; `/anh/huyet/hop-coc-tren-da.webp`
//     nói đủ. Đường `/_emdash/api/` còn phát tín hiệu "đây là API", không phải thư viện ảnh.
//
//  3. Ảnh tĩnh do nginx phục vụ thẳng, không chết theo container CMS, và được đệm mạnh.
//
// CMS vẫn là nơi BIÊN TẬP và là bản lưu — nó chỉ không còn là đường phục vụ. Sửa ảnh
// trong CMS thì chạy lại script này rồi build, y như cách chữ đã làm (xuat-huyet-js.mjs).
//
// ⚠️ TÊN TỆP PHẢI SUY RA ĐƯỢC, không dùng bảng tra: `xuat-huyet-js.mjs` cũng dựng đúng
// tên này để ghi vào acupoints.js. Hai bên suy từ cùng (slug, vai, đuôi) nên không cần
// truyền bảng tra qua lại — lệch nhau là ảnh 404 mà trang vẫn dựng.
//
//   node scripts/xuat-anh-3d.mjs          # chạy thử: đếm, không ghi
//   node scripts/xuat-anh-3d.mjs --ghi    # ghi thật

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync, statSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { createRequire } from 'node:module'
import { dirname, join, resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const goc = resolve(root, '..')
const require = createRequire(import.meta.url)
const seGhi = process.argv.includes('--ghi')

// vai trò ảnh ↔ hậu tố trong tên tệp. Giữ ĐỒNG BỘ với xuat-huyet-js.mjs.
export const VAI = { anh_da: 'tren-da', anh_gp: 'tren-giai-phau', anh_lan: 'huyet-lan-can', anh_kinh: 'toan-duong-kinh' }
export const THU_MUC = 'anh/huyet'

/** Đường dẫn công khai của một tấm — hàm DUY NHẤT quyết định tên tệp. */
export const duongAnh3d = (slug, vai, duoi) => `/${THU_MUC}/${slug}-${VAI[vai]}${duoi}`

const envPath = join(goc, 'cms/.env')
if (!existsSync(envPath)) { console.warn('⚠ xuat-anh-3d: không thấy cms/.env — BỎ QUA.'); process.exit(0) }
const env = parseEnv(readFileSync(envPath, 'utf8'))
const { Client } = require('pg')
const kho = new Client({
  host: env.PGHOST, port: Number(env.PGPORT), user: env.PGUSER, password: env.PGPASSWORD,
  database: env.PGDATABASE,
  ssl: { ca: readFileSync(join(goc, 'cms/aiven-ca.pem'), 'utf8'), rejectUnauthorized: true },
})
await kho.connect()
const rows = (await kho.query(
  `SELECT slug, slug_goc, anh_da, anh_gp, anh_lan, anh_kinh FROM ec_huyet_vi
   WHERE deleted_at IS NULL AND status = 'published'
     AND (anh_da IS NOT NULL OR anh_gp IS NOT NULL OR anh_lan IS NOT NULL OR anh_kinh IS NOT NULL)`,
)).rows
await kho.end()

const khoaCua = (v) => {
  let o = v
  if (typeof o === 'string') { try { o = JSON.parse(o) } catch { return null } }
  return o?.meta?.storageKey || null   // KHÔNG rơi về o.id: id trần không phải tên tệp
}

const nguon = join(goc, 'cms/uploads')
const dich = join(root, 'public', THU_MUC)
const canGhi = []
let thieuByte = 0
for (const r of rows) {
  // ⚠️ DÙNG slug ĐÃ KHỬ TRÙNG (`r.slug`), KHÔNG dùng `slug_goc`. slug thô TRÙNG NHAU giữa
  // các huyệt khác tên — ví dụ "Cư Liêu" và "Cự Liêu" đều ra `cu-lieu`. Lượt đầu tôi dùng
  // slug_goc và 16 tấm đè lên nhau: xuất 1.440 mà chỉ còn 1.424 tệp trên đĩa. Lỗi chỉ lộ
  // ra khi ĐỐI CHIẾU SỐ ĐẾM, vì ghi đè không báo lỗi gì.
  const slug = r.slug
  for (const cot of Object.keys(VAI)) {
    const khoa = khoaCua(r[cot])
    if (!khoa) continue
    const tuDia = join(nguon, khoa)
    if (!existsSync(tuDia)) { thieuByte++; continue }
    canGhi.push({ tu: tuDia, ten: `${slug}-${VAI[cot]}${extname(khoa)}` })
  }
}
console.log(`Huyệt có ảnh 3D: ${rows.length} · tấm cần xuất: ${canGhi.length}` +
  `${thieuByte ? ` · THIẾU BYTE ${thieuByte} tấm (có bản ghi mà không có tệp trong cms/uploads)` : ''}`)
const tongMB = canGhi.reduce((a, x) => a + statSync(x.tu).size, 0) / 1048576
console.log(`Dung lượng: ${tongMB.toFixed(1)} MB → ${dich.replace(goc + '/', '')}`)

if (!seGhi) { console.log('\nChạy lại với --ghi để xuất thật.'); process.exit(0) }

mkdirSync(dich, { recursive: true })
// Dọn tệp thừa từ lượt trước: huyệt bị đổi slug hoặc gỡ ảnh sẽ để lại rác.
const muon = new Set(canGhi.map((x) => x.ten))
let daXoa = 0
for (const n of readdirSync(dich)) if (!muon.has(n)) { unlinkSync(join(dich, n)); daXoa++ }

let ghi = 0, boQua = 0
for (const x of canGhi) {
  const d = join(dich, x.ten)
  // Đã có với ĐÚNG kích thước thì bỏ qua — chạy lại không ghi đè vô ích.
  if (existsSync(d) && statSync(d).size === statSync(x.tu).size) { boQua++; continue }
  writeFileSync(d, readFileSync(x.tu))
  ghi++
}
console.log(`\n✓ Xuất ${ghi} tấm · giữ nguyên ${boQua} · dọn ${daXoa} tệp thừa`)
console.log('→ Chạy tiếp: node ../cms/scripts-di-cu/xuat-huyet-js.mjs   (để acupoints.js trỏ đúng tên mới)')
