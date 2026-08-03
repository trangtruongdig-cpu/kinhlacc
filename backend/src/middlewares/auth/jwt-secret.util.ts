import { ConfigService } from '@nestjs/config';

/**
 * Bắt buộc JWT_SECRET phải được cấu hình — không cho phép fallback ngầm ra chuỗi hardcode.
 * Fail closed: thiếu biến môi trường này thì app không được khởi động, tránh trường hợp
 * một deployment quên set JWT_SECRET vẫn chạy được và ký token bằng secret công khai trong mã nguồn.
 */
export function requireJwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET');
  if (!secret) {
    throw new Error(
      'JWT_SECRET chưa được cấu hình. Đặt biến môi trường JWT_SECRET trước khi khởi động backend.',
    );
  }
  return secret;
}
