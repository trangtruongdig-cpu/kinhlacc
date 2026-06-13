<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import TongueAtlasPanel from '@/components/TongueAtlasPanel.vue'
import TongueSVGCard from '@/components/TongueSVGCard.vue'
import { ATLAS } from '@/data/tongue-atlas'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Patient {
  id: number
  fullName: string | null
  dateOfBirth?: string | null
  phone?: string | null
  gender?: string | null
}

interface ChanDoanRecord {
  id: number
  idBenhNhan: number | null
  ngayKham: string
  mauChat: string | null
  hinhDang: string | null
  doAm: string | null
  mauReu: string | null
  tinhChatReu: string | null
  phanBoReu: string | null
  vungBatThuong: string | null
  ketQuaDongY: string | null
  ghiChu: string | null
}

interface Pattern {
  name: string
  viet: string
  mota: string
  score: number
  diem_chuan: number
  trieu_chung: string[]
}

// ─────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────
const MAU_CHAT_OPTS = ['Nhạt', 'Hồng Bình', 'Đỏ', 'Đỏ Sẫm', 'Tím / Xanh Tím']
const HINH_DANG_OPTS = ['Bình Thường', 'Phì Đại', 'Teo Nhỏ', 'Răng Cưa', 'Nứt Nẻ', 'Cứng', 'Rung', 'Lệch']
const DO_AM_OPTS = ['Ướt', 'Nhuận', 'Khô']
const MAU_REU_OPTS = ['Trắng', 'Vàng', 'Xám', 'Đen', 'Không Rêu']
const TINH_CHAT_REU_OPTS = ['Mỏng', 'Dày', 'Nhờn / Dính', 'Khô', 'Bong Tróc']
const PHAN_BO_REU_OPTS = ['Toàn Bộ', 'Đầu Lưỡi', 'Chân Lưỡi', 'Hai Bên', 'Giữa Lưỡi']

const ZONE_INFO: Record<string, { label: string; sub: string }> = {
  dau:  { label: 'Đầu Lưỡi', sub: 'Tâm • Phế' },
  trai: { label: 'Bên Trái',  sub: 'Can • Đởm' },
  giua: { label: 'Giữa',      sub: 'Tỳ • Vị' },
  phai: { label: 'Bên Phải',  sub: 'Can • Đởm' },
  chan: { label: 'Chân Lưỡi', sub: 'Thận' },
}

const router = useRouter()

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
const mainTab = ref<'chan-doan' | 'tham-khao'>('chan-doan')

const patientSearch = ref('')
const patientResults = ref<Patient[]>([])
const selectedPatient = ref<Patient | null>(null)
const patientDropOpen = ref(false)
const searchLoading = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

// Tongue zones
const selectedZones = ref<string[]>([])
const hoverZone = ref<string | null>(null)

// Feature form
const mauChat = ref('')
const hinhDang = ref<string[]>([])
const doAm = ref('')
const mauReu = ref('')
const tinhChatReu = ref<string[]>([])
const phanBoReu = ref<string[]>([])

// Misc
const ghiChu = ref('')
const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)
const editingId = ref<number | null>(null)

// History
const history = ref<ChanDoanRecord[]>([])
const historyLoading = ref(false)

// ─────────────────────────────────────────────
// Patient search
// ─────────────────────────────────────────────
function onPatientInput() {
  patientDropOpen.value = true
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(doSearchPatients, 280)
}

async function doSearchPatients() {
  const q = patientSearch.value.trim()
  if (!q) { patientResults.value = []; return }
  searchLoading.value = true
  try {
    const res = await api.get<{ data?: Patient[]; items?: Patient[] } | Patient[]>(
      `/patients?search=${encodeURIComponent(q)}&limit=10`
    )
    const list = Array.isArray(res) ? res : ((res as any).data ?? (res as any).items ?? [])
    patientResults.value = list.slice(0, 10)
  } catch {
    patientResults.value = []
  } finally {
    searchLoading.value = false
  }
}

function selectPatient(p: Patient) {
  selectedPatient.value = p
  patientSearch.value = p.fullName || `#${p.id}`
  patientDropOpen.value = false
  loadHistory(p.id)
}

function clearPatient() {
  selectedPatient.value = null
  patientSearch.value = ''
  history.value = []
  resetForm()
}

function goToPatient() {
  if (selectedPatient.value) router.push({ name: 'patient-detail', params: { id: selectedPatient.value.id } })
}

function goToNewExamination() {
  if (selectedPatient.value) router.push({ name: 'new-examination', params: { id: selectedPatient.value.id } })
}

// ─────────────────────────────────────────────
// History
// ─────────────────────────────────────────────
async function loadHistory(idBenhNhan: number) {
  historyLoading.value = true
  try {
    const res = await api.get<ChanDoanRecord[]>(`/chan-doan-luoi?id_benh_nhan=${idBenhNhan}`)
    history.value = Array.isArray(res) ? res : []
  } catch {
    history.value = []
  } finally {
    historyLoading.value = false
  }
}

function loadRecord(r: ChanDoanRecord) {
  editingId.value = r.id
  mauChat.value = r.mauChat || ''
  hinhDang.value = r.hinhDang ? r.hinhDang.split(',').map(s => s.trim()).filter(Boolean) : []
  doAm.value = r.doAm || ''
  mauReu.value = r.mauReu || ''
  tinhChatReu.value = r.tinhChatReu ? r.tinhChatReu.split(',').map(s => s.trim()).filter(Boolean) : []
  phanBoReu.value = r.phanBoReu ? r.phanBoReu.split(',').map(s => s.trim()).filter(Boolean) : []
  selectedZones.value = r.vungBatThuong ? r.vungBatThuong.split(',').map(s => s.trim()).filter(Boolean) : []
  ghiChu.value = r.ghiChu || ''
  saveSuccess.value = false
  saveError.value = ''
}

function resetForm() {
  editingId.value = null
  mauChat.value = ''
  hinhDang.value = []
  doAm.value = ''
  mauReu.value = ''
  tinhChatReu.value = []
  phanBoReu.value = []
  selectedZones.value = []
  ghiChu.value = ''
  saveSuccess.value = false
  saveError.value = ''
}

// ─────────────────────────────────────────────
// SVG zone interaction
// ─────────────────────────────────────────────
function toggleZone(zone: string) {
  const i = selectedZones.value.indexOf(zone)
  if (i === -1) selectedZones.value.push(zone)
  else selectedZones.value.splice(i, 1)
}

function zoneBaseColor(zone: string): string {
  if (selectedZones.value.includes(zone)) return '#ef4444'
  if (hoverZone.value === zone) return '#fca5a5'
  return 'transparent'
}
function zoneOpacity(zone: string): number {
  if (selectedZones.value.includes(zone)) return 0.45
  if (hoverZone.value === zone) return 0.35
  return 0
}

// ─────────────────────────────────────────────
// Multi-select helpers
// ─────────────────────────────────────────────
function toggleMulti(list: string[], val: string) {
  const i = list.indexOf(val)
  if (i === -1) list.push(val)
  else list.splice(i, 1)
}

