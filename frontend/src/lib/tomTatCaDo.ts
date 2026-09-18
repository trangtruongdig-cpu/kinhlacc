/**
 * tomTatCaDo.ts — TÓM TẮT một lần đo thành mấy chỉ số thể chất mà người bệnh đọc được ngay ngoài
 * danh sách Hồ Sơ Chẩn Trị (Khí · Huyết · Tổng cương · Hư-Thực · Biểu-Lý · thể bệnh YHCT · Lục Kinh),
 * và SO SÁNH hai lần đo liền nhau để thấy chuyển biến.
 *
 * KHÔNG viết lại thuật toán: dùng nguyên bộ hàm ở lib/meridianAnalysis.ts (Bát Cương) và
 * lib/lucKinh.ts (định vị Lục Kinh) — CÙNG bộ mà trang Kết Quả Đo dùng, nên con số ngoài danh sách
 * luôn khớp với trang chi tiết. Đổi thuật toán thì đổi ở hai lib đó, đừng đổi ở đây.
 */
import {
  rawUpper,
  rawLower,
  calculateBounds,
  processRows,
  computeDiagnosis,
  computeTongCuong,
  computeAffectedOrgans,
  type InputData,
  type TongCuong,
} from './meridianAnalysis'
import { locateLucKinh, type LucKinhVerdict, type TheKinhMap } from './lucKinh'

/** Lát cắt tối thiểu của 1 ca đo lấy từ GET /examinations/my-records. */
export interface CaDoInput {
  id: number
  patientId?: number | null
  /** Giờ đo thầy thuốc đặt/sửa — trục thời gian phải theo mốc này, không theo createdAt. */
  thoiDiemKham?: string | null
  createdAt?: string | null
  inputData?: InputData | null
  excelSyndromes?: Array<{ name?: string | null; confidence?: { score?: number | null } | null }> | null
}

export interface TomTat {
  id: number
  patientId: number | null
  /** Mốc thời gian (ms) — thoiDiemKham, thiếu thì createdAt. */
  ts: number
  /** Có đủ 24 chỉ số để tính Bát Cương hay không. */
  coSoLieu: boolean
  khi: string // 'Khí hư' | 'Khí thịnh' | 'Bình thường' | ''
  huyet: string // 'Huyết hư' | 'Huyết thịnh' | 'Bình thường' | ''
  huThuc: string // 'Hư' | 'Thực' | 'Bình thường' | ''
  viTri: string // 'Biểu' | 'Lý' | 'Biểu Lý' | ''
  tinhChat: string // 'Hàn' | 'Nhiệt' | 'Hàn Nhiệt lẫn lộn' | ''
  tongCuong: TongCuong | null
  /** Mô hình bệnh YHCT — tên các thể đo được, thể chắc chắn nhất đứng trước. */
  theBenh: string[]
  lucKinh: LucKinhVerdict | null
}

/** Mốc thời gian của ca đo (ms). 0 nếu không có mốc nào đọc được. */
export function mocCaDo(e: Pick<CaDoInput, 'thoiDiemKham' | 'createdAt'>): number {
  const raw = e.thoiDiemKham || e.createdAt
  if (!raw) return 0
  const t = new Date(raw).getTime()
  return Number.isNaN(t) ? 0 : t
}

/** Tên các thể bệnh đo được, sắp theo độ chắc giảm dần (thể không có điểm coi như 0). */
function tenTheBenh(e: CaDoInput): string[] {
  const list = (e.excelSyndromes ?? [])
    .map((s) => ({ ten: (s?.name || '').trim(), diem: Number(s?.confidence?.score ?? 0) }))
    .filter((s) => s.ten)
  list.sort((a, b) => b.diem - a.diem)
  return list.map((s) => s.ten)
}

/**
 * Tóm tắt 1 ca đo. `theKinhMap` là bản đồ thể→kinh do engine suy (GET /thuong-han/the-kinh);
 * truyền null thì lucKinh rơi về bảng tĩnh trong lib — vẫn ra kết luận, chỉ kém độ phủ.
 */
