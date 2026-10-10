import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../middlewares/auth/public.decorator';
import { ExaminationsService } from '../controllers/examination.controller';
import { PatientsService } from '../controllers/patient.controller';
import { BaiThuocService } from '../controllers/bai-thuoc.controller';
import { PhapTriService } from '../controllers/phap-tri.controller';
import { PhacDoDieuTriService } from '../controllers/phac-do-dieu-tri.controller';
import { BenhCauThanhService } from '../controllers/benh-cau-thanh.controller';
import { BenhDongYExcelService } from '../controllers/benh-dong-y-excel.controller';

/**
 * DemoRouter — các endpoint CÔNG KHAI (@Public) phục vụ trang landing cho khách CHƯA đăng nhập.
 *
 * Mục tiêu: khách xem được tính năng THẬT đang chạy với dữ liệu THẬT (chỉ-xem), nhưng muốn
 * "dùng thật" (lưu hồ sơ, đo cho bệnh nhân của mình…) thì phải đăng nhập.
 *
 * Quan trọng về RIÊNG TƯ: dữ liệu đo là thật nhưng tên/địa chỉ bệnh nhân được ẩn danh ở đây.
 */
/**
 * Ca đo cho hai màn DEMO công khai — chỉ các trường chúng THẬT SỰ đọc (xem `RealCase` trong
 * LandingView và `DemoExam` trong DemoKetQuaDoView). Đây là DANH SÁCH CHO PHÉP: màn demo cần
 * thêm field thì thêm vào đây, đừng quay lại trả nguyên entity.
 *
 * Hai lý do, và lý do thứ hai mới là lý do bắt buộc:
 *  · NẶNG — đo 10/10/2026: 6 ca = 856 KB thô, trong đó `comparisonRows` 335 KB,
 *    `legacySyndromes` 173 KB, `currentSyndromes` 156 KB mà KHÔNG màn nào đọc. Chúng do
 *    `attachFreshAnalysis()` gắn trong bộ nhớ chứ không phải cột DB, nên cắt ở đây là đủ.
 *  · LỘ DỮ LIỆU BỆNH NHÂN THẬT — bản đầy đủ trả ra `patientId`, `notes` ("Triệu chứng: …"),
 *    `kinhDo`/`viDo` (toạ độ GPS lúc đo), `tinhThanh`/`phuongXa`, `donThuoc`, trên một endpoint
 *    @Public không cần đăng nhập. Khâu "ẩn danh" cũ chỉ thay mỗi `fullName`, nên dòng ghi chú
 *    "KHÔNG lộ tên/địa chỉ" bên dưới trước đây đúng một nửa.
 */
function caDoDemoGon(examination: unknown) {
  const e = (examination ?? {}) as Record<string, unknown>;
  return {
    inputData: e.inputData,
    createdAt: e.createdAt,
    thoiDiemKham: e.thoiDiemKham,
    // `syndromes` nguyên bản nặng 156 KB / 6 ca (50 khoá, phần lớn là 36 cột điểm theo tạng
    // phủ), mà màn demo chỉ đọc đúng `phap_tri` — computed `phapTriList` trong LandingView.
    // ⚠️ Đo 10/10/2026: khoá `phap_tri` KHÔNG tồn tại trong dữ liệu (khoá thật là tieuket /
    // chung_trang / trieuchung / benhly / phuyet_chamcuu / bai_thuoc), nên khối "Pháp Trị" ở
    // landing vốn đã luôn rỗng — cắt xuống một trường GIỮ NGUYÊN hành vi đó, không phải gây ra
    // nó. Muốn khối ấy hiện thật thì phải chọn khoá có thật rồi khai lại ở cả hai đầu.
    syndromes: (Array.isArray(e.syndromes) ? e.syndromes : []).map((s) => ({
      phap_tri: (s as Record<string, unknown>)?.phap_tri,
    })),
    excelSyndromes: e.excelSyndromes,
    modernSyndromes: e.modernSyndromes,
  };
}

@Controller('demo')
export class DemoRouter {
  constructor(
    private readonly examinationsService: ExaminationsService,
    private readonly patientsService: PatientsService,
    private readonly baiThuocService: BaiThuocService,
    private readonly phapTriService: PhapTriService,
    private readonly phacDoService: PhacDoDieuTriService,
    private readonly cauThanhService: BenhCauThanhService,
    private readonly benhExcelService: BenhDongYExcelService,
  ) {}

