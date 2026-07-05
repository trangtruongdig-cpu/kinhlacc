<script setup lang="ts">
/**
 * LucKinhWheel — Đồ hình BIỆN CHỨNG LỤC KINH (Thương Hàn Luận).
 *
 * XƯƠNG SỐNG = BIỂU-LÝ đối xứng tâm: mỗi kinh Dương (nửa TRÊN) nằm ĐỐI DIỆN
 * kinh Âm biểu-lý (nửa DƯỚI) → 3 trục Trung kiến xuyên qua Thái Cực:
 *   Thái Dương ↔ Thiếu Âm · Dương Minh ↔ Thái Âm · Thiếu Dương ↔ Quyết Âm
 *
 * Đọc theo TIA từ ngoài vào trong:
 *   Khai/Hạp/Xu · KINH (Tiêu) → BẢN KHÍ (Lục Khí·Hành, + tòng hóa) → TẠNG/PHỦ đích
 * TÂM = Ngũ Hành sinh/khắc (五行 tạng phủ) — ĐỘNG CƠ truyền biến ("Can truyền Tỳ").
 *
 * 4 tầng lý thuyết: ① Tòng hóa 标本从化 (bản/bản-tiêu/trung → hàn-nhiệt hóa)
 *   ② Trục biểu-lý (Trung kiến)  ③ Ngũ Hành sinh/khắc ở tâm  ④ Khai–Hạp–Xu.
 * Hover một Kinh: sáng cung + trục biểu-lý + node Ngũ Hành liên quan, mở thẻ chi tiết.
 *
 * Toạ độ viewBox 0 0 400 400, tâm (200,200), góc 0°=12 giờ, thuận chiều KĐH.
 */
import { ref, computed } from 'vue'

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
function pieArc(r: number, a0: number, a1: number): string {
  const p0 = pt(r, a0)
  const p1 = pt(r, a1)
  return `M${CX} ${CY} L${N(p0.x)} ${N(p0.y)} A${r} ${r} 0 0 1 ${N(p1.x)} ${N(p1.y)} Z`
}
function arrowHead(tip: { x: number; y: number }, dir: { x: number; y: number }, len = 8, w = 4.5) {
  const px = -dir.y
  const py = dir.x
  return `${N(tip.x)},${N(tip.y)} ${N(tip.x - dir.x * len + px * w)},${N(tip.y - dir.y * len + py * w)} ${N(tip.x - dir.x * len - px * w)},${N(tip.y - dir.y * len - py * w)}`
}

// ---- Màu Ngũ Hành (Hỏa tách Quân/Tướng) ----
const HANH = {
  moc: { fill: 'rgba(126,176,112,.42)', bright: '#a6df92' },
  hoaT: { fill: 'rgba(216,124,74,.44)', bright: '#f4ab8a' }, // Tướng Hỏa
  hoaQ: { fill: 'rgba(200,84,64,.46)', bright: '#f0907c' }, // Quân Hỏa
  tho: { fill: 'rgba(208,168,92,.44)', bright: '#f0cf82' },
  kim: { fill: 'rgba(228,216,184,.40)', bright: '#f3e8cc' },
  thuy: { fill: 'rgba(92,154,184,.44)', bright: '#93c8e2' },
}
const DUONG_TINT = 'rgba(214,178,108,.20)'
const AM_TINT = 'rgba(140,164,182,.17)'

// Tòng hóa: bản | ban-tieu (lưỡng hóa) | trung
const TONG = {
  ban: { glyph: '本', label: 'tòng Bản' },
  bantieu: { glyph: '⇌', label: 'tòng Bản–Tiêu (lưỡng hóa)' },
  trung: { glyph: '中', label: 'tòng Trung khí' },
}

interface Sector {
  deg: number
  group: 'duong' | 'am'
  kinhVi: string
  kinhHan: string
  khx: string // Khai / Hạp / Xu
  khxHan: string // 開 / 闔 / 樞
  khiVi: string
  khiHan: string
  hanh: keyof typeof HANH
  tong: keyof typeof TONG
  hoaNote: string
  tangType: 'Phủ' | 'Tạng'
  tangVi: string
  tangHan: string
  tangSub: string
  trungKien: string
  trieuChung: string
  triPhap: string
  phuongThuoc: string
  truyenBien: string
  nodes: number[] // node Ngũ Hành (idx trong penta) liên quan
  khac?: boolean // bật mũi tên Can khắc Tỳ (Quyết Âm)
}

