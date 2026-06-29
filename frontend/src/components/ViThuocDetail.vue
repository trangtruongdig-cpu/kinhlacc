<script setup lang="ts">
/**
 * ViThuocDetail — Hiển thị TỪ ĐIỂN một vị thuốc: mọi thông tin + thư viện ảnh theo giai đoạn.
 * Dùng chung cho khu admin (source='admin' → /vi-thuoc/:id) và bản công khai (source='public' → /duoc-lieu/:id).
 */
import { ref, watch, onMounted, computed } from 'vue'
import { api } from '@/services/api'
import ViThuocGallery from '@/components/ViThuocGallery.vue'
import { useDictLinks } from '@/lib/dictLinks'

const props = defineProps<{ viThuocId: number; source?: 'admin' | 'public' }>()
const emit = defineEmits<{ loaded: [{ id: number; ten: string }]; merged: [] }>()
const links = useDictLinks()

interface LinkCongDung { congDung?: { ten_cong_dung?: string } | null; ghi_chu?: string | null }
interface LinkChuTri { chuTri?: { ten_chu_tri?: string } | null; ghi_chu?: string | null }
interface LinkKiengKy { kiengKy?: { ten_kieng_ky?: string } | null; ghi_chu?: string | null }
interface LinkKinhMach { kinhMach?: { ten_kinh_mach?: string; ten_viet_tat?: string } | null }
interface Herb {
  id: number
  ten_vi_thuoc: string
  tinh?: string | null
  vi?: string | null
  quy_kinh?: string | null
  lieu_dung?: string | null
  ten_khoa_hoc?: string | null
  ten_han?: string | null
  ten_pinyin?: string | null
  bo_phan_dung?: string | null
  // Nội dung y văn (từ từ điển Đông Y cũ)
  xuat_xu?: string | null
  ho_khoa_hoc?: string | null
  ten_khac?: string | null
  mo_ta?: string | null
  thanh_phan?: string | null
  duoc_ly?: string | null
  tinh_vi_quy_kinh?: string | null
  nuoi_duong?: string | null
  bao_che?: string | null
  don_thuoc?: string | null
  chu_tri?: string | null
  tham_khao?: string | null
  congDungLinks?: LinkCongDung[]
  chuTriLinks?: LinkChuTri[]
  kiengKyLinks?: LinkKiengKy[]
  kinhMachLinks?: LinkKinhMach[]
  tenGoiKhacList?: Array<{ ten_goi_khac?: string }>
}

const herb = ref<Herb | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const activeYvan = ref(0) // tab y văn đang chọn
interface Variant { ten: string; id: number; ten_vi_thuoc: string; ten_han?: string; loai?: 'trung' | 'goi-y' }
const bienThe = ref<Variant[]>([]) // vị nghi biến thể/trùng + vị gần giống
const gopping = ref<number | null>(null) // đang gộp vị nào
const bienTheTrung = computed(() => bienThe.value.filter((v) => v.loai !== 'goi-y'))
const bienTheGoiY = computed(() => bienThe.value.filter((v) => v.loai === 'goi-y'))

async function gopBienThe(v: Variant) {
  if (!herb.value || gopping.value) return
  const keepName = herb.value.ten_vi_thuoc
  if (!confirm(`Gộp "${v.ten_vi_thuoc}" VÀO "${keepName}"?\n\n• Mọi bài thuốc đang dùng "${v.ten_vi_thuoc}" sẽ chuyển sang "${keepName}".\n• "${v.ten_vi_thuoc}" thành tên gọi khác và bản trùng bị XOÁ.\n\nKhông thể hoàn tác.`)) return
  gopping.value = v.id
  try {
    await api.post(`/vi-thuoc/${herb.value.id}/gop`, { fromId: v.id })
    emit('merged')
    await load(herb.value.id) // làm mới: biến thể + tên gọi khác cập nhật
  } catch (e: unknown) {
    alert('Gộp thất bại: ' + (e instanceof Error ? e.message : String(e)))
  } finally {
    gopping.value = null
  }
}

