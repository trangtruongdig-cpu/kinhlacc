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
import { PhacDoDieuTriService } from '../controllers/phac-do-dieu-tri.controller';
import { CreatePhacDoDieuTriDto, UpdatePhacDoDieuTriDto } from '../models/phac-do-dieu-tri.dto';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';

@Controller('phac-do-dieu-tri')
export class PhacDoDieuTriRouter {
  constructor(private readonly service: PhacDoDieuTriService) {}

  @Get()
  findAll(@Query('benh') benhId?: string, @Query('slim') slim?: string) {
    if (benhId) {
      return this.service.findByBenh(parseInt(benhId, 10));
    }
    return this.service.findAll(slim === '1' || slim === 'true');
  }

  /** Phương huyệt gom theo thể bệnh (cấu trúc + nguyên văn dữ liệu cũ). Phải đứng TRƯỚC @Get(':id'). */
  @Get('phuong-huyet-the')
  findPhuongHuyetTheBenh() {
    return this.service.findPhuongHuyetTheBenh();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @UseGuards(NhanVienGuard)
  @Post()
  async create(@Body() dto: CreatePhacDoDieuTriDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.idPhacDo, data: item };
  }

  @UseGuards(NhanVienGuard)
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePhacDoDieuTriDto) {
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
