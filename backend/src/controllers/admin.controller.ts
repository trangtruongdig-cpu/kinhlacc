import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../models/admin.model';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private adminsRepository: Repository<Admin>,
  ) {}

  // vaiTro được load tự động nhờ eager:true trên quan hệ.
  async findByUsername(username: string): Promise<Admin | null> {
    return this.adminsRepository.findOne({ where: { username } });
  }

  async findById(id: string): Promise<Admin | null> {
    return this.adminsRepository.findOne({ where: { id } });
  }

  async create(
    username: string,
    passwordHash: string,
    extra?: Partial<Pick<Admin, 'hoTen' | 'email' | 'vaiTroId' | 'trangThai'>>,
  ): Promise<Admin> {
    const admin = this.adminsRepository.create({
      username,
      passwordHash,
      hoTen: extra?.hoTen ?? null,
      email: extra?.email ?? null,
      vaiTroId: extra?.vaiTroId ?? null,
      trangThai: extra?.trangThai ?? true,
    });
    return this.adminsRepository.save(admin);
  }

  /** Gán vai trò cho 1 tài khoản (dùng cho seed/sửa nhanh). */
  async setVaiTro(id: string, vaiTroId: string): Promise<void> {
    await this.adminsRepository.update({ id }, { vaiTroId });
  }
}
