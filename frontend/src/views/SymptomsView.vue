<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'

// matched = chip đến từ ≥1 Pháp Trị thuộc bộ lọc đang chọn (in đậm); !matched = làm mờ, ẩn sau "xem thêm".
interface BenhTayYLite {
  id: number
  ten_benh: string
  matched: boolean
  chungBenh?: string | null
  chungBenhId?: number | null
}
interface BaiThuocLite {
  id: number
  ten_bai_thuoc: string
  matched: boolean
}
interface TheBenhItem {
  ten: string
  matched: boolean
  // Pháp Trị đại diện chứa thể bệnh này — để deeplink mở thẳng Pháp Trị (thể bệnh dẫn xuất qua Pháp Trị).
  phapTriId?: number | null
}
interface FilterOption {
  id: number
  name: string
}
interface Symptom {
  id: number
  ten_trieu_chung: string
  theBenhList?: TheBenhItem[]
  baiThuocList?: BaiThuocLite[]
  benhTayYList?: BenhTayYLite[]
  doPhoBien?: number
}

// ----- Chẩn đoán (diagnosis) -----
interface DiagnosisMatchedSymptom {
  id: number
  ten_trieu_chung: string
}
// Đông Y: pháp trị thành phần của một thể bệnh (để mở/đối chiếu).
interface DiagnosisPhapTriRef {
  id: number
  nguyen_tac: string | null
  matchedCount: number
}
// Tây Y: pháp trị cầu nối (đối chiếu chuỗi triệu chứng → pháp trị → bệnh).
interface DiagnosisViaRef {
  id: number
  label: string
  percent: number
}
interface DiagnosisCandidate {
  id: number
  label: string
  subLabel: string | null
  groupLabel: string | null
  groupId: number | null
  score: number
  percent: number
  matchedCount: number
  total: number
  matched: DiagnosisMatchedSymptom[]
  members?: DiagnosisPhapTriRef[]
  via?: DiagnosisViaRef[]
}
interface DiagnosisResult {
  input: DiagnosisMatchedSymptom[]
  phapTri: DiagnosisCandidate[]
  phapTriTotal: number
  benhTayY: DiagnosisCandidate[]
  benhTayYTotal: number
}

// Số chip tối đa hiển thị trong mỗi ô trước khi gộp phần còn lại thành "+N".
const CHIP_LIMIT = 6

const router = useRouter()

type MainTab = 'list' | 'diagnose'
const activeTab = ref<MainTab>('list')

const isLoading = ref(true)
const error = ref<string | null>(null)
const dataList = ref<Symptom[]>([])

// ----- Bộ lọc cấu trúc (đều áp lên Pháp Trị vì triệu chứng thừa hưởng qua Pháp Trị) -----
const filterCategory = ref<'all' | 'dong-y' | 'tay-y'>('all')
const selectedTangPhuIds = ref<number[]>([])
const selectedTonThuong = ref<string[]>([])
const tangPhuOptions = ref<FilterOption[]>([])
const tonThuongOptions = ref<FilterOption[]>([])
const hasActiveFilter = computed(
  () =>
    filterCategory.value !== 'all' ||
    selectedTangPhuIds.value.length > 0 ||
    selectedTonThuong.value.length > 0,
)
// Cell đang mở rộng (hiện phần "mờ"): key = `${rowId}:${dim}`.
const expandedCells = ref<Set<string>>(new Set())

// Modal state
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const formData = ref<{ ten_trieu_chung: string }>({ ten_trieu_chung: '' })
const isSaving = ref(false)

// Delete confirmation
const showDeleteModal = ref(false)
const deletingId = ref<number | null>(null)
const isDeleting = ref(false)

// Tìm kiếm danh sách
const searchQuery = ref('')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

// ----- Diagnosis state -----
const selectedSymptomIds = ref<number[]>([])
const symptomSearch = ref('')
const isDiagnosing = ref(false)
const diagError = ref<string | null>(null)
const diagResult = ref<DiagnosisResult | null>(null)
const hasRunDiagnosis = ref(false)

// Thu gọn kết quả: mặc định chỉ hiện top N mỗi cột, bấm để xem thêm (gọn trên màn nhỏ).
const DIAG_COLLAPSED_COUNT = 3
const expandDongY = ref(false)
const expandTayY = ref(false)
const phapTriShown = computed(() => {
  const list = diagResult.value?.phapTri ?? []
  return expandDongY.value ? list : list.slice(0, DIAG_COLLAPSED_COUNT)
})
const benhTayYShown = computed(() => {
  const list = diagResult.value?.benhTayY ?? []
  return expandTayY.value ? list : list.slice(0, DIAG_COLLAPSED_COUNT)
})
// ----- Combobox tìm kiếm (typeahead) -----
const showSearchDropdown = ref(false)
const activeIndex = ref(0)
const showAllSymptoms = ref(false)
const SEARCH_LIMIT = 40

onMounted(async () => {
  await fetchData()
})

async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    // stats=1: trả kèm thể bệnh / bài thuốc / bệnh Tây Y (mỗi chip có cờ matched theo bộ lọc) + option lọc.
    const params = new URLSearchParams({ stats: '1' })
    if (filterCategory.value !== 'all') params.set('category', filterCategory.value)
    if (selectedTangPhuIds.value.length) params.set('tangPhu', selectedTangPhuIds.value.join(','))
    if (selectedTonThuong.value.length) params.set('tonThuong', selectedTonThuong.value.join('||'))
    const res: any = await api.get(`/trieu-chung?${params.toString()}`)
    const payload = Array.isArray(res) ? { data: res } : res || {}
    dataList.value = payload.data || []
    tangPhuOptions.value = payload.tangPhuOptions ?? tangPhuOptions.value
    tonThuongOptions.value = payload.tonThuongOptions ?? tonThuongOptions.value
  } catch (err: any) {
    console.error(err)
    error.value = 'Lỗi khi tải dữ liệu: ' + err.message
  } finally {
    isLoading.value = false
  }
}

function toggleTangPhu(id: number) {
  selectedTangPhuIds.value = selectedTangPhuIds.value.includes(id)
    ? selectedTangPhuIds.value.filter((x) => x !== id)
    : [...selectedTangPhuIds.value, id]
}
function toggleTonThuong(name: string) {
  selectedTonThuong.value = selectedTonThuong.value.includes(name)
    ? selectedTonThuong.value.filter((x) => x !== name)
    : [...selectedTonThuong.value, name]
}
function clearFilters() {
  filterCategory.value = 'all'
  selectedTangPhuIds.value = []
  selectedTonThuong.value = []
}

// ----- Chip cell: matched (đậm) lên trước, other (mờ) ẩn sau "xem thêm" -----
function cellKey(rowId: number, dim: string): string {
  return `${rowId}:${dim}`
}
function toggleCell(key: string) {
  const s = new Set(expandedCells.value)
  if (s.has(key)) s.delete(key)
  else s.add(key)
  expandedCells.value = s
}
function isCellExpanded(key: string): boolean {
  return expandedCells.value.has(key)
}
/** Chip hiển thị: mở rộng → tất cả; không lọc → CHIP_LIMIT đầu; có lọc → toàn bộ matched (đậm). */
function shownChips<T extends { matched: boolean }>(list: T[] | undefined, key: string): T[] {
  const arr = list ?? []
  if (isCellExpanded(key)) return arr
  if (!hasActiveFilter.value) return arr.slice(0, CHIP_LIMIT)
  return arr.filter((x) => x.matched)
}
/** Số chip bị ẩn khi thu gọn (không lọc: vượt CHIP_LIMIT; có lọc: phần "other" mờ). */
function overflowCount<T extends { matched: boolean }>(list: T[] | undefined): number {
  const arr = list ?? []
  if (!hasActiveFilter.value) return Math.max(0, arr.length - CHIP_LIMIT)
  return arr.filter((x) => !x.matched).length
}
function chipMod(matched: boolean): string {
  return hasActiveFilter.value ? (matched ? 'chip--match' : 'chip--dim') : ''
}
/** Nhãn nút mở rộng: đang mở → "Thu gọn"; có lọc → "+N ngoài lọc"; không lọc → "+N". */
function toggleLabel<T extends { matched: boolean }>(list: T[] | undefined, key: string): string {
  if (isCellExpanded(key)) return 'Thu gọn'
  const n = overflowCount(list)
  return hasActiveFilter.value ? `+${n} ngoài lọc` : `+${n}`
}

