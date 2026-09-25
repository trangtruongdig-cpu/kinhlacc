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
  // Trần RIÊNG cho cửa báo sự cố, phải đặt TRƯỚC trần chung: body-parser bỏ qua nếu thân
  // request đã được lớp trước phân tích, nên lớp đăng ký sớm hơn là lớp có hiệu lực.
  //
  // Vì sao cần: trần chung 20MB có lý do của nó (ảnh upload), nhưng `/su-co/bao` là cửa CÔNG
  // KHAI — người chưa đăng nhập cũng gọi được. Để nguyên 20MB ở đó nghĩa là bất kỳ ai cũng
  // bắt được VPS 2GB nuốt và phân tích payload 20MB. 128KB đủ rộng cho một lô 50 tín hiệu
  // kèm stack, vẫn nhỏ hơn trần chung 160 lần.
  app.use('/su-co/bao', json({ limit: '128kb' }));
  // Cùng lý do, cho cửa tra cứu liên kết chéo — nó nhận một LÔ tên nên thân request phình nhanh.
  // Trần số phần tử của lô nằm ở tra-cuu.controller.ts; đây là lớp chặn theo byte đứng trước nó.
  app.use('/tra-cuu/ten', json({ limit: '64kb' }));
  app.use(json({ limit: '20mb' }));

  // Trần urlencoded PHẢI nhỏ, nếu không nó vô hiệu hoá mọi trần theo-đường-dẫn ở trên.
  //
  // body-parser chọn bộ phân tích theo Content-Type: `json()` bỏ qua request form-encoded, nên
  // một trần đặt cho json KHÔNG chặn được cùng đường dẫn đó khi người gửi đổi sang
  // `application/x-www-form-urlencoded`. Đã đo: 293KB JSON vào /su-co/bao bị chặn 413, còn
  // 391KB form-encoded vào ĐÚNG cửa đó lọt qua 201 khi trần này còn là 20mb.
  //
  // Cố ý HẠ thay vì bỏ hẳn dòng này: rà soát cho thấy không client nào gửi form-encoded (frontend
  // dùng json, upload ảnh đi multipart qua multer), nhưng bỏ hẳn thì một người gửi form-encoded
  // sẽ nhận `req.body === undefined` và handler xử lý tiếp như thân rỗng — hỏng ÂM THẦM. Giữ bộ
  // phân tích với trần nhỏ thì nó hỏng TO TIẾNG bằng 413, dễ lần ra hơn nhiều.
  app.use(urlencoded({ extended: true, limit: '64kb' }));
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
