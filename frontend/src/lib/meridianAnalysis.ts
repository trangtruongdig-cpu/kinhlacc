/**
 * meridianAnalysis.ts — Các hàm THUẦN (không phụ thuộc Vue) để tính kết quả đo kinh lạc
 * theo phương pháp Lê Văn Sửu (mô hình Excel).
 *
 * Tách ra từ MeridianResultsView.vue để DÙNG CHUNG cho:
 *   • Trang xem kết quả đo công khai (DemoKetQuaDoView.vue)
 *   • Khu "nhá hàng" kết quả đo trên trang Landing
 * Giữ nguyên thuật toán gốc — chỉ đổi từ biến cục bộ sang tham số hàm.
 */

/** Dữ liệu đo thô: 24 chỉ số (12 đường kinh × trái/phải). */
export type InputData = Record<string, number>

export interface RawRow {
  name: string
  left: number
  right: number
}

export interface MeridianStats {
  max: number
  min: number
  range: number
  mean: number
  sd: number
  upperBound: number
  lowerBound: number
}

export interface ProcessedRow extends RawRow {
  leftSign: string
  rightSign: string
  avg: number
  diff: number
  absDiff: number
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** 6 đường kinh Chi Trên (tay), theo đúng thứ tự bảng gốc. */
export function rawUpper(d: InputData | null | undefined): RawRow[] {
  if (!d) return []
  return [
    { name: 'Tiểu', left: d.tieutruongtrai || 0, right: d.tieutruongphai || 0 },
    { name: 'Tâm', left: d.tamtrai || 0, right: d.tamphai || 0 },
    { name: 'Tam', left: d.tamtieutrai || 0, right: d.tamtieuphai || 0 },
    { name: 'Bào', left: d.tambaotrai || 0, right: d.tambaophai || 0 },
    { name: 'Đại', left: d.daitrangtrai || 0, right: d.daitrangphai || 0 },
    { name: 'Phế', left: d.phetrai || 0, right: d.phephai || 0 },
  ]
}

/** 6 đường kinh Chi Dưới (chân), theo đúng thứ tự bảng gốc. */
export function rawLower(d: InputData | null | undefined): RawRow[] {
  if (!d) return []
  return [
    { name: 'Bàng', left: d.bangquangtrai || 0, right: d.bangquangphai || 0 },
    { name: 'Thận', left: d.thantrai || 0, right: d.thanphai || 0 },
    { name: 'Đởm', left: d.damtrai || 0, right: d.damphai || 0 },
    { name: 'Vị', left: d.vitrai || 0, right: d.viphai || 0 },
    { name: 'Can', left: d.cantrai || 0, right: d.canphai || 0 },
    { name: 'Tỳ', left: d.tytrai || 0, right: d.typhai || 0 },
  ]
}

export function calculateBounds(dataArr: RawRow[]): MeridianStats {
  const allVals = dataArr.flatMap((d) => [d.left, d.right]).filter((v) => v > 0)
  if (!allVals.length) {
    return { max: 0, min: 0, range: 0, mean: 0, sd: 0, upperBound: 0, lowerBound: 0 }
  }

  const maxVal = Math.max(...allVals)
  const minVal = Math.min(...allVals)
  const range = maxVal - minVal

  // Phương pháp Lê Văn Sửu (theo Excel): trị số bình quân = (Max + Min) / 2.
  const midPoint = round2((maxVal + minVal) / 2.0)
  const dungSai = round2(range / 6.0)

  return {
    max: maxVal,
    min: minVal,
    range,
    mean: midPoint,
    sd: dungSai,
    upperBound: round2(midPoint + dungSai),
    lowerBound: round2(midPoint - dungSai),
  }
}

export function getSign(val: number, lower: number, upper: number): string {
  if (val > upper) return '+'
  if (val < lower) return '-'
  return '0'
}

export function processRows(data: RawRow[], stats: MeridianStats): ProcessedRow[] {
  return data.map((item) => {
    const avg = round2((item.left + item.right) / 2)
    const diff = round2(avg - stats.mean)
    const absDiff = round2(Math.abs(item.left - item.right))
    return {
      ...item,
      leftSign: getSign(item.left, stats.lowerBound, stats.upperBound),
      rightSign: getSign(item.right, stats.lowerBound, stats.upperBound),
      avg,
      diff,
      absDiff,
    }
  })
}

const CHANNELS_FULL: Record<string, string> = {
  Tiểu: 'Tiểu Trường',
  Tâm: 'Tâm',
  Tam: 'Tam tiêu',
  Bào: 'Tâm bào',
  Đại: 'Đại Trường',
  Phế: 'Phế',
  Bàng: 'Bàng quang',
  Thận: 'Thận',
  Đởm: 'Đởm',
  Vị: 'Vị',
  Can: 'Can',
  Tỳ: 'Tỳ',
}

function signToInt(sign: string): number {
  if (sign === '+') return 1
  if (sign === '-') return -1
  return 0
}

export interface DiagnosisSummary {
  amDuong: string
  khi: string
  huyet: string
  huThuc: string
}

/** Chẩn đoán Âm/Dương · Khí · Huyết · Hư-Thực từ chỉ số chi trên/chi dưới. */
export function computeDiagnosis(
  d: InputData | null | undefined,
  upperRows: ProcessedRow[],
  lowerRows: ProcessedRow[],
  upperStats: MeridianStats,
  lowerStats: MeridianStats,
): DiagnosisSummary {
  if (!d) return { amDuong: '—', khi: '—', huyet: '—', huThuc: '—' }

  // 2. Khí (dựa trên 6 kinh Chi trên).
  let huTrenCount = 0
  let sumDiffTren = 0
  let allTrenZero = true
  upperRows.forEach((r) => {
    const diff = round2(r.avg - upperStats.mean)
    sumDiffTren += diff
    if (r.avg !== 0) allTrenZero = false
    if (diff < 0) huTrenCount++
  })
  let khi = 'Bình thường'
  if (allTrenZero) {
    khi = ''
  } else if (huTrenCount > 3) {
    khi = 'Khí hư'
  } else if (huTrenCount < 3) {
    khi = 'Khí thịnh'
  } else if (sumDiffTren < 0) {
    khi = 'Khí hư'
  } else if (sumDiffTren > 0) {
    khi = 'Khí thịnh'
  } else {
    khi = ''
  }

  // 3. Huyết (dựa trên 6 kinh Chi dưới).
  let huDuoiCount = 0
  let sumDiffDuoi = 0
  let allDuoiZero = true
  lowerRows.forEach((r) => {
    const diff = round2(r.avg - lowerStats.mean)
    sumDiffDuoi += diff
    if (r.avg !== 0) allDuoiZero = false
    if (diff < 0) huDuoiCount++
  })
  let huyet = 'Bình thường'
  if (allDuoiZero) {
    huyet = ''
  } else if (huDuoiCount > 3) {
    huyet = 'Huyết hư'
  } else if (huDuoiCount < 3) {
    huyet = 'Huyết thịnh'
  } else if (sumDiffDuoi < 0) {
    huyet = 'Huyết hư'
  } else if (sumDiffDuoi > 0) {
    huyet = 'Huyết thịnh'
  } else {
    huyet = ''
  }

  // 4. Hư — Thực (cương độc lập, đo biên độ/diện rộng phản ứng toàn thân — KHÔNG gắn với
  // Khí/Huyết chi trên/chi dưới; xem chú thích đầy đủ ở MeridianResultsView.vue's diagnosis computed).
  let lechCount = 0
  let totalLech = 0
  let tongDoTren = 0
  let tongDoDuoi = 0
  upperRows.forEach((r) => {
    if (r.avg === 0) return
    tongDoTren++
    if (r.avg > upperStats.upperBound || r.avg < upperStats.lowerBound) {
      lechCount++
      totalLech += Math.abs(r.avg - upperStats.mean)
    }
  })
  lowerRows.forEach((r) => {
    if (r.avg === 0) return
    tongDoDuoi++
    if (r.avg > lowerStats.upperBound || r.avg < lowerStats.lowerBound) {
      lechCount++
      totalLech += Math.abs(r.avg - lowerStats.mean)
    }
  })
  const tongDo = tongDoTren + tongDoDuoi
  totalLech = round2(totalLech)
  // Ngưỡng chỉ lấy TRUNG BÌNH dung sai 2 nhóm khi CẢ hai đều có đo; nhóm nào chưa đo (dungSai=0
  // vì calculateBounds không có dữ liệu) thì bỏ qua — tránh kéo ngưỡng xuống còn một nửa oan uổng.
  let avgSd = 0
  if (tongDoTren > 0 && tongDoDuoi > 0) avgSd = (upperStats.sd + lowerStats.sd) / 2
  else if (tongDoTren > 0) avgSd = upperStats.sd
  else if (tongDoDuoi > 0) avgSd = lowerStats.sd
  const nguong = round2(avgSd * tongDo)
  let huThuc = ''
  if (tongDo > 0) {
    if (lechCount === 0) huThuc = 'Bình thường'
    else if (lechCount >= Math.ceil(tongDo / 2) || totalLech >= nguong) huThuc = 'Thực'
    else huThuc = 'Hư'
  }

  // 1. Âm / Dương = TỔNG CƯƠNG — suy từ ma trận Hàn·Nhiệt (tính chất) × Hư·Thực (chính khí),
  //    KHÔNG còn so riêng kinh Đởm. Đếm số kinh nghiêng Nhiệt/Hàn từ phân loại Bát Cương chung.
  const organs = computeAffectedOrgans(upperRows, lowerRows, upperStats, lowerStats)
  const nhietN = organs.filter((o) => o.temp === 'nhiet' || o.temp === 'mixed').length
  const hanN = organs.filter((o) => o.temp === 'han' || o.temp === 'mixed').length
  const bieuN = organs.filter((o) => o.depth === 'bieu' || o.depth === 'mixed').length
  const lyN = organs.filter((o) => o.depth === 'ly' || o.depth === 'mixed').length
  const amDuong = computeTongCuong(nhietN, hanN, bieuN, lyN, huThuc).amDuong

  return { amDuong, khi, huyet, huThuc }
}

/** Loại kết luận tổng cương (để tô màu nhất quán ở UI). */
export type TongCuongLoai =
  | 'duong-thinh'
  | 'am-hu'
  | 'am-thinh'
  | 'duong-hu'
  | 'thien-duong'
  | 'thien-am'
  | 'can-bang'
  | 'unknown'

export interface TongCuong {
  /** Kết luận Âm/Dương: 'Dương thịnh' | 'Âm hư' | 'Âm thịnh' | 'Dương hư' | 'Thiên Dương' | 'Thiên Âm' | 'Âm Dương cân bằng' | ''. */
  amDuong: string
  /** Tính chất chủ đạo: 'Nhiệt' | 'Hàn' | 'Hàn Nhiệt lẫn lộn' | ''. */
  tinhChat: string
  /** Vị trí chủ đạo: 'Biểu' | 'Lý' | 'Biểu Lý' | ''. */
  viTri: string
  /** Chính khí (từ cương Hư-Thực): 'Thực' | 'Hư' | 'Bình thường' | ''. */
  chinhKhi: string
  /** Hội chứng đầy đủ ghép Bát Cương, vd 'Lý Thực Nhiệt'. */
  hoiChung: string
  /** Câu giải thích vì sao ra kết luận (đọc hiểu cho thầy thuốc). */
  reason: string
  loai: TongCuongLoai
}

/**
 * TỔNG CƯƠNG (Âm-Dương) — cương tổng quát của Bát Cương, suy ra từ hai cương thành phần:
 *   • Tính chất  = Hàn / Nhiệt (đếm số kinh nghiêng nóng vs lạnh)
 *   • Chính khí  = Hư / Thực (từ cương Hư-Thực)
 * Ma trận chuẩn Đông Y:
 *   Nhiệt + Thực → Dương thịnh (thực nhiệt) · Nhiệt + Hư → Âm hư (hư nhiệt)
 *   Hàn  + Thực → Âm thịnh  (thực hàn)   · Hàn  + Hư → Dương hư (hư hàn)
 * Chính khí "Bình thường" (bệnh nhẹ, chưa rõ hư/thực) → chỉ nghiêng nhẹ: Thiên Dương / Thiên Âm.
 * Hàn-Nhiệt ngang nhau (thác tạp) hoặc không đủ dữ liệu → Âm Dương cân bằng.
 */
export function computeTongCuong(
  nhietCount: number,
  hanCount: number,
  bieuCount: number,
  lyCount: number,
  huThuc: string,
): TongCuong {
  // Tính chất chủ đạo (Hàn/Nhiệt) theo đa số kinh nghiêng.
  let tinhChat = ''
  if (nhietCount > hanCount) tinhChat = 'Nhiệt'
  else if (hanCount > nhietCount) tinhChat = 'Hàn'
  else if (nhietCount > 0) tinhChat = 'Hàn Nhiệt lẫn lộn'

  // Vị trí chủ đạo (Biểu/Lý) — chỉ để ghép tên hội chứng đầy đủ.
  let viTri = ''
  if (bieuCount > lyCount) viTri = 'Biểu'
  else if (lyCount > bieuCount) viTri = 'Lý'
  else if (bieuCount > 0) viTri = 'Biểu Lý'

  const chinhKhi = huThuc || ''
  const isThuc = chinhKhi === 'Thực'
  const isHu = chinhKhi === 'Hư'
  const nhiet = tinhChat === 'Nhiệt'
  const han = tinhChat === 'Hàn'

  let amDuong = ''
  let loai: TongCuongLoai = 'unknown'
  if (nhiet && isThuc) {
    amDuong = 'Dương thịnh'
    loai = 'duong-thinh'
  } else if (nhiet && isHu) {
    amDuong = 'Âm hư'
    loai = 'am-hu'
  } else if (han && isThuc) {
    amDuong = 'Âm thịnh'
    loai = 'am-thinh'
  } else if (han && isHu) {
    amDuong = 'Dương hư'
    loai = 'duong-hu'
  } else if (nhiet) {
    amDuong = 'Thiên Dương'
    loai = 'thien-duong'
  } else if (han) {
    amDuong = 'Thiên Âm'
    loai = 'thien-am'
  } else if (tinhChat || chinhKhi) {
    amDuong = 'Âm Dương cân bằng'
    loai = 'can-bang'
  }

  // Hội chứng đầy đủ: [Vị trí] [Chính khí] [Tính chất] (bỏ phần thiếu dữ liệu).
  const hc: string[] = []
  if (viTri) hc.push(viTri)
  if (isThuc) hc.push('Thực')
  else if (isHu) hc.push('Hư')
  if (tinhChat === 'Nhiệt') hc.push('Nhiệt')
  else if (tinhChat === 'Hàn') hc.push('Hàn')
  else if (tinhChat === 'Hàn Nhiệt lẫn lộn') hc.push('Hàn Nhiệt thác tạp')
  const hoiChung = hc.join(' ')

  // Câu giải thích.
  let reason = ''
  if (!amDuong) {
    reason = 'Chưa đủ dữ liệu Hàn-Nhiệt / Hư-Thực để kết luận Âm-Dương.'
  } else {
    const tcTxt =
      tinhChat === 'Nhiệt'
        ? `thiên Nhiệt (${nhietCount} kinh nhiệt / ${hanCount} kinh hàn)`
        : tinhChat === 'Hàn'
          ? `thiên Hàn (${hanCount} kinh hàn / ${nhietCount} kinh nhiệt)`
          : tinhChat === 'Hàn Nhiệt lẫn lộn'
            ? `Hàn-Nhiệt lẫn lộn (${hanCount} hàn / ${nhietCount} nhiệt)`
            : 'chưa rõ tính chất'
    const ckTxt = isThuc
      ? 'chính khí còn Thực'
      : isHu
        ? 'chính khí đã Hư'
        : chinhKhi === 'Bình thường'
          ? 'chính khí bình thường'
          : 'chưa rõ chính khí'
    reason = `Bệnh ${tcTxt}, ${ckTxt} → ${amDuong}.`
  }

  return { amDuong, tinhChat, viTri, chinhKhi, hoiChung, reason, loai }
}

/**
 * Ánh xạ kết quả Bát Cương TÍNH TOÁN (từ số đo) → nhãn "Tính chất" (bát cương · chính khí) đã có
 * sẵn trong taxonomy "Tổn Thương — Tác Nhân" (8 giá trị cố định, xem
 * backend/src/controllers/ton-thuong-tac-nhan.controller.ts's CHUAN_TON_THUONG nhóm 'tinh' /
 * frontend/src/constants/tonThuong.ts). Dùng để tra Pháp Trị/Bài Thuốc/Phương Huyệt đã gắn nhãn
 * phù hợp — xem GET /phap-tri/goi-y-bat-cuong.
 *
 * CỐ Ý KHÔNG map (tránh suy diễn ngoài dữ liệu thật):
 *   - Dương thịnh / Âm thịnh: taxonomy không có "Dương Thịnh"/"Âm Thịnh" — ý này đã có trong tag
 *     "Thực" chung (qua chinhKhi) nên không lặp lại bằng 1 tag Âm/Dương méo nghĩa.
 *   - Khí thịnh / Huyết thịnh: không có nhãn "…Thịnh" tương ứng trong taxonomy.
 *   - Tân Dịch Khuy: app không đo/tính khái niệm tân dịch — không có tín hiệu để suy ra, để trống.
 */
export function mapTongCuongToTinhChat(tongCuong: TongCuong, khi: string, huyet: string): string[] {
  const tags = new Set<string>()
  if (tongCuong.loai === 'am-hu') tags.add('Âm Hư')
  if (tongCuong.loai === 'duong-hu') tags.add('Dương Hư')
  if (tongCuong.chinhKhi === 'Thực') tags.add('Thực')
  if (tongCuong.chinhKhi === 'Hư') tags.add('Hư')
  if (khi === 'Khí hư') tags.add('Khí Hư')
  if (huyet === 'Huyết hư') tags.add('Huyết Hư')
  if (khi === 'Khí hư' && huyet === 'Huyết hư') tags.add('Khí Huyết')
  return [...tags]
}

export interface BatCuongSummary {
  hanBieu: string
  hanLy: string
  nhietBieu: string
  nhietLy: string
}

function groupingV2(
  lyNhiet: string[],
  bieuNhiet: string[],
  lyHan: string[],
  bieuHan: string[],
  tenKinh: string,
  dauC8: number,
  dauC10: number,
  dauC11: number,
  c10: number,
  saiSo: number,
): void {
  const sum = dauC8 + dauC10 + dauC11

  if (sum === -3 && Math.abs(c10) > saiSo) {
    lyHan.push(tenKinh)
  } else if (sum === 3 && Math.abs(c10) > saiSo) {
    lyNhiet.push(tenKinh)
  } else if (sum === 2) {
    const side = dauC8 !== 0 ? ' trái' : ' phải'
    bieuNhiet.push(tenKinh + side)
  } else if (sum === -2) {
    const side = dauC8 !== 0 ? ' trái' : ' phải'
    bieuHan.push(tenKinh + side)
  } else if (sum === 1) {
    const side = dauC8 === dauC10 ? ' trái' : ' phải'
    bieuNhiet.push(tenKinh + side)
  } else if (sum === -1) {
    const side = dauC8 === dauC10 ? ' trái' : ' phải'
    bieuHan.push(tenKinh + side)
  } else if (dauC8 + dauC11 === 0 && dauC10 === 0) {
    bieuHan.push(dauC8 === -1 ? tenKinh + ' trái' : tenKinh + ' phải')
    bieuNhiet.push(dauC8 === 1 ? tenKinh + ' trái' : tenKinh + ' phải')
  } else if (dauC8 + dauC11 === 1) {
    const side = dauC8 === 1 ? ' trái' : ' phải'
    bieuNhiet.push(tenKinh + side)
  } else if (dauC8 + dauC11 === -1) {
    const side = dauC8 === -1 ? ' trái' : ' phải'
    bieuHan.push(tenKinh + side)
  }
}

/** Tiểu kết Bát Cương (Lý/Biểu × Hàn/Nhiệt) từ chỉ số chi trên/chi dưới. */
export function computeBatCuong(
  upperRows: ProcessedRow[],
  lowerRows: ProcessedRow[],
  upperStats: MeridianStats,
  lowerStats: MeridianStats,
): BatCuongSummary {
  const lyNhiet: string[] = []
  const bieuNhiet: string[] = []
  const lyHan: string[] = []
  const bieuHan: string[] = []

  const process = (row: ProcessedRow, saiSo: number) => {
    const tenKinh = CHANNELS_FULL[row.name]
    if (!tenKinh) return
    const dauC8 = signToInt(row.leftSign)
    const dauC10 = signToInt(row.diff > 0 ? '+' : row.diff < 0 ? '-' : '0')
    const dauC11 = signToInt(row.rightSign)
    groupingV2(lyNhiet, bieuNhiet, lyHan, bieuHan, tenKinh, dauC8, dauC10, dauC11, row.diff, saiSo)
  }

  upperRows.forEach((row) => process(row, upperStats.sd))
  lowerRows.forEach((row) => process(row, lowerStats.sd))

  return {
    hanBieu: bieuHan.join(', '),
    hanLy: lyHan.join(', '),
    nhietBieu: bieuNhiet.join(', '),
    nhietLy: lyNhiet.join(', '),
  }
}

/** Một tạng phủ đã phân loại Bát Cương (kèm mã kinh để soi bảng đo). */
export interface BcOrgan {
  name: string // mã kinh (row.name)
  label: string // tên đầy đủ + bên (vd "Tâm trái")
  organ: string // tên tạng phủ (khớp CHANNELS_FULL, vd "Tâm")
  side: string // "trái" | "phải" | "" | "trái/phải"
}
/** Tạng phủ đang bệnh kèm độ sâu (Biểu/Lý) + tính chất (Hàn/Nhiệt); 'mixed' khi rơi vào nhiều nhóm. */
export interface OrganState extends BcOrgan {
  depth: 'bieu' | 'ly' | 'mixed'
  temp: 'han' | 'nhiet' | 'mixed'
}

/**
 * Danh sách tạng phủ đang bệnh (Biểu/Lý × Hàn/Nhiệt) để VẼ lên hình người 3D (BatCuongFigure3D).
 * GỘP theo tạng: 1 kinh có thể rơi vào >1 nhóm (vừa Hàn vừa Nhiệt do 2 bên) → hợp nhất, đánh dấu 'mixed'.
 * Dùng CHUNG cho trang Kết Quả Đo thật lẫn khối demo trang chủ (một nguồn sự thật).
 */
export function computeAffectedOrgans(
  upperRows: ProcessedRow[],
  lowerRows: ProcessedRow[],
  upperStats: MeridianStats,
  lowerStats: MeridianStats,
): OrganState[] {
  const lyNhiet: string[] = []
  const bieuNhiet: string[] = []
  const lyHan: string[] = []
  const bieuHan: string[] = []
  const itLyNhiet: BcOrgan[] = []
  const itBieuNhiet: BcOrgan[] = []
  const itLyHan: BcOrgan[] = []
  const itBieuHan: BcOrgan[] = []

  const mkOrgan = (rowName: string, organ: string, label: string): BcOrgan => ({
    name: rowName,
    label,
    organ,
    side: label.slice(organ.length).trim(),
  })

  const process = (row: ProcessedRow, saiSo: number) => {
    const tenKinh = CHANNELS_FULL[row.name]
    if (!tenKinh) return
    const dauC8 = signToInt(row.leftSign)
    const dauC10 = signToInt(row.diff > 0 ? '+' : row.diff < 0 ? '-' : '0')
    const dauC11 = signToInt(row.rightSign)
    // Phát hiện nhóm nào "lớn lên" sau khi phân loại → quy về đúng mã kinh của hàng này.
    const n0 = lyNhiet.length
    const n1 = bieuNhiet.length
    const n2 = lyHan.length
    const n3 = bieuHan.length
    groupingV2(lyNhiet, bieuNhiet, lyHan, bieuHan, tenKinh, dauC8, dauC10, dauC11, row.diff, saiSo)
    if (lyNhiet.length > n0) itLyNhiet.push(mkOrgan(row.name, tenKinh, lyNhiet[lyNhiet.length - 1]!))
    if (bieuNhiet.length > n1) itBieuNhiet.push(mkOrgan(row.name, tenKinh, bieuNhiet[bieuNhiet.length - 1]!))
    if (lyHan.length > n2) itLyHan.push(mkOrgan(row.name, tenKinh, lyHan[lyHan.length - 1]!))
    if (bieuHan.length > n3) itBieuHan.push(mkOrgan(row.name, tenKinh, bieuHan[bieuHan.length - 1]!))
  }

  upperRows.forEach((row) => process(row, upperStats.sd))
  lowerRows.forEach((row) => process(row, lowerStats.sd))

  const tag = (list: BcOrgan[], depth: 'bieu' | 'ly', temp: 'han' | 'nhiet'): OrganState[] =>
    list.map((o) => ({ ...o, depth, temp }))
  const all = [
    ...tag(itBieuHan, 'bieu', 'han'),
    ...tag(itLyHan, 'ly', 'han'),
    ...tag(itBieuNhiet, 'bieu', 'nhiet'),
    ...tag(itLyNhiet, 'ly', 'nhiet'),
  ]
  const byOrgan = new Map<string, OrganState>()
  for (const o of all) {
    const ex = byOrgan.get(o.organ)
    if (!ex) {
      byOrgan.set(o.organ, { ...o })
      continue
    }
    if (ex.temp !== o.temp) ex.temp = 'mixed'
    if (ex.depth !== o.depth) ex.depth = 'mixed'
    if (ex.side !== o.side) ex.side = [ex.side, o.side].filter(Boolean).join('/')
  }
  return [...byOrgan.values()]
}

/** Định dạng số kiểu VN: dùng dấu phẩy thập phân. */
export function fmt(val: number, decimals = 2): string {
  return val.toFixed(decimals).replace('.', ',')
}
