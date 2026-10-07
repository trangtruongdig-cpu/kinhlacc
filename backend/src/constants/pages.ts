/**
 * Danh mục TRANG dùng cho phân quyền. Key phải khớp với route name ở frontend
 * (frontend/src/constants/pages.ts) và cột vai_tro.trangCho.
 *
 * `home` luôn được phép cho mọi tài khoản đã đăng nhập (không khoá được) để
 * tránh đăng nhập xong bị đá vòng vòng.
 *
 * ⚠️ PHẢI KHỚP TRỌN với `APP_PAGES` của frontend — `sanitizeTrangCho` lọc IM LẶNG,
 * nên khoá nào thiếu ở đây thì người quản trị tick ô, bấm Lưu, nhận 200 OK, và ô
 * trống trở lại khi mở lại. Không có lỗi nào được ném. Chốt canh:
 * `npm test -- pages.spec`.
 */
export const APP_PAGE_KEYS = [
  'home',
  'patients',
  'appointments',
  'western-medicine',
  'meridian-diseases',
  'kinh-mach-3d',
  'tu-dien',
  'medicines',
  'symptoms',
  'treatments',
  'bien-chung-luan-tri',
  'thuong-han',
  'ban-xoay-bien-chung',
  'chan-doan-luoi',
  'users',
  'seo',
  // Hai khoá dưới KHÔNG phải trang của app — chúng mở khu quản trị nội dung (CMS)
  // bằng đăng nhập một lần. Bậc tương ứng do `utils/ve-cms.util.ts` quyết định.
  'bien-tap-noi-dung',
  'quan-tri-noi-dung',
] as const;

export type AppPageKey = (typeof APP_PAGE_KEYS)[number];

/** Lọc danh sách trang gửi lên còn lại các key hợp lệ + luôn có 'home'. */
export function sanitizeTrangCho(input: unknown): string[] {
  const valid = new Set<string>(APP_PAGE_KEYS);
  const arr = Array.isArray(input) ? input : [];
  const out = arr.filter((x): x is string => typeof x === 'string' && valid.has(x));
  if (!out.includes('home')) out.unshift('home');
  return Array.from(new Set(out));
}
