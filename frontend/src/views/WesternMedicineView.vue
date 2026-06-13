<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api'

const route = useRoute()
const router = useRouter()
const highlightBtyId = ref<number | null>(null)

function phapTriHref(id: number): string {
  return router.resolve({ name: 'treatments', query: { ptId: id } }).href
}

function baiThuocHref(id: number): string {
  return router.resolve({
    name: 'medicines',
    query: { tab: 'bai-thuoc', btId: id },
  }).href
}

interface ChungBenh {
  id: number
  ten_chung_benh: string
  benhTayYList?: { id: number }[]
}

interface PhapTriLite {
  id: number
  chung_trang: string | null
  nguyen_tac: string | null
  trieu_chung_list?: TrieuChungLite[] | null
}

interface BaiThuocPhapTriLink {
  idPhapTri: number
  phapTri?: PhapTriLite | null
}

interface BaiThuocLite {
  id: number
  ten_bai_thuoc: string
  nguon_goc?: string | null
  the_benh?: string | null
  phapTriLinks?: BaiThuocPhapTriLink[]
}

interface TrieuChungLite {
  id: number
  ten_trieu_chung: string
}

interface ThietChanLite {
  id: number
  ten_thiet_chan: string
}

interface MachChanLite {
  id: number
  ten_mach_chan: string
}

interface BenhTayY {
  id: number
  ten_benh: string
  idChungBenh: number
  chungBenh: ChungBenh | null
  baiThuocList?: BaiThuocLite[]
  phapTriList?: PhapTriLite[]
  trieuChungList?: TrieuChungLite[]
  thietChanList?: ThietChanLite[]
  machChanList?: MachChanLite[]
}

type TabKey = 'chung-benh' | 'benh-tay-y'

const activeTab = ref<TabKey>('benh-tay-y')
const isLoading = ref(true)
const error = ref<string | null>(null)
const isSubmitting = ref(false)

const chungBenhList = ref<ChungBenh[]>([])
const benhTayYList = ref<BenhTayY[]>([])
const benhTayYTotal = ref(0)
const benhTayYCountsByChungBenh = ref<Record<number, number>>({})
const baiThuocOptions = ref<BaiThuocLite[]>([])
const trieuChungOptions = ref<TrieuChungLite[]>([])
const thietChanOptions = ref<ThietChanLite[]>([])
const machChanOptions = ref<MachChanLite[]>([])
const phapTriOptions = ref<PhapTriLite[]>([])
const btyPageLoading = ref(false)
const formLoading = ref(false)
const formOptionsLoaded = ref(false)

const cbSearch = ref('')
const btySearch = ref('')

const cbPage = ref(1)
const btyPage = ref(1)
const pageSize = 12

// Trong tab "Bệnh Tây Y", lọc thêm theo chủng bệnh (null = tất cả chủng)
const selectedBtyChungBenhId = ref<number | null>(null)

// Modal state
const showCbModal = ref(false)
const editingCb = ref<ChungBenh | null>(null)
const cbForm = ref({ ten_chung_benh: '' })
const cbFormError = ref<string | null>(null)

const showBtyModal = ref(false)
const editingBty = ref<BenhTayY | null>(null)
const btyFormError = ref<string | null>(null)
const btyForm = ref({
  ten_benh: '',
  id_chung_benh: null as number | null,
  bai_thuoc_ids: [] as number[],
  trieu_chung_ids: [] as number[],
  thiet_chan_ids: [] as number[],
  mach_chan_ids: [] as number[],
  phap_tri_ids: [] as number[],
})
const baiThuocSearch = ref('')
const trieuChungSearch = ref('')
const phapTriSearch = ref('')
const thietChanSearch = ref('')
const machChanSearch = ref('')
const creatingTrieuChung = ref(false)

const showDeleteConfirm = ref(false)
const deletingTarget = ref<{ kind: 'cb' | 'bty'; id: number; label: string } | null>(null)

onMounted(async () => {
  const qTab = route.query.tab
  if (qTab === 'benh-tay-y' || qTab === 'chung-benh') {
    activeTab.value = qTab
  }
  await fetchAll()
  const rawBtyId = route.query.btyId
  const targetId = Array.isArray(rawBtyId) ? rawBtyId[0] : rawBtyId
  const btyId = targetId != null ? Number(targetId) : NaN
  if (Number.isFinite(btyId)) {
    activeTab.value = 'benh-tay-y'
    btySearch.value = ''
    selectedBtyChungBenhId.value = null
    highlightBtyId.value = btyId
    // Nạp đúng trang chứa bệnh cần focus (danh sách phân trang phía server).
    await loadBenhTayYPage(btyId)
    await nextTick()
    const el = document.querySelector(`[data-bty-id="${btyId}"]`) as HTMLElement | null
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => {
      if (highlightBtyId.value === btyId) highlightBtyId.value = null
    }, 2500)
  }
})

watch(cbSearch, () => (cbPage.value = 1))

let btySearchTimer: ReturnType<typeof setTimeout> | null = null
watch(btySearch, () => {
  if (btySearchTimer) clearTimeout(btySearchTimer)
  btySearchTimer = setTimeout(() => {
    btyPage.value = 1
    void loadBenhTayYPage()
  }, 2000)
})
watch(selectedBtyChungBenhId, () => {
  btyPage.value = 1
  void loadBenhTayYPage()
})
watch(btyPage, () => { void loadBenhTayYPage() })
watch(activeTab, (val) => {
  cbSearch.value = ''
  btySearch.value = ''
  selectedBtyChungBenhId.value = null
  if (val === 'benh-tay-y') void loadBenhTayYPage()
})

function buildQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue
    const s = String(v)
    if (!s) continue
    sp.append(k, s)
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

async function loadBenhTayYPage(focusId?: number | null) {
  btyPageLoading.value = true
  try {
    const qs = buildQuery({
      page: btyPage.value,
      limit: pageSize,
      q: btySearch.value.trim(),
      idChungBenh: selectedBtyChungBenhId.value,
      focusId: focusId ?? null,
    })
    const res: any = await api.get(`/benh-tay-y/lite${qs}`)
    benhTayYList.value = res?.data ?? []
    benhTayYTotal.value = Number(res?.total ?? 0)
    benhTayYCountsByChungBenh.value = res?.countsByChungBenh ?? {}
    // Server có thể trả về trang khác (trang chứa focusId) — đồng bộ lại UI phân trang.
    if (res?.page != null) btyPage.value = Number(res.page)
  } finally {
    btyPageLoading.value = false
  }
}

