<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick, reactive, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Đồ thị tri thức (cytoscape) — nạp động để không gộp vào chunk chính.
const BaiThuocGraph = defineAsyncComponent(() => import('@/components/BaiThuocGraph.vue'))

const router = useRouter()

function phapTriHref(id: number): string {
  return router.resolve({ name: 'treatments', query: { ptId: id } }).href
}

function benhTayYHref(id: number): string {
  return router.resolve({
    name: 'western-medicine',
    query: { tab: 'benh-tay-y', btyId: id },
  }).href
}
// xlsx (~nặng) được nạp ĐỘNG ngay trong hàm Xuất/Nhập Excel bên dưới — xem `await import('xlsx')`.
// Nhờ vậy thư viện này KHÔNG nằm trong chunk trang Quản Lý Thuốc, chỉ tải khi người dùng bấm nút.
import {
  Chart,
  RadarController,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  RadialLinearScale,
} from 'chart.js'
import { api } from '@/services/api'
import PharmacologyManager from '@/components/PharmacologyManager.vue'

Chart.register(RadarController, PointElement, LineElement, Filler, Tooltip, Legend, RadialLinearScale)

interface CongDungLink { id_cong_dung?: number; ghi_chu?: string | null; congDung?: { ten_cong_dung?: string | null } | null }
interface ChuTriLink { id_chu_tri?: number; ghi_chu?: string | null; chuTri?: { ten_chu_tri?: string | null } | null }
interface KiengKyLink { id_kieng_ky?: number; ghi_chu?: string | null; kiengKy?: { ten_kieng_ky?: string | null } | null }

interface ViThuocLite {
  id: number
  ten_vi_thuoc: string
  tinh?: string | null
  vi?: string | null
  quy_kinh?: string | null
  congDungLinks?: CongDungLink[] | null
  chuTriLinks?: ChuTriLink[] | null
  kiengKyLinks?: KiengKyLink[] | null
}

interface BaiThuocChiTietLite {
  id_vi_thuoc?: number
  lieu_luong: string | null
  quy_kinh?: string | null
  vai_tro?: string | null
  viThuoc?: ViThuocLite | null
}

interface PhapTriLite {
  id: number
  nguyen_tac: string | null
  chung_trang: string | null
  trieu_chung_list?: TrieuChungLite[] | null
}

interface BaiThuocPhapTriLink {
  idPhapTri: number
  thuTu?: number
  phapTri?: PhapTriLite | null
}

interface TrieuChungLite {
  id: number
  ten_trieu_chung: string
}

interface BaiThuoc {
  id: number
  ten_bai_thuoc: string
  nguon_goc: string | null
  cach_dung: string | null
  chung_trang?: string | null
  trieu_chung: string | null
  trieuChungList?: TrieuChungLite[] | null
  phapTriLinks?: BaiThuocPhapTriLink[] | null
  chiTietViThuoc?: BaiThuocChiTietLite[] | null
}

interface KinhMachLink {
  id_kinh_mach: number
  kinhMach?: { idKinhMach?: number; ten_kinh_mach?: string | null } | null
}

interface KinhMachLite {
  idKinhMach: number
  ten_kinh_mach: string | null
  ten_viet_tat?: string | null
}

interface ViThuoc {
  id: number
  ten_vi_thuoc: string
  tinh: string | null
  vi: string | null
  quy_kinh: string | null
  lieu_dung?: string | null
  ten_khoa_hoc?: string | null
  ten_han?: string | null
  ten_pinyin?: string | null
  bo_phan_dung?: string | null
  kinhMachLinks?: KinhMachLink[] | null
}

interface BaiThuocFormChiTiet {
  id_vi_thuoc: number | null
  lieu_luong: string
}

interface BaiThuocForm {
  ten_bai_thuoc: string
  nguon_goc: string
  cach_dung: string
  phap_tri_ids: number[]
  trieu_chung_ids: number[]
  chi_tiet: BaiThuocFormChiTiet[]
}

interface ViThuocForm {
  ten_vi_thuoc: string
  tinh: string
  vi: string
  quy_kinh: string
  lieu_dung: string
  ten_khoa_hoc: string
  ten_han: string
  ten_pinyin: string
  bo_phan_dung: string
  kinh_mach_ids: number[]
  nhom_nho_ids: number[]
}

const activeTab = ref<'bai-thuoc' | 'vi-thuoc' | 'duoc-ly'>('bai-thuoc')
const isLoading = ref(true)
const error = ref<string | null>(null)
/** Loading khi reload page list (search/page change/filter) — overlay nhẹ trên grid. */
const baiThuocPageLoading = ref(false)
const viThuocPageLoading = ref(false)
/** Loading khi mở modal Sửa / Phân tích bài thuốc (đợi full data về). */
const btFullLoading = ref(false)
const anaLoading = ref(false)

const baiThuocList = ref<BaiThuoc[]>([])
const baiThuocTotal = ref(0)
const baiThuocStats = ref<{ all: number; 'dong-y': number; 'tay-y': number }>({ all: 0, 'dong-y': 0, 'tay-y': 0 })
const viThuocList = ref<ViThuoc[]>([])
const viThuocTotal = ref(0)
const phapTriOptions = ref<PhapTriLite[]>([])
const trieuChungOptions = ref<TrieuChungLite[]>([])
const kinhMachList = ref<KinhMachLite[]>([])
/** Cached full list of vi thuoc cho dropdown trong modal bài thuốc + phân tích. Lazy load 1 lần. */
const viThuocFullList = ref<ViThuoc[]>([])
const viThuocFullLoaded = ref(false)
const baiThuocSupportLoaded = ref(false)
const viThuocSupportLoaded = ref(false)
/** Cache full bài thuốc theo id để dùng cho phân tích / sửa khi list chỉ là lite. */
const baiThuocFullCache = ref<Map<number, BaiThuoc>>(new Map())

interface NhomNhoLite {
  id: number
  ten_nhom: string
  nhomLon?: { id: number; ten_nhom: string } | null
  viThuocLinks?: Array<{ idViThuoc: number; viThuoc?: { id: number } | null }> | null
  chuTriLinks?: Array<{ idChuTri: number; chuTri?: { ten_chu_tri: string } | null }> | null
}
const nhomNhoList = ref<NhomNhoLite[]>([])

interface BenhTayYLite {
  id: number
  ten_benh: string
  chungBenh?: { id: number; ten_chung_benh: string } | null
  baiThuocList?: Array<{ id: number }> | null
}
const benhTayYList = ref<BenhTayYLite[]>([])

/** Reverse map: bai_thuoc.id → danh sách BenhTayY có gắn bài thuốc đó. */
const benhTayYByBaiThuoc = computed<Map<number, BenhTayYLite[]>>(() => {
  const m = new Map<number, BenhTayYLite[]>()
  for (const bty of benhTayYList.value) {
    for (const bt of bty.baiThuocList ?? []) {
      const list = m.get(bt.id) ?? []
      list.push(bty)
      m.set(bt.id, list)
    }
  }
  return m
})

function benhTayYLabelsForBaiThuoc(btId: number): BenhTayYLite[] {
  return benhTayYByBaiThuoc.value.get(btId) ?? []
}

interface BenhTayYGroup {
  key: string
  chungBenhName: string
  items: BenhTayYLite[]
}

function benhTayYGroupsForBaiThuoc(btId: number): BenhTayYGroup[] {
  const groups = new Map<string, BenhTayYGroup>()
  for (const bty of benhTayYLabelsForBaiThuoc(btId)) {
    const name = bty.chungBenh?.ten_chung_benh?.trim() || 'Khác'
    const key = bty.chungBenh?.id != null ? `cb-${bty.chungBenh.id}` : `name-${name.toLowerCase()}`
    const g = groups.get(key) ?? { key, chungBenhName: name, items: [] }
    g.items.push(bty)
    groups.set(key, g)
  }
  return Array.from(groups.values()).sort((a, b) => a.chungBenhName.localeCompare(b.chungBenhName, 'vi'))
}

// Pagination
const itemsPerPage = ref(12)
const baiThuocPage = ref(1)
const viThuocPage = ref(1)

// Search
const baiThuocSearch = ref('')
const viThuocSearch = ref('')

// Filter theo loại bài thuốc: tất cả / chỉ Đông Y (không gắn bệnh Tây Y) / có Tây Y
type BaiThuocCategory = 'all' | 'dong-y' | 'tay-y'
const baiThuocCategory = ref<BaiThuocCategory>('all')

// Khi đang ở tab "Tây Y", có thể lọc thêm theo chủng bệnh (null = tất cả chủng)
const selectedChungBenhId = ref<number | null>(null)

// Lọc thêm theo Tạng phủ + Tổn thương-Tác nhân (multi-select) — áp dụng cho cả Đông Y và Tây Y
const selectedTangPhuIds = ref<number[]>([])
const selectedTonThuongList = ref<string[]>([])
interface ExtraFilterOption { id: number; name: string; count: number }
const tangPhuStats = ref<ExtraFilterOption[]>([])
const tonThuongStats = ref<ExtraFilterOption[]>([])

// Filter theo nhóm dược lý cho tab vị thuốc
const viFilterNhomLonId = ref<number | null>(null)
const viFilterNhomNhoId = ref<number | null>(null)

interface NhomLonOption {
  id: number
  ten_nhom: string
}
interface NhomNhoOption {
  id: number
  ten_nhom: string
  idNhomLon: number
}

const allNhomLonOptions = computed<NhomLonOption[]>(() => {
  const seen = new Map<number, NhomLonOption>()
  for (const nn of nhomNhoList.value) {
    const parent = nn.nhomLon
    if (!parent) continue
    if (!seen.has(parent.id)) {
      seen.set(parent.id, { id: parent.id, ten_nhom: parent.ten_nhom })
    }
  }
  return Array.from(seen.values()).sort((a, b) =>
    a.ten_nhom.localeCompare(b.ten_nhom, 'vi'),
  )
})

const allNhomNhoOptions = computed<NhomNhoOption[]>(() => {
  const out: NhomNhoOption[] = []
  for (const nn of nhomNhoList.value) {
    if (!nn.nhomLon) continue
    if (viFilterNhomLonId.value != null && nn.nhomLon.id !== viFilterNhomLonId.value) continue
    out.push({ id: nn.id, ten_nhom: nn.ten_nhom, idNhomLon: nn.nhomLon.id })
  }
  return out.sort((a, b) => a.ten_nhom.localeCompare(b.ten_nhom, 'vi'))
})

/** Set id vị thuốc thuộc nhóm nhỏ đã chọn (nếu chọn). */
const viThuocIdsInSelectedNhomNho = computed<Set<number> | null>(() => {
  if (viFilterNhomNhoId.value != null) {
    const nn = nhomNhoList.value.find((x) => x.id === viFilterNhomNhoId.value)
    return new Set((nn?.viThuocLinks ?? []).map((l) => l.idViThuoc))
  }
  if (viFilterNhomLonId.value != null) {
    const ids = new Set<number>()
    for (const nn of nhomNhoList.value) {
      if (nn.nhomLon?.id !== viFilterNhomLonId.value) continue
      for (const l of nn.viThuocLinks ?? []) ids.add(l.idViThuoc)
    }
    return ids
  }
  return null
})

function clearViThuocFilters() {
  viFilterNhomLonId.value = null
  viFilterNhomNhoId.value = null
}

watch(viFilterNhomLonId, () => {
  // Khi đổi nhóm lớn, reset nhóm nhỏ nếu không còn thuộc nhóm lớn mới
  if (viFilterNhomNhoId.value != null) {
    const nn = nhomNhoList.value.find((x) => x.id === viFilterNhomNhoId.value)
    if (!nn || (viFilterNhomLonId.value != null && nn.nhomLon?.id !== viFilterNhomLonId.value)) {
      viFilterNhomNhoId.value = null
    }
  }
  viThuocPage.value = 1
  void loadViThuocPage()
})

watch(viFilterNhomNhoId, () => {
  viThuocPage.value = 1
  void loadViThuocPage()
})

/** Server đã filter & paginate; client chỉ render baiThuocList trực tiếp. */
const filteredBaiThuoc = computed(() => baiThuocList.value)

const baiThuocCategoryCounts = computed(() => baiThuocStats.value)

interface ChungBenhTayYOption {
  id: number
  name: string
  count: number
}

