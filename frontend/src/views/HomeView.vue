<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { Patient } from '@/stores/patient'
import CosmicWheel from '@/components/CosmicWheel.vue'
import HeroMeridianFigure from '@/components/HeroMeridianFigure.vue'

const router = useRouter()
const authStore = useAuthStore()

type SlotStatus = 'OPEN' | 'CLOSED' | 'BOOKED' | 'COMPLETED' | 'CANCELLED'
interface AppointmentSlot {
  id: number
  slotDate: string
  slotTime: string
  status: SlotStatus
  patientId: number | null
  reason: string | null
}
interface ApptRow {
  id: number
  time: string
  status: SlotStatus
  reason: string | null
  name: string
  patientId: number | null
}

// "Hôm nay" theo timezone phòng khám (Asia/Ho_Chi_Minh) để không lệch ngày.
const CLINIC_TZ = 'Asia/Ho_Chi_Minh'
function todayYMD(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
const todayLabel = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: CLINIC_TZ,
}).format(new Date())

const loading = ref(true)

const stats = ref({
  patients: null as number | null,
  baiThuoc: null as number | null,
  baiThuocDongY: null as number | null,
  baiThuocTayY: null as number | null,
  viThuoc: null as number | null,
  trieuChung: null as number | null,
  phapTri: null as number | null,
  benhTayY: null as number | null,
})

const todayCounts = ref<Record<SlotStatus, number>>({
  OPEN: 0,
  CLOSED: 0,
  BOOKED: 0,
  COMPLETED: 0,
  CANCELLED: 0,
})
const todayAppointments = ref<ApptRow[]>([])
const recentPatients = ref<Patient[]>([])

function fmt(n: number | null): string {
  return n == null ? '–' : n.toLocaleString('vi-VN')
}
function formatTime(t: string): string {
  return (t || '').slice(0, 5)
}
function initial(name: string | null | undefined): string {
  const n = (name || '').trim()
  return n ? n.charAt(0).toUpperCase() : '?'
}

// Card "kho dữ liệu" — mỗi card điều hướng tới module tương ứng.
const baiThuocSub = computed(() => {
  const d = stats.value.baiThuocDongY
  const t = stats.value.baiThuocTayY
  if (d == null && t == null) return 'Phương thuốc'
  return `${fmt(d)} Đông Y · ${fmt(t)} Tây Y`
})

const kbCards = computed(() => [
  { label: 'Bệnh Nhân', sub: 'Tổng hồ sơ', value: stats.value.patients, route: 'patients', icon: 'patients', tone: 'tone-brown' },
  { label: 'Bài Thuốc', sub: baiThuocSub.value, value: stats.value.baiThuoc, route: 'medicines', icon: 'flask', tone: 'tone-green' },
  { label: 'Vị Thuốc', sub: 'Dược liệu', value: stats.value.viThuoc, route: 'medicines', icon: 'pill', tone: 'tone-amber' },
  { label: 'Triệu Chứng', sub: 'Trong từ điển', value: stats.value.trieuChung, route: 'symptoms', icon: 'clipboard', tone: 'tone-purple' },
  { label: 'Pháp Trị', sub: 'Phương pháp điều trị', value: stats.value.phapTri, route: 'treatments', icon: 'shield', tone: 'tone-method' },
  { label: 'Bệnh Tây Y', sub: 'Bệnh danh', value: stats.value.benhTayY, route: 'western-medicine', icon: 'stethoscope', tone: 'tone-blue' },
])

const quickActions = [
  { label: 'Thêm Bệnh Nhân', desc: 'Tạo hồ sơ mới', route: 'patients', icon: 'user-plus' },
  { label: 'Lịch Trị Liệu', desc: 'Quản lý lịch hẹn', route: 'appointments', icon: 'calendar' },
  { label: 'Tra Cứu Bài Thuốc', desc: 'Kho bài thuốc & vị thuốc', route: 'medicines', icon: 'flask' },
  { label: 'Chẩn Đoán Triệu Chứng', desc: 'Suy luận pháp trị', route: 'symptoms', icon: 'clipboard' },
]

