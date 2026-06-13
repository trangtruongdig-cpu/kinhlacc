<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'

const router = useRouter()

function baiThuocHref(id: number): string {
  return router.resolve({
    name: 'medicines',
    query: { tab: 'bai-thuoc', btId: id },
  }).href
}

function phapTriHref(id: number): string {
  return router.resolve({
    name: 'treatments',
    query: { ptId: id },
  }).href
}

interface TrieuChungLite {
  id: number
  ten_trieu_chung: string
}

interface BaiThuocLite {
  id: number
  ten_bai_thuoc: string
}

interface BaiThuocPhapTriLink {
  idBaiThuoc: number
  idPhapTri: number
  thuTu?: number
  baiThuoc?: BaiThuocLite | null
}

interface PhapTriLite {
  id: number
  nguyen_tac: string | null
  chung_trang: string | null
  trieu_chung_mo_ta?: string | null
  trieu_chung_list?: TrieuChungLite[]
  bai_thuoc?: BaiThuocLite | null
  bai_thuoc_links?: BaiThuocPhapTriLink[]
}

interface BenhDongYExcelRow {
  id: number
  code: string
  name: string
  outputCell: string
  excelFormula: string
  logicExpression: string
  sqlCaseText: string
  sqlCaseBoolean: string
  phapTriList?: PhapTriLite[] | null
  trieuChungList?: TrieuChungLite[] | null
  baiThuocList?: BaiThuocLite[] | null
}

interface KinhMachLite {
  idKinhMach: number
  ten_kinh_mach: string | null
  ten_viet_tat: string | null
}

interface HuyetViLite {
  idHuyet: number
  ten_huyet: string | null
  ma_huyet: string | null
  kinhMach?: KinhMachLite | null
}

interface PhacDoLite {
  idPhacDo: number
  idBenh: number
  idHuyet: number
  huyetVi: HuyetViLite | null
}

interface FormState {
  code: string
  name: string
  outputCell: string
  excelFormula: string
  logicExpression: string
  sqlCaseText: string
  sqlCaseBoolean: string
  id_phap_tri_list: number[]
  id_trieu_chung_list: number[]
  id_bai_thuoc_list: number[]
}

const isLoading = ref(true)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const formError = ref<string | null>(null)
const dataList = ref<BenhDongYExcelRow[]>([])
const dataTotal = ref(0)
const phapTriOptions = ref<PhapTriLite[]>([])
const phacDoList = ref<PhacDoLite[]>([])
const trieuChungOptions = ref<TrieuChungLite[]>([])
const baiThuocOptions = ref<BaiThuocLite[]>([])
const searchQuery = ref('')
const pageLoading = ref(false)
const formLoading = ref(false)
const formOptionsLoaded = ref(false)
const phapTriSearch = ref('')
const trieuChungSearch = ref('')
const baiThuocSearch = ref('')
const creatingTrieuChung = ref(false)

const showModal = ref(false)
const showDeleteConfirm = ref(false)
const editingId = ref<number | null>(null)
const deletingItem = ref<BenhDongYExcelRow | null>(null)

const emptyForm = (): FormState => ({
  code: '',
  name: '',
  outputCell: '',
  excelFormula: '',
  logicExpression: '',
  sqlCaseText: '',
  sqlCaseBoolean: '',
  id_phap_tri_list: [],
  id_trieu_chung_list: [],
  id_bai_thuoc_list: [],
})

function toggleId(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

const form = ref<FormState>(emptyForm())

const currentPage = ref(1)
const itemsPerPage = ref(10)

onMounted(async () => {
  await fetchData()
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

async function loadPage() {
  pageLoading.value = true
  try {
    const qs = buildQuery({
      page: currentPage.value,
      limit: itemsPerPage.value,
      q: searchQuery.value.trim(),
    })
    const res: any = await api.get(`/benh-dong-y-excel/lite${qs}`)
    dataList.value = res?.data ?? []
    dataTotal.value = Number(res?.total ?? 0)
  } finally {
    pageLoading.value = false
  }
}

async function loadPhacDo() {
  const res: any = await api.get('/phac-do-dieu-tri')
  phacDoList.value = Array.isArray(res) ? res : res?.data ?? []
}

/** Lazy load các option cho modal — chỉ khi mở modal. */
async function ensureFormOptions() {
  if (formOptionsLoaded.value) return
  const [pt, tc, bt] = await Promise.all([
    api.get<any>('/phap-tri/options'),
    api.get<any>('/trieu-chung'),
    api.get<any>('/bai-thuoc/options'),
  ])
  phapTriOptions.value = Array.isArray(pt) ? pt : pt?.data ?? []
  trieuChungOptions.value = Array.isArray(tc) ? tc : tc?.data ?? []
  baiThuocOptions.value = Array.isArray(bt) ? bt : bt?.data ?? []
  formOptionsLoaded.value = true
}

async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    await Promise.all([loadPage(), loadPhacDo()])
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
    void loadPage()
  }, 2000)
})

watch(currentPage, () => { void loadPage() })

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

const phacDoByBenh = computed<Map<number, PhacDoLite[]>>(() => {
  const map = new Map<number, PhacDoLite[]>()
  for (const p of phacDoList.value) {
    const list = map.get(p.idBenh) ?? []
    list.push(p)
    map.set(p.idBenh, list)
  }
  return map
})

function huyetLabel(h: HuyetViLite | null | undefined): string {
  if (!h) return ''
  const parts = [h.ten_huyet, h.ma_huyet ? `(${h.ma_huyet})` : null].filter(Boolean)
  return parts.length ? parts.join(' ') : `#${h.idHuyet}`
}

function phapTriLabel(p: PhapTriLite): string {
  return (p.nguyen_tac || p.chung_trang || `#${p.id}`).trim()
}

function trieuChungLabelsForBenh(item: BenhDongYExcelRow): string[] {
  return (item.trieuChungList ?? []).map((t) => t.ten_trieu_chung).filter(Boolean)
}

function baiThuocLabelsForBenh(item: BenhDongYExcelRow): string[] {
  return baiThuocItemsForBenh(item).map((b) => b.name)
}

function baiThuocItemsForBenh(item: BenhDongYExcelRow): Array<{ id: number | null; name: string }> {
  return (item.baiThuocList ?? [])
    .map((b) => ({ id: b.id ?? null, name: b.ten_bai_thuoc }))
    .filter((b) => !!b.name)
}

function theBenhLabelsForBenh(item: BenhDongYExcelRow): string[] {
  return theBenhItemsForBenh(item).map((x) => x.name)
}

function theBenhItemsForBenh(item: BenhDongYExcelRow): Array<{ id: number; name: string }> {
  return (item.phapTriList ?? [])
    .map((p) => ({ id: p.id, name: (p.chung_trang || '').trim() }))
    .filter((x) => !!x.name)
}

