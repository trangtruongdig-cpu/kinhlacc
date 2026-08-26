import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Chặn tài khoản Lễ Tân tạo phiên khám mới — khám và đo nhiệt độ kinh lạc chỉ dành cho Bác Sĩ.
 * Phải đặt SAU NhanVienGuard (req.user đã có, đã xác nhận là nhân viên).
 */
@Injectable()
export class ChanLeTanTaoKhamGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (user?.role === 'le_tan') {
      throw new ForbiddenException(
        'Lễ Tân không có quyền tạo phiên khám. Vui lòng liên hệ Bác Sĩ.',
      );
    }
    return true;
  }
}
