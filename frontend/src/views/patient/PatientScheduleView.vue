<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { usePatientAuthStore } from '@/stores/patientAuth'
import { useRealtimeStore } from '@/stores/realtime'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const authStore = usePatientAuthStore()
const realtime = useRealtimeStore()

// ── Types ──
type SlotStatus = 'OPEN' | 'CLOSED' | 'BOOKED' | 'COMPLETED' | 'CANCELLED'

/** Lưới giờ công khai — đúng những gì /appointment-slots/available trả về. */
interface PublicSlot {
  id: number
  slotDate: string
  slotTime: string
  status: SlotStatus
}

/**
 * Một LƯỢT ĐẶT của tôi (`/appointment-slots/my`).
 *
 * `id` là id LƯỢT ĐẶT — dùng làm khoá render. `slotId` là id Ô GIỜ — dùng khi gọi API huỷ.
 * Hai cái này KHÁC nhau: một ô giờ có thể được đặt đi đặt lại nhiều lần, nên lấy id ô giờ
 * làm khoá thì hai lượt đặt cùng ô sẽ trùng khoá và Vue render sai.
 */
interface MyBooking {
  id: number
  slotId: number
  slotDate: string
  slotTime: string
  status: 'BOOKED' | 'CANCELLED' | 'COMPLETED'
  patientId: number
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

// ── State ──
const activeTab = ref<'my' | 'book'>('book')
const isLoadingMy = ref(false)
const isLoadingSlots = ref(false)
const mySlots = ref<MyBooking[]>([])
const availableSlots = ref<PublicSlot[]>([])
const schedule = ref<EffectiveSchedule | null>(null)
const error = ref<string | null>(null)

// ── Modal State ──
const showBookModal = ref(false)
const showCancelModal = ref(false)
const showSyncModal = ref(false)
const bookingSlot = ref<PublicSlot | null>(null)
const bookingReason = ref('')
const isBooking = ref(false)
const cancellingSlot = ref<MyBooking | null>(null)
const isCancelling = ref(false)
const syncingSlot = ref<MyBooking | null>(null)

// Success toast
const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { message, type }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, 3000)
}

// ── Date / Week logic ──
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
  const [y = 0, m = 1, d = 1] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const today = todayYMD()
const selectedDate = ref(today)
const weekStart = ref(parseYMD(today))

// Đảm bảo weekStart luôn bắt đầu từ thứ Hai
;(function initWeekStart() {
  const d = parseYMD(today)
  const dow = d.getDay() // 0=CN
  const offset = dow === 0 ? 6 : dow - 1
  d.setDate(d.getDate() - offset)
  weekStart.value = d
})()

const weekDays = computed(() => {
  const days: { date: string; dayNum: number; dayName: string; isPast: boolean; isToday: boolean }[] = []
  const start = new Date(weekStart.value)
  const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const ymd = formatYMD(d)
    days.push({
      date: ymd,
      dayNum: d.getDate(),
      dayName: dayNames[i] ?? '',
      isPast: ymd < today,
      isToday: ymd === today,
    })
  }
  return days
})

const weekLabel = computed(() => {
  const start = weekDays.value[0]
  const end = weekDays.value[weekDays.value.length - 1]
  if (!start || !end) return ''
  const sDate = parseYMD(start.date)
  const eDate = parseYMD(end.date)
  const sMonth = sDate.getMonth() + 1
  const eMonth = eDate.getMonth() + 1
  if (sMonth === eMonth) {
    return `${start.dayNum} - ${end.dayNum} Tháng ${sMonth}, ${sDate.getFullYear()}`
  }
  return `${start.dayNum}/${sMonth} - ${end.dayNum}/${eMonth}, ${eDate.getFullYear()}`
})

function prevWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() - 7)
  weekStart.value = d
  // Chọn ngày đầu tuần nếu selectedDate nằm ngoài tuần mới
  const firstDay = formatYMD(d)
  if (selectedDate.value < firstDay || selectedDate.value > formatYMD(new Date(d.getTime() + 6 * 86400000))) {
    selectedDate.value = firstDay < today ? today : firstDay
  }
}

function nextWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + 7)
  weekStart.value = d
  const firstDay = formatYMD(d)
  if (selectedDate.value < firstDay || selectedDate.value > formatYMD(new Date(d.getTime() + 6 * 86400000))) {
    selectedDate.value = firstDay
  }
}

function selectDay(day: typeof weekDays.value[0]) {
  if (day.isPast) return
  selectedDate.value = day.date
}

// ── My Appointments ──
const upcomingSlots = computed(() =>
  mySlots.value.filter(s => s.slotDate >= today && s.status === 'BOOKED')
    .sort((a, b) => a.slotDate.localeCompare(b.slotDate) || a.slotTime.localeCompare(b.slotTime))
)

