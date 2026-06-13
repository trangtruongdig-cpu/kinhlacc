import { SetMetadata } from '@nestjs/common';

/**
 * Đánh dấu route KHÔNG cần đăng nhập (bỏ qua JwtAuthGuard toàn cục).
 * Dùng cho: đăng nhập, đăng ký bệnh nhân, health-check...
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
