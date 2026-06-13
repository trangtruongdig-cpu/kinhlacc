import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { GscService } from '../controllers/gsc.controller';
import { QuanTriGuard } from '../middlewares/auth/quan-tri.guard';

/**
 * Cổng HTTP cho Google Search Console. Tất cả nằm dưới /seo/gsc/*.
 * Guard JWT là TOÀN CỤC; QuanTriGuard siết thêm: CHỈ Quản Trị Viên — vì đây là dữ liệu
 * SEO nội bộ + thao tác gửi sitemap (ghi lên tài khoản Google của phòng khám).
 */
@UseGuards(QuanTriGuard)
@Controller('seo/gsc')
export class GscRouter {
  constructor(private readonly service: GscService) {}

  // Gọi đầu tiên: đã kết nối được tới Google chưa, property nào có quyền.
  @Get('status')
  async status() {
    const data = await this.service.status();
    return { success: true, data };
  }

  // Tổng quan + diễn biến theo ngày (view "website là thực thể sống").
  @Get('summary')
  async summary(@Query('days') days?: string) {
    const data = await this.service.summary(toInt(days, 28));
    return { success: true, data };
  }

  // Top từ khoá đưa người dùng tới site.
  @Get('top-queries')
  async topQueries(@Query('days') days?: string, @Query('limit') limit?: string) {
    const data = await this.service.topQueries(toInt(days, 28), toInt(limit, 100));
    return { success: true, data };
  }

  // Top trang nhận traffic tìm kiếm.
  @Get('top-pages')
  async topPages(@Query('days') days?: string, @Query('limit') limit?: string) {
    const data = await this.service.topPages(toInt(days, 28), toInt(limit, 100));
    return { success: true, data };
  }

  // Từ khoá bị "ăn thịt" (nhiều trang tranh 1 từ khoá).
  @Get('cannibalization')
  async cannibalization(
    @Query('days') days?: string,
    @Query('minPages') minPages?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.service.cannibalization(toInt(days, 28), toInt(minPages, 2), toInt(limit, 50));
    return { success: true, data };
  }

  // "Sắp Lên Top" (striking distance): từ khoá hạng 5–20 + đủ hiển thị = cơ hội vàng để bồi/viết.
  @Get('striking-distance')
  async strikingDistance(
    @Query('days') days?: string,
    @Query('posMin') posMin?: string,
    @Query('posMax') posMax?: string,
    @Query('minImpr') minImpr?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.service.strikingDistance(
      toInt(days, 28),
      toInt(posMin, 5),
      toInt(posMax, 20),
      toInt(minImpr, 10),
      toInt(limit, 50),
    );
    return { success: true, data };
  }

  // Danh sách sitemap + tình trạng đọc.
  @Get('sitemaps')
  async sitemaps() {
    const data = await this.service.listSitemaps();
    return { success: true, data };
  }

  // Gửi (hoặc gửi lại) 1 sitemap. body: { feedpath: "https://kinhlac.online/sitemap.xml" }
  @Post('sitemaps')
  async submitSitemap(@Body('feedpath') feedpath: string) {
    const data = await this.service.submitSitemap(feedpath);
    return { success: true, data };
  }

  // Kiểm tra 1 URL đã được Google index chưa. body: { url: "https://kinhlac.online/blog/..." }
  @Post('inspect')
  async inspect(@Body('url') url: string) {
    const data = await this.service.inspectUrl(url);
    return { success: true, data };
  }
}

/** Ép query string sang số nguyên, có giá trị mặc định khi rỗng/sai. */
function toInt(v: string | undefined, def: number): number {
  const n = parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : def;
}