function phapTriLabelsForBenh(item: BenhDongYExcelRow): string[] {
  return phapTriItemsForBenh(item).map((x) => x.name)
}

function phapTriItemsForBenh(item: BenhDongYExcelRow): Array<{ id: number; name: string }> {
  return (item.phapTriList ?? [])
    .map((p) => ({ id: p.id, name: phapTriLabel(p) }))
    .filter((x) => !!x.name)
}

const filteredPhapTriOptions = computed(() => {
  const q = phapTriSearch.value.trim().toLowerCase()
  if (!q) return phapTriOptions.value
  return phapTriOptions.value.filter((p) => phapTriLabel(p).toLowerCase().includes(q))
})

/** Server đã filter & paginate. */
const filteredList = computed(() => dataList.value)
const pagedList = computed(() => dataList.value)
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

function truncate(s: string, len: number) {
  if (!s) return '—'
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length <= len ? t : t.slice(0, len) + '…'
}

function splitCellRefs(s: string, maxLen: number): { kind: 'ref' | 'text'; v: string }[] {
  const t = truncate(s, maxLen)
  const re = /(\b[A-Z]{1,3}\d+\b|\bABS\s*\(\s*[A-Z]{1,3}\d+\s*\))/gi
  const parts: { kind: 'ref' | 'text'; v: string }[] = []
  let last = 0
  let m: RegExpExecArray | null
  const rx = new RegExp(re.source, re.flags)
  while ((m = rx.exec(t)) !== null) {
    if (m.index > last) parts.push({ kind: 'text', v: t.slice(last, m.index) })
    const cap = m[1] ?? m[0]
    parts.push({ kind: 'ref', v: cap })
    last = m.index + m[0].length
  }
  if (last < t.length) parts.push({ kind: 'text', v: t.slice(last) })
  return parts.length ? parts : [{ kind: 'text', v: t }]
}

const EXCEL_CELL_HINTS: Record<string, string> = (() => {
  const h: Record<string, string> = {}
  h.A7 = 'MAX(C10:C15, F10:F15) — MAX toàn bộ số đo chi trên'
  h.A8 = 'MIN(C10:C15, F10:F15) — MIN toàn bộ số đo chi trên'
  h.B7 = 'A7 − A8'
  h.D7 = '(A7+A8)/2 — đường cơ sở chi trên'
  h.E7 = 'B7/6'
  h.F7 = 'D7+E7'
  h.F8 = 'D7−E7'

  const uL = ['Tiểu trái', 'Tâm trái', 'Tam trái', 'Bào phải', 'Đại trái', 'Phế trái']
  const uR = ['Tiểu phải', 'Tâm phải', 'Tam phải', 'Bào phải', 'Đại phải', 'Phế phải']
  for (let i = 0; i < 6; i++) {
    const r = 10 + i
    const L = uL[i]
    const R = uR[i]
    const tb = `(${L} + ${R}) / 2`
    h[`C${r}`] = `${L} — ô nhập giá trị đo trái (map.md)`
    h[`F${r}`] = `${R} — ô nhập giá trị đo phải (map.md)`
    h[`D${r}`] = tb
    h[`E${r}`] = `${tb} − D7`
    h[`H${r}`] = `ABS(${L} − ${R})`
  }

  h.A18 = 'MAX(C21:C26, F21:F26) — MAX chi dưới'
  h.A19 = 'MIN(C21:C26, F21:F26) — MIN chi dưới'
  h.B18 = 'A18−A19'
  h.D18 = '(A18+A19)/2 — đường cơ sở chi dưới'
  h.E18 = 'B18/6'
  h.F18 = 'D18+E18'
  h.F19 = 'D18−E18'

  const lL = ['Bàng trái', 'Thận trái', 'Đảm trái', 'Vị trái', 'Can trái', 'Tỳ trái']
  const lR = ['Bàng phải', 'Thận phải', 'Đảm phải', 'Vị phải', 'Can phải', 'Tỳ phải']
  for (let i = 0; i < 6; i++) {
    const r = 21 + i
    const L = lL[i]
    const R = lR[i]
    const tb = `(${L} + ${R}) / 2`
    h[`C${r}`] = `${L} — ô nhập giá trị đo trái (map.md)`
    h[`F${r}`] = `${R} — ô nhập giá trị đo phải (map.md)`
    h[`D${r}`] = tb
    h[`E${r}`] = `${tb} − D18`
    h[`H${r}`] = `ABS(${L} − ${R})`
  }

  h.H28 = '(đường cơ sở chi trên) − (đường cơ sở chi dưới) = D7 − D18'
  return h
})()

function excelCellHint(ref: string): string {
  return EXCEL_CELL_HINTS[ref] ?? ''
}

function resetPickerSearches() {
  phapTriSearch.value = ''
  trieuChungSearch.value = ''
  baiThuocSearch.value = ''
}

async function openCreateModal() {
  showModal.value = true
  formLoading.value = true
  try { await ensureFormOptions() } finally { formLoading.value = false }
  editingId.value = null
  form.value = emptyForm()
  formError.value = null
  resetPickerSearches()
}

async function openEditModal(row: BenhDongYExcelRow) {
  showModal.value = true
  formLoading.value = true
  try { await ensureFormOptions() } finally { formLoading.value = false }
  editingId.value = row.id
  form.value = {
    code: row.code,
    name: row.name,
    outputCell: row.outputCell,
    excelFormula: row.excelFormula,
    logicExpression: row.logicExpression,
    sqlCaseText: row.sqlCaseText,
    sqlCaseBoolean: row.sqlCaseBoolean,
    id_phap_tri_list: (row.phapTriList ?? []).map((p) => p.id),
    id_trieu_chung_list: (row.trieuChungList ?? []).map((t) => t.id),
    id_bai_thuoc_list: (row.baiThuocList ?? []).map((b) => b.id),
  }
  formError.value = null
  resetPickerSearches()
}

function closeModal() {
  showModal.value = false
  editingId.value = null
}

async function handleSubmit() {
  if (isSubmitting.value) return
  formError.value = null
  const f = form.value
  const requiredText: (keyof FormState)[] = [
    'code',
    'name',
    'outputCell',
    'excelFormula',
    'logicExpression',
    'sqlCaseText',
    'sqlCaseBoolean',
  ]
  for (const k of requiredText) {
    if (!String(f[k] ?? '').trim()) {
      formError.value = `Vui lòng điền đầy đủ các trường (thiếu: ${k})`
      return
    }
  }
  const payload = {
    code: f.code,
    name: f.name,
    outputCell: f.outputCell,
    excelFormula: f.excelFormula,
    logicExpression: f.logicExpression,
    sqlCaseText: f.sqlCaseText,
    sqlCaseBoolean: f.sqlCaseBoolean,
    id_phap_tri_list: f.id_phap_tri_list,
    id_trieu_chung_list: f.id_trieu_chung_list,
    id_bai_thuoc_list: f.id_bai_thuoc_list,
  }
  isSubmitting.value = true
  try {
    if (editingId.value != null) {
      await api.put(`/benh-dong-y-excel/${editingId.value}`, payload)
    } else {
      await api.post('/benh-dong-y-excel', payload)
    }
    await loadPage()
    closeModal()
  } catch (err: any) {
    formError.value = err.message || 'Không lưu được dữ liệu'
  } finally {
    isSubmitting.value = false
  }
}

