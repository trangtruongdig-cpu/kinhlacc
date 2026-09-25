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
