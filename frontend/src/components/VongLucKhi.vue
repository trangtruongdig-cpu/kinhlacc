<script setup lang="ts">
/**
 * VongLucKhi — Đồ hình LỤC KHÍ TÁC ĐỘNG TẠNG PHỦ (六氣 · 六淫 gây bệnh).
 *
 * Song song LucKinhWheel + học cách uốn chữ bám vành khăn của BienChungWheel.
 * Đọc theo TIA từ ngoài vào: Khí (Lục Khí·Hành) → KINH (bản khí ↔ Lục Kinh) → TẠNG/PHỦ.
 * TÂM = Ngũ Hành 五臟: trỏ 1 Khí → tạng bị tác động sáng lên, VÀ cung SINH/KHẮC
 *   (mối liên quan ngũ hành = cơ chế khí truyền biến qua tạng) nổi rõ, phần còn lại mờ.
 *
 * Vị trí góc mỗi Khí = chỗ Lục Kinh nó là bản khí → khớp không gian với đồ hình Lục Kinh.
 * viewBox 0 0 400 400, tâm (200,200), 0°=12 giờ, thuận chiều KĐH.
 */
import { ref, computed } from 'vue'
import { LUC_KHI } from '@/constants/lucKhi'

const props = withDefaults(
  defineProps<{
    counts?: Record<string, number>
    showCard?: boolean
    activeKhi?: string | null // khí đang chọn (mục chính)
    activeKinh?: string | null // slug Lục Kinh đang lọc sâu (đồng bộ panel → vòng)
    activeTang?: string | null // tạng phủ đang lọc sâu
  }>(),
  { showCard: true, activeKhi: null, activeKinh: null, activeTang: null },
)
const emit = defineEmits<{
  select: [{ type: 'khi' | 'kinh' | 'tang'; key: string; label: string; khi?: string }]
}>()

// Tên Lục Kinh → slug (để bấm vòng kinh mà lọc sâu, khớp chỉ mục lucKinh backend).
const KINH_SLUG: Record<string, string> = {
  'Thái Dương': 'thai-duong', 'Dương Minh': 'duong-minh', 'Thiếu Dương': 'thieu-duong',
  'Thái Âm': 'thai-am', 'Thiếu Âm': 'thieu-am', 'Quyết Âm': 'quyet-am',
}
const splitOrgans = (s: string) => s.split(/[·/]/).map((x) => x.trim()).filter(Boolean)

const CX = 200
const CY = 200
const D2R = Math.PI / 180
const N = (v: number) => v.toFixed(2)

