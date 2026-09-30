// dong-bo-seo-cms.mjs — Điền ô SEO của CMS bằng bản tự sinh, như Yoast trên WordPress:
// ô luôn ĐẦY chữ để người biên tập thấy và sửa, nhưng KHÔNG đóng băng.
//
// CƠ CHẾ
// Các builder ghi bản tự sinh của từng trang ra .seo-tu-sinh/<bộ>.json (seoTrang trong
// seo-cms.mjs). Tệp này đọc chúng rồi, với MỖI Ô:
//   · ô trống, hoặc ô còn đúng chữ máy điền lần trước  → điền bản tự sinh MỚI
//   · ô người biên tập đã sửa (khác chữ máy điền)       → GIỮ NGUYÊN, không bao giờ đụng
// "Chữ máy điền lần trước" cất ở sổ `kl_seo_tu_sinh` (cùng khoá với `_emdash_seo`). Không
// có sổ thì không phân biệt được hai trường hợp trên — và hoặc là đè mất chữ người sửa,
// hoặc là đóng băng cả kho. seo-cms.mjs đọc CÙNG sổ này khi build để biết ô nào của người.
//
// AN TOÀN
//   · Chạy thử là mặc định; `--ghi` hoặc SEO_GHI_CMS=1 mới ghi (Dockerfile đặt biến này —
//     chỉ bản build deploy mới ghi, bản build thử ở máy lập trình không đè chữ lên kho thật).
//   · Bộ nào có quá nửa mục không khớp được slug → BỎ bộ đó (dấu hiệu lỗi ánh xạ, ghi vào là
//     rác), và thoát mã 1.
//   · Ghi theo lô trong MỘT giao dịch (RTT tới Aiven 88ms — ghi lẻ 18.000 dòng mất 30 phút).
//   · Mốc thời gian dạng ISO của EmDash, KHÔNG dùng now() (xem cms/scripts-di-cu/moc-iso.mjs).
//
//   node scripts/dong-bo-seo-cms.mjs          # chạy thử: in số ô sẽ điền / giữ
//   node scripts/dong-bo-seo-cms.mjs --ghi    # ghi thật
//   node scripts/dong-bo-seo-cms.mjs --don    # xoá bản tự sinh cũ (đầu blog:post)

import { readdirSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { moKetNoiCms } from './cms-ket-noi.mjs'
import { BANG_TU_SINH, THU_MUC_TU_SINH } from './seo-cms.mjs'

const GHI = process.argv.includes('--ghi') || process.env.SEO_GHI_CMS === '1'
const MOC = `to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`
const LO = 500

const BANG = {
  huyet_vi: 'ec_huyet_vi',
  kinh_mach: 'ec_kinh_mach',
  benh_hoc: 'ec_benh_hoc',
  cham_cuu_tri_benh: 'ec_cham_cuu_tri_benh',
  duoc_lieu: 'ec_duoc_lieu',
  bai_thuoc: 'ec_bai_thuoc',
  nguon_y_van: 'ec_nguon_y_van',
}
const O = [
  ['title', 'seo_title'],
  ['description', 'seo_description'],
  ['image', 'seo_image'],
  ['canonical', 'seo_canonical'],
]

const rong = (x) => x === null || x === undefined || String(x).trim() === ''
const bang = (a, b) => String(a ?? '').trim() === String(b ?? '').trim()

/** Quyết định giá trị cuối của một dòng. s = dòng _emdash_seo, t = dòng sổ, may = bản tự sinh. */
export function quyetDinh(s, t, may) {
  const ra = {}
  let tay = 0
  for (const [k, cot] of O) {
    const cu = s?.[cot]
    const cuaNguoi = !rong(cu) && (!t || !bang(cu, t[cot]))
    ra[cot] = cuaNguoi ? cu : (may[k] ?? null)
    if (cuaNguoi) tay++
  }
  const cuN = s ? Number(s.seo_no_index) : 0
  const mayN = may.noIndex ? 1 : 0
  const nguoiN = t ? cuN !== Number(t.seo_no_index) : s ? cuN === 1 : false
  ra.seo_no_index = nguoiN ? cuN : mayN
  if (nguoiN) tay++
  return { ra, tay }
}

async function main() {
  // --don: chạy ĐẦU blog:post. Xoá bản tự sinh của lượt trước, để builder nào lượt này bị
  // bỏ qua (mất DB…) không để lại tệp CŨ mà bước đồng bộ cuối lượt đem ghi vào CMS.
  if (process.argv.includes('--don')) {
    rmSync(THU_MUC_TU_SINH, { recursive: true, force: true })
    return
  }
  if (!existsSync(THU_MUC_TU_SINH)) {
    console.warn(`⚠ dong-bo-seo-cms: không có ${THU_MUC_TU_SINH} — các builder chưa chạy. Bỏ qua.`)
    return
  }
  const tep = readdirSync(THU_MUC_TU_SINH).filter((f) => f.endsWith('.json'))
  const kn = moKetNoiCms('dong-bo-seo-cms')
  if (!kn) {
    console.warn('⚠ dong-bo-seo-cms: không nối được kho CMS — ô SEO KHÔNG được cập nhật lượt này.')
    return
  }
  const kho = kn.kho
  let hong = 0
  try {
    await kho.connect()
    if (GHI) {
      await kho.query(`CREATE TABLE IF NOT EXISTS ${BANG_TU_SINH} (
        collection text NOT NULL, content_id text NOT NULL,
        seo_title text, seo_description text, seo_image text, seo_canonical text,
        seo_no_index integer NOT NULL DEFAULT 0,
        updated_at text NOT NULL DEFAULT ${MOC},
        PRIMARY KEY (collection, content_id))`)
    }
    const coSo = (await kho.query(`SELECT to_regclass($1) AS t`, [BANG_TU_SINH])).rows[0].t

    const viec = [] // { bo, id, ra, may }
    for (const f of tep) {
      const bo = f.replace(/\.json$/, '')
      const tbl = BANG[bo]
      if (!tbl) continue
      const ds = JSON.parse(readFileSync(join(THU_MUC_TU_SINH, f), 'utf8'))

      const coSlugGoc = (await kho.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'slug_goc'`, [tbl],
      )).rowCount
      const muc = (await kho.query(
        `SELECT id, slug, ${coSlugGoc ? 'slug_goc' : 'NULL::text AS slug_goc'} FROM ${tbl} WHERE deleted_at IS NULL`,
      )).rows
      // slug khớp trước, slug_goc sau (builder đọc tệp tĩnh nên cầm slug THÔ — xem seo-cms.mjs).
      const theoSlug = new Map(muc.map((m) => [m.slug, m.id]))
      for (const m of muc) if (m.slug_goc && !theoSlug.has(m.slug_goc)) theoSlug.set(m.slug_goc, m.id)

      const s = new Map((await kho.query(`SELECT * FROM _emdash_seo WHERE collection = $1`, [bo])).rows.map((r) => [r.content_id, r]))
      const t = coSo
        ? new Map((await kho.query(`SELECT * FROM ${BANG_TU_SINH} WHERE collection = $1`, [bo])).rows.map((r) => [r.content_id, r]))
        : new Map()

      let khongKhop = 0, dien = 0, giu = 0, trung = 0, oTay = 0
      const daGap = new Set()
      const viecBo = []
      for (const may of ds) {
        const id = theoSlug.get(may.slug)
        if (!id) { khongKhop++; continue }
        if (daGap.has(id)) { trung++; continue }
        daGap.add(id)
        const { ra, tay } = quyetDinh(s.get(id), t.get(id), may)
        oTay += tay
        const cu = s.get(id)
        const doi = !cu || O.some(([, c]) => !bang(cu[c], ra[c]) || (rong(cu[c]) !== rong(ra[c]))) || Number(cu.seo_no_index) !== ra.seo_no_index
        if (doi) dien++
        else giu++
        viecBo.push({ bo, id, ra, may, doi })
      }
      const tiLeSai = khongKhop / Math.max(1, ds.length)
      console.log(
        `  ${bo.padEnd(18)} ${String(ds.length).padStart(6)} bản tự sinh · ${String(dien).padStart(6)} dòng cần ghi · ` +
          `${giu} không đổi · ${oTay} ô người sửa tay (giữ) · ${khongKhop} không khớp slug${trung ? ` · ${trung} trùng id` : ''}`,
      )
      if (tiLeSai > 0.5) {
        console.error(`✗ dong-bo-seo-cms: ${bo} không khớp ${(tiLeSai * 100).toFixed(0)}% slug — BỎ bộ này (lỗi ánh xạ?).`)
        hong++
        continue
      }
      viec.push(...viecBo)
    }

    const canGhi = viec.filter((v) => v.doi)
    if (!GHI) {
      console.log(`\n(chạy thử) ${canGhi.length} dòng _emdash_seo sẽ được ghi. Thêm --ghi hoặc SEO_GHI_CMS=1 để ghi thật.`)
      return
    }

    await kho.query('BEGIN')
    try {
      for (let i = 0; i < canGhi.length; i += LO) {
        const lo = canGhi.slice(i, i + LO)
        const cot = (f) => lo.map(f)
        await kho.query(
          `INSERT INTO _emdash_seo (collection, content_id, seo_title, seo_description, seo_image, seo_canonical, seo_no_index, created_at, updated_at)
           SELECT c, i, ti, de, im, ca, ni, ${MOC}, ${MOC}
           FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::int[]) AS x(c, i, ti, de, im, ca, ni)
           ON CONFLICT (collection, content_id) DO UPDATE SET
             seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description,
             seo_image = EXCLUDED.seo_image, seo_canonical = EXCLUDED.seo_canonical,
             seo_no_index = EXCLUDED.seo_no_index, updated_at = ${MOC}`,
          [cot((v) => v.bo), cot((v) => v.id), cot((v) => v.ra.seo_title), cot((v) => v.ra.seo_description),
           cot((v) => v.ra.seo_image), cot((v) => v.ra.seo_canonical), cot((v) => v.ra.seo_no_index)],
        )
      }
      // Sổ ghi bản MÁY (không phải giá trị cuối): lần sau so ô với sổ để biết người đã sửa chưa.
      for (let i = 0; i < viec.length; i += LO) {
        const lo = viec.slice(i, i + LO)
        const cot = (f) => lo.map(f)
        await kho.query(
          `INSERT INTO ${BANG_TU_SINH} (collection, content_id, seo_title, seo_description, seo_image, seo_canonical, seo_no_index, updated_at)
           SELECT c, i, ti, de, im, ca, ni, ${MOC}
           FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::int[]) AS x(c, i, ti, de, im, ca, ni)
           ON CONFLICT (collection, content_id) DO UPDATE SET
             seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description,
             seo_image = EXCLUDED.seo_image, seo_canonical = EXCLUDED.seo_canonical,
             seo_no_index = EXCLUDED.seo_no_index, updated_at = ${MOC}`,
          [cot((v) => v.bo), cot((v) => v.id), cot((v) => v.may.title ?? null), cot((v) => v.may.description ?? null),
           cot((v) => v.may.image ?? null), cot((v) => v.may.canonical ?? null), cot((v) => (v.may.noIndex ? 1 : 0))],
        )
      }
      await kho.query('COMMIT')
    } catch (e) {
      await kho.query('ROLLBACK').catch(() => {})
      throw e
    }
    console.log(`\n✓ dong-bo-seo-cms: đã ghi ${canGhi.length} dòng _emdash_seo, sổ ${viec.length} dòng.`)
  } finally {
    await kn.dong()
  }
  // Trong build deploy (SEO_GHI_CMS=1) thì KHÔNG làm gãy build: trang đã dựng xong và đúng,
  // chỉ ô CMS chưa cập nhật — chặn deploy vì thế là được ít mất nhiều. Đã kêu ở trên.
  if (hong && process.env.SEO_GHI_CMS !== '1') process.exitCode = 1
}

// Chạy khi gọi trực tiếp; import (phép kiểm) thì không.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(`✗ dong-bo-seo-cms: ${e.message} — ô SEO trong CMS KHÔNG được cập nhật lượt này.`)
    if (process.env.SEO_GHI_CMS !== '1') process.exitCode = 1
  })
}
