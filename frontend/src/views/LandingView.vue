<script setup lang="ts">
/**
 * LandingView — Trang chủ CÔNG KHAI (chưa cần đăng nhập).
 *
 * "Mặt tiền" giới thiệu phần mềm Y Học Cổ Truyền cho 3 nhóm người xem:
 *   • Sinh viên & giảng viên Y Học Cổ Truyền
 *   • Y sỹ, bác sỹ tại bệnh viện / phòng khám
 * Chiến thuật marketing: "nhá hàng" trực tiếp các tính năng thật ở chế độ CHỈ-XEM để hấp dẫn:
 *   • Đồ hình kinh lạc 3D — kéo xoay, xem đường kinh + huyệt, KHÔNG có công cụ chỉnh sửa.
 *   • Một bản kết quả đo kinh lạc mẫu (biểu đồ 12 đường kinh + gợi ý chẩn đoán).
 *   • Kho tri thức: vài bài thuốc / thể bệnh / pháp trị thật, phần còn lại "khoá" → mời đăng nhập.
 *
 * Trang nằm NGOÀI DashboardLayout (không có .content-area) nên tự viết Title Case.
 * Hiệu năng: hero dùng vòng CosmicWheel (SVG nhẹ); hình người 3D nặng đặt ở khu "Đồ Hình 3D" phía
 * dưới, tự lazy-load khi cuộn tới (kể cả trên điện thoại — vòng SVG chỉ là phương án dự phòng).
 */
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import CosmicWheel from '@/components/CosmicWheel.vue'
import HeroMeridianFigure from '@/components/HeroMeridianFigure.vue'
import BanXoayBienChung from '@/components/BanXoayBienChung.vue'
// Nạp ĐỘNG: chart.js (nặng) chỉ tải khi component phân tích bài thuốc thực sự được dựng,
// nên KHÔNG còn nằm trong chunk trang chủ → trang chủ tải nhẹ & nhanh hơn.
const BaiThuocAnalysis = defineAsyncComponent(() => import('@/components/BaiThuocAnalysis.vue'))
import { api } from '@/services/api'
import {
  rawUpper,
  rawLower,
  calculateBounds,
  processRows,
  computeDiagnosis,
  fmt,
  type InputData,
} from '@/lib/meridianAnalysis'

const router = useRouter()
const auth = useAuthStore()

// Đã đăng nhập rồi thì nút dẫn thẳng vào app; chưa thì ra trang đăng nhập.
const isAuthed = computed(() => auth.isAuthenticated)
const ctaLabel = computed(() => (isAuthed.value ? 'Vào Hệ Thống' : 'Đăng Nhập'))

function enter() {
  router.push({ name: isAuthed.value ? 'dashboard' : 'login' })
}
function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
// Mở một trang "xem thử" CÔNG KHAI (không cần đăng nhập): 3D, kết quả đo, bài thuốc.
function openDemo(name: 'xem-3d' | 'xem-ket-qua-do' | 'xem-bai-thuoc' | 'thu-vien') {
  router.push({ name })
}

// ── Phân tích bài thuốc THẬT, nhúng ngay trong section "Đo Kinh Lạc · Big Data"
// (lấy /demo/bai-thuoc, KHÔNG cần đăng nhập). Dùng lại ĐÚNG component phân tích thật
// (BaiThuocAnalysis): Tứ Khí + 3 radar + bảng Quân–Thần–Tá–Sứ — chỉ cần truyền nguyên bài thuốc.
const formulaLoading = ref(true)
const demoFormula = ref<any>(null)

onMounted(async () => {
  try {
    const res = await api.get<{ baiThuoc: any }>('/demo/bai-thuoc')
    demoFormula.value = res.baiThuoc
  } catch {
    // Backend chưa sẵn sàng → ẩn khối phân tích, giữ nguyên phần còn lại của trang.
  } finally {
    formulaLoading.value = false
  }
})

// Dựng hình người 3D trên MỌI màn hình (kể cả điện thoại) → luôn có vòng tròn % khi tải.
// Hình tự lazy-load khi cuộn tới khu "Đồ Hình 3D" (IntersectionObserver bên trong component) nên
// KHÔNG làm chậm lúc mới mở trang. Vòng SVG (nhánh v-else) chỉ còn là phương án dự phòng.
const showFigure = ref(true)

// ── "Nhá hàng" đồ hình 3D ──
const model3d = [
  'Xoay 360° — quan sát đường kinh từ mọi góc, ngay trên màn hình.',
  '14 đường kinh chính phát sáng cùng hệ thống huyệt vị định vị chính xác.',
  'Chế độ chỉ-xem: kéo để xoay, không lo chỉnh sửa nhầm dữ liệu.',
  'Giáo cụ trực quan cho học – giảng dạy và tra cứu tại phòng khám.',
]

// ── "Nhá hàng" kết quả đo kinh lạc — XOAY QUA NHIỀU CA THẬT (đã ẩn danh) ──
// Mỗi ca là số đo nhiệt độ 12 đường kinh (× trái/phải). Dùng CHUNG engine meridianAnalysis
// với trang đo thật (DemoKetQuaDoView): bảng chỉ số chi trên/chi dưới, ngưỡng, dấu +/0/− đều khớp app.
interface MeasureCase {
  id: string
  who: string // người bệnh đã ẩn danh (giới tính · tuổi)
  complaint: string // lý do tới khám
  input: InputData // 24 chỉ số nhiệt độ (12 kinh × trái/phải)
  theBenh: string
  phapTri: string
}

const measureCases: MeasureCase[] = [
  {
    id: 'Ca 01',
    who: 'Nữ · 42 Tuổi',
    complaint: 'Hay Cáu Gắt · Đầy Bụng · Chán Ăn',
    // Số đo thật trong ảnh — Can Khí Uất Kết · Tỳ Vị Hư Nhược
    input: {
      tieutruongtrai: 35.4,
      tieutruongphai: 34.0,
      tamtrai: 35.2,
      tamphai: 34.9,
      tamtieutrai: 35.2,
      tamtieuphai: 34.8,
      tambaotrai: 35.2,
      tambaophai: 35.0,
      daitrangtrai: 34.4,
      daitrangphai: 35.0,
      phetrai: 34.5,
      phephai: 34.9,
      bangquangtrai: 33.0,
      bangquangphai: 32.4,
      thantrai: 33.0,
      thanphai: 32.5,
      damtrai: 32.4,
      damphai: 32.4,
      vitrai: 33.0,
      viphai: 32.5,
      cantrai: 33.1,
      canphai: 33.4,
      tytrai: 33.2,
      typhai: 33.5,
    },
    theBenh: 'Can Khí Uất Kết · Tỳ Vị Hư Nhược',
    phapTri: 'Sơ Can Lý Khí · Kiện Tỳ Hoà Vị',
  },
  {
    id: 'Ca 02',
    who: 'Nam · 35 Tuổi',
    complaint: 'Mất Ngủ · Hồi Hộp · Lưng Gối Mỏi',
    // Tâm cường, Thận nhược — Tâm Thận Bất Giao · Âm Hư Hoả Vượng
    input: {
      tieutruongtrai: 34.6,
      tieutruongphai: 34.5,
      tamtrai: 35.6,
      tamphai: 35.4,
      tamtieutrai: 34.8,
      tamtieuphai: 34.7,
      tambaotrai: 35.3,
      tambaophai: 35.1,
      daitrangtrai: 34.5,
      daitrangphai: 34.6,
      phetrai: 34.7,
      phephai: 34.6,
      bangquangtrai: 33.2,
      bangquangphai: 33.1,
      thantrai: 32.6,
      thanphai: 32.5,
      damtrai: 33.3,
      damphai: 33.2,
      vitrai: 33.4,
      viphai: 33.3,
      cantrai: 33.5,
      canphai: 33.6,
      tytrai: 33.3,
      typhai: 33.2,
    },
    theBenh: 'Tâm Thận Bất Giao · Âm Hư Hoả Vượng',
    phapTri: 'Tư Âm Giáng Hoả · Giao Thông Tâm Thận',
  },
  {
    id: 'Ca 03',
    who: 'Nữ · 58 Tuổi',
    complaint: 'Dễ Cảm · Hụt Hơi · Ra Mồ Hôi Trộm',
    // Phế · Tỳ Vị nhược — Phế Tỳ Khí Hư · Vệ Khí Bất Cố
    input: {
      tieutruongtrai: 34.3,
      tieutruongphai: 34.2,
      tamtrai: 35.0,
      tamphai: 34.9,
      tamtieutrai: 34.3,
      tamtieuphai: 34.2,
      tambaotrai: 34.9,
      tambaophai: 35.0,
      daitrangtrai: 34.2,
      daitrangphai: 34.1,
      phetrai: 34.2,
      phephai: 34.3,
      bangquangtrai: 33.0,
      bangquangphai: 33.1,
      thantrai: 33.0,
      thanphai: 32.9,
      damtrai: 33.1,
      damphai: 33.0,
      vitrai: 32.6,
      viphai: 32.5,
      cantrai: 33.2,
      canphai: 33.1,
      tytrai: 32.6,
      typhai: 32.7,
    },
    theBenh: 'Phế Tỳ Khí Hư · Vệ Khí Bất Cố',
    phapTri: 'Bổ Phế Kiện Tỳ · Ích Khí Cố Biểu',
  },
]

const activeCase = ref(0)
const currentCase = computed(() => measureCases[activeCase.value])
function gotoCase(i: number) {
  activeCase.value = (i + measureCases.length) % measureCases.length
}

// Bảng kết quả đo (chi trên / chi dưới) + Bát Cương — chạy đúng engine của trang đo thật.
const upperStats = computed(() => calculateBounds(rawUpper(currentCase.value.input)))
const lowerStats = computed(() => calculateBounds(rawLower(currentCase.value.input)))
const upperRows = computed(() => processRows(rawUpper(currentCase.value.input), upperStats.value))
const lowerRows = computed(() => processRows(rawLower(currentCase.value.input), lowerStats.value))
const diag = computed(() =>
  computeDiagnosis(
    currentCase.value.input,
    upperRows.value,
    lowerRows.value,
    upperStats.value,
    lowerStats.value,
  ),
)
// Gộp 2 nhóm để render bảng bằng 1 vòng v-for (đỡ lặp markup).
const limbGroups = computed(() => [
  { label: 'Chi Trên (Tay)', rows: upperRows.value, stats: upperStats.value },
  { label: 'Chi Dưới (Chân)', rows: lowerRows.value, stats: lowerStats.value },
])
function signClass(sign: string): string {
  if (sign === '+') return 'mc-sign-hi'
  if (sign === '-') return 'mc-sign-lo'
  return 'mc-sign-ze'
}

const stats = [
  { value: '14', label: 'Đường Kinh Chính' },
  { value: '5.000+', label: 'Hồ Sơ Bệnh Nhân' },
  { value: '9.000+', label: 'Lần Đo Kinh Lạc' },
]

