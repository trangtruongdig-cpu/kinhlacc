import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../models/patient.model';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PatientAuthService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly jwtService: JwtService,
  ) {}

  async register(phone: string, password: string, fullName?: string): Promise<any> {
    const existingPatient = await this.patientRepository.findOne({ where: { phone } });
    if (existingPatient) {
      if (existingPatient.passwordHash) {
        throw new BadRequestException('Số điện thoại này đã được đăng ký!');
      } else {
        // Patient exists but without password (maybe created by admin previously), update it
        existingPatient.passwordHash = await bcrypt.hash(password, 10);
        if (fullName) existingPatient.fullName = fullName;
        await this.patientRepository.save(existingPatient);
        return this.login(existingPatient);
      }
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const newPatient = this.patientRepository.create({
      phone,
      passwordHash,
      fullName: fullName || 'Bệnh nhân mới',
    });
    
    await this.patientRepository.save(newPatient);
    return this.login(newPatient);
  }

  async validatePatient(phone: string, pass: string): Promise<Patient | null> {
    const patient = await this.patientRepository.findOne({ where: { phone } });
    if (patient && patient.passwordHash && (await bcrypt.compare(pass, patient.passwordHash))) {
      return patient;
    }
    return null;
  }

  /**
   * Tự xoá tài khoản (soft delete) — bệnh nhân xác minh bằng SĐT + mật khẩu rồi yêu cầu xoá.
   * Trả về true nếu xác minh đúng và đã đánh dấu xoá; false nếu sai thông tin đăng nhập.
   * Sau khi xoá: bản ghi vẫn còn trong DB nhưng `deletedAt` đã set → không đăng nhập được,
   * không hiện ở các danh sách (TypeORM tự lọc).
   */
  async requestDeletion(phone: string, pass: string): Promise<boolean> {
    const patient = await this.validatePatient(phone, pass);
    if (!patient) {
      return false;
    }
    await this.patientRepository.softDelete(patient.id);
    return true;
  }

  /**
   * Quên mật khẩu — đặt lại về MẶC ĐỊNH là CHÍNH số điện thoại.
   *
   * ⚠️ Không có bước xác minh nào: không OTP, không nhân viên duyệt. Ai gõ đúng một số điện
   * thoại đã đăng ký cũng đặt lại được mật khẩu của người đó, mà mật khẩu mới lại chính là số
   * điện thoại — tức cũng là TÊN ĐĂNG NHẬP. Nói thẳng hệ quả: biết số điện thoại của một khách
   * là đọc được phiếu đo, chẩn đoán và lịch trị liệu của khách đó. Đây là quyết định của chủ
   * phòng chẩn trị, chốt ngày 20/10/2026 SAU khi đã nêu rủi ro, không phải sơ sót — đừng
   * "sửa" nó ở chỗ khác. Muốn siết thì thêm OTP hoặc bước nhân viên duyệt, và chỗ sửa là
   * đúng hàm này.
   *
   * Chỉ nhận tài khoản ĐÃ có mật khẩu: hồ sơ do nhân viên lập hộ (`passwordHash` null) chưa
   * phải tài khoản, đặt mật khẩu cho nó ở đây là tự mở tài khoản thay người ta.
   */
  async datLaiMatKhauMacDinh(phone: string): Promise<boolean> {
    const patient = await this.patientRepository.findOne({ where: { phone } });
    if (!patient || !patient.passwordHash) return false;
    patient.passwordHash = await bcrypt.hash(phone, 10);
    await this.patientRepository.save(patient);
    return true;
  }

  async login(patient: Patient) {
    const payload = { phone: patient.phone, sub: patient.id, role: 'patient' };
    return {
      access_token: this.jwtService.sign(payload),
      patient: {
        id: patient.id,
        phone: patient.phone,
        fullName: patient.fullName,
      }
    };
  }
}
