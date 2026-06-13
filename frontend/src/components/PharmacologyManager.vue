<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// xlsx (~nặng) nạp ĐỘNG trong 2 hàm Xuất/Nhập Excel bên dưới (`await import('xlsx')`),
// để không gộp vào chunk component này — chỉ tải khi người dùng bấm nút.
import { api } from '@/services/api'

interface ViThuoc { id: number; ten_vi_thuoc: string }
interface ChuTri { id: number; ten_chu_tri: string }

interface NhomNho {
  id: number
  idNhomLon: number
  ten_nhom: string
  lieu_luong: string | null
  mo_ta: string | null
  thu_tu: number
  viThuocLinks?: { idViThuoc: number; viThuoc?: ViThuoc }[]
  chuTriLinks?: { idChuTri: number; chuTri?: ChuTri }[]
}

interface NhomLon {
  id: number
  ten_nhom: string
  mo_ta: string | null
  thu_tu: number
  nhomNhoList?: NhomNho[]
}

const isLoading = ref(true)
const isSubmitting = ref(false)
const error = ref<string | null>(null)

const nhomLonList = ref<NhomLon[]>([])
const viThuocCatalog = ref<ViThuoc[]>([])
const chuTriCatalog = ref<ChuTri[]>([])

const selectedNhomLonId = ref<number | null>(null)
const selectedNhomLon = computed(
  () => nhomLonList.value.find((n) => n.id === selectedNhomLonId.value) || null,
)

// ── Modals state ───────────────────────────────────────────────
const showNhomLonModal = ref(false)
const editingNhomLon = ref<NhomLon | null>(null)
const nhomLonForm = ref({ ten_nhom: '', mo_ta: '', thu_tu: 0 })

const showNhomNhoModal = ref(false)
const editingNhomNho = ref<NhomNho | null>(null)
const nhomNhoForm = ref({
  ten_nhom: '',
  lieu_luong: '',
  mo_ta: '',
  thu_tu: 0,
  vi_thuoc_ids: [] as number[],
  chu_tri_ids: [] as number[],
})

const viThuocFilter = ref('')
const chuTriFilter = ref('')

const filteredViThuoc = computed(() => {
  const q = viThuocFilter.value.trim().toLowerCase()
  const selected = new Set(nhomNhoForm.value.vi_thuoc_ids)
  return viThuocCatalog.value
    .filter((v) => !selected.has(v.id))
    .filter((v) => !q || v.ten_vi_thuoc.toLowerCase().includes(q))
    .slice(0, 20)
})

/** Có khớp chính xác (case-insensitive) trong toàn bộ catalog không? — dùng để hiện nút "Tạo mới". */
const viThuocExactMatch = computed(() => {
  const q = viThuocFilter.value.trim().toLowerCase()
  if (!q) return true
  return viThuocCatalog.value.some((v) => v.ten_vi_thuoc.trim().toLowerCase() === q)
})

const creatingViThuoc = ref(false)

const filteredChuTri = computed(() => {
  const q = chuTriFilter.value.trim().toLowerCase()
  const selected = new Set(nhomNhoForm.value.chu_tri_ids)
  return chuTriCatalog.value
    .filter((c) => !selected.has(c.id))
    .filter((c) => !q || c.ten_chu_tri.toLowerCase().includes(q))
    .slice(0, 20)
})

function viThuocName(id: number): string {
  return viThuocCatalog.value.find((v) => v.id === id)?.ten_vi_thuoc || `#${id}`
}
function chuTriName(id: number): string {
  return chuTriCatalog.value.find((c) => c.id === id)?.ten_chu_tri || `#${id}`
}

onMounted(fetchAll)

async function fetchAll() {
  isLoading.value = true
  error.value = null
  try {
    // Dùng /vi-thuoc/lite để cắt nested relations nặng (congDungLinks/chuTriLinks/...).
    const [nhomLonRes, viThuocRes, chuTriRes] = await Promise.all([
      api.get<NhomLon[] | { data: NhomLon[] }>('/nhom-lon-duoc-ly'),
      api.get<any>('/vi-thuoc/lite?page=1&limit=100000'),
      api.get<ChuTri[] | { data: ChuTri[] }>('/chu-tri'),
    ])
    nhomLonList.value = Array.isArray(nhomLonRes) ? nhomLonRes : (nhomLonRes.data ?? [])
    viThuocCatalog.value = Array.isArray(viThuocRes) ? viThuocRes : (viThuocRes?.data ?? [])
    chuTriCatalog.value = Array.isArray(chuTriRes) ? chuTriRes : (chuTriRes.data ?? [])
    const first = nhomLonList.value[0]
    if (!selectedNhomLonId.value && first) {
      selectedNhomLonId.value = first.id
    }
  } catch (err: any) {
    error.value = 'Lỗi khi tải dữ liệu: ' + err.message
  } finally {
    isLoading.value = false
  }
}

// ── Nhóm lớn CRUD ──────────────────────────────────────────────
function openCreateNhomLon() {
  editingNhomLon.value = null
  nhomLonForm.value = { ten_nhom: '', mo_ta: '', thu_tu: 0 }
  showNhomLonModal.value = true
}

function openEditNhomLon(nl: NhomLon) {
  editingNhomLon.value = nl
  nhomLonForm.value = {
    ten_nhom: nl.ten_nhom,
    mo_ta: nl.mo_ta ?? '',
    thu_tu: nl.thu_tu,
  }
  showNhomLonModal.value = true
}

async function saveNhomLon() {
  if (isSubmitting.value) return
  if (!nhomLonForm.value.ten_nhom.trim()) {
    alert('Vui lòng nhập tên nhóm lớn')
    return
  }
  isSubmitting.value = true
  try {
    const body = {
      ten_nhom: nhomLonForm.value.ten_nhom.trim(),
      mo_ta: nhomLonForm.value.mo_ta.trim() || null,
      thu_tu: Number(nhomLonForm.value.thu_tu) || 0,
    }
    if (editingNhomLon.value) {
      await api.put(`/nhom-lon-duoc-ly/${editingNhomLon.value.id}`, body)
    } else {
      const res: any = await api.post('/nhom-lon-duoc-ly', body)
      const newId = res?.id ?? res?.data?.id
      if (newId) selectedNhomLonId.value = newId
    }
    showNhomLonModal.value = false
    await fetchAll()
  } catch (err: any) {
    alert('Lưu thất bại: ' + err.message)
  } finally {
    isSubmitting.value = false
  }
}

async function deleteNhomLon(nl: NhomLon) {
  if (isSubmitting.value) return
  if (!confirm(`Xóa nhóm lớn «${nl.ten_nhom}»? Tất cả nhóm nhỏ thuộc nhóm này cũng bị xóa.`)) return
  isSubmitting.value = true
  try {
    await api.delete(`/nhom-lon-duoc-ly/${nl.id}`)
    if (selectedNhomLonId.value === nl.id) selectedNhomLonId.value = null
    await fetchAll()
  } catch (err: any) {
    alert('Xóa thất bại: ' + err.message)
  } finally {
    isSubmitting.value = false
  }
}

// ── Nhóm nhỏ CRUD ──────────────────────────────────────────────
function openCreateNhomNho() {
  if (!selectedNhomLonId.value) {
    alert('Chọn 1 nhóm lớn trước')
    return
  }
  editingNhomNho.value = null
  nhomNhoForm.value = {
    ten_nhom: '',
    lieu_luong: '',
    mo_ta: '',
    thu_tu: 0,
    vi_thuoc_ids: [],
    chu_tri_ids: [],
  }
  viThuocFilter.value = ''
  chuTriFilter.value = ''
  showNhomNhoModal.value = true
}