// ── Các mục trong Thư Viện · Từ Điển (mở miễn phí ở /thu-vien) ──
const libraryCats = [
  { icon: 'acu', title: 'Huyệt Vị · Châm Cứu', count: '1.058 Huyệt', desc: 'Vị trí, chủ trị, cách châm cứu và giải phẫu từng huyệt.' },
  { icon: 'meridian', title: 'Lý Thuyết Kinh Mạch', count: '12 Chính Kinh + 8 Mạch', desc: 'Đường vận hành, chủ trị, đồ hình và danh sách huyệt mỗi đường kinh.' },
  { icon: 'needle', title: 'Châm Cứu Trị Bệnh', count: '100 Bệnh', desc: 'Phác đồ châm cứu theo từng bệnh, công thức huyệt cụ thể.' },
  { icon: 'book', title: 'Bệnh Học', count: '99 Bệnh', desc: 'Bệnh học Đông Y, đối chiếu với bệnh danh hiện đại.' },
  { icon: 'source', title: 'Thư Mục Nguồn', count: '93 Nguồn', desc: 'Trích dẫn xuất xứ từ các y thư kinh điển.' },
]

// ── ② Cũ vs Mới — cú chuyển cảm xúc (cái vô hình → cái hữu hình) ──
const shiftOld = [
  'Kinh lạc nằm trong trí tưởng tượng',
  'Bắt mạch, chẩn bệnh bằng cảm nhận',
  'Kinh nghiệm truyền miệng, khó dạy lại',
  'Hồ sơ giấy, tra cứu mất hàng giờ',
]
const shiftNew = [
  'Kinh lạc xoay 360° ngay trên màn hình',
  'Đo ra con số — biểu đồ tự chỉ kinh cường, kinh nhược',
  'Tri thức chuẩn hoá, tra trong một giây',
  '5.000+ hồ sơ số hoá, tìm trong vài giây',
]

// ── ⑦ Thang giá trị — "Khám Phá Miễn Phí · Hành Nghề Có Phí" (khoá theo "của ai") ──
const ladderFree = [
  'Xoay đồ hình kinh lạc 3D, bay tới từng huyệt',
  'Tra cứu 1.058 huyệt · 12 kinh · 100 bệnh châm cứu',
  'Xem ca đo mẫu & phân tích bài thuốc thật',
  'Toàn bộ kho tri thức — không cần đăng nhập',
]
const ladderPaid = [
  'Đo & lưu kết quả cho chính bệnh nhân của bạn',
  'Hồ sơ, tiền sử, lịch sử điều trị tập trung',
  'Tự chẩn đoán trên dữ liệu thật của phòng khám',
  'Lịch hẹn, phân quyền nhân sự, an toàn dữ liệu',
]

// ── ⑧ Bằng chứng quy mô ──
const proof = [
  { value: '1.058', label: 'Huyệt Vị' },
  { value: '14', label: 'Đường Kinh Chính' },
  { value: '5.000+', label: 'Hồ Sơ Bệnh Nhân' },
  { value: '9.260', label: 'Lần Đo Kinh Lạc' },
  { value: '500+', label: 'Bài Thuốc' },
]

// ── ③ Bàn Xoay → Dữ Liệu Lớn ──
// Bàn xoay biện chứng cổ điển (中医辩证施治盘) nay là bàn xoay TƯƠNG TÁC chạy bằng dữ liệu thật —
// xem component BanXoayBienChung (tự lấy /demo/ban-xoay). Phần dưới chỉ còn 2 thẻ giải thích quan hệ.

// Hai loại quan hệ làm nên sức mạnh của số hoá — mỗi loại 1 chuỗi ví dụ Đông Y thật.
interface RelCard {
  tag: string
  title: string
  desc: string
  fan: boolean // true: một nguồn toả ra nhiều nhánh (n↔n); false: chuỗi nở dần (1→n)
  head: string
  nodes: string[]
}
const relCards: RelCard[] = [
  {
    tag: '1 → n',
    title: 'Một Dẫn Ra Nhiều',
    desc: 'Một Thể Bệnh mở ra nhiều Pháp Trị, mỗi Pháp Trị gọi nhiều Bài Thuốc, mỗi Bài Thuốc gồm nhiều Vị Thuốc — một chuỗi nở dần.',
    fan: false,
    head: 'Can Khí Uất Kết',
    nodes: ['Sơ Can Lý Khí', 'Tiêu Dao Tán', 'Sài Hồ · Bạch Thược · Đương Quy'],
  },
  {
    tag: 'n ↔ n',
    title: 'Nhiều Nối Nhiều',
    desc: 'Cùng một Triệu Chứng có thể thuộc nhiều Thể Bệnh; cùng một Vị Thuốc nằm trong nhiều Bài Thuốc — mạng lưới đan chéo hai chiều.',
    fan: true,
    head: 'Mất Ngủ',
    nodes: ['Tâm Thận Bất Giao', 'Can Hoả Thượng Viêm', 'Tâm Tỳ Lưỡng Hư'],
  },
]

// ── Học liệu: danh sách phát video Đông Y (kênh YouTube "Trang Trương") cho học viên tham khảo ──
// Nhúng trực tiếp trình phát playlist của YouTube (lazy-load) + liên kết mở toàn bộ trên YouTube.
interface Playlist {
  id: string
  title: string
  sub: string
}
const playlists: Playlist[] = [
  { id: 'PLoA7J_Cpj57WPJ9Z8aGnL6-yPUmiw8RDt', title: 'Lý Luận Cơ Bản Của Đông Y', sub: 'Âm Dương · Ngũ Hành · Tạng Phủ · Khí Huyết Tân Dịch' },
  { id: 'PLoA7J_Cpj57U4XrCRbvZOMMOuWUaWQGLa', title: 'Hoàng Đế Nội Kinh', sub: 'Kinh Điển Nền Tảng · Phim Tư Liệu CCTV' },
  { id: 'PLoA7J_Cpj57VDU_vhn0eUYJYSJeC50-uL', title: 'Thương Hàn Luận', sub: 'Lục Kinh Biện Chứng · G.S Hách Vạn Sơn Giảng' },
  { id: 'PLoA7J_Cpj57UsS4bfR9OuwQY29QDFgSls', title: 'Châm Cứu Đại Thành', sub: 'Đại Thành Châm Cứu · Huyệt Vị & Thủ Pháp' },
]
const ytPlaylist = (id: string) => `https://www.youtube-nocookie.com/embed/videoseries?list=${id}`
const ytPlaylistPage = (id: string) => `https://www.youtube.com/playlist?list=${id}`

// ── Câu hỏi thường gặp (hiển thị trên trang + FAQPage JSON-LD ở route-seo.json) ──
// LƯU Ý: nội dung câu trả lời phải KHỚP với FAQPage trong route-seo.json (Google yêu cầu
// schema trùng với nội dung hiển thị). Sửa ở đây thì sửa luôn bên route-seo.json.
const faqs: { q: string; a: string }[] = [
  {
    q: 'Phần mềm đo kinh lạc là gì?',
    a: 'Là công cụ số hoá phương pháp đo nhiệt độ 12 đường kinh tại các tỉnh huyệt, giúp lượng hoá kinh cường – kinh nhược và hỗ trợ biện chứng luận trị Đông Y. Đây là công cụ tham khảo, không thay thế chẩn đoán hoặc điều trị của thầy thuốc.',
  },
  {
    q: 'Dùng Kinh Lạc Trương Gia có mất phí không?',
    a: 'Kho tri thức, đồ hình kinh lạc 3D và bản đo mẫu được xem thử miễn phí, không cần đăng nhập.',
  },
  {
    q: 'Đo kinh lạc được thực hiện bằng cách nào?',
    a: 'Đo nhiệt độ tại 24 tỉnh huyệt ở chi trên và chi dưới; phần mềm dựng biểu đồ, so sánh kinh cường – kinh nhược, kết luận Bát Cương và gợi ý thể bệnh Đông Y.',
  },
  {
    q: 'Có đồ hình kinh lạc 3D không?',
    a: 'Có. Mô hình 3D tương tác hiển thị 12 đường kinh và hơn 1.000 huyệt vị; bạn có thể xoay, bấm vào huyệt để tra cứu và tìm kiếm bay tới huyệt, chạy trực tiếp trên trình duyệt.',
  },
  {
    q: 'Phần mềm phân tích bài thuốc Đông Y thế nào?',
    a: 'Phân tích bài thuốc theo Tứ Khí, Ngũ Vị, Quy Kinh và cấu trúc Quân – Thần – Tá – Sứ, trực quan hoá bằng biểu đồ radar để thấy xu hướng tính vị quy kinh của cả bài.',
  },
  {
    q: 'Thông tin trên website có thay thế việc khám bệnh không?',
    a: 'Không. Toàn bộ nội dung mang tính tham khảo và giáo dục. Khi có triệu chứng, bạn cần thăm khám và tư vấn trực tiếp bởi thầy thuốc Y Học Cổ Truyền có chuyên môn.',
  },
]
</script>

