<script setup lang="ts">
/**
 * NguonBrowser — THƯ MỤC NGUỒN THỐNG NHẤT (sổ cái trích dẫn).
 * 2 cột: danh sách (lọc Sách/Tác giả + tìm, sắp theo độ phổ biến) | chi tiết + TRA NGƯỢC
 *   (huyệt vị · vị thuốc · bài thuốc trích nguồn này). Link chéo theo ngữ cảnh (in-app ↔ public).
 * Quản trị (canEdit): Sửa · Gộp biến thể · Xoá · "Nghi trùng" (gợi ý gộp 1 chạm) — chống phình dữ liệu.
 * API: /nguon (@Public đọc) · PUT/DELETE/POST merge + suggest-duplicates (cần đăng nhập).
 */
import { ref, watch, onMounted } from 'vue'
import { api } from '@/services/api'
import { useDictLinks } from '@/lib/dictLinks'

const props = defineProps<{
  target?: { slug?: string; name?: string } | null
  huyetMap?: Record<number, { ten: string; code?: string }>
  canEdit?: boolean
}>()
const emit = defineEmits<{ (e: 'open-acu', id: number): void }>()
const links = useDictLinks()

interface Lite { id: number; slug: string; ten: string; loai: string; tac_gia?: string | null; nien_dai?: string | null; ref_count: number }
interface RefVi { id: number; ten: string; context: string }
interface RefBai { id: number; ten: string; slug: string; context: string }
interface RefSach { id: number; slug: string; ten: string }
interface Detail extends Lite {
  norm_key: string; ten_khac?: string | null; link?: string | null; ghi_chu?: string | null; mo_ta?: string | null
  huyetIds: number[]; viThuoc: RefVi[]; baiThuoc: RefBai[]; sachCungTacGia: RefSach[]
  counts: { huyet: number; vi_thuoc: number; bai_thuoc: number }
}

const q = ref('')
const loai = ref<'' | 'sach' | 'tac_gia'>('')
const page = ref(1)
const limit = 40
const items = ref<Lite[]>([])
const total = ref(0)
const loading = ref(true)
const selected = ref<Detail | null>(null)
const selectedId = ref<number | null>(null)
const loadingDetail = ref(false)
let debounce: ReturnType<typeof setTimeout> | null = null

const totalPages = () => Math.max(1, Math.ceil(total.value / limit))
const ctxLabel = (c: string) => (c === 'ten_khac' ? 'tên khác' : c === 'tac_gia' ? 'tác giả' : 'xuất xứ')

async function loadList(autoSelect = true) {
  loading.value = true
  try {
    const res = await api.get<{ data?: Lite[]; total?: number }>(
      `/nguon?page=${page.value}&limit=${limit}&q=${encodeURIComponent(q.value.trim())}&loai=${loai.value}`,
    )
    items.value = res?.data ?? []
    total.value = Number(res?.total ?? 0)
    const first = items.value[0]
    if (autoSelect && first && !items.value.some((b) => b.id === selectedId.value)) openDetail(first.slug)
  } catch { items.value = []; total.value = 0 } finally { loading.value = false }
}
async function openDetail(slug: string) {
  loadingDetail.value = true
  cancelEdit()
  mergeMode.value = false
  try {
    const d = await api.get<Detail>(`/nguon/${encodeURIComponent(slug)}`)
    selected.value = d
    selectedId.value = d?.id ?? null
  } catch { selected.value = null } finally { loadingDetail.value = false }
}
async function openByName(name: string) {
  try {
    const res = await api.get<{ data?: Lite[] }>(`/nguon?limit=5&q=${encodeURIComponent(name.trim())}`)
    const first = (res?.data ?? [])[0]
    if (first) { q.value = name.trim(); openDetail(first.slug) }
  } catch { /* bỏ qua */ }
}

watch(q, () => { if (debounce) clearTimeout(debounce); debounce = setTimeout(() => { page.value = 1; loadList() }, 300) })
watch(loai, () => { page.value = 1; loadList() })
watch(page, () => loadList())
watch(() => props.target, (t) => { if (t?.slug) openDetail(t.slug); else if (t?.name) openByName(t.name) }, { deep: true })
onMounted(() => {
  if (props.target?.slug) { loadList(false); openDetail(props.target.slug) }
  else if (props.target?.name) { loadList(false); openByName(props.target.name) }
  else loadList()
})

