<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePatientStore, type Patient } from '@/stores/patient'
import { api } from '@/services/api'

const router = useRouter()
const route = useRoute()

const patientId = computed(() => Number(route.params.patientId))
const examId = computed(() => Number(route.params.examId))
const patient = ref<Patient | null>(null)
const examination = ref<any>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const currentSyndromesList = computed(() => {
  return examination.value?.currentSyndromes || examination.value?.syndromes || []
})

const legacySyndromesList = computed(() => {
  return examination.value?.legacySyndromes || []
})

const comparisonRows = computed(() => {
  const rows = examination.value?.comparisonRows
  if (Array.isArray(rows) && rows.length) return rows

  const maxLen = Math.max(currentSyndromesList.value.length, legacySyndromesList.value.length)
  return Array.from({ length: maxLen }, (_, idx) => ({
    current: currentSyndromesList.value[idx] || null,
    legacy: legacySyndromesList.value[idx] || null
  }))
})

const excelSyndromesList = computed(() => {
  return examination.value?.excelSyndromes || []
})

interface BaiThuocLite {
  id: number
  ten_bai_thuoc: string
}
interface ViThuocLite {
  id: number
  ten_vi_thuoc: string | null
}
interface BaiThuocChiTietLite {
  id: number
  id_vi_thuoc: number | null
  lieu_luong: string | null
  vai_tro: string | null
  ghi_chu: string | null
  viThuoc?: ViThuocLite | null
}
interface BaiThuocFull {
  id: number
  ten_bai_thuoc: string
  nguon_goc?: string | null
  cach_dung?: string | null
  chiTietViThuoc?: BaiThuocChiTietLite[]
}
interface TrieuChungLite {
  id: number
  ten_trieu_chung: string
}
interface BenhDetail {
  id: number
  bai_thuoc_list?: BaiThuocLite[]
  trieu_chung_list?: TrieuChungLite[]
}
interface PhacDoApiRow {
  idPhacDo: number
  idBenh: number
  idHuyet: number
  phuong_phap_tac_dong: string | null
  ghi_chu_ky_thuat: string | null
  huyetVi: {
    idHuyet: number
    ten_huyet: string | null
    ma_huyet: string | null
    kinhMach?: { ten_kinh_mach: string | null; ten_viet_tat: string | null } | null
  } | null
}

const benhDetailsMap = ref<Map<number, BenhDetail>>(new Map())
const phacDoAllList = ref<PhacDoApiRow[]>([])
const baiThuocFullMap = ref<Map<number, BaiThuocFull>>(new Map())
const expandedBaiThuoc = ref<Set<number>>(new Set())

