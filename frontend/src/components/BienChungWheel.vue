<script setup lang="ts">
/**
 * BienChungWheel — ĐỒ HÌNH NGŨ HÀNH (ngũ giác) bóc lớp theo Thương Hàn Tạp Luận.
 * lop 1..5: 1 Âm Dương (Thái Cực) → 2 +Ngũ Hành (5 vòng tròn + tương sinh XANH + tương khắc ĐỎ)
 *   → 3 +Tạng Phủ → 4 +Lục Khí → 5 +Lục Kinh (vòng bao ngoài).
 * Tương sinh/khắc GIỮ NGUYÊN khi bóc thêm lớp. Chữ Việt lớn, Hán nhỏ; nhãn vòng cong bám vành khăn.
 * viewBox 420, tâm (210,210), 0°=12h, thuận KĐH. HỎA ở đỉnh; thuận KĐH = tương sinh.
 */
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  lop: number
  activeTang?: string | null
  auto?: boolean
  /** ĐỊNH VỊ bệnh nhân (đọc-chỉ): tô sáng NHIỀU ô CÓ trên mỗi lớp, làm mờ ô không. Vắng = như cũ. */
  dinhvi?: { kinh: string[]; khi: string[]; tang: string[]; amDuong: 'duong' | 'am' | 'both' | null; amLoai?: string | null } | null
}>()
// Trỏ vào 1 cung → báo cho panel biết đang trỏ Lục Kinh / Lục Khí / Tạng Phủ nào.
const emit = defineEmits<{ select: [{ type: 'kinh' | 'khi' | 'tang' | 'hanh'; key: string; label: string; organs?: string[] }] }>()
const KINH_SLUG: Record<string, string> = {
  'Thái Dương': 'thai-duong', 'Dương Minh': 'duong-minh', 'Thiếu Dương': 'thieu-duong',
  'Thái Âm': 'thai-am', 'Thiếu Âm': 'thieu-am', 'Quyết Âm': 'quyet-am',
}

// Rê/chạm 1 mục → "gom" cả nhóm CÙNG HÀNH sáng lên (Thái Dương↔Hàn·Thủy↔Thận/Bàng Quang↔Thủy), còn lại mờ.
const hovered = ref<string | null>(null)
const hoveredGroup = ref<'duong' | 'am' | null>(null) // rê kinh Dương/Âm → biết bệnh vào Phủ hay Tạng trước
const hoveredHex = ref<number | null>(null) // idx HEXA của kinh đang rê (chỉ Lục Kinh/Khí) → tìm cặp biểu-lý
const fam = (h: string) => (h === 'hoaQ' || h === 'hoaT' ? 'hoa' : h)
const hot = (h: string) => hovered.value !== null && fam(h) === fam(hovered.value)
// Mục ĐANG CHỌN (bấm) — giữ sáng trên vòng kể cả khi rời chuột; rê chỉ XEM TRƯỚC (đè tạm lên picked).
const pickedH = ref<string | null>(null)
const pickedG = ref<'duong' | 'am' | null>(null)
const pickedHex = ref<number | null>(null)
function enter(h: string, g: 'duong' | 'am' | null = null, hex: number | null = null) {
  hovered.value = h
  hoveredGroup.value = g
  hoveredHex.value = hex
}
function pick(h: string, g: 'duong' | 'am' | null = null, hex: number | null = null) {
  cancelDwell()
  pickedH.value = h
  pickedG.value = g
  pickedHex.value = hex
  enter(h, g, hex)
}
function leave() {
  // rời vòng → QUAY VỀ mục đang chọn (giữ sáng); chưa chọn gì thì tắt hẳn
  hovered.value = pickedH.value
  hoveredGroup.value = pickedG.value
  hoveredHex.value = pickedHex.value
}
// Tam Dương → bệnh vào PHỦ trước (Bàng Quang trước Thận) → phủ hiện TO ở vòng ngoài.
const phuFirst = (h: string) => hot(h) && hoveredGroup.value === 'duong'

const CX = 210
const CY = 210
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
// Đường cung để CHỮ BÁM theo vòng (textPath). Nửa dưới đảo chiều cho chữ luôn đọc xuôi.
function arcPath(r: number, deg: number, span: number): string {
  const bottom = deg > 90 && deg < 270
  const a0 = bottom ? deg + span : deg - span
  const a1 = bottom ? deg - span : deg + span
  const p0 = pt(r, a0)
  const p1 = pt(r, a1)
  return `M${N(p0.x)} ${N(p0.y)} A${r} ${r} 0 0 ${bottom ? 0 : 1} ${N(p1.x)} ${N(p1.y)}`
}
function arrowHead(tip: { x: number; y: number }, dir: { x: number; y: number }, len = 6, w = 3.4) {
  const px = -dir.y
  const py = dir.x
  return `${N(tip.x)},${N(tip.y)} ${N(tip.x - dir.x * len + px * w)},${N(tip.y - dir.y * len + py * w)} ${N(tip.x - dir.x * len - px * w)},${N(tip.y - dir.y * len - py * w)}`
}

const HANH = {
  moc: { fill: 'rgba(126,176,112,.44)', bright: '#a6df92', node: '#4f7d39' },
  hoa: { fill: 'rgba(206,96,70,.46)', bright: '#f0967c', node: '#b23a29' },
  hoaT: { fill: 'rgba(216,124,74,.46)', bright: '#f4ab8a', node: '#c06a34' },
  hoaQ: { fill: 'rgba(200,84,64,.48)', bright: '#f0907c', node: '#b23a29' },
  tho: { fill: 'rgba(208,168,92,.46)', bright: '#f0cf82', node: '#b3872c' },
  kim: { fill: 'rgba(228,216,184,.42)', bright: '#f3e8cc', node: '#b39a55' },
  thuy: { fill: 'rgba(92,154,184,.46)', bright: '#93c8e2', node: '#35638d' },
}
type HanhKey = keyof typeof HANH
const DUONG = 'rgba(214,178,108,.22)'
const AM = 'rgba(140,164,182,.18)'

interface PentaItem { deg: number; hanh: HanhKey; han: string; ten: string; tang: string; tangHan: string; phu: string; phu2?: string }
interface HexaItem { deg: number; nhom: 'duong' | 'am'; kinh: string; kinhHan: string; khi: string; khiHan: string; mua: string; hanh: HanhKey }

// Ngũ Hành — HỎA Ở ĐỈNH; thuận KĐH = vòng TƯƠNG SINH (Hỏa→Thổ→Kim→Thủy→Mộc→Hỏa).
const PENTA: PentaItem[] = [
  { deg: 0, hanh: 'hoa', han: '火', ten: 'Hỏa', tang: 'Tâm', tangHan: '心', phu: 'Tiểu Trường', phu2: 'Tâm Bào' },
  { deg: 72, hanh: 'tho', han: '土', ten: 'Thổ', tang: 'Tỳ', tangHan: '脾', phu: 'Vị' },
  { deg: 144, hanh: 'kim', han: '金', ten: 'Kim', tang: 'Phế', tangHan: '肺', phu: 'Đại Trường' },
  { deg: 216, hanh: 'thuy', han: '水', ten: 'Thủy', tang: 'Thận', tangHan: '腎', phu: 'Bàng Quang' },
  { deg: 288, hanh: 'moc', han: '木', ten: 'Mộc', tang: 'Can', tangHan: '肝', phu: 'Đởm' },
]
// Lục Khí gọi theo TÊN QUEN THUỘC (Phong/Hàn/Thử/Thấp/Táo/Hỏa) + mùa nhỏ — dễ hiểu cho người Việt/mới.
// (bản khí gốc Quân Hỏa/Tướng Hỏa vẫn là hành Hỏa — chỉ đổi cách GỌI để trực quan.)
const HEXA: HexaItem[] = [
  { deg: 0, nhom: 'duong', kinh: 'Thái Dương', kinhHan: '太陽', khi: 'Hàn', khiHan: '寒', mua: 'Đông', hanh: 'thuy' },
  { deg: 60, nhom: 'duong', kinh: 'Dương Minh', kinhHan: '陽明', khi: 'Táo', khiHan: '燥', mua: 'Thu', hanh: 'kim' },
  { deg: 300, nhom: 'duong', kinh: 'Thiếu Dương', kinhHan: '少陽', khi: 'Thử', khiHan: '暑', mua: 'Hạ (Tướng Hỏa)', hanh: 'hoaT' },
  { deg: 240, nhom: 'am', kinh: 'Thái Âm', kinhHan: '太陰', khi: 'Thấp', khiHan: '濕', mua: 'Trưởng Hạ', hanh: 'tho' },
  { deg: 180, nhom: 'am', kinh: 'Thiếu Âm', kinhHan: '少陰', khi: 'Nhiệt', khiHan: '熱', mua: 'Hạ (Quân Hỏa)', hanh: 'hoaQ' },
  { deg: 120, nhom: 'am', kinh: 'Quyết Âm', kinhHan: '厥陰', khi: 'Phong', khiHan: '風', mua: 'Xuân', hanh: 'moc' },
]

const NODE_R = 15
const PENTA_R = 80
const SINH_R = 100
const R = { tpIn: 122, tpOut: 152, lkhiIn: 156, lkhiOut: 178, lkinhIn: 182, lkinhOut: 204 }
const GAP5 = 2.4
const GAP6 = 2