const pastSlots = computed(() =>
  mySlots.value.filter(s => s.slotDate < today || s.status === 'COMPLETED' || s.status === 'CANCELLED')
    .sort((a, b) => b.slotDate.localeCompare(a.slotDate) || b.slotTime.localeCompare(a.slotTime))
)

async function fetchMySlots() {
  if (!authStore.token) return
  isLoadingMy.value = true
  try {
    const res = await fetch(`${API_BASE}/appointment-slots/my?_t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
    if (res.ok) mySlots.value = await res.json()
  } catch (err) {
    console.error('Lỗi khi lấy lịch hẹn:', err)
  } finally {
    isLoadingMy.value = false
  }
}

// ── Available Slots ──
async function fetchAvailable(date: string) {
  if (!authStore.token) return
  isLoadingSlots.value = true
  error.value = null
  try {
    const [scheduleRes, slotsRes] = await Promise.all([
      fetch(`${API_BASE}/clinic-schedule/effective/${date}?_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      }),
      fetch(`${API_BASE}/appointment-slots/available?date=${date}&_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      }),
    ])
    if (scheduleRes.ok) schedule.value = await scheduleRes.json()
    if (slotsRes.ok) availableSlots.value = await slotsRes.json()
    else availableSlots.value = []
  } catch (err) {
    error.value = 'Không thể tải thông tin lịch. Vui lòng thử lại.'
    console.error(err)
  } finally {
    isLoadingSlots.value = false
  }
}

watch(selectedDate, (date) => {
  if (activeTab.value === 'book') fetchAvailable(date)
})

watch(activeTab, (tab) => {
  if (tab === 'my') fetchMySlots()
  if (tab === 'book') fetchAvailable(selectedDate.value)
})

// ── Vá tại chỗ ──
// Sau mỗi thao tác, server ĐÃ trả về bản mới nhất. Gọi lại API chỉ để đọc đúng thứ vừa nhận
// là thêm 1–2 vòng round-trip trên mạng 4G — đó chính là độ trễ người dùng cảm nhận.

/** Đưa một ô giờ (bản công khai) vào lưới giờ đang hiển thị. */
function patchAvailable(slot: PublicSlot | null | undefined) {
  if (!slot) return
  const idx = availableSlots.value.findIndex(s => s.id === slot.id)
  if (idx !== -1) {
    availableSlots.value.splice(idx, 1, slot)
  } else if (slot.slotDate === selectedDate.value) {
    availableSlots.value.push(slot)
    availableSlots.value.sort((a, b) => a.slotTime.localeCompare(b.slotTime))
  }
}

/** Xoá một ô giờ khỏi lưới (vé bị nhân viên xoá hẳn). */
function removeAvailable(slotId: number) {
  const idx = availableSlots.value.findIndex(s => s.id === slotId)
  if (idx !== -1) availableSlots.value.splice(idx, 1)
}

/** Thêm/cập nhật một lượt đặt trong "Lịch của tôi" (khoá theo id LƯỢT ĐẶT). */
function patchMyBooking(booking: MyBooking | null | undefined) {
  if (!booking) return
  const idx = mySlots.value.findIndex(b => b.id === booking.id)
  if (idx !== -1) mySlots.value.splice(idx, 1, booking)
  else mySlots.value.unshift(booking)
}

// ── Book ──
function openBookModal(slot: PublicSlot) {
  bookingSlot.value = slot
  bookingReason.value = ''
  showBookModal.value = true
}

async function confirmBook() {
  if (!bookingSlot.value || !authStore.token) return
  isBooking.value = true
  try {
    const res = await fetch(`${API_BASE}/appointment-slots/${bookingSlot.value.id}/my-book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({ reason: bookingReason.value || undefined }),
    })
    if (res.ok) {
      showToast('Đặt lịch thành công!')
      showBookModal.value = false
      // Server trả sẵn `data` (ô giờ) + `booking` (lượt đặt) → vá thẳng, khỏi gọi lại API.
      const payload = await res.json().catch(() => null)
      patchAvailable(payload?.data)
      patchMyBooking(payload?.booking)
    } else {
      const data = await res.json().catch(() => null)
      showToast(data?.message || 'Không thể đặt lịch. Vui lòng thử lại.', 'error')
    }
  } catch {
    showToast('Lỗi kết nối. Vui lòng thử lại.', 'error')
  } finally {
    isBooking.value = false
  }
}

// ── Cancel ──
function openCancelModal(slot: MyBooking) {
  cancellingSlot.value = slot
  showCancelModal.value = true
}