/** Lazy load các option cho modal Bệnh Tây Y (chỉ khi mở modal). */
async function ensureFormOptions() {
  if (formOptionsLoaded.value) return
  const [bt, tc, ttc, mc, pt] = await Promise.all([
    api.get<any>('/bai-thuoc/options'),
    api.get<any>('/trieu-chung'),
    api.get<any>('/thiet-chan'),
    api.get<any>('/mach-chan'),
    api.get<any>('/phap-tri/options'),
  ])
  baiThuocOptions.value = unwrap<BaiThuocLite>(bt)
  trieuChungOptions.value = unwrap<TrieuChungLite>(tc)
  thietChanOptions.value = unwrap<ThietChanLite>(ttc)
  machChanOptions.value = unwrap<MachChanLite>(mc)
  phapTriOptions.value = unwrap<PhapTriLite>(pt)
  formOptionsLoaded.value = true
}

async function fetchAll() {
  isLoading.value = true
  error.value = null
  try {
    const cb = await api.get<any>('/chung-benh')
    chungBenhList.value = unwrap<ChungBenh>(cb)
    await loadBenhTayYPage()
  } catch (err: any) {
    console.error(err)
    error.value = 'Lỗi khi tải dữ liệu: ' + (err.message || String(err))
  } finally {
    isLoading.value = false
  }
}

function unwrap<T>(res: any): T[] {
  if (Array.isArray(res)) return res as T[]
  if (Array.isArray(res?.data)) return res.data as T[]
  return []
}

