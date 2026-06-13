<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePatientStore, type Patient } from '@/stores/patient'
import { api } from '@/services/api'

const router = useRouter()
const route = useRoute()
const patientStore = usePatientStore()

const patient = ref<Patient | null>(null)
const examinations = ref<any[]>([])
const isLoading = ref(true)
const isLoadingExams = ref(true)
const error = ref<string | null>(null)
const activeTab = ref<'info' | 'history' | 'treatment'>('info')

const patientId = computed(() => Number(route.params.id))

onMounted(async () => {
  await loadPatient()
  await Promise.all([loadExaminations(), loadSlots()])
})

async function loadPatient() {
  isLoading.value = true
  try {
    patient.value = await api.get<Patient>(`/patients/${patientId.value}`)
  } catch (err: any) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

async function loadExaminations() {
  isLoadingExams.value = true
  try {
    examinations.value = await api.get<any[]>(`/examinations/patient/${patientId.value}`)
  } catch (err: any) {
    console.error('Failed to load examinations:', err)
  } finally {
    isLoadingExams.value = false
  }
}

// ---- Lịch trị liệu (appointment slots) của bệnh nhân này ----
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

const slots = ref<AppointmentSlot[]>([])
const isLoadingSlots = ref(true)

async function loadSlots() {
  isLoadingSlots.value = true
  try {
    const res = await api.get<AppointmentSlot[]>(`/appointment-slots/patient/${patientId.value}`)
    slots.value = (res || []).map((s) => ({ ...s, slotTime: (s.slotTime || '').slice(0, 5) }))
  } catch (err: any) {
    console.error('Failed to load slots:', err)
  } finally {
    isLoadingSlots.value = false
  }
}

// "Hôm nay" theo giờ Việt Nam (Asia/Ho_Chi_Minh) — tránh lệch ngày khi máy/trình duyệt ở timezone khác.
function todayYMD(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

// --- Liệu trình hiện tại ---
// Chuẩn hoá ngày về 'YYYY-MM-DD' (cắt phần giờ nếu API lỡ trả ISO) để so sánh chuỗi luôn đúng.
function ymd(d: string | null | undefined): string {
  return (d || '').slice(0, 10)
}

const courseStart = computed(() => ymd(patient.value?.treatmentCourseStart) || null)
const courseTarget = computed(() => patient.value?.treatmentTarget ?? null)
const hasCourse = computed(() => courseTarget.value != null && courseTarget.value > 0)

// Số buổi ĐÃ TRỊ = vé COMPLETED có ngày >= ngày bắt đầu liệu trình (so sánh chuỗi 'YYYY-MM-DD').
const completedCount = computed(
  () =>
    slots.value.filter(
      (s) =>
        s.status === 'COMPLETED' &&
        (!courseStart.value || ymd(s.slotDate) >= courseStart.value),
    ).length,
)
const upcomingCount = computed(
  () => slots.value.filter((s) => s.status === 'BOOKED' && ymd(s.slotDate) >= todayYMD()).length,
)
const overdueCount = computed(
  () => slots.value.filter((s) => s.status === 'BOOKED' && ymd(s.slotDate) < todayYMD()).length,
)
const remainingCount = computed(() =>
  courseTarget.value != null ? Math.max(0, courseTarget.value - completedCount.value) : null,
)
const progressPercent = computed(() => {
  if (!courseTarget.value || courseTarget.value <= 0) return 0
  return Math.min(100, Math.round((completedCount.value / courseTarget.value) * 100))
})

// Danh sách cho tab, tách nhóm theo trạng thái
const upcomingSlots = computed(() =>
  slots.value
    .filter((s) => s.status === 'BOOKED' && ymd(s.slotDate) >= todayYMD())
    .slice()
    .sort((a, b) => (a.slotDate + a.slotTime).localeCompare(b.slotDate + b.slotTime)),
)
// Vé đã đặt nhưng đã qua ngày mà chưa "Hoàn thành"/"Huỷ" — nhắc bác sĩ xử lý (mới nhất trước).
const overdueSlots = computed(() =>
  slots.value
    .filter((s) => s.status === 'BOOKED' && ymd(s.slotDate) < todayYMD())
    .slice()
    .sort((a, b) => (b.slotDate + b.slotTime).localeCompare(a.slotDate + a.slotTime)),
)
// "Đã hoàn thành" trong liệu trình hiện tại — KHỚP với con số ở thẻ tóm tắt.
const completedSlots = computed(() =>
  slots.value.filter(
    (s) =>
      s.status === 'COMPLETED' && (!courseStart.value || ymd(s.slotDate) >= courseStart.value),
  ),
)
// Buổi đã trị TRƯỚC khi bắt đầu liệu trình hiện tại (chỉ để xem lại, không tính vào tiến độ).
const earlierCompletedSlots = computed(() =>
  courseStart.value
    ? slots.value.filter(
        (s) => s.status === 'COMPLETED' && ymd(s.slotDate) < courseStart.value!,
      )
    : [],
)
const cancelledSlots = computed(() => slots.value.filter((s) => s.status === 'CANCELLED'))

function slotStatusLabel(s: SlotStatus) {
  switch (s) {
    case 'OPEN':
      return 'Trống'
    case 'CLOSED':
      return 'Đóng'
    case 'BOOKED':
      return 'Đã Đặt'
    case 'COMPLETED':
      return 'Hoàn Thành'
    case 'CANCELLED':
      return 'Đã Huỷ'
  }
}

function formatSlotDate(dateStr: string | null) {
  const s = ymd(dateStr)
  if (!s) return '—'
  const [y, m, d] = s.split('-').map((x) => parseInt(x, 10))
  const date = new Date(y || 1970, (m || 1) - 1, d || 1)
  return date.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function goToAppointments() {
  router.push({ name: 'appointments' })
}

// ---- Modal: bắt đầu / cập nhật liệu trình ----
const showCourseModal = ref(false)
const courseTargetInput = ref<number | null>(null)
const courseSaving = ref(false)

function openCourseModal() {
  courseTargetInput.value = courseTarget.value ?? 10
  showCourseModal.value = true
}

function closeCourseModal() {
  showCourseModal.value = false
}

async function saveCourse() {
  const n = Number(courseTargetInput.value)
  if (!n || n <= 0) {
    alert('Nhập số buổi mục tiêu lớn hơn 0')
    return
  }
  // Chỉ đặt ngày bắt đầu khi BẮT ĐẦU liệu trình mới; sửa mục tiêu giữa chừng thì giữ nguyên ngày cũ.
  const isNew = !hasCourse.value
  courseSaving.value = true
  try {
    const payload: { treatmentTarget: number; treatmentCourseStart?: string } = {
      treatmentTarget: n,
    }
    if (isNew) payload.treatmentCourseStart = todayYMD()
    await api.put(`/patients/${patientId.value}`, payload)
    await loadPatient()
    showCourseModal.value = false
  } catch (err: any) {
    alert('Lỗi: ' + err.message)
  } finally {
    courseSaving.value = false
  }
}

async function endCourse() {
  if (!confirm('Kết thúc liệu trình hiện tại? Số buổi sẽ ngừng đếm cho liệu trình này.')) return
  courseSaving.value = true
  try {
    await api.put(`/patients/${patientId.value}`, {
      treatmentTarget: null,
      treatmentCourseStart: null,
    })
    await loadPatient()
  } catch (err: any) {
    alert('Lỗi: ' + err.message)
  } finally {
    courseSaving.value = false
  }
}

function goBack() {
  router.push({ name: 'patients' })
}

function goToNewExamination() {
  router.push({ name: 'new-examination', params: { id: patientId.value } })
}

function goToMeridianResults(examId: number) {
  router.push({ name: 'meridian-results', params: { patientId: patientId.value, examId } })
}

function goToLatestExamination() {
  if (examinations.value && examinations.value.length > 0) {
    goToMeridianResults(examinations.value[0].id)
  } else {
    alert('Bệnh nhân này chưa có ca khám nào.')
  }
}

// Pagination
const examPage = ref(1)
const itemsPerPage = ref(5)

const pagedExaminations = computed(() => {
  const start = (examPage.value - 1) * itemsPerPage.value
  return examinations.value.slice(start, start + itemsPerPage.value)
})

const totalPages = computed(() => Math.ceil(examinations.value.length / itemsPerPage.value))

function getPageNumbers() {
  const pages: number[] = []
  const start = Math.max(1, examPage.value - 2)
  const end = Math.min(totalPages.value, examPage.value + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('vi-VN') } catch { return d }
}

function formatDateTime(d: string | null | undefined) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch { return d }
}

function getAge(dob: string | null) {
  if (!dob) return '—'
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  if (now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--
  }
  return `${age} tuổi`
}
</script>

<template>
  <div class="detail-page">
    <!-- Back button -->
    <button class="back-btn" @click="goBack">
      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/></svg>
      <span>Quay lại danh sách</span>
    </button>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải thông tin...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="goBack">Quay lại</button>
    </div>

    <template v-else-if="patient">
      <!-- Patient header card -->
      <div class="patient-header-card">
        <div class="patient-avatar-lg">
          {{ (patient.fullName || '?').charAt(0).toUpperCase() }}
        </div>
        <div class="patient-header-info">
          <h2 class="patient-name">{{ patient.fullName || 'Chưa có tên' }}</h2>
          <div class="patient-meta">
            <span class="meta-item">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
              {{ patient.gender || '—' }}
            </span>
            <span v-if="patient.dateOfBirth" class="meta-item">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
              {{ formatDate(patient.dateOfBirth) }} · {{ getAge(patient.dateOfBirth) }}
            </span>
            <span v-if="patient.phone" class="meta-item">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
              {{ patient.phone }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-meridian" @click="goToLatestExamination">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20M12 2l4 4-4 4M12 22l-4-4 4-4"/></svg>
            Kinh lạc
          </button>
          <button class="btn-primary" @click="goToNewExamination">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"/></svg>
            Thêm Khám mới
          </button>
        </div>
      </div>

      <!-- Thẻ tóm tắt liệu trình -->
      <div class="course-card">
        <div class="course-head">
          <h3 class="course-title">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
            Liệu Trình Trị Liệu
          </h3>
          <div class="course-actions">
            <template v-if="hasCourse">
              <button class="btn-course-ghost" :disabled="courseSaving" @click="openCourseModal">Cập Nhật Mục Tiêu</button>
              <button class="btn-course-ghost" :disabled="courseSaving" @click="endCourse">Kết Thúc</button>
            </template>
            <button v-else class="btn-course-primary" :disabled="courseSaving" @click="openCourseModal">
              + Bắt Đầu Liệu Trình
            </button>
          </div>
        </div>

        <template v-if="hasCourse">
          <div class="course-progress-row">
            <span class="course-progress-text">Đã trị <strong>{{ completedCount }}</strong> / {{ courseTarget }} buổi</span>
            <span class="course-progress-pct">{{ progressPercent }}%</span>
          </div>
          <div class="course-bar"><div class="course-bar-fill" :style="{ width: progressPercent + '%' }"></div></div>
          <div class="course-meta">
            <span class="course-chip chip-remaining">Còn lại {{ remainingCount }} buổi</span>
            <span class="course-chip chip-upcoming">Sắp tới {{ upcomingCount }} buổi đã đặt</span>
            <span v-if="overdueCount" class="course-chip chip-overdue">Quá hạn {{ overdueCount }} buổi chưa xử lý</span>
            <span v-if="courseStart" class="course-chip chip-date">Bắt đầu {{ formatSlotDate(courseStart) }}</span>
          </div>
        </template>
        <p v-else class="course-empty">
          Chưa thiết lập liệu trình. Tổng đã trị: <strong>{{ completedCount }}</strong> buổi · Sắp tới: <strong>{{ upcomingCount }}</strong> buổi đã đặt.
        </p>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
          Thông Tin
        </button>
        <button class="tab" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
          Lịch Sử Khám
          <span v-if="examinations.length" class="tab-badge">{{ examinations.length }}</span>
        </button>
        <button class="tab" :class="{ active: activeTab === 'treatment' }" @click="activeTab = 'treatment'">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
          Lịch Trị Liệu
          <span v-if="slots.length" class="tab-badge">{{ slots.length }}</span>
        </button>
      </div>

      <!-- Tab: Thông tin -->
      <div v-if="activeTab === 'info'" class="tab-content">
        <div class="info-grid">
          <div class="info-card">
            <h4 class="info-card-title">Thông tin cá nhân</h4>
            <div class="info-rows">
              <div class="info-row"><span class="info-label">Họ và tên</span><span class="info-value">{{ patient.fullName || '—' }}</span></div>
              <div class="info-row"><span class="info-label">Giới tính</span><span class="info-value">{{ patient.gender || '—' }}</span></div>
              <div class="info-row"><span class="info-label">Ngày sinh</span><span class="info-value">{{ formatDate(patient.dateOfBirth) }}</span></div>
              <div class="info-row"><span class="info-label">Giờ sinh</span><span class="info-value">{{ patient.timeOfBirth || '—' }}</span></div>
              <div class="info-row"><span class="info-label">Tuổi</span><span class="info-value">{{ getAge(patient.dateOfBirth) }}</span></div>
            </div>
          </div>
          <div class="info-card">
            <h4 class="info-card-title">Liên hệ</h4>
            <div class="info-rows">
              <div class="info-row"><span class="info-label">Số điện thoại</span><span class="info-value">{{ patient.phone || '—' }}</span></div>
              <div class="info-row"><span class="info-label">Tỉnh/TP</span><span class="info-value">{{ patient.province || '—' }}</span></div>
              <div class="info-row"><span class="info-label">Địa chỉ</span><span class="info-value">{{ patient.address || '—' }}</span></div>
            </div>
          </div>
          <div class="info-card info-card--full">
            <h4 class="info-card-title">Y tế</h4>
            <div class="info-rows">
              <div class="info-row info-row--block"><span class="info-label">Tiền sử bệnh</span><p class="info-text">{{ patient.medicalHistory || 'Chưa có thông tin' }}</p></div>
              <div class="info-row info-row--block"><span class="info-label">Ghi chú</span><p class="info-text">{{ patient.notes || 'Không có ghi chú' }}</p></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Lịch sử khám -->
      <div v-if="activeTab === 'history'" class="tab-content">
        <div v-if="isLoadingExams" class="loading-state loading-state--sm">
          <div class="spinner"></div>
        </div>
        <div v-else-if="examinations.length === 0" class="empty-state-sm">
          <svg width="40" height="40" viewBox="0 0 20 20" fill="currentColor" class="empty-icon-sm"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
          <p>Chưa có lịch sử khám bệnh</p>
        </div>
        <div v-else class="exam-list">
          <div v-for="exam in pagedExaminations" :key="exam.id" class="exam-card" @click="goToMeridianResults(exam.id)">
            <div class="exam-header">
              <div class="exam-date-badge">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
                {{ formatDateTime(exam.createdAt) }}
              </div>
              <span class="exam-id">#{{ exam.id }}</span>
            </div>
            <div class="exam-body">
              <div class="exam-tags">
                <span class="exam-tag tag--am-duong">{{ exam.amDuong }}</span>
                <span class="exam-tag tag--khi">Khí: {{ exam.khi }}</span>
                <span class="exam-tag tag--huyet">Huyết: {{ exam.huyet }}</span>
              </div>
              <div v-if="exam.syndromes && exam.syndromes.length" class="exam-syndromes">
                <span class="syndromes-label">Thể bệnh:</span>
                <span v-for="(s, i) in exam.syndromes.slice(0, 3)" :key="i" class="syndrome-chip">
                  {{ s.name || s.ten || `Thể ${Number(i) + 1}` }}
                </span>
                <span v-if="exam.syndromes.length > 3" class="syndrome-more">+{{ exam.syndromes.length - 3 }}</span>
              </div>
              <p v-if="exam.notes" class="exam-notes">{{ exam.notes }}</p>
            </div>
          </div>
          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination">
            <button class="page-btn" :disabled="examPage <= 1" @click.stop="examPage--">‹</button>
            <button v-for="pn in getPageNumbers()" :key="pn" class="page-btn" :class="{ active: pn === examPage }" @click.stop="examPage = pn">{{ pn }}</button>
            <button class="page-btn" :disabled="examPage >= totalPages" @click.stop="examPage++">›</button>
            <span class="page-info">Trang {{ examPage }} / {{ totalPages }}</span>
          </div>
        </div>
      </div>

      <!-- Tab: Lịch trị liệu -->
      <div v-if="activeTab === 'treatment'" class="tab-content">
        <div class="treatment-toolbar">
          <button class="btn-primary" @click="goToAppointments">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"/></svg>
            Đặt Lịch Mới
          </button>
        </div>

        <div v-if="isLoadingSlots" class="loading-state loading-state--sm">
          <div class="spinner"></div>
        </div>
        <div v-else-if="slots.length === 0" class="empty-state-sm">
          <svg width="40" height="40" viewBox="0 0 20 20" fill="currentColor" class="empty-icon-sm"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
          <p>Chưa có buổi trị liệu nào</p>
          <button class="btn-primary" @click="goToAppointments">Đặt Lịch Trị Liệu</button>
        </div>
        <template v-else>
          <!-- Quá hạn chưa xử lý -->
          <div v-if="overdueSlots.length" class="slot-group">
            <h4 class="slot-group-title slot-group-title--warn">Quá Hạn Chưa Xử Lý ({{ overdueSlots.length }})</h4>
            <div class="treat-list">
              <div v-for="s in overdueSlots" :key="s.id" class="treat-row treat-overdue">
                <div class="treat-when">
                  <span class="treat-date">{{ formatSlotDate(s.slotDate) }}</span>
                  <span class="treat-time">{{ s.slotTime }}</span>
                </div>
                <span class="treat-status st-overdue">Quá Hạn</span>
                <span v-if="s.reason" class="treat-reason">{{ s.reason }}</span>
              </div>
            </div>
          </div>
          <!-- Sắp tới -->
          <div v-if="upcomingSlots.length" class="slot-group">
            <h4 class="slot-group-title">Sắp Tới ({{ upcomingSlots.length }})</h4>
            <div class="treat-list">
              <div v-for="s in upcomingSlots" :key="s.id" class="treat-row treat-booked">
                <div class="treat-when">
                  <span class="treat-date">{{ formatSlotDate(s.slotDate) }}</span>
                  <span class="treat-time">{{ s.slotTime }}</span>
                </div>
                <span class="treat-status st-booked">{{ slotStatusLabel(s.status) }}</span>
                <span v-if="s.reason" class="treat-reason">{{ s.reason }}</span>
              </div>
            </div>
          </div>
          <!-- Đã hoàn thành (trong liệu trình hiện tại) -->
          <div v-if="completedSlots.length" class="slot-group">
            <h4 class="slot-group-title">
              {{ hasCourse ? 'Đã Hoàn Thành (Liệu Trình Này)' : 'Đã Hoàn Thành' }} ({{ completedSlots.length }})
            </h4>
            <div class="treat-list">
              <div v-for="(s, i) in completedSlots" :key="s.id" class="treat-row treat-completed">
                <div class="treat-when">
                  <span class="treat-index">#{{ completedSlots.length - i }}</span>
                  <span class="treat-date">{{ formatSlotDate(s.slotDate) }}</span>
                  <span class="treat-time">{{ s.slotTime }}</span>
                </div>
                <span class="treat-status st-completed">{{ slotStatusLabel(s.status) }}</span>
                <span v-if="s.reason" class="treat-reason">{{ s.reason }}</span>
              </div>
            </div>
          </div>
          <!-- Đã trị trước liệu trình hiện tại (chỉ xem lại) -->
          <div v-if="earlierCompletedSlots.length" class="slot-group">
            <h4 class="slot-group-title">Đã Trị Trước Đó ({{ earlierCompletedSlots.length }})</h4>
            <div class="treat-list">
              <div v-for="s in earlierCompletedSlots" :key="s.id" class="treat-row treat-completed treat-earlier">
                <div class="treat-when">
                  <span class="treat-date">{{ formatSlotDate(s.slotDate) }}</span>
                  <span class="treat-time">{{ s.slotTime }}</span>
                </div>
                <span class="treat-status st-completed">{{ slotStatusLabel(s.status) }}</span>
                <span v-if="s.reason" class="treat-reason">{{ s.reason }}</span>
              </div>
            </div>
          </div>
          <!-- Đã huỷ -->
          <div v-if="cancelledSlots.length" class="slot-group">
            <h4 class="slot-group-title">Đã Huỷ ({{ cancelledSlots.length }})</h4>
            <div class="treat-list">
              <div v-for="s in cancelledSlots" :key="s.id" class="treat-row treat-cancelled">
                <div class="treat-when">
                  <span class="treat-date">{{ formatSlotDate(s.slotDate) }}</span>
                  <span class="treat-time">{{ s.slotTime }}</span>
                </div>
                <span class="treat-status st-cancelled">{{ slotStatusLabel(s.status) }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Modal: bắt đầu / cập nhật liệu trình -->
      <div v-if="showCourseModal" class="modal-overlay" @click.self="closeCourseModal">
        <div class="modal-box">
          <h3 class="modal-title">{{ hasCourse ? 'Cập Nhật Liệu Trình' : 'Bắt Đầu Liệu Trình Mới' }}</h3>
          <p class="modal-desc">
            <template v-if="hasCourse">Cập nhật số buổi mục tiêu. Giữ nguyên ngày bắt đầu &amp; số buổi đã trị hiện tại của liệu trình.</template>
            <template v-else>Nhập số buổi mục tiêu. Ngày bắt đầu được đặt là hôm nay ({{ formatSlotDate(todayYMD()) }}); số buổi đã trị sẽ đếm từ ngày này.</template>
          </p>
          <div class="form-group">
            <label>Số buổi mục tiêu</label>
            <input v-model.number="courseTargetInput" type="number" min="1" class="input" />
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeCourseModal">Huỷ</button>
            <button class="btn-primary" :disabled="courseSaving" @click="saveCourse">
              {{ courseSaving ? 'Đang lưu...' : hasCourse ? 'Lưu' : 'Bắt Đầu' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* (Previous styles...) */
.pagination { display: flex; align-items: center; justify-content: center; gap: var(--space-2); padding: var(--space-6) 0; }
.page-btn { min-width: 32px; height: 32px; padding: 0 8px; display: flex; align-items: center; justify-content: center; background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-600); cursor: pointer; transition: all var(--transition-fast); }
.page-btn:hover:not(:disabled) { border-color: var(--brown-400); color: var(--brown-700); background: var(--brown-50); }
.page-btn.active { background: var(--brown-600); border-color: var(--brown-600); color: var(--white); }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { margin-left: var(--space-4); font-size: var(--font-size-xs); color: var(--gray-500); font-weight: 600; }
.detail-page{width:100%;animation:fadeIn .4s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

.back-btn{display:inline-flex;align-items:center;gap:var(--space-2);font-size:var(--font-size-sm);color:var(--gray-600);font-weight:500;margin-bottom:var(--space-6);padding:var(--space-2) var(--space-3);border-radius:var(--radius-sm);transition:all var(--transition-fast)}
.back-btn:hover{color:var(--brown-700);background:var(--brown-50)}

.loading-state{display:flex;flex-direction:column;align-items:center;gap:var(--space-4);padding:var(--space-16) 0;color:var(--gray-500)}
.loading-state--sm{padding:var(--space-10) 0}
.spinner{width:32px;height:32px;border:3px solid var(--gray-200);border-top-color:var(--brown-500);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

.error-state{text-align:center;padding:var(--space-10);color:var(--danger)}

/* Patient Header */
.patient-header-card{display:flex;align-items:center;gap:var(--space-6);padding:var(--space-6) var(--space-8);background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius-lg);margin-bottom:var(--space-6)}
.patient-avatar-lg{width:64px;height:64px;border-radius:var(--radius-full);background:linear-gradient(135deg,var(--brown-400),var(--brown-700));color:var(--white);display:flex;align-items:center;justify-content:center;font-size:var(--font-size-2xl);font-weight:700;flex-shrink:0}
.patient-name{font-size:var(--font-size-xl);font-weight:700;color:var(--black);margin-bottom:var(--space-2)}
.patient-meta{display:flex;flex-wrap:wrap;gap:var(--space-4)}
.meta-item{display:inline-flex;align-items:center;gap:var(--space-1);font-size:var(--font-size-sm);color:var(--gray-600)}
.meta-item svg{color:var(--gray-400)}

/* Tabs */
.tabs{display:flex;gap:var(--space-1);margin-bottom:var(--space-6);border-bottom:2px solid var(--gray-200);padding-bottom:0}
.tab{display:inline-flex;align-items:center;gap:var(--space-2);padding:var(--space-3) var(--space-4);font-size:var(--font-size-sm);font-weight:600;color:var(--gray-500);border-bottom:2px solid transparent;margin-bottom:-2px;transition:all var(--transition-fast)}
.tab:hover{color:var(--brown-600)}
.tab.active{color:var(--brown-700);border-bottom-color:var(--brown-600)}
.tab-badge{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:var(--radius-full);background:var(--brown-100);color:var(--brown-700);font-size:var(--font-size-xs);font-weight:700}

.tab-content{animation:fadeIn .3s ease}

/* Info Grid */
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-5)}
.info-card{background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius-md);padding:var(--space-5) var(--space-6)}
.info-card--full{grid-column:1/-1}
.info-card-title{font-size:var(--font-size-sm);font-weight:700;color:var(--brown-700);text-transform:uppercase;letter-spacing:.04em;margin-bottom:var(--space-4);padding-bottom:var(--space-3);border-bottom:1px solid var(--gray-100)}
.info-rows{display:flex;flex-direction:column;gap:var(--space-3)}
.info-row{display:flex;justify-content:space-between;align-items:flex-start}
.info-row--block{flex-direction:column;gap:var(--space-2)}
.info-label{font-size:var(--font-size-sm);color:var(--gray-500);flex-shrink:0}
.info-value{font-size:var(--font-size-sm);font-weight:600;color:var(--black);text-align:right}
.info-text{font-size:var(--font-size-sm);color:var(--gray-700);line-height:1.6;white-space:pre-wrap}

/* Examinations */
.empty-state-sm{display:flex;flex-direction:column;align-items:center;gap:var(--space-3);padding:var(--space-10) 0;color:var(--gray-400)}
.empty-icon-sm{opacity:.4}
.exam-list{display:flex;flex-direction:column;gap:var(--space-4)}
.exam-card{background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius-md);overflow:hidden;transition:all var(--transition-fast);cursor:pointer;}
.exam-card:hover{border-color:var(--brown-300);box-shadow:var(--shadow-sm)}
.exam-header{display:flex;align-items:center;justify-content:space-between;padding:var(--space-3) var(--space-5);background:var(--gray-50);border-bottom:1px solid var(--gray-100)}
.exam-date-badge{display:inline-flex;align-items:center;gap:var(--space-2);font-size:var(--font-size-sm);font-weight:600;color:var(--gray-700)}
.exam-id{font-size:var(--font-size-xs);color:var(--gray-400);font-weight:600}
.exam-body{padding:var(--space-4) var(--space-5)}
.exam-tags{display:flex;flex-wrap:wrap;gap:var(--space-2);margin-bottom:var(--space-3)}
.exam-tag{display:inline-block;padding:3px 10px;border-radius:var(--radius-full);font-size:var(--font-size-xs);font-weight:600}
.tag--am-duong{background:var(--brown-100);color:var(--brown-700)}
.tag--khi{background:var(--info-bg);color:var(--info-fg)}
.tag--huyet{background:var(--danger-bg);color:var(--danger-fg)}
.exam-syndromes{display:flex;align-items:center;flex-wrap:wrap;gap:var(--space-2);margin-bottom:var(--space-3)}
.syndromes-label{font-size:var(--font-size-xs);color:var(--gray-500);font-weight:600}
.syndrome-chip{display:inline-block;padding:2px 8px;border-radius:var(--radius-sm);background:var(--gray-100);color:var(--gray-700);font-size:var(--font-size-xs)}
.syndrome-more{font-size:var(--font-size-xs);color:var(--gray-400);font-weight:600}
.exam-notes{font-size:var(--font-size-sm);color:var(--gray-600);line-height:1.5;padding-top:var(--space-2);border-top:1px solid var(--gray-100);margin-top:var(--space-2)}

.btn-secondary{padding:10px 20px;background:var(--white);color:var(--gray-700);font-size:var(--font-size-sm);font-weight:600;border-radius:var(--radius-md);border:1px solid var(--gray-300);transition:all var(--transition-fast)}
.btn-secondary:hover{background:var(--gray-50)}

.btn-primary{display:inline-flex;align-items:center;gap:var(--space-2);padding:10px 20px;background:var(--brown-600);color:var(--white);font-size:var(--font-size-sm);font-weight:600;border-radius:var(--radius-md);border:none;transition:all var(--transition-fast);cursor:pointer;white-space:nowrap;}
.btn-primary:hover{background:var(--brown-700);transform:translateY(-1px);box-shadow:var(--shadow-sm);}
.btn-meridian{display:inline-flex;align-items:center;gap:var(--space-2);padding:10px 20px;background:var(--white);color:var(--brown-700);font-size:var(--font-size-sm);font-weight:600;border-radius:var(--radius-md);border:1px solid var(--brown-200);transition:all var(--transition-fast);cursor:pointer;white-space:nowrap;}
.btn-meridian:hover{background:var(--brown-50);border-color:var(--brown-300);transform:translateY(-1px);}
.header-actions{display:flex;gap:var(--space-3);margin-left:auto;}
.ml-auto{margin-left:auto;}

/* Course summary card */
.course-card{background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius-lg);padding:var(--space-5) var(--space-6);margin-bottom:var(--space-6)}
.course-head{display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);flex-wrap:wrap;margin-bottom:var(--space-4)}
.course-title{display:inline-flex;align-items:center;gap:var(--space-2);font-size:var(--font-size-md);font-weight:700;color:var(--brown-800)}
.course-title svg{color:var(--brown-500)}
.course-actions{display:flex;gap:var(--space-2);flex-wrap:wrap}
.btn-course-primary{padding:8px 16px;background:var(--brown-600);color:var(--white);font-size:var(--font-size-sm);font-weight:600;border-radius:var(--radius-md);border:none;cursor:pointer;transition:all var(--transition-fast)}
.btn-course-primary:hover:not(:disabled){background:var(--brown-700)}
.btn-course-ghost{padding:6px 14px;background:var(--white);color:var(--brown-700);font-size:var(--font-size-sm);font-weight:600;border-radius:var(--radius-md);border:1px solid var(--brown-200);cursor:pointer;transition:all var(--transition-fast)}
.btn-course-ghost:hover:not(:disabled){background:var(--brown-50);border-color:var(--brown-300)}
.btn-course-primary:disabled,.btn-course-ghost:disabled{opacity:.6;cursor:not-allowed}
.course-progress-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:var(--space-2)}
.course-progress-text{font-size:var(--font-size-md);color:var(--gray-700)}
.course-progress-text strong{font-size:var(--font-size-lg);color:var(--brown-800)}
.course-progress-pct{font-size:var(--font-size-sm);font-weight:700;color:var(--brown-600)}
.course-bar{height:10px;background:var(--gray-100);border-radius:var(--radius-full);overflow:hidden;margin-bottom:var(--space-3)}
.course-bar-fill{height:100%;background:linear-gradient(90deg,var(--brown-400),var(--brown-600));border-radius:var(--radius-full);transition:width .4s ease}
.course-meta{display:flex;flex-wrap:wrap;gap:var(--space-2)}
.course-chip{padding:3px 10px;border-radius:var(--radius-full);font-size:var(--font-size-xs);font-weight:600}
.chip-remaining{background:var(--info-bg);color:var(--info-fg)}
.chip-upcoming{background:var(--warning-bg);color:var(--warning-fg)}
.chip-date{background:var(--gray-100);color:var(--gray-600)}
.course-empty{font-size:var(--font-size-sm);color:var(--gray-600)}
.course-empty strong{color:var(--brown-700)}

