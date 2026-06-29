<script setup lang="ts">
/**
 * ViThuocDetail — Hiển thị TỪ ĐIỂN một vị thuốc: mọi thông tin + thư viện ảnh theo giai đoạn.
 * Dùng chung cho khu admin (source='admin' → /vi-thuoc/:id) và bản công khai (source='public' → /duoc-lieu/:id).
 */
import { ref, watch, onMounted, computed } from 'vue'
import { api } from '@/services/api'
import ViThuocGallery from '@/components/ViThuocGallery.vue'

const props = defineProps<{ viThuocId: number; source?: 'admin' | 'public' }>()
const emit = defineEmits<{ loaded: [{ id: number; ten: string }] }>()

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
interface Variant { ten: string; id: number; ten_vi_thuoc: string }
const bienThe = ref<Variant[]>([]) // tên khác trùng vị đã có (nghi biến thể)
const isTenKhacTab = computed(() => (yvanSections.value[activeYvan.value]?.title || '') === 'Tên khác')

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
const srcMap = ref<Map<string, { ten: string; href: string }>>(new Map())
const normSrc = (s: string) => s.toLowerCase().normalize('NFC').replace(/\s+/g, ' ').trim()

async function loadSources() {
  if (srcRe.value) return
  try {
    const j = await fetch('/kinhmach3d/data/dict-sources.json').then((r) => r.json())
    const recs = (j && j.sources) || {}
    const map = new Map<string, { ten: string; href: string }>()
    const names: string[] = []
    for (const k of Object.keys(recs)) {
      const r = recs[k]
      if (!r || !r.ten) continue
      const href = r.link || `https://www.google.com/search?q=${encodeURIComponent(r.ten + ' đông y')}`
      for (const nm of [r.ten, ...(Array.isArray(r.alias) ? r.alias : [])]) {
        const t = String(nm || '').trim()
        if (t.length < 4) continue
        const key = normSrc(t)
        if (!map.has(key)) { map.set(key, { ten: t, href }); names.push(t) }
      }
    }
    names.sort((a, b) => b.length - a.length)
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    srcRe.value = names.length ? new RegExp('(' + names.map(esc).join('|') + ')', 'gi') : null
    srcMap.value = map
  } catch { /* nguồn là phụ — lỗi tải thì hiện text thường */ }
}

type Part = { t: string; href?: string }
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
    out.push({ t: m[0], href: hit ? hit.href : undefined })
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

onMounted(() => { void loadSources(); load(props.viThuocId) })
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
          <span v-if="herb.xuat_xu" class="vtd-bpd">Xuất xứ: {{ herb.xuat_xu }}</span>
        </div>
      </header>

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
          <div v-if="isTenKhacTab && bienThe.length" class="vtd-bienthe">
            ⚠️ Một số tên khác trùng vị thuốc đã có — <strong>có thể là biến thể/bản trùng</strong>, nên kiểm tra:
            <button v-for="v in bienThe" :key="v.id" type="button" class="vtd-bienthe-chip" @click="load(v.id)">{{ v.ten_vi_thuoc }}</button>
          </div>
          <p v-for="(parts, i) in activeParas" :key="i" class="vtd-para"><template v-for="(part, j) in parts" :key="j"><a v-if="part.href" :href="part.href" target="_blank" rel="noopener" class="vtd-src" :title="'Nguồn: ' + part.t">{{ part.t }}</a><template v-else>{{ part.t }}</template></template></p>
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
.vtd-tabs { display: flex; flex-wrap: wrap; gap: 4px; border-bottom: 2px solid var(--brown-200, #e7d9c2); margin-bottom: 12px; }
.vtd-tab { padding: 6px 13px; border: 1px solid var(--border, #e5e0d6); border-bottom: none; border-radius: 8px 8px 0 0; background: #faf6ef; color: var(--brown-700, #6b4f2a); font-size: 13px; font-weight: 600; cursor: pointer; margin-bottom: -2px; transition: background .12s, color .12s; }
.vtd-tab:hover { background: #f1e7d6; }
.vtd-tab.on { background: var(--brown-700, #6b4f2a); color: #fff; border-color: var(--brown-700, #6b4f2a); }
.vtd-tabpanel { min-height: 60px; }
.vtd-para { margin: 0 0 8px; font-size: 14px; line-height: 1.7; color: var(--text, #2c2017); white-space: pre-wrap; }
.vtd-src { color: var(--brown-600, #7a5a2e); text-decoration: underline dotted; text-underline-offset: 2px; cursor: pointer; }
.vtd-src:hover { color: var(--brown-800, #5b3a1a); text-decoration: underline; }
.vtd-bienthe { margin: 0 0 12px; padding: 8px 11px; background: #fff7e6; border: 1px solid #f0c98a; border-radius: 8px; font-size: 13px; color: #8a5a2b; line-height: 1.6; }
.vtd-bienthe-chip { display: inline-block; margin: 4px 4px 0 0; padding: 2px 9px; border-radius: 999px; border: 1px solid #d9a566; background: #fff; color: #7a4a1a; font-size: 12.5px; font-weight: 600; cursor: pointer; }
.vtd-bienthe-chip:hover { background: #fdecd0; }
</style>
