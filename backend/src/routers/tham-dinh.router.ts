import {
  Body, Controller, Get, Logger, Param, ParseIntPipe, Patch, Post, Query, Req,
  ServiceUnavailableException, UseGuards,
} from '@nestjs/common';

import { ThamDinhService } from '../controllers/tham-dinh.controller';
import { ThamDinhThayThuocService } from '../controllers/tham-dinh-thay-thuoc.controller';
import { ThamDinhCmsService } from '../controllers/tham-dinh-cms.service';
import { QuanTriGuard } from '../middlewares/auth/quan-tri.guard';
import type { LuocKeCa, LuocKeCaThayThuoc, LuocKeTuSua } from '../models/tham-dinh.dto';
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
  private readonly logger = new Logger('ThamDinhRouter');

  constructor(
    private readonly thamDinh: ThamDinhService,
    private readonly thayThuoc: ThamDinhThayThuocService,
    private readonly cms: ThamDinhCmsService,
  ) {}

  /**
   * Mở kết nối sang kho, nhưng KIỂM CẤU HÌNH trước.
   *
   * ⚠️ Thiếu `CMS_DB_*` mà gọi thẳng `moKetNoi()` thì `pg` cố mở kết nối tới
   * `host: undefined` và ném một lỗi chẳng liên quan gì — người dùng chỉ thấy
   * "Internal server error" trên màn hình, không có cách nào đoán ra là thiếu biến môi
   * trường. Đã xảy ra thật ngay lượt deploy đầu lên VPS.
   *
   * Ca soi thì NẰM IM khi thiếu cấu hình (đúng, vì nó chạy ngầm lúc 2 giờ sáng), còn API
   * thì phải NÓI RA — có người đang đứng nhìn màn hình chờ câu trả lời.
   */
  private async moKho(): Promise<void> {
    if (!this.cms.daCauHinh()) {
      throw new ServiceUnavailableException(
        'Máy chủ chưa khai CMS_DB_HOST/PORT/USER/PASSWORD/NAME trong backend/.env nên ' +
          'chưa nối được sang kho nội dung. Bot thẩm định sẽ nằm im tới khi khai đủ.',
      );
    }
    await this.cms.moKetNoi();
  }

  /**
   * Chạy tay một ca soi cả kho. Trả lời NGAY, ca chạy nền — kết quả xem ở `/nhat-ky`.
   *
   * ⚠️ Vì sao không đợi: ca cả kho mất 2–3 phút, mà tầng proxy trước backend bỏ cuộc ở
   * khoảng 113 giây và trả **502** cho người bấm nút — trong khi ca vẫn chạy ngon bên
   * trong. Đo thật trên production 29/09/2026. Người bấm thì tưởng hỏng, bấm lại, và
   * lần này `dangChay` chặn nên họ càng tưởng hỏng thật.
   *
   * `gioiHan` nhỏ (dưới 200 mục) thì vẫn đợi, vì nó xong trong vài chục giây và người
   * bấm muốn thấy số ngay.
   */
  @Post('chay')
  async chay(
    @Query('gioiHan') gioiHan?: string,
  ): Promise<LuocKeCa | { dangChay: true; batDau: string; ghiChu: string }> {
    const n = Number(gioiHan);
    const gh = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    if (gh > 0 && gh <= 200) return this.thamDinh.chayCa(gh);

    const batDau = new Date().toISOString();
    // Cố ý KHÔNG await. Nhưng PHẢI log lỗi ở đây: `.catch(() => undefined)` trần nuốt
    // mọi thứ, và một ca chạy nền chết im lặng là ca không để lại dấu vết nào — không
    // log, không nhật ký, người bấm nút thì đã nhận "dangChay: true" và yên tâm chờ.
    void this.thamDinh.chayCa(gh).catch((e: unknown) => {
      this.logger.error(`ca soi nền chết: ${(e as Error)?.message || e}`);
    });
    return {
      dangChay: true,
      batDau,
      ghiChu: 'Ca soi cả kho chạy nền, mất vài phút. Xem kết quả ở khối "Bot làm gì gần đây".',
    };
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
    await this.moKho();
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
    await this.moKho();
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
    await this.moKho();
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
    await this.moKho();
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
    await this.moKho();
    try {
      await this.cms.dungBang();
      return await this.cms.apBanSua(id, req.user?.username ?? null);
    } finally {
      await this.cms.dongKetNoi();
    }
  }

  /** Tổng kết "đêm qua bot làm gì" cho khối đầu màn duyệt. */
  @Get('nhat-ky')
  async nhatKy(): Promise<unknown> {
    await this.moKho();
    try {
      await this.cms.dungBang();
      return await this.cms.docNhatKy();
    } finally {
      await this.cms.dongKetNoi();
    }
  }

  /**
   * Tự sửa lỗi hình thức. CHẠY THỬ là mặc định — phải `?ghi=1` mới ghi thật.
   *
   * Cùng lối với `dong-bo-app.mjs` của CMS: mọi thứ ghi vào kho đang phục vụ khách đều
   * phải xem trước được, và phải gõ thêm một chữ mới ghi.
   */
  @Post('tu-sua')
  async tuSua(
    @Query('ghi') ghi?: string,
    @Query('gioiHan') gioiHan?: string,
  ): Promise<LuocKeTuSua | { dangChay: true; ghiChu: string }> {
    const n = Number(gioiHan);
    const gh = Number.isFinite(n) && n > 0 ? Math.floor(n) : 200;
    const thu = ghi !== '1';

    // Chạy THỬ chỉ đọc nên nhanh — đợi luôn, người bấm muốn thấy ngay nó định sửa gì.
    if (thu) return this.thamDinh.tuSuaHinhThuc(true, gh);

    // Ghi thật thì mỗi chỗ là một giao dịch riêng qua mạng: 100 chỗ đã vượt kiên nhẫn
    // của proxy. Cùng lỗi đã sửa cho ca quét, tôi lặp lại ở đây — việc dài không gọi
    // qua HTTP mà đợi.
    void this.thamDinh.tuSuaHinhThuc(false, gh).catch((e: unknown) => {
      this.logger.error(`ca tự sửa nền chết: ${(e as Error)?.message || e}`);
    });
    return {
      dangChay: true,
      ghiChu: `Đang tự sửa tối đa ${gh} chỗ, chạy nền. Xem kết quả ở khối "Bot làm gì gần đây".`,
    };
  }
}
