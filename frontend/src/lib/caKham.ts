/**
 * Mốc thời gian của MỘT ca đo.
 *
 * `thoiDiemKham` là giờ khám THỰC TẾ — thầy thuốc nhập lúc tạo phiếu và sửa được sau đó
 * (lùi khi nhập bù ca cũ, tiến khi gõ nhầm). `createdAt` chỉ là lúc bấm nút lưu, hệ thống
 * ghi và không đổi được.
 *
 * MỌI nơi hiển thị/sắp xếp ca đo phải dùng hàm này, đừng đọc thẳng `createdAt` — nếu không,
 * sửa giờ ở danh sách xong vào trong kết quả đo lại thấy giờ cũ (và trục Truyền Biến sẽ
 * xâu chuỗi sai thứ tự các lần đo).
 */
export interface CoThoiDiemKham {
  thoiDiemKham?: string | Date | null
  createdAt?: string | Date | null
}

/** Mốc giờ khám để hiển thị/sắp xếp: ưu tiên giờ thầy thuốc đặt, ca cũ thì lấy giờ tạo. */
export function mocKham(exam: CoThoiDiemKham | null | undefined): string | null {
  if (!exam) return null
  const raw = exam.thoiDiemKham ?? exam.createdAt ?? null
  if (!raw) return null
  return raw instanceof Date ? raw.toISOString() : raw
}

/** Mốc giờ khám dạng số (ms) để so sánh/sắp xếp; không đọc được trả 0. */
export function mocKhamMs(exam: CoThoiDiemKham | null | undefined): number {
  const raw = mocKham(exam)
  if (!raw) return 0
  const t = new Date(raw).getTime()
  return Number.isNaN(t) ? 0 : t
}

/** "dd/mm/yyyy" theo giờ Việt Nam. */
export function ngayKhamVN(exam: CoThoiDiemKham | null | undefined, khiTrong = '—'): string {
  const raw = mocKham(exam)
  if (!raw) return khiTrong
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? khiTrong : d.toLocaleDateString('vi-VN')
}

/** "hh:mm dd/mm/yyyy" theo giờ Việt Nam. */
export function gioNgayKhamVN(exam: CoThoiDiemKham | null | undefined, khiTrong = '—'): string {
  const raw = mocKham(exam)
  if (!raw) return khiTrong
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return khiTrong
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