// ─────────────────────────────────────────────
// Rule Engine — Chẩn đoán Đông Y tự động
// ─────────────────────────────────────────────
const diagnoses = computed<Pattern[]>(() => {
  const P = (): Pattern[] => [
    { name: 'am_hu',     viet: 'Âm Hư',        mota: 'Tân dịch hao tổn, nhiệt nội sinh',          diem_chuan: 4, score: 0, trieu_chung: [] },
    { name: 'duong_hu',  viet: 'Dương Hư',      mota: 'Dương khí suy yếu, nội hàn tích trệ',       diem_chuan: 4, score: 0, trieu_chung: [] },
    { name: 'khi_hu',    viet: 'Khí Hư',        mota: 'Chính khí bất túc, vận hóa kém',            diem_chuan: 3, score: 0, trieu_chung: [] },
    { name: 'huyet_hu',  viet: 'Huyết Hư',      mota: 'Huyết mạch không đủ nuôi dưỡng tạng phủ',  diem_chuan: 3, score: 0, trieu_chung: [] },
    { name: 'nhiet',     viet: 'Nhiệt Chứng',   mota: 'Thực nhiệt hoặc hư nhiệt nội sinh',         diem_chuan: 3, score: 0, trieu_chung: [] },
    { name: 'han',       viet: 'Hàn Chứng',     mota: 'Ngoại hàn hoặc nội hàn ngưng trệ',          diem_chuan: 3, score: 0, trieu_chung: [] },
    { name: 'u_huyet',   viet: 'Ứ Huyết',       mota: 'Huyết hành trở trệ, mạch lạc bất thông',   diem_chuan: 3, score: 0, trieu_chung: [] },
    { name: 'dam_thap',  viet: 'Đàm Thấp',      mota: 'Đàm ẩm tích tụ, tỳ vận hóa kém',           diem_chuan: 3, score: 0, trieu_chung: [] },
    { name: 'thap_nhiet',viet: 'Thấp Nhiệt',    mota: 'Thấp và nhiệt kết hợp, trung tiêu uất nhiệt', diem_chuan: 4, score: 0, trieu_chung: [] },
    { name: 'can_uat',   viet: 'Can Uất',        mota: 'Can khí uất kết, khí cơ không thông',       diem_chuan: 3, score: 0, trieu_chung: [] },
  ]
  const patterns = P()
  const get = (name: string) => patterns.find(x => x.name === name)!
  const add = (name: string, score: number, hint: string) => {
    const p = get(name); p.score += score; p.trieu_chung.push(hint)
  }

  // Màu chất lưỡi
  if (mauChat.value === 'Nhạt') {
    add('duong_hu', 3, 'Chất lưỡi nhạt → Dương hư')
    add('khi_hu',   2, 'Chất lưỡi nhạt → Khí hư')
    add('huyet_hu', 2, 'Chất lưỡi nhạt → Huyết hư')
    add('han',      1, 'Chất lưỡi nhạt → xu hướng hàn')
  }
  if (mauChat.value === 'Đỏ') {
    add('am_hu',  3, 'Chất lưỡi đỏ → Âm hư')
    add('nhiet',  2, 'Chất lưỡi đỏ → Nhiệt chứng')
  }
  if (mauChat.value === 'Đỏ Sẫm') {
    add('nhiet',   4, 'Chất lưỡi đỏ sẫm → Nhiệt cực thịnh')
    add('am_hu',   2, 'Chất lưỡi đỏ sẫm → Âm hư trọng')
    add('u_huyet', 2, 'Chất lưỡi đỏ sẫm → khả năng Ứ huyết')
  }
  if (mauChat.value === 'Tím / Xanh Tím') {
    add('u_huyet', 4, 'Chất lưỡi tím xanh → Ứ huyết điển hình')
    add('han',     2, 'Chất lưỡi xanh tím → Hàn ngưng huyết')
    add('can_uat', 2, 'Chất lưỡi tím → Can uất nặng')
  }

  // Hình dạng
  if (hinhDang.value.includes('Phì Đại')) {
    add('dam_thap', 3, 'Lưỡi phì đại → Đàm thấp')
    add('khi_hu',   1, 'Lưỡi phì đại → Tỳ khí hư')
    add('duong_hu', 1, 'Lưỡi phì đại → Dương hư thủy thấp')
  }
  if (hinhDang.value.includes('Teo Nhỏ')) {
    add('am_hu',    2, 'Lưỡi teo nhỏ → Âm hư nặng')
    add('huyet_hu', 2, 'Lưỡi teo nhỏ → Huyết hư không nuôi dưỡng')
  }
  if (hinhDang.value.includes('Răng Cưa')) {
    add('khi_hu',   3, 'Dấu răng cưa → Tỳ khí hư, lưỡi thiếu trương lực')
    add('dam_thap', 2, 'Dấu răng cưa → Thấp thịnh')
  }
  if (hinhDang.value.includes('Nứt Nẻ')) {
    add('am_hu',  2, 'Lưỡi nứt nẻ → Âm hư tân dịch thiếu')
    add('nhiet',  1, 'Lưỡi nứt nẻ → Nhiệt hao tân')
  }
  if (hinhDang.value.includes('Cứng')) {
    add('nhiet',   2, 'Lưỡi cứng → Nhiệt nhập tâm bào')
    add('u_huyet', 1, 'Lưỡi cứng → Phong đàm trở trệ')
  }
  if (hinhDang.value.includes('Lệch')) {
    add('u_huyet', 2, 'Lưỡi lệch → Phong trúng kinh lạc')
    add('can_uat', 2, 'Lưỡi lệch → Can phong nội động')
  }
  if (hinhDang.value.includes('Rung')) {
    add('can_uat', 2, 'Lưỡi rung → Can phong nội động')
    add('khi_hu',  1, 'Lưỡi rung → Khí huyết hư')
  }

  // Độ ẩm
  if (doAm.value === 'Ướt') {
    add('duong_hu', 2, 'Lưỡi ướt → Dương hư thủy thấp')
    add('han',      2, 'Lưỡi ướt → Hàn thấp nội thịnh')
    add('dam_thap', 1, 'Lưỡi ướt → Đàm ẩm tích tụ')
  }
  if (doAm.value === 'Khô') {
    add('am_hu',  2, 'Lưỡi khô → Âm hư tân dịch thiếu')
    add('nhiet',  2, 'Lưỡi khô → Nhiệt hao tân dịch')
  }

  // Màu rêu
  if (mauReu.value === 'Trắng') {
    add('han',     2, 'Rêu trắng → Hàn chứng')
    add('duong_hu',1, 'Rêu trắng → nội hàn')
  }
  if (mauReu.value === 'Vàng') {
    add('nhiet',     3, 'Rêu vàng → Nhiệt chứng')
    add('thap_nhiet',2, 'Rêu vàng → gợi Thấp nhiệt')
  }
  if (mauReu.value === 'Xám') {
    add('nhiet',   2, 'Rêu xám → Nhiệt uẩn hoặc hàn cực')
    add('dam_thap',2, 'Rêu xám → Thấp uẩn lâu ngày')
  }
  if (mauReu.value === 'Đen') {
    add('nhiet', 3, 'Rêu đen → Nhiệt cực hoặc Hàn cực trọng')
    add('han',   2, 'Rêu đen → Hàn cực âm thịnh')
  }
  if (mauReu.value === 'Không Rêu') {
    add('am_hu',   3, 'Không rêu → Âm hư điển hình')
    add('huyet_hu',2, 'Không rêu → Vị âm hư')
  }

  // Tính chất rêu
  if (tinhChatReu.value.includes('Dày')) {
    add('dam_thap',  1, 'Rêu dày → Đàm thấp thực chứng')
    add('thap_nhiet',1, 'Rêu dày → Thấp thịnh')
    if (mauReu.value === 'Vàng') add('thap_nhiet', 2, 'Rêu vàng dày → Thấp nhiệt điển hình')
  }
  if (tinhChatReu.value.includes('Nhờn / Dính')) {
    add('dam_thap',   3, 'Rêu nhờn dính → Đàm thấp điển hình')
    add('thap_nhiet', 2, 'Rêu nhờn → Thấp nhiệt')
    if (mauReu.value === 'Vàng') add('thap_nhiet', 2, 'Rêu vàng nhờn → Thấp nhiệt thịnh')
  }
  if (tinhChatReu.value.includes('Bong Tróc')) {
    add('am_hu',   2, 'Rêu bong tróc → Âm hư vị tổn')
    add('huyet_hu',1, 'Rêu bong tróc → Khí huyết bất túc')
  }
  if (tinhChatReu.value.includes('Mỏng') && mauReu.value === 'Trắng') {
    add('han', 1, 'Rêu trắng mỏng → Ngoại hàn hoặc bình thường')
  }

  // Vùng bất thường
  if (selectedZones.value.includes('trai') || selectedZones.value.includes('phai')) {
    add('can_uat', 3, 'Hai bên lưỡi bất thường → Can Đởm bệnh')
  }
  if (selectedZones.value.includes('chan')) {
    add('duong_hu', 2, 'Chân lưỡi bất thường → Thận hư')
    add('am_hu',    1, 'Chân lưỡi bất thường → Thận âm hư')
  }
  if (selectedZones.value.includes('dau')) {
    add('nhiet', 2, 'Đầu lưỡi bất thường → Tâm Phế nhiệt')
  }
  if (selectedZones.value.includes('giua')) {
    add('khi_hu',  1, 'Giữa lưỡi bất thường → Tỳ Vị khí hư')
    add('dam_thap',1, 'Giữa lưỡi bất thường → Đàm thấp ứ trệ')
  }

  return patterns
    .filter(p => p.score >= p.diem_chuan)
    .sort((a, b) => b.score - a.score)
})

