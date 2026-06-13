import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CongDung } from '../models/cong-dung.model';
import { CreateCongDungDto, UpdateCongDungDto } from '../models/cong-dung.dto';
import { catalogKey, formatCatalogLabel } from '../utils/catalog-label.util';

@Injectable()
export class CongDungService {
  constructor(
    @InjectRepository(CongDung)
    private readonly repo: Repository<CongDung>,
  ) {}

  findAll(): Promise<CongDung[]> {
    return this.repo.find({ order: { ten_cong_dung: 'ASC' } });
  }

  async findOne(id: number): Promise<CongDung> {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException(`Công dụng #${id} không tồn tại`);
    return item;
  }

  async create(dto: CreateCongDungDto): Promise<CongDung> {
    const label = formatCatalogLabel(dto.ten_cong_dung ?? '');
    if (!label) throw new BadRequestException('Tên công dụng không được để trống');
    const key = catalogKey(label);
    const rows = await this.repo.find();
    const dup = rows.find((r) => catalogKey(r.ten_cong_dung) === key);
    if (dup) return dup;
    const entity = this.repo.create({
      ten_cong_dung: label,
      ghi_chu: dto.ghi_chu ?? '',
    });
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateCongDungDto): Promise<CongDung> {
    const item = await this.findOne(id);
    if (dto.ten_cong_dung != null) {
      const label = formatCatalogLabel(dto.ten_cong_dung);
      if (!label) throw new BadRequestException('Tên công dụng không được để trống');
      const key = catalogKey(label);
      const rows = await this.repo.find();
      const dup = rows.find((r) => r.id !== id && catalogKey(r.ten_cong_dung) === key);
      if (dup) {
        throw new BadRequestException(`Đã có công dụng trùng: «${dup.ten_cong_dung}»`);
      }
      item.ten_cong_dung = label;
    }
    if (dto.ghi_chu !== undefined) item.ghi_chu = dto.ghi_chu;
    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
