<script setup lang="ts">
/**
 * Bàn Xoay Biện Chứng — bàn xoay NHỎ (Bệnh) lồng trong bàn xoay LỚN (khung Lục Kinh·Tạng Phủ·Lục Khí).
 * Mỗi Nhóm khoa = 1 bàn xoay. Vòng lớn (VongLucKinh) làm navigator → lọc ra Thể bệnh Đông Y + Bệnh Tây Y
 * (Tây Y là con của thể bệnh Đông Y, nối qua BÀI THUỐC chung). Bấm 1 bệnh → vòng nhỏ hướng tâm (BanXoayHub).
 */
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api'
import VongLucKinh from '@/components/VongLucKinh.vue'
import BanXoayHub, { type HubGroup } from '@/components/BanXoayHub.vue'
import BanXoayBienChung, { type Schema, type WheelLink } from '@/components/BanXoayBienChung.vue'
import FilterBar, { type FbGroup } from '@/components/FilterBar.vue'
import { TON_THUONG_AXES, tonThuongNhom, shortTonThuongLabel } from '@/constants/tonThuong'

interface DiseaseRec { ten: string | null; nguyen_tac: string | null; bai_thuoc: string[] }
interface ChiMuc {
  tong: number
  records: Record<number, DiseaseRec>
  lucKinh: Record<string, number[]>
  phan?: Record<string, number[]>
  tamTieu?: Record<string, number[]>
  lucKhi: Record<string, number[]>
  tangPhu: Record<string, number[]>
}
interface TayY { id: number; ten: string; nhom_id: number; phap_tri_ids: number[]; bai_thuoc: string[]; trieu_chung: string[] }
interface BienChung { nhomKhoa: { id: number; ten: string; so: number }[]; tayY: TayY[]; ptTrieuChung: Record<number, string[]>; ptTonThuong?: Record<number, string[]> }

const KINH_NAME: Record<string, string> = {
  'thai-duong': 'Thái Dương', 'duong-minh': 'Dương Minh', 'thieu-duong': 'Thiếu Dương',
  'thai-am': 'Thái Âm', 'thieu-am': 'Thiếu Âm', 'quyet-am': 'Quyết Âm',
}
// Màu nhóm theo NGŨ HÀNH — KHỚP với bàn xoay (GLOW) để cùng 1 nhóm = cùng 1 màu ở mọi nơi
// (thể bệnh Mộc lục · pháp trị Hỏa đất-nung · triệu chứng Kim champagne · bài thuốc Thổ vàng).
const C = { te: '#4f9152', phap: '#b45333', tc: '#a58c58', bai: '#c2952f' }
const SLUG_BY_NAME: Record<string, string> = Object.fromEntries(Object.entries(KINH_NAME).map(([s, n]) => [n, s]))

const chiMuc = ref<ChiMuc | null>(null)
const bienChung = ref<BienChung | null>(null)
const loading = ref(true)
const nhom = ref<number | null>(null)
const selectedKinh = ref<string | null>(null)
const subTang = ref<string | null>(null)
const subKhi = ref<string | null>(null)
const focus = ref<{ type: 'tay-y' | 'dong-y'; key: string } | null>(null)
// Bộ lọc CHI TIẾT cho nhánh Đông Y (giống "bộ lọc Pháp trị"): chọn từng giá trị Tổn thương-Tác nhân
// (3 trục) + Tạng phủ để thu hẹp tập thể bệnh TRƯỚC khi mở 1 trục thành bàn xoay.
const dyTon = ref<string[]>([]) // tên tổn thương ĐẦY ĐỦ đã chọn (vd "Thái Dương Kinh Chứng")
const dyTang = ref<string[]>([]) // tạng phủ đã chọn

const inter = (a: number[], set: Set<number>) => a.filter((x) => set.has(x))
// Giao 2 tập id (null = "không lọc"): dùng gộp bộ lọc Khung ∩ bộ lọc Đông Y chi tiết.
function andSet(a: Set<number> | null, b: Set<number> | null): Set<number> | null {
  if (!a) return b
  if (!b) return a
  const out = new Set<number>()
  for (const x of a) if (b.has(x)) out.add(x)
  return out
}

// ── Chỉ mục phụ ──
const tayById = computed(() => { const m = new Map<number, TayY>(); for (const t of bienChung.value?.tayY ?? []) m.set(t.id, t); return m })
const recByName = computed(() => {
  const m = new Map<string, number[]>(); const cm = chiMuc.value
  if (cm) for (const [id, r] of Object.entries(cm.records)) { const ten = r.ten ?? '(không tên)'; if (!m.has(ten)) m.set(ten, []); m.get(ten)!.push(Number(id)) }
  return m
})
const ptToTayY = computed(() => {
  const m = new Map<number, TayY[]>()
  for (const t of bienChung.value?.tayY ?? []) for (const id of t.phap_tri_ids) { if (!m.has(id)) m.set(id, []); m.get(id)!.push(t) }
  return m
})
const lucKinhCounts = computed<Record<string, number>>(() => {
  const cm = chiMuc.value; if (!cm) return {}
  const out: Record<string, number> = {}
  for (const [s, ids] of Object.entries(cm.lucKinh)) out[s] = ids.length
  return out
})

// ── Bộ lọc khung — giao tập theo BẤT KỲ trục đang bật (Kinh / Tạng Phủ / Lục Khí) ──
const frameworkSet = computed<Set<number> | null>(() => {
  const cm = chiMuc.value; if (!cm) return null
  if (!selectedKinh.value && !subTang.value && !subKhi.value) return null
  let ids: number[] | null = null
  const ap = (arr: number[]) => { ids = ids === null ? [...arr] : inter(ids, new Set(arr)) }
  if (selectedKinh.value) ap(cm.lucKinh[selectedKinh.value] ?? [])
  if (subTang.value) ap(cm.tangPhu[subTang.value] ?? [])
  if (subKhi.value) ap(cm.lucKhi[subKhi.value] ?? [])
  return ids === null ? null : new Set(ids)
})
// Sub-filter chips (đếm theo trục kia đang bật) — chỉ khi đã chọn kinh.
function subOpts(axis: 'tang' | 'khi'): { key: string; count: number }[] {
  const cm = chiMuc.value; if (!cm || !selectedKinh.value) return []
  const base = cm.lucKinh[selectedKinh.value] ?? []
  const other = axis === 'tang' ? subKhi.value : subTang.value
  const otherMap = axis === 'tang' ? cm.lucKhi : cm.tangPhu
  const scope = other ? inter(base, new Set(otherMap[other] ?? [])) : base
  const data = axis === 'tang' ? cm.tangPhu : cm.lucKhi
  const cur = axis === 'tang' ? subTang.value : subKhi.value
  const out: { key: string; count: number }[] = []
  const scopeSet = new Set(scope)
  for (const [k, ids] of Object.entries(data)) { const c = inter(ids, scopeSet).length; if (c > 0 || cur === k) out.push({ key: k, count: c }) }
  return out.sort((a, b) => b.count - a.count)
}
const tangOptions = computed(() => subOpts('tang'))
const khiOptions = computed(() => subOpts('khi'))

