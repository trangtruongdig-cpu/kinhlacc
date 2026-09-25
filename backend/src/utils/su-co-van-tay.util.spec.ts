import {
  chuanHoaRoute,
  chuanHoaThongDiep,
  khuVucTuRoute,
  tinhVanTay,
  cheDuLieu,
  xepHang,
  doanFileLienQuan,
  nenChenBanGhi,
  NGUONG_BAO_MOI_GIO,
} from './su-co-van-tay.util';

/**
 * Tầng lõi của tab "Góp Ý & Lỗi".
 *
 * Vì sao test phần này TRƯỚC: nếu chuẩn hoá sai thì mỗi bệnh nhân sinh một cụm riêng,
 * bảng phình thành rác và tab vô dụng — mà lỗi đó KHÔNG lộ ra lúc chạy thử một mình,
 * chỉ lộ sau vài tuần chạy thật.
 */

describe('chuanHoaRoute', () => {
  it('thay số ID bằng :id để mọi bệnh nhân rơi vào CÙNG một cụm', () => {
    expect(chuanHoaRoute('/patients/123/kham/45')).toBe(
      '/patients/:id/kham/:id',
    );
    expect(chuanHoaRoute('/patients/8/kham/9')).toBe('/patients/:id/kham/:id');
  });

  it('thay uuid bằng :id', () => {
    expect(chuanHoaRoute('/vai-tro/3f2504e0-4f89-11d3-9a0c-0305e82c3301')).toBe(
      '/vai-tro/:id',
    );
  });

  it('thay ngày YYYY-MM-DD bằng :date (lịch trị liệu đi theo ngày)', () => {
    expect(chuanHoaRoute('/appointments/2026-09-25')).toBe(
      '/appointments/:date',
    );
  });

  it('bỏ query và hash — cùng một trang, khác tham số vẫn là một cụm', () => {
    expect(chuanHoaRoute('/tra-cuu?ten=cam-thao&trang=2')).toBe('/tra-cuu');
    expect(chuanHoaRoute('/app/patients/12#tab=do-kinh-lac')).toBe(
      '/app/patients/:id',
    );
  });

  it('GIỮ NGUYÊN slug chữ — đó là danh tính của trang, không phải tham số', () => {
    expect(chuanHoaRoute('/tu-dien/cam-thao')).toBe('/tu-dien/cam-thao');
    expect(chuanHoaRoute('/kinh-mach-3d')).toBe('/kinh-mach-3d');
  });

  it('chuẩn hoá dấu gạch chéo thừa và chuỗi rỗng', () => {
    expect(chuanHoaRoute('/patients/')).toBe('/patients');
    expect(chuanHoaRoute('')).toBe('/');
    expect(chuanHoaRoute('/')).toBe('/');
  });

  it('thay chuỗi hex dài (token, băm) bằng :id', () => {
    expect(chuanHoaRoute('/tai-lieu/a3f9c2b18d7e4f5a6b0c1d2e3f4a5b6c')).toBe(
      '/tai-lieu/:id',
    );
  });
});

describe('chuanHoaThongDiep', () => {
  it('bỏ số để một lỗi ở 500 bệnh nhân không thành 500 cụm', () => {
    expect(
      chuanHoaThongDiep(
        "Cannot read properties of undefined (reading 'ten') at line 412",
      ),
    ).toBe("cannot read properties of undefined (reading 'ten') at line :n");
    expect(chuanHoaThongDiep('Bệnh nhân 8123 không tồn tại')).toBe(
      'bệnh nhân :n không tồn tại',
    );
  });

  it('gộp được hai lần xảy ra chỉ khác ID', () => {
    const a = chuanHoaThongDiep('Không tìm thấy ca khám 4471');
    const b = chuanHoaThongDiep('Không tìm thấy ca khám 9002');
    expect(a).toBe(b);
  });

  it('thay uuid bằng :uuid', () => {
    expect(
      chuanHoaThongDiep('Vai trò 3f2504e0-4f89-11d3-9a0c-0305e82c3301 bị khoá'),
    ).toBe('vai trò :uuid bị khoá');
  });

  it('rút đường dẫn tuyệt đối còn tên file — máy dev và VPS không được thành 2 cụm', () => {
    expect(
      chuanHoaThongDiep(
        'Lỗi tại /Users/truongtrang/Desktop/kinhlacc/backend/src/app.ts',
      ),
    ).toBe('lỗi tại app.ts');
    expect(
      chuanHoaThongDiep('Lỗi tại /app/dist/controllers/patient.controller.js'),
    ).toBe('lỗi tại patient.controller.js');
  });

  it('gộp khoảng trắng và cắt còn 200 ký tự', () => {
    expect(chuanHoaThongDiep('a   b\n\nc')).toBe('a b c');
    expect(chuanHoaThongDiep('x'.repeat(400))).toHaveLength(200);
  });

  it('chịu được đầu vào rỗng / không phải chuỗi', () => {
    expect(chuanHoaThongDiep('')).toBe('');
    expect(chuanHoaThongDiep(undefined as unknown as string)).toBe('');
  });
});

