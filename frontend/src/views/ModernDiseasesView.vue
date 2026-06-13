<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { api } from '@/services/api'

interface BenhDongYHienDaiRow {
  id: number
  code: string
  name: string
  outputCell: string
  excelFormula: string
  logicExpression: string
  sqlCaseText: string
  sqlCaseBoolean: string
}

type FormState = Omit<BenhDongYHienDaiRow, 'id'>

const isLoading = ref(true)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const formError = ref<string | null>(null)
const dataList = ref<BenhDongYHienDaiRow[]>([])
const searchQuery = ref('')

const showModal = ref(false)
const showDeleteConfirm = ref(false)
const editingId = ref<number | null>(null)
const deletingItem = ref<BenhDongYHienDaiRow | null>(null)

const emptyForm = (): FormState => ({
  code: '',
  name: '',
  outputCell: '',
  excelFormula: '',
  logicExpression: '',
  sqlCaseText: '',
  sqlCaseBoolean: '',
})

const form = ref<FormState>(emptyForm())

const currentPage = ref(1)
const itemsPerPage = ref(12)

onMounted(async () => {
  await fetchData()
})

watch(searchQuery, () => {
  currentPage.value = 1
})

async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    const res: any = await api.get('/benh-dong-y-hien-dai')
    dataList.value = Array.isArray(res) ? res : res?.data ?? []
  } catch (err: any) {
    console.error(err)
    error.value = 'Lỗi khi tải dữ liệu: ' + (err.message || String(err))
  } finally {
    isLoading.value = false
  }
}

const filteredList = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return dataList.value
  return dataList.value.filter((row) => {
    const hay = [row.code, row.name, row.outputCell]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
})