function openEditNhomNho(nn: NhomNho) {
  editingNhomNho.value = nn
  nhomNhoForm.value = {
    ten_nhom: nn.ten_nhom,
    lieu_luong: nn.lieu_luong ?? '',
    mo_ta: nn.mo_ta ?? '',
    thu_tu: nn.thu_tu,
    vi_thuoc_ids: (nn.viThuocLinks ?? []).map((l) => l.idViThuoc),
    chu_tri_ids: (nn.chuTriLinks ?? []).map((l) => l.idChuTri),
  }
  viThuocFilter.value = ''
  chuTriFilter.value = ''
  showNhomNhoModal.value = true
}

async function saveNhomNho() {
  if (isSubmitting.value) return
  if (!nhomNhoForm.value.ten_nhom.trim()) {
    alert('Vui lòng nhập tên nhóm nhỏ')
    return
  }
  if (!selectedNhomLonId.value) return
  isSubmitting.value = true
  try {
    const body = {
      id_nhom_lon: selectedNhomLonId.value,
      ten_nhom: nhomNhoForm.value.ten_nhom.trim(),
      lieu_luong: nhomNhoForm.value.lieu_luong.trim() || null,
      mo_ta: nhomNhoForm.value.mo_ta.trim() || null,
      thu_tu: Number(nhomNhoForm.value.thu_tu) || 0,
      vi_thuoc_ids: nhomNhoForm.value.vi_thuoc_ids,
      chu_tri_ids: nhomNhoForm.value.chu_tri_ids,
    }
    if (editingNhomNho.value) {
      await api.put(`/nhom-nho-duoc-ly/${editingNhomNho.value.id}`, body)
    } else {
      await api.post('/nhom-nho-duoc-ly', body)
    }
    showNhomNhoModal.value = false
    await fetchAll()
  } catch (err: any) {
    alert('Lưu thất bại: ' + err.message)
  } finally {
    isSubmitting.value = false
  }
}

async function deleteNhomNho(nn: NhomNho) {
  if (isSubmitting.value) return
  if (!confirm(`Xóa nhóm nhỏ «${nn.ten_nhom}»?`)) return
  isSubmitting.value = true
  try {
    await api.delete(`/nhom-nho-duoc-ly/${nn.id}`)
    await fetchAll()
  } catch (err: any) {
    alert('Xóa thất bại: ' + err.message)
  } finally {
    isSubmitting.value = false
  }
}

function addViThuoc(id: number) {
  if (!nhomNhoForm.value.vi_thuoc_ids.includes(id)) {
    nhomNhoForm.value.vi_thuoc_ids.push(id)
  }
  viThuocFilter.value = ''
}

async function createAndAddViThuoc() {
  const name = viThuocFilter.value.trim()
  if (!name || creatingViThuoc.value) return
  creatingViThuoc.value = true
  try {
    const res: any = await api.post('/vi-thuoc', { ten_vi_thuoc: name })
    const newId: number | undefined = res?.id ?? res?.data?.id
    const newName: string = res?.data?.ten_vi_thuoc ?? name
    if (!newId) throw new Error('Server không trả về id vị thuốc mới')
    viThuocCatalog.value = [...viThuocCatalog.value, { id: newId, ten_vi_thuoc: newName }]
    addViThuoc(newId)
  } catch (err: any) {
    alert('Tạo vị thuốc thất bại: ' + err.message)
  } finally {
    creatingViThuoc.value = false
  }
}
function removeViThuoc(id: number) {
  nhomNhoForm.value.vi_thuoc_ids = nhomNhoForm.value.vi_thuoc_ids.filter((x) => x !== id)
}
function addChuTri(id: number) {
  if (!nhomNhoForm.value.chu_tri_ids.includes(id)) {
    nhomNhoForm.value.chu_tri_ids.push(id)
  }
  chuTriFilter.value = ''
}
function removeChuTri(id: number) {
  nhomNhoForm.value.chu_tri_ids = nhomNhoForm.value.chu_tri_ids.filter((x) => x !== id)
}

// ── AI phân loại vị thuốc ──────────────────────────────────────
/** Chỉ nhóm nhỏ tên đúng "Cần Tra Cứu Thêm" (case-insensitive) mới được dùng AI. */
function isCanTraCuuThem(nn: NhomNho): boolean {
  return (nn.ten_nhom ?? '').trim().toLowerCase() === 'cần tra cứu thêm'
}


interface AiClassifyRow {
  id_vi_thuoc: number
  ten_vi_thuoc: string
  /** Nhóm nhỏ AI đề xuất (id). null = AI không chắc → giữ lại nguồn. */
  target_id: number | null
  ly_do: string
  /** Tick để áp dụng hàng này. Mặc định bật nếu AI có đề xuất hợp lệ. */
  selected: boolean
}

const aiClassifyModalOpen = ref(false)
const aiClassifyLoading = ref(false)
const aiClassifyApplying = ref(false)
const aiClassifyError = ref<string | null>(null)
const aiClassifySource = ref<NhomNho | null>(null)
const aiClassifyRows = ref<AiClassifyRow[]>([])

const allNhomNho = computed<NhomNho[]>(() =>
  nhomLonList.value.flatMap((nl) => nl.nhomNhoList ?? []),
)

const aiClassifyCandidates = computed<NhomNho[]>(() => {
  const sourceId = aiClassifySource.value?.id
  return allNhomNho.value.filter((nn) => nn.id !== sourceId)
})

function nhomNhoFullLabel(nn: NhomNho): string {
  const parent = nhomLonList.value.find((nl) => nl.id === nn.idNhomLon)
  const parentName = parent?.ten_nhom ?? ''
  return parentName ? `${parentName} › ${nn.ten_nhom}` : nn.ten_nhom
}

const aiClassifyAssignedCount = computed(() =>
  aiClassifyRows.value.filter((r) => r.target_id != null && r.selected).length,
)

const aiClassifySelectableCount = computed(() =>
  aiClassifyRows.value.filter((r) => r.target_id != null).length,
)

const aiClassifyAllSelected = computed(() => {
  const sel = aiClassifyRows.value.filter((r) => r.target_id != null)
  return sel.length > 0 && sel.every((r) => r.selected)
})

function toggleSelectAllAi() {
  const next = !aiClassifyAllSelected.value
  for (const r of aiClassifyRows.value) {
    if (r.target_id != null) r.selected = next
  }
}

const aiClassifyApplyingRowId = ref<number | null>(null)

async function openAiClassify(nn: NhomNho) {
  const vts = (nn.viThuocLinks ?? []).filter((l) => Number.isFinite(l.idViThuoc))
  if (!vts.length) {
    alert('Nhóm nhỏ này chưa có vị thuốc để phân loại.')
    return
  }
  const candidates = allNhomNho.value.filter((x) => x.id !== nn.id)
  if (!candidates.length) {
    alert('Chưa có nhóm nhỏ nào khác làm ứng viên — hãy tạo thêm nhóm nhỏ trước.')
    return
  }
  aiClassifySource.value = nn
  aiClassifyRows.value = []
  aiClassifyError.value = null
  aiClassifyLoading.value = true
  aiClassifyModalOpen.value = true
  try {
    const payload = {
      vi_thuoc: vts.map((l) => ({
        id: l.idViThuoc,
        ten_vi_thuoc: l.viThuoc?.ten_vi_thuoc?.trim() || viThuocName(l.idViThuoc),
      })),
      nhom_nho_candidates: candidates.map((c) => ({
        id: c.id,
        ten_nhom: c.ten_nhom,
        mo_ta: c.mo_ta ?? null,
        lieu_luong: c.lieu_luong ?? null,
      })),
    }
    const res: any = await api.post('/ai-suggest/classify-vi-thuoc', payload)
    const data: Array<{
      id: number
      ten_vi_thuoc: string
      id_nhom_nho: number | null
      ly_do?: string
    }> = res?.data ?? []
    aiClassifyRows.value = data.map((d) => ({
      id_vi_thuoc: d.id,
      ten_vi_thuoc: d.ten_vi_thuoc,
      target_id: d.id_nhom_nho,
      ly_do: d.ly_do ?? '',
      selected: d.id_nhom_nho != null,
    }))
  } catch (err: any) {
    aiClassifyError.value = 'AI lỗi: ' + (err.message || String(err))
  } finally {
    aiClassifyLoading.value = false
  }
}

