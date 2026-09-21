<script setup lang="ts">
// "Bộ Huyệt" — quản lý QUAN HỆ giữa các huyệt (huyệt này kết hợp với huyệt nào, làm việc gì khi
// đứng chung), khác hẳn tab Huyệt Vị (tra cứu huyệt ĐƠN LẺ). Dùng lại bảng phac_do_chuan có sẵn
// từ trước (42 dòng, vốn chỉ gắn bệnh chứng, không giao diện nào đụng tới) — thêm cột `loai` để nó
// ôm được cả 2 việc: quan hệ huyệt↔huyệt kinh điển (Nguyên-Lạc, Bát Mạch Giao Hội, Du-Mộ, Tứ Quan)
// và nhóm "bài thuốc tương đương" (mỗi huyệt trong nhóm ứng 1 vị thuốc của bài thuốc cổ phương).
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api'
import { moPhieuInBoHuyet, moXem3D } from '@/lib/inBoHuyet'

const route = useRoute()
const router = useRouter()

interface KinhMachLite {
  idKinhMach: number
  ten_viet_tat: string | null
}
interface HuyetViLite {
  idHuyet: number
  ten_huyet: string | null
  ma_huyet: string | null
  kinhMach?: KinhMachLite | null
}
interface DongHuyet {
  id: number
  idHuyet: number
  thuTu: number
  vai_tro_huyet: string | null
  huyetVi: HuyetViLite | null
}
interface BoHuyet {
  id: number
  ten: string
  loai: string
  ghi_chu: string | null
  idBenhDongY: number | null
  huyetDong: DongHuyet[]
}

const LOAI_LABEL: Record<string, string> = {
  chung_benh: 'Bệnh chứng',
  phoi_huyet_kinh_dien: 'Phối huyệt kinh điển',
  bai_thuoc_tuong_duong: 'Bài thuốc tương đương',
}
const LOAI_MAU: Record<string, string> = {
  chung_benh: '#3b7a49',
  phoi_huyet_kinh_dien: '#38548c',
  bai_thuoc_tuong_duong: '#a5382f',
}
const loaiLabel = (l: string) => LOAI_LABEL[l] || l
const loaiMau = (l: string) => LOAI_MAU[l] || '#8d8477'

const isLoading = ref(true)
const error = ref<string | null>(null)
const danhSach = ref<BoHuyet[]>([])
const locLoai = ref<string>('')
const timKiem = ref('')

// Lọc theo 1 huyệt (đến từ tab Huyệt Vị: ?tab=bo-huyet&huyet=<idHuyet>) — dùng API tra ngược riêng
// thay vì lọc trong danh sách đầy đủ (chuẩn xác hơn: chỉ những bộ CÓ huyệt này thật).
const locTheoHuyet = ref<{ id: number; ten: string } | null>(null)

async function taiDanhSach() {
  isLoading.value = true
  error.value = null
  try {
    const idHuyet = route.query.huyet ? Number(route.query.huyet) : null
    if (idHuyet) {
      const res: any = await api.get(`/phac-do-chuan/theo-huyet/${idHuyet}`)
      danhSach.value = res ?? []
      const ten = danhSach.value.flatMap((b) => b.huyetDong).find((h) => h.idHuyet === idHuyet)?.huyetVi?.ten_huyet
      locTheoHuyet.value = { id: idHuyet, ten: ten || `#${idHuyet}` }
    } else {
      locTheoHuyet.value = null
      const qs = locLoai.value ? `?loai=${encodeURIComponent(locLoai.value)}` : ''
      const res: any = await api.get(`/phac-do-chuan${qs}`)
      danhSach.value = res ?? []
    }
  } catch (err: any) {
    error.value = 'Lỗi khi tải dữ liệu: ' + (err.message || String(err))
  } finally {
    isLoading.value = false
  }
}

function boLocHuyet() {
  const q = { ...route.query }
  delete q.huyet
  router.push({ query: q })
}

onMounted(taiDanhSach)
watch(() => route.query.huyet, taiDanhSach)
watch(locLoai, () => {
  if (!locTheoHuyet.value) void taiDanhSach()
})

const filteredList = computed(() => {
  const q = timKiem.value.trim().toLowerCase()
  if (!q) return danhSach.value
  return danhSach.value.filter((b) => b.ten.toLowerCase().includes(q) || (b.ghi_chu || '').toLowerCase().includes(q))
})