const pagedList = computed(() => {
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

function openCreateModal() {
  editingId.value = null
  form.value = emptyForm()
  formError.value = null
  showModal.value = true
}

function openEditModal(row: BenhDongYHienDaiRow) {
  editingId.value = row.id
  form.value = {
    code: row.code,
    name: row.name,
    outputCell: row.outputCell,
    excelFormula: row.excelFormula,
    logicExpression: row.logicExpression,
    sqlCaseText: row.sqlCaseText,
    sqlCaseBoolean: row.sqlCaseBoolean,
  }
  formError.value = null
  showModal.value = true
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
  }
  isSubmitting.value = true
  try {
    if (editingId.value != null) {
      await api.put(`/benh-dong-y-hien-dai/${editingId.value}`, payload)
    } else {
      await api.post('/benh-dong-y-hien-dai', payload)
    }
    await fetchData()
    currentPage.value = 1
    closeModal()
  } catch (err: any) {
    formError.value = err.message || 'Không lưu được dữ liệu'
  } finally {
    isSubmitting.value = false
  }
}

function confirmDelete(row: BenhDongYHienDaiRow) {
  deletingItem.value = row
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (isSubmitting.value) return
  if (!deletingItem.value) return
  isSubmitting.value = true
  try {
    await api.delete(`/benh-dong-y-hien-dai/${deletingItem.value.id}`)
    showDeleteConfirm.value = false
    deletingItem.value = null
    await fetchData()
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
        <h1 class="page-title">Bệnh Đông Y Hiện Đại</h1>
        <p class="page-subtitle">
          Danh mục quy tắc chẩn đoán độc lập, cùng cấu trúc với Bệnh Đông Y Excel nhưng không liên kết tới bảng nào khác.
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
            Ô hiển thị <strong>tên ô</strong> (A7, C10…) — <strong>đưa chuột vào ô</strong> để xem <strong>công thức diễn đầy đủ</strong> theo <code>map.md</code>.
          </p>

          <div class="excel-sheet-scroll">
            <table class="excel-sheet" aria-label="Sơ đồ ô chi trên">
              <thead>
                <tr>
                  <th class="excel-corner"></th>
                  <th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th><th>G</th><th>H</th>
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
                <tr v-for="(label, i) in ['Tiểu','Tâm','Tam','Bào','Đại','Phế']" :key="'u' + i">
                  <th class="excel-row-head">{{ 10 + i }}</th>
                  <td class="xc-label">{{ label }}</td>
                  <td class="xc-note">±</td>
                  <td class="xc xc-c" :title="excelCellHint('C' + (10 + i))"><span class="xref">C{{ 10 + i }}</span></td>
                  <td class="xc xc-d" :title="excelCellHint('D' + (10 + i))"><span class="xref">D{{ 10 + i }}</span></td>
                  <td class="xc xc-e" :title="excelCellHint('E' + (10 + i))"><span class="xref">E{{ 10 + i }}</span></td>
                  <td class="xc xc-f" :title="excelCellHint('F' + (10 + i))"><span class="xref">F{{ 10 + i }}</span></td>
                  <td class="xc-note">±</td>
                  <td class="xc xc-h" :title="excelCellHint('H' + (10 + i))"><span class="xref">H{{ 10 + i }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="excel-sheet-scroll">
            <table class="excel-sheet" aria-label="Sơ đồ ô chi dưới">
              <thead>
                <tr>
                  <th class="excel-corner"></th>
                  <th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th><th>G</th><th>H</th>
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
                <tr v-for="(label, i) in ['Bàng','Thận','Đảm','Vị','Can','Tỳ']" :key="'l' + i">
                  <th class="excel-row-head">{{ 21 + i }}</th>
                  <td class="xc-label">{{ label }}</td>
                  <td class="xc-note">±</td>
                  <td class="xc xc-c" :title="excelCellHint('C' + (21 + i))"><span class="xref">C{{ 21 + i }}</span></td>
                  <td class="xc xc-d" :title="excelCellHint('D' + (21 + i))"><span class="xref">D{{ 21 + i }}</span></td>
                  <td class="xc xc-e" :title="excelCellHint('E' + (21 + i))"><span class="xref">E{{ 21 + i }}</span></td>
                  <td class="xc xc-f" :title="excelCellHint('F' + (21 + i))"><span class="xref">F{{ 21 + i }}</span></td>
                  <td class="xc-note">±</td>
                  <td class="xc xc-h" :title="excelCellHint('H' + (21 + i))"><span class="xref">H{{ 21 + i }}</span></td>
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
        </div>
      </details>

      <div class="toolbar">
        <label class="search-wrap">
          <span class="search-label">Tìm kiếm</span>
          <input
            v-model="searchQuery"
            type="search"
            class="search-input"
            placeholder="Tìm theo tên bệnh, mã, ô output..."
            autocomplete="off"
          />
        </label>
        <span class="toolbar-count">{{ filteredList.length }} / {{ dataList.length }} bệnh</span>
      </div>

      <div class="data-card">
        <div class="card-header">
          <h3>Bệnh Đông Y Hiện Đại</h3>
          <span class="badge badge-info">{{ dataList.length }} bản ghi</span>
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
              <section class="disease-section">
                <span class="disease-section__label">Mã</span>
                <span class="cell-tag">{{ item.code }}</span>
              </section>

              <section class="disease-section">
                <span class="disease-section__label">Ô output (Excel)</span>
                <span class="cell-tag">{{ item.outputCell }}</span>
              </section>
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
          <h3>{{ editingId != null ? 'Sửa bệnh' : 'Thêm bệnh' }}</h3>
          <button type="button" class="modal-close" aria-label="Đóng" @click="closeModal">✕</button>
        </div>
        <form class="modal-body" @submit.prevent="handleSubmit">
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
            <label class="field field--full">
              <span>Công thức Excel <abbr title="bắt buộc">*</abbr></span>
              <textarea v-model="form.excelFormula" class="textarea" rows="3" spellcheck="false"></textarea>
            </label>
            <label class="field field--full">
              <span>Logic (AND các mệnh đề) <abbr title="bắt buộc">*</abbr></span>
              <textarea v-model="form.logicExpression" class="textarea mono" rows="4" spellcheck="false"></textarea>
            </label>
            <label class="field field--full">
              <span>SQL CASE (text) <abbr title="bắt buộc">*</abbr></span>
              <textarea v-model="form.sqlCaseText" class="textarea mono" rows="4" spellcheck="false"></textarea>
            </label>
            <label class="field field--full">
              <span>SQL CASE (boolean) <abbr title="bắt buộc">*</abbr></span>
              <textarea v-model="form.sqlCaseBoolean" class="textarea mono" rows="4" spellcheck="false"></textarea>
            </label>
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
.management-page { width: 100%; max-width: 1400px; margin: 0 auto; padding: var(--space-6) var(--space-8); animation: fadeIn 0.4s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-6); padding-bottom: var(--space-4); border-bottom: 2px solid var(--brown-100); }
.header-content { flex: 1; min-width: 200px; }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--brown-800); margin-bottom: var(--space-1); }
.page-subtitle { color: var(--gray-500); font-size: var(--font-size-md); }
.btn-primary { padding: var(--space-3) var(--space-5); background: var(--brown-600); color: var(--white); border: none; border-radius: var(--radius-md); font-weight: 600; cursor: pointer; transition: background var(--transition-fast); }
.btn-primary:hover { background: var(--brown-700); }
.btn-secondary { padding: var(--space-3) var(--space-5); background: var(--white); color: var(--gray-700); border: 1px solid var(--gray-300); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; }
.btn-secondary:hover { background: var(--gray-50); }
.btn-danger { padding: var(--space-3) var(--space-5); background: var(--danger); color: var(--white); border: none; border-radius: var(--radius-md); font-weight: 600; cursor: pointer; }
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
  background: linear-gradient(180deg, #fff 0%, var(--surface-2) 100%);
}

.disease-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
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
.disease-card__title { display: flex; align-items: center; gap: var(--space-2); min-width: 0; flex: 1; }
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
.disease-section { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
.disease-section__label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gray-500);
}

