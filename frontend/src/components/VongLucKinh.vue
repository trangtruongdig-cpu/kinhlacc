<script setup lang="ts">
/**
 * VongLucKinh — ĐỒ HÌNH LỤC KINH THƯƠNG HÀN (thay vòng Ngũ Hành ở lớp 5).
 * Nối 3 tầng cùng 1 cung: Lục Kinh (ngoài) ↔ Lục Khí/bản khí (giữa) ↔ Tạng Phủ (trong: Túc/Thủ).
 * Xếp theo CẶP BIỂU-LÝ ĐỐI TÂM (TD↔ThA · DM↔TA · ThD↔QA) ⇒ Trung kiến = đường kính thẳng.
 * Nửa trên = Tam Dương (biểu), nửa dưới = Tam Âm (lý). Mũi tên truyền chạy Ở VÀNH NGOÀI (ngoài chữ).
 * Overlay: ① truyền biến (badge số + cung mũi tên vành ngoài) · ② Trung kiến biểu-lý (dây cung, sáng khi rê) · ③ Khai–Hạp–Xu.
 */
import { ref, computed } from 'vue'

const props = defineProps<{
  counts?: Record<string, number>
  activeKinh?: string | null // kinh đang lọc (đồng bộ từ bộ lọc)
  activeTang?: string | null // tạng phủ đang lọc sâu
  activeKhi?: string | null // tác nhân (lục khí) đang lọc sâu
}>()
const emit = defineEmits<{ select: [{ type: 'kinh' | 'khi' | 'tang'; key: string; label: string; kinh?: string }] }>()

const CX = 210, CY = 210, D2R = Math.PI / 180
const N = (v: number) => v.toFixed(2)
function pt(r: number, deg: number) { const a = deg * D2R; return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) } }
function donut(rO: number, rI: number, a0: number, a1: number) {
  const o0 = pt(rO, a0), o1 = pt(rO, a1), i1 = pt(rI, a1), i0 = pt(rI, a0), lg = a1 - a0 > 180 ? 1 : 0
  return `M${N(o0.x)} ${N(o0.y)} A${rO} ${rO} 0 ${lg} 1 ${N(o1.x)} ${N(o1.y)} L${N(i1.x)} ${N(i1.y)} A${rI} ${rI} 0 ${lg} 0 ${N(i0.x)} ${N(i0.y)} Z`
}
function arcPath(r: number, deg: number, span: number) {
  const bottom = deg > 90 && deg < 270
  const a0 = bottom ? deg + span : deg - span, a1 = bottom ? deg - span : deg + span
  const p0 = pt(r, a0), p1 = pt(r, a1)
  return `M${N(p0.x)} ${N(p0.y)} A${r} ${r} 0 0 ${bottom ? 0 : 1} ${N(p1.x)} ${N(p1.y)}`
}
function arrowHead(tip: { x: number; y: number }, dir: { x: number; y: number }, len = 7, w = 4) {
  const px = -dir.y, py = dir.x
  return `${N(tip.x)},${N(tip.y)} ${N(tip.x - dir.x * len + px * w)},${N(tip.y - dir.y * len + py * w)} ${N(tip.x - dir.x * len - px * w)},${N(tip.y - dir.y * len - py * w)}`
}

