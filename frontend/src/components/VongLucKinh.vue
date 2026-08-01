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
  caseSet?: string[] | null // ĐỊNH VỊ: tập kinh của bệnh nhân → tô sáng nền, kinh ngoài tập mờ đi
  troiKinh?: string | null // kinh TRỘI (kết luận) → nổi bật nhất, sáng mặc định không cần rê
  chuyenBien?: { vaoLy?: { slug?: string | null } | null; raBieu?: { slug?: string | null } | null } | null // mũi tên vào lý / ra biểu
  trajectory?: TrajInput[] | null // TRUYỀN BIẾN THỰC ĐO (chỉ đợt hiện tại): chuỗi lần đo cũ→mới
  currentId?: number | null // id lần đo ĐANG XEM (nổi bật nhất)
}>()
// Lát cắt tối thiểu của 1 lần đo để vẽ đường đo (cha map từ lucKinhTrajectory, chỉ đợt hiện tại).
interface TrajInput {
  id: number; date?: string; moiDot?: boolean; kinhSlug?: string | null; huong?: 'vao-ly' | 'ra-bieu' | 'giu' | null
  kieuTruyen?: string | null // 'viet' | 'bieu-ly' → dấu ◇ ở trung điểm đoạn
  capTinh?: string | null // 'cap' | 'cap?' → đoạn link dày (truyền cấp)
  trucTrung?: boolean // ONSET đợt vào thẳng Tam Âm → vòng đứt quanh hạt đầu
}
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

// ═══ TẦNG NỀN — ĐỊNH VỊ (KHÔNG phụ thuộc rê/bấm): 3 cấp độ sáng theo tập kinh của ca ═══
// Cấp 1 trội (đậm nhất) · Cấp 2 kinh khác của ca (sáng vừa) · Cấp 3 ngoài ca (mờ nền). Luôn hiện,
// KHÔNG cần bấm — để đồ hình LIÊN HỆ trực tiếp với kết luận ◎ + chips ① Định Vị.
const caseSet = computed(() => new Set(props.caseSet ?? []))
const inCase = (slug: string) => caseSet.value.has(slug)
const isTroi = (slug: string) => !!props.troiKinh && slug === props.troiKinh
// CHUYỂN BIẾN (đích DỰ ĐOÁN): vào lý (đỏ, nặng) / ra biểu (xanh, hồi phục). Guard trùng slug → ưu tiên vào lý.
const cbVaoLy = computed(() => props.chuyenBien?.vaoLy?.slug ?? null)
const cbRaBieu = computed(() => {
  const r = props.chuyenBien?.raBieu?.slug ?? null
  return r && r !== cbVaoLy.value ? r : null
})

// ═══ TẦNG TƯƠNG TÁC — SPOTLIGHT (rê/bấm/lọc, KHÔNG gồm troiKinh): chỉ THÊM nhấn ═══
// Rest ⇒ spotlight=null ⇒ KHÔNG kinh nào .dim ⇒ 3 cấp nền tự cầm trịch (không phải đợi bấm mới sáng).
const spotlight = computed(() => hovered.value ?? pinned.value ?? props.activeKinh ?? null)
const isHot = (slug: string) => spotlight.value === slug
const isPartner = (slug: string) => partnerOf(spotlight.value) === slug
// Chỉ mờ THÊM khi ĐANG soi VÀ kinh đó ngoài ca + không phải đích chuyển biến (đích cb luôn giữ sáng).
const isDim = (slug: string) =>
  spotlight.value !== null && !isHot(slug) && !isPartner(slug) && !inCase(slug) && slug !== cbVaoLy.value && slug !== cbRaBieu.value
// Kinh ngoài tập → mờ nền; TRỪ kinh trội (guard bất biến troi∈ca), kinh đang soi, và 2 đích chuyển biến.
const outCase = (slug: string) =>
  caseSet.value.size > 0 && !caseSet.value.has(slug) && !isTroi(slug) && slug !== spotlight.value && slug !== cbVaoLy.value && slug !== cbRaBieu.value
