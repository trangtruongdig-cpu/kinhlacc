// dict-data.mjs — LỚP DỮ LIỆU CHUNG cho từ điển (huyệt vị + đường kinh).
//
// Một nguồn sự thật cho cả 3 dây chuyền: build-dict.mjs (sinh HTML), gen-sitemap.mjs
// (liệt kê URL), indexnow.mjs (ping). Tách "model" (load + phân loại + quyết noindex +
// slug) khỏi "view" (render HTML) → sitemap/IndexNow & trang luôn KHỚP nhau.
//
// Khớp huyệt↔kinh & mã WHO theo ID/MÃ qua acu-index.js (ACU_INDEX) — KHÔNG khớp theo tên
// bỏ dấu (tránh Trung Chú≠Trung Chử, Quản≠Quan). corrupt/thin → noindex.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(here, '..', 'public/kinhmach3d/data')

export const MIN_BODY_CHARS = 200 // dưới ngưỡng → noindex (chống thin/doorway trên site YMYL)
export const LOAI_LABEL = { kinh: 'Kinh huyệt', ky: 'Kỳ huyệt (ngoài 12 đường kinh)', athi: 'A Thị huyệt' }

// (rawKey, nhãn hiển thị, đóng khung cảnh báo thủ thuật?) — DÙNG CHUNG cho render & tính bodyLen.
export const HUYET_SECTIONS = [
  ['TÊN HUYỆT', 'Ý Nghĩa Tên Huyệt', false],
  ['ĐẶC TÍNH', 'Đặc Tính', false],
  ['VỊ TRÍ', 'Vị Trí', false],
  ['GIẢI PHẪU', 'Giải Phẫu', false],
  ['TÁC DỤNG', 'Tác Dụng', false],
  ['CHỦ TRỊ', 'Chủ Trị', false],
  ['CHÂM CỨU', 'Cách Châm Cứu', true],
  ['XUẤT XỨ', 'Xuất Xứ', false],
]
// Render MỌI field có mặt (12 chính kinh: desc/chinh/can…; mạch: dacTinh/vanHanh/trieuChung).
export const KINH_SECTIONS = [
  ['desc', 'Đại Cương', false],
  ['dacTinh', 'Đặc Tính', false],
  ['vanHanh', 'Vận Hành', false],
  ['chinh', 'Đường Kinh Chính', false],
  ['can', 'Kinh Cân', false],
  ['biet', 'Kinh Biệt', false],
  ['doc', 'Lạc Dọc', false],
  ['ngang', 'Lạc Ngang', false],
  ['trieuChung', 'Triệu Chứng / Chủ Trị', false],
  ['chuTri', 'Chủ Trị', false],
  ['dieuTri', 'Điều Trị', true],
]

// ───────────────────────── Đọc dữ liệu gốc (window.X = {JSON}) ──────────────
function loadGlobalJson(file) {
  const txt = readFileSync(join(dataDir, file), 'utf8')
  const a = txt.indexOf('{')
  const b = txt.lastIndexOf('}')
  if (a < 0 || b <= a) throw new Error(`Không tìm thấy object JSON trong ${file}`)
  return JSON.parse(txt.slice(a, b + 1))
}
export const ACU = loadGlobalJson('acupoints.js')
export const MER = loadGlobalJson('meridians.js')
export const IDX = loadGlobalJson('acu-index.js') // { codeToId, points:[{id,code,corrupt,hasViTri}], merVi }
// Toạ độ 3D — CHỈ dùng để biết huyệt nào bay tới được trên /xem-3d?focus=<mã> (cùng phép gác
// `coords.points[code]` của TuDienView). Chú thích đầu tệp có dấu '{' nên phải tìm sau tên biến.
export const COORDS3D_CODES = (() => {
  const txt = readFileSync(join(dataDir, 'acu-coords3d.js'), 'utf8')
  const a = txt.indexOf('{', txt.indexOf('ACU_COORDS3D'))
  const b = txt.lastIndexOf('}')
  return new Set(Object.keys(JSON.parse(txt.slice(a, b + 1)).points || {}))
})()

// ───────────────────────── Chuẩn hoá tên (slug & dò A Thị) ──────────────────
export const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()
export const fold = (s) => norm(s).replace(/[^a-z0-9]+/g, ' ').trim()
export function slugify(s) {
  return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'muc'
}

// ───────────────────────── Chỉ mục theo ID (chuẩn, hết nhập nhằng dấu) ───────
// ⚠️ KHÔNG lấy `p.corrupt` ra khỏi đây: xem coRacChu() bên dưới — cờ rác nay ĐO từ nội dung.
export const idxById = new Map()
for (const p of IDX.points || []) idxById.set(p.id, { code: p.code || '', hasViTri: !!p.hasViTri })
export const codeToId = new Map(Object.entries(IDX.codeToId || {}).map(([c, id]) => [c.toUpperCase(), id]))