  /** Dữ liệu tham chiếu CÔNG KHAI để render cây thể bệnh + phương huyệt + bài thuốc theo thể (y hệt app):
   *  phác đồ (phương huyệt) + benh_cau_thanh (cây lồng) + danh sách thể kèm bài thuốc. Dữ liệu thư viện. */
  @Public()
  @Get('chan-doan-ref')
  async chanDoanRef() {
    // slim=true: bản đầy đủ kéo nguyên entity benh + huyetVi cho 684 dòng phác đồ ≈ 2,5MB và
    // từng đo thật gây 1 request >17s trên production (thiếu cache + payload nặng cộng dồn).
    // Landing/demo không đọc field nào ngoài slim đã chọn sẵn — xem phac-do-dieu-tri.controller.ts.
    const [phacDo, cauThanh, benhList] = await Promise.all([
      this.phacDoService.findAll(true),
      this.cauThanhService.findAll(),
      this.benhExcelService.findAll(),
    ]);
    // benhList: findAll() còn phục vụ app thật nên KHÔNG đụng vào service — cắt ở đây. Hai màn
    // demo chỉ tra `id → baiThuocList` (xem BenhLite trong LandingView/DemoKetQuaDoView), trong
    // khi bản đầy đủ nặng 206 KB vì kèm trieuChungList 82 KB, nguyen_nhan_list 48 KB,
    // phapTriList 27 KB và cả sqlCaseText/excelFormula (đo 10/10/2026). `phapTriList` hiện trên
    // màn là computed CỤC BỘ, trùng tên chứ không phải field này.
    return {
      phacDo,
      cauThanh,
      benhList: benhList.map((b) => ({
        id: b.id,
        name: b.name,
        baiThuocList: (b.baiThuocList ?? []).map((t) => ({
          id: t.id,
          ten_bai_thuoc: t.ten_bai_thuoc,
        })),
      })),
    };
  }

  /** Một ca đo kinh lạc mẫu (bảng chỉ số nhiệt độ + thể bệnh), ẩn danh bệnh nhân. */
  @Public()
  @Get('ket-qua-do')
  async ketQuaDo() {
    const examination = await this.examinationsService.findDemoExamination();

    let gender: string | null = null;
    let dateOfBirth: string | null = null;
    try {
      const patient = await this.patientsService.findOne(examination.patientId);
      gender = patient?.gender ?? null;
      dateOfBirth = patient?.dateOfBirth ?? null;
    } catch {
      // Bệnh nhân có thể đã bị xoá — vẫn trả về ca đo, chỉ thiếu giới tính/tuổi.
    }

    // Ẩn danh: KHÔNG lộ tên/địa chỉ/điện thoại thật của bệnh nhân.
    const patient = { fullName: 'Bệnh Nhân Mẫu', gender, dateOfBirth };
    return { patient, examination: caDoDemoGon(examination) };
  }

  /** Vài ca đo kinh lạc mẫu cho slider (mỗi ca ẩn danh bệnh nhân). */
  @Public()
  @Get('ket-qua-do-list')
  async ketQuaDoList(@Query('count') count?: string) {
    const n = count ? Number(count) : 5;
    const exams = await this.examinationsService.findDemoExaminations(
      Number.isFinite(n) ? n : 5,
    );

    const cases = await Promise.all(
      exams.map(async (examination, i) => {
        let gender: string | null = null;
        let dateOfBirth: string | null = null;
        try {
          const p = await this.patientsService.findOne(examination.patientId);
          gender = p?.gender ?? null;
          dateOfBirth = p?.dateOfBirth ?? null;
        } catch {
          // Bệnh nhân có thể đã bị xoá — vẫn trả ca đo, chỉ thiếu giới tính/tuổi.
        }
        // Ẩn danh: KHÔNG lộ tên/địa chỉ/điện thoại thật.
        const patient = { fullName: `Bệnh Nhân Mẫu ${i + 1}`, gender, dateOfBirth };
        return { patient, examination: caDoDemoGon(examination) };
      }),
    );

    return { cases };
  }

  /** Một bài thuốc kinh điển kèm phân tích tính vị quy kinh + Quân–Thần–Tá–Sứ. */
  @Public()
  @Get('bai-thuoc')
  async baiThuoc() {
    return this.baiThuocService.findDemoFormula();
  }

  /** Một bài thuốc CỤ THỂ theo id (đủ vị thuốc để phân tích) — landing nhồi vào tab Thể Bệnh. */
  @Public()
  @Get('bai-thuoc/:id')
  async baiThuocById(@Param('id') id: string) {
    return this.baiThuocService.findDemoFormulaById(Number(id));
  }

  /** Vài bài thuốc kinh điển cho slider (mỗi bài đủ chi tiết để phân tích). */
  @Public()
  @Get('bai-thuoc-list')
  async baiThuocList(@Query('count') count?: string) {
    const n = count ? Number(count) : 5;
    const baiThuocList = await this.baiThuocService.findDemoFormulas(
      Number.isFinite(n) ? n : 5,
    );
    return { baiThuocList };
  }

  /**
   * "Bàn xoay biện chứng" số hoá — lát cắt thật của đồ thị Pháp Trị nối Triệu Chứng /
   * Tạng Phủ / Tác Nhân / Thể Bệnh / Bài Thuốc, phục vụ bàn xoay tương tác trên landing.
   */
  @Public()
  @Get('ban-xoay')
  banXoay() {
    return this.phapTriService.findBienChungWheel();
  }

  /** Pháp trị theo BÀI THUỐC → tag định vị (Lục Kinh / Vệ-Khí-Dinh-Huyết / Tam Tiêu / Tác Nhân /
   *  Nội Sinh · tính chất) để dựng đồ hình Định Vị Tab ③ y hệt app. Dữ liệu thư viện, chỉ-xem. */
  @Public()
  @Get('phap-tri-by-bai-thuoc')
  phapTriByBaiThuoc(@Query('baiThuocIds') baiThuocIds?: string) {
    const ids = (baiThuocIds ?? '')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    return this.phapTriService.findByBaiThuoc(ids);
  }
}
