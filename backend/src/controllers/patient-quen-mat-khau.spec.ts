import * as bcrypt from 'bcryptjs';
import { PatientAuthService } from './patient-auth.controller';
import { Patient } from '../models/patient.model';

/**
 * Quên mật khẩu của bệnh nhân — đặt lại về CHÍNH số điện thoại.
 *
 * Phép kiểm neo đúng một luật dễ mất khi ai đó "đơn giản hoá": hồ sơ do nhân viên lập hộ
 * (`passwordHash` null) CHƯA phải tài khoản, nên cửa này không được đặt mật khẩu cho nó —
 * làm vậy là tự mở tài khoản thay người ta, và mở cho cả kho bệnh nhân chứ không riêng
 * người đã đăng ký.
 */
describe('PatientAuthService.datLaiMatKhauMacDinh', () => {
  function dungService(patient: Partial<Patient> | null) {
    const daLuu: Partial<Patient>[] = [];
    const repo = {
      findOne: jest.fn().mockResolvedValue(patient),
      save: jest.fn().mockImplementation((p: Partial<Patient>) => {
        daLuu.push(p);
        return Promise.resolve(p);
      }),
    };
    const service = new PatientAuthService(repo as never, {} as never);
    return { service, repo, daLuu };
  }

  it('đặt mật khẩu thành chính số điện thoại khi tài khoản đã đăng ký', async () => {
    const { service, daLuu } = dungService({
      id: 7,
      phone: '0912345678',
      passwordHash: await bcrypt.hash('matkhaucu', 10),
    });

    await expect(service.datLaiMatKhauMacDinh('0912345678')).resolves.toBe(true);
    expect(daLuu).toHaveLength(1);
    expect(await bcrypt.compare('0912345678', daLuu[0].passwordHash!)).toBe(true);
    expect(await bcrypt.compare('matkhaucu', daLuu[0].passwordHash!)).toBe(false);
  });

  it('KHÔNG ghi gì cho hồ sơ chưa có mật khẩu (nhân viên lập hộ, chưa đăng ký)', async () => {
    const { service, repo } = dungService({ id: 8, phone: '0900000000', passwordHash: null });

    await expect(service.datLaiMatKhauMacDinh('0900000000')).resolves.toBe(false);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('KHÔNG ghi gì khi số điện thoại không có trong hệ thống', async () => {
    const { service, repo } = dungService(null);

    await expect(service.datLaiMatKhauMacDinh('0000000000')).resolves.toBe(false);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