const nodes = PENTA.map((p) => ({ ...p, ...pt(PENTA_R, p.deg) }))

function wedges5(rO: number, rI: number) {
  return PENTA.map((p) => ({ ...p, d: donut(rO, rI, p.deg - 36 + GAP5, p.deg + 36 - GAP5) }))
}
function wedges6(rO: number, rI: number) {
  return HEXA.map((h) => ({ ...h, d: donut(rO, rI, h.deg - 30 + GAP6, h.deg + 30 - GAP6) }))
}
// nhãn CONG bám vành khăn: mỗi vòng có cung riêng cho tên + phụ đề
const tangPhu = wedges5(R.tpOut, R.tpIn)
// LỚP 3 = các NÚT organ (băng bấm): tạng băng NGOÀI (to), phủ băng TRONG. Hỏa chia đôi băng trong → Tiểu Trường · Tam Tiêu ngang hàng.
const ORG_MID = 136
const organBtns = PENTA.flatMap((p) => {
  const a0 = p.deg - 36 + GAP5
  const a1 = p.deg + 36 - GAP5
  const btns: { key: string; name: string; hanh: HanhKey; type: 'tang' | 'phu'; big: boolean; d: string; arc: string }[] = [
    { key: p.tang, name: p.tang, hanh: p.hanh, type: 'tang', big: true, d: donut(R.tpOut, ORG_MID, a0, a1), arc: arcPath(144, p.deg, 33) },
  ]
  if (p.phu2) {
    btns.push({ key: p.phu, name: p.phu, hanh: p.hanh, type: 'phu', big: false, d: donut(ORG_MID, R.tpIn, a0, p.deg - 1.4), arc: arcPath(128.5, p.deg - 17.5, 27) })
    btns.push({ key: p.phu2, name: p.phu2, hanh: p.hanh, type: 'phu', big: false, d: donut(ORG_MID, R.tpIn, p.deg + 1.4, a1), arc: arcPath(128.5, p.deg + 17.5, 27) })
  } else {
    btns.push({ key: p.phu, name: p.phu, hanh: p.hanh, type: 'phu', big: false, d: donut(ORG_MID, R.tpIn, a0, a1), arc: arcPath(128.5, p.deg, 33) })
  }
  return btns
})
const lucKhi = wedges6(R.lkhiOut, R.lkhiIn).map((s) => ({ ...s, arc: arcPath(170, s.deg, 26), arcSub: arcPath(160, s.deg, 26) }))
const lucKinh = wedges6(R.lkinhOut, R.lkinhIn).map((s) => ({ ...s, arc: arcPath(192, s.deg, 26) }))

// ── ĐỊNH VỊ bệnh nhân (đọc-chỉ): tô sáng NHIỀU ô CÓ, mờ ô không — đè lên trạng thái bóc lớp ──
const dvActive = computed(() => !!props.dinhvi)
const dvNorm = (s: string) => s.toLowerCase().trim()
const dvKinhSet = computed(() => new Set((props.dinhvi?.kinh ?? []).map(dvNorm)))
const dvKhiSet = computed(() => new Set((props.dinhvi?.khi ?? []).map(dvNorm)))
const dvTangSet = computed(() => new Set((props.dinhvi?.tang ?? []).map(dvNorm)))
const dvLitKinh = (k: string) => dvKinhSet.value.has(dvNorm(k))
const dvLitKhi = (k: string) => dvKhiSet.value.has(dvNorm(k))
const dvLitTang = (name: string) => dvTangSet.value.has(dvNorm(name))
// Ngũ Hành SUY RA: hành sáng nếu có tạng/khí thuộc hành đó đang bệnh.
const dvHanhSet = computed(() => {
  const s = new Set<string>()
  for (const b of organBtns) if (dvLitTang(b.name)) s.add(fam(b.hanh))
  for (const h of HEXA) if (dvLitKhi(h.khi)) s.add(fam(h.hanh))
  return s
})
const dvLitHanh = (h: string) => dvHanhSet.value.has(fam(h))

// TƯƠNG SINH (相生): cung XANH KĐH giữa 2 hành liền kề, mũi tên ở đích (không cần chữ).
const sinh = PENTA.map((p, i) => {
  const d0 = p.deg + 16
  const d1 = p.deg + 56
  const p0 = pt(SINH_R, d0)
  const p1 = pt(SINH_R, d1)
  const dir = { x: Math.cos(d1 * D2R), y: Math.sin(d1 * D2R) }
  return { d: `M${N(p0.x)} ${N(p0.y)} A${SINH_R} ${SINH_R} 0 0 1 ${N(p1.x)} ${N(p1.y)}`, head: arrowHead(p1, dir), from: i, to: (i + 1) % 5 }
})

// TƯƠNG KHẮC (相克): ngôi sao ĐỎ nối hành cách 2 ô (deg+144), mũi tên vào đích (không cần chữ).
const khac = PENTA.map((p, i) => {
  const q = PENTA[(i + 2) % 5]
  const a = pt(PENTA_R, p.deg)
  const b = pt(PENTA_R, q.deg)
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const dir = { x: dx / len, y: dy / len }
  const inset = NODE_R + 3
  const ax = a.x + dir.x * inset
  const ay = a.y + dir.y * inset
  const bx = b.x - dir.x * inset
  const by = b.y - dir.y * inset
  return { d: `M${N(ax)} ${N(ay)} L${N(bx)} ${N(by)}`, head: arrowHead({ x: bx, y: by }, dir), from: i, to: (i + 2) % 5 }
})

// ── Cặp BIỂU-LÝ (Trung kiến): HEXA đối diện (deg+180). Rê 1 kinh → nối trục xuyên tâm tới kinh đối. ──
const partnerHex = computed(() => {
  if (hoveredHex.value === null) return -1
  const cur = HEXA[hoveredHex.value]
  if (!cur) return -1
  const d = (cur.deg + 180) % 360
  return HEXA.findIndex((h) => h.deg === d)
})
// ── ẢNH HƯỞNG chéo (Phủ đích tác động tạng khác): Thái Dương → Phế (Kim · chủ bì mao = phần biểu) ──
const AFFECT: Record<number, HanhKey> = { 0: 'kim' }
const affectFam = computed(() => (hoveredHex.value === null ? null : (AFFECT[hoveredHex.value] ?? null)))
const affected = (h: string) => affectFam.value !== null && fam(h) === affectFam.value
// node/tạng phủ (5 hành): mờ nếu KHÁC hành đang gom VÀ không phải tạng bị ảnh hưởng
const dimmed = (h: string) => hovered.value !== null && fam(h) !== fam(hovered.value) && !affected(h)
// Lục Kinh/Khí: sáng nếu CÙNG hành, HOẶC là kinh đang rê, HOẶC là kinh đối biểu-lý (Trung kiến)
const dimHex = (idx: number, h: string) =>
  hovered.value !== null && fam(h) !== fam(hovered.value) && idx !== hoveredHex.value && idx !== partnerHex.value
const hotHex = (idx: number, h: string) => hot(h) || idx === hoveredHex.value
const isPartner = (idx: number) => idx === partnerHex.value
// Trục Trung kiến (biểu-lý) xuyên tâm khi rê Lục Kinh/Khí
const bieuLyAxis = computed(() => {
  const hi = hoveredHex.value
  const pi = partnerHex.value
  if (hi === null || pi < 0) return null
  const p0 = pt(150, HEXA[hi].deg)
  const p1 = pt(150, HEXA[pi].deg)
  return { x1: N(p0.x), y1: N(p0.y), x2: N(p1.x), y2: N(p1.y) }
})
// Mũi tên ẢNH HƯỞNG: từ kinh đang rê → node tạng bị ảnh hưởng (cong, nét đứt).
const affectArrow = computed(() => {
  const hi = hoveredHex.value
  const famK = affectFam.value
  if (hi === null || !famK) return null
  const node = nodes.find((n) => n.hanh === famK)
  if (!node) return null
  const from = pt(150, HEXA[hi].deg)
  const mx = (from.x + node.x) / 2
  const my = (from.y + node.y) / 2
  const ctrl = { x: CX + (mx - CX) * 0.5, y: CY + (my - CY) * 0.5 }
  const dir = { x: node.x - ctrl.x, y: node.y - ctrl.y }
  const L = Math.hypot(dir.x, dir.y) || 1
  const tx = node.x - (dir.x / L) * (NODE_R + 3)
  const ty = node.y - (dir.y / L) * (NODE_R + 3)
  return { d: `M${N(from.x)} ${N(from.y)} Q${N(ctrl.x)} ${N(ctrl.y)} ${N(tx)} ${N(ty)}`, head: arrowHead({ x: tx, y: ty }, { x: dir.x / L, y: dir.y / L }, 7, 4) }
})

// ── NGŨ HÀNH: rê 1 HÀNH (lớp 2/3) → nêu quan hệ: MẸ sinh · CON (ta sinh) · KẺ khắc ta · ta KHẮC ──
const pentaIdx = (h: string) => PENTA.findIndex((p) => p.hanh === fam(h))
// lớp 2 (Ngũ Hành) VÀ lớp 3 (Tạng Phủ) đều dùng sinh/khắc để nêu mẹ/con/khắc
const selIdx = computed(() => ((props.lop === 2 || props.lop === 3) && hovered.value ? pentaIdx(hovered.value) : -1))
const relMode = computed(() => selIdx.value >= 0)
const arrowActive = (from: number, to: number) => selIdx.value >= 0 && (from === selIdx.value || to === selIdx.value)
const nodeDim = (h: string) => props.lop >= 3 && dimmed(h) // lớp 2 KHÔNG mờ node (đang nêu quan hệ)