const statusText: Record<SlotStatus, string> = {
  OPEN: 'Đang mở',
  CLOSED: 'Đã đóng',
  BOOKED: 'Chờ khám',
  COMPLETED: 'Đã khám',
  CANCELLED: 'Đã huỷ',
}

function go(routeName: string) {
  router.push({ name: routeName })
}
function openAppointment(row: ApptRow) {
  if (row.patientId != null) router.push({ name: 'patient-detail', params: { id: row.patientId } })
  else router.push({ name: 'appointments' })
}

async function loadDashboard() {
  loading.value = true
  const today = todayYMD()
  const [pPatients, pBai, pVi, pTrieu, pPhap, pTay, pSlots] = await Promise.allSettled([
    api.get<any>(`/patients?page=1&limit=6`),
    api.get<any>(`/bai-thuoc/lite?page=1&limit=1`),
    api.get<any>(`/vi-thuoc/lite?page=1&limit=1`),
    api.get<any>(`/trieu-chung?page=1&limit=1`),
    api.get<any>(`/phap-tri/lite?page=1&limit=1`),
    api.get<any>(`/benh-tay-y/lite?page=1&limit=1`),
    api.get<AppointmentSlot[]>(`/appointment-slots?date=${today}`),
  ])

  if (pPatients.status === 'fulfilled') {
    const v = pPatients.value
    stats.value.patients = v?.total ?? (Array.isArray(v?.data) ? v.data.length : null)
    recentPatients.value = (v?.data ?? []).slice(0, 5)
  }
  if (pBai.status === 'fulfilled') {
    stats.value.baiThuoc = pBai.value?.total ?? null
    stats.value.baiThuocDongY = pBai.value?.statsByCategory?.['dong-y'] ?? null
    stats.value.baiThuocTayY = pBai.value?.statsByCategory?.['tay-y'] ?? null
  }
  if (pVi.status === 'fulfilled') stats.value.viThuoc = pVi.value?.total ?? null
  if (pTrieu.status === 'fulfilled') stats.value.trieuChung = pTrieu.value?.total ?? null
  if (pPhap.status === 'fulfilled') stats.value.phapTri = pPhap.value?.total ?? null
  if (pTay.status === 'fulfilled') stats.value.benhTayY = pTay.value?.total ?? null

  let slots: AppointmentSlot[] = []
  if (pSlots.status === 'fulfilled') slots = pSlots.value ?? []
  const counts: Record<SlotStatus, number> = { OPEN: 0, CLOSED: 0, BOOKED: 0, COMPLETED: 0, CANCELLED: 0 }
  for (const s of slots) if (counts[s.status] != null) counts[s.status]++
  todayCounts.value = counts

  // Lịch hẹn hôm nay có bệnh nhân (chờ khám / đã khám / đã huỷ).
  const withPatient = slots.filter((s) => s.patientId != null && s.status !== 'OPEN' && s.status !== 'CLOSED')
  const nameMap = new Map<number, string>()
  for (const p of recentPatients.value) if (p?.id != null) nameMap.set(p.id, p.fullName || '')
  const missing = [...new Set(withPatient.map((s) => s.patientId as number))].filter((id) => !nameMap.get(id))
  if (missing.length) {
    const res = await Promise.allSettled(missing.map((id) => api.get<Patient>(`/patients/${id}`)))
    res.forEach((r, i) => {
      if (r.status === 'fulfilled') nameMap.set(missing[i]!, r.value?.fullName || '')
    })
  }
  todayAppointments.value = withPatient
    .map((s) => ({
      id: s.id,
      time: formatTime(s.slotTime),
      status: s.status,
      reason: s.reason,
      patientId: s.patientId,
      name: nameMap.get(s.patientId as number) || `Bệnh nhân #${s.patientId}`,
    }))
    .sort((a, b) => a.time.localeCompare(b.time))

  loading.value = false
}

