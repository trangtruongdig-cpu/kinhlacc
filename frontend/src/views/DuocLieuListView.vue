<script setup lang="ts">
/**
 * DuocLieuListView — TỪ ĐIỂN DƯỢC LIỆU CÔNG KHAI (khách chưa đăng nhập).
 * Danh sách + tìm kiếm vị thuốc; bấm để xem chi tiết (/duoc-lieu/:id).
 * Dữ liệu: GET /duoc-lieu (endpoint @Public).
 */
import { ref, watch, onMounted } from 'vue'
import PublicTopBar from '@/components/PublicTopBar.vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import { api } from '@/services/api'

interface HerbLite {
  id: number
  ten_vi_thuoc: string
  ten_han?: string | null
  ten_khoa_hoc?: string | null
  ten_pinyin?: string | null
  tinh?: string | null
  vi?: string | null
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
        <ul class="dl-grid">
          <li v-for="vt in items" :key="vt.id">
            <RouterLink :to="{ name: 'duoc-lieu-detail', params: { id: vt.id } }" class="dl-card">
              <img
                v-if="thumbs[vt.id]"
                class="dl-card-thumb"
                :src="thumbs[vt.id]?.thumb"
                :alt="`Ảnh ${vt.ten_vi_thuoc}`"
                :title="thumbs[vt.id]?.giai_doan"
                loading="lazy"
              />
              <h3 class="dl-card-name">
                {{ vt.ten_vi_thuoc }}
                <span v-if="vt.ten_han" class="dl-card-han">{{ vt.ten_han }}</span>
              </h3>
              <em v-if="vt.ten_khoa_hoc" class="dl-card-latin">{{ vt.ten_khoa_hoc }}</em>
              <div class="dl-card-props">
                <span v-if="vt.tinh" class="dl-chip dl-chip-tinh">{{ vt.tinh }}</span>
                <span v-for="(v, i) in (vt.vi || '').split(/[,/、，]/).map(s => s.trim()).filter(Boolean)" :key="i" class="dl-chip dl-chip-vi">{{ v }}</span>
              </div>
            </RouterLink>
          </li>
        </ul>

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
.dl-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.dl-card { display: block; height: 100%; padding: 14px; border: 1px solid var(--border, #e5e0d6); border-radius: 12px; background: var(--surface, #fff); text-decoration: none; transition: all 0.18s ease; }
.dl-card:hover { border-color: var(--brown-400, #b9935a); box-shadow: 0 4px 14px rgba(0,0,0,0.06); transform: translateY(-2px); }
.dl-card-thumb { width: 100%; height: 140px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; background: #f3eee3; display: block; }
.dl-card-name { font-size: 16px; font-weight: 700; color: var(--brown-800, #5b3a1a); margin: 0 0 2px; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.dl-card-han { font-size: 14px; font-weight: 500; color: var(--brown-500, #8a6d3b); }
.dl-card-latin { display: block; font-size: 12px; color: var(--gray-500); margin-bottom: 8px; }
.dl-card-props { display: flex; flex-wrap: wrap; gap: 5px; }
.dl-chip { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11.5px; border: 1px solid var(--border, #e5e0d6); background: #fff; }
.dl-chip-tinh { background: #FFF1E6; border-color: #F0C9A0; color: #7a4a1a; }
.dl-chip-vi { background: #FDECEC; border-color: #F0B9B9; color: #7a2e23; }
.dl-pager { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: var(--space-6); }
.dl-pg { padding: 7px 14px; border-radius: 8px; border: 1px solid var(--border, #e5e0d6); background: #fff; cursor: pointer; font-size: 13px; }
.dl-pg:disabled { opacity: 0.5; cursor: default; }
.dl-pg-info { font-size: 13px; color: var(--text-muted); }
</style>
