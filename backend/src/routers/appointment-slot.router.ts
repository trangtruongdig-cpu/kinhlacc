import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { AppointmentSlotsService } from '../controllers/appointment-slot.controller';
import {
  BookSlotDto,
  UpdateSlotDto,
} from '../models/appointment-slot.dto';
import { JwtAuthGuard } from '../middlewares/auth/jwt-auth.guard';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function assertDate(date: string) {
  if (!DATE_RE.test(date)) {
    throw new BadRequestException('Ngày phải có dạng YYYY-MM-DD');
  }
}

@Controller('appointment-slots')
export class AppointmentSlotsRouter {
  constructor(private readonly service: AppointmentSlotsService) {}

  // --- Patient ---
  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMy(@Request() req: any) {
    return this.service.findMy(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/my-book')
  async bookMy(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() dto: BookSlotDto,
  ) {
    // `data` = ô giờ (để vá lưới giờ), `booking` = lượt đặt vừa tạo (để vá "Lịch của tôi").
    // Trả đủ ở đây thì máy khách khỏi gọi lại 2 API sau mỗi lần đặt.
    const { slot, booking } = await this.service.bookMy(id, req.user.id, dto);
    return { success: true, data: slot, booking };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/my-cancel')
  async cancelMy(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const { slot, booking } = await this.service.cancelMy(id, req.user.id);
    return { success: true, data: booking, slot };
  }

  @UseGuards(JwtAuthGuard)
  @Get('available')
  available(@Query('date') date: string) {
    if (!date) throw new BadRequestException('Cần tham số date');
    assertDate(date);
    return this.service.findAvailable(date);
  }

  // --- Admin ---
  @UseGuards(NhanVienGuard)
  @Get()
  async list(
    @Query('date') date?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (date) {
      assertDate(date);
      return this.service.findByDate(date);
    }
    if (from && to) {
      assertDate(from);
      assertDate(to);
      return this.service.findByRange(from, to);
    }
    throw new BadRequestException('Cần tham số date hoặc from+to');
  }

  @UseGuards(NhanVienGuard)
  @Get('summary')
  summary(@Query('from') from: string, @Query('to') to: string) {
    if (!from || !to) {
      throw new BadRequestException('Cần tham số from + to');
    }
    assertDate(from);
    assertDate(to);
    return this.service.summaryByDate(from, to);
  }

  // Lịch sử lượt đặt trong 1 ngày — cho bảng ngày hiện dấu "từng huỷ".
  // Khai báo TRƯỚC @Get(':id') để Nest không nhầm "bookings" là một id.
  @UseGuards(NhanVienGuard)
  @Get('bookings')
  bookingsByDate(@Query('date') date: string) {
    if (!date) throw new BadRequestException('Cần tham số date');
    assertDate(date);
    return this.service.findBookingsByDate(date);
  }

  // Lấy toàn bộ vé của 1 bệnh nhân (cho hồ sơ bệnh nhân, phía nhân viên).
  // Bệnh nhân tự xem vé của mình qua /my (bên trên).
  // Khai báo TRƯỚC @Get(':id') để Nest không nhầm "patient" là một id.
  @UseGuards(NhanVienGuard)
  @Get('patient/:id')
  findByPatient(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByPatient(id);
  }

  @UseGuards(NhanVienGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @UseGuards(NhanVienGuard)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSlotDto,
  ) {
    return this.service.update(id, dto);
  }

  @UseGuards(NhanVienGuard)
  @Put(':id/close')
  async close(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.close(id);
    return { success: true, data };
  }

  @UseGuards(NhanVienGuard)
  @Put(':id/open')
  async open(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.open(id);
    return { success: true, data };
  }

  @UseGuards(NhanVienGuard)
  @Post(':id/book')
  async book(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BookSlotDto,
  ) {
    const { slot } = await this.service.book(id, dto);
    return { success: true, data: slot };
  }

  @UseGuards(NhanVienGuard)
  @Put(':id/cancel')
  async cancel(@Param('id', ParseIntPipe) id: number) {
    // `data` là Ô GIỜ sau khi huỷ (đã trả về trống) — bảng ngày của nhân viên vá thẳng từ đây,
    // khỏi gọi lại cả ngày. `booking` là lượt đặt vừa bị huỷ, giữ lại cho lịch sử.
    const { slot, booking } = await this.service.cancel(id, 'STAFF');
    return { success: true, data: slot, booking };
  }

  @UseGuards(NhanVienGuard)
  @Put(':id/complete')
  async complete(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.complete(id);
    return { success: true, data };
  }

  @UseGuards(NhanVienGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { success: true };
  }
}
