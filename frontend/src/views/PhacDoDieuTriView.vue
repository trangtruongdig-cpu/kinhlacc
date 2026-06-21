<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { api } from '@/services/api'

interface KinhMachLite {
  idKinhMach: number
  ten_kinh_mach: string | null
  ten_viet_tat: string | null
}

interface HuyetViLite {
  idHuyet: number
  ten_huyet: string | null
  ma_huyet: string | null
  idKinhMach: number
  kinhMach?: KinhMachLite | null
}

interface BenhLite {
  id: number
  code?: string | null
  name?: string | null
  tieuket?: string | null
  chung_trang?: string | null
  phuyet_chamcuu?: string | null
  giainghia_phuyet?: string | null
}

interface PhacDoRow {
  idPhacDo: number
  idBenh: number
  idHuyet: number
  phuong_phap_tac_dong: string | null
  ghi_chu_ky_thuat: string | null
  benh: BenhLite | null
  huyetVi: HuyetViLite | null
}

interface FormRow {
  idHuyet: number
  phuong_phap_tac_dong: string
  ghi_chu_ky_thuat: string
}

interface FormState {
  id_benh: number | null
  rows: FormRow[]
}

interface BenhGroup {
  idBenh: number
  benh: BenhLite | null
  items: PhacDoRow[]
}

const PHUONG_PHAP_OPTIONS = [
  'Châm',
  'Cứu',
  'Châm + Cứu',
  'Bấm Huyệt',
  'Điện Châm',
  'Bổ',
  'Tả',
] as const

const isLoading = ref(true)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const formError = ref<string | null>(null)
const phGroups = ref<BenhGroup[]>([])
const huyetViOptions = ref<HuyetViLite[]>([])
const benhOptions = ref<BenhLite[]>([])
const searchQuery = ref('')
const benhSearch = ref('')

const showModal = ref(false)
const showDeleteConfirm = ref(false)
const editingBenhId = ref<number | null>(null)
const editingItems = ref<PhacDoRow[]>([])
const deletingGroup = ref<BenhGroup | null>(null)


const emptyForm = (): FormState => ({
  id_benh: null,
  rows: [],
})

const form = ref<FormState>(emptyForm())
const huyetAddSearch = ref('')

function addHuyetRowById(idHuyet: number) {
  if (form.value.rows.some((r) => r.idHuyet === idHuyet)) return
  form.value.rows.push({
    idHuyet,
    phuong_phap_tac_dong: '',
    ghi_chu_ky_thuat: '',
  })
}

function removeHuyetRow(i: number) {
  form.value.rows.splice(i, 1)
}

function onHuyetAddChange() {
  const q = huyetAddSearch.value.trim().toLowerCase()
  if (!q) return
  const match = huyetViOptions.value.find((h) => {
    const name = (h.ten_huyet ?? '').trim().toLowerCase()
    const code = (h.ma_huyet ?? '').trim().toLowerCase()
    return name === q || code === q || huyetViLabel(h).toLowerCase() === q
  })
  if (match) {
    addHuyetRowById(match.idHuyet)
    huyetAddSearch.value = ''
  }
}

function huyetRowLabel(idHuyet: number): string {
  const h = huyetViOptions.value.find((x) => x.idHuyet === idHuyet)
  return huyetViLabel(h)
}

function huyetRowKinhMach(idHuyet: number): string {
  const h = huyetViOptions.value.find((x) => x.idHuyet === idHuyet)
  return h?.kinhMach ? kinhMachLabel(h.kinhMach) : ''
}

const NOTE_TRUNCATE_LEN = 60
const expandedNotes = ref<Set<number>>(new Set())

function isLongNote(s: string | null | undefined): boolean {
  return !!s && s.length > NOTE_TRUNCATE_LEN
}