// ── LỚP 3 (Tạng Phủ): tàng tượng (chức năng chủ) + quẻ tương ứng — hiện dạng TEXT khi rê ──
const TANG_FUNC: Record<string, string> = {
  hoa: 'chủ huyết mạch',
  tho: 'chủ vận hóa · thống nhiếp huyết',
  kim: 'chủ khí · tuyên giáng · hợp bì mao',
  thuy: 'chủ thủy · tàng tinh · chủ cốt tủy',
  moc: 'chủ sơ tiết · tàng huyết',
}
// Ngũ tạng TÀNG ngũ thần: Tâm–Thần · Can–Hồn · Tỳ–Ý · Phế–Phách · Thận–Chí
const TANG_THAN: Record<string, string> = { hoa: 'Thần 神', moc: 'Hồn 魂', tho: 'Ý 意', kim: 'Phách 魄', thuy: 'Chí 志' }
// Hỏa có 2 cặp: Quân Hỏa (Tâm/Tiểu Trường) + TƯỚNG HỎA (Tâm Bào/Tam Tiêu)
const TANG_EXTRA: Record<string, string> = { hoa: 'Tâm Bào (Tướng Hỏa) — Tam Tiêu là đường KINH, ở lớp Lục Kinh' }
const QUAI_OF_HANH: Record<string, string> = {
  hoa: '☲ Ly',
  thuy: '☵ Khảm',
  moc: '☳ Chấn · ☴ Tốn',
  kim: '☰ Càn · ☱ Đoài',
  tho: '☶ Cấn · ☷ Khôn',
}
const hoverInfo = computed(() => {
  if (props.lop !== 3 || hovered.value === null) return null
  const h = fam(hovered.value)
  const p = PENTA.find((x) => x.hanh === h)
  if (!p) return null
  return { tang: p.tang, tangHan: p.tangHan, phu: p.phu, hanhTen: p.ten, hanhHan: p.han, func: TANG_FUNC[h] ?? '', than: TANG_THAN[h] ?? '', extra: TANG_EXTRA[h] ?? '', quai: QUAI_OF_HANH[h] ?? '', color: HANH[h as HanhKey].bright }
})

// ── LỚP 4 (Lục Khí): Tiêu–Bản–Trung khí (標本中氣) + Tòng hóa + tạng phủ + thứ tự CHỦ KHÍ trong năm ──
const KHI_INFO: Record<string, { ban: string; tieu: string; trung: string; tong: string; tangPhu: string; chuOrder: number }> = {
  'Quyết Âm': { ban: 'Phong 風 (Mộc)', tieu: 'Âm', trung: 'Hỏa (Thiếu Dương)', tong: 'tòng TRUNG khí (hỏa)', tangPhu: 'Can · Tâm Bào', chuOrder: 1 },
  'Thiếu Âm': { ban: 'Nhiệt 熱·Thử (Quân Hỏa)', tieu: 'Âm', trung: 'Hàn (Thái Dương)', tong: 'tòng BẢN + TIÊU (nhiệt ↔ hàn)', tangPhu: 'Tâm · Thận', chuOrder: 2 },
  'Thiếu Dương': { ban: 'Hỏa 火 (Tướng)', tieu: 'Dương', trung: 'Phong (Quyết Âm)', tong: 'tòng BẢN (hỏa)', tangPhu: 'Đởm · Tam Tiêu', chuOrder: 3 },
  'Thái Âm': { ban: 'Thấp 濕 (Thổ)', tieu: 'Âm', trung: 'Táo (Dương Minh)', tong: 'tòng BẢN (thấp)', tangPhu: 'Tỳ · Phế', chuOrder: 4 },
  'Dương Minh': { ban: 'Táo 燥 (Kim)', tieu: 'Dương', trung: 'Thấp (Thái Âm)', tong: 'tòng TRUNG khí (thấp)', tangPhu: 'Vị · Đại Trường', chuOrder: 5 },
  'Thái Dương': { ban: 'Hàn 寒 (Thủy)', tieu: 'Dương', trung: 'Nhiệt (Thiếu Âm)', tong: 'tòng BẢN + TIÊU (hàn ↔ nhiệt)', tangPhu: 'Bàng Quang · Tiểu Trường', chuOrder: 6 },
}
const khiInfo = computed(() => {
  if (props.lop !== 4 || hoveredHex.value === null) return null
  const s = HEXA[hoveredHex.value]
  const info = s ? KHI_INFO[s.kinh] : null
  if (!s || !info) return null
  return { kinh: s.kinh, kinhHan: s.kinhHan, khi: s.khi, khiHan: s.khiHan, mua: s.mua, ...info, quai: QUAI_OF_HANH[fam(s.hanh)] ?? '', color: HANH[s.hanh].bright }
})
// Badge THỨ TỰ CHỦ KHÍ (1→6 trong năm) trên mỗi khí — chủ khí cố định theo mùa
const khiBadges = HEXA.map((s) => ({ order: KHI_INFO[s.kinh]?.chuOrder ?? 0, ...pt(R.lkhiIn - 7, s.deg) }))

// Thái Cực (Âm Dương) ở TÂM — lớp 1 to (nguyên thủy), lớp ≥2 thu về medallion nhỏ giữa ngũ giác.
// Trắng-xanh (không dùng cặp kem/nâu như AmDuongTaiji.vue) — đồng bộ với nền đĩa của lớp bóc-lớp này.
const yang = '#eef5f8'
const yin = '#1b3a4b'
const taiji = computed(() => {
  // LỚP 1: Thái Cực TO lấp đĩa (nguyên bản 62 — ĐÚNG bằng các lớp khác, KHÔNG phóng to thêm nữa;
  // lần trước phóng to 62→74.4 làm tràn hẳn ra ngoài đĩa, đè cả nút bóc lớp lẫn chú thích dưới —
  // "khoảng hở lộ màu xanh" thật ra là do filter glow cũ, đã bỏ riêng ở .dv-tj-band--du rồi, không
  // cần phóng to để che nữa). Lớp ngoài: medallion nhỏ ở tâm.
  const TR = props.lop === 1 ? 62 : 14
  return {
    TR,
    dotR: TR / 5,
    half: TR / 2,
    up: CY - TR / 2,
    dn: CY + TR / 2,
    halfLeft: `M${CX} ${CY - TR} A${TR} ${TR} 0 0 0 ${CX} ${CY + TR} Z`,
  }
})

// ĐỊNH VỊ: vòng NÉT ĐỨT DƯ/KHUYẾT ở tâm Thái Cực (khi có amLoai) — ĐÚNG kiểu sách giáo khoa,
// đồng bộ với AmDuongTaiji.vue: Thái Cực đen-trắng LUÔN cố định (mốc chuẩn); vòng nét đứt CÙNG
// bán kính TR, chỉ DỊCH TÂM sang trái/phải (không phình to/thu nhỏ) — dịch VỀ cực nào thì cực đó
// lồi ra (DƯ, cần tả), dịch RA XA cực nào thì cực đó hụt vào (KHUYẾT, cần bổ). Dương=90° · Âm=270°.
const DV_TAIJI_CFG: Record<string, { pole: 'duong' | 'am'; mode: 'du' | 'khuyet'; shift: number }> = {
  'duong-thinh': { pole: 'duong', mode: 'du', shift: 0.2 },
  'am-thinh': { pole: 'am', mode: 'du', shift: 0.2 },
  'am-hu': { pole: 'am', mode: 'khuyet', shift: 0.2 },
  'duong-hu': { pole: 'duong', mode: 'khuyet', shift: 0.2 },
  'thien-duong': { pole: 'duong', mode: 'du', shift: 0.11 },
  'thien-am': { pole: 'am', mode: 'du', shift: 0.11 },
}
function fullCircleD(cx: number, cy: number, r: number): string {
  return `M${N(cx + r)} ${N(cy)} A${r} ${r} 0 1 0 ${N(cx - r)} ${N(cy)} A${r} ${r} 0 1 0 ${N(cx + r)} ${N(cy)} Z`
}
function outsideCircleClip(cx: number, cy: number, r: number): string {
  return `M0 0 H420 V420 H0 Z ${fullCircleD(cx, cy, r)}`
}
const dvTaiji = computed(() => {
  const loai = props.dinhvi?.amLoai
  const c = loai ? DV_TAIJI_CFG[loai] : undefined
  if (!c) return null
  const TR = taiji.value.TR
  const poleDeg = c.pole === 'duong' ? 90 : 270
  const shiftDeg = c.mode === 'khuyet' ? poleDeg + 180 : poleDeg
  const ref = pt(TR * c.shift, shiftDeg)
  // 1 MÀU XANH duy nhất cho cả 2 cực (bỏ cặp đỏ/xanh theo Dương/Âm cũ) — đồng bộ trắng-xanh của cả
  // đồ hình; DƯ/KHUYẾT phân biệt bằng ĐẬM/NHẠT (xem .dv-tj-band--du/--khuyet), không phải màu sắc.
  const color = '#2d6e8e'
  // DƯ: lưỡi liềm của vòng nét đứt (đã dịch) lồi ra NGOÀI Thái Cực chuẩn (cố định tại CX,CY).
  // KHUYẾT: lưỡi liềm của Thái Cực chuẩn mà vòng nét đứt (đã dịch) KHÔNG còn phủ tới.
  const fillD = c.mode === 'du' ? fullCircleD(ref.x, ref.y, TR) : fullCircleD(CX, CY, TR)
  const clipD = c.mode === 'du' ? outsideCircleClip(CX, CY, TR) : outsideCircleClip(ref.x, ref.y, TR)
  return { refX: ref.x, refY: ref.y, TR, fillD, clipD, color, mode: c.mode }
})

