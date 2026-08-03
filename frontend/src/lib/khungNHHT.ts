// ═══════════════════════════════════════════════════════════════════════════
// KHUNG NGŨ HÀNH HỒI TÁC + PHƯƠNG HUYỆT BỔ/TẢ
// Nguồn: "Phương pháp luận Ngũ Hành Hồi Tác" (Nguyễn Trọng Hùng, 1989).
//  - 4 khung cổ điển (tr.26–31): Biểu-Lý, Thượng-Hạ (đồng danh=Lục Kinh), Phu-Thê, Tý-Ngọ.
//  - 6 cặp hồi tác mới theo VÒNG TƯƠNG SINH LỤC KHÍ (tr.35–38).
//  - Luật bổ/tả rút từ 10 bệnh án (tr.73–79), kiểm khớp 100% (kể cả ca gốc-phủ tr.68).
// ═══════════════════════════════════════════════════════════════════════════

import {
  type HanhId, huyetTheoHanh, controllerOf, hanhCuaKinh, HANH_TEN, KINH_THEO_HANH,
} from './nguDuHuyet'

export type KhungLoai = 'bieuly' | 'thuongha' | 'phuthe' | 'tyngo' | 'lackhi'

export const KHUNG_TEN: Record<KhungLoai, string> = {
  bieuly: 'Biểu–Lý',
  thuongha: 'Thượng–Hạ',
  phuthe: 'Phu–Thê',
  tyngo: 'Tý–Ngọ',
  lackhi: 'Lục Khí',
}
export const KHUNG_MOTA: Record<KhungLoai, string> = {
  bieuly: 'bệnh Thực & Cấp',
  thuongha: 'bệnh Hư & Mãn (= cặp Lục Kinh)',
  phuthe: 'rối loạn chức năng',
  tyngo: 'theo giờ kinh Tý–Ngọ',
  lackhi: 'vòng tương sinh Lục Khí (hồi tác mới)',
}
export const KHUNG_ALL: KhungLoai[] = ['bieuly', 'thuongha', 'phuthe', 'tyngo', 'lackhi']

// Mỗi khung = 6 cặp [ngoài (Dương/biểu), trong (Âm/lý)]. Cả 5 khung đều phủ đủ 12 tạng phủ.
const PAIRS: Record<KhungLoai, [string, string][]> = {
  bieuly: [['Đại trường', 'Phế'], ['Vị', 'Tỳ'], ['Tam tiêu', 'Tâm bào'], ['Tiểu trường', 'Tâm'], ['Đởm', 'Can'], ['Bàng quang', 'Thận']],
  thuongha: [['Tỳ', 'Phế'], ['Vị', 'Đại trường'], ['Thận', 'Tâm'], ['Bàng quang', 'Tiểu trường'], ['Can', 'Tâm bào'], ['Đởm', 'Tam tiêu']],
  phuthe: [['Tâm', 'Phế'], ['Can', 'Tỳ'], ['Thận', 'Tâm bào'], ['Tiểu trường', 'Đại trường'], ['Đởm', 'Vị'], ['Bàng quang', 'Tam tiêu']],
  tyngo: [['Can', 'Tiểu trường'], ['Phế', 'Bàng quang'], ['Đại trường', 'Thận'], ['Vị', 'Tâm bào'], ['Tỳ', 'Tam tiêu'], ['Tâm', 'Đởm']],
  lackhi: [['Đại trường', 'Tỳ'], ['Bàng quang', 'Phế'], ['Tiểu trường', 'Thận'], ['Đởm', 'Tâm'], ['Tam tiêu', 'Can'], ['Vị', 'Tâm bào']],
}

export interface KhungInfo { loai: KhungLoai; ngoai: string; trong: string; partner: string; organIsNgoai: boolean }

