import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { BenhDongYHienDaiService } from '../controllers/benh-dong-y-hien-dai.controller';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';
import {
  CreateBenhDongYHienDaiDto,
  DiagnoseBenhDongYHienDaiDto,
  UpdateBenhDongYHienDaiDto,
} from '../models/benh-dong-y-hien-dai.dto';

@Controller('benh-dong-y-hien-dai')
export class BenhDongYHienDaiRouter {
  constructor(private readonly service: BenhDongYHienDaiService) {}

  @UseGuards(NhanVienGuard)
  @Post('chan-doan')
  diagnose(@Body() dto: DiagnoseBenhDongYHienDaiDto & Record<string, unknown>) {
    const input = dto.chi_so && typeof dto.chi_so === 'object' ? dto.chi_so : dto;
    return this.service.diagnose(input as Record<string, unknown>);
  }

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
  async create(@Body() dto: CreateBenhDongYHienDaiDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @UseGuards(NhanVienGuard)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBenhDongYHienDaiDto,
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
