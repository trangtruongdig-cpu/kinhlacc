import {
  Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';

import { ThamDinhService } from '../controllers/tham-dinh.controller';
import { ThamDinhThayThuocService } from '../controllers/tham-dinh-thay-thuoc.controller';
import { ThamDinhCmsService } from '../controllers/tham-dinh-cms.service';
import { QuanTriGuard } from '../middlewares/auth/quan-tri.guard';
import type { LuocKeCa, LuocKeCaThayThuoc } from '../models/tham-dinh.dto';
import type { BoLuatVanPhong } from '../utils/tham-dinh-luat.util';
import type { RequestDaXacThuc } from '../middlewares/auth/access.util';

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

  // ══ Duyệt và áp bản sửa ══════════════════════════════════════════════════════════

  /** Nhận xét chờ duyệt. Mặc định lớp thầy thuốc, trạng thái `moi`. */
  @Get('nhan-xet')
  async nhanXet(
    @Query('bo') bo?: string,
    @Query('kieu') kieu?: string,
    @Query('trangThai') trangThai?: string,
    @Query('lop') lop?: string,
    @Query('trang') trang?: string,
    @Query('moiTrang') moiTrang?: string,
  ): Promise<{ danhSach: unknown[]; tong: number }> {
    await this.cms.moKetNoi();
    try {
      await this.cms.dungBang();
      return await this.cms.docNhanXetDeDuyet({
        bo, kieu, trangThai, lop,
        trang: Number(trang) || 1,
        moiTrang: Number(moiTrang) || 25,
      });
    } finally {
      await this.cms.dongKetNoi();
    }
  }

  /** Đổi trạng thái một nhận xét: `da_duyet` | `bo_qua` | `moi`. */
  @Patch('nhan-xet/:id')
  async doiTrangThai(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { trangThai?: string },
    @Req() req: RequestDaXacThuc,
  ): Promise<{ ok: boolean }> {
    const hopLe = new Set(['moi', 'da_duyet', 'bo_qua']);
    const tt = body?.trangThai || '';
    if (!hopLe.has(tt)) return { ok: false };
    await this.cms.moKetNoi();
    try {
      await this.cms.dungBang();
      return { ok: await this.cms.doiTrangThaiNhanXet(id, tt, req.user?.username ?? null) };
    } finally {
      await this.cms.dongKetNoi();
    }
  }

  /**
   * Áp bản sửa vào kho. Đây là chỗ DUY NHẤT trong cả bot ghi vào bảng `ec_*`, và nó chỉ
   * chạy khi có người bấm — bot không bao giờ tự gọi.
   */
  @Post('nhan-xet/:id/ap')
  async apBanSua(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestDaXacThuc,
  ): Promise<{ ok: boolean; lyDo?: string; soLanThay?: number }> {
    await this.cms.moKetNoi();
    try {
      await this.cms.dungBang();
      return await this.cms.apBanSua(id, req.user?.username ?? null);
    } finally {
      await this.cms.dongKetNoi();
    }
  }
}