function toggleId(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

function phapTriLabel(p: PhapTriLite): string {
  return (p.nguyen_tac || p.chung_trang || `#${p.id}`).trim()
}

const chungBenhMap = computed(() => {
  const m = new Map<number, ChungBenh>()
  for (const cb of chungBenhList.value) m.set(cb.id, cb)
  return m
})

function theBenhCombined(bty: BenhTayY): string[] {
  return theBenhCombinedItems(bty).map((x) => x.name)
}

function theBenhCombinedItems(bty: BenhTayY): Array<{ name: string; ptId: number | null }> {
  const seen = new Map<string, { name: string; ptId: number | null }>()
  const pushAll = (raw: string | null | undefined, ptId: number | null) => {
    if (!raw) return
    for (const part of raw.split(/[,;]+/)) {
      const t = part.trim()
      if (!t) continue
      const key = t.toLowerCase()
      const existing = seen.get(key)
      if (existing) {
        if (existing.ptId == null && ptId != null) existing.ptId = ptId
        continue
      }
      seen.set(key, { name: t, ptId })
    }
  }
  for (const p of bty.phapTriList ?? []) pushAll(p.chung_trang, p.id)
  for (const b of bty.baiThuocList ?? []) {
    pushAll(b.the_benh, null)
    for (const l of b.phapTriLinks ?? []) pushAll(l.phapTri?.chung_trang, l.phapTri?.id ?? null)
  }
  return Array.from(seen.values())
}

function phapTriCombined(bty: BenhTayY): PhapTriLite[] {
  const seen = new Set<number>()
  const out: PhapTriLite[] = []
  for (const p of bty.phapTriList ?? []) {
    if (seen.has(p.id)) continue
    seen.add(p.id)
    out.push(p)
  }
  for (const b of bty.baiThuocList ?? []) {
    for (const l of b.phapTriLinks ?? []) {
      if (!l.phapTri || seen.has(l.phapTri.id)) continue
      seen.add(l.phapTri.id)
      out.push(l.phapTri)
    }
  }
  return out
}

/** Triệu chứng của một pháp trị — hiển thị lồng ngay dưới pháp trị (giống tab bài thuốc). */
function phapTriTrieuChungList(p: PhapTriLite): string[] {
  return (p.trieu_chung_list ?? [])
    .map((t) => (t.ten_trieu_chung ?? '').trim())
    .filter(Boolean)
}

/** Counts theo chủng bệnh dùng map từ server response. */
const benhTayYCountByChungBenh = computed(() => {
  const m = new Map<number, number>()
  for (const [id, cnt] of Object.entries(benhTayYCountsByChungBenh.value)) {
    m.set(Number(id), Number(cnt))
  }
  return m
})

interface BtyChungBenhFilterOption {
  id: number
  name: string
  count: number
}

/** Chủng bệnh có ít nhất 1 bệnh Tây Y — dùng làm tab nhỏ lọc trong tab "Bệnh Tây Y". */
const btyChungBenhFilterOptions = computed<BtyChungBenhFilterOption[]>(() => {
  const counter = benhTayYCountByChungBenh.value
  const out: BtyChungBenhFilterOption[] = []
  for (const cb of chungBenhList.value) {
    const c = counter.get(cb.id) ?? 0
    if (c === 0) continue
    out.push({ id: cb.id, name: cb.ten_chung_benh, count: c })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
})

const filteredCbList = computed(() => {
  const q = cbSearch.value.trim().toLowerCase()
  if (!q) return chungBenhList.value
  return chungBenhList.value.filter((cb) => cb.ten_chung_benh.toLowerCase().includes(q))
})

const pagedCbList = computed(() => {
  const start = (cbPage.value - 1) * pageSize
  return filteredCbList.value.slice(start, start + pageSize)
})

const cbTotalPages = computed(() =>
  Math.max(1, Math.ceil(filteredCbList.value.length / pageSize)),
)

/** Server đã filter & paginate. */
const filteredBtyList = computed(() => benhTayYList.value)
const pagedBtyList = computed(() => benhTayYList.value)
const btyTotalPages = computed(() => Math.max(1, Math.ceil(benhTayYTotal.value / pageSize)))

function pageNumbers(current: number, total: number): number[] {
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  const arr: number[] = []
  for (let i = start; i <= end; i++) arr.push(i)
  return arr
}

const filteredBaiThuocOptions = computed(() => {
  const q = baiThuocSearch.value.trim().toLowerCase()
  if (!q) return baiThuocOptions.value
  return baiThuocOptions.value.filter((b) => b.ten_bai_thuoc.toLowerCase().includes(q))
})
const filteredTrieuChungOptions = computed(() => {
  const q = trieuChungSearch.value.trim().toLowerCase()
  if (!q) return trieuChungOptions.value
  return trieuChungOptions.value.filter((t) => t.ten_trieu_chung.toLowerCase().includes(q))
})
/** Cho phép tạo nhanh triệu chứng khi từ khóa tìm chưa khớp tên nào (so khớp không phân biệt hoa thường). */
const canCreateTrieuChung = computed(() => {
  const q = trieuChungSearch.value.trim()
  if (!q) return false
  return !trieuChungOptions.value.some(
    (t) => t.ten_trieu_chung.trim().toLowerCase() === q.toLowerCase(),
  )
})
const filteredPhapTriOptions = computed(() => {
  const q = phapTriSearch.value.trim().toLowerCase()
  if (!q) return phapTriOptions.value
  return phapTriOptions.value.filter((p) => phapTriLabel(p).toLowerCase().includes(q))
})
const filteredThietChanOptions = computed(() => {
  const q = thietChanSearch.value.trim().toLowerCase()
  if (!q) return thietChanOptions.value
  return thietChanOptions.value.filter((t) => t.ten_thiet_chan.toLowerCase().includes(q))
})
const filteredMachChanOptions = computed(() => {
  const q = machChanSearch.value.trim().toLowerCase()
  if (!q) return machChanOptions.value
  return machChanOptions.value.filter((m) => m.ten_mach_chan.toLowerCase().includes(q))
})

function openCreateCb() {
  editingCb.value = null
  cbForm.value = { ten_chung_benh: '' }
  cbFormError.value = null
  showCbModal.value = true
}

function openEditCb(cb: ChungBenh) {
  editingCb.value = cb
  cbForm.value = { ten_chung_benh: cb.ten_chung_benh }
  cbFormError.value = null
  showCbModal.value = true
}

async function submitCb() {
  if (isSubmitting.value) return
  const name = cbForm.value.ten_chung_benh.trim()
  if (!name) {
    cbFormError.value = 'Tên chủng bệnh không được trống'
    return
  }
  isSubmitting.value = true
  try {
    if (editingCb.value) {
      await api.put(`/chung-benh/${editingCb.value.id}`, { ten_chung_benh: name })
    } else {
      await api.post('/chung-benh', { ten_chung_benh: name })
    }
    const cbRes: any = await api.get<any>('/chung-benh')
    chungBenhList.value = unwrap<ChungBenh>(cbRes)
    showCbModal.value = false
  } catch (err: any) {
    cbFormError.value = err.message || 'Không lưu được dữ liệu'
  } finally {
    isSubmitting.value = false
  }
}

async function openCreateBty() {
  showBtyModal.value = true
  formLoading.value = true
  try {
    await ensureFormOptions()
  } finally {
    formLoading.value = false
  }
  editingBty.value = null
  btyForm.value = {
    ten_benh: '',
    id_chung_benh: null,
    bai_thuoc_ids: [],
    trieu_chung_ids: [],
    thiet_chan_ids: [],
    mach_chan_ids: [],
    phap_tri_ids: [],
  }
  btyFormError.value = null
  resetPickerSearches()
}

async function openEditBty(bty: BenhTayY) {
  showBtyModal.value = true
  formLoading.value = true
  try {
    await ensureFormOptions()
  } finally {
    formLoading.value = false
  }
  editingBty.value = bty
  btyForm.value = {
    ten_benh: bty.ten_benh,
    id_chung_benh: bty.idChungBenh ?? null,
    bai_thuoc_ids: (bty.baiThuocList ?? []).map((b) => b.id),
    trieu_chung_ids: (bty.trieuChungList ?? []).map((t) => t.id),
    thiet_chan_ids: (bty.thietChanList ?? []).map((t) => t.id),
    mach_chan_ids: (bty.machChanList ?? []).map((m) => m.id),
    phap_tri_ids: (bty.phapTriList ?? []).map((p) => p.id),
  }
  btyFormError.value = null
  resetPickerSearches()
}

function resetPickerSearches() {
  baiThuocSearch.value = ''
  trieuChungSearch.value = ''
  phapTriSearch.value = ''
  thietChanSearch.value = ''
  machChanSearch.value = ''
}

/** Tạo ngay một triệu chứng mới từ ô tìm kiếm rồi tự chọn vào form. */
async function createTrieuChungInline() {
  const name = trieuChungSearch.value.trim()
  if (!name || creatingTrieuChung.value) return
  creatingTrieuChung.value = true
  try {
    const res: any = await api.post('/trieu-chung', { ten_trieu_chung: name })
    const created: TrieuChungLite = res?.data ?? { id: res?.id, ten_trieu_chung: name }
    if (created?.id != null) {
      trieuChungOptions.value = [...trieuChungOptions.value, created]
      if (!btyForm.value.trieu_chung_ids.includes(created.id)) {
        btyForm.value.trieu_chung_ids = [...btyForm.value.trieu_chung_ids, created.id]
      }
      trieuChungSearch.value = ''
    }
  } catch (err: any) {
    btyFormError.value = err.message || 'Không tạo được triệu chứng'
  } finally {
    creatingTrieuChung.value = false
  }
}

async function submitBty() {
  if (isSubmitting.value) return
  const name = btyForm.value.ten_benh.trim()
  if (!name) {
    btyFormError.value = 'Tên bệnh không được trống'
    return
  }
  if (btyForm.value.id_chung_benh == null) {
    btyFormError.value = 'Vui lòng chọn chủng bệnh'
    return
  }
  const payload = {
    ten_benh: name,
    id_chung_benh: btyForm.value.id_chung_benh,
    bai_thuoc_ids: btyForm.value.bai_thuoc_ids,
    trieu_chung_ids: btyForm.value.trieu_chung_ids,
    thiet_chan_ids: btyForm.value.thiet_chan_ids,
    mach_chan_ids: btyForm.value.mach_chan_ids,
    phap_tri_ids: btyForm.value.phap_tri_ids,
  }
  isSubmitting.value = true
  try {
    if (editingBty.value) {
      await api.put(`/benh-tay-y/${editingBty.value.id}`, payload)
    } else {
      await api.post('/benh-tay-y', payload)
    }
    await loadBenhTayYPage()
    showBtyModal.value = false
  } catch (err: any) {
    btyFormError.value = err.message || 'Không lưu được dữ liệu'
  } finally {
    isSubmitting.value = false
  }
}

function confirmDeleteCb(cb: ChungBenh) {
  deletingTarget.value = { kind: 'cb', id: cb.id, label: cb.ten_chung_benh }
  showDeleteConfirm.value = true
}

function confirmDeleteBty(bty: BenhTayY) {
  deletingTarget.value = { kind: 'bty', id: bty.id, label: bty.ten_benh }
  showDeleteConfirm.value = true
}

async function doDelete() {
  if (!deletingTarget.value || isSubmitting.value) return
  const t = deletingTarget.value
  isSubmitting.value = true
  try {
    if (t.kind === 'cb') {
      await api.delete(`/chung-benh/${t.id}`)
    } else {
      await api.delete(`/benh-tay-y/${t.id}`)
    }
    showDeleteConfirm.value = false
    deletingTarget.value = null
    if (t.kind === 'cb') {
      const cbRes: any = await api.get<any>('/chung-benh')
      chungBenhList.value = unwrap<ChungBenh>(cbRes)
    } else {
      await loadBenhTayYPage()
    }
  } catch (err: any) {
    error.value = err.message || 'Không xóa được bản ghi'
    showDeleteConfirm.value = false
    deletingTarget.value = null
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="western-medicine-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Quản Lý Bệnh Tây Y</h1>
        <p class="page-subtitle">Phân loại chủng bệnh và bệnh lý Tây Y</p>
      </div>
      <div class="view-toggle">
        <button class="toggle-btn" :class="{ active: activeTab === 'benh-tay-y' }" @click="activeTab = 'benh-tay-y'">
          Bệnh Tây Y
        </button>
        <button class="toggle-btn" :class="{ active: activeTab === 'chung-benh' }" @click="activeTab = 'chung-benh'">
          Chủng Bệnh
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải dữ liệu...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary mt-4" @click="fetchAll">Thử lại</button>
    </div>

    <div v-else class="content-body">
      <!-- TAB CHỦNG BỆNH -->
      <div v-if="activeTab === 'chung-benh'" class="tab-content">
        <div class="toolbar">
          <label class="search-wrap">
            <span class="search-label">Tìm kiếm</span>
            <input
              v-model="cbSearch"
              type="search"
              class="search-input"
              placeholder="Tìm theo tên chủng bệnh..."
              autocomplete="off"
            />
          </label>
          <span class="toolbar-count">{{ filteredCbList.length }} / {{ chungBenhList.length }} chủng bệnh</span>
          <button class="btn-primary" @click="openCreateCb">+ Thêm chủng bệnh</button>
        </div>

        <div class="data-card">
          <div class="card-header">
            <h3>Danh Sách Chủng Bệnh</h3>
            <span class="badge badge-info">{{ chungBenhList.length }} bản ghi</span>
          </div>

          <div v-if="pagedCbList.length === 0" class="empty-state">
            {{ cbSearch.trim() ? 'Không khớp bản ghi nào' : 'Chưa có dữ liệu' }}
          </div>

          <div v-else class="disease-grid disease-grid--sm">
            <article v-for="cb in pagedCbList" :key="cb.id" class="disease-card">
              <header class="disease-card__head">
                <div class="disease-card__title">
                  <span class="disease-card__id">#{{ cb.id }}</span>
                  <h4 class="disease-card__name">{{ cb.ten_chung_benh }}</h4>
                </div>
                <div class="row-actions">
                  <button class="btn-action btn-edit" @click="openEditCb(cb)">Sửa</button>
                  <button class="btn-action btn-delete" @click="confirmDeleteCb(cb)">Xóa</button>
                </div>
              </header>
              <div class="disease-card__body">
                <section class="disease-section">
                  <span class="disease-section__label">Số bệnh Tây Y</span>
                  <span class="cell-tag">{{ benhTayYCountByChungBenh.get(cb.id) ?? 0 }} bệnh</span>
                </section>
              </div>
            </article>
          </div>

          <div v-if="cbTotalPages > 1" class="pagination">
            <button class="page-btn" :disabled="cbPage <= 1" @click="cbPage--">‹</button>
            <button
              v-for="pn in pageNumbers(cbPage, cbTotalPages)"
              :key="pn"
              class="page-btn"
              :class="{ active: pn === cbPage }"
              @click="cbPage = pn"
            >
              {{ pn }}
            </button>
            <button class="page-btn" :disabled="cbPage >= cbTotalPages" @click="cbPage++">›</button>
            <span class="page-info">Trang {{ cbPage }} / {{ cbTotalPages }}</span>
          </div>
        </div>
      </div>

      <!-- TAB BỆNH TÂY Y -->
      <div v-else class="tab-content">
        <div class="toolbar">
          <label class="search-wrap">
            <span class="search-label">Tìm kiếm</span>
            <input
              v-model="btySearch"
              type="search"
              class="search-input"
              placeholder="Tìm theo tên bệnh, chủng bệnh, bài thuốc, pháp trị, triệu chứng..."
              autocomplete="off"
            />
          </label>
          <span class="toolbar-count">{{ filteredBtyList.length }} / {{ benhTayYList.length }} bệnh</span>
          <button class="btn-primary" @click="openCreateBty">+ Thêm bệnh Tây Y</button>
        </div>

        <div
          v-if="btyChungBenhFilterOptions.length"
          class="sub-sub-tabs"
          role="tablist"
          aria-label="Lọc theo chủng bệnh"
        >
          <button
            type="button"
            role="tab"
            class="sub-sub-tab"
            :class="{ active: selectedBtyChungBenhId === null }"
            :aria-selected="selectedBtyChungBenhId === null"
            @click="selectedBtyChungBenhId = null"
          >
            Tất Cả
            <span class="sub-sub-tab__count">{{ benhTayYList.length }}</span>
          </button>
          <button
            v-for="cb in btyChungBenhFilterOptions"
            :key="cb.id"
            type="button"
            role="tab"
            class="sub-sub-tab"
            :class="{ active: selectedBtyChungBenhId === cb.id }"
            :aria-selected="selectedBtyChungBenhId === cb.id"
            @click="selectedBtyChungBenhId = cb.id"
          >
            {{ cb.name }}
            <span class="sub-sub-tab__count">{{ cb.count }}</span>
          </button>
        </div>

        <div class="data-card" :class="{ 'data-card--loading': btyPageLoading }">
          <div v-if="btyPageLoading" class="loading-bar" aria-hidden="true"></div>
          <div class="card-header">
            <h3>Danh Sách Bệnh Tây Y</h3>
            <span class="badge badge-success">{{ benhTayYTotal }} bản ghi</span>
          </div>

          <div v-if="pagedBtyList.length === 0" class="empty-state">
            {{ btySearch.trim() ? 'Không khớp bản ghi nào' : 'Chưa có dữ liệu' }}
          </div>

          <div v-else class="disease-grid">
            <article
              v-for="bty in pagedBtyList"
              :key="bty.id"
              :data-bty-id="bty.id"
              class="disease-card"
              :class="{ 'disease-card--highlight': bty.id === highlightBtyId }"
            >
              <header class="disease-card__head">
                <div class="disease-card__title">
                  <span class="disease-card__id">#{{ bty.id }}</span>
                  <h4 class="disease-card__name">{{ bty.ten_benh }}</h4>
                  <span
                    v-if="bty.chungBenh || chungBenhMap.get(bty.idChungBenh)"
                    class="chip chip-chungbenh"
                  >
                    {{ bty.chungBenh?.ten_chung_benh || chungBenhMap.get(bty.idChungBenh)?.ten_chung_benh }}
                  </span>
                </div>
                <div class="row-actions">
                  <button class="btn-action btn-edit" @click="openEditBty(bty)">Sửa</button>
                  <button class="btn-action btn-delete" @click="confirmDeleteBty(bty)">Xóa</button>
                </div>
              </header>

              <div class="disease-card__body">
                <section v-if="bty.baiThuocList?.length" class="disease-section">
                  <span class="disease-section__label">Bài thuốc ({{ bty.baiThuocList.length }})</span>
                  <div class="chip-row chip-row--wrap">
                    <a
                      v-for="b in bty.baiThuocList"
                      :key="b.id"
                      :href="baiThuocHref(b.id)"
                      target="_blank"
                      rel="noopener"
                      class="chip chip-bai chip-link-bai"
                      :title="`Mở bài thuốc: ${b.ten_bai_thuoc}`"
                    >
                      {{ b.ten_bai_thuoc }}
                    </a>
                  </div>
                </section>

                <section v-if="theBenhCombinedItems(bty).length" class="disease-section">
                  <span class="disease-section__label">Thể bệnh ({{ theBenhCombinedItems(bty).length }})</span>
                  <div class="chip-row chip-row--wrap">
                    <template v-for="(tb, i) in theBenhCombinedItems(bty)" :key="'tb-' + i">
                      <a
                        v-if="tb.ptId != null"
                        :href="phapTriHref(tb.ptId)"
                        target="_blank"
                        rel="noopener"
                        class="chip chip-the chip-link-the"
                        :title="`Mở pháp trị: ${tb.name}`"
                      >{{ tb.name }}</a>
                      <span v-else class="chip chip-the">{{ tb.name }}</span>
                    </template>
                  </div>
                </section>

                <section v-if="phapTriCombined(bty).length" class="disease-section">
                  <span class="disease-section__label">Pháp trị ({{ phapTriCombined(bty).length }})</span>
                  <div class="phap-tri-list">
                    <div v-for="p in phapTriCombined(bty)" :key="p.id" class="phap-tri-item">
                      <a
                        :href="phapTriHref(p.id)"
                        target="_blank"
                        rel="noopener"
                        class="chip chip-phap chip-link-phap"
                        :title="`Mở pháp trị: ${phapTriLabel(p)}`"
                      >{{ phapTriLabel(p) }}</a>
                      <div v-if="phapTriTrieuChungList(p).length" class="phap-tri-trieu">
                        <span class="phap-tri-trieu__label">Triệu chứng</span>
                        <div class="chip-row chip-row--wrap">
                          <span
                            v-for="(t, j) in phapTriTrieuChungList(p)"
                            :key="j"
                            class="chip chip-trieu-pt"
                          >{{ t }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section v-if="bty.trieuChungList?.length" class="disease-section">
                  <span class="disease-section__label">Triệu chứng ({{ bty.trieuChungList.length }})</span>
                  <div class="chip-row chip-row--wrap">
                    <span v-for="t in bty.trieuChungList" :key="t.id" class="chip chip-trieu">
                      {{ t.ten_trieu_chung }}
                    </span>
                  </div>
                </section>

                <section v-if="bty.machChanList?.length" class="disease-section">
                  <span class="disease-section__label">Mạch chẩn</span>
                  <div class="chip-row chip-row--wrap">
                    <span v-for="m in bty.machChanList" :key="m.id" class="chip chip-mach">
                      {{ m.ten_mach_chan }}
                    </span>
                  </div>
                </section>

                <p
                  v-if="
                    !bty.baiThuocList?.length &&
                    !bty.phapTriList?.length &&
                    !bty.trieuChungList?.length &&
                    !bty.thietChanList?.length &&
                    !bty.machChanList?.length
                  "
                  class="disease-empty muted"
                >
                  Chưa gắn dữ liệu liên quan.
                </p>
              </div>
            </article>
          </div>

          <div v-if="btyTotalPages > 1" class="pagination">
            <button class="page-btn" :disabled="btyPage <= 1" @click="btyPage--">‹</button>
            <button
              v-for="pn in pageNumbers(btyPage, btyTotalPages)"
              :key="pn"
              class="page-btn"
              :class="{ active: pn === btyPage }"
              @click="btyPage = pn"
            >
              {{ pn }}
            </button>
            <button class="page-btn" :disabled="btyPage >= btyTotalPages" @click="btyPage++">›</button>
            <span class="page-info">Trang {{ btyPage }} / {{ btyTotalPages }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Chủng Bệnh -->
    <div v-if="showCbModal" class="modal-overlay" @click.self="showCbModal = false">
      <div class="modal modal--sm" @click.stop>
        <div class="modal-header">
          <h3>{{ editingCb ? 'Sửa chủng bệnh' : 'Thêm chủng bệnh' }}</h3>
          <button class="modal-close" @click="showCbModal = false">✕</button>
        </div>
        <form class="modal-body" @submit.prevent="submitCb">
          <p v-if="cbFormError" class="form-error">{{ cbFormError }}</p>
          <label class="field field--full">
            <span>Tên chủng bệnh <abbr title="bắt buộc">*</abbr></span>
            <input v-model="cbForm.ten_chung_benh" class="input" maxlength="255" autofocus />
          </label>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" :disabled="isSubmitting" @click="showCbModal = false">Hủy</button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Đang lưu…' : 'Lưu' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Bệnh Tây Y -->
    <div v-if="showBtyModal" class="modal-overlay" @click.self="showBtyModal = false">
      <div class="modal modal--wide" @click.stop>
        <div class="modal-header">
          <h3>{{ editingBty ? 'Sửa bệnh Tây Y' : 'Thêm bệnh Tây Y' }}</h3>
          <button class="modal-close" @click="showBtyModal = false">✕</button>
        </div>
        <form class="modal-body modal-body--loadable" @submit.prevent="submitBty">
          <div v-if="formLoading" class="modal-loading-overlay">
            <div class="spinner spinner--sm"></div>
            <span>Đang tải tùy chọn…</span>
          </div>
          <p v-if="btyFormError" class="form-error">{{ btyFormError }}</p>
          <div class="form-grid">
            <label class="field field--full">
              <span>Tên bệnh <abbr title="bắt buộc">*</abbr></span>
              <input v-model="btyForm.ten_benh" class="input" maxlength="255" />
            </label>

            <div class="field field--full">
              <div class="field-head">
                <span>Chủng bệnh <abbr title="bắt buộc">*</abbr></span>
                <span class="field-count">{{ btyForm.id_chung_benh != null ? 'Đã chọn' : 'Chưa chọn' }}</span>
              </div>
              <div v-if="chungBenhList.length === 0" class="muted">Chưa có chủng bệnh</div>
              <div v-else class="chip-picker chip-picker--scroll">
                <button
                  v-for="cb in chungBenhList"
                  :key="cb.id"
                  type="button"
                  class="chip-toggle"
                  :class="{ active: btyForm.id_chung_benh === cb.id }"
                  @click="btyForm.id_chung_benh = cb.id"
                >
                  {{ cb.ten_chung_benh }}
                </button>
              </div>
            </div>

            <div class="field field--full">
              <div class="field-head">
                <span>Bài thuốc</span>
                <span class="field-count">{{ btyForm.bai_thuoc_ids.length }} đã chọn</span>
              </div>
              <div class="picker-search">
                <input v-model="baiThuocSearch" type="search" class="input input--sm" placeholder="Tìm bài thuốc..." />
              </div>
              <div class="chip-picker chip-picker--scroll">
                <button
                  v-for="b in filteredBaiThuocOptions"
                  :key="b.id"
                  type="button"
                  class="chip-toggle"
                  :class="{ active: btyForm.bai_thuoc_ids.includes(b.id) }"
                  @click="btyForm.bai_thuoc_ids = toggleId(btyForm.bai_thuoc_ids, b.id)"
                >
                  {{ b.ten_bai_thuoc }}
                </button>
                <span v-if="filteredBaiThuocOptions.length === 0" class="muted">Không khớp</span>
              </div>
            </div>

            <div class="field field--full">
              <div class="field-head">
                <span>Pháp trị</span>
                <span class="field-count">{{ btyForm.phap_tri_ids.length }} đã chọn</span>
              </div>
              <div class="picker-search">
                <input v-model="phapTriSearch" type="search" class="input input--sm" placeholder="Tìm pháp trị..." />
              </div>
              <div class="chip-picker chip-picker--scroll">
                <button
                  v-for="p in filteredPhapTriOptions"
                  :key="p.id"
                  type="button"
                  class="chip-toggle"
                  :class="{ active: btyForm.phap_tri_ids.includes(p.id) }"
                  @click="btyForm.phap_tri_ids = toggleId(btyForm.phap_tri_ids, p.id)"
                >
                  {{ phapTriLabel(p) }}
                </button>
                <span v-if="filteredPhapTriOptions.length === 0" class="muted">Không khớp</span>
              </div>
            </div>

            <div class="field field--full">
              <div class="field-head">
                <span>Triệu chứng</span>
                <span class="field-count">{{ btyForm.trieu_chung_ids.length }} đã chọn</span>
              </div>
              <div class="picker-search">
                <input v-model="trieuChungSearch" type="search" class="input input--sm" placeholder="Tìm triệu chứng..." />
              </div>
              <div class="chip-picker chip-picker--scroll">
                <button
                  v-for="t in filteredTrieuChungOptions"
                  :key="t.id"
                  type="button"
                  class="chip-toggle"
                  :class="{ active: btyForm.trieu_chung_ids.includes(t.id) }"
                  @click="btyForm.trieu_chung_ids = toggleId(btyForm.trieu_chung_ids, t.id)"
                >
                  {{ t.ten_trieu_chung }}
                </button>
                <button
                  v-if="canCreateTrieuChung"
                  type="button"
                  class="chip-toggle chip-create"
                  :disabled="creatingTrieuChung"
                  @click="createTrieuChungInline"
                >
                  {{ creatingTrieuChung ? 'Đang tạo…' : `+ Tạo: "${trieuChungSearch.trim()}"` }}
                </button>
                <span v-if="filteredTrieuChungOptions.length === 0 && !canCreateTrieuChung" class="muted">Không khớp</span>
              </div>
            </div>

            <div class="field field--full">
              <div class="field-head">
                <span>Thiệt chẩn</span>
                <span class="field-count">{{ btyForm.thiet_chan_ids.length }} đã chọn</span>
              </div>
              <div class="picker-search">
                <input v-model="thietChanSearch" type="search" class="input input--sm" placeholder="Tìm thiệt chẩn..." />
              </div>
              <div class="chip-picker chip-picker--scroll">
                <button
                  v-for="t in filteredThietChanOptions"
                  :key="t.id"
                  type="button"
                  class="chip-toggle"
                  :class="{ active: btyForm.thiet_chan_ids.includes(t.id) }"
                  @click="btyForm.thiet_chan_ids = toggleId(btyForm.thiet_chan_ids, t.id)"
                >
                  {{ t.ten_thiet_chan }}
                </button>
                <span v-if="filteredThietChanOptions.length === 0" class="muted">Không khớp</span>
              </div>
            </div>

            <div class="field field--full">
              <div class="field-head">
                <span>Mạch chẩn</span>
                <span class="field-count">{{ btyForm.mach_chan_ids.length }} đã chọn</span>
              </div>
              <div class="picker-search">
                <input v-model="machChanSearch" type="search" class="input input--sm" placeholder="Tìm mạch chẩn..." />
              </div>
              <div class="chip-picker chip-picker--scroll">
                <button
                  v-for="m in filteredMachChanOptions"
                  :key="m.id"
                  type="button"
                  class="chip-toggle"
                  :class="{ active: btyForm.mach_chan_ids.includes(m.id) }"
                  @click="btyForm.mach_chan_ids = toggleId(btyForm.mach_chan_ids, m.id)"
                >
                  {{ m.ten_mach_chan }}
                </button>
                <span v-if="filteredMachChanOptions.length === 0" class="muted">Không khớp</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" :disabled="isSubmitting" @click="showBtyModal = false">Hủy</button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Đang lưu…' : 'Lưu' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal xóa -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal modal--sm" @click.stop>
        <div class="modal-header">
          <h3>Xác nhận xóa</h3>
          <button class="modal-close" @click="showDeleteConfirm = false">✕</button>
        </div>
        <div class="modal-body">
          <p>
            Bạn có chắc muốn xóa
            <strong>{{ deletingTarget?.kind === 'cb' ? 'chủng bệnh' : 'bệnh Tây Y' }}</strong>
            "<strong>{{ deletingTarget?.label }}</strong>"?
          </p>
          <p class="muted" style="font-size: 13px;">
            <template v-if="deletingTarget?.kind === 'cb'">
              Lưu ý: xóa chủng bệnh sẽ xóa cascade tất cả bệnh Tây Y thuộc chủng đó.
            </template>
            <template v-else>Thao tác này không thể hoàn tác.</template>
          </p>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" :disabled="isSubmitting" @click="showDeleteConfirm = false">Hủy</button>
            <button type="button" class="btn-danger" :disabled="isSubmitting" @click="doDelete">
              {{ isSubmitting ? 'Đang xóa…' : 'Xóa' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.western-medicine-page { width: 100%; animation: fadeIn 0.4s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes spin { to { transform: rotate(360deg); } }

.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); margin-bottom: var(--space-6); padding-bottom: var(--space-4); border-bottom: 2px solid var(--brown-100); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--brown-800); margin-bottom: var(--space-1); }
.page-subtitle { color: var(--gray-500); font-size: var(--font-size-md); }

.view-toggle { display: flex; background: var(--white); padding: 4px; border-radius: var(--radius-lg); border: 1px solid var(--brown-200); box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.toggle-btn { padding: var(--space-2) var(--space-4); border-radius: var(--radius-md); font-weight: 600; font-size: var(--font-size-sm); color: var(--gray-600); transition: all var(--transition-base); cursor: pointer; background: transparent; border: 0; }
.toggle-btn:hover { color: var(--brown-600); }
.toggle-btn.active { background: var(--brown-600); color: var(--white); box-shadow: 0 2px 4px rgba(161, 98, 7, 0.2); }

.sub-sub-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: var(--space-4);
}
.sub-sub-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border: 1px solid var(--brown-200);
  background: var(--white);
  color: var(--gray-700);
  font-weight: 600;
  font-size: 12px;
  border-radius: 999px;
  cursor: pointer;
  transition: all var(--transition-base);
}
.sub-sub-tab:hover {
  background: var(--brown-50);
  border-color: var(--brown-300);
  color: var(--brown-700);
}
.sub-sub-tab.active {
  background: var(--brown-50);
  color: var(--brown-800);
  border-color: var(--brown-200);
}
.sub-sub-tab__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  background: var(--gray-100);
  color: var(--gray-600);
  border-radius: 9px;
  font-size: 10px;
  font-weight: 700;
}
.sub-sub-tab.active .sub-sub-tab__count {
  background: var(--brown-700);
  color: var(--white);
}

.loading-state { display: flex; flex-direction: column; align-items: center; padding: var(--space-12) 0; color: var(--brown-600); gap: var(--space-3); }
.spinner { width: 32px; height: 32px; border: 3px solid var(--gray-200); border-top-color: var(--brown-500); border-radius: 50%; animation: spin .7s linear infinite; }
.error-state { text-align: center; padding: var(--space-8); color: var(--danger); background: var(--danger-bg); border-radius: var(--radius-lg); }

.toolbar { display: flex; align-items: flex-end; gap: var(--space-3); margin-bottom: var(--space-4); flex-wrap: wrap; }
.search-wrap { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 4px; }
.search-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gray-500); }
.search-input { padding: 8px 12px; border: 1px solid var(--gray-200); border-radius: var(--radius-md); background: var(--white); font-size: var(--font-size-sm); width: 100%; }
.search-input:focus { outline: none; border-color: var(--brown-400); box-shadow: var(--focus-ring); }
.toolbar-count { font-size: var(--font-size-sm); color: var(--gray-500); font-weight: 600; align-self: center; }

.data-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm); position: relative; }
.data-card--loading { pointer-events: none; }
.data-card--loading .bty-grid, .data-card--loading .cb-grid { opacity: 0.55; transition: opacity .15s; }

