import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../middlewares/auth/public.decorator';
import { ViThuocService } from '../controllers/vi-thuoc.controller';

/**
 * DuocLieuRouter — TỪ ĐIỂN DƯỢC LIỆU CÔNG KHAI (@Public) cho khách chưa đăng nhập.
 * Tái dùng ViThuocService; chỉ phơi bày thao tác đọc (list + detail).
 */
@Controller('duoc-lieu')
export class DuocLieuRouter {
  constructor(private readonly service: ViThuocService) {}

  @Public()
  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    return this.service.findLite({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q: q ?? undefined,
      idNhomNho: null,
      idNhomLon: null,
    });
  }

  @Public()
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.findOne(+id);
  }
}
