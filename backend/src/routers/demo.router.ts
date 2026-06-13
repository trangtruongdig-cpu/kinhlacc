import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../middlewares/auth/public.decorator';
import { ExaminationsService } from '../controllers/examination.controller';
import { PatientsService } from '../controllers/patient.controller';
import { BaiThuocService } from '../controllers/bai-thuoc.controller';
import { PhapTriService } from '../controllers/phap-tri.controller';

/**
 * DemoRouter — các endpoint CÔNG KHAI (@Public) phục vụ trang landing cho khách CHƯA đăng nhập.
 *
 * Mục tiêu: khách xem được tính năng THẬT đang chạy với dữ liệu THẬT (chỉ-xem), nhưng muốn
 * "dùng thật" (lưu hồ sơ, đo cho bệnh nhân của mình…) thì phải đăng nhập.
 *
 * Quan trọng về RIÊNG TƯ: dữ liệu đo là thật nhưng tên/địa chỉ bệnh nhân được ẩn danh ở đây.
 */
@Controller('demo')
export class DemoRouter {
  constructor(
    private readonly examinationsService: ExaminationsService,
    private readonly patientsService: PatientsService,
    private readonly baiThuocService: BaiThuocService,
    private readonly phapTriService: PhapTriService,
  ) {}

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
    return { patient, examination };
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
        return { patient, examination };
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
}
