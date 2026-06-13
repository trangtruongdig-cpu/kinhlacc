import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { NhomLonDuocLyService } from '../controllers/nhom-lon-duoc-ly.controller';
import { CreateNhomLonDuocLyDto, UpdateNhomLonDuocLyDto } from '../models/duoc-ly.dto';

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

  @Post()
  async create(@Body() dto: CreateNhomLonDuocLyDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNhomLonDuocLyDto) {
    const item = await this.service.update(id, dto);
    return { success: true, data: item };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { success: true };
  }
}
