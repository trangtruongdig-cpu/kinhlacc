import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ConfigService } from '@nestjs/config';
import { docCauHinhSsl } from './db-ssl.util';

/** ConfigService giả — chỉ cần `get`. */
const cauHinh = (bien: Record<string, string>) =>
  ({ get: (k: string) => bien[k] }) as unknown as ConfigService;

const PEM = '-----BEGIN CERTIFICATE-----\nMIIabc\n-----END CERTIFICATE-----';

describe('docCauHinhSsl', () => {
  it('DB_SSL=false → tắt hẳn TLS', () => {
    expect(docCauHinhSsl(cauHinh({ DB_SSL: 'false' }))).toBe(false);
  });

  it('DB_CA_CERT → bật xác minh', () => {
    expect(docCauHinhSsl(cauHinh({ DB_CA_CERT: PEM }))).toEqual({
      ca: PEM,
      rejectUnauthorized: true,
    });
  });

  it('CA_CERTIFICATE (tên Aiven tự đặt) → bật xác minh', () => {
    // Đây là phép kiểm đáng giá nhất: backend/.env của phòng chẩn trị vốn đã có cert dưới
    // đúng tên này. Bản đầu chỉ đọc DB_CA_CERT nên cert nằm sẵn đó mà vẫn chạy không xác minh.
    expect(docCauHinhSsl(cauHinh({ CA_CERTIFICATE: PEM }))).toEqual({
      ca: PEM,
      rejectUnauthorized: true,
    });
  });

  it('cắt khoảng trắng thừa quanh cert', () => {
    expect(
      docCauHinhSsl(cauHinh({ CA_CERTIFICATE: `\n  ${PEM}  \n` })),
    ).toEqual({
      ca: PEM,
      rejectUnauthorized: true,
    });
  });

  it('DB_CA_CERT_FILE → đọc cert từ file', () => {
    const f = join(mkdtempSync(join(tmpdir(), 'ca-')), 'ca.pem');
    writeFileSync(f, PEM + '\n');
    expect(docCauHinhSsl(cauHinh({ DB_CA_CERT_FILE: f }))).toEqual({
      ca: PEM,
      rejectUnauthorized: true,
    });
  });

  it('DB_CA_CERT thắng CA_CERTIFICATE khi có cả hai', () => {
    const rieng =
      '-----BEGIN CERTIFICATE-----\nRIENG\n-----END CERTIFICATE-----';
    expect(
      docCauHinhSsl(cauHinh({ DB_CA_CERT: rieng, CA_CERTIFICATE: PEM })),
    ).toEqual({
      ca: rieng,
      rejectUnauthorized: true,
    });
  });

  it('DB_CA_CERT_FILE hỏng → KHÔNG im lặng, vẫn xét được CA_CERTIFICATE', () => {
    const ket = docCauHinhSsl(
      cauHinh({
        DB_CA_CERT_FILE: '/khong/ton/tai/ca.pem',
        CA_CERTIFICATE: PEM,
      }),
    );
    expect(ket).toEqual({ ca: PEM, rejectUnauthorized: true });
  });

  it('không có cert nào → chạy tiếp nhưng KHÔNG xác minh', () => {
    expect(docCauHinhSsl(cauHinh({}))).toEqual({ rejectUnauthorized: false });
  });
});
