<script setup lang="ts">
/**
 * BanXoayBienChung — "Bàn xoay biện chứng" (中医辩证施治盘) đã SỐ HOÁ.
 *
 * Hai bàn xoay riêng cho hai loại bệnh, chuyển bằng tab:
 *   • Bệnh ĐÔNG Y — trục Hội Chứng: Hội Chứng · Tạng Phủ · Triệu Chứng · Bài Thuốc.
 *   • Bệnh TÂY Y — trục Bệnh Tây Y (nhóm Chủng Bệnh): Chủng Bệnh · Bệnh Tây Y · Triệu Chứng · Bài Thuốc.
 *
 * Dữ liệu THẬT lấy 1 lần từ /demo/ban-xoay ({ dongY, tayY }). Mỗi "nan hoa" (links[i]) là một bệnh.
 *
 * CHUYỂN ĐỘNG: các vòng QUAY LIÊN TỤC (mỗi vòng một tốc độ/chiều — như vòng CosmicWheel ở banner),
 * dẫn động bằng requestAnimationFrame. KIM CHỈ ở 12 giờ đọc trực tiếp mục đang chạy qua trên vòng
 * Triệu Chứng → chuỗi biện chứng + danh sách bệnh khớp BIẾN THIÊN theo vòng quay (khách quan).
 * Rê chuột / bấm chọn → dừng quay, soi rõ một mục; rời ra hoặc sau ~6s → tự quay lại.
 *
 * Toạ độ trong viewBox 0 0 720 720; bán kính vòng TỰ TÍNH theo số vòng.
 */
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { api } from '@/services/api'

interface WheelLink {
  id: number
  label: string
  [key: string]: unknown
}
interface RingCfg {
  key: string
  label: string
  token: 'symptom' | 'brand' | 'pulse' | 'pattern' | 'herb' | 'method'
}
interface Schema {
  type: 'dong-y' | 'tay-y'
  tabLabel: string
  hubName: string
  readKey: string // vòng mà KIM CHỈ đọc khi đang quay (và dùng cho "thử nhanh")
  rings: RingCfg[] // NGOÀI → TRONG
}

const SCHEMAS: Schema[] = [
  {
    type: 'dong-y',
    tabLabel: 'Bệnh Đông Y',
    hubName: 'Hội Chứng',
    readKey: 'trieuChung',
    rings: [
      { key: 'hoiChung', label: 'Hội Chứng', token: 'pattern' },
      { key: 'tangPhu', label: 'Tạng Phủ', token: 'pulse' },
      { key: 'trieuChung', label: 'Triệu Chứng', token: 'symptom' },
      { key: 'baiThuoc', label: 'Bài Thuốc', token: 'herb' },
    ],
  },
  {
    type: 'tay-y',
    tabLabel: 'Bệnh Tây Y',
    hubName: 'Bệnh Tây Y',
    readKey: 'trieuChung',
    rings: [
      { key: 'chungBenh', label: 'Chủng Bệnh', token: 'brand' },
      { key: 'benhTayY', label: 'Bệnh Tây Y', token: 'pattern' },
      { key: 'trieuChung', label: 'Triệu Chứng', token: 'symptom' },
      { key: 'baiThuoc', label: 'Bài Thuốc', token: 'herb' },
    ],
  },
]

const CX = 360
const CY = 360
const OUTER = 348
const INNER_EDGE = 60
const HUB_R = 50
const GAP = 2.2

function pt(r: number, deg: number) {
  const a = (deg * Math.PI) / 180
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) }
}
function donut(rOut: number, rIn: number, a0: number, a1: number): string {
  const o0 = pt(rOut, a0)
  const o1 = pt(rOut, a1)
  const i1 = pt(rIn, a1)
  const i0 = pt(rIn, a0)
  const large = a1 - a0 > 180 ? 1 : 0
  const f = (n: number) => n.toFixed(2)
  return [
    `M${f(o0.x)} ${f(o0.y)}`,
    `A${rOut} ${rOut} 0 ${large} 1 ${f(o1.x)} ${f(o1.y)}`,
    `L${f(i1.x)} ${f(i1.y)}`,
    `A${rIn} ${rIn} 0 ${large} 0 ${f(i0.x)} ${f(i0.y)}`,
    'Z',
  ].join(' ')
}
function trunc(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s
}

// ── Dữ liệu ──────────────────────────────────────────────────────────────
const loading = ref(true)
const failed = ref(false)
const data = reactive<{ 'dong-y': WheelLink[]; 'tay-y': WheelLink[] }>({ 'dong-y': [], 'tay-y': [] })