.spinner--sm { width: 20px; height: 20px; border-width: 2px; }
.loading-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; overflow: hidden; background: rgba(146, 64, 14, 0.08); z-index: 5; }
.loading-bar::before { content: ''; position: absolute; top: 0; left: 0; width: 40%; height: 100%; background: linear-gradient(90deg, transparent, var(--brown-500), transparent); animation: loadingBarSlide 1.1s ease-in-out infinite; }
@keyframes loadingBarSlide { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }
.modal-body--loadable { position: relative; min-height: 80px; }
.modal-loading-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-2); background: rgba(255,255,255,0.82); backdrop-filter: blur(2px); z-index: 10; color: var(--brown-700); font-size: var(--font-size-sm); font-weight: 600; }
.card-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4) var(--space-5); background: var(--brown-50); border-bottom: 1px solid var(--brown-100); }
.card-header h3 { font-size: var(--font-size-lg); font-weight: 700; color: var(--brown-900); margin: 0; }

.empty-state {
  padding: var(--space-12) var(--space-5);
  text-align: center;
  color: var(--gray-500);
  font-size: var(--font-size-md);
  background: linear-gradient(180deg, #fff 0%, var(--surface-2) 100%);
}

.disease-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--surface-2);
}
.disease-grid--sm { grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); }

