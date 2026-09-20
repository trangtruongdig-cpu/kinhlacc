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
  /** Thiếu số đo ở một hoặc cả hai bên (ô nhập bỏ trống) — kết luận của kinh này không đáng tin. */
  thieuDo: boolean
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
    // Ô BỎ TRỐNG về tới đây dưới dạng 0 (form nhập dùng `Number(...) || 0`). Số 0 KHÔNG phải "lạnh
    // nhất" — nó là KHÔNG CÓ SỐ ĐO. calculateBounds đã lọc `v > 0` khi dựng ngưỡng, nên nếu ở đây
    // vẫn chia đôi vô điều kiện thì một ô trống kéo avg của kinh đó xuống một nửa và biến kinh lành
    // thành kinh hàn nặng (đo được: đổi kết luận ~50% số ca, im lặng). Chỉ lấy các bên THỰC CÓ.
    const coDo = [item.left, item.right].filter((v) => v > 0)
    const avg = coDo.length ? round2(coDo.reduce((a, b) => a + b, 0) / coDo.length) : 0
    const thieuDo = coDo.length < 2
    // Thiếu đo cả hai bên thì không có số tương quan; để 0 để các tầng sau (đã lọc avg === 0) bỏ qua.
    const diff = coDo.length ? round2(avg - stats.mean) : 0
    // Chênh lệch trái-phải chỉ có nghĩa khi CÓ ĐỦ hai bên.
    const absDiff = thieuDo ? 0 : round2(Math.abs(item.left - item.right))
    return {
      ...item,
      // Bên không có số đo thì KHÔNG mang dấu — chấm nó thành '-' là dựng ra một chứng hàn không có thật.
      leftSign: item.left > 0 ? getSign(item.left, stats.lowerBound, stats.upperBound) : '0',
      rightSign: item.right > 0 ? getSign(item.right, stats.lowerBound, stats.upperBound) : '0',
      avg,
      diff,
      absDiff,
      thieuDo,
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

/** Kinh đo lệch khỏi khoảng bình thường của NHÓM nó, kèm hướng. */
export interface LechRow {
  /** Mã ngắn như trong bảng đo: 'Tâm', 'Bào', 'Tiểu', 'Bàng'… */
  name: string
  tone: 'high' | 'low'
}

/**
 * Các con số trung gian dẫn tới kết luận — LỘ RA để bảng giải thích không phải tính lại.
 * `huThuc.lechRows` là danh sách kinh lệch: trang Kết Quả Đo dùng để soi đúng kinh trên bảng đo và
 * hình 3D, Section IV dùng làm đầu vào định gốc. Trước 20/09/2026 phần này chỉ tồn tại trong
 * computed `diagnosis` của MeridianResultsView.vue — một bản sao thứ ba của thuật toán, khiến mọi
 * phép kiểm lấy từ lib đều ra rỗng và kết luận sai theo.
 */
export interface DiagnosisExplain {
  khi: { huCount: number; total: number; sum: number; mean: number }
  huyet: { huCount: number; total: number; sum: number; mean: number }
  huThuc: { lechCount: number; tongDo: number; totalLech: number; nguong: number; lechRows: LechRow[] }
}

export interface DiagnosisSummary {
  amDuong: string
  khi: string
  huyet: string
  huThuc: string
  explain: DiagnosisExplain | null
}

/** Chẩn đoán Âm/Dương · Khí · Huyết · Hư-Thực từ chỉ số chi trên/chi dưới. */
export function computeDiagnosis(
  d: InputData | null | undefined,
  upperRows: ProcessedRow[],
  lowerRows: ProcessedRow[],
  upperStats: MeridianStats,
  lowerStats: MeridianStats,
): DiagnosisSummary {
  if (!d) return { amDuong: '—', khi: '—', huyet: '—', huThuc: '—', explain: null }

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
  const lechRows: LechRow[] = []
  upperRows.forEach((r) => {
    if (r.avg === 0) return
    tongDoTren++
    if (r.avg > upperStats.upperBound || r.avg < upperStats.lowerBound) {
      lechCount++
      totalLech += Math.abs(r.avg - upperStats.mean)
      lechRows.push({ name: r.name, tone: r.avg > upperStats.upperBound ? 'high' : 'low' })
    }
  })
  lowerRows.forEach((r) => {
    if (r.avg === 0) return
    tongDoDuoi++
    if (r.avg > lowerStats.upperBound || r.avg < lowerStats.lowerBound) {
      lechCount++
      totalLech += Math.abs(r.avg - lowerStats.mean)
      lechRows.push({ name: r.name, tone: r.avg > lowerStats.upperBound ? 'high' : 'low' })
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

  return {
    amDuong,
    khi,
    huyet,
    huThuc,
    explain: {
      khi: { huCount: huTrenCount, total: upperRows.length, sum: round2(sumDiffTren), mean: round2(upperStats.mean) },
      huyet: { huCount: huDuoiCount, total: lowerRows.length, sum: round2(sumDiffDuoi), mean: round2(lowerStats.mean) },
      huThuc: { lechCount, tongDo, totalLech, nguong, lechRows },
    },
  }
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
/**
 * Bát Cương đầy đủ của MỘT ca đo, dựng thẳng từ 24 số thô.
 *
 * Có hàm này để các mốc LỊCH SỬ trên dải truyền biến được chấm bằng CÙNG một thước với ca đang xem.
 * Trước đây timeline gọi locateLucKinh với Bát Cương = null, nên `batCuongKhop` của mọi mốc lịch sử
 * luôn false và nhánh giai đoạn luôn rơi về mặc định (mọi mốc Thiếu Âm đều thành "hàn hoá", mọi mốc
 * Dương Minh đều thành "Dương Minh nhiệt") — cùng một ca đo bị chấm hai điểm khác nhau tuỳ nó đang
 * là ca đang xem hay chỉ là một mốc trong dải.
 */
export function tongCuongTuInputData(d: InputData | null | undefined): TongCuong | null {
  if (!d) return null
  const ru = rawUpper(d)
  const rl = rawLower(d)
  const su = calculateBounds(ru)
  const sl = calculateBounds(rl)
  if (!su.range && !sl.range) return null // chưa có số đo nào
  const pu = processRows(ru, su)
  const pl = processRows(rl, sl)
  const organs = computeAffectedOrgans(pu, pl, su, sl)
  const nhiet = organs.filter((o) => o.temp === 'nhiet' || o.temp === 'mixed').length
  const han = organs.filter((o) => o.temp === 'han' || o.temp === 'mixed').length
  const bieu = organs.filter((o) => o.depth === 'bieu' || o.depth === 'mixed').length
  const ly = organs.filter((o) => o.depth === 'ly' || o.depth === 'mixed').length
  return computeTongCuong(nhiet, han, bieu, ly, computeDiagnosis(d, pu, pl, su, sl).huThuc)
}

/** Hồ sơ nhiệt của một ca: 12 kinh → trung bình hai bên (°C). Kinh thiếu đo bị bỏ, không để 0. */
export function hoSoNhiet(d: InputData | null | undefined): Record<string, number> | null {
  if (!d) return null
  const out: Record<string, number> = {}
  for (const r of [...rawUpper(d), ...rawLower(d)]) {
    const co = [r.left, r.right].filter((v) => v > 0)
    if (co.length) out[r.name] = round2(co.reduce((a, b) => a + b, 0) / co.length)
  }
  return Object.keys(out).length ? out : null
}

export interface ChinhKhiSo {
  /** Chênh nhiệt trung bình toàn thân giữa hai lần đo (°C). Dương = ấm lên. */
  delta: number
  /** Tổng độ TỤT và tổng độ TĂNG cộng trên các kinh (°C) — thấy được bệnh lan hay rút. */
  tongTut: number
  tongTang: number
  /** Số kinh có đủ số đo ở CẢ HAI lần (mẫu số của mọi con số trên). */
  soKinh: number
  loai: 'phuc' | 'suy' | 'giu' | 'khong-ro'
  nhan: string
  /** Lý do phải đọc con số này dè dặt (nhiệt phòng lệch, quá ít kinh…). Rỗng = không có vướng mắc. */
  canhBao: string
}

/** Dưới ngưỡng này coi như không phân biệt được với nhiễu đo (lấy theo độ tản trái-phải đo được
 *  trên ca thật, ≈0,3 °C — hai bên cùng người cùng lúc lẽ ra phải bằng nhau). */
const NGUONG_CHINH_KHI = 0.3
/** Nhiệt phòng lệch quá mức này thì chênh nhiệt toàn thân phản ánh CĂN PHÒNG, không phải người bệnh. */
const NGUONG_NHIET_PHONG = 1.0

/**
 * Trục CHÍNH KHÍ giữa hai lần đo — độc lập với trục vị trí (nông–sâu) của Lục Kinh.
 *
 * Vì sao cần: mọi ngưỡng của phép đo đều dựng lại từ chính 24 số của lần đo đó, nên toàn bộ kết luận
 * Bát Cương/Lục Kinh BẤT BIẾN khi cả bộ số nhân hay cộng thêm một lượng — người nguội đi 2 °C toàn
 * thân vẫn ra y hệt kết luận cũ. Trục này là chỗ duy nhất nhìn thấy mức tuyệt đối.
 *
 * Cách đo (theo đúng khuyến nghị đã thẩm tra): so bằng °C THÔ, neo vào lần đo trước của CHÍNH bệnh
 * nhân, KHÔNG chia cho dung sai (chia vào là tự xoá tín hiệu, vì dung sai nở cùng nhịp với độ tụt)
 * và KHÔNG khử trôi nền (khử trôi là mù đúng chỗ cần nhìn). Dùng TỔNG ĐỘ, không đếm số kinh — đếm
 * số kinh có công suất ngang tung đồng xu và còn đi ngược chiều khi bệnh nhân hồi phục nhiều.
 */
export function soSanhChinhKhi(
  truoc: InputData | null | undefined,
  sau: InputData | null | undefined,
  nhietPhongTruoc?: number | null,
  nhietPhongSau?: number | null,
): ChinhKhiSo | null {
  const a = hoSoNhiet(truoc)
  const b = hoSoNhiet(sau)
  if (!a || !b) return null
  const chung = Object.keys(a).filter((k) => k in b)
  if (chung.length < 6) return null // quá ít kinh đối chiếu được thì không kết luận

  let tut = 0
  let tang = 0
  for (const k of chung) {
    const d = b[k]! - a[k]!
    if (d < 0) tut += -d
    else tang += d
  }
  const delta = round2((tang - tut) / chung.length)

  const canh: string[] = []
  if (nhietPhongTruoc != null && nhietPhongSau != null) {
    const dPhong = Math.abs(nhietPhongSau - nhietPhongTruoc)
    if (dPhong >= NGUONG_NHIET_PHONG) {
      canh.push(
        `nhiệt độ phòng hai lần đo lệch ${String(round2(dPhong)).replace('.', ',')} °C — chênh nhiệt toàn thân có thể là của CĂN PHÒNG, không phải của người bệnh`,
      )
    }
  } else {
    canh.push('thiếu nhiệt độ phòng của một trong hai lần đo — chưa loại trừ được trôi nền')
  }
  if (chung.length < 12) canh.push(`chỉ ${chung.length}/12 kinh đối chiếu được`)

  // Số thập phân kiểu Việt: dấu PHẨY, không phải dấu chấm.
  const soVN = (n: number) => String(round2(n)).replace('.', ',')

  let loai: ChinhKhiSo['loai']
  let nhan: string
  if (Math.abs(delta) < NGUONG_CHINH_KHI) {
    loai = 'giu'
    nhan = `giữ mức (chênh ${delta >= 0 ? '+' : '−'}${soVN(Math.abs(delta))} °C, dưới ngưỡng nhiễu đo)`
  } else if (delta > 0) {
    loai = 'phuc'
    nhan = `ấm lên ${soVN(delta)} °C toàn thân — đang phục`
  } else {
    loai = 'suy'
    nhan = `nguội đi ${soVN(-delta)} °C toàn thân — chưa phục`
  }
  if (canh.length) loai = loai === 'giu' ? 'khong-ro' : loai

  return { delta, tongTut: round2(tut), tongTang: round2(tang), soKinh: chung.length, loai, nhan, canhBao: canh.join('; ') }
}

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
  // ── HẠNG THỨ BA của sách (trước đây thiếu hẳn) ──────────────────────────────────────────────
  // "Các kinh không thuộc biểu và lý — đây là các kinh có nhiệt độ bên trái và phải ĐỀU KHÔNG MANG
  // DẤU. Các kinh này KHÔNG CÓ BỆNH LÝ, biến đổi nhiệt của kinh nằm trong phạm vi biến đổi sinh lý
  // cho phép." (Lê Văn Sửu, phân định hàn/nhiệt/biểu/lý — mục c.)
  // Phải xét TRƯỚC mọi nhánh khác: khi hai bên đều không mang dấu, tổng ba dấu chỉ còn lại dấu của
  // số tương quan — mà số tương quan hầu như không bao giờ đúng bằng 0 (nhiệt độ có số lẻ 0,1) — nên
  // kinh lành luôn bị tổng ±1 đẩy vào nhóm Biểu. Đó là vì sao bảng tạng phủ trước đây LUÔN đủ 12/12.
  if (dauC8 === 0 && dauC11 === 0) return

  // Sách còn một cửa nữa cho BIỂU — *"được xem là bệnh lý khi giá trị tuyệt đối của số tương quan TỪ
  // GẦN BẰNG cho đến lớn hơn sai số giới hạn"* — nhưng KHÔNG cài được: cụm "gần bằng" không định
  // lượng, và trong chính ví dụ có lời giải của sách (Lê Quang T.), kinh Tâm có số tương quan 0,1
  // trên sai số 0,2 (một nửa) vẫn được xếp Biểu nhiệt. Áp ngưỡng cứng |số tương quan| ≥ sai số thì
  // loại nhầm Tâm, Thận, Đởm — cả ba sách đều xếp là bệnh lý. Để nguyên cho tới khi có ngưỡng thật.
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

// ═══════════════════════════════════════════════════════════════════════════
// Z NGŨ HÀNH — chỉ số lệch của mỗi hành, gộp từ tạng (0,6) và phủ (0,4).
// Rút về lib 20/09/2026: trước đó phép này nằm trong MeridianResultsView.vue nên mọi nơi khác
// (so hai lần đo, script kiểm) phải chép lại — đúng lối đã sinh ra bản sao lechRows.
// ═══════════════════════════════════════════════════════════════════════════

export interface NguHanhZ {
  hoa: number | null
  tho: number | null
  kim: number | null
  thuy: number | null
  moc: number | null
}

/** z của MỘT kinh trong nhóm của nó. null = thiếu đo (0 KHÔNG phải "lạnh nhất"). */
function zKinh(rows: ProcessedRow[], stats: MeridianStats, name: string): number | null {
  const row = rows.find((r) => r.name === name)
  if (!row || !(row.avg > 0)) return null
  if (!(stats.sd > 1e-6)) return 0 // thiếu phân tán → đứng ở mốc, không kết luận hư/thực
  return (row.avg - stats.mean) / stats.sd
}

/** Gộp z của tạng (trọng số 0,6) và phủ (0,4); nhóm nào thiếu đo thì bỏ, không kéo kết quả. */
function gopHanh(
  tangNames: string[],
  phuNames: string[],
  rows: ProcessedRow[],
  stats: MeridianStats,
): number | null {
  const tb = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  const tangZ = tangNames.map((n) => zKinh(rows, stats, n)).filter((v): v is number => v != null)
  const phuZ = phuNames.map((n) => zKinh(rows, stats, n)).filter((v): v is number => v != null)
  const parts: { v: number; w: number }[] = []
  if (tangZ.length) parts.push({ v: tb(tangZ), w: 0.6 })
  if (phuZ.length) parts.push({ v: tb(phuZ), w: 0.4 })
  if (!parts.length) return null
  return parts.reduce((s, p) => s + p.v * p.w, 0) / parts.reduce((s, p) => s + p.w, 0)
}

/** z của 5 hành. Hoả gộp cả Quân Hoả (Tâm/Tiểu trường) và Tướng Hoả (Tâm bào/Tam tiêu). */
export function nguHanhZTuRows(
  upperRows: ProcessedRow[],
  lowerRows: ProcessedRow[],
  upperStats: MeridianStats,
  lowerStats: MeridianStats,
): NguHanhZ {
  return {
    hoa: gopHanh(['Tâm', 'Bào'], ['Tiểu', 'Tam'], upperRows, upperStats),
    kim: gopHanh(['Phế'], ['Đại'], upperRows, upperStats),
    tho: gopHanh(['Tỳ'], ['Vị'], lowerRows, lowerStats),
    thuy: gopHanh(['Thận'], ['Bàng'], lowerRows, lowerStats),
    moc: gopHanh(['Can'], ['Đởm'], lowerRows, lowerStats),
  }
}

/** Tiện dụng: z ngũ hành thẳng từ 24 số thô (dùng khi so hai lần đo). */
export function nguHanhZTuInputData(d: InputData | null | undefined): NguHanhZ | null {
  if (!d) return null
  const u0 = rawUpper(d)
  const l0 = rawLower(d)
  if (!u0.length || !l0.length) return null
  const uB = calculateBounds(u0)
  const lB = calculateBounds(l0)
  return nguHanhZTuRows(processRows(u0, uB), processRows(l0, lB), uB, lB)
}

/** Tiện dụng: chẩn đoán Bát Cương (kèm explain/lechRows) thẳng từ 24 số thô. */
export function diagnosisTuInputData(d: InputData | null | undefined): DiagnosisSummary | null {
  if (!d) return null
  const u0 = rawUpper(d)
  const l0 = rawLower(d)
  if (!u0.length || !l0.length) return null
  const uB = calculateBounds(u0)
  const lB = calculateBounds(l0)
  return computeDiagnosis(d, processRows(u0, uB), processRows(l0, lB), uB, lB)
}
