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

/**
 * Lời thường cho VỊ TRÍ bệnh của sáu kinh (Thương Hàn) — khoá là `KinhMeta.viTri`.
 *
 * ⚠️ Vẫn chỉ MÔ TẢ chỗ bệnh đang nằm, KHÔNG phán đoán thêm và KHÔNG hàm ý chữa trị. Sáu câu
 * này là diễn giải mức căn bản của chính thuật ngữ đã có trong `lib/lucKinh.ts`, không phải
 * kết luận mới — nhưng vẫn là chữ y văn, nên thầy thuốc nên đọc lại một lượt trước khi tin.
 */
const BANG_VI_TRI: Record<string, string> = {
  'Biểu': 'bệnh còn ở lớp ngoài',
  'Lý thực nhiệt': 'bệnh đã vào trong, thiên về nóng',
  'Bán biểu bán lý': 'bệnh ở khoảng giữa — nửa ngoài nửa trong',
  'Lý hư hàn': 'bệnh vào trong, thiên về lạnh và yếu sức',
  'Lý hư (hàn/nhiệt hóa)': 'bệnh vào sâu, cơ thể đang yếu',
  'Hàn nhiệt thác tạp': 'nóng và lạnh lẫn lộn',
}

/** Kinh có `viTri`; thiếu dữ liệu hoặc `viTri` ngoài bảng thì phần lời thường để rỗng. */
export function cauChotLucKinh(
  v: { kinh?: { ten?: string; viTri?: string } | null; giaiDoan?: string } | null | undefined,
): { chinh: string; thuong: string; phu: string } {
  const ten = (v?.kinh?.ten || '').trim()
  if (!ten) return { chinh: '', thuong: '', phu: '' }
  const viTri = (v?.kinh?.viTri || '').trim()
  return { chinh: ten, thuong: BANG_VI_TRI[viTri] ?? '', phu: (v?.giaiDoan || '').trim() }
}

/**
 * Câu chốt bước ĐIỀU TRỊ: nguyên tắc pháp trị lấy thẳng từ `tongCuong.phapTri`
 * (bảng PHAP_TRI_TONG_CUONG đã lương y duyệt). Không thêm chữ nào.
 */
export function cauChotPhapTri(tc: TongCuong): { chinh: string; thuong: string } {
  const chinh = (tc.phapTri || '').trim()
  if (!chinh || tc.loai === 'unknown') return { chinh: '', thuong: '' }
  return { chinh, thuong: 'hướng chữa chung theo Bát Cương — thầy thuốc lập phương cụ thể' }
}
