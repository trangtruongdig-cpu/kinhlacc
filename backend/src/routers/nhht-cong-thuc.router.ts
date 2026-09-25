import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NhhtCongThucService } from '../controllers/nhht-cong-thuc.controller';
import { Public } from '../middlewares/auth/public.decorator';
import type { NhhtCongThuc } from '../models/nhht-cong-thuc.model';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';

/** Ngũ Hành Hồi Tác — kho công thức (tra cứu · ca bệnh đối chiếu · thầy thuốc ghi đè). */
@Controller('nhht')
export class NhhtCongThucRouter {
  constructor(private readonly service: NhhtCongThucService) {}

  /** Cả kho, lọc được theo ?kinh= &trangThai= &khung= */
  @Public()
  @Get('cong-thuc')
  findAll(
    @Query('kinh') kinh?: string,
    @Query('trangThai') trangThai?: string,
    @Query('khung') khung?: string,
  ) {
    return this.service.findAll({ kinh, trangThai, khung });
  }

  /** Lối vào của PHIẾU ĐO: đã định gốc rồi thì tra đúng một công thức. */
  @Public()
  @Get('tra')
  tra(
    @Query('kinh') kinh: string,
    @Query('thuc') thuc: string,
    @Query('khung') khung?: string,
  ) {
    return this.service.tra(kinh, thuc === 'true' || thuc === '1', khung);
  }

  /** Bảng đang dùng lệch bộ chuẩn engine ở đâu. */
  @Get('doi-chieu')
  doiChieu() {
    return this.service.doiChieu();
  }

  @UseGuards(NhanVienGuard)
  @Put('cong-thuc/:ma')
  ghiDe(
    @Param('ma') ma: string,
    @Body() patch: Partial<NhhtCongThuc>,
    @Req() req: { user?: { username?: string } },
  ) {
    return this.service.ghiDe(ma, patch, req.user?.username);
  }

  /** Bỏ ghi đè, trả về bản engine sinh. */
  @UseGuards(NhanVienGuard)
  @Post('cong-thuc/:ma/khoi-phuc')
  khoiPhuc(@Param('ma') ma: string) {
    return this.service.khoiPhuc(ma);
  }
}
