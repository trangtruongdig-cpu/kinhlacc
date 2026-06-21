<script setup lang="ts">
/**
 * BatCuongFigure — Toàn bộ Bát Cương đọc trên MỘT thân người đứng trong vòng Thái Cực.
 *
 *   Vòng ngoài (Thái Cực)     → ÂM ‑ DƯƠNG (tổng cương): Dương hư → thuỳ sáng co lại.
 *   Đường viền người          → BIỂU (da · kinh lạc, bên ngoài).
 *   Tạng phủ bên trong thân   → LÝ (bên trong). Mỗi tạng vẽ đúng vùng giải phẫu.
 *   Dấu trên từng tạng phủ    → vừa MÀU (Hàn lam / Nhiệt đỏ) vừa ĐỘ SÂU
 *                               (Biểu = quầng nét đứt sát da · Lý = nền đặc, sâu).
 *   Hào quang nửa trên/dưới   → KHÍ (chi trên) / HUYẾT (chi dưới): đậm = Thực, nhạt = Hư.
 *
 * Bên cạnh là BẢNG TÓM TẮT chữ để đọc nhanh kết luận. Bấm 1 tạng phủ / Thái Cực / nhãn
 * Khí‑Huyết → phát 'toggle' để cha soi đúng ô trên bảng đo. Vẽ thuần SVG, không 3D.
 */
import { computed } from 'vue'

interface OrganState {
  name: string // mã kinh (row.name) — soi bảng đo
  label: string // tên đầy đủ + bên
  organ: string // tên tạng phủ (khớp CHANNELS_FULL)
  side: string // "trái" | "phải" | "" | "trái/phải"
  depth: 'bieu' | 'ly' | 'mixed'
  temp: 'han' | 'nhiet' | 'mixed'
}

const props = defineProps<{
  amDuong: string
  khi: string
  huyet: string
  organs: OrganState[]
  focus: string | null
}>()

const emit = defineEmits<{ (e: 'toggle', key: string): void }>()

/* ───────── ① Vòng Thái Cực (Âm/Dương) ───────── */
const TJ = { cx: 150, cy: 160, r: 150 }
// Lệch [-1..1]: <0 Dương hư (thuỳ SÁNG/Dương co), >0 Âm hư (thuỳ TỐI/Âm co), 0 cân bằng.
// (Path tj-yin tô vùng TỐI lên trên nền sáng → d>0 làm vùng tối co lại; xem review đã kiểm chứng.)
const amBias = computed(() => {
  const s = props.amDuong || ''
  if (s.includes('Dương hư')) return -0.4
  if (s.includes('Âm hư')) return 0.4
  return 0
})
const taijiPath = computed(() => {
  const { cx, cy, r } = TJ
  const d = amBias.value * r
  const up = (r + d) / 2
  const lo = (r - d) / 2
  return `M${cx} ${cy - r} a ${up} ${up} 0 0 0 0 ${r + d} a ${lo} ${lo} 0 0 1 0 ${r - d} a ${r} ${r} 0 0 1 0 ${-2 * r} Z`
})
const upperDotY = computed(() => TJ.cy - (TJ.r - amBias.value * TJ.r) / 2)
const lowerDotY = computed(() => TJ.cy + (TJ.r + amBias.value * TJ.r) / 2)
const amLabel = computed(() => props.amDuong?.trim() || 'Chưa rõ')
const amActive = computed(() => props.focus === 'amDuong')

