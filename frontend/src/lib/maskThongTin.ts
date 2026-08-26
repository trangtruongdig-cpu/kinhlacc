// Che một phần thông tin định danh bệnh nhân (họ tên, SĐT) cho vai trò Lễ Tân —
// số ký tự che luôn cố định (không tỉ lệ theo độ dài gốc) để không lộ cả độ dài chuỗi thật.
const CHE_TEN = '*'.repeat(5)
const CHE_SDT = 'x'.repeat(4)

/** "Nguyễn Văn Trang" -> "*****rang". Tên ≤4 ký tự bị che hoàn toàn. */
export function maskHoTen(hoTen: string | null | undefined): string {
  const s = (hoTen || '').trim()
  if (!s) return '—'
  if (s.length <= 4) return CHE_TEN
  return CHE_TEN + s.slice(-4)
}

/** "0987654353" -> "0xxxx353". SĐT ≤4 ký tự bị che hoàn toàn. */
export function maskSdt(sdt: string | null | undefined): string {
  const s = (sdt || '').trim()
  if (!s) return '—'
  if (s.length <= 4) return CHE_SDT
  return s.charAt(0) + CHE_SDT + s.slice(-3)
}
