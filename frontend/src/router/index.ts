import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const LandingView = () => import('@/views/LandingView.vue')
const LoginView = () => import('@/views/LoginView.vue')
const PublicKinhMach3DView = () => import('@/views/PublicKinhMach3DView.vue')
const PublicTuDienView = () => import('@/views/PublicTuDienView.vue')
const DuocLieuListView = () => import('@/views/DuocLieuListView.vue')
const DuocLieuDetailView = () => import('@/views/DuocLieuDetailView.vue')
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
const KinhMach3DView = () => import('@/views/KinhMach3DView.vue')
const TuDienView = () => import('@/views/TuDienView.vue')
const UsersView = () => import('@/views/UsersView.vue')
const SeoRadarView = () => import('@/views/SeoRadarView.vue')
const ChanDoanLuoiView = () => import('@/views/ChanDoanLuoiView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
    // Thư viện tra cứu CÔNG KHAI — mở ĐẦY ĐỦ (không cần đăng nhập).
    {
      path: '/thu-vien',
      name: 'thu-vien',
      component: PublicTuDienView,
      meta: { requiresAuth: false },
    },
    // Từ điển dược liệu CÔNG KHAI (vị thuốc + thư viện ảnh theo giai đoạn).
    {
      path: '/duoc-lieu',
      name: 'duoc-lieu',
      component: DuocLieuListView,
      meta: { requiresAuth: false },
    },
    {
      path: '/duoc-lieu/:id',
      name: 'duoc-lieu-detail',
      component: DuocLieuDetailView,
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
router.beforeEach((to) => {
  const token = localStorage.getItem('access_token')

  if (to.meta.requiresAuth && !token) {
    return { name: 'login' }
  }
  if (to.name === 'login' && token) {
    return { name: 'dashboard' }
  }

  // Chặn vào trang không có quyền -> đưa về Trang Chủ.
  const page = to.meta.page as string | undefined
  if (page && token) {
    const auth = useAuthStore()
    if (!auth.can(page)) {
      return { name: 'home' }
    }
  }
})

export default router