// ── LỚP 1 (Âm Dương) = TRỤC SINH THÀNH: Thái Cực → Lưỡng Nghi → Tứ Tượng → Bát Quái (đồng tâm) ──
// Vẽ CHỒNG HÀO (1=dương LIỀN · 0=âm ĐỨT), căn giữa quanh bán kính centerR, vuông góc bán kính.
function yaoSymbol(yao: number[], centerR: number, deg: number, gap: number, len: number, yinGap: number) {
  const a = deg * D2R
  const tx = Math.cos(a)
  const ty = Math.sin(a)
  const n = yao.length
  const segs: { x1: string; y1: string; x2: string; y2: string }[] = []
  yao.forEach((bit, k) => {
    const c = pt(centerR + (k - (n - 1) / 2) * gap, deg) // hào dưới trong cùng, cả chồng căn giữa centerR
    if (bit === 1) {
      segs.push({ x1: N(c.x - tx * len), y1: N(c.y - ty * len), x2: N(c.x + tx * len), y2: N(c.y + ty * len) })
    } else {
      segs.push({ x1: N(c.x - tx * len), y1: N(c.y - ty * len), x2: N(c.x - tx * yinGap), y2: N(c.y - ty * yinGap) })
      segs.push({ x1: N(c.x + tx * yinGap), y1: N(c.y + ty * yinGap), x2: N(c.x + tx * len), y2: N(c.y + ty * len) })
    }
  })
  return segs
}
// Lưỡng Nghi (2): Dương (hào gốc DƯƠNG, nửa 337.5→157.5) · Âm (nửa còn lại) — khớp gốc của quẻ.
const luongNghi = [
  { ten: 'Dương', d: donut(30, 17, -22.5, 157.5), arc: arcPath(23.5, 67.5, 52), yang: true },
  { ten: 'Âm', d: donut(30, 17, 157.5, 337.5), arc: arcPath(23.5, 247.5, 52), yang: false },
]
// Tứ Tượng (4): 2 HÀO — mầm Tam Âm Tam Dương; mỗi tượng khớp đúng CẶP quẻ cùng 2 hào dưới.
const TU_TUONG = [
  { deg: 22.5, ten: 'Thái Dương', yao: [1, 1] },
  { deg: 112.5, ten: 'Thiếu Âm', yao: [1, 0] },
  { deg: 202.5, ten: 'Thái Âm', yao: [0, 0] },
  { deg: 292.5, ten: 'Thiếu Dương', yao: [0, 1] },
]
const tuTuong = TU_TUONG.map((t) => ({ ...t, segs: yaoSymbol(t.yao, 36, t.deg, 4, 6.5, 1.6), arc: arcPath(46, t.deg, 40) }))
// Bát Quái (8): 3 HÀO — "mã gốc"; .hanh = cầu nối sang Ngũ Hành (Ly=Hỏa · Khảm=Thủy · Chấn/Tốn=Mộc · Càn/Đoài=Kim · Cấn/Khôn=Thổ).
const BAT_QUAI: { deg: number; ten: string; yao: number[]; hanh: HanhKey }[] = [
  { deg: 0, ten: 'Càn', yao: [1, 1, 1], hanh: 'kim' },
  { deg: 45, ten: 'Đoài', yao: [1, 1, 0], hanh: 'kim' },
  { deg: 90, ten: 'Ly', yao: [1, 0, 1], hanh: 'hoa' },
  { deg: 135, ten: 'Chấn', yao: [1, 0, 0], hanh: 'moc' },
  { deg: 180, ten: 'Khôn', yao: [0, 0, 0], hanh: 'tho' },
  { deg: 225, ten: 'Cấn', yao: [0, 0, 1], hanh: 'tho' },
  { deg: 270, ten: 'Khảm', yao: [0, 1, 0], hanh: 'thuy' },
  { deg: 315, ten: 'Tốn', yao: [0, 1, 1], hanh: 'moc' },
]
const batQuai = BAT_QUAI.map((q) => ({ ...q, segs: yaoSymbol(q.yao, 56, q.deg, 4.5, 6.5, 1.8), arc: arcPath(67, q.deg, 24) }))
// ── GHI CHÚ QUẺ (text NGOÀI vòng): quẻ là cầu nối nhưng hiển thị dạng CHÚ THÍCH đổi theo lớp — gọn, không rối vòng ──
const QUAI_NOTE: Record<number, { title: string; text: string }> = {
  1: {
    title: 'Vô Cực → Thái Cực → Lưỡng Nghi → Tứ Tượng → Bát Quái (1→2→4→8)',
    text: 'Lưỡng Nghi: Âm · Dương  |  Tứ Tượng: Thái Dương · Thiếu Âm · Thái Âm · Thiếu Dương  |  Bát Quái: ☰ Càn · ☱ Đoài · ☲ Ly · ☳ Chấn · ☴ Tốn · ☵ Khảm · ☶ Cấn · ☷ Khôn',
  },
  2: { title: 'Quẻ → Ngũ Hành', text: '☲ Ly → Hỏa · ☵ Khảm → Thủy · ☳☴ Chấn·Tốn → Mộc · ☰☱ Càn·Đoài → Kim · ☶☷ Cấn·Khôn → Thổ' },
  3: { title: 'Quẻ → Tạng · Phủ', text: '☲ Hỏa → Tâm·Tiểu Trường (+ Tâm Bào) · ☵ Thủy → Thận·Bàng Quang · ☳☴ Mộc → Can·Đởm · ☰☱ Kim → Phế·Đại Trường · ☶☷ Thổ → Tỳ·Vị' },
  4: { title: 'Chủ khí (thứ tự trong năm): ① Quyết Âm ② Thiếu Âm ③ Thiếu Dương ④ Thái Âm ⑤ Dương Minh ⑥ Thái Dương', text: 'Theo mùa + ngũ hành TƯƠNG SINH: Phong(Mộc) → Quân Hỏa → Tướng Hỏa(Hỏa) → Thấp(Thổ) → Táo(Kim) → Hàn(Thủy) — 2 hỏa liền nhau. Quẻ: ☵→Thái Dương · ☰☱→Dương Minh · ☲→Thiếu Dương·Thiếu Âm · ☶☷→Thái Âm · ☳☴→Quyết Âm' },
  5: { title: 'Quẻ → Lục Kinh', text: '☵ Thủy → Thái Dương · ☰☱ Kim → Dương Minh · ☳☴ Mộc → Quyết Âm · ☶☷ Thổ → Thái Âm · ☲ Hỏa → Thiếu Âm / Thiếu Dương' },
}
const quaiNote = computed(() => QUAI_NOTE[Math.min(5, Math.max(1, props.lop))])

const shows = (n: number) => props.lop >= n
const isCurrent = (n: number) => props.lop === n
// TIÊU ĐIỂM: lớp ĐANG xem rõ nhất; lớp cũ (trong) MỜ DẦN theo khoảng cách; lớp chưa mở (ngoài) ẩn.
const FOCUS_OP = [1, 0.4, 0.22, 0.13, 0.08]
const layerOpacity = (n: number) => (n > props.lop ? 0 : (FOCUS_OP[props.lop - n] ?? 0.08))

// PHÓNG TO LỚP HIỆN TẠI: lớp đang xem lấp gần hết đĩa (chữ to, rõ); lớp cũ thu nhỏ + mờ vào tâm. Bóc lớp = phóng lớp mới.
const DISC = 200 // đĩa nền CỐ ĐỊNH
const FRAME = 197 // lớp hiện tại lấp SÁT vành (gần = đĩa) → không thừa diện tích
const EXTENT = [66, 104, 152, 178, 204] // bán kính NGOÀI THẬT của mỗi lớp; zoom = FRAME/EXTENT (lớp ngoài ~1, không co chữ)
// GIỮ 66 để lớp 1 (Thái Cực) đồng bộ đường kính với các lớp khác — vòng nét đứt DƯ/KHUYẾT dịch
// ra ngoài (TR+12.4) thì để LÒI ra ngoài đĩa/khung, KHÔNG co lại toàn bộ Thái Cực để vừa khung.
const zoom = computed(() => FRAME / EXTENT[Math.min(5, Math.max(1, props.lop)) - 1])