// ----- Bệnh Tây Y: nhóm theo Chủng Bệnh → bệnh nhỏ -----
const GROUP_LIMIT = 3 // số nhóm Chủng Bệnh hiện khi thu gọn (lúc không lọc)
interface BtyGroup {
  key: string
  name: string
  items: BenhTayYLite[]
  hasMatched: boolean
}
function benhTayYGroups(list: BenhTayYLite[] | undefined): BtyGroup[] {
  const map = new Map<string, BtyGroup>()
  for (const b of list ?? []) {
    const name = (b.chungBenh || '').trim() || 'Khác'
    const key = name.toLowerCase()
    let g = map.get(key)
    if (!g) {
      g = { key, name, items: [], hasMatched: false }
      map.set(key, g)
    }
    g.items.push(b)
    if (b.matched) g.hasMatched = true
  }
  for (const g of map.values()) {
    g.items.sort(
      (a, b) => Number(b.matched) - Number(a.matched) || a.ten_benh.localeCompare(b.ten_benh, 'vi'),
    )
  }
  // 'Khác' xuống cuối; còn lại nhóm có matched lên trước rồi theo tên.
  return [...map.values()].sort((a, b) => {
    if ((a.name === 'Khác') !== (b.name === 'Khác')) return a.name === 'Khác' ? 1 : -1
    return Number(b.hasMatched) - Number(a.hasMatched) || a.name.localeCompare(b.name, 'vi')
  })
}
function shownBtyGroups(item: Symptom): BtyGroup[] {
  const groups = benhTayYGroups(item.benhTayYList)
  if (isCellExpanded(cellKey(item.id, 'benh'))) return groups
  if (hasActiveFilter.value) return groups.filter((g) => g.hasMatched)
  return groups.slice(0, GROUP_LIMIT)
}
function hiddenBtyGroupCount(item: Symptom): number {
  const groups = benhTayYGroups(item.benhTayYList)
  if (hasActiveFilter.value) return groups.filter((g) => !g.hasMatched).length
  return Math.max(0, groups.length - GROUP_LIMIT)
}
function btyToggleLabel(item: Symptom): string {
  if (isCellExpanded(cellKey(item.id, 'benh'))) return 'Thu gọn'
  const n = hiddenBtyGroupCount(item)
  return hasActiveFilter.value ? `+${n} nhóm ngoài lọc` : `+${n} nhóm`
}

function openCreateModal() {
  isEditing.value = false
  editingId.value = null
  formData.value = { ten_trieu_chung: '' }
  showModal.value = true
}

function openEditModal(item: Symptom) {
  isEditing.value = true
  editingId.value = item.id
  formData.value = { ten_trieu_chung: item.ten_trieu_chung }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function handleSave() {
  if (!formData.value.ten_trieu_chung.trim()) {
    alert('Vui lòng nhập tên triệu chứng')
    return
  }
  isSaving.value = true
  try {
    if (isEditing.value && editingId.value !== null) {
      await api.put(`/trieu-chung/${editingId.value}`, formData.value)
    } else {
      await api.post('/trieu-chung', formData.value)
    }
    closeModal()
    await fetchData()
  } catch (err: any) {
    console.error(err)
    alert('Lỗi khi lưu: ' + err.message)
  } finally {
    isSaving.value = false
  }
}

function openDeleteModal(id: number) {
  deletingId.value = id
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deletingId.value = null
}

async function handleDelete() {
  if (deletingId.value === null) return
  isDeleting.value = true
  try {
    await api.delete(`/trieu-chung/${deletingId.value}`)
    closeDeleteModal()
    await fetchData()
  } catch (err: any) {
    console.error(err)
    alert('Lỗi khi xóa: ' + err.message)
  } finally {
    isDeleting.value = false
  }
}

// Lọc theo tên triệu chứng kèm thể bệnh / bài thuốc / bệnh Tây Y hiển thị trong bảng.
const filteredList = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return dataList.value
  return dataList.value.filter((item) => {
    if (item.ten_trieu_chung.toLowerCase().includes(q)) return true
    if (item.theBenhList?.some((tb) => tb.ten.toLowerCase().includes(q))) return true
    if (item.baiThuocList?.some((b) => b.ten_bai_thuoc.toLowerCase().includes(q))) return true
    if (item.benhTayYList?.some((b) => b.ten_benh.toLowerCase().includes(q))) return true
    return false
  })
})

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredList.value.slice(start, start + itemsPerPage.value)
})

const totalPages = computed(() => Math.ceil(filteredList.value.length / itemsPerPage.value))

// Về trang đầu mỗi khi đổi từ khóa để không kẹt ở trang trống.
watch(searchQuery, () => {
  currentPage.value = 1
})

// Đổi bộ lọc cấu trúc → gọi lại API (lọc server-side), reset trang & thu gọn mọi cell.
const filterKey = computed(() =>
  [
    filterCategory.value,
    [...selectedTangPhuIds.value].sort((a, b) => a - b).join(','),
    [...selectedTonThuong.value].sort().join('||'),
  ].join('|'),
)
watch(filterKey, () => {
  currentPage.value = 1
  expandedCells.value = new Set()
  fetchData()
})

function getPageNumbers() {
  const pages: number[] = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
}

// ----- Diagnosis logic -----
function phapTriHref(id: number): string {
  return router.resolve({ name: 'treatments', query: { ptId: id } }).href
}
function baiThuocHref(id: number): string {
  return router.resolve({ name: 'medicines', query: { tab: 'bai-thuoc', btId: id } }).href
}
function benhTayYHref(id: number): string {
  return router.resolve({
    name: 'western-medicine',
    query: { tab: 'benh-tay-y', btyId: id },
  }).href
}

interface SymptomOption {
  id: number
  ten_trieu_chung: string
  doPhoBien: number
}

const symptomOptions = computed<SymptomOption[]>(() =>
  dataList.value.map((s) => ({
    id: s.id,
    ten_trieu_chung: s.ten_trieu_chung,
    doPhoBien: s.doPhoBien ?? 0,
  })),
)

const filteredSymptomOptions = computed(() => {
  const q = symptomSearch.value.trim().toLowerCase()
  if (!q) return symptomOptions.value
  return symptomOptions.value.filter((s) => s.ten_trieu_chung.toLowerCase().includes(q))
})

const selectedIdSet = computed(() => new Set(selectedSymptomIds.value))

// Kết quả gợi ý cho ô tìm kiếm — loại triệu chứng đã chọn; ưu tiên khớp đầu chuỗi rồi độ phổ biến.
const searchResults = computed<SymptomOption[]>(() => {
  const q = symptomSearch.value.trim().toLowerCase()
  if (!q) return []
  return symptomOptions.value
    .filter((s) => !selectedIdSet.value.has(s.id) && s.ten_trieu_chung.toLowerCase().includes(q))
    .sort((a, b) => {
      const al = a.ten_trieu_chung.toLowerCase()
      const bl = b.ten_trieu_chung.toLowerCase()
      const aStarts = al.startsWith(q) ? 0 : 1
      const bStarts = bl.startsWith(q) ? 0 : 1
      return aStarts - bStarts || b.doPhoBien - a.doPhoBien || al.localeCompare(bl, 'vi')
    })
    .slice(0, SEARCH_LIMIT)
})

// Gợi ý nhanh khi chưa gõ — triệu chứng hay gặp nhất theo độ phổ biến.
const popularSymptoms = computed<SymptomOption[]>(() =>
  symptomOptions.value
    .filter((s) => !selectedIdSet.value.has(s.id) && s.doPhoBien > 0)
    .sort((a, b) => b.doPhoBien - a.doPhoBien || a.ten_trieu_chung.localeCompare(b.ten_trieu_chung, 'vi'))
    .slice(0, 12),
)

watch(searchResults, () => {
  activeIndex.value = 0
})

const selectedSymptoms = computed<DiagnosisMatchedSymptom[]>(() => {
  const map = new Map<number, SymptomOption>(symptomOptions.value.map((s) => [s.id, s]))
  const out: DiagnosisMatchedSymptom[] = []
  for (const id of selectedSymptomIds.value) {
    const s = map.get(id)
    if (s) out.push(s)
  }
  return out
})

function toggleSymptom(id: number) {
  selectedSymptomIds.value = selectedSymptomIds.value.includes(id)
    ? selectedSymptomIds.value.filter((x) => x !== id)
    : [...selectedSymptomIds.value, id]
}

/** Thêm 1 triệu chứng từ ô tìm kiếm rồi xoá từ khoá để gõ tiếp triệu chứng kế. */
function addSymptom(id: number) {
  if (!selectedSymptomIds.value.includes(id)) {
    selectedSymptomIds.value = [...selectedSymptomIds.value, id]
  }
  symptomSearch.value = ''
  activeIndex.value = 0
}

/** Điều hướng bàn phím trong dropdown gợi ý: ↑/↓ chọn, Enter thêm, Esc đóng. */
function onSearchKeydown(e: KeyboardEvent) {
  const list = searchResults.value
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    showSearchDropdown.value = true
    if (list.length) activeIndex.value = (activeIndex.value + 1) % list.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (list.length) activeIndex.value = (activeIndex.value - 1 + list.length) % list.length
  } else if (e.key === 'Enter') {
    if (list.length) {
      e.preventDefault()
      const pick = list[Math.min(activeIndex.value, list.length - 1)]
      if (pick) addSymptom(pick.id)
    }
  } else if (e.key === 'Escape') {
    showSearchDropdown.value = false
  }
}

/** Tách tên triệu chứng quanh đoạn khớp từ khoá để tô sáng (tránh v-html). */
function highlightParts(text: string, q: string): { text: string; hit: boolean }[] {
  const query = q.trim()
  if (!query) return [{ text, hit: false }]
  const lower = text.toLowerCase()
  const lq = query.toLowerCase()
  const parts: { text: string; hit: boolean }[] = []
  let i = 0
  while (i < text.length) {
    const idx = lower.indexOf(lq, i)
    if (idx === -1) {
      parts.push({ text: text.slice(i), hit: false })
      break
    }
    if (idx > i) parts.push({ text: text.slice(i, idx), hit: false })
    parts.push({ text: text.slice(idx, idx + lq.length), hit: true })
    i = idx + lq.length
  }
  return parts
}