// Nửa TRÊN = Tam Dương (0°, 60°, 300°); nửa DƯỚI = Tam Âm đối diện biểu-lý.
//   Thái Dương(0)↔Thiếu Âm(180) · Dương Minh(60)↔Thái Âm(240) · Thiếu Dương(300)↔Quyết Âm(120)
const SECTORS: Sector[] = [
  {
    deg: 0, group: 'duong', kinhVi: 'Thái Dương', kinhHan: '太陽', khx: 'Khai', khxHan: '開',
    khiVi: 'Hàn · Thủy', khiHan: '寒', hanh: 'thuy', tong: 'bantieu',
    hoaNote: 'Bản Hàn, tiêu Dương → vừa có hàn chứng vừa dễ HÓA NHIỆT.',
    tangType: 'Phủ', tangVi: 'Bàng Quang', tangHan: '膀胱', tangSub: '→ ảnh hưởng Phế 肺 (chủ bì mao)',
    trungKien: 'Thiếu Âm 少陰 (Thận)',
    trieuChung: 'Mạch phù, đau đầu gáy cứng, sợ lạnh, phát sốt; nặng thêm ho, suyễn, ngạt mũi (Phế).',
    triPhap: 'Phát hãn giải biểu', phuongThuoc: 'Quế Chi Thang · Ma Hoàng Thang',
    truyenBien: '→ Dương Minh (hóa nhiệt) hoặc nội hãm Thiếu Âm.', nodes: [4],
  },
  {
    deg: 60, group: 'duong', kinhVi: 'Dương Minh', kinhHan: '陽明', khx: 'Hạp', khxHan: '闔',
    khiVi: 'Táo · Kim', khiHan: '燥', hanh: 'kim', tong: 'trung',
    hoaNote: 'Táo tòng Trung (Thái Âm Thấp) → dễ hóa táo, thiêu đốt tân dịch.',
    tangType: 'Phủ', tangVi: 'Vị · Đại Trường', tangHan: '胃 大腸', tangSub: 'Cực thịnh của Dương',
    trungKien: 'Thái Âm 太陰 (Tỳ)',
    trieuChung: 'Sốt cao, đại hãn, đại khát, mạch hồng đại (kinh chứng); hoặc táo bón, bụng đầy đau cự án (phủ chứng).',
    triPhap: 'Thanh nhiệt / Công hạ', phuongThuoc: 'Bạch Hổ Thang · Thừa Khí Thang',
    truyenBien: 'Thiêu đốt tân dịch → truyền vào Tam Âm.', nodes: [2],
  },
  {
    deg: 300, group: 'duong', kinhVi: 'Thiếu Dương', kinhHan: '少陽', khx: 'Xu', khxHan: '樞',
    khiVi: 'Tướng Hỏa', khiHan: '相火', hanh: 'hoaT', tong: 'ban',
    hoaNote: 'Tòng Bản → bệnh chủ về Hỏa nhiệt (Tướng hỏa bốc).',
    tangType: 'Phủ', tangVi: 'Đởm · Tam Tiêu', tangHan: '膽 三焦', tangSub: 'Bán biểu bán lý',
    trungKien: 'Quyết Âm 厥陰 (Can)',
    trieuChung: 'Hàn nhiệt vãng lai, ngực sườn đầy tức, miệng đắng họng khô, mắt hoa, mạch huyền.',
    triPhap: 'Hòa giải', phuongThuoc: 'Tiểu Sài Hồ Thang',
    truyenBien: 'Bản lề (Xu): giải ra Dương hoặc hãm vào Âm.', nodes: [0],
  },
  {
    deg: 240, group: 'am', kinhVi: 'Thái Âm', kinhHan: '太陰', khx: 'Khai', khxHan: '開',
    khiVi: 'Thấp · Thổ', khiHan: '濕', hanh: 'tho', tong: 'ban',
    hoaNote: 'Tòng Bản → bệnh chủ về hàn thấp (Tỳ dương hư).',
    tangType: 'Tạng', tangVi: 'Tỳ', tangHan: '脾', tangSub: 'Khởi đầu của Âm — hư hàn trung tiêu',
    trungKien: 'Dương Minh 陽明 (Vị)',
    trieuChung: 'Bụng đầy chướng, ăn không tiêu, nôn mửa, tiêu chảy, không khát, mạch hoãn nhược.',
    triPhap: 'Ôn trung tán hàn', phuongThuoc: 'Lý Trung Thang',
    truyenBien: 'Nhận “Can truyền Tỳ” (Mộc khắc Thổ) từ Quyết Âm.', nodes: [2],
  },
  {
    deg: 180, group: 'am', kinhVi: 'Thiếu Âm', kinhHan: '少陰', khx: 'Xu', khxHan: '樞',
    khiVi: 'Quân Hỏa', khiHan: '君火', hanh: 'hoaQ', tong: 'bantieu',
    hoaNote: 'Lưỡng hóa → HÀN HÓA (Tứ Nghịch Thang) hoặc NHIỆT HÓA (Hoàng Liên A Giao).',
    tangType: 'Tạng', tangVi: 'Tâm · Thận', tangHan: '心 腎', tangSub: 'Thủy–Hỏa tương giao, trục sinh tử',
    trungKien: 'Thái Dương 太陽 (Bàng Quang)',
    trieuChung: 'Mạch vi tế, chỉ muốn ngủ (đãn dục mị), sợ lạnh nằm co, tứ chi quyết lạnh (hàn hóa); hoặc tâm phiền mất ngủ (nhiệt hóa).',
    triPhap: 'Hồi dương cứu nghịch / Tư âm', phuongThuoc: 'Tứ Nghịch Thang · Hoàng Liên A Giao Thang',
    truyenBien: 'Nguy kịch — vong dương, âm dương ly quyết.', nodes: [1, 4],
  },
  {
    deg: 120, group: 'am', kinhVi: 'Quyết Âm', kinhHan: '厥陰', khx: 'Hạp', khxHan: '闔',
    khiVi: 'Phong · Mộc', khiHan: '風', hanh: 'moc', tong: 'trung',
    hoaNote: 'Phong tòng Trung (Thiếu Dương Hỏa) → HÀN NHIỆT THÁC TẠP.',
    tangType: 'Tạng', tangVi: 'Can · Tâm Bào', tangHan: '肝 心包', tangSub: 'Tột cùng của Âm',
    trungKien: 'Thiếu Dương 少陽 (Đởm)',
    trieuChung: 'Tiêu khát, khí xông lên tim, đói không muốn ăn, ăn vào nôn giun, chân tay quyết lạnh mà trong nóng.',
    triPhap: 'Hàn nhiệt kiêm trị', phuongThuoc: 'Ô Mai Hoàn',
    truyenBien: 'Mộc khắc Thổ → Can truyền Tỳ; âm tận thì dương sinh.', nodes: [0], khac: true,
  },
]