/** Danh sách chủng bệnh (lấy từ bệnh Tây Y) có ít nhất 1 bài thuốc gắn vào. */
const chungBenhTayYOptions = computed<ChungBenhTayYOption[]>(() => {
  const acc = new Map<number, { name: string; btIds: Set<number> }>()
  for (const bty of benhTayYList.value) {
    const cb = bty.chungBenh
    if (!cb) continue
    const entry = acc.get(cb.id) ?? { name: cb.ten_chung_benh, btIds: new Set<number>() }
    for (const bt of bty.baiThuocList ?? []) entry.btIds.add(bt.id)
    acc.set(cb.id, entry)
  }
  const out: ChungBenhTayYOption[] = []
  for (const [id, v] of acc) {
    if (v.btIds.size === 0) continue
    out.push({ id, name: v.name, count: v.btIds.size })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
})

const filteredViThuoc = computed(() => viThuocList.value)

// Server đã paginate; alias để giữ template không phải đổi.
const pagedBaiThuoc = computed(() => baiThuocList.value)
const pagedViThuoc = computed(() => viThuocList.value)

const totalBTPage = computed(() => Math.max(1, Math.ceil(baiThuocTotal.value / itemsPerPage.value)))
const totalVTPage = computed(() => Math.max(1, Math.ceil(viThuocTotal.value / itemsPerPage.value)))

// Debounce search 2s rồi reload page 1.
let baiThuocSearchTimer: ReturnType<typeof setTimeout> | null = null
watch(baiThuocSearch, () => {
  if (baiThuocSearchTimer) clearTimeout(baiThuocSearchTimer)
  baiThuocSearchTimer = setTimeout(() => {
    baiThuocPage.value = 1
    void loadBaiThuocPage()
  }, 2000)
})

let viThuocSearchTimer: ReturnType<typeof setTimeout> | null = null
watch(viThuocSearch, () => {
  if (viThuocSearchTimer) clearTimeout(viThuocSearchTimer)
  viThuocSearchTimer = setTimeout(() => {
    viThuocPage.value = 1
    void loadViThuocPage()
  }, 2000)
})

watch(baiThuocCategory, (v) => {
  baiThuocPage.value = 1
  if (v !== 'tay-y') selectedChungBenhId.value = null
  if (v === 'all') {
    selectedTangPhuIds.value = []
    selectedTonThuongList.value = []
  }
  void loadBaiThuocPage()
})

watch(selectedChungBenhId, () => {
  baiThuocPage.value = 1
  void loadBaiThuocPage()
})

watch(
  selectedTangPhuIds,
  () => {
    baiThuocPage.value = 1
    void loadBaiThuocPage()
  },
  { deep: true },
)

watch(
  selectedTonThuongList,
  () => {
    baiThuocPage.value = 1
    void loadBaiThuocPage()
  },
  { deep: true },
)

function toggleTangPhu(id: number) {
  selectedTangPhuIds.value = selectedTangPhuIds.value.includes(id)
    ? selectedTangPhuIds.value.filter((x) => x !== id)
    : [...selectedTangPhuIds.value, id]
}

function toggleTonThuong(name: string) {
  selectedTonThuongList.value = selectedTonThuongList.value.includes(name)
    ? selectedTonThuongList.value.filter((x) => x !== name)
    : [...selectedTonThuongList.value, name]
}

function clearExtraFilters() {
  selectedTangPhuIds.value = []
  selectedTonThuongList.value = []
}

// Đổi trang → reload page mới từ server.
// Cờ chặn reload thừa khi baiThuocPage bị set lại từ focusId (deep link).
let skipBaiThuocPageWatch = false
watch(baiThuocPage, () => {
  if (skipBaiThuocPageWatch) {
    skipBaiThuocPageWatch = false
    return
  }
  void loadBaiThuocPage()
})
watch(viThuocPage, () => { void loadViThuocPage() })

// Đổi tab → load data cần cho tab đó.
watch(activeTab, () => { void loadActiveTabData() })

function getPageNumbers(current: number, total: number) {
  const pages: number[] = []
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
}

function phapTriLabel(p: PhapTriLite): string {
  return (p.nguyen_tac || '').trim()
}

function theBenhOptionLabel(p: PhapTriLite): string {
  return (p.chung_trang || '').trim()
}

function phapTriLabels(bt: BaiThuoc): string[] {
  return phapTriItems(bt).map((x) => x.name)
}

function phapTriItems(
  bt: BaiThuoc,
): Array<{ id: number | null; name: string; trieuChung: string[] }> {
  const links = (bt.phapTriLinks ?? [])
    .slice()
    .sort((a, b) => (a.thuTu ?? 0) - (b.thuTu ?? 0))
  return links
    .map((l) => ({
      id: l.phapTri?.id ?? null,
      name: (l.phapTri?.nguyen_tac || '').trim(),
      trieuChung: (l.phapTri?.trieu_chung_list ?? [])
        .map((t) => t.ten_trieu_chung)
        .filter(Boolean),
    }))
    .filter((x) => x.name.length > 0)
}

function theBenhLabels(bt: BaiThuoc): string[] {
  return theBenhItems(bt).map((x) => x.name)
}

function theBenhItems(bt: BaiThuoc): Array<{ id: number | null; name: string }> {
  const links = (bt.phapTriLinks ?? [])
    .slice()
    .sort((a, b) => (a.thuTu ?? 0) - (b.thuTu ?? 0))
  const seen = new Set<string>()
  const out: Array<{ id: number | null; name: string }> = []
  for (const l of links) {
    const v = (l.phapTri?.chung_trang || '').trim()
    if (!v || seen.has(v)) continue
    seen.add(v)
    out.push({ id: l.phapTri?.id ?? null, name: v })
  }
  return out
}

function trieuChungLabels(bt: BaiThuoc): string[] {
  if (bt.trieuChungList && bt.trieuChungList.length > 0) {
    return bt.trieuChungList.map((t) => t.ten_trieu_chung).filter(Boolean)
  }
  if (bt.trieu_chung) {
    return bt.trieu_chung.split(',').map((s) => s.trim()).filter(Boolean)
  }
  return []
}

function thanhPhanItems(bt: BaiThuoc): { ten: string; lieu: string }[] {
  return (bt.chiTietViThuoc ?? [])
    .map((ct) => ({
      ten: ct.viThuoc?.ten_vi_thuoc?.trim() || '',
      lieu: (ct.lieu_luong ?? '').trim(),
    }))
    .filter((x) => x.ten.length > 0)
}

const THANH_PHAN_PREVIEW_LIMIT = 6
const CACH_DUNG_TRUNCATE_LEN = 120
const expandedThanhPhan = ref<Set<number>>(new Set())
const expandedCachDung = ref<Set<number>>(new Set())

function toggleThanhPhanExpand(id: number) {
  const next = new Set(expandedThanhPhan.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedThanhPhan.value = next
}

function toggleCachDungExpand(id: number) {
  const next = new Set(expandedCachDung.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedCachDung.value = next
}

function visibleThanhPhanItems(bt: BaiThuoc): { ten: string; lieu: string }[] {
  const all = thanhPhanItems(bt)
  if (expandedThanhPhan.value.has(bt.id)) return all
  return all.slice(0, THANH_PHAN_PREVIEW_LIMIT)
}

function isLongCachDung(s: string | null | undefined): boolean {
  return !!s && s.length > CACH_DUNG_TRUNCATE_LEN
}

const route = useRoute()
const highlightBtId = ref<number | null>(null)

onMounted(async () => {
  const qTab = route.query.tab
  if (qTab === 'bai-thuoc' || qTab === 'vi-thuoc' || qTab === 'duoc-ly') {
    activeTab.value = qTab
  }

  const rawBtId = route.query.btId
  const targetId = Array.isArray(rawBtId) ? rawBtId[0] : rawBtId
  const btId = targetId != null ? Number(targetId) : NaN
  const hasFocus = Number.isFinite(btId)
  if (hasFocus) {
    activeTab.value = 'bai-thuoc'
    baiThuocSearch.value = ''
  }

  // Truyền focusId xuống server để nhảy đúng tới trang chứa bài thuốc target.
  await loadActiveTabData(true, hasFocus ? btId : undefined)

  if (hasFocus) {
    highlightBtId.value = btId
    await nextTick()
    const el = document.querySelector(`[data-bt-id="${btId}"]`) as HTMLElement | null
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    setTimeout(() => {
      if (highlightBtId.value === btId) highlightBtId.value = null
    }, 2500)
  }
})

/** Build query string từ object (bỏ null/undefined/''). */
function buildQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue
    const s = String(v)
    if (!s) continue
    sp.append(k, s)
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

/** Load 1 page bài thuốc từ /bai-thuoc/lite.
 *  Truyền focusId để server tự nhảy tới trang chứa bài thuốc đó (deep link). */
async function loadBaiThuocPage(focusId?: number) {
  baiThuocPageLoading.value = true
  try {
    const qs = buildQuery({
      page: baiThuocPage.value,
      limit: itemsPerPage.value,
      q: baiThuocSearch.value.trim(),
      category: baiThuocCategory.value,
      chungBenhId: baiThuocCategory.value === 'tay-y' ? selectedChungBenhId.value : null,
      tangPhuIds:
        baiThuocCategory.value !== 'all' && selectedTangPhuIds.value.length
          ? selectedTangPhuIds.value.join(',')
          : null,
      tonThuongTacNhans:
        baiThuocCategory.value !== 'all' && selectedTonThuongList.value.length
          ? selectedTonThuongList.value.join(',')
          : null,
      focusId: focusId != null && Number.isFinite(focusId) ? focusId : null,
    })
    const res: any = await api.get(`/bai-thuoc/lite${qs}`)
    baiThuocList.value = res?.data ?? []
    baiThuocTotal.value = Number(res?.total ?? 0)
    // Server trả về trang thực tế chứa focusId — đồng bộ pagination UI (không reload lại).
    if (focusId != null && Number.isFinite(Number(res?.page))) {
      const p = Number(res.page)
      if (p !== baiThuocPage.value) {
        skipBaiThuocPageWatch = true
        baiThuocPage.value = p
      }
    }
    if (res?.statsByCategory) {
      baiThuocStats.value = res.statsByCategory
    }
    tangPhuStats.value = res?.tangPhuStats ?? []
    tonThuongStats.value = res?.tonThuongStats ?? []
  } finally {
    baiThuocPageLoading.value = false
  }
}

/** Load 1 page vị thuốc từ /vi-thuoc/lite. */
async function loadViThuocPage() {
  viThuocPageLoading.value = true
  try {
    const qs = buildQuery({
      page: viThuocPage.value,
      limit: itemsPerPage.value,
      q: viThuocSearch.value.trim(),
      idNhomNho: viFilterNhomNhoId.value,
      idNhomLon: viFilterNhomNhoId.value == null ? viFilterNhomLonId.value : null,
    })
    const res: any = await api.get(`/vi-thuoc/lite${qs}`)
    viThuocList.value = res?.data ?? []
    viThuocTotal.value = Number(res?.total ?? 0)
  } finally {
    viThuocPageLoading.value = false
  }
}

/** Fetch các catalog phụ trợ cho tab Bài thuốc (1 lần / session). */
async function ensureBaiThuocSupport() {
  if (baiThuocSupportLoaded.value) return
  const [ptRes, tcRes, btyRes] = await Promise.all([
    api.get<any>('/phap-tri'),
    api.get<any>('/trieu-chung'),
    api.get<any>('/benh-tay-y'),
  ])
  phapTriOptions.value = Array.isArray(ptRes) ? ptRes : (ptRes.data || [])
  trieuChungOptions.value = Array.isArray(tcRes) ? tcRes : (tcRes.data || [])
  benhTayYList.value = Array.isArray(btyRes) ? btyRes : (btyRes.data || [])
  baiThuocSupportLoaded.value = true
}

/** Fetch các catalog phụ trợ cho tab Vị thuốc (1 lần / session). */
async function ensureViThuocSupport() {
  if (viThuocSupportLoaded.value) return
  const [kmRes, nnRes] = await Promise.all([
    api.get<any>('/kinh-mach'),
    api.get<any>('/nhom-nho-duoc-ly'),
  ])
  kinhMachList.value = Array.isArray(kmRes) ? kmRes : (kmRes.data || [])
  nhomNhoList.value = Array.isArray(nnRes) ? nnRes : (nnRes.data || [])
  viThuocSupportLoaded.value = true
}

/** Fetch full vi-thuoc list (cho dropdown bài thuốc + phân tích). 1 lần / session. */
async function ensureFullViThuocList() {
  if (viThuocFullLoaded.value) return
  const res: any = await api.get('/vi-thuoc')
  viThuocFullList.value = Array.isArray(res) ? res : (res.data || [])
  viThuocFullLoaded.value = true
}

/** Fetch nhóm nhỏ dược lý nếu chưa có (phục vụ phân tích bài thuốc). */
async function ensureNhomNhoList() {
  if (nhomNhoList.value.length > 0) return
  const res: any = await api.get('/nhom-nho-duoc-ly')
  nhomNhoList.value = Array.isArray(res) ? res : (res.data || [])
}

/** Fetch full bài thuốc theo id (cho phân tích/sửa). */
async function loadBaiThuocFull(id: number): Promise<BaiThuoc | null> {
  const cached = baiThuocFullCache.value.get(id)
  if (cached) return cached
  const res: any = await api.get(`/bai-thuoc/${id}`)
  const item: BaiThuoc | null = res && typeof res === 'object' && 'id' in res ? res as BaiThuoc : (res?.data ?? null)
  if (item) {
    const next = new Map(baiThuocFullCache.value)
    next.set(id, item)
    baiThuocFullCache.value = next
  }
  return item
}

async function loadActiveTabData(forceReload = false, focusBtId?: number) {
  error.value = null
  isLoading.value = true
  try {
    if (activeTab.value === 'bai-thuoc') {
      await ensureBaiThuocSupport()
      if (forceReload || baiThuocList.value.length === 0) {
        await loadBaiThuocPage(focusBtId)
      }
    } else if (activeTab.value === 'vi-thuoc') {
      await ensureViThuocSupport()
      if (forceReload || viThuocList.value.length === 0) {
        await loadViThuocPage()
      }
    }
  } catch (err: any) {
    console.error(err)
    error.value = 'Lỗi khi tải dữ liệu: ' + (err?.message ?? err)
  } finally {
    isLoading.value = false
  }
}

/** Backwards-compat: nơi nào cũ gọi fetchData() — vẫn refresh tab hiện tại. */
async function fetchData() {
  await loadActiveTabData(true)
}

// ─── BÀI THUỐC CRUD ───────────────────────────────────────────────────────
const btShowModal = ref(false)
const btEditingId = ref<number | null>(null)
const btSubmitting = ref(false)
const btFormError = ref<string | null>(null)
const btPhapTriSearch = ref('')
const btTrieuChungSearch = ref('')
const btViThuocSearch = ref<string[]>([])
const btPhapTriOpen = ref(false)
const btTrieuChungOpen = ref(false)
const btViThuocAddSearch = ref('')

const phapTriById = computed(() => {
  const m = new Map<number, PhapTriLite>()
  for (const p of phapTriOptions.value) m.set(p.id, p)
  return m
})

const trieuChungById = computed(() => {
  const m = new Map<number, TrieuChungLite>()
  for (const t of trieuChungOptions.value) m.set(t.id, t)
  return m
})

const viThuocById = computed(() => {
  const m = new Map<number, ViThuoc>()
  // Ưu tiên full list (lazy loaded); fallback sang page hiện tại.
  for (const v of viThuocList.value) m.set(v.id, v)
  for (const v of viThuocFullList.value) m.set(v.id, v)
  return m
})

function closeAfterBlur(fn: () => void) {
  // Delay đóng dropdown để click vào option còn kịp fire
  setTimeout(fn, 150)
}

const emptyBaiThuocForm = (): BaiThuocForm => ({
  ten_bai_thuoc: '',
  nguon_goc: '',
  cach_dung: '',
  phap_tri_ids: [],
  trieu_chung_ids: [],
  chi_tiet: [],
})

const btForm = ref<BaiThuocForm>(emptyBaiThuocForm())

const btShowDelete = ref(false)
const btDeleting = ref<BaiThuoc | null>(null)

const filteredBtPhapTri = computed(() => {
  const withTheBenh = phapTriOptions.value.filter((p) => theBenhOptionLabel(p).length > 0)
  const q = btPhapTriSearch.value.trim().toLowerCase()
  if (!q) return withTheBenh
  return withTheBenh.filter((p) => theBenhOptionLabel(p).toLowerCase().includes(q))
})

const filteredBtTrieuChung = computed(() => {
  const q = btTrieuChungSearch.value.trim().toLowerCase()
  if (!q) return trieuChungOptions.value
  return trieuChungOptions.value.filter((t) => (t.ten_trieu_chung || '').toLowerCase().includes(q))
})

function onViThuocAddChange() {
  const name = btViThuocAddSearch.value.trim()
  if (!name) return
  const match = viThuocFullList.value.find(
    (v) => (v.ten_vi_thuoc || '').toLowerCase() === name.toLowerCase(),
  )
  if (!match) return
  btForm.value.chi_tiet.push({ id_vi_thuoc: match.id, lieu_luong: '' })
  btViThuocSearch.value.push(match.ten_vi_thuoc)
  btViThuocAddSearch.value = ''
}

function toggleId(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

async function openCreateBaiThuoc() {
  btFullLoading.value = true
  btShowModal.value = true
  try {
    // Cần full vị thuốc list cho dropdown & datalist.
    await ensureFullViThuocList()
  } finally {
    btFullLoading.value = false
  }
  btEditingId.value = null
  btForm.value = emptyBaiThuocForm()
  btFormError.value = null
  btPhapTriSearch.value = ''
  btTrieuChungSearch.value = ''
  btViThuocSearch.value = []
  btViThuocAddSearch.value = ''
}

async function openEditBaiThuoc(bt: BaiThuoc) {
  btFullLoading.value = true
  btShowModal.value = true
  let full: BaiThuoc = bt
  try {
    // Lite version đã đủ chiTiet/phapTri/trieuChung. Vẫn cần full vị thuốc list cho dropdown.
    await ensureFullViThuocList()
    // Lấy chi tiết bài thuốc bản full (fallback về bt lite nếu API lỗi).
    full = (await loadBaiThuocFull(bt.id)) ?? bt
  } finally {
    btFullLoading.value = false
  }
  btEditingId.value = full.id
  const phapIds = (full.phapTriLinks ?? [])
    .slice()
    .sort((a, b) => (a.thuTu ?? 0) - (b.thuTu ?? 0))
    .map((l) => l.idPhapTri)
  const trieuIds = (full.trieuChungList ?? []).map((t) => t.id)
  const chiTiet: BaiThuocFormChiTiet[] = (full.chiTietViThuoc ?? []).map((ct) => ({
    id_vi_thuoc: ct.viThuoc?.id ?? ct.id_vi_thuoc ?? null,
    lieu_luong: ct.lieu_luong ?? '',
  }))
  btForm.value = {
    ten_bai_thuoc: full.ten_bai_thuoc ?? '',
    nguon_goc: full.nguon_goc ?? '',
    cach_dung: full.cach_dung ?? '',
    phap_tri_ids: phapIds,
    trieu_chung_ids: trieuIds,
    chi_tiet: chiTiet,
  }
  btFormError.value = null
  btPhapTriSearch.value = ''
  btTrieuChungSearch.value = ''
  btViThuocAddSearch.value = ''
  btViThuocSearch.value = chiTiet.map((c) => {
    if (c.id_vi_thuoc == null) return ''
    return viThuocById.value.get(c.id_vi_thuoc)?.ten_vi_thuoc ?? ''
  })
  btShowModal.value = true
}

function closeBaiThuocModal() {
  btShowModal.value = false
  btEditingId.value = null
}

function removeChiTietRow(i: number) {
  btForm.value.chi_tiet.splice(i, 1)
  btViThuocSearch.value.splice(i, 1)
}

function chiTietDisplayName(i: number): string {
  const row = btForm.value.chi_tiet[i]
  if (!row || row.id_vi_thuoc == null) return btViThuocSearch.value[i] || '—'
  return viThuocById.value.get(row.id_vi_thuoc)?.ten_vi_thuoc || `#${row.id_vi_thuoc}`
}

async function submitBaiThuoc() {
  if (btSubmitting.value) return
  btFormError.value = null
  const f = btForm.value
  if (!f.ten_bai_thuoc.trim()) {
    btFormError.value = 'Tên bài thuốc không được để trống'
    return
  }
  const chiTietClean = f.chi_tiet
    .filter((c) => c.id_vi_thuoc != null)
    .map((c) => ({
      id_vi_thuoc: c.id_vi_thuoc as number,
      lieu_luong: c.lieu_luong.trim() || undefined,
    }))
  const payload = {
    ten_bai_thuoc: f.ten_bai_thuoc.trim(),
    nguon_goc: f.nguon_goc.trim() || undefined,
    cach_dung: f.cach_dung.trim() || undefined,
    phap_tri_ids: f.phap_tri_ids,
    trieu_chung_ids: f.trieu_chung_ids,
    chi_tiet: chiTietClean,
  }
  btSubmitting.value = true
  try {
    if (btEditingId.value != null) {
      await api.put(`/bai-thuoc/${btEditingId.value}`, payload)
      baiThuocFullCache.value.delete(btEditingId.value)
    } else {
      await api.post('/bai-thuoc', payload)
    }
    await loadBaiThuocPage()
    closeBaiThuocModal()
  } catch (err: any) {
    btFormError.value = err.message || 'Không lưu được bài thuốc'
  } finally {
    btSubmitting.value = false
  }
}

function confirmDeleteBaiThuoc(bt: BaiThuoc) {
  btDeleting.value = bt
  btShowDelete.value = true
}

async function deleteBaiThuoc() {
  if (!btDeleting.value || btSubmitting.value) return
  btSubmitting.value = true
  const deletedId = btDeleting.value.id
  try {
    await api.delete(`/bai-thuoc/${deletedId}`)
    btShowDelete.value = false
    btDeleting.value = null
    baiThuocFullCache.value.delete(deletedId)
    await loadBaiThuocPage()
    if (pagedBaiThuoc.value.length === 0 && baiThuocPage.value > 1) {
      baiThuocPage.value--
      // watcher sẽ trigger loadBaiThuocPage cho page mới
    }
  } catch (err: any) {
    error.value = err.message || 'Không xóa được bài thuốc'
    btShowDelete.value = false
  } finally {
    btSubmitting.value = false
  }
}

// ─── EXCEL IMPORT / EXPORT (BÀI THUỐC) ────────────────────────────────────
const BT_EXCEL_COLS = [
  'Tên bài thuốc',
  'Nguồn gốc',
  'Cách dùng',
  'Thể bệnh',
  'Triệu chứng',
  'Thành phần',
] as const

const btIsExporting = ref(false)
const btIsImporting = ref(false)
const btImportProgress = ref({ current: 0, total: 0 })
const btImportFileInput = ref<HTMLInputElement | null>(null)
const btImportResult = ref<{
  rowsProcessed: number
  baiThuocCreated: number
  baiThuocUpdated: number
  errors: string[]
  missingViThuoc: { name: string; rows: number[] }[]
  missingPhapTri: { name: string; rows: number[] }[]
  missingTrieuChung: { name: string; rows: number[] }[]
} | null>(null)
const btShowImportResult = ref(false)

function btNormKey(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase()
}

function btSplitCsv(raw: unknown): string[] {
  if (raw == null) return []
  const text = String(raw)
  if (!text.trim()) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const part of text.split(',')) {
    const t = part.trim().replace(/\s+/g, ' ')
    if (!t) continue
    const k = t.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(t)
  }
  return out
}

// Parse "Tên (liều), Tên 2 (liều 2), Tên 3" → [{name, lieu}, ...]
function btParseThanhPhan(raw: unknown): { name: string; lieu: string }[] {
  if (raw == null) return []
  const text = String(raw).trim()
  if (!text) return []
  const out: { name: string; lieu: string }[] = []
  // Tách theo dấu phẩy ngoài ngoặc đơn
  let depth = 0
  let buf = ''
  const parts: string[] = []
  for (const ch of text) {
    if (ch === '(') depth++
    else if (ch === ')') depth = Math.max(0, depth - 1)
    if (ch === ',' && depth === 0) {
      parts.push(buf)
      buf = ''
    } else {
      buf += ch
    }
  }
  if (buf.trim()) parts.push(buf)
  for (const p of parts) {
    const t = p.trim()
    if (!t) continue
    const m = t.match(/^(.*?)\s*\(([^)]*)\)\s*$/)
    if (m) {
      out.push({ name: (m[1] ?? '').trim(), lieu: (m[2] ?? '').trim() })
    } else {
      out.push({ name: t, lieu: '' })
    }
  }
  return out.filter((x) => x.name)
}

/** Fetch toàn bộ bài thuốc (lite) trong 1 lần. Dùng cho export/import. */
async function fetchAllBaiThuocLite(): Promise<BaiThuoc[]> {
  const res: any = await api.get('/bai-thuoc/lite?page=1&limit=100000')
  return (res?.data ?? []) as BaiThuoc[]
}

async function btExportToExcel() {
  if (btIsExporting.value) return
  btIsExporting.value = true
  try {
    const XLSX = await import('xlsx')
    const all = await fetchAllBaiThuocLite()
    const rows: Record<string, string>[] = []
    for (const bt of all) {
      const theBenh = theBenhLabels(bt).join(', ')
      const trieuChung = trieuChungLabels(bt).join(', ')
      const thanhPhan = thanhPhanItems(bt)
        .map((it) => (it.lieu ? `${it.ten} (${it.lieu})` : it.ten))
        .join(', ')
      rows.push({
        [BT_EXCEL_COLS[0]]: bt.ten_bai_thuoc,
        [BT_EXCEL_COLS[1]]: bt.nguon_goc ?? '',
        [BT_EXCEL_COLS[2]]: bt.cach_dung ?? '',
        [BT_EXCEL_COLS[3]]: theBenh,
        [BT_EXCEL_COLS[4]]: trieuChung,
        [BT_EXCEL_COLS[5]]: thanhPhan,
      })
    }
    const ws = XLSX.utils.json_to_sheet(rows, { header: [...BT_EXCEL_COLS] })
    ws['!cols'] = [
      { wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 28 }, { wch: 36 }, { wch: 50 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Bai thuoc')
    const stamp = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `bai-thuoc-${stamp}.xlsx`)
  } catch (err: any) {
    alert('Xuất Excel thất bại: ' + (err?.message ?? String(err)))
  } finally {
    btIsExporting.value = false
  }
}

function btTriggerImport() {
  btImportFileInput.value?.click()
}

async function btHandleImportFile(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // reset để lần sau chọn lại cùng file vẫn fire
  if (!file) return
  await btImportFromExcel(file)
}

function pushMissing(map: Map<string, Set<number>>, name: string, rowNum: number) {
  const k = btNormKey(name)
  if (!k) return
  let set = map.get(k)
  if (!set) {
    set = new Set()
    map.set(k, set)
  }
  set.add(rowNum)
}

async function btImportFromExcel(file: File) {
  if (btIsImporting.value) return
  btIsImporting.value = true
  btImportProgress.value = { current: 0, total: 0 }

  const stats = {
    rowsProcessed: 0,
    baiThuocCreated: 0,
    baiThuocUpdated: 0,
    errors: [] as string[],
    missingViThuoc: [] as { name: string; rows: number[] }[],
    missingPhapTri: [] as { name: string; rows: number[] }[],
    missingTrieuChung: [] as { name: string; rows: number[] }[],
  }

  const missingViMap = new Map<string, Set<number>>()
  const missingPtMap = new Map<string, Set<number>>()
  const missingTcMap = new Map<string, Set<number>>()
  const missingViNames = new Map<string, string>() // norm → original
  const missingPtNames = new Map<string, string>()
  const missingTcNames = new Map<string, string>()

  try {
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const sheetName = wb.SheetNames[0]
    if (!sheetName) throw new Error('File không có sheet nào')
    const ws = wb.Sheets[sheetName]
    if (!ws) throw new Error(`Không đọc được sheet "${sheetName}"`)
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

    btImportProgress.value = { current: 0, total: rows.length }

    // Cần full vị thuốc + toàn bộ bài thuốc để build lookup (upsert đúng, tránh tạo trùng).
    await Promise.all([
      ensureFullViThuocList(),
      ensureBaiThuocSupport(),
    ])
    const allBaiThuoc = await fetchAllBaiThuocLite()

    // Build lookup maps
    const viByKey = new Map<string, ViThuoc>()
    for (const v of viThuocFullList.value) viByKey.set(btNormKey(v.ten_vi_thuoc), v)

    const ptByTheBenh = new Map<string, PhapTriLite>()
    for (const p of phapTriOptions.value) {
      const k = btNormKey(p.chung_trang || '')
      if (k && !ptByTheBenh.has(k)) ptByTheBenh.set(k, p)
    }

    const tcByKey = new Map<string, TrieuChungLite>()
    for (const t of trieuChungOptions.value) tcByKey.set(btNormKey(t.ten_trieu_chung), t)

    const btByKey = new Map<string, BaiThuoc>()
    for (const bt of allBaiThuoc) btByKey.set(btNormKey(bt.ten_bai_thuoc), bt)

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row) {
        btImportProgress.value = { current: i + 1, total: rows.length }
        continue
      }
      const rowNum = i + 2 // header = row 1
      try {
        const tenBt = String(row[BT_EXCEL_COLS[0]] ?? '').trim()
        if (!tenBt) {
          stats.errors.push(`Dòng ${rowNum}: thiếu «Tên bài thuốc»`)
          btImportProgress.value = { current: i + 1, total: rows.length }
          continue
        }
        const nguonGoc = String(row[BT_EXCEL_COLS[1]] ?? '').trim()
        const cachDung = String(row[BT_EXCEL_COLS[2]] ?? '').trim()

        // Thể bệnh → phap_tri_ids
        const theBenhNames = btSplitCsv(row[BT_EXCEL_COLS[3]])
        const phapTriIds: number[] = []
        for (const name of theBenhNames) {
          const found = ptByTheBenh.get(btNormKey(name))
          if (found) phapTriIds.push(found.id)
          else {
            pushMissing(missingPtMap, name, rowNum)
            missingPtNames.set(btNormKey(name), name)
          }
        }

        // Triệu chứng
        const trieuChungNames = btSplitCsv(row[BT_EXCEL_COLS[4]])
        const trieuChungIds: number[] = []
        for (const name of trieuChungNames) {
          const found = tcByKey.get(btNormKey(name))
          if (found) trieuChungIds.push(found.id)
          else {
            pushMissing(missingTcMap, name, rowNum)
            missingTcNames.set(btNormKey(name), name)
          }
        }

        // Thành phần (vị thuốc + liều)
        const tpList = btParseThanhPhan(row[BT_EXCEL_COLS[5]])
        const chiTiet: { id_vi_thuoc: number; lieu_luong?: string }[] = []
        for (const it of tpList) {
          const found = viByKey.get(btNormKey(it.name))
          if (found) {
            chiTiet.push({ id_vi_thuoc: found.id, lieu_luong: it.lieu || undefined })
          } else {
            pushMissing(missingViMap, it.name, rowNum)
            missingViNames.set(btNormKey(it.name), it.name)
            // bỏ qua, không thêm vào chi_tiet
          }
        }

        const payload = {
          ten_bai_thuoc: tenBt,
          nguon_goc: nguonGoc || undefined,
          cach_dung: cachDung || undefined,
          phap_tri_ids: phapTriIds,
          trieu_chung_ids: trieuChungIds,
          chi_tiet: chiTiet,
        }

        const existing = btByKey.get(btNormKey(tenBt))
        if (existing) {
          await api.put(`/bai-thuoc/${existing.id}`, payload)
          stats.baiThuocUpdated += 1
        } else {
          const res: any = await api.post('/bai-thuoc', payload)
          const newId: number | undefined = res?.id ?? res?.data?.id
          if (newId) {
            const newBt: BaiThuoc = {
              id: newId,
              ten_bai_thuoc: tenBt,
              nguon_goc: nguonGoc || null,
              cach_dung: cachDung || null,
              trieu_chung: null,
            }
            btByKey.set(btNormKey(tenBt), newBt)
          }
          stats.baiThuocCreated += 1
        }
        stats.rowsProcessed += 1
      } catch (err: any) {
        stats.errors.push(`Dòng ${rowNum}: ${err?.message ?? String(err)}`)
      } finally {
        btImportProgress.value = { current: i + 1, total: rows.length }
      }
    }

    // Aggregate missing
    for (const [k, set] of missingViMap) {
      stats.missingViThuoc.push({ name: missingViNames.get(k) || k, rows: [...set].sort((a, b) => a - b) })
    }
    for (const [k, set] of missingPtMap) {
      stats.missingPhapTri.push({ name: missingPtNames.get(k) || k, rows: [...set].sort((a, b) => a - b) })
    }
    for (const [k, set] of missingTcMap) {
      stats.missingTrieuChung.push({ name: missingTcNames.get(k) || k, rows: [...set].sort((a, b) => a - b) })
    }
    stats.missingViThuoc.sort((a, b) => a.name.localeCompare(b.name))
    stats.missingPhapTri.sort((a, b) => a.name.localeCompare(b.name))
    stats.missingTrieuChung.sort((a, b) => a.name.localeCompare(b.name))

    btImportResult.value = stats
    btShowImportResult.value = true
    // Reset full caches để lần sau truy cập có data mới sau import.
    baiThuocFullCache.value = new Map()
    await loadBaiThuocPage()
  } catch (err: any) {
    stats.errors.push(err?.message ?? String(err))
    btImportResult.value = stats
    btShowImportResult.value = true
  } finally {
    btIsImporting.value = false
  }
}

// ─── PHÂN TÍCH BÀI THUỐC (port từ thuoc-yhct-analysis.js) ─────────────────
const YHCT_KINH_ORDER = [
  'Tâm', 'Can', 'Tỳ', 'Phế', 'Thận', 'Tâm Bào',
  'Đại Trường', 'Tiểu Trường', 'Bàng Quang', 'Đởm', 'Vị', 'Tam Tiêu',
] as const

const YHCT_KINH_ALIAS: Record<string, string> = {
  'tam': 'Tâm', 'tâm': 'Tâm', 'can': 'Can', 'ty': 'Tỳ', 'tỳ': 'Tỳ',
  'phe': 'Phế', 'phế': 'Phế', 'than': 'Thận', 'thận': 'Thận',
  'tambao': 'Tâm Bào', 'tâm bào': 'Tâm Bào', 'tam bao': 'Tâm Bào',
  'daitrang': 'Đại Trường', 'đại trường': 'Đại Trường', 'dai truong': 'Đại Trường',
  'tieutruong': 'Tiểu Trường', 'tiểu trường': 'Tiểu Trường', 'tieu truong': 'Tiểu Trường',
  'bangquang': 'Bàng Quang', 'bàng quang': 'Bàng Quang', 'bang quang': 'Bàng Quang',
  'dam': 'Đởm', 'đởm': 'Đởm', 'vi': 'Vị', 'vị': 'Vị',
  'tamtieu': 'Tam Tiêu', 'tam tiêu': 'Tam Tiêu',
}

function normalizeKinh(raw: string): string {
  const s = (raw || '').trim()
  return YHCT_KINH_ALIAS[s.toLowerCase()] ?? s
}

// Tên tạng/phủ ngắn, ưu tiên khớp tên dài trước ("Tâm Bào" trước "Tâm") để tránh nhận nhầm.
const YHCT_KINH_BY_LEN = [...YHCT_KINH_ORDER].sort((a, b) => b.length - a.length)
// Rút gọn chuỗi quy kinh đầy đủ (vd "Thủ Thiếu Âm Tâm, Túc Thiếu Âm Thận") về tạng/phủ ("Tâm, Thận").
function shortKinh(raw: string | null | undefined): string {
  const out: string[] = []
  for (const part of String(raw || '').split(/[,;，、]/).map((s) => s.trim()).filter(Boolean)) {
    const norm = normalizeKinh(part)
    if ((YHCT_KINH_ORDER as readonly string[]).includes(norm)) out.push(norm)
    else out.push(YHCT_KINH_BY_LEN.find((ref) => norm.includes(ref)) ?? part)
  }
  return [...new Set(out)].join(', ')
}

interface AnalysisVtRow {
  id: number
  ten: string
  gram: number
  simGram: number
  pct: number
  vai_tro: 'Quân' | 'Thần' | 'Tá' | 'Sứ'
  vai_tro_nhap: string
  color: string
  tinh: string
  vi: string
  quy_kinh: string
  nguViVec: number[]
  tgptVec: number[]
}

interface AnalysisResult {
  empty: boolean
  idBaiThuoc: number
  ten: string
  W: number
  quyKinhNorm: Record<string, number>
  viThuocList: AnalysisVtRow[]
  tuKhi: { daiHan: number; han: number; luong: number; binh: number; on: number; nhiet: number; daiNhiet: number }
  nguVi: { chua: number; dang: number; ngot: number; cay: number; man: number }
  tgpt: { thang: number; phu: number; giang: number; tram: number }
  chungTrangBaiThuoc: string
  tacDungChips: string[]
  chuTriBaiThuoc: string[]
  kiengKyBaiThuoc: string[]
}

/** Map viThuocId → các nhóm dược lý mà vị thuốc thuộc về (mỗi nhóm có chu_tri của nhóm). */
const vtIdToGroups = computed(() => {
  const m = new Map<number, NhomNhoLite[]>()
  for (const nn of nhomNhoList.value) {
    for (const link of nn.viThuocLinks ?? []) {
      const id = link.idViThuoc ?? link.viThuoc?.id
      if (id == null) continue
      const arr = m.get(id) ?? []
      arr.push(nn)
      m.set(id, arr)
    }
  }
  return m
})

const ROLE_COLORS: Record<string, string> = {
  'Quân': '#DC2626', 'Thần': '#F97316', 'Tá': '#16A34A', 'Sứ': '#2563EB',
}

// Quy đổi đơn vị YHCT → gam:
//   1 tiền = 1 chỉ  = 3 g
//   1 lượng = 1 lạng = 30 g
//   "*" / "#" → liều ước lượng giữa khoảng (xem `gramPreviewText` cho dải hiển thị)
function parseLieuToGram(s: string | null | undefined): number {
  if (!s) return 9
  const t = s.toString().trim().toLowerCase().replace(',', '.')
  if (t === '*') return 2.25
  if (t === '#') return 22.5
  let m: RegExpMatchArray | null
  // "bán" / "nửa" = 1/2 vị (vd "bán tiền" = 0.5 tiền = 1.5g, "bán lượng" = 0.5 lượng = 15g).
  const qty = (raw: string) => (raw === 'bán' || raw === 'nửa' ? 0.5 : parseFloat(raw))
  m = t.match(/^(bán|nửa|[\d.]+)\s*(?:lượng|lạng)\b/); if (m && m[1]) return qty(m[1]) * 30
  m = t.match(/^(bán|nửa|[\d.]+)\s*(?:tiền|chỉ)\b/);   if (m && m[1]) return qty(m[1]) * 3
  m = t.match(/^([\d.]+)/);                     if (m && m[1]) return parseFloat(m[1])
  return 9
}

/** Chuỗi hiển thị tương đương gram cho ô liều lượng (giống logic reference). */
function gramPreviewText(lieu: string | null | undefined): string {
  if (lieu === '*') return '1.5g - 3g'
  if (lieu === '#') return '15g - 30g'
  if (!lieu) return '4.5g - 9g'
  const lower = lieu.toString().toLowerCase().trim()
  if (/^\d+(\.\d+)?g$/.test(lower)) return lower
  if (/^\d+([.,]\d+)?$/.test(lower)) {
    const val = parseFloat(lower.replace(',', '.'))
    return isNaN(val) ? lieu : `${val}g`
  }
  if (/(tiền|chỉ|lượng|lạng)/.test(lower)) {
    const qtyVal = (p: string) => (p === 'bán' || p === 'nửa' ? 0.5 : parseFloat(p.replace(',', '.')))
    return lower
      .replace(/(bán|nửa|[\d.,]+)\s*(lượng|lạng)/gi, (match, p1) => {
        const val = qtyVal(p1)
        return isNaN(val) ? match : `${Math.round(val * 30 * 100) / 100}g`
      })
      .replace(/(bán|nửa|[\d.,]+)\s*(tiền|chỉ)/gi, (match, p1) => {
        const val = qtyVal(p1)
        return isNaN(val) ? match : `${Math.round(val * 3 * 100) / 100}g`
      })
  }
  return lieu
}

function tinhChipClass(tinh: string): string {
  const t = (tinh || '').toLowerCase()
  if (t.includes('nhiệt')) return 'vt-tinh--nhiet'
  if (t.includes('hơi hàn') || t.includes('lương')) return 'vt-tinh--luong'
  if (t.includes('hàn')) return 'vt-tinh--han'
  if (t.includes('ôn') || t.includes('ấm')) return 'vt-tinh--on'
  return 'vt-tinh--binh'
}

const KINH_ABBREV: [string, string][] = [
  ['tâm bào', 'Tâm Bào'], ['tam tiêu', 'Tam Tiêu'], ['tiểu trường', 'Tiểu Trường'],
  ['đại trường', 'Đại Trường'], ['bàng quang', 'Bàng Quang'],
  ['phế', 'Phế'], ['vị', 'Vị'], ['tỳ', 'Tỳ'], ['tâm', 'Tâm'],
  ['thận', 'Thận'], ['đởm', 'Đởm'], ['can', 'Can'],
]
function abbrevKinhList(quyKinh: string): string[] {
  return quyKinh.split(/[,;，、]+/).map(k => {
    const kn = k.trim().toLowerCase()
    for (const [key, short] of KINH_ABBREV) {
      if (kn.endsWith(key)) return short
    }
    return k.trim()
  }).filter(Boolean)
}

/** Map 1 vị (thuần Việt hoặc Hán-Việt) sang 1 trong 5 bucket ngũ vị. Trả null nếu không khớp (vd. "Đạm"). */
function classifyVi(v: string): 'chua' | 'dang' | 'ngot' | 'cay' | 'man' | null {
  const s = v.trim().toLowerCase()
  if (!s) return null
  // Chua = Toan (酸)
  if (s.includes('chua') || s.includes('toan')) return 'chua'
  // Đắng = Khổ (苦)
  if (s.includes('đắng') || s.includes('dang') || s.includes('khổ') || s.includes('kho')) return 'dang'
  // Ngọt = Cam (甘)
  if (s.includes('ngọt') || s.includes('ngot') || s.includes('cam')) return 'ngot'
  // Cay = Tân (辛)
  if (s.includes('cay') || s.includes('tân') || s.includes('tan')) return 'cay'
  // Mặn = Hàm (鹹)
  if (s.includes('mặn') || s.includes('man') || s.includes('hàm') || s.includes('ham')) return 'man'
  // Đạm (淡 — nhạt) không nằm trong ngũ vị chuẩn → bỏ qua.
  return null
}

function nguViVecFromViString(viRaw: string): number[] {
  const parts = String(viRaw || '').split(/[,;，、]/).map(s => s.trim()).filter(Boolean)
  if (!parts.length) return [0, 0, 0, 0, 0]
  const uniq = [...new Set(parts.map(s => s.toLowerCase()))]
  const buckets: ('chua' | 'dang' | 'ngot' | 'cay' | 'man')[] = []
  for (const v of uniq) {
    const k = classifyVi(v)
    if (k) buckets.push(k)
  }
  if (!buckets.length) return [0, 0, 0, 0, 0]
  const each = 1 / buckets.length
  const o = { chua: 0, dang: 0, ngot: 0, cay: 0, man: 0 }
  for (const k of buckets) o[k] += each
  return [o.chua, o.dang, o.ngot, o.cay, o.man]
}

function tgptVecFromItem(item: { tinh: string; quy_kinh: string }): number[] {
  const tinh = (item.tinh || '').toLowerCase()
  const qk = (item.quy_kinh || '').toLowerCase()
  let th = 0, ph = 0, gi = 0, tr = 0
  if (tinh.includes('ôn') || tinh.includes('on') || tinh.includes('nóng') || tinh.includes('nong')) { th += 0.35; ph += 0.35 }
  if (tinh.includes('hàn') || tinh.includes('han') || tinh.includes('lương') || tinh.includes('luong')) { gi += 0.35; tr += 0.35 }
  if (qk.includes('phế') || qk.includes('phe') || qk.includes('tâm')) th += 0.15
  if (qk.includes('thận') || qk.includes('than') || qk.includes('bàng quang') || qk.includes('bang quang')) tr += 0.15
  const base = 0.15
  th += base; gi += base; ph += base; tr += base
  return [th, ph, gi, tr]
}

function addNguViBucket(bucket: { chua: number; dang: number; ngot: number; cay: number; man: number }, viRaw: string, wPct: number) {
  const parts = String(viRaw || '').split(/[,;，、]/).map(s => s.trim()).filter(Boolean)
  if (!parts.length) return
  const uniq = [...new Set(parts.map(s => s.toLowerCase()))]
  const keys: ('chua' | 'dang' | 'ngot' | 'cay' | 'man')[] = []
  for (const v of uniq) {
    const k = classifyVi(v)
    if (k) keys.push(k)
  }
  if (!keys.length) return
  const each = wPct / keys.length
  for (const k of keys) bucket[k] += each
}

function addTgptBucket(bucket: { thang: number; phu: number; giang: number; tram: number }, item: { tinh: string; quy_kinh: string }, wPct: number) {
  const tinh = (item.tinh || '').toLowerCase()
  const qk = (item.quy_kinh || '').toLowerCase()
  if (tinh.includes('ôn') || tinh.includes('on') || tinh.includes('nóng') || tinh.includes('nong')) { bucket.thang += wPct * 0.35; bucket.phu += wPct * 0.35 }
  if (tinh.includes('hàn') || tinh.includes('han') || tinh.includes('lương') || tinh.includes('luong')) { bucket.giang += wPct * 0.35; bucket.tram += wPct * 0.35 }
  if (qk.includes('phế') || qk.includes('phe') || qk.includes('tâm')) bucket.thang += wPct * 0.15
  if (qk.includes('thận') || qk.includes('than') || qk.includes('bàng quang') || qk.includes('bang quang')) bucket.tram += wPct * 0.15
  const base = wPct * 0.15
  bucket.thang += base; bucket.giang += base; bucket.phu += base; bucket.tram += base
}

function aggregateNguViFromSim(list: AnalysisVtRow[]) {
  const o = { chua: 0, dang: 0, ngot: 0, cay: 0, man: 0 }
  const W = list.reduce((s, v) => s + (v.simGram ?? v.gram), 0) || 1
  for (const v of list) addNguViBucket(o, v.vi, (v.simGram ?? v.gram) / W)
  return o
}

function aggregateTgptFromSim(list: AnalysisVtRow[]) {
  const o = { thang: 0, phu: 0, giang: 0, tram: 0 }
  const W = list.reduce((s, v) => s + (v.simGram ?? v.gram), 0) || 1
  for (const v of list) addTgptBucket(o, v, (v.simGram ?? v.gram) / W)
  return o
}

function nguViToRadar5(o: { chua: number; dang: number; ngot: number; cay: number; man: number }) {
  return [o.chua, o.dang, o.ngot, o.cay, o.man]
}

function tgptToRadar4(o: { thang: number; phu: number; giang: number; tram: number }) {
  return [o.thang, o.phu, o.giang, o.tram]
}

function mergeChungTrangFromBt(bt: BaiThuoc): string {
  const raw = (bt.chung_trang || '').trim()
  const linkTexts = [...(bt.phapTriLinks ?? [])]
    .sort((a, b) => (a.thuTu ?? 0) - (b.thuTu ?? 0))
    .map(l => (l.phapTri?.chung_trang || '').trim())
    .filter(Boolean)
  const linkStr = linkTexts.join(', ')
  if (!raw) return linkStr
  if (!linkStr) return raw
  return `${raw}, ${linkStr}`
}

/**
 * Chủ trị + Kiêng kỵ + Tác dụng cho bài thuốc.
 * - Chủ trị: lấy từ `nhom_nho_chu_tri` của các nhóm nhỏ mà các vị thuốc thuộc về (theo yêu cầu).
 * - Tác dụng: chip "Nhóm lớn - Nhóm nhỏ" cho mọi nhóm các vị thuốc thuộc về (loại trùng).
 * - Kiêng kỵ: giữ nguyên — từ `vi_thuoc_kieng_ky` trực tiếp trên vị thuốc.
 */
function deriveBaiThuocAggregates(items: { vt: ViThuocLite }[]) {
  const normKey = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
  const seenCt = new Set<string>()
  const seenKk = new Set<string>()
  const seenTd = new Set<string>()
  const ct: string[] = []
  const kk: string[] = []
  const td: string[] = []
  const groupsMap = vtIdToGroups.value

  for (const { vt } of items) {
    // Tác dụng + chủ trị từ nhóm dược lý
    const groups = groupsMap.get(vt.id) ?? []
    for (const g of groups) {
      const tenNho = (g.ten_nhom || '').trim()
      const tenLon = (g.nhomLon?.ten_nhom || '').trim()
      const label = tenLon && tenNho ? `${tenLon} - ${tenNho}` : (tenNho || tenLon)
      if (label) {
        const k = normKey(label)
        if (!seenTd.has(k)) { seenTd.add(k); td.push(label) }
      }
      for (const l of g.chuTriLinks ?? []) {
        const n = (l.chuTri?.ten_chu_tri || '').trim()
        if (!n) continue
        const k = normKey(n)
        if (seenCt.has(k)) continue
        seenCt.add(k)
        ct.push(n)
      }
    }
    // Kiêng kỵ vẫn từ vi_thuoc
    for (const l of vt.kiengKyLinks ?? []) {
      const n = (l.kiengKy?.ten_kieng_ky || '').trim()
      if (!n) continue
      const g = (l.ghi_chu || '').trim()
      const display = g ? `${n} (${g})` : n
      const k = normKey(display)
      if (seenKk.has(k)) continue
      seenKk.add(k)
      kk.push(display)
    }
  }
  ct.sort((a, b) => a.localeCompare(b, 'vi'))
  kk.sort((a, b) => a.localeCompare(b, 'vi'))
  td.sort((a, b) => a.localeCompare(b, 'vi'))
  return { chuTriBaiThuoc: ct, kiengKyBaiThuoc: kk, tacDungChips: td }
}

function analyzeBaiThuoc(bt: BaiThuoc): AnalysisResult {
  const details = bt.chiTietViThuoc ?? []
  const items = details
    .map(d => {
      const vt = d.viThuoc ?? viThuocById.value.get(d.id_vi_thuoc ?? -1) ?? null
      return vt ? { d, vt: vt as ViThuocLite, gram: parseLieuToGram(d.lieu_luong) } : null
    })
    .filter((x): x is { d: BaiThuocChiTietLite; vt: ViThuocLite; gram: number } => !!x && !!x.vt?.id)

  const empty = items.length === 0
  if (empty) {
    return {
      empty: true,
      idBaiThuoc: bt.id,
      ten: bt.ten_bai_thuoc,
      W: 0,
      quyKinhNorm: {},
      viThuocList: [],
      tuKhi: { daiHan: 0, han: 0, luong: 0, binh: 0, on: 0, nhiet: 0, daiNhiet: 0 },
      nguVi: { chua: 0, dang: 0, ngot: 0, cay: 0, man: 0 },
      tgpt: { thang: 0, phu: 0, giang: 0, tram: 0 },
      chungTrangBaiThuoc: '',
      tacDungChips: [],
      chuTriBaiThuoc: [],
      kiengKyBaiThuoc: [],
    }
  }

  const W = items.reduce((s, x) => s + x.gram, 0) || 1

  // Quy kinh - tích lũy theo gram
  const qkRaw: Record<string, number> = {}
  YHCT_KINH_ORDER.forEach(k => { qkRaw[k] = 0 })
  for (const { d, vt, gram } of items) {
    const qkStr = vt.quy_kinh || d.quy_kinh || ''
    qkStr.split(/[,;，、]/).map(k => k.trim()).filter(Boolean).forEach(k => {
      const norm = normalizeKinh(k)
      if (norm in qkRaw) qkRaw[norm] = (qkRaw[norm] ?? 0) + gram
      else {
        const found = YHCT_KINH_ORDER.find(ref => norm.includes(ref) || ref.includes(norm))
        if (found) qkRaw[found] = (qkRaw[found] ?? 0) + gram
      }
    })
  }
  const qkMax = Math.max(...Object.values(qkRaw), 0.01)
  const quyKinhNorm: Record<string, number> = {}
  YHCT_KINH_ORDER.forEach(k => { quyKinhNorm[k] = Math.round(((qkRaw[k] ?? 0) / qkMax) * 10) / 10 })

  // Vai trò Quân - Thần - Tá - Sứ
  const sorted = [...items].sort((a, b) => b.gram - a.gram)
  const quanQK = (sorted[0]?.vt?.quy_kinh || '').split(/[,;，、]/).map(k => normalizeKinh(k.trim()))
  const roleMap: Record<number, 'Quân' | 'Thần' | 'Tá' | 'Sứ'> = {}
  sorted.forEach((x, i) => {
    const ten = (x.vt.ten_vi_thuoc || '').toLowerCase()
    const pct = x.gram / W
    const vtQK = (x.vt.quy_kinh || '').split(/[,;，、]/).map(k => normalizeKinh(k.trim()))
    if (i === 0) roleMap[x.vt.id] = 'Quân'
    else if ((ten.includes('cam thảo') || ten.includes('đại táo')) && pct < 0.1) roleMap[x.vt.id] = 'Sứ'
    else if (pct >= 0.15 && vtQK.some(k => quanQK.includes(k))) roleMap[x.vt.id] = 'Thần'
    else roleMap[x.vt.id] = 'Tá'
  })

  const viThuocList: AnalysisVtRow[] = items.map(({ d, vt, gram }) => {
    const row: AnalysisVtRow = {
      id: vt.id,
      ten: vt.ten_vi_thuoc || '—',
      gram,
      simGram: gram,
      pct: Math.round((gram / W) * 100),
      vai_tro: roleMap[vt.id] ?? 'Tá',
      vai_tro_nhap: (d.vai_tro || '').trim(),
      color: ROLE_COLORS[roleMap[vt.id] ?? 'Tá'] ?? '#9CA3AF',
      tinh: vt.tinh || '',
      vi: vt.vi || '',
      quy_kinh: vt.quy_kinh || '',
      nguViVec: nguViVecFromViString(vt.vi || ''),
      tgptVec: [],
    }
    row.tgptVec = tgptVecFromItem(row)
    return row
  })

  const tuKhi = { daiHan: 0, han: 0, luong: 0, binh: 0, on: 0, nhiet: 0, daiNhiet: 0 }
  const nguVi = { chua: 0, dang: 0, ngot: 0, cay: 0, man: 0 }
  const tgpt = { thang: 0, phu: 0, giang: 0, tram: 0 }

  const addTuKhi = (tinhRaw: string, wPct: number) => {
    const t = (tinhRaw || '').trim().toLowerCase()
    if (!t) return
    if (t.includes('đại hàn') || t.includes('dai han')) { tuKhi.daiHan += wPct; return }
    if (t.includes('hơi hàn') || t.includes('hoi han')) { tuKhi.han += wPct * 0.7; tuKhi.luong += wPct * 0.3; return }
    if (t.includes('hàn') || t.includes('han')) { tuKhi.han += wPct; return }
    if (t.includes('lương') || t.includes('luong')) { tuKhi.luong += wPct; return }
    if (t.includes('bình') || t.includes('binh')) { tuKhi.binh += wPct; return }
    if (t.includes('đại nhiệt') || t.includes('dai nhiet')) { tuKhi.daiNhiet += wPct; return }
    if (t.includes('nhiệt') || t.includes('nhiet') || t.includes('nóng') || t.includes('nong')) { tuKhi.nhiet += wPct; return }
    if (t.includes('hơi ôn') || t.includes('hoi on')) { tuKhi.on += wPct * 0.7; tuKhi.binh += wPct * 0.3; return }
    if (t.includes('ôn') || t.includes('on')) { tuKhi.on += wPct; return }
    tuKhi.binh += wPct
  }

  for (const v of viThuocList) {
    const wPct = v.gram / W
    addTuKhi(v.tinh, wPct)
    addNguViBucket(nguVi, v.vi, wPct)
    addTgptBucket(tgpt, v, wPct)
  }

  const { chuTriBaiThuoc, kiengKyBaiThuoc, tacDungChips } = deriveBaiThuocAggregates(items)

  return {
    empty: false,
    idBaiThuoc: bt.id,
    ten: bt.ten_bai_thuoc,
    W,
    quyKinhNorm,
    viThuocList,
    tuKhi,
    nguVi,
    tgpt,
    chungTrangBaiThuoc: mergeChungTrangFromBt(bt),
    tacDungChips,
    chuTriBaiThuoc,
    kiengKyBaiThuoc,
  }
}

const TU_KHI_SEGS = [
  { key: 'daiHan' as const, vn: 'Đại Hàn', zh: '大寒', c: '#1565C0' },
  { key: 'han' as const, vn: 'Hàn', zh: '寒', c: '#29B6F6' },
  { key: 'luong' as const, vn: 'Lương', zh: '凉', c: '#26A69A' },
  { key: 'binh' as const, vn: 'Bình', zh: '平', c: '#E6E38A' },
  { key: 'on' as const, vn: 'Ôn', zh: '温', c: '#FFB74D' },
  { key: 'nhiet' as const, vn: 'Nhiệt', zh: '热', c: '#FF7043' },
  { key: 'daiNhiet' as const, vn: 'Đại Nhiệt', zh: '大热', c: '#C62828' },
]

const anaShowModal = ref(false)
const anaTab = ref<'phantich' | 'dothi'>('phantich')
const anaResult = ref<AnalysisResult | null>(null)

// Bổ sung tính ở backend (nguồn sự thật): luận giải tổng hợp + cấm kỵ phối ngũ (18 phản/19 úy).
interface AnalysisEnrich {
  luanGiai: string
  congNang: { ten: string; score: number }[]
  tuongPhan: { loai: 'phản' | 'úy'; tenA: string; tenB: string; ghiChu: string | null }[]
  nhanDinh: string[]
}
const anaEnrich = ref<AnalysisEnrich | null>(null)

// Reactive copy of viThuocList so input bindings & template re-render khi sửa gram
const anaVtRows = reactive<AnalysisVtRow[]>([])

const anaTotalSim = computed(() => {
  const s = anaVtRows.reduce((acc, v) => acc + (v.simGram ?? v.gram), 0)
  return s > 0 ? s : (anaResult.value?.W ?? 1)
})

const anaSortedVtRows = computed(() => {
  const order: Record<string, number> = { 'Quân': 0, 'Thần': 1, 'Tá': 2, 'Sứ': 3 }
  return [...anaVtRows].sort((a, b) => (order[a.vai_tro] ?? 3) - (order[b.vai_tro] ?? 3) || b.gram - a.gram)
})

const anaTuKhiVals = computed(() => {
  if (!anaResult.value) return TU_KHI_SEGS.map(() => 0)
  const tk = anaResult.value.tuKhi
  return TU_KHI_SEGS.map(s => Number(tk[s.key]) || 0)
})

const anaTuKhiTipIdx = computed(() => {
  let idx = 3 // mặc định 'Bình' nếu không có gì
  let maxV = -1
  anaTuKhiVals.value.forEach((v, i) => { if (v > maxV) { maxV = v; idx = i } })
  return maxV <= 0 ? 3 : idx
})

const anaSimDirty = computed(() => {
  return anaVtRows.some(v => Math.abs((v.simGram ?? v.gram) - v.gram) > 0.02)
})

// Chart instances
const radarNguViRef = ref<HTMLCanvasElement | null>(null)
const radarQuyKinhRef = ref<HTMLCanvasElement | null>(null)
const radarTgptRef = ref<HTMLCanvasElement | null>(null)
const chartNguVi = ref<Chart | null>(null)
const chartQuyKinh = ref<Chart | null>(null)
const chartTgpt = ref<Chart | null>(null)

function destroyAnaCharts() {
  for (const ref_ of [chartNguVi, chartQuyKinh, chartTgpt]) {
    const c = ref_.value
    if (c) {
      const cleanup = (c as Chart & { _yhctDragCleanup?: () => void })._yhctDragCleanup
      if (cleanup) try { cleanup() } catch { /* noop */ }
      try { c.destroy() } catch { /* noop */ }
    }
    ref_.value = null
  }
}

async function openAnalysis(bt: BaiThuoc) {
  anaLoading.value = true
  anaTab.value = 'phantich'
  anaResult.value = null
  anaVtRows.splice(0, anaVtRows.length)
  anaShowModal.value = true
  try {
    // Phân tích cần full chi tiết vị thuốc (với congDung/chuTri/kiengKy), full vị thuốc list (cho map id→data),
    // và nhóm dược lý (để derive tác dụng / chủ trị bài thuốc).
    await Promise.all([
      loadBaiThuocFull(bt.id),
      ensureFullViThuocList(),
      ensureNhomNhoList(),
    ])
    const full = baiThuocFullCache.value.get(bt.id) ?? bt
    const r = analyzeBaiThuoc(full)
    anaResult.value = r
    anaVtRows.splice(0, anaVtRows.length, ...r.viThuocList)
    nextTick(() => initAnaCharts())
    // Bổ sung từ backend (luận giải + cấm kỵ phối ngũ) — không chặn render radar; lỗi thì bỏ qua.
    api
      .post<any>(`/bai-thuoc/${bt.id}/analyze`, {})
      .then((res) => {
        anaEnrich.value = res?.success
          ? {
              luanGiai: res.luanGiai ?? '',
              congNang: res.congNang ?? [],
              tuongPhan: res.tuongPhan ?? [],
              nhanDinh: res.nhanDinh ?? [],
            }
          : null
      })
      .catch(() => { anaEnrich.value = null })
  } finally {
    anaLoading.value = false
  }
}

function closeAnalysis() {
  destroyAnaCharts()
  anaShowModal.value = false
  anaResult.value = null
  anaEnrich.value = null
  anaVtRows.splice(0, anaVtRows.length)
}

function onGramInput(id: number, raw: string) {
  const v = anaVtRows.find(x => x.id === id)
  if (!v) return
  const num = parseFloat(String(raw).replace(',', '.'))
  v.simGram = Number.isFinite(num) ? Math.max(0, num) : 0
  refreshOverlays()
}

function refreshOverlays() {
  const dirty = anaSimDirty.value
  const nguViAgg = aggregateNguViFromSim(anaVtRows)
  const tgptAgg = aggregateTgptFromSim(anaVtRows)
  if (chartNguVi.value && chartNguVi.value.data.datasets[1]) {
    chartNguVi.value.data.datasets[1].data = nguViToRadar5(nguViAgg)
    chartNguVi.value.data.datasets[1].hidden = !dirty
    chartNguVi.value.update('none')
  }
  if (chartTgpt.value && chartTgpt.value.data.datasets[1]) {
    chartTgpt.value.data.datasets[1].data = tgptToRadar4(tgptAgg)
    chartTgpt.value.data.datasets[1].hidden = !dirty
    chartTgpt.value.update('none')
  }
}

function radarValueFromPointer(chart: Chart, datasetIndex: number, index: number, pos: { x: number; y: number }) {
  const scale = chart.scales.r as unknown as {
    getCenterPoint(): { x: number; y: number }
    getValueForDistanceFromCenter?: (d: number) => number
    getDistanceFromCenterForValue: (v: number) => number
    min: number
    max: number
  }
  const meta = chart.getDatasetMeta(datasetIndex)
  const el = meta.data[index] as { x: number; y: number; skip?: boolean } | undefined
  if (!el || el.skip) return null
  const center = scale.getCenterPoint()
  const vx = el.x - center.x
  const vy = el.y - center.y
  const vlen = Math.hypot(vx, vy)
  if (vlen < 1e-6) return scale.min
  const ux = vx / vlen, uy = vy / vlen
  const relx = pos.x - center.x, rely = pos.y - center.y
  let distAlong = relx * ux + rely * uy
  distAlong = Math.max(0, distAlong)
  let val: number
  if (typeof scale.getValueForDistanceFromCenter === 'function') {
    val = scale.getValueForDistanceFromCenter(distAlong)
  } else {
    const d0 = scale.getDistanceFromCenterForValue(scale.min)
    const d1 = scale.getDistanceFromCenterForValue(scale.max)
    const t = Math.abs(d1 - d0) < 1e-9 ? 0 : (distAlong - d0) / (d1 - d0)
    val = scale.min + t * (scale.max - scale.min)
  }
  return Math.max(scale.min, Math.min(scale.max, val))
}

function redistributeGramsByRadarTarget(kind: 'nguVi' | 'tgpt', targetArr: number[]) {
  const list = anaVtRows
  const W = list.reduce((s, v) => s + (v.simGram ?? v.gram), 0) || 1
  const eps = 0.06
  const scores = list.map(v => {
    const vec = kind === 'nguVi' ? v.nguViVec : v.tgptVec
    let d = 0
    for (let j = 0; j < targetArr.length; j++) d += (vec[j] ?? 0) * (targetArr[j] ?? 0)
    const g = v.simGram ?? v.gram
    return d + eps * (g / W)
  })
  const sumS = scores.reduce((a, b) => a + b, 0)
  if (sumS < 1e-9) return
  list.forEach((v, i) => { v.simGram = W * (scores[i] ?? 0) / sumS })
}

function attachRadarDrag(chart: Chart, kind: 'nguVi' | 'tgpt') {
  const canvas = chart.canvas
  canvas.style.cursor = 'grab'
  canvas.style.touchAction = 'none'
  let dragIdx = -1
  let activePointerId: number | null = null

  const eventToPx = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / Math.max(rect.width, 1)
    const sy = canvas.height / Math.max(rect.height, 1)
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy }
  }

  const nearestPointIndex = (pos: { x: number; y: number }) => {
    const dsIdx = chart.data.datasets[1]?.hidden ? 0 : 1
    const meta = chart.getDatasetMeta(dsIdx)
    const scale = chart.scales.r as unknown as { getCenterPoint(): { x: number; y: number } }
    const center = scale.getCenterPoint()
    const dx = pos.x - center.x
    const dy = pos.y - center.y
    const dist = Math.hypot(dx, dy)
    if (dist < 12) return -1
    let maxR = 0
    for (const pt of meta.data as Array<{ x: number; y: number; skip?: boolean }>) {
      if (!pt || pt.skip) continue
      maxR = Math.max(maxR, Math.hypot(pt.x - center.x, pt.y - center.y))
    }
    if (maxR > 0 && dist > maxR + 72) return -1
    const clickAng = Math.atan2(dy, dx)
    let bestIdx = -1
    let bestDiff = Infinity
    ;(meta.data as Array<{ x: number; y: number; skip?: boolean }>).forEach((pt, i) => {
      if (!pt || pt.skip) return
      const a = Math.atan2(pt.y - center.y, pt.x - center.x)
      let diff = Math.abs(clickAng - a)
      if (diff > Math.PI) diff = 2 * Math.PI - diff
      if (diff < bestDiff) { bestDiff = diff; bestIdx = i }
    })
    return bestIdx
  }

  const applyDrag = (idx: number, pos: { x: number; y: number }) => {
    const dsIdx = chart.data.datasets[1]?.hidden ? 0 : 1
    // Tách 2 nhánh để TS narrow chính xác từng kiểu agg
    const target: number[] = kind === 'nguVi'
      ? nguViToRadar5(aggregateNguViFromSim(anaVtRows)).slice()
      : tgptToRadar4(aggregateTgptFromSim(anaVtRows)).slice()
    const val = radarValueFromPointer(chart, dsIdx, idx, pos)
    if (val == null) return
    target[idx] = val
    redistributeGramsByRadarTarget(kind, target)
    refreshOverlays()
  }

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    const pos = eventToPx(e)
    const idx = nearestPointIndex(pos)
    if (idx < 0) return
    dragIdx = idx
    activePointerId = e.pointerId
    try { canvas.setPointerCapture(e.pointerId) } catch { /* noop */ }
    applyDrag(idx, pos)
  }
  const onMove = (e: PointerEvent) => {
    if (dragIdx < 0) return
    if (activePointerId != null && e.pointerId !== activePointerId) return
    if (e.cancelable) e.preventDefault()
    applyDrag(dragIdx, eventToPx(e))
  }
  const onUp = (e: PointerEvent) => {
    if (activePointerId != null && e.pointerId === activePointerId) {
      try { canvas.releasePointerCapture(e.pointerId) } catch { /* noop */ }
    }
    dragIdx = -1
    activePointerId = null
  }

  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointercancel', onUp)
  canvas.addEventListener('lostpointercapture', onUp)
  ;(chart as Chart & { _yhctDragCleanup?: () => void })._yhctDragCleanup = () => {
    canvas.removeEventListener('pointerdown', onDown)
    canvas.removeEventListener('pointermove', onMove)
    canvas.removeEventListener('pointerup', onUp)
    canvas.removeEventListener('pointercancel', onUp)
    canvas.removeEventListener('lostpointercapture', onUp)
  }
}