function clearSelectedSymptoms() {
  selectedSymptomIds.value = []
  diagResult.value = null
  hasRunDiagnosis.value = false
  diagError.value = null
}

async function runDiagnosis() {
  if (selectedSymptomIds.value.length === 0 || isDiagnosing.value) return
  isDiagnosing.value = true
  diagError.value = null
  expandDongY.value = false
  expandTayY.value = false
  try {
    const res = await api.post<DiagnosisResult>('/trieu-chung/chan-doan', {
      trieu_chung_ids: selectedSymptomIds.value,
    })
    diagResult.value = res
    hasRunDiagnosis.value = true
  } catch (err: any) {
    console.error(err)
    diagError.value = 'Lỗi khi chẩn đoán: ' + (err.message || String(err))
  } finally {
    isDiagnosing.value = false
  }
}

/** Phân nhóm màu theo độ tin cậy để tô badge + thanh tiến độ. */
function confidenceClass(percent: number): string {
  if (percent >= 60) return 'conf-high'
  if (percent >= 30) return 'conf-mid'
  return 'conf-low'
}

/** Tô màu phân số "khớp X/N" theo tỉ lệ bao phủ triệu chứng (bằng chứng, khác với điểm %). */
function coverageClass(matched: number, total: number): string {
  const r = total > 0 ? matched / total : 0
  if (r >= 0.66) return 'cov-high'
  if (r >= 0.33) return 'cov-mid'
  return 'cov-low'
}

/** Nhãn chữ kèm theo % để bác sĩ đọc nhanh mức độ phù hợp. */
function confidenceLabel(percent: number): string {
  if (percent >= 60) return 'Rất phù hợp'
  if (percent >= 30) return 'Khá phù hợp'
  return 'Gợi ý'
}

const hasAnyResults = computed(
  () => !!diagResult.value && (diagResult.value.phapTri.length > 0 || diagResult.value.benhTayY.length > 0),
)

/** Các triệu chứng đã nhập nhưng không khớp với bất kỳ thể bệnh / bệnh Tây Y nào.
 *  Tín hiệu cho bác sĩ: dữ liệu chưa đầy đủ hoặc cần cân nhắc lại triệu chứng đó. */
const unexplainedSymptoms = computed<DiagnosisMatchedSymptom[]>(() => {
  const res = diagResult.value
  if (!res) return []
  const matchedIds = new Set<number>()
  for (const c of res.phapTri) for (const m of c.matched) matchedIds.add(m.id)
  for (const c of res.benhTayY) for (const m of c.matched) matchedIds.add(m.id)
  return res.input.filter((s) => !matchedIds.has(s.id))
})
</script>