// ── Modal Thêm/Sửa ──────────────────────────────────────────────────────────────────────────
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const deletingItem = ref<BoHuyet | null>(null)
const editingId = ref<number | null>(null)
const isSubmitting = ref(false)
const formError = ref<string | null>(null)

interface FormHuyetLine {
  idHuyet: number
  ten_huyet: string
  ma_huyet: string
  vai_tro_huyet: string
}
const emptyForm = () => ({ ten: '', loai: 'phoi_huyet_kinh_dien', ghi_chu: '', huyet: [] as FormHuyetLine[] })
const form = ref(emptyForm())

function openCreateModal() {
  editingId.value = null
  form.value = emptyForm()
  formError.value = null
  showModal.value = true
}
function openEditModal(b: BoHuyet) {
  editingId.value = b.id
  form.value = {
    ten: b.ten,
    loai: b.loai,
    ghi_chu: b.ghi_chu || '',
    huyet: b.huyetDong
      .slice()
      .sort((a, z) => a.thuTu - z.thuTu)
      .map((h) => ({
        idHuyet: h.idHuyet,
        ten_huyet: h.huyetVi?.ten_huyet || '',
        ma_huyet: h.huyetVi?.ma_huyet || '',
        vai_tro_huyet: h.vai_tro_huyet || '',
      })),
  }
  formError.value = null
  showModal.value = true
}
function closeModal() {
  showModal.value = false
}

// Gợi ý huyệt để thêm vào nhóm — tra /huyet-vi/lite theo tên/mã đang gõ.
const timHuyetTu = ref('')
const goiYHuyet = ref<HuyetViLite[]>([])
let goiYTimer: ReturnType<typeof setTimeout> | null = null
watch(timHuyetTu, (v) => {
  if (goiYTimer) clearTimeout(goiYTimer)
  const q = v.trim()
  if (q.length < 1) {
    goiYHuyet.value = []
    return
  }
  goiYTimer = setTimeout(async () => {
    const res: any = await api.get(`/huyet-vi/lite?limit=8&q=${encodeURIComponent(q)}`)
    goiYHuyet.value = (res?.data ?? []).filter((h: HuyetViLite) => !form.value.huyet.some((x) => x.idHuyet === h.idHuyet))
  }, 220)
})

function themHuyet(h: HuyetViLite) {
  form.value.huyet.push({ idHuyet: h.idHuyet, ten_huyet: h.ten_huyet || '', ma_huyet: h.ma_huyet || '', vai_tro_huyet: '' })
  timHuyetTu.value = ''
  goiYHuyet.value = []
}
function boHuyetKhoiForm(i: number) {
  form.value.huyet.splice(i, 1)
}
function dichChuyen(i: number, delta: number) {
  const j = i + delta
  const arr = form.value.huyet
  if (j < 0 || j >= arr.length) return
  const tam = arr[i]
  const kia = arr[j]
  if (!tam || !kia) return
  arr[i] = kia
  arr[j] = tam
}

async function luu() {
  formError.value = null
  const ten = form.value.ten.trim()
  if (!ten) {
    formError.value = 'Thiếu tên bộ huyệt.'
    return
  }
  if (form.value.huyet.length < 2) {
    formError.value = 'Một bộ huyệt cần ít nhất 2 huyệt — nếu chỉ 1 huyệt thì đó là dữ liệu của tab Huyệt Vị, không phải quan hệ.'
    return
  }
  isSubmitting.value = true
  try {
    const payload = {
      ten,
      loai: form.value.loai,
      ghi_chu: form.value.ghi_chu.trim() || null,
      huyet: form.value.huyet.map((h, i) => ({ id_huyet: h.idHuyet, thu_tu: i, vai_tro_huyet: h.vai_tro_huyet.trim() || null })),
    }
    if (editingId.value != null) await api.put(`/phac-do-chuan/${editingId.value}`, payload)
    else await api.post('/phac-do-chuan', payload)
    showModal.value = false
    await taiDanhSach()
  } catch (err: any) {
    formError.value = 'Lỗi khi lưu: ' + (err.message || String(err))
  } finally {
    isSubmitting.value = false
  }
}

