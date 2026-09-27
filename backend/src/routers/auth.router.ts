import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../controllers/auth.controller';
import { NhanVienGuard } from '../middlewares/auth/nhan-vien.guard';
import { RequestDaXacThuc } from '../middlewares/auth/access.util';
import { Public } from '../middlewares/auth/public.decorator';
import { ZodPipe } from '../middlewares/validation/zod.pipe';
import { dangNhapNhanVienSchema } from '../models/validation.schema';

@Controller('auth')
export class AuthRouter {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('admin/login')
  async login(
    @Body(new ZodPipe(dangNhapNhanVienSchema))
    signInDto: {
      username: string;
      password: string;
    },
  ) {
    const admin = await this.authService.validateAdmin(
      signInDto.username,
      signInDto.password,
    );
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(admin);
  }

  // Yêu cầu đăng nhập (JwtAuthGuard toàn cục). Trả thông tin + quyền mới nhất.
  @Get('me')
  me(@Request() req: any) {
    return this.authService.me(req.user.id);
  }

  /**
   * Cấp vé vào khu quản trị nội dung (CMS) — xem `AuthService.taoVeCms`.
   *
   * `NhanVienGuard` là bắt buộc: token bệnh nhân cũng là token hợp lệ đối với
   * `JwtAuthGuard` toàn cục, nên thiếu guard này là mở cửa CMS cho mọi bệnh nhân
   * đã đăng nhập (`admins.findById` sẽ không tìm ra họ, nhưng chặn ở cửa vẫn đúng
   * hơn là dựa vào một truy vấn trượt).
   *
   * POST chứ không phải GET, và không nhận tham số nào: vé là thứ được CẤP chứ không
   * phải thứ đọc ra, và giữ nó khỏi thanh địa chỉ là cách nó không rơi vào log của
   * nginx hay lịch sử trình duyệt.
   */
  @UseGuards(NhanVienGuard)
  @HttpCode(HttpStatus.OK)
  @Post('ve-cms')
  veCms(@Request() req: RequestDaXacThuc) {
    return this.authService.taoVeCms(String(req.user?.id));
  }
}
