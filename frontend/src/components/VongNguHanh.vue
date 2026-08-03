<script setup lang="ts">
/**
 * VongNguHanh — NGÔI SAO NGŨ HÀNH / NGŨ TẠNG MÉO theo mất cân bằng ĐO ĐƯỢC (lớp 3 Tạng Phủ).
 * Ý tưởng (lương y): âm dương · ngũ hành phải cân bằng → khi đo lệch, ngôi sao phải "xộc xệch"
 * đúng chỗ tạng suy/thịnh; đỉnh HƯ co vào tâm, THỰC đẩy ra vành. Kèm mạng lực SINH (nuôi) và KHẮC
 * (kìm): làm nổi tương thừa 相乘 / tương vũ 相侮 / mẫu-tử để thấy tạng GỐC và hướng lan.
 * Mô hình + hằng số đã qua workflow thẩm định (K=9 bảo thủ, smoothstep deadband, guard thiếu-đo/sd=0).
 * Quy ước máy dẫn-điện (Lê Văn Sửu/Ryodoraku): chỉ số CAO = thực (đẩy ra) · THẤP = hư (co vào).
 */
import { computed, ref } from 'vue'
import AmDuongTaiji from './AmDuongTaiji.vue'
import type { TongCuong } from '@/lib/meridianAnalysis'

const props = defineProps<{
  // z mỗi hành (đã gộp tạng 0.6 + phủ 0.4, chỉ kinh đo được); null = thiếu dữ liệu.
  z: { hoa: number | null; tho: number | null; kim: number | null; thuy: number | null; moc: number | null } | null
  tongCuong?: TongCuong | null // Thái Cực NỀN (dư/khuyết âm dương tổng) — ngũ tạng lệch làm âm dương dư/khuyết
  reversePolarity?: boolean // máy đo TRỞ KHÁNG (đảo cao↔thấp) — cần bác sĩ xác nhận
}>()

const CX = 210, CY = 210, D2R = Math.PI / 180
// Ngôi sao PHÓNG TO ra vành (như lớp Âm Dương): mốc cân bằng r=108, dịch tối đa ±30 → r∈[78,138].
// RIM = đường tròn rìa chung của các lớp (mọi thứ nằm gọn trong). LABEL_R nằm trong RIM.
const PENTA_R = 108, K = 12, Z_CAP = 2.5, SINH_R = 150, LABEL_R = 168, RIM = 191
const T_THUC = 1.0, T_MILD = 0.5, GRAD = 1.2 // ngưỡng bệnh lý (|z|=1 = vượt bound máy)
const N = (v: number) => v.toFixed(2)
const pt = (r: number, deg: number) => { const a = deg * D2R; return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) } }
const smoothstep = (e0: number, e1: number, x: number) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t) }
function arrowHead(tip: { x: number; y: number }, dir: { x: number; y: number }, len = 7, w = 4) {
  const px = -dir.y, py = dir.x
  return `${N(tip.x)},${N(tip.y)} ${N(tip.x - dir.x * len + px * w)},${N(tip.y - dir.y * len + py * w)} ${N(tip.x - dir.x * len - px * w)},${N(tip.y - dir.y * len - py * w)}`
}

// PENTA index [0]Hỏa [1]Thổ [2]Kim [3]Thủy [4]Mộc — thuận KĐH = vòng TƯƠNG SINH; i→i+2 = TƯƠNG KHẮC.
// Hỏa gồm 2 cặp: Quân Hỏa (Tâm/Tiểu Trường) + Tướng Hỏa (Tâm Bào/Tam Tiêu) → tang2/phu2 cho ĐỦ lục tạng lục phủ.
interface HanhDef { key: 'hoa' | 'tho' | 'kim' | 'thuy' | 'moc'; ten: string; han: string; tang: string; tangHan: string; tang2?: string; phu: string; phu2?: string; deg: number; color: string }
const HANHS: HanhDef[] = [
  { key: 'hoa', ten: 'Hỏa', han: '火', tang: 'Tâm', tangHan: '心', tang2: 'Tâm Bào', phu: 'Tiểu Trường', phu2: 'Tam Tiêu', deg: 0, color: '#b23a29' },
  { key: 'tho', ten: 'Thổ', han: '土', tang: 'Tỳ', tangHan: '脾', phu: 'Vị', deg: 72, color: '#b3872c' },
  { key: 'kim', ten: 'Kim', han: '金', tang: 'Phế', tangHan: '肺', phu: 'Đại Trường', deg: 144, color: '#b39a55' },
  { key: 'thuy', ten: 'Thủy', han: '水', tang: 'Thận', tangHan: '腎', phu: 'Bàng Quang', deg: 216, color: '#35638d' },
  { key: 'moc', ten: 'Mộc', han: '木', tang: 'Can', tangHan: '肝', phu: 'Đởm', deg: 288, color: '#4f7d39' },
]