const activeType = ref<'dong-y' | 'tay-y'>('tay-y')
const schema = computed<Schema>(() => SCHEMAS.find((s) => s.type === activeType.value)!)
const links = computed<WheelLink[]>(() => data[activeType.value] ?? [])

// ── Hình học mỗi vòng ───────────────────────────────────────────────────────
interface Wedge {
  name: string
  pts: Set<number>
  mid: number
  d: string
  labelR: number
  short: string
  fs: number
}
interface RingData extends RingCfg {
  items: Wedge[]
}

const ringData = computed<RingData[]>(() => {
  const rings = schema.value.rings
  const N = rings.length
  const band = (OUTER - INNER_EDGE) / N
  return rings.map((cfg, ri) => {
    const rOut = OUTER - ri * band
    const rIn = rOut - band + 8
    const labelR = (rOut + rIn) / 2

    const map = new Map<string, Set<number>>()
    for (const l of links.value) {
      const arr = (l[cfg.key] as string[] | undefined) ?? []
      for (const name of arr) {
        if (!map.has(name)) map.set(name, new Set())
        map.get(name)!.add(l.id)
      }
    }
    const names = [...map.entries()]
      .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0], 'vi'))
      .slice(0, 16)

    const n = names.length
    const step = n > 0 ? 360 / n : 360
    const arc = (2 * Math.PI * labelR) / Math.max(n, 1)
    const trCap = Math.max(5, Math.min(18, Math.floor(arc / 8)))
    const fs = Math.max(9, Math.min(13.5, Math.min(band * 0.32, arc * 0.5)))
    const items: Wedge[] = names.map(([name, pts], i) => ({
      name,
      pts,
      mid: i * step + step / 2,
      d: donut(rOut, rIn, i * step + GAP / 2, (i + 1) * step - GAP / 2),
      labelR,
      short: trunc(name, trCap),
      fs,
    }))
    return { ...cfg, items }
  })
})

const ringRims = computed(() => {
  const N = schema.value.rings.length
  const band = (OUTER - INNER_EDGE) / N
  return Array.from({ length: N + 1 }, (_, i) => OUTER - i * band + (i === N ? 8 : 0))
})

// ── "Kết quả" đang hiển thị (do KIM CHỈ đọc khi quay, hoặc do bấm chọn khi dừng) ──
const display = reactive<{ ringKey: string; name: string; pts: number[] }>({ ringKey: '', name: '', pts: [] })
const displaySet = computed(() => new Set(display.pts))
const frozen = ref(false) // true = đã dừng quay để soi (bấm chọn)
function setDisplay(ringKey: string, name: string, pts: number[]) {
  display.ringKey = ringKey
  display.name = name
  display.pts = pts
}

function isConnected(w: Wedge): boolean {
  if (!frozen.value) return true
  const dp = displaySet.value
  for (const x of w.pts) if (dp.has(x)) return true
  return false
}
function isSelectedWedge(ring: string, name: string): boolean {
  return frozen.value && display.ringKey === ring && display.name === name
}

const matchedSpokes = computed<WheelLink[]>(() => {
  const dp = displaySet.value
  return links.value.filter((l) => dp.has(l.id)).sort((a, b) => a.label.localeCompare(b.label, 'vi'))
})
const focusLink = computed<WheelLink | null>(() => matchedSpokes.value[0] ?? null)
const chain = computed(() => {
  const fl = focusLink.value
  if (!fl) return []
  return schema.value.rings
    .map((r) => ({ label: r.label, token: r.token, value: ((fl[r.key] as string[] | undefined) ?? [])[0] ?? null }))
    .filter((x) => x.value)
})
const headlineLabel = computed(() => display.name || null)
const quickKey = computed(() => (ringData.value.find((r) => r.key === schema.value.readKey) ?? ringData.value[0])?.key)
const quickPicks = computed(() => {
  const ring = ringData.value.find((r) => r.key === schema.value.readKey) ?? ringData.value[0]
  return ring?.items.slice(0, 5) ?? []
})

// ── Bộ máy QUAY (requestAnimationFrame) ───────────────────────────────────────
const reducedMotion =
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
const spinning = ref(!reducedMotion) // công tắc tổng
const visible = ref(false) // bàn xoay có đang nằm trong tầm nhìn không (do IntersectionObserver cập nhật)
const rootEl = ref<HTMLElement | null>(null)
const ang: Record<string, number> = {} // góc hiện tại mỗi vòng (độ)
const vel: Record<string, number> = {} // tốc độ mỗi vòng (độ/giây)
const ringEls: Record<string, SVGGElement | null> = {}
let rafId: number | null = null
let lastTs = 0
let liveAcc = 0
let resumeTimer: ReturnType<typeof setTimeout> | null = null
let io: IntersectionObserver | null = null

