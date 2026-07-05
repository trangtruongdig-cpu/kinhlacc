/**
 * Rút gọn nhãn hiển thị đường kinh / tạng phủ.
 * Chỉ đổi CHỮ HIỂN THỊ — giá trị (id) dùng để lọc/lưu giữ nguyên.
 *
 *   "Túc Thái Âm Tỳ"          → "Tỳ"
 *   "Thủ Dương Minh Đại Trường" → "Đại Trường"
 *   "Mạch Đốc" / "Kỳ Huyệt"    → giữ nguyên (đã ngắn)
 */
const HAND_FOOT = ['Thủ', 'Túc']
const CHANNELS = ['Thái Dương', 'Thiếu Dương', 'Dương Minh', 'Thái Âm', 'Thiếu Âm', 'Quyết Âm']

export function shortKinhMachLabel(name: string): string {
  let s = (name ?? '').trim()
  for (const hf of HAND_FOOT) {
    if (s.startsWith(hf + ' ')) {
      s = s.slice(hf.length + 1)
      break
    }
  }
  for (const ch of CHANNELS) {
    if (s.startsWith(ch + ' ')) {
      s = s.slice(ch.length + 1)
      break
    }
  }
  return s.trim() || name
}