function closeAiClassify() {
  aiClassifyModalOpen.value = false
  aiClassifySource.value = null
  aiClassifyRows.value = []
  aiClassifyError.value = null
}

async function applyAiClassifyOne(row: AiClassifyRow) {
  const source = aiClassifySource.value
  if (!source || aiClassifyApplying.value) return
  if (row.target_id == null || row.target_id === source.id) {
    alert('Vị thuốc này chưa có nhóm nhỏ đích hợp lệ.')
    return
  }
  if (aiClassifyApplyingRowId.value != null) return
  aiClassifyApplyingRowId.value = row.id_vi_thuoc
  aiClassifyError.value = null
  try {
    const sourceCurrentIds = (source.viThuocLinks ?? []).map((l) => l.idViThuoc)
    const newSourceIds = sourceCurrentIds.filter((id) => id !== row.id_vi_thuoc)
    await api.put(`/nhom-nho-duoc-ly/${source.id}`, { vi_thuoc_ids: newSourceIds })

    const target = allNhomNho.value.find((x) => x.id === row.target_id)
    const existing = (target?.viThuocLinks ?? []).map((l) => l.idViThuoc)
    const merged = Array.from(new Set([...existing, row.id_vi_thuoc]))
    await api.put(`/nhom-nho-duoc-ly/${row.target_id}`, { vi_thuoc_ids: merged })

    aiClassifyRows.value = aiClassifyRows.value.filter((r) => r.id_vi_thuoc !== row.id_vi_thuoc)
    await fetchAll()
    // Sau fetchAll, source object trong aiClassifySource có thể stale — sync lại
    const refreshed = allNhomNho.value.find((n) => n.id === source.id)
    if (refreshed) aiClassifySource.value = refreshed
    if (!aiClassifyRows.value.length) {
      closeAiClassify()
    }
  } catch (err: any) {
    aiClassifyError.value = 'Áp dụng thất bại: ' + (err.message || String(err))
  } finally {
    aiClassifyApplyingRowId.value = null
  }
}

async function applyAiClassify() {
  const source = aiClassifySource.value
  if (!source || aiClassifyApplying.value) return
  const toMove = aiClassifyRows.value.filter(
    (r) => r.selected && r.target_id != null && r.target_id !== source.id,
  )
  if (!toMove.length) {
    alert('Chưa chọn vị thuốc nào để áp dụng.')
    return
  }
  aiClassifyApplying.value = true
  aiClassifyError.value = null
  try {
    const movesByTarget = new Map<number, number[]>()
    const movedSet = new Set<number>()
    for (const r of toMove) {
      const id = r.target_id as number
      const list = movesByTarget.get(id) ?? []
      list.push(r.id_vi_thuoc)
      movesByTarget.set(id, list)
      movedSet.add(r.id_vi_thuoc)
    }

    const sourceCurrentIds = (source.viThuocLinks ?? []).map((l) => l.idViThuoc)
    const newSourceIds = sourceCurrentIds.filter((id) => !movedSet.has(id))
    await api.put(`/nhom-nho-duoc-ly/${source.id}`, { vi_thuoc_ids: newSourceIds })

    for (const [targetId, addIds] of movesByTarget) {
      const target = allNhomNho.value.find((x) => x.id === targetId)
      const existing = (target?.viThuocLinks ?? []).map((l) => l.idViThuoc)
      const merged = Array.from(new Set([...existing, ...addIds]))
      await api.put(`/nhom-nho-duoc-ly/${targetId}`, { vi_thuoc_ids: merged })
    }

    // Loại các row đã áp dụng khỏi list suggestion
    aiClassifyRows.value = aiClassifyRows.value.filter((r) => !movedSet.has(r.id_vi_thuoc))
    await fetchAll()
    const refreshed = allNhomNho.value.find((n) => n.id === source.id)
    if (refreshed) aiClassifySource.value = refreshed
    if (!aiClassifyRows.value.length) {
      closeAiClassify()
    }
  } catch (err: any) {
    aiClassifyError.value = 'Áp dụng thất bại: ' + (err.message || String(err))
  } finally {
    aiClassifyApplying.value = false
  }
}

// ── Excel Import / Export ──────────────────────────────────────
const EXCEL_COLS = [
  'Nhóm lớn',
  'Mô tả nhóm lớn',
  'Thứ tự nhóm lớn',
  'Nhóm nhỏ',
  'Liều lượng',
  'Mô tả nhóm nhỏ',
  'Thứ tự nhóm nhỏ',
  'Vị thuốc',
  'Chủ trị',
] as const

const isExporting = ref(false)
const isImporting = ref(false)
const importProgress = ref({ current: 0, total: 0 })
const importFileInput = ref<HTMLInputElement | null>(null)
const importResult = ref<{
  rowsProcessed: number
  nhomLonCreated: number
  nhomLonUpdated: number
  nhomNhoCreated: number
  nhomNhoUpdated: number
  viThuocCreated: number
  chuTriCreated: number
  errors: string[]
} | null>(null)
const showImportResultModal = ref(false)

function normKey(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase()
}

function splitCsv(raw: unknown): string[] {
  if (raw == null) return []
  const text = String(raw)
  if (!text.trim()) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of text.split(',')) {
    const t = part.trim().replace(/\s+/g, ' ')
    if (!t) continue
    const k = t.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(t)
  }
  return out
}