function initAnaCharts() {
  destroyAnaCharts()
  const r = anaResult.value
  if (!r || r.empty) return

  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        beginAtZero: true,
        suggestedMax: 1,
        ticks: { stepSize: 0.2, backdropColor: 'transparent' },
        grid: { color: '#E8E2D6' },
        pointLabels: { color: '#6B7280', font: { size: 10 } },
        angleLines: { color: '#ECE7DC' },
      },
    },
  } as const

  const mkInteractive = (canvas: HTMLCanvasElement | null, labels: string[], baseArr: number[], color: string, kind: 'nguVi' | 'tgpt') => {
    if (!canvas) return null
    const baseData = baseArr.map(x => Number(x) || 0)
    const chart = new Chart(canvas.getContext('2d')!, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: 'calc',
            data: baseData,
            borderColor: color,
            backgroundColor: color.replace('1)', '0.12)'),
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 4,
            pointHitRadius: 24,
          },
          {
            label: 'sim',
            data: baseData.slice(),
            borderColor: color.replace('1)', '0.85)'),
            backgroundColor: color.replace('1)', '0.06)'),
            borderWidth: 2.5,
            borderDash: [5, 4],
            pointRadius: 2,
            pointHoverRadius: 4,
            pointHitRadius: 24,
            hidden: true,
          },
        ],
      },
      options: { ...baseOpts, plugins: { legend: { display: false }, tooltip: { enabled: true } } },
    })
    attachRadarDrag(chart, kind)
    return chart
  }

  chartNguVi.value = mkInteractive(
    radarNguViRef.value,
    ['Chua', 'Đắng', 'Ngọt', 'Cay', 'Mặn'],
    [r.nguVi.chua, r.nguVi.dang, r.nguVi.ngot, r.nguVi.cay, r.nguVi.man],
    'rgba(239, 68, 68, 1)',
    'nguVi',
  )

  if (radarQuyKinhRef.value) {
    chartQuyKinh.value = new Chart(radarQuyKinhRef.value.getContext('2d')!, {
      type: 'radar',
      data: {
        labels: [...YHCT_KINH_ORDER],
        datasets: [{
          data: YHCT_KINH_ORDER.map(k => r.quyKinhNorm[k] || 0),
          borderColor: 'rgba(234, 179, 8, 1)',
          backgroundColor: 'rgba(234, 179, 8, 0.12)',
          borderWidth: 2,
          pointRadius: 2,
        }],
      },
      options: baseOpts,
    })
  }

  chartTgpt.value = mkInteractive(
    radarTgptRef.value,
    ['Thăng', 'Phù', 'Giáng', 'Trầm'],
    [r.tgpt.thang, r.tgpt.phu, r.tgpt.giang, r.tgpt.tram],
    'rgba(59, 130, 246, 1)',
    'tgpt',
  )
}

