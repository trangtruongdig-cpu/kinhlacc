import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SuCoService, type NguCanhBao } from '../controllers/su-co.controller';
import type {
  BaoSuCoDto,
  BaoSuCoLoDto,
  CapNhatCumDto,
  LocCumDto,
} from '../models/su-co.dto';
import { Admin } from '../models/admin.model';
import { Public } from '../middlewares/auth/public.decorator';
import { QuanTriGuard } from '../middlewares/auth/quan-tri.guard';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';
import type { NguoiDungDaXacThuc } from '../middlewares/auth/access.util';

/**
 * Rút gọn IP: bỏ nhóm cuối.
 *
 * Đủ để nhận ra một máy đang spam, KHÔNG đủ để truy ra một người cụ thể. Bảng sự cố có thể
 * chứa tín hiệu từ bệnh nhân, nên địa chỉ đầy đủ của họ không có lý do gì để nằm lại đây.
 */
function rutGonIp(raw: string | string[] | undefined): string | null {
  // `x-forwarded-for` của Express là string HOẶC string[] (khi qua nhiều lớp proxy).
  // String() thẳng trên mảng cho ra chuỗi nối bằng dấu phẩy — vô tình vẫn chạy, nhưng chỉ vì
  // may mắn; gặp kiểu khác là ra '[object Object]' rồi mọi IP gom về một khoá.
  const dau = Array.isArray(raw) ? raw[0] : raw;
  if (typeof dau !== 'string') return null;
  const ip = dau.split(',')[0].trim();
  if (!ip) return null;
  if (ip.includes(':')) {
    // IPv6: giữ 4 nhóm đầu (mạng), bỏ phần định danh máy.
    const nhom = ip.split(':');
    return nhom.slice(0, 4).join(':') + '::*';
  }
  const octet = ip.split('.');
  if (octet.length !== 4) return null;
  return `${octet[0]}.${octet[1]}.${octet[2]}.*`;
}

/** Nhãn vai trò để đọc trên hồ sơ sửa lỗi — không phải để phân quyền. */
function nhanVaiTro(u: NguoiDungDaXacThuc | undefined): string | null {
  if (!u) return 'khach';
  if (u.kind === 'staff') return u.quanTri ? 'quan_tri' : u.role || 'nhan_vien';
  if (u.role === 'patient') return 'benh_nhan';
  return u.role || 'khach';
}

@Controller('su-co')
export class SuCoRouter {
  constructor(
    private readonly suCoService: SuCoService,
    @InjectRepository(Admin) private readonly adminRepo: Repository<Admin>,
  ) {}

  /**
   * Cửa nhận tín hiệu. CÔNG KHAI — và phải thế.
   *
   * Lỗi hay xảy ra nhất lại nằm ở đúng những chỗ CHƯA có token: trang đăng nhập, landing, từ
   * điển công khai, Kinh Mạch 3D. Bắt đăng nhập mới cho báo lỗi là bịt mắt mình ở đúng chỗ
   * cần nhìn nhất. Bù lại: trần theo IP, thân bài bị cắt, dữ liệu bị che lại ở máy chủ.
   */
  @Public()
  @Post('bao')
  async bao(
    @Body() body: BaoSuCoLoDto | BaoSuCoDto,
    @Req() req: Request & { user?: NguoiDungDaXacThuc },
  ) {
    const danhSach: BaoSuCoDto[] = Array.isArray(
      (body as BaoSuCoLoDto)?.danhSach,
    )
      ? (body as BaoSuCoLoDto).danhSach
      : [body as BaoSuCoDto];

    const ctx: NguCanhBao = {
      ipRutGon: rutGonIp(
        req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress,
      ),
      vaiTro: nhanVaiTro(req.user),
      nguoiDungHash: this.suCoService.bamNguoiDung(req.user?.id ?? null),
    };

    return this.suCoService.ghiNhanLo(danhSach, ctx);
  }

  /**
   * Lưu token thiết bị của NHÂN VIÊN để nhận cảnh báo sự cố hạng nặng.
   *
   * Gắn `NhanVienGuard` dù thân hàm cũng tự kiểm `kind === 'staff'`: JwtAuthGuard toàn cục
   * KHÔNG đủ vì token bệnh nhân cũng là token hợp lệ. Kiểm trong thân hàm thì đúng hôm nay
   * nhưng vô hình với mọi phép rà soát quyền (vốn dò theo guard), và biến mất lặng lẽ nếu ai
   * đó sửa lại hàm. Xem mục "Phân quyền — BA tầng" trong CLAUDE.md.
   */
  @UseGuards(NhanVienGuard)
  @Put('fcm-token')
  async luuFcmToken(
    @Body() body: { fcmToken?: string },
    @Req() req: Request & { user?: NguoiDungDaXacThuc },
  ) {
    const u = req.user;
    if (!u || !u.id) return { luu: false };
    await this.adminRepo.update(String(u.id), {
      fcmToken: body?.fcmToken || null,
    });
    return { luu: true };
  }

  @UseGuards(QuanTriGuard)
  @Get('thong-ke')
  thongKe() {
    return this.suCoService.thongKe();
  }

  @UseGuards(QuanTriGuard)
  @Get('cum')
  danhSachCum(@Query() loc: LocCumDto) {
    return this.suCoService.danhSachCum(loc);
  }

  @UseGuards(QuanTriGuard)
  @Get('cum/:id')
  chiTietCum(@Param('id', ParseIntPipe) id: number) {
    return this.suCoService.chiTietCum(id);
  }

  @UseGuards(QuanTriGuard)
  @Patch('cum/:id')
  capNhatCum(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CapNhatCumDto,
  ) {
    return this.suCoService.capNhatCum(id, dto);
  }

  @UseGuards(QuanTriGuard)
  @Get('cum/:id/ho-so')
  async hoSo(@Param('id', ParseIntPipe) id: number) {
    return { markdown: await this.suCoService.hoSoSuaLoi(id) };
  }

  @UseGuards(QuanTriGuard)
  @Post('cum/:id/phan-tich-ai')
  phanTichAi(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { lamLai?: boolean },
  ) {
    return this.suCoService.phanTichAi(id, !!body?.lamLai);
  }
}