// ─────────── QUẢN TRỊ (canEdit) ───────────
const editing = ref(false)
const form = ref<Partial<Detail>>({})
const saving = ref(false)
function startEdit() {
  if (!selected.value) return
  const s = selected.value
  form.value = { ten: s.ten, loai: s.loai, tac_gia: s.tac_gia, nien_dai: s.nien_dai, link: s.link, ghi_chu: s.ghi_chu, mo_ta: s.mo_ta, ten_khac: s.ten_khac }
  editing.value = true
}
function cancelEdit() { editing.value = false }
async function saveEdit() {
  if (!selected.value) return
  saving.value = true
  try {
    await api.put(`/nguon/${selected.value.id}`, form.value)
    editing.value = false
    const wasSlug = selected.value.slug
    await loadList(false); await openDetail(wasSlug)
  } catch (e) { alert('Lưu lỗi: ' + (e instanceof Error ? e.message : e)) } finally { saving.value = false }
}
async function removeNguon() {
  if (!selected.value) return
  if (!confirm(`Xoá nguồn "${selected.value.ten}"? (chỉ xoá mục nguồn + các liên kết, không xoá huyệt/vị/bài)`)) return
  try { await api.delete(`/nguon/${selected.value.id}`); selected.value = null; selectedId.value = null; await loadList() }
  catch (e) { alert('Xoá lỗi: ' + (e instanceof Error ? e.message : e)) }
}

// Gộp: bật mergeMode → bấm 1 mục ở danh sách = gộp mục đang xem VÀO mục đó.
const mergeMode = ref(false)
async function doMerge(into: Lite) {
  const from = selected.value
  if (!from || from.id === into.id) return
  if (!confirm(`Gộp "${from.ten}" VÀO "${into.ten}"?\n(mọi liên kết dồn sang "${into.ten}", tên "${from.ten}" lưu thành biến thể, rồi xoá mục thừa)`)) return
  try {
    await api.post('/nguon/merge', { fromId: from.id, intoId: into.id })
    mergeMode.value = false
    await loadList(false); await openDetail(into.slug)
  } catch (e) { alert('Gộp lỗi: ' + (e instanceof Error ? e.message : e)) }
}

// Nghi trùng: gợi ý cặp biến thể để gộp.
const dups = ref<{ a_id: number; a_ten: string; a_slug: string; a_ref: number; b_id: number; b_ten: string; b_slug: string; b_ref: number }[]>([])
const dupOpen = ref(false)
const dupLoading = ref(false)
async function loadDups() {
  dupOpen.value = !dupOpen.value
  if (!dupOpen.value || dups.value.length) return
  dupLoading.value = true
  try {
    const res = await api.get<{ pairs?: typeof dups.value }>(`/nguon/suggest-duplicates?limit=120${loai.value ? '&loai=' + loai.value : ''}`)
    dups.value = res?.pairs ?? []
  } catch { dups.value = [] } finally { dupLoading.value = false }
}
async function mergeDup(p: typeof dups.value[number]) {
  // Giữ mục nhiều trích dẫn hơn làm "chuẩn".
  const keep = p.a_ref >= p.b_ref ? { id: p.a_id, ten: p.a_ten, slug: p.a_slug } : { id: p.b_id, ten: p.b_ten, slug: p.b_slug }
  const drop = p.a_ref >= p.b_ref ? { id: p.b_id, ten: p.b_ten } : { id: p.a_id, ten: p.a_ten }
  if (!confirm(`Gộp "${drop.ten}" → giữ "${keep.ten}"?`)) return
  try {
    await api.post('/nguon/merge', { fromId: drop.id, intoId: keep.id })
    dups.value = dups.value.filter((x) => x !== p)
    await loadList(false)
  } catch (e) { alert('Gộp lỗi: ' + (e instanceof Error ? e.message : e)) }
}

const huyetName = (id: number) => props.huyetMap?.[id]?.ten || ('#' + id)
const huyetCode = (id: number) => props.huyetMap?.[id]?.code || ''
</script>

