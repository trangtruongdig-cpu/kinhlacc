import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ThuongHanChungService } from '../controllers/thuong-han-chung.controller';
import { Public } from '../middlewares/auth/public.decorator';
import type { ThuongHanChungModel } from '../models/thuong-han-chung.model';

/** Chứng–phương Thương Hàn: tra cứu · ca bệnh đối chiếu · thầy thuốc ghi đè. */
@Controller('thuong-han-chung')
export class ThuongHanChungRouter {
  constructor(private readonly service: ThuongHanChungService) {}

  /** Cả bộ, lọc theo ?kinh=thai-duong */
  @Public()
  @Get()
  findAll(@Query('kinh') kinh?: string) {
    return this.service.findAll(kinh);
  }

  /** Lối vào của phiếu đo: định vị được kinh rồi thì lấy các chứng của kinh đó. */
  @Public()
  @Get('tra')
  tra(@Query('kinh') kinh: string) {
    return this.service.tra(kinh);
  }

  /** Gợi ý trọn mạch cho một ca: chứng–phương Thương Hàn + pháp trị của kinh (kèm triệu chứng, bài). */
  @Public()
  @Get('goi-y')
  goiY(@Query('kinh') kinh: string) {
    return this.service.goiYTheoKinh(kinh);
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.service.findOne(slug);
  }

  @Put(':slug')
  ghiDe(
    @Param('slug') slug: string,
    @Body() patch: Partial<ThuongHanChungModel>,
    @Req() req: { user?: { username?: string } },
  ) {
    return this.service.ghiDe(slug, patch, req.user?.username);
  }

  @Post(':slug/khoi-phuc')
  khoiPhuc(@Param('slug') slug: string) {
    return this.service.khoiPhuc(slug);
  }
}
