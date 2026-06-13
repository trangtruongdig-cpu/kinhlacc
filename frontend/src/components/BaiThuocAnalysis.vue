<script setup lang="ts">
/**
 * BaiThuocAnalysis — Bảng phân tích bài thuốc (CHỈ-XEM) dùng cho trang công khai.
 *
 * Tái hiện đúng modal "Phân tích" trong Quản Lý Thuốc (MedicinesView): Tứ Khí + 3 radar
 * (Ngũ Vị · Quy Kinh · Thăng–Giáng–Phù–Trầm) + bảng Quân–Thần–Tá–Sứ. Bản này KHÔNG có
 * sửa gram / kéo radar (đó là tính năng nội bộ); chỉ hiển thị phân tích gốc của bài thuốc.
 * Thuật toán giữ NGUYÊN theo MedicinesView để kết quả khớp 1-1.
 */
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  Chart,
  RadarController,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  RadialLinearScale,
} from 'chart.js'

Chart.register(RadarController, PointElement, LineElement, Filler, Tooltip, Legend, RadialLinearScale)

interface ViThuocLite {
  id: number
  ten_vi_thuoc: string
  tinh?: string | null
  vi?: string | null
  quy_kinh?: string | null
  kiengKyLinks?: { ghi_chu?: string | null; kiengKy?: { ten_kieng_ky?: string | null } | null }[] | null
}
interface ChiTietLite {
  id_vi_thuoc?: number
  idViThuoc?: number
  lieu_luong?: string | null
  vai_tro?: string | null
  quy_kinh?: string | null
  viThuoc?: ViThuocLite | null
}
interface PhapTriLink {
  thuTu?: number
  phapTri?: { chung_trang?: string | null } | null
}
interface BaiThuocLite {
  id: number
  ten_bai_thuoc: string
  chung_trang?: string | null
  chiTietViThuoc?: ChiTietLite[] | null
  phapTriLinks?: PhapTriLink[] | null
  benhTayY?: string[] | null // Tên bệnh Tây Y bài thuốc điều trị (chỉ có ở dữ liệu demo)
}

// hideDosage: ẩn TOÀN BỘ bảng "Quân–Thần–Tá–Sứ" (cột bên phải) — dùng cho khối nhúng gọn ở landing,
// khi đó cột trái (các radar) giãn full. Trang /xem-bai-thuoc để mặc định → vẫn hiện đầy đủ bảng.
const props = defineProps<{ baiThuoc: BaiThuocLite | null; hideDosage?: boolean }>()

// ─────────────────────────── Hằng số + hàm thuần (copy từ MedicinesView) ───────────────────────────
const YHCT_KINH_ORDER = [
  'Tâm', 'Can', 'Tỳ', 'Phế', 'Thận', 'Tâm Bào',
  'Đại Trường', 'Tiểu Trường', 'Bàng Quang', 'Đởm', 'Vị', 'Tam Tiêu',
] as const

const YHCT_KINH_ALIAS: Record<string, string> = {
  'tam': 'Tâm', 'tâm': 'Tâm', 'can': 'Can', 'ty': 'Tỳ', 'tỳ': 'Tỳ',
  'phe': 'Phế', 'phế': 'Phế', 'than': 'Thận', 'thận': 'Thận',
  'tambao': 'Tâm Bào', 'tâm bào': 'Tâm Bào', 'tam bao': 'Tâm Bào',
  'daitrang': 'Đại Trường', 'đại trường': 'Đại Trường', 'dai truong': 'Đại Trường',
  'tieutruong': 'Tiểu Trường', 'tiểu trường': 'Tiểu Trường', 'tieu truong': 'Tiểu Trường',
  'bangquang': 'Bàng Quang', 'bàng quang': 'Bàng Quang', 'bang quang': 'Bàng Quang',
  'dam': 'Đởm', 'đởm': 'Đởm', 'vi': 'Vị', 'vị': 'Vị',
  'tamtieu': 'Tam Tiêu', 'tam tiêu': 'Tam Tiêu',
}
function normalizeKinh(raw: string): string {
  const s = (raw || '').trim()
  return YHCT_KINH_ALIAS[s.toLowerCase()] ?? s
}

const ROLE_COLORS: Record<string, string> = {
  'Quân': '#DC2626', 'Thần': '#F97316', 'Tá': '#16A34A', 'Sứ': '#2563EB',
}