<template>
  <div class="management-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Quản Lý Triệu Chứng</h1>
        <p class="page-subtitle">Danh sách triệu chứng lâm sàng & công cụ gợi ý chẩn đoán</p>
      </div>
      <button v-if="activeTab === 'list'" class="btn-primary" @click="openCreateModal">+ Thêm mới</button>
    </div>

    <div class="main-tabs" role="tablist" aria-label="Chế độ xem triệu chứng">
      <button
        type="button"
        role="tab"
        class="main-tab"
        :class="{ active: activeTab === 'list' }"
        :aria-selected="activeTab === 'list'"
        @click="activeTab = 'list'"
      >
        Danh Sách
      </button>
      <button
        type="button"
        role="tab"
        class="main-tab"
        :class="{ active: activeTab === 'diagnose' }"
        :aria-selected="activeTab === 'diagnose'"
        @click="activeTab = 'diagnose'"
      >
        Chẩn Đoán
      </button>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải dữ liệu...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary mt-4" @click="fetchData">Thử lại</button>
    </div>

    <!-- TAB DANH SÁCH -->
    <div v-else-if="activeTab === 'list'" class="content-body">
      <div class="data-card">
        <div class="card-header">
          <h3>Danh Sách Triệu Chứng</h3>
          <div class="picker-search list-search">
            <svg class="search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="2" />
              <path d="m17 17-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            <input
              v-model="searchQuery"
              type="search"
              class="search-input search-input--icon"
              placeholder="Tìm triệu chứng, thể bệnh, bài thuốc, bệnh Tây Y..."
              autocomplete="off"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="search-clear"
              aria-label="Xóa tìm kiếm"
              @click="searchQuery = ''"
            >×</button>
          </div>
          <span class="badge badge-warning">{{ filteredList.length }}<template v-if="searchQuery">/{{ dataList.length }}</template> triệu chứng</span>
        </div>

        <!-- Bộ lọc cấu trúc — đều áp QUA Pháp Trị. Chip "đúng filter" in đậm, phần còn lại làm mờ + ẩn sau "xem thêm". -->
        <div class="filter-bar">
          <div class="filter-group">
            <span class="filter-label">Phân Loại</span>
            <div class="seg">
              <button type="button" :class="{ active: filterCategory === 'all' }" @click="filterCategory = 'all'">Tất Cả</button>
              <button type="button" :class="{ active: filterCategory === 'dong-y' }" @click="filterCategory = 'dong-y'">Đông Y</button>
              <button type="button" :class="{ active: filterCategory === 'tay-y' }" @click="filterCategory = 'tay-y'">Tây Y</button>
            </div>
          </div>
          <div v-if="tangPhuOptions.length" class="filter-group filter-group--grow">
            <span class="filter-label">Tạng Phủ</span>
            <div class="chip-select">
              <button
                v-for="o in tangPhuOptions"
                :key="o.id"
                type="button"
                :class="{ active: selectedTangPhuIds.includes(o.id) }"
                @click="toggleTangPhu(o.id)"
              >{{ o.name }}</button>
            </div>
          </div>
          <div v-if="tonThuongOptions.length" class="filter-group filter-group--grow">
            <span class="filter-label">Tổn Thương</span>
            <div class="chip-select">
              <button
                v-for="o in tonThuongOptions"
                :key="o.id"
                type="button"
                :class="{ active: selectedTonThuong.includes(o.name) }"
                @click="toggleTonThuong(o.name)"
              >{{ o.name }}</button>
            </div>
          </div>
          <button v-if="hasActiveFilter" type="button" class="filter-clear" @click="clearFilters">✕ Xóa Lọc</button>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th width="70">ID</th>
                <th width="220">Tên Triệu Chứng</th>
                <th>Thể Bệnh</th>
                <th>Bài Thuốc</th>
                <th>Bệnh Tây Y</th>
                <th width="140">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pagedList.length === 0">
                <td colspan="6" class="text-center py-8 text-gray-500">
                  {{ searchQuery ? `Không tìm thấy triệu chứng khớp "${searchQuery}"` : 'Chưa có dữ liệu' }}
                </td>
              </tr>
              <tr v-for="item in pagedList" :key="item.id">
                <td>#{{ item.id }}</td>
                <td class="font-bold text-brown-900">
                  {{ item.ten_trieu_chung }}
                  <span v-if="item.doPhoBien" class="pho-bien" :title="`Tham chiếu bởi ${item.doPhoBien} bản ghi`">{{ item.doPhoBien }}</span>
                </td>
                <!-- Thể bệnh: deeplink mở Pháp Trị đại diện (thể bệnh dẫn xuất qua Pháp Trị) -->
                <td>
                  <div v-if="item.theBenhList && item.theBenhList.length" class="chip-row">
                    <template
                      v-for="tb in shownChips(item.theBenhList, cellKey(item.id, 'the'))"
                      :key="tb.ten"
                    >
                      <a
                        v-if="tb.phapTriId != null"
                        :href="phapTriHref(tb.phapTriId)"
                        target="_blank"
                        rel="noopener"
                        class="chip chip-the chip-link-the"
                        :class="chipMod(tb.matched)"
                        :title="`Mở pháp trị: ${tb.ten}`"
                      >{{ tb.ten }}</a>
                      <span v-else class="chip chip-the" :class="chipMod(tb.matched)">{{ tb.ten }}</span>
                    </template>
                    <button
                      v-if="overflowCount(item.theBenhList) > 0"
                      type="button"
                      class="chip chip-more chip-toggle"
                      @click="toggleCell(cellKey(item.id, 'the'))"
                    >{{ toggleLabel(item.theBenhList, cellKey(item.id, 'the')) }}</button>
                  </div>
                  <span v-else class="empty-cell">—</span>
                </td>
                <!-- Bài thuốc: deeplink mở thẳng bài thuốc -->
                <td>
                  <div v-if="item.baiThuocList && item.baiThuocList.length" class="chip-row">
                    <a
                      v-for="b in shownChips(item.baiThuocList, cellKey(item.id, 'bai'))"
                      :key="b.id"
                      :href="baiThuocHref(b.id)"
                      target="_blank"
                      rel="noopener"
                      class="chip chip-bai chip-link-bai"
                      :class="chipMod(b.matched)"
                      :title="`Mở bài thuốc: ${b.ten_bai_thuoc}`"
                    >{{ b.ten_bai_thuoc }}</a>
                    <button
                      v-if="overflowCount(item.baiThuocList) > 0"
                      type="button"
                      class="chip chip-more chip-toggle"
                      @click="toggleCell(cellKey(item.id, 'bai'))"
                    >{{ toggleLabel(item.baiThuocList, cellKey(item.id, 'bai')) }}</button>
                  </div>
                  <span v-else class="empty-cell">—</span>
                </td>
                <!-- Bệnh Tây Y: nhóm Chủng Bệnh trong pill gọn (giống trang Bài Thuốc) -->
                <td>
                  <div v-if="item.benhTayYList && item.benhTayYList.length" class="bty-cell">
                    <div class="bty-groups">
                      <div v-for="g in shownBtyGroups(item)" :key="g.key" class="bty-group">
                        <span class="bty-group__label" :class="{ 'is-dim': hasActiveFilter && !g.hasMatched }">
                          {{ g.name }}<span class="bty-group__count">{{ g.items.length }}</span>
                        </span>
                        <div class="chip-row">
                          <a
                            v-for="b in g.items"
                            :key="b.id"
                            :href="benhTayYHref(b.id)"
                            target="_blank"
                            rel="noopener"
                            class="chip chip-tayy chip-link-tayy"
                            :class="chipMod(b.matched)"
                            :title="`Mở bệnh Tây Y: ${b.ten_benh}`"
                          >{{ b.ten_benh }}</a>
                        </div>
                      </div>
                    </div>
                    <button
                      v-if="hiddenBtyGroupCount(item) > 0"
                      type="button"
                      class="chip chip-more chip-toggle bty-toggle"
                      @click="toggleCell(cellKey(item.id, 'benh'))"
                    >{{ btyToggleLabel(item) }}</button>
                  </div>
                  <span v-else class="empty-cell">—</span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-action btn-edit" @click="openEditModal(item)">Sửa</button>
                    <button class="btn-action btn-delete" @click="openDeleteModal(item.id)">Xóa</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button class="page-btn" :disabled="currentPage <= 1" @click="currentPage--">‹</button>
          <button v-for="pn in getPageNumbers()" :key="pn" class="page-btn" :class="{ active: pn === currentPage }" @click="currentPage = pn">{{ pn }}</button>
          <button class="page-btn" :disabled="currentPage >= totalPages" @click="currentPage++">›</button>
          <span class="page-info">Trang {{ currentPage }} / {{ totalPages }}</span>
        </div>
      </div>
    </div>

    <!-- TAB CHẨN ĐOÁN -->
    <div v-else class="content-body diagnose-body">
      <div class="diagnose-grid">
        <!-- Cột trái: nhập triệu chứng -->
        <section class="panel input-panel">
          <header class="panel-head">
            <div class="panel-head__title">
              <span class="step-badge">1</span>
              <h3>Triệu chứng của bệnh nhân</h3>
            </div>
            <span class="pill-count" :class="{ 'pill-count--on': selectedSymptomIds.length > 0 }">
              {{ selectedSymptomIds.length }}
            </span>
          </header>
          <div class="panel-body">
            <!-- Ô tìm kiếm dạng combobox: gõ → gợi ý tức thời (↑/↓/Enter), chọn là thêm vào danh sách. -->
            <div class="combo">
              <div class="picker-search">
                <svg class="search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="2" />
                  <path d="m17 17-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
                <input
                  v-model="symptomSearch"
                  type="text"
                  class="search-input search-input--icon"
                  placeholder="Nhập tên triệu chứng để tìm…"
                  autocomplete="off"
                  role="combobox"
                  aria-controls="symptom-search-list"
                  :aria-expanded="showSearchDropdown && !!symptomSearch.trim()"
                  @focus="showSearchDropdown = true"
                  @blur="showSearchDropdown = false"
                  @keydown="onSearchKeydown"
                />
                <button
                  v-if="symptomSearch"
                  type="button"
                  class="search-clear"
                  aria-label="Xóa tìm kiếm"
                  @mousedown.prevent="symptomSearch = ''"
                >×</button>
              </div>

              <ul
                v-if="showSearchDropdown && symptomSearch.trim()"
                id="symptom-search-list"
                class="combo-dropdown"
                role="listbox"
              >
                <li v-if="!searchResults.length" class="combo-empty">
                  Không tìm thấy triệu chứng khớp “{{ symptomSearch }}”
                </li>
                <li
                  v-for="(s, i) in searchResults"
                  :key="s.id"
                  role="option"
                  :aria-selected="i === activeIndex"
                >
                  <button
                    type="button"
                    class="combo-option"
                    :class="{ active: i === activeIndex }"
                    @mousedown.prevent="addSymptom(s.id)"
                    @mouseenter="activeIndex = i"
                  >
                    <span class="combo-option__name">
                      <span
                        v-for="(p, pi) in highlightParts(s.ten_trieu_chung, symptomSearch)"
                        :key="pi"
                        :class="{ hl: p.hit }"
                      >{{ p.text }}</span>
                    </span>
                    <span
                      v-if="s.doPhoBien"
                      class="combo-option__count"
                      :title="`Tham chiếu bởi ${s.doPhoBien} bản ghi`"
                    >{{ s.doPhoBien }}</span>
                    <span class="combo-option__add" aria-hidden="true">+</span>
                  </button>
                </li>
              </ul>
            </div>

            <div v-if="selectedSymptoms.length" class="selected-box">
              <div class="selected-box__head">
                <span class="selected-box__title">Đã chọn ({{ selectedSymptoms.length }})</span>
                <button type="button" class="link-clear" @click="clearSelectedSymptoms">Bỏ chọn tất cả</button>
              </div>
              <div class="selected-chips">
                <span v-for="s in selectedSymptoms" :key="s.id" class="chip chip-selected">
                  {{ s.ten_trieu_chung }}
                  <button
                    type="button"
                    class="chip-x"
                    aria-label="Bỏ chọn"
                    @click="toggleSymptom(s.id)"
                  >×</button>
                </span>
              </div>
            </div>
            <p v-else class="selected-empty">Chưa chọn triệu chứng nào — gõ tìm kiếm hoặc bấm gợi ý bên dưới.</p>

            <!-- Gợi ý nhanh: triệu chứng hay gặp, bấm để thêm mà không cần gõ. -->
            <div v-if="popularSymptoms.length && !symptomSearch.trim()" class="suggest-box">
              <div class="picker-label">
                Triệu Chứng Thường Gặp
                <span class="suggest-hint">bấm để thêm nhanh</span>
              </div>
              <div class="chip-picker">
                <button
                  v-for="s in popularSymptoms"
                  :key="s.id"
                  type="button"
                  class="chip-toggle chip-suggest"
                  @click="addSymptom(s.id)"
                >+ {{ s.ten_trieu_chung }}</button>
              </div>
            </div>

            <!-- Duyệt toàn bộ danh sách (thu gọn mặc định để bớt rối). -->
            <div class="browse-all">
              <button
                type="button"
                class="browse-all__toggle"
                :class="{ open: showAllSymptoms }"
                :aria-expanded="showAllSymptoms"
                @click="showAllSymptoms = !showAllSymptoms"
              >
                <span class="browse-all__chevron" aria-hidden="true">›</span>
                Duyệt Tất Cả Triệu Chứng
                <span class="muted-count">{{ filteredSymptomOptions.length }}</span>
              </button>
              <div v-if="showAllSymptoms" class="chip-picker chip-picker--scroll">
                <button
                  v-for="s in filteredSymptomOptions"
                  :key="s.id"
                  type="button"
                  class="chip-toggle"
                  :class="{ active: selectedSymptomIds.includes(s.id) }"
                  @click="toggleSymptom(s.id)"
                >{{ s.ten_trieu_chung }}</button>
                <span v-if="filteredSymptomOptions.length === 0" class="muted">
                  {{ symptomOptions.length === 0 ? 'Chưa có triệu chứng nào' : `Không khớp “${symptomSearch}”` }}
                </span>
              </div>
            </div>

            <button
              type="button"
              class="btn-primary btn-diagnose"
              :disabled="selectedSymptomIds.length === 0 || isDiagnosing"
              @click="runDiagnosis"
            >
              <span v-if="isDiagnosing" class="btn-spinner" aria-hidden="true"></span>
              {{ isDiagnosing ? 'Đang phân tích…' : selectedSymptomIds.length ? `Chẩn đoán (${selectedSymptomIds.length})` : 'Chẩn đoán' }}
            </button>

            <p class="hint">
              Hệ thống khớp triệu chứng với <strong>Pháp Trị</strong> (độ tương đồng có trọng số — triệu
              chứng càng đặc hiệu càng nặng ký), rồi suy ra <strong>Thể Bệnh (Đông Y)</strong> và lan theo
              chuỗi qua pháp trị → bài thuốc tới <strong>Bệnh Tây Y</strong> (kèm Thể Bệnh Lớn).
            </p>
          </div>
        </section>

        <!-- Cột phải: kết quả -->
        <section class="panel results-panel">
          <header class="panel-head">
            <div class="panel-head__title">
              <span class="step-badge">2</span>
              <h3>Kết quả gợi ý chẩn đoán</h3>
            </div>
          </header>

          <div class="results-body">
            <div v-if="diagError" class="error-state">{{ diagError }}</div>

            <!-- Đang phân tích: skeleton -->
            <div v-else-if="isDiagnosing" class="results-loading">
              <div class="spinner"></div>
              <p>Đang phân tích {{ selectedSymptomIds.length }} triệu chứng…</p>
              <div class="skeleton-card" v-for="n in 3" :key="n"></div>
            </div>

            <!-- Chưa chạy -->
            <div v-else-if="!hasRunDiagnosis" class="results-empty">
              <div class="results-empty__icon" aria-hidden="true">🔍</div>
              <p class="results-empty__title">Chọn triệu chứng rồi bấm <strong>Chẩn đoán</strong></p>
              <p class="muted">Kết quả gồm % thể bệnh / pháp trị (Đông Y) và % bệnh Tây Y phù hợp nhất.</p>
            </div>

            <!-- Không có kết quả -->
            <div v-else-if="!hasAnyResults" class="results-empty">
              <div class="results-empty__icon" aria-hidden="true">∅</div>
              <p class="results-empty__title">Không tìm thấy thể bệnh / bệnh Tây Y phù hợp</p>
              <p class="muted">Thử chọn thêm hoặc thay đổi các triệu chứng.</p>
              <div v-if="unexplainedSymptoms.length" class="chip-row" style="justify-content: center; margin-top: 8px">
                <span v-for="s in unexplainedSymptoms" :key="s.id" class="chip chip-unmatched">{{ s.ten_trieu_chung }}</span>
              </div>
            </div>

            <template v-else>
              <div class="result-summary">
                <span class="result-summary__text">
                  Dựa trên <strong>{{ diagResult?.input.length || 0 }}</strong> triệu chứng đã chọn
                </span>
              </div>

              <div v-if="unexplainedSymptoms.length" class="unexplained-note">
                <span class="unexplained-label">⚠ Triệu chứng chưa được giải thích</span>
                <div class="chip-row">
                  <span v-for="s in unexplainedSymptoms" :key="s.id" class="chip chip-unmatched">{{ s.ten_trieu_chung }}</span>
                </div>
              </div>

              <div class="result-columns">
              <!-- Thể bệnh & pháp trị (Đông Y) -->
              <div class="result-group result-group--dongy">
                <h4 class="result-group__title">
                  <span class="result-group__dot"></span>
                  Thể bệnh &amp; Pháp trị (Đông Y)
                  <span class="result-count">
                    {{ diagResult?.phapTri.length || 0 }}<template v-if="(diagResult?.phapTriTotal || 0) > (diagResult?.phapTri.length || 0)">/{{ diagResult?.phapTriTotal }}</template>
                  </span>
                </h4>
                <p v-if="!diagResult?.phapTri.length" class="muted result-none">Không có thể bệnh phù hợp.</p>
                <a
                  v-for="(c, i) in phapTriShown"
                  :key="'pt-' + c.id"
                  :href="phapTriHref(c.id)"
                  target="_blank"
                  rel="noopener"
                  class="result-card"
                  :class="{ 'result-card--top': i === 0 }"
                  :title="`Mở pháp trị: ${c.label}`"
                >
                  <div class="result-card__rank" :class="`rank--${Math.min(i + 1, 4)}`">{{ i + 1 }}</div>
                  <div class="result-card__body">
                    <!-- Tầng 1: Danh tính -->
                    <div class="rc-head">
                      <div class="rc-id">
                        <h5 class="rc-name">{{ c.label }}</h5>
                        <span class="rc-kind">Thể Bệnh Đông Y</span>
                      </div>
                      <span v-if="i === 0" class="rc-best">★ Phù hợp nhất</span>
                    </div>
                    <!-- Tầng 2: Hướng xử lý -->
                    <div class="rc-line">
                      <span class="rc-line__label">Pháp trị</span>
                      <span class="rc-line__value">{{ c.subLabel || '—' }}</span>
                    </div>
                    <p v-if="c.members && c.members.length > 1" class="rc-note">
                      Cộng dồn từ {{ c.members.length }} pháp trị cùng thể bệnh
                    </p>
                    <!-- Tầng 3: Bằng chứng -->
                    <div class="rc-evi">
                      <span class="rc-cov" :class="coverageClass(c.matchedCount, c.total)">
                        Khớp {{ c.matchedCount }}/{{ c.total }} triệu chứng
                      </span>
                      <div class="rc-evi__chips">
                        <span v-for="m in c.matched" :key="m.id" class="chip chip-evi">{{ m.ten_trieu_chung }}</span>
                      </div>
                    </div>
                    <!-- Điểm -->
                    <div class="rc-score" :title="confidenceLabel(c.percent)">
                      <span class="rc-score__label">Độ phù hợp</span>
                      <div class="rc-bar"><span :class="confidenceClass(c.percent)" :style="{ width: c.percent + '%' }"></span></div>
                      <span class="rc-score__pct" :class="confidenceClass(c.percent)">{{ c.percent }}%</span>
                    </div>
                  </div>
                </a>
                <button
                  v-if="(diagResult?.phapTri.length || 0) > DIAG_COLLAPSED_COUNT"
                  type="button"
                  class="result-more"
                  @click="expandDongY = !expandDongY"
                >
                  {{ expandDongY ? '▴ Thu gọn' : `▾ Xem thêm ${(diagResult?.phapTri.length || 0) - DIAG_COLLAPSED_COUNT}` }}
                </button>
              </div>

              <!-- Bệnh Tây Y -->
              <div class="result-group result-group--tayy">
                <h4 class="result-group__title">
                  <span class="result-group__dot"></span>
                  Bệnh Tây Y
                  <span class="result-count">
                    {{ diagResult?.benhTayY.length || 0 }}<template v-if="(diagResult?.benhTayYTotal || 0) > (diagResult?.benhTayY.length || 0)">/{{ diagResult?.benhTayYTotal }}</template>
                  </span>
                </h4>
                <p v-if="!diagResult?.benhTayY.length" class="muted result-none">Không có bệnh Tây Y phù hợp.</p>
                <a
                  v-for="(c, i) in benhTayYShown"
                  :key="'bty-' + c.id"
                  :href="benhTayYHref(c.id)"
                  target="_blank"
                  rel="noopener"
                  class="result-card"
                  :class="{ 'result-card--top': i === 0 }"
                  :title="`Mở bệnh Tây Y: ${c.label}`"
                >
                  <div class="result-card__rank" :class="`rank--${Math.min(i + 1, 4)}`">{{ i + 1 }}</div>
                  <div class="result-card__body">
                    <!-- Tầng 1: Danh tính -->
                    <div class="rc-head">
                      <div class="rc-id">
                        <h5 class="rc-name">{{ c.label }}</h5>
                        <span v-if="c.groupLabel" class="rc-kind-tag" title="Thể Bệnh Lớn (chủng bệnh)">{{ c.groupLabel }}</span>
                      </div>
                      <span v-if="i === 0" class="rc-best">★ Phù hợp nhất</span>
                    </div>
                    <!-- Tầng 2: Đường suy luận -->
                    <div v-if="c.via && c.via.length" class="rc-line rc-line--via">
                      <span class="rc-line__label">Qua pháp trị</span>
                      <span class="rc-line__vias">
                        <span v-for="v in c.via" :key="v.id" class="via-chip">{{ v.label }} <small>{{ v.percent }}%</small></span>
                      </span>
                    </div>
                    <!-- Tầng 3: Bằng chứng -->
                    <div class="rc-evi">
                      <span class="rc-cov" :class="coverageClass(c.matchedCount, c.total)">
                        Khớp {{ c.matchedCount }}/{{ c.total }} triệu chứng
                      </span>
                      <div class="rc-evi__chips">
                        <span v-for="m in c.matched" :key="m.id" class="chip chip-evi">{{ m.ten_trieu_chung }}</span>
                      </div>
                    </div>
                    <!-- Điểm -->
                    <div class="rc-score" :title="confidenceLabel(c.percent)">
                      <span class="rc-score__label">Độ phù hợp</span>
                      <div class="rc-bar"><span :class="confidenceClass(c.percent)" :style="{ width: c.percent + '%' }"></span></div>
                      <span class="rc-score__pct" :class="confidenceClass(c.percent)">{{ c.percent }}%</span>
                    </div>
                  </div>
                </a>
                <button
                  v-if="(diagResult?.benhTayY.length || 0) > DIAG_COLLAPSED_COUNT"
                  type="button"
                  class="result-more"
                  @click="expandTayY = !expandTayY"
                >
                  {{ expandTayY ? '▴ Thu gọn' : `▾ Xem thêm ${(diagResult?.benhTayY.length || 0) - DIAG_COLLAPSED_COUNT}` }}
                </button>
              </div>
              </div>
            </template>
          </div>
        </section>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Chỉnh sửa' : 'Thêm mới' }} Triệu Chứng</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Tên Triệu Chứng <span class="required">*</span></label>
            <input
              v-model="formData.ten_trieu_chung"
              type="text"
              placeholder="Nhập tên triệu chứng..."
              @keyup.enter="handleSave"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">Hủy</button>
          <button class="btn-primary" :disabled="isSaving" @click="handleSave">{{ isSaving ? 'Đang lưu...' : 'Lưu' }}</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h3>Xác nhận xóa</h3>
          <button class="modal-close" @click="closeDeleteModal">×</button>
        </div>
        <div class="modal-body">
          <p>Bạn có chắc chắn muốn xóa triệu chứng này? Hành động này không thể hoàn tác.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeDeleteModal">Hủy</button>
          <button class="btn-danger" :disabled="isDeleting" @click="handleDelete">{{ isDeleting ? 'Đang xóa...' : 'Xóa' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.management-page { width: 100%; animation: fadeIn 0.4s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-6); padding-bottom: var(--space-4); border-bottom: 2px solid var(--brown-100); }
.header-content { flex: 1; min-width: 200px; }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--brown-800); margin-bottom: var(--space-1); line-height: 1.2; }
.page-subtitle { color: var(--gray-500); font-size: var(--font-size-md); line-height: 1.4; }

