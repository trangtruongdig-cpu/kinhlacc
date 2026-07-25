<script setup lang="ts">
/**
 * PatientStatsPanel.vue — DASHBOARD ĐỘNG cho mục "Thống Kê" ở trang Bệnh Nhân.
 *
 * Kiến trúc "bóc lớp" (cross-filtering dashboard): MỌI đại lượng (giới tính, nhóm tuổi, tỉnh/thành,
 * Bát Cương, thể bệnh, tổn thương tạng phủ...) LUÔN có 1 widget riêng hiển thị phân bố của nó — không
 * cần chọn "Nhóm theo" trước mới thấy. Bấm 1 dòng trong bất kỳ widget nào = thêm/bỏ bộ lọc (drill-down)
 * — MỌI widget khác (kể cả widget vừa bấm) tự vẽ lại theo bộ lọc mới, y hệt 1 dashboard BI thật.
 * Bên dưới lưới widget là 1 khung "Xem chi tiết" — phóng to 1 đại lượng đang chọn với đầy đủ 4 kiểu
 * xem (Bảng có %, Cột, Tròn, Donut) + có thể ghép thêm 1 đại lượng thứ 2 để so sánh chéo.
 *
 * Danh sách đại lượng do BACKEND trả về (`dimensions`, xem THONG_KE_DIMENSIONS trong
 * backend/src/controllers/patient.controller.ts) — không tự khai lại ở đây.
 */
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { api } from '@/services/api'
import { loadChartJs, registerChartJs } from '@/composables/useChartJs'
import type { Chart as ChartInstance } from 'chart.js'

interface DimMeta { key: string; label: string; nhom: 'benh-nhan' | 'benh-hoc' }
interface ThongKePivot {
  rows: string
  cols: string | null
  rowLabels: string[]
  colLabels: string[]
  matrix: number[][]
  rowTotals: number[]
  colTotals: number[]
  grandTotal: number
  truncatedRows: boolean
  truncatedCols: boolean
}
interface ThongKeResponse {
  totalPatients: number
  totalExaminations: number
  dimensions: DimMeta[]
  pivot: ThongKePivot
}
interface FilterChip { dim: string; value: string }

const dimensions = ref<DimMeta[]>([])
const dimLabel = (key: string) => dimensions.value.find((d) => d.key === key)?.label ?? key
const patientDims = computed(() => dimensions.value.filter((d) => d.nhom === 'benh-nhan'))
const benhHocDims = computed(() => dimensions.value.filter((d) => d.nhom === 'benh-hoc'))

const filters = ref<FilterChip[]>([])
function filtersQuery(exclude?: string): string {
  return filters.value
    .filter((f) => f.dim !== exclude)
    .map((f) => `${f.dim}:${f.value}`)
    .join(',')
}
function isFilterActive(dim: string, value: string): boolean {
  return filters.value.some((f) => f.dim === dim && f.value === value)
}
function toggleFilter(dim: string, value: string) {
  const idx = filters.value.findIndex((f) => f.dim === dim && f.value === value)
  filters.value = idx >= 0 ? filters.value.filter((_, i) => i !== idx) : [...filters.value, { dim, value }]
}
function removeFilterAt(idx: number) {
  filters.value = filters.value.filter((_, i) => i !== idx)
}

async function fetchPivot(rows: string, opts: { cols?: string; excludeFilterDim?: string } = {}): Promise<ThongKeResponse> {
  const params = new URLSearchParams()
  params.set('rows', rows)
  if (opts.cols) params.set('cols', opts.cols)
  const fq = filtersQuery(opts.excludeFilterDim)
  if (fq) params.set('filters', fq)
  return api.get<ThongKeResponse>(`/patients/thong-ke?${params.toString()}`)
}

// ── Lưới widget: 1 pivot 1-chiều / đại lượng, LOẠI TRỪ bộ lọc của CHÍNH đại lượng đó (để widget vẫn
// hiện đủ lựa chọn kể cả giá trị đang lọc, cho phép đổi/bỏ lọc dễ dàng thay vì chỉ thấy 1 dòng 100%).
// Gọi 1 LẦN qua /patients/thong-ke/grid thay vì 1 request/đại lượng (11 request riêng lẻ) — trên
// backend serverless (Vercel), bắn 11 request gần như đồng thời dễ khiến nó scale ra nhiều instance
// nguội song song, MỖI instance phải tự tính lại toàn bộ dataset (~9.5k ca khám) từ đầu vì cache RAM
// không chia sẻ được giữa các instance — đây là nguyên nhân chính khiến tab "load hơi lâu" trên web đã
// deploy dù chạy nhanh ở local (chỉ 1 instance ấm, cache dùng chung). ──
const widgetPivots = ref<Record<string, ThongKePivot | null>>({})
const totals = ref<{ totalPatients: number; totalExaminations: number } | null>(null)
const bootLoading = ref(true)
const bootError = ref<string | null>(null)

