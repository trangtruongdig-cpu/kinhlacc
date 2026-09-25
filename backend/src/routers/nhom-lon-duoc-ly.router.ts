import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { NhomLonDuocLyService } from '../controllers/nhom-lon-duoc-ly.controller';
import { CreateNhomLonDuocLyDto, UpdateNhomLonDuocLyDto } from '../models/duoc-ly.dto';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';

@Controller('nhom-lon-duoc-ly')
export class NhomLonDuocLyRouter {
  constructor(private readonly service: NhomLonDuocLyService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @UseGuards(NhanVienGuard)
  @Post()
  async create(@Body() dto: CreateNhomLonDuocLyDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @UseGuards(NhanVienGuard)
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNhomLonDuocLyDto) {
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