async function confirmCancel() {
  if (!cancellingSlot.value || !authStore.token) return
  isCancelling.value = true
  try {
    const res = await fetch(`${API_BASE}/appointment-slots/${cancellingSlot.value.slotId}/my-cancel`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
    if (res.ok) {
      showToast('Đã huỷ lịch hẹn.')
      showCancelModal.value = false
      // `data` = lượt đặt đã chuyển sang CANCELLED, `slot` = ô giờ đã trả về trống.
      const payload = await res.json().catch(() => null)
      patchMyBooking(payload?.data)
      patchAvailable(payload?.slot)
    } else {
      const data = await res.json().catch(() => null)
      showToast(data?.message || 'Không thể huỷ. Vui lòng thử lại.', 'error')
    }
  } catch {
    showToast('Lỗi kết nối. Vui lòng thử lại.', 'error')
  } finally {
    isCancelling.value = false
  }
}

// ── Helpers ──
function formatSlotTime(time: string) {
  return time.slice(0, 5) // "08:00:00" → "08:00"
}

function formatDateVN(ymd: string) {
  const d = parseYMD(ymd)
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  return `${dayNames[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

function statusLabel(status: SlotStatus) {
  switch (status) {
    case 'BOOKED': return 'Đã đặt'
    case 'COMPLETED': return 'Hoàn thành'
    case 'CANCELLED': return 'Đã huỷ'
    default: return status
  }
}

function statusClass(status: SlotStatus) {
  switch (status) {
    case 'BOOKED': return 'badge-booked'
    case 'COMPLETED': return 'badge-completed'
    case 'CANCELLED': return 'badge-cancelled'
    default: return ''
  }
}

let offRealtime: (() => void) | null = null

// ── Init ──
onMounted(() => {
  fetchAvailable(selectedDate.value)
  fetchMySlots()
  
  offRealtime = realtime.subscribe((change) => {
    // Vừa nối lại SSE → có thể đã bỏ lỡ sự kiện, nạp lại cho chắc.
    if (change.resync) {
      fetchAvailable(selectedDate.value)
      fetchMySlots()
      return
    }

    // Phòng khám vừa sinh vé cho cả ngày.
    if (change.type === 'DAY_REGENERATED') {
      if (change.date === selectedDate.value) fetchAvailable(selectedDate.value)
      return
    }

    const updatedSlot = change.slot
    if (!updatedSlot) return

    if (change.type === 'SLOT_REMOVED') {
      removeAvailable(updatedSlot.id)
      return
    }
    patchAvailable(updatedSlot as PublicSlot)

    // "Lịch của tôi" cần reason/notes — mà payload SSE cố tình KHÔNG có (để bệnh nhân này
    // không đọc được dữ liệu của bệnh nhân kia). Nên nếu vé liên quan tới mình thì lấy lại
    // bản đầy đủ từ endpoint có kiểm quyền, thay vì vá bằng payload thiếu trường.
    //
    // Number() cả hai vế: id ô giờ là BIGINT, driver pg có thể trả về dưới dạng chuỗi, khi đó
    // so sánh `===` với slotId (INTEGER, trả về số) luôn sai và sự kiện bị bỏ qua âm thầm.
    const isMine = mySlots.value.some(
      b => Number(b.slotId) === Number(updatedSlot.id) && b.status === 'BOOKED',
    )
    if (isMine || updatedSlot.status === 'BOOKED') {
      fetchMySlots()
    }
  })
})

onBeforeUnmount(() => {
  if (offRealtime) offRealtime()
})

// ── Lịch (Đồng bộ) ──
//
// HAI cách, khác nhau về BẢN CHẤT:
//  1. ĐĂNG KÝ (feed .ics): ứng dụng lịch tự hỏi lại máy chủ định kỳ → huỷ lịch ở đây thì sự
//     kiện tự biến mất bên đó. Đây mới là "đồng bộ".
//  2. THÊM MỘT LẦN (nút Google/Apple cũ): tạo một BẢN SAO RỜI trong lịch khách. Máy chủ không
//     biết id sự kiện bên đó nên không bao giờ chạm tới được nữa — huỷ lịch KHÔNG đồng bộ.
// Trước đây chỉ có cách 2 mà lại đặt tên là "Đồng bộ", nên mới có chuyện huỷ rồi mà lịch
// Google vẫn còn.

function openSyncModal(slot: MyBooking) {
  syncingSlot.value = slot
  showSyncModal.value = true
  if (!calendarUrl.value) loadCalendarUrl()
}

/** Thời lượng một ca, lấy từ cấu hình phòng khám thay vì đoán cứng 1 tiếng. */
function slotDurationMinutes(): number {
  return schedule.value?.slotDurationMinutes || 60
}

/** Mốc bắt đầu/kết thúc của lượt hẹn, tính bằng thời điểm tuyệt đối (giờ VN là UTC+7 cố định). */
function slotRange(slot: MyBooking): { start: Date; end: Date } {
  const start = new Date(`${slot.slotDate}T${slot.slotTime}+07:00`)
  return { start, end: new Date(start.getTime() + slotDurationMinutes() * 60_000) }
}

function openGoogleCalendar() {
  if (!syncingSlot.value) return
  const { start, end } = slotRange(syncingSlot.value)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const url =
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent('Lịch trị liệu - Kinh Lạc Gia Minh')}` +
    `&dates=${fmt(start)}/${fmt(end)}` +
    `&location=${encodeURIComponent('Phòng khám Kinh Lạc Gia Minh')}`
  window.open(url, '_blank', 'noopener')
  showSyncModal.value = false
}

function downloadIcs() {
  if (!syncingSlot.value) return
  const slot = syncingSlot.value
  const { start, end } = slotRange(slot)
  // 'YYYYMMDDTHHMMSSZ' — có hậu tố Z. Bản cũ ghi giờ KHÔNG có Z cũng không có TZID ("giờ trôi
  // nổi"), nên máy đặt múi giờ khác sẽ hiện sai giờ hẹn.
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kinh Lac Gia Minh//Lich tri lieu//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    // UID gắn với LƯỢT ĐẶT: một ô giờ đặt lại nhiều lần phải là nhiều sự kiện khác nhau.
    `UID:booking-${slot.id}@kinhlacgiaminh.vn`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    'SEQUENCE:0',
    'STATUS:CONFIRMED',
    'SUMMARY:Lịch trị liệu - Kinh Lạc Gia Minh',
    'LOCATION:Phòng khám Kinh Lạc Gia Minh',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n') + '\r\n'

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `LichTriLieu_${slot.slotDate}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  showSyncModal.value = false
}

// ── Đăng ký lịch tự đồng bộ ──
const calendarUrl = ref<string | null>(null)
const isLoadingCalendarUrl = ref(false)

/** Ghép đường dẫn tương đối máy chủ trả về thành URL tuyệt đối mà ứng dụng lịch gọi được. */
function toAbsolute(path: string): string {
  if (API_BASE.startsWith('http')) return API_BASE + path
  return window.location.origin + API_BASE + path
}

async function loadCalendarUrl() {
  if (!authStore.token) return
  isLoadingCalendarUrl.value = true
  try {
    const res = await fetch(`${API_BASE}/appointment-slots/my-calendar-url`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
    if (!res.ok) throw new Error('lỗi')
    const data = await res.json()
    calendarUrl.value = toAbsolute(data.path)
  } catch {
    calendarUrl.value = null
  } finally {
    isLoadingCalendarUrl.value = false
  }
}

/** webcal:// khiến máy mở thẳng ứng dụng Lịch thay vì tải file về. */
const webcalUrl = computed(() =>
  calendarUrl.value ? calendarUrl.value.replace(/^https?:/, 'webcal:') : null,
)

/** Google có màn hình "Thêm lịch qua URL" nhận sẵn tham số cid. */
const googleSubscribeUrl = computed(() =>
  calendarUrl.value
    ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(calendarUrl.value)}`
    : null,
)

async function copyCalendarUrl() {
  if (!calendarUrl.value) return
  try {
    await navigator.clipboard.writeText(calendarUrl.value)
    showToast('Đã sao chép đường dẫn lịch.')
  } catch {
    showToast('Không sao chép được, bạn hãy chọn và copy thủ công.', 'error')
  }
}

</script>

<template>
  <div class="schedule-page">
    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast" :class="['toast', toast.type === 'error' ? 'toast-error' : 'toast-success']">
        <svg v-if="toast.type === 'success'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        {{ toast.message }}
      </div>
    </Transition>

    <h2 class="page-title">Lịch Trị Liệu</h2>

    <!-- Tabs -->
    <div class="tab-bar">
      <button :class="['tab-btn', activeTab === 'book' && 'tab-btn-active']" @click="activeTab = 'book'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Đặt lịch mới
      </button>
      <button :class="['tab-btn', activeTab === 'my' && 'tab-btn-active']" @click="activeTab = 'my'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        Lịch của tôi
        <span v-if="upcomingSlots.length" class="tab-badge">{{ upcomingSlots.length }}</span>
      </button>
    </div>

    <!-- ═══ TAB: Đặt lịch mới ═══ -->
    <div v-if="activeTab === 'book'" class="tab-content">
      <!-- Week Picker -->
      <div class="week-picker">
        <button class="week-nav" @click="prevWeek" aria-label="Tuần trước">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="week-label">{{ weekLabel }}</span>
        <button class="week-nav" @click="nextWeek" aria-label="Tuần sau">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <div class="week-days">
        <button
          v-for="day in weekDays"
          :key="day.date"
          :class="['day-btn', {
            'day-selected': day.date === selectedDate,
            'day-today': day.isToday,
            'day-past': day.isPast,
          }]"
          :disabled="day.isPast"
          @click="selectDay(day)"
        >
          <span class="day-name">{{ day.dayName }}</span>
          <span class="day-num">{{ day.dayNum }}</span>
        </button>
      </div>

      <!-- Selected date info -->
      <div class="date-info">
        <h3 class="date-title">{{ formatDateVN(selectedDate) }}</h3>
        <p v-if="schedule && !schedule.isClosed" class="date-hours">
          {{ schedule.openTime }} - {{ schedule.closeTime }}
          <span v-if="schedule.breakStart"> · Nghỉ {{ schedule.breakStart }}-{{ schedule.breakEnd }}</span>
          <span> · {{ schedule.slotDurationMinutes }} phút/buổi</span>
        </p>
        <p v-if="schedule?.isClosed" class="date-closed">Phòng khám nghỉ ngày này</p>
      </div>

      <!-- Loading -->
      <div v-if="isLoadingSlots" class="loading-slots">
        <div class="spinner"></div>
        <span>Đang tải...</span>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-box">{{ error }}</div>

      <!-- Closed day -->
      <div v-else-if="schedule?.isClosed" class="empty-slots">
        <div class="empty-icon">🏥</div>
        <p>Phòng khám không hoạt động vào ngày này.</p>
        <p class="empty-hint">Vui lòng chọn ngày khác.</p>
      </div>

      <!-- No available slots -->
      <div v-else-if="availableSlots.length === 0 && !isLoadingSlots" class="empty-slots">
        <div class="empty-icon">📅</div>
        <p>Không có khung giờ trống trong ngày này.</p>
        <p class="empty-hint">Vui lòng chọn ngày khác hoặc liên hệ phòng khám.</p>
      </div>

      <!-- Slot grid -->
      <div v-else class="slot-grid">
        <!-- Chỉ OPEN mới đặt được. Trước đây CANCELLED cũng được vẽ là "Trống" vì ô giờ bị huỷ
             vẫn nằm nguyên ở trạng thái đó; nay huỷ trả ô giờ thẳng về OPEN nên không còn
             trường hợp CANCELLED trên lưới giờ, và cũng hết cảnh màn hình nhân viên thấy
             "cần Mở lại" trong khi bệnh nhân đã đặt được từ lâu. -->
        <button
          v-for="slot in availableSlots"
          :key="slot.id"
          :class="['slot-card', slot.status === 'OPEN' ? '' : 'slot-disabled']"
          :disabled="slot.status !== 'OPEN'"
          @click="slot.status === 'OPEN' ? openBookModal(slot) : null"
        >
          <span class="slot-time">{{ formatSlotTime(slot.slotTime) }}</span>
          <span v-if="slot.status === 'OPEN'" class="slot-status-open">Trống</span>
          <span v-else-if="slot.status === 'CLOSED'" class="slot-status-closed">Đã đóng</span>
          <span v-else class="slot-status-booked">Đã Đặt</span>
        </button>
      </div>
    </div>

    <!-- ═══ TAB: Lịch của tôi ═══ -->
    <div v-if="activeTab === 'my'" class="tab-content">
      <div v-if="isLoadingMy" class="loading-slots">
        <div class="spinner"></div>
        <span>Đang tải...</span>
      </div>

      <div v-else-if="mySlots.length === 0" class="empty-slots">
        <div class="empty-icon">📋</div>
        <p>Bạn chưa có lịch hẹn nào.</p>
        <button class="btn-primary-sm" @click="activeTab = 'book'">Đặt lịch ngay</button>
      </div>

      <template v-else>
        <!-- Sắp tới -->
        <div v-if="upcomingSlots.length" class="my-section">
          <h3 class="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Sắp tới
          </h3>
          <div class="my-list">
            <div v-for="slot in upcomingSlots" :key="slot.id" class="my-card my-card-upcoming">
              <div class="my-card-left">
                <div class="my-date">{{ formatDateVN(slot.slotDate) }}</div>
                <div class="my-time">{{ formatSlotTime(slot.slotTime) }}</div>
                <div v-if="slot.reason" class="my-reason">{{ slot.reason }}</div>
              </div>
              <div class="my-card-right">
                <span :class="['status-badge', statusClass(slot.status)]">{{ statusLabel(slot.status) }}</span>
                <button class="btn-cancel-sm" @click="openCancelModal(slot)">Huỷ lịch</button>
                <button class="btn-outline-sm mt-1" @click="openSyncModal(slot)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-1" style="vertical-align:-2px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Lưu Lịch
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Lịch sử -->
        <div v-if="pastSlots.length" class="my-section">
          <h3 class="section-title section-title-muted">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            Lịch sử
          </h3>
          <div class="my-list">
            <div v-for="slot in pastSlots" :key="slot.id" class="my-card my-card-past">
              <div class="my-card-left">
                <div class="my-date">{{ formatDateVN(slot.slotDate) }}</div>
                <div class="my-time">{{ formatSlotTime(slot.slotTime) }}</div>
              </div>
              <div class="my-card-right">
                <span :class="['status-badge', statusClass(slot.status)]">{{ statusLabel(slot.status) }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ═══ Modal: Xác nhận đặt lịch ═══ -->
    <Transition name="modal">
      <div v-if="showBookModal" class="modal-overlay" @click.self="showBookModal = false">
        <div class="modal-card">
          <h3 class="modal-title">Xác nhận đặt lịch</h3>
          <div class="modal-body">
            <div class="modal-info-row">
              <span class="modal-label">Ngày:</span>
              <span class="modal-value">{{ bookingSlot ? formatDateVN(bookingSlot.slotDate) : '' }}</span>
            </div>
            <div class="modal-info-row">
              <span class="modal-label">Giờ:</span>
              <span class="modal-value modal-time">{{ bookingSlot ? formatSlotTime(bookingSlot.slotTime) : '' }}</span>
            </div>
            <div class="modal-field">
              <label class="modal-label" for="reason-input">Lý do (tuỳ chọn):</label>
              <textarea
                id="reason-input"
                v-model="bookingReason"
                class="modal-textarea"
                rows="2"
                placeholder="VD: Đau lưng, mất ngủ..."
              ></textarea>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="showBookModal = false" :disabled="isBooking">Huỷ bỏ</button>
            <button class="btn-primary" @click="confirmBook" :disabled="isBooking">
              <span v-if="isBooking" class="spinner-sm"></span>
              {{ isBooking ? 'Đang đặt...' : 'Xác nhận đặt' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ═══ Modal: Xác nhận huỷ ═══ -->
    <Transition name="modal">
      <div v-if="showCancelModal" class="modal-overlay" @click.self="showCancelModal = false">
        <div class="modal-card">
          <h3 class="modal-title modal-title-danger">Huỷ lịch hẹn?</h3>
          <div class="modal-body">
            <p class="modal-desc">Bạn có chắc muốn huỷ lịch hẹn này?</p>
            <div class="modal-info-row">
              <span class="modal-label">Ngày:</span>
              <span class="modal-value">{{ cancellingSlot ? formatDateVN(cancellingSlot.slotDate) : '' }}</span>
            </div>
            <div class="modal-info-row">
              <span class="modal-label">Giờ:</span>
              <span class="modal-value modal-time">{{ cancellingSlot ? formatSlotTime(cancellingSlot.slotTime) : '' }}</span>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="showCancelModal = false" :disabled="isCancelling">Giữ lại</button>
            <button class="btn-danger" @click="confirmCancel" :disabled="isCancelling">
              <span v-if="isCancelling" class="spinner-sm"></span>
              {{ isCancelling ? 'Đang huỷ...' : 'Xác nhận huỷ' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ═══ Modal: Thêm vào lịch ═══ -->
    <Transition name="modal">
      <div v-if="showSyncModal" class="modal-overlay" @click.self="showSyncModal = false">
        <div class="modal-card">
          <h3 class="modal-title">Thêm vào lịch điện thoại</h3>
          <div class="modal-body">

            <!-- Cách 1: ĐĂNG KÝ — đây mới thật sự là đồng bộ hai chiều -->
            <div class="sync-block sync-block-primary">
              <div class="sync-block-head">
                <span class="sync-badge">Nên dùng</span>
                <strong>Đăng ký lịch tự cập nhật</strong>
              </div>
              <p class="sync-desc">
                Đăng ký một lần cho tất cả các buổi. Sau này bạn đặt thêm hay huỷ lịch,
                lịch trên máy <strong>tự cập nhật theo</strong> mà không cần làm gì.
              </p>

              <div v-if="isLoadingCalendarUrl" class="sync-loading">
                <div class="spinner"></div><span>Đang tạo đường dẫn...</span>
              </div>

              <template v-else-if="calendarUrl">
                <div class="sync-actions-row">
                  <a v-if="webcalUrl" :href="webcalUrl" class="btn-primary sync-btn">
                    iPhone / iPad / Mac
                  </a>
                  <a
                    v-if="googleSubscribeUrl"
                    :href="googleSubscribeUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-primary sync-btn sync-btn-google"
                  >Google Calendar</a>
                </div>

                <button class="btn-outline sync-btn-wide" @click="copyCalendarUrl">
                  Sao chép đường dẫn lịch
                </button>

                <p class="sync-note">
                  Lịch Apple hỏi lại máy chủ khoảng mỗi giờ. Riêng Google Calendar tự quyết
                  nhịp làm mới, thường <strong>8–24 tiếng</strong> mới cập nhật một lần — đây là
                  giới hạn của Google, phòng khám không chỉnh được. Cần chắc chắn ngay thì bạn
                  xem mục “Lịch của tôi” trong ứng dụng này.
                </p>
                <p class="sync-note sync-note-warn">
                  Đường dẫn này riêng của bạn — ai có nó là xem được giờ hẹn của bạn, đừng chia sẻ.
                </p>
              </template>

              <p v-else class="sync-note sync-note-warn">
                Chưa tạo được đường dẫn lịch.
                <button class="link-btn" @click="loadCalendarUrl">Thử lại</button>
              </p>
            </div>

            <!-- Cách 2: THÊM MỘT LẦN — nói rõ là không đồng bộ -->
            <div class="sync-block">
              <div class="sync-block-head"><strong>Chỉ thêm buổi này</strong></div>
              <p class="sync-desc">
                Thêm đúng một buổi vào lịch. Lưu ý: đây là <strong>bản chép rời</strong> —
                nếu sau này buổi hẹn bị huỷ hoặc đổi giờ thì lịch trên máy bạn
                <strong>sẽ không tự đổi theo</strong>.
              </p>
              <div class="sync-actions-row">
                <button class="btn-outline sync-btn" @click="openGoogleCalendar">Google Calendar</button>
                <button class="btn-outline sync-btn" @click="downloadIcs">Tải file .ics</button>
              </div>
            </div>

          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="showSyncModal = false">Đóng</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ── Page ── */
.schedule-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-top: var(--space-2);
}
.page-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--gray-900);
}

/* ── Tabs ── */
.tab-bar {
  display: flex;
  gap: var(--space-2);
  background: var(--gray-100);
  border-radius: var(--radius-md);
  padding: 4px;
}
.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--gray-600);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}
.tab-btn:hover { color: var(--gray-800); }
.tab-btn-active {
  background: var(--white);
  color: var(--brown-700);
  box-shadow: var(--shadow-sm);
}
.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--success);
  color: white;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