const congDung = computed(() =>
  (herb.value?.congDungLinks ?? []).map((l) => l.congDung?.ten_cong_dung?.trim()).filter((x): x is string => !!x),
)
const chuTri = computed(() =>
  (herb.value?.chuTriLinks ?? []).map((l) => l.chuTri?.ten_chu_tri?.trim()).filter((x): x is string => !!x),
)
const kiengKy = computed(() =>
  (herb.value?.kiengKyLinks ?? [])
    .map((l) => {
      const n = l.kiengKy?.ten_kieng_ky?.trim()
      if (!n) return null
      const g = (l.ghi_chu || '').trim()
      return g ? `${n} (${g})` : n
    })
    .filter((x): x is string => !!x),
)
const quyKinh = computed(() =>
  (herb.value?.kinhMachLinks ?? []).map((l) => l.kinhMach?.ten_kinh_mach?.trim()).filter((x): x is string => !!x),
)
const tenGoiKhac = computed(() =>
  (herb.value?.tenGoiKhacList ?? []).map((x) => x.ten_goi_khac?.trim()).filter((x): x is string => !!x),
)
const viChips = computed(() =>
  (herb.value?.vi || '').split(/[,/、，;]/).map((s) => s.trim()).filter(Boolean),
)

// Các mục y văn (nguyên văn từ từ điển cũ) theo thứ tự như app gốc.
const YVAN_ORDER: Array<[keyof Herb, string]> = [
  ['ten_khac', 'Tên khác'],
  ['mo_ta', 'Mô tả'],
  ['thanh_phan', 'Thành phần'],
  ['duoc_ly', 'Dược lý'],
  ['tinh_vi_quy_kinh', 'Tính vị quy kinh'],
  ['nuoi_duong', 'Nuôi dưỡng'],
  ['bao_che', 'Bào chế'],
  ['don_thuoc', 'Đơn thuốc'],
  ['chu_tri', 'Chủ trị'],
  ['tham_khao', 'Tham khảo'],
]
const yvanSections = computed(() =>
  YVAN_ORDER.map(([k, title]) => ({ title, text: String(herb.value?.[k] || '').trim() }))
    .filter((s) => s.text)
    .map((s) => ({ title: s.title, paras: s.text.split(/\n+/).map((p) => p.trim()).filter(Boolean) })),
)

// ── Thư mục nguồn (như ở huyệt): dò TÊN NGUỒN đã biết trong y văn → link dẫn tới nguồn ──
// Chỉ link tên sách/nguồn có trong dict-sources (KHÔNG đụng liều lượng "(30g)", tên Latin "(Equus...)").
const srcRe = ref<RegExp | null>(null)
const srcMap = ref<Map<string, { ten: string; slug: string }>>(new Map())
const xuatXuSlug = ref<string | null>(null)
const normSrc = (s: string) => s.toLowerCase().normalize('NFC').replace(/\s+/g, ' ').trim()

// Nạp ĐÚNG các nguồn mà vị này trích (từ sổ cái nguon) → link NỘI BỘ Thư Mục Nguồn (theo ngữ cảnh in-app/public).
async function loadSources(viId: number) {
  srcRe.value = null; srcMap.value = new Map(); xuatXuSlug.value = null
  try {
    const recs = await api.get<{ slug: string; ten: string; ten_khac?: string | null; context: string }[]>(`/nguon/by-vi-thuoc/${viId}`)
    const map = new Map<string, { ten: string; slug: string }>()
    const names: string[] = []
    for (const r of recs || []) {
      if (!r || !r.ten) continue
      if (r.context === 'xuat_xu') xuatXuSlug.value = r.slug
      for (const nm of [r.ten, ...(r.ten_khac ? r.ten_khac.split(' | ') : [])]) {
        const t = String(nm || '').trim()
        if (t.length < 4) continue
        const key = normSrc(t)
        if (!map.has(key)) { map.set(key, { ten: t, slug: r.slug }); names.push(t) }
      }
    }
    names.sort((a, b) => b.length - a.length)
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    srcRe.value = names.length ? new RegExp('(' + names.map(esc).join('|') + ')', 'gi') : null
    srcMap.value = map
  } catch { /* nguồn là phụ — lỗi thì hiện text thường */ }
}

type Part = { t: string; slug?: string }
function decorate(text: string): Part[] {
  const re = srcRe.value
  if (!re) return [{ t: text }]
  const out: Part[] = []
  let last = 0
  re.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: text.slice(last, m.index) })
    const hit = srcMap.value.get(normSrc(m[0]))
    out.push({ t: m[0], slug: hit ? hit.slug : undefined })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ t: text.slice(last) })
  return out
}
const activeParas = computed(() => {
  const sec = yvanSections.value[activeYvan.value] || yvanSections.value[0]
  return (sec ? sec.paras : []).map((p) => decorate(p))
})

