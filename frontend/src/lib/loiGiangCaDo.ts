import type { TongCuong } from './meridianAnalysis'

/**
 * Lời thường cho thuật ngữ Bát Cương — để BỆNH NHÂN ngồi trước mặt hiểu được.
 *
 * Màn Kết Quả Đo được dùng nhiều nhất để giảng giải cho người bệnh, mà "Dương hư" với họ là
 * tiếng nước ngoài. Thuật ngữ ở trên, lời thường ngay dưới: thầy thuốc đọc dòng trên, bệnh
 * nhân đọc dòng dưới.
 *
 * ⚠️ Chỉ MÔ TẢ trạng thái, KHÔNG hàm ý chữa trị — phạm vi hành nghề Y sỹ.
 * ⚠️ Chỉ dịch thuật ngữ CÓ TRONG BẢNG. Từ lạ trả RỖNG chứ không đoán: một lời giải sai nghe
 *    còn đáng tin hơn là không có lời giải nào, nên đoán ở đây đắt hơn im lặng.
 */
const BANG_LOI_THUONG: Record<string, string> = {
  'Dương hư': 'phần nóng ấm của cơ thể đang thiếu',
  'Dương thịnh': 'phần nóng ấm đang dư',
  'Âm hư': 'phần mát ẩm của cơ thể đang thiếu',
  'Âm thịnh': 'phần mát ẩm đang dư',
  'Thiên Dương': 'nghiêng về phía nóng',
  'Thiên Âm': 'nghiêng về phía mát',
  'Âm Dương cân bằng': 'hai phần nóng và mát đang cân nhau',
}

export function loiThuong(thuatNgu: string): string {
  return BANG_LOI_THUONG[thuatNgu.trim()] ?? ''
}

/**
 * Câu chốt của bước 1, lấy TỪ `tongCuong` đã tính — không sinh thêm kết luận y học nào.
 * Thiếu dữ liệu (`loai === 'unknown'`) thì trả rỗng để dải câu chốt tự ẩn: một dải trống
 * còn tệ hơn không có dải.
 */
export function cauChotTongCuong(tc: TongCuong): { chinh: string; thuong: string } {
  const chinh = (tc.amDuong || '').trim()
  if (!chinh || tc.loai === 'unknown') return { chinh: '', thuong: '' }
  return { chinh, thuong: loiThuong(chinh) }
}
