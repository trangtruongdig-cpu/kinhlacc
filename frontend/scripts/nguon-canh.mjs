// nguon-canh.mjs — Nạp cạnh "y văn dẫn mục này" từ DB app để builder dựng khối liên kết.
//
// Đặc tả: docs/superpowers/specs/2026-10-02-do-thi-tri-thuc-thap-va-truc-ngang.md (GĐ 1)
// Cạnh do `backend/tmp/ghi-canh-nguon.mjs` ghi (2.505 huyệt + 416 bệnh học + 317 châm cứu
// + 6 kinh, đo 02/10/2026). Trước đó các cạnh này nằm trong kho mà KHÔNG trang nào hiện ra.
//
// ⚠️ HAI KHO, CẦU NỐI LÀ TÊN SÁCH. Cạnh nằm ở DB app (`nguon_*`, trỏ `nguon.id`), còn trang
// `/nguon/<slug>/` do CMS sinh (`ec_nguon_y_van`). Hai kho KHÔNG join chéo được. Nên tệp này
// chỉ trả về TÊN sách; builder đổi tên → slug bằng `nguonBySlug` (bản đồ fold(tên) → slug) mà
// `napNguon()` của build-dict đã dựng sẵn cho Phối Huyệt. Không phát minh cầu nối thứ hai.
//
// ⚠️ Không nối được DB thì trả về rỗng và KÊU TO — im lặng ở đây nghĩa là khối "Y văn dẫn mục
// này" lặng lẽ biến mất khỏi 1.200 trang mà build vẫn xanh.

import { createRequire } from 'node:module'
import { sslConfig, HEN_GIO_DB } from './db-ssl.mjs'

const require = createRequire(import.meta.url)

/** Mỗi mục hiện tối đa chừng này sách — trang huyệt dày nhất có 61 quyển, liệt kê hết là lạc đề. */
export const TRAN_MOI_MUC = 12

const RONG = { huyet: new Map(), kinh: new Map(), benhhoc: new Map(), ccdt: new Map(), viThuoc: new Map(), so: 0 }

/**
 * @returns {Promise<{huyet: Map<number,string[]>, kinh: Map<string,string[]>,
 *   benhhoc: Map<string,string[]>, ccdt: Map<string,string[]>, so: number}>}
 *   khoá = id từ điển (huyệt) hoặc slug (ba bộ còn lại); giá trị = tên sách, nhiều mục trước.
 */
export async function napCanhNguon() {
  const hasDb = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DB_HOST || process.env.POSTGRES_HOST
  if (!hasDb) {
    console.warn('⚠ nguon-canh: thiếu cấu hình DB — khối "Y văn dẫn mục này" sẽ KHÔNG hiện.')
    return RONG
  }
  let Client
  try {
    ;({ Client } = require('pg'))
  } catch {
    console.warn('⚠ nguon-canh: không nạp được `pg` — khối "Y văn dẫn mục này" sẽ KHÔNG hiện.')
    return RONG
  }
  const kho = new Client({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    host: process.env.DB_HOST || process.env.POSTGRES_HOST,
    port: Number(process.env.DB_PORT || process.env.POSTGRES_PORT || 5432),
    user: process.env.DB_USER || process.env.POSTGRES_USER,
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD,
    database: process.env.DB_NAME || process.env.POSTGRES_DATABASE,
    ssl: sslConfig(),
    ...HEN_GIO_DB,
  })
  const ra = { huyet: new Map(), kinh: new Map(), benhhoc: new Map(), ccdt: new Map(), viThuoc: new Map(), so: 0 }
  try {
    await kho.connect()
    // Bảng chưa có (chưa khởi động backend sau khi thêm DDL) → coi như không có cạnh, không gãy.
    const doc = async (bang, cot, dich, soKhoa) => {
      const co = await kho.query('SELECT to_regclass($1) AS t', [bang])
      if (!co.rows[0].t) return
      const r = await kho.query(
        `SELECT e.${cot} AS khoa, n.ten FROM ${bang} e JOIN nguon n ON n.id = e.nguon_id
         WHERE n.ten IS NOT NULL ORDER BY n.ten`,
      )
      for (const x of r.rows) {
        const k = soKhoa ? Number(x.khoa) : String(x.khoa)
        if (!dich.has(k)) dich.set(k, [])
        dich.get(k).push(String(x.ten))
        ra.so++
      }
    }
    await doc('nguon_huyet', 'huyet_id', ra.huyet, true)
    await doc('nguon_kinh', 'slug', ra.kinh, false)
    await doc('nguon_benh_hoc', 'slug', ra.benhhoc, false)
    await doc('nguon_cham_cuu', 'slug', ra.ccdt, false)
    await doc('nguon_vi_thuoc', 'vi_thuoc_id', ra.viThuoc, true)
  } catch (e) {
    console.warn(`⚠ nguon-canh: không đọc được cạnh nguồn (${e.message}) — khối "Y văn dẫn mục này" sẽ KHÔNG hiện.`)
    return RONG
  } finally {
    try { await kho.end() } catch { /* đóng được thì tốt, không thì thôi */ }
  }
  console.log(
    `✓ nguon-canh: ${ra.so} cạnh y văn (huyệt ${ra.huyet.size} · kinh ${ra.kinh.size} · bệnh học ${ra.benhhoc.size} · châm cứu ${ra.ccdt.size} · dược liệu ${ra.viThuoc.size} mục).`,
  )
  return ra
}

