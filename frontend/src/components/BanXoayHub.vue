<script setup lang="ts">
/**
 * BanXoayHub — VÒNG NHỎ hướng tâm cho 1 bệnh (thể bệnh Đông Y hoặc bệnh Tây Y).
 * Tâm = bệnh đang soi + toạ độ khung (Lục Kinh · Tạng Phủ · Lục Khí). Các nan = nhóm liên quan
 * (Triệu chứng / Pháp trị / Bài thuốc / Bệnh đối chiếu). Nút có `nav` → bấm để xoay tâm sang nó.
 * SVG vẽ nan + vòng nền; pill chữ là HTML (đọc rõ, bấm được). Toạ độ 0–100 dùng chung cả 2 lớp.
 */
import { computed } from 'vue'

export interface HubItem { key: string; ten: string; nav?: 'tay-y' | 'dong-y'; sub?: string }
export interface HubGroup { key: string; label: string; color: string; items: HubItem[] }

const props = defineProps<{
  focusTen: string
  focusType: 'tay-y' | 'dong-y'
  tags: { label: string; val: string }[]
  groups: HubGroup[]
}>()
const emit = defineEmits<{ pick: [{ nav: 'tay-y' | 'dong-y'; key: string }] }>()

const D2R = Math.PI / 180
const R_BASE = 30 // bán kính đặt pill (theo %), so le 3 tầng khi đông nút
const CAP = 6 // tối đa pill mỗi nhóm (dư → gộp "+N") — ít nút cho gọn, chi tiết đầy đủ ở bảng bên

interface Laid extends HubItem { gi: number; color: string; x: number; y: number; a: number }
const laid = computed<Laid[]>(() => {
  const G = props.groups.length || 1
  const per = 360 / G
  const out: Laid[] = []
  props.groups.forEach((g, gi) => {
    const items = g.items.slice(0, CAP)
    if (g.items.length > CAP) items.push({ key: g.key + '-more', ten: `+${g.items.length - CAP} nữa`, sub: '' })
    const n = items.length
    const c0 = gi * per - 90 // -90: nhóm đầu ở phía trên
    const margin = Math.min(per * 0.18, 14)
    const start = c0 + margin
    const end = c0 + per - margin
    items.forEach((it, i) => {
      const a = n === 1 ? (start + end) / 2 : start + (end - start) * (i / (n - 1))
      const rr = R_BASE + (i % 3) * 5
      out.push({ ...it, gi, color: g.color, a, x: 50 + rr * Math.sin(a * D2R), y: 50 - rr * Math.cos(a * D2R) })
    })
  })
  return out
})
function pt(r: number, deg: number) {
  const a = deg * D2R
  return { x: 50 + r * Math.sin(a), y: 50 - r * Math.cos(a) }
}
// Cung để nhãn nhóm UỐN CONG ôm vành ngoài (textPath). Nửa dưới đảo chiều cho chữ đọc xuôi.
function arcPath(r: number, deg: number, span: number): string {
  const d = ((deg % 360) + 360) % 360
  const bottom = d > 90 && d < 270
  const a0 = bottom ? deg + span : deg - span
  const a1 = bottom ? deg - span : deg + span
  const p0 = pt(r, a0)
  const p1 = pt(r, a1)
  const f = (n: number) => n.toFixed(2)
  return `M${f(p0.x)} ${f(p0.y)} A${r} ${r} 0 0 ${bottom ? 0 : 1} ${f(p1.x)} ${f(p1.y)}`
}
// Nhãn nhóm: cung ôm vành ngoài, giữa cung của nhóm.
const groupArcs = computed(() =>
  props.groups.map((g, gi) => {
    const per = 360 / (props.groups.length || 1)
    const mid = gi * per - 90 + per / 2
    return { key: g.key, label: g.label, color: g.color, arc: arcPath(46, mid, Math.min(30, per / 2 - 4)) }
  }),
)
function click(it: Laid) { if (it.nav) emit('pick', { nav: it.nav, key: it.key }) }
</script>

