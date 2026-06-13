import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeridianSyndrome } from '../models/meridian-syndrome.model';
import { LegacyMeridianSyndrome } from '../models/legacy-meridian-syndrome.model';
import { BenhDongYExcelService } from './benh-dong-y-excel.controller';
import { BenhDongYHienDaiService } from './benh-dong-y-hien-dai.controller';

export class AnalyzeInputDto {
  tieutruongtrai: number;
  tieutruongphai: number;
  tamtrai: number;
  tamphai: number;
  tamtieutrai: number;
  tamtieuphai: number;
  tambaotrai: number;
  tambaophai: number;
  daitrangtrai: number;
  daitrangphai: number;
  phetrai: number;
  phephai: number;
  bangquangtrai: number;
  bangquangphai: number;
  thantrai: number;
  thanphai: number;
  damtrai: number;
  damphai: number;
  vitrai: number;
  viphai: number;
  cantrai: number;
  canphai: number;
  tytrai: number;
  typhai: number;
}

export class AnalyzeOutputDto {
  am_duong: string;
  khi: string;
  huyet: string;
  flags: Array<{
    channelIndex: number;
    channelName: string;
    L: number;
    R: number;
    Avg: number;
    c8: number;
    c10: number;
    c10Legacy?: number;
    c11: number;
    c12: number;
  }>;
  /**
   * Danh sách mô hình bệnh lý gợi ý (đã xếp hạng theo % khớp)
   * rate: tỉ lệ khớp (0..1) trên các điều kiện có trong mô hình
   */
  syndromes: Array<MeridianSyndrome & { rate?: number; matchScore?: number; totalInModel?: number }>;
  currentSyndromes?: Array<MeridianSyndrome & { rate?: number; matchScore?: number; totalInModel?: number }>;
  legacySyndromes?: Array<LegacyMeridianSyndrome & { rate?: number; matchedCount?: number; totalInModel?: number }>;
  comparisonRows?: Array<{
    current: (MeridianSyndrome & { rate?: number; matchScore?: number }) | null;
    legacy: (LegacyMeridianSyndrome & { rate?: number }) | null;
  }>;
  excelSyndromes?: Array<{
    id: number;
    code: string;
    name: string;
    outputCell: string;
    logicExpression?: string;
  }>;
  modernSyndromes?: Array<{
    id: number;
    code: string;
    name: string;
    outputCell: string;
    logicExpression?: string;
  }>;
}

type LegacySuggestedRow = LegacyMeridianSyndrome & {
  rate: number;
  matchedCount: number;
  totalInModel: number;
};

const CHANNELS = [
  'tieutruong', // 0: Tiểu trường
  'tam',        // 1: Tâm
  'tamtieu',    // 2: Tam tiêu
  'tambao',     // 3: Tâm bào
  'daitrang',   // 4: Đại tràng
  'phe',        // 5: Phế
  'bangquang',  // 6: Bàng quang
  'than',       // 7: Thận
  'dam',        // 8: Đảm
  'vi',         // 9: Vị
  'can',        // 10: Can
  'ty',         // 11: Tỳ
];

@Injectable()
export class MeridiansService {
  constructor(
    @InjectRepository(MeridianSyndrome)
    private readonly meridianRepo: Repository<MeridianSyndrome>,
    @InjectRepository(LegacyMeridianSyndrome)
    private readonly legacyMeridianRepo: Repository<LegacyMeridianSyndrome>,
    private readonly benhDongYExcelService: BenhDongYExcelService,
    private readonly benhDongYHienDaiService: BenhDongYHienDaiService,
  ) {}

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  private buildConditionMap(
    row: Record<string, any>,
    useLegacyC10: boolean,
  ): Map<string, number> {
    const cond = new Map<string, number>();
    for (const ch of CHANNELS) {
      const c8 = Number(row[`${ch}_c8`] ?? 0);
      const c10 = Number(row[ch] ?? 0);
      const c11 = Number(row[`${ch}_c11`] ?? 0);
      if (c8 !== 0) cond.set(`${ch}:c8`, c8);
      if (c10 !== 0) cond.set(`${ch}:${useLegacyC10 ? 'c10_legacy' : 'c10'}`, c10);
      if (c11 !== 0) cond.set(`${ch}:c11`, c11);
    }
    return cond;
  }