function toggleBaiThuoc(id: number) {
  const next = new Set(expandedBaiThuoc.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedBaiThuoc.value = next
}

function baiThuocChiTietOf(id: number): BaiThuocChiTietLite[] {
  return baiThuocFullMap.value.get(id)?.chiTietViThuoc ?? []
}

function viThuocLabel(ct: BaiThuocChiTietLite): string {
  return ct.viThuoc?.ten_vi_thuoc?.trim() || (ct.id_vi_thuoc != null ? `#${ct.id_vi_thuoc}` : '—')
}

const matchedBenhIds = computed<number[]>(() => {
  const all = Array.from(
    new Set((excelSyndromesList.value as Array<{ id: number }>).map((s) => s.id)),
  )
  const focus = excelFocusRuleId.value
  if (focus != null && all.includes(focus)) return [focus]
  return all
})

const matchedPhuongHuyetList = computed(() => {
  const ids = new Set(matchedBenhIds.value)
  if (!ids.size) return [] as PhacDoApiRow[]
  const seenHuyet = new Set<number>()
  const out: PhacDoApiRow[] = []
  for (const row of phacDoAllList.value) {
    if (!ids.has(row.idBenh)) continue
    if (seenHuyet.has(row.idHuyet)) continue
    seenHuyet.add(row.idHuyet)
    out.push(row)
  }
  return out
})

const matchedBaiThuocList = computed(() => {
  const seen = new Set<number>()
  const out: BaiThuocLite[] = []
  for (const id of matchedBenhIds.value) {
    const detail = benhDetailsMap.value.get(id)
    if (!detail?.bai_thuoc_list) continue
    for (const b of detail.bai_thuoc_list) {
      if (seen.has(b.id)) continue
      seen.add(b.id)
      out.push(b)
    }
  }
  return out
})

const matchedTrieuChungList = computed(() => {
  const seen = new Set<number>()
  const out: TrieuChungLite[] = []
  for (const id of matchedBenhIds.value) {
    const detail = benhDetailsMap.value.get(id)
    if (!detail?.trieu_chung_list) continue
    for (const t of detail.trieu_chung_list) {
      if (seen.has(t.id)) continue
      seen.add(t.id)
      out.push(t)
    }
  }
  return out
})

// ===== Chẩn đoán từ triệu chứng (Section VI) =====
interface DiagnosisMatchedSymptom {
  id: number
  ten_trieu_chung: string
}
// Đông Y: pháp trị thành phần của một thể bệnh (gộp & cộng dồn bằng chứng).
interface DiagnosisPhapTriRef {
  id: number
  nguyen_tac: string | null
  matchedCount: number
}
// Tây Y: pháp trị cầu nối (đối chiếu chuỗi triệu chứng → pháp trị → bệnh).
interface DiagnosisViaRef {
  id: number
  label: string
  percent: number
}
interface DiagnosisCandidate {
  id: number
  label: string
  subLabel: string | null
  groupLabel: string | null
  groupId: number | null
  score: number
  percent: number
  matchedCount: number
  total: number
  matched: DiagnosisMatchedSymptom[]
  members?: DiagnosisPhapTriRef[]
  via?: DiagnosisViaRef[]
}
interface DiagnosisResult {
  input: DiagnosisMatchedSymptom[]
  phapTri: DiagnosisCandidate[]
  phapTriTotal: number
  benhTayY: DiagnosisCandidate[]
  benhTayYTotal: number
}

const selectedDiagSymptomIds = ref<number[]>([])
const isDiagnosing = ref(false)
const diagError = ref<string | null>(null)
const diagResult = ref<DiagnosisResult | null>(null)
const hasRunDiagnosis = ref(false)

// Thu gọn kết quả: mặc định chỉ hiện top N mỗi cột, bấm để xem thêm (gọn trên màn nhỏ).
const DIAG_COLLAPSED_COUNT = 3
const expandDongY = ref(false)
const expandTayY = ref(false)
const phapTriShown = computed(() => {
  const list = diagResult.value?.phapTri ?? []
  return expandDongY.value ? list : list.slice(0, DIAG_COLLAPSED_COUNT)
})
const benhTayYShown = computed(() => {
  const list = diagResult.value?.benhTayY ?? []
  return expandTayY.value ? list : list.slice(0, DIAG_COLLAPSED_COUNT)
})

// Ô chọn MỞ RỘNG: toàn bộ triệu chứng (không giới hạn ở triệu chứng của bệnh đo được).
// Triệu chứng từ phép đo được tô đậm & chọn sẵn làm điểm xuất phát.
const allDiagSymptoms = ref<TrieuChungLite[]>([])
const diagSymptomSearch = ref('')
const measuredIdSet = computed(() => new Set(matchedTrieuChungList.value.map((t) => t.id)))
// Chọn sẵn triệu chứng từ phép đo MỘT LẦN (thực hiện trong loadData sau khi có dữ liệu).
// KHÔNG dùng watch ở đây: watch đánh giá hàm nguồn ngay khi đăng ký (trong setup), ép
// matchedBenhIds chạy trước khi excelFocusRuleId (khai báo bên dưới) khởi tạo → crash trắng màn.
const diagPreselected = ref(false)
// Gợi ý để THÊM (loại cái đã chọn cho gọn). CHƯA gõ → chỉ triệu chứng từ phép đo;
// CÓ gõ → tìm toàn bộ, ưu tiên triệu chứng từ phép đo, giới hạn cho gọn.
const DIAG_SUGGEST_LIMIT = 30
const filteredDiagSymptomOptions = computed<TrieuChungLite[]>(() => {
  const q = diagSymptomSearch.value.trim().toLowerCase()
  const selected = new Set(selectedDiagSymptomIds.value)
  if (!q) {
    return matchedTrieuChungList.value.filter((t) => !selected.has(t.id))
  }
  const m = measuredIdSet.value
  return allDiagSymptoms.value
    .filter((t) => !selected.has(t.id) && t.ten_trieu_chung.toLowerCase().includes(q))
    .sort(
      (a, b) =>
        Number(m.has(b.id)) - Number(m.has(a.id)) ||
        a.ten_trieu_chung.localeCompare(b.ten_trieu_chung, 'vi'),
    )
    .slice(0, DIAG_SUGGEST_LIMIT)
})
const selectedDiagSymptomList = computed<TrieuChungLite[]>(() => {
  const byId = new Map(allDiagSymptoms.value.map((t) => [t.id, t] as const))
  return selectedDiagSymptomIds.value
    .map((id) => byId.get(id))
    .filter((t): t is TrieuChungLite => t != null)
})

function toggleDiagSymptom(id: number) {
  selectedDiagSymptomIds.value = selectedDiagSymptomIds.value.includes(id)
    ? selectedDiagSymptomIds.value.filter((x) => x !== id)
    : [...selectedDiagSymptomIds.value, id]
}
// Hợp triệu chứng từ phép đo vào lựa chọn (không xoá triệu chứng bác sĩ tự thêm).
function selectMeasuredSymptoms() {
  const ids = new Set(selectedDiagSymptomIds.value)
  for (const t of matchedTrieuChungList.value) ids.add(t.id)
  selectedDiagSymptomIds.value = [...ids]
}
function clearDiagSymptoms() {
  selectedDiagSymptomIds.value = []
  diagResult.value = null
  hasRunDiagnosis.value = false
  diagError.value = null
}
async function runMeridianDiagnosis() {
  const ids = Array.from(new Set(selectedDiagSymptomIds.value))
  if (!ids.length || isDiagnosing.value) return
  isDiagnosing.value = true
  diagError.value = null
  expandDongY.value = false
  expandTayY.value = false
  try {
    const res = await api.post<DiagnosisResult>('/trieu-chung/chan-doan', {
      trieu_chung_ids: ids,
    })
    diagResult.value = res
    hasRunDiagnosis.value = true
  } catch (err: any) {
    console.error(err)
    diagError.value = 'Lỗi khi chẩn đoán: ' + (err.message || String(err))
  } finally {
    isDiagnosing.value = false
  }
}

function phapTriHref(id: number): string {
  return router.resolve({ name: 'treatments', query: { ptId: id } }).href
}
function benhTayYHref(id: number): string {
  return router.resolve({
    name: 'western-medicine',
    query: { tab: 'benh-tay-y', btyId: id },
  }).href
}
function confidenceClass(percent: number): string {
  if (percent >= 60) return 'conf-high'
  if (percent >= 30) return 'conf-mid'
  return 'conf-low'
}
function confidenceLabel(percent: number): string {
  if (percent >= 60) return 'Rất phù hợp'
  if (percent >= 30) return 'Khá phù hợp'
  return 'Gợi ý'
}
const hasAnyDiagResults = computed(
  () => !!diagResult.value && (diagResult.value.phapTri.length > 0 || diagResult.value.benhTayY.length > 0),
)
const unexplainedDiagSymptoms = computed<DiagnosisMatchedSymptom[]>(() => {
  const res = diagResult.value
  if (!res) return []
  const matchedIds = new Set<number>()
  for (const c of res.phapTri) for (const m of c.matched) matchedIds.add(m.id)
  for (const c of res.benhTayY) for (const m of c.matched) matchedIds.add(m.id)
  return res.input.filter((s) => !matchedIds.has(s.id))
})

// ===== Popup tra cứu Danh sách pháp trị (bấm vào mô hình bệnh Đông Y ở Section III) =====
interface PhapTriSearchRow {
  id: number
  chung_trang: string | null
  nguyen_tac: string | null
  trieu_chung_list?: { id: number; ten_trieu_chung: string }[]
  kinh_mach_list?: { idKinhMach: number; ten_kinh_mach: string | null; ten_viet_tat: string | null }[]
  bai_thuoc?: { id: number; ten_bai_thuoc: string } | null
  bai_thuoc_links?: { idBaiThuoc: number; thuTu: number; baiThuoc?: { id: number; ten_bai_thuoc: string } | null }[]
}
interface PtmBenhTayYLite {
  id: number
  ten_benh: string
  chungBenh?: { id: number; ten_chung_benh: string } | null
}
interface PtmBenhTayYGroup {
  key: string
  chungBenhName: string
  items: PtmBenhTayYLite[]
}

const showPhapTriModal = ref(false)
const phapTriModalContext = ref('')
const phapTriQuery = ref('')
const phapTriResults = ref<PhapTriSearchRow[]>([])
const phapTriTotal = ref(0)
const phapTriLoading = ref(false)
const phapTriError = ref<string | null>(null)
const phapTriBenhTayYMap = ref<Record<number, PtmBenhTayYLite[]>>({})
let phapTriSearchTimer: ReturnType<typeof setTimeout> | null = null
let suppressPhapTriWatch = false

function openPhapTriSearch(item: { name?: string | null }) {
  phapTriModalContext.value = (item?.name || '').trim()
  suppressPhapTriWatch = true
  phapTriQuery.value = phapTriModalContext.value
  showPhapTriModal.value = true
  void runPhapTriSearch()
}
function closePhapTriModal() {
  showPhapTriModal.value = false
}
async function runPhapTriSearch() {
  phapTriLoading.value = true
  phapTriError.value = null
  try {
    const q = phapTriQuery.value.trim()
    const res: any = await api.get(
      `/phap-tri/lite?page=1&limit=30&category=all&q=${encodeURIComponent(q)}`,
    )
    phapTriResults.value = res?.data ?? []
    phapTriTotal.value = Number(res?.total ?? 0)
    phapTriBenhTayYMap.value = res?.relatedBenhTayYByPtId ?? {}
  } catch (err: any) {
    console.error(err)
    phapTriError.value = 'Lỗi khi tìm pháp trị: ' + (err.message || String(err))
    phapTriResults.value = []
    phapTriTotal.value = 0
    phapTriBenhTayYMap.value = {}
  } finally {
    phapTriLoading.value = false
  }
}
watch(phapTriQuery, () => {
  if (suppressPhapTriWatch) {
    suppressPhapTriWatch = false
    return
  }
  if (!showPhapTriModal.value) return
  if (phapTriSearchTimer) clearTimeout(phapTriSearchTimer)
  phapTriSearchTimer = setTimeout(() => void runPhapTriSearch(), 350)
})

function ptKinhMachLabel(k: {
  idKinhMach: number
  ten_kinh_mach: string | null
  ten_viet_tat: string | null
}): string {
  return k.ten_kinh_mach || k.ten_viet_tat || `#${k.idKinhMach}`
}
function ptBaiThuocLabels(row: PhapTriSearchRow): string[] {
  const links = (row.bai_thuoc_links ?? [])
    .slice()
    .sort((a, b) => (a.thuTu ?? 0) - (b.thuTu ?? 0))
  const out = links.map((l) => l.baiThuoc?.ten_bai_thuoc || '').filter(Boolean)
  if (out.length) return out
  if (row.bai_thuoc?.ten_bai_thuoc) return [row.bai_thuoc.ten_bai_thuoc]
  return []
}
function ptBenhTayYGroups(ptId: number): PtmBenhTayYGroup[] {
  const list = phapTriBenhTayYMap.value[ptId] ?? []
  const groups = new Map<string, PtmBenhTayYGroup>()
  for (const bty of list) {
    const name = bty.chungBenh?.ten_chung_benh?.trim() || 'Khác'
    const key = bty.chungBenh?.id != null ? `cb-${bty.chungBenh.id}` : `name-${name.toLowerCase()}`
    const g = groups.get(key) ?? { key, chungBenhName: name, items: [] }
    g.items.push(bty)
    groups.set(key, g)
  }
  return Array.from(groups.values()).sort((a, b) =>
    a.chungBenhName.localeCompare(b.chungBenhName, 'vi'),
  )
}
function ptHasTayY(pt: PhapTriSearchRow): boolean {
  return (phapTriBenhTayYMap.value[pt.id]?.length ?? 0) > 0
}
/** Tách kết quả thành 2 cột: Tây Y (pháp trị có liên kết bệnh Tây Y) và Đông Y (phần còn lại). */
const phapTriColumns = computed(() => {
  const dongY: PhapTriSearchRow[] = []
  const tayY: PhapTriSearchRow[] = []
  for (const pt of phapTriResults.value) {
    if (ptHasTayY(pt)) tayY.push(pt)
    else dongY.push(pt)
  }
  return [
    { key: 'dongy', title: 'Đông Y', cls: 'ptm-col__title--dongy', items: dongY },
    { key: 'tayy', title: 'Tây Y', cls: 'ptm-col__title--tayy', items: tayY },
  ]
})

function phuongHuyetDisplayLabel(row: PhacDoApiRow): string {
  const h = row.huyetVi
  if (!h) return `#${row.idHuyet}`
  const parts = [h.ten_huyet, h.ma_huyet ? `(${h.ma_huyet})` : null].filter(Boolean)
  return parts.length ? parts.join(' ') : `#${h.idHuyet}`
}

function phuongHuyetKinhMach(row: PhacDoApiRow): string {
  const k = row.huyetVi?.kinhMach
  if (!k) return ''
  return k.ten_kinh_mach || k.ten_viet_tat || ''
}

const expandedPhuongHuyetNotes = ref<Set<number>>(new Set())

function togglePhuongHuyetNote(id: number) {
  const next = new Set(expandedPhuongHuyetNotes.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedPhuongHuyetNotes.value = next
}

const PHUONG_PHAP_ORDER = [
  'Châm',
  'Cứu',
  'Châm + Cứu',
  'Bấm Huyệt',
  'Điện Châm',
  'Bổ',
  'Tả',
] as const

const phuongHuyetGroups = computed(() => {
  const grouped = new Map<string, PhacDoApiRow[]>()
  for (const row of matchedPhuongHuyetList.value) {
    const key = (row.phuong_phap_tac_dong || '').trim() || 'Khác'
    const arr = grouped.get(key) ?? []
    arr.push(row)
    grouped.set(key, arr)
  }
  const out: Array<{ method: string; items: PhacDoApiRow[] }> = []
  for (const m of PHUONG_PHAP_ORDER) {
    const items = grouped.get(m)
    if (items) {
      out.push({ method: m, items })
      grouped.delete(m)
    }
  }
  for (const [m, items] of grouped) out.push({ method: m, items })
  return out
})

function methodChipClass(method: string): string {
  const slug = method
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/\s+\+\s+/g, '-')
    .replace(/\s+/g, '-')
  return `ph-group--${slug}`
}

const modernSyndromesList = computed(() => {
  return examination.value?.modernSyndromes || []
})

const examDisplay = computed(() => {
  if (!examination.value) return {
    ticketNumber: '#' + examId.value,
    date: '—',
    time: '—',
    doctor: '—',
    symptoms: '—',
    conclusion: '—',
    treatment: '—',
    advices: []
  }
  
  const d = new Date(examination.value.createdAt)
  const synds = examination.value.syndromes || []
  const mainSynd = synds.length > 0 ? synds[0] : null
  
  // Extract advice string into array if it exists
  const rawAdvice = mainSynd?.loi_khuyen || ''
  const adviceList = rawAdvice ? rawAdvice.split('\n').filter(Boolean) : []

  return {
    ticketNumber: '#' + examination.value.id,
    date: d.toLocaleDateString('vi-VN'),
    time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    doctor: '',
    symptoms: examination.value.notes || '',
    conclusion: mainSynd?.syndrome_name || '',
    treatment: mainSynd?.phap_tri || '',
    advices: adviceList
  }
})

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function calculateBounds(dataArr: any[]) {
  const allVals = dataArr.flatMap(d => [d.left, d.right]).filter(v => v > 0)
  if (!allVals.length) return { max: 0, min: 0, range: 0, mean: 0, sd: 0, upperBound: 0, lowerBound: 0 }
  
  const maxVal = Math.max(...allVals)
  const minVal = Math.min(...allVals)
  const range = maxVal - minVal
  
  // Trong phương pháp Lê Văn Sửu (theo Excel), trị số bình quân dùng (Max + Min) / 2
  const midPoint = round2((maxVal + minVal) / 2.0)
  const dungSai = round2(range / 6.0)
  
  return {
    max: maxVal,
    min: minVal,
    range: range,
    mean: midPoint, 
    sd: dungSai, 
    upperBound: round2(midPoint + dungSai),
    lowerBound: round2(midPoint - dungSai)
  }
}

const rawUpper = computed(() => {
  if (!examination.value?.inputData) return []
  const d = examination.value.inputData
  return [
    { name: 'Tiểu', left: d.tieutruongtrai || 0, right: d.tieutruongphai || 0 },
    { name: 'Tâm', left: d.tamtrai || 0, right: d.tamphai || 0 },
    { name: 'Tam', left: d.tamtieutrai || 0, right: d.tamtieuphai || 0 },
    { name: 'Bào', left: d.tambaotrai || 0, right: d.tambaophai || 0 },
    { name: 'Đại', left: d.daitrangtrai || 0, right: d.daitrangphai || 0 },
    { name: 'Phế', left: d.phetrai || 0, right: d.phephai || 0 },
  ]
})

const rawLower = computed(() => {
  if (!examination.value?.inputData) return []
  const d = examination.value.inputData
  return [
    { name: 'Bàng', left: d.bangquangtrai || 0, right: d.bangquangphai || 0 },
    { name: 'Thận', left: d.thantrai || 0, right: d.thanphai || 0 },
    { name: 'Đảm', left: d.damtrai || 0, right: d.damphai || 0 },
    { name: 'Vị', left: d.vitrai || 0, right: d.viphai || 0 },
    { name: 'Can', left: d.cantrai || 0, right: d.canphai || 0 },
    { name: 'Tỳ', left: d.tytrai || 0, right: d.typhai || 0 },
  ]
})

const upperStats = computed(() => calculateBounds(rawUpper.value))
const lowerStats = computed(() => calculateBounds(rawLower.value))

function getSign(val: number, lower: number, upper: number) {
  if (val > upper) return '+'
  if (val < lower) return '-'
  return '0'
}

function processRows(data: any[], stats: any) {
  return data.map(item => {
    const avg = round2((item.left + item.right) / 2)
    const diff = round2(avg - stats.mean)
    const absDiff = round2(Math.abs(item.left - item.right))
    return {
      ...item,
      leftSign: getSign(item.left, stats.lowerBound, stats.upperBound),
      rightSign: getSign(item.right, stats.lowerBound, stats.upperBound),
      avg,
      diff,
      absDiff
    }
  })
}

const upperRows = computed(() => processRows(rawUpper.value, upperStats.value))
const lowerRows = computed(() => processRows(rawLower.value, lowerStats.value))

const CHANNELS_FULL = {
  'Tiểu': 'Tiêu trường',
  'Tâm': 'Tâm',
  'Tam': 'Tam tiêu',
  'Bào': 'Tâm bào',
  'Đại': 'Đại tràng',
  'Phế': 'Phế',
  'Bàng': 'Bàng quang',
  'Thận': 'Thận',
  'Đảm': 'Đảm',
  'Vị': 'Vị',
  'Can': 'Can',
  'Tỳ': 'Tỳ'
}

function signToInt(sign: string) {
  if (sign === '+') return 1
  if (sign === '-') return -1
  return 0
}

function groupingV2(
  lyNhiet: string[],
  bieuNhiet: string[],
  lyHan: string[],
  bieuHan: string[],
  tenKinh: string,
  dauC8: number,
  dauC10: number,
  dauC11: number,
  c10: number,
  saiSo: number
) {
  const sum = dauC8 + dauC10 + dauC11

  if (sum === -3 && Math.abs(c10) > saiSo) {
    lyHan.push(tenKinh)
  } else if (sum === 3 && Math.abs(c10) > saiSo) {
    lyNhiet.push(tenKinh)
  } else if (sum === 2) {
    const side = dauC8 !== 0 ? ' trái' : ' phải'
    bieuNhiet.push(tenKinh + side)
  } else if (sum === -2) {
    const side = dauC8 !== 0 ? ' trái' : ' phải'
    bieuHan.push(tenKinh + side)
  } else if (sum === 1) {
    const side = dauC8 === dauC10 ? ' trái' : ' phải'
    bieuNhiet.push(tenKinh + side)
  } else if (sum === -1) {
    const side = dauC8 === dauC10 ? ' trái' : ' phải'
    bieuHan.push(tenKinh + side)
  } else if (dauC8 + dauC11 === 0 && dauC10 === 0) {
    bieuHan.push((dauC8 === -1 ? tenKinh + ' trái' : tenKinh + ' phải'))
    bieuNhiet.push((dauC8 === 1 ? tenKinh + ' trái' : tenKinh + ' phải'))
  } else if (dauC8 + dauC11 === 1) {
    const side = dauC8 === 1 ? ' trái' : ' phải'
    bieuNhiet.push(tenKinh + side)
  } else if (dauC8 + dauC11 === -1) {
    const side = dauC8 === -1 ? ' trái' : ' phải'
    bieuHan.push(tenKinh + side)
  }
}

const diagnosis = computed(() => {
  if (!examination.value?.inputData) return { amDuong: '—', khi: '—', huyet: '—' }
  
  const lower = lowerStats.value

  // 1. Âm / Dương (Dựa trên kinh Đảm so với trị số bình quân nhóm Chi dưới)
  const d = examination.value.inputData
  const avgDam = round2(((d.damtrai || 0) + (d.damphai || 0)) / 2)
  const midTuc = lower.mean
  const diffAmDuong = round2(avgDam - midTuc)

  let amDuong = 'Bình thường'
  if (diffAmDuong < 0) amDuong = 'Dương hư'
  else if (diffAmDuong > 0) amDuong = 'Âm hư'
  
  // 2. Khí (Dựa trên 6 kinh Chi trên)
  let huTrenCount = 0
  let sumDiffTren = 0
  let allTrenZero = true

  upperRows.value.forEach(r => {
    const diff = round2(r.avg - upperStats.value.mean)
    sumDiffTren += diff
    if (r.avg !== 0) allTrenZero = false
    if (diff < 0) huTrenCount++
  })

  let khi = 'Bình thường'
  if (allTrenZero) {
    khi = ''
  } else {
    if (huTrenCount > 3) khi = 'Khí hư'
    else if (huTrenCount < 3) khi = 'Khí thịnh'
    else {
      if (sumDiffTren < 0) khi = 'Khí hư'
      else if (sumDiffTren > 0) khi = 'Khí thịnh'
      else khi = ''
    }
  }

  // 3. Huyết (Dựa trên 6 kinh Chi dưới)
  let huDuoiCount = 0
  let sumDiffDuoi = 0
  let allDuoiZero = true

  lowerRows.value.forEach(r => {
    const diff = round2(r.avg - lowerStats.value.mean)
    sumDiffDuoi += diff
    if (r.avg !== 0) allDuoiZero = false
    if (diff < 0) huDuoiCount++
  })

  let huyet = 'Bình thường'
  if (allDuoiZero) {
    huyet = ''
  } else {
    if (huDuoiCount > 3) huyet = 'Huyết hư'
    else if (huDuoiCount < 3) huyet = 'Huyết thịnh'
    else {
      if (sumDiffDuoi < 0) huyet = 'Huyết hư'
      else if (sumDiffDuoi > 0) huyet = 'Huyết thịnh'
      else huyet = ''
    }
  }
  
  return { amDuong, khi, huyet }
})

const batCuong = computed(() => {
  const lyNhiet: string[] = []
  const bieuNhiet: string[] = []
  const lyHan: string[] = []
  const bieuHan: string[] = []

  const process = (row: any, saiSo: number) => {
    const tenKinh = CHANNELS_FULL[row.name as keyof typeof CHANNELS_FULL]
    if (!tenKinh) return

    const dauC8 = signToInt(row.leftSign)
    const dauC10 = signToInt(row.diff > 0 ? '+' : row.diff < 0 ? '-' : '0')
    const dauC11 = signToInt(row.rightSign)

    const dauC12 = row.absDiff > saiSo ? (row.left > row.right ? 1 : -1) : 0
    void dauC12 // Giữ biến để đồng bộ ngữ nghĩa với thuật toán gốc

    groupingV2(lyNhiet, bieuNhiet, lyHan, bieuHan, tenKinh, dauC8, dauC10, dauC11, row.diff, saiSo)
  }

  upperRows.value.forEach((row: any) => process(row, upperStats.value.sd))
  lowerRows.value.forEach((row: any) => process(row, lowerStats.value.sd))

  return {
    hanBieu: bieuHan.join(', '),
    hanLy: lyHan.join(', '),
    nhietBieu: bieuNhiet.join(', '),
    nhietLy: lyNhiet.join(', '),
  }
})

function getSignClass(sign: string) {
  if (sign === '+') return 'text-brown-600 font-bold text-center'
  if (sign === '-') return 'text-blue-600 font-bold text-center'
  return 'text-gray-500 font-bold text-center'
}

function fmt(val: number, decimals: number = 2) {
  return val.toFixed(decimals).replace('.', ',')
}

function getAge(dateStr?: string | null) {
  if (!dateStr) return '—'
  const birthYear = new Date(dateStr).getFullYear()
  const currentYear = new Date().getFullYear()
  const age = currentYear - birthYear
  return isNaN(age) ? '—' : age
}

onMounted(async () => {
  await loadData()
})

async function loadData() {
  isLoading.value = true
  try {
    // Dùng /bai-thuoc/lite (limit lớn) để tránh load nested relations nặng từ endpoint cũ.
    const [patientRes, examRes, benhListRes, phacDoRes, baiThuocRes, trieuChungRes] = await Promise.all([
      api.get<Patient>(`/patients/${patientId.value}`),
      api.get<any>(`/examinations/${examId.value}`),
      api.get<any>('/benh-dong-y'),
      api.get<any>('/phac-do-dieu-tri'),
      api.get<any>('/bai-thuoc/lite?page=1&limit=100000'),
      api.get<any>('/trieu-chung'),
    ])
    patient.value = patientRes
    examination.value = examRes

    // Toàn bộ triệu chứng cho ô chọn MỞ RỘNG ở Section VI (cho phép chọn ngoài phạm vi phép đo).
    const tcArr: TrieuChungLite[] = Array.isArray(trieuChungRes) ? trieuChungRes : trieuChungRes?.data ?? []
    allDiagSymptoms.value = tcArr.map((t) => ({ id: t.id, ten_trieu_chung: t.ten_trieu_chung }))

    const benhArr: BenhDetail[] = Array.isArray(benhListRes) ? benhListRes : benhListRes?.data ?? []
    const map = new Map<number, BenhDetail>()
    for (const b of benhArr) map.set(b.id, b)
    benhDetailsMap.value = map

    phacDoAllList.value = Array.isArray(phacDoRes) ? phacDoRes : phacDoRes?.data ?? []

    const btArr: BaiThuocFull[] = Array.isArray(baiThuocRes) ? baiThuocRes : baiThuocRes?.data ?? []
    const btMap = new Map<number, BaiThuocFull>()
    for (const b of btArr) btMap.set(b.id, b)
    baiThuocFullMap.value = btMap

    // Chọn sẵn triệu chứng từ phép đo làm điểm xuất phát (một lần, sau khi đã có examination + benh map).
    if (!diagPreselected.value && matchedTrieuChungList.value.length) {
      selectedDiagSymptomIds.value = matchedTrieuChungList.value.map((t) => t.id)
      diagPreselected.value = true
    }
  } catch (err: any) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'patient-detail', params: { id: patientId.value } })
}

