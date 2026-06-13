<script setup lang="ts">
/**
 * DemoKetQuaDoView — Trang "Kết Quả Đo Kinh Lạc" CÔNG KHAI (khách chưa đăng nhập).
 *
 * Lấy THẬT từ DB qua endpoint @Public /demo/ket-qua-do (1 ca đo, ẩn danh bệnh nhân).
 * Hiển thị CHỈ-XEM: bảng chỉ số nhiệt độ (chi trên/chi dưới) + Bát Cương + các thể bệnh đo được.
 * Mọi thao tác "dùng thật" (đo cho bệnh nhân của bạn, lưu hồ sơ) → mời đăng nhập.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import PublicTopBar from '@/components/PublicTopBar.vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import MedicalDisclaimer from '@/components/MedicalDisclaimer.vue'
import {
  rawUpper,
  rawLower,
  calculateBounds,
  processRows,
  computeDiagnosis,
  computeBatCuong,
  fmt,
  type InputData,
} from '@/lib/meridianAnalysis'

const router = useRouter()

interface SyndromeLite {
  id?: number
  name?: string
  code?: string
  outputCell?: string
}
interface DemoExam {
  inputData?: InputData
  createdAt?: string
  excelSyndromes?: SyndromeLite[]
  modernSyndromes?: SyndromeLite[]
  syndromes?: { syndrome_name?: string; phap_tri?: string }[]
}
interface DemoPatient {
  fullName?: string
  gender?: string | null
  dateOfBirth?: string | null
}

interface DemoCase {
  patient: DemoPatient
  examination: DemoExam
}

const loading = ref(true)
const error = ref<string | null>(null)
const cases = ref<DemoCase[]>([])
const activeIndex = ref(0)
const slideDir = ref<'next' | 'prev'>('next')

const caseCount = computed(() => cases.value.length)
const activeCase = computed<DemoCase | null>(() => cases.value[activeIndex.value] ?? null)
const patient = computed<DemoPatient | null>(() => activeCase.value?.patient ?? null)
const examination = computed<DemoExam | null>(() => activeCase.value?.examination ?? null)

const inputData = computed<InputData | null>(() => examination.value?.inputData ?? null)

function nextCase() {
  const n = caseCount.value
  if (n < 2) return
  slideDir.value = 'next'
  activeIndex.value = (activeIndex.value + 1) % n
}
function prevCase() {
  const n = caseCount.value
  if (n < 2) return
  slideDir.value = 'prev'
  activeIndex.value = (activeIndex.value - 1 + n) % n
}
function goCase(i: number) {
  if (i < 0 || i >= caseCount.value || i === activeIndex.value) return
  slideDir.value = i > activeIndex.value ? 'next' : 'prev'
  activeIndex.value = i
}

// Lướt ngang (touch) để chuyển ca — bỏ qua nếu thao tác nghiêng về cuộn dọc.
let touchStartX = 0
let touchStartY = 0
function onTouchStart(e: TouchEvent) {
  const t = e.changedTouches[0]
  if (!t) return
  touchStartX = t.screenX
  touchStartY = t.screenY
}
function onTouchEnd(e: TouchEvent) {
  const t = e.changedTouches[0]
  if (!t || caseCount.value < 2) return
  const dx = t.screenX - touchStartX
  const dy = t.screenY - touchStartY
  if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return
  if (dx < 0) nextCase()
  else prevCase()
}

const upperRowsRaw = computed(() => rawUpper(inputData.value))
const lowerRowsRaw = computed(() => rawLower(inputData.value))
const upperStats = computed(() => calculateBounds(upperRowsRaw.value))
const lowerStats = computed(() => calculateBounds(lowerRowsRaw.value))
const upperRows = computed(() => processRows(upperRowsRaw.value, upperStats.value))
const lowerRows = computed(() => processRows(lowerRowsRaw.value, lowerStats.value))

const diagnosis = computed(() =>
  computeDiagnosis(inputData.value, upperRows.value, lowerRows.value, upperStats.value, lowerStats.value),
)
const batCuong = computed(() =>
  computeBatCuong(upperRows.value, lowerRows.value, upperStats.value, lowerStats.value),
)

const excelSyndromes = computed(() => examination.value?.excelSyndromes ?? [])
const modernSyndromes = computed(() => examination.value?.modernSyndromes ?? [])

const examDate = computed(() => {
  const raw = examination.value?.createdAt
  if (!raw) return '—'
  const d = new Date(raw)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN')
})

const patientAge = computed(() => {
  const dob = patient.value?.dateOfBirth
  if (!dob) return '—'
  const y = new Date(dob).getFullYear()
  const age = new Date().getFullYear() - y
  return isNaN(age) ? '—' : String(age)
})

function signClass(sign: string): string {
  if (sign === '+') return 'sign-high'
  if (sign === '-') return 'sign-low'
  return 'sign-zero'
}

function goLogin() {
  router.push({ name: 'login' })
}

onMounted(async () => {
  try {
    // Ưu tiên endpoint nhiều ca (slider). Nếu backend chưa cập nhật endpoint này
    // (deploy thủ công trên VPS), lùi về endpoint 1 ca để trang vẫn chạy.
    try {
      const res = await api.get<{ cases: DemoCase[] }>('/demo/ket-qua-do-list?count=5')
      cases.value = Array.isArray(res?.cases) ? res.cases : []
    } catch {
      cases.value = []
    }
    if (!cases.value.length) {
      const one = await api.get<DemoCase>('/demo/ket-qua-do')
      if (one?.examination) cases.value = [one]
    }
    if (!cases.value.length) {
      error.value = 'Chưa có ca đo mẫu nào để hiển thị.'
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="dkq">
    <PublicTopBar title="Kết Quả Đo Kinh Lạc" />
    <AppBreadcrumb />

    <div class="dkq-body">
      <div v-if="loading" class="dkq-loading">
        <div class="dkq-spinner" aria-hidden="true"></div>
        <p>Đang tải kết quả đo mẫu…</p>
      </div>

      <div v-else-if="error" class="dkq-error">
        <p><strong>Không tải được kết quả đo mẫu.</strong></p>
        <p>{{ error }}</p>
      </div>

      <template v-else>
        <!-- Giới thiệu -->
        <header class="dkq-head">
          <span class="dkq-eyebrow">Đo Kinh Lạc · Bản Xem Thử</span>
          <h1 class="dkq-title">Một Bản Đo Kinh Lạc Thật, Đọc Ngay Trên Màn Hình</h1>
          <p class="dkq-sub">
            Chỉ số nhiệt độ 12 đường kinh được đối chiếu ngưỡng sinh lý, tự suy ra kinh cường –
            kinh nhược, kết luận Bát Cương và các thể bệnh. Đây là dữ liệu THẬT (đã ẩn danh bệnh
            nhân) — muốn đo cho bệnh nhân của bạn, hãy đăng nhập.
          </p>
        </header>

        <!-- Thanh chuyển ca (slider) -->
        <div v-if="caseCount > 1" class="dkq-slider-nav">
          <button class="dkq-nav-btn" type="button" aria-label="Ca trước" @click="prevCase">‹</button>
          <div class="dkq-nav-mid">
            <span class="dkq-nav-count">Ca {{ activeIndex + 1 }} / {{ caseCount }}</span>
            <div class="dkq-dots">
              <button
                v-for="i in caseCount"
                :key="i"
                type="button"
                class="dkq-dot"
                :class="{ active: i - 1 === activeIndex }"
                :aria-label="`Xem ca ${i}`"
                @click="goCase(i - 1)"
              ></button>
            </div>
          </div>
          <button class="dkq-nav-btn" type="button" aria-label="Ca kế tiếp" @click="nextCase">›</button>
        </div>
        <p v-if="caseCount > 1" class="dkq-swipe-hint">Vuốt ngang hoặc bấm ‹ › để xem ca khác</p>

        <!-- Vùng nội dung 1 ca — đổi khi lướt slider -->
        <div class="dkq-viewport" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
          <div :key="activeIndex" class="dkq-case" :class="slideDir === 'next' ? 'in-next' : 'in-prev'">
            <!-- Thông tin ca đo -->
            <div class="dkq-meta">
              <span>Bệnh Nhân: <strong>{{ patient?.fullName || 'Bệnh Nhân Mẫu' }}</strong></span>
              <span class="dot">•</span>
              <span>Giới Tính: <strong>{{ patient?.gender || '—' }}</strong></span>
              <span class="dot">•</span>
              <span>Tuổi: <strong>{{ patientAge }}</strong></span>
              <span class="dot">•</span>
              <span>Ngày Đo: <strong>{{ examDate }}</strong></span>
            </div>

        <!-- I. Bảng chỉ số -->
        <section class="dkq-card">
          <h2 class="dkq-sec-title"><span class="dkq-num">I</span> Bảng Chỉ Số Nhiệt Độ</h2>

          <!-- Chi trên -->
          <div class="dkq-group-label">Chi Trên (Tay)</div>
          <div class="dkq-stats">
            <div class="st"><span class="st-k">Max / Min</span><span class="st-v">{{ fmt(upperStats.max, 1) }} / {{ fmt(upperStats.min, 1) }}</span></div>
            <div class="st"><span class="st-k">Biên Độ</span><span class="st-v">{{ fmt(upperStats.range, 1) }}</span></div>
            <div class="st"><span class="st-k">Bình Quân</span><span class="st-v">{{ fmt(upperStats.mean, 2) }}</span></div>
            <div class="st"><span class="st-k">Sai Số</span><span class="st-v">{{ fmt(upperStats.sd, 2) }}</span></div>
            <div class="st"><span class="st-k">Ngưỡng Trên / Dưới</span><span class="st-v">{{ fmt(upperStats.upperBound, 2) }} / {{ fmt(upperStats.lowerBound, 2) }}</span></div>
          </div>
          <div class="dkq-table-wrap">
            <table class="dkq-table">
              <thead>
                <tr>
                  <th>Kinh</th><th>T</th><th>Trái</th><th>TB</th><th>Lệch</th><th>Phải</th><th>P</th><th>|T−P|</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in upperRows" :key="'u-' + i">
                  <td class="td-name">{{ r.name }}</td>
                  <td :class="signClass(r.leftSign)">{{ r.leftSign }}</td>
                  <td>{{ fmt(r.left, 1) }}</td>
                  <td class="td-avg">{{ fmt(r.avg, 2) }}</td>
                  <td :class="r.diff > 0 ? 'sign-high' : (r.diff < 0 ? 'sign-low' : '')">{{ r.diff > 0 ? '+' : '' }}{{ fmt(r.diff, 2) }}</td>
                  <td>{{ fmt(r.right, 1) }}</td>
                  <td :class="signClass(r.rightSign)">{{ r.rightSign }}</td>
                  <td>{{ fmt(r.absDiff, 1) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Chi dưới -->
          <div class="dkq-group-label">Chi Dưới (Chân)</div>
          <div class="dkq-stats">
            <div class="st"><span class="st-k">Max / Min</span><span class="st-v">{{ fmt(lowerStats.max, 1) }} / {{ fmt(lowerStats.min, 1) }}</span></div>
            <div class="st"><span class="st-k">Biên Độ</span><span class="st-v">{{ fmt(lowerStats.range, 1) }}</span></div>
            <div class="st"><span class="st-k">Bình Quân</span><span class="st-v">{{ fmt(lowerStats.mean, 2) }}</span></div>
            <div class="st"><span class="st-k">Sai Số</span><span class="st-v">{{ fmt(lowerStats.sd, 2) }}</span></div>
            <div class="st"><span class="st-k">Ngưỡng Trên / Dưới</span><span class="st-v">{{ fmt(lowerStats.upperBound, 2) }} / {{ fmt(lowerStats.lowerBound, 2) }}</span></div>
          </div>
          <div class="dkq-table-wrap">
            <table class="dkq-table">
              <thead>
                <tr>
                  <th>Kinh</th><th>T</th><th>Trái</th><th>TB</th><th>Lệch</th><th>Phải</th><th>P</th><th>|T−P|</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in lowerRows" :key="'l-' + i">
                  <td class="td-name">{{ r.name }}</td>
                  <td :class="signClass(r.leftSign)">{{ r.leftSign }}</td>
                  <td>{{ fmt(r.left, 1) }}</td>
                  <td class="td-avg">{{ fmt(r.avg, 2) }}</td>
                  <td :class="r.diff > 0 ? 'sign-high' : (r.diff < 0 ? 'sign-low' : '')">{{ r.diff > 0 ? '+' : '' }}{{ fmt(r.diff, 2) }}</td>
                  <td>{{ fmt(r.right, 1) }}</td>
                  <td :class="signClass(r.rightSign)">{{ r.rightSign }}</td>
                  <td>{{ fmt(r.absDiff, 1) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="dkq-legend">
            <span class="sign-high">+</span> Cao (Thực) ·
            <span class="sign-low">−</span> Thấp (Hư) ·
            <span class="sign-zero">0</span> Trong Ngưỡng
          </p>
        </section>

        <!-- II. Bát Cương -->
        <section class="dkq-card">
          <h2 class="dkq-sec-title"><span class="dkq-num">II</span> Kết Luận Bát Cương</h2>
          <div class="dkq-bc-grid">
            <div class="bc"><span class="bc-k">Âm / Dương</span><span class="bc-v">{{ diagnosis.amDuong || '—' }}</span></div>
            <div class="bc"><span class="bc-k">Khí</span><span class="bc-v">{{ diagnosis.khi || '—' }}</span></div>
            <div class="bc"><span class="bc-k">Huyết</span><span class="bc-v">{{ diagnosis.huyet || '—' }}</span></div>
          </div>
          <div class="dkq-tk">
            <div class="tk"><span class="tk-k">Lý Hàn</span><span class="tk-v">{{ batCuong.hanLy || '—' }}</span></div>
            <div class="tk"><span class="tk-k">Biểu Hàn</span><span class="tk-v">{{ batCuong.hanBieu || '—' }}</span></div>
            <div class="tk"><span class="tk-k">Biểu Nhiệt</span><span class="tk-v">{{ batCuong.nhietBieu || '—' }}</span></div>
            <div class="tk"><span class="tk-k">Lý Nhiệt</span><span class="tk-v">{{ batCuong.nhietLy || '—' }}</span></div>
          </div>
        </section>

        <!-- III. Thể bệnh -->
        <section class="dkq-card">
          <h2 class="dkq-sec-title"><span class="dkq-num">III</span> Thể Bệnh Đo Được</h2>

          <h3 class="dkq-sub-label">Mô Hình Bệnh Đông Y</h3>
          <div v-if="excelSyndromes.length" class="dkq-synd-list">
            <div v-for="(s, i) in excelSyndromes" :key="'e-' + (s.code || i)" class="synd">
              <span class="synd-i">{{ i + 1 }}</span>
              <span class="synd-name">{{ s.name }}</span>
              <span v-if="s.outputCell" class="synd-cell">{{ s.outputCell }}</span>
            </div>
          </div>
          <p v-else class="dkq-empty">Không có mô hình Đông Y nào khớp ở ca đo này.</p>

          <h3 class="dkq-sub-label mt">Mô Hình Bệnh Y Học Hiện Đại</h3>
          <div v-if="modernSyndromes.length" class="dkq-synd-list">
            <div v-for="(s, i) in modernSyndromes" :key="'m-' + (s.code || i)" class="synd synd--modern">
              <span class="synd-i">{{ i + 1 }}</span>
              <span class="synd-name">{{ s.name }}</span>
              <span v-if="s.outputCell" class="synd-cell">{{ s.outputCell }}</span>
            </div>
          </div>
          <p v-else class="dkq-empty">Không có mô hình hiện đại nào khớp ở ca đo này.</p>
        </section>
          </div>
        </div>
        <!-- /Vùng nội dung 1 ca -->

        <!-- CTA -->
        <div class="dkq-cta">
          <div>
            <h3 class="dkq-cta-title">Muốn Đo Cho Bệnh Nhân Của Bạn?</h3>
            <p class="dkq-cta-sub">Đăng nhập để nhập số đo, lưu hồ sơ và phân tích tự động cho từng ca khám.</p>
          </div>
          <button class="dkq-cta-btn" @click="goLogin">Đăng Nhập Để Dùng →</button>
        </div>

        <MedicalDisclaimer context="measurement" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.dkq {
  min-height: 100vh;
  background: var(--bg-app);
  color: var(--text);
}
.dkq-body {
  max-width: 920px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-5) var(--space-12);
}

.dkq-loading,
.dkq-error {
  text-align: center;
  padding: var(--space-12) var(--space-4);
  color: var(--text-muted);
}
.dkq-error {
  color: var(--danger);
}
.dkq-spinner {
  width: 36px;
  height: 36px;
  margin: 0 auto var(--space-3);
  border: 3px solid var(--gray-200);
  border-top-color: var(--brown-500);
  border-radius: 50%;
  animation: dkq-spin 0.7s linear infinite;
}
@keyframes dkq-spin {
  to {
    transform: rotate(360deg);
  }
}

.dkq-head {
  text-align: center;
  margin-bottom: var(--space-6);
}
.dkq-eyebrow {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--brown-600);
  margin-bottom: var(--space-2);
}
.dkq-title {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: var(--space-3);
}
.dkq-sub {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  line-height: 1.7;
  max-width: 40rem;
  margin: 0 auto;
}

.dkq-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  justify-content: center;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin-bottom: var(--space-6);
}
.dkq-meta strong {
  color: var(--text-brand);
}
.dkq-meta .dot {
  color: var(--brown-300);
}

.dkq-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-6);
  margin-bottom: var(--space-5);
}
.dkq-sec-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: var(--text);
  margin-bottom: var(--space-5);
}
.dkq-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  background: var(--brown-600);
  color: var(--white);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.dkq-group-label {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--brown-700);
  margin: var(--space-4) 0 var(--space-2);
}
.dkq-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.st {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-2);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  text-align: center;
}
.st-k {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--text-subtle);
}
.st-v {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text-brand);
}

.dkq-table-wrap {
  overflow-x: auto;
}
.dkq-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}
.dkq-table th {
  background: var(--brown-50);
  color: var(--brown-700);
  font-weight: 700;
  font-size: var(--font-size-xs);
  padding: 6px 8px;
  text-align: center;
  border: 1px solid var(--border);
  white-space: nowrap;
}
.dkq-table td {
  padding: 6px 8px;
  text-align: center;
  border: 1px solid var(--border);
  white-space: nowrap;
}
.td-name {
  font-weight: 700;
  color: var(--text);
  text-align: left !important;
}
.td-avg {
  background: var(--surface-2);
  font-weight: 600;
}
.sign-high {
  color: var(--danger-fg, #b4421f);
  font-weight: 800;
}
.sign-low {
  color: var(--info-fg, #2f6f8a);
  font-weight: 800;
}
.sign-zero {
  color: var(--text-subtle);
  font-weight: 700;
}
.dkq-legend {
  margin-top: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  text-align: center;
}
.dkq-legend span {
  margin: 0 2px;
}

.dkq-bc-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.bc {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-4);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  text-align: center;
}
.bc-k {
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-subtle);
}
.bc-v {
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: var(--text-brand);
}
.dkq-tk {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
}
.tk {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}
.tk-k {
  font-weight: 700;
  color: var(--brown-700);
  flex-shrink: 0;
}
.tk-v {
  color: var(--text-muted);
}

.dkq-sub-label {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--brown-700);
  margin-bottom: var(--space-3);
}
.dkq-sub-label.mt {
  margin-top: var(--space-5);
}
.dkq-synd-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.synd {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--chip-pattern-bg, var(--surface-2));
  border: 1px solid var(--chip-pattern-border, var(--border));
  border-radius: var(--radius-md);
}
.synd--modern {
  background: var(--surface-2);
  border-color: var(--border);
}
.synd-i {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--brown-600);
  color: var(--white);
  font-size: var(--font-size-xs);
  font-weight: 700;
  flex-shrink: 0;
}
.synd-name {
  font-weight: 700;
  color: var(--text-brand);
  flex: 1;
  text-transform: capitalize;
}
.synd-cell {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--text-subtle);
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}
.dkq-empty {
  font-size: var(--font-size-sm);
  color: var(--text-subtle);
  font-style: italic;
}

.dkq-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
  padding: var(--space-6);
  background: linear-gradient(135deg, var(--brown-600) 0%, var(--brown-800) 100%);
  color: var(--white);
  border-radius: var(--radius-lg);
  margin-top: var(--space-6);
}
.dkq-cta-title {
  font-size: var(--font-size-lg);
  font-weight: 800;
  margin-bottom: 4px;
}
.dkq-cta-sub {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.82);
}
.dkq-cta-btn {
  height: 48px;
  padding: 0 var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--white);
  color: var(--brown-700);
  font-size: var(--font-size-base);
  font-weight: 700;
  white-space: nowrap;
  transition: transform var(--transition-fast);
}
.dkq-cta-btn:hover {
  transform: translateY(-2px);
}

/* ── Slider chuyển ca ── */
.dkq-slider-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}
.dkq-nav-btn {
  flex: none;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--brown-700);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.dkq-nav-btn:hover {
  background: var(--brown-600);
  color: var(--white);
  border-color: var(--brown-600);
}
.dkq-nav-mid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 120px;
}
.dkq-nav-count {
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--brown-600);
}
.dkq-dots {
  display: flex;
  gap: 6px;
}
.dkq-dot {
  width: 9px;
  height: 9px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--brown-200);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.dkq-dot:hover {
  background: var(--brown-400);
}
.dkq-dot.active {
  background: var(--brown-600);
  transform: scale(1.25);
}
.dkq-swipe-hint {
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--text-subtle);
  margin: 0 0 var(--space-5);
}

.dkq-viewport {
  overflow: hidden;
}
.dkq-case.in-next {
  animation: dkq-in-next 0.26s ease;
}
.dkq-case.in-prev {
  animation: dkq-in-prev 0.26s ease;
}
@keyframes dkq-in-next {
  from { opacity: 0; transform: translateX(26px); }
  to { opacity: 1; transform: none; }
}
@keyframes dkq-in-prev {
  from { opacity: 0; transform: translateX(-26px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .dkq-case.in-next,
  .dkq-case.in-prev {
    animation: none;
  }
}

@media (max-width: 640px) {
  .dkq-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .dkq-bc-grid {
    grid-template-columns: 1fr;
  }
  .dkq-tk {
    grid-template-columns: 1fr;
  }
}
</style>