export function tomTatCaDo(e: CaDoInput, theKinhMap?: TheKinhMap | null): TomTat {
  const theBenh = tenTheBenh(e)
  const d = e.inputData || null
  const coSoLieu = !!d && Object.values(d).some((v) => Number(v) > 0)

  if (!coSoLieu) {
    return {
      id: e.id,
      patientId: e.patientId ?? null,
      ts: mocCaDo(e),
      coSoLieu: false,
      khi: '',
      huyet: '',
      huThuc: '',
      viTri: '',
      tinhChat: '',
      tongCuong: null,
      theBenh,
      lucKinh: locateLucKinh(theBenh, null, theKinhMap ?? null),
    }
  }

  const upper = rawUpper(d)
  const lower = rawLower(d)
  const upperStats = calculateBounds(upper)
  const lowerStats = calculateBounds(lower)
  const upperRows = processRows(upper, upperStats)
  const lowerRows = processRows(lower, lowerStats)

  const chanDoan = computeDiagnosis(d, upperRows, lowerRows, upperStats, lowerStats)

  // Tổng cương dựng lại y hệt MeridianResultsView: đếm Hàn/Nhiệt × Biểu/Lý trên tạng phủ ĐÃ GỘP.
  const organs = computeAffectedOrgans(upperRows, lowerRows, upperStats, lowerStats)
  const nhiet = organs.filter((o) => o.temp === 'nhiet' || o.temp === 'mixed').length
  const han = organs.filter((o) => o.temp === 'han' || o.temp === 'mixed').length
  const bieu = organs.filter((o) => o.depth === 'bieu' || o.depth === 'mixed').length
  const ly = organs.filter((o) => o.depth === 'ly' || o.depth === 'mixed').length
  const tongCuong = computeTongCuong(nhiet, han, bieu, ly, chanDoan.huThuc)

  return {
    id: e.id,
    patientId: e.patientId ?? null,
    ts: mocCaDo(e),
    coSoLieu: true,
    khi: chanDoan.khi,
    huyet: chanDoan.huyet,
    huThuc: chanDoan.huThuc,
    viTri: tongCuong.viTri,
    tinhChat: tongCuong.tinhChat,
    tongCuong,
    theBenh,
    lucKinh: locateLucKinh(theBenh, tongCuong, theKinhMap ?? null),
  }
}

// ── SO SÁNH HAI LẦN ĐO ────────────────────────────────────────────────────────────────────────
export type Huong = 'tot' | 'xau' | 'ngang'
export interface MucThayDoi {
  key: string
  ten: string
  truoc: string
  sau: string
  huong: Huong
}
export interface ChuyenBien {
  /** Kết luận chung, đã cân nhắc cả Lục Kinh lẫn 4 cương + số thể bệnh. */
  muc: 'tot-len' | 'nang-len' | 'chua-doi' | 'dot-moi'
  nhan: string
  diem: number
  /** Số ngày giữa hai lần đo (null nếu thiếu mốc). */
  soNgay: number | null
  /** Hướng truyền biến Lục Kinh giữa hai lần (null nếu một trong hai lần không định vị được). */
  lucKinh: { loai: 'vao-ly' | 'ra-bieu' | 'giu'; nhan: string } | null
  /** Từng cương đổi gì — chỉ liệt kê mục thực sự đổi. */
  thayDoi: MucThayDoi[]
  /** Số thể bệnh đo được: trước → sau. */
  soThe: { truoc: number; sau: number }
  /** Hai lần đo cách nhau quá xa → coi là ĐỢT ĐO KHÁC, không kết luận nặng-nhẹ xuyên đợt. */
  dotMoi: boolean
}

/** Cách nhau > 45 ngày coi là đợt bệnh khác — cùng quy ước với trục truyền biến ở trang Kết Quả Đo. */
export const GAP_DOT_MS = 45 * 24 * 3600 * 1000

/** Mức "lệch khỏi bình thường" của một cương: 0 = bình thường/không rõ, 1 = đang lệch. */
function doLech(v: string): number {
  const s = (v || '').trim()
  if (!s || s === 'Bình thường') return 0
  return 1
}

function huongCuaCuong(truoc: string, sau: string): Huong {
  const a = doLech(truoc)
  const b = doLech(sau)
  if (a === b) return 'ngang'
  return b < a ? 'tot' : 'xau'
}

const DAY_MS = 24 * 3600 * 1000

