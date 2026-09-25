/**
 * herbCard — tiện ích cho thẻ vị thuốc phong cách "nhãn thuốc Đông Y" (.hlc).
 * Dùng chung: Từ Điển (DuocLieuBrowser) + trang công khai (DuocLieuListView).
 */
export interface HerbCardLite {
  id: number
  ten_vi_thuoc: string
  ten_han?: string | null
}

/** Chữ Hán hiển thị trong đĩa tròn (ưu tiên ten_han; fallback ký tự đầu tên Việt). */
export function discGlyph(vt: HerbCardLite): string {
  const h = (vt.ten_han || '').trim()
  return h || (vt.ten_vi_thuoc || '?').trim().charAt(0)
}

/** Cỡ chữ Hán trong đĩa theo số ký tự (n1..n4) — nhiều chữ thì nhỏ lại cho vừa. */
export function hanDiscClass(vt: HerbCardLite): string {
  return 'n' + Math.min(4, Math.max(1, [...discGlyph(vt)].length))
}

/** Thu nhỏ tên vị theo độ dài để không tràn thẻ. */
export function tenLenClass(ten: string): string {
  const n = (ten || '').length
  if (n > 13) return 'xlong'
  if (n > 9) return 'long'
  return ''
}

/** Lớp màu tính (gợi ý hàn/nhiệt) cho chip trong dòng "Tính vị". */
export function tinhLabelClass(t?: string | null): string {
  const s = (t || '').toLowerCase()
  if (s.includes('nhiệt')) return 'hlc-tinh--nhiet'
  if (s.includes('hơi hàn') || s.includes('lương') || s.includes('mát')) return 'hlc-tinh--luong'
  if (s.includes('hàn')) return 'hlc-tinh--han'
  if (s.includes('ôn') || s.includes('ấm')) return 'hlc-tinh--on'
  return 'hlc-tinh--binh'
}

/** Gam màu xoay vòng theo id (0..7). */
export function cardColorClass(id: number): string {
  return 'hlc--c' + ((((id || 0) % 8) + 8) % 8)
}