// id huyệt → bản ghi ACU (kèm slug DUY NHẤT). records giữ nguyên thứ tự để build & sitemap khớp.
export const records = ACU.records || []
export const acuById = new Map()
const seenSlug = new Set()
for (const r of records) {
  let s = r.slug || slugify(r.ten)
  if (seenSlug.has(s)) { let i = 2; while (seenSlug.has(`${s}-${i}`)) i++; s = `${s}-${i}` }
  r._slug = s
  seenSlug.add(s)
  acuById.set(r.id, r)
}

// ───────────────────────── Bản đồ TRỤ–NHÁNH ─────────────────────────────────
const KINH_SLUG_BY_CODE = {
  LU: 'phe', LI: 'dai-truong', ST: 'vi', SP: 'ty', HT: 'tam', SI: 'tieu-truong',
  BL: 'bang-quang', KI: 'than', PC: 'tam-bao', TE: 'tam-tieu', SJ: 'tam-tieu',
  GB: 'dom', LR: 'can', LIV: 'can', GV: 'doc', CV: 'nham',
}
const KINH_SLUG_OVERRIDE = {
  'mach doi': 'mach-doi', 'mach doi dai': 'mach-doi', 'mach xung': 'mach-xung',
  'mach am kieu': 'mach-am-kieu', 'mach duong kieu': 'mach-duong-kieu',
  'mach am duy': 'mach-am-duy', 'mach duong duy': 'mach-duong-duy',
}
export const kinhSlugOf = (m) => KINH_SLUG_BY_CODE[m.code] || KINH_SLUG_OVERRIDE[fold(m.ten)] || slugify(m.ten)

// 12 chính kinh TRƯỚC để huyệt dùng chung gán về kinh chính (không vào kỳ kinh bát mạch).
export const meridianList = [...(MER.kinh || []), ...(MER.circuits || [])]

// id huyệt → { code, kinhTen, kinhSlug, mer } — khớp point→huyệt qua MÃ WHO (codeToId), KHÔNG qua tên.
// ⚠️ MÃ WHO lấy từ CHÍNH p.code của đường kinh, KHÔNG lấy từ IDX.points[].code. Hai nguồn này
// lệch nhau: `codeToId` đủ 361 mã và đúng, còn `IDX.points[].code` (bản sinh 08/09/2026, script
// sinh ra nó đã không còn trong repo) thiếu 30 mã và SAI 1 mã (Khí Xung ghi ST39, thật là ST30).
// Đã trả giá: 30 trang huyệt mất cả hàng "Mã WHO" lẫn hai nút "Xem Vị Trí Trên Đồ Hình 3D" /
// "Xem Trên Đường Kinh" (Trung Phủ LU1, Thái Khê KI3, Phế Du BL13, Trung Quản CV12…), và trang
// Khí Xung thì có nút nhưng bay tới Hạ Cự Hư. Dùng p.code còn khiến neo #<mã> khớp tuyệt đối
// với id mà trang /kinh/ dựng (cũng từ p.code) — tab Từ Điển trong app vốn đã làm đúng như vậy.
export const merByAcuId = new Map()
for (const m of meridianList) {
  const kinhSlug = kinhSlugOf(m)
  for (const p of m.points || []) {
    const code = p.code ? String(p.code).toUpperCase() : ''
    const id = code ? codeToId.get(code) : null
    if (id != null && !merByAcuId.has(id)) merByAcuId.set(id, { code, kinhTen: m.ten, kinhSlug, mer: m })
  }
}

export function classify(rec) {
  const meta = idxById.get(rec.id) || {}
  const mer = merByAcuId.get(rec.id)
  if (mer) return { loai: 'kinh', code: mer.code || meta.code || '', kinhTen: mer.kinhTen, kinhSlug: mer.kinhSlug, mer: mer.mer }
  if (/^a thi\b/.test(fold(rec.ten))) return { loai: 'athi', code: meta.code || '' }
  return { loai: 'ky', code: meta.code || '' }
}

// 1 point trên kinh → bản ghi huyệt (qua MÃ WHO; thiếu mã thì null).
export function recOfPoint(p) {
  const id = p.code ? codeToId.get(String(p.code).toUpperCase()) : null
  return id != null ? acuById.get(id) : null
}

export function sec(rec, h) {
  const want = norm(h)
  const s = (rec.sections || []).find((x) => norm(x.h) === want)
  return s ? String(s.body || '').trim() : ''
}

