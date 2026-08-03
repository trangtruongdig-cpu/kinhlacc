<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch, reactive, nextTick, defineAsyncComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePatientStore, type Patient } from '@/stores/patient'
import { api } from '@/services/api'
import BatCuongFigure3D, { MER3D } from '@/components/BatCuongFigure3D.vue'
import BatCuongOrgans from '@/components/BatCuongOrgans.vue'
import BatCuongSummary from '@/components/BatCuongSummary.vue'
import { ORGAN_ART } from '@/lib/organArt'
import { computeTongCuong, type TongCuong } from '@/lib/meridianAnalysis'
import { buildDinhVi, parseAmDuong, type PhapTriByBaiThuoc } from '@/lib/dinhVi'
import BienChungWheel from '@/components/BienChungWheel.vue'
import VongLucKinh from '@/components/VongLucKinh.vue'
import VongLucKhi from '@/components/VongLucKhi.vue'
import VongNguHanh from '@/components/VongNguHanh.vue'
import PhuongHuyetNguDu from '@/components/PhuongHuyetNguDu.vue'
import { locateLucKinh, huongTruyen, KINH_META, type KinhSlug, type LucKinhVerdict, type TheKinhMap } from '@/lib/lucKinh'
import { truyenBienCua } from '@/lib/lucKinhTruyenBien'
import { mocKham, mocKhamMs, ngayKhamVN } from '@/lib/caKham'
import AmDuongTaiji from '@/components/AmDuongTaiji.vue'

const router = useRouter()
const route = useRoute()

const patientId = computed(() => Number(route.params.patientId))
const examId = computed(() => Number(route.params.examId))
const patient = ref<Patient | null>(null)
const examination = ref<any>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
// Tham chiếu component đồ hình 3D → gọi captureViews() chụp 4 góc đưa vào phiếu in.
const batCuongFigureRef = ref<InstanceType<typeof BatCuongFigure3D> | null>(null)
const layoutMode = ref<'dashboard' | 'scroll'>('dashboard')

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
  // Tính–Vị–Quy Kinh: có sẵn trong /bai-thuoc/lite (cột thẳng trên ViThuoc) → dùng để phân tích thang.
  tinh?: string | null
  vi?: string | null
  quy_kinh?: string | null
}
interface BaiThuocChiTietLite {
  id: number
  // Backend (TypeORM BaiThuocChiTiet.idViThuoc) serializes camelCase — KHÔNG phải id_vi_thuoc.
  idViThuoc: number | null
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
  benh?: { chung_trang?: string | null } | null
  phuong_phap_tac_dong: string | null
  ghi_chu_ky_thuat: string | null
  y_nghia_huyet?: string | null
  huyetVi: {
    idHuyet: number
    ten_huyet: string | null
    ma_huyet: string | null
    vi_tri_giai_phau?: string | null
    tac_dung?: string | null
    kinhMach?: { ten_kinh_mach: string | null; ten_viet_tat: string | null } | null
    id_tu_dien?: number | null
  } | null
}

// Quan hệ "thể kép → thể đơn cấu thành" (bảng benh_cau_thanh) — data-driven, thay bảng alias
// gán cứng cho việc gộp phương huyệt của thể lưỡng hư. Mỗi bản ghi kèm tên chứng để khớp theo tên.
interface CauThanhApiRow {
  id: number
  compound_id: number
  component_id: number
  ghi_chu?: string | null
  compound: { id: number; tieuket: string | null; chung_trang: string | null } | null
  component: { id: number; tieuket: string | null; chung_trang: string | null } | null
}

const benhDetailsMap = ref<Map<number, BenhDetail>>(new Map())
const phacDoAllList = ref<PhacDoApiRow[]>([])
const cauThanhList = ref<CauThanhApiRow[]>([])
const baiThuocFullMap = ref<Map<number, BaiThuocFull>>(new Map())
const baiThuocLoading = ref(false) // bài thuốc nạp nền (không chặn render View 1)
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
  return ct.viThuoc?.ten_vi_thuoc?.trim() || (ct.idViThuoc != null ? `#${ct.idViThuoc}` : '—')
}

const matchedBenhIds = computed<number[]>(() => {
  const all = Array.from(
    new Set((excelSyndromesList.value as Array<{ id: number }>).map((s) => s.id)),
  )
  const focus = excelFocusRuleId.value
  if (focus != null && all.includes(focus)) return [focus]
  return all
})

// Khớp phương huyệt theo TÊN thể, không theo id: thể ĐO (benh_dong_y_excel) và bảng
// phac_do_dieu_tri (keyed theo benh_dong_y) khác không gian id (chỉ trùng 10/47) → tra
// theo id sẽ lấy nhầm huyệt thể khác. Dùng tên (đã chuẩn hoá) là chính xác.
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
// Gộp thể kép (data-driven, bảng benh_cau_thanh): tên thể kép (chuẩn hoá) → danh sách tên các thể
// ĐƠN cấu thành (chuẩn hoá). Khi khớp phương huyệt cho 1 thể kép sẽ kéo thêm huyệt của các thể đơn
// này (+ huyệt riêng của thể kép, vốn đã khớp theo tên chính nó) rồi khử trùng theo huyệt.
const phCompositionMap = computed<Map<string, string[]>>(() => {
  const m = new Map<string, string[]>()
  const namesOf = (b: { tieuket: string | null; chung_trang: string | null } | null): string[] =>
    b ? [b.chung_trang, b.tieuket].map(phNormName).filter(Boolean) : []
  for (const r of cauThanhList.value) {
    const componentNames = namesOf(r.component)
    if (!componentNames.length) continue
    for (const key of namesOf(r.compound)) {
      const arr = m.get(key) ?? []
      for (const cn of componentNames) if (!arr.includes(cn)) arr.push(cn)
      m.set(key, arr)
    }
  }
  return m
})

// Ánh xạ tên thể ĐO → tên thể trong thư viện (benh_dong_y) khi khác chữ nhưng cùng phác đồ
// huyệt (9 cặp bác sĩ đã duyệt) — để Section IV lấy đúng phương huyệt.
const PH_THE_ALIAS: Record<string, string> = (() => {
  const pairs: [string, string][] = [
    ['Thận âm dương lưỡng hư', 'Thận Âm Hư, Thận Dương Hư'],
    ['Tâm Dương Hư Suy', 'Tâm Dương Hư'],
    ['Tỳ vị khí hư', 'Tỳ Khí Hư'],
    ['Tỳ vị thấp khốn', 'Tỳ Thấp Khốn'],
    ['Đởm nhiệt', 'Đởm Thấp Nhiệt'],
    ['Can Đởm Hỏa Vượng, Thấp Nhiệt', 'Đởm Thấp Nhiệt'],
    ['Đàm hoả nội nhiễu', 'Đàm Hỏa Nhiễu Tâm'],
    ['Tâm tỳ lưỡng hư', 'Tâm Khí Hư, Tỳ Khí Hư'],
    ['Đàm trọc trở phế', 'Đàm Thấp Trở Phế'],
    ['Phế tỳ lưỡng hư', 'Phế Tỳ Khí Hư'],
  ]
  const m: Record<string, string> = {}
  for (const [a, b] of pairs) m[phNormName(a)] = phNormName(b)
  return m
})()
// Tên chuẩn hoá để khớp phương huyệt cho 1 thể đo: chính nó + alias (nếu có) + các thể đơn cấu
// thành nếu đây là thể kép (bảng benh_cau_thanh). Nhờ vậy phương huyệt thể kép = ⋃ huyệt các thể
// đơn + huyệt riêng của thể kép (matchedPhuongHuyetList khử trùng theo idHuyet).
function phNamesOf(name: string): string[] {
  const out = new Set<string>()
  const base = phNormName(name)
  const seed: string[] = [base]
  const alias = PH_THE_ALIAS[base]
  if (alias) seed.push(alias)
  for (const s of seed) {
    if (!s) continue
    out.add(s)
    const comps = phCompositionMap.value.get(s)
    if (comps) for (const c of comps) out.add(c)
  }
  return [...out]
}
// Tên các thể ĐO đang xét (tôn trọng excelFocusRuleId nếu bác sĩ bấm chọn 1 thể).
const measuredThemeNames = computed<Set<string>>(() => {
  const list = excelSyndromesList.value as Array<{ id: number; name: string }>
  const focus = excelFocusRuleId.value
  const src = focus != null && list.some((s) => s.id === focus) ? list.filter((s) => s.id === focus) : list
  const out = new Set<string>()
  for (const s of src) for (const n of phNamesOf(s.name)) if (n) out.add(n)
  return out
})
const matchedPhuongHuyetList = computed(() => {
  const names = measuredThemeNames.value
  if (!names.size) return [] as PhacDoApiRow[]
  const seenHuyet = new Set<number>()
  const out: PhacDoApiRow[] = []
  for (const row of phacDoAllList.value) {
    const bn = phNormName(row.benh?.chung_trang)
    if (!bn || !names.has(bn)) continue
    if (seenHuyet.has(row.idHuyet)) continue
    seenHuyet.add(row.idHuyet)
    out.push(row)
  }
  return out
})

// Thể đo nào CHƯA có phương huyệt (không có phác đồ nào TRÙNG TÊN) — nhắc bác sĩ nhập.
const phuongHuyetNames = computed(
  () => new Set(phacDoAllList.value.map((r) => phNormName(r.benh?.chung_trang)).filter(Boolean)),
)
const theDoThieuPhuongHuyet = computed(() =>
  (excelSyndromesList.value as Array<{ id: number; name: string }>).filter(
    (s) => !phNamesOf(s.name).some((n) => phuongHuyetNames.value.has(n)),
  ),
)

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

// ── TAB 3 "Biện chứng – Pháp trị": ĐỊNH VỊ bệnh nhân.
// Thể bệnh (đã chốt) → bài thuốc (link ĐÚNG) → pháp trị chứa bài đó → tag luc_kinh → phân trục.
// Không trọng số: thể bệnh đo ra là xác định; chỉ union tag, trục nào không có để trống.
const dinhViRows = ref<PhapTriByBaiThuoc[]>([])
const dinhViLoading = ref(false)
async function loadDinhVi() {
  const ids = matchedBaiThuocList.value.map((b) => b.id)
  if (!ids.length) {
    dinhViRows.value = []
    return
  }
  dinhViLoading.value = true
  try {
    dinhViRows.value = await api.get<PhapTriByBaiThuoc[]>(
      `/phap-tri/by-bai-thuoc?baiThuocIds=${ids.join(',')}`,
    )
  } catch {
    dinhViRows.value = []
  } finally {
    dinhViLoading.value = false
  }
}
// (watch kích hoạt loadDinhVi ĐẶT Ở CUỐI setup — xem chú thích ở đó — vì source đọc
//  matchedBaiThuocList → matchedBenhIds → excelFocusRuleId (khai báo phía dưới) → TDZ nếu đăng ký ở đây.)
const dinhVi = computed(() => buildDinhVi(dinhViRows.value))
// ③ Tính chất (bát cương · chính khí) tách riêng để đặt NGANG HÀNG với đồ hình Thái Cực
// (AmDuongTaiji) — cùng gốc chính khí/Hư-Thực nên xem cạnh nhau dễ đối chiếu hơn là để tuốt
// xuống dưới đồ hình 5 vòng, phải cuộn mới thấy. ①②  Định vị/Tác nhân vẫn giữ nguyên vị trí cũ.
const tinhChatAxis = computed(() => dinhVi.value.axes.find((ax) => ax.key === 'tinh-chat') ?? null)
const otherAxes = computed(() => dinhVi.value.axes.filter((ax) => ax.key !== 'tinh-chat'))
// Chiếu định vị vào không gian đồ hình: {kinh, khi, tang, amDuong} cho DinhViWheel tô sáng.
const dinhViWheel = computed(() => {
  const tagsOf = (nhom: string): string[] => {
    for (const ax of dinhVi.value.axes) for (const sg of ax.subgroups) if (sg.nhom === nhom) return sg.tags.map((t) => t.label)
    return []
  }
  // Gộp kinh sáng = tag engine ∪ {kinh trội + kinh phụ của KẾT LUẬN} để kinh trội chắc chắn không bị mờ.
  const v = lucKinhVerdict.value
  const kinhSet = new Set(tagsOf('gd-luc-kinh'))
  if (v) { kinhSet.add(v.kinh.ten); if (v.phu) kinhSet.add(v.phu.ten) }
  return {
    kinh: [...kinhSet], // nhãn đã rút gọn: 'Thái Dương'…
    khi: tagsOf('tn-luc-khi'), // 'Hàn','Nhiệt','Thấp'…
    tang: dinhVi.value.tangPhu.map((t) => t.label),
    amDuong: parseAmDuong(tongCuong.value.amDuong),
    amLoai: tongCuong.value.loai, // để wheel vẽ vành khăn DƯ/KHUYẾT ở tâm Thái Cực (lớp 1)
    troi: v ? v.kinh.ten : null, // kinh TRỘI (kết luận) → wheel tô nổi bật hơn hẳn
  }
})
// Bóc lớp đồ hình (như Biện Chứng Luận Trị): 1 Âm Dương … 5 Lục Kinh. Mặc định lớp 1 (Âm Dương)
// — vào tab là thấy Thái Cực DƯ/KHUYẾT ngay, không phải bấm mới thấy.
const dinhViLop = ref<1 | 2 | 3 | 4 | 5>(1)
// BỎ Ngũ Hành (lớp 2) khỏi thanh bóc lớp — chỉ giữ Âm Dương · Tạng Phủ · Lục Khí · Lục Kinh.
// (lớp 3 vẫn cộng dồn vòng Ngũ Hành ở nền, nhưng không còn là bước "định vị" riêng.)
const DINH_VI_LOP: ReadonlyArray<{ n: 1 | 2 | 3 | 4 | 5; ten: string; han: string }> = [
  { n: 1, ten: 'Âm Dương', han: '太極' },
  { n: 3, ten: 'Tạng Phủ', han: '臟腑' },
  { n: 4, ten: 'Lục Khí', han: '六氣' },
  { n: 5, ten: 'Lục Kinh', han: '六經' },
]

// Chip Lục Kinh đang được SOI (bấm chip → tô sáng đúng kinh đó trên đồ hình). Bấm lại = bỏ chọn
// (đồ hình quay về nổi kinh trội mặc định). Bấm bất kỳ chip nào cũng nhảy sang lớp 5 (Lục Kinh).
const focusKinh = ref<KinhSlug | null>(null)
function soiKinh(slug: KinhSlug) {
  focusKinh.value = focusKinh.value === slug ? null : slug
  if (focusKinh.value) dinhViLop.value = 5
}

// ── V. THANG ĐẶC TRỊ: gộp vị thuốc từ MỌI bài của các thể khớp, bỏ trùng theo vị,
//    đếm SỐ BÀI chứa vị rồi xếp giảm dần (thông dụng → đặc trị). Thầy thuốc tích/bỏ
//    vị + chỉnh liều → lưu thành đơn riêng của ca khám (như phương huyệt).
interface TongHopViItem {
  key: string
  id_vi_thuoc: number | null
  ten: string
  so_bai: number
  tu_bai: string[]
  vai_tro: string | null
  lieu_goi_y: string | null
  viThuoc: ViThuocLite | null // giữ tính–vị–quy-kinh để phân tích thang
}
const tongHopViThuoc = computed<TongHopViItem[]>(() => {
  const map = new Map<string, TongHopViItem>()
  for (const bt of matchedBaiThuocList.value) {
    const seenInBai = new Set<string>() // 1 vị trùng trong CÙNG 1 bài chỉ tính 1 lần
    for (const ct of baiThuocChiTietOf(bt.id)) {
      const ten = viThuocLabel(ct)
      const key = ct.idViThuoc != null ? 'id:' + ct.idViThuoc : 'ten:' + ten.toLowerCase()
      if (seenInBai.has(key)) continue
      seenInBai.add(key)
      let it = map.get(key)
      if (!it) {
        it = { key, id_vi_thuoc: ct.idViThuoc, ten, so_bai: 0, tu_bai: [], vai_tro: ct.vai_tro || null, lieu_goi_y: ct.lieu_luong || null, viThuoc: ct.viThuoc ?? null }
        map.set(key, it)
      }
      it.so_bai++
      if (!it.tu_bai.includes(bt.ten_bai_thuoc)) it.tu_bai.push(bt.ten_bai_thuoc)
      if (!it.lieu_goi_y && ct.lieu_luong) it.lieu_goi_y = ct.lieu_luong
      if (!it.vai_tro && ct.vai_tro) it.vai_tro = ct.vai_tro
    }
  }
  return [...map.values()].sort((a, b) => b.so_bai - a.so_bai || a.ten.localeCompare(b.ten, 'vi'))
})

// Trạng thái đơn thuốc tùy chỉnh
const dtChon = ref<Set<string>>(new Set()) // vị đưa vào đơn (mặc định TÍCH HẾT)
const dtLieu = ref<Record<string, string>>({}) // liều đã chỉnh (theo key)
const dtGhiChu = ref('')
const dtSaving = ref(false)
const dtSavedMsg = ref('')
const dtInited = ref(false)
const showBaiThuocNguon = ref(false)

const dtChonCount = computed(() => tongHopViThuoc.value.filter((it) => dtChon.value.has(it.key)).length)

function toggleDtChon(key: string) {
  const s = new Set(dtChon.value)
  if (s.has(key)) s.delete(key)
  else s.add(key)
  dtChon.value = s
}
function setDtLieu(key: string, e: Event) {
  dtLieu.value = { ...dtLieu.value, [key]: (e.target as HTMLInputElement).value }
}
function dtLieuOf(it: TongHopViItem): string {
  return dtLieu.value[it.key] ?? it.lieu_goi_y ?? ''
}

// Phân tích thang: dựng "bài thuốc ảo" từ các vị ĐÃ CHỌN (kèm liều đang chỉnh) → đưa vào
// BaiThuocAnalysis (radar Tứ Khí · Ngũ Vị · Quy Kinh · Quân-Thần-Tá-Sứ). Chart.js nặng → nạp động.
const BaiThuocAnalysis = defineAsyncComponent(() => import('@/components/BaiThuocAnalysis.vue'))
const showPhanTich = ref(false) // modal phân tích toàn màn hình
function onPhanTichEsc(e: KeyboardEvent) {
  if (e.key === 'Escape' && showPhanTich.value) showPhanTich.value = false
}
onMounted(() => window.addEventListener('keydown', onPhanTichEsc))
onBeforeUnmount(() => window.removeEventListener('keydown', onPhanTichEsc))
const phanTichThang = computed(() => ({
  id: -1,
  ten_bai_thuoc: 'Thang Đặc Trị',
  chiTietViThuoc: tongHopViThuoc.value
    .filter((it) => dtChon.value.has(it.key))
    .map((it) => ({
      id_vi_thuoc: it.id_vi_thuoc ?? undefined,
      lieu_luong: dtLieuOf(it) || null,
      vai_tro: it.vai_tro,
      quy_kinh: it.viThuoc?.quy_kinh ?? null,
      viThuoc: {
        id: it.viThuoc?.id ?? it.id_vi_thuoc ?? 0,
        ten_vi_thuoc: it.viThuoc?.ten_vi_thuoc || it.ten,
        tinh: it.viThuoc?.tinh ?? null,
        vi: it.viThuoc?.vi ?? null,
        quy_kinh: it.viThuoc?.quy_kinh ?? null,
      },
    })),
}))

// LƯU Ý: watch khởi tạo đơn thuốc được đăng ký ở CUỐI <script setup> (tìm "watch(tongHopViThuoc").
// Lý do: watch đọc source `tongHopViThuoc` MỘT LẦN lúc đăng ký → chuỗi matchedBenhIds tham chiếu
// `excelFocusRuleId` (khai báo phía dưới) → nếu đăng ký ở đây sẽ lỗi TDZ (trắng trang).

async function saveDonThuoc() {
  const payload = {
    items: tongHopViThuoc.value.map((it) => ({
      id_vi_thuoc: it.id_vi_thuoc,
      ten: it.ten,
      lieu_luong: dtLieuOf(it).trim() || null,
      vai_tro: it.vai_tro,
      so_bai: it.so_bai,
      tu_bai: it.tu_bai,
      chon: dtChon.value.has(it.key),
    })),
    ghi_chu: dtGhiChu.value.trim() || undefined,
    luu_luc: new Date().toISOString(),
  }
  dtSaving.value = true
  dtSavedMsg.value = ''
  try {
    await api.put(`/examinations/${examId.value}/don-thuoc`, { donThuoc: payload })
    if (examination.value) examination.value.donThuoc = payload
    dtSavedMsg.value = 'Đã lưu đơn vào bệnh án.'
  } catch (e: unknown) {
    dtSavedMsg.value = 'Lỗi lưu: ' + (e instanceof Error ? e.message : String(e))
  } finally {
    dtSaving.value = false
  }
}


function phapTriHref(id: number): string {
  return router.resolve({ name: 'treatments', query: { ptId: id } }).href
}
function baiThuocHref(id: number): string {
  return router.resolve({ name: 'medicines', query: { tab: 'bai-thuoc', btId: id } }).href
}
function benhTayYHref(id: number): string {
  return router.resolve({
    name: 'western-medicine',
    query: { tab: 'benh-tay-y', btyId: id },
  }).href
}

// ===== Bảng phân biệt thể bệnh (đối chiếu triệu chứng giữa các thể ứng viên) =====
type PbAnswer = 'co' | 'khong' | 'kho'
interface PbComponent { label: string; phapTriIds: number[]; symptomIds: Set<number> }
interface PbCandidate { key: string; label: string; percentDo: number; phapTriIds: number[]; symptomIds: Set<number>; enabled: boolean; isKep?: boolean; unsynced?: boolean; components?: PbComponent[] }
interface PbSymptom { id: number; ten: string; weight: number; nhom: string | null }
interface PbNguyenNhan { nhom: string | null; noi_dung: string }
interface KepPick { id: number; label: string; tc?: number }

// Nhóm ngữ nghĩa triệu chứng (đồng bộ Pha 2 / SymptomsView).
const PB_NHOM_TC: Record<string, string> = {
  'tinh-than': 'Tinh thần / Cảm xúc',
  'tieu-hoa': 'Tiêu hóa / Ăn ngủ',
  'than-kinh-co-the': 'Thần kinh / Cơ thể',
  'phu-khoa': 'Phụ khoa',
  'luoi-mach': 'Lưỡi / Mạch',
  'toan-trang': 'Toàn trạng',
  khac: 'Khác',
}
const PB_NHOM_TC_ORDER = ['tinh-than', 'tieu-hoa', 'than-kinh-co-the', 'phu-khoa', 'luoi-mach', 'toan-trang', 'khac']
// Nhóm nguyên nhân (đồng bộ Pha 3 / TreatmentsView).
const PB_NHOM_NN: Record<string, string> = {
  'tinh-than': 'Yếu tố tinh thần',
  'sinh-hoat': 'Chế độ sinh hoạt',
  'tang-phu': 'Ảnh hưởng tạng phủ khác',
}
const PB_NHOM_NN_ORDER = ['tinh-than', 'sinh-hoat', 'tang-phu']

const showPhanBietModal = ref(false)
const phanBietLoading = ref(false)
const phanBietError = ref<string | null>(null)
const phanBietSymptoms = ref<PbSymptom[]>([])
const phanBietByPhapTri = ref<Record<number, number[]>>({})
const phanBietMeta = ref<Record<number, { nguyen_nhan: string | null; mach_chan: string | null; chat_luoi: string | null }>>({})
const phanBietNguyenNhan = ref<Record<number, PbNguyenNhan[]>>({})
const phanBietCandidates = ref<PbCandidate[]>([])
const phanBietAnswers = reactive<Record<number, PbAnswer>>({})
// Pha 5 — ghép thể kép
const kepSearch = ref('')
const kepResults = ref<KepPick[]>([])
const kepPicks = ref<KepPick[]>([])
const kepSearching = ref(false)
const kepError = ref<string | null>(null)
let kepTimer: ReturnType<typeof setTimeout> | null = null
// D5 — lưu chẩn đoán vào bệnh án (cho phép chốt NHIỀU thể bệnh)
const chanDoanKetLuanKeys = ref<string[]>([])
const chanDoanNote = ref('')
const chanDoanSaving = ref(false)
const chanDoanSavedMsg = ref('')
const savedChanDoan = computed<{ ket_luan: string; luu_luc: string } | null>(
  () => (examination.value && examination.value.chanDoan) || null,
)

// Top 3 thể ứng viên (Đông Y) làm tâm để phân biệt.
// D4: Hỏi & Chẩn đoán chạy TỪ thể đo (Section III). Ứng viên = các thể bệnh đo được;
// triệu chứng + nguyên nhân lấy qua bridge (đồng bộ D2) → pháp trị. Thể kép nối ≥2
// pháp trị → components để tính điểm min.
interface TheDoPhanBietCandidate {
  theDoId: number
  name: string
  is_kep: boolean
  phapTriIds: number[]
  symptomIds: number[]
  components: { phapTriId: number; label: string; symptomIds: number[] }[]
}
async function openPhanBiet() {
  const theDos = excelSyndromesList.value as Array<{ id: number; name: string }>
  if (!theDos.length) return
  showPhanBietModal.value = true
  phanBietLoading.value = true
  phanBietError.value = null
  phanBietSymptoms.value = []
  phanBietNguyenNhan.value = {}
  kepSearch.value = ''
  kepResults.value = []
  kepPicks.value = []
  kepError.value = null
  // Prefill từ chẩn đoán đã lưu (nếu mở lại).
  const prev = examination.value?.chanDoan
  chanDoanKetLuanKeys.value = Array.isArray(prev?.ket_luan_items)
    ? prev.ket_luan_items.map((i: { key: string }) => i.key)
    : prev?.ket_luan_key
      ? [prev.ket_luan_key]
      : []
  chanDoanNote.value = prev?.ghi_chu ?? ''
  chanDoanSavedMsg.value = ''
  Object.keys(phanBietAnswers).forEach((k) => delete phanBietAnswers[Number(k)])
  if (Array.isArray(prev?.trieu_chung)) {
    for (const t of prev.trieu_chung) if (t && t.id != null) phanBietAnswers[t.id] = t.tra_loi
  }

  const ids = [...new Set(theDos.map((t) => t.id))]
  try {
    const res = await api.get<{
      symptoms: PbSymptom[]
      phapTriMeta: Record<string, { nguyen_nhan: string | null; mach_chan: string | null; chat_luoi: string | null }>
      phapTriNguyenNhan: Record<string, PbNguyenNhan[]>
      candidates: TheDoPhanBietCandidate[]
    }>(`/benh-dong-y-excel/phan-biet?ids=${ids.join(',')}`)
    phanBietSymptoms.value = res.symptoms ?? []
    phanBietMeta.value = res.phapTriMeta ?? {}
    phanBietNguyenNhan.value = res.phapTriNguyenNhan ?? {}
    phanBietByPhapTri.value = {}
    phanBietCandidates.value = (res.candidates ?? []).map((c) => ({
      key: 'tdo:' + c.theDoId,
      label: c.name,
      percentDo: 0,
      phapTriIds: c.phapTriIds,
      symptomIds: new Set<number>(c.symptomIds),
      enabled: true,
      isKep: c.is_kep,
      unsynced: c.phapTriIds.length === 0,
      // Điểm min chỉ áp cho THỂ KÉP nối ≥2 pháp trị thành phần. Thể đơn dù nối nhiều
      // pháp trị (điều trị thay thế) vẫn tính gộp 1 tập, không min.
      components:
        c.is_kep && c.components.length > 1
          ? c.components.map((comp) => ({
              label: comp.label,
              phapTriIds: [comp.phapTriId],
              symptomIds: new Set<number>(comp.symptomIds),
            }))
          : undefined,
    }))
  } catch (e: unknown) {
    phanBietError.value = e instanceof Error ? e.message : String(e)
  } finally {
    phanBietLoading.value = false
  }
}
function closePhanBiet() { showPhanBietModal.value = false }
function togglePbCandidate(key: string) {
  const c = phanBietCandidates.value.find((x) => x.key === key)
  if (c && !(c.enabled && phanBietCandidates.value.filter((x) => x.enabled).length <= 1)) c.enabled = !c.enabled
}
function pbCandIndex(key: string): number { return phanBietCandidates.value.findIndex((c) => c.key === key) }

const pbActiveCandidates = computed(() => phanBietCandidates.value.filter((c) => c.enabled))
// Trạng thái dữ liệu các thể đo: bao nhiêu thể thực sự có triệu chứng để hỏi.
const pbDataStatus = computed(() => {
  const all = phanBietCandidates.value
  return {
    total: all.length,
    withData: all.filter((c) => c.symptomIds.size > 0).length,
    unsynced: all.filter((c) => c.phapTriIds.length === 0).length,
    syncedEmpty: all.filter((c) => c.phapTriIds.length > 0 && c.symptomIds.size === 0).length,
  }
})
interface PbRow extends PbSymptom { ids: number[]; supports: string[] }

// Chuẩn hoá tên triệu chứng để gộp trùng nghĩa: bỏ dấu, bỏ từ đệm (hay/dễ/thường…), tách token.
const SYM_FILLER = new Set(['hay', 'de', 'thuong', 'hoi', 'bi', 'rat', 'co', 'cac', 'va', 'hoac', 'cam', 'giac'])
function symTokens(s: string): string[] {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !SYM_FILLER.has(w))
}

const pbRows = computed<PbRow[]>(() => {
  const active = pbActiveCandidates.value
  const base = phanBietSymptoms.value
    .map((s) => ({ ...s, ids: [s.id], supports: active.filter((c) => c.symptomIds.has(s.id)).map((c) => c.key) }))
    .filter((r) => r.supports.length > 0)
  // Gộp trùng nghĩa: ưu tiên tên NGẮN làm đại diện; gộp khi token TRÙNG HOÀN TOÀN
  // hoặc TẬP CON (cả hai ≥2 token, tránh gộp nhầm "Đau" nuốt "Đau Bụng"/"Đau Đầu").
  base.sort((a, b) => symTokens(a.ten).length - symTokens(b.ten).length || b.weight - a.weight)
  const reps: PbRow[] = []
  const repTokens: Set<string>[] = []
  for (const r of base) {
    const tks = new Set(symTokens(r.ten))
    let merged = false
    for (let i = 0; i < reps.length; i++) {
      const rt = repTokens[i]
      if (!rt || !tks.size || !rt.size) continue
      const aInB = [...tks].every((t) => rt.has(t))
      const bInA = [...rt].every((t) => tks.has(t))
      const equal = tks.size === rt.size && aInB
      const subset = tks.size >= 2 && rt.size >= 2 && (aInB || bInA)
      if (equal || subset) {
        const rep = reps[i]
        if (rep) {
          rep.ids.push(...r.ids)
          rep.supports = [...new Set([...rep.supports, ...r.supports])]
          rep.weight = Math.max(rep.weight, r.weight)
        }
        merged = true
        break
      }
    }
    if (!merged) {
      reps.push({ ...r })
      repTokens.push(tks)
    }
  }
  // Sắp xếp: đặc trưng (1 thể) lên trước, rồi theo trọng số, rồi A→Z.
  return reps.sort(
    (a, b) => a.supports.length - b.supports.length || b.weight - a.weight || a.ten.localeCompare(b.ten, 'vi'),
  )
})
// Gom triệu chứng theo NHÓM ngữ nghĩa (Tinh thần / Tiêu hóa / …). Trong mỗi nhóm,
// pbRows đã sắp đặc-trưng (1 thể) trước → triệu chứng phân biệt nổi lên đầu.
interface PbGroup { slug: string; label: string; rows: PbRow[] }
const pbGroups = computed<PbGroup[]>(() => {
  const buckets: Record<string, PbRow[]> = {}
  for (const r of pbRows.value) {
    const slug = r.nhom && PB_NHOM_TC[r.nhom] ? r.nhom : '__none'
    ;(buckets[slug] ??= []).push(r)
  }
  const out: PbGroup[] = []
  for (const slug of PB_NHOM_TC_ORDER) {
    const rows = buckets[slug]
    if (rows && rows.length) out.push({ slug, label: PB_NHOM_TC[slug] ?? slug, rows })
  }
  const none = buckets['__none']
  if (none && none.length) out.push({ slug: '__none', label: 'Chưa phân nhóm', rows: none })
  return out
})
// Rút gọn mỗi nhóm: mặc định chỉ hỏi vài câu quan trọng nhất (đặc trưng + trọng số cao),
// còn lại ẩn sau "Xem thêm" cho gọn.
const PB_GROUP_CAP = 6
const pbExpandedGroups = reactive<Record<string, boolean>>({})
function pbShownRows(g: PbGroup): PbRow[] {
  return pbExpandedGroups[g.slug] ? g.rows : g.rows.slice(0, PB_GROUP_CAP)
}
function togglePbGroup(slug: string) {
  pbExpandedGroups[slug] = !pbExpandedGroups[slug]
}
// Trả lời 1 dòng (gồm mọi id triệu chứng đã gộp) — set/bỏ đồng loạt để chấm điểm đúng.
function answerPbRow(r: PbRow, val: PbAnswer) {
  const cur = phanBietAnswers[r.id]
  if (cur === val) {
    for (const id of r.ids) delete phanBietAnswers[id]
  } else {
    for (const id of r.ids) phanBietAnswers[id] = val
  }
}
// % "theo lời kể" của một tập triệu chứng: Σ IDF "Có" / Σ IDF cả tập.
// hasData=false khi thể chưa có triệu chứng liên kết (tránh kéo điểm kép về 0 oan).
function pbScoreOf(symIds: Set<number>): { percent: number; hasData: boolean } {
  let confirmed = 0
  let total = 0
  for (const s of phanBietSymptoms.value) {
    if (!symIds.has(s.id)) continue
    total += s.weight
    if (phanBietAnswers[s.id] === 'co') confirmed += s.weight
  }
  return { percent: total > 0 ? Math.round((confirmed / total) * 100) : 0, hasData: total > 0 }
}
interface PbScorePart { label: string; percent: number; hasData: boolean }
interface PbScore { key: string; label: string; percentDo: number; percent: number; isKep: boolean; parts: PbScorePart[]; missing: boolean }
// Xếp hạng theo lời kể. Thể kép: cả hai thành phần đều phải đủ → điểm = min(các thành phần CÓ dữ liệu).
const pbScores = computed<PbScore[]>(() =>
  pbActiveCandidates.value
    .map((c) => {
      if (c.components && c.components.length) {
        const parts = c.components.map((comp) => {
          const r = pbScoreOf(comp.symptomIds)
          return { label: comp.label, percent: r.percent, hasData: r.hasData }
        })
        const withData = parts.filter((p) => p.hasData)
        return {
          key: c.key,
          label: c.label,
          percentDo: c.percentDo,
          percent: withData.length ? Math.min(...withData.map((p) => p.percent)) : 0,
          isKep: true,
          parts,
          missing: parts.some((p) => !p.hasData),
        }
      }
      const r = pbScoreOf(c.symptomIds)
      return { key: c.key, label: c.label, percentDo: c.percentDo, percent: r.percent, isKep: false, parts: [], missing: false }
    })
    .sort((a, b) => b.percent - a.percent),
)
// Nguyên nhân có cấu trúc của 1 thể (gộp các pháp trị thành phần), gom theo nhóm + khử trùng.
interface PbNnGroup { slug: string; label: string; items: string[] }
function pbNguyenNhanGroups(ptIds: number[]): PbNnGroup[] {
  const buckets: Record<string, string[]> = {}
  const seen = new Set<string>()
  for (const pt of ptIds) {
    for (const it of phanBietNguyenNhan.value[pt] ?? []) {
      const noi = (it.noi_dung || '').trim()
      if (!noi) continue
      const slug = it.nhom && PB_NHOM_NN[it.nhom] ? it.nhom : '__none'
      const k = slug + '|' + noi
      if (seen.has(k)) continue
      seen.add(k)
      ;(buckets[slug] ??= []).push(noi)
    }
  }
  const out: PbNnGroup[] = []
  for (const slug of PB_NHOM_NN_ORDER) {
    const items = buckets[slug]
    if (items && items.length) out.push({ slug, label: PB_NHOM_NN[slug] ?? slug, items })
  }
  const none = buckets['__none']
  if (none && none.length) out.push({ slug: '__none', label: 'Khác', items: none })
  return out
}
const pbContext = computed(() =>
  pbActiveCandidates.value
    .map((c) => {
      const metas = c.phapTriIds.map((pt) => phanBietMeta.value[pt]).filter(Boolean)
      const join = (k: 'nguyen_nhan' | 'mach_chan' | 'chat_luoi') =>
        [...new Set(metas.map((m) => (m as Record<string, string | null>)[k]).filter((x): x is string => !!x))].join(' · ')
      const nnGroups = pbNguyenNhanGroups(c.phapTriIds)
      return {
        key: c.key,
        label: c.label,
        nnGroups,
        // Văn bản nguyên nhân cũ chỉ hiện khi chưa có nguyên nhân cấu trúc.
        nguyen_nhan: nnGroups.length ? '' : join('nguyen_nhan'),
        mach_chan: join('mach_chan'),
        chat_luoi: join('chat_luoi'),
      }
    })
    .filter((x) => x.nnGroups.length || x.nguyen_nhan || x.mach_chan || x.chat_luoi),
)