/* ───────── Icon tạng phủ (12 glyph) ───────── */
const ORGAN_ICONS: Record<string, string[]> = {
  Tâm: ['M12 21C7 17 3.5 13 3.5 9 3.5 6.5 5.4 5 7.5 5c1.7 0 3.3 1 4.5 2.6C13.2 6 14.8 5 16.5 5 18.6 5 20.5 6.5 20.5 9c0 4-3.5 8-8.5 12Z'],
  'Tâm bào': [
    'M12 18.5C8.2 15.6 6 12.6 6 9.9 6 8.1 7.3 7 8.8 7c1.2 0 2.3.7 3.2 1.9C12.9 7.7 14 7 15.2 7 16.7 7 18 8.1 18 9.9c0 2.7-2.2 5.7-6 8.6Z',
    'M12 2.6a9.4 9.4 0 1 0 6.6 2.8',
  ],
  Phế: [
    'M12 3v7',
    'M12 10c-1.2 0-2 1-2.6 2.8C8.4 16 6.6 17.5 5 17.5c-1.3 0-1.8-1-1.8-3.2 0-4 1.8-7.3 4-8.3',
    'M12 10c1.2 0 2 1 2.6 2.8C15.6 16 17.4 17.5 19 17.5c1.3 0 1.8-1 1.8-3.2 0-4-1.8-7.3-4-8.3',
  ],
  Can: ['M3 8C8 6 16 6 21 9c0 4-4 7-9 7-5 0-9-3-9-8Z', 'M14 14c1 1 3 1 4-.2'],
  Đởm: ['M12 4c2.5 0 3.8 2.2 3.8 4.6 0 1.4-.6 2.5-.6 3.9 0 2.6-1.4 5.6-3.2 5.6S8.6 15.1 8.6 12.5c0-1.4-.6-2.5-.6-3.9C8 6.2 9.5 4 12 4Z'],
  Tỳ: ['M13 4C8 4 5 8 5 13c0 4 4 7 8 5.5-2-1.5-3-4-2.5-6.5C11 9.5 13 8 15.5 8 17 8 16 4 13 4Z'],
  Vị: ['M9 4v2.5c0 1.7 1 2.5 3 2.5 3.2 0 5.5 2.3 5.5 5.5S15 20 12 20c-2.4 0-4.2-1.3-4.7-3.2', 'M9 7c0 1.5.9 2.4 2.6 2.5'],
  'Đại Trường': ['M6 18V9a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v9', 'M6 18h2.5', 'M15.5 18H18'],
  'Tiểu Trường': [
    'M4.5 8c2.3-2 4.5 2 6.8 0 2.3-2 4.5 2 6.8 0',
    'M4.5 12c2.3-2 4.5 2 6.8 0 2.3-2 4.5 2 6.8 0',
    'M4.5 16c2.3-2 4.5 2 6.8 0 2.3-2 4.5 2 6.8 0',
  ],
  Thận: ['M9.5 4C5.5 4 4 8 4 12s2 8 5.5 8c2 0 2.5-2 1.5-4-1-2-2-3.5-2-4s1-2 2-4c1-2 .5-4-1.5-4Z'],
  'Bàng quang': ['M10 5h4v2a6 6 0 1 1-4 0V5Z'],
  'Tam tiêu': ['M6.5 4.5h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z', 'M4.5 10h15', 'M4.5 14h15'],
}
const FALLBACK = ['M5 6h14v12H5Z']
function iconPaths(organ: string): string[] {
  return ORGAN_ICONS[organ] || FALLBACK
}

/* ───────── Bản đồ giải phẫu (bán giải phẫu, viewBox 0 0 300 330) ───────── */
interface AnatomyNode {
  organ: string
  x: number
  y: number
  s: number
}
const ANATOMY: AnatomyNode[] = [
  { organ: 'Phế', x: 150, y: 106, s: 32 }, // phổi — ngực (thượng tiêu)
  { organ: 'Tâm', x: 145, y: 126, s: 19 }, // tim — ngực giữa
  { organ: 'Tâm bào', x: 162, y: 122, s: 16 }, // tâm bào — cạnh tim
  { organ: 'Can', x: 129, y: 147, s: 21 }, // gan — hạ sườn (trung tiêu)
  { organ: 'Đởm', x: 137, y: 161, s: 12 }, // mật — dưới gan
  { organ: 'Tỳ', x: 172, y: 147, s: 19 }, // tỳ — đối bên gan
  { organ: 'Vị', x: 151, y: 154, s: 19 }, // dạ dày — thượng vị
  { organ: 'Thận', x: 127, y: 177, s: 16 }, // thận trái (theo người xem)
  { organ: 'Thận', x: 173, y: 177, s: 16 }, // thận phải
  { organ: 'Đại Trường', x: 150, y: 183, s: 26 }, // đại tràng — khung bụng dưới (hạ tiêu)
  { organ: 'Tiểu Trường', x: 150, y: 200, s: 20 }, // tiểu tràng — giữa bụng dưới
  { organ: 'Bàng quang', x: 150, y: 214, s: 17 }, // bàng quang — tiểu khung
]