type HanhKey = 'thuy' | 'kim' | 'hoaT' | 'hoaQ' | 'tho' | 'moc'
const HANH: Record<HanhKey, { fill: string; bright: string }> = {
  thuy: { fill: 'rgba(92,154,184,.5)', bright: '#9fd0e8' },
  kim: { fill: 'rgba(224,210,176,.5)', bright: '#f3e8cc' },
  hoaT: { fill: 'rgba(216,124,74,.52)', bright: '#f6b294' },
  hoaQ: { fill: 'rgba(202,80,60,.55)', bright: '#f3937e' },
  tho: { fill: 'rgba(206,166,90,.52)', bright: '#f2d189' },
  moc: { fill: 'rgba(120,172,108,.5)', bright: '#a9e096' },
}
interface K { slug: string; ten: string; han: string; deg: number; nhom: 'duong' | 'am'; so: number; khhx: string; khi: string; khiHan: string; hanh: HanhKey; hanhTen: string; tuc: string; thu: string; loai: string; doi: string }
// deg theo CẶP BIỂU-LÝ ĐỐI TÂM (GIỮ NGUYÊN thứ tự cũ — không đảo): TD300↔ThA120 · DM0↔TA180 · ThD60↔QA240.
// ⇒ Tam Dương (300·0·60) ở NỬA TRÊN, Tam Âm (120·180·240) ở NỬA DƯỚI. so = thứ tự truyền biến ①→⑥.
const KINH: K[] = [
  { slug: 'thai-duong', ten: 'Thái Dương', han: '太陽', deg: 300, nhom: 'duong', so: 1, khhx: 'Khai', khi: 'Hàn', khiHan: '寒', hanh: 'thuy', hanhTen: 'Hàn Thủy', tuc: 'Bàng Quang', thu: 'Tiểu Trường', loai: 'Phủ', doi: 'thieu-am' },
  { slug: 'duong-minh', ten: 'Dương Minh', han: '陽明', deg: 0, nhom: 'duong', so: 2, khhx: 'Hạp', khi: 'Táo', khiHan: '燥', hanh: 'kim', hanhTen: 'Táo Kim', tuc: 'Vị', thu: 'Đại Trường', loai: 'Phủ', doi: 'thai-am' },
  { slug: 'thieu-duong', ten: 'Thiếu Dương', han: '少陽', deg: 60, nhom: 'duong', so: 3, khhx: 'Xu', khi: 'Thử', khiHan: '暑', hanh: 'hoaT', hanhTen: 'Tướng Hỏa', tuc: 'Đởm', thu: 'Tam Tiêu', loai: 'Phủ', doi: 'quyet-am' },
  { slug: 'thai-am', ten: 'Thái Âm', han: '太陰', deg: 180, nhom: 'am', so: 4, khhx: 'Khai', khi: 'Thấp', khiHan: '濕', hanh: 'tho', hanhTen: 'Thấp Thổ', tuc: 'Tỳ', thu: 'Phế', loai: 'Tạng', doi: 'duong-minh' },
  { slug: 'thieu-am', ten: 'Thiếu Âm', han: '少陰', deg: 120, nhom: 'am', so: 5, khhx: 'Xu', khi: 'Nhiệt', khiHan: '熱', hanh: 'hoaQ', hanhTen: 'Quân Hỏa', tuc: 'Thận', thu: 'Tâm', loai: 'Tạng', doi: 'thai-duong' },
  { slug: 'quyet-am', ten: 'Quyết Âm', han: '厥陰', deg: 240, nhom: 'am', so: 6, khhx: 'Hạp', khi: 'Phong', khiHan: '風', hanh: 'moc', hanhTen: 'Phong Mộc', tuc: 'Can', thu: 'Tâm Bào', loai: 'Tạng', doi: 'thieu-duong' },
]
const degOf: Record<string, number> = Object.fromEntries(KINH.map((k) => [k.slug, k.deg]))

const GAP = 2.2
const R = { kinhIn: 148, kinhOut: 190, khiIn: 110, khiOut: 144, tangIn: 64, tangOut: 106 }
const RIM = 191, ARROW_R = 200 // badge số ①-⑥ ở vành ngoài
const seg = (k: K) => ({
  dKinh: donut(R.kinhOut, R.kinhIn, k.deg - 30 + GAP, k.deg + 30 - GAP),
  dKhi: donut(R.khiOut, R.khiIn, k.deg - 30 + GAP, k.deg + 30 - GAP),
  dTangTuc: donut(R.tangOut, 85, k.deg - 30 + GAP, k.deg + 30 - GAP), // nửa ngoài = Túc (Phủ/Tạng túc)
  dTangThu: donut(85, R.tangIn, k.deg - 30 + GAP, k.deg + 30 - GAP), // nửa trong = Thủ
  arcKinh: arcPath(178, k.deg, 27), arcKhhx: arcPath(156, k.deg, 27),
  arcKhi: arcPath(130, k.deg, 30), arcKhiSub: arcPath(117, k.deg, 30),
  arcTuc: arcPath(95, k.deg, 30), arcThu: arcPath(78, k.deg, 26),
  badge: pt(ARROW_R, k.deg),
  soVi: '①②③④⑤⑥'[k.so - 1] ?? String(k.so),
})
const wedges = KINH.map((k) => ({ ...k, ...seg(k) }))

