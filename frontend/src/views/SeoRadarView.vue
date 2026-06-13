<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { api } from '@/services/api'

// ===== Kiểu dữ liệu =====
interface ThongKe {
  tong: number
  cho: number
  da_phan_tich: number
  loi: number
  ngoai_nganh: number
}
interface DoiThu {
  id: number
  domain: string
  ten: string | null
  la_cua_minh: boolean
  ghi_chu: string | null
  thong_ke: ThongKe
}
interface SeoUrlRow {
  id: number
  doi_thu_id: number
  url: string
  trang_thai: 'cho' | 'da_phan_tich' | 'loi' | 'ngoai_nganh'
  chu_de: string | null
  tu_khoa: string | null
  tom_tat: string | null
  loi: string | null
}
interface Cum {
  id: number
  ten_cum: string
  diem_uu_tien: number
  tu_khoa_muc_tieu: string | null
  y_tuong_noi_dung: string | null
  ly_do: string | null
  doi_thu_id: number | null
  trang_thai: string
}

// ===== State =====
const doiThuList = ref<DoiThu[]>([])
const cumList = ref<Cum[]>([])
const urlRows = ref<SeoUrlRow[]>([])
const selectedDoiThuId = ref<number | null>(null)
const urlFilter = ref<'all' | 'cho' | 'da_phan_tich' | 'loi' | 'ngoai_nganh'>('all')

const loadingList = ref(false)
const loadingUrls = ref(false)
const busyIds = ref<Set<number>>(new Set()) // id đối thủ / url đang chạy
const message = ref<{ kind: 'ok' | 'err' | 'info'; text: string } | null>(null)

// Form thêm đối thủ
const form = ref<{ domain: string; ten: string; la_cua_minh: boolean }>({
  domain: '',
  ten: '',
  la_cua_minh: false,
})
const adding = ref(false)
const batchLimit = ref(5) // số URL phân tích mỗi đợt — nhập tay (1–30). Nhỏ để tránh timeout proxy (nginx cắt sau 120s).

// ===== Khoảng trống nội dung (gap) — gom theo từng đối thủ =====
const gapBusyId = ref<number | null>(null) // id đối thủ đang chạy tìm khoảng trống
const openGroupId = ref<number | null>(null) // nhóm đối thủ đang mở (accordion — mỗi lúc 1 nhóm cho gọn)

// ===== Helpers =====
function flash(kind: 'ok' | 'err' | 'info', text: string) {
  message.value = { kind, text }
  if (kind === 'ok' || kind === 'info') {
    setTimeout(() => {
      if (message.value?.text === text) message.value = null
    }, 5000)
  }
}
function setBusy(id: number, on: boolean) {
  const s = new Set(busyIds.value)
  if (on) s.add(id)
  else s.delete(id)
  busyIds.value = s
}
const isBusy = (id: number) => busyIds.value.has(id)

const selectedDoiThu = computed(() => doiThuList.value.find((d) => d.id === selectedDoiThuId.value) || null)
const filteredUrls = computed(() =>
  urlFilter.value === 'all' ? urlRows.value : urlRows.value.filter((u) => u.trang_thai === urlFilter.value),
)
// Đối thủ ĐÃ có bài phân tích → mỗi đối thủ là 1 nhóm tìm khoảng trống ở bước 3.
const analyzedCompetitors = computed(() =>
  doiThuList.value.filter((d) => !d.la_cua_minh && d.thong_ke.da_phan_tich > 0),
)
// Các cụm khoảng trống (đang đề xuất) thuộc về 1 đối thủ — đã sắp theo điểm giảm dần từ API.
function gapsFor(doiThuId: number): Cum[] {
  return cumList.value.filter((c) => c.doi_thu_id === doiThuId && c.trang_thai === 'de_xuat')
}
// Tra nhanh domain theo id (gắn nhãn đối thủ cho thẻ cụm bên Lò Viết Bài).
const domainById = computed<Record<number, string>>(() => {
  const m: Record<number, string> = {}
  for (const d of doiThuList.value) m[d.id] = d.domain
  return m
})
// Cụm còn "đang đề xuất" (chưa viết) — danh sách gợi ý để viết bên Lò Viết Bài.
const goiYCums = computed(() => cumList.value.filter((c) => c.trang_thai === 'de_xuat'))

// Accordion bước 3: mở 1 nhóm đối thủ tại một thời điểm cho gọn (đỡ phải kéo dài).
let groupTouched = false
function toggleGroup(id: number) {
  groupTouched = true
  openGroupId.value = openGroupId.value === id ? null : id
}
// Lần đầu có dữ liệu: tự mở nhóm đầu tiên ĐÃ có gợi ý (hoặc nhóm đầu) cho dễ thấy; sau đó để người tự điều khiển.
watch(
  [analyzedCompetitors, cumList],
  () => {
    if (groupTouched || openGroupId.value !== null) return
    const first = analyzedCompetitors.value.find((d) => gapsFor(d.id).length) || analyzedCompetitors.value[0]
    if (first) openGroupId.value = first.id
  },
  { immediate: true },
)

const TRANG_THAI_LABEL: Record<string, string> = {
  cho: 'Chờ',
  da_phan_tich: 'Đã phân tích',
  loi: 'Lỗi',
  ngoai_nganh: 'Ngoài ngành',
}

// ===== API calls =====
async function loadDoiThu() {
  loadingList.value = true
  try {
    const res = await api.get<{ data: DoiThu[] }>('/seo/doi-thu')
    doiThuList.value = res.data
  } catch (e: any) {
    flash('err', e.message || 'Không tải được danh sách đối thủ')
  } finally {
    loadingList.value = false
  }
}

async function loadCum() {
  try {
    const res = await api.get<{ data: Cum[] }>('/seo/cum')
    cumList.value = res.data
  } catch {
    /* im lặng */
  }
}

async function loadUrls(doiThuId: number) {
  selectedDoiThuId.value = doiThuId
  loadingUrls.value = true
  try {
    const res = await api.get<{ data: SeoUrlRow[] }>(`/seo/url?doiThuId=${doiThuId}`)
    urlRows.value = res.data
  } catch (e: any) {
    flash('err', e.message || 'Không tải được danh sách URL')
  } finally {
    loadingUrls.value = false
  }
}

async function addDoiThu() {
  const domain = form.value.domain.trim()
  if (!domain) {
    flash('err', 'Nhập domain đối thủ trước đã (vd: dokinhlac.com.vn)')
    return
  }
  adding.value = true
  try {
    await api.post('/seo/doi-thu', {
      domain,
      ten: form.value.ten.trim() || undefined,
      la_cua_minh: form.value.la_cua_minh,
    })
    form.value = { domain: '', ten: '', la_cua_minh: false }
    flash('ok', 'Đã thêm. Bấm "Quét Sitemap" để gom URL.')
    await loadDoiThu()
  } catch (e: any) {
    flash('err', e.message || 'Thêm đối thủ thất bại')
  } finally {
    adding.value = false
  }
}

async function removeDoiThu(d: DoiThu) {
  if (!confirm(`Xoá "${d.domain}" và toàn bộ URL đã gom của nó?`)) return
  setBusy(d.id, true)
  try {
    await api.delete(`/seo/doi-thu/${d.id}`)
    if (selectedDoiThuId.value === d.id) {
      selectedDoiThuId.value = null
      urlRows.value = []
    }
    await loadDoiThu()
  } catch (e: any) {
    flash('err', e.message || 'Xoá thất bại')
  } finally {
    setBusy(d.id, false)
  }
}

async function crawl(d: DoiThu) {
  setBusy(d.id, true)
  flash('info', `Đang đọc sitemap của ${d.domain}…`)
  try {
    const res = await api.post<{ data: { found: number; added: number } }>(`/seo/doi-thu/${d.id}/crawl`, {})
    flash('ok', `Tìm thấy ${res.data.found} URL, thêm mới ${res.data.added}.`)
    await loadDoiThu()
    if (selectedDoiThuId.value === d.id) await loadUrls(d.id)
  } catch (e: any) {
    flash('err', e.message || 'Quét sitemap thất bại')
  } finally {
    setBusy(d.id, false)
  }
}

async function analyzeBatch(d: DoiThu) {
  // Số nhập tay, kẹp về 1–30 (trần backend MAX_ANALYZE_BATCH=30, tránh nginx cắt sau 120s).
  const lim = Math.min(30, Math.max(1, Math.floor(Number(batchLimit.value) || 5)))
  batchLimit.value = lim
  const choTruoc = d.thong_ke.cho || 0
  setBusy(d.id, true)
  flash('info', `Đang phân tích tối đa ${lim} bài của ${d.domain} (AI có thể mất 1-2 phút)…`)
  try {
    const res = await api.post<{
      data: { analyzed: number; ok: number; loi: number; ngoai_nganh: number }
    }>(`/seo/doi-thu/${d.id}/analyze-batch`, { limit: lim })
    const conLai = Math.max(0, choTruoc - res.data.analyzed)
    const ngoai = res.data.ngoai_nganh || 0
    flash(
      'ok',
      `Đã phân tích ${res.data.analyzed} bài (thuộc ngách ${res.data.ok}` +
        (ngoai > 0 ? `, ngoài ngành ${ngoai} — bỏ qua khỏi tốn AI` : '') +
        `, lỗi ${res.data.loi}).` +
        (conLai > 0
          ? ` Còn ${conLai} bài đang chờ — chỉnh số rồi bấm "Phân Tích" lần nữa để chạy tiếp.`
          : ' Đã hết bài chờ 🎉'),
    )
    await loadDoiThu()
    if (selectedDoiThuId.value === d.id) await loadUrls(d.id)
  } catch (e: any) {
    flash('err', e.message || 'Phân tích thất bại')
  } finally {
    setBusy(d.id, false)
  }
}

async function analyzeOne(u: SeoUrlRow) {
  setBusy(u.id, true)
  try {
    // URL đã bị đánh "ngoài ngành" → bấm lại = ÉP phân tích (bỏ qua bộ lọc ngách).
    const q = u.trang_thai === 'ngoai_nganh' ? '?force=true' : ''
    const res = await api.post<{ data: SeoUrlRow }>(`/seo/url/${u.id}/analyze${q}`, {})
    const idx = urlRows.value.findIndex((x) => x.id === u.id)
    if (idx >= 0) urlRows.value[idx] = res.data
    if (res.data.trang_thai === 'loi') flash('err', `Lỗi: ${res.data.loi}`)
    else if (res.data.trang_thai === 'ngoai_nganh')
      flash('info', 'Trang này ngoài ngách Đông Y nên đã bỏ qua. Bấm "Ép PT" nếu vẫn muốn phân tích.')
    await loadDoiThu()
  } catch (e: any) {
    flash('err', e.message || 'Phân tích URL thất bại')
  } finally {
    setBusy(u.id, false)
  }
}

async function removeUrl(u: SeoUrlRow) {
  if (!confirm(`Xoá URL này khỏi danh sách?\n${shortUrl(u.url)}`)) return
  setBusy(u.id, true)
  try {
    await api.delete(`/seo/url/${u.id}`)
    urlRows.value = urlRows.value.filter((x) => x.id !== u.id)
    await loadDoiThu()
  } catch (e: any) {
    flash('err', e.message || 'Xoá URL thất bại')
  } finally {
    setBusy(u.id, false)
  }
}

// Tìm khoảng trống RIÊNG cho 1 đối thủ (so bài của đối thủ đó ↔ bài của mình).
async function runGapFor(d: DoiThu) {
  gapBusyId.value = d.id
  flash('info', `AI đang so nội dung của ${d.domain} với của bạn để tìm khoảng trống…`)
  try {
    const res = await api.post<{ data: Cum[] }>('/seo/gap-analysis', { doiThuId: d.id })
    cumList.value = res.data // API trả về toàn bộ cụm (mọi đối thủ) → gapsFor() tự lọc theo đối thủ
    groupTouched = true
    openGroupId.value = d.id // mở luôn nhóm vừa tìm xong
    flash('ok', `Xong! Đã gợi ý ${gapsFor(d.id).length} cụm nên viết cho ${d.domain}.`)
  } catch (e: any) {
    flash('err', e.message || 'Phân tích khoảng trống thất bại')
  } finally {
    gapBusyId.value = null
  }
}

