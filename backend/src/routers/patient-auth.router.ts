import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { PatientAuthService } from '../controllers/patient-auth.controller';
import { Public } from '../middlewares/auth/public.decorator';

@Public()
@Controller('patient-auth')
export class PatientAuthRouter {
  constructor(private readonly patientAuthService: PatientAuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() signInDto: Record<string, any>) {
    if (!signInDto.phone || !signInDto.password) {
      throw new BadRequestException('Vui lòng cung cấp số điện thoại và mật khẩu.');
    }
    const patient = await this.patientAuthService.validatePatient(signInDto.phone, signInDto.password);
    if (!patient) {
      throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng!');
    }
    return this.patientAuthService.login(patient);
  }

  @Post('register')
  async register(@Body() registerDto: Record<string, any>) {
    if (!registerDto.phone || !registerDto.password) {
      throw new BadRequestException('Vui lòng cung cấp số điện thoại và mật khẩu.');
    }
    return this.patientAuthService.register(registerDto.phone, registerDto.password, registerDto.fullName);
  }

  /**
   * Yêu cầu xoá tài khoản & dữ liệu (soft delete). Người dùng phải xác minh bằng
   * SĐT + mật khẩu của chính tài khoản đó. Dùng cho trang web công khai /xoa-tai-khoan
   * (URL "Account deletion" khai báo trong Google Play Console).
   */
  @HttpCode(HttpStatus.OK)
  @Post('request-deletion')
  async requestDeletion(@Body() dto: Record<string, any>) {
    if (!dto.phone || !dto.password) {
      throw new BadRequestException('Vui lòng cung cấp số điện thoại và mật khẩu.');
    }
    const ok = await this.patientAuthService.requestDeletion(dto.phone, dto.password);
    if (!ok) {
      throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng!');
    }
    return {
      success: true,
      message:
        'Đã tiếp nhận yêu cầu xoá. Tài khoản của bạn đã được vô hiệu hoá và sẽ được xoá khỏi hệ thống theo chính sách lưu trữ.',
    };
  }
}
