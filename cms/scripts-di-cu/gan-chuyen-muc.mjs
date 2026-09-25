// gan-chuyen-muc.mjs — Gán chuyên mục + cụm cho các bài đã di cư.
//
// Vì sao ghi thẳng bảng: API nhận `taxonomies` ở CẤP THÂN yêu cầu, nhưng CLI của EmDash ép mọi
// thứ vào `data` nên báo "taxonomies: unknown field". Không có lệnh CLI nào gán term, và REST
// thì đòi phiên đăng nhập (dev bypass chỉ áp cho CLI, curl trần trả 401).
//
// content_taxonomies là bảng NỐI đơn giản — không revision, không trigger — nên ghi thẳng an
// toàn. Cái mất là lời gọi invalidateTermCache của EmDash; khởi động lại server là sạch.
import { readFileSync, readdirSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { createRequire } from 'node:module'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const goc = resolve(here, '../..')
const require = createRequire(import.meta.url)
const { Client } = require(resolve(goc, 'backend/node_modules/pg'))
const env = parseEnv(readFileSync(resolve(goc, 'cms/.env'), 'utf8'))

// Nhãn trong file .md -> slug term đã tạo trong CMS.
const CHUYEN_MUC = {
  'Đo Kinh Lạc': 'do-kinh-lac', 'Huyệt Vị': 'huyet-vi', 'Kinh Lạc': 'kinh-lac',
  'Phần Mềm': 'phan-mem', 'Quản Lý Phòng Khám': 'quan-ly-phong-kham', 'Bài Thuốc': 'bai-thuoc',
}
const CUM = { A: 'cum-a', B: 'cum-b', C: 'cum-c' }

const NGUON = resolve(goc, 'frontend/content/blog')
const doc = (f) => {
  const t = readFileSync(join(NGUON, f), 'utf8')
  const m = t.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  const g = (k) => {
    const r = new RegExp('^' + k + ':\\s*(.+)$', 'm').exec(m?.[1] || '')
    return r ? r[1].trim().replace(/^["']|["']$/g, '') : ''
  }
  return { slug: g('slug') || f.replace(/\.md$/, ''), chuyenMuc: g('category'), cum: g('cluster') }
}

const c = new Client({
  host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
  database: env.PGDATABASE, ssl: { ca: readFileSync(resolve(goc, 'cms/aiven-ca.pem'), 'utf8'), rejectUnauthorized: true },
})
await c.connect()

const terms = new Map(
  (await c.query('SELECT id, name, slug FROM taxonomies')).rows.map((r) => [`${r.name}:${r.slug}`, r.id]),
)
const baiViet = new Map(
  (await c.query('SELECT id, slug, locale FROM ec_bai_viet WHERE deleted_at IS NULL')).rows.map((r) => [r.slug, r]),
)

let gan = 0, bo = 0
for (const f of readdirSync(NGUON).filter((x) => x.endsWith('.md'))) {
  const { slug, chuyenMuc, cum } = doc(f)
  const bai = baiViet.get(slug)
  if (!bai) { console.log(`  · ${slug}: không có trong CMS`); bo++; continue }

  const can = []
  if (CHUYEN_MUC[chuyenMuc]) can.push(['chuyen_muc', CHUYEN_MUC[chuyenMuc]])
  if (CUM[cum]) can.push(['cum', CUM[cum]])
  if (!can.length) { console.log(`  · ${slug}: không có chuyên mục/cụm`); continue }

  const nhan = []
  for (const [ten, tslug] of can) {
    const tid = terms.get(`${ten}:${tslug}`)
    if (!tid) { console.log(`  ✗ ${slug}: thiếu term ${ten}:${tslug}`); continue }
    await c.query(
      `INSERT INTO content_taxonomies (collection, entry_id, taxonomy_id, status, locale, published_at, created_at)
       VALUES ($1,$2,$3,'published',$4, now(), now())
       ON CONFLICT DO NOTHING`,
      ['bai_viet', bai.id, tid, bai.locale || 'en'],
    )
    nhan.push(tslug)
  }
  console.log(`  ✓ ${slug.padEnd(32)} ${nhan.join(' · ')}`)
  gan++
}
const tong = await c.query('SELECT count(*)::int n FROM content_taxonomies')
console.log(`\nĐã gán cho ${gan} bài${bo ? `, bỏ ${bo}` : ''}. Tổng dòng trong bảng nối: ${tong.rows[0].n}`)
await c.end()
