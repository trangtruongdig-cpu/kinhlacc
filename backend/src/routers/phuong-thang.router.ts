import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { Public } from '../middlewares/auth/public.decorator';
import { PhuongThangService } from '../controllers/phuong-thang.controller';

/**
 * PhuongThangRouter — TỪ ĐIỂN BÀI THUỐC CÔNG KHAI (@Public) cho khách chưa đăng nhập.
 * /phuong-thang (list+search) · /phuong-thang/by-vi-thuoc/:id (tra ngược) · /phuong-thang/:slug (chi tiết).
 * LƯU Ý thứ tự: 'by-vi-thuoc/:id' khai báo TRƯỚC ':slug' để không bị nuốt nhầm.
 */
@Controller('phuong-thang')
export class PhuongThangRouter {
  constructor(private readonly service: PhuongThangService) {}

  @Public()
  @Get()
  list(@Query('page') page?: string, @Query('limit') limit?: string, @Query('q') q?: string) {
    return this.service.findLite({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q: q ?? undefined,
    });
  }

  @Public()
  @Get('by-vi-thuoc/:id')
  byViThuoc(@Param('id') id: string) {
    return this.service.findByViThuoc(+id);
  }

  @Public()
  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    const bai = await this.service.findBySlug(slug);
    if (!bai) throw new NotFoundException('Không tìm thấy bài thuốc');
    return bai;
  }
}