// ───────────────────────── Quyết định noindex (rác chữ / thin) ───────────────
// bodyLen TÍNH ĐÚNG bộ field mà build-dict render → sitemap/IndexNow & trang khớp tuyệt đối.
export function huyetBodyLen(rec) {
  let n = 0
  for (const [h] of HUYET_SECTIONS) { const b = sec(rec, h); if (b) n += b.length }
  if (rec.phoiHuyet) n += rec.phoiHuyet.length
  if (rec.ghiChu) n += rec.ghiChu.length
  return n
}

// Chữ mà build-dict thật sự IN RA trang — phép dò rác phải soi đúng ngần ấy, không hơn.
function chuHienThi(rec) {
  const ph = []
  for (const [h] of HUYET_SECTIONS) { const b = sec(rec, h); if (b) ph.push(b) }
  if (rec.phoiHuyet) ph.push(String(rec.phoiHuyet))
  if (rec.ghiChu) ph.push(String(rec.ghiChu))
  if (rec.thamKhao) ph.push(String(rec.thamKhao))
  return ph.join('\n')
}

// Dấu hiệu rác chữ di sản từ app Windows cũ. MỖI dòng là một dạng KHÔNG BAO GIỜ xuất hiện
// trong văn bản viết đúng — cố ý hẹp, vì ở đây vu oan tốn đắt hơn bỏ sót: một lần gắn nhầm
// là chôn vĩnh viễn một bài y văn đầy đủ khỏi bộ máy tìm kiếm, mà không ai đọc lại để biết.
const DAU_HIEU_RAC = [
  /\uFFFD/,                          // ký tự thay thế — giải mã hỏng
  /[^\P{Cc}\t\n\r]/u,                // ký tự điều khiển, chừa \t \n \r (phủ định kép: \P{Cc} = KHÔNG phải điều khiển)
  /Ã[\u0080-\u00BF]|Ä[\u0080-\u00BF]|á»|Æ°|â€|Ð/, // mojibake UTF-8 đọc nhầm thành Latin-1
  /[\u4E00-\u9FFF]/,                // chữ Hán lẫn trong thân bài (Hán tự có cột RIÊNG)
  /[0-9A-Za-zÀ-ỹ][¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿]|[¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿][0-9A-Za-zÀ-ỹ]/, // tàn dư TCVN3/VNI
]

/**
 * Bài có rác chữ không — ĐO LẠI TỪ NỘI DUNG mỗi lần build.
 *
 * ⚠️ KHÔNG đọc cờ `corrupt` của acu-index.js nữa. Cờ đó là ẢNH CHỤP ngày 08/09/2026, không
 * tự cập nhật, và script sinh ra nó đã không còn trong repo — nên sau đợt dọn rác chữ 18/09
 * nó sai cả hai chiều: gắn cờ 45 mục nay đã SẠCH (chôn noindex 33 trang bài đầy đủ, trong đó
 * Hợp Cốc 6.092 ký tự và Quan Nguyên 6.385), đồng thời BỎ SÓT mục còn rác thật (Dương Trì TE4
 * có đuôi ": 31v¼9:"). Đo lại từ nội dung thì cờ tự đúng theo kho, khỏi phải nhớ chạy lại gì.
 *
 * Số đo 02/10/2026 trên cả 1.059 mục: toàn kho chỉ còn 9 ký tự thuộc nhóm ¼½¾, trong đó 6 là
 * phân số viết đúng ("bỏ đi ¼, lấy ¾", "lấy ½ dây đó đo") — nên luật TCVN3 đòi ký hiệu phải
 * DÍNH LIỀN chữ/số. Không mục nào còn U+FFFD, mojibake hay chữ Hán.
 */
export function coRacChu(rec) {
  const t = chuHienThi(rec)
  return DAU_HIEU_RAC.some((re) => re.test(t))
}

export function huyetIndexable(rec) {
  return !coRacChu(rec) && huyetBodyLen(rec) >= MIN_BODY_CHARS
}
export function kinhBodyLen(m) {
  let n = 0
  for (const [k] of KINH_SECTIONS) { if (m[k]) n += String(m[k]).length }
  return n
}
export function kinhIndexable(m) {
  return kinhBodyLen(m) >= MIN_BODY_CHARS
}

