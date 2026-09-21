<script setup lang="ts">
/**
 * DemoKetQuaDoView — Trang "Kết Quả Đo Kinh Lạc" CÔNG KHAI (khách chưa đăng nhập).
 *
 * Lấy THẬT từ DB qua endpoint @Public /demo/ket-qua-do (1 ca đo, ẩn danh bệnh nhân).
 * Hiển thị CHỈ-XEM: bảng chỉ số nhiệt độ (chi trên/chi dưới) + Bát Cương + các thể bệnh đo được.
 * Mọi thao tác "dùng thật" (đo cho bệnh nhân của bạn, lưu hồ sơ) đang hoàn thiện — KHÔNG mời
 * đăng nhập ở đây (trang công khai, khách không cần biết đăng nhập ở đâu).
 */
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue'
import { api } from '@/services/api'
const BaiThuocAnalysis = defineAsyncComponent(() => import('@/components/BaiThuocAnalysis.vue'))
import PublicTopBar from '@/components/PublicTopBar.vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import MedicalDisclaimer from '@/components/MedicalDisclaimer.vue'
import {
  rawUpper,
  rawLower,
  calculateBounds,
  processRows,
  computeAffectedOrgans,
  computeTongCuong,
  nguHanhZTuRows,
  round2,
  fmt,
  type InputData,
  type TongCuong,
  type NguHanhZ,
} from '@/lib/meridianAnalysis'
// TÁI DÙNG đúng component của app (đều tự mang style scoped) → Bát Cương "y hệt" trang Kết Quả Đo.
import BienChungWheel from '@/components/BienChungWheel.vue'
import BatCuongOrgans from '@/components/BatCuongOrgans.vue'
import BatCuongSummary from '@/components/BatCuongSummary.vue'
import { buildDinhVi, parseAmDuong, type PhapTriByBaiThuoc } from '@/lib/dinhVi'
const BatCuongFigure3D = defineAsyncComponent(() => import('@/components/BatCuongFigure3D.vue'))
// Ngũ Hành Hồi Tác (luồng "lý luận" của Mục IV) — component tự fetch /huyet-vi + /nhht/cong-thuc
// (cả hai đều @Public), chỉ cần truyền z/huThuc/viTri hiện tại; KHÔNG truyền các prop "…Truoc" vì
// demo không có bệnh nhân thật để so lần đo trước (component tự ẩn khối hồi tác khi thiếu).
const PhuongHuyetNguDu = defineAsyncComponent(() => import('@/components/PhuongHuyetNguDu.vue'))
// Thương Hàn lý luận (luồng "lý luận" của Mục V) — bản CHỈ XEM tự viết (không dùng thẳng
// ThuongHanDoiChieu.vue vì component đó là công cụ HỎI BỆNH tương tác — tick dấu hiệu, bấm chọn
// chứng — hợp với thầy thuốc đang khám bệnh nhân thật, không hợp khách xem thử không click gì cả).
// Gọi thẳng CÙNG endpoint /thuong-han-chung/goi-y (đã @Public), tự hiển thị phẳng toàn bộ chứng +
// chủ phương, không cần bấm vào đâu. theKinhMap truyền null cho locateLucKinh: lib có bảng dự phòng
// tĩnh cho đúng trường hợp này (xem lib/lucKinh.ts), y hệt lúc app không tải được bảng sống.
import { locateLucKinh, dinhViChac, KINH_META, type KinhSlug } from '@/lib/lucKinh'

interface SyndromeLite {
  id?: number
  name?: string
  code?: string
  outputCell?: string
}
interface DemoExam {
  inputData?: InputData
  createdAt?: string
  /** Giờ đo thầy thuốc đặt/sửa — ưu tiên hơn createdAt khi hiển thị. */
  thoiDiemKham?: string
  excelSyndromes?: SyndromeLite[]
  modernSyndromes?: SyndromeLite[]
  syndromes?: { syndrome_name?: string; phap_tri?: string }[]
}
interface DemoPatient {
  fullName?: string
  gender?: string | null
  dateOfBirth?: string | null
}

interface DemoCase {
  patient: DemoPatient
  examination: DemoExam
}

const loading = ref(true)
const error = ref<string | null>(null)
const cases = ref<DemoCase[]>([])
const activeIndex = ref(0)
const slideDir = ref<'next' | 'prev'>('next')

const caseCount = computed(() => cases.value.length)
const activeCase = computed<DemoCase | null>(() => cases.value[activeIndex.value] ?? null)
const patient = computed<DemoPatient | null>(() => activeCase.value?.patient ?? null)
const examination = computed<DemoExam | null>(() => activeCase.value?.examination ?? null)

const inputData = computed<InputData | null>(() => examination.value?.inputData ?? null)

function nextCase() {
  const n = caseCount.value
  if (n < 2) return
  slideDir.value = 'next'
  activeIndex.value = (activeIndex.value + 1) % n
}
function prevCase() {
  const n = caseCount.value
  if (n < 2) return
  slideDir.value = 'prev'
  activeIndex.value = (activeIndex.value - 1 + n) % n
}
function goCase(i: number) {
  if (i < 0 || i >= caseCount.value || i === activeIndex.value) return
  slideDir.value = i > activeIndex.value ? 'next' : 'prev'
  activeIndex.value = i
}

// Lướt ngang (touch) để chuyển ca — bỏ qua nếu thao tác nghiêng về cuộn dọc.
let touchStartX = 0
let touchStartY = 0
function onTouchStart(e: TouchEvent) {
  const t = e.changedTouches[0]
  if (!t) return
  touchStartX = t.screenX
  touchStartY = t.screenY
}
function onTouchEnd(e: TouchEvent) {
  const t = e.changedTouches[0]
  if (!t || caseCount.value < 2) return
  const dx = t.screenX - touchStartX
  const dy = t.screenY - touchStartY
  if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return
  if (dx < 0) nextCase()
  else prevCase()
}

const upperRowsRaw = computed(() => rawUpper(inputData.value))
const lowerRowsRaw = computed(() => rawLower(inputData.value))
const upperStats = computed(() => calculateBounds(upperRowsRaw.value))
const lowerStats = computed(() => calculateBounds(lowerRowsRaw.value))
const upperRows = computed(() => processRows(upperRowsRaw.value, upperStats.value))
const lowerRows = computed(() => processRows(lowerRowsRaw.value, lowerStats.value))

// Chẩn đoán ĐẦY ĐỦ (khí · huyết · hư-thực + explain "vì sao") — CHÉP nguyên logic app để
// BatCuongSummary hiển thị y hệt (số kinh lệch, ngưỡng, lý do).
const diagnosis = computed(() => {
  let huTrenCount = 0, sumDiffTren = 0, allTrenZero = true
  upperRows.value.forEach((r) => {
    const diff = round2(r.avg - upperStats.value.mean)
    sumDiffTren += diff
    if (r.avg !== 0) allTrenZero = false
    if (diff < 0) huTrenCount++
  })
  let khi = 'Bình thường'
  if (allTrenZero) khi = ''
  else if (huTrenCount > 3) khi = 'Khí hư'
  else if (huTrenCount < 3) khi = 'Khí thịnh'
  else khi = sumDiffTren < 0 ? 'Khí hư' : sumDiffTren > 0 ? 'Khí thịnh' : ''

  let huDuoiCount = 0, sumDiffDuoi = 0, allDuoiZero = true
  lowerRows.value.forEach((r) => {
    const diff = round2(r.avg - lowerStats.value.mean)
    sumDiffDuoi += diff
    if (r.avg !== 0) allDuoiZero = false
    if (diff < 0) huDuoiCount++
  })
  let huyet = 'Bình thường'
  if (allDuoiZero) huyet = ''
  else if (huDuoiCount > 3) huyet = 'Huyết hư'
  else if (huDuoiCount < 3) huyet = 'Huyết thịnh'
  else huyet = sumDiffDuoi < 0 ? 'Huyết hư' : sumDiffDuoi > 0 ? 'Huyết thịnh' : ''

  let lechCount = 0, totalLech = 0, tongDoTren = 0, tongDoDuoi = 0
  const lechRows: { name: string; tone: 'high' | 'low' }[] = []
  upperRows.value.forEach((r) => {
    if (r.avg === 0) return
    tongDoTren++
    if (r.avg > upperStats.value.upperBound || r.avg < upperStats.value.lowerBound) {
      lechCount++
      totalLech += Math.abs(r.avg - upperStats.value.mean)
      lechRows.push({ name: r.name, tone: r.avg > upperStats.value.upperBound ? 'high' : 'low' })
    }
  })
  lowerRows.value.forEach((r) => {
    if (r.avg === 0) return
    tongDoDuoi++
    if (r.avg > lowerStats.value.upperBound || r.avg < lowerStats.value.lowerBound) {
      lechCount++
      totalLech += Math.abs(r.avg - lowerStats.value.mean)
      lechRows.push({ name: r.name, tone: r.avg > lowerStats.value.upperBound ? 'high' : 'low' })
    }
  })
  const tongDo = tongDoTren + tongDoDuoi
  totalLech = round2(totalLech)
  let avgSd = 0
  if (tongDoTren > 0 && tongDoDuoi > 0) avgSd = (upperStats.value.sd + lowerStats.value.sd) / 2
  else if (tongDoTren > 0) avgSd = upperStats.value.sd
  else if (tongDoDuoi > 0) avgSd = lowerStats.value.sd
  const nguong = round2(avgSd * tongDo)
  let huThuc = ''
  if (tongDo > 0) {
    if (lechCount === 0) huThuc = 'Bình thường'
    else if (lechCount >= Math.ceil(tongDo / 2) || totalLech >= nguong) huThuc = 'Thực'
    else huThuc = 'Hư'
  }
  return {
    khi, huyet, huThuc,
    explain: {
      khi: { huCount: huTrenCount, total: upperRows.value.length, sum: round2(sumDiffTren), mean: round2(upperStats.value.mean) },
      huyet: { huCount: huDuoiCount, total: lowerRows.value.length, sum: round2(sumDiffDuoi), mean: round2(lowerStats.value.mean) },
      huThuc: { lechCount, tongDo, totalLech, nguong, lechRows },
    },
  }
})

const excelSyndromes = computed(() => examination.value?.excelSyndromes ?? [])
const modernSyndromes = computed(() => examination.value?.modernSyndromes ?? [])

// ── Phương huyệt + bài thuốc theo thể (dữ liệu tham chiếu công khai /demo/chan-doan-ref) — y hệt app ──
function phNormName(s: string | null | undefined): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
const PHUONG_PHAP_ORDER = ['Châm', 'Cứu', 'Châm + Cứu', 'Bấm Huyệt', 'Điện Châm', 'Bổ', 'Tả']
interface PhacDoRow {
  idHuyet: number
  vai_tro_huyet?: string | null
  phuong_phap_tac_dong?: string | null
  y_nghia_huyet?: string | null
  benh?: { chung_trang?: string | null } | null
  huyetVi?: { ten_huyet?: string | null; ma_huyet?: string | null } | null
}
interface BenhLite {
  id: number
  name?: string | null
  baiThuocList?: { id: number; ten_bai_thuoc?: string | null; name?: string | null }[]
}
interface CauThanhLink {
  ghi_chu: string | null
  compound: { tieuket: string | null; chung_trang: string | null } | null
  component: { tieuket: string | null; chung_trang: string | null } | null
}
const phacDoAll = ref<PhacDoRow[]>([])
const benhList = ref<BenhLite[]>([])
const cauThanhAll = ref<CauThanhLink[]>([])
const refLoaded = ref(false)