<template>
  <div class="ngb-shell">
    <!-- DANH SÁCH -->
    <aside class="ngb-aside">
      <div class="ngb-filters">
        <button class="ngb-fbtn" :class="{ on: loai === '' }" @click="loai = ''">Tất cả</button>
        <button class="ngb-fbtn" :class="{ on: loai === 'sach' }" @click="loai = 'sach'">Sách / Y văn</button>
        <button class="ngb-fbtn" :class="{ on: loai === 'tac_gia' }" @click="loai = 'tac_gia'">Tác giả</button>
      </div>
      <input v-model="q" type="search" class="ngb-input" placeholder="Tìm nguồn / tác giả / biến thể…" />
      <p class="ngb-count">
        {{ total.toLocaleString('vi-VN') }} mục
        <button v-if="canEdit" class="ngb-duptoggle" @click="loadDups">⚠ Nghi trùng</button>
      </p>
      <p v-if="mergeMode" class="ngb-mergehint">Chọn mục để GỘP “{{ selected?.ten }}” vào · <button class="ngb-x" @click="mergeMode = false">huỷ</button></p>

      <!-- Bảng nghi trùng -->
      <div v-if="canEdit && dupOpen" class="ngb-dups">
        <p v-if="dupLoading" class="ngb-msg">Đang dò…</p>
        <p v-else-if="!dups.length" class="ngb-msg">Không thấy cặp nghi trùng.</p>
        <ul v-else>
          <li v-for="p in dups" :key="p.a_id + '-' + p.b_id" class="ngb-dup">
            <span class="ngb-dup-pair"><b>{{ p.a_ten }}</b> ({{ p.a_ref }}) ↔ <b>{{ p.b_ten }}</b> ({{ p.b_ref }})</span>
            <button class="ngb-dup-merge" @click="mergeDup(p)">Gộp</button>
          </li>
        </ul>
      </div>

      <div v-if="loading" class="ngb-msg">Đang tải…</div>
      <p v-else-if="!items.length" class="ngb-msg">Không có nguồn phù hợp.</p>
      <ul v-else class="ngb-list">
        <li v-for="b in items" :key="b.id">
          <button type="button" class="ngb-li" :class="{ active: b.id === selectedId, merge: mergeMode && b.id !== selectedId }"
            @click="mergeMode && b.id !== selectedId ? doMerge(b) : openDetail(b.slug)">
            <span class="ngb-li-name">{{ b.ten }}</span>
            <span class="ngb-li-meta">
              <span class="ngb-li-loai" :class="b.loai">{{ b.loai === 'tac_gia' ? 'Tác giả' : 'Sách' }}</span>
              <span class="ngb-li-ref">{{ b.ref_count }} trích</span>
            </span>
          </button>
        </li>
      </ul>
      <div v-if="totalPages() > 1" class="ngb-pager">
        <button class="ngb-pg" :disabled="page <= 1" @click="page--">‹</button>
        <span class="ngb-pg-info">{{ page }} / {{ totalPages().toLocaleString('vi-VN') }}</span>
        <button class="ngb-pg" :disabled="page >= totalPages()" @click="page++">›</button>
      </div>
    </aside>

    <!-- CHI TIẾT -->
    <div class="ngb-main">
      <div v-if="loadingDetail && !selected" class="ngb-msg">Đang tải…</div>
      <p v-else-if="!selected" class="ngb-welcome">Chọn một nguồn ở danh sách bên trái để xem chi tiết & nơi trích dẫn.</p>

      <!-- FORM SỬA -->
      <div v-else-if="editing" class="ngb-edit">
        <h3 class="ngb-edit-h">Sửa nguồn</h3>
        <label class="ngb-fld"><span>Tên</span><input v-model="form.ten" type="text" /></label>
        <label class="ngb-fld"><span>Loại</span>
          <select v-model="form.loai"><option value="sach">Sách / Y văn</option><option value="tac_gia">Tác giả</option></select>
        </label>
        <label class="ngb-fld"><span>Biến thể (cách nhau “ | ”)</span><input v-model="form.ten_khac" type="text" /></label>
        <label class="ngb-fld"><span>Tác giả</span><input v-model="form.tac_gia" type="text" /></label>
        <label class="ngb-fld"><span>Niên đại</span><input v-model="form.nien_dai" type="text" /></label>
        <label class="ngb-fld"><span>Link</span><input v-model="form.link" type="text" /></label>
        <label class="ngb-fld"><span>Ghi chú</span><textarea v-model="form.ghi_chu" rows="2" /></label>
        <label class="ngb-fld"><span>Mô tả</span><textarea v-model="form.mo_ta" rows="3" /></label>
        <div class="ngb-edit-actions">
          <button class="ngb-btn primary" :disabled="saving" @click="saveEdit">{{ saving ? 'Đang lưu…' : 'Lưu' }}</button>
          <button class="ngb-btn" @click="cancelEdit">Huỷ</button>
        </div>
      </div>

      <!-- CHI TIẾT -->
      <article v-else>
        <div class="ngb-d-head">
          <h2 class="ngb-d-title">{{ selected.ten }}</h2>
          <span class="ngb-d-loai" :class="selected.loai">{{ selected.loai === 'tac_gia' ? 'Tác giả' : 'Sách / Y văn' }}</span>
        </div>
        <div v-if="canEdit" class="ngb-admin">
          <button class="ngb-btn" @click="startEdit">Sửa</button>
          <button class="ngb-btn" @click="mergeMode = true">Gộp vào…</button>
          <button class="ngb-btn danger" @click="removeNguon">Xoá</button>
        </div>

        <dl class="ngb-meta">
          <div v-if="selected.tac_gia"><dt>Tác giả</dt><dd>{{ selected.tac_gia }}</dd></div>
          <div v-if="selected.nien_dai"><dt>Niên đại</dt><dd>{{ selected.nien_dai }}</dd></div>
          <div v-if="selected.ten_khac"><dt>Biến thể</dt><dd>{{ selected.ten_khac }}</dd></div>
          <div v-if="selected.link"><dt>Tham khảo</dt><dd><a :href="selected.link" target="_blank" rel="noopener">{{ selected.link }}</a></dd></div>
          <div v-if="selected.ghi_chu"><dt>Ghi chú</dt><dd>{{ selected.ghi_chu }}</dd></div>
          <div v-if="selected.mo_ta"><dt>Mô tả</dt><dd>{{ selected.mo_ta }}</dd></div>
        </dl>

        <!-- TRA NGƯỢC -->
        <section v-if="selected.huyetIds.length" class="ngb-ref">
          <h3 class="ngb-ref-h">Huyệt trích nguồn này <span class="ngb-n">({{ selected.counts.huyet }})</span></h3>
          <div class="ngb-chips">
            <button v-for="hid in selected.huyetIds" :key="'h' + hid" class="ngb-chip" @click="emit('open-acu', hid)">
              <b v-if="huyetCode(hid)">{{ huyetCode(hid) }}</b> {{ huyetName(hid) }}
            </button>
          </div>
        </section>

        <section v-if="selected.viThuoc.length" class="ngb-ref">
          <h3 class="ngb-ref-h">Vị thuốc trích nguồn này <span class="ngb-n">({{ selected.counts.vi_thuoc }})</span></h3>
          <div class="ngb-chips">
            <RouterLink v-for="v in selected.viThuoc" :key="'v' + v.id + v.context" :to="links.viThuoc(v.id)" class="ngb-chip link">
              {{ v.ten }}<span class="ngb-ctx">{{ ctxLabel(v.context) }}</span>
            </RouterLink>
          </div>
        </section>

        <section v-if="selected.baiThuoc.length" class="ngb-ref">
          <h3 class="ngb-ref-h">Bài thuốc trích nguồn này <span class="ngb-n">({{ selected.counts.bai_thuoc }})</span></h3>
          <div class="ngb-chips">
            <RouterLink v-for="b in selected.baiThuoc" :key="'b' + b.id + b.context" :to="links.baiThuoc(b.slug)" class="ngb-chip link">
              {{ b.ten }}<span class="ngb-ctx">{{ ctxLabel(b.context) }}</span>
            </RouterLink>
          </div>
        </section>

        <section v-if="selected.sachCungTacGia && selected.sachCungTacGia.length" class="ngb-ref">
          <h3 class="ngb-ref-h">Sách của tác giả này <span class="ngb-n">({{ selected.sachCungTacGia.length }})</span></h3>
          <div class="ngb-chips">
            <button v-for="s in selected.sachCungTacGia" :key="'s' + s.id" class="ngb-chip link" @click="openDetail(s.slug)">{{ s.ten }}</button>
          </div>
        </section>

        <p v-if="!selected.huyetIds.length && !selected.viThuoc.length && !selected.baiThuoc.length" class="ngb-msg">Chưa có nơi nào trích nguồn này.</p>
      </article>
    </div>
  </div>