function toggleNoteExpanded(id: number) {
  const next = new Set(expandedNotes.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedNotes.value = next
}

// Cắt gọn các khối văn bản dài (Phương huyệt / Giải nghĩa) — clamp 4 dòng + nút Xem thêm.
const SECTION_TRUNCATE_LEN = 160
const expandedText = ref<Set<string>>(new Set())
function isLongText(s: string | null | undefined): boolean {
  return !!s && s.trim().length > SECTION_TRUNCATE_LEN
}
function toggleText(key: string) {
  const next = new Set(expandedText.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expandedText.value = next
}

// Cắt gọn danh sách huyệt cấu trúc trên thẻ (giữ chiều cao đồng đều) — đủ xem ở modal Sửa.
const HUYET_CAP = 6
function visibleItems(group: BenhGroup): PhacDoRow[] {
  if (expandedText.value.has('hv-' + group.idBenh)) return group.items
  return group.items.slice(0, HUYET_CAP)
}

const currentPage = ref(1)
const itemsPerPage = ref(10)

onMounted(async () => {
  await Promise.all([fetchData(), fetchHuyetVi(), fetchBenh()])
})

watch(searchQuery, () => {
  currentPage.value = 1
})

async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    const res: any = await api.get('/phac-do-dieu-tri/phuong-huyet-the')
    phGroups.value = Array.isArray(res) ? res : res?.data ?? []
  } catch (err: any) {
    console.error(err)
    error.value = 'Lỗi khi tải dữ liệu: ' + (err.message || String(err))
  } finally {
    isLoading.value = false
  }
}

async function fetchHuyetVi() {
  try {
    const res: any = await api.get('/huyet-vi')
    huyetViOptions.value = Array.isArray(res) ? res : res?.data ?? []
  } catch (err) {
    console.error('Không tải được danh sách huyệt vị', err)
  }
}

async function fetchBenh() {
  try {
    const res: any = await api.get('/benh-dong-y')
    benhOptions.value = Array.isArray(res) ? res : res?.data ?? []
  } catch (err) {
    console.error('Không tải được danh sách Bệnh YHCT - Đông Y', err)
  }
}

function huyetViLabel(h: HuyetViLite | null | undefined): string {
  if (!h) return '—'
  const parts = [h.ten_huyet, h.ma_huyet ? `(${h.ma_huyet})` : null].filter(Boolean)
  return parts.length ? parts.join(' ') : `#${h.idHuyet}`
}

function kinhMachLabel(k: KinhMachLite | null | undefined): string {
  if (!k) return ''
  return k.ten_kinh_mach || k.ten_viet_tat || `#${k.idKinhMach}`
}

function benhLabel(b: BenhLite | null | undefined, idBenh?: number): string {
  if (b) {
    return b.name || b.tieuket || b.chung_trang || b.code || `#${b.id}`
  }
  if (idBenh != null) {
    const matched = benhOptions.value.find((x) => x.id === idBenh)
    if (matched) return matched.name || matched.code || `#${matched.id}`
    return `#${idBenh}`
  }
  return '—'
}