onMounted(loadDashboard)
</script>

<template>
  <div class="home-page">
    <!-- ============ Hero ============ -->
    <section class="hero">
      <div class="hero-main">
        <span class="hero-date">{{ todayLabel }}</span>
        <h2 class="hero-title">
          Chào Mừng Trở Lại, <span class="hl">{{ authStore.username || 'Admin' }}</span> 👋
        </h2>
        <p class="hero-sub">Tổng quan hoạt động phòng khám Y Học Cổ Truyền hôm nay.</p>
        <div class="hero-chips">
          <span class="hero-chip"><b>{{ todayCounts.BOOKED }}</b> lịch chờ khám</span>
          <span class="hero-chip"><b>{{ todayCounts.COMPLETED }}</b> đã khám</span>
          <span class="hero-chip"><b>{{ todayCounts.OPEN }}</b> chỗ trống</span>
        </div>
      </div>
      <!-- Hình người kinh lạc 3D — đứng GIỮA banner (tách rời vòng xoay) -->
      <div class="hero-person">
        <HeroMeridianFigure />
      </div>
      <!-- Vòng Lục Kinh / Ngũ Hành / Tứ Khí — giữ ở GÓC PHẢI như cũ -->
      <div class="hero-art">
        <CosmicWheel />
      </div>
    </section>

    <!-- ============ Hoạt động hôm nay ============ -->
    <section class="block">
      <div class="block-head">
        <h3 class="block-title">Hoạt Động Hôm Nay</h3>
        <button class="link-btn" @click="go('appointments')">Mở lịch trị liệu →</button>
      </div>
      <div class="today-grid">
        <div class="today-card tone-amber" @click="go('appointments')">
          <span class="kpi-ic">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </span>
          <div class="kpi-body">
            <span class="kpi-value" :class="{ shimmer: loading }">{{ loading ? '' : todayCounts.BOOKED }}</span>
            <span class="kpi-label">Chờ Khám</span>
          </div>
        </div>
        <div class="today-card tone-green" @click="go('appointments')">
          <span class="kpi-ic">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </span>
          <div class="kpi-body">
            <span class="kpi-value" :class="{ shimmer: loading }">{{ loading ? '' : todayCounts.COMPLETED }}</span>
            <span class="kpi-label">Đã Khám</span>
          </div>
        </div>
        <div class="today-card tone-brown" @click="go('appointments')">
          <span class="kpi-ic">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </span>
          <div class="kpi-body">
            <span class="kpi-value" :class="{ shimmer: loading }">{{ loading ? '' : todayCounts.OPEN }}</span>
            <span class="kpi-label">Còn Trống</span>
          </div>
        </div>
        <div class="today-card tone-danger" @click="go('appointments')">
          <span class="kpi-ic">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </span>
          <div class="kpi-body">
            <span class="kpi-value" :class="{ shimmer: loading }">{{ loading ? '' : todayCounts.CANCELLED }}</span>
            <span class="kpi-label">Đã Huỷ</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ Tổng quan kho dữ liệu ============ -->
    <section class="block">
      <div class="block-head">
        <h3 class="block-title">Tổng Quan Dữ Liệu</h3>
        <span class="block-hint">Kho tri thức Đông Y của phòng khám</span>
      </div>
      <div class="kb-grid">
        <button v-for="c in kbCards" :key="c.label" class="kb-card" :class="c.tone" @click="go(c.route)">
          <span class="kpi-ic">
            <!-- patients -->
            <svg v-if="c.icon === 'patients'" width="22" height="22" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
            <!-- flask (bài thuốc) -->
            <svg v-else-if="c.icon === 'flask'" width="22" height="22" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.816 14.769 2.156 18 4.828 18h10.343c2.673 0 4.013-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187 1.949-1.95A3 3 0 009 8.172z" clip-rule="evenodd" /></svg>
            <!-- pill (vị thuốc) -->
            <svg v-else-if="c.icon === 'pill'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 20.5L3.5 13.5a5 5 0 017.07-7.07l7 7a5 5 0 01-7.07 7.07z" /><path stroke-linecap="round" stroke-linejoin="round" d="M8.5 8.5l7 7" /></svg>
            <!-- clipboard (triệu chứng) -->
            <svg v-else-if="c.icon === 'clipboard'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            <!-- shield (pháp trị) -->
            <svg v-else-if="c.icon === 'shield'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            <!-- stethoscope (bệnh tây y) -->
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13a9 9 0 0018 0v-5m-9 14a5 5 0 01-5-5V7a2 2 0 012-2h6a2 2 0 012 2v5a5 5 0 01-5 5zm0 0v-4" /></svg>
          </span>
          <div class="kpi-body">
            <span class="kpi-value" :class="{ shimmer: loading && c.value == null }">{{ loading && c.value == null ? '' : fmt(c.value) }}</span>
            <span class="kpi-label">{{ c.label }}</span>
            <span class="kpi-sub">{{ c.sub }}</span>
          </div>
          <span class="kb-arrow">→</span>
        </button>
      </div>
    </section>

    <!-- ============ Lịch hẹn + Truy cập nhanh ============ -->
    <section class="lower-grid">
      <!-- Lịch hẹn hôm nay -->
      <div class="panel">
        <div class="panel-head">
          <h3 class="panel-title">Lịch Hẹn Hôm Nay</h3>
          <button class="link-btn" @click="go('appointments')">Xem tất cả →</button>
        </div>

        <div v-if="loading" class="list-loading">
          <div v-for="i in 3" :key="i" class="appt-row appt-row--skeleton">
            <span class="appt-time shimmer"></span>
            <span class="appt-avatar shimmer"></span>
            <span class="sk-line shimmer"></span>
          </div>
        </div>

        <ul v-else-if="todayAppointments.length" class="appt-list">
          <li v-for="row in todayAppointments" :key="row.id" class="appt-row" @click="openAppointment(row)">
            <span class="appt-time">{{ row.time }}</span>
            <span class="appt-avatar">{{ initial(row.name) }}</span>
            <div class="appt-info">
              <span class="appt-name">{{ row.name }}</span>
              <p v-if="row.reason" class="appt-reason">{{ row.reason }}</p>
            </div>
            <span class="badge-status" :class="'st-' + row.status">{{ statusText[row.status] }}</span>
          </li>
        </ul>

        <div v-else class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <p>Hôm nay chưa có lịch hẹn nào.</p>
          <button class="btn-ghost" @click="go('appointments')">Mở lịch trị liệu</button>
        </div>
      </div>

      <!-- Cột phải -->
      <div class="side-col">
        <div class="panel">
          <div class="panel-head">
            <h3 class="panel-title">Truy Cập Nhanh</h3>
          </div>
          <div class="qa-grid">
            <button v-for="a in quickActions" :key="a.label" class="qa-card" @click="go(a.route)">
              <span class="qa-ic">
                <svg v-if="a.icon === 'user-plus'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6" /></svg>
                <svg v-else-if="a.icon === 'calendar'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <svg v-else-if="a.icon === 'flask'" width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.816 14.769 2.156 18 4.828 18h10.343c2.673 0 4.013-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7z" clip-rule="evenodd" /></svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </span>
              <span class="qa-text">
                <span class="qa-label">{{ a.label }}</span>
                <span class="qa-desc">{{ a.desc }}</span>
              </span>
            </button>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <h3 class="panel-title">Bệnh Nhân Gần Đây</h3>
            <button class="link-btn" @click="go('patients')">Xem tất cả →</button>
          </div>

          <div v-if="loading" class="list-loading">
            <div v-for="i in 4" :key="i" class="rp-row">
              <span class="appt-avatar shimmer"></span>
              <span class="sk-line shimmer"></span>
            </div>
          </div>

          <ul v-else-if="recentPatients.length" class="rp-list">
            <li v-for="p in recentPatients" :key="p.id" class="rp-row" @click="go('patients')">
              <span class="appt-avatar">{{ initial(p.fullName) }}</span>
              <div class="rp-info">
                <span class="rp-name">{{ p.fullName || 'Chưa Đặt Tên' }}</span>
                <span class="rp-meta">{{ p.phone || p.province || 'Hồ sơ bệnh nhân' }}</span>
              </div>
            </li>
          </ul>

          <div v-else class="empty-state empty-state--sm">
            <p>Chưa có bệnh nhân.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page { width: 100%; display: flex; flex-direction: column; gap: var(--space-8); animation: fadeIn .4s ease }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }

/* ---------- Hero ---------- */
/* Lưới 3 cột: chữ (trái) · khối người+vòng (GIỮA banner) · cột đệm cân đối (phải) */
.hero { background: linear-gradient(135deg, var(--brown-600) 0%, var(--brown-800) 100%); border-radius: var(--radius-lg); padding: var(--space-8) var(--space-10); display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: var(--space-6); color: var(--white); position: relative; overflow: hidden }
.hero::before { content: ''; position: absolute; top: -55%; right: -10%; width: 420px; height: 420px; border-radius: 50%; background: rgba(255, 255, 255, .05) }
.hero-main { position: relative; z-index: 1; min-width: 0 }
.hero-date { display: inline-block; font-size: var(--font-size-xs); font-weight: 600; letter-spacing: .02em; color: var(--brown-100); background: rgba(255, 255, 255, .12); padding: 4px 12px; border-radius: var(--radius-full); margin-bottom: var(--space-3) }
.hero-title { font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: var(--space-2) }
.hero-title .hl { color: var(--brown-200) }
.hero-sub { font-size: var(--font-size-sm); color: rgba(255, 255, 255, .78); margin-bottom: var(--space-5) }
.hero-chips { display: flex; flex-wrap: wrap; gap: var(--space-3) }
.hero-chip { font-size: var(--font-size-sm); color: rgba(255, 255, 255, .85); background: rgba(255, 255, 255, .1); border: 1px solid rgba(255, 255, 255, .14); padding: 6px 14px; border-radius: var(--radius-full) }
.hero-chip b { color: var(--white); font-weight: 700 }
/* Hình người 3D — cột GIỮA banner (tách rời vòng). Chiều cao CỐ ĐỊNH (không dùng aspect-ratio
   để tránh bị tóp về 0 trong lưới → canvas có kích thước thật, mô hình mới tải). */
