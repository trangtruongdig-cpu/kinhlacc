/**
 * ĐĂNG NHẬP MỘT LẦN SANG KHU QUẢN TRỊ NỘI DUNG (EmDash / `/_emdash/admin/`).
 *
 * Đây là phần THUẦN của luồng: đổi quyền của app sang vai trò của CMS, và quyết định
 * địa chỉ email dùng để định danh người đó bên CMS. Tách ra khỏi controller để kiểm
 * được — xem `ve-cms.util.spec.ts`.
 *
 * Vì sao cần đổi: hai hệ đếm quyền khác nhau hoàn toàn. App phân quyền THEO TRANG
 * (`vai_tro.trangCho` là mảng khoá trang) còn EmDash phân quyền theo MỘT SỐ BẬC
 * (10 Subscriber → 50 Admin). Không có phép ánh xạ nào là hiển nhiên, nên nó phải
 * được viết ra một chỗ và kiểm ở đó.
 */

/** Bậc vai trò của EmDash — khớp `Role` trong `@emdash-cms/auth/src/types.ts`. */
export const CMS_VAI_TRO = {
  /** Editor (40): sửa mọi nội dung, ảnh, danh mục. KHÔNG đụng được cài đặt, cấu
   *  trúc bộ, người dùng CMS, và không xoá vĩnh viễn được. */
  BIEN_TAP: 40,
  /** Admin (50): toàn quyền, kể cả xoá vĩnh viễn và quản lý người dùng CMS. */
  QUAN_TRI: 50,
} as const;

export type VaiTroCms = (typeof CMS_VAI_TRO)[keyof typeof CMS_VAI_TRO];

/** Khoá trang trong `vai_tro.trangCho`. Phải khớp `frontend/src/constants/pages.ts`. */
export const QUYEN_BIEN_TAP_NOI_DUNG = 'bien-tap-noi-dung';
export const QUYEN_QUAN_TRI_NOI_DUNG = 'quan-tri-noi-dung';

/** Tên miền cho địa chỉ thay thế. CỐ Ý là tên miền con riêng chứ không phải
 *  `@kinhlac.online`: nhờ vậy một địa chỉ sinh ra không bao giờ đụng địa chỉ thật
 *  của nhân viên, và nhìn vào danh sách người dùng CMS là biết ngay ai chưa khai
 *  email. Đổi chuỗi này là đẻ ra người dùng CMS mới cho TẤT CẢ tài khoản chưa khai
 *  email — đừng đổi. */
const MIEN_NOI_BO = 'noi-bo.kinhlac.online';

/** Hình dạng tối thiểu của vai trò mà hàm này cần. Nhận đúng phần dùng tới thay vì
 *  cả entity, để phép kiểm khỏi phải dựng TypeORM. */
export interface VaiTroRutGon {
  laQuanTri: boolean;
  trangCho?: string[];
}

/**
 * Vai trò CMS tương ứng với quyền hiện tại, hoặc `null` nếu tài khoản không được vào.
 *
 * Trả `null` chứ không ném lỗi: nơi gọi biết ngữ cảnh nên diễn đạt lời từ chối tốt hơn.
 */
export function vaiTroCmsCho(
  vaiTro: VaiTroRutGon | null | undefined,
): VaiTroCms | null {
  if (!vaiTro) return null;

  // Quản Trị của app đi thẳng lên Admin CMS, không phải tick gì thêm — cùng lý lẽ với
  // `authStore.can()`: laQuanTri bỏ qua danh sách trang.
  if (vaiTro.laQuanTri) return CMS_VAI_TRO.QUAN_TRI;

  const trang = vaiTro.trangCho ?? [];
  // Bậc cao xét trước: tick cả hai thì được bậc cao.
  if (trang.includes(QUYEN_QUAN_TRI_NOI_DUNG)) return CMS_VAI_TRO.QUAN_TRI;
  if (trang.includes(QUYEN_BIEN_TAP_NOI_DUNG)) return CMS_VAI_TRO.BIEN_TAP;
  return null;
}

/** Nhận diện email ở mức đủ dùng: có đúng một '@', hai bên không rỗng, phần miền có dấu chấm. */
function trongGiongEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(s);
}

/**
 * Địa chỉ email dùng để định danh tài khoản này bên CMS.
 *
 * Bắt buộc phải ỔN ĐỊNH: EmDash tra người dùng bằng email, nên cùng một tài khoản app
 * mà lần này ra địa chỉ khác lần trước là đẻ thêm một người dùng CMS, kèm theo đó là
 * mất hết bài đã ghi tên người đó.
 */
export function emailCms(admin: {
  username: string;
  email?: string | null;
}): string {
  const email = (admin.email ?? '').trim().toLowerCase();
  if (email && trongGiongEmail(email)) return email;

  // Chưa khai email (hoặc khai một chuỗi không phải email) → sinh địa chỉ nội bộ.
  const ten = boDauTiengViet(admin.username)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${ten || 'nguoi-dung'}@${MIEN_NOI_BO}`;
}

/** Bỏ dấu tiếng Việt để username có dấu vẫn ra địa chỉ hợp lệ. */
function boDauTiengViet(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}
