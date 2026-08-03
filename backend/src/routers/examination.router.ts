import {
  Controller,
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
import { CreateExaminationDto, UpdateExaminationDto } from '../models/examination.dto';
import { ChanDoanLuu, DonThuocLuu } from '../models/examination.model';
import { JwtAuthGuard } from '../middlewares/auth/jwt-auth.guard';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';

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

  @UseGuards(NhanVienGuard)
  @Post()
  async create(@Body() dto: CreateExaminationDto) {
    const item = await this.examinationsService.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @UseGuards(NhanVienGuard)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExaminationDto
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
    const item = await this.examinationsService.doiThoiDiemKham(id, body?.thoiDiemKham ?? null);
    return { success: true, id, thoiDiemKham: item.thoiDiemKham };
  }

  /** Lưu chẩn đoán cho ca khám (D5). Body: { chanDoan: {...} | null }. */
  @UseGuards(NhanVienGuard)
  @Put(':id/chan-doan')
  async saveChanDoan(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { chanDoan?: ChanDoanLuu | null },
  ) {
    const item = await this.examinationsService.saveChanDoan(id, body?.chanDoan ?? null);
    return { success: true, data: item.chanDoan };
  }

  /** Lưu đơn thuốc tùy chỉnh (thang đặc trị) cho ca khám. Body: { donThuoc: {...} | null }. */
  @UseGuards(NhanVienGuard)
  @Put(':id/don-thuoc')
  async saveDonThuoc(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { donThuoc?: DonThuocLuu | null },
  ) {
    const item = await this.examinationsService.saveDonThuoc(id, body?.donThuoc ?? null);
    return { success: true, data: item.donThuoc };
  }

  // Bệnh nhân tự xem hồ sơ khám của mình qua /my-records (bên dưới) — route này chỉ dành cho
  // nhân viên tra cứu theo patientId bất kỳ.
  @UseGuards(NhanVienGuard)
  @Get('patient/:patientId')
  findByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.examinationsService.findByPatient(patientId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-records')
  findMyRecords(@Request() req: any) {
    return this.examinationsService.findByPatient(req.user.id);
  }

  @UseGuards(NhanVienGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.examinationsService.findOne(id);
  }

  @UseGuards(NhanVienGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.examinationsService.remove(id);
    return { success: true };
  }
}