// ── Phạm vi nhóm khoa ──
const nhomTayY = computed(() => (bienChung.value ? bienChung.value.tayY.filter((t) => t.nhom_id === nhom.value) : []))
// Tây Y của nhánh, đã khớp bộ lọc khung (nếu có) — nền dựng volvelle Lớp 2.
const tayYList = computed(() => {
  const f = frameworkSet.value
  return nhomTayY.value.filter((t) => !f || t.phap_tri_ids.some((id) => f.has(id)))
})
// Số bệnh Tây Y mỗi nhánh (theo bộ lọc khung hiện tại) — hiển thị trên card Lớp 1.
function nhomCount(id: number): number {
  const f = frameworkSet.value
  const arr = bienChung.value?.tayY.filter((t) => t.nhom_id === id) ?? []
  return f ? arr.filter((t) => t.phap_tri_ids.some((x) => f.has(x))).length : arr.length
}

// ── VOLVELLE Lớp 2: mỗi bệnh Tây Y = 1 nan hoa; vòng Bệnh Tây Y · Thể bệnh ĐY · Triệu Chứng · Bài Thuốc ──
const NHOM_SCHEMA: Schema = {
  type: 'tay-y', tabLabel: '', hubName: 'Bệnh Tây Y', readKey: 'trieuChung',
  rings: [
    { key: 'benhTayY', label: 'Bệnh Tây Y', token: 'brand' },
    { key: 'theBenh', label: 'Thể bệnh Đông Y', token: 'pattern' },
    { key: 'trieuChung', label: 'Triệu Chứng', token: 'symptom' },
    { key: 'baiThuoc', label: 'Bài Thuốc', token: 'herb' },
  ],
}
// Reverse map: pháp trị id → toạ độ khung (Lục Kinh / Tạng Phủ / Lục Khí) — gắn vào link volvelle.
const ptFrame = computed(() => {
  const cm = chiMuc.value
  const m = new Map<number, { kinh: Set<string>; tang: Set<string>; khi: Set<string> }>()
  if (!cm) return m
  const add = (id: number, f: 'kinh' | 'tang' | 'khi', v: string) => {
    let e = m.get(id); if (!e) { e = { kinh: new Set(), tang: new Set(), khi: new Set() }; m.set(id, e) }
    e[f].add(v)
  }
  for (const [s, arr] of Object.entries(cm.lucKinh)) for (const id of arr) add(id, 'kinh', KINH_NAME[s] ?? s)
  for (const [o, arr] of Object.entries(cm.tangPhu)) for (const id of arr) add(id, 'tang', o)
  for (const [k, arr] of Object.entries(cm.lucKhi)) for (const id of arr) add(id, 'khi', k)
  return m
})
// Bài thuốc THẬT = có (số vị) ở cuối tên; loại placeholder rác "Tên bệnh (Nhóm khoa)".
const hasSoVi = (name: string) => /\(\d+\)\s*$/.test(name)
const nhomLinks = computed<WheelLink[]>(() => {
  const cm = chiMuc.value, bc = bienChung.value
  if (!cm || !bc) return []
  const pf = ptFrame.value
  return tayYList.value.map((t) => {
    const te = new Set<string>(), tc = new Set<string>(t.trieu_chung)
    const bai = new Set<string>(t.bai_thuoc.filter(hasSoVi))
    const kinh = new Set<string>(), tang = new Set<string>(), khi = new Set<string>()
    for (const id of t.phap_tri_ids) {
      const r = cm.records[id]
      if (r) { if (r.ten) te.add(r.ten); for (const b of r.bai_thuoc) if (hasSoVi(b)) bai.add(b) }
      for (const x of bc.ptTrieuChung[id] ?? []) tc.add(x)
      const f = pf.get(id)
      if (f) { f.kinh.forEach((v) => kinh.add(v)); f.tang.forEach((v) => tang.add(v)); f.khi.forEach((v) => khi.add(v)) }
    }
    return {
      id: t.id, label: t.ten,
      benhTayY: [t.ten], theBenh: [...te], trieuChung: [...tc], baiThuoc: [...bai],
      khungKinh: [...kinh], khungTang: [...tang], khungKhi: [...khi],
    }
  })
})

// ── VOLVELLE ĐÔNG Y: 3 nhánh = 3 trục (Định vị/Tác nhân/Tính chất) — bộ lọc pháp trị dạng vòng xoay ──
const dongYAxis = ref<string | null>(null)
const NHOM_TO_AXIS: Record<string, string> = {}
for (const a of TON_THUONG_AXES) for (const g of a.groups) NHOM_TO_AXIS[g] = a.key
const axisOf = (name: string): string | null => { const n = tonThuongNhom(name); return n ? (NHOM_TO_AXIS[n] ?? null) : null }
// pháp trị id → { 'dinh-vi': [...], 'tac-nhan': [...], 'tinh-chat': [...] } (nhãn đã rút gọn "…Kinh Chứng")
const ptAxis = computed(() => {
  const bc = bienChung.value; const m = new Map<number, Record<string, string[]>>()
  for (const [idStr, vals] of Object.entries(bc?.ptTonThuong ?? {})) {
    const rec: Record<string, string[]> = { 'dinh-vi': [], 'tac-nhan': [], 'tinh-chat': [] }
    for (const v of vals) { const ax = axisOf(v); if (ax) rec[ax]!.push(shortTonThuongLabel(v)) }
    m.set(Number(idStr), rec)
  }
  return m
})
// 4 nhánh Đông Y = 3 trục Tổn thương-Tác nhân + Tạng Phủ (lấy từ ptFrame.tang, không cần backend mới).
const DONGY_AXES: { key: string; num: string; title: string; sub: string }[] = [
  ...TON_THUONG_AXES.map((a) => ({ key: a.key, num: a.num, title: a.title, sub: a.sub })),
  { key: 'tang-phu', num: '④', title: 'Tạng Phủ', sub: 'tạng/phủ tổn thương' },
]
const axisValsFor = (id: number, ax: string): string[] =>
  ax === 'tang-phu' ? [...(ptFrame.value.get(id)?.tang ?? [])] : (ptAxis.value.get(id)?.[ax] ?? [])
const dongYTenCur = computed(() => DONGY_AXES.find((a) => a.key === dongYAxis.value)?.title ?? '')