<template>
  <div class="landing">
    <!-- ============ Thanh điều hướng ============ -->
    <header class="lp-nav">
      <div class="lp-nav-inner">
        <div class="lp-brand" @click="scrollTo('top')">
          <svg width="34" height="34" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke="var(--brown-300)" stroke-width="2" />
            <path d="M32 12C32 12 20 22 20 32C20 38.627 25.373 44 32 44C38.627 44 44 38.627 44 32C44 22 32 12 32 12Z" fill="var(--brown-600)" />
            <circle cx="32" cy="32" r="4" fill="var(--white)" />
          </svg>
          <span class="lp-brand-text">Kinh Lạc Trương Gia</span>
        </div>
        <nav class="lp-nav-links">
          <button @click="scrollTo('model3d')">Đồ Hình 3D</button>
          <button @click="scrollTo('measure')">Kết Quả Đo</button>
          <button @click="scrollTo('phan-tich-bai-thuoc')">Phân Tích Bài Thuốc</button>
          <button @click="scrollTo('thu-vien')">Thư Viện</button>
          <button @click="scrollTo('hoc-lieu')">Học Liệu</button>
          <button @click="scrollTo('bang-gia')">Bảng Giá</button>
          <button @click="scrollTo('faq')">Hỏi Đáp</button>
        </nav>
        <button class="lp-btn lp-btn--primary" @click="enter">{{ ctaLabel }}</button>
      </div>
    </header>

    <!-- ============ Hero ============ -->
    <section class="lp-hero" id="top">
      <div class="lp-hero-inner">
        <div class="lp-hero-copy">
          <span class="lp-badge">Kinh Lạc Trương Gia · Phần Mềm Y Học Cổ Truyền · Học Tập & Lâm Sàng</span>
          <h1 class="lp-title">
            <span class="hl">Đông Y Nghìn Năm</span><br />Giờ Đọc Được Bằng Dữ Liệu
          </h1>
          <p class="lp-hero-sub">
            Đồ hình kinh lạc <strong>3D</strong>, kết quả đo hiện thành <strong>biểu đồ</strong>, kho tri thức <strong>1.058 huyệt</strong> — tự tay trải nghiệm ngay trên màn hình, không cần đăng nhập.
          </p>
          <div class="lp-cta-row">
            <button class="lp-btn lp-btn--primary lp-btn--lg" @click="openDemo('xem-3d')">Trải Nghiệm 3D Ngay →</button>
            <button class="lp-btn lp-btn--ghost-light lp-btn--lg" @click="openDemo('xem-ket-qua-do')">Xem Kết Quả Đo Thật</button>
            <button class="lp-btn lp-btn--ghost-light lp-btn--lg" @click="enter">{{ ctaLabel }}</button>
          </div>
          <ul class="lp-stats">
            <li v-for="s in stats" :key="s.label">
              <strong>{{ s.value }}</strong>
              <span>{{ s.label }}</span>
            </li>
          </ul>
          <p class="lp-hero-quote">Công Đức Và Trí Tuệ Của Tổ Tiên Đã Được Số Hoá Và Phát Huy Cho Mai Sau.</p>
        </div>

        <div class="lp-hero-art">
          <div class="lp-wheel"><CosmicWheel /></div>
        </div>
      </div>
    </section>

    <!-- ============ ② Bàn Xoay → Dữ Liệu Lớn (mở màn — hấp dẫn, bắt khách) ============ -->
    <section class="lp-dials" id="dials">
      <div class="lp-section-head">
        <span class="lp-eyebrow">Từ Bàn Xoay Đến Dữ Liệu</span>
        <h2 class="lp-h2">Vòng Xoay Biện Chứng - Trí Tuệ Cổ Nhân - Ngày Nay Có Big Data</h2>
        <p class="lp-section-sub">
          Bàn xoay cũ mỗi lần chỉ khớp được một cặp: Triệu Chứng – Tạng Phủ, Thể Bệnh – Bài Thuốc. Phần mềm gộp cả tủ đĩa thành một mạng dữ liệu — quan hệ <strong>1–n</strong>, <strong>n–n</strong> nối liền nhau, chạm một điểm là cả mạng sáng lên.
        </p>
      </div>

      <!-- Bàn xoay biện chứng THẬT: số hoá, chạy bằng dữ liệu DB, chạm để xoay & lọc sáng. -->
      <div class="lp-dials-live">
        <BanXoayBienChung />
      </div>

      <!-- Hai loại quan hệ: 1→n và n↔n -->
      <div class="dl-rels">
        <article v-for="c in relCards" :key="c.tag" class="dl-rel">
          <div class="dl-rel-head">
            <span class="dl-rel-tag">{{ c.tag }}</span>
            <h4 class="dl-rel-title">{{ c.title }}</h4>
          </div>
          <p class="dl-rel-desc">{{ c.desc }}</p>
          <div class="dl-rel-chain">
            <span class="dl-node dl-node--src">{{ c.head }}</span>
            <template v-if="c.fan">
              <span class="dl-rel-sep">↔</span>
              <span class="dl-fan">
                <span v-for="n in c.nodes" :key="n" class="dl-node">{{ n }}</span>
              </span>
            </template>
            <template v-else>
              <template v-for="n in c.nodes" :key="n">
                <span class="dl-rel-sep">→</span>
                <span class="dl-node">{{ n }}</span>
              </template>
            </template>
          </div>
        </article>
      </div>

      <!-- Cú đấm: 1 ↔ n ↔ n -->
      <div class="dl-punch">
        <span class="dl-punch-sym">1 ↔ n ↔ n</span>
        <p class="dl-punch-text">
          <strong>Bàn xoay chỉ khớp được một cặp mỗi lần.</strong> Cơ sở dữ liệu quan hệ giữ cả nghìn mối nối hai chiều: chạm vào một triệu chứng, phần mềm truy ngược tác nhân – tạng phủ – thể bệnh, rồi truy xuôi tới pháp trị và bài thuốc. <strong>Cả bộ bàn xoay, chạy trong một cú chạm.</strong>
        </p>
      </div>
    </section>

    <!-- ============ ③ Cũ vs Mới — cú chuyển ============ -->
    <section class="lp-shift">
      <div class="lp-section-head">
        <span class="lp-eyebrow">Cũ &amp; Mới</span>
        <h2 class="lp-h2">Học Đông Y Khó — Vì Cái Quan Trọng Nhất Lại Vô Hình.</h2>
        <p class="lp-section-sub">Khí, kinh, mạch đều không nhìn thấy. Phần mềm biến chúng thành mô hình, con số và biểu đồ — để ai cũng học được, dạy được, kiểm chứng được.</p>
      </div>
      <div class="lp-shift-grid">
        <article class="lp-shift-col lp-shift-col--old">
          <h3 class="lp-shift-title">Ngày Xưa</h3>
          <ul class="lp-shift-list">
            <li v-for="(s, i) in shiftOld" :key="i">{{ s }}</li>
          </ul>
        </article>
        <span class="lp-shift-arrow" aria-hidden="true">→</span>
        <article class="lp-shift-col lp-shift-col--new">
          <h3 class="lp-shift-title">Bây Giờ</h3>
          <ul class="lp-shift-list">
            <li v-for="(s, i) in shiftNew" :key="i">{{ s }}</li>
          </ul>
        </article>
      </div>
    </section>

    <!-- ============ Đồ hình 3D (điểm nhấn — xem trước CHỈ-XEM) ============ -->
    <section class="lp-model" id="model3d">
      <div class="lp-model-inner">
        <div class="lp-model-art">
          <!-- Khung "cửa sổ app" để giống ảnh chụp sản phẩm thật -->
          <div class="lp-stage">
            <div class="lp-stage-bar">
              <span class="lp-dot"></span><span class="lp-dot"></span><span class="lp-dot"></span>
              <span class="lp-stage-title">Đồ Hình Kinh Lạc 3D</span>
              <span class="lp-stage-badge">Chỉ Xem</span>
            </div>
            <div class="lp-stage-body">
              <div v-if="showFigure" class="lp-figure">
                <HeroMeridianFigure interactive show-points />
              </div>
              <div v-else class="lp-wheel lp-wheel--model"><CosmicWheel /></div>
            </div>
            <span v-if="showFigure" class="lp-stage-hint">Kéo để xoay · Bấm “Mở Đồ Hình 3D Đầy Đủ” để xem toàn bộ kinh – huyệt</span>
          </div>
        </div>
        <div class="lp-model-copy">
          <span class="lp-eyebrow lp-eyebrow--light">Chạm Thử · Không Cần Đăng Nhập</span>
          <h2 class="lp-h2 lp-h2--light">Lần Đầu Tiên, Bạn Nhìn Thấy Đường Kinh.</h2>
          <p class="lp-model-sub">
            14 đường kinh chính, hơn 1.000 huyệt vị định vị chính xác trên mô hình cơ thể 3D. Kéo để xoay, chạm để bay tới từng huyệt — cái vô hình giờ hiện rõ trước mắt.
          </p>
          <ul class="lp-checks">
            <li v-for="(p, i) in model3d" :key="i">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 111.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z" clip-rule="evenodd" /></svg>
              <span>{{ p }}</span>
            </li>
          </ul>
          <button class="lp-btn lp-btn--primary lp-btn--lg" @click="openDemo('xem-3d')">Mở Đồ Hình 3D Đầy Đủ →</button>
          <p class="lp-free-note">Miễn phí · Không cần đăng nhập · Đầy đủ danh sách kinh – huyệt &amp; bay tới huyệt</p>
        </div>
      </div>
    </section>

    <!-- ============ Kết quả đo kinh lạc — ĐỈNH "BIG DATA" (xoay nhiều ca thật) ============ -->
    <section class="lp-measure" id="measure">
      <div class="lp-section-head">
        <span class="lp-eyebrow">Đo Kinh Lạc · Big Data</span>
        <h2 class="lp-h2">Đo Nhiệt Độ Kinh Lạc, Cơ Thể Tự Kể Bạn Nghe Về Bệnh Của Mình.</h2>
        <p class="lp-section-sub">Đo nhiệt 12 đường kinh → phần mềm lập bảng chỉ số, đối chiếu ngưỡng sinh lý, rồi gợi ý thể bệnh và pháp trị <strong>để tham khảo</strong>. Đông Y, nhưng đọc bằng dữ liệu — kết quả hỗ trợ thầy thuốc biện chứng, không thay thế chẩn đoán.</p>
      </div>

      <!-- Dòng chảy 3 bước: Đo → Bảng chỉ số → Chẩn đoán -->
      <div class="mc-flow">
        <span class="mc-flow-step"><b>1</b> Đo Nhiệt 12 Đường Kinh</span>
        <span class="mc-flow-arrow">→</span>
        <span class="mc-flow-step"><b>2</b> Lập Bảng Chỉ Số · Đối Chiếu Ngưỡng</span>
        <span class="mc-flow-arrow">→</span>
        <span class="mc-flow-step mc-flow-step--accent"><b>3</b> Suy Ra Thể Bệnh · Pháp Trị</span>
      </div>

      <div class="lp-measure-card">
        <div class="mc-chart">
          <!-- Đầu thẻ: ca nào · ai (ẩn danh) · lý do khám + nút lật ca -->
          <div class="mc-casehead">
            <div class="mc-casemeta">
              <span class="mc-caseid">{{ currentCase.id }}</span>
              <span class="mc-casewho">{{ currentCase.who }}</span>
              <span class="mc-casecomplaint">{{ currentCase.complaint }}</span>
            </div>
            <div class="mc-casenav">
              <button class="mc-navbtn" @click="gotoCase(activeCase - 1)" aria-label="Ca trước">‹</button>
              <span class="mc-dots">
                <i v-for="(c, i) in measureCases" :key="c.id" :class="{ on: i === activeCase }" @click="gotoCase(i)"></i>
              </span>
              <button class="mc-navbtn" @click="gotoCase(activeCase + 1)" aria-label="Ca sau">›</button>
            </div>
          </div>

          <span class="lp-eyebrow">Kết Quả Đo</span>
          <div v-for="g in limbGroups" :key="g.label" class="mc-limb">
            <div class="mc-limb-name">{{ g.label }}</div>
            <div class="mc-stats">
              <div class="mc-st">
                <span class="mc-st-k">Max / Min</span>
                <span class="mc-st-v">{{ fmt(g.stats.max, 1) }} / {{ fmt(g.stats.min, 1) }}</span>
              </div>
              <div class="mc-st">
                <span class="mc-st-k">Biên Độ</span>
                <span class="mc-st-v">{{ fmt(g.stats.range, 1) }}</span>
              </div>
              <div class="mc-st">
                <span class="mc-st-k">Bình Quân</span>
                <span class="mc-st-v">{{ fmt(g.stats.mean, 2) }}</span>
              </div>
              <div class="mc-st">
                <span class="mc-st-k">Sai Số</span>
                <span class="mc-st-v">{{ fmt(g.stats.sd, 2) }}</span>
              </div>
              <div class="mc-st">
                <span class="mc-st-k">Ngưỡng Trên / Dưới</span>
                <span class="mc-st-v">{{ fmt(g.stats.upperBound, 2) }} / {{ fmt(g.stats.lowerBound, 2) }}</span>
              </div>
            </div>
            <div class="mc-tbl-wrap">
              <table class="mc-tbl">
                <thead>
                  <tr>
                    <th>Kinh</th>
                    <th>T</th>
                    <th>Trái</th>
                    <th>TB</th>
                    <th>Lệch</th>
                    <th>Phải</th>
                    <th>P</th>
                    <th>|T−P|</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, i) in g.rows" :key="g.label + i">
                    <td class="mc-tbl-name">{{ r.name }}</td>
                    <td :class="signClass(r.leftSign)">{{ r.leftSign }}</td>
                    <td>{{ fmt(r.left, 1) }}</td>
                    <td class="mc-tbl-avg">{{ fmt(r.avg, 2) }}</td>
                    <td :class="r.diff > 0 ? 'mc-sign-hi' : r.diff < 0 ? 'mc-sign-lo' : ''">
                      {{ r.diff > 0 ? '+' : '' }}{{ fmt(r.diff, 2) }}
                    </td>
                    <td>{{ fmt(r.right, 1) }}</td>
                    <td :class="signClass(r.rightSign)">{{ r.rightSign }}</td>
                    <td>{{ fmt(r.absDiff, 1) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <p class="mc-tablenote">
            <span class="mc-sign-hi">+</span> Cao (Thực) · <span class="mc-sign-lo">−</span> Thấp (Hư) ·
            <span class="mc-sign-ze">0</span> Trong Ngưỡng. Ngưỡng = bình quân ± sai số (biên độ ÷ 6).
          </p>
        </div>

        <aside class="mc-readout">
          <span class="lp-eyebrow">Phần Mềm Tự Đọc</span>
          <div class="mc-batcuong">
            <span class="mc-bc"><b>Âm / Dương</b>{{ diag.amDuong || '—' }}</span>
            <span class="mc-bc"><b>Khí</b>{{ diag.khi || '—' }}</span>
            <span class="mc-bc"><b>Huyết</b>{{ diag.huyet || '—' }}</span>
          </div>
          <dl class="mc-dx">
            <div>
              <dt>Thể Bệnh</dt>
              <dd>{{ currentCase.theBenh }}</dd>
            </div>
            <div>
              <dt>Pháp Trị</dt>
              <dd>{{ currentCase.phapTri }}</dd>
            </div>
          </dl>
          <p class="mc-note">Lật qua từng ca để thấy mỗi người một bảng chỉ số, một thể bệnh khác nhau. Đây là số liệu từ ca đo thật — bấm bên dưới để mở một bản đo đầy đủ đã ẩn danh.</p>
          <div class="mc-actions">
            <button class="lp-btn lp-btn--primary mc-cta" @click="openDemo('xem-ket-qua-do')">Xem Kết Quả Đo Thật →</button>
            <button class="mc-unlock" @click="enter">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" /></svg>
              <span>Đo Cho Bệnh Nhân Của Bạn</span>
            </button>
          </div>
        </aside>
      </div>

      <!-- Cú đấm "Big Data" -->
      <div class="mc-bigdata">
        <span class="mc-bigdata-num">9.260</span>
        <p class="mc-bigdata-text">
          <strong>Mỗi lần đo là một điểm dữ liệu.</strong> Hơn chín nghìn lần đo kinh lạc dạy phần mềm nhận ra đâu là sinh lý bình thường, đâu là dấu hiệu bệnh lý — đó là Đông Y <strong>đọc được bằng dữ liệu</strong>.
        </p>
      </div>

      <!-- Phân tích bài thuốc THẬT — nhúng ngay trên landing, xem không cần đăng nhập -->
      <div v-if="!formulaLoading && demoFormula" id="phan-tich-bai-thuoc" class="lp-bt">
        <div class="lp-bt-head">
          <div class="lp-bt-headtext">
            <span class="lp-bt-eyebrow">Bài Thuốc Cho Bệnh Tây Y · Phân Tích Bằng Đông Y</span>
            <h3 class="lp-bt-title">Phân Tích “{{ demoFormula.ten_bai_thuoc }}” Theo Tính Vị Quy Kinh</h3>
            <p v-if="demoFormula.nguon_goc" class="lp-bt-source">Nguồn Gốc: {{ demoFormula.nguon_goc }}</p>
          </div>
          <button class="lp-btn lp-btn--primary" @click="openDemo('xem-bai-thuoc')">Mở Phân Tích Đầy Đủ →</button>
        </div>

        <BaiThuocAnalysis :bai-thuoc="demoFormula" />

        <p class="lp-bt-note">Phần mềm soi bài thuốc qua Tứ Khí · Ngũ Vị · Quy Kinh · Thăng–Giáng–Phù–Trầm và vai trò <strong>Quân · Thần · Tá · Sứ</strong> — đồng thời chỉ rõ <strong>bài thuốc này dùng cho bệnh Tây Y nào</strong> (xem phần Tổng Hợp). Phân tích THẬT, xem trực tiếp không cần đăng nhập.</p>
      </div>
    </section>

    <!-- ============ Thư viện · Từ Điển (mở miễn phí — giới thiệu + lối vào /thu-vien) ============ -->
    <section class="lp-library" id="thu-vien">
      <div class="lp-section-head">
        <span class="lp-eyebrow">Thư Viện · Từ Điển</span>
        <h2 class="lp-h2">Từ Điển Đông Y — Tra Cứu Miễn Phí Toàn Diện</h2>
        <p class="lp-section-sub">
          Toàn bộ kho tri thức huyệt vị, kinh mạch, châm cứu trị bệnh và bệnh học — mở đầy đủ cho mọi người, không cần đăng nhập.
        </p>
      </div>

      <div class="lp-lib-grid">
        <article v-for="c in libraryCats" :key="c.title" class="lp-lib-card">
          <span class="lp-lib-ic">
            <svg v-if="c.icon === 'acu'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" /><path stroke-linecap="round" d="M12 3v3M12 18v3M3 12h3M18 12h3" /></svg>
            <svg v-else-if="c.icon === 'meridian'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
            <svg v-else-if="c.icon === 'needle'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 20.5L3.5 13.5a5 5 0 017.07-7.07l7 7a5 5 0 01-7.07 7.07z" /><path stroke-linecap="round" stroke-linejoin="round" d="M8.5 8.5l7 7" /></svg>
            <svg v-else-if="c.icon === 'book'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2zM12 6.5v13" /></svg>
            <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
          </span>
          <div class="lp-lib-text">
            <h3 class="lp-lib-title">{{ c.title }}</h3>
            <span class="lp-lib-count">{{ c.count }}</span>
            <p class="lp-lib-desc">{{ c.desc }}</p>
          </div>
        </article>
      </div>

      <div class="lp-lib-cta">
        <button class="lp-btn lp-btn--primary lp-btn--lg" @click="openDemo('thu-vien')">Mở Thư Viện Tra Cứu →</button>
        <!-- Link <a href> THẬT tới 2 trang hub tĩnh (Google bò được, khác button JS): đường vào /huyet/ /kinh/ -->
        <div class="lp-lib-links">
          <a class="lp-btn lp-btn--ghost lp-btn--lg" href="/huyet/">Tra Cứu 1.058 Huyệt →</a>
          <a class="lp-btn lp-btn--ghost lp-btn--lg" href="/kinh/">12 Đường Kinh &amp; Đồ Hình →</a>
        </div>
        <p class="lp-lib-note">Miễn phí · Không cần đăng nhập · Tra cứu &amp; xem huyệt trong 3D ngay</p>
      </div>
    </section>

    <!-- ============ ⑦ Thang giá trị — Khám Phá Miễn Phí · Hành Nghề Có Phí ============ -->
    <section class="lp-ladder" id="bang-gia">
      <div class="lp-section-head">
        <span class="lp-eyebrow">Miễn Phí &amp; Có Phí</span>
        <h2 class="lp-h2">Học Thì Miễn Phí. Hành Nghề Mới Tính Phí.</h2>
        <p class="lp-section-sub">Xem thoải mái, không cần đăng ký. Chỉ trả phí khi bạn đo và lưu hồ sơ cho bệnh nhân của mình.</p>
      </div>
      <div class="lp-ladder-grid">
        <article class="lp-ladder-col">
          <header class="lp-ladder-head">
            <span class="lp-ladder-tag lp-ladder-tag--free">Miễn Phí</span>
            <h3 class="lp-ladder-name">Khám Phá</h3>
            <p class="lp-ladder-cap">Toàn bộ kho tri thức — không cần đăng nhập</p>
          </header>
          <ul class="lp-ladder-list">
            <li v-for="(it, i) in ladderFree" :key="i">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 111.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z" clip-rule="evenodd" /></svg>
              <span>{{ it }}</span>
            </li>
          </ul>
          <button class="lp-btn lp-btn--ghost lp-btn--lg lp-ladder-cta" @click="openDemo('xem-3d')">Bắt Đầu Miễn Phí</button>
        </article>
        <article class="lp-ladder-col lp-ladder-col--paid">
          <header class="lp-ladder-head">
            <span class="lp-ladder-tag lp-ladder-tag--paid">Có Phí</span>
            <h3 class="lp-ladder-name">Hành Nghề</h3>
            <p class="lp-ladder-cap">Dùng trên chính bệnh nhân của bạn</p>
          </header>
          <ul class="lp-ladder-list">
            <li v-for="(it, i) in ladderPaid" :key="i">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 111.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z" clip-rule="evenodd" /></svg>
              <span>{{ it }}</span>
            </li>
          </ul>
          <button class="lp-btn lp-btn--primary lp-btn--lg lp-ladder-cta" @click="enter">{{ ctaLabel }} →</button>
        </article>
      </div>
    </section>

    <!-- ============ ⑧ Bằng chứng quy mô ============ -->
    <section class="lp-proof">
      <div class="lp-proof-inner">
        <ul class="lp-proof-stats">
          <li v-for="p in proof" :key="p.label">
            <strong>{{ p.value }}</strong>
            <span>{{ p.label }}</span>
          </li>
        </ul>
        <p class="lp-proof-foot">Công Đức Và Trí Tuệ Của Tổ Tiên Đã Được Số Hoá Và Phát Huy Cho Mai Sau.</p>
      </div>
    </section>

    <!-- ============ Nguồn gốc & Tin cậy (E-E-A-T / YMYL) ============ -->
    <section class="lp-trust" id="nguon-goc">
      <div class="lp-section-head">
        <span class="lp-eyebrow">Nguồn Gốc &amp; Tin Cậy</span>
        <h2 class="lp-h2">Ai Đứng Sau Kinh Lạc?</h2>
        <p class="lp-section-sub">Một sản phẩm Y tế cần minh bạch về người thực hiện và nguồn tri thức. Đây là những gì đứng sau nền tảng.</p>
      </div>
      <div class="lp-trust-grid">
        <article class="lp-trust-card">
          <span class="lp-trust-ico" aria-hidden="true">👤</span>
          <h3 class="lp-trust-title">Người Thực Hiện</h3>
          <p class="lp-trust-text">
            <strong>Trương Đình Trang</strong> — Y Sỹ Y Học Cổ Truyền (đang theo học), sáng lập
            <strong>Kinh Lạc Trương Gia</strong>. Nội dung Y khoa được biên soạn và rà soát, đối chiếu y văn cổ truyền.
          </p>
        </article>
        <article class="lp-trust-card">
          <span class="lp-trust-ico" aria-hidden="true">📖</span>
          <h3 class="lp-trust-title">Cảm Hứng Học Thuật</h3>
          <p class="lp-trust-text">
            Tính năng đo kinh lạc lấy cảm hứng từ cuốn <strong>"Biện Chứng Luận Trị"</strong> của lương y
            <strong>Lê Văn Sửu</strong>. Phần lớn nền tảng là công trình phát triển riêng — đo kinh lạc chỉ là một tính năng nhỏ.
          </p>
        </article>
        <article class="lp-trust-card">
          <span class="lp-trust-ico" aria-hidden="true">🛡️</span>
          <h3 class="lp-trust-title">Cam Kết An Toàn</h3>
          <p class="lp-trust-text">
            Mọi nội dung chỉ mang tính <strong>tham khảo &amp; học tập</strong>, không thay thế việc thăm khám,
            chẩn đoán hay điều trị của thầy thuốc/bác sỹ có chuyên môn.
          </p>
        </article>
      </div>
      <nav class="lp-trust-links" aria-label="Trang thông tin & pháp lý">
        <a href="/ve-chung-toi">Về Chúng Tôi</a>
        <a href="/quy-trinh-bien-tap">Quy Trình Biên Tập</a>
        <a href="/chinh-sach-bao-mat">Chính Sách Bảo Mật</a>
        <a href="/dieu-khoan">Điều Khoản</a>
      </nav>
    </section>

    <!-- ============ Lời kêu gọi ============ -->
    <section class="lp-cta">
      <div class="lp-cta-inner">
        <h2 class="lp-cta-title">Đông Y Của Bạn, Bắt Đầu Từ Một Cú Xoay.</h2>
        <p class="lp-cta-sub">Tự tay trải nghiệm toàn bộ — miễn phí, không cần đăng nhập. Thích thì hãy đưa bệnh nhân của bạn vào.</p>
        <div class="lp-cta-row lp-cta-row--center">
          <button class="lp-btn lp-btn--primary lp-btn--lg" @click="openDemo('xem-3d')">Trải Nghiệm 3D Ngay →</button>
          <button class="lp-btn lp-btn--ghost-light lp-btn--lg" @click="enter">{{ ctaLabel }}</button>
        </div>
      </div>
    </section>

    <!-- ============ Học liệu — danh sách phát Đông Y (cho học viên học & tham khảo) ============ -->
    <section class="lp-learn" id="hoc-lieu">
      <div class="lp-section-head">
        <span class="lp-eyebrow">Học Liệu</span>
        <h2 class="lp-h2">Danh Sách Phát Đông Y — Học Và Tham Khảo</h2>
        <p class="lp-section-sub">Tuyển tập video bài giảng và kinh điển Đông Y cho học viên, sinh viên và người mới — xem ngay tại đây hoặc mở toàn bộ trên YouTube.</p>
      </div>

      <div class="lp-learn-grid">
        <article v-for="p in playlists" :key="p.id" class="lp-learn-card">
          <div class="lp-learn-frame">
            <iframe
              :src="ytPlaylist(p.id)"
              :title="p.title"
              loading="lazy"
              frameborder="0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
            ></iframe>
          </div>
          <div class="lp-learn-text">
            <h3 class="lp-learn-title">{{ p.title }}</h3>
            <p class="lp-learn-sub">{{ p.sub }}</p>
            <a class="lp-learn-link" :href="ytPlaylistPage(p.id)" target="_blank" rel="noopener noreferrer">Xem Toàn Bộ Trên YouTube →</a>
          </div>
        </article>
      </div>

      <p class="lp-learn-note">Nguồn video thuộc kênh YouTube “Trang Trương” · chỉ dùng cho mục đích học tập &amp; tham khảo.</p>
    </section>

    <!-- ============ Câu Hỏi Thường Gặp (FAQ · AEO) ============ -->
    <section class="lp-faq" id="faq">
      <div class="lp-section-head">
        <span class="lp-eyebrow">Hỏi &amp; Đáp</span>
        <h2 class="lp-h2">Câu Hỏi Thường Gặp</h2>
        <p class="lp-section-sub">Những thắc mắc phổ biến về phần mềm đo kinh lạc và Y Học Cổ Truyền số hoá.</p>
      </div>
      <div class="lp-faq-list">
        <details v-for="(f, i) in faqs" :key="i" class="lp-faq-item" :open="i === 0">
          <summary class="lp-faq-q">{{ f.q }}</summary>
          <p class="lp-faq-a">{{ f.a }}</p>
        </details>
      </div>
    </section>

    <!-- ============ Chân trang ============ -->
    <footer class="lp-footer">
      <div class="lp-footer-inner">
        <div class="lp-brand lp-brand--footer">
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke="rgba(255,255,255,.3)" stroke-width="2" />
            <path d="M32 12C32 12 20 22 20 32C20 38.627 25.373 44 32 44C38.627 44 44 38.627 44 32C44 22 32 12 32 12Z" fill="rgba(255,255,255,.9)" />
            <circle cx="32" cy="32" r="4" fill="var(--brown-700)" />
          </svg>
          <span class="lp-brand-text">Kinh Lạc Trương Gia</span>
        </div>
        <nav class="lp-footer-nav">
          <a href="/blog/">Cẩm Nang</a>
          <a href="/thu-vien">Từ Điển</a>
          <a href="/xem-3d">Đồ Hình 3D</a>
          <a href="/xem-ket-qua-do">Đo Kinh Lạc</a>
          <a href="/xem-bai-thuoc">Bài Thuốc</a>
        </nav>
        <nav class="lp-footer-nav lp-footer-nav--legal" aria-label="Thông tin & pháp lý">
          <a href="/ve-chung-toi">Về Chúng Tôi</a>
          <a href="/lien-he">Liên Hệ</a>
          <a href="/chinh-sach-bao-mat">Chính Sách Bảo Mật</a>
          <a href="/dieu-khoan">Điều Khoản</a>
          <a href="/quy-trinh-bien-tap">Quy Trình Biên Tập</a>
        </nav>
        <p class="lp-footer-disclaimer">
          <strong>Miễn trừ y tế:</strong> Nội dung trên website chỉ mang tính tham khảo &amp; học tập,
          không thay thế việc thăm khám, chẩn đoán hay điều trị của thầy thuốc/bác sỹ có chuyên môn.
        </p>
        <p class="lp-footer-note">Kinh Lạc Trương Gia · Phần Mềm Y Học Cổ Truyền · © 2026 · kinhlac.online</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  background: var(--bg-app);
  color: var(--text);
  overflow-x: hidden;
  /* Di truyền xuống MỌI đoạn chữ con: trình duyệt tự tránh để 1 từ rớt lẻ loi
     xuống dòng cuối (orphan). Heading được đặt riêng `text-wrap: balance` để chia
     dòng cân nhau — declaration riêng đó sẽ đè lên giá trị di truyền này. */
  text-wrap: pretty;
}

/* ---------- Câu hỏi thường gặp (FAQ) ---------- */
.lp-faq {
  max-width: 880px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
}
.lp-faq-list {
  margin-top: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.lp-faq-item {
  background: var(--surface, #fff);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
}
.lp-faq-item[open] {
  border-color: var(--brown-300);
  box-shadow: 0 6px 18px rgba(var(--primary-rgb), 0.08);
}
.lp-faq-q {
  list-style: none;
  cursor: pointer;
  font-weight: 700;
  font-size: var(--font-size-base);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
.lp-faq-q::-webkit-details-marker { display: none; }
.lp-faq-q::after {
  content: '+';
  font-size: 1.4em;
  font-weight: 400;
  line-height: 1;
  color: var(--brown-600);
  transition: transform var(--transition-fast);
}
.lp-faq-item[open] .lp-faq-q::after { transform: rotate(45deg); }
.lp-faq-a {
  margin: var(--space-3) 0 0;
  color: var(--text-muted, #555);
  line-height: 1.7;
}

/* ---------- Nút chung ---------- */
.lp-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 40px;
  padding: 0 var(--space-5);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
  white-space: nowrap;
}
.lp-btn--lg {
  height: 50px;
  padding: 0 var(--space-6);
  font-size: var(--font-size-base);
  border-radius: var(--radius-lg);
}
.lp-btn--primary {
  background: linear-gradient(135deg, var(--brown-600) 0%, var(--brown-700) 100%);
  color: var(--white);
  box-shadow: 0 6px 18px rgba(var(--primary-rgb), 0.28);
}
.lp-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 26px rgba(var(--primary-rgb), 0.38);
}
.lp-btn--ghost-light {
  background: rgba(255, 255, 255, 0.1);
  color: var(--white);
  border: 1px solid rgba(255, 255, 255, 0.28);
}
.lp-btn--ghost-light:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: translateY(-2px);
}
.lp-link-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--brown-600);
  transition: color var(--transition-fast);
}
.lp-link-btn:hover {
  color: var(--brown-800);
}

