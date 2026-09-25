import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ExaminationsService } from '../controllers/examination.controller';
import {
  CreateExaminationDto,
  UpdateExaminationDto,
} from '../models/examination.dto';
import { ZodPipe } from '../middlewares/validation/zod.pipe';
import {
  createExaminationSchema,
  updateExaminationSchema,
} from '../models/validation.schema';
import { ChanDoanLuu, DonThuocLuu } from '../models/examination.model';
import { JwtAuthGuard } from '../middlewares/auth/jwt-auth.guard';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';
import { ChanLeTanTaoKhamGuard } from '../middlewares/auth/chan-le-tan-tao-kham.guard';
import {
  assertStaffOrOwner,
  RequestDaXacThuc,
} from '../middlewares/auth/access.util';

@Controller('examinations')
export class ExaminationsRouter {
  constructor(private readonly examinationsService: ExaminationsService) {}

  @UseGuards(NhanVienGuard)
  @Get()
  findAll() {
    return this.examinationsService.findAll();
  }

  @UseGuards(NhanVienGuard)
  @Post('fix-sequence')
  fixSequence() {
    return this.examinationsService.fixSequence();
  }

  @UseGuards(NhanVienGuard, ChanLeTanTaoKhamGuard)
  @Post()
  async create(
    @Body(new ZodPipe(createExaminationSchema)) dto: CreateExaminationDto,
  ) {
    const item = await this.examinationsService.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @UseGuards(NhanVienGuard)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodPipe(updateExaminationSchema)) dto: UpdateExaminationDto,
  ) {
    const item = await this.examinationsService.update(id, dto);
    return { success: true, id, data: item };
  }

  /** Sửa giờ khám của một ca (lùi/tiến). Body: { thoiDiemKham: ISO | null }. */
  @UseGuards(NhanVienGuard)
  @Put(':id/thoi-diem')
  async doiThoiDiemKham(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { thoiDiemKham?: string | null },
  ) {
    const item = await this.examinationsService.doiThoiDiemKham(
      id,
      body?.thoiDiemKham ?? null,
    );
    return { success: true, id, thoiDiemKham: item.thoiDiemKham };
  }

  /** Lưu chẩn đoán cho ca khám (D5). Body: { chanDoan: {...} | null }. */
  @UseGuards(NhanVienGuard)
  @Put(':id/chan-doan')
  async saveChanDoan(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { chanDoan?: ChanDoanLuu | null },
  ) {
    const item = await this.examinationsService.saveChanDoan(
      id,
      body?.chanDoan ?? null,
    );
    return { success: true, data: item.chanDoan };
  }

  /** Lưu đơn thuốc tùy chỉnh (thang đặc trị) cho ca khám. Body: { donThuoc: {...} | null }. */
  @UseGuards(NhanVienGuard)
  @Put(':id/don-thuoc')
  async saveDonThuoc(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { donThuoc?: DonThuocLuu | null },
  ) {
    const item = await this.examinationsService.saveDonThuoc(
      id,
      body?.donThuoc ?? null,
    );
    return { success: true, data: item.donThuoc };
  }

  // Bệnh nhân tự xem hồ sơ khám của mình qua /my-records (bên dưới) — route này chỉ dành cho
  // nhân viên tra cứu theo patientId bất kỳ, hoặc bệnh nhân tự tra cứu.
  @UseGuards(JwtAuthGuard)
  @Get('patient/:patientId')
  findByPatient(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Request() req: RequestDaXacThuc,
  ) {
    assertStaffOrOwner(req.user, patientId);
    return this.examinationsService.findByPatient(patientId);
  }

  /**
   * Bệnh nhân tự xem phiếu đo của CHÍNH MÌNH.
   *
   * Chặn token nhân viên: `req.user.id` của tài khoản nhân viên nằm ở KHÔNG GIAN SỐ KHÁC với
   * id bệnh nhân, nên nhân viên gọi route này sẽ nhận về phiếu đo của bệnh nhân TRÙNG SỐ id —
   * không leo thang quyền (nhân viên vốn xem được mọi hồ sơ) nhưng là dữ liệu của người khác,
   * trả ra im lặng, không ai báo. Nhân viên phải dùng GET /examinations/patient/:patientId.
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-records')
  findMyRecords(@Request() req: RequestDaXacThuc) {
    if (req.user?.role !== 'patient' || req.user?.id == null) {
      throw new ForbiddenException(
        'Route này chỉ dành cho tài khoản bệnh nhân. Nhân viên hãy dùng /examinations/patient/:patientId.',
      );
    }
    return this.examinationsService.findByPatient(Number(req.user.id));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestDaXacThuc,
  ) {
    const exam = await this.examinationsService.findOne(id);
    if (exam) {
      assertStaffOrOwner(req.user, exam.patientId);
    }
    return exam;
  }

  @UseGuards(NhanVienGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.examinationsService.remove(id);
    return { success: true };
  }
}