const filteredBenhOptions = computed(() => {
  const q = benhSearch.value.trim().toLowerCase()
  if (!q) return benhOptions.value
  return benhOptions.value.filter((b) => {
    const hay = [b.name, b.code, b.tieuket, b.chung_trang]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
})

// Server đã gom theo thể bệnh (kèm phương huyệt nguyên văn + huyệt cấu trúc).
const groupedList = computed<BenhGroup[]>(() =>
  [...phGroups.value].sort((a, b) => a.idBenh - b.idBenh),
)
const linkCount = computed(() => groupedList.value.reduce((n, g) => n + g.items.length, 0))

const filteredList = computed<BenhGroup[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return groupedList.value
  return groupedList.value.filter((g) => {
    const hay = [
      benhLabel(g.benh, g.idBenh),
      g.benh?.code,
      g.benh?.tieuket,
      g.benh?.chung_trang,
      g.benh?.phuyet_chamcuu,
      g.benh?.giainghia_phuyet,
      ...g.items.flatMap((row) => [
        huyetViLabel(row.huyetVi),
        row.huyetVi?.ma_huyet,
        kinhMachLabel(row.huyetVi?.kinhMach),
        row.phuong_phap_tac_dong,
        row.ghi_chu_ky_thuat,
      ]),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
})

const pagedList = computed<BenhGroup[]>(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredList.value.slice(start, start + itemsPerPage.value)
})

const totalPages = computed(() => {
  const n = Math.ceil(filteredList.value.length / itemsPerPage.value)
  return n > 0 ? n : 1
})

function getPageNumbers() {
  const pages: number[] = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
}

function openCreateModal() {
  editingBenhId.value = null
  editingItems.value = []
  form.value = emptyForm()
  formError.value = null
  huyetAddSearch.value = ''
  benhSearch.value = ''
  showModal.value = true
}

function openEditModal(group: BenhGroup) {
  editingBenhId.value = group.idBenh
  editingItems.value = group.items.slice()
  form.value = {
    id_benh: group.idBenh,
    rows: group.items.map((r) => ({
      idHuyet: r.idHuyet,
      phuong_phap_tac_dong: r.phuong_phap_tac_dong ?? '',
      ghi_chu_ky_thuat: r.ghi_chu_ky_thuat ?? '',
    })),
  }
  formError.value = null
  huyetAddSearch.value = ''
  benhSearch.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingBenhId.value = null
  editingItems.value = []
}


async function handleSubmit() {
  if (isSubmitting.value) return
  formError.value = null
  const f = form.value
  if (f.id_benh == null || Number.isNaN(Number(f.id_benh))) {
    formError.value = 'Vui lòng chọn bệnh'
    return
  }
  if (f.rows.length === 0) {
    formError.value = 'Vui lòng thêm ít nhất một huyệt vị'
    return
  }
  const idBenh = Number(f.id_benh)
  isSubmitting.value = true
  try {
    if (editingBenhId.value != null) {
      const existingByHuyet = new Map<number, PhacDoRow>()
      for (const r of editingItems.value) existingByHuyet.set(r.idHuyet, r)
      const desiredSet = new Set(f.rows.map((r) => r.idHuyet))
      for (const r of editingItems.value) {
        if (!desiredSet.has(r.idHuyet)) {
          await api.delete(`/phac-do-dieu-tri/${r.idPhacDo}`)
        }
      }
      for (const row of f.rows) {
        const payload = {
          id_benh: idBenh,
          id_huyet: row.idHuyet,
          phuong_phap_tac_dong: row.phuong_phap_tac_dong.trim() || null,
          ghi_chu_ky_thuat: row.ghi_chu_ky_thuat.trim() || null,
        }
        const existing = existingByHuyet.get(row.idHuyet)
        if (existing) {
          await api.put(`/phac-do-dieu-tri/${existing.idPhacDo}`, payload)
        } else {
          await api.post('/phac-do-dieu-tri', payload)
        }
      }
    } else {
      for (const row of f.rows) {
        await api.post('/phac-do-dieu-tri', {
          id_benh: idBenh,
          id_huyet: row.idHuyet,
          phuong_phap_tac_dong: row.phuong_phap_tac_dong.trim() || null,
          ghi_chu_ky_thuat: row.ghi_chu_ky_thuat.trim() || null,
        })
      }
    }
    await fetchData()
    closeModal()
  } catch (err: any) {
    formError.value = err.message || 'Không lưu được dữ liệu'
  } finally {
    isSubmitting.value = false
  }
}

function confirmDelete(group: BenhGroup) {
  deletingGroup.value = group
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (isSubmitting.value) return
  if (!deletingGroup.value) return
  isSubmitting.value = true
  try {
    for (const row of deletingGroup.value.items) {
      await api.delete(`/phac-do-dieu-tri/${row.idPhacDo}`)
    }
    showDeleteConfirm.value = false
    deletingGroup.value = null
    await fetchData()
    if (pagedList.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  } catch (err: any) {
    error.value = err.message || 'Không xóa được bản ghi'
    showDeleteConfirm.value = false
    deletingGroup.value = null
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="management-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Quản Lý Phương Huyệt</h1>
        <p class="page-subtitle">
          Liên kết bệnh ↔ huyệt vị — phương pháp tác động, ghi chú kỹ thuật
        </p>
      </div>
      <button type="button" class="btn-primary" @click="openCreateModal">+ Thêm phương huyệt</button>
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
      <div class="toolbar">
        <label class="search-wrap">
          <span class="search-label">Tìm kiếm</span>
          <input
            v-model="searchQuery"
            type="search"
            class="search-input"
            placeholder="Tìm theo bệnh, huyệt, phương pháp..."
            autocomplete="off"
          />
        </label>
        <span class="toolbar-count">{{ filteredList.length }} / {{ groupedList.length }} bệnh</span>
      </div>

      <div class="data-card">
        <div class="card-header">
          <h3>Danh Sách Phương Huyệt</h3>
          <span class="badge badge-success">{{ filteredList.length }} bệnh · {{ linkCount }} liên kết huyệt</span>
        </div>
        <div v-if="pagedList.length === 0" class="empty-state">
          {{ searchQuery.trim() ? 'Không khớp bản ghi nào' : 'Chưa có dữ liệu' }}
        </div>

        <div v-else class="disease-grid">
          <article v-for="group in pagedList" :key="group.idBenh" class="disease-card">
            <header class="disease-card__head">
              <div class="disease-card__title">
                <span class="disease-card__id">#{{ group.idBenh }}</span>
                <h4 class="disease-card__name">{{ benhLabel(group.benh, group.idBenh) }}</h4>
                <span v-if="group.benh?.code" class="disease-card__code">{{ group.benh.code }}</span>
              </div>
              <div class="row-actions">
                <button type="button" class="btn-action btn-edit" @click="openEditModal(group)">Sửa</button>
                <button type="button" class="btn-action btn-delete" @click="confirmDelete(group)">Xóa</button>
              </div>
            </header>

            <div class="disease-card__body">
              <section v-if="group.benh?.phuyet_chamcuu" class="disease-section">
                <span class="disease-section__label">Phương huyệt (dữ liệu cũ)</span>
                <p
                  class="ph-text"
                  :class="{ 'ph-text--clamp': isLongText(group.benh.phuyet_chamcuu) && !expandedText.has('pc-' + group.idBenh) }"
                >{{ group.benh.phuyet_chamcuu }}</p>
                <button
                  v-if="isLongText(group.benh.phuyet_chamcuu)"
                  type="button"
                  class="note-toggle"
                  @click="toggleText('pc-' + group.idBenh)"
                >{{ expandedText.has('pc-' + group.idBenh) ? 'Thu gọn ▲' : 'Xem thêm ▼' }}</button>
              </section>

              <section v-if="group.benh?.giainghia_phuyet" class="disease-section">
                <span class="disease-section__label">Giải nghĩa phương huyệt</span>
                <p
                  class="ph-text ph-text--muted"
                  :class="{ 'ph-text--clamp': isLongText(group.benh.giainghia_phuyet) && !expandedText.has('gn-' + group.idBenh) }"
                >{{ group.benh.giainghia_phuyet }}</p>
                <button
                  v-if="isLongText(group.benh.giainghia_phuyet)"
                  type="button"
                  class="note-toggle"
                  @click="toggleText('gn-' + group.idBenh)"
                >{{ expandedText.has('gn-' + group.idBenh) ? 'Thu gọn ▲' : 'Xem thêm ▼' }}</button>
              </section>

              <section v-if="group.items.length" class="disease-section">
                <span class="disease-section__label">Huyệt vị — cấu trúc ({{ group.items.length }})</span>
                <div class="huyet-table">
                  <div class="huyet-table__head">
                    <span class="ht-col ht-col--name">Huyệt</span>
                    <span class="ht-col ht-col--method">Phương pháp</span>
                    <span class="ht-col ht-col--note">Ghi chú</span>
                  </div>
                  <div
                    v-for="row in visibleItems(group)"
                    :key="row.idPhacDo"
                    class="huyet-table__row"
                  >
                    <div class="ht-col ht-col--name">
                      <span class="chip chip-huyet">{{ huyetViLabel(row.huyetVi) }}</span>
                      <small
                        v-if="row.huyetVi?.kinhMach"
                        class="ht-kinh"
                      >{{ kinhMachLabel(row.huyetVi.kinhMach) }}</small>
                    </div>
                    <div class="ht-col ht-col--method">
                      <span v-if="row.phuong_phap_tac_dong" class="chip chip-method">
                        {{ row.phuong_phap_tac_dong }}
                      </span>
                      <span v-else class="muted">—</span>
                    </div>
                    <div class="ht-col ht-col--note">
                      <template v-if="row.ghi_chu_ky_thuat">
                        <span
                          class="note-text"
                          :class="{ 'note-text--expanded': expandedNotes.has(row.idPhacDo) }"
                        >{{ row.ghi_chu_ky_thuat }}</span>
                        <button
                          v-if="isLongNote(row.ghi_chu_ky_thuat)"
                          type="button"
                          class="note-toggle"
                          @click="toggleNoteExpanded(row.idPhacDo)"
                        >{{ expandedNotes.has(row.idPhacDo) ? 'thu gọn' : 'xem thêm' }}</button>
                      </template>
                      <span v-else class="muted">—</span>
                    </div>
                  </div>
                </div>
                <button
                  v-if="group.items.length > HUYET_CAP"
                  type="button"
                  class="note-toggle"
                  @click="toggleText('hv-' + group.idBenh)"
                >{{ expandedText.has('hv-' + group.idBenh) ? 'Thu gọn ▲' : `Xem thêm ${group.items.length - HUYET_CAP} huyệt ▼` }}</button>
              </section>

              <p v-if="!group.benh?.phuyet_chamcuu && !group.items.length" class="disease-empty muted">Chưa có phương huyệt.</p>
            </div>
          </article>
        </div>

        <div v-if="filteredList.length > itemsPerPage" class="pagination">
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
          <h3>{{ editingBenhId != null ? 'Sửa phương huyệt' : 'Thêm phương huyệt' }}</h3>
          <button type="button" class="modal-close" aria-label="Đóng" @click="closeModal">✕</button>
        </div>
        <form class="modal-body" @submit.prevent="handleSubmit">
          <p v-if="formError" class="form-error">{{ formError }}</p>
          <div class="form-grid">
            <div class="field field--full">
              <div class="field-head">
                <span class="field-label">Bệnh YHCT - Đông Y <abbr title="bắt buộc">*</abbr></span>
                <span class="field-count">{{ form.id_benh != null ? 'Đã chọn' : 'Chưa chọn' }}</span>
              </div>
              <div v-if="benhOptions.length === 0" class="muted">Chưa có dữ liệu Bệnh YHCT - Đông Y</div>
              <template v-else>
                <div class="picker-search">
                  <input
                    v-model="benhSearch"
                    type="search"
                    class="input input--sm"
                    placeholder="Tìm bệnh theo tên, mã..."
                  />
                </div>
                <div class="chip-picker chip-picker--scroll">
                  <button
                    v-for="b in filteredBenhOptions"
                    :key="b.id"
                    type="button"
                    class="chip-toggle"
                    :class="{ active: form.id_benh === b.id }"
                    @click="form.id_benh = b.id"
                  >
                    {{ b.name || b.tieuket || b.chung_trang || `#${b.id}` }}
                    <span v-if="b.code" class="chip-sub">— {{ b.code }}</span>
                  </button>
                  <span v-if="filteredBenhOptions.length === 0" class="muted">
                    Không khớp "{{ benhSearch }}"
                  </span>
                </div>
              </template>
            </div>

            <div class="field field--full">
              <div class="field-head">
                <span class="field-label">Huyệt vị <abbr title="bắt buộc">*</abbr></span>
                <span class="field-count">{{ form.rows.length }} huyệt</span>
              </div>
              <small v-if="editingBenhId != null" class="field-hint">
                Khi lưu: huyệt bị xóa sẽ bị bỏ khỏi bệnh, huyệt mới sẽ được thêm.
              </small>

              <div v-if="form.rows.length" class="huyet-rows">
                <div class="huyet-rows__head">
                  <span class="hr-col hr-col--name">Huyệt vị</span>
                  <span class="hr-col hr-col--method">Phương pháp tác động</span>
                  <span class="hr-col hr-col--note">Ghi chú kỹ thuật</span>
                  <span class="hr-col hr-col--action"></span>
                </div>
                <div v-for="(row, i) in form.rows" :key="row.idHuyet" class="huyet-row">
                  <div class="hr-col hr-col--name">
                    <span class="huyet-name">{{ huyetRowLabel(row.idHuyet) }}</span>
                    <small v-if="huyetRowKinhMach(row.idHuyet)" class="huyet-kinh">
                      {{ huyetRowKinhMach(row.idHuyet) }}
                    </small>
                  </div>
                  <div class="hr-col hr-col--method">
                    <select v-model="row.phuong_phap_tac_dong" class="input input--sm">
                      <option value="">— Chọn —</option>
                      <option v-for="opt in PHUONG_PHAP_OPTIONS" :key="opt" :value="opt">{{ opt }}</option>
                    </select>
                  </div>
                  <div class="hr-col hr-col--note">
                    <input
                      v-model="row.ghi_chu_ky_thuat"
                      class="input input--sm"
                      placeholder="vd. sâu 0.5 thốn, tả pháp..."
                    />
                  </div>
                  <div class="hr-col hr-col--action">
                    <button
                      type="button"
                      class="btn-mini btn-mini-danger"
                      aria-label="Xóa"
                      @click="removeHuyetRow(i)"
                    >✕</button>
                  </div>
                </div>
              </div>

              <div v-if="huyetViOptions.length === 0" class="muted">Chưa có dữ liệu huyệt vị</div>
              <template v-else>
                <input
                  v-model="huyetAddSearch"
                  type="search"
                  class="input input--sm"
                  list="huyet-vi-options"
                  placeholder="+ Gõ tên huyệt hoặc mã huyệt để thêm dòng..."
                  @change="onHuyetAddChange"
                />
                <datalist id="huyet-vi-options">
                  <option
                    v-for="h in huyetViOptions"
                    :key="h.idHuyet"
                    :value="h.ten_huyet ?? ''"
                  >{{ [h.ma_huyet, h.kinhMach ? kinhMachLabel(h.kinhMach) : null].filter(Boolean).join(' · ') }}</option>
                </datalist>
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
            Xóa toàn bộ phương huyệt của bệnh
            <strong>{{ benhLabel(deletingGroup?.benh ?? null, deletingGroup?.idBenh) }}</strong>
            ({{ deletingGroup?.items.length ?? 0 }} huyệt)? Thao tác không hoàn tác.
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

.toolbar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-4); }
.search-wrap { display: flex; flex-direction: column; gap: var(--space-1); flex: 1; min-width: 200px; max-width: 420px; }
.search-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.04em; }
.search-input { padding: var(--space-2) var(--space-3); border: 1px solid var(--gray-200); border-radius: var(--radius-md); font-size: var(--font-size-md); }
.toolbar-count { font-size: var(--font-size-sm); color: var(--gray-500); font-weight: 600; }

.data-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm); }
.card-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4) var(--space-5); background: var(--brown-50); border-bottom: 1px solid var(--brown-100); }
.card-header h3 { font-size: var(--font-size-lg); font-weight: 700; color: var(--brown-900); margin: 0; }

