<script setup lang="ts">
/**
 * DuocLieuListView — TỪ ĐIỂN DƯỢC LIỆU CÔNG KHAI (khách chưa đăng nhập).
 * Danh sách + tìm kiếm vị thuốc; bấm để xem chi tiết (/duoc-lieu/:id).
 * Dữ liệu: GET /duoc-lieu (endpoint @Public).
 */
import { ref, watch, onMounted } from 'vue'
import PublicTopBar from '@/components/PublicTopBar.vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import { api, assetUrl } from '@/services/api'
import { discGlyph, hanDiscClass, tenLenClass, tinhLabelClass, cardColorClass } from '@/lib/herbCard'

interface HerbLite {
  id: number
  ten_vi_thuoc: string
  ten_han?: string | null
  ten_khoa_hoc?: string | null
  ten_pinyin?: string | null
  tinh?: string | null
  vi?: string | null
  so_bai_thuoc?: number | null
  anh_dai_dien?: string | null
}

const q = ref('')
const page = ref(1)
const limit = 24
const items = ref<HerbLite[]>([])
const total = ref(0)
const loading = ref(true)
const error = ref<string | null>(null)
const thumbs = ref<Record<string, { thumb: string; giai_doan: string }>>({})
let debounce: ReturnType<typeof setTimeout> | null = null