const showMeo = ref(true) // méo (thực tế) ↔ chuẩn (cân bằng) để đối chiếu
const showLuc = ref(true) // hiện/ẩn lực sinh–khắc

// zEff mỗi hành (áp polarity). null = thiếu đo.
const zArr = computed<(number | null)[]>(() => {
  const pol = props.reversePolarity ? -1 : 1
  return HANHS.map((h) => { const raw = props.z ? props.z[h.key] : null; return raw == null ? null : pol * raw })
})

// Node hình học: bán kính dịch theo z (smoothstep deadband → cân bằng không lăn tăn).
const nodes = computed(() => HANHS.map((h, i) => {
  const z = zArr.value[i]
  const missing = z == null
  const az = missing ? 0 : Math.min(Math.abs(z), Z_CAP)
  let r = PENTA_R
  if (!missing) { const g = smoothstep(0.30, 0.65, Math.abs(z)); r = PENTA_R + K * Math.max(-Z_CAP, Math.min(Z_CAP, z * g)) }
  return {
    ...h, i, z, missing,
    r, p: pt(r, h.deg), home: pt(PENTA_R, h.deg),
    nodeR: 9 + 3 * az / Z_CAP, // 9..12 (SÀN 9 để lúc cân bằng vẫn thấy rõ)
    showAura: !missing && Math.abs(z) >= 0.5, // dead-zone
    tone: missing ? null : (z! > 0 ? 'thuc' : 'hu'),
    auraR: 9 + 3 * az / Z_CAP + 3 + 7 * (az / Z_CAP),
    auraA: 0.12 + 0.55 * (az / Z_CAP),
    label: pt(LABEL_R, h.deg), // nhãn tạng ở sát vành ngoài
    // DƯ (thực, đẩy ra ngoài mốc) / KHUYẾT (hư, co vào trong mốc) — như lớp Âm Dương
    duKhuyet: missing ? '' : (r > PENTA_R + 0.5 ? 'du' : r < PENTA_R - 0.5 ? 'khuyet' : ''),
  }
}))
// vị trí hiện tại (méo hay chuẩn) cho từng node
const posOf = (i: number) => (showMeo.value ? nodes.value[i]!.p : nodes.value[i]!.home)

// ── TƯƠNG KHẮC (dây i→i+2): tính thừa/vũ, chỉ tô tối đa 2 cạnh cường độ cao nhất ──
const khacRaw = computed(() => {
  const out: { i: number; j: number; loai: 'thua' | 'vu' | null; score: number; cuong: number }[] = []
  for (let i = 0; i < 5; i++) {
    const j = (i + 2) % 5
    const zi = zArr.value[i], zj = zArr.value[j]
    let loai: 'thua' | 'vu' | null = null, score = 0, cuong = 0
    if (zi != null && zj != null) {
      const thua = Math.max(0, zi) + Math.max(0, -zj)
      const vu = Math.max(0, zj - zi - 1)
      if (thua >= 1.2 && zi - zj >= GRAD) { loai = 'thua'; score = thua; cuong = Math.min(thua / 3, 1) }
      else if (vu >= 0.8) { loai = 'vu'; score = vu; cuong = Math.min(vu / 2, 1) }
    }
    out.push({ i, j, loai, score, cuong })
  }
  return out
})
const khac = computed(() => {
  const flagged = new Set(khacRaw.value.filter((k) => k.loai).sort((a, b) => b.score - a.score).slice(0, 2).map((k) => k.i + '-' + k.j))
  return khacRaw.value.map((k) => {
    const a = posOf(k.i), b = posOf(k.j)
    const on = showLuc.value && showMeo.value && !!k.loai && flagged.has(k.i + '-' + k.j)
    const L = Math.hypot(b.x - a.x, b.y - a.y) || 1
    const dir = { x: (b.x - a.x) / L, y: (b.y - a.y) / L }
    // thừa: mũi tên vào ĐÍCH j (to); vũ: mũi tên NGƯỢC về i (nhỏ)
    const head = k.loai === 'vu'
      ? arrowHead(a, { x: -dir.x, y: -dir.y }, 6, 3.2)
      : arrowHead(b, dir, 7 + 4 * k.cuong, 4 + 1.5 * k.cuong)
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    return { ...k, on, x1: N(a.x), y1: N(a.y), x2: N(b.x), y2: N(b.y), head, width: 2 + Math.min(k.score, 3), mid }
  })
})

