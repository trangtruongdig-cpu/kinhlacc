<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import type { Patient } from '@/stores/patient'

type SlotStatus = 'OPEN' | 'CLOSED' | 'BOOKED' | 'COMPLETED' | 'CANCELLED'

interface AppointmentSlot {
  id: number
  slotDate: string
  slotTime: string
  status: SlotStatus
  patientId: number | null
  reason: string | null
  notes: string | null
}

interface EffectiveSchedule {
  isClosed: boolean
  openTime: string
  closeTime: string
  breakStart: string | null
  breakEnd: string | null
  slotDurationMinutes: number
}

type DaySummary = Record<SlotStatus, number>

const router = useRouter()

// Tính "hôm nay" theo timezone Việt Nam (Asia/Ho_Chi_Minh) để không lệch
// nếu trình duyệt đang chạy ở UTC hoặc lệch giờ máy.
const CLINIC_TZ = 'Asia/Ho_Chi_Minh'
function todayYMD(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

const currentDate = ref(parseYMD(todayYMD()))
const selectedDate = ref<string>(todayYMD())

const isLoadingMonth = ref(false)
const isLoadingDay = ref(false)
const error = ref<string | null>(null)
const actionLoading = ref(false)
const actionSlotId = ref<number | null>(null)
const actionType = ref<string | null>(null)

const slotsByDate = ref<Record<string, AppointmentSlot[]>>({})
const summaryByDate = ref<Record<string, DaySummary>>({})
const effectiveSchedule = ref<EffectiveSchedule | null>(null)
const patientsMap = ref<Record<number, Patient>>({})
const patientsList = ref<Patient[]>([])

const bookModal = ref<{ slot: AppointmentSlot } | null>(null)
const bookPatientId = ref<number | null>(null)
const bookReason = ref('')
const bookNotes = ref('')
const bookSearch = ref('')

onMounted(async () => {
  await Promise.all([loadMonth(), loadPatients()])
  await loadDay(selectedDate.value)
})

watch(currentDate, async () => {
  await loadMonth()
})

watch(selectedDate, async (val) => {
  await loadDay(val)
})

function formatYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${da}`
}

// `new Date('YYYY-MM-DD')` parse như UTC midnight nên bị lệch 1 ngày
// trong các timezone âm. Luôn parse về local để khớp với formatYMD.
function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10))
  return new Date(y || 1970, (m || 1) - 1, d || 1)
}

function monthRange(date: Date): { from: string; to: string } {
  const y = date.getFullYear()
  const m = date.getMonth()
  const first = new Date(y, m, 1)
  const last = new Date(y, m + 1, 0)
  // mở rộng để bao cả các ô tháng trước/sau trong grid
  const startWeekday = first.getDay() === 0 ? 6 : first.getDay() - 1
  const gridStart = new Date(y, m, 1 - startWeekday)
  const gridEnd = new Date(gridStart)
  gridEnd.setDate(gridStart.getDate() + 41)
  return { from: formatYMD(gridStart), to: formatYMD(gridEnd) }
}

async function loadMonth() {
  isLoadingMonth.value = true
  error.value = null
  try {
    const { from, to } = monthRange(currentDate.value)
    const summary = await api.get<Record<string, DaySummary>>(
      `/appointment-slots/summary?from=${from}&to=${to}`,
    )
    summaryByDate.value = summary || {}
  } catch (err: any) {
    console.error(err)
    error.value = 'Lỗi tải dữ liệu: ' + err.message
  } finally {
    isLoadingMonth.value = false
  }
}

async function loadDay(date: string) {
  isLoadingDay.value = true
  try {
    const [slots, eff] = await Promise.all([
      api.get<AppointmentSlot[]>(`/appointment-slots?date=${date}`),
      api.get<EffectiveSchedule>(`/clinic-schedule/effective/${date}`),
    ])
    slotsByDate.value[date] = (slots || []).map(normalizeSlot)
    effectiveSchedule.value = eff
  } catch (err: any) {
    console.error(err)
    error.value = 'Lỗi tải ngày: ' + err.message
  } finally {
    isLoadingDay.value = false
  }
}

function normalizeSlot(s: AppointmentSlot): AppointmentSlot {
  return { ...s, slotTime: (s.slotTime || '').slice(0, 5) }
}

async function loadPatients() {
  try {
    const res: any = await api.get('/patients?limit=1000')
    const list: Patient[] = Array.isArray(res) ? res : res.data || []
    patientsList.value = list
    patientsMap.value = list.reduce(
      (acc, p) => {
        acc[p.id] = p
        return acc
      },
      {} as Record<number, Patient>,
    )
  } catch (err: any) {
    console.error('Lỗi tải bệnh nhân:', err)
  }
}

const daySlots = computed<AppointmentSlot[]>(
  () => slotsByDate.value[selectedDate.value] || [],
)

const dayStats = computed<DaySummary>(() => {
  const base: DaySummary = {
    OPEN: 0,
    CLOSED: 0,
    BOOKED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  }
  for (const s of daySlots.value) base[s.status]++
  return base
})

// --- Calendar grid ---
const monthGrid = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startWeekday = first.getDay() === 0 ? 6 : first.getDay() - 1
  const cells: { date: Date; ymd: string; inMonth: boolean }[] = []
  const prevLast = new Date(year, month, 0).getDate()
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevLast - i)
    cells.push({ date: d, ymd: formatYMD(d), inMonth: false })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i)
    cells.push({ date: d, ymd: formatYMD(d), inMonth: true })
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1]!.date
    const d = new Date(last)
    d.setDate(d.getDate() + 1)
    cells.push({ date: d, ymd: formatYMD(d), inMonth: false })
  }
  return cells
})

const calendarTitle = computed(() => {
  const m = currentDate.value.getMonth() + 1
  const y = currentDate.value.getFullYear()
  return `Tháng ${m}, ${y}`
})

function prevMonth() {
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() - 1)
  currentDate.value = d
}

function nextMonth() {
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() + 1)
  currentDate.value = d
}

function goToday() {
  const t = todayYMD()
  currentDate.value = parseYMD(t)
  selectedDate.value = t
}

function isToday(ymd: string) {
  return ymd === todayYMD()
}

// --- Actions ---
async function generateForDate() {
  if (!confirm('Sinh vé khám cho ngày ' + selectedDate.value + ' ?')) return
  actionLoading.value = true
  actionType.value = 'gen-day'
  try {
    const res = await api.post<{ created: number; total: number }>(
      `/clinic-schedule/generate/${selectedDate.value}`,
      {},
    )
    alert(`Đã sinh ${res.created} vé mới (tổng ${res.total} vé/ngày)`)
    await Promise.all([loadDay(selectedDate.value), loadMonth()])
  } catch (err: any) {
    alert('Lỗi: ' + err.message)
  } finally {
    actionLoading.value = false
    actionType.value = null
  }
}

async function generateForWeek() {
  const start = parseYMD(selectedDate.value)
  const day = start.getDay() === 0 ? 6 : start.getDay() - 1
  start.setDate(start.getDate() - day)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const from = formatYMD(start)
  const to = formatYMD(end)
  if (!confirm(`Sinh vé cho tuần ${from} → ${to}?`)) return
  actionLoading.value = true
  actionType.value = 'gen-week'
  try {
    const res = await api.post<{ date: string; created: number; total: number }[]>(
      `/clinic-schedule/generate-range?from=${from}&to=${to}`,
      {},
    )
    const total = res.reduce((s, r) => s + r.created, 0)
    alert(`Đã sinh ${total} vé mới trong tuần`)
    await Promise.all([loadDay(selectedDate.value), loadMonth()])
  } catch (err: any) {
    alert('Lỗi: ' + err.message)
  } finally {
    actionLoading.value = false
    actionType.value = null
  }
}

async function runSlotAction(
  slot: AppointmentSlot,
  type: 'close' | 'open' | 'cancel' | 'complete',
  endpoint: string,
) {
  actionLoading.value = true
  actionSlotId.value = slot.id
  actionType.value = type
  try {
    await api.put(`/appointment-slots/${slot.id}/${endpoint}`, {})
    await Promise.all([loadDay(selectedDate.value), loadMonth()])
  } catch (err: any) {
    alert('Lỗi: ' + err.message)
  } finally {
    actionLoading.value = false
    actionSlotId.value = null
    actionType.value = null
  }
}

async function closeSlot(slot: AppointmentSlot) {
  await runSlotAction(slot, 'close', 'close')
}

async function openSlot(slot: AppointmentSlot) {
  await runSlotAction(slot, 'open', 'open')
}

async function cancelSlot(slot: AppointmentSlot) {
  if (!confirm('Huỷ vé này?')) return
  await runSlotAction(slot, 'cancel', 'cancel')
}

async function completeSlot(slot: AppointmentSlot) {
  await runSlotAction(slot, 'complete', 'complete')
}

function isSlotBusy(slot: AppointmentSlot) {
  return actionSlotId.value === slot.id
}

function openBookModal(slot: AppointmentSlot) {
  bookModal.value = { slot }
  bookPatientId.value = null
  bookReason.value = ''
  bookNotes.value = ''
  bookSearch.value = ''
}

function closeBookModal() {
  bookModal.value = null
}

const bookPatientOptions = computed(() => {
  const q = bookSearch.value.trim().toLowerCase()
  if (!q) return patientsList.value.slice(0, 50)
  return patientsList.value
    .filter(
      (p) =>
        (p.fullName || '').toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q),
    )
    .slice(0, 50)
})

async function confirmBook() {
  if (!bookModal.value || !bookPatientId.value) {
    alert('Chọn bệnh nhân trước')
    return
  }
  actionLoading.value = true
  try {
    await api.post(`/appointment-slots/${bookModal.value.slot.id}/book`, {
      patientId: bookPatientId.value,
      reason: bookReason.value || undefined,
      notes: bookNotes.value || undefined,
    })
    closeBookModal()
    await Promise.all([loadDay(selectedDate.value), loadMonth()])
  } catch (err: any) {
    alert('Lỗi: ' + err.message)
  } finally {
    actionLoading.value = false
  }
}

function statusLabel(s: SlotStatus) {
  switch (s) {
    case 'OPEN':
      return 'Trống'
    case 'CLOSED':
      return 'Đóng'
    case 'BOOKED':
      return 'Đã đặt'
    case 'COMPLETED':
      return 'Hoàn thành'
    case 'CANCELLED':
      return 'Đã huỷ'
  }
}

function goToPatient(id: number) {
  router.push({ name: 'patient-detail', params: { id } })
}
</script>

<template>
  <div class="appointments-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Lịch Trị Liệu</h1>
        <p class="page-subtitle">Quản lý các lần trị liệu của bệnh nhân theo ngày</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="router.push({ name: 'schedule-config' })">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          Cấu hình giờ khám
        </button>
      </div>
    </div>

    <div v-if="error" class="alert-error">
      {{ error }}
      <button class="btn-link" @click="loadMonth">Thử lại</button>
    </div>

    <div class="layout">
      <!-- Calendar (left) -->
      <div class="calendar-card">
        <div class="cal-toolbar">
          <div class="cal-nav">
            <button class="btn-icon" :disabled="isLoadingMonth" @click="prevMonth"><span>‹</span></button>
            <button class="btn-today" :disabled="isLoadingMonth" @click="goToday">Hôm nay</button>
            <button class="btn-icon" :disabled="isLoadingMonth" @click="nextMonth"><span>›</span></button>
          </div>
          <div class="cal-title-wrap">
            <h2 class="cal-title">{{ calendarTitle }}</h2>
            <span v-if="isLoadingMonth" class="inline-spinner" aria-label="Đang tải"></span>
          </div>
        </div>

        <div class="progress-bar" :class="{ 'is-loading': isLoadingMonth }"></div>

        <div class="cal-header-row">
          <div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div><div>CN</div>
        </div>
        <div class="cal-grid" :class="{ 'is-loading': isLoadingMonth }">
          <div
            v-for="cell in monthGrid"
            :key="cell.ymd"
            class="cal-cell"
            :class="{
              'not-in-month': !cell.inMonth,
              'is-today': isToday(cell.ymd),
              'is-selected': cell.ymd === selectedDate,
            }"
            @click="selectedDate = cell.ymd"
          >
            <div class="cell-date">{{ cell.date.getDate() }}</div>
            <div class="cell-counts" v-if="summaryByDate[cell.ymd]">
              <span
                v-if="summaryByDate[cell.ymd]!.BOOKED > 0"
                class="chip chip-booked"
                title="Đã đặt"
              >{{ summaryByDate[cell.ymd]!.BOOKED }}</span>
              <span
                v-if="summaryByDate[cell.ymd]!.OPEN > 0"
                class="chip chip-open"
                title="Trống"
              >{{ summaryByDate[cell.ymd]!.OPEN }}</span>
              <span
                v-if="summaryByDate[cell.ymd]!.CLOSED > 0"
                class="chip chip-closed"
                title="Đóng"
              >{{ summaryByDate[cell.ymd]!.CLOSED }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Day panel (right) -->
      <div class="day-card">
        <div class="progress-bar" :class="{ 'is-loading': isLoadingDay }"></div>
        <div class="day-header">
          <h2 class="day-title">
            {{ parseYMD(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
            <span v-if="isLoadingDay" class="inline-spinner inline-spinner-dark" aria-label="Đang tải ngày"></span>
          </h2>
          <div v-if="effectiveSchedule" class="day-meta">
            <span v-if="effectiveSchedule.isClosed" class="badge badge-danger">Nghỉ</span>
            <template v-else>
              <span>Giờ: {{ effectiveSchedule.openTime }} – {{ effectiveSchedule.closeTime }}</span>
              <span v-if="effectiveSchedule.breakStart && effectiveSchedule.breakEnd">
                · Nghỉ trưa {{ effectiveSchedule.breakStart }}–{{ effectiveSchedule.breakEnd }}
              </span>
              <span>· Slot {{ effectiveSchedule.slotDurationMinutes }} phút</span>
            </template>
          </div>
        </div>

        <div class="day-stats">
          <div class="stat stat-open">
            <span class="stat-num">{{ dayStats.OPEN }}</span>
            <span class="stat-label">Trống</span>
          </div>
          <div class="stat stat-booked">
            <span class="stat-num">{{ dayStats.BOOKED }}</span>
            <span class="stat-label">Đã đặt</span>
          </div>
          <div class="stat stat-completed">
            <span class="stat-num">{{ dayStats.COMPLETED }}</span>
            <span class="stat-label">Hoàn thành</span>
          </div>
          <div class="stat stat-closed">
            <span class="stat-num">{{ dayStats.CLOSED }}</span>
            <span class="stat-label">Đóng</span>
          </div>
        </div>

        <div class="day-actions">
          <button
            class="btn btn-primary"
            :disabled="actionLoading || isLoadingDay"
            @click="generateForDate"
          >
            <span v-if="actionType === 'gen-day'" class="inline-spinner inline-spinner-light"></span>
            {{ actionType === 'gen-day' ? 'Đang sinh vé...' : 'Sinh vé cho ngày này' }}
          </button>
          <button
            class="btn btn-secondary"
            :disabled="actionLoading || isLoadingDay"
            @click="generateForWeek"
          >
            <span v-if="actionType === 'gen-week'" class="inline-spinner"></span>
            {{ actionType === 'gen-week' ? 'Đang sinh vé...' : 'Sinh vé cho cả tuần' }}
          </button>
        </div>

        <!-- Skeleton khi load ngày lần đầu -->
        <div v-if="isLoadingDay && daySlots.length === 0" class="slots-grid">
          <div v-for="i in 6" :key="'skel-' + i" class="slot-card slot-skeleton">
            <div class="skel-line skel-time"></div>
            <div class="skel-line skel-status"></div>
            <div class="skel-line skel-actions"></div>
          </div>
        </div>

        <div v-else-if="daySlots.length === 0" class="empty">
          <p>Chưa có vé nào cho ngày này.</p>
          <p class="empty-hint">Nhấn "Sinh vé cho ngày này" để tạo theo cấu hình.</p>
        </div>

        <div v-else class="slots-grid" :class="{ 'is-loading': isLoadingDay }">
          <div
            v-for="slot in daySlots"
            :key="slot.id"
            class="slot-card"
            :class="['slot-' + slot.status.toLowerCase(), { 'is-busy': isSlotBusy(slot) }]"
          >
            <div class="slot-head">
              <span class="slot-time">{{ slot.slotTime }}</span>
              <span class="slot-status">{{ statusLabel(slot.status) }}</span>
            </div>

            <div v-if="slot.patientId" class="slot-patient">
              <button
                class="patient-link"
                @click="goToPatient(slot.patientId!)"
              >{{ patientsMap[slot.patientId]?.fullName || 'BN #' + slot.patientId }}</button>
              <div v-if="patientsMap[slot.patientId]?.phone" class="slot-phone">
                📞 {{ patientsMap[slot.patientId]?.phone }}
              </div>
              <div v-if="slot.reason" class="slot-reason">{{ slot.reason }}</div>
            </div>

            <div class="slot-actions">
              <template v-if="slot.status === 'OPEN'">
                <button class="btn-sm btn-primary" :disabled="actionLoading" @click="openBookModal(slot)">Đặt</button>
                <button class="btn-sm btn-ghost" :disabled="actionLoading" @click="closeSlot(slot)">Đóng vé</button>
              </template>
              <template v-else-if="slot.status === 'CLOSED'">
                <button class="btn-sm btn-primary" :disabled="actionLoading" @click="openSlot(slot)">Mở lại</button>
              </template>
              <template v-else-if="slot.status === 'BOOKED'">
                <button class="btn-sm btn-success" :disabled="actionLoading" @click="completeSlot(slot)">Hoàn thành</button>
                <button class="btn-sm btn-danger" :disabled="actionLoading" @click="cancelSlot(slot)">Huỷ</button>
              </template>
              <template v-else-if="slot.status === 'CANCELLED'">
                <button class="btn-sm btn-primary" :disabled="actionLoading" @click="openSlot(slot)">Mở lại</button>
              </template>
            </div>

            <div v-if="isSlotBusy(slot)" class="slot-overlay">
              <span class="inline-spinner inline-spinner-dark"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Book modal -->
    <div v-if="bookModal" class="modal-overlay" @click.self="closeBookModal">
      <div class="modal">
        <h3 class="modal-title">Đặt vé {{ bookModal.slot.slotTime }} – {{ selectedDate }}</h3>
        <div class="form-group">
          <label>Tìm bệnh nhân</label>
          <input
            v-model="bookSearch"
            class="input"
            placeholder="Tên hoặc số điện thoại"
          />
          <select v-model="bookPatientId" class="input select-list" size="6">
            <option
              v-for="p in bookPatientOptions"
              :key="p.id"
              :value="p.id"
            >{{ p.fullName }} {{ p.phone ? '— ' + p.phone : '' }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Lý do khám (tuỳ chọn)</label>
          <input v-model="bookReason" class="input" />
        </div>
        <div class="form-group">
          <label>Ghi chú (tuỳ chọn)</label>
          <textarea v-model="bookNotes" class="input" rows="2"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="closeBookModal">Huỷ</button>
          <button class="btn btn-primary" :disabled="actionLoading || !bookPatientId" @click="confirmBook">
            <span v-if="actionLoading && bookModal" class="inline-spinner inline-spinner-light"></span>
            {{ actionLoading && bookModal ? 'Đang đặt...' : 'Đặt vé' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.appointments-page { animation: fadeIn .3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-5); padding-bottom: var(--space-4); border-bottom: 2px solid var(--brown-100); }
.page-header > div:first-child { flex: 1; min-width: 200px; }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--brown-800); margin-bottom: 4px; line-height: 1.2; }
.page-subtitle { color: var(--gray-500); font-size: var(--font-size-md); line-height: 1.4; }
.header-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }

.alert-error { padding: var(--space-3); background: var(--danger-bg); color: var(--danger-fg); border-radius: var(--radius-md); margin-bottom: var(--space-4); display: flex; justify-content: space-between; align-items: center; }
.btn-link { background: transparent; color: var(--danger-fg); text-decoration: underline; }

.layout { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); }
@media(max-width: 1100px) { .layout { grid-template-columns: 1fr; } }

.calendar-card, .day-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); overflow: hidden; }

.cal-toolbar { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--gray-200); background: var(--brown-50); }
.cal-nav { display: flex; align-items: center; gap: var(--space-2); }
.btn-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--brown-300); border-radius: var(--radius-md); background: var(--white); color: var(--brown-700); font-size: 18px; font-weight: 600; }
.btn-icon:hover { background: var(--brown-100); }
.btn-today { padding: 4px 12px; border: 1px solid var(--brown-300); border-radius: var(--radius-md); background: var(--white); color: var(--brown-700); font-weight: 600; font-size: var(--font-size-sm); }
.btn-today:hover { background: var(--brown-100); }
.cal-title { font-size: var(--font-size-md); font-weight: 700; color: var(--brown-900); }
.cal-title-wrap { display: flex; align-items: center; gap: var(--space-2); }

/* --- Loading indicators --- */
.progress-bar { height: 3px; background: transparent; overflow: hidden; position: relative; }
.progress-bar.is-loading::before {
  content: ''; position: absolute; top: 0; left: 0; height: 100%; width: 35%;
  background: linear-gradient(90deg, transparent, var(--brown-500), transparent);
  animation: progress-slide 1.1s ease-in-out infinite;
}
@keyframes progress-slide {
  0% { left: -35%; }
  100% { left: 100%; }
}

.inline-spinner {
  display: inline-block;
  width: 14px; height: 14px;
  border: 2px solid var(--brown-200);
  border-top-color: var(--brown-600);
  border-radius: 50%;
  animation: spin .7s linear infinite;
  vertical-align: middle;
}
.inline-spinner-dark {
  border-color: rgba(120, 53, 15, 0.2);
  border-top-color: var(--brown-700);
}
.inline-spinner-light {
  border-color: rgba(255,255,255,0.4);
  border-top-color: var(--white);
}
@keyframes spin { to { transform: rotate(360deg); } }

.cal-grid.is-loading { opacity: 0.55; pointer-events: none; transition: opacity .2s; }
.slots-grid.is-loading { opacity: 0.6; transition: opacity .2s; }

/* Skeleton slot card */
.slot-skeleton { background: var(--gray-50); border-color: var(--gray-200); pointer-events: none; min-height: 120px; }
.skel-line {
  background: linear-gradient(90deg, var(--gray-200) 0%, var(--gray-100) 50%, var(--gray-200) 100%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.2s linear infinite;
  border-radius: 4px;
}
.skel-time { height: 14px; width: 60%; }
.skel-status { height: 10px; width: 40%; }
.skel-actions { height: 22px; width: 80%; margin-top: auto; }
@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Slot busy overlay */
.slot-card { position: relative; }
.slot-card.is-busy .slot-actions button { opacity: 0.4; }
.slot-overlay {
  position: absolute; inset: 0; background: rgba(255,255,255,0.65);
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-md);
  backdrop-filter: blur(1px);
}

.cal-header-row { display: grid; grid-template-columns: repeat(7, 1fr); background: var(--gray-50); border-bottom: 1px solid var(--gray-200); }
.cal-header-row > div { padding: var(--space-2); text-align: center; font-size: var(--font-size-xs); font-weight: 700; color: var(--gray-500); }

.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
.cal-cell { min-height: 72px; border-right: 1px solid var(--gray-100); border-bottom: 1px solid var(--gray-100); padding: 4px; cursor: pointer; display: flex; flex-direction: column; gap: 4px; transition: background .15s; }
.cal-cell:nth-child(7n) { border-right: none; }
.cal-cell:hover { background: var(--brown-50); }
.cal-cell.not-in-month { background: var(--gray-50); opacity: .55; }
.cal-cell.is-today .cell-date { color: var(--brown-700); font-weight: 800; }
.cal-cell.is-selected { background: var(--brown-100); }
.cal-cell.is-selected .cell-date { color: var(--brown-900); font-weight: 800; }
.cell-date { font-size: var(--font-size-sm); color: var(--gray-700); }
.cell-counts { display: flex; flex-wrap: wrap; gap: 2px; }
.chip { font-size: 10px; padding: 1px 6px; border-radius: 999px; font-weight: 700; }
.chip-open { background: var(--info-bg); color: var(--info-fg); }
.chip-booked { background: var(--warning-bg); color: var(--warning-fg); }
.chip-closed { background: var(--surface-sunken); color: var(--text-muted); }

.day-header { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--gray-200); background: var(--brown-50); }
.day-title { font-size: var(--font-size-md); font-weight: 700; color: var(--brown-900); }
.day-meta { font-size: var(--font-size-sm); color: var(--gray-600); margin-top: 4px; display: flex; gap: var(--space-2); flex-wrap: wrap; }

.day-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-2); padding: var(--space-3) var(--space-4); }
.stat { padding: var(--space-2); border-radius: var(--radius-md); text-align: center; }
.stat-num { display: block; font-size: var(--font-size-xl); font-weight: 800; }
.stat-label { display: block; font-size: var(--font-size-xs); color: var(--gray-500); font-weight: 600; }
.stat-open { background: var(--info-bg); color: var(--info-fg); }
.stat-booked { background: var(--warning-bg); color: var(--warning-fg); }
.stat-completed { background: var(--success-bg); color: var(--success-fg); }
.stat-closed { background: var(--surface-sunken); color: var(--text-muted); }

.day-actions { display: flex; gap: var(--space-2); padding: 0 var(--space-4) var(--space-3); }

.empty { padding: var(--space-6); text-align: center; color: var(--gray-500); }
.empty-hint { font-size: var(--font-size-sm); margin-top: 4px; }

.slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--space-3); padding: 0 var(--space-4) var(--space-4); }
.slot-card { padding: var(--space-3); border: 1px solid var(--gray-200); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: var(--space-2); background: var(--white); }
.slot-card.slot-open { border-color: var(--info-border); background: var(--info-bg); }
.slot-card.slot-booked { border-color: var(--warning-border); background: var(--warning-bg); }
.slot-card.slot-completed { border-color: var(--success-border); background: var(--success-bg); }
.slot-card.slot-closed { background: var(--surface-sunken); opacity: .7; }
.slot-card.slot-cancelled { border-color: var(--danger-border); background: var(--danger-bg); opacity: .8; }
.slot-head { display: flex; justify-content: space-between; align-items: center; }
.slot-time { font-weight: 800; font-size: var(--font-size-lg); color: var(--brown-800); }
.slot-status { font-size: var(--font-size-xs); font-weight: 700; text-transform: uppercase; color: var(--gray-600); }
.slot-patient { font-size: var(--font-size-sm); }
.patient-link { background: transparent; padding: 0; color: var(--brown-700); font-weight: 700; text-decoration: underline; cursor: pointer; }
.slot-phone, .slot-reason { color: var(--gray-600); font-size: var(--font-size-xs); margin-top: 2px; }
.slot-actions { display: flex; gap: 4px; flex-wrap: wrap; margin-top: auto; }

.btn { padding: 8px 14px; border-radius: var(--radius-md); font-weight: 600; font-size: var(--font-size-sm); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn-primary { background: var(--brown-600); color: var(--white); }
.btn-primary:hover:not(:disabled) { background: var(--brown-700); }
.btn-secondary { background: var(--white); color: var(--brown-700); border: 1px solid var(--brown-300); }
.btn-secondary:hover:not(:disabled) { background: var(--brown-50); }
.btn-ghost { background: transparent; color: var(--gray-600); }
.btn-ghost:hover:not(:disabled) { background: var(--gray-100); }

.btn-sm { padding: 4px 10px; border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: 700; cursor: pointer; }
.btn-sm:disabled { opacity: .6; cursor: not-allowed; }
.btn-sm.btn-primary { background: var(--brown-600); color: var(--white); }
.btn-sm.btn-success { background: var(--success); color: var(--white); }
.btn-sm.btn-danger { background: var(--danger); color: var(--white); }
.btn-sm.btn-ghost { background: var(--white); color: var(--gray-600); border: 1px solid var(--gray-300); }

.badge { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
.badge-danger { background: var(--danger-bg); color: var(--danger-fg); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal { background: var(--white); border-radius: var(--radius-xl); padding: var(--space-5); width: 480px; max-width: 90vw; box-shadow: var(--shadow-xl); }
.modal-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--brown-800); margin-bottom: var(--space-4); }
.form-group { margin-bottom: var(--space-3); display: flex; flex-direction: column; gap: 4px; }
.form-group label { font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-700); }
.input { padding: 8px 10px; border: 1px solid var(--gray-300); border-radius: var(--radius-md); font: inherit; }
.input:focus { outline: none; border-color: var(--brown-500); }
.select-list { margin-top: 4px; height: auto; }
.modal-actions { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-4); }

@media(max-width: 560px) {
  .day-stats { grid-template-columns: repeat(2, 1fr); }
  .slots-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
}
</style>
