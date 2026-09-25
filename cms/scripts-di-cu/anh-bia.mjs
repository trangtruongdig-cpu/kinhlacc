// anh-bia.mjs — Tải ảnh bìa từ site thật, nạp vào thư viện ảnh của CMS rồi gán cho bài.
//
// Ảnh kinh mạch KHÔNG nằm trong repo (chỉ có trên máy chủ), nên phải tải về trước.
// Ảnh dùng lại giữa nhiều bài thì chỉ tải và nạp MỘT lần.
//
//   node scripts-di-cu/anh-bia.mjs --thu   # chỉ in, không ghi
//   node scripts-di-cu/anh-bia.mjs
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { parseEnv } from 'node:util'
import { createRequire } from 'node:module'
import { dirname, resolve, join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const goc = resolve(here, '../..')
const cmsDir = resolve(here, '..')
const BIN = resolve(cmsDir, 'node_modules/.bin/emdash')
const SITE = 'https://kinhlac.online'
const TAM = resolve(goc, 'cms/.tam-anh')
const chiThu = process.argv.includes('--thu')

const require = createRequire(import.meta.url)
const { Client } = require(resolve(goc, 'backend/node_modules/pg'))
const env = parseEnv(readFileSync(resolve(cmsDir, '.env'), 'utf8'))

const NGUON = resolve(goc, 'frontend/content/blog')
const bai = []
for (const f of readdirSync(NGUON).filter((x) => x.endsWith('.md'))) {
  const t = readFileSync(join(NGUON, f), 'utf8')
  const fm = (t.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [])[1] || ''
  const g = (k) => ((new RegExp('^' + k + ':\\s*(.+)$', 'm').exec(fm) || [])[1] || '').trim().replace(/^["']|["']$/g, '')
  const anh = g('image')
  if (anh) bai.push({ slug: g('slug') || f.replace(/\.md$/, ''), anh, tieuDe: g('title') })
}

mkdirSync(TAM, { recursive: true })
const idTheoAnh = new Map()   // đường dẫn ảnh -> id trong thư viện (tải + nạp 1 lần)
let gan = 0, thieu = 0

const c = new Client({
  host: env.PGHOST, port: +env.PGPORT, user: env.PGUSER, password: env.PGPASSWORD,
  database: env.PGDATABASE, ssl: { ca: readFileSync(resolve(cmsDir, 'aiven-ca.pem'), 'utf8'), rejectUnauthorized: true },
})
if (!chiThu) await c.connect()

for (const b of bai) {
  if (!idTheoAnh.has(b.anh)) {
    const ten = basename(b.anh)
    const duong = join(TAM, ten)
    if (!existsSync(duong)) {
      const r = await fetch(SITE + b.anh)
      if (!r.ok) { console.log(`  ✗ ${b.slug}: ảnh ${b.anh} -> ${r.status}`); idTheoAnh.set(b.anh, null); thieu++; continue }
      writeFileSync(duong, Buffer.from(await r.arrayBuffer()))
    }
    if (chiThu) { console.log(`  · sẽ nạp ${ten}`); idTheoAnh.set(b.anh, 'THU'); continue }
    try {
      const ra = execFileSync(BIN, ['media', 'upload', duong, '--alt', b.tieuDe || b.slug], { cwd: cmsDir, encoding: 'utf8', stdio: ['ignore','pipe','pipe'] })
      idTheoAnh.set(b.anh, JSON.parse(ra).id)
      console.log(`  ↑ nạp ${ten} -> ${JSON.parse(ra).id}`)
    } catch (e) {
      console.log(`  ✗ nạp ${ten} lỗi: ${String(e.stderr || e.message).split('\n').filter(Boolean)[0]}`)
      idTheoAnh.set(b.anh, null)
    }
  }
  const id = idTheoAnh.get(b.anh)
  if (!id || chiThu) { if (chiThu) console.log(`  · ${b.slug} <- ${basename(b.anh)}`); continue }

  // featured_image là trường kiểu image: lưu đối tượng { id }, không phải đường dẫn.
  await c.query(`UPDATE ec_bai_viet SET featured_image = $1 WHERE slug = $2 AND deleted_at IS NULL`,
    [JSON.stringify({ id }), b.slug])
  console.log(`  ✓ ${b.slug.padEnd(32)} <- ${basename(b.anh)}`)
  gan++
}

if (!chiThu) {
  const n = await c.query(`SELECT count(*)::int n FROM ec_bai_viet WHERE featured_image IS NOT NULL AND deleted_at IS NULL`)
  console.log(`\nGán ảnh bìa cho ${gan} bài${thieu ? `, ${thieu} bài ảnh đã mất khỏi máy chủ` : ''}. Tổng bài có ảnh: ${n.rows[0].n}/11`)
  await c.end()
}