.cell-tag { display: inline-block; padding: 2px 8px; background: var(--brown-50); border-radius: var(--radius-sm); font-family: ui-monospace, monospace; font-size: var(--font-size-sm); }

.excel-map-panel { margin-bottom: var(--space-5); border: 1px solid var(--brown-200); border-radius: var(--radius-xl); background: linear-gradient(165deg, #fffdfb 0%, var(--white) 40%); box-shadow: var(--shadow-sm); overflow: hidden; }
.excel-map-summary { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--space-3); padding: var(--space-4) var(--space-5); cursor: pointer; list-style: none; font-weight: 700; color: var(--brown-900); background: linear-gradient(90deg, var(--brown-50), #fff); border-bottom: 1px solid var(--brown-100); }
.excel-map-summary::-webkit-details-marker { display: none; }
.excel-map-summary::before { content: '▸'; display: inline-block; margin-right: var(--space-2); transition: transform 0.2s ease; color: var(--brown-500); }
.excel-map-panel[open] .excel-map-summary::before { transform: rotate(90deg); }
.excel-map-summary-title { font-size: var(--font-size-md); }
.excel-map-summary-hint { font-size: var(--font-size-xs); font-weight: 600; color: var(--gray-500); }
.excel-map-body { padding: var(--space-5); }
.excel-map-intro { margin: 0 0 var(--space-4); font-size: var(--font-size-sm); color: var(--gray-700); line-height: 1.55; }
.excel-sheet-scroll { overflow-x: auto; margin-bottom: var(--space-3); border-radius: var(--radius-md); border: 1px solid #c6d4e3; }
.excel-sheet { width: 100%; min-width: 640px; border-collapse: collapse; font-family: 'Segoe UI', Calibri, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; background: #fff; table-layout: fixed; }
.excel-sheet thead th { background: linear-gradient(180deg, #f3f2f1 0%, #e8e7e4 100%); border: 1px solid #c6d4e3; padding: 6px 8px; font-weight: 700; font-size: 12px; color: #323130; text-align: center; }
.excel-corner { background: #e7e6e4 !important; width: 44px; }
.excel-row-head { background: #f3f2f1 !important; border: 1px solid #c6d4e3; width: 44px; padding: 6px 4px; font-weight: 600; font-size: 12px; color: #605e5c; text-align: center; }
.excel-sheet tbody td { border: 1px solid #d0d7de; padding: 6px 8px; text-align: center; vertical-align: middle; height: 28px; }
.excel-sheet tbody td[title]:not([title='']) { cursor: help; }
.excel-sheet tbody tr.excel-gap .xc-gap { height: 14px; padding: 0; background: repeating-linear-gradient(90deg, #fafafa, #fafafa 6px, #f3f3f3 6px, #f3f3f3 12px); border-color: #e8ecf0; }
.excel-gap .excel-row-head { background: #fafafa !important; color: #a19f9d; }
.xc-empty { background: #fafafa; }
.xc-label { text-align: left !important; font-weight: 600; color: var(--brown-900); background: #fffefb; }
.xc-note { font-size: 11px; color: #8a8886; font-weight: 600; background: #fafafa; }
.xref { display: inline-block; font-family: ui-monospace, monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.02em; }
.xref-formula { display: block; margin-top: 4px; font-size: 10px; font-weight: 500; color: #605e5c; font-family: ui-monospace, monospace; }
.xc-a { background: rgba(156,163,175,0.18); }
.xc-b { background: rgba(16,185,129,0.12); }
.xc-c { background: rgba(59,130,246,0.14); }
.xc-d { background: rgba(107,114,128,0.12); }
.xc-e { background: rgba(245,158,11,0.18); }
.xc-f { background: rgba(16,185,129,0.14); }
.xc-h { background: rgba(139,92,246,0.14); }

.action-buttons { display: inline-flex; gap: var(--space-2); }
.btn-action { padding: 6px 12px; border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: 600; cursor: pointer; border: 1px solid transparent; }
.btn-edit { background: var(--brown-50); color: var(--brown-800); border-color: var(--brown-200); }
.btn-edit:hover { background: var(--brown-100); }
.btn-delete { background: var(--danger-bg); color: var(--danger); border-color: var(--danger-border); }
.btn-delete:hover { background: var(--danger-bg); }

.pagination { display: flex; align-items: center; justify-content: center; gap: var(--space-2); padding: var(--space-4); background: var(--gray-50); border-top: 1px solid var(--gray-100); }
.page-btn { min-width: 32px; height: 32px; padding: 0 8px; display: flex; align-items: center; justify-content: center; background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-600); cursor: pointer; transition: all var(--transition-fast); }
.page-btn:hover:not(:disabled) { border-color: var(--brown-400); color: var(--brown-700); background: var(--brown-50); }
.page-btn.active { background: var(--brown-600); border-color: var(--brown-600); color: var(--white); }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { margin-left: var(--space-4); font-size: var(--font-size-xs); color: var(--gray-500); font-weight: 600; }

.badge { display: inline-block; padding: 4px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-info { background: var(--info-bg); color: var(--info-fg); }

.text-center { text-align: center !important; }
.py-8 { padding-top: 2rem !important; padding-bottom: 2rem !important; }
.font-bold { font-weight: 700 !important; }
.text-brown-900 { color: var(--brown-900) !important; }
.text-gray-500 { color: var(--gray-500) !important; }
.text-right { text-align: right !important; }

.loading-state { display: flex; flex-direction: column; align-items: center; padding: var(--space-12) 0; color: var(--brown-600); }
.spinner { width: 32px; height: 32px; border: 3px solid var(--gray-200); border-top-color: var(--brown-500); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-state { text-align: center; padding: var(--space-8); color: var(--danger); background: var(--danger-bg); border-radius: var(--radius-lg); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--space-4); }
.modal { background: var(--white); border-radius: var(--radius-lg); width: 100%; max-width: 600px; max-height: 92vh; overflow-y: auto; box-shadow: var(--shadow-xl); animation: modalIn 0.25s ease; }
.modal--wide { max-width: 880px; }
.modal--sm { max-width: 420px; }
@keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--gray-100); }
.modal-header h3 { font-size: var(--font-size-lg); font-weight: 700; color: var(--black); margin: 0; }
.modal-close { width: 32px; height: 32px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; color: var(--gray-400); font-size: var(--font-size-lg); background: none; border: none; cursor: pointer; transition: all var(--transition-fast); }
.modal-close:hover { background: var(--gray-100); color: var(--gray-700); }
.modal-body { padding: var(--space-6); }
.modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: var(--space-4) var(--space-6); border-top: 1px solid var(--gray-100); }
.form-error { color: var(--danger); font-size: var(--font-size-sm); margin: 0 0 var(--space-4); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.field { display: flex; flex-direction: column; gap: var(--space-2); }
.field span { font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-700); }
.field--full { grid-column: 1 / -1; }
.input, .textarea { width: 100%; padding: var(--space-2) var(--space-3); border: 1px solid var(--gray-200); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-family: inherit; }
.textarea.mono { font-family: ui-monospace, monospace; font-size: var(--font-size-xs); line-height: 1.5; }

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .field--full { grid-column: 1; }
  .management-page { padding: var(--space-4); }
}
</style>
