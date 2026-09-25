import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { MachChanService } from '../controllers/mach-chan.controller';
import { CreateMachChanDto, UpdateMachChanDto } from '../models/mach-chan.dto';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';

@Controller('mach-chan')
export class MachChanRouter {
  constructor(private readonly service: MachChanService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @UseGuards(NhanVienGuard)
  @Post()
  async create(@Body() dto: CreateMachChanDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @UseGuards(NhanVienGuard)
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMachChanDto) {
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