// ── TƯƠNG SINH (cung i→i+1, mẹ→con) ở vành ngoài; đứt khi mẹ hư, đậm khi dồn nuôi ──
const sinh = computed(() => {
  const out: { d: string; head: string; mode: 'normal' | 'batcap' | 'donnuoi'; dao: boolean; daoHead: string }[] = []
  for (let i = 0; i < 5; i++) {
    const c = (i + 1) % 5
    const zm = zArr.value[i], zc = zArr.value[c]
    let mode: 'normal' | 'batcap' | 'donnuoi' = 'normal'
    if (zm != null) { if (zm <= -1) mode = 'batcap'; else if (zc != null && zm >= 1 && zc <= -0.5) mode = 'donnuoi' }
    const dao = zc != null && zm != null && zc >= 1 && zm <= -0.5 // con đạo mẫu khí
    const a0 = HANHS[i]!.deg + 9, a1 = HANHS[c]!.deg - 9 + (c === 0 ? 360 : 0)
    const p0 = pt(SINH_R, a0), p1 = pt(SINH_R, a1)
    const d = `M${N(p0.x)} ${N(p0.y)} A${SINH_R} ${SINH_R} 0 0 1 ${N(p1.x)} ${N(p1.y)}`
    const head = arrowHead(p1, { x: Math.cos(a1 * D2R), y: Math.sin(a1 * D2R) }, 6, 3.4)
    const daoHead = arrowHead(p0, { x: -Math.cos(a0 * D2R), y: -Math.sin(a0 * D2R) }, 6, 3.4)
    out.push({ d, head, mode, dao, daoHead })
  }
  return out
})

// ── GỐC BỆNH: node ở ĐUÔI mũi tên bệnh lý (nguồn thực), điểm = Σ cường·|z| ──
const gocIdx = computed(() => {
  if (!showMeo.value || !showLuc.value) return -1
  const score = [0, 0, 0, 0, 0]
  for (const k of khac.value) {
    if (!k.on) continue
    if (k.loai === 'thua') { const z = zArr.value[k.i]; score[k.i]! += k.cuong * Math.abs(z ?? 0) }
    else if (k.loai === 'vu') { const z = zArr.value[k.j]; score[k.j]! += k.cuong * Math.abs(z ?? 0) }
  }
  let best = -1, bv = 0
  score.forEach((v, idx) => { if (v > bv) { bv = v; best = idx } })
  return bv > 0 ? best : -1
})