// ── Cây "MÔ HÌNH BỆNH LÝ" (y hệt app): thể YHCT gốc làm cha, bệnh YHHĐ (khớp gốc qua benh_cau_thanh)
//    lồng làm con + cơ chế (ghi_chu); bệnh YHHĐ không gốc đứng riêng. ──
const causeMap = computed(() => {
  const m = new Map<string, { root: string; rootLabel: string; ghiChu: string | null }>()
  for (const c of cauThanhAll.value) {
    const comp = c.compound?.tieuket || c.compound?.chung_trang
    const root = c.component?.tieuket || c.component?.chung_trang
    if (!comp || !root) continue
    m.set(phNormName(comp), { root: phNormName(root), rootLabel: root, ghiChu: c.ghi_chu })
  }
  return m
})
interface SyndNode {
  name: string
  cell: string
  kind: 'yhct' | 'yhhd'
  rootLabel?: string
  ghiChu?: string | null
  children: SyndNode[]
}
const syndromeTree = computed<{ nodes: SyndNode[]; standalone: SyndNode[] }>(() => {
  const excel = excelSyndromes.value
  const modern = modernSyndromes.value
  const excelNorm = new Set(excel.map((s) => phNormName(s.name)))
  const consumed = new Set<number>()
  const nodes: SyndNode[] = []
  for (const e of excel) {
    const en = phNormName(e.name)
    const children: SyndNode[] = []
    modern.forEach((m, mi) => {
      const link = causeMap.value.get(phNormName(m.name))
      if (link && link.root === en) {
        children.push({ name: m.name ?? '', cell: m.outputCell ?? '', kind: 'yhhd', ghiChu: link.ghiChu, children: [] })
        consumed.add(m.id ?? mi)
      }
    })
    nodes.push({ name: e.name ?? '', cell: e.outputCell ?? '', kind: 'yhct', children })
  }
  const standalone: SyndNode[] = []
  modern.forEach((m, mi) => {
    if (consumed.has(m.id ?? mi)) return
    const link = causeMap.value.get(phNormName(m.name))
    const hasRootUnmeasured = link && !excelNorm.has(link.root)
    standalone.push({
      name: m.name ?? '',
      cell: m.outputCell ?? '',
      kind: 'yhhd',
      rootLabel: hasRootUnmeasured ? link!.rootLabel : undefined,
      ghiChu: hasRootUnmeasured ? link!.ghiChu : undefined,
      children: [],
    })
  })
  return { nodes, standalone }
})

const measuredNames = computed<Set<string>>(() => {
  const out = new Set<string>()
  for (const s of excelSyndromes.value) {
    const n = phNormName(s.name)
    if (n) out.add(n)
  }
  return out
})
// Toàn bộ phương huyệt khớp thể đo được (khử trùng theo idHuyet) — GIỐNG matchedPhuongHuyetList của app.
const matchedPhuongHuyet = computed<PhacDoRow[]>(() => {
  const names = measuredNames.value
  if (!names.size) return []
  const seen = new Set<number>()
  const out: PhacDoRow[] = []
  for (const r of phacDoAll.value) {
    const bn = phNormName(r.benh?.chung_trang)
    if (!bn || !names.has(bn) || seen.has(r.idHuyet)) continue
    seen.add(r.idHuyet)
    out.push(r)
  }
  return out
})
const phuongHuyetGroups = computed<{ method: string; items: PhacDoRow[] }[]>(() => {
  const g = new Map<string, PhacDoRow[]>()
  for (const r of matchedPhuongHuyet.value) {
    const k = (r.phuong_phap_tac_dong || '').trim() || 'Khác'
    const arr = g.get(k) ?? []
    arr.push(r)
    g.set(k, arr)
  }
  const out: { method: string; items: PhacDoRow[] }[] = []
  for (const m of PHUONG_PHAP_ORDER) {
    const it = g.get(m)
    if (it) {
      out.push({ method: m, items: it })
      g.delete(m)
    }
  }
  for (const [m, it] of g) out.push({ method: m, items: it })
  return out
})
// Bài thuốc khớp thể đo được (từ benhList.baiThuocList theo id thể) — khử trùng.
const matchedBaiThuoc = computed<{ id: number; ten: string }[]>(() => {
  const byId = new Map(benhList.value.map((b) => [b.id, b]))
  const seen = new Set<number>()
  const out: { id: number; ten: string }[] = []
  for (const s of excelSyndromes.value) {
    if (s.id == null) continue
    const detail = byId.get(s.id)
    for (const b of detail?.baiThuocList ?? []) {
      if (seen.has(b.id)) continue
      seen.add(b.id)
      out.push({ id: b.id, ten: b.ten_bai_thuoc || b.name || `Bài #${b.id}` })
    }
  }
  return out
})
// Nạp chi tiết bài thuốc (đủ vị thuốc) cho phân tích — lazy theo id.
const formulaMap = ref<Record<number, any>>({})
async function ensureFormula(id: number) {
  if (formulaMap.value[id]) return
  try {
    const r = await api.get<{ baiThuoc: any }>(`/demo/bai-thuoc/${id}`)
    formulaMap.value[id] = r.baiThuoc
  } catch {
    /* bỏ qua */
  }
}
const activeFormulaId = ref<number | null>(null)
function pickFormula(id: number) {
  activeFormulaId.value = activeFormulaId.value === id ? null : id
  if (activeFormulaId.value != null) void ensureFormula(id)
}
const activeFormula = computed(() => (activeFormulaId.value != null ? formulaMap.value[activeFormulaId.value] ?? null : null))

// ── V. Phương Dược — bảng vị thuốc GỘP từ mọi bài khớp (bản CHỈ XEM của "Thang Đặc Trị" trong
// app — bỏ tick chọn/sửa liều/lưu đơn, vì demo không có bệnh nhân thật để lưu vào). Cần nạp ĐỦ
// chi tiết mọi bài khớp (không chỉ bài đang xem), nên watch matchedBaiThuoc để nạp nền hết 1 lượt.
const tongHopLoading = ref(false)
watch(
  () => matchedBaiThuoc.value.map((b) => b.id).join(','),
  async () => {
    const ids = matchedBaiThuoc.value.map((b) => b.id)
    if (!ids.length) return
    tongHopLoading.value = true
    try {
      await Promise.all(ids.map((id) => ensureFormula(id)))
    } finally {
      tongHopLoading.value = false
    }
  },
  { immediate: true },
)
interface TongHopViItem {
  key: string
  ten: string
  ma_huyet?: string | null
  so_bai: number
  tu_bai: string[]
  vai_tro: string | null
  lieu_goi_y: string | null
}
// Gộp vị thuốc từ MỌI bài khớp, bỏ trùng theo vị, đếm số bài chứa vị rồi xếp giảm dần (thông
// dụng → đặc trị) — giống hệt logic "Thang Đặc Trị" của app, chỉ bỏ phần chỉnh sửa/lưu.
const tongHopViThuoc = computed<TongHopViItem[]>(() => {
  const map = new Map<string, TongHopViItem>()
  for (const b of matchedBaiThuoc.value) {
    const full = formulaMap.value[b.id]
    const seenInBai = new Set<string>()
    for (const ct of full?.chiTietViThuoc ?? []) {
      const ten = (ct.viThuoc?.ten_vi_thuoc || '').trim() || (ct.idViThuoc != null ? `#${ct.idViThuoc}` : '—')
      const key = ct.idViThuoc != null ? 'id:' + ct.idViThuoc : 'ten:' + ten.toLowerCase()
      if (seenInBai.has(key)) continue
      seenInBai.add(key)
      let it = map.get(key)
      if (!it) {
        it = { key, ten, so_bai: 0, tu_bai: [], vai_tro: ct.vai_tro || null, lieu_goi_y: null }
        map.set(key, it)
      }
      it.so_bai++
      if (!it.tu_bai.includes(b.ten)) it.tu_bai.push(b.ten)
      const lieuKho = (ct.lieu_luong || '').trim()
      if (!it.lieu_goi_y && lieuKho && lieuKho !== '*') it.lieu_goi_y = lieuKho
      if (!it.vai_tro && ct.vai_tro) it.vai_tro = ct.vai_tro
    }
  }
  return [...map.values()].sort((a, b) => b.so_bai - a.so_bai || a.ten.localeCompare(b.ten, 'vi'))
})

// ── Tạng phủ đang bệnh để VẼ lên hình người 3D (BatCuongFigure3D) + 2 cột thẻ (BatCuongOrgans) ──
const affectedOrgans = computed(() =>
  computeAffectedOrgans(upperRows.value, lowerRows.value, upperStats.value, lowerStats.value),
)
// 12 tạng phủ bày QUANH hình: lục tạng trái · lục phủ phải; gắn trạng thái Bát Cương nếu có.
const ALL_ORGANS: { name: string; organ: string }[] = [
  { name: 'Tâm', organ: 'Tâm' },
  { name: 'Bào', organ: 'Tâm bào' },
  { name: 'Phế', organ: 'Phế' },
  { name: 'Can', organ: 'Can' },
  { name: 'Tỳ', organ: 'Tỳ' },
  { name: 'Thận', organ: 'Thận' },
  { name: 'Tiểu', organ: 'Tiểu Trường' },
  { name: 'Đại', organ: 'Đại Trường' },
  { name: 'Vị', organ: 'Vị' },
  { name: 'Đởm', organ: 'Đởm' },
  { name: 'Bàng', organ: 'Bàng quang' },
  { name: 'Tam', organ: 'Tam tiêu' },
]
const organStateMap = computed(() => new Map(affectedOrgans.value.map((o) => [o.name, o])))
function organsWith(names: string[]) {
  const m = organStateMap.value
  return ALL_ORGANS.filter((o) => names.includes(o.name)).map((o) => ({ ...o, state: m.get(o.name) ?? null }))
}
const organsTang = computed(() => organsWith(['Tâm', 'Bào', 'Phế', 'Can', 'Tỳ', 'Thận']))
const organsPhu = computed(() => organsWith(['Tiểu', 'Đại', 'Vị', 'Đởm', 'Bàng', 'Tam']))
const tongCuong = computed<TongCuong>(() => {
  const orgs = affectedOrgans.value
  const nhiet = orgs.filter((o) => o.temp === 'nhiet' || o.temp === 'mixed').length
  const han = orgs.filter((o) => o.temp === 'han' || o.temp === 'mixed').length
  const bieu = orgs.filter((o) => o.depth === 'bieu' || o.depth === 'mixed').length
  const ly = orgs.filter((o) => o.depth === 'ly' || o.depth === 'mixed').length
  return computeTongCuong(nhiet, han, bieu, ly, diagnosis.value.huThuc)
})
// z ngũ hành cho luồng NHHT lý luận (Mục IV) — cùng lib với trang thật, không tự tính riêng.
const nguHanhZ = computed<NguHanhZ>(() =>
  nguHanhZTuRows(upperRows.value, lowerRows.value, upperStats.value, lowerStats.value),
)
const ivTab = ref<'thong-ke' | 'nhht'>('thong-ke')
const matchedBenhIds = computed<number[]>(() => excelSyndromes.value.map((s) => s.id).filter((id): id is number => id != null))

