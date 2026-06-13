import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Chỉ cho phép tài khoản NHÂN VIÊN có vai trò Quản Trị Viên (laQuanTri).
 * Phải đặt SAU khi JwtAuthGuard đã chạy (req.user đã có).
 * Token bệnh nhân (kind != 'staff') hoặc nhân viên thường đều bị chặn.
 */
@Injectable()
export class QuanTriGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user || user.kind !== 'staff' || user.quanTri !== true) {
      throw new ForbiddenException('Chỉ Quản Trị Viên mới được thực hiện thao tác này.');
    }
    return true;
  }
}
