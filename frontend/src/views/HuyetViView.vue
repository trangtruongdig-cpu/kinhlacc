<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { api } from '@/services/api'

interface KinhMachLite {
  idKinhMach: number
  ten_kinh_mach: string | null
  ten_viet_tat: string | null
  ky_hieu_quoc_te?: string | null
}

interface HuyetViRow {
  idHuyet: number
  idKinhMach: number
  ten_huyet: string | null
  ma_huyet: string | null
  vi_tri_giai_phau: string | null
  loai_huyet: string | null
  chong_chi_dinh: string | null
  kinhMach: KinhMachLite | null
}

interface FormState {
  id_kinh_mach: number | null
  ten_huyet: string
  ma_huyet: string
  vi_tri_giai_phau: string
  loai_huyet: string
  chong_chi_dinh: string
}

const isLoading = ref(true)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const formError = ref<string | null>(null)
const dataList = ref<HuyetViRow[]>([])
const dataTotal = ref(0)
const kinhMachOptions = ref<KinhMachLite[]>([])
const searchQuery = ref('')
const kinhMachFilter = ref<number | null>(null)
const kinhMachSearch = ref('')
const pageLoading = ref(false)

const showModal = ref(false)
const showDeleteConfirm = ref(false)
const editingId = ref<number | null>(null)
const deletingItem = ref<HuyetViRow | null>(null)

const emptyForm = (): FormState => ({
  id_kinh_mach: null,
  ten_huyet: '',
  ma_huyet: '',
  vi_tri_giai_phau: '',
  loai_huyet: '',
  chong_chi_dinh: '',
})

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
      idKinhMach: kinhMachFilter.value,
    })
    const res: any = await api.get(`/huyet-vi/lite${qs}`)
    dataList.value = res?.data ?? []
    dataTotal.value = Number(res?.total ?? 0)
  } finally {
    pageLoading.value = false
  }
}

async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    const [, kmRes]: any = await Promise.all([
      loadPage(),
      api.get('/kinh-mach'),
    ])
    kinhMachOptions.value = Array.isArray(kmRes) ? kmRes : kmRes?.data ?? []
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
watch(kinhMachFilter, () => {
  currentPage.value = 1
  void loadPage()
})
watch(currentPage, () => { void loadPage() })

function kinhMachLabel(k: KinhMachLite | null | undefined): string {
  if (!k) return '—'
  return k.ten_kinh_mach || k.ten_viet_tat || `#${k.idKinhMach}`
}