/* Main tabs (Danh sách / Chẩn đoán) */
.main-tabs { display: flex; gap: var(--space-2); margin-bottom: var(--space-5); border-bottom: 1px solid var(--brown-100); flex-wrap: wrap; }
.main-tab {
  padding: var(--space-3) var(--space-5);
  border: 1px solid transparent;
  border-bottom: none;
  background: transparent;
  color: var(--gray-600);
  font-weight: 700;
  font-size: var(--font-size-md);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  cursor: pointer;
  transition: all var(--transition-base);
  margin-bottom: -1px;
}
.main-tab:hover { color: var(--brown-600); background: var(--brown-50); }
.main-tab.active {
  background: var(--white);
  color: var(--brown-700);
  border-color: var(--brown-200);
  border-bottom-color: var(--white);
}

.data-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm); margin-bottom: var(--space-6); }
.card-header { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); flex-wrap: wrap; padding: var(--space-4) var(--space-5); background: var(--brown-50); border-bottom: 1px solid var(--brown-100); }
.card-header h3 { font-size: var(--font-size-lg); font-weight: 700; color: var(--brown-900); margin: 0; }
.list-search { flex: 1 1 240px; max-width: 420px; }

/* Cuộn dọc trong card + header bảng dính (sticky) khi ô Bệnh Tây Y nhóm cao. */
.table-responsive { width: 100%; overflow: auto; max-height: 70vh; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: var(--space-3) var(--space-5); text-align: left; border-bottom: 1px solid var(--gray-100); }
.data-table th { position: sticky; top: 0; z-index: 2; background: var(--surface-2); font-weight: 600; font-size: var(--font-size-sm); color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 1px 0 var(--brown-100); }
.data-table tbody tr { transition: background 0.2s; }
.data-table tbody tr:hover { background: var(--gray-50); }
.data-table td { font-size: var(--font-size-md); color: var(--gray-800); vertical-align: middle; }

