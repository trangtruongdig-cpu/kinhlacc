<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/services/api'

const router = useRouter()
const route = useRoute()
const highlightPtId = ref<number | null>(null)

function benhTayYHref(id: number): string {
  return router.resolve({
    name: 'western-medicine',
    query: { tab: 'benh-tay-y', btyId: id },
  }).href
}

function baiThuocHref(id: number): string {
  return router.resolve({
    name: 'medicines',
    query: { tab: 'bai-thuoc', btId: id },
  }).href
}

interface KinhMachLite {
  idKinhMach: number
  ten_kinh_mach: string | null
  ten_viet_tat: string | null
}

interface TrieuChungLite {
  id: number
  ten_trieu_chung: string
}

interface BaiThuocLite {
  id: number
  ten_bai_thuoc: string
}

interface BenhTayYLite {
  id: number
  ten_benh: string
  chungBenh?: { id: number; ten_chung_benh: string } | null
}

interface BaiThuocPhapTriLink {
  idBaiThuoc: number
  idPhapTri: number
  thuTu: number
  baiThuoc?: BaiThuocLite | null
}

interface PhapTriRow {
  id: number
  chung_trang: string | null
  nguyen_tac: string | null
  trieu_chung_mo_ta: string | null
  luc_kinh: string | null
  kinh_mach_list: KinhMachLite[]
  trieu_chung_list: TrieuChungLite[]
  bai_thuoc: BaiThuocLite | null
  bai_thuoc_links: BaiThuocPhapTriLink[]
}

interface FormState {
  chung_trang: string
  nguyen_tac: string
  luc_kinh_list: string[]
  id_kinh_mach_list: number[]
  id_trieu_chung_list: number[]
  id_bai_thuoc_list: number[]
}

const isLoading = ref(true)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const formError = ref<string | null>(null)
const dataList = ref<PhapTriRow[]>([])
const dataTotal = ref(0)
const dataStats = ref<{ all: number; 'dong-y': number; 'tay-y': number }>({ all: 0, 'dong-y': 0, 'tay-y': 0 })
const benhTayYByPtIdMap = ref<Record<number, BenhTayYLite[]>>({})
const tayYChungBenhStats = ref<TayYChungBenhFilterOption[]>([])
const searchQuery = ref('')
const pageLoading = ref(false)
/** Đánh dấu modal đang đợi load /bai-thuoc options. */
const formLoading = ref(false)

type PhapTriCategory = 'all' | 'dong-y' | 'tay-y'
const phapTriCategory = ref<PhapTriCategory>('all')
const selectedTayYChungBenhId = ref<number | null>(null)
const selectedTangPhuIds = ref<number[]>([])
const selectedTonThuongList = ref<string[]>([])
const tangPhuStats = ref<ExtraFilterOption[]>([])
const tonThuongStats = ref<ExtraFilterOption[]>([])

interface TonThuongTacNhanLite {
  id: number
  ten: string
  ghi_chu: string | null
}

interface TayYChungBenhFilterOption {
  id: number
  name: string
  count: number
}

interface ExtraFilterOption {
  id: number
  name: string
  count: number
}

const kinhMachOptions = ref<KinhMachLite[]>([])
const trieuChungOptions = ref<TrieuChungLite[]>([])
const baiThuocOptions = ref<BaiThuocLite[]>([])
const baiThuocOptionsLoaded = ref(false)
const tonThuongOptions = ref<TonThuongTacNhanLite[]>([])

function benhTayYForPhapTri(ptId: number): BenhTayYLite[] {
  return benhTayYByPtIdMap.value[ptId] ?? []
}

interface BenhTayYGroup {
  key: string
  chungBenhName: string
  items: BenhTayYLite[]
}

function benhTayYGroupsForPhapTri(ptId: number): BenhTayYGroup[] {
  const groups = new Map<string, BenhTayYGroup>()
  for (const bty of benhTayYForPhapTri(ptId)) {
    const name = bty.chungBenh?.ten_chung_benh?.trim() || 'Khác'
    const key = bty.chungBenh?.id != null ? `cb-${bty.chungBenh.id}` : `name-${name.toLowerCase()}`
    const g = groups.get(key) ?? { key, chungBenhName: name, items: [] }
    g.items.push(bty)
    groups.set(key, g)
  }
  return Array.from(groups.values()).sort((a, b) => a.chungBenhName.localeCompare(b.chungBenhName, 'vi'))
}

const kinhMachSearch = ref('')
const trieuChungSearch = ref('')
const baiThuocSearch = ref('')
const creatingTrieuChung = ref(false)

const lucKinhOptionNames = computed<string[]>(() =>
  tonThuongOptions.value.map((o) => o.ten).filter(Boolean),
)

const showModal = ref(false)
const showDeleteConfirm = ref(false)
const editingId = ref<number | null>(null)
const deletingItem = ref<PhapTriRow | null>(null)

const emptyForm = (): FormState => ({
  chung_trang: '',
  nguyen_tac: '',
  luc_kinh_list: [],
  id_kinh_mach_list: [],
  id_trieu_chung_list: [],
  id_bai_thuoc_list: [],
})

