import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../middlewares/auth/public.decorator';
import { SeoService } from '../controllers/seo.controller';

/**
 * SeoBlogRouter — phục vụ trang bài blog ĐỘNG tại /blog/<slug>/ khi CHƯA có bản tĩnh.
 *
 * nginx: location /blog/ { try_files $uri $uri/ @blog_render; } → bài đã build = file tĩnh
 * (ưu tiên, tốt nhất cho SEO); bài chỉ mới "Đã đăng" trong DB = backend render NGAY tại đây.
 *
 * @Public vì trang blog là nội dung công khai (mở bằng window.open không gửi JWT).
 * Bài chưa "Đã đăng" → 404; "Đã duyệt" → render xem trước nhưng noindex.
 */
@Controller('blog')
export class SeoBlogRouter {
  constructor(private readonly service: SeoService) {}

  @Public()
  @Get(':slug')
  async render(@Param('slug') slug: string, @Res() res: Response): Promise<void> {
    const html = await this.service.renderBlogHtml(slug);
    if (!html) {
      res.status(404).type('html').send(this.service.renderBlogNotFound(slug));
      return;
    }
    res.type('html').send(html);
  }
}
