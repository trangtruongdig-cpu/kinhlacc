import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ghiVetDoiTrang } from '@/lib/baoSuCo'

const LandingView = () => import('@/views/LandingView.vue')
const LoginView = () => import('@/views/LoginView.vue')
const PublicKinhMach3DView = () => import('@/views/PublicKinhMach3DView.vue')
const PublicXemLuoiView = () => import('@/views/PublicXemLuoiView.vue')
const DuocLieuDetailView = () => import('@/views/DuocLieuDetailView.vue')
const PhuongThuocDetailView = () => import('@/views/PhuongThuocDetailView.vue')
const DemoKetQuaDoView = () => import('@/views/DemoKetQuaDoView.vue')
const DemoBaiThuocView = () => import('@/views/DemoBaiThuocView.vue')
// Trang "Tin Cậy" (YMYL/E-E-A-T) — công khai, có meta + prerender riêng.
const VeChungToiView = () => import('@/views/VeChungToiView.vue')
const LienHeView = () => import('@/views/LienHeView.vue')
const ChinhSachBaoMatView = () => import('@/views/ChinhSachBaoMatView.vue')
// Chính sách quyền riêng tư cho APP (Google Play) — app bệnh nhân, khác với website.
const QuyenRiengTuAppView = () => import('@/views/QuyenRiengTuAppView.vue')
// Trang tự xoá tài khoản (Google Play "Account deletion URL").
const XoaTaiKhoanView = () => import('@/views/XoaTaiKhoanView.vue')
const DieuKhoanView = () => import('@/views/DieuKhoanView.vue')
const QuyTrinhBienTapView = () => import('@/views/QuyTrinhBienTapView.vue')
const DashboardLayout = () => import('@/views/DashboardLayout.vue')
const HomeView = () => import('@/views/HomeView.vue')
const PatientsView = () => import('@/views/PatientsView.vue')
const PatientDetailView = () => import('@/views/PatientDetailView.vue')
const NewExaminationView = () => import('@/views/NewExaminationView.vue')
const MeridianResultsView = () => import('@/views/MeridianResultsView.vue')
const AppointmentsView = () => import('@/views/AppointmentsView.vue')
const ScheduleConfigView = () => import('@/views/ScheduleConfigView.vue')
const WesternMedicineView = () => import('@/views/WesternMedicineView.vue')
const MeridianDiseasesTabsView = () => import('@/views/MeridianDiseasesTabsView.vue')
const MedicinesView = () => import('@/views/MedicinesView.vue')
const SymptomsView = () => import('@/views/SymptomsView.vue')
const TreatmentsView = () => import('@/views/TreatmentsView.vue')
const ThuongHanView = () => import('@/views/ThuongHanView.vue')
const BanXoayBienChungView = () => import('@/views/BanXoayBienChungView.vue')
const BienChungLuanTriView = () => import('@/views/BienChungLuanTriView.vue')
const TraCuuBienChungView = () => import('@/views/TraCuuBienChungView.vue')
const KinhMach3DView = () => import('@/views/KinhMach3DView.vue')
const TuDienView = () => import('@/views/TuDienView.vue')
const UsersView = () => import('@/views/UsersView.vue')
const SeoRadarView = () => import('@/views/SeoRadarView.vue')
const SuCoView = () => import('@/views/SuCoView.vue')
const ChanDoanLuoiView = () => import('@/views/ChanDoanLuoiView.vue')

