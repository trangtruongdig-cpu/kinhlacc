<script setup lang="ts">
/**
 * DemoBaiThuocView — Trang "Phân Tích Bài Thuốc" CÔNG KHAI (khách chưa đăng nhập).
 *
 * Lấy THẬT từ DB qua endpoint @Public /demo/bai-thuoc (1 bài thuốc kinh điển).
 * Dùng lại ĐÚNG component phân tích thật (BaiThuocAnalysis): Tứ Khí + 3 radar
 * (Ngũ Vị · Quy Kinh · Thăng–Giáng–Phù–Trầm) + bảng Quân–Thần–Tá–Sứ — chế độ chỉ-xem.
 * Muốn tra cứu toàn bộ kho bài thuốc → mời đăng nhập.
 */
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import PublicTopBar from '@/components/PublicTopBar.vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
// Nạp ĐỘNG để chart.js (nặng) không bị gộp vào chunk tải sớm của trang.
const BaiThuocAnalysis = defineAsyncComponent(() => import('@/components/BaiThuocAnalysis.vue'))
import MedicalDisclaimer from '@/components/MedicalDisclaimer.vue'

const router = useRouter()

interface BaiThuoc {
  id: number
  ten_bai_thuoc: string
  nguon_goc?: string | null
  cach_dung?: string | null
  chung_trang?: string | null
  chiTietViThuoc?: unknown[]
  phapTriLinks?: unknown[]
}

const loading = ref(true)
const error = ref<string | null>(null)
const formulas = ref<BaiThuoc[]>([])
const activeIndex = ref(0)
const slideDir = ref<'next' | 'prev'>('next')

const formulaCount = computed(() => formulas.value.length)
const activeFormula = computed<BaiThuoc | null>(() => formulas.value[activeIndex.value] ?? null)

function goLogin() {
  router.push({ name: 'login' })
}

function nextFormula() {
  const n = formulaCount.value
  if (n < 2) return
  slideDir.value = 'next'
  activeIndex.value = (activeIndex.value + 1) % n
}
function prevFormula() {
  const n = formulaCount.value
  if (n < 2) return
  slideDir.value = 'prev'
  activeIndex.value = (activeIndex.value - 1 + n) % n
}
function goFormula(i: number) {
  if (i < 0 || i >= formulaCount.value || i === activeIndex.value) return
  slideDir.value = i > activeIndex.value ? 'next' : 'prev'
  activeIndex.value = i
}

// Lướt ngang (touch) để chuyển bài — bỏ qua nếu thao tác nghiêng về cuộn dọc.
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
  if (!t || formulaCount.value < 2) return
  const dx = t.screenX - touchStartX
  const dy = t.screenY - touchStartY
  if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return
  if (dx < 0) nextFormula()
  else prevFormula()
}