async function exportToExcel() {
  if (isExporting.value) return
  isExporting.value = true
  try {
    const XLSX = await import('xlsx')
    const rows: Record<string, string | number>[] = []
    for (const nl of nhomLonList.value) {
      const nhomNhoArr = nl.nhomNhoList ?? []
      if (!nhomNhoArr.length) {
        rows.push({
          [EXCEL_COLS[0]]: nl.ten_nhom,
          [EXCEL_COLS[1]]: nl.mo_ta ?? '',
          [EXCEL_COLS[2]]: nl.thu_tu ?? 0,
          [EXCEL_COLS[3]]: '',
          [EXCEL_COLS[4]]: '',
          [EXCEL_COLS[5]]: '',
          [EXCEL_COLS[6]]: '',
          [EXCEL_COLS[7]]: '',
          [EXCEL_COLS[8]]: '',
        })
        continue
      }
      for (const nn of nhomNhoArr) {
        const viNames = (nn.viThuocLinks ?? [])
          .map((l) => l.viThuoc?.ten_vi_thuoc || viThuocName(l.idViThuoc))
          .join(', ')
        const ctNames = (nn.chuTriLinks ?? [])
          .map((l) => l.chuTri?.ten_chu_tri || chuTriName(l.idChuTri))
          .join(', ')
        rows.push({
          [EXCEL_COLS[0]]: nl.ten_nhom,
          [EXCEL_COLS[1]]: nl.mo_ta ?? '',
          [EXCEL_COLS[2]]: nl.thu_tu ?? 0,
          [EXCEL_COLS[3]]: nn.ten_nhom,
          [EXCEL_COLS[4]]: nn.lieu_luong ?? '',
          [EXCEL_COLS[5]]: nn.mo_ta ?? '',
          [EXCEL_COLS[6]]: nn.thu_tu ?? 0,
          [EXCEL_COLS[7]]: viNames,
          [EXCEL_COLS[8]]: ctNames,
        })
      }
    }

    const ws = XLSX.utils.json_to_sheet(rows, { header: [...EXCEL_COLS] })
    ws['!cols'] = [
      { wch: 22 }, { wch: 28 }, { wch: 8 },
      { wch: 26 }, { wch: 12 }, { wch: 28 }, { wch: 8 },
      { wch: 40 }, { wch: 40 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Nhom duoc ly')
    const stamp = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `nhom-duoc-ly-${stamp}.xlsx`)
  } catch (err: any) {
    alert('Xuất Excel thất bại: ' + err.message)
  } finally {
    isExporting.value = false
  }
}

function triggerImport() {
  importFileInput.value?.click()
}

async function findOrCreateViThuocId(
  name: string,
  catalogByKey: Map<string, ViThuoc>,
  stats: { viThuocCreated: number },
): Promise<number> {
  const k = normKey(name)
  const existing = catalogByKey.get(k)
  if (existing) return existing.id
  const res: any = await api.post('/vi-thuoc', { ten_vi_thuoc: name })
  const newId: number | undefined = res?.id ?? res?.data?.id
  const newName: string = res?.data?.ten_vi_thuoc ?? name
  if (!newId) throw new Error('Server không trả về id vị thuốc mới')
  const created: ViThuoc = { id: newId, ten_vi_thuoc: newName }
  catalogByKey.set(normKey(newName), created)
  viThuocCatalog.value = [...viThuocCatalog.value, created]
  stats.viThuocCreated += 1
  return newId
}

async function findOrCreateChuTriId(
  name: string,
  catalogByKey: Map<string, ChuTri>,
  stats: { chuTriCreated: number },
): Promise<number> {
  const k = normKey(name)
  const existing = catalogByKey.get(k)
  if (existing) return existing.id
  const res: any = await api.post('/chu-tri', { ten_chu_tri: name })
  // chu-tri POST returns the entity directly (no { data } wrapper) — may also return existing if duplicate.
  const newId: number | undefined = res?.id ?? res?.data?.id
  const newName: string = res?.ten_chu_tri ?? res?.data?.ten_chu_tri ?? name
  if (!newId) throw new Error('Server không trả về id chủ trị mới')
  const created: ChuTri = { id: newId, ten_chu_tri: newName }
  catalogByKey.set(normKey(newName), created)
  chuTriCatalog.value = [...chuTriCatalog.value, created]
  // If server returned existing row (de-dupe), it's not "created" — detect by checking if id was already known.
  if (!existing) stats.chuTriCreated += 1
  return newId
}

async function onImportFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (isImporting.value) return
  if (!confirm(`Nhập dữ liệu từ «${file.name}»? Các nhóm trùng tên sẽ được cập nhật.`)) return

  isImporting.value = true
  importProgress.value = { current: 0, total: 0 }
  const stats = {
    rowsProcessed: 0,
    nhomLonCreated: 0,
    nhomLonUpdated: 0,
    nhomNhoCreated: 0,
    nhomNhoUpdated: 0,
    viThuocCreated: 0,
    chuTriCreated: 0,
    errors: [] as string[],
  }

  try {
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const sheetName = wb.SheetNames[0]
    if (!sheetName) throw new Error('File không có sheet nào')
    const ws = wb.Sheets[sheetName]
    if (!ws) throw new Error(`Không đọc được sheet "${sheetName}"`)
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
    importProgress.value = { current: 0, total: rows.length }

    const viByKey = new Map<string, ViThuoc>()
    for (const v of viThuocCatalog.value) viByKey.set(normKey(v.ten_vi_thuoc), v)
    const ctByKey = new Map<string, ChuTri>()
    for (const c of chuTriCatalog.value) ctByKey.set(normKey(c.ten_chu_tri), c)
    const nhomLonByKey = new Map<string, NhomLon>()
    for (const nl of nhomLonList.value) nhomLonByKey.set(normKey(nl.ten_nhom), nl)
    const nhomNhoByKey = new Map<string, NhomNho>() // key = `${idNhomLon}|normKey(ten)`
    for (const nl of nhomLonList.value) {
      for (const nn of nl.nhomNhoList ?? []) {
        nhomNhoByKey.set(`${nl.id}|${normKey(nn.ten_nhom)}`, nn)
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row) continue
      const rowNum = i + 2 // header is row 1
      try {
        const tenNhomLon = String(row[EXCEL_COLS[0]] ?? '').trim()
        if (!tenNhomLon) {
          stats.errors.push(`Dòng ${rowNum}: thiếu «Nhóm lớn»`)
          continue
        }
        const moTaNhomLon = String(row[EXCEL_COLS[1]] ?? '').trim()
        const thuTuNhomLonRaw = row[EXCEL_COLS[2]]
        const thuTuNhomLon = Number(thuTuNhomLonRaw) || 0

        const nlKey = normKey(tenNhomLon)
        let nhomLon = nhomLonByKey.get(nlKey)
        if (nhomLon) {
          // Update only if values changed and provided.
          const patch: any = {}
          const provMoTa = String(row[EXCEL_COLS[1]] ?? '')
          if (provMoTa.trim() !== '' && (nhomLon.mo_ta ?? '') !== moTaNhomLon) {
            patch.mo_ta = moTaNhomLon || null
          }
          if (thuTuNhomLonRaw !== '' && thuTuNhomLonRaw != null && nhomLon.thu_tu !== thuTuNhomLon) {
            patch.thu_tu = thuTuNhomLon
          }
          if (Object.keys(patch).length) {
            const res: any = await api.put(`/nhom-lon-duoc-ly/${nhomLon.id}`, patch)
            const upd: NhomLon = res?.data ?? { ...nhomLon, ...patch }
            nhomLon = { ...nhomLon, ...upd }
            nhomLonByKey.set(nlKey, nhomLon)
            stats.nhomLonUpdated += 1
          }
        } else {
          const res: any = await api.post('/nhom-lon-duoc-ly', {
            ten_nhom: tenNhomLon,
            mo_ta: moTaNhomLon || null,
            thu_tu: thuTuNhomLon,
          })
          const newId: number | undefined = res?.id ?? res?.data?.id
          if (!newId) throw new Error('Không lấy được id nhóm lớn mới')
          nhomLon = {
            id: newId,
            ten_nhom: tenNhomLon,
            mo_ta: moTaNhomLon || null,
            thu_tu: thuTuNhomLon,
            nhomNhoList: [],
          }
          nhomLonByKey.set(nlKey, nhomLon)
          stats.nhomLonCreated += 1
        }

        const tenNhomNho = String(row[EXCEL_COLS[3]] ?? '').trim()
        if (!tenNhomNho) {
          // Row defines only a nhóm lớn — accepted.
          stats.rowsProcessed += 1
          continue
        }
        const lieuLuong = String(row[EXCEL_COLS[4]] ?? '').trim()
        const moTaNhomNho = String(row[EXCEL_COLS[5]] ?? '').trim()
        const thuTuNhomNhoRaw = row[EXCEL_COLS[6]]
        const thuTuNhomNho = Number(thuTuNhomNhoRaw) || 0

        const viNames = splitCsv(row[EXCEL_COLS[7]])
        const ctNames = splitCsv(row[EXCEL_COLS[8]])

        const viIds: number[] = []
        for (const name of viNames) {
          viIds.push(await findOrCreateViThuocId(name, viByKey, stats))
        }
        const ctIds: number[] = []
        for (const name of ctNames) {
          ctIds.push(await findOrCreateChuTriId(name, ctByKey, stats))
        }

        const nnKey = `${nhomLon.id}|${normKey(tenNhomNho)}`
        const existingNhomNho = nhomNhoByKey.get(nnKey)
        const body = {
          id_nhom_lon: nhomLon.id,
          ten_nhom: tenNhomNho,
          lieu_luong: lieuLuong || null,
          mo_ta: moTaNhomNho || null,
          thu_tu: thuTuNhomNho,
          vi_thuoc_ids: viIds,
          chu_tri_ids: ctIds,
        }
        if (existingNhomNho) {
          await api.put(`/nhom-nho-duoc-ly/${existingNhomNho.id}`, body)
          stats.nhomNhoUpdated += 1
        } else {
          const res: any = await api.post('/nhom-nho-duoc-ly', body)
          const newId: number | undefined = res?.id ?? res?.data?.id
          if (newId) {
            nhomNhoByKey.set(nnKey, {
              id: newId,
              idNhomLon: nhomLon.id,
              ten_nhom: tenNhomNho,
              lieu_luong: lieuLuong || null,
              mo_ta: moTaNhomNho || null,
              thu_tu: thuTuNhomNho,
            })
          }
          stats.nhomNhoCreated += 1
        }
        stats.rowsProcessed += 1
      } catch (err: any) {
        stats.errors.push(`Dòng ${rowNum}: ${err?.message ?? err}`)
      } finally {
        importProgress.value = { current: i + 1, total: rows.length }
      }
    }

    importResult.value = stats
    showImportResultModal.value = true
    await fetchAll()
  } catch (err: any) {
    alert('Nhập Excel thất bại: ' + (err?.message ?? err))
  } finally {
    isImporting.value = false
  }
}
</script>

