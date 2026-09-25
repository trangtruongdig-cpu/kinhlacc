// di-cu-benh.mjs — Đưa Bệnh Học + Châm Cứu Trị Bệnh từ benh.js vào CMS.
//
// Nguồn: frontend/public/kinhmach3d/data/benh.js (số hoá từ đĩa CD từ điển).
// Dữ liệu là VĂN BẢN THUẦN ngăn bằng \n, không HTML. CLI của EmDash chuyển markdown sang
// Portable Text, mà markdown gộp các dòng liền nhau thành MỘT đoạn — nên phải đổi \n thành
// dòng trống, nếu không cả mục 2.000 ký tự dồn thành một khối chữ không ngắt.
//
//   node scripts-di-cu/di-cu-benh.mjs --thu          # in ra, không ghi
//   node scripts-di-cu/di-cu-benh.mjs --nhom benhhoc # chỉ một nhóm
//   node scripts-di-cu/di-cu-benh.mjs
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const cmsDir = resolve(here, '..')
const BIN = resolve(cmsDir, 'node_modules/.bin/emdash')
const args = process.argv.slice(2)
const chiThu = args.includes('--thu')
const chiNhom = args.includes('--nhom') ? args[args.indexOf('--nhom') + 1] : null

const D = await import(resolve(cmsDir, '../frontend/scripts/dict-data.mjs'))

// Mỗi dòng nguồn thành một đoạn riêng. Bỏ dòng trắng thừa, giữ thứ tự.
const doan = (v) => {
  const s = String(v ?? '').trim()
  if (!s) return undefined
  return s.split(/\r?\n/).map((d) => d.trim()).filter(Boolean).join('\n\n')
}

const NHOM = [
  {
    key: 'benhhoc', col: 'benh_hoc', nhan: 'Bệnh Học',
    map: (r) => ({
      title: r.ten,
      doi_chieu_benh_danh: r._meta || undefined,
      dai_cuong: doan(r.daiCuong), nguyen_nhan: doan(r.nguyenNhan),
      chan_doan: doan(r.chanDoan), dieu_tri: doan(r.dieuTri),
      benh_an: doan(r.benhAn), tham_khao: doan(r.thamKhao),
      cho_index: true,
    }),
  },
  {
    key: 'ccdt', col: 'cham_cuu_tri_benh', nhan: 'Châm Cứu Trị Bệnh',
    map: (r) => ({
      title: r.ten,
      dai_cuong: doan(r.daiCuong), nguyen_nhan: doan(r.nguyenNhan),
      trieu_chung: doan(r.trieuChung), dieu_tri: doan(r.dieuTri),
      cho_index: true,
    }),
  },
]

for (const n of NHOM) {
  if (chiNhom && chiNhom !== n.key) continue
  const recs = D.BENH?.[n.key]?.records || []
  console.log(`\n── ${n.nhan} — ${recs.length} mục ──`)
  let ok = 0, loi = 0
  for (const r of recs) {
    const slug = r._slug || r.slug
    const du = n.map(r)
    for (const k of Object.keys(du)) if (du[k] === undefined) delete du[k]

    if (chiThu) {
      const co = Object.keys(du).filter((k) => k !== 'title' && k !== 'cho_index')
      console.log(`  ${slug.padEnd(26)} ${String(JSON.stringify(du).length).padStart(6)} ký tự · ${co.join(', ')}`)
      ok++; continue
    }
    try {
      execFileSync(BIN, ['content', 'create', n.col, '--slug', slug, '--data', JSON.stringify(du)],
        { cwd: cmsDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
      ok++
      if (ok % 20 === 0) console.log(`  …${ok}/${recs.length}`)
    } catch (e) {
      console.error(`  ✗ ${slug}: ${String(e.stderr || e.message).split('\n').filter(Boolean)[0]}`)
      loi++
    }
  }
  console.log(`  ${chiThu ? 'Thử' : 'Xong'}: ${ok}/${recs.length}${loi ? `, ${loi} lỗi` : ''}`)
}