.hero-person { position: relative; z-index: 1; width: clamp(250px, 27vw, 360px); height: clamp(330px, 36vw, 480px); pointer-events: none }
/* Nền tối ấm sau lưng người → hình nổi rõ mà không cần sáng gắt */
.hero-person::before { content: ''; position: absolute; inset: -8% -16%; z-index: -1; border-radius: 50%; background: radial-gradient(circle at 50% 46%, rgba(16, 9, 3, .55) 0%, rgba(16, 9, 3, .26) 46%, rgba(16, 9, 3, 0) 72%); pointer-events: none }
/* Vòng Lục Kinh / Ngũ Hành / Tứ Khí — GÓC PHẢI như cũ */
.hero-art { position: relative; z-index: 1; width: clamp(200px, 22vw, 300px); justify-self: end }
/* Vầng sáng ấm + "ổ" tối phía sau bánh xe, để medallion như được gắn chìm vào hero (không dùng ảnh) */
.hero-art::before {
  content: '';
  position: absolute;
  inset: -16% -14%;
  z-index: -1;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 44%, rgba(250, 243, 228, .14) 0%, rgba(250, 243, 228, .06) 40%, rgba(250, 243, 228, 0) 70%),
    radial-gradient(circle at 50% 54%, rgba(20, 11, 4, .30) 58%, rgba(20, 11, 4, 0) 78%);
  pointer-events: none;
}