</template>

<style scoped>
.ngb-shell { display: flex; gap: 16px; align-items: flex-start; }
.ngb-aside { flex: 0 0 320px; max-width: 320px; display: flex; flex-direction: column; }
.ngb-filters { display: flex; gap: 5px; margin-bottom: 9px; }
.ngb-fbtn { flex: 1; padding: 5px 6px; font-size: 12px; border: 1px solid var(--border, #e5e0d6); border-radius: 8px; background: #fff; cursor: pointer; color: var(--brown-700, #6b4f2a); }
.ngb-fbtn.on { background: var(--brown-700, #6b4f2a); color: #fff; border-color: var(--brown-700, #6b4f2a); }
.ngb-input { width: 100%; padding: 8px 12px; font-size: 13.5px; border: 1px solid var(--border, #e5e0d6); border-radius: 9px; }
.ngb-count { display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; color: var(--text-muted); margin: 8px 0; }
.ngb-duptoggle { border: 1px solid #e3c98a; background: #fbf3df; color: #8a6a1e; border-radius: 7px; padding: 2px 8px; font-size: 11.5px; cursor: pointer; }
.ngb-mergehint { font-size: 12px; color: #9a5a1a; background: #fff3e2; border: 1px solid #f0cd95; border-radius: 7px; padding: 5px 8px; margin: 0 0 8px; }
.ngb-x { background: none; border: 0; color: #b04a2a; text-decoration: underline; cursor: pointer; font-size: 12px; }
.ngb-dups { max-height: 200px; overflow-y: auto; border: 1px solid #ecd9a0; border-radius: 8px; padding: 6px; margin-bottom: 8px; background: #fffdf6; }
.ngb-dups ul { list-style: none; margin: 0; padding: 0; }
.ngb-dup { display: flex; align-items: center; gap: 6px; padding: 4px 2px; font-size: 11.5px; border-bottom: 1px dashed #eee; }
.ngb-dup-pair { flex: 1; line-height: 1.4; }
.ngb-dup-merge { border: 1px solid var(--brown-400, #b9935a); background: #fff; color: var(--brown-700, #6b4f2a); border-radius: 6px; padding: 2px 9px; cursor: pointer; font-size: 11.5px; }
.ngb-msg, .ngb-welcome { padding: var(--space-6); color: var(--text-muted); text-align: center; }
.ngb-list { list-style: none; margin: 0; padding: 0; max-height: 60vh; overflow-y: auto; display: flex; flex-direction: column; gap: 3px; }
.ngb-li { display: block; width: 100%; text-align: left; padding: 7px 10px; border: 1px solid transparent; border-radius: 9px; background: none; cursor: pointer; }
.ngb-li:hover { background: var(--brown-50, #f7f3ec); }
.ngb-li.active { background: var(--brown-100, #efe4d3); border-color: var(--brown-300, #d8c0a0); }
.ngb-li.merge:hover { background: #fff0df; border-color: #f0cd95; }
.ngb-li-name { display: block; font-size: 13.5px; font-weight: 600; color: var(--brown-800, #5b3a1a); }
.ngb-li-meta { display: flex; gap: 8px; align-items: center; margin-top: 2px; }
.ngb-li-loai { font-size: 10.5px; padding: 0 6px; border-radius: 8px; background: #eef2e6; color: #5a6a3a; }
.ngb-li-loai.tac_gia { background: #efe6f2; color: #6a3a6a; }
.ngb-li-ref { font-size: 11px; color: var(--gray-500); }
.ngb-pager { display: flex; align-items: center; justify-content: center; gap: 12px; padding-top: 10px; margin-top: 6px; border-top: 1px solid var(--border, #eee); }
.ngb-pg { padding: 4px 12px; border-radius: 8px; border: 1px solid var(--border, #e5e0d6); background: #fff; cursor: pointer; font-size: 14px; }
.ngb-pg:disabled { opacity: 0.4; cursor: default; }
.ngb-pg-info { font-size: 12.5px; color: var(--text-muted); }

.ngb-main { flex: 1; min-width: 0; border-left: 1px solid var(--border, #eee); padding-left: 18px; }
.ngb-d-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.ngb-d-title { font-size: 22px; font-weight: 800; color: var(--text-brand, #5b3a1a); margin: 0; }
.ngb-d-loai { font-size: 11.5px; padding: 2px 10px; border-radius: 999px; background: #eef2e6; color: #5a6a3a; }
.ngb-d-loai.tac_gia { background: #efe6f2; color: #6a3a6a; }
.ngb-admin { display: flex; gap: 8px; margin: 12px 0; }
.ngb-btn { padding: 5px 13px; border: 1px solid var(--border, #e5e0d6); border-radius: 8px; background: #fff; cursor: pointer; font-size: 13px; color: var(--brown-700, #6b4f2a); }
.ngb-btn:hover { background: var(--brown-50, #f7f3ec); }
.ngb-btn.primary { background: var(--brown-700, #6b4f2a); color: #fff; border-color: var(--brown-700, #6b4f2a); }
.ngb-btn.danger { color: #b0402a; border-color: #e8b9ac; }
.ngb-meta { margin: 14px 0; display: grid; gap: 7px; }
.ngb-meta > div { display: flex; gap: 12px; align-items: baseline; }
.ngb-meta dt { flex: 0 0 84px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--gray-500); }
.ngb-meta dd { margin: 0; font-size: 14px; color: var(--text); line-height: 1.5; }
.ngb-meta dd a { color: var(--brown-700, #8a5a1a); word-break: break-all; }
.ngb-ref { margin-top: 16px; }
.ngb-ref-h { font-size: 14px; font-weight: 700; color: var(--brown-800, #5b3a1a); margin: 0 0 8px; }
.ngb-n { font-size: 12.5px; font-weight: 500; color: var(--text-muted); }
.ngb-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ngb-chip { display: inline-flex; align-items: baseline; gap: 5px; padding: 4px 11px; border-radius: 14px; font-size: 13px; border: 1px solid var(--border, #e5e0d6); background: #faf8f3; color: var(--brown-800, #5b3a1a); cursor: pointer; text-decoration: none; }
.ngb-chip.link:hover { background: var(--brown-600, #8a6d3b); color: #fff; border-color: var(--brown-600, #8a6d3b); }
.ngb-chip b { font-family: ui-monospace, monospace; font-size: 11px; color: var(--brown-600, #7a5a30); }
.ngb-chip.link:hover b { color: #fff; }
.ngb-ctx { font-size: 10.5px; color: var(--gray-500); }
.ngb-chip.link:hover .ngb-ctx { color: rgba(255,255,255,.8); }
.ngb-edit { max-width: 540px; }
.ngb-edit-h { font-size: 17px; font-weight: 800; color: var(--brown-800, #5b3a1a); margin: 0 0 14px; }
.ngb-fld { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.ngb-fld span { font-size: 12px; font-weight: 700; color: var(--gray-600); }
.ngb-fld input, .ngb-fld select, .ngb-fld textarea { padding: 7px 11px; border: 1px solid var(--border, #e5e0d6); border-radius: 8px; font-size: 14px; font-family: inherit; }
.ngb-edit-actions { display: flex; gap: 8px; margin-top: 6px; }

@media (max-width: 760px) {
  .ngb-shell { flex-direction: column; }
  .ngb-aside { flex-basis: auto; max-width: none; width: 100%; }
  .ngb-list { max-height: 38vh; }
  .ngb-main { border-left: 0; border-top: 1px solid var(--border, #eee); padding-left: 0; padding-top: 14px; width: 100%; }
}
</style>