// ── HƯỚNG TÁC ĐỘNG để lập lại cân bằng (thực tả · hư bổ kỳ mẫu · thừa "ức mạnh phù yếu" ·
//    vũ tả kẻ phản khắc + phù kẻ bị vũ) — GỢI Ý ĐỊNH HƯỚNG, không tự kê. Đã theo workflow y lý. ──
const phapTri = computed(() => {
  const items: { loai: string; text: string }[] = []
  if (showMeo.value && showLuc.value) {
    for (const k of khac.value.filter((k) => k.on).sort((a, b) => b.score - a.score)) {
      const a = HANHS[k.i]!, b = HANHS[k.j]!
      if (k.loai === 'thua') items.push({ loai: 'thua', text: `Tương thừa — ${a.ten}·${a.tang} (thực) khắc quá ${b.ten}·${b.tang}: ức ${a.tang} (tả ${a.ten}), phù ${b.tang} (bổ ${b.ten}).` })
      else if (k.loai === 'vu') items.push({ loai: 'vu', text: `Tương vũ — ${b.ten}·${b.tang} phản khắc ${a.ten}·${a.tang}: tả ${b.tang}, phù ${a.tang}.` })
    }
  }
  if (!items.length && showMeo.value) {
    const arr = nodes.value.filter((n) => !n.missing && n.z != null)
    const thuc = arr.filter((n) => n.z! >= 1).sort((x, y) => y.z! - x.z!)[0]
    const hu = arr.filter((n) => n.z! <= -1).sort((x, y) => x.z! - y.z!)[0]
    if (thuc) { const con = HANHS[(thuc.i + 1) % 5]!; items.push({ loai: 'thuc', text: `${thuc.tang} (${thuc.ten}) thực → TẢ: tả ${thuc.tang}, hoặc tả con ${con.tang} (thực tả kỳ tử).` }) }
    if (hu) { const me = HANHS[(hu.i + 4) % 5]!; items.push({ loai: 'hu', text: `${hu.tang} (${hu.ten}) hư → BỔ: bổ mẹ ${me.tang} để dưỡng ${hu.tang} (hư bổ kỳ mẫu).` }) }
  }
  if (!items.length) items.push({ loai: 'canbang', text: 'Ngũ hành tương đối cân — chưa thấy tạng lệch rõ; giữ điều hoà, theo dõi.' })
  return items.slice(0, 3)
})

const sel = ref<number | null>(null) // rê node → soi mạng của nó
const relOf = (i: number) => { // trả vai trò của node j so với node đang rê i
  if (sel.value == null) return ''
  const s = sel.value
  if (i === s) return 'self'
  if (i === (s + 1) % 5) return 'con' // ta sinh con
  if (i === (s + 4) % 5) return 'me' // mẹ sinh ta
  if (i === (s + 2) % 5) return 'bikhac' // ta khắc
  if (i === (s + 3) % 5) return 'khacta' // kẻ khắc ta
  return ''
}
const toneName = (t: string | null) => (t === 'thuc' ? 'thực (dư)' : t === 'hu' ? 'hư (suy)' : '—')
</script>