function parseLucKinh(value: string | null | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function toggleLucKinh(opt: string) {
  const list = form.value.luc_kinh_list
  form.value.luc_kinh_list = list.includes(opt)
    ? list.filter((x) => x !== opt)
    : [...list, opt]
}

const form = ref<FormState>(emptyForm())

const currentPage = ref(1)
const itemsPerPage = ref(12)

onMounted(async () => {
  const rawPtId = route.query.ptId
  const targetId = Array.isArray(rawPtId) ? rawPtId[0] : rawPtId
  const ptId = targetId != null ? Number(targetId) : NaN
  const hasFocus = Number.isFinite(ptId)
  if (hasFocus) {
    // Reset filter để pháp trị target chắc chắn nằm trong tập kết quả.
    phapTriCategory.value = 'all'
    searchQuery.value = ''
  }
  await fetchData(hasFocus ? ptId : undefined)
  if (hasFocus) {
    await nextTick()
    highlightPtId.value = ptId
    const el = document.querySelector(`[data-pt-id="${ptId}"]`) as HTMLElement | null
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => {
      if (highlightPtId.value === ptId) highlightPtId.value = null
    }, 2500)
  }
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

/** Load 1 page pháp trị từ /phap-tri/lite (server pagination + search + category filter).
 *  Truyền focusId để server tự nhảy tới trang chứa pháp trị đó (deep link). */
async function loadPhapTriPage(focusId?: number) {
  pageLoading.value = true
  try {
    const qs = buildQuery({
      page: currentPage.value,
      limit: itemsPerPage.value,
      q: searchQuery.value.trim(),
      category: phapTriCategory.value,
      chungBenhId: phapTriCategory.value === 'tay-y' ? selectedTayYChungBenhId.value : null,
      tangPhuIds:
        phapTriCategory.value !== 'all' && selectedTangPhuIds.value.length
          ? selectedTangPhuIds.value.join(',')
          : null,
      tonThuongTacNhans:
        phapTriCategory.value !== 'all' && selectedTonThuongList.value.length
          ? selectedTonThuongList.value.join(',')
          : null,
      focusId: focusId != null && Number.isFinite(focusId) ? focusId : null,
    })
    const res: any = await api.get(`/phap-tri/lite${qs}`)
    dataList.value = res?.data ?? []
    dataTotal.value = Number(res?.total ?? 0)
    // Server trả về trang thực tế chứa focusId — đồng bộ pagination UI (không reload lại).
    if (focusId != null && Number.isFinite(Number(res?.page))) {
      const p = Number(res.page)
      if (p !== currentPage.value) {
        skipPageWatch = true
        currentPage.value = p
      }
    }
    if (res?.statsByCategory) dataStats.value = res.statsByCategory
    benhTayYByPtIdMap.value = res?.relatedBenhTayYByPtId ?? {}
    tayYChungBenhStats.value = res?.tayYChungBenhStats ?? []
    tangPhuStats.value = res?.tangPhuStats ?? []
    tonThuongStats.value = res?.tonThuongStats ?? []
  } finally {
    pageLoading.value = false
  }
}

/** Load các catalog tĩnh (kinh mạch, triệu chứng, tổn thương) — 1 lần. */
async function loadSupportCatalogs() {
  const [kmRes, tcRes, ttRes] = await Promise.all([
    api.get<any>('/kinh-mach'),
    api.get<any>('/trieu-chung'),
    api.get<any>('/ton-thuong-tac-nhan'),
  ])
  kinhMachOptions.value = Array.isArray(kmRes) ? kmRes : kmRes?.data ?? []
  trieuChungOptions.value = Array.isArray(tcRes) ? tcRes : tcRes?.data ?? []
  tonThuongOptions.value = Array.isArray(ttRes) ? ttRes : ttRes?.data ?? []
}

/** Lazy load /bai-thuoc options chỉ khi mở modal. */
async function ensureBaiThuocOptions() {
  if (baiThuocOptionsLoaded.value) return
  const res: any = await api.get('/bai-thuoc/options')
  const arr: any[] = Array.isArray(res) ? res : res?.data ?? []
  baiThuocOptions.value = arr.map((b: any) => ({ id: b.id, ten_bai_thuoc: b.ten_bai_thuoc }))
  baiThuocOptionsLoaded.value = true
}

async function fetchData(focusId?: number) {
  isLoading.value = true
  error.value = null
  try {
    await Promise.all([loadPhapTriPage(focusId), loadSupportCatalogs()])
  } catch (err: any) {
    console.error(err)
    error.value = 'Lỗi khi tải dữ liệu: ' + (err.message || String(err))
  } finally {
    isLoading.value = false
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    void loadPhapTriPage()
  }, 2000)
})

watch(phapTriCategory, (val) => {
  currentPage.value = 1
  if (val !== 'tay-y') selectedTayYChungBenhId.value = null
  if (val === 'all') {
    selectedTangPhuIds.value = []
    selectedTonThuongList.value = []
  }
  void loadPhapTriPage()
})

watch(selectedTayYChungBenhId, () => {
  currentPage.value = 1
  void loadPhapTriPage()
})

watch(
  selectedTangPhuIds,
  () => {
    currentPage.value = 1
    void loadPhapTriPage()
  },
  { deep: true },
)

watch(
  selectedTonThuongList,
  () => {
    currentPage.value = 1
    void loadPhapTriPage()
  },
  { deep: true },
)

function toggleTangPhu(id: number) {
  selectedTangPhuIds.value = selectedTangPhuIds.value.includes(id)
    ? selectedTangPhuIds.value.filter((x) => x !== id)
    : [...selectedTangPhuIds.value, id]
}

function toggleTonThuong(name: string) {
  selectedTonThuongList.value = selectedTonThuongList.value.includes(name)
    ? selectedTonThuongList.value.filter((x) => x !== name)
    : [...selectedTonThuongList.value, name]
}

function clearExtraFilters() {
  selectedTangPhuIds.value = []
  selectedTonThuongList.value = []
}

// Cờ chặn reload thừa khi currentPage bị set lại từ focusId (deep link).
let skipPageWatch = false
watch(currentPage, () => {
  if (skipPageWatch) {
    skipPageWatch = false
    return
  }
  void loadPhapTriPage()
})

/** Server đã filter & paginate. */
const filteredList = computed(() => dataList.value)
const pagedList = computed(() => dataList.value)
const phapTriCategoryCounts = computed(() => dataStats.value)
const tayYChungBenhFilterOptions = computed<TayYChungBenhFilterOption[]>(() => tayYChungBenhStats.value)

const totalPages = computed(() => {
  const n = Math.ceil(dataTotal.value / itemsPerPage.value)
  return n > 0 ? n : 1
})

function getPageNumbers() {
  const pages: number[] = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
}

function kinhMachLabel(k: KinhMachLite) {
  return k.ten_kinh_mach || k.ten_viet_tat || `#${k.idKinhMach}`
}

const filteredKinhMachOptions = computed(() => {
  const q = kinhMachSearch.value.trim().toLowerCase()
  if (!q) return kinhMachOptions.value
  return kinhMachOptions.value.filter((k) => {
    const hay = [k.ten_kinh_mach, k.ten_viet_tat].filter(Boolean).join(' ').toLowerCase()
    return hay.includes(q)
  })
})