function shortUrl(u: string): string {
  return u.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

// Bấm "Viết" ngay trong bảng khoảng trống → sang tab Lò Viết Bài (nơi có thanh tiến trình) rồi viết nháp.
function writeFromGap(c: Cum) {
  tab.value = 'viet'
  void genFromCum(c)
}

// ===== Phase 2: Lò Viết Bài =====
type Tab = 'radar' | 'viet' | 'trend' | 'gsc'
const tab = ref<Tab>('radar')

interface BaiViet {
  id: number
  cum_id: number | null
  tieu_de: string
  slug: string | null
  meta_description: string | null
  tu_khoa: string | null
  category: string | null
  cta: string | null
  faq: string | null
  nguon_tham_khao: string | null
  noi_dung_md: string
  do_rui_ro: 'an_toan' | 'rui_ro'
  ly_do_rui_ro: string | null
  kiem_duyet: string | null
  trang_thai: 'nhap' | 'da_duyet' | 'bo_qua' | 'da_dang'
}

const baiVietList = ref<BaiViet[]>([])
const genBusy = ref<number | null>(null) // cum_id đang sinh, -1 = viết tự do
const freeChuDe = ref('')
const freeTuKhoa = ref('')
const seedingDatTrong = ref(false) // đang bơm gợi ý "đất trống thực thể"

// Tiến trình ước lượng cho "Viết nháp" (AI chạy 2 lượt: viết thân bài → rà soát YMYL + bóc metadata).
// Backend xử lý đồng bộ trong 1 request nên KHÔNG có % thật — đây là ước lượng theo thời gian cho đỡ sốt ruột.
const genProgress = ref(0)
const genStage = ref('')
let genTimer: ReturnType<typeof setInterval> | null = null

function startGenProgress() {
  genProgress.value = 0
  genStage.value = 'Đang gửi yêu cầu tới AI…'
  const t0 = Date.now()
  const EST = 40000 // ~40s cho 2 lượt gọi AI
  if (genTimer) clearInterval(genTimer)
  genTimer = setInterval(() => {
    const elapsed = Date.now() - t0
    // Tiến tới tối đa 95% theo đường cong (không chạm 100 tới khi có kết quả thật).
    genProgress.value = Math.min(95, Math.round((1 - Math.exp(-elapsed / (EST * 0.55))) * 100))
    if (genProgress.value < 8) genStage.value = 'Đang gửi yêu cầu tới AI…'
    else if (genProgress.value < 58) genStage.value = 'Bước 1/2 · Đang viết thân bài + chèn link nội bộ…'
    else genStage.value = 'Bước 2/2 · Đang rà soát an toàn (YMYL) & bóc tiêu đề, mô tả, nguồn…'
  }, 350)
}

function stopGenProgress() {
  if (genTimer) {
    clearInterval(genTimer)
    genTimer = null
  }
  genProgress.value = 100
  genStage.value = 'Hoàn tất!'
  setTimeout(() => {
    if (genBusy.value === null) genProgress.value = 0
  }, 900)
}
const editing = ref<BaiViet | null>(null)
const savingEditor = ref(false)
const exportingId = ref<number | null>(null)
const publishingId = ref<number | null>(null)
const genImagesId = ref<number | null>(null)
const genCoverId = ref<number | null>(null) // id bài đang vẽ ẢNH BÌA AI
// Đường dẫn ảnh bìa AI (cover.*) của bài đang sửa — '' nghĩa là chưa có → dùng ảnh "của nhà".
const customCover = ref('')

// ===== Tiến trình khi Đăng (overlay: chạy bar tới khi xong → bật nút Xem) =====
const pubModal = ref(false) // overlay tiến trình đang hiện
const pubProgress = ref(0)
const pubStage = ref('')
const pubNote = ref('') // ghi chú backend khi xong (vd "deploy lại để lên web")
const pubWrote = ref(false) // true = đã ghi file .md (máy có mã nguồn) → trang có thể xem; false = chỉ đánh dấu DB
const pubDone = ref(false) // đăng xong → cho bấm Xem
const pubError = ref('')
const pubTarget = ref<{ id: number; slug: string; tieu_de: string } | null>(null)
let pubTimer: ReturnType<typeof setInterval> | null = null

function startPubProgress(a: BaiViet) {
  pubModal.value = true
  pubDone.value = false
  pubError.value = ''
  pubNote.value = ''
  pubWrote.value = false
  pubProgress.value = 0
  pubTarget.value = { id: a.id, slug: a.slug || '', tieu_de: a.tieu_de }
  pubStage.value = 'Đang gửi yêu cầu đăng…'
  const t0 = Date.now()
  const EST = 6000 // ~6s: ghi file .md + cập nhật trạng thái (không có % thật → ước lượng)
  if (pubTimer) clearInterval(pubTimer)
  pubTimer = setInterval(() => {
    const elapsed = Date.now() - t0
    pubProgress.value = Math.min(92, Math.round((1 - Math.exp(-elapsed / (EST * 0.5))) * 100))
    if (pubProgress.value < 30) pubStage.value = 'Đang ghi file bài viết (.md)…'
    else if (pubProgress.value < 70) pubStage.value = 'Đang cập nhật trạng thái “Đã đăng”…'
    else pubStage.value = 'Sắp xong…'
  }, 200)
}
function finishPubProgress(
  ok: boolean,
  opts: { slug?: string; note?: string; error?: string; wrote?: boolean } = {},
) {
  if (pubTimer) {
    clearInterval(pubTimer)
    pubTimer = null
  }
  if (ok) {
    pubProgress.value = 100
    pubDone.value = true
    pubWrote.value = opts.wrote === true
    if (opts.slug && pubTarget.value) pubTarget.value.slug = opts.slug
    pubStage.value = 'Hoàn tất! Bài đã đăng.'
    pubNote.value = opts.note || ''
  } else {
    pubError.value = opts.error || 'Đăng thất bại.'
  }
}
function closePubModal() {
  if (pubTimer) {
    clearInterval(pubTimer)
    pubTimer = null
  }
  pubModal.value = false
  pubDone.value = false
  pubError.value = ''
  pubNote.value = ''
  pubWrote.value = false
  pubProgress.value = 0
  pubTarget.value = null
}

// ===== Phase 3: Xu Hướng =====
const DEFAULT_SEEDS = 'đo kinh lạc\nhuyệt\nbấm huyệt\nchâm cứu\nbài thuốc đông y\ntính vị quy kinh'
const trendSeeds = ref(DEFAULT_SEEDS)
const trendCandidates = ref<string[]>([])
const trendSelected = ref<Set<string>>(new Set())
const discovering = ref(false)
const runningTrend = ref(false)
// Trần số nháp viết mỗi lần — PHẢI khớp TREND_MAX_DRAFTS ở backend (nginx cắt request sau 120s).
const TREND_MAX = 2

const CTA_OPTIONS = ['/xem-ket-qua-do', '/xem-3d', '/xem-bai-thuoc', '/thu-vien', '/app']
const TT_BAIVIET: Record<string, string> = {
  nhap: 'Nháp',
  da_duyet: 'Đã duyệt',
  bo_qua: 'Bỏ qua',
  da_dang: 'Đã đăng',
}

async function loadBaiViet() {
  try {
    const res = await api.get<{ data: BaiViet[] }>('/seo/bai-viet')
    baiVietList.value = res.data
  } catch {
    /* im lặng */
  }
}

async function genFromCum(c: Cum) {
  genBusy.value = c.id
  startGenProgress()
  flash('info', `AI đang viết nháp cho cụm "${c.ten_cum}" (~30–60 giây)…`)
  try {
    const res = await api.post<{ data: BaiViet }>('/seo/bai-viet/generate', { cum_id: c.id })
    flash('ok', `Đã tạo nháp: "${res.data.tieu_de}".`)
    await Promise.all([loadBaiViet(), loadCum()])
    editing.value = { ...res.data }
  } catch (e: any) {
    flash('err', e.message || 'Viết nháp thất bại')
  } finally {
    genBusy.value = null
    stopGenProgress()
  }
}

// Bơm sẵn các "thực thể đất trống" (huyệt/kinh/bệnh/bài thuốc + chủ đề đặc sản) vào hàng chờ.
// Không cần đối thủ; nếu đã có radar thì cụm "đối thủ chưa đụng" được cộng điểm ưu tiên.
async function goiYDatTrong() {
  if (seedingDatTrong.value) return
  const truoc = goiYCums.value.length
  seedingDatTrong.value = true
  flash('info', 'Đang bơm gợi ý "đất trống thực thể" Đông Y…')
  try {
    const res = await api.post<{ data: Cum[] }>('/seo/cum/dat-trong', {})
    cumList.value = res.data
    const them = Math.max(0, goiYCums.value.length - truoc)
    flash(
      'ok',
      them > 0
        ? `Đã bổ sung ${them} cụm "đất trống". Chọn cụm điểm cao để viết trước (🌱 = đối thủ chưa đụng).`
        : 'Các thực thể đất trống đều đã có cụm/bài rồi — viết bớt rồi bấm lại để bổ sung lứa mới.',
    )
  } catch (e: any) {
    flash('err', e.message || 'Bơm gợi ý đất trống thất bại')
  } finally {
    seedingDatTrong.value = false
  }
}

async function genFree() {
  if (!freeChuDe.value.trim()) {
    flash('err', 'Nhập chủ đề trước đã.')
    return
  }
  genBusy.value = -1
  startGenProgress()
  flash('info', `AI đang viết nháp cho "${freeChuDe.value}" (~30–60 giây)…`)
  try {
    const res = await api.post<{ data: BaiViet }>('/seo/bai-viet/generate', {
      chu_de: freeChuDe.value.trim(),
      tu_khoa: freeTuKhoa.value.trim() || undefined,
    })
    flash('ok', `Đã tạo nháp: "${res.data.tieu_de}".`)
    freeChuDe.value = ''
    freeTuKhoa.value = ''
    await loadBaiViet()
    editing.value = { ...res.data }
  } catch (e: any) {
    flash('err', e.message || 'Viết nháp thất bại')
  } finally {
    genBusy.value = null
    stopGenProgress()
  }
}

function openEditor(a: BaiViet) {
  const copy = { ...a }
  // Bài cũ đã duyệt/đăng (trước khi có checklist) → coi như đã tick đủ, khỏi kẹt khi lưu lại.
  if (!copy.kiem_duyet && (copy.trang_thai === 'da_duyet' || copy.trang_thai === 'da_dang')) {
    copy.kiem_duyet = JSON.stringify({ yKhoa: true, seo: true, nguon: true, anh: true })
  }
  editing.value = copy
}
function closeEditor() {
  editing.value = null
}

// ===== Checklist kiểm duyệt thủ công (van YMYL nhiều bước) =====
const KIEM_DUYET_ITEMS: { key: string; label: string }[] = [
  { key: 'yKhoa', label: 'An toàn y khoa (YMYL): không có chẩn đoán/liều lượng nguy hiểm' },
  { key: 'seo', label: 'SEO đạt: tiêu đề, mô tả, từ khoá, slug đã chuẩn' },
  { key: 'nguon', label: 'Có nguồn tham khảo uy tín (E-E-A-T)' },
  { key: 'anh', label: 'Ảnh bìa khớp chủ đề (đã xem bên dưới)' },
]
const kiemDuyet = computed<Record<string, boolean>>(() => {
  const raw = editing.value?.kiem_duyet
  if (!raw) return {}
  try {
    return (JSON.parse(raw) as Record<string, boolean>) || {}
  } catch {
    return {}
  }
})
function toggleKiem(key: string, val: boolean) {
  if (!editing.value) return
  editing.value.kiem_duyet = JSON.stringify({ ...kiemDuyet.value, [key]: val })
}
const kiemDuyetDu = computed(() => KIEM_DUYET_ITEMS.every((it) => kiemDuyet.value[it.key] === true))

// ===== Ảnh bìa tự chọn theo chủ đề — PHẢI khớp pickCoverImage ở backend (seo.controller.ts) =====
const MERIDIAN_KEYWORDS_FE: { idx: number; phrases: string[] }[] = [
  { idx: 1, phrases: ['kinh phe', 'tang phe', 'thai am phe', 'phoi', 'lung'] },
  { idx: 2, phrases: ['dai truong', 'duong minh dai truong', 'hop coc', 'large intestine'] },
  { idx: 3, phrases: ['kinh vi', 'tang vi', 'duong minh vi', 'da day', 'tuc tam ly', 'stomach'] },
  { idx: 4, phrases: ['kinh ty', 'tang ty', 'thai am ty', 'tam am giao', 'lach', 'spleen'] },
  { idx: 5, phrases: ['kinh tam', 'tang tam', 'thieu am tam', 'tim mach', 'benh tim', 'heart'] },
  { idx: 6, phrases: ['tieu truong', 'thai duong tieu truong', 'small intestine'] },
  { idx: 7, phrases: ['bang quang', 'thai duong bang quang', 'bladder'] },
  { idx: 8, phrases: ['kinh than', 'tang than', 'thieu am than', 'bo than', 'kidney'] },
  { idx: 9, phrases: ['tam bao', 'quyet am tam bao', 'pericardium'] },
  { idx: 10, phrases: ['tam tieu', 'thieu duong tam tieu', 'san jiao', 'triple energizer'] },
  { idx: 11, phrases: ['kinh dom', 'tang dom', 'thieu duong dom', 'tui mat', 'gallbladder'] },
  { idx: 12, phrases: ['kinh can', 'tang can', 'quyet am can', 'la gan', 'bo gan', 'gan mat', 'liver'] },
]
function normLooseFE(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}
const MERIDIAN_VARIANTS_FE = ['sodo', 'chinh', 'biet', 'can', 'doc', 'ngang', 'gen']
const COVER_VARIANTS_FE = ['sodo', 'chinh', 'ngang']
const meridianImgFE = (idx: number, variant: string) =>
  `/kinhmach3d/images/meridians/kinh-${String(idx).padStart(2, '0')}-${variant}.jpg`
function hashStrFE(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}
// Manifest tên huyệt → ảnh (public/blog-assets/acu-index.json) — nạp 1 lần khi mở trang.
const acuIndex = ref<[string, string][]>([])
async function loadAcuIndex() {
  try {
    const r = await fetch('/blog-assets/acu-index.json')
    if (r.ok) acuIndex.value = await r.json()
  } catch {
    /* không có manifest → bỏ qua tầng huyệt, vẫn chạy tầng kinh */
  }
}

// Dò xem bài (theo slug) đã có ẢNH BÌA AI (cover.*) trên đĩa chưa → đặt customCover để xem trước.
async function probeCover(a: BaiViet | null) {
  customCover.value = ''
  const slug = (a?.slug || '').trim()
  if (!slug) return // chưa có slug → chưa thể có ảnh bìa AI
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    try {
      const r = await fetch(`/blog-images/${slug}/cover.${ext}`, { method: 'HEAD' })
      if (r.ok) {
        customCover.value = `/blog-images/${slug}/cover.${ext}`
        return
      }
    } catch {
      /* mạng lỗi → bỏ qua, coi như chưa có ảnh bìa AI */
    }
  }
}
function coverImageFor(a: BaiViet | null): string {
  if (!a) return ''
  if (customCover.value) return customCover.value // ảnh bìa AI đã sinh → ưu tiên hiện
  const slug = a.slug || ''
  const hay = ` ${normLooseFE([a.tieu_de, a.tu_khoa, slug].filter(Boolean).join(' '))
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `
  // Tầng 1: tên huyệt cụ thể — CHỈ khi bài nói về "huyệt" (tránh bài khái niệm khớp nhầm).
  if (hay.includes(' huyet ')) {
    for (const [name, file] of acuIndex.value) {
      if (hay.includes(` ${name} `)) return file
    }
  }
  // Tầng 2: tên kinh/tạng → 1 biến thể của đúng kinh (xoay theo slug).
  for (const m of MERIDIAN_KEYWORDS_FE) {
    if (m.phrases.some((p) => hay.includes(` ${p} `)))
      return meridianImgFE(m.idx, MERIDIAN_VARIANTS_FE[hashStrFE(slug) % MERIDIAN_VARIANTS_FE.length] ?? 'sodo')
  }
  // Tầng 3: sơ đồ kinh phân bố ổn định theo slug (12 × 3 biến thể bìa). (>>> = dịch KHÔNG dấu.)
  const h = hashStrFE(slug || 'bai-viet')
  return meridianImgFE((h % 12) + 1, COVER_VARIANTS_FE[(h >>> 4) % COVER_VARIANTS_FE.length] ?? 'sodo')
}

// ===== Kiểm duyệt TỰ ĐỘNG (phụ tay người duyệt) =====
// Quét bài rồi TỰ TICK 3 mục ĐO ĐƯỢC (SEO · Nguồn · Ảnh) nếu đạt.
// Mục An toàn Y khoa (YMYL) CHỈ cảnh báo, KHÔNG tự tick — người vẫn gật cuối (van an toàn).
type KdAuto = { key: string; label: string; status: 'ok' | 'warn' | 'info'; lines: string[] }
const autoReport = ref<KdAuto[] | null>(null)
// Đổi bài đang sửa → xoá báo cáo cũ cho khỏi nhầm + dò lại ảnh bìa AI của bài mới.
watch(() => editing.value?.id, () => {
  autoReport.value = null
  customCover.value = ''
  if (editing.value) void probeCover(editing.value)
})

// Cụm chữ nguy hiểm cho nội dung Y tế — viết dạng KHÔNG dấu vì quét trên normLooseFE().
const YMYL_RISK_PATTERNS: { re: RegExp; canh_bao: string }[] = [
  { re: /chua khoi|chua dut diem|tri dut diem|tri khoi han|khoi han|khoi hoan toan|dac tri|het benh hoan toan/, canh_bao: 'Khẳng định chữa khỏi / dứt điểm' },
  { re: /cam ket khoi|bao dam khoi|dam bao khoi|chac chan khoi|100\s?%|hieu qua tuyet doi|tuyet doi an toan/, canh_bao: 'Cam kết / tuyệt đối hoá kết quả' },
  { re: /thay the thuoc|thay the bac si|thay the bac sy|khong can di vien|khong can dung thuoc|bo thuoc tay|ngung thuoc tay/, canh_bao: 'Khuyên thay thế / bỏ điều trị Tây Y' },
  { re: /\bung thu\b|tieu duong|u buou|dot quy|tai bien|suy than|xo gan|\bhiv\b|viem gan b/, canh_bao: 'Có nhắc bệnh nặng — rà kỹ tránh hứa hẹn chữa khỏi' },
]

// Ảnh bìa khớp chủ đề khi tiêu đề/từ khoá trúng tên huyệt (Tầng 1) hoặc tên kinh/tạng (Tầng 2).
function coverMatchedTopic(a: BaiViet | null): boolean {
  if (!a) return false
  if (customCover.value) return true // ảnh bìa AI vẽ riêng theo chủ đề → coi như khớp
  const hay = ` ${normLooseFE([a.tieu_de, a.tu_khoa, a.slug].filter(Boolean).join(' '))
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `
  if (hay.includes(' huyet ')) {
    for (const [name] of acuIndex.value) if (hay.includes(` ${name} `)) return true
  }
  return MERIDIAN_KEYWORDS_FE.some((m) => m.phrases.some((p) => hay.includes(` ${p} `)))
}