/** Tab Chẩn đoán Bát cương → highlight ô liên quan ở bảng I */
type BatCuongFocusKey = 'amDuong' | 'khi' | 'huyet'
const batCuongFocus = ref<BatCuongFocusKey | null>(null)

function statsRowClass(which: 'upper' | 'lower') {
  const f = batCuongFocus.value
  if (!f) return ''
  const rel =
    (which === 'upper' && f === 'khi') ||
    (which === 'lower' && (f === 'amDuong' || f === 'huyet'))
  return rel ? 'bc-stats--focus' : 'bc-stats--dim'
}

function upperRowClass(_idx: number) {
  const f = batCuongFocus.value
  if (!f) return ''
  return f === 'khi' ? 'meridian-row--focus' : 'meridian-row--dim'
}

function lowerRowClass(idx: number) {
  const f = batCuongFocus.value
  if (!f) return ''
  if (f === 'huyet') return 'meridian-row--focus'
  if (f === 'amDuong') {
    const row = lowerRows.value[idx]
    return row?.name === 'Đảm' ? 'meridian-row--focus' : 'meridian-row--dim'
  }
  return 'meridian-row--dim'
}

function sectionTitleClass(which: 'upper' | 'lower') {
  const f = batCuongFocus.value
  if (!f) return ''
  const rel = (which === 'upper' && f === 'khi') || (which === 'lower' && (f === 'amDuong' || f === 'huyet'))
  return rel ? '' : 'bc-section-title--dim'
}

function footerDiffClass() {
  return batCuongFocus.value ? 'bc-footer-stat--dim' : ''
}

/** --- Mô hình Excel → highlight ô theo map.md / logic_expression --- */
type ExcelHint =
  | { zone: 'upperStat'; statCol: number }
  | { zone: 'lowerStat'; statCol: number }
  | { zone: 'upperBody'; row: number; col: number }
  | { zone: 'lowerBody'; row: number; col: number }
  | { zone: 'footer' }

const excelFocusRuleId = ref<number | null>(null)
const modernFocusRuleId = ref<number | null>(null)
const showMoHinhBenhLy = ref(false)

// Có focus rule (Excel hoặc Hiện đại) — dùng để giữ logic dim/highlight chung
const anyRuleFocusActive = computed(
  () => excelFocusRuleId.value != null || modernFocusRuleId.value != null,
)

watch(
  () => excelSyndromesList.value,
  (list) => {
    if (excelFocusRuleId.value != null && !list.some((x: { id: number }) => x.id === excelFocusRuleId.value)) {
      excelFocusRuleId.value = null
    }
  }
)

watch(
  () => modernSyndromesList.value,
  (list) => {
    if (modernFocusRuleId.value != null && !list.some((x: { id: number }) => x.id === modernFocusRuleId.value)) {
      modernFocusRuleId.value = null
    }
  }
)

const excelHighlightHints = computed<ExcelHint[]>(() => {
  let logic: string | null | undefined
  if (excelFocusRuleId.value != null) {
    logic = excelSyndromesList.value.find((x: { id: number }) => x.id === excelFocusRuleId.value)?.logicExpression
  } else if (modernFocusRuleId.value != null) {
    logic = modernSyndromesList.value.find((x: { id: number }) => x.id === modernFocusRuleId.value)?.logicExpression
  }
  if (!logic || typeof logic !== 'string') return []
  return extractExcelRefsFromLogic(logic).map(refToHint).filter((h): h is ExcelHint => h !== null)
})

function extractExcelRefsFromLogic(logic: string): string[] {
  const out = new Set<string>()
  const u = logic.toUpperCase().replace(/\s+/g, ' ')
  let m: RegExpExecArray | null
  const absRe = /ABS\(\s*([A-Z]{1,3})(\d+)\s*\)/g
  while ((m = absRe.exec(u)) !== null) {
    out.add(`${m[1]}${m[2]}`)
  }
  const cellRe = /\b([A-Z]{1,3})(\d+)\b/g
  while ((m = cellRe.exec(u)) !== null) {
    out.add(`${m[1]}${m[2]}`)
  }
  return [...out]
}

function statColFromLetters(col: string): number | null {
  if (col === 'A') return 0
  if (col === 'B') return 1
  if (col === 'D') return 2
  if (col === 'E') return 3
  if (col === 'F') return 4
  return null
}

function refToHint(ref: string): ExcelHint | null {
  const m = ref.trim().match(/^([A-Z]+)(\d+)$/i)
  if (!m) return null
  const [, matchedLetters, matchedRow] = m
  if (!matchedLetters || !matchedRow) return null
  const letters = matchedLetters.toUpperCase()
  const row = parseInt(matchedRow, 10)

  if (letters.length > 3) return null

  if (row === 28 && letters === 'H') return { zone: 'footer' }

  if (row === 7 || row === 8) {
    const sc = statColFromLetters(letters)
    if (sc !== null) return { zone: 'upperStat', statCol: sc }
  }
  if (row === 18 || row === 19) {
    const sc = statColFromLetters(letters)
    if (sc !== null) return { zone: 'lowerStat', statCol: sc }
  }

  const bodyColMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7 }

  if (row >= 10 && row <= 15) {
    const c = bodyColMap[letters]
    if (c !== undefined) return { zone: 'upperBody', row: row - 10, col: c }
  }
  if (row >= 21 && row <= 26) {
    const c = bodyColMap[letters]
    if (c !== undefined) return { zone: 'lowerBody', row: row - 21, col: c }
  }

  return null
}

function toggleExcelFocus(id: number) {
  batCuongFocus.value = null
  modernFocusRuleId.value = null
  excelFocusRuleId.value = excelFocusRuleId.value === id ? null : id
}

function toggleModernFocus(id: number) {
  batCuongFocus.value = null
  excelFocusRuleId.value = null
  modernFocusRuleId.value = modernFocusRuleId.value === id ? null : id
}

function toggleBatCuongFocus(key: BatCuongFocusKey) {
  excelFocusRuleId.value = null
  modernFocusRuleId.value = null
  batCuongFocus.value = batCuongFocus.value === key ? null : key
}

function sectionTouchesExcel(which: 'upper' | 'lower'): boolean {
  const hints = excelHighlightHints.value
  if (!hints.length) return false
  if (which === 'upper') {
    return hints.some(h => h.zone === 'upperStat' || h.zone === 'upperBody')
  }
  return hints.some(h => h.zone === 'lowerStat' || h.zone === 'lowerBody')
}

function sectionTitleClassMerged(which: 'upper' | 'lower') {
  if (anyRuleFocusActive.value) {
    if (!excelHighlightHints.value.length) return ''
    return sectionTouchesExcel(which) ? '' : 'bc-section-title--dim'
  }
  return sectionTitleClass(which)
}

function statsRowClassMerged(which: 'upper' | 'lower') {
  if (anyRuleFocusActive.value) return ''
  return statsRowClass(which)
}

function excelStatColClass(which: 'upper' | 'lower', statIdx: number): string {
  if (!anyRuleFocusActive.value) return ''
  const hints = excelHighlightHints.value
  const want = which === 'upper' ? 'upperStat' : 'lowerStat'
  const statHints = hints.filter((h): h is Extract<ExcelHint, { zone: 'upperStat' | 'lowerStat' }> => h.zone === want)
  if (!statHints.length) return ''
  const match = statHints.some(h => h.statCol === statIdx)
  return match ? 'excel-stat-col--focus' : 'excel-stat-col--dim'
}

function excelTdClass(which: 'upper' | 'lower', rowIdx: number, colIdx: number): string {
  if (!anyRuleFocusActive.value) return ''
  const hints = excelHighlightHints.value
  const bodyZone = which === 'upper' ? 'upperBody' : 'lowerBody'
  const bodyHints = hints.filter((h): h is Extract<ExcelHint, { zone: 'upperBody' | 'lowerBody' }> => h.zone === bodyZone)
  if (!bodyHints.length) return ''
  const match = bodyHints.some(h => h.row === rowIdx && h.col === colIdx)
  return match ? 'meridian-cell--focus' : 'meridian-cell--dim'
}

function upperRowClassMerged(idx: number) {
  if (anyRuleFocusActive.value) return ''
  return upperRowClass(idx)
}

function lowerRowClassMerged(idx: number) {
  if (anyRuleFocusActive.value) return ''
  return lowerRowClass(idx)
}

function footerDiffClassMerged() {
  if (anyRuleFocusActive.value) {
    const hints = excelHighlightHints.value
    if (!hints.length) return ''
    if (hints.some(h => h.zone === 'footer')) return 'excel-footer--focus'
    return 'bc-footer-stat--dim'
  }
  return footerDiffClass()
}
</script>