function pt(r: number, deg: number) {
  const a = deg * D2R
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) }
}
function donut(rOut: number, rIn: number, a0: number, a1: number): string {
  const o0 = pt(rOut, a0)
  const o1 = pt(rOut, a1)
  const i1 = pt(rIn, a1)
  const i0 = pt(rIn, a0)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M${N(o0.x)} ${N(o0.y)} A${rOut} ${rOut} 0 ${large} 1 ${N(o1.x)} ${N(o1.y)} L${N(i1.x)} ${N(i1.y)} A${rIn} ${rIn} 0 ${large} 0 ${N(i0.x)} ${N(i0.y)} Z`
}
// Cung cho CHỮ BÁM theo vòng (textPath). Nửa dưới đảo chiều để chữ luôn đọc xuôi.
function arcPath(r: number, deg: number, span: number): string {
  const bottom = deg > 90 && deg < 270
  const a0 = bottom ? deg + span : deg - span
  const a1 = bottom ? deg - span : deg + span
  const p0 = pt(r, a0)
  const p1 = pt(r, a1)
  return `M${N(p0.x)} ${N(p0.y)} A${r} ${r} 0 0 ${bottom ? 0 : 1} ${N(p1.x)} ${N(p1.y)}`
}
function arrowHead(tip: { x: number; y: number }, dir: { x: number; y: number }, len = 8, w = 4.5) {
  const px = -dir.y
  const py = dir.x
  return `${N(tip.x)},${N(tip.y)} ${N(tip.x - dir.x * len + px * w)},${N(tip.y - dir.y * len + py * w)} ${N(tip.x - dir.x * len - px * w)},${N(tip.y - dir.y * len - py * w)}`
}

const HANH = {
  moc: { fill: 'rgba(126,176,112,.42)', bright: '#a6df92' },
  hoaT: { fill: 'rgba(216,124,74,.44)', bright: '#f4ab8a' },
  hoaQ: { fill: 'rgba(200,84,64,.46)', bright: '#f0907c' },
  tho: { fill: 'rgba(208,168,92,.44)', bright: '#f0cf82' },
  kim: { fill: 'rgba(228,216,184,.40)', bright: '#f3e8cc' },
  thuy: { fill: 'rgba(92,154,184,.44)', bright: '#93c8e2' },
}

// Dữ liệu 6 Khí ở constants/lucKhi.ts (dùng chung với panel ThuongHanView).
// Nửa TRÊN = khí của Tam Dương (Hàn 0°, Táo 60°, Thử 300°); DƯỚI = Tam Âm (Thấp 240°, Nhiệt 180°, Phong 120°).
const SECTORS = LUC_KHI.map((k) => ({
  deg: k.deg, group: k.group, khiVi: k.key, khiHan: k.han, hanh: k.hanh, mua: k.mua,
  tinh: k.tinh, kinhVi: k.kinhVi, kinhHan: k.kinhHan, tangVi: k.tangVi, tangHan: k.tangHan,
  tacDong: k.tacDong, trieuChung: k.trieuChung, triPhap: k.triPhap, phuongThuoc: k.phuongThuoc,
  nodes: k.nodes, rel: k.rel,
}))

const HALF = 30
const GAP = 1.6
const R = { khiO: 197, khiI: 150, kinhO: 148, kinhI: 110, tangO: 108, tangI: 70 }

// Vòng Tạng chia theo TỪNG tạng đích: 2 tạng → 2 nửa (ngoài/trong) bấm riêng như Túc/Thủ lớp 5.
const TANG_MID = 89
function tangCellsOf(deg: number, a0: number, a1: number, organs: string[], i: number) {
  const mk = (organ: string, rO: number, rI: number, lr: number, span: number, j: number) => ({
    organ,
    d: donut(rO, rI, a0, a1),
    hit: donut(rO, rI, deg - HALF, deg + HALF),
    arc: arcPath(lr, deg, span),
    arcId: `a-tc-${i}-${j}`,
  })
  if (organs.length >= 2) return [mk(organs[0]!, R.tangO, TANG_MID, 98, 24, 0), mk(organs[1]!, TANG_MID, R.tangI, 80, 20, 1)]
  return [mk(organs[0] ?? '', R.tangO, R.tangI, 90, 24, 0)]
}

const segs = SECTORS.map((s, i) => {
  const a0 = s.deg - HALF + GAP
  const a1 = s.deg + HALF - GAP
  return {
    ...s,
    i,
    khiD: donut(R.khiO, R.khiI, a0, a1),
    kinhD: donut(R.kinhO, R.kinhI, a0, a1),
    // 3 vùng bấm theo vòng (bấm sâu ngay trên đồ hình như lớp 5); vòng Tạng chia theo từng tạng
    khiHitD: donut(R.khiO + 3, R.kinhO, s.deg - HALF, s.deg + HALF),
    kinhHitD: donut(R.kinhO, R.tangO, s.deg - HALF, s.deg + HALF),
    kinhSlug: KINH_SLUG[s.kinhVi] ?? '',
    tangCells: tangCellsOf(s.deg, a0, a1, splitOrgans(s.tangVi), i),
    khiViArc: arcPath(172, s.deg, 25),
    khiSubArc: arcPath(157, s.deg, 24),
    kinhViArc: arcPath(131, s.deg, 26),
    kinhHanArc: arcPath(117, s.deg, 22),
    badgeP: pt(147, s.deg),
    bright: HANH[s.hanh].bright,
    khiFill: HANH[s.hanh].fill,
    tint: s.group === 'duong' ? 'rgba(214,178,108,.20)' : 'rgba(140,164,182,.17)',
    badge: props.counts?.[s.khiVi] ?? 0,
  }
})

// Nhãn nhóm Dương (trên) / Âm (dưới) — uốn cong bám vành ngoài (không lơ lửng).
const grpDuongArc = arcPath(189, 0, 44)
const grpAmArc = arcPath(189, 180, 44)

// ---- Tâm: Ngũ Hành 五臟 sinh/khắc ----
const PENTA_R = 46
const PNODE_R = 13
const PENTA = [
  { deg: 0, hanh: 'moc', han: '肝', vi: 'Can' },
  { deg: 72, hanh: 'hoaQ', han: '心', vi: 'Tâm' },
  { deg: 144, hanh: 'tho', han: '脾', vi: 'Tỳ' },
  { deg: 216, hanh: 'kim', han: '肺', vi: 'Phế' },
  { deg: 288, hanh: 'thuy', han: '腎', vi: 'Thận' },
] as const
const pnodes = PENTA.map((p, i) => ({ ...p, i, c: pt(PENTA_R, p.deg), bright: HANH[p.hanh].bright }))

// Sinh: cung idx i nối node i → (i+1)%5 (Mộc→Hỏa→Thổ→Kim→Thủy→Mộc)
const psinh = PENTA.map((p, i) => {
  const a0 = p.deg + 20
  const a1 = p.deg + 52
  const q0 = pt(PENTA_R, a0)
  const q1 = pt(PENTA_R, a1)
  const dir = { x: Math.cos(a1 * D2R), y: Math.sin(a1 * D2R) }
  return { d: `M${N(q0.x)} ${N(q0.y)} A${PENTA_R} ${PENTA_R} 0 0 1 ${N(q1.x)} ${N(q1.y)}`, head: arrowHead(q1, dir, 4.5, 2.6), from: i, to: (i + 1) % 5 }
})
// Khắc: dây idx i nối node i → (i+2)%5 (ngôi sao)
const pkhac = PENTA.map((p, i) => {
  const a = pt(PENTA_R, p.deg)
  const b = pt(PENTA_R, PENTA[(i + 2) % 5]!.deg)
  const dx = b.x - a.x
  const dy = b.y - a.y
  const L = Math.hypot(dx, dy)
  const ux = dx / L
  const uy = dy / L
  const tip = { x: b.x - ux * PNODE_R, y: b.y - uy * PNODE_R }
  return {
    x1: N(a.x + ux * PNODE_R), y1: N(a.y + uy * PNODE_R), x2: N(tip.x), y2: N(tip.y),
    head: arrowHead(tip, { x: ux, y: uy }, 5, 3), from: i, to: (i + 2) % 5,
  }
})

const TR = 13
const yang = '#f4e7d1'
const yin = '#4b3319'
const taiji = `M200 ${CY - TR} a ${TR / 2} ${TR / 2} 0 0 0 0 ${TR} a ${TR / 2} ${TR / 2} 0 0 1 0 ${TR} a ${TR} ${TR} 0 0 1 0 ${-2 * TR} Z`
const dotR = TR / 5

// ---- Tương tác ----
const hovered = ref<number | null>(null)
const pinned = ref<number | null>(null)
// Sector khớp khí đang lọc bên panel (đồng bộ panel → đồ hình, dù chuột không trên vòng).
const activeKhiIdx = computed(() => {
  if (props.activeKhi == null) return null
  const i = segs.findIndex((s) => s.khiVi === props.activeKhi)
  return i >= 0 ? i : null
})
// Rê chỉ tô sáng CỤC BỘ (hovered ưu tiên); bỏ chuột ra → quay về cung ĐÃ CHỐT (pinned) /
// cung đang lọc bên panel (activeKhiIdx). KHÔNG để hover tự đổi panel (tránh "nhảy" khi rê ra).
const active = computed(() => (hovered.value != null ? hovered.value : pinned.value != null ? pinned.value : activeKhiIdx.value))
const activeSeg = computed(() => (active.value == null ? null : segs[active.value]))
const activeNodes = computed(() => activeSeg.value?.nodes ?? [])
const activeRel = computed(() => activeSeg.value?.rel ?? null)
const isRelSinh = (i: number) => activeRel.value?.type === 'sinh' && activeRel.value.from === i
const isRelKhac = (i: number) => activeRel.value?.type === 'khac' && activeRel.value.from === i

// Rê = chỉ xem trước (tô sáng vòng), KHÔNG chốt panel.
function enter(i: number) {
  hovered.value = i
}
// BẤM mới chốt: vòng Khí = chọn khí; vòng Kinh/Tạng = lọc sâu (khi = khí chủ của cung).
function toggle(i: number) {
  pinned.value = i
  const seg = segs[i]
  if (seg) emit('select', { type: 'khi', key: seg.khiVi, label: `Lục Khí ${seg.khiVi} ${seg.khiHan}` })
}
function onKinh(i: number) {
  const s = segs[i]
  if (!s?.kinhSlug) return
  pinned.value = i
  emit('select', { type: 'kinh', key: s.kinhSlug, label: `${s.kinhVi} ${s.kinhHan}`, khi: s.khiVi })
}
function onTang(i: number, organ: string) {
  const s = segs[i]
  if (!s || !organ) return
  pinned.value = i
  emit('select', { type: 'tang', key: organ, label: organ, khi: s.khiVi })
}
const isKinhSub = (s: (typeof segs)[number]) => props.activeKinh != null && s.kinhSlug === props.activeKinh
const isTangSub = (organ: string) => props.activeTang != null && props.activeTang === organ
</script>

<template>
  <div class="vlk" @mouseleave="hovered = null">
    <svg
      class="vlk-svg"
      viewBox="0 0 400 400"
      role="img"
      aria-label="Đồ hình Lục Khí tác động Tạng Phủ: Khí → Kinh (bản khí) → Tạng/Phủ, tâm Ngũ Hành sinh khắc"
    >
      <title>Lục Khí tác động Tạng Phủ — Khí · bản khí ↔ Lục Kinh · Tạng/Phủ · Ngũ Hành sinh khắc</title>
      <defs>
        <radialGradient id="vlk-stone" cx="50%" cy="40%" r="64%">
          <stop offset="0%" stop-color="#5b3f20" />
          <stop offset="46%" stop-color="#4a3219" />
          <stop offset="80%" stop-color="#37230f" />
          <stop offset="100%" stop-color="#2a1a0a" />
        </radialGradient>
        <radialGradient id="vlk-glow" cx="50%" cy="46%" r="48%">
          <stop offset="0%" stop-color="rgba(250,240,218,.30)" />
          <stop offset="55%" stop-color="rgba(248,236,212,.08)" />
          <stop offset="100%" stop-color="rgba(248,236,212,0)" />
        </radialGradient>
        <linearGradient id="vlk-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fbf2dd" />
          <stop offset="48%" stop-color="#e3cd9a" />
          <stop offset="100%" stop-color="#a4743a" />
        </linearGradient>
        <radialGradient id="vlk-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(0,0,0,0)" />
          <stop offset="80%" stop-color="rgba(0,0,0,0)" />
          <stop offset="100%" stop-color="rgba(12,6,2,.55)" />
        </radialGradient>
        <!-- Cung cho chữ bám vành khăn -->
        <path v-for="s in segs" :id="'a-khi' + s.i" :key="'pk' + s.i" :d="s.khiViArc" />
        <path v-for="s in segs" :id="'a-khis' + s.i" :key="'pks' + s.i" :d="s.khiSubArc" />
        <path v-for="s in segs" :id="'a-kinh' + s.i" :key="'pj' + s.i" :d="s.kinhViArc" />
        <path v-for="s in segs" :id="'a-kinhh' + s.i" :key="'pjh' + s.i" :d="s.kinhHanArc" />
        <template v-for="s in segs" :key="'tcd' + s.i">
          <path v-for="c in s.tangCells" :id="c.arcId" :key="c.arcId" :d="c.arc" />
        </template>
        <path id="a-grp-d" :d="grpDuongArc" />
        <path id="a-grp-a" :d="grpAmArc" />
      </defs>

      <g aria-hidden="true">
        <circle :cx="CX" :cy="CY" r="196" fill="url(#vlk-stone)" />
        <circle :cx="CX" :cy="CY" r="160" fill="url(#vlk-glow)" />
        <circle :cx="CX" :cy="CY" r="196" fill="url(#vlk-shadow)" />
      </g>

      <!-- ===== 3 vòng đồng tia: Khí → Kinh → Tạng ===== -->
      <g
        v-for="s in segs"
        :key="'sec' + s.i"
        class="sector"
        :class="{ 'is-active': active === s.i, 'is-dim': active != null && active !== s.i }"
      >
        <path :d="s.khiD" class="wedge" :style="{ fill: s.khiFill }" />
        <path :d="s.kinhD" class="wedge" :class="{ 'sub-on': isKinhSub(s) }" :style="{ fill: s.tint }" />
        <path v-for="c in s.tangCells" :key="'tw' + c.arcId" :d="c.d" class="wedge" :class="{ 'sub-on': isTangSub(c.organ) }" :style="{ fill: s.tint }" />

        <text class="t-vi t-khi" :style="{ fill: s.bright }"><textPath :href="'#a-khi' + s.i" startOffset="50%">{{ s.khiVi }}</textPath></text>
        <text class="t-han t-khi-sub" :style="{ fill: s.bright }"><textPath :href="'#a-khis' + s.i" startOffset="50%">{{ s.khiHan }} · {{ s.mua }}</textPath></text>
        <text class="t-vi t-kinh"><textPath :href="'#a-kinh' + s.i" startOffset="50%">{{ s.kinhVi }}</textPath></text>
        <text class="t-han t-kinh-han"><textPath :href="'#a-kinhh' + s.i" startOffset="50%">{{ s.kinhHan }}</textPath></text>
        <text v-for="c in s.tangCells" :key="'tt' + c.arcId" class="t-vi t-tang" :class="{ 'sub-on': isTangSub(c.organ) }"><textPath :href="'#' + c.arcId" startOffset="50%">{{ c.organ }}</textPath></text>
      </g>

      <line class="axis-h" :x1="CX - 197" :y1="CY" :x2="CX + 197" :y2="CY" />

      <!-- ===== Tâm: Ngũ Hành + mối liên quan sinh/khắc ===== -->
      <g class="hub" :class="{ 'rel-mode': activeRel != null }">
        <circle :cx="CX" :cy="CY" r="60" fill="url(#vlk-stone)" stroke="rgba(226,205,154,.35)" stroke-width="1" />
        <!-- Tương khắc -->
        <g class="p-khac-g">
          <g
            v-for="(k, i) in pkhac"
            :key="'pkc' + i"
            class="p-khac"
            :class="{ 'rel-on': isRelKhac(i), 'rel-off': activeRel != null && !isRelKhac(i) }"
          >
            <line :x1="k.x1" :y1="k.y1" :x2="k.x2" :y2="k.y2" />
            <polygon v-if="isRelKhac(i)" :points="k.head" />
          </g>
        </g>
        <!-- Tương sinh -->
        <g class="p-sinh">
          <g
            v-for="(s, i) in psinh"
            :key="'ps' + i"
            :class="{ 'rel-on': isRelSinh(i), 'rel-off': activeRel != null && !isRelSinh(i) }"
          >
            <path :d="s.d" />
            <polygon :points="s.head" />
          </g>
        </g>
        <!-- 5 node tạng — tiếng Việt lớn + Hán nhỏ (như lớp Tạng Phủ) -->
        <g v-for="n in pnodes" :key="'pn' + n.i" class="p-node" :class="{ hot: activeNodes.includes(n.i) }">
          <circle :cx="n.c.x" :cy="n.c.y" :r="PNODE_R" class="p-badge" :style="{ stroke: n.bright }" />
          <text class="p-vi" :x="n.c.x" :y="n.c.y - 2.5" :fill="n.bright">{{ n.vi }}</text>
          <text class="p-han" :x="n.c.x" :y="n.c.y + 6" :fill="n.bright">{{ n.han }}</text>
        </g>
        <g class="core">
          <circle :cx="CX" :cy="CY" :r="TR" :fill="yang" stroke="rgba(247,239,222,.6)" stroke-width="1" />
          <path :d="taiji" :fill="yin" />
          <circle :cx="CX" :cy="CY - TR / 2" :r="dotR" :fill="yang" />
          <circle :cx="CX" :cy="CY + TR / 2" :r="dotR" :fill="yin" />
        </g>
      </g>

      <g fill="none">
        <circle :cx="CX" :cy="CY" r="197" stroke="url(#vlk-rim)" stroke-width="2.6" stroke-opacity=".92" />
        <g class="rims">
          <circle :cx="CX" :cy="CY" r="149" />
          <circle :cx="CX" :cy="CY" r="109" />
          <circle :cx="CX" :cy="CY" r="69" />
        </g>
      </g>

      <text class="grp grp-duong"><textPath href="#a-grp-d" startOffset="50%">☀ Khí Tam Dương · phạm Biểu/Phủ</textPath></text>
      <text class="grp grp-am"><textPath href="#a-grp-a" startOffset="50%">❄ Khí Tam Âm · phạm Lý/Tạng</textPath></text>

      <!-- badge số thể bệnh -->
      <g v-for="s in segs" :key="'bdg' + s.i">
        <g v-if="s.badge > 0" class="cnt" :class="{ dim: active != null && active !== s.i }">
          <circle :cx="s.badgeP.x" :cy="s.badgeP.y" r="8.4" />
          <text :x="s.badgeP.x" :y="s.badgeP.y">{{ s.badge }}</text>
        </g>
      </g>

      <g v-for="s in segs" :key="'hit' + s.i">
        <!-- Vòng KHÍ (ngoài) = chọn/ghim mục chính -->
        <path
          :d="s.khiHitD"
          class="hit"
          tabindex="0"
          role="button"
          :aria-label="`Lục Khí ${s.khiVi}: bản khí ${s.kinhVi}, tác động ${s.tangVi}`"
          @mouseenter="enter(s.i)"
          @focus="enter(s.i)"
          @blur="hovered = null"
          @click="toggle(s.i)"
          @keydown.enter.prevent="toggle(s.i)"
          @keydown.space.prevent="toggle(s.i)"
        />
        <!-- Vòng KINH (giữa) = lọc sâu theo Lục Kinh -->
        <path
          :d="s.kinhHitD"
          class="hit hit-sub"
          role="button"
          :aria-label="`Lọc theo Lục Kinh ${s.kinhVi}`"
          @mouseenter="enter(s.i)"
          @click.stop="onKinh(s.i)"
        />
        <!-- Vòng TẠNG (trong) = mỗi tạng đích một nửa bấm riêng -->
        <path
          v-for="c in s.tangCells"
          :key="'thit' + c.arcId"
          :d="c.hit"
          class="hit hit-sub"
          role="button"
          :aria-label="`Lọc theo tạng ${c.organ}`"
          @mouseenter="enter(s.i)"
          @click.stop="onTang(s.i, c.organ)"
        />
      </g>
    </svg>

    <!-- ===== Thẻ chi tiết (ẩn khi panel ngoài đã hiển thị lý thuyết) ===== -->
    <transition name="vlk-fade">
      <div v-if="showCard && activeSeg" class="vlk-card" :class="activeSeg.group">
        <div class="card-head">
          <div class="card-title">
            <span class="ch-vi" :style="{ color: activeSeg.bright }">{{ activeSeg.khiVi }}</span>
            <span class="ch-han">{{ activeSeg.khiHan }}</span>
          </div>
          <span class="card-badge">{{ activeSeg.mua }}</span>
        </div>
        <dl class="card-rows">
          <div class="row"><dt>Đặc tính</dt><dd>{{ activeSeg.tinh }}</dd></div>
          <div class="row"><dt>Bản khí</dt><dd>↔ Kinh <b>{{ activeSeg.kinhVi }}</b> {{ activeSeg.kinhHan }}</dd></div>
          <div class="row hi"><dt>Tác động tạng phủ</dt><dd><b>{{ activeSeg.tangVi }}</b> {{ activeSeg.tangHan }} — {{ activeSeg.tacDong }}</dd></div>
          <div class="row rel"><dt>Cơ chế ngũ hành</dt><dd><span class="rel-tag" :class="activeSeg.rel.type">{{ activeSeg.rel.type === 'sinh' ? 'Sinh' : 'Khắc' }}</span> {{ activeSeg.rel.note }}</dd></div>
          <div class="row"><dt>Triệu chứng</dt><dd>{{ activeSeg.trieuChung }}</dd></div>
          <div class="row hi"><dt>Trị pháp</dt><dd><b>{{ activeSeg.triPhap }}</b> — <i>{{ activeSeg.phuongThuoc }}</i></dd></div>
        </dl>
      </div>
    </transition>

    <p class="vlk-hint">
      <span v-if="!activeSeg">Rê chuột / chạm một <b>Khí</b>. Tia: <b>Khí → Kinh (bản khí) → Tạng/Phủ</b> · tâm sáng = tạng bị tác động + cung sinh/khắc liên quan.</span>
      <span v-else>Tâm: node <b>五臟</b> sáng = tạng <b>{{ activeSeg.khiVi }}</b> tác động; cung nổi = <b>mối liên quan ngũ hành</b> ({{ activeSeg.rel.type === 'sinh' ? 'sinh' : 'khắc' }}).</span>
    </p>
  </div>
</template>

<style scoped>
.vlk {
  position: relative;
  width: 100%;
  max-width: min(100%, 60vh); /* khớp cỡ VongLucKinh (62vh) / BienChungWheel (58vh) — không phình kín cột */
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  container-type: inline-size;
}
.vlk-svg {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
  filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.28));
}

.vlk-svg text {
  font-family: var(--font-family, 'Inter', sans-serif);
  text-anchor: middle;
  dominant-baseline: middle;
  paint-order: stroke;
  stroke-linejoin: round;
  user-select: none;
  pointer-events: none;
}
.t-vi { font-weight: 800; fill: #f6ecd8; stroke: rgba(28, 16, 6, 0.75); stroke-width: 1.1px; }
.t-han { font-weight: 500; fill: #f0e4cd; opacity: 0.66; stroke: rgba(28, 16, 6, 0.6); stroke-width: 0.7px; }
.t-khi { font-size: 12.5px; }
.t-khi-sub { font-size: 7px; opacity: 0.85; stroke-width: 0.5px; }
.t-kinh { font-size: 10px; }
.t-kinh-han { font-size: 7.5px; letter-spacing: 0.5px; }
.t-tang { font-size: 8.5px; }
.t-tang-han { font-size: 7px; letter-spacing: 0.5px; }

.wedge { stroke: rgba(247, 242, 233, 0.26); stroke-width: 0.8; transition: opacity 0.2s ease, filter 0.2s ease; }
.sector.is-dim { opacity: 0.4; }
.sector.is-active .wedge { stroke: rgba(251, 242, 221, 0.85); stroke-width: 1.3; filter: drop-shadow(0 0 5px rgba(250, 233, 200, 0.45)); }
.sector.is-active .t-vi { fill: #fff8ea; }
/* Vòng đang lọc sâu (Kinh / Tạng) — sáng viền vàng như lớp Lục Kinh */
.wedge.sub-on { stroke: #f2d79a; stroke-width: 1.7; filter: drop-shadow(0 0 6px rgba(242, 215, 154, 0.65)); }
.t-tang.sub-on { fill: #fff3d6; }
.hit-sub { cursor: pointer; }

.axis-h { stroke: rgba(250, 240, 224, 0.26); stroke-width: 0.8; stroke-dasharray: 3 4; }
.rims circle { stroke: rgba(248, 240, 224, 0.3); stroke-width: 1; }

/* ---- Tâm Ngũ Hành + mối liên quan ---- */
.p-sinh path { fill: none; stroke: #7cbf74; stroke-width: 1.5; stroke-linecap: round; opacity: 0.85; }
.p-sinh polygon { fill: #7cbf74; opacity: 0.9; }
.p-khac line { stroke: #cf7a5a; stroke-width: 0.9; opacity: 0.4; }
.p-khac polygon { fill: #f0906a; }
/* Làm nổi cung quan hệ khi trỏ 1 khí */
.rel-off { opacity: 0.12 !important; }
.p-sinh .rel-on path { stroke: #8fe07f; stroke-width: 2.6; opacity: 1; filter: drop-shadow(0 0 4px rgba(143, 224, 127, 0.65)); }
.p-sinh .rel-on polygon { fill: #8fe07f; opacity: 1; }
.p-khac.rel-on line { stroke: #f6a07a; stroke-width: 2.4; opacity: 1; filter: drop-shadow(0 0 4px rgba(246, 160, 122, 0.7)); }

.p-badge { fill: rgba(24, 14, 6, 0.9); stroke-width: 1.5; transition: filter 0.2s ease; }
.p-vi { font-size: 8px; font-weight: 800; stroke: rgba(20, 11, 4, 0.55); stroke-width: 0.6px; }
.p-han { font-size: 5.5px; font-weight: 600; opacity: 0.72; stroke: rgba(20, 11, 4, 0.4); stroke-width: 0.3px; }
.p-node.hot .p-badge { filter: drop-shadow(0 0 6px rgba(250, 233, 200, 0.85)); stroke-width: 2.4; }
.p-node.hot .p-vi { font-size: 9px; }

.hit { fill: transparent; pointer-events: all; cursor: pointer; outline: none; }
.hit:focus-visible { fill: rgba(250, 240, 224, 0.08); stroke: rgba(250, 233, 200, 0.7); stroke-width: 1.5; }
.grp { font-size: 7.5px; font-weight: 800; letter-spacing: 0.5px; fill: #f3e6cd; opacity: 0.8; stroke: rgba(28, 16, 6, 0.7); stroke-width: 1px; }
.grp-duong { fill: #f2d29a; }
.grp-am { fill: #b9cede; }

.cnt circle { fill: #a4743a; stroke: #fbf2dd; stroke-width: 1; }
.cnt text { font-size: 8px; font-weight: 800; fill: #fff; }
.cnt.dim { opacity: 0.35; }

.core { transform-box: view-box; transform-origin: 200px 200px; animation: vlk-spin 42s linear infinite; }
@keyframes vlk-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .core { animation: none; } }

.vlk-card {
  position: absolute; top: 3%; right: 100%; margin-right: 10px;
  width: clamp(238px, 80vw, 300px); max-height: 94%; overflow: auto; z-index: 6;
  background: linear-gradient(160deg, rgba(38, 24, 11, 0.97), rgba(24, 14, 6, 0.98));
  border: 1px solid rgba(226, 200, 150, 0.28); border-radius: 12px; padding: 12px 14px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.5); color: #efe3cd;
}
.vlk-card.duong { border-top: 3px solid #e0b062; }
.vlk-card.am { border-top: 3px solid #8fb0c8; }
.card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 9px; }
.card-title { display: flex; align-items: baseline; gap: 6px; }
.ch-vi { font-size: 17px; font-weight: 800; }
.ch-han { font-size: 12px; opacity: 0.7; }
.card-badge { font-size: 9.5px; font-weight: 700; white-space: nowrap; color: #d8c6a3; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.14); padding: 2px 8px; border-radius: 999px; }
.card-rows { display: flex; flex-direction: column; gap: 6px; margin: 0; }
.row { display: grid; grid-template-columns: 78px 1fr; gap: 8px; font-size: 11.5px; line-height: 1.4; }
.row dt { margin: 0; font-weight: 700; color: #c7ac7f; }
.row dd { margin: 0; color: #eadfca; }
.row.hi dd { color: #f6e9cf; }
.row.rel dd { color: #eadfca; }
.rel-tag { font-size: 9.5px; font-weight: 800; padding: 1px 6px; border-radius: 999px; margin-right: 4px; }
.rel-tag.sinh { color: #d7f3cd; background: rgba(124, 191, 116, 0.28); }
.rel-tag.khac { color: #f8d6c6; background: rgba(207, 122, 90, 0.32); }

/* Gợi ý nằm DƯỚI đồ hình, trên nền trang SÁNG → dùng chữ tối cho dễ đọc (không trùng nền). */
.vlk-hint { margin: 0; font-size: 10.5px; line-height: 1.4; text-align: center; color: var(--text-muted, #6f685c); max-width: 44ch; }
.vlk-hint b { color: var(--brown-700, #6f4a22); }

.vlk-fade-enter-active, .vlk-fade-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.vlk-fade-enter-from, .vlk-fade-leave-to { opacity: 0; transform: translateX(6px); }

@media (max-width: 720px) {
  .vlk-card { position: absolute; inset: 5% 4% auto 4%; right: auto; margin: 0; width: auto; max-height: 88%; }
}
@container (max-width: 210px) {
  .vlk-hint, .vlk-card { display: none; }
}
</style>