// ── Bộ lọc CHI TIẾT nhánh Đông Y (FilterBar y như trang Pháp Trị) ──────────────
// Tập thể bệnh đang trong phạm vi bộ lọc KHUNG (để đếm số cho từng chip lọc chi tiết).
const dyScopeIds = computed<number[]>(() => {
  const cm = chiMuc.value; if (!cm) return []
  const f = frameworkSet.value
  return Object.keys(cm.records).map(Number).filter((id) => !f || f.has(id))
})
// Thống kê Tổn thương-Tác nhân (tên ĐẦY ĐỦ) + số thể bệnh có nó trong phạm vi Khung.
const dyTonStats = computed<{ name: string; count: number }[]>(() => {
  const bc = bienChung.value; if (!bc) return []
  const m = new Map<string, number>()
  for (const id of dyScopeIds.value) for (const n of bc.ptTonThuong?.[id] ?? []) m.set(n, (m.get(n) ?? 0) + 1)
  return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
})
// Thống kê Tạng phủ tổn thương.
const dyTangStats = computed<{ name: string; count: number }[]>(() => {
  const m = new Map<string, number>()
  for (const id of dyScopeIds.value) for (const t of ptFrame.value.get(id)?.tang ?? []) m.set(t, (m.get(t) ?? 0) + 1)
  return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
})
// Nhóm cho FilterBar: trục Tổn thương-Tác nhân (3 trục) + Tạng phủ — cùng UI với bộ lọc Pháp trị.
const dyFilterGroups = computed<FbGroup[]>(() => {
  const groups: FbGroup[] = []
  if (dyTonStats.value.length)
    groups.push({
      id: 'ton-thuong', label: 'Tổn thương - Tác nhân', axis: true, searchable: true, shorten: 'ton-thuong',
      options: dyTonStats.value.map((o) => ({ key: o.name, label: o.name, count: o.count })),
      selected: dyTon.value,
    })
  if (dyTangStats.value.length)
    groups.push({
      id: 'tang-phu', label: 'Tạng phủ', searchable: true, collapse: 14,
      options: dyTangStats.value.map((o) => ({ key: o.name, label: o.name, count: o.count })),
      selected: dyTang.value,
    })
  return groups
})
function onDyPick(groupId: string, key: string | number | null) {
  if (key == null) return
  const k = String(key)
  const toggle = (list: string[]) => (list.includes(k) ? list.filter((x) => x !== k) : [...list, k])
  if (groupId === 'ton-thuong') dyTon.value = toggle(dyTon.value)
  else if (groupId === 'tang-phu') dyTang.value = toggle(dyTang.value)
}
function clearDyFilter() { dyTon.value = []; dyTang.value = [] }
// Tập thể bệnh khớp bộ lọc chi tiết Đông Y (OR trong nhóm, AND giữa nhóm). null = chưa lọc chi tiết.
const dyDetailSet = computed<Set<number> | null>(() => {
  const cm = chiMuc.value, bc = bienChung.value
  if (!cm || !bc) return null
  if (!dyTon.value.length && !dyTang.value.length) return null
  const tonSel = new Set(dyTon.value), tangSel = new Set(dyTang.value)
  const out = new Set<number>()
  for (const idStr of Object.keys(cm.records)) {
    const id = Number(idStr)
    if (tonSel.size && !(bc.ptTonThuong?.[id] ?? []).some((n) => tonSel.has(n))) continue
    if (tangSel.size) {
      const tang = ptFrame.value.get(id)?.tang
      if (!tang || ![...tangSel].some((t) => tang.has(t))) continue
    }
    out.add(id)
  }
  return out
})
// Bộ lọc hiệu lực cho nhánh Đông Y = Khung ∩ bộ lọc chi tiết.
const effDongYSet = computed(() => andSet(frameworkSet.value, dyDetailSet.value))

const dongYCards = computed(() => {
  const cm = chiMuc.value, f = effDongYSet.value
  const ids = cm ? Object.keys(cm.records).map(Number) : []
  return DONGY_AXES.map((a) => {
    let so = 0
    for (const id of ids) { if (f && !f.has(id)) continue; if (axisValsFor(id, a.key).length) so++ }
    return { key: a.key, num: a.num, title: a.title, sub: a.sub, so }
  })
})
const dongYSchema = computed<Schema | null>(() => {
  const ax = dongYAxis.value; if (!ax) return null
  const meta = DONGY_AXES.find((a) => a.key === ax)
  return {
    type: 'dong-y', tabLabel: '', hubName: 'Thể bệnh', readKey: 'truc',
    rings: [
      { key: 'truc', label: meta?.title ?? 'Trục', token: 'brand' },
      { key: 'theBenh', label: 'Thể bệnh', token: 'pattern' },
      { key: 'trieuChung', label: 'Triệu Chứng', token: 'symptom' },
      { key: 'baiThuoc', label: 'Bài Thuốc', token: 'herb' },
    ],
  }
})
const dongYLinks = computed<WheelLink[]>(() => {
  const cm = chiMuc.value, bc = bienChung.value, ax = dongYAxis.value
  if (!cm || !bc || !ax) return []
  const pf = ptFrame.value, f = effDongYSet.value
  const out: WheelLink[] = []
  for (const [idStr, r] of Object.entries(cm.records)) {
    const id = Number(idStr)
    if (f && !f.has(id)) continue
    const truc = axisValsFor(id, ax)
    if (!truc.length) continue
    const ff = pf.get(id)
    out.push({
      id, label: r.ten ?? '(không tên)',
      truc, theBenh: r.ten ? [r.ten] : [],
      trieuChung: bc.ptTrieuChung[id] ?? [],
      baiThuoc: (r.bai_thuoc ?? []).filter(hasSoVi),
      khungKinh: ff ? [...ff.kinh] : [], khungTang: ff ? [...ff.tang] : [], khungKhi: ff ? [...ff.khi] : [],
    })
  }
  return out
})

// ── Toạ độ khung cho 1 tập pháp trị ──
function tagsFor(ids: number[]): { label: string; val: string }[] {
  const cm = chiMuc.value; if (!cm || !ids.length) return []
  const idSet = new Set(ids)
  const hit = (arr: number[]) => arr.some((i) => idSet.has(i))
  const kinh: string[] = [], phan: string[] = [], tieu: string[] = [], tang: string[] = [], khi: string[] = []
  for (const [s, arr] of Object.entries(cm.lucKinh)) if (hit(arr)) kinh.push(KINH_NAME[s] ?? s)
  for (const [p, arr] of Object.entries(cm.phan ?? {})) if (hit(arr)) phan.push(p)
  for (const [t, arr] of Object.entries(cm.tamTieu ?? {})) if (hit(arr)) tieu.push(t)
  for (const [o, arr] of Object.entries(cm.tangPhu)) if (hit(arr)) tang.push(o)
  for (const [k, arr] of Object.entries(cm.lucKhi)) if (hit(arr)) khi.push(k)
  // Định vị TỔNG HỢP: Lục Kinh (thương hàn) · Vệ-Khí-Dinh-Huyết (ôn bệnh) · Tam Tiêu
  const dinhVi = [...kinh, ...phan, ...tieu]
  const out: { label: string; val: string }[] = []
  if (dinhVi.length) out.push({ label: 'Định vị', val: dinhVi.join(' · ') })
  if (tang.length) out.push({ label: 'Tạng Phủ', val: tang.slice(0, 4).join(' · ') })
  if (khi.length) out.push({ label: 'Lục Khí', val: khi.join(' · ') })
  return out
}

