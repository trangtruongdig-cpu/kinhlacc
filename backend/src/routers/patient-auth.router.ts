import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PatientAuthService } from '../controllers/patient-auth.controller';
import { Public } from '../middlewares/auth/public.decorator';
import { ZodPipe } from '../middlewares/validation/zod.pipe';
import {
  dangKyBenhNhanSchema,
  dangNhapBenhNhanSchema,
} from '../models/validation.schema';

@Public()
@Controller('patient-auth')
export class PatientAuthRouter {
  constructor(private readonly patientAuthService: PatientAuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body(new ZodPipe(dangNhapBenhNhanSchema))
    signInDto: {
      phone: string;
      password: string;
    },
  ) {
    const patient = await this.patientAuthService.validatePatient(
      signInDto.phone,
      signInDto.password,
    );
    if (!patient) {
      throw new UnauthorizedException(
        'Số điện thoại hoặc mật khẩu không đúng!',
      );
    }
    return this.patientAuthService.login(patient);
  }

  @Post('register')
  async register(
    @Body(new ZodPipe(dangKyBenhNhanSchema))
    registerDto: {
      phone: string;
      password: string;
      fullName?: string;
    },
  ) {
    return this.patientAuthService.register(
      registerDto.phone,
      registerDto.password,
      registerDto.fullName,
    );
  }

  /**
   * Yêu cầu xoá tài khoản & dữ liệu (soft delete). Người dùng phải xác minh bằng
   * SĐT + mật khẩu của chính tài khoản đó. Dùng cho trang web công khai /xoa-tai-khoan
   * (URL "Account deletion" khai báo trong Google Play Console).
   */
  @HttpCode(HttpStatus.OK)
  @Post('request-deletion')
  async requestDeletion(
    @Body(new ZodPipe(dangNhapBenhNhanSchema))
    dto: {
      phone: string;
      password: string;
    },
  ) {
    const ok = await this.patientAuthService.requestDeletion(
      dto.phone,
      dto.password,
    );
    if (!ok) {
      throw new UnauthorizedException(
        'Số điện thoại hoặc mật khẩu không đúng!',
      );
    }
    return {
      success: true,
      message:
        'Đã tiếp nhận yêu cầu xoá. Tài khoản của bạn đã được vô hiệu hoá và sẽ được xoá khỏi hệ thống theo chính sách lưu trữ.',
    };
  }
}