<template>
  <div class="duoc-ly-wrapper">
    <div v-if="isLoading" class="loading-state"><div class="spinner"></div><p>Đang tải...</p></div>
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary mt-4" @click="fetchAll">Thử lại</button>
    </div>

    <div v-else>
      <div class="toolbar">
        <div class="toolbar-left">
          <button
            class="btn-secondary sm"
            :disabled="isExporting || !nhomLonList.length"
            @click="exportToExcel"
          >
            <span v-if="isExporting">Đang xuất…</span>
            <span v-else>⬇ Xuất Excel</span>
          </button>
          <button class="btn-primary sm" :disabled="isImporting" @click="triggerImport">
            <span v-if="isImporting">Đang nhập…</span>
            <span v-else>⬆ Nhập Excel</span>
          </button>
          <input
            ref="importFileInput"
            type="file"
            accept=".xlsx,.xls"
            class="hidden-input"
            @change="onImportFileChange"
          />
        </div>
        <p class="toolbar-hint">
          Cột «Vị thuốc», «Chủ trị» dùng dấu phẩy để ngăn cách. Trùng tên nhóm sẽ được cập nhật, vị
          thuốc / chủ trị mới sẽ được tự tạo.
        </p>
      </div>

    <div class="duoc-ly-grid">
      <!-- Cột trái: Nhóm lớn -->
      <aside class="nhom-lon-pane">
        <div class="pane-header">
          <div class="pane-title-row">
            <h3>Nhóm lớn</h3>
            <span class="badge">{{ nhomLonList.length }}</span>
          </div>
          <button class="btn-primary sm" @click="openCreateNhomLon">+ Nhóm lớn</button>
        </div>
        <ul class="nhom-lon-list">
          <li v-if="!nhomLonList.length" class="empty">Chưa có nhóm lớn</li>
          <li
            v-for="nl in nhomLonList"
            :key="nl.id"
            class="nhom-lon-item"
            :class="{ active: nl.id === selectedNhomLonId }"
            @click="selectedNhomLonId = nl.id"
          >
            <div class="nhom-lon-name">{{ nl.ten_nhom }}</div>
            <div class="nhom-lon-meta">{{ nl.nhomNhoList?.length || 0 }} nhóm nhỏ</div>
            <div class="row-actions">
              <button class="icon-btn" title="Sửa" @click.stop="openEditNhomLon(nl)">✎</button>
              <button
                class="icon-btn danger"
                title="Xóa"
                :disabled="isSubmitting"
                @click.stop="deleteNhomLon(nl)"
              >×</button>
            </div>
          </li>
        </ul>
      </aside>

      <!-- Cột phải: Nhóm nhỏ thuộc nhóm lớn được chọn -->
      <section class="nhom-nho-pane">
        <div class="pane-header">
          <div>
            <h3>{{ selectedNhomLon ? selectedNhomLon.ten_nhom : 'Chọn 1 nhóm lớn' }}</h3>
            <p v-if="selectedNhomLon?.mo_ta" class="pane-subtitle">{{ selectedNhomLon.mo_ta }}</p>
          </div>
          <button v-if="selectedNhomLon" class="btn-primary sm" @click="openCreateNhomNho">+ Nhóm nhỏ</button>
        </div>

        <div v-if="!selectedNhomLon" class="empty-state">
          <p>Chọn 1 nhóm lớn ở cột bên trái để xem chi tiết.</p>
        </div>

        <div v-else-if="!selectedNhomLon.nhomNhoList?.length" class="empty-state">
          <p>Chưa có nhóm nhỏ. Nhấn «+ Nhóm nhỏ» để tạo.</p>
        </div>

        <div v-else class="disease-grid">
          <article v-for="nn in selectedNhomLon.nhomNhoList" :key="nn.id" class="disease-card">
            <header class="disease-card__head">
              <div class="disease-card__title">
                <h4 class="disease-card__name">{{ nn.ten_nhom }}</h4>
                <span v-if="nn.lieu_luong" class="lieu-chip">{{ nn.lieu_luong }}</span>
              </div>
              <div class="row-actions">
                <button
                  v-if="isCanTraCuuThem(nn) && (nn.viThuocLinks?.length ?? 0) > 0"
                  class="icon-btn ai"
                  title="AI phân loại vị thuốc vào nhóm nhỏ khác"
                  :disabled="isSubmitting"
                  @click="openAiClassify(nn)"
                >🤖</button>
                <button class="icon-btn" title="Sửa" @click="openEditNhomNho(nn)">✎</button>
                <button
                  class="icon-btn danger"
                  title="Xóa"
                  :disabled="isSubmitting"
                  @click="deleteNhomNho(nn)"
                >×</button>
              </div>
            </header>

            <div class="disease-card__body">
              <p v-if="nn.mo_ta" class="disease-card__desc">{{ nn.mo_ta }}</p>

              <section v-if="nn.viThuocLinks?.length" class="disease-section">
                <span class="disease-section__label">Vị thuốc ({{ nn.viThuocLinks.length }})</span>
                <div class="chip-list">
                  <span v-for="l in nn.viThuocLinks" :key="l.idViThuoc" class="chip chip-vi">
                    {{ l.viThuoc?.ten_vi_thuoc || viThuocName(l.idViThuoc) }}
                  </span>
                </div>
              </section>

              <section v-if="nn.chuTriLinks?.length" class="disease-section">
                <span class="disease-section__label">Chủ trị ({{ nn.chuTriLinks.length }})</span>
                <div class="chip-list">
                  <span v-for="l in nn.chuTriLinks" :key="l.idChuTri" class="chip chip-ct">
                    {{ l.chuTri?.ten_chu_tri || chuTriName(l.idChuTri) }}
                  </span>
                </div>
              </section>

              <p
                v-if="!nn.viThuocLinks?.length && !nn.chuTriLinks?.length"
                class="disease-empty muted"
              >
                Chưa gắn vị thuốc / chủ trị.
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>
    </div>

    <!-- Modal: Nhóm lớn -->
    <div v-if="showNhomLonModal" class="modal-backdrop" @click.self="showNhomLonModal = false">
      <div class="modal">
        <header class="modal-header">
          <h3>{{ editingNhomLon ? 'Sửa nhóm lớn' : 'Tạo nhóm lớn' }}</h3>
          <button class="icon-btn" @click="showNhomLonModal = false">×</button>
        </header>
        <div class="modal-body">
          <label class="field">
            <span>Tên nhóm lớn *</span>
            <input v-model="nhomLonForm.ten_nhom" type="text" placeholder="VD: Giải biểu" />
          </label>
          <label class="field">
            <span>Mô tả</span>
            <textarea v-model="nhomLonForm.mo_ta" rows="3" />
          </label>
          <label class="field">
            <span>Thứ tự hiển thị</span>
            <input v-model.number="nhomLonForm.thu_tu" type="number" min="0" />
          </label>
        </div>
        <footer class="modal-footer">
          <button class="btn-secondary" :disabled="isSubmitting" @click="showNhomLonModal = false">Hủy</button>
          <button class="btn-primary" :disabled="isSubmitting" @click="saveNhomLon">
            {{ isSubmitting ? 'Đang lưu…' : 'Lưu' }}
          </button>
        </footer>
      </div>
    </div>

    <!-- Modal: Nhóm nhỏ -->
    <div v-if="showNhomNhoModal" class="modal-backdrop" @click.self="showNhomNhoModal = false">
      <div class="modal modal-lg">
        <header class="modal-header">
          <h3>{{ editingNhomNho ? 'Sửa nhóm nhỏ' : 'Tạo nhóm nhỏ' }} – <small>{{ selectedNhomLon?.ten_nhom }}</small></h3>
          <button class="icon-btn" @click="showNhomNhoModal = false">×</button>
        </header>
        <div class="modal-body">
          <div class="grid-2">
            <label class="field">
              <span>Tên nhóm nhỏ *</span>
              <input v-model="nhomNhoForm.ten_nhom" type="text" placeholder="VD: Tân ôn giải biểu" />
            </label>
            <label class="field">
              <span>Liều lượng chung</span>
              <input v-model="nhomNhoForm.lieu_luong" type="text" placeholder="VD: 8-12g" />
            </label>
          </div>
          <label class="field">
            <span>Mô tả</span>
            <textarea v-model="nhomNhoForm.mo_ta" rows="2" />
          </label>
          <label class="field">
            <span>Thứ tự hiển thị</span>
            <input v-model.number="nhomNhoForm.thu_tu" type="number" min="0" />
          </label>

          <!-- Vị thuốc picker -->
          <div class="field">
            <span>Vị thuốc trong nhóm</span>
            <div class="chip-list selected">
              <span v-if="!nhomNhoForm.vi_thuoc_ids.length" class="muted">Chưa chọn vị thuốc nào</span>
              <span v-for="id in nhomNhoForm.vi_thuoc_ids" :key="id" class="chip chip-vi removable">
                {{ viThuocName(id) }}
                <button class="chip-x" @click="removeViThuoc(id)">×</button>
              </span>
            </div>
            <input
              v-model="viThuocFilter"
              class="picker-input"
              type="text"
              placeholder="Gõ để tìm hoặc tạo vị thuốc mới..."
              @keydown.enter.prevent="!viThuocExactMatch && createAndAddViThuoc()"
            />
            <div v-if="viThuocFilter && (filteredViThuoc.length || !viThuocExactMatch)" class="picker-dropdown">
              <button v-for="v in filteredViThuoc" :key="v.id" class="picker-item" @click="addViThuoc(v.id)">
                {{ v.ten_vi_thuoc }}
              </button>
              <button
                v-if="!viThuocExactMatch"
                class="picker-item picker-item-create"
                :disabled="creatingViThuoc"
                @click="createAndAddViThuoc"
              >
                + Tạo mới «{{ viThuocFilter.trim() }}»
                <span v-if="creatingViThuoc" class="creating-hint">(đang tạo…)</span>
              </button>
            </div>
          </div>

          <!-- Chủ trị picker -->
          <div class="field">
            <span>Chủ trị</span>
            <div class="chip-list selected">
              <span v-if="!nhomNhoForm.chu_tri_ids.length" class="muted">Chưa chọn chủ trị nào</span>
              <span v-for="id in nhomNhoForm.chu_tri_ids" :key="id" class="chip chip-ct removable">
                {{ chuTriName(id) }}
                <button class="chip-x" @click="removeChuTri(id)">×</button>
              </span>
            </div>
            <input v-model="chuTriFilter" class="picker-input" type="text" placeholder="Gõ để tìm chủ trị..." />
            <div v-if="chuTriFilter && filteredChuTri.length" class="picker-dropdown">
              <button v-for="c in filteredChuTri" :key="c.id" class="picker-item" @click="addChuTri(c.id)">
                {{ c.ten_chu_tri }}
              </button>
            </div>
          </div>
        </div>
        <footer class="modal-footer">
          <button class="btn-secondary" :disabled="isSubmitting" @click="showNhomNhoModal = false">Hủy</button>
          <button class="btn-primary" :disabled="isSubmitting" @click="saveNhomNho">
            {{ isSubmitting ? 'Đang lưu…' : 'Lưu' }}
          </button>
        </footer>
      </div>
    </div>

    <!-- Overlay: tiến trình nhập Excel -->
    <div v-if="isImporting" class="modal-backdrop">
      <div class="modal modal-sm" @click.stop>
        <header class="modal-header">
          <h3>Đang nhập Excel…</h3>
        </header>
        <div class="modal-body">
          <p class="import-progress-text">
            Đã xử lý <strong>{{ importProgress.current }}</strong> /
            <strong>{{ importProgress.total }}</strong> dòng
          </p>
          <div class="progress-bar">
            <div
              class="progress-bar-fill"
              :style="{
                width: importProgress.total
                  ? Math.round((importProgress.current / importProgress.total) * 100) + '%'
                  : '0%',
              }"
            ></div>
          </div>
          <p class="import-progress-hint">Vui lòng chờ, không đóng cửa sổ.</p>
        </div>
      </div>
    </div>

    <!-- Modal: Kết quả nhập Excel -->
    <div
      v-if="showImportResultModal && importResult"
      class="modal-backdrop"
      @click.self="showImportResultModal = false"
    >
      <div class="modal">
        <header class="modal-header">
          <h3>Kết quả nhập Excel</h3>
          <button class="icon-btn" @click="showImportResultModal = false">×</button>
        </header>
        <div class="modal-body">
          <ul class="import-summary">
            <li>Dòng đã xử lý: <strong>{{ importResult.rowsProcessed }}</strong></li>
            <li>Nhóm lớn mới: <strong>{{ importResult.nhomLonCreated }}</strong></li>
            <li>Nhóm lớn cập nhật: <strong>{{ importResult.nhomLonUpdated }}</strong></li>
            <li>Nhóm nhỏ mới: <strong>{{ importResult.nhomNhoCreated }}</strong></li>
            <li>Nhóm nhỏ cập nhật: <strong>{{ importResult.nhomNhoUpdated }}</strong></li>
            <li>Vị thuốc tạo mới: <strong>{{ importResult.viThuocCreated }}</strong></li>
            <li>Chủ trị tạo mới: <strong>{{ importResult.chuTriCreated }}</strong></li>
          </ul>
          <div v-if="importResult.errors.length" class="import-errors">
            <h4>Lỗi ({{ importResult.errors.length }})</h4>
            <ul>
              <li v-for="(e, i) in importResult.errors" :key="i">{{ e }}</li>
            </ul>
          </div>
        </div>
        <footer class="modal-footer">
          <button class="btn-primary" @click="showImportResultModal = false">Đóng</button>
        </footer>
      </div>
    </div>

    <!-- Modal: AI phân loại vị thuốc -->
    <div v-if="aiClassifyModalOpen" class="modal-backdrop" @click.self="closeAiClassify">
      <div class="modal modal--wide" @click.stop>
        <header class="modal-header">
          <div>
            <h3>🤖 AI phân loại vị thuốc</h3>
            <p v-if="aiClassifySource" class="modal-subtitle">
              Nguồn: <strong>{{ aiClassifySource.ten_nhom }}</strong> ·
              {{ aiClassifySource.viThuocLinks?.length ?? 0 }} vị thuốc
            </p>
          </div>
          <button class="icon-btn" :disabled="aiClassifyApplying" @click="closeAiClassify">×</button>
        </header>

        <div class="modal-body">
          <div v-if="aiClassifyLoading" class="ai-loading">
            <div class="spinner"></div>
            <p>AI đang phân loại {{ aiClassifySource?.viThuocLinks?.length ?? 0 }} vị thuốc…</p>
          </div>

          <div v-else>
            <p v-if="aiClassifyError" class="ai-error">{{ aiClassifyError }}</p>

            <div class="ai-summary">
              <span class="ai-summary-count">
                Đã chọn {{ aiClassifyAssignedCount }} / {{ aiClassifySelectableCount }} (tổng {{ aiClassifyRows.length }})
              </span>
              <button
                v-if="aiClassifySelectableCount > 0"
                type="button"
                class="ai-select-all"
                :disabled="aiClassifyApplying || aiClassifyApplyingRowId != null"
                @click="toggleSelectAllAi"
              >
                {{ aiClassifyAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả' }}
              </button>
            </div>

            <div v-if="aiClassifyRows.length" class="ai-table">
              <div class="ai-table__head">
                <span class="aic aic--check"></span>
                <span class="aic aic--name">Vị thuốc</span>
                <span class="aic aic--target">Nhóm nhỏ đích</span>
                <span class="aic aic--reason">Lý do (AI)</span>
                <span class="aic aic--apply"></span>
              </div>
              <div v-for="row in aiClassifyRows" :key="row.id_vi_thuoc" class="ai-table__row">
                <div class="aic aic--check">
                  <input
                    type="checkbox"
                    v-model="row.selected"
                    :disabled="row.target_id == null || aiClassifyApplying || aiClassifyApplyingRowId != null"
                    :aria-label="`Chọn ${row.ten_vi_thuoc}`"
                  />
                </div>
                <div class="aic aic--name">
                  <span class="chip chip-vi">{{ row.ten_vi_thuoc }}</span>
                </div>
                <div class="aic aic--target">
                  <select
                    v-model="row.target_id"
                    class="ai-select"
                    :disabled="aiClassifyApplying || aiClassifyApplyingRowId != null"
                    @change="row.selected = row.target_id != null"
                  >
                    <option :value="null">— Giữ lại —</option>
                    <option v-for="c in aiClassifyCandidates" :key="c.id" :value="c.id">
                      {{ nhomNhoFullLabel(c) }}
                    </option>
                  </select>
                </div>
                <div class="aic aic--reason">
                  <span v-if="row.ly_do" class="ai-reason">{{ row.ly_do }}</span>
                  <span v-else class="muted">—</span>
                </div>
                <div class="aic aic--apply">
                  <button
                    type="button"
                    class="btn-mini-apply"
                    :disabled="
                      row.target_id == null ||
                      aiClassifyApplying ||
                      aiClassifyApplyingRowId != null
                    "
                    :title="row.target_id == null ? 'Chọn nhóm nhỏ đích trước' : 'Áp dụng riêng vị thuốc này'"
                    @click="applyAiClassifyOne(row)"
                  >
                    {{ aiClassifyApplyingRowId === row.id_vi_thuoc ? '…' : 'Áp dụng' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <button
            class="btn-secondary"
            :disabled="aiClassifyApplying"
            @click="closeAiClassify"
          >Hủy</button>
          <button
            class="btn-primary"
            :disabled="
              aiClassifyApplying ||
              aiClassifyLoading ||
              aiClassifyApplyingRowId != null ||
              aiClassifyAssignedCount === 0
            "
            @click="applyAiClassify"
          >
            {{ aiClassifyApplying ? 'Đang áp dụng…' : `Áp dụng đã chọn (${aiClassifyAssignedCount})` }}
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.duoc-ly-wrapper { width: 100%; }

/* Toolbar */
.toolbar { display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--space-4); }
.toolbar-left { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.toolbar-hint { margin: 0; font-size: var(--font-size-xs); color: var(--gray-500); }
.hidden-input { display: none; }

/* Import progress */
.import-progress-text { margin: 0 0 12px; font-size: var(--font-size-md); color: var(--gray-700); text-align: center; }
.import-progress-hint { margin: 8px 0 0; font-size: var(--font-size-xs); color: var(--gray-500); text-align: center; }
.progress-bar { width: 100%; height: 10px; background: var(--gray-200); border-radius: 999px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: linear-gradient(90deg, var(--brown-500), var(--brown-700)); transition: width 0.2s ease; }
.modal-sm { max-width: 380px; }

/* Import result modal */
.import-summary { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 6px var(--space-4); font-size: var(--font-size-sm); }
.import-summary li { padding: 6px 0; border-bottom: 1px dashed var(--gray-100); color: var(--gray-700); }
.import-summary strong { color: var(--brown-900); }
.import-errors { margin-top: var(--space-4); padding: var(--space-3) var(--space-4); background: var(--danger-bg); border-radius: var(--radius-md); }
.import-errors h4 { margin: 0 0 6px; color: var(--danger); font-size: var(--font-size-sm); }
.import-errors ul { margin: 0; padding-left: 1.2em; max-height: 200px; overflow-y: auto; font-size: var(--font-size-xs); color: var(--gray-700); }

/* Layout */
.duoc-ly-grid { display: grid; grid-template-columns: 320px 1fr; gap: var(--space-5); align-items: start; }
@media (max-width: 900px) { .duoc-ly-grid { grid-template-columns: 1fr; } }

.nhom-lon-pane, .nhom-nho-pane { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm); }

.pane-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4) var(--space-5); background: var(--brown-50); border-bottom: 1px solid var(--brown-100); }
.pane-header h3 { font-size: var(--font-size-lg); font-weight: 700; color: var(--brown-900); margin: 0; }
.pane-title-row { display: flex; align-items: center; gap: var(--space-3); }
.pane-subtitle { color: var(--gray-500); font-size: var(--font-size-sm); margin: 4px 0 0; }

/* Nhóm lớn list */
.nhom-lon-list { list-style: none; margin: 0; padding: var(--space-2); display: flex; flex-direction: column; gap: 4px; max-height: 70vh; overflow-y: auto; }
.nhom-lon-list .empty { text-align: center; color: var(--gray-500); padding: var(--space-6); }
.nhom-lon-item { position: relative; padding: 12px 14px; border-radius: var(--radius-md); cursor: pointer; transition: background .15s; }
.nhom-lon-item:hover { background: var(--brown-50); }
.nhom-lon-item.active { background: linear-gradient(135deg, var(--brown-50) 0%, rgba(192,139,66,.12) 100%); }
.nhom-lon-name { font-weight: 600; color: var(--brown-900); }
.nhom-lon-meta { font-size: var(--font-size-xs); color: var(--gray-500); margin-top: 2px; }
.nhom-lon-item .row-actions { position: absolute; right: 10px; top: 10px; opacity: 0; transition: opacity .15s; }
.nhom-lon-item:hover .row-actions, .nhom-lon-item.active .row-actions { opacity: 1; }

/* Card grid */
.disease-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
  gap: var(--space-4);
  padding: var(--space-4);
}
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
.disease-card__title { display: flex; align-items: center; gap: var(--space-2); min-width: 0; flex: 1; flex-wrap: wrap; }
.disease-card__name {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--brown-900);
  line-height: 1.35;
  word-break: break-word;
}
.disease-card__desc {
  margin: 0 0 4px;
  font-size: var(--font-size-sm);
  color: var(--gray-600);
  line-height: 1.5;
}
.disease-card__body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4) var(--space-4);
}
.disease-section { display: flex; flex-direction: column; gap: 6px; }
.disease-section__label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gray-500);
}
.disease-empty { margin: 0; font-size: var(--font-size-sm); text-align: center; padding: var(--space-3) 0; }

