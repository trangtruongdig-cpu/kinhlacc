import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Examination, ChanDoanLuu } from '../models/examination.model';
import { CreateExaminationDto, UpdateExaminationDto } from '../models/examination.dto';
import { MeridiansService, AnalyzeInputDto } from './meridian.controller';
import { PatientsService } from './patient.controller';

@Injectable()
export class ExaminationsService implements OnModuleInit {
  private readonly logger = new Logger(ExaminationsService.name);

  constructor(
    @InjectRepository(Examination)
    private readonly examinationRepository: Repository<Examination>,
    private readonly meridiansService: MeridiansService,
    private readonly patientsService: PatientsService,
  ) {}

  /**
   * Cache ca đo dùng cho trang DEMO công khai (trang landing cho khách xem thử).
   * Quét tìm 1 lần rồi giữ trong bộ nhớ tiến trình — lần sau trả ngay, không quét lại.
   */
  private demoExamCache: Examination | null = null;
  /** Cache danh sách ca đo cho slider DEMO (nhiều ca) — quét 1 lần rồi giữ lại. */
  private demoExamsCache: Examination[] | null = null;
  /**
   * Lần quét DEMO đang chạy dở (để pre-warm lúc khởi động và request đầu tiên
   * không quét chồng lên nhau). Quét xong thì xoá về null.
   */
  private demoExamsPromise: Promise<Examination[]> | null = null;

  /**
   * Làm nóng cache DEMO ngay khi backend khởi động: khách vào trang landing
   * không phải chờ lần quét đầu tiên. Chạy nền (không await), lỗi thì chỉ ghi log
   * — pre-warm hỏng không được làm sập tiến trình.
   */
  onModuleInit() {
    void this.findDemoExaminations(5).catch((e) => {
      this.logger.warn(`Không pre-warm được cache demo: ${e?.message ?? e}`);
    });
  }

  /**
   * Gắn kết quả phân tích "tươi" vào một ca đo — đúng các trường mà findOne() gắn,
   * để dùng lại kết quả đã tính sẵn (khỏi phân tích lại lần nữa).
   */
  private attachFreshAnalysis(exam: Examination, fresh: any): Examination {
    exam.amDuong = fresh.am_duong;
    exam.khi = fresh.khi;
    exam.huyet = fresh.huyet;
    exam.flags = fresh.flags;
    exam.syndromes = fresh.syndromes as any[];
    (exam as any).currentSyndromes = fresh.currentSyndromes ?? fresh.syndromes ?? [];
    (exam as any).legacySyndromes = fresh.legacySyndromes ?? [];
    (exam as any).excelSyndromes = fresh.excelSyndromes ?? [];
    (exam as any).modernSyndromes = fresh.modernSyndromes ?? [];
    (exam as any).comparisonRows = fresh.comparisonRows ?? [];
    return exam;
  }

