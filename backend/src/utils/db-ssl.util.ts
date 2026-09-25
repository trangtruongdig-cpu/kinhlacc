import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';

export type CauHinhSsl = false | { ca?: string; rejectUnauthorized: boolean };

/**
 * Cấu hình TLS cho kết nối Postgres.
 *
 * Mặc định cũ là `{ rejectUnauthorized: false }` — có mã hoá đường truyền nhưng KHÔNG xác minh
 * danh tính máy chủ, nên một kẻ đứng giữa vẫn chèn được chứng chỉ của mình và đọc trọn dữ liệu
 * bệnh nhân.
 *
 * Tên biến được chấp nhận, theo thứ tự ưu tiên:
 *   1. `DB_CA_CERT`      — nội dung PEM, đặt thẳng.
 *   2. `DB_CA_CERT_FILE` — đường dẫn tới ca.pem.
 *   3. `CA_CERTIFICATE`  — TÊN AIVEN TỰ ĐẶT khi phát chuỗi kết nối. Phải đọc tên này, vì
 *      `backend/.env` của phòng chẩn trị VỐN ĐÃ có sẵn cert dưới tên đó; bỏ qua nó thì cert nằm
 *      ngay trong file mà vẫn chạy chế độ không xác minh.
 *
 * Đã đo trên chính máy chủ Aiven đang dùng (25/09/2026): bật `rejectUnauthorized: true` kèm
 * `CA_CERTIFICATE` vẫn kết nối và truy vấn bình thường.
 *
 * Vẫn giữ đường lùi cho môi trường không có cert: chạy được nhưng ghi CẢNH BÁO mỗi lần khởi
 * động, để trạng thái kém an toàn không lặng lẽ thành vĩnh viễn.
 */
export function docCauHinhSsl(configService: ConfigService): CauHinhSsl {
  if (configService.get<string>('DB_SSL') === 'false') return false;

  const ca = docCa(configService);
  if (ca) return { ca, rejectUnauthorized: true };

  new Logger('Database').warn(
    'Kết nối Postgres đang KHÔNG xác minh chứng chỉ máy chủ (rejectUnauthorized: false). ' +
      'Đặt DB_CA_CERT, DB_CA_CERT_FILE hoặc CA_CERTIFICATE để bật xác minh.',
  );
  return { rejectUnauthorized: false };
}

function docCa(configService: ConfigService): string {
  const trucTiep = configService.get<string>('DB_CA_CERT')?.trim();
  if (trucTiep) return trucTiep;

  const duongDan = configService.get<string>('DB_CA_CERT_FILE')?.trim();
  if (duongDan) {
    try {
      return readFileSync(duongDan, 'utf8').trim();
    } catch (e) {
      // Chỉ định đường dẫn mà đọc không được là LỖI CẤU HÌNH, không phải lý do để lặng lẽ
      // tụt về chế độ không xác minh — nói to ra rồi mới xét nguồn tiếp theo.
      new Logger('Database').error(
        `DB_CA_CERT_FILE trỏ tới "${duongDan}" nhưng không đọc được: ${(e as Error).message}`,
      );
    }
  }

  return configService.get<string>('CA_CERTIFICATE')?.trim() || '';
}