/* ---------- Thanh điều hướng ---------- */
.lp-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(250, 246, 239, 0.82);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}
.lp-nav-inner {
  max-width: 1180px;
  margin: 0 auto;
  height: 68px;
  padding: 0 var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-6);
}
.lp-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
}
.lp-brand-text {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--brown-800);
  letter-spacing: -0.01em;
}
.lp-nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-left: auto;
}
.lp-nav-links button {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-muted);
  transition: color var(--transition-fast), background var(--transition-fast);
}
.lp-nav-links button:hover {
  color: var(--brown-700);
  background: var(--brown-50);
}

/* ---------- Hero ---------- */
.lp-hero {
  position: relative;
  background: linear-gradient(135deg, var(--brown-700) 0%, var(--brown-900) 100%);
  color: var(--white);
  overflow: hidden;
}
.lp-hero::before {
  content: '';
  position: absolute;
  top: -30%;
  right: -8%;
  width: 520px;
  height: 520px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 70%);
  pointer-events: none;
}
.lp-hero-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--space-16) var(--space-6);
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  align-items: center;
  gap: var(--space-10);
}
.lp-hero-copy {
  position: relative;
  z-index: 1;
  min-width: 0;
}
.lp-badge {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--brown-100);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.16);
  padding: 6px 14px;
  border-radius: var(--radius-full);
  margin-bottom: var(--space-5);
}
.lp-title {
  font-size: clamp(2rem, 1.4rem + 2.8vw, 3.1rem);
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.02em;
  margin-bottom: var(--space-5);
  text-wrap: balance;
}
.lp-title .hl {
  color: var(--brown-200);
}
.lp-hero-sub {
  font-size: var(--font-size-lg);
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.8);
  max-width: 34rem;
  margin-bottom: var(--space-8);
}
.lp-hero-sub strong {
  color: var(--brown-100);
  font-weight: 700;
}
.lp-cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-bottom: var(--space-10);
}
.lp-stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
}
.lp-stats li {
  display: flex;
  flex-direction: column;
  list-style: none;
}
.lp-stats strong {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--white);
  line-height: 1.1;
}
.lp-stats span {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
}
.lp-hero-quote {
  margin-top: var(--space-6);
  /* Giữ câu trên ĐÚNG 1 dòng ở desktop; cỡ chữ nhỏ hơn 1 nấc cho vừa cột trái của Hero. */
  font-size: var(--font-size-sm);
  font-style: italic;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.78);
  white-space: nowrap;
}
/* Màn hình hẹp (gồm điện thoại): cột thu lại, cho phép xuống dòng & chia cân
   để câu không bị tràn ngang / cụt chữ. */
