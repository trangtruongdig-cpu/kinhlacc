import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { BenhDongYExcelService } from '../controllers/benh-dong-y-excel.controller';
import {
  CreateBenhDongYExcelDto,
  DiagnoseBenhDongYExcelDto,
  UpdateBenhDongYExcelDto,
} from '../models/benh-dong-y-excel.dto';

@Controller('benh-dong-y-excel')
export class BenhDongYExcelRouter {
  constructor(private readonly service: BenhDongYExcelService) {}

  @Post('chan-doan')
  diagnose(@Body() dto: DiagnoseBenhDongYExcelDto & Record<string, unknown>) {
    const input = dto.chi_so && typeof dto.chi_so === 'object' ? dto.chi_so : dto;
    return this.service.diagnose(input as Record<string, unknown>);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  // Phải đứng TRƯỚC @Get(':id').
  @Get('lite')
  findLite(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    return this.service.findLite({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q: q ?? undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateBenhDongYExcelDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBenhDongYExcelDto,
  ) {
    const item = await this.service.update(id, dto);
    return { success: true, data: item };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { success: true };
  }
}
