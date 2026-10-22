/**
 * Dọn phiếu đo bị ghi hai lần do bấm lại khi mạng chập (xem examination-idempotency.spec.ts).
 *
 * CHẠY THỬ LÀ MẶC ĐỊNH — phải `--ghi` mới xoá thật, cùng lối `cms/scripts-di-cu/dong-bo-app.mjs`.
 *
 * Luật nhận diện CỐ Ý HẸP: chỉ gom phiếu cùng bệnh nhân + CÙNG 24 số đo + CÙNG `thoiDiemKham`
 * (tức cùng MỘT lần điền phiếu). Giờ đo khác nhau thì để yên — đó có thể là đo lại thật, và ở
 * đây vu oan đắt hơn bỏ sót: xoá nhầm một phiếu đo là mất dữ liệu bệnh nhân không dựng lại được.
 *
 *   node tmp/don-phieu-do-trung.mjs          # chạy thử, chỉ in
 *   node tmp/don-phieu-do-trung.mjs --ghi    # xoá thật
 */
import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const GOC = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const env = dotenv.parse(fs.readFileSync(path.join(GOC, '.env')))
const GHI = process.argv.includes('--ghi')
const TRAN = 10 // trần an toàn: nhiều hơn ngần này là luật đã sai, dừng lại để người xem

const SQL_TRUNG = `
WITH m AS (
  SELECT e.id, e."patientId", e."createdAt", e."thoiDiemKham", e."chanDoan", e."donThuoc",
         (SELECT md5(string_agg(coalesce(v::text,'~'),'|' ORDER BY k))
            FROM jsonb_each_text(to_jsonb(mm) - 'id' - 'examination_id' - 'created_at'
                                 - 'updated_at' - 'measured_at') t(k,v)) AS van_tay
  FROM examinations e
  JOIN meridian_measurements mm ON mm.examination_id = e.id
  WHERE e."createdAt"::time <> '00:00:00'   -- bỏ dữ liệu di cư từ app Windows cũ (chỉ có ngày)
    AND e."thoiDiemKham" IS NOT NULL
),
nhom AS (
  SELECT *, min(id) OVER (PARTITION BY "patientId", van_tay, "thoiDiemKham") AS giu_id,
            count(*) OVER (PARTITION BY "patientId", van_tay, "thoiDiemKham") AS so_ban
  FROM m
)
SELECT id, "patientId" AS bn, giu_id,
       to_char("createdAt",'YYYY-MM-DD HH24:MI:SS') AS tao_luc,
       to_char("thoiDiemKham",'YYYY-MM-DD HH24:MI') AS gio_do,
       (SELECT count(*) FROM diagnoses d WHERE d.examination_id = nhom.id) AS so_chan_doan,
       ("chanDoan" IS NOT NULL) AS co_chan_doan_cu,
       ("donThuoc" IS NOT NULL) AS co_don_thuoc
FROM nhom WHERE so_ban > 1 AND id <> giu_id ORDER BY "patientId", id`

const ca = env.CA_CERTIFICATE || null
const c = new pg.Client({
  host: env.DB_HOST, port: Number(env.DB_PORT || 5432), user: env.DB_USER,
  password: env.DB_PASSWORD, database: env.DB_NAME,
  ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
})
await c.connect()
try {
  const { rows } = await c.query(SQL_TRUNG)
  console.log(`\n${GHI ? '⚠️  GHI THẬT' : 'Chạy thử (thêm --ghi để xoá)'} — tìm thấy ${rows.length} phiếu thừa:`)
  console.table(rows)

  // Phiếu đã có chẩn đoán/đơn thuốc là phiếu ĐÃ DÙNG: người ta đã đọc nó và kết luận trên đó.
  // Xoá là xoá cả việc đã làm, nên bỏ ra cho người quyết bằng mắt.
  const daDung = rows.filter((r) => Number(r.so_chan_doan) > 0 || r.co_chan_doan_cu || r.co_don_thuoc)
  const xoaDuoc = rows.filter((r) => !daDung.includes(r))
  if (daDung.length) {
    console.log(`\n⚠️  BỎ QUA ${daDung.length} phiếu đã có chẩn đoán hoặc đơn thuốc: ${daDung.map((r) => r.id).join(', ')}`)
  }
  if (!xoaDuoc.length) { console.log('\nKhông có gì để xoá.'); process.exit(0) }
  if (xoaDuoc.length > TRAN) {
    console.error(`\n✗ DỪNG: ${xoaDuoc.length} phiếu vượt trần an toàn ${TRAN}. Luật nhận diện có thể đã sai — xem lại trước khi chạy.`)
    process.exit(1)
  }
  if (!GHI) { console.log(`\nSẽ xoá ${xoaDuoc.length} phiếu: ${xoaDuoc.map((r) => r.id).join(', ')}`); process.exit(0) }

  const ids = xoaDuoc.map((r) => r.id)

  // Sao lưu TRƯỚC khi xoá. Đây là dữ liệu bệnh nhân thật, không dựng lại được từ chỗ nào khác;
  // thư mục tmp/ nằm trong .gitignore nên bản sao không lọt vào git.
  const sao = {
    luc: new Date().toISOString(),
    examinations: (await c.query('SELECT * FROM examinations WHERE id = ANY($1::int[])', [ids])).rows,
    meridian_measurements: (await c.query('SELECT * FROM meridian_measurements WHERE examination_id = ANY($1::int[])', [ids])).rows,
    diagnoses: (await c.query('SELECT * FROM diagnoses WHERE examination_id = ANY($1::int[])', [ids])).rows,
  }
  const duongSao = path.join(GOC, 'tmp', `sao-luu-phieu-trung-${Date.now()}.json`)
  fs.writeFileSync(duongSao, JSON.stringify(sao, null, 2))
  console.log(`\nĐã sao lưu ${sao.examinations.length} phiếu vào ${duongSao}`)

  await c.query('BEGIN')
  const d1 = await c.query('DELETE FROM meridian_measurements WHERE examination_id = ANY($1::int[])', [ids])
  const d2 = await c.query('DELETE FROM diagnoses WHERE examination_id = ANY($1::int[])', [ids])
  const d3 = await c.query('DELETE FROM examinations WHERE id = ANY($1::int[])', [ids])
  if (d3.rowCount !== ids.length) {
    await c.query('ROLLBACK')
    console.error(`✗ ROLLBACK: định xoá ${ids.length} phiếu, DELETE báo ${d3.rowCount}.`)
    process.exit(1)
  }
  await c.query('COMMIT')
  console.log(`\n✓ Đã xoá ${d3.rowCount} phiếu (kèm ${d1.rowCount} dòng số đo, ${d2.rowCount} chẩn đoán).`)
} finally {
  await c.end()
}
