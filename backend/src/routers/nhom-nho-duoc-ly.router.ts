import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { NhomNhoDuocLyService } from '../controllers/nhom-nho-duoc-ly.controller';
import { CreateNhomNhoDuocLyDto, UpdateNhomNhoDuocLyDto } from '../models/duoc-ly.dto';

@Controller('nhom-nho-duoc-ly')
export class NhomNhoDuocLyRouter {
  constructor(private readonly service: NhomNhoDuocLyService) {}

  @Get()
  findAll(@Query('id_nhom_lon') idNhomLon?: string) {
    if (idNhomLon != null && idNhomLon !== '') {
      const parsed = Number(idNhomLon);
      if (Number.isFinite(parsed)) return this.service.findByNhomLon(parsed);
    }
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateNhomNhoDuocLyDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNhomNhoDuocLyDto) {
    const item = await this.service.update(id, dto);
    return { success: true, data: item };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { success: true };
  }
}