function runAutoKiemDuyet() {
  const a = editing.value
  if (!a) return
  const report: KdAuto[] = []

  // 1) SEO — đo được: độ dài tiêu đề / mô tả, slug, từ khoá.
  const seo: string[] = []
  let seoFail = false
  const tdLen = (a.tieu_de || '').trim().length
  if (tdLen < 30) { seo.push(`Tiêu đề ngắn (${tdLen} ký tự, nên 30–65).`); seoFail = true }
  else if (tdLen > 65) { seo.push(`Tiêu đề dài (${tdLen} ký tự, nên 30–65).`); seoFail = true }
  const mdesc = (a.meta_description || '').trim()
  if (!mdesc) { seo.push('Thiếu mô tả (meta description).'); seoFail = true }
  else if (mdesc.length < 120) { seo.push(`Mô tả ngắn (${mdesc.length} ký tự, nên 120–160).`); seoFail = true }
  else if (mdesc.length > 160) { seo.push(`Mô tả dài (${mdesc.length} ký tự, nên 120–160).`); seoFail = true }
  const slug = (a.slug || '').trim()
  if (!slug) { seo.push('Chưa có slug.'); seoFail = true }
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { seo.push('Slug chưa chuẩn (chỉ chữ thường, số, gạch ngang).'); seoFail = true }
  const kw = normLooseFE((a.tu_khoa || '').split(',')[0] || '')
  if (!kw) seo.push('Mẹo: chưa nhập từ khoá chính.')
  else if (!normLooseFE(a.tieu_de || '').includes(kw)) seo.push('Mẹo: từ khoá chính chưa có trong tiêu đề.')
  report.push({ key: 'seo', label: 'SEO', status: seoFail ? 'warn' : 'ok', lines: seoFail ? seo : ['Tiêu đề · mô tả · slug đạt chuẩn.', ...seo] })

  // 2) Nguồn — có ít nhất 1 nguồn kèm link (E-E-A-T).
  let nSrc = 0
  try {
    const arr = JSON.parse(a.nguon_tham_khao || '[]')
    if (Array.isArray(arr)) nSrc = arr.filter((s: any) => s && (s.url || (typeof s === 'string' && /https?:\/\//.test(s)))).length
  } catch { /* JSON hỏng → coi như 0 nguồn */ }
  const mdLinks = (a.noi_dung_md.match(/\[[^\]]+\]\(https?:\/\/[^)]+\)/g) || []).length
  const nguonOk = nSrc >= 1
  const nguon: string[] = nguonOk
    ? [`Có ${nSrc} nguồn (kèm link) ở mục Nguồn tham khảo.`]
    : ['Chưa có nguồn nào kèm link ở mục “Nguồn tham khảo”.']
  if (!nguonOk && mdLinks > 0) nguon.push(`Thân bài có ${mdLinks} link ngoài — nên đưa vào mục Nguồn cho rõ.`)
  report.push({ key: 'nguon', label: 'Nguồn', status: nguonOk ? 'ok' : 'warn', lines: nguon })

  // 3) Ảnh bìa — khớp huyệt/kinh trong tiêu đề (Tầng 1/2) thì coi là khớp chủ đề.
  const anhOk = coverMatchedTopic(a)
  report.push({
    key: 'anh', label: 'Ảnh bìa', status: anhOk ? 'ok' : 'warn',
    lines: anhOk
      ? ['Ảnh bìa khớp huyệt/kinh nêu trong tiêu đề.']
      : ['Ảnh bìa đang là sơ đồ minh hoạ chung (chưa khớp huyệt/kinh cụ thể). Bài khái niệm chung thì vẫn ổn — bạn tự xem rồi tick.'],
  })

  // 4) An toàn Y khoa (YMYL) — CHỈ cảnh báo, KHÔNG tự tick.
  const hay = normLooseFE(`${a.tieu_de} ${a.meta_description || ''} ${a.noi_dung_md}`)
  const hits = YMYL_RISK_PATTERNS.filter((p) => p.re.test(hay)).map((p) => p.canh_bao)
  if (/\b\d+([.,]\d+)?\s?(mg|g|gam|gram|ml|cc)\b/.test(hay)) hits.push('Có liều lượng cụ thể (mg/g/ml) — rà lại cho an toàn')
  const y: string[] = []
  if (a.do_rui_ro === 'rui_ro') y.push(`AI đã xếp bài này RỦI RO${a.ly_do_rui_ro ? ': ' + a.ly_do_rui_ro : ''}.`)
  if (hits.length) { y.push('Cụm cần soát lại:'); for (const h of [...new Set(hits)]) y.push(`• ${h}`) }
  else if (a.do_rui_ro !== 'rui_ro') y.push('Không thấy cụm nguy hiểm rõ rệt.')
  y.push('→ YMYL: máy KHÔNG tự tick. Bạn đọc lại lần cuối rồi tự tick mục này.')
  report.push({ key: 'yKhoa', label: 'An toàn Y khoa', status: hits.length || a.do_rui_ro === 'rui_ro' ? 'warn' : 'info', lines: y })

  // TỰ TICK 3 mục đo được nếu đạt (KHÔNG đụng mục Y khoa). Mục chưa đạt thì để nguyên cho người quyết.
  for (const r of report) {
    if (r.status === 'ok' && (r.key === 'seo' || r.key === 'nguon' || r.key === 'anh')) toggleKiem(r.key, true)
  }
  autoReport.value = report
  const okN = report.filter((r) => r.key !== 'yKhoa' && r.status === 'ok').length
  flash(okN === 3 ? 'ok' : 'info', `Đã tự kiểm: ${okN}/3 mục đo được đạt & được tick. Mục Y khoa cần bạn tự gật.`)
}

// Nguồn tham khảo lưu dạng JSON [{title,url?}] nhưng cho sửa thân thiện: mỗi dòng "Tên | URL".
const nguonText = computed<string>({
  get() {
    const a = editing.value
    if (!a?.nguon_tham_khao) return ''
    try {
      const arr = JSON.parse(a.nguon_tham_khao)
      return (Array.isArray(arr) ? arr : [])
        .map((s: any) =>
          typeof s === 'string' ? s : [s.title || s.ten || '', s.url || ''].filter(Boolean).join(' | '),
        )
        .join('\n')
    } catch {
      return a.nguon_tham_khao
    }
  },
  set(v: string) {
    if (!editing.value) return
    const arr = v
      .split('\n')
      .map((ln) => ln.trim())
      .filter(Boolean)
      .map((ln) => {
        const [title, url] = ln.split('|').map((s) => s.trim())
        return url ? { title, url } : { title }
      })
    editing.value.nguon_tham_khao = arr.length ? JSON.stringify(arr) : null
  },
})

// FAQ lưu dạng JSON [{q,a}] nhưng cho sửa thân thiện: mỗi dòng "Câu hỏi | Trả lời" (chỉ tách ở dấu | đầu tiên).
const faqText = computed<string>({
  get() {
    const a = editing.value
    if (!a?.faq) return ''
    try {
      const arr = JSON.parse(a.faq)
      return (Array.isArray(arr) ? arr : [])
        .map((f: any) => [f.q || '', f.a || ''].filter(Boolean).join(' | '))
        .join('\n')
    } catch {
      return a.faq
    }
  },
  set(v: string) {
    if (!editing.value) return
    const arr = v
      .split('\n')
      .map((ln) => ln.trim())
      .filter(Boolean)
      .map((ln) => {
        const i = ln.indexOf('|')
        const q = (i >= 0 ? ln.slice(0, i) : ln).trim()
        const a = (i >= 0 ? ln.slice(i + 1) : '').trim()
        return { q, a }
      })
      .filter((f) => f.q && f.a)
    editing.value.faq = arr.length ? JSON.stringify(arr) : null
  },
})

async function saveEditor() {
  if (!editing.value) return
  savingEditor.value = true
  const e = editing.value
  try {
    const res = await api.put<{ data: BaiViet }>(`/seo/bai-viet/${e.id}`, {
      tieu_de: e.tieu_de,
      slug: e.slug,
      meta_description: e.meta_description,
      tu_khoa: e.tu_khoa,
      category: e.category,
      cta: e.cta,
      faq: e.faq,
      nguon_tham_khao: e.nguon_tham_khao,
      noi_dung_md: e.noi_dung_md,
      kiem_duyet: e.kiem_duyet,
      trang_thai: e.trang_thai,
    })
    const idx = baiVietList.value.findIndex((x) => x.id === e.id)
    if (idx >= 0) baiVietList.value[idx] = res.data
    flash('ok', 'Đã lưu.')
    editing.value = null
  } catch (err: any) {
    flash('err', err.message || 'Lưu thất bại')
  } finally {
    savingEditor.value = false
  }
}

async function deleteBaiViet(a: BaiViet) {
  if (!confirm(`Xoá nháp "${a.tieu_de}"?`)) return
  try {
    await api.delete(`/seo/bai-viet/${a.id}`)
    baiVietList.value = baiVietList.value.filter((x) => x.id !== a.id)
    if (editing.value?.id === a.id) editing.value = null
  } catch (e: any) {
    flash('err', e.message || 'Xoá thất bại')
  }
}

async function exportMd(a: BaiViet) {
  exportingId.value = a.id
  try {
    const res = await api.get<{ data: { filename: string; content: string } }>(`/seo/bai-viet/${a.id}/export`)
    const blob = new Blob([res.data.content], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = res.data.filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    flash(
      'ok',
      `Đã tải ${res.data.filename}. Đăng bài: node frontend/scripts/publish-article.mjs --from <file> rồi npm run build-blog. (Bài chưa "Đã duyệt" sẽ là noindex/chờ duyệt.)`,
    )
  } catch (e: any) {
    flash('err', e.message || 'Xuất .md thất bại')
  } finally {
    exportingId.value = null
  }
}

async function publishArticle(a: BaiViet) {
  if (a.trang_thai !== 'da_duyet' && a.trang_thai !== 'da_dang') {
    flash('err', 'Đổi trạng thái sang "Đã duyệt" rồi mới Đăng được (van an toàn).')
    return
  }
  if (
    !confirm(
      `Đăng bài "${a.tieu_de}"?\n\nSẽ ghi file vào frontend/content/blog/ trên máy này. Để lên web kinhlac.online bạn vẫn cần build + deploy lại.`,
    )
  )
    return
  publishingId.value = a.id
  startPubProgress(a)
  try {
    const res = await api.post<{ data: { slug: string; wrote: boolean; note: string } }>(
      `/seo/bai-viet/${a.id}/publish`,
      {},
    )
    const idx = baiVietList.value.findIndex((x) => x.id === a.id)
    const cur = baiVietList.value[idx]
    if (cur) baiVietList.value[idx] = { ...cur, trang_thai: 'da_dang', slug: res.data.slug }
    if (editing.value && editing.value.id === a.id) editing.value = { ...editing.value, trang_thai: 'da_dang', slug: res.data.slug }
    finishPubProgress(true, { slug: res.data.slug, note: res.data.note, wrote: res.data.wrote })
  } catch (e: any) {
    finishPubProgress(false, { error: e.message || 'Đăng thất bại' })
  } finally {
    publishingId.value = null
  }
}

// ===== Sinh ảnh minh hoạ AI cho từng mục H2 (on-demand — vẽ TUẦN TỰ, có tiến trình thật) =====
const imgProg = ref<{
  on: boolean
  done: number
  total: number
  stage: string
  secImg: number
  secTotal: number
  pct: number
  status: 'running' | 'done' | 'error'
  errMsg: string
}>({ on: false, done: 0, total: 0, stage: '', secImg: 0, secTotal: 0, pct: 0, status: 'running', errMsg: '' })

// Tiến trình vẽ ẢNH BÌA (1 ảnh) — % thật từ gpt-image-2 qua poll /img-progress.
const coverProg = ref<{
  on: boolean
  pct: number
  stage: string
  status: 'running' | 'done' | 'error'
  errMsg: string
}>({ on: false, pct: 0, stage: '', status: 'running', errMsg: '' })

// Đồng hồ chạy THẬT trong lúc vẽ (mỗi ảnh ~90–150s → cần nhịp đập để không tưởng bị treo).
const EST_PER_IMG = 120 // giây/ảnh ước lượng (CHỈ dùng khi chưa có % thật từ task)
let imgTimer: ReturnType<typeof setInterval> | null = null
let imgPollTimer: ReturnType<typeof setInterval> | null = null // poll % THẬT từ gpt-image-2
let imgRealPct = -1 // % thật của ẢNH hiện tại (-1 = chưa có → dùng ước lượng theo giờ)
let imgT0 = 0 // mốc bắt đầu cả mẻ
let imgImgT0 = 0 // mốc bắt đầu ảnh hiện tại
function imgTick() {
  const now = Date.now()
  const secImg = Math.round((now - imgImgT0) / 1000)
  const secTotal = Math.round((now - imgT0) / 1000)
  // Ưu tiên % THẬT của model (gpt-image-2); chưa có thì ước lượng theo thời gian trôi.
  const within =
    imgRealPct >= 0 ? Math.min(0.99, imgRealPct / 100) : Math.min(0.95, secImg / EST_PER_IMG)
  const total = imgProg.value.total || 1
  const pct = Math.min(99, Math.round(((imgProg.value.done + within) / total) * 100))
  imgProg.value = { ...imgProg.value, secImg, secTotal, pct }
}

// Đếm số mục ## (H2) chưa có ảnh ngay dưới — để biết sẽ vẽ bao nhiêu ảnh.
function countPendingH2(md: string): number {
  const lines = (md || '').split('\n')
  let n = 0
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i] || '') && !/^!\[/.test((lines[i + 1] || '').trim())) n++
  }
  return n
}

async function generateImages(a: BaiViet) {
  const md = editing.value?.id === a.id ? editing.value.noi_dung_md : a.noi_dung_md
  const total = Math.min(countPendingH2(md), 6)
  if (!total) {
    flash('err', 'Không có mục ## (H2) nào chưa có ảnh để vẽ. (FAQ & mở bài không tính.)')
    return
  }
  if (
    !confirm(
      `Sinh ${total} ảnh minh hoạ (AI) cho bài "${a.tieu_de}"?\n\n` +
        `• Mỗi mục lớn (## H2) 1 ảnh, lưu vào thư mục blog-images/ (cấu hình BLOG_IMAGES_DIR ở backend).\n` +
        `• Dùng model ảnh cấu hình ở backend (hiện tại: gpt-image-2 qua Yescale — TRẢ PHÍ).\n` +
        `• Mỗi ảnh ~30–120 giây. Có thanh tiến trình % thật — cứ để chạy, đừng đóng tab.`,
    )
  )
    return
  genImagesId.value = a.id
  imgT0 = Date.now()
  imgImgT0 = Date.now()
  imgProg.value = { on: true, done: 0, total, stage: `Đang vẽ ảnh 1/${total}…`, secImg: 0, secTotal: 0, pct: 0, status: 'running', errMsg: '' }
  if (imgTimer) clearInterval(imgTimer)
  imgTimer = setInterval(imgTick, 1000)
  // Poll % THẬT từ backend (khi đang vẽ bằng gpt-image-2) → bar nhảy theo model, không chỉ theo giờ.
  imgRealPct = -1
  if (imgPollTimer) clearInterval(imgPollTimer)
  imgPollTimer = setInterval(() => {
    void api
      .get<{ data: { pct: number; stage: string } | null }>(
        `/seo/bai-viet/${a.id}/img-progress?kind=body`,
      )
      .then((r) => {
        // pct>1 = task gpt-image-2 đang báo % THẬT → dùng; còn lại (vd dall-e-3) để -1 → ước lượng theo giờ.
        const real = r.data && typeof r.data.pct === 'number' ? r.data.pct : -1
        imgRealPct = real > 1 ? real : -1
      })
      .catch(() => {})
  }, 2000)
  try {
    for (let k = 0; k < total; k++) {
      // Tự thử lại 1 lần nếu lỗi (Yescale dall-e hay chập chờn 503).
      let res: { data: { bai: BaiViet; heading: string | null; remaining: number } } | null = null
      let lastErr: any = null
      for (let attempt = 1; attempt <= 2 && !res; attempt++) {
        imgImgT0 = Date.now()
        imgRealPct = -1 // ảnh mới → chờ % thật của ảnh này (đừng dùng % ảnh trước)
        imgProg.value = {
          ...imgProg.value,
          secImg: 0,
          stage: attempt === 1 ? `Đang vẽ ảnh ${k + 1}/${total}…` : `Thử lại ảnh ${k + 1}/${total}…`,
        }
        try {
          res = await api.post<{ data: { bai: BaiViet; heading: string | null; remaining: number } }>(
            `/seo/bai-viet/${a.id}/generate-image`,
            {},
          )
        } catch (e) {
          lastErr = e
        }
      }
      if (!res) throw lastErr // cả 2 lần đều lỗi → dừng & hiện lỗi rõ
      const { bai, heading, remaining } = res.data
      const idx = baiVietList.value.findIndex((x) => x.id === a.id)
      if (idx >= 0) baiVietList.value[idx] = bai
      if (editing.value?.id === a.id) editing.value = { ...editing.value, noi_dung_md: bai.noi_dung_md }
      imgProg.value = { ...imgProg.value, done: k + 1, stage: heading ? `✅ Xong ảnh ${k + 1}/${total}` : 'Hoàn tất' }
      if (!heading || remaining <= 0) break
    }
    imgProg.value = {
      ...imgProg.value,
      status: 'done',
      pct: 100,
      stage: `✅ Hoàn tất ${imgProg.value.done}/${imgProg.value.total} ảnh`,
    }
    flash('ok', `Đã chèn ${imgProg.value.done} ảnh. Giờ bấm Lưu rồi Đăng.`)
  } catch (e: any) {
    const msg = String(e?.message || e || 'Lỗi không rõ').slice(0, 220)
    imgProg.value = {
      ...imgProg.value,
      status: 'error',
      stage: `⚠️ Dừng ở ảnh ${imgProg.value.done + 1}/${imgProg.value.total} vì lỗi`,
      errMsg: msg,
    }
    flash('err', msg)
  } finally {
    genImagesId.value = null
    if (imgTimer) {
      clearInterval(imgTimer)
      imgTimer = null
    }
    if (imgPollTimer) {
      clearInterval(imgPollTimer)
      imgPollTimer = null
    }
    // 'done' → ẩn sau 12s; 'error' → giữ lâu (45s) để đọc kỹ lỗi; cả hai chỉ ẩn nếu không có mẻ mới.
    const keep = imgProg.value.status === 'error' ? 45000 : 12000
    setTimeout(() => {
      if (genImagesId.value === null) imgProg.value = { ...imgProg.value, on: false }
    }, keep)
  }
}