function setRingEl(key: string, el: unknown) {
  if (el) ringEls[key] = el as SVGGElement
  else delete ringEls[key]
}
function initEngine() {
  for (const k of Object.keys(ang)) delete ang[k]
  for (const k of Object.keys(vel)) delete vel[k]
  schema.value.rings.forEach((r, i) => {
    ang[r.key] = (i * 53) % 360 // lệch pha cho đẹp
    vel[r.key] = (i % 2 === 0 ? 1 : -1) * (12 + i * 6) // quay NGƯỢC chiều xen kẽ, nhanh hơn chút (±12..36°/s)
  })
}
function applyTransforms() {
  for (const r of schema.value.rings) {
    const el = ringEls[r.key]
    if (el) el.style.transform = `rotate(${ang[r.key] || 0}deg)`
  }
}
function readNeedle() {
  const key = quickKey.value
  if (!key) return
  const ring = ringData.value.find((r) => r.key === key)
  if (!ring || ring.items.length === 0) return
  let best = ring.items[0]
  let bestD = 999
  for (const w of ring.items) {
    const a = (((w.mid + (ang[key] || 0)) % 360) + 360) % 360
    const d = Math.min(a, 360 - a) // khoảng cách góc tới đỉnh (kim chỉ)
    if (d < bestD) {
      bestD = d
      best = w
    }
  }
  // Chỉ ghi trạng thái reactive khi KIM CHỈ chuyển sang mục MỚI. Nếu vẫn là mục cũ thì
  // ghi đè cũng cho ra y hệt → Vue vẫn re-render lại cả bảng đọc → giật theo nhịp 0,6s. Bỏ qua.
  if (display.ringKey === key && display.name === best.name) return
  setDisplay(key, best.name, [...best.pts])
}
function frame(ts: number) {
  const dt = Math.min(0.05, (lastTs ? ts - lastTs : 0) / 1000)
  lastTs = ts
  // KHÔNG cần kiểm document.hidden: trình duyệt tự tạm dừng rAF khi tab ẩn rồi chạy lại khi hiện.
  // CHỈ quay khi bàn xoay đang trong tầm nhìn (visible) → ngoài màn hình thì ngừng hẳn, khỏi tốn khung.
  const moving = spinning.value && !frozen.value && visible.value
  if (moving) {
    for (const r of schema.value.rings) ang[r.key] = (ang[r.key] || 0) + (vel[r.key] || 0) * dt
    liveAcc += dt
    if (liveAcc >= 0.6) {
      liveAcc = 0
      readNeedle()
    }
  }
  applyTransforms()
  if (moving) {
    rafId = requestAnimationFrame(frame)
  } else {
    rafId = null
    lastTs = 0
  }
}
function ensureRaf() {
  if (rafId == null) {
    lastTs = 0
    rafId = requestAnimationFrame(frame)
  }
}
// Hoãn QUAY tới khi main-thread rảnh tay. Lúc mới mount trang còn dựng nặng (các section landing,
// tải mô hình 3D hero…) → quay ngay sẽ rớt khung → khựng + lừ đừ. Đợi rảnh rồi quay → mượt ngay từ đầu.
function startSpinWhenIdle() {
  const go = () => {
    if (spinning.value && !frozen.value && visible.value) ensureRaf()
  }
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void })
    .requestIdleCallback
  if (typeof ric === 'function') ric(go, { timeout: 1500 })
  else setTimeout(go, 800)
}

// ── Tương tác ──────────────────────────────────────────────────────────────
function onPick(ringKey: string, name: string) {
  const ring = ringData.value.find((r) => r.key === ringKey)
  const w = ring?.items.find((x) => x.name === name)
  if (!w) return
  if (frozen.value && display.ringKey === ringKey && display.name === name) {
    resumeSpin()
    return
  }
  frozen.value = true
  setDisplay(ringKey, name, [...w.pts])
  scheduleResume()
}
function onPickPt(id: number) {
  const l = links.value.find((x) => x.id === id)
  if (!l) return
  frozen.value = true
  setDisplay(schema.value.rings[0].key === 'chungBenh' ? 'benhTayY' : schema.value.rings[0].key, l.label, [id])
  scheduleResume()
}
function onClear() {
  resumeSpin()
}
function resumeSpin() {
  frozen.value = false
  if (resumeTimer) {
    clearTimeout(resumeTimer)
    resumeTimer = null
  }
  if (spinning.value && visible.value) ensureRaf()
}
function scheduleResume() {
  if (resumeTimer) clearTimeout(resumeTimer)
  resumeTimer = setTimeout(resumeSpin, 6000)
}
function toggleSpin() {
  spinning.value = !spinning.value
  if (spinning.value) {
    frozen.value = false
    ensureRaf()
  }
}

