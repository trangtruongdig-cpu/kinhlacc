import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminsService } from './admin.controller';
import { Admin } from '../models/admin.model';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private adminsService: AdminsService,
    private jwtService: JwtService,
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
}