<template>
  <div class="meridian-results-page">
    <!-- Header Area -->
    <div class="page-header">
      <button class="back-btn" @click="goBack">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/></svg>
        <span>Quay lại hồ sơ</span>
      </button>
      
      <div v-if="patient" class="exam-summary">
        <h1 class="page-title">Kết quả Khám bệnh - {{ examDisplay.ticketNumber }}</h1>
        <div class="exam-meta">
          <span>Bệnh nhân: <strong>{{ patient.fullName }}</strong></span>
          <span class="divider">|</span>
          <span>Ngày khám: {{ examDisplay.date }} {{ examDisplay.time }}</span>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải thông tin...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="goBack">Quay lại</button>
    </div>

    <template v-else-if="patient">
      <!-- 65 / 35 Layout -->
      <div class="results-layout">
        
        <!-- Left Column: 65% -->
        <div class="layout-left">
          <section class="result-section">
            <h2 class="section-title">
              <span class="section-num">I</span> KẾT QUẢ ĐO KINH LẠC
            </h2>
            
            <div class="result-card p-0 overflow-hidden">
              <!-- Patient Info Header -->
              <div class="patient-table-header">
                <table class="data-table mb-0">
                  <tbody>
                    <tr>
                      <td class="font-medium text-gray-500 w-24">Họ và tên</td>
                      <td class="font-bold text-brown-800" colspan="2">{{ patient?.fullName }}</td>
                      <td class="font-medium text-gray-500 w-16">Tuổi</td>
                      <td class="font-bold">{{ getAge(patient?.dateOfBirth) }}</td>
                    </tr>
                    <tr>
                      <td class="font-medium text-gray-500">Địa chỉ</td>
                      <td colspan="4">{{ patient?.address || '—' }}</td>
                    </tr>
                    <tr>
                      <td class="font-medium text-gray-500">Giới tính</td>
                      <td colspan="4">{{ patient?.gender || '—' }}</td>
                    </tr>
                    <tr>
                      <td class="font-medium text-gray-500">Thời gian đo</td>
                      <td>{{ examDisplay.date }}</td>
                      <td class="font-medium text-gray-500 text-right pr-4">Huyết áp</td>
                      <td colspan="2">120/90</td>
                    </tr>
                    <tr>
                      <td class="font-medium text-gray-500">Chiều cao</td>
                      <td>—</td>
                      <td class="font-medium text-gray-500 text-right pr-4">Cân nặng <span class="text-black ml-2">—</span></td>
                      <td class="font-medium text-gray-500">BMI</td>
                      <td>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Chi Trên -->
              <div class="table-section-title" :class="sectionTitleClassMerged('upper')">Chi trên</div>
              <div class="stats-summary-row" :class="statsRowClassMerged('upper')">
                <div class="stat-col" :class="excelStatColClass('upper', 0)"><span class="val max-val">{{ fmt(upperStats.max, 1) }}</span><br/><span class="val min-val">{{ fmt(upperStats.min, 1) }}</span></div>
                <div class="stat-col" :class="excelStatColClass('upper', 1)"><span class="val">{{ fmt(upperStats.range, 1) }}</span><br/><span>&nbsp;</span></div>
                <div class="stat-col" :class="excelStatColClass('upper', 2)"><span class="val bg-gray">{{ fmt(upperStats.mean, 2) }}</span><br/><span>&nbsp;</span></div>
                <div class="stat-col" :class="excelStatColClass('upper', 3)"><span class="val">{{ fmt(upperStats.sd, 2) }}</span><br/><span>&nbsp;</span></div>
                <div class="stat-col" :class="excelStatColClass('upper', 4)"><span class="val text-brown-600">{{ fmt(upperStats.upperBound, 2) }}</span><br/><span class="val text-brown-600">{{ fmt(upperStats.lowerBound, 2) }}</span></div>
              </div>

              <div class="table-responsive table-scroll">
                <table class="data-table meridian-data-table">
                  <tbody>
                    <tr v-for="(item, idx) in upperRows" :key="'upper-'+idx" :class="upperRowClassMerged(idx)">
                      <td class="font-bold" :class="excelTdClass('upper', idx, 0)">{{ item.name }}</td>
                      <td :class="[getSignClass(item.leftSign), excelTdClass('upper', idx, 1)]">{{ item.leftSign }}</td>
                      <td class="font-medium" :class="excelTdClass('upper', idx, 2)">{{ fmt(item.left, 1) }}</td>
                      <td class="bg-gray" :class="excelTdClass('upper', idx, 3)">{{ fmt(item.avg, 2) }}</td>
                      <td :class="[item.diff > 0 ? 'text-brown-600' : (item.diff < 0 ? 'text-blue-600' : ''), excelTdClass('upper', idx, 4)]">{{ item.diff > 0 ? '+' : '' }}{{ fmt(item.diff, 2) }}</td>
                      <td class="font-medium" :class="excelTdClass('upper', idx, 5)">{{ fmt(item.right, 1) }}</td>
                      <td :class="[getSignClass(item.rightSign), excelTdClass('upper', idx, 6)]">{{ item.rightSign }}</td>
                      <td :class="excelTdClass('upper', idx, 7)">{{ fmt(item.absDiff, 1) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Chi Dưới -->
              <div class="table-section-title" :class="sectionTitleClassMerged('lower')">Chi dưới</div>
              <div class="stats-summary-row" :class="statsRowClassMerged('lower')">
                <div class="stat-col" :class="excelStatColClass('lower', 0)"><span class="val max-val">{{ fmt(lowerStats.max, 1) }}</span><br/><span class="val min-val">{{ fmt(lowerStats.min, 1) }}</span></div>
                <div class="stat-col" :class="excelStatColClass('lower', 1)"><span class="val">{{ fmt(lowerStats.range, 1) }}</span><br/><span>&nbsp;</span></div>
                <div class="stat-col" :class="excelStatColClass('lower', 2)"><span class="val bg-gray">{{ fmt(lowerStats.mean, 2) }}</span><br/><span>&nbsp;</span></div>
                <div class="stat-col" :class="excelStatColClass('lower', 3)"><span class="val">{{ fmt(lowerStats.sd, 2) }}</span><br/><span>&nbsp;</span></div>
                <div class="stat-col" :class="excelStatColClass('lower', 4)"><span class="val text-brown-600">{{ fmt(lowerStats.upperBound, 2) }}</span><br/><span class="val text-brown-600">{{ fmt(lowerStats.lowerBound, 2) }}</span></div>
              </div>

              <div class="table-responsive table-scroll">
                <table class="data-table meridian-data-table">
                  <tbody>
                    <tr v-for="(item, idx) in lowerRows" :key="'lower-'+idx" :class="lowerRowClassMerged(idx)">
                      <td class="font-bold" :class="excelTdClass('lower', idx, 0)">{{ item.name }}</td>
                      <td :class="[getSignClass(item.leftSign), excelTdClass('lower', idx, 1)]">{{ item.leftSign }}</td>
                      <td class="font-medium" :class="excelTdClass('lower', idx, 2)">{{ fmt(item.left, 1) }}</td>
                      <td class="bg-gray" :class="excelTdClass('lower', idx, 3)">{{ fmt(item.avg, 2) }}</td>
                      <td :class="[item.diff > 0 ? 'text-brown-600' : (item.diff < 0 ? 'text-blue-600' : ''), excelTdClass('lower', idx, 4)]">{{ item.diff > 0 ? '+' : '' }}{{ fmt(item.diff, 2) }}</td>
                      <td class="font-medium" :class="excelTdClass('lower', idx, 5)">{{ fmt(item.right, 1) }}</td>
                      <td :class="[getSignClass(item.rightSign), excelTdClass('lower', idx, 6)]">{{ item.rightSign }}</td>
                      <td :class="excelTdClass('lower', idx, 7)">{{ fmt(item.absDiff, 1) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Footer Stats -->
              <div class="table-footer-stat" :class="footerDiffClassMerged()">
                <span>Chênh lệch trung bình chi trên và chi dưới:</span>
                <span class="font-bold text-brown-700 ml-4">{{ fmt(Math.abs(upperStats.mean - lowerStats.mean), 2) }}</span>
              </div>
            </div>
          </section>

          <section class="result-section mt-6">
            <h2 class="section-title">
              <span class="section-num">IV</span> PHƯƠNG HUYỆT
              <span v-if="matchedPhuongHuyetList.length" class="section-count">
                ({{ matchedPhuongHuyetList.length }} huyệt)
              </span>
            </h2>
            <div class="result-card p-4">
              <p v-if="!matchedBenhIds.length" class="suggested-empty">
                Chưa có bệnh YHCT nào khớp ở phần III.
              </p>
              <p v-else-if="!matchedPhuongHuyetList.length" class="suggested-empty">
                Các bệnh YHCT khớp chưa được cấu hình phương huyệt.
              </p>
              <div v-else class="ph-groups">
                <div
                  v-for="g in phuongHuyetGroups"
                  :key="g.method"
                  class="ph-group"
                  :class="methodChipClass(g.method)"
                >
                  <div class="ph-group__head">
                    <span class="ph-group__method">{{ g.method }}</span>
                    <span class="ph-group__count">{{ g.items.length }} huyệt</span>
                  </div>
                  <div class="ph-group__chips">
                    <button
                      v-for="row in g.items"
                      :key="row.idPhacDo"
                      type="button"
                      class="ph-chip ph-chip--has-note"
                      :class="{
                        'ph-chip--active': expandedPhuongHuyetNotes.has(row.idPhacDo),
                      }"
                      :title="row.ghi_chu_ky_thuat || phuongHuyetKinhMach(row) || ''"
                      @click="togglePhuongHuyetNote(row.idPhacDo)"
                    >
                      <span class="ph-chip__name">{{ phuongHuyetDisplayLabel(row) }}</span>
                      <span v-if="row.ghi_chu_ky_thuat" class="ph-chip__dot" aria-hidden="true"></span>
                    </button>
                  </div>
                  <template
                    v-for="row in g.items.filter((r) => expandedPhuongHuyetNotes.has(r.idPhacDo))"
                    :key="'note-' + row.idPhacDo"
                  >
                    <div class="ph-group__note ph-group__note--ph">
                      <div class="ph-note-head">
                        <strong>{{ phuongHuyetDisplayLabel(row) }}</strong>
                        <span v-if="phuongHuyetKinhMach(row)" class="ph-note-meta">
                          {{ phuongHuyetKinhMach(row) }}
                        </span>
                        <button
                          type="button"
                          class="ph-note-close"
                          aria-label="Đóng"
                          @click="togglePhuongHuyetNote(row.idPhacDo)"
                        >✕</button>
                      </div>
                      <p v-if="row.ghi_chu_ky_thuat" class="ph-note-body">
                        <span class="ph-note-label">Ghi chú:</span> {{ row.ghi_chu_ky_thuat }}
                      </p>
                      <p v-else class="ph-note-empty">Chưa có ghi chú kỹ thuật.</p>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </section>

          <section class="result-section mt-6">
            <h2 class="section-title">
              <span class="section-num">V</span> PHƯƠNG DƯỢC
              <span v-if="matchedBaiThuocList.length" class="section-count">
                ({{ matchedBaiThuocList.length }} bài)
              </span>
            </h2>
            <div class="result-card p-4">
              <p v-if="!matchedBenhIds.length" class="suggested-empty">
                Chưa có bệnh YHCT nào khớp ở phần III.
              </p>
              <p v-else-if="!matchedBaiThuocList.length" class="suggested-empty">
                Các bệnh YHCT khớp chưa được gắn bài thuốc nào.
              </p>
              <div v-else class="ph-groups">
                <div class="ph-group ph-group--bai-thuoc">
                  <div class="ph-group__head">
                    <span class="ph-group__method">Bài thuốc</span>
                    <span class="ph-group__count">{{ matchedBaiThuocList.length }} bài</span>
                  </div>
                  <div class="ph-group__chips">
                    <button
                      v-for="bt in matchedBaiThuocList"
                      :key="bt.id"
                      type="button"
                      class="ph-chip ph-chip--has-note"
                      :class="{ 'ph-chip--active': expandedBaiThuoc.has(bt.id) }"
                      :title="`${baiThuocChiTietOf(bt.id).length} vị thuốc`"
                      @click="toggleBaiThuoc(bt.id)"
                    >
                      <span class="ph-chip__name">{{ bt.ten_bai_thuoc }}</span>
                      <span class="ph-chip__dot" aria-hidden="true"></span>
                    </button>
                  </div>
                  <template
                    v-for="bt in matchedBaiThuocList.filter((b) => expandedBaiThuoc.has(b.id))"
                    :key="'btnote-' + bt.id"
                  >
                    <div class="ph-group__note ph-group__note--bt">
                      <div class="bt-note-head">
                        <strong>{{ bt.ten_bai_thuoc }}</strong>
                        <span class="bt-note-count">{{ baiThuocChiTietOf(bt.id).length }} vị</span>
                        <button
                          type="button"
                          class="ph-note-close"
                          aria-label="Đóng"
                          @click="toggleBaiThuoc(bt.id)"
                        >✕</button>
                      </div>
                      <p v-if="!baiThuocChiTietOf(bt.id).length" class="bt-note-empty">
                        Bài thuốc này chưa có thành phần vị thuốc.
                      </p>
                      <div v-else class="bt-detail-table">
                        <div class="bt-detail-table__head">
                          <span class="btd-col btd-col--name">Vị thuốc</span>
                          <span class="btd-col btd-col--lieu">Liều</span>
                          <span class="btd-col btd-col--role">Vai trò</span>
                        </div>
                        <div
                          v-for="ct in baiThuocChiTietOf(bt.id)"
                          :key="ct.id"
                          class="bt-detail-table__row"
                        >
                          <div class="btd-col btd-col--name">{{ viThuocLabel(ct) }}</div>
                          <div class="btd-col btd-col--lieu">
                            <span v-if="ct.lieu_luong">{{ ct.lieu_luong }}</span>
                            <span v-else class="muted">—</span>
                          </div>
                          <div class="btd-col btd-col--role">
                            <span v-if="ct.vai_tro">{{ ct.vai_tro }}</span>
                            <span v-else class="muted">—</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </section>

          <section class="result-section mt-6">
            <h2 class="section-title">
              <span class="section-num">VI</span> TRIỆU CHỨNG
              <span v-if="selectedDiagSymptomIds.length" class="section-count">
                ({{ selectedDiagSymptomIds.length }} đã chọn)
              </span>
            </h2>
            <div class="result-card p-4">
              <p v-if="!allDiagSymptoms.length" class="suggested-empty">
                Đang tải danh sách triệu chứng…
              </p>
              <div v-else class="tc-diag">
                <div class="ph-group ph-group--trieu-chung">
                  <div class="ph-group__head">
                    <span class="ph-group__method">Chọn triệu chứng để chẩn đoán</span>
                    <span class="tc-pick__actions">
                      <button
                        v-if="matchedTrieuChungList.length"
                        type="button"
                        class="tc-link"
                        @click="selectMeasuredSymptoms"
                      >Chọn từ phép đo ({{ matchedTrieuChungList.length }})</button>
                      <button
                        v-if="selectedDiagSymptomIds.length"
                        type="button"
                        class="tc-link"
                        @click="clearDiagSymptoms"
                      >Bỏ chọn</button>
                    </span>
                  </div>

                  <!-- Đã chọn (triệu chứng từ phép đo có viền đậm) -->
                  <div v-if="selectedDiagSymptomList.length" class="tc-pick__selected">
                    <span
                      v-for="t in selectedDiagSymptomList"
                      :key="'sel-' + t.id"
                      class="ph-chip ph-chip--active ph-chip--sel"
                      :class="{ 'ph-chip--measured': measuredIdSet.has(t.id) }"
                    >
                      <span class="ph-chip__name">{{ t.ten_trieu_chung }}</span>
                      <button
                        type="button"
                        class="ph-chip__x"
                        aria-label="Bỏ chọn"
                        @click="toggleDiagSymptom(t.id)"
                      >×</button>
                    </span>
                  </div>

                  <!-- Gõ để thêm: chưa gõ chỉ gợi ý từ phép đo; gõ mới tìm toàn bộ -->
                  <div class="tc-pick__search">
                    <input
                      v-model="diagSymptomSearch"
                      type="search"
                      class="tc-pick__input"
                      placeholder="Gõ để tìm &amp; thêm triệu chứng…"
                      autocomplete="off"
                    />
                  </div>

                  <div v-if="filteredDiagSymptomOptions.length" class="tc-pick__suggest">
                    <span class="tc-pick__suggest-label">{{ diagSymptomSearch.trim() ? 'Kết quả tìm kiếm' : 'Gợi ý từ phép đo' }}</span>
                    <div class="ph-group__chips ph-group__chips--scroll">
                      <button
                        v-for="t in filteredDiagSymptomOptions"
                        :key="t.id"
                        type="button"
                        class="ph-chip ph-chip--pick"
                        :class="{ 'ph-chip--measured': measuredIdSet.has(t.id) }"
                        @click="toggleDiagSymptom(t.id)"
                      >
                        <span class="ph-chip__name">{{ t.ten_trieu_chung }}</span>
                      </button>
                    </div>
                  </div>
                  <p v-else-if="diagSymptomSearch.trim()" class="tc-pick__hint muted">Không tìm thấy “{{ diagSymptomSearch }}”.</p>
                </div>

                <button
                  type="button"
                  class="tc-diag-btn"
                  :disabled="!selectedDiagSymptomIds.length || isDiagnosing"
                  @click="runMeridianDiagnosis"
                >
                  <span v-if="isDiagnosing" class="tc-spinner" aria-hidden="true"></span>
                  {{ isDiagnosing ? 'Đang phân tích…' : selectedDiagSymptomIds.length ? `Chẩn đoán (${selectedDiagSymptomIds.length})` : 'Chẩn đoán' }}
                </button>

                <p v-if="isDiagnosing || hasRunDiagnosis || diagError" class="tc-hint">
                  Kết quả hiển thị ở mục <strong>VII — Gợi ý chẩn đoán</strong> (cột bên phải).
                </p>

                <!-- Kết quả gợi ý — teleport sang cột phải (mục VII) -->
                <Teleport defer to="#diag-results-host">
                <div v-if="diagError" class="tc-error">{{ diagError }}</div>
                <div v-else-if="isDiagnosing" class="tc-loading">
                  <div v-for="n in 2" :key="n" class="tc-skeleton"></div>
                </div>
                <div v-else-if="hasRunDiagnosis && !hasAnyDiagResults" class="tc-empty">
                  Không tìm thấy thể bệnh / bệnh Tây Y phù hợp với các triệu chứng đã chọn.
                </div>
                <div v-else-if="hasRunDiagnosis" class="tc-results">
                  <div v-if="unexplainedDiagSymptoms.length" class="tc-unexplained">
                    <span class="tc-unexplained__label">⚠ Chưa được giải thích:</span>
                    <span v-for="s in unexplainedDiagSymptoms" :key="s.id" class="tc-tag tc-tag--warn">{{ s.ten_trieu_chung }}</span>
                  </div>

                  <div class="tc-cols">
                    <!-- Đông Y -->
                    <div class="tc-col">
                      <h3 class="tc-col__title tc-col__title--dongy">
                        <span class="tc-dot"></span>
                        Thể bệnh &amp; Pháp trị (Đông Y)
                        <span class="tc-col__count">{{ diagResult?.phapTri.length || 0 }}<template v-if="(diagResult?.phapTriTotal || 0) > (diagResult?.phapTri.length || 0)">/{{ diagResult?.phapTriTotal }}</template></span>
                      </h3>
                      <p v-if="!diagResult?.phapTri.length" class="tc-none">Không có thể bệnh phù hợp.</p>
                      <a
                        v-for="(c, i) in phapTriShown"
                        :key="'pt-' + c.id"
                        :href="phapTriHref(c.id)"
                        target="_blank"
                        rel="noopener"
                        class="tc-card"
                        :class="{ 'tc-card--top': i === 0 }"
                        :title="`Mở pháp trị: ${c.label}`"
                      >
                        <div class="tc-card__rank" :class="`tc-rank--${Math.min(i + 1, 4)}`">{{ i + 1 }}</div>
                        <div class="tc-card__main">
                          <div class="tc-card__head">
                            <span class="tc-card__name">{{ c.label }}</span>
                            <span v-if="i === 0" class="tc-top-tag">Phù hợp nhất</span>
                          </div>
                          <p v-if="c.subLabel" class="tc-card__sub">{{ c.subLabel }}</p>
                          <p v-if="c.members && c.members.length > 1" class="tc-card__members">
                            Cộng dồn từ <strong>{{ c.members.length }}</strong> pháp trị cùng thể bệnh
                          </p>
                          <div class="tc-card__matched">
                            <span class="tc-pill" title="Số triệu chứng đã chọn được giải thích">{{ c.matchedCount }}/{{ c.total }}</span>
                            <span v-for="m in c.matched" :key="m.id" class="tc-tag tc-tag--trieu">{{ m.ten_trieu_chung }}</span>
                          </div>
                        </div>
                        <div class="tc-card__score">
                          <span class="tc-pct" :class="confidenceClass(c.percent)">{{ c.percent }}<small>%</small></span>
                          <span class="tc-pct-label" :class="confidenceClass(c.percent)">{{ confidenceLabel(c.percent) }}</span>
                        </div>
                        <div class="tc-bar"><span :class="confidenceClass(c.percent)" :style="{ width: c.percent + '%' }"></span></div>
                      </a>
                      <button
                        v-if="(diagResult?.phapTri.length || 0) > DIAG_COLLAPSED_COUNT"
                        type="button"
                        class="tc-more"
                        @click="expandDongY = !expandDongY"
                      >
                        {{ expandDongY ? '▴ Thu gọn' : `▾ Xem thêm ${(diagResult?.phapTri.length || 0) - DIAG_COLLAPSED_COUNT}` }}
                      </button>
                    </div>

                    <!-- Tây Y -->
                    <div class="tc-col">
                      <h3 class="tc-col__title tc-col__title--tayy">
                        <span class="tc-dot"></span>
                        Bệnh Tây Y
                        <span class="tc-col__count">{{ diagResult?.benhTayY.length || 0 }}<template v-if="(diagResult?.benhTayYTotal || 0) > (diagResult?.benhTayY.length || 0)">/{{ diagResult?.benhTayYTotal }}</template></span>
                      </h3>
                      <p v-if="!diagResult?.benhTayY.length" class="tc-none">Không có bệnh Tây Y phù hợp.</p>
                      <a
                        v-for="(c, i) in benhTayYShown"
                        :key="'bty-' + c.id"
                        :href="benhTayYHref(c.id)"
                        target="_blank"
                        rel="noopener"
                        class="tc-card"
                        :class="{ 'tc-card--top': i === 0 }"
                        :title="`Mở bệnh Tây Y: ${c.label}`"
                      >
                        <div class="tc-card__rank" :class="`tc-rank--${Math.min(i + 1, 4)}`">{{ i + 1 }}</div>
                        <div class="tc-card__main">
                          <div class="tc-card__head">
                            <span class="tc-card__name">{{ c.label }}</span>
                            <span v-if="c.groupLabel" class="tc-tag tc-tag--cb" title="Thể Bệnh Lớn (chủng bệnh)">{{ c.groupLabel }}</span>
                            <span v-if="i === 0" class="tc-top-tag">Phù hợp nhất</span>
                          </div>
                          <p v-if="c.via && c.via.length" class="tc-card__via">
                            <span class="tc-via-label">Qua pháp trị:</span>
                            <span v-for="v in c.via" :key="v.id" class="tc-via-chip">{{ v.label }} <small>{{ v.percent }}%</small></span>
                          </p>
                          <div class="tc-card__matched">
                            <span class="tc-pill" title="Số triệu chứng đã chọn được giải thích">{{ c.matchedCount }}/{{ c.total }}</span>
                            <span v-for="m in c.matched" :key="m.id" class="tc-tag tc-tag--trieu">{{ m.ten_trieu_chung }}</span>
                          </div>
                        </div>
                        <div class="tc-card__score">
                          <span class="tc-pct" :class="confidenceClass(c.percent)">{{ c.percent }}<small>%</small></span>
                          <span class="tc-pct-label" :class="confidenceClass(c.percent)">{{ confidenceLabel(c.percent) }}</span>
                        </div>
                        <div class="tc-bar"><span :class="confidenceClass(c.percent)" :style="{ width: c.percent + '%' }"></span></div>
                      </a>
                      <button
                        v-if="(diagResult?.benhTayY.length || 0) > DIAG_COLLAPSED_COUNT"
                        type="button"
                        class="tc-more"
                        @click="expandTayY = !expandTayY"
                      >
                        {{ expandTayY ? '▴ Thu gọn' : `▾ Xem thêm ${(diagResult?.benhTayY.length || 0) - DIAG_COLLAPSED_COUNT}` }}
                      </button>
                    </div>
                  </div>
                </div>
                </Teleport>
              </div>
            </div>
          </section>
        </div>

        <!-- Right Column: 35% -->
        <div class="layout-right">
          
          <section class="result-section">
            <h2 class="section-title">
              <span class="section-num">II</span> KẾT LUẬN BÁT CƯƠNG & CHẨN ĐOÁN
            </h2>
            <div class="result-card p-0">
              <div class="info-group p-5 border-b border-gray-100">
                <h4 class="info-label mb-3">Chẩn Đoán Bát Cương</h4>
                
                <div class="bc-summary-grid">
                  <div
                    class="bc-summary-card bc-summary-card--clickable"
                    :class="{ 'bc-summary-card--active': batCuongFocus === 'amDuong' }"
                    role="button"
                    tabindex="0"
                    title="Xem chỉ số kinh lạc liên quan Âm/Dương"
                    @click="toggleBatCuongFocus('amDuong')"
                    @keydown.enter.prevent="toggleBatCuongFocus('amDuong')"
                    @keydown.space.prevent="toggleBatCuongFocus('amDuong')"
                  >
                    <span class="bc-card-label">Âm / Dương</span>
                    <span class="bc-card-value">{{ diagnosis.amDuong }}</span>
                  </div>
                  <div
                    class="bc-summary-card bc-summary-card--clickable"
                    :class="{ 'bc-summary-card--active': batCuongFocus === 'khi' }"
                    role="button"
                    tabindex="0"
                    title="Xem chỉ số kinh lạc liên quan Khí"
                    @click="toggleBatCuongFocus('khi')"
                    @keydown.enter.prevent="toggleBatCuongFocus('khi')"
                    @keydown.space.prevent="toggleBatCuongFocus('khi')"
                  >
                    <span class="bc-card-label">Khí</span>
                    <span class="bc-card-value">{{ diagnosis.khi || '—' }}</span>
                  </div>
                  <div
                    class="bc-summary-card bc-summary-card--clickable"
                    :class="{ 'bc-summary-card--active': batCuongFocus === 'huyet' }"
                    role="button"
                    tabindex="0"
                    title="Xem chỉ số kinh lạc liên quan Huyết"
                    @click="toggleBatCuongFocus('huyet')"
                    @keydown.enter.prevent="toggleBatCuongFocus('huyet')"
                    @keydown.space.prevent="toggleBatCuongFocus('huyet')"
                  >
                    <span class="bc-card-label">Huyết</span>
                    <span class="bc-card-value">{{ diagnosis.huyet || '—' }}</span>
                  </div>
                </div>

                <div class="bc-tieu-ket mt-4">
                  <h4 class="info-label mb-3">TIỂU KẾT BÁT CƯƠNG (V2.0)</h4>
                  <div class="tieu-ket-list">
                    <div class="tk-item">
                      <span class="tk-label">Lý Hàn:</span>
                      <span class="tk-val">{{ batCuong.hanLy || '—' }}</span>
                    </div>
                    <div class="tk-item">
                      <span class="tk-label">Biểu Hàn:</span>
                      <span class="tk-val">{{ batCuong.hanBieu || '—' }}</span>
                    </div>
                    <div class="tk-item">
                      <span class="tk-label">Biểu Nhiệt:</span>
                      <span class="tk-val">{{ batCuong.nhietBieu || '—' }}</span>
                    </div>
                    <div class="tk-item">
                      <span class="tk-label">Lý Nhiệt:</span>
                      <span class="tk-val">{{ batCuong.nhietLy || '—' }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </section>

          <section class="result-section mt-6">
            <h2 class="section-title">
              <span class="section-num">III</span> MÔ HÌNH BỆNH LÝ
            </h2>
            <div class="result-card p-5">
              <div class="info-group">
                <h4 class="info-label mb-3">Mô hình bệnh YHCT - Đông Y</h4>
                <div v-if="excelSyndromesList.length" class="comparison-list">
                  <div
                    v-for="(item, idx) in excelSyndromesList"
                    :key="'excel-' + (item.code || idx)"
                    class="comparison-cell comparison-cell--clickable"
                    :class="{ 'comparison-cell--active': excelFocusRuleId === item.id }"
                    role="button"
                    tabindex="0"
                    :title="item.logicExpression ? 'Xem ô chỉ số liên quan trên bảng I' : 'Chọn mô hình'"
                    @click="toggleExcelFocus(item.id)"
                    @keydown.enter.prevent="toggleExcelFocus(item.id)"
                    @keydown.space.prevent="toggleExcelFocus(item.id)"
                  >
                    <span class="synd-idx">{{ Number(idx) + 1 }}</span>
                    <span class="synd-name">{{ item.name }}</span>
                    <span class="synd-rate">{{ item.outputCell }}</span>
                    <button
                      type="button"
                      class="pt-search-btn"
                      title="Tìm pháp trị cho mô hình bệnh này"
                      @click.stop="openPhapTriSearch(item)"
                      @keydown.stop
                    >
                      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" class="pt-search-ic">
                        <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="2" />
                        <path d="m17 17-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                      </svg>
                      Pháp trị
                    </button>
                  </div>
                </div>
                <div v-else class="pathology-placeholder">
                  <p>Không có mô hình Excel nào khớp điều kiện</p>
                </div>
              </div>

              <div class="info-group mt-4">
                <h4 class="info-label mb-3">Mô hình Bệnh Y Học Hiện Đại</h4>
                <div v-if="modernSyndromesList.length" class="comparison-list">
                  <div
                    v-for="(item, idx) in modernSyndromesList"
                    :key="'modern-' + (item.code || idx)"
                    class="comparison-cell comparison-cell--clickable comparison-cell--modern"
                    :class="{ 'comparison-cell--active': modernFocusRuleId === item.id }"
                    role="button"
                    tabindex="0"
                    :title="item.logicExpression ? 'Xem ô chỉ số liên quan trên bảng I' : 'Chọn mô hình'"
                    @click="toggleModernFocus(item.id)"
                    @keydown.enter.prevent="toggleModernFocus(item.id)"
                    @keydown.space.prevent="toggleModernFocus(item.id)"
                  >
                    <span class="synd-idx">{{ Number(idx) + 1 }}</span>
                    <span class="synd-name">{{ item.name }}</span>
                    <span class="synd-rate">{{ item.outputCell }}</span>
                  </div>
                </div>
                <div v-else class="pathology-placeholder">
                  <p>Không có mô hình hiện đại nào khớp điều kiện</p>
                </div>
              </div>

              <div class="info-group mt-4">
                <button
                  type="button"
                  class="mhbl-toggle"
                  :class="{ 'mhbl-toggle--open': showMoHinhBenhLy }"
                  :aria-expanded="showMoHinhBenhLy"
                  @click="showMoHinhBenhLy = !showMoHinhBenhLy"
                >
                  <span class="mhbl-toggle-caret">▸</span>
                  <span class="mhbl-toggle-label">Mô Hình Bệnh Lý - Suy Luận</span>
                  <span class="mhbl-toggle-action">{{ showMoHinhBenhLy ? 'Ẩn' : 'Hiện' }}</span>
                </button>
                <div v-if="showMoHinhBenhLy" class="mhbl-content">
                  <div v-if="comparisonRows.length" class="comparison-list">
                    <div class="comparison-header">
                      <span class="col-left">Mô hình app gốc</span>
                      <span class="col-right">Mô hình hiện tại</span>
                    </div>
                    <div v-for="(row, idx) in comparisonRows" :key="idx" class="comparison-row">
                      <div class="comparison-cell">
                        <span class="synd-idx">{{ Number(idx) + 1 }}</span>
                        <span class="synd-name">{{ row.legacy?.tieuket || '—' }}</span>
                        <span v-if="row.legacy?.rate" class="synd-rate">{{ Math.round(row.legacy.rate * 100) }}%</span>
                      </div>
                      <div class="comparison-cell">
                        <span class="synd-idx">{{ Number(idx) + 1 }}</span>
                        <span class="synd-name">{{ row.current?.tieuket || '—' }}</span>
                        <span v-if="row.current?.rate" class="synd-rate">{{ Math.round(row.current.rate * 100) }}%</span>
                      </div>
                    </div>
                  </div>
                  <div v-else class="pathology-placeholder">
                    <p>Không có mô hình bệnh lý nào được tìm thấy</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      <!-- Section VII: kết quả gợi ý chẩn đoán — FULL WIDTH để 2 cột Đông Y / Tây Y nằm song song -->
      <section class="result-section mt-6">
        <h2 class="section-title">
          <span class="section-num">VII</span> GỢI Ý CHẨN ĐOÁN
          <span v-if="hasRunDiagnosis && diagResult" class="section-count">
            (dựa trên {{ diagResult.input.length }} triệu chứng)
          </span>
        </h2>
        <div class="result-card p-4">
          <p
            v-if="!isDiagnosing && !hasRunDiagnosis && !diagError"
            class="tc-placeholder"
          >
            Chọn triệu chứng ở <strong>mục VI</strong> rồi bấm “Chẩn đoán” để xem gợi ý
            thể bệnh / pháp trị (Đông Y) và bệnh Tây Y phù hợp nhất.
          </p>
          <div id="diag-results-host" class="tc-results-host"></div>
        </div>
      </section>
    </template>

    <!-- Popup tra cứu Danh sách pháp trị (bấm vào mô hình bệnh Đông Y - Section III) -->
    <div v-if="showPhapTriModal" class="ptm-overlay" @click.self="closePhapTriModal">
      <div class="ptm-modal" role="dialog" aria-modal="true">
        <div class="ptm-head">
          <div class="ptm-head__title">
            <h3>Danh Sách Pháp Trị</h3>
            <span v-if="phapTriModalContext" class="ptm-context">Mô hình: {{ phapTriModalContext }}</span>
          </div>
          <button type="button" class="ptm-close" aria-label="Đóng" @click="closePhapTriModal">✕</button>
        </div>

        <div class="ptm-search">
          <svg class="ptm-search__ic" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="2" />
            <path d="m17 17-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <input
            v-model="phapTriQuery"
            type="search"
            class="ptm-search__input"
            placeholder="Tìm theo thể bệnh, pháp trị, triệu chứng, bài thuốc..."
            autocomplete="off"
          />
          <button v-if="phapTriQuery" type="button" class="ptm-search__clear" aria-label="Xóa" @click="phapTriQuery = ''">✕</button>
        </div>

        <div class="ptm-body">
          <div v-if="phapTriLoading" class="ptm-state">
            <div class="spinner"></div>
            <p>Đang tìm pháp trị…</p>
          </div>
          <div v-else-if="phapTriError" class="ptm-error">{{ phapTriError }}</div>
          <div v-else-if="!phapTriResults.length" class="ptm-state">
            <p class="muted-italic">Không tìm thấy pháp trị phù hợp.</p>
          </div>
          <template v-else>
            <p class="ptm-count">
              {{ phapTriResults.length }}<span v-if="phapTriTotal > phapTriResults.length"> / {{ phapTriTotal }}</span> kết quả
            </p>
            <div class="ptm-cols">
              <div v-for="col in phapTriColumns" :key="col.key" class="ptm-col">
                <h4 class="ptm-col__title" :class="col.cls">
                  <span class="ptm-col__dot"></span>
                  {{ col.title }}
                  <span class="ptm-col__count">{{ col.items.length }}</span>
                </h4>
                <p v-if="!col.items.length" class="ptm-col__empty">Không có pháp trị.</p>
                <article v-for="pt in col.items" :key="pt.id" class="ptm-card">
                  <div class="ptm-card__head">
                    <span class="ptm-card__id">#{{ pt.id }}</span>
                    <a
                      :href="phapTriHref(pt.id)"
                      target="_blank"
                      rel="noopener"
                      class="ptm-card__name"
                      :title="`Mở pháp trị #${pt.id}`"
                    >{{ pt.chung_trang || 'Pháp trị #' + pt.id }}</a>
                    <a :href="phapTriHref(pt.id)" target="_blank" rel="noopener" class="ptm-card__open">Mở ↗</a>
                  </div>
                  <p v-if="pt.nguyen_tac" class="ptm-card__phap">
                    <span class="ptm-card__phap-label">Pháp trị:</span> {{ pt.nguyen_tac }}
                  </p>
                  <div v-if="(pt.kinh_mach_list || []).length" class="ptm-row">
                    <span class="ptm-row__label">Tạng phủ</span>
                    <span v-for="k in pt.kinh_mach_list" :key="k.idKinhMach" class="ptm-tag ptm-tag--tang">{{ ptKinhMachLabel(k) }}</span>
                  </div>
                  <div v-if="(pt.trieu_chung_list || []).length" class="ptm-row">
                    <span class="ptm-row__label">Triệu chứng</span>
                    <span v-for="t in pt.trieu_chung_list" :key="t.id" class="ptm-tag ptm-tag--trieu">{{ t.ten_trieu_chung }}</span>
                  </div>
                  <div v-if="ptBaiThuocLabels(pt).length" class="ptm-row">
                    <span class="ptm-row__label">Bài thuốc</span>
                    <span v-for="(b, bi) in ptBaiThuocLabels(pt)" :key="bi" class="ptm-tag ptm-tag--bai">{{ b }}</span>
                  </div>
                  <div v-if="ptBenhTayYGroups(pt.id).length" class="ptm-row ptm-row--tayy">
                    <span class="ptm-row__label">Bệnh Tây Y</span>
                    <div class="ptm-bty-groups">
                      <div v-for="g in ptBenhTayYGroups(pt.id)" :key="g.key" class="ptm-bty-group">
                        <span class="ptm-bty-group__label">{{ g.chungBenhName }}</span>
                        <a
                          v-for="bty in g.items"
                          :key="bty.id"
                          :href="benhTayYHref(bty.id)"
                          target="_blank"
                          rel="noopener"
                          class="ptm-tag ptm-tag--tayy"
                          :title="`Mở bệnh Tây Y: ${bty.ten_benh}`"
                        >{{ bty.ten_benh }}</a>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.meridian-results-page {
  animation: fadeIn 0.4s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Header */
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 2px solid var(--brown-100);
}

.back-btn { display: inline-flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-sm); color: var(--gray-600); font-weight: 500; padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); transition: all var(--transition-fast); align-self: flex-start; }
.back-btn:hover { color: var(--brown-700); background: var(--brown-50); }

.exam-summary { display: flex; flex-direction: column; gap: var(--space-1); }
.page-title { font-size: var(--font-size-2xl); font-weight: 700; color: var(--brown-800); }
.exam-meta { font-size: var(--font-size-sm); color: var(--gray-600); }
.exam-meta strong { color: var(--brown-700); font-weight: 600; }
.divider { margin: 0 var(--space-2); color: var(--gray-300); }

/* Layout 65 / 35 */
.results-layout {
  display: grid;
  grid-template-columns: 65fr 35fr;
  gap: var(--space-6);
  align-items: start;
}

/* Sections */
.result-section { display: flex; flex-direction: column; gap: var(--space-4); }
.section-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--brown-800);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-transform: uppercase;
}
.section-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--brown-600);
  color: var(--white);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
}
.section-count {
  margin-left: var(--space-2);
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-500);
  text-transform: none;
}