// --- Patient Routes ---
const PatientLoginView = () => import('@/views/patient/PatientLoginView.vue')
const PatientRegisterView = () => import('@/views/patient/PatientRegisterView.vue')
const PatientAppLayout = () => import('@/views/patient/PatientAppLayout.vue')
const MyRecordsView = () => import('@/views/patient/MyRecordsView.vue')
const PatientScheduleView = () => import('@/views/patient/PatientScheduleView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // Chuyển trang mới → cuộn về đầu (mặc định người dùng mong đợi); bấm Back/Forward → giữ nguyên vị
  // trí cuộn cũ (savedPosition, do trình duyệt lưu) thay vì giật về đầu — chuẩn khuyến nghị Vue Router.
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView,
      meta: { requiresAuth: false },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false },
    },
    // Trang "xem thử" CÔNG KHAI (không cần đăng nhập) — dùng tính năng thật ở chế độ chỉ-xem.
    {
      path: '/xem-3d',
      name: 'xem-3d',
      component: PublicKinhMach3DView,
      meta: { requiresAuth: false },
    },
    {
      path: '/xem-ket-qua-do',
      name: 'xem-ket-qua-do',
      component: DemoKetQuaDoView,
      meta: { requiresAuth: false },
    },
    {
      path: '/xem-bai-thuoc',
      name: 'xem-bai-thuoc',
      component: DemoBaiThuocView,
      meta: { requiresAuth: false },
    },
    // Thư viện tra cứu /thu-vien, /huyet/, /kinh/, /benh-hoc/, /cham-cuu-tri-benh/,
    // /duoc-lieu/, /bai-thuoc/, /nguon/ KHÔNG còn là route của SPA — nginx đưa thẳng
    // sang CMS (xem frontend/nginx.conf, khối "THƯ VIỆN TỪ ĐIỂN"). Khai lại ở đây thì
    // cùng một địa chỉ ra hai nội dung khác nhau: bấm link thì SPA dựng, tải lại trang
    // thì CMS dựng.
    //
    // Xem Lưỡi CỐ Ý ở lại app (ảnh thật, không phải nội dung biên tập được) nên tách
    // thành trang riêng thay vì nằm trong tab của /thu-vien như trước.
    // Chốt RA KHỎI SPA: mọi điều hướng phía máy khách tới đường của thư viện phải
    // thành một lần tải trang THẬT, để nginx đưa sang CMS. Không có chốt này thì
    // <RouterLink to="/duoc-lieu/1/"> rơi vào route bắt-hết và ra trang 404.
    //
    // ⚠️ Ở chế độ dev KHÔNG có nginx: tải lại chính địa chỉ đó thì Vite trả index.html,
    // SPA lại vào đúng chốt này → lặp vô tận. Nên dev trỏ thẳng sang cổng của CMS.
    {
      path: '/:duong(thu-vien|huyet|kinh|benh-hoc|cham-cuu-tri-benh|duoc-lieu|bai-thuoc|nguon)/:phan(.*)*',
      name: 'ra-thu-vien',
      component: () => import('@/views/RaThuVienView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/xem-luoi',
      name: 'xem-luoi',
      component: PublicXemLuoiView,
      meta: { requiresAuth: false },
    },
    // Bàn Xoay Biện Chứng CÔNG KHAI — tra cứu miễn phí (không cần đăng nhập).
    {
      path: '/tra-cuu-bien-chung',
      name: 'tra-cuu-bien-chung',
      component: TraCuuBienChungView,
      meta: { requiresAuth: false },
    },
    // Trang "Tin Cậy" (YMYL) — công khai.
    {
      path: '/ve-chung-toi',
      name: 've-chung-toi',
      component: VeChungToiView,
      meta: { requiresAuth: false },
    },
    {
      path: '/lien-he',
      name: 'lien-he',
      component: LienHeView,
      meta: { requiresAuth: false },
    },
    {
      path: '/chinh-sach-bao-mat',
      name: 'chinh-sach-bao-mat',
      component: ChinhSachBaoMatView,
      meta: { requiresAuth: false },
    },
    // Chính sách quyền riêng tư cho ứng dụng Android — dán URL này vào Google Play Console.
    {
      path: '/quyen-rieng-tu-app',
      name: 'quyen-rieng-tu-app',
      component: QuyenRiengTuAppView,
      meta: { requiresAuth: false },
    },
    // Trang tự xoá tài khoản & dữ liệu — dán URL này vào ô "Account deletion" của Play Console.
    {
      path: '/xoa-tai-khoan',
      name: 'xoa-tai-khoan',
      component: XoaTaiKhoanView,
      meta: { requiresAuth: false },
    },
    {
      path: '/dieu-khoan',
      name: 'dieu-khoan',
      component: DieuKhoanView,
      meta: { requiresAuth: false },
    },
    {
      path: '/quy-trinh-bien-tap',
      name: 'quy-trinh-bien-tap',
      component: QuyTrinhBienTapView,
      meta: { requiresAuth: false },
    },
    // ======================================
    // PHÂN HỆ KHÁCH HÀNG (BỆNH NHÂN)
    // ======================================
    {
      path: '/khach-hang/dang-nhap',
      name: 'patient-login',
      component: PatientLoginView,
      meta: { requiresAuth: false },
    },
    {
      path: '/khach-hang/dang-ky',
      name: 'patient-register',
      component: PatientRegisterView,
      meta: { requiresAuth: false },
    },
    {
      path: '/ho-so',
      name: 'patient-app',
      component: PatientAppLayout,
      meta: { requiresPatientAuth: true },
      redirect: { name: 'patient-records' },
      children: [
        {
          path: 'kham-benh',
          name: 'patient-dashboard',
          redirect: { name: 'patient-records' },
        },
        {
          path: 'kham-benh/danh-sach',
          name: 'patient-records',
          component: MyRecordsView,
        },
        {
          path: 'kham-benh/:patientId/:examId',
          name: 'patient-record-detail',
          component: MeridianResultsView,
          props: true,
        },
        {
          path: 'lich-tri-lieu',
          name: 'patient-schedule',
          component: PatientScheduleView,
        },
        {
          path: 'tai-khoan',
          name: 'patient-profile',
          component: () => import('@/views/patient/PatientProfileView.vue'),
        }
      ],
    },
    // ======================================
    // PHÂN HỆ ADMIN / NHÂN VIÊN
    // ======================================
    {
      path: '/app',
      name: 'dashboard',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      redirect: { name: 'home' },
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
          meta: { page: 'home' },
        },
        {
          path: 'patients',
          name: 'patients',
          component: PatientsView,
          meta: { page: 'patients' },
        },
        {
          path: 'appointments',
          name: 'appointments',
          component: AppointmentsView,
          meta: { page: 'appointments' },
        },
        {
          path: 'appointments/config',
          name: 'schedule-config',
          component: ScheduleConfigView,
          meta: { page: 'appointments' },
        },
        {
          path: 'western-medicine',
          name: 'western-medicine',
          component: WesternMedicineView,
          meta: { page: 'western-medicine' },
        },
        {
          path: 'meridian-diseases',
          name: 'meridian-diseases',
          component: MeridianDiseasesTabsView,
          meta: { page: 'meridian-diseases' },
        },
        {
          path: 'medicines',
          name: 'medicines',
          component: MedicinesView,
          meta: { page: 'medicines' },
        },
        {
          path: 'symptoms',
          name: 'symptoms',
          component: SymptomsView,
          meta: { page: 'symptoms' },
        },
        {
          path: 'treatments',
          name: 'treatments',
          component: TreatmentsView,
          meta: { page: 'treatments' },
        },
        {
          path: 'thuong-han',
          name: 'thuong-han',
          component: ThuongHanView,
          meta: { page: 'thuong-han' },
        },
        {
          path: 'ban-xoay-bien-chung',
          name: 'ban-xoay-bien-chung',
          component: BanXoayBienChungView,
          meta: { page: 'ban-xoay-bien-chung' },
        },
        {
          path: 'bien-chung-luan-tri',
          name: 'bien-chung-luan-tri',
          component: BienChungLuanTriView,
          meta: { page: 'bien-chung-luan-tri' },
        },
        {
          path: 'kinh-mach-3d',
          name: 'kinh-mach-3d',
          component: KinhMach3DView,
          meta: { page: 'kinh-mach-3d' },
        },
        {
          path: 'tu-dien',
          name: 'tu-dien',
          component: TuDienView,
          meta: { page: 'tu-dien' },
        },
        // Chi tiết dược liệu / bài thuốc XEM TRONG APP (giữ trong DashboardLayout — không văng ra trang public).
        {
          path: 'duoc-lieu/:id',
          name: 'app-duoc-lieu-detail',
          component: DuocLieuDetailView,
          meta: { page: 'tu-dien' },
        },
        {
          path: 'bai-thuoc/:slug',
          name: 'app-bai-thuoc-detail',
          component: PhuongThuocDetailView,
          meta: { page: 'tu-dien' },
        },
        {
          path: 'users',
          name: 'users',
          component: UsersView,
          meta: { page: 'users' },
        },
        {
          path: 'seo',
          name: 'seo',
          component: SeoRadarView,
          meta: { page: 'seo' },
        },
        {
          // `meta.page` không nằm trong APP_PAGES nên `authStore.can()` chỉ trả true cho vai trò
          // Quản Trị (laQuanTri bỏ qua danh sách trang). Nhờ vậy tab tự khoá mà không phải thêm
          // khoá quyền mới — và không ai lỡ tay cấp nhầm cho lễ tân.
          path: 'su-co',
          name: 'su-co',
          component: SuCoView,
          meta: { page: 'su-co' },
        },
        {
          path: 'chan-doan-luoi',
          name: 'chan-doan-luoi',
          component: ChanDoanLuoiView,
          meta: { page: 'chan-doan-luoi' },
        },
        {
          path: 'patients/:id',
          name: 'patient-detail',
          component: PatientDetailView,
          props: true,
          meta: { page: 'patients' },
        },
        {
          path: 'patients/:id/new-examination',
          name: 'new-examination',
          component: NewExaminationView,
          props: true,
          meta: { page: 'patients' },
        },
        {
          path: 'patients/:patientId/examinations/:examId',
          name: 'meridian-results',
          component: MeridianResultsView,
          props: true,
          meta: { page: 'patients' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'landing' },
    },
  ],
})

