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
  { key: 'bien-chung-luan-tri', label: 'Biện Chứng Luận Trị' },
  { key: 'thuong-han', label: 'Thương Hàn Tạp Luận Bệnh' }, // route cũ, giữ truy cập trực tiếp (không ở sidebar)
  { key: 'ban-xoay-bien-chung', label: 'Bàn Xoay Biện Chứng' }, // route cũ, giữ truy cập trực tiếp
  { key: 'chan-doan-luoi', label: 'Chẩn Đoán Lưỡi', always: true },
  { key: 'users', label: 'Quản Lý Người Dùng' },
  { key: 'seo', label: 'SEO Radar' },
  // Hai khoá dưới đây KHÔNG phải trang của app — chúng mở khu quản trị nội dung (CMS,
  // ở /_emdash/admin/) bằng cách đăng nhập một lần. Đặt chung mảng này là có chủ ý: đây
  // là nơi duy nhất tab Quản Lý Người Dùng dựng ô tick, nên khai ở đây là người quản trị
  // cấp/thu quyền được ngay mà không phải sửa thêm giao diện nào.
  //
  // Bậc tương ứng bên CMS do `backend/src/utils/ve-cms.util.ts` quyết định:
  //   bien-tap-noi-dung  → Editor (40): sửa nội dung, ảnh, danh mục.
  //   quan-tri-noi-dung  → Admin  (50): thêm cả cài đặt, cấu trúc bộ, người dùng CMS,
  //                                     và xoá vĩnh viễn.
  // Vai trò có laQuanTri thì luôn là Admin CMS, không cần tick.
  { key: 'bien-tap-noi-dung', label: 'Biên Tập Nội Dung' },
  { key: 'quan-tri-noi-dung', label: 'Quản Trị Nội Dung' },
]

// Các trang luôn mở cho người đã đăng nhập.
export const ALWAYS_ALLOWED = new Set(APP_PAGES.filter((p) => p.always).map((p) => p.key))
