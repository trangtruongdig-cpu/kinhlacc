import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ViThuocService } from '../controllers/vi-thuoc.controller';
import { CreateViThuocDto, UpdateViThuocDto } from '../models/dongy-thuoc.dto';

@Controller('vi-thuoc')
export class ViThuocRouter {
  constructor(private readonly service: ViThuocService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  // Phải đứng TRƯỚC @Get(':id') để route 'lite' không bị match như id.
  @Get('lite')
  findLite(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('idNhomNho') idNhomNho?: string,
    @Query('idNhomLon') idNhomLon?: string,
  ) {
    return this.service.findLite({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q: q ?? undefined,
      idNhomNho: idNhomNho != null && idNhomNho !== '' ? Number(idNhomNho) : null,
      idNhomLon: idNhomLon != null && idNhomLon !== '' ? Number(idNhomLon) : null,
    });
  }

  // Đếm số vị thuốc còn thiếu tên khoa học/Hán/pinyin/bộ phận dùng. (Phải đứng TRƯỚC @Get(':id').)
  @Get('thieu-ten-khoa-hoc/count')
  async countMissing() {
    const count = await this.service.countMissingTenKhoaHoc();
    return { success: true, data: { count } };
  }

  // AI điền tên khoa học cho 1 lô vị thiếu (con trỏ afterId). Frontend gọi lặp tới processed=0.
  @Post('ai-dien-ten-khoa-hoc')
  async aiDienTenKhoaHoc(@Body() body: { limit?: number; afterId?: number }) {
    const data = await this.service.aiFillTenKhoaHocBatch(body?.limit ?? 15, body?.afterId ?? 0);
    return { success: true, data };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  async create(@Body() dto: CreateViThuocDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateViThuocDto) {
    const item = await this.service.update(+id, dto);
    return { success: true, data: item };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(+id);
    return { success: true };
  }
}