function confirmDelete(b: BoHuyet) {
  deletingItem.value = b
  showDeleteConfirm.value = true
}
async function xoaThat() {
  if (!deletingItem.value) return
  isSubmitting.value = true
  try {
    await api.delete(`/phac-do-chuan/${deletingItem.value.id}`)
    showDeleteConfirm.value = false
    deletingItem.value = null
    await taiDanhSach()
  } catch (err: any) {
    error.value = 'Lỗi khi xoá: ' + (err.message || String(err))
  } finally {
    isSubmitting.value = false
  }
}

function xemBoCuaHuyet(idHuyet: number) {
  router.push({ query: { tab: 'phac-do', huyet: String(idHuyet) } })
}

function inBo(b: BoHuyet) {
  moPhieuInBoHuyet(
    router,
    b.ten,
    b.huyetDong.map((h) => ({ ma_huyet: h.huyetVi?.ma_huyet, ten_huyet: h.huyetVi?.ten_huyet, vai_tro: h.vai_tro_huyet })),
  )
}
function xem3D(maHuyet: string | null | undefined) {
  moXem3D(router, maHuyet)
}
function huyetLabel(h: HuyetViLite | null | undefined): string {
  if (!h) return '—'
  return `${h.ten_huyet || ''}${h.ma_huyet ? ` (${h.ma_huyet})` : ''}`
}
</script>

