<script setup lang="ts">
/**
 * VanBanYVan — hiển thị một khối văn bản y văn cổ truyền CÓ BỐ CỤC và
 * LIÊN KẾT CHÉO sang các mục từ khác.
 *
 * Dữ liệu trong DB (phuong_thang.ghi_chu, vi_thuoc.duoc_ly/tham_khao…) là
 * một chuỗi dài, cấu trúc nằm ngầm trong cách ngắt dòng:
 *
 *   GIẢI THÍCH:                          <- nhãn mục, IN HOA + dấu hai chấm
 *   Hoàng kỳ, Nhân sâm để cam ôn…        <- đoạn văn, nguồn ở cuối trong ()
 *   THAM KHẢO:
 *   Bài này thêm Hoàng Cầm … gọi là Ích Vị Thăng Dương Thang (Biến pháp…)
 *   “Lãn tôi xét: Bài Bổ Trung Ích Khí…” (Hải Thượng Y Tôn Tâm Lĩnh)
 *
 * Hai việc component này làm:
 *  1. BỐ CỤC — tiểu đề cho từng mục, trích dẫn thành khối riêng có nguồn
 *     tách xuống dòng, các dòng "Bài này…/Còn gọi là…" thành danh sách.
 *  2. LIÊN KẾT — tên sách dẫn sang Thư Mục Nguồn, tên bài thuốc dẫn sang
 *     bài đó, tên vị thuốc dẫn sang mục dược liệu. Người đọc đang ở giữa
 *     câu bấm được ngay, không phải copy tên đi tra.
 *
 * Vì sao không link nhầm: component BIẾT TRƯỚC chỗ nào là tên riêng (trong
 * ngoặc đơn cuối câu, sau chữ "gọi là") nên chỉ tra đúng những cụm đó —
 * "(30g)" và "(Spongilla fragilis)" không bao giờ thành link. Tên vị thuốc
 * lấy từ THÀNH PHẦN của chính mục đang xem, nên khớp chắc chắn.
 *
 * Chỉ nội suy văn bản, KHÔNG v-html — dữ liệu là y văn sưu tầm.
 */
import { computed, ref, watch, onMounted } from 'vue'
import { useDictLinks } from '@/lib/dictLinks'
import { traTen, chon, type MucTuDien } from '@/lib/traCuuTen'

const props = defineProps<{
  text?: string | null
  /** Vị thuốc của mục đang xem — dùng để link tên vị nhắc trong văn bản. */
  viThuoc?: { ten: string; id: number | null }[]
}>()

const links = useDictLinks()

/** Nhãn mục gặp trong dữ liệu -> dạng đọc được (763 GIẢI THÍCH, 696 GHI CHÚ,
 *  308 THAM KHẢO, 79 KIÊNG KỴ/KIÊNG KỊ tính trên 13.942 bài thuốc). */
const NHAN: Record<string, string> = {
  'GIẢI THÍCH': 'Giải thích',
  'THAM KHẢO': 'Tham khảo',
  'GHI CHÚ': 'Ghi chú',
  'KIÊNG KỴ': 'Kiêng kỵ',
  'KIÊNG KỊ': 'Kiêng kỵ',
  'TÁC DỤNG': 'Tác dụng',
  'CHỦ TRỊ': 'Chủ trị',
  TRỊ: 'Trị',
}

// ── 1. Đọc cấu trúc ngầm trong cách ngắt dòng ──

interface KhoiNhan { loai: 'nhan'; chu: string }
interface KhoiTrich { loai: 'trich'; chu: string; nguon: string | null }
interface KhoiDanhSach { loai: 'danh-sach'; muc: { dau: string; ten: string | null; nguon: string | null }[] }
/** chu = nguyên văn; chuCat + nguon = dạng đã tách nguồn ở cuối, chỉ dùng
 *  khi cụm đó TRA ĐƯỢC là nguồn thật. */
interface KhoiDoan { loai: 'doan'; chu: string; chuCat: string; nguon: string | null }
type Khoi = KhoiNhan | KhoiTrich | KhoiDanhSach | KhoiDoan

/** Dòng chỉ gồm chữ IN HOA và kết thúc bằng ':' là nhãn mục. */
function laNhan(dong: string): boolean {
  return dong.length <= 32 && dong.endsWith(':') && dong === dong.toUpperCase() && /[A-ZÀ-Ỹ]/.test(dong)
}