/* Section IV (Phương huyệt) & V (Bài thuốc) */
.suggested-empty {
  margin: 0;
  padding: var(--space-3) 0;
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--gray-500);
  font-style: italic;
}
.muted { color: var(--gray-400); font-style: italic; }

/* Phương huyệt — group theo phương pháp */
.ph-groups { display: flex; flex-direction: column; gap: var(--space-3); }
.ph-group {
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: var(--white);
  overflow: hidden;
}
.ph-group__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
  padding: 6px var(--space-3);
  background: var(--surface-2);
  border-bottom: 1px solid var(--gray-100);
}
.ph-group__method {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--brown-800);
  text-transform: uppercase;
}
.ph-group__count {
  font-size: 11px;
  font-weight: 600;
  color: var(--gray-500);
}
.ph-group__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px var(--space-3);
}
.ph-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  border-radius: 999px;
  border: 1px solid var(--chip-pulse-border);
  background: var(--chip-pulse-bg);
  color: var(--chip-pulse-fg);
  cursor: default;
  transition: background .12s, border-color .12s, transform .12s;
}
.ph-chip--has-note { cursor: pointer; }
.ph-chip--has-note:hover {
  background: var(--chip-pulse-border);
  border-color: var(--chip-pulse-fg);
}
.ph-chip--active {
  background: var(--chip-pulse-fg);
  color: var(--white);
  border-color: var(--chip-pulse-fg);
}
.ph-chip__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.6;
}
.ph-group__note {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px var(--space-3);
  background: var(--warning-bg);
  border-top: 1px dashed var(--gray-200);
  font-size: var(--font-size-sm);
  color: var(--gray-800);
  line-height: 1.5;
}
.ph-note-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.ph-note-head strong {
  color: var(--brown-800);
  font-weight: 700;
  flex: 1;
  word-break: break-word;
}
.ph-note-meta {
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 600;
  color: var(--brown-700);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--brown-200);
  padding: 1px 8px;
  border-radius: 999px;
}
.ph-note-body { margin: 0; word-break: break-word; }
.ph-note-label { font-weight: 700; color: var(--brown-700); margin-right: 4px; }
.ph-note-empty {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--gray-500);
  font-style: italic;
  text-align: center;
}
.ph-note-close {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border-radius: var(--radius-sm);
  border: 0;
  background: transparent;
  color: var(--gray-500);
  cursor: pointer;
}
.ph-note-close:hover { background: var(--gray-100); color: var(--brown-700); }