const diagnosisText = computed<string>(() => {
  if (!diagnoses.value.length) return ''
  return diagnoses.value
    .map(p => `${p.viet} (điểm ${p.score}): ${p.trieu_chung.slice(0, 2).join('; ')}`)
    .join('\n')
})

watch(diagnosisText, (val) => { if (!ghiChu.value) return; /* don't overwrite notes */ })

// ─────────────────────────────────────────────
// Save
// ─────────────────────────────────────────────
async function save() {
  saving.value = true
  saveError.value = ''
  saveSuccess.value = false
  const body = {
    idBenhNhan: selectedPatient.value?.id ?? null,
    mauChat: mauChat.value || null,
    hinhDang: hinhDang.value.join(', ') || null,
    doAm: doAm.value || null,
    mauReu: mauReu.value || null,
    tinhChatReu: tinhChatReu.value.join(', ') || null,
    phanBoReu: phanBoReu.value.join(', ') || null,
    vungBatThuong: selectedZones.value.join(', ') || null,
    ketQuaDongY: diagnosisText.value || null,
    ghiChu: ghiChu.value || null,
  }
  try {
    if (editingId.value) {
      await api.put(`/chan-doan-luoi/${editingId.value}`, body)
    } else {
      const res = await api.post<{ id: number }>('/chan-doan-luoi', body)
      editingId.value = (res as any).id ?? null
    }
    saveSuccess.value = true
    if (selectedPatient.value) loadHistory(selectedPatient.value.id)
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e: any) {
    saveError.value = e?.message || 'Lỗi khi lưu'
  } finally {
    saving.value = false
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const patternBadgeColor: Record<string, string> = {
  am_hu: '#ef4444', duong_hu: '#3b82f6', khi_hu: '#f59e0b', huyet_hu: '#ec4899',
  nhiet: '#f97316', han: '#06b6d4', u_huyet: '#8b5cf6', dam_thap: '#84cc16',
  thap_nhiet: '#d97706', can_uat: '#10b981',
}
function patternColor(name: string) { return patternBadgeColor[name] || '#6b7280' }

// ─────────────────────────────────────────────
// AI Image Analysis
// ─────────────────────────────────────────────
interface AiResult {
  similarity: { id: string; vi: string; score: number; reason: string }[]
  features: {
    mauChat?: string
    hinhDang?: string[]
    doAm?: string
    mauReu?: string
    tinhChatReu?: string[]
    phanBoReu?: string[]
  }
  error?: string
}

const imageFile    = ref<File | null>(null)
const imagePreview = ref('')
const aiAnalyzing  = ref(false)
const aiError      = ref('')
const aiResult     = ref<AiResult | null>(null)
const isDragging   = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function onFilePick(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) setFile(f)
}
function onDrop(e: DragEvent) {
  isDragging.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f && f.type.startsWith('image/')) setFile(f)
}
function setFile(f: File) {
  imageFile.value = f
  const reader = new FileReader()
  reader.onload = ev => { imagePreview.value = ev.target?.result as string }
  reader.readAsDataURL(f)
  aiResult.value = null
  aiError.value = ''
}
function clearImage() {
  imageFile.value = null
  imagePreview.value = ''
  aiResult.value = null
  aiError.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function analyzeImage() {
  if (!imageFile.value) return
  aiAnalyzing.value = true
  aiError.value = ''
  aiResult.value = null
  try {
    const base64: string = await new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = ev => res((ev.target!.result as string).split(',')[1])
      r.onerror = rej
      r.readAsDataURL(imageFile.value!)
    })
    const data = await api.post<AiResult>('/chan-doan-luoi/analyze-image', { image: base64 })
    aiResult.value = data
    // Tự động điền form ngay khi AI trả về
    if (data && !data.error) {
      const f = (data as AiResult).features
      if (f) {
        if (f.mauChat) mauChat.value = f.mauChat
        if (f.hinhDang?.length)    hinhDang.value    = [...f.hinhDang]
        if (f.doAm)    doAm.value    = f.doAm
        if (f.mauReu)  mauReu.value  = f.mauReu
        if (f.tinhChatReu?.length) tinhChatReu.value = [...f.tinhChatReu]
        if (f.phanBoReu?.length)   phanBoReu.value   = [...f.phanBoReu]
      }
    }
  } catch (e: any) {
    aiError.value = e?.message || 'Lỗi phân tích ảnh'
  } finally {
    aiAnalyzing.value = false
  }
}

function applyAiFeatures() {
  const f = aiResult.value?.features
  if (!f) return
  if (f.mauChat) mauChat.value = f.mauChat
  if (f.hinhDang?.length)    hinhDang.value    = [...f.hinhDang]
  if (f.doAm)    doAm.value    = f.doAm
  if (f.mauReu)  mauReu.value  = f.mauReu
  if (f.tinhChatReu?.length) tinhChatReu.value = [...f.tinhChatReu]
  if (f.phanBoReu?.length)   phanBoReu.value   = [...f.phanBoReu]
}

function atlasEntry(id: string) { return ATLAS.find(e => e.id === id) }

const atlasIndex = ref<Record<string, string[]>>({})
onMounted(async () => {
  try {
    const res = await fetch('/tongue-atlas/atlas-index.json')
    atlasIndex.value = await res.json()
  } catch {}
})
function atlasPhoto(id: string): string {
  return atlasIndex.value[id]?.[0] ?? ''
}

// ── Lightbox ──
const lightboxSrc = ref('')
function openLightbox(src: string) { lightboxSrc.value = src }
function closeLightbox() { lightboxSrc.value = '' }

// ── ML Search ──
const mlSearching = ref(false)
const mlError     = ref('')

async function mlSearch() {
  if (!imageFile.value) return
  mlSearching.value = true
  mlError.value = ''
  aiResult.value = null
  try {
    const base64: string = await new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = ev => res((ev.target!.result as string).split(',')[1])
      r.onerror = rej
      r.readAsDataURL(imageFile.value!)
    })
    const data = await api.post<AiResult>('/chan-doan-luoi/ml-search', { image: base64 })
    aiResult.value = data
    if (data && !data.error) {
      const f = (data as AiResult).features
      if (f) {
        if (f.mauChat) mauChat.value = f.mauChat
        if (f.hinhDang?.length)    hinhDang.value    = [...f.hinhDang]
        if (f.doAm)    doAm.value    = f.doAm
        if (f.mauReu)  mauReu.value  = f.mauReu
        if (f.tinhChatReu?.length) tinhChatReu.value = [...f.tinhChatReu]
        if (f.phanBoReu?.length)   phanBoReu.value   = [...f.phanBoReu]
      }
    }
  } catch (e: any) {
    mlError.value = e?.message || 'Lỗi phân tích ML'
  } finally {
    mlSearching.value = false
  }
}
</script>