// ===== Pha 5: ghép THỂ KÉP (Tâm Tỳ Lưỡng Hư, Tâm Thận Bất Giao…) =====
function onKepSearchInput() {
  if (kepTimer) clearTimeout(kepTimer)
  const q = kepSearch.value.trim()
  if (!q) {
    kepResults.value = []
    return
  }
  kepTimer = setTimeout(() => void runKepSearch(q), 250)
}
async function runKepSearch(q: string) {
  kepSearching.value = true
  try {
    const res = await api.get<{
      data: { id: number; chung_trang: string | null; trieu_chung_list?: unknown[] }[]
    }>(`/phap-tri/lite?q=${encodeURIComponent(q)}&limit=8`)
    const picked = new Set(kepPicks.value.map((p) => p.id))
    kepResults.value = (res.data ?? [])
      .map((r) => ({
        id: r.id,
        label: r.chung_trang || `Pháp trị #${r.id}`,
        tc: Array.isArray(r.trieu_chung_list) ? r.trieu_chung_list.length : undefined,
      }))
      .filter((r) => !picked.has(r.id))
  } catch {
    kepResults.value = []
  } finally {
    kepSearching.value = false
  }
}
function pickKep(p: KepPick) {
  if (kepPicks.value.length >= 2 || kepPicks.value.some((x) => x.id === p.id)) return
  kepPicks.value = [...kepPicks.value, p]
  kepResults.value = kepResults.value.filter((r) => r.id !== p.id)
  kepSearch.value = ''
}
function unpickKep(id: number) {
  kepPicks.value = kepPicks.value.filter((p) => p.id !== id)
}
// Nạp thêm triệu chứng/ngữ cảnh cho các pháp trị chưa có trong dữ liệu phân biệt.
async function loadMorePhapTri(ids: number[]) {
  const missing = ids.filter((id) => !(String(id) in phanBietByPhapTri.value))
  if (!missing.length) return
  const res = await api.get<{
    symptoms: PbSymptom[]
    byPhapTri: Record<string, number[]>
    phapTriMeta: Record<string, { nguyen_nhan: string | null; mach_chan: string | null; chat_luoi: string | null }>
    phapTriNguyenNhan: Record<string, PbNguyenNhan[]>
  }>(`/trieu-chung/phan-biet?phapTriIds=${missing.join(',')}`)
  const merged = new Map(phanBietSymptoms.value.map((s) => [s.id, s]))
  for (const s of res.symptoms ?? []) if (!merged.has(s.id)) merged.set(s.id, s)
  phanBietSymptoms.value = [...merged.values()]
  phanBietByPhapTri.value = { ...phanBietByPhapTri.value, ...(res.byPhapTri ?? {}) }
  phanBietMeta.value = { ...phanBietMeta.value, ...(res.phapTriMeta ?? {}) }
  phanBietNguyenNhan.value = { ...phanBietNguyenNhan.value, ...(res.phapTriNguyenNhan ?? {}) }
}
async function addKepCandidate() {
  if (kepPicks.value.length !== 2) return
  const [a, b] = kepPicks.value as [KepPick, KepPick]
  const key = `kep:${[a.id, b.id].sort((x, y) => x - y).join('-')}`
  if (phanBietCandidates.value.some((c) => c.key === key)) {
    kepError.value = 'Đã ghép cặp thể này rồi.'
    return
  }
  kepError.value = null
  try {
    await loadMorePhapTri([a.id, b.id])
  } catch (e: unknown) {
    kepError.value = e instanceof Error ? e.message : String(e)
    return
  }
  const symA = new Set<number>(phanBietByPhapTri.value[a.id] ?? [])
  const symB = new Set<number>(phanBietByPhapTri.value[b.id] ?? [])
  phanBietCandidates.value = [
    ...phanBietCandidates.value,
    {
      key,
      label: `${a.label} × ${b.label}`,
      percentDo: 0,
      phapTriIds: [a.id, b.id],
      symptomIds: new Set<number>([...symA, ...symB]),
      enabled: true,
      isKep: true,
      components: [
        { label: a.label, phapTriIds: [a.id], symptomIds: symA },
        { label: b.label, phapTriIds: [b.id], symptomIds: symB },
      ],
    },
  ]
  kepPicks.value = []
  kepResults.value = []
  kepSearch.value = ''
}
function removeKepCandidate(key: string) {
  phanBietCandidates.value = phanBietCandidates.value.filter((c) => c.key !== key)
}

// D5 — lưu kết luận chẩn đoán vào ca khám (bệnh án + lịch sử). Cho phép chốt NHIỀU thể bệnh.
// Sắp theo thứ tự xếp hạng (cao điểm trước); chưa chọn gì → mặc định lấy thể cao điểm nhất.
const chanDoanConclusionKeys = computed<string[]>(() => {
  const picked = new Set(chanDoanKetLuanKeys.value)
  const ordered = pbScores.value.filter((s) => picked.has(s.key)).map((s) => s.key)
  if (ordered.length) return ordered
  const top = pbScores.value[0]?.key
  return top ? [top] : []
})
async function saveChanDoan() {
  const items: { label: string; key: string }[] = []
  for (const k of chanDoanConclusionKeys.value) {
    const cand = phanBietCandidates.value.find((c) => c.key === k)
    if (cand) items.push({ label: cand.label, key: cand.key })
  }
  if (!items.length) {
    chanDoanSavedMsg.value = 'Chưa chọn thể kết luận.'
    return
  }
  const trieu_chung: { id: number; ten: string; nhom: string | null; tra_loi: PbAnswer }[] = []
  for (const s of phanBietSymptoms.value) {
    const a = phanBietAnswers[s.id]
    if (!a) continue
    trieu_chung.push({ id: s.id, ten: s.ten, nhom: s.nhom, tra_loi: a })
  }
  const payload = {
    // ket_luan: ghép nhãn các thể để các chỗ hiển thị/in (đang đọc ket_luan) hiện đủ tất cả thể.
    ket_luan: items.map((i) => i.label).join(', '),
    ket_luan_key: items[0]?.key,
    ket_luan_items: items,
    xep_hang: pbScores.value.map((s) => ({ label: s.label, percent: s.percent, is_kep: s.isKep })),
    trieu_chung,
    ghi_chu: chanDoanNote.value.trim() || undefined,
    luu_luc: new Date().toISOString(),
  }
  chanDoanSaving.value = true
  chanDoanSavedMsg.value = ''
  try {
    await api.put(`/examinations/${examId.value}/chan-doan`, { chanDoan: payload })
    if (examination.value) examination.value.chanDoan = payload
    chanDoanSavedMsg.value = 'Đã lưu vào bệnh án.'
  } catch (e: unknown) {
    chanDoanSavedMsg.value = 'Lỗi lưu: ' + (e instanceof Error ? e.message : String(e))
  } finally {
    chanDoanSaving.value = false
  }
}

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

// Hướng A — tra cứu thể bệnh trên Google (nguồn ngoài, mở tab mới) để bệnh nhân đọc tường tận hơn.
// Ưu tiên từ khóa người dùng đang gõ, nếu trống thì dùng mô hình bệnh đang mở.
const phapTriLookupTerm = computed(() => (phapTriQuery.value.trim() || phapTriModalContext.value || '').trim())
const googleLookupUrl = computed(() => {
  const term = phapTriLookupTerm.value
  if (!term) return ''
  const q = `"${term}" y học cổ truyền triệu chứng nguyên nhân điều trị`
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`
})
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

// ── Popup "Chi tiết bệnh" (bấm vào mô hình bệnh Đông Y - Section III) — nạp đúng
// bản ghi Bệnh Đo Kinh Lạc (nguyên nhân, triệu chứng, pháp trị, bài thuốc) ngay tại
// trang này, thay vì chỉ xem tên rút gọn ở bảng so sánh hoặc phải mở trang khác. ──
const NHOM_NGUYEN_NHAN_BCT: { slug: string; label: string }[] = [
  { slug: 'tinh-than', label: 'Yếu tố tinh thần' },
  { slug: 'sinh-hoat', label: 'Chế độ sinh hoạt' },
  { slug: 'tang-phu', label: 'Ảnh hưởng tạng phủ khác' },
]
const NHOM_TRIEU_CHUNG_BCT: { slug: string; label: string }[] = [
  { slug: 'tinh-than', label: 'Tinh thần / Cảm xúc' },
  { slug: 'tieu-hoa', label: 'Tiêu hóa / Ăn ngủ' },
  { slug: 'than-kinh-co-the', label: 'Thần kinh / Cơ thể' },
  { slug: 'phu-khoa', label: 'Phụ khoa' },
  { slug: 'luoi-mach', label: 'Lưỡi / Mạch' },
  { slug: 'toan-trang', label: 'Toàn trạng' },
  { slug: 'khac', label: 'Khác' },
]

interface BenhChiTietDetail {
  id: number
  code: string
  name: string
  outputCell: string
  phapTriList?: Array<{ id: number; chung_trang: string | null; nguyen_tac: string | null }> | null
  trieuChungList?: Array<{ id: number; ten_trieu_chung: string; nhom?: string | null }> | null
  baiThuocList?: Array<{ id: number; ten_bai_thuoc: string }> | null
  nguyen_nhan_list?: Array<{ nhom: string | null; noi_dung: string | null }> | null
}

const showBenhChiTietModal = ref(false)
const benhChiTietLoading = ref(false)
const benhChiTietError = ref<string | null>(null)
const benhChiTiet = ref<BenhChiTietDetail | null>(null)

async function openBenhChiTiet(item: { id: number }) {
  showBenhChiTietModal.value = true
  benhChiTietLoading.value = true
  benhChiTietError.value = null
  benhChiTiet.value = null
  try {
    benhChiTiet.value = await api.get<BenhChiTietDetail>(`/benh-dong-y-excel/${item.id}`)
  } catch (e: any) {
    benhChiTietError.value = e?.message || 'Không tải được chi tiết bệnh.'
  } finally {
    benhChiTietLoading.value = false
  }
}
function closeBenhChiTietModal() {
  showBenhChiTietModal.value = false
}
const benhChiTietTheBenh = computed(() =>
  (benhChiTiet.value?.phapTriList ?? [])
    .map((p) => ({ id: p.id, name: (p.chung_trang || '').trim() }))
    .filter((x) => x.name),
)
const benhChiTietPhapTri = computed(() =>
  (benhChiTiet.value?.phapTriList ?? [])
    .map((p) => ({ id: p.id, name: (p.nguyen_tac || p.chung_trang || `#${p.id}`).trim() }))
    .filter((x) => x.name),
)
const benhChiTietBaiThuoc = computed(() =>
  (benhChiTiet.value?.baiThuocList ?? [])
    .map((b) => ({ id: b.id, name: b.ten_bai_thuoc }))
    .filter((x) => !!x.name),
)
const benhChiTietNguyenNhan = computed(() => {
  const list = (benhChiTiet.value?.nguyen_nhan_list ?? []).filter((n) => (n.noi_dung ?? '').trim())
  if (!list.length) return []
  const out: { label: string; items: string[] }[] = []
  for (const g of NHOM_NGUYEN_NHAN_BCT) {
    const items = list.filter((n) => n.nhom === g.slug).map((n) => String(n.noi_dung))
    if (items.length) out.push({ label: g.label, items })
  }
  const other = list.filter((n) => !NHOM_NGUYEN_NHAN_BCT.some((g) => g.slug === n.nhom)).map((n) => String(n.noi_dung))
  if (other.length) out.push({ label: 'Khác', items: other })
  return out
})
const benhChiTietTrieuChung = computed(() => {
  const list = benhChiTiet.value?.trieuChungList ?? []
  if (!list.length) return []
  const byNhom: Record<string, string[]> = {}
  for (const t of list) {
    if (!t.ten_trieu_chung) continue
    const slug = t.nhom && NHOM_TRIEU_CHUNG_BCT.some((g) => g.slug === t.nhom) ? t.nhom : '__none'
    ;(byNhom[slug] ??= []).push(t.ten_trieu_chung)
  }
  const out: { label: string; items: string[] }[] = []
  for (const g of NHOM_TRIEU_CHUNG_BCT) {
    const items = byNhom[g.slug]
    if (items && items.length) out.push({ label: g.label, items })
  }
  const none = byNhom['__none']
  if (none && none.length) out.push({ label: 'Chưa phân nhóm', items: none })
  return out
})

// ── Popup "Chi tiết kinh mạch" (nút "i" trên thẻ tạng phủ ở mục II Bát Cương) — hiện biểu
// hiện lâm sàng khi kinh đó bị tắc nghẽn/rối loạn (kinh_mach.bieu_hien_tac_nghen). Mã kinh
// NGẮN hiển thị (Can, Tỳ...) map sang kinh_mach qua ky_hieu_quoc_te (MER3D). ──
interface KinhMachChiTietRow {
  idKinhMach: number
  ten_kinh_mach: string | null
  ten_viet_tat: string | null
  ky_hieu_quoc_te: string | null
  bieu_hien_tac_nghen: string | null
}
const showKinhMachChiTietModal = ref(false)
const kinhMachChiTiet = ref<KinhMachChiTietRow | null>(null)
let kinhMachListCache: KinhMachChiTietRow[] | null = null
// Nút "i" ở mục Hư-Thực (BatCuongSummary) dùng CHUNG kênh emit('detail', ...) với tạng phủ —
// phân biệt bằng mã riêng này để mở popup TĨNH (không gọi API) thay vì tra kinh mạch.
const HUTHUC_INFO_KEY = '__huthuc_info__'
const showHuThucInfoModal = ref(false)
const HU_THUC_INFO: Record<'thuc' | 'hu', { title: string; body: string }> = {
  thuc: { title: 'Mạch Hữu Lực', body: 'Tà khí đang mạnh, cơ thể phản ứng dữ dội, nhiều nơi lệch rõ.' },
  hu: { title: 'Mạch Vô Lực', body: 'Chính khí suy, phản ứng yếu ớt, lệch ít hoặc lệch nhẹ dù có bệnh.' },
}
const huThucInfoForModal = computed(() => {
  const v = (diagnosis.value?.huThuc || '').toLowerCase()
  const t: 'thuc' | 'hu' | null = v.includes('thực') ? 'thuc' : v.includes('hư') && !v.includes('thường') ? 'hu' : null
  return t ? HU_THUC_INFO[t] : null
})
async function openKinhMachChiTiet(shortCode: string) {
  if (shortCode === HUTHUC_INFO_KEY) {
    showHuThucInfoModal.value = true
    return
  }
  showKinhMachChiTietModal.value = true
  kinhMachChiTiet.value = null
  const symbol = MER3D[shortCode]
  try {
    if (!kinhMachListCache) kinhMachListCache = await api.get<KinhMachChiTietRow[]>('/kinh-mach')
    kinhMachChiTiet.value = kinhMachListCache.find((k) => k.ky_hieu_quoc_te === symbol) ?? null
  } catch {
    kinhMachChiTiet.value = null
  }
}
function closeKinhMachChiTietModal() {
  showKinhMachChiTietModal.value = false
}
function closeHuThucInfoModal() {
  showHuThucInfoModal.value = false
}
const kinhMachChiTietParas = computed(() =>
  String(kinhMachChiTiet.value?.bieu_hien_tac_nghen ?? '')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean),
)

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

// Ý nghĩa châm huyệt (soạn từ giải nghĩa phương huyệt) — để bác sĩ biết châm huyệt này nhằm gì.
function phuongHuyetYNghia(row: PhacDoApiRow): string {
  return (row.y_nghia_huyet || '').trim()
}
// Thể gốc của huyệt (khi gộp thể kép, huyệt có thể đến từ thể đơn khác nhau).
function phuongHuyetSourceThe(row: PhacDoApiRow): string {
  return (row.benh?.chung_trang || '').trim()
}
// Danh sách phương huyệt đang xét có gộp từ NHIỀU thể (thể kép) → mới cần hiện nhãn "Từ thể …".
const phuongHuyetMultiSource = computed<boolean>(() => {
  const s = new Set<string>()
  for (const r of matchedPhuongHuyetList.value) {
    const n = phNormName(r.benh?.chung_trang)
    if (n) s.add(n)
    if (s.size > 1) return true
  }
  return false
})

const expandedPhuongHuyetNotes = ref<Set<number>>(new Set())

