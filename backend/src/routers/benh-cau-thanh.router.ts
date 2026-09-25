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
import { BenhCauThanhService } from '../controllers/benh-cau-thanh.controller';
import { CreateBenhCauThanhDto, UpdateBenhCauThanhDto } from '../models/benh-cau-thanh.dto';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';

@Controller('benh-cau-thanh')
export class BenhCauThanhRouter {
  constructor(private readonly service: BenhCauThanhService) {}

  /** Danh sách quan hệ thể kép → thể đơn (kèm tên chứng). ?compound=<id> để lọc theo 1 thể kép. */
  @Get()
  findAll(@Query('compound') compound?: string) {
    return this.service.findAll(compound ? parseInt(compound, 10) : undefined);
  }

  @UseGuards(NhanVienGuard)
  @Post()
  async create(@Body() dto: CreateBenhCauThanhDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @UseGuards(NhanVienGuard)
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBenhCauThanhDto) {
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
