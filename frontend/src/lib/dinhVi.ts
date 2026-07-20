/**
 * dinhVi.ts — ĐỊNH VỊ bệnh nhân theo taxonomy Pháp Trị (Tab "Biện chứng – Pháp trị").
 *
 * Nguyên tắc (chốt với người dùng): thể bệnh đo ra là XÁC ĐỊNH — không trọng số/xác suất.
 * Chỉ gom tag `luc_kinh` của các PHÁP TRỊ thuộc thể bệnh (đi qua BÀI THUỐC — link đúng;
 * thể → pháp trị trực tiếp chưa chuẩn), phân về 3 trục (Định vị · Tác nhân · Tính chất).
 * Trục/sub-nhóm nào không có tag → để TRỐNG.
 *
 * Tạng phủ KHÔNG lấy ở đây — lấy trực tiếp từ Bát Cương (affectedOrgans, số đo) cho chính xác.
 */
import {
  TON_THUONG_AXES,
  TON_THUONG_SUBGROUP_LABELS,
  TON_THUONG_NAME_TO_NHOM,
  shortTonThuongLabel,
} from '@/constants/tonThuong'
import { shortKinhMachLabel } from '@/constants/kinhMach'

/** 1 phần tử response của GET /phap-tri/by-bai-thuoc. */
export interface PhapTriByBaiThuoc {
  idBaiThuoc: number
  phapTri: Array<{
    id: number
    chung_trang: string | null
    luc_kinh: string | null
    doan_chung_trang: string | null
    kinh_mach: Array<{ id: number; ten: string }>
  }>
}

export interface DinhViTag {
  /** Giá trị lưu/khớp (đầy đủ, vd "Thái Dương Kinh Chứng"). */
  name: string
  /** Nhãn hiển thị rút gọn (vd "Thái Dương"). */
  label: string
  /** Số pháp trị của thể chứa tag này (giữ để sau cần, mặc định KHÔNG hiển thị). */
  count: number
}
export interface DinhViSubgroup {
  nhom: string
  label: string
  tags: DinhViTag[]
}
export interface DinhViAxis {
  key: string
  num: string
  title: string
  sub: string
  subgroups: DinhViSubgroup[]
}

export interface DinhViResult {
  axes: DinhViAxis[]
  /** Tạng phủ TỔN THƯƠNG theo MÔ HÌNH bệnh (kinh_mach của pháp trị), không phải 12 kinh đo. */
  tangPhu: DinhViTag[]
  /** id các pháp trị đã gom (để nút "xem pháp trị" nếu cần). */
  phapTriIds: number[]
  /** true nếu không có pháp trị nào (mọi thể đều thiếu link bài thuốc). */
  isEmpty: boolean
}

/**
 * Gom định vị từ danh sách pháp-trị-theo-bài-thuốc.
 * Union tag `luc_kinh` (bỏ trùng theo pháp trị), phân về 3 trục theo taxonomy chuẩn.
 */
export function buildDinhVi(rows: PhapTriByBaiThuoc[]): DinhViResult {
  const tagCount = new Map<string, number>()
  const tangCount = new Map<string, number>() // tạng phủ tổn thương (từ kinh_mach của pháp trị)
  const ptSeen = new Set<number>()

  for (const r of rows) {
    for (const pt of r.phapTri) {
      if (ptSeen.has(pt.id)) continue // 1 pháp trị chỉ tính 1 lần dù nhiều bài trỏ tới
      ptSeen.add(pt.id)
      for (const raw of (pt.luc_kinh ?? '').split(',')) {
        const t = raw.trim()
        if (!t) continue
        tagCount.set(t, (tagCount.get(t) ?? 0) + 1)
      }
      for (const km of pt.kinh_mach ?? []) {
        const tang = shortKinhMachLabel(km.ten || '').trim()
        if (tang) tangCount.set(tang, (tangCount.get(tang) ?? 0) + 1)
      }
    }
  }

  // Phân tag về nhom theo taxonomy chuẩn (tag lạ → bỏ qua, không dựng trục "Khác" cho gọn).
  const byNhom = new Map<string, DinhViTag[]>()
  for (const [name, count] of tagCount) {
    const nhom = TON_THUONG_NAME_TO_NHOM[name]
    if (!nhom) continue
    if (!byNhom.has(nhom)) byNhom.set(nhom, [])
    byNhom.get(nhom)!.push({ name, label: shortTonThuongLabel(name), count })
  }
  for (const tags of byNhom.values()) tags.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  // Dựng đủ 3 trục + mọi sub-nhóm; sub-nhóm không có tag → mảng rỗng (UI hiện "—").
  const axes: DinhViAxis[] = TON_THUONG_AXES.map((ax) => ({
    key: ax.key,
    num: ax.num,
    title: ax.title,
    sub: ax.sub,
    subgroups: ax.groups.map((nhom) => ({
      nhom,
      label: TON_THUONG_SUBGROUP_LABELS[nhom] ?? nhom,
      tags: byNhom.get(nhom) ?? [],
    })),
  }))

  const tangPhu: DinhViTag[] = [...tangCount.entries()]
    .map(([name, count]) => ({ name, label: name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  return { axes, tangPhu, phapTriIds: [...ptSeen], isEmpty: ptSeen.size === 0 }
}

/**
 * Chuyển kết luận tổng cương Âm-Dương (chuỗi tự do) → nửa nào sáng trên Thái Cực.
 * 'Dương thịnh'/'Dương hư'/'Thiên Dương' → duong · 'Âm thịnh'/'Âm hư'/'Thiên Âm' → am ·
 * 'Âm Dương cân bằng' → both · rỗng/không rõ → null (không tô).
 */
export function parseAmDuong(verdict: string | null | undefined): 'duong' | 'am' | 'both' | null {
  const v = (verdict ?? '').trim()
  if (!v) return null
  if (/cân bằng/i.test(v)) return 'both'
  const hasD = /Dương/.test(v)
  const hasA = /Âm/.test(v)
  if (hasD && hasA) return 'both'
  if (hasD) return 'duong'
  if (hasA) return 'am'
  return null
}