function confirmDelete(row: BenhDongYExcelRow) {
  deletingItem.value = row
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (isSubmitting.value) return
  if (!deletingItem.value) return
  isSubmitting.value = true
  try {
    await api.delete(`/benh-dong-y-excel/${deletingItem.value.id}`)
    showDeleteConfirm.value = false
    deletingItem.value = null
    await loadPage()
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
        <h1 class="page-title">Quản Lý Bệnh Kinh Lạc</h1>
        <p class="page-subtitle">
          Danh mục bệnh chẩn theo kinh lạc, liên kết với thể bệnh / pháp trị tương ứng
        </p>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải dữ liệu...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary mt-4" @click="fetchData">Thử lại</button>
    </div>

    <div v-else class="content-body">
      <details class="excel-map-panel">
        <summary class="excel-map-summary">
          <span class="excel-map-summary-title">Bản đồ ô chỉ số (mẫu — theo map Excel)</span>
          <span class="excel-map-summary-hint">Lưới A–H · hàng 7–15 · 18–28</span>
        </summary>

        <div class="excel-map-body">
          <p class="excel-map-intro">
            Lưới giống Excel: hàng 7–8 và 18–19 là tổng hợp; hàng 10–15 (chi trên) và 21–26 (chi dưới) là từng kinh.
            Ô hiển thị <strong>tên ô</strong> (A7, C10…) — <strong>đưa chuột vào ô</strong> để xem <strong>công thức diễn đầy đủ</strong> theo <code>map.md</code> (ví dụ <code>D10</code> → <code>(Tiểu trái + Tiểu phải) / 2</code>).
          </p>

          <div class="excel-sheet-scroll">
            <table class="excel-sheet" aria-label="Sơ đồ ô chi trên">
              <thead>
                <tr>
                  <th class="excel-corner"></th>
                  <th>A</th>
                  <th>B</th>
                  <th>C</th>
                  <th>D</th>
                  <th>E</th>
                  <th>F</th>
                  <th>G</th>
                  <th>H</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th class="excel-row-head">7</th>
                  <td class="xc xc-a" :title="excelCellHint('A7')"><span class="xref">A7</span></td>
                  <td class="xc xc-b" :title="excelCellHint('B7')"><span class="xref">B7</span></td>
                  <td class="xc-empty"></td>
                  <td class="xc xc-d" :title="excelCellHint('D7')"><span class="xref">D7</span></td>
                  <td class="xc xc-e" :title="excelCellHint('E7')"><span class="xref">E7</span></td>
                  <td class="xc xc-f" :title="excelCellHint('F7')"><span class="xref">F7</span></td>
                  <td class="xc-empty"></td>
                  <td class="xc-empty"></td>
                </tr>
                <tr>
                  <th class="excel-row-head">8</th>
                  <td class="xc xc-a" :title="excelCellHint('A8')"><span class="xref">A8</span></td>
                  <td class="xc-empty"></td>
                  <td class="xc-empty"></td>
                  <td class="xc-empty"></td>
                  <td class="xc-empty"></td>
                  <td class="xc xc-f" :title="excelCellHint('F8')"><span class="xref">F8</span></td>
                  <td class="xc-empty"></td>
                  <td class="xc-empty"></td>
                </tr>
                <tr class="excel-gap">
                  <th class="excel-row-head">9</th>
                  <td colspan="8" class="xc-gap"></td>
                </tr>
                <tr>
                  <th class="excel-row-head">10</th>
                  <td class="xc-label" title="Tên kinh (nhãn hiển thị)">Tiểu</td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ, không có công thức trong map.md)">±</td>
                  <td class="xc xc-c" :title="excelCellHint('C10')"><span class="xref">C10</span></td>
                  <td class="xc xc-d" :title="excelCellHint('D10')"><span class="xref">D10</span></td>
                  <td class="xc xc-e" :title="excelCellHint('E10')"><span class="xref">E10</span></td>
                  <td class="xc xc-f" :title="excelCellHint('F10')"><span class="xref">F10</span></td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ)">±</td>
                  <td class="xc xc-h" :title="excelCellHint('H10')"><span class="xref">H10</span></td>
                </tr>
                <tr>
                  <th class="excel-row-head">11</th>
                  <td class="xc-label" title="Tên kinh (nhãn hiển thị)">Tâm</td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ, không có công thức trong map.md)">±</td>
                  <td class="xc xc-c" :title="excelCellHint('C11')"><span class="xref">C11</span></td>
                  <td class="xc xc-d" :title="excelCellHint('D11')"><span class="xref">D11</span></td>
                  <td class="xc xc-e" :title="excelCellHint('E11')"><span class="xref">E11</span></td>
                  <td class="xc xc-f" :title="excelCellHint('F11')"><span class="xref">F11</span></td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ)">±</td>
                  <td class="xc xc-h" :title="excelCellHint('H11')"><span class="xref">H11</span></td>
                </tr>
                <tr>
                  <th class="excel-row-head">12</th>
                  <td class="xc-label" title="Tên kinh (nhãn hiển thị)">Tam</td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ, không có công thức trong map.md)">±</td>
                  <td class="xc xc-c" :title="excelCellHint('C12')"><span class="xref">C12</span></td>
                  <td class="xc xc-d" :title="excelCellHint('D12')"><span class="xref">D12</span></td>
                  <td class="xc xc-e" :title="excelCellHint('E12')"><span class="xref">E12</span></td>
                  <td class="xc xc-f" :title="excelCellHint('F12')"><span class="xref">F12</span></td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ)">±</td>
                  <td class="xc xc-h" :title="excelCellHint('H12')"><span class="xref">H12</span></td>
                </tr>
                <tr>
                  <th class="excel-row-head">13</th>
                  <td class="xc-label" title="Tên kinh (nhãn hiển thị)">Bào</td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ, không có công thức trong map.md)">±</td>
                  <td class="xc xc-c" :title="excelCellHint('C13')"><span class="xref">C13</span></td>
                  <td class="xc xc-d" :title="excelCellHint('D13')"><span class="xref">D13</span></td>
                  <td class="xc xc-e" :title="excelCellHint('E13')"><span class="xref">E13</span></td>
                  <td class="xc xc-f" :title="excelCellHint('F13')"><span class="xref">F13</span></td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ)">±</td>
                  <td class="xc xc-h" :title="excelCellHint('H13')"><span class="xref">H13</span></td>
                </tr>
                <tr>
                  <th class="excel-row-head">14</th>
                  <td class="xc-label" title="Tên kinh (nhãn hiển thị)">Đại</td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ, không có công thức trong map.md)">±</td>
                  <td class="xc xc-c" :title="excelCellHint('C14')"><span class="xref">C14</span></td>
                  <td class="xc xc-d" :title="excelCellHint('D14')"><span class="xref">D14</span></td>
                  <td class="xc xc-e" :title="excelCellHint('E14')"><span class="xref">E14</span></td>
                  <td class="xc xc-f" :title="excelCellHint('F14')"><span class="xref">F14</span></td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ)">±</td>
                  <td class="xc xc-h" :title="excelCellHint('H14')"><span class="xref">H14</span></td>
                </tr>
                <tr>
                  <th class="excel-row-head">15</th>
                  <td class="xc-label" title="Tên kinh (nhãn hiển thị)">Phế</td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ, không có công thức trong map.md)">±</td>
                  <td class="xc xc-c" :title="excelCellHint('C15')"><span class="xref">C15</span></td>
                  <td class="xc xc-d" :title="excelCellHint('D15')"><span class="xref">D15</span></td>
                  <td class="xc xc-e" :title="excelCellHint('E15')"><span class="xref">E15</span></td>
                  <td class="xc xc-f" :title="excelCellHint('F15')"><span class="xref">F15</span></td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ)">±</td>
                  <td class="xc xc-h" :title="excelCellHint('H15')"><span class="xref">H15</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <p class="excel-map-caption">Chi trên · hàng 7–8 = tổng hợp; hàng 10–15: <span class="xref-inline">D</span> = TB hai bên,
            <span class="xref-inline">E</span> = lệch so <span class="xref-inline">D7</span>,
            <span class="xref-inline">H</span> = ABS(<span class="xref-inline">C</span>−<span class="xref-inline">F</span>).</p>

          <div class="excel-sheet-scroll">
            <table class="excel-sheet" aria-label="Sơ đồ ô chi dưới">
              <thead>
                <tr>
                  <th class="excel-corner"></th>
                  <th>A</th>
                  <th>B</th>
                  <th>C</th>
                  <th>D</th>
                  <th>E</th>
                  <th>F</th>
                  <th>G</th>
                  <th>H</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th class="excel-row-head">18</th>
                  <td class="xc xc-a" :title="excelCellHint('A18')"><span class="xref">A18</span></td>
                  <td class="xc xc-b" :title="excelCellHint('B18')"><span class="xref">B18</span></td>
                  <td class="xc-empty"></td>
                  <td class="xc xc-d" :title="excelCellHint('D18')"><span class="xref">D18</span></td>
                  <td class="xc xc-e" :title="excelCellHint('E18')"><span class="xref">E18</span></td>
                  <td class="xc xc-f" :title="excelCellHint('F18')"><span class="xref">F18</span></td>
                  <td class="xc-empty"></td>
                  <td class="xc-empty"></td>
                </tr>
                <tr>
                  <th class="excel-row-head">19</th>
                  <td class="xc xc-a" :title="excelCellHint('A19')"><span class="xref">A19</span></td>
                  <td class="xc-empty"></td>
                  <td class="xc-empty"></td>
                  <td class="xc-empty"></td>
                  <td class="xc-empty"></td>
                  <td class="xc xc-f" :title="excelCellHint('F19')"><span class="xref">F19</span></td>
                  <td class="xc-empty"></td>
                  <td class="xc-empty"></td>
                </tr>
                <tr class="excel-gap">
                  <th class="excel-row-head">20</th>
                  <td colspan="8" class="xc-gap"></td>
                </tr>
                <tr>
                  <th class="excel-row-head">21</th>
                  <td class="xc-label" title="Tên kinh (nhãn hiển thị)">Bàng</td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ, không có công thức trong map.md)">±</td>
                  <td class="xc xc-c" :title="excelCellHint('C21')"><span class="xref">C21</span></td>
                  <td class="xc xc-d" :title="excelCellHint('D21')"><span class="xref">D21</span></td>
                  <td class="xc xc-e" :title="excelCellHint('E21')"><span class="xref">E21</span></td>
                  <td class="xc xc-f" :title="excelCellHint('F21')"><span class="xref">F21</span></td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ)">±</td>
                  <td class="xc xc-h" :title="excelCellHint('H21')"><span class="xref">H21</span></td>
                </tr>
                <tr>
                  <th class="excel-row-head">22</th>
                  <td class="xc-label" title="Tên kinh (nhãn hiển thị)">Thận</td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ, không có công thức trong map.md)">±</td>
                  <td class="xc xc-c" :title="excelCellHint('C22')"><span class="xref">C22</span></td>
                  <td class="xc xc-d" :title="excelCellHint('D22')"><span class="xref">D22</span></td>
                  <td class="xc xc-e" :title="excelCellHint('E22')"><span class="xref">E22</span></td>
                  <td class="xc xc-f" :title="excelCellHint('F22')"><span class="xref">F22</span></td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ)">±</td>
                  <td class="xc xc-h" :title="excelCellHint('H22')"><span class="xref">H22</span></td>
                </tr>
                <tr>
                  <th class="excel-row-head">23</th>
                  <td class="xc-label" title="Tên kinh (nhãn hiển thị)">Đảm</td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ, không có công thức trong map.md)">±</td>
                  <td class="xc xc-c" :title="excelCellHint('C23')"><span class="xref">C23</span></td>
                  <td class="xc xc-d" :title="excelCellHint('D23')"><span class="xref">D23</span></td>
                  <td class="xc xc-e" :title="excelCellHint('E23')"><span class="xref">E23</span></td>
                  <td class="xc xc-f" :title="excelCellHint('F23')"><span class="xref">F23</span></td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ)">±</td>
                  <td class="xc xc-h" :title="excelCellHint('H23')"><span class="xref">H23</span></td>
                </tr>
                <tr>
                  <th class="excel-row-head">24</th>
                  <td class="xc-label" title="Tên kinh (nhãn hiển thị)">Vị</td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ, không có công thức trong map.md)">±</td>
                  <td class="xc xc-c" :title="excelCellHint('C24')"><span class="xref">C24</span></td>
                  <td class="xc xc-d" :title="excelCellHint('D24')"><span class="xref">D24</span></td>
                  <td class="xc xc-e" :title="excelCellHint('E24')"><span class="xref">E24</span></td>
                  <td class="xc xc-f" :title="excelCellHint('F24')"><span class="xref">F24</span></td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ)">±</td>
                  <td class="xc xc-h" :title="excelCellHint('H24')"><span class="xref">H24</span></td>
                </tr>
                <tr>
                  <th class="excel-row-head">25</th>
                  <td class="xc-label" title="Tên kinh (nhãn hiển thị)">Can</td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ, không có công thức trong map.md)">±</td>
                  <td class="xc xc-c" :title="excelCellHint('C25')"><span class="xref">C25</span></td>
                  <td class="xc xc-d" :title="excelCellHint('D25')"><span class="xref">D25</span></td>
                  <td class="xc xc-e" :title="excelCellHint('E25')"><span class="xref">E25</span></td>
                  <td class="xc xc-f" :title="excelCellHint('F25')"><span class="xref">F25</span></td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ)">±</td>
                  <td class="xc xc-h" :title="excelCellHint('H25')"><span class="xref">H25</span></td>
                </tr>
                <tr>
                  <th class="excel-row-head">26</th>
                  <td class="xc-label" title="Tên kinh (nhãn hiển thị)">Tỳ</td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ, không có công thức trong map.md)">±</td>
                  <td class="xc xc-c" :title="excelCellHint('C26')"><span class="xref">C26</span></td>
                  <td class="xc xc-d" :title="excelCellHint('D26')"><span class="xref">D26</span></td>
                  <td class="xc xc-e" :title="excelCellHint('E26')"><span class="xref">E26</span></td>
                  <td class="xc xc-f" :title="excelCellHint('F26')"><span class="xref">F26</span></td>
                  <td class="xc-note" title="Cột ghi dấu ± (hiển thị phụ)">±</td>
                  <td class="xc xc-h" :title="excelCellHint('H26')"><span class="xref">H26</span></td>
                </tr>
                <tr class="excel-gap">
                  <th class="excel-row-head">27</th>
                  <td colspan="8" class="xc-gap"></td>
                </tr>
                <tr>
                  <th class="excel-row-head">28</th>
                  <td class="xc-empty"></td>
                  <td class="xc-empty"></td>
                  <td class="xc-empty"></td>
                  <td class="xc-empty"></td>
                  <td class="xc-empty"></td>
                  <td class="xc-empty"></td>
                  <td class="xc-empty"></td>
                  <td class="xc xc-h" :title="excelCellHint('H28')"><span class="xref">H28</span><span class="xref-formula"> = D7 − D18</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <p class="excel-map-caption">
            Chi dưới · cùng cấu trúc; <span class="xref-inline">E21</span>…<span class="xref-inline">E26</span> so với <span class="xref-inline">D18</span>.
            <span class="xref-inline">H28</span>: chênh hai đường cơ sở trên / dưới.
          </p>

          <div class="map-legend" aria-label="Chú thích màu cột">
            <span><i class="lg lg-a"></i> A — MAX/MIN vùng đo</span>
            <span><i class="lg lg-b"></i> B — biên độ</span>
            <span><i class="lg lg-c"></i> C — đo trái</span>
            <span><i class="lg lg-f"></i> F — đo phải</span>
            <span><i class="lg lg-d"></i> D — trung bình / đường cơ sở</span>
            <span><i class="lg lg-e"></i> E — độ lệch</span>
            <span><i class="lg lg-h"></i> H — |trái − phải|</span>
          </div>
        </div>
      </details>

      <div class="toolbar">
        <label class="search-wrap">
          <span class="search-label">Tìm kiếm</span>
          <input
            v-model="searchQuery"
            type="search"
            class="search-input"
            placeholder="Tìm theo tên bệnh, mã, thể bệnh, pháp trị..."
            autocomplete="off"
          />
        </label>
        <span class="toolbar-count">{{ filteredList.length }} / {{ dataList.length }} bệnh</span>
      </div>

      <div class="data-card" :class="{ 'data-card--loading': pageLoading }">
        <div v-if="pageLoading" class="loading-bar" aria-hidden="true"></div>
        <div class="card-header">
          <h3>Bệnh Kinh Lạc</h3>
          <span class="badge badge-info">{{ dataTotal }} bản ghi</span>
        </div>

        <div v-if="pagedList.length === 0" class="empty-state">
          {{ searchQuery.trim() ? 'Không khớp bản ghi nào' : 'Chưa có dữ liệu' }}
        </div>

        <div v-else class="disease-grid">
          <article v-for="item in pagedList" :key="item.id" class="disease-card">
            <header class="disease-card__head">
              <div class="disease-card__title">
                <span class="disease-card__id">#{{ item.id }}</span>
                <h4 class="disease-card__name">{{ item.name }}</h4>
              </div>
              <div class="action-buttons">
                <button type="button" class="btn-action btn-edit" @click="openEditModal(item)">Sửa</button>
                <button type="button" class="btn-action btn-delete" @click="confirmDelete(item)">Xóa</button>
              </div>
            </header>

            <div class="disease-card__body">
              <section v-if="theBenhItemsForBenh(item).length" class="disease-section">
                <span class="disease-section__label">Thể bệnh</span>
                <div class="chip-row chip-row--wrap">
                  <a
                    v-for="(t, i) in theBenhItemsForBenh(item)"
                    :key="i"
                    :href="phapTriHref(t.id)"
                    target="_blank"
                    rel="noopener"
                    class="chip chip-the chip-link-the"
                    :title="`Mở pháp trị: ${t.name}`"
                  >
                    {{ t.name }}
                  </a>
                </div>
              </section>

              <section v-if="phapTriItemsForBenh(item).length" class="disease-section">
                <span class="disease-section__label">Pháp trị</span>
                <div class="chip-row chip-row--wrap">
                  <a
                    v-for="(p, i) in phapTriItemsForBenh(item)"
                    :key="i"
                    :href="phapTriHref(p.id)"
                    target="_blank"
                    rel="noopener"
                    class="chip chip-phap chip-link-phap"
                    :title="`Mở pháp trị: ${p.name}`"
                  >
                    {{ p.name }}
                  </a>
                </div>
              </section>

              <section v-if="trieuChungLabelsForBenh(item).length" class="disease-section">
                <span class="disease-section__label">Triệu chứng</span>
                <div class="chip-row chip-row--wrap">
                  <span
                    v-for="(t, i) in trieuChungLabelsForBenh(item)"
                    :key="i"
                    class="chip chip-trieu"
                  >
                    {{ t }}
                  </span>
                </div>
              </section>

              <section v-if="baiThuocItemsForBenh(item).length" class="disease-section">
                <span class="disease-section__label">Bài thuốc</span>
                <div class="chip-row chip-row--wrap">
                  <template v-for="(b, i) in baiThuocItemsForBenh(item)" :key="i">
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

              <section v-if="(phacDoByBenh.get(item.id) ?? []).length" class="disease-section">
                <span class="disease-section__label">Phương huyệt</span>
                <div class="chip-row chip-row--wrap">
                  <span
                    v-for="p in (phacDoByBenh.get(item.id) ?? [])"
                    :key="p.idPhacDo"
                    class="chip chip-huyet"
                  >
                    {{ huyetLabel(p.huyetVi) }}
                  </span>
                </div>
              </section>

              <p
                v-if="
                  !theBenhLabelsForBenh(item).length &&
                  !phapTriLabelsForBenh(item).length &&
                  !trieuChungLabelsForBenh(item).length &&
                  !baiThuocLabelsForBenh(item).length &&
                  !(phacDoByBenh.get(item.id) ?? []).length
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
          <h3>{{ editingId != null ? 'Sửa bệnh' : 'Thêm bệnh' }}</h3>
          <button type="button" class="modal-close" aria-label="Đóng" @click="closeModal">✕</button>
        </div>
        <form class="modal-body modal-body--loadable" @submit.prevent="handleSubmit">
          <div v-if="formLoading" class="modal-loading-overlay">
            <div class="spinner spinner--sm"></div>
            <span>Đang tải tùy chọn…</span>
          </div>
          <p v-if="formError" class="form-error">{{ formError }}</p>
          <div class="form-grid">
            <label class="field">
              <span>Mã (code) <abbr title="bắt buộc">*</abbr></span>
              <input v-model="form.code" class="input" maxlength="120" />
            </label>
            <label class="field">
              <span>Tên hiển thị <abbr title="bắt buộc">*</abbr></span>
              <input v-model="form.name" class="input" maxlength="255" />
            </label>
            <label class="field field--full">
              <span>Ô output (Excel) <abbr title="bắt buộc">*</abbr></span>
              <input v-model="form.outputCell" class="input" maxlength="20" placeholder="vd. K12" />
            </label>
            <details class="field field--full readonly-panel">
              <summary class="readonly-summary">
                <span>Chi tiết kỹ thuật (chỉ xem)</span>
                <span class="readonly-hint">Công thức Excel · Logic · SQL CASE — không sửa được</span>
              </summary>
              <div class="readonly-body">
                <label class="field field--full">
                  <span>Công thức Excel</span>
                  <textarea
                    v-model="form.excelFormula"
                    class="textarea readonly-input"
                    rows="3"
                    spellcheck="false"
                    readonly
                  ></textarea>
                </label>
                <label class="field field--full">
                  <span>Logic (AND các mệnh đề)</span>
                  <textarea
                    v-model="form.logicExpression"
                    class="textarea mono readonly-input"
                    rows="4"
                    spellcheck="false"
                    readonly
                  ></textarea>
                </label>
                <label class="field field--full">
                  <span>SQL CASE (text)</span>
                  <textarea
                    v-model="form.sqlCaseText"
                    class="textarea mono readonly-input"
                    rows="4"
                    spellcheck="false"
                    readonly
                  ></textarea>
                </label>
                <label class="field field--full">
                  <span>SQL CASE (boolean)</span>
                  <textarea
                    v-model="form.sqlCaseBoolean"
                    class="textarea mono readonly-input"
                    rows="4"
                    spellcheck="false"
                    readonly
                  ></textarea>
                </label>
              </div>
            </details>

            <div class="field field--full">
              <div class="field-head">
                <span>Pháp trị (có thể chọn nhiều)</span>
                <span class="field-count">{{ form.id_phap_tri_list.length }} đã chọn</span>
              </div>
              <div v-if="phapTriOptions.length === 0" class="muted">Chưa có pháp trị</div>
              <template v-else>
                <div class="picker-search">
                  <input v-model="phapTriSearch" type="search" class="input input--sm" placeholder="Tìm pháp trị..." />
                </div>
                <div class="chip-picker chip-picker--scroll">
                  <button
                    v-for="p in filteredPhapTriOptions"
                    :key="p.id"
                    type="button"
                    class="chip-toggle"
                    :class="{ active: form.id_phap_tri_list.includes(p.id) }"
                    @click="form.id_phap_tri_list = toggleId(form.id_phap_tri_list, p.id)"
                  >
                    {{ phapTriLabel(p) }}
                  </button>
                  <span v-if="filteredPhapTriOptions.length === 0" class="muted">Không khớp "{{ phapTriSearch }}"</span>
                </div>
              </template>
            </div>

            <div class="field field--full">
              <div class="field-head">
                <span>Triệu chứng</span>
                <span class="field-count">{{ form.id_trieu_chung_list.length }} đã chọn</span>
              </div>
              <div v-if="trieuChungOptions.length === 0" class="muted">Chưa có dữ liệu triệu chứng</div>
              <template v-else>
                <div class="picker-search">
                  <input v-model="trieuChungSearch" type="search" class="input input--sm" placeholder="Tìm triệu chứng..." />
                </div>
                <div class="chip-picker chip-picker--scroll">
                  <button
                    v-for="t in filteredTrieuChungOptions"
                    :key="t.id"
                    type="button"
                    class="chip-toggle"
                    :class="{ active: form.id_trieu_chung_list.includes(t.id) }"
                    @click="form.id_trieu_chung_list = toggleId(form.id_trieu_chung_list, t.id)"
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
                  <span v-if="filteredTrieuChungOptions.length === 0 && !canCreateTrieuChung" class="muted">Không khớp "{{ trieuChungSearch }}"</span>
                </div>
              </template>
            </div>

            <div class="field field--full">
              <div class="field-head">
                <span>Bài thuốc</span>
                <span class="field-count">{{ form.id_bai_thuoc_list.length }} đã chọn</span>
              </div>
              <div v-if="baiThuocOptions.length === 0" class="muted">Chưa có dữ liệu bài thuốc</div>
              <template v-else>
                <div class="picker-search">
                  <input v-model="baiThuocSearch" type="search" class="input input--sm" placeholder="Tìm bài thuốc..." />
                </div>
                <div class="chip-picker chip-picker--scroll">
                  <button
                    v-for="b in filteredBaiThuocOptions"
                    :key="b.id"
                    type="button"
                    class="chip-toggle"
                    :class="{ active: form.id_bai_thuoc_list.includes(b.id) }"
                    @click="form.id_bai_thuoc_list = toggleId(form.id_bai_thuoc_list, b.id)"
                  >
                    {{ b.ten_bai_thuoc }}
                  </button>
                  <span v-if="filteredBaiThuocOptions.length === 0" class="muted">Không khớp "{{ baiThuocSearch }}"</span>
                </div>
              </template>
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
            Xóa bệnh <strong>{{ deletingItem?.name }}</strong>? Thao tác không hoàn tác.
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
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
.header-content {
  flex: 1;
  min-width: 200px;
}
.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--brown-800);
  margin-bottom: var(--space-1);
}
.page-subtitle {
  color: var(--gray-500);
  font-size: var(--font-size-md);
}
.inline-code {
  font-size: 0.9em;
  background: var(--gray-100);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

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
.btn-primary:hover {
  background: var(--brown-700);
}
.btn-secondary {
  padding: var(--space-3) var(--space-5);
  background: var(--white);
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary:hover {
  background: var(--gray-50);
}
.btn-danger {
  padding: var(--space-3) var(--space-5);
  background: var(--danger);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
}
.mt-4 {
  margin-top: var(--space-4);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-bottom: var(--space-4);
}
.search-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
  min-width: 200px;
  max-width: 420px;
}
.search-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.search-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
}
.toolbar-count {
  font-size: var(--font-size-sm);
  color: var(--gray-500);
  font-weight: 600;
}

