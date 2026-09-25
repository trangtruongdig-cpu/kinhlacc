import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PhacDoChuanService } from '../controllers/phac-do-chuan.controller';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';
import {
  CreatePhacDoChuanDto,
  UpdatePhacDoChuanDto,
} from '../models/phac-do-chuan.dto';

@Controller('phac-do-chuan')
export class PhacDoChuanRouter {
  constructor(private readonly service: PhacDoChuanService) {}

  @Get()
  findAll(@Query('loai') loai?: string) {
    return this.service.findAll(loai);
  }

  // Phải đứng TRƯỚC @Get(':id') để 'theo-huyet' không bị match như id.
  @Get('theo-huyet/:idHuyet')
  findByHuyet(@Param('idHuyet', ParseIntPipe) idHuyet: number) {
    return this.service.findByHuyet(idHuyet);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('hieu_luc') hieuLuc?: string,
  ) {
    const withHieuLuc = hieuLuc === '1' || hieuLuc === 'true';
    return this.service.findOne(id, withHieuLuc);
  }

  @UseGuards(NhanVienGuard)
  @Post()
  async create(@Body() dto: CreatePhacDoChuanDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @UseGuards(NhanVienGuard)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePhacDoChuanDto,
  ) {
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
