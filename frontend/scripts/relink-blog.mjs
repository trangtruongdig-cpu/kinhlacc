// relink-blog.mjs — Tự DỆT LẠI liên kết nội bộ vào các bài blog đã có.
//
// Hai loại đích:
//   1) TRANG TÍNH NĂNG (mặc định): cụm từ khoá → /xem-ket-qua-do, /xem-3d, /xem-bai-thuoc, /thu-vien.
//   2) HUYỆT VỊ (cờ --huyet): tên huyệt xuất hiện trong bài → trang tĩnh /huyet/<slug>/ (từ dict-data).
//
// AN TOÀN (áp cho CẢ hai):
//   - Mặc định chạy THỬ (dry-run) — chỉ in ra sẽ thêm gì, KHÔNG ghi file. Thêm --write để ghi thật.
//   - Idempotent: nếu bài ĐÃ có link tới một đường dẫn thì bỏ qua đường dẫn đó (không thêm trùng).
//   - Không đụng tiêu đề (#), trích dẫn (>), bảng (|), khối code (```), link/`code` sẵn có, hay ảnh.
//   - Khớp theo RANH GIỚI từ (không bọc nhầm giữa một từ dài hơn).
//   - Cap số link MỚI mỗi bài (riêng cho tính năng & cho huyệt) để tránh nhồi nhét.
//
// Dùng:
//   node scripts/relink-blog.mjs                  # tính năng (dry-run)
//   node scripts/relink-blog.mjs --huyet          # tính năng + huyệt (dry-run, in chi tiết)
//   node scripts/relink-blog.mjs --huyet --write  # ghi thật
//   npm run blog:relink   /   npm run blog:relink -- --huyet --write
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONTENT_DIR } from './blog-lib.mjs'
import { records } from './dict-data.mjs'

const WRITE = process.argv.includes('--write')
const HUYET = process.argv.includes('--huyet')
const MAX_FEATURE = 4
const MAX_HUYET = 6

// "Sentinel" che link/code: 2 ký tự vùng-riêng Unicode (U+E000/U+E001) — KHÔNG bao giờ xuất hiện
// trong văn bản thường, nên khi phục hồi KHÔNG đụng nhầm số thật (vd "khoảng 1 thốn").
const MASK_OPEN = String.fromCharCode(0xe000)
const MASK_CLOSE = String.fromCharCode(0xe001)
const maskTok = (i) => `${MASK_OPEN}${i}${MASK_CLOSE}`

// Bản đồ cụm-từ → trang tính năng. Đặt cụm DÀI/cụ thể trước.
const FEATURE_TARGETS = [
  { url: '/xem-ket-qua-do', re: /đo nhiệt độ kinh lạc|kết quả đo kinh lạc|biểu đồ kinh lạc|đo kinh lạc/iu },
  { url: '/xem-3d', re: /đồ hình kinh lạc 3d|đồ hình 3d|mô hình 3d|kinh lạc 3d/iu },
  { url: '/xem-bai-thuoc', re: /tính vị quy kinh|phân tích bài thuốc|bài thuốc theo tính vị/iu },
  { url: '/thu-vien', re: /từ điển huyệt vị|thư viện đông y|tra cứu huyệt vị|từ điển đông y/iu },
]

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Đích HUYỆT: tên huyệt → /huyet/<slug>/. Lọc cho an toàn (giảm dương tính giả):
//   - tên ≥ 2 âm tiết & ≥ 5 ký tự (bỏ tên 1 từ dễ trùng từ thường).
//   - bỏ vài tên trùng nghĩa thông dụng (giải phẫu/khái niệm) dễ khớp nhầm.
//   - khớp theo ranh giới chữ Unicode; cụm DÀI khớp trước.
const HUYET_NAME_BLOCK = new Set([
  'thái dương', 'nhân trung', 'thái âm', 'thiếu âm', 'dương minh',
  'âm dương', 'trung bình', 'tử cung', 'thượng vị',
])
function buildHuyetTargets() {
  const seenName = new Set()
  const out = []
  for (const r of records) {
    if (!r || !r.ten || !r._slug) continue
    const name = String(r.ten).trim()
    const key = name.toLowerCase()
    if (name.split(/\s+/).length < 2 || name.length < 5) continue
    if (HUYET_NAME_BLOCK.has(key) || seenName.has(key)) continue
    seenName.add(key)
    out.push({
      url: `/huyet/${r._slug}/`,
      re: new RegExp(`(?<![\\p{L}\\p{N}])${escRe(name)}(?![\\p{L}\\p{N}])`, 'iu'),
      len: name.length,
    })
  }
  out.sort((a, b) => b.len - a.len) // cụm dài khớp trước (Túc Tam Lý trước Tam Lý…)
  return out
}