/* Color variants per method */
.ph-group--cuu .ph-chip {
  background: #ffedd5; color: #9a3412; border-color: #fdba74;
}
.ph-group--cuu .ph-chip--has-note:hover {
  background: #fed7aa; border-color: #fb923c;
}
.ph-group--cuu .ph-chip--active {
  background: #9a3412; color: var(--white); border-color: #9a3412;
}
.ph-group--cham-cuu .ph-chip {
  background: #fef3c7; color: #92400e; border-color: #fcd34d;
}
.ph-group--cham-cuu .ph-chip--active {
  background: #92400e; color: var(--white); border-color: #92400e;
}
.ph-group--bam-huyet .ph-chip {
  background: #ecfdf5; color: #047857; border-color: #a7f3d0;
}
.ph-group--bam-huyet .ph-chip--active {
  background: #047857; color: var(--white); border-color: #047857;
}
.ph-group--dien-cham .ph-chip {
  background: #f5f3ff; color: #6d28d9; border-color: #ddd6fe;
}
.ph-group--dien-cham .ph-chip--active {
  background: #6d28d9; color: var(--white); border-color: #6d28d9;
}
.ph-group--bo .ph-chip {
  background: #fce7f3; color: #9d174d; border-color: #f9a8d4;
}
.ph-group--bo .ph-chip--active {
  background: #9d174d; color: var(--white); border-color: #9d174d;
}
.ph-group--ta .ph-chip {
  background: #fee2e2; color: #b91c1c; border-color: #fca5a5;
}
.ph-group--ta .ph-chip--active {
  background: #b91c1c; color: var(--white); border-color: #b91c1c;
}

/* Triệu chứng — chip group màu tím, có thể chọn để chẩn đoán */
.ph-group--trieu-chung .ph-chip {
  background: var(--chip-symptom-bg); color: var(--chip-symptom-fg); border-color: var(--chip-symptom-border);
  padding: 2px 9px; font-size: 11px;
}
.ph-group--trieu-chung .ph-chip--pick { cursor: pointer; font-family: inherit; }
.ph-group--trieu-chung .ph-chip--pick:hover { background: var(--chip-symptom-border); border-color: var(--chip-symptom-fg); }
.ph-group--trieu-chung .ph-chip--active,
.ph-group--trieu-chung .ph-chip--active:hover {
  background: var(--chip-symptom-fg); color: var(--white); border-color: var(--chip-symptom-fg);
}
/* Triệu chứng đến TỪ PHÉP ĐO: viền đậm để phân biệt với triệu chứng thêm tay. */
.ph-group--trieu-chung .ph-chip--measured { border-color: var(--chip-symptom-fg); box-shadow: inset 0 0 0 1px var(--chip-symptom-fg); font-weight: 700; }
.ph-group--trieu-chung .ph-chip--measured.ph-chip--active { box-shadow: inset 0 0 0 1px var(--chip-symptom-border); }
.ph-chip--sel { padding-right: 6px; cursor: default; }
.ph-chip__x { display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; border: 0; border-radius: 50%; background: rgba(255,255,255,0.3); color: inherit; font-size: 12px; line-height: 1; cursor: pointer; padding: 0; }
.ph-chip__x:hover { background: rgba(255,255,255,0.55); }

/* ----- Chẩn đoán trong Section VI (gọn) ----- */
.tc-diag { display: flex; flex-direction: column; gap: 10px; }
.ph-group__chips--scroll { max-height: 132px; overflow-y: auto; padding-top: 4px; padding-bottom: 4px; }
.tc-pick__search { padding: 0 var(--space-3); }
.tc-pick__input { width: 100%; box-sizing: border-box; padding: 6px 10px; border: 1px solid var(--gray-300); border-radius: var(--radius-md); font-size: 12px; font-family: inherit; }
.tc-pick__input:focus { outline: none; border-color: var(--chip-symptom-fg); box-shadow: var(--focus-ring); }
.tc-pick__selected { display: flex; flex-wrap: wrap; gap: 5px; padding: 6px var(--space-3); }
.tc-pick__suggest { display: flex; flex-direction: column; gap: 2px; }
.tc-pick__suggest-label { padding: 0 var(--space-3); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--gray-400); }
.tc-pick__hint { margin: 0; padding: 2px var(--space-3) 6px; font-size: 11px; }
.tc-pick__actions { display: inline-flex; gap: var(--space-3); }
.tc-link { background: none; border: 0; padding: 0; color: var(--chip-symptom-fg); font-size: 11px; font-weight: 700; cursor: pointer; text-decoration: underline; }
.tc-link:hover { color: var(--text-brand); }