/* ── Week Picker ── */
.week-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.week-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: var(--white);
  color: var(--gray-600);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}
.week-nav:hover { background: var(--gray-100); color: var(--brown-700); }
.week-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--gray-700);
  text-align: center;
}

.week-days {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 2px 0;
}
.week-days::-webkit-scrollbar { display: none; }
.day-btn {
  flex: 1;
  min-width: 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  background: var(--white);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.day-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.day-num {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--gray-800);
}
.day-btn:hover:not(:disabled) {
  border-color: var(--brown-200);
  background: var(--brown-50);
}
.day-selected {
  border-color: var(--brown-500) !important;
  background: var(--brown-50) !important;
}
.day-selected .day-name { color: var(--brown-600); }
.day-selected .day-num { color: var(--brown-700); }
.day-today .day-num {
  position: relative;
}
.day-today .day-num::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--success);
}
.day-past {
  opacity: 0.4;
  cursor: not-allowed !important;
}
.day-past .day-num { color: var(--gray-400); }

/* ── Date Info ── */
.date-info {
  background: var(--white);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--gray-200);
}
.date-title {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--gray-800);
}
.date-hours {
  font-size: var(--font-size-sm);
  color: var(--gray-500);
  margin-top: 2px;
}
.date-closed {
  font-size: var(--font-size-sm);
  color: var(--danger);
  font-weight: 600;
  margin-top: 2px;
}