const HALF = 30
const GAP = 1.6
const R = { kinhO: 197, kinhI: 150, khiO: 148, khiI: 110, tangO: 108, tangI: 70 }
const LR = { khx: 191, kinhVi: 179, kinhHan: 162, khiHan: 135, khiVi: 118, tong: 112, tangVi: 94, tangHan: 78 }

const segs = SECTORS.map((s, i) => {
  const a0 = s.deg - HALF + GAP
  const a1 = s.deg + HALF - GAP
  return {
    ...s,
    i,
    kinhD: donut(R.kinhO, R.kinhI, a0, a1),
    khiD: donut(R.khiO, R.khiI, a0, a1),
    tangD: donut(R.tangO, R.tangI, a0, a1),
    hitD: pieArc(R.kinhO + 3, s.deg - HALF, s.deg + HALF),
    khxP: pt(LR.khx, s.deg),
    kinhViP: pt(LR.kinhVi, s.deg),
    kinhHanP: pt(LR.kinhHan, s.deg),
    khiHanP: pt(LR.khiHan, s.deg),
    khiViP: pt(LR.khiVi, s.deg),
    tongP: pt(LR.tong, s.deg),
    tangViP: pt(LR.tangVi, s.deg),
    tangHanP: pt(LR.tangHan, s.deg),
    tint: s.group === 'duong' ? DUONG_TINT : AM_TINT,
    bright: HANH[s.hanh].bright,
    khiFill: HANH[s.hanh].fill,
    tongGlyph: TONG[s.tong].glyph,
    partnerDeg: (s.deg + 180) % 360,
  }
})

