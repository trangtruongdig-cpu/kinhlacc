import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CongDungService } from '../controllers/cong-dung.controller';
import { CreateCongDungDto, UpdateCongDungDto } from '../models/cong-dung.dto';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';

@Controller('cong-dung')
export class CongDungRouter {
  constructor(private readonly service: CongDungService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @UseGuards(NhanVienGuard)
  @Post()
  async create(@Body() dto: CreateCongDungDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @UseGuards(NhanVienGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCongDungDto) {
    const item = await this.service.update(+id, dto);
    return { success: true, data: item };
  }

  @UseGuards(NhanVienGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(+id);
    return { success: true };
  }
}
