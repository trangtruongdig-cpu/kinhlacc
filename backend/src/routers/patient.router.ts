import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PatientsService } from '../controllers/patient.controller';
import { CreatePatientDto, UpdatePatientDto } from '../models/patient.dto';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';
import { assertStaffOrOwner } from '../middlewares/auth/access.util';

@Controller('patients')
export class PatientsRouter {
  constructor(private readonly patientsService: PatientsService) {}

  @UseGuards(NhanVienGuard)
  @Get()
  findPatients(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 0;
    const limitNum = limit ? parseInt(limit, 10) : 0;
    const hasSearch = !!(search && search.trim());
    // Chạy nhánh có lọc khi: phân trang, HOẶC có từ khoá tìm kiếm.
    // (Trước đây thiếu `page` thì rơi vào findAll() và bỏ qua search.)
    if ((pageNum > 0 && limitNum > 0) || hasSearch) {
      return this.patientsService.findPaginated(
        pageNum > 0 ? pageNum : 1,
        limitNum > 0 ? limitNum : 20,
        search,
      );
    }
    return this.patientsService.findAll();
  }

  // Phải đứng TRƯỚC @Get(':id') để route 'thong-ke' không bị match như id.
  // rows/cols = tên đại lượng (xem THONG_KE_DIMENSIONS trong patient.controller.ts) · filters =
  // "dim1:value1,dim2:value2" (AND).
  @UseGuards(NhanVienGuard)
  @Get('thong-ke')
  thongKe(
    @Query('rows') rows?: string,
    @Query('cols') cols?: string,
    @Query('filters') filters?: string,
  ) {
    return this.patientsService.thongKe(rows, cols, filters);
  }

  // Lưới widget (mọi đại lượng cùng lúc) — 1 request thay vì 1 request/đại lượng, xem comment ở
  // PatientsService.thongKeGrid() để biết lý do (né cold-start-stampede trên Vercel serverless).
  @UseGuards(NhanVienGuard)
  @Get('thong-ke/grid')
  thongKeGrid(@Query('filters') filters?: string) {
    return this.patientsService.thongKeGrid(filters);
  }

  // Bệnh nhân tự xem hồ sơ của chính mình (id trong token phải khớp) hoặc nhân viên xem bất kỳ.
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    assertStaffOrOwner(req.user, id);
    return this.patientsService.findOne(id);
  }

  @UseGuards(NhanVienGuard)
  @Post()
  async create(@Body() dto: CreatePatientDto) {
    const item = await this.patientsService.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePatientDto,
    @Request() req: any,
  ) {
    assertStaffOrOwner(req.user, id);
    const item = await this.patientsService.update(id, dto);
    return { success: true, id, data: item };
  }

  @Put(':id/fcm-token')
  async updateFcmToken(
    @Param('id', ParseIntPipe) id: number,
    @Body('fcmToken') fcmToken: string,
    @Request() req: any,
  ) {
    assertStaffOrOwner(req.user, id);
    await this.patientsService.updateFcmToken(id, fcmToken);
    return { success: true };
  }

  @UseGuards(NhanVienGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.patientsService.remove(id);
    return { success: true };
  }
}
