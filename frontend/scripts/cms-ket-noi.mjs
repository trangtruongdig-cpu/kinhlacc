// cms-ket-noi.mjs — Nối tới kho CMS (`kinhlac_cms`) từ khâu build của frontend.
//
// VÌ SAO PHẢI GOM RIÊNG: builder nối `defaultdb` (kho app, qua backend/.env), còn
// seo-cms.mjs + nguon-cms.mjs cần `kinhlac_cms` (qua cms/.env). Hai kho tách biệt, không
// join chéo được.
//
// ⚠️ LỖ ĐÃ BỊT (26/09/2026): hai module kia đọc thẳng `cms/.env` bằng đường dẫn tương đối.
// Chạy ở máy lập trình thì đúng, nhưng NGỮ CẢNH BUILD CỦA DOCKER chỉ có `./frontend` —
// `../cms/.env` KHÔNG tồn tại trong container. Hậu quả nếu không bịt: build trên VPS vẫn
// XANH, chỉ in cảnh báo, rồi trang nguồn lặng lẽ dùng chữ của app và ghi đè SEO không có
// tác dụng. Đúng kiểu lỗi "deploy thành công mà tính năng không chạy".
//
// Nên thứ tự tìm cấu hình là:
//   1. CMS_ENV_FILE  — đường dẫn tệp env (Docker truyền BuildKit secret vào đây)
//   2. cms/.env      — máy lập trình
// và chứng chỉ:
//   1. CMS_CA_CERT_FILE — Docker đã trích CA ra /tmp/aiven-ca.pem cho các bước prerender;
//      CA của CMS GIỐNG HỆT CA_CERTIFICATE của backend (đã đo: cùng 1.526 ký tự), nên
//      dùng lại đúng tệp đó, khỏi truyền thêm.
//   2. cms/aiven-ca.pem — máy lập trình
//
// Không có chứng chỉ thì VẪN nối nhưng rơi về `rejectUnauthorized: false` và kêu — giống
// cách backend/src/utils/db-ssl.util.ts xử lý.

import { readFileSync, existsSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const goc = resolve(here, '../..')
const require = createRequire(import.meta.url)

/**
 * Trả về { kho, dong } — kho là Client của pg (CHƯA connect), dong() để đóng.
 * Trả null kèm lý do đã in cảnh báo nếu không dựng được.
 */
export function moKetNoiCms(tenModule) {
  const keu = (ly) => {
    console.warn(`⚠ ${tenModule}: ${ly}`)
    return null
  }

  const duongEnv = process.env.CMS_ENV_FILE || join(goc, 'cms/.env')
  if (!existsSync(duongEnv)) return keu(`không thấy tệp env của CMS (${duongEnv})`)

  let Client
  try {
    ;({ Client } = require('pg'))
  } catch {
    try {
      ;({ Client } = require(join(goc, 'backend/node_modules/pg')))
    } catch {
      return keu('không nạp được module `pg`')
    }
  }

  const env = parseEnv(readFileSync(duongEnv, 'utf8'))
  // Nhận cả hai lối đặt tên: PG* (EmDash dùng) và DB_* (backend dùng). cms/.env có cả hai.
  const host = env.PGHOST || env.DB_HOST
  const cong = Number(env.PGPORT || env.DB_PORT || 5432)
  const nguoi = env.PGUSER || env.DB_USER
  const matKhau = env.PGPASSWORD || env.DB_PASSWORD
  const csdl = env.PGDATABASE || env.DB_NAME
  if (!host || !nguoi || !csdl) return keu(`tệp env thiếu thông tin nối kho (${duongEnv})`)

  const duongCa = process.env.CMS_CA_CERT_FILE || join(goc, 'cms/aiven-ca.pem')
  let ssl = { rejectUnauthorized: false }
  if (existsSync(duongCa)) ssl = { ca: readFileSync(duongCa, 'utf8'), rejectUnauthorized: true }
  else console.warn(`⚠ ${tenModule}: không thấy chứng chỉ CA (${duongCa}) — nối kho CMS KHÔNG xác minh danh tính máy chủ.`)

  const kho = new Client({ host, port: cong, user: nguoi, password: matKhau, database: csdl, ssl })
  return { kho, dong: () => kho.end().catch(() => {}) }
}
