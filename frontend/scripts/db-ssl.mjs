// db-ssl.mjs — Cấu hình SSL dùng CHUNG cho các script prerender nối Postgres (Aiven).
//
// Vì sao cần: Aiven ký chứng chỉ bằng CA RIÊNG. Bật rejectUnauthorized:true mà không đưa CA
// vào thì lỗi ngay "self-signed certificate in certificate chain" (đã đo 25/09/2026). Nhưng để
// rejectUnauthorized:false thì kết nối chỉ được MÃ HOÁ chứ không XÁC MINH danh tính máy chủ —
// kẻ chen giữa có thể mạo danh Aiven mà không bị phát hiện.
//
// Nguồn CA, theo thứ tự:
//   1. CA_CERTIFICATE   — máy dev: script tự nạp backend/.env qua dotenv nên có sẵn.
//   2. DB_CA_CERT_FILE  — trong Docker build: Dockerfile trích CA ra file PEM rồi trỏ vào đây.
//                         (Không truyền thẳng qua env được vì PEM trải 26 dòng, `source` sẽ vỡ.)
//
// Không tìm thấy CA → KHÔNG làm gãy build, chỉ lui về mức cũ (mã hoá, không xác minh).
import { readFileSync, existsSync } from 'node:fs'

export function sslConfig() {
  if (process.env.DB_SSL === 'false') return false

  const tuFile = process.env.DB_CA_CERT_FILE && existsSync(process.env.DB_CA_CERT_FILE)
    ? readFileSync(process.env.DB_CA_CERT_FILE, 'utf8')
    : ''
  const ca = (process.env.CA_CERTIFICATE || tuFile || '').trim()

  if (!ca) {
    console.warn('⚠ db-ssl: không có CA (CA_CERTIFICATE / DB_CA_CERT_FILE) — nối SSL nhưng KHÔNG xác minh danh tính máy chủ.')
    return { rejectUnauthorized: false }
  }
  return { ca, rejectUnauthorized: true }
}

// Hẹn giờ cho MỌI kết nối DB của khâu build. pg mặc định chờ VÔ HẠN: ngày 29/09/2026 mạng
// tới Aiven chập một nhịp (máy ngủ, TCP chết không báo) và build-phuong đứng im 3 giờ rồi
// 7 giờ trước khi ra `read ETIMEDOUT`. Có hẹn giờ thì builder báo lỗi trong vòng một phút
// và đi đường "BỎ QUA" đã có sẵn — kiem-sitemap sẽ chặn bản thiếu trang ở cuối.
export const HEN_GIO_DB = { connectionTimeoutMillis: 30_000, query_timeout: 300_000, keepAlive: true }
