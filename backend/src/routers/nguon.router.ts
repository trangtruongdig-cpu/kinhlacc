import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { Public } from '../middlewares/auth/public.decorator';
import { NguonService, NguonInput } from '../controllers/nguon.controller';

/**
 * NguonRouter — SỔ CÁI TRÍCH DẪN (Thư Mục Nguồn).
 * Đọc CÔNG KHAI (@Public): / (list+search+lọc loại), /:slug (chi tiết + tra ngược).
 * Quản trị (cần đăng nhập): POST / (thêm), PATCH /:id (sửa), DELETE /:id (xoá),
 *   POST /merge (gộp biến thể), GET /suggest-duplicates (gợi ý nghi trùng).
 * THỨ TỰ: 'suggest-duplicates' khai báo TRƯỚC ':slug' để không bị nuốt nhầm.
 */
@Controller('nguon')
export class NguonRouter {
  constructor(private readonly service: NguonService) {}

  @Public()
  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('loai') loai?: string,
  ) {
    return this.service.findLite({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q: q ?? undefined,
      loai: loai ?? undefined,
    });
  }

  @Public()
  @Get('by-vi-thuoc/:id')
  byViThuoc(@Param('id') id: string) {
    return this.service.findByViThuoc(+id);
  }

  @Public()
  @Get('by-phuong-thang/:id')
  byPhuongThang(@Param('id') id: string) {
    return this.service.findByPhuongThang(+id);
  }

  // ── Quản trị (cần JWT — không @Public) ──
  @Get('suggest-duplicates')
  suggest(@Query('loai') loai?: string, @Query('limit') limit?: string) {
    return this.service.suggestDuplicates({ loai: loai ?? undefined, limit: limit ? Number(limit) : undefined });
  }

  @Post()
  create(@Body() body: NguonInput) {
    return this.service.create(body || {});
  }

  @Post('merge')
  merge(@Body() body: { fromId: number; intoId: number }) {
    return this.service.merge(Number(body?.fromId), Number(body?.intoId));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: NguonInput) {
    return this.service.update(+id, body || {});
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }

  @Public()
  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }
}