.empty-state {
  padding: var(--space-12) var(--space-5);
  text-align: center;
  color: var(--gray-500);
  font-size: var(--font-size-md);
  background: linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%);
}

.disease-grid {
  /* Masonry bằng CSS multi-column: thẻ xếp KHÍT theo cột, không còn kẽ hở (đọc theo cột dọc). */
  column-width: 340px;
  column-gap: var(--space-4);
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
  /* Masonry: không cho thẻ bị cắt ngang giữa 2 cột; dùng margin (multicol không áp dụng gap dọc). */
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
  page-break-inside: avoid;
  width: 100%;
  margin-bottom: var(--space-4);
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
  background: linear-gradient(135deg, var(--brown-50) 0%, var(--surface) 100%);
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
.disease-card__code {
  font-size: 11px;
  color: var(--gray-500);
  font-family: ui-monospace, monospace;
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
.disease-section__notes {
  font-size: var(--font-size-sm);
  color: var(--gray-800);
  line-height: 1.5;
}
.disease-empty { margin: 0; font-size: var(--font-size-sm); text-align: center; padding: var(--space-3) 0; }
/* Phương huyệt nguyên văn (dữ liệu cũ) — giữ xuống dòng gốc, đóng khung như một "đơn" */
.ph-text {
  margin: 0;
  white-space: pre-line;
  padding: 10px 12px;
  background: var(--brown-50);
  border: 1px solid var(--brown-100);
  border-radius: 8px;
  font-size: 13.5px;
  color: var(--gray-800);
  line-height: 1.6;
}
.ph-text--muted { background: var(--gray-50); border-color: var(--gray-200); color: var(--gray-700); font-size: 13px; }
/* Cắt gọn 4 dòng khi chưa "Xem thêm" — giữ chiều cao thẻ đồng đều, lưới gọn mắt. */
.ph-text--clamp {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
/* Nút + ghi chú AI tách huyệt */
.ph-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.btn-ai-sm {
  padding: 3px 10px;
  background: linear-gradient(135deg, var(--ai-solid), var(--ai-solid-2));
  color: var(--white);
  border: none;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: filter var(--transition-fast);
  white-space: nowrap;
}
.btn-ai-sm:hover:not(:disabled) { filter: brightness(1.08); }
.btn-ai-sm:disabled { opacity: 0.6; cursor: not-allowed; }
.ai-parse-note {
  margin: 6px 0;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--ai-solid) 8%, white);
  border: 1px solid color-mix(in srgb, var(--ai-solid) 25%, white);
  border-radius: 8px;
  font-size: 13px;
  color: var(--gray-800);
}
.ai-unmatched-huyet { margin: 6px 0; display: flex; flex-direction: column; gap: 4px; }
.ai-unmatched-huyet .chip-row { display: flex; flex-wrap: wrap; gap: 5px; }
.chip-warn { background: #fdf0dc; color: #9a6313; border: 1px solid #f0dcc0; border-radius: 999px; padding: 2px 9px; font-size: 12.5px; }

.chip-row { display: flex; flex-wrap: wrap; gap: 4px; }
.chip-row--wrap { gap: 6px; }
.chip-row--wrap .chip { white-space: normal; word-break: break-word; max-width: 100%; }

/* Bảng huyệt vị trong card display */
.huyet-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--white);
}
.huyet-table__head,
.huyet-table__row {
  display: grid;
  grid-template-columns: minmax(120px, 1.4fr) minmax(100px, 1fr) minmax(120px, 1.6fr);
  gap: var(--space-2);
  padding: 6px var(--space-2);
  align-items: center;
}
.huyet-table__head {
  background: var(--surface-2);
  border-bottom: 1px solid var(--gray-100);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gray-500);
}
.huyet-table__row + .huyet-table__row { border-top: 1px solid var(--gray-100); }
.huyet-table__row:hover { background: var(--surface-2); }
.ht-col { font-size: var(--font-size-sm); color: var(--gray-800); min-width: 0; word-break: break-word; }
.ht-col--name { display: flex; flex-direction: column; gap: 2px; align-items: flex-start; }
.ht-kinh { font-size: 11px; color: var(--gray-500); }