// ===== Sinh ẢNH BÌA AI riêng cho cả bài (banner ngang khớp chủ đề) =====
async function generateCover(a: BaiViet) {
  if (
    !confirm(
      `Vẽ ẢNH BÌA AI riêng cho bài "${a.tieu_de}"?\n\n` +
        `• AI vẽ 1 ảnh bìa banner khớp chủ đề cả bài, lưu vào frontend/public/blog-images/${a.slug || '<slug>'}/cover.\n` +
        `• Dùng model ảnh ở backend (hiện tại: gpt-image-2 qua Yescale — TRẢ PHÍ, ~30–120 giây).\n` +
        `• Sau khi vẽ xong, bấm Lưu rồi Đăng lại để ảnh bìa mới lên web.`,
    )
  )
    return
  genCoverId.value = a.id
  coverProg.value = { on: true, pct: 0, stage: 'Bắt đầu…', status: 'running', errMsg: '' }
  const t0 = Date.now()
  // Poll % THẬT trong lúc chờ; chưa có data thì ước lượng theo thời gian (~90s). Bar chỉ tiến, không lùi.
  let coverPoll: ReturnType<typeof setInterval> | null = setInterval(() => {
    void api
      .get<{ data: { pct: number; stage: string } | null }>(
        `/seo/bai-viet/${a.id}/img-progress?kind=cover`,
      )
      .then((r) => {
        if (coverProg.value.status !== 'running') return
        const real = r.data && typeof r.data.pct === 'number' ? r.data.pct : -1
        const sec = (Date.now() - t0) / 1000
        const est = Math.min(95, Math.round((sec / 90) * 100)) // ước lượng ~90s
        // pct>1 = task gpt-image-2 báo % THẬT → ưu tiên; còn lại (vd dall-e-3) dùng ước lượng.
        const next = real > 1 ? real : est
        coverProg.value = {
          ...coverProg.value,
          pct: Math.max(coverProg.value.pct, next),
          stage: real > 1 && r.data ? r.data.stage : coverProg.value.stage,
        }
      })
      .catch(() => {})
  }, 2000)
  try {
    const res = await api.post<{ data: { bai: BaiViet; image: string } }>(
      `/seo/bai-viet/${a.id}/generate-cover`,
      {},
    )
    // Gắn ?t= để trình duyệt nạp lại ảnh mới (không dính cache bản cũ cùng tên).
    customCover.value = `${res.data.image}?t=${Date.now()}`
    coverProg.value = { on: true, pct: 100, stage: '✅ Xong', status: 'done', errMsg: '' }
    flash('ok', 'Đã vẽ ảnh bìa AI. Giờ bấm Lưu rồi Đăng lại để áp dụng lên web.')
  } catch (e: any) {
    const msg = String(e?.message || e || 'Vẽ ảnh bìa thất bại').slice(0, 300)
    coverProg.value = { ...coverProg.value, status: 'error', stage: '⚠️ Lỗi', errMsg: msg }
    flash('err', msg.slice(0, 220))
  } finally {
    if (coverPoll) {
      clearInterval(coverPoll)
      coverPoll = null
    }
    genCoverId.value = null
    // 'done' ẩn sau 6s; 'error' giữ 20s để đọc; chỉ ẩn nếu không có lượt vẽ mới.
    const keep = coverProg.value.status === 'error' ? 20000 : 6000
    setTimeout(() => {
      if (genCoverId.value === null) coverProg.value = { ...coverProg.value, on: false }
    }, keep)
  }
}

async function viewArticle(a: { slug: string | null }) {
  const slug = (a.slug || '').trim()
  if (!slug) {
    flash('err', 'Bài chưa có slug để xem.')
    return
  }
  const url = `/blog/${slug}/`
  // Mở tab TRƯỚC trong cử chỉ click (tránh trình duyệt chặn popup sau await).
  const win = window.open('about:blank', '_blank')
  try {
    // Trang blog tĩnh thật có class "bl-article". Nếu nginx trả về vỏ SPA (fallback)
    // = bài CHƯA build/deploy → đừng quăng người dùng về trang chủ, báo cho rõ.
    const r = await fetch(url, { headers: { Accept: 'text/html' }, cache: 'no-store' })
    const html = r.ok ? await r.text() : ''
    if (/bl-article/.test(html)) {
      if (win) win.location.href = url
      else window.location.href = url
    } else {
      if (win) win.close()
      flash('info', 'Bài chưa có trên web (chưa build/deploy). Sau khi deploy lại, nút Xem sẽ mở đúng bài.')
    }
  } catch {
    if (win) win.close()
    flash('err', 'Không mở được bài — có thể bài chưa được build/deploy lên web.')
  }
}

async function discoverTrends() {
  discovering.value = true
  flash('info', 'Đang lấy gợi ý tìm kiếm thật từ Google…')
  try {
    const seeds = trendSeeds.value
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .join(',')
    const qs = seeds ? `?seeds=${encodeURIComponent(seeds)}` : ''
    const res = await api.get<{ data: { keyword: string }[] }>(`/seo/trends/discover${qs}`)
    trendCandidates.value = res.data.map((d) => d.keyword)
    trendSelected.value = new Set()
    flash('ok', `Tìm thấy ${trendCandidates.value.length} chủ đề ứng viên (đã bỏ bài đã viết).`)
  } catch (e: any) {
    flash('err', e.message || 'Quét xu hướng thất bại')
  } finally {
    discovering.value = false
  }
}

function toggleCand(k: string) {
  const s = new Set(trendSelected.value)
  if (s.has(k)) s.delete(k)
  else s.add(k)
  trendSelected.value = s
}

async function runTrendDrafts() {
  // Chỉ gửi tối đa TREND_MAX chủ đề/lần (khớp backend) để tránh nginx cắt request giữa chừng.
  const kws = [...trendSelected.value].slice(0, TREND_MAX)
  if (!kws.length) {
    flash('err', 'Chọn ít nhất 1 chủ đề.')
    return
  }
  runningTrend.value = true
  flash('info', `AI đang viết ${kws.length} nháp từ xu hướng (mỗi bài ~30s)…`)
  try {
    const res = await api.post<{ data: BaiViet[] }>('/seo/trends/run', { keywords: kws })
    flash('ok', `Đã tạo ${res.data.length} nháp. Mở tab "Lò Viết Bài" để duyệt.`)
    // CHỈ gỡ những chủ đề đã thực sự gửi đi (không gỡ phần dư chưa viết).
    const done = new Set(kws)
    trendCandidates.value = trendCandidates.value.filter((k) => !done.has(k))
    trendSelected.value = new Set([...trendSelected.value].filter((k) => !done.has(k)))
    await loadBaiViet()
    tab.value = 'viet'
  } catch (e: any) {
    flash('err', e.message || 'Viết nháp xu hướng thất bại')
  } finally {
    runningTrend.value = false
  }
}

// ===========================================================================
// GOOGLE SEARCH CONSOLE (tab GSC) — dữ liệu THẬT từ Google
// ===========================================================================
interface GscSite {
  siteUrl: string
  permissionLevel: string
}
interface GscStatus {
  connected: boolean
  reason?: string
  mode?: 'oauth' | 'service_account'
  account?: string
  siteUrl?: string
  hasAccess?: boolean
  permissionLevel?: string | null
  sites?: GscSite[]
}
interface GscPerfRow {
  key: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}
interface GscSummary {
  range: { startDate: string; endDate: string }
  totals: { clicks: number; impressions: number; ctr: number; position: number }
  byDate: { date: string; clicks: number; impressions: number; position: number }[]
}
interface GscCannibal {
  query: string
  clicks: number
  impressions: number
  soTrang: number
  pages: GscPerfRow[]
}
interface GscSitemap {
  path: string
  lastSubmitted: string | null
  lastDownloaded: string | null
  isPending: boolean
  isSitemapsIndex: boolean
  warnings: number
  errors: number
  contents: { type: string; submitted: number; indexed: number }[]
}

interface GscStriking { query: string; page: string; clicks: number; impressions: number; ctr: number; position: number; coHoi: number }
const gscStatus = ref<GscStatus | null>(null)
const gscChecking = ref(false)
const gscDays = ref(28)
const gscLoading = ref(false)
const gscLoaded = ref(false)
const gscSummary = ref<GscSummary | null>(null)
const gscQueries = ref<GscPerfRow[]>([])
const gscPages = ref<GscPerfRow[]>([])
const gscCannibal = ref<GscCannibal[]>([])
const gscStriking = ref<GscStriking[]>([]) // "Sắp lên top" — cơ hội vàng (vòng tự sửa)
const gscSitemaps = ref<GscSitemap[]>([])
const gscMetric = ref<'clicks' | 'impressions'>('clicks') // chỉ số vẽ biểu đồ
const newSitemap = ref('https://kinhlac.online/sitemap.xml')
const submittingSitemap = ref(false)
const inspectUrlInput = ref('https://kinhlac.online/')
const inspecting = ref(false)
const inspectResult = ref<Record<string, any> | null>(null)

// Đã kết nối VÀ có quyền trên đúng property → mới hiện dữ liệu.
const gscConnected = computed(() => !!gscStatus.value?.connected && !!gscStatus.value?.hasAccess)
// Cột cao nhất để chuẩn hoá chiều cao biểu đồ.
const gscChartMax = computed(() => {
  const rows = gscSummary.value?.byDate || []
  const vals = rows.map((d) => (gscMetric.value === 'clicks' ? d.clicks : d.impressions))
  return Math.max(1, ...vals)
})

function fmtNum(n: number | undefined): string {
  return (n ?? 0).toLocaleString('vi-VN')
}
function fmtPct(ctr: number | undefined): string {
  return ((ctr ?? 0) * 100).toFixed(1) + '%'
}
function fmtPos(p: number | undefined): string {
  return (p ?? 0).toFixed(1)
}
function barHeight(d: { clicks: number; impressions: number }): string {
  const v = gscMetric.value === 'clicks' ? d.clicks : d.impressions
  return Math.max(2, (v / gscChartMax.value) * 100) + '%'
}

async function checkGscStatus() {
  gscChecking.value = true
  try {
    const res = await api.get<{ success: boolean; data: GscStatus }>('/seo/gsc/status')
    gscStatus.value = res.data
    if (gscConnected.value && !gscLoaded.value) await loadGscData()
  } catch (e: any) {
    gscStatus.value = { connected: false, reason: e.message || 'Không gọi được API (backend tắt?)' }
  } finally {
    gscChecking.value = false
  }
}

async function loadGscData() {
  if (!gscConnected.value) return
  gscLoading.value = true
  const d = gscDays.value
  try {
    const [sum, q, p, c, sm] = await Promise.all([
      api.get<{ data: GscSummary }>(`/seo/gsc/summary?days=${d}`),
      api.get<{ data: GscPerfRow[] }>(`/seo/gsc/top-queries?days=${d}&limit=50`),
      api.get<{ data: GscPerfRow[] }>(`/seo/gsc/top-pages?days=${d}&limit=50`),
      api.get<{ data: GscCannibal[] }>(`/seo/gsc/cannibalization?days=${d}`),
      api.get<{ data: GscSitemap[] }>(`/seo/gsc/sitemaps`),
    ])
    gscSummary.value = sum.data
    gscQueries.value = q.data
    gscPages.value = p.data
    gscCannibal.value = c.data
    gscSitemaps.value = sm.data
    // "Sắp lên top" tách riêng để nếu backend chưa có endpoint cũng KHÔNG vỡ phần còn lại.
    gscStriking.value = await api
      .get<{ data: GscStriking[] }>(`/seo/gsc/striking-distance?days=${d}`)
      .then((r) => r.data)
      .catch(() => [])
    gscLoaded.value = true
  } catch (e: any) {
    flash('err', e.message || 'Tải dữ liệu GSC thất bại')
  } finally {
    gscLoading.value = false
  }
}

// "Tai → tay": đưa 1 từ khoá "sắp lên top" sang Lò Viết Bài cho AI viết bài nhắm vào nó (đóng vòng tự sửa).
function vietTuKhoa(query: string) {
  freeChuDe.value = query
  tab.value = 'viet'
  flash('info', `Đã đưa "${query}" sang Lò Viết Bài — bấm "Sinh Nháp" để AI viết bài nhắm từ khoá sắp lên top này.`)
}

async function submitNewSitemap() {
  if (!newSitemap.value.trim()) return
  submittingSitemap.value = true
  try {
    await api.post('/seo/gsc/sitemaps', { feedpath: newSitemap.value.trim() })
    flash('ok', 'Đã gửi sitemap cho Google.')
    const sm = await api.get<{ data: GscSitemap[] }>(`/seo/gsc/sitemaps`)
    gscSitemaps.value = sm.data
  } catch (e: any) {
    flash('err', e.message || 'Gửi sitemap thất bại')
  } finally {
    submittingSitemap.value = false
  }
}

async function runInspect() {
  if (!inspectUrlInput.value.trim()) return
  inspecting.value = true
  inspectResult.value = null
  try {
    const res = await api.post<{ data: Record<string, any> }>('/seo/gsc/inspect', {
      url: inspectUrlInput.value.trim(),
    })
    inspectResult.value = res.data
  } catch (e: any) {
    flash('err', e.message || 'Kiểm tra URL thất bại')
  } finally {
    inspecting.value = false
  }
}

// Vào tab GSC lần đầu → tự kiểm tra kết nối (lazy).
watch(tab, (t) => {
  if (t === 'gsc' && !gscStatus.value) checkGscStatus()
})

// ESC = đóng nhanh overlay đang mở (chuẩn a11y). Ưu tiên overlay "Đăng" trước editor.
function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (pubModal.value) {
    if (pubDone.value || pubError.value) closePubModal()
    return
  }
  if (editing.value) closeEditor()
}

onMounted(() => {
  loadDoiThu()
  loadCum()
  loadBaiViet()
  loadAcuIndex()
  window.addEventListener('keydown', onGlobalKeydown)
})
onUnmounted(() => window.removeEventListener('keydown', onGlobalKeydown))
</script>

