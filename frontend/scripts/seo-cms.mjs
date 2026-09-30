// seo-cms.mjs — Đọc phần SEO do người biên tập gõ trong CMS, để builder ghi đè lên
// phần tự sinh.
//
// VÌ SAO CÓ TỆP NÀY
// Các trang từ điển là HTML TĨNH do build-dict/build-phuong/build-duoc-lieu sinh; thẻ
// <head> ráp ở seo-html.mjs. Tiêu đề và mô tả hiện đều TỰ SINH bằng cách cắt đoạn đầu
// bài — đo trên dist/: 8.696/16.364 trang có mô tả dài quá 165 ký tự nên bị Google cắt
// cụt. Người biên tập không có cách nào sửa.
//
// EmDash đã có sẵn chỗ chứa: bảng `_emdash_seo` (khoá đôi collection + content_id). Thiếu
// đúng một khâu: builder chưa đọc bảng đó. Tệp này là khâu ấy.
//
// ⚠️ Ô nhập SEO chỉ mở đủ 9 bộ từ 26/09/2026. Trước đó `has_seo = 0` ở 5 bộ (bai_thuoc,
// nguon_y_van, duoc_lieu, cham_cuu_tri_benh, kinh_mach) nên 17.246 trang không có chỗ
// nhập, `_emdash_seo` rỗng, và tệp này chạy mà không có gì để ghi đè — không báo lỗi.
// Phép kiểm: `node cms/scripts-di-cu/khai-seo.mjs --thu` phải in ra 0 bộ.
//
// HAI KHO TÁCH BIỆT — không join chéo được
// Builder nối `defaultdb` (kho của app, qua backend/.env), còn `_emdash_seo` nằm ở
// `kinhlac_cms` (qua cms/.env). Nên phải mở kết nối RIÊNG, và phải đóng ngay: Aiven chỉ
// cho 20 slot, Aiven giữ ~10, 3 dành cho superuser. Các builder chạy TUẦN TỰ trong
// `npm run blog:post` nên tại một thời điểm chỉ có một kết nối thừa.
//
// TỪ 29/09/2026 Ô CMS LUÔN ĐẦY CHỮ (như Yoast trên WordPress): dong-bo-seo-cms.mjs điền bản
// tự sinh vào ô và ghi lại vào sổ `kl_seo_tu_sinh`. Nên "ô có chữ" KHÔNG còn nghĩa là "người
// đã sửa" — tệp này so ô với sổ: còn đúng chữ máy điền thì bỏ qua (dùng bản tự sinh MỚI),
// khác thì đó là chữ người biên tập và được áp. Bỏ phép so này là ĐÓNG BĂNG cả kho.
//
// KHÔNG nối được thì KHÔNG làm gãy build — nhưng phải KÊU TO. Bài học kiem-sitemap:
// "bỏ qua, build vẫn tiếp tục" trong im lặng đã giấu lỗi mất 15.054 trang suốt nhiều
// tháng. Ở đây im lặng nghĩa là mọi trang lặng lẽ quay về mô tả tự sinh.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { moKetNoiCms } from './cms-ket-noi.mjs'
import { toAbs } from './seo-html.mjs'


// Bộ trong CMS ↔ bảng chứa nó. slug_goc chỉ có ở những bộ đã nhập lại cho khớp tệp
// gốc (huyệt vị, hai bộ bệnh) — bộ nào chưa có cột đó thì bỏ qua, không gãy.
const BANG = {
  huyet_vi: 'ec_huyet_vi',
  kinh_mach: 'ec_kinh_mach',
  benh_hoc: 'ec_benh_hoc',
  cham_cuu_tri_benh: 'ec_cham_cuu_tri_benh',
  duoc_lieu: 'ec_duoc_lieu',
  bai_thuoc: 'ec_bai_thuoc',
  nguon_y_van: 'ec_nguon_y_van',
}

let boNho = null

// Sổ ghi những gì MÁY đã điền vào ô SEO (xem dong-bo-seo-cms.mjs). Ô nào còn đúng chữ máy
// điền lần trước thì KHÔNG phải ghi đè của người — builder bỏ qua nó và dùng bản tự sinh MỚI.
// Nhờ vậy ô trong CMS luôn đầy chữ mà không đóng băng: sửa thuật toán sinh là cả kho đổi
// theo, chỉ trừ những ô người biên tập đã sửa tay.
export const BANG_TU_SINH = 'kl_seo_tu_sinh'

