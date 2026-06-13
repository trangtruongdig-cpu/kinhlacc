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
    const data = await this.service.bookMy(id, req.user.id, dto);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/my-cancel')
  async cancelMy(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const data = await this.service.cancelMy(id, req.user.id);
    return { success: true, data };
  }

  // --- Admin ---
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

  @Get('summary')
  summary(@Query('from') from: string, @Query('to') to: string) {
    if (!from || !to) {
      throw new BadRequestException('Cần tham số from + to');
    }
    assertDate(from);
    assertDate(to);
    return this.service.summaryByDate(from, to);
  }

  // Lấy toàn bộ vé của 1 bệnh nhân (cho hồ sơ bệnh nhân).
  // Khai báo TRƯỚC @Get(':id') để Nest không nhầm "patient" là một id.
  @Get('patient/:id')
  findByPatient(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByPatient(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSlotDto,
  ) {
    return this.service.update(id, dto);
  }

  @Put(':id/close')
  async close(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.close(id);
    return { success: true, data };
  }

  @Put(':id/open')
  async open(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.open(id);
    return { success: true, data };
  }

  @Post(':id/book')
  async book(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BookSlotDto,
  ) {
    const data = await this.service.book(id, dto);
    return { success: true, data };
  }

  @Put(':id/cancel')
  async cancel(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.cancel(id);
    return { success: true, data };
  }

  @Put(':id/complete')
  async complete(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.complete(id);
    return { success: true, data };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { success: true };
  }
}
