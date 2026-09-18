import { Controller, Post, Body } from '@nestjs/common';
import { Public } from '../middlewares/auth/public.decorator';
import { TraCuuService } from '../controllers/tra-cuu.controller';

/**
 * TraCuuRouter — TRA TÊN RIÊNG TRONG Y VĂN RA MỤC TỪ (liên kết chéo từ điển).
 * Đọc CÔNG KHAI (@Public): POST /tra-cuu/ten  body { ten: string[] }
 *   -> { "<tên trong y văn>": [{ loai, ten, slug | id }] }
 *
 * Dùng POST (không phải GET) vì mỗi trang hỏi vài chục tên tiếng Việt có
 * dấu — nhồi vào query string thì vượt giới hạn độ dài URL và khó đọc log.
 */
@Controller('tra-cuu')
export class TraCuuRouter {
  constructor(private readonly service: TraCuuService) {}

  @Public()
  @Post('ten')
  traTen(@Body() body: { ten?: string[] }) {
    return this.service.traTen(body?.ten || []);
  }
}