function parseLieuToGram(s: string | null | undefined): number {
  if (!s) return 9
  const t = s.toString().trim().toLowerCase().replace(',', '.')
  if (t === '*') return 2.25
  if (t === '#') return 22.5
  let m: RegExpMatchArray | null
  m = t.match(/^([\d.]+)\s*(?:lượng|lạng)\b/); if (m && m[1]) return parseFloat(m[1]) * 30
  m = t.match(/^([\d.]+)\s*(?:tiền|chỉ)\b/); if (m && m[1]) return parseFloat(m[1]) * 3
  m = t.match(/^([\d.]+)/); if (m && m[1]) return parseFloat(m[1])
  return 9
}

function classifyVi(v: string): 'chua' | 'dang' | 'ngot' | 'cay' | 'man' | null {
  const s = v.trim().toLowerCase()
  if (!s) return null
  if (s.includes('chua') || s.includes('toan')) return 'chua'
  if (s.includes('đắng') || s.includes('dang') || s.includes('khổ') || s.includes('kho')) return 'dang'
  if (s.includes('ngọt') || s.includes('ngot') || s.includes('cam')) return 'ngot'
  if (s.includes('cay') || s.includes('tân') || s.includes('tan')) return 'cay'
  if (s.includes('mặn') || s.includes('man') || s.includes('hàm') || s.includes('ham')) return 'man'
  return null
}

function addNguViBucket(bucket: { chua: number; dang: number; ngot: number; cay: number; man: number }, viRaw: string, wPct: number) {
  const parts = String(viRaw || '').split(/[,;，、]/).map((s) => s.trim()).filter(Boolean)
  if (!parts.length) return
  const uniq = [...new Set(parts.map((s) => s.toLowerCase()))]
  const keys: ('chua' | 'dang' | 'ngot' | 'cay' | 'man')[] = []
  for (const v of uniq) {
    const k = classifyVi(v)
    if (k) keys.push(k)
  }
  if (!keys.length) return
  const each = wPct / keys.length
  for (const k of keys) bucket[k] += each
}

function addTgptBucket(bucket: { thang: number; phu: number; giang: number; tram: number }, item: { tinh: string; quy_kinh: string }, wPct: number) {
  const tinh = (item.tinh || '').toLowerCase()
  const qk = (item.quy_kinh || '').toLowerCase()
  if (tinh.includes('ôn') || tinh.includes('on') || tinh.includes('nóng') || tinh.includes('nong')) { bucket.thang += wPct * 0.35; bucket.phu += wPct * 0.35 }
  if (tinh.includes('hàn') || tinh.includes('han') || tinh.includes('lương') || tinh.includes('luong')) { bucket.giang += wPct * 0.35; bucket.tram += wPct * 0.35 }
  if (qk.includes('phế') || qk.includes('phe') || qk.includes('tâm')) bucket.thang += wPct * 0.15
  if (qk.includes('thận') || qk.includes('than') || qk.includes('bàng quang') || qk.includes('bang quang')) bucket.tram += wPct * 0.15
  const base = wPct * 0.15
  bucket.thang += base; bucket.giang += base; bucket.phu += base; bucket.tram += base
}

const TU_KHI_SEGS = [
  { key: 'daiHan' as const, vn: 'Đại Hàn', zh: '大寒', c: '#1565C0' },
  { key: 'han' as const, vn: 'Hàn', zh: '寒', c: '#29B6F6' },
  { key: 'luong' as const, vn: 'Lương', zh: '凉', c: '#26A69A' },
  { key: 'binh' as const, vn: 'Bình', zh: '平', c: '#E6E38A' },
  { key: 'on' as const, vn: 'Ôn', zh: '温', c: '#FFB74D' },
  { key: 'nhiet' as const, vn: 'Nhiệt', zh: '热', c: '#FF7043' },
  { key: 'daiNhiet' as const, vn: 'Đại Nhiệt', zh: '大热', c: '#C62828' },
]

interface VtRow {
  id: number
  ten: string
  gram: number
  pct: number
  vai_tro: 'Quân' | 'Thần' | 'Tá' | 'Sứ'
  vai_tro_nhap: string
  color: string
  quy_kinh: string
}
interface Result {
  empty: boolean
  ten: string
  W: number
  quyKinhNorm: Record<string, number>
  viThuocList: VtRow[]
  tuKhi: { daiHan: number; han: number; luong: number; binh: number; on: number; nhiet: number; daiNhiet: number }
  nguVi: { chua: number; dang: number; ngot: number; cay: number; man: number }
  tgpt: { thang: number; phu: number; giang: number; tram: number }
  chungTrang: string
  kiengKy: string[]
}