.disease-card {
  display: flex;
  flex-direction: column;
  background: var(--white);
  border: 1px solid var(--brown-100);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(74, 47, 23, 0.04);
  transition: box-shadow .15s, transform .15s, border-color .15s;
}
.disease-card:hover { box-shadow: 0 6px 18px rgba(74, 47, 23, 0.08); border-color: var(--brown-200); transform: translateY(-1px); }
.disease-card--highlight {
  border-color: #d97706;
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.25), 0 6px 18px rgba(217, 119, 6, 0.18);
  animation: bty-flash 2.5s ease-out;
}
@keyframes bty-flash {
  0%   { background-color: #fff7ed; }
  60%  { background-color: #fff7ed; }
  100% { background-color: #fff; }
}
.disease-card__head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-3); padding: var(--space-3) var(--space-4); background: linear-gradient(135deg, var(--brown-50) 0%, #fff 100%); border-bottom: 1px solid var(--brown-100); }
.disease-card__title { display: flex; align-items: center; gap: var(--space-2); min-width: 0; flex: 1; flex-wrap: wrap; }
.disease-card__id {
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 700;
  color: var(--brown-700);
  background: var(--white);
  border: 1px solid var(--brown-200);
  padding: 2px 8px;
  border-radius: 999px;
  letter-spacing: 0.02em;
}
.disease-card__name { margin: 0; font-size: var(--font-size-md); font-weight: 700; color: var(--brown-900); line-height: 1.35; word-break: break-word; }
.disease-card__body { flex: 1 1 auto; display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-3) var(--space-4) var(--space-4); }
.disease-section { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
.disease-section__label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gray-500); }
.disease-empty { margin: 0; font-size: var(--font-size-sm); text-align: center; padding: var(--space-3) 0; }
.cell-tag { display: inline-block; padding: 2px 8px; background: var(--brown-50); border-radius: var(--radius-sm); font-family: ui-monospace, monospace; font-size: var(--font-size-sm); }

.chip { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; line-height: 1.4; border: 1px solid transparent; }
.chip-chungbenh { background: var(--chip-brand-bg); color: var(--chip-brand-fg); border-color: var(--chip-brand-border); }
.chip-bai { background: var(--chip-herb-bg); color: var(--chip-herb-fg); border-color: var(--chip-herb-border); }
.chip-phap { background: var(--chip-method-bg); color: var(--chip-method-fg); border-color: var(--chip-method-border); font-weight: 700; }
.chip-the { background: var(--chip-pattern-bg); color: var(--chip-pattern-fg); border-color: var(--chip-pattern-border); }
.chip-link-bai,
.chip-link-the,
.chip-link-phap {
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, transform 0.05s;
}
.chip-link-bai:hover { background: var(--chip-herb-bg); border-color: var(--chip-herb-fg); }
.chip-link-phap:hover { background: var(--chip-method-bg); border-color: var(--chip-method-fg); }
.chip-link-the:hover { background: var(--chip-pattern-bg); border-color: var(--chip-pattern-fg); }
.chip-link-bai:active,
.chip-link-the:active,
.chip-link-phap:active { transform: translateY(1px); }

.pt-tbl {
  width: 100%;
  border-collapse: collapse;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.pt-tbl thead th {
  background: var(--surface-2);
  padding: 5px 10px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gray-500);
  text-align: left;
  border-bottom: 1px solid var(--gray-100);
}
.pt-tbl tbody td {
  padding: 6px 10px;
  vertical-align: middle;
  font-size: var(--font-size-sm);
  border-top: 1px solid var(--gray-100);
  word-break: break-word;
}
.pt-tbl tbody tr:first-child td { border-top: 0; }
.pt-tbl tbody tr:hover { background: var(--surface-2); }

.chip-trieu { background: var(--chip-symptom-bg); color: var(--chip-symptom-fg); border-color: var(--chip-symptom-border); }
/* Triệu chứng lồng trong pháp trị: tím dễ đọc (đồng nhất nghĩa "triệu chứng"),
   viền đứt nét để báo hiệu "dẫn xuất qua pháp trị". */
.chip-trieu-pt { background: var(--chip-symptom-bg); color: var(--chip-symptom-fg); border: 1px dashed var(--chip-symptom-border); }

/* Pháp trị: mỗi pháp trị là một khối riêng, triệu chứng lồng rõ ràng bên dưới */
.phap-tri-list { display: flex; flex-direction: column; gap: 8px; }
.phap-tri-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  background: var(--chip-method-surface);
  border: 1px solid var(--chip-method-border);
  border-left: 3px solid var(--chip-method-fg);
  border-radius: var(--radius-md);
}
.phap-tri-trieu { width: 100%; }
.phap-tri-trieu__label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--gray-400);
  margin-bottom: 4px;
}
.chip-thiet { background: var(--chip-pattern-bg); color: var(--chip-pattern-fg); border-color: var(--chip-pattern-border); }
.chip-mach { background: var(--chip-pulse-bg); color: var(--chip-pulse-fg); border-color: var(--chip-pulse-border); }
.chip-row { display: flex; flex-wrap: wrap; gap: 4px; }
.chip-row--wrap { gap: 6px; }
.chip-row--wrap .chip { white-space: normal; word-break: break-word; max-width: 100%; }

