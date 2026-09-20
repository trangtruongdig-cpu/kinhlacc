// ═══════════════════════════════════════════════════════════════════════════
// HUYỆT NGUYÊN (原穴) & HUYỆT LẠC (絡穴) — TRỤC THỨ HAI của phương huyệt.
//
// Ngũ Du tác động theo HÀNH (bổ mẫu, tả tử, chế khắc) — trục ngũ hành.
// Nguyên–Lạc tác động theo cặp BIỂU–LÝ THÔNG NHAU — trục tạng phủ:
//   • Huyệt NGUYÊN là nơi nguyên khí của tạng phủ dừng lại → chỗ nhận bệnh của KINH CHÍNH.
//   • Huyệt LẠC là nơi lạc mạch TÁCH RA nối sang kinh biểu-lý → chỗ hai kinh "thông nhau".
// Phối CHỦ–KHÁCH (主客原絡配穴): kinh bệnh TRƯỚC lấy huyệt Nguyên của nó (chủ), kinh biểu-lý
// bệnh THEO SAU lấy huyệt Lạc (khách) — một kim mở gốc, một kim cắt đường lan.
//
// ĐỐI CHIẾU (19/09/2026): cả 27 huyệt dưới đây khớp từ điển 1058 huyệt của app
// (public/kinhmach3d/data/acupoints.js) trên CẢ HAI mặt — nhãn "Huyệt Nguyên"/"Huyệt Lạc"
// trong mục ĐẶC TÍNH, và số thứ tự huyệt trên kinh (khớp mã quốc tế LU9, LI6…).
// Chính từ điển cũng ghi phép phối này ở Thiên Lịch: "Châm với huyệt Nguyên của Phế trong
// rối loạn Lạc Ngang gây ra do kinh chính Hư hoặc Thực."
// ═══════════════════════════════════════════════════════════════════════════

import { KINH, bieuLyCua } from './nguDuHuyet'

export interface HuyetDon {
  ten: string
  /** Mã quốc tế (LU9, LI6…) — để đối chiếu với bộ dữ liệu huyệt 3D. */
  ma: string
}

/** 12 kinh chính: huyệt Nguyên + huyệt Lạc. Khoá = tên tạng phủ, khớp `KINH` của nguDuHuyet. */
export const NGUYEN_LAC: Record<string, { nguyen: HuyetDon; lac: HuyetDon }> = {
  'Phế': { nguyen: { ten: 'Thái uyên', ma: 'LU9' }, lac: { ten: 'Liệt khuyết', ma: 'LU7' } },
  'Đại trường': { nguyen: { ten: 'Hợp cốc', ma: 'LI4' }, lac: { ten: 'Thiên lịch', ma: 'LI6' } },
  'Vị': { nguyen: { ten: 'Xung dương', ma: 'ST42' }, lac: { ten: 'Phong long', ma: 'ST40' } },
  'Tỳ': { nguyen: { ten: 'Thái bạch', ma: 'SP3' }, lac: { ten: 'Công tôn', ma: 'SP4' } },
  'Tâm': { nguyen: { ten: 'Thần môn', ma: 'HT7' }, lac: { ten: 'Thông lý', ma: 'HT5' } },
  'Tiểu trường': { nguyen: { ten: 'Uyển cốt', ma: 'SI4' }, lac: { ten: 'Chi chính', ma: 'SI7' } },
  'Bàng quang': { nguyen: { ten: 'Kinh cốt', ma: 'BL64' }, lac: { ten: 'Phi dương', ma: 'BL58' } },
  'Thận': { nguyen: { ten: 'Thái khê', ma: 'KI3' }, lac: { ten: 'Đại chung', ma: 'KI4' } },
  'Tâm bào': { nguyen: { ten: 'Đại lăng', ma: 'PC7' }, lac: { ten: 'Nội quan', ma: 'PC6' } },
  'Tam tiêu': { nguyen: { ten: 'Dương trì', ma: 'TE4' }, lac: { ten: 'Ngoại quan', ma: 'TE5' } },
  'Đởm': { nguyen: { ten: 'Khâu khư', ma: 'GB40' }, lac: { ten: 'Quang minh', ma: 'GB37' } },
  'Can': { nguyen: { ten: 'Thái xung', ma: 'LR3' }, lac: { ten: 'Lãi câu', ma: 'LR5' } },
}

