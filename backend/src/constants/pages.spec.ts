import { readFileSync } from 'fs';
import { join } from 'path';
import { APP_PAGE_KEYS, sanitizeTrangCho } from './pages';

/**
 * Phép kiểm cho DANH MỤC TRANG PHÂN QUYỀN.
 *
 * `sanitizeTrangCho` là cái lọc cuối cùng trước khi ghi `vai_tro.trangCho`, và nó lọc
 * IM LẶNG: khoá nào không có trong `APP_PAGE_KEYS` thì bị bỏ, request vẫn trả 200.
 * Nên khi danh sách này thiếu so với `frontend/src/constants/pages.ts`, người quản trị
 * tick ô, bấm Lưu, không thấy lỗi nào — mở lại thì ô trống như chưa bấm.
 *
 * Đã xảy ra thật (07/10/2026): backend thiếu 7 khoá, trong đó có hai khoá mở khu quản
 * trị nội dung. Vai trò Lễ Tân được cấp "Biên Tập Nội Dung" + "Quản Trị Nội Dung"
 * nhưng trong CSDL chỉ còn `["home","patients","appointments"]`.
 */
describe('APP_PAGE_KEYS khớp danh mục của frontend', () => {
  /** Rút các khoá `key: '...'` trong mảng APP_PAGES của frontend. */
  function khoaTrangFrontend(): string[] {
    const duong = join(
      __dirname,
      '../../../frontend/src/constants/pages.ts',
    );
    const nguon = readFileSync(duong, 'utf8');
    const than = nguon.slice(
      nguon.indexOf('APP_PAGES: AppPage[] = ['),
      nguon.indexOf('export const ALWAYS_ALLOWED'),
    );
    return [...than.matchAll(/\bkey:\s*'([^']+)'/g)].map((m) => m[1]);
  }

  it('hai danh sách phải khớp TRỌN — lệch một khoá là mất quyền mà không báo lỗi', () => {
    const feKeys = khoaTrangFrontend();
    expect(feKeys.length).toBeGreaterThan(0); // phòng khi regex trượt vì frontend đổi cách viết
    expect([...APP_PAGE_KEYS].sort()).toEqual([...feKeys].sort());
  });
});

describe('sanitizeTrangCho', () => {
  it('giữ hai khoá mở khu quản trị nội dung', () => {
    expect(sanitizeTrangCho(['home', 'bien-tap-noi-dung'])).toContain(
      'bien-tap-noi-dung',
    );
    expect(sanitizeTrangCho(['home', 'quan-tri-noi-dung'])).toContain(
      'quan-tri-noi-dung',
    );
  });

  it('giữ nguyên bộ quyền của Lễ Tân trong ảnh chụp lỗi (6 ô tick)', () => {
    const tick = [
      'home',
      'patients',
      'appointments',
      'chan-doan-luoi',
      'bien-tap-noi-dung',
      'quan-tri-noi-dung',
    ];
    expect(sanitizeTrangCho(tick).sort()).toEqual([...tick].sort());
  });

  it('vẫn bỏ khoá bịa và luôn kèm home', () => {
    expect(sanitizeTrangCho(['khoa-khong-co-that'])).toEqual(['home']);
  });
});