// ── ① TRUYỀN BIẾN: mỗi đoạn ①→⑥ một BÁN KÍNH riêng (tách lớp, luồn 2 khe trống giữa các vòng chữ) + MÀU nhạt→đậm để lần theo ──
const order = [...KINH].sort((a, b) => a.so - b.so)
// r: ①② ở khe NGOÀI (161–172, dưới tên kinh) · ③④⑤⑥ nhúng dần vào khe GIỮA (136–151, trên vòng khí) ⇒ không đè chữ
const TRUYEN_SEG_R = [167, 163, 150, 143, 137]
const TRUYEN_SEG_C = ['#f4dca2', '#e9b968', '#dd8f44', '#cf6a37', '#bf4632'] // vàng nhạt ①→② … đỏ đậm ⑤→⑥
const truyen = order.slice(0, -1).map((a, i) => {
  const b = order[i + 1]!
  const r = TRUYEN_SEG_R[i] ?? 150
  const cw = ((((b.deg - a.deg) % 360) + 360) % 360) <= 180 // đi thuận (KĐH) nếu góc quét ≤ 180°, ngược lại đi nghịch
  const off = 11
  const a0 = cw ? a.deg + off : a.deg - off
  const a1 = cw ? b.deg - off : b.deg + off
  const p0 = pt(r, a0), p1 = pt(r, a1)
  const span = cw ? ((((a1 - a0) % 360) + 360) % 360) : ((((a0 - a1) % 360) + 360) % 360) // góc quét thực theo chiều đi
  const large = span > 180 ? 1 : 0
  const dir = cw ? { x: Math.cos(a1 * D2R), y: Math.sin(a1 * D2R) } : { x: -Math.cos(a1 * D2R), y: -Math.sin(a1 * D2R) }
  return { d: `M${N(p0.x)} ${N(p0.y)} A${r} ${r} 0 ${large} ${cw ? 1 : 0} ${N(p1.x)} ${N(p1.y)}`, head: arrowHead(p1, dir), color: TRUYEN_SEG_C[i] ?? '#e8b35a' }
})

// ── ② TRUNG KIẾN (biểu-lý): 3 đường kính nối cặp kinh đối tâm — mờ sẵn, sáng lên khi rê ──
const PAIRS: [string, string][] = [['thai-duong', 'thieu-am'], ['duong-minh', 'thai-am'], ['thieu-duong', 'quyet-am']]
const trungKien = PAIRS.map(([x, y]) => {
  const a = pt(R.kinhIn - 6, degOf[x ?? ''] ?? 0), b = pt(R.kinhIn - 6, degOf[y ?? ''] ?? 0)
  return { x1: N(a.x), y1: N(a.y), x2: N(b.x), y2: N(b.y) }
})

