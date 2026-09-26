import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { ThamDinhService } from '../controllers/tham-dinh.controller';
import { QuanTriGuard } from '../middlewares/auth/quan-tri.guard';
import type { LuocKeCa } from '../models/tham-dinh.dto';

/**
 * Toàn bộ endpoint đều là của Quản Trị.
 *
 * ⚠️ JwtAuthGuard toàn cục KHÔNG đủ: token bệnh nhân cũng là token hợp lệ. Mọi route GHI
 * phải có guard vai trò riêng — đây là chỗ từng hở 85 route.
 */
@Controller('tham-dinh')
@UseGuards(QuanTriGuard)
export class ThamDinhRouter {
  constructor(private readonly thamDinh: ThamDinhService) {}

  /** Chạy tay một ca soi. `gioiHan` để thử trên một nhúm mục trước khi chạy cả kho. */
  @Post('chay')
  chay(@Query('gioiHan') gioiHan?: string): Promise<LuocKeCa> {
    const n = Number(gioiHan);
    return this.thamDinh.chayCa(Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
  }

  /** Thử trên 50 mục — dùng lúc nghiệm thu, không đụng cả kho. */
  @Post('chay-thu')
  chayThu(): Promise<LuocKeCa> {
    return this.thamDinh.chayCa(50);
  }

  @Get('trang-thai')
  trangThai(): { sanSang: boolean } {
    return { sanSang: true };
  }
}