<template>
  <div class="vnh">
    <div class="vnh-stage">
      <!-- NỀN ĐÁ TỐI (đồng bộ lớp 4/5) → ngũ hành sáng nổi bật, tương phản mạnh. -->
      <div class="vnh-stone-bg"></div>
      <!-- Thái Cực của lớp 1 (giữ dạng + dư/khuyết) làm MOTIF chìm trên nền đá:
           ngũ tạng xô lệch (sao méo bên trên) ↔ âm dương cũng dư/khuyết. -->
      <AmDuongTaiji v-if="tongCuong" :tong-cuong="tongCuong" compact class="vnh-taiji-bg" />
    <svg class="vnh-svg" viewBox="0 0 420 420" role="img"
      aria-label="Ngôi sao Ngũ Hành méo theo mất cân bằng đo được, kèm lực tương sinh tương khắc">

      <!-- MÀN CHE TỐI mỏng: làm Thái Cực nền ĐỀU-tối lại (mờ nửa kem chói) để ngũ hành NỔI RÕ trên nền -->
      <circle class="vnh-veil" :cx="CX" :cy="CY" :r="RIM" />
      <!-- Vòng RÌA chung của các lớp — mọi thứ nằm gọn bên trong -->
      <circle class="vnh-rim" :cx="CX" :cy="CY" :r="RIM" />

      <!-- Nhãn tạng ở vành ngoài (GỌN: hành+tạng 1 dòng · phủ dòng nhỏ dưới; Hỏa có 2 tạng+2 phủ) -->
      <g v-for="n in nodes" :key="'lb' + n.key" class="vnh-olabel" :style="{ '--hc': n.color }">
        <text :x="n.label.x" :y="n.label.y - 6" class="vnh-ol-tang"><tspan class="vnh-ol-hanh">{{ n.ten }} {{ n.han }}</tspan>  {{ n.tang }} {{ n.tangHan }}<template v-if="n.tang2"> · {{ n.tang2 }}</template></text>
        <text :x="n.label.x" :y="n.label.y + 8" class="vnh-ol-phu">{{ n.phu }}<template v-if="n.phu2"> · {{ n.phu2 }}</template></text>
      </g>

      <!-- (0) VÒNG HÀI HOÀ — mốc cân bằng lý tưởng: khi cân bằng, 5 tạng nằm GỌN trên vòng này,
           đồng tâm trong Thái Cực; mất cân bằng thì các đỉnh rời khỏi vòng (dư ra / khuyết vào). -->
      <circle class="vnh-harmony" :cx="CX" :cy="CY" :r="PENTA_R" />
      <!-- (1) MỐC CÂN BẰNG ngũ giác đều (per tạng) + mốc nhà → node NGOÀI = DƯ (thực), TRONG = KHUYẾT (hư). -->
      <polygon class="vnh-ref" :points="nodes.map((n) => `${N(n.home.x)},${N(n.home.y)}`).join(' ')" />
      <circle v-for="n in nodes" :key="'hm' + n.key" class="vnh-home" :cx="n.home.x" :cy="n.home.y" r="3" />

      <!-- (2) NAN HOA mốc → node (đỏ = đẩy ra DƯ · lam = co vào KHUYẾT) -->
      <line v-for="n in nodes" :key="'sp' + n.key" class="vnh-spoke" :class="showMeo ? n.duKhuyet : ''"
        :x1="n.home.x" :y1="n.home.y" :x2="showMeo ? n.p.x : n.home.x" :y2="showMeo ? n.p.y : n.home.y" />

      <!-- (3) NGŨ GIÁC MÉO (hoặc chuẩn khi tắt) -->
      <polygon class="vnh-poly" :points="nodes.map((n) => `${N(showMeo ? n.p.x : n.home.x)},${N(showMeo ? n.p.y : n.home.y)}`).join(' ')" />

      <!-- (4) TƯƠNG SINH — cung ngoài (mẹ→con) -->
      <g v-if="showLuc" class="vnh-sinh">
        <g v-for="(s, i) in sinh" :key="'sh' + i" :class="[s.mode, { dao: s.dao }]">
          <path :d="s.d" /><polygon :points="s.head" />
          <polygon v-if="s.dao" class="vnh-sinh-dao" :points="s.daoHead" />
        </g>
      </g>

      <!-- (5) TƯƠNG KHẮC — dây chéo; nổi khi tương thừa (đỏ) / tương vũ (mận, ngược) -->
      <g class="vnh-khac">
        <template v-for="(k, i) in khac" :key="'kc' + i">
          <line v-if="showLuc" :x1="k.x1" :y1="k.y1" :x2="k.x2" :y2="k.y2"
            class="vnh-kline" :class="[k.on ? 'on-' + k.loai : 'rest']" :style="{ '--kw': k.width }" />
          <polygon v-if="k.on" :points="k.head" class="vnh-khead" :class="'on-' + k.loai" />
          <text v-if="k.on && k.loai === 'vu'" class="vnh-vu-lb" :x="k.mid.x" :y="k.mid.y">vũ</text>
        </template>
      </g>

      <!-- (6) NODE tạng — lõi màu hành + quầng hư/thực + viền gốc bệnh -->
      <g v-for="(n, i) in nodes" :key="'nd' + n.key" class="vnh-node"
        :class="[relOf(i), { dimmed: sel != null && !relOf(i), goc: i === gocIdx }]"
        @mouseenter="sel = i" @mouseleave="sel = null">
        <circle v-if="showMeo && n.showAura" class="vnh-aura" :class="n.tone || ''"
          :cx="posOf(i).x" :cy="posOf(i).y" :r="n.auraR" :style="{ '--aa': n.auraA }" />
        <circle v-if="i === gocIdx" class="vnh-goc-ring" :cx="posOf(i).x" :cy="posOf(i).y" :r="n.nodeR + 4" />
        <!-- VÒNG KÉP ĐỒNG NHẤT: halo kem ngoài (nổi trên nửa NÂU) + viền tối lõi (nổi trên nửa KEM) -->
        <circle class="vnh-halo" :cx="posOf(i).x" :cy="posOf(i).y" :r="n.nodeR + 2" />
        <circle class="vnh-core" :cx="posOf(i).x" :cy="posOf(i).y" :r="n.nodeR"
          :style="{ '--hc': n.color }" :class="{ missing: n.missing }" />
        <text v-if="n.missing" class="vnh-qmark" :x="posOf(i).x" :y="posOf(i).y">?</text>
        <title>{{ n.tang }}<template v-if="n.tang2"> · {{ n.tang2 }}</template> ({{ n.ten }}) — {{ n.missing ? 'thiếu dữ liệu đo' : toneName(n.tone) + ' · z=' + (n.z ?? 0).toFixed(2) }}<template v-if="i === gocIdx"> · GỐC (nguồn thực)</template></title>
      </g>

    </svg>
    </div>

    <div class="vnh-ctrls">
      <button type="button" class="vnh-btn" :class="{ on: showMeo }" @click="showMeo = !showMeo">
        {{ showMeo ? '◉' : '○' }} Sao méo (thực tế) <small>{{ showMeo ? '· đang so mốc chuẩn' : '· đang xem chuẩn cân bằng' }}</small>
      </button>
      <button type="button" class="vnh-btn" :class="{ on: showLuc }" @click="showLuc = !showLuc">
        {{ showLuc ? '◉' : '○' }} Lực sinh–khắc
      </button>
    </div>
    <!-- HƯỚNG TÁC ĐỘNG lập lại cân bằng — đọc từ chính hình méo + lực sinh khắc -->
    <div v-if="showMeo" class="vnh-phaptri">
      <span class="vnh-pt-lb">◈ Hướng lập lại cân bằng</span>
      <ul>
        <li v-for="(p, i) in phapTri" :key="i" :class="'vnh-pt--' + p.loai">{{ p.text }}</li>
      </ul>
      <span class="vnh-pt-note">Gợi ý định hướng theo sinh–khắc (tả thực · bổ hư · ức mạnh phù yếu) — đối chiếu tứ chẩn trước khi lập phương.</span>
    </div>
    <p class="vnh-legend">
      Nút <b style="color:#35638d">co vào = HƯ</b> (suy) · <b style="color:#b23a29">đẩy ra = THỰC</b> (dư); vòng/ngũ giác mờ = mốc cân bằng chuẩn.
      Dây <b style="color:#b23a29">đỏ mũi tên to</b> = tương thừa (khắc quá) · <b style="color:#8a2f4f">mận ngược</b> = tương vũ (phản khắc);
      viền <b style="color:#c99a2e">vàng</b> = tạng GỐC. Hư do bị khắc ≠ gốc bệnh — đối chiếu tứ chẩn.
    </p>
  </div>