.spinner--sm { width: 20px; height: 20px; border-width: 2px; }
.loading-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; overflow: hidden; background: rgba(146, 64, 14, 0.08); z-index: 5; }
.loading-bar::before { content: ''; position: absolute; top: 0; left: 0; width: 40%; height: 100%; background: linear-gradient(90deg, transparent, var(--brown-500), transparent); animation: loadingBarSlide 1.1s ease-in-out infinite; }
@keyframes loadingBarSlide { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }
.data-card--loading { pointer-events: none; position: relative; }
.modal-body--loadable { position: relative; min-height: 80px; }
.modal-loading-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-2); background: rgba(255,255,255,0.82); backdrop-filter: blur(2px); z-index: 10; color: var(--brown-700); font-size: var(--font-size-sm); font-weight: 600; }

.data-card {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  position: relative;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  background: var(--brown-50);
  border-bottom: 1px solid var(--brown-100);
}
.card-header h3 {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--brown-900);
  margin: 0;
}

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
}
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

.disease-empty {
  margin: 0;
  font-size: var(--font-size-sm);
  text-align: center;
  padding: var(--space-3) 0;
}

.excel-map-panel {
  margin-bottom: var(--space-5);
  border: 1px solid var(--brown-200);
  border-radius: var(--radius-xl);
  background: linear-gradient(165deg, #fffdfb 0%, var(--white) 40%);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.excel-map-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  cursor: pointer;
  list-style: none;
  font-weight: 700;
  color: var(--brown-900);
  background: linear-gradient(90deg, var(--brown-50), #fff);
  border-bottom: 1px solid var(--brown-100);
}
.excel-map-summary::-webkit-details-marker {
  display: none;
}
.excel-map-summary::before {
  content: '▸';
  display: inline-block;
  margin-right: var(--space-2);
  transition: transform 0.2s ease;
  color: var(--brown-500);
}
.excel-map-panel[open] .excel-map-summary::before {
  transform: rotate(90deg);
}
.excel-map-summary-title {
  font-size: var(--font-size-md);
}
.excel-map-summary-hint {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--gray-500);
}
.excel-map-body {
  padding: var(--space-5);
}
.excel-map-intro {
  margin: 0 0 var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--gray-700);
  line-height: 1.55;
}
.excel-map-caption {
  margin: var(--space-3) 0 var(--space-4);
  font-size: var(--font-size-xs);
  color: var(--gray-600);
  line-height: 1.5;
}
.xref-inline {
  font-family: ui-monospace, monospace;
  font-weight: 700;
  font-size: 0.95em;
  color: var(--brown-800);
  padding: 0 3px;
  background: rgba(192, 139, 66, 0.12);
  border-radius: 3px;
}

