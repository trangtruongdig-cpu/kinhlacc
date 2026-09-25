import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ThietChanService } from '../controllers/thiet-chan.controller';
import { CreateThietChanDto, UpdateThietChanDto } from '../models/thiet-chan.dto';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';

@Controller('thiet-chan')
export class ThietChanRouter {
  constructor(private readonly service: ThietChanService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @UseGuards(NhanVienGuard)
  @Post()
  async create(@Body() dto: CreateThietChanDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @UseGuards(NhanVienGuard)
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateThietChanDto) {
    const item = await this.service.update(id, dto);
    return { success: true, data: item };
  }

  @UseGuards(NhanVienGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { success: true };
  }
}