function togglePhuongHuyetNote(id: number) {
  const next = new Set(expandedPhuongHuyetNotes.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedPhuongHuyetNotes.value = next
}

// Nhảy sang Kinh Mạch 3D, bay tới đúng huyệt (KinhMach3DView đọc query.focus sau khi engine sẵn sàng),
// kèm dữ liệu để hiện nút "Quay lại" đúng ca khám + đúng tab.
function gotoAcuMap(code?: string | null) {
  if (!code) return
  router.push({
    name: 'kinh-mach-3d',
    query: {
      focus: code,
      from: 'meridian-results',
      patientId: String(patientId.value),
      examId: String(examId.value),
      view: '2',
    },
  })
}

// Huyệt KHÔNG có toạ độ trên đồ hình 3D (kỳ huyệt / nhĩ châm) → mở trang Từ Điển đúng huyệt đó
// (tu-dien đọc ?acu=<id trong bộ Từ Điển 1059>). Dùng thay nút "xem trên 3D".
function gotoTuDien(idTuDien?: number | null) {
  if (!idTuDien) return
  router.push({ name: 'tu-dien', query: { acu: String(idTuDien) } })
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

function groupPhuongHuyetByMethod(rows: PhacDoApiRow[]): Array<{ method: string; items: PhacDoApiRow[] }> {
  const grouped = new Map<string, PhacDoApiRow[]>()
  for (const row of rows) {
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
}

const phuongHuyetGroups = computed(() => groupPhuongHuyetByMethod(matchedPhuongHuyetList.value))

// Phương huyệt CHỈ của 1 thể bệnh (không phụ thuộc excelFocusRuleId đang lọc hay không) — dùng cho nút
// "in riêng" đặt cạnh Chi tiết/Pháp trị của từng thể ở mục III, khác với matchedPhuongHuyetList vốn
// gộp mọi thể đang được xét (tất cả hoặc theo focus).
function phuongHuyetForThe(item: { name: string }): PhacDoApiRow[] {
  const names = new Set(phNamesOf(item.name))
  const seenHuyet = new Set<number>()
  const out: PhacDoApiRow[] = []
  for (const row of phacDoAllList.value) {
    const bn = phNormName(row.benh?.chung_trang)
    if (!bn || !names.has(bn)) continue
    if (seenHuyet.has(row.idHuyet)) continue
    seenHuyet.add(row.idHuyet)
    out.push(row)
  }
  return out
}

// In "Phiếu châm huyệt": để tên huyệt + ghi chú kỹ thuật lại sessionStorage (map3d.js chỉ biết mã +
// toạ độ 3D, không có tên/ghi chú), rồi điều hướng sang Kinh Mạch 3D với ?diagram=<mã,mã,...> —
// KinhMach3DView tự chụp ảnh mặt trước/sau + dựng phiếu in khi engine 3D sẵn sàng.
// Truyền `theItem` để in RIÊNG phương huyệt của 1 thể bệnh (nút cạnh Chi tiết/Pháp trị ở mục III);
// bỏ trống để in GỘP mọi thể đang được xét (nút chung ở đầu trang).
function inPhieuChamHuyet(theItem?: { name: string } | null) {
  const rows = theItem ? phuongHuyetForThe(theItem) : matchedPhuongHuyetList.value
  const codes = [
    ...new Set(rows.map((r) => r.huyetVi?.ma_huyet).filter((c): c is string => !!c)),
  ]
  if (!codes.length) {
    alert(
      theItem
        ? `Thể "${theItem.name}" chưa có phương huyệt để in.`
        : 'Chưa có huyệt nào có mã để dựng phiếu châm huyệt.',
    )
    return
  }
  const payload = {
    patientName: patient.value?.fullName || '',
    examDate: examDisplay.value.date,
    theBenh: theItem?.name || '',
    groups: groupPhuongHuyetByMethod(rows).map((g) => ({
      method: g.method,
      items: g.items
        .filter((r) => r.huyetVi?.ma_huyet)
        .map((r) => ({
          code: r.huyetVi!.ma_huyet as string,
          name: r.huyetVi?.ten_huyet || '',
          note: r.ghi_chu_ky_thuat || '',
          yNghia: r.y_nghia_huyet || '',
          source: r.benh?.chung_trang || '',
        })),
    })),
  }
  try {
    sessionStorage.setItem('kinhlac:acu-print-payload', JSON.stringify(payload))
  } catch {
    /* storage đầy/bị chặn — vẫn điều hướng, KinhMach3DView tự lấy tên huyệt từ dữ liệu 3D nếu thiếu payload */
  }
  // Mở TAB MỚI để dựng phiếu (cần tải engine 3D + chụp ảnh) — KHÔNG router.push, để trang "Kết quả
  // khám" đang xem giữ nguyên, không bị điều hướng đi mất. Tab mới tự đóng lại sau khi mở xong cửa sổ
  // in (xem `printAcuDiagram` trong KinhMach3DView.vue) — chỉ còn phiếu in đọng lại cho bác sĩ.
  const url = router.resolve({
    name: 'kinh-mach-3d',
    query: {
      diagram: codes.join(','),
      from: 'meridian-results',
      patientId: String(patientId.value),
      examId: String(examId.value),
      view: '2',
    },
  }).href
  const w = window.open(url, '_blank')
  if (!w) {
    alert('Trình duyệt đang chặn cửa sổ mới. Vui lòng cho phép pop-up cho trang này rồi thử lại.')
  }
}

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

// Quan hệ NHÂN-QUẢ (chỉ link CÓ ghi_chu): YHHĐ (compound) ⇐ YHCT gốc (component).
interface CauseLink { rootName: string; diseaseName: string; ghiChu: string }
const causeLinks = computed<CauseLink[]>(() =>
  cauThanhList.value
    .filter((r) => (r.ghi_chu || '').trim())
    .map((r) => ({
      rootName: (r.component?.tieuket || r.component?.chung_trang || '').trim(),
      diseaseName: (r.compound?.tieuket || r.compound?.chung_trang || '').trim(),
      ghiChu: (r.ghi_chu || '').trim(),
    }))
    .filter((l) => l.rootName && l.diseaseName),
)

interface SyndItem { id: number; name: string; code?: string; outputCell?: string; logicExpression?: string }
interface SyndSub { name: string; ghiChu: string; role: 'root' | 'disease'; measured: boolean }
interface SyndNode { item: SyndItem; kind: 'excel' | 'modern'; no?: number; extraIds: number[]; subs: SyndSub[] }

// Mục III dạng CÂY theo "công thức": thể ĐO ĐƯỢC (có công thức, click nổi ô) = CHA; thể không đo được
// = CON (hiện kèm cơ chế). Cả 2 đo được → 1 dòng, thể YHCT gốc làm chính, click sáng CẢ 2 công thức.
const syndromeTree = computed<{ nodes: SyndNode[]; standaloneModern: SyndItem[] }>(() => {
  const excel = excelSyndromesList.value as SyndItem[]
  const modern = modernSyndromesList.value as SyndItem[]
  const measured: Array<{ item: SyndItem; kind: 'excel' | 'modern'; order: number }> = []
  excel.forEach((it, i) => measured.push({ item: it, kind: 'excel', order: i }))
  modern.forEach((it, i) => measured.push({ item: it, kind: 'modern', order: 1000 + i }))
  const byNorm = new Map<string, { item: SyndItem; kind: 'excel' | 'modern'; order: number }>()
  for (const m of measured) { const k = phNormName(m.item.name); if (!byNorm.has(k)) byNorm.set(k, m) }

  const rootChildren = new Map<string, CauseLink[]>()
  const diseaseRoot = new Map<string, CauseLink>()
  for (const l of causeLinks.value) {
    const rk = phNormName(l.rootName), dk = phNormName(l.diseaseName)
    if (!rootChildren.has(rk)) rootChildren.set(rk, [])
    rootChildren.get(rk)!.push(l)
    if (!diseaseRoot.has(dk)) diseaseRoot.set(dk, l)
  }

  const consumed = new Set<number>()
  const collected: Array<{ order: number; node: SyndNode }> = []
  // Pass 1: thể đo được là GỐC → node cha (gom mọi bệnh YHHĐ liên quan làm con)
  for (const m of measured) {
    const k = phNormName(m.item.name)
    if (consumed.has(m.item.id) || !rootChildren.has(k)) continue
    const subs: SyndSub[] = []; const extraIds: number[] = []
    for (const l of rootChildren.get(k)!) {
      const cm = byNorm.get(phNormName(l.diseaseName))
      subs.push({ name: l.diseaseName, ghiChu: l.ghiChu, role: 'disease', measured: !!cm })
      if (cm) { extraIds.push(cm.item.id); consumed.add(cm.item.id) }
    }
    consumed.add(m.item.id)
    collected.push({ order: m.order, node: { item: m.item, kind: m.kind, extraIds, subs } })
  }
  // Pass 2: thể đo được là BỆNH YHHĐ có gốc CHƯA đo được → bệnh làm cha, gốc làm con (cơ chế); thể lẻ
  for (const m of measured) {
    if (consumed.has(m.item.id)) continue
    const dl = diseaseRoot.get(phNormName(m.item.name))
    if (dl && !byNorm.has(phNormName(dl.rootName))) {
      consumed.add(m.item.id)
      collected.push({ order: m.order, node: { item: m.item, kind: m.kind, extraIds: [], subs: [{ name: dl.rootName, ghiChu: dl.ghiChu, role: 'root', measured: false }] } })
    } else if (m.kind === 'excel') {
      consumed.add(m.item.id)
      collected.push({ order: m.order, node: { item: m.item, kind: 'excel', extraIds: [], subs: [] } })
    }
  }
  collected.sort((a, b) => a.order - b.order)
  let n = 0
  const nodes = collected.map((x) => { x.node.no = ++n; return x.node })
  const standaloneModern = modern.filter((it) => !consumed.has(it.id))
  return { nodes, standaloneModern }
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
  
  const d = new Date(mocKham(examination.value) ?? examination.value.createdAt)
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
    { name: 'Đởm', left: d.damtrai || 0, right: d.damphai || 0 },
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
  'Tiểu': 'Tiểu Trường',
  'Tâm': 'Tâm',
  'Tam': 'Tam tiêu',
  'Bào': 'Tâm bào',
  'Đại': 'Đại Trường',
  'Phế': 'Phế',
  'Bàng': 'Bàng quang',
  'Thận': 'Thận',
  'Đởm': 'Đởm',
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
  if (!examination.value?.inputData) return { khi: '—', huyet: '—', huThuc: '—', explain: null }
  
  // 1. Âm / Dương = TỔNG CƯƠNG — không tính ở đây; suy từ ma trận Hàn·Nhiệt × Hư·Thực
  //    trong computed `tongCuong` (cần affectedOrgans khai báo sau). Xem computeTongCuong().

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
  
  // 4. Hư — Thực (CƯƠNG ĐỘC LẬP, KHÔNG còn gắn với Khí/Huyết chi trên/chi dưới — trước đây mục
  // "④ Hư-Thực" thực chất chỉ lặp lại cách tính Hàn/Nhiệt theo hướng lệch, không đo cường độ phản
  // ứng nên chỉ còn "Lục Cương". Đúng bản chất kinh điển: Hư-Thực đo BIÊN ĐỘ/DIỆN RỘNG phản ứng
  // toàn thân (giống "mạch hữu lực → Thực, vô lực → Hư"), không phải hướng lệch nóng/lạnh.
  // Gộp cả 12 kinh (chi trên dùng bounds/sd của upperStats, chi dưới dùng của lowerStats); kinh nào
  // vượt khoảng bình thường [lowerBound, upperBound] của NHÓM nó → tính là "lệch". Ngưỡng Thực tự
  // tham chiếu theo chính dung sai (sd) của người bệnh — không dùng số liệu quần thể ngoài.
  let lechCount = 0
  let totalLech = 0
  let tongDoTren = 0
  let tongDoDuoi = 0
  // Danh sách kinh "lệch" (mã ngắn + hướng cao/thấp) → dùng để SOI đúng các kinh này ở bảng đo +
  // hình 3D khi bấm vào verdict Hư-Thực (giống cách Biểu-Lý/Hàn-Nhiệt đã soi được).
  const lechRows: { name: string; tone: 'high' | 'low' }[] = []
  upperRows.value.forEach(r => {
    if (r.avg === 0) return
    tongDoTren++
    if (r.avg > upperStats.value.upperBound || r.avg < upperStats.value.lowerBound) {
      lechCount++
      totalLech += Math.abs(r.avg - upperStats.value.mean)
      lechRows.push({ name: r.name, tone: r.avg > upperStats.value.upperBound ? 'high' : 'low' })
    }
  })
  lowerRows.value.forEach(r => {
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
  // Ngưỡng chỉ lấy TRUNG BÌNH dung sai 2 nhóm khi CẢ hai đều có đo; nhóm nào chưa đo (dungSai=0
  // vì calculateBounds không có dữ liệu) thì bỏ qua — tránh kéo ngưỡng xuống còn một nửa oan uổng.
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

  // Lộ rõ các con số trung gian → bảng tóm tắt giải thích VÌ SAO ra kết luận (không giấu công thức).
  return {
    khi,
    huyet,
    huThuc,
    explain: {
      khi: { huCount: huTrenCount, total: upperRows.value.length, sum: round2(sumDiffTren), mean: round2(upperStats.value.mean) },
      huyet: { huCount: huDuoiCount, total: lowerRows.value.length, sum: round2(sumDiffDuoi), mean: round2(lowerStats.value.mean) },
      huThuc: { lechCount, tongDo, totalLech, nguong, lechRows },
    },
  }
})

// Mã kinh NGẮN đang "lệch" theo Hư-Thực → truyền xuống BatCuongOrgans/BatCuongFigure3D để soi
// nhóm 'huthuc' (giống cách Biểu-Lý/Hàn-Nhiệt soi theo affectedOrgans).
const huThucLechNames = computed(() => (diagnosis.value.explain?.huThuc?.lechRows ?? []).map((r) => r.name))
const thucLechRows = computed(() => (diagnosis.value.explain?.huThuc?.lechRows ?? []).filter((r) => r.tone === 'high'))
const huLechRows = computed(() => (diagnosis.value.explain?.huThuc?.lechRows ?? []).filter((r) => r.tone === 'low'))

// Bảng tra: mã kinh ngắn → tên đường kinh đầy đủ (dùng trong Dashboard)
const SHORT_TO_ORGAN: Record<string, string> = {
  Tiểu: 'Tiểu Trường', Tâm: 'Tâm', Tam: 'Tam Tiêu', Bào: 'Tâm Bào',
  Đại: 'Đại Trường', Phế: 'Phế', Bàng: 'Bàng Quang', Thận: 'Thận',
  Đởm: 'Đởm', Vị: 'Vị', Can: 'Can', Tỳ: 'Tỳ',
}

// Kinh "lệch" kèm tên tạng phủ + bên + hướng (cao vượt ngưỡng / thấp dưới ngưỡng) → BatCuongSummary
// hiện 2 nhóm chip theo BIÊN ĐỘ. Lưu ý: cao/thấp là biên độ, KHÔNG phải nhãn thực/hư từng tạng
// (hướng nóng/lạnh đã nằm ở Hàn-Nhiệt) — Hư-Thực vẫn là kết luận TOÀN THÂN.
const huThucLechOrgans = computed(() => {
  const rows = diagnosis.value.explain?.huThuc?.lechRows ?? []
  const m = organStateMap.value
  return rows.map((r) => {
    const st = m.get(r.name)
    return {
      name: r.name,
      organ: st?.organ ?? CHANNELS_FULL[r.name as keyof typeof CHANNELS_FULL] ?? r.name,
      side: st?.side ?? '',
      tone: r.tone,
    }
  })
})

// Một tạng phủ đã phân loại Bát Cương — giữ row.name để soi đúng hàng bảng đo khi bấm.
interface BcOrgan {
  name: string // mã kinh (row.name)
  label: string // tên đầy đủ + bên (vd "Tâm trái")
  organ: string // tên tạng phủ (vd "Tâm")
  side: string // "trái" | "phải" | ""
}
// Tạng phủ đã phân loại Bát Cương (kèm độ sâu + tính chất; 'mixed' khi rơi vào nhiều nhóm).
interface OrganState extends BcOrgan {
  depth: 'bieu' | 'ly' | 'mixed'
  temp: 'han' | 'nhiet' | 'mixed'
}

const batCuong = computed(() => {
  const lyNhiet: string[] = []
  const bieuNhiet: string[] = []
  const lyHan: string[] = []
  const bieuHan: string[] = []

  // Item kèm row.name → vừa vẽ icon tạng phủ, vừa soi đúng hàng bảng đo khi bấm.
  const itLyNhiet: BcOrgan[] = []
  const itBieuNhiet: BcOrgan[] = []
  const itLyHan: BcOrgan[] = []
  const itBieuHan: BcOrgan[] = []

  const mkOrgan = (rowName: string, organ: string, label: string): BcOrgan => ({
    name: rowName,
    label,
    organ,
    side: label.slice(organ.length).trim(),
  })

  const process = (row: any, saiSo: number) => {
    const tenKinh = CHANNELS_FULL[row.name as keyof typeof CHANNELS_FULL]
    if (!tenKinh) return

    const dauC8 = signToInt(row.leftSign)
    const dauC10 = signToInt(row.diff > 0 ? '+' : row.diff < 0 ? '-' : '0')
    const dauC11 = signToInt(row.rightSign)

    const dauC12 = row.absDiff > saiSo ? (row.left > row.right ? 1 : -1) : 0
    void dauC12 // Giữ biến để đồng bộ ngữ nghĩa với thuật toán gốc

    // Phát hiện nhóm nào "lớn lên" sau khi phân loại → quy về mã kinh của hàng này
    const n0 = lyNhiet.length, n1 = bieuNhiet.length, n2 = lyHan.length, n3 = bieuHan.length
    groupingV2(lyNhiet, bieuNhiet, lyHan, bieuHan, tenKinh, dauC8, dauC10, dauC11, row.diff, saiSo)
    if (lyNhiet.length > n0) itLyNhiet.push(mkOrgan(row.name, tenKinh, lyNhiet[lyNhiet.length - 1]!))
    if (bieuNhiet.length > n1) itBieuNhiet.push(mkOrgan(row.name, tenKinh, bieuNhiet[bieuNhiet.length - 1]!))
    if (lyHan.length > n2) itLyHan.push(mkOrgan(row.name, tenKinh, lyHan[lyHan.length - 1]!))
    if (bieuHan.length > n3) itBieuHan.push(mkOrgan(row.name, tenKinh, bieuHan[bieuHan.length - 1]!))
  }

  upperRows.value.forEach((row: any) => process(row, upperStats.value.sd))
  lowerRows.value.forEach((row: any) => process(row, lowerStats.value.sd))

  return {
    hanBieu: bieuHan.join(', '),
    hanLy: lyHan.join(', '),
    nhietBieu: bieuNhiet.join(', '),
    nhietLy: lyNhiet.join(', '),
    items: { bieuHan: itBieuHan, lyHan: itLyHan, bieuNhiet: itBieuNhiet, lyNhiet: itLyNhiet },
  }
})

/**
 * Bát Cương gộp về 4 mục theo vị trí & tính chất (mỗi tạng phủ kèm icon, bấm để soi bảng đo):
 *  Biểu = Biểu Hàn ∪ Biểu Nhiệt · Lý = Lý Hàn ∪ Lý Nhiệt
 *  Hàn  = Biểu Hàn ∪ Lý Hàn     · Nhiệt = Biểu Nhiệt ∪ Lý Nhiệt
 */
const batCuongOrgans = computed(() => {
  const it = batCuong.value.items
  return {
    bieu: [...it.bieuHan, ...it.bieuNhiet],
    ly: [...it.lyHan, ...it.lyNhiet],
    han: [...it.bieuHan, ...it.lyHan],
    nhiet: [...it.bieuNhiet, ...it.lyNhiet],
  }
})

/**
 * Danh sách tạng phủ đang bệnh kèm độ sâu (Biểu/Lý) + tính chất (Hàn/Nhiệt).
 * GỘP theo tạng phủ: 1 kinh có thể rơi vào >1 nhóm (vd vừa Biểu Hàn vừa Biểu Nhiệt do 2 bên) —
 * khi đó hợp nhất thành 1 mục, đánh dấu 'mixed' để hình & bảng tóm tắt không mâu thuẫn nhau.
 */
const affectedOrgans = computed<OrganState[]>(() => {
  const it = batCuong.value.items
  const tag = (list: BcOrgan[], depth: 'bieu' | 'ly', temp: 'han' | 'nhiet'): OrganState[] =>
    list.map((o) => ({ ...o, depth, temp }))
  const all = [
    ...tag(it.bieuHan, 'bieu', 'han'),
    ...tag(it.lyHan, 'ly', 'han'),
    ...tag(it.bieuNhiet, 'bieu', 'nhiet'),
    ...tag(it.lyNhiet, 'ly', 'nhiet'),
  ]
  const byOrgan = new Map<string, OrganState>()
  for (const o of all) {
    const ex = byOrgan.get(o.organ)
    if (!ex) {
      byOrgan.set(o.organ, { ...o })
      continue
    }
    if (ex.temp !== o.temp) ex.temp = 'mixed'
    if (ex.depth !== o.depth) ex.depth = 'mixed'
    if (ex.side !== o.side) ex.side = [ex.side, o.side].filter(Boolean).join('/')
  }
  return [...byOrgan.values()]
})

/**
 * TỔNG CƯƠNG (Âm-Dương) — cương tổng quát suy từ ma trận Hàn·Nhiệt × Hư·Thực (chuẩn Bát Cương),
 * KHÔNG còn so riêng kinh Đởm. Đếm số kinh nghiêng Nhiệt/Hàn + Biểu/Lý từ affectedOrgans (đã gộp),
 * lấy Hư/Thực từ cương Hư-Thực (diagnosis.huThuc). Xem computeTongCuong() ở lib/meridianAnalysis.
 */
const tongCuong = computed<TongCuong>(() => {
  const orgs = affectedOrgans.value
  const nhiet = orgs.filter((o) => o.temp === 'nhiet' || o.temp === 'mixed').length
  const han = orgs.filter((o) => o.temp === 'han' || o.temp === 'mixed').length
  const bieu = orgs.filter((o) => o.depth === 'bieu' || o.depth === 'mixed').length
  const ly = orgs.filter((o) => o.depth === 'ly' || o.depth === 'mixed').length
  return computeTongCuong(nhiet, han, bieu, ly, diagnosis.value.huThuc)
})

// ── NGŨ HÀNH MÉO (lớp 3): độ lệch z mỗi hành từ số đo, để ngôi sao "xộc xệch" đúng tạng suy/thịnh ──
// z = (avg − mean)/sd trong ĐÚNG nhóm chi (mean=(max+min)/2, sd=range/6). Bỏ kinh avg==0 (thiếu đo);
// sd≈0 → coi z=0 (đứng mốc). Gộp mỗi hành: tạng (w0.6) + phủ (w0.4). Đã qua workflow thẩm định.
const nguHanhZ = computed<{ hoa: number | null; tho: number | null; kim: number | null; thuy: number | null; moc: number | null }>(() => {
  const zChan = (rows: { name: string; avg: number }[], stats: { mean: number; sd: number }, name: string): number | null => {
    const row = rows.find((r) => r.name === name)
    if (!row || !(row.avg > 0)) return null // thiếu đo — KHÔNG coi 0 là số đo (tránh "hư nặng" giả)
    if (!(stats.sd > 1e-6)) return 0 // thiếu phân tán → đứng ở mốc, không kết luận hư/thực
    return (row.avg - stats.mean) / stats.sd
  }
  const gop = (tangNames: string[], phuNames: string[], rows: { name: string; avg: number }[], stats: { mean: number; sd: number }): number | null => {
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    const tangZ = tangNames.map((n) => zChan(rows, stats, n)).filter((v): v is number => v != null)
    const phuZ = phuNames.map((n) => zChan(rows, stats, n)).filter((v): v is number => v != null)
    const parts: { v: number; w: number }[] = []
    if (tangZ.length) parts.push({ v: mean(tangZ), w: 0.6 })
    if (phuZ.length) parts.push({ v: mean(phuZ), w: 0.4 })
    if (!parts.length) return null
    return parts.reduce((s, p) => s + p.v * p.w, 0) / parts.reduce((s, p) => s + p.w, 0)
  }
  const uR = upperRows.value, uS = upperStats.value, lR = lowerRows.value, lS = lowerStats.value
  return {
    hoa: gop(['Tâm', 'Bào'], ['Tiểu', 'Tam'], uR, uS), // Tướng Hỏa gộp Tâm Bào / Tam Tiêu
    kim: gop(['Phế'], ['Đại'], uR, uS),
    tho: gop(['Tỳ'], ['Vị'], lR, lS),
    thuy: gop(['Thận'], ['Bàng'], lR, lS),
    moc: gop(['Can'], ['Đởm'], lR, lS),
  }
})

// ── KẾT LUẬN LỤC KINH (Thương Hàn) cho ca này — tái dùng engine qua bảng thể→kinh đã thẩm định.
//    Dồn phiếu các thể đo được + đối chiếu Bát Cương → kinh trội + giai đoạn + độ tin + lý do.
// 1 NGUỒN SỰ THẬT: bản đồ thể→kinh do ENGINE suy (/thuong-han/the-kinh). null = chưa tải → dùng
// bảng tĩnh trong lib làm dự phòng (vd bản demo công khai không gọi được API này).
const theKinhMap = ref<TheKinhMap | null>(null)
async function loadTheKinhMap() {
  try {
    const m = await api.get<TheKinhMap>('/thuong-han/the-kinh')
    if (m && Object.keys(m).length) theKinhMap.value = m
  } catch {
    theKinhMap.value = null // giữ dự phòng bảng tĩnh
  }
}
const lucKinhVerdict = computed(() =>
  locateLucKinh(
    (excelSyndromesList.value as Array<{ name: string }>).map((s) => s.name),
    tongCuong.value,
    theKinhMap.value,
  ),
)
// Số thể ĐO ĐƯỢC của bệnh nhân theo từng kinh — hiện lên vòng Lục Kinh đầy đủ (VongLucKinh).
const lucKinhCaseCounts = computed<Record<string, number>>(() => {
  const c: Record<string, number> = {}
  const v = lucKinhVerdict.value
  if (v) for (const t of v.theThuongHan) c[t.kinh] = (c[t.kinh] ?? 0) + 1
  return c
})
// Lục Khí của bệnh nhân (Hàn/Nhiệt từ nhiệt độ tạng phủ) — cho vòng Lục Khí giàu (VongLucKhi, lớp 4).
const lucKhiCaseCounts = computed<Record<string, number>>(() => {
  const c: Record<string, number> = {}
  for (const o of affectedOrgans.value) {
    if (o.temp === 'han' || o.temp === 'mixed') c['Hàn'] = (c['Hàn'] ?? 0) + 1
    if (o.temp === 'nhiet' || o.temp === 'mixed') c['Nhiệt'] = (c['Nhiệt'] ?? 0) + 1
  }
  return c
})
const lucKhiTroi = computed<string | null>(() => {
  const han = lucKhiCaseCounts.value['Hàn'] ?? 0
  const nhiet = lucKhiCaseCounts.value['Nhiệt'] ?? 0
  if (!han && !nhiet) return null
  return nhiet > han ? 'Nhiệt' : 'Hàn'
})

// ── 1 NGUỒN SỰ THẬT cho KẾT LUẬN + ĐỊNH VỊ (chips) + ĐỒ HÌNH: đều dẫn từ verdict + chuyển biến (sách). ──
const bienChung = computed(() => {
  const v = lucKinhVerdict.value
  if (!v) return null
  const nhietHoa = /nhiệt hóa/.test(v.giaiDoan)
  // CHUYỂN BIẾN (truyền kinh cấp) CHỈ suy khi định vị ĐỦ CHẮC: Bát Cương đo được KHỚP chữ ký kinh
  // (không mâu thuẫn) → mới là Thương Hàn cấp một kinh. Ngược lại (nội thương / Bát Cương lệch /
  // nhiều kinh) → KHÔNG suy, tránh dự đoán vô lý.
  const dinhViChac = v.batCuongKhop && v.doTin !== 'thap'
  return {
    kinhTroi: v.kinh, // KinhMeta (slug, ten, han…)
    giaiDoan: v.giaiDoan,
    doTin: v.doTin,
    hopBenh: v.hopBenh,
    phu: v.phu,
    tapKinh: Object.keys(lucKinhCaseCounts.value), // slug[] các kinh ca có (= tập chip Định Vị)
    counts: lucKinhCaseCounts.value,
    dinhViChac,
    // lý do KHÔNG suy chuyển biến (để hiển thị caveat)
    cbLyDo: dinhViChac ? '' : (!v.batCuongKhop
      ? 'Bát Cương đo được chưa khớp chữ ký kinh — định vị chưa chắc, chưa suy truyền kinh.'
      : 'Định vị độ tin thấp — chưa suy chuyển biến.'),
    chuyenBien: dinhViChac ? truyenBienCua(v.kinh.slug, { nhietHoa }) : null,
  }
})
// Chips ĐỊNH VỊ: tập kinh của ca, kinh TRỘI đứng đầu (dùng chung cho chip + đồ hình).
const dinhViKinhChips = computed(() => {
  const b = bienChung.value
  if (!b) return []
  const order = [b.kinhTroi.slug, ...b.tapKinh.filter((s) => s !== b.kinhTroi.slug)] as KinhSlug[]
  return order.map((s) => ({ slug: s, ten: KINH_META[s].ten, count: b.counts[s] ?? 0, troi: s === b.kinhTroi.slug }))
})

// ── TRUYỀN BIẾN: xâu chuỗi các lần đo của bệnh nhân → đường đi qua Lục Kinh theo thời gian.
interface ExamLite {
  id: number
  createdAt?: string | null
  /** Giờ khám thầy thuốc đặt/sửa — trục truyền biến phải theo mốc này, không theo createdAt. */
  thoiDiemKham?: string | null
  excelSyndromes?: { name: string }[] | null
}
const examHistory = ref<ExamLite[]>([])
async function loadExamHistory() {
  try {
    examHistory.value = await api.get<ExamLite[]>(`/examinations/patient/${patientId.value}`)
  } catch {
    examHistory.value = []
  }
}
type KieuTruyen = 'giu' | 'tuan' | 'viet' | 'bieu-ly' | 'am-chuyen-duong' | 'giai-o-bieu' | 'benh-lui'
type CapTinh = 'cap' | 'cap?' | 'ban-cap' | 'man' | 'giai-nhanh' | 'khong-xac-dinh' | 'thuong'
interface TrajPoint {
  id: number; ts: number; date: string; dot: number // số đợt bệnh (gap lớn = đợt mới)
  verdict: LucKinhVerdict | null
  huong: { nhan: string; loai: 'vao-ly' | 'ra-bieu' | 'giu' } | null // hướng so với mốc TRƯỚC (cùng đợt)
  moiDot: boolean
  days: number | null // số ngày TỪ lần đo LOCATED trước (không tính mốc ngoài LK) → tốc độ
  kieuTruyen: KieuTruyen | null // kiểu truyền của BƯỚC vào điểm này
  vuot: number | null // việt kinh: số kinh nhảy qua
  capTinh: CapTinh | null // tốc độ: cấp / bán cấp / mạn / hồi phục…
  gianDoan: boolean // có mốc ngoài LK xen giữa bước → hạ độ tin
  trucTrung: boolean // ONSET đợt đã ở Tam Âm (tà đánh thẳng lý)
  trucTrungBanChac: boolean // onset không có mốc mù trước → chắc chắn
}
// Cách nhau > 45 ngày coi là ĐỢT BỆNH khác (không nối truyền biến xuyên đợt — tránh nối nhầm 2 bệnh).
const GAP_DOT_MS = 45 * 24 * 3600 * 1000
const DAY_MS = 24 * 3600 * 1000
// Cặp BIỂU-LÝ (Trung kiến) theo thuTu — BẢNG CỨNG (không suy 6−thuTu vì sai cho 3↔6).
const PARTNER_THUTU: Record<number, number> = { 1: 5, 5: 1, 2: 4, 4: 2, 3: 6, 6: 3 }
const lucKinhTrajectory = computed<TrajPoint[]>(() => {
  const pts = examHistory.value
    .map((e) => ({
      id: e.id,
      ts: mocKhamMs(e),
      date: ngayKhamVN(e),
      verdict: locateLucKinh((e.excelSyndromes ?? []).map((s) => s.name), null, theKinhMap.value),
    }))
    .sort((a, b) => a.ts - b.ts) // cũ → mới
  const out: TrajPoint[] = []
  let prevExamTs = 0 // mốc thời gian lần đo BẤT KỲ trước (chỉ để dò đợt mới)
  let prevLocSlug: import('@/lib/lucKinh').KinhSlug | null = null // kinh LOCATED gần nhất
  let prevLocTs = 0 // ts của lần LOCATED gần nhất (để tính days đúng, KHÔNG tính mốc ngoài LK)
  let blindGap = false // có mốc ngoài LK xen giữa → bước kế bắc qua khoảng mù
  let dot = 0
  for (const p of pts) {
    const moiDot = prevExamTs > 0 && p.ts - prevExamTs > GAP_DOT_MS
    if (moiDot || dot === 0) { dot++; prevLocSlug = null; prevLocTs = 0; blindGap = false } // sang đợt → reset
    const slug = p.verdict?.kinh.slug ?? null
    const pt: TrajPoint = {
      id: p.id, ts: p.ts, date: p.date, dot, verdict: p.verdict, moiDot,
      huong: null, days: null, kieuTruyen: null, vuot: null, capTinh: null, gianDoan: false,
      trucTrung: false, trucTrungBanChac: true,
    }
    if (slug == null) {
      // NGOÀI LỤC KINH — mốc mù: không nối, đánh dấu để bước kế hạ độ tin. KHÔNG reset prevLoc.
      blindGap = true
      out.push(pt); prevExamTs = p.ts; continue
    }
    const tCur = KINH_META[slug].thuTu
    if (prevLocSlug == null) {
      // ONSET đợt (không có bước): cờ trực trúng nếu đã ở Tam Âm (thuTu ≥ 4)
      pt.trucTrung = tCur >= 4
      pt.trucTrungBanChac = !blindGap
    } else {
      const tPrev = KINH_META[prevLocSlug].thuTu
      const d = tCur - tPrev
      pt.huong = huongTruyen(prevLocSlug, slug)
      pt.gianDoan = blindGap
      const days = prevLocTs > 0 && p.ts > 0 ? (p.ts - prevLocTs) / DAY_MS : null
      pt.days = days
      const nhip = days != null && days > 0 ? Math.abs(d) / days : null
      if (d === 0) {
        pt.kieuTruyen = 'giu'; pt.capTinh = 'thuong'
      } else if (d < 0) {
        // RA BIỂU = HỒI PHỤC — KHÔNG bao giờ tuần/việt
        pt.kieuTruyen = PARTNER_THUTU[tPrev] === tCur && tPrev >= 4 ? 'am-chuyen-duong' : tCur === 1 ? 'giai-o-bieu' : 'benh-lui'
        pt.capTinh = days != null && days > 0 && days <= 3 && Math.abs(d) >= 2 ? 'giai-nhanh' : 'thuong'
      } else {
        // VÀO LÝ — thứ tự BẮT BUỘC: biểu-lý > tuần > việt (chặn 1→5,2→4,3→6 trước việt)
        pt.kieuTruyen = PARTNER_THUTU[tPrev] === tCur ? 'bieu-ly' : d === 1 ? 'tuan' : 'viet'
        if (pt.kieuTruyen === 'viet') pt.vuot = d - 1
        const capA = (days != null && days > 0 && days <= 3 && (Math.abs(d) >= 2 || (tPrev <= 3 && tCur >= 4))) || (nhip != null && nhip >= 1)
        pt.capTinh = days == null || days <= 0 ? 'khong-xac-dinh' : capA ? 'cap' : days <= 7 && (Math.abs(d) >= 2 || d === 1) ? 'ban-cap' : 'man'
        if (pt.gianDoan && pt.capTinh === 'cap') pt.capTinh = 'cap?'
      }
    }
    out.push(pt)
    prevLocSlug = slug; prevLocTs = p.ts; blindGap = false; prevExamTs = p.ts
  }
  return out
})
// Xu hướng tổng — CHỈ trong đợt bệnh của ca ĐANG XEM (đầu → cuối đợt đó), không xuyên đợt.
const truyenBienXuHuong = computed(() => {
  const all = lucKinhTrajectory.value
  const cur = all.find((p) => p.id === examId.value) ?? all[all.length - 1]
  if (!cur) return null
  const located = all.filter((p) => p.dot === cur.dot && p.verdict)
  if (located.length < 2) return null
  return huongTruyen(located[0]!.verdict!.kinh.slug, located[located.length - 1]!.verdict!.kinh.slug)
})
// Đường đo cho ĐỒ HÌNH — CHỈ đợt bệnh của ca đang xem (không xuyên đợt), rút gọn về lát cắt VongLucKinh cần.
const trajForWheel = computed(() => {
  const all = lucKinhTrajectory.value
  const cur = all.find((p) => p.id === examId.value) ?? all[all.length - 1]
  if (!cur) return []
  return all
    .filter((p) => p.dot === cur.dot)
    .map((p) => ({
      id: p.id,
      date: p.date,
      moiDot: p.moiDot,
      kinhSlug: p.verdict ? p.verdict.kinh.slug : null,
      huong: p.huong ? p.huong.loai : null,
      kieuTruyen: p.kieuTruyen,
      capTinh: p.capTinh,
      trucTrung: p.trucTrung,
    }))
})
// Chip KIỂU TRUYỀN cho dải timeline: tuần/giữ IM LẶNG (ca thường); việt/biểu-lý + hồi phục có nhãn.
const KIEU_CHIP: Record<string, { nhan: string; cls: string; tip: string }> = {
  'bieu-ly': { nhan: '⇌ biểu-lý', cls: 'bieuly', tip: 'Biểu-lý truyền 表裏傳 (Trung kiến) — tà hãm sang kinh tương phối, vào lý.' },
  viet: { nhan: '» việt kinh', cls: 'viet', tip: 'Việt kinh 越經傳 — truyền nhảy cách kinh, truyền nhanh, cảnh giác.' },
  'am-chuyen-duong': { nhan: 'âm→dương', cls: 'hoiphuc', tip: 'Âm chứng chuyển dương 陰證轉陽 — điềm lành, đang hồi phục.' },
  'giai-o-bieu': { nhan: 'giải ở biểu', cls: 'hoiphuc', tip: 'Tà theo mồ hôi ra, giải tại biểu — khỏi.' },
  'benh-lui': { nhan: 'bệnh lui', cls: 'hoiphuc', tip: 'Tang giảm — bệnh đang lui ra ngoài.' },
}
function kieuChip(p: TrajPoint) {
  const m = p.kieuTruyen ? KIEU_CHIP[p.kieuTruyen] : null
  if (!m) return null
  return { nhan: p.kieuTruyen === 'viet' && p.vuot ? `» vượt ${p.vuot}` : m.nhan, cls: m.cls, tip: m.tip }
}
const isCap = (p: TrajPoint) => p.capTinh === 'cap' || p.capTinh === 'cap?'
function ngayLabel(p: TrajPoint) {
  if (p.days == null) return null
  if (p.days <= 0) return 'cùng ngày'
  return `${Math.round(p.days)} ngày`
}

/** Đủ 12 tạng phủ (mã kinh ngắn → tên) để bày QUANH hình người; gắn trạng thái Bát Cương nếu có. */
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
// Tạng (lục tạng) bày bên trái · Phủ (lục phủ) bày bên phải hình người.
const organsTang = computed(() => organsWith(['Tâm', 'Bào', 'Phế', 'Can', 'Tỳ', 'Thận']))
const organsPhu = computed(() => organsWith(['Tiểu', 'Đại', 'Vị', 'Đởm', 'Bàng', 'Tam']))

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
  void loadExamHistory()
  void loadTheKinhMap()
})

// Nạp TOÀN BỘ bài thuốc (kèm chi tiết vị + tính–vị–quy-kinh). Endpoint /bai-thuoc/lite CHẶN
// limit tối đa 200/trang, nên phải PHÂN TRANG hết — nếu chỉ gọi 1 trang thì các bài xếp sau
// (theo tên A→Z) bị thiếu vị → Thang Đặc Trị & danh sách bài nguồn hụt vị. Trang 1 lấy total,
// các trang còn lại tải song song rồi gộp.
type BaiThuocLiteResp = { data?: BaiThuocFull[]; total?: number }
async function loadAllBaiThuocLite(): Promise<BaiThuocFull[]> {
  const LIMIT = 200
  const unwrap = (r: BaiThuocFull[] | BaiThuocLiteResp): BaiThuocFull[] =>
    Array.isArray(r) ? r : (r.data ?? [])
  const first = await api.get<BaiThuocFull[] | BaiThuocLiteResp>(`/bai-thuoc/lite?page=1&limit=${LIMIT}&slim=1`)
  const all: BaiThuocFull[] = unwrap(first)
  const total: number = Array.isArray(first) ? all.length : (first.total ?? all.length)
  const pages = Math.ceil(total / LIMIT)
  if (pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) =>
        api.get<BaiThuocFull[] | BaiThuocLiteResp>(`/bai-thuoc/lite?page=${i + 2}&limit=${LIMIT}&slim=1`).then(unwrap),
      ),
    )
    for (const arr of rest) all.push(...arr)
  }
  return all
}

async function loadData() {
  isLoading.value = true
  try {
    // 4 call CHẶN (nhẹ) → render View 1 (bảng đo + Bát Cương) ngay, không đợi bài thuốc.
    const [patientRes, examRes, benhListRes, phacDoRes, cauThanhRes] = await Promise.all([
      api.get<Patient>(`/patients/${patientId.value}`),
      api.get<any>(`/examinations/${examId.value}`),
      api.get<any>('/benh-dong-y'),
      api.get<any>('/phac-do-dieu-tri?slim=1'),
      api.get<any>('/benh-cau-thanh').catch(() => []),
    ])
    patient.value = patientRes
    examination.value = examRes

    const benhArr: BenhDetail[] = Array.isArray(benhListRes) ? benhListRes : benhListRes?.data ?? []
    const map = new Map<number, BenhDetail>()
    for (const b of benhArr) map.set(b.id, b)
    benhDetailsMap.value = map

    phacDoAllList.value = Array.isArray(phacDoRes) ? phacDoRes : phacDoRes?.data ?? []
    cauThanhList.value = Array.isArray(cauThanhRes) ? cauThanhRes : cauThanhRes?.data ?? []
  } catch (err: any) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }

  // Bài thuốc (~685 bài, chỉ cần cho Thang Đặc Trị ở View 2) → nạp NỀN, KHÔNG chặn render.
  baiThuocLoading.value = true
  loadAllBaiThuocLite()
    .then((arr) => {
      const btMap = new Map<number, BaiThuocFull>()
      for (const b of arr) btMap.set(b.id, b)
      baiThuocFullMap.value = btMap
    })
    .catch(() => {})
    .finally(() => {
      baiThuocLoading.value = false
    })
}

function goBack() {
  router.push({ name: 'patient-detail', params: { id: patientId.value } })
}

/** Chẩn đoán Bát cương → highlight ô liên quan ở bảng I.
 * focus: 'amDuong' | 'khi' | 'huyet' (theo mảng/cột) hoặc 'organ:<mã kinh>' (soi 1 tạng phủ). */
const batCuongFocus = ref<string | null>(null)

// Tập mã kinh đang được soi khi bấm 1 tạng phủ cụ thể (Biểu/Lý/Hàn/Nhiệt) — chỉ 1 hàng.
// Tạng phủ thuộc 1 NHÓM Bát Cương (theo độ sâu Biểu/Lý hoặc tính chất Hàn/Nhiệt; 'mixed' tính cả hai).
function organInGroup(o: OrganState, g: string): boolean {
  if (g === 'bieu') return o.depth === 'bieu' || o.depth === 'mixed'
  if (g === 'ly') return o.depth === 'ly' || o.depth === 'mixed'
  if (g === 'han') return o.temp === 'han' || o.temp === 'mixed'
  if (g === 'nhiet') return o.temp === 'nhiet' || o.temp === 'mixed'
  return false
}
// Nhóm CỐ ĐỊNH theo bộ kinh (không theo dữ liệu): Khí = 6 kinh chi trên · Huyết = 6 kinh chi dưới.
const GROUP_FIXED: Record<string, string[]> = {
  khi: ['Tiểu', 'Tâm', 'Tam', 'Bào', 'Đại', 'Phế'],
  huyet: ['Bàng', 'Thận', 'Đởm', 'Vị', 'Can', 'Tỳ'],
}
function groupOrganSet(g: string): Set<string> {
  if (GROUP_FIXED[g]) return new Set(GROUP_FIXED[g])
  const set = new Set<string>()
  for (const o of affectedOrgans.value) if (organInGroup(o, g)) set.add(o.name)
  return set
}
function focusedTieuKetSet(): Set<string> | null {
  const f = batCuongFocus.value
  if (f && f.startsWith('organ:')) return new Set([f.slice(6)])
  if (f && f.startsWith('group:')) return groupOrganSet(f.slice(6))
  return null
}

/**
 * NHẤP NHÁY các chỉ số TƯƠNG QUAN ở bảng I theo tiêu điểm Bát Cương → người xem thấy NGAY mọi số đem so.
 *  cells[mã kinh][cột] / mean / bound = 'high' (cao hơn → đỏ) · 'low' (thấp hơn → lam) · 'ref' (mốc/ngưỡng = nâu).
 *  Cột bảng đo: 1 dấu±trái · 2 trị trái · 3 avg · 4 chênh · 5 trị phải · 6 dấu±phải.
 */
type HLTone = 'high' | 'low' | 'ref'
const bcCellHL = computed(() => {
  const cells: Record<string, Record<number, HLTone>> = {}
  const stat = { upperMean: '' as HLTone | '', lowerMean: '' as HLTone | '', upperBound: '' as HLTone | '', lowerBound: '' as HLTone | '' }
  const put = (name: string, col: number, t: HLTone) => {
    ;(cells[name] ??= {})[col] = t
  }
  const f = batCuongFocus.value
  if (!f) return { cells, stat }
  const e = diagnosis.value.explain
  // ④ Khí/Huyết: TB là MỐC, từng kinh (avg) lệch trên/dưới.
  if (f === 'group:khi') {
    stat.upperMean = 'ref'
    for (const r of upperRows.value) put(r.name, 3, r.avg < upperStats.value.mean ? 'low' : r.avg > upperStats.value.mean ? 'high' : 'ref')
    return { cells, stat }
  }
  if (f === 'group:huyet') {
    stat.lowerMean = 'ref'
    for (const r of lowerRows.value) put(r.name, 3, r.avg < lowerStats.value.mean ? 'low' : r.avg > lowerStats.value.mean ? 'high' : 'ref')
    return { cells, stat }
  }
  // Hư-Thực: soi đúng các kinh "lệch" (bất kể chi trên/dưới) + mốc ngưỡng bình thường cả 2 nhóm.
  if (f === 'group:huthuc') {
    const rows = e?.huThuc?.lechRows ?? []
    if (rows.length) { stat.upperBound = 'ref'; stat.lowerBound = 'ref' }
    for (const lr of rows) { put(lr.name, 2, lr.tone); put(lr.name, 3, lr.tone); put(lr.name, 5, lr.tone) }
    return { cells, stat }
  }
  // ②③ hoặc 1 tạng: nháy CẢ trị trái · avg · trị phải của kinh đang soi (Hàn lam / Nhiệt đỏ) + NGƯỠNG (mốc nâu).
  const set = focusedTieuKetSet()
  if (set) {
    let tu = false
    let tl = false
    const flash = (r: { name: string }) => {
      const o = affectedOrgans.value.find((x) => x.name === r.name)
      const t: HLTone = !o ? 'ref' : o.temp === 'han' ? 'low' : o.temp === 'nhiet' ? 'high' : 'ref'
      put(r.name, 2, t)
      put(r.name, 3, t)
      put(r.name, 5, t)
    }
    for (const r of upperRows.value) if (set.has(r.name)) { flash(r); tu = true }
    for (const r of lowerRows.value) if (set.has(r.name)) { flash(r); tl = true }
    if (tu) stat.upperBound = 'ref'
    if (tl) stat.lowerBound = 'ref'
  }
  return { cells, stat }
})
function bcCellClass(name: string, col: number): string {
  const t = bcCellHL.value.cells[name]?.[col]
  return t ? 'bc-flash bc-flash--' + t : ''
}
function bcMeanClass(which: 'upper' | 'lower'): string {
  const t = which === 'upper' ? bcCellHL.value.stat.upperMean : bcCellHL.value.stat.lowerMean
  return t ? 'bc-flash bc-flash--' + t : ''
}
function bcBoundClass(which: 'upper' | 'lower'): string {
  const t = which === 'upper' ? bcCellHL.value.stat.upperBound : bcCellHL.value.stat.lowerBound
  return t ? 'bc-flash bc-flash--' + t : ''
}

function sectionHasTieuKetFocus(which: 'upper' | 'lower'): boolean {
  const set = focusedTieuKetSet()
  if (!set) return false
  const rows = which === 'upper' ? upperRows.value : lowerRows.value
  return rows.some((r: any) => set.has(r.name))
}

function statsRowClass(which: 'upper' | 'lower') {
  const f = batCuongFocus.value
  if (!f) return ''
  if (focusedTieuKetSet()) {
    return sectionHasTieuKetFocus(which) ? 'bc-stats--focus' : 'bc-stats--dim'
  }
  const rel =
    (which === 'upper' && f === 'khi') ||
    (which === 'lower' && f === 'huyet')
  return rel ? 'bc-stats--focus' : 'bc-stats--dim'
}

function upperRowClass(idx: number) {
  const f = batCuongFocus.value
  if (!f) return ''
  const set = focusedTieuKetSet()
  if (set) {
    const row = upperRows.value[idx]
    return row && set.has(row.name) ? 'meridian-row--focus' : 'meridian-row--dim'
  }
  return f === 'khi' ? 'meridian-row--focus' : 'meridian-row--dim'
}

function lowerRowClass(idx: number) {
  const f = batCuongFocus.value
  if (!f) return ''
  const set = focusedTieuKetSet()
  if (set) {
    const row = lowerRows.value[idx]
    return row && set.has(row.name) ? 'meridian-row--focus' : 'meridian-row--dim'
  }
  if (f === 'huyet') return 'meridian-row--focus'
  return 'meridian-row--dim'
}

