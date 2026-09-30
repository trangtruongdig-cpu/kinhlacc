// phan-tich-bai-thuoc.mjs — Phần "làm dày" trang bài thuốc bằng DỮ LIỆU SẴN CÓ.
//
// VÌ SAO: đo 29/09/2026, 2.107 trang bài thuốc được index mà >70% chữ là khuôn (tên vị +
// nhãn lặp lại). Chữ độc nhất thật của một bài thuốc là TỔ HỢP vị của nó — nên ở đây ta
// chiếu tổ hợp ấy lên dữ liệu vị thuốc đã có (tính, vị, quy kinh) và lên các bài khác.
//
// NGUYÊN TẮC: chỉ ĐẾM và LIỆT KÊ. Không suy ra kết luận kiểu "bài này thiên hàn, trị …" —
// đó là biện luận của thầy thuốc, và một câu máy viết sai trên trang y tế tệ hơn không viết.
// Không gọi mô hình ngôn ngữ, không sinh văn.
//
// Một nguồn duy nhất: build-phuong.mjs gọi tệp này, ghi kết quả vào khối tĩnh VÀ vào
// dist/bai-thuoc/<slug>/phan-tich.json để PhuongThuocDetailView.vue đọc — Google index
// trang SAU khi Vue dựng, nên phần này phải có mặt ở cả hai.
//
// Kiểm: node --test scripts/phan-tich-bai-thuoc.test.mjs

const sach = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
// "Hơi Hàn" / "Hơi hàn" → cùng một nhãn; giữ nguyên chữ, chỉ chuẩn hoa thường.
const nhan = (s) => { const t = sach(s).toLowerCase(); return t ? t.charAt(0).toUpperCase() + t.slice(1) : '' }

const dem = (ds) => {
  const m = new Map()
  for (const x of ds) if (x) m.set(x, (m.get(x) || 0) + 1)
  return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'))
}

/**
 * @param thanhPhan [{ id?, ten, lieu? }]
 * @param viTheoId  Map id → { ten, tinh, vi, kinh: [tên kinh] }
 * @returns null nếu không vị nào có dữ liệu; ngược lại
 *   { soVi, soCoDuLieu, khi: [[nhãn, số vị]], vi: [...], kinh: [...], bang: [{ ten, id, lieu, tinh, vi, kinh }] }
 */
export function tongHopTinhVi(thanhPhan, viTheoId) {
  const tp = (Array.isArray(thanhPhan) ? thanhPhan : []).filter((t) => sach(t?.ten))
  const bang = tp.map((t) => {
    const v = t.id != null ? viTheoId.get(Number(t.id)) : null
    return {
      ten: sach(t.ten), id: t.id ?? null, lieu: sach(t.lieu),
      tinh: v ? nhan(v.tinh) : '', vi: v ? sach(v.vi) : '', kinh: v?.kinh || [],
    }
  })
  const coDuLieu = bang.filter((r) => r.tinh || r.vi || r.kinh.length)
  if (!coDuLieu.length) return null
  return {
    soVi: bang.length,
    soCoDuLieu: coDuLieu.length,
    khi: dem(coDuLieu.map((r) => r.tinh)),
    vi: dem(coDuLieu.flatMap((r) => r.vi.split(/[,;/]/).map(nhan))),
    kinh: dem(coDuLieu.flatMap((r) => r.kinh.map(sach))),
    bang,
  }
}

const khoa = (tp) => new Set((Array.isArray(tp) ? tp : []).map((t) => sach(t?.ten).toLowerCase()).filter(Boolean))

/**
 * Bài có thành phần gần nhau (Jaccard trên tập vị). Chỉ xét `ungVien` (bài được index) làm
 * đích, để không dẫn người đọc/bot vào trang noindex hoặc bản trùng.
 * @returns Map slug → [{ slug, ten, chung, j }] (tối đa `toiDa`, j ≥ `nguong`)
 */
export function timLienQuan(bai, ungVien, { toiDa = 6, nguong = 0.5, boQua = () => false } = {}) {
  const tap = new Map(bai.map((b) => [b.slug, khoa(b.thanh_phan)]))
  // Chỉ mục ngược vị → bài (chỉ bài ứng viên). Bỏ vị quá phổ biến khỏi bước SINH ứng viên
  // (Cam thảo có mặt trong hàng nghìn bài) — vẫn tính nó trong Jaccard.
  const nguoc = new Map()
  for (const b of bai) {
    if (!ungVien.has(b.slug)) continue
    for (const v of tap.get(b.slug)) {
      if (!nguoc.has(v)) nguoc.set(v, [])
      nguoc.get(v).push(b.slug)
    }
  }
  const PHO_BIEN = 1500
  const theoSlug = new Map(bai.map((b) => [b.slug, b]))
  const kq = new Map()
  for (const b of bai) {
    const A = tap.get(b.slug)
    if (A.size < 2) continue
    const chung = new Map()
    for (const v of A) {
      const ds = nguoc.get(v)
      if (!ds || ds.length > PHO_BIEN) continue
      for (const s of ds) if (s !== b.slug) chung.set(s, (chung.get(s) || 0) + 1)
    }
    const ra = []
    for (const s of chung.keys()) {
      if (boQua(b.slug, s)) continue
      const B = tap.get(s)
      let giao = 0
      for (const v of A) if (B.has(v)) giao++
      const j = giao / (A.size + B.size - giao)
      if (j >= nguong) ra.push({ slug: s, ten: theoSlug.get(s).ten, chung: giao, j })
    }
    ra.sort((x, y) => y.j - x.j || y.chung - x.chung || x.ten.localeCompare(y.ten, 'vi'))
    if (ra.length) kq.set(b.slug, ra.slice(0, toiDa))
  }
  return kq
}

/** Câu tóm tắt đọc được: "Trong 6/8 vị có dữ liệu: tính Ôn (3), Bình (2)…". */
export function cauTomTat(pt) {
  if (!pt) return ''
  const ke = (ds) => ds.slice(0, 4).map(([k, n]) => `${k} (${n})`).join(', ')
  return [
    `Trong ${pt.soCoDuLieu}/${pt.soVi} vị có dữ liệu`,
    pt.khi.length ? `tính ${ke(pt.khi)}` : '',
    pt.vi.length ? `vị ${ke(pt.vi)}` : '',
    pt.kinh.length ? `quy kinh ${ke(pt.kinh)}` : '',
  ].filter(Boolean).join('; ') + '.'
}
