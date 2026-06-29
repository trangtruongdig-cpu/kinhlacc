<script setup lang="ts">
/**
 * PhuongThuocBrowser — Duyệt TỪ ĐIỂN BÀI THUỐC NỘI TUYẾN (tab "Bài Thuốc" của Từ Điển).
 * Bố cục 2 CỘT giống tab Huyệt Vị: danh sách trái (luôn hiện) + chi tiết phải → bấm xem ngay, khỏi back.
 * KHÔNG điều hướng (chạy cả admin lẫn public). Thành phần → /duoc-lieu/:id; Xuất xứ → emit open-source.
 * Dữ liệu: GET /phuong-thang (@Public).
 */
import { ref, watch, onMounted } from 'vue'
import { api } from '@/services/api'
import { useDictLinks } from '@/lib/dictLinks'

const emit = defineEmits<{ (e: 'open-source', name: string): void }>()
const links = useDictLinks()

interface Lite { id: number; ten: string; slug: string; xuat_xu?: string | null; tac_gia?: string | null; so_benh?: number }
interface ThanhPhan { ten: string; lieu: string; id: number | null }
interface Detail extends Lite { thanh_phan?: ThanhPhan[]; cach_dung?: string | null; tac_dung?: string | null; ghi_chu?: string | null }

const q = ref('')
const page = ref(1)
const limit = 40
const items = ref<Lite[]>([])
const total = ref(0)
const loading = ref(true)
const selected = ref<Detail | null>(null)
const selectedId = ref<number | null>(null)
const loadingDetail = ref(false)
let debounce: ReturnType<typeof setTimeout> | null = null

async function loadList(autoSelect = true) {
  loading.value = true
  try {
    const res = await api.get<{ data?: Lite[]; total?: number }>(
      `/phuong-thang?page=${page.value}&limit=${limit}&q=${encodeURIComponent(q.value.trim())}`,
    )
    items.value = res?.data ?? []
    total.value = Number(res?.total ?? 0)
    const first = items.value[0]
    if (autoSelect && first && !items.value.some((b) => b.id === selectedId.value)) {
      openDetail(first)
    }
  } catch { items.value = []; total.value = 0 } finally { loading.value = false }
}
async function openDetail(b: Lite) {
  selectedId.value = b.id
  loadingDetail.value = true
  try { selected.value = await api.get<Detail>(`/phuong-thang/${encodeURIComponent(b.slug)}`) }
  catch { selected.value = null } finally { loadingDetail.value = false }
}
const totalPages = () => Math.max(1, Math.ceil(total.value / limit))

watch(q, () => { if (debounce) clearTimeout(debounce); debounce = setTimeout(() => { page.value = 1; loadList() }, 300) })
watch(page, () => loadList())
onMounted(() => loadList())
</script>

<template>
  <div class="ptb-shell">
    <!-- DANH SÁCH (trái) -->
    <aside class="ptb-aside">
      <div class="ptb-search-row">
        <input v-model="q" type="search" class="ptb-input" placeholder="Tìm bài thuốc…" />
        <span class="ptb-count">{{ total.toLocaleString('vi-VN') }}</span>
      </div>
      <div v-if="loading" class="ptb-msg">Đang tải…</div>
      <p v-else-if="!items.length" class="ptb-msg">Không có bài phù hợp.</p>
      <ul v-else class="ptb-list">
        <li v-for="b in items" :key="b.id">
          <button type="button" class="ptb-li" :class="{ active: b.id === selectedId }" @click="openDetail(b)">
            <span class="ptb-li-name">{{ b.ten }}<span v-if="b.so_benh" class="ptb-li-benh">{{ b.so_benh }} bệnh</span></span>
            <span v-if="b.tac_gia || b.xuat_xu" class="ptb-li-sub">{{ b.tac_gia || b.xuat_xu }}</span>
          </button>
        </li>
      </ul>
      <div v-if="totalPages() > 1" class="ptb-pager">
        <button class="ptb-pg" :disabled="page <= 1" @click="page--">‹</button>
        <span class="ptb-pg-info">{{ page }} / {{ totalPages().toLocaleString('vi-VN') }}</span>
        <button class="ptb-pg" :disabled="page >= totalPages()" @click="page++">›</button>
      </div>
    </aside>

    <!-- CHI TIẾT (phải) -->
    <div class="ptb-main">
      <div v-if="loadingDetail && !selected" class="ptb-msg">Đang tải…</div>
      <p v-else-if="!selected" class="ptb-welcome">Chọn một bài thuốc ở danh sách bên trái để xem chi tiết.</p>
      <article v-else>
        <h2 class="ptb-d-title">{{ selected.ten }}</h2>
        <div class="ptb-d-meta">
          <button v-if="selected.xuat_xu" type="button" class="ptb-src" @click="emit('open-source', selected.xuat_xu)">
            Xuất xứ: <strong>{{ selected.xuat_xu }}</strong>
          </button>
          <button v-if="selected.tac_gia" type="button" class="ptb-src" @click="emit('open-source', selected.tac_gia)">
            Tác giả: <strong>{{ selected.tac_gia }}</strong>
          </button>
          <span v-if="selected.so_benh" class="ptb-benh-badge">Dùng trong {{ selected.so_benh }} bệnh (Đông y)</span>
        </div>
        <template v-if="selected.tac_dung">
          <h3 class="ptb-h">Tác dụng</h3>
          <p class="ptb-text">{{ selected.tac_dung }}</p>
        </template>
        <template v-if="selected.thanh_phan && selected.thanh_phan.length">
          <h3 class="ptb-h">Thành phần <span class="ptb-n">({{ selected.thanh_phan.length }} vị)</span></h3>
          <ul class="ptb-ing">
            <li v-for="(t, i) in selected.thanh_phan" :key="i">
              <RouterLink v-if="t.id" :to="links.viThuoc(t.id)" class="ptb-ing-link">{{ t.ten }}</RouterLink>
              <span v-else>{{ t.ten }}</span>
              <span v-if="t.lieu" class="ptb-ing-dose">{{ t.lieu }}</span>
            </li>
          </ul>
        </template>
        <template v-if="selected.cach_dung">
          <h3 class="ptb-h">Cách bào chế &amp; sử dụng</h3>
          <p class="ptb-text">{{ selected.cach_dung }}</p>
        </template>
        <template v-if="selected.ghi_chu">
          <h3 class="ptb-h">Ghi chú</h3>
          <p class="ptb-text">{{ selected.ghi_chu }}</p>
        </template>
        <p class="ptb-disc">Cổ phương tham khảo — không tự ý dùng, hãy hỏi thầy thuốc Y Học Cổ Truyền.</p>
      </article>
    </div>
  </div>
