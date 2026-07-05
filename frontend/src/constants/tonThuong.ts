/**
 * Danh mục CHUẨN "Tổn thương - Tác nhân" theo 3 trục (Thương Hàn Luận / Ôn bệnh).
 * Đồng bộ 1-1 với backend `CHUAN_TON_THUONG`
 * (backend/src/controllers/ton-thuong-tac-nhan.controller.ts).
 *
 *  ① ĐỊNH VỊ (giai đoạn):  gd-luc-kinh · gd-on-benh · gd-khac
 *  ② TÁC NHÂN (khí / tà):  tn-luc-khi (Lục Khí ↔ bản khí Lục Kinh) · tn-noi-sinh
 *  ③ TÍNH CHẤT tổn thương: tinh (bát cương / chính khí)
 *
 * Dùng chung cho form Pháp Trị và bộ lọc (Pháp trị · Thuốc · Bệnh Tây Y · Triệu chứng)
 * để cùng một taxonomy, tránh lặp code mỗi nơi một kiểu.
 */

/** Nhãn ngắn cho từng sub-nhóm (số trục ①②③ nằm ở tiêu đề trục nên không lặp lại). */
export const TON_THUONG_SUBGROUP_LABELS: Record<string, string> = {
  'gd-luc-kinh': 'Lục kinh (Thương hàn)',
  'gd-on-benh': 'Vệ-Khí-Dinh-Huyết (Ôn bệnh)',
  'gd-khac': 'Tam tiêu / Tạp bệnh / Diễn biến',
  'tn-luc-khi': 'Lục khí 六氣 (bản khí ↔ Lục kinh)',
  'tn-noi-sinh': 'Nội sinh / Độc',
  tinh: 'Bát cương · chính khí',
}

export interface TonThuongAxisDef {
  key: string
  num: string
  title: string
  sub: string
  groups: string[]
}

/** 3 trục chẩn đoán — quyết định thứ tự & phân khối. */
export const TON_THUONG_AXES: TonThuongAxisDef[] = [
  { key: 'dinh-vi', num: '①', title: 'Định vị', sub: 'giai đoạn · tầng bệnh', groups: ['gd-luc-kinh', 'gd-on-benh', 'gd-khac'] },
  { key: 'tac-nhan', num: '②', title: 'Tác nhân', sub: 'khí · tà gây bệnh', groups: ['tn-luc-khi', 'tn-noi-sinh'] },
  { key: 'tinh-chat', num: '③', title: 'Tính chất', sub: 'bát cương · chính khí', groups: ['tinh'] },
]

/** Bản đồ tên → nhom (mirror CHUAN_TON_THUONG). Tên đã được backend chuẩn hoá chính tả. */
export const TON_THUONG_NAME_TO_NHOM: Record<string, string> = {
  // ① Giai đoạn — Lục Kinh (Thương Hàn)
  'Thái Dương Kinh Chứng': 'gd-luc-kinh',
  'Dương Minh Kinh Chứng': 'gd-luc-kinh',
  'Thiếu Dương Kinh Chứng': 'gd-luc-kinh',
  'Thái Âm Kinh Chứng': 'gd-luc-kinh',
  'Thiếu Âm Kinh Chứng': 'gd-luc-kinh',
  'Quyết Âm Kinh Chứng': 'gd-luc-kinh',
  // ① Giai đoạn — Vệ-Khí-Dinh-Huyết (Ôn bệnh)
  'Vệ Phận': 'gd-on-benh',
  'Khí Phận': 'gd-on-benh',
  'Dinh Phận': 'gd-on-benh',
  'Huyết Phận': 'gd-on-benh',
  // ① Giai đoạn — Tam tiêu / Tạp bệnh / diễn biến
  'Thượng Tiêu': 'gd-khac',
  'Trung Tiêu': 'gd-khac',
  'Hạ Tiêu': 'gd-khac',
  'Tạp Bệnh': 'gd-khac',
  'Nội Hãm': 'gd-khac',
  // ② Tác nhân — Lục Khí 六氣 (bản khí của một Lục Kinh)
  Phong: 'tn-luc-khi',
  Hàn: 'tn-luc-khi',
  Thử: 'tn-luc-khi',
  Thấp: 'tn-luc-khi',
  Táo: 'tn-luc-khi',
  Nhiệt: 'tn-luc-khi',
  // ② Tác nhân — Nội sinh / Độc
  Đàm: 'tn-noi-sinh',
  'Ứ Huyết': 'tn-noi-sinh',
  'Khí Trệ': 'tn-noi-sinh',
  'Thực Tích': 'tn-noi-sinh',
  'Thuỷ Đình': 'tn-noi-sinh',
  'Độc Tà': 'tn-noi-sinh',
  // ③ Tính tổn thương — bát cương / chính khí
  'Khí Hư': 'tinh',
  'Huyết Hư': 'tinh',
  'Âm Hư': 'tinh',
  'Dương Hư': 'tinh',
  'Khí Huyết': 'tinh',
  'Tân Dịch Khuy': 'tinh',
  Hư: 'tinh',
  Thực: 'tinh',
}