// Bọc cụm khớp ĐẦU TIÊN trong thân bài thành link, tôn trọng các vùng không được đụng.
function linkifyBody(body, targets, maxAdd) {
  // Bỏ qua đường dẫn đã được link ở đâu đó trong bài (tránh thêm trùng).
  const linkedUrls = new Set()
  for (const m of body.matchAll(/\]\((\/[^)\s]+)/g)) linkedUrls.add(m[1])
  const todo = targets.filter((t) => !linkedUrls.has(t.url))
  if (!todo.length) return { body, added: 0, links: [] }

  const lines = body.split('\n')
  const usedUrls = new Set()
  const links = []
  let added = 0
  let inFence = false
  const maskRe = new RegExp(`${MASK_OPEN}(\\d+)${MASK_CLOSE}`, 'g')

  for (let i = 0; i < lines.length && added < maxAdd; i++) {
    let line = lines[i]
    if (/^\s*```/.test(line)) { inFence = !inFence; continue } // ranh giới khối code
    if (inFence) continue
    if (/^\s*#{1,6}\s/.test(line)) continue   // tiêu đề
    if (/^\s*>/.test(line)) continue          // trích dẫn
    if (/^\s*\|/.test(line)) continue         // hàng bảng
    if (/^\s*!\[/.test(line)) continue        // dòng ảnh

    for (const t of todo) {
      if (usedUrls.has(t.url) || added >= maxAdd) continue

      // Che các link/`code` sẵn có trong dòng bằng sentinel để KHÔNG bọc nhầm vào chúng.
      const masks = []
      const masked = line
        .replace(/!?\[[^\]]*\]\([^)]*\)/g, (s) => { masks.push(s); return maskTok(masks.length - 1) })
        .replace(/`[^`]*`/g, (s) => { masks.push(s); return maskTok(masks.length - 1) })

      const mm = masked.match(t.re)
      if (!mm) continue
      const phrase = mm[0]
      const replaced = masked.replace(phrase, `[${phrase}](${t.url})`)
      // Phục hồi phần đã che (chỉ khớp đúng sentinel, không đụng số thật trong văn).
      line = replaced.replace(maskRe, (_, n) => masks[Number(n)])
      usedUrls.add(t.url)
      links.push({ phrase, url: t.url })
      added++
    }
    lines[i] = line
  }
  return { body: lines.join('\n'), added, links }
}

const huyetTargets = HUYET ? buildHuyetTargets() : []
if (HUYET) console.log(`↪ Chế độ --huyet: ${huyetTargets.length} tên huyệt đủ điều kiện làm đích link.\n`)

const files = readdirSync(CONTENT_DIR).filter(
  (f) => f.endsWith('.md') && !f.startsWith('_') && f.toLowerCase() !== 'readme.md',
)

let totalAdded = 0
let changedFiles = 0
for (const f of files) {
  const p = join(CONTENT_DIR, f)
  const raw = readFileSync(p, 'utf8')
  const m = raw.match(/^(---\s*\n[\s\S]*?\n---\s*\n?)([\s\S]*)$/)
  if (!m) continue
  const [, fm, body0] = m

  // Pass 1: tính năng. Pass 2 (nếu --huyet): huyệt — chạy trên kết quả pass 1.
  const r1 = linkifyBody(body0, FEATURE_TARGETS, MAX_FEATURE)
  const r2 = HUYET ? linkifyBody(r1.body, huyetTargets, MAX_HUYET) : { body: r1.body, added: 0, links: [] }
  const added = r1.added + r2.added
  if (added > 0) {
    totalAdded += added
    changedFiles++
    console.log(`  ${WRITE ? '✎' : '•'} ${f}: +${r1.added} tính năng${HUYET ? ` · +${r2.added} huyệt` : ''}`)
    // Dry-run: in rõ từng cụm huyệt sẽ được link để dễ soi dương tính giả.
    if (!WRITE) for (const l of r2.links) console.log(`        ↳ "${l.phrase}" → ${l.url}`)
    if (WRITE) writeFileSync(p, fm + r2.body, 'utf8')
  }
}

if (!totalAdded) {
  console.log('✓ relink-blog: không có gì để thêm.')
} else {
  console.log(
    `\n${WRITE ? '✓ Đã ghi' : '↪ Thử (dry-run)'}: ${totalAdded} link / ${changedFiles} bài.` +
      (WRITE ? ' Nhớ chạy `npm run build` để dựng lại HTML.' : ' Thêm --write để ghi thật.'),
  )
}