function sectionTitleClass(which: 'upper' | 'lower') {
  const f = batCuongFocus.value
  if (!f) return ''
  if (focusedTieuKetSet()) {
    return sectionHasTieuKetFocus(which) ? '' : 'bc-section-title--dim'
  }
  const rel = (which === 'upper' && f === 'khi') || (which === 'lower' && f === 'huyet')
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
// Thể ĐO ĐƯỢC bổ sung cần SÁNG CÔNG THỨC cùng lúc khi bấm 1 dòng gộp (cha + con đều đo được).
const focusExtraIds = ref<number[]>([])
const showMoHinhBenhLy = ref(false)

// Có focus rule (Excel hoặc Hiện đại) — dùng để giữ logic dim/highlight chung
const anyRuleFocusActive = computed(
  () => excelFocusRuleId.value != null || modernFocusRuleId.value != null,
)

// Tên thể bệnh đang focus ở Section III (Mô Hình Bệnh). Thang Đặc Trị TỰ lọc theo thể này
// (matchedBenhIds đã tôn trọng excelFocusRuleId) → dùng để hiện chỉ báo "đang lọc theo thể: X".
const focusedTheName = computed<string | null>(() => {
  if (excelFocusRuleId.value == null) return null
  return (
    excelSyndromesList.value.find((x: { id: number; name: string }) => x.id === excelFocusRuleId.value)?.name ?? null
  )
})

// ── Bố cục 2-VIEW: state ──
// Quay lại từ Kinh Mạch 3D (gotoAcuMap kèm ?view=2) → mở đúng tab thay vì reset về tab I.
const initialView = ((): 1 | 2 | 3 => {
  const v = route.query.view
  const s = Array.isArray(v) ? v[0] : v
  return s === '1' || s === '2' || s === '3' ? (Number(s) as 1 | 2 | 3) : 1
})()
const activeView = ref<1 | 2 | 3>(initialView)

// Bấm 1 mốc trên trục Truyền Biến sẽ mở ca đo khác (?traj=1). Router luôn cuộn về đầu trang, mà khối
// Truyền Biến nằm cuối tab 3 → cuộn lại đúng chỗ vừa bấm để mạch nghiên cứu không bị đứt.
// Chờ trục vẽ xong mới cuộn (dữ liệu ca + bản đồ thể-kinh nạp bất đồng bộ), và chỉ cuộn MỘT lần.
const trajRef = ref<HTMLElement | null>(null)
const daCuonToiTraj = ref(false)
watch(
  () => [activeView.value, lucKinhTrajectory.value.length] as const,
  async () => {
    if (daCuonToiTraj.value) return
    if (route.query.traj !== '1' || activeView.value !== 3) return
    if (!lucKinhTrajectory.value.length) return
    await nextTick()
    if (!trajRef.value) return
    daCuonToiTraj.value = true
    trajRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
  },
  { immediate: true },
)

const showPatientMore = ref(false)
// Verdict Bát Cương gọn cho thanh ngữ cảnh dính (nén khối Tóm Tắt to → luôn thấy các cương).
// CHỈ 3 kết luận thật của Bát Cương: Âm-Dương (tổng cương) · Biểu-Lý (tc.viTri) · Hư-Thực.
// Khí/Huyết KHÔNG còn là 1 cương (đã hạ thành "Thể Chất" tham khảo) → tách riêng nhóm bên dưới,
// hiển thị nguyên giá trị (đã tự có tiền tố "Khí"/"Huyết"), không lặp lại nhãn.
const batCuongVerdictTokens = computed(() => {
  const d = diagnosis.value
  const tc = tongCuong.value
  const out: { key: string; label: string }[] = []
  if (tc.amDuong) out.push({ key: 'amDuong', label: tc.amDuong })
  if (tc.viTri) out.push({ key: 'bieuly', label: tc.viTri })
  if (d.huThuc && d.huThuc !== '—') out.push({ key: 'huthuc', label: d.huThuc })
  return out
})
const theChatVerdictTokens = computed(() => {
  const d = diagnosis.value
  const out: { key: string; label: string }[] = []
  if (d.khi && d.khi !== '—') out.push({ key: 'khi', label: d.khi })
  if (d.huyet && d.huyet !== '—') out.push({ key: 'huyet', label: d.huyet })
  return out
})
// Tạng phủ hiện trên thanh ngữ cảnh CHỈ lấy nhóm Lý (bệnh vào sâu) — Biểu (nông) xem ở Mục II,
// tránh liệt kê hết 12 tạng phủ gây rối mắt trên 1 dòng gọn.
const lyOrgans = computed(() => affectedOrgans.value.filter((o) => o.depth === 'ly' || o.depth === 'mixed'))

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
  const logics: string[] = []
  const pushLogic = (id: number | null, list: Array<{ id: number; logicExpression?: string }>) => {
    if (id == null) return
    const lg = list.find((x) => x.id === id)?.logicExpression
    if (lg && typeof lg === 'string') logics.push(lg)
  }
  pushLogic(excelFocusRuleId.value, excelSyndromesList.value)
  pushLogic(modernFocusRuleId.value, modernSyndromesList.value)
  // Dòng gộp (cha + con đều đo được) → sáng CẢ công thức của các thể bổ sung
  for (const eid of focusExtraIds.value) {
    pushLogic(eid, excelSyndromesList.value)
    pushLogic(eid, modernSyndromesList.value)
  }
  if (!logics.length) return []
  const refs = new Set<string>()
  for (const lg of logics) for (const r of extractExcelRefsFromLogic(lg)) refs.add(r)
  return [...refs].map(refToHint).filter((h): h is ExcelHint => h !== null)
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
  focusExtraIds.value = []
  excelFocusRuleId.value = excelFocusRuleId.value === id ? null : id
}
// Bấm 1 node ở mục III: focus thể chính + sáng công thức các thể đo-được đi kèm (extraIds).
function focusSyndNode(node: SyndNode) {
  batCuongFocus.value = null
  const isActive = (node.kind === 'modern' ? modernFocusRuleId.value : excelFocusRuleId.value) === node.item.id
  if (node.kind === 'modern') {
    excelFocusRuleId.value = null
    modernFocusRuleId.value = isActive ? null : node.item.id
  } else {
    modernFocusRuleId.value = null
    excelFocusRuleId.value = isActive ? null : node.item.id
  }
  focusExtraIds.value = isActive ? [] : node.extraIds
}

function toggleModernFocus(id: number) {
  batCuongFocus.value = null
  excelFocusRuleId.value = null
  focusExtraIds.value = []
  modernFocusRuleId.value = modernFocusRuleId.value === id ? null : id
}

function toggleBatCuongFocus(key: string) {
  excelFocusRuleId.value = null
  modernFocusRuleId.value = null
  focusExtraIds.value = []
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

/* --- In phiếu kết quả khám bệnh cho bệnh nhân cầm về --- */
function escHtml(s: unknown): string {
  return String(s ?? '').replace(/[&<>"]/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;',
  )
}

function meridianRowsHtml(rows: any[]): string {
  return rows
    .map((r) => {
      const lCls = r.leftSign === '+' ? 'pos' : r.leftSign === '-' ? 'neg' : ''
      const rCls = r.rightSign === '+' ? 'pos' : r.rightSign === '-' ? 'neg' : ''
      const dCls = r.diff > 0 ? 'pos' : r.diff < 0 ? 'neg' : ''
      return `<tr>
        <td class="k">${escHtml(r.name)}</td>
        <td class="${lCls}">${escHtml(r.leftSign)}</td>
        <td>${fmt(r.left, 1)}</td>
        <td class="muted">${fmt(r.avg, 2)}</td>
        <td class="${dCls}">${r.diff > 0 ? '+' : ''}${fmt(r.diff, 2)}</td>
        <td>${fmt(r.right, 1)}</td>
        <td class="${rCls}">${escHtml(r.rightSign)}</td>
        <td>${fmt(r.absDiff, 1)}</td>
      </tr>`
    })
    .join('')
}

function printPhieuKetQua() {
  if (!patient.value) return
  const p = patient.value
  const ex = examDisplay.value
  const dg = diagnosis.value
  const tc = tongCuong.value
  const organs = affectedOrgans.value
  const cd = savedChanDoan.value
  const dash = (v: unknown) => (v != null && String(v).trim() ? escHtml(v) : '—')

  const dongYModels = excelSyndromesList.value as Array<{ name: string; outputCell?: string }>
  const modernModels = modernSyndromesList.value as Array<{ name: string; outputCell?: string }>
  const baiThuoc = matchedBaiThuocList.value

  const colHead =
    '<tr><th>Kinh</th><th>±</th><th>Trái</th><th>TB</th><th>Lệch</th><th>Phải</th><th>±</th><th>|Δ|</th></tr>'

  const modelInline = (arr: Array<{ name: string }>, emptyMsg: string) =>
    arr.length
      ? arr.map((m) => escHtml(m.name)).join(' · ')
      : `<span class="empty">${emptyMsg}</span>`

  // Nhóm phương huyệt theo phương pháp (Châm/Cứu/Bấm huyệt…); mỗi nhóm = 1 nhãn + dãy CHIP huyệt cuộn
  // dòng cho gọn. Ghi chú kỹ thuật (nếu có) gom 1 dòng nhỏ dưới nhóm thay vì mỗi huyệt 1 dòng.
  const huyetHtml = phuongHuyetGroups.value.length
    ? `<div class="ph-groups">${phuongHuyetGroups.value
        .map((g) => {
          const chips = g.items
            .map((h) => {
              const ten = h.huyetVi?.ten_huyet || `#${h.huyetVi?.idHuyet ?? ''}`
              const ma = h.huyetVi?.ma_huyet ? ` <span class="ph-code">${escHtml(h.huyetVi.ma_huyet)}</span>` : ''
              return `<span class="ph-chip">${escHtml(ten)}${ma}</span>`
            })
            .join('')
          const notes = g.items
            .filter((h) => h.ghi_chu_ky_thuat && String(h.ghi_chu_ky_thuat).trim())
            .map((h) => `${escHtml(h.huyetVi?.ten_huyet || '')}: ${escHtml(h.ghi_chu_ky_thuat)}`)
          const noteLine = notes.length ? `<div class="ph-note">Ghi chú — ${notes.join(' · ')}</div>` : ''
          return `<div class="ph-grp"><span class="ph-grp-m">${escHtml(g.method)} <i>${g.items.length}</i></span>${chips}${noteLine}</div>`
        })
        .join('')}</div>`
    : '<span class="empty">Chưa có phương huyệt cho các thể bệnh đo được.</span>'

  const baiThuocHtml = baiThuoc.length
    ? `<div class="row"><b>Bài thuốc gợi ý:</b> ${baiThuoc.map((b) => escHtml(b.ten_bai_thuoc)).join(' · ')}</div>`
    : ''

  // Triệu chứng bệnh nhân đã xác nhận "có" ở bước Hỏi & Chẩn đoán (tra_loi === 'co'),
  // gom theo nhóm + hiển thị dạng thẻ cho dễ đọc (giống bảng "Đối chiếu triệu chứng").
  const cdSyms =
    (examination.value?.chanDoan?.trieu_chung as
      | Array<{ ten?: string; nhom?: string | null; tra_loi?: string }>
      | undefined) ?? []
  const confirmedSyms = cdSyms.filter((t) => t && t.tra_loi === 'co' && t.ten)
  const symGroups = new Map<string, string[]>()
  for (const s of confirmedSyms) {
    const slug = (s.nhom && String(s.nhom).trim()) || 'khac'
    const arr = symGroups.get(slug) ?? []
    arr.push(String(s.ten))
    symGroups.set(slug, arr)
  }
  // Sắp xếp nhóm theo thứ tự chuẩn (PB_NHOM_TC_ORDER); nhóm lạ đẩy xuống cuối.
  const symOrder = [...symGroups.keys()].sort((a, b) => {
    const ia = PB_NHOM_TC_ORDER.indexOf(a)
    const ib = PB_NHOM_TC_ORDER.indexOf(b)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
  })
  const symGroupsHtml = symOrder
    .map((slug) => {
      const items = symGroups.get(slug) ?? []
      const label = PB_NHOM_TC[slug] ?? slug
      return `<div class="sym-group"><span class="sym-group-name">${escHtml(label)}</span><div class="sym-tags">${items
        .map((t) => `<span class="sym-tag">${escHtml(t)}</span>`)
        .join('')}</div></div>`
    })
    .join('')
  const confirmedSymHtml = cd
    ? confirmedSyms.length
      ? `<div class="sym-block"><div class="sym-head">Triệu chứng bệnh nhân xác nhận có (${confirmedSyms.length}):</div><div class="sym-cols">${symGroupsHtml}</div></div>`
      : '<div class="row"><b>Triệu chứng xác nhận:</b> <span class="empty">không ghi nhận</span></div>'
    : '<div class="row"><span class="empty">Chưa thực hiện hỏi &amp; chẩn đoán bệnh nhân.</span></div>'

  // ===== Bát Cương: tóm tắt giàu như màn hình (Âm/Dương · Biểu/Lý · Hàn/Nhiệt · Khí/Huyết + vì sao) =====
  const numF = (n: number) => String(n).replace('.', ',')
  // Âm-Dương (tổng cương) suy từ ma trận Hàn·Nhiệt × Hư·Thực — câu giải thích lấy thẳng từ tongCuong.
  const amWhy = tc.reason
  // Hư-Thực: cương ĐỘC LẬP (biên độ/diện rộng phản ứng toàn thân), KHÔNG còn gắn Khí/Huyết —
  // xem công thức đầy đủ ở diagnosis computed. Khí/Huyết ở trên giữ lại chỉ để tham khảo.
  const huThucWhy = (() => {
    const e = dg.explain?.huThuc
    if (!e) return ''
    if (e.lechCount === 0) return `0/${e.tongDo} kinh lệch khỏi khoảng bình thường → Bình thường.`
    return `${e.lechCount}/${e.tongDo} kinh lệch khỏi khoảng bình thường, tổng lệch ${numF(e.totalLech)} (ngưỡng ~${numF(e.nguong)}).`
  })()
  const toneCls = (v: string) => {
    if (!v) return 'tone-none'
    // toLowerCase(): "Hư"/"Thực" đứng đầu câu viết hoa (khác "Khí hư"/"Khí thịnh" viết thường giữa câu).
    const s = v.toLowerCase()
    if (s.includes('thịnh') || s.includes('thực')) return 'tone-thuc'
    if (s.includes('hư') && !s.includes('thường')) return 'tone-hu'
    return 'tone-neutral'
  }
  // Nhãn cột đã ghi rõ "Khí"/"Huyết" — bỏ tiền tố trùng trong giá trị ("Khí hư" → "hư").
  const stripLabel = (v: string, label: string) => (v && v.startsWith(label + ' ') ? v.slice(label.length + 1) : v)
  const organChip = (o: OrganState) =>
    `<span class="o-chip o-${o.temp}">${escHtml(o.organ)}${o.side ? `<i>${escHtml(o.side)}</i>` : ''}</span>`
  const chipsOr = (list: OrganState[]) =>
    list.length ? list.map(organChip).join('') : '<span class="empty">—</span>'
  const bieuL = organs.filter((o) => o.depth === 'bieu' || o.depth === 'mixed')
  const lyL = organs.filter((o) => o.depth === 'ly' || o.depth === 'mixed')
  const hanL = organs.filter((o) => o.temp === 'han' || o.temp === 'mixed')
  const nhietL = organs.filter((o) => o.temp === 'nhiet' || o.temp === 'mixed')

  const batCuongHtml = `
    <div class="bc-verdicts">
      <div class="bcv"><span class="bcv-l">Tổng cương · Âm — Dương</span><span class="bcv-v">${dash(tc.amDuong)}${tc.hoiChung ? ` <small>(${escHtml(tc.hoiChung)})</small>` : ''}</span></div>
      <div class="bcv"><span class="bcv-l">Hư — Thực</span><span class="bcv-v ${toneCls(dg.huThuc)}">${dg.huThuc || '—'}</span></div>
    </div>
    <div class="bc-verdicts">
      <div class="bcv"><span class="bcv-l">Thể Chất · Khí</span><span class="bcv-v ${toneCls(dg.khi)}">${escHtml(stripLabel(dg.khi, 'Khí')) || '—'}</span></div>
      <div class="bcv"><span class="bcv-l">Thể Chất · Huyết</span><span class="bcv-v ${toneCls(dg.huyet)}">${escHtml(stripLabel(dg.huyet, 'Huyết')) || '—'}</span></div>
    </div>
    ${amWhy ? `<div class="bc-why">${escHtml(amWhy)}</div>` : ''}
    ${huThucWhy ? `<div class="bc-why">${escHtml(huThucWhy)}</div>` : ''}
    <div class="bc-rows">
      <div class="bc-row"><span class="bc-row-l">② Biểu (nông)</span><span class="bc-row-c">${chipsOr(bieuL)}</span></div>
      <div class="bc-row"><span class="bc-row-l">② Lý (sâu)</span><span class="bc-row-c">${chipsOr(lyL)}</span></div>
      <div class="bc-row"><span class="bc-row-l">③ Hàn (lạnh)</span><span class="bc-row-c">${chipsOr(hanL)}</span></div>
      <div class="bc-row"><span class="bc-row-l">③ Nhiệt (nóng)</span><span class="bc-row-c">${chipsOr(nhietL)}</span></div>
    </div>
    <div class="bc-legend"><span class="o-chip o-han">Hàn</span> lạnh · <span class="o-chip o-nhiet">Nhiệt</span> nóng · <span class="o-chip o-mixed">cả hai</span> · Biểu = nông, Lý = sâu · Hư = suy yếu, Thực = dư thừa · Thể Chất: Khí = chi trên, Huyết = chi dưới</div>`

  const statsLine = (s: ReturnType<typeof calculateBounds>) =>
    `Bình quân ${fmt(s.mean, 2)} · Khoảng bình thường ${fmt(s.lowerBound, 2)}–${fmt(s.upperBound, 2)}`

  // Chụp ĐỒ HÌNH kinh lạc đưa vào phiếu in. Ưu tiên 4 GÓC xoay của hình 3D (như xoay trên màn hình);
  // nếu chưa sẵn sàng → rơi về 1 ảnh canvas, rồi tới thông báo (đã bỏ đồ hình 2D dự phòng).
  const figBlock = (() => {
    const VIEW_CAPS = ['Mặt trước', 'Bên phải', 'Mặt sau', 'Bên trái']
    let views: string[] = []
    try {
      views = (batCuongFigureRef.value?.captureViews?.(4) ?? []).filter(
        (u): u is string => typeof u === 'string' && u.length > 2000,
      )
    } catch {
      /* component chưa sẵn sàng → fallback bên dưới */
    }
    if (views.length) {
      return `<div class="bc-fig-grid">${views
        .map(
          (u, i) =>
            `<div class="bc-fig-cell"><img class="bc-fig-img" src="${u}" alt="Đồ hình góc ${i + 1}" /><span class="bc-fig-cap">${VIEW_CAPS[i] ?? 'Góc ' + (i + 1)}</span></div>`,
        )
        .join('')}</div>`
    }
    const canvas = document.querySelector('.bcf3d-host canvas') as HTMLCanvasElement | null
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      try {
        const url = canvas.toDataURL('image/png')
        if (url && url.length > 2000)
          return `<div class="bc-fig-grid"><div class="bc-fig-cell bc-fig-cell--solo"><img class="bc-fig-img" src="${url}" alt="Đồ hình kinh lạc Bát Cương" /></div></div>`
      } catch {
        /* canvas tainted / mất context → rơi về SVG hoặc thông báo */
      }
    }
    return '<div class="bc-fig-empty">Cuộn tới mục Bát Cương cho đồ hình hiện đủ rồi in lại để đưa hình kinh lạc vào phiếu.</div>'
  })()

  // Cột tạng phủ (lục tạng trái · lục phủ phải) vây quanh hình — tái tạo y component BatCuongOrgans:
  // mỗi tạng = icon SVG (ORGAN_ART) + tên + nhãn Hàn/Nhiệt theo trạng thái đo.
  const ORGAN_TEMP_COLOR: Record<string, string> = { han: '#2f6690', nhiet: '#c0452a', mixed: '#8a4fbf' }
  const tempLabelP = (t: string) => (t === 'han' ? 'Hàn' : t === 'nhiet' ? 'Nhiệt' : 'Hàn+Nhiệt')
  const organCard = (o: { organ: string; state: OrganState | null }) => {
    const paths = (ORGAN_ART[o.organ] || [])
      .map(
        (p) =>
          `<path d="${p.d}" fill="${p.fill || 'none'}" opacity="${p.opacity ?? 1}" stroke="${p.stroke || 'none'}" stroke-width="${p.sw || 0}" stroke-linejoin="round" stroke-linecap="round"/>`,
      )
      .join('')
    const temp = o.state?.temp
    const tag = temp ? `<span class="og-tag" style="background:${ORGAN_TEMP_COLOR[temp]}">${tempLabelP(temp)}</span>` : ''
    const side = o.state?.side ? `<small>${escHtml(o.state.side)}</small>` : ''
    const cls = temp ? `og-card og-${temp}` : 'og-card og-off'
    return `<div class="${cls}"><svg class="og-svg" viewBox="0 0 64 64" aria-hidden="true">${paths}</svg><span class="og-name">${escHtml(o.organ)}${side}</span>${tag}</div>`
  }
  const organCol = (list: { organ: string; state: OrganState | null }[]) =>
    `<div class="og-col">${list.map(organCard).join('')}</div>`

  const printedAt = new Date().toLocaleString('vi-VN')

  const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Phiếu kết quả khám bệnh - ${escHtml(p.fullName)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", Times, "Liberation Serif", serif; color: #1f2937; margin: 0; padding: 0; font-size: 8.5px; line-height: 1.32; -webkit-print-color-adjust: exact; print-color-adjust: exact; -webkit-user-select: none; user-select: none; }
  h1, h2, h3 { margin: 0; }
  .sheet { padding: 0; }
  .doc-head { text-align: center; border-bottom: 1.5px solid #78350f; padding-bottom: 2px; margin-bottom: 3px; }
  .clinic { font-size: 8.5px; font-weight: 700; color: #78350f; letter-spacing: .03em; text-transform: uppercase; }
  .doc-title { font-size: 12.5px; font-weight: 800; color: #1f2937; margin-top: 1px; }
  .doc-sub { font-size: 7.5px; color: #6b7280; }
  .pinfo { width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: 8px; }
  .pinfo td { padding: 1px 4px; vertical-align: top; }
  .pinfo .lbl { color: #6b7280; white-space: nowrap; }
  .pinfo .v { font-weight: 600; }
  .sec-h { font-size: 8.5px; font-weight: 800; color: #78350f; text-transform: uppercase; border-left: 3px solid #b45309; padding-left: 5px; margin: 4px 0 2px; }
  .sec-h--main { font-size: 10px; }
  .sec-h--sub { font-size: 7.5px; opacity: .85; }
  .md-wrap { display: flex; gap: 6px; }
  .md-col { flex: 1; min-width: 0; }
  table.md { width: 100%; border-collapse: collapse; font-size: 7px; }
  table.md th, table.md td { border: 1px solid #d1d5db; padding: 1px 2px; text-align: center; }
  table.md th { background: #f3f4f6; font-weight: 700; }
  table.md td.k { text-align: left; font-weight: 700; }
  .tbl-cap { font-weight: 700; font-size: 7.5px; background: #fafaf9; padding: 1px 4px; border: 1px solid #d1d5db; border-bottom: none; }
  .pos { color: #92400e; font-weight: 700; }
  .neg { color: #1d4ed8; font-weight: 700; }
  .muted { color: #6b7280; }
  .dg-grid { display: flex; gap: 5px; margin-bottom: 3px; }
  .dg-card { flex: 1; border: 1px solid #e7e5e4; border-radius: 4px; padding: 2px 6px; }
  .dg-card .l { font-size: 7px; text-transform: uppercase; color: #6b7280; font-weight: 700; }
  .dg-card .v { font-size: 9px; font-weight: 700; color: #78350f; }
  .tk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
  .tk { margin: 1px 0; font-size: 8px; }
  .tk b { color: #78350f; }
  .row { margin: 2px 0; }
  .dx-box { border: 1.5px solid #d4a373; border-radius: 5px; padding: 4px 8px; background: #fffdf7; font-size: 9px; }
  .dx-box .row { margin: 2px 0; }
  .dx-model { margin-bottom: 2px; }
  .dx-model-l { font-size: 6.5px; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: .02em; }
  .dx-model-v { font-size: 11px; font-weight: 800; color: #78350f; line-height: 1.2; }
  .dx-conc { margin: 3px 0; line-height: 1.25; }
  .dx-conc-l { color: #6b7280; font-weight: 600; }
  .dx-conc-v { font-weight: 700; color: #166534; font-size: 9.5px; }
  .sym-block { margin: 3px 0 0; }
  .sym-head { font-weight: 700; margin-bottom: 2px; }
  .sym-cols { column-count: 3; column-gap: 8px; }
  .sym-group { break-inside: avoid; page-break-inside: avoid; margin: 0 0 2px; }
  .sym-group-name { display: block; font-size: 6.6px; font-weight: 700; color: #b45309; margin-bottom: 1px; }
  .sym-tags { display: flex; flex-wrap: wrap; gap: 1px 2px; }
  .sym-tag { display: inline-block; background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; border-radius: 3px; padding: 0 2px; font-size: 6.2px; line-height: 1.35; white-space: nowrap; }
  .ph-list { column-count: 2; column-gap: 12px; }
  .ph-item { font-size: 7px; line-height: 1.3; padding: 0; margin-bottom: 1px; break-inside: avoid; page-break-inside: avoid; }
  .ph-name { color: #78350f; }
  .ph-k { color: #6b7280; font-weight: 600; }
  .empty { color: #9ca3af; font-style: italic; }
  .tbl-sub { font-size: 6.3px; color: #6b7280; padding: 1px 4px; border: 1px solid #d1d5db; border-top: none; background: #fff; }
  .md-foot { margin-top: 2px; font-size: 7px; color: #6b7280; }
  .md-foot b { color: #78350f; }
  /* Bát Cương — dải đầy đủ: cột tạng phủ 2 bên + khung 4 góc hình + tóm tắt bên dưới */
  .bc-band { display: flex; gap: 5px; align-items: stretch; margin-bottom: 3px; }
  .og-col { display: flex; flex-direction: column; gap: 2px; flex: 0 0 15mm; justify-content: center; }
  .og-card { display: flex; flex-direction: column; align-items: center; padding: 1px; border: 1px solid #e5e0d8; border-radius: 4px; background: #fff; }
  .og-svg { width: 18px; height: 18px; display: block; }
  .og-name { font-size: 6.5px; font-weight: 700; color: #374151; line-height: 1.1; text-align: center; }
  .og-name small { font-weight: 500; color: #9ca3af; }
  .og-tag { font-size: 5.6px; font-weight: 700; color: #fff; padding: 0 4px; border-radius: 999px; line-height: 1.5; margin-top: 1px; }
  .og-han { border-color: #6e9ec4; }
  .og-nhiet { border-color: #d98a73; }
  .og-mixed { border-color: #b48ad6; }
  .og-off { opacity: .82; }
  .og-off .og-svg { filter: grayscale(.35); }
  .bc-fig-frame { flex: 1; min-width: 0; border: 1px solid #e7e5e4; border-radius: 5px; background: #eef1f4; padding: 2px; display: flex; align-items: center; }
  .bc-fig-frame > * { width: 100%; }
  /* 4 góc xếp 1 HÀNG NGANG (thay vì 2×2) → khối hình thấp hẳn, phiếu lọt 1 trang A4 */
  .bc-fig-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; }
  .bc-fig-cell { min-width: 0; text-align: center; }
  .bc-fig-cell--solo { grid-column: 1 / -1; }
  .bc-fig-img { width: 100%; height: auto; max-height: 46mm; object-fit: contain; display: block; border: 1px solid #d6dde4; border-radius: 4px; background: #fff; }
  .bc-fig-cap { display: block; font-size: 6px; color: #6b7280; font-weight: 600; margin-top: 1px; }
  .bc-fig-svg svg { width: 100%; max-height: 60mm; height: auto; display: block; }
  .bc-fig-empty { font-size: 6.5px; color: #9ca3af; font-style: italic; border: 1px dashed #d1d5db; border-radius: 4px; padding: 6px; text-align: center; line-height: 1.4; }
  .bc-info { min-width: 0; margin-top: 1px; }
  /* Bát Cương — kết luận lớn + tạng phủ tô màu nóng/lạnh */
  .bc-verdicts { display: flex; gap: 5px; margin-bottom: 2px; }
  .bcv { flex: 1; border: 1px solid #e7e5e4; border-radius: 4px; padding: 2px 6px; text-align: center; background: #fffdf7; }
  .bcv-l { display: block; font-size: 6px; text-transform: uppercase; color: #6b7280; font-weight: 700; }
  .bcv-v { font-size: 9.5px; font-weight: 800; color: #78350f; }
  .bc-why { font-size: 6.4px; font-style: italic; color: #6b7280; line-height: 1.35; }
  .bc-rows { margin-top: 2px; }
  .bc-row { display: flex; gap: 4px; align-items: baseline; margin: 1px 0; }
  .bc-row-l { flex: 0 0 66px; font-size: 6.8px; font-weight: 700; color: #b45309; }
  .bc-row-c { flex: 1; min-width: 0; }
  .o-chip { display: inline-block; border-radius: 999px; padding: 0 5px; margin: 1px; font-size: 6.6px; line-height: 1.55; border: 1px solid #d1d5db; white-space: nowrap; }
  .o-chip i { font-style: normal; opacity: .6; margin-left: 2px; }
  .o-han { background: #eef4f8; border-color: #9bbbd2; color: #1e4258; }
  .o-nhiet { background: #fbeeea; border-color: #dba99a; color: #7a2c1a; }
  .o-mixed { background: linear-gradient(90deg,#eef4f8 0 50%,#fbeeea 50% 100%); border-color: #c0a0a0; color: #3a3a3a; }
  .tone-hu { color: #2f6690; }
  .tone-thuc { color: #c0452a; }
  .tone-neutral, .tone-none { color: #6b7280; }
  .bc-legend { margin-top: 2px; font-size: 6px; color: #9ca3af; }
  .bc-legend .o-chip { font-size: 5.6px; padding: 0 3px; }
  /* Phương huyệt — nhãn phương pháp + chip huyệt cuộn dòng (gọn) */
  .ph-groups { display: flex; flex-direction: column; gap: 2px; }
  .ph-grp { break-inside: avoid; page-break-inside: avoid; line-height: 1.6; }
  .ph-grp-m { display: inline-block; background: #fef3e2; color: #b45309; border: 1px solid #f0d6b0; border-radius: 999px; padding: 0 6px; font-size: 6.6px; font-weight: 800; margin-right: 3px; vertical-align: middle; }
  .ph-grp-m i { font-style: normal; color: #b08968; font-weight: 600; }
  .ph-chip { display: inline-block; background: #faf7f2; border: 1px solid #e4dcd0; border-radius: 3px; padding: 0 4px; margin: 1px; font-size: 6.6px; color: #44372a; white-space: nowrap; vertical-align: middle; }
  .ph-code { color: #9ca3af; font-weight: 600; }
  .ph-note { font-size: 6px; color: #6b7280; font-style: italic; margin: 0 0 1px 2px; line-height: 1.35; }
  .sign-row { display: flex; justify-content: space-around; margin-top: 4px; }
  .sign-box { text-align: center; width: 45%; }
  .sign-box .role { font-weight: 700; font-size: 7.5px; }
  .sign-box .hint { font-size: 6.5px; color: #6b7280; }
  .sign-space { height: 14px; }
  .foot { margin-top: 4px; font-size: 6.5px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 2px; }
  @page { size: A4 portrait; margin: 10mm; }
  @media screen { .sheet { width: 210mm; min-height: 297mm; margin: 8px auto; padding: 10mm; box-shadow: 0 0 6px rgba(0,0,0,.2); } }
</style>
</head>
<body>
<div class="sheet">
  <div class="doc-head">
    <div class="clinic">Phòng khám Y Học Cổ Truyền</div>
    <div class="doc-title">PHIẾU KẾT QUẢ KHÁM BỆNH</div>
    <div class="doc-sub">Mã phiếu ${escHtml(ex.ticketNumber)} · Ngày khám ${escHtml(ex.date)} ${escHtml(ex.time)}</div>
  </div>

  <table class="pinfo">
    <tr>
      <td class="lbl">Họ tên</td><td class="v">${dash(p.fullName)}</td>
      <td class="lbl">Tuổi</td><td class="v">${dash(getAge(p.dateOfBirth))}</td>
      <td class="lbl">Giới</td><td class="v">${dash(p.gender)}</td>
      <td class="lbl">HA</td><td class="v">120/90</td>
    </tr>
    <tr>
      <td class="lbl">Địa chỉ</td><td class="v" colspan="5">${dash(p.address)}</td>
    </tr>
  </table>

  <div class="sec-h">I. Kết quả đo kinh lạc</div>
  <div class="md-wrap">
    <div class="md-col">
      <div class="tbl-cap">Chi trên</div>
      <table class="md"><thead>${colHead}</thead><tbody>${meridianRowsHtml(upperRows.value)}</tbody></table>
      <div class="tbl-sub">${statsLine(upperStats.value)}</div>
    </div>
    <div class="md-col">
      <div class="tbl-cap">Chi dưới</div>
      <table class="md"><thead>${colHead}</thead><tbody>${meridianRowsHtml(lowerRows.value)}</tbody></table>
      <div class="tbl-sub">${statsLine(lowerStats.value)}</div>
    </div>
  </div>
  <div class="md-foot">Chênh bình quân chi trên – chi dưới: <b>${fmt(Math.abs(upperStats.value.mean - lowerStats.value.mean), 2)}</b> · càng nhỏ càng cân bằng trên – dưới. (Dấu <span class="pos">+</span> = cao hơn bình thường, <span class="neg">−</span> = thấp hơn)</div>

  <div class="sec-h">II. Kết luận Bát Cương (8 cương lĩnh)</div>
  <div class="bc-band">
    ${organCol(organsTang.value)}
    <div class="bc-fig-frame">${figBlock}</div>
    ${organCol(organsPhu.value)}
  </div>
  <div class="bc-info">${batCuongHtml}</div>

  <div class="sec-h sec-h--main">III. Mô hình bệnh lý &amp; Chẩn đoán</div>
  <div class="dx-box">
    <div class="dx-model"><div class="dx-model-l">Mô hình bệnh Đông Y</div><div class="dx-model-v">${modelInline(dongYModels, 'Không có mô hình khớp.')}</div></div>
    <div class="dx-model"><div class="dx-model-l">Mô hình bệnh Y học hiện đại</div><div class="dx-model-v">${modelInline(modernModels, 'Không có mô hình khớp.')}</div></div>
    ${cd ? `<div class="dx-conc"><span class="dx-conc-l">Kết luận chẩn đoán:</span> <span class="dx-conc-v">${escHtml(cd.ket_luan)}</span></div>` : ''}
    ${confirmedSymHtml}
  </div>

  <div class="sec-h sec-h--sub">IV. Phương huyệt — gợi ý tự day bấm</div>
  ${huyetHtml}
  ${baiThuocHtml}

  <div class="sign-row">
    <div class="sign-box">
      <div class="role">Bệnh nhân</div>
      <div class="hint">(Ký, ghi rõ họ tên)</div>
      <div class="sign-space"></div>
    </div>
    <div class="sign-box">
      <div class="role">Bác sĩ điều trị</div>
      <div class="hint">(Ký, ghi rõ họ tên)</div>
      <div class="sign-space"></div>
    </div>
  </div>

  <div class="foot">Phiếu in lúc ${escHtml(printedAt)} · Kết quả mang tính tham khảo, vui lòng tuân thủ hướng dẫn của bác sĩ.</div>
</div>
  <script>window.onload=function(){setTimeout(function(){window.print()},120)}<\/script>
</body>
</html>`

  const w = window.open('', '_blank', 'width=900,height=1200')
  if (!w) {
    alert('Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép pop-up cho trang này rồi thử lại.')
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
  w.focus()
}