/* Chip cells (Thể bệnh / Bài thuốc / Bệnh Tây Y) */
.chip-row { display: flex; flex-wrap: wrap; gap: 4px; max-width: 360px; }
.chip { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; line-height: 1.4; border: 1px solid transparent; }
.chip-the { background: var(--chip-pattern-bg); color: var(--chip-pattern-fg); border-color: var(--chip-pattern-border); }
.chip-bai { background: var(--chip-herb-bg); color: var(--chip-herb-fg); border-color: var(--chip-herb-border); }
/* Chip Thể Bệnh / Bài Thuốc dạng link deeplink (mở Pháp Trị / Bài Thuốc) */
.chip-link-the, .chip-link-bai { text-decoration: none; cursor: pointer; transition: background-color 0.15s, border-color 0.15s, transform 0.05s; }
.chip-link-the:hover { background: var(--chip-pattern-border); border-color: var(--chip-pattern-fg); }
.chip-link-bai:hover { background: var(--chip-herb-border); border-color: var(--chip-herb-fg); }
.chip-link-the:active, .chip-link-bai:active { transform: translateY(1px); }
.chip-benh { background: var(--chip-pulse-bg); color: var(--chip-pulse-fg); border-color: var(--chip-pulse-border); }
.chip-more { background: var(--gray-100); color: var(--gray-600); border-color: var(--gray-200); }
.chip-toggle { cursor: pointer; background: var(--brown-50); color: var(--brown-700); border-color: var(--brown-200); }
.chip-toggle:hover { background: var(--brown-100); }
/* Bộ lọc đang bật: chip "đúng filter" giữ màu rõ + đậm; phần ngoài lọc xám mờ để lùi lại, không chỏi. */
.chip--match { font-weight: 700; }
.chip--dim { opacity: 0.4; filter: grayscale(0.5); }
.empty-cell { color: var(--gray-300); }

/* ----- Thanh bộ lọc cấu trúc (Phân Loại / Tạng Phủ / Tổn Thương) — đồng bộ tông NÂU của theme ----- */
.filter-bar {
  display: flex; flex-wrap: wrap; align-items: flex-start; gap: 14px 26px;
  padding: 14px 18px; border-bottom: 1px solid var(--brown-100);
  background: linear-gradient(180deg, var(--brown-50), var(--white));
}
.filter-group { display: flex; flex-direction: column; gap: 6px; }
.filter-group--grow { flex: 1 1 280px; min-width: 200px; }
.filter-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--brown-500); }

/* "Phân Loại" — segmented pill, active = nâu primary (đồng bộ nút chính của app) */
.seg { display: inline-flex; gap: 3px; padding: 3px; background: var(--white); border: 1px solid var(--brown-200); border-radius: 999px; width: fit-content; }
.seg button { padding: 5px 16px; border: none; background: transparent; border-radius: 999px; cursor: pointer; font-size: 13px; font-weight: 600; color: var(--gray-600); transition: all 0.15s ease; }
.seg button:hover:not(.active) { color: var(--brown-700); background: var(--brown-50); }
.seg button.active { background: var(--brown-600); color: var(--white); box-shadow: 0 1px 3px rgba(139, 94, 47, 0.35); }

/* Chip chọn Tạng Phủ / Tổn Thương — active NÂU (bỏ xanh dương chỏi) */
.chip-select { display: flex; flex-wrap: wrap; gap: 6px; max-height: 96px; overflow-y: auto; padding: 2px; }
.chip-select button { padding: 4px 11px; border: 1px solid var(--brown-200); border-radius: 999px; background: var(--white); cursor: pointer; font-size: 12px; font-weight: 600; color: var(--gray-700); white-space: nowrap; transition: all 0.15s ease; }
.chip-select button:hover:not(.active) { border-color: var(--brown-400); background: var(--brown-50); }
.chip-select button.active { background: var(--brown-600); border-color: var(--brown-600); color: var(--white); box-shadow: 0 1px 2px rgba(139, 94, 47, 0.3); }

/* Nút Xóa Lọc — viền nhạt, hover đỏ cảnh báo */
.filter-clear { align-self: flex-end; padding: 6px 14px; border: 1px solid var(--brown-200); border-radius: 999px; background: var(--white); cursor: pointer; font-size: 13px; font-weight: 600; color: var(--brown-700); transition: all 0.15s ease; }
.filter-clear:hover { background: var(--danger, #c0392b); border-color: var(--danger, #c0392b); color: var(--white); }

/* ----- Bệnh Tây Y: nhóm theo Chủng Bệnh → bệnh nhỏ ----- */
.bty-cell { display: flex; flex-direction: column; gap: 6px; max-width: 400px; }
.bty-groups { display: flex; flex-wrap: wrap; gap: 8px; }
.bty-group {
  display: inline-flex; align-items: flex-start; gap: 6px;
  padding: 4px 8px; background: var(--chip-brand-bg); border: 1px solid var(--chip-brand-border);
  border-radius: var(--radius-md, 8px); max-width: 100%;
}
.bty-group__label {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--chip-brand-fg); white-space: nowrap; padding-top: 2px;
}
.bty-group__label.is-dim { opacity: 0.5; }
.bty-group__count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 15px; height: 15px; padding: 0 4px; border-radius: 999px;
  background: var(--chip-brand-border); color: var(--chip-brand-fg); font-size: 9px; font-weight: 700;
}
.bty-group .chip-row { flex: 1 1 auto; min-width: 0; max-width: none; }
.bty-toggle { align-self: flex-start; }

/* Chip bệnh Tây Y (tím nhạt) + dạng link mở trang bệnh — đồng bộ trang Bài Thuốc */
.chip-tayy { background: var(--chip-brand-bg); color: var(--chip-brand-fg); border-color: var(--chip-brand-border); }
.chip-link-tayy { text-decoration: none; cursor: pointer; transition: background-color 0.15s, border-color 0.15s, transform 0.05s; }
.chip-link-tayy:hover { background: var(--chip-brand-border); border-color: var(--chip-brand-fg); }
.chip-link-tayy:active { transform: translateY(1px); }
/* Canh trên cho ô nhiều chip (cột Bệnh Tây Y nhóm cao hơn). */
.data-table td { vertical-align: top; }
.pho-bien { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; margin-left: 6px; padding: 0 6px; border-radius: 999px; background: var(--brown-100); color: var(--brown-700); font-size: 11px; font-weight: 700; vertical-align: middle; }

.action-buttons { display: inline-flex; gap: 6px; flex-wrap: wrap; }
.btn-action { padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); border: 1px solid var(--gray-200); background: var(--white); cursor: pointer; transition: all var(--transition-fast); }
.btn-edit:hover { background: var(--brown-50); border-color: var(--brown-400); color: var(--brown-700); }
.btn-delete { color: var(--danger); }
.btn-delete:hover { background: var(--danger-bg); border-color: var(--danger-border); }