  findAll(): Promise<Examination[]> {
    return this.examinationRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateExaminationDto): Promise<Examination> {
    await this.patientsService.findOne(dto.patientId);

    const analyzeInput: AnalyzeInputDto = {
      tieutruongtrai: dto.tieutruongtrai,
      tieutruongphai: dto.tieutruongphai,
      tamtrai: dto.tamtrai,
      tamphai: dto.tamphai,
      tamtieutrai: dto.tamtieutrai,
      tamtieuphai: dto.tamtieuphai,
      tambaotrai: dto.tambaotrai,
      tambaophai: dto.tambaophai,
      daitrangtrai: dto.daitrangtrai,
      daitrangphai: dto.daitrangphai,
      phetrai: dto.phetrai,
      phephai: dto.phephai,
      bangquangtrai: dto.bangquangtrai,
      bangquangphai: dto.bangquangphai,
      thantrai: dto.thantrai,
      thanphai: dto.thanphai,
      damtrai: dto.damtrai,
      damphai: dto.damphai,
      vitrai: dto.vitrai,
      viphai: dto.viphai,
      cantrai: dto.cantrai,
      canphai: dto.canphai,
      tytrai: dto.tytrai,
      typhai: dto.typhai,
    };

    const result = await this.meridiansService.analyze(analyzeInput);

    const inputData: Record<string, number> = { ...analyzeInput };

    const examination = this.examinationRepository.create({
      patientId: dto.patientId,
      inputData,
      amDuong: result.am_duong,
      khi: result.khi,
      huyet: result.huyet,
      flags: result.flags,
      syndromes: result.syndromes as any[],
      notes: dto.notes ?? null,
    });

    try {
      const saved = await this.examinationRepository.save(examination);
      (saved as any).currentSyndromes = result.currentSyndromes ?? result.syndromes ?? [];
      (saved as any).legacySyndromes = result.legacySyndromes ?? [];
      (saved as any).excelSyndromes = result.excelSyndromes ?? [];
      (saved as any).modernSyndromes = result.modernSyndromes ?? [];
      (saved as any).comparisonRows = result.comparisonRows ?? [];
      return saved;
    } catch (error) {
      // 23505 is PostgreSQL unique_violation.
      // If it's a conflict on the primary key, we try to fix the sequence and retry.
      if (
        error.code === '23505' &&
        (error.detail?.includes('Key (id)') || error.constraint?.includes('PK_'))
      ) {
        console.warn('Primary key sequence out of sync, fixing and retrying...');
        await this.fixSequence();
        const saved = await this.examinationRepository.save(examination);
        (saved as any).currentSyndromes = result.currentSyndromes ?? result.syndromes ?? [];
        (saved as any).legacySyndromes = result.legacySyndromes ?? [];
        (saved as any).excelSyndromes = result.excelSyndromes ?? [];
        (saved as any).comparisonRows = result.comparisonRows ?? [];
        return saved;
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateExaminationDto): Promise<Examination> {
    const existing = await this.findOne(id);

    const patientId = dto.patientId ?? existing.patientId;
    await this.patientsService.findOne(patientId);

    const analyzeInput: AnalyzeInputDto = {
      tieutruongtrai: dto.tieutruongtrai ?? existing.inputData?.tieutruongtrai ?? 0,
      tieutruongphai: dto.tieutruongphai ?? existing.inputData?.tieutruongphai ?? 0,
      tamtrai: dto.tamtrai ?? existing.inputData?.tamtrai ?? 0,
      tamphai: dto.tamphai ?? existing.inputData?.tamphai ?? 0,
      tamtieutrai: dto.tamtieutrai ?? existing.inputData?.tamtieutrai ?? 0,
      tamtieuphai: dto.tamtieuphai ?? existing.inputData?.tamtieuphai ?? 0,
      tambaotrai: dto.tambaotrai ?? existing.inputData?.tambaotrai ?? 0,
      tambaophai: dto.tambaophai ?? existing.inputData?.tambaophai ?? 0,
      daitrangtrai: dto.daitrangtrai ?? existing.inputData?.daitrangtrai ?? 0,
      daitrangphai: dto.daitrangphai ?? existing.inputData?.daitrangphai ?? 0,
      phetrai: dto.phetrai ?? existing.inputData?.phetrai ?? 0,
      phephai: dto.phephai ?? existing.inputData?.phephai ?? 0,
      bangquangtrai: dto.bangquangtrai ?? existing.inputData?.bangquangtrai ?? 0,
      bangquangphai: dto.bangquangphai ?? existing.inputData?.bangquangphai ?? 0,
      thantrai: dto.thantrai ?? existing.inputData?.thantrai ?? 0,
      thanphai: dto.thanphai ?? existing.inputData?.thanphai ?? 0,
      damtrai: dto.damtrai ?? existing.inputData?.damtrai ?? 0,
      damphai: dto.damphai ?? existing.inputData?.damphai ?? 0,
      vitrai: dto.vitrai ?? existing.inputData?.vitrai ?? 0,
      viphai: dto.viphai ?? existing.inputData?.viphai ?? 0,
      cantrai: dto.cantrai ?? existing.inputData?.cantrai ?? 0,
      canphai: dto.canphai ?? existing.inputData?.canphai ?? 0,
      tytrai: dto.tytrai ?? existing.inputData?.tytrai ?? 0,
      typhai: dto.typhai ?? existing.inputData?.typhai ?? 0,
    };

    const result = await this.meridiansService.analyze(analyzeInput);
    const inputData: Record<string, number> = { ...analyzeInput };

    existing.patientId = patientId;
    existing.inputData = inputData;
    existing.amDuong = result.am_duong;
    existing.khi = result.khi;
    existing.huyet = result.huyet;
    existing.flags = result.flags;
    existing.syndromes = result.syndromes as any[];
    if (dto.notes !== undefined) {
      existing.notes = dto.notes;
    }

    const saved = await this.examinationRepository.save(existing);
    (saved as any).currentSyndromes = result.currentSyndromes ?? result.syndromes ?? [];
    (saved as any).legacySyndromes = result.legacySyndromes ?? [];
    (saved as any).excelSyndromes = result.excelSyndromes ?? [];
    (saved as any).comparisonRows = result.comparisonRows ?? [];
    return saved;
  }

  /**
   * Lưu CHẨN ĐOÁN cho 1 ca khám (D5) — chỉ ghi trường chanDoan, KHÔNG phân tích lại
   * kinh lạc (nhẹ). Truyền null để xoá chẩn đoán đã lưu.
   */
  async saveChanDoan(id: number, chanDoan: ChanDoanLuu | null): Promise<Examination> {
    const exam = await this.examinationRepository.findOneBy({ id });
    if (!exam) {
      throw new NotFoundException(`Ca khám #${id} không tồn tại`);
    }
    exam.chanDoan = chanDoan;
    return this.examinationRepository.save(exam);
  }

  async findByPatient(patientId: number): Promise<Examination[]> {
    const exams = await this.examinationRepository.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });

    // Cập nhật chẩn đoán tươi cho toàn bộ danh sách
    for (const exam of exams) {
      if (exam.inputData) {
        try {
          const fresh = await this.meridiansService.analyze(exam.inputData as any);
          exam.amDuong = fresh.am_duong;
          exam.khi = fresh.khi;
          exam.huyet = fresh.huyet;
          exam.flags = fresh.flags;
          exam.syndromes = fresh.syndromes as any[];
          (exam as any).currentSyndromes = fresh.currentSyndromes ?? fresh.syndromes ?? [];
          (exam as any).legacySyndromes = fresh.legacySyndromes ?? [];
          (exam as any).excelSyndromes = fresh.excelSyndromes ?? [];
          (exam as any).modernSyndromes = fresh.modernSyndromes ?? [];
          (exam as any).comparisonRows = fresh.comparisonRows ?? [];
        } catch (e) {}
      }
    }
    return exams;
  }