/** Suy ra nhom của một tên tổn thương (ưu tiên nhom sẵn có, rồi tra bảng chuẩn). */
export function tonThuongNhom(name: string, explicit?: string | null): string | null {
  if (explicit) return explicit
  return TON_THUONG_NAME_TO_NHOM[name.trim()] ?? null
}

/**
 * Rút gọn nhãn hiển thị Tổn thương — chỉ đổi CHỮ, giá trị lọc/lưu giữ nguyên.
 *   "Thái Dương Kinh Chứng" → "Thái Dương"  (bỏ đuôi "Kinh Chứng")
 * Các mục khác (Nhiệt, Đàm, Vệ Phận…) giữ nguyên.
 */
export function shortTonThuongLabel(name: string): string {
  const s = (name ?? '').trim()
  return s.replace(/\s*Kinh Chứng$/u, '').trim() || name
}

export interface AxisItem<T> {
  key: string
  num: string
  title: string
  sub: string
  subgroups: { nhom: string; label: string; items: T[] }[]
}

/**
 * Gom danh sách option (bất kỳ có `name`, tuỳ chọn `nhom`) theo 3 trục → sub-nhóm.
 * Option lạ (nhom không thuộc taxonomy) rơi vào trục phụ "Khác" để không mất dữ liệu.
 */
export function groupTonThuongByAxis<T extends { name?: string; ten?: string; nhom?: string | null }>(
  options: T[],
): AxisItem<T>[] {
  const byNhom = new Map<string, T[]>()
  for (const o of options) {
    const name = (o.name ?? o.ten ?? '').trim()
    if (!name) continue
    const nhom = tonThuongNhom(name, o.nhom) ?? 'khac'
    if (!byNhom.has(nhom)) byNhom.set(nhom, [])
    byNhom.get(nhom)!.push(o)
  }
  const used = new Set<string>()
  const axes: AxisItem<T>[] = []
  for (const ax of TON_THUONG_AXES) {
    const subgroups: AxisItem<T>['subgroups'] = []
    for (const nhom of ax.groups) {
      const items = byNhom.get(nhom)
      if (items && items.length) {
        subgroups.push({ nhom, label: TON_THUONG_SUBGROUP_LABELS[nhom] ?? nhom, items })
        used.add(nhom)
      }
    }
    if (subgroups.length) axes.push({ ...ax, subgroups })
  }
  // Trục phụ cho nhom lạ.
  const leftover: AxisItem<T>['subgroups'] = []
  for (const [nhom, items] of byNhom) {
    if (used.has(nhom) || !items.length) continue
    leftover.push({ nhom, label: 'Chưa phân loại', items })
  }
  if (leftover.length) axes.push({ key: 'khac', num: '•', title: 'Khác', sub: 'chưa phân loại', subgroups: leftover })
  return axes
}