<template>
  <div class="seo-radar">
    <!-- Giới thiệu -->
    <div class="intro">
      <h2 class="intro-title">🛰️ Radar Đối Thủ SEO</h2>
      <p class="intro-sub">
        Thêm domain đối thủ → <strong>Quét Sitemap</strong> để gom bài blog → <strong>Phân Tích</strong> bằng AI
        (Chủ đề / Từ khoá / Tóm tắt) → <strong>Tìm Khoảng Trống</strong> để biết bạn nên viết gì. Tất cả chạy bằng
        AI của chính bạn, không cần n8n hay Google Sheet.
      </p>
    </div>

    <!-- Banner thông báo -->
    <Transition name="fade">
      <div v-if="message" class="banner" :class="`banner--${message.kind}`">
        <span>{{ message.text }}</span>
        <button class="banner-x" @click="message = null" aria-label="Đóng">×</button>
      </div>
    </Transition>

    <!-- Thanh chuyển tab -->
    <div class="tabbar" role="tablist" aria-label="Khu vực SEO">
      <button type="button" role="tab" :aria-selected="tab === 'radar'" class="tab" :class="{ on: tab === 'radar' }" @click="tab = 'radar'">🛰️ Radar Đối Thủ</button>
      <button type="button" role="tab" :aria-selected="tab === 'viet'" class="tab" :class="{ on: tab === 'viet' }" @click="tab = 'viet'">✍️ Lò Viết Bài</button>
      <button type="button" role="tab" :aria-selected="tab === 'trend'" class="tab" :class="{ on: tab === 'trend' }" @click="tab = 'trend'">📈 Xu Hướng</button>
      <button type="button" role="tab" :aria-selected="tab === 'gsc'" class="tab" :class="{ on: tab === 'gsc' }" @click="tab = 'gsc'">🔍 Search Console</button>
    </div>

    <!-- ===== TAB RADAR ===== -->
    <div v-show="tab === 'radar'" class="tabwrap">
    <!-- Bước 1: thêm đối thủ -->
    <section class="card">
      <div class="card-head">
        <h3>1 · Thêm đối thủ (hoặc site của bạn)</h3>
      </div>
      <div class="add-form">
        <input
          v-model="form.domain"
          class="inp inp--domain"
          placeholder="dokinhlac.com.vn"
          @keyup.enter="addDoiThu"
        />
        <input v-model="form.ten" class="inp inp--ten" placeholder="Tên gợi nhớ (tuỳ chọn)" @keyup.enter="addDoiThu" />
        <label class="chk" title="Đánh dấu nếu đây là website của chính bạn (để làm mốc so sánh)">
          <input type="checkbox" v-model="form.la_cua_minh" />
          <span>Đây là site của tôi</span>
        </label>
        <button class="btn btn--primary" :disabled="adding" @click="addDoiThu">
          {{ adding ? 'Đang thêm…' : '+ Thêm' }}
        </button>
      </div>
    </section>

    <!-- Bước 2: danh sách đối thủ -->
    <section class="card">
      <div class="card-head">
        <h3>2 · Danh sách & quét</h3>
        <label class="batch-limit">
          Mỗi lần phân tích:
          <input
            type="number"
            v-model.number="batchLimit"
            class="inp inp--sm inp--num"
            min="1"
            max="30"
            title="Số URL đang chờ sẽ phân tích trong 1 lần bấm (1–30). Số càng lớn càng lâu & dễ bị quá thời gian."
          />
          bài
        </label>
      </div>
      <p class="muted step-hint">
        Quy trình: <b>Quét Sitemap</b> (gom URL) → <b>Phân Tích</b> (AI đọc tối đa <b>{{ batchLimit }}</b> bài đang chờ
        mỗi lần; còn bài chờ thì chỉnh số &amp; bấm lại để chạy tiếp) → khi đã có đối thủ được phân tích, xuống
        <b>bước 3</b> để tìm khoảng trống.
      </p>

      <p v-if="loadingList" class="muted">Đang tải…</p>
      <p v-else-if="!doiThuList.length" class="muted">Chưa có đối thủ nào. Thêm ở bước 1 phía trên.</p>

      <div v-else class="doithu-grid">
        <div
          v-for="d in doiThuList"
          :key="d.id"
          class="doithu"
          :class="{ active: selectedDoiThuId === d.id, mine: d.la_cua_minh }"
        >
          <div class="doithu-top">
            <div class="doithu-name">
              <span class="badge" :class="d.la_cua_minh ? 'badge--mine' : 'badge--comp'">
                {{ d.la_cua_minh ? 'Của tôi' : 'Đối thủ' }}
              </span>
              <a :href="`https://${d.domain}`" target="_blank" rel="noopener" class="doithu-domain">{{ d.domain }}</a>
            </div>
            <button class="icon-btn" :disabled="isBusy(d.id)" title="Xoá" @click="removeDoiThu(d)">🗑</button>
          </div>
          <div v-if="d.ten" class="doithu-ten">{{ d.ten }}</div>

          <div class="stats">
            <span class="stat">Tổng <b>{{ d.thong_ke.tong }}</b></span>
            <span class="stat stat--cho">Chờ <b>{{ d.thong_ke.cho }}</b></span>
            <span class="stat stat--ok">Đã PT <b>{{ d.thong_ke.da_phan_tich }}</b></span>
            <span
              v-if="d.thong_ke.ngoai_nganh"
              class="stat stat--skip"
              title="Bài KHÔNG thuộc ngách Đông Y/kinh lạc — đã bỏ qua để khỏi tốn AI"
            >Ngoài ngành <b>{{ d.thong_ke.ngoai_nganh }}</b></span>
            <span v-if="d.thong_ke.loi" class="stat stat--err">Lỗi <b>{{ d.thong_ke.loi }}</b></span>
          </div>

          <div class="doithu-actions">
            <button class="btn btn--sm" :disabled="isBusy(d.id)" @click="crawl(d)">
              {{ isBusy(d.id) ? '…' : 'Quét Sitemap' }}
            </button>
            <button
              class="btn btn--sm btn--accent"
              :disabled="isBusy(d.id) || d.thong_ke.cho === 0"
              :title="`Phân tích ${Math.min(batchLimit, d.thong_ke.cho)} trong ${d.thong_ke.cho} bài đang chờ. Bấm lại để chạy tiếp số còn lại.`"
              @click="analyzeBatch(d)"
            >
              {{ isBusy(d.id) ? '…' : `Phân Tích ${Math.min(batchLimit, d.thong_ke.cho)}/${d.thong_ke.cho}` }}
            </button>
            <button class="btn btn--sm btn--ghost" :disabled="isBusy(d.id)" @click="loadUrls(d.id)">Xem URL</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Bảng URL của đối thủ đang chọn -->
    <section v-if="selectedDoiThu" class="card">
      <div class="card-head">
        <h3>URL của «{{ selectedDoiThu.domain }}»</h3>
        <div class="filters">
          <button
            v-for="f in (['all', 'cho', 'da_phan_tich', 'ngoai_nganh', 'loi'] as const)"
            :key="f"
            class="chip-btn"
            :class="{ on: urlFilter === f }"
            @click="urlFilter = f"
          >
            {{ f === 'all' ? 'Tất cả' : TRANG_THAI_LABEL[f] }}
          </button>
        </div>
      </div>

      <p v-if="loadingUrls" class="muted">Đang tải URL…</p>
      <p v-else-if="!filteredUrls.length" class="muted">Không có URL nào trong bộ lọc này.</p>

      <div v-else class="table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th class="col-url">URL</th>
              <th class="col-st">Trạng thái</th>
              <th>Chủ đề</th>
              <th>Từ khoá</th>
              <th class="col-act"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filteredUrls" :key="u.id">
              <td class="col-url">
                <a :href="u.url" target="_blank" rel="noopener" :title="u.url">{{ shortUrl(u.url) }}</a>
              </td>
              <td class="col-st">
                <span class="badge" :class="`st--${u.trang_thai}`">{{ TRANG_THAI_LABEL[u.trang_thai] }}</span>
              </td>
              <td>
                <span v-if="u.chu_de" :title="u.tom_tat || ''">{{ u.chu_de }}</span>
                <span v-else-if="u.trang_thai === 'loi'" class="err-text" :title="u.loi || ''">{{ u.loi }}</span>
                <span v-else-if="u.trang_thai === 'ngoai_nganh'" class="muted" :title="u.loi || ''">Ngoài ngách Đông Y — đã bỏ qua</span>
                <span v-else class="muted">—</span>
              </td>
              <td>
                <span v-if="u.tu_khoa" class="kw">{{ u.tu_khoa }}</span>
                <span v-else class="muted">—</span>
              </td>
              <td class="col-act">
                <button
                  class="btn btn--xs"
                  :disabled="isBusy(u.id)"
                  :title="u.trang_thai === 'ngoai_nganh' ? 'Ép phân tích dù trông ngoài ngách' : ''"
                  @click="analyzeOne(u)"
                >
                  {{ isBusy(u.id) ? '…' : u.trang_thai === 'da_phan_tich' ? 'Lại' : u.trang_thai === 'ngoai_nganh' ? 'Ép PT' : 'Phân tích' }}
                </button>
                <button class="icon-btn" :disabled="isBusy(u.id)" title="Xoá URL" @click="removeUrl(u)">×</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Bước 3: gap analysis — mỗi đối thủ một nhóm khoảng trống riêng -->
    <section class="card">
      <div class="card-head">
        <h3>3 · Khoảng trống nội dung — bạn nên viết gì</h3>
      </div>

      <p v-if="!analyzedCompetitors.length" class="muted">
        Cần ít nhất 1 đối thủ đã được phân tích (bước 2) thì mới tìm khoảng trống được.
      </p>

      <template v-else>
        <p class="muted step-hint">
          Mỗi đối thủ một thanh — <b>bấm vào tên đối thủ để mở/đóng</b> danh sách (mỗi lúc mở 1 cái cho gọn).
          Bấm <b>🔍 Tìm Khoảng Trống</b> để AI gợi ý cụm; bấm <b>✍️ Viết</b> ở từng cụm để đẩy sang Lò Viết Bài.
        </p>

        <div class="gap-groups">
          <div
            v-for="d in analyzedCompetitors"
            :key="d.id"
            class="gap-group"
            :class="{ 'gap-group--open': openGroupId === d.id }"
          >
            <div class="gap-group-head">
              <button
                type="button"
                class="gap-group-toggle"
                :aria-expanded="openGroupId === d.id"
                @click="toggleGroup(d.id)"
              >
                <span class="gap-chevron" aria-hidden="true">▸</span>
                <span class="badge badge--comp">Đối thủ</span>
                <span class="gap-group-domain">{{ d.domain }}</span>
                <span class="muted gap-group-count">· {{ gapsFor(d.id).length }} cụm</span>
              </button>
              <button class="btn btn--sm btn--accent" :disabled="gapBusyId !== null" @click="runGapFor(d)">
                {{ gapBusyId === d.id ? 'Đang tìm…' : gapsFor(d.id).length ? '🔄 Làm lại' : '🔍 Tìm Khoảng Trống' }}
              </button>
            </div>

            <div v-show="openGroupId === d.id" class="gap-group-body">
              <div v-if="gapsFor(d.id).length" class="table-wrap">
                <table class="tbl tbl--gap">
                  <thead>
                    <tr>
                      <th class="col-score" title="Điểm ưu tiên 1–15">Điểm</th>
                      <th>Cụm chủ đề</th>
                      <th>Từ khoá mục tiêu</th>
                      <th>Ý tưởng nội dung</th>
                      <th class="col-act"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="c in gapsFor(d.id)" :key="c.id">
                      <td class="col-score"><span class="cum-score cum-score--sm">{{ c.diem_uu_tien }}</span></td>
                      <td>
                        <strong :title="c.ten_cum">{{ c.ten_cum }}</strong>
                        <div v-if="c.ly_do" class="gap-why" :title="c.ly_do">{{ c.ly_do }}</div>
                      </td>
                      <td class="kw">{{ c.tu_khoa_muc_tieu || '—' }}</td>
                      <td class="gap-idea" :title="c.y_tuong_noi_dung || ''">{{ c.y_tuong_noi_dung || '—' }}</td>
                      <td class="col-act">
                        <button
                          class="btn btn--xs"
                          :disabled="genBusy !== null"
                          title="Viết nháp từ cụm này (chuyển sang Lò Viết Bài)"
                          @click="writeFromGap(c)"
                        >
                          {{ genBusy === c.id ? '…' : '✍️ Viết' }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="muted gap-empty">
                Chưa có gợi ý. Bấm “🔍 Tìm Khoảng Trống” cho đối thủ này.
              </p>
            </div>
          </div>
        </div>
      </template>
    </section>
    </div>
    <!-- /TAB RADAR -->

    <!-- ===== TAB LÒ VIẾT BÀI ===== -->
    <div v-show="tab === 'viet'" class="tabwrap">
      <!-- Tiến trình khi AI đang viết nháp (ước lượng theo thời gian) -->
      <div v-if="genBusy !== null" class="gen-prog" role="status" aria-live="polite">
        <div class="gen-prog-head">
          <span class="gen-spin" aria-hidden="true"></span>
          <span class="gen-prog-stage">{{ genStage }}</span>
          <span class="gen-prog-pct">{{ genProgress }}%</span>
        </div>
        <div class="gen-bar"><div class="gen-bar-fill" :style="{ width: genProgress + '%' }"></div></div>
        <p class="gen-prog-note">
          AI đang viết &amp; rà soát bài (~30–60 giây). Đừng đóng tab. % là ước lượng theo thời gian, không phải tiến độ thật.
        </p>
      </div>

      <!-- Viết từ cụm gợi ý -->
      <section class="card">
        <div class="card-head">
          <h3>Viết bài từ cụm gợi ý ({{ goiYCums.length }})</h3>
          <button
            class="btn btn--sm btn--accent"
            :disabled="seedingDatTrong"
            title="Bơm sẵn các thực thể Đông Y giá trị cao (huyệt, kinh, bệnh, bài thuốc) mà đối thủ Tây Y bỏ ngỏ — không cần đối thủ"
            @click="goiYDatTrong"
          >
            {{ seedingDatTrong ? 'Đang bơm…' : '🌱 Gợi Ý Đất Trống' }}
          </button>
        </div>
        <p v-if="!goiYCums.length" class="muted">
          Chưa có cụm nào. Bấm <b>🌱 Gợi Ý Đất Trống</b> để bơm sẵn các thực thể Đông Y nên viết trước,
          hoặc sang tab <b>Radar Đối Thủ</b> (bước 3) bấm "Tìm Khoảng Trống" cho 1 đối thủ.
        </p>
        <div v-else class="cum-grid">
          <div v-for="c in goiYCums" :key="c.id" class="cum">
            <div class="cum-top">
              <span class="cum-score">{{ c.diem_uu_tien }}</span>
              <h4 class="cum-name">{{ c.ten_cum }}</h4>
            </div>
            <div v-if="c.doi_thu_id && domainById[c.doi_thu_id]" class="cum-kw"><b>Đối thủ:</b> {{ domainById[c.doi_thu_id] }}</div>
            <div v-else-if="c.ly_do" class="cum-kw cum-kw--seed" :title="c.ly_do">{{ c.ly_do }}</div>
            <div v-if="c.tu_khoa_muc_tieu" class="cum-kw"><b>Từ khoá:</b> {{ c.tu_khoa_muc_tieu }}</div>
            <button class="btn btn--accent btn--sm" :disabled="genBusy !== null" @click="genFromCum(c)">
              {{ genBusy === c.id ? 'Đang viết…' : '✍️ Viết nháp' }}
            </button>
          </div>
        </div>
      </section>

      <!-- Viết tự do -->
      <section class="card">
        <div class="card-head"><h3>Hoặc viết từ chủ đề tự nhập</h3></div>
        <div class="add-form">
          <input
            v-model="freeChuDe"
            class="inp inp--domain"
            placeholder="Chủ đề (vd: Cách bấm huyệt Hợp Cốc giảm đau đầu)"
          />
          <input v-model="freeTuKhoa" class="inp inp--ten" placeholder="Từ khoá, cách nhau dấu phẩy (tuỳ chọn)" />
          <button class="btn btn--primary" :disabled="genBusy !== null" @click="genFree">
            {{ genBusy === -1 ? 'Đang viết…' : '✍️ Viết nháp' }}
          </button>
        </div>
      </section>

      <!-- Danh sách nháp -->
      <section class="card">
        <div class="card-head"><h3>Bản nháp ({{ baiVietList.length }})</h3></div>
        <p v-if="!baiVietList.length" class="muted">Chưa có bản nháp. Bấm "Viết nháp" ở trên để AI tạo bài.</p>
        <div v-else class="table-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th class="col-st">An toàn (YMYL)</th>
                <th class="col-st">Trạng thái</th>
                <th class="col-act"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in baiVietList" :key="a.id">
                <td>
                  <strong>{{ a.tieu_de }}</strong><br />
                  <span class="muted">/blog/{{ a.slug }}</span>
                </td>
                <td class="col-st">
                  <span
                    class="badge"
                    :class="a.do_rui_ro === 'rui_ro' ? 'st--loi' : 'st--da_phan_tich'"
                    :title="a.ly_do_rui_ro || ''"
                  >
                    {{ a.do_rui_ro === 'rui_ro' ? '🔴 Cần duyệt' : '🟢 An toàn' }}
                  </span>
                </td>
                <td class="col-st"><span class="badge badge--comp">{{ TT_BAIVIET[a.trang_thai] }}</span></td>
                <td class="col-act">
                  <button class="btn btn--xs" @click="openEditor(a)">Mở</button>
                  <button
                    class="btn btn--xs btn--pub"
                    :disabled="publishingId === a.id || (a.trang_thai !== 'da_duyet' && a.trang_thai !== 'da_dang')"
                    :title="a.trang_thai === 'da_duyet' || a.trang_thai === 'da_dang' ? 'Ghi file blog + chuyển Đã đăng' : 'Cần duyệt (đổi sang Đã duyệt) trước khi đăng'"
                    @click="publishArticle(a)"
                  >
                    {{ publishingId === a.id ? '…' : a.trang_thai === 'da_dang' ? '↻ Đăng lại' : '🚀 Đăng' }}
                  </button>
                  <button
                    v-if="a.trang_thai === 'da_dang'"
                    class="btn btn--xs"
                    title="Mở bài trên web (hiện được sau khi build/deploy)"
                    @click="viewArticle(a)"
                  >
                    👁 Xem
                  </button>
                  <button class="icon-btn" title="Xoá nháp" @click="deleteBaiViet(a)">×</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
    <!-- /TAB LÒ VIẾT BÀI -->

    <!-- ===== TAB XU HƯỚNG ===== -->
    <div v-show="tab === 'trend'" class="tabwrap">
      <section class="card">
        <div class="card-head"><h3>Quét xu hướng tìm kiếm (Google Suggest — miễn phí)</h3></div>
        <p class="muted">
          Nhập vài từ khoá gốc của ngách (mỗi dòng 1 cái). Hệ thống lấy <b>gợi ý tìm kiếm thật</b> mà người dùng đang gõ
          trên Google → ra danh sách chủ đề nên viết (tự bỏ những bài bạn đã viết).
        </p>
        <textarea v-model="trendSeeds" class="inp ta" rows="5" spellcheck="false"></textarea>
        <div style="margin-top: var(--space-3)">
          <button class="btn btn--primary" :disabled="discovering" @click="discoverTrends">
            {{ discovering ? 'Đang quét…' : '🔎 Quét Xu Hướng' }}
          </button>
        </div>
      </section>

      <section v-if="trendCandidates.length" class="card">
        <div class="card-head">
          <h3>Chủ đề ứng viên ({{ trendCandidates.length }}) — tích chọn để viết</h3>
          <button
            class="btn btn--accent"
            :disabled="runningTrend || trendSelected.size === 0"
            @click="runTrendDrafts"
          >
            {{ runningTrend ? 'Đang viết…' : `✍️ Viết Nháp (${Math.min(trendSelected.size, TREND_MAX)})` }}
          </button>
        </div>
        <div class="cand-grid">
          <label v-for="k in trendCandidates" :key="k" class="cand" :class="{ on: trendSelected.has(k) }">
            <input type="checkbox" :checked="trendSelected.has(k)" @change="toggleCand(k)" />
            <span>{{ k }}</span>
          </label>
        </div>
        <p v-if="trendSelected.size > TREND_MAX" class="muted" style="margin-top: var(--space-3); color: var(--brown-700)">
          Đang chọn {{ trendSelected.size }} nhưng mỗi lần chỉ viết <b>{{ TREND_MAX }}</b> bài đầu (tránh quá thời gian). Viết xong cứ bấm tiếp cho các bài còn lại.
        </p>
        <p class="muted" style="margin-top: var(--space-3)">
          Tối đa {{ TREND_MAX }} bài/lần (mỗi bài ~30s). Bài viết xong nằm ở tab "Lò Viết Bài", mặc định <b>chờ duyệt / noindex</b> theo van an toàn YMYL.
        </p>
      </section>

      <section class="card">
        <div class="card-head"><h3>Tự chạy hằng tuần (tuỳ chọn)</h3></div>
        <p class="muted">
          Khi đã quen, bật cron tuần bằng biến môi trường <b>SEO_TREND_CRON=true</b> ở backend → mỗi tuần tự tạo 1 nháp
          vào hàng chờ (vẫn cần bạn duyệt mới đăng). Mặc định <b>TẮT</b> để bạn kiểm soát.
        </p>
      </section>
    </div>
    <!-- /TAB XU HƯỚNG -->

    <!-- ===== TAB GOOGLE SEARCH CONSOLE ===== -->
    <div v-show="tab === 'gsc'" class="tabwrap">
      <!-- Trạng thái kết nối -->
      <section class="card">
        <div class="card-head">
          <h3>Kết nối Google Search Console</h3>
          <button class="btn btn--sm btn--ghost" :disabled="gscChecking" @click="checkGscStatus">
            {{ gscChecking ? 'Đang kiểm tra…' : '🔄 Kiểm tra kết nối' }}
          </button>
        </div>

        <div v-if="!gscStatus" class="muted">Đang kiểm tra kết nối…</div>

        <div v-else-if="gscConnected" class="gsc-banner gsc-ok">
          ✅ Đã kết nối — property <b>{{ gscStatus.siteUrl }}</b>, quyền <b>{{ gscStatus.permissionLevel }}</b>
          <span class="muted">({{ gscStatus.mode === 'oauth' ? 'OAuth' : 'Service Account' }})</span>
        </div>

        <div v-else class="gsc-banner gsc-warn">
          <template v-if="gscStatus.connected && !gscStatus.hasAccess">
            ⚠️ Đã nối tới Google nhưng tài khoản <b>chưa có quyền</b> trên <b>{{ gscStatus.siteUrl }}</b>.
            <div v-if="gscStatus.sites && gscStatus.sites.length" class="muted" style="margin-top: var(--space-2)">
              Property tài khoản thấy:
              <span v-for="s in gscStatus.sites" :key="s.siteUrl"><code>{{ s.siteUrl }}</code> ({{ s.permissionLevel }}) </span>
              — nếu đúng cái khác, đặt lại <code>GSC_SITE_URL</code> trong .env.
            </div>
          </template>
          <template v-else>
            ⏳ Chưa kết nối. {{ gscStatus.reason }}
            <div class="muted" style="margin-top: var(--space-2)">
              Hoàn tất cấp quyền trong Search Console (xem <code>backend/GSC-SETUP.md</code>) rồi bấm “Kiểm tra kết nối”.
            </div>
          </template>
        </div>
      </section>

      <!-- Khi đã kết nối → hiện dữ liệu thật -->
      <template v-if="gscConnected">
        <!-- Thanh điều khiển thời gian -->
        <section class="card">
          <div class="gsc-controls">
            <label class="gsc-ctl-lbl">Khoảng thời gian:
              <select v-model.number="gscDays" class="inp inp--sm inp--num" @change="loadGscData">
                <option :value="7">7 ngày</option>
                <option :value="28">28 ngày</option>
                <option :value="90">90 ngày</option>
              </select>
            </label>
            <button class="btn btn--sm btn--primary" :disabled="gscLoading" @click="loadGscData">
              {{ gscLoading ? 'Đang tải…' : '🔄 Tải lại dữ liệu' }}
            </button>
            <span v-if="gscSummary" class="muted">{{ gscSummary.range.startDate }} → {{ gscSummary.range.endDate }} · GSC trễ ~2-3 ngày</span>
          </div>
        </section>

        <!-- Tổng quan + biểu đồ "website là thực thể sống" -->
        <section v-if="gscSummary" class="card">
          <div class="card-head"><h3>Tổng quan — website đang lớn lên</h3></div>
          <div class="gsc-stats">
            <div class="gsc-stat"><span class="gsc-stat-num">{{ fmtNum(gscSummary.totals.clicks) }}</span><span class="gsc-stat-lbl">Lượt nhấp</span></div>
            <div class="gsc-stat"><span class="gsc-stat-num">{{ fmtNum(gscSummary.totals.impressions) }}</span><span class="gsc-stat-lbl">Lượt hiển thị</span></div>
            <div class="gsc-stat"><span class="gsc-stat-num">{{ fmtPct(gscSummary.totals.ctr) }}</span><span class="gsc-stat-lbl">CTR</span></div>
            <div class="gsc-stat"><span class="gsc-stat-num">{{ fmtPos(gscSummary.totals.position) }}</span><span class="gsc-stat-lbl">Vị trí TB</span></div>
          </div>

          <div class="gsc-chart-head">
            <span class="muted">Diễn biến theo ngày</span>
            <div class="gsc-metric-toggle">
              <button class="btn btn--sm btn--ghost" :class="{ on: gscMetric === 'clicks' }" @click="gscMetric = 'clicks'">Nhấp</button>
              <button class="btn btn--sm btn--ghost" :class="{ on: gscMetric === 'impressions' }" @click="gscMetric = 'impressions'">Hiển thị</button>
            </div>
          </div>
          <div v-if="gscSummary.byDate.length" class="gsc-chart">
            <div
              v-for="d in gscSummary.byDate"
              :key="d.date"
              class="gsc-bar"
              :style="{ height: barHeight(d) }"
              :title="`${d.date}: ${gscMetric === 'clicks' ? d.clicks : d.impressions} ${gscMetric === 'clicks' ? 'nhấp' : 'hiển thị'}`"
            ></div>
          </div>
          <p v-else class="muted">Chưa có dữ liệu theo ngày (site mới hoặc chưa có lượt tìm kiếm — kết nối vẫn OK).</p>
        </section>

        <!-- 🎯 SẮP LÊN TOP — cơ hội vàng (vòng tự sửa: GSC "tai" → Lò Viết Bài "tay") -->
        <section class="card gsc-striking">
          <div class="card-head"><h3>🎯 Sắp Lên Top — Cơ Hội Vàng ({{ gscStriking.length }})</h3></div>
          <p class="muted gsc-striking-note">Từ khoá đang ở <b>hạng 5–20</b> với đủ lượt hiển thị: <b>gần top, chỉ cần viết/bồi thêm là lên trang 1</b>. Bấm “Viết bài” để AI soạn nháp nhắm thẳng từ khoá đó.</p>
          <div v-if="gscStriking.length" class="table-wrap">
            <table class="tbl">
              <thead><tr><th>Từ khoá (sắp lên top)</th><th class="gsc-num">Hạng</th><th class="gsc-num">Hiển thị</th><th class="gsc-num">Nhấp</th><th>Trang đang xếp</th><th></th></tr></thead>
              <tbody>
                <tr v-for="r in gscStriking" :key="r.query + r.page">
                  <td><b>{{ r.query }}</b></td>
                  <td class="gsc-num">{{ fmtPos(r.position) }}</td>
                  <td class="gsc-num">{{ fmtNum(r.impressions) }}</td>
                  <td class="gsc-num">{{ fmtNum(r.clicks) }}</td>
                  <td class="gsc-url"><a :href="r.page" target="_blank" rel="noopener">{{ r.page }}</a></td>
                  <td><button class="btn btn--sm btn--primary" @click="vietTuKhoa(r.query)">✍️ Viết bài</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="muted">Chưa có cơ hội nào — site vừa lên sóng, GSC cần <b>vài tuần</b> để Google index xong &amp; tích luỹ lượt tìm kiếm. Khi có dữ liệu, mục này tự hiện các từ khoá “sắp lên top” để anh xử trước.</p>
        </section>

        <!-- Top từ khoá -->
        <section class="card">
          <div class="card-head"><h3>Top từ khoá ({{ gscQueries.length }})</h3></div>
          <div v-if="gscQueries.length" class="table-wrap">
            <table class="tbl">
              <thead><tr><th>Từ khoá</th><th class="gsc-num">Nhấp</th><th class="gsc-num">Hiển thị</th><th class="gsc-num">CTR</th><th class="gsc-num">Vị trí</th></tr></thead>
              <tbody>
                <tr v-for="r in gscQueries" :key="r.key">
                  <td>{{ r.key }}</td>
                  <td class="gsc-num">{{ fmtNum(r.clicks) }}</td>
                  <td class="gsc-num">{{ fmtNum(r.impressions) }}</td>
                  <td class="gsc-num">{{ fmtPct(r.ctr) }}</td>
                  <td class="gsc-num">{{ fmtPos(r.position) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="muted">Chưa có từ khoá nào trong khoảng này.</p>
        </section>

        <!-- Top trang -->
        <section class="card">
          <div class="card-head"><h3>Top trang ({{ gscPages.length }})</h3></div>
          <div v-if="gscPages.length" class="table-wrap">
            <table class="tbl">
              <thead><tr><th>Trang</th><th class="gsc-num">Nhấp</th><th class="gsc-num">Hiển thị</th><th class="gsc-num">CTR</th><th class="gsc-num">Vị trí</th></tr></thead>
              <tbody>
                <tr v-for="r in gscPages" :key="r.key">
                  <td class="gsc-url"><a :href="r.key" target="_blank" rel="noopener">{{ r.key }}</a></td>
                  <td class="gsc-num">{{ fmtNum(r.clicks) }}</td>
                  <td class="gsc-num">{{ fmtNum(r.impressions) }}</td>
                  <td class="gsc-num">{{ fmtPct(r.ctr) }}</td>
                  <td class="gsc-num">{{ fmtPos(r.position) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="muted">Chưa có trang nào nhận traffic trong khoảng này.</p>
        </section>

        <!-- Từ khoá bị "ăn thịt" -->
        <section class="card">
          <div class="card-head"><h3>🔪 Từ khoá bị “ăn thịt” ({{ gscCannibal.length }})</h3></div>
          <p class="muted">Những từ khoá mà <b>nhiều trang</b> của bạn cùng tranh nhau → Google bối rối, thứ hạng loãng. Nên gộp/điều hướng về 1 trang chủ lực.</p>
          <div v-if="gscCannibal.length" class="gsc-cannibal">
            <details v-for="c in gscCannibal" :key="c.query" class="gsc-can">
              <summary>
                <b>{{ c.query }}</b>
                <span class="gsc-can-meta">{{ c.soTrang }} trang tranh · {{ fmtNum(c.impressions) }} hiển thị · {{ fmtNum(c.clicks) }} nhấp</span>
              </summary>
              <table class="tbl">
                <thead><tr><th>Trang</th><th class="gsc-num">Nhấp</th><th class="gsc-num">Hiển thị</th><th class="gsc-num">Vị trí</th></tr></thead>
                <tbody>
                  <tr v-for="p in c.pages" :key="p.key">
                    <td class="gsc-url"><a :href="p.key" target="_blank" rel="noopener">{{ p.key }}</a></td>
                    <td class="gsc-num">{{ fmtNum(p.clicks) }}</td>
                    <td class="gsc-num">{{ fmtNum(p.impressions) }}</td>
                    <td class="gsc-num">{{ fmtPos(p.position) }}</td>
                  </tr>
                </tbody>
              </table>
            </details>
          </div>
          <p v-else class="muted">🎉 Không phát hiện từ khoá nào bị nhiều trang tranh nhau.</p>
        </section>

        <!-- Sitemap -->
        <section class="card">
          <div class="card-head"><h3>Sitemap</h3></div>
          <div class="gsc-controls">
            <input v-model="newSitemap" class="inp" placeholder="https://kinhlac.online/sitemap.xml" />
            <button class="btn btn--sm btn--accent" :disabled="submittingSitemap" @click="submitNewSitemap">
              {{ submittingSitemap ? 'Đang gửi…' : '📤 Gửi sitemap' }}
            </button>
          </div>
          <div v-if="gscSitemaps.length" class="table-wrap" style="margin-top: var(--space-3)">
            <table class="tbl">
              <thead><tr><th>Đường dẫn</th><th>Tải gần nhất</th><th class="gsc-num">Cảnh báo</th><th class="gsc-num">Lỗi</th></tr></thead>
              <tbody>
                <tr v-for="s in gscSitemaps" :key="s.path">
                  <td class="gsc-url"><a :href="s.path" target="_blank" rel="noopener">{{ s.path }}</a></td>
                  <td>{{ s.lastDownloaded ? s.lastDownloaded.slice(0, 10) : (s.isPending ? 'Đang chờ' : '—') }}</td>
                  <td class="gsc-num">{{ s.warnings }}</td>
                  <td class="gsc-num" :class="{ 'gsc-err': s.errors > 0 }">{{ s.errors }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="muted" style="margin-top: var(--space-3)">Chưa có sitemap nào. Gửi <code>https://kinhlac.online/sitemap.xml</code> ở trên.</p>
        </section>

        <!-- Kiểm tra URL đã index -->
        <section class="card">
          <div class="card-head"><h3>Kiểm tra URL đã được Google index chưa</h3></div>
          <div class="gsc-controls">
            <input v-model="inspectUrlInput" class="inp" placeholder="https://kinhlac.online/blog/..." />
            <button class="btn btn--sm btn--primary" :disabled="inspecting" @click="runInspect">
              {{ inspecting ? 'Đang hỏi Google…' : '🔍 Kiểm tra' }}
            </button>
          </div>
          <div v-if="inspectResult" class="gsc-banner" :class="inspectResult.verdict === 'PASS' ? 'gsc-ok' : 'gsc-warn'" style="margin-top: var(--space-3)">
            <div><b>Kết luận:</b> {{ inspectResult.verdict || '—' }} — {{ inspectResult.coverageState || '' }}</div>
            <div class="muted" style="margin-top: var(--space-1)">
              Lần crawl gần nhất: {{ inspectResult.lastCrawlTime ? inspectResult.lastCrawlTime.slice(0, 10) : '—' }} ·
              Robots: {{ inspectResult.robotsTxtState || '—' }} ·
              Canonical (Google): {{ inspectResult.googleCanonical || '—' }}
            </div>
            <a v-if="inspectResult.inspectionLink" :href="inspectResult.inspectionLink" target="_blank" rel="noopener" class="muted">Xem chi tiết trong Search Console →</a>
          </div>
        </section>
      </template>
    </div>
    <!-- /TAB GOOGLE SEARCH CONSOLE -->

    <!-- Modal sửa bản nháp -->
    <div v-if="editing" class="ed-overlay" @click.self="closeEditor">
      <div class="ed-modal" role="dialog" aria-modal="true" aria-labelledby="ed-title">
        <div class="ed-head">
          <h3 id="ed-title">Sửa Bản Nháp</h3>
          <button type="button" class="tc-close" @click="closeEditor" aria-label="Đóng">×</button>
        </div>
        <div class="ed-body">
          <!-- Tiến trình sinh ảnh AI (vẽ tuần tự từng mục H2) -->
          <div
            v-if="imgProg.on"
            class="img-prog"
            :class="{ 'img-prog--done': imgProg.status === 'done', 'img-prog--error': imgProg.status === 'error' }"
            role="status"
            aria-live="polite"
          >
            <div class="img-prog-head">
              <span v-if="imgProg.status === 'running'" class="gen-spin" aria-hidden="true"></span>
              <span v-else-if="imgProg.status === 'done'" aria-hidden="true">✅</span>
              <span v-else aria-hidden="true">⚠️</span>
              <span class="img-prog-stage">{{ imgProg.stage }}</span>
              <span class="img-prog-count">{{ imgProg.done }}/{{ imgProg.total }} ảnh<span v-if="imgProg.status === 'running'"> · {{ imgProg.pct }}%</span></span>
            </div>
            <div v-if="imgProg.status !== 'error'" class="gen-bar">
              <div class="gen-bar-fill" :style="{ width: imgProg.pct + '%' }"></div>
            </div>
            <p class="gen-prog-note">
              <template v-if="imgProg.status === 'running'">
                ⏱ Ảnh này: <b>{{ imgProg.secImg }}s</b> · Tổng: <b>{{ imgProg.secTotal }}s</b>.
                Mỗi ảnh ~30–120 giây (gpt-image-2) — vẫn đang chạy, đừng đóng tab.
              </template>
              <template v-else-if="imgProg.status === 'done'">
                Xong sau {{ imgProg.secTotal }}s. Ảnh đã chèn vào bài — bấm <b>Lưu</b> rồi <b>Đăng</b>.
              </template>
              <template v-else>
                <b>Lý do:</b> {{ imgProg.errMsg }}
                <br />Thường do: <b>chưa restart backend</b> sau khi sửa <code>.env</code>, hoặc model ảnh chưa sẵn / hết credit.
                <span v-if="imgProg.done > 0"> ({{ imgProg.done }} ảnh đã vẽ vẫn được giữ — có thể Lưu.)</span>
                Bấm <b>🖼 Sinh ảnh</b> lần nữa để thử tiếp (ảnh đã có sẽ bỏ qua).
              </template>
            </p>
          </div>
          <div v-if="editing.do_rui_ro === 'rui_ro'" class="ymyl-warn">
            🔴 <b>Nội dung y tế cần duyệt kỹ (YMYL).</b>
            {{ editing.ly_do_rui_ro }} Hãy rà soát kỹ trước khi đăng; cân nhắc để noindex tới khi chắc chắn.
          </div>
          <label class="ed-field"><span>Tiêu đề</span><input v-model="editing.tieu_de" class="inp" /></label>
          <div class="ed-row">
            <label class="ed-field"><span>Slug (URL)</span><input v-model="editing.slug" class="inp" /></label>
            <label class="ed-field"><span>Chuyên mục</span><input v-model="editing.category" class="inp" /></label>
          </div>
          <label class="ed-field">
            <span>Meta description</span>
            <textarea v-model="editing.meta_description" class="inp ta" rows="2"></textarea>
          </label>
          <label class="ed-field"><span>Từ khoá (cách nhau dấu phẩy)</span><input v-model="editing.tu_khoa" class="inp" /></label>
          <label class="ed-field">
            <span>Nguồn tham khảo <small>(mỗi dòng: <b>Tên | URL</b> — để trống URL nếu chưa chắc; tăng độ tin cậy E-E-A-T)</small></span>
            <textarea
              v-model="nguonText"
              class="inp ta"
              rows="3"
              spellcheck="false"
              placeholder="Lê Văn Sửu — Biện Chứng Luận Trị&#10;Viện Y học cổ truyền Trung ương | https://..."
            ></textarea>
          </label>

          <label class="ed-field">
            <span>Câu hỏi thường gặp (FAQ) <small>(mỗi dòng 1 câu: <b>Câu hỏi | Trả lời</b> — xuất ra schema FAQPage)</small></span>
            <textarea
              v-model="faqText"
              class="inp ta"
              rows="4"
              spellcheck="false"
              placeholder="Đo kinh lạc có đau không? | Không, đầu đo chỉ chạm nhẹ ngoài da tại tỉnh huyệt.&#10;Đo mất bao lâu? | Khoảng 5–10 phút cho 24 tỉnh huyệt."
            ></textarea>
          </label>

          <!-- Ảnh bìa: ưu tiên ảnh bìa AI vẽ riêng; chưa có thì dùng sơ đồ đường kinh "của nhà" theo chủ đề -->
          <div class="ed-field">
            <span>Ảnh bìa
              <small v-if="customCover">(ảnh bìa AI vẽ riêng theo chủ đề)</small>
              <small v-else>(sơ đồ đường kinh "của nhà" — bấm “Vẽ ảnh bìa AI” để có ảnh riêng theo nội dung)</small>
            </span>
            <div class="cover-prev">
              <img :src="coverImageFor(editing)" :alt="editing.tieu_de" class="cover-prev-img" loading="lazy" />
              <div class="cover-prev-meta">
                <span class="cover-badge" :class="customCover ? 'cover-badge--ai' : 'cover-badge--house'">
                  {{ customCover ? '✨ Ảnh bìa AI' : '🧭 Sơ đồ đường kinh' }}
                </span>
                <code class="cover-prev-path">{{ coverImageFor(editing) }}</code>
                <button
                  type="button"
                  class="btn btn--xs btn--ghost"
                  :disabled="genCoverId === editing.id"
                  title="AI vẽ 1 ảnh bìa riêng khớp chủ đề cả bài (tốn credit AI)"
                  @click="generateCover(editing)"
                >
                  {{ genCoverId === editing.id ? 'Đang vẽ ảnh bìa…' : (customCover ? '🔄 Vẽ lại ảnh bìa AI' : '✨ Vẽ ảnh bìa AI') }}
                </button>
              </div>
            </div>
            <!-- Thanh tiến trình % THẬT khi vẽ ảnh bìa (gpt-image-2) -->
            <div
              v-if="coverProg.on"
              class="img-prog"
              :class="{ 'img-prog--done': coverProg.status === 'done', 'img-prog--error': coverProg.status === 'error' }"
            >
              <div class="img-prog-head">
                <span v-if="coverProg.status === 'running'" class="gen-spin" aria-hidden="true"></span>
                <span v-else-if="coverProg.status === 'done'" aria-hidden="true">✅</span>
                <span v-else aria-hidden="true">⚠️</span>
                <span class="img-prog-stage">{{ coverProg.stage }}</span>
                <span v-if="coverProg.status === 'running'" class="img-prog-count">{{ coverProg.pct }}%</span>
              </div>
              <div v-if="coverProg.status !== 'error'" class="gen-bar">
                <div class="gen-bar-fill" :style="{ width: coverProg.pct + '%' }"></div>
              </div>
              <p v-else class="gen-prog-note"><b>Lý do:</b> {{ coverProg.errMsg }}</p>
            </div>
          </div>

          <!-- Checklist kiểm duyệt thủ công (van YMYL: đủ 4 mới được "Đã duyệt") -->
          <fieldset class="kd-box" :class="{ 'kd-box--ok': kiemDuyetDu }">
            <legend>Checklist kiểm duyệt <small>(tick đủ 4 mới chuyển được "Đã duyệt")</small></legend>
            <button type="button" class="btn btn--ghost kd-auto-btn" @click="runAutoKiemDuyet">
              🔍 Kiểm duyệt tự động <small>(máy tick hộ 3 mục đo được, Y khoa bạn tự gật)</small>
            </button>
            <label v-for="it in KIEM_DUYET_ITEMS" :key="it.key" class="kd-item">
              <input
                type="checkbox"
                :checked="kiemDuyet[it.key] === true"
                @change="toggleKiem(it.key, ($event.target as HTMLInputElement).checked)"
              />
              <span>{{ it.label }}</span>
            </label>
            <!-- Báo cáo của máy: mỗi mục một dòng OK/cảnh báo + gợi ý sửa -->
            <ul v-if="autoReport" class="kd-report">
              <li v-for="r in autoReport" :key="r.key" class="kd-report-item" :class="`kd-report-item--${r.status}`">
                <strong>{{ r.status === 'ok' ? '✔' : r.status === 'warn' ? '⚠' : 'ℹ' }} {{ r.label }}</strong>
                <span v-for="(ln, i) in r.lines" :key="i" class="kd-report-line">{{ ln }}</span>
              </li>
            </ul>
            <p class="kd-status" :class="kiemDuyetDu ? 'kd-status--ok' : 'kd-status--warn'">
              {{ kiemDuyetDu ? '✔ Đủ điều kiện duyệt' : '⚠ Chưa đủ — còn mục chưa tick, chưa thể "Đã duyệt"' }}
            </p>
          </fieldset>

          <div class="ed-row">
            <label class="ed-field">
              <span>CTA</span>
              <select v-model="editing.cta" class="inp">
                <option v-for="o in CTA_OPTIONS" :key="o" :value="o">{{ o }}</option>
              </select>
            </label>
            <label class="ed-field">
              <span>Trạng thái</span>
              <select v-model="editing.trang_thai" class="inp">
                <option value="nhap">Nháp</option>
                <option value="da_duyet" :disabled="!kiemDuyetDu">Đã duyệt{{ kiemDuyetDu ? '' : ' (cần đủ checklist)' }}</option>
                <option value="bo_qua">Bỏ qua</option>
                <option value="da_dang" :disabled="!kiemDuyetDu">Đã đăng{{ kiemDuyetDu ? '' : ' (cần đủ checklist)' }}</option>
              </select>
            </label>
          </div>
          <label class="ed-field">
            <span>Nội dung (Markdown — không có tiêu đề H1, FAQ lưu riêng)</span>
            <textarea v-model="editing.noi_dung_md" class="inp ta ta--big" rows="18" spellcheck="false"></textarea>
          </label>
        </div>
        <div class="ed-foot">
          <div class="ed-foot-left">
            <button type="button" class="btn btn--ghost" @click="closeEditor">Đóng</button>
            <button
              type="button"
              class="btn btn--ghost btn--muted"
              :disabled="exportingId === editing.id"
              title="Nâng cao: tải file để đăng THỦ CÔNG bằng script (publish-article.mjs). Người mới có thể bỏ qua — cứ dùng nút Đăng."
              @click="exportMd(editing)"
            >
              {{ exportingId === editing.id ? '…' : '⬇ Xuất JSON' }}
            </button>
            <button
              type="button"
              class="btn btn--ghost"
              :disabled="genImagesId === editing.id"
              title="AI vẽ 1 ảnh minh hoạ cho mỗi mục ## H2 (tốn credit AI)"
              @click="generateImages(editing)"
            >
              {{ genImagesId === editing.id ? 'Đang vẽ ảnh…' : '🖼 Sinh ảnh minh hoạ (AI)' }}
            </button>
          </div>
          <div class="ed-foot-right">
            <button
              v-if="editing.trang_thai === 'da_dang'"
              type="button"
              class="btn btn--ghost"
              title="Mở bài trên web (sau khi build/deploy)"
              @click="viewArticle(editing)"
            >
              👁 Xem
            </button>
            <button type="button" class="btn btn--primary" :disabled="savingEditor" @click="saveEditor">
              {{ savingEditor ? 'Đang lưu…' : '💾 Lưu' }}
            </button>
            <button
              type="button"
              class="btn btn--pub"
              :disabled="publishingId === editing.id || (editing.trang_thai !== 'da_duyet' && editing.trang_thai !== 'da_dang')"
              title="Ghi file blog + chuyển Đã đăng (cần Đã duyệt)"
              @click="publishArticle(editing)"
            >
              {{ publishingId === editing.id ? 'Đang đăng…' : '🚀 Đăng' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Overlay tiến trình khi Đăng (chạy bar tới khi xong → bật nút Xem) -->
    <div v-if="pubModal" class="ed-overlay" @click.self="(pubDone || pubError) && closePubModal()">
      <div class="pub-card" role="status" aria-live="polite">
        <h3 class="pub-title">
          {{ pubError ? '✗ Đăng thất bại' : pubDone ? '✓ Đã đăng bài' : '🚀 Đang đăng bài…' }}
        </h3>
        <p v-if="pubTarget" class="pub-name">{{ pubTarget.tieu_de }}</p>

        <template v-if="!pubError">
          <div class="gen-prog-head">
            <span v-if="!pubDone" class="gen-spin" aria-hidden="true"></span>
            <span class="gen-prog-stage">{{ pubStage }}</span>
            <span class="gen-prog-pct">{{ pubProgress }}%</span>
          </div>
          <div class="gen-bar"><div class="gen-bar-fill" :style="{ width: pubProgress + '%' }"></div></div>
        </template>
        <p v-else class="pub-err">{{ pubError }}</p>

        <p v-if="!pubDone && !pubError" class="gen-prog-note">
          Đang ghi bài lên máy này. Đừng đóng cửa sổ. (% là ước lượng theo thời gian, không phải tiến độ thật.)
        </p>
        <p v-if="pubDone && pubNote" class="gen-prog-note">{{ pubNote }}</p>

        <div class="pub-foot">
          <span v-if="pubDone && !pubWrote" class="pub-hint">ⓘ Bản tĩnh chuẩn SEO sẽ thay thế ở lần deploy tới</span>
          <button
            v-if="pubDone"
            class="btn btn--primary"
            :disabled="!pubTarget?.slug"
            title="Mở bài trên web (backend tự render từ dữ liệu nếu chưa build tĩnh)"
            @click="pubTarget && viewArticle(pubTarget)"
          >
            👁 Xem Bài
          </button>
          <button class="btn btn--ghost" :disabled="!pubDone && !pubError" @click="closePubModal">
            {{ pubDone || pubError ? 'Đóng' : 'Đang xử lý…' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.seo-radar { display: flex; flex-direction: column; gap: var(--space-5); max-width: 1100px; }

.intro-title { font-size: var(--font-size-xl); font-weight: 800; color: var(--brown-800); }
.intro-sub { margin-top: var(--space-2); color: var(--text-muted); font-size: var(--font-size-sm); line-height: 1.6; }

/* Banner */
.banner { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: 500; }
.banner--ok { background: var(--success-bg); color: var(--success-fg); }
.banner--err { background: var(--danger-bg); color: var(--danger); }
.banner--info { background: var(--brown-50); color: var(--brown-700); }
.banner-x { font-size: 20px; line-height: 1; color: inherit; opacity: .7; }
.banner-x:hover { opacity: 1; }

/* Card */
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-5); }
.card-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-4); flex-wrap: wrap; }
.card-head h3 { font-size: var(--font-size-md); font-weight: 700; color: var(--text); }

.muted { color: var(--text-subtle); font-size: var(--font-size-sm); }

/* Form thêm */
.add-form { display: flex; gap: var(--space-3); flex-wrap: wrap; align-items: center; }
.inp { height: 40px; padding: 0 var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); color: var(--text); font-size: var(--font-size-sm); }
.inp:focus { outline: none; border-color: var(--brown-400); box-shadow: var(--focus-ring); }
.inp--domain { flex: 1; min-width: 220px; }
.inp--ten { flex: 1; min-width: 180px; }
.inp--sm { height: 34px; min-width: 90px; }
.inp--num { width: 68px; min-width: 0; text-align: center; }
.step-hint { margin: calc(-1 * var(--space-2)) 0 var(--space-3); line-height: 1.6; }
.chk { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-sm); color: var(--text-muted); white-space: nowrap; }
.batch-limit { font-size: var(--font-size-sm); color: var(--text-muted); display: flex; align-items: center; gap: var(--space-2); }

/* Nút */
.btn { height: 40px; padding: 0 var(--space-4); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: 600; transition: all var(--transition-fast); border: 1px solid transparent; }
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn--primary { background: var(--brown-600); color: #fff; }
.btn--primary:not(:disabled):hover { background: var(--brown-700); }
.btn--accent { background: var(--brown-100); color: var(--brown-800); }
.btn--accent:not(:disabled):hover { background: var(--brown-200); }
.btn--ghost { background: transparent; border-color: var(--border); color: var(--text-muted); }
.btn--ghost:not(:disabled):hover { background: var(--gray-100); }
.btn--sm { height: 34px; padding: 0 var(--space-3); font-size: var(--font-size-xs); background: var(--surface); border-color: var(--border); color: var(--brown-700); }
.btn--sm:not(:disabled):hover { background: var(--brown-50); }
.btn--xs { height: 28px; padding: 0 var(--space-2); font-size: var(--font-size-xs); background: var(--brown-50); color: var(--brown-700); }
.btn--xs:not(:disabled):hover { background: var(--brown-100); }
.btn--xs.btn--pub { background: var(--success); color: #fff; }
.btn--xs.btn--pub:not(:disabled):hover { background: var(--success-fg); }
.btn--pub-ghost { color: var(--brown-700); border-color: var(--brown-300); }
/* Nút "Đăng" (publish = lên web) = xanh lá trên hệ Nâu/Kem để tách khỏi "Lưu" (nâu). */
.btn--pub { background: var(--success); color: #fff; border-color: transparent; }
.btn--pub:not(:disabled):hover { background: var(--success-fg); }
/* Nút phụ/nâng cao trong footer editor — mờ nhẹ để không tranh chú ý với Lưu/Đăng. */
.btn--muted { opacity: .8; }
.icon-btn { width: 30px; height: 30px; border-radius: var(--radius-sm); color: var(--gray-500); font-size: 16px; }
.icon-btn:not(:disabled):hover { background: var(--danger-bg); color: var(--danger); }

/* Lưới đối thủ */
.doithu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-3); }
.doithu { border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); transition: all var(--transition-fast); }
.doithu.active { border-color: var(--brown-400); box-shadow: var(--focus-ring); }
.doithu.mine { background: var(--brown-50); }
.doithu-top { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-2); }
.doithu-name { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; min-width: 0; }
.doithu-domain { font-weight: 700; color: var(--brown-800); word-break: break-all; }
.doithu-domain:hover { text-decoration: underline; }
.doithu-ten { font-size: var(--font-size-xs); color: var(--text-subtle); margin-top: -4px; }

.badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full); white-space: nowrap; }
.badge--comp { background: var(--brown-100); color: var(--brown-700); }
.badge--mine { background: #e3f2fd; color: #1565c0; }
.st--cho { background: var(--warning-bg); color: var(--warning-fg); }
.st--da_phan_tich { background: var(--success-bg); color: var(--success-fg); }
.st--loi { background: var(--danger-bg); color: var(--danger); }
.st--ngoai_nganh { background: var(--brown-100); color: var(--text-muted); }

.stats { display: flex; gap: var(--space-3); flex-wrap: wrap; font-size: var(--font-size-xs); color: var(--text-muted); }
.stat b { color: var(--text); }
.stat--cho b { color: var(--warning-fg); }
.stat--ok b { color: var(--success-fg); }
.stat--skip b { color: var(--text-muted); }
.stat--err b { color: var(--danger); }

.doithu-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }

/* Bảng URL */
.table-wrap { overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.tbl th, .tbl td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--gray-100); vertical-align: top; }
.tbl th { font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: .03em; color: var(--text-subtle); font-weight: 700; }
.col-url { max-width: 260px; }
.col-url a { color: var(--brown-700); word-break: break-all; }
.col-st { white-space: nowrap; }
.col-act { white-space: nowrap; text-align: right; display: flex; gap: 4px; justify-content: flex-end; }
.kw { color: var(--brown-700); }
.err-text { color: var(--danger); font-size: var(--font-size-xs); }