</template>

<style scoped>
.ptb-shell { display: flex; gap: 16px; align-items: flex-start; }
.ptb-aside { flex: 0 0 320px; max-width: 320px; display: flex; flex-direction: column; }
.ptb-search-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.ptb-input { flex: 1; min-width: 0; padding: 8px 12px; font-size: 13.5px; border: 1px solid var(--border, #e5e0d6); border-radius: 9px; }
.ptb-count { font-size: 11.5px; color: var(--text-muted); white-space: nowrap; }
.ptb-msg, .ptb-welcome { padding: var(--space-6); color: var(--text-muted); text-align: center; }
.ptb-welcome { font-size: 14px; }
.ptb-list { list-style: none; margin: 0; padding: 0; max-height: 64vh; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.ptb-li { display: block; width: 100%; text-align: left; padding: 8px 11px; border: 1px solid transparent; border-radius: 9px; background: none; cursor: pointer; transition: background 0.12s; }
.ptb-li:hover { background: var(--brown-50, #f7f3ec); }
.ptb-li.active { background: var(--brown-100, #efe4d3); border-color: var(--brown-300, #d8c0a0); }
.ptb-li-name { display: block; font-size: 14px; font-weight: 600; color: var(--brown-800, #5b3a1a); }
.ptb-li-sub { display: block; font-size: 11.5px; color: var(--gray-500); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ptb-li-benh { margin-left: 8px; padding: 0 7px; border-radius: 999px; background: #e6f0e6; color: #2f6a3a; font-size: 10.5px; font-weight: 800; white-space: nowrap; }
.ptb-benh-badge { padding: 2px 10px; border-radius: 999px; background: #e6f0e6; color: #2f6a3a; font-size: 12px; font-weight: 700; }
.ptb-pager { display: flex; align-items: center; justify-content: center; gap: 12px; padding-top: 10px; margin-top: 6px; border-top: 1px solid var(--border, #eee); }
.ptb-pg { padding: 4px 12px; border-radius: 8px; border: 1px solid var(--border, #e5e0d6); background: #fff; cursor: pointer; font-size: 14px; }
.ptb-pg:disabled { opacity: 0.4; cursor: default; }
.ptb-pg-info { font-size: 12.5px; color: var(--text-muted); }

.ptb-main { flex: 1; min-width: 0; border-left: 1px solid var(--border, #eee); padding-left: 18px; }
.ptb-d-title { font-size: 22px; font-weight: 800; color: var(--text-brand, #5b3a1a); margin: 0 0 10px; }
.ptb-d-meta { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--border, #eee); margin-bottom: 14px; }
.ptb-src { padding: 0; border: 0; background: none; cursor: pointer; font-size: 13.5px; color: var(--brown-700, #6b4f2a); }
.ptb-src:hover strong { text-decoration: underline; }
.ptb-tg { font-size: 13.5px; color: var(--text-muted); }
.ptb-h { font-size: 15px; font-weight: 700; color: var(--brown-800, #5b3a1a); margin: 14px 0 6px; }
.ptb-n { font-size: 13px; font-weight: 500; color: var(--text-muted); }
.ptb-text { font-size: 14px; line-height: 1.7; color: var(--text); margin: 0; white-space: pre-line; }
.ptb-ing { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 6px; }
.ptb-ing li { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 6px 11px; background: var(--surface-2, #faf8f3); border: 1px solid var(--border, #eee); border-radius: 8px; font-size: 13.5px; }
.ptb-ing-link { color: var(--brown-700, #8a5a1a); text-decoration: none; font-weight: 600; }
.ptb-ing-link:hover { text-decoration: underline; }
.ptb-ing-dose { font-family: ui-monospace, monospace; font-size: 12.5px; color: var(--gray-600); white-space: nowrap; }
.ptb-disc { margin-top: 18px; padding: 11px 13px; background: #fbf6e9; border: 1px solid #ecd9a0; border-radius: 8px; font-size: 12.5px; line-height: 1.6; color: #6b5a2e; }

@media (max-width: 760px) {
  .ptb-shell { flex-direction: column; }
  .ptb-aside { flex-basis: auto; max-width: none; width: 100%; }
  .ptb-list { max-height: 40vh; }
  .ptb-main { border-left: 0; border-top: 1px solid var(--border, #eee); padding-left: 0; padding-top: 14px; width: 100%; }
}
</style>
