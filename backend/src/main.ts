import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './middlewares/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ extended: true, limit: '20mb' }));
  app.useGlobalInterceptors(new LoggingInterceptor());

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
