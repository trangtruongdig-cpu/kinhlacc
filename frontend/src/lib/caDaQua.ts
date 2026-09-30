import { onBeforeUnmount, ref } from 'vue'

/**
 * Ca đã qua giờ hay chưa — so theo giờ Việt Nam (UTC+7 cố định), không theo giờ máy người xem.
 * Bản sao của backend/src/utils/ve-da-qua.util.ts; backend mới là chốt chặn thật, bản này chỉ
 * để giao diện khoá nút cho khớp.
 *
 * Ca bắt đầu ĐÚNG lúc này cũng tính là đã qua.
 */
export function caDaQuaGio(slotDate: string, slotTime: string, nowMs: number = Date.now()): boolean {
  const gio = slotTime.length === 5 ? `${slotTime}:00` : slotTime.slice(0, 8)
  const batDau = new Date(`${slotDate}T${gio}+07:00`).getTime()
  if (Number.isNaN(batDau)) return false
  return batDau <= nowMs
}

/** Đồng hồ phản ứng, nhảy mỗi 30 giây — để ca tự khoá khi tới giờ mà không cần tải lại trang. */
export function useDongHo(buocMs = 30_000) {
  const nowMs = ref(Date.now())
  const timer = setInterval(() => { nowMs.value = Date.now() }, buocMs)
  onBeforeUnmount(() => clearInterval(timer))
  return nowMs
}