/* ── Loading / Empty / Error ── */
.loading-slots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-10);
  color: var(--gray-500);
  font-size: var(--font-size-sm);
}
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--brown-500);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.spinner-sm {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  vertical-align: middle;
  margin-right: 4px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-slots {
  text-align: center;
  padding: var(--space-10) var(--space-4);
  color: var(--gray-500);
  background: var(--white);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--gray-300);
}
.empty-icon { font-size: 40px; margin-bottom: var(--space-3); }
.empty-hint { font-size: var(--font-size-sm); color: var(--gray-400); margin-top: var(--space-1); }

.error-box {
  padding: var(--space-4);
  background: var(--danger-bg);
  color: var(--danger-fg);
  border: 1px solid var(--danger-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  text-align: center;
}

/* ── Slot Grid ── */
.slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--space-2);
}
.slot-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--space-3) var(--space-2);
  background: var(--white);
  border: 2px solid var(--success-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.slot-card:hover {
  border-color: var(--success);
  background: var(--success-bg);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
.slot-card:active {
  transform: translateY(0);
}
.slot-time {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--gray-800);
}
.slot-status-open {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--success);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.slot-disabled {
  border-color: var(--gray-200);
  background: var(--gray-50);
  cursor: not-allowed;
  opacity: 0.8;
}
.slot-disabled:hover {
  transform: none;
  box-shadow: none;
  border-color: var(--gray-200);
  background: var(--gray-50);
}
.slot-disabled .slot-time {
  color: var(--gray-500);
}
.slot-status-booked {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.slot-status-closed {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--danger);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ── My Appointments ── */
.my-section { margin-bottom: var(--space-4); }
.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--brown-700);
  margin-bottom: var(--space-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.section-title-muted { color: var(--gray-500); }
.my-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.my-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--white);
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-200);
  transition: box-shadow var(--transition-fast);
}
.my-card:hover { box-shadow: var(--shadow-sm); }
.my-card-upcoming { border-left: 3px solid var(--success); }
.my-card-past { opacity: 0.7; }
.my-card-left { flex: 1; min-width: 0; }
.my-date {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--gray-800);
}
.my-time {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--brown-700);
}
.my-reason {
  font-size: var(--font-size-xs);
  color: var(--gray-500);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.my-card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

/* ── Status Badge ── */
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
}
.badge-booked { background: var(--success-bg); color: var(--success-fg); }
.badge-completed { background: var(--gray-100); color: var(--gray-600); }
.badge-cancelled { background: var(--danger-bg); color: var(--danger-fg); }

