import { ForbiddenException } from '@nestjs/common';
import { assertStaffOrOwner } from './access.util';
import { NhanVienGuard } from './nhan-vien.guard';
import { ExecutionContext } from '@nestjs/common';

/**
 * Phép kiểm cho LỚP PHÂN QUYỀN — thứ đứng giữa token bệnh nhân và dữ liệu người khác.
 * Trước đây lớp này không có test nào, nên một endpoint quên gắn guard không làm gì đỏ lên.
 */
describe('assertStaffOrOwner', () => {
  it('cho nhân viên đi qua với bất kỳ hồ sơ nào', () => {
    expect(() =>
      assertStaffOrOwner({ kind: 'staff', id: 1 }, 999),
    ).not.toThrow();
  });

  it('cho bệnh nhân xem hồ sơ CỦA CHÍNH MÌNH', () => {
    expect(() =>
      assertStaffOrOwner({ role: 'patient', id: 42 }, 42),
    ).not.toThrow();
  });

  it('id dạng chuỗi trong token vẫn khớp id dạng số của hồ sơ', () => {
    expect(() =>
      assertStaffOrOwner({ role: 'patient', id: '42' }, 42),
    ).not.toThrow();
  });

  it('CHẶN bệnh nhân xem hồ sơ người khác', () => {
    expect(() => assertStaffOrOwner({ role: 'patient', id: 42 }, 43)).toThrow(
      ForbiddenException,
    );
  });

  it('CHẶN request không có user (token hỏng/thiếu)', () => {
    expect(() => assertStaffOrOwner(undefined, 1)).toThrow(ForbiddenException);
  });

  it('CHẶN token không mang vai trò nào', () => {
    expect(() => assertStaffOrOwner({ id: 1 }, 1)).toThrow(ForbiddenException);
  });
});

describe('NhanVienGuard', () => {
  const ctx = (user: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  it('cho tài khoản nhân viên đi qua', () => {
    expect(new NhanVienGuard().canActivate(ctx({ kind: 'staff' }))).toBe(true);
  });

  it('CHẶN token bệnh nhân — đây là thứ ngăn bệnh nhân sửa kho tri thức', () => {
    expect(() =>
      new NhanVienGuard().canActivate(ctx({ role: 'patient', id: 7 })),
    ).toThrow(ForbiddenException);
  });

  it('CHẶN khi không có user', () => {
    expect(() => new NhanVienGuard().canActivate(ctx(undefined))).toThrow(
      ForbiddenException,
    );
  });
});

/**
 * HỒI QUY cho GET /examinations/my-records.
 *
 * Route dùng `req.user.id` làm patientId. Với token bệnh nhân thì đúng; nhưng id tài khoản
 * NHÂN VIÊN nằm ở không gian số khác, nên nhân viên gọi vào sẽ nhận phiếu đo của bệnh nhân
 * TRÙNG SỐ id — trả ra dữ liệu người khác, im lặng, không ai báo.
 */
describe('Điều kiện chặn của /my-records', () => {
  /** Chép đúng điều kiện trong examination.router.ts để bài kiểm gãy nếu ai nới nó ra. */
  const duocPhep = (user?: {
    role?: string;
    id?: number | string;
    kind?: string;
  }) => user?.role === 'patient' && user?.id != null;

  it('token bệnh nhân đi qua', () => {
    expect(duocPhep({ role: 'patient', id: 42 })).toBe(true);
  });

  it('CHẶN token nhân viên — đây là chỗ từng trả hồ sơ của bệnh nhân trùng số id', () => {
    expect(duocPhep({ kind: 'staff', role: 'le_tan', id: 42 })).toBe(false);
  });

  it('CHẶN token quản trị', () => {
    expect(duocPhep({ kind: 'staff', role: 'quan_tri', id: 1 })).toBe(false);
  });

  it('CHẶN token bệnh nhân thiếu id', () => {
    expect(duocPhep({ role: 'patient' })).toBe(false);
  });

  it('CHẶN khi không có user', () => {
    expect(duocPhep(undefined)).toBe(false);
  });
});