.tc-diag-btn {
  align-self: flex-start;
  display: inline-flex; align-items: center; gap: 8px;
  padding: var(--space-2) var(--space-5);
  background: var(--brown-600); color: var(--white);
  border: 0; border-radius: var(--radius-md);
  font-weight: 700; font-size: var(--font-size-sm); cursor: pointer;
  transition: background var(--transition-fast);
}
.tc-diag-btn:hover:not(:disabled) { background: var(--brown-700); }
.tc-diag-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.tc-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: var(--white); border-radius: 50%; animation: spin .7s linear infinite; }

.tc-error { padding: var(--space-3); background: var(--danger-bg); color: var(--danger); border-radius: var(--radius-md); font-size: var(--font-size-sm); }
.tc-empty { padding: var(--space-4); text-align: center; color: var(--gray-500); font-size: var(--font-size-sm); font-style: italic; background: var(--surface-sunken); border-radius: var(--radius-md); }
.tc-loading { display: flex; flex-direction: column; gap: var(--space-2); }
.tc-skeleton { height: 56px; border-radius: var(--radius-md); background: linear-gradient(90deg, var(--gray-100) 25%, #f3f4f6 37%, var(--gray-100) 63%); background-size: 400% 100%; animation: tc-shimmer 1.4s ease infinite; }
@keyframes tc-shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

.tc-unexplained { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; padding: var(--space-2) var(--space-3); background: var(--warning-bg); border: 1px solid var(--warning-border); border-radius: var(--radius-md); margin-bottom: var(--space-3); }
.tc-unexplained__label { font-size: 11px; font-weight: 700; color: var(--warning-fg); text-transform: uppercase; letter-spacing: 0.03em; }

.tc-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: var(--space-4); align-items: start; }
.tc-col__title { display: flex; align-items: center; gap: 6px; margin: 0 0 var(--space-2); padding-bottom: 6px; font-size: var(--font-size-sm); font-weight: 700; color: var(--gray-800); border-bottom: 1px solid var(--gray-100); }
.tc-dot { width: 9px; height: 9px; border-radius: 50%; flex: 0 0 auto; }
.tc-col__title--dongy .tc-dot { background: var(--success-fg); }
.tc-col__title--tayy .tc-dot { background: var(--info-fg); }
.tc-col__count { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 18px; padding: 0 6px; border-radius: 9px; font-size: 10px; font-weight: 700; }
.tc-col__title--dongy .tc-col__count { background: var(--success-bg); color: var(--success-fg); }
.tc-col__title--tayy .tc-col__count { background: var(--info-bg); color: var(--info-fg); }
.tc-none { margin: 0; padding: 4px 0; color: var(--gray-400); font-style: italic; font-size: var(--font-size-sm); }
/* Nút thu gọn / xem thêm cho mỗi cột kết quả. */
.tc-more { width: 100%; margin-top: 2px; padding: 7px; border: 1px dashed var(--gray-300); border-radius: var(--radius-md); background: var(--gray-50); color: var(--gray-600); font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all var(--transition-fast); }
.tc-more:hover { border-color: var(--brown-400, #b08968); color: var(--brown-700, #6b4a35); background: var(--white); }

.tc-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-areas: "rank main score" "bar bar bar";
  gap: 6px var(--space-2);
  align-items: start;
  text-decoration: none; color: inherit;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-2);
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast);
}
.tc-card:hover { box-shadow: 0 4px 12px rgba(74,47,23,0.1); border-color: var(--brown-300); transform: translateY(-1px); }
.tc-card:last-child { margin-bottom: 0; }
.tc-card--top { border-color: var(--warning-border); background: linear-gradient(180deg, var(--warning-bg) 0%, #fff 60%); }

.tc-card__rank { grid-area: rank; display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; font-size: 11px; font-weight: 800; background: var(--gray-100); color: var(--gray-600); }
.tc-rank--1 { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #fff; }
.tc-rank--2 { background: #e5e7eb; color: #4b5563; }
.tc-rank--3 { background: #fde7d3; color: #b45309; }

.tc-card__main { grid-area: main; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.tc-card__head { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.tc-card__name { font-weight: 700; color: var(--brown-900); font-size: var(--font-size-sm); line-height: 1.35; word-break: break-word; }
.tc-top-tag { padding: 1px 7px; border-radius: 999px; background: var(--warning-bg); color: var(--warning-fg); font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; }
.tc-card__sub { margin: 0; font-size: 12px; color: var(--gray-700); line-height: 1.45; }
/* Đông Y: chú thích thể bệnh gộp & cộng dồn từ nhiều pháp trị. */
.tc-card__members { margin: 0; font-size: 10px; color: var(--brown-600); font-weight: 600; }
/* Tây Y: chuỗi đối chiếu "qua pháp trị" dẫn tới bệnh. */
.tc-card__via { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin: 0; }
.tc-via-label { font-size: 10px; font-weight: 700; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.03em; }
.tc-via-chip { display: inline-flex; align-items: center; gap: 3px; padding: 1px 7px; border-radius: 999px; background: var(--chip-method-bg); color: var(--chip-method-fg); border: 1px solid var(--chip-method-border); font-size: 10px; font-weight: 600; }
.tc-via-chip small { font-weight: 800; opacity: 0.85; }
.tc-card__matched { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }

.tc-card__score { grid-area: score; display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
.tc-pct { font-size: 18px; font-weight: 800; line-height: 1; }
.tc-pct small { font-size: 10px; font-weight: 700; }
.tc-pct.conf-high { color: var(--success-fg); }
.tc-pct.conf-mid { color: var(--warning-fg); }
.tc-pct.conf-low { color: var(--gray-400); }
.tc-pct-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; white-space: nowrap; }
.tc-pct-label.conf-high { color: var(--success-fg); }
.tc-pct-label.conf-mid { color: var(--warning-fg); }
.tc-pct-label.conf-low { color: var(--gray-400); }

.tc-bar { grid-area: bar; height: 5px; background: var(--gray-100); border-radius: 999px; overflow: hidden; }
.tc-bar > span { display: block; height: 100%; border-radius: 999px; transition: width 0.4s ease; }
.tc-bar > span.conf-high { background: var(--success-fg); }
.tc-bar > span.conf-mid { background: var(--warning-fg); }
.tc-bar > span.conf-low { background: var(--gray-400); }

.tc-pill { flex: 0 0 auto; padding: 1px 8px; border-radius: 999px; background: var(--brown-50); color: var(--brown-700); border: 1px solid var(--brown-100); font-size: 10px; font-weight: 700; }
.tc-tag { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; line-height: 1.4; border: 1px solid transparent; }
.tc-tag--trieu { background: var(--chip-pulse-bg); color: var(--chip-pulse-fg); border-color: var(--chip-pulse-border); }
.tc-tag--cb { background: var(--brown-100); color: var(--brown-800); border-color: var(--brown-200); }
.tc-tag--warn { background: var(--warning-bg); color: var(--warning-fg); border-color: var(--warning-border); border-style: dashed; }

.tc-hint { margin: 0; font-size: 12px; color: var(--gray-500); line-height: 1.5; }
.tc-placeholder { margin: 0; padding: var(--space-3) 0; text-align: center; font-size: var(--font-size-sm); color: var(--gray-500); font-style: italic; line-height: 1.6; }
/* Khung kết quả ở mục VII — full-width, chảy tự nhiên theo trang (không cuộn nội bộ). */
.tc-results-host { width: 100%; }

/* Phương Dược — chip group giống Section IV, màu vàng */
.ph-group--bai-thuoc .ph-chip {
  background: var(--chip-herb-bg); color: var(--chip-herb-fg); border-color: var(--chip-herb-border);
}
.ph-group--bai-thuoc .ph-chip--has-note:hover {
  background: var(--chip-herb-border); border-color: var(--chip-herb-fg);
}
.ph-group--bai-thuoc .ph-chip--active {
  background: var(--chip-herb-fg); color: var(--white); border-color: var(--chip-herb-fg);
}
.ph-group__note--bt {
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  background: var(--warning-bg);
}
.bt-note-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.bt-note-head strong {
  color: var(--brown-800);
  font-weight: 700;
  flex: 1;
  word-break: break-word;
}
.bt-note-count {
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 600;
  color: var(--brown-700);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--brown-200);
  padding: 1px 8px;
  border-radius: 999px;
}
.bt-note-empty {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--gray-500);
  font-style: italic;
  text-align: center;
  padding: var(--space-2) 0;
}

.bt-detail-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--white);
}
.bt-detail-table__head,
.bt-detail-table__row {
  display: grid;
  grid-template-columns: minmax(120px, 1.6fr) minmax(70px, 0.8fr) minmax(90px, 1fr);
  gap: var(--space-2);
  padding: 5px var(--space-2);
  align-items: center;
}
.bt-detail-table__head {
  background: var(--surface-2);
  border-bottom: 1px solid var(--gray-100);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gray-500);
}
.bt-detail-table__row + .bt-detail-table__row { border-top: 1px solid var(--gray-100); }
.bt-detail-table__row:hover { background: var(--surface-2); }
.btd-col { font-size: var(--font-size-sm); color: var(--gray-800); min-width: 0; word-break: break-word; }
.btd-col--name { font-weight: 600; color: var(--brown-900); }
.btd-col--lieu { font-family: ui-monospace, monospace; }

.result-card {
  background: var(--white);
  border: 1px solid var(--brown-200);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

/* Left Column Specifics */
.patient-table-header { padding: var(--space-4); border-bottom: 1px solid var(--brown-200); }
.data-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.data-table td { padding: 6px 12px; border: 1px solid var(--gray-200); }
.data-table.mb-0 { margin-bottom: 0; }
.meridian-data-table td { text-align: center; border-color: var(--gray-100); }
.meridian-data-table td:first-child { text-align: left; }

.table-section-title { font-weight: 700; color: var(--brown-700); padding: var(--space-4) var(--space-4) var(--space-2); text-transform: uppercase; font-size: var(--font-size-sm); }
.stats-summary-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; border-top: 1px solid var(--brown-200); border-bottom: 1px solid var(--brown-200); background: var(--surface-2); }
.stat-col { padding: var(--space-2); text-align: center; font-size: var(--font-size-sm); font-weight: 600; border-right: 1px solid var(--gray-200); display: flex; flex-direction: column; justify-content: center; }
.stat-col:last-child { border-right: none; }
.stat-col .val { display: inline-block; }
.max-val { color: #dc2626; }
.min-val { color: #0284c7; }

.bg-gray { background-color: var(--gray-50); }
.text-brown-600 { color: var(--brown-600); }
/* Bat Cuong Design — 3 thẻ: Âm/Dương, Khí, Huyết */
.bc-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
}
@media (max-width: 1024px) {
  .bc-summary-grid { grid-template-columns: 1fr; }
}
.bc-summary-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  background: var(--brown-50);
  border: 1px solid var(--brown-100);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  min-width: 0;
}
.bc-card-label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--gray-600);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.bc-card-value {
  font-size: var(--font-size-sm);
  color: var(--brown-800);
  font-weight: 700;
  line-height: 1.35;
  word-break: break-word;
}

.bc-summary-card--clickable {
  cursor: pointer;
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
}
.bc-summary-card--clickable:hover {
  border-color: var(--brown-300);
  background: var(--white);
}
.bc-summary-card--active {
  border-color: var(--brown-500);
  box-shadow: 0 0 0 2px rgba(120, 53, 15, 0.15);
  background: var(--white);
}

/* Bảng I: làm nổi ô theo tab Bát cương */
.bc-stats--dim {
  opacity: 0.38;
  filter: grayscale(0.25);
  transition: opacity 0.2s ease, filter 0.2s ease;
}
.bc-stats--focus {
  transition: box-shadow 0.2s ease;
  box-shadow: inset 0 0 0 2px rgba(180, 83, 9, 0.35);
  border-radius: var(--radius-sm);
}
.table-section-title.bc-section-title--dim {
  opacity: 0.4;
}
.meridian-row--dim td {
  opacity: 0.38;
  filter: grayscale(0.2);
  transition: opacity 0.2s ease, filter 0.2s ease;
}
.meridian-row--focus td {
  opacity: 1;
  filter: none;
  background-color: rgba(254, 243, 199, 0.55) !important;
  box-shadow: inset 0 0 0 1px rgba(180, 83, 9, 0.35);
}
.meridian-data-table td.meridian-cell--focus {
  opacity: 1 !important;
  filter: none !important;
  background-color: rgba(254, 243, 199, 0.7) !important;
  box-shadow: inset 0 0 0 2px rgba(120, 53, 15, 0.45);
  z-index: 1;
}
.meridian-data-table td.meridian-cell--dim {
  opacity: 0.32;
  filter: grayscale(0.2);
  transition: opacity 0.2s ease, filter 0.2s ease;
}
.stat-col.excel-stat-col--focus {
  box-shadow: inset 0 0 0 2px rgba(120, 53, 15, 0.45);
  background: rgba(254, 243, 199, 0.55);
  border-radius: var(--radius-sm);
}
.stat-col.excel-stat-col--dim {
  opacity: 0.32;
  filter: grayscale(0.15);
}
.table-footer-stat.excel-footer--focus {
  box-shadow: inset 0 0 0 2px rgba(120, 53, 15, 0.35);
  background: rgba(254, 243, 199, 0.45);
}
.table-footer-stat.bc-footer-stat--dim {
  opacity: 0.42;
}

.bc-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.bc-box { border: 1px solid; border-radius: var(--radius-md); overflow: hidden; }
.border-blue-200 { border-color: var(--info-border); }
.border-red-200 { border-color: var(--danger-border); }
.box-header { display: flex; align-items: center; gap: var(--space-2); padding: 8px 12px; font-weight: 700; font-size: var(--font-size-xs); text-transform: uppercase; border-bottom: 1px solid; }
.text-blue-700 { color: var(--info-fg); }
.bg-blue-50 { background-color: var(--info-bg); }
.text-red-700 { color: var(--danger-fg); }
.bg-red-50 { background-color: var(--danger-bg); }
.bg-white { background-color: #ffffff; }

.box-body { padding: var(--space-3); font-size: var(--font-size-sm); height: 100%; }
.bc-row { display: flex; flex-direction: column; gap: 2px; }
.bc-sub-label { font-weight: 600; font-size: var(--font-size-xs); text-transform: uppercase; opacity: 0.8; }
.bc-sub-val { color: var(--gray-800); font-weight: 500; min-height: 20px; }

.bc-tieu-ket { background: var(--surface-2); border: 1px solid var(--brown-100); border-radius: var(--radius-md); padding: var(--space-4); }
.tieu-ket-list { display: flex; flex-direction: column; gap: var(--space-3); }
.tk-item { display: flex; gap: var(--space-2); align-items: flex-start; font-size: var(--font-size-sm); line-height: 1.5; }
.tk-label { font-weight: 700; color: var(--brown-700); min-width: 85px; flex-shrink: 0; }
.tk-val { color: var(--gray-800); font-weight: 500; }

.text-blue-600 { color: #2563eb; }
.text-red-600 { color: #dc2626; }
.border-gray-100 { border-color: var(--gray-100); }
.border-b { border-bottom-width: 1px; border-bottom-style: solid; }
.mb-3 { margin-bottom: var(--space-3); }
.pt-4 { padding-top: var(--space-4); }
.mt-2 { margin-top: var(--space-2); }
.p-5 { padding: var(--space-5); }
.px-5 { padding-left: var(--space-5); padding-right: var(--space-5); }
.pb-5 { padding-bottom: var(--space-5); }

.table-footer-stat { padding: var(--space-4); background: var(--brown-50); border-top: 1px solid var(--brown-200); font-size: var(--font-size-sm); display: flex; align-items: center; justify-content: flex-end; }

/* Right Column Specifics */
.info-group { display: flex; flex-direction: column; gap: var(--space-2); }
.info-label { font-size: var(--font-size-sm); font-weight: 700; color: var(--gray-500); text-transform: uppercase; border-bottom: 1px solid var(--gray-100); padding-bottom: 4px; }
.info-text { font-size: var(--font-size-sm); color: var(--gray-800); line-height: 1.5; }
.font-medium { font-weight: 500; color: var(--brown-800); }

.tags-list { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.tag { padding: 4px 10px; border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: 600; }
.tag-yin { background: var(--info-bg); color: var(--info-fg); }
.tag-hot { background: var(--danger-bg); color: var(--danger-fg); }
.tag-empty { background: var(--brown-100); color: var(--brown-700); }

.pathology-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--brown-50);
  border-radius: var(--radius-md);
  text-align: center;
  color: var(--brown-700);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.treatment-box {
  background: var(--surface-2);
  border-left: 3px solid var(--brown-500);
  padding: var(--space-3);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.syndrome-tag {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--white);
  border: 1px solid var(--brown-200);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  transition: all var(--transition-fast);
}
.comparison-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.comparison-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--brown-700);
  text-transform: uppercase;
  padding: 0 var(--space-1);
}
.comparison-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}
.comparison-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--white);
  border: 1px solid var(--brown-200);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
}
.comparison-cell--clickable {
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}
.comparison-cell--clickable:hover {
  border-color: var(--brown-400);
  background: var(--brown-50);
}
.comparison-cell--active {
  border-color: var(--brown-500);
  box-shadow: 0 0 0 2px rgba(120, 53, 15, 0.12);
  background: var(--brown-50);
}
/* Mô hình hiện đại — viền/nền xanh để phân biệt với Excel màu nâu */
.comparison-cell--modern {
  border-color: var(--info-border);
  background: var(--info-bg);
}
.comparison-cell--modern.comparison-cell--clickable:hover {
  border-color: var(--info-fg);
  background: var(--info-bg);
}
.comparison-cell--modern.comparison-cell--active {
  border-color: var(--info-fg);
  background: var(--info-bg);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}