// Bảo vệ chống RACE CONDITION: mỗi lượt loadAll() có 1 "thế hệ" riêng — nếu người dùng bấm lọc dồn
// dập (lượt cũ chưa load xong đã bấm lọc tiếp), kết quả của lượt CŨ bị bỏ qua khi nó về sau lượt MỚI,
// tránh ghi đè dữ liệu mới bằng dữ liệu cũ (bug thường gặp khi thiếu guard này).
let loadGeneration = 0
async function loadAll() {
  const myGen = ++loadGeneration
  bootLoading.value = true
  bootError.value = null
  try {
    const params = new URLSearchParams()
    const fq = filtersQuery()
    if (fq) params.set('filters', fq)
    const res = await api.get<{
      totalPatients: number
      totalExaminations: number
      dimensions: DimMeta[]
      pivots: Record<string, ThongKePivot>
    }>(`/patients/thong-ke/grid?${params.toString()}`)
    if (myGen !== loadGeneration) return
    dimensions.value = res.dimensions
    totals.value = { totalPatients: res.totalPatients, totalExaminations: res.totalExaminations }
    widgetPivots.value = res.pivots
  } catch (e) {
    if (myGen === loadGeneration) bootError.value = e instanceof Error ? e.message : 'Không tải được thống kê.'
  } finally {
    if (myGen === loadGeneration) bootLoading.value = false
  }
}
onMounted(loadAll)
watch(filters, loadAll, { deep: true })

function widgetRows(dim: string): { label: string; count: number; pct: number }[] {
  const p = widgetPivots.value[dim]
  if (!p) return []
  const max = Math.max(1, ...p.rowTotals)
  return p.rowLabels.slice(0, 6).map((label, i) => ({
    label,
    count: p.rowTotals[i] ?? 0,
    pct: Math.round(((p.rowTotals[i] ?? 0) / max) * 100),
  }))
}

// ── Khung "Xem chi tiết": phóng to 1 đại lượng (+ tuỳ chọn 1 đại lượng thứ 2 so sánh chéo) với đầy đủ
// 4 kiểu xem. Tôn trọng CÙNG bộ lọc toàn cục — không loại trừ gì (khác widget, panel này KHÔNG phải
// đại lượng đang lọc nên không cần tự loại trừ chính nó). ──
const focusDim = ref('amDuong')
const focusColsDim = ref('gender')
const focusResult = ref<ThongKeResponse | null>(null)
const focusLoading = ref(true)
const focusError = ref<string | null>(null)

let focusGeneration = 0
async function loadFocus() {
  const myGen = ++focusGeneration
  focusLoading.value = true
  focusError.value = null
  try {
    const res = await fetchPivot(focusDim.value, { cols: focusColsDim.value || undefined })
    if (myGen !== focusGeneration) return
    focusResult.value = res
  } catch (e) {
    if (myGen === focusGeneration) focusError.value = e instanceof Error ? e.message : 'Không tải được.'
  } finally {
    if (myGen === focusGeneration) focusLoading.value = false
  }
}
onMounted(loadFocus)
watch([focusDim, focusColsDim, filters], loadFocus, { deep: true })

function focusOnDim(dim: string) {
  focusDim.value = dim
  document.getElementById('pst-focus-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ── Kiểu hiển thị cho khung "Xem chi tiết": cùng 1 dữ liệu pivot, 4 cách nhìn. ──
type ViewMode = 'table' | 'bar' | 'pie' | 'donut'
const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: 'table', label: '☰ Bảng' },
  { key: 'bar', label: '▤ Cột' },
  { key: 'pie', label: '◕ Tròn' },
  { key: 'donut', label: '◔ Donut' },
]
const viewMode = ref<ViewMode>('table')

