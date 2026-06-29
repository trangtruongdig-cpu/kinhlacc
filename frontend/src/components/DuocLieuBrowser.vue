<script setup lang="ts">
/**
 * DuocLieuBrowser — TỪ ĐIỂN DƯỢC LIỆU NỘI TUYẾN (tab "Dược Liệu" của Từ Điển).
 * LƯỚI CARD (giống trang Vị Thuốc): ảnh + tên/Hán/Latin + số bài thuốc + chip tính/vị.
 * Bấm card → modal chi tiết (ViThuocDetail + "bài thuốc dùng vị này").
 * Chạy cả admin lẫn public; dữ liệu: GET /duoc-lieu (@Public) + thumbs.json + /phuong-thang/by-vi-thuoc/:id.
 */
import { ref, watch, onMounted, defineAsyncComponent } from 'vue'
import { api } from '@/services/api'
import { useDictLinks } from '@/lib/dictLinks'
const ViThuocDetail = defineAsyncComponent(() => import('@/components/ViThuocDetail.vue'))

const links = useDictLinks()

interface HerbLite { id: number; ten_vi_thuoc: string; ten_han?: string | null; ten_khoa_hoc?: string | null; tinh?: string | null; vi?: string | null; so_bai_thuoc?: number | null }
interface BaiRef { id: number; ten: string; slug: string; tac_gia?: string | null }

const q = ref('')
const page = ref(1)
const limit = 40
const items = ref<HerbLite[]>([])
const total = ref(0)
const loading = ref(true)
const selectedId = ref<number | null>(null)
const showDetail = ref(false)
const thumbs = ref<Record<string, { thumb: string; giai_doan: string }>>({})
const baiThuoc = ref<BaiRef[]>([])
let debounce: ReturnType<typeof setTimeout> | null = null

const totalPages = () => Math.max(1, Math.ceil(total.value / limit))