function enter(k: K) { hovered.value = k.slug } // rê = chỉ tô sáng cục bộ
function leave() { hovered.value = null }
// BẤM chốt/bỏ chốt (toggle → về được trạng thái nghỉ): vòng Kinh = chọn kinh; Khí/Tạng = lọc sâu.
function pickKinh(k: K) { pinned.value = pinned.value === k.slug ? null : k.slug; emit('select', { type: 'kinh', key: k.slug, label: `${k.ten} ${k.han}` }) }
function pickKhi(k: K) { pinned.value = pinned.value === k.slug ? null : k.slug; emit('select', { type: 'khi', key: k.khi, label: `Khí ${k.khi} ${k.khiHan}`, kinh: k.slug }) }
function pickTang(k: K, organ: string) { pinned.value = pinned.value === k.slug ? null : k.slug; emit('select', { type: 'tang', key: organ, label: organ, kinh: k.slug }) }

// ── ② TRUNG KIẾN (biểu-lý): dây cung nối kinh ↔ kinh đối; rê → dây của kinh đang rê sáng; nghỉ → dây của kinh TRỘI ──
const activeAxis = computed(() => {
  const s = spotlight.value ?? props.troiKinh ?? null
  if (!s) return null
  const p = partnerOf(s)
  if (!p) return null
  const a = pt(R.kinhIn - 4, degOf[s] ?? 0), b = pt(R.kinhIn - 4, degOf[p] ?? 0)
  return { x1: N(a.x), y1: N(a.y), x2: N(b.x), y2: N(b.y) }
})
const cnt = (slug: string) => props.counts?.[slug] ?? 0
const tenOfSlug = (s: string) => KINH.find((k) => k.slug === s)?.ten ?? s

// ── ③ TRUYỀN BIẾN THỰC ĐO (lịch sử các lần khám, CHỈ đợt hiện tại) ──────────────────────────────
// Chuỗi HẠT SỐ ở ĐĨA TRONG (r40–54, giữa Thái Cực r30 và vành Tạng r64) — QUÁ KHỨ đã đo (nét LIỀN),
// phân biệt hẳn với chuyển biến DỰ ĐOÁN (viền wedge nét ĐỨT) và vòng ①→⑥ trang trí (vành ngoài).
// Góc = kinh đo được; BÁN KÍNH = độ sâu lý tích luỹ (vào lý → gần tâm, ra biểu → ra vành). Đã qua phản biện.
const TR = { base: 47, step: 4, min: 41, max: 53 }
const DIRC: Record<string, string> = { 'vao-ly': '#b23a25', 'ra-bieu': '#2e6f52', giu: '#c9b48f' }
const showTraj = ref(true)
const trajNodes = computed(() => {
  const src = props.trajectory ?? []
  let depth = 0, k = 0
  const seenAtDeg: Record<number, number> = {} // đếm lặp cùng góc → xoè để hạt không đè
  return src.map((p) => {
    if (p.moiDot) depth = 0
    if (p.huong === 'vao-ly') depth++
    else if (p.huong === 'ra-bieu') depth--
    const r = Math.max(TR.min, Math.min(TR.max, TR.base - depth * TR.step))
    const baseDeg = p.kinhSlug != null ? degOf[p.kinhSlug] ?? null : null
    let deg: number | null = baseDeg, pos: { x: number; y: number } | null = null, n: number | null = null
    if (baseDeg != null) {
      const rep = (seenAtDeg[baseDeg] = (seenAtDeg[baseDeg] ?? 0) + 1)
      deg = baseDeg + (rep - 1) * 3.5 // xoè ±3.5°/lần lặp cùng kinh
      pos = pt(r, deg)
      n = ++k // đánh số 1..k TRONG đợt (bỏ qua điểm ngoài Lục Kinh)
    }
    return { id: p.id, date: p.date ?? '', kinhSlug: p.kinhSlug ?? null, huong: p.huong ?? null,
      kieuTruyen: p.kieuTruyen ?? null, capTinh: p.capTinh ?? null, trucTrung: !!p.trucTrung, r, deg, pos, n }
  })
})
const trajLocatedCount = computed(() => trajNodes.value.filter((n) => n.pos).length)
const trajSegs = computed(() => {
  const out: { d: string; head: string | null; color: string; cap: boolean; kieu: string | null; mid: { x: number; y: number } }[] = []
  const ns = trajNodes.value
  for (let i = 1; i < ns.length; i++) {
    const P = ns[i - 1]!, Q = ns[i]!
    if (!P.pos || !Q.pos) continue // gặp điểm ngoài Lục Kinh → NGẮT, không nội suy
    let d: string
    let mid: { x: number; y: number }
    if (P.kinhSlug === Q.kinhSlug) {
      d = `M${N(P.pos.x)} ${N(P.pos.y)} L${N(Q.pos.x)} ${N(Q.pos.y)}` // cùng kinh → đoạn radial thẳng
      mid = { x: (P.pos.x + Q.pos.x) / 2, y: (P.pos.y + Q.pos.y) / 2 }
    } else {
      const mx = (P.pos.x + Q.pos.x) / 2, my = (P.pos.y + Q.pos.y) / 2
      let nx = mx - CX, ny = my - CY
      const nl = Math.hypot(nx, ny)
      if (nl < 1) { // cặp biểu-lý 180° (trung điểm ≡ tâm): đẩy vuông góc dây, tránh cắt Thái Cực
        const dx = Q.pos.x - P.pos.x, dy = Q.pos.y - P.pos.y, dl = Math.hypot(dx, dy) || 1
        nx = -dy / dl; ny = dx / dl
      } else { nx /= nl; ny /= nl }
      const off = 10 // bow RA NGOÀI theo pháp tuyến hướng tâm → lệch khỏi dây Trung Kiến
      const cx = mx + nx * off, cy = my + ny * off
      d = `M${N(P.pos.x)} ${N(P.pos.y)} Q${N(cx)} ${N(cy)} ${N(Q.pos.x)} ${N(Q.pos.y)}`
      mid = { x: 0.25 * P.pos.x + 0.5 * cx + 0.25 * Q.pos.x, y: 0.25 * P.pos.y + 0.5 * cy + 0.25 * Q.pos.y } // điểm giữa Bezier (t=0.5)
    }
    const L = Math.hypot(Q.pos.x - P.pos.x, Q.pos.y - P.pos.y)
    const head = L < 2 ? null : arrowHead(Q.pos, { x: (Q.pos.x - P.pos.x) / L, y: (Q.pos.y - P.pos.y) / L })
    const kieu = Q.kieuTruyen === 'viet' ? 'viet' : Q.kieuTruyen === 'bieu-ly' ? 'bieu-ly' : null
    const cap = Q.capTinh === 'cap' || Q.capTinh === 'cap?'
    out.push({ d, head, color: DIRC[Q.huong ?? 'giu'] ?? DIRC.giu!, cap, kieu, mid })
  }
  return out
})
</script>