.row-actions { display: inline-flex; gap: 6px; flex-wrap: wrap; }
.btn-action {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  border: 1px solid var(--gray-200);
  background: var(--white);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.btn-edit { background: var(--brown-50); color: var(--brown-800); border-color: var(--brown-200); }
.btn-edit:hover { background: var(--brown-100); }
.btn-delete { background: var(--danger-bg); color: var(--danger); border-color: var(--danger-border); }
.btn-delete:hover { background: var(--danger-bg); }

.pagination { display: flex; align-items: center; justify-content: center; gap: var(--space-2); padding: var(--space-4); background: var(--gray-50); border-top: 1px solid var(--gray-100); flex-wrap: wrap; }
.page-btn { min-width: 32px; height: 32px; padding: 0 8px; display: flex; align-items: center; justify-content: center; background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-600); cursor: pointer; transition: all var(--transition-fast); }
.page-btn:hover:not(:disabled) { border-color: var(--brown-400); color: var(--brown-700); background: var(--brown-50); }
.page-btn.active { background: var(--brown-600); border-color: var(--brown-600); color: var(--white); }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { margin-left: var(--space-4); font-size: var(--font-size-xs); color: var(--gray-500); font-weight: 600; }

.badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-info { background: var(--info-bg); color: var(--info-fg); }
.badge-success { background: var(--success-bg); color: var(--success-fg); }

