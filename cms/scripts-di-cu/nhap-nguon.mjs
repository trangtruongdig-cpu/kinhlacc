// nhap-nguon.mjs — Chép thư mục nguồn (2.139 mục) từ DB chính sang CMS.
//
// Vì sao ghi thẳng bảng thay vì gọi CLI: CLI mất ~7 giây mỗi mục (khởi động tiến trình +
// dựng phiên bản + chỉ mục tìm kiếm) — 2.139 mục là gần 4 tiếng. Đã thử: chèn thẳng vào
// ec_* KHÔNG kèm revision vẫn đọc được bình thường qua CLI và qua trang.
//
// Đây là chép MỘT CHIỀU, một lần. Sau đó thư mục sống trong CMS và anh sửa ở đó.
//
//   node scripts-di-cu/nhap-nguon.mjs --thu
//   node scripts-di-cu/nhap-nguon.mjs
import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const goc = resolve(here, '../..')
const require = createRequire(import.meta.url)
const { Client } = require(resolve(goc, 'backend/node_modules/pg'))
const chiThu = process.argv.includes('--thu')

const be = parseEnv(readFileSync(resolve(goc, 'backend/.env'), 'utf8'))
const cms = parseEnv(readFileSync(resolve(goc, 'cms/.env'), 'utf8'))
const ca = readFileSync(resolve(goc, 'cms/aiven-ca.pem'), 'utf8')

const nguonApp = new Client({ host: be.DB_HOST, port: +be.DB_PORT, user: be.DB_USER,
  password: be.DB_PASSWORD, database: be.DB_NAME, ssl: { ca, rejectUnauthorized: true } })
const kho = new Client({ host: cms.PGHOST, port: +cms.PGPORT, user: cms.PGUSER,
  password: cms.PGPASSWORD, database: cms.PGDATABASE, ssl: { ca, rejectUnauthorized: true } })

await nguonApp.connect()
const ds = (await nguonApp.query(
  `SELECT slug, ten, loai, tac_gia, nien_dai, ten_khac, ghi_chu, link
   FROM nguon WHERE ten IS NOT NULL AND trim(ten) <> '' ORDER BY id`)).rows
await nguonApp.end()
console.log(`Thư mục nguồn trong DB chính: ${ds.length} mục`)

if (chiThu) {
  const theoLoai = ds.reduce((a, r) => ((a[r.loai || '(trống)'] = (a[r.loai || '(trống)'] || 0) + 1), a), {})
  console.log('theo loại:', Object.entries(theoLoai).map(([k, v]) => `${k}=${v}`).join(' · '))
  console.log('\n5 mục đầu:')
  for (const r of ds.slice(0, 5))
    console.log(`  ${(r.slug || '').padEnd(34)} ${r.ten.slice(0, 40).padEnd(42)} ${r.loai || ''} ${r.tac_gia ? '· ' + r.tac_gia.slice(0, 30) : ''}`)
  process.exit(0)
}

await kho.connect()
const daCo = new Set((await kho.query('SELECT slug FROM ec_nguon_y_van')).rows.map((r) => r.slug))

// ULID Crockford base32 — EmDash dùng dạng này cho id.
const ABC = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const ulid = () => { let s = ''; for (let i = 0; i < 26; i++) s += ABC[Math.floor(Math.random() * 32)]; return s }
const slugHoa = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)

let them = 0, bo = 0
for (const r of ds) {
  const slug = r.slug || slugHoa(r.ten)
  if (!slug || daCo.has(slug)) { bo++; continue }
  daCo.add(slug)
  const id = ulid()
  await kho.query(
    `INSERT INTO ec_nguon_y_van
       (id, slug, status, created_at, updated_at, published_at, version, locale, translation_group,
        title, loai, tac_gia, nien_dai, ten_khac, ghi_chu, lien_ket)
     VALUES ($1,$2,'published',now(),now(),now(),1,'en',$1,$3,$4,$5,$6,$7,$8,$9)`,
    [id, slug, r.ten, r.loai, r.tac_gia, r.nien_dai, r.ten_khac, r.ghi_chu, r.link],
  )
  them++
  if (them % 300 === 0) console.log(`  …${them}`)
}
const tong = await kho.query('SELECT count(*)::int n FROM ec_nguon_y_van WHERE deleted_at IS NULL')
console.log(`\nThêm ${them} mục${bo ? `, bỏ ${bo} (trùng slug hoặc thiếu tên)` : ''}. Tổng trong CMS: ${tong.rows[0].n}`)
await kho.end()