.note-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.45;
  word-break: break-word;
}
.note-text--expanded {
  display: block;
  -webkit-line-clamp: unset;
  overflow: visible;
}
.note-toggle {
  display: inline-block;
  margin-top: 2px;
  padding: 0;
  background: transparent;
  border: 0;
  color: var(--brown-700);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}
.note-toggle:hover { color: var(--brown-800); }

/* Bảng nhập huyệt vị trong modal form */
.huyet-rows {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--white);
  margin-bottom: var(--space-2);
}
.huyet-rows__head,
.huyet-row {
  display: grid;
  grid-template-columns: minmax(120px, 1.3fr) minmax(140px, 1.1fr) minmax(140px, 1.6fr) 32px;
  gap: var(--space-2);
  padding: 6px var(--space-2);
  align-items: center;
}
.huyet-rows__head {
  background: var(--surface-2);
  border-bottom: 1px solid var(--gray-100);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gray-500);
}
.huyet-row + .huyet-row { border-top: 1px solid var(--gray-100); }
.hr-col { min-width: 0; }
.hr-col--name { display: flex; flex-direction: column; gap: 2px; }
.hr-col--method select { width: 100%; cursor: pointer; }
.hr-col--note input { width: 100%; }
.hr-col--action { display: flex; justify-content: center; }
.huyet-name { font-weight: 600; color: var(--brown-900); font-size: var(--font-size-sm); }
.huyet-kinh { font-size: 11px; color: var(--gray-500); }