.muted { color: var(--gray-400); font-size: var(--font-size-sm); }

/* Chips */
.chip-list { display: flex; flex-wrap: wrap; gap: 6px; }
.chip-list.selected { padding: 8px; background: var(--gray-50); border-radius: var(--radius-md); min-height: 40px; margin-bottom: 8px; }
.chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; }
.chip-vi { background: var(--chip-herb-bg); color: var(--chip-herb-fg); }
.chip-ct { background: var(--warning-bg); color: var(--warning-fg); }
.lieu-chip { display: inline-block; padding: 3px 10px; background: var(--brown-100); color: var(--brown-800); border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700; }
.chip.removable { padding-right: 4px; }
.chip-x { background: rgba(0,0,0,.08); border-radius: 999px; width: 16px; height: 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; line-height: 1; }
.chip-x:hover { background: rgba(0,0,0,.18); }

/* Picker */
.picker-input { width: 100%; padding: 8px 12px; border: 1px solid var(--gray-200); border-radius: var(--radius-md); font-size: var(--font-size-sm); }
.picker-dropdown { margin-top: 4px; max-height: 220px; overflow-y: auto; border: 1px solid var(--gray-200); border-radius: var(--radius-md); background: var(--white); box-shadow: var(--shadow-md); }
.picker-item { display: block; width: 100%; text-align: left; padding: 8px 12px; font-size: var(--font-size-sm); transition: background .12s; }
.picker-item:hover { background: var(--brown-50); }
.picker-item-create { border-top: 1px dashed var(--gray-200); color: var(--brown-700); font-weight: 600; }
.picker-item-create:hover { background: var(--brown-100); }
.picker-item-create:disabled { opacity: .6; cursor: not-allowed; }
.creating-hint { margin-left: 6px; font-weight: 400; font-size: var(--font-size-xs); color: var(--gray-500); }