const THUMB_BASE = import.meta.env.BASE_URL || '/'
function thumbSrc(id: number): string {
  const f = thumbs.value[id]?.thumb
  if (!f) return ''
  if (/^https?:\/\//i.test(f) || f.startsWith('/')) return f
  return `${THUMB_BASE}vi-thuoc/${id}/${f}`.replace(/([^:])\/{2,}/g, '$1/')
}
function tinhChipClass(t?: string | null): string {
  const s = (t || '').toLowerCase()
  if (s.includes('nhiệt')) return 'dl2-tinh--nhiet'
  if (s.includes('ôn')) return 'dl2-tinh--on'
  if (s.includes('hàn')) return 'dl2-tinh--han'
  if (s.includes('lương') || s.includes('mát')) return 'dl2-tinh--luong'
  return 'dl2-tinh--binh'
}

async function loadThumbs() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL || '/'}vi-thuoc/thumbs.json`, { cache: 'no-cache' })
    if (res.ok) thumbs.value = await res.json()
  } catch { /* chưa có ảnh → bỏ qua */ }
}
async function loadList() {
  loading.value = true
  try {
    const res = await api.get<{ data?: HerbLite[]; total?: number }>(
      `/duoc-lieu?page=${page.value}&limit=${limit}&q=${encodeURIComponent(q.value.trim())}`,
    )
    items.value = res?.data ?? []
    total.value = Number(res?.total ?? 0)
  } catch { items.value = []; total.value = 0 } finally { loading.value = false }
}
async function openCard(id: number) {
  selectedId.value = id
  showDetail.value = true
  baiThuoc.value = []
  try { baiThuoc.value = await api.get<BaiRef[]>(`/phuong-thang/by-vi-thuoc/${id}`) } catch { baiThuoc.value = [] }
}
function closeDetail() { showDetail.value = false }

watch(q, () => { if (debounce) clearTimeout(debounce); debounce = setTimeout(() => { page.value = 1; loadList() }, 300) })
watch(page, () => { loadList(); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }) })
onMounted(() => { loadThumbs(); loadList() })
</script>

<template>
  <div class="dl2-wrap">
    <div class="dl2-search-row">
      <input v-model="q" type="search" class="dl2-input" placeholder="Tìm vị thuốc / tên Hán / tên khoa học…" />
      <span class="dl2-count">{{ total.toLocaleString('vi-VN') }} vị</span>
    </div>

    <div v-if="loading" class="dl2-msg">Đang tải…</div>
    <p v-else-if="!items.length" class="dl2-msg">Không có vị thuốc phù hợp.</p>

    <div v-else class="dl2-grid">
      <article v-for="vt in items" :key="vt.id" class="dl2-card" tabindex="0" @click="openCard(vt.id)" @keyup.enter="openCard(vt.id)">
        <img
          v-if="thumbs[vt.id]"
          class="dl2-card__thumb"
          :src="thumbSrc(vt.id)"
          :alt="`Ảnh ${vt.ten_vi_thuoc}`"
          :title="thumbs[vt.id]?.giai_doan"
          loading="lazy"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <div v-else class="dl2-card__thumb dl2-card__noimg">Chưa có ảnh</div>
        <div class="dl2-card__head">
          <h4 class="dl2-card__name">
            {{ vt.ten_vi_thuoc }}<span v-if="vt.ten_han" class="dl2-card__han">{{ vt.ten_han }}</span>
          </h4>
          <em v-if="vt.ten_khoa_hoc" class="dl2-card__latin">{{ vt.ten_khoa_hoc }}</em>
        </div>
        <div class="dl2-card__body">
          <div v-if="vt.so_bai_thuoc" class="dl2-card__nbai">Dùng trong {{ vt.so_bai_thuoc.toLocaleString('vi-VN') }} bài thuốc</div>
          <div class="dl2-meta-row">
            <div class="dl2-meta">
              <span class="dl2-meta__label">Tính</span>
              <span v-if="vt.tinh" :class="['dl2-tinh', tinhChipClass(vt.tinh)]">{{ vt.tinh }}</span>
              <span v-else class="dl2-meta__val">—</span>
            </div>
            <div class="dl2-meta">
              <span class="dl2-meta__label">Vị</span>
              <div v-if="vt.vi" class="dl2-vi-chips">
                <span v-for="flavor in vt.vi.split('/')" :key="flavor.trim()" class="dl2-vi-chip">{{ flavor.trim() }}</span>
              </div>
              <span v-else class="dl2-meta__val">—</span>
            </div>
          </div>
        </div>
      </article>
    </div>

    <div v-if="totalPages() > 1" class="dl2-pager">
      <button class="dl2-pg" :disabled="page <= 1" @click="page--">‹</button>
      <span class="dl2-pg-info">{{ page }} / {{ totalPages().toLocaleString('vi-VN') }}</span>
      <button class="dl2-pg" :disabled="page >= totalPages()" @click="page++">›</button>
    </div>

    <!-- MODAL CHI TIẾT -->
    <div v-if="showDetail && selectedId" class="dl2-modal-overlay" @click.self="closeDetail">
      <div class="dl2-modal">
        <button type="button" class="dl2-modal-close" aria-label="Đóng" @click="closeDetail">✕</button>
        <ViThuocDetail :vi-thuoc-id="selectedId" source="public" />
        <section v-if="baiThuoc.length" class="dl2-bai">
          <h3 class="dl2-bai-h">Bài thuốc có dùng vị này <span class="dl2-bai-n">({{ baiThuoc.length }})</span></h3>
          <div class="dl2-bai-list">
            <RouterLink v-for="b in baiThuoc" :key="b.id" :to="links.baiThuoc(b.slug)" class="dl2-bai-link">
              {{ b.ten }}<span v-if="b.tac_gia" class="dl2-bai-tg"> · {{ b.tac_gia }}</span>
            </RouterLink>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dl2-wrap { width: 100%; }
.dl2-search-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.dl2-input { flex: 1; min-width: 0; padding: 9px 14px; font-size: 14px; border: 1px solid var(--border, #e5e0d6); border-radius: 10px; }
.dl2-count { font-size: 12.5px; font-weight: 700; color: var(--brown-600, #7a5a30); white-space: nowrap; }
.dl2-msg { padding: 40px; color: var(--text-muted); text-align: center; }

/* LƯỚI CARD — giống .vt-grid/.vt-card bên Vị Thuốc */
.dl2-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: 16px;
}
.dl2-card {
  display: flex;
  flex-direction: column;
  background: var(--white, #fff);
  border: 1px solid var(--brown-100, #efe4d3);
  border-radius: var(--radius-lg, 14px);
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(74, 47, 23, 0.04);
  cursor: pointer;
  transition: box-shadow .15s, transform .15s, border-color .15s;
}
.dl2-card:hover, .dl2-card:focus-visible {
  box-shadow: 0 6px 18px rgba(74, 47, 23, 0.1);
  border-color: var(--brown-200, #e7d9c2);
  transform: translateY(-2px);
  outline: none;
}
.dl2-card__thumb {
  width: 100%;
  height: 140px;
  object-fit: cover;
  display: block;
  background: #f3eee3;
  border-bottom: 1px solid var(--brown-100, #efe4d3);
}
.dl2-card__noimg { display: flex; align-items: center; justify-content: center; color: var(--gray-400, #9ca3af); font-size: 12.5px; }
.dl2-card__head {
  padding: 11px 13px 8px;
  background: linear-gradient(135deg, var(--brown-50, #f7f3ec) 0%, #fff 100%);
  border-bottom: 1px solid var(--brown-100, #efe4d3);
}
.dl2-card__name { margin: 0; font-size: 15.5px; font-weight: 700; color: var(--brown-900, #43240f); line-height: 1.35; word-break: break-word; }
.dl2-card__han { margin-left: 6px; font-size: 13px; font-weight: 600; color: var(--brown-500, #8a6d3b); }
.dl2-card__latin { display: block; margin-top: 2px; font-size: 12px; color: var(--brown-600, #7a5a30); font-style: italic; }
.dl2-card__body { flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px; padding: 11px 13px; }
.dl2-card__nbai {
  display: inline-block; align-self: flex-start; margin: 0;
  padding: 2px 10px; font-size: 11.5px; font-weight: 700;
  color: var(--brown-700, #6b4f2a); background: var(--brown-50, #f7f3ec);
  border: 1px solid var(--brown-200, #e7d9c2); border-radius: 999px;
}
.dl2-meta-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: auto; }
.dl2-meta { display: flex; flex-direction: column; gap: 3px; align-items: flex-start; }
.dl2-meta__label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gray-500, #6b7280); }
.dl2-meta__val { font-size: 13px; color: var(--gray-800, #1f2937); }
.dl2-tinh { display: inline-block; font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 999px; line-height: 1.6; white-space: nowrap; }
.dl2-tinh--han   { background: #dbeafe; color: #1d4ed8; }
.dl2-tinh--luong { background: #e0f2fe; color: #0369a1; }
.dl2-tinh--binh  { background: #f3f4f6; color: #374151; }
.dl2-tinh--on    { background: #ffedd5; color: #c2410c; }
.dl2-tinh--nhiet { background: #fee2e2; color: #dc2626; }
.dl2-vi-chips { display: flex; flex-wrap: wrap; gap: 4px; }
.dl2-vi-chip { display: inline-block; font-size: 11px; font-weight: 600; padding: 1px 8px; border-radius: 999px; background: #fef9c3; color: #713f12; border: 1px solid #fde68a; white-space: nowrap; }

.dl2-pager { display: flex; align-items: center; justify-content: center; gap: 14px; padding-top: 18px; margin-top: 14px; }
.dl2-pg { padding: 5px 14px; border-radius: 8px; border: 1px solid var(--border, #e5e0d6); background: #fff; cursor: pointer; font-size: 15px; }
.dl2-pg:disabled { opacity: 0.4; cursor: default; }
.dl2-pg-info { font-size: 13px; color: var(--text-muted); }

/* MODAL */
.dl2-modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(38, 24, 12, 0.5);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 5vh 16px; overflow-y: auto;
}
.dl2-modal {
  position: relative; width: 100%; max-width: 920px;
  background: #fff; border-radius: 16px; padding: 22px 24px 26px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.dl2-modal-close {
  position: absolute; top: 12px; right: 14px; z-index: 2;
  width: 34px; height: 34px; border-radius: 999px;
  border: 1px solid var(--border, #e5e0d6); background: #fff;
  font-size: 16px; color: var(--brown-700, #6b4f2a); cursor: pointer; line-height: 1;
}
.dl2-modal-close:hover { background: var(--brown-50, #f7f3ec); }
.dl2-bai { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border, #eee); }
.dl2-bai-h { font-size: 14px; font-weight: 700; color: var(--brown-800, #5b3a1a); margin: 0 0 8px; }
.dl2-bai-n { font-size: 12.5px; font-weight: 500; color: var(--text-muted); }
.dl2-bai-list { display: flex; flex-wrap: wrap; gap: 6px; }
.dl2-bai-link { display: inline-block; padding: 5px 11px; border: 1px solid var(--border, #eee); border-radius: 14px; background: var(--surface-2, #faf8f3); text-decoration: none; color: var(--brown-800, #5b3a1a); font-size: 13px; }
.dl2-bai-link:hover { border-color: var(--brown-400, #b9935a); background: var(--brown-50, #f7f3ec); }
.dl2-bai-tg { color: var(--gray-500, #6b7280); font-size: 11.5px; }

@media (max-width: 560px) {
  .dl2-grid { grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr)); gap: 12px; }
  .dl2-card__thumb { height: 120px; }
  .dl2-modal { padding: 18px 16px 20px; }
}
</style>