// ── Vòng nhỏ (hub) theo tâm đang chọn ──
const hub = computed(() => {
  const f = focus.value, cm = chiMuc.value, bc = bienChung.value
  if (!f || !cm || !bc) return null
  if (f.type === 'tay-y') {
    const t = tayById.value.get(Number(f.key)); if (!t) return null
    const te = new Map<string, boolean>(), phap = new Set<string>(), bai = new Set<string>(), tc = new Set<string>(t.trieu_chung)
    for (const id of t.phap_tri_ids) {
      const r = cm.records[id]; if (!r) continue
      if (r.ten) te.set(r.ten, true)
      if (r.nguyen_tac) phap.add(r.nguyen_tac)
      for (const b of r.bai_thuoc) bai.add(b)
      for (const x of bc.ptTrieuChung[id] ?? []) tc.add(x)
    }
    for (const b of t.bai_thuoc) bai.add(b)
    const groups: HubGroup[] = [
      { key: 'te', label: 'Thể bệnh Đông Y', color: C.te, items: [...te.keys()].map((x) => ({ key: x, ten: x, nav: 'dong-y' as const })) },
      { key: 'phap', label: 'Pháp trị', color: C.phap, items: [...phap].map((x) => ({ key: x, ten: x })) },
      { key: 'tc', label: 'Triệu chứng', color: C.tc, items: [...tc].map((x) => ({ key: x, ten: x })) },
      { key: 'bai', label: 'Bài thuốc', color: C.bai, items: [...bai].map((x) => ({ key: x, ten: x })) },
    ]
    return { focusTen: t.ten, focusType: 'tay-y' as const, tags: tagsFor(t.phap_tri_ids), groups }
  }
  const ids = recByName.value.get(f.key) ?? []
  const phap = new Set<string>(), bai = new Set<string>(), tc = new Set<string>(), tay = new Map<number, TayY>()
  for (const id of ids) {
    const r = cm.records[id]; if (!r) continue
    if (r.nguyen_tac) phap.add(r.nguyen_tac)
    for (const b of r.bai_thuoc) bai.add(b)
    for (const x of bc.ptTrieuChung[id] ?? []) tc.add(x)
    for (const t of ptToTayY.value.get(id) ?? []) tay.set(t.id, t)
  }
  const groups: HubGroup[] = [
    { key: 'tc', label: 'Triệu chứng', color: C.tc, items: [...tc].map((x) => ({ key: x, ten: x })) },
    { key: 'phap', label: 'Pháp trị', color: C.phap, items: [...phap].map((x) => ({ key: x, ten: x })) },
    { key: 'bai', label: 'Bài thuốc', color: C.bai, items: [...bai].map((x) => ({ key: x, ten: x })) },
    { key: 'tay', label: 'Bệnh Tây Y', color: C.te, items: [...tay.values()].map((t) => ({ key: String(t.id), ten: t.ten, nav: 'tay-y' as const, sub: nhomTen(t.nhom_id) })) },
  ]
  return { focusTen: f.key, focusType: 'dong-y' as const, tags: tagsFor(ids), groups }
})
const nhomTen = (id: number) => bienChung.value?.nhomKhoa.find((n) => n.id === id)?.ten ?? ''

// ── Kết luận biện chứng ("lá bài cuối"): 3 trục khung của bệnh đang soi ──
interface VAxis { key: string; icon: string; title: string; desc: string; color: string; val: string }
const AX_META: { label: string; key: string; icon: string; title: string; desc: string; color: string }[] = [
  { label: 'Định vị', key: 'dinh-vi', icon: '🧭', title: 'Định vị · Giai đoạn', desc: 'Lục Kinh · Vệ-Khí-Dinh-Huyết · Tam Tiêu', color: '#6b4a24' },
  { label: 'Lục Khí', key: 'tac-nhan', icon: '🌫', title: 'Tác nhân · Khí tà', desc: 'khí/tà gây bệnh', color: '#b1502f' },
  { label: 'Tạng Phủ', key: 'tang-phu', icon: '🫀', title: 'Tạng phủ tổn thương', desc: 'tạng/phủ bị hại', color: '#3a6b8a' },
]
const verdict = computed<VAxis[]>(() => {
  const m = new Map((hub.value?.tags ?? []).map((t) => [t.label, t.val]))
  return AX_META.map((a) => ({ key: a.key, icon: a.icon, title: a.title, desc: a.desc, color: a.color, val: m.get(a.label) ?? '' }))
})

// ── Tương tác ──
function onWheel(sel: { type: string; key: string; kinh?: string }) {
  if (sel.type === 'kinh') { if (selectedKinh.value !== sel.key) { selectedKinh.value = sel.key; subTang.value = null; subKhi.value = null } return }
  const owner = sel.kinh
  if (owner && selectedKinh.value !== owner) { selectedKinh.value = owner; subTang.value = null; subKhi.value = null }
  if (sel.type === 'tang') subTang.value = subTang.value === sel.key ? null : sel.key
  if (sel.type === 'khi') subKhi.value = subKhi.value === sel.key ? null : sel.key
}
function clearFramework() { selectedKinh.value = null; subTang.value = null; subKhi.value = null }
// Bóc lớp: Khung (gốc) → Nhóm khoa (nhánh) → Bệnh (tâm). Mỗi lúc 1 lớp; xuống sâu cất lớp cha.
const level = computed<'khung' | 'nhom' | 'dong-y' | 'benh'>(() =>
  focus.value ? 'benh' : nhom.value != null ? 'nhom' : dongYAxis.value ? 'dong-y' : 'khung')