/* Pagination */
.pagination { display: flex; align-items: center; justify-content: center; gap: var(--space-2); padding: var(--space-4); background: var(--gray-50); border-top: 1px solid var(--gray-100); }
.page-btn { min-width: 32px; height: 32px; padding: 0 8px; display: flex; align-items: center; justify-content: center; background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-600); cursor: pointer; transition: all var(--transition-fast); }
.page-btn:hover:not(:disabled) { border-color: var(--brown-400); color: var(--brown-700); background: var(--brown-50); }
.page-btn.active { background: var(--brown-600); border-color: var(--brown-600); color: var(--white); }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { margin-left: var(--space-4); font-size: var(--font-size-xs); color: var(--gray-500); font-weight: 600; }

.text-center { text-align: center !important; }
.py-8 { padding-top: 2rem !important; padding-bottom: 2rem !important; }
.font-bold { font-weight: 700 !important; }
.text-brown-900 { color: var(--brown-900) !important; }
.text-gray-500 { color: var(--gray-500) !important; }

.badge { display: inline-block; padding: 4px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-warning { background: var(--warning-bg); color: var(--warning-fg); }

.loading-state { display: flex; flex-direction: column; align-items: center; padding: var(--space-12) 0; color: var(--brown-600); }
.spinner { width: 32px; height: 32px; border: 3px solid var(--gray-200); border-top-color: var(--brown-500); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-state { text-align: center; padding: var(--space-8); color: var(--danger); background: var(--danger-bg); border-radius: var(--radius-lg); }

/* ---------- Chẩn đoán ---------- */
.diagnose-grid {
  display: grid;
  grid-template-columns: minmax(300px, 380px) 1fr;
  gap: var(--space-5);
  align-items: start;
}
.panel { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm); }
.input-panel { position: sticky; top: var(--space-4); }
.panel-head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-2); padding: var(--space-4) var(--space-5); background: var(--brown-50); border-bottom: 1px solid var(--brown-100); }
.panel-head__title { display: flex; align-items: center; gap: var(--space-2); min-width: 0; }
.panel-head h3 { margin: 0; font-size: var(--font-size-md); font-weight: 700; color: var(--brown-900); }
.step-badge { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: var(--brown-600); color: var(--white); font-size: 13px; font-weight: 800; }
.pill-count { display: inline-flex; align-items: center; justify-content: center; min-width: 26px; height: 24px; padding: 0 8px; border-radius: 999px; background: var(--gray-100); color: var(--gray-500); font-size: 13px; font-weight: 800; transition: all var(--transition-fast); }
.pill-count--on { background: var(--brown-600); color: var(--white); }
.panel-body { padding: var(--space-4) var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); }

.picker-search { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 12px; width: 16px; height: 16px; color: var(--gray-400); pointer-events: none; }
.search-input { width: 100%; padding: var(--space-3); border: 1px solid var(--gray-300); border-radius: var(--radius-md); font-size: var(--font-size-md); font-family: inherit; box-sizing: border-box; }
.search-input--icon { padding-left: 36px; padding-right: 32px; }
.search-input:focus { outline: none; border-color: var(--brown-500); box-shadow: var(--focus-ring); }
.search-clear { position: absolute; right: 8px; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border: none; background: var(--gray-100); color: var(--gray-600); border-radius: 50%; font-size: 14px; line-height: 1; cursor: pointer; }
.search-clear:hover { background: var(--gray-200); color: var(--gray-800); }

.selected-box { display: flex; flex-direction: column; gap: 8px; padding: var(--space-3); background: var(--brown-50); border: 1px solid var(--brown-100); border-radius: var(--radius-md); }
.selected-box__head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
.selected-box__title { font-size: 12px; font-weight: 700; color: var(--brown-700); text-transform: uppercase; letter-spacing: 0.03em; }
.selected-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.selected-empty { margin: 0; font-size: 13px; color: var(--gray-400); font-style: italic; padding: 2px; }
.chip-selected { display: inline-flex; align-items: center; gap: 5px; background: var(--brown-600); color: var(--white); border-color: var(--brown-600); }
.chip-x { background: rgba(255,255,255,0.25); border: none; color: var(--white); width: 16px; height: 16px; border-radius: 50%; line-height: 1; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 0; }
.chip-x:hover { background: rgba(255,255,255,0.5); }
.link-clear { background: none; border: none; color: var(--brown-700); font-size: 12px; font-weight: 600; cursor: pointer; text-decoration: underline; padding: 0; }
.link-clear:hover { color: var(--brown-900); }

.picker-label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.03em; margin-top: 2px; }
.muted-count { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 18px; padding: 0 6px; background: var(--gray-100); color: var(--gray-500); border-radius: 9px; font-size: 10px; font-weight: 700; }

.chip-picker { display: flex; flex-wrap: wrap; gap: 6px; padding: var(--space-2); border: 1px solid var(--gray-200); border-radius: var(--radius-md); background: var(--gray-50); }
.chip-picker--scroll { max-height: 300px; overflow-y: auto; }
.chip-toggle { padding: 5px 11px; font-size: 13px; font-weight: 600; border-radius: 999px; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); cursor: pointer; transition: all var(--transition-fast); }
.chip-toggle:hover { border-color: var(--brown-400); color: var(--brown-700); background: var(--brown-50); }
.chip-toggle.active { background: var(--brown-600); color: var(--white); border-color: var(--brown-600); }

/* ----- Combobox tìm kiếm triệu chứng (typeahead) ----- */
/* input-panel cần overflow visible để dropdown không bị cắt; bo lại góc header cho khớp. */
.input-panel { overflow: visible; }
.input-panel .panel-head { border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
.combo { position: relative; }
.combo-dropdown {
  position: absolute; left: 0; right: 0; top: calc(100% + 6px); z-index: 30;
  margin: 0; padding: 4px; list-style: none;
  max-height: 300px; overflow-y: auto;
  background: var(--white); border: 1px solid var(--brown-200);
  border-radius: var(--radius-md); box-shadow: 0 12px 32px rgba(74, 47, 23, 0.18);
}
.combo-dropdown li { list-style: none; }
.combo-option {
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border: none; background: transparent;
  border-radius: var(--radius-sm); cursor: pointer; text-align: left;
  font-size: 13px; font-weight: 600; color: var(--gray-700); transition: background 0.12s;
}
.combo-option:hover, .combo-option.active { background: var(--brown-50); color: var(--brown-800); }
.combo-option__name { flex: 1 1 auto; min-width: 0; }
.combo-option__name .hl { background: var(--warning-bg); color: var(--warning-fg); border-radius: 3px; font-weight: 800; }
.combo-option__count {
  flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px;
  background: var(--brown-100); color: var(--brown-700); font-size: 10px; font-weight: 800;
}
.combo-option__add { flex: 0 0 auto; width: 18px; text-align: center; font-size: 16px; font-weight: 800; color: var(--brown-400); }
.combo-option:hover .combo-option__add, .combo-option.active .combo-option__add { color: var(--brown-600); }
.combo-empty { padding: 12px 10px; font-size: 13px; color: var(--gray-400); font-style: italic; }

/* Gợi ý nhanh */
.suggest-box { display: flex; flex-direction: column; gap: 8px; }
.suggest-hint { margin-left: auto; font-size: 10px; font-weight: 600; color: var(--gray-400); text-transform: none; letter-spacing: 0; font-style: italic; }
.chip-suggest { background: var(--brown-50); border-color: var(--brown-200); color: var(--brown-700); }
.chip-suggest:hover { background: var(--brown-100); border-color: var(--brown-400); color: var(--brown-800); }

/* Duyệt tất cả (thu gọn được) */
.browse-all { display: flex; flex-direction: column; gap: 8px; }
.browse-all__toggle {
  display: inline-flex; align-items: center; gap: 8px; align-self: flex-start;
  padding: 4px 2px; border: none; background: none; cursor: pointer;
  font-size: 12px; font-weight: 700; color: var(--gray-500);
  text-transform: uppercase; letter-spacing: 0.03em;
}
.browse-all__toggle:hover { color: var(--brown-700); }
.browse-all__chevron { display: inline-block; font-size: 16px; line-height: 1; transition: transform 0.18s ease; }
.browse-all__toggle.open .browse-all__chevron { transform: rotate(90deg); }

.btn-diagnose { width: 100%; padding: var(--space-3); font-size: var(--font-size-md); font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 8px; margin-top: 2px; }
.btn-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: var(--white); border-radius: 50%; animation: spin .7s linear infinite; }
.hint { margin: 0; font-size: 12px; color: var(--gray-500); line-height: 1.5; }

.results-panel { min-height: 360px; }
.results-body { padding: var(--space-5); }

.results-loading { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-6) var(--space-4); color: var(--brown-600); }
.results-loading p { margin: 0 0 var(--space-2); font-size: var(--font-size-sm); font-weight: 600; }
.skeleton-card { width: 100%; height: 64px; border-radius: var(--radius-lg); background: linear-gradient(90deg, var(--gray-100) 25%, #f3f4f6 37%, var(--gray-100) 63%); background-size: 400% 100%; animation: shimmer 1.4s ease infinite; }
@keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

.results-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-2); text-align: center; padding: var(--space-12) var(--space-5); color: var(--gray-600); }
.results-empty p { margin: 0; }
.results-empty__icon { font-size: 40px; line-height: 1; opacity: 0.6; margin-bottom: var(--space-2); }
.results-empty__title { font-size: var(--font-size-md); font-weight: 600; color: var(--gray-700); }

.result-summary { margin: 0 0 var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px dashed var(--gray-200); }
.result-summary__text { font-size: var(--font-size-sm); color: var(--gray-600); }