// Khởi tạo đơn thuốc TÙY CHỈNH khi có dữ liệu: nạp đơn đã lưu (nếu có) hoặc mặc định TÍCH HẾT
// + liều gợi ý. ĐẶT Ở CUỐI setup: watch đọc `tongHopViThuoc` (→ matchedBenhIds → excelFocusRuleId)
// một lần lúc đăng ký; tới đây excelFocusRuleId đã khai báo nên không còn lỗi TDZ.
watch(tongHopViThuoc, (items) => {
  if (dtInited.value || !items.length) return
  const saved = examination.value?.donThuoc
  const chon = new Set<string>()
  const lieu: Record<string, string> = {}
  if (saved?.items?.length) {
    const savedMap = new Map<string, { chon?: boolean; lieu_luong?: string | null }>(
      saved.items.map((s: { id_vi_thuoc: number | null; ten?: string; chon?: boolean; lieu_luong?: string | null }) => [
        s.id_vi_thuoc != null ? 'id:' + s.id_vi_thuoc : 'ten:' + String(s.ten || '').toLowerCase(),
        s,
      ]),
    )
    for (const it of items) {
      const s = savedMap.get(it.key)
      if (s) {
        if (s.chon !== false) chon.add(it.key)
        if (s.lieu_luong) lieu[it.key] = s.lieu_luong
      } else {
        chon.add(it.key) // vị mới xuất hiện sau lần lưu → tích mặc định
        if (it.lieu_goi_y) lieu[it.key] = it.lieu_goi_y
      }
    }
    dtGhiChu.value = saved.ghi_chu || ''
  } else {
    for (const it of items) {
      chon.add(it.key)
      if (it.lieu_goi_y) lieu[it.key] = it.lieu_goi_y
    }
  }
  dtChon.value = chon
  dtLieu.value = lieu
  dtInited.value = true
})

// ĐỊNH VỊ (Tab 3): nạp pháp trị theo bài thuốc của thể bệnh khớp. ĐẶT Ở CUỐI setup — source đọc
// matchedBaiThuocList → matchedBenhIds → excelFocusRuleId (khai báo phía trên nhưng SAU khối định vị);
// tới đây đã init nên đăng ký watch (kể cả immediate, đọc source 1 lần) không còn lỗi TDZ (trắng trang).
watch(
  () => matchedBaiThuocList.value.map((b) => b.id).join(','),
  () => loadDinhVi(),
  { immediate: true },
)
</script>