async function switchType(t: 'dong-y' | 'tay-y') {
  if (activeType.value === t) return
  activeType.value = t
  frozen.value = false
  if (resumeTimer) clearTimeout(resumeTimer)
  initEngine()
  setDisplay('', '', []) // xoá kết quả cũ → readNeedle chắc chắn ghi lại cho bộ dữ liệu mới (qua được change-guard)
  await nextTick()
  readNeedle()
  applyTransforms()
  if (spinning.value && visible.value) ensureRaf()
}

onMounted(async () => {
  try {
    const res = await api.get<{ dongY: { links: WheelLink[] }; tayY: { links: WheelLink[] } }>('/demo/ban-xoay')
    data['dong-y'] = Array.isArray(res?.dongY?.links) ? res.dongY.links : []
    data['tay-y'] = Array.isArray(res?.tayY?.links) ? res.tayY.links : []
    if (data['tay-y'].length === 0 && data['dong-y'].length > 0) activeType.value = 'dong-y'
  } catch {
    failed.value = true
  }
  loading.value = false
  if (failed.value || (data['dong-y'].length === 0 && data['tay-y'].length === 0)) return
  // Sau khi tắt loading, các vòng mới render → đợi 1 nhịp cho ref gắn xong rồi mới áp transform.
  initEngine()
  await nextTick()
  readNeedle()
  applyTransforms() // hiện bàn xoay ở vị trí ban đầu ngay (tĩnh)…
  // …còn QUAY thì CHỈ chạy khi bàn xoay LỌT VÀO TẦM NHÌN và trang đã rảnh tay.
  // Lúc tải trang, section này nằm dưới màn hình → không quay → không tranh main-thread với
  // hero 3D phía trên → hết khựng. Cuộn tới (trang đã yên) mới quay → mượt ngay từ đầu.
  if (typeof IntersectionObserver !== 'undefined' && rootEl.value) {
    io = new IntersectionObserver(
      (entries) => {
        const vis = entries.some((e) => e.isIntersecting)
        if (vis === visible.value) return
        visible.value = vis
        if (vis) startSpinWhenIdle()
        // Khi ẩn: vòng lặp frame tự dừng (moving=false) → khỏi cần làm gì.
      },
      { threshold: 0.12 },
    )
    io.observe(rootEl.value)
  } else {
    // Trình duyệt không có IntersectionObserver → cứ coi như luôn hiện.
    visible.value = true
    startSpinWhenIdle()
  }
})
onBeforeUnmount(() => {
  if (rafId != null) cancelAnimationFrame(rafId)
  if (resumeTimer) clearTimeout(resumeTimer)
  io?.disconnect()
})

function tokenVar(token: string, part: 'bg' | 'fg' | 'border') {
  return `var(--chip-${token}-${part})`
}

// Bảng màu cho cung bàn xoay — MỘT họ ấm Nâu/Kem (tông chủ đạo), KHÔNG còn cầu vồng Ngũ Hành.
// Các vòng chỉ khác nhau ở SẮC ĐỘ: đậm ở ngoài → sáng dần vào tâm, như một đĩa sơn son
// thếp vàng của tiệm thuốc Đông Y. fill = lớp "men" trong mờ phủ trên nền đá nâu; chữ ấm sáng.
// (Độ sáng tile do CẢ alpha lẫn độ sáng màu quyết định — vòng trong alpha thấp hơn để ánh
//  sáng tâm hắt qua, nhưng vẫn sáng nhất nhờ màu nhạt hơn.)
const GLOW: Record<string, { fill: string; text: string }> = {
  brand: { fill: 'rgba(150,78,48,.52)', text: '#f3dac4' }, // đất nung trầm — vòng ngoài (Chủng Bệnh / Pháp Trị)
  pattern: { fill: 'rgba(168,118,64,.46)', text: '#f6e2cb' }, // đồng nâu — Hội Chứng / Bệnh
  pulse: { fill: 'rgba(190,138,72,.46)', text: '#f9e8c7' }, // hổ phách — Tạng Phủ
  symptom: { fill: 'rgba(210,172,102,.44)', text: '#fbf0d6' }, // hoàng thổ champagne — Triệu Chứng
  herb: { fill: 'rgba(228,200,138,.42)', text: '#fdf7e6' }, // kim/kem phát quang — Bài Thuốc (vòng trong)
  method: { fill: 'rgba(150,78,48,.52)', text: '#f3dac4' }, // đất nung (dự phòng)
}
function glow(token: string) {
  return GLOW[token] ?? GLOW.symptom
}
</script>