const rong = (x) => x === null || x === undefined || String(x).trim() === ''
// Ô là của NGƯỜI khi: có chữ, và (chưa từng có bản máy điền, hoặc khác bản máy điền).
const cuaNguoi = (o, may, coSo) => (!rong(o) && (!coSo || String(o).trim() !== String(may ?? '').trim()) ? o : null)

/**
 * Trả về hàm tra ghi-đè: ghiDe(bo, slug) → {title, description, image, canonical, noIndex}
 * — CHỈ những ô người biên tập đã sửa tay (ô còn lại là null); noIndex là true/false khi
 * người đã bật/tắt, null khi để nguyên. Trả null nếu mục đó không có ô nào của người.
 * Gọi nhiều lần cũng chỉ nối kho MỘT lần cho mỗi tiến trình.
 */
export async function napGhiDe() {
  if (boNho) return boNho

  const kn = moKetNoiCms('seo-cms')
  if (!kn) {
    console.warn('  Mọi trang sẽ dùng tiêu đề/mô tả tự sinh. Đây KHÔNG phải trạng thái mong muốn.')
    return trong()
  }
  const kho = kn.kho

  const bang = new Map()
  let soNguoi = 0
  try {
    await kho.connect()
    const coSo = (await kho.query(`SELECT to_regclass($1) AS t`, [BANG_TU_SINH])).rows[0].t
    const cotSo = coSo
      ? `t.content_id IS NOT NULL AS co_so, t.seo_title AS m_title, t.seo_description AS m_desc,
         t.seo_image AS m_image, t.seo_canonical AS m_canon, t.seo_no_index AS m_noidx`
      : `false AS co_so, NULL AS m_title, NULL AS m_desc, NULL AS m_image, NULL AS m_canon, NULL::int AS m_noidx`
    const noiSo = coSo
      ? `LEFT JOIN ${BANG_TU_SINH} t ON t.collection = s.collection AND t.content_id = s.content_id`
      : ''
    for (const [bo, tbl] of Object.entries(BANG)) {
      // Bộ nào chưa tồn tại thì bỏ qua lặng lẽ — đây là điều bình thường trong lúc
      // di cư, khác hẳn với việc KHÔNG NỐI ĐƯỢC KHO (phải kêu).
      const co = await kho.query(`SELECT to_regclass($1) AS t`, [tbl])
      if (!co.rows[0].t) continue
      const coSlugGoc = await kho.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'slug_goc'`,
        [tbl],
      )
      const cotSlugGoc = coSlugGoc.rowCount ? 'e.slug_goc' : 'NULL::text'
      const r = await kho.query(
        `SELECT e.slug, ${cotSlugGoc} AS slug_goc,
                s.seo_title, s.seo_description, s.seo_image, s.seo_canonical, s.seo_no_index, ${cotSo}
         FROM _emdash_seo s
         JOIN ${tbl} e ON e.id = s.content_id
         ${noiSo}
         WHERE s.collection = $1 AND e.deleted_at IS NULL`,
        [bo],
      )
      for (const x of r.rows) {
        const noIdx = Number(x.seo_no_index) === 1
        const v = {
          title: cuaNguoi(x.seo_title, x.m_title, x.co_so),
          description: cuaNguoi(x.seo_description, x.m_desc, x.co_so),
          image: cuaNguoi(x.seo_image, x.m_image, x.co_so),
          canonical: cuaNguoi(x.seo_canonical, x.m_canon, x.co_so),
          // Công tắc không có trạng thái "trống": là của người khi khác bản máy điền,
          // hoặc — chưa có sổ — khi đã bật (mặc định của EmDash là 0).
          noIndex: x.co_so ? (noIdx !== (Number(x.m_noidx) === 1) ? noIdx : null) : noIdx ? true : null,
        }
        if (!v.title && !v.description && !v.image && !v.canonical && v.noIndex === null) continue
        soNguoi++
        // Tra được bằng CẢ HAI slug: builder đọc tệp tĩnh nên cầm slug THÔ
        // (acupoints.js giữ "am-khich" cho cả Âm Khích lẫn Ẩm Khích), còn CMS lấy
        // bản KHỬ TRÙNG làm khoá. Không nối cả hai thì 15 huyệt tra không ra.
        bang.set(`${bo}:${x.slug}`, v)
        if (x.slug_goc && x.slug_goc !== x.slug) bang.set(`${bo}:${x.slug_goc}`, v)
      }
    }
    if (!coSo) console.warn(`  seo-cms: chưa có sổ ${BANG_TU_SINH} — coi mọi ô có chữ là của người.`)
  } catch (e) {
    console.warn(`⚠ seo-cms: KHÔNG đọc được _emdash_seo (${e.message}) — BỎ QUA ghi đè SEO.`)
    console.warn('  Mọi trang sẽ dùng tiêu đề/mô tả tự sinh. Đây KHÔNG phải trạng thái mong muốn.')
    return trong()
  } finally {
    await kn.dong()
  }

  console.log(`✓ seo-cms: ${soNguoi} mục có ô SEO người biên tập sửa tay.`)
  boNho = (bo, slug) => bang.get(`${bo}:${slug}`) || null
  boNho.so = soNguoi
  return boNho
}

function trong() {
  boNho = () => null
  boNho.so = 0
  return boNho
}

/**
 * Ráp phần tự sinh với phần người biên tập gõ. Ô nào trong CMS để trống (hoặc còn đúng
 * chữ máy điền) thì GIỮ bản tự sinh — ghi đè là bổ sung, không phải thay thế.
 */
export function apGhiDe(tuSinh, ghiDe) {
  if (!ghiDe) return tuSinh
  return {
    ...tuSinh,
    ...(ghiDe.title ? { title: ghiDe.title } : {}),
    ...(ghiDe.description ? { description: ghiDe.description } : {}),
    // Ảnh chọn bằng bộ chọn của EmDash là đường TƯƠNG ĐỐI (/_emdash/api/media/file/…);
    // og:image phải tuyệt đối thì mạng xã hội mới tải được.
    ...(ghiDe.image ? { ogImage: toAbs(ghiDe.image) } : {}),
    ...(ghiDe.canonical ? { canonical: ghiDe.canonical } : {}),
    ...(ghiDe.noIndex === true ? { index: false } : ghiDe.noIndex === false ? { index: true } : {}),
  }
}

// ── Ghi nhận bản tự sinh để dong-bo-seo-cms.mjs điền vào ô CMS ─────────────────
// Mỗi builder là một tiến trình riêng, nên mỗi bộ ghi một tệp; bước đồng bộ đọc gộp.
const TU_SINH = new Map()
export const THU_MUC_TU_SINH = resolve(dirname(fileURLToPath(import.meta.url)), '../.seo-tu-sinh')

/**
 * CỬA DUY NHẤT để ráp SEO của một trang thuộc bộ CMS: ghi nhận bản tự sinh rồi áp phần
 * người biên tập sửa tay. `tuSinh` = { title, description, canonical, ogImage, index }.
 */
export function seoTrang(ghiDe, bo, slug, tuSinh) {
  if (!TU_SINH.has(bo)) TU_SINH.set(bo, new Map())
  TU_SINH.get(bo).set(String(slug), {
    title: tuSinh.title,
    description: tuSinh.description,
    image: tuSinh.ogImage || null,
    canonical: tuSinh.canonical,
    noIndex: tuSinh.index === false,
  })
  return apGhiDe(tuSinh, ghiDe(bo, String(slug)))
}

/** Gọi cuối mỗi builder: ghi các bản tự sinh ra .seo-tu-sinh/<bo>.json. */
export function luuTuSinh() {
  mkdirSync(THU_MUC_TU_SINH, { recursive: true })
  for (const [bo, m] of TU_SINH) {
    writeFileSync(
      join(THU_MUC_TU_SINH, `${bo}.json`),
      JSON.stringify([...m].map(([slug, v]) => ({ slug, ...v }))),
    )
    console.log(`  seo-cms: ghi ${m.size} bản tự sinh của ${bo}.`)
  }
}
