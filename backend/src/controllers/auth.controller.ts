import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { AdminsService } from './admin.controller';
import { Admin } from '../models/admin.model';
import { emailCms, vaiTroCmsCho } from '../utils/ve-cms.util';
import * as bcrypt from 'bcryptjs';

/** Vé sang CMS sống rất ngắn: nó chỉ phải đi hết một lời gọi fetch cùng nguồn gốc. */
const VE_CMS_SONG_GIAY = 60;

@Injectable()
export class AuthService {
  constructor(
    private adminsService: AdminsService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /** Đối tượng user trả ra frontend — kèm danh sách trang được phép (trangCho). */
  private buildUser(admin: Admin) {
    return {
      id: admin.id,
      username: admin.username,
      hoTen: admin.hoTen,
      email: admin.email,
      vaiTro: admin.vaiTro
        ? {
            id: admin.vaiTro.id,
            ma: admin.vaiTro.ma,
            ten: admin.vaiTro.ten,
            laQuanTri: admin.vaiTro.laQuanTri,
            trangCho: admin.vaiTro.trangCho || [],
          }
        : null,
    };
  }

  async validateAdmin(username: string, pass: string): Promise<Admin | null> {
    const admin = await this.adminsService.findByUsername(username);
    if (!admin) return null;
    if (admin.trangThai === false) {
      throw new UnauthorizedException('Tài khoản đã bị khoá. Vui lòng liên hệ Quản Trị Viên.');
    }
    if (!(await bcrypt.compare(pass, admin.passwordHash))) return null;
    return admin;
  }

  async login(admin: Admin) {
    const payload = {
      username: admin.username,
      sub: admin.id,
      role: admin.vaiTro?.ma ?? null,
      kind: 'staff',
      quanTri: admin.vaiTro?.laQuanTri ?? false,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: this.buildUser(admin),
    };
  }

  /** Lấy thông tin user hiện tại (quyền mới nhất từ DB). */
  async me(userId: string) {
    const admin = await this.adminsService.findById(userId);
    if (!admin) throw new UnauthorizedException('Tài khoản không tồn tại.');
    if (admin.trangThai === false) {
      throw new UnauthorizedException('Tài khoản đã bị khoá.');
    }
    return this.buildUser(admin);
  }

  /**
   * Cấp VÉ để vào thẳng khu quản trị nội dung (CMS) mà không phải đăng nhập lần nữa.
   *
   * Vé là một JWT sống 60 giây, dùng MỘT LẦN, ký bằng `CMS_SSO_SECRET`.
   *
   * ⚠️ Bí mật RIÊNG, cố ý không dùng lại `JWT_SECRET`. Hai tiến trình khác nhau phải
   * cùng biết bí mật này, nên nó nằm trong cả `backend/.env` lẫn `cms/.env`. Nếu dùng
   * chung `JWT_SECRET` thì một ngày CMS bị chiếm là kẻ tấn công đúc được token của
   * TOÀN BỘ app — kể cả hồ sơ bệnh nhân. Với bí mật riêng, thứ tệ nhất họ đúc được
   * chỉ là vé vào chính cái CMS họ đã chiếm.
   *
   * ⚠️ Quyền đọc LẠI từ DB, không lấy trong token của người gọi: token sống 1 ngày,
   * quyền có thể vừa bị thu hồi mười phút trước.
   */
  async taoVeCms(userId: string) {
    const biMat = this.configService.get<string>('CMS_SSO_SECRET');
    if (!biMat) {
      // Nằm im ở đây là kiểu hỏng tệ nhất: người dùng bấm nút, không có gì xảy ra,
      // không ai biết vì sao. Nói thẳng ra là thiếu cấu hình.
      throw new ServiceUnavailableException(
        'Chưa cấu hình CMS_SSO_SECRET trên máy chủ nên chưa mở được khu quản trị nội dung. Liên hệ người quản trị hệ thống.',
      );
    }

    const admin = await this.adminsService.findById(userId);
    if (!admin) throw new UnauthorizedException('Tài khoản không tồn tại.');
    if (admin.trangThai === false) {
      throw new UnauthorizedException('Tài khoản đã bị khoá.');
    }

    const vaiTroCms = vaiTroCmsCho(admin.vaiTro);
    if (vaiTroCms === null) {
      throw new ForbiddenException(
        'Tài khoản của bạn chưa được cấp quyền Biên Tập Nội Dung hoặc Quản Trị Nội Dung.',
      );
    }

    const ve = this.jwtService.sign(
      {
        email: emailCms(admin),
        ten: admin.hoTen || admin.username,
        vaiTro: vaiTroCms,
        jti: randomUUID(),
      },
      {
        secret: biMat,
        expiresIn: `${VE_CMS_SONG_GIAY}s`,
        subject: admin.id,
        issuer: 'kinhlac-app',
        audience: 'kinhlac-cms',
      },
    );

    return { ve, songGiay: VE_CMS_SONG_GIAY };
  }
}