/* Toggle Mô Hình Bệnh Lý */
.mhbl-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: var(--brown-50);
  border: 1px dashed var(--brown-200);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 700;
  color: var(--brown-800);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.mhbl-toggle:hover {
  background: var(--brown-100);
  border-color: var(--brown-400);
}
.mhbl-toggle-caret {
  display: inline-block;
  transition: transform 0.2s ease;
  color: var(--brown-500);
}
.mhbl-toggle--open .mhbl-toggle-caret { transform: rotate(90deg); }
.mhbl-toggle-hint {
  font-weight: 400;
  text-transform: none;
  color: var(--gray-500);
  font-size: var(--font-size-xs);
  letter-spacing: 0;
}
.mhbl-toggle-action {
  margin-left: auto;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--brown-600);
  background: var(--white);
  border: 1px solid var(--brown-300);
  padding: 2px 10px;
  border-radius: 999px;
  letter-spacing: 0;
}
.mhbl-content { margin-top: var(--space-3); }
.col-left, .col-right {
  background: var(--brown-50);
  border: 1px solid var(--brown-100);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
}
.syndrome-tag:hover {
  border-color: var(--brown-400);
  background: var(--brown-50);
}
.synd-idx {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--brown-100);
  color: var(--brown-700);
  border-radius: 50%;
  font-size: var(--font-size-xs);
  font-weight: 700;
}
.synd-name {
  flex: 1;
  font-weight: 600;
  color: var(--gray-800);
}
.synd-rate {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--success-fg); /* Green */
  background: var(--success-bg);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

/* Nút "Pháp trị" trên mỗi mô hình bệnh Đông Y (Section III) */
.pt-search-btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  font-size: 11px;
  font-weight: 700;
  font-family: inherit;
  color: var(--brown-700);
  background: var(--white);
  border: 1px solid var(--brown-300);
  border-radius: 999px;
  cursor: pointer;
  transition: all var(--transition-fast, 0.15s);
}
.pt-search-btn:hover { background: var(--brown-600); color: var(--white); border-color: var(--brown-600); }
.pt-search-ic { width: 13px; height: 13px; }

/* Popup tra cứu pháp trị */
.ptm-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-4);
  z-index: 300;
  animation: ptm-fade 0.18s ease;
}
@keyframes ptm-fade { from { opacity: 0; } to { opacity: 1; } }
.ptm-modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  width: 100%; max-width: 900px; max-height: 88vh;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.22);
}
.ptm-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--gray-100);
  background: var(--brown-50);
}
.ptm-head__title { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ptm-head h3 { margin: 0; font-size: var(--font-size-lg); font-weight: 700; color: var(--brown-900); }
.ptm-context { font-size: 12px; color: var(--brown-600); font-weight: 600; word-break: break-word; }
.ptm-close { flex: 0 0 auto; background: none; border: 0; font-size: 18px; color: var(--gray-500); cursor: pointer; padding: 4px 8px; border-radius: var(--radius-sm); }
.ptm-close:hover { background: var(--gray-100); color: var(--gray-800); }

.ptm-search { position: relative; display: flex; align-items: center; padding: var(--space-3) var(--space-5); border-bottom: 1px solid var(--gray-100); }
.ptm-search__ic { position: absolute; left: calc(var(--space-5) + 10px); width: 16px; height: 16px; color: var(--gray-400); pointer-events: none; }
.ptm-search__input { width: 100%; padding: var(--space-2) 34px; border: 1px solid var(--gray-300); border-radius: var(--radius-md); font-size: var(--font-size-md); font-family: inherit; box-sizing: border-box; }
.ptm-search__input:focus { outline: none; border-color: var(--brown-500); box-shadow: var(--focus-ring); }
.ptm-search__clear { position: absolute; right: calc(var(--space-5) + 8px); width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border: 0; background: var(--gray-100); color: var(--gray-600); border-radius: 50%; font-size: 12px; cursor: pointer; }
.ptm-search__clear:hover { background: var(--gray-200); color: var(--gray-800); }

.ptm-body { padding: var(--space-4) var(--space-5); overflow-y: auto; flex: 1; background: var(--surface-2); }
.ptm-state { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); padding: var(--space-8) 0; color: var(--gray-500); }
.ptm-state p { margin: 0; }
.ptm-error { padding: var(--space-3); background: var(--danger-bg); color: var(--danger); border-radius: var(--radius-md); font-size: var(--font-size-sm); }
.muted-italic { font-style: italic; }
.ptm-count { margin: 0 0 var(--space-3); font-size: 12px; font-weight: 600; color: var(--gray-500); }

/* 2 cột Đông Y / Tây Y trong popup */
.ptm-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: var(--space-4); align-items: start; }
.ptm-col { min-width: 0; }
.ptm-col__title { display: flex; align-items: center; gap: 6px; margin: 0 0 var(--space-3); padding: 4px 0 6px; font-size: var(--font-size-sm); font-weight: 700; color: var(--gray-800); border-bottom: 1px solid var(--gray-200); position: sticky; top: -1px; background: var(--surface-2); z-index: 1; }
.ptm-col__dot { width: 9px; height: 9px; border-radius: 50%; flex: 0 0 auto; }
.ptm-col__title--dongy .ptm-col__dot { background: var(--success-fg); }
.ptm-col__title--tayy .ptm-col__dot { background: var(--chip-brand-fg); }
.ptm-col__count { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 18px; padding: 0 6px; border-radius: 9px; font-size: 10px; font-weight: 700; background: var(--gray-100); color: var(--gray-600); }
.ptm-col__title--dongy .ptm-col__count { background: var(--success-bg); color: var(--success-fg); }
.ptm-col__title--tayy .ptm-col__count { background: var(--chip-brand-bg); color: var(--chip-brand-fg); }
.ptm-col__empty { margin: 0; padding: var(--space-2) 0; color: var(--gray-400); font-style: italic; font-size: var(--font-size-sm); }

.ptm-card { display: block; text-decoration: none; color: inherit; background: var(--white); border: 1px solid var(--brown-100); border-radius: var(--radius-lg); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-3); box-shadow: 0 1px 2px rgba(74, 47, 23, 0.04); transition: box-shadow var(--transition-fast, 0.15s), border-color var(--transition-fast, 0.15s), transform var(--transition-fast, 0.15s); }
.ptm-card:last-child { margin-bottom: 0; }
.ptm-card:hover { box-shadow: 0 6px 16px rgba(74, 47, 23, 0.1); border-color: var(--brown-300); transform: translateY(-1px); }
.ptm-card__head { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
.ptm-card__id { flex: 0 0 auto; font-size: 11px; font-weight: 700; color: var(--brown-700); background: var(--brown-50); border: 1px solid var(--brown-200); padding: 1px 7px; border-radius: 999px; }
.ptm-card__name { flex: 1; min-width: 0; font-weight: 700; color: var(--brown-900); font-size: var(--font-size-md); word-break: break-word; text-decoration: none; }
.ptm-card__name:hover { text-decoration: underline; }
.ptm-card__open { flex: 0 0 auto; font-size: 11px; font-weight: 700; color: var(--brown-600); text-decoration: none; }
.ptm-card__open:hover { color: var(--brown-800); text-decoration: underline; }
.ptm-card__phap { margin: 6px 0 0; font-size: var(--font-size-sm); color: var(--gray-700); line-height: 1.5; }
.ptm-card__phap-label { font-weight: 700; color: var(--brown-700); }
.ptm-row { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; margin-top: 6px; }
.ptm-row__label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--gray-400); margin-right: 2px; }
.ptm-tag { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; line-height: 1.4; border: 1px solid transparent; }
.ptm-tag--tang { background: var(--chip-pattern-bg); color: var(--chip-pattern-fg); border-color: var(--chip-pattern-border); }
.ptm-tag--trieu { background: var(--chip-symptom-bg); color: var(--chip-symptom-fg); border-color: var(--chip-symptom-border); }
.ptm-tag--bai { background: var(--chip-herb-bg); color: var(--chip-herb-fg); border-color: var(--chip-herb-border); }

/* Bệnh Tây Y — gộp theo chủng bệnh, giống section pháp trị */
.ptm-row--tayy { align-items: flex-start; }
.ptm-bty-groups { display: flex; flex-wrap: wrap; gap: 6px; }
.ptm-bty-group { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 5px; padding: 3px 8px; background: var(--chip-brand-bg); border: 1px solid var(--chip-brand-border); border-radius: var(--radius-md); }
.ptm-bty-group__label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--chip-brand-fg); white-space: nowrap; }
.ptm-tag--tayy { background: var(--chip-brand-bg); color: var(--chip-brand-fg); border-color: var(--chip-brand-border); text-decoration: none; cursor: pointer; transition: background 0.12s, border-color 0.12s; }
.ptm-tag--tayy:hover { background: var(--chip-brand-border); border-color: var(--chip-brand-fg); }

@media (max-width: 640px) {
  .ptm-modal { max-height: 92vh; }
}
.leading-relaxed { line-height: 1.625; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.gap-2 { gap: 0.5rem; }

/* Utilities */
.mt-3 { margin-top: var(--space-3); }
.mt-4 { margin-top: var(--space-4); }
.mt-6 { margin-top: var(--space-6); }

/* Loading & Error */
.loading-state { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-16) 0; color: var(--gray-500); }
.spinner { width: 32px; height: 32px; border: 3px solid var(--gray-200); border-top-color: var(--brown-500); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-state { text-align: center; padding: var(--space-10); color: var(--danger); }
.btn-secondary { padding: 10px 20px; background: var(--white); color: var(--gray-700); font-size: var(--font-size-sm); font-weight: 600; border-radius: var(--radius-md); border: 1px solid var(--gray-300); transition: all var(--transition-fast); cursor: pointer; }
.btn-secondary:hover { background: var(--gray-50); }

/* Responsive */
@media (max-width: 1024px) {
  .results-layout { grid-template-columns: 1fr; }
  .mock-stats-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
}
@media (max-width: 768px) {
  /* meta tiêu đề: cho xuống dòng, ẩn dấu "|" khi đã xuống dòng */
  .exam-meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px var(--space-2); }
  .exam-meta .divider { display: none; }
  /* layout dọc: giảm khoảng cách giữa các phần */
  .results-layout { gap: var(--space-4); }
  .result-section { gap: var(--space-3); }
  /* thẻ kết quả: giảm padding để nội dung có thêm bề ngang */
  .result-card { padding: var(--space-4); }
  .patient-table-header { padding: var(--space-3); }
  /* bảng thông tin BN: chữ nhỏ lại cho bớt chật (nhiều cột trên 1 hàng) */
  .patient-table-header .data-table { font-size: var(--font-size-xs); }
  .data-table td { padding: 5px 8px; }
  /* hàng thống kê 5 cột: thu gọn cho vừa màn hình hẹp */
  .stat-col { padding: 6px 3px; font-size: var(--font-size-xs); }
  .section-title { font-size: var(--font-size-md); }
}
@media (max-width: 480px) {
  .result-card { padding: var(--space-3); }
  .page-title { font-size: var(--font-size-xl); }
  .patient-table-header .data-table td { padding: 4px 6px; }
}
</style>