.filters, .doithu-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.chip-btn { height: 30px; padding: 0 var(--space-3); border-radius: var(--radius-full); border: 1px solid var(--border); font-size: var(--font-size-xs); color: var(--text-muted); }
.chip-btn.on { background: var(--brown-600); color: #fff; border-color: var(--brown-600); }

/* Cụm gợi ý */
.cum-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-3); }
.cum { border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); }
.cum-top { display: flex; align-items: center; gap: var(--space-3); }
.cum-score { width: 34px; height: 34px; flex-shrink: 0; border-radius: var(--radius-full); background: linear-gradient(135deg, var(--brown-500), var(--brown-700)); color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.cum-name { font-size: var(--font-size-sm); font-weight: 700; color: var(--brown-800); }
.cum-kw, .cum-idea { font-size: var(--font-size-xs); color: var(--text-muted); line-height: 1.5; }
.cum-kw b, .cum-idea b { color: var(--text); }
.cum-kw--seed { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.cum-why { font-size: var(--font-size-xs); color: var(--text-subtle); font-style: italic; }

/* Bước 3: mỗi đối thủ một thanh gọn, bấm mở/đóng (accordion) */
.gap-groups { display: flex; flex-direction: column; gap: var(--space-2); }
.gap-group { border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-2) var(--space-3); }
.gap-group--open { border-color: var(--brown-300); background: var(--brown-50); }
.gap-group-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; }
.gap-group-toggle { display: flex; align-items: center; gap: var(--space-2); flex: 1; min-width: 0; text-align: left; padding: var(--space-1) 0; background: transparent; border: 0; cursor: pointer; }
.gap-group-toggle:hover .gap-group-domain { text-decoration: underline; }
.gap-chevron { flex-shrink: 0; color: var(--brown-600); font-size: 12px; transition: transform var(--transition-fast); }
.gap-group--open .gap-chevron { transform: rotate(90deg); }
.gap-group-domain { font-weight: 700; color: var(--brown-800); word-break: break-all; }
.gap-group-count { font-size: var(--font-size-xs); white-space: nowrap; }
.gap-group-body { margin-top: var(--space-3); }
.gap-empty { margin: 0; }
.cum-score--sm { width: 28px; height: 28px; font-size: var(--font-size-xs); margin: 0 auto; }
.tbl--gap td { vertical-align: middle; }
.tbl--gap .col-score { width: 52px; text-align: center; }
.tbl--gap .gap-why,
.tbl--gap .gap-idea { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; }
.tbl--gap .gap-why { font-size: var(--font-size-xs); color: var(--text-subtle); font-style: italic; margin-top: 2px; line-height: 1.45; -webkit-line-clamp: 2; line-clamp: 2; }
.tbl--gap .gap-idea { font-size: var(--font-size-xs); color: var(--text-muted); line-height: 1.45; max-width: 340px; -webkit-line-clamp: 3; line-clamp: 3; }
.tbl--gap .kw { font-size: var(--font-size-xs); }