// ───────────────────────── Phân Loại (traits từ dict-facets.js) ─────────────
// dict-facets.js comment đầu file chứa '{' → bám lastIndexOf('window.DICT_FACETS') như BENH.
export const DICT_FACETS = (() => {
  try {
    const txt = readFileSync(join(dataDir, 'dict-facets.js'), 'utf8')
    const asn = txt.lastIndexOf('window.DICT_FACETS')
    const a = txt.indexOf('{', asn >= 0 ? asn : 0)
    const b = txt.lastIndexOf('}')
    if (a < 0 || b <= a) return null
    return JSON.parse(txt.slice(a, b + 1))
  } catch { return null }
})()

// Bản đồ ngược: acuId → [tên trait, …] (thứ tự theo dict-facets.js → đúng thứ tự dict-traits.json).
export const traitsByAcuId = new Map()
if (DICT_FACETS && DICT_FACETS.traits) {
  for (const [, trait] of Object.entries(DICT_FACETS.traits)) {
    for (const id of (trait.huyetIds || [])) {
      const list = traitsByAcuId.get(id) || []
      list.push(trait.ten)
      traitsByAcuId.set(id, list)
    }
  }
}

// ───────────────────────── Bệnh học + Châm cứu trị bệnh ─────────────────────
// benh.js: window.BENH = { ccdt:{title,metaLabel,fields,records[]}, benhhoc:{…} }.
// Mỗi record: { id, ten, slug, _meta?, <các khoá có trong fields> }. fields = [[khoá, Nhãn],…].
export const BENH = (() => {
  // KHÔNG dùng loadGlobalJson chung: dòng comment đầu file chứa "window.BENH = { ccdt, benhhoc }"
  // (có dấu ngoặc) làm indexOf('{') ăn nhầm. → bám LẦN CUỐI "window.BENH" (lệnh gán thật, sau comment).
  try {
    const txt = readFileSync(join(dataDir, 'benh.js'), 'utf8')
    const asn = txt.lastIndexOf('window.BENH')
    const a = txt.indexOf('{', asn >= 0 ? asn : 0)
    const b = txt.lastIndexOf('}')
    if (a < 0 || b <= a) return {}
    return JSON.parse(txt.slice(a, b + 1))
  } catch {
    return {}
  }
})()

// 2 bộ → 2 NHÁNH URL RIÊNG (KHÔNG gộp bệnh học với châm cứu trị bệnh).
// cautionKey: trường "điều trị" cần đóng khung cảnh báo (thủ thuật châm/cứu).
export const BENH_SETS = [
  { key: 'ccdt', dir: 'cham-cuu-tri-benh', aboutType: 'MedicalCondition', cautionKey: 'dieuTri' },
  { key: 'benhhoc', dir: 'benh-hoc', aboutType: 'MedicalCondition', cautionKey: null },
]

// Gán _slug DUY NHẤT trong TỪNG bộ (slug nguồn có thể trùng giữa 2 bộ → tách theo nhánh URL).
for (const cfg of BENH_SETS) {
  const set = BENH[cfg.key]
  if (!set || !Array.isArray(set.records)) continue
  const seen = new Set()
  for (const r of set.records) {
    let s = r.slug || slugify(r.ten)
    if (seen.has(s)) { let i = 2; while (seen.has(`${s}-${i}`)) i++; s = `${s}-${i}` }
    r._slug = s
    seen.add(s)
  }
}

// Độ dài thân bài (meta + mọi trường trong fields) → quyết noindex nếu quá mỏng.
export function benhBodyLen(rec, fields) {
  let n = rec._meta ? rec._meta.length : 0
  for (const [k] of fields || []) if (rec[k]) n += String(rec[k]).length
  return n
}
export function benhIndexable(rec, fields) {
  return benhBodyLen(rec, fields) >= MIN_BODY_CHARS
}

// ── Lớp 1: liên kết chéo bệnh học ↔ châm cứu trị bệnh (cùng tên bệnh) ──
// fold(tên) → { ccdt?:rec, benhhoc?:rec }. 2 góc nhìn (lý thuyết vs cách trị) của 1 bệnh.
export const benhByName = new Map()
for (const cfg of BENH_SETS) {
  const set = BENH[cfg.key]
  if (!set || !Array.isArray(set.records)) continue
  for (const r of set.records) {
    if (!r || !r.ten) continue
    const k = fold(r.ten)
    if (!k) continue
    const e = benhByName.get(k) || {}
    e[cfg.key] = r
    benhByName.set(k, e)
  }
}
/** Bản ghi cùng tên ở bộ KIA (hoặc null). */
export function benhCross(rec, fromKey) {
  const e = benhByName.get(fold(rec.ten))
  if (!e) return null
  return e[fromKey === 'ccdt' ? 'benhhoc' : 'ccdt'] || null
}