function analyze(bt: BaiThuocLite | null): Result | null {
  if (!bt) return null
  const details = bt.chiTietViThuoc ?? []
  const items = details
    .map((d) => {
      const vt = d.viThuoc ?? null
      return vt && vt.id ? { d, vt, gram: parseLieuToGram(d.lieu_luong) } : null
    })
    .filter((x): x is { d: ChiTietLite; vt: ViThuocLite; gram: number } => !!x)

  if (!items.length) {
    return {
      empty: true, ten: bt.ten_bai_thuoc, W: 0, quyKinhNorm: {}, viThuocList: [],
      tuKhi: { daiHan: 0, han: 0, luong: 0, binh: 0, on: 0, nhiet: 0, daiNhiet: 0 },
      nguVi: { chua: 0, dang: 0, ngot: 0, cay: 0, man: 0 },
      tgpt: { thang: 0, phu: 0, giang: 0, tram: 0 },
      chungTrang: '', kiengKy: [],
    }
  }

  const W = items.reduce((s, x) => s + x.gram, 0) || 1

  // Quy kinh — tích lũy theo gram, chuẩn hoá về 0–1.
  const qkRaw: Record<string, number> = {}
  YHCT_KINH_ORDER.forEach((k) => { qkRaw[k] = 0 })
  for (const { d, vt, gram } of items) {
    const qkStr = vt.quy_kinh || d.quy_kinh || ''
    qkStr.split(/[,;，、]/).map((k) => k.trim()).filter(Boolean).forEach((k) => {
      const norm = normalizeKinh(k)
      if (norm in qkRaw) qkRaw[norm] = (qkRaw[norm] ?? 0) + gram
      else {
        const found = YHCT_KINH_ORDER.find((ref) => norm.includes(ref) || ref.includes(norm))
        if (found) qkRaw[found] = (qkRaw[found] ?? 0) + gram
      }
    })
  }
  const qkMax = Math.max(...Object.values(qkRaw), 0.01)
  const quyKinhNorm: Record<string, number> = {}
  YHCT_KINH_ORDER.forEach((k) => { quyKinhNorm[k] = Math.round(((qkRaw[k] ?? 0) / qkMax) * 10) / 10 })

  // Vai trò Quân – Thần – Tá – Sứ.
  const sorted = [...items].sort((a, b) => b.gram - a.gram)
  const quanQK = (sorted[0]?.vt?.quy_kinh || '').split(/[,;，、]/).map((k) => normalizeKinh(k.trim()))
  const roleMap: Record<number, 'Quân' | 'Thần' | 'Tá' | 'Sứ'> = {}
  sorted.forEach((x, i) => {
    const ten = (x.vt.ten_vi_thuoc || '').toLowerCase()
    const pct = x.gram / W
    const vtQK = (x.vt.quy_kinh || '').split(/[,;，、]/).map((k) => normalizeKinh(k.trim()))
    if (i === 0) roleMap[x.vt.id] = 'Quân'
    else if ((ten.includes('cam thảo') || ten.includes('đại táo')) && pct < 0.1) roleMap[x.vt.id] = 'Sứ'
    else if (pct >= 0.15 && vtQK.some((k) => quanQK.includes(k))) roleMap[x.vt.id] = 'Thần'
    else roleMap[x.vt.id] = 'Tá'
  })

  const viThuocList: VtRow[] = items.map(({ d, vt, gram }) => ({
    id: vt.id,
    ten: vt.ten_vi_thuoc || '—',
    gram,
    pct: Math.round((gram / W) * 100),
    vai_tro: roleMap[vt.id] ?? 'Tá',
    vai_tro_nhap: (d.vai_tro || '').trim(),
    color: ROLE_COLORS[roleMap[vt.id] ?? 'Tá'] ?? '#9CA3AF',
    quy_kinh: vt.quy_kinh || '',
  }))

  const tuKhi = { daiHan: 0, han: 0, luong: 0, binh: 0, on: 0, nhiet: 0, daiNhiet: 0 }
  const nguVi = { chua: 0, dang: 0, ngot: 0, cay: 0, man: 0 }
  const tgpt = { thang: 0, phu: 0, giang: 0, tram: 0 }

  const addTuKhi = (tinhRaw: string, wPct: number) => {
    const t = (tinhRaw || '').trim().toLowerCase()
    if (!t) return
    if (t.includes('đại hàn') || t.includes('dai han')) { tuKhi.daiHan += wPct; return }
    if (t.includes('hơi hàn') || t.includes('hoi han')) { tuKhi.han += wPct * 0.7; tuKhi.luong += wPct * 0.3; return }
    if (t.includes('hàn') || t.includes('han')) { tuKhi.han += wPct; return }
    if (t.includes('lương') || t.includes('luong')) { tuKhi.luong += wPct; return }
    if (t.includes('bình') || t.includes('binh')) { tuKhi.binh += wPct; return }
    if (t.includes('đại nhiệt') || t.includes('dai nhiet')) { tuKhi.daiNhiet += wPct; return }
    if (t.includes('nhiệt') || t.includes('nhiet') || t.includes('nóng') || t.includes('nong')) { tuKhi.nhiet += wPct; return }
    if (t.includes('hơi ôn') || t.includes('hoi on')) { tuKhi.on += wPct * 0.7; tuKhi.binh += wPct * 0.3; return }
    if (t.includes('ôn') || t.includes('on')) { tuKhi.on += wPct; return }
    tuKhi.binh += wPct
  }

  for (const { vt, gram } of items) {
    const wPct = gram / W
    addTuKhi(vt.tinh || '', wPct)
    addNguViBucket(nguVi, vt.vi || '', wPct)
    addTgptBucket(tgpt, { tinh: vt.tinh || '', quy_kinh: vt.quy_kinh || '' }, wPct)
  }

  // Chứng trạng: gộp từ bài thuốc + pháp trị liên kết.
  const ctParts = [
    (bt.chung_trang || '').trim(),
    ...[...(bt.phapTriLinks ?? [])]
      .sort((a, b) => (a.thuTu ?? 0) - (b.thuTu ?? 0))
      .map((l) => (l.phapTri?.chung_trang || '').trim()),
  ].filter(Boolean)
  const chungTrang = [...new Set(ctParts.join(', ').split(/[,;]+/).map((s) => s.trim()).filter(Boolean))].join(', ')

  // Kiêng kỵ: trực tiếp từ các vị thuốc.
  const seenKk = new Set<string>()
  const kiengKy: string[] = []
  for (const { vt } of items) {
    for (const l of vt.kiengKyLinks ?? []) {
      const n = (l.kiengKy?.ten_kieng_ky || '').trim()
      if (!n) continue
      const g = (l.ghi_chu || '').trim()
      const display = g ? `${n} (${g})` : n
      const key = display.toLowerCase()
      if (seenKk.has(key)) continue
      seenKk.add(key)
      kiengKy.push(display)
    }
  }
  kiengKy.sort((a, b) => a.localeCompare(b, 'vi'))

  return { empty: false, ten: bt.ten_bai_thuoc, W, quyKinhNorm, viThuocList, tuKhi, nguVi, tgpt, chungTrang, kiengKy }
}