// ── BẤM 1 cung → CHỐT chọn (pick: giữ sáng) + BÁO panel (emit select). Rê chỉ xem trước. ──
function onKinh(s: HexaItem, i: number) {
  pick(s.hanh, s.nhom, i)
  emit('select', { type: 'kinh', key: KINH_SLUG[s.kinh] ?? s.kinh, label: `${s.kinh} ${s.kinhHan}` })
}
function onKhi(s: HexaItem, i: number) {
  pick(s.hanh, s.nhom, i)
  emit('select', { type: 'khi', key: s.khi, label: `Lục Khí ${s.khi} ${s.khiHan}` })
}
function onTang(s: PentaItem) {
  pick(s.hanh)
  emit('select', { type: 'tang', key: s.tang, label: `${s.tang} / ${s.phu}`, organs: [s.tang, s.phu] })
}
// Bấm 1 tạng HOẶC phủ RIÊNG → lọc đúng organ đó (11 tạng phủ đều bấm được)
function pickOrgan(name: string, hanh: HanhKey, type: 'tang' | 'phu') {
  pick(hanh)
  emit('select', { type, key: name, label: name, organs: [name] })
}
function onHanh(n: PentaItem) {
  pick(n.hanh)
  emit('select', { type: 'hanh', key: n.hanh, label: `Hành ${n.ten} ${n.han}`, organs: [n.tang, n.phu] })
}
// ── HOVER-INTENT: rê NHANH lướt qua (đi tới panel) KHÔNG ghim; DỪNG ~0,2s hoặc BẤM = GHIM (chốt + giữ sáng) ──
let dwellTimer: ReturnType<typeof setTimeout> | null = null
function cancelDwell() {
  if (dwellTimer !== null) {
    clearTimeout(dwellTimer)
    dwellTimer = null
  }
}
function scheduleDwell(fn: () => void) {
  cancelDwell()
  dwellTimer = setTimeout(() => {
    dwellTimer = null
    fn()
  }, 200)
}
function leaveWedge() {
  cancelDwell()
  leave()
}
function hoverHanh(n: PentaItem) {
  enter(n.hanh)
  scheduleDwell(() => onHanh(n))
}
function hoverOrgan(name: string, hanh: HanhKey, type: 'tang' | 'phu') {
  enter(hanh)
  scheduleDwell(() => pickOrgan(name, hanh, type))
}
function hoverKhi(s: HexaItem, i: number) {
  enter(s.hanh, s.nhom, i)
  scheduleDwell(() => onKhi(s, i))
}
function hoverKinh(s: HexaItem, i: number) {
  enter(s.hanh, s.nhom, i)
  scheduleDwell(() => onKinh(s, i))
}
// Đổi lớp → xoá "đang chọn" (mỗi lớp là ngữ cảnh mới)
watch(
  () => props.lop,
  () => {
    pickedH.value = null
    pickedG.value = null
    pickedHex.value = null
    leave()
  },
)

// ── AUTO (hero): tự "chạy đèn" Ngũ Tạng ở lớp 3 → mỗi tạng sáng cung sinh/khắc + thẻ tàng tượng, không cần rê.
// Chỉ chạy khi prop `auto` bật (ThuongHanView không truyền → hành vi cũ giữ nguyên). Tôn trọng prefers-reduced-motion.
const HANH_CYCLE: HanhKey[] = ['hoa', 'tho', 'kim', 'thuy', 'moc'] // thuận KĐH = tương sinh (Tâm→Tỳ→Phế→Thận→Can)
let autoTimer: ReturnType<typeof setInterval> | null = null
const prefersReduce =
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
onMounted(() => {
  if (!props.auto || props.lop !== 3 || prefersReduce) return
  let i = 0
  hovered.value = HANH_CYCLE[0] ?? null
  autoTimer = setInterval(() => {
    i = (i + 1) % HANH_CYCLE.length
    hovered.value = HANH_CYCLE[i] ?? null
  }, 1600)
})
onBeforeUnmount(() => {
  if (autoTimer) clearInterval(autoTimer)
})
</script>