// Navigation guard: kiểm tra đăng nhập + quyền theo trang.
router.afterEach((to) => {
  // Ghi vết SAU khi đã vào trang: danh sách 20 bước cuối là thứ giúp tái hiện lỗi.
  ghiVetDoiTrang(to.fullPath)
})

router.beforeEach(async (to) => {
  const token = localStorage.getItem('access_token')
  const patientToken = localStorage.getItem('patient_token')

  // === XỬ LÝ QUYỀN ADMIN ===
  if (to.meta.requiresAuth && !token) {
    return { name: 'login' }
  }
  if (to.name === 'login' && token) {
    return { name: 'dashboard' }
  }

  const page = to.meta.page as string | undefined
  if (page && token) {
    const auth = useAuthStore()
    if (!auth.can(page)) {
      return { name: 'home' }
    }
    // Đo nhiệt độ kinh lạc chỉ dành cho Y Sỹ — Lễ Tân không được tạo phiên đo mới.
    if (to.name === 'new-examination' && auth.isLeTan) {
      return { name: 'patient-detail', params: to.params }
    }
  }

  // === XỬ LÝ QUYỀN KHÁCH HÀNG (BỆNH NHÂN) ===
  if (to.meta.requiresPatientAuth && !patientToken) {
    return { name: 'patient-login' }
  }
  if ((to.name === 'patient-login' || to.name === 'patient-register') && patientToken) {
    return { name: 'patient-dashboard' }
  }
})

export default router