const filteredTrieuChungOptions = computed(() => {
  const q = trieuChungSearch.value.trim().toLowerCase()
  if (!q) return trieuChungOptions.value
  return trieuChungOptions.value.filter((t) =>
    (t.ten_trieu_chung || '').toLowerCase().includes(q),
  )
})
/** Cho phép tạo nhanh triệu chứng khi từ khóa tìm chưa khớp tên nào (so khớp không phân biệt hoa thường). */
const canCreateTrieuChung = computed(() => {
  const q = trieuChungSearch.value.trim()
  if (!q) return false
  return !trieuChungOptions.value.some(
    (t) => (t.ten_trieu_chung || '').trim().toLowerCase() === q.toLowerCase(),
  )
})

/** Tạo ngay một triệu chứng mới từ ô tìm kiếm rồi tự chọn vào pháp trị. */
async function createTrieuChungInline() {
  const name = trieuChungSearch.value.trim()
  if (!name || creatingTrieuChung.value) return
  creatingTrieuChung.value = true
  try {
    const res: any = await api.post('/trieu-chung', { ten_trieu_chung: name })
    const created: TrieuChungLite = res?.data ?? { id: res?.id, ten_trieu_chung: name }
    if (created?.id != null) {
      trieuChungOptions.value = [...trieuChungOptions.value, created]
      if (!form.value.id_trieu_chung_list.includes(created.id)) {
        form.value.id_trieu_chung_list = [...form.value.id_trieu_chung_list, created.id]
      }
      trieuChungSearch.value = ''
    }
  } catch (err: any) {
    formError.value = err.message || 'Không tạo được triệu chứng'
  } finally {
    creatingTrieuChung.value = false
  }
}

const filteredBaiThuocOptions = computed(() => {
  const q = baiThuocSearch.value.trim().toLowerCase()
  if (!q) return baiThuocOptions.value
  return baiThuocOptions.value.filter((b) =>
    (b.ten_bai_thuoc || '').toLowerCase().includes(q),
  )
})

function baiThuocCellLabels(row: PhapTriRow): string[] {
  return baiThuocCellItems(row).map((b) => b.name)
}

function baiThuocCellItems(row: PhapTriRow): Array<{ id: number | null; name: string }> {
  const links = (row.bai_thuoc_links ?? [])
    .slice()
    .sort((a, b) => (a.thuTu ?? 0) - (b.thuTu ?? 0))
  const items = links
    .map((l) => ({ id: l.baiThuoc?.id ?? l.idBaiThuoc ?? null, name: l.baiThuoc?.ten_bai_thuoc || '' }))
    .filter((x) => !!x.name)
  if (items.length > 0) return items
  if (row.bai_thuoc?.ten_bai_thuoc) {
    return [{ id: row.bai_thuoc.id ?? null, name: row.bai_thuoc.ten_bai_thuoc }]
  }
  return []
}