const THUMB_BASE = import.meta.env.BASE_URL || '/'
// Thumb có thể là URL http, đường dẫn /vi-thuoc/.., hay TÊN FILE TRẦN → prefix path tĩnh cho tên trần.
function thumbSrc(id: number): string {
  const f = thumbs.value[id]?.thumb
  if (!f) return ''
  if (/^https?:\/\//i.test(f) || f.startsWith('/')) return f
  return `${THUMB_BASE}vi-thuoc/${id}/${f}`.replace(/([^:])\/{2,}/g, '$1/')
}
// Ảnh thẻ: ưu tiên ảnh đại diện người dùng đặt, fallback thumbs.json.
function cardImg(vt: HerbLite): string {
  return vt.anh_dai_dien ? assetUrl(vt.anh_dai_dien) : thumbSrc(vt.id)
}

async function loadThumbs() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL || '/'}vi-thuoc/thumbs.json`, { cache: 'no-cache' })
    if (res.ok) thumbs.value = await res.json()
  } catch { /* chưa có ảnh → bỏ qua */ }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get<{ data?: HerbLite[]; total?: number }>(
      `/duoc-lieu?page=${page.value}&limit=${limit}&q=${encodeURIComponent(q.value.trim())}`,
    )
    items.value = res?.data ?? []
    total.value = Number(res?.total ?? 0)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

const totalPages = () => Math.max(1, Math.ceil(total.value / limit))

watch(q, () => {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(() => { page.value = 1; load() }, 300)
})
watch(page, load)

onMounted(() => {
  loadThumbs()
  document.title = 'Từ điển dược liệu — tra cứu vị thuốc Đông Y | Kinh Lạc Trương Gia'
  const m = document.querySelector('meta[name="description"]')
  if (m) m.setAttribute('content', 'Tra cứu vị thuốc Đông Y: tính, vị, quy kinh, công dụng, chủ trị, kiêng kỵ và hình ảnh từ nguyên liệu đến thành phẩm.')
  load()
})
</script>

<template>
  <div class="dl">
    <PublicTopBar title="Từ điển dược liệu" />
    <AppBreadcrumb />

    <div class="dl-body">
      <header class="dl-head">
        <h1 class="dl-title">Từ điển dược liệu</h1>
        <p class="dl-sub">Tra cứu vị thuốc Đông Y — tính · vị · quy kinh · công dụng · chủ trị · kiêng kỵ · hình ảnh theo giai đoạn.</p>
        <div class="dl-search">
          <input v-model="q" type="search" class="dl-input" placeholder="Tìm theo tên vị thuốc, tên Hán, tên khoa học…" />
        </div>
      </header>

      <div v-if="loading" class="dl-msg">Đang tải…</div>
      <div v-else-if="error" class="dl-msg dl-err">{{ error }}</div>
      <div v-else-if="!items.length" class="dl-msg">Không tìm thấy vị thuốc phù hợp.</div>

      <template v-else>
        <div class="hlc-grid">
          <RouterLink
            v-for="vt in items"
            :key="vt.id"
            :to="{ name: 'duoc-lieu-detail', params: { id: vt.id } }"
            class="hlc"
            :class="cardColorClass(vt.id)"
          >
            <span class="hlc-frame" aria-hidden="true"></span>
            <i class="hlc-corner tl" aria-hidden="true"></i><i class="hlc-corner tr" aria-hidden="true"></i>
            <i class="hlc-corner bl" aria-hidden="true"></i><i class="hlc-corner br" aria-hidden="true"></i>

            <img
              v-if="cardImg(vt)"
              class="hlc-photo"
              :src="cardImg(vt)"
              :alt="`Ảnh ${vt.ten_vi_thuoc}`"
              :title="thumbs[vt.id]?.giai_doan"
              loading="lazy"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />

            <div class="hlc-top">
              <div class="hlc-disc"><span class="hlc-han-art" :class="hanDiscClass(vt)">{{ discGlyph(vt) }}</span></div>
              <div class="hlc-headtext">
                <h3 class="hlc-name" :class="tenLenClass(vt.ten_vi_thuoc)">{{ vt.ten_vi_thuoc }}</h3>
                <div v-if="vt.ten_han || vt.ten_pinyin" class="hlc-hanline">
                  <span v-if="vt.ten_han" class="hlc-han">{{ vt.ten_han }}</span>
                  <span v-if="vt.ten_pinyin" class="hlc-pinyin">{{ vt.ten_pinyin }}</span>
                </div>
                <em v-if="vt.ten_khoa_hoc" class="hlc-latin" :title="vt.ten_khoa_hoc">{{ vt.ten_khoa_hoc }}</em>
              </div>
            </div>

            <div class="hlc-rule"></div>

            <div class="hlc-meta">
              <div v-if="vt.tinh || vt.vi" class="hlc-line">
                <span class="k">Tính vị:</span>
                <span v-if="vt.tinh" class="hlc-tinh" :class="tinhLabelClass(vt.tinh)">{{ vt.tinh }}</span>
                <template v-if="vt.vi"> · {{ (vt.vi || '').split(/[,/、，]/).map(s => s.trim()).filter(Boolean).join(', ') }}</template>
              </div>
            </div>

            <div v-if="vt.so_bai_thuoc" class="hlc-foot">
              <span class="hlc-nbai">Dùng trong {{ vt.so_bai_thuoc.toLocaleString('vi-VN') }} bài thuốc</span>
            </div>
          </RouterLink>
        </div>

        <div v-if="totalPages() > 1" class="dl-pager">
          <button class="dl-pg" :disabled="page <= 1" @click="page--">‹ Trước</button>
          <span class="dl-pg-info">Trang {{ page }} / {{ totalPages() }}</span>
          <button class="dl-pg" :disabled="page >= totalPages()" @click="page++">Sau ›</button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dl { min-height: 100vh; background: var(--bg-app); }
.dl-body { max-width: 1100px; margin: 0 auto; padding: var(--space-6) var(--space-5) var(--space-12); }
.dl-head { text-align: center; margin-bottom: var(--space-6); }
.dl-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--text-brand); margin-bottom: 6px; }
.dl-sub { font-size: var(--font-size-sm); color: var(--text-muted); margin-bottom: var(--space-4); }
.dl-search { max-width: 520px; margin: 0 auto; }
.dl-input { width: 100%; padding: 10px 14px; font-size: 14px; border: 1px solid var(--border, #e5e0d6); border-radius: 10px; }
.dl-msg { text-align: center; padding: var(--space-10); color: var(--text-muted); }
.dl-err { color: var(--danger, #b91c1c); }
/* Lưới + thẻ dùng bộ .hlc-* toàn cục (herb-label-card.css). */
.dl-pager { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: var(--space-6); }
.dl-pg { padding: 7px 14px; border-radius: 8px; border: 1px solid var(--border, #e5e0d6); background: #fff; cursor: pointer; font-size: 13px; }
.dl-pg:disabled { opacity: 0.5; cursor: default; }
.dl-pg-info { font-size: 13px; color: var(--text-muted); }
</style>