<template>
  <div class="cdl-page">
    <!-- Header -->
    <div class="cdl-header">
      <div class="cdl-header__title">
        <h2>Chẩn Đoán Lưỡi</h2>
        <span class="cdl-header__sub">Vọng Thiệt —望舌</span>
      </div>

      <!-- Patient picker -->
      <div class="cdl-patient-picker">
        <div class="cdl-patient-input-wrap">
          <input
            v-model="patientSearch"
            class="cdl-patient-input"
            placeholder="Tìm bệnh nhân..."
            @input="onPatientInput"
            @focus="patientDropOpen = true"
            @blur="setTimeout(() => { patientDropOpen = false }, 200)"
            autocomplete="off"
          />
          <button v-if="selectedPatient" class="cdl-patient-clear" @click="clearPatient">✕</button>
          <span v-else class="cdl-patient-icon">🔍</span>
        </div>
        <div v-if="patientDropOpen && (patientResults.length || searchLoading)" class="cdl-patient-drop">
          <div v-if="searchLoading" class="cdl-patient-loading">Đang tìm...</div>
          <button
            v-for="p in patientResults" :key="p.id"
            class="cdl-patient-item"
            @click="selectPatient(p)"
          >
            <span class="cdl-pi-name">{{ p.fullName || `#${p.id}` }}</span>
            <span class="cdl-pi-meta">{{ p.gender || '' }}{{ p.dateOfBirth ? ' · ' + p.dateOfBirth : '' }}</span>
          </button>
        </div>
        <div v-if="selectedPatient" class="cdl-patient-badge">
          <span>{{ selectedPatient.fullName || `#${selectedPatient.id}` }}</span>
          <button class="cdl-patient-badge__link" @click="goToPatient" title="Mở hồ sơ bệnh nhân">Xem hồ sơ →</button>
        </div>
      </div>
    </div>

    <!-- Main tabs -->
    <div class="cdl-main-tabs">
      <button class="cdl-main-tab" :class="{ active: mainTab === 'chan-doan' }" @click="mainTab = 'chan-doan'">
        Chẩn Đoán
      </button>
      <button class="cdl-main-tab" :class="{ active: mainTab === 'tham-khao' }" @click="mainTab = 'tham-khao'">
        Tham Khảo Atlas
      </button>
    </div>

    <!-- Atlas panel -->
    <div v-if="mainTab === 'tham-khao'" class="cdl-atlas-wrap">
      <TongueAtlasPanel :filter-patterns="diagnoses.map(d => d.name)"/>
    </div>

    <!-- Body -->
    <div v-show="mainTab === 'chan-doan'" class="cdl-body">
      <!-- Left: SVG + History -->
      <aside class="cdl-left">
        <!-- Tongue SVG -->
        <div class="cdl-svg-wrap">
          <p class="cdl-svg-hint">Click vùng lưỡi để đánh dấu bất thường</p>
          <svg class="tongue-svg" viewBox="0 0 200 280" @mouseleave="hoverZone = null">
            <defs>
              <clipPath id="tc">
                <ellipse cx="100" cy="147" rx="87" ry="120"/>
              </clipPath>
            </defs>
            <!-- Tongue base -->
            <ellipse cx="100" cy="147" rx="87" ry="120" fill="#f8c8c4" stroke="#c49090" stroke-width="1.5"/>
            <!-- Inner tongue texture -->
            <ellipse cx="100" cy="147" rx="74" ry="107" fill="none" stroke="#e0a0a0" stroke-width="0.5" opacity="0.4"/>

            <!-- Zone fills -->
            <rect x="13" y="27" width="174" height="72"
                  clip-path="url(#tc)"
                  :fill="zoneBaseColor('dau')" :opacity="zoneOpacity('dau')"
                  class="zone-hit" @click="toggleZone('dau')" @mouseenter="hoverZone='dau'"/>
            <rect x="13" y="99" width="58" height="88"
                  clip-path="url(#tc)"
                  :fill="zoneBaseColor('trai')" :opacity="zoneOpacity('trai')"
                  class="zone-hit" @click="toggleZone('trai')" @mouseenter="hoverZone='trai'"/>
            <rect x="71" y="99" width="58" height="88"
                  clip-path="url(#tc)"
                  :fill="zoneBaseColor('giua')" :opacity="zoneOpacity('giua')"
                  class="zone-hit" @click="toggleZone('giua')" @mouseenter="hoverZone='giua'"/>
            <rect x="129" y="99" width="58" height="88"
                  clip-path="url(#tc)"
                  :fill="zoneBaseColor('phai')" :opacity="zoneOpacity('phai')"
                  class="zone-hit" @click="toggleZone('phai')" @mouseenter="hoverZone='phai'"/>
            <rect x="13" y="187" width="174" height="76"
                  clip-path="url(#tc)"
                  :fill="zoneBaseColor('chan')" :opacity="zoneOpacity('chan')"
                  class="zone-hit" @click="toggleZone('chan')" @mouseenter="hoverZone='chan'"/>

            <!-- Zone dividers -->
            <g clip-path="url(#tc)" stroke="#b08080" stroke-width="0.7" stroke-dasharray="3,3" opacity="0.55">
              <line x1="13" y1="99"  x2="187" y2="99"/>
              <line x1="13" y1="187" x2="187" y2="187"/>
              <line x1="71" y1="99"  x2="71"  y2="187"/>
              <line x1="129" y1="99" x2="129" y2="187"/>
            </g>

            <!-- Zone labels (pointer-events: none) -->
            <g pointer-events="none">
              <text x="100" y="70"  text-anchor="middle" class="zl-main">{{ ZONE_INFO.dau.label }}</text>
              <text x="100" y="82"  text-anchor="middle" class="zl-sub">{{ ZONE_INFO.dau.sub }}</text>
              <text x="42"  y="139" text-anchor="middle" class="zl-main">Trái</text>
              <text x="42"  y="151" text-anchor="middle" class="zl-sub">Can</text>
              <text x="42"  y="161" text-anchor="middle" class="zl-sub">Đởm</text>
              <text x="100" y="139" text-anchor="middle" class="zl-main">Giữa</text>
              <text x="100" y="151" text-anchor="middle" class="zl-sub">Tỳ • Vị</text>
              <text x="158" y="139" text-anchor="middle" class="zl-main">Phải</text>
              <text x="158" y="151" text-anchor="middle" class="zl-sub">Can</text>
              <text x="158" y="161" text-anchor="middle" class="zl-sub">Đởm</text>
              <text x="100" y="220" text-anchor="middle" class="zl-main">{{ ZONE_INFO.chan.label }}</text>
              <text x="100" y="232" text-anchor="middle" class="zl-sub">{{ ZONE_INFO.chan.sub }}</text>
            </g>

            <!-- Selected zone checkmarks -->
            <g clip-path="url(#tc)" pointer-events="none">
              <text v-if="selectedZones.includes('dau')"  x="100" y="55"  text-anchor="middle" font-size="14" fill="#fff">✓</text>
              <text v-if="selectedZones.includes('trai')" x="42"  y="122" text-anchor="middle" font-size="14" fill="#fff">✓</text>
              <text v-if="selectedZones.includes('giua')" x="100" y="122" text-anchor="middle" font-size="14" fill="#fff">✓</text>
              <text v-if="selectedZones.includes('phai')" x="158" y="122" text-anchor="middle" font-size="14" fill="#fff">✓</text>
              <text v-if="selectedZones.includes('chan')" x="100" y="213" text-anchor="middle" font-size="14" fill="#fff">✓</text>
            </g>
          </svg>

          <!-- Zone legend chips -->
          <div class="cdl-zone-chips">
            <button
              v-for="(info, key) in ZONE_INFO" :key="key"
              class="cdl-zone-chip"
              :class="{ active: selectedZones.includes(key) }"
              @click="toggleZone(key)"
            >{{ info.label }}</button>
          </div>
        </div>

        <!-- History -->
        <div class="cdl-history">
          <div class="cdl-history__head">
            <h4>Lịch Sử Chẩn Đoán</h4>
            <span v-if="!selectedPatient" class="cdl-history__empty-hint">Chọn bệnh nhân để xem</span>
          </div>
          <div v-if="historyLoading" class="cdl-history__loading">Đang tải...</div>
          <div v-else-if="!selectedPatient" class="cdl-history__no-patient">—</div>
          <div v-else-if="history.length === 0" class="cdl-history__empty">Chưa có bản ghi</div>
          <div v-else class="cdl-history__list">
            <button
              v-for="r in history" :key="r.id"
              class="cdl-history-item"
              :class="{ active: editingId === r.id }"
              @click="loadRecord(r)"
            >
              <span class="cdl-hi-date">{{ formatDate(r.ngayKham) }}</span>
              <span class="cdl-hi-mau">{{ r.mauChat || '—' }}</span>
              <span v-if="r.ketQuaDongY" class="cdl-hi-diag">
                {{ r.ketQuaDongY.split('\n')[0].split(':')[0] }}
              </span>
            </button>
          </div>
          <button v-if="selectedPatient" class="btn-new-record" @click="resetForm">+ Bản Ghi Mới</button>
        </div>
      </aside>

      <!-- Right: Feature form + result -->
      <main class="cdl-right">
        <!-- ── UPLOAD ZONE (trước khi phân tích) ── -->
        <section v-if="!aiResult || aiResult.error" class="cdl-section cdl-section--upload">
          <h3 class="cdl-section__title">Phân Tích Ảnh Lưỡi <span class="cdl-ai-badge">AI</span></h3>

          <div
            v-if="!imagePreview"
            class="cdl-drop-zone"
            :class="{ dragging: isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
            @click="fileInputRef?.click()"
          >
            <span class="cdl-drop-icon">📷</span>
            <span class="cdl-drop-text">Kéo thả ảnh lưỡi vào đây</span>
            <span class="cdl-drop-sub">hoặc nhấn để chọn từ máy tính</span>
            <input ref="fileInputRef" type="file" accept="image/*" class="cdl-file-hidden" @change="onFilePick"/>
          </div>

          <div v-else class="cdl-img-preview-wrap">
            <div class="cdl-img-preview">
              <img :src="imagePreview" alt="Ảnh lưỡi" class="cdl-preview-img"/>
              <button class="cdl-preview-clear" @click="clearImage" title="Xóa ảnh">✕</button>
            </div>
            <div class="cdl-analyze-btns">
              <button class="btn-analyze btn-analyze--ml" :disabled="mlSearching || aiAnalyzing" @click="mlSearch">
                <span>{{ mlSearching ? '⏳ Đang phân tích...' : '🤖 Tìm Giống ML' }}</span>
              </button>
              <button class="btn-analyze" :disabled="aiAnalyzing || mlSearching" @click="analyzeImage">
                <span>{{ aiAnalyzing ? '⏳ Đang phân tích...' : '🔬 Vision AI' }}</span>
              </button>
            </div>
          </div>

          <p v-if="aiError || mlError" class="cdl-ai-error">{{ aiError || mlError }}</p>
          <p v-if="aiResult?.error" class="cdl-ai-error">{{ aiResult.error }}</p>
        </section>

        <!-- ── DECISION PANEL (sau khi AI trả về) ── -->
        <section v-else class="cdl-section cdl-section--decision">
          <!-- Header bar: ảnh thumbnail + nút đổi ảnh -->
          <div class="cdl-dec-header">
            <img :src="imagePreview" class="cdl-dec-header__thumb"/>
            <div class="cdl-dec-header__info">
              <span class="cdl-dec-header__title">Kết Quả Phân Tích AI <span class="cdl-ai-badge">AI</span></span>
              <span class="cdl-dec-header__sub">Form đã được điền tự động — kiểm tra và chỉnh nếu cần</span>
            </div>
            <button class="cdl-dec-header__retry" @click="clearImage">↺ Ảnh Khác</button>
          </div>

          <!-- 2 nhánh song song -->
          <div class="cdl-dec-cols">

            <!-- NHÁNH 1: Tương Đồng -->
            <div class="cdl-dec-col">
              <div class="cdl-dec-col__label">Nhánh 1 — Tương Đồng</div>
              <div v-for="m in aiResult.similarity" :key="m.id" class="cdl-dec-sim">
                <div class="cdl-dec-sim__svg">
                  <TongueSVGCard v-if="atlasEntry(m.id)" :params="atlasEntry(m.id)!.svg" :size="44"/>
                  <span v-else class="cdl-dec-sim__fallback">👅</span>
                </div>
                <div class="cdl-dec-sim__body">
                  <span class="cdl-dec-sim__name">{{ m.vi }}</span>
                  <div class="cdl-dec-sim__track">
                    <div class="cdl-dec-sim__fill"
                      :style="{ width: m.score + '%',
                        background: m.score >= 70 ? '#16a34a' : m.score >= 50 ? '#d97706' : '#94a3b8' }"/>
                  </div>
                  <span class="cdl-dec-sim__reason">{{ m.reason }}</span>
                </div>
                <span class="cdl-dec-sim__pct"
                  :class="m.score >= 70 ? 'pct-hi' : m.score >= 50 ? 'pct-mid' : 'pct-lo'">
                  {{ m.score }}%
                </span>
              </div>
            </div>

            <!-- NHÁNH 2: Ảnh Thực Tế -->
            <div class="cdl-dec-col">
              <div class="cdl-dec-col__label">Nhánh 2 — Ảnh Thực Tế</div>
              <div v-for="m in aiResult.similarity" :key="m.id + '_photo'" class="cdl-dec-sim">
                <div class="cdl-dec-sim__photo" @click="atlasPhoto(m.id) && openLightbox(atlasPhoto(m.id))" :class="{ clickable: atlasPhoto(m.id) }">
                  <img v-if="atlasPhoto(m.id)" :src="atlasPhoto(m.id)" :alt="m.vi" class="cdl-dec-sim__photo-img"/>
                  <span v-else class="cdl-dec-sim__fallback">👅</span>
                  <span v-if="atlasPhoto(m.id)" class="cdl-dec-sim__zoom">🔍</span>
                </div>
                <div class="cdl-dec-sim__body">
                  <span class="cdl-dec-sim__name">{{ m.vi }}</span>
                  <div class="cdl-dec-sim__track">
                    <div class="cdl-dec-sim__fill"
                      :style="{ width: m.score + '%',
                        background: m.score >= 70 ? '#16a34a' : m.score >= 50 ? '#d97706' : '#94a3b8' }"/>
                  </div>
                  <span class="cdl-dec-sim__reason">{{ m.reason }}</span>
                </div>
                <span class="cdl-dec-sim__pct"
                  :class="m.score >= 70 ? 'pct-hi' : m.score >= 50 ? 'pct-mid' : 'pct-lo'">
                  {{ m.score }}%
                </span>
              </div>

              <div v-if="diagnoses.length" class="cdl-dec-diag">
                <div class="cdl-dec-col__label" style="margin-top:4px">Thể Bệnh Gợi Ý</div>
                <div class="cdl-dec-diag-chips">
                  <span v-for="p in diagnoses.slice(0, 4)" :key="p.name"
                    class="cdl-dec-diag-chip"
                    :style="{ background: patternColor(p.name) }">
                    {{ p.viet }} · {{ p.score }}đ
                  </span>
                </div>
              </div>
            </div>

          </div><!-- /cdl-dec-cols -->
        </section>

        <!-- CHẤT LƯỠI -->
        <section class="cdl-section">
          <h3 class="cdl-section__title">Chất Lưỡi</h3>
          <div class="cdl-field">
            <label class="cdl-field__label">Màu Sắc</label>
            <div class="cdl-chips">
              <button
                v-for="opt in MAU_CHAT_OPTS" :key="opt"
                class="cdl-chip"
                :class="{ active: mauChat === opt }"
                @click="mauChat = mauChat === opt ? '' : opt"
              >{{ opt }}</button>
            </div>
          </div>
          <div class="cdl-field">
            <label class="cdl-field__label">Hình Dạng <span class="cdl-multi-hint">(nhiều)</span></label>
            <div class="cdl-chips">
              <button
                v-for="opt in HINH_DANG_OPTS" :key="opt"
                class="cdl-chip"
                :class="{ active: hinhDang.includes(opt) }"
                @click="toggleMulti(hinhDang, opt)"
              >{{ opt }}</button>
            </div>
          </div>
          <div class="cdl-field">
            <label class="cdl-field__label">Độ Ẩm</label>
            <div class="cdl-chips">
              <button
                v-for="opt in DO_AM_OPTS" :key="opt"
                class="cdl-chip"
                :class="{ active: doAm === opt }"
                @click="doAm = doAm === opt ? '' : opt"
              >{{ opt }}</button>
            </div>
          </div>
        </section>

        <!-- RÊU LƯỠI -->
        <section class="cdl-section">
          <h3 class="cdl-section__title">Rêu Lưỡi</h3>
          <div class="cdl-field">
            <label class="cdl-field__label">Màu Rêu</label>
            <div class="cdl-chips">
              <button
                v-for="opt in MAU_REU_OPTS" :key="opt"
                class="cdl-chip"
                :class="{ active: mauReu === opt }"
                @click="mauReu = mauReu === opt ? '' : opt"
              >{{ opt }}</button>
            </div>
          </div>
          <div class="cdl-field">
            <label class="cdl-field__label">Tính Chất <span class="cdl-multi-hint">(nhiều)</span></label>
            <div class="cdl-chips">
              <button
                v-for="opt in TINH_CHAT_REU_OPTS" :key="opt"
                class="cdl-chip"
                :class="{ active: tinhChatReu.includes(opt) }"
                @click="toggleMulti(tinhChatReu, opt)"
              >{{ opt }}</button>
            </div>
          </div>
          <div class="cdl-field">
            <label class="cdl-field__label">Phân Bố <span class="cdl-multi-hint">(nhiều)</span></label>
            <div class="cdl-chips">
              <button
                v-for="opt in PHAN_BO_REU_OPTS" :key="opt"
                class="cdl-chip"
                :class="{ active: phanBoReu.includes(opt) }"
                @click="toggleMulti(phanBoReu, opt)"
              >{{ opt }}</button>
            </div>
          </div>
        </section>

        <!-- KẾT QUẢ -->
        <section class="cdl-section cdl-section--result">
          <h3 class="cdl-section__title">Kết Quả Chẩn Đoán</h3>
          <div v-if="diagnoses.length === 0" class="cdl-result-empty">
            Chọn đặc điểm lưỡi để tự động chẩn đoán
          </div>
          <div v-else class="cdl-patterns">
            <div v-for="p in diagnoses" :key="p.name" class="cdl-pattern">
              <div class="cdl-pattern__head">
                <span class="cdl-pattern__badge" :style="{ background: patternColor(p.name) }">
                  {{ p.viet }}
                </span>
                <span class="cdl-pattern__score">{{ p.score }} điểm</span>
              </div>
              <p class="cdl-pattern__mota">{{ p.mota }}</p>
              <ul class="cdl-pattern__hints">
                <li v-for="hint in p.trieu_chung" :key="hint">{{ hint }}</li>
              </ul>
            </div>
          </div>

          <div class="cdl-field cdl-field--notes">
            <label class="cdl-field__label">Ghi Chú Thêm</label>
            <textarea v-model="ghiChu" class="cdl-textarea" rows="3" placeholder="Ghi chú bổ sung của bác sĩ..."/>
          </div>

          <div class="cdl-save-row">
            <p v-if="saveError" class="cdl-save-error">{{ saveError }}</p>
            <p v-if="saveSuccess" class="cdl-save-ok">Đã lưu thành công ✓</p>
            <button class="btn-save" :disabled="saving" @click="save">
              <span v-if="saving">Đang lưu...</span>
              <span v-else>{{ editingId ? 'Cập Nhật' : 'Lưu Vào Hồ Sơ' }}</span>
            </button>
            <button
              v-if="selectedPatient"
              class="btn-goto-examination"
              @click="goToNewExamination"
              title="Tạo phiếu khám mới cho bệnh nhân này"
            >Tạo Phiếu Khám →</button>
            <button
              v-if="selectedPatient"
              class="btn-goto-patient"
              @click="goToPatient"
              title="Xem toàn bộ hồ sơ bệnh nhân"
            >Hồ Sơ Bệnh Nhân →</button>
          </div>
        </section>
      </main>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <div v-if="lightboxSrc" class="cdl-lightbox" @click.self="closeLightbox">
        <button class="cdl-lightbox__close" @click="closeLightbox">✕</button>
        <img :src="lightboxSrc" class="cdl-lightbox__img" @click.stop/>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ── Layout ── */
