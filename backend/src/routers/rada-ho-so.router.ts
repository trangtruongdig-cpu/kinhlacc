import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Public } from '../middlewares/auth/public.decorator';
import { RadaHoSoService } from '../controllers/rada-ho-so.controller';

/**
 * RadaHoSoRouter — nguyên liệu cho Rada SEO (plugin trong CMS gọi sang).
 *
 * CÔNG KHAI (@Public) vì cả hai route chỉ ĐỌC, và vì phía gọi là tiến trình CMS: nó không có
 * token người dùng nào để gửi — cùng lý do với `POST /tra-cuu/ten`. Nội dung trả về đều đã
 * công khai trên trang từ điển. Không route nào ở đây GHI, nên không cần NhanVienGuard.
 *
 *   POST /rada/ho-so-cum   body { cum, bienThe[] } -> hồ sơ cụm (thể bệnh, vị, bài, nguồn)
 *   GET  /rada/ung-vien?toiThieuVi=&toiThieuThap=  -> chủ trị có tháp dày
 *   GET  /rada/cum-ngu-nghia?toiThieuThap=         -> 657 cụm ngữ nghĩa, gom nhiều chủ trị
 */
@Controller('rada')
export class RadaHoSoRouter {
  constructor(private readonly service: RadaHoSoService) {}

  @Public()
  @Post('ho-so-cum')
  hoSoCum(@Body() body: { cum?: string; bienThe?: string[] }) {
    return this.service.dungHoSo(String(body?.cum ?? '').trim(), Array.isArray(body?.bienThe) ? body.bienThe : []);
  }

  @Public()
  @Get('cum-ngu-nghia')
  cumNguNghia(@Query('toiThieuThap') toiThieuThap?: string) {
    const n = Number(toiThieuThap);
    return this.service.cumNguNghia(Number.isFinite(n) && n > 0 ? Math.floor(n) : 20);
  }

  @Public()
  @Get('ung-vien')
  ungVien(@Query('toiThieuVi') toiThieuVi?: string, @Query('toiThieuThap') toiThieuThap?: string) {
    const so = (x: string | undefined, md: number) => {
      const n = Number(x);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : md;
    };
    return this.service.ungVien(so(toiThieuVi, 8), so(toiThieuThap, 25));
  }
}