// Trục biểu-lý (Trung kiến): 3 đường kính, mỗi đường ứng cặp kinh biểu-lý.
const axes = segs
  .filter((s) => s.group === 'duong')
  .map((s) => {
    const p0 = pt(R.kinhI, s.deg)
    const p1 = pt(R.kinhI, s.partnerDeg)
    return { degs: [s.deg, s.partnerDeg], x1: N(p0.x), y1: N(p0.y), x2: N(p1.x), y2: N(p1.y) }
  })

// ---- Tâm: Ngũ Hành sinh/khắc (五行) ----
const PENTA_R = 46
const PNODE_R = 11.5
const PENTA = [
  { deg: 0, hanh: 'moc', han: '肝', vi: 'Can' },
  { deg: 72, hanh: 'hoaQ', han: '心', vi: 'Tâm' },
  { deg: 144, hanh: 'tho', han: '脾', vi: 'Tỳ' },
  { deg: 216, hanh: 'kim', han: '肺', vi: 'Phế' },
  { deg: 288, hanh: 'thuy', han: '腎', vi: 'Thận' },
] as const
const pnodes = PENTA.map((p, i) => ({ ...p, i, c: pt(PENTA_R, p.deg), bright: HANH[p.hanh].bright }))

// Tương Sinh: cung mũi tên KĐH nối 2 hành kề (Mộc→Hỏa→Thổ→Kim→Thủy)
const psinh = PENTA.map((p) => {
  const a0 = p.deg + 20
  const a1 = p.deg + 52
  const q0 = pt(PENTA_R, a0)
  const q1 = pt(PENTA_R, a1)
  const dir = { x: Math.cos(a1 * D2R), y: Math.sin(a1 * D2R) }
  return { d: `M${N(q0.x)} ${N(q0.y)} A${PENTA_R} ${PENTA_R} 0 0 1 ${N(q1.x)} ${N(q1.y)}`, head: arrowHead(q1, dir, 4.5, 2.6) }
})
// Tương Khắc: dây cung nối hành cách 2 bước (Mộc→Thổ, Thổ→Thủy, …). idx→(idx+2)%5
const pkhac = PENTA.map((p, i) => {
  const a = pt(PENTA_R, p.deg)
  const b = pt(PENTA_R, PENTA[(i + 2) % 5]!.deg)
  const dx = b.x - a.x
  const dy = b.y - a.y
  const L = Math.hypot(dx, dy)
  const ux = dx / L
  const uy = dy / L
  return {
    from: i,
    to: (i + 2) % 5,
    x1: N(a.x + ux * PNODE_R),
    y1: N(a.y + uy * PNODE_R),
    x2: N(b.x - ux * PNODE_R),
    y2: N(b.y - uy * PNODE_R),
  }
})

// Thái Cực nhỏ ở chính giữa
const TR = 13
const yang = '#f4e7d1'
const yin = '#4b3319'
const taiji = `M200 ${CY - TR} a ${TR / 2} ${TR / 2} 0 0 0 0 ${TR} a ${TR / 2} ${TR / 2} 0 0 1 0 ${TR} a ${TR} ${TR} 0 0 1 0 ${-2 * TR} Z`
const dotR = TR / 5

// ---- Tương tác ----
const hovered = ref<number | null>(null)
const pinned = ref<number | null>(null)
const active = computed(() => (pinned.value != null ? pinned.value : hovered.value))
const activeSeg = computed(() => (active.value == null ? null : segs[active.value]))
const activeDegs = computed(() => {
  const a = activeSeg.value
  return a ? [a.deg, a.partnerDeg] : []
})
const activeNodes = computed(() => activeSeg.value?.nodes ?? [])
const activeAxis = computed(() => {
  const a = activeSeg.value
  if (!a) return null
  const p0 = pt(R.kinhI, a.deg)
  const p1 = pt(R.kinhI, a.partnerDeg)
  return { x1: N(p0.x), y1: N(p0.y), x2: N(p1.x), y2: N(p1.y) }
})

function isAxisHot(degs: number[]) {
  return activeSeg.value != null && degs.includes(activeSeg.value.deg)
}
function toggle(i: number) {
  pinned.value = pinned.value === i ? null : i
}
</script>