<template>
  <div class="meridian-results-page">
    <!-- Header Area -->
    <div class="page-header">
      <button class="back-btn" @click="goBack">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/></svg>
        <span>Quay lại hồ sơ</span>
      </button>
      
      <div v-if="patient" class="exam-summary-row">
        <div class="exam-summary">
          <h1 class="page-title">Kết quả Khám bệnh - {{ examDisplay.ticketNumber }}</h1>
          <div class="exam-meta">
            <span>Bệnh nhân: <strong>{{ patient.fullName }}</strong></span>
            <span class="divider">|</span>
            <span>Ngày khám: {{ examDisplay.date }} {{ examDisplay.time }}</span>
          </div>
        </div>
        <div class="print-btns">
          <button
            type="button"
            class="print-btn"
            title="In phiếu kết quả khám bệnh cho bệnh nhân"
            @click="printPhieuKetQua"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6 2.5A1.5 1.5 0 0 0 4.5 4v2H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h.5v1.5A1.5 1.5 0 0 0 6 17h8a1.5 1.5 0 0 0 1.5-1.5V14h.5a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-.5V4A1.5 1.5 0 0 0 14 2.5H6ZM14 6H6V4h8v2Zm0 6H6v3.5h8V12Zm1.5-3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/>
            </svg>
            <span>In phiếu kết quả</span>
          </button>
          <button
            v-if="matchedPhuongHuyetList.length"
            type="button"
            class="print-btn print-btn--acu"
            title="In phiếu châm huyệt riêng — kèm hình vị trí từng huyệt"
            @click="inPhieuChamHuyet()"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 2a1 1 0 0 1 1 1v1.06A6.002 6.002 0 0 1 15.94 9H17a1 1 0 1 1 0 2h-1.06A6.002 6.002 0 0 1 11 15.94V17a1 1 0 1 1-2 0v-1.06A6.002 6.002 0 0 1 4.06 11H3a1 1 0 1 1 0-2h1.06A6.002 6.002 0 0 1 9 4.06V3a1 1 0 0 1 1-1Zm0 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2.5A1.5 1.5 0 1 1 10 11.5a1.5 1.5 0 0 1 0-3Z"/>
            </svg>
            <span>In phiếu châm huyệt</span>
          </button>
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
      <!-- ═══ Thanh ngữ cảnh DÍNH: bệnh nhân gọn + verdict Bát Cương + chip lọc ═══ -->
      <div class="mr-ctxbar">
        <div class="mr-ctx-patient">
          <strong class="mr-ctx-name">{{ patient.fullName }}</strong>
          <span class="mr-ctx-meta">{{ getAge(patient.dateOfBirth) }} · {{ patient.gender || '—' }} · {{ examDisplay.ticketNumber }}</span>
          <button type="button" class="mr-ctx-more" :aria-expanded="showPatientMore" title="Thêm thông tin bệnh nhân" @click="showPatientMore = !showPatientMore">ⓘ</button>
        </div>
        <div class="mr-verdict">
          <span class="mr-vd-label">Bát Cương</span>
          <button v-for="t in batCuongVerdictTokens" :key="t.key" type="button" class="mr-vd-badge" title="Xem chi tiết ở Mục II" @click="activeView = 1">{{ t.label }}</button>
          <span v-if="!batCuongVerdictTokens.length" class="mr-vd-empty">—</span>
          <template v-if="theChatVerdictTokens.length">
            <span class="mr-vd-sep">Thể chất</span>
            <button v-for="t in theChatVerdictTokens" :key="t.key" type="button" class="mr-vd-badge mr-vd-badge--tc" title="Xem chi tiết ở Mục II" @click="activeView = 1">{{ t.label }}</button>
          </template>
          <template v-if="lyOrgans.length">
            <span class="mr-vd-sep">Tạng phủ (Lý)</span>
            <button v-for="o in lyOrgans.slice(0, 4)" :key="'org-' + o.name" type="button" class="mr-vd-badge mr-vd-badge--organ" @click="activeView = 1">{{ o.name }}</button>
            <span v-if="lyOrgans.length > 4" class="mr-vd-more">+{{ lyOrgans.length - 4 }}</span>
          </template>
        </div>
        <div class="mr-ctx-right">
          <span v-if="focusedTheName" class="mr-focus-chip">
            Đang lọc: <b>{{ focusedTheName }}</b>
            <button type="button" aria-label="Bỏ lọc" @click="excelFocusRuleId = null; focusExtraIds = []">✕</button>
          </span>
        </div>
      </div>
      <div v-if="showPatientMore" class="mr-patient-more">
        <div class="pi-field"><span class="pi-label">Địa chỉ</span><span class="pi-value">{{ patient.address || '—' }}</span></div>
        <div class="pi-field"><span class="pi-label">Thời gian đo</span><span class="pi-value">{{ examDisplay.date }} {{ examDisplay.time }}</span></div>
        <div class="pi-field"><span class="pi-label">Huyết áp</span><span class="pi-value">120/90</span></div>
        <div class="pi-field"><span class="pi-label">Chiều cao</span><span class="pi-value">—</span></div>
        <div class="pi-field"><span class="pi-label">Cân nặng</span><span class="pi-value">—</span></div>
        <div class="pi-field"><span class="pi-label">BMI</span><span class="pi-value">—</span></div>
      </div>

      <!-- ═══ TRUYỀN BIẾN QUA CÁC LẦN ĐO (DÙNG CHUNG TOÀN TRANG — ĐẶT TRÊN CẢ 3 TAB) ═══ -->
      <div v-if="lucKinhTrajectory.filter((p) => p.verdict).length >= 2" class="mr-traj-global">
        <section ref="trajRef" class="lk-traj lk-traj--global">
          <div class="lk-traj-head">
            <span class="lk-eyebrow">↳ TRUYỀN BIẾN QUA {{ lucKinhTrajectory.length }} LẦN ĐO (Bấm mốc để chuyển &amp; đối sánh ca đo)</span>
            <span v-if="truyenBienXuHuong" class="lk-traj-trend" :class="'lk-traj-trend--' + truyenBienXuHuong.loai">Xu hướng: {{ truyenBienXuHuong.nhan }}</span>
          </div>
          <ol class="lk-traj-line">
            <li v-for="p in lucKinhTrajectory" :key="p.id" class="lk-traj-node" :class="{ 'lk-traj-node--cur': p.id === examId }">
              <span v-if="p.moiDot" class="lk-traj-break" title="Đợt bệnh khác (cách > 45 ngày) — không nối truyền biến">⋯ đợt mới</span>
              <span v-else-if="p.huong" class="lk-traj-conn">
                <span class="lk-traj-speed" :class="{ 'is-cap': isCap(p), 'is-blind': p.gianDoan }">
                  <template v-if="ngayLabel(p)">{{ ngayLabel(p) }}</template>
                  <b v-if="isCap(p)" class="lk-traj-cap" title="Truyền vào lý nhanh — theo dõi sát">↯ cấp{{ p.capTinh === 'cap?' ? '?' : '' }}</b>
                  <b v-if="p.gianDoan" class="lk-traj-blind" title="Có mốc ngoài Lục Kinh xen giữa — chưa chắc chắn">⋯</b>
                </span>
                <span
                  class="lk-traj-arrow"
                  :class="'lk-traj-arrow--' + p.huong.loai"
                  :title="p.huong.nhan"
                >{{ p.huong.loai === 'vao-ly' ? '↓' : p.huong.loai === 'ra-bieu' ? '↑' : '→' }}</span>
                <span v-if="kieuChip(p)" class="lk-traj-kieu" :class="'lk-traj-kieu--' + kieuChip(p)!.cls" :title="kieuChip(p)!.tip">{{ kieuChip(p)!.nhan }}</span>
              </span>
              <span v-if="p.id === examId" class="lk-traj-cell lk-traj-cell--cur" aria-current="true">
                <span v-if="p.trucTrung" class="lk-traj-truc" title="Trực trúng 直中 — tà vào thẳng Tam Âm">直 trực trúng<template v-if="!p.trucTrungBanChac">?</template></span>
                <span class="lk-traj-date">{{ p.date }}</span>
                <span v-if="p.verdict" class="lk-traj-kinh" :data-kinh="p.verdict.kinh.slug">{{ p.verdict.kinh.ten }} <i>{{ p.verdict.kinh.han }}</i></span>
                <span v-else class="lk-traj-kinh lk-traj-kinh--none">ngoài LK</span>
                <span class="lk-traj-dang-xem">đang xem</span>
              </span>
              <RouterLink
                v-else
                class="lk-traj-cell lk-traj-cell--link"
                :to="{
                  name: 'meridian-results',
                  params: { patientId, examId: p.id },
                  query: { view: String(activeView), traj: '1' },
                }"
                :title="`Mở lần đo ${p.date} (ca #${p.id}) — giữ nguyên tab đang xem`"
              >
                <span v-if="p.trucTrung" class="lk-traj-truc" title="Trực trúng 直中 — tà vào thẳng Tam Âm">直 trực trúng<template v-if="!p.trucTrungBanChac">?</template></span>
                <span class="lk-traj-date">{{ p.date }}</span>
                <span v-if="p.verdict" class="lk-traj-kinh" :data-kinh="p.verdict.kinh.slug">{{ p.verdict.kinh.ten }} <i>{{ p.verdict.kinh.han }}</i></span>
                <span v-else class="lk-traj-kinh lk-traj-kinh--none">ngoài LK</span>
                <span class="lk-traj-mo">xem lần đo →</span>
              </RouterLink>
            </li>
          </ol>
        </section>
      </div>

      <!-- ═══ 3 TAB (v-show để giữ mount 3D + state) ═══ -->
      <nav class="mr-tabs" aria-label="Chuyển view kết quả">
        <button type="button" class="mr-tab" :class="{ active: activeView === 1 }" @click="activeView = 1">
          <b>1</b> Kết Quả Đo &amp; Bát Cương
        </button>
        <button type="button" class="mr-tab" :class="{ active: activeView === 2 }" @click="activeView = 2">
          <b>2</b> Chẩn Đoán &amp; Điều Trị
          <span class="mr-tab-badge">{{ excelSyndromesList.length }} thể · {{ matchedPhuongHuyetList.length }} huyệt · {{ matchedBaiThuocList.length }} bài</span>
        </button>
        <button type="button" class="mr-tab" :class="{ active: activeView === 3 }" @click="activeView = 3">
          <b>3</b> Biện Chứng – Pháp Trị
        </button>
      </nav>

      <!-- ═══ VIEW 1: Kết quả đo (I) + Bát Cương (II) ═══ -->
      <section class="mr-view" v-show="activeView === 1">
      <div class="mr-grid mr-grid--v1">
        <section class="result-section">
              <h2 class="section-title">
                <span class="section-num">I</span> KẾT QUẢ ĐO KINH LẠC
              </h2>
              
              <div class="result-card p-0 overflow-hidden">
                <!-- Chi Trên -->
                <div class="table-section-title" :class="sectionTitleClassMerged('upper')">Chi trên</div>
                <div class="stats-summary-row" :class="statsRowClassMerged('upper')">
                  <div class="stat-col" :class="excelStatColClass('upper', 0)"><span class="stat-label" title="Số đo cao nhất (trên) và thấp nhất (dưới) của cả chi trên">Cao/Thấp</span><span class="stat-vals"><span class="val max-val">{{ fmt(upperStats.max, 1) }}</span> / <span class="val min-val">{{ fmt(upperStats.min, 1) }}</span></span></div>
                  <div class="stat-col" :class="excelStatColClass('upper', 1)"><span class="stat-label" title="Biên độ = Cao nhất − Thấp nhất">Biên độ</span><span class="val">{{ fmt(upperStats.range, 1) }}</span></div>
                  <div class="stat-col" :class="excelStatColClass('upper', 2)"><span class="stat-label" title="Trị số bình quân chung = (Cao nhất + Thấp nhất) / 2">Bình quân</span><span class="val bg-gray" :class="bcMeanClass('upper')">{{ fmt(upperStats.mean, 2) }}</span></div>
                  <div class="stat-col" :class="excelStatColClass('upper', 3)"><span class="stat-label" title="Dung sai = Biên độ / 6">Dung sai</span><span class="val">{{ fmt(upperStats.sd, 2) }}</span></div>
                  <div class="stat-col" :class="[excelStatColClass('upper', 4), bcBoundClass('upper')]"><span class="stat-label" title="Cận trên = Bình quân + Dung sai (trên); Cận dưới = Bình quân − Dung sai (dưới)">Cận trên/dưới</span><span class="stat-vals"><span class="val text-brown-600">{{ fmt(upperStats.upperBound, 2) }}</span> / <span class="val text-brown-600">{{ fmt(upperStats.lowerBound, 2) }}</span></span></div>
                </div>

                <div class="table-responsive table-scroll">
                  <table class="data-table meridian-data-table">
                    <thead>
                      <tr class="meridian-head-row">
                        <th title="Tên đường kinh được đo">Đường kinh</th>
                        <th title="Đánh giá bên trái: + cao hơn cận trên, − thấp hơn cận dưới, 0 trong khoảng bình thường">Dấu trái</th>
                        <th title="Trị số đo bên trái">Đo trái</th>
                        <th title="Trung bình hai bên = (trái + phải) / 2">TB 2 bên</th>
                        <th title="Chênh lệch so với trị số bình quân chung của chi (số dương = cao hơn, số âm = thấp hơn)">Lệch BQ</th>
                        <th title="Trị số đo bên phải">Đo phải</th>
                        <th title="Đánh giá bên phải: + cao hơn cận trên, − thấp hơn cận dưới, 0 trong khoảng bình thường">Dấu phải</th>
                        <th title="Chênh lệch tuyệt đối giữa trái và phải = |trái − phải|">Lệch T–P</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, idx) in upperRows" :key="'upper-'+idx" :class="upperRowClassMerged(idx)">
                        <td class="font-bold" :class="excelTdClass('upper', idx, 0)">{{ item.name }}</td>
                        <td :class="[getSignClass(item.leftSign), excelTdClass('upper', idx, 1)]">{{ item.leftSign }}</td>
                        <td class="font-medium" :class="[excelTdClass('upper', idx, 2), bcCellClass(item.name, 2)]">{{ fmt(item.left, 1) }}</td>
                        <td class="bg-gray" :class="[excelTdClass('upper', idx, 3), bcCellClass(item.name, 3)]">{{ fmt(item.avg, 2) }}</td>
                        <td :class="[item.diff > 0 ? 'text-brown-600' : (item.diff < 0 ? 'text-blue-600' : ''), excelTdClass('upper', idx, 4)]">{{ item.diff > 0 ? '+' : '' }}{{ fmt(item.diff, 2) }}</td>
                        <td class="font-medium" :class="[excelTdClass('upper', idx, 5), bcCellClass(item.name, 5)]">{{ fmt(item.right, 1) }}</td>
                        <td :class="[getSignClass(item.rightSign), excelTdClass('upper', idx, 6)]">{{ item.rightSign }}</td>
                        <td :class="excelTdClass('upper', idx, 7)">{{ fmt(item.absDiff, 1) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Chi Dưới -->
                <div class="table-section-title" :class="sectionTitleClassMerged('lower')">Chi dưới</div>
                <div class="stats-summary-row" :class="statsRowClassMerged('lower')">
                  <div class="stat-col" :class="excelStatColClass('lower', 0)"><span class="stat-label">Cao/Thấp</span><span class="stat-vals"><span class="val max-val">{{ fmt(lowerStats.max, 1) }}</span> / <span class="val min-val">{{ fmt(lowerStats.min, 1) }}</span></span></div>
                  <div class="stat-col" :class="excelStatColClass('lower', 1)"><span class="stat-label">Biên độ</span><span class="val">{{ fmt(lowerStats.range, 1) }}</span></div>
                  <div class="stat-col" :class="excelStatColClass('lower', 2)"><span class="stat-label">Bình quân</span><span class="val bg-gray" :class="bcMeanClass('lower')">{{ fmt(lowerStats.mean, 2) }}</span></div>
                  <div class="stat-col" :class="excelStatColClass('lower', 3)"><span class="stat-label">Dung sai</span><span class="val">{{ fmt(lowerStats.sd, 2) }}</span></div>
                  <div class="stat-col" :class="[excelStatColClass('lower', 4), bcBoundClass('lower')]"><span class="stat-label">Cận trên/dưới</span><span class="stat-vals"><span class="val text-brown-600">{{ fmt(lowerStats.upperBound, 2) }}</span> / <span class="val text-brown-600">{{ fmt(lowerStats.lowerBound, 2) }}</span></span></div>
                </div>
                <div class="table-responsive table-scroll">
                  <table class="data-table meridian-data-table">
                    <thead>
                      <tr class="meridian-head-row">
                        <th>Đường kinh</th><th>Dấu trái</th><th>Đo trái</th><th>TB 2 bên</th><th>Lệch BQ</th><th>Đo phải</th><th>Dấu phải</th><th>Lệch T–P</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, idx) in lowerRows" :key="'lower-'+idx" :class="lowerRowClassMerged(idx)">
                        <td class="font-bold" :class="excelTdClass('lower', idx, 0)">{{ item.name }}</td>
                        <td :class="[getSignClass(item.leftSign), excelTdClass('lower', idx, 1)]">{{ item.leftSign }}</td>
                        <td class="font-medium" :class="[excelTdClass('lower', idx, 2), bcCellClass(item.name, 2)]">{{ fmt(item.left, 1) }}</td>
                        <td class="bg-gray" :class="[excelTdClass('lower', idx, 3), bcCellClass(item.name, 3)]">{{ fmt(item.avg, 2) }}</td>
                        <td :class="[item.diff > 0 ? 'text-brown-600' : (item.diff < 0 ? 'text-blue-600' : ''), excelTdClass('lower', idx, 4)]">{{ item.diff > 0 ? '+' : '' }}{{ fmt(item.diff, 2) }}</td>
                        <td class="font-medium" :class="[excelTdClass('lower', idx, 5), bcCellClass(item.name, 5)]">{{ fmt(item.right, 1) }}</td>
                        <td :class="[getSignClass(item.rightSign), excelTdClass('lower', idx, 6)]">{{ item.rightSign }}</td>
                        <td :class="excelTdClass('lower', idx, 7)">{{ fmt(item.absDiff, 1) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              <!-- Footer: Chênh lệch trung bình chi trên và chi dưới -->
              <div class="table-footer-stat" :class="footerDiffClassMerged()">
                <div class="footer-stat-line">
                  <span>Chênh lệch trung bình chi trên và chi dưới:</span>
                  <span class="font-bold text-brown-700 ml-4">{{ fmt(Math.abs(upperStats.mean - lowerStats.mean), 2) }}</span>
                </div>
                <span class="footer-stat-note">Chỉ số tham khảo, không tự động ra chẩn đoán.</span>
              </div>
              </div>
            </section>

      <!-- KẾT LUẬN BÁT CƯƠNG — dải full-width, đồ hình 3D lớn (đặt sau số đo kinh lạc) -->
      <section class="result-section bc-band">
        <h2 class="section-title">
          <span class="section-num">II</span> KẾT LUẬN BÁT CƯƠNG & CHẨN ĐOÁN
        </h2>
        <div class="result-card p-4">
          <div class="bc-wrap bc-wrap--band">
            <!-- Hình người + tạng phủ vây QUANH: lục tạng trái · lục phủ phải -->
            <div class="bc-figblock">
              <BatCuongOrgans
                class="bc-organs-col"
                :items="organsTang"
                :focus="batCuongFocus"
                :lech-names="huThucLechNames"
                @toggle="toggleBatCuongFocus"
                @detail="openKinhMachChiTiet"
              />
              <BatCuongFigure3D
                ref="batCuongFigureRef"
                class="bc-figure"
                :am-duong="tongCuong.amDuong"
                :hu-thuc="diagnosis.huThuc"
                :organs="affectedOrgans"
                :focus="batCuongFocus"
                :lech-names="huThucLechNames"
                @toggle="toggleBatCuongFocus"
              />
              <BatCuongOrgans
                class="bc-organs-col"
                :items="organsPhu"
                :focus="batCuongFocus"
                :lech-names="huThucLechNames"
                @toggle="toggleBatCuongFocus"
                @detail="openKinhMachChiTiet"
              />
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
              :focus="batCuongFocus"
              @toggle="toggleBatCuongFocus"
              @detail="openKinhMachChiTiet"
            />
          </div>
        </div>
      </section>
        </div><!-- /mr-grid--v1 -->
      </section><!-- /mr-view VIEW 1 -->

      <!-- ═══ VIEW 2: Chẩn đoán (III) + Phác đồ điều trị (IV+V) cạnh nhau ═══ -->
      <section class="mr-view" v-show="activeView === 2">
        <div class="mr-grid mr-grid--v2">
          <div class="phacdo-col">
            <div class="phacdo-head">
              <span class="phacdo-title">🩹 Phác Đồ Điều Trị</span>
              <span v-if="focusedTheName" class="phacdo-focus">theo thể <b>{{ focusedTheName }}</b></span>
              <span v-else class="phacdo-focus phacdo-focus--all">gộp tất cả — bấm 1 thể bên trái để lọc riêng</span>
            </div>
          <section class="result-section">
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
                    <span v-for="row in g.items" :key="row.idPhacDo" class="ph-chip-wrap">
                      <button
                        type="button"
                        class="ph-chip ph-chip--has-note"
                        :class="{
                          'ph-chip--active': expandedPhuongHuyetNotes.has(row.idPhacDo),
                        }"
                        :title="phuongHuyetYNghia(row) || row.ghi_chu_ky_thuat || phuongHuyetKinhMach(row) || ''"
                        @click="togglePhuongHuyetNote(row.idPhacDo)"
                      >
                        <span class="ph-chip__name">{{ phuongHuyetDisplayLabel(row) }}</span>
                        <span
                          v-if="phuongHuyetYNghia(row) || row.ghi_chu_ky_thuat"
                          class="ph-chip__dot"
                          aria-hidden="true"
                        ></span>
                      </button>
                      <button
                        v-if="row.huyetVi?.ma_huyet"
                        type="button"
                        class="ph-chip__map-btn"
                        title="Xem huyệt này trên đồ hình 3D"
                        aria-label="Xem trên đồ hình 3D"
                        @click.stop="gotoAcuMap(row.huyetVi?.ma_huyet)"
                      >🧭</button>
                      <button
                        v-else-if="row.huyetVi?.id_tu_dien"
                        type="button"
                        class="ph-chip__map-btn ph-chip__dict-btn"
                        title="Huyệt không có trên đồ hình 3D — tra ở Từ Điển"
                        aria-label="Tra ở Từ Điển"
                        @click.stop="gotoTuDien(row.huyetVi?.id_tu_dien)"
                      >📖</button>
                    </span>
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
                        <span
                          v-if="phuongHuyetMultiSource && phuongHuyetSourceThe(row)"
                          class="ph-note-source"
                          title="Huyệt này đến từ thể bệnh nào (khi gộp thể kép)"
                        >Từ thể: {{ phuongHuyetSourceThe(row) }}</span>
                        <button
                          type="button"
                          class="ph-note-close"
                          aria-label="Đóng"
                          @click="togglePhuongHuyetNote(row.idPhacDo)"
                        >✕</button>
                      </div>
                      <p v-if="phuongHuyetYNghia(row)" class="ph-note-body ph-note-body--ynghia">
                        <span class="ph-note-label">Ý nghĩa:</span> {{ phuongHuyetYNghia(row) }}
                      </p>
                      <p v-if="row.ghi_chu_ky_thuat" class="ph-note-body">
                        <span class="ph-note-label">Ghi chú:</span> {{ row.ghi_chu_ky_thuat }}
                      </p>
                      <p v-if="!phuongHuyetYNghia(row) && !row.ghi_chu_ky_thuat" class="ph-note-empty">
                        Chưa có ý nghĩa / ghi chú kỹ thuật.
                      </p>
                    </div>
                  </template>
                </div>
              </div>
              <div v-if="theDoThieuPhuongHuyet.length" class="ph-missing-warn">
                ⚠ <b>{{ theDoThieuPhuongHuyet.length }}</b> thể đo chưa có phương huyệt:
                <template v-for="(t, i) in theDoThieuPhuongHuyet" :key="t.id"
                  ><b>{{ t.name }}</b><span v-if="i < theDoThieuPhuongHuyet.length - 1">, </span></template
                >. Vào tab <b>Phương Huyệt</b> để thêm phác đồ huyệt cho các thể này.
              </div>
              <PhuongHuyetNguDu
                :z="nguHanhZ"
                :hu-thuc="diagnosis.huThuc"
                :lech-rows="diagnosis.explain?.huThuc?.lechRows"
                :matched-benh-ids="matchedBenhIds"
                @goto-acu="gotoAcuMap"
                @goto-dict="gotoTuDien"
              />
            </div>
          </section>

          <section class="result-section">
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
              <template v-else>
                <!-- THANG ĐẶC TRỊ: gộp vị thuốc (bỏ trùng, xếp thông dụng → đặc trị), tích/sửa liều rồi lưu -->
                <div class="dt-block">
                  <div class="dt-head">
                    <span class="dt-title">Thang Đặc Trị</span>
                    <span class="dt-sub">
                      {{ dtChonCount }}/{{ tongHopViThuoc.length }} vị · gộp {{ matchedBaiThuocList.length }} bài · bỏ trùng · thông dụng → đặc trị
                    </span>
                    <div class="dt-filter">
                      <template v-if="focusedTheName">
                        <span class="dt-filter-on">Đang lọc theo thể: <b>{{ focusedTheName }}</b></span>
                        <button type="button" class="dt-filter-clear" @click="excelFocusRuleId = null; focusExtraIds = []">✕ Bỏ lọc · gộp tất cả thể</button>
                      </template>
                      <span v-else class="dt-filter-all">
                        Gộp tất cả {{ matchedBenhIds.length }} thể bệnh khớp — bấm 1 thể ở “Mô Hình Bệnh” để chỉ hiện vị của thể đó
                      </span>
                    </div>
                  </div>

                  <div class="dt-toggles">
                    <button
                      type="button"
                      class="dt-toggle dt-toggle--btn"
                      :disabled="!phanTichThang.chiTietViThuoc.length"
                      @click="showPhanTich = true"
                    >
                      📊 Phân tích thang (Tứ Khí · Ngũ Vị · Quy Kinh)
                    </button>
                    <button type="button" class="dt-toggle" @click="showBaiThuocNguon = !showBaiThuocNguon">
                      {{ showBaiThuocNguon ? '▲ Ẩn bài thuốc nguồn' : `▼ Xem ${matchedBaiThuocList.length} bài thuốc nguồn` }}
                    </button>
                  </div>

                  <p v-if="baiThuocLoading && !tongHopViThuoc.length" class="dt-loading">⏳ Đang tải dữ liệu bài thuốc…</p>
                  <div v-else class="dt-table">
                    <div class="dt-row dt-row--head">
                      <span class="dt-c dt-c--chk" aria-hidden="true"></span>
                      <span class="dt-c dt-c--name">Vị thuốc</span>
                      <span class="dt-c dt-c--freq" title="Số bài thuốc chứa vị này">Số bài</span>
                      <span class="dt-c dt-c--lieu">Liều</span>
                      <span class="dt-c dt-c--role">Vai trò</span>
                    </div>
                    <div
                      v-for="it in tongHopViThuoc"
                      :key="it.key"
                      class="dt-row"
                      :class="{ 'dt-row--off': !dtChon.has(it.key) }"
                    >
                      <span class="dt-c dt-c--chk">
                        <input
                          type="checkbox"
                          class="dt-chk"
                          :checked="dtChon.has(it.key)"
                          :aria-label="'Đưa ' + it.ten + ' vào đơn'"
                          @change="toggleDtChon(it.key)"
                        />
                      </span>
                      <span class="dt-c dt-c--name">
                        <span class="dt-vi-ten">{{ it.ten }}</span>
                        <span v-if="it.tu_bai.length" class="dt-from" :title="'Từ: ' + it.tu_bai.join(' · ')">{{ it.tu_bai.length }} bài</span>
                      </span>
                      <span class="dt-c dt-c--freq">
                        <span class="dt-freq" :class="{ 'dt-freq--core': it.so_bai >= 2 }">{{ it.so_bai }}</span>
                      </span>
                      <span class="dt-c dt-c--lieu">
                        <input
                          type="text"
                          class="dt-lieu"
                          :value="dtLieuOf(it)"
                          :placeholder="it.lieu_goi_y || '—'"
                          :aria-label="'Liều ' + it.ten"
                          @input="setDtLieu(it.key, $event)"
                        />
                      </span>
                      <span class="dt-c dt-c--role">{{ it.vai_tro || '—' }}</span>
                    </div>
                  </div>

                  <div class="dt-foot">
                    <input v-model="dtGhiChu" class="dt-note" placeholder="Ghi chú đơn: cách sắc, kiêng kỵ, số thang…" />
                    <div class="dt-actions">
                      <span v-if="dtSavedMsg" class="dt-saved-msg">{{ dtSavedMsg }}</span>
                      <button type="button" class="dt-save" :disabled="dtSaving || !dtChonCount" @click="saveDonThuoc">
                        {{ dtSaving ? 'Đang lưu…' : '💾 Lưu đơn' }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- BÀI THUỐC NGUỒN (ẩn mặc định — chỉ hiện khi cần) -->
                <div v-if="showBaiThuocNguon" class="ph-groups dt-source">
                  <div class="ph-group ph-group--bai-thuoc">
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
                          <button type="button" class="ph-note-close" aria-label="Đóng" @click="toggleBaiThuoc(bt.id)">✕</button>
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
              </template>
            </div>
          </section>

          </div><!-- /phacdo-col (IV + V) -->

          <section class="result-section">
            <h2 class="section-title">
              <span class="section-num">III</span> MÔ HÌNH BỆNH LÝ
            </h2>
            <div class="result-card p-4">
              <div class="info-group">
                <div class="dongy-head">
                  <h4 class="info-label mb-0">Mô hình bệnh YHCT - Đông Y</h4>
                  <button
                    v-if="excelSyndromesList.length"
                    type="button"
                    class="tc-phanbiet-btn"
                    title="Hỏi bệnh nhân xác nhận triệu chứng để chẩn đoán thể bệnh đo được"
                    @click="openPhanBiet"
                  >🩺 Hỏi & Chẩn đoán bệnh nhân</button>
                </div>
                <div v-if="savedChanDoan" class="dongy-saved">
                  ✓ Đã chẩn đoán: <b>{{ savedChanDoan.ket_luan }}</b>
                  <span class="dongy-saved-time">({{ new Date(savedChanDoan.luu_luc).toLocaleString('vi-VN') }})</span>
                </div>
                <div v-if="syndromeTree.nodes.length" class="comparison-list">
                  <div
                    v-for="node in syndromeTree.nodes"
                    :key="node.kind + '-' + node.item.id"
                    class="comparison-cell comparison-cell--clickable"
                    :class="{
                      'comparison-cell--active': (node.kind === 'modern' ? modernFocusRuleId : excelFocusRuleId) === node.item.id,
                      'comparison-cell--modern': node.kind === 'modern',
                      'synd-node--parent': node.subs.length,
                    }"
                    role="button"
                    tabindex="0"
                    :title="node.item.logicExpression ? 'Xem ô chỉ số liên quan trên bảng I (click sáng công thức)' : 'Chọn mô hình'"
                    @click="focusSyndNode(node)"
                    @keydown.enter.prevent="focusSyndNode(node)"
                    @keydown.space.prevent="focusSyndNode(node)"
                  >
                    <div class="synd-header-row">
                      <div class="synd-info">
                        <span class="synd-idx">{{ node.no }}</span>
                        <span class="synd-name">{{ node.item.name }}</span>
                        <span class="synd-rate">{{ node.item.outputCell }}</span>
                      </div>
                      <div class="synd-actions">
                        <button
                          type="button"
                          class="pt-search-btn"
                          title="Xem chi tiết bệnh này (nguyên nhân, triệu chứng, pháp trị, bài thuốc — theo dữ liệu Bệnh Đo Kinh Lạc)"
                          @click.stop="openBenhChiTiet(node.item)"
                          @keydown.stop
                        >
                          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" class="pt-search-ic">
                            <path d="M4 10c1.8-3.3 4.2-5 6-5s4.2 1.7 6 5c-1.8 3.3-4.2 5-6 5s-4.2-1.7-6-5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
                            <circle cx="10" cy="10" r="2" stroke="currentColor" stroke-width="2" />
                          </svg>
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          class="pt-search-btn"
                          title="Tìm pháp trị cho mô hình bệnh này"
                          @click.stop="openPhapTriSearch(node.item)"
                          @keydown.stop
                        >
                          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" class="pt-search-ic">
                            <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="2" />
                            <path d="m17 17-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                          </svg>
                          Pháp trị
                        </button>
                        <button
                          v-if="phuongHuyetForThe(node.item).length"
                          type="button"
                          class="pt-search-btn"
                          title="In phiếu châm huyệt riêng cho thể bệnh này"
                          @click.stop="inPhieuChamHuyet(node.item)"
                          @keydown.stop
                        >
                          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" class="pt-search-ic">
                            <path d="M6 2.5A1.5 1.5 0 0 0 4.5 4v2H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h.5v1.5A1.5 1.5 0 0 0 6 17h8a1.5 1.5 0 0 0 1.5-1.5V14h.5a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-.5V4A1.5 1.5 0 0 0 14 2.5H6ZM14 6H6V4h8v2Zm0 6H6v3.5h8V12Z" stroke="none" fill="currentColor" />
                          </svg>
                          Châm huyệt
                        </button>
                      </div>
                    </div>
                    <div v-for="sub in node.subs" :key="sub.name" class="synd-sub">
                      <span class="synd-sub-head">
                        <span class="synd-sub-caret">↳</span>
                        <span
                          class="synd-sub-tag"
                          :class="sub.role === 'root' ? 'synd-sub-tag--yhct' : 'synd-sub-tag--yhhd'"
                        >{{ sub.role === 'root' ? 'gốc YHCT' : 'biểu hiện YHHĐ' }}</span>
                        <span class="synd-sub-name">{{ sub.name }}</span>
                        <span v-if="sub.measured" class="synd-sub-meas" title="Thể này cũng đo ra — bấm dòng để sáng cả công thức của nó">✦ đo ra</span>
                      </span>
                      <span v-if="sub.ghiChu" class="synd-sub-note">{{ sub.ghiChu }}</span>
                    </div>
                  </div>
                </div>
                <div v-else class="pathology-placeholder">
                  <p>Không có mô hình Excel nào khớp điều kiện</p>
                </div>
              </div>

              <div v-if="syndromeTree.standaloneModern.length" class="info-group mt-4">
                <h4 class="info-label mb-3">Bệnh Y Học Hiện Đại (độc lập — chưa có thể YHCT gốc)</h4>
                <div class="comparison-list">
                  <div
                    v-for="(item, idx) in syndromeTree.standaloneModern"
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
        </div><!-- /mr-grid--v2 -->
      </section><!-- /mr-view VIEW 2 -->

      <!-- ═══ VIEW 3: Biện chứng – Pháp trị (ĐỊNH VỊ bệnh nhân theo taxonomy Pháp Trị) ═══ -->
      <section class="mr-view" v-show="activeView === 3">
        <div class="bcpt">
          <!-- 1. ĐỒ HÌNH ĐỊNH VỊ ĐÔNG Y — TRUNG TÂM TAB 3 ĐƯỢC ĐƯA LÊN ĐẦU -->
          <p v-if="dinhViLoading" class="bcpt-loading">Đang tổng hợp định vị…</p>
          <template v-else>
            <div class="bcpt-wheel-block">
              <div class="bcpt-wheel-main">
                <!-- BÓC LỚP CHÍNH LÀ "ĐẦY ĐỦ" — tổng hợp cả: 1 Âm Dương 太極 → 3 Tạng Phủ 臟腑 →
                     4 Lục Khí 六氣 → 5 Lục Kinh 六經. Lớp 5 dùng vòng Lục Kinh GIÀU (3 tầng cùng lúc + số thể). -->
                <nav class="bcpt-lop" aria-label="Bóc lớp đồ hình">
                  <button
                    v-for="l in DINH_VI_LOP"
                    :key="l.n"
                    type="button"
                    class="bcpt-lop-btn"
                    :class="{ on: dinhViLop === l.n, done: dinhViLop >= l.n }"
                    @click="dinhViLop = l.n"
                  ><b>{{ l.n }}</b> {{ l.ten }} <i>{{ l.han }}</i></button>
                </nav>
                <!-- KẾT LUẬN ngay trên đồ hình: kinh trội -->
                <div v-if="lucKinhVerdict" class="lk-wheel-cap" :data-kinh="lucKinhVerdict.kinh.slug">
                  <span class="lk-wheel-cap-lb">◉ Định vị</span>
                  <b class="lk-wheel-cap-kinh">{{ lucKinhVerdict.kinh.ten }} <i>{{ lucKinhVerdict.kinh.han }}</i></b>
                  <span class="lk-wheel-cap-gd">{{ lucKinhVerdict.giaiDoan }}</span>
                  <span v-if="lucKinhVerdict.hopBenh && lucKinhVerdict.phu" class="lk-wheel-cap-phu">+ {{ lucKinhVerdict.phu.ten }}</span>
                  <button v-if="dinhViLop !== 5" type="button" class="lk-wheel-cap-btn" @click="dinhViLop = 5">soi lớp Lục Kinh ▸</button>
                </div>
                <!-- Lớp 5 = vòng Lục Kinh giàu; lớp 4 = vòng Lục Khí giàu (Khí→Kinh→Tạng, Ngũ Hành sinh-khắc,
                     giống Biện Chứng Luận Trị); lớp 1/3 = bóc lớp có TÔ SÁNG ô bệnh nhân (Âm Dương · Tạng Phủ). -->
                <VongLucKinh
                  v-if="dinhViLop === 5"
                  class="bcpt-wheel"
                  :counts="lucKinhCaseCounts"
                  :case-set="bienChung ? bienChung.tapKinh : null"
                  :troi-kinh="bienChung ? bienChung.kinhTroi.slug : null"
                  :active-kinh="focusKinh"
                  :chuyen-bien="bienChung ? bienChung.chuyenBien : null"
                  :trajectory="trajForWheel"
                  :current-id="examId"
                />
                <VongLucKhi
                  v-else-if="dinhViLop === 4"
                  class="bcpt-wheel"
                  :counts="lucKhiCaseCounts"
                  :show-card="false"
                  :active-khi="lucKhiTroi"
                />
                <VongNguHanh
                  v-else-if="dinhViLop === 3"
                  class="bcpt-wheel"
                  :z="nguHanhZ"
                  :tong-cuong="tongCuong"
                />
                <BienChungWheel v-else class="bcpt-wheel" :lop="dinhViLop" :dinhvi="dinhViWheel" />
              </div>
              <div class="bcpt-wheel-side">
                <p v-if="dinhViLop === 5" class="bcpt-wheel-cap">Lớp Lục Kinh — <b style="color:#c99a2e">viền vàng đậm</b> = kinh <b>định vị (trội)</b> · viền vàng nhạt = kinh của ca · <b style="color:#e35a2f">đỏ</b> = có thể <b>vào lý (nặng)</b> · <b style="color:#5f9e4a">xanh</b> = có thể <b>ra biểu (hồi phục)</b>. Trục nét đứt = cặp biểu-lý.</p>
                <p v-else-if="dinhViLop === 4" class="bcpt-wheel-cap">Lớp Lục Khí: rê một <b>Khí</b> → tia Khí → Kinh (bản khí) → Tạng/Phủ; tâm <b>Ngũ Hành</b> sinh-khắc. Số = <b>tạng bị tác động</b> theo khí (Hàn/Nhiệt).</p>
                <p v-else-if="dinhViLop === 3" class="bcpt-wheel-cap">Lớp Tạng Phủ — ngôi sao <b>Ngũ Hành méo theo số đo</b>: đỉnh <b style="color:#35638d">co vào = tạng HƯ</b> (suy), <b style="color:#b23a29">đẩy ra = THỰC</b> (dư). Dây <b style="color:#b23a29">đỏ</b> = tương thừa (khắc quá), <b style="color:#8a2f4f">mận</b> = tương vũ; viền vàng = tạng <b>gốc</b>. So với ngũ giác mờ (mốc cân bằng) để thấy độ xộc xệch.</p>
                <p v-else class="bcpt-wheel-cap">Bóc từng lớp (Âm Dương → Tạng Phủ → Lục Khí → Lục Kinh). Ô <b>sáng vàng</b> = bệnh nhân có; mờ = không.</p>
                <p v-if="dinhVi.isEmpty" class="bcpt-empty-note">
                  Các thể bệnh trên chưa có liên kết bài thuốc → chưa suy được định vị.
                </p>
                <div class="bcpt-mini">
                  <span class="bcpt-mini-lb">Tạng phủ tổn thương:</span>
                  <span v-for="o in dinhVi.tangPhu" :key="o.name" class="bcpt-chip bcpt-chip--on">{{ o.label }}</span>
                  <span v-if="!dinhVi.tangPhu.length" class="bcpt-empty">—</span>
                </div>
                <!-- ①② Định vị/Tác nhân — CỘT PHẢI, ngang hàng đồ hình (gồm cả mục không có vòng:
                Vệ-Khí-Dinh-Huyết · Tam Tiêu · Nội Sinh). ③ Tính chất đã ở trên cùng ngang Thái Cực. -->
                <section v-for="ax in otherAxes" :key="ax.key" class="bcpt-axis bcpt-axis--side">
                  <h3 class="bcpt-axis-title"><span class="bcpt-axis-num">{{ ax.num }}</span> {{ ax.title }} <em>{{ ax.sub }}</em></h3>
                  <div v-for="sg in ax.subgroups" :key="sg.nhom" class="bcpt-sub">
                    <span class="bcpt-sub-lb">{{ sg.label }}</span>
                    <!-- Lục Kinh (Thương Hàn): DÙNG CHUNG NGUỒN bienChung (không lấy tag luc_kinh thô) →
                         nhất quán với ◎ kết luận + đồ hình; chip BẤM ĐƯỢC (soi trên đồ hình). -->
                    <div v-if="sg.nhom === 'gd-luc-kinh'" class="bcpt-chips">
                      <button
                        v-for="c in dinhViKinhChips"
                        :key="c.slug"
                        type="button"
                        class="lk-kchip lk-kchip--btn lk-kchip--sm"
                        :class="{ troi: c.troi, 'is-focus': focusKinh === c.slug }"
                        :data-kinh="c.slug"
                        :title="'Bấm để soi ' + c.ten + ' trên đồ hình'"
                        @click="soiKinh(c.slug)"
                      ><b v-if="c.troi">◉ </b>{{ c.ten }}<em v-if="c.count"> ·{{ c.count }}</em></button>
                      <span v-if="!dinhViKinhChips.length" class="bcpt-empty">chưa định vị Lục Kinh</span>
                    </div>
                    <div v-else class="bcpt-chips">
                      <span v-for="t in sg.tags" :key="t.name" class="bcpt-chip bcpt-chip--on" :title="t.name">{{ t.label }}</span>
                      <span v-if="!sg.tags.length" class="bcpt-empty">—</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </template>

          <!-- 2. CÁC KHỐI PHÂN TÍCH CHI TIẾT TỪ ĐỒ HÌNH SUY RA (XẾP 2 CỘT NGANG) -->
          <div class="bcpt-top-grid">
            <!-- CỘT TRÁI: Thể bệnh + Kết luận Lục Kinh -->
            <div class="bcpt-top-left">
              <div class="bcpt-the">
                <span class="bcpt-the-lb">Thể bệnh:</span>
                <template v-if="excelSyndromesList.length">
                  <span v-for="s in (excelSyndromesList as Array<{ id: number; name: string }>)" :key="s.id" class="bcpt-the-chip">{{ s.name }}</span>
                </template>
                <span v-else class="bcpt-empty">chưa xác định thể bệnh</span>
              </div>

              <!-- KẾT LUẬN LỤC KINH (Thương Hàn) -->
              <section v-if="lucKinhVerdict" class="lk-verdict" :class="'lk-verdict--' + lucKinhVerdict.doTin">
                <div class="lk-verdict-head">
                  <span class="lk-eyebrow">◎ Kết luận Lục Kinh</span>
                  <b class="lk-kinh">{{ lucKinhVerdict.kinh.ten }} <i>{{ lucKinhVerdict.kinh.han }}</i></b>
                  <span class="lk-giaidoan">{{ lucKinhVerdict.giaiDoan }}</span>
                  <span v-if="lucKinhVerdict.hopBenh && lucKinhVerdict.phu" class="lk-hopbenh">+ {{ lucKinhVerdict.phu.ten }}</span>
                  <span class="lk-badge" :class="'lk-badge--' + lucKinhVerdict.doTin">độ tin {{ lucKinhVerdict.doTin }}</span>
                </div>
                <div v-if="bienChung" class="lk-chips">
                  <div class="lk-chip-row">
                    <span class="lk-chip-lb">Định vị</span>
                    <button
                      v-for="c in dinhViKinhChips"
                      :key="c.slug"
                      type="button"
                      class="lk-kchip lk-kchip--btn"
                      :class="{ troi: c.troi, 'is-focus': focusKinh === c.slug }"
                      :data-kinh="c.slug"
                      :title="'Bấm để soi ' + c.ten + ' trên đồ hình'"
                      @click="soiKinh(c.slug)"
                    >
                      <b v-if="c.troi">◉ </b>{{ c.ten }}<em v-if="c.count"> ·{{ c.count }}</em>
                    </button>
                  </div>
                  <div class="lk-chip-row">
                    <span class="lk-chip-lb">Chuyển biến</span>
                    <template v-if="bienChung.chuyenBien">
                      <span class="lk-cb lk-cb--vaoly" :title="bienChung.chuyenBien.vaoLy.coChe">↓ vào lý → {{ bienChung.chuyenBien.vaoLy.ten }}</span>
                      <span class="lk-cb lk-cb--rabieu" :title="bienChung.chuyenBien.raBieu.coChe">↑ ra biểu → {{ bienChung.chuyenBien.raBieu.ten }}</span>
                    </template>
                    <span v-else class="lk-cb lk-cb--none" :title="bienChung.cbLyDo">— chưa suy (định vị chưa chắc)</span>
                  </div>
                </div>
                <details class="lk-details">
                  <summary class="lk-summary">Vì sao · pháp trị · thể ngoài phạm vi</summary>
                  <p class="lk-ketluan">{{ lucKinhVerdict.ketLuan }}</p>
                  <ul class="lk-lydo">
                    <li v-for="(r, i) in lucKinhVerdict.lyDo" :key="i">{{ r }}</li>
                  </ul>
                  <p v-if="lucKinhVerdict.theNgoai.length" class="lk-ngoai">
                    Ngoài phạm vi Thương Hàn (chưa phân tích sâu): {{ lucKinhVerdict.theNgoai.join(', ') }}.
                  </p>
                </details>
              </section>
              <p v-else-if="excelSyndromesList.length" class="lk-none">
                Các thể đo được chưa thuộc phạm vi Thương Hàn Lục Kinh — chưa định vị (có thể là nội thương / ôn bệnh / tạp bệnh).
              </p>
            </div>

            <!-- CỘT PHẢI: Tính chất Bát Cương -->
            <div class="bcpt-top-right">
              <!-- TÍNH CHẤT BÁT CƯƠNG · CHÍNH KHÍ -->
              <section v-if="!dinhViLoading && tinhChatAxis" class="bcpt-axis bcpt-axis--tinhchat">
                <h3 class="bcpt-axis-title"><span class="bcpt-axis-num">{{ tinhChatAxis.num }}</span> {{ tinhChatAxis.title }} <em>{{ tinhChatAxis.sub }}</em></h3>
                <div v-for="sg in tinhChatAxis.subgroups" :key="sg.nhom" class="bcpt-sub">
                  <span class="bcpt-sub-lb">{{ sg.label }}</span>
                  <div class="bcpt-chips">
                    <span v-for="t in sg.tags" :key="t.name" class="bcpt-chip bcpt-chip--on" :title="t.name">{{ t.label }}</span>
                    <span v-if="!sg.tags.length" class="bcpt-empty">—</span>
                  </div>
                </div>
              </section>
            </div>
          </div><!-- /bcpt-top-grid -->
        </div>
      </section><!-- /mr-view VIEW 3 -->

    </template>

    <!-- Bảng phân biệt thể bệnh: đối chiếu triệu chứng giữa các thể ứng viên -->
    <!-- Modal PHÂN TÍCH THANG ĐẶC TRỊ (toàn màn hình) -->
    <div v-if="showPhanTich" class="dtpt-overlay" @click.self="showPhanTich = false">
      <div class="dtpt-modal" role="dialog" aria-modal="true" aria-label="Phân tích thang đặc trị">
        <div class="dtpt-head">
          <h3>Phân Tích Thang Đặc Trị <span class="dtpt-sub">{{ dtChonCount }} vị đã chọn</span></h3>
          <button type="button" class="ptm-close" aria-label="Đóng" @click="showPhanTich = false">✕</button>
        </div>
        <div class="dtpt-body">
          <p v-if="!phanTichThang.chiTietViThuoc.length" class="dt-phantich-empty">
            Chưa chọn vị thuốc nào để phân tích.
          </p>
          <BaiThuocAnalysis v-else :bai-thuoc="phanTichThang" />
        </div>
      </div>
    </div>

    <div v-if="showPhanBietModal" class="pb-overlay" @click.self="closePhanBiet">
      <div class="pb-modal" role="dialog" aria-modal="true">
        <div class="pb-head">
          <div>
            <h3>Đối chiếu triệu chứng — phân biệt thể bệnh</h3>
            <span class="pb-sub">Bác sĩ hỏi, bệnh nhân xác nhận → xem lời kể ủng hộ thể nào nhất.</span>
          </div>
          <button type="button" class="ptm-close" aria-label="Đóng" @click="closePhanBiet">✕</button>
        </div>

        <div class="pb-body">
          <div v-if="phanBietLoading" class="ptm-state"><div class="spinner"></div><p>Đang nạp triệu chứng…</p></div>
          <div v-else-if="phanBietError" class="ptm-error">{{ phanBietError }}</div>
          <div v-else-if="!phanBietSymptoms.length" class="ptm-state"><p class="muted-italic">Các thể đo được chưa liên kết pháp trị nên chưa có triệu chứng để hỏi. Vào <strong>Bệnh đo kinh lạc → Bệnh YHCT - Đông Y</strong>, mở thể đo và <strong>chọn pháp trị</strong> để nối dữ liệu.</p></div>
          <template v-else>
            <!-- Chọn thể để so sánh -->
            <div class="pb-cands">
              <div
                v-for="(c, i) in phanBietCandidates"
                :key="c.key"
                class="pb-cand"
                :class="{ off: !c.enabled, 'pb-cand--kep': c.isKep }"
              >
                <button type="button" class="pb-cand-toggle" @click="togglePbCandidate(c.key)">
                  <span class="pb-no" :data-i="i">{{ i + 1 }}</span>
                  <span class="pb-cand-name">{{ c.label }}</span>
                  <span v-if="c.unsynced" class="pb-cand-warn">chưa đồng bộ</span>
                  <span v-else-if="!c.symptomIds.size" class="pb-cand-warn">chưa có triệu chứng</span>
                  <span v-else-if="c.isKep" class="pb-cand-tag">kép</span>
                  <span v-else class="pb-cand-do">đo được</span>
                </button>
                <button v-if="c.key.startsWith('kep:')" type="button" class="pb-cand-x" aria-label="Bỏ ghép" @click="removeKepCandidate(c.key)">✕</button>
              </div>
            </div>

            <div v-if="pbDataStatus.withData < pbDataStatus.total" class="pb-databanner">
              ⚠ Chỉ <b>{{ pbDataStatus.withData }}/{{ pbDataStatus.total }}</b> thể đo có triệu chứng để hỏi.
              <template v-if="pbDataStatus.unsynced"> {{ pbDataStatus.unsynced }} thể chưa đồng bộ pháp trị.</template>
              <template v-if="pbDataStatus.syncedEmpty"> {{ pbDataStatus.syncedEmpty }} thể đã nối nhưng pháp trị chưa nhập triệu chứng.</template>
              Bảng phân biệt vì vậy chưa đầy đủ — mở thể đo ở <b>Bệnh đo kinh lạc → Bệnh YHCT - Đông Y</b>, chọn pháp trị cho thể đó và nhập triệu chứng cho pháp trị.
            </div>

            <!-- Ghép thể kép (nghi thể phối hợp) -->
            <div class="pb-kep">
              <div class="pb-kep-title">Ghép thể kép <span>(nghi thể phối hợp — vd Tâm Tỳ Lưỡng Hư, Tâm Thận Bất Giao)</span></div>
              <div v-if="kepPicks.length" class="pb-kep-picks">
                <span v-for="p in kepPicks" :key="p.id" class="pb-kep-chip">
                  {{ p.label }}
                  <button type="button" aria-label="Bỏ chọn" @click="unpickKep(p.id)">✕</button>
                </span>
              </div>
              <div v-if="kepPicks.length < 2" class="pb-kep-search">
                <input
                  v-model="kepSearch"
                  type="search"
                  class="pb-kep-input"
                  :placeholder="kepPicks.length ? 'Tìm thể nền thứ hai…' : 'Tìm thể nền để ghép…'"
                  autocomplete="off"
                  @input="onKepSearchInput"
                />
                <div v-if="kepSearching" class="pb-kep-hint">Đang tìm…</div>
                <div v-else-if="kepResults.length" class="pb-kep-results">
                  <button v-for="r in kepResults" :key="r.id" type="button" class="pb-kep-result" @click="pickKep(r)">
                    <span class="pb-kep-result-name">{{ r.label }}</span>
                    <span class="pb-kep-tc" :class="{ 'pb-kep-tc--zero': !r.tc }">{{ r.tc ?? '?' }} tc</span>
                  </button>
                </div>
              </div>
              <div v-else class="pb-kep-actions">
                <button type="button" class="pb-kep-add" @click="addKepCandidate">＋ Ghép &amp; so sánh</button>
              </div>
              <div v-if="kepError" class="pb-kep-err">{{ kepError }}</div>
            </div>

            <!-- Xếp hạng theo lời kể -->
            <div class="pb-scores">
              <div class="pb-scores-title">Theo lời kể</div>
              <template v-for="s in pbScores" :key="'sc-' + s.key">
                <div class="pb-score-row">
                  <span class="pb-no" :data-i="pbCandIndex(s.key)">{{ pbCandIndex(s.key) + 1 }}</span>
                  <span class="pb-score-name">{{ s.label }}<span v-if="s.isKep" class="pb-cand-tag">ghép</span></span>
                  <span class="pb-score-bar"><span :style="{ width: s.percent + '%' }"></span></span>
                  <span class="pb-score-pct">{{ s.percent }}%</span>
                </div>
                <div v-if="s.isKep" class="pb-score-parts">
                  <span class="pb-parts-lbl">= min:</span>
                  <span v-for="(p, pi) in s.parts" :key="pi" class="pb-part" :class="{ 'pb-part--nodata': !p.hasData }">
                    {{ p.label }} · {{ p.hasData ? p.percent + '%' : 'chưa có dữ liệu' }}
                  </span>
                  <span v-if="s.missing" class="pb-parts-warn">⚠ thành phần thiếu triệu chứng — điểm kép chưa đáng tin</span>
                  <span v-else class="pb-parts-note">cả hai thể đều phải đủ</span>
                </div>
              </template>
            </div>

            <div class="pb-hint">Hỏi theo nhóm · dấu <span class="pb-tag-key">đặc trưng</span> = chỉ một thể có (giúp phân biệt).</div>
            <template v-for="g in pbGroups" :key="'g-' + g.slug">
              <div class="pb-group-title">{{ g.label }} <span>({{ g.rows.length }})</span></div>
              <div
                v-for="r in pbShownRows(g)"
                :key="g.slug + '-' + r.id"
                class="pb-row"
                :class="{ 'pb-row--key': r.supports.length === 1 }"
              >
                <div class="pb-row-info">
                  <span v-for="k in r.supports" :key="k" class="pb-no pb-no--sm" :data-i="pbCandIndex(k)">{{ pbCandIndex(k) + 1 }}</span>
                  <span class="pb-sym-name">{{ r.ten }}</span>
                  <span v-if="r.supports.length === 1 && pbDataStatus.withData >= 2" class="pb-tag-key">đặc trưng</span>
                </div>
                <div class="pb-ans">
                  <button type="button" class="pb-ans-btn pb-co" :class="{ on: phanBietAnswers[r.id] === 'co' }" @click="answerPbRow(r, 'co')">Có</button>
                  <button type="button" class="pb-ans-btn pb-khong" :class="{ on: phanBietAnswers[r.id] === 'khong' }" @click="answerPbRow(r, 'khong')">Không</button>
                  <button type="button" class="pb-ans-btn pb-kho" :class="{ on: phanBietAnswers[r.id] === 'kho' }" @click="answerPbRow(r, 'kho')">Không rõ</button>
                </div>
              </div>
              <button
                v-if="g.rows.length > PB_GROUP_CAP"
                type="button"
                class="pb-more-btn"
                @click="togglePbGroup(g.slug)"
              >
                {{ pbExpandedGroups[g.slug] ? '▲ Thu gọn' : `▼ Xem thêm ${g.rows.length - PB_GROUP_CAP} câu` }}
              </button>
            </template>

            <template v-if="pbContext.length">
              <div class="pb-group-title">Nguyên nhân — hỏi tìm gốc <span>(theo thể · mạch · lưỡi)</span></div>
              <div v-for="c in pbContext" :key="'ctx-' + c.key" class="pb-ctx">
                <span class="pb-no" :data-i="pbCandIndex(c.key)">{{ pbCandIndex(c.key) + 1 }}</span>
                <div class="pb-ctx-body">
                  <strong>{{ c.label }}</strong>
                  <div v-for="ng in c.nnGroups" :key="ng.slug" class="pb-nn-group">
                    <span class="pb-nn-label">{{ ng.label }}:</span>
                    <span v-for="(it, ii) in ng.items" :key="ii" class="pb-nn-chip">{{ it }}</span>
                  </div>
                  <p v-if="c.nguyen_nhan"><b>Nguyên nhân:</b> {{ c.nguyen_nhan }}</p>
                  <p v-if="c.mach_chan"><b>Mạch:</b> {{ c.mach_chan }}</p>
                  <p v-if="c.chat_luoi"><b>Lưỡi:</b> {{ c.chat_luoi }}</p>
                </div>
              </div>
            </template>

            <!-- D5: kết luận & lưu vào bệnh án -->
            <div class="pb-conclude">
              <div class="pb-group-title">Kết luận chẩn đoán <span>(lưu vào bệnh án)</span></div>
              <div class="pb-conclude-row pb-conclude-row--multi">
                <label class="pb-conclude-lbl">Thể kết luận <span class="pb-conclude-sub">(chọn 1 hoặc nhiều thể)</span></label>
                <div class="pb-conclude-checks">
                  <label
                    v-for="s in pbScores"
                    :key="'ck-' + s.key"
                    class="pb-conclude-check"
                    :class="{ on: chanDoanKetLuanKeys.includes(s.key) }"
                  >
                    <input type="checkbox" :value="s.key" v-model="chanDoanKetLuanKeys" />
                    <span>{{ s.label }} — {{ s.percent }}%{{ s.isKep ? ' (kép)' : '' }}</span>
                  </label>
                </div>
              </div>
              <p v-if="!chanDoanKetLuanKeys.length" class="pb-conclude-empty">
                Chưa chọn — khi lưu sẽ mặc định lấy thể cao điểm nhất.
              </p>
              <textarea
                v-model="chanDoanNote"
                class="pb-conclude-note"
                rows="2"
                placeholder="Ghi chú của thầy thuốc (tuỳ chọn)…"
              ></textarea>
              <div class="pb-conclude-actions">
                <button type="button" class="pb-save-btn" :disabled="chanDoanSaving" @click="saveChanDoan">
                  {{ chanDoanSaving ? 'Đang lưu…' : '💾 Lưu vào bệnh án' }}
                </button>
                <span v-if="chanDoanSavedMsg" class="pb-save-msg">{{ chanDoanSavedMsg }}</span>
                <span v-else-if="savedChanDoan" class="pb-save-prev">
                  Đã lưu: <b>{{ savedChanDoan.ket_luan }}</b> · {{ new Date(savedChanDoan.luu_luc).toLocaleString('vi-VN') }}
                </span>
              </div>
            </div>

            <p class="pb-disclaimer">Công cụ hỗ trợ đối chiếu — không thay thế chẩn đoán của thầy thuốc.</p>
          </template>
        </div>
      </div>
    </div>

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

        <!-- Hướng A: tra cứu Google cho bệnh nhân đọc tường tận hơn (nguồn ngoài) -->
        <div v-if="googleLookupUrl" class="ptm-learn">
          <a :href="googleLookupUrl" target="_blank" rel="noopener noreferrer" class="ptm-learn__btn">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" width="15" height="15">
              <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="2" />
              <path d="m17 17-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            Tìm hiểu thêm về “{{ phapTriLookupTerm }}” trên Google
          </a>
          <span class="ptm-learn__note">Nguồn bên ngoài để tham khảo — không thay thế tư vấn của thầy thuốc.</span>
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

    <!-- Popup "Chi tiết bệnh" (bấm nút Chi tiết ở mô hình bệnh Đông Y - Section III) -->
    <div v-if="showBenhChiTietModal" class="ptm-overlay" @click.self="closeBenhChiTietModal">
      <div class="ptm-modal bct-modal" role="dialog" aria-modal="true">
        <div class="ptm-head">
          <div class="ptm-head__title">
            <h3>{{ benhChiTiet?.name || 'Chi Tiết Bệnh' }}</h3>
            <span v-if="benhChiTiet?.outputCell" class="ptm-context">Ô kết quả: {{ benhChiTiet.outputCell }}</span>
          </div>
          <button type="button" class="ptm-close" aria-label="Đóng" @click="closeBenhChiTietModal">✕</button>
        </div>

        <div class="ptm-body">
          <div v-if="benhChiTietLoading" class="ptm-state">
            <div class="spinner"></div>
            <p>Đang tải chi tiết bệnh…</p>
          </div>
          <div v-else-if="benhChiTietError" class="ptm-error">{{ benhChiTietError }}</div>
          <template v-else-if="benhChiTiet">
            <div v-if="benhChiTietTheBenh.length" class="ptm-row">
              <span class="ptm-row__label">Thể bệnh</span>
              <a
                v-for="t in benhChiTietTheBenh"
                :key="'the-' + t.id"
                :href="phapTriHref(t.id)"
                target="_blank"
                rel="noopener"
                class="ptm-tag ptm-tag--tang"
                :title="`Mở pháp trị: ${t.name}`"
              >{{ t.name }}</a>
            </div>

            <div v-if="benhChiTietPhapTri.length" class="ptm-row">
              <span class="ptm-row__label">Pháp trị</span>
              <a
                v-for="p in benhChiTietPhapTri"
                :key="'pt-' + p.id"
                :href="phapTriHref(p.id)"
                target="_blank"
                rel="noopener"
                class="ptm-tag ptm-tag--phap"
                :title="`Mở pháp trị: ${p.name}`"
              >{{ p.name }}</a>
            </div>

            <div v-if="benhChiTietNguyenNhan.length" class="bct-groups">
              <p class="ptm-row__label">Nguyên nhân</p>
              <div v-for="(g, gi) in benhChiTietNguyenNhan" :key="'nn' + gi" class="bct-group">
                <span class="bct-group__tag">{{ g.label }}</span>
                <span class="bct-group__items">
                  <span v-for="(n, i) in g.items" :key="'nn' + gi + '-' + i" class="ptm-tag ptm-tag--nn">{{ n }}</span>
                </span>
              </div>
            </div>

            <div v-if="benhChiTietTrieuChung.length" class="bct-groups">
              <p class="ptm-row__label">Triệu chứng</p>
              <div v-for="(g, gi) in benhChiTietTrieuChung" :key="'tc' + gi" class="bct-group">
                <span class="bct-group__tag">{{ g.label }}</span>
                <span class="bct-group__items">
                  <span v-for="(t, i) in g.items" :key="'tc' + gi + '-' + i" class="ptm-tag ptm-tag--trieu">{{ t }}</span>
                </span>
              </div>
            </div>

            <div v-if="benhChiTietBaiThuoc.length" class="ptm-row">
              <span class="ptm-row__label">Bài thuốc</span>
              <a
                v-for="b in benhChiTietBaiThuoc"
                :key="'bt-' + b.id"
                :href="baiThuocHref(b.id)"
                target="_blank"
                rel="noopener"
                class="ptm-tag ptm-tag--bai"
                :title="`Mở bài thuốc: ${b.name}`"
              >{{ b.name }}</a>
            </div>

            <p
              v-if="!benhChiTietTheBenh.length && !benhChiTietPhapTri.length && !benhChiTietNguyenNhan.length && !benhChiTietTrieuChung.length && !benhChiTietBaiThuoc.length"
              class="ptm-state"
            >
              <span class="muted-italic">Bệnh này chưa liên kết nguyên nhân, triệu chứng, pháp trị hay bài thuốc nào.</span>
            </p>
          </template>
        </div>
      </div>
    </div>

    <!-- Popup "Chi tiết kinh mạch" (bấm nút "i" trên thẻ tạng phủ ở mục II Bát Cương) -->
    <div v-if="showKinhMachChiTietModal" class="ptm-overlay" @click.self="closeKinhMachChiTietModal">
      <div class="ptm-modal bct-modal" role="dialog" aria-modal="true">
        <div class="ptm-head">
          <div class="ptm-head__title">
            <h3>{{ kinhMachChiTiet?.ten_kinh_mach || 'Chi Tiết Kinh Mạch' }}</h3>
            <span v-if="kinhMachChiTiet?.ky_hieu_quoc_te" class="ptm-context">{{ kinhMachChiTiet.ky_hieu_quoc_te }}</span>
          </div>
          <button type="button" class="ptm-close" aria-label="Đóng" @click="closeKinhMachChiTietModal">✕</button>
        </div>
        <div class="ptm-body">
          <template v-if="kinhMachChiTiet">
            <p class="ptm-row__label">Biểu hiện khi tắc nghẽn/rối loạn</p>
            <p v-for="(line, i) in kinhMachChiTietParas" :key="i">{{ line }}</p>
            <p v-if="!kinhMachChiTietParas.length" class="ptm-state">
              <span class="muted-italic">Chưa có dữ liệu — cập nhật ở
                <RouterLink to="/app/meridian-diseases">Quản Lý Kinh Mạch</RouterLink>.</span>
            </p>
          </template>
          <p v-else class="ptm-state"><span class="muted-italic">Không tìm thấy dữ liệu kinh mạch này.</span></p>
        </div>
      </div>
    </div>

    <!-- Popup "Giải thích Hư/Thực" (bấm nút "i" cạnh pill Hư-Thực ở mục II Bát Cương) — nội dung
         tĩnh, không gọi API, dùng chung khung ptm-overlay/ptm-modal cho nhất quán với các popup khác. -->
    <div v-if="showHuThucInfoModal" class="ptm-overlay" @click.self="closeHuThucInfoModal">
      <div class="ptm-modal bct-modal" role="dialog" aria-modal="true">
        <div class="ptm-head">
          <div class="ptm-head__title">
            <h3>{{ huThucInfoForModal?.title || 'Giải Thích Hư/Thực' }}</h3>
          </div>
          <button type="button" class="ptm-close" aria-label="Đóng" @click="closeHuThucInfoModal">✕</button>
        </div>
        <div class="ptm-body">
          <p v-if="huThucInfoForModal">{{ huThucInfoForModal.body }}</p>
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

/* Clinic Dashboard (Single-Screen 1 View No-Scroll) */
.mr-clinic-dashboard {
  display: grid;
  grid-template-columns: 28% 38% 34%;
  gap: var(--space-3);
  height: calc(100vh - 140px);
  min-height: 560px;
  overflow: hidden;
  padding: 4px 0 10px;
}

.dash-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  overflow-y: auto;
  padding-right: 4px;
}

.dash-card {
  background: var(--white);
  border: 1px solid var(--brown-100);
  border-radius: var(--radius-lg);
  padding: 10px 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.dash-card--grow {
  flex: 1;
}

.dash-card-title {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--brown-800);
  margin-bottom: 8px;
  border-bottom: 1px solid var(--brown-100);
  padding-bottom: 4px;
}

.dash-bc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.dash-bc-box {
  background: var(--brown-50);
  border: 1px solid var(--brown-100);
  border-radius: 8px;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
}

.dash-bc-lbl {
  font-size: 10.5px;
  color: var(--gray-500);
  font-weight: 600;
}

.dash-bc-val {
  font-size: 13px;
  font-weight: 800;
  margin-top: 1px;
}

.dash-syndromes-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dash-synd-chip {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--brown-100);
  background: var(--surface-2);
  cursor: pointer;
  transition: all 0.15s ease;
}

