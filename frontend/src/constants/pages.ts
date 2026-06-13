// Danh mục TRANG dùng cho phân quyền. `key` khớp với route name & cột vai_tro.trangCho ở backend.
// `always: true` -> luôn cho phép mọi tài khoản đã đăng nhập (không khoá được), tránh đá vòng vòng.

export interface AppPage {
  key: string
  label: string
  always?: boolean
}

export const APP_PAGES: AppPage[] = [
  { key: 'home', label: 'Trang Chủ', always: true },
  { key: 'patients', label: 'Bệnh Nhân' },
  { key: 'appointments', label: 'Lịch Trị Liệu' },
  { key: 'western-medicine', label: 'Bệnh Tây Y' },
  { key: 'meridian-diseases', label: 'Bệnh Đo Kinh Lạc' },
  { key: 'kinh-mach-3d', label: 'Kinh Mạch 3D' },
  { key: 'tu-dien', label: 'Từ Điển' },
  { key: 'medicines', label: 'Quản Lý Thuốc' },
  { key: 'symptoms', label: 'Triệu Chứng' },
  { key: 'treatments', label: 'Pháp Trị' },
  { key: 'users', label: 'Quản Lý Người Dùng' },
  { key: 'seo', label: 'SEO Radar' },
]

// Các trang luôn mở cho người đã đăng nhập.
export const ALWAYS_ALLOWED = new Set(APP_PAGES.filter((p) => p.always).map((p) => p.key))