async function load(id: number) {
  loading.value = true
  error.value = null
  herb.value = null
  try {
    const base = props.source === 'public' ? '/duoc-lieu' : '/vi-thuoc'
    herb.value = await api.get<Herb>(`${base}/${id}`)
    activeYvan.value = 0
    void loadSources(id)
    // Dò "tên khác" trùng vị đã có (chỉ khu admin — endpoint cần đăng nhập).
    bienThe.value = []
    if (props.source !== 'public') {
      api.get<{ data: Variant[] }>(`/vi-thuoc/${id}/bien-the`)
        .then((r) => { bienThe.value = r.data || [] })
        .catch(() => { bienThe.value = [] })
    }
    if (herb.value) emit('loaded', { id: herb.value.id, ten: herb.value.ten_vi_thuoc })
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => { load(props.viThuocId) })
watch(() => props.viThuocId, (id) => load(id))
</script>

<template>
  <div class="vtd">
    <div v-if="loading" class="vtd-msg">Đang tải…</div>
    <div v-else-if="error" class="vtd-msg vtd-err">{{ error }}</div>
    <template v-else-if="herb">
      <header class="vtd-head">
        <h2 class="vtd-name">
          {{ herb.ten_vi_thuoc }}
          <span v-if="herb.ten_han" class="vtd-han">{{ herb.ten_han }}</span>
        </h2>
        <div class="vtd-sci">
          <em v-if="herb.ten_khoa_hoc">{{ herb.ten_khoa_hoc }}</em>
          <span v-if="herb.ten_pinyin" class="vtd-pinyin">{{ herb.ten_pinyin }}</span>
          <span v-if="herb.ho_khoa_hoc" class="vtd-bpd">Họ KH: {{ herb.ho_khoa_hoc }}</span>
          <span v-if="herb.bo_phan_dung" class="vtd-bpd">Bộ phận dùng: {{ herb.bo_phan_dung }}</span>
          <span v-if="herb.xuat_xu" class="vtd-bpd">Xuất xứ:
            <RouterLink v-if="xuatXuSlug" :to="links.nguon(xuatXuSlug)" class="vtd-src">{{ herb.xuat_xu }}</RouterLink>
            <template v-else>{{ herb.xuat_xu }}</template>
          </span>
        </div>
      </header>

      <!-- Cảnh báo trùng / gợi ý gộp (chỉ admin — bienThe rỗng ở bản công khai) -->
      <div v-if="bienThe.length" class="vtd-bienthe">
        <div v-if="bienTheTrung.length" class="vtd-bt-block">
          ⚠️ Tên khác trùng vị đã có — <strong>khả năng là bản trùng</strong>, nên kiểm tra:
          <div class="vtd-bt-list">
            <span v-for="v in bienTheTrung" :key="v.id" class="vtd-bt-row">
              <button type="button" class="vtd-bienthe-chip" title="Xem vị này" @click="load(v.id)">{{ v.ten_vi_thuoc }}<span v-if="v.ten_han" class="vtd-bt-han">{{ v.ten_han }}</span></button>
              <button type="button" class="vtd-gop-btn" :disabled="gopping === v.id" :title="'Gộp ' + v.ten_vi_thuoc + ' vào ' + (herb?.ten_vi_thuoc || '')" @click="gopBienThe(v)">{{ gopping === v.id ? 'Đang gộp…' : '⤵ Gộp vào đây' }}</button>
            </span>
          </div>
        </div>
        <div v-if="bienTheGoiY.length" class="vtd-bt-block vtd-bt-soft">
          🔎 Vị <strong>gần giống</strong> (cùng gốc tên) — kiểm tra kỹ, có thể chỉ là bộ phận/loại khác, hoặc <em>cây khác hẳn</em> (vd. Thổ phục linh ≠ Phục linh):
          <div class="vtd-bt-list">
            <span v-for="v in bienTheGoiY" :key="v.id" class="vtd-bt-row">
              <button type="button" class="vtd-bienthe-chip" title="Xem vị này" @click="load(v.id)">{{ v.ten_vi_thuoc }}<span v-if="v.ten_han" class="vtd-bt-han">{{ v.ten_han }}</span></button>
              <button type="button" class="vtd-gop-btn" :disabled="gopping === v.id" :title="'Gộp ' + v.ten_vi_thuoc + ' vào ' + (herb?.ten_vi_thuoc || '')" @click="gopBienThe(v)">{{ gopping === v.id ? 'Đang gộp…' : '⤵ Gộp vào đây' }}</button>
            </span>
          </div>
        </div>
      </div>

      <!-- Nội dung y văn (dạng tab) — đặt LÊN TRÊN, ngay dưới tên & TRÊN ảnh -->
      <section v-if="yvanSections.length" class="vtd-yvan">
        <div class="vtd-tabs" role="tablist">
          <button
            v-for="(sec, i) in yvanSections"
            :key="sec.title"
            type="button"
            role="tab"
            class="vtd-tab"
            :class="{ on: activeYvan === i }"
            :aria-selected="activeYvan === i"
            @click="activeYvan = i"
          >{{ sec.title }}</button>
        </div>
        <div class="vtd-tabpanel" role="tabpanel">
          <p v-for="(parts, i) in activeParas" :key="i" class="vtd-para"><template v-for="(part, j) in parts" :key="j"><RouterLink v-if="part.slug" :to="links.nguon(part.slug)" class="vtd-src" :title="'Nguồn: ' + part.t">{{ part.t }}</RouterLink><template v-else>{{ part.t }}</template></template></p>
        </div>
      </section>

      <!-- Thư viện ảnh theo giai đoạn -->
      <ViThuocGallery :vi-thuoc-id="herb.id" :vi-thuoc-ten="herb.ten_vi_thuoc" />

      <!-- Thuộc tính cơ bản -->
      <div class="vtd-props">
        <div v-if="herb.tinh" class="vtd-prop"><span class="vtd-prop-k">Tính</span><span class="vtd-chip vtd-chip-tinh">{{ herb.tinh }}</span></div>
        <div v-if="viChips.length" class="vtd-prop"><span class="vtd-prop-k">Vị</span><span v-for="(v, i) in viChips" :key="i" class="vtd-chip vtd-chip-vi">{{ v }}</span></div>
        <div v-if="quyKinh.length" class="vtd-prop"><span class="vtd-prop-k">Quy kinh</span><span v-for="(k, i) in quyKinh" :key="i" class="vtd-chip vtd-chip-qk">{{ k }}</span></div>
        <div v-else-if="herb.quy_kinh" class="vtd-prop"><span class="vtd-prop-k">Quy kinh</span><span class="vtd-val">{{ herb.quy_kinh }}</span></div>
        <div v-if="herb.lieu_dung" class="vtd-prop"><span class="vtd-prop-k">Liều dùng</span><span class="vtd-val">{{ herb.lieu_dung }}</span></div>
      </div>

      <!-- Công dụng -->
      <section v-if="congDung.length" class="vtd-sec">
        <h3 class="vtd-sec-title">Công dụng</h3>
        <div class="vtd-chips"><span v-for="(c, i) in congDung" :key="i" class="vtd-chip vtd-chip-cd">{{ c }}</span></div>
      </section>

      <!-- Chủ trị (chip — ẩn nếu đã có bản y văn đầy đủ bên dưới) -->
      <section v-if="chuTri.length && !herb.chu_tri" class="vtd-sec">
        <h3 class="vtd-sec-title">Chủ trị</h3>
        <div class="vtd-chips"><span v-for="(c, i) in chuTri" :key="i" class="vtd-chip vtd-chip-ct">{{ c }}</span></div>
      </section>

      <!-- Kiêng kỵ -->
      <section v-if="kiengKy.length" class="vtd-sec">
        <h3 class="vtd-sec-title">Kiêng kỵ</h3>
        <ul class="vtd-kk"><li v-for="(c, i) in kiengKy" :key="i">{{ c }}</li></ul>
      </section>

      <!-- Tên gọi khác (chip — ẩn nếu đã có "Tên khác" y văn bên dưới) -->
      <section v-if="tenGoiKhac.length && !herb.ten_khac" class="vtd-sec">
        <h3 class="vtd-sec-title">Tên gọi khác</h3>
        <div class="vtd-chips"><span v-for="(c, i) in tenGoiKhac" :key="i" class="vtd-chip">{{ c }}</span></div>
      </section>

    </template>
  </div>
</template>

<style scoped>
.vtd { color: var(--text, #2c2017); }
.vtd-msg { padding: 24px; text-align: center; color: var(--gray-500); }
.vtd-err { color: var(--danger, #b91c1c); }
.vtd-head { border-bottom: 1px solid var(--border, #e5e0d6); padding-bottom: 10px; margin-bottom: 12px; }
.vtd-name { font-size: 24px; font-weight: 800; color: var(--brown-800, #5b3a1a); margin: 0; display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.vtd-han { font-size: 20px; font-weight: 600; color: var(--brown-500, #8a6d3b); }
.vtd-sci { margin-top: 4px; display: flex; gap: 14px; flex-wrap: wrap; font-size: 13px; color: var(--gray-500); }
.vtd-sci em { color: var(--brown-600, #7a5a2e); }
.vtd-pinyin { font-style: italic; }
.vtd-props { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.vtd-prop { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.vtd-prop-k { min-width: 84px; font-size: 12px; font-weight: 700; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.03em; }
.vtd-val { font-size: 14px; }
.vtd-sec { margin-bottom: 12px; }
.vtd-sec-title { font-size: 13px; font-weight: 700; color: var(--brown-700, #6b4f2a); margin: 0 0 6px; }
.vtd-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.vtd-chip { display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 12.5px; border: 1px solid var(--border, #e5e0d6); background: #fff; color: var(--brown-800, #5b3a1a); }
.vtd-chip-tinh { background: #FFF1E6; border-color: #F0C9A0; }
.vtd-chip-vi { background: #FDECEC; border-color: #F0B9B9; color: #7a2e23; }
.vtd-chip-qk { background: #F3EEFE; border-color: #D6C8F5; color: #4b2e83; }
.vtd-chip-cd { background: #FAEBD8; border-color: #D9B98A; color: #5B3A1A; }
.vtd-chip-ct { background: #E8F2EE; border-color: #9DC2B4; color: #2D4A3E; }
.vtd-kk { margin: 0; padding-left: 18px; font-size: 13.5px; line-height: 1.6; color: #7a2e23; }
.vtd-kk li { margin: 2px 0; }
.vtd-yvan { margin: 0 0 16px; }
/* Tab y văn dạng "pill" — wrap đều & nhất quán dù 8 hay 9 mục (không còn cảnh "Tham khảo" lệch viền khi xuống dòng). */
.vtd-tabs { display: flex; flex-wrap: wrap; gap: 6px; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid var(--brown-200, #e7d9c2); }
.vtd-tab { padding: 5px 13px; border: 1px solid var(--border, #e5e0d6); border-radius: 999px; background: #faf6ef; color: var(--brown-700, #6b4f2a); font-size: 13px; font-weight: 600; cursor: pointer; line-height: 1.45; transition: background .12s, color .12s; }
.vtd-tab:hover { background: #f1e7d6; }
.vtd-tab.on { background: var(--brown-700, #6b4f2a); color: #fff; border-color: var(--brown-700, #6b4f2a); }
.vtd-tabpanel { min-height: 60px; }
.vtd-para { margin: 0 0 8px; font-size: 14px; line-height: 1.7; color: var(--text, #2c2017); white-space: pre-wrap; }
.vtd-src { color: var(--brown-600, #7a5a2e); text-decoration: underline dotted; text-underline-offset: 2px; cursor: pointer; }
.vtd-src:hover { color: var(--brown-800, #5b3a1a); text-decoration: underline; }
.vtd-bienthe { margin: 0 0 12px; padding: 8px 11px; background: #fff7e6; border: 1px solid #f0c98a; border-radius: 8px; font-size: 13px; color: #8a5a2b; line-height: 1.6; }
.vtd-bienthe-chip { display: inline-block; margin: 4px 4px 0 0; padding: 2px 9px; border-radius: 999px; border: 1px solid #d9a566; background: #fff; color: #7a4a1a; font-size: 12.5px; font-weight: 600; cursor: pointer; }
.vtd-bienthe-chip:hover { background: #fdecd0; }
.vtd-bt-block { margin: 0 0 8px; }
.vtd-bt-block:last-child { margin-bottom: 0; }
.vtd-bt-soft { margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e3c79a; color: #6b6256; }
.vtd-bt-han { margin-left: 5px; font-size: 11px; opacity: 0.75; }
.vtd-bt-list { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
.vtd-bt-row { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.vtd-gop-btn { padding: 2px 10px; border-radius: 999px; border: 1px solid #b45309; background: #b45309; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; }
.vtd-gop-btn:hover:not(:disabled) { background: #92400e; }
.vtd-gop-btn:disabled { opacity: 0.6; cursor: default; }
</style>
