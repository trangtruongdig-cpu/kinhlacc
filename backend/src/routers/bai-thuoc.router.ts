import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { BaiThuocService } from '../controllers/bai-thuoc.controller';
import { CreateBaiThuocDto, UpdateBaiThuocDto } from '../models/dongy-thuoc.dto';

@Controller('bai-thuoc')
export class BaiThuocRouter {
  constructor(private readonly service: BaiThuocService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  // Phải đứng TRƯỚC @Get(':id') để route 'options' không bị match như id.
  @Get('options')
  findOptions() {
    return this.service.findOptions();
  }

  // Phải đứng TRƯỚC @Get(':id') để route 'lite' không bị match như id.
  @Get('lite')
  findLite(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('chungBenhId') chungBenhId?: string,
    @Query('tangPhuIds') tangPhuIds?: string,
    @Query('tonThuongTacNhans') tonThuongTacNhans?: string,
    @Query('focusId') focusId?: string,
  ) {
    const cat = category === 'dong-y' || category === 'tay-y' ? category : 'all';
    const cbId = chungBenhId != null && chungBenhId !== '' ? Number(chungBenhId) : null;
    const parseIdList = (raw?: string): number[] => {
      if (raw == null || raw === '') return [];
      return raw
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
    };
    const parseStrList = (raw?: string): string[] => {
      if (raw == null || raw === '') return [];
      return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    };
    return this.service.findLite({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q: q ?? undefined,
      category: cat,
      chungBenhId: cbId,
      tangPhuIds: parseIdList(tangPhuIds),
      tonThuongTacNhans: parseStrList(tonThuongTacNhans),
      focusId: focusId != null && focusId !== '' ? Number(focusId) : null,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  async create(@Body() dto: CreateBaiThuocDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateBaiThuocDto) {
    const item = await this.service.update(+id, dto);
    return { success: true, data: item };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(+id);
    return { success: true };
  }

  @Post(':id/analyze')
  async analyze(@Param('id') id: string) {
    return this.service.analyzeBaiThuoc(+id);
  }
}