<template>
  <div class="bx" ref="rootEl">
    <div v-if="loading" class="bx-state">Đang dựng bàn xoay từ dữ liệu…</div>
    <div v-else-if="failed || (data['dong-y'].length === 0 && data['tay-y'].length === 0)" class="bx-state">
      Chưa lấy được dữ liệu bàn xoay. Bạn cứ xem các phần khác phía dưới nhé.
    </div>

    <template v-else>
      <!-- Tab chuyển Đông ⇄ Tây -->
      <div class="bx-tabs" role="tablist">
        <button
          v-for="s in SCHEMAS"
          :key="s.type"
          class="bx-tab"
          :class="{ 'is-active': activeType === s.type }"
          :disabled="data[s.type].length === 0"
          role="tab"
          :aria-selected="activeType === s.type"
          @click="switchType(s.type)"
        >
          {{ s.tabLabel }}
        </button>
      </div>

      <div class="bx-stage">
        <!-- ============ Bàn xoay (SVG) ============ -->
        <div class="bx-dial">
          <svg viewBox="0 0 720 720" class="bx-svg" role="img" :aria-label="`Bàn xoay biện chứng ${schema.tabLabel}`">
            <defs>
              <radialGradient id="bx-stone" cx="50%" cy="42%" r="64%">
                <stop offset="0%" stop-color="#5b3f20" />
                <stop offset="46%" stop-color="#4a3219" />
                <stop offset="80%" stop-color="#37230f" />
                <stop offset="100%" stop-color="#2a1a0a" />
              </radialGradient>
              <radialGradient id="bx-glow" cx="50%" cy="45%" r="52%">
                <stop offset="0%" stop-color="rgba(252,243,222,.40)" />
                <stop offset="40%" stop-color="rgba(249,237,214,.14)" />
                <stop offset="72%" stop-color="rgba(248,236,212,.04)" />
                <stop offset="100%" stop-color="rgba(248,236,212,0)" />
              </radialGradient>
              <linearGradient id="bx-rim" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#fbf2dd" />
                <stop offset="48%" stop-color="#e3cd9a" />
                <stop offset="100%" stop-color="#a4743a" />
              </linearGradient>
              <radialGradient id="bx-inner-shadow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="rgba(0,0,0,0)" />
                <stop offset="68%" stop-color="rgba(0,0,0,0)" />
                <stop offset="86%" stop-color="rgba(18,10,3,.42)" />
                <stop offset="100%" stop-color="rgba(8,4,1,.74)" />
              </radialGradient>
            </defs>

            <!-- Nền medallion -->
            <g aria-hidden="true">
              <circle :cx="CX" :cy="CY" r="354" fill="url(#bx-stone)" />
              <circle :cx="CX" :cy="CY" r="320" fill="url(#bx-glow)" />
              <circle :cx="CX" :cy="CY" r="354" fill="url(#bx-inner-shadow)" />
            </g>

            <!-- Các vòng dữ liệu (transform do JS gán trong vòng lặp quay) -->
            <g v-for="ring in ringData" :key="activeType + ring.key">
              <g class="bx-rot" :ref="(el) => setRingEl(ring.key, el)">
                <g
                  v-for="w in ring.items"
                  :key="ring.key + w.name"
                  class="bx-wedge"
                  :class="{
                    'is-dim': frozen && !isConnected(w),
                    'is-on': frozen && isConnected(w),
                    'is-sel': isSelectedWedge(ring.key, w.name),
                  }"
                  v-memo="[frozen, isConnected(w), isSelectedWedge(ring.key, w.name)]"
                  @click="onPick(ring.key, w.name)"
                >
                  <title>{{ ring.label }}: {{ w.name }}</title>
                  <path :d="w.d" :fill="glow(ring.token).fill" />
                  <g :transform="`rotate(${w.mid} ${CX} ${CY})`">
                    <text
                      class="bx-label"
                      x="360"
                      :y="CY - w.labelR"
                      :fill="glow(ring.token).text"
                      :style="{ fontSize: w.fs + 'px' }"
                    >
                      {{ w.short }}
                    </text>
                  </g>
                </g>
              </g>
            </g>

            <!-- Vành ngăn tĩnh -->
            <g fill="none" class="bx-rims">
              <circle v-for="r in ringRims" :key="'rim' + r" :cx="CX" :cy="CY" :r="r" />
            </g>
            <!-- Vành đồng hai tông ôm ngoài (khung medallion, như banner) -->
            <!-- rãnh tối "ngồi" ngay trong vành đồng → khung nổi khối, sâu hơn -->
            <circle :cx="CX" :cy="CY" r="348" fill="none" stroke="rgba(28,15,5,.55)" stroke-width="1.5" />
            <circle :cx="CX" :cy="CY" r="351" fill="none" stroke="url(#bx-rim)" stroke-width="3" stroke-opacity="0.92" />

            <!-- Lõi giữa -->
            <g class="bx-hub">
              <circle :cx="CX" :cy="CY" :r="HUB_R" fill="#2a1a0a" stroke="url(#bx-rim)" stroke-width="2" />
              <template v-if="headlineLabel">
                <text class="bx-hub-count" x="360" :y="CY - 10">{{ matchedSpokes.length }}</text>
                <text class="bx-hub-cap" x="360" :y="CY + 10">{{ schema.hubName }}</text>
                <text class="bx-hub-cap" x="360" :y="CY + 24">Khớp</text>
              </template>
              <template v-else>
                <text class="bx-hub-cap" x="360" :y="CY - 4">Đang</text>
                <text class="bx-hub-cap" x="360" :y="CY + 12">Quay</text>
              </template>
            </g>

            <!-- Kim chỉ 12 giờ -->
            <g class="bx-needle" aria-hidden="true">
              <line :x1="CX" :y1="14" :x2="CX" :y2="HUB_R + 6" />
              <path :d="`M${CX - 9} 16 L${CX + 9} 16 L${CX} 34 Z`" />
            </g>
          </svg>
        </div>

        <!-- ============ Bảng đọc ============ -->
        <aside class="bx-panel">
          <div class="bx-quick">
            <span class="bx-quick-cap">Thử nhanh:</span>
            <button
              v-for="q in quickPicks"
              :key="'q' + q.name"
              class="bx-quick-btn"
              :class="{ 'is-active': isSelectedWedge(quickKey || '', q.name) }"
              @click="onPick(quickKey || '', q.name)"
            >
              {{ q.name }}
            </button>
            <button
              class="bx-auto-btn"
              :class="{ 'is-on': spinning }"
              :title="spinning ? 'Đang tự quay — bấm để dừng' : 'Bấm để tự quay'"
              @click="toggleSpin"
            >
              {{ spinning ? '⏸ Đang Tự Quay' : '▶ Tự Quay' }}
            </button>
            <button v-if="frozen" class="bx-clear" @click="onClear">✕ Quay Tiếp</button>
          </div>

          <div v-if="headlineLabel" class="bx-readout">
            <header class="bx-readout-head">
              <span class="bx-readout-eyebrow">{{ frozen ? 'Đang soi' : 'Kim chỉ đang đọc' }}</span>
              <h4 class="bx-readout-title">{{ headlineLabel }}</h4>
              <p class="bx-readout-sub">
                Nối tới <strong>{{ matchedSpokes.length }}</strong> {{ schema.hubName.toLowerCase() }} — cả chuỗi cùng sáng lên.
              </p>
            </header>

            <div class="bx-chain">
              <template v-for="(c, i) in chain" :key="c.label">
                <span v-if="i > 0" class="bx-chain-arrow">↓</span>
                <span
                  class="bx-chain-node"
                  :style="{ background: tokenVar(c.token, 'bg'), color: tokenVar(c.token, 'fg'), borderColor: tokenVar(c.token, 'border') }"
                >
                  <span class="bx-chain-dim">{{ c.label }}</span>
                  <span class="bx-chain-val">{{ c.value }}</span>
                </span>
              </template>
            </div>

            <div class="bx-pt-list">
              <span class="bx-pt-cap">{{ schema.hubName }} khớp ({{ matchedSpokes.length }}) — chạm để soi ngược:</span>
              <div class="bx-pt-chips">
                <button
                  v-for="p in matchedSpokes"
                  :key="'pt' + p.id"
                  class="bx-pt-chip"
                  :class="{ 'is-active': frozen && display.pts.length === 1 && display.pts[0] === p.id }"
                  @click="onPickPt(p.id)"
                >
                  {{ p.label }}
                </button>
              </div>
            </div>
          </div>

          <div v-else class="bx-hint">
            <p>
              Bàn xoay đang tự quay — kim chỉ đọc chuỗi
              <em>{{ schema.rings.map((r) => r.label).join(' → ') }}</em>. Chạm một mục bất kỳ để dừng lại soi kỹ.
            </p>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.bx {
  width: 100%;
}
.bx-state {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--text-muted, #6b6256);
  font-size: 0.95rem;
}