<template>
  <div class="vlk" :class="{ 'traj-on': showTraj && trajLocatedCount >= 2 }">
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
         :class="{ hot: isHot(w.slug), partner: isPartner(w.slug), dim: isDim(w.slug), 'half-hi': halfHi === w.nhom, 'in-case': inCase(w.slug), 'out-case': outCase(w.slug), troi: isTroi(w.slug), 'cb-vaoly': w.slug === cbVaoLy, 'cb-rabieu': w.slug === cbRaBieu }"
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
      <g v-for="w in wedges" :key="'b' + w.slug" class="vk-badge" :class="{ hot: isHot(w.slug), troi: isTroi(w.slug) }">
        <circle :cx="w.badge.x" :cy="w.badge.y" r="9" /><text :x="w.badge.x" :y="w.badge.y">{{ w.so }}</text>
      </g>

      <!-- ③ TRUYỀN BIẾN THỰC ĐO — chuỗi hạt số ở đĩa trong (chỉ khi ≥2 lần đo định vị được, trong 1 đợt) -->
      <g v-if="showTraj && trajLocatedCount >= 2" class="traj-real" aria-label="Truyền biến đã đo qua các lần khám">
        <path v-for="(s, i) in trajSegs" :key="'trl' + i" :d="s.d" class="tr-link" :class="{ cap: s.cap }" :style="{ stroke: s.color }" />
        <template v-for="(s, i) in trajSegs" :key="'trh' + i">
          <polygon v-if="s.head" :points="s.head" :style="{ fill: s.color }" />
        </template>
        <!-- Dấu ◇ ở trung điểm đoạn: việt kinh (ochre) / biểu-lý truyền (vàng Trung kiến) -->
        <template v-for="(s, i) in trajSegs" :key="'trk' + i">
          <path v-if="s.kieu" class="tr-kieu" :class="'tr-kieu--' + s.kieu"
                :d="`M${N(s.mid.x)} ${N(s.mid.y - 4.5)} L${N(s.mid.x + 4.5)} ${N(s.mid.y)} L${N(s.mid.x)} ${N(s.mid.y + 4.5)} L${N(s.mid.x - 4.5)} ${N(s.mid.y)} Z`" />
        </template>
        <template v-for="nd in trajNodes" :key="'trn' + nd.id">
          <g v-if="nd.pos" class="tr-node" :class="{ cur: nd.id === currentId }"
             :style="{ opacity: 0.45 + 0.55 * ((nd.n || 1) / Math.max(1, trajLocatedCount)) }">
            <circle v-if="nd.trucTrung" :cx="nd.pos.x" :cy="nd.pos.y" class="tr-trucrung" />
            <circle v-if="nd.id === currentId" :cx="nd.pos.x" :cy="nd.pos.y" class="tr-halo" />
            <circle :cx="nd.pos.x" :cy="nd.pos.y" :r="nd.id === currentId ? 5.5 : 4.5" class="tr-bead" />
            <text :x="nd.pos.x" :y="nd.pos.y">{{ nd.n }}</text>
            <title>Lần {{ nd.n }} · {{ nd.date }}<template v-if="nd.kinhSlug"> · {{ tenOfSlug(nd.kinhSlug) }}</template><template v-if="nd.trucTrung"> · 直 trực trúng</template></title>
          </g>
        </template>
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
    <!-- Nút bật/tắt ĐƯỜNG ĐO (chỉ hiện khi có ≥2 lần đo định vị trong đợt) -->
    <div v-if="trajLocatedCount >= 2" class="vlk-trajbtn">
      <button type="button" class="hb traj" :class="{ on: showTraj }" @click="showTraj = !showTraj">
        {{ showTraj ? '◉' : '○' }} Đường đo <small>{{ trajLocatedCount }} lần · {{ showTraj ? 'đang hiện' : 'đã ẩn' }}</small>
      </button>
    </div>
    <div class="vlk-legend">
      <span v-if="showTraj && trajLocatedCount >= 2"><i class="lg-traj"></i> Chuỗi hạt số (nét liền) = <b>ĐÃ ĐO</b> theo thời gian</span>
      <span v-if="showTraj && trajLocatedCount >= 2" class="lg-kieu"><b style="color:#e39a4a">◇</b> việt kinh · <b style="color:#ecc766">◇</b> biểu-lý · <b style="color:#e0655a">◌</b> trực trúng · đoạn dày = <b>cấp</b></span>
      <span><i class="lg-cb"></i> Viền nét đứt đỏ/xanh = <b>DỰ ĐOÁN</b> (vào lý / ra biểu)</span>
      <span :class="{ 'lg-muted': showTraj && trajLocatedCount >= 2 }"><i class="lg-flow"></i> ①→⑥ = thứ tự truyền (sách)</span>
      <span><i class="lg-tk"></i> Trung kiến (cặp biểu-lý)</span>
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
.vk-seg .wj { transition: stroke 0.2s, filter 0.2s, fill 0.2s; }

