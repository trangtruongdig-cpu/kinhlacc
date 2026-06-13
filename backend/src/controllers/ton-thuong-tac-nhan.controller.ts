import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { TonThuongTacNhan } from '../models/ton-thuong-tac-nhan.model';
import {
  CreateTonThuongTacNhanDto,
  UpdateTonThuongTacNhanDto,
} from '../models/ton-thuong-tac-nhan.dto';

export interface PaginatedTonThuongTacNhan {
  data: TonThuongTacNhan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class TonThuongTacNhanService {
  constructor(
    @InjectRepository(TonThuongTacNhan)
    private readonly repo: Repository<TonThuongTacNhan>,
  ) {}

  findAll(): Promise<TonThuongTacNhan[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findPaginated(
    page: number = 1,
    limit: number = 20,
    search?: string,
  ): Promise<PaginatedTonThuongTacNhan> {
    const skip = (page - 1) * limit;
    const keyword = String(search || '').trim();
    const where = keyword ? { ten: ILike(`%${keyword}%`) } : undefined;
    const [data, total] = await this.repo.findAndCount({
      where,
      skip,
      take: limit,
      order: { id: 'ASC' },
    });
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: number): Promise<TonThuongTacNhan> {
    const item = await this.repo.findOneBy({ id });
    if (!item) {
      throw new NotFoundException(`Tổn thương - Tác nhân #${id} không tồn tại`);
    }
    return item;
  }

  async create(dto: CreateTonThuongTacNhanDto): Promise<TonThuongTacNhan> {
    const ten = (dto.ten ?? '').trim();
    if (!ten) {
      throw new ConflictException('Tên không được để trống');
    }
    const existed = await this.repo.findOneBy({ ten });
    if (existed) {
      throw new ConflictException(`Tên "${ten}" đã tồn tại`);
    }
    const ghi_chu = dto.ghi_chu != null ? String(dto.ghi_chu).trim() || null : null;
    const entity = this.repo.create({ ten, ghi_chu });
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateTonThuongTacNhanDto): Promise<TonThuongTacNhan> {
    const item = await this.findOne(id);
    if (dto.ten !== undefined) {
      const ten = dto.ten.trim();
      if (!ten) {
        throw new ConflictException('Tên không được để trống');
      }
      if (ten !== item.ten) {
        const existed = await this.repo.findOneBy({ ten });
        if (existed && existed.id !== id) {
          throw new ConflictException(`Tên "${ten}" đã tồn tại`);
        }
      }
      item.ten = ten;
    }
    if (dto.ghi_chu !== undefined) {
      item.ghi_chu = dto.ghi_chu != null ? String(dto.ghi_chu).trim() || null : null;
    }
    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