<template>
  <div class="lkw" @mouseleave="hovered = null">
    <svg
      class="lkw-svg"
      viewBox="0 0 400 400"
      role="img"
      aria-label="Đồ hình Biện chứng Lục Kinh: cặp biểu-lý đối xứng, Kinh → Bản khí → Tạng Phủ, tâm Ngũ Hành sinh khắc"
    >
      <title>Biện chứng Lục Kinh — biểu-lý · Kinh · Bản khí · Tạng/Phủ · Ngũ Hành sinh khắc</title>
      <defs>
        <radialGradient id="lk-stone" cx="50%" cy="40%" r="64%">
          <stop offset="0%" stop-color="#5b3f20" />
          <stop offset="46%" stop-color="#4a3219" />
          <stop offset="80%" stop-color="#37230f" />
          <stop offset="100%" stop-color="#2a1a0a" />
        </radialGradient>
        <radialGradient id="lk-glow" cx="50%" cy="46%" r="48%">
          <stop offset="0%" stop-color="rgba(250,240,218,.30)" />
          <stop offset="55%" stop-color="rgba(248,236,212,.08)" />
          <stop offset="100%" stop-color="rgba(248,236,212,0)" />
        </radialGradient>
        <linearGradient id="lk-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fbf2dd" />
          <stop offset="48%" stop-color="#e3cd9a" />
          <stop offset="100%" stop-color="#a4743a" />
        </linearGradient>
        <radialGradient id="lk-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(0,0,0,0)" />
          <stop offset="80%" stop-color="rgba(0,0,0,0)" />
          <stop offset="100%" stop-color="rgba(12,6,2,.55)" />
        </radialGradient>
      </defs>

      <!-- Nền -->
      <g aria-hidden="true">
        <circle :cx="CX" :cy="CY" r="196" fill="url(#lk-stone)" />
        <circle :cx="CX" :cy="CY" r="160" fill="url(#lk-glow)" />
        <circle :cx="CX" :cy="CY" r="196" fill="url(#lk-shadow)" />
      </g>

      <!-- ===== 3 vòng đồng tia ===== -->
      <g
        v-for="s in segs"
        :key="'sec' + s.i"
        class="sector"
        :class="{ 'is-active': active === s.i, 'is-dim': active != null && active !== s.i }"
      >
        <path :d="s.kinhD" class="wedge" :style="{ fill: s.tint }" />
        <path :d="s.khiD" class="wedge" :style="{ fill: s.khiFill }" />
        <path :d="s.tangD" class="wedge" :style="{ fill: s.tint }" />

        <text class="t-khx" :x="s.khxP.x" :y="s.khxP.y">{{ s.khxHan }}</text>
        <text class="t-vi t-kinh" :x="s.kinhViP.x" :y="s.kinhViP.y">{{ s.kinhVi }}</text>
        <text class="t-han t-kinh-han" :x="s.kinhHanP.x" :y="s.kinhHanP.y">{{ s.kinhHan }}</text>
        <text class="t-han t-khi-han" :x="s.khiHanP.x" :y="s.khiHanP.y" :style="{ fill: s.bright }">{{ s.khiHan }}</text>
        <text class="t-vi t-khi" :x="s.khiViP.x" :y="s.khiViP.y" :style="{ fill: s.bright }">{{ s.khiVi }}</text>
        <text class="t-tong" :x="s.tongP.x" :y="s.tongP.y">{{ s.tongGlyph }}</text>
        <text class="t-vi t-tang" :x="s.tangViP.x" :y="s.tangViP.y">{{ s.tangVi }}</text>
        <text class="t-han t-tang-han" :x="s.tangHanP.x" :y="s.tangHanP.y">{{ s.tangHan }}</text>
      </g>

      <!-- trục Âm–Dương -->
      <line class="axis-h" :x1="CX - 197" :y1="CY" :x2="CX + 197" :y2="CY" />

      <!-- ===== Trục biểu-lý (Trung kiến) — mờ; sáng khi hover ===== -->
      <g class="bieuly">
        <line
          v-for="(ax, i) in axes"
          :key="'ax' + i"
          :x1="ax.x1" :y1="ax.y1" :x2="ax.x2" :y2="ax.y2"
          :class="{ hot: isAxisHot(ax.degs) }"
        />
      </g>

      <!-- ===== Tâm: Ngũ Hành sinh/khắc ===== -->
      <g class="hub">
        <circle :cx="CX" :cy="CY" r="60" fill="url(#lk-stone)" stroke="rgba(226,205,154,.35)" stroke-width="1" />
        <!-- Tương khắc (ngôi sao) -->
        <line
          v-for="(k, i) in pkhac"
          :key="'pk' + i"
          class="p-khac"
          :class="{ hot: activeSeg && activeSeg.khac && k.from === 0 && k.to === 2 }"
          :x1="k.x1" :y1="k.y1" :x2="k.x2" :y2="k.y2"
        />
        <!-- Tương sinh (cung mũi tên) -->
        <g class="p-sinh">
          <template v-for="(s, i) in psinh" :key="'ps' + i">
            <path :d="s.d" />
            <polygon :points="s.head" />
          </template>
        </g>
        <!-- 5 node tạng -->
        <g
          v-for="n in pnodes"
          :key="'pn' + n.i"
          class="p-node"
          :class="{ hot: activeNodes.includes(n.i) }"
        >
          <circle :cx="n.c.x" :cy="n.c.y" :r="PNODE_R" class="p-badge" :style="{ stroke: n.bright }" />
          <text class="p-han" :x="n.c.x" :y="n.c.y" :fill="n.bright">{{ n.han }}</text>
        </g>
        <!-- Thái Cực nhỏ -->
        <g class="core">
          <circle :cx="CX" :cy="CY" :r="TR" :fill="yang" stroke="rgba(247,239,222,.6)" stroke-width="1" />
          <path :d="taiji" :fill="yin" />
          <circle :cx="CX" :cy="CY - TR / 2" :r="dotR" :fill="yang" />
          <circle :cx="CX" :cy="CY + TR / 2" :r="dotR" :fill="yin" />
        </g>
      </g>

      <!-- Trục biểu-lý đang chọn: vẽ LẠI lên trên (xuyên tâm rõ) -->
      <line
        v-if="activeAxis"
        class="bieuly-top"
        :x1="activeAxis.x1" :y1="activeAxis.y1" :x2="activeAxis.x2" :y2="activeAxis.y2"
      />

      <!-- Khung + vạch ngăn -->
      <g fill="none">
        <circle :cx="CX" :cy="CY" r="197" stroke="url(#lk-rim)" stroke-width="2.6" stroke-opacity=".92" />
        <g class="rims">
          <circle :cx="CX" :cy="CY" r="149" />
          <circle :cx="CX" :cy="CY" r="109" />
          <circle :cx="CX" :cy="CY" r="69" />
        </g>
      </g>

      <!-- nhãn nhóm -->
      <text class="grp grp-duong" :x="CX" y="14">☀ TAM DƯƠNG · Biểu/Phủ · phép TẢ</text>
      <text class="grp grp-am" :x="CX" y="392">❄ TAM ÂM · Lý/Tạng · phép ÔN–BỔ</text>

      <!-- vùng bắt chuột -->
      <path
        v-for="s in segs"
        :key="'hit' + s.i"
        :d="s.hitD"
        class="hit"
        tabindex="0"
        role="button"
        :aria-label="`Kinh ${s.kinhVi}: bản khí ${s.khiVi}, tạng phủ ${s.tangVi}, biểu-lý ${s.trungKien}`"
        @mouseenter="hovered = s.i"
        @focus="hovered = s.i"
        @blur="hovered = null"
        @click="toggle(s.i)"
        @keydown.enter.prevent="toggle(s.i)"
        @keydown.space.prevent="toggle(s.i)"
      />
    </svg>

    <!-- ===== Thẻ chi tiết ===== -->
    <transition name="lkw-fade">
      <div v-if="activeSeg" class="lkw-card" :class="activeSeg.group">
        <div class="card-head">
          <div class="card-title">
            <span class="ch-vi">{{ activeSeg.kinhVi }}</span>
            <span class="ch-han">{{ activeSeg.kinhHan }}</span>
          </div>
          <span class="card-badge">{{ activeSeg.group === 'duong' ? '☀ Tam Dương' : '❄ Tam Âm' }} · {{ activeSeg.khx }}</span>
        </div>
        <dl class="card-rows">
          <div class="row"><dt>Bản khí</dt><dd><b :style="{ color: activeSeg.bright }">{{ activeSeg.khiHan }} {{ activeSeg.khiVi }}</b></dd></div>
          <div class="row"><dt>Tòng hóa</dt><dd><b>{{ activeSeg.tongGlyph }} {{ TONG[activeSeg.tong].label }}</b> — {{ activeSeg.hoaNote }}</dd></div>
          <div class="row"><dt>Trung kiến</dt><dd>{{ activeSeg.trungKien }} <span class="sub">(biểu-lý)</span></dd></div>
          <div class="row"><dt>{{ activeSeg.tangType }} đích</dt><dd><b>{{ activeSeg.tangVi }}</b> {{ activeSeg.tangHan }}<span v-if="activeSeg.tangSub" class="sub"> · {{ activeSeg.tangSub }}</span></dd></div>
          <div class="row"><dt>Triệu chứng</dt><dd>{{ activeSeg.trieuChung }}</dd></div>
          <div class="row hi"><dt>Trị pháp</dt><dd><b>{{ activeSeg.triPhap }}</b> — <i>{{ activeSeg.phuongThuoc }}</i></dd></div>
          <div class="row"><dt>Truyền biến</dt><dd>{{ activeSeg.truyenBien }}</dd></div>
        </dl>
      </div>
    </transition>

    <p class="lkw-hint">
      <span v-if="!activeSeg">Rê chuột / chạm một <b>Kinh</b>. Trên–dưới = <b>Dương ↔ Âm biểu-lý</b> · tâm = <b>Ngũ Hành sinh–khắc</b>.</span>
      <span v-else>Tia: Khai/Hạp/Xu · <b>Kinh → Bản khí → Tạng/Phủ</b> · trục dọc = biểu-lý (Trung kiến).</span>
    </p>
  </div>
