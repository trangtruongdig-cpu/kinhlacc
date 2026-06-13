/**
 * Danh mục TRANG dùng cho phân quyền. Key phải khớp với route name ở frontend
 * (frontend/src/constants/pages.ts) và cột vai_tro.trangCho.
 *
 * `home` luôn được phép cho mọi tài khoản đã đăng nhập (không khoá được) để
 * tránh đăng nhập xong bị đá vòng vòng.
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
  'users',
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