/* ── Tabs ── */
.bx-tabs {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  margin-bottom: 1.4rem;
  flex-wrap: wrap;
}
.bx-tab {
  border: 1px solid var(--border-strong, #cdbfa3);
  background: var(--surface, #fff);
  color: var(--text-muted, #6b6256);
  padding: 0.55rem 1.4rem;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.bx-tab:hover:not(:disabled) {
  border-color: var(--border-brand, #b08d57);
}
.bx-tab.is-active {
  background: linear-gradient(135deg, var(--brown-600, #8a5a2b), var(--brown-700, #6f4720));
  color: #fff;
  border-color: transparent;
  box-shadow: var(--shadow-sm, 0 2px 6px rgba(0, 0, 0, 0.12));
}
.bx-tab:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.bx-stage {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: clamp(1.25rem, 3vw, 2.5rem);
  align-items: start; /* ghim 2 cột lên đầu — panel đổi chiều cao KHÔNG làm bàn xoay nhảy */
}

.bx-dial {
  min-width: 0;
}
.bx-svg {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
  /* Bóng đổ: dùng box-shadow TĨNH (bàn xoay tròn) thay cho filter:drop-shadow —
     drop-shadow phải tính lại cho cả SVG mỗi khung hình khi các vòng quay → giật.
     Nhiều lớp ấm: bóng xa nâng medallion lên + bóng gần ôm chân + viền sáng mảnh. */
  border-radius: 50%;
  box-shadow:
    0 26px 56px rgba(24, 13, 4, 0.5),
    0 10px 22px rgba(0, 0, 0, 0.34),
    0 2px 6px rgba(0, 0, 0, 0.28),
    inset 0 0 0 1px rgba(250, 238, 210, 0.05);
}

/* Vòng quay — transform do JS gán mỗi khung hình (rAF), KHÔNG transition để mượt khi quay liên tục */
.bx-rot {
  transform-box: view-box;
  transform-origin: 360px 360px;
  will-change: transform;
}

.bx-wedge {
  cursor: pointer;
}
.bx-wedge path {
  stroke: rgba(252, 240, 212, 0.26);
  stroke-width: 0.8;
  transition: opacity 0.45s ease, filter 0.45s ease;
}
.bx-wedge .bx-label {
  text-anchor: middle;
  dominant-baseline: middle;
  font-family: var(--font-family, 'Inter', sans-serif);
  font-weight: 800;
  letter-spacing: 0.2px;
  paint-order: stroke;
  stroke: rgba(34, 20, 8, 0.62);
  stroke-width: 1px;
  stroke-linejoin: round;
  user-select: none;
  transition: opacity 0.45s ease;
}
.bx-wedge:hover path {
  filter: brightness(1.08);
}
.bx-wedge.is-dim path {
  opacity: 0.14;
}
.bx-wedge.is-dim .bx-label {
  opacity: 0.1;
}
.bx-wedge.is-on path {
  opacity: 1;
  filter: drop-shadow(0 0 6px rgba(250, 238, 210, 0.35));
}
.bx-wedge.is-sel path {
  stroke: #fbf2dd;
  stroke-width: 2;
  filter: drop-shadow(0 0 10px rgba(250, 238, 210, 0.7));
}

.bx-rims circle {
  stroke: rgba(250, 236, 206, 0.4);
  stroke-width: 1.1;
}
.bx-needle line {
  stroke: #fbe7b8;
  stroke-width: 2;
  stroke-linecap: round;
  opacity: 0.5;
}
.bx-needle path {
  fill: #f3c969;
  stroke: #2a1a0a;
  stroke-width: 1;
}
.bx-hub-count {
  text-anchor: middle;
  font-size: 26px;
  font-weight: 800;
  fill: #fbe7b8;
  font-family: var(--font-family, 'Inter', sans-serif);
}
.bx-hub-cap {
  text-anchor: middle;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  fill: #e3cd9a;
  text-transform: uppercase;
  font-family: var(--font-family, 'Inter', sans-serif);
}

.bx-panel {
  min-width: 0;
}
.bx-quick {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
  margin-bottom: 1rem;
}
.bx-quick-cap {
  font-size: 0.78rem;
  color: var(--text-muted, #6b6256);
  font-weight: 600;
}
.bx-quick-btn {
  border: 1px solid var(--chip-symptom-border, #d5cbb4);
  background: var(--chip-symptom-bg, #ece5d2);
  color: var(--chip-symptom-fg, #5c5440);
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.bx-quick-btn:hover {
  transform: translateY(-1px);
}
.bx-quick-btn.is-active {
  box-shadow: 0 0 0 2px var(--border-brand, #b08d57) inset;
}
.bx-auto-btn {
  margin-left: auto;
  border: 1px solid var(--border-brand, #b08d57);
  background: var(--surface, #fff);
  color: var(--text-brand, #8a5a2b);
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}
.bx-auto-btn.is-on {
  background: linear-gradient(135deg, var(--brown-600, #8a5a2b), var(--brown-700, #6f4720));
  color: #fff;
  border-color: transparent;
}
.bx-clear {
  border: 1px solid var(--border, #ddd);
  background: var(--surface, #fff);
  color: var(--text-muted, #6b6256);
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: 0.78rem;
  cursor: pointer;
}

.bx-readout {
  display: flex;
  flex-direction: column;
  /* Chiều cao CỐ ĐỊNH (không phải min-height) → box KHÔNG BAO GIỜ phình theo kết quả, dù chuỗi dài / tên
     dài làm mắt xích xuống dòng / nhiều chip. Nội dung dư sẽ cuộn trong khung (overflow) thay vì đội cao box,
     nhờ vậy phần dưới trang đứng yên tuyệt đối. Kết quả ngắn thì phần thừa dồn vào giữa (vô hình). */
  height: 31rem;
  overflow-y: auto;
  background: var(--surface-2, #faf6ee);
  border: 1px solid var(--border, #e6ddca);
  border-radius: 16px;
  padding: 1.1rem 1.2rem;
}
.bx-readout-eyebrow {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-brand, #8a5a2b);
  font-weight: 700;
}
.bx-readout-title {
  font-size: clamp(1.15rem, 2.4vw, 1.5rem);
  margin: 0.2rem 0 0.15rem;
  color: var(--text, #2c2417);
}
.bx-readout-sub {
  margin: 0 0 0.9rem;
  font-size: 0.86rem;
  color: var(--text-muted, #6b6256);
}

.bx-chain {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  margin-bottom: 1rem;
}
.bx-chain-arrow {
  color: var(--text-subtle, #a99e88);
  font-size: 0.85rem;
  line-height: 1;
  margin-left: 0.7rem;
}
.bx-chain-node {
  display: inline-flex;
  flex-direction: column;
  border: 1px solid;
  border-radius: 10px;
  padding: 0.32rem 0.7rem;
  max-width: 100%;
}
.bx-chain-dim {
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  opacity: 0.7;
  font-weight: 600;
}
.bx-chain-val {
  font-size: 0.92rem;
  font-weight: 700;
}

.bx-pt-list {
  margin-top: auto; /* ghim cụm chip xuống đáy readout → vị trí cố định, không nhảy theo độ dài chuỗi */
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.bx-pt-cap {
  font-size: 0.76rem;
  color: var(--text-muted, #6b6256);
  font-weight: 600;
}
.bx-pt-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
  /* Tối đa ~2 hàng chip; trúng triệu chứng khớp nhiều bệnh thì CUỘN trong khung,
     KHÔNG cho phình readout đẩy phần dưới trang xuống. */
  max-height: 4.4rem;
  overflow-y: auto;
}
.bx-pt-chip {
  border: 1px solid var(--chip-method-border, #e2b89e);
  background: var(--chip-method-bg, #f1d8c6);
  color: var(--chip-method-fg, #8a4527);
  padding: 0.28rem 0.65rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease;
}
.bx-pt-chip:hover {
  transform: translateY(-1px);
}
.bx-pt-chip.is-active {
  box-shadow: 0 0 0 2px var(--chip-method-fg, #8a4527) inset;
}

.bx-hint {
  background: var(--surface-2, #faf6ee);
  border: 1px dashed var(--border, #e6ddca);
  border-radius: 16px;
  padding: 1.1rem 1.2rem;
  color: var(--text-muted, #6b6256);
  font-size: 0.92rem;
  line-height: 1.6;
}

@media (max-width: 900px) {
  .bx-stage {
    grid-template-columns: 1fr;
  }
  .bx-dial {
    max-width: 520px;
    margin: 0 auto;
  }
}
</style>