const result = computed(() => analyze(props.baiThuoc))

// Bệnh Tây Y (chỉ có ở dữ liệu demo) — hiện thành chip ở phần "5) Tổng Hợp".
const benhTayY = computed(() =>
  (props.baiThuoc?.benhTayY ?? []).map((s) => (s || '').trim()).filter(Boolean),
)

const tuKhiVals = computed(() => {
  const tk = result.value?.tuKhi
  if (!tk) return TU_KHI_SEGS.map(() => 0)
  return TU_KHI_SEGS.map((s) => Number(tk[s.key]) || 0)
})
const tuKhiTipIdx = computed(() => {
  let idx = 3
  let maxV = -1
  tuKhiVals.value.forEach((v, i) => { if (v > maxV) { maxV = v; idx = i } })
  return maxV <= 0 ? 3 : idx
})

const sortedRows = computed(() => {
  const order: Record<string, number> = { 'Quân': 0, 'Thần': 1, 'Tá': 2, 'Sứ': 3 }
  return [...(result.value?.viThuocList ?? [])].sort(
    (a, b) => (order[a.vai_tro] ?? 3) - (order[b.vai_tro] ?? 3) || b.gram - a.gram,
  )
})
const totalGram = computed(() => result.value?.W ?? 0)

function normalizeVaiTroNhap(raw: string): 'Quân' | 'Thần' | 'Tá' | 'Sứ' | '' {
  const t = (raw || '').trim().toLowerCase()
  if (!t) return ''
  if (t.includes('quân') || t.includes('quan')) return 'Quân'
  if (t.includes('thần') || t.includes('than')) return 'Thần'
  if (t.includes('sứ') || t === 'su') return 'Sứ'
  if (t.includes('tá') || t === 'ta') return 'Tá'
  return ''
}
function vaiTroNhapColor(raw: string): string {
  const k = normalizeVaiTroNhap(raw)
  return k ? (ROLE_COLORS[k] ?? '#9CA3AF') : '#9CA3AF'
}
function vaiTroMatch(v: VtRow): boolean {
  const k = normalizeVaiTroNhap(v.vai_tro_nhap)
  return !k || k === v.vai_tro
}