/* Treatment list */
.treatment-toolbar{display:flex;justify-content:flex-end;margin-bottom:var(--space-4)}
.empty-state-sm .btn-primary{margin-top:var(--space-3)}
.slot-group{margin-bottom:var(--space-5)}
.slot-group-title{font-size:var(--font-size-sm);font-weight:700;color:var(--brown-700);text-transform:uppercase;letter-spacing:.04em;margin-bottom:var(--space-3)}
.treat-list{display:flex;flex-direction:column;gap:var(--space-2)}
.treat-row{display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap;padding:var(--space-3) var(--space-4);background:var(--white);border:1px solid var(--gray-200);border-left-width:3px;border-radius:var(--radius-md)}
.treat-booked{border-left-color:var(--warning-border,#d9a441)}
.treat-completed{border-left-color:var(--success,#3f9b56)}
.treat-cancelled{border-left-color:var(--danger,#c0533f);opacity:.75}
.treat-when{display:inline-flex;align-items:center;gap:var(--space-2);min-width:200px}
.treat-index{font-size:var(--font-size-xs);font-weight:700;color:var(--gray-400)}
.treat-date{font-size:var(--font-size-sm);font-weight:600;color:var(--black);text-transform:capitalize}
.treat-time{font-size:var(--font-size-sm);font-weight:700;color:var(--brown-700)}
.treat-status{padding:2px 10px;border-radius:var(--radius-full);font-size:var(--font-size-xs);font-weight:700}
.st-booked{background:var(--warning-bg);color:var(--warning-fg)}
.st-completed{background:var(--success-bg);color:var(--success-fg)}
.st-cancelled{background:var(--danger-bg);color:var(--danger-fg)}
.treat-reason{font-size:var(--font-size-sm);color:var(--gray-600)}
.treat-earlier{opacity:.65}
.treat-overdue{border-left-color:var(--danger,#c0533f)}
.st-overdue{background:var(--danger-bg);color:var(--danger-fg)}
.chip-overdue{background:var(--danger-bg);color:var(--danger-fg)}
.slot-group-title--warn{color:var(--danger-fg)}

/* Course modal */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:200}
.modal-box{background:var(--white);border-radius:var(--radius-xl);padding:var(--space-6);width:420px;max-width:90vw;box-shadow:var(--shadow-xl)}
.modal-title{font-size:var(--font-size-lg);font-weight:700;color:var(--brown-800);margin-bottom:var(--space-3)}
.modal-desc{font-size:var(--font-size-sm);color:var(--gray-600);line-height:1.5;margin-bottom:var(--space-4)}
.form-group{display:flex;flex-direction:column;gap:var(--space-2);margin-bottom:var(--space-4)}
.form-group label{font-size:var(--font-size-sm);font-weight:600;color:var(--gray-700)}
.input{padding:10px 12px;border:1px solid var(--gray-300);border-radius:var(--radius-md);font:inherit}
.input:focus{outline:none;border-color:var(--brown-500)}
.modal-actions{display:flex;justify-content:flex-end;gap:var(--space-2)}

@media(max-width:768px){
  .patient-header-card{flex-direction:column;text-align:center;padding:var(--space-5)}
  .patient-meta{justify-content:center}
  .info-grid{grid-template-columns:1fr}
  .treat-when{min-width:0}
  /* Nút hành động: xuống dòng & căn giữa dưới tên thay vì dồn 1 hàng tràn mép. */
  .header-actions{margin-left:0;flex-wrap:wrap;justify-content:center;width:100%}
  .header-actions .btn-primary,.header-actions .btn-meridian{flex:1 1 auto;justify-content:center}
}
</style>