const filteredKinhMachOptions = computed(() => {
  const q = kinhMachSearch.value.trim().toLowerCase()
  if (!q) return kinhMachOptions.value
  return kinhMachOptions.value.filter((k) => {
    const hay = [k.ten_kinh_mach, k.ten_viet_tat, k.ky_hieu_quoc_te]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
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

function openCreateModal() {
  editingId.value = null
  form.value = emptyForm()
  if (kinhMachFilter.value != null) {
    form.value.id_kinh_mach = kinhMachFilter.value
  }
  formError.value = null
  kinhMachSearch.value = ''
  showModal.value = true
}

function openEditModal(row: HuyetViRow) {
  editingId.value = row.idHuyet
  form.value = {
    id_kinh_mach: row.idKinhMach ?? null,
    ten_huyet: row.ten_huyet ?? '',
    ma_huyet: row.ma_huyet ?? '',
    vi_tri_giai_phau: row.vi_tri_giai_phau ?? '',
    loai_huyet: row.loai_huyet ?? '',
    chong_chi_dinh: row.chong_chi_dinh ?? '',
  }
  formError.value = null
  kinhMachSearch.value = ''
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
  if (!f.ten_huyet.trim()) {
    formError.value = 'Vui lòng nhập tên huyệt'
    return
  }
  if (f.id_kinh_mach == null) {
    formError.value = 'Vui lòng chọn kinh mạch'
    return
  }
  const payload: Record<string, unknown> = {
    id_kinh_mach: f.id_kinh_mach,
    ten_huyet: f.ten_huyet.trim(),
    ma_huyet: f.ma_huyet.trim() || null,
    vi_tri_giai_phau: f.vi_tri_giai_phau.trim() || null,
    loai_huyet: f.loai_huyet.trim() || null,
    chong_chi_dinh: f.chong_chi_dinh.trim() || null,
  }
  isSubmitting.value = true
  try {
    if (editingId.value != null) {
      await api.put(`/huyet-vi/${editingId.value}`, payload)
    } else {
      await api.post('/huyet-vi', payload)
    }
    await loadPage()
    closeModal()
  } catch (err: any) {
    formError.value = err.message || 'Không lưu được dữ liệu'
  } finally {
    isSubmitting.value = false
  }
}

function confirmDelete(row: HuyetViRow) {
  deletingItem.value = row
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (isSubmitting.value) return
  if (!deletingItem.value) return
  isSubmitting.value = true
  try {
    await api.delete(`/huyet-vi/${deletingItem.value.idHuyet}`)
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
        <h1 class="page-title">Quản Lý Huyệt Vị</h1>
        <p class="page-subtitle">Danh mục huyệt vị thuộc các kinh mạch — vị trí giải phẫu, loại huyệt, chống chỉ định</p>
      </div>
      <button type="button" class="btn-primary" @click="openCreateModal">+ Thêm huyệt</button>
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
            placeholder="Tìm theo tên, mã, vị trí, loại huyệt..."
            autocomplete="off"
          />
        </label>
        <label class="filter-wrap">
          <span class="search-label">Lọc theo kinh mạch</span>
          <select v-model="kinhMachFilter" class="search-input">
            <option :value="null">— Tất cả —</option>
            <option v-for="k in kinhMachOptions" :key="k.idKinhMach" :value="k.idKinhMach">
              {{ kinhMachLabel(k) }}
            </option>
          </select>
        </label>
        <span class="toolbar-count">{{ filteredList.length }} / {{ dataList.length }} huyệt</span>
      </div>

      <div class="data-card" :class="{ 'data-card--loading': pageLoading }">
        <div v-if="pageLoading" class="loading-bar" aria-hidden="true"></div>
        <div class="card-header">
          <h3>Danh Sách Huyệt Vị</h3>
          <span class="badge badge-success">{{ dataTotal }} bản ghi</span>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th width="64">ID</th>
                <th width="180">Kinh mạch</th>
                <th>Tên huyệt</th>
                <th width="100">Mã</th>
                <th width="120">Loại huyệt</th>
                <th>Vị trí giải phẫu</th>
                <th width="120" class="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pagedList.length === 0">
                <td colspan="7" class="text-center py-8 text-gray-500">
                  {{ searchQuery.trim() || kinhMachFilter != null ? 'Không khớp bản ghi nào' : 'Chưa có dữ liệu' }}
                </td>
              </tr>
              <tr v-for="item in pagedList" :key="item.idHuyet">
                <td class="font-bold cell-id">#{{ item.idHuyet }}</td>
                <td>
                  <span class="chip chip-kinh">{{ kinhMachLabel(item.kinhMach) }}</span>
                </td>
                <td class="text-brown-900 font-bold">{{ item.ten_huyet || '—' }}</td>
                <td>
                  <span v-if="item.ma_huyet" class="chip chip-code">{{ item.ma_huyet }}</span>
                  <span v-else class="muted">—</span>
                </td>
                <td>
                  <span v-if="item.loai_huyet" class="chip chip-type">{{ item.loai_huyet }}</span>
                  <span v-else class="muted">—</span>
                </td>
                <td class="cell-wrap">{{ item.vi_tri_giai_phau || '—' }}</td>
                <td class="text-right">
                  <div class="row-actions">
                    <button type="button" class="btn-action btn-edit" @click="openEditModal(item)">Sửa</button>
                    <button type="button" class="btn-action btn-delete" @click="confirmDelete(item)">Xóa</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
          <h3>{{ editingId != null ? 'Sửa huyệt vị' : 'Thêm huyệt vị' }}</h3>
          <button type="button" class="modal-close" aria-label="Đóng" @click="closeModal">✕</button>
        </div>
        <form class="modal-body" @submit.prevent="handleSubmit">
          <p v-if="formError" class="form-error">{{ formError }}</p>
          <div class="form-grid">
            <label class="field">
              <span>Tên huyệt <abbr title="bắt buộc">*</abbr></span>
              <input v-model="form.ten_huyet" class="input" placeholder="vd. Hợp cốc" maxlength="255" />
            </label>
            <label class="field">
              <span>Mã huyệt</span>
              <input v-model="form.ma_huyet" class="input" placeholder="vd. LI4" maxlength="50" />
            </label>
            <label class="field">
              <span>Loại huyệt</span>
              <input v-model="form.loai_huyet" class="input" placeholder="vd. Nguyên huyệt" maxlength="100" />
            </label>
            <label class="field">
              <span>Vị trí giải phẫu</span>
              <textarea v-model="form.vi_tri_giai_phau" class="textarea" rows="2" placeholder="vd. Giữa xương bàn 1 và 2"></textarea>
            </label>
            <label class="field field--full">
              <span>Chống chỉ định</span>
              <textarea v-model="form.chong_chi_dinh" class="textarea" rows="2" placeholder="vd. Phụ nữ có thai..."></textarea>
            </label>

            <div class="field field--full">
              <div class="field-head">
                <span class="field-label">Kinh mạch <abbr title="bắt buộc">*</abbr></span>
                <span class="field-count">{{ form.id_kinh_mach != null ? 'Đã chọn' : 'Chưa chọn' }}</span>
              </div>
              <div v-if="kinhMachOptions.length === 0" class="muted">Chưa có dữ liệu kinh mạch</div>
              <template v-else>
                <div class="picker-search">
                  <input
                    v-model="kinhMachSearch"
                    type="search"
                    class="input input--sm"
                    placeholder="Tìm kinh mạch..."
                  />
                </div>
                <div class="chip-picker chip-picker--scroll">
                  <button
                    v-for="k in filteredKinhMachOptions"
                    :key="k.idKinhMach"
                    type="button"
                    class="chip-toggle"
                    :class="{ active: form.id_kinh_mach === k.idKinhMach }"
                    @click="form.id_kinh_mach = k.idKinhMach"
                  >
                    {{ kinhMachLabel(k) }}
                  </button>
                  <span v-if="filteredKinhMachOptions.length === 0" class="muted">
                    Không khớp "{{ kinhMachSearch }}"
                  </span>
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
            Xóa huyệt <strong>{{ deletingItem?.ten_huyet || `#${deletingItem?.idHuyet}` }}</strong>?
            Các phương huyệt tham chiếu sẽ bị xóa kéo theo.
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

.toolbar { display: flex; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-4); }
.search-wrap, .filter-wrap { display: flex; flex-direction: column; gap: var(--space-1); flex: 1; min-width: 200px; }
.search-wrap { max-width: 380px; }
.filter-wrap { max-width: 240px; flex: 0 1 240px; }
.search-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.04em; }
.search-input { padding: var(--space-2) var(--space-3); border: 1px solid var(--gray-200); border-radius: var(--radius-md); font-size: var(--font-size-md); font-family: inherit; }
.toolbar-count { font-size: var(--font-size-sm); color: var(--gray-500); font-weight: 600; margin-left: auto; }

.data-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm); position: relative; }
.data-card--loading { pointer-events: none; }
.loading-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; overflow: hidden; background: rgba(146, 64, 14, 0.08); z-index: 5; }
.loading-bar::before { content: ''; position: absolute; top: 0; left: 0; width: 40%; height: 100%; background: linear-gradient(90deg, transparent, var(--brown-500), transparent); animation: loadingBarSlide 1.1s ease-in-out infinite; }
@keyframes loadingBarSlide { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }
.card-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4) var(--space-5); background: var(--brown-50); border-bottom: 1px solid var(--brown-100); }
.card-header h3 { font-size: var(--font-size-lg); font-weight: 700; color: var(--brown-900); margin: 0; }