.excel-sheet-scroll {
  overflow-x: auto;
  margin-bottom: var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid #c6d4e3;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}
.excel-sheet {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  font-family: 'Segoe UI', Calibri, 'Helvetica Neue', Arial, sans-serif;
  font-size: 13px;
  background: #fff;
  table-layout: fixed;
}
.excel-sheet thead th {
  background: linear-gradient(180deg, #f3f2f1 0%, #e8e7e4 100%);
  border: 1px solid #c6d4e3;
  padding: 6px 8px;
  font-weight: 700;
  font-size: 12px;
  color: #323130;
  text-align: center;
}
.excel-corner {
  background: #e7e6e4 !important;
  width: 44px;
}
.excel-row-head {
  background: #f3f2f1 !important;
  border: 1px solid #c6d4e3;
  width: 44px;
  padding: 6px 4px;
  font-weight: 600;
  font-size: 12px;
  color: #605e5c;
  text-align: center;
}
.excel-sheet tbody td {
  border: 1px solid #d0d7de;
  padding: 6px 8px;
  text-align: center;
  vertical-align: middle;
  height: 28px;
}
.excel-sheet tbody td[title]:not([title='']) {
  cursor: help;
}
.excel-sheet tbody tr.excel-gap .xc-gap {
  height: 14px;
  padding: 0;
  background: repeating-linear-gradient(
    90deg,
    #fafafa,
    #fafafa 6px,
    #f3f3f3 6px,
    #f3f3f3 12px
  );
  border-color: #e8ecf0;
}
.excel-gap .excel-row-head {
  background: #fafafa !important;
  color: #a19f9d;
}
.xc-empty {
  background: #fafafa;
}
.xc-label {
  text-align: left !important;
  font-weight: 600;
  color: var(--brown-900);
  background: #fffefb;
}
.xc-note {
  font-size: 11px;
  color: #8a8886;
  font-weight: 600;
  background: #fafafa;
}
.xref {
  display: inline-block;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.xref-formula {
  display: block;
  margin-top: 4px;
  font-size: 10px;
  font-weight: 500;
  color: #605e5c;
  font-family: ui-monospace, monospace;
}
.xc-a {
  background: rgba(156, 163, 175, 0.18);
}
.xc-b {
  background: rgba(16, 185, 129, 0.12);
}
.xc-c {
  background: rgba(59, 130, 246, 0.14);
}
.xc-d {
  background: rgba(107, 114, 128, 0.12);
}
.xc-e {
  background: rgba(245, 158, 11, 0.18);
}
.xc-f {
  background: rgba(16, 185, 129, 0.14);
}
.xc-h {
  background: rgba(139, 92, 246, 0.14);
}

.map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-5);
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px dashed var(--brown-200);
  font-size: var(--font-size-xs);
  color: var(--gray-600);
}
.map-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.map-legend .lg {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}
.map-legend .lg-a {
  background: rgba(107, 114, 128, 0.45);
}
.map-legend .lg-b {
  background: rgba(16, 185, 129, 0.4);
}
.map-legend .lg-c {
  background: rgba(59, 130, 246, 0.35);
}
.map-legend .lg-f {
  background: rgba(16, 185, 129, 0.35);
}
.map-legend .lg-d {
  background: rgba(107, 114, 128, 0.35);
}
.map-legend .lg-e {
  background: rgba(245, 158, 11, 0.45);
}
.map-legend .lg-h {
  background: rgba(139, 92, 246, 0.35);
}

.action-buttons {
  display: inline-flex;
  gap: var(--space-2);
}
.btn-action {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}
.btn-edit {
  background: var(--brown-50);
  color: var(--brown-800);
  border-color: var(--brown-200);
}
.btn-edit:hover {
  background: var(--brown-100);
}
.btn-delete {
  background: var(--danger-bg);
  color: var(--danger);
  border-color: var(--danger-border);
}
.btn-delete:hover {
  background: var(--danger-bg);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--gray-50);
  border-top: 1px solid var(--gray-100);
}
.page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--gray-600);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.page-btn:hover:not(:disabled) {
  border-color: var(--brown-400);
  color: var(--brown-700);
  background: var(--brown-50);
}
.page-btn.active {
  background: var(--brown-600);
  border-color: var(--brown-600);
  color: var(--white);
}
.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.page-info {
  margin-left: var(--space-4);
  font-size: var(--font-size-xs);
  color: var(--gray-500);
  font-weight: 600;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.badge-info {
  background: var(--info-bg);
  color: var(--info-fg);
}

.text-center {
  text-align: center !important;
}
.py-8 {
  padding-top: 2rem !important;
  padding-bottom: 2rem !important;
}
.font-bold {
  font-weight: 700 !important;
}
.font-medium {
  font-weight: 600 !important;
}
.text-brown-700 {
  color: var(--brown-700) !important;
}
.text-brown-900 {
  color: var(--brown-900) !important;
}
.text-gray-500 {
  color: var(--gray-500) !important;
}
.text-gray-600 {
  color: var(--gray-600) !important;
}
.text-right {
  text-align: right !important;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-12) 0;
  color: var(--brown-600);
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--brown-500);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.error-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--danger);
  background: var(--danger-bg);
  border-radius: var(--radius-lg);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}