// ── Lớp 2: đích link HUYỆT (để bệnh→huyệt). Lọc an toàn (giống relink-blog.mjs --huyet) ──
// (Cố ý lặp logic với relink-blog để KHÔNG đụng script đó; nếu sửa blocklist nhớ sửa cả 2 nơi.)
const HUYET_NAME_BLOCK = new Set([
  'thái dương', 'nhân trung', 'thái âm', 'thiếu âm', 'dương minh',
  'âm dương', 'trung bình', 'tử cung', 'thượng vị',
])
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
let _huyetTargets = null
/** [{ten, slug, re, len}] cho mọi tên huyệt ≥2 âm tiết & ≥5 ký tự, không trong blocklist; cụm dài trước. */
export function huyetLinkTargets() {
  if (_huyetTargets) return _huyetTargets
  const seen = new Set()
  const out = []
  for (const r of records) {
    if (!r || !r.ten || !r._slug) continue
    const name = String(r.ten).trim()
    const key = name.toLowerCase()
    if (name.split(/\s+/).length < 2 || name.length < 5) continue
    if (HUYET_NAME_BLOCK.has(key) || seen.has(key)) continue
    seen.add(key)
    out.push({ ten: name, slug: r._slug, re: new RegExp(`(?<![\\p{L}\\p{N}])${escRe(name)}(?![\\p{L}\\p{N}])`, 'iu'), len: name.length })
  }
  out.sort((a, b) => b.len - a.len) // Túc Tam Lý trước Tam Lý
  _huyetTargets = out
  return out
}

/**
 * Liệt kê MỌI trang từ điển kèm đường dẫn + cờ index — dùng cho sitemap & IndexNow.
 * Gồm 2 trang HUB mục lục (/kinh/ , /huyet/) + từng trang kinh + từng trang huyệt.
 * (Chỉ entry.index === true mới vào sitemap/ping; trang noindex vẫn build nhưng KHÔNG đẩy bot.)
 */
export function listDictPages() {
  const out = [
    { loc: '/kinh/', index: true, kind: 'index' }, // hub 20 đường kinh
    { loc: '/huyet/', index: true, kind: 'index' }, // hub tra cứu huyệt (đường vào cho kỳ huyệt)
  ]
  // `anh`: danh sách ảnh của trang, để gen-sitemap khai <image:image>. Không khai thì
  // Google chỉ tìm được ảnh bằng cách bò vào từng trang — chậm và dễ sót với 1.795 ảnh.
  // Đường dẫn ở đây là TƯƠNG ĐỐI; gen-sitemap nối DOMAIN vào (sitemap đòi URL tuyệt đối).
  const ASSET = '/kinhmach3d/'
  const anhKinh = (m) => {
    const x = m.images && (m.images.chinh || m.images.sodo || m.images.gen)
    return x ? [{ url: ASSET + String(x).replace(/^\/+/, ''), ten: `Sơ đồ ${m.ten}` }] : []
  }
  const anhHuyet = (rec) => {
    // Ưu tiên bộ 4 ảnh 3D (đã là đường tĩnh có nghĩa); không có thì dùng ảnh sơ đồ cũ.
    if (rec.anh3d) {
      const nhan = { da: 'trên da', gp: 'trên giải phẫu', lan: 'huyệt lân cận', kinh: 'toàn đường kinh' }
      return Object.entries(nhan)
        .filter(([k]) => rec.anh3d[k])
        .map(([k, v]) => ({ url: rec.anh3d[k], ten: `${rec.ten} — ${v}` }))
    }
    return rec.image ? [{ url: ASSET + String(rec.image).replace(/^\/+/, ''), ten: `Sơ đồ huyệt ${rec.ten}` }] : []
  }
  for (const m of meridianList) if (m && m.ten) out.push({ loc: `/kinh/${kinhSlugOf(m)}/`, index: kinhIndexable(m), kind: 'kinh', anh: anhKinh(m) })
  for (const rec of records) if (rec && rec.ten) out.push({ loc: `/huyet/${rec._slug}/`, index: huyetIndexable(rec), kind: 'huyet', anh: anhHuyet(rec) })
  // Bệnh học + Châm cứu trị bệnh: mỗi bộ 1 hub mục lục + từng trang bệnh.
  for (const cfg of BENH_SETS) {
    const set = BENH[cfg.key]
    if (!set || !Array.isArray(set.records)) continue
    out.push({ loc: `/${cfg.dir}/`, index: true, kind: 'benh-hub' })
    for (const rec of set.records) {
      if (!rec || !rec.ten) continue
      out.push({ loc: `/${cfg.dir}/${rec._slug}/`, index: benhIndexable(rec, set.fields), kind: cfg.key })
    }
  }
  return out
}