.unexplained-note { display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--space-5); padding: var(--space-3) var(--space-4); background: var(--warning-bg); border: 1px solid var(--warning-border); border-radius: var(--radius-md); }
.unexplained-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--warning-fg); }
.unexplained-note .chip-row { max-width: none; }
.chip-unmatched { background: var(--warning-bg); color: var(--warning-fg); border-color: var(--warning-border); border-style: dashed; }

/* Hai cột Đông Y / Tây Y cạnh nhau; tự xuống 1 cột khi không đủ rộng. */
.result-columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: var(--space-5); align-items: start; }
.result-columns .result-group { margin-bottom: 0; }

.result-group { margin-bottom: var(--space-6); }
.result-group:last-child { margin-bottom: 0; }
.result-group__title { display: flex; align-items: center; gap: var(--space-2); margin: 0 0 var(--space-3); font-size: var(--font-size-md); font-weight: 700; color: var(--gray-800); padding-bottom: var(--space-2); border-bottom: 1px solid var(--gray-100); }
.result-group__dot { width: 10px; height: 10px; border-radius: 50%; flex: 0 0 auto; }
.result-group--dongy .result-group__dot { background: var(--success-fg); }
.result-group--tayy .result-group__dot { background: var(--info-fg); }
.result-count { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 20px; padding: 0 7px; border-radius: 10px; font-size: 11px; font-weight: 700; }
.result-group--dongy .result-count { background: var(--success-bg); color: var(--success-fg); }
.result-group--tayy .result-count { background: var(--info-bg); color: var(--info-fg); }
.result-none { margin: 0; padding: var(--space-2) 0; }
/* Nút thu gọn / xem thêm cho mỗi cột kết quả. */
.result-more { width: 100%; margin-top: var(--space-1); padding: 8px; border: 1px dashed var(--gray-300); border-radius: var(--radius-md); background: var(--gray-50); color: var(--gray-600); font-size: var(--font-size-sm); font-weight: 700; cursor: pointer; font-family: inherit; transition: all var(--transition-fast); }
.result-more:hover { border-color: var(--brown-400); color: var(--brown-700); background: var(--white); }

.result-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  text-decoration: none;
  color: inherit;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-3);
  box-shadow: 0 1px 2px rgba(74, 47, 23, 0.04);
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast);
}
.result-card:hover { box-shadow: 0 6px 18px rgba(74, 47, 23, 0.1); border-color: var(--brown-300); transform: translateY(-1px); }
.result-card:last-child { margin-bottom: 0; }
.result-card--top { border-color: var(--warning-border); background: linear-gradient(180deg, var(--warning-bg) 0%, #fff 60%); box-shadow: 0 2px 10px rgba(217, 119, 6, 0.1); }

.result-card__rank { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; font-size: 12px; font-weight: 800; background: var(--gray-100); color: var(--gray-600); margin-top: 2px; }
.rank--1 { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #fff; box-shadow: 0 2px 6px rgba(245,158,11,0.4); }
.rank--2 { background: #e5e7eb; color: #4b5563; }
.rank--3 { background: #fde7d3; color: #b45309; }

.result-card__body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: var(--space-2); }

/* Tầng 1 — Danh tính: tên + loại; gạch chân ngăn cách với phần dưới */
.rc-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-2); padding-bottom: var(--space-2); border-bottom: 1px solid var(--gray-100); }
.rc-id { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.rc-name { margin: 0; font-weight: 800; color: var(--brown-900); font-size: var(--font-size-md); line-height: 1.3; word-break: break-word; }
.rc-kind { font-size: 11px; font-weight: 600; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.04em; }
.rc-kind-tag { align-self: flex-start; padding: 1px 8px; border-radius: var(--radius-sm); background: var(--brown-50); color: var(--brown-700); border: 1px solid var(--brown-200); font-size: 11px; font-weight: 700; }
.rc-best { flex: 0 0 auto; padding: 2px 9px; border-radius: 999px; background: var(--warning-bg); color: var(--warning-fg); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }

/* Tầng 2 — Hướng xử lý (Đông Y) / đường suy luận (Tây Y) */
.rc-line { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 8px; }
.rc-line__label { flex: 0 0 auto; font-size: 10px; font-weight: 700; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.05em; }
.rc-line__value { font-size: var(--font-size-sm); font-weight: 600; color: var(--brown-700); line-height: 1.4; word-break: break-word; }
.rc-line__vias { display: flex; flex-wrap: wrap; gap: 5px; min-width: 0; }
.rc-note { margin: 0; font-size: 11px; color: var(--brown-500); font-weight: 600; font-style: italic; }
.via-chip { display: inline-flex; align-items: center; gap: 3px; padding: 1px 8px; border-radius: 999px; background: var(--chip-method-bg); color: var(--chip-method-fg); border: 1px solid var(--chip-method-border); font-size: 11px; font-weight: 600; }
.via-chip small { font-weight: 800; opacity: 0.85; }

/* Tầng 3 — Bằng chứng: khối riêng nền nhạt + viền trái để tách bạch "vì sao gợi ý" */
.rc-evi { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; background: var(--surface-sunken); border: 1px solid var(--gray-100); border-left: 3px solid var(--info-border); border-radius: var(--radius-sm); }
.rc-evi__chips { display: flex; flex-wrap: wrap; gap: 5px; }
.rc-cov { font-size: 11px; font-weight: 700; }
.rc-cov::before { content: ""; display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 5px; vertical-align: middle; background: currentColor; }
.rc-cov.cov-high { color: var(--success-fg); }
.rc-cov.cov-mid { color: var(--warning-fg); }
.rc-cov.cov-low { color: var(--gray-500); }
.chip-evi { background: var(--chip-pulse-bg); color: var(--chip-pulse-fg); border-color: var(--chip-pulse-border); }

/* Điểm — nhãn + thanh tiến độ + % (gọn trên 1 hàng, không tranh chỗ với tên) */
.rc-score { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
.rc-score__label { flex: 0 0 auto; font-size: 10px; font-weight: 700; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.05em; }
.rc-bar { flex: 1 1 auto; height: 6px; background: var(--gray-100); border-radius: 999px; overflow: hidden; }
.rc-bar > span { display: block; height: 100%; border-radius: 999px; transition: width 0.4s ease; }
.rc-bar > span.conf-high { background: var(--success-fg); }
.rc-bar > span.conf-mid { background: var(--warning-fg); }
.rc-bar > span.conf-low { background: var(--gray-400); }
.rc-score__pct { flex: 0 0 auto; min-width: 40px; text-align: right; font-size: 15px; font-weight: 800; line-height: 1; }
.rc-score__pct.conf-high { color: var(--success-fg); }
.rc-score__pct.conf-mid { color: var(--warning-fg); }
.rc-score__pct.conf-low { color: var(--gray-400); }

.muted { color: var(--gray-400); font-style: italic; }

@media (max-width: 900px) {
  .diagnose-grid { grid-template-columns: 1fr; }
  .input-panel { position: static; }
}

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s ease; padding: var(--space-4); }
.modal-content { background: var(--white); border-radius: var(--radius-xl); width: 100%; max-width: 520px; box-shadow: var(--shadow-xl); animation: slideUp 0.25s ease; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.modal-sm { max-width: 400px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-5); border-bottom: 1px solid var(--gray-200); }
.modal-header h3 { margin: 0; font-size: var(--font-size-lg); font-weight: 700; color: var(--brown-900); }
.modal-close { background: none; border: none; font-size: 28px; line-height: 1; color: var(--gray-400); cursor: pointer; padding: 0; width: 32px; height: 32px; }
.modal-close:hover { color: var(--gray-700); }
.modal-body { padding: var(--space-5); }
.modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: var(--space-5); border-top: 1px solid var(--gray-200); }

.form-group { margin-bottom: var(--space-4); }
.form-group label { display: block; margin-bottom: var(--space-2); font-weight: 600; font-size: var(--font-size-sm); color: var(--gray-700); }
.form-group input, .form-group textarea { width: 100%; padding: var(--space-3); border: 1px solid var(--gray-300); border-radius: var(--radius-md); font-size: var(--font-size-md); font-family: inherit; transition: border-color var(--transition-fast); box-sizing: border-box; }
.form-group input:focus, .form-group textarea:focus { outline: none; border-color: var(--brown-500); }
.required { color: var(--danger); }

.btn-primary { padding: var(--space-3) var(--space-5); background: var(--brown-600); color: var(--white); border: none; border-radius: var(--radius-md); font-weight: 600; font-size: var(--font-size-md); cursor: pointer; transition: all var(--transition-fast); }
.btn-primary:hover:not(:disabled) { background: var(--brown-700); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { padding: var(--space-3) var(--space-5); background: var(--white); color: var(--gray-700); border: 1px solid var(--gray-300); border-radius: var(--radius-md); font-weight: 600; font-size: var(--font-size-md); cursor: pointer; transition: all var(--transition-fast); }
.btn-secondary:hover { background: var(--gray-50); }
.btn-danger { padding: var(--space-3) var(--space-5); background: var(--danger); color: var(--white); border: none; border-radius: var(--radius-md); font-weight: 600; font-size: var(--font-size-md); cursor: pointer; transition: all var(--transition-fast); }
.btn-danger:hover:not(:disabled) { opacity: 0.9; }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }
.mt-4 { margin-top: var(--space-4); }
</style>