const stateByOrgan = computed(() => {
  const m = new Map<string, OrganState>()
  for (const o of props.organs) m.set(o.organ, o)
  return m
})
function stateOf(organ: string): OrganState | null {
  return stateByOrgan.value.get(organ) || null
}
function sideAbbr(side: string): string {
  return side === 'trái' ? 'T' : side === 'phải' ? 'P' : ''
}

/* ───────── ④ Hào quang Khí / Huyết (Hư–Thực) ───────── */
function tone(v: string): 'hu' | 'thuc' | 'neutral' | 'none' {
  if (!v) return 'none'
  if (v.includes('thịnh') || v.includes('thực')) return 'thuc'
  // "Bình thường" có chứa "hư" (trong "thường") → loại trừ để không nhận nhầm là hư.
  if (v.includes('hư') && !v.includes('thường')) return 'hu'
  return 'neutral'
}
const khiTone = computed(() => tone(props.khi))
const huyetTone = computed(() => tone(props.huyet))
const khiActive = computed(() => props.focus === 'khi')
const huyetActive = computed(() => props.focus === 'huyet')

</script>

<template>
  <div class="bcf">
    <!-- ========== HÌNH HỢP NHẤT ========== -->
    <div class="bcf-figure">
      <svg viewBox="0 0 300 330" role="img" :aria-label="'Bát Cương trên thân người — Âm Dương: ' + amLabel">
        <defs>
          <filter id="bcf-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="13" />
          </filter>
          <linearGradient id="bcf-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fdf8f0" stop-opacity="0.85" />
            <stop offset="0.55" stop-color="#f6ecdc" stop-opacity="0.78" />
            <stop offset="1" stop-color="#ecdcc6" stop-opacity="0.72" />
          </linearGradient>
          <filter id="bcf-figsh" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="1.6" stdDeviation="2.2" flood-color="#3a2510" flood-opacity="0.3" />
          </filter>
        </defs>

        <!-- ① Vòng Thái Cực (bấm vùng trống trong vòng → soi Âm/Dương) -->
        <g
          class="taiji"
          :class="{ 'is-active': amActive }"
          role="button"
          tabindex="0"
          aria-label="Âm Dương — tổng cương"
          @click="emit('toggle', 'amDuong')"
          @keydown.enter.prevent="emit('toggle', 'amDuong')"
          @keydown.space.prevent="emit('toggle', 'amDuong')"
        >
          <circle :cx="TJ.cx" :cy="TJ.cy" :r="TJ.r" class="tj-yang" />
          <path :d="taijiPath" class="tj-yin" />
          <circle :cx="TJ.cx" :cy="upperDotY" :r="13" class="tj-yin" />
          <circle :cx="TJ.cx" :cy="lowerDotY" :r="13" class="tj-yang" />
          <circle :cx="TJ.cx" :cy="TJ.cy" :r="TJ.r" class="tj-ring" />
          <text x="92" y="34" class="tj-label tj-label--am">Âm</text>
          <text x="208" y="34" class="tj-label tj-label--duong">Dương</text>
        </g>

        <!-- ④ Hào quang Khí (trên) / Huyết (dưới) -->
        <g filter="url(#bcf-soft)" class="auras">
          <ellipse cx="150" cy="122" rx="66" ry="52" class="aura" :class="'aura--' + khiTone" />
          <ellipse cx="150" cy="190" rx="72" ry="56" class="aura" :class="'aura--' + huyetTone" />
        </g>

        <!-- Thân người (bóng giải phẫu mượt) — viền = Biểu -->
        <g class="body" filter="url(#bcf-figsh)">
          <!-- đầu + cổ -->
          <ellipse cx="150" cy="48" rx="21" ry="25" />
          <path d="M141 66 C140 74 139 80 137 86 L163 86 C161 80 160 74 159 66 Z" />
          <!-- thân (vai xuôi · eo thắt · hông) -->
          <path d="M120 96 C124 90 130 87 140 87 L160 87 C170 87 176 90 180 96 C186 116 184 150 178 176 C176 190 181 202 180 212 C180 220 174 226 166 227 L134 227 C126 226 120 220 120 212 C119 202 124 190 122 176 C116 150 114 116 120 96 Z" />
          <!-- tay trái / phải (thuôn, cong nhẹ) -->
          <path d="M118 98 C106 100 100 110 98 124 C95 146 93 168 92 188 C91 204 90 218 92 230 C93 237 97 241 102 239 C106 237 108 229 109 216 C111 198 113 176 115 154 C116 136 117 116 115 102 C115 100 116 98 118 98 Z" />
          <path d="M182 98 C194 100 200 110 202 124 C205 146 207 168 208 188 C209 204 210 218 208 230 C207 237 203 241 198 239 C194 237 192 229 191 216 C189 198 187 176 185 154 C184 136 183 116 185 102 C185 100 184 98 182 98 Z" />
          <!-- chân trái / phải (đùi → bắp → bàn) -->
          <path d="M134 223 C129 240 127 260 129 280 C130 292 132 300 133 306 C133 310 130 312 126 312 C121 312 119 310 120 307 C121 303 125 301 132 300 C139 299 144 298 146 294 C148 284 148 270 148 254 C148 242 149 232 149 224 C147 223 140 222 134 223 Z" />
          <path d="M166 223 C171 240 173 260 171 280 C170 292 168 300 167 306 C167 310 170 312 174 312 C179 312 181 310 180 307 C179 303 175 301 168 300 C161 299 156 298 154 294 C152 284 152 270 152 254 C152 242 151 232 151 224 C153 223 160 222 166 223 Z" />
        </g>

        <!-- Tạng phủ: ghost (mờ) + tạng bệnh (màu Hàn/Nhiệt, độ sâu Biểu/Lý) -->
        <g
          v-for="(n, i) in ANATOMY"
          :key="i"
          class="organ-node"
          :class="
            stateOf(n.organ)
              ? [
                  'is-affected',
                  'temp-' + stateOf(n.organ)!.temp,
                  'depth-' + stateOf(n.organ)!.depth,
                  { 'is-active': focus === 'organ:' + stateOf(n.organ)!.name },
                ]
              : ['is-ghost']
          "
          :role="stateOf(n.organ) ? 'button' : undefined"
          :tabindex="stateOf(n.organ) ? 0 : undefined"
          :aria-label="stateOf(n.organ) ? 'Soi ' + stateOf(n.organ)!.label : undefined"
          @click="stateOf(n.organ) && emit('toggle', 'organ:' + stateOf(n.organ)!.name)"
          @keydown.enter.prevent="stateOf(n.organ) && emit('toggle', 'organ:' + stateOf(n.organ)!.name)"
          @keydown.space.prevent="stateOf(n.organ) && emit('toggle', 'organ:' + stateOf(n.organ)!.name)"
        >
          <!-- Lý: nền đặc (sâu) · Biểu: quầng nét đứt (nông) · mixed: cả hai -->
          <circle v-if="stateOf(n.organ)?.depth === 'ly' || stateOf(n.organ)?.depth === 'mixed'" :cx="n.x" :cy="n.y" :r="n.s * 0.64" class="depth-fill" />
          <circle v-if="stateOf(n.organ)?.depth === 'bieu' || stateOf(n.organ)?.depth === 'mixed'" :cx="n.x" :cy="n.y" :r="n.s * 0.68" class="depth-halo" />
          <g :transform="`translate(${n.x - n.s / 2} ${n.y - n.s / 2}) scale(${n.s / 24})`">
            <path v-for="(d, j) in iconPaths(n.organ)" :key="j" :d="d" class="organ-path" />
          </g>
          <text
            v-if="stateOf(n.organ) && sideAbbr(stateOf(n.organ)!.side)"
            :x="n.x + n.s * 0.5"
            :y="n.y - n.s * 0.42"
            class="side-badge"
          >{{ sideAbbr(stateOf(n.organ)!.side) }}</text>
          <circle v-if="stateOf(n.organ)" :cx="n.x" :cy="n.y" :r="n.s * 0.72" class="hit" />
        </g>

        <!-- Nhãn Khí / Huyết (bấm → soi chi trên / chi dưới) -->
        <g
          class="kh-chip"
          :class="['kh--' + khiTone, { 'is-active': khiActive, 'is-off': khiTone === 'none' }]"
          :role="khiTone === 'none' ? undefined : 'button'"
          :tabindex="khiTone === 'none' ? undefined : 0"
          aria-label="Khí — chi trên"
          @click="khiTone !== 'none' && emit('toggle', 'khi')"
          @keydown.enter.prevent="khiTone !== 'none' && emit('toggle', 'khi')"
          @keydown.space.prevent="khiTone !== 'none' && emit('toggle', 'khi')"
        >
          <rect x="222" y="108" width="60" height="22" rx="11" />
          <text x="252" y="123">Khí</text>
        </g>
        <g
          class="kh-chip"
          :class="['kh--' + huyetTone, { 'is-active': huyetActive, 'is-off': huyetTone === 'none' }]"
          :role="huyetTone === 'none' ? undefined : 'button'"
          :tabindex="huyetTone === 'none' ? undefined : 0"
          aria-label="Huyết — chi dưới"
          @click="huyetTone !== 'none' && emit('toggle', 'huyet')"
          @keydown.enter.prevent="huyetTone !== 'none' && emit('toggle', 'huyet')"
          @keydown.space.prevent="huyetTone !== 'none' && emit('toggle', 'huyet')"
        >
          <rect x="216" y="186" width="72" height="22" rx="11" />
          <text x="252" y="201">Huyết</text>
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.bcf {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: flex-start;
}
.bcf-figure {
  flex: 1 1 240px;
  min-width: 230px;
}
.bcf-figure svg {
  width: 100%;
  height: auto;
  display: block;
}