function trieuChungCellLabels(row: PhapTriRow): string[] {
  if (row.trieu_chung_list?.length) {
    return row.trieu_chung_list.map((t) => t.ten_trieu_chung).filter(Boolean)
  }
  if (row.trieu_chung_mo_ta) {
    return row.trieu_chung_mo_ta
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

function resetPickerSearches() {
  kinhMachSearch.value = ''
  trieuChungSearch.value = ''
  baiThuocSearch.value = ''
}

async function openCreateModal() {
  formLoading.value = true
  showModal.value = true
  try {
    await ensureBaiThuocOptions()
  } finally {
    formLoading.value = false
  }
  editingId.value = null
  form.value = emptyForm()
  formError.value = null
  resetPickerSearches()
}

async function openEditModal(row: PhapTriRow) {
  formLoading.value = true
  showModal.value = true
  try {
    await ensureBaiThuocOptions()
  } finally {
    formLoading.value = false
  }
  editingId.value = row.id
  const baiThuocIds = (row.bai_thuoc_links ?? [])
    .slice()
    .sort((a, b) => (a.thuTu ?? 0) - (b.thuTu ?? 0))
    .map((l) => l.idBaiThuoc)
  form.value = {
    chung_trang: row.chung_trang ?? '',
    nguyen_tac: row.nguyen_tac ?? '',
    luc_kinh_list: parseLucKinh(row.luc_kinh),
    id_kinh_mach_list: (row.kinh_mach_list ?? []).map((k) => k.idKinhMach),
    id_trieu_chung_list: (row.trieu_chung_list ?? []).map((t) => t.id),
    id_bai_thuoc_list:
      baiThuocIds.length > 0 ? baiThuocIds : row.bai_thuoc ? [row.bai_thuoc.id] : [],
  }
  formError.value = null
  resetPickerSearches()
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  resetPickerSearches()
}

function toggleMultiId(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

async function handleSubmit() {
  if (isSubmitting.value) return
  formError.value = null
  const f = form.value
  if (!f.chung_trang.trim() && !f.nguyen_tac.trim()) {
    formError.value = 'Cần nhập ít nhất Thể bệnh hoặc Pháp trị'
    return
  }
  const payload = {
    the_benh: f.chung_trang.trim() || null,
    nguyen_tac: f.nguyen_tac.trim() || null,
    luc_kinh: f.luc_kinh_list.length > 0 ? f.luc_kinh_list.join(', ') : null,
    id_kinh_mach_list: f.id_kinh_mach_list,
    id_trieu_chung_list: f.id_trieu_chung_list,
    id_bai_thuoc_list: f.id_bai_thuoc_list,
  }
  isSubmitting.value = true
  try {
    if (editingId.value != null) {
      await api.put(`/phap-tri/${editingId.value}`, payload)
    } else {
      await api.post('/phap-tri', payload)
    }
    await loadPhapTriPage()
    closeModal()
  } catch (err: any) {
    formError.value = err.message || 'Không lưu được dữ liệu'
  } finally {
    isSubmitting.value = false
  }
}

function confirmDelete(row: PhapTriRow) {
  deletingItem.value = row
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (isSubmitting.value) return
  if (!deletingItem.value) return
  isSubmitting.value = true
  try {
    await api.delete(`/phap-tri/${deletingItem.value.id}`)
    showDeleteConfirm.value = false
    deletingItem.value = null
    await loadPhapTriPage()
    if (pagedList.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  } catch (err: any) {
    error.value = err.message || 'Không xóa được bản ghi'
    showDeleteConfirm.value = false
    deletingItem.value = null
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="management-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Quản Lý Pháp Trị</h1>
        <p class="page-subtitle">Danh sách các phương pháp điều trị theo Tạng phủ — Thể bệnh — Tổn thương - Tác nhân</p>
      </div>
      <button type="button" class="btn-primary" @click="openCreateModal">+ Thêm pháp trị</button>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải dữ liệu...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary mt-4" @click="fetchData()">Thử lại</button>
    </div>

    <div v-else class="content-body">
      <div class="toolbar">
        <div class="search-wrap">
          <label class="search-label" for="phap-tri-search">Tìm kiếm</label>
          <input
            id="phap-tri-search"
            v-model="searchQuery"
            type="search"
            class="search-input"
            placeholder="Tìm theo Tạng phủ, Thể bệnh, Pháp trị, Triệu chứng, Bài thuốc, Bệnh Tây Y, Tổn thương - Tác nhân..."
          />
        </div>
        <div class="toolbar-count">{{ filteredList.length }} / {{ dataList.length }} pháp trị</div>
      </div>

      <div class="sub-tabs" role="tablist" aria-label="Phân loại pháp trị">
        <button
          type="button"
          role="tab"
          class="sub-tab"
          :class="{ active: phapTriCategory === 'dong-y' }"
          :aria-selected="phapTriCategory === 'dong-y'"
          @click="phapTriCategory = 'dong-y'"
        >
          Đông Y
          <span class="sub-tab__count">{{ phapTriCategoryCounts['dong-y'] }}</span>
        </button>
        <button
          type="button"
          role="tab"
          class="sub-tab"
          :class="{ active: phapTriCategory === 'tay-y' }"
          :aria-selected="phapTriCategory === 'tay-y'"
          @click="phapTriCategory = 'tay-y'"
        >
          Tây Y
          <span class="sub-tab__count">{{ phapTriCategoryCounts['tay-y'] }}</span>
        </button>
        <button
          type="button"
          role="tab"
          class="sub-tab"
          :class="{ active: phapTriCategory === 'all' }"
          :aria-selected="phapTriCategory === 'all'"
          @click="phapTriCategory = 'all'"
        >
          Tất Cả
          <span class="sub-tab__count">{{ phapTriCategoryCounts['all'] }}</span>
        </button>
      </div>

      <div
        v-if="phapTriCategory !== 'all' && (tangPhuStats.length || tonThuongStats.length)"
        class="extra-filters"
      >
        <div v-if="tangPhuStats.length" class="filter-row">
          <span class="filter-row__label">Tạng phủ</span>
          <div class="sub-sub-tabs sub-sub-tabs--inline" role="group" aria-label="Lọc theo tạng phủ">
            <button
              v-for="opt in tangPhuStats"
              :key="'tp-' + opt.id"
              type="button"
              class="sub-sub-tab"
              :class="{ active: selectedTangPhuIds.includes(opt.id) }"
              :aria-pressed="selectedTangPhuIds.includes(opt.id)"
              @click="toggleTangPhu(opt.id)"
            >
              {{ opt.name }}
              <span class="sub-sub-tab__count">{{ opt.count }}</span>
            </button>
          </div>
        </div>
        <div v-if="tonThuongStats.length" class="filter-row">
          <span class="filter-row__label">Tổn thương</span>
          <div
            class="sub-sub-tabs sub-sub-tabs--inline sub-sub-tabs--alt"
            role="group"
            aria-label="Lọc theo tổn thương - tác nhân"
          >
            <button
              v-for="opt in tonThuongStats"
              :key="'tt-' + opt.id"
              type="button"
              class="sub-sub-tab"
              :class="{ active: selectedTonThuongList.includes(opt.name) }"
              :aria-pressed="selectedTonThuongList.includes(opt.name)"
              @click="toggleTonThuong(opt.name)"
            >
              {{ opt.name }}
              <span class="sub-sub-tab__count">{{ opt.count }}</span>
            </button>
          </div>
          <button
            v-if="selectedTangPhuIds.length || selectedTonThuongList.length"
            type="button"
            class="filter-clear-btn"
            @click="clearExtraFilters"
          >
            Bỏ chọn
          </button>
        </div>
      </div>

      <div
        v-if="phapTriCategory === 'tay-y' && tayYChungBenhFilterOptions.length"
        class="sub-sub-tabs"
        role="tablist"
        aria-label="Lọc theo chủng bệnh"
      >
        <button
          type="button"
          role="tab"
          class="sub-sub-tab"
          :class="{ active: selectedTayYChungBenhId === null }"
          :aria-selected="selectedTayYChungBenhId === null"
          @click="selectedTayYChungBenhId = null"
        >
          Tất Cả
          <span class="sub-sub-tab__count">{{ phapTriCategoryCounts['tay-y'] }}</span>
        </button>
        <button
          v-for="cb in tayYChungBenhFilterOptions"
          :key="cb.id"
          type="button"
          role="tab"
          class="sub-sub-tab"
          :class="{ active: selectedTayYChungBenhId === cb.id }"
          :aria-selected="selectedTayYChungBenhId === cb.id"
          @click="selectedTayYChungBenhId = cb.id"
        >
          {{ cb.name }}
          <span class="sub-sub-tab__count">{{ cb.count }}</span>
        </button>
      </div>

      <div class="data-card" :class="{ 'data-card--loading': pageLoading }">
        <div v-if="pageLoading" class="loading-bar" aria-hidden="true"></div>
        <div class="card-header">
          <h3>Danh Sách Pháp Trị</h3>
          <span class="badge badge-success">{{ filteredList.length }} bản ghi</span>
        </div>
        <div v-if="pagedList.length === 0" class="empty-state">Chưa có dữ liệu</div>

        <div v-else class="disease-grid">
          <article
            v-for="item in pagedList"
            :key="item.id"
            :data-pt-id="item.id"
            class="disease-card"
            :class="{ 'disease-card--highlight': item.id === highlightPtId }"
          >
            <header class="disease-card__head">
              <div class="disease-card__title">
                <span class="disease-card__id">#{{ item.id }}</span>
                <h4 class="disease-card__name">{{ item.chung_trang || 'Pháp trị #' + item.id }}</h4>
                <div v-if="benhTayYGroupsForPhapTri(item.id).length" class="bty-inline">
                  <div
                    v-for="g in benhTayYGroupsForPhapTri(item.id)"
                    :key="g.key"
                    class="bty-group"
                  >
                    <span class="bty-group__label">{{ g.chungBenhName }}</span>
                    <div class="chip-row chip-row--wrap chip-row--inline">
                      <a
                        v-for="bty in g.items"
                        :key="bty.id"
                        :href="benhTayYHref(bty.id)"
                        target="_blank"
                        rel="noopener"
                        class="chip chip-tayy chip-link"
                        :title="`Mở bệnh Tây Y: ${bty.ten_benh}`"
                      >
                        {{ bty.ten_benh }}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div class="row-actions">
                <button type="button" class="btn-action btn-edit" @click="openEditModal(item)">Sửa</button>
                <button type="button" class="btn-action btn-delete" @click="confirmDelete(item)">Xóa</button>
              </div>
            </header>

            <div class="disease-card__body">
              <section v-if="item.nguyen_tac" class="disease-section">
                <span class="disease-section__label">Pháp trị</span>
                <p class="disease-section__text">{{ item.nguyen_tac }}</p>
              </section>

              <section v-if="item.kinh_mach_list?.length" class="disease-section">
                <span class="disease-section__label">Tạng phủ</span>
                <div class="chip-row chip-row--wrap">
                  <span v-for="k in item.kinh_mach_list" :key="k.idKinhMach" class="chip chip-tang">
                    {{ kinhMachLabel(k) }}
                  </span>
                </div>
              </section>

              <section v-if="parseLucKinh(item.luc_kinh).length" class="disease-section">
                <span class="disease-section__label">Tổn thương - Tác nhân</span>
                <div class="chip-row chip-row--wrap">
                  <span
                    v-for="(lk, i) in parseLucKinh(item.luc_kinh)"
                    :key="i"
                    class="chip chip-luckinh"
                  >
                    {{ lk }}
                  </span>
                </div>
              </section>

              <section v-if="trieuChungCellLabels(item).length" class="disease-section">
                <span class="disease-section__label">Triệu chứng</span>
                <div class="chip-row chip-row--wrap">
                  <span v-for="(t, i) in trieuChungCellLabels(item)" :key="i" class="chip chip-trieu">
                    {{ t }}
                  </span>
                </div>
              </section>

              <section v-if="baiThuocCellItems(item).length" class="disease-section">
                <span class="disease-section__label">Bài thuốc tiêu biểu</span>
                <div class="chip-row chip-row--wrap">
                  <template v-for="(b, i) in baiThuocCellItems(item)" :key="i">
                    <a
                      v-if="b.id != null"
                      :href="baiThuocHref(b.id)"
                      target="_blank"
                      rel="noopener"
                      class="chip chip-bai chip-link"
                      :title="`Mở bài thuốc: ${b.name}`"
                    >
                      {{ b.name }}
                    </a>
                    <span v-else class="chip chip-bai">{{ b.name }}</span>
                  </template>
                </div>
              </section>

              <p
                v-if="
                  !item.nguyen_tac &&
                  !item.kinh_mach_list?.length &&
                  !item.luc_kinh &&
                  !trieuChungCellLabels(item).length &&
                  !baiThuocCellLabels(item).length
                "
                class="disease-empty muted"
              >
                Chưa gắn dữ liệu liên quan.
              </p>
            </div>
          </article>
        </div>

        <div v-if="totalPages > 1" class="pagination">
          <button class="page-btn" :disabled="currentPage <= 1" @click="currentPage--">‹</button>
          <button
            v-for="pn in getPageNumbers()"
            :key="pn"
            class="page-btn"
            :class="{ active: pn === currentPage }"
            @click="currentPage = pn"
          >
            {{ pn }}
          </button>
          <button class="page-btn" :disabled="currentPage >= totalPages" @click="currentPage++">›</button>
          <span class="page-info">Trang {{ currentPage }} / {{ totalPages }}</span>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal modal--wide" @click.stop>
        <div class="modal-header">
          <h3>{{ editingId != null ? 'Sửa pháp trị' : 'Thêm pháp trị' }}</h3>
          <button type="button" class="modal-close" aria-label="Đóng" @click="closeModal">✕</button>
        </div>
        <form class="modal-body modal-body--loadable" @submit.prevent="handleSubmit">
          <div v-if="formLoading" class="modal-loading-overlay">
            <div class="spinner spinner--sm"></div>
            <span>Đang tải dữ liệu…</span>
          </div>
          <p v-if="formError" class="form-error">{{ formError }}</p>

          <div class="form-grid">
            <label class="field field--full">
              <span>Thể bệnh</span>
              <input v-model="form.chung_trang" class="input" placeholder="vd. Phong hàn xâm nhập biểu" />
            </label>

            <label class="field field--full">
              <span>Pháp trị</span>
              <textarea
                v-model="form.nguyen_tac"
                class="textarea"
                rows="2"
                placeholder="vd. Khu phong, tán hàn, giải biểu"
              ></textarea>
            </label>

            <div class="field field--full">
              <div class="field-head">
                <span class="field-label">Tổn thương - Tác nhân</span>
                <span class="field-count">{{ form.luc_kinh_list.length }} đã chọn</span>
              </div>
              <div v-if="lucKinhOptionNames.length === 0" class="muted">
                Chưa có dữ liệu — thêm ở tab "Bệnh đo kinh lạc → Tổn thương - Tác nhân"
              </div>
              <div v-else class="chip-picker">
                <button
                  v-for="opt in lucKinhOptionNames"
                  :key="opt"
                  type="button"
                  class="chip-toggle"
                  :class="{ active: form.luc_kinh_list.includes(opt) }"
                  @click="toggleLucKinh(opt)"
                >
                  {{ opt }}
                </button>
              </div>
              <small class="field-hint">Có thể chọn nhiều. Bấm lại lựa chọn đang chọn để bỏ.</small>
            </div>

            <div class="field field--full">
              <div class="field-head">
                <span class="field-label">Tạng phủ (Kinh mạch)</span>
                <span class="field-count">{{ form.id_kinh_mach_list.length }} đã chọn</span>
              </div>
              <div v-if="kinhMachOptions.length === 0" class="muted">Chưa có dữ liệu kinh mạch</div>
              <template v-else>
                <div class="picker-search">
                  <input
                    v-model="kinhMachSearch"
                    type="search"
                    class="input input--sm"
                    placeholder="Tìm tạng phủ..."
                  />
                  <button
                    v-if="kinhMachSearch"
                    type="button"
                    class="picker-clear"
                    @click="kinhMachSearch = ''"
                    aria-label="Xóa tìm kiếm"
                  >
                    ✕
                  </button>
                </div>
                <div class="chip-picker chip-picker--scroll">
                  <button
                    v-for="k in filteredKinhMachOptions"
                    :key="k.idKinhMach"
                    type="button"
                    class="chip-toggle"
                    :class="{ active: form.id_kinh_mach_list.includes(k.idKinhMach) }"
                    @click="form.id_kinh_mach_list = toggleMultiId(form.id_kinh_mach_list, k.idKinhMach)"
                  >
                    {{ kinhMachLabel(k) }}
                  </button>
                  <span v-if="filteredKinhMachOptions.length === 0" class="muted">
                    Không khớp "{{ kinhMachSearch }}"
                  </span>
                </div>
              </template>
            </div>

            <div class="field field--full">
              <div class="field-head">
                <span class="field-label">Triệu chứng</span>
                <span class="field-count">{{ form.id_trieu_chung_list.length }} đã chọn</span>
              </div>
              <div v-if="trieuChungOptions.length === 0" class="muted">Chưa có dữ liệu triệu chứng</div>
              <template v-else>
                <div class="picker-search">
                  <input
                    v-model="trieuChungSearch"
                    type="search"
                    class="input input--sm"
                    placeholder="Tìm triệu chứng..."
                  />
                  <button
                    v-if="trieuChungSearch"
                    type="button"
                    class="picker-clear"
                    @click="trieuChungSearch = ''"
                    aria-label="Xóa tìm kiếm"
                  >
                    ✕
                  </button>
                </div>
                <div class="chip-picker chip-picker--scroll">
                  <button
                    v-for="t in filteredTrieuChungOptions"
                    :key="t.id"
                    type="button"
                    class="chip-toggle"
                    :class="{ active: form.id_trieu_chung_list.includes(t.id) }"
                    @click="form.id_trieu_chung_list = toggleMultiId(form.id_trieu_chung_list, t.id)"
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
                  <span v-if="filteredTrieuChungOptions.length === 0 && !canCreateTrieuChung" class="muted">
                    Không khớp "{{ trieuChungSearch }}"
                  </span>
                </div>
              </template>
            </div>

            <div class="field field--full">
              <div class="field-head">
                <span class="field-label">Bài thuốc tiêu biểu</span>
                <span class="field-count">{{ form.id_bai_thuoc_list.length }} đã chọn</span>
              </div>
              <div v-if="baiThuocOptions.length === 0" class="muted">Chưa có dữ liệu bài thuốc</div>
              <template v-else>
                <div class="picker-search">
                  <input
                    v-model="baiThuocSearch"
                    type="search"
                    class="input input--sm"
                    placeholder="Tìm bài thuốc..."
                  />
                  <button
                    v-if="baiThuocSearch"
                    type="button"
                    class="picker-clear"
                    @click="baiThuocSearch = ''"
                    aria-label="Xóa tìm kiếm"
                  >
                    ✕
                  </button>
                </div>
                <div class="chip-picker chip-picker--scroll">
                  <button
                    v-for="b in filteredBaiThuocOptions"
                    :key="b.id"
                    type="button"
                    class="chip-toggle"
                    :class="{ active: form.id_bai_thuoc_list.includes(b.id) }"
                    @click="form.id_bai_thuoc_list = toggleMultiId(form.id_bai_thuoc_list, b.id)"
                  >
                    {{ b.ten_bai_thuoc }}
                  </button>
                  <span v-if="filteredBaiThuocOptions.length === 0" class="muted">
                    Không khớp "{{ baiThuocSearch }}"
                  </span>
                </div>
              </template>
              <small class="field-hint">Bài đầu tiên được chọn sẽ là "bài thuốc chính" liên kết với pháp trị.</small>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" :disabled="isSubmitting" @click="closeModal">Hủy</button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Đang lưu…' : 'Lưu' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal modal--sm" @click.stop>
        <div class="modal-header">
          <h3>Xác nhận xóa</h3>
          <button type="button" class="modal-close" @click="showDeleteConfirm = false">✕</button>
        </div>
        <div class="modal-body">
          <p>
            Xóa pháp trị
            <strong>#{{ deletingItem?.id }} — {{ deletingItem?.chung_trang || deletingItem?.nguyen_tac || '(không tên)' }}</strong>?
            Thao tác không hoàn tác.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" :disabled="isSubmitting" @click="showDeleteConfirm = false">Hủy</button>
          <button type="button" class="btn-danger" :disabled="isSubmitting" @click="handleDelete">
            {{ isSubmitting ? 'Đang xóa…' : 'Xóa' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.management-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-8);
  animation: fadeIn 0.4s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 2px solid var(--brown-100);
}
.header-content { flex: 1; min-width: 200px; }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--brown-800); margin-bottom: var(--space-1); }
.page-subtitle { color: var(--gray-500); font-size: var(--font-size-md); }

.btn-primary {
  padding: var(--space-3) var(--space-5);
  background: var(--brown-600);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.btn-primary:hover { background: var(--brown-700); }
.btn-secondary {
  padding: var(--space-3) var(--space-5);
  background: var(--white);
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary:hover { background: var(--gray-50); }
.btn-danger {
  padding: var(--space-3) var(--space-5);
  background: var(--danger);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
}
.mt-4 { margin-top: var(--space-4); }

.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-4);
}
.search-wrap { display: flex; flex-direction: column; gap: var(--space-1); flex: 1; min-width: 200px; max-width: 520px; }
.search-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.04em; }
.search-input { padding: var(--space-2) var(--space-3); border: 1px solid var(--gray-200); border-radius: var(--radius-md); font-size: var(--font-size-md); }
.toolbar-count { font-size: var(--font-size-sm); color: var(--gray-500); font-weight: 600; }

.sub-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  border-bottom: 1px solid var(--brown-100);
  padding-bottom: 0;
  flex-wrap: wrap;
}
.sub-tab {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 1px solid transparent;
  border-bottom: none;
  background: transparent;
  color: var(--gray-600);
  font-weight: 600;
  font-size: var(--font-size-sm);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  cursor: pointer;
  transition: all var(--transition-base);
  margin-bottom: -1px;
}
.sub-tab:hover { color: var(--brown-600); background: var(--brown-50); }
.sub-tab.active {
  background: var(--white);
  color: var(--brown-700);
  border-color: var(--brown-200);
  border-bottom-color: var(--white);
}
.sub-tab__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  background: var(--gray-100);
  color: var(--gray-600);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
}
.sub-tab.active .sub-tab__count { background: var(--brown-600); color: var(--white); }

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

.extra-filters {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: var(--space-3);
}
.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.filter-row__label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--gray-500);
  flex-shrink: 0;
  min-width: 90px;
}
.sub-sub-tabs--inline { margin-bottom: 0; flex: 1; gap: 4px; }
.sub-sub-tabs--inline .sub-sub-tab {
  padding: 2px 8px;
  font-size: 11px;
}
.sub-sub-tabs--inline .sub-sub-tab__count {
  min-width: 16px;
  height: 14px;
  padding: 0 4px;
  font-size: 9px;
  border-radius: 7px;
}
.sub-sub-tabs--alt .sub-sub-tab.active {
  background: var(--chip-pattern-bg);
  color: var(--chip-pattern-fg);
  border-color: var(--chip-pattern-border);
}
.sub-sub-tabs--alt .sub-sub-tab.active .sub-sub-tab__count {
  background: var(--chip-pattern-fg);
  color: var(--white);
}
.filter-clear-btn {
  margin-left: auto;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  color: var(--gray-500);
  background: transparent;
  border: 0;
  cursor: pointer;
  text-decoration: underline;
}
.filter-clear-btn:hover { color: var(--brown-700); }

