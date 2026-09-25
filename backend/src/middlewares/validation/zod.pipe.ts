import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

/**
 * Kiểm THÂN REQUEST bằng một lược đồ zod, dùng như `@Body(new ZodPipe(schema))`.
 *
 * Vì sao không dùng ValidationPipe + class-validator như hướng dẫn NestJS: DTO trong repo này
 * là *type* TypeScript thuần (xem chú thích trong models/*.dto.ts), mà type thì biến mất sau khi
 * biên dịch — class-validator cần DTO là *class* có decorator, tức phải viết lại toàn bộ DTO.
 * zod mô tả lược đồ bằng giá trị chạy được nên gắn thêm vào DTO sẵn có mà không phá vỡ gì.
 *
 * Lược đồ nên khai báo `.strict()` để THỪA trường cũng bị chặn — đó là thứ ngăn client gửi
 * kèm những khoá không ai chờ đợi rồi lọt xuống `repository.save()`.
 */
export class ZodPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    try {
      return this.schema.parse(value);
    } catch (e) {
      if (e instanceof ZodError) {
        // Gộp thành câu tiếng Việt đọc được thay vì ném nguyên cấu trúc lỗi của zod ra client.
        const chiTiet = e.issues
          .map((i) => {
            const duong = i.path.join('.') || '(thân request)';
            return `${duong}: ${i.message}`;
          })
          .join('; ');
        throw new BadRequestException(
          `Dữ liệu gửi lên không hợp lệ — ${chiTiet}`,
        );
      }
      throw e;
    }
  }
}