/* ---------- Block headers ---------- */
.block { display: flex; flex-direction: column; gap: var(--space-5) }
.block-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3) }
.block-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--text) }
.block-hint { font-size: var(--font-size-sm); color: var(--text-subtle) }
.link-btn { font-size: var(--font-size-sm); font-weight: 600; color: var(--brown-600); transition: color var(--transition-fast); white-space: nowrap }
.link-btn:hover { color: var(--brown-800) }

/* ---------- Tone tokens ---------- */
.tone-brown { --c: var(--brown-600); --cbg: rgba(var(--primary-rgb), .10) }
.tone-green { --c: var(--success); --cbg: var(--success-bg) }
.tone-amber { --c: var(--warning); --cbg: var(--warning-bg) }
.tone-blue { --c: var(--info); --cbg: var(--info-bg) }
.tone-purple { --c: var(--ai-fg); --cbg: var(--ai-bg) }
.tone-method { --c: var(--chip-method-fg); --cbg: var(--chip-method-bg) }
.tone-danger { --c: var(--danger); --cbg: var(--danger-bg) }

.kpi-ic { width: 46px; height: 46px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: var(--cbg); color: var(--c) }
.kpi-body { display: flex; flex-direction: column; min-width: 0 }
.kpi-value { font-size: var(--font-size-2xl); font-weight: 700; color: var(--text); line-height: 1.1 }
.kpi-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--text-muted) }
.kpi-sub { font-size: var(--font-size-xs); color: var(--text-subtle); margin-top: 2px }

/* ---------- Today grid ---------- */
.today-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: var(--space-4) }
.today-card { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--c); border-radius: var(--radius-md); padding: var(--space-5); display: flex; align-items: center; gap: var(--space-4); cursor: pointer; box-shadow: var(--shadow-sm); transition: transform var(--transition-fast), box-shadow var(--transition-fast) }
.today-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md) }

/* ---------- Knowledge-base grid ---------- */
.kb-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: var(--space-4) }
.kb-card { position: relative; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-5); display: flex; align-items: center; gap: var(--space-4); text-align: left; box-shadow: var(--shadow-sm); transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast) }
.kb-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--border-brand) }
.kb-arrow { position: absolute; top: var(--space-4); right: var(--space-4); color: var(--gray-300); font-size: var(--font-size-lg); transition: color var(--transition-fast), transform var(--transition-fast) }
.kb-card:hover .kb-arrow { color: var(--brown-500); transform: translateX(2px) }

/* ---------- Lower grid ---------- */
.lower-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: var(--space-6); align-items: start }
.side-col { display: flex; flex-direction: column; gap: var(--space-6) }
.panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-6); box-shadow: var(--shadow-sm) }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-4) }
.panel-title { font-size: var(--font-size-md); font-weight: 700; color: var(--text) }

/* ---------- Appointment list ---------- */
.appt-list { display: flex; flex-direction: column; gap: var(--space-1) }
.appt-row { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-3); border-radius: var(--radius-md); cursor: pointer; transition: background var(--transition-fast) }
.appt-row:hover { background: var(--brown-50) }
.appt-time { font-size: var(--font-size-sm); font-weight: 700; color: var(--brown-700); width: 46px; flex-shrink: 0; font-variant-numeric: tabular-nums }
.appt-avatar { width: 38px; height: 38px; border-radius: var(--radius-full); background: linear-gradient(135deg, var(--brown-300), var(--brown-500)); color: var(--white); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: var(--font-size-sm); flex-shrink: 0 }
.appt-info { flex: 1; min-width: 0 }
.appt-name { display: block; font-size: var(--font-size-sm); font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.appt-reason { font-size: var(--font-size-xs); color: var(--text-subtle); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0 }
.badge-status { font-size: var(--font-size-xs); font-weight: 600; padding: 3px 10px; border-radius: var(--radius-full); white-space: nowrap; flex-shrink: 0 }
.st-BOOKED { background: var(--warning-bg); color: var(--warning-fg); border: 1px solid var(--warning-border) }
.st-COMPLETED { background: var(--success-bg); color: var(--success-fg); border: 1px solid var(--success-border) }
.st-CANCELLED { background: var(--danger-bg); color: var(--danger-fg); border: 1px solid var(--danger-border) }

/* ---------- Quick actions ---------- */
.qa-grid { display: grid; grid-template-columns: 1fr; gap: var(--space-3) }
.qa-card { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); text-align: left; transition: all var(--transition-fast) }
.qa-card:hover { border-color: var(--brown-300); background: var(--brown-50); transform: translateX(2px) }
.qa-ic { width: 40px; height: 40px; border-radius: var(--radius-md); background: var(--brown-50); color: var(--brown-600); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all var(--transition-fast) }
.qa-card:hover .qa-ic { background: var(--brown-100); color: var(--brown-700) }
.qa-text { display: flex; flex-direction: column; min-width: 0 }
.qa-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--text) }
.qa-desc { font-size: var(--font-size-xs); color: var(--text-subtle) }