</template>

<style scoped>
.lkw {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  container-type: inline-size;
}
.lkw-svg {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
  filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.28));
}

/* ---- Chữ ---- */
.lkw-svg text {
  font-family: var(--font-family, 'Inter', sans-serif);
  text-anchor: middle;
  dominant-baseline: middle;
  paint-order: stroke;
  stroke-linejoin: round;
  user-select: none;
  pointer-events: none;
}
.t-vi { font-weight: 800; fill: #f6ecd8; stroke: rgba(28, 16, 6, 0.75); stroke-width: 1.1px; }
.t-han { font-weight: 500; fill: #f0e4cd; opacity: 0.62; stroke: rgba(28, 16, 6, 0.6); stroke-width: 0.7px; }
.t-kinh { font-size: 12px; }
.t-kinh-han { font-size: 8px; letter-spacing: 0.5px; }
.t-khi { font-size: 7.5px; opacity: 0.95; stroke-width: 0.9px; }
.t-khi-han { font-size: 13px; opacity: 0.95; stroke-width: 0.7px; }
.t-tang { font-size: 10px; }
.t-tang-han { font-size: 7.5px; letter-spacing: 0.5px; }
.t-khx { font-size: 8px; font-weight: 700; fill: #e9c987; opacity: 0.85; stroke: rgba(28, 16, 6, 0.7); stroke-width: 0.8px; }
.t-tong { font-size: 8px; font-weight: 700; fill: #dcc79a; opacity: 0.8; stroke: rgba(28, 16, 6, 0.6); stroke-width: 0.7px; }

/* ---- Cung ---- */
.wedge { stroke: rgba(247, 242, 233, 0.26); stroke-width: 0.8; transition: opacity 0.2s ease, filter 0.2s ease; }
.sector.is-dim { opacity: 0.4; }
.sector.is-active .wedge { stroke: rgba(251, 242, 221, 0.85); stroke-width: 1.3; filter: drop-shadow(0 0 5px rgba(250, 233, 200, 0.45)); }
.sector.is-active .t-vi { fill: #fff8ea; }

.axis-h { stroke: rgba(250, 240, 224, 0.26); stroke-width: 0.8; stroke-dasharray: 3 4; }
.rims circle { stroke: rgba(248, 240, 224, 0.3); stroke-width: 1; }

/* ---- Trục biểu-lý ---- */
.bieuly line { stroke: rgba(230, 206, 150, 0.22); stroke-width: 1; stroke-dasharray: 4 4; }
.bieuly line.hot { stroke: rgba(244, 214, 150, 0.5); }
.bieuly-top { stroke: #f2d79a; stroke-width: 1.6; stroke-dasharray: 5 4; opacity: 0.9; filter: drop-shadow(0 0 3px rgba(242, 215, 154, 0.5)); pointer-events: none; }

/* ---- Tâm Ngũ Hành ---- */
.p-sinh path { fill: none; stroke: #7cbf74; stroke-width: 1.5; stroke-linecap: round; opacity: 0.85; }
.p-sinh polygon { fill: #7cbf74; opacity: 0.9; }
.p-khac { stroke: #cf7a5a; stroke-width: 0.9; opacity: 0.4; }
.p-khac.hot { stroke: #f0906a; stroke-width: 1.8; opacity: 0.95; filter: drop-shadow(0 0 3px rgba(240, 144, 106, 0.6)); }
.p-badge { fill: rgba(24, 14, 6, 0.9); stroke-width: 1.5; transition: filter 0.2s ease; }
.p-han { font-size: 10px; font-weight: 700; stroke: rgba(20, 11, 4, 0.5); stroke-width: 0.5px; }
.p-node.hot .p-badge { filter: drop-shadow(0 0 5px rgba(250, 233, 200, 0.7)); stroke-width: 2.2; }

/* ---- vùng bắt & nhãn nhóm ---- */
.hit { fill: transparent; pointer-events: all; cursor: pointer; outline: none; }
.hit:focus-visible { fill: rgba(250, 240, 224, 0.08); stroke: rgba(250, 233, 200, 0.7); stroke-width: 1.5; }
.grp { font-size: 7.5px; font-weight: 800; letter-spacing: 0.6px; fill: #f3e6cd; opacity: 0.8; stroke: rgba(28, 16, 6, 0.7); stroke-width: 1px; }
.grp-duong { fill: #f2d29a; }
.grp-am { fill: #b9cede; }

.core { transform-box: view-box; transform-origin: 200px 200px; animation: lkw-spin 42s linear infinite; }
@keyframes lkw-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .core { animation: none; } }

/* ===== Thẻ chi tiết ===== */
.lkw-card {
  position: absolute; top: 3%; right: 100%; margin-right: 10px;
  width: clamp(238px, 80vw, 300px); max-height: 94%; overflow: auto; z-index: 6;
  background: linear-gradient(160deg, rgba(38, 24, 11, 0.97), rgba(24, 14, 6, 0.98));
  border: 1px solid rgba(226, 200, 150, 0.28); border-radius: 12px; padding: 12px 14px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.5); color: #efe3cd;
}
.lkw-card.duong { border-top: 3px solid #e0b062; }
.lkw-card.am { border-top: 3px solid #8fb0c8; }
.card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 9px; }
.card-title { display: flex; align-items: baseline; gap: 6px; }
.ch-vi { font-size: 16px; font-weight: 800; color: #fdf3df; }
.ch-han { font-size: 12px; opacity: 0.7; }
.card-badge { font-size: 9.5px; font-weight: 700; white-space: nowrap; color: #d8c6a3; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.14); padding: 2px 8px; border-radius: 999px; }
.card-rows { display: flex; flex-direction: column; gap: 6px; margin: 0; }
.row { display: grid; grid-template-columns: 64px 1fr; gap: 8px; font-size: 11.5px; line-height: 1.4; }
.row dt { margin: 0; font-weight: 700; color: #c7ac7f; }
.row dd { margin: 0; color: #eadfca; }
.row.hi dd { color: #f6e9cf; }
.row .sub { opacity: 0.75; font-style: italic; }

.lkw-hint { margin: 0; font-size: 10.5px; line-height: 1.4; text-align: center; color: rgba(245, 236, 220, 0.72); max-width: 40ch; }
.lkw-hint b { color: rgba(250, 240, 220, 0.95); }

.lkw-fade-enter-active, .lkw-fade-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.lkw-fade-enter-from, .lkw-fade-leave-to { opacity: 0; transform: translateX(6px); }

@media (max-width: 720px) {
  .lkw-card { position: absolute; inset: 5% 4% auto 4%; right: auto; margin: 0; width: auto; max-height: 88%; }
}
@container (max-width: 210px) {
  .lkw-hint, .lkw-card { display: none; }
}
</style>