/** Tách nguồn trong ngoặc đơn ở cuối dòng: "… (Kim Quỹ Yếu Lược)." */
function tachNguon(dong: string): { chu: string; nguon: string | null } {
  const m = dong.match(/^(.*?)\s*\(([^()]{2,140})\)\s*\.?\s*$/)
  if (!m || !m[1] || !m[2]) return { chu: dong, nguon: null }
  return { chu: m[1].replace(/\s*[.,;]\s*$/, ''), nguon: m[2] }
}

/** Dòng biến pháp: "Bài này thêm X gọi là Y (Nguồn)." — làm nổi tên bài Y. */
function tachMuc(dong: string) {
  const { chu, nguon } = tachNguon(dong)
  const m = chu.match(/^(.*\bgọi là\s+)(.+)$/)
  if (m && m[1] && m[2]) return { dau: m[1], ten: m[2].replace(/\s*\.\s*$/, ''), nguon }
  return { dau: chu, ten: null, nguon }
}

const laDongDanhSach = (d: string) => /^(Bài này|Còn gọi là|Còn có tên|Cũng gọi là|Nay gọi là)/.test(d)
const laTrichDan = (d: string) => /^[“"‘]/.test(d)

const khoi = computed<Khoi[]>(() => {
  const dong = String(props.text || '').split(/\r?\n/).map((d) => d.trim()).filter(Boolean)
  const ra: Khoi[] = []
  for (const d of dong) {
    if (laNhan(d)) {
      const goc = d.slice(0, -1).trim()
      ra.push({ loai: 'nhan', chu: NHAN[goc] || goc })
    } else if (laTrichDan(d)) {
      const { chu, nguon } = tachNguon(d)
      ra.push({ loai: 'trich', chu, nguon })
    } else if (laDongDanhSach(d)) {
      const cuoi = ra[ra.length - 1]
      if (cuoi && cuoi.loai === 'danh-sach') cuoi.muc.push(tachMuc(d))
      else ra.push({ loai: 'danh-sach', muc: [tachMuc(d)] })
    } else {
      const { chu, nguon } = tachNguon(d)
      ra.push({ loai: 'doan', chu: d, chuCat: chu, nguon })
    }
  }
  return ra
})

// ── 2. Tra cứu: gom tên ứng viên theo NGỮ CẢNH rồi hỏi một lượt ──

/** Nguồn hay được ghi ghép hai tên: "Châu Ngọc Cách Ngôn – Hải Thượng Y Tôn
 *  Tâm Lĩnh" (thiên – bộ sách). Cả cụm thường không có trong sổ, nhưng từng
 *  phần thì có, nên tách ra tra riêng. Giữ cả dấu ngăn để dựng lại nguyên văn. */
function xeNguon(ten: string): string[] {
  return ten.split(/\s*[–-]\s*/).map((p) => p.trim()).filter((p) => p.length >= 4)
}

const ketQua = ref<Map<string, MucTuDien[]>>(new Map())

const ungVien = computed<string[]>(() => {
  const ra = new Set<string>()
  const themNguon = (t: string | null) => {
    if (!t) return
    ra.add(t)
    const phan = xeNguon(t)
    if (phan.length > 1) for (const p of phan) ra.add(p)
  }
  for (const k of khoi.value) {
    if (k.loai === 'trich') themNguon(k.nguon)
    else if (k.loai === 'doan') themNguon(k.nguon)
    else if (k.loai === 'danh-sach') {
      for (const m of k.muc) {
        themNguon(m.nguon)
        if (m.ten) ra.add(m.ten)
      }
    }
  }
  return [...ra]
})

async function tra() {
  if (!ungVien.value.length) { ketQua.value = new Map(); return }
  ketQua.value = await traTen(ungVien.value)
}
onMounted(tra)
watch(ungVien, tra)

/** Nguồn: chỉ nhận mục loại 'nguon' — tên sách không bao giờ là vị thuốc. */
const mucNguon = (ten: string | null) => (ten ? chon(ketQua.value.get(ten), ['nguon']) : null)
/** Sau chữ "gọi là" thì ưu tiên bài thuốc. */
const mucBai = (ten: string | null) => (ten ? chon(ketQua.value.get(ten), ['bai_thuoc']) : null)

interface ManhNguon { chu: string; slug?: string }

/**
 * Cắt một tên nguồn thành các mảnh có/không link.
 * Cả cụm khớp -> một mảnh có link. Không khớp -> thử từng phần sau khi xé
 * theo dấu gạch ngang; phần nào là nguồn thật thì phần đó thành link.
 */
function catNguon(ten: string | null): ManhNguon[] {
  if (!ten) return []
  const ca = mucNguon(ten)
  if (ca?.slug) return [{ chu: ten, slug: ca.slug }]

  const phan = xeNguon(ten)
  if (phan.length < 2) return [{ chu: ten }]

  const ra: ManhNguon[] = []
  let con = ten
  for (const p of phan) {
    const i = con.indexOf(p)
    if (i < 0) continue
    if (i > 0) ra.push({ chu: con.slice(0, i) })
    const m = mucNguon(p)
    ra.push(m?.slug ? { chu: p, slug: m.slug } : { chu: p })
    con = con.slice(i + p.length)
  }
  if (con) ra.push({ chu: con })
  return ra.length ? ra : [{ chu: ten }]
}

/** Có ít nhất một mảnh link được thì mới tách nguồn khỏi câu khi hiển thị. */
const nguonTraDuoc = (ten: string | null) => catNguon(ten).some((m) => !!m.slug)

// ── 3. Link tên vị thuốc trong văn bản ──
// Chỉ dùng vị thuốc CỦA MỤC ĐANG XEM (truyền vào qua prop) nên khớp chắc
// chắn. Mỗi vị chỉ link ở lần nhắc ĐẦU TIÊN để không thành rừng link — việc
// đếm "đã link" phải nằm TRONG computed, không được để ở ngoài: hàm render
// chạy lại mỗi lần tra cứu trả về và sẽ thấy Set đã đầy, thành ra mất sạch link.

interface Manh { chu: string; viId?: number }

const reVi = computed(() => {
  const ten = (props.viThuoc || [])
    .filter((v) => v.id && v.ten && v.ten.trim().length >= 4)
    .map((v) => v.ten.trim())
    .sort((a, b) => b.length - a.length)
  if (!ten.length) return null
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp('(' + ten.map(esc).join('|') + ')', 'gi')
})

const idVi = computed(() => {
  const m = new Map<string, number>()
  for (const v of props.viThuoc || []) if (v.id && v.ten) m.set(v.ten.trim().toLowerCase(), v.id)
  return m
})

function catManh(chu: string, daLink: Set<string>): Manh[] {
  const re = reVi.value
  if (!re) return [{ chu }]
  const ra: Manh[] = []
  let cuoi = 0
  re.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(chu))) {
    const khop = m[0]
    const key = khop.toLowerCase()
    const id = idVi.value.get(key)
    if (!id || daLink.has(key)) continue
    daLink.add(key)
    if (m.index > cuoi) ra.push({ chu: chu.slice(cuoi, m.index) })
    ra.push({ chu: khop, viId: id })
    cuoi = m.index + khop.length
  }
  if (!ra.length) return [{ chu }]
  if (cuoi < chu.length) ra.push({ chu: chu.slice(cuoi) })
  return ra
}

