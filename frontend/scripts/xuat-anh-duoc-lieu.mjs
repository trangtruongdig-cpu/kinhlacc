// xuat-anh-duoc-lieu.mjs — Xuất ảnh dược liệu từ kho CMS ra TỆP TĨNH tên CÓ NGHĨA,
// đồng thời chuyển JPEG → WebP.
//
// VÌ SAO CÓ TỆP NÀY — một lỗi tôi để sót và người dùng hỏi mới lộ ra:
// Tôi đã đổi `vi_thuoc.anh_dai_dien` sang URL của CMS (commit ba1cff2), rồi sau đó đảo
// ảnh huyệt/kinh trở về tĩnh nhưng QUÊN đảo bộ dược liệu. Kết quả: 536 ảnh trỏ
// `/_emdash/api/media/file/…` và trả 404 trên site thật, vì byte ảnh nằm trên đĩa máy
// lập trình chứ không ở VPS.
//
// KHÔNG quay lại URL cũ: đường cũ là HOTLINK sang máy chủ thư viện Đại học Baptist
// Hồng Kông (sys01.lib.hkbu.edu.hk). Họ chặn lúc nào cũng được — lúc tải về đã phải
// giảm tốc 420ms vì bị siết.
//
// JPEG → WebP: 375 tệp × trung bình 101 KB = 37 MB. Ở WebP còn khoảng một phần ba, vừa
// nhẹ git vừa nhanh cho người đọc. Chất lượng 82 — mức mà ảnh chụp dược liệu không thấy
// khác bằng mắt.
//
//   node scripts/xuat-anh-duoc-lieu.mjs          # chạy thử
//   node scripts/xuat-anh-duoc-lieu.mjs --ghi    # xuất + cập nhật đường dẫn trong CMS

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync, statSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const goc = resolve(root, '..')
const require = createRequire(import.meta.url)
const seGhi = process.argv.includes('--ghi')
const THU_MUC = 'anh/duoc-lieu'

// sharp nằm trong node_modules của cms (EmDash dùng nó). Không có thì DỪNG hẳn chứ
// không chép nguyên JPEG: chép nguyên là +25 MB vào git mà không ai để ý.
let sharp
try { sharp = require(join(goc, 'cms/node_modules/sharp')) } catch {
  console.error('✗ không nạp được sharp (cms/node_modules/sharp) — DỪNG, không chép nguyên JPEG.')
  process.exit(1)
}

const khongDau = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const env = parseEnv(readFileSync(join(goc, 'cms/.env'), 'utf8'))
const { Client } = require('pg')
const kho = new Client({
  host: env.PGHOST, port: Number(env.PGPORT), user: env.PGUSER, password: env.PGPASSWORD,
  database: env.PGDATABASE,
  ssl: { ca: readFileSync(join(goc, 'cms/aiven-ca.pem'), 'utf8'), rejectUnauthorized: true },
})
await kho.connect()
const rows = (await kho.query(
  `SELECT slug, title, anh FROM ec_duoc_lieu WHERE deleted_at IS NULL AND anh IS NOT NULL`,
)).rows

const khoaCua = (v) => {
  let o = v
  if (typeof o === 'string') { try { o = JSON.parse(o) } catch { return null } }
  return o?.meta?.storageKey || null
}

const nguon = join(goc, 'cms/uploads')
const dich = join(root, 'public', THU_MUC)
const viec = []
let thieuByte = 0
for (const r of rows) {
  const khoa = khoaCua(r.anh)
  if (!khoa) continue
  const tuDia = join(nguon, khoa)
  if (!existsSync(tuDia)) { thieuByte++; continue }
  // Tên: <id>-<tên vị không dấu>.webp — id đứng trước để luôn duy nhất kể cả trùng tên.
  const ten = `${r.slug}-${khongDau(r.title)}.webp`
  viec.push({ slug: r.slug, tu: tuDia, ten, duong: `/${THU_MUC}/${ten}` })
}
console.log(`Dược liệu có ảnh: ${rows.length} · xuất được: ${viec.length}` +
  `${thieuByte ? ` · THIẾU BYTE ${thieuByte}` : ''}`)
console.log(`Nguồn: ${(viec.reduce((a, x) => a + statSync(x.tu).size, 0) / 1048576).toFixed(1)} MB JPEG → WebP`)
if (viec[0]) console.log(`Ví dụ: ${viec[0].duong}`)

if (!seGhi) { console.log('\nChạy lại với --ghi để xuất thật.'); await kho.end(); process.exit(0) }

mkdirSync(dich, { recursive: true })
const muon = new Set(viec.map((x) => x.ten))
let daXoa = 0
for (const n of readdirSync(dich)) if (!muon.has(n)) { unlinkSync(join(dich, n)); daXoa++ }

let ghi = 0, boQua = 0, byteRa = 0
for (const x of viec) {
  const d = join(dich, x.ten)
  if (existsSync(d)) { boQua++; byteRa += statSync(d).size; continue }
  const buf = await sharp(readFileSync(x.tu)).webp({ quality: 82 }).toBuffer()
  writeFileSync(d, buf)
  ghi++; byteRa += buf.length
}
console.log(`\n✓ Xuất ${ghi} tấm · giữ nguyên ${boQua} · dọn ${daXoa} · tổng ${(byteRa / 1048576).toFixed(1)} MB`)

// Cập nhật đường dẫn TRONG CMS, rồi để dong-bo-app mang sang vi_thuoc — KHÔNG ghi thẳng
// vào vi_thuoc, vì lần đồng bộ sau sẽ thấy lệch rồi đẩy giá trị cũ trở lại.
await kho.query('ALTER TABLE ec_duoc_lieu DISABLE TRIGGER USER').catch(() => {})
const r = await kho.query(
  `UPDATE ec_duoc_lieu e SET anh_dai_dien = v.d
   FROM (SELECT unnest($1::text[]) AS slug, unnest($2::text[]) AS d) v
   WHERE e.slug = v.slug AND e.deleted_at IS NULL`,
  [viec.map((x) => x.slug), viec.map((x) => x.duong)],
)
await kho.query('ALTER TABLE ec_duoc_lieu ENABLE TRIGGER USER').catch(() => {})
await kho.end()
console.log(`✓ Cập nhật đường dẫn cho ${r.rowCount} vị trong CMS`)
console.log('→ Chạy tiếp: node ../cms/scripts-di-cu/dong-bo-app.mjs --bo duoc_lieu --ghi --nhieu')