.dash-synd-chip:hover, .dash-synd-chip.active {
  background: var(--brown-800);
  color: #fff;
  border-color: var(--brown-800);
}

.dash-synd-chip.active b, .dash-synd-chip.active .synd-tag {
  color: #fff !important;
}

.mr-mode-switcher {
  display: inline-flex;
  gap: 4px;
  background: var(--surface-2);
  padding: 3px;
  border-radius: 8px;
  border: 1px solid var(--brown-200);
}

.mr-mode-btn {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--gray-600);
  cursor: pointer;
  transition: all 0.15s ease;
}

.mr-mode-btn.active {
  background: var(--brown-800);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* ══════════════════════════════════════════════════════════════
   CLINICAL WORKSTATION LAYOUT  (cw-*)
   Sidebar cố định trái (32%) + Main panel phải (68%)
   Cả hai scroll độc lập, luôn vừa màn hình
══════════════════════════════════════════════════════════════ */
.cw-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 12px;
  height: calc(100vh - 148px);
  min-height: 560px;
  align-items: start;
}

/* ─ SIDEBAR ─ */
.cw-sidebar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  overflow-y: auto;
  padding-right: 2px;
  scrollbar-width: thin;
  scrollbar-color: var(--brown-200) transparent;
}

/* ─ MAIN PANEL ─ */
.cw-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.cw-main .mr-tabs {
  flex-shrink: 0;
}
.cw-main .mr-view {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--brown-200) transparent;
}

/* ─ CARD GỐC ─ */
.cw-card {
  background: var(--white);
  border: 1px solid var(--brown-100);
  border-radius: var(--radius-lg);
  padding: 10px 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  flex-shrink: 0;
}
.cw-card--grow {
  flex: 1;
  overflow-y: auto;
  min-height: 80px;
  scrollbar-width: thin;
  scrollbar-color: var(--brown-200) transparent;
}
.cw-card--phuonghuy {
  flex: 2;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 120px;
}
.cw-phuonghuy-wrap {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--brown-200) transparent;
}

.cw-card-title {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--brown-700);
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--brown-100);
  display: flex;
  align-items: center;
  gap: 6px;
}

.cw-badge {
  font-size: 10px;
  font-weight: 700;
  background: var(--brown-800);
  color: #fff;
  padding: 1px 6px;
  border-radius: 99px;
  letter-spacing: 0;
}