// ── 4. Khối đã sẵn sàng để render ──

type KhoiRender =
  | KhoiNhan
  | (Omit<KhoiTrich, 'nguon'> & { manh: Manh[]; nguon: ManhNguon[] })
  | (Omit<KhoiDanhSach, 'muc'> & { muc: { dau: string; ten: string | null; bai: MucTuDien | null; nguon: ManhNguon[] }[] })
  | (Omit<KhoiDoan, 'chu' | 'chuCat' | 'nguon'> & { manh: Manh[]; nguon: ManhNguon[] })

const khoiRender = computed<KhoiRender[]>(() => {
  const daLink = new Set<string>()
  return khoi.value.map((k): KhoiRender => {
    if (k.loai === 'nhan') return k
    if (k.loai === 'trich') {
      return { loai: 'trich', chu: k.chu, manh: catManh(k.chu, daLink), nguon: catNguon(k.nguon) }
    }
    if (k.loai === 'danh-sach') {
      return {
        loai: 'danh-sach',
        muc: k.muc.map((m) => ({ dau: m.dau, ten: m.ten, bai: mucBai(m.ten), nguon: catNguon(m.nguon) })),
      }
    }
    const tachRa = nguonTraDuoc(k.nguon)
    return {
      loai: 'doan',
      manh: catManh(tachRa ? k.chuCat : k.chu, daLink),
      nguon: tachRa ? catNguon(k.nguon) : [],
    }
  })
})
</script>

