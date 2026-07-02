import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './middlewares/logging.interceptor';

/** Thư mục lưu ẢNH DƯỢC LIỆU do người dùng upload. Docker gắn volume vào /app/uploads. */
export const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ extended: true, limit: '20mb' }));
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Phục vụ ảnh upload tĩnh tại /uploads/... (frontend gọi qua /api/uploads/... trên prod).
  try { mkdirSync(UPLOAD_DIR, { recursive: true }); } catch { /* đã có */ }
  app.useStaticAssets(UPLOAD_DIR, { prefix: '/uploads' });

  // CORS: cho phép nhiều domain frontend (prod + local).
  // FRONTEND_URL có thể là list phân tách bởi dấu phẩy.
  app.enableCors({
    // Cho phép mọi origin (API có JWT bảo vệ; allowlist cũ là code chết đã gỡ).
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
  });

  const port = process.env.APP_PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