// Mục V — luồng Thương Hàn lý luận: kinh Lục Kinh suy từ các thể đo được + Bát Cương (giống hệt lib
// trang thật, theKinhMap=null dùng bảng dự phòng tĩnh có sẵn trong lib).
const lucKinhVerdict = computed(() => locateLucKinh(excelSyndromes.value.map((s) => s.name ?? ''), tongCuong.value, null))
// Chip "Lục kinh (Thương hàn)" của tab Định Vị — PHẢI suy từ lucKinhVerdict (kinh trội + tập kinh
// của các thể ĐO ĐƯỢC), giống hệt dinhViKinhChips của trang thật (MeridianResultsView.vue). Trước
// đây khối "①ĐỊNH VỊ" dùng chung vòng lặp generic render axis.gd-luc-kinh.tags (union luc_kinh của
// MỌI pháp trị thuộc MỌI bài thuốc khớp thể) — một nguồn hoàn toàn khác, nên nói ngược khối "Kết
// luận Lục Kinh" ngay phía trên (vd kết luận Thái Dương nhưng chip lại không có Thái Dương). Không
// cần dữ liệu lịch sử toàn hệ thống — theThuongHan đã có sẵn trong lucKinhVerdict của CHÍNH ca này.
const dinhViKinhChips = computed(() => {
  const v = lucKinhVerdict.value
  if (!v) return []
  const counts: Partial<Record<KinhSlug, number>> = {}
  for (const t of v.theThuongHan) counts[t.kinh] = (counts[t.kinh] ?? 0) + 1
  const tapKinh = Object.keys(counts) as KinhSlug[]
  const order = [v.kinh.slug, ...tapKinh.filter((s) => s !== v.kinh.slug)] as KinhSlug[]
  return order.map((s) => ({ slug: s, ten: KINH_META[s].ten, count: counts[s] ?? 0, troi: s === v.kinh.slug }))
})
const vTab = ref<'thong-ke' | 'thuong-han'>('thong-ke')

// Bản CHỈ XEM của Thương Hàn — gọi thẳng cùng API công khai mà ThuongHanDoiChieu.vue dùng, tự hiển
// thị phẳng toàn bộ chứng khớp kinh + chủ phương, KHÔNG cần bấm/tick gì (khác bản tương tác trong
// app — công cụ hỏi bệnh, chỉ hợp khi có bệnh nhân thật để hỏi).
interface ViPhuongLite { ten: string; lieuGoc: string; vaiTro?: string; canhBaoLieu?: string | null }
interface ChungRowLite {
  slug: string; ten: string; han: string | null; phan_loai: string; de_cuong: string | null
  chu_phuong: { ten: string; han: string; viThuoc: ViPhuongLite[] } | null
}
const thuongHanChungList = ref<ChungRowLite[]>([])
const thuongHanLoading = ref(false)
const PHAN_LOAI_TEN: Record<string, string> = { 'kinh-chung': 'Kinh chứng', 'phu-chung': 'Phủ chứng', 'bien-chung': 'Biến chứng', 'kiem-chung': 'Kiêm chứng' }
const DO_TIN_NHAN: Record<string, string> = { cao: 'Cao', vua: 'Vừa', thap: 'Thấp' }
watch(
  () => lucKinhVerdict.value?.kinh.slug ?? null,
  async (slug) => {
    thuongHanChungList.value = []
    if (!slug) return
    thuongHanLoading.value = true
    try {
      const res = await api.get<{ chung: ChungRowLite[] }>(`/thuong-han-chung/goi-y?kinh=${encodeURIComponent(slug)}`)
      thuongHanChungList.value = res.chung ?? []
    } catch {
      thuongHanChungList.value = []
    } finally {
      thuongHanLoading.value = false
    }
  },
  { immediate: true },
)
// Mở tab mới bay tới huyệt trên đồ hình 3D CÔNG KHAI (không cần đăng nhập) — khác bản app dùng
// /app/kinh-mach-3d (yêu cầu đăng nhập), demo dùng /xem-3d (PublicKinhMach3DView).
function gotoAcuMap(ma?: string | null) {
  if (!ma) return
  window.open(`/xem-3d?focus=${encodeURIComponent(ma)}`, '_blank')
}
// Kinh "lệch" kèm tạng phủ + bên + hướng biên độ → BatCuongSummary hiện 2 nhóm chip Hư-Thực.
const huThucLechOrgans = computed(() => {
  const rows = diagnosis.value.explain?.huThuc?.lechRows ?? []
  const m = organStateMap.value
  return rows.map((r) => {
    const st = m.get(r.name)
    const fallback = ALL_ORGANS.find((o) => o.name === r.name)?.organ ?? r.name
    return { name: r.name, organ: st?.organ ?? fallback, side: st?.side ?? '', tone: r.tone }
  })
})
// Tiêu điểm: bấm 1 tạng phủ / 1 chip Bát Cương → SÁNG hàng kinh tương ứng ở bảng đo (y như app).
const bcFocus = ref<string | null>(null)
function toggleBcFocus(key: string) {
  bcFocus.value = bcFocus.value === key ? null : key
}
const focusRowSet = computed<Set<string> | null>(() => {
  const f = bcFocus.value
  if (!f) return null
  if (f.startsWith('organ:')) return new Set([f.slice(6)])
  if (f === 'group:khi') return new Set(upperRows.value.map((r) => r.name))
  if (f === 'group:huyet') return new Set(lowerRows.value.map((r) => r.name))
  if (f === 'group:huthuc') return new Set((diagnosis.value.explain?.huThuc?.lechRows ?? []).map((r) => r.name))
  return null
})
function rowFocusClass(name: string): string {
  const set = focusRowSet.value
  if (!set) return ''
  return set.has(name) ? 'dkq-row-focus' : 'dkq-row-dim'
}

// ── 3 tab như app + đồ hình/Định Vị Tab ③ (Biện Chứng – Pháp Trị) ──
// ĐỊNH VỊ THẬT: từ bài thuốc khớp thể → pháp trị → tag Lục Kinh / Vệ-Khí-Dinh-Huyết / Tam Tiêu /
// Tác Nhân / Nội Sinh · tính chất (buildDinhVi) — y hệt panel Định Vị/Tác Nhân của app.
const dinhViRows = ref<PhapTriByBaiThuoc[]>([])
const dinhViLoading = ref(false)
async function loadDinhVi() {
  const ids = matchedBaiThuoc.value.map((b) => b.id)
  if (!ids.length) {
    dinhViRows.value = []
    return
  }
  dinhViLoading.value = true
  try {
    dinhViRows.value = await api.get<PhapTriByBaiThuoc[]>(
      `/demo/phap-tri-by-bai-thuoc?baiThuocIds=${ids.join(',')}`,
    )
  } catch {
    dinhViRows.value = []
  } finally {
    dinhViLoading.value = false
  }
}
const dinhVi = computed(() => buildDinhVi(dinhViRows.value))
const tinhChatAxis = computed(() => dinhVi.value.axes.find((ax) => ax.key === 'tinh-chat') ?? null)
const otherAxes = computed(() => dinhVi.value.axes.filter((ax) => ax.key !== 'tinh-chat'))
const DINH_VI_LOP: ReadonlyArray<{ n: 1 | 2 | 3 | 4 | 5; ten: string; han: string }> = [
  { n: 1, ten: 'Âm Dương', han: '太極' },
  { n: 3, ten: 'Tạng Phủ', han: '臟腑' },
  { n: 4, ten: 'Lục Khí', han: '六氣' },
  { n: 5, ten: 'Lục Kinh', han: '六經' },
]
const dinhViLop = ref<1 | 2 | 3 | 4 | 5>(1)
// Chiếu định vị vào không gian đồ hình: {kinh, khi, tang, amDuong} cho BienChungWheel tô sáng.
const dinhViWheel = computed(() => {
  const tagsOf = (nhom: string): string[] => {
    for (const ax of dinhVi.value.axes) for (const sg of ax.subgroups) if (sg.nhom === nhom) return sg.tags.map((t) => t.label)
    return []
  }
  // Gộp kinh sáng = tag engine ∪ {kinh trội + kinh phụ của KẾT LUẬN Thương Hàn} để kinh trội chắc
  // chắn không bị mờ — y hệt trang thật (lucKinhVerdict mới có từ khi làm luồng Thương Hàn ở Mục V).
  const v = lucKinhVerdict.value
  const kinhSet = new Set(tagsOf('gd-luc-kinh'))
  if (v) { kinhSet.add(v.kinh.ten); if (v.phu) kinhSet.add(v.phu.ten) }
  return {
    kinh: [...kinhSet],
    khi: tagsOf('tn-luc-khi'),
    tang: dinhVi.value.tangPhu.map((t) => t.label),
    amDuong: parseAmDuong(tongCuong.value.amDuong),
    amLoai: tongCuong.value.loai,
    troi: v ? v.kinh.ten : null,
  }
})
const activeView = ref<1 | 2 | 3>(1)
// Đổi ca / nạp xong tham chiếu → bài thuốc khớp đổi → nạp lại định vị. Về lớp Âm Dương cho mỗi ca.
watch(
  () => matchedBaiThuoc.value.map((b) => b.id).join(','),
  () => {
    dinhViLop.value = 1
    void loadDinhVi()
  },
)

const examDate = computed(() => {
  const raw = examination.value?.thoiDiemKham ?? examination.value?.createdAt
  if (!raw) return '—'
  const d = new Date(raw)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN')
})

const patientAge = computed(() => {
  const dob = patient.value?.dateOfBirth
  if (!dob) return '—'
  const y = new Date(dob).getFullYear()
  const age = new Date().getFullYear() - y
  return isNaN(age) ? '—' : String(age)
})

function signClass(sign: string): string {
  if (sign === '+') return 'sign-high'
  if (sign === '-') return 'sign-low'
  return 'sign-zero'
}