<template>
  <div class="management-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Bộ Huyệt</h1>
        <p class="page-subtitle">
          Quan hệ giữa các huyệt — huyệt này kết hợp với huyệt nào, đứng trong nhóm nào thì làm được việc gì.
          Khác tab Huyệt Vị (tra cứu huyệt đơn lẻ).
        </p>
      </div>
      <button type="button" class="btn-primary" @click="openCreateModal">+ Thêm bộ huyệt</button>
    </div>

    <div v-if="locTheoHuyet" class="loc-huyet-banner">
      Đang lọc theo huyệt: <b>{{ locTheoHuyet.ten }}</b> — {{ danhSach.length }} bộ chứa huyệt này.
      <button type="button" class="loc-huyet-clear" @click="boLocHuyet">✕ Bỏ lọc</button>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải dữ liệu...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary mt-4" @click="taiDanhSach">Thử lại</button>
    </div>

    <div v-else>
      <div v-if="!locTheoHuyet" class="toolbar">
        <label class="search-wrap">
          <span class="search-label">Tìm kiếm</span>
          <input v-model="timKiem" type="search" class="search-input" placeholder="Tìm theo tên bộ, ghi chú..." autocomplete="off" />
        </label>
        <label class="filter-wrap">
          <span class="search-label">Loại bộ huyệt</span>
          <select v-model="locLoai" class="search-input">
            <option value="">— Tất cả —</option>
            <option value="phoi_huyet_kinh_dien">Phối huyệt kinh điển</option>
            <option value="bai_thuoc_tuong_duong">Bài thuốc tương đương</option>
            <option value="chung_benh">Bệnh chứng</option>
          </select>
        </label>
        <span class="toolbar-count">{{ filteredList.length }} / {{ danhSach.length }} bộ</span>
      </div>

      <div v-if="filteredList.length === 0" class="empty-state">Chưa có bộ huyệt nào khớp.</div>

      <div class="bo-grid">
        <div v-for="b in filteredList" :key="b.id" class="bo-card">
          <div class="bo-card__head">
            <span class="chip" :style="{ background: loaiMau(b.loai) + '1a', color: loaiMau(b.loai), borderColor: loaiMau(b.loai) + '55' }">
              {{ loaiLabel(b.loai) }}
            </span>
            <div class="row-actions">
              <button type="button" class="btn-action btn-in" title="In phiếu huyệt cho cả bộ này" @click="inBo(b)">🖶 In</button>
              <button type="button" class="btn-action btn-edit" @click="openEditModal(b)">Sửa</button>
              <button type="button" class="btn-action btn-delete" @click="confirmDelete(b)">Xoá</button>
            </div>
          </div>
          <h3 class="bo-card__ten">{{ b.ten }}</h3>
          <p v-if="b.ghi_chu" class="bo-card__ghichu">{{ b.ghi_chu }}</p>
          <div class="bo-card__huyet">
            <span v-for="h in b.huyetDong.slice().sort((x, y) => x.thuTu - y.thuTu)" :key="h.id" class="huyet-chip">
              <button
                type="button"
                class="huyet-chip__main"
                :title="'Xem tất cả bộ chứa huyệt ' + huyetLabel(h.huyetVi)"
                @click="xemBoCuaHuyet(h.idHuyet)"
              >
                <b>{{ h.huyetVi?.ten_huyet || '—' }}</b>
                <span class="huyet-chip__ma">{{ h.huyetVi?.ma_huyet }}</span>
                <span v-if="h.vai_tro_huyet" class="huyet-chip__vaitro">{{ h.vai_tro_huyet }}</span>
              </button>
              <button type="button" class="huyet-chip__3d" title="Xem huyệt này trên đồ hình 3D" @click="xem3D(h.huyetVi?.ma_huyet)">3D</button>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Thêm/Sửa -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal modal--wide">
        <div class="modal-header">
          <h3>{{ editingId != null ? 'Sửa bộ huyệt' : 'Thêm bộ huyệt' }}</h3>
          <button type="button" class="modal-close" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="formError" class="form-error">{{ formError }}</div>
          <div class="form-grid">
            <label class="field field--full">
              <span>Tên bộ huyệt</span>
              <input v-model="form.ten" type="text" class="input" placeholder="VD: Nguyên-Lạc: Phế chủ — Đại Trường khách" />
            </label>
            <label class="field">
              <span>Loại</span>
              <select v-model="form.loai" class="input">
                <option value="phoi_huyet_kinh_dien">Phối huyệt kinh điển</option>
                <option value="bai_thuoc_tuong_duong">Bài thuốc tương đương</option>
                <option value="chung_benh">Bệnh chứng</option>
              </select>
            </label>
            <label class="field field--full">
              <span>Ghi chú / công năng cả bộ</span>
              <textarea v-model="form.ghi_chu" class="textarea" rows="2" placeholder="Công năng khi các huyệt này đứng chung"></textarea>
            </label>

            <div class="field field--full">
              <div class="field-head">
                <span>Thành phần huyệt</span>
                <span class="field-count">{{ form.huyet.length }} huyệt</span>
              </div>
              <div class="huyet-picker-search">
                <input v-model="timHuyetTu" type="text" class="input input--sm" placeholder="Gõ tên/mã huyệt để thêm..." />
                <ul v-if="goiYHuyet.length" class="huyet-goiy">
                  <li v-for="h in goiYHuyet" :key="h.idHuyet" @mousedown.prevent="themHuyet(h)">
                    <b>{{ h.ten_huyet }}</b> <span class="huyet-goiy__ma">{{ h.ma_huyet }}</span>
                  </li>
                </ul>
              </div>
              <div class="huyet-lines">
                <div v-for="(h, i) in form.huyet" :key="h.idHuyet" class="huyet-line">
                  <span class="huyet-line__stt">{{ i + 1 }}</span>
                  <span class="huyet-line__ten"><b>{{ h.ten_huyet }}</b> <span class="huyet-line__ma">{{ h.ma_huyet }}</span></span>
                  <input v-model="h.vai_tro_huyet" type="text" class="input input--sm" placeholder="Vai trò (VD: Nguyên/chủ, Quân...)" />
                  <button type="button" class="huyet-line__btn" :disabled="i === 0" @click="dichChuyen(i, -1)" title="Lên">↑</button>
                  <button type="button" class="huyet-line__btn" :disabled="i === form.huyet.length - 1" @click="dichChuyen(i, 1)" title="Xuống">↓</button>
                  <button type="button" class="huyet-line__btn huyet-line__btn--xoa" @click="boHuyetKhoiForm(i)" title="Bỏ">✕</button>
                </div>
                <p v-if="!form.huyet.length" class="muted">Chưa có huyệt nào — gõ ở trên để thêm.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="closeModal">Huỷ</button>
          <button type="button" class="btn-primary" :disabled="isSubmitting" @click="luu">
            {{ isSubmitting ? 'Đang lưu…' : 'Lưu' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Xác nhận xoá -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal modal--sm">
        <div class="modal-header">
          <h3>Xác nhận xoá</h3>
          <button type="button" class="modal-close" @click="showDeleteConfirm = false">✕</button>
        </div>
        <div class="modal-body">
          Xoá bộ huyệt <strong>{{ deletingItem?.ten }}</strong>? Không ảnh hưởng tới dữ liệu từng huyệt riêng lẻ.
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="showDeleteConfirm = false">Huỷ</button>
          <button type="button" class="btn-danger" :disabled="isSubmitting" @click="xoaThat">
            {{ isSubmitting ? 'Đang xoá…' : 'Xoá' }}
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
  display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4);
  flex-wrap: wrap; margin-bottom: var(--space-6); padding-bottom: var(--space-4);
  border-bottom: 2px solid var(--brown-100);
}
.header-content { flex: 1; min-width: 200px; }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--brown-800); margin-bottom: var(--space-1); }
.page-subtitle { color: var(--gray-500); font-size: var(--font-size-md); max-width: 640px; }

