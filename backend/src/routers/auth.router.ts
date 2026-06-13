import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from '../controllers/auth.controller';
import { Public } from '../middlewares/auth/public.decorator';

@Controller('auth')
export class AuthRouter {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('admin/login')
  async login(@Body() signInDto: Record<string, any>) {
    const admin = await this.authService.validateAdmin(signInDto.username, signInDto.password);
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
}