@media (max-width: 1100px) {
  .lp-hero-quote {
    white-space: normal;
    text-wrap: balance;
    max-width: 42rem;
  }
}
.lp-hero-art {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 340px;
}
.lp-wheel {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(260px, 30vw, 400px);
}

/* ---------- Đồ hình 3D (band tối để đường kinh phát sáng nổi lên) ---------- */
.lp-model {
  background: linear-gradient(140deg, var(--brown-800) 0%, #1a0f05 100%);
  color: var(--white);
  position: relative;
  overflow: hidden;
}
.lp-model-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--space-16) var(--space-6);
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: var(--space-10);
}
.lp-model-art {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* Khung "cửa sổ app" */
.lp-stage {
  width: 100%;
  max-width: 460px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}
.lp-stage-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 10px var(--space-4);
  background: rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.lp-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.28);
}
.lp-stage-title {
  margin-left: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}
.lp-stage-badge {
  margin-left: auto;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--brown-100);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 3px 10px;
  border-radius: var(--radius-full);
}
.lp-stage-body {
  position: relative;
  height: clamp(360px, 44vw, 480px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.lp-figure {
  position: relative;
  width: 100%;
  height: 100%;
}
.lp-wheel--model {
  opacity: 0.92;
}
.lp-stage-hint {
  display: block;
  text-align: center;
  padding: 8px var(--space-4) 12px;
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.6);
}
.lp-model-copy {
  position: relative;
  z-index: 1;
  min-width: 0;
}
.lp-model-sub {
  font-size: var(--font-size-lg);
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: var(--space-6);
}
.lp-checks {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}
.lp-checks li {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  list-style: none;
  font-size: var(--font-size-base);
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}
.lp-checks svg {
  flex-shrink: 0;
  margin-top: 3px;
  color: var(--brown-200);
}
.lp-free-note {
  margin-top: var(--space-3);
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.62);
}