.modal {
  background: var(--white);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 600px;
  max-height: 92vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  animation: modalIn 0.25s ease;
}
.modal--wide {
  max-width: 880px;
}
.modal--sm {
  max-width: 420px;
}
@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--gray-100);
}
.modal-header h3 {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--black);
  margin: 0;
}
.modal-close {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-400);
  font-size: var(--font-size-lg);
  background: none;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.modal-close:hover {
  background: var(--gray-100);
  color: var(--gray-700);
}
.modal-body {
  padding: var(--space-6);
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--gray-100);
}
.form-error {
  color: var(--danger);
  font-size: var(--font-size-sm);
  margin: 0 0 var(--space-4);
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.field span {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--gray-700);
}
.field--full {
  grid-column: 1 / -1;
}
.input,
.textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-family: inherit;
}
.textarea.mono {
  font-family: ui-monospace, monospace;
  font-size: var(--font-size-xs);
  line-height: 1.5;
}

.readonly-panel {
  border: 1px dashed var(--gray-300);
  border-radius: var(--radius-md);
  background: var(--gray-50);
  padding: 0;
}
.readonly-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  list-style: none;
  font-weight: 600;
  color: var(--gray-700);
}
.readonly-summary::-webkit-details-marker { display: none; }
.readonly-summary::before {
  content: '▸';
  display: inline-block;
  margin-right: var(--space-2);
  transition: transform 0.2s ease;
  color: var(--gray-500);
}
.readonly-panel[open] .readonly-summary::before { transform: rotate(90deg); }
.readonly-hint {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--gray-500);
}
.readonly-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4) var(--space-4);
  border-top: 1px dashed var(--gray-200);
}
.readonly-input {
  background: var(--white);
  color: var(--gray-600);
  cursor: not-allowed;
}
.readonly-input:focus {
  outline: none;
  border-color: var(--gray-300);
  box-shadow: none;
}

.chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  border: 1px solid transparent;
}
.chip-phap {
  background: var(--chip-method-bg);
  color: var(--chip-method-fg);
  border-color: var(--chip-method-border);
}
.chip-the {
  background: var(--chip-pattern-bg);
  color: var(--chip-pattern-fg);
  border-color: var(--chip-pattern-border);
}
.chip-huyet {
  background: var(--chip-pulse-bg);
  color: var(--chip-pulse-fg);
  border-color: var(--chip-pulse-border);
}
.chip-trieu {
  background: var(--chip-symptom-bg);
  color: var(--chip-symptom-fg);
  border-color: var(--chip-symptom-border);
}
.chip-bai {
  background: var(--chip-herb-bg);
  color: var(--chip-herb-fg);
  border-color: var(--chip-herb-border);
}
.chip-link,
.chip-link-the,
.chip-link-phap {
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, transform 0.05s;
}
.chip-link:hover { background: var(--chip-herb-border); border-color: var(--chip-herb-fg); }
.chip-link-phap:hover { background: var(--chip-method-border); border-color: var(--chip-method-fg); }
.chip-link-the:hover { background: var(--chip-pattern-border); border-color: var(--chip-pattern-fg); }
.chip-link:active,
.chip-link-the:active,
.chip-link-phap:active { transform: translateY(1px); }
.chip-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  overflow-x: auto;
  white-space: nowrap;
}
.chip-row--wrap {
  flex-wrap: wrap;
  overflow-x: visible;
  white-space: normal;
  gap: 6px;
}
.chip-row .chip {
  flex: 0 0 auto;
}
.chip-row--wrap .chip {
  white-space: normal;
  word-break: break-word;
  max-width: 100%;
}
.muted {
  color: var(--gray-400);
  font-style: italic;
}

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
  border-radius: 999px;
}
.picker-search {
  margin-bottom: 6px;
}
.input--sm {
  padding: 6px 10px;
  font-size: 13px;
}
.chip-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: var(--space-2);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: var(--gray-50);
}
.chip-picker--scroll {
  max-height: 200px;
  overflow-y: auto;
}
.chip-toggle {
  padding: 4px 10px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 999px;
  border: 1px solid var(--gray-300);
  background: var(--white);
  color: var(--gray-700);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.chip-toggle:hover {
  border-color: var(--brown-400);
  color: var(--brown-700);
}
.chip-toggle.active {
  background: var(--brown-600);
  color: var(--white);
  border-color: var(--brown-600);
}
.chip-create { border-style: dashed; border-color: var(--brown-400); color: var(--brown-700); background: var(--brown-50); }
.chip-create:hover:not(:disabled) { background: var(--brown-100); border-color: var(--brown-500); }
.chip-create:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .field--full {
    grid-column: 1;
  }
  .management-page {
    padding: var(--space-4);
  }
}
</style>