/**
 * So sánh ca đo `sau` với ca đo `truoc` (truoc CŨ hơn). Quy ước chấm điểm:
 *  • Lục Kinh lui ra biểu +2 / truyền vào lý −2 (đây là tín hiệu nặng-nhẹ rõ nhất).
 *  • Mỗi cương (Khí · Huyết · Hư-Thực) về lại "Bình thường" +1, rời khỏi "Bình thường" −1.
 *  • Số thể bệnh giảm +1 / tăng −1.
 * Điểm > 0 → chuyển tốt; < 0 → cần theo dõi; = 0 → chưa đổi rõ.
 */
export function soSanhCaDo(truoc: TomTat, sau: TomTat): ChuyenBien {
  let diem = 0
  const thayDoi: MucThayDoi[] = []

  const them = (key: string, ten: string, a: string, b: string) => {
    const va = (a || '').trim()
    const vb = (b || '').trim()
    if (!va || !vb || va === vb) return
    const huong = huongCuaCuong(va, vb)
    thayDoi.push({ key, ten, truoc: va, sau: vb, huong })
    if (huong === 'tot') diem += 1
    else if (huong === 'xau') diem -= 1
  }

  them('khi', 'Khí', truoc.khi, sau.khi)
  them('huyet', 'Huyết', truoc.huyet, sau.huyet)
  them('huThuc', 'Hư – Thực', truoc.huThuc, sau.huThuc)
  // Biểu-Lý / Hàn-Nhiệt / Tổng cương chỉ ĐỔI TÍNH CHẤT, không có bên nào "tốt" hơn bên nào —
  // ghi nhận để người bệnh thấy đã đổi, nhưng KHÔNG cộng trừ điểm.
  const themNgang = (key: string, ten: string, a: string, b: string) => {
    const va = (a || '').trim()
    const vb = (b || '').trim()
    if (!va || !vb || va === vb) return
    thayDoi.push({ key, ten, truoc: va, sau: vb, huong: 'ngang' })
  }
  themNgang('viTri', 'Vị trí (Biểu – Lý)', truoc.viTri, sau.viTri)
  themNgang('tinhChat', 'Tính chất (Hàn – Nhiệt)', truoc.tinhChat, sau.tinhChat)
  themNgang('tongCuong', 'Tổng cương', truoc.tongCuong?.amDuong ?? '', sau.tongCuong?.amDuong ?? '')

  // Lục Kinh: so TẦNG biểu→lý — dùng `tang`, KHÔNG dùng `thuTu`. Hai trục đã tách (2026-09-19):
  // Thái Dương 1 · Thiếu Dương 2 · Dương Minh 3 · Thái Âm 4 · Thiếu Âm 5 · Quyết Âm 6, vì Thiếu
  // Dương là bán biểu bán lý nên nông hơn Dương Minh (lý thực nhiệt).
  let lucKinh: ChuyenBien['lucKinh'] = null
  const kt = truoc.lucKinh?.kinh
  const ks = sau.lucKinh?.kinh
  if (kt && ks) {
    if (ks.tang > kt.tang) {
      lucKinh = { loai: 'vao-ly', nhan: `${kt.ten} → ${ks.ten}: bệnh chuyển vào tầng sâu hơn` }
      diem -= 2
    } else if (ks.tang < kt.tang) {
      lucKinh = { loai: 'ra-bieu', nhan: `${kt.ten} → ${ks.ten}: bệnh lui ra tầng nông hơn` }
      diem += 2
    } else {
      lucKinh = { loai: 'giu', nhan: `Vẫn ở kinh ${ks.ten}` }
    }
  }

  const soThe = { truoc: truoc.theBenh.length, sau: sau.theBenh.length }
  if (soThe.sau < soThe.truoc) diem += 1
  else if (soThe.sau > soThe.truoc) diem -= 1

  const soNgay = truoc.ts && sau.ts ? Math.max(0, Math.round((sau.ts - truoc.ts) / DAY_MS)) : null

  const dotMoi = !!(truoc.ts && sau.ts) && sau.ts - truoc.ts > GAP_DOT_MS
  const muc: ChuyenBien['muc'] = dotMoi
    ? 'dot-moi'
    : diem > 0
      ? 'tot-len'
      : diem < 0
        ? 'nang-len'
        : 'chua-doi'
  const nhan = dotMoi
    ? 'Đợt đo mới'
    : muc === 'tot-len'
      ? 'Chuyển biến tốt'
      : muc === 'nang-len'
        ? 'Cần theo dõi thêm'
        : 'Chưa đổi rõ'

  return { muc, nhan, diem, soNgay, lucKinh, thayDoi, soThe, dotMoi }
}