// ── Tương tác kinh ── (đồng bộ 2 chiều: rê/bấm đồ hình ↔ bộ lọc)
const hovered = ref<string | null>(null)
const pinned = ref<string | null>(null) // kinh ĐÃ BẤM (chốt) — rê chỉ xem trước
const halfHi = ref<'duong' | 'am' | null>(null)
const partnerOf = (slug: string | null) => (slug ? KINH.find((k) => k.slug === slug)?.doi ?? null : null)
// Ưu tiên: rê (xem trước) → đã bấm → đang lọc bên panel. Rê KHÔNG đổi panel (tránh nhảy khi rê chuột ra).
const focus = computed(() => hovered.value ?? pinned.value ?? props.activeKinh ?? null)
const isHot = (slug: string) => focus.value === slug
const isPartner = (slug: string) => partnerOf(focus.value) === slug
const isDim = (slug: string) => focus.value !== null && !isHot(slug) && !isPartner(slug)
function enter(k: K) { hovered.value = k.slug } // rê = chỉ tô sáng cục bộ
function leave() { hovered.value = null }
// BẤM mới chốt: vòng Kinh = chọn kinh (mục chính); vòng Khí/Tạng = lọc sâu (kinh = kinh chủ của sector).
function pickKinh(k: K) { pinned.value = k.slug; emit('select', { type: 'kinh', key: k.slug, label: `${k.ten} ${k.han}` }) }
function pickKhi(k: K) { pinned.value = k.slug; emit('select', { type: 'khi', key: k.khi, label: `Khí ${k.khi} ${k.khiHan}`, kinh: k.slug }) }
function pickTang(k: K, organ: string) { pinned.value = k.slug; emit('select', { type: 'tang', key: organ, label: organ, kinh: k.slug }) }

// ── ② TRUNG KIẾN (biểu-lý): dây cung nối kinh ↔ kinh đối; chỉ dây của kinh ĐANG RÊ sáng lên ──
const activeAxis = computed(() => {
  const s = focus.value
  if (!s) return null
  const p = partnerOf(s)
  if (!p) return null
  const a = pt(R.kinhIn - 4, degOf[s] ?? 0), b = pt(R.kinhIn - 4, degOf[p] ?? 0)
  return { x1: N(a.x), y1: N(a.y), x2: N(b.x), y2: N(b.y) }
})
const cnt = (slug: string) => props.counts?.[slug] ?? 0
</script>

