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

  // CORS: whitelist trusted origins để prevent CSRF/XSS từ trang độc hại.
  const allowedOrigins = [
    'http://localhost:5173',      // Dev frontend Vite
    'http://localhost:3000',      // Dev backend (same-origin during dev)
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'https://kinhlac.online',     // Prod domain
    'https://www.kinhlac.online',
    'https://kinhlac.vercel.app', // Vercel staging
  ];
  // Dev mode: cho phép localhost
  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:8080');
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Origin undefined = same-origin request (ví dụ server-side render)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
  });

  const port = process.env.APP_PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
