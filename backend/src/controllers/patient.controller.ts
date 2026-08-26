import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../models/patient.model';
import { Examination } from '../models/examination.model';
import { CreatePatientDto, UpdatePatientDto } from '../models/patient.dto';
import { BenhDongYExcelService } from './benh-dong-y-excel.controller';
import { MeridiansService, AnalyzeInputDto } from './meridian.controller';
import {
  computeFullAnalysis,
  InputData,
} from '../utils/meridian-analysis.util';

/** Bệnh nhân kèm kết luận Hư-Thực của ca khám gần nhất — để lễ tân nhìn danh sách biết
 * ai nên khuyên đi khám Tây y mà không cần mở từng hồ sơ. null = chưa có ca khám nào /
 * ca khám chưa đủ dữ liệu kết luận. */
export type PatientVoiHuThuc = PatientAnToan & { huThuc: string | null };

export interface PaginatedPatients {
  data: PatientVoiHuThuc[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Dạng dữ liệu trả ra ngoài — KHÔNG bao giờ kèm passwordHash. */
export type PatientAnToan = Omit<Patient, 'passwordHash'>;

function toSafePatient(p: Patient): PatientAnToan {
  const { passwordHash: _passwordHash, ...safe } = p;
  return safe;
}

/** 1 ca khám đã "làm phẳng" — mỗi trường là 1 ĐẠI LƯỢNG có thể chọn làm rows/cols/filter trong bảng
 * pivot. Trường số ít (gender/ageGroup/province/amDuong/huThuc/khi/huyet) là 1 giá trị/ca; trường
 * "đa trị" (theBenh, tonThuong*) là MẢNG vì 1 ca có thể khớp NHIỀU thể bệnh / NHIỀU tạng phủ tổn
 * thương — khi dùng làm rows/cols, 1 ca sẽ CỘNG VÀO nhiều nhóm (đúng bản chất dữ liệu, không gượng ép
 * về 1 giá trị). */
export interface ThongKeRecord {
  patientId: number;
  gender: string;
  ageGroup: string;
  province: string;
  amDuong: string;
  huThuc: string;
  khi: string;
  huyet: string;
  theBenh: string[];
  tonThuongTemp: string[];
  tonThuongDepth: string[];
  tonThuongCombo: string[];
}

/** Đăng ký ĐẠI LƯỢNG có thể chọn — nguồn sự thật DUY NHẤT, trả kèm trong response để frontend dựng
 * bộ chọn "Nhóm theo / So sánh theo / Lọc theo" mà không phải tự khai lại danh sách.
 * CỐ Ý KHÔNG có "tổn thương theo TÊN TẠNG đơn lẻ": computeAffectedOrgans() (util port từ frontend)
 * luôn phân loại ĐỦ 12 kinh vào 1 trong 4 nhóm Hàn/Nhiệt×Biểu/Lý cho MỌI ca (groupingV2 không có
 * nhánh "trung tính" — mọi tổ hợp dấu đều rơi vào 1 nhóm) → mọi tạng đều xuất hiện ở ~100% ca khám,
 * làm bộ lọc/nhóm theo tên tạng đơn lẻ vô nghĩa (không phân biệt được gì). tonThuongCombo (tạng + độ
 * sâu + tính chất CÙNG LÚC) mới thực sự phân biệt được — xem so sánh mật độ đã kiểm chứng trực tiếp
 * trên dữ liệu thật lúc thêm dòng comment này. */
export const THONG_KE_DIMENSIONS: {
  key: keyof ThongKeRecord;
  label: string;
  nhom: 'benh-nhan' | 'benh-hoc';
}[] = [
  { key: 'gender', label: 'Giới tính', nhom: 'benh-nhan' },
  { key: 'ageGroup', label: 'Nhóm tuổi', nhom: 'benh-nhan' },
  { key: 'province', label: 'Tỉnh / Thành phố', nhom: 'benh-nhan' },
  { key: 'amDuong', label: 'Âm — Dương (tổng cương)', nhom: 'benh-hoc' },
  { key: 'huThuc', label: 'Hư — Thực', nhom: 'benh-hoc' },
  { key: 'khi', label: 'Khí', nhom: 'benh-hoc' },
  { key: 'huyet', label: 'Huyết', nhom: 'benh-hoc' },
  { key: 'theBenh', label: 'Thể bệnh', nhom: 'benh-hoc' },
  { key: 'tonThuongCombo', label: 'Tổn thương tạng phủ', nhom: 'benh-hoc' },
  { key: 'tonThuongTemp', label: 'Tổn thương · Hàn/Nhiệt', nhom: 'benh-hoc' },
  { key: 'tonThuongDepth', label: 'Tổn thương · Biểu/Lý', nhom: 'benh-hoc' },
];
const THONG_KE_DIM_KEYS = new Set(THONG_KE_DIMENSIONS.map((d) => d.key));

export interface ThongKePivot {
  rows: string;
  cols: string | null;
  rowLabels: string[];
  colLabels: string[];
  matrix: number[][];
  rowTotals: number[];
  colTotals: number[];
  grandTotal: number;
  truncatedRows: boolean;
  truncatedCols: boolean;
}

export interface ThongKeResponse {
  totalPatients: number;
  totalExaminations: number;
  dimensions: typeof THONG_KE_DIMENSIONS;
  pivot: ThongKePivot;
}

/** 1 pivot 1-chiều (rows=đại lượng, cols=null) cho MỖI đại lượng trong THONG_KE_DIMENSIONS — dùng
 * cho lưới widget "mọi đại lượng luôn hiện" của dashboard. Trả trong 1 lần gọi thay vì 1 request/đại
 * lượng (xem thongKeGrid() — lý do hiệu năng ghi ở đó). */
export interface ThongKeGridResponse {
  totalPatients: number;
  totalExaminations: number;
  dimensions: typeof THONG_KE_DIMENSIONS;
  pivots: Record<string, ThongKePivot>;
}

/** Nhóm tuổi lâm sàng thường dùng — 'Không rõ' khi thiếu/hỏng ngày sinh. */
function ageGroupOf(dateOfBirth: string | null | undefined): string {
  if (!dateOfBirth) return 'Không rõ';
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return 'Không rõ';
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  if (age < 0 || age > 130) return 'Không rõ';
  if (age < 18) return '<18';
  if (age <= 30) return '18-30';
  if (age <= 45) return '31-45';
  if (age <= 60) return '46-60';
  if (age <= 75) return '61-75';
  return '76+';
}

function dimValues(rec: ThongKeRecord, dim: string): string[] {
  const v = (rec as unknown as Record<string, unknown>)[dim];
  if (v == null) return [];
  if (Array.isArray(v)) return (v as string[]).filter(Boolean);
  return typeof v === 'string' && v ? [v] : [];
}

const THONG_KE_MAX_CATEGORIES = 25;

/** "dim1:value1,dim2:value2" → [{dim,value}] — bỏ qua entry rỗng/sai định dạng/đại lượng không hợp lệ. */
function parseThongKeFilters(
  filtersRaw?: string,
): { dim: string; value: string }[] {
  return (filtersRaw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const idx = s.indexOf(':');
      return idx > 0 ? { dim: s.slice(0, idx), value: s.slice(idx + 1) } : null;
    })
    .filter(
      (f): f is { dim: string; value: string } =>
        !!f && THONG_KE_DIM_KEYS.has(f.dim as keyof ThongKeRecord),
    );
}

/** Dựng bảng pivot rows×cols (đếm theo CA KHÁM) từ tập bản ghi đã làm phẳng — đại lượng ĐA TRỊ ở
 * rows/cols khiến 1 ca cộng vào NHIỀU ô (đúng ý "1 ca có thể khớp nhiều thể bệnh/tổn thương"), không
 * làm sai lệch tổng.
 *
 * Ngữ nghĩa filters kiểu "cross-filter dashboard" chuẩn (Tableau/Power BI): gộp OR giữa các giá trị
 * CÙNG 1 đại lượng, rồi AND giữa CÁC đại lượng khác nhau. Bắt buộc phải OR-trong-cùng-đại-lượng vì UI
 * widget cho bấm chọn NHIỀU giá trị của cùng 1 ô (vd bấm liền 2 tỉnh) — nếu AND tuyệt đối như trước,
 * chọn 2 giá trị của 1 đại lượng ĐƠN TRỊ (vd Tỉnh/Thành) sẽ luôn ra 0 (1 ca không thể có 2 tỉnh cùng
 * lúc), gây cảm giác "lọc bị gãy" dù đúng theo AND thuần tuý — không phải điều người dùng mong đợi. */
function computePivot(
  records: ThongKeRecord[],
  rowsDim: string,
  colsDim: string | null,
  filters: { dim: string; value: string }[],
): ThongKePivot {
  const filterGroups = new Map<string, Set<string>>();
  for (const f of filters) {
    if (!filterGroups.has(f.dim)) filterGroups.set(f.dim, new Set());
    filterGroups.get(f.dim)!.add(f.value);
  }
  const filtered = filterGroups.size
    ? records.filter((r) =>
        [...filterGroups.entries()].every(([dim, values]) =>
          dimValues(r, dim).some((v) => values.has(v)),
        ),
      )
    : records;

  const rowCounts = new Map<string, number>();
  const colCounts = new Map<string, number>();
  const cellCounts = new Map<string, number>();

  for (const rec of filtered) {
    const rowVals = dimValues(rec, rowsDim);
    const colVals = colsDim ? dimValues(rec, colsDim) : ['Số ca'];
    for (const rv of rowVals) rowCounts.set(rv, (rowCounts.get(rv) || 0) + 1);
    for (const cv of colVals) colCounts.set(cv, (colCounts.get(cv) || 0) + 1);
    for (const rv of rowVals) {
      for (const cv of colVals) {
        const key = `${rv}\u001f${cv}`;
        cellCounts.set(key, (cellCounts.get(key) || 0) + 1);
      }
    }
  }

  const sortDesc = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const rowLabelsAll = sortDesc(rowCounts);
  const colLabelsAll = colsDim ? sortDesc(colCounts) : ['Số ca'];
  const truncatedRows = rowLabelsAll.length > THONG_KE_MAX_CATEGORIES;
  const truncatedCols = colLabelsAll.length > THONG_KE_MAX_CATEGORIES;
  const rowLabels = rowLabelsAll.slice(0, THONG_KE_MAX_CATEGORIES);
  const colLabels = colLabelsAll.slice(0, THONG_KE_MAX_CATEGORIES);

  const matrix = rowLabels.map((rv) =>
    colLabels.map((cv) =>
      colsDim
        ? cellCounts.get(`${rv}\u001f${cv}`) || 0
        : rowCounts.get(rv) || 0,
    ),
  );
  const rowTotals = rowLabels.map((rv) => rowCounts.get(rv) || 0);
  const colTotals = colLabels.map((cv) =>
    colsDim ? colCounts.get(cv) || 0 : filtered.length,
  );

  return {
    rows: rowsDim,
    cols: colsDim,
    rowLabels,
    colLabels,
    matrix,
    rowTotals,
    colTotals,
    grandTotal: filtered.length,
    truncatedRows,
    truncatedCols,
  };
}

// Postgres `date` column rejects empty strings; the create/edit form posts
// `''` for any optional field the user leaves blank. Convert blanks to null
// so the DB receives a valid value.
function normalizePatientDto<T extends Partial<CreatePatientDto>>(dto: T): T {
  const result: any = { ...dto };
  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'string' && result[key].trim() === '') {
      result[key] = null;
    }
  }
  return result;
}

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(Examination)
    private readonly examinationRepository: Repository<Examination>,
    private readonly benhDongYExcelService: BenhDongYExcelService,
    private readonly meridiansService: MeridiansService,
  ) {}

  async findAll(): Promise<PatientAnToan[]> {
    const list = await this.patientRepository.find({
      order: { createdAt: 'DESC' },
    });
    return list.map(toSafePatient);
  }

  async findPaginated(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<PaginatedPatients> {
    const skip = (page - 1) * limit;

    const qb = this.patientRepository
      .createQueryBuilder('patient')
      .orderBy('patient.createdAt', 'DESC');

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      qb.andWhere(
        '(patient.fullName ILIKE :term OR patient.phone ILIKE :term OR patient.address ILIKE :term)',
        { term },
      );
    }

    const total = await qb.getCount();

    // Chỉ 1 trang bệnh nhân (10-20 dòng) cần Hư-Thực, không phải cả 5675 bệnh nhân — nên
    // dùng subquery tương quan lấy inputData của CA KHÁM GẦN NHẤT/bệnh nhân (tận dụng index
    // idx_examinations_thoi_diem_kham) rồi tính bằng computeFullAnalysis, ĐÚNG hàm
    // PatientsService.buildThongKeDataset() dùng để khớp tuyệt đối với màn Kết Quả Đo — thay vì
    // đọc thẳng cột examinations.huThuc (lưu bằng thuật toán backend midpoint/dungSai, có thể
    // lệch nhẹ so với màn hình).
    qb.addSelect((subQb) =>
      subQb
        .subQuery()
        .select('e."inputData"', 'inputData')
        .from(Examination, 'e')
        .where('e."patientId" = patient.id')
        .orderBy('COALESCE(e."thoiDiemKham", e."createdAt")', 'DESC')
        .limit(1),
      'latestInputData',
    )
      .skip(skip)
      .take(limit);

    const { entities, raw } = await qb.getRawAndEntities();

    const data: PatientVoiHuThuc[] = entities.map((p, i) => {
      const safe = toSafePatient(p);
      const inputData = raw[i]?.latestInputData;
      let huThuc: string | null = null;
      if (inputData) {
        try {
          huThuc = computeFullAnalysis(inputData as InputData).diagnosis.huThuc || null;
        } catch {
          // Dữ liệu ca khám hỏng (vd nhiệt độ ngoài khoảng hợp lệ) — bỏ qua, không chặn cả trang.
        }
      }
      return { ...safe, huThuc };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /** Nội bộ — trả ENTITY ĐẦY ĐỦ (kèm passwordHash), dùng khi cần ghi/so khớp trong service khác. */
  private async findOneRaw(id: number): Promise<Patient> {
    const patient = await this.patientRepository.findOneBy({ id });
    if (!patient) {
      throw new NotFoundException(`Bệnh nhân #${id} không tồn tại`);
    }
    return patient;
  }

  async findOne(id: number): Promise<PatientAnToan> {
    return toSafePatient(await this.findOneRaw(id));
  }

  async create(dto: CreatePatientDto): Promise<PatientAnToan> {
    const normalized = normalizePatientDto(dto);
    const patient = this.patientRepository.create({
      fullName: normalized.fullName,
      gender: normalized.gender,
      dateOfBirth: normalized.dateOfBirth,
      timeOfBirth: normalized.timeOfBirth,
      address: normalized.address,
      province: normalized.province,
      phone: normalized.phone,
      medicalHistory: normalized.medicalHistory,
      notes: normalized.notes,
      treatmentTarget: normalized.treatmentTarget,
      treatmentCourseStart: normalized.treatmentCourseStart,
    });
    return toSafePatient(await this.patientRepository.save(patient));
  }

  async update(id: number, dto: UpdatePatientDto): Promise<PatientAnToan> {
    const patient = await this.findOneRaw(id);
    const normalized = normalizePatientDto(dto);
    // Gán tường minh từng field khai báo trong UpdatePatientDto — KHÔNG dùng Object.assign trực
    // tiếp trên body request, tránh mass-assignment ghi đè passwordHash/id/createdAt/...
    if (normalized.fullName !== undefined) patient.fullName = normalized.fullName;
    if (normalized.gender !== undefined) patient.gender = normalized.gender;
    if (normalized.dateOfBirth !== undefined) patient.dateOfBirth = normalized.dateOfBirth;
    if (normalized.timeOfBirth !== undefined) patient.timeOfBirth = normalized.timeOfBirth;
    if (normalized.address !== undefined) patient.address = normalized.address;
    if (normalized.province !== undefined) patient.province = normalized.province;
    if (normalized.phone !== undefined) patient.phone = normalized.phone;
    if (normalized.medicalHistory !== undefined) patient.medicalHistory = normalized.medicalHistory;
    if (normalized.notes !== undefined) patient.notes = normalized.notes;
    if (normalized.treatmentTarget !== undefined) patient.treatmentTarget = normalized.treatmentTarget;
    if (normalized.treatmentCourseStart !== undefined) patient.treatmentCourseStart = normalized.treatmentCourseStart;
    return toSafePatient(await this.patientRepository.save(patient));
  }

  async updateFcmToken(id: number, fcmToken: string): Promise<void> {
    const patient = await this.findOneRaw(id);
    patient.fcmToken = fcmToken;
    await this.patientRepository.save(patient);
  }

  async remove(id: number): Promise<void> {
    const patient = await this.findOneRaw(id);
    await this.patientRepository.remove(patient);
  }

  // Cache tập bản ghi đã "làm phẳng" (bước NẶNG — tính lại Bát Cương/tổn thương thuần RAM cho ~9.5k ca
  // + 1 lượt khớp luật Excel) — TTL ngắn vì đây là màn thống kê admin xem nhiều lần liên tiếp khi đổi
  // rows/cols/filter; dữ liệu nguồn (bệnh nhân/ca khám) không đổi liên tục nên cache vài phút là an toàn.
  private thongKeCache: { at: number; data: ThongKeRecord[] } | null = null;
  private readonly THONG_KE_CACHE_TTL_MS = 5 * 60 * 1000;

  private async buildThongKeDataset(): Promise<ThongKeRecord[]> {
    if (
      this.thongKeCache &&
      Date.now() - this.thongKeCache.at < this.THONG_KE_CACHE_TTL_MS
    ) {
      return this.thongKeCache.data;
    }

    const patients = await this.patientRepository.find({
      select: ['id', 'gender', 'dateOfBirth', 'province'],
    });
    const patientById = new Map(patients.map((p) => [p.id, p]));

    const exams = await this.examinationRepository.find({
      select: ['id', 'patientId', 'inputData'],
    });
    // Khớp luật Excel cần input dạng ô Excel (D7/E10/AN10/...), KHÔNG phải inputData thô — dựng qua
    // đúng hàm MeridiansService dùng cho analyze() (buildExcelIndicatorsForInput, xem comment ở đó).
    // Bọc try/catch từng ca: 1 bản ghi dữ liệu hỏng (vd nhiệt độ ngoài 20-40°C) không được làm hỏng
    // cả lượt thống kê — bỏ qua thể bệnh cho riêng ca đó (input rỗng {} → diagnoseMany() trả []).
    const excelInputs: Record<string, unknown>[] = exams.map((e) => {
      try {
        return this.meridiansService.buildExcelIndicatorsForInput(
          e.inputData as unknown as AnalyzeInputDto,
        );
      } catch {
        return {};
      }
    });
    const theBenhMatches =
      await this.benhDongYExcelService.diagnoseMany(excelInputs);

    const records: ThongKeRecord[] = exams.map((exam, i) => {
      const patient = patientById.get(exam.patientId);
      const gender =
        patient?.gender && patient.gender.trim() ? patient.gender : 'Khác';
      const province =
        patient?.province && patient.province.trim()
          ? patient.province
          : 'Không rõ';
      const ageGroup = ageGroupOf(patient?.dateOfBirth);

      let amDuong = '';
      let huThuc = '';
      let khi = '';
      let huyet = '';
      let tonThuongTemp: string[] = [];
      let tonThuongDepth: string[] = [];
      let tonThuongCombo: string[] = [];
      if (exam.inputData) {
        try {
          // Bát Cương/tổn thương tính bằng computeFullAnalysis (PORT NGUYÊN VĂN từ
          // frontend/src/lib/meridianAnalysis.ts — xem comment đầu file util) để khớp tuyệt đối với
          // những gì bác sĩ thấy trên trang kết quả khám từng ca.
          const { diagnosis, organs } = computeFullAnalysis(
            exam.inputData as InputData,
          );
          amDuong = diagnosis.amDuong;
          huThuc = diagnosis.huThuc;
          khi = diagnosis.khi;
          huyet = diagnosis.huyet;
          tonThuongTemp = organs.map((o) =>
            o.temp === 'han'
              ? 'Hàn'
              : o.temp === 'nhiet'
                ? 'Nhiệt'
                : 'Hàn+Nhiệt',
          );
          tonThuongDepth = organs.map((o) =>
            o.depth === 'bieu' ? 'Biểu' : o.depth === 'ly' ? 'Lý' : 'Biểu+Lý',
          );
          tonThuongCombo = organs.map(
            (o, idx) =>
              `${o.organ} · ${tonThuongDepth[idx]} · ${tonThuongTemp[idx]}`,
          );
        } catch {
          // 1 ca dữ liệu hỏng (vd nhiệt độ ngoài 20-40°C, giống guard đã có cho excelInputs ở trên)
          // KHÔNG được làm hỏng cả lượt thống kê — bỏ qua riêng phần Bát Cương/tổn thương của ca đó,
          // các ca còn lại vẫn tính bình thường.
        }
      }
      const theBenh = (theBenhMatches[i] || []).map((m) => m.name);

      return {
        patientId: exam.patientId,
        gender,
        ageGroup,
        province,
        amDuong,
        huThuc,
        khi,
        huyet,
        theBenh,
        tonThuongTemp,
        tonThuongDepth,
        tonThuongCombo,
      };
    });

    this.thongKeCache = { at: Date.now(), data: records };
    return records;
  }

  /**
   * Thống kê ĐỘNG: chọn bất kỳ đại lượng nào làm rows (nhóm theo), cols (so sánh chéo, tuỳ chọn) và
   * filters (thu hẹp tập ca khám trước khi đếm) — xem THONG_KE_DIMENSIONS cho danh sách đại lượng hợp
   * lệ (trường bệnh nhân: giới tính/nhóm tuổi/tỉnh thành; trường bệnh học: Bát Cương + thể bệnh + tổn
   * thương tạng phủ). Đếm theo CA KHÁM (không rút gọn 1 ca/bệnh nhân — theo yêu cầu).
   */
  async thongKe(
    rowsDim = 'amDuong',
    colsDim?: string,
    filtersRaw?: string,
  ): Promise<ThongKeResponse> {
    const records = await this.buildThongKeDataset();

    const rows = THONG_KE_DIM_KEYS.has(rowsDim as keyof ThongKeRecord)
      ? rowsDim
      : 'amDuong';
    const cols =
      colsDim && THONG_KE_DIM_KEYS.has(colsDim as keyof ThongKeRecord)
        ? colsDim
        : null;
    const filters = parseThongKeFilters(filtersRaw);

    const pivot = computePivot(records, rows, cols, filters);

    return {
      totalPatients: new Set(records.map((r) => r.patientId)).size,
      totalExaminations: records.length,
      dimensions: THONG_KE_DIMENSIONS,
      pivot,
    };
  }

  /**
   * Toàn bộ lưới widget (1 pivot 1-chiều / đại lượng) trong 1 LẦN GỌI, mỗi đại lượng tự loại trừ bộ
   * lọc của CHÍNH nó (giống hệt ngữ nghĩa từng widget khi gọi thongKe() riêng lẻ trước đây) — dùng thay
   * cho 11 request rows=<dim> riêng biệt mà frontend từng gọi khi vào tab Thống Kê.
   *
   * Lý do cần gộp: backend chạy trên Vercel serverless (xem backend/api/index.ts) — mỗi request có thể
   * rơi vào 1 instance NGUỘI khác nhau, và 11 request bắn gần như đồng thời dễ khiến Vercel scale ra
   * nhiều instance song song, MỖI instance phải tự bootstrap NestJS + tính lại buildThongKeDataset()
   * (bước nặng: ~9.5k ca khám) từ đầu vì cache trong RAM là theo-từng-instance, không chia sẻ được —
   * khuếch đại đúng phần chậm nhất lên nhiều lần. Gộp còn 1 request giúp chỉ tối đa 1 lần nguội và tính
   * dataset đúng 1 lần, cắt luôn 10 vòng round-trip mạng + (nếu cross-origin) 10 lượt CORS preflight.
   */
  async thongKeGrid(filtersRaw?: string): Promise<ThongKeGridResponse> {
    const records = await this.buildThongKeDataset();
    const filters = parseThongKeFilters(filtersRaw);

    const pivots: Record<string, ThongKePivot> = {};
    for (const dim of THONG_KE_DIMENSIONS) {
      const dimFilters = filters.filter((f) => f.dim !== dim.key);
      pivots[dim.key] = computePivot(records, dim.key, null, dimFilters);
    }

    return {
      totalPatients: new Set(records.map((r) => r.patientId)).size,
      totalExaminations: records.length,
      dimensions: THONG_KE_DIMENSIONS,
      pivots,
    };
  }
}