/* ---------- Khối section chung ---------- */
.lp-section,
.lp-measure,
.lp-knowledge,
.lp-audience {
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--space-16) var(--space-6);
}
.lp-measure,
.lp-knowledge {
  max-width: none;
}
.lp-measure {
  background: var(--surface-2);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.lp-measure > .lp-section-head,
.lp-measure > .mc-flow,
.lp-measure > .lp-measure-card,
.lp-measure > .mc-bigdata,
.lp-measure > .lp-bt,
.lp-knowledge > .lp-section-head,
.lp-knowledge > .lp-flow,
.lp-knowledge > .lp-k-grid,
.lp-knowledge > .lp-bt {
  max-width: 1180px;
  margin-left: auto;
  margin-right: auto;
}
.lp-section-head {
  text-align: center;
  /* Rộng hơn để tiêu đề dài (vd "Học Đông Y Khó — Vì Cái Quan Trọng Nhất Lại Vô Hình.")
     nằm gọn 1 dòng trên màn hình lớn, không bị rớt 1 chữ lẻ xuống dòng. */
  max-width: min(64rem, 100%);
  margin: 0 auto var(--space-12);
}
.lp-eyebrow {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--brown-600);
  margin-bottom: var(--space-3);
}
.lp-eyebrow--light {
  color: var(--brown-200);
}
.lp-h2 {
  font-size: var(--font-size-3xl);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--text);
  margin-bottom: var(--space-3);
  /* Khi màn hình hẹp buộc phải xuống dòng thì chia 2 dòng cân nhau,
     không để 1 chữ rớt lẻ loi xuống dòng cuối. */
  text-wrap: balance;
}
.lp-h2--light {
  color: var(--white);
  margin-bottom: var(--space-4);
}
.lp-section-sub {
  font-size: var(--font-size-base);
  color: var(--text-muted);
  line-height: 1.7;
  /* Phần mô tả giữ độ rộng vừa đọc (hẹp hơn tiêu đề) và căn giữa. */
  max-width: 46rem;
  margin-left: auto;
  margin-right: auto;
  text-wrap: pretty;
}

/* ---------- Kết quả đo kinh lạc ---------- */
.lp-measure-card {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: var(--space-8);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-8);
}
/* Bảng kết quả đo kinh lạc (chi trên / chi dưới) — định dạng giống trang đo thật */
.mc-limb {
  margin-top: var(--space-4);
}
.mc-limb-name {
  font-size: var(--font-size-sm);
  font-weight: 800;
  color: var(--brown-700);
  margin-bottom: var(--space-2);
}
.mc-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.mc-st {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-2);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  text-align: center;
}
.mc-st-k {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--text-subtle);
}
.mc-st-v {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text-brand);
  font-variant-numeric: tabular-nums;
}
.mc-tbl-wrap {
  overflow-x: auto;
}
.mc-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
}
.mc-tbl th {
  background: var(--surface-2);
  color: var(--brown-700);
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 5px 6px;
  text-align: center;
  border: 1px solid var(--border);
  white-space: nowrap;
}
.mc-tbl td {
  padding: 5px 6px;
  text-align: center;
  border: 1px solid var(--border);
  white-space: nowrap;
}
.mc-tbl-name {
  font-weight: 700;
  color: var(--text);
  text-align: left !important;
}
.mc-tbl-avg {
  background: var(--surface-2);
  font-weight: 600;
}
.mc-sign-hi {
  color: var(--danger-fg);
  font-weight: 800;
}
.mc-sign-lo {
  color: var(--info-fg);
  font-weight: 800;
}
.mc-sign-ze {
  color: var(--text-subtle);
  font-weight: 700;
}
.mc-tablenote {
  margin-top: var(--space-4);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  line-height: 1.6;
}
.mc-tablenote .mc-sign-hi,
.mc-tablenote .mc-sign-lo,
.mc-tablenote .mc-sign-ze {
  margin: 0 1px;
}

.mc-readout {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  align-self: start;
}
.mc-batcuong {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}
.mc-bc {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: var(--space-3) var(--space-2);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text-brand);
  text-transform: capitalize;
}
.mc-bc b {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--text-subtle);
}
.mc-dx {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}
.mc-dx dt {
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-subtle);
  margin-bottom: 2px;
}
.mc-dx dd {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-brand);
}
.mc-note {
  font-size: var(--font-size-xs);
  color: var(--text-subtle);
  line-height: 1.6;
  margin-bottom: var(--space-4);
}
.mc-cta {
  width: 100%;
  justify-content: center;
}

/* Dòng chảy 3 bước: Đo → Biểu đồ → Chẩn đoán */
.mc-flow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}
.mc-flow-step {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text-brand);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  padding: 8px var(--space-4);
  border-radius: var(--radius-full);
}
.mc-flow-step b {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--brown-100);
  color: var(--brown-700);
  font-size: var(--font-size-xs);
}
.mc-flow-step--accent {
  color: var(--white);
  background: linear-gradient(135deg, var(--brown-600), var(--brown-700));
  border-color: var(--brown-700);
}
.mc-flow-step--accent b {
  background: rgba(255, 255, 255, 0.25);
  color: var(--white);
}
.mc-flow-arrow {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--brown-400);
}

/* Đầu thẻ: ca · người ẩn danh · lý do khám + nút lật ca */
.mc-casehead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  padding-bottom: var(--space-4);
  margin-bottom: var(--space-4);
  border-bottom: 1px solid var(--border);
}
.mc-casemeta {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-3);
  min-width: 0;
}
.mc-caseid {
  font-size: var(--font-size-xs);
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--white);
  background: var(--brown-600);
  padding: 2px 10px;
  border-radius: var(--radius-full);
}
.mc-casewho {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text);
}
.mc-casecomplaint {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}
.mc-casenav {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
.mc-navbtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--brown-700);
  font-size: var(--font-size-lg);
  line-height: 1;
  transition: all var(--transition-fast);
}
.mc-navbtn:hover {
  background: var(--brown-600);
  color: var(--white);
  border-color: var(--brown-600);
}
.mc-dots {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.mc-dots i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-strong);
  cursor: pointer;
  transition: transform var(--transition-fast), background var(--transition-fast);
}
.mc-dots i.on {
  background: var(--brown-600);
  transform: scale(1.25);
}

/* Cụm nút: xem thật (free) + mở khoá "của bạn" (điểm chuyển đổi) */
.mc-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.mc-unlock {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  height: 44px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--brown-700);
  background: var(--brown-50);
  border: 1px dashed var(--brown-300);
  transition: all var(--transition-fast);
}
.mc-unlock:hover {
  color: var(--white);
  background: var(--brown-700);
  border-color: var(--brown-700);
  border-style: solid;
}
.mc-unlock svg {
  flex-shrink: 0;
}

/* Cú đấm "Big Data" — dải tối để con số nổi bật */
.mc-bigdata {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  margin-top: var(--space-8);
  padding: var(--space-6) var(--space-8);
  background: linear-gradient(135deg, var(--brown-800), #1a0f05);
  color: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
.mc-bigdata-num {
  font-size: clamp(2.4rem, 1.8rem + 2.4vw, 3.6rem);
  font-weight: 800;
  line-height: 1;
  color: var(--brown-100);
  letter-spacing: -0.02em;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.mc-bigdata-text {
  font-size: var(--font-size-base);
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.82);
}
.mc-bigdata-text strong {
  color: var(--white);
  font-weight: 700;
}
@media (max-width: 560px) {
  .mc-bigdata {
    flex-direction: column;
    text-align: center;
    gap: var(--space-3);
    padding: var(--space-6);
  }
}

/* ---------- Lưới tính năng ---------- */
.lp-feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
}
.lp-feature {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
}
.lp-feature:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-brand);
}
.lp-feature-ic {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--brown-50);
  color: var(--brown-600);
  margin-bottom: var(--space-4);
}
.lp-feature-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--text);
  margin-bottom: var(--space-2);
}
.lp-feature-desc {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  line-height: 1.6;
}

/* ---------- Kho tri thức ---------- */
.lp-knowledge {
  background: var(--surface-2);
  border-top: 1px solid var(--border);
}
.lp-flow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  margin-bottom: var(--space-10);
}
.lp-flow-step {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text-brand);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  padding: 8px var(--space-4);
  border-radius: var(--radius-full);
}
.lp-flow-step--accent {
  color: var(--chip-method-fg);
  background: var(--chip-method-surface);
  border-color: var(--chip-method-border);
}
.lp-flow-arrow,
.lp-flow-plus {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--brown-400);
}

