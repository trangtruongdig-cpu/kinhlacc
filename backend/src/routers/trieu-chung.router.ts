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
import { TrieuChungService } from '../controllers/trieu-chung.controller';
import { CreateTrieuChungDto, UpdateTrieuChungDto } from '../models/trieu-chung.dto';

@Controller('trieu-chung')
export class TrieuChungRouter {
  constructor(private readonly service: TrieuChungService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('stats') stats?: string,
    @Query('category') category?: string,
    @Query('tangPhu') tangPhu?: string,
    @Query('tonThuong') tonThuong?: string,
    @Query('chungBenh') chungBenh?: string,
  ) {
    if (stats === '1' || stats === 'true') {
      return this.service.findAllWithStats({
        category: category === 'dong-y' || category === 'tay-y' ? category : 'all',
        tangPhuIds: (tangPhu ?? '')
          .split(',')
          .map((x) => parseInt(x, 10))
          .filter((x) => Number.isFinite(x) && x > 0),
        // Tên Tổn Thương ngăn cách bằng '||' (tránh đụng dấu phẩy trong tên).
        tonThuong: (tonThuong ?? '')
          .split('||')
          .map((s) => s.trim())
          .filter(Boolean),
        chungBenhIds: (chungBenh ?? '')
          .split(',')
          .map((x) => parseInt(x, 10))
          .filter((x) => Number.isFinite(x) && x > 0),
      });
    }
    const pageNum = page ? parseInt(page, 10) : 0;
    const limitNum = limit ? parseInt(limit, 10) : 0;
    if (pageNum > 0 && limitNum > 0) {
      return this.service.findPaginated(pageNum, limitNum, search);
    }
    return this.service.findAll();
  }

  /**
   * Suy luận chẩn đoán từ danh sách triệu chứng.
   * Body: { trieu_chung_ids: number[] } (chấp nhận alias `ids`).
   * Trả về xếp hạng pháp trị (theo thể bệnh) và bệnh Tây Y kèm % tương đồng.
   */
  @Post('chan-doan')
  diagnose(@Body() body: { trieu_chung_ids?: number[]; ids?: number[] }) {
    const ids = body?.trieu_chung_ids ?? body?.ids ?? [];
    return this.service.diagnose(Array.isArray(ids) ? ids : []);
  }

  /**
   * Bảng phân biệt thể bệnh: dữ liệu đối chiếu triệu chứng giữa các thể ứng viên.
   * Phải đứng TRƯỚC @Get(':id') để 'phan-biet' không bị match như id.
   */
  @Get('phan-biet')
  phanBiet(@Query('phapTriIds') phapTriIds?: string) {
    const ids = (phapTriIds ?? '')
      .split(',')
      .map((x) => parseInt(x, 10))
      .filter((x) => Number.isFinite(x) && x > 0);
    return this.service.phanBietByPhapTriIds(ids);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateTrieuChungDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTrieuChungDto,
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