const showPercent = ref(false)
const pctBasis = ref<'row' | 'col' | 'total'>('row')
const effectivePctBasis = computed(() => (focusResult.value?.pivot.cols ? pctBasis.value : 'total'))
function cellPercent(r: number, c: number): number {
  const p = focusResult.value?.pivot
  if (!p) return 0
  const val = p.matrix[r]?.[c] ?? 0
  let base = p.grandTotal
  if (effectivePctBasis.value === 'row') base = p.rowTotals[r] || 0
  else if (effectivePctBasis.value === 'col') base = p.colTotals[c] || 0
  return base > 0 ? Math.round((val / base) * 1000) / 10 : 0
}
const rowMax = computed(() => (focusResult.value ? focusResult.value.pivot.matrix.map((row) => Math.max(1, ...row)) : []))
function cellBarPct(r: number, c: number): number {
  const p = focusResult.value?.pivot
  if (!p) return 0
  return Math.round(((p.matrix[r]?.[c] ?? 0) / (rowMax.value[r] ?? 1)) * 100)
}
// Nhắc rõ khi tổng % có thể vượt 100% vì đại lượng ĐA TRỊ (1 ca có thể thuộc nhiều nhóm cùng lúc —
// theBenh, tonThuong*) — tránh người dùng tưởng nhầm là lỗi tính toán.
const MULTI_VALUED_DIMS = new Set(['theBenh', 'tonThuongCombo', 'tonThuongTemp', 'tonThuongDepth'])
const focusIsMultiValued = computed(() => MULTI_VALUED_DIMS.has(focusResult.value?.pivot.rows || ''))

const GENDER_COLOR: Record<string, string> = { Nữ: '#b4452f', Nam: '#2d6e8e', Khác: '#8a4fbf' }
const PALETTE = ['#355a68', '#8a4527', '#3f6140', '#6d4f12', '#5c5440', '#8a4fbf', '#2d6e8e', '#b4452f']
function colorFor(label: string, idx: number): string {
  return GENDER_COLOR[label] || PALETTE[idx % PALETTE.length]!
}

