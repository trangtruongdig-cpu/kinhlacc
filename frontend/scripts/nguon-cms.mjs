// nguon-cms.mjs — Đọc CHỮ của mục nguồn y văn từ CMS.
//
// Trang /nguon/ cần hai thứ ở hai kho khác nhau, không join chéo được:
//   · CHỮ (tên, loại, tác giả, niên đại, tên khác, mô tả, ghi chú) — CMS `ec_nguon_y_van`,
//     đây là chỗ người biên tập sửa.
//   · QUAN HỆ (nguồn nào cho ra bài thuốc/vị thuốc nào) — DB app, bảng nối
//     nguon_phuong_thang / nguon_vi_thuoc. Suy ra được từ dữ liệu, không phải nội dung
//     biên tập, nên để nguyên bên app.
//
// Đối chiếu trước khi chuyển: 2.139/2.139 mục khớp app TUYỆT ĐỐI, 0 ô lệch. Nghĩa là
// bước chuyển này không đổi một trang nào ở thời điểm chuyển — mọi khác biệt về sau đều
// là do người biên tập sửa. Cùng tính chất nền móng như dong-bo-app.mjs.
//
// Không nối được kho thì trả hàm rỗng và KÊU TO — trang vẫn dựng bằng chữ của app.

import { moKetNoiCms } from './cms-ket-noi.mjs'


// Portable Text → chữ thuần, mỗi khối một dòng.
const chu = (v) => {
  if (v === null || v === undefined) return null
  let b = v
  if (typeof b === 'string') {
    try { b = JSON.parse(b) } catch { return b }
  }
  if (!Array.isArray(b)) return null
  return b.map((k) => (Array.isArray(k?.children) ? k.children.map((c) => String(c?.text ?? '')).join('') : '')).join('\n')
}

export async function napNguonCms() {
  const kn = moKetNoiCms('nguon-cms')
  if (!kn) {
    console.warn('  Trang nguồn dùng CHỮ CỦA APP, không thấy phần biên tập trong CMS.')
    return () => null
  }
  const kho = kn.kho

  const bang = new Map()
  try {
    await kho.connect()
    const r = await kho.query(
      `SELECT slug, title, loai, tac_gia, nien_dai, ten_khac, ghi_chu, mo_ta
       FROM ec_nguon_y_van WHERE deleted_at IS NULL AND status = 'published'`,
    )
    for (const x of r.rows) {
      bang.set(x.slug, {
        ten: x.title || null,
        loai: x.loai || null,
        tac_gia: x.tac_gia || null,
        nien_dai: x.nien_dai || null,
        ten_khac: x.ten_khac || null,
        ghi_chu: x.ghi_chu || null,
        mo_ta: chu(x.mo_ta) || null,
      })
    }
  } catch (e) {
    return trong(`không đọc được ec_nguon_y_van (${e.message})`)
  } finally {
    await kn.dong()
  }

  console.log(`✓ nguon-cms: ${bang.size} mục nguồn đọc CHỮ từ CMS.`)
  return (slug) => bang.get(slug) || null
}