<template>
  <div class="bcw">
    <svg class="bcw-svg" viewBox="0 0 420 420" role="img" aria-label="Đồ hình Ngũ Hành: tương sinh – tương khắc, bóc lớp Âm Dương → Tạng Phủ → Lục Khí → Lục Kinh">
      <defs>
        <radialGradient id="bcw-stone" cx="50%" cy="40%" r="64%">
          <stop offset="0%" style="stop-color: var(--brown-700)" /><stop offset="46%" style="stop-color: var(--brown-800)" />
          <stop offset="80%" style="stop-color: var(--brown-900)" /><stop offset="100%" style="stop-color: var(--brown-900)" />
        </radialGradient>
        <!-- Bản XANH-NAVY của đĩa/viền — CHỈ dùng khi có dinhvi (tab Định Vị Âm Dương), để đồng bộ
        với Thái Cực trắng-xanh; 2 chỗ dùng lại BienChungWheel khác (trang chủ, Thương Hàn) không
        truyền dinhvi nên vẫn giữ nguyên đĩa nâu gốc, không bị ảnh hưởng. -->
        <radialGradient id="bcw-stone-dv" cx="50%" cy="40%" r="64%">
          <stop offset="0%" stop-color="#2c4a5c" /><stop offset="46%" stop-color="#1e3a4a" />
          <stop offset="80%" stop-color="#132835" /><stop offset="100%" stop-color="#132835" />
        </radialGradient>
        <radialGradient id="bcw-glow" cx="50%" cy="46%" r="50%">
          <stop offset="0%" stop-color="rgba(250,240,218,.30)" /><stop offset="58%" stop-color="rgba(248,236,212,.07)" />
          <stop offset="100%" stop-color="rgba(248,236,212,0)" />
        </radialGradient>
        <radialGradient id="bcw-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(0,0,0,0)" /><stop offset="82%" stop-color="rgba(0,0,0,0)" />
          <stop offset="100%" stop-color="rgba(12,6,2,.5)" />
        </radialGradient>
        <linearGradient id="bcw-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style="stop-color: var(--brown-100)" /><stop offset="48%" style="stop-color: var(--brown-300)" /><stop offset="100%" style="stop-color: var(--brown-600)" />
        </linearGradient>
        <linearGradient id="bcw-rim-dv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#dceaf0" /><stop offset="48%" stop-color="#8fb4c4" /><stop offset="100%" stop-color="#3a6478" />
        </linearGradient>
        <!-- vệt sáng quét tiêu–trưởng (lớp Âm Dương) -->
        <radialGradient id="bcw-beam" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(255,247,224,.95)" /><stop offset="45%" stop-color="rgba(255,238,196,.4)" />
          <stop offset="100%" stop-color="rgba(255,238,196,0)" />
        </radialGradient>
        <!-- cung cho chữ bám vành khăn -->
        <path v-for="(n, i) in luongNghi" :id="'a-ln' + i" :key="'pln' + i" :d="n.arc" />
        <path v-for="(t, i) in tuTuong" :id="'a-tt' + i" :key="'ptt' + i" :d="t.arc" />
        <path v-for="(q, i) in batQuai" :id="'a-bq' + i" :key="'pbq' + i" :d="q.arc" />
        <path v-for="(s, i) in lucKinh" :id="'a-lk' + i" :key="'plk' + i" :d="s.arc" />
        <path v-for="(s, i) in lucKhi" :id="'a-lq' + i" :key="'plq' + i" :d="s.arc" />
        <path v-for="(s, i) in lucKhi" :id="'a-lqs' + i" :key="'plqs' + i" :d="s.arcSub" />
        <path v-for="(b, i) in organBtns" :id="'a-ob' + i" :key="'pob' + i" :d="b.arc" />
      </defs>

      <!-- Đĩa nền CỐ ĐỊNH — bản navy khi đang ở tab Định Vị Âm Dương (dvActive), giữ nâu gốc nơi khác -->
      <circle :cx="CX" :cy="CY" :r="DISC" :fill="dvActive ? 'url(#bcw-stone-dv)' : 'url(#bcw-stone)'" />
      <circle :cx="CX" :cy="CY" :r="DISC" fill="url(#bcw-shadow)" />
      <circle :cx="CX" :cy="CY" :r="DISC * 0.8" fill="url(#bcw-glow)" />

      <!-- ===== PHÓNG TO LỚP HIỆN TẠI — mọi vòng bên trong bị scale theo zoom (lớp hiện tại lấp đĩa) ===== -->
      <g class="zoom" :style="{ transform: `scale(${zoom})` }">

      <!-- Lớp 1 (Âm Dương) chỉ còn ĐỒ HÌNH THÁI CỰC (to) ở tâm — quẻ/sinh thành xem GHI CHÚ text dưới vòng -->

      <!-- ===== Các tầng (TĨNH — đọc được) ===== -->
      <g class="wheel-turn">

      <!-- ===== Lục Kinh (lớp 5) ===== -->
      <g class="ring" :class="{ shown: shows(5), current: isCurrent(5) }" :style="{ opacity: layerOpacity(5) }">
        <circle :cx="CX" :cy="CY" :r="R.lkinhOut" fill="none" class="rim" />
        <g v-for="(s, i) in lucKinh" :key="'lk' + i" class="seg" :class="{ dim: dimHex(i, s.hanh), hot: hotHex(i, s.hanh), partner: isPartner(i), 'dv-on': dvActive && dvLitKinh(s.kinh), 'dv-dim': dvActive && !dvLitKinh(s.kinh) }" @mouseenter="hoverKinh(s, i)" @mouseleave="leaveWedge()" @click="onKinh(s, i)">
          <path :d="s.d" class="wedge hoverable" :style="{ fill: s.nhom === 'duong' ? DUONG : AM }" />
          <text class="t-vi t-lk"><textPath :href="'#a-lk' + i" startOffset="50%">{{ s.kinh }}</textPath></text>
        </g>
      </g>

      <!-- ===== Lục Khí (lớp 4) ===== -->
      <g class="ring" :class="{ shown: shows(4), current: isCurrent(4) }" :style="{ opacity: layerOpacity(4) }">
        <circle :cx="CX" :cy="CY" :r="R.lkhiOut" fill="none" class="rim" />
        <g v-for="(s, i) in lucKhi" :key="'lq' + i" class="seg" :class="{ dim: dimHex(i, s.hanh), hot: hotHex(i, s.hanh), partner: isPartner(i), 'dv-on': dvActive && dvLitKhi(s.khi), 'dv-dim': dvActive && !dvLitKhi(s.khi) }" @mouseenter="hoverKhi(s, i)" @mouseleave="leaveWedge()" @click="onKhi(s, i)">
          <path :d="s.d" class="wedge hoverable" :style="{ fill: HANH[s.hanh].fill }" />
          <text class="t-vi t-khi" :style="{ fill: HANH[s.hanh].bright }"><textPath :href="'#a-lq' + i" startOffset="50%">{{ s.khi }}</textPath></text>
          <text class="t-han t-sm" :style="{ fill: HANH[s.hanh].bright }"><textPath :href="'#a-lqs' + i" startOffset="50%">{{ s.khiHan }} · {{ s.mua }}</textPath></text>
        </g>
        <!-- Badge THỨ TỰ CHỦ KHÍ (1→6 trong năm) — chỉ ở lớp Lục Khí -->
        <g v-show="isCurrent(4)" class="khi-badges">
          <g v-for="(b, i) in khiBadges" :key="'kb' + i">
            <circle :cx="b.x" :cy="b.y" r="6.5" class="kb-bg" />
            <text :x="b.x" :y="b.y" class="kb-num">{{ b.order }}</text>
          </g>
        </g>
      </g>

      <!-- ===== Tạng Phủ (lớp 3) — mỗi organ = 1 NÚT (băng bấm) rõ ràng; Hỏa: Tâm ngoài to, Tiểu Trường·Tam Tiêu ngang hàng trong ===== -->
      <g class="ring" :class="{ shown: shows(3), current: isCurrent(3) }" :style="{ opacity: layerOpacity(3) }">
        <circle :cx="CX" :cy="CY" :r="R.tpOut" fill="none" class="rim" />
        <g v-for="(b, i) in organBtns" :key="'ob' + i" class="seg organ-btn" :class="{ dim: dimmed(b.hanh), hot: hot(b.hanh), affected: affected(b.hanh), big: b.big, sel: activeTang === b.key, 'dv-on': dvActive && dvLitTang(b.name), 'dv-dim': dvActive && !dvLitTang(b.name) }" @mouseenter="hoverOrgan(b.name, b.hanh, b.type)" @mouseleave="leaveWedge()" @click="pickOrgan(b.name, b.hanh, b.type)">
          <path :d="b.d" class="ob-bg hoverable" :style="{ fill: HANH[b.hanh].fill }" />
          <text class="t-vi" :class="b.big ? 't-org-lg' : 't-org-sm'"><textPath :href="'#a-ob' + i" startOffset="50%">{{ b.name }}</textPath></text>
        </g>
      </g>

      <!-- ===== Thái Cực (Âm Dương) — lớp 1 to, lớp ≥2 thu về medallion giữa ===== -->
      <g class="taiji" :class="{ 'taiji--static': dvTaiji }">
        <circle :cx="CX" :cy="CY" :r="taiji.TR" :fill="yang" stroke="rgba(247,239,222,.6)" stroke-width="1" class="tj-r" />
        <path :d="taiji.halfLeft" :fill="yin" />
        <circle :cx="CX" :cy="taiji.up" :r="taiji.half" :fill="yin" class="tj-r" />
        <circle :cx="CX" :cy="taiji.dn" :r="taiji.half" :fill="yang" class="tj-r" />
        <circle :cx="CX" :cy="taiji.up" :r="taiji.dotR" :fill="yang" class="tj-r" />
        <circle :cx="CX" :cy="taiji.dn" :r="taiji.dotR" :fill="yin" class="tj-r" />

        <!-- ĐỊNH VỊ: lưỡi liềm DƯ (lồi ra, cần tả) / KHUYẾT (hụt vào, cần bổ) — xem dvTaiji -->
        <template v-if="dvTaiji">
          <clipPath id="dv-tj-clip"><path fill-rule="evenodd" :d="dvTaiji.clipD" /></clipPath>
          <path :d="dvTaiji.fillD" :fill="dvTaiji.color" class="dv-tj-band" :class="'dv-tj-band--' + dvTaiji.mode" clip-path="url(#dv-tj-clip)" />
          <circle :cx="dvTaiji.refX" :cy="dvTaiji.refY" :r="dvTaiji.TR" fill="none" class="dv-tj-ring" />
        </template>
      </g>

      <!-- ===== Ngũ Hành: 5 VÒNG TRÒN ở đỉnh ngũ giác (lớp 2) — chữ VIỆT lớn, Hán nhỏ ===== -->
      <g class="nodes" :class="{ shown: shows(2), current: isCurrent(2) }" :style="{ opacity: isCurrent(3) && relMode ? 0.6 : layerOpacity(2) }">
        <g v-for="(n, i) in nodes" :key="'nd' + i" class="seg" :class="{ dim: nodeDim(n.hanh), hot: hot(n.hanh), affected: affected(n.hanh), 'rel-dim': relMode && !hot(n.hanh), 'dv-on': dvActive && dvLitHanh(n.hanh), 'dv-dim': dvActive && !dvLitHanh(n.hanh) }" @mouseenter="hoverHanh(n)" @mouseleave="leaveWedge()" @click="onHanh(n)">
          <circle :cx="n.x" :cy="n.y" :r="NODE_R" :fill="HANH[n.hanh].node" class="node-c hoverable" />
          <text class="t-node-vi" :x="n.x" :y="n.y - 1.5">{{ n.ten }}</text>
          <text class="t-node-han" :x="n.x" :y="n.y + 8">{{ n.han }}</text>
        </g>
      </g>

      <!-- ===== Tương Sinh (XANH) + Tương Khắc (ĐỎ) — chỉ từ lớp Ngũ Hành, GIỮ NGUYÊN, KHÔNG chữ ===== -->
      <g class="sinh" :class="{ on: shows(2) }" :style="{ opacity: isCurrent(3) && relMode ? 0.96 : layerOpacity(2) }">
        <g v-for="(s, i) in sinh" :key="'si' + i" :class="{ faded: relMode && !arrowActive(s.from, s.to) }"><path :d="s.d" /><polygon :points="s.head" /></g>
      </g>
      <g class="khac" :class="{ on: shows(2) }" :style="{ opacity: isCurrent(3) && relMode ? 0.96 : layerOpacity(2) }">
        <g v-for="(k, i) in khac" :key="'kh' + i" :class="{ faded: relMode && !arrowActive(k.from, k.to) }"><path :d="k.d" /><polygon :points="k.head" /></g>
      </g>

      <!-- Trục TRUNG KIẾN (biểu-lý): rê 1 kinh → nối kinh ↔ kinh ĐỐI xuyên tâm (Thái Dương ↔ Thiếu Âm…) -->
      <line v-if="bieuLyAxis" class="bieuly-axis" :x1="bieuLyAxis.x1" :y1="bieuLyAxis.y1" :x2="bieuLyAxis.x2" :y2="bieuLyAxis.y2" />

      <!-- Mũi tên ẢNH HƯỞNG: Thái Dương → Phế (Kim) — Phủ đích tác động tạng khác -->
      <g v-if="affectArrow" class="affect-arrow">
        <path :d="affectArrow.d" /><polygon :points="affectArrow.head" />
      </g>

      </g>
      </g><!-- /zoom: hết vùng phóng -->

      <!-- vành ngoài CỐ ĐỊNH -->
      <circle :cx="CX" :cy="CY" :r="DISC - 1" fill="none" :stroke="dvActive ? 'url(#bcw-rim-dv)' : 'url(#bcw-rim)'" stroke-width="2.4" stroke-opacity=".92" />
    </svg>

    <!-- LỚP 3: bảng đọc TÀNG TƯỢNG · BIỂU-LÝ · QUẺ khi rê 1 tạng/phủ -->
    <div v-if="hoverInfo" class="bcw-hoverinfo" :style="{ borderColor: hoverInfo.color }">
      <span class="hi-main" :style="{ color: hoverInfo.color }">{{ hoverInfo.tang }} {{ hoverInfo.tangHan }}</span>
      <span class="hi-tag">Hành {{ hoverInfo.hanhTen }} {{ hoverInfo.hanhHan }}</span>
      <span class="hi-func">{{ hoverInfo.func }} · tàng <b>{{ hoverInfo.than }}</b></span>
      <span class="hi-item">Biểu–lý: <b>{{ hoverInfo.phu }}</b></span>
      <span v-if="hoverInfo.extra" class="hi-item hi-extra">＋ <b>{{ hoverInfo.extra }}</b></span>
      <span class="hi-item">Quẻ: <b>{{ hoverInfo.quai }}</b></span>
    </div>

    <!-- LỚP 4: bảng đọc KHÍ — Kinh · Mùa · Tiêu-Bản-Trung · Tòng hóa · Tạng phủ · Quẻ khi rê 1 khí -->
    <div v-if="khiInfo" class="bcw-hoverinfo" :style="{ borderColor: khiInfo.color }">
      <span class="hi-main" :style="{ color: khiInfo.color }">{{ khiInfo.khi }} {{ khiInfo.khiHan }}</span>
      <span class="hi-tag">{{ khiInfo.kinh }} {{ khiInfo.kinhHan }} · {{ khiInfo.mua }}</span>
      <span class="hi-item">Bản: <b>{{ khiInfo.ban }}</b></span>
      <span class="hi-item">Tiêu: <b>{{ khiInfo.tieu }}</b></span>
      <span class="hi-item">Trung khí: <b>{{ khiInfo.trung }}</b></span>
      <span class="hi-func">{{ khiInfo.tong }}</span>
      <span class="hi-item">Tạng phủ: <b>{{ khiInfo.tangPhu }}</b></span>
      <span class="hi-item">Quẻ: <b>{{ khiInfo.quai }}</b> · Chủ khí <b>{{ khiInfo.chuOrder }}/6</b></span>
    </div>

    <!-- GHI CHÚ QUẺ — text ngoài vòng, đổi theo lớp (quẻ là cầu nối; để gọn không rối vòng) -->
    <div v-show="!hoverInfo && !khiInfo" class="bcw-quainote">
      <span class="qn-title">{{ quaiNote.title }}</span>
      <span class="qn-text">{{ quaiNote.text }}</span>
    </div>

    <div v-if="shows(2)" class="bcw-legend">
      <span class="lg"><i class="lg-sinh"></i>Tương sinh 相生 · nuôi dưỡng</span>
      <span class="lg"><i class="lg-khac"></i>Tương khắc 相克 · chế ước</span>
    </div>
  </div>