.btn-primary { background: var(--brown-600); color: var(--white); padding: 8px 16px; border-radius: var(--radius-md); font-weight: 600; font-size: var(--font-size-sm); border: 0; cursor: pointer; transition: background .15s; }
.btn-primary:hover:not(:disabled) { background: var(--brown-700); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { background: var(--gray-100); color: var(--gray-700); padding: 8px 16px; border-radius: var(--radius-md); font-weight: 600; font-size: var(--font-size-sm); border: 0; cursor: pointer; transition: background .15s; }
.btn-secondary:hover:not(:disabled) { background: var(--gray-200); }
.btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-danger { background: var(--danger); color: var(--white); padding: 8px 16px; border-radius: var(--radius-md); font-weight: 600; font-size: var(--font-size-sm); border: 0; cursor: pointer; }
.btn-danger:hover:not(:disabled) { background: #b91c1c; }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: var(--space-4); z-index: 200; }
.modal { background: var(--white); border-radius: var(--radius-xl); width: 100%; max-width: 480px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 24px 48px rgba(0,0,0,0.2); }
.modal--sm { max-width: 420px; }
.modal--wide { max-width: 760px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--gray-100); }
.modal-header h3 { margin: 0; font-size: var(--font-size-lg); color: var(--brown-900); }
.modal-close { background: transparent; border: 0; font-size: 20px; cursor: pointer; color: var(--gray-500); padding: 4px 8px; border-radius: var(--radius-sm); }
.modal-close:hover { background: var(--gray-100); }
.modal-body { padding: var(--space-5); overflow-y: auto; }
.modal-footer { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-5); padding-top: var(--space-4); border-top: 1px solid var(--gray-100); }