onMounted(async () => {
  try {
    // Ưu tiên endpoint nhiều ca (slider). Nếu backend chưa cập nhật endpoint này
    // (deploy thủ công trên VPS), lùi về endpoint 1 ca để trang vẫn chạy.
    try {
      const res = await api.get<{ cases: DemoCase[] }>('/demo/ket-qua-do-list?count=5')
      cases.value = Array.isArray(res?.cases) ? res.cases : []
    } catch {
      cases.value = []
    }
    if (!cases.value.length) {
      const one = await api.get<DemoCase>('/demo/ket-qua-do')
      if (one?.examination) cases.value = [one]
    }
    if (!cases.value.length) {
      error.value = 'Chưa có ca đo mẫu nào để hiển thị.'
    }
    // Dữ liệu tham chiếu (phác đồ + bài thuốc theo thể) để hiện phương huyệt + bài thuốc y hệt app.
    try {
      const ref = await api.get<{ phacDo: PhacDoRow[]; benhList: BenhLite[]; cauThanh: CauThanhLink[] }>('/demo/chan-doan-ref')
      phacDoAll.value = ref.phacDo ?? []
      benhList.value = ref.benhList ?? []
      cauThanhAll.value = ref.cauThanh ?? []
      refLoaded.value = true
    } catch {
      /* thiếu phương huyệt/bài thuốc nhưng bảng đo + Bát Cương vẫn hiện */
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="dkq">
    <PublicTopBar title="Kết Quả Đo Kinh Lạc" />
    <AppBreadcrumb />

    <div class="dkq-body">
      <div v-if="loading" class="dkq-loading">
        <div class="dkq-spinner" aria-hidden="true"></div>
        <p>Đang tải kết quả đo mẫu…</p>
      </div>

      <div v-else-if="error" class="dkq-error">
        <p><strong>Không tải được kết quả đo mẫu.</strong></p>
        <p>{{ error }}</p>
      </div>

      <template v-else>
        <!-- Giới thiệu -->
        <header class="dkq-head">
          <span class="dkq-eyebrow">Đo Kinh Lạc · Bản Xem Thử</span>
          <h1 class="dkq-title">Một Bản Đo Kinh Lạc Thật, Đọc Ngay Trên Màn Hình</h1>
          <p class="dkq-sub">
            Chỉ số nhiệt độ 12 đường kinh được đối chiếu ngưỡng sinh lý, tự suy ra kinh cường –
            kinh nhược, kết luận Bát Cương và các thể bệnh. Đây là dữ liệu THẬT (đã ẩn danh bệnh
            nhân) — muốn đo cho bệnh nhân của bạn, hãy đăng nhập.
          </p>
        </header>

        <!-- Thanh chuyển ca (slider) -->
        <div v-if="caseCount > 1" class="dkq-slider-nav">
          <button class="dkq-nav-btn" type="button" aria-label="Ca trước" @click="prevCase">‹</button>
          <div class="dkq-nav-mid">
            <span class="dkq-nav-count">Ca {{ activeIndex + 1 }} / {{ caseCount }}</span>
            <div class="dkq-dots">
              <button
                v-for="i in caseCount"
                :key="i"
                type="button"
                class="dkq-dot"
                :class="{ active: i - 1 === activeIndex }"
                :aria-label="`Xem ca ${i}`"
                @click="goCase(i - 1)"
              ></button>
            </div>
          </div>
          <button class="dkq-nav-btn" type="button" aria-label="Ca kế tiếp" @click="nextCase">›</button>
        </div>
        <p v-if="caseCount > 1" class="dkq-swipe-hint">Vuốt ngang hoặc bấm ‹ › để xem ca khác</p>

        <!-- Vùng nội dung 1 ca — đổi khi lướt slider -->
        <div class="dkq-viewport" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
          <div :key="activeIndex" class="dkq-case" :class="slideDir === 'next' ? 'in-next' : 'in-prev'">
            <!-- Thông tin ca đo -->
            <div class="dkq-meta">
              <span>Bệnh Nhân: <strong>{{ patient?.fullName || 'Bệnh Nhân Mẫu' }}</strong></span>
              <span class="dot">•</span>
              <span>Giới Tính: <strong>{{ patient?.gender || '—' }}</strong></span>
              <span class="dot">•</span>
              <span>Tuổi: <strong>{{ patientAge }}</strong></span>
              <span class="dot">•</span>
              <span>Ngày Đo: <strong>{{ examDate }}</strong></span>
            </div>

            <!-- Thanh 3 tab như app -->
            <nav class="dkq-tabs" role="tablist" aria-label="Chuyển view kết quả">
              <button type="button" class="dkq-tab" :class="{ on: activeView === 1 }" @click="activeView = 1">
                <b>1</b> Kết Quả Đo &amp; Bát Cương
              </button>
              <button type="button" class="dkq-tab" :class="{ on: activeView === 2 }" @click="activeView = 2">
                <b>2</b> Chẩn Đoán &amp; Điều Trị
                <span class="dkq-tab-badge">{{ excelSyndromes.length }} thể · {{ matchedPhuongHuyet.length }} huyệt · {{ matchedBaiThuoc.length }} bài</span>
              </button>
              <button type="button" class="dkq-tab" :class="{ on: activeView === 3 }" @click="activeView = 3">
                <b>3</b> Biện Chứng – Pháp Trị
              </button>
            </nav>

            <!-- ═══ VIEW 1: Bát Cương (II) LÊN ĐẦU rồi Kết quả đo (I) — thứ tự y hệt app ═══ -->
            <div v-show="activeView === 1" class="dkq-view1">
        <!-- I. Bảng chỉ số -->
        <section class="dkq-card">
          <h2 class="dkq-sec-title"><span class="dkq-num">I</span> Bảng Chỉ Số Nhiệt Độ</h2>

          <!-- Chi trên -->
          <div class="dkq-group-label">Chi Trên (Tay)</div>
          <div class="dkq-stats">
            <div class="st"><span class="st-k">Max / Min</span><span class="st-v">{{ fmt(upperStats.max, 1) }} / {{ fmt(upperStats.min, 1) }}</span></div>
            <div class="st"><span class="st-k">Biên Độ</span><span class="st-v">{{ fmt(upperStats.range, 1) }}</span></div>
            <div class="st"><span class="st-k">Bình Quân</span><span class="st-v">{{ fmt(upperStats.mean, 2) }}</span></div>
            <div class="st"><span class="st-k">Sai Số</span><span class="st-v">{{ fmt(upperStats.sd, 2) }}</span></div>
            <div class="st"><span class="st-k">Ngưỡng Trên / Dưới</span><span class="st-v">{{ fmt(upperStats.upperBound, 2) }} / {{ fmt(upperStats.lowerBound, 2) }}</span></div>
          </div>
          <div class="dkq-table-wrap">
            <table class="dkq-table">
              <thead>
                <tr>
                  <th>Kinh</th><th>T</th><th>Trái</th><th>TB</th><th>Lệch</th><th>Phải</th><th>P</th><th>|T−P|</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in upperRows" :key="'u-' + i" :class="rowFocusClass(r.name)">
                  <td class="td-name">{{ r.name }}</td>
                  <td :class="signClass(r.leftSign)">{{ r.leftSign }}</td>
                  <td>{{ fmt(r.left, 1) }}</td>
                  <td class="td-avg">{{ fmt(r.avg, 2) }}</td>
                  <td :class="r.diff > 0 ? 'sign-high' : (r.diff < 0 ? 'sign-low' : '')">{{ r.diff > 0 ? '+' : '' }}{{ fmt(r.diff, 2) }}</td>
                  <td>{{ fmt(r.right, 1) }}</td>
                  <td :class="signClass(r.rightSign)">{{ r.rightSign }}</td>
                  <td>{{ fmt(r.absDiff, 1) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Chi dưới -->
          <div class="dkq-group-label">Chi Dưới (Chân)</div>
          <div class="dkq-stats">
            <div class="st"><span class="st-k">Max / Min</span><span class="st-v">{{ fmt(lowerStats.max, 1) }} / {{ fmt(lowerStats.min, 1) }}</span></div>
            <div class="st"><span class="st-k">Biên Độ</span><span class="st-v">{{ fmt(lowerStats.range, 1) }}</span></div>
            <div class="st"><span class="st-k">Bình Quân</span><span class="st-v">{{ fmt(lowerStats.mean, 2) }}</span></div>
            <div class="st"><span class="st-k">Sai Số</span><span class="st-v">{{ fmt(lowerStats.sd, 2) }}</span></div>
            <div class="st"><span class="st-k">Ngưỡng Trên / Dưới</span><span class="st-v">{{ fmt(lowerStats.upperBound, 2) }} / {{ fmt(lowerStats.lowerBound, 2) }}</span></div>
          </div>
          <div class="dkq-table-wrap">
            <table class="dkq-table">
              <thead>
                <tr>
                  <th>Kinh</th><th>T</th><th>Trái</th><th>TB</th><th>Lệch</th><th>Phải</th><th>P</th><th>|T−P|</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in lowerRows" :key="'l-' + i" :class="rowFocusClass(r.name)">
                  <td class="td-name">{{ r.name }}</td>
                  <td :class="signClass(r.leftSign)">{{ r.leftSign }}</td>
                  <td>{{ fmt(r.left, 1) }}</td>
                  <td class="td-avg">{{ fmt(r.avg, 2) }}</td>
                  <td :class="r.diff > 0 ? 'sign-high' : (r.diff < 0 ? 'sign-low' : '')">{{ r.diff > 0 ? '+' : '' }}{{ fmt(r.diff, 2) }}</td>
                  <td>{{ fmt(r.right, 1) }}</td>
                  <td :class="signClass(r.rightSign)">{{ r.rightSign }}</td>
                  <td>{{ fmt(r.absDiff, 1) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="dkq-legend">
            <span class="sign-high">+</span> Cao (Thực) ·
            <span class="sign-low">−</span> Thấp (Hư) ·
            <span class="sign-zero">0</span> Trong Ngưỡng
          </p>
        </section>

        <!-- II. KẾT LUẬN BÁT CƯƠNG — dùng ĐÚNG component của app: hình người 3D + 2 cột tạng phủ +
             khối Tóm Tắt Bát Cương (Tổng Cương · Biểu-Lý · Hư-Thực). Bấm 1 tạng phủ để soi hàng đo. -->
        <section class="dkq-card dkq-bc-band">
          <h2 class="dkq-sec-title"><span class="dkq-num">II</span> Kết Luận Bát Cương &amp; Chẩn Đoán</h2>
          <div class="dkq-bc-wrap">
            <div class="bc-figblock">
              <BatCuongOrgans class="bc-organs-col" :items="organsTang" :focus="bcFocus" @toggle="toggleBcFocus" />
              <BatCuongFigure3D
                class="bc-figure"
                :am-duong="tongCuong.amDuong"
                :hu-thuc="diagnosis.huThuc"
                :organs="affectedOrgans"
                :focus="bcFocus"
                @toggle="toggleBcFocus"
              />
              <BatCuongOrgans class="bc-organs-col" :items="organsPhu" :focus="bcFocus" @toggle="toggleBcFocus" />
            </div>
            <BatCuongSummary
              class="bc-summary"
              :tong-cuong="tongCuong"
              :khi="diagnosis.khi"
              :huyet="diagnosis.huyet"
              :hu-thuc="diagnosis.huThuc"
              :hu-thuc-organs="huThucLechOrgans"
              :explain="diagnosis.explain"
              :organs="affectedOrgans"
              :focus="bcFocus"
              @toggle="toggleBcFocus"
            />
          </div>
        </section>
            </div><!-- /VIEW 1 -->

            <!-- ═══ VIEW 2: Chẩn đoán & Điều trị — thể bệnh (trái) | phương huyệt (phải) + bài thuốc ═══ -->
            <div v-show="activeView === 2">
        <div class="dkq-dx-cols">
        <!-- III. MÔ HÌNH BỆNH LÝ — thẻ đánh số: thể YHCT gốc = cha, bệnh YHHĐ lồng con + căn cứ (y hệt app) -->
        <section class="dkq-card">
          <h2 class="dkq-sec-title"><span class="dkq-num">III</span> Mô Hình Bệnh Lý</h2>
          <h3 class="dkq-sub-label">Mô Hình Bệnh YHCT · Đông Y <em class="dkq-sub-hint">— {{ excelSyndromes.length }} thể YHCT · {{ modernSyndromes.length }} bệnh YHHĐ</em></h3>
          <div v-if="syndromeTree.nodes.length || syndromeTree.standalone.length" class="dkq-tree">
            <div v-for="(n, i) in syndromeTree.nodes" :key="'n-' + i" class="dkq-tcard">
              <div class="dkq-tcard-head">
                <span class="dkq-tcard-no">{{ i + 1 }}</span>
                <span class="dkq-tcard-name">{{ n.name }}</span>
                <span v-if="n.cell" class="dkq-tcard-cell">{{ n.cell }}</span>
              </div>
              <div v-for="(c, j) in n.children" :key="'c-' + j" class="dkq-tchild">
                <span class="dkq-tchild-line">
                  <span class="dkq-tchild-tag dkq-tchild-tag--yhhd">Biểu hiện YHHĐ</span>
                  <span class="dkq-tchild-name">{{ c.name }} <em v-if="c.cell">{{ c.cell }}</em></span>
                </span>
                <p v-if="c.ghiChu" class="dkq-tchild-note">{{ c.ghiChu }}</p>
              </div>
            </div>
            <div v-for="(s, i) in syndromeTree.standalone" :key="'s-' + i" class="dkq-tcard dkq-tcard--yhhd">
              <div class="dkq-tcard-head">
                <span class="dkq-tcard-no dkq-tcard-no--yhhd">{{ syndromeTree.nodes.length + i + 1 }}</span>
                <span class="dkq-tcard-name">{{ s.name }}</span>
                <span v-if="s.cell" class="dkq-tcard-cell dkq-tcard-cell--yhhd">{{ s.cell }}</span>
              </div>
              <div v-if="s.rootLabel" class="dkq-tchild">
                <span class="dkq-tchild-line">
                  <span class="dkq-tchild-tag dkq-tchild-tag--yhct">Gốc YHCT</span>
                  <span class="dkq-tchild-name">{{ s.rootLabel }}</span>
                </span>
                <p v-if="s.ghiChu" class="dkq-tchild-note">{{ s.ghiChu }}</p>
              </div>
            </div>
          </div>
          <p v-else class="dkq-empty">Không có mô hình bệnh nào khớp ở ca đo này.</p>
        </section>

        <!-- Cột phải: IV + V xếp chồng — y hệt .phacdo-col của trang thật (không bọc thì CSS Grid
             tự đẩy phần tử thứ 3 xuống hàng mới ở CỘT TRÁI thay vì xếp dưới Mục IV). -->
        <div class="dkq-phacdo-col">
        <!-- IV — Phương huyệt: HAI LUỒNG như app — ① thống kê (huyệt khớp thể đo được, nhóm
             Châm/Cứu/Bổ/Tả) · ② NHHT lý luận (Ngũ Hành Hồi Tác, đối chiếu tự động từ số đo). -->
        <section class="dkq-card">
          <p class="dkq-phacdo-eyebrow">✎ Phác Đồ Điều Trị <span>Gộp tất cả các thể đo được</span></p>
          <h2 class="dkq-sec-title"><span class="dkq-num">IV</span> Phương Huyệt <small v-if="matchedPhuongHuyet.length">{{ matchedPhuongHuyet.length }} huyệt</small></h2>

          <div class="v-tabs">
            <button type="button" class="v-tab" :class="{ 'is-on': ivTab === 'thong-ke' }" @click="ivTab = 'thong-ke'">
              Đặc Trị <em>thống kê</em>
              <span v-if="matchedPhuongHuyet.length" class="v-tab-so">{{ matchedPhuongHuyet.length }}</span>
            </button>
            <button type="button" class="v-tab" :class="{ 'is-on': ivTab === 'nhht' }" @click="ivTab = 'nhht'">
              NHHT <em>lý luận</em>
            </button>
          </div>

          <div v-show="ivTab === 'thong-ke'">
            <template v-if="matchedPhuongHuyet.length">
              <div v-for="g in phuongHuyetGroups" :key="g.method" class="dkq-phg">
                <span class="dkq-phg-method">{{ g.method }} <em>({{ g.items.length }})</em></span>
                <div class="dkq-phg-chips">
                  <span
                    v-for="r in g.items"
                    :key="r.idHuyet"
                    class="dkq-huyet-chip"
                    :title="r.y_nghia_huyet || (r.huyetVi?.ten_huyet ?? '')"
                  >
                    {{ r.huyetVi?.ten_huyet }}<em v-if="r.huyetVi?.ma_huyet"> ({{ r.huyetVi.ma_huyet }})</em>
                  </span>
                </div>
              </div>
            </template>
            <p v-else class="dkq-empty">Các thể YHCT khớp chưa được cấu hình phương huyệt.</p>
          </div>

          <div v-show="ivTab === 'nhht'">
            <PhuongHuyetNguDu
              :z="nguHanhZ"
              :hu-thuc="diagnosis.huThuc"
              :vi-tri="tongCuong.viTri"
              :matched-benh-ids="matchedBenhIds"
              readonly
              @goto-acu="gotoAcuMap"
            />
          </div>
        </section>

        <!-- V — Phương Dược: HAI LUỒNG như app — ① thống kê (Thang Đặc Trị: bảng vị gộp, CHỈ XEM)
             · ② Thương Hàn lý luận (hỏi triệu chứng theo kinh → chứng/chủ phương khớp nhất). Bỏ
             tick chọn/sửa liều/lưu đơn ở cả hai — demo không có bệnh nhân thật để lưu.
             NẰM CÙNG CỘT PHẢI với Mục IV (xếp chồng), y hệt .phacdo-col của trang thật. -->
        <section v-if="matchedBaiThuoc.length || lucKinhVerdict" class="dkq-card">
          <p class="dkq-phacdo-eyebrow">✎ Phác Đồ Điều Trị <span>Gộp tất cả các thể đo được</span></p>
          <h2 class="dkq-sec-title"><span class="dkq-num">V</span> Phương Dược <small v-if="matchedBaiThuoc.length">{{ matchedBaiThuoc.length }} bài</small></h2>

          <div class="v-tabs">
            <button type="button" class="v-tab" :class="{ 'is-on': vTab === 'thong-ke' }" @click="vTab = 'thong-ke'">
              Thuốc Đặc Trị <em>thống kê</em>
              <span v-if="matchedBaiThuoc.length" class="v-tab-so">{{ matchedBaiThuoc.length }}</span>
            </button>
            <button type="button" class="v-tab" :class="{ 'is-on': vTab === 'thuong-han' }" @click="vTab = 'thuong-han'">
              Thuốc Thương Hàn <em>lý luận</em>
            </button>
          </div>

          <div v-show="vTab === 'thuong-han'">
            <p v-if="!lucKinhVerdict" class="dkq-empty">Các thể đo được chưa đủ căn cứ để định vị theo Thương Hàn.</p>
            <template v-else>
              <p class="dkq-th-kinh-lb">
                Lý luận Thương Hàn theo kinh <b>{{ lucKinhVerdict.kinh.ten }}</b>
                <em v-if="!dinhViChac(lucKinhVerdict)">— định vị chưa chắc, xem như gợi ý</em>
              </p>
              <p v-if="thuongHanLoading" class="dkq-empty">Đang tra chứng theo kinh…</p>
              <p v-else-if="!thuongHanChungList.length" class="dkq-empty">Chưa có chứng nào gắn kinh này trong kho.</p>
              <div v-else class="dkq-th-chung-list">
                <div v-for="c in thuongHanChungList" :key="c.slug" class="dkq-th-chung">
                  <div class="dkq-th-chung-head">
                    <span class="dkq-th-chung-loai">{{ PHAN_LOAI_TEN[c.phan_loai] || c.phan_loai }}</span>
                    <b class="dkq-th-chung-ten">{{ c.ten }}</b>
                    <em v-if="c.han" class="dkq-th-chung-han">{{ c.han }}</em>
                  </div>
                  <p v-if="c.de_cuong" class="dkq-th-chung-decuong">{{ c.de_cuong }}</p>
                  <div v-if="c.chu_phuong" class="dkq-tonghop" style="margin-top: 8px">
                    <div class="dkq-tonghop-head">
                      <span class="dkq-th-c dkq-th-c--name">{{ c.chu_phuong.ten }} — vị thuốc</span>
                      <span class="dkq-th-c dkq-th-c--lieu">Liều cổ phương</span>
                      <span class="dkq-th-c dkq-th-c--role">Vai trò</span>
                    </div>
                    <div v-for="(vi, i) in c.chu_phuong.viThuoc" :key="i" class="dkq-tonghop-row" style="grid-template-columns: 1fr 120px 90px">
                      <span class="dkq-th-c dkq-th-c--name">
                        <span class="dkq-th-ten">{{ vi.ten }}</span>
                        <span v-if="vi.canhBaoLieu" class="dkq-th-from" style="color: var(--danger, #b91c1c)">{{ vi.canhBaoLieu }}</span>
                      </span>
                      <span class="dkq-th-c dkq-th-c--lieu">{{ vi.lieuGoc }}</span>
                      <span class="dkq-th-c dkq-th-c--role">{{ vi.vaiTro || '—' }}</span>
                    </div>
                  </div>
                  <p v-else class="dkq-empty" style="margin-top: 6px">Chứng này chưa gắn chủ phương trong kho.</p>
                </div>
              </div>
            </template>
          </div>

          <div v-show="vTab === 'thong-ke'">
          <p v-if="tongHopLoading" class="dkq-empty">Đang gộp vị thuốc…</p>
          <div v-else-if="tongHopViThuoc.length" class="dkq-tonghop">
            <div class="dkq-tonghop-head">
              <span class="dkq-th-c dkq-th-c--name">Vị thuốc</span>
              <span class="dkq-th-c dkq-th-c--freq">Số bài</span>
              <span class="dkq-th-c dkq-th-c--lieu">Liều gợi ý</span>
              <span class="dkq-th-c dkq-th-c--role">Vai trò</span>
            </div>
            <div v-for="it in tongHopViThuoc" :key="it.key" class="dkq-tonghop-row">
              <span class="dkq-th-c dkq-th-c--name">
                <span class="dkq-th-ten">{{ it.ten }}</span>
                <span v-if="it.tu_bai.length" class="dkq-th-from" :title="'Từ: ' + it.tu_bai.join(' · ')">{{ it.tu_bai.length }} bài</span>
              </span>
              <span class="dkq-th-c dkq-th-c--freq">
                <span class="dkq-th-freq" :class="{ 'dkq-th-freq--core': it.so_bai >= 2 }">{{ it.so_bai }}</span>
              </span>
              <span class="dkq-th-c dkq-th-c--lieu">{{ it.lieu_goi_y || '—' }}</span>
              <span class="dkq-th-c dkq-th-c--role">{{ it.vai_tro || '—' }}</span>
            </div>
          </div>

          <template v-if="matchedBaiThuoc.length">
          <p class="dkq-phacdo-eyebrow" style="margin-top: 18px">Bài Thuốc Nguồn <span>bấm 1 bài để xem phân tích riêng</span></p>
          <div class="dkq-bt-list">
            <button
              v-for="b in matchedBaiThuoc"
              :key="b.id"
              type="button"
              class="dkq-bt-btn"
              :class="{ on: activeFormulaId === b.id }"
              @click="pickFormula(b.id)"
            >
              {{ b.ten }}
            </button>
          </div>
          <div v-if="activeFormula" class="dkq-bt-analysis">
            <BaiThuocAnalysis :bai-thuoc="activeFormula" hide-dosage />
          </div>
          <p v-else class="dkq-empty">Bấm một bài thuốc để xem phân tích tính vị quy kinh của từng vị thuốc.</p>
          </template>
          </div><!-- /vTab thong-ke -->
        </section>
        </div><!-- /dkq-phacdo-col -->
        </div><!-- /dkq-dx-cols (III trái | IV+V phải) -->
            </div><!-- /VIEW 2 -->

            <!-- ═══ VIEW 3: Biện Chứng – Pháp Trị — đồ hình Định Vị bóc lớp + Định Vị/Tác Nhân (y hệt app) ═══ -->
            <div v-show="activeView === 3">
              <section class="dkq-card">
                <h2 class="dkq-sec-title"><span class="dkq-num">III</span> Biện Chứng – Pháp Trị</h2>

                <!-- Thể bệnh đã đo (ngữ cảnh nguồn định vị) -->
                <div class="dkq-bcpt-the">
                  <span class="dkq-bcpt-the-lb">Thể bệnh:</span>
                  <template v-if="excelSyndromes.length">
                    <span v-for="(s, i) in excelSyndromes" :key="'bt-' + (s.code || i)" class="dkq-bcpt-the-chip">{{ s.name }}</span>
                  </template>
                  <span v-else class="dkq-empty">chưa xác định thể bệnh</span>
                </div>

                <!-- Kết luận Lục Kinh (Thương Hàn) — khối trang thật CÓ mà demo còn thiếu: giai đoạn,
                     độ tin, lý do suy luận. Bỏ phần chip "soi kinh" tương tác (cần dữ liệu số ca
                     lịch sử toàn hệ thống mà demo không có) — giữ nguyên phần thông tin văn bản. -->
                <section v-if="lucKinhVerdict" class="dkq-lk-verdict" :class="'dkq-lk-verdict--' + lucKinhVerdict.doTin">
                  <div class="dkq-lk-head">
                    <span class="dkq-lk-eyebrow">◎ Kết luận Lục Kinh</span>
                    <b class="dkq-lk-kinh">{{ lucKinhVerdict.kinh.ten }} <i>{{ lucKinhVerdict.kinh.han }}</i></b>
                    <span class="dkq-lk-giaidoan">{{ lucKinhVerdict.giaiDoan }}</span>
                    <span v-if="lucKinhVerdict.hopBenh && lucKinhVerdict.phu" class="dkq-lk-hopbenh">+ {{ lucKinhVerdict.phu.ten }}</span>
                    <span class="dkq-lk-badge" :class="'dkq-lk-badge--' + lucKinhVerdict.doTin">độ tin {{ DO_TIN_NHAN[lucKinhVerdict.doTin] }}</span>
                  </div>
                  <details class="dkq-lk-details">
                    <summary class="dkq-lk-summary">Vì sao · thể ngoài phạm vi</summary>
                    <p class="dkq-lk-ketluan">{{ lucKinhVerdict.ketLuan }}</p>
                    <ul class="dkq-lk-lydo">
                      <li v-for="(r, i) in lucKinhVerdict.lyDo" :key="i">{{ r }}</li>
                    </ul>
                    <p v-if="lucKinhVerdict.theNgoai.length" class="dkq-lk-ngoai">
                      Ngoài phạm vi Thương Hàn (chưa phân tích sâu): {{ lucKinhVerdict.theNgoai.join(', ') }}.
                    </p>
                  </details>
                </section>
                <p v-else-if="excelSyndromes.length" class="dkq-lk-none">
                  Các thể đo được chưa thuộc phạm vi Thương Hàn Lục Kinh — chưa định vị (có thể là nội thương / ôn bệnh / tạp bệnh).
                </p>

                <!-- ③ Tính chất (bát cương · chính khí) — ngang hàng đầu như app -->
                <section v-if="!dinhViLoading && tinhChatAxis" class="dkq-axis dkq-axis--tinhchat">
                  <h3 class="dkq-axis-title"><span class="dkq-axis-num">{{ tinhChatAxis.num }}</span> {{ tinhChatAxis.title }} <em>{{ tinhChatAxis.sub }}</em></h3>
                  <div v-for="sg in tinhChatAxis.subgroups" :key="sg.nhom" class="dkq-axis-sub">
                    <span class="dkq-axis-sub-lb">{{ sg.label }}</span>
                    <div class="dkq-dv-chips">
                      <span v-for="t in sg.tags" :key="t.name" class="dkq-dv-chip" :title="t.name">{{ t.label }}</span>
                      <span v-if="!sg.tags.length" class="dkq-empty">—</span>
                    </div>
                  </div>
                </section>

                <p v-if="dinhViLoading" class="dkq-empty">Đang tổng hợp định vị…</p>
                <div v-else class="dkq-t3">
                  <div class="dkq-t3-wheel">
                    <div class="dkq-t3-layers" role="tablist" aria-label="Bóc lớp đồ hình">
                      <button
                        v-for="l in DINH_VI_LOP"
                        :key="l.n"
                        type="button"
                        class="dkq-t3-layer"
                        :class="{ on: dinhViLop === l.n, done: dinhViLop >= l.n }"
                        @click="dinhViLop = l.n"
                      ><b>{{ l.n }}</b> {{ l.ten }} <i>{{ l.han }}</i></button>
                    </div>
                    <BienChungWheel :lop="dinhViLop" :dinhvi="dinhViWheel" />
                    <p class="dkq-t3-cap">Bấm bóc từng lớp (Âm Dương → Lục Kinh). Ô <b>sáng vàng</b> = bệnh nhân có; mờ = không.</p>
                  </div>
                  <div class="dkq-t3-side">
                    <p v-if="dinhVi.isEmpty" class="dkq-empty">Các thể bệnh trên chưa có liên kết bài thuốc → chưa suy được định vị.</p>
                    <div class="dkq-mini">
                      <span class="dkq-mini-lb">Tạng phủ tổn thương:</span>
                      <span v-for="o in dinhVi.tangPhu" :key="o.name" class="dkq-dv-chip">{{ o.label }}</span>
                      <span v-if="!dinhVi.tangPhu.length" class="dkq-empty">—</span>
                    </div>
                    <!-- ①② Định vị (Lục Kinh · Vệ-Khí-Dinh-Huyết · Tam Tiêu) + Tác nhân (Lục Khí · Nội Sinh/Độc) -->
                    <section v-for="ax in otherAxes" :key="ax.key" class="dkq-axis">
                      <h3 class="dkq-axis-title"><span class="dkq-axis-num">{{ ax.num }}</span> {{ ax.title }} <em>{{ ax.sub }}</em></h3>
                      <div v-for="sg in ax.subgroups" :key="sg.nhom" class="dkq-axis-sub">
                        <span class="dkq-axis-sub-lb">{{ sg.label }}</span>
                        <div v-if="sg.nhom === 'gd-luc-kinh'" class="dkq-dv-chips">
                          <span v-for="c in dinhViKinhChips" :key="c.slug" class="dkq-dv-chip" :class="{ 'dkq-dv-chip--troi': c.troi }">
                            <b v-if="c.troi">◉ </b>{{ c.ten }}<em v-if="c.count"> ·{{ c.count }}</em>
                          </span>
                          <span v-if="!dinhViKinhChips.length" class="dkq-empty">chưa định vị Lục Kinh</span>
                        </div>
                        <div v-else class="dkq-dv-chips">
                          <span v-for="t in sg.tags" :key="t.name" class="dkq-dv-chip" :title="t.name">{{ t.label }}</span>
                          <span v-if="!sg.tags.length" class="dkq-empty">—</span>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </section>
            </div><!-- /VIEW 3 -->
          </div>
        </div>
        <!-- /Vùng nội dung 1 ca -->

        <!-- CTA: tính năng nhập số đo cho bệnh nhân thật đang hoàn thiện — KHÔNG mời đăng nhập -->
        <div class="dkq-cta">
          <div>
            <h3 class="dkq-cta-title">Muốn Đo Cho Bệnh Nhân Của Bạn?</h3>
            <p class="dkq-cta-sub">Tính năng đang hoàn thiện — sau khi xong sẽ mở cho dùng miễn phí.</p>
          </div>
          <span class="dkq-cta-soon">Sắp có</span>
        </div>

        <MedicalDisclaimer context="measurement" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.dkq {
  min-height: 100vh;
  min-height: 100dvh; /* dvh: trừ thanh URL mobile → không nhảy layout */
  background: var(--bg-app);
  color: var(--text);
}
.dkq-body {
  /* Rộng như trang Kết Quả Đo trong app → đủ chỗ cho Bát Cương (hình | Tóm Tắt) nằm ngang,
     bảng đo 8 cột và 2 cột Tab ② không bị chật. */
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-5) var(--space-12);
}

.dkq-loading,
.dkq-error {
  text-align: center;
  padding: var(--space-12) var(--space-4);
  color: var(--text-muted);
}
.dkq-error {
  color: var(--danger);
}
.dkq-spinner {
  width: 36px;
  height: 36px;
  margin: 0 auto var(--space-3);
  border: 3px solid var(--gray-200);
  border-top-color: var(--brown-500);
  border-radius: 50%;
  animation: dkq-spin 0.7s linear infinite;
}
@keyframes dkq-spin {
  to {
    transform: rotate(360deg);
  }
}

.dkq-head {
  text-align: center;
  margin-bottom: var(--space-6);
}
.dkq-eyebrow {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--brown-600);
  margin-bottom: var(--space-2);
}
.dkq-title {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: var(--space-3);
}
.dkq-sub {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  line-height: 1.7;
  max-width: 40rem;
  margin: 0 auto;
}

.dkq-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  justify-content: center;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin-bottom: var(--space-6);
}
.dkq-meta strong {
  color: var(--text-brand);
}
.dkq-meta .dot {
  color: var(--brown-300);
}

.dkq-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-6);
  margin-bottom: var(--space-5);
}
.dkq-sec-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: var(--text);
  margin-bottom: var(--space-5);
}
.dkq-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  background: var(--brown-600);
  color: var(--white);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.dkq-group-label {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--brown-700);
  margin: var(--space-4) 0 var(--space-2);
}
.dkq-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.st {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-2);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  text-align: center;
}
.st-k {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--text-subtle);
}
.st-v {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text-brand);
}

