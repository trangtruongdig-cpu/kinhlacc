/**
 * meridian-analysis.util.ts — PORT NGUYÊN VĂN từ frontend/src/lib/meridianAnalysis.ts.
 *
 * Lý do tồn tại: trang kết quả khám (MeridianResultsView.vue) KHÔNG dùng Âm-Dương/Khí/Huyết/Hư-Thực
 * mà MeridiansService.analyze() trả về — nó tự tính lại ở client bằng đúng các hàm này (xem comment
 * ở meridian.controller.ts quanh dòng 662: "nền thống kê backend (midpoint/dungSai) khác frontend
 * (mean/sd) nên kết luận có thể lệch nhẹ so với màn hình — màn hình luôn tính lại"). Để bảng thống kê
 * tổng hợp (PatientsService.thongKe()) khớp TUYỆT ĐỐI với những gì thầy thuốc thấy trên từng ca đo, phải
 * dùng ĐÚNG bộ hàm frontend này, không phải MeridiansService.analyze().
 *
 * ĐỔI GÌ Ở frontend/src/lib/meridianAnalysis.ts THÌ ĐỔI THEO Ở ĐÂY — không viết lại thuật toán.
 */

/** Dữ liệu đo thô: 24 chỉ số (12 đường kinh × trái/phải). */
export type InputData = Record<string, number>;

export interface RawRow {
  name: string;
  left: number;
  right: number;
}

export interface MeridianStats {
  max: number;
  min: number;
  range: number;
  mean: number;
  sd: number;
  upperBound: number;
  lowerBound: number;
}

