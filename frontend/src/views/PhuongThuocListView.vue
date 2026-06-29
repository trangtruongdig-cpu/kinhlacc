<script setup lang="ts">
/**
 * PhuongThuocListView — TỪ ĐIỂN BÀI THUỐC / CỔ PHƯƠNG CÔNG KHAI (khách chưa đăng nhập).
 * Danh sách + tìm kiếm; bấm để xem chi tiết (/bai-thuoc/:slug). Dữ liệu: GET /phuong-thang (@Public).
 */
import { ref, watch, onMounted } from 'vue'
import PublicTopBar from '@/components/PublicTopBar.vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import { api } from '@/services/api'

interface BaiLite {
  id: number
  ten: string
  slug: string
  xuat_xu?: string | null
  tac_gia?: string | null
}

const q = ref('')
const page = ref(1)
const limit = 24
const items = ref<BaiLite[]>([])
const total = ref(0)
const loading = ref(true)
const error = ref<string | null>(null)
let debounce: ReturnType<typeof setTimeout> | null = null

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get<{ data?: BaiLite[]; total?: number }>(
      `/phuong-thang?page=${page.value}&limit=${limit}&q=${encodeURIComponent(q.value.trim())}`,
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
  document.title = 'Từ điển bài thuốc Đông Y — 13.942 cổ phương | Kinh Lạc Trương Gia'
  const m = document.querySelector('meta[name="description"]')
  if (m) m.setAttribute('content', 'Tra cứu hơn 13.900 bài thuốc, cổ phương Đông Y: thành phần vị thuốc, liều lượng, cách dùng, tác dụng và xuất xứ.')
  load()
})
</script>

<template>
  <div class="pt">
    <PublicTopBar title="Từ điển bài thuốc" />
    <AppBreadcrumb />

    <div class="pt-body">
      <header class="pt-head">
        <h1 class="pt-title">Từ điển bài thuốc Đông Y</h1>
        <p class="pt-sub">Hơn <strong>13.900 cổ phương</strong> — thành phần · liều lượng · cách dùng · tác dụng · xuất xứ. Bấm vị thuốc trong bài để xem chi tiết dược liệu.</p>
        <div class="pt-search">
          <input v-model="q" type="search" class="pt-input" placeholder="Tìm theo tên bài thuốc (vd: Lục Vị, Bát Trân, Tứ Quân…)" />
        </div>
        <p v-if="!loading && !error" class="pt-count">{{ total.toLocaleString('vi-VN') }} bài thuốc</p>
      </header>

      <div v-if="loading" class="pt-msg">Đang tải…</div>
      <div v-else-if="error" class="pt-msg pt-err">{{ error }}</div>
      <div v-else-if="!items.length" class="pt-msg">Không tìm thấy bài thuốc phù hợp.</div>

      <template v-else>
        <ul class="pt-grid">
          <li v-for="b in items" :key="b.id">
            <RouterLink :to="{ name: 'bai-thuoc-detail', params: { slug: b.slug } }" class="pt-card">
              <h3 class="pt-card-name">{{ b.ten }}</h3>
              <p v-if="b.tac_gia" class="pt-card-meta">{{ b.tac_gia }}</p>
              <p v-if="b.xuat_xu" class="pt-card-src">{{ b.xuat_xu }}</p>
            </RouterLink>
          </li>
        </ul>

        <div v-if="totalPages() > 1" class="pt-pager">
          <button class="pt-pg" :disabled="page <= 1" @click="page--">‹ Trước</button>
          <span class="pt-pg-info">Trang {{ page }} / {{ totalPages().toLocaleString('vi-VN') }}</span>
          <button class="pt-pg" :disabled="page >= totalPages()" @click="page++">Sau ›</button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.pt { min-height: 100vh; background: var(--bg-app); }
.pt-body { max-width: 1100px; margin: 0 auto; padding: var(--space-6) var(--space-5) var(--space-12); }
.pt-head { text-align: center; margin-bottom: var(--space-6); }
.pt-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--text-brand); margin-bottom: 6px; }
.pt-sub { font-size: var(--font-size-sm); color: var(--text-muted); margin-bottom: var(--space-4); max-width: 680px; margin-left: auto; margin-right: auto; }
.pt-search { max-width: 520px; margin: 0 auto; }
.pt-input { width: 100%; padding: 10px 14px; font-size: 14px; border: 1px solid var(--border, #e5e0d6); border-radius: 10px; }
.pt-count { font-size: 12px; color: var(--text-muted); margin-top: 8px; }
.pt-msg { text-align: center; padding: var(--space-10); color: var(--text-muted); }
.pt-err { color: var(--danger, #b91c1c); }
.pt-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.pt-card { display: block; height: 100%; padding: 14px 16px; border: 1px solid var(--border, #e5e0d6); border-radius: 12px; background: var(--surface, #fff); text-decoration: none; transition: all 0.18s ease; }
.pt-card:hover { border-color: var(--brown-400, #b9935a); box-shadow: 0 4px 14px rgba(0,0,0,0.06); transform: translateY(-2px); }
.pt-card-name { font-size: 16px; font-weight: 700; color: var(--brown-800, #5b3a1a); margin: 0 0 6px; }
.pt-card-meta { font-size: 12.5px; color: var(--brown-600, #7a5a30); margin: 0 0 2px; }
.pt-card-src { font-size: 12px; color: var(--gray-500); margin: 0; font-style: italic; }
.pt-pager { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: var(--space-6); }
.pt-pg { padding: 7px 14px; border-radius: 8px; border: 1px solid var(--border, #e5e0d6); background: #fff; cursor: pointer; font-size: 13px; }
.pt-pg:disabled { opacity: 0.5; cursor: default; }
.pt-pg-info { font-size: 13px; color: var(--text-muted); }
</style>