/* Tab */
.tabbar { display: flex; gap: var(--space-2); border-bottom: 1px solid var(--border); }
.tab { height: 42px; padding: 0 var(--space-5); font-size: var(--font-size-sm); font-weight: 700; color: var(--text-muted); border-bottom: 3px solid transparent; margin-bottom: -1px; }
.tab.on { color: var(--brown-800); border-bottom-color: var(--brown-600); }
.tab:not(.on):hover { color: var(--brown-700); }
.tabwrap { display: flex; flex-direction: column; gap: var(--space-5); }

/* ===== Tab Google Search Console ===== */
.gsc-banner { padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); font-size: var(--font-size-sm); line-height: 1.55; }
.gsc-ok { background: var(--success-bg); color: var(--success-fg); border: 1px solid var(--success); }
.gsc-warn { background: var(--warning-bg); color: var(--warning-fg); border: 1px solid var(--warning); }
.gsc-banner code { background: rgba(0,0,0,.06); padding: 1px 5px; border-radius: var(--radius-sm); }

.gsc-controls { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
.gsc-ctl-lbl { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-sm); color: var(--text-muted); }
.gsc-controls .inp { flex: 1; min-width: 220px; }

/* Thẻ số tổng quan */
.gsc-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-4); }
.gsc-stat { display: flex; flex-direction: column; gap: 2px; padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--brown-50); }
.gsc-stat-num { font-size: 22px; font-weight: 800; color: var(--brown-800); }
.gsc-stat-lbl { font-size: var(--font-size-xs); color: var(--text-subtle); text-transform: uppercase; letter-spacing: .03em; }

