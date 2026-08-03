import { ForbiddenException } from '@nestjs/common';

/**
 * Cho phép NHÂN VIÊN (mọi vai trò) hoặc chính BỆNH NHÂN sở hữu bản ghi (id trong token JWT
 * khớp ownerId) truy cập. Dùng cho các endpoint bệnh nhân có thể tự gọi bằng chính id của mình
 * (vd xem/sửa hồ sơ, đăng ký fcm-token) — chặn bệnh nhân A xem/sửa dữ liệu của bệnh nhân B.
 */
export function assertStaffOrOwner(user: any, ownerId: number): void {
  if (user?.kind === 'staff') return;
  if (user?.role === 'patient' && Number(user.id) === Number(ownerId)) return;
  throw new ForbiddenException('Bạn không có quyền truy cập dữ liệu này.');
}
