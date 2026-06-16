<script setup lang="ts">
/**
 * BaiThuocCompare — So sánh 2 bài thuốc: chồng radar (Quy Kinh · Ngũ Vị),
 * đối chiếu Tứ Khí trội, và bảng diff thành phần vị thuốc (gram A vs gram B).
 * Dữ liệu: GET /bai-thuoc/compare?ids=A,B (tính ở backend).
 */
import { ref, onMounted, onBeforeUnmount, computed, nextTick, watch } from 'vue'
import {
  Chart, RadarController, PointElement, LineElement, Filler, Tooltip, Legend, RadialLinearScale,
} from 'chart.js'
import { api } from '@/services/api'

Chart.register(RadarController, PointElement, LineElement, Filler, Tooltip, Legend, RadialLinearScale)

const props = defineProps<{ baseId: number; baseTen: string }>()

const YHCT_KINH_ORDER = [
  'Tâm', 'Can', 'Tỳ', 'Phế', 'Thận', 'Tâm Bào',
  'Đại Trường', 'Tiểu Trường', 'Bàng Quang', 'Đởm', 'Vị', 'Tam Tiêu',
]
const NGU_VI = [
  { key: 'chua', label: 'Chua' }, { key: 'dang', label: 'Đắng' }, { key: 'ngot', label: 'Ngọt' },
  { key: 'cay', label: 'Cay' }, { key: 'man', label: 'Mặn' },
] as const
const TU_KHI_LABEL: Record<string, string> = {
  daiHan: 'Đại hàn', han: 'Hàn', luong: 'Lương', binh: 'Bình', on: 'Ôn', nhiet: 'Nhiệt', daiNhiet: 'Đại nhiệt',
}

interface FormulaA {
  id: number; ten: string
  quyKinhNorm: Record<string, number>
  nguVi: Record<string, number>
  tuKhi: Record<string, number>
}
interface CompResp {
  formulas: FormulaA[]
  composition: Array<{ id: number; ten: string; grams: Array<number | null> }>
}

const COLORS: [string, string] = ['rgba(220, 38, 38, 1)', 'rgba(37, 99, 235, 1)'] // A đỏ, B xanh

const options = ref<Array<{ id: number; ten: string }>>([])
const search = ref('')
const otherId = ref<number | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const data = ref<CompResp | null>(null)

const filteredOptions = computed(() => {
  const q = search.value.trim().toLowerCase()
  const base = options.value.filter((o) => o.id !== props.baseId)
  if (!q) return base.slice(0, 50)
  return base.filter((o) => o.ten.toLowerCase().includes(q)).slice(0, 50)
})

function dominantTuKhi(tk: Record<string, number>): string {
  let best = 'binh', max = -1
  for (const k of Object.keys(TU_KHI_LABEL)) if ((tk[k] ?? 0) > max) { max = tk[k] ?? 0; best = k }
  return max <= 0 ? 'Bình' : (TU_KHI_LABEL[best] ?? 'Bình')
}

async function loadOptions() {
  try {
    const res = await api.get<Array<{ id: number; ten_bai_thuoc: string }>>('/bai-thuoc/options')
    options.value = (Array.isArray(res) ? res : []).map((o) => ({ id: o.id, ten: o.ten_bai_thuoc }))
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

async function runCompare() {
  if (otherId.value == null) return
  loading.value = true
  error.value = null
  try {
    data.value = await api.get<CompResp>(`/bai-thuoc/compare?ids=${props.baseId},${otherId.value}`)
    await nextTick()
    drawCharts()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
    data.value = null
  } finally {
    loading.value = false
  }
}

function pick(id: number) {
  otherId.value = id
  const o = options.value.find((x) => x.id === id)
  search.value = o?.ten ?? ''
  runCompare()
}

// ── Charts ──
const qkRef = ref<HTMLCanvasElement | null>(null)
const nvRef = ref<HTMLCanvasElement | null>(null)
let qkChart: Chart | null = null
let nvChart: Chart | null = null

function destroyCharts() {
  qkChart?.destroy(); nvChart?.destroy(); qkChart = null; nvChart = null
}

function mkRadar(canvas: HTMLCanvasElement | null, labels: string[], series: { name: string; data: number[]; color: string }[]) {
  if (!canvas) return null
  return new Chart(canvas.getContext('2d')!, {
    type: 'radar',
    data: {
      labels,
      datasets: series.map((s, i) => ({
        label: s.name,
        data: s.data,
        borderColor: s.color,
        backgroundColor: s.color.replace('1)', '0.10)'),
        borderWidth: 2,
        borderDash: i === 1 ? [5, 4] : [],
        pointRadius: 2,
      })),
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: true, labels: { font: { size: 10 }, boxWidth: 12 } } },
      scales: { r: { beginAtZero: true, suggestedMax: 1, ticks: { stepSize: 0.2, backdropColor: 'transparent' }, grid: { color: '#E8E2D6' }, pointLabels: { color: '#6B7280', font: { size: 9 } }, angleLines: { color: '#ECE7DC' } } },
    },
  })
}

