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
// KHÔNG nối được thì KHÔNG làm gãy build — nhưng phải KÊU TO. Bài học kiem-sitemap:
// "bỏ qua, build vẫn tiếp tục" trong im lặng đã giấu lỗi mất 15.054 trang suốt nhiều
// tháng. Ở đây im lặng nghĩa là mọi trang lặng lẽ quay về mô tả tự sinh.

import { moKetNoiCms } from './cms-ket-noi.mjs'


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

/**
 * Trả về hàm tra ghi-đè: ghiDe(bo, slug) → {title, description, image, canonical, noIndex}
 * hoặc null nếu mục đó không có dòng SEO nào.
 * Gọi nhiều lần cũng chỉ nối kho MỘT lần cho mỗi tiến trình.
 */
export async function napGhiDe() {
  if (boNho) return boNho

  const kn = moKetNoiCms('seo-cms')
  if (!kn) {
    console.warn('  Mọi trang sẽ dùng tiêu đề/mô tả tự sinh. Đây KHÔNG phải trạng thái mong muốn.')
    boNho = () => null
    boNho.so = 0
    return boNho
  }
  const kho = kn.kho

  const bang = new Map()
  try {
    await kho.connect()
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
                s.seo_title, s.seo_description, s.seo_image, s.seo_canonical, s.seo_no_index
         FROM _emdash_seo s
         JOIN ${tbl} e ON e.id = s.content_id
         WHERE s.collection = $1 AND e.deleted_at IS NULL`,
        [bo],
      )
      for (const x of r.rows) {
        const v = {
          title: x.seo_title || null,
          description: x.seo_description || null,
          image: x.seo_image || null,
          canonical: x.seo_canonical || null,
          noIndex: x.seo_no_index === 1 || x.seo_no_index === true,
        }
        // Tra được bằng CẢ HAI slug: builder đọc tệp tĩnh nên cầm slug THÔ
        // (acupoints.js giữ "am-khich" cho cả Âm Khích lẫn Ẩm Khích), còn CMS lấy
        // bản KHỬ TRÙNG làm khoá. Không nối cả hai thì 15 huyệt tra không ra.
        bang.set(`${bo}:${x.slug}`, v)
        if (x.slug_goc && x.slug_goc !== x.slug) bang.set(`${bo}:${x.slug_goc}`, v)
      }
    }
  } catch (e) {
    console.warn(`⚠ seo-cms: KHÔNG đọc được _emdash_seo (${e.message}) — BỎ QUA ghi đè SEO.`)
    console.warn('  Mọi trang sẽ dùng tiêu đề/mô tả tự sinh. Đây KHÔNG phải trạng thái mong muốn.')
    return trong()
  } finally {
    await kn.dong()
  }

  console.log(`✓ seo-cms: ${bang.size} khoá ghi đè SEO đọc từ CMS.`)
  boNho = (bo, slug) => bang.get(`${bo}:${slug}`) || null
  boNho.so = bang.size
  return boNho
}

/**
 * Ráp phần tự sinh với phần người biên tập gõ. Ô nào trong CMS để trống thì GIỮ bản
 * tự sinh — ghi đè là bổ sung, không phải thay thế.
 */
export function apGhiDe(tuSinh, ghiDe) {
  if (!ghiDe) return tuSinh
  return {
    ...tuSinh,
    ...(ghiDe.title ? { title: ghiDe.title } : {}),
    ...(ghiDe.description ? { description: ghiDe.description } : {}),
    ...(ghiDe.image ? { ogImage: ghiDe.image } : {}),
    ...(ghiDe.canonical ? { canonical: ghiDe.canonical } : {}),
    ...(ghiDe.noIndex ? { index: false } : {}),
  }
}