.cdl-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface-2, #f8f5f0);
  overflow: hidden;
}

.cdl-main-tabs {
  display: flex;
  gap: 0;
  background: var(--white, #fff);
  border-bottom: 2px solid var(--brown-100, #ede0d4);
  flex-shrink: 0;
}
.cdl-main-tab {
  padding: 10px 24px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  background: transparent;
  color: var(--gray-500, #6b7280);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all .15s;
}
.cdl-main-tab:hover { color: var(--brown-700, #7a4515); }
.cdl-main-tab.active { color: var(--brown-800, #5c3210); border-bottom-color: var(--brown-700, #7a4515); }

.cdl-atlas-wrap {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.cdl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4, 16px);
  padding: 16px 24px;
  background: var(--white, #fff);
  border-bottom: 1px solid var(--brown-100, #ede0d4);
  flex-shrink: 0;
  flex-wrap: wrap;
}
.cdl-header__title h2 { margin: 0; font-size: 18px; font-weight: 700; color: var(--brown-900, #3b1f0e); }
.cdl-header__sub { font-size: 12px; color: var(--gray-500, #6b7280); margin-left: 8px; }

.cdl-body {
  display: grid;
  grid-template-columns: 260px 1fr;
  flex: 1;
  overflow: hidden;
}
@media (max-width: 900px) {
  .cdl-body { grid-template-columns: 1fr; overflow: auto; }
}

/* ── Left ── */
.cdl-left {
  display: flex;
  flex-direction: column;
  background: var(--white, #fff);
  border-right: 1px solid var(--brown-100, #ede0d4);
  overflow-y: auto;
}

.cdl-svg-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px 12px;
  border-bottom: 1px solid var(--brown-100, #ede0d4);
}
.cdl-svg-hint { font-size: 10px; color: var(--gray-400, #9ca3af); margin: 0 0 8px; text-align: center; }

.tongue-svg {
  width: 180px;
  height: 252px;
  cursor: crosshair;
  filter: drop-shadow(0 2px 8px rgba(74,47,23,0.12));
}
.zone-hit { cursor: pointer; }
.zl-main { font-size: 8.5px; font-weight: 700; fill: #7a3030; }
.zl-sub  { font-size: 7px;   fill: #9a5050; }

.cdl-zone-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  margin-top: 10px;
}
.cdl-zone-chip {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--brown-200, #d4b8a0);
  background: var(--white, #fff);
  color: var(--brown-700, #7a4515);
  cursor: pointer;
  transition: all .12s;
}
.cdl-zone-chip.active { background: #ef4444; color: #fff; border-color: #ef4444; }

/* ── History ── */
.cdl-history { flex: 1; padding: 12px; }
.cdl-history__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.cdl-history__head h4 { margin: 0; font-size: 12px; font-weight: 700; color: var(--brown-700, #7a4515); text-transform: uppercase; letter-spacing: 0.06em; }
.cdl-history__empty-hint,
.cdl-history__loading,
.cdl-history__empty,
.cdl-history__no-patient { font-size: 11px; color: var(--gray-400, #9ca3af); }
.cdl-history__list { display: flex; flex-direction: column; gap: 4px; }
.cdl-history-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid var(--brown-100, #ede0d4);
  background: var(--white, #fff);
  text-align: left;
  cursor: pointer;
  transition: all .12s;
}
.cdl-history-item:hover { border-color: var(--brown-300, #c0956a); background: var(--brown-50, #fdf8f4); }
.cdl-history-item.active { border-color: var(--brown-500, #a0632a); background: var(--brown-50, #fdf8f4); }
.cdl-hi-date { font-size: 11px; font-weight: 700; color: var(--brown-700, #7a4515); }
.cdl-hi-mau  { font-size: 10px; color: var(--gray-600, #4b5563); }
.cdl-hi-diag { font-size: 10px; color: var(--gray-400, #9ca3af); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn-new-record {
  margin-top: 10px;
  width: 100%;
  padding: 7px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 8px;
  border: 1px dashed var(--brown-300, #c0956a);
  background: transparent;
  color: var(--brown-600, #8a5020);
  cursor: pointer;
}
.btn-new-record:hover { background: var(--brown-50, #fdf8f4); }

/* ── Right ── */
.cdl-right {
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cdl-section {
  background: var(--white, #fff);
  border: 1px solid var(--brown-100, #ede0d4);
  border-radius: 12px;
  padding: 16px;
}
.cdl-section__title {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--brown-700, #7a4515);
}

.cdl-field { margin-bottom: 12px; }
.cdl-field:last-child { margin-bottom: 0; }
.cdl-field__label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: var(--gray-500, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}
.cdl-multi-hint { font-weight: 400; text-transform: none; color: var(--gray-400, #9ca3af); }

.cdl-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.cdl-chip {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--brown-200, #d4b8a0);
  background: var(--white, #fff);
  color: var(--brown-700, #7a4515);
  cursor: pointer;
  transition: all .12s;
  white-space: nowrap;
}
.cdl-chip:hover { border-color: var(--brown-400, #b07840); background: var(--brown-50, #fdf8f4); }
.cdl-chip.active { background: var(--brown-700, #7a4515); color: #fff; border-color: var(--brown-700, #7a4515); }

/* ── Results ── */
.cdl-result-empty {
  font-size: 13px;
  color: var(--gray-400, #9ca3af);
  text-align: center;
  padding: 16px 0;
  font-style: italic;
}
.cdl-patterns { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.cdl-pattern {
  border: 1px solid var(--gray-200, #e5e7eb);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--surface-2, #f9f9f9);
}
.cdl-pattern__head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.cdl-pattern__badge {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  padding: 2px 10px;
  border-radius: 999px;
}
.cdl-pattern__score { font-size: 11px; color: var(--gray-400, #9ca3af); }
.cdl-pattern__mota { margin: 0 0 4px; font-size: 12px; color: var(--gray-600, #4b5563); }
.cdl-pattern__hints { margin: 0; padding-left: 16px; }
.cdl-pattern__hints li { font-size: 11px; color: var(--gray-500, #6b7280); line-height: 1.6; }

.cdl-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--brown-200, #d4b8a0);
  border-radius: 8px;
  font-size: 13px;
  color: var(--gray-800, #1f2937);
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
}
.cdl-textarea:focus { outline: none; border-color: var(--brown-400, #b07840); }

.cdl-save-row { display: flex; align-items: center; gap: 12px; margin-top: 12px; flex-wrap: wrap; }
.cdl-save-error { font-size: 12px; color: #ef4444; margin: 0; }
.cdl-save-ok    { font-size: 12px; color: #16a34a; margin: 0; }
.btn-save {
  padding: 9px 24px;
  font-size: 13px;
  font-weight: 700;
  border-radius: 8px;
  border: none;
  background: var(--brown-700, #7a4515);
  color: #fff;
  cursor: pointer;
  transition: background .15s;
}
.btn-save:hover:not(:disabled) { background: var(--brown-800, #5c3210); }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-goto-examination {
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 700;
  border-radius: 8px;
  border: 1px solid var(--brown-400, #b07840);
  background: transparent;
  color: var(--brown-700, #7a4515);
  cursor: pointer;
  transition: background .15s;
  white-space: nowrap;
}
.btn-goto-examination:hover { background: var(--brown-50, #fdf8f4); }

.btn-goto-patient {
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid var(--brown-200, #d4b8a0);
  background: transparent;
  color: var(--gray-600, #4b5563);
  cursor: pointer;
  transition: background .15s;
  white-space: nowrap;
}
.btn-goto-patient:hover { background: var(--surface-2, #f8f5f0); }

/* ── Patient picker ── */
.cdl-patient-picker { position: relative; min-width: 240px; }
.cdl-patient-input-wrap { position: relative; }
.cdl-patient-input {
  width: 100%;
  padding: 7px 32px 7px 12px;
  border: 1px solid var(--brown-200, #d4b8a0);
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}
.cdl-patient-input:focus { border-color: var(--brown-400, #b07840); }
.cdl-patient-clear,
.cdl-patient-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 12px;
  cursor: pointer;
  color: var(--gray-400, #9ca3af);
}
.cdl-patient-drop {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--white, #fff);
  border: 1px solid var(--brown-200, #d4b8a0);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,.1);
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
}
.cdl-patient-loading { padding: 10px 12px; font-size: 12px; color: var(--gray-400, #9ca3af); }
.cdl-patient-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background .1s;
}
.cdl-patient-item:hover { background: var(--brown-50, #fdf8f4); }
.cdl-pi-name { font-size: 13px; font-weight: 600; color: var(--brown-800, #5c3210); }
.cdl-pi-meta { font-size: 11px; color: var(--gray-400, #9ca3af); }
.cdl-patient-badge {
  margin-top: 4px;
  font-size: 11px;
  color: var(--brown-600, #8a5020);
  padding: 2px 8px;
  background: var(--brown-50, #fdf8f4);
  border-radius: 4px;
  border: 1px solid var(--brown-200, #d4b8a0);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.cdl-patient-badge__link {
  font-size: 11px;
  font-weight: 700;
  color: var(--brown-700, #7a4515);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.cdl-patient-badge__link:hover { color: var(--brown-900, #3b1f0e); }

/* ── AI Upload Section ── */
.cdl-ai-badge {
  font-size: 9px; font-weight: 800; padding: 1px 6px;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: #fff; border-radius: 999px; margin-left: 6px;
  vertical-align: middle; letter-spacing: .04em;
}

.cdl-drop-zone {
  border: 2px dashed var(--brown-300, #c0956a);
  border-radius: 10px;
  padding: 28px 16px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  cursor: pointer;
  background: var(--brown-50, #fdf8f4);
  transition: border-color .15s, background .15s;
}
.cdl-drop-zone:hover, .cdl-drop-zone.dragging {
  border-color: var(--brown-600, #8a5020);
  background: #fef3e8;
}
.cdl-drop-icon { font-size: 28px; }
.cdl-drop-text { font-size: 13px; font-weight: 600; color: var(--brown-700, #7a4515); }
.cdl-drop-sub  { font-size: 11px; color: var(--gray-400, #9ca3af); }
.cdl-file-hidden { display: none; }

.cdl-img-preview-wrap {
  display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap;
}
.cdl-img-preview {
  position: relative; flex-shrink: 0;
  width: 120px; height: 120px;
  border-radius: 8px; overflow: hidden;
  border: 2px solid var(--brown-200, #d4b8a0);
}
.cdl-preview-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cdl-preview-clear {
  position: absolute; top: 4px; right: 4px;
  width: 20px; height: 20px; border-radius: 50%;
  background: rgba(0,0,0,.55); border: none;
  color: #fff; font-size: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}

.btn-analyze {
  padding: 9px 18px; font-size: 13px; font-weight: 700;
  border-radius: 8px; border: none;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: #fff; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  transition: opacity .15s;
  align-self: flex-start; margin-top: 4px;
}
.btn-analyze:hover:not(:disabled) { opacity: .88; }
.btn-analyze:disabled { opacity: .5; cursor: not-allowed; }

.cdl-ai-error { font-size: 12px; color: #ef4444; margin: 8px 0 0; }

.cdl-ai-result { margin-top: 14px; display: flex; flex-direction: column; gap: 12px; }

.cdl-ai-block { background: var(--surface-2, #f8f5f0); border-radius: 8px; padding: 12px; }
.cdl-ai-block__title {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .05em; color: var(--gray-500, #6b7280);
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px;
}

/* Similarity list */
.cdl-sim-list { display: flex; flex-direction: column; gap: 8px; }
.cdl-sim-row {
  display: flex; align-items: center; gap: 10px;
  background: var(--white, #fff); border-radius: 8px; padding: 8px 10px;
  border: 1px solid var(--brown-100, #ede0d4);
}
.cdl-sim-svg { flex-shrink: 0; }
.cdl-sim-fallback { font-size: 28px; }
.cdl-sim-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.cdl-sim-name   { font-size: 12px; font-weight: 700; color: var(--brown-800, #5c3210); }
.cdl-sim-reason { font-size: 11px; color: var(--gray-500, #6b7280); line-height: 1.4; }
.cdl-sim-score  { font-size: 14px; font-weight: 800; flex-shrink: 0; }
.score-high { color: #16a34a; }
.score-mid  { color: #d97706; }
.score-low  { color: #9ca3af; }

/* Feature chips */
.cdl-ai-feats { display: flex; flex-wrap: wrap; gap: 6px; }
.cdl-ai-feat {
  font-size: 11px; font-weight: 600;
  padding: 3px 10px; border-radius: 999px;
  background: var(--brown-100, #ede0d4); color: var(--brown-800, #5c3210);
  border: 1px solid var(--brown-200, #d4b8a0);
}

.btn-autofill {
  font-size: 11px; font-weight: 700; padding: 3px 10px;
  border-radius: 6px; border: none;
  background: var(--brown-700, #7a4515); color: #fff;
  cursor: pointer; white-space: nowrap;
  transition: background .12s;
}
.btn-autofill:hover { background: var(--brown-800, #5c3210); }

/* ── Decision Panel ── */
.cdl-section--decision { padding: 14px; }

.cdl-dec-header {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--brown-100, #ede0d4);
}
.cdl-dec-header__thumb {
  width: 52px; height: 52px; border-radius: 8px;
  object-fit: cover; flex-shrink: 0;
  border: 2px solid var(--brown-200, #d4b8a0);
}
.cdl-dec-header__info {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 2px;
}
.cdl-dec-header__title { font-size: 13px; font-weight: 700; color: var(--brown-800, #5c3210); }
.cdl-dec-header__sub   { font-size: 11px; color: var(--gray-400, #9ca3af); }
.cdl-dec-header__retry {
  padding: 6px 12px; font-size: 11px; font-weight: 700;
  border-radius: 7px; border: 1px solid var(--brown-300, #c0956a);
  background: transparent; color: var(--brown-600, #8a5020);
  cursor: pointer; white-space: nowrap; flex-shrink: 0;
  transition: background .12s;
}
.cdl-dec-header__retry:hover { background: var(--brown-50, #fdf8f4); }

.cdl-dec-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 700px) {
  .cdl-dec-cols { grid-template-columns: 1fr; }
}

.cdl-dec-col {
  background: var(--surface-2, #f8f5f0);
  border-radius: 10px;
  padding: 12px;
  display: flex; flex-direction: column; gap: 8px;
}
.cdl-dec-col__label {
  font-size: 10px; font-weight: 800; text-transform: uppercase;
  letter-spacing: .06em; color: var(--gray-500, #6b7280);
}

/* Similarity rows in decision col */
.cdl-dec-sim {
  display: flex; align-items: center; gap: 8px;
  background: var(--white, #fff); border-radius: 8px;
  padding: 7px 9px;
  border: 1px solid var(--brown-100, #ede0d4);
}
.cdl-dec-sim__svg,
.cdl-dec-sim__photo { flex-shrink: 0; }
.cdl-dec-sim__photo {
  width: 44px; height: 44px;
  border-radius: 6px; overflow: hidden;
  background: #111;
  border: 1px solid var(--brown-100, #ede0d4);
}
.cdl-dec-sim__photo-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cdl-dec-sim__fallback { font-size: 22px; }
.cdl-dec-sim__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.cdl-dec-sim__name   { font-size: 12px; font-weight: 700; color: var(--brown-800, #5c3210); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cdl-dec-sim__reason { font-size: 10px; color: var(--gray-500, #6b7280); line-height: 1.35; }
.cdl-dec-sim__track {
  height: 5px; border-radius: 3px;
  background: var(--brown-100, #ede0d4); overflow: hidden;
}
.cdl-dec-sim__fill { height: 100%; border-radius: 3px; transition: width .4s ease; }
.cdl-dec-sim__pct  { font-size: 13px; font-weight: 800; flex-shrink: 0; min-width: 38px; text-align: right; }
.pct-hi  { color: #16a34a; }
.pct-mid { color: #d97706; }
.pct-lo  { color: #9ca3af; }

/* Diagnosis chips in decision col */
.cdl-dec-diag { display: flex; flex-direction: column; gap: 6px; }
.cdl-dec-diag-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.cdl-dec-diag-chip {
  font-size: 11px; font-weight: 700; color: #fff;
  padding: 4px 12px; border-radius: 999px;
  white-space: nowrap;
}

/* ── Photo click-to-zoom ── */
.cdl-dec-sim__photo.clickable { cursor: zoom-in; }
.cdl-dec-sim__photo { position: relative; }
.cdl-dec-sim__zoom {
  position: absolute; bottom: 2px; right: 2px;
  font-size: 9px; line-height: 1;
  background: rgba(0,0,0,.5); border-radius: 3px;
  padding: 1px 2px;
  pointer-events: none;
}

/* ── Lightbox ── */
.cdl-lightbox {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,.85);
  display: flex; align-items: center; justify-content: center;
  cursor: zoom-out;
}
.cdl-lightbox__close {
  position: absolute; top: 16px; right: 20px;
  font-size: 22px; color: #fff; background: none; border: none;
  cursor: pointer; line-height: 1; opacity: .8;
}
.cdl-lightbox__close:hover { opacity: 1; }
.cdl-lightbox__img {
  max-width: 90vw; max-height: 88vh;
  border-radius: 10px;
  box-shadow: 0 8px 48px rgba(0,0,0,.6);
  object-fit: contain;
  cursor: default;
}

/* ── Two analyze buttons ── */
.cdl-analyze-btns { display: flex; gap: 8px; flex-wrap: wrap; align-items: flex-start; margin-top: 4px; }
.btn-analyze--ml {
  background: linear-gradient(135deg, #059669, #0d9488) !important;
}
</style>
