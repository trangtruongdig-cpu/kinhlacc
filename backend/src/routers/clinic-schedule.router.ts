import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ClinicScheduleService } from '../controllers/clinic-schedule.controller';
import {
  UpdateClinicScheduleConfigDto,
  UpsertClinicDayOverrideDto,
} from '../models/clinic-schedule.dto';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function assertDate(date: string) {
  if (!DATE_RE.test(date)) {
    throw new BadRequestException('Ngày phải có dạng YYYY-MM-DD');
  }
}

@Controller('clinic-schedule')
export class ClinicScheduleRouter {
  constructor(private readonly service: ClinicScheduleService) {}

  @Get('config')
  getConfig() {
    return this.service.getConfig();
  }

  @Put('config')
  updateConfig(@Body() dto: UpdateClinicScheduleConfigDto) {
    return this.service.updateConfig(dto);
  }

  @Get('overrides')
  listOverrides(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.listOverrides(from, to);
  }

  @Get('overrides/:date')
  async getOverride(@Param('date') date: string) {
    assertDate(date);
    const row = await this.service.getOverride(date);
    return row ?? null;
  }

  @Put('overrides/:date')
  upsertOverride(
    @Param('date') date: string,
    @Body() dto: UpsertClinicDayOverrideDto,
  ) {
    assertDate(date);
    return this.service.upsertOverride(date, dto);
  }

  @Delete('overrides/:date')
  async deleteOverride(@Param('date') date: string) {
    assertDate(date);
    await this.service.deleteOverride(date);
    return { success: true };
  }

  @Get('effective/:date')
  getEffective(@Param('date') date: string) {
    assertDate(date);
    return this.service.getEffectiveSchedule(date);
  }

  @Post('generate/:date')
  generate(
    @Param('date') date: string,
    @Query('reconcile') reconcile?: string,
  ) {
    assertDate(date);
    return this.service.generateSlotsForDate(date, reconcile === 'true');
  }

  @Post('generate-range')
  generateRange(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('reconcile') reconcile?: string,
  ) {
    if (!from || !to) {
      throw new BadRequestException('Thiếu tham số from / to');
    }
    assertDate(from);
    assertDate(to);
    return this.service.generateSlotsForRange(from, to, reconcile === 'true');
  }
}