/**
 * Khối "Y văn dẫn mục này" — dùng CHUNG cho cả bốn bộ, thay vì mỗi builder ghép chuỗi riêng.
 * Tên nào không đổi được sang slug thì hiện chữ trơn: thiếu link còn hơn link chết.
 *
 * @param tenSach  tên sách của mục đó
 * @param slugCua  (tên) => slug | null  — thường là tra `nguonBySlug` của build-dict
 * @param esc      { text, attr } hai hàm thoát chuỗi của builder
 */
export function khoiYVan(tenSach, slugCua, esc, { tran = TRAN_MOI_MUC } = {}) {
  const ds = [...new Set((tenSach ?? []).map((t) => String(t).trim()).filter(Boolean))]
  if (!ds.length) return ''
  const hien = ds.slice(0, tran)
  const muc = hien
    .map((t) => {
      const s = slugCua(t)
      return s ? `<li><a href="/nguon/${esc.attr(s)}/">${esc.text(t)}</a></li>` : `<li>${esc.text(t)}</li>`
    })
    .join('')
  const con = ds.length - hien.length
  return (
    `<section class="dl-yvan"><h2>Y văn dẫn mục này</h2><ul class="dl-yvan-ds">${muc}</ul>` +
    (con > 0 ? `<p class="dl-yvan-con">… và ${con} y văn khác.</p>` : '') +
    `</section>`
  )
}

/** Chuẩn hoá mạnh để khớp tên sách giữa hai kho (bỏ dấu thanh + mọi dấu câu). */
export const foldTen = (x) =>
  String(x ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/**
 * Bản đồ fold(tên sách) → slug trang /nguon/, đọc từ CMS. build-dict đã có bản riêng cho Phối
 * Huyệt; hàm này để các builder KHÁC (build-duoc-lieu) không phải chép lại.
 * Không nối được thì trả Map rỗng và kêu — khối sẽ hiện chữ trơn, không link chết.
 */
export async function napNguonSlug() {
  const { moKetNoiCms } = await import('./cms-ket-noi.mjs')
  const map = new Map()
  const kn = moKetNoiCms('nguon-canh-slug')
  if (!kn) {
    console.warn('  Khối "Y văn dẫn mục này" sẽ hiện chữ TRƠN (không nối được kho CMS để lấy slug).')
    return map
  }
  try {
    await kn.kho.connect()
    for (const r of (await kn.kho.query(`SELECT slug, title FROM ec_nguon_y_van WHERE deleted_at IS NULL`)).rows) {
      const k = foldTen(r.title)
      if (k && r.slug && !map.has(k)) map.set(k, String(r.slug))
    }
  } catch (e) {
    console.warn(`⚠ nguon-canh: không đọc được ec_nguon_y_van (${e.message}) — khối hiện chữ trơn.`)
  } finally {
    await kn.dong()
  }
  return map
}
