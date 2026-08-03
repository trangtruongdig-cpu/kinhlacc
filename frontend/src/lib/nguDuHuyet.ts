// ═══════════════════════════════════════════════════════════════════════════
// NGŨ DU HUYỆT (五輸穴) ↔ NGŨ HÀNH — bảng tĩnh 60 huyệt (5 huyệt × 12 kinh).
// Nguồn: "Phương pháp luận Ngũ Hành Hồi Tác" (Nguyễn Trọng Hùng, 1989) tr.16, 40–56.
// Dùng để tra ngược: "Thuỷ huyệt của Can" = Khúc tuyền, "Hoả huyệt của Đởm" = Dương phụ…
// ═══════════════════════════════════════════════════════════════════════════

export type HanhId = 'moc' | 'hoa' | 'tho' | 'kim' | 'thuy'
export type Role = 'tinh' | 'huynh' | 'du' | 'kinh' | 'hop'

export const HANH_TEN: Record<HanhId, string> = {
  moc: 'Mộc', hoa: 'Hoả', tho: 'Thổ', kim: 'Kim', thuy: 'Thuỷ',
}
export const ROLE_TEN: Record<Role, string> = {
  tinh: 'Tỉnh', huynh: 'Huỳnh', du: 'Du', kinh: 'Kinh', hop: 'Hợp',
}
const ROLE_ORDER: Role[] = ['tinh', 'huynh', 'du', 'kinh', 'hop']

// role → hành: ÂM kinh và DƯƠNG kinh gán hành khác nhau (tr.16 "Xếp đặt Ngũ Du huyệt").
//   Âm kinh   : Tỉnh Mộc · Huỳnh Hoả · Du Thổ  · Kinh Kim  · Hợp Thuỷ
//   Dương kinh: Tỉnh Kim · Huỳnh Thuỷ · Du Mộc · Kinh Hoả · Hợp Thổ
const ROLE_HANH_AM: Record<Role, HanhId> = { tinh: 'moc', huynh: 'hoa', du: 'tho', kinh: 'kim', hop: 'thuy' }
const ROLE_HANH_DUONG: Record<Role, HanhId> = { tinh: 'kim', huynh: 'thuy', du: 'moc', kinh: 'hoa', hop: 'tho' }

export interface KinhDef {
  id: string // tên kinh (tạng/phủ) — khớp tên tạng phủ trong app
  am: boolean // true = âm kinh (tạng); false = dương kinh (phủ)
  hanh: HanhId // hành của bản thân kinh
  huyet: [string, string, string, string, string] // theo thứ tự [Tỉnh, Huỳnh, Du, Kinh, Hợp]
}

// ── 6 ÂM kinh (tạng) ──────────────────────────────────────────────────────
// ── 6 DƯƠNG kinh (phủ) ────────────────────────────────────────────────────
export const KINH: Record<string, KinhDef> = {
  'Can': { id: 'Can', am: true, hanh: 'moc', huyet: ['Đại đôn', 'Hành gian', 'Thái xung', 'Trung phong', 'Khúc tuyền'] },
  'Tâm': { id: 'Tâm', am: true, hanh: 'hoa', huyet: ['Thiếu xung', 'Thiếu phủ', 'Thần môn', 'Linh đạo', 'Thiếu hải'] },
  'Tâm bào': { id: 'Tâm bào', am: true, hanh: 'hoa', huyet: ['Trung xung', 'Lao cung', 'Đại lăng', 'Gian sử', 'Khúc trạch'] },
  'Tỳ': { id: 'Tỳ', am: true, hanh: 'tho', huyet: ['Ẩn bạch', 'Đại đô', 'Thái bạch', 'Thương khâu', 'Âm lăng tuyền'] },
  'Phế': { id: 'Phế', am: true, hanh: 'kim', huyet: ['Thiếu thương', 'Ngư tế', 'Thái uyên', 'Kinh cừ', 'Xích trạch'] },
  'Thận': { id: 'Thận', am: true, hanh: 'thuy', huyet: ['Dũng tuyền', 'Nhiên cốc', 'Thái khê', 'Phục lưu', 'Âm cốc'] },
  'Đởm': { id: 'Đởm', am: false, hanh: 'moc', huyet: ['Túc khiếu âm', 'Hiệp khê', 'Túc lâm khấp', 'Dương phụ', 'Dương lăng tuyền'] },
  'Tiểu trường': { id: 'Tiểu trường', am: false, hanh: 'hoa', huyet: ['Thiếu trạch', 'Tiền cốc', 'Hậu khê', 'Dương cốc', 'Tiểu hải'] },
  'Tam tiêu': { id: 'Tam tiêu', am: false, hanh: 'hoa', huyet: ['Quan xung', 'Dịch môn', 'Trung chử', 'Chi câu', 'Thiên tỉnh'] },
  'Vị': { id: 'Vị', am: false, hanh: 'tho', huyet: ['Lệ đoài', 'Nội đình', 'Hãm cốc', 'Giải khê', 'Túc tam lý'] },
  'Đại trường': { id: 'Đại trường', am: false, hanh: 'kim', huyet: ['Thương dương', 'Nhị gian', 'Tam gian', 'Dương khê', 'Khúc trì'] },
  'Bàng quang': { id: 'Bàng quang', am: false, hanh: 'thuy', huyet: ['Chí âm', 'Thông cốc', 'Thúc cốt', 'Côn lôn', 'Ủy trung'] },
}

export interface HuyetTra { ten: string; role: Role; roleTen: string }

/** Tra huyệt Ngũ Du của một kinh theo HÀNH cần tác động (mỗi kinh có đủ 5 hành trong 5 huyệt). */
export function huyetTheoHanh(kinhId: string, hanh: HanhId): HuyetTra | null {
  const k = KINH[kinhId]
  if (!k) return null
  const map = k.am ? ROLE_HANH_AM : ROLE_HANH_DUONG
  const role = ROLE_ORDER.find((r) => map[r] === hanh)
  if (!role) return null
  return { ten: k.huyet[ROLE_ORDER.indexOf(role)]!, role, roleTen: ROLE_TEN[role] }
}

// ── Ngũ hành tương khắc: a khắc KHAC[a] ──
const KHAC: Record<HanhId, HanhId> = { moc: 'tho', tho: 'thuy', thuy: 'hoa', hoa: 'kim', kim: 'moc' }

/** Hành khắc E (kẻ khống chế E): X sao cho X khắc E. VD controllerOf('hoa')='thuy'. */
export function controllerOf(e: HanhId): HanhId {
  return (Object.keys(KHAC) as HanhId[]).find((x) => KHAC[x] === e)!
}

/** Hành của một tạng/phủ. */
export function hanhCuaKinh(kinhId: string): HanhId | null {
  return KINH[kinhId]?.hanh ?? null
}

// Các tạng/phủ thuộc mỗi hành (tạng đứng trước) — để chọn "kinh gốc" khi chỉ biết hành lệch.
export const KINH_THEO_HANH: Record<HanhId, string[]> = {
  moc: ['Can', 'Đởm'],
  hoa: ['Tâm', 'Tiểu trường', 'Tâm bào', 'Tam tiêu'],
  tho: ['Tỳ', 'Vị'],
  kim: ['Phế', 'Đại trường'],
  thuy: ['Thận', 'Bàng quang'],
}
