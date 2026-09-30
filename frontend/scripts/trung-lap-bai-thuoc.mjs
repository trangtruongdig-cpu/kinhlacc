// trung-lap-bai-thuoc.mjs — Tìm bài thuốc TRÙNG để đặt canonical về một bản chính.
//
// VÌ SAO: đo 29/09/2026 — 755 nhóm / 1.733 bài có TẬP VỊ y hệt nhau, và 49 cặp trang bài
// thuốc gần trùng chữ (Jaccard ≥ 0,8), có cặp trùng tuyệt đối (an-hoi-hoan ↔ an-hoi-hoan-2).
// Nhiều trang cùng một nội dung thì Google tự chọn một bản, thường không phải bản ta muốn,
// và các bản còn lại chia nhau tín hiệu. Canonical nói thẳng cho Google biết bản nào là chính.
//
// LUẬT (bảo thủ có chủ ý — canonical sai là GIẤU một phương thật khỏi Google):
//   · Điều kiện CẦN: cùng tập vị (tên vị chuẩn hoá, ≥ 2 vị).
//   · Và một trong hai: cùng TÊN GỐC (bỏ số La Mã / số thứ tự cuối tên), hoặc phần tác dụng
//     gần trùng chữ (Jaccard cụm 3 từ ≥ NGUONG_TAC_DUNG).
//   · Cùng tên mà KHÁC vị thì KHÔNG trùng: đó là các phương khác nhau mang chung một tên
//     (An Thần Hoàn I…XIV) — gom lại là sai về y học, không chỉ về SEO.
//   · Bản chính = bản nhiều chữ nhất (người đọc được nhiều nhất), hoà thì id nhỏ nhất.
//
// Kiểm: node --test scripts/trung-lap-bai-thuoc.test.mjs

export const NGUONG_TAC_DUNG = 0.7

const chuan = (s) => String(s ?? '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim()

/** Tên gốc: "Chỉ Xác Tán II" → "chỉ xác tán"; "An Hồi Hoàn 2" → "an hồi hoàn". */
export function tenGoc(ten) {
  return chuan(ten)
    .replace(/[\s-]+(?:[ivxlc]+|\d+)$/i, '')
    .replace(/[\s-]+(?:[ivxlc]+|\d+)$/i, '') // "… II 2" (số La Mã + đuôi khử trùng)
    .trim()
}

export function khoaVi(thanhPhan) {
  const vi = [...new Set((Array.isArray(thanhPhan) ? thanhPhan : []).map((t) => chuan(t?.ten)).filter(Boolean))]
  return vi.length >= 2 ? vi.sort().join('|') : null
}

const cum3 = (s) => {
  const w = chuan(s).replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean)
  const out = new Set()
  for (let i = 0; i + 3 <= w.length; i++) out.add(w.slice(i, i + 3).join(' '))
  return out
}
export function jaccard(a, b) {
  const A = cum3(a), B = cum3(b)
  if (!A.size || !B.size) return 0
  let giao = 0
  for (const x of A) if (B.has(x)) giao++
  return giao / (A.size + B.size - giao)
}

/**
 * @param bai  [{ id, ten, slug, thanh_phan, tac_dung, ... }]
 * @param doDay (b) → số chữ người đọc thấy (chọn bản chính)
 * @returns Map slug-bản-phụ → slug-bản-chính, và Map slug-bản-chính → [slug bản phụ]
 */
export function timTrung(bai, doDay) {
  const nhom = new Map()
  for (const b of bai) {
    const k = khoaVi(b.thanh_phan)
    if (!k) continue
    if (!nhom.has(k)) nhom.set(k, [])
    nhom.get(k).push(b)
  }
  const veChinh = new Map()
  const banPhu = new Map()
  for (const ds of nhom.values()) {
    if (ds.length < 2) continue
    const xep = [...ds].sort((a, b) => doDay(b) - doDay(a) || a.id - b.id)
    // Gom theo thứ tự: mỗi bài bám vào bản chính ĐẦU TIÊN mà nó trùng; không trùng ai thì
    // tự làm bản chính của cụm mới (một nhóm vị có thể chứa hai phương khác nhau).
    const chinh = []
    for (const b of xep) {
      const c = chinh.find((c) =>
        tenGoc(c.ten) === tenGoc(b.ten) || jaccard(c.tac_dung, b.tac_dung) >= NGUONG_TAC_DUNG)
      if (!c) { chinh.push(b); continue }
      veChinh.set(b.slug, c.slug)
      if (!banPhu.has(c.slug)) banPhu.set(c.slug, [])
      banPhu.get(c.slug).push(b)
    }
  }
  return { veChinh, banPhu }
}
