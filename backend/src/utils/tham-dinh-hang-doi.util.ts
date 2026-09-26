/**
 * Xếp hàng đợi cho lớp thầy thuốc.
 *
 * Lớp 1 quét cả kho vì nó miễn phí. Lớp 2 gọi mô hình nên phải chọn, và chọn theo cái gì
 * là quyết định đắt nhất của cả bot: 484 trang huyệt gom 75% lượt hiển thị toàn site,
 * còn 9.112 bài thuốc trống rỗng thì đọc kỹ cũng không ra chữ nào để phê.
 */

export interface UngVienSoi {
  bo: string;
  ma: string;
  slug: string;
  tieuDe: string;
  /** Số ký tự thân bài, lấy từ td_muc.do_day. */
  doDay: number;
  soLoiMay: number;
  vanTayNoiDung: string;
  /** Vân tay tại lần soi kỹ gần nhất; null = chưa soi kỹ lần nào. */
  vanTayThayThuoc: string | null;
  /** Điểm cơ hội từ Search Console. Lớp 3 mới nối; tới đó vẫn là 0 và công thức không đổi. */
  diemCoHoiSeo: number;
}

/** Dưới ngưỡng này thì không có đủ chữ để phê văn phong — đo thật: trung vị mục huyệt 336 ký tự. */
export const DAY_TOI_THIEU = 800;

/**
 * Giai đoạn đầu KHÔNG đưa bài thuốc và dược liệu vào lớp 2: 15.000 trang ấy Google chưa
 * hề biết tới, việc của chúng là vào được chỉ mục, không phải gọt câu chữ.
 */
const BO_NGOAI_PHAM_VI = new Set(['bai_thuoc', 'duoc_lieu', 'nguon_y_van']);

/**
 * Điểm ưu tiên. Độ dày chia 2000 rồi chặn trần 5 để nó KHÔNG lấn át: một mục 20.000 ký tự
 * không được đứng trên một mục có người tìm thật trên Google.
 */
export function diemUuTien(u: UngVienSoi): number {
  const day = Math.min(u.doDay / 2000, 5);
  return u.diemCoHoiSeo * 3 + u.soLoiMay * 2 + day;
}

export function xepHangDoi(ds: UngVienSoi[], soLuong: number): UngVienSoi[] {
  if (soLuong <= 0) return [];
  return ds
    .filter((u) => !BO_NGOAI_PHAM_VI.has(u.bo))
    .filter((u) => u.doDay >= DAY_TOI_THIEU)
    // Van vân tay: chưa đổi thì không gọi mô hình lại.
    .filter((u) => u.vanTayThayThuoc !== u.vanTayNoiDung)
    .sort((a, b) => diemUuTien(b) - diemUuTien(a))
    .slice(0, soLuong);
}