.dkq-table-wrap {
  overflow-x: auto;
}
.dkq-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}
.dkq-table th {
  background: var(--brown-50);
  color: var(--brown-700);
  font-weight: 700;
  font-size: var(--font-size-xs);
  padding: 6px 8px;
  text-align: center;
  border: 1px solid var(--border);
  white-space: nowrap;
}
.dkq-table td {
  padding: 6px 8px;
  text-align: center;
  border: 1px solid var(--border);
  white-space: nowrap;
}
.td-name {
  font-weight: 700;
  color: var(--text);
  text-align: left !important;
}
.td-avg {
  background: var(--surface-2);
  font-weight: 600;
}
.sign-high {
  color: var(--danger-fg, #b4421f);
  font-weight: 800;
}
.sign-low {
  color: var(--info-fg, #2f6f8a);
  font-weight: 800;
}
.sign-zero {
  color: var(--text-subtle);
  font-weight: 700;
}
.dkq-legend {
  margin-top: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  text-align: center;
}
.dkq-legend span {
  margin: 0 2px;
}

.dkq-sub-label {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--brown-700);
  margin-bottom: var(--space-3);
}
.dkq-sub-label.mt {
  margin-top: var(--space-5);
}
.dkq-synd-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.synd {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--chip-pattern-bg, var(--surface-2));
  border: 1px solid var(--chip-pattern-border, var(--border));
  border-radius: var(--radius-md);
}
.synd--modern {
  background: var(--surface-2);
  border-color: var(--border);
}
.synd-i {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--brown-600);
  color: var(--white);
  font-size: var(--font-size-xs);
  font-weight: 700;
  flex-shrink: 0;
}
.synd-name {
  font-weight: 700;
  color: var(--text-brand);
  flex: 1;
  text-transform: capitalize;
}
.synd-cell {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--text-subtle);
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}
.dkq-empty {
  font-size: var(--font-size-sm);
  color: var(--text-subtle);
  font-style: italic;
}
/* Phương huyệt nhóm theo phương pháp + bài thuốc + phân tích */
/* Hai luồng song song (thống kê ↔ lý luận) — dùng chung ở cả Mục IV và Mục V, y hệt trang thật. */
.v-tabs { display: flex; gap: 6px; margin-bottom: 10px; border-bottom: 1px solid var(--brown-200); }
.v-tab { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border: 1px solid var(--brown-200); border-bottom: none; border-radius: 8px 8px 0 0; background: var(--surface-2); color: var(--brown-700); font-size: var(--font-size-sm); font-weight: 700; cursor: pointer; position: relative; top: 1px; }
.v-tab em { font-style: normal; font-weight: 500; font-size: 10px; opacity: 0.7; text-transform: none; }
.v-tab.is-on { background: var(--surface-1, #fff); color: var(--brown-800); border-color: var(--brown-200); box-shadow: 0 -2px 0 var(--brown-700) inset; }
.v-tab-so { padding: 0 7px; border-radius: 999px; background: rgba(0, 0, 0, 0.07); font-size: 10px; }
.v-luong { min-height: 40px; }

.dkq-phg { margin-bottom: var(--space-4); }
.dkq-phg-method {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--brown-700);
  margin-bottom: var(--space-2);
}
.dkq-phg-method em { font-style: normal; color: var(--text-subtle); font-weight: 600; }
.dkq-phg-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.dkq-huyet-chip {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-brand);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  padding: 4px 11px;
}
.dkq-huyet-chip em { font-style: normal; color: var(--text-subtle); font-size: 11px; }
.dkq-bt-list { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-4); }
.dkq-bt-btn {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--brown-800);
  background: var(--brown-50);
  border: 1px solid var(--brown-300);
  border-radius: var(--radius-full);
  padding: 6px 14px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.dkq-bt-btn:hover { border-color: var(--brown-600); }
