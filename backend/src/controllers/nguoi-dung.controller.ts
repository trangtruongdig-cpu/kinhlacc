import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Admin } from '../models/admin.model';
import { VaiTro } from '../models/vai-tro.model';
import {
  CreateNguoiDungDto,
  UpdateNguoiDungDto,
} from '../models/vai-tro.dto';

/** Dạng dữ liệu trả ra ngoài — KHÔNG bao giờ kèm passwordHash. */
export interface NguoiDungAnToan {
  id: string;
  username: string;
  hoTen: string | null;
  email: string | null;
  trangThai: boolean;
  createdAt: Date;
  vaiTro: { id: string; ma: string; ten: string; laQuanTri: boolean } | null;
}

@Injectable()
export class NguoiDungService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
    @InjectRepository(VaiTro)
    private readonly vaiTroRepo: Repository<VaiTro>,
  ) {}

  private toSafe(a: Admin): NguoiDungAnToan {
    return {
      id: a.id,
      username: a.username,
      hoTen: a.hoTen,
      email: a.email,
      trangThai: a.trangThai,
      createdAt: a.createdAt,
      vaiTro: a.vaiTro
        ? { id: a.vaiTro.id, ma: a.vaiTro.ma, ten: a.vaiTro.ten, laQuanTri: a.vaiTro.laQuanTri }
        : null,
    };
  }

  async findAll(): Promise<NguoiDungAnToan[]> {
    const list = await this.adminRepo.find({ order: { createdAt: 'ASC' } });
    return list.map((a) => this.toSafe(a));
  }

  async findOne(id: string): Promise<NguoiDungAnToan> {
    const a = await this.adminRepo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Không tìm thấy tài khoản.');
    return this.toSafe(a);
  }

  /** Đếm số Quản Trị Viên đang hoạt động (để chặn khoá/xoá người admin cuối cùng). */
  private async demQuanTriHoatDong(excludeId?: string): Promise<number> {
    const qb = this.adminRepo
      .createQueryBuilder('a')
      .innerJoin('a.vaiTro', 'vt')
      .where('a.trangThai = :active', { active: true })
      .andWhere('vt.laQuanTri = true');
    if (excludeId) qb.andWhere('a.id != :id', { id: excludeId });
    return qb.getCount();
  }

  private async layVaiTro(id: string): Promise<VaiTro> {
    const vt = await this.vaiTroRepo.findOne({ where: { id } });
    if (!vt) throw new BadRequestException('Vai trò không hợp lệ.');
    return vt;
  }

  async create(dto: CreateNguoiDungDto): Promise<NguoiDungAnToan> {
    const username = (dto.username || '').trim();
    if (!username) throw new BadRequestException('Tên đăng nhập không được để trống.');
    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự.');
    }
    if (!dto.vaiTroId) throw new BadRequestException('Phải chọn vai trò.');

    const trung = await this.adminRepo.findOne({ where: { username } });
    if (trung) throw new ConflictException('Tên đăng nhập đã tồn tại.');

    await this.layVaiTro(dto.vaiTroId);

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const a = this.adminRepo.create({
      username,
      passwordHash,
      hoTen: dto.hoTen?.trim() || null,
      email: dto.email?.trim() || null,
      vaiTroId: dto.vaiTroId,
      trangThai: dto.trangThai ?? true,
    });
    const saved = await this.adminRepo.save(a);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateNguoiDungDto, currentUserId?: string): Promise<NguoiDungAnToan> {
    const a = await this.adminRepo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Không tìm thấy tài khoản.');

    // Xác định trạng thái/vai trò SAU khi cập nhật để kiểm tra ràng buộc admin cuối.
    const trangThaiMoi = dto.trangThai ?? a.trangThai;
    const vaiTroMoi = dto.vaiTroId ? await this.layVaiTro(dto.vaiTroId) : a.vaiTro;
    const conLaQuanTri = !!vaiTroMoi?.laQuanTri && trangThaiMoi === true;

    const dangLaQuanTriHoatDong = !!a.vaiTro?.laQuanTri && a.trangThai === true;
    if (dangLaQuanTriHoatDong && !conLaQuanTri) {
      const conLai = await this.demQuanTriHoatDong(id);
      if (conLai === 0) {
        throw new BadRequestException(
          'Đây là Quản Trị Viên hoạt động cuối cùng — không thể khoá hoặc đổi vai trò. Hãy tạo/đặt một Quản Trị Viên khác trước.',
        );
      }
    }
    if (currentUserId && currentUserId === id && trangThaiMoi === false) {
      throw new BadRequestException('Bạn không thể tự khoá tài khoản của chính mình.');
    }

    if (dto.hoTen !== undefined) a.hoTen = dto.hoTen.trim() || null;
    if (dto.email !== undefined) a.email = dto.email.trim() || null;
    if (dto.vaiTroId !== undefined) a.vaiTroId = dto.vaiTroId;
    if (dto.trangThai !== undefined) a.trangThai = dto.trangThai;

    await this.adminRepo.save(a);
    return this.findOne(id);
  }

  async doiMatKhau(id: string, password: string): Promise<{ success: true }> {
    if (!password || password.length < 6) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự.');
    }
    const a = await this.adminRepo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Không tìm thấy tài khoản.');
    a.passwordHash = await bcrypt.hash(password, 10);
    await this.adminRepo.save(a);
    return { success: true };
  }

  async remove(id: string, currentUserId?: string): Promise<{ success: true }> {
    const a = await this.adminRepo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Không tìm thấy tài khoản.');
    if (currentUserId && currentUserId === id) {
      throw new BadRequestException('Bạn không thể xoá tài khoản của chính mình.');
    }
    if (a.vaiTro?.laQuanTri && a.trangThai) {
      const conLai = await this.demQuanTriHoatDong(id);
      if (conLai === 0) {
        throw new BadRequestException('Không thể xoá Quản Trị Viên hoạt động cuối cùng.');
      }
    }
    await this.adminRepo.remove(a);
    return { success: true };
  }
}
