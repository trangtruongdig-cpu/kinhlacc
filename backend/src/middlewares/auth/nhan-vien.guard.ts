import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Chỉ cho phép tài khoản NHÂN VIÊN phòng khám (mọi vai trò, không riêng Quản Trị Viên).
 * Chặn token bệnh nhân (kind !== 'staff'). Phải đặt SAU JwtAuthGuard (req.user đã có).
 */
@Injectable()
export class NhanVienGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user || user.kind !== 'staff') {
      throw new ForbiddenException(
        'Chỉ nhân viên phòng khám mới được thực hiện thao tác này.',
      );
    }
    return true;
  }
}