/* Biểu đồ cột theo ngày — "website là thực thể sống" */
.gsc-chart-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-2); }
.gsc-metric-toggle { display: flex; gap: var(--space-2); }
.gsc-metric-toggle .btn.on { background: var(--brown-600); color: #fff; border-color: var(--brown-600); }
.gsc-chart { display: flex; align-items: flex-end; gap: 2px; height: 120px; padding: var(--space-2); background: var(--brown-50); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
.gsc-bar { flex: 1 1 0; min-width: 2px; background: var(--brown-500); border-radius: 2px 2px 0 0; transition: height var(--transition-fast), background var(--transition-fast); }
.gsc-bar:hover { background: var(--brown-800); }

/* Cột số căn phải */
.tbl th.gsc-num, .tbl td.gsc-num { text-align: right; white-space: nowrap; }
.gsc-err { color: var(--danger); font-weight: 700; }
.gsc-url { max-width: 320px; }
.gsc-url a { color: var(--brown-700); word-break: break-all; }

/* Từ khoá bị ăn thịt */
.gsc-cannibal { display: flex; flex-direction: column; gap: var(--space-2); }
.gsc-striking { border-left: 4px solid #c9962f; }
.gsc-striking-note { margin-top: 0; }
.gsc-can { border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-2) var(--space-3); }
.gsc-can > summary { cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; list-style: none; }
.gsc-can > summary::-webkit-details-marker { display: none; }
.gsc-can > summary b { color: var(--brown-800); }
.gsc-can > summary::before { content: '▸'; color: var(--brown-600); font-size: 12px; margin-right: var(--space-2); }
.gsc-can[open] > summary::before { content: '▾'; }
.gsc-can-meta { font-size: var(--font-size-xs); color: var(--text-subtle); white-space: nowrap; }
.gsc-can[open] { background: var(--brown-50); }
.gsc-can table { margin-top: var(--space-2); }

/* Editor modal */
.ed-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(28,24,18,.5); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; padding: var(--space-4); }
.ed-modal { width: 100%; max-width: 760px; max-height: 92vh; background: var(--surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-xl); display: flex; flex-direction: column; overflow: hidden; }
.ed-head { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--gray-100); }
.ed-head h3 { font-size: var(--font-size-md); font-weight: 700; }
.tc-close { width: 32px; height: 32px; border-radius: var(--radius-sm); font-size: 22px; line-height: 1; color: var(--gray-500); }
.tc-close:hover { background: var(--gray-100); color: var(--text); }
.ed-body { padding: var(--space-5); overflow-y: auto; display: flex; flex-direction: column; gap: var(--space-3); }
.ed-field { display: flex; flex-direction: column; gap: 4px; }
.ed-field > span { font-size: var(--font-size-xs); font-weight: 600; color: var(--text-muted); }
.ed-row { display: flex; gap: var(--space-3); }
.ed-row .ed-field { flex: 1; }
.ta { padding: var(--space-2) var(--space-3); height: auto; resize: vertical; font-family: inherit; line-height: 1.5; }
.ta--big { min-height: 320px; font-family: ui-monospace, "Cascadia Code", Consolas, monospace; font-size: 13px; }
.ed-foot { display: flex; justify-content: space-between; gap: var(--space-3); padding: var(--space-4) var(--space-5); border-top: 1px solid var(--gray-100); background: var(--surface-2); flex-wrap: wrap; }
.ed-foot-left, .ed-foot-right { display: flex; gap: var(--space-2); flex-wrap: wrap; align-items: center; }
.ymyl-warn { background: var(--danger-bg); color: var(--danger); padding: var(--space-3); border-radius: var(--radius-md); font-size: var(--font-size-sm); line-height: 1.5; }

/* Lưới chủ đề ứng viên (Xu Hướng) */
.cand-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--space-2); }
.cand { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-md); font-size: var(--font-size-sm); color: var(--text); cursor: pointer; transition: all var(--transition-fast); }
.cand:hover { background: var(--brown-50); }
.cand.on { background: var(--brown-50); border-color: var(--brown-400); color: var(--brown-800); font-weight: 600; }
.cand input { flex-shrink: 0; }

/* Tiến trình "Viết nháp" */
.gen-prog { background: var(--brown-50); border: 1px solid var(--brown-200); border-radius: var(--radius-md); padding: var(--space-4); }
.gen-prog-head { display: flex; align-items: center; gap: var(--space-2); }
.gen-prog-stage { flex: 1; font-size: var(--font-size-sm); font-weight: 600; color: var(--brown-800); }
.gen-prog-pct { font-size: var(--font-size-sm); font-weight: 800; color: var(--brown-700); font-variant-numeric: tabular-nums; }
.gen-bar { margin-top: var(--space-2); height: 8px; border-radius: var(--radius-full); background: var(--brown-100); overflow: hidden; }
.gen-bar-fill { height: 100%; border-radius: var(--radius-full); background: linear-gradient(90deg, var(--brown-500), var(--brown-700)); transition: width .35s ease; }
.gen-prog-note { margin-top: var(--space-2); font-size: var(--font-size-xs); color: var(--text-subtle); line-height: 1.5; }
.gen-spin { width: 16px; height: 16px; flex-shrink: 0; border: 2px solid var(--brown-200); border-top-color: var(--brown-600); border-radius: 50%; animation: gen-spin 0.8s linear infinite; }
@keyframes gen-spin { to { transform: rotate(360deg); } }

/* Tiến trình "Sinh ảnh minh hoạ (AI)" trong modal */
.img-prog { background: var(--brown-50); border: 1px solid var(--brown-200); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-2); }
.img-prog--done { background: var(--success-bg, #e8f5e9); border-color: #a5d6a7; }
.img-prog--done .img-prog-stage, .img-prog--done .img-prog-count { color: var(--success, #2e7d32); }
.img-prog--error { background: var(--danger-bg); border-color: var(--danger); }
.img-prog--error .img-prog-stage, .img-prog--error .img-prog-count { color: var(--danger); }
.img-prog--error .gen-prog-note { color: var(--text); }
.img-prog-head { display: flex; align-items: center; gap: var(--space-2); }
.img-prog-stage { flex: 1; font-size: var(--font-size-sm); font-weight: 600; color: var(--brown-800); }
.img-prog-count { font-size: var(--font-size-sm); font-weight: 800; color: var(--brown-700); font-variant-numeric: tabular-nums; }

.fade-enter-active, .fade-leave-active { transition: opacity var(--transition-base); }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Ảnh bìa preview + checklist kiểm duyệt */
.cover-prev { display: flex; align-items: center; gap: var(--space-3); }
.cover-prev-img {
  width: 160px; height: 84px; object-fit: cover; border-radius: var(--radius-md);
  border: 1px solid var(--brown-200); background: var(--brown-50); flex-shrink: 0;
}
.cover-prev-meta { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-1); min-width: 0; }
.cover-prev-path { font-size: var(--font-size-xs); color: var(--text-subtle); word-break: break-all; }
.cover-badge {
  display: inline-block; font-size: var(--font-size-xs); font-weight: 600;
  padding: 2px 8px; border-radius: var(--radius-sm); border: 1px solid transparent;
}
.cover-badge--ai { color: var(--brown-700); background: var(--cream-200, var(--brown-50)); border-color: var(--brown-300); }
.cover-badge--house { color: var(--text-subtle); background: var(--brown-50); border-color: var(--brown-200); }

.kd-box {
  margin: var(--space-3) 0; padding: var(--space-3); border: 1px solid var(--brown-200);
  border-radius: var(--radius-md); background: var(--brown-50);
}
.kd-box--ok { border-color: var(--success); background: color-mix(in srgb, var(--success) 8%, transparent); }
.kd-box legend { font-weight: 600; font-size: var(--font-size-sm); padding: 0 var(--space-2); }
.kd-box legend small { font-weight: 400; color: var(--text-subtle); }
.kd-item { display: flex; align-items: flex-start; gap: var(--space-2); padding: var(--space-1) 0; font-size: var(--font-size-sm); cursor: pointer; }
.kd-item input { margin-top: 3px; flex-shrink: 0; }
.kd-status { margin: var(--space-2) 0 0; font-size: var(--font-size-xs); font-weight: 600; }
.kd-status--ok { color: var(--success); }
.kd-status--warn { color: var(--warning); }
.kd-auto-btn { margin: 0 0 var(--space-2); }
.kd-auto-btn small { font-weight: 400; color: var(--text-subtle); }
.kd-report { list-style: none; margin: var(--space-2) 0 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-2); }
.kd-report-item {
  display: flex; flex-direction: column; gap: 2px; padding: var(--space-2);
  border-left: 3px solid var(--border); border-radius: var(--radius-sm);
  background: var(--gray-100); font-size: var(--font-size-xs);
}
.kd-report-item--ok { border-left-color: var(--success); }
.kd-report-item--warn { border-left-color: var(--warning); }
.kd-report-item--info { border-left-color: var(--brown-300); }
.kd-report-item strong { font-size: var(--font-size-sm); }
.kd-report-line { color: var(--text-muted); }

/* Overlay tiến trình khi Đăng */
.pub-card {
  width: min(440px, 92vw); background: var(--surface); border: 1px solid var(--brown-200);
  border-radius: var(--radius-lg); padding: var(--space-5); box-shadow: var(--shadow-lg);
  display: flex; flex-direction: column; gap: var(--space-3);
}
.pub-title { font-size: var(--font-size-lg); font-weight: 800; color: var(--brown-800); }
.pub-name { font-size: var(--font-size-sm); color: var(--text-muted); font-weight: 600; margin-top: calc(-1 * var(--space-2)); }
.pub-err { font-size: var(--font-size-sm); color: var(--danger); line-height: 1.5; }
.pub-foot { display: flex; align-items: center; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-2); }
.pub-hint { margin-right: auto; font-size: var(--font-size-xs); font-weight: 600; color: var(--warning); }

.hint-next { margin-top: var(--space-3); }

@media (max-width: 768px) {
  .add-form { flex-direction: column; align-items: stretch; }
  .inp--domain, .inp--ten { min-width: 0; }
}
@media (max-width: 560px) {
  .ed-row { flex-direction: column; gap: var(--space-2); }
}
</style>
