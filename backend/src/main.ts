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
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  const brandmasterRegex = /^https?:\/\/([a-z0-9-]+\.)?brandmaster\.net\.vn$/i;
  const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
  const vercelRegex = /^https?:\/\/([a-z0-9-]+\.)?vercel\.app$/i;

  app.enableCors({
    origin: (origin, callback) => {
      // Non-browser requests (curl, server-to-server) may not have an Origin
      return callback(null, true);
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