</template>

<style scoped>
.vnh { width: 100%; max-width: min(100%, 62vh); margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 10px; }
/* Sân khấu vuông: NỀN ĐÁ TỐI + Thái Cực motif (mờ) + ngôi sao SVG chồng lên trên */
.vnh-stage { position: relative; width: 100%; }
/* NỀN ĐÁ TỐI như lớp 4/5 (đường kính = rim 91%) → ngũ hành sáng nổi bật, tương phản mạnh */
.vnh-stone-bg { position: absolute; inset: 4.5%; z-index: 0; border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle at 50% 42%, var(--brown-700, #6b4f34), var(--brown-800, #4b3626) 55%, var(--brown-900, #2f2417));
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3); }
/* Thái Cực motif PHÓNG TO lấp đầy tới rim (nới khung 138%, clip tròn 33%), chìm trên nền đá */
.vnh-taiji-bg { position: absolute; width: 138.4%; height: 138.4%; left: -19.2%; top: -19.2%; z-index: 1; opacity: 0.62; pointer-events: none; clip-path: circle(33% at 50% 50%); }
.vnh-taiji-bg :deep(.ad-card) { width: 100%; height: 100%; border: none !important; background: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; display: block; }
.vnh-taiji-bg :deep(.ad-fig) { width: 100%; height: 100%; padding: 0 !important; margin: 0 !important; }
.vnh-taiji-bg :deep(.ad-svg) { width: 100%; height: 100%; display: block; }
.vnh-svg { position: relative; z-index: 2; width: 100%; height: auto; display: block; overflow: visible; }
.vnh-svg text { font-family: var(--font-family, 'Inter', sans-serif); text-anchor: middle; dominant-baseline: middle; user-select: none; pointer-events: none; }
/* MÀN CHE TỐI: làm Thái Cực nền đều-tối lại (mờ nửa kem), nâng tương phản cho ngũ hành phía trên */
.vnh-veil { fill: rgba(24, 17, 9, 0.46); }
/* Vòng rìa chung của các lớp (sáng trên nền đá) */
.vnh-rim { fill: none; stroke: rgba(214, 195, 156, 0.55); stroke-width: 2; }
/* VÒNG HÀI HOÀ — mốc cân bằng lý tưởng (5 tạng "nằm gọn" trên vòng này khi cân bằng) */
.vnh-harmony { fill: none; stroke: rgba(214, 195, 156, 0.4); stroke-width: 1; }
/* HALO KÉP MẠNH cho nét sao: quầng KEM dày tách nét khỏi mọi nền tối + 1 pass tối cho nửa kem taiji.
   → ngũ hành NỔI RÕ, không lẫn vào Thái Cực. */