/** Tìm cặp khung chứa `organ` + kinh bạn của nó. */
export function khungForOrgan(loai: KhungLoai, organ: string): KhungInfo | null {
  for (const [ngoai, trong] of PAIRS[loai]) {
    if (ngoai === organ) return { loai, ngoai, trong, partner: trong, organIsNgoai: true }
    if (trong === organ) return { loai, ngoai, trong, partner: ngoai, organIsNgoai: false }
  }
  return null
}

/** Tự chọn khung theo Bát Cương: Thực→Biểu-Lý · Hư→Thượng-Hạ · còn lại→Phu-Thê. */
export function autoKhung(huThuc?: string): KhungLoai {
  const v = (huThuc || '').toLowerCase()
  if (v.includes('thực')) return 'bieuly'
  if (v.includes('hư')) return 'thuongha'
  return 'phuthe'
}

/** Tạng gốc mặc định khi chỉ biết hành lệch (tạng đứng trước). */
export function gocMacDinh(hanh: HanhId): string {
  return KINH_THEO_HANH[hanh][0]!
}

export interface HuyetChiDinh {
  kinh: string; hanh: HanhId; hanhTen: string; huyet: string; role: string; boTa: 'bo' | 'ta'
}
export interface PhuongHuyetNHHT {
  gocOrgan: string; hanhE: HanhId; hanhETen: string; thuc: boolean
  khung: KhungInfo
  ta: HuyetChiDinh; bo: HuyetChiDinh
  giaiThich: string
}

function chiDinh(kinh: string, hanh: HanhId, boTa: 'bo' | 'ta'): HuyetChiDinh | null {
  const h = huyetTheoHanh(kinh, hanh)
  if (!h) return null
  return { kinh, hanh, hanhTen: HANH_TEN[hanh], huyet: h.ten, role: h.roleTen, boTa }
}

/**
 * Phương huyệt Ngũ Du theo NHHT. Luật (bệnh án tr.73–79) — NHẤT QUÁN mọi ca:
 *   • kinh GỐC (nơi hành E lệch) mang tác động lên hành-KHẮC C:
 *       E THỰC → BỔ C (C khắc E → chế E vượng);  E HƯ → TẢ C (C khắc E quá tay → hạ kẻ khắc).
 *   • kinh BẠN mang tác động lên chính E:
 *       E THỰC → TẢ E (tiết thực);              E HƯ → BỔ E (phù chính).
 */
export function phuongHuyetNHHT(gocOrgan: string, thuc: boolean, loai: KhungLoai): PhuongHuyetNHHT | null {
  const hanhE = hanhCuaKinh(gocOrgan)
  if (!hanhE) return null
  const khung = khungForOrgan(loai, gocOrgan)
  if (!khung) return null
  const C = controllerOf(hanhE)
  const eTen = HANH_TEN[hanhE], cTen = HANH_TEN[C]
  let ta: HuyetChiDinh | null, bo: HuyetChiDinh | null, giaiThich: string
  if (thuc) {
    ta = chiDinh(khung.partner, hanhE, 'ta')
    bo = chiDinh(gocOrgan, C, 'bo')
    giaiThich = `${cTen} khắc ${eTen} → BỔ ${cTen} (${bo?.huyet} · ${gocOrgan}) chế ${eTen} vượng; TẢ ${eTen} (${ta?.huyet} · ${khung.partner}) tiết thực ở kinh bạn.`
  } else {
    bo = chiDinh(khung.partner, hanhE, 'bo')
    ta = chiDinh(gocOrgan, C, 'ta')
    giaiThich = `${eTen} hư (do ${cTen} khắc quá) → TẢ ${cTen} (${ta?.huyet} · ${gocOrgan}) hạ kẻ khắc; BỔ ${eTen} (${bo?.huyet} · ${khung.partner}) phù chính.`
  }
  if (!ta || !bo) return null
  return { gocOrgan, hanhE, hanhETen: eTen, thuc, khung, ta, bo, giaiThich }
}