<template>
  <div class="vlk">
    <svg class="vlk-svg" viewBox="0 0 420 420" role="img" aria-label="Đồ hình Lục Kinh Thương Hàn: truyền biến, biểu-lý (Trung kiến), khai-hạp-xu, nối Tạng Phủ · Lục Khí · Lục Kinh">
      <defs>
        <radialGradient id="vlk-stone" cx="50%" cy="42%" r="62%">
          <stop offset="0%" style="stop-color: var(--brown-700)" /><stop offset="46%" style="stop-color: var(--brown-800)" />
          <stop offset="80%" style="stop-color: var(--brown-900)" /><stop offset="100%" style="stop-color: var(--brown-900)" />
        </radialGradient>
        <radialGradient id="vlk-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style="stop-color: var(--brown-100)" /><stop offset="50%" style="stop-color: var(--brown-300)" /><stop offset="100%" style="stop-color: var(--brown-600)" />
        </radialGradient>
        <path v-for="(w, i) in wedges" :id="'vk-ak' + i" :key="'pak' + i" :d="w.arcKinh" />
        <path v-for="(w, i) in wedges" :id="'vk-ah' + i" :key="'pah' + i" :d="w.arcKhhx" />
        <path v-for="(w, i) in wedges" :id="'vk-aq' + i" :key="'paq' + i" :d="w.arcKhi" />
        <path v-for="(w, i) in wedges" :id="'vk-aqs' + i" :key="'paqs' + i" :d="w.arcKhiSub" />
        <path v-for="(w, i) in wedges" :id="'vk-atu' + i" :key="'patu' + i" :d="w.arcTuc" />
        <path v-for="(w, i) in wedges" :id="'vk-ath' + i" :key="'path2' + i" :d="w.arcThu" />
      </defs>

      <circle :cx="CX" :cy="CY" :r="RIM + 1" fill="url(#vlk-stone)" />
      <!-- Nền Tam Dương (trên) / Tam Âm (dưới); sáng thêm khi bấm nút -->
      <path d="M19 210 A191 191 0 0 1 401 210 Z" class="half-bg duong" :class="{ hi: halfHi === 'duong' }" />
      <path d="M19 210 A191 191 0 0 0 401 210 Z" class="half-bg am" :class="{ hi: halfHi === 'am' }" />

      <!-- Các cung: 3 tầng nối nhau (Kinh ↔ Khí ↔ Tạng) -->
      <g v-for="(w, i) in wedges" :key="w.slug" class="vk-seg"
         :class="{ hot: isHot(w.slug), partner: isPartner(w.slug), dim: isDim(w.slug), 'half-hi': halfHi === w.nhom }"
         @mouseenter="enter(w)" @mouseleave="leave()">
        <!-- Tạng Phủ: 2 nửa, mỗi tạng phủ bấm được → lọc sâu -->
        <path :d="w.dTangTuc" class="wj wj-tang pick" :class="{ act: activeTang === w.tuc }" @click.stop="pickTang(w, w.tuc)" />
        <path :d="w.dTangThu" class="wj wj-tang pick" :class="{ act: activeTang === w.thu }" @click.stop="pickTang(w, w.thu)" />
        <text class="t-tang" :class="{ act: activeTang === w.tuc }"><textPath :href="'#vk-atu' + i" startOffset="50%">{{ w.tuc }}</textPath></text>
        <text class="t-tang" :class="{ act: activeTang === w.thu }"><textPath :href="'#vk-ath' + i" startOffset="50%">{{ w.thu }}</textPath></text>
        <!-- Lục Khí: bấm được → lọc sâu tác nhân -->
        <path :d="w.dKhi" class="wj wj-khi pick" :class="{ act: activeKhi === w.khi }" :style="{ fill: HANH[w.hanh].fill }" @click.stop="pickKhi(w)" />
        <text class="t-khi" :class="{ act: activeKhi === w.khi }" :style="{ fill: HANH[w.hanh].bright }"><textPath :href="'#vk-aq' + i" startOffset="50%">{{ w.khi }} {{ w.khiHan }}</textPath></text>
        <text class="t-khi-sub" :style="{ fill: HANH[w.hanh].bright }"><textPath :href="'#vk-aqs' + i" startOffset="50%">{{ w.hanhTen }}</textPath></text>
        <!-- Lục Kinh: bấm/rê → chọn kinh -->
        <path :d="w.dKinh" class="wj wj-kinh pick" :class="w.nhom" @click.stop="pickKinh(w)" />
        <text class="t-kinh"><textPath :href="'#vk-ak' + i" startOffset="50%">{{ w.ten }} {{ w.han }}</textPath></text>
        <text class="t-khhx"><textPath :href="'#vk-ah' + i" startOffset="50%">⟨{{ w.khhx }}⟩ · {{ w.loai }}<template v-if="cnt(w.slug)"> · {{ cnt(w.slug) }} thể</template></textPath></text>
      </g>

      <!-- ② Trung kiến (biểu-lý) — 3 đường kính mờ sẵn + dây kinh đang rê sáng lên -->
      <line v-for="(l, i) in trungKien" :key="'tk' + i" class="tk-static" :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2" />
      <line v-if="activeAxis" class="tk-line" :x1="activeAxis.x1" :y1="activeAxis.y1" :x2="activeAxis.x2" :y2="activeAxis.y2" />

      <!-- ① Truyền biến — cung mũi tên vành ngoài + badge số -->
      <g class="truyen">
        <g v-for="(t, i) in truyen" :key="'tr' + i"><path :d="t.d" :style="{ stroke: t.color }" /><polygon :points="t.head" :style="{ fill: t.color }" /></g>
      </g>
      <g v-for="w in wedges" :key="'b' + w.slug" class="vk-badge" :class="{ hot: isHot(w.slug) }">
        <circle :cx="w.badge.x" :cy="w.badge.y" r="9" /><text :x="w.badge.x" :y="w.badge.y">{{ w.so }}</text>
      </g>

      <!-- Thái Cực giữa -->
      <g class="vlk-taiji">
        <circle :cx="CX" :cy="CY" r="30" fill="#f4e7d1" stroke="rgba(247,239,222,.6)" />
        <path :d="`M${CX} ${CY - 30} A30 30 0 0 0 ${CX} ${CY + 30} Z`" fill="#4b3319" />
        <circle :cx="CX" :cy="CY - 15" r="15" fill="#4b3319" /><circle :cx="CX" :cy="CY + 15" r="15" fill="#f4e7d1" />
        <circle :cx="CX" :cy="CY - 15" r="4.5" fill="#f4e7d1" /><circle :cx="CX" :cy="CY + 15" r="4.5" fill="#4b3319" />
      </g>

      <circle :cx="CX" :cy="CY" :r="RIM" fill="none" stroke="url(#vlk-rim)" stroke-width="2.4" stroke-opacity=".92" />
    </svg>

    <!-- Nút Tam Dương / Tam Âm (hiệu ứng sáng nửa vòng) -->
    <div class="vlk-halfbtns">
      <button type="button" class="hb duong" :class="{ on: halfHi === 'duong' }"
        @mouseenter="halfHi = 'duong'" @mouseleave="halfHi = null" @click="halfHi = halfHi === 'duong' ? null : 'duong'">
        ☀ Tam Dương <small>biểu · thực–nhiệt</small>
      </button>
      <button type="button" class="hb am" :class="{ on: halfHi === 'am' }"
        @mouseenter="halfHi = 'am'" @mouseleave="halfHi = null" @click="halfHi = halfHi === 'am' ? null : 'am'">
        ☾ Tam Âm <small>lý · hư–hàn</small>
      </button>
    </div>
    <div class="vlk-legend">
      <span><i class="lg-flow"></i> Truyền biến ①→⑥ (màu nhạt→đậm)</span>
      <span><i class="lg-tk"></i> Trung kiến (rê kinh → hiện cặp biểu-lý)</span>
      <span>⟨Khai · Hạp · Xu⟩ = cơ chế cửa</span>
    </div>
  </div>