.vnh-poly, .vnh-sinh path, .vnh-sinh polygon, .vnh-kline.on-thua, .vnh-kline.on-vu, .vnh-khead, .vnh-spoke.du, .vnh-spoke.khuyet {
  filter: drop-shadow(0 0 2px rgba(252, 247, 238, 1)) drop-shadow(0 0 1.5px rgba(252, 247, 238, 0.95)) drop-shadow(0 0 1.1px rgba(22, 14, 6, 0.9));
}

/* Nhãn vành ngoài — chữ hành + quầng KÉP (kem paint-order + mép tối drop-shadow) đọc cả 2 nửa */
.vnh-olabel text { filter: drop-shadow(0 0 1px rgba(40, 26, 12, 0.85)); }
.vnh-ol-hanh { font-size: 12.5px; font-weight: 800; fill: var(--hc); stroke: rgba(30, 20, 8, 0.7); stroke-width: 2.4px; paint-order: stroke; }
.vnh-ol-tang { font-size: 10.5px; font-weight: 700; fill: #f2e6cc; stroke: rgba(30, 20, 8, 0.7); stroke-width: 2px; paint-order: stroke; }
.vnh-ol-phu { font-size: 8px; font-weight: 600; fill: #cdbb98; stroke: rgba(30, 20, 8, 0.6); stroke-width: 1.6px; paint-order: stroke; }

/* Mốc cân bằng ngũ giác (per tạng) + nan hoa — parchment sáng trên nền đá */
.vnh-ref { fill: none; stroke: rgba(214, 195, 156, 0.32); stroke-width: 1.2; stroke-dasharray: 5 4; }
.vnh-home { fill: none; stroke: rgba(214, 195, 156, 0.5); stroke-width: 1; }
.vnh-spoke { stroke: rgba(214, 195, 156, 0.35); stroke-width: 1.2; transition: all 0.35s ease; }
.vnh-spoke.du { stroke: #e0563a; stroke-width: 2.4; } /* đẩy ra ngoài mốc = DƯ (thực) */
.vnh-spoke.khuyet { stroke: #4f97d6; stroke-width: 2.4; } /* co vào trong mốc = KHUYẾT (hư) */

/* Ngũ giác méo — lõi PARCHMENT sáng (nổi trên nền đá tối), halo kép lo mọi nền */
.vnh-poly { fill: rgba(230, 214, 180, 0.05); stroke: #e6d3aa; stroke-width: 2.7; stroke-linejoin: round; transition: all 0.35s ease; }

/* Tương sinh (cung ngoài) */
.vnh-sinh path { fill: none; stroke: #5c9142; stroke-width: 2.7; stroke-linecap: round; }
.vnh-sinh polygon { fill: #4f7d39; }
.vnh-sinh .batcap path { stroke: rgba(90, 150, 74, 0.4); stroke-width: 1.2; stroke-dasharray: 3 3; filter: none; }
.vnh-sinh .batcap polygon { fill: rgba(90, 150, 74, 0.4); filter: none; }
.vnh-sinh .donnuoi path { stroke: #46873c; stroke-width: 3; }
.vnh-sinh-dao { fill: #c9762a; }

/* Tương khắc (dây chéo) */
.vnh-kline { stroke-linecap: round; }
.vnh-kline.rest { stroke: rgba(150, 70, 55, 0.28); stroke-width: 1; }
.vnh-kline.on-thua { stroke: #b23a29; stroke-width: var(--kw, 3); opacity: 0.95; }
.vnh-kline.on-vu { stroke: #8a2f4f; stroke-width: 2; stroke-dasharray: 4 3; opacity: 0.95; }
.vnh-khead.on-thua { fill: #b23a29; }
.vnh-khead.on-vu { fill: #8a2f4f; }
.vnh-vu-lb { font-size: 8.5px; font-weight: 800; fill: #8a2f4f; stroke: rgba(255, 252, 245, 0.85); stroke-width: 1.8px; paint-order: stroke; }

/* Node tạng — VÒNG KÉP đồng nhất (halo kem ngoài cứu nửa NÂU + viền tối lõi cứu nửa KEM) */
.vnh-node { cursor: help; transition: opacity 0.2s; }
.vnh-node.dimmed { opacity: 0.32; }
.vnh-halo { fill: none; stroke: #fbf6ec; stroke-width: 3; opacity: 0.95; transition: cx 0.35s ease, cy 0.35s ease; }
.vnh-core { fill: var(--hc); stroke: #2a1f12; stroke-width: 1.8; transition: cx 0.35s ease, cy 0.35s ease, r 0.2s; filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25)); }
.vnh-core.missing { fill: #f4efe4; stroke: rgba(120, 96, 60, 0.6); stroke-width: 1.4; stroke-dasharray: 3 2.5; }
/* Quầng hư/thực: màu đặc + opacity theo |z| + blur mềm (SVG fill không nhận radial-gradient) */
.vnh-aura { fill: #b23a29; opacity: calc(var(--aa) * 0.85); filter: blur(2.5px); transition: cx 0.35s ease, cy 0.35s ease; }
.vnh-aura.hu { fill: #2f6aa0; }
.vnh-qmark { font-size: 11px; font-weight: 800; fill: #7a6a50; }
.vnh-goc-ring { fill: none; stroke: #c99a2e; stroke-width: 2.6; filter: drop-shadow(0 0 1px #3a2c1a) drop-shadow(0 0 4px rgba(201, 154, 46, 0.85)); transition: cx 0.35s ease, cy 0.35s ease; }

.vnh-ctrls { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.vnh-btn { font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; padding: 5px 12px; border-radius: 999px; border: 1px solid var(--border, #e7ddcd); background: var(--surface, #fff); color: var(--text, #3a2c1a); display: inline-flex; align-items: baseline; gap: 5px; }
.vnh-btn small { font-weight: 500; font-size: 10px; color: var(--text-muted, #8a7a60); }
.vnh-btn.on { background: #efe6d4; border-color: #c9a24e; }
.vnh-legend { margin: 0; font-size: 11.5px; line-height: 1.5; color: var(--text, #3a2c1a); text-align: center; max-width: 44em; }
/* Hướng lập lại cân bằng */
.vnh-phaptri { width: 100%; max-width: 44em; border: 1px solid var(--border, #e7ddcd); border-left: 4px solid #6b8f4f; border-radius: var(--radius-md, 8px); background: var(--surface-2, #faf6ee); padding: 8px 12px; }
.vnh-pt-lb { font-size: 11px; font-weight: 800; letter-spacing: .03em; text-transform: uppercase; color: #4f7d39; }
.vnh-phaptri ul { margin: 5px 0 4px; padding-left: 16px; display: flex; flex-direction: column; gap: 3px; }
.vnh-phaptri li { font-size: 12.5px; line-height: 1.45; color: var(--text, #3a2c1a); }
.vnh-pt--thua::marker, .vnh-pt--thuc::marker { color: #b23a29; }
.vnh-pt--vu::marker { color: #8a2f4f; }
.vnh-pt--hu::marker { color: #35638d; }
.vnh-pt-note { font-size: 10.5px; font-style: italic; color: var(--text-subtle, #8a7a60); }
</style>
