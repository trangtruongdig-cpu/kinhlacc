import { Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';

import { ThamDinhService } from '../controllers/tham-dinh.controller';
import { ThamDinhThayThuocService } from '../controllers/tham-dinh-thay-thuoc.controller';
import { ThamDinhCmsService } from '../controllers/tham-dinh-cms.service';
import { QuanTriGuard } from '../middlewares/auth/quan-tri.guard';
import type { LuocKeCa, LuocKeCaThayThuoc } from '../models/tham-dinh.dto';
import type { BoLuatVanPhong } from '../utils/tham-dinh-luat.util';

/**
 * Toàn bộ endpoint đều là của Quản Trị.
 *
 * ⚠️ JwtAuthGuard toàn cục KHÔNG đủ: token bệnh nhân cũng là token hợp lệ. Mọi route GHI
 * phải có guard vai trò riêng — đây là chỗ từng hở 85 route.
 */
@Controller('tham-dinh')
@UseGuards(QuanTriGuard)
export class ThamDinhRouter {
  constructor(
    private readonly thamDinh: ThamDinhService,
    private readonly thayThuoc: ThamDinhThayThuocService,
    private readonly cms: ThamDinhCmsService,
  ) {}

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

  // ══ Lớp 2 — thầy thuốc ═══════════════════════════════════════════════════════════

  /** Bước 0 — đọc mười mục viết đạt, rút bộ luật văn phong, lưu bản CHỜ DUYỆT. */
  @Post('lap-thuoc')
  lapThuoc(): Promise<{ phienBan: number | null; soDieu: number; loi: string[] }> {
    return this.thayThuoc.lapThuoc();
  }

  /** Bộ luật mới nhất. `daDuyet=1` để lấy bản đang có hiệu lực. */
  @Get('bo-luat')
  async boLuat(@Query('daDuyet') daDuyet?: string): Promise<BoLuatVanPhong | null> {
    await this.cms.moKetNoi();
    try {
      await this.cms.dungBang();
      return await this.cms.docBoLuat(daDuyet === '1');
    } finally {
      await this.cms.dongKetNoi();
    }
  }

  /**
   * Duyệt một bản bộ luật. Đây là nút mà phép nghiệm thu số 2 của spec nói tới: lớp 2
   * không chạy được cho tới khi có người bấm.
   */
  @Post('bo-luat/:phienBan/duyet')
  async duyetBoLuat(@Param('phienBan', ParseIntPipe) phienBan: number): Promise<{ ok: true }> {
    await this.cms.moKetNoi();
    try {
      await this.cms.dungBang();
      await this.cms.duyetBoLuat(phienBan);
      return { ok: true };
    } finally {
      await this.cms.dongKetNoi();
    }
  }

  /** Chạy tay một ca lớp 2. `gioiHan` để thử vài mục trước khi thả cả hàng đợi. */
  @Post('soi-ky')
  soiKy(@Query('gioiHan') gioiHan?: string): Promise<LuocKeCaThayThuoc> {
    const n = Number(gioiHan);
    return this.thayThuoc.chayCaThayThuoc(Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
  }
}