function resetSimGrams() {
  for (const v of anaVtRows) v.simGram = v.gram
  refreshOverlays()
}

/** Map vai trò người dùng nhập (có thể viết hoa/thường, có dấu/không dấu) về 1 trong 4 chuẩn để lấy màu. */
function normalizeVaiTroNhap(raw: string): 'Quân' | 'Thần' | 'Tá' | 'Sứ' | '' {
  const t = (raw || '').trim().toLowerCase()
  if (!t) return ''
  if (t.includes('quân') || t.includes('quan')) return 'Quân'
  if (t.includes('thần') || t.includes('than')) return 'Thần'
  if (t.includes('sứ') || t === 'su') return 'Sứ'
  if (t.includes('tá') || t === 'ta') return 'Tá'
  return ''
}

function vaiTroNhapColor(raw: string): string {
  const k = normalizeVaiTroNhap(raw)
  return k ? (ROLE_COLORS[k] ?? '#9CA3AF') : '#9CA3AF'
}

function vaiTroMatchSuyLuan(row: AnalysisVtRow): boolean {
  const k = normalizeVaiTroNhap(row.vai_tro_nhap)
  return k !== '' && k === row.vai_tro
}

// ─── VỊ THUỐC CRUD ────────────────────────────────────────────────────────
const vtShowModal = ref(false)
const vtEditingId = ref<number | null>(null)
const vtSubmitting = ref(false)
const vtFormError = ref<string | null>(null)

const emptyViThuocForm = (): ViThuocForm => ({
  ten_vi_thuoc: '',
  tinh: '',
  vi: '',
  quy_kinh: '',
  lieu_dung: '',
  ten_khoa_hoc: '',
  ten_han: '',
  ten_pinyin: '',
  bo_phan_dung: '',
  kinh_mach_ids: [],
  nhom_nho_ids: [],
})

const vtAiUnmatched = ref<string[]>([])
const vtKinhMachFilter = ref('')
/** Lý do AI giải thích cho gợi ý nhóm nhỏ dược lý. */
const vtAiNhomLyDo = ref('')
/** ID nhóm nhỏ do AI vừa gợi ý (highlight chip "AI"). null = chưa gợi ý lần nào. */
const vtAiSuggestedNhomNhoId = ref<number | null>(null)

function nhomNhoIdsForViThuoc(viThuocId: number): number[] {
  const ids: number[] = []
  for (const nn of nhomNhoList.value) {
    if ((nn.viThuocLinks ?? []).some((l) => l.idViThuoc === viThuocId)) {
      ids.push(nn.id)
    }
  }
  return ids
}

function nhomNhoFullLabel(id: number): string {
  const nn = nhomNhoList.value.find((x) => x.id === id)
  if (!nn) return `#${id}`
  const parent = nn.nhomLon?.ten_nhom ?? ''
  return parent ? `${parent} › ${nn.ten_nhom}` : nn.ten_nhom
}

function removeVtNhomNho(id: number) {
  vtForm.value.nhom_nho_ids = vtForm.value.nhom_nho_ids.filter((x) => x !== id)
  if (vtAiSuggestedNhomNhoId.value === id) {
    vtAiSuggestedNhomNhoId.value = null
    vtAiNhomLyDo.value = ''
  }
}

function kinhMachName(id: number): string {
  const km = kinhMachList.value.find((x) => x.idKinhMach === id)
  return km?.ten_kinh_mach || `#${id}`
}

const vtFilteredKinhMach = computed(() => {
  const q = vtKinhMachFilter.value.trim().toLowerCase()
  const selected = new Set(vtForm.value.kinh_mach_ids)
  return kinhMachList.value
    .filter((k) => !selected.has(k.idKinhMach))
    .filter((k) => {
      if (!q) return true
      const hay = [k.ten_kinh_mach, k.ten_viet_tat].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    })
    .slice(0, 20)
})

function addKinhMachId(id: number) {
  if (!vtForm.value.kinh_mach_ids.includes(id)) {
    vtForm.value.kinh_mach_ids.push(id)
  }
  vtKinhMachFilter.value = ''
}

function removeKinhMachId(id: number) {
  vtForm.value.kinh_mach_ids = vtForm.value.kinh_mach_ids.filter((x) => x !== id)
}

const vtForm = ref<ViThuocForm>(emptyViThuocForm())

const vtShowDelete = ref(false)
const vtDeleting = ref<ViThuoc | null>(null)

function openCreateViThuoc() {
  vtEditingId.value = null
  vtForm.value = emptyViThuocForm()
  vtFormError.value = null
  vtAiUnmatched.value = []
  vtAiNhomLyDo.value = ''
  vtAiSuggestedNhomNhoId.value = null
  vtKinhMachFilter.value = ''
  vtShowModal.value = true
}

function openEditViThuoc(vt: ViThuoc) {
  vtEditingId.value = vt.id
  const kmIds = (vt.kinhMachLinks ?? [])
    .map((l) => l.id_kinh_mach ?? l.kinhMach?.idKinhMach)
    .filter((x): x is number => typeof x === 'number')
  vtForm.value = {
    ten_vi_thuoc: vt.ten_vi_thuoc ?? '',
    tinh: vt.tinh ?? '',
    vi: vt.vi ?? '',
    quy_kinh: vt.quy_kinh ?? '',
    lieu_dung: vt.lieu_dung ?? '',
    ten_khoa_hoc: vt.ten_khoa_hoc ?? '',
    ten_han: vt.ten_han ?? '',
    ten_pinyin: vt.ten_pinyin ?? '',
    bo_phan_dung: vt.bo_phan_dung ?? '',
    kinh_mach_ids: kmIds,
    nhom_nho_ids: nhomNhoIdsForViThuoc(vt.id),
  }
  vtFormError.value = null
  vtAiUnmatched.value = []
  vtAiNhomLyDo.value = ''
  vtAiSuggestedNhomNhoId.value = null
  vtKinhMachFilter.value = ''
  vtShowModal.value = true
}

function closeViThuocModal() {
  vtShowModal.value = false
  vtEditingId.value = null
}

async function submitViThuoc() {
  if (vtSubmitting.value) return
  vtFormError.value = null
  const f = vtForm.value
  const isEdit = vtEditingId.value != null
  if (!isEdit && !f.ten_vi_thuoc.trim()) {
    vtFormError.value = 'Tên vị thuốc không được để trống'
    return
  }
  vtSubmitting.value = true
  try {
    if (isEdit) {
      // Edit: chỉ gửi tinh / vi / quy kinh (qua kinh_mach_ids) / liều dùng / nhóm dược lý — không đổi tên
      const payload: Record<string, unknown> = {
        tinh: f.tinh.trim() || undefined,
        vi: f.vi.trim() || undefined,
        lieu_dung: f.lieu_dung.trim() || undefined,
        ten_khoa_hoc: f.ten_khoa_hoc.trim() || undefined,
        ten_han: f.ten_han.trim() || undefined,
        ten_pinyin: f.ten_pinyin.trim() || undefined,
        bo_phan_dung: f.bo_phan_dung.trim() || undefined,
        kinh_mach_ids: f.kinh_mach_ids,
        nhom_nho_ids: f.nhom_nho_ids,
      }
      await api.put(`/vi-thuoc/${vtEditingId.value}`, payload)
    } else {
      const payload: Record<string, unknown> = {
        ten_vi_thuoc: f.ten_vi_thuoc.trim(),
        tinh: f.tinh.trim() || undefined,
        vi: f.vi.trim() || undefined,
        lieu_dung: f.lieu_dung.trim() || undefined,
        ten_khoa_hoc: f.ten_khoa_hoc.trim() || undefined,
        ten_han: f.ten_han.trim() || undefined,
        ten_pinyin: f.ten_pinyin.trim() || undefined,
        bo_phan_dung: f.bo_phan_dung.trim() || undefined,
        kinh_mach_ids: f.kinh_mach_ids,
        nhom_nho_ids: f.nhom_nho_ids,
      }
      await api.post('/vi-thuoc', payload)
    }
    // Invalidate full caches để lần sau Sửa bài thuốc / Phân tích có data mới.
    viThuocFullLoaded.value = false
    viThuocFullList.value = []
    await loadViThuocPage()
    closeViThuocModal()
  } catch (err: any) {
    vtFormError.value = err.message || 'Không lưu được vị thuốc'
  } finally {
    vtSubmitting.value = false
  }
}