.data-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm); position: relative; }
.data-card--loading { pointer-events: none; }
.data-card--loading .disease-grid { opacity: 0.55; transition: opacity .15s; }

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
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr));
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--surface-2);
}

.disease-card {
  display: flex;
  flex-direction: column;
  background: var(--white);
  border: 1px solid var(--brown-100);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(74, 47, 23, 0.04);
  transition: box-shadow var(--transition-fast), transform var(--transition-fast),
    border-color var(--transition-fast);
}
.disease-card:hover {
  box-shadow: 0 6px 18px rgba(74, 47, 23, 0.08);
  border-color: var(--brown-200);
  transform: translateY(-1px);
}
.disease-card--highlight {
  border-color: #d97706;
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.25), 0 6px 18px rgba(217, 119, 6, 0.18);
  animation: pt-flash 2.5s ease-out;
}
@keyframes pt-flash {
  0%   { background-color: #fff7ed; }
  60%  { background-color: #fff7ed; }
  100% { background-color: #fff; }
}

.disease-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(135deg, var(--brown-50) 0%, #fff 100%);
  border-bottom: 1px solid var(--brown-100);
}
.disease-card__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  flex: 1;
  flex-wrap: wrap;
}
.chip-row--inline { gap: 4px; }
.chip-row--inline .chip { white-space: normal; word-break: break-word; }
.bty-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1 1 100%;
  min-width: 0;
  margin-top: 2px;
}
.bty-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--chip-brand-bg);
  border: 1px solid var(--chip-brand-border);
  border-radius: var(--radius-md);
  max-width: 100%;
}
.bty-group__label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--chip-brand-fg);
  white-space: nowrap;
}
.bty-group .chip-row { flex: 1 1 auto; min-width: 0; }
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
.disease-card__name {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--brown-900);
  line-height: 1.35;
  word-break: break-word;
}
.disease-card__body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4) var(--space-4);
}
.disease-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.disease-section__label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gray-500);
}
.disease-section__text {
  margin: 0;
  font-size: var(--font-size-md);
  color: var(--gray-800);
  line-height: 1.5;
  word-break: break-word;
}
.disease-empty {
  margin: 0;
  font-size: var(--font-size-sm);
  text-align: center;
  padding: var(--space-3) 0;
}

