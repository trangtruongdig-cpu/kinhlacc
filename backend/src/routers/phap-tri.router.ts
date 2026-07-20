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
} from '@nestjs/common';
import { PhapTriService } from '../controllers/phap-tri.controller';
import { CreatePhapTriDto, UpdatePhapTriDto } from '../models/phap-tri.dto';

@Controller('phap-tri')
export class PhapTriRouter {
  constructor(private readonly service: PhapTriService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  // Phải đứng TRƯỚC @Get(':id') để route 'options' không bị match như id.
  @Get('options')
  findOptions() {
    return this.service.findOptions();
  }

  // Phải đứng TRƯỚC @Get(':id') để route 'lite' không bị match như id.
  @Get('lite')
  findLite(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('chungBenhId') chungBenhId?: string,
    @Query('tangPhuIds') tangPhuIds?: string,
    @Query('tonThuongTacNhans') tonThuongTacNhans?: string,
    @Query('focusId') focusId?: string,
    @Query('withStats') withStats?: string,
  ) {
    const cat = category === 'dong-y' || category === 'tay-y' ? category : 'all';
    const parseIdList = (raw?: string): number[] => {
      if (raw == null || raw === '') return [];
      return raw
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
    };
    const parseStrList = (raw?: string): string[] => {
      if (raw == null || raw === '') return [];
      return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    };
    // withStats: explicit param hoặc tự động bật khi đang ở tab dong-y/tay-y
    const loadStats = withStats === 'true' || cat !== 'all';
    return this.service.findLite({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q: q ?? undefined,
      category: cat,
      chungBenhId: chungBenhId != null && chungBenhId !== '' ? Number(chungBenhId) : null,
      tangPhuIds: parseIdList(tangPhuIds),
      tonThuongTacNhans: parseStrList(tonThuongTacNhans),
      focusId: focusId != null && focusId !== '' ? Number(focusId) : null,
      withStats: loadStats,
    });
  }

  // Gợi ý điều trị theo Bát Cương TÍNH TOÁN (từ số đo) → nhãn "Tính chất" → Pháp Trị/Bài Thuốc/
  // Phương Huyệt đã gắn nhãn đó. Phải đứng TRƯỚC @Get(':id').
  @Get('goi-y-bat-cuong')
  findGoiYBatCuong(@Query('tags') tags?: string) {
    const parseStrList = (raw?: string): string[] => {
      if (raw == null || raw === '') return [];
      return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    };
    return this.service.findGoiYBatCuong(parseStrList(tags));
  }

  // Định vị bệnh: từ BÀI THUỐC (thể bệnh → bài thuốc là link đúng) truy ra PHÁP TRỊ chứa bài đó
  // → tag luc_kinh (giai đoạn Lục Kinh / tác nhân / tính chất). Phải đứng TRƯỚC @Get(':id').
  @Get('by-bai-thuoc')
  findByBaiThuoc(@Query('baiThuocIds') baiThuocIds?: string) {
    const ids = (baiThuocIds ?? '')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    return this.service.findByBaiThuoc(ids);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreatePhapTriDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePhapTriDto,
  ) {
    const item = await this.service.update(id, dto);
    return { success: true, data: item };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { success: true };
  }
}