<template>
  <div v-if="khoiRender.length" class="yv">
    <template v-for="(k, i) in khoiRender" :key="i">
      <h3 v-if="k.loai === 'nhan'" class="yv-nhan">{{ k.chu }}</h3>

      <blockquote v-else-if="k.loai === 'trich'" class="yv-trich">
        <p class="yv-trich-chu">
          <template v-for="(mh, n) in k.manh" :key="n">
            <RouterLink v-if="mh.viId" :to="links.viThuoc(mh.viId)" class="yv-link-vi">{{ mh.chu }}</RouterLink>
            <template v-else>{{ mh.chu }}</template>
          </template>
        </p>
        <cite v-if="k.nguon.length" class="yv-nguon">
          <template v-for="(mn, n) in k.nguon" :key="n">
            <RouterLink v-if="mn.slug" :to="links.nguon(mn.slug)" class="yv-link-nguon">{{ mn.chu }}</RouterLink>
            <template v-else>{{ mn.chu }}</template>
          </template>
        </cite>
      </blockquote>

      <ul v-else-if="k.loai === 'danh-sach'" class="yv-ds">
        <li v-for="(m, j) in k.muc" :key="j" class="yv-ds-muc">
          <span>{{ m.dau }}</span>
          <template v-if="m.ten">
            <RouterLink v-if="m.bai?.slug" :to="links.baiThuoc(m.bai.slug)" class="yv-ten yv-link-bai">{{ m.ten }}</RouterLink>
            <strong v-else class="yv-ten">{{ m.ten }}</strong>
          </template>
          <span v-if="m.nguon.length" class="yv-nguon-nho">
            (<template v-for="(mn, n) in m.nguon" :key="n"><RouterLink v-if="mn.slug" :to="links.nguon(mn.slug)" class="yv-link-nguon">{{ mn.chu }}</RouterLink><template v-else>{{ mn.chu }}</template></template>)
          </span>
        </li>
      </ul>

      <p v-else class="yv-doan">
        <template v-for="(mh, n) in k.manh" :key="n">
          <RouterLink v-if="mh.viId" :to="links.viThuoc(mh.viId)" class="yv-link-vi">{{ mh.chu }}</RouterLink>
          <template v-else>{{ mh.chu }}</template>
        </template>
        <span v-if="k.nguon.length" class="yv-nguon-nho">
          (<template v-for="(mn, n) in k.nguon" :key="n"><RouterLink v-if="mn.slug" :to="links.nguon(mn.slug)" class="yv-link-nguon">{{ mn.chu }}</RouterLink><template v-else>{{ mn.chu }}</template></template>)
        </span>
      </p>
    </template>
  </div>
</template>

<style scoped>
.yv { font-size: 14.5px; line-height: 1.75; color: var(--text); }

/* Tiểu đề mục: tạo chỗ ngắt nghỉ giữa các khối chữ dài */
.yv-nhan {
  margin: 18px 0 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border, #e5e0d6);
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--brown-600, #8a5a1a);
}
.yv-nhan:first-child { margin-top: 0; padding-top: 0; border-top: 0; }

.yv-doan { margin: 0 0 10px; }
.yv-doan:last-child { margin-bottom: 0; }

/* Trích dẫn y văn: lùi vào, viền trái, nguồn tách xuống dòng */
.yv-trich {
  margin: 0 0 12px;
  padding: 10px 14px;
  background: var(--surface-2, #faf8f3);
  border-left: 3px solid var(--brown-300, #d8c3a0);
  border-radius: 0 8px 8px 0;
}
.yv-trich-chu { margin: 0; font-style: italic; color: var(--brown-900, #4a2f14); }
.yv-nguon {
  display: block;
  margin-top: 6px;
  font-size: 12.5px;
  font-style: normal;
  text-align: right;
  color: var(--text-muted);
}
.yv-nguon::before { content: '— '; }

/* Danh sách biến pháp / tên gọi khác */
.yv-ds { margin: 0 0 12px; padding-left: 18px; }
.yv-ds-muc { margin-bottom: 5px; }
.yv-ten { color: var(--brown-800, #5b3a1a); font-weight: 700; }
.yv-nguon-nho { margin-left: 4px; font-size: 13px; color: var(--text-muted); }

/* Ba loại link, phân biệt bằng mắt: nguồn gạch chấm, bài thuốc đậm, vị thuốc nhạt */
.yv-link-nguon { color: inherit; text-decoration: underline dotted; text-underline-offset: 2px; }
.yv-link-nguon:hover { color: var(--brown-700, #6b4f2a); text-decoration: underline; }
.yv-link-bai { color: var(--brown-700, #6b4f2a); text-decoration: none; }
.yv-link-bai:hover { text-decoration: underline; }
.yv-link-vi { color: var(--brown-600, #8a5a1a); text-decoration: underline dotted; text-underline-offset: 2px; }
.yv-link-vi:hover { text-decoration: underline; }

@media (max-width: 480px) {
  .yv-trich { padding: 8px 10px; }
  .yv-nguon { text-align: left; }
}
</style>