/* ---------- Mạch biện chứng tương tác ---------- */
.lp-trace {
  max-width: 1180px;
  margin: 0 auto var(--space-10);
}
.lp-trace-pick {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}
.lp-trace-pick-label {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text-muted);
}
.lp-trace-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
}
.lp-trace-chip {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--chip-symptom-fg);
  background: var(--surface);
  border: 1px solid var(--chip-symptom-border);
  padding: 8px var(--space-4);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}
.lp-trace-chip:hover {
  background: var(--chip-symptom-bg);
}
.lp-trace-chip.is-active {
  background: var(--chip-symptom-bg);
  border-color: var(--chip-symptom-fg);
  box-shadow: var(--shadow-sm);
}
.lp-trace-chain {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr auto 1fr;
  align-items: stretch;
  gap: var(--space-2);
  animation: lpTraceIn 0.35s ease;
}
@keyframes lpTraceIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.lp-trace-step {
  background: var(--k-bg);
  border: 1px solid var(--k-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  text-align: center;
}
.lp-trace-step.k-cause {
  --k-bg: var(--chip-pulse-bg);
  --k-fg: var(--chip-pulse-fg);
  --k-border: var(--chip-pulse-border);
}
.lp-trace-step.k-organ {
  --k-bg: var(--chip-brand-bg);
  --k-fg: var(--chip-brand-fg);
  --k-border: var(--chip-brand-border);
}
.lp-trace-step.k-pattern {
  --k-bg: var(--chip-pattern-bg);
  --k-fg: var(--chip-pattern-fg);
  --k-border: var(--chip-pattern-border);
}
.lp-trace-step.k-method {
  --k-bg: var(--chip-method-bg);
  --k-fg: var(--chip-method-fg);
  --k-border: var(--chip-method-border);
}
.lp-trace-step.k-herb {
  --k-bg: var(--chip-herb-bg);
  --k-fg: var(--chip-herb-fg);
  --k-border: var(--chip-herb-border);
}
.lp-trace-step.is-pivot {
  box-shadow: 0 0 0 2px var(--k-fg) inset;
}
.lp-trace-tag {
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--k-fg);
  opacity: 0.85;
}
.lp-trace-val {
  font-size: var(--font-size-sm);
  font-weight: 800;
  line-height: 1.35;
  color: var(--k-fg);
}
.lp-trace-sub {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--k-fg);
  opacity: 0.8;
}
.lp-trace-link {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--brown-400);
}
.lp-trace-foot {
  margin: var(--space-5) auto 0;
  max-width: 760px;
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  line-height: 1.6;
}
.lp-trace-foot strong {
  color: var(--text-brand);
}
@media (max-width: 1024px) {
  .lp-trace-chain {
    grid-template-columns: 1fr;
  }
  .lp-trace-link {
    transform: rotate(90deg);
  }
}

.lp-k-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
}
.lp-k-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-top: 3px solid var(--k-fg, var(--brown-500));
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}
.lp-k-panel.k-herb {
  --k-bg: var(--chip-herb-bg);
  --k-fg: var(--chip-herb-fg);
  --k-border: var(--chip-herb-border);
}
.lp-k-panel.k-pattern {
  --k-bg: var(--chip-pattern-bg);
  --k-fg: var(--chip-pattern-fg);
  --k-border: var(--chip-pattern-border);
}
.lp-k-panel.k-method {
  --k-bg: var(--chip-method-bg);
  --k-fg: var(--chip-method-fg);
  --k-border: var(--chip-method-border);
}
.lp-k-panel.k-symptom {
  --k-bg: var(--chip-symptom-bg);
  --k-fg: var(--chip-symptom-fg);
  --k-border: var(--chip-symptom-border);
}
.lp-k-panel.k-cause {
  --k-bg: var(--chip-pulse-bg);
  --k-fg: var(--chip-pulse-fg);
  --k-border: var(--chip-pulse-border);
}
.lp-k-panel.k-organ {
  --k-bg: var(--chip-brand-bg);
  --k-fg: var(--chip-brand-fg);
  --k-border: var(--chip-brand-border);
}
.lp-k-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.lp-k-ic {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--k-bg);
  color: var(--k-fg);
}
.lp-k-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text);
}
.lp-k-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  flex: 1;
}
.lp-k-list li {
  display: flex;
  flex-direction: column;
  list-style: none;
  padding: var(--space-3);
  background: var(--k-bg);
  border: 1px solid var(--k-border);
  border-radius: var(--radius-md);
}
.lp-k-name {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--k-fg);
}
.lp-k-sub {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-top: 1px;
}
.lp-k-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface-2);
  transition: all var(--transition-fast);
}
.lp-k-more:hover {
  color: var(--brown-700);
  border-color: var(--brown-300);
  background: var(--brown-50);
}
.lp-k-more svg {
  flex-shrink: 0;
}
/* Biến thể "xem thật" — không khoá, dùng màu thương hiệu để mời bấm. */
.lp-k-more--live {
  border-style: solid;
  border-color: var(--brown-300);
  color: var(--brown-700);
  background: var(--brown-50);
  font-weight: 700;
}
.lp-k-more--live:hover {
  color: var(--white);
  background: var(--brown-600);
  border-color: var(--brown-600);
}

/* ---------- Phân tích bài thuốc THẬT nhúng trên landing ---------- */
.lp-bt {
  margin-top: var(--space-8);
  scroll-margin-top: 84px; /* chừa chỗ cho thanh nav sticky (68px) khi nhảy từ menu */
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
}
.lp-bt-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-bottom: var(--space-5);
}
.lp-bt-eyebrow {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--brown-600);
  margin-bottom: var(--space-2);
}
.lp-bt-title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--text-brand);
  letter-spacing: -0.01em;
  text-wrap: balance;
}
.lp-bt-source {
  margin-top: 4px;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}
.lp-bt-body {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: var(--space-6);
  align-items: start;
}
.lp-bt-table-wrap {
  overflow-x: auto;
}
.lp-bt-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}
.lp-bt-table th {
  background: var(--brown-50);
  color: var(--brown-700);
  font-weight: 700;
  font-size: var(--font-size-xs);
  padding: 8px 10px;
  text-align: left;
  border: 1px solid var(--border);
  white-space: nowrap;
}
.lp-bt-table td {
  padding: 8px 10px;
  border: 1px solid var(--border);
}
.bt-name {
  font-weight: 700;
  color: var(--text-brand);
  white-space: nowrap;
}
.bt-c {
  text-align: center;
  white-space: nowrap;
}
.bt-role {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 2px 10px;
  border-radius: var(--radius-full);
}
.role-quan {
  background: var(--brown-700);
  color: var(--white);
}
.role-than {
  background: var(--brown-100);
  color: var(--brown-800);
  border: 1px solid var(--brown-300);
}
.role-ta {
  background: var(--surface-2);
  color: var(--text-muted);
  border: 1px solid var(--border-strong);
}
.role-su {
  background: var(--chip-method-bg, var(--brown-50));
  color: var(--chip-method-fg, var(--brown-700));
  border: 1px solid var(--chip-method-border, var(--brown-200));
}
.role-other {
  background: var(--surface-2);
  color: var(--text-muted);
}
.lp-bt-radar {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}
.lp-bt-radar-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--brown-700);
  margin-bottom: var(--space-3);
}
.lp-rb {
  display: grid;
  grid-template-columns: 78px 1fr 32px;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
.lp-rb-name {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--text);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lp-rb-track {
  position: relative;
  height: 12px;
  background: var(--gray-100);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.lp-rb-fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: linear-gradient(90deg, var(--brown-400), var(--brown-700));
  border-radius: var(--radius-full);
}
.lp-rb-val {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--text-subtle);
  text-align: right;
}
.lp-bt-note {
  margin-top: var(--space-4);
  font-size: var(--font-size-xs);
  color: var(--text-subtle);
  line-height: 1.6;
}
.lp-bt-note strong {
  color: var(--brown-700);
}
@media (max-width: 860px) {
  .lp-bt-body {
    grid-template-columns: 1fr;
  }
}

/* ---------- Dành cho ai ---------- */
.lp-audience-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
}
.lp-audience-card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-8) var(--space-6);
  text-align: center;
}
.lp-audience-ic {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--brown-100), var(--brown-200));
  color: var(--brown-700);
  margin-bottom: var(--space-5);
}
.lp-audience-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text);
  margin-bottom: var(--space-2);
}
.lp-audience-desc {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  line-height: 1.7;
}

/* ---------- ② Cũ vs Mới ---------- */
.lp-shift {
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--space-16) var(--space-6);
}
.lp-shift-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: stretch;
  gap: var(--space-5);
}
.lp-shift-col {
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  border: 1px solid var(--border);
}
.lp-shift-col--old {
  background: var(--surface-2);
}
.lp-shift-col--new {
  background: linear-gradient(140deg, var(--brown-800) 0%, #1a0f05 100%);
  color: var(--white);
  border-color: var(--brown-700);
  box-shadow: var(--shadow-lg);
}
.lp-shift-title {
  font-size: var(--font-size-sm);
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: var(--space-4);
  color: var(--text-subtle);
}
.lp-shift-col--new .lp-shift-title {
  color: var(--brown-200);
}
.lp-shift-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.lp-shift-list li {
  list-style: none;
  position: relative;
  padding-left: var(--space-5);
  font-size: var(--font-size-base);
  line-height: 1.6;
  color: var(--text-muted);
}
.lp-shift-col--new .lp-shift-list li {
  color: rgba(255, 255, 255, 0.9);
}
.lp-shift-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 9px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--brown-300);
}
.lp-shift-col--new .lp-shift-list li::before {
  background: var(--brown-200);
}
.lp-shift-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--brown-400);
}

/* ---------- ③ Bàn Xoay → Dữ Liệu Lớn ---------- */
.lp-dials {
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--space-16) var(--space-6);
}
/* Khung chứa bàn xoay biện chứng tương tác (component BanXoayBienChung) */
.lp-dials-live {
  margin: 0 auto var(--space-8);
}