  private pairByConditionSimilarity(
    current: Array<MeridianSyndrome & { rate?: number; matchScore?: number }>,
    legacy: Array<LegacyMeridianSyndrome & { rate?: number }>,
  ): Array<{
    current: (MeridianSyndrome & { rate?: number; matchScore?: number }) | null;
    legacy: (LegacyMeridianSyndrome & { rate?: number }) | null;
    similarity: number;
  }> {
    const usedLegacy = new Set<number>();
    const rows: Array<{
      current: (MeridianSyndrome & { rate?: number; matchScore?: number }) | null;
      legacy: (LegacyMeridianSyndrome & { rate?: number }) | null;
      similarity: number;
    }> = [];

    const legacyConds = legacy.map((l) => this.buildConditionMap(l as any, true));

    for (const c of current) {
      const cCond = this.buildConditionMap(c as any, false);
      let bestIdx = -1;
      let bestScore = -1;

      for (let i = 0; i < legacy.length; i++) {
        if (usedLegacy.has(i)) continue;
        const lCond = legacyConds[i];
        let overlap = 0;
        for (const [k, v] of cCond.entries()) {
          // C10 và C10_legacy đều đại diện điều kiện "trung bình", vẫn so theo channel
          if (k.endsWith(':c10')) {
            const lk = k.replace(':c10', ':c10_legacy');
            if (lCond.has(lk) && lCond.get(lk) === v) overlap++;
          } else if (lCond.has(k) && lCond.get(k) === v) {
            overlap++;
          }
        }
        const base = Math.max(cCond.size, lCond.size, 1);
        const score = overlap / base;
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      if (bestIdx >= 0) {
        usedLegacy.add(bestIdx);
        rows.push({
          current: c,
          legacy: legacy[bestIdx],
          similarity: this.round2(bestScore),
        });
      } else {
        rows.push({ current: c, legacy: null, similarity: 0 });
      }
    }

    for (let i = 0; i < legacy.length; i++) {
      if (!usedLegacy.has(i)) {
        rows.push({ current: null, legacy: legacy[i], similarity: 0 });
      }
    }

    return rows;
  }

  /**
   * Chuẩn hoá dữ liệu nhiệt độ kinh lạc về đúng khoảng sinh lý 20..40 °C.
   *
   * Quy tắc:
   * - Nếu val = 0: coi là chưa đo -> giữ nguyên 0
   * - Nếu val nằm trong [20,40]: giữ nguyên
   * - Nếu val > 40:
   *    - thử chia theo 10^k (k=1..4) để đưa về [20,40]
   *      (vd 354 -> 35.4; 3544 -> 35.44)
   *    - nếu không có k phù hợp: báo lỗi để tránh quy đổi sai
   */
  private normalizeChannelValue(val: number, fieldName: string): number {
    if (!Number.isFinite(val) || val === 0) return 0;

    // Đã đúng đơn vị
    if (val >= 20 && val <= 40) return val;

    // Rất có thể người dùng nhập theo dạng "x10" hoặc "x100" cho đúng số lẻ
    if (val > 40) {
      const maxPow = 4; // cho phép tối đa 4 chữ số "nhân lên"
      for (let pow = 1; pow <= maxPow; pow++) {
        const cand = val / Math.pow(10, pow);
        if (cand >= 20 && cand <= 40) return this.round2(cand);
      }
    }

    throw new BadRequestException(
      `Giá trị nhiệt độ không hợp lệ (${fieldName} = ${val}). ` +
      `Chỉ chấp nhận trong khoảng 20..40 °C. Nếu bạn nhập theo dạng "x10/x100" ` +
      `(ví dụ 354 -> 35.4, 3544 -> 35.44) thì hệ thống sẽ tự quy đổi.`,
    );
  }

  /**
   * Dựng bộ chỉ số theo map Excel để match bảng benh_dong_y_excel:
   * - E7, E10..E15 cho nhóm chi trên
   * - E18, E21..E26 cho nhóm chi dưới
   * - A7/A8/A18/A19 lấy theo MAX/MIN toàn bộ số đo trái+phải của từng nhóm
   */
  /**
   * Quy ước dấu chi trên/dưới khớp công thức Excel gốc:
   *   B* = IF(left > F7, "+", IF(left < F8, "-", "0")) — dấu vế trái so với corridor
   *   G* = IF(right> F7, "+", IF(right< F8, "-", "0")) — dấu vế phải so với corridor
   * Chi trên: F7 = D7+E7, F8 = D7-E7.  Chi dưới: F18 = D18+E18, F19 = D18-E18.
   */
  private signOfValue(value: number, upper: number, lower: number): string {
    if (value > upper) return '+';
    if (value < lower) return '-';
    return '0';
  }

  private buildExcelIndicators(data: AnalyzeInputDto): Record<string, number | string> {
    // KHÔNG làm tròn các bước trung gian: sheet Excel gốc giữ nguyên full-precision
    // (map.md: D7=(A7+A8)/2, E11=D11-D7, ...). Làm tròn (round2) ở đây sẽ ép một số
    // dương cực nhỏ do sai số dấu phẩy động (vd E11 = 7.1e-15, Excel coi "0" nhưng >0)
    // về 0 tuyệt đối, khiến điều kiện ">0" trượt trong khi trên sheet vẫn đúng.
    // JS và Excel cùng IEEE754 nên giữ cùng thứ tự phép tính ⇒ khớp hành vi sheet.
    const d10 = (data.tieutruongtrai + data.tieutruongphai) / 2;
    const d11 = (data.tamtrai + data.tamphai) / 2;
    const d12 = (data.tamtieutrai + data.tamtieuphai) / 2;
    const d13 = (data.tambaotrai + data.tambaophai) / 2;
    const d14 = (data.daitrangtrai + data.daitrangphai) / 2;
    const d15 = (data.phetrai + data.phephai) / 2;

    const upperRawVals = [
      data.tieutruongtrai,
      data.tieutruongphai,
      data.tamtrai,
      data.tamphai,
      data.tamtieutrai,
      data.tamtieuphai,
      data.tambaotrai,
      data.tambaophai,
      data.daitrangtrai,
      data.daitrangphai,
      data.phetrai,
      data.phephai,
    ].filter((v) => v > 0);
    const upperVals = upperRawVals;
    const a7 = upperVals.length ? Math.max(...upperVals) : 0;
    const a8 = upperVals.length ? Math.min(...upperVals) : 0;
    const d7 = (a7 + a8) / 2;
    const e7 = (a7 - a8) / 6;

    const d21 = (data.bangquangtrai + data.bangquangphai) / 2;
    const d22 = (data.thantrai + data.thanphai) / 2;
    const d23 = (data.damtrai + data.damphai) / 2;
    const d24 = (data.vitrai + data.viphai) / 2;
    const d25 = (data.cantrai + data.canphai) / 2;
    const d26 = (data.tytrai + data.typhai) / 2;

    const lowerRawVals = [
      data.bangquangtrai,
      data.bangquangphai,
      data.thantrai,
      data.thanphai,
      data.damtrai,
      data.damphai,
      data.vitrai,
      data.viphai,
      data.cantrai,
      data.canphai,
      data.tytrai,
      data.typhai,
    ].filter((v) => v > 0);
    const lowerVals = lowerRawVals;
    const a18 = lowerVals.length ? Math.max(...lowerVals) : 0;
    const a19 = lowerVals.length ? Math.min(...lowerVals) : 0;
    const d18 = (a18 + a19) / 2;
    const e18 = (a18 - a19) / 6;

    // Ngưỡng corridor cho dấu B*/G* (F7/F8 chi trên, F18/F19 chi dưới)
    const f7 = d7 + e7;
    const f8 = d7 - e7;
    const f18 = d18 + e18;
    const f19 = d18 - e18;
    const sU = (v: number) => this.signOfValue(v, f7, f8);
    const sL = (v: number) => this.signOfValue(v, f18, f19);

    // B*/G* dạng chuỗi "+"/"-"/"0" (dấu vế trái/phải vs corridor)
    const b10 = sU(data.tieutruongtrai), g10 = sU(data.tieutruongphai);
    const b11 = sU(data.tamtrai), g11 = sU(data.tamphai);
    const b12 = sU(data.tamtieutrai), g12 = sU(data.tamtieuphai);
    const b13 = sU(data.tambaotrai), g13 = sU(data.tambaophai);
    const b14 = sU(data.daitrangtrai), g14 = sU(data.daitrangphai);
    const b15 = sU(data.phetrai), g15 = sU(data.phephai);
    const b21 = sL(data.bangquangtrai), g21 = sL(data.bangquangphai);
    const b22 = sL(data.thantrai), g22 = sL(data.thanphai);
    const b23 = sL(data.damtrai), g23 = sL(data.damphai);
    const b24 = sL(data.vitrai), g24 = sL(data.viphai);
    const b25 = sL(data.cantrai), g25 = sL(data.canphai);
    const b26 = sL(data.tytrai), g26 = sL(data.typhai);

    // AN*/AQ* = mã hoá dấu sang số {-1, 0, +1} theo công thức Excel gốc:
    //   AN10 = IF(B10="-",-1,IF(B10="+",1,0))   AQ10 = IF(G10="-",-1,IF(G10="+",1,0))
    const toNum = (s: string): number => (s === '+' ? 1 : s === '-' ? -1 : 0);
    const an10 = toNum(b10), aq10 = toNum(g10);
    const an11 = toNum(b11), aq11 = toNum(g11);
    const an12 = toNum(b12), aq12 = toNum(g12);
    const an13 = toNum(b13), aq13 = toNum(g13);
    const an14 = toNum(b14), aq14 = toNum(g14);
    const an15 = toNum(b15), aq15 = toNum(g15);
    const an21 = toNum(b21), aq21 = toNum(g21);
    const an22 = toNum(b22), aq22 = toNum(g22);
    const an23 = toNum(b23), aq23 = toNum(g23);
    const an24 = toNum(b24), aq24 = toNum(g24);
    const an25 = toNum(b25), aq25 = toNum(g25);
    const an26 = toNum(b26), aq26 = toNum(g26);

    // AP* = tên kinh khi cả hai bên cùng vượt corridor về phía "+":
    //   AP10 = IF(AND(AN10*AQ10>0; OR(AN10>0;AQ10>0)); A10; "")
    const apOf = (an: number, aq: number, name: string): string =>
      an * aq > 0 && (an > 0 || aq > 0) ? name : '';

    return {
      // Trung điểm + cận lệch chi trên (D7) / chi dưới (D18)
      D7: d7,
      D18: d18,
      E7: e7,
      E8: e7,
      // E* = trung bình kinh - D (full-precision như Excel, không round2)
      E10: d10 - d7,
      E11: d11 - d7,
      E12: d12 - d7,
      E13: d13 - d7,
      E14: d14 - d7,
      E15: d15 - d7,
      E18: e18,
      E21: d21 - d18,
      E22: d22 - d18,
      E23: d23 - d18,
      E24: d24 - d18,
      E25: d25 - d18,
      E26: d26 - d18,
      // H* = |trái - phải| theo từng kinh (chi trên 10..15, chi dưới 21..26)
      H10: Math.abs(data.tieutruongtrai - data.tieutruongphai),
      H11: Math.abs(data.tamtrai - data.tamphai),
      H12: Math.abs(data.tamtieutrai - data.tamtieuphai),
      H13: Math.abs(data.tambaotrai - data.tambaophai),
      H14: Math.abs(data.daitrangtrai - data.daitrangphai),
      H15: Math.abs(data.phetrai - data.phephai),
      H21: Math.abs(data.bangquangtrai - data.bangquangphai),
      H22: Math.abs(data.thantrai - data.thanphai),
      H23: Math.abs(data.damtrai - data.damphai),
      H24: Math.abs(data.vitrai - data.viphai),
      H25: Math.abs(data.cantrai - data.canphai),
      H26: Math.abs(data.tytrai - data.typhai),
      // AN*/AQ* = mã hoá dấu B*/G* sang số {-1, 0, +1} (theo tieuketbatcuong.md).
      // Quy ước AN*AQ<0 ⇔ trái-phải lệch corridor ngược chiều; >0 ⇔ cùng chiều vượt corridor.
      AN10: an10, AN11: an11, AN12: an12, AN13: an13, AN14: an14, AN15: an15,
      AQ10: aq10, AQ11: aq11, AQ12: aq12, AQ13: aq13, AQ14: aq14, AQ15: aq15,
      AN21: an21, AN22: an22, AN23: an23, AN24: an24, AN25: an25, AN26: an26,
      AQ21: aq21, AQ22: aq22, AQ23: aq23, AQ24: aq24, AQ25: aq25, AQ26: aq26,
      // B* = dấu trái so với corridor chi trên/dưới; G* = dấu phải. Giá trị "+"/"-"/"0".
      B10: b10, B11: b11, B12: b12, B13: b13, B14: b14, B15: b15,
      G10: g10, G11: g11, G12: g12, G13: g13, G14: g14, G15: g15,
      B21: b21, B22: b22, B23: b23, B24: b24, B25: b25, B26: b26,
      G21: g21, G22: g22, G23: g23, G24: g24, G25: g25, G26: g26,
      // AP* = tên kinh khi cả hai bên cùng vượt corridor về phía "+" (rỗng nếu không).
      // Dùng cho rule có LEN(AP14)>0 (tương đương AP14!="").
      AP10: apOf(an10, aq10, 'Tiểu trường'),
      AP11: apOf(an11, aq11, 'Tâm'),
      AP12: apOf(an12, aq12, 'Tam tiêu'),
      AP13: apOf(an13, aq13, 'Tâm bào'),
      AP14: apOf(an14, aq14, 'Đại trường'),
      AP15: apOf(an15, aq15, 'Phế'),
      AP21: apOf(an21, aq21, 'Bàng quang'),
      AP22: apOf(an22, aq22, 'Thận'),
      AP23: apOf(an23, aq23, 'Đảm'),
      AP24: apOf(an24, aq24, 'Vị'),
      AP25: apOf(an25, aq25, 'Can'),
      AP26: apOf(an26, aq26, 'Tỳ'),
    };
  }

  async analyze(data: AnalyzeInputDto): Promise<AnalyzeOutputDto> {
    // Chuẩn hoá/validate 24 giá trị trước khi tính toán ngưỡng
    // (mutate tại chỗ để các nơi lưu inputData về sau cũng có giá trị chuẩn)
    for (const ch of CHANNELS) {
      const leftKey = `${ch}trai` as keyof AnalyzeInputDto;
      const rightKey = `${ch}phai` as keyof AnalyzeInputDto;
      (data as any)[leftKey] = this.normalizeChannelValue((data as any)[leftKey], String(leftKey));
      (data as any)[rightKey] = this.normalizeChannelValue((data as any)[rightKey], String(rightKey));
    }

    const leftChannels = [
      data.tieutruongtrai,
      data.tamtrai,
      data.tamtieutrai,
      data.tambaotrai,
      data.daitrangtrai,
      data.phetrai,
      data.bangquangtrai,
      data.thantrai,
      data.damtrai,
      data.vitrai,
      data.cantrai,
      data.tytrai,
    ];

    const rightChannels = [
      data.tieutruongphai,
      data.tamphai,
      data.tamtieuphai,
      data.tambaophai,
      data.daitrangphai,
      data.phephai,
      data.bangquangphai,
      data.thanphai,
      data.damphai,
      data.viphai,
      data.canphai,
      data.typhai,
    ];

    if ((leftChannels as any[]).includes(undefined) || (rightChannels as any[]).includes(undefined)) {
      throw new Error('Invalid input, must provide all 24 specific channels.');
    }

    // --- Bước 2.1: Tính Khung Sinh Lý (làm tròn 2 chữ số như code gốc) ---
    const calculateBounds = (leftArr: number[], rightArr: number[]) => {
      const allVals = [...leftArr, ...rightArr].filter(v => v > 0);
      if (allVals.length === 0) {
        return { midPoint: 0, dungSai: 0, upperLimit: 0, lowerLimit: 0 };
      }

      const maxVal = Math.max(...allVals);
      const minVal = Math.min(...allVals);
      const range = maxVal - minVal;

      // Trong phương pháp Lê Văn Sửu (theo Excel): midPoint = (Max + Min) / 2
      const midPoint = this.round2((maxVal + minVal) / 2.0);
      const dungSai = this.round2(range / 6.0);

      return {
        midPoint,
        dungSai,
        upperLimit: this.round2(midPoint + dungSai),
        lowerLimit: this.round2(midPoint - dungSai),
      };
    };

    const boundsUpper = calculateBounds(leftChannels.slice(0, 6), rightChannels.slice(0, 6));
    const boundsLower = calculateBounds(leftChannels.slice(6, 12), rightChannels.slice(6, 12));

    // --- Bước 2.2: Tính Cờ Trạng Thái (Flags) ---
    const flags: AnalyzeOutputDto['flags'] = [];

    for (let i = 0; i < 12; i++) {
      const bounds = i < 6 ? boundsUpper : boundsLower;

      const L = leftChannels[i];
      const R = rightChannels[i];
      const avg = this.round2((L + R) / 2.0);

      // C10: Trạng thái của kinh (Hàn/Bình/Nhiệt)
      const c10 = avg > bounds.upperLimit ? 1 : (avg < bounds.lowerLimit ? -1 : 0);
      // C10 gốc app 32-bit: so với midpoint, không dùng corridor upper/lower.
      const c10Legacy = avg > bounds.midPoint ? 1 : (avg < bounds.midPoint ? -1 : 0);

      // C8: trái so với giới hạn
      const c8 = L > bounds.upperLimit ? 1 : L < bounds.lowerLimit ? -1 : 0;

      // C11: phải so với giới hạn
      const c11 = R > bounds.upperLimit ? 1 : R < bounds.lowerLimit ? -1 : 0;

      // C12: lệch 2 bên
      const diff = L - R;
      const c12 = Math.abs(diff) > bounds.dungSai
        ? (diff > 0 ? 1 : -1)
        : 0;

      flags.push({ channelIndex: i, channelName: CHANNELS[i], L, R, Avg: avg, c8, c10, c10Legacy, c11, c12 });
    }

    // --- Bước 3: Suy luận Âm-Dương & Khí-Huyết ---
    // Âm / Dương: Dựa trên trung bình kinh Đảm so với trị số bình quân nhóm Chi dưới
    const avg_dam = this.round2((data.damtrai + data.damphai) / 2.0);
    const mid_tuc = boundsLower.midPoint; // (Max + Min) / 2 của nhóm Chi dưới
    const diff_am_duong = this.round2(avg_dam - mid_tuc);
    
    let am_duong = 'Bình thường';
    if (diff_am_duong < 0) {
      am_duong = 'Dương hư';
    } else if (diff_am_duong > 0) {
      am_duong = 'Âm hư';
    }

    // --- Bước 3.1: Chẩn đoán Khí (Dựa trên 6 kinh Chi trên) ---
    let huTrenCount = 0;
    let sumDiffTren = 0;
    let allTrenZero = true;

    for (let i = 0; i < 6; i++) {
      const f = flags[i];
      const diff = this.round2(f.Avg - boundsUpper.midPoint);
      sumDiffTren += diff;
      if (f.Avg !== 0) allTrenZero = false;
      if (diff < 0) huTrenCount++;
    }

    let khi = 'Bình thường';
    if (allTrenZero) {
      khi = '';
    } else {
      if (huTrenCount > 3) {
        khi = 'Khí hư';
      } else if (huTrenCount < 3) {
        khi = 'Khí thịnh';
      } else {
        // huTrenCount == 3
        if (sumDiffTren < 0) khi = 'Khí hư';
        else if (sumDiffTren > 0) khi = 'Khí thịnh';
        else khi = '';
      }
    }

    // --- Bước 3.2: Chẩn đoán Huyết (Dựa trên 6 kinh Chi dưới) ---
    let huDuoiCount = 0;
    let sumDiffDuoi = 0;
    let allDuoiZero = true;

    for (let i = 6; i < 12; i++) {
      const f = flags[i];
      const diff = this.round2(f.Avg - boundsLower.midPoint);
      sumDiffDuoi += diff;
      if (f.Avg !== 0) allDuoiZero = false;
      if (diff < 0) huDuoiCount++;
    }

    let huyet = 'Bình thường';
    if (allDuoiZero) {
      huyet = '';
    } else {
      if (huDuoiCount > 3) {
        huyet = 'Huyết hư';
      } else if (huDuoiCount < 3) {
        huyet = 'Huyết thịnh';
      } else {
        // huDuoiCount == 3
        if (sumDiffDuoi < 0) huyet = 'Huyết hư';
        else if (sumDiffDuoi > 0) huyet = 'Huyết thịnh';
        else huyet = '';
      }
    }

    // --- Bước 4: Khớp CSDL bệnh chứng luận trị (Logic chấm điểm tương đồng) ---
    const allSyndromes = await this.meridianRepo.find();

    const suggested = allSyndromes.map(dbRow => {
      let score = 0;
      let totalConditions = 0;
      let matchedConditions = 0;

      for (let i = 0; i < 12; i++) {
        const ch = CHANNELS[i];
        const f = flags[i];
        
        // Lấy điều kiện từ DB cho kinh này (c10, c8, c11)
        const dbC10 = (dbRow[ch as keyof MeridianSyndrome] as number) ?? 0;
        const dbC8 = (dbRow[`${ch}_c8` as keyof MeridianSyndrome] as number) ?? 0;
        const dbC11 = (dbRow[`${ch}_c11` as keyof MeridianSyndrome] as number) ?? 0;

        // Nếu DB có quy định trạng thái cho kinh này
        if (dbC10 !== 0 || dbC8 !== 0 || dbC11 !== 0) {
          totalConditions++;
          
          let channelMatched = true;
          let weight = 1.0;

          // Kiểm tra khớp từng flag nếu DB có quy định
          if (dbC10 !== 0 && dbC10 !== f.c10) channelMatched = false;
          if (dbC8 !== 0 && dbC8 !== f.c8) channelMatched = false;
          if (dbC11 !== 0 && dbC11 !== f.c11) channelMatched = false;

          if (channelMatched) {
            matchedConditions++;
            // Nếu kinh này đang ở trạng thái Thực/Hư rõ rệt (ngoài corridor) thì tăng trọng số điểm
            if (f.c8 !== 0 || f.c11 !== 0) weight = 1.5;
            score += weight;
          }
        }
      }

      // Tỷ lệ khớp dựa trên số điều kiện đã khớp / tổng số điều kiện của mẫu bệnh đó
      const rate = totalConditions > 0 ? matchedConditions / totalConditions : 0;
      
      return Object.assign(dbRow, { 
        rate, 
        matchScore: score, 
        matchedCount: matchedConditions,
        totalInModel: totalConditions 
      });
    })
    // Lọc các mô hình có độ tương đồng cao (trên 60% hoặc khớp tuyệt đối)
    .filter(m => (m.totalInModel ?? 0) > 0 && (m.rate ?? 0) >= 0.6)
    .sort((a, b) => {
      // Ưu tiên khớp tuyệt đối (rate=1), sau đó đến điểm số (score) và tỷ lệ (rate)
      if (a.rate === 1 && b.rate !== 1) return -1;
      if (a.rate !== 1 && b.rate === 1) return 1;
      return (b.matchScore ?? 0) - (a.matchScore ?? 0) || (b.rate ?? 0) - (a.rate ?? 0);
    })
    .slice(0, 15);

    // --- Bước 5: Đối chiếu mô hình app gốc (legacy) ---
    const legacyRows = await this.legacyMeridianRepo.find({
      order: { nhomid: 'ASC', tieuket: 'ASC', id: 'ASC' },
    });

    const legacySuggested: LegacySuggestedRow[] = legacyRows
      .map((dbRow) => {
        let totalConditions = 0;
        let matchedConditions = 0;
        let allMatched = true;

        for (let i = 0; i < 12; i++) {
          const ch = CHANNELS[i];
          const f = flags[i];
          const dbC10 = (dbRow[ch as keyof LegacyMeridianSyndrome] as number) ?? 0;
          const dbC8 = (dbRow[`${ch}_c8` as keyof LegacyMeridianSyndrome] as number) ?? 0;
          const dbC11 = (dbRow[`${ch}_c11` as keyof LegacyMeridianSyndrome] as number) ?? 0;

          if (dbC10 !== 0 || dbC8 !== 0 || dbC11 !== 0) {
            totalConditions++;
            const channelMatched =
              (dbC10 === 0 || dbC10 === (f.c10Legacy ?? 0)) &&
              (dbC8 === 0 || dbC8 === f.c8) &&
              (dbC11 === 0 || dbC11 === f.c11);

            if (channelMatched) matchedConditions++;
            else allMatched = false;
          }
        }

        if (totalConditions === 0 || !allMatched) return null;

        const rate = matchedConditions / totalConditions;
        return Object.assign(dbRow, {
          rate,
          matchedCount: matchedConditions,
          totalInModel: totalConditions,
        }) as LegacySuggestedRow;
      })
      .filter((x): x is LegacySuggestedRow => x !== null);

    const comparisonRows = this.pairByConditionSimilarity(
      suggested as Array<MeridianSyndrome & { rate?: number; matchScore?: number }>,
      legacySuggested as Array<LegacyMeridianSyndrome & { rate?: number }>,
    );

    const excelIndicators = this.buildExcelIndicators(data);
    const [excelDiagnose, modernDiagnose] = await Promise.all([
      this.benhDongYExcelService.diagnose(excelIndicators),
      this.benhDongYHienDaiService.diagnose(excelIndicators),
    ]);

    return {
      am_duong,
      khi,
      huyet,
      flags,
      currentSyndromes: suggested,
      legacySyndromes: legacySuggested,
      excelSyndromes: excelDiagnose.matched,
      modernSyndromes: modernDiagnose.matched,
      comparisonRows,
      syndromes: suggested,
    };
  }
}