.btn-mini {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--gray-200);
  background: var(--white);
  color: var(--gray-600);
  cursor: pointer;
  padding: 0;
}
.btn-mini:hover { border-color: var(--brown-400); color: var(--brown-700); }
.btn-mini-danger:hover { border-color: var(--danger-border); color: var(--danger); background: var(--danger-bg); }

.chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  border: 1px solid transparent;
}
.chip-benh { background: var(--chip-pattern-bg); color: var(--chip-pattern-fg); border-color: var(--chip-pattern-border); }
.chip-huyet { background: var(--info-bg); color: var(--info-fg); border-color: var(--info-border); }
.chip-role { background: var(--warning-bg); color: var(--warning-fg); border-color: var(--warning-border); }
.chip-method { background: var(--chip-method-bg); color: var(--chip-method-fg); border-color: var(--chip-method-border); }
.chip-sub { font-size: 11px; opacity: 0.85; font-weight: 500; }
.muted { color: var(--gray-400); font-style: italic; }

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
.text-right { text-align: right !important; }
.py-8 { padding-top: 2rem !important; padding-bottom: 2rem !important; }
.font-bold { font-weight: 700 !important; }
.text-gray-500 { color: var(--gray-500) !important; }

.badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-success { background: var(--success-bg); color: var(--success-fg); }