const barCanvas = ref<HTMLCanvasElement | null>(null)
let barChart: ChartInstance | null = null
async function drawBarChart() {
  const p = focusResult.value?.pivot
  if (!p || !p.rowLabels.length) return
  await nextTick()
  // Bảo vệ: nếu người dùng đổi viewMode (rời khỏi "Cột") NGAY LÚC chart.js đang tải lần đầu, canvas
  // có thể đã bị Vue gỡ khỏi DOM lúc await xong — kiểm tra lại SAU await, không chỉ trước.
  if (!barCanvas.value) return
  const mod = await loadChartJs()
  if (!barCanvas.value) return
  const Chart = registerChartJs(mod, [mod.BarController, mod.BarElement, mod.CategoryScale, mod.LinearScale, mod.Tooltip, mod.Legend])
  barChart?.destroy()
  const cols = p.cols ? p.colLabels : ['Số ca']
  barChart = new Chart(barCanvas.value.getContext('2d')!, {
    type: 'bar',
    data: {
      labels: p.rowLabels,
      datasets: cols.map((c, ci) => ({
        label: c,
        data: p.rowLabels.map((_, ri) => p.matrix[ri]?.[ci] ?? 0),
        backgroundColor: colorFor(c, ci),
        borderRadius: 4,
        maxBarThickness: 26,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: cols.length > 1, position: 'top', labels: { font: { size: 11 } } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue} ca` } },
      },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 } },
        y: { ticks: { font: { size: 11 } } },
      },
    },
  })
}

const PIE_MAX_SLICES = 8
const PIE_MAX_SMALL_MULTIPLES = 4
interface PieGroup { title: string; labels: string[]; values: number[]; total: number }
function topSlicesWithOther(labels: string[], values: number[]): { labels: string[]; values: number[] } {
  if (labels.length <= PIE_MAX_SLICES) return { labels, values }
  const pairs = labels.map((l, i) => ({ l, v: values[i] ?? 0 }))
  pairs.sort((a, b) => b.v - a.v)
  const top = pairs.slice(0, PIE_MAX_SLICES - 1)
  const restSum = pairs.slice(PIE_MAX_SLICES - 1).reduce((s, x) => s + x.v, 0)
  return { labels: [...top.map((x) => x.l), 'Khác'], values: [...top.map((x) => x.v), restSum] }
}
const pieAggregatedNote = computed(() => {
  const p = focusResult.value?.pivot
  return !!(p && p.cols && p.colLabels.length > PIE_MAX_SMALL_MULTIPLES)
})
const pieGroups = computed<PieGroup[]>(() => {
  const p = focusResult.value?.pivot
  if (!p || !p.rowLabels.length) return []
  if (!p.cols || p.colLabels.length > PIE_MAX_SMALL_MULTIPLES) {
    const { labels, values } = topSlicesWithOther(p.rowLabels, p.rowTotals)
    return [{ title: dimLabel(p.rows), labels, values, total: p.grandTotal }]
  }
  return p.colLabels.map((c, ci) => {
    const vals = p.rowLabels.map((_, ri) => p.matrix[ri]?.[ci] ?? 0)
    const { labels, values } = topSlicesWithOther(p.rowLabels, vals)
    return { title: c, labels, values, total: p.colTotals[ci] ?? 0 }
  })
})

const pieCanvasEls = ref<(HTMLCanvasElement | null)[]>([])
function setPieCanvasRef(el: Element | null, i: number) {
  pieCanvasEls.value[i] = el as HTMLCanvasElement | null
}
let pieCharts: ChartInstance[] = []
function destroyPieCharts() {
  pieCharts.forEach((c) => c.destroy())
  pieCharts = []
}
async function drawPieCharts() {
  destroyPieCharts()
  const groups = pieGroups.value
  if (!groups.length) return
  await nextTick()
  const mod = await loadChartJs()
  const Chart = registerChartJs(mod, [mod.PieController, mod.DoughnutController, mod.ArcElement, mod.Tooltip, mod.Legend])
  groups.forEach((g, i) => {
    const canvas = pieCanvasEls.value[i]
    if (!canvas) return
    const total = g.values.reduce((a, b) => a + b, 0)
    const colors = g.labels.map((l, li) => (l === 'Khác' ? '#c9c2b4' : colorFor(l, li)))
    const chart = new Chart(canvas.getContext('2d')!, {
      type: viewMode.value === 'donut' ? 'doughnut' : 'pie',
      data: { labels: g.labels, datasets: [{ data: g.values, backgroundColor: colors, borderColor: '#fff', borderWidth: 2 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 10 },
              generateLabels(chart) {
                const data = chart.data
                const values = (data.datasets?.[0]?.data as number[]) || []
                const bg = (data.datasets?.[0]?.backgroundColor as string[]) || []
                return (data.labels as string[]).map((label, idx) => {
                  const v = values[idx] ?? 0
                  const pct = total > 0 ? Math.round((v / total) * 1000) / 10 : 0
                  return { text: `${label} (${pct}%)`, fillStyle: bg[idx], index: idx, hidden: false, strokeStyle: bg[idx] }
                })
              },
            },
          },
          tooltip: {
            callbacks: {
              label(ctx) {
                const v = (ctx.parsed as number) ?? 0
                const pct = total > 0 ? Math.round((v / total) * 1000) / 10 : 0
                return `${ctx.label}: ${v} ca (${pct}%)`
              },
            },
          },
        },
      },
    })
    pieCharts.push(chart)
  })
}

async function drawCharts() {
  if (viewMode.value === 'bar') {
    barChart?.destroy()
    barChart = null
    destroyPieCharts()
    await drawBarChart()
  } else if (viewMode.value === 'pie' || viewMode.value === 'donut') {
    barChart?.destroy()
    barChart = null
    await drawPieCharts()
  } else {
    barChart?.destroy()
    barChart = null
    destroyPieCharts()
  }
}
watch([viewMode, focusResult], drawCharts)
onBeforeUnmount(() => {
  barChart?.destroy()
  destroyPieCharts()
})
</script>

<template>
  <div class="pst-panel">
    <!-- Tổng quan + bộ lọc đang áp dụng -->
    <div class="pst-overview">
      <div class="pst-ov-card">
        <span class="pst-ov-num">{{ (totals?.totalPatients ?? 0).toLocaleString('vi-VN') }}</span>
        <span class="pst-ov-label">Tổng bệnh nhân (có ca khám)</span>
      </div>
      <div class="pst-ov-card">
        <span class="pst-ov-num">{{ (totals?.totalExaminations ?? 0).toLocaleString('vi-VN') }}</span>
        <span class="pst-ov-label">Tổng ca khám</span>
      </div>
      <div class="pst-ov-card" :class="{ 'pst-ov-card--dim': !filters.length }">
        <span class="pst-ov-num">{{ (widgetPivots.amDuong?.grandTotal ?? 0).toLocaleString('vi-VN') }}</span>
        <span class="pst-ov-label">Ca khám khớp bộ lọc hiện tại</span>
      </div>
    </div>

    <div v-if="filters.length" class="pst-filters">
      <span class="pst-filters-label">Đang lọc:</span>
      <span v-for="(f, i) in filters" :key="f.dim + f.value" class="pst-filter-chip">
        {{ dimLabel(f.dim) }} = <b>{{ f.value }}</b>
        <button type="button" class="pst-filter-x" aria-label="Bỏ lọc" @click="removeFilterAt(i)">✕</button>
      </span>
      <button type="button" class="pst-filter-clear" @click="filters = []">Xoá hết</button>
    </div>
    <p class="pst-hint">💡 Bấm vào 1 dòng bất kỳ trong các ô bên dưới để lọc theo giá trị đó — bấm lại để bỏ lọc. Mọi ô sẽ tự cập nhật theo bộ lọc đang chọn.</p>

    <div v-if="bootError" class="pst-error">
      <p>{{ bootError }}</p>
      <button type="button" class="btn-secondary" @click="loadAll">Thử lại</button>
    </div>

    <!-- Lưới widget: MỌI đại lượng luôn hiện -->
    <template v-else>
      <div class="pst-widget-section">
        <h3 class="pst-widget-section-title">Bệnh nhân</h3>
        <div class="pst-widget-grid">
          <div v-for="d in patientDims" :key="d.key" class="pst-widget" :class="{ 'pst-widget--focused': focusDim === d.key }">
            <div class="pst-widget-head">
              <h4 class="pst-widget-title">{{ d.label }}</h4>
              <button type="button" class="pst-widget-zoom" title="Xem chi tiết" @click="focusOnDim(d.key)">🔍</button>
            </div>
            <div v-if="bootLoading" class="pst-widget-loading"><div class="spinner spinner--sm"></div></div>
            <ul v-else-if="widgetRows(d.key).length" class="pst-widget-list">
              <li
                v-for="row in widgetRows(d.key)"
                :key="row.label"
                class="pst-widget-row"
                :class="{ active: isFilterActive(d.key, row.label) }"
                role="button"
                tabindex="0"
                @click="toggleFilter(d.key, row.label)"
                @keydown.enter.prevent="toggleFilter(d.key, row.label)"
                @keydown.space.prevent="toggleFilter(d.key, row.label)"
              >
                <span class="pst-widget-label">{{ row.label }}</span>
                <div class="pst-widget-bar-track"><div class="pst-widget-bar-fill" :style="{ width: row.pct + '%' }"></div></div>
                <span class="pst-widget-count">{{ row.count }}</span>
              </li>
            </ul>
            <p v-else class="pst-widget-empty">Không có dữ liệu.</p>
          </div>
        </div>
      </div>

      <div class="pst-widget-section">
        <h3 class="pst-widget-section-title">Bệnh học</h3>
        <div class="pst-widget-grid">
          <div v-for="d in benhHocDims" :key="d.key" class="pst-widget" :class="{ 'pst-widget--focused': focusDim === d.key }">
            <div class="pst-widget-head">
              <h4 class="pst-widget-title">{{ d.label }}</h4>
              <button type="button" class="pst-widget-zoom" title="Xem chi tiết" @click="focusOnDim(d.key)">🔍</button>
            </div>
            <div v-if="bootLoading" class="pst-widget-loading"><div class="spinner spinner--sm"></div></div>
            <ul v-else-if="widgetRows(d.key).length" class="pst-widget-list">
              <li
                v-for="row in widgetRows(d.key)"
                :key="row.label"
                class="pst-widget-row"
                :class="{ active: isFilterActive(d.key, row.label) }"
                role="button"
                tabindex="0"
                @click="toggleFilter(d.key, row.label)"
                @keydown.enter.prevent="toggleFilter(d.key, row.label)"
                @keydown.space.prevent="toggleFilter(d.key, row.label)"
              >
                <span class="pst-widget-label">{{ row.label }}</span>
                <div class="pst-widget-bar-track"><div class="pst-widget-bar-fill" :style="{ width: row.pct + '%' }"></div></div>
                <span class="pst-widget-count">{{ row.count }}</span>
              </li>
            </ul>
            <p v-else class="pst-widget-empty">Không có dữ liệu.</p>
          </div>
        </div>
      </div>

      <!-- Khung "Xem chi tiết" -->
      <section id="pst-focus-panel" class="pst-focus">
        <div class="pst-controls">
          <label class="pst-control">
            <span class="pst-control-label">Xem chi tiết</span>
            <select v-model="focusDim" class="pst-select">
              <optgroup label="Bệnh nhân">
                <option v-for="d in patientDims" :key="d.key" :value="d.key">{{ d.label }}</option>
              </optgroup>
              <optgroup label="Bệnh học">
                <option v-for="d in benhHocDims" :key="d.key" :value="d.key">{{ d.label }}</option>
              </optgroup>
            </select>
          </label>
          <label class="pst-control">
            <span class="pst-control-label">So sánh chéo với</span>
            <select v-model="focusColsDim" class="pst-select">
              <option value="">— Không so sánh —</option>
              <optgroup label="Bệnh nhân">
                <option v-for="d in patientDims" :key="d.key" :value="d.key">{{ d.label }}</option>
              </optgroup>
              <optgroup label="Bệnh học">
                <option v-for="d in benhHocDims" :key="d.key" :value="d.key">{{ d.label }}</option>
              </optgroup>
            </select>
          </label>
          <div class="pst-control">
            <span class="pst-control-label">Kiểu hiển thị</span>
            <div class="pst-view-tabs">
              <button
                v-for="v in VIEW_MODES"
                :key="v.key"
                type="button"
                class="pst-view-tab"
                :class="{ active: viewMode === v.key }"
                @click="viewMode = v.key"
              >{{ v.label }}</button>
            </div>
          </div>
          <label v-if="viewMode === 'table'" class="pst-control pst-control--pct">
            <span class="pst-control-label">&nbsp;</span>
            <span class="pst-pct-toggle">
              <input v-model="showPercent" type="checkbox" id="pst-pct" />
              <label for="pst-pct">Hiện %</label>
              <select v-if="showPercent && focusResult?.pivot.cols" v-model="pctBasis" class="pst-select pst-select--sm">
                <option value="row">theo hàng</option>
                <option value="col">theo cột</option>
                <option value="total">theo tổng</option>
              </select>
            </span>
          </label>
        </div>

        <div v-if="focusLoading" class="pst-loading"><div class="spinner"></div><p>Đang tải…</p></div>
        <div v-else-if="focusError" class="pst-error"><p>{{ focusError }}</p></div>
        <template v-else-if="focusResult">
          <p v-if="focusResult.pivot.truncatedRows || focusResult.pivot.truncatedCols" class="pst-truncate-note">
            ⚠ Danh mục "{{ dimLabel(focusResult.pivot.rows) }}"{{ focusResult.pivot.cols ? ` / "${dimLabel(focusResult.pivot.cols)}"` : '' }}
            có nhiều giá trị hơn hiển thị — chỉ liệt kê top phổ biến nhất.
          </p>
          <p v-if="(viewMode === 'pie' || viewMode === 'donut') && pieAggregatedNote" class="pst-truncate-note">
            ⚠ "{{ dimLabel(focusResult.pivot.cols || '') }}" có quá nhiều giá trị để tách từng hình — biểu đồ dưới
            đây gộp mọi giá trị lại, chỉ còn phân bố theo "{{ dimLabel(focusResult.pivot.rows) }}". Chọn dạng Bảng/Cột
            để xem chi tiết theo từng giá trị.
          </p>
          <p v-if="focusIsMultiValued" class="pst-truncate-note pst-truncate-note--info">
            ℹ "{{ dimLabel(focusResult.pivot.rows) }}" là đại lượng ĐA TRỊ (1 ca khám có thể thuộc nhiều nhóm cùng
            lúc) — tổng % các dòng có thể vượt 100%, đây không phải lỗi tính toán.
          </p>

          <div v-if="!focusResult.pivot.rowLabels.length" class="pst-empty">Chưa đủ dữ liệu cho tổ hợp đại lượng/bộ lọc này.</div>

          <div v-else-if="viewMode === 'table'" class="pst-table-wrap">
            <table class="pst-table">
              <thead>
                <tr>
                  <th class="pst-th-row">{{ dimLabel(focusResult.pivot.rows) }}</th>
                  <th v-for="(c, ci) in focusResult.pivot.colLabels" :key="c" class="pst-th-col">
                    {{ c }}
                    <span class="pst-th-total">{{ focusResult.pivot.colTotals[ci] }}</span>
                  </th>
                  <th class="pst-th-total-col">Tổng</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, ri) in focusResult.pivot.rowLabels" :key="r">
                  <td class="pst-td-row">{{ r }}</td>
                  <td v-for="(c, ci) in focusResult.pivot.colLabels" :key="c" class="pst-td-cell">
                    <div class="pst-cell-bar" :style="{ width: cellBarPct(ri, ci) + '%' }"></div>
                    <span class="pst-cell-num">
                      {{ focusResult.pivot.matrix[ri]?.[ci] ?? 0 }}
                      <small v-if="showPercent" class="pst-cell-pct">({{ cellPercent(ri, ci) }}%)</small>
                    </span>
                  </td>
                  <td class="pst-td-total">{{ focusResult.pivot.rowTotals[ri] }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else-if="viewMode === 'bar'" class="pst-chart-wrap">
            <canvas ref="barCanvas"></canvas>
          </div>

          <div v-else class="pst-pie-grid">
            <div v-for="(g, i) in pieGroups" :key="g.title" class="pst-pie-card">
              <h4 class="pst-pie-title">{{ g.title }} <span class="pst-pie-total">({{ g.total }} ca)</span></h4>
              <div class="pst-pie-canvas-wrap">
                <canvas :ref="(el) => setPieCanvasRef(el as HTMLCanvasElement | null, i)"></canvas>
              </div>
            </div>
          </div>
        </template>
      </section>
    </template>
  </div>
</template>

<style scoped>
.pst-panel { width: 100%; }

.pst-overview { display: flex; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-3); }
.pst-ov-card {
  flex: 1 1 180px;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: var(--shadow-sm);
}
.pst-ov-card--dim { opacity: 0.6; }
.pst-ov-num { font-size: var(--font-size-2xl); font-weight: 800; color: var(--brown-700); }
.pst-ov-label { font-size: var(--font-size-xs); color: var(--gray-500); font-weight: 600; }

.pst-filters { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: var(--space-2); }
.pst-filters-label { font-size: var(--font-size-xs); font-weight: 700; color: var(--gray-600); }
.pst-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px 4px 12px;
  background: var(--chip-brand-bg);
  color: var(--chip-brand-fg);
  border: 1px solid var(--chip-brand-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
}
.pst-filter-x {
  width: 18px; height: 18px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  color: inherit;
  opacity: 0.7;
}
.pst-filter-x:hover { opacity: 1; background: rgba(0, 0, 0, 0.08); }
.pst-filter-clear { font-size: var(--font-size-2xs); font-weight: 600; color: var(--gray-500); text-decoration: underline; }
.pst-filter-clear:hover { color: var(--danger); }
.pst-hint { font-size: var(--font-size-xs); color: var(--gray-500); margin-bottom: var(--space-4); }

.pst-loading, .pst-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-12) var(--space-4);
  color: var(--gray-500);
}

/* Lưới widget */
.pst-widget-section { margin-bottom: var(--space-5); }
.pst-widget-section-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: var(--space-2);
}
.pst-widget-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-3); }
.pst-widget {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  box-shadow: var(--shadow-sm);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.pst-widget--focused { border-color: var(--brown-400); box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.12); }
.pst-widget-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2); }
.pst-widget-title { font-size: var(--font-size-xs); font-weight: 700; color: var(--brown-800); }
.pst-widget-zoom { font-size: 12px; opacity: 0.5; border-radius: 4px; padding: 2px 4px; }
.pst-widget-zoom:hover { opacity: 1; background: var(--brown-50); }
.pst-widget-loading { display: flex; justify-content: center; padding: var(--space-4) 0; }
.pst-widget-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.pst-widget-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.pst-widget-row:hover { background: var(--brown-50); }
.pst-widget-row.active { background: var(--chip-brand-bg); }
.pst-widget-row.active .pst-widget-label { color: var(--chip-brand-fg); font-weight: 700; }
.pst-widget-label { flex: 1 1 auto; font-size: var(--font-size-2xs); color: var(--gray-700); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 130px; }
.pst-widget-bar-track { flex: 1 1 auto; height: 6px; background: var(--gray-100); border-radius: var(--radius-full); overflow: hidden; min-width: 30px; }
.pst-widget-bar-fill { height: 100%; background: var(--chip-pulse-fg); border-radius: var(--radius-full); }
.pst-widget-count { flex: 0 0 auto; font-size: var(--font-size-2xs); font-weight: 700; color: var(--brown-600); min-width: 28px; text-align: right; }
.pst-widget-empty { font-size: var(--font-size-2xs); color: var(--gray-400); text-align: center; padding: var(--space-3) 0; }

/* Khung xem chi tiết */
.pst-focus { border-top: 2px dashed var(--brown-200); padding-top: var(--space-5); scroll-margin-top: var(--space-4); }
.pst-controls { display: flex; gap: var(--space-4); flex-wrap: wrap; align-items: flex-end; margin-bottom: var(--space-4); }
.pst-control { display: flex; flex-direction: column; gap: 4px; min-width: 180px; }
.pst-control--pct { min-width: unset; }
.pst-control-label { font-size: var(--font-size-2xs); font-weight: 700; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.03em; }
.pst-select {
  padding: 7px 10px;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--black);
  background: var(--white);
}
.pst-select:focus-visible { outline: none; border-color: var(--brown-400); box-shadow: var(--focus-ring); }
.pst-select--sm { font-size: var(--font-size-xs); padding: 5px 8px; }

.pst-view-tabs { display: inline-flex; gap: 2px; background: var(--gray-100); padding: 3px; border-radius: var(--radius-md); }
.pst-view-tab {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background: transparent;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--gray-600);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}
.pst-view-tab:hover { color: var(--brown-700); }
.pst-view-tab.active { background: var(--white); color: var(--brown-700); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }

.pst-pct-toggle { display: inline-flex; align-items: center; gap: 6px; height: 34px; font-size: var(--font-size-xs); color: var(--gray-700); font-weight: 600; }
.pst-pct-toggle input { cursor: pointer; }
.pst-pct-toggle label { cursor: pointer; }

.pst-truncate-note { font-size: var(--font-size-xs); color: var(--warning-fg); background: var(--warning-bg); border: 1px solid var(--warning-border); border-radius: var(--radius-md); padding: var(--space-2) var(--space-3); margin-bottom: var(--space-3); }
.pst-truncate-note--info { color: var(--info-fg); background: var(--info-bg); border-color: var(--info-border); }

.pst-table-wrap {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
}
.pst-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.pst-table th, .pst-table td { padding: var(--space-2) var(--space-3); text-align: left; white-space: nowrap; }
.pst-th-row, .pst-td-row { position: sticky; left: 0; background: var(--surface-2); font-weight: 700; color: var(--brown-800); border-right: 1px solid var(--gray-200); }
.pst-table thead tr { border-bottom: 2px solid var(--gray-200); }
.pst-th-col { font-weight: 700; color: var(--gray-700); text-align: center; }
.pst-th-total { display: block; font-size: var(--font-size-2xs); font-weight: 500; color: var(--gray-400); }
.pst-th-total-col { font-weight: 700; color: var(--brown-700); text-align: right; }
.pst-table tbody tr { border-bottom: 1px solid var(--gray-100); }
.pst-table tbody tr:hover { background: var(--brown-50); }
.pst-td-cell { position: relative; text-align: center; min-width: 90px; }
.pst-cell-bar { position: absolute; inset: 4px 6px; background: var(--chip-pulse-bg); border-radius: 4px; z-index: 0; }
.pst-cell-num { position: relative; z-index: 1; font-weight: 600; color: var(--gray-800); }
.pst-cell-pct { font-weight: 500; color: var(--gray-500); }
.pst-td-total { text-align: right; font-weight: 700; color: var(--brown-700); }
.pst-empty { font-size: var(--font-size-sm); color: var(--gray-500); padding: var(--space-6); text-align: center; }

.pst-chart-wrap {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  height: 420px;
  box-shadow: var(--shadow-sm);
}

.pst-pie-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-4); }
.pst-pie-card {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}
.pst-pie-title { font-size: var(--font-size-sm); font-weight: 700; color: var(--brown-800); text-align: center; margin-bottom: var(--space-2); }
.pst-pie-total { font-weight: 500; color: var(--gray-400); font-size: var(--font-size-xs); }
.pst-pie-canvas-wrap { position: relative; height: 260px; }

@media (max-width: 640px) {
  .pst-controls { flex-direction: column; align-items: stretch; }
  .pst-overview { flex-direction: column; }
}
</style>