.dkq-bt-btn.on { background: var(--brown-600); border-color: var(--brown-600); color: var(--white); }

/* V. Phương Dược — bảng "Thang Đặc Trị" gộp vị thuốc (chỉ xem, không tick/sửa liều) */
.dkq-tonghop { border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin-bottom: var(--space-4); }
.dkq-tonghop-head,
.dkq-tonghop-row {
  display: grid;
  grid-template-columns: 1fr 70px 120px 90px;
  gap: var(--space-2);
  align-items: center;
  padding: 7px 12px;
}
.dkq-tonghop-head {
  background: var(--surface-2);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--text-subtle);
}
.dkq-tonghop-row { border-top: 1px solid var(--border); font-size: var(--font-size-sm); }
.dkq-tonghop-row:nth-child(even) { background: var(--bg-app); }
.dkq-th-c--freq,
.dkq-th-c--role { text-align: center; }
.dkq-th-ten { font-weight: 700; color: var(--text); }
.dkq-th-from { display: block; font-size: 11px; color: var(--text-subtle); margin-top: 1px; }
.dkq-th-freq {
  display: inline-flex;
  min-width: 20px;
  justify-content: center;
  font-weight: 700;
  color: var(--text-subtle);
}
.dkq-th-freq--core { color: var(--brown-700); }
@media (max-width: 640px) {
  .dkq-tonghop-head,
  .dkq-tonghop-row { grid-template-columns: 1fr 50px 90px; }
  .dkq-th-c--role { display: none; }
}
.dkq-bt-analysis { margin-top: var(--space-4); border-top: 1px dashed var(--border); padding-top: var(--space-4); }