/* ─ BÁT CƯƠNG ─ */
.cw-bc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.cw-bc-box {
  border-radius: 8px;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.cw-bc-box--am   { background: #fef2f0; border: 1px solid #f5d0c7; }
.cw-bc-box--bieu { background: #fdf8f0; border: 1px solid #e8d9bc; }
.cw-bc-box--nhiet { background: #fff8f0; border: 1px solid #f5d0a0; }
.cw-bc-box--thuc { background: #f0f7f0; border: 1px solid #b8d9b8; }
.cw-bc-lbl { font-size: 10px; color: var(--gray-500); font-weight: 600; }
.cw-bc-val { font-size: 12.5px; font-weight: 800; color: var(--brown-800); }
.cw-hoichung {
  margin-top: 8px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--brown-700);
  background: var(--brown-50);
  border: 1px solid var(--brown-200);
  border-radius: 6px;
  padding: 5px 8px;
  text-align: center;
}

/* ─ 12 ĐƯỜNG KINH ─ */
.cw-meridian-groups { display: flex; flex-direction: column; gap: 8px; }
.cw-mg-group { display: flex; flex-direction: column; gap: 4px; }
.cw-mg-lbl {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.cw-mg-lbl--thuc { color: #a82e1e; }
.cw-mg-lbl--hu   { color: #235885; }
.cw-mg-chips { display: flex; flex-wrap: wrap; gap: 4px; }
.cw-mg-chip {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 5px;
}
.cw-mg-chip--thuc { background: #fce8e4; color: #a82e1e; }
.cw-mg-chip--hu   { background: #e4eef6; color: #235885; }
.cw-mg-empty {
  font-size: 11px;
  color: var(--gray-400);
  font-style: italic;
  margin: 0;
}

/* ─ THỂ BỆNH ─ */
.cw-syndromes { display: flex; flex-direction: column; gap: 4px; }
.cw-synd-item {
  font-size: 12px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 7px;
  border: 1px solid var(--brown-100);
  background: var(--surface-2);
  cursor: pointer;
  transition: all 0.15s;
  color: var(--brown-800);
  line-height: 1.3;
}
.cw-synd-item:hover { background: var(--brown-100); }
.cw-synd-item.active {
  background: var(--brown-800);
  color: #fff;
  border-color: var(--brown-800);
}

/* Header */
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 2px solid var(--brown-100);
}

.back-btn { display: inline-flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-sm); color: var(--gray-600); font-weight: 500; padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); transition: all var(--transition-fast); align-self: flex-start; }
.back-btn:hover { color: var(--brown-700); background: var(--brown-50); }

.exam-summary-row { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; }
.exam-summary { display: flex; flex-direction: column; gap: var(--space-1); }
.page-title { font-size: var(--font-size-2xl); font-weight: 700; color: var(--brown-800); }
.exam-meta { font-size: var(--font-size-sm); color: var(--gray-600); }
.exam-meta strong { color: var(--brown-700); font-weight: 600; }
.print-btns { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; flex-shrink: 0; }
.print-btn { display: inline-flex; align-items: center; gap: var(--space-2); flex-shrink: 0; font-size: var(--font-size-sm); font-weight: 600; color: var(--white); background: var(--brown-600, #92400e); border: 1px solid var(--brown-700, #78350f); padding: var(--space-2) var(--space-4); border-radius: var(--radius-md); cursor: pointer; transition: background var(--transition-fast), box-shadow var(--transition-fast); }
.print-btn:hover { background: var(--brown-700, #78350f); box-shadow: 0 1px 4px rgba(120, 53, 15, 0.25); }
.print-btn:active { transform: translateY(1px); }
.print-btn--acu { background: var(--chip-pulse-fg, #2f6690); border-color: var(--chip-pulse-fg, #2f6690); }
.print-btn--acu:hover { background: var(--brown-700, #78350f); }
.divider { margin: 0 var(--space-2); color: var(--gray-300); }

/* Thông tin bệnh nhân: dải gọn ngang trên đầu trang (thay bảng dọc cũ trong Mục I) */
.patient-info-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2) var(--space-6);
  margin-bottom: var(--space-3);
  padding: var(--space-2) var(--space-4);
  background: var(--white);
  border: 1px solid var(--brown-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.pi-field { display: flex; align-items: baseline; gap: 6px; font-size: var(--font-size-sm); min-width: 0; }
.pi-field.pi-grow { flex: 1 1 240px; }
.pi-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--gray-500); white-space: nowrap; }
.pi-value { font-weight: 700; color: var(--gray-800); }
.pi-value.pi-strong { color: var(--brown-800, #5c2e0e); }
@media (max-width: 640px) {
  .patient-info-bar { gap: var(--space-2) var(--space-4); padding: var(--space-3); }
  .pi-field, .pi-value { font-size: var(--font-size-xs); }
}

/* Layout 65 / 35 */
/* ═══════════ BỐ CỤC 2-VIEW: thanh ngữ cảnh dính + 2 tab + grid ═══════════ */
.mr-ctxbar {
  position: sticky; top: 0; z-index: 40;
  display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap;
  padding: var(--space-2) var(--space-4);
  background: rgba(250, 246, 239, 0.96); backdrop-filter: blur(8px);
  border: 1px solid var(--border); border-radius: var(--radius-lg);
  margin-bottom: var(--space-2);
}
.mr-ctx-patient { display: inline-flex; align-items: baseline; gap: var(--space-2); flex-shrink: 0; }
.mr-ctx-name { font-size: var(--font-size-base); font-weight: 700; color: var(--brown-900); }
.mr-ctx-meta { font-size: var(--font-size-sm); color: var(--gray-600); white-space: nowrap; }
.mr-ctx-more { width: 22px; height: 22px; border-radius: var(--radius-full); color: var(--brown-600); font-weight: 700; }
.mr-ctx-more:hover { background: var(--brown-50); }
.mr-verdict { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; flex: 1; min-width: 0; }
.mr-vd-label, .mr-vd-sep { font-size: var(--font-size-xs); font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--text-subtle); }
.mr-vd-sep { margin-left: 6px; }
.mr-vd-badge { font-size: var(--font-size-sm); font-weight: 600; color: var(--brown-800); background: var(--brown-100); border: 1px solid var(--brown-200); border-radius: var(--radius-full); padding: 2px 10px; transition: background var(--transition-fast); }
.mr-vd-badge:hover { background: var(--brown-200); }
.mr-vd-badge--organ { color: var(--info-fg); background: var(--info-bg); border-color: var(--info-border); }
.mr-vd-badge--tc { color: var(--gray-600); background: var(--surface-2); border-color: var(--border); font-weight: 500; }
.mr-vd-more { font-size: var(--font-size-xs); color: var(--gray-500); }
.mr-vd-empty { color: var(--gray-400); }
.mr-ctx-right { margin-left: auto; flex-shrink: 0; }
.mr-focus-chip { display: inline-flex; align-items: center; gap: 6px; font-size: var(--font-size-sm); color: var(--brown-800); background: var(--brown-50); border: 1px solid var(--brown-200); border-radius: var(--radius-full); padding: 2px 6px 2px 10px; }
.mr-focus-chip button { color: var(--danger); font-weight: 700; width: 18px; height: 18px; border-radius: var(--radius-full); }
.mr-focus-chip button:hover { background: var(--danger-bg); }
.mr-patient-more { display: flex; flex-wrap: wrap; gap: 4px var(--space-5); padding: var(--space-2) var(--space-4); margin-bottom: var(--space-2); background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-md); }

.mr-tabs { position: sticky; top: 48px; z-index: 39; display: flex; gap: var(--space-2); margin-bottom: var(--space-3); }
.mr-tab { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: 700; color: var(--gray-600); background: var(--surface); border: 1px solid var(--border); transition: all var(--transition-fast); }
.mr-tab b { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: var(--radius-full); background: var(--gray-200); color: var(--gray-600); font-size: var(--font-size-xs); }
.mr-tab:hover { border-color: var(--brown-300); color: var(--brown-700); }
.mr-tab.active { background: linear-gradient(135deg, var(--brown-600), var(--brown-700)); color: #fff; border-color: var(--brown-700); }
.mr-tab.active b { background: rgba(255,255,255,.25); color: #fff; }
.mr-tab-badge { font-size: var(--font-size-xs); font-weight: 600; opacity: .85; }

.mr-view { animation: mr-fade .18s ease; }
@keyframes mr-fade { from { opacity: 0; } to { opacity: 1; } }
.mr-grid { display: grid; gap: var(--space-4); align-items: start; }
/* View 1: 1 cột — BÁT CƯƠNG lên TRÊN (hình 3D | tóm tắt = 2 cột), KẾT QUẢ ĐO xuống CUỐI. */
.mr-grid--v1 { grid-template-columns: 1fr; }
.mr-grid--v1 > .bc-band { order: -1; } /* Mục II (Bát Cương) lên đầu, trước Mục I (bảng đo) */
/* Trong Bát Cương band: hình 3D (trái, rộng) | tóm tắt (phải, gọn) — 2 cột */
.mr-grid--v1 .bc-wrap--band {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: var(--space-4);
  align-items: start;
}
@media (max-width: 900px) {
  .mr-grid--v1 .bc-wrap--band { grid-template-columns: 1fr; }
}
.mr-grid--v2 { grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr); }
.mr-grid--v2 > .result-section { order: 1; }
.mr-grid--v2 > .phacdo-col { order: 2; }
.phacdo-col { display: flex; flex-direction: column; gap: var(--space-4); min-width: 0; }
.phacdo-head { display: flex; align-items: baseline; gap: var(--space-2); flex-wrap: wrap; }
.phacdo-title { font-size: var(--font-size-base); font-weight: 700; color: var(--brown-900); }
.phacdo-focus { font-size: var(--font-size-sm); color: var(--brown-700); }
.phacdo-focus--all { color: var(--gray-500); font-style: italic; }

/* VIEW 2: MỖI CỘT cuộn TRONG theo chiều cao màn → thấy cả 2 cột, KHÔNG phải cuộn TRANG.
   (~108px = ctxbar + tabs dính; chừa thêm cho lề) */
.mr-grid--v2 > .result-section,
.mr-grid--v2 > .phacdo-col {
  max-height: calc(100vh - 128px);
  overflow-y: auto;
  padding-right: 4px;
}
/* Cuộn mảnh + đổ bóng mép trên/dưới báo còn nội dung (tránh tưởng bị cắt) */
.mr-grid--v2 > .result-section, .mr-grid--v2 > .phacdo-col { scrollbar-width: thin; }

/* ═══════════ TAB 3: Biện chứng – Pháp trị (bảng ĐỊNH VỊ) ═══════════ */
.bcpt { display: flex; flex-direction: column; gap: var(--space-3); max-width: 1100px; }
.bcpt-the {
  display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px;
  padding: var(--space-2) var(--space-3);
  background: var(--surface-2); border: 1px solid var(--brown-100);
  border-left: 3px solid var(--brown-600); border-radius: var(--radius-md);
}
.bcpt-the-lb { font-size: var(--font-size-xs); font-weight: 700; text-transform: uppercase; letter-spacing: .03em; color: var(--gray-500); }
.bcpt-the-chip {
  font-size: var(--font-size-sm); font-weight: 700; color: var(--brown-800);
  background: var(--brown-50); border: 1px solid var(--brown-200);
  padding: 2px 10px; border-radius: 999px;
}
.bcpt-axis {
  padding: var(--space-3);
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md);
}
/* Thái Cực (AmDuongTaiji) + ③ Tính chất ngang hàng — cùng gốc chính khí/Hư-Thực. */
.bcpt-taiji-row { display: flex; flex-wrap: wrap; align-items: stretch; gap: var(--space-3); }
.bcpt-taiji-row > :deep(.ad-card) { flex: 1 1 320px; }
.bcpt-axis--tinhchat { flex: 1 1 260px; min-width: 0; }
.bcpt-axis--tinhchat .bcpt-sub { grid-template-columns: 130px 1fr; }
@media (max-width: 640px) {
  .bcpt-axis--tinhchat .bcpt-sub { grid-template-columns: 1fr; gap: 4px; }
}
.bcpt-axis-title {
  margin: 0 0 var(--space-2); display: flex; align-items: baseline; gap: 8px;
  font-size: var(--font-size-base); font-weight: 800; color: var(--brown-800);
}
.bcpt-axis-title em { font-style: normal; font-size: var(--font-size-xs); font-weight: 500; color: var(--gray-500); }
.bcpt-axis-num {
  display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 24px;
  padding: 0 6px; border-radius: 999px; background: var(--brown-600); color: #fff;
  font-size: var(--font-size-sm); font-weight: 800;
}
.bcpt-axis-num--tp { background: #15803d; }
.bcpt-sub {
  display: grid; grid-template-columns: 190px 1fr; gap: var(--space-2) var(--space-3);
  align-items: baseline; padding: 5px 0;
}
.bcpt-sub + .bcpt-sub { border-top: 1px dashed var(--brown-100); }
.bcpt-sub-lb { font-size: var(--font-size-xs); font-weight: 700; color: var(--brown-700); }
.bcpt-chips { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
.bcpt-chip {
  font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-500);
  background: var(--surface-2); border: 1px solid var(--border);
  padding: 3px 12px; border-radius: 999px; white-space: nowrap;
}
/* Chip "có" (định vị của bệnh nhân) — nổi bật màu nâu Đông Y */
.bcpt-chip--on { color: #fff; background: var(--brown-600); border-color: var(--brown-700); font-weight: 700; }
.bcpt-chip small { font-weight: 500; opacity: .8; margin-left: 2px; }
/* Tạng phủ tô theo Hàn/Nhiệt */
.bcpt-chip.temp-han { background: #2f6690; border-color: #245c8a; }
.bcpt-chip.temp-nhiet { background: #c0452a; border-color: #a83a20; }
.bcpt-chip.temp-mixed { background: linear-gradient(90deg, #2f6690 0 50%, #c0452a 50%); border-color: #8a4fbf; }
.bcpt-empty { color: var(--gray-400); font-size: var(--font-size-sm); }
.bcpt-empty-note { color: var(--gray-500); font-style: italic; font-size: var(--font-size-sm); padding: var(--space-2) var(--space-3); background: var(--surface-2); border-radius: var(--radius-md); }
.bcpt-loading { color: var(--gray-500); font-style: italic; padding: var(--space-3); }
/* Khối đồ hình định vị: vòng bên trái + chú giải/tạng phủ bên phải */
.bcpt-wheel-block {
  display: grid; grid-template-columns: minmax(320px, 500px) 1fr; gap: var(--space-4);
  align-items: start;
  padding: var(--space-3); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md);
}
.bcpt-wheel-main { display: flex; flex-direction: column; gap: var(--space-2); min-width: 0; }
.bcpt-wheel { min-width: 0; }
/* Thanh bóc lớp 1→5 */
.bcpt-lop { display: flex; flex-wrap: wrap; gap: 5px; }
.bcpt-lop-btn {
  flex: 1 1 auto; display: inline-flex; align-items: center; gap: 5px; justify-content: center;
  padding: 5px 8px; border: 1px solid var(--brown-200); border-radius: 999px;
  background: var(--surface-2); color: var(--brown-700); font-size: var(--font-size-xs); font-weight: 700; cursor: pointer;
  transition: all var(--transition-fast);
}
.bcpt-lop-btn i { font-style: normal; opacity: .6; font-size: 11px; }
.bcpt-lop-btn b {
  display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%;
  background: var(--brown-200); color: var(--brown-700); font-size: 10px;
}
.bcpt-lop-btn:hover { border-color: var(--brown-400); }
.bcpt-lop-btn.done { border-color: var(--brown-400); }
.bcpt-lop-btn.on { background: linear-gradient(135deg, var(--brown-600), var(--brown-700)); color: #fff; border-color: var(--brown-700); }
.bcpt-lop-btn.on b { background: rgba(255,255,255,.25); color: #fff; }
.bcpt-lop-btn.on i { opacity: .8; }
.bcpt-wheel-side { display: flex; flex-direction: column; gap: var(--space-2); min-width: 0; }
.bcpt-wheel-cap { font-size: var(--font-size-xs); color: var(--gray-600); line-height: 1.5; margin: 0; }
.bcpt-wheel-cap b { color: var(--brown-700); }
.bcpt-mini { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; padding-top: var(--space-2); border-top: 1px dashed var(--brown-100); }
.bcpt-mini-lb { font-size: var(--font-size-xs); font-weight: 700; color: var(--brown-700); }
/* ①② ở cột phải: gọn hơn, sub-nhóm xếp dọc cho vừa cột hẹp */
.bcpt-axis--side { padding: var(--space-2) var(--space-3); }
.bcpt-axis--side .bcpt-sub { grid-template-columns: 1fr; gap: 2px 0; padding: 4px 0; }
.bcpt-axis--side .bcpt-sub-lb { font-size: 11px; }
@media (max-width: 820px) {
  .bcpt-wheel-block { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .bcpt-sub { grid-template-columns: 1fr; gap: 3px; }
}

@media (max-width: 1024px) {
  .mr-grid--v1, .mr-grid--v2 { grid-template-columns: 1fr; }
  .mr-grid--v2 > .result-section, .mr-grid--v2 > .phacdo-col { order: initial; max-height: none; overflow: visible; }
  .mr-ctxbar { position: static; }
  .mr-tabs { top: 0; }
}

/* IN: bỏ dính, hiện CẢ 2 view + bỏ cap cột để in đủ 5 mục */
@media print {
  .mr-ctxbar, .mr-tabs { position: static; }
  .mr-view { display: block !important; }
  .mr-view + .mr-view { margin-top: var(--space-4); }
  .mr-grid--v2 > .result-section, .mr-grid--v2 > .phacdo-col { max-height: none; overflow: visible; }
  .ph-chip__map-btn { display: none; }
}

/* ===== Màn THẤP (≤920px cao): nén để I+II+III vừa 1 màn — màn 1080 KHÔNG bị ảnh hưởng ===== */
@media (max-height: 920px) {
  .page-header { gap: var(--space-1); margin-bottom: var(--space-2); padding-bottom: var(--space-2); }
  .patient-info-bar { margin-bottom: var(--space-2); padding: 3px var(--space-3); gap: 2px var(--space-4); }
  .pi-field, .pi-value, .pi-label { font-size: var(--font-size-xs); }
  .results-layout { gap: var(--space-3); }
  .result-section { gap: var(--space-1); }
  .section-title { font-size: var(--font-size-sm); }
  .section-num { width: 22px; height: 22px; }
  .table-section-title { padding: 3px var(--space-3) 2px; }
  .stat-col { padding: 2px var(--space-1); }
  .stat-label { font-size: 9px; }
  .data-table td { padding: 2px 8px; font-size: var(--font-size-xs); }
  .meridian-head-row th { padding: 2px 4px; font-size: 9px; }
  .table-footer-stat { padding: 4px var(--space-3); }
  .bc-wrap--band > .bc-figblock { min-height: clamp(280px, 40vh, 380px); }
  /* Màn thấp: nén thẻ tạng phủ (icon + đệm nhỏ lại) → 6 thẻ/cột vừa khít, khối hình không bị
     cao quá mà vẫn không tràn/đè (min-height ở trên đã đảm bảo không đè). */
  .bc-wrap--band .bc-organs-col :deep(.organ-card) { padding: 3px; gap: 0; }
  .bc-wrap--band .bc-organs-col :deep(.organ-svg) { width: 28px; height: 28px; }
  .bc-wrap--band .bc-organs-col :deep(.organ-card-name) { font-size: 10px; }
  .bc-wrap--band .bc-organs-col :deep(.organ-card-tag) { font-size: 8px; }
}

/* Sections */
.result-section { display: flex; flex-direction: column; gap: var(--space-2); }
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

/* Mục III dạng cây: thể liên quan (gốc YHCT / biểu hiện YHHĐ) hiện làm dòng con kèm cơ chế */
.synd-node--parent { border-left: 3px solid #b45309; }
.synd-sub {
  margin: 4px 0 0 26px;
  padding-left: 10px;
  border-left: 2px dashed #d9b98a;
}
.synd-sub-head { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13px; }
.synd-sub-caret { color: #b45309; font-weight: 700; }
.synd-sub-tag {
  font-size: 10px;
  font-weight: 700;
  border-radius: 999px;
  padding: 0 6px;
  white-space: nowrap;
}
.synd-sub-tag--yhct { color: #92400e; background: #fdf0da; border: 1px solid #f0d6b0; }
.synd-sub-tag--yhhd { color: #1d4ed8; background: #e8efff; border: 1px solid #c7d7fb; }
.synd-sub-name { font-weight: 600; color: var(--gray-800); }
.synd-sub-meas { font-size: 10px; color: #15803d; font-weight: 700; }
.synd-sub-note {
  display: block;
  margin: 2px 0 0 18px;
  font-size: 12.5px;
  line-height: 1.5;
  color: #7c5a2e;
  font-style: italic;
}

/* Phương huyệt — group theo phương pháp */
.ph-groups { display: flex; flex-direction: column; gap: var(--space-3); }
.ph-missing-warn { margin-top: var(--space-3); padding: 8px 12px; border: 1px solid #fde68a; background: #fffbeb; border-radius: var(--radius-md); font-size: 12px; color: #92400e; line-height: 1.55; }
.ph-missing-warn b { color: #b45309; }
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
.ph-chip-wrap {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.ph-chip__map-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  font-size: 11px;
  line-height: 1;
  border-radius: 50%;
  border: 1px solid var(--chip-pulse-border);
  background: var(--white);
  color: var(--chip-pulse-fg);
  cursor: pointer;
  transition: background .12s, border-color .12s, transform .12s;
}
.ph-chip__map-btn:hover {
  background: var(--chip-pulse-border);
  border-color: var(--chip-pulse-fg);
  transform: scale(1.08);
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
.ph-note-body--ynghia { margin-bottom: 2px; }
.ph-note-body--ynghia .ph-note-label { color: var(--brown-800); }
.ph-note-source {
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 600;
  color: #b45309;
  background: #fef3e2;
  border: 1px solid #f0d6b0;
  padding: 1px 8px;
  border-radius: 999px;
}
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

/* ── Thang Đặc Trị (V. Phương Dược — gộp vị thuốc, tích/sửa liều, lưu đơn) ── */
.dt-block { display: flex; flex-direction: column; gap: var(--space-3); }
.dt-head { display: flex; flex-direction: column; gap: 2px; }
.dt-title { font-size: var(--font-size-md); font-weight: 800; color: var(--brown-900); }
.dt-sub { font-size: var(--font-size-xs); color: var(--gray-500); }
.dt-filter { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; margin-top: 4px; }
.dt-filter-on { font-size: var(--font-size-sm); color: var(--brown-800); background: var(--brown-50); border: 1px solid var(--brown-200); border-radius: var(--radius-full); padding: 2px 10px; }
.dt-filter-on b { color: var(--brown-900); }
.dt-filter-clear { font-size: var(--font-size-xs); font-weight: 600; color: var(--danger); }
.dt-filter-clear:hover { text-decoration: underline; }
.dt-filter-all { font-size: var(--font-size-xs); color: var(--gray-500); font-style: italic; }
.dt-table { display: flex; flex-direction: column; border: 1px solid var(--gray-200); border-radius: var(--radius-md); overflow: hidden; background: var(--white); }
.dt-row { display: grid; grid-template-columns: 30px minmax(110px, 1.8fr) 58px minmax(84px, 1fr) minmax(66px, 0.9fr); gap: var(--space-2); align-items: center; padding: 6px var(--space-3); }
.dt-row + .dt-row { border-top: 1px solid var(--gray-100); }
.dt-row--head { background: var(--surface-2); border-bottom: 1px solid var(--gray-200); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gray-500); }
.dt-row:not(.dt-row--head):hover { background: var(--surface-2); }
.dt-row--off { opacity: 0.5; }
.dt-row--off .dt-vi-ten { text-decoration: line-through; }
.dt-c { font-size: var(--font-size-sm); min-width: 0; }
.dt-c--chk { display: flex; align-items: center; justify-content: center; }
.dt-chk { width: 16px; height: 16px; accent-color: var(--brown-600); cursor: pointer; }
.dt-c--name { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
.dt-vi-ten { font-weight: 600; color: var(--brown-900); word-break: break-word; }
.dt-from { font-size: 10px; color: var(--gray-400); white-space: nowrap; }
.dt-c--freq { text-align: center; }
.dt-freq { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 20px; padding: 0 6px; border-radius: var(--radius-full); background: var(--gray-100); color: var(--gray-600); font-size: 11px; font-weight: 700; }
.dt-freq--core { background: var(--brown-100); color: var(--brown-800); }
.dt-lieu { width: 100%; height: 28px; padding: 0 8px; border: 1px solid var(--gray-300); border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-family: ui-monospace, monospace; color: var(--black); background: var(--white); }
.dt-lieu:focus { outline: none; border-color: var(--brown-400); box-shadow: var(--focus-ring); }
.dt-c--role { color: var(--gray-700); }
.dt-foot { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
.dt-note { flex: 1; min-width: 180px; height: 34px; padding: 0 var(--space-3); border: 1px solid var(--gray-300); border-radius: var(--radius-md); font-size: var(--font-size-sm); background: var(--white); color: var(--black); }
.dt-note:focus { outline: none; border-color: var(--brown-400); box-shadow: var(--focus-ring); }
.dt-actions { display: flex; align-items: center; gap: var(--space-3); margin-left: auto; }
.dt-saved-msg { font-size: var(--font-size-sm); color: var(--success); }
.dt-save { height: 34px; padding: 0 var(--space-4); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: 700; color: var(--white); background: var(--brown-600); transition: background var(--transition-fast); }
.dt-save:hover:not(:disabled) { background: var(--brown-700); }
.dt-save:disabled { opacity: 0.5; cursor: not-allowed; }
.dt-toggles { display: flex; gap: var(--space-4); flex-wrap: wrap; align-items: center; }
.dt-toggle { font-size: var(--font-size-sm); font-weight: 600; color: var(--brown-700); padding: 4px 0; }
.dt-toggle:hover { color: var(--brown-900); text-decoration: underline; }
.dt-phantich-empty { font-size: var(--font-size-sm); color: var(--gray-500); padding: var(--space-4); text-align: center; }
.dt-loading { font-size: var(--font-size-sm); color: var(--gray-500); padding: var(--space-5); text-align: center; }
.dt-toggle--btn:disabled { opacity: 0.45; cursor: not-allowed; text-decoration: none; }

/* Modal PHÂN TÍCH THANG — toàn màn hình; analysis dùng layout 2 cột rộng tự nhiên của nó. */
.dtpt-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; padding: var(--space-4); z-index: 340; animation: ptm-fade 0.18s ease; }
.dtpt-modal { width: 100%; max-width: 1120px; max-height: 94vh; background: var(--surface, #fff); border-radius: var(--radius-lg); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24px 64px rgba(0, 0, 0, 0.32); }
.dtpt-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--gray-100); flex-shrink: 0; }
.dtpt-head h3 { font-size: var(--font-size-md); font-weight: 800; color: var(--brown-900); }
.dtpt-sub { font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-500); }
.dtpt-body { padding: var(--space-5); overflow-y: auto; }
.dt-source { margin-top: var(--space-2); padding-top: var(--space-3); border-top: 1px dashed var(--border); }

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
.data-table td { padding: 4px 12px; border: 1px solid var(--gray-200); }
.data-table.mb-0 { margin-bottom: 0; }
.meridian-data-table td { text-align: center; border-color: var(--gray-100); }
.meridian-data-table td:first-child { text-align: left; }
/* Hàng tiêu đề cột (ghi nhỏ để biết mỗi ô là chỉ số gì) */
.meridian-head-row th {
  padding: 4px 6px;
  font-size: 10px;
  line-height: 1.2;
  font-weight: 600;
  color: var(--gray-500);
  background: var(--surface-2);
  border: 1px solid var(--gray-200);
  text-align: center;
  text-transform: none;
  white-space: nowrap;
  cursor: help;
}
.meridian-head-row th:first-child { text-align: left; }

.table-section-title { font-weight: 700; color: var(--brown-700); padding: var(--space-2) var(--space-4) 6px; text-transform: uppercase; font-size: var(--font-size-sm); }
.stats-summary-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; border-top: 1px solid var(--brown-200); border-bottom: 1px solid var(--brown-200); background: var(--surface-2); }
.stat-col { padding: 5px var(--space-2); text-align: center; font-size: var(--font-size-sm); font-weight: 600; border-right: 1px solid var(--gray-200); display: flex; flex-direction: column; justify-content: center; }
.stat-col:last-child { border-right: none; }
/* Nhãn nhỏ giải thích từng ô thống kê (số vẫn hiện to bên dưới) */
.stat-label {
  display: block;
  font-size: 10px;
  line-height: 1.1;
  font-weight: 600;
  color: var(--gray-500);
  text-transform: none;
  margin-bottom: 2px;
  cursor: help;
}
.stat-col .val { display: inline-block; }
/* Hai giá trị (Cao/Thấp, Cận trên/dưới) nằm CÙNG một dòng → hàng thống kê thấp lại */
.stat-vals { white-space: nowrap; line-height: 1.2; }
.max-val { color: #dc2626; }
.min-val { color: #0284c7; }

.bg-gray { background-color: var(--gray-50); }
.text-brown-600 { color: var(--brown-600); }

/* Bát Cương: đồ hình (3D/2D) + bảng tóm tắt cạnh nhau, tự xuống dòng khi hẹp */
.bc-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: flex-start;
}
.bc-figure {
  flex: 1 1 240px;
  min-width: 230px;
}
.bc-summary {
  flex: 1 1 200px;
  min-width: 190px;
}
/* Dải Bát Cương full-width ở trên cùng: tạng phủ vây quanh hình người + tóm tắt bên phải */
.bc-band {
  /* khoảng cách do gap của lưới .results-layout lo, không cần margin riêng */
  margin-bottom: 0;
}
.bc-wrap--band {
  flex-direction: column;
  gap: var(--space-3);
}
.bc-wrap--band > .bc-figblock,
.bc-wrap--band > .bc-summary {
  flex: 0 0 auto !important;
  width: 100%;
  min-width: 0;
}
.bc-wrap--band > .bc-figblock {
  /* min-height (KHÔNG phải height cố định): cao TỐI THIỂU cho khối hình 3D, nhưng GIÃN ra chứa
     trọn 2 cột tạng phủ (6 thẻ/cột) trên màn thấp/hẹp → tóm tắt bên dưới KHÔNG đè lên tỳ/thận/
     bàng quang/tam tiêu. Canvas vẫn có chiều cao xác định nhờ align-items:stretch (chiều cao do
     cột tạng phủ quy định — độc lập với canvas → không vỡ vòng lặp resize). */
  min-height: clamp(360px, 50vh, 500px);
}
.bc-figblock {
  flex: 1.7 1 520px;
  display: flex;
  gap: var(--space-2);
  align-items: stretch;
  min-width: 0;
}
.bc-organs-col {
  flex: 0 0 92px;
}
.bc-band .bc-figure {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0; /* chiều cao do .bc-figblock quy định (xác định, không phình) */
  /* CẦN để hình 3D hiện đúng: .bc-figblock chỉ có min-height (không phải height xác định) nên height:100%
     của host KHÔNG resolve → host co theo canvas → vòng lặp resize kẹt canvas cao 1px (trắng xoá). Để
     height:auto + align-self:stretch thì align-items:stretch của .bc-figblock giãn host theo chiều cao
     hàng (do cột tạng phủ quy định) — độc lập với canvas. */
  height: auto;
  align-self: stretch;
}
.bc-band .bc-summary {
  flex: 1 1 300px;
  min-width: 260px;
}
@media (max-width: 900px) {
  .bc-figblock {
    flex-wrap: wrap;
  }
  .bc-organs-col {
    flex: 1 1 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }
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

/* NHÁY chỉ số tương quan: cao hơn = đỏ ấm · thấp hơn = lam mát · mốc TB = nâu.
   Dùng viền-TRONG (inset) + sáng nhấp → KHÔNG bị cắt dù ô có overflow (cả <td> lẫn <span> đều rõ). */
@keyframes bc-flash-blink {
  0%,
  100% {
    box-shadow: inset 0 0 0 0 transparent;
    filter: brightness(1);
  }
  50% {
    box-shadow: inset 0 0 0 2px currentColor, 0 0 6px currentColor;
    filter: brightness(1.18);
  }
}
.bc-flash {
  position: relative;
  z-index: 2;
  font-weight: 800 !important;
  border-radius: 4px;
  animation: bc-flash-blink 0.95s ease-in-out infinite;
}
.bc-flash--high {
  background: rgba(192, 69, 42, 0.24) !important;
  color: #b23a25 !important;
}
.bc-flash--low {
  background: rgba(47, 102, 144, 0.24) !important;
  color: #2f6690 !important;
}
.bc-flash--ref {
  background: rgba(120, 53, 15, 0.2) !important;
  color: #8a5a1e !important;
}
@media (prefers-reduced-motion: reduce) {
  .bc-flash {
    animation: none;
    box-shadow: inset 0 0 0 2px currentColor;
  }
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

.table-footer-stat { padding: var(--space-2) var(--space-4); background: var(--brown-50); border-top: 1px solid var(--brown-200); font-size: var(--font-size-sm); display: flex; flex-wrap: wrap; align-items: baseline; justify-content: flex-end; gap: 2px var(--space-3); }
.footer-stat-line { display: flex; align-items: center; cursor: help; }
.footer-stat-note { max-width: 520px; font-size: 10px; font-weight: 400; font-style: italic; line-height: 1.3; color: var(--gray-500); text-align: right; }

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
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  background: var(--white);
  border: 1px solid var(--brown-200);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
}
/* Hàng mô hình bệnh Đông Y (mục III) có tới 3 nút hành động (Chi tiết/Pháp trị/Châm huyệt) — tách
   riêng cụm tên/mã (.synd-info) và cụm nút (.synd-actions) để khi hẹp chỗ, CỤM NÚT tự xuống dòng
   dưới tên thay vì ép chữ tên co lại từng chữ một (mất thẩm mỹ). */
.synd-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1 1 140px;
  min-width: 0;
}
.synd-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  margin-left: auto;
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
  min-width: 56px;
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
.bct-modal { max-width: 640px; }
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

.ptm-learn { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 12px; padding: var(--space-2) var(--space-5) var(--space-3); border-bottom: 1px solid var(--gray-100); }
.ptm-learn__btn { display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: 600; text-decoration: none; color: var(--white); background: linear-gradient(135deg, var(--brown-600, #8a6d3b), var(--brown-700, #6b4f2a)); transition: transform var(--transition-fast), box-shadow var(--transition-fast); }
.ptm-learn__btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(74, 47, 23, 0.18); }
.ptm-learn__note { font-size: var(--font-size-xs); color: var(--gray-500); font-style: italic; }

/* ── Nút "Hỏi phân biệt triệu chứng" trong cột Đông Y ── */
.tc-phanbiet-btn { width: 100%; margin: 2px 0 8px; padding: 8px; border: 1px solid var(--brown-300); border-radius: var(--radius-md); background: linear-gradient(135deg, var(--brown-600, #8a6d3b), var(--brown-700, #6b4f2a)); color: #fff; font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all var(--transition-fast); }
.dongy-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.dongy-head .tc-phanbiet-btn { width: auto; margin: 0; padding: 8px 14px; flex: none; }
.dongy-saved { margin: 0 0 12px; padding: 6px 10px; border-radius: 8px; background: #f0fdf4; border: 1px solid #bbf7d0; font-size: 12.5px; color: #15803d; }
.dongy-saved-time { color: var(--gray-500); font-weight: 400; }
.tc-phanbiet-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(74, 47, 23, 0.2); }

/* ── Modal phân biệt thể bệnh ── */
.pb-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; padding: var(--space-4); z-index: 320; animation: ptm-fade 0.18s ease; }
.pb-modal { width: 100%; max-width: 680px; max-height: 92vh; background: var(--surface, #fff); border-radius: var(--radius-lg); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
.pb-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--gray-100); }
.pb-head h3 { margin: 0; font-size: var(--font-size-lg); color: var(--brown-800, #5b3a1a); }
.pb-sub { font-size: var(--font-size-xs); color: var(--gray-500); }
.pb-body { padding: var(--space-4) var(--space-5); overflow-y: auto; flex: 1; background: var(--surface-2, #faf8f3); }
.pb-cands { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.pb-cand { display: inline-flex; align-items: center; border: 1px solid var(--border, #e5e0d6); border-radius: 999px; background: #fff; }
.pb-cand.off { opacity: 0.4; }
.pb-cand--kep { border-color: #c084fc; background: #faf5ff; }
.pb-cand-toggle { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px 5px 5px; border: 0; background: transparent; cursor: pointer; font-size: 13px; border-radius: 999px; }
.pb-cand-name { font-weight: 600; color: var(--brown-800, #5b3a1a); }
.pb-cand-do { font-size: 11px; color: var(--gray-500); }
.pb-cand-tag { font-size: 10px; font-weight: 700; color: #7c3aed; background: #f3e8ff; border: 1px solid #e9d5ff; border-radius: 6px; padding: 1px 6px; margin-left: 4px; }
.pb-cand-warn { font-size: 10px; font-weight: 700; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 1px 6px; margin-left: 4px; }
.pb-databanner { margin: 0 0 12px; padding: 9px 12px; border: 1px solid #fde68a; background: #fffbeb; border-radius: 8px; font-size: 12px; color: #92400e; line-height: 1.5; }
.pb-databanner b { color: #b45309; }
.pb-cand-x { border: 0; background: transparent; color: var(--gray-400, #9ca3af); cursor: pointer; font-size: 12px; padding: 0 9px 0 2px; line-height: 1; }
.pb-cand-x:hover { color: #dc2626; }
/* Ghép thể kép */
.pb-kep { margin: 0 0 14px; padding: 10px 12px; border: 1px dashed #d8b4fe; border-radius: 10px; background: #fdfaff; }
.pb-kep-title { font-size: 12px; font-weight: 800; color: #7c3aed; margin-bottom: 8px; }
.pb-kep-title span { font-weight: 400; color: var(--gray-500); }
.pb-kep-picks { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.pb-kep-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; font-weight: 600; color: #6b21a8; background: #f3e8ff; border: 1px solid #e9d5ff; border-radius: 999px; padding: 3px 6px 3px 10px; }
.pb-kep-chip button { border: 0; background: transparent; color: #a855f7; cursor: pointer; font-size: 11px; padding: 0 2px; line-height: 1; }
.pb-kep-chip button:hover { color: #dc2626; }
.pb-kep-search { position: relative; }
.pb-kep-input { width: 100%; box-sizing: border-box; padding: 7px 10px; border: 1px solid var(--border, #e5e0d6); border-radius: 8px; font-size: 13px; background: #fff; }
.pb-kep-input:focus { outline: none; border-color: #c084fc; }
.pb-kep-hint { font-size: 12px; color: var(--gray-500); padding: 6px 2px; }
.pb-kep-results { display: flex; flex-direction: column; gap: 2px; margin-top: 6px; max-height: 180px; overflow-y: auto; border: 1px solid var(--gray-100); border-radius: 8px; background: #fff; }
.pb-kep-result { display: flex; align-items: center; justify-content: space-between; gap: 8px; text-align: left; border: 0; background: transparent; padding: 7px 10px; font-size: 13px; color: var(--brown-800, #5b3a1a); cursor: pointer; border-bottom: 1px solid var(--gray-100); }
.pb-kep-result:last-child { border-bottom: 0; }
.pb-kep-result:hover { background: #faf5ff; }
.pb-kep-result-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pb-kep-tc { flex: none; font-size: 10.5px; font-weight: 700; color: #0d9488; background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 6px; padding: 1px 6px; }
.pb-kep-tc--zero { color: #9ca3af; background: #f3f4f6; border-color: #e5e7eb; }
.pb-kep-actions { display: flex; }
.pb-kep-add { border: 0; background: #7c3aed; color: #fff; font-weight: 700; font-size: 13px; border-radius: 8px; padding: 7px 14px; cursor: pointer; }
.pb-kep-add:hover { background: #6d28d9; }
.pb-kep-err { margin-top: 6px; font-size: 12px; color: #dc2626; }
.pb-score-parts { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; margin: 0 0 6px 28px; font-size: 11.5px; color: var(--gray-500); }
.pb-parts-lbl { font-weight: 700; color: #7c3aed; }
.pb-part { background: #f3e8ff; border: 1px solid #e9d5ff; border-radius: 6px; padding: 1px 7px; color: #6b21a8; }
.pb-part--nodata { background: #f3f4f6; border-color: #e5e7eb; color: #9ca3af; }
.pb-parts-note { font-style: italic; }
.pb-parts-warn { font-style: italic; color: #b45309; }
.pb-no { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; color: #fff; font-size: 11px; font-weight: 800; flex: none; background: #6B7280; }
.pb-no--sm { width: 16px; height: 16px; font-size: 9px; }
.pb-no[data-i='0'] { background: #B45309; }
.pb-no[data-i='1'] { background: #0D9488; }
.pb-no[data-i='2'] { background: #9F1239; }
.pb-no[data-i='3'] { background: #7c3aed; }
.pb-no[data-i='4'] { background: #2563eb; }
.pb-no[data-i='5'] { background: #db2777; }
.pb-scores { margin-bottom: 14px; padding: 10px 12px; border: 1px solid var(--border, #e5e0d6); border-radius: 10px; background: #fff; }
.pb-scores-title { font-size: 11px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; color: var(--gray-500); margin-bottom: 6px; }
.pb-score-row { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
.pb-score-name { flex: 0 0 38%; font-size: 13px; font-weight: 600; color: var(--brown-800, #5b3a1a); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pb-score-bar { flex: 1; height: 9px; background: var(--gray-100); border-radius: 5px; overflow: hidden; }
.pb-score-bar > span { display: block; height: 100%; background: linear-gradient(90deg, var(--brown-500, #8a6d3b), var(--brown-700, #6b4f2a)); transition: width 0.25s ease; }
.pb-score-pct { flex: none; width: 40px; text-align: right; font-size: 13px; font-weight: 700; color: var(--brown-700, #6b4f2a); }
.pb-group-title { font-size: 12px; font-weight: 800; color: var(--brown-700, #6b4f2a); margin: 14px 0 6px; }
.pb-group-title span { font-weight: 400; color: var(--gray-500); }
.pb-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 7px 0; border-bottom: 1px solid var(--gray-100); }
.pb-row-info { display: flex; align-items: center; gap: 6px; min-width: 0; }
.pb-sym-name { font-size: 13.5px; color: var(--text, #2c2017); }
.pb-ans { display: flex; gap: 4px; flex: none; }
.pb-ans-btn { padding: 4px 9px; border: 1px solid var(--border, #e5e0d6); background: #fff; border-radius: 7px; font-size: 12px; cursor: pointer; color: var(--gray-600); }
.pb-ans-btn.on.pb-co { background: #16A34A; border-color: #16A34A; color: #fff; }
.pb-ans-btn.on.pb-khong { background: #DC2626; border-color: #DC2626; color: #fff; }
.pb-ans-btn.on.pb-kho { background: #9CA3AF; border-color: #9CA3AF; color: #fff; }
.pb-ctx { display: flex; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--gray-100); }
.pb-ctx-body { font-size: 12.5px; color: var(--gray-700); }
.pb-ctx-body strong { color: var(--brown-800, #5b3a1a); }
.pb-ctx-body p { margin: 2px 0; }
.pb-hint { font-size: 11.5px; color: var(--gray-500); margin: 4px 0 2px; }
.pb-tag-key { flex: none; font-size: 10px; font-weight: 700; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 1px 6px; }
.pb-more-btn { margin: 4px 0 2px; border: 1px dashed var(--border, #e5e0d6); background: #fff; color: var(--brown-700, #6b4f2a); border-radius: 8px; padding: 5px 12px; font-size: 12px; font-weight: 600; cursor: pointer; }
.pb-more-btn:hover { background: var(--gray-50, #f7f5f0); }
.pb-row--key { background: linear-gradient(90deg, #fffbeb 0%, transparent 60%); }
.pb-nn-group { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 6px; margin: 3px 0; }
.pb-nn-label { font-size: 11.5px; font-weight: 700; color: var(--brown-700, #6b4f2a); flex: none; }
.pb-nn-chip { font-size: 12px; color: var(--gray-700); background: var(--gray-50, #f7f5f0); border: 1px solid var(--gray-200, #e8e3d8); border-radius: 6px; padding: 1px 8px; }
.pb-conclude { margin-top: 16px; padding: 12px; border: 1px solid var(--brown-200, #e7d9c2); border-radius: 10px; background: #fdfbf6; }
.pb-conclude-row { display: flex; align-items: center; gap: 8px; margin: 4px 0 8px; flex-wrap: wrap; }
.pb-conclude-lbl { font-size: 12.5px; font-weight: 700; color: var(--brown-700, #6b4f2a); flex: none; }
.pb-conclude-select { flex: 1; min-width: 200px; padding: 6px 10px; border: 1px solid var(--border, #e5e0d6); border-radius: 8px; font-size: 13px; background: #fff; }
.pb-conclude-row--multi { align-items: flex-start; flex-direction: column; gap: 6px; }
.pb-conclude-sub { font-weight: 500; font-size: 11.5px; color: var(--gray-500); }
.pb-conclude-checks { display: flex; flex-direction: column; gap: 4px; width: 100%; }
.pb-conclude-check { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border: 1px solid var(--border, #e5e0d6); border-radius: 8px; font-size: 13px; background: #fff; cursor: pointer; transition: border-color .15s, background .15s; }
.pb-conclude-check:hover { border-color: var(--brown-300, #d6bd92); }
.pb-conclude-check.on { border-color: var(--brown-500, #a07d45); background: var(--brown-50, #f7efe1); font-weight: 600; }
.pb-conclude-check input { accent-color: var(--brown-600, #8a5e28); cursor: pointer; flex: none; }
.pb-conclude-empty { margin: 0 0 8px; font-size: 11.5px; font-style: italic; color: var(--gray-500); }
.pb-conclude-note { width: 100%; box-sizing: border-box; padding: 7px 10px; border: 1px solid var(--border, #e5e0d6); border-radius: 8px; font-size: 13px; resize: vertical; font-family: inherit; }
.pb-conclude-actions { display: flex; align-items: center; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
.pb-save-btn { border: 0; background: var(--brown-700, #6b4f2a); color: #fff; font-weight: 700; font-size: 13px; border-radius: 8px; padding: 8px 16px; cursor: pointer; }
.pb-save-btn:disabled { opacity: 0.5; cursor: default; }
.pb-save-msg { font-size: 12.5px; font-weight: 600; color: #15803d; }
.pb-save-prev { font-size: 12px; color: var(--gray-600); }
.pb-disclaimer { margin-top: 14px; font-size: 11.5px; font-style: italic; color: var(--gray-500); }

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
.ptm-tag--phap { background: var(--brown-100); color: var(--brown-800); border-color: var(--brown-200); text-decoration: none; }
.ptm-tag--phap:hover { background: var(--brown-200); }
.ptm-tag--nn { background: var(--brown-50); color: var(--brown-800); border-color: var(--brown-200); }

/* Popup "Chi tiết bệnh" — nhóm nguyên nhân / triệu chứng theo nhãn, mỗi nhóm 1 hàng */
.bct-groups { display: flex; flex-direction: column; gap: 6px; padding: 8px 0; border-top: 1px solid var(--gray-100); }
.bct-group { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px; }
.bct-group__tag { flex: none; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; color: var(--gray-500); min-width: 120px; }
.bct-group__items { display: inline-flex; flex-wrap: wrap; gap: 5px; }

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

/* ── Kết luận Lục Kinh (Thương Hàn) — câu chốt định vị ca (GỌN 1 dòng + chi tiết ẩn) ── */
.lk-verdict {
  margin: var(--space-2) 0 var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-left: 4px solid var(--brown-600);
  border-radius: var(--radius-md);
  background: var(--brown-50, var(--surface-2));
}
.lk-verdict--cao { border-left-color: #2e6f52; }
.lk-verdict--vua { border-left-color: var(--brown-600); }
.lk-verdict--thap { border-left-color: var(--gray-400, #b6a892); }
.lk-verdict-head { display: flex; align-items: baseline; gap: 6px 10px; flex-wrap: wrap; }
.lk-verdict-head .lk-badge { margin-left: auto; }
.lk-eyebrow { font-size: var(--font-size-xs); font-weight: 800; letter-spacing: .03em; color: var(--brown-700); text-transform: uppercase; align-self: center; }
.lk-details { margin-top: var(--space-2); }
.lk-details > summary { font-size: 12px; font-weight: 700; color: var(--brown-700); cursor: pointer; list-style: revert; }
.lk-details > summary:hover { color: var(--brown-800, var(--brown-700)); }
.lk-details[open] > summary { margin-bottom: var(--space-2); }
.lk-badge { font-size: 11px; font-weight: 800; padding: 2px 10px; border-radius: 999px; white-space: nowrap; }
.lk-badge--cao { color: #fff; background: #2e6f52; }
.lk-badge--vua { color: #fff; background: var(--brown-600); }
.lk-badge--thap { color: var(--text-subtle); background: var(--surface-2); border: 1px solid var(--border); }
.lk-main { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px 12px; margin: var(--space-2) 0 var(--space-1); }
.lk-kinh { font-size: var(--font-size-lg); font-weight: 800; color: var(--text-brand); }
.lk-kinh i { font-style: normal; font-weight: 600; opacity: .7; font-size: .85em; }
.lk-giaidoan { font-size: var(--font-size-sm); font-weight: 700; color: var(--brown-700); }
.lk-hopbenh { font-size: 11.5px; font-weight: 700; color: #fff; background: #8a5a2e; padding: 1px 9px; border-radius: 999px; }
.lk-ketluan { margin: 0 0 var(--space-2); font-size: var(--font-size-sm); line-height: 1.55; color: var(--text); }
.lk-lydo { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 3px; }
.lk-lydo li { font-size: 12.5px; line-height: 1.45; color: var(--text-subtle); }
.lk-ngoai { margin: var(--space-2) 0 0; font-size: 12px; font-style: italic; color: var(--text-subtle); }
/* Chips định vị (tập kinh) + chuyển biến — cùng nguồn, đồng bộ đồ hình */
.lk-chips { display: flex; flex-direction: column; gap: 5px; margin-top: var(--space-2); }
.lk-chip-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.lk-chip-lb { font-size: 10.5px; font-weight: 800; letter-spacing: .03em; text-transform: uppercase; color: var(--text-subtle); min-width: 62px; }
.lk-kchip { font-size: 12px; font-weight: 700; color: #fff; padding: 2px 10px; border-radius: 999px; background: var(--brown-600); }
.lk-kchip em { font-style: normal; font-weight: 600; opacity: .85; }
.lk-kchip.troi { box-shadow: 0 0 0 2px var(--surface), 0 0 0 3.5px currentColor; }
.lk-kchip[data-kinh="thai-duong"] { background: #3d6a8c; }
.lk-kchip[data-kinh="duong-minh"] { background: #a3801f; }
.lk-kchip[data-kinh="thieu-duong"] { background: #bd5730; }
.lk-kchip[data-kinh="thai-am"] { background: #8c6f2e; }
.lk-kchip[data-kinh="thieu-am"] { background: #ab3644; }
.lk-kchip[data-kinh="quyet-am"] { background: #4c7742; }
/* Chip Lục Kinh BẤM ĐƯỢC — soi kinh tương ứng trên đồ hình */
.lk-kchip--btn { border: none; cursor: pointer; font-family: inherit; line-height: 1.35; transition: transform .1s, box-shadow .12s, filter .12s; }
.lk-kchip--btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
.lk-kchip--btn:focus-visible { outline: 2px solid var(--brown-700); outline-offset: 2px; }
.lk-kchip--sm { font-size: 11.5px; padding: 2px 9px; }
/* Đang soi: viền vàng đậm + hào quang — khớp với ô nổi bật trên đồ hình */
.lk-kchip--btn.is-focus { box-shadow: 0 0 0 2px var(--surface), 0 0 0 3.5px #c99a2e, 0 2px 8px rgba(201,154,46,.5); filter: brightness(1.1); }
.lk-kchip--btn.troi.is-focus { box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px #c99a2e, 0 2px 10px rgba(201,154,46,.6); }
.lk-cb { font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 999px; cursor: help; white-space: nowrap; }
.lk-cb--vaoly { color: #fff; background: #bf4632; }
.lk-cb--rabieu { color: #fff; background: #4f8a3f; }
.lk-cb--none { color: var(--text-subtle); background: var(--surface-2); border: 1px dashed var(--border); font-weight: 700; }
.lk-none { margin: var(--space-3) 0 var(--space-4); padding: var(--space-3) var(--space-4); font-size: 13px; font-style: italic; color: var(--text-subtle); background: var(--surface-2); border: 1px dashed var(--border); border-radius: var(--radius-md); }

/* ── Truyền biến Lục Kinh qua các lần đo ── */
.lk-traj { margin: 0 0 var(--space-4); padding: var(--space-3) var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
.lk-traj-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-3); }
.lk-traj-trend { font-size: 12px; font-weight: 800; padding: 2px 10px; border-radius: 999px; }
.lk-traj-trend--vao-ly { color: #fff; background: #b23a25; }
.lk-traj-trend--ra-bieu { color: #fff; background: #2e6f52; }
.lk-traj-trend--giu { color: var(--text-subtle); background: var(--surface-2); border: 1px solid var(--border); }
.lk-traj-line { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; align-items: stretch; gap: 2px; overflow-x: auto; }
.lk-traj-node { display: flex; align-items: center; gap: 2px; }
.lk-traj-cell { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 10px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface-2); min-width: 92px; text-decoration: none; color: inherit; }
.lk-traj-node--cur .lk-traj-cell { border-color: var(--brown-600); box-shadow: 0 0 0 2px var(--brown-100, rgba(120,53,15,.14)); }
/* Mốc bấm được = mở lại lần đo đó */
.lk-traj-cell--link { cursor: pointer; transition: all .15s ease; }
.lk-traj-cell--link:hover { border-color: var(--brown-500); background: var(--surface); transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.lk-traj-cell--link:focus-visible { outline: 2px solid var(--brown-600); outline-offset: 2px; }
.lk-traj-mo { font-size: 10px; font-weight: 700; color: var(--brown-600); opacity: 0; transition: opacity .15s ease; }
.lk-traj-cell--link:hover .lk-traj-mo, .lk-traj-cell--link:focus-visible .lk-traj-mo { opacity: 1; }
.lk-traj-dang-xem { font-size: 10px; font-weight: 700; color: var(--text-subtle); }
.lk-traj-date { font-size: 11px; color: var(--text-subtle); font-variant-numeric: tabular-nums; }
.lk-traj-kinh { font-size: 12.5px; font-weight: 800; color: #fff; padding: 2px 10px; border-radius: 999px; white-space: nowrap; background: var(--brown-600); }
.lk-traj-kinh i { font-style: normal; font-weight: 600; opacity: .8; font-size: .85em; }
.lk-traj-kinh--none { background: var(--gray-400, #b6a892); }
.lk-traj-kinh[data-kinh="thai-duong"] { background: #3d6a8c; }
.lk-traj-kinh[data-kinh="duong-minh"] { background: #a3801f; }
.lk-traj-kinh[data-kinh="thieu-duong"] { background: #bd5730; }
.lk-traj-kinh[data-kinh="thai-am"] { background: #8c6f2e; }
.lk-traj-kinh[data-kinh="thieu-am"] { background: #ab3644; }
.lk-traj-kinh[data-kinh="quyet-am"] { background: #4c7742; }
/* Connector 3 dòng: tốc độ (ngày) · hướng (↓↑→) · kiểu truyền (chip) */
.lk-traj-conn { align-self: center; display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 0 3px; min-width: 58px; }
.lk-traj-speed { font-size: 10px; font-weight: 700; color: var(--text-subtle); font-variant-numeric: tabular-nums; white-space: nowrap; display: inline-flex; align-items: center; gap: 3px; }
.lk-traj-speed.is-cap { color: #bf4632; }
.lk-traj-cap { font-size: 9.5px; font-weight: 800; color: #fff; background: #bf4632; padding: 0 5px; border-radius: 999px; }
.lk-traj-blind { color: var(--text-subtle); font-weight: 800; }
.lk-traj-arrow { font-size: 18px; font-weight: 800; padding: 0; line-height: 1; }
.lk-traj-arrow--vao-ly { color: #b23a25; }
.lk-traj-arrow--ra-bieu { color: #2e6f52; }
.lk-traj-arrow--giu { color: var(--text-subtle); }
/* Chip kiểu truyền — kênh RIÊNG (viền/glyph), không mượn 3 màu hướng */
.lk-traj-kieu { font-size: 9.5px; font-weight: 800; padding: 1px 6px; border-radius: 999px; white-space: nowrap; background: var(--surface); border: 1px solid; }
.lk-traj-kieu--viet { color: #8a5316; border-color: #b26a1f; }
.lk-traj-kieu--bieuly { color: #8a6a1f; border-color: #c9a24e; border-width: 1.5px; }
.lk-traj-kieu--hoiphuc { color: #2e6f52; border-color: #86b79a; font-weight: 700; }
/* Cờ trực trúng — tag đỏ thẫm ở đầu ô */
.lk-traj-truc { font-size: 9.5px; font-weight: 800; color: #f4e7d1; background: #8a2f22; padding: 1px 6px; border-radius: 5px; white-space: nowrap; }
.lk-traj-break { align-self: center; font-size: 10px; font-weight: 700; color: var(--text-subtle); padding: 0 6px; border-left: 1px dashed var(--border); border-right: 1px dashed var(--border); white-space: nowrap; }
.lk-traj-note { margin: var(--space-2) 0 0; font-size: 11.5px; color: var(--text-subtle); line-height: 1.45; }

/* ── Caption "Định vị" ngay trên vòng Lục Kinh — màu theo kinh trội ── */
.lk-wheel-cap {
  --kc: var(--brown-600);
  display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px 10px;
  padding: 8px 12px; border-radius: var(--radius-md);
  border: 1px solid var(--kc); border-left: 4px solid var(--kc);
  background: color-mix(in srgb, var(--kc) 10%, var(--surface));
}
.lk-wheel-cap[data-kinh="thai-duong"] { --kc: #3d6a8c; }
.lk-wheel-cap[data-kinh="duong-minh"] { --kc: #a3801f; }
.lk-wheel-cap[data-kinh="thieu-duong"] { --kc: #bd5730; }
.lk-wheel-cap[data-kinh="thai-am"] { --kc: #8c6f2e; }
.lk-wheel-cap[data-kinh="thieu-am"] { --kc: #ab3644; }
.lk-wheel-cap[data-kinh="quyet-am"] { --kc: #4c7742; }
.lk-wheel-cap-lb { font-size: 11px; font-weight: 800; letter-spacing: .03em; color: var(--kc); text-transform: uppercase; }
.lk-wheel-cap-kinh { font-size: var(--font-size-lg); font-weight: 800; color: var(--kc); }
.lk-wheel-cap-kinh i { font-style: normal; font-weight: 600; opacity: .75; font-size: .8em; }
.lk-wheel-cap-gd { font-size: var(--font-size-sm); font-weight: 700; color: var(--text); }
.lk-wheel-cap-phu { font-size: 11.5px; font-weight: 700; color: #fff; background: #8a5a2e; padding: 1px 8px; border-radius: 999px; }
.lk-wheel-cap-btn {
  margin-left: auto; font-size: 11.5px; font-weight: 700; color: var(--kc);
  background: transparent; border: 1px solid var(--kc); border-radius: 999px;
  padding: 2px 10px; cursor: pointer; white-space: nowrap;
}
.lk-wheel-cap-btn:hover { background: color-mix(in srgb, var(--kc) 14%, transparent); }

/* ════════════════════════════════════════════════════════════
   DENSITY OPTIMIZATION — tối ưu mật độ thông tin toàn bộ tab
   Nguyên tắc: bỏ khoảng thừa, tận dụng ngang, giảm padding
════════════════════════════════════════════════════════════ */

/* ── CARD / SECTION: giảm padding ── */
.result-card { padding: 10px 12px !important; }
.result-section { gap: var(--space-2) !important; }
.info-group { margin-top: 8px !important; }
.info-group + .info-group { margin-top: 8px !important; }
.section-title { margin-bottom: 6px !important; font-size: 14px !important; }

/* ── SYNDROME LIST (Tab 2 trái): compact rows ── */
.comparison-list {
  display: flex !important;
  flex-direction: column !important;
  gap: 6px !important;
}

.comparison-cell {
  display: flex !important;
  flex-direction: column !important;
  padding: 7px 10px !important;
  gap: 4px !important;
  background: var(--white);
  border: 1px solid var(--brown-200);
  border-radius: var(--radius-md);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.synd-header-row {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
  width: 100% !important;
}

.synd-info {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  flex: 1 1 0 !important;
  min-width: 0 !important;
}

.synd-idx {
  font-size: 11px !important;
  font-weight: 700 !important;
  color: var(--brown-700);
  background: var(--brown-100);
  min-width: 18px;
  height: 18px;
  border-radius: 99px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0 4px;
}

.synd-name {
  font-size: 13px !important;
  font-weight: 700 !important;
  color: var(--brown-900);
  line-height: 1.25 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.synd-rate {
  font-size: 11px !important;
  font-weight: 700 !important;
  color: #2e5c1e;
  background: #f2f7ec;
  padding: 1px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.synd-actions {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
  flex-shrink: 0 !important;
}

.pt-search-btn {
  display: inline-flex !important;
  align-items: center !important;
  gap: 3px !important;
  padding: 3px 8px !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  color: var(--brown-700);
  background: var(--surface-2, #faf6ee);
  border: 1px solid var(--brown-300);
  border-radius: 6px !important;
  cursor: pointer;
  white-space: nowrap;
}

.pt-search-btn:hover {
  background: var(--brown-600);
  color: var(--white);
  border-color: var(--brown-600);
}

.pt-search-ic {
  width: 12px !important;
  height: 12px !important;
}

.synd-sub {
  font-size: 11.5px !important;
  line-height: 1.35 !important;
  padding: 5px 8px !important;
  background: #fbf8f3 !important;
  border: 1px dashed #e8d7c0 !important;
  border-radius: 6px !important;
  margin-top: 2px !important;
  color: var(--brown-800);
}

.synd-sub-head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

/* ── PHƯƠNG HUYỆT CỘT PHẢI (Tab 2) ── */
.ph-group__chips {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 5px 8px !important;
}

.ph-chip-wrap {
  display: inline-flex !important;
  align-items: center !important;
  gap: 2px !important;
}

.ph-chip {
  padding: 3px 8px !important;
  font-size: 11.5px !important;
  font-weight: 600 !important;
  border-radius: 6px !important;
}

/* ── TAB 1: bảng đo kinh lạc ── */
.meridian-data-table td { padding: 3px 8px !important; }
.stats-summary-row .stat-col { padding: 4px var(--space-2) !important; }
.table-section-title { padding: var(--space-1) var(--space-3) 4px !important; }
.table-footer-stat { padding: 4px var(--space-3) !important; }

/* ── BÁT CƯƠNG band (Tab 1 phần II) ── */
.bc-band { padding: var(--space-2) !important; }
.bc-wrap { gap: var(--space-2) !important; }

/* ── TAB 3 BCPT ── */
.bcpt { gap: var(--space-2) !important; }
.bcpt-the { gap: 4px !important; }
.bcpt-row { gap: 4px !important; padding: 3px 0 !important; }

.info-label { font-size: 12px !important; margin-bottom: 6px !important; }
.phacdo-col { gap: var(--space-3) !important; }

/* ── TAB 3: 2-COLUMN DASHBOARD GRID ── */
.bcpt-top-grid {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 10px !important;
  align-items: stretch !important;
  width: 100% !important;
}

.bcpt-top-left, .bcpt-top-right {
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
}

@media (max-width: 900px) {
  .bcpt-top-grid {
    grid-template-columns: 1fr !important;
  }
}

.lk-verdict {
  margin: 0 !important;
  padding: 8px 10px !important;
  border-radius: var(--radius-md) !important;
}

.lk-traj {
  margin: 0 !important;
  padding: 8px 10px !important;
  border-radius: var(--radius-md) !important;
}

.bcpt-axis--tinhchat {
  margin: 0 !important;
  padding: 8px 10px !important;
  border-radius: var(--radius-md) !important;
  border: 1px solid var(--brown-200) !important;
  background: var(--white) !important;
}

.bcpt-the {
  padding: 4px 8px !important;
  font-size: 12px !important;
  background: var(--brown-50) !important;
  border: 1px solid var(--brown-200) !important;
  border-radius: 6px !important;
  display: flex;
  align-items: center;
  gap: 6px;
}

.bcpt-wheel-block {
  margin-top: 8px !important;
  padding: 10px 12px !important;
  gap: 10px !important;
}

/* ── TRUYỀN BIẾN LỤC KINH GOBAL (ĐẶT TRÊN CẢ 3 TAB) ── */
.mr-traj-global {
  margin-bottom: 8px;
  width: 100%;
}
.lk-traj--global {
  padding: 6px 12px !important;
  margin: 0 !important;
  background: var(--surface-2, #faf6ee) !important;
  border: 1px solid var(--brown-200) !important;
  border-radius: var(--radius-md) !important;
}
.lk-traj--global .lk-traj-line {
  gap: 4px;
}
.lk-traj--global .lk-traj-cell {
  padding: 4px 8px !important;
  min-width: 84px !important;
}</style>