.btn-primary { padding: var(--space-3) var(--space-5); background: var(--brown-600); color: var(--white); border: none; border-radius: var(--radius-md); font-weight: 600; cursor: pointer; transition: background var(--transition-fast); }
.btn-primary:hover { background: var(--brown-700); }
.btn-primary:disabled { opacity: 0.6; cursor: default; }
.btn-secondary { padding: var(--space-3) var(--space-5); background: var(--white); color: var(--gray-700); border: 1px solid var(--gray-300); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; }
.btn-secondary:hover { background: var(--gray-50); }
.btn-danger { padding: var(--space-3) var(--space-5); background: var(--danger); color: var(--white); border: none; border-radius: var(--radius-md); font-weight: 600; cursor: pointer; }
.mt-4 { margin-top: var(--space-4); }

.toolbar { display: flex; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-4); }
.search-wrap, .filter-wrap { display: flex; flex-direction: column; gap: var(--space-1); flex: 1; min-width: 200px; }
.search-wrap { max-width: 380px; }
.filter-wrap { max-width: 240px; flex: 0 1 240px; }
.search-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.04em; }
.search-input { padding: var(--space-2) var(--space-3); border: 1px solid var(--gray-200); border-radius: var(--radius-md); font-size: var(--font-size-md); font-family: inherit; }
.toolbar-count { font-size: var(--font-size-sm); color: var(--gray-500); font-weight: 600; margin-left: auto; }

.loc-huyet-banner { display: flex; align-items: center; gap: 10px; margin-bottom: var(--space-4); padding: 10px 14px; background: var(--brown-50); border: 1px solid var(--brown-200); border-radius: var(--radius-md); font-size: 13.5px; color: var(--brown-800); }
.loc-huyet-clear { margin-left: auto; border: 1px solid var(--brown-300); background: var(--white); color: var(--brown-700); border-radius: 999px; padding: 3px 12px; font-size: 12.5px; cursor: pointer; }

.loading-state { display: flex; flex-direction: column; align-items: center; padding: var(--space-12) 0; color: var(--brown-600); }
.spinner { width: 32px; height: 32px; border: 3px solid var(--gray-200); border-top-color: var(--brown-500); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-state { text-align: center; padding: var(--space-8); color: var(--danger); background: var(--danger-bg); border-radius: var(--radius-lg); }
.empty-state { text-align: center; padding: var(--space-8); color: var(--gray-500); }

.bo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; }
.bo-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-lg); padding: 14px 16px; box-shadow: var(--shadow-sm); }
.bo-card__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
.bo-card__ten { font-size: 15px; font-weight: 700; color: var(--brown-900); margin: 0 0 4px; }
.bo-card__ghichu { font-size: 12.5px; color: var(--gray-500); margin: 0 0 10px; line-height: 1.4; }
.bo-card__huyet { display: flex; flex-wrap: wrap; gap: 6px; }

.huyet-chip {
  display: inline-flex; align-items: stretch; border-radius: 999px; overflow: hidden;
  border: 1px solid var(--gray-200); background: var(--surface-2);
}
.huyet-chip:hover { border-color: var(--brown-400); }
.huyet-chip__main {
  display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px; border: 0; background: none;
  cursor: pointer; font: inherit; font-size: 12.5px; color: inherit;
}
.huyet-chip__main:hover { background: var(--brown-50); }
.huyet-chip__ma { color: var(--gray-500); font-family: ui-monospace, monospace; font-size: 11px; }
.huyet-chip__vaitro { color: var(--brown-700); font-size: 11px; background: var(--brown-100); padding: 1px 6px; border-radius: 999px; }
.huyet-chip__3d {
  border: 0; border-left: 1px solid var(--gray-200); background: var(--brown-100); color: var(--brown-700);
  font-size: 9.5px; font-weight: 700; padding: 0 6px; cursor: pointer; letter-spacing: 0.02em;
}
.huyet-chip__3d:hover { background: var(--brown-600); color: var(--white); }