/* Thương Hàn lý luận — bản CHỈ XEM: danh sách chứng phẳng, không tick/bấm gì */
.dkq-th-kinh-lb { font-size: var(--font-size-sm); color: var(--text-subtle); margin-bottom: 12px; }
.dkq-th-kinh-lb b { color: var(--brown-800); }
.dkq-th-kinh-lb em { font-style: normal; color: var(--danger, #b45309); margin-left: 6px; }
.dkq-th-chung-list { display: flex; flex-direction: column; gap: var(--space-3); }
.dkq-th-chung { border: 1px solid var(--border); border-radius: var(--radius-md); padding: 10px 12px; }
.dkq-th-chung-head { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.dkq-th-chung-loai {
  font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em;
  color: var(--brown-700); background: var(--brown-50); border: 1px solid var(--brown-200);
  border-radius: 999px; padding: 1px 8px;
}
.dkq-th-chung-ten { font-size: var(--font-size-md); color: var(--text); }
.dkq-th-chung-han { font-style: normal; color: var(--text-subtle); font-size: 12px; }
.dkq-th-chung-decuong { font-size: var(--font-size-sm); color: var(--text-subtle); margin: 6px 0 0; }

/* Kết luận Lục Kinh (Tab 3) — port từ .lk-verdict của trang thật, đổi tiền tố dkq- để không đụng
   scoped style khác; bỏ phần chip "soi kinh" tương tác cần dữ liệu số ca lịch sử toàn hệ thống. */
.dkq-lk-verdict {
  margin: var(--space-2) 0 var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-left: 4px solid var(--brown-600);
  border-radius: var(--radius-md);
  background: var(--brown-50, var(--surface-2));
}
.dkq-lk-verdict--cao { border-left-color: #2e6f52; }
.dkq-lk-verdict--vua { border-left-color: var(--brown-600); }
.dkq-lk-verdict--thap { border-left-color: var(--gray-400, #b6a892); }
.dkq-lk-head { display: flex; align-items: baseline; gap: 6px 10px; flex-wrap: wrap; }
.dkq-lk-eyebrow { font-size: var(--font-size-xs); font-weight: 800; letter-spacing: .03em; color: var(--brown-700); text-transform: uppercase; align-self: center; }
.dkq-lk-kinh { font-size: var(--font-size-lg); font-weight: 800; color: var(--text-brand); }
.dkq-lk-kinh i { font-style: normal; font-weight: 600; opacity: .7; font-size: .85em; }
.dkq-lk-giaidoan { font-size: var(--font-size-sm); font-weight: 700; color: var(--brown-700); }
.dkq-lk-hopbenh { font-size: 11.5px; font-weight: 700; color: #fff; background: #8a5a2e; padding: 1px 9px; border-radius: 999px; }
.dkq-lk-badge { font-size: 11px; font-weight: 800; padding: 2px 10px; border-radius: 999px; white-space: nowrap; margin-left: auto; }
.dkq-lk-badge--cao { color: #fff; background: #2e6f52; }
.dkq-lk-badge--vua { color: #fff; background: var(--brown-600); }
.dkq-lk-badge--thap { color: var(--text-subtle); background: var(--surface-2); border: 1px solid var(--border); }
.dkq-lk-details { margin-top: var(--space-2); }
.dkq-lk-details > summary { font-size: 12px; font-weight: 700; color: var(--brown-700); cursor: pointer; list-style: revert; }
.dkq-lk-details[open] > summary { margin-bottom: var(--space-2); }
.dkq-lk-ketluan { margin: 0 0 var(--space-2); font-size: var(--font-size-sm); line-height: 1.55; color: var(--text); }
.dkq-lk-lydo { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 3px; }
.dkq-lk-lydo li { font-size: 12.5px; line-height: 1.45; color: var(--text-subtle); }
.dkq-lk-ngoai { margin: var(--space-2) 0 0; font-size: 12px; font-style: italic; color: var(--text-subtle); }
.dkq-lk-none { margin: var(--space-3) 0 var(--space-4); padding: var(--space-3) var(--space-4); font-size: 13px; font-style: italic; color: var(--text-subtle); background: var(--surface-2); border: 1px dashed var(--border); border-radius: var(--radius-md); }

.dkq-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
  padding: var(--space-6);
  background: linear-gradient(135deg, var(--brown-600) 0%, var(--brown-800) 100%);
  color: var(--white);
  border-radius: var(--radius-lg);
  margin-top: var(--space-6);
}
.dkq-cta-title {
  font-size: var(--font-size-lg);
  font-weight: 800;
  margin-bottom: 4px;
}
.dkq-cta-sub {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.82);
}
.dkq-cta-soon {
  flex-shrink: 0;
  height: 48px;
  padding: 0 var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px dashed rgba(255, 255, 255, 0.5);
  display: inline-flex;
  align-items: center;
  color: var(--white);
  font-size: var(--font-size-base);
  font-weight: 700;
  white-space: nowrap;
}

/* ── Slider chuyển ca ── */
.dkq-slider-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}
.dkq-nav-btn {
  flex: none;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--brown-700);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.dkq-nav-btn:hover {
  background: var(--brown-600);
  color: var(--white);
  border-color: var(--brown-600);
}
.dkq-nav-mid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 120px;
}
.dkq-nav-count {
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--brown-600);
}
.dkq-dots {
  display: flex;
  gap: 6px;
}
.dkq-dot {
  width: 9px;
  height: 9px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--brown-200);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.dkq-dot:hover {
  background: var(--brown-400);
}
.dkq-dot.active {
  background: var(--brown-600);
  transform: scale(1.25);
}
.dkq-swipe-hint {
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--text-subtle);
  margin: 0 0 var(--space-5);
}

/* ─── Thanh tab (giống mr-tabs trong app) ─── */
.dkq-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-2);
  margin-bottom: var(--space-5);
  background: var(--brown-50);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.dkq-tab {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 0;
  padding: var(--space-3) var(--space-4);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--brown-700);
  font-size: var(--font-size-sm);
  font-weight: 700;
  line-height: 1.25;
  text-align: center;
  cursor: pointer;
  transition: background 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;
}
.dkq-tab:hover {
  background: var(--surface);
}
.dkq-tab.on {
  background: var(--brown-600);
  border-color: var(--brown-600);
  color: var(--white);
  box-shadow: var(--shadow-sm);
}
.dkq-tab-badge {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.9;
}
.dkq-tab.on .dkq-tab-badge {
  color: var(--white);
}

/* ─── Tab 2: Mô Hình Bệnh Lý (trái, gọn) | Phương Huyệt (phải, rộng) — tỉ lệ như app ─── */
.dkq-dx-cols {
  display: grid;
  grid-template-columns: minmax(360px, 1fr) minmax(400px, 1.35fr);
  gap: var(--space-5);
  align-items: start;
}
/* Cột phải: IV Phương Huyệt + V Phương Dược xếp chồng trong CÙNG 1 cột — y hệt .phacdo-col */
.dkq-phacdo-col { display: flex; flex-direction: column; gap: var(--space-4); min-width: 0; }

/* ─── Tab 1 · Bát Cương (II) LÊN ĐẦU, bảng đo (I) xuống dưới — y hệt app ─── */
.dkq-view1 {
  display: flex;
  flex-direction: column;
}
.dkq-view1 > .dkq-bc-band {
  order: -1;
}
/* Trong band: hình 3D (trái, rộng) | Tóm Tắt Bát Cương (phải, gọn) — 2 cột như app */
.dkq-bc-wrap {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(360px, 1fr);
  gap: var(--space-4);
  align-items: start;
}
/* CHẶN grid "blowout": ô lưới mặc định min-width:auto → nội dung 2 cột của Tóm Tắt
   (Biểu-Lý | Hư-Thực) đội ô rộng hơn 1fr, tràn khỏi lề phải. min-width:0 giữ đúng track. */
.dkq-bc-wrap > * {
  min-width: 0;
}
/* Tóm Tắt: 2 cột Biểu-Lý | Hư-Thực — mỗi cột tối thiểu 210px để chip (vd "Tiểu Trường
   trái/phải (i)") không bị cắt; ô hẹp hơn thì tự gộp về 1 cột. */
.dkq-bc-wrap :deep(.bcs) {
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
}
/* DEMO — BÍ MẬT CÔNG NGHỆ: giấu các ghi chú LỘ CÔNG THỨC (số kinh lệch · ngưỡng · "vì sao"
   Âm-Dương · giải thích Biểu-Lý/Khí-Huyết). GIỮ kết luận "Hội chứng" + nút (i) để không xô layout. */
.dkq-bc-band :deep(.sum-why),
.dkq-bc-band :deep(.ad-reason) {
  display: none !important;
}
@media (max-width: 900px) {
  .dkq-bc-wrap {
    grid-template-columns: 1fr;
  }
}
.dkq-bc-wrap .bc-figblock {
  display: flex;
  gap: var(--space-2);
  align-items: stretch;
  width: 100%;
  min-width: 0;
  min-height: clamp(340px, 46vh, 480px);
}
.dkq-bc-wrap .bc-organs-col {
  flex: 0 0 84px;
}
.dkq-bc-wrap .bc-figure {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  height: auto;
  align-self: stretch;
}

/* Soi hàng kinh khi bấm 1 tạng phủ / nhóm Bát Cương (giống app) */
.dkq-table tr.dkq-row-focus td {
  background-color: rgba(254, 243, 199, 0.7);
}
.dkq-table tr.dkq-row-dim td {
  opacity: 0.4;
}

/* ─── Tab 3: đồ hình bóc lớp + định vị ─── */
.dkq-t3 {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: var(--space-6);
  align-items: start;
}
.dkq-t3-wheel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}
.dkq-t3-wheel :deep(svg) {
  max-width: 380px;
  height: auto;
}
.dkq-t3-layers {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: center;
}
.dkq-t3-layer {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--brown-700);
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.dkq-t3-layer b {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--brown-100, rgba(120, 53, 15, 0.12));
  color: var(--brown-700);
  font-size: 10px;
}
.dkq-t3-layer i {
  font-style: normal;
  opacity: 0.7;
  font-size: 11px;
}
.dkq-t3-layer:hover {
  background: var(--brown-50);
}
.dkq-t3-layer.on {
  background: var(--brown-600);
  border-color: var(--brown-600);
  color: var(--white);
}
.dkq-t3-layer.on b {
  background: rgba(255, 255, 255, 0.25);
  color: var(--white);
}
.dkq-t3-cap {
  font-size: var(--font-size-xs);
  color: var(--text-subtle);
  text-align: center;
  max-width: 44ch;
  margin: 0;
}
.dkq-t3-side {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.dkq-t3-block {
  padding: var(--space-3) var(--space-4);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
.dkq-dv-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: var(--space-2);
}
.dkq-dv-chip {
  padding: 4px 12px;
  background: #2f7355;
  border: 1px solid #2f7355;
  border-radius: 999px;
  color: var(--white);
  font-size: var(--font-size-xs);
  font-weight: 700;
}
/* Kinh trội (chủ kinh của Kết Luận Lục Kinh) — nổi hơn các kinh phụ trong cùng chip list. */
.dkq-dv-chip--troi {
  background: var(--brown-600);
  border-color: var(--brown-600);
  box-shadow: 0 0 0 2px var(--surface), 0 0 0 3.5px var(--brown-600);
}

/* Thể bệnh (ngữ cảnh định vị) + các trục Định Vị / Tác Nhân / Tính Chất */
.dkq-bcpt-the {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: var(--space-4);
}
.dkq-bcpt-the-lb {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--text-subtle);
}
.dkq-bcpt-the-chip {
  padding: 3px 10px;
  background: var(--brown-50);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--brown-700);
  font-size: var(--font-size-xs);
  font-weight: 700;
}
.dkq-axis {
  padding: var(--space-3) var(--space-4);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
.dkq-axis + .dkq-axis {
  margin-top: var(--space-3);
}
.dkq-axis--tinhchat {
  margin-bottom: var(--space-4);
}
.dkq-axis-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: var(--font-size-base);
  font-weight: 800;
  color: var(--brown-800, var(--text));
  margin: 0 0 var(--space-2);
}
.dkq-axis-title em {
  font-style: normal;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-subtle);
}
.dkq-axis-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--brown-600);
  color: var(--white);
  font-size: var(--font-size-sm);
  font-weight: 800;
}
/* Mỗi sub-nhóm: nhãn | chips cạnh nhau (giống bcpt-sub app), gạch đứt ngăn cách */
.dkq-axis-sub {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: var(--space-2) var(--space-3);
  align-items: baseline;
  padding: 5px 0;
}
.dkq-axis-sub + .dkq-axis-sub {
  border-top: 1px dashed var(--brown-100, var(--border));
}
.dkq-axis-sub-lb {
  font-size: 11px;
  font-weight: 700;
  color: var(--brown-700);
}
/* Tạng phủ tổn thương — nhãn + chips trên một dòng (bcpt-mini app) */
.dkq-mini {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: var(--space-4);
}
.dkq-mini-lb {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--brown-700);
}
@media (max-width: 640px) {
  .dkq-axis-sub {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}

/* ─── Tab 2 · Cây "Mô Hình Bệnh Lý": thể YHCT (cha) + bệnh YHHĐ lồng (con) + căn cứ ─── */
.dkq-sub-hint {
  font-weight: 500;
  font-style: normal;
  color: var(--text-subtle);
  font-size: 11px;
}
.dkq-phacdo-eyebrow {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: 800;
  color: var(--brown-700);
}
.dkq-phacdo-eyebrow span {
  font-weight: 500;
  color: var(--text-subtle);
}
.dkq-tree {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.dkq-tcard {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
}
.dkq-tcard--yhhd {
  border-left: 3px solid #43539b;
}
.dkq-tcard-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.dkq-tcard-no {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #e3f0e3;
  color: #15803d;
  font-size: 12px;
  font-weight: 800;
  flex: none;
}
.dkq-tcard-no--yhhd {
  background: #e8ecf8;
  color: #43539b;
}
.dkq-tcard-name {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text-brand);
  flex: 1;
}
.dkq-tcard-cell {
  font-size: 11px;
  font-weight: 800;
  color: #15803d;
  background: #e3f0e3;
  border-radius: 999px;
  padding: 2px 9px;
  white-space: nowrap;
}
.dkq-tcard-cell--yhhd {
  color: #43539b;
  background: #e8ecf8;
}
.dkq-tchild {
  margin: var(--space-2) 0 0 26px;
  padding-left: 10px;
  border-left: 2px dashed var(--brown-300, var(--border));
}
.dkq-tchild-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.dkq-tchild-tag {
  font-size: 10px;
  font-weight: 800;
  padding: 1px 7px;
  border-radius: 999px;
  white-space: nowrap;
}
.dkq-tchild-tag--yhhd {
  color: #43539b;
  background: #e8ecf8;
}
.dkq-tchild-tag--yhct {
  color: #92400e;
  background: #fdf0da;
}
.dkq-tchild-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-brand);
}
.dkq-tchild-name em {
  font-style: normal;
  font-size: 10px;
  color: var(--text-subtle);
}
.dkq-tchild-note {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #7c5a2e;
  font-style: italic;
}

.dkq-viewport {
  overflow: hidden;
}
.dkq-case.in-next {
  animation: dkq-in-next 0.26s ease;
}
.dkq-case.in-prev {
  animation: dkq-in-prev 0.26s ease;
}
@keyframes dkq-in-next {
  from { opacity: 0; transform: translateX(26px); }
  to { opacity: 1; transform: none; }
}
@keyframes dkq-in-prev {
  from { opacity: 0; transform: translateX(-26px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .dkq-case.in-next,
  .dkq-case.in-prev {
    animation: none;
  }
}

@media (max-width: 860px) {
  .dkq-dx-cols,
  .dkq-t3 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dkq-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .dkq-bc-wrap .bc-figblock {
    min-height: clamp(300px, 62vh, 440px);
  }
  .dkq-bc-wrap .bc-organs-col {
    flex: 0 0 76px;
  }
  .dkq-tab {
    flex-basis: 100%;
    flex-direction: row;
    justify-content: center;
    gap: var(--space-2);
  }
}
</style>