export interface ProcessedRow extends RawRow {
  leftSign: string;
  rightSign: string;
  avg: number;
  diff: number;
  absDiff: number;
  /** Thiếu số đo ở một hoặc cả hai bên (ô nhập bỏ trống) — kết luận của kinh này không đáng tin. */
  thieuDo: boolean;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** 6 đường kinh Chi Trên (tay), theo đúng thứ tự bảng gốc. */
export function rawUpper(d: InputData | null | undefined): RawRow[] {
  if (!d) return [];
  return [
    { name: 'Tiểu', left: d.tieutruongtrai || 0, right: d.tieutruongphai || 0 },
    { name: 'Tâm', left: d.tamtrai || 0, right: d.tamphai || 0 },
    { name: 'Tam', left: d.tamtieutrai || 0, right: d.tamtieuphai || 0 },
    { name: 'Bào', left: d.tambaotrai || 0, right: d.tambaophai || 0 },
    { name: 'Đại', left: d.daitrangtrai || 0, right: d.daitrangphai || 0 },
    { name: 'Phế', left: d.phetrai || 0, right: d.phephai || 0 },
  ];
}

/** 6 đường kinh Chi Dưới (chân), theo đúng thứ tự bảng gốc. */
export function rawLower(d: InputData | null | undefined): RawRow[] {
  if (!d) return [];
  return [
    { name: 'Bàng', left: d.bangquangtrai || 0, right: d.bangquangphai || 0 },
    { name: 'Thận', left: d.thantrai || 0, right: d.thanphai || 0 },
    { name: 'Đởm', left: d.damtrai || 0, right: d.damphai || 0 },
    { name: 'Vị', left: d.vitrai || 0, right: d.viphai || 0 },
    { name: 'Can', left: d.cantrai || 0, right: d.canphai || 0 },
    { name: 'Tỳ', left: d.tytrai || 0, right: d.typhai || 0 },
  ];
}

export function calculateBounds(dataArr: RawRow[]): MeridianStats {
  const allVals = dataArr.flatMap((d) => [d.left, d.right]).filter((v) => v > 0);
  if (!allVals.length) {
    return { max: 0, min: 0, range: 0, mean: 0, sd: 0, upperBound: 0, lowerBound: 0 };
  }

  const maxVal = Math.max(...allVals);
  const minVal = Math.min(...allVals);
  const range = maxVal - minVal;

  // Phương pháp Lê Văn Sửu (theo Excel): trị số bình quân = (Max + Min) / 2.
  const midPoint = round2((maxVal + minVal) / 2.0);
  const dungSai = round2(range / 6.0);

  return {
    max: maxVal,
    min: minVal,
    range,
    mean: midPoint,
    sd: dungSai,
    upperBound: round2(midPoint + dungSai),
    lowerBound: round2(midPoint - dungSai),
  };
}

export function getSign(val: number, lower: number, upper: number): string {
  if (val > upper) return '+';
  if (val < lower) return '-';
  return '0';
}

export function processRows(data: RawRow[], stats: MeridianStats): ProcessedRow[] {
  return data.map((item) => {
    // Ô BỎ TRỐNG về tới đây dưới dạng 0 (form nhập dùng `Number(...) || 0`). Số 0 KHÔNG phải "lạnh
    // nhất" — nó là KHÔNG CÓ SỐ ĐO. calculateBounds đã lọc `v > 0` khi dựng ngưỡng, nên nếu ở đây
    // vẫn chia đôi vô điều kiện thì một ô trống kéo avg của kinh đó xuống một nửa và biến kinh lành
    // thành kinh hàn nặng (đo được: đổi kết luận ~50% số ca, im lặng). Chỉ lấy các bên THỰC CÓ.
    const coDo = [item.left, item.right].filter((v) => v > 0);
    const avg = coDo.length ? round2(coDo.reduce((a, b) => a + b, 0) / coDo.length) : 0;
    const thieuDo = coDo.length < 2;
    const diff = coDo.length ? round2(avg - stats.mean) : 0;
    const absDiff = thieuDo ? 0 : round2(Math.abs(item.left - item.right));
    return {
      ...item,
      // Bên không có số đo thì KHÔNG mang dấu — chấm nó thành '-' là dựng ra một chứng hàn không có thật.
      leftSign: item.left > 0 ? getSign(item.left, stats.lowerBound, stats.upperBound) : '0',
      rightSign: item.right > 0 ? getSign(item.right, stats.lowerBound, stats.upperBound) : '0',
      avg,
      diff,
      absDiff,
      thieuDo,
    };
  });
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
};

function signToInt(sign: string): number {
  if (sign === '+') return 1;
  if (sign === '-') return -1;
  return 0;
}

export interface DiagnosisSummary {
  amDuong: string;
  khi: string;
  huyet: string;
  huThuc: string;
}

/** Chẩn đoán Âm/Dương · Khí · Huyết · Hư-Thực từ chỉ số chi trên/chi dưới. */
/**
 * ĐỒNG BỘ VỚI FRONTEND: bản ở frontend/src/lib/meridianAnalysis.ts từ 20/09/2026 còn trả thêm
 * `explain` (các số trung gian + `lechRows` — danh sách kinh đo lệch kèm hướng). Bản này giữ nguyên
 * kết luận, chưa cần explain; nếu backend cần tới thì chép nguyên phần thu lechRows của bản kia,
 * đừng tự nghĩ lại luật — hai bản phải cho cùng một kết luận trên cùng bộ số.
 */
export function computeDiagnosis(
  d: InputData | null | undefined,
  upperRows: ProcessedRow[],
  lowerRows: ProcessedRow[],
  upperStats: MeridianStats,
  lowerStats: MeridianStats,
): DiagnosisSummary {
  if (!d) return { amDuong: '—', khi: '—', huyet: '—', huThuc: '—' };

  // 2. Khí (dựa trên 6 kinh Chi trên).
  let huTrenCount = 0;
  let sumDiffTren = 0;
  let allTrenZero = true;
  upperRows.forEach((r) => {
    const diff = round2(r.avg - upperStats.mean);
    sumDiffTren += diff;
    if (r.avg !== 0) allTrenZero = false;
    if (diff < 0) huTrenCount++;
  });
  let khi = 'Bình thường';
  if (allTrenZero) {
    khi = '';
  } else if (huTrenCount > 3) {
    khi = 'Khí hư';
  } else if (huTrenCount < 3) {
    khi = 'Khí thịnh';
  } else if (sumDiffTren < 0) {
    khi = 'Khí hư';
  } else if (sumDiffTren > 0) {
    khi = 'Khí thịnh';
  } else {
    khi = '';
  }

  // 3. Huyết (dựa trên 6 kinh Chi dưới).
  let huDuoiCount = 0;
  let sumDiffDuoi = 0;
  let allDuoiZero = true;
  lowerRows.forEach((r) => {
    const diff = round2(r.avg - lowerStats.mean);
    sumDiffDuoi += diff;
    if (r.avg !== 0) allDuoiZero = false;
    if (diff < 0) huDuoiCount++;
  });
  let huyet = 'Bình thường';
  if (allDuoiZero) {
    huyet = '';
  } else if (huDuoiCount > 3) {
    huyet = 'Huyết hư';
  } else if (huDuoiCount < 3) {
    huyet = 'Huyết thịnh';
  } else if (sumDiffDuoi < 0) {
    huyet = 'Huyết hư';
  } else if (sumDiffDuoi > 0) {
    huyet = 'Huyết thịnh';
  } else {
    huyet = '';
  }

  // 4. Hư — Thực (cương độc lập, đo biên độ/diện rộng phản ứng toàn thân — KHÔNG gắn với
  // Khí/Huyết chi trên/chi dưới; xem chú thích đầy đủ ở MeridianResultsView.vue's diagnosis computed).
  let lechCount = 0;
  let totalLech = 0;
  let tongDoTren = 0;
  let tongDoDuoi = 0;
  upperRows.forEach((r) => {
    if (r.avg === 0) return;
    tongDoTren++;
    if (r.avg > upperStats.upperBound || r.avg < upperStats.lowerBound) {
      lechCount++;
      totalLech += Math.abs(r.avg - upperStats.mean);
    }
  });
  lowerRows.forEach((r) => {
    if (r.avg === 0) return;
    tongDoDuoi++;
    if (r.avg > lowerStats.upperBound || r.avg < lowerStats.lowerBound) {
      lechCount++;
      totalLech += Math.abs(r.avg - lowerStats.mean);
    }
  });
  const tongDo = tongDoTren + tongDoDuoi;
  totalLech = round2(totalLech);
  // Ngưỡng chỉ lấy TRUNG BÌNH dung sai 2 nhóm khi CẢ hai đều có đo; nhóm nào chưa đo (dungSai=0
  // vì calculateBounds không có dữ liệu) thì bỏ qua — tránh kéo ngưỡng xuống còn một nửa oan uổng.
  let avgSd = 0;
  if (tongDoTren > 0 && tongDoDuoi > 0) avgSd = (upperStats.sd + lowerStats.sd) / 2;
  else if (tongDoTren > 0) avgSd = upperStats.sd;
  else if (tongDoDuoi > 0) avgSd = lowerStats.sd;
  const nguong = round2(avgSd * tongDo);
  let huThuc = '';
  if (tongDo > 0) {
    if (lechCount === 0) huThuc = 'Bình thường';
    else if (lechCount >= Math.ceil(tongDo / 2) || totalLech >= nguong) huThuc = 'Thực';
    else huThuc = 'Hư';
  }

  // 1. Âm / Dương = TỔNG CƯƠNG — suy từ ma trận Hàn·Nhiệt (tính chất) × Hư·Thực (chính khí),
  //    KHÔNG còn so riêng kinh Đởm. Đếm số kinh nghiêng Nhiệt/Hàn từ phân loại Bát Cương chung.
  const organs = computeAffectedOrgans(upperRows, lowerRows, upperStats, lowerStats);
  const nhietN = organs.filter((o) => o.temp === 'nhiet' || o.temp === 'mixed').length;
  const hanN = organs.filter((o) => o.temp === 'han' || o.temp === 'mixed').length;
  const bieuN = organs.filter((o) => o.depth === 'bieu' || o.depth === 'mixed').length;
  const lyN = organs.filter((o) => o.depth === 'ly' || o.depth === 'mixed').length;
  const amDuong = computeTongCuong(nhietN, hanN, bieuN, lyN, huThuc).amDuong;

  return { amDuong, khi, huyet, huThuc };
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
  | 'unknown';

export interface TongCuong {
  amDuong: string;
  tinhChat: string;
  viTri: string;
  chinhKhi: string;
  hoiChung: string;
  reason: string;
  loai: TongCuongLoai;
}

/**
 * TỔNG CƯƠNG (Âm-Dương) — cương tổng quát của Bát Cương, suy ra từ hai cương thành phần:
 *   • Tính chất  = Hàn / Nhiệt (đếm số kinh nghiêng nóng vs lạnh)
 *   • Chính khí  = Hư / Thực (từ cương Hư-Thực)
 */
export function computeTongCuong(
  nhietCount: number,
  hanCount: number,
  bieuCount: number,
  lyCount: number,
  huThuc: string,
): TongCuong {
  let tinhChat = '';
  if (nhietCount > hanCount) tinhChat = 'Nhiệt';
  else if (hanCount > nhietCount) tinhChat = 'Hàn';
  else if (nhietCount > 0) tinhChat = 'Hàn Nhiệt lẫn lộn';

  let viTri = '';
  if (bieuCount > lyCount) viTri = 'Biểu';
  else if (lyCount > bieuCount) viTri = 'Lý';
  else if (bieuCount > 0) viTri = 'Biểu Lý';

  const chinhKhi = huThuc || '';
  const isThuc = chinhKhi === 'Thực';
  const isHu = chinhKhi === 'Hư';
  const nhiet = tinhChat === 'Nhiệt';
  const han = tinhChat === 'Hàn';

  let amDuong = '';
  let loai: TongCuongLoai = 'unknown';
  if (nhiet && isThuc) {
    amDuong = 'Dương thịnh';
    loai = 'duong-thinh';
  } else if (nhiet && isHu) {
    amDuong = 'Âm hư';
    loai = 'am-hu';
  } else if (han && isThuc) {
    amDuong = 'Âm thịnh';
    loai = 'am-thinh';
  } else if (han && isHu) {
    amDuong = 'Dương hư';
    loai = 'duong-hu';
  } else if (nhiet) {
    amDuong = 'Thiên Dương';
    loai = 'thien-duong';
  } else if (han) {
    amDuong = 'Thiên Âm';
    loai = 'thien-am';
  } else if (tinhChat || chinhKhi) {
    amDuong = 'Âm Dương cân bằng';
    loai = 'can-bang';
  }

  const hc: string[] = [];
  if (viTri) hc.push(viTri);
  if (isThuc) hc.push('Thực');
  else if (isHu) hc.push('Hư');
  if (tinhChat === 'Nhiệt') hc.push('Nhiệt');
  else if (tinhChat === 'Hàn') hc.push('Hàn');
  else if (tinhChat === 'Hàn Nhiệt lẫn lộn') hc.push('Hàn Nhiệt thác tạp');
  const hoiChung = hc.join(' ');

  let reason = '';
  if (!amDuong) {
    reason = 'Chưa đủ dữ liệu Hàn-Nhiệt / Hư-Thực để kết luận Âm-Dương.';
  } else {
    const tcTxt =
      tinhChat === 'Nhiệt'
        ? `thiên Nhiệt (${nhietCount} kinh nhiệt / ${hanCount} kinh hàn)`
        : tinhChat === 'Hàn'
          ? `thiên Hàn (${hanCount} kinh hàn / ${nhietCount} kinh nhiệt)`
          : tinhChat === 'Hàn Nhiệt lẫn lộn'
            ? `Hàn-Nhiệt lẫn lộn (${hanCount} hàn / ${nhietCount} nhiệt)`
            : 'chưa rõ tính chất';
    const ckTxt = isThuc
      ? 'chính khí còn Thực'
      : isHu
        ? 'chính khí đã Hư'
        : chinhKhi === 'Bình thường'
          ? 'chính khí bình thường'
          : 'chưa rõ chính khí';
    reason = `Bệnh ${tcTxt}, ${ckTxt} → ${amDuong}.`;
  }

  return { amDuong, tinhChat, viTri, chinhKhi, hoiChung, reason, loai };
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
  if (dauC8 === 0 && dauC11 === 0) return;

  // Sách còn một cửa nữa cho BIỂU (|số tương quan| "từ gần bằng cho đến lớn hơn" sai số giới hạn)
  // nhưng KHÔNG cài được: cụm "gần bằng" không định lượng, và trong chính ví dụ có lời giải của sách
  // (Lê Quang T.) kinh Tâm có số tương quan 0,1 trên sai số 0,2 vẫn được xếp Biểu nhiệt.
  const sum = dauC8 + dauC10 + dauC11;

  if (sum === -3 && Math.abs(c10) > saiSo) {
    lyHan.push(tenKinh);
  } else if (sum === 3 && Math.abs(c10) > saiSo) {
    lyNhiet.push(tenKinh);
  } else if (sum === 2) {
    const side = dauC8 !== 0 ? ' trái' : ' phải';
    bieuNhiet.push(tenKinh + side);
  } else if (sum === -2) {
    const side = dauC8 !== 0 ? ' trái' : ' phải';
    bieuHan.push(tenKinh + side);
  } else if (sum === 1) {
    const side = dauC8 === dauC10 ? ' trái' : ' phải';
    bieuNhiet.push(tenKinh + side);
  } else if (sum === -1) {
    const side = dauC8 === dauC10 ? ' trái' : ' phải';
    bieuHan.push(tenKinh + side);
  } else if (dauC8 + dauC11 === 0 && dauC10 === 0) {
    bieuHan.push(dauC8 === -1 ? tenKinh + ' trái' : tenKinh + ' phải');
    bieuNhiet.push(dauC8 === 1 ? tenKinh + ' trái' : tenKinh + ' phải');
  } else if (dauC8 + dauC11 === 1) {
    const side = dauC8 === 1 ? ' trái' : ' phải';
    bieuNhiet.push(tenKinh + side);
  } else if (dauC8 + dauC11 === -1) {
    const side = dauC8 === -1 ? ' trái' : ' phải';
    bieuHan.push(tenKinh + side);
  }
}

/** Một tạng phủ đã phân loại Bát Cương (kèm mã kinh để soi bảng đo). */
export interface BcOrgan {
  name: string;
  label: string;
  organ: string;
  side: string;
}
/** Tạng phủ đang bệnh kèm độ sâu (Biểu/Lý) + tính chất (Hàn/Nhiệt); 'mixed' khi rơi vào nhiều nhóm. */
export interface OrganState extends BcOrgan {
  depth: 'bieu' | 'ly' | 'mixed';
  temp: 'han' | 'nhiet' | 'mixed';
}

/** Danh sách tạng phủ đang bệnh (Biểu/Lý × Hàn/Nhiệt) — GỘP theo tạng (1 kinh có thể rơi vào >1
 * nhóm do 2 bên → hợp nhất, đánh dấu 'mixed'). */
export function computeAffectedOrgans(
  upperRows: ProcessedRow[],
  lowerRows: ProcessedRow[],
  upperStats: MeridianStats,
  lowerStats: MeridianStats,
): OrganState[] {
  const lyNhiet: string[] = [];
  const bieuNhiet: string[] = [];
  const lyHan: string[] = [];
  const bieuHan: string[] = [];
  const itLyNhiet: BcOrgan[] = [];
  const itBieuNhiet: BcOrgan[] = [];
  const itLyHan: BcOrgan[] = [];
  const itBieuHan: BcOrgan[] = [];

  const mkOrgan = (rowName: string, organ: string, label: string): BcOrgan => ({
    name: rowName,
    label,
    organ,
    side: label.slice(organ.length).trim(),
  });

  const process = (row: ProcessedRow, saiSo: number) => {
    const tenKinh = CHANNELS_FULL[row.name];
    if (!tenKinh) return;
    const dauC8 = signToInt(row.leftSign);
    const dauC10 = signToInt(row.diff > 0 ? '+' : row.diff < 0 ? '-' : '0');
    const dauC11 = signToInt(row.rightSign);
    const n0 = lyNhiet.length;
    const n1 = bieuNhiet.length;
    const n2 = lyHan.length;
    const n3 = bieuHan.length;
    groupingV2(lyNhiet, bieuNhiet, lyHan, bieuHan, tenKinh, dauC8, dauC10, dauC11, row.diff, saiSo);
    if (lyNhiet.length > n0) itLyNhiet.push(mkOrgan(row.name, tenKinh, lyNhiet[lyNhiet.length - 1]!));
    if (bieuNhiet.length > n1) itBieuNhiet.push(mkOrgan(row.name, tenKinh, bieuNhiet[bieuNhiet.length - 1]!));
    if (lyHan.length > n2) itLyHan.push(mkOrgan(row.name, tenKinh, lyHan[lyHan.length - 1]!));
    if (bieuHan.length > n3) itBieuHan.push(mkOrgan(row.name, tenKinh, bieuHan[bieuHan.length - 1]!));
  };

  upperRows.forEach((row) => process(row, upperStats.sd));
  lowerRows.forEach((row) => process(row, lowerStats.sd));

  const tag = (list: BcOrgan[], depth: 'bieu' | 'ly', temp: 'han' | 'nhiet'): OrganState[] =>
    list.map((o) => ({ ...o, depth, temp }));
  const all = [
    ...tag(itBieuHan, 'bieu', 'han'),
    ...tag(itLyHan, 'ly', 'han'),
    ...tag(itBieuNhiet, 'bieu', 'nhiet'),
    ...tag(itLyNhiet, 'ly', 'nhiet'),
  ];
  const byOrgan = new Map<string, OrganState>();
  for (const o of all) {
    const ex = byOrgan.get(o.organ);
    if (!ex) {
      byOrgan.set(o.organ, { ...o });
      continue;
    }
    if (ex.temp !== o.temp) ex.temp = 'mixed';
    if (ex.depth !== o.depth) ex.depth = 'mixed';
    if (ex.side !== o.side) ex.side = [ex.side, o.side].filter(Boolean).join('/');
  }
  return [...byOrgan.values()];
}

/** Chạy trọn chuỗi tính toán từ inputData thô → chẩn đoán + tạng phủ tổn thương — tiện gọi 1 lần
 * cho mỗi ca khám (dùng ở PatientsService.thongKe()). KHÔNG có ở bản frontend (thêm mới, chỉ ghép
 * lại các hàm THUẦN ở trên, không có logic tính toán mới). */
export function computeFullAnalysis(inputData: InputData): {
  diagnosis: DiagnosisSummary;
  organs: OrganState[];
} {
  const upperRaw = rawUpper(inputData);
  const lowerRaw = rawLower(inputData);
  const upperStats = calculateBounds(upperRaw);
  const lowerStats = calculateBounds(lowerRaw);
  const upperRows = processRows(upperRaw, upperStats);
  const lowerRows = processRows(lowerRaw, lowerStats);
  const diagnosis = computeDiagnosis(inputData, upperRows, lowerRows, upperStats, lowerStats);
  const organs = computeAffectedOrgans(upperRows, lowerRows, upperStats, lowerStats);
  return { diagnosis, organs };
}
