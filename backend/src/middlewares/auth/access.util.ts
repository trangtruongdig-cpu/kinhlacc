import { ForbiddenException } from '@nestjs/common';

/**
 * Hình dạng `req.user` sau khi JwtStrategy.validate() chạy xong (xem jwt.strategy.ts).
 * Khai báo một chỗ để router khỏi phải nhận `req: any` — kiểu `any` ở đây từng che mất
 * việc một endpoint quên kiểm quyền.
 */
export interface NguoiDungDaXacThuc {
  id?: number | string;
  username?: string;
  phone?: string;
  /** 'patient' cho tài khoản bệnh nhân; nhân viên mang vai trò của phòng chẩn trị. */
  role?: string;
  /** 'staff' = tài khoản nhân viên. Token bệnh nhân KHÔNG có trường này. */
  kind?: string;
  quanTri?: boolean;
}

/** Request đã qua JwtAuthGuard. */
export interface RequestDaXacThuc {
  user?: NguoiDungDaXacThuc;
}

/**
 * Cho phép NHÂN VIÊN (mọi vai trò) hoặc chính BỆNH NHÂN sở hữu bản ghi (id trong token JWT
 * khớp ownerId) truy cập. Dùng cho các endpoint bệnh nhân có thể tự gọi bằng chính id của mình
 * (vd xem/sửa hồ sơ, đăng ký fcm-token) — chặn bệnh nhân A xem/sửa dữ liệu của bệnh nhân B.
 */
export function assertStaffOrOwner(user: NguoiDungDaXacThuc | undefined, ownerId: number): void {
  if (user?.kind === 'staff') return;
  if (user?.role === 'patient' && Number(user.id) === Number(ownerId)) return;
  throw new ForbiddenException('Bạn không có quyền truy cập dữ liệu này.');
}