const nhomTenCur = computed(() => bienChung.value?.nhomKhoa.find((n) => n.id === nhom.value)?.ten ?? '')
function enterNhom(id: number) { nhom.value = id; dongYAxis.value = null; focus.value = null }
// Chọn 1 trục ở Lớp 1 (bộ lọc đã đặt sẵn ngoài sidebar) → DỰNG bàn xoay theo trục đó.
function enterDongY(ax: string) { dongYAxis.value = ax; nhom.value = null; focus.value = null }
// Về Khung: rời bàn xoay nhưng GIỮ bộ lọc chi tiết (bộ lọc nằm ngay ở Lớp 1) để không mất lựa chọn.
function backToKhung() { nhom.value = null; dongYAxis.value = null; focus.value = null }
function backToNhom() { focus.value = null }
function onPick(p: { nav: 'tay-y' | 'dong-y'; key: string }) { focus.value = { type: p.nav, key: p.key } }
// Drill từ volvelle → Lớp 3: nhánh Đông Y soi theo TÊN thể bệnh; nhánh Tây Y soi theo id.
function onDrill(p: { id: number; name: string }) {
  focus.value = dongYAxis.value ? { type: 'dong-y', key: p.name } : { type: 'tay-y', key: String(p.id) }
}
// Bấm chip Liên kết Khung ở Lớp 2 → QUAY VỀ Lớp 1 (Khung) + làm sáng đúng nút (Kinh/Tạng/Khí).
function onSelectKhung(p: { axis: 'kinh' | 'tang' | 'khi'; value: string }) {
  nhom.value = null
  focus.value = null
  selectedKinh.value = p.axis === 'kinh' ? (SLUG_BY_NAME[p.value] ?? null) : null
  subTang.value = p.axis === 'tang' ? p.value : null
  subKhi.value = p.axis === 'khi' ? p.value : null
}
const activeLabel = computed(() => [selectedKinh.value ? KINH_NAME[selectedKinh.value] : null, subTang.value, subKhi.value].filter(Boolean).join(' · '))

