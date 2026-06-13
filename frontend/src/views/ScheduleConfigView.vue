<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'

interface ClinicConfig {
  id: number
  openTime: string
  closeTime: string
  breakStart: string | null
  breakEnd: string | null
  slotDurationMinutes: number
}

interface DayOverride {
  id?: number
  date: string
  isClosed: boolean
  openTime: string | null
  closeTime: string | null
  breakStart: string | null
  breakEnd: string | null
  note: string | null
}

const router = useRouter()

const config = ref<ClinicConfig | null>(null)
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const message = ref<string | null>(null)

const CLINIC_TZ = 'Asia/Ho_Chi_Minh'
function todayYMD(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10))
  return new Date(y || 1970, (m || 1) - 1, d || 1)
}

const overrides = ref<DayOverride[]>([])
const overrideRangeFrom = ref<string>(todayYMD())
const overrideRangeTo = ref<string>(formatYMD(addDays(parseYMD(todayYMD()), 60)))

const editor = ref<DayOverride | null>(null)

onMounted(async () => {
  await Promise.all([loadConfig(), loadOverrides()])
})

function formatYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${da}`
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

async function loadConfig() {
  isLoading.value = true
  error.value = null
  try {
    config.value = await api.get<ClinicConfig>('/clinic-schedule/config')
  } catch (err: any) {
    error.value = 'Lỗi tải cấu hình: ' + err.message
  } finally {
    isLoading.value = false
  }
}

async function loadOverrides() {
  try {
    const list = await api.get<DayOverride[]>(
      `/clinic-schedule/overrides?from=${overrideRangeFrom.value}&to=${overrideRangeTo.value}`,
    )
    overrides.value = list || []
  } catch (err: any) {
    error.value = 'Lỗi tải override: ' + err.message
  }
}

async function saveConfig() {
  if (!config.value) return
  isSaving.value = true
  error.value = null
  message.value = null
  try {
    config.value = await api.put<ClinicConfig>(
      '/clinic-schedule/config',
      {
        openTime: config.value.openTime,
        closeTime: config.value.closeTime,
        breakStart: config.value.breakStart || null,
        breakEnd: config.value.breakEnd || null,
        slotDurationMinutes: Number(config.value.slotDurationMinutes),
      },
    )
    message.value = 'Đã lưu cấu hình'
    setTimeout(() => (message.value = null), 2500)
  } catch (err: any) {
    error.value = 'Lỗi lưu: ' + err.message
  } finally {
    isSaving.value = false
  }
}

function newOverride() {
  editor.value = {
    date: todayYMD(),
    isClosed: false,
    openTime: null,
    closeTime: null,
    breakStart: null,
    breakEnd: null,
    note: null,
  }
}

function editOverride(o: DayOverride) {
  editor.value = { ...o }
}

function closeEditor() {
  editor.value = null
}

async function saveOverride() {
  if (!editor.value) return
  isSaving.value = true
  error.value = null
  try {
    const o = editor.value
    await api.put<DayOverride>(`/clinic-schedule/overrides/${o.date}`, {
      isClosed: o.isClosed,
      openTime: o.openTime || null,
      closeTime: o.closeTime || null,
      breakStart: o.breakStart || null,
      breakEnd: o.breakEnd || null,
      note: o.note || null,
    })
    closeEditor()
    await loadOverrides()
    message.value = 'Đã lưu override'
    setTimeout(() => (message.value = null), 2500)
  } catch (err: any) {
    error.value = 'Lỗi lưu: ' + err.message
  } finally {
    isSaving.value = false
  }
}

async function deleteOverride(date: string) {
  if (!confirm(`Xoá override cho ngày ${date}?`)) return
  try {
    await api.delete(`/clinic-schedule/overrides/${date}`)
    await loadOverrides()
  } catch (err: any) {
    error.value = 'Lỗi xoá: ' + err.message
  }
}
</script>

<template>
  <div class="config-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Cấu hình giờ khám</h1>
        <p class="page-subtitle">Thiết lập giờ mở cửa, slot khám và ngày đặc biệt</p>
      </div>
      <button class="btn btn-ghost" @click="router.push({ name: 'appointments' })">
        ← Quay lại Lịch Trị Liệu
      </button>
    </div>

    <div v-if="error" class="alert-error">{{ error }}</div>
    <div v-if="message" class="alert-success">{{ message }}</div>

    <div v-if="isLoading" class="loading">Đang tải...</div>

    <div v-else class="grid">
      <!-- Default config -->
      <section class="card">
        <h2 class="card-title">Cấu hình mặc định</h2>
        <p class="card-hint">
          Áp dụng cho mọi ngày trừ khi có override riêng. Mỗi ca khám = số phút cấu hình.
        </p>

        <div v-if="config" class="form">
          <div class="row-2">
            <div class="form-group">
              <label>Giờ mở cửa</label>
              <input type="time" v-model="config.openTime" class="input" />
            </div>
            <div class="form-group">
              <label>Giờ đóng cửa</label>
              <input type="time" v-model="config.closeTime" class="input" />
            </div>
          </div>

          <div class="row-2">
            <div class="form-group">
              <label>Nghỉ trưa từ (tuỳ chọn)</label>
              <input type="time" v-model="config.breakStart" class="input" />
            </div>
            <div class="form-group">
              <label>Nghỉ trưa đến</label>
              <input type="time" v-model="config.breakEnd" class="input" />
            </div>
          </div>

          <div class="form-group">
            <label>Thời lượng mỗi vé (phút)</label>
            <input
              type="number"
              min="5"
              max="240"
              v-model.number="config.slotDurationMinutes"
              class="input"
            />
            <small class="hint">Mặc định 45 phút theo yêu cầu. Đổi sẽ ảnh hưởng các ngày sinh vé sau khi lưu.</small>
          </div>

          <button class="btn btn-primary" :disabled="isSaving" @click="saveConfig">
            {{ isSaving ? 'Đang lưu...' : 'Lưu cấu hình' }}
          </button>
        </div>
      </section>

      <!-- Overrides -->
      <section class="card">
        <div class="card-head">
          <div>
            <h2 class="card-title">Ngày đặc biệt</h2>
            <p class="card-hint">Ghi đè cho 1 ngày: nghỉ lễ, đổi giờ mở/đóng riêng.</p>
          </div>
          <button class="btn btn-primary" @click="newOverride">+ Thêm</button>
        </div>

        <div class="range-filter">
          <label>Từ</label>
          <input type="date" v-model="overrideRangeFrom" class="input" />
          <label>Đến</label>
          <input type="date" v-model="overrideRangeTo" class="input" />
          <button class="btn btn-secondary btn-sm" @click="loadOverrides">Tải lại</button>
        </div>

        <div v-if="overrides.length === 0" class="empty">
          <p>Chưa có override nào trong khoảng đã chọn.</p>
        </div>
        <ul v-else class="override-list">
          <li v-for="o in overrides" :key="o.date" class="override-item">
            <div class="override-info">
              <strong>{{ o.date }}</strong>
              <span v-if="o.isClosed" class="badge badge-danger">Nghỉ cả ngày</span>
              <span v-else class="override-times">
                {{ o.openTime || '(theo mặc định)' }} – {{ o.closeTime || '(theo mặc định)' }}
                <span v-if="o.breakStart && o.breakEnd">· Nghỉ {{ o.breakStart }}–{{ o.breakEnd }}</span>
              </span>
              <span v-if="o.note" class="override-note">{{ o.note }}</span>
            </div>
            <div class="override-actions">
              <button class="btn btn-ghost btn-sm" @click="editOverride(o)">Sửa</button>
              <button class="btn btn-danger btn-sm" @click="deleteOverride(o.date)">Xoá</button>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <!-- Override editor modal -->
    <div v-if="editor" class="modal-overlay" @click.self="closeEditor">
      <div class="modal">
        <h3 class="modal-title">Override cho ngày cụ thể</h3>

        <div class="form-group">
          <label>Ngày</label>
          <input type="date" v-model="editor.date" class="input" />
        </div>

        <div class="form-group toggle-group">
          <label>
            <input type="checkbox" v-model="editor.isClosed" />
            Đóng cửa cả ngày
          </label>
        </div>

        <template v-if="!editor.isClosed">
          <div class="row-2">
            <div class="form-group">
              <label>Giờ mở (để trống = dùng mặc định)</label>
              <input type="time" v-model="editor.openTime" class="input" />
            </div>
            <div class="form-group">
              <label>Giờ đóng</label>
              <input type="time" v-model="editor.closeTime" class="input" />
            </div>
          </div>
          <div class="row-2">
            <div class="form-group">
              <label>Nghỉ trưa từ</label>
              <input type="time" v-model="editor.breakStart" class="input" />
            </div>
            <div class="form-group">
              <label>Nghỉ trưa đến</label>
              <input type="time" v-model="editor.breakEnd" class="input" />
            </div>
          </div>
        </template>

        <div class="form-group">
          <label>Ghi chú</label>
          <input v-model="editor.note" class="input" placeholder="Vd: Tết Nguyên Đán" />
        </div>

        <div class="modal-actions">
          <button class="btn btn-ghost" @click="closeEditor">Huỷ</button>
          <button class="btn btn-primary" :disabled="isSaving" @click="saveOverride">
            {{ isSaving ? 'Đang lưu...' : 'Lưu' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-page { animation: fadeIn .3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-3); flex-wrap: wrap; margin-bottom: var(--space-5); padding-bottom: var(--space-4); border-bottom: 2px solid var(--brown-100); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--brown-800); margin-bottom: 4px; }
.page-subtitle { color: var(--gray-500); font-size: var(--font-size-md); }

.alert-error { padding: var(--space-3); background: var(--danger-bg); color: var(--danger-fg); border-radius: var(--radius-md); margin-bottom: var(--space-4); }
.alert-success { padding: var(--space-3); background: var(--success-bg); color: var(--success-fg); border-radius: var(--radius-md); margin-bottom: var(--space-4); }

.loading { padding: var(--space-6); text-align: center; color: var(--gray-500); }

.grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); }
@media(max-width: 1100px) { .grid { grid-template-columns: 1fr; } }

.card { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-sm); }
.card-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4); gap: var(--space-3); }
.card-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--brown-800); }
.card-hint { font-size: var(--font-size-sm); color: var(--gray-500); margin-top: 2px; }

.form { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-4); }
.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group label { font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-700); }
.input { padding: 8px 10px; border: 1px solid var(--gray-300); border-radius: var(--radius-md); font: inherit; }
.input:focus { outline: none; border-color: var(--brown-500); }
.hint { color: var(--gray-500); font-size: var(--font-size-xs); }

.range-filter { display: flex; gap: 8px; align-items: center; margin: var(--space-3) 0; flex-wrap: wrap; }
.range-filter label { font-size: var(--font-size-sm); color: var(--gray-600); font-weight: 600; }

.override-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-2); }
.override-item { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3); border: 1px solid var(--gray-200); border-radius: var(--radius-md); gap: var(--space-3); }
.override-info { display: flex; flex-direction: column; gap: 4px; }
.override-times { font-size: var(--font-size-sm); color: var(--gray-700); }
.override-note { font-size: var(--font-size-sm); color: var(--gray-500); font-style: italic; }
.override-actions { display: flex; gap: 4px; }

.empty { padding: var(--space-4); text-align: center; color: var(--gray-500); font-size: var(--font-size-sm); }

.toggle-group label { display: flex; align-items: center; gap: 8px; font-weight: 600; }

.btn { padding: 8px 14px; border-radius: var(--radius-md); font-weight: 600; font-size: var(--font-size-sm); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn-primary { background: var(--brown-600); color: var(--white); }
.btn-primary:hover:not(:disabled) { background: var(--brown-700); }
.btn-secondary { background: var(--white); color: var(--brown-700); border: 1px solid var(--brown-300); }
.btn-secondary:hover:not(:disabled) { background: var(--brown-50); }
.btn-ghost { background: transparent; color: var(--gray-600); }
.btn-ghost:hover:not(:disabled) { background: var(--gray-100); }
.btn-danger { background: var(--danger); color: var(--white); }
.btn-danger:hover:not(:disabled) { background: var(--danger-fg); }
.btn-sm { padding: 4px 10px; font-size: var(--font-size-xs); }

.badge { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
.badge-danger { background: var(--danger-bg); color: var(--danger-fg); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal { background: var(--white); border-radius: var(--radius-xl); padding: var(--space-5); width: 520px; max-width: 92vw; box-shadow: var(--shadow-xl); }
.modal-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--brown-800); margin-bottom: var(--space-4); }
.modal-actions { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-4); }
</style>