/* ── Buttons ── */
.btn-cancel-sm {
  padding: 4px 12px;
  border: 1px solid var(--danger-border);
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--danger);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.btn-cancel-sm:hover { background: var(--danger-bg); }

.btn-outline-sm {
  padding: 4px 12px;
  border: 1px solid var(--brown-300);
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--brown-700);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
}
.btn-outline-sm:hover { background: var(--brown-50); }
.mt-1 { margin-top: 4px; }
.mr-1 { margin-right: 4px; }

.btn-primary-sm {
  display: inline-block;
  padding: 8px 20px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--brown-600);
  color: white;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  margin-top: var(--space-3);
  transition: all var(--transition-fast);
}
.btn-primary-sm:hover { background: var(--brown-700); }

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: var(--space-4);
}
.modal-card {
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}
.modal-title {
  padding: var(--space-4) var(--space-5);
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--gray-900);
  border-bottom: 1px solid var(--gray-100);
}
.modal-title-danger { color: var(--danger); }
.modal-body {
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.modal-desc {
  font-size: var(--font-size-sm);
  color: var(--gray-600);
}
.modal-info-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}
.modal-label {
  font-size: var(--font-size-sm);
  color: var(--gray-500);
  font-weight: 500;
}
.modal-value {
  font-weight: 600;
  color: var(--gray-800);
}
.modal-time {
  font-size: var(--font-size-lg);
  color: var(--brown-700);
}
.modal-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.modal-textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-family: var(--font-family);
  color: var(--gray-800);
  resize: vertical;
  transition: border-color var(--transition-fast);
}
.modal-textarea:focus {
  outline: none;
  border-color: var(--brown-400);
  box-shadow: var(--focus-ring);
}
.modal-actions {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5) var(--space-5);
  justify-content: flex-end;
}
.btn-secondary {
  padding: 8px 18px;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  background: var(--white);
  color: var(--gray-700);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.btn-secondary:hover { background: var(--gray-100); }
.btn-primary {
  padding: 8px 18px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--brown-600);
  color: white;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.btn-primary:hover { background: var(--brown-700); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-danger {
  padding: 8px 18px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--danger);
  color: white;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.btn-danger:hover { background: #9a3620; }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Toast ── */
.toast {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 300;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  box-shadow: var(--shadow-lg);
  pointer-events: none;
}
.toast-success { background: var(--success); color: white; }
.toast-error { background: var(--danger); color: white; }

/* ── Transitions ── */
.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
.toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-16px); }

.modal-enter-active { transition: all 0.25s ease; }
.modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from { opacity: 0; }
.modal-leave-to { opacity: 0; }
.modal-enter-from .modal-card { transform: scale(0.95) translateY(10px); }
.modal-leave-to .modal-card { transform: scale(0.95) translateY(10px); }

/* ── Responsive ── */
@media (min-width: 640px) {
  .slot-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--space-3);
  }
}

/* ── Modal thêm vào lịch ── */
.sync-block {
  padding: 14px;
  border: 1px solid var(--gray-200, #e5e7eb);
  border-radius: 10px;
  margin-bottom: 14px;
  text-align: left;
}
.sync-block-primary {
  border-color: #b45309;
  background: #fffbeb;
}
.sync-block-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 15px;
}
.sync-badge {
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: #b45309;
  border-radius: 999px;
}
.sync-desc {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--gray-600, #4b5563);
}
.sync-actions-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.sync-btn {
  flex: 1 1 140px;
  justify-content: center;
  text-align: center;
  text-decoration: none;
}
.sync-btn-google { background: #4285F4; border-color: #4285F4; }
.sync-btn-wide {
  width: 100%;
  justify-content: center;
  margin-top: 8px;
}
.sync-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--gray-600, #4b5563);
}
.sync-note {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--gray-600, #4b5563);
}
.sync-note-warn { color: #92400e; }
.link-btn {
  background: none;
  border: none;
  padding: 0;
  color: #b45309;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}
</style>