  async findOne(id: number): Promise<Examination> {
    const examination = await this.examinationRepository.findOneBy({ id });
    if (!examination) {
      throw new NotFoundException(`Ca khám #${id} không tồn tại`);
    }

    // Tự động phân tích lại theo logic mới nhất để luôn trả về kết quả chính xác nhất
    if (examination.inputData) {
      try {
        const fresh = await this.meridiansService.analyze(examination.inputData as any);
        examination.amDuong = fresh.am_duong;
        examination.khi = fresh.khi;
        examination.huyet = fresh.huyet;
        examination.flags = fresh.flags;
        examination.syndromes = fresh.syndromes as any[];
        (examination as any).currentSyndromes = fresh.currentSyndromes ?? fresh.syndromes ?? [];
        (examination as any).legacySyndromes = fresh.legacySyndromes ?? [];
        (examination as any).excelSyndromes = fresh.excelSyndromes ?? [];
        (examination as any).modernSyndromes = fresh.modernSyndromes ?? [];
        (examination as any).comparisonRows = fresh.comparisonRows ?? [];
      } catch (e) {
        console.warn(`Failed to re-analyze examination #${id} on the fly`, e);
      }
    }

    return examination;
  }

  async remove(id: number): Promise<void> {
    const examination = await this.findOne(id);
    await this.examinationRepository.remove(examination);
  }

  /**
   * Chọn 1 ca đo "đẹp" để DEMO công khai (khách chưa đăng nhập xem thử).
   * - Có thể chỉ định cứng qua biến môi trường DEMO_EXAM_ID.
   * - Mặc định: quét 24 ca gần nhất, ưu tiên ca cho ra NHIỀU thể bệnh để demo sinh động.
   * Trả về Examination đã được phân tích đầy đủ (dùng lại kết quả analyze, không phân tích lại).
   * KHÔNG kèm thông tin bệnh nhân — phần ẩn danh do DemoRouter xử lý.
   */
  async findDemoExamination(): Promise<Examination> {
    if (this.demoExamCache) return this.demoExamCache;

    const envId = process.env.DEMO_EXAM_ID ? Number(process.env.DEMO_EXAM_ID) : null;
    if (envId && Number.isFinite(envId)) {
      const chosen = await this.findOne(envId);
      this.demoExamCache = chosen;
      return chosen;
    }

    const candidates = await this.examinationRepository.find({
      order: { createdAt: 'DESC' },
      take: 24,
    });

    // Phân tích MỘT lần cho mỗi ca và giữ lại kết quả — khỏi gọi findOne()
    // để phân tích lại ca được chọn lần nữa.
    let best: { exam: Examination; fresh: any } | null = null;
    let bestScore = -1;
    for (const exam of candidates) {
      if (!exam.inputData) continue;
      try {
        const fresh = await this.meridiansService.analyze(exam.inputData as any);
        const score =
          (fresh.excelSyndromes?.length ?? 0) * 2 +
          (fresh.modernSyndromes?.length ?? 0) +
          (fresh.syndromes?.length ?? 0);
        if (score > bestScore) {
          bestScore = score;
          best = { exam, fresh };
        }
      } catch {
        // Bỏ qua ca lỗi phân tích, thử ca tiếp theo.
      }
    }

    if (!best) {
      const fallback = candidates.find((e) => e.inputData) ?? candidates[0];
      if (!fallback) {
        throw new NotFoundException('Chưa có ca đo nào để demo');
      }
      const fresh = await this.meridiansService.analyze(fallback.inputData as any);
      best = { exam: fallback, fresh };
    }

    const chosen = this.attachFreshAnalysis(best.exam, best.fresh);
    this.demoExamCache = chosen;
    return chosen;
  }