// ─────────────────────────── Radar charts (chỉ-xem) ───────────────────────────
const radarNguViRef = ref<HTMLCanvasElement | null>(null)
const radarQuyKinhRef = ref<HTMLCanvasElement | null>(null)
const radarTgptRef = ref<HTMLCanvasElement | null>(null)
let chartNguVi: Chart | null = null
let chartQuyKinh: Chart | null = null
let chartTgpt: Chart | null = null

const baseOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    r: {
      beginAtZero: true,
      suggestedMax: 1,
      ticks: { stepSize: 0.2, backdropColor: 'transparent' },
      grid: { color: '#E8E2D6' },
      pointLabels: { color: '#6B7280', font: { size: 10 } },
      angleLines: { color: '#ECE7DC' },
    },
  },
} as const

function destroyCharts() {
  for (const c of [chartNguVi, chartQuyKinh, chartTgpt]) {
    if (c) try { c.destroy() } catch { /* noop */ }
  }
  chartNguVi = null
  chartQuyKinh = null
  chartTgpt = null
}

function mkRadar(canvas: HTMLCanvasElement | null, labels: string[], data: number[], color: string): Chart | null {
  if (!canvas) return null
  return new Chart(canvas.getContext('2d')!, {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        data: data.map((x) => Number(x) || 0),
        borderColor: color,
        backgroundColor: color.replace('1)', '0.12)'),
        borderWidth: 2,
        pointRadius: 2,
      }],
    },
    options: baseOpts,
  })
}

function buildCharts() {
  destroyCharts()
  const r = result.value
  if (!r || r.empty) return
  chartNguVi = mkRadar(radarNguViRef.value, ['Chua', 'Đắng', 'Ngọt', 'Cay', 'Mặn'],
    [r.nguVi.chua, r.nguVi.dang, r.nguVi.ngot, r.nguVi.cay, r.nguVi.man], 'rgba(239, 68, 68, 1)')
  chartQuyKinh = mkRadar(radarQuyKinhRef.value, [...YHCT_KINH_ORDER],
    YHCT_KINH_ORDER.map((k) => r.quyKinhNorm[k] || 0), 'rgba(234, 179, 8, 1)')
  chartTgpt = mkRadar(radarTgptRef.value, ['Thăng', 'Phù', 'Giáng', 'Trầm'],
    [r.tgpt.thang, r.tgpt.phu, r.tgpt.giang, r.tgpt.tram], 'rgba(59, 130, 246, 1)')
}

watch(result, () => nextTick(buildCharts))
onMounted(() => nextTick(buildCharts))
onBeforeUnmount(destroyCharts)
</script>

