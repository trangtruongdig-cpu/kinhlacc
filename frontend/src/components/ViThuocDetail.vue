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
  congDungLinks?: LinkCongDung[]
  chuTriLinks?: LinkChuTri[]
  kiengKyLinks?: LinkKiengKy[]
  kinhMachLinks?: LinkKinhMach[]
  tenGoiKhacList?: Array<{ ten_goi_khac?: string }>
}

const herb = ref<Herb | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

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

async function load(id: number) {
  loading.value = true
  error.value = null
  herb.value = null
  try {
    const base = props.source === 'public' ? '/duoc-lieu' : '/vi-thuoc'
    herb.value = await api.get<Herb>(`${base}/${id}`)
    if (herb.value) emit('loaded', { id: herb.value.id, ten: herb.value.ten_vi_thuoc })
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => load(props.viThuocId))
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
          <span v-if="herb.bo_phan_dung" class="vtd-bpd">Bộ phận dùng: {{ herb.bo_phan_dung }}</span>
        </div>
      </header>

      <!-- Thư viện ảnh theo giai đoạn (đưa lên đầu cho trực quan) -->
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

      <!-- Chủ trị -->
      <section v-if="chuTri.length" class="vtd-sec">
        <h3 class="vtd-sec-title">Chủ trị</h3>
        <div class="vtd-chips"><span v-for="(c, i) in chuTri" :key="i" class="vtd-chip vtd-chip-ct">{{ c }}</span></div>
      </section>

      <!-- Kiêng kỵ -->
      <section v-if="kiengKy.length" class="vtd-sec">
        <h3 class="vtd-sec-title">Kiêng kỵ</h3>
        <ul class="vtd-kk"><li v-for="(c, i) in kiengKy" :key="i">{{ c }}</li></ul>
      </section>

      <!-- Tên gọi khác -->
      <section v-if="tenGoiKhac.length" class="vtd-sec">
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
</style>
