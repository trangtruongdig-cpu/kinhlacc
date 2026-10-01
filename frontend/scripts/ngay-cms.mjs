// ngay-cms.mjs — Ngày SỬA THẬT của từng mục, đọc từ `updated_at` trong kho CMS.
//
// VÌ SAO CÓ TỆP NÀY (đo 01/10/2026 trên site thật)
// 6.634/7.400 URL trong sitemap mang cùng một `lastmod` = NGÀY BUILD, vì bốn builder đều
// truyền `new Date().toISOString().slice(0,10)`. Google bỏ qua lastmod khi nó đổi mỗi lần
// phát hành — tức cả kho đang phát một tín hiệu RỖNG. Dòng byline "Cập nhật <ngày>" trên
// trang từ điển cũng lấy ngày build, nên `semanticDate` (ngày Google suy từ nội dung) cũng
// nói sai cùng một kiểu.
//
// ⚠️ ĐO TRƯỚC KHI TIN TỆP NÀY SẼ "LÀM MỚI" KHO. `updated_at` của CMS phần lớn là ngày NHẬP
// LIỆU HÀNG LOẠT 25/09/2026, không phải ngày soạn nội dung:
//   ec_bai_thuoc     13.898/13.942 mục cùng 2026-09-25
//   ec_nguon_y_van    2.139/2.139  cùng 2026-09-25
//   ec_huyet_vi       1.026/1.059  cùng 2026-09-25
// Cái tệp này mua được KHÔNG phải "ngày mới hơn", mà là hai thứ khác:
//   1. Ngày THÔI ĐỔI mỗi lần build → lastmod bắt đầu mang tin.
//   2. Mục nào người biên tập sửa thật thì có ngày RIÊNG, và từ nay mọi lần sửa đều hiện ra.
// Vì vậy chốt trong kiem-sitemap canh đúng bệnh cũ ("lastmod bằng ngày build"), KHÔNG canh
// "nhiều URL trùng ngày" — kho này trùng ngày là chuyện bình thường và đúng.
//
// KHÔNG tra được thì trả null, và người gọi BỎ HẲN lastmod chứ không điền ngày build: thiếu
// lastmod chỉ là thiếu một gợi ý, còn lastmod sai là nói dối bộ máy tìm kiếm.
//
// Nối kho RIÊNG rồi đóng ngay, cùng lý lẽ với seo-cms.mjs: Aiven chỉ còn ~11 slot, và các
// builder chạy TUẦN TỰ trong `npm run blog:post` nên mỗi lúc chỉ có một kết nối thừa.

import { moKetNoiCms } from './cms-ket-noi.mjs'

/** Bộ trong CMS ↔ bảng. Giống BANG của seo-cms.mjs — hai tệp cố ý không phụ thuộc nhau. */
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

/** 'yyyy-mm-dd' nếu đọc được, null nếu không. EmDash cất mốc thời gian dạng TEXT ISO. */
const ngayCua = (x) => {
  const s = String(x ?? '').trim()
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null
}

/**
 * Trả về hàm tra: ngay(bo, slug) → 'yyyy-mm-dd' | null. Gọi nhiều lần chỉ nối kho MỘT lần
 * cho mỗi tiến trình. Hàm trả về có thêm `.so` (số mục đọc được) và `.theoNgay` (phân bố)
 * để builder in ra — im lặng ở đây nghĩa là cả kho lặng lẽ mất lastmod.
 */
export async function napNgayCms() {
  if (boNho) return boNho

  const kn = moKetNoiCms('ngay-cms')
  if (!kn) {
    console.warn('  ngay-cms: sitemap sẽ KHÔNG có lastmod và byline dùng ngày build. Không phải trạng thái mong muốn.')
    return trong()
  }

  const bang = new Map()
  const theoNgay = new Map()
  try {
    await kn.kho.connect()
    for (const [bo, tbl] of Object.entries(BANG)) {
      // Bộ chưa tồn tại là chuyện bình thường lúc di cư — khác hẳn với KHÔNG NỐI ĐƯỢC kho.
      const co = await kn.kho.query('SELECT to_regclass($1) AS t', [tbl])
      if (!co.rows[0].t) continue
      const cot = await kn.kho.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'updated_at'`,
        [tbl],
      )
      if (!cot.rowCount) {
        console.warn(`  ngay-cms: ${tbl} không có cột updated_at — bỏ qua bộ này.`)
        continue
      }
      const coSlugGoc = await kn.kho.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'slug_goc'`,
        [tbl],
      )
      const cotSlugGoc = coSlugGoc.rowCount ? 'slug_goc' : 'NULL::text'
      const r = await kn.kho.query(
        `SELECT slug, ${cotSlugGoc} AS slug_goc, updated_at FROM ${tbl} WHERE deleted_at IS NULL`,
      )
      for (const x of r.rows) {
        const d = ngayCua(x.updated_at)
        if (!d) continue
        theoNgay.set(d, (theoNgay.get(d) ?? 0) + 1)
        // Tra được bằng CẢ HAI slug, cùng lý do như seo-cms.mjs: builder đọc tệp tĩnh nên
        // cầm slug THÔ, còn CMS lấy bản KHỬ TRÙNG làm khoá.
        bang.set(`${bo}:${x.slug}`, d)
        if (x.slug_goc && x.slug_goc !== x.slug) bang.set(`${bo}:${x.slug_goc}`, d)
      }
    }
  } catch (e) {
    console.warn(`⚠ ngay-cms: KHÔNG đọc được updated_at (${e.message}) — BỎ QUA lastmod.`)
    return trong()
  } finally {
    await kn.dong()
  }

  const dau = [...theoNgay.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
  console.log(
    `✓ ngay-cms: ${bang.size} khoá slug → ngày sửa (${theoNgay.size} ngày khác nhau; ` +
      `${dau.map(([d, n]) => `${d}:${n}`).join('  ')}).`,
  )
  boNho = (bo, slug) => bang.get(`${bo}:${String(slug)}`) ?? null
  boNho.so = bang.size
  boNho.theoNgay = theoNgay
  return boNho
}

function trong() {
  boNho = () => null
  boNho.so = 0
  boNho.theoNgay = new Map()
  return boNho
}

/**
 * Hàm lastmod cho `chenUrl`: lấy slug từ cuối đường dẫn rồi tra. Trả undefined khi không
 * tra được → `chenUrl` bỏ hẳn thẻ <lastmod> của URL đó.
 */
export function lastmodTheoSlug(ngay, bo) {
  return (loc) => {
    let d = loc
    try { d = new URL(loc).pathname } catch { /* loc đã là đường dẫn */ }
    const slug = d.replace(/\/+$/, '').split('/').pop()
    return ngay(bo, slug) ?? undefined
  }
}