<template>
  <div v-if="result && !result.empty" class="ana-root">
    <!-- 1) Tứ khí -->
    <div class="ana-card">
      <div class="ana-section-title">1) Phân Tích Tứ Khí</div>
      <div class="tukhi-strip">
        <div class="tukhi-row">
          <div v-for="(seg, i) in TU_KHI_SEGS" :key="'arrow-' + seg.key" class="tukhi-arrow">
            <span v-if="i === tuKhiTipIdx" class="tukhi-arrow-mark">▼</span>
          </div>
        </div>
        <div class="tukhi-row">
          <div v-for="seg in TU_KHI_SEGS" :key="'color-' + seg.key" class="tukhi-bar" :style="{ background: seg.c }"></div>
        </div>
        <div class="tukhi-row tukhi-labels">
          <div v-for="seg in TU_KHI_SEGS" :key="'label-' + seg.key" class="tukhi-label">
            <div class="tukhi-label-vn">{{ seg.vn }}</div>
            <div class="tukhi-label-zh">({{ seg.zh }})</div>
          </div>
        </div>
      </div>
    </div>

    <div class="ana-layout" :class="{ 'ana-layout--solo': hideDosage }">
      <div class="ana-left">
        <div class="ana-card ana-radar-card">
          <div class="ana-radar-side"><div class="ana-section-title">2) Ngũ Vị</div></div>
          <div class="ana-radar-canvas-wrap"><canvas ref="radarNguViRef"></canvas></div>
        </div>
        <div class="ana-card ana-radar-card">
          <div class="ana-radar-side"><div class="ana-section-title">3) Quy Kinh</div></div>
          <div class="ana-radar-canvas-wrap"><canvas ref="radarQuyKinhRef"></canvas></div>
        </div>
        <div class="ana-card ana-radar-card">
          <div class="ana-radar-side"><div class="ana-section-title">4) Thăng – Giáng – Phù – Trầm</div></div>
          <div class="ana-radar-canvas-wrap"><canvas ref="radarTgptRef"></canvas></div>
        </div>

        <div v-if="benhTayY.length || result.chungTrang || result.kiengKy.length" class="ana-card">
          <div class="ana-section-title">5) Tổng Hợp</div>
          <template v-if="benhTayY.length">
            <div class="ana-sub-title">Bệnh (Tây Y)</div>
            <div class="ana-chip-row">
              <span v-for="(b, i) in benhTayY" :key="'tyy-' + i" class="ana-chip ana-chip-tayy">{{ b }}</span>
            </div>
          </template>
          <template v-if="result.chungTrang">
            <div class="ana-sub-title">Chứng Trạng</div>
            <div class="ana-chip-row">
              <span
                v-for="(p, i) in result.chungTrang.split(/[,;]+/).map((s) => s.trim()).filter(Boolean)"
                :key="'ct-' + i"
                class="ana-chip ana-chip-phap"
              >{{ p }}</span>
            </div>
          </template>
          <template v-if="result.kiengKy.length">
            <div class="ana-sub-title">Kiêng Kỵ</div>
            <div class="ana-chip-row">
              <span v-for="(t, i) in result.kiengKy" :key="'kk-' + i" class="ana-chip ana-chip-kk">{{ t }}</span>
            </div>
          </template>
        </div>
      </div>

      <div v-if="!hideDosage" class="ana-right">
        <div class="ana-dosage">
          <div class="ana-dosage-head">
            <span>Quân–Thần–Tá–Sứ</span>
            <span class="ana-dosage-total">Tổng ≈ {{ totalGram.toFixed(1) }}g</span>
          </div>
          <div class="ana-dosage-tbl-wrap">
            <table class="ana-dosage-tbl">
              <thead>
                <tr>
                  <th>Vị Thuốc</th>
                  <th>Gram</th>
                  <th>%</th>
                  <th title="Vai trò người nhập khi tạo bài thuốc">Nhập</th>
                  <th title="Vai trò suy luận tự động từ liều lượng & quy kinh">Suy Luận</th>
                  <th>Quy Kinh</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="v in sortedRows" :key="v.id">
                  <td class="ana-vt-name">{{ v.ten }}</td>
                  <td class="ana-vt-gram">{{ v.gram.toFixed(1) }}</td>
                  <td class="ana-vt-pct">{{ v.pct }}%</td>
                  <td class="ana-vt-role">
                    <span
                      v-if="v.vai_tro_nhap"
                      class="ana-role-chip"
                      :class="{ 'ana-role-chip--outline': !vaiTroMatch(v) }"
                      :style="{ background: vaiTroNhapColor(v.vai_tro_nhap) }"
                    >{{ v.vai_tro_nhap }}</span>
                    <span v-else class="ana-role-empty">—</span>
                  </td>
                  <td class="ana-vt-role">
                    <span class="ana-role-chip" :style="{ background: v.color }">{{ v.vai_tro }}</span>
                  </td>
                  <td class="ana-vt-qk">{{ v.quy_kinh || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="result && result.empty" class="ana-empty">Bài thuốc này chưa có vị thuốc để phân tích.</div>
</template>

<style scoped>
.ana-card {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-3);
}
.ana-section-title {
  font-weight: 700;
  color: var(--brown-800);
  font-size: 14px;
  margin-bottom: 8px;
}
.ana-sub-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--gray-600);
  margin: 12px 0 6px;
}