.loading-state { display: flex; flex-direction: column; align-items: center; padding: var(--space-12) 0; color: var(--brown-600); }
.spinner { width: 32px; height: 32px; border: 3px solid var(--gray-200); border-top-color: var(--brown-500); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-state { text-align: center; padding: var(--space-8); color: var(--danger); background: var(--danger-bg); border-radius: var(--radius-lg); }

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
  max-width: 640px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15);
  overflow: hidden;
}
.modal--wide { max-width: 880px; }
.modal--sm { max-width: 440px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--gray-100); }
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

.form-error { background: var(--danger-bg); color: var(--danger); border: 1px solid var(--danger-border); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); margin-bottom: var(--space-3); font-size: var(--font-size-sm); }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.field { display: flex; flex-direction: column; gap: 4px; }
.field--full { grid-column: 1 / -1; }
.field > span, .field-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-700); }
.field-hint { font-size: 11px; color: var(--gray-500); margin-top: 2px; }
.field-hint code { background: var(--gray-100); padding: 1px 5px; border-radius: 3px; font-size: 11px; }
.field-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-2); }
.field-count { font-size: 11px; font-weight: 600; color: var(--brown-600); background: var(--brown-50); padding: 1px 8px; border-radius: 999px; }

.input, .textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-family: inherit;
}
.input:focus, .textarea:focus { outline: none; border-color: var(--brown-500); box-shadow: var(--focus-ring); }
.textarea { resize: vertical; min-height: 60px; }
.input--sm { padding: 6px 10px; font-size: 13px; }
.picker-search { margin-bottom: 6px; }

.chip-picker { display: flex; flex-wrap: wrap; gap: 6px; padding: var(--space-2); border: 1px solid var(--gray-200); border-radius: var(--radius-md); background: var(--gray-50); }
.chip-picker--scroll { max-height: 220px; overflow-y: auto; }
.chip-toggle { padding: 4px 10px; font-size: 13px; font-weight: 600; border-radius: 999px; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); cursor: pointer; transition: all var(--transition-fast); }
.chip-toggle:hover { border-color: var(--brown-400); color: var(--brown-700); }
.chip-toggle.active { background: var(--brown-600); color: var(--white); border-color: var(--brown-600); }

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .field--full { grid-column: 1; }
  .management-page { padding: var(--space-4); }
}
</style>