function confirmDeleteViThuoc(vt: ViThuoc) {
  vtDeleting.value = vt
  vtShowDelete.value = true
}

async function deleteViThuoc() {
  if (!vtDeleting.value || vtSubmitting.value) return
  vtSubmitting.value = true
  try {
    await api.delete(`/vi-thuoc/${vtDeleting.value.id}`)
    vtShowDelete.value = false
    vtDeleting.value = null
    viThuocFullLoaded.value = false
    viThuocFullList.value = []
    await loadViThuocPage()
    if (pagedViThuoc.value.length === 0 && viThuocPage.value > 1) viThuocPage.value--
  } catch (err: any) {
    error.value = err.message || 'Không xóa được vị thuốc'
    vtShowDelete.value = false
  } finally {
    vtSubmitting.value = false
  }
}

// ─── Gợi ý AI cho vị thuốc (yescale → deepseek-v3.2) ───────────────────────
const vtAiLoading = ref(false)

async function suggestViThuocAi() {
  if (vtAiLoading.value || vtSubmitting.value) return
  const ten = vtForm.value.ten_vi_thuoc.trim()
  if (!ten) {
    vtFormError.value = 'Nhập tên vị thuốc trước khi gợi ý AI'
    return
  }
  vtAiLoading.value = true
  vtFormError.value = null
  vtAiUnmatched.value = []
  vtAiNhomLyDo.value = ''
  vtAiSuggestedNhomNhoId.value = null
  try {
    const candidates = nhomNhoList.value
      .filter((nn) => nn.nhomLon)
      .map((nn) => ({
        id: nn.id,
        ten_nhom: nn.ten_nhom,
        mo_ta: null,
        lieu_luong: null,
      }))
    const fakeId = vtEditingId.value ?? 1
    const [generalRes, classifyRes] = await Promise.all([
      api.post<{
        success: boolean
        data: {
          tinh: string
          vi: string
          quy_kinh: string
          kinh_mach_ids: number[]
          kinh_mach_unmatched: string[]
        }
      }>('/ai-suggest/vi-thuoc', { ten_vi_thuoc: ten }),
      candidates.length
        ? api
            .post<{
              success: boolean
              data: Array<{
                id: number
                ten_vi_thuoc: string
                id_nhom_nho: number | null
                ly_do?: string
              }>
            }>('/ai-suggest/classify-vi-thuoc', {
              vi_thuoc: [{ id: fakeId, ten_vi_thuoc: ten }],
              nhom_nho_candidates: candidates,
            })
            .catch((err) => {
              console.warn('Classify nhóm AI lỗi:', err?.message ?? err)
              return null
            })
        : Promise.resolve(null),
    ])

    const d = generalRes?.data
    if (!d) throw new Error('AI không trả về dữ liệu')
    if (d.tinh) vtForm.value.tinh = d.tinh
    if (d.vi) vtForm.value.vi = d.vi
    if (d.quy_kinh) vtForm.value.quy_kinh = d.quy_kinh
    if (Array.isArray(d.kinh_mach_ids) && d.kinh_mach_ids.length) {
      const merged = new Set<number>(vtForm.value.kinh_mach_ids)
      for (const id of d.kinh_mach_ids) merged.add(id)
      vtForm.value.kinh_mach_ids = Array.from(merged)
    }
    vtAiUnmatched.value = Array.isArray(d.kinh_mach_unmatched) ? d.kinh_mach_unmatched : []

    const classified = classifyRes?.data?.[0]
    if (classified && classified.id_nhom_nho != null) {
      const id = classified.id_nhom_nho
      if (!vtForm.value.nhom_nho_ids.includes(id)) {
        vtForm.value.nhom_nho_ids = [...vtForm.value.nhom_nho_ids, id]
      }
      vtAiSuggestedNhomNhoId.value = id
      vtAiNhomLyDo.value = classified.ly_do ?? ''
    }
  } catch (err: any) {
    vtFormError.value = 'Gợi ý AI thất bại: ' + (err?.message ?? err)
  } finally {
    vtAiLoading.value = false
  }
}
</script>