/* ---------- Recent patients ---------- */
.rp-list { display: flex; flex-direction: column; gap: var(--space-1) }
.rp-row { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); cursor: pointer; transition: background var(--transition-fast) }
.rp-row:hover { background: var(--brown-50) }
.rp-info { display: flex; flex-direction: column; min-width: 0 }
.rp-name { font-size: var(--font-size-sm); font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.rp-meta { font-size: var(--font-size-xs); color: var(--text-subtle); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }

/* ---------- Empty states ---------- */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-8) var(--space-4); color: var(--text-subtle); text-align: center }
.empty-state svg { color: var(--gray-300) }
.empty-state p { font-size: var(--font-size-sm); margin: 0 }
.empty-state--sm { padding: var(--space-6) var(--space-4) }
.btn-ghost { font-size: var(--font-size-sm); font-weight: 600; color: var(--brown-600); border: 1px solid var(--brown-200); padding: var(--space-2) var(--space-4); border-radius: var(--radius-md); transition: all var(--transition-fast) }
.btn-ghost:hover { background: var(--brown-50); border-color: var(--brown-300) }

/* ---------- Loading skeletons ---------- */
.shimmer { position: relative; overflow: hidden; background: var(--gray-100); border-radius: var(--radius-sm) }
.shimmer::after { content: ''; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .65), transparent); animation: shimmer 1.3s infinite }
@keyframes shimmer { 100% { transform: translateX(100%) } }
.kpi-value.shimmer { display: inline-block; width: 56px; height: 26px }
.list-loading { display: flex; flex-direction: column; gap: var(--space-2) }
.appt-row--skeleton { cursor: default }
.appt-time.shimmer { height: 16px }
.sk-line { flex: 1; height: 14px }

/* ---------- Responsive ---------- */
@media (max-width: 1024px) {
  .lower-grid { grid-template-columns: 1fr }
}
@media (max-width: 768px) {
  .hero { grid-template-columns: 1fr; text-align: center; padding: var(--space-6) }
  .hero-chips { justify-content: center }
  .hero-person { justify-self: center } /* 1 cột → căn hình người vào GIỮA (không dồn trái) */
  /* Vòng xoay: giữ TO như cũ, ghim vào GÓC TRÊN–PHẢI làm hoạ tiết nền (mờ nhẹ).
     Cho phép chữ chồng lên — đã thêm bóng chữ ở .hero-main để chữ vẫn đọc rõ. */
  .hero-art {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
    width: 128px;
    opacity: 0.7;
    z-index: 0;
    pointer-events: none;
    justify-self: initial; /* huỷ justify-self:end của desktop khi đã absolute */
  }
  /* "Lớp phủ" cho chữ: 2 lớp bóng (nét gần + quầng tối xa) → chữ nổi hẳn trên vòng xoay */
  .hero-main { text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 2px 12px rgba(20, 11, 4, 0.85) }
}
</style>