/* Buttons */
.btn-primary { background: var(--brown-600); color: var(--white); padding: 10px 18px; border-radius: var(--radius-md); font-weight: 600; font-size: var(--font-size-sm); transition: all .2s; }
.btn-primary:hover { background: var(--brown-700); }
.btn-primary.sm { padding: 6px 12px; font-size: var(--font-size-xs); }
.btn-secondary { background: var(--gray-100); color: var(--gray-700); padding: 10px 18px; border-radius: var(--radius-md); font-weight: 600; font-size: var(--font-size-sm); }
.btn-secondary:hover { background: var(--gray-200); }
.icon-btn { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); color: var(--gray-600); font-size: 15px; cursor: pointer; background: transparent; border: 0; transition: background .12s, color .12s; }
.icon-btn:hover { background: var(--gray-100); color: var(--brown-700); }
.icon-btn.danger:hover { background: var(--danger-bg); color: var(--danger); }
.icon-btn.ai {
  background: linear-gradient(135deg, var(--ai-solid), var(--ai-solid-2));
  color: var(--white);
}
.icon-btn.ai:hover { filter: brightness(1.1); background: linear-gradient(135deg, var(--ai-solid), var(--ai-solid-2)); color: var(--white); }
.icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.row-actions { display: flex; gap: 4px; }