.table-responsive { width: 100%; overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: var(--space-3) var(--space-4); text-align: left; border-bottom: 1px solid var(--gray-100); vertical-align: middle; }
.data-table th { background: var(--surface-2); font-weight: 600; font-size: var(--font-size-sm); color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px; }
.data-table tbody tr:hover { background: var(--gray-50); }
.data-table td { font-size: var(--font-size-md); color: var(--gray-800); }
.cell-id { color: var(--gray-500); font-weight: 600; font-size: var(--font-size-sm); }
.cell-wrap { white-space: normal; word-break: break-word; line-height: 1.4; max-width: 400px; }

.chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  border: 1px solid transparent;
}
.chip-kinh { background: var(--success-bg); color: var(--success-fg); border-color: var(--success-border); }
.chip-code { background: var(--info-bg); color: var(--info-fg); border-color: var(--info-border); font-family: ui-monospace, monospace; }
.chip-type { background: var(--warning-bg); color: var(--warning-fg); border-color: var(--warning-border); }
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
.text-brown-900 { color: var(--brown-900) !important; }
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
.chip-picker--scroll { max-height: 200px; overflow-y: auto; }
.chip-toggle { padding: 4px 10px; font-size: 13px; font-weight: 600; border-radius: 999px; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); cursor: pointer; transition: all var(--transition-fast); }
.chip-toggle:hover { border-color: var(--brown-400); color: var(--brown-700); }
.chip-toggle.active { background: var(--brown-600); color: var(--white); border-color: var(--brown-600); }

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .field--full { grid-column: 1; }
  .management-page { padding: var(--space-4); }
}
</style>