/* ---- Thái Cực ---- */
.taiji {
  cursor: pointer;
}
.tj-yang {
  fill: #f3e7d0;
}
.tj-yin {
  fill: #4b3319;
}
.taiji .tj-yang,
.taiji .tj-yin {
  opacity: 0.45;
}
.tj-ring {
  fill: none;
  stroke: rgba(75, 51, 25, 0.55);
  stroke-width: 2;
}
.taiji.is-active .tj-ring {
  stroke: var(--brown-600);
  stroke-width: 3;
}
.tj-label {
  font-size: 12px;
  font-weight: 700;
  text-anchor: middle;
  opacity: 0.55;
}
.tj-label--duong {
  fill: #8a6a2e;
}
.tj-label--am {
  fill: #4b3319;
}

/* ---- Hào quang Khí / Huyết ---- */
.aura {
  transition: fill var(--transition-base);
}
.aura--hu {
  fill: rgba(96, 150, 196, 0.22);
}
.aura--thuc {
  fill: rgba(206, 130, 84, 0.26);
}
.aura--neutral {
  fill: rgba(176, 156, 124, 0.12);
}
.aura--none {
  fill: transparent;
}

/* ---- Thân người (Biểu = viền) ---- */
.body {
  pointer-events: none; /* click rơi xuống Thái Cực phía sau */
}
.body > * {
  fill: url(#bcf-body);
  stroke: rgba(118, 76, 36, 0.62);
  stroke-width: 1.5;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.auras {
  pointer-events: none;
}
.organ-node.is-ghost {
  pointer-events: none; /* tạng mờ không chặn click Thái Cực */
}

/* ---- Tạng phủ ---- */
.organ-path {
  fill: none;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
.is-ghost .organ-path {
  stroke: rgba(120, 90, 60, 0.3);
}
.is-affected {
  cursor: pointer;
}
.temp-han .organ-path {
  stroke: #2f6690;
}
.temp-nhiet .organ-path {
  stroke: #c0452a;
}
.temp-mixed .organ-path {
  stroke: #8a4fbf;
}
.depth-fill {
  fill: rgba(255, 255, 255, 0.92);
  stroke-width: 0;
}
.temp-han .depth-fill {
  fill: rgba(96, 150, 196, 0.28);
}
.temp-nhiet .depth-fill {
  fill: rgba(206, 116, 84, 0.28);
}
.temp-mixed .depth-fill {
  fill: rgba(138, 79, 191, 0.26);
}
.depth-halo {
  fill: rgba(255, 255, 255, 0.55);
  stroke-dasharray: 3 2.5;
  stroke-width: 1.4;
}
.temp-han .depth-halo {
  stroke: #2f6690;
}
.temp-nhiet .depth-halo {
  stroke: #c0452a;
}
.temp-mixed .depth-halo {
  stroke: #8a4fbf;
}
/* Focus bàn phím trên SVG (Chrome không vẽ outline cho phần tử SVG) */
.taiji:focus-visible,
.organ-node:focus-visible,
.kh-chip:focus-visible {
  outline: none;
}
.taiji:focus-visible .tj-ring {
  stroke: var(--brown-700);
  stroke-width: 3;
}
.organ-node:focus-visible .depth-fill,
.organ-node:focus-visible .depth-halo {
  stroke: var(--brown-700);
  stroke-width: 2;
  stroke-dasharray: none;
}
.kh-chip:focus-visible rect {
  stroke: var(--brown-700);
  stroke-width: 2.4;
}
.is-active .depth-fill,
.is-active .depth-halo {
  stroke: var(--brown-700);
  stroke-width: 2;
  stroke-dasharray: none;
}
.is-affected.is-active .organ-path {
  stroke-width: 2.1;
}
.side-badge {
  font-size: 9px;
  font-weight: 700;
  fill: #fff;
  text-anchor: middle;
  paint-order: stroke;
  stroke: rgba(75, 51, 25, 0.85);
  stroke-width: 2.6px;
  stroke-linejoin: round;
}
.hit {
  fill: transparent;
}

/* ---- Nhãn Khí / Huyết trên hình ---- */
.kh-chip {
  cursor: pointer;
}
.kh-chip.is-off {
  cursor: default;
}
.kh-chip rect {
  fill: #fff;
  stroke: var(--brown-300);
  stroke-width: 1.2;
}
.kh-chip text {
  font-size: 12px;
  font-weight: 700;
  text-anchor: middle;
  fill: var(--gray-700);
}
.kh--hu rect {
  stroke: #5e8bb0;
}
.kh--hu text {
  fill: #2f6690;
}
.kh--thuc rect {
  stroke: #c5604a;
}
.kh--thuc text {
  fill: #c0452a;
}
.kh-chip.is-active rect {
  stroke: var(--brown-600);
  stroke-width: 2.2;
}
.kh-chip.is-off {
  opacity: 0.5;
}

</style>