.form-error { color: var(--danger); background: var(--danger-bg); border: 1px solid var(--danger-border); padding: 8px 12px; border-radius: var(--radius-md); font-size: var(--font-size-sm); margin-bottom: var(--space-3); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.field { display: flex; flex-direction: column; gap: 4px; }
.field--full { grid-column: 1 / -1; }
.field > span:first-child { font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-700); }
.field abbr { color: var(--danger); text-decoration: none; margin-left: 2px; }
.input, .textarea { padding: 8px 12px; border: 1px solid var(--gray-200); border-radius: var(--radius-md); font-size: var(--font-size-sm); background: var(--white); }
.input:focus, .textarea:focus { outline: none; border-color: var(--brown-400); box-shadow: var(--focus-ring); }
.input--sm { padding: 6px 10px; font-size: 13px; }

.field-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-2); }
.field-count { font-size: 11px; font-weight: 600; color: var(--brown-600); background: var(--brown-50); padding: 1px 8px; border-radius: 999px; }
.picker-search { margin-bottom: 6px; }
.chip-picker { display: flex; flex-wrap: wrap; gap: 6px; padding: var(--space-2); border: 1px solid var(--gray-200); border-radius: var(--radius-md); background: var(--gray-50); }
.chip-picker--scroll { max-height: 200px; overflow-y: auto; }
.chip-toggle { padding: 4px 10px; font-size: 13px; font-weight: 600; border-radius: 999px; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); cursor: pointer; transition: all var(--transition-fast); }
.chip-toggle:hover { border-color: var(--brown-400); color: var(--brown-700); }
.chip-toggle.active { background: var(--brown-600); color: var(--white); border-color: var(--brown-600); }
.chip-create { border-style: dashed; border-color: var(--brown-400); color: var(--brown-700); background: var(--brown-50); }
.chip-create:hover:not(:disabled) { background: var(--brown-100); border-color: var(--brown-500); }
.chip-create:disabled { opacity: 0.6; cursor: not-allowed; }

.muted { color: var(--gray-400); font-style: italic; }
.mt-4 { margin-top: 1rem !important; }

@media (max-width: 900px) {
  .page-header { flex-direction: column; align-items: stretch; gap: var(--space-3); }
  .view-toggle { align-self: flex-start; }
  .toolbar { gap: var(--space-2); }
  .search-wrap { min-width: 0; flex: 1 1 100%; }
  .disease-card__head { flex-wrap: wrap; }
  .row-actions { flex: 1 1 100%; justify-content: flex-end; }
}
@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .field--full { grid-column: 1; }
  .disease-grid, .disease-grid--sm { padding: var(--space-3); }
  .card-header { padding: var(--space-3) var(--space-4); }
  .modal { max-height: 95vh; }
  .modal-body { padding: var(--space-4); }
}
</style>
