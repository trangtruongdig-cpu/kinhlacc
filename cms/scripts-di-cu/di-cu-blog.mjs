// di-cu-blog.mjs — Chuyển 11 bài trong frontend/content/blog/*.md vào collection bai_viet.
//
// Chạy trên MÁY DEV: CLI của EmDash tự xác thực với server localhost (dev bypass), nên không
// cần token. CMS local nối CÙNG database với VPS nên bài sẽ hiện ở cả hai nơi.
//
//   node scripts-di-cu/di-cu-blog.mjs --thu        # chỉ in ra, KHÔNG ghi
//   node scripts-di-cu/di-cu-blog.mjs --mot <slug> # làm đúng một bài
//   node scripts-di-cu/di-cu-blog.mjs              # làm tất
import { readdirSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const NGUON = resolve(here, '../../frontend/content/blog')
const args = process.argv.slice(2)
const chiThu = args.includes('--thu')
const motSlug = args.includes('--mot') ? args[args.indexOf('--mot') + 1] : null

// Mặc định E-E-A-T — hệ cũ nhét cứng trong seo-blog.renderer.ts, giờ thành dữ liệu sửa được.
const NGUOI_DUYET = 'Trương Đình Trang'
const CHUC_DANH = 'Y Sỹ Y Học Cổ Truyền (đang theo học)'
const TAC_GIA_MAC_DINH = 'Ban Biên Tập Kinh Lạc'

/** Tách frontmatter YAML đơn giản (chỉ các dạng hệ cũ dùng: chuỗi, số, mảng/đối tượng JSON). */
function tach(txt) {
  const m = txt.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!m) return { data: {}, body: txt }
  const data = {}
  for (const dong of m[1].split(/\r?\n/)) {
    const i = dong.indexOf(':')
    if (i < 0 || /^\s/.test(dong)) continue
    const k = dong.slice(0, i).trim()
    let v = dong.slice(i + 1).trim()
    if (!k) continue
    try { v = JSON.parse(v) } catch { v = v.replace(/^["']|["']$/g, '') }
    data[k] = v
  }
  return { data, body: m[2] }
}

/** "2026-09-15" -> "2026-09-15T00:00:00.000Z". Giá trị đã đủ giờ thì giữ nguyên. */
function isoDayDu(v) {
  if (!v) return undefined
  const s = String(v).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00.000Z`
  const d = new Date(s)
  return isNaN(d) ? undefined : d.toISOString()
}

const files = readdirSync(NGUON).filter((f) => f.endsWith('.md') && !f.startsWith('_'))
let lam = 0, bo = 0
for (const f of files) {
  const { data, body } = tach(readFileSync(join(NGUON, f), 'utf8'))
  const slug = data.slug || f.replace(/\.md$/, '')
  if (motSlug && slug !== motSlug) continue

  const duLieu = {
    title: data.title || slug,
    description: data.description || '',
    content: (body || '').trim(),          // markdown → CLI tự chuyển sang Portable Text
    // Trường datetime đòi ISO 8601 ĐẦY ĐỦ. Frontmatter chỉ có ngày ("2026-09-15") nên CLI
    // báo "ngay_dang: Invalid input" — phải thêm phần giờ.
    ngay_dang: isoDayDu(data.date),
    ngay_cap_nhat: isoDayDu(data.updated),
    tac_gia: data.author || TAC_GIA_MAC_DINH,
    nguoi_duyet: data.reviewer || NGUOI_DUYET,
    chuc_danh_nguoi_duyet: data.reviewerTitle || CHUC_DANH,
    cta: data.cta || '/xem-ket-qua-do',
    tu_khoa: Array.isArray(data.keywords) ? data.keywords : undefined,
    faq: Array.isArray(data.faq) ? data.faq : undefined,
    nguon_tham_khao: Array.isArray(data.sources) ? data.sources : undefined,
    // Hệ cũ: index === false nghĩa là chờ duyệt. Không khai = cho index.
    cho_index: data.index === false ? false : true,
  }
  for (const k of Object.keys(duLieu)) if (duLieu[k] === undefined) delete duLieu[k]

  if (chiThu) {
    console.log(`\n── ${slug} ──`)
    console.log('  tiêu đề :', duLieu.title)
    console.log('  thân bài:', duLieu.content.length, 'ký tự')
    console.log('  từ khoá :', (duLieu.tu_khoa || []).length, '· faq:', (duLieu.faq || []).length,
                '· nguồn:', (duLieu.nguon_tham_khao || []).length)
    console.log('  chuyên mục:', data.category || '(không)', '· cụm:', data.cluster || '(không)')
    console.log('  cho_index:', duLieu.cho_index)
    lam++
    continue
  }

  try {
    // Gọi thẳng bin thay vì qua npx: npx nuốt mã lỗi và stderr, lỗi hiện ra rỗng không dò được.
    const bin = resolve(here, '../node_modules/.bin/emdash')
    const ra = execFileSync(bin, ['content', 'create', 'bai_viet',
      '--slug', slug, '--data', JSON.stringify(duLieu)],
      { cwd: resolve(here, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    const id = (JSON.parse(ra).id) || '?'
    console.log(`  ✓ ${slug}  → ${id}`)
    lam++
  } catch (e) {
    console.error(`  ✗ ${slug}: ${String(e.stderr || e.message).split('\n')[0]}`)
    bo++
  }
}
console.log(`\n${chiThu ? 'Thử' : 'Xong'}: ${lam} bài${bo ? `, ${bo} lỗi` : ''}`)