onMounted(async () => {
  try {
    // Ưu tiên endpoint nhiều bài (slider). Nếu backend chưa cập nhật (deploy thủ công
    // trên VPS), lùi về endpoint 1 bài để trang vẫn chạy.
    try {
      const res = await api.get<{ baiThuocList: BaiThuoc[] }>('/demo/bai-thuoc-list?count=5')
      formulas.value = Array.isArray(res?.baiThuocList) ? res.baiThuocList : []
    } catch {
      formulas.value = []
    }
    if (!formulas.value.length) {
      const one = await api.get<{ baiThuoc: BaiThuoc }>('/demo/bai-thuoc')
      if (one?.baiThuoc) formulas.value = [one.baiThuoc]
    }
    if (!formulas.value.length) {
      error.value = 'Chưa có bài thuốc mẫu nào để hiển thị.'
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="dbt">
    <PublicTopBar title="Phân Tích Bài Thuốc" />
    <AppBreadcrumb />

    <div class="dbt-body">
      <div v-if="loading" class="dbt-loading">
        <div class="dbt-spinner" aria-hidden="true"></div>
        <p>Đang tải bài thuốc mẫu…</p>
      </div>

      <div v-else-if="error" class="dbt-error">
        <p><strong>Không tải được bài thuốc mẫu.</strong></p>
        <p>{{ error }}</p>
      </div>

      <template v-else-if="activeFormula">
        <header class="dbt-head">
          <span class="dbt-eyebrow">Kho Bài Thuốc · Bản Xem Thử</span>

          <!-- Thanh chuyển bài (slider) -->
          <div v-if="formulaCount > 1" class="dbt-slider-nav">
            <button class="dbt-nav-btn" type="button" aria-label="Bài trước" @click="prevFormula">‹</button>
            <div class="dbt-nav-mid">
              <span class="dbt-nav-count">Bài {{ activeIndex + 1 }} / {{ formulaCount }}</span>
              <div class="dbt-dots">
                <button
                  v-for="i in formulaCount"
                  :key="i"
                  type="button"
                  class="dbt-dot"
                  :class="{ active: i - 1 === activeIndex }"
                  :aria-label="`Xem bài ${i}`"
                  @click="goFormula(i - 1)"
                ></button>
              </div>
            </div>
            <button class="dbt-nav-btn" type="button" aria-label="Bài kế tiếp" @click="nextFormula">›</button>
          </div>
          <p v-if="formulaCount > 1" class="dbt-swipe-hint">Vuốt ngang hoặc bấm ‹ › để xem bài khác</p>
        </header>

        <!-- Vùng nội dung 1 bài — đổi khi lướt slider -->
        <div class="dbt-viewport" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
          <div :key="activeIndex" class="dbt-case" :class="slideDir === 'next' ? 'in-next' : 'in-prev'">
            <div class="dbt-case-head">
              <h1 class="dbt-title">{{ activeFormula.ten_bai_thuoc }}</h1>
              <p v-if="activeFormula.nguon_goc" class="dbt-meta">Nguồn Gốc: <strong>{{ activeFormula.nguon_goc }}</strong></p>
              <p v-if="activeFormula.cach_dung" class="dbt-meta">Cách Dùng: {{ activeFormula.cach_dung }}</p>
            </div>
            <!-- Phân tích thật (bảng tính vị quy kinh + Quân–Thần–Tá–Sứ), chế độ chỉ-xem -->
            <BaiThuocAnalysis :bai-thuoc="(activeFormula as any)" />
          </div>
        </div>

        <!-- CTA -->
        <div class="dbt-cta">
          <div>
            <h3 class="dbt-cta-title">Còn Hàng Trăm Bài Thuốc Khác</h3>
            <p class="dbt-cta-sub">Đăng nhập để tra cứu toàn bộ kho bài thuốc Đông Y · Tây Y, pháp trị và phân tích chi tiết.</p>
          </div>
          <button class="dbt-cta-btn" @click="goLogin">Đăng Nhập Để Xem Tất Cả →</button>
        </div>

        <MedicalDisclaimer context="formula" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.dbt {
  min-height: 100vh;
  background: var(--bg-app);
  color: var(--text);
}
.dbt-body {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-5) var(--space-12);
}

.dbt-loading,
.dbt-error {
  text-align: center;
  padding: var(--space-12) var(--space-4);
  color: var(--text-muted);
}
.dbt-error {
  color: var(--danger);
}
.dbt-spinner {
  width: 36px;
  height: 36px;
  margin: 0 auto var(--space-3);
  border: 3px solid var(--gray-200);
  border-top-color: var(--brown-500);
  border-radius: 50%;
  animation: dbt-spin 0.7s linear infinite;
}
@keyframes dbt-spin {
  to {
    transform: rotate(360deg);
  }
}

.dbt-head {
  text-align: center;
  margin-bottom: var(--space-6);
}
.dbt-eyebrow {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--brown-600);
  margin-bottom: var(--space-2);
}
.dbt-title {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-brand);
  margin-bottom: var(--space-2);
}
.dbt-meta {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  line-height: 1.6;
}
.dbt-meta strong {
  color: var(--text-brand);
}

/* ── Slider chuyển bài thuốc ── */
.dbt-slider-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-3);
}
.dbt-nav-btn {
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
.dbt-nav-btn:hover {
  background: var(--brown-600);
  color: var(--white);
  border-color: var(--brown-600);
}
.dbt-nav-mid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 120px;
}
.dbt-nav-count {
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--brown-600);
}
.dbt-dots {
  display: flex;
  gap: 6px;
}
.dbt-dot {
  width: 9px;
  height: 9px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--brown-200);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.dbt-dot:hover {
  background: var(--brown-400);
}
.dbt-dot.active {
  background: var(--brown-600);
  transform: scale(1.25);
}
.dbt-swipe-hint {
  margin: var(--space-2) 0 0;
  font-size: var(--font-size-xs);
  color: var(--text-subtle);
}

.dbt-viewport {
  overflow: hidden;
}
.dbt-case-head {
  text-align: center;
  margin-bottom: var(--space-2);
}
.dbt-case.in-next {
  animation: dbt-in-next 0.26s ease;
}
.dbt-case.in-prev {
  animation: dbt-in-prev 0.26s ease;
}
@keyframes dbt-in-next {
  from { opacity: 0; transform: translateX(26px); }
  to { opacity: 1; transform: none; }
}
@keyframes dbt-in-prev {
  from { opacity: 0; transform: translateX(-26px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .dbt-case.in-next,
  .dbt-case.in-prev {
    animation: none;
  }
}

.dbt-cta {
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
.dbt-cta-title {
  font-size: var(--font-size-lg);
  font-weight: 800;
  margin-bottom: 4px;
}
.dbt-cta-sub {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.82);
}
.dbt-cta-btn {
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
.dbt-cta-btn:hover {
  transform: translateY(-2px);
}
</style>