<template>
  <div class="management-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Quản Lý Thuốc</h1>
        <p class="page-subtitle">Quản lý bài thuốc, vị thuốc và phân loại dược lý Đông Y</p>
      </div>
      <div class="view-toggle">
        <button
          class="toggle-btn"
          :class="{ active: activeTab === 'bai-thuoc' }"
          @click="activeTab = 'bai-thuoc'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          Bài Thuốc
        </button>
        <button
          class="toggle-btn"
          :class="{ active: activeTab === 'vi-thuoc' }"
          @click="activeTab = 'vi-thuoc'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          Vị Thuốc
        </button>
        <button
          class="toggle-btn"
          :class="{ active: activeTab === 'duoc-ly' }"
          @click="activeTab = 'duoc-ly'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2L2 7l10 5 10-5-10-5z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2 17l10 5 10-5"/><path stroke-linecap="round" stroke-linejoin="round" d="M2 12l10 5 10-5"/></svg>
          Dược Lý
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'duoc-ly'" class="content-body">
      <PharmacologyManager />
    </div>

    <div v-else-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải dữ liệu...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary mt-4" @click="fetchData">Thử lại</button>
    </div>

    <div v-else class="content-body">
      <!-- TAB BÀI THUỐC -->
      <div v-if="activeTab === 'bai-thuoc'" class="tab-content">
        <div class="toolbar">
          <div class="search-wrap">
            <input
              v-model="baiThuocSearch"
              type="search"
              class="search-input"
              placeholder="Tìm theo tên, nguồn gốc, thể bệnh, pháp trị, triệu chứng, vị thuốc..."
            />
            <button v-if="baiThuocSearch" type="button" class="search-clear" @click="baiThuocSearch = ''" aria-label="Xóa tìm kiếm">✕</button>
          </div>
          <span class="toolbar-count">{{ filteredBaiThuoc.length }} / {{ baiThuocTotal }} bài thuốc</span>
        </div>
        <div class="sub-tabs" role="tablist" aria-label="Phân loại bài thuốc">
          <button
            type="button"
            role="tab"
            class="sub-tab"
            :class="{ active: baiThuocCategory === 'dong-y' }"
            :aria-selected="baiThuocCategory === 'dong-y'"
            @click="baiThuocCategory = 'dong-y'"
          >
            Đông Y
            <span class="sub-tab__count">{{ baiThuocCategoryCounts['dong-y'] }}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="sub-tab"
            :class="{ active: baiThuocCategory === 'tay-y' }"
            :aria-selected="baiThuocCategory === 'tay-y'"
            @click="baiThuocCategory = 'tay-y'"
          >
            Tây Y
            <span class="sub-tab__count">{{ baiThuocCategoryCounts['tay-y'] }}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="sub-tab"
            :class="{ active: baiThuocCategory === 'all' }"
            :aria-selected="baiThuocCategory === 'all'"
            @click="baiThuocCategory = 'all'"
          >
            Tất Cả
            <span class="sub-tab__count">{{ baiThuocCategoryCounts['all'] }}</span>
          </button>
        </div>
        <div
          v-if="baiThuocCategory === 'tay-y' && chungBenhTayYOptions.length"
          class="sub-sub-tabs"
          role="tablist"
          aria-label="Chủng bệnh Tây Y"
        >
          <button
            type="button"
            role="tab"
            class="sub-sub-tab"
            :class="{ active: selectedChungBenhId === null }"
            :aria-selected="selectedChungBenhId === null"
            @click="selectedChungBenhId = null"
          >
            Tất Cả
            <span class="sub-sub-tab__count">{{ baiThuocCategoryCounts['tay-y'] }}</span>
          </button>
          <button
            v-for="cb in chungBenhTayYOptions"
            :key="cb.id"
            type="button"
            role="tab"
            class="sub-sub-tab"
            :class="{ active: selectedChungBenhId === cb.id }"
            :aria-selected="selectedChungBenhId === cb.id"
            @click="selectedChungBenhId = cb.id"
          >
            {{ cb.name }}
            <span class="sub-sub-tab__count">{{ cb.count }}</span>
          </button>
        </div>
        <div
          v-if="baiThuocCategory !== 'all' && (tangPhuStats.length || tonThuongStats.length)"
          class="extra-filters"
        >
          <div v-if="tangPhuStats.length" class="filter-row">
            <span class="filter-row__label">Tạng phủ</span>
            <div class="sub-sub-tabs sub-sub-tabs--inline" role="group" aria-label="Lọc theo tạng phủ">
              <button
                v-for="opt in tangPhuStats"
                :key="'tp-' + opt.id"
                type="button"
                class="sub-sub-tab"
                :class="{ active: selectedTangPhuIds.includes(opt.id) }"
                :aria-pressed="selectedTangPhuIds.includes(opt.id)"
                @click="toggleTangPhu(opt.id)"
              >
                {{ opt.name }}
                <span class="sub-sub-tab__count">{{ opt.count }}</span>
              </button>
            </div>
          </div>
          <div v-if="tonThuongStats.length" class="filter-row">
            <span class="filter-row__label">Tổn thương</span>
            <div
              class="sub-sub-tabs sub-sub-tabs--inline sub-sub-tabs--alt"
              role="group"
              aria-label="Lọc theo tổn thương - tác nhân"
            >
              <button
                v-for="opt in tonThuongStats"
                :key="'tt-' + opt.id"
                type="button"
                class="sub-sub-tab"
                :class="{ active: selectedTonThuongList.includes(opt.name) }"
                :aria-pressed="selectedTonThuongList.includes(opt.name)"
                @click="toggleTonThuong(opt.name)"
              >
                {{ opt.name }}
                <span class="sub-sub-tab__count">{{ opt.count }}</span>
              </button>
            </div>
            <button
              v-if="selectedTangPhuIds.length || selectedTonThuongList.length"
              type="button"
              class="filter-clear-btn"
              @click="clearExtraFilters"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
        <div class="data-card" :class="{ 'data-card--loading': baiThuocPageLoading }">
          <div v-if="baiThuocPageLoading" class="loading-bar" aria-hidden="true"></div>
          <div class="card-header">
            <div class="card-header-left">
              <h3>Danh Sách Bài Thuốc</h3>
              <span class="badge badge-info">{{ filteredBaiThuoc.length }} bài thuốc</span>
            </div>
            <div class="header-actions">
              <button type="button" class="btn-secondary" :disabled="btIsExporting || !baiThuocList.length" @click="btExportToExcel">
                {{ btIsExporting ? 'Đang xuất…' : '↓ Xuất Excel' }}
              </button>
              <button type="button" class="btn-secondary" :disabled="btIsImporting" @click="btTriggerImport">
                ↑ Nhập Excel
              </button>
              <input
                ref="btImportFileInput"
                type="file"
                accept=".xlsx,.xls"
                hidden
                @change="btHandleImportFile"
              />
              <button type="button" class="btn-primary" @click="openCreateBaiThuoc">+ Thêm bài thuốc</button>
            </div>
          </div>
          <div v-if="pagedBaiThuoc.length === 0" class="empty-state">
            Chưa có dữ liệu bài thuốc
          </div>

          <div v-else class="bt-grid">
            <article
              v-for="bt in pagedBaiThuoc"
              :key="bt.id"
              :data-bt-id="bt.id"
              class="bt-card"
              :class="{ 'bt-card--highlight': bt.id === highlightBtId }"
            >
              <header class="bt-card__head">
                <div class="bt-card__title">
                  <span class="bt-card__id">#{{ bt.id }}</span>
                  <div class="bt-card__name-wrap">
                    <h4 class="bt-card__name">{{ bt.ten_bai_thuoc }}</h4>
                    <small v-if="bt.nguon_goc" class="bt-card__source">{{ bt.nguon_goc }}</small>
                  </div>
                </div>
                <div class="row-actions">
                  <button type="button" class="btn-action btn-analyze" @click="openAnalysis(bt)">Phân tích</button>
                  <button type="button" class="btn-action btn-edit" @click="openEditBaiThuoc(bt)">Sửa</button>
                  <button type="button" class="btn-action btn-delete" @click="confirmDeleteBaiThuoc(bt)">Xóa</button>
                </div>
              </header>

              <div class="bt-card__body">
                <div
                  v-if="theBenhLabels(bt).length || benhTayYLabelsForBaiThuoc(bt.id).length"
                  class="bt-section-row"
                >
                  <section v-if="theBenhItems(bt).length" class="bt-section bt-section--col">
                    <span class="bt-section__label">Bệnh Đông Y</span>
                    <div class="chip-row chip-row--wrap">
                      <template v-for="(t, i) in theBenhItems(bt)" :key="i">
                        <a
                          v-if="t.id != null"
                          :href="phapTriHref(t.id)"
                          target="_blank"
                          rel="noopener"
                          class="chip chip-the chip-link-the"
                          :title="`Mở pháp trị: ${t.name}`"
                        >{{ t.name }}</a>
                        <span v-else class="chip chip-the">{{ t.name }}</span>
                      </template>
                    </div>
                  </section>

                  <section v-if="benhTayYLabelsForBaiThuoc(bt.id).length" class="bt-section bt-section--col">
                    <span class="bt-section__label">Bệnh Tây Y</span>
                    <div class="bty-groups">
                      <div
                        v-for="g in benhTayYGroupsForBaiThuoc(bt.id)"
                        :key="g.key"
                        class="bty-group"
                      >
                        <span class="bty-group__label">{{ g.chungBenhName }}</span>
                        <div class="chip-row chip-row--wrap">
                          <a
                            v-for="bty in g.items"
                            :key="bty.id"
                            :href="benhTayYHref(bty.id)"
                            target="_blank"
                            rel="noopener"
                            class="chip chip-tayy chip-link-tayy"
                            :title="`Mở bệnh Tây Y: ${bty.ten_benh}`"
                          >
                            {{ bty.ten_benh }}
                          </a>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <section v-if="phapTriItems(bt).length" class="bt-section">
                  <span class="bt-section__label">Pháp trị</span>
                  <div class="phap-tri-list">
                    <div v-for="(p, i) in phapTriItems(bt)" :key="i" class="phap-tri-item">
                      <a
                        v-if="p.id != null"
                        :href="phapTriHref(p.id)"
                        target="_blank"
                        rel="noopener"
                        class="chip chip-phap chip-link-phap"
                        :title="`Mở pháp trị: ${p.name}`"
                      >{{ p.name }}</a>
                      <span v-else class="chip chip-phap">{{ p.name }}</span>
                      <div v-if="p.trieuChung.length" class="chip-row chip-row--wrap phap-tri-trieu">
                        <span
                          v-for="(t, j) in p.trieuChung"
                          :key="j"
                          class="chip chip-trieu"
                        >{{ t }}</span>
                      </div>
                    </div>
                  </div>
                </section>

                <section v-if="trieuChungLabels(bt).length" class="bt-section">
                  <span class="bt-section__label">Triệu chứng</span>
                  <div class="chip-row chip-row--wrap">
                    <span v-for="(t, i) in trieuChungLabels(bt)" :key="i" class="chip chip-trieu">{{ t }}</span>
                  </div>
                </section>

                <section v-if="bt.cach_dung" class="bt-section">
                  <span class="bt-section__label">Cách dùng</span>
                  <p
                    class="bt-section__text"
                    :class="{
                      'bt-text-clamp':
                        isLongCachDung(bt.cach_dung) && !expandedCachDung.has(bt.id),
                    }"
                  >
                    {{ bt.cach_dung }}
                  </p>
                  <button
                    v-if="isLongCachDung(bt.cach_dung)"
                    type="button"
                    class="bt-more-toggle"
                    @click="toggleCachDungExpand(bt.id)"
                  >{{ expandedCachDung.has(bt.id) ? 'Thu gọn' : 'Xem thêm' }}</button>
                </section>

                <section v-if="thanhPhanItems(bt).length" class="bt-section bt-section--thanh-phan">
                  <span class="bt-section__label">Thành phần ({{ thanhPhanItems(bt).length }})</span>
                  <ul class="thanh-phan-list">
                    <li v-for="(it, i) in visibleThanhPhanItems(bt)" :key="i">
                      <span class="vt-name">{{ it.ten }}</span>
                      <span v-if="it.lieu" class="vt-lieu">{{ it.lieu }}</span>
                    </li>
                  </ul>
                  <button
                    v-if="thanhPhanItems(bt).length > THANH_PHAN_PREVIEW_LIMIT"
                    type="button"
                    class="bt-more-toggle"
                    @click="toggleThanhPhanExpand(bt.id)"
                  >
                    {{
                      expandedThanhPhan.has(bt.id)
                        ? 'Thu gọn'
                        : `Xem thêm ${thanhPhanItems(bt).length - THANH_PHAN_PREVIEW_LIMIT} vị nữa`
                    }}
                  </button>
                </section>

                <p
                  v-if="
                    !theBenhLabels(bt).length &&
                    !phapTriLabels(bt).length &&
                    !trieuChungLabels(bt).length &&
                    !bt.cach_dung &&
                    !thanhPhanItems(bt).length &&
                    !benhTayYLabelsForBaiThuoc(bt.id).length
                  "
                  class="bt-empty muted"
                >
                  Chưa gắn dữ liệu liên quan.
                </p>
              </div>
            </article>
          </div>
          <div v-if="totalBTPage > 1" class="pagination">
            <button class="page-btn" :disabled="baiThuocPage <= 1" @click="baiThuocPage--">‹</button>
            <button v-for="pn in getPageNumbers(baiThuocPage, totalBTPage)" :key="pn" class="page-btn" :class="{ active: pn === baiThuocPage }" @click="baiThuocPage = pn">{{ pn }}</button>
            <button class="page-btn" :disabled="baiThuocPage >= totalBTPage" @click="baiThuocPage++">›</button>
            <span class="page-info">Trang {{ baiThuocPage }} / {{ totalBTPage }}</span>
          </div>
        </div>
      </div>

      <!-- TAB VỊ THUỐC -->
      <div v-else class="tab-content">
        <div class="toolbar">
          <div class="search-wrap">
            <input
              v-model="viThuocSearch"
              type="search"
              class="search-input"
              placeholder="Tìm theo tên, tính, vị, quy kinh..."
            />
            <button v-if="viThuocSearch" type="button" class="search-clear" @click="viThuocSearch = ''" aria-label="Xóa tìm kiếm">✕</button>
          </div>
          <select
            v-model="viFilterNhomLonId"
            class="filter-select"
            aria-label="Lọc theo nhóm lớn dược lý"
          >
            <option :value="null">Tất cả nhóm lớn</option>
            <option v-for="nl in allNhomLonOptions" :key="nl.id" :value="nl.id">
              {{ nl.ten_nhom }}
            </option>
          </select>
          <select
            v-model="viFilterNhomNhoId"
            class="filter-select"
            aria-label="Lọc theo nhóm nhỏ dược lý"
            :disabled="allNhomNhoOptions.length === 0"
          >
            <option :value="null">Tất cả nhóm nhỏ</option>
            <option v-for="nn in allNhomNhoOptions" :key="nn.id" :value="nn.id">
              {{ nn.ten_nhom }}
            </option>
          </select>
          <button
            v-if="viFilterNhomLonId != null || viFilterNhomNhoId != null"
            type="button"
            class="filter-clear"
            @click="clearViThuocFilters"
          >Bỏ lọc</button>
          <span class="toolbar-count">{{ filteredViThuoc.length }} / {{ viThuocTotal }} vị thuốc</span>
        </div>
        <div class="data-card" :class="{ 'data-card--loading': viThuocPageLoading }">
          <div v-if="viThuocPageLoading" class="loading-bar" aria-hidden="true"></div>
          <div class="card-header">
            <div class="card-header-left">
              <h3>Danh Sách Vị Thuốc</h3>
              <span class="badge badge-success">{{ filteredViThuoc.length }} vị thuốc</span>
            </div>
            <button type="button" class="btn-primary" @click="openCreateViThuoc">+ Thêm vị thuốc</button>
          </div>
          <div v-if="pagedViThuoc.length === 0" class="empty-state">
            Chưa có dữ liệu vị thuốc
          </div>

          <div v-else class="vt-grid">
            <article v-for="vt in pagedViThuoc" :key="vt.id" class="vt-card">
              <header class="vt-card__head">
                <div class="vt-card__title">
                  <span class="vt-card__id">#{{ vt.id }}</span>
                  <h4 class="vt-card__name">
                    {{ vt.ten_vi_thuoc }}
                    <span v-if="vt.ten_han" class="vt-card__han">{{ vt.ten_han }}</span>
                  </h4>
                  <div v-if="vt.ten_khoa_hoc || vt.ten_pinyin" class="vt-card__sci">
                    <em v-if="vt.ten_khoa_hoc" class="vt-card__latin">{{ vt.ten_khoa_hoc }}</em>
                    <span v-if="vt.ten_pinyin" class="vt-card__pinyin">{{ vt.ten_pinyin }}</span>
                  </div>
                </div>
                <div class="row-actions">
                  <button type="button" class="btn-action btn-edit" @click="openEditViThuoc(vt)">Sửa</button>
                  <button type="button" class="btn-action btn-delete" @click="confirmDeleteViThuoc(vt)">Xóa</button>
                </div>
              </header>
              <div class="vt-card__body">
                <div class="vt-meta-row">
                  <div class="vt-meta">
                    <span class="vt-meta__label">Tính</span>
                    <span v-if="vt.tinh" :class="['vt-tinh-chip', tinhChipClass(vt.tinh)]">{{ vt.tinh }}</span>
                    <span v-else class="vt-meta__val">—</span>
                  </div>
                  <div class="vt-meta">
                    <span class="vt-meta__label">Vị</span>
                    <div v-if="vt.vi" class="vt-vi-chips">
                      <span v-for="flavor in vt.vi.split('/')" :key="flavor.trim()" class="vt-vi-chip">{{ flavor.trim() }}</span>
                    </div>
                    <span v-else class="vt-meta__val">—</span>
                  </div>
                </div>
                <div v-if="vt.bo_phan_dung" class="vt-meta">
                  <span class="vt-meta__label">Bộ phận dùng</span>
                  <span class="vt-meta__val">{{ vt.bo_phan_dung }}</span>
                </div>
                <div v-if="vt.lieu_dung" class="vt-meta">
                  <span class="vt-meta__label">Liều dùng</span>
                  <span class="vt-meta__val">
                    {{ vt.lieu_dung }}
                    <span class="vt-lieu-preview">≈ {{ gramPreviewText(vt.lieu_dung) }}</span>
                  </span>
                </div>
                <div v-if="vt.quy_kinh" class="vt-meta">
                  <span class="vt-meta__label">Quy kinh</span>
                  <div class="vt-qk-chips">
                    <span v-for="k in abbrevKinhList(vt.quy_kinh)" :key="k" class="vt-qk-chip">{{ k }}</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
          <div v-if="totalVTPage > 1" class="pagination">
            <button class="page-btn" :disabled="viThuocPage <= 1" @click="viThuocPage--">‹</button>
            <button v-for="pn in getPageNumbers(viThuocPage, totalVTPage)" :key="pn" class="page-btn" :class="{ active: pn === viThuocPage }" @click="viThuocPage = pn">{{ pn }}</button>
            <button class="page-btn" :disabled="viThuocPage >= totalVTPage" @click="viThuocPage++">›</button>
            <span class="page-info">Trang {{ viThuocPage }} / {{ totalVTPage }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- BÀI THUỐC MODAL -->
    <div v-if="btShowModal" class="modal-overlay">
      <div class="modal modal--wide" @click.stop>
        <div class="modal-header">
          <h3>{{ btEditingId != null ? 'Sửa bài thuốc' : 'Thêm bài thuốc' }}</h3>
          <button type="button" class="modal-close" @click="closeBaiThuocModal">✕</button>
        </div>
        <form class="modal-body modal-body--loadable" @submit.prevent="submitBaiThuoc">
          <div v-if="btFullLoading" class="modal-loading-overlay">
            <div class="spinner spinner--sm"></div>
            <span>Đang tải dữ liệu bài thuốc…</span>
          </div>
          <p v-if="btFormError" class="form-error">{{ btFormError }}</p>

          <div class="form-grid">
            <label class="field field--full">
              <span>Tên bài thuốc *</span>
              <input v-model="btForm.ten_bai_thuoc" class="input" placeholder="vd. Quế Chi Thang" />
            </label>

            <label class="field">
              <span>Nguồn gốc</span>
              <input v-model="btForm.nguon_goc" class="input" placeholder="vd. Thương Hàn Luận / Trương Trọng Cảnh" />
            </label>

            <label class="field">
              <span>Cách dùng</span>
              <input v-model="btForm.cach_dung" class="input" placeholder="vd. Sắc uống ngày 1 thang" />
            </label>

            <div class="field field--full">
              <div class="field-head">
                <span class="field-label">Thể bệnh</span>
                <span class="field-count">{{ btForm.phap_tri_ids.length }} đã chọn</span>
              </div>
              <div v-if="phapTriOptions.length === 0" class="muted">Chưa có dữ liệu</div>
              <template v-else>
                <div v-if="btForm.phap_tri_ids.length" class="selected-chips">
                  <span v-for="id in btForm.phap_tri_ids" :key="id" class="chip chip-the chip-removable">
                    {{ theBenhOptionLabel(phapTriById.get(id) ?? { id, nguyen_tac: '', chung_trang: '' }) || '#' + id }}
                    <button type="button" class="chip-x" aria-label="Bỏ chọn" @click="btForm.phap_tri_ids = btForm.phap_tri_ids.filter(x => x !== id)">×</button>
                  </span>
                </div>
                <div class="combo">
                  <input
                    v-model="btPhapTriSearch"
                    type="search"
                    class="input input--sm"
                    placeholder="Tìm và chọn thể bệnh..."
                    @focus="btPhapTriOpen = true"
                    @blur="closeAfterBlur(() => (btPhapTriOpen = false))"
                  />
                  <ul v-if="btPhapTriOpen" class="combo-dropdown">
                    <li
                      v-for="p in filteredBtPhapTri.slice(0, 100)"
                      :key="p.id"
                      class="combo-item"
                      :class="{ 'combo-item--selected': btForm.phap_tri_ids.includes(p.id) }"
                      @mousedown.prevent="btForm.phap_tri_ids = toggleId(btForm.phap_tri_ids, p.id); btPhapTriSearch = ''"
                    >
                      <span class="combo-item-main">{{ theBenhOptionLabel(p) }}</span>
                      <span v-if="p.nguyen_tac" class="combo-item-sub">{{ p.nguyen_tac }}</span>
                      <span v-if="btForm.phap_tri_ids.includes(p.id)" class="combo-check">✓</span>
                    </li>
                    <li v-if="filteredBtPhapTri.length === 0" class="combo-empty">Không khớp</li>
                  </ul>
                </div>
              </template>
            </div>

            <div class="field field--full">
              <div class="field-head">
                <span class="field-label">Triệu chứng</span>
                <span class="field-count">{{ btForm.trieu_chung_ids.length }} đã chọn</span>
              </div>
              <div v-if="trieuChungOptions.length === 0" class="muted">Chưa có triệu chứng</div>
              <template v-else>
                <div v-if="btForm.trieu_chung_ids.length" class="selected-chips">
                  <span v-for="id in btForm.trieu_chung_ids" :key="id" class="chip chip-trieu chip-removable">
                    {{ trieuChungById.get(id)?.ten_trieu_chung || '#' + id }}
                    <button type="button" class="chip-x" aria-label="Bỏ chọn" @click="btForm.trieu_chung_ids = btForm.trieu_chung_ids.filter(x => x !== id)">×</button>
                  </span>
                </div>
                <div class="combo">
                  <input
                    v-model="btTrieuChungSearch"
                    type="search"
                    class="input input--sm"
                    placeholder="Tìm và chọn triệu chứng..."
                    @focus="btTrieuChungOpen = true"
                    @blur="closeAfterBlur(() => (btTrieuChungOpen = false))"
                  />
                  <ul v-if="btTrieuChungOpen" class="combo-dropdown">
                    <li
                      v-for="t in filteredBtTrieuChung.slice(0, 100)"
                      :key="t.id"
                      class="combo-item"
                      :class="{ 'combo-item--selected': btForm.trieu_chung_ids.includes(t.id) }"
                      @mousedown.prevent="btForm.trieu_chung_ids = toggleId(btForm.trieu_chung_ids, t.id); btTrieuChungSearch = ''"
                    >
                      <span class="combo-item-main">{{ t.ten_trieu_chung }}</span>
                      <span v-if="btForm.trieu_chung_ids.includes(t.id)" class="combo-check">✓</span>
                    </li>
                    <li v-if="filteredBtTrieuChung.length === 0" class="combo-empty">Không khớp</li>
                  </ul>
                </div>
              </template>
            </div>

            <div class="field field--full">
              <div class="field-head">
                <span class="field-label">Thành phần (vị thuốc, liều lượng)</span>
                <span class="field-count">{{ btForm.chi_tiet.length }} vị thuốc</span>
              </div>

              <div v-if="btForm.chi_tiet.length" class="chi-tiet-list">
                <div v-for="(row, i) in btForm.chi_tiet" :key="i" class="chi-tiet-row">
                  <span class="ct-name">{{ chiTietDisplayName(i) }}</span>
                  <div class="ct-lieu-wrap">
                    <input
                      v-model="row.lieu_luong"
                      class="input input--sm ct-lieu"
                      placeholder="Liều (vd. 12g, 2 tiền, 1 lượng, *, #)"
                    />
                    <span class="ct-lieu-preview">≈ {{ gramPreviewText(row.lieu_luong) }}</span>
                  </div>
                  <button type="button" class="btn-mini btn-mini-danger" @click="removeChiTietRow(i)" aria-label="Xóa">✕</button>
                </div>
              </div>

              <input
                v-model="btViThuocAddSearch"
                type="search"
                class="input input--sm"
                list="vi-thuoc-options"
                placeholder="+ Gõ tên vị thuốc để thêm..."
                @change="onViThuocAddChange"
              />
              <datalist id="vi-thuoc-options">
                <option
                  v-for="v in viThuocFullList"
                  :key="v.id"
                  :value="v.ten_vi_thuoc"
                >{{ [v.tinh, v.vi].filter(Boolean).join(' · ') }}</option>
              </datalist>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" :disabled="btSubmitting" @click="closeBaiThuocModal">Hủy</button>
            <button type="submit" class="btn-primary" :disabled="btSubmitting">
              {{ btSubmitting ? 'Đang lưu…' : 'Lưu' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="btShowDelete" class="modal-overlay" @click.self="btShowDelete = false">
      <div class="modal modal--sm" @click.stop>
        <div class="modal-header">
          <h3>Xác nhận xóa</h3>
          <button type="button" class="modal-close" @click="btShowDelete = false">✕</button>
        </div>
        <div class="modal-body">
          <p>Xóa bài thuốc <strong>{{ btDeleting?.ten_bai_thuoc }}</strong>? Thao tác không hoàn tác.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" :disabled="btSubmitting" @click="btShowDelete = false">Hủy</button>
          <button type="button" class="btn-danger" :disabled="btSubmitting" @click="deleteBaiThuoc">
            {{ btSubmitting ? 'Đang xóa…' : 'Xóa' }}
          </button>
        </div>
      </div>
    </div>

    <!-- IMPORT LOADING OVERLAY -->
    <div v-if="btIsImporting" class="modal-overlay">
      <div class="modal modal--sm" @click.stop>
        <div class="modal-header">
          <h3>Đang nhập Excel…</h3>
        </div>
        <div class="modal-body">
          <p class="import-progress-text">
            Đã xử lý <strong>{{ btImportProgress.current }}</strong> /
            <strong>{{ btImportProgress.total }}</strong> dòng
          </p>
          <div class="progress-bar">
            <div
              class="progress-bar-fill"
              :style="{
                width: btImportProgress.total
                  ? Math.round((btImportProgress.current / btImportProgress.total) * 100) + '%'
                  : '0%',
              }"
            ></div>
          </div>
          <p class="text-gray-500 text-center" style="margin-top: 8px; font-size: 12px;">
            Vui lòng chờ, không đóng cửa sổ.
          </p>
        </div>
      </div>
    </div>

    <!-- IMPORT RESULT MODAL -->
    <div v-if="btShowImportResult && btImportResult" class="modal-overlay" @click.self="btShowImportResult = false">
      <div class="modal modal--wide" @click.stop>
        <div class="modal-header">
          <h3>Kết quả nhập Excel</h3>
          <button type="button" class="modal-close" @click="btShowImportResult = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="import-summary">
            <div class="summary-item">
              <span class="summary-label">Dòng xử lý</span>
              <span class="summary-value">{{ btImportResult.rowsProcessed }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Tạo mới</span>
              <span class="summary-value summary-value-success">{{ btImportResult.baiThuocCreated }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Cập nhật</span>
              <span class="summary-value summary-value-info">{{ btImportResult.baiThuocUpdated }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Lỗi</span>
              <span class="summary-value summary-value-error">{{ btImportResult.errors.length }}</span>
            </div>
          </div>

          <div v-if="btImportResult.missingViThuoc.length" class="import-section">
            <h4 class="import-section-title">
              Vị thuốc chưa tồn tại
              <span class="badge badge-warn">{{ btImportResult.missingViThuoc.length }}</span>
            </h4>
            <p class="import-section-hint">Các vị thuốc dưới đây không có trong hệ thống — đã bỏ qua khi import.</p>
            <ul class="missing-list">
              <li v-for="(m, idx) in btImportResult.missingViThuoc" :key="'vi-' + idx">
                <span class="missing-name">{{ m.name }}</span>
                <span class="missing-rows">Dòng: {{ m.rows.join(', ') }}</span>
              </li>
            </ul>
          </div>

          <div v-if="btImportResult.missingPhapTri.length" class="import-section">
            <h4 class="import-section-title">
              Thể bệnh chưa tồn tại
              <span class="badge badge-warn">{{ btImportResult.missingPhapTri.length }}</span>
            </h4>
            <ul class="missing-list">
              <li v-for="(m, idx) in btImportResult.missingPhapTri" :key="'pt-' + idx">
                <span class="missing-name">{{ m.name }}</span>
                <span class="missing-rows">Dòng: {{ m.rows.join(', ') }}</span>
              </li>
            </ul>
          </div>

          <div v-if="btImportResult.missingTrieuChung.length" class="import-section">
            <h4 class="import-section-title">
              Triệu chứng chưa tồn tại
              <span class="badge badge-warn">{{ btImportResult.missingTrieuChung.length }}</span>
            </h4>
            <ul class="missing-list">
              <li v-for="(m, idx) in btImportResult.missingTrieuChung" :key="'tc-' + idx">
                <span class="missing-name">{{ m.name }}</span>
                <span class="missing-rows">Dòng: {{ m.rows.join(', ') }}</span>
              </li>
            </ul>
          </div>

          <div v-if="btImportResult.errors.length" class="import-section">
            <h4 class="import-section-title">
              Lỗi
              <span class="badge badge-error">{{ btImportResult.errors.length }}</span>
            </h4>
            <ul class="missing-list">
              <li v-for="(e, idx) in btImportResult.errors" :key="'err-' + idx">
                <span class="missing-name">{{ e }}</span>
              </li>
            </ul>
          </div>

          <p
            v-if="!btImportResult.missingViThuoc.length && !btImportResult.missingPhapTri.length && !btImportResult.missingTrieuChung.length && !btImportResult.errors.length"
            class="text-center text-gray-500"
            style="padding: 16px 0;"
          >
            Không có cảnh báo. Tất cả dữ liệu được khớp đầy đủ.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-primary" @click="btShowImportResult = false">Đóng</button>
        </div>
      </div>
    </div>

    <!-- VỊ THUỐC MODAL -->
    <div v-if="vtShowModal" class="modal-overlay">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ vtEditingId != null ? 'Sửa vị thuốc' : 'Thêm vị thuốc' }}</h3>
          <button type="button" class="modal-close" @click="closeViThuocModal">✕</button>
        </div>
        <form class="modal-body" @submit.prevent="submitViThuoc">
          <p v-if="vtFormError" class="form-error">{{ vtFormError }}</p>

          <div v-if="vtEditingId != null" class="vt-ai-row">
            <button
              type="button"
              class="btn-ai"
              :disabled="vtAiLoading || vtSubmitting"
              @click="suggestViThuocAi"
            >
              <span v-if="vtAiLoading">⏳ Đang gợi ý…</span>
              <span v-else>✨ Gợi ý AI</span>
            </button>
            <span class="vt-ai-hint">AI điền Tính / Vị / Quy kinh + gợi ý Nhóm dược lý.</span>
          </div>

          <div v-if="vtForm.nhom_nho_ids.length || vtAiSuggestedNhomNhoId != null" class="vt-nhom-card">
            <div class="vt-nhom-head">
              <span class="vt-nhom-label">Nhóm dược lý ({{ vtForm.nhom_nho_ids.length }})</span>
            </div>
            <div class="vt-nhom-chips">
              <span
                v-for="id in vtForm.nhom_nho_ids"
                :key="id"
                class="vt-nhom-chip"
                :class="{ 'vt-nhom-chip--ai': id === vtAiSuggestedNhomNhoId }"
              >
                <span v-if="id === vtAiSuggestedNhomNhoId" class="vt-ai-badge-mini">🤖</span>
                {{ nhomNhoFullLabel(id) }}
                <button
                  type="button"
                  class="vt-nhom-x"
                  title="Bỏ nhóm này"
                  @click="removeVtNhomNho(id)"
                >×</button>
              </span>
            </div>
            <p v-if="vtAiNhomLyDo && vtAiSuggestedNhomNhoId != null" class="vt-ai-nhom-reason">
              <strong>AI:</strong> {{ vtAiNhomLyDo }}
            </p>
          </div>

          <div class="form-grid">
            <label class="field field--full">
              <span>Tên vị thuốc{{ vtEditingId != null ? '' : ' *' }}</span>
              <input
                v-model="vtForm.ten_vi_thuoc"
                class="input"
                placeholder="vd. Cam thảo"
                :readonly="vtEditingId != null"
                :disabled="vtEditingId != null"
              />
            </label>

            <label class="field">
              <span>Tính</span>
              <input v-model="vtForm.tinh" class="input" placeholder="vd. Ấm, Hàn, Bình..." />
            </label>

            <label class="field">
              <span>Vị</span>
              <input v-model="vtForm.vi" class="input" placeholder="vd. Ngọt, Cay, Đắng..." />
            </label>

            <label class="field field--full">
              <span>Tên khoa học (Latin)</span>
              <input v-model="vtForm.ten_khoa_hoc" class="input" placeholder="vd. Radix Paeoniae Alba" />
            </label>

            <label class="field">
              <span>Tên Hán</span>
              <input v-model="vtForm.ten_han" class="input" placeholder="vd. 白芍" />
            </label>

            <label class="field">
              <span>Pinyin</span>
              <input v-model="vtForm.ten_pinyin" class="input" placeholder="vd. Bái Sháo" />
            </label>

            <label class="field field--full">
              <span>Bộ phận dùng</span>
              <input v-model="vtForm.bo_phan_dung" class="input" placeholder="vd. rễ, vỏ thân, hạt, toàn cây" />
            </label>

            <div class="field field--full">
              <span>Liều dùng</span>
              <input
                v-model="vtForm.lieu_dung"
                class="input"
                placeholder="vd. 12g, 2 tiền, 1 lượng, *, # (1 tiền=3g, 1 lượng=30g)"
              />
              <span class="ct-lieu-preview">≈ {{ gramPreviewText(vtForm.lieu_dung) }}</span>
            </div>

            <div class="field field--full">
              <span>Quy kinh</span>
              <div class="vt-km-chips">
                <span v-if="!vtForm.kinh_mach_ids.length" class="vt-km-empty">Chưa chọn kinh mạch nào</span>
                <span v-for="id in vtForm.kinh_mach_ids" :key="id" class="vt-km-chip">
                  {{ kinhMachName(id) }}
                  <button type="button" class="vt-km-x" @click="removeKinhMachId(id)">×</button>
                </span>
              </div>
              <input
                v-model="vtKinhMachFilter"
                class="input"
                type="text"
                placeholder="Gõ để tìm kinh mạch (tên hoặc viết tắt)…"
              />
              <div v-if="vtKinhMachFilter && vtFilteredKinhMach.length" class="vt-km-dropdown">
                <button
                  v-for="km in vtFilteredKinhMach"
                  :key="km.idKinhMach"
                  type="button"
                  class="vt-km-option"
                  @click="addKinhMachId(km.idKinhMach)"
                >
                  {{ km.ten_kinh_mach }}<span v-if="km.ten_viet_tat" class="vt-km-abbr">({{ km.ten_viet_tat }})</span>
                </button>
              </div>
              <p v-if="vtAiUnmatched.length" class="vt-km-warn">
                AI gợi ý nhưng không khớp được trong bảng kinh mạch: <strong>{{ vtAiUnmatched.join(', ') }}</strong>
              </p>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" :disabled="vtSubmitting" @click="closeViThuocModal">Hủy</button>
            <button type="submit" class="btn-primary" :disabled="vtSubmitting">
              {{ vtSubmitting ? 'Đang lưu…' : 'Lưu' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="vtShowDelete" class="modal-overlay" @click.self="vtShowDelete = false">
      <div class="modal modal--sm" @click.stop>
        <div class="modal-header">
          <h3>Xác nhận xóa</h3>
          <button type="button" class="modal-close" @click="vtShowDelete = false">✕</button>
        </div>
        <div class="modal-body">
          <p>Xóa vị thuốc <strong>{{ vtDeleting?.ten_vi_thuoc }}</strong>? Thao tác không hoàn tác.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" :disabled="vtSubmitting" @click="vtShowDelete = false">Hủy</button>
          <button type="button" class="btn-danger" :disabled="vtSubmitting" @click="deleteViThuoc">
            {{ vtSubmitting ? 'Đang xóa…' : 'Xóa' }}
          </button>
        </div>
      </div>
    </div>

    <!-- PHÂN TÍCH BÀI THUỐC MODAL -->
    <div v-if="anaShowModal" class="modal-overlay ana-overlay" @click.self="closeAnalysis">
      <div class="modal ana-modal" @click.stop>
        <div class="modal-header">
          <h3>Phân tích: {{ anaResult?.ten ?? '' }}</h3>
          <button type="button" class="modal-close" @click="closeAnalysis">✕</button>
        </div>
        <div class="ana-tabs" role="tablist" aria-label="Chế độ phân tích bài thuốc">
          <button type="button" role="tab" class="ana-tab" :class="{ active: anaTab === 'phantich' }" :aria-selected="anaTab === 'phantich'" @click="anaTab = 'phantich'">Phân tích</button>
          <button type="button" role="tab" class="ana-tab" :class="{ active: anaTab === 'dothi' }" :aria-selected="anaTab === 'dothi'" @click="anaTab = 'dothi'">Đồ thị tri thức</button>
        </div>
        <div class="modal-body ana-body">
          <template v-if="anaTab === 'phantich'">
          <div v-if="anaLoading" class="ana-loading">
            <div class="spinner"></div>
            <p>Đang tải dữ liệu phân tích…</p>
          </div>
          <template v-else-if="anaResult && !anaResult.empty">
            <!-- Tứ khí -->
            <div class="ana-card">
              <div class="ana-section-title">1) Phân tích Tứ khí</div>
              <div class="tukhi-strip">
                <div class="tukhi-row">
                  <div
                    v-for="(seg, i) in TU_KHI_SEGS"
                    :key="'arrow-' + seg.key"
                    class="tukhi-arrow"
                  >
                    <span v-if="i === anaTuKhiTipIdx" class="tukhi-arrow-mark">▼</span>
                  </div>
                </div>
                <div class="tukhi-row">
                  <div
                    v-for="seg in TU_KHI_SEGS"
                    :key="'color-' + seg.key"
                    class="tukhi-bar"
                    :style="{ background: seg.c }"
                  ></div>
                </div>
                <div class="tukhi-row tukhi-labels">
                  <div v-for="seg in TU_KHI_SEGS" :key="'label-' + seg.key" class="tukhi-label">
                    <div class="tukhi-label-vn">{{ seg.vn }}</div>
                    <div class="tukhi-label-zh">({{ seg.zh }})</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="ana-layout">
              <div class="ana-left">
                <div class="ana-card ana-radar-card">
                  <div class="ana-radar-side">
                    <div class="ana-section-title">2) Ngũ vị</div>
                    <div class="ana-hint">Liền nét = gốc · Nét đứt = kéo giả lập.</div>
                  </div>
                  <div class="ana-radar-canvas-wrap">
                    <canvas ref="radarNguViRef"></canvas>
                  </div>
                </div>

                <div class="ana-card ana-radar-card">
                  <div class="ana-radar-side">
                    <div class="ana-section-title">3) Quy kinh</div>
                  </div>
                  <div class="ana-radar-canvas-wrap">
                    <canvas ref="radarQuyKinhRef"></canvas>
                  </div>
                </div>

                <div class="ana-card ana-radar-card">
                  <div class="ana-radar-side">
                    <div class="ana-section-title">4) Thăng – Giáng – Phù – Trầm</div>
                    <div class="ana-hint">Liền nét = gốc · Nét đứt = kéo giả lập.</div>
                  </div>
                  <div class="ana-radar-canvas-wrap">
                    <canvas ref="radarTgptRef"></canvas>
                  </div>
                </div>

                <div class="ana-card">
                  <div class="ana-section-title">5) Tổng hợp</div>
                  <div
                    v-if="
                      anaResult.chungTrangBaiThuoc ||
                      benhTayYLabelsForBaiThuoc(anaResult.idBaiThuoc).length
                    "
                    class="ana-chip-row"
                  >
                    <span
                      v-for="(p, i) in anaResult.chungTrangBaiThuoc.split(/[,;]+/).map(s => s.trim()).filter(Boolean)"
                      :key="'pt-' + i"
                      class="ana-chip ana-chip-phap"
                    >{{ p }}</span>
                    <span
                      v-for="bty in benhTayYLabelsForBaiThuoc(anaResult.idBaiThuoc)"
                      :key="'bty-' + bty.id"
                      class="ana-chip ana-chip-tayy"
                      :title="bty.chungBenh?.ten_chung_benh ? `Chủng bệnh: ${bty.chungBenh.ten_chung_benh}` : ''"
                    >{{ bty.ten_benh }}</span>
                  </div>
                  <div v-else class="ana-muted">Chưa gán chứng trạng.</div>

                  <div class="ana-sub-title">Tác dụng <span class="ana-sub-hint">(nhóm lớn - nhóm nhỏ)</span></div>
                  <div v-if="anaResult.tacDungChips.length" class="ana-chip-row">
                    <span
                      v-for="(t, i) in anaResult.tacDungChips"
                      :key="'td-' + i"
                      class="ana-chip ana-chip-tacdung"
                    >{{ t }}</span>
                  </div>
                  <div v-else class="ana-muted">Vị thuốc trong bài chưa được gán nhóm dược lý.</div>

                  <div class="ana-sub-title">Chủ trị <span class="ana-sub-hint">(từ nhóm dược lý)</span></div>
                  <div v-if="anaResult.chuTriBaiThuoc.length" class="ana-chip-row">
                    <span
                      v-for="(t, i) in anaResult.chuTriBaiThuoc"
                      :key="'ct-' + i"
                      class="ana-chip ana-chip-cong"
                    >{{ t }}</span>
                  </div>
                  <div v-else class="ana-muted">Nhóm dược lý của các vị thuốc chưa gắn chủ trị.</div>

                  <div class="ana-sub-title">Kiêng kỵ</div>
                  <div v-if="anaResult.kiengKyBaiThuoc.length" class="ana-chip-row">
                    <span
                      v-for="(t, i) in anaResult.kiengKyBaiThuoc"
                      :key="'kk-' + i"
                      class="ana-chip ana-chip-kk"
                    >{{ t }}</span>
                  </div>
                  <div v-else class="ana-muted">Chưa có kiêng kỵ từ các vị thuốc trong bài.</div>
                </div>

                <!-- 6) Luận giải tổng hợp + cảnh báo cấm kỵ phối ngũ (tính ở backend) -->
                <div v-if="anaEnrich" class="ana-card">
                  <div class="ana-section-title">6) Luận giải &amp; Cảnh báo phối ngũ</div>

                  <p v-if="anaEnrich.luanGiai" class="ana-luangiai">{{ anaEnrich.luanGiai }}</p>

                  <ul v-if="anaEnrich.nhanDinh.length" class="ana-nhandinh">
                    <li v-for="(n, i) in anaEnrich.nhanDinh" :key="'nd-' + i">{{ n }}</li>
                  </ul>

                  <template v-if="anaEnrich.congNang.length">
                    <div class="ana-sub-title">Công năng tổng hợp <span class="ana-sub-hint">(trọng số theo liều)</span></div>
                    <div class="ana-chip-row">
                      <span
                        v-for="(c, i) in anaEnrich.congNang.slice(0, 12)"
                        :key="'cn-' + i"
                        class="ana-chip ana-chip-tacdung"
                      >{{ c.ten }}</span>
                    </div>
                  </template>

                  <div class="ana-sub-title">Cấm kỵ phối ngũ <span class="ana-sub-hint">(18 phản / 19 úy)</span></div>
                  <div v-if="anaEnrich.tuongPhan.length" class="ana-camky-list">
                    <div
                      v-for="(w, i) in anaEnrich.tuongPhan"
                      :key="'tp-' + i"
                      class="ana-camky"
                      :class="w.loai === 'phản' ? 'is-phan' : 'is-uy'"
                    >
                      <span class="ana-camky-badge">{{ w.loai === 'phản' ? '⚠ Tương phản' : '⚠ Tương úy' }}</span>
                      <span class="ana-camky-pair">{{ w.tenA }} ✕ {{ w.tenB }}</span>
                      <span v-if="w.ghiChu" class="ana-camky-note">{{ w.ghiChu }}</span>
                    </div>
                  </div>
                  <div v-else class="ana-muted">Không phát hiện cặp tương phản / tương úy trong bài.</div>
                </div>
              </div>

              <div class="ana-right">
                <div class="ana-dosage">
                  <div class="ana-dosage-head">
                    <span>Quân–Thần–Tá–Sứ</span>
                    <span class="ana-dosage-total">Tổng ≈ {{ anaTotalSim.toFixed(1) }}g</span>
                    <button
                      v-if="anaSimDirty"
                      type="button"
                      class="ana-reset-btn"
                      @click="resetSimGrams"
                    >Khôi phục gốc</button>
                  </div>
                  <div class="ana-hint ana-dosage-hint">Sửa Gram để giả lập; % và radar nét đứt đồng bộ.</div>
                  <div class="ana-dosage-tbl-wrap">
                    <table class="ana-dosage-tbl">
                      <thead>
                        <tr>
                          <th>Vị thuốc</th>
                          <th>Gram</th>
                          <th>%</th>
                          <th title="Vai trò người dùng nhập khi tạo bài thuốc">Nhập</th>
                          <th title="Vai trò suy luận tự động từ liều lượng & quy kinh">Suy luận</th>
                          <th>Quy kinh</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="v in anaSortedVtRows" :key="v.id">
                          <td class="ana-vt-name">{{ v.ten }}</td>
                          <td class="ana-vt-gram">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              :value="(v.simGram ?? v.gram).toFixed(1)"
                              @input="onGramInput(v.id, ($event.target as HTMLInputElement).value)"
                            />
                          </td>
                          <td class="ana-vt-pct">{{ anaTotalSim > 0 ? Math.round((v.simGram ?? v.gram) / anaTotalSim * 100) : 0 }}%</td>
                          <td class="ana-vt-role">
                            <span
                              v-if="v.vai_tro_nhap"
                              class="ana-role-chip"
                              :class="{ 'ana-role-chip--outline': !vaiTroMatchSuyLuan(v) }"
                              :style="{ background: vaiTroNhapColor(v.vai_tro_nhap) }"
                            >{{ v.vai_tro_nhap }}</span>
                            <span v-else class="ana-role-empty">—</span>
                          </td>
                          <td class="ana-vt-role">
                            <span class="ana-role-chip" :style="{ background: v.color }">{{ v.vai_tro }}</span>
                          </td>
                          <td class="ana-vt-qk">{{ shortKinh(v.quy_kinh) || '—' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

          </template>
          <div v-else class="ana-empty">Bài thuốc chưa có vị thuốc nào để phân tích.</div>
          </template>

          <!-- Tab Đồ thị tri thức -->
          <div v-else class="ana-graph-wrap">
            <BaiThuocGraph
              v-if="anaResult && !anaResult.empty"
              :key="'graph-' + anaResult.idBaiThuoc"
              :root-id="anaResult.idBaiThuoc"
            />
            <div v-else class="ana-empty">Chưa có dữ liệu để dựng đồ thị.</div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="closeAnalysis">Đóng</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.management-page { width: 100%; animation: fadeIn 0.4s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

/* Header */
.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-6); padding-bottom: var(--space-4); border-bottom: 2px solid var(--brown-100); }
.header-content { min-width: 0; flex: 1 1 auto; }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--brown-800); margin-bottom: var(--space-1); line-height: 1.2; }
.page-subtitle { color: var(--gray-500); font-size: var(--font-size-md); line-height: 1.4; }