/* Tứ khí strip */
.tukhi-strip {
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--white);
}
.tukhi-row { display: flex; }
.tukhi-arrow {
  flex: 1;
  min-height: 24px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 2px;
}
.tukhi-arrow-mark { font-size: 14px; line-height: 1; color: #111; }
.tukhi-bar { flex: 1; height: 26px; }
.tukhi-labels { background: #faf9f5; }
.tukhi-label {
  flex: 1;
  border-top: 1px solid var(--gray-200);
  padding: 6px 2px;
  text-align: center;
  font-size: 11px;
  line-height: 1.25;
}
.tukhi-label-vn { font-weight: 600; color: var(--brown-800); }
.tukhi-label-zh { color: var(--gray-500); font-size: 10px; }

/* Layout 2 cột */
.ana-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 36%);
  gap: var(--space-3);
  align-items: start;
}
.ana-left { display: flex; flex-direction: column; min-width: 0; }
.ana-right { min-width: 0; }
/* Khi ẩn bảng Quân–Thần–Tá–Sứ (landing): cột trái giãn full, không để trống nửa phải. */
.ana-layout--solo { grid-template-columns: 1fr; }
@media (max-width: 900px) {
  .ana-layout { grid-template-columns: 1fr; }
}

/* Radar card */
.ana-radar-card {
  display: grid;
  grid-template-columns: minmax(120px, 22%) minmax(0, 1fr);
  gap: var(--space-3);
  align-items: center;
}
.ana-radar-side { min-width: 0; }
.ana-radar-canvas-wrap {
  position: relative;
  height: 200px;
  min-height: 160px;
  width: 100%;
}
.ana-radar-canvas-wrap canvas { display: block; width: 100% !important; height: 100% !important; }

/* Dosage table */
.ana-dosage {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  position: sticky;
  top: var(--space-4);
}
.ana-dosage-head {
  font-weight: 700;
  color: var(--brown-800);
  font-size: 14px;
  display: flex;
  align-items: baseline;
  gap: 4px 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.ana-dosage-total { font-weight: 400; font-size: 12px; color: var(--gray-400); }
.ana-dosage-tbl-wrap { overflow-x: auto; }
.ana-dosage-tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
.ana-dosage-tbl thead tr {
  background: var(--gray-50);
  border-bottom: 2px solid var(--gray-200);
}
.ana-dosage-tbl th {
  padding: 6px 6px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  color: var(--gray-500);
  text-transform: uppercase;
}
.ana-dosage-tbl th:nth-child(2),
.ana-dosage-tbl th:nth-child(3),
.ana-dosage-tbl th:nth-child(4) { text-align: center; }
.ana-dosage-tbl td { padding: 5px 6px; border-bottom: 1px solid var(--gray-100); vertical-align: middle; }
.ana-vt-name { font-weight: 600; color: var(--brown-900); }
.ana-vt-gram { text-align: center; font-weight: 600; }
.ana-vt-pct { text-align: center; color: var(--gray-600); }
.ana-vt-role { text-align: center; }
.ana-role-chip {
  display: inline-block;
  color: var(--white);
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 700;
}
.ana-role-chip--outline {
  background: transparent !important;
  color: var(--gray-700);
  border: 1.5px dashed currentColor;
  padding: 1px 9px;
}
.ana-role-empty { color: var(--gray-400); font-style: italic; font-size: 12px; }
.ana-vt-qk { font-size: 11px; color: var(--gray-500); }

/* Chip phân tích */
.ana-chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
.ana-chip {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
}
.ana-chip-phap { border-color: #7a9b8e; background: #e8f2ee; color: #2d4a3e; }
.ana-chip-kk { border-color: #e8a598; background: #fdf5f3; color: #7a2e23; }
/* Bệnh Tây Y — xanh y khoa, tách bạch với Chứng Trạng (YHCT) */
.ana-chip-tayy { border-color: #93b4d8; background: #eef4fb; color: #1f4b73; }

.ana-empty {
  padding: var(--space-6);
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
}
</style>
