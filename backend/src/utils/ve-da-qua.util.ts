/**
 * Ca đã qua giờ hay chưa — so theo giờ Việt Nam.
 *
 * Giờ VN là UTC+7 CỐ ĐỊNH (không có giờ mùa hè, xem ics.util.ts), nên ghép thẳng `+07:00`
 * là chính xác tuyệt đối, không phụ thuộc múi giờ của máy chủ (container chạy UTC).
 *
 * Ca bắt đầu ĐÚNG lúc này cũng tính là đã qua: 17:00 thì ca 17:00 đã vào giờ, không nhận
 * đặt mới nữa.
 */
export function thoiDiemBatDauCa(slotDate: string, slotTime: string): Date {
  const gio = slotTime.length === 5 ? `${slotTime}:00` : slotTime.slice(0, 8);
  return new Date(`${slotDate}T${gio}+07:00`);
}

export function caDaQuaGio(
  slotDate: string,
  slotTime: string,
  now: Date = new Date(),
): boolean {
  const batDau = thoiDiemBatDauCa(slotDate, slotTime).getTime();
  // Dữ liệu hỏng thì KHÔNG coi là đã qua — chặn nhầm ca hợp lệ tệ hơn để lọt một ca lỗi.
  if (Number.isNaN(batDau)) return false;
  return batDau <= now.getTime();
}

interface CaToiThieu {
  id: number;
  slotDate: string;
  slotTime: string;
  status: string;
}

/**
 * Luật chuyển vé. Trả về câu lý do nếu KHÔNG chuyển được, `null` nếu được.
 *
 * - Ca nguồn phải đang có vé chưa hoàn thành (BOOKED). Ca nguồn ĐÃ QUA GIỜ vẫn chuyển được —
 *   đó chính là trường hợp khách bận không tới.
 * - Ca đích phải trống (OPEN) và CHƯA tới giờ.
 */
export function lyDoKhongChuyenDuoc(
  nguon: CaToiThieu,
  dich: CaToiThieu,
  now: Date = new Date(),
): string | null {
  if (nguon.id === dich.id) return 'Ca mới trùng ca cũ';
  if (nguon.status !== 'BOOKED') {
    return 'Chỉ chuyển được vé đã đặt mà chưa hoàn thành';
  }
  if (dich.status !== 'OPEN') return 'Ca mới không còn trống';
  if (caDaQuaGio(dich.slotDate, dich.slotTime, now)) {
    return 'Ca mới đã qua giờ, chọn ca khác';
  }
  return null;
}