/* ═══════════ TẦNG 1 — ĐỘ SÁNG NỀN theo TẬP KINH (fill + opacity), KHÔNG cần rê/bấm ═══════════ */
/* Cấp 2 — kinh KHÁC của ca: fill rõ hơn nền + viền vàng NHẠT + quầng mỏng → "đang bật", LUÔN hiện. */
.vk-seg.in-case .wj-kinh.duong { fill: rgba(214, 178, 108, 0.42); }
.vk-seg.in-case .wj-kinh.am { fill: rgba(132, 158, 178, 0.40); }
.vk-seg.in-case .wj-kinh { stroke: rgba(255, 224, 150, 0.85); stroke-width: 1.4; filter: drop-shadow(0 0 3px rgba(255, 214, 140, 0.42)); }
.vk-seg.in-case .t-kinh { fill: #fff3d6; }
/* Cấp 3 — kinh NGOÀI ca: mờ làm nền (opacity + giảm bão hòa). */
.vk-seg.out-case { opacity: 0.34; filter: saturate(0.5); }

/* ═══════════ TẦNG 2 — VAI TRÒ TƯƠNG TÁC (chỉ stroke/glow, KHÔNG đổi fill nền) ═══════════ */
/* Nút Tam Dương/Âm (đặt TRƯỚC partner/hot/troi để không nuốt halo trội). */
.vk-seg.half-hi .wj-kinh { stroke: rgba(255, 246, 222, 0.9); stroke-width: 1.3; filter: drop-shadow(0 0 5px rgba(250, 233, 200, 0.5)); }
/* Kinh biểu-lý của kinh đang soi. */
.vk-seg.partner .wj-kinh { stroke: #f2d79a; stroke-width: 1.4; filter: drop-shadow(0 0 5px rgba(242, 215, 154, 0.55)); }
/* Kinh đang RÊ/soi — pop (bề dày ≥ cấp nền, không mảnh hơn để khỏi tụt hơn trội). */
.vk-seg.hot .wj-kinh { stroke: #fff8ea; stroke-width: 2; filter: drop-shadow(0 0 8px rgba(255, 245, 220, 0.75)); }
.vk-seg.hot .t-kinh, .vk-seg.hot .t-khi { fill: #fff8ea; }
/* CHUYỂN BIẾN DỰ ĐOÁN — nét ĐỨT (phân biệt TƯƠNG LAI với hiện tại nét liền); đè hot/partner trên đích. */
.vk-seg.cb-rabieu .wj-kinh { stroke: #6fae5a; stroke-width: 2; stroke-dasharray: 4 3; filter: drop-shadow(0 0 5px rgba(111, 174, 90, 0.8)); }
.vk-seg.cb-rabieu .t-kinh { fill: #d9f0cf; }
.vk-seg.cb-vaoly .wj-kinh { stroke: #e35a2f; stroke-width: 2; stroke-dasharray: 4 3; filter: drop-shadow(0 0 5px rgba(227, 90, 47, 0.85)); }
.vk-seg.cb-vaoly .t-kinh { fill: #ffd9c9; }

/* ═══════════ Cấp 1 — KINH TRỘI (kết luận): fill sáng NHẤT + viền đậm + hào quang KÉP.
   ĐẶT CUỐI trong nhóm stroke .wj-kinh ⇒ hào quang trội KHÔNG bao giờ bị hot/partner/cb nuốt. ═══════════ */
.vk-seg.troi .wj-kinh.duong { fill: rgba(214, 178, 108, 0.54); }
.vk-seg.troi .wj-kinh.am { fill: rgba(132, 158, 178, 0.52); }
.vk-seg.troi .wj-kinh { stroke: #ffe08a; stroke-width: 2.6; filter: drop-shadow(0 0 5px rgba(255, 210, 120, 0.95)) drop-shadow(0 0 13px rgba(255, 170, 60, 0.68)); }
.vk-seg.troi .t-kinh { fill: #fff; font-weight: 800; }

/* ═══ OPACITY nhóm <g> — spotlight chỉ mờ THÊM kinh ngoài ca; trội/soi/partner LUÔN tỏ (đặt sau out-case) ═══ */
.vk-seg.dim { opacity: 0.16; }
.vk-seg.troi { opacity: 1; }
.vk-seg.hot { opacity: 1; filter: none; }
.vk-seg.partner { opacity: 1; }

.tk-static { stroke: rgba(242, 215, 154, 0.28); stroke-width: 1; stroke-dasharray: 4 5; pointer-events: none; }
.tk-line { stroke: #f2d79a; stroke-width: 1.8; stroke-dasharray: 5 4; opacity: 0.95; pointer-events: none; filter: drop-shadow(0 0 3px rgba(242, 215, 154, 0.55)); }

.truyen { pointer-events: none; transition: opacity 0.25s; }
.truyen path { fill: none; stroke: #e8b35a; stroke-width: 2.4; stroke-linecap: round; opacity: 0.85; filter: drop-shadow(0 0 2px rgba(232, 179, 90, 0.5)); }
.truyen polygon { fill: #e8b35a; }
/* Khi BẬT đường đo thực → làm MỜ vòng ①→⑥ trang trí để không đọc nhầm là đường bệnh đã đi. */
.vlk.traj-on .truyen { opacity: 0.26; }

/* ── ③ TRUYỀN BIẾN THỰC ĐO: đường LIỀN (quá khứ) + hạt số, tách hẳn dự đoán (nét đứt) ── */
.traj-real { pointer-events: none; }
.tr-link { fill: none; stroke-width: 2.1; stroke-linecap: round; opacity: 0.92; }
.tr-link.cap { stroke-width: 3.4; filter: drop-shadow(0 0 2.5px rgba(143, 42, 28, 0.7)); } /* truyền cấp — đoạn dày, sậm */
/* Dấu ◇ kiểu truyền ở trung điểm đoạn — kênh riêng, không mượn màu hướng */
.tr-kieu { fill: none; stroke-width: 1.5; }
.tr-kieu--viet { stroke: #e39a4a; } /* việt kinh — ochre sáng (nổi trên nền tối) */
.tr-kieu--bieu-ly { stroke: #ecc766; } /* biểu-lý — vàng Trung kiến */
.tr-node { pointer-events: auto; cursor: help; }
.tr-bead { fill: #fbf1dd; stroke: #7a5a2c; stroke-width: 1.4; }
.tr-trucrung { r: 7.5; fill: none; stroke: #e0655a; stroke-width: 1.6; stroke-dasharray: 3 2; } /* trực trúng — vòng đứt TĨNH */
.tr-node text { font-size: 8px; font-weight: 800; fill: #4b3319; stroke: none; }
.tr-node.cur .tr-bead { fill: #fff; stroke: #c98a2e; stroke-width: 2; }
.tr-halo { r: 6; fill: none; stroke: #ffd27a; stroke-width: 1.8; transform-box: fill-box; transform-origin: center; animation: trPulse 1.6s ease-in-out infinite; }
@keyframes trPulse { 0%, 100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 0.2; transform: scale(1.45); } }
@media (prefers-reduced-motion: reduce) { .tr-halo { animation: none; } }
.vk-badge circle { fill: #6b4a24; stroke: #f4e2b8; stroke-width: 1.4; }
.vk-badge text { font-size: 11px; font-weight: 800; fill: #fff6e2; stroke: none; }
.vk-badge.hot circle { fill: #9a6c2e; stroke: #fff; }
.vk-badge.troi circle { fill: #9a6c2e; stroke: #ffe08a; stroke-width: 1.8; }

.vlk-halfbtns { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
.hb { font: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; padding: 6px 14px; border-radius: 999px; border: 1px solid var(--border, #e7ddcd); background: var(--surface, #fff); color: var(--text, #3a2c1a); display: inline-flex; align-items: baseline; gap: 6px; transition: background 0.15s, border-color 0.15s, transform 0.1s; }
.hb small { font-weight: 500; font-size: 10.5px; color: var(--text-muted, #8a7a60); }
.hb:hover { transform: translateY(-1px); }
.hb.duong.on { background: #f4e3c2; border-color: #d9b877; }
.hb.am.on { background: #dbe6ef; border-color: #9db6ca; }
.hb.am.on small, .hb.duong.on small { color: var(--text, #3a2c1a); }
.vlk-trajbtn { display: flex; justify-content: center; }
.hb.traj.on { background: #efe6d4; border-color: #c9a24e; }
.hb.traj.on small { color: var(--text, #3a2c1a); }

.vlk-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 18px; font-size: 12px; font-weight: 600; color: var(--text, #3a2c1a); }
.vlk-legend span { display: inline-flex; align-items: center; gap: 6px; }
.vlk-legend span.lg-muted { opacity: 0.5; }
.vlk-legend i { display: inline-block; }
.lg-traj { width: 20px; height: 0; border-top: 2px solid #c9a24e; position: relative; }
.lg-cb { width: 18px; height: 0; border-top: 2px dashed #cf5233; }
.lg-flow { width: 22px; height: 4px; border-radius: 2px; background: linear-gradient(90deg, #f4dca2, #dd8f44, #bf4632); }
.lg-tk { width: 16px; height: 0; border-top: 2px dashed #c9a24e; }
</style>