.view-toggle { display: flex; background: var(--white); padding: 4px; border-radius: var(--radius-lg); border: 1px solid var(--brown-200); box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.toggle-btn { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border-radius: var(--radius-md); font-weight: 600; font-size: var(--font-size-sm); color: var(--gray-600); transition: all var(--transition-base); }
.toggle-btn:hover { color: var(--brown-600); }
.toggle-btn.active { background: var(--brown-600); color: var(--white); box-shadow: 0 2px 4px rgba(161, 98, 7, 0.2); }

/* Toolbar / search */
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; margin-bottom: var(--space-3); }
.search-wrap { position: relative; flex: 1; min-width: 240px; max-width: 520px; }
.search-input { width: 100%; padding: var(--space-2) 32px var(--space-2) var(--space-3); border: 1px solid var(--gray-200); border-radius: var(--radius-md); font-size: var(--font-size-md); background: var(--white); }
.search-input:focus { outline: none; border-color: var(--brown-500); box-shadow: var(--focus-ring); }
.filter-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: var(--white);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--gray-800);
  cursor: pointer;
  min-width: 160px;
  max-width: 240px;
}
.filter-select:focus {
  outline: none;
  border-color: var(--brown-500);
  box-shadow: var(--focus-ring);
}
.filter-select:disabled { opacity: 0.55; cursor: not-allowed; background: var(--gray-50); }
.filter-clear {
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  font-weight: 600;
  border: 1px solid var(--brown-200);
  border-radius: var(--radius-md);
  background: var(--brown-50);
  color: var(--brown-700);
  cursor: pointer;
  transition: all .12s;
}
.filter-clear:hover { background: var(--brown-100); border-color: var(--brown-300); }
.search-clear { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; background: var(--gray-100); border: none; border-radius: 50%; color: var(--gray-600); cursor: pointer; font-size: 12px; }
.search-clear:hover { background: var(--gray-200); color: var(--gray-800); }
.toolbar-count { font-size: var(--font-size-sm); color: var(--gray-500); font-weight: 600; }

.sub-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  border-bottom: 1px solid var(--brown-100);
  padding-bottom: 0;
  flex-wrap: wrap;
}
.sub-tab {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 1px solid transparent;
  border-bottom: none;
  background: transparent;
  color: var(--gray-600);
  font-weight: 600;
  font-size: var(--font-size-sm);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  cursor: pointer;
  transition: all var(--transition-base);
  margin-bottom: -1px;
}
.sub-tab:hover { color: var(--brown-600); background: var(--brown-50); }
.sub-tab.active {
  background: var(--white);
  color: var(--brown-700);
  border-color: var(--brown-200);
  border-bottom-color: var(--white);
}
.sub-tab__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  background: var(--gray-100);
  color: var(--gray-600);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
}
.sub-tab.active .sub-tab__count { background: var(--brown-600); color: var(--white); }

.sub-sub-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: calc(-1 * var(--space-2)) 0 var(--space-3);
  padding: var(--space-2) 0;
}
.sub-sub-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border: 1px solid var(--brown-200);
  background: var(--white);
  color: var(--gray-700);
  font-weight: 600;
  font-size: 12px;
  border-radius: 999px;
  cursor: pointer;
  transition: all var(--transition-base);
}
.sub-sub-tab:hover {
  background: var(--brown-50);
  border-color: var(--brown-300);
  color: var(--brown-700);
}
.sub-sub-tab.active {
  background: var(--brown-50);
  color: var(--brown-800);
  border-color: var(--brown-200);
}
.sub-sub-tab__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  background: var(--gray-100);
  color: var(--gray-600);
  border-radius: 9px;
  font-size: 10px;
  font-weight: 700;
}
.sub-sub-tab.active .sub-sub-tab__count {
  background: var(--brown-700);
  color: var(--white);
}

.extra-filters {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: var(--space-3);
}
.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.filter-row__label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--gray-500);
  flex-shrink: 0;
  min-width: 90px;
}
.sub-sub-tabs--inline { margin: 0; padding: 0; flex: 1; gap: 4px; }
.sub-sub-tabs--inline .sub-sub-tab {
  padding: 2px 8px;
  font-size: 11px;
}
.sub-sub-tabs--inline .sub-sub-tab__count {
  min-width: 16px;
  height: 14px;
  padding: 0 4px;
  font-size: 9px;
  border-radius: 7px;
}
.sub-sub-tabs--alt .sub-sub-tab.active {
  background: var(--chip-pattern-bg);
  color: var(--chip-pattern-fg);
  border-color: var(--chip-pattern-border);
}
.sub-sub-tabs--alt .sub-sub-tab.active .sub-sub-tab__count {
  background: var(--chip-pattern-fg);
  color: var(--white);
}
.filter-clear-btn {
  margin-left: auto;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  color: var(--gray-500);
  background: transparent;
  border: 0;
  cursor: pointer;
  text-decoration: underline;
}
.filter-clear-btn:hover { color: var(--brown-700); }

.data-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm); }
.card-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4) var(--space-5); background: var(--brown-50); border-bottom: 1px solid var(--brown-100); gap: var(--space-3); }
.card-header-left { display: flex; align-items: center; gap: var(--space-3); }
.card-header h3 { font-size: var(--font-size-lg); font-weight: 700; color: var(--brown-900); margin: 0; }

.table-responsive { width: 100%; overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: var(--space-3) var(--space-5); text-align: left; border-bottom: 1px solid var(--gray-100); }
.data-table th { background: var(--surface-2); font-weight: 600; font-size: var(--font-size-sm); color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px; }
.data-table tbody tr { transition: background 0.2s; }
.data-table tbody tr:hover { background: var(--gray-50); }
.data-table td { font-size: var(--font-size-md); color: var(--gray-800); vertical-align: top; }

.pagination { display: flex; align-items: center; justify-content: center; gap: var(--space-2); padding: var(--space-4); background: var(--gray-50); border-top: 1px solid var(--gray-100); }
.page-btn { min-width: 32px; height: 32px; padding: 0 8px; display: flex; align-items: center; justify-content: center; background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-600); cursor: pointer; transition: all var(--transition-fast); }
.page-btn:hover:not(:disabled) { border-color: var(--brown-400); color: var(--brown-700); background: var(--brown-50); }
.page-btn.active { background: var(--brown-600); border-color: var(--brown-600); color: var(--white); }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { margin-left: var(--space-4); font-size: var(--font-size-xs); color: var(--gray-500); font-weight: 600; }

.text-center { text-align: center !important; }
.py-8 { padding-top: 2rem !important; padding-bottom: 2rem !important; }
.font-bold { font-weight: 700 !important; }
.text-brown-900 { color: var(--brown-900) !important; }
.text-gray-600 { color: var(--gray-600) !important; }
.text-gray-500 { color: var(--gray-500) !important; }

.badge { display: inline-block; padding: 4px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-info { background: var(--info-bg); color: var(--info-fg); }
.badge-success { background: var(--success-bg); color: var(--success-fg); }

.chip-row { display: flex; flex-wrap: wrap; gap: 4px; }
.chip { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; line-height: 1.4; border: 1px solid transparent; }
.chip-phap { background: var(--chip-method-bg); color: var(--chip-method-fg); border-color: var(--chip-method-border); }
.chip-the { background: var(--chip-pattern-bg); color: var(--chip-pattern-fg); border-color: var(--chip-pattern-border); }
.chip-link-the,
.chip-link-phap,
.chip-link-tayy {
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, transform 0.05s;
}
.chip-link-phap:hover { background: var(--chip-method-bg); border-color: var(--chip-method-fg); }
.chip-link-the:hover { background: var(--chip-pattern-bg); border-color: var(--chip-pattern-fg); }
.chip-link-tayy:hover { background: var(--chip-brand-bg); border-color: var(--chip-brand-fg); }
.chip-link-the:active,
.chip-link-phap:active,
.chip-link-tayy:active { transform: translateY(1px); }
.chip-trieu { background: var(--chip-symptom-bg); color: var(--chip-symptom-fg); border-color: var(--chip-symptom-border); }
.chip-tayy { background: var(--chip-brand-bg); color: var(--chip-brand-fg); border-color: var(--chip-brand-border); }
.muted { color: var(--gray-400); font-style: italic; }

/* Pháp trị + triệu chứng (triệu chứng nằm dưới pháp trị mà bài thuốc liên kết) */
.phap-tri-list { display: flex; flex-direction: column; gap: 8px; }
.phap-tri-item { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
.phap-tri-trieu { padding-left: 10px; border-left: 2px solid var(--chip-symptom-border); }

.thanh-phan-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 2px; }
.thanh-phan-list li { display: flex; gap: 8px; align-items: baseline; font-size: 13px; }
.vt-name { color: var(--brown-900); font-weight: 600; }
.vt-lieu { color: var(--gray-600); font-size: 12px; }

/* Bài thuốc card grid */
.empty-state {
  padding: var(--space-12) var(--space-5);
  text-align: center;
  color: var(--gray-500);
  font-size: var(--font-size-md);
  background: linear-gradient(180deg, #fff 0%, var(--surface-2) 100%);
}
.bt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--surface-2);
}
.bt-card {
  display: flex;
  flex-direction: column;
  background: var(--white);
  border: 1px solid var(--brown-100);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(74, 47, 23, 0.04);
  transition: box-shadow .15s, transform .15s, border-color .15s;
}
.bt-card:hover {
  box-shadow: 0 6px 18px rgba(74, 47, 23, 0.08);
  border-color: var(--brown-200);
  transform: translateY(-1px);
}
.bt-card--highlight {
  border-color: #d97706;
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.25), 0 6px 18px rgba(217, 119, 6, 0.18);
  animation: bt-flash 2.5s ease-out;
}
@keyframes bt-flash {
  0%   { background-color: #fff7ed; }
  60%  { background-color: #fff7ed; }
  100% { background-color: #fff; }
}
.bt-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(135deg, var(--brown-50) 0%, #fff 100%);
  border-bottom: 1px solid var(--brown-100);
}
.bt-card__title {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  min-width: 0;
  flex: 1;
}
.bt-card__id {
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 700;
  color: var(--brown-700);
  background: var(--white);
  border: 1px solid var(--brown-200);
  padding: 2px 8px;
  border-radius: 999px;
  letter-spacing: 0.02em;
  margin-top: 1px;
}
.bt-card__name-wrap { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.bt-card__name {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--brown-900);
  line-height: 1.35;
  word-break: break-word;
}
.bt-card__source {
  font-size: 11px;
  color: var(--gray-500);
  font-style: italic;
}
.bt-card__body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4) var(--space-4);
}
.bt-section { display: flex; flex-direction: column; gap: 6px; }
.bt-section-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  align-items: start;
}
.bt-section-row .bt-section--col { min-width: 0; }
@media (max-width: 640px) {
  .bt-section-row { grid-template-columns: 1fr; }
}