.badge { display: inline-block; padding: 3px 10px; background: var(--brown-100); color: var(--brown-700); border-radius: var(--radius-full); font-size: 11px; font-weight: 700; }

.empty-state { text-align: center; padding: var(--space-12); color: var(--gray-500); }
.loading-state { display: flex; flex-direction: column; align-items: center; padding: var(--space-12) 0; color: var(--brown-600); }
.spinner { width: 32px; height: 32px; border: 3px solid var(--gray-200); border-top-color: var(--brown-500); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-state { text-align: center; padding: var(--space-8); color: var(--danger); background: var(--danger-bg); border-radius: var(--radius-lg); }

/* Modal */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--space-4); }
.modal { background: var(--white); border-radius: var(--radius-xl); width: 100%; max-width: 480px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: var(--shadow-xl); }
.modal-lg { max-width: 720px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--gray-200); }
.modal-header h3 { margin: 0; font-size: var(--font-size-lg); color: var(--brown-900); }
.modal-header small { color: var(--gray-500); font-weight: 400; }
.modal-body { padding: var(--space-5); overflow-y: auto; display: flex; flex-direction: column; gap: var(--space-4); }
.modal-footer { display: flex; gap: var(--space-2); justify-content: flex-end; padding: var(--space-4) var(--space-5); border-top: 1px solid var(--gray-200); background: var(--gray-50); }

.field { display: flex; flex-direction: column; gap: 6px; }
.field > span { font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-700); }
.field input, .field textarea { padding: 8px 12px; border: 1px solid var(--gray-200); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-family: inherit; }
.field input:focus, .field textarea:focus { outline: none; border-color: var(--brown-400); }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
@media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }

/* AI classify modal */
.modal--wide { max-width: 880px; }
.modal-subtitle { margin: 4px 0 0; font-size: var(--font-size-xs); color: var(--gray-500); font-weight: 400; }
.ai-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-8) 0;
  color: var(--brown-600);
}
.ai-error {
  margin: 0 0 var(--space-3);
  padding: 8px 12px;
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  border-radius: var(--radius-md);
  color: var(--danger);
  font-size: var(--font-size-sm);
}
.ai-summary {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 8px 12px;
  background: var(--ai-bg);
  border: 1px solid var(--ai-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);
  flex-wrap: wrap;
}
.ai-summary-count { font-size: var(--font-size-sm); font-weight: 700; color: var(--ai-fg); }
.ai-summary-hint { font-size: 11px; color: var(--gray-600); }

.ai-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--white);
}
.ai-table__head,
.ai-table__row {
  display: grid;
  grid-template-columns: 24px minmax(140px, 1.1fr) minmax(200px, 1.4fr) minmax(160px, 1.8fr) 90px;
  gap: var(--space-2);
  padding: 8px var(--space-3);
  align-items: center;
}
.aic--check { display: flex; justify-content: center; }
.aic--check input { cursor: pointer; width: 16px; height: 16px; }
.aic--check input:disabled { cursor: not-allowed; opacity: 0.4; }
.aic--apply { display: flex; justify-content: flex-end; }
.btn-mini-apply {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  border: 1px solid var(--ai-border);
  background: var(--ai-bg);
  color: var(--ai-fg);
  cursor: pointer;
  white-space: nowrap;
  transition: background .12s;
}
.btn-mini-apply:hover:not(:disabled) {
  background: var(--ai-bg);
  border-color: var(--ai-solid);
}
.btn-mini-apply:disabled { opacity: 0.5; cursor: not-allowed; }
.ai-select-all {
  background: var(--white);
  border: 1px solid var(--brown-200);
  color: var(--brown-700);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}
.ai-select-all:hover:not(:disabled) { background: var(--brown-50); border-color: var(--brown-300); }
.ai-select-all:disabled { opacity: 0.5; cursor: not-allowed; }
.ai-table__head {
  background: var(--surface-2);
  border-bottom: 1px solid var(--gray-100);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gray-500);
}
.ai-table__row + .ai-table__row { border-top: 1px solid var(--gray-100); }
.ai-table__row:hover { background: var(--surface-2); }
.aic { min-width: 0; word-break: break-word; font-size: var(--font-size-sm); }
.ai-select {
  width: 100%;
  padding: 6px 8px;
  font-size: 13px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-sm);
  background: var(--white);
  cursor: pointer;
}
.ai-select:focus { outline: none; border-color: var(--brown-400); }
.ai-reason { font-size: 12px; color: var(--gray-700); line-height: 1.45; }

.btn-primary:disabled, .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 720px) {
  .ai-table__head,
  .ai-table__row {
    grid-template-columns: 24px 1fr 80px;
    grid-template-areas:
      'check name apply'
      '. target target'
      '. reason reason';
    gap: 6px;
  }
  .aic--check { grid-area: check; }
  .aic--name { grid-area: name; }
  .aic--target { grid-area: target; }
  .aic--reason { grid-area: reason; }
  .aic--apply { grid-area: apply; }
}
</style>