/**
 * 3 huyệt Lạc NGOÀI 12 kinh chính — cho đủ "thập ngũ lạc" (15 lạc). Không có huyệt Nguyên
 * tương ứng (hai mạch không thuộc tạng phủ), nên đứng riêng chứ không nhét vào bảng trên.
 */
export const LAC_NGOAI_KINH: Array<{ chu: string; lac: HuyetDon; vaiTro: string }> = [
  { chu: 'Nhâm mạch', lac: { ten: 'Cưu vĩ', ma: 'CV15' }, vaiTro: 'lạc nối sang mạch Đốc — tán khí vùng bụng' },
  { chu: 'Đốc mạch', lac: { ten: 'Trường cường', ma: 'GV1' }, vaiTro: 'lạc nối sang mạch Nhâm — tán khí dọc sống lưng' },
  { chu: 'Tỳ (đại lạc)', lac: { ten: 'Đại bao', ma: 'SP21' }, vaiTro: 'đại lạc của Tỳ — thống nhiếp lạc mạch toàn thân' },
]

export function nguyenCua(kinh: string): HuyetDon | null {
  return NGUYEN_LAC[kinh]?.nguyen ?? null
}
export function lacCua(kinh: string): HuyetDon | null {
  return NGUYEN_LAC[kinh]?.lac ?? null
}

export interface PhoiNguyenLac {
  /** Kinh mắc bệnh TRƯỚC — lấy huyệt Nguyên. */
  chu: { kinh: string; huyet: HuyetDon; vaiTro: 'nguyen' }
  /** Kinh biểu-lý mắc bệnh THEO SAU — lấy huyệt Lạc. */
  khach: { kinh: string; huyet: HuyetDon; vaiTro: 'lac' }
  giaiThich: string
}

/**
 * Phối huyệt Nguyên–Lạc theo phép CHỦ–KHÁCH.
 * `kinhChu` là kinh bệnh trước (đã định gốc); kinh biểu-lý của nó thành khách.
 * Trả null nếu kinh không nằm trong 12 kinh chính.
 */
export function phoiNguyenLac(kinhChu: string): PhoiNguyenLac | null {
  const nguyen = nguyenCua(kinhChu)
  const kinhKhach = bieuLyCua(kinhChu)
  if (!nguyen || !kinhKhach) return null
  const lac = lacCua(kinhKhach)
  if (!lac) return null
  const chuAm = KINH[kinhChu]?.am
  const viTri = chuAm ? 'tạng (lý)' : 'phủ (biểu)'
  return {
    chu: { kinh: kinhChu, huyet: nguyen, vaiTro: 'nguyen' },
    khach: { kinh: kinhKhach, huyet: lac, vaiTro: 'lac' },
    giaiThich:
      `${kinhChu} là kinh bệnh TRƯỚC (chủ, ${viTri}) → lấy huyệt Nguyên ${nguyen.ten} để vực nguyên khí ` +
      `ngay tại gốc bệnh; ${kinhKhach} biểu-lý với ${kinhChu} nên bệnh theo lạc mạch truyền sang (khách) ` +
      `→ lấy huyệt Lạc ${lac.ten} để cắt đường thông giữa hai kinh.`,
  }
}

/** Huyệt Nguyên của kinh ÂM trùng huyệt Du ("âm kinh dĩ Du vi Nguyên"); kinh DƯƠNG có Nguyên riêng. */
export function nguyenTrungDu(kinh: string): boolean {
  return KINH[kinh]?.am === true
}
