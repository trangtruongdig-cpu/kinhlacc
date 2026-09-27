import {
  CMS_VAI_TRO,
  QUYEN_BIEN_TAP_NOI_DUNG,
  QUYEN_QUAN_TRI_NOI_DUNG,
  emailCms,
  vaiTroCmsCho,
} from './ve-cms.util';

/**
 * Phép kiểm cho LUẬT ĐỔI QUYỀN APP → VAI TRÒ CMS.
 *
 * Đây là chỗ duy nhất quyết định một tài khoản vào khu quản trị nội dung với tư cách gì.
 * Sai một bậc ở đây là cấp nhầm quyền xoá vĩnh viễn cho người chỉ được phép sửa bài —
 * mà EmDash không hỏi lại lần nào. Vì thế luật nằm trong hàm thuần, kiểm được, thay vì
 * rải trong controller.
 */
describe('vaiTroCmsCho', () => {
  it('vai trò Quản Trị của app → Admin CMS, không cần tick gì thêm', () => {
    expect(vaiTroCmsCho({ laQuanTri: true, trangCho: [] })).toBe(
      CMS_VAI_TRO.QUAN_TRI,
    );
  });

  it('tick "quản trị nội dung" → Admin CMS', () => {
    expect(
      vaiTroCmsCho({ laQuanTri: false, trangCho: [QUYEN_QUAN_TRI_NOI_DUNG] }),
    ).toBe(CMS_VAI_TRO.QUAN_TRI);
  });

  it('tick "biên tập nội dung" → Biên Tập CMS', () => {
    expect(
      vaiTroCmsCho({ laQuanTri: false, trangCho: [QUYEN_BIEN_TAP_NOI_DUNG] }),
    ).toBe(CMS_VAI_TRO.BIEN_TAP);
  });

  it('tick CẢ HAI thì lấy bậc CAO hơn', () => {
    expect(
      vaiTroCmsCho({
        laQuanTri: false,
        trangCho: [QUYEN_BIEN_TAP_NOI_DUNG, QUYEN_QUAN_TRI_NOI_DUNG],
      }),
    ).toBe(CMS_VAI_TRO.QUAN_TRI);
  });

  it('có quyền trang khác nhưng KHÔNG có quyền nội dung → không vào được', () => {
    expect(
      vaiTroCmsCho({ laQuanTri: false, trangCho: ['patients', 'users'] }),
    ).toBeNull();
  });

  it('tài khoản chưa gán vai trò nào → không vào được', () => {
    expect(vaiTroCmsCho(null)).toBeNull();
    expect(vaiTroCmsCho(undefined)).toBeNull();
  });

  it('trangCho rỗng/thiếu không làm vỡ hàm', () => {
    expect(vaiTroCmsCho({ laQuanTri: false, trangCho: [] })).toBeNull();
    expect(
      vaiTroCmsCho({ laQuanTri: false } as { laQuanTri: boolean }),
    ).toBeNull();
  });
});

/**
 * EmDash định danh người dùng BẰNG EMAIL. Cột admins.email cho phép để trống, nên
 * phải có luật sinh email thay thế — và luật đó phải ỔN ĐỊNH: cùng một tài khoản
 * phải luôn ra cùng một email, nếu không mỗi lần vào lại đẻ một người dùng CMS mới.
 */
describe('emailCms', () => {
  it('dùng email thật khi có', () => {
    expect(emailCms({ username: 'lan', email: 'lan@phongchantri.vn' })).toBe(
      'lan@phongchantri.vn',
    );
  });

  it('chuẩn hoá email thật về chữ thường, bỏ khoảng trắng thừa', () => {
    expect(emailCms({ username: 'lan', email: '  Lan@Example.COM ' })).toBe(
      'lan@example.com',
    );
  });

  it('email trống → sinh địa chỉ nội bộ theo username', () => {
    expect(emailCms({ username: 'thuy', email: null })).toBe(
      'thuy@noi-bo.kinhlac.online',
    );
    expect(emailCms({ username: 'thuy', email: '   ' })).toBe(
      'thuy@noi-bo.kinhlac.online',
    );
  });

  it('chuỗi KHÔNG phải email thì cũng coi như trống — không đưa rác vào CMS', () => {
    expect(emailCms({ username: 'thuy', email: 'chua co' })).toBe(
      'thuy@noi-bo.kinhlac.online',
    );
  });

  it('username có dấu/ký tự lạ vẫn ra địa chỉ hợp lệ và LẶP LẠI ĐƯỢC', () => {
    const a = emailCms({ username: 'Nguyễn Thị Lan', email: null });
    const b = emailCms({ username: 'Nguyễn Thị Lan', email: null });
    expect(a).toBe(b);
    expect(a).toBe('nguyen-thi-lan@noi-bo.kinhlac.online');
  });

  it('username rỗng sau khi lọc vẫn phải ra một địa chỉ dùng được', () => {
    expect(emailCms({ username: '@@@', email: null })).toBe(
      'nguoi-dung@noi-bo.kinhlac.online',
    );
  });
});