.chip { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11.5px; font-weight: 700; border: 1px solid transparent; }

.row-actions { display: inline-flex; gap: 6px; }
.btn-action { padding: 3px 9px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); border: 1px solid var(--gray-200); background: var(--white); cursor: pointer; }
.btn-in { border-color: var(--brown-300); color: var(--brown-700); }
.btn-in:hover { background: var(--brown-50); border-color: var(--brown-500); }
.btn-edit:hover { background: var(--brown-50); border-color: var(--brown-400); color: var(--brown-700); }
.btn-delete { color: var(--danger); }
.btn-delete:hover { background: var(--danger-bg); border-color: var(--danger-border); }

.muted { color: var(--gray-400); font-style: italic; font-size: 13px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; z-index: 200; padding: var(--space-4); }
.modal { background: var(--white); border-radius: var(--radius-xl); width: 100%; max-width: 640px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15); overflow: hidden; }
.modal--wide { max-width: 720px; }
.modal--sm { max-width: 440px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--gray-100); }
.modal-header h3 { margin: 0; font-size: var(--font-size-lg); font-weight: 700; color: var(--brown-800); }
.modal-close { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--gray-500); }
.modal-body { padding: var(--space-5); overflow-y: auto; flex: 1; }
.modal-footer { display: flex; gap: var(--space-2); justify-content: flex-end; padding: var(--space-4) var(--space-5); border-top: 1px solid var(--gray-100); background: var(--gray-50); }
.form-error { background: var(--danger-bg); color: var(--danger); border: 1px solid var(--danger-border); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); margin-bottom: var(--space-3); font-size: var(--font-size-sm); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.field { display: flex; flex-direction: column; gap: 4px; }
.field--full { grid-column: 1 / -1; }
.field > span, .field-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-700); }
.field-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-2); }
.field-count { font-size: 11px; font-weight: 600; color: var(--brown-600); background: var(--brown-50); padding: 1px 8px; border-radius: 999px; }
.input, .textarea { width: 100%; padding: var(--space-2) var(--space-3); border: 1px solid var(--gray-200); border-radius: var(--radius-md); font-size: var(--font-size-md); font-family: inherit; }
.input:focus, .textarea:focus { outline: none; border-color: var(--brown-500); box-shadow: var(--focus-ring); }
.textarea { resize: vertical; min-height: 60px; }
.input--sm { padding: 6px 10px; font-size: 13px; }

.huyet-picker-search { position: relative; margin-bottom: 8px; }
.huyet-goiy { position: absolute; z-index: 5; left: 0; right: 0; top: 100%; margin: 2px 0 0; padding: 4px 0; list-style: none; background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-md); box-shadow: 0 8px 20px rgba(0,0,0,0.12); max-height: 200px; overflow: auto; }
.huyet-goiy li { padding: 5px 10px; cursor: pointer; font-size: 13px; }
.huyet-goiy li:hover { background: var(--brown-50); }
.huyet-goiy__ma { color: var(--gray-500); font-size: 11px; margin-left: 4px; }

.huyet-lines { display: flex; flex-direction: column; gap: 6px; }
.huyet-line { display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: var(--surface-2); border-radius: var(--radius-md); }
.huyet-line__stt { width: 18px; color: var(--gray-400); font-size: 12px; text-align: right; }
.huyet-line__ten { width: 150px; flex-shrink: 0; font-size: 13px; }
.huyet-line__ma { color: var(--gray-500); font-size: 11px; font-family: ui-monospace, monospace; }
.huyet-line input.input--sm { flex: 1; }
.huyet-line__btn { border: 1px solid var(--gray-200); background: var(--white); border-radius: 5px; width: 22px; height: 22px; cursor: pointer; font-size: 12px; color: var(--gray-600); flex-shrink: 0; }
.huyet-line__btn:disabled { opacity: 0.35; cursor: default; }
.huyet-line__btn--xoa { color: var(--danger); }

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .field--full { grid-column: 1; }
  .management-page { padding: var(--space-4); }
}
</style>