.bty-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.bty-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--chip-brand-bg);
  border: 1px solid var(--chip-brand-border);
  border-radius: var(--radius-md);
  max-width: 100%;
}
.bty-group__label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--chip-brand-fg);
  white-space: nowrap;
}
.bty-group .chip-row { flex: 1 1 auto; min-width: 0; }
.bt-section__label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gray-500);
}
.bt-section__text {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--gray-800);
  line-height: 1.5;
  word-break: break-word;
}
.bt-section--thanh-phan .thanh-phan-list {
  padding: 6px 10px;
  background: var(--surface-2);
  border: 1px solid var(--gray-100);
  border-radius: var(--radius-md);
  gap: 4px;
}
.bt-section--thanh-phan .thanh-phan-list li {
  padding: 2px 0;
}
.bt-section--thanh-phan .thanh-phan-list li + li {
  border-top: 1px dashed var(--gray-200);
  padding-top: 6px;
  margin-top: 2px;
}
.bt-section--thanh-phan .vt-lieu {
  font-family: ui-monospace, monospace;
  margin-left: auto;
}
/* Vị thuốc card grid */
.vt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  background: var(--surface-2);
}
.vt-card {
  display: flex;
  flex-direction: column;
  background: var(--white);
  border: 1px solid var(--brown-100);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(74, 47, 23, 0.04);
  transition: box-shadow .15s, transform .15s, border-color .15s;
}
.vt-card:hover {
  box-shadow: 0 6px 18px rgba(74, 47, 23, 0.08);
  border-color: var(--brown-200);
  transform: translateY(-1px);
}
.vt-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-3) var(--space-2);
  background: linear-gradient(135deg, var(--brown-50) 0%, #fff 100%);
  border-bottom: 1px solid var(--brown-100);
}
.vt-card__title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
  flex: 1;
}
.vt-card__id {
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 700;
  color: var(--brown-700);
  background: var(--white);
  border: 1px solid var(--brown-200);
  padding: 2px 8px;
  border-radius: 999px;
  letter-spacing: 0.02em;
}
.vt-card__name {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--brown-900);
  line-height: 1.35;
  word-break: break-word;
}
.vt-card__han {
  margin-left: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--brown-500);
}
.vt-card__sci {
  flex-basis: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
  margin-top: 2px;
}
.vt-card__latin {
  font-size: 12px;
  color: var(--brown-600);
  font-style: italic;
}
.vt-card__pinyin {
  font-size: 12px;
  color: var(--brown-400);
}
.vt-card__body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: var(--space-3);
}
.vt-meta-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.vt-meta { display: flex; flex-direction: column; gap: 2px; }
.vt-meta__label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gray-500);
}
.vt-meta__val {
  font-size: var(--font-size-sm);
  color: var(--gray-800);
  word-break: break-word;
  line-height: 1.4;
}
.vt-tinh-chip {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 999px;
  line-height: 1.6;
  white-space: nowrap;
}
.vt-tinh--han   { background: #dbeafe; color: #1d4ed8; }
.vt-tinh--luong { background: #e0f2fe; color: #0369a1; }
.vt-tinh--binh  { background: #f3f4f6; color: #374151; }
.vt-tinh--on    { background: #ffedd5; color: #c2410c; }
.vt-tinh--nhiet { background: #fee2e2; color: #dc2626; }
.vt-vi-chips, .vt-qk-chips { display: flex; flex-wrap: wrap; gap: 4px; }
.vt-vi-chip {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 999px;
  background: #fef9c3;
  color: #713f12;
  border: 1px solid #fde68a;
  white-space: nowrap;
}
.vt-qk-chip {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
  white-space: nowrap;
}

.bt-text-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.bt-more-toggle {
  align-self: flex-start;
  padding: 0;
  background: transparent;
  border: 0;
  color: var(--brown-700);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}
.bt-more-toggle:hover { color: var(--brown-800); }
.bt-empty { margin: 0; font-size: var(--font-size-sm); text-align: center; padding: var(--space-3) 0; }
.chip-row--wrap { gap: 6px; }
.chip-row--wrap .chip { white-space: normal; word-break: break-word; max-width: 100%; }

.loading-state { display: flex; flex-direction: column; align-items: center; padding: var(--space-12) 0; color: var(--brown-600); }
.spinner { width: 32px; height: 32px; border: 3px solid var(--gray-200); border-top-color: var(--brown-500); border-radius: 50%; animation: spin .7s linear infinite; }
.spinner--sm { width: 20px; height: 20px; border-width: 2px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Loading bar — thanh tiến trình mỏng phía trên data-card khi đang reload page. */
.data-card { position: relative; }
.data-card--loading { pointer-events: none; }
.data-card--loading .bt-grid,
.data-card--loading .vt-grid { opacity: 0.55; transition: opacity .15s; }
.loading-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  overflow: hidden;
  background: rgba(146, 64, 14, 0.08);
  z-index: 5;
}
.loading-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, transparent, var(--brown-500), transparent);
  animation: loadingBarSlide 1.1s ease-in-out infinite;
}
@keyframes loadingBarSlide {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}

/* Modal overlay loading — dùng cho modal Sửa bài thuốc khi đang fetch full data. */
.modal-body--loadable { position: relative; min-height: 80px; }
.modal-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(2px);
  z-index: 10;
  color: var(--brown-700);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

/* Loading state trong modal phân tích bài thuốc. */
.ana-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-12) var(--space-4);
  color: var(--brown-700);
  font-weight: 600;
}

.error-state { text-align: center; padding: var(--space-8); color: var(--danger); background: var(--danger-bg); border-radius: var(--radius-lg); }

/* Buttons */
.btn-primary { padding: var(--space-2) var(--space-4); background: var(--brown-600); color: var(--white); border: none; border-radius: var(--radius-md); font-weight: 600; font-size: var(--font-size-sm); cursor: pointer; transition: background var(--transition-fast); }
.btn-primary:hover:not(:disabled) { background: var(--brown-700); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { padding: var(--space-2) var(--space-4); background: var(--white); color: var(--gray-700); border: 1px solid var(--gray-300); border-radius: var(--radius-md); font-weight: 600; font-size: var(--font-size-sm); cursor: pointer; }
.btn-secondary:hover:not(:disabled) { background: var(--gray-50); }
.btn-danger { padding: var(--space-2) var(--space-4); background: var(--danger); color: var(--white); border: none; border-radius: var(--radius-md); font-weight: 600; font-size: var(--font-size-sm); cursor: pointer; }
.btn-danger:hover:not(:disabled) { background: #b91c1c; }
.btn-ai { padding: var(--space-2) var(--space-4); background: linear-gradient(135deg, var(--ai-solid), var(--ai-solid-2)); color: var(--white); border: none; border-radius: var(--radius-md); font-weight: 600; font-size: var(--font-size-sm); cursor: pointer; transition: filter var(--transition-fast); }
.btn-ai:hover:not(:disabled) { filter: brightness(1.08); }
.btn-ai:disabled { opacity: 0.6; cursor: not-allowed; }
.vt-ai-row { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; padding: var(--space-2) var(--space-3); background: var(--ai-bg); border: 1px dashed var(--ai-border); border-radius: var(--radius-md); margin-bottom: var(--space-3); }

.vt-nhom-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px var(--space-3);
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);
}
.vt-nhom-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.vt-nhom-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gray-500);
}
.vt-nhom-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.vt-nhom-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 4px 3px 10px;
  border-radius: 999px;
  background: var(--brown-50);
  color: var(--brown-800);
  border: 1px solid var(--brown-200);
  font-size: var(--font-size-xs);
  font-weight: 600;
}
.vt-nhom-chip--ai {
  background: var(--ai-bg);
  color: var(--ai-fg);
  border-color: var(--ai-border);
  box-shadow: 0 0 0 2px var(--ai-border);
}
.vt-ai-badge-mini {
  font-size: 11px;
  line-height: 1;
}
.vt-nhom-x {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  border: 0;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  color: inherit;
}
.vt-nhom-x:hover { background: rgba(0, 0, 0, 0.18); }
.vt-ai-nhom-reason {
  margin: 0;
  font-size: 12px;
  color: var(--ai-fg);
  background: var(--ai-bg);
  border-left: 3px solid var(--ai-solid);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  line-height: 1.45;
}
.vt-ai-nhom-reason strong { color: var(--ai-fg); }
.vt-ai-hint { font-size: var(--font-size-xs); color: var(--gray-600); }
.vt-km-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 6px; background: var(--gray-50); border-radius: var(--radius-md); min-height: 36px; margin-bottom: 6px; }
.vt-km-empty { color: var(--gray-400); font-size: var(--font-size-xs); padding: 4px 6px; }
.vt-km-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 4px 3px 10px; border-radius: 999px; background: var(--info-bg); color: var(--info-fg); font-size: var(--font-size-xs); font-weight: 600; }
.vt-km-x { width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: rgba(0,0,0,.08); font-size: 12px; line-height: 1; }
.vt-km-x:hover { background: rgba(0,0,0,.18); }
.vt-km-dropdown { margin-top: 4px; max-height: 200px; overflow-y: auto; border: 1px solid var(--gray-200); border-radius: var(--radius-md); background: var(--white); }
.vt-km-option { display: block; width: 100%; text-align: left; padding: 8px 12px; font-size: var(--font-size-sm); cursor: pointer; }
.vt-km-option:hover { background: var(--brown-50); }
.vt-km-abbr { color: var(--gray-500); margin-left: 6px; font-size: var(--font-size-xs); }
.vt-km-warn { margin: 8px 0 0; padding: 6px 10px; background: var(--warning-bg); color: var(--warning-fg); border-radius: var(--radius-sm); font-size: var(--font-size-xs); }
.mt-4 { margin-top: var(--space-4); }

.row-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.btn-action { padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); border: 1px solid var(--gray-200); background: var(--white); cursor: pointer; transition: all var(--transition-fast); }
.btn-edit:hover { background: var(--brown-50); border-color: var(--brown-400); color: var(--brown-700); }
.btn-delete { color: var(--danger); }
.btn-delete:hover { background: var(--danger-bg); border-color: var(--danger-border); }
.btn-mini { padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); border: 1px solid var(--brown-300); background: var(--brown-50); color: var(--brown-700); cursor: pointer; }
.btn-mini:hover { background: var(--brown-100); }
.btn-mini-danger { border-color: var(--danger-border); background: var(--danger-bg); color: var(--danger); }
.btn-mini-danger:hover { background: var(--danger-bg); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; z-index: 200; padding: var(--space-4); }
.modal { background: var(--white); border-radius: var(--radius-xl); width: 100%; max-width: 560px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15); }
.modal--wide { max-width: 880px; }
.modal--sm { max-width: 440px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--gray-100); }
.modal-header h3 { margin: 0; font-size: var(--font-size-lg); font-weight: 700; color: var(--brown-800); }
.modal-close { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--gray-500); }
.modal-close:hover { color: var(--gray-800); }
.modal-body { padding: var(--space-5); overflow-y: auto; flex: 1; }
.modal-footer { display: flex; gap: var(--space-2); justify-content: flex-end; padding: var(--space-4) var(--space-5); border-top: 1px solid var(--gray-100); background: var(--gray-50); }

.form-error { background: var(--danger-bg); color: var(--danger); border: 1px solid var(--danger-border); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); margin-bottom: var(--space-3); font-size: var(--font-size-sm); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.field { display: flex; flex-direction: column; gap: 4px; }
.field--full { grid-column: 1 / -1; }
.field > span, .field-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-700); }

.input { width: 100%; padding: var(--space-2) var(--space-3); border: 1px solid var(--gray-200); border-radius: var(--radius-md); font-size: var(--font-size-md); font-family: inherit; background: var(--white); }
.input:focus { outline: none; border-color: var(--brown-500); box-shadow: var(--focus-ring); }
.input[readonly], .input:disabled { background: var(--gray-100); color: var(--gray-600); cursor: not-allowed; }
.input--sm { padding: 6px 10px; font-size: 13px; }

.field-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); margin-bottom: 4px; }
.field-count { font-size: 11px; font-weight: 600; color: var(--brown-600); background: var(--brown-50); padding: 1px 8px; border-radius: 999px; }

.picker-search { margin-bottom: 6px; }
.chip-picker { display: flex; flex-wrap: wrap; gap: 6px; padding: var(--space-2); border: 1px solid var(--gray-200); border-radius: var(--radius-md); background: var(--gray-50); }
.chip-picker--scroll { max-height: 180px; overflow-y: auto; }
.chip-toggle { padding: 4px 10px; font-size: 13px; font-weight: 600; border-radius: 999px; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); cursor: pointer; transition: all var(--transition-fast); }
.chip-toggle:hover { border-color: var(--brown-400); color: var(--brown-700); }
.chip-toggle.active { background: var(--brown-600); color: var(--white); border-color: var(--brown-600); }

.chi-tiet-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; padding: 6px; border: 1px solid var(--gray-200); border-radius: var(--radius-md); background: var(--gray-50); }
.chi-tiet-row {
  display: grid;
  grid-template-columns: 1fr 180px 32px;
  gap: 8px;
  align-items: center;
  padding: 4px 8px;
  background: var(--white);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
}
.chi-tiet-row:hover { border-color: var(--brown-200); }
.ct-name { font-weight: 600; color: var(--brown-900); font-size: 13px; }
.ct-lieu { }
.ct-lieu-wrap { display: flex; flex-direction: column; gap: 2px; }
.ct-lieu-preview { font-size: 11px; color: var(--gray-500); padding-left: 2px; line-height: 1.2; }
.vt-lieu-preview { display: inline-block; margin-left: 6px; padding: 1px 6px; background: var(--brown-50); color: var(--brown-700); border-radius: 999px; font-size: 11px; font-weight: 600; }

/* Combobox typeahead */
.combo { position: relative; }
.combo .input { padding-right: 28px; }
.combo .has-selected { background: var(--brown-50); border-color: var(--brown-300); font-weight: 600; color: var(--brown-800); }
.combo-clear {
  position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
  width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
  background: var(--gray-100); border: none; border-radius: 50%;
  color: var(--gray-600); cursor: pointer; font-size: 12px; line-height: 1;
}
.combo-clear:hover { background: var(--gray-200); color: var(--gray-800); }
.combo-dropdown {
  position: absolute; left: 0; right: 0; top: calc(100% + 4px);
  max-height: 240px; overflow-y: auto;
  background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  z-index: 20;
  margin: 0; padding: 4px; list-style: none;
}
.combo-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px; border-radius: var(--radius-sm); cursor: pointer;
  font-size: 13px; color: var(--gray-800);
}
.combo-item:hover { background: var(--brown-50); }
.combo-item--selected { background: var(--brown-50); color: var(--brown-800); font-weight: 600; }
.combo-item-main { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.combo-item-sub { font-size: 11px; color: var(--gray-500); white-space: nowrap; }
.combo-check { color: var(--brown-600); font-weight: 700; }
.combo-empty { padding: 8px 10px; font-size: 12px; color: var(--gray-500); font-style: italic; text-align: center; }

/* Selected chips row above combobox */
.selected-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.chip-removable { display: inline-flex; align-items: center; gap: 4px; padding-right: 4px; }
.chip-x {
  display: inline-flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; border: none; background: rgba(0,0,0,0.08);
  border-radius: 50%; cursor: pointer; font-size: 12px; line-height: 1; color: inherit;
}
.chip-x:hover { background: rgba(0,0,0,0.18); }

/* Header actions */
.header-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

/* Import progress */
.import-progress-text { margin: 0 0 12px; font-size: var(--font-size-md); color: var(--gray-700); text-align: center; }
.progress-bar { width: 100%; height: 10px; background: var(--gray-200); border-radius: 999px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: linear-gradient(90deg, var(--brown-500), var(--brown-700)); transition: width 0.2s ease; }

/* Import result summary + sections */
.import-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
.summary-item { display: flex; flex-direction: column; align-items: center; padding: 10px; background: var(--gray-50); border-radius: var(--radius-md); border: 1px solid var(--gray-200); }
.summary-label { font-size: 11px; font-weight: 600; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.04em; }
.summary-value { font-size: 22px; font-weight: 700; color: var(--gray-800); margin-top: 4px; }
.summary-value-success { color: var(--success-fg); }
.summary-value-info { color: var(--info-fg); }
.summary-value-error { color: var(--danger); }

.import-section { margin-top: 16px; padding-top: 12px; border-top: 1px dashed var(--gray-200); }
.import-section-title { display: flex; align-items: center; gap: 8px; margin: 0 0 6px; font-size: var(--font-size-md); font-weight: 700; color: var(--brown-900); }
.import-section-hint { margin: 0 0 8px; font-size: 12px; color: var(--gray-500); }
.missing-list { list-style: none; padding: 0; margin: 0; max-height: 240px; overflow-y: auto; border: 1px solid var(--gray-200); border-radius: var(--radius-md); }
.missing-list li { display: flex; justify-content: space-between; gap: 12px; padding: 6px 12px; border-bottom: 1px solid var(--gray-100); font-size: 13px; }
.missing-list li:last-child { border-bottom: none; }
.missing-name { color: var(--gray-800); font-weight: 500; }
.missing-rows { color: var(--gray-500); font-size: 12px; white-space: nowrap; }
.badge-warn { background: var(--warning-bg); color: var(--warning-fg); }
.badge-error { background: var(--danger-bg); color: var(--danger); }

/* ─── Phân tích bài thuốc ─── */
.btn-analyze { background: var(--warning-bg); border-color: var(--warning-border); color: var(--warning-fg); }
.btn-analyze:hover { background: var(--warning-bg); border-color: var(--warning-fg); color: var(--warning-fg); }

.ana-overlay { padding: var(--space-2); }
.ana-modal {
  max-width: 1180px;
  width: 100%;
  max-height: 95vh;
}
.ana-body { padding: var(--space-4); background: #FAF8F3; }
.ana-tabs {
  display: flex;
  gap: 4px;
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--border, #e5e0d6);
  background: var(--surface, #fff);
}
.ana-tab {
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-500);
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
}
.ana-tab:hover { color: var(--brown-700, #6b4f2a); }
.ana-tab.active { color: var(--brown-800, #5b3a1a); border-bottom-color: var(--brown-600, #8a6d3b); }
.ana-graph-wrap { padding: 2px; }
.ana-empty {
  text-align: center;
  padding: 40px 20px;
  color: #A09580;
  font-style: italic;
}

.ana-card {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-3);
}
.ana-section-title {
  font-weight: 700;
  color: var(--brown-800);
  font-size: 14px;
  margin-bottom: 8px;
}
.ana-sub-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--gray-600);
  margin: 12px 0 6px;
}
.ana-hint {
  font-size: 11px;
  color: var(--gray-400);
  line-height: 1.4;
}
.ana-muted { color: var(--gray-400); font-size: 13px; font-style: italic; }

/* Tứ khí strip */
.tukhi-strip {
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--white);
}
.tukhi-row { display: flex; }
.tukhi-arrow {
  flex: 1;
  min-height: 24px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 2px;
}
.tukhi-arrow-mark { font-size: 14px; line-height: 1; color: #111; }
.tukhi-bar { flex: 1; height: 26px; }
.tukhi-labels { background: #FAFAF8; }
.tukhi-label {
  flex: 1;
  border-top: 1px solid var(--gray-200);
  padding: 6px 2px;
  text-align: center;
  font-size: 11px;
  line-height: 1.25;
}
.tukhi-label-vn { font-weight: 600; color: var(--brown-800); }
.tukhi-label-zh { color: var(--gray-500); font-size: 10px; }

/* Layout 2 cột */
.ana-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 36%);
  gap: var(--space-3);
  align-items: start;
}
.ana-left { display: flex; flex-direction: column; min-width: 0; }
.ana-right { min-width: 0; }
@media (max-width: 900px) {
  .ana-layout { grid-template-columns: 1fr; }
}

/* Radar card */
.ana-radar-card {
  display: grid;
  grid-template-columns: minmax(120px, 22%) minmax(0, 1fr);
  gap: var(--space-3);
  align-items: center;
}
.ana-radar-side { min-width: 0; }
.ana-radar-canvas-wrap {
  position: relative;
  height: 200px;
  min-height: 160px;
  width: 100%;
}
.ana-radar-canvas-wrap canvas { display: block; width: 100% !important; height: 100% !important; }

/* Dosage table */
.ana-dosage {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  position: sticky;
  top: 0;
}
.ana-dosage-head {
  font-weight: 700;
  color: var(--brown-800);
  font-size: 14px;
  display: flex;
  align-items: baseline;
  gap: 4px 12px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}
.ana-dosage-total { font-weight: 400; font-size: 12px; color: var(--gray-400); }
.ana-reset-btn {
  margin-left: auto;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  border: 1px solid var(--brown-300);
  background: var(--brown-50);
  color: var(--brown-700);
  cursor: pointer;
}
.ana-reset-btn:hover { background: var(--brown-100); }
.ana-dosage-hint { margin-bottom: 8px; }

.ana-dosage-tbl-wrap { overflow-x: auto; }
.ana-dosage-tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
.ana-dosage-tbl thead tr {
  background: var(--gray-50);
  border-bottom: 2px solid var(--gray-200);
}
.ana-dosage-tbl th {
  padding: 6px 6px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  color: var(--gray-500);
  text-transform: uppercase;
}
.ana-dosage-tbl th:nth-child(2),
.ana-dosage-tbl th:nth-child(3),
.ana-dosage-tbl th:nth-child(4) { text-align: center; }
.ana-dosage-tbl td { padding: 5px 6px; border-bottom: 1px solid var(--gray-100); vertical-align: middle; }
.ana-vt-name { font-weight: 600; color: var(--brown-900); }
.ana-vt-gram { text-align: center; }
.ana-vt-gram input {
  width: 72px;
  text-align: center;
  padding: 5px 6px;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-sm);
  font-size: 12px;
  background: #FFFCF7;
  color: var(--gray-800);
}
.ana-vt-gram input:focus {
  outline: none;
  border-color: var(--brown-500);
  box-shadow: var(--focus-ring);
}
.ana-vt-pct { text-align: center; color: var(--gray-600); }
.ana-vt-role { text-align: center; }
.ana-role-chip {
  display: inline-block;
  color: var(--white);
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 700;
}
/* Nhập khác Suy luận → viền đứt, nền nhạt, chữ đậm để cảnh báo lệch */
.ana-role-chip--outline {
  background: transparent !important;
  color: var(--gray-700);
  border: 1.5px dashed currentColor;
  padding: 1px 9px;
}
.ana-role-empty { color: var(--gray-400); font-style: italic; font-size: 12px; }
.ana-vt-qk { font-size: 11px; color: var(--gray-500); }

/* Chip phân tích */
.ana-chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
.ana-chip {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
}
.ana-chip-phap { border-color: #7A9B8E; background: #E8F2EE; color: #2D4A3E; }
.ana-chip-cong { border-color: #D4C5A0; background: #F5F0E8; color: #5B3A1A; }
.ana-chip-kk { border-color: #E8A598; background: #FDF5F3; color: #7A2E23; }
.ana-chip-tacdung { border-color: #C49A6C; background: #FAEBD8; color: #5B3A1A; }
.ana-chip-tayy { border-color: var(--chip-brand-border); background: var(--chip-brand-bg); color: var(--chip-brand-fg); }
.ana-sub-hint { font-weight: 400; color: var(--gray-400); font-size: 10px; }

/* 6) Luận giải & cảnh báo phối ngũ */
.ana-luangiai {
  margin: 4px 0 8px;
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--brown-900, #4a2f1a);
  background: #F7F3EC;
  border-left: 3px solid var(--brown-500, #8a6d3b);
  border-radius: 6px;
}
.ana-camky-list { display: flex; flex-direction: column; gap: 6px; }
.ana-camky {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  border: 1px solid #E8A598;
  background: #FDF5F3;
}
.ana-camky.is-phan { border-color: #DC2626; background: #FEF2F2; }
.ana-camky.is-uy { border-color: #D97706; background: #FFF7ED; }
.ana-camky-badge { font-weight: 700; font-size: 11px; white-space: nowrap; }
.ana-camky.is-phan .ana-camky-badge { color: #B91C1C; }
.ana-camky.is-uy .ana-camky-badge { color: #B45309; }
.ana-camky-pair { font-weight: 600; color: var(--brown-900, #4a2f1a); }
.ana-camky-note { color: var(--gray-500); font-size: 11px; }
.ana-nhandinh {
  margin: 0 0 8px;
  padding-left: 18px;
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--brown-800, #5b3a1a);
}
.ana-nhandinh li { margin: 2px 0; }

/* ─── Responsive: tiêu đề trang, nút chuyển tab, thanh công cụ ─── */
@media (max-width: 900px) {
  /* Xếp dọc: tiêu đề ở trên, dải nút Bài/Vị/Dược Lý xuống dưới và trải hết hàng */
  .page-header { flex-direction: column; align-items: stretch; gap: var(--space-3); }
  .view-toggle { align-self: stretch; }
  .toggle-btn { flex: 1 1 0; justify-content: center; }
  /* Thanh tiêu đề thẻ: cho phép xuống dòng để nút thao tác không bị bóp */
  .card-header { flex-wrap: wrap; }
  .card-header-left { flex: 1 1 100%; }
  .header-actions { flex: 1 1 100%; justify-content: flex-start; }
  .search-wrap { min-width: 0; max-width: none; flex: 1 1 100%; }
}
@media (max-width: 560px) {
  .page-subtitle { font-size: var(--font-size-sm); }
  .toggle-btn { gap: 4px; padding: var(--space-2); font-size: var(--font-size-xs); }
  .toggle-btn svg { width: 16px; height: 16px; }
  /* 3 nhóm Đông Y / Tây Y / Tất Cả: luôn gọn 1 hàng, chia đều bề ngang */
  .sub-tabs { flex-wrap: nowrap; }
  .sub-tab { flex: 1 1 0; justify-content: center; padding: var(--space-2); white-space: nowrap; }
  .vt-grid { padding: var(--space-3); }
  .card-header { padding: var(--space-3) var(--space-4); }
  .header-actions { gap: 6px; }
  .header-actions .btn-secondary,
  .header-actions .btn-primary {
    flex: 1 1 auto;
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-xs);
    text-align: center;
  }
  .pagination { flex-wrap: wrap; gap: 6px; padding: var(--space-3); }
  .page-info { margin-left: 0; flex: 1 1 100%; text-align: center; }
}
</style>