.chip-row { display: flex; flex-wrap: wrap; gap: 4px; }
.chip-row--wrap {
  flex-wrap: wrap;
  gap: 6px;
}
.chip-row--wrap .chip {
  white-space: normal;
  word-break: break-word;
  max-width: 100%;
}
.chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-full, 999px);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  border: 1px solid transparent;
}
.chip-tang { background: var(--chip-pattern-bg); color: var(--chip-pattern-fg); border-color: var(--chip-pattern-border); }
.chip-trieu { background: var(--chip-symptom-bg); color: var(--chip-symptom-fg); border-color: var(--chip-symptom-border); }
.chip-bai { background: var(--chip-herb-bg); color: var(--chip-herb-fg); border-color: var(--chip-herb-border); }
.chip-luckinh { background: #fce7f3; color: #9d174d; border-color: #f9a8d4; }
.chip-tayy { background: var(--chip-brand-bg); color: var(--chip-brand-fg); border-color: var(--chip-brand-border); }
.chip-link { text-decoration: none; cursor: pointer; transition: background-color 0.15s, border-color 0.15s, transform 0.05s; }
.chip-link:hover { background: var(--chip-brand-bg); border-color: var(--chip-brand-fg); }
.chip-link:active { transform: translateY(1px); }
.muted { color: var(--gray-400); font-style: italic; }

.row-actions { display: flex; gap: 6px; flex-wrap: wrap; }
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
.btn-edit:hover { background: var(--brown-50); border-color: var(--brown-400); color: var(--brown-700); }
.btn-delete { color: var(--danger); }
.btn-delete:hover { background: var(--danger-bg); border-color: var(--danger-border); }

.pagination { display: flex; align-items: center; justify-content: center; gap: var(--space-2); padding: var(--space-4); background: var(--gray-50); border-top: 1px solid var(--gray-100); }
.page-btn { min-width: 32px; height: 32px; padding: 0 8px; display: flex; align-items: center; justify-content: center; background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-600); cursor: pointer; transition: all var(--transition-fast); }
.page-btn:hover:not(:disabled) { border-color: var(--brown-400); color: var(--brown-700); background: var(--brown-50); }
.page-btn.active { background: var(--brown-600); border-color: var(--brown-600); color: var(--white); }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { margin-left: var(--space-4); font-size: var(--font-size-xs); color: var(--gray-500); font-weight: 600; }