</template>

<style scoped>
/* Giới hạn theo CHIỀU CAO viewport để vòng (vuông) không tràn màn khi cột giữa rộng */
.bcw { width: 100%; max-width: min(100%, 58vh); margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.bcw-svg { width: 100%; height: auto; display: block; overflow: visible; filter: drop-shadow(0 8px 22px rgba(0, 0, 0, 0.3)); }

.bcw-svg text {
  font-family: var(--font-family, 'Inter', sans-serif);
  text-anchor: middle; dominant-baseline: middle; paint-order: stroke; stroke-linejoin: round; user-select: none;
}
/* Việt = CHÍNH (lớn, đậm, sáng) · Hán = phụ (nhỏ, mờ) */
.t-vi { font-weight: 800; fill: #f6ecd8; stroke: rgba(28, 16, 6, 0.75); stroke-width: 1.1px; }
.t-han { font-weight: 500; stroke: rgba(20, 11, 4, 0.5); stroke-width: 0.6px; }
.t-sm { font-size: 8.5px; font-weight: 600; fill: #e8d9bd; opacity: 0.66; }
.t-lk { font-size: 15px; }
.t-khi { font-size: 13px; }
/* Tạng Phủ: cái VÀO TRƯỚC to (vòng ngoài), cái sau nhỏ (vòng trong) */
.t-org-lg { font-size: 12.5px; font-weight: 800; fill: #f6ecd8; stroke: rgba(28, 16, 6, 0.75); stroke-width: 1.1px; transition: font-size 0.2s ease; }
.t-org-sm { font-size: 8.5px; font-weight: 600; fill: #e8d9bd; opacity: 0.66; stroke: rgba(28, 16, 6, 0.6); stroke-width: 0.7px; transition: font-size 0.2s ease; }
/* nhãn trong vòng tròn hành: VIỆT lớn giữa, HÁN nhỏ mờ dưới */
.t-node-vi { font-size: 10px; font-weight: 800; fill: #fff; stroke: rgba(20, 11, 4, 0.5); stroke-width: 0.7px; }
.t-node-han { font-size: 6px; font-weight: 500; fill: #fff; opacity: 0.62; stroke: rgba(20, 11, 4, 0.4); stroke-width: 0.4px; }

.wedge { stroke: rgba(247, 242, 233, 0.26); stroke-width: 0.8; }
.rim { stroke: rgba(248, 240, 224, 0.28); stroke-width: 1; }

/* Lớp ẩn → thu nhỏ mờ; hiện → bung; đang chọn → nổi bật */
.ring, .nodes {
  transform-box: view-box; transform-origin: 210px 210px;
  opacity: 0; transform: scale(0.92); pointer-events: none;
  transition: opacity 0.45s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
.ring.shown { opacity: 0.74; transform: scale(1); }
.ring.current { opacity: 1; }
.nodes.shown { opacity: 1; transform: scale(1); }
.ring.current .wedge { stroke: rgba(251, 242, 221, 0.7); stroke-width: 1.1; filter: drop-shadow(0 0 5px rgba(250, 233, 200, 0.35)); }
.ring.current .t-vi { fill: #fff8ea; }
.node-c { stroke: rgba(251, 242, 221, 0.6); stroke-width: 1.6; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4)); }
.nodes.current .node-c { stroke: rgba(255, 248, 226, 0.9); filter: drop-shadow(0 0 6px rgba(250, 233, 200, 0.5)); }

/* Gom TƯƠNG ỨNG theo hành: rê 1 mục → cùng hành SÁNG, khác hành MỜ */
.seg { transition: opacity 0.2s ease, filter 0.2s ease; }
.seg.dim { opacity: 0.2; }
.seg.hot .wedge { stroke: rgba(251, 242, 221, 0.9); stroke-width: 1.4; filter: drop-shadow(0 0 6px rgba(250, 233, 200, 0.55)); }
.seg.hot .node-c { stroke: rgba(255, 248, 226, 0.95); stroke-width: 2.4; filter: drop-shadow(0 0 9px rgba(250, 233, 200, 0.65)); }
.seg.hot .t-vi { fill: #fff8ea; }
/* ĐỊNH VỊ bệnh nhân (đọc-chỉ): ô CÓ = sáng vàng nổi; ô KHÔNG = mờ hẳn. Đè lên trạng thái bóc lớp. */
.seg.dv-dim { opacity: 0.24; }
.seg.dv-on .wedge, .seg.dv-on .ob-bg { stroke: #ffd98a; stroke-width: 1.8; filter: drop-shadow(0 0 7px rgba(255, 210, 120, 0.78)); }
.seg.dv-on .node-c { stroke: #ffd98a; stroke-width: 2.6; filter: drop-shadow(0 0 9px rgba(255, 210, 120, 0.82)); }
.seg.dv-on .t-vi { fill: #fff8ea; }
/* Lưỡi liềm DƯ/KHUYẾT + vòng nét đứt ở tâm Thái Cực (định vị Âm-Dương) — đồng bộ AmDuongTaiji.vue:
   DƯ tô ĐẬM (đang thừa) · KHUYẾT tô NHẠT (đang thiếu) — ngược hẳn nhau để phân biệt tả/bổ. */
.dv-tj-band { stroke: rgba(251, 242, 221, 0.85); stroke-width: 1.1; }
/* KHÔNG dùng filter:drop-shadow (blur) ở đây — lớp 1 bị .zoom phóng to ~3 lần (197/66), 1 quầng
   mờ 6px trước khi zoom biến thành quầng ~18px SAU zoom, nhìn như 1 vòng tròn lạ tách hẳn ra
   khỏi Thái Cực. Chỉ tô màu ĐẶC (không glow) là đủ rõ, tránh bị khuếch đại biến dạng. */
.dv-tj-band--du { opacity: 0.82; }
.dv-tj-band--khuyet { opacity: 0.32; stroke-dasharray: 4 3; }
.dv-tj-ring { stroke: rgba(251, 242, 221, 0.75); stroke-width: 1.3; stroke-dasharray: 3 3; }
/* Kinh ĐỐI biểu-lý (Trung kiến): không mờ + viền VÀNG nổi để thấy quan hệ cặp */
.seg.partner { opacity: 1; }
.seg.partner .wedge { stroke: #f2d79a; stroke-width: 1.6; filter: drop-shadow(0 0 6px rgba(242, 215, 154, 0.6)); }
.seg.partner .t-vi { fill: #ffe9b8; }
/* trục Trung kiến xuyên tâm (nét đứt vàng) */
.bieuly-axis { stroke: #f2d79a; stroke-width: 1.8; stroke-dasharray: 5 4; opacity: 0.92; stroke-linecap: round; filter: drop-shadow(0 0 3px rgba(242, 215, 154, 0.55)); pointer-events: none; }
/* Tạng bị ẢNH HƯỞNG (Phủ đích tác động sang): viền LAM nét đứt (khác nhóm chính + khác biểu-lý vàng) */
.seg.affected { opacity: 1; }
.seg.affected .node-c, .seg.affected .wedge { stroke: #7fc7d8; stroke-width: 1.6; stroke-dasharray: 3 2.5; filter: drop-shadow(0 0 5px rgba(127, 199, 216, 0.55)); }
.seg.affected .t-vi { fill: #d6f0f6; }
.affect-arrow { pointer-events: none; }
.affect-arrow path { fill: none; stroke: #7fc7d8; stroke-width: 1.7; stroke-dasharray: 4 3; stroke-linecap: round; filter: drop-shadow(0 0 2px rgba(127, 199, 216, 0.5)); }
.affect-arrow polygon { fill: #7fc7d8; }
/* chỉ bắt chuột ở lớp ĐANG HIỆN (tránh vùng vô hình vẫn ăn hover) */
.hoverable { pointer-events: none; }
.ring.shown .hoverable, .nodes.shown .hoverable { pointer-events: all; cursor: pointer; }
/* MỖI tạng/phủ = 1 NÚT (băng bấm) có VIỀN — rê sáng lên, hết "bấm dò" */
.organ-btn .ob-bg { stroke: rgba(251, 242, 221, 0.3); stroke-width: 0.9; transition: fill 0.15s ease, stroke 0.15s ease, filter 0.15s ease; }
.organ-btn.big .ob-bg { stroke: rgba(251, 242, 221, 0.42); stroke-width: 1.1; }
.ring.shown .organ-btn .ob-bg { pointer-events: all; cursor: pointer; }
.ring.shown .organ-btn:hover .ob-bg { stroke: #fff8ea; stroke-width: 1.9; filter: drop-shadow(0 0 6px rgba(250, 233, 200, 0.65)); }
.ring.shown .organ-btn:hover .t-vi { fill: #fff8ea; }
.seg.hot .ob-bg { stroke: rgba(251, 242, 221, 0.9); stroke-width: 1.5; filter: drop-shadow(0 0 5px rgba(250, 233, 200, 0.5)); }
.seg.affected .ob-bg { stroke: #7fc7d8; stroke-width: 1.5; stroke-dasharray: 3 2.5; }
/* Tạng phủ đang lọc (đồng bộ từ panel) */
.organ-btn.sel .ob-bg { stroke: #f6c98a; stroke-width: 2; filter: drop-shadow(0 0 6px rgba(246, 201, 138, 0.75)); }
.organ-btn.sel .t-vi { fill: #fff8ea; }
/* Badge THỨ TỰ CHỦ KHÍ (1→6) trên vòng Lục Khí */
.khi-badges { pointer-events: none; }
.kb-bg { fill: rgba(28, 18, 8, 0.75); stroke: rgba(251, 242, 221, 0.55); stroke-width: 0.9; }
.kb-num { font-size: 8px; font-weight: 800; fill: #fbf2dd; text-anchor: middle; dominant-baseline: central; }

/* Tương sinh XANH — sáng ở lớp Ngũ Hành, MỜ NHẸ khi đã bóc sang lớp ngoài (vẫn thấy). Lớp 1 (Âm Dương) ẨN. */
.sinh, .khac { opacity: 0; pointer-events: none; transition: opacity 0.4s ease; }
.sinh.on, .khac.on { opacity: 0.96; }
.sinh.dim, .khac.dim { opacity: 0.38; }
.sinh path { fill: none; stroke: #7cbf74; stroke-width: 2.4; stroke-linecap: round; filter: drop-shadow(0 0 2px rgba(124, 191, 116, 0.55)); }
.sinh polygon { fill: #7cbf74; }
.khac path { fill: none; stroke: #dd6a4c; stroke-width: 1.7; stroke-linecap: round; filter: drop-shadow(0 0 2px rgba(221, 106, 76, 0.55)); }
.khac polygon { fill: #dd6a4c; }
/* Nêu quan hệ 1 hành (lớp 2) — CHỈ bằng độ nổi (không chữ):
   hành đang chọn nổi NHẤT · 4 hành liên quan nổi VỪA (cùng mức) · mũi tên liên quan sáng, còn lại mờ */
.sinh g.faded, .khac g.faded { opacity: 0.1; transition: opacity 0.25s ease; }
.seg.rel-dim { opacity: 0.55; transition: opacity 0.2s ease; }

/* Thái Cực xoay chậm + co/giãn mượt theo lớp — NGƯNG xoay khi đang đọc ĐỊNH VỊ (dvTaiji có giá
   trị): Dương/Âm phải đứng yên đúng vị trí phải/trái thì vòng nét đứt DƯ/KHUYẾT mới có nghĩa. */
.taiji { transform-box: view-box; transform-origin: 210px 210px; animation: bcw-spin 48s linear infinite; }
.taiji--static { animation: none; }
/* LỚP 1 — trục sinh thành (Thái Cực → Lưỡng Nghi → Tứ Tượng → Bát Quái), chỉ lớp Âm Dương.
   Rời lớp 1: THU VỀ TÂM + mờ dần (lớp 2 trồi lên chỗ đó) → chuyển lớp mượt, không "đè xoá". */
.sinhthanh { opacity: 0; transition: opacity 0.5s ease; pointer-events: none; }
.sinhthanh.on { opacity: 1; }
.sinhthanh.bg { opacity: 0.38; } /* lớp ngoài: lõi Âm Dương LÙI làm nền — vẫn quét, vẫn theo quy luật */
.sinhthanh line { stroke-width: 1.6; stroke-linecap: round; }
.st-tt line { stroke: #e6d2a6; }
.st-name { font-size: 6.5px; font-weight: 800; fill: #f0e2c4; stroke: rgba(20, 11, 4, 0.55); stroke-width: 0.6px; paint-order: stroke; letter-spacing: 0.1px; }
.ln-wedge { stroke: rgba(247, 242, 233, 0.28); stroke-width: 0.8; fill: rgba(140, 164, 182, 0.2); }
.ln-wedge.yang { fill: rgba(214, 178, 108, 0.3); }
/* BÓC TÁCH: nở LẦN LƯỢT từ tâm ra theo quy luật 1→2→4→8 (Thái Cực có sẵn → Lưỡng Nghi → Tứ Tượng → Bát Quái) */
.st-ring { transform-box: view-box; transform-origin: 210px 210px; }
.sinhthanh.cur .st-ln { animation: st-grow 0.55s 0.15s both; }
.sinhthanh.cur .st-tt { animation: st-grow 0.55s 0.65s both; }
.sinhthanh.cur .st-bq { animation: st-grow 0.6s 1.15s both; }
@keyframes st-grow { from { opacity: 0; transform: scale(0.45); } to { opacity: 1; transform: scale(1); } }
/* VỆT SÁNG quét THUẬN chiều (Dương→Âm→Dương) — chữ ĐỨNG YÊN, không chóng mặt */
.st-beam { transform-box: view-box; transform-origin: 210px 210px; opacity: 0; transition: opacity 0.4s ease; pointer-events: none; mix-blend-mode: screen; }
.st-beam.on { opacity: 1; animation: st-sweep 9s linear infinite; }
@keyframes st-sweep { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .st-beam.on { animation: none; opacity: 0; } }
.tj-r { transition: r 0.5s cubic-bezier(0.22, 1, 0.36, 1), cy 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
/* PHÓNG TO LỚP HIỆN TẠI — nhóm nội dung scale MƯỢT khi bóc lớp */
.zoom { transform-box: view-box; transform-origin: 210px 210px; transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
@keyframes bcw-spin { to { transform: rotate(360deg); } }

/* LỚP 3 — bảng đọc tàng tượng khi rê tạng */
.bcw-hoverinfo { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: center; gap: 4px 12px; max-width: 94%; text-align: center; padding: 8px 14px; border-radius: 10px; background: rgba(120, 92, 48, 0.14); border: 1.5px solid rgba(180, 150, 96, 0.5); }
.bcw-hoverinfo .hi-main { font-size: 15px; font-weight: 800; }
.bcw-hoverinfo .hi-tag { font-size: 12px; font-weight: 700; color: var(--text, #3a2c1a); }
.bcw-hoverinfo .hi-func { font-size: 12.5px; font-weight: 600; color: var(--text-soft, #6a563a); font-style: italic; }
.bcw-hoverinfo .hi-item { font-size: 12.5px; font-weight: 600; color: var(--text-soft, #6a563a); }
.bcw-hoverinfo .hi-item b { color: var(--text, #3a2c1a); font-weight: 800; }
.bcw-hoverinfo .hi-extra b { color: #b23a29; }

/* GHI CHÚ QUẺ — text ngoài vòng, đổi theo lớp */
.bcw-quainote { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: center; gap: 4px 10px; max-width: 92%; text-align: center; padding: 7px 12px; border-radius: 10px; background: rgba(120, 92, 48, 0.12); border: 1px solid rgba(180, 150, 96, 0.25); }
.bcw-quainote .qn-title { font-size: 12px; font-weight: 800; color: var(--text, #3a2c1a); }
.bcw-quainote .qn-text { font-size: 12px; font-weight: 600; color: var(--text-soft, #6a563a); line-height: 1.5; }

/* Chú thích 2 vòng quan hệ */
.bcw-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 20px; font-size: 12.5px; font-weight: 600; color: var(--text, #3a2c1a); }
.bcw-legend .lg { display: inline-flex; align-items: center; gap: 7px; }
.bcw-legend .lg i { width: 18px; height: 3px; border-radius: 2px; }
.bcw-legend .lg-sinh { background: #7cbf74; box-shadow: 0 0 4px rgba(124, 191, 116, 0.6); }
.bcw-legend .lg-khac { background: #dd6a4c; box-shadow: 0 0 4px rgba(221, 106, 76, 0.6); }

@media (prefers-reduced-motion: reduce) { .ring, .nodes, .tj-r, .zoom, .taiji { transition: none; animation: none; } }
</style>