function drawCharts() {
  destroyCharts()
  const d = data.value
  if (!d || d.formulas.length < 2) return
  const a = d.formulas[0]
  const b = d.formulas[1]
  if (!a || !b) return
  qkChart = mkRadar(qkRef.value, YHCT_KINH_ORDER, [
    { name: a.ten, data: YHCT_KINH_ORDER.map((k) => a.quyKinhNorm[k] || 0), color: COLORS[0] },
    { name: b.ten, data: YHCT_KINH_ORDER.map((k) => b.quyKinhNorm[k] || 0), color: COLORS[1] },
  ])
  nvChart = mkRadar(nvRef.value, NGU_VI.map((v) => v.label), [
    { name: a.ten, data: NGU_VI.map((v) => a.nguVi[v.key] || 0), color: COLORS[0] },
    { name: b.ten, data: NGU_VI.map((v) => b.nguVi[v.key] || 0), color: COLORS[1] },
  ])
}

watch(() => props.baseId, () => { data.value = null; otherId.value = null; search.value = ''; destroyCharts() })
onMounted(loadOptions)
onBeforeUnmount(destroyCharts)
</script>

<template>
  <div class="btc">
    <div class="btc-pickbar">
      <div class="btc-base">
        <span class="btc-dot" :style="{ background: COLORS[0] }"></span>
        <strong>{{ baseTen }}</strong>
        <span class="btc-base-tag">bài gốc</span>
      </div>
      <span class="btc-vs">so với</span>
      <div class="btc-picker">
        <span class="btc-dot" :style="{ background: COLORS[1] }"></span>
        <input v-model="search" type="text" class="btc-input" placeholder="Chọn bài thuốc để so sánh…" />
        <ul v-if="search && otherId == null" class="btc-dropdown">
          <li v-for="o in filteredOptions" :key="o.id">
            <button type="button" @click="pick(o.id)">{{ o.ten }}</button>
          </li>
          <li v-if="!filteredOptions.length" class="btc-empty">Không tìm thấy</li>
        </ul>
      </div>
      <button v-if="otherId != null" type="button" class="btc-clear" @click="otherId = null; search = ''; data = null; destroyCharts()">Đổi bài</button>
    </div>

    <div v-if="loading" class="btc-msg">Đang so sánh…</div>
    <div v-else-if="error" class="btc-msg btc-err">{{ error }}</div>
    <div v-else-if="!data" class="btc-msg">Chọn một bài thuốc thứ hai để bắt đầu so sánh.</div>

    <template v-else>
      <div class="btc-tukhi">
        <div v-for="(f, i) in data.formulas" :key="f.id" class="btc-tukhi-item">
          <span class="btc-dot" :style="{ background: COLORS[i] }"></span>
          <span class="btc-tukhi-name">{{ f.ten }}</span>
          <span class="btc-tukhi-val">Tứ khí trội: <strong>{{ dominantTuKhi(f.tuKhi) }}</strong></span>
        </div>
      </div>

      <div class="btc-radars">
        <div class="btc-radar"><div class="btc-radar-title">Quy Kinh</div><div class="btc-radar-canvas"><canvas ref="qkRef"></canvas></div></div>
        <div class="btc-radar"><div class="btc-radar-title">Ngũ Vị</div><div class="btc-radar-canvas"><canvas ref="nvRef"></canvas></div></div>
      </div>

      <div class="btc-diff">
        <div class="btc-diff-title">Đối chiếu thành phần (gram)</div>
        <table class="btc-table">
          <thead>
            <tr>
              <th>Vị thuốc</th>
              <th><span class="btc-dot" :style="{ background: COLORS[0] }"></span>{{ data.formulas[0]?.ten }}</th>
              <th><span class="btc-dot" :style="{ background: COLORS[1] }"></span>{{ data.formulas[1]?.ten }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in data.composition" :key="row.id" :class="{
              'btc-shared': row.grams[0] != null && row.grams[1] != null,
              'btc-only-a': row.grams[0] != null && row.grams[1] == null,
              'btc-only-b': row.grams[0] == null && row.grams[1] != null,
            }">
              <td>{{ row.ten }}</td>
              <td>{{ row.grams[0] != null ? row.grams[0] + 'g' : '—' }}</td>
              <td>{{ row.grams[1] != null ? row.grams[1] + 'g' : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.btc { display: flex; flex-direction: column; gap: 12px; }
.btc-pickbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.btc-base, .btc-picker, .btc-tukhi-item { display: flex; align-items: center; gap: 6px; }
.btc-base strong { color: var(--brown-800, #5b3a1a); }
.btc-base-tag { font-size: 10px; color: var(--gray-500); border: 1px solid var(--border, #e5e0d6); border-radius: 4px; padding: 1px 5px; }
.btc-vs { font-size: 12px; color: var(--gray-500); }
.btc-picker { position: relative; }
.btc-input { width: 240px; max-width: 50vw; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border, #e5e0d6); border-radius: 8px; }
.btc-dropdown { position: absolute; top: 110%; left: 0; right: 0; z-index: 20; max-height: 240px; overflow: auto; margin: 0; padding: 4px; list-style: none; background: #fff; border: 1px solid var(--border, #e5e0d6); border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.1); }
.btc-dropdown li button { display: block; width: 100%; text-align: left; padding: 6px 8px; font-size: 13px; border: 0; background: transparent; cursor: pointer; border-radius: 6px; }
.btc-dropdown li button:hover { background: var(--brown-50, #f7f3ec); }
.btc-empty { padding: 6px 8px; font-size: 12px; color: var(--gray-400); }
.btc-clear { font-size: 12px; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border, #e5e0d6); background: #fff; cursor: pointer; }
.btc-msg { padding: 24px; text-align: center; color: var(--gray-500); font-size: 13px; }
.btc-err { color: var(--danger, #b91c1c); }
.btc-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex: none; }
.btc-tukhi { display: flex; flex-wrap: wrap; gap: 16px; font-size: 12px; }
.btc-tukhi-name { color: var(--brown-700, #6b4f2a); font-weight: 600; }
.btc-tukhi-val { color: var(--gray-600); }
.btc-radars { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 720px) { .btc-radars { grid-template-columns: 1fr; } }
.btc-radar { border: 1px solid var(--border, #e5e0d6); border-radius: 10px; padding: 8px; background: #fff; }
.btc-radar-title { font-size: 12px; font-weight: 700; color: var(--brown-700, #6b4f2a); margin-bottom: 4px; }
.btc-radar-canvas { height: 260px; }
.btc-diff-title { font-size: 13px; font-weight: 700; color: var(--brown-800, #5b3a1a); margin-bottom: 6px; }
.btc-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.btc-table th, .btc-table td { text-align: left; padding: 5px 8px; border-bottom: 1px solid var(--border, #efe9dd); }
.btc-table th { font-size: 11px; color: var(--gray-500); font-weight: 600; }
.btc-table th .btc-dot { margin-right: 5px; }
.btc-only-a { background: rgba(220, 38, 38, 0.06); }
.btc-only-b { background: rgba(37, 99, 235, 0.06); }
.btc-shared td:first-child { font-weight: 600; color: var(--brown-800, #5b3a1a); }
</style>