.text-center { text-align: center !important; }
.py-8 { padding-top: 2rem !important; padding-bottom: 2rem !important; }
.font-bold { font-weight: 700 !important; }
.text-brown-900 { color: var(--brown-900) !important; font-weight: 600; }
.text-gray-500 { color: var(--gray-500) !important; }

.badge { display: inline-block; padding: 4px 10px; border-radius: var(--radius-full, 999px); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-success { background: var(--success-bg); color: var(--success-fg); }

.loading-state { display: flex; flex-direction: column; align-items: center; padding: var(--space-12) 0; color: var(--brown-600); }
.spinner { width: 32px; height: 32px; border: 3px solid var(--gray-200); border-top-color: var(--brown-500); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-state { text-align: center; padding: var(--space-8); color: var(--danger); background: var(--danger-bg); border-radius: var(--radius-lg); }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; padding: var(--space-4);
}
.modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg, 0 20px 25px -5px rgba(0,0,0,0.1));
  overflow: hidden;
}
.modal--wide { max-width: 880px; }
.modal--sm { max-width: 440px; }
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--gray-100);
}
.modal-header h3 { margin: 0; font-size: var(--font-size-lg); font-weight: 700; color: var(--brown-800); }
.modal-close { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--gray-500); }
.modal-close:hover { color: var(--gray-800); }
.modal-body { padding: var(--space-5); overflow-y: auto; flex: 1; }
.modal-footer {
  display: flex; gap: var(--space-2); justify-content: flex-end;
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--gray-100);
  background: var(--gray-50);
}