<template>
  <div class="hub">
    <svg class="hub-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <circle cx="50" cy="50" r="48" class="hub-rim" />
      <circle cx="50" cy="50" r="33" class="hub-guide" />
      <!-- nan nối tâm → pill -->
      <line v-for="(it, i) in laid" :key="'ln' + i" x1="50" y1="50" :x2="it.x" :y2="it.y" class="hub-spoke" :style="{ stroke: it.color }" />
      <!-- nhãn nhóm UỐN CONG ôm vành ngoài -->
      <path v-for="g in groupArcs" :key="'ga' + g.key" :id="'hub-ga-' + g.key" :d="g.arc" fill="none" />
      <text v-for="g in groupArcs" :key="'gt' + g.key" class="hub-arc-label" :fill="g.color">
        <textPath :href="'#hub-ga-' + g.key" startOffset="50%">{{ g.label }}</textPath>
      </text>
    </svg>

    <!-- tâm -->
    <div class="hub-core" :class="focusType">
      <span class="hub-core-kind">{{ focusType === 'tay-y' ? 'Bệnh Tây Y' : 'Thể bệnh Đông Y' }}</span>
      <b class="hub-core-ten">{{ focusTen }}</b>
      <div v-if="tags.length" class="hub-core-tags">
        <span v-for="t in tags" :key="t.label" class="hub-tag"><i>{{ t.label }}</i> {{ t.val }}</span>
      </div>
    </div>

    <!-- pill nút -->
    <button
      v-for="(it, i) in laid"
      :key="'pill' + i"
      type="button"
      class="hub-pill"
      :class="{ nav: !!it.nav }"
      :style="{ left: it.x + '%', top: it.y + '%', '--c': it.color }"
      :disabled="!it.nav"
      :title="it.ten + (it.sub ? ' — ' + it.sub : '')"
      @click="click(it)"
    >
      <span class="hub-pill-ten">{{ it.ten }}</span>
      <small v-if="it.sub">{{ it.sub }}</small>
    </button>
  </div>
</template>

<style scoped>
.hub { position: relative; width: 100%; max-width: min(100%, 58vh); aspect-ratio: 1; margin: 0 auto; container-type: inline-size; }
.hub-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.hub-rim { fill: none; stroke: var(--border, #e7ddcd); stroke-width: 0.5; }
.hub-guide { fill: none; stroke: var(--border, #e7ddcd); stroke-width: 0.3; stroke-dasharray: 1 1.4; opacity: 0.6; }
.hub-spoke { stroke-width: 0.85; opacity: 0.72; stroke-linecap: round; }

.hub-arc-label { font-size: 2.7px; font-weight: 800; letter-spacing: 0.04px; text-transform: uppercase; text-anchor: middle; dominant-baseline: middle; opacity: 0.92; }

.hub-core {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: 40%; min-height: 26%; padding: 8px 10px; border-radius: 999px / 40%;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; text-align: center;
  background: linear-gradient(160deg, #fff, var(--brown-50, #f7efe2)); border: 2px solid var(--brown-300, #d3b58a);
  box-shadow: 0 6px 18px rgba(60, 40, 15, 0.18); z-index: 3;
}
.hub-core.tay-y { border-color: #b1502f; }
.hub-core.dong-y { border-color: #6b4a24; }
.hub-core-kind { font-size: clamp(8px, 2cqw, 10px); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted, #8a7a60); }
.hub-core-ten { font-size: clamp(12px, 3.2cqw, 17px); font-weight: 800; color: var(--text, #2a1c0e); line-height: 1.15; }
.hub-core-tags { display: flex; flex-wrap: wrap; gap: 3px; justify-content: center; margin-top: 2px; }
.hub-tag { font-size: clamp(8px, 1.9cqw, 10px); background: var(--brown-100, #efe2cc); color: var(--brown-700, #6b4a24); border-radius: 999px; padding: 1px 7px; }
.hub-tag i { font-style: normal; opacity: 0.6; }

.hub-pill {
  position: absolute; transform: translate(-50%, -50%); z-index: 2;
  max-width: 28%; font: inherit; font-size: clamp(8px, 2cqw, 11px); font-weight: 600; line-height: 1.15;
  padding: 3px 8px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--c) 55%, #d3b58a);
  background: #fff; color: var(--text, #2a1c0e); text-align: center; cursor: default;
  display: flex; flex-direction: column; align-items: center; box-shadow: 0 2px 6px rgba(60, 40, 15, 0.12);
}
.hub-pill-ten { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.hub-pill small { font-weight: 500; font-size: 0.82em; color: var(--text-muted, #8a7a60); }
.hub-pill.nav { cursor: pointer; border-color: var(--c); }
.hub-pill.nav:hover { background: color-mix(in srgb, var(--c) 14%, #fff); transform: translate(-50%, -50%) scale(1.06); box-shadow: 0 4px 12px rgba(60, 40, 15, 0.22); }
.hub-pill:disabled { opacity: 0.92; }
</style>