</template>

<style scoped>
.vlk { width: 100%; max-width: min(100%, 62vh); margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.vlk-svg { width: 100%; height: auto; display: block; overflow: visible; filter: drop-shadow(0 8px 22px rgba(0, 0, 0, 0.3)); }
.vlk-svg text { font-family: var(--font-family, 'Inter', sans-serif); text-anchor: middle; dominant-baseline: middle; paint-order: stroke; stroke-linejoin: round; user-select: none; pointer-events: none; }
.pick { cursor: pointer; }
/* Sáng tầng đang lọc (đồng bộ từ bộ lọc) */
.wj-tang.act { fill: rgba(177, 80, 47, 0.6); stroke: #f6c98a; stroke-width: 1.4; }
.wj-khi.act { stroke: #fff6e2; stroke-width: 1.8; filter: drop-shadow(0 0 6px rgba(255, 240, 210, 0.8)); }
.t-tang.act { fill: #fff; opacity: 1; }
.t-khi.act { filter: drop-shadow(0 0 3px rgba(255, 240, 210, 0.9)); }

.half-bg { transition: opacity 0.25s; }
.half-bg.duong { fill: rgba(214, 178, 108, 0.12); }
.half-bg.am { fill: rgba(120, 150, 175, 0.12); }
.half-bg.duong.hi { fill: rgba(226, 190, 120, 0.32); }
.half-bg.am.hi { fill: rgba(132, 166, 192, 0.32); }

.wj { stroke: rgba(247, 242, 233, 0.22); stroke-width: 0.8; }
.wj-tang { fill: rgba(70, 52, 30, 0.55); }
.wj-kinh.duong { fill: rgba(214, 178, 108, 0.26); }
.wj-kinh.am { fill: rgba(132, 158, 178, 0.24); }
.t-kinh { font-size: 12px; font-weight: 800; fill: #f8eeda; stroke: rgba(28, 16, 6, 0.75); stroke-width: 1.1px; }
.t-khhx { font-size: 7.5px; font-weight: 600; fill: #e6d6b6; opacity: 0.72; stroke: rgba(20, 11, 4, 0.5); stroke-width: 0.5px; }
.t-khi { font-size: 11.5px; font-weight: 800; stroke: rgba(24, 14, 5, 0.7); stroke-width: 1px; }
.t-khi-sub { font-size: 7.5px; font-weight: 600; opacity: 0.8; stroke: rgba(20, 11, 4, 0.5); stroke-width: 0.5px; }
.t-tang { font-size: 8px; font-weight: 700; fill: #ecdcbe; stroke: rgba(24, 14, 5, 0.6); stroke-width: 0.7px; }

.vk-seg { transition: opacity 0.2s, filter 0.2s; cursor: pointer; }
.vk-seg .wj { transition: stroke 0.2s, filter 0.2s; }
.vk-seg.dim { opacity: 0.32; }
.vk-seg.hot .wj-kinh { stroke: rgba(251, 242, 221, 0.95); stroke-width: 1.5; filter: drop-shadow(0 0 6px rgba(250, 233, 200, 0.6)); }
.vk-seg.hot .t-kinh, .vk-seg.hot .t-khi { fill: #fff8ea; }
.vk-seg.partner .wj-kinh { stroke: #f2d79a; stroke-width: 1.4; filter: drop-shadow(0 0 5px rgba(242, 215, 154, 0.55)); }
.vk-seg.partner { opacity: 1; }
.vk-seg.half-hi .wj-kinh { stroke: rgba(255, 246, 222, 0.9); stroke-width: 1.3; filter: drop-shadow(0 0 5px rgba(250, 233, 200, 0.5)); }

.tk-static { stroke: rgba(242, 215, 154, 0.28); stroke-width: 1; stroke-dasharray: 4 5; pointer-events: none; }
.tk-line { stroke: #f2d79a; stroke-width: 1.8; stroke-dasharray: 5 4; opacity: 0.95; pointer-events: none; filter: drop-shadow(0 0 3px rgba(242, 215, 154, 0.55)); }

.truyen { pointer-events: none; }
.truyen path { fill: none; stroke: #e8b35a; stroke-width: 2.4; stroke-linecap: round; opacity: 0.85; filter: drop-shadow(0 0 2px rgba(232, 179, 90, 0.5)); }
.truyen polygon { fill: #e8b35a; }
.vk-badge circle { fill: #6b4a24; stroke: #f4e2b8; stroke-width: 1.4; }
.vk-badge text { font-size: 11px; font-weight: 800; fill: #fff6e2; stroke: none; }
.vk-badge.hot circle { fill: #9a6c2e; stroke: #fff; }

.vlk-halfbtns { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
.hb { font: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; padding: 6px 14px; border-radius: 999px; border: 1px solid var(--border, #e7ddcd); background: var(--surface, #fff); color: var(--text, #3a2c1a); display: inline-flex; align-items: baseline; gap: 6px; transition: background 0.15s, border-color 0.15s, transform 0.1s; }
.hb small { font-weight: 500; font-size: 10.5px; color: var(--text-muted, #8a7a60); }
.hb:hover { transform: translateY(-1px); }
.hb.duong.on { background: #f4e3c2; border-color: #d9b877; }
.hb.am.on { background: #dbe6ef; border-color: #9db6ca; }
.hb.am.on small, .hb.duong.on small { color: var(--text, #3a2c1a); }

.vlk-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 18px; font-size: 12px; font-weight: 600; color: var(--text, #3a2c1a); }
.vlk-legend span { display: inline-flex; align-items: center; gap: 6px; }
.vlk-legend i { display: inline-block; }
.lg-flow { width: 22px; height: 4px; border-radius: 2px; background: linear-gradient(90deg, #f4dca2, #dd8f44, #bf4632); }
.lg-tk { width: 16px; height: 0; border-top: 2px dashed #c9a24e; }
</style>