.form-error {
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger-border);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);
  font-size: var(--font-size-sm);
}

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.field { display: flex; flex-direction: column; gap: 4px; }
.field--full { grid-column: 1 / -1; }
.field > span,
.field-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-700); }
.field-hint { font-size: 11px; color: var(--gray-500); margin-top: 2px; }

.input, .textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-family: inherit;
}
.input:focus, .textarea:focus {
  outline: none;
  border-color: var(--brown-500);
  box-shadow: var(--focus-ring);
}
.textarea { resize: vertical; min-height: 60px; }

.field-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}
.field-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--brown-600);
  background: var(--brown-50);
  padding: 1px 8px;
  border-radius: var(--radius-full, 999px);
}

.picker-search {
  position: relative;
  margin-bottom: 6px;
}
.picker-search .input--sm {
  padding-right: 28px;
}
.input--sm {
  padding: 6px 10px;
  font-size: 13px;
}
.picker-clear {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-100);
  border: none;
  border-radius: 50%;
  color: var(--gray-600);
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
}
.picker-clear:hover { background: var(--gray-200); color: var(--gray-800); }

.chip-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: var(--space-2);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: var(--gray-50);
}
.chip-picker--scroll { max-height: 180px; overflow-y: auto; }
.chip-toggle {
  padding: 4px 10px;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-full, 999px);
  border: 1px solid var(--gray-300);
  background: var(--white);
  color: var(--gray-700);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.chip-toggle:hover { border-color: var(--brown-400); color: var(--brown-700); }
.chip-toggle.active {
  background: var(--brown-600);
  color: var(--white);
  border-color: var(--brown-600);
}
.chip-create { border-style: dashed; border-color: var(--brown-400); color: var(--brown-700); background: var(--brown-50); }
.chip-create:hover:not(:disabled) { background: var(--brown-100); border-color: var(--brown-500); }
.chip-create:disabled { opacity: 0.6; cursor: not-allowed; }

/* ─── Responsive: lưới thẻ, phân trang, biểu mẫu, modal ─── */
@media (max-width: 768px) {
  .search-wrap { max-width: none; }
  /* giảm padding lưới + thanh tiêu đề thẻ để có thêm bề ngang */
  .disease-grid { padding: var(--space-3); gap: var(--space-3); }
  .card-header { padding: var(--space-3) var(--space-4); gap: var(--space-2); flex-wrap: wrap; }
  /* phân trang: cho phép xuống dòng, "Trang x / y" rớt xuống hàng riêng */
  .pagination { flex-wrap: wrap; gap: 6px; padding: var(--space-3); }
  .page-info { margin-left: 0; flex: 1 1 100%; text-align: center; }
}
@media (max-width: 640px) {
  /* 3 nhóm Đông Y / Tây Y / Tất Cả: luôn gọn 1 hàng, chia đều bề ngang */
  .sub-tabs { flex-wrap: nowrap; }
  .sub-tab { flex: 1 1 0; justify-content: center; padding: var(--space-2); white-space: nowrap; }
  /* biểu mẫu trong modal: 2 cột → 1 cột cho dễ nhập trên điện thoại */
  .form-grid { grid-template-columns: 1fr; }
  .modal { max-height: 95vh; }
  .modal-body { padding: var(--space-4); }
  .modal-header, .modal-footer { padding: var(--space-3) var(--space-4); }
}
</style>