  /**
   * Chọn NHIỀU ca đo "đẹp" cho slider DEMO công khai (khách lướt xem vài ca).
   * - Quét các ca gần nhất, ưu tiên ca ra NHIỀU thể bệnh để demo sinh động.
   * - Trả về tối đa `count` ca, mỗi ca đã phân tích đầy đủ (findOne tự gắn excelSyndromes/modernSyndromes…).
   * KHÔNG kèm thông tin bệnh nhân — phần ẩn danh do DemoRouter xử lý.
   */
  async findDemoExaminations(count = 5): Promise<Examination[]> {
    const want = Math.max(1, Math.min(count, 12));
    if (this.demoExamsCache) return this.demoExamsCache.slice(0, want);
    // Đã có lần quét đang chạy (pre-warm lúc khởi động) → chờ chung, đừng quét lại.
    if (this.demoExamsPromise) return (await this.demoExamsPromise).slice(0, want);

    this.demoExamsPromise = this.scanDemoExaminations();
    try {
      const exams = await this.demoExamsPromise;
      this.demoExamsCache = exams;
      return exams.slice(0, want);
    } finally {
      this.demoExamsPromise = null;
    }
  }

  /** Quét DB chọn các ca đo "đẹp" cho slider DEMO. Phân tích MỖI ca đúng một lần. */
  private async scanDemoExaminations(): Promise<Examination[]> {
    const candidates = await this.examinationRepository.find({
      order: { createdAt: 'DESC' },
      take: 24,
    });

    // Phân tích một lần cho mỗi ca, GIỮ LẠI kết quả để khỏi phân tích lại.
    const scored: { exam: Examination; fresh: any; score: number }[] = [];
    for (const exam of candidates) {
      if (!exam.inputData) continue;
      try {
        const fresh = await this.meridiansService.analyze(exam.inputData as any);
        const score =
          (fresh.excelSyndromes?.length ?? 0) * 2 +
          (fresh.modernSyndromes?.length ?? 0) +
          (fresh.syndromes?.length ?? 0);
        if (score > 0) scored.push({ exam, fresh, score });
      } catch {
        // Bỏ qua ca lỗi phân tích.
      }
    }

    scored.sort((a, b) => b.score - a.score);
    let chosen = scored.slice(0, 12);

    // Fallback: chưa có ca nào ra thể bệnh → lấy đại 1 ca có dữ liệu đo.
    if (chosen.length === 0) {
      const fb = candidates.find((e) => e.inputData) ?? candidates[0];
      if (!fb) throw new NotFoundException('Chưa có ca đo nào để demo');
      const fresh = await this.meridiansService.analyze(fb.inputData as any);
      chosen = [{ exam: fb, fresh, score: 0 }];
    }

    // Dùng LẠI kết quả phân tích đã có — không gọi findOne() để phân tích lại.
    return chosen.map(({ exam, fresh }) => this.attachFreshAnalysis(exam, fresh));
  }

  async fixSequence(): Promise<any> {
    try {
      const tables = [
        { name: 'examinations', seq: 'examinations_id_seq' },
        { name: 'patients', seq: 'patients_id_seq' },
        { name: 'meridian_syndromes', seq: 'meridian_syndromes_id_seq' },
      ];

      for (const table of tables) {
        await this.examinationRepository.query(
          `SELECT setval('${table.seq}', (SELECT COALESCE(MAX(id), 0) + 1 FROM ${table.name}), false)`,
        );
      }
      
      return { success: true, message: 'Sequences fixed for multiple tables' };
    } catch (error) {
      console.error('Failed to fix sequences:', error);
      return { success: false, error: error.message };
    }
  }
}