async function load() {
  loading.value = true
  try {
    const [cm, bc] = await Promise.all([
      api.get<ChiMuc>('/thuong-han/chi-muc'),
      api.get<BienChung>('/thuong-han/bien-chung'),
    ])
    chiMuc.value = cm
    bienChung.value = bc
    // bắt đầu ở Lớp 1 (Khung) — chưa chọn nhóm khoa, chưa soi bệnh (nhom = null)
  } catch {
    // để trống — hiện thông báo lỗi tải
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>

<template>
  <div class="bx-page">
    <header class="bx-hero">
      <div>
        <p class="bx-eyebrow">辨證盤 · Biện chứng luận trị</p>
        <h1 class="bx-title">Bàn Xoay Biện Chứng</h1>
        <p class="bx-sub">Bàn xoay <b>nhỏ</b> (Bệnh) lồng trong bàn xoay <b>lớn</b> — khung Lục Kinh · Tạng Phủ · Lục Khí. Bệnh Tây Y là <b>con</b> của thể bệnh Đông Y, nối qua bài thuốc chung.</p>
      </div>
    </header>

    <!-- Breadcrumb bóc lớp: Khung › Nhóm khoa › Bệnh -->
    <nav class="bx-crumb">
      <button type="button" class="bx-crumb-item" :class="{ cur: level === 'khung' }" @click="backToKhung">
        <span class="bx-crumb-kind">Khung</span> <span class="bx-crumb-han">六經·臟腑·六氣</span>
      </button>
      <template v-if="nhom != null">
        <span class="bx-crumb-sep">›</span>
        <button type="button" class="bx-crumb-item" :class="{ cur: level === 'nhom' }" @click="backToNhom">{{ nhomTenCur }}</button>
      </template>
      <template v-if="dongYAxis != null">
        <span class="bx-crumb-sep">›</span>
        <button type="button" class="bx-crumb-item dy" :class="{ cur: level === 'dong-y' }" @click="backToNhom">Đông Y · {{ dongYTenCur }}</button>
      </template>
      <template v-if="level === 'benh' && hub">
        <span class="bx-crumb-sep">›</span>
        <span class="bx-crumb-item cur">{{ hub.focusTen }}</span>
      </template>
    </nav>

    <p v-if="loading" class="bx-loading">Đang tải bàn xoay…</p>

    <!-- LỚP 3 — BỆNH (lá bài cuối): kết luận biện chứng + vòng tâm + chi tiết -->
    <div v-else-if="level === 'benh' && hub" class="bx-focus">
      <!-- KẾT LUẬN BIỆN CHỨNG: bệnh này đã vào kinh nào · tác nhân gì · tạng phủ nào tổn thương -->
      <div class="bx-verdict" :class="hub.focusType">
        <div class="bx-verdict-id">
          <span class="bx-verdict-kind">{{ hub.focusType === 'tay-y' ? '🩺 Bệnh Tây Y' : '☯ Thể bệnh Đông Y' }}</span>
          <h2 class="bx-verdict-ten">{{ hub.focusTen }}</h2>
          <span class="bx-verdict-note">辨證 · Kết luận biện chứng — lá bài cuối</span>
        </div>
        <div class="bx-verdict-axes">
          <div v-for="ax in verdict" :key="ax.key" class="bx-vax" :style="{ '--c': ax.color }">
            <span class="bx-vax-ic">{{ ax.icon }}</span>
            <div class="bx-vax-body">
              <span class="bx-vax-title">{{ ax.title }}</span>
              <b class="bx-vax-val" :class="{ empty: !ax.val }">{{ ax.val || 'chưa định vị' }}</b>
              <span class="bx-vax-desc">{{ ax.desc }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bx-focus-grid">
        <div class="bx-focus-wheel">
          <BanXoayHub :focus-ten="hub.focusTen" :focus-type="hub.focusType" :tags="hub.tags" :groups="hub.groups" @pick="onPick" />
        </div>
        <aside class="bx-fd">
          <div class="bx-fd-cap">Chi tiết liên kết</div>
          <div v-for="g in hub.groups" :key="g.key" class="bx-fd-group">
            <div class="bx-fd-glabel" :style="{ color: g.color }">{{ g.label }} <i>{{ g.items.length }}</i></div>
            <div v-if="g.items.length" class="bx-fd-items">
              <template v-for="it in g.items" :key="it.key">
                <button v-if="it.nav" type="button" class="bx-fd-chip nav" :style="{ '--c': g.color }" @click="onPick({ nav: it.nav, key: it.key })">
                  {{ it.ten }}<small v-if="it.sub"> · {{ it.sub }}</small> <span class="bx-fd-go">↳</span>
                </button>
                <span v-else class="bx-fd-chip" :style="{ '--c': g.color }">{{ it.ten }}</span>
              </template>
            </div>
            <p v-else class="bx-fd-empty">—</p>
          </div>
        </aside>
      </div>
    </div>

    <!-- LỚP 2 — NHÁNH TÂY Y: khung đã cất, dựng VOLVELLE mới scoped nhóm -->
    <div v-else-if="level === 'nhom'" class="bx-volvelle">
      <BanXoayBienChung
        :external-schema="NHOM_SCHEMA"
        :external-links="nhomLinks"
        :scope-title="'Nhánh ' + nhomTenCur + ' · ' + nhomLinks.length + ' bệnh Tây Y — chạm 1 bệnh (vòng ngoài) để soi'"
        @drill="onDrill"
        @select-khung="onSelectKhung"
      />
    </div>

    <!-- LỚP 2b — NHÁNH ĐÔNG Y: bàn xoay theo trục (bộ lọc chi tiết đã đặt ở Lớp 1; đây chỉ đổi trục + xem) -->
    <div v-else-if="level === 'dong-y' && dongYSchema" class="bx-volvelle bx-dy-live">
      <!-- Đổi TRỤC (vòng ngoài) — số đã lọc theo bộ lọc chi tiết đặt ở Khung -->
      <div class="bx-dy-build">
        <span class="bx-dy-build-lead">Trục (vòng ngoài):</span>
        <div class="bx-dy-tabs" role="tablist" aria-label="Trục biện chứng làm vòng ngoài">
          <button
            v-for="a in dongYCards"
            :key="a.key"
            type="button"
            role="tab"
            class="bx-dy-tab"
            :class="{ on: dongYAxis === a.key }"
            :aria-selected="dongYAxis === a.key"
            :disabled="!a.so"
            @click="enterDongY(a.key)"
          >
            {{ a.num }} {{ a.title }} <i>{{ a.so }}</i>
          </button>
        </div>
      </div>
      <!-- Đang lọc gì (đặt ở Khung) — nhắc lại gọn, sửa lại thì về Khung -->
      <div v-if="dyTon.length || dyTang.length" class="bx-dy-active">
        <span class="bx-dy-active-lead">🎯 Đang lọc:</span>
        <span v-for="t in dyTon" :key="'t' + t" class="bx-dy-active-chip">{{ shortTonThuongLabel(t) }}</span>
        <span v-for="g in dyTang" :key="'g' + g" class="bx-dy-active-chip tang">{{ g }}</span>
        <button type="button" class="bx-dy-active-clear" @click="clearDyFilter">✕ Xóa lọc</button>
      </div>
      <BanXoayBienChung
        :external-schema="dongYSchema"
        :external-links="dongYLinks"
        drill-ring-key="theBenh"
        :scope-title="'Đông Y · ' + dongYTenCur + ' · ' + dongYLinks.length + ' thể bệnh — chạm 1 Thể bệnh để soi'"
        @drill="onDrill"
        @select-khung="onSelectKhung"
      />
    </div>

    <!-- LỚP 1 — KHUNG (lớn nhất): vòng khung + chọn nhánh chuyên khoa -->
    <div v-else class="bx-main">
      <section class="bx-wheel">
        <div class="bx-wheel-cap">Bàn xoay KHUNG — Lục Kinh · Tạng Phủ · Lục Khí</div>
        <VongLucKinh :counts="lucKinhCounts" :active-kinh="selectedKinh" :active-tang="subTang" :active-khi="subKhi" @select="onWheel" />
        <div v-if="selectedKinh || subTang || subKhi" class="bx-filter">
          <div class="bx-fx-active">🎯 Đang soi khung: <b>{{ activeLabel }}</b> — số bệnh mỗi nhánh đã lọc theo đây</div>
          <div v-if="tangOptions.length" class="bx-fx">
            <span class="bx-fx-label">Tạng Phủ</span>
            <button v-for="o in tangOptions" :key="o.key" type="button" class="bx-chip tang" :class="{ on: subTang === o.key, mute: !o.count }" @click="subTang = subTang === o.key ? null : o.key">{{ o.key }} <i>{{ o.count }}</i></button>
          </div>
          <div v-if="khiOptions.length" class="bx-fx">
            <span class="bx-fx-label">Lục Khí</span>
            <button v-for="o in khiOptions" :key="o.key" type="button" class="bx-chip khi" :class="{ on: subKhi === o.key, mute: !o.count }" @click="subKhi = subKhi === o.key ? null : o.key">{{ o.key }} <i>{{ o.count }}</i></button>
          </div>
          <button type="button" class="bx-clear" @click="clearFramework">✕ Bỏ lọc khung</button>
        </div>
        <p v-else class="bx-hint">Xoay/bấm khung để lọc trước (tuỳ chọn), rồi chọn 1 nhánh chuyên khoa → dựng bàn xoay của nhánh đó.</p>
      </section>

      <aside class="bx-side">
        <div class="bx-branch-head">🩺 Nhánh Tây Y <small>(chuyên khoa · mỗi nhánh = 1 bàn xoay)</small></div>
        <div class="bx-branch-grid">
          <button v-for="n in bienChung?.nhomKhoa ?? []" :key="n.id" type="button" class="bx-branch" :disabled="!nhomCount(n.id)" @click="enterNhom(n.id)">
            <b>{{ n.ten }}</b><i>{{ nhomCount(n.id) }} bệnh Tây Y</i>
          </button>
        </div>

        <div class="bx-branch-head dy">☯ Nhánh Đông Y <small>(lọc chi tiết ngay tại đây → chọn trục → dựng bàn xoay)</small></div>
        <!-- Bộ lọc chi tiết Ở NGAY sidebar (giống trang Pháp Trị): chọn Tổn thương-Tác nhân (3 trục) + Tạng phủ -->
        <FilterBar
          v-if="dyFilterGroups.length"
          class="bx-dy-filter"
          :groups="dyFilterGroups"
          @pick="onDyPick"
          @clear="clearDyFilter"
        />
        <!-- Chọn 1 trục → dựng bàn xoay (số đã lọc theo bộ lọc trên) -->
        <div class="bx-dy-build">
          <span class="bx-dy-build-lead">Dựng bàn xoay theo trục:</span>
          <div class="bx-dy-tabs" role="tablist" aria-label="Chọn trục để dựng bàn xoay">
            <button
              v-for="a in dongYCards"
              :key="a.key"
              type="button"
              class="bx-dy-tab"
              :disabled="!a.so"
              @click="enterDongY(a.key)"
            >
              {{ a.num }} {{ a.title }} <i>{{ a.so }}</i>
            </button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.bx-page { display: flex; flex-direction: column; gap: 16px; }
.bx-hero { background: linear-gradient(135deg, var(--brown-600, #6b4a24) 0%, var(--brown-800, #2e1d0d) 100%); border-radius: 16px; padding: 22px 28px; color: #fff; }
.bx-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.04em; color: #e9d6b3; opacity: 0.9; margin: 0; }
.bx-title { font-size: 26px; font-weight: 800; margin: 5px 0 7px; }
.bx-sub { font-size: 14px; color: rgba(255, 255, 255, 0.82); max-width: 76ch; line-height: 1.55; margin: 0; }

/* Breadcrumb bóc lớp */
.bx-crumb { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.bx-crumb-item { font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; padding: 6px 14px; border-radius: 999px; border: 1px solid var(--border, #e7ddcd); background: var(--surface, #fff); color: var(--brown-700, #6b4a24); display: inline-flex; align-items: baseline; gap: 6px; transition: all 0.15s; }
.bx-crumb-item:hover { border-color: var(--brown-400, #b98d54); }
.bx-crumb-item.cur { background: var(--brown-600, #6b4a24); border-color: var(--brown-600, #6b4a24); color: #fff; cursor: default; }
.bx-crumb-kind { font-weight: 800; }
.bx-crumb-han { font-size: 10.5px; opacity: 0.6; }
.bx-crumb-sep { color: var(--text-muted, #8a7a60); font-size: 16px; }

.bx-main { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 20px; align-items: start; }
@media (max-width: 900px) { .bx-main { grid-template-columns: 1fr; } }
.bx-wheel-cap { font-size: 12.5px; font-weight: 800; letter-spacing: 0.02em; text-transform: uppercase; color: var(--brown-600, #6b4a24); text-align: center; }
.bx-volvelle { background: var(--surface, #fff); border: 1px solid var(--border, #e7ddcd); border-radius: 16px; padding: 14px 14px 20px; }
/* Bàn xoay chiếm cột trái CÓ TRẦN theo BỀ RỘNG (không theo chiều cao → không phình tràn phải);
   panel lấy phần còn lại và co giãn. Màn hẹp thì stack (media 900 trong component). */
@media (min-width: 901px) {
  .bx-volvelle :deep(.bx-stage) {
    grid-template-columns: minmax(0, clamp(300px, 34vw, 520px)) minmax(0, 1fr);
    align-items: start;
  }
}

/* Lớp 3 — lá bài cuối: kết luận biện chứng + vòng tâm + chi tiết */
.bx-focus { display: flex; flex-direction: column; gap: 16px; }
.bx-focus-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr); gap: 20px; align-items: start; }
@media (max-width: 900px) { .bx-focus-grid { grid-template-columns: 1fr; } }
.bx-focus-wheel { background: var(--surface, #fff); border: 1px solid var(--border, #e7ddcd); border-radius: 16px; padding: 18px; display: flex; justify-content: center; }

/* KẾT LUẬN BIỆN CHỨNG (verdict) */
.bx-verdict { display: grid; grid-template-columns: minmax(170px, 250px) 1fr; gap: 18px; align-items: center; background: linear-gradient(135deg, #fff, var(--brown-50, #f7efe2)); border: 1px solid var(--brown-200, #e6d3b3); border-left: 5px solid var(--brown-500, #8a5a2a); border-radius: 16px; padding: 16px 20px; }
.bx-verdict.tay-y { border-left-color: #b1502f; }
@media (max-width: 680px) { .bx-verdict { grid-template-columns: 1fr; } }
.bx-verdict-id { display: flex; flex-direction: column; gap: 3px; }
.bx-verdict-kind { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-muted, #8a7a60); }
.bx-verdict.tay-y .bx-verdict-kind { color: #b1502f; }
.bx-verdict.dong-y .bx-verdict-kind { color: #6b4a24; }
.bx-verdict-ten { font-size: 23px; font-weight: 800; margin: 0; color: var(--text, #2a1c0e); line-height: 1.1; }
.bx-verdict-note { font-size: 11px; font-weight: 600; color: var(--brown-500, #a4743a); }
.bx-verdict-axes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
@media (max-width: 680px) { .bx-verdict-axes { grid-template-columns: 1fr; } }
.bx-vax { display: flex; gap: 10px; align-items: flex-start; background: #fff; border: 1px solid color-mix(in srgb, var(--c) 30%, #e7ddcd); border-top: 3px solid var(--c); border-radius: 12px; padding: 10px 12px; }
.bx-vax-ic { font-size: 19px; line-height: 1.1; }
.bx-vax-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.bx-vax-title { font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.02em; color: var(--c); }
.bx-vax-val { font-size: 15px; font-weight: 800; color: var(--text, #2a1c0e); line-height: 1.2; }
.bx-vax-val.empty { color: var(--text-muted, #8a7a60); font-weight: 600; font-style: italic; font-size: 13px; }
.bx-vax-desc { font-size: 11px; color: var(--text-muted, #8a7a60); }
.bx-fd-cap { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; color: var(--brown-600, #6b4a24); padding-bottom: 8px; border-bottom: 2px solid var(--brown-200, #e6d3b3); }
.bx-fd { background: var(--surface, #fff); border: 1px solid var(--border, #e7ddcd); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.bx-fd-head { padding-bottom: 10px; border-bottom: 2px solid var(--brown-200, #e6d3b3); }
.bx-fd-kind { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-muted, #8a7a60); }
.bx-fd-head.tay-y .bx-fd-kind { color: #b1502f; }
.bx-fd-head.dong-y .bx-fd-kind { color: #6b4a24; }
.bx-fd-head h2 { font-size: 20px; font-weight: 800; margin: 3px 0 6px; color: var(--text, #2a1c0e); }
.bx-fd-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.bx-fd-tag { font-size: 11.5px; background: var(--brown-100, #efe2cc); color: var(--brown-700, #6b4a24); border-radius: 999px; padding: 2px 9px; }
.bx-fd-tag i { font-style: normal; opacity: 0.6; }
.bx-fd-group { display: flex; flex-direction: column; gap: 5px; }
.bx-fd-glabel { font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.02em; display: flex; align-items: center; gap: 6px; }
.bx-fd-glabel i { font-style: normal; font-size: 10.5px; font-weight: 800; color: #fff; background: currentColor; border-radius: 999px; padding: 0 6px; }
.bx-fd-items { display: flex; flex-wrap: wrap; gap: 5px; }
.bx-fd-chip { font: inherit; font-size: 12.5px; font-weight: 600; padding: 3px 10px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--c) 40%, #e7ddcd); background: var(--brown-50, #f7efe2); color: var(--text, #2a1c0e); display: inline-flex; align-items: center; gap: 4px; }
.bx-fd-chip small { font-weight: 500; color: var(--text-muted, #8a7a60); }
.bx-fd-chip.nav { cursor: pointer; border-color: var(--c); background: #fff; }
.bx-fd-chip.nav:hover { background: color-mix(in srgb, var(--c) 12%, #fff); }
.bx-fd-go { color: var(--c); font-weight: 800; }
.bx-fd-empty { font-size: 12px; color: var(--text-muted, #8a7a60); margin: 0; }

/* Lớp 1 — nhánh chuyên khoa */
.bx-branch-head { font-size: 15px; font-weight: 800; color: var(--brown-700, #6b4a24); }
.bx-branch-head small { font-weight: 500; font-size: 12px; color: var(--text-muted, #8a7a60); }
.bx-branch-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px; }
.bx-branch { text-align: left; font: inherit; cursor: pointer; padding: 14px 16px; border-radius: 12px; border: 1px solid var(--border, #e7ddcd); border-left: 4px solid var(--brown-500, #8a5a2a); background: var(--brown-50, #f7efe2); color: var(--text, #2a1c0e); display: flex; flex-direction: column; gap: 3px; transition: all 0.15s; }
.bx-branch b { font-size: 15.5px; font-weight: 800; }
.bx-branch i { font-style: normal; font-size: 12px; color: var(--text-muted, #8a7a60); }
.bx-branch:hover { background: #fff; border-color: var(--brown-400, #b98d54); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(60, 40, 15, 0.12); }
.bx-branch.dy { border-left-color: #4f9152; }
.bx-branch.dy:disabled { opacity: 0.5; }
.bx-branch-head.dy { color: #4f9152; margin-top: 18px; }
/* Lớp 2b — Đông Y: bộ lọc + bàn xoay LỒNG NHAU (lọc tới đâu, vòng xoay sinh ra tới đó) */
.bx-dy-live { display: flex; flex-direction: column; gap: 14px; }
.bx-dy-controls { display: flex; flex-direction: column; gap: 10px; }
.bx-dy-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
.bx-dy-tab { font: inherit; font-size: 13.5px; font-weight: 800; cursor: pointer; padding: 8px 16px; border-radius: 999px; border: 1px solid var(--border, #e7ddcd); background: var(--brown-50, #f7efe2); color: var(--brown-700, #6b4a24); display: inline-flex; align-items: center; gap: 7px; transition: all 0.15s; }
.bx-dy-tab i { font-style: normal; font-size: 12px; font-weight: 800; background: #fff; color: #4f9152; border: 1px solid #cfe6cf; border-radius: 999px; padding: 0 7px; }
.bx-dy-tab:hover:not(:disabled) { border-color: #4f9152; }
.bx-dy-tab.on { background: #4f9152; border-color: #4f9152; color: #fff; }
.bx-dy-tab.on i { background: rgba(255, 255, 255, 0.24); color: #fff; border-color: transparent; }
.bx-dy-tab:disabled { opacity: 0.45; cursor: not-allowed; }
.bx-dy-filter { margin: 0; }
.bx-dy-build { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; padding: 10px 12px; background: #eef6ee; border: 1px solid #cfe6cf; border-radius: 12px; }
.bx-dy-build-lead { font-size: 13px; font-weight: 800; color: #3f7a43; }
/* Nhắc lại bộ lọc đang bật ở màn bàn xoay (read-only) */
.bx-dy-active { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.bx-dy-active-lead { font-size: 12.5px; font-weight: 800; color: #4f9152; }
.bx-dy-active-chip { font-size: 12px; font-weight: 700; color: var(--brown-700, #6b4a24); background: var(--brown-50, #f7efe2); border: 1px solid var(--brown-200, #e6d3b3); border-radius: 999px; padding: 2px 9px; }
.bx-dy-active-chip.tang { color: #3a6b8a; background: #eef4f8; border-color: #cfe0ea; }
.bx-dy-active-clear { font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; padding: 2px 9px; border-radius: 999px; border: 1px solid transparent; background: transparent; color: var(--text-muted, #8a7a60); }
.bx-dy-active-clear:hover { color: #b1502f; }
.bx-crumb-item.dy.cur { background: #4f9152; border-color: #4f9152; }

.bx-wheel { display: flex; flex-direction: column; gap: 12px; align-items: center; background: var(--surface, #fff); border: 1px solid var(--border, #e7ddcd); border-radius: 16px; padding: 16px; }
.bx-filter { width: 100%; display: flex; flex-direction: column; gap: 8px; }
.bx-fx-active { font-size: 12.5px; color: var(--brown-700, #6b4a24); background: var(--brown-50, #f7efe2); border: 1px solid var(--brown-200, #e6d3b3); border-radius: 8px; padding: 6px 10px; }
.bx-fx-active b { color: #b1502f; }
.bx-fx { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.bx-fx-label { font-size: 11.5px; font-weight: 800; text-transform: uppercase; color: var(--brown-600, #6b4a24); min-width: 60px; }
.bx-chip { font: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; padding: 3px 9px; border-radius: 999px; border: 1px solid var(--border, #d3b58a); background: #fff; color: var(--brown-700, #6b4a24); display: inline-flex; align-items: center; gap: 5px; }
.bx-chip i { font-style: normal; font-size: 11px; font-weight: 800; background: var(--brown-100, #efe2cc); padding: 0 5px; border-radius: 999px; }
.bx-chip.tang.on { background: #6b4a24; border-color: #6b4a24; color: #fff; }
.bx-chip.khi.on { background: #b1502f; border-color: #b1502f; color: #fff; }
.bx-chip.on i { background: rgba(255, 255, 255, 0.28); color: #fff; }
.bx-chip.mute { opacity: 0.45; }
.bx-clear { align-self: flex-start; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; padding: 3px 9px; border-radius: 999px; border: 1px solid transparent; background: transparent; color: var(--text-muted, #8a7a60); }
.bx-clear:hover { color: #b1502f; }
.bx-hint { font-size: 12.5px; color: var(--text-muted, #8a7a60); text-align: center; margin: 0; }

.bx-side { background: var(--surface, #fff); border: 1px solid var(--border, #e7ddcd); border-radius: 16px; padding: 16px; min-height: 320px; display: flex; flex-direction: column; gap: 14px; }
.bx-loading, .bx-empty { font-size: 13px; color: var(--text-muted, #8a7a60); text-align: center; padding: 10px; margin: 0; }
.bx-back { align-self: flex-start; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; padding: 5px 12px; border-radius: 999px; border: 1px solid var(--border, #e7ddcd); background: var(--brown-50, #f7efe2); color: var(--brown-700, #6b4a24); }
.bx-back:hover { border-color: var(--brown-400, #b98d54); }

.bx-list { display: flex; flex-direction: column; gap: 6px; }
.bx-list-head { display: flex; align-items: center; justify-content: space-between; font-size: 14px; font-weight: 800; padding-bottom: 6px; border-bottom: 2px solid var(--brown-200, #e6d3b3); }
.bx-list-head.tay { color: #b1502f; }
.bx-list-head.dong { color: #6b4a24; }
.bx-list-head i { font-style: normal; font-size: 12px; color: #fff; background: currentColor; border-radius: 999px; padding: 1px 9px; }
.bx-list-head.tay i { background: #b1502f; }
.bx-list-head.dong i { background: #6b4a24; }
.bx-list-body { display: flex; flex-direction: column; gap: 4px; max-height: 34vh; overflow-y: auto; }
.bx-item { text-align: left; font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; padding: 7px 10px; border-radius: 8px; border: 1px solid transparent; border-left: 3px solid; background: var(--brown-50, #f7efe2); color: var(--text, #2a1c0e); display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.bx-item.tay { border-left-color: #b1502f; }
.bx-item.dong { border-left-color: #6b4a24; }
.bx-item:hover { background: #fff; border-color: var(--brown-300, #d3b58a); }
.bx-item-n { font-size: 11px; font-weight: 700; color: var(--text-muted, #8a7a60); white-space: nowrap; }
</style>