describe('tinhVanTay', () => {
  it('cùng đầu vào → cùng vân tay (ổn định giữa các lần khởi động)', () => {
    const a = tinhVanTay(
      'loi_fe',
      '/patients/:id',
      'cannot read ten of undefined',
    );
    const b = tinhVanTay(
      'loi_fe',
      '/patients/:id',
      'cannot read ten of undefined',
    );
    expect(a).toBe(b);
  });

  it('khác loại / khác route / khác thông điệp → khác vân tay', () => {
    const goc = tinhVanTay('loi_fe', '/patients/:id', 'loi a');
    expect(tinhVanTay('loi_be', '/patients/:id', 'loi a')).not.toBe(goc);
    expect(tinhVanTay('loi_fe', '/medicines', 'loi a')).not.toBe(goc);
    expect(tinhVanTay('loi_fe', '/patients/:id', 'loi b')).not.toBe(goc);
  });

  it('dài 16 ký tự hex — đủ tránh trùng, đủ ngắn để hiện trên bảng', () => {
    expect(tinhVanTay('ux', '/', 'cham')).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('cheDuLieu', () => {
  it('che khoá nhạy cảm kỹ thuật', () => {
    expect(cheDuLieu({ password: 'abc123', token: 'ey...' })).toEqual({
      password: '***',
      token: '***',
    });
  });

  it('che danh tính bệnh nhân — bảng lỗi không được thành bản sao bệnh án', () => {
    expect(
      cheDuLieu({
        hoTen: 'Nguyễn Văn A',
        sdt: '0987654321',
        ngaySinh: '1980-01-01',
      }),
    ).toEqual({ hoTen: '***', sdt: '***', ngaySinh: '***' });
  });

  it('GIỮ khoá kỹ thuật cần cho việc sửa lỗi', () => {
    expect(cheDuLieu({ id: 12, route: '/patients/12', status: 500 })).toEqual({
      id: 12,
      route: '/patients/12',
      status: 500,
    });
  });

  it('che số điện thoại nằm lẫn trong câu văn', () => {
    expect(cheDuLieu('Không gửi được SMS tới 0987654321')).toBe(
      'Không gửi được SMS tới ***',
    );
  });

  it('che theo chiều sâu và không vỡ vì tham chiếu vòng', () => {
    const o: Record<string, unknown> = { a: { b: { password: 'x' } } };
    o.tuThan = o;
    expect(cheDuLieu(o)).toEqual({
      a: { b: { password: '***' } },
      tuThan: '[vòng]',
    });
  });

  it('cắt chuỗi quá dài và mảng quá lớn', () => {
    expect(cheDuLieu('y'.repeat(500)) as string).toHaveLength(300 + '…'.length);
    expect((cheDuLieu(new Array(100).fill(1)) as unknown[]).length).toBe(20);
  });
});

describe('xepHang', () => {
  it('lỗi dính nhiều người → NẶNG', () => {
    expect(xepHang({ loai: 'loi_be', soLan: 5, soNguoi: 3 })).toBe('nang');
  });

  it('lỗi lặp nhiều lần dù một người → NẶNG', () => {
    expect(xepHang({ loai: 'loi_fe', soLan: 20, soNguoi: 1 })).toBe('nang');
  });

  it('lỗi chặn thao tác được nâng một bậc — không lưu được ca khám là chuyện lớn', () => {
    expect(xepHang({ loai: 'loi_be', soLan: 1, soNguoi: 1 })).toBe('nhe');
    expect(
      xepHang({ loai: 'loi_be', soLan: 1, soNguoi: 1, chanThaoTac: true }),
    ).toBe('vua');
  });

  it('góp ý của người thật luôn ít nhất hạng VỪA — có người bỏ công gõ', () => {
    expect(xepHang({ loai: 'gop_y', soLan: 1, soNguoi: 1 })).toBe('vua');
  });

  it('tín hiệu UX mặc định NHẸ, chỉ nặng lên khi dính nhiều người', () => {
    expect(xepHang({ loai: 'ux', soLan: 50, soNguoi: 1 })).toBe('nhe');
    expect(xepHang({ loai: 'ux', soLan: 50, soNguoi: 10 })).toBe('vua');
  });
});

describe('nenChenBanGhi (chống bão sự kiện)', () => {
  it('cho chèn khi cụm còn dưới ngưỡng', () => {
    expect(nenChenBanGhi(0)).toBe(true);
    expect(nenChenBanGhi(NGUONG_BAO_MOI_GIO - 1)).toBe(true);
  });

  it('CHẶN chèn khi cụm đã vượt ngưỡng trong 1 giờ — chỉ tăng bộ đếm', () => {
    expect(nenChenBanGhi(NGUONG_BAO_MOI_GIO)).toBe(false);
    expect(nenChenBanGhi(5000)).toBe(false);
  });
});

describe('khuVucTuRoute', () => {
  it('lấy đoạn đầu có nghĩa làm khu vực', () => {
    expect(khuVucTuRoute('/patients/:id/kham/:id')).toBe('patients');
    expect(khuVucTuRoute('/app/kinh-mach-3d')).toBe('kinh-mach-3d');
    expect(khuVucTuRoute('/api/su-co/bao')).toBe('su-co');
  });

  it('trang gốc là "home"', () => {
    expect(khuVucTuRoute('/')).toBe('home');
    expect(khuVucTuRoute('/app')).toBe('home');
  });
});

describe('doanFileLienQuan', () => {
  it('rút tên file từ stack trace (nguồn đáng tin nhất)', () => {
    const stack = [
      'TypeError: x is undefined',
      '    at bocLop (/app/dist/controllers/thuong-han.controller.js:88:17)',
      '    at ThuongHanService.tra (/app/dist/controllers/thuong-han.controller.js:120:9)',
    ].join('\n');
    expect(doanFileLienQuan(stack, 'loi_be', 'thuong-han')).toContain(
      'backend/src/controllers/thuong-han.controller.ts',
    );
  });

  it('đổi đuôi .js của bản build về .ts của mã nguồn', () => {
    const files = doanFileLienQuan(
      'at f (/app/dist/utils/ics.util.js:10:1)',
      'loi_be',
      'x',
    );
    expect(files.some((f) => f.endsWith('.js'))).toBe(false);
  });

  it('không có stack thì suy từ khu vực theo quy ước đặt tên của dự án', () => {
    const files = doanFileLienQuan(null, 'loi_be', 'patients');
    expect(files).toContain('backend/src/routers/patients.router.ts');
    expect(files).toContain('backend/src/controllers/patients.controller.ts');
  });

  it('lỗi frontend thì trỏ vào frontend, không trỏ vào backend', () => {
    const files = doanFileLienQuan(
      'at setup (KinhMach3DView.vue:44:8)',
      'loi_fe',
      'kinh-mach-3d',
    );
    expect(files.some((f) => f.startsWith('frontend/'))).toBe(true);
    expect(files.some((f) => f.startsWith('backend/'))).toBe(false);
  });

  it('bỏ qua file của thư viện ngoài — không ai sửa được node_modules', () => {
    const stack =
      'at Object.next (/app/node_modules/rxjs/dist/cjs/internal/Subscriber.js:10:1)';
    expect(doanFileLienQuan(stack, 'loi_be', 'x')).not.toContain(
      'backend/src/node_modules/rxjs/dist/cjs/internal/Subscriber.ts',
    );
  });

  it('không lặp và không quá 8 mục — danh sách dài thì vô dụng', () => {
    const stack = new Array(40)
      .fill(0)
      .map((_, i) => `    at f (/app/dist/controllers/c${i}.controller.js:1:1)`)
      .join('\n');
    const files = doanFileLienQuan(stack, 'loi_be', 'x');
    expect(files.length).toBeLessThanOrEqual(8);
    expect(new Set(files).size).toBe(files.length);
  });
});
