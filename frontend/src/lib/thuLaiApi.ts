/**
 * Luật hạn giờ và thử lại cho `services/api.ts`.
 *
 * Tách riêng vì đây là phần DUY NHẤT có thể sai một cách im lặng — thử lại nhầm một thao tác
 * GHI là tạo ra vé đặt hai lần mà không màn hình nào báo gì. Frontend không có bộ chạy test cho
 * `src/`, nhưng module THUẦN thì `node --test` chạy thẳng được (Node tự bóc kiểu), nên không
 * phải thêm vitest chỉ để canh mấy nhánh if.
 *
 *   node --test src/lib/thuLaiApi.test.ts
 */

/** Rộng gấp hàng trăm lần p90 đo được (41 ms, 30 mẫu 10/10/2026) — cố ý, để không cắt oan
 *  người đang ở đường yếu. Mục đích là chặn treo VÔ HẠN, không phải siết tốc độ. */
export const HAN_GIO_DOC_MS = 12_000
export const HAN_GIO_GHI_MS = 20_000

/** Chỉ ba mã này là "máy chủ đang nghẽn, lát nữa thử lại được". */
const MA_DANG_THU_LAI = new Set([502, 503, 504])

export function nenThuLai(opts: {
  laGhi: boolean
  coKhoa: boolean
  lanDaThu: number
  status: number | null
  laLoiMang: boolean
}): boolean {
  const { laGhi, coKhoa, lanDaThu, status, laLoiMang } = opts

  // ⚠️ Thao tác GHI không mang khoá chống lặp thì TUYỆT ĐỐI không thử lại: không ai biết máy
  // chủ đã làm xong hay chưa, và thử lại mù là cách tạo ra vé đặt hai lần.
  if (laGhi && !coKhoa) return false

  const tran = laGhi ? 1 : 2
  if (lanDaThu >= tran) return false

  if (laLoiMang) return true
  // 4xx là câu trả lời THẬT của máy chủ (409 = ca đã có người đặt). Thử lại chỉ tốn thêm một
  // vòng mạng để nhận đúng câu trả lời cũ.
  return status != null && MA_DANG_THU_LAI.has(status)
}

/** 300 ms rồi 1.200 ms. Không thử lại tức thì — mạng vừa chập cần một nhịp để hồi. */
export function treTruocKhiThu(lanDaThu: number): number {
  return lanDaThu === 0 ? 300 : 1_200
}