/* Hai thẻ quan hệ 1→n và n↔n */
.dl-rels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
  margin-bottom: var(--space-8);
}
.dl-rel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}
.dl-rel-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}
.dl-rel-tag {
  font-size: var(--font-size-md);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--white);
  background: linear-gradient(135deg, var(--brown-600), var(--brown-700));
  padding: 4px 12px;
  border-radius: var(--radius-md);
  letter-spacing: 0.04em;
}
.dl-rel-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--text);
}
.dl-rel-desc {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: var(--space-4);
}
.dl-rel-chain {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}
.dl-node {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--text-brand);
  background: var(--brown-50);
  border: 1px solid var(--border-strong);
  padding: 5px 11px;
  border-radius: var(--radius-full);
}
.dl-node--src {
  color: var(--white);
  background: var(--brown-700);
  border-color: var(--brown-700);
}
.dl-rel-sep {
  font-weight: 800;
  color: var(--brown-400);
}
.dl-fan {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

/* Cú đấm 1 ↔ n ↔ n */
.dl-punch {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-6) var(--space-8);
  background: linear-gradient(135deg, var(--brown-800), #1a0f05);
  color: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
.dl-punch-sym {
  font-size: clamp(2rem, 1.5rem + 2vw, 3rem);
  font-weight: 800;
  line-height: 1;
  color: var(--brown-100);
  letter-spacing: 0.02em;
  flex-shrink: 0;
  white-space: nowrap;
}
.dl-punch-text {
  font-size: var(--font-size-base);
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.82);
}
.dl-punch-text strong {
  color: var(--white);
  font-weight: 700;
}

@media (max-width: 768px) {
  .dl-rels {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .dl-punch {
    flex-direction: column;
    text-align: center;
    gap: var(--space-3);
    padding: var(--space-6);
  }
}

/* ---------- ⑦ Thang giá trị ---------- */
.lp-ladder {
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--space-16) var(--space-6);
}
.lp-ladder-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  max-width: 920px;
  margin: 0 auto;
}
.lp-ladder-col {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-8) var(--space-6);
  box-shadow: var(--shadow-sm);
}
.lp-ladder-col--paid {
  border: 2px solid var(--brown-600);
  box-shadow: var(--shadow-lg);
}
.lp-ladder-head {
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--border);
}
.lp-ladder-tag {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 12px;
  border-radius: var(--radius-full);
  margin-bottom: var(--space-3);
}
.lp-ladder-tag--free {
  color: var(--text-muted);
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
}
.lp-ladder-tag--paid {
  color: var(--white);
  background: var(--brown-600);
}
.lp-ladder-name {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.01em;
}
.lp-ladder-cap {
  margin-top: 4px;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}
.lp-ladder-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
  flex: 1;
}
.lp-ladder-list li {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  list-style: none;
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--text);
}
.lp-ladder-list svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--brown-600);
}
.lp-ladder-cta {
  width: 100%;
  justify-content: center;
}

/* ---------- ⑧ Bằng chứng quy mô ---------- */
.lp-proof {
  background: linear-gradient(135deg, var(--brown-700) 0%, var(--brown-900) 100%);
  color: var(--white);
}
.lp-proof-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--space-12) var(--space-6);
  text-align: center;
}
.lp-proof-lead {
  font-size: var(--font-size-lg);
  color: rgba(255, 255, 255, 0.85);
  max-width: 40rem;
  margin: 0 auto var(--space-8);
  line-height: 1.6;
}
.lp-proof-foot {
  font-size: var(--font-size-lg);
  color: rgba(255, 255, 255, 0.85);
  /* Nới rộng + chia dòng cân để câu này không rớt 1 chữ lẻ xuống dòng cuối. */
  max-width: 52rem;
  margin: var(--space-8) auto 0;
  line-height: 1.6;
  text-wrap: balance;
}
.lp-proof-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  gap: var(--space-8) var(--space-10);
}
.lp-proof-stats li {
  list-style: none;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.lp-proof-stats strong {
  font-size: clamp(1.8rem, 1.4rem + 1.6vw, 2.6rem);
  font-weight: 800;
  color: var(--white);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.lp-proof-stats span {
  margin-top: 6px;
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.72);
}

/* Nút ghost nền sáng + hàng CTA căn giữa */
.lp-btn--ghost {
  background: var(--surface);
  color: var(--brown-700);
  border: 1px solid var(--border-strong);
}
.lp-btn--ghost:hover {
  background: var(--brown-50);
  border-color: var(--brown-300);
  transform: translateY(-2px);
}
.lp-cta-row--center {
  justify-content: center;
}

@media (max-width: 860px) {
  .lp-shift-grid,
  .lp-ladder-grid {
    grid-template-columns: 1fr;
  }
  .lp-shift-arrow {
    transform: rotate(90deg);
    padding: var(--space-2) 0;
  }
}

/* ---------- Học liệu · Danh sách phát Đông Y ---------- */
.lp-learn {
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--space-16) var(--space-6);
}
.lp-learn-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-6);
}
.lp-learn-card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
}
.lp-learn-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-brand);
}
.lp-learn-frame {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #000;
}
.lp-learn-frame iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
.lp-learn-text {
  padding: var(--space-5) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.lp-learn-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--text);
}
.lp-learn-sub {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  line-height: 1.5;
}
.lp-learn-link {
  margin-top: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--brown-600);
  transition: color var(--transition-fast);
}
.lp-learn-link:hover {
  color: var(--brown-800);
}
.lp-learn-note {
  margin-top: var(--space-8);
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--text-subtle);
}
@media (max-width: 768px) {
  .lp-learn-grid {
    grid-template-columns: 1fr;
  }
}

/* ---------- Lời kêu gọi ---------- */
.lp-cta {
  background: linear-gradient(135deg, var(--brown-600) 0%, var(--brown-800) 100%);
  color: var(--white);
}
.lp-cta-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--space-16) var(--space-6);
  text-align: center;
}
.lp-cta-title {
  font-size: var(--font-size-3xl);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-bottom: var(--space-3);
  text-wrap: balance;
}
.lp-cta-sub {
  font-size: var(--font-size-base);
  color: rgba(255, 255, 255, 0.82);
  margin: 0 auto var(--space-8);
  max-width: 46rem;
  text-wrap: pretty;
}

/* ---------- Nguồn gốc & Tin cậy (E-E-A-T) ---------- */
.lp-trust {
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--space-16) var(--space-6);
}
.lp-trust-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
  margin-top: var(--space-8);
}
.lp-trust-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}
.lp-trust-ico {
  font-size: 1.5rem;
  line-height: 1;
}
.lp-trust-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-brand);
  margin: var(--space-3) 0 var(--space-2);
}
.lp-trust-text {
  font-size: var(--font-size-sm);
  line-height: 1.7;
  color: var(--text-muted);
  margin: 0;
}
.lp-trust-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3) var(--space-5);
  margin-top: var(--space-8);
}
.lp-trust-links a {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--primary);
  text-decoration: underline;
}
.lp-trust-links a:hover {
  color: var(--primary-dark);
}
@media (max-width: 768px) {
  .lp-trust-grid {
    grid-template-columns: 1fr;
  }
}

/* ---------- Chân trang ---------- */
.lp-footer {
  background: var(--brown-900);
  color: rgba(255, 255, 255, 0.7);
}
.lp-footer-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.lp-brand--footer {
  cursor: default;
}
.lp-brand--footer .lp-brand-text {
  color: var(--white);
}
.lp-footer-note {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.6);
}
.lp-footer-nav {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.lp-footer-nav a {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.78);
}
.lp-footer-nav a:hover {
  color: var(--white);
}
/* Hàng link pháp lý (YMYL) + miễn trừ y tế: chiếm trọn 1 dòng riêng */
.lp-footer-nav--legal {
  flex-basis: 100%;
  padding-top: var(--space-5);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}
.lp-footer-nav--legal a {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.62);
}
.lp-footer-disclaimer {
  flex-basis: 100%;
  margin: 0;
  font-size: var(--font-size-xs);
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.5);
}
.lp-footer-disclaimer strong {
  color: rgba(255, 255, 255, 0.72);
}
/* Chân trang trên di động: xếp dọc, mỗi link một dòng cho gọn gàng */
@media (max-width: 768px) {
  .lp-footer-inner {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-6);
    padding: var(--space-10) var(--space-5);
  }
  .lp-footer-nav {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }
  .lp-footer-nav a,
  .lp-footer-nav--legal a {
    padding: 2px 0;
  }
}

/* ---------- Thư viện · Từ Điển ---------- */
.lp-library {
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--space-16) var(--space-6);
}
.lp-lib-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
}
.lp-lib-card {
  display: flex;
  gap: var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
}
.lp-lib-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-brand);
}
.lp-lib-ic {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--brown-50);
  color: var(--brown-600);
}
.lp-lib-text {
  min-width: 0;
}
.lp-lib-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--text);
  margin-bottom: var(--space-2);
}
.lp-lib-count {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--brown-700);
  background: var(--brown-50);
  border: 1px solid var(--brown-100);
  padding: 1px 8px;
  border-radius: var(--radius-full);
  margin-bottom: var(--space-2);
}
.lp-lib-desc {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  line-height: 1.6;
}
.lp-lib-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-10);
}
.lp-lib-links {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: center;
}
.lp-lib-note {
  font-size: var(--font-size-xs);
  color: var(--text-subtle);
}
@media (max-width: 1024px) {
  .lp-lib-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 560px) {
  .lp-lib-grid {
    grid-template-columns: 1fr;
  }
}

/* ---------- Responsive ---------- */
@media (max-width: 1024px) {
  .lp-feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .lp-k-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .lp-measure-card {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 860px) {
  .lp-hero-inner,
  .lp-model-inner {
    grid-template-columns: 1fr;
    text-align: center;
    padding: var(--space-12) var(--space-6);
  }
  .lp-hero-sub,
  .lp-model-sub {
    margin-left: auto;
    margin-right: auto;
  }
  .lp-cta-row,
  .lp-stats {
    justify-content: center;
  }
  .lp-hero-art {
    order: -1;
    min-height: 280px;
  }
  .lp-model-art {
    order: -1;
  }
  .lp-checks {
    text-align: left;
    max-width: 30rem;
    margin-left: auto;
    margin-right: auto;
  }
  .lp-audience-grid {
    grid-template-columns: 1fr;
  }
  .mc-readout {
    text-align: left;
  }
}
@media (max-width: 768px) {
  .lp-nav-links {
    display: none;
  }
  .lp-nav-inner {
    gap: var(--space-3);
  }
  .lp-brand {
    margin-right: auto;
  }
  /* Co padding dọc của mọi section để trang bớt dài lê thê trên di động */
  .lp-hero-inner,
  .lp-model-inner,
  .lp-section,
  .lp-measure,
  .lp-knowledge,
  .lp-audience,
  .lp-shift,
  .lp-dials,
  .lp-ladder,
  .lp-learn,
  .lp-cta-inner,
  .lp-trust,
  .lp-library {
    padding-top: var(--space-10);
    padding-bottom: var(--space-10);
  }
  /* Tiêu đề section sát nội dung hơn */
  .lp-section-head {
    margin-bottom: var(--space-8);
  }
}
@media (max-width: 560px) {
  .lp-feature-grid {
    grid-template-columns: 1fr;
  }
  .lp-k-grid {
    grid-template-columns: 1fr;
  }
  .lp-hero-inner,
  .lp-model-inner,
  .lp-section,
  .lp-measure,
  .lp-knowledge,
  .lp-audience,
  .lp-shift,
  .lp-dials,
  .lp-ladder,
  .lp-learn,
  .lp-cta-inner,
  .lp-trust,
  .lp-library {
    padding-top: var(--space-8);
    padding-bottom: var(--space-8);
  }
  .lp-section-head {
    margin-bottom: var(--space-6);
  }
  .lp-stats {
    gap: var(--space-5);
  }
  .lp-measure-card {
    padding: var(--space-5);
  }
  .mc-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .mc-tbl {
    font-size: var(--font-size-xs);
  }
  .mc-tbl th,
  .mc-tbl td {
    padding: 4px 5px;
  }
}
</style>
