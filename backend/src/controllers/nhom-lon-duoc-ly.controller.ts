import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NhomLonDuocLy } from '../models/nhom-lon-duoc-ly.model';
import { CreateNhomLonDuocLyDto, UpdateNhomLonDuocLyDto } from '../models/duoc-ly.dto';
import { catalogKey, formatCatalogLabel } from '../utils/catalog-label.util';

@Injectable()
export class NhomLonDuocLyService {
  constructor(
    @InjectRepository(NhomLonDuocLy)
    private readonly repo: Repository<NhomLonDuocLy>,
  ) {}

  private static readonly RELATIONS = [
    'nhomNhoList',
    'nhomNhoList.viThuocLinks',
    'nhomNhoList.viThuocLinks.viThuoc',
    'nhomNhoList.chuTriLinks',
    'nhomNhoList.chuTriLinks.chuTri',
  ] as const;

  findAll(): Promise<NhomLonDuocLy[]> {
    return this.repo.find({
      relations: [...NhomLonDuocLyService.RELATIONS],
      order: { thu_tu: 'ASC', ten_nhom: 'ASC' },
    });
  }

  async findOne(id: number): Promise<NhomLonDuocLy> {
    const item = await this.repo.findOne({
      where: { id },
      relations: [...NhomLonDuocLyService.RELATIONS],
    });
    if (!item) throw new NotFoundException(`Nhóm lớn dược lý #${id} không tồn tại`);
    return item;
  }

  async create(dto: CreateNhomLonDuocLyDto): Promise<NhomLonDuocLy> {
    const label = formatCatalogLabel(dto.ten_nhom ?? '');
    if (!label) throw new BadRequestException('Tên nhóm lớn không được để trống');
    const key = catalogKey(label);
    const rows = await this.repo.find();
    if (rows.find((r) => catalogKey(r.ten_nhom) === key)) {
      throw new BadRequestException(`Đã có nhóm lớn trùng tên: «${label}»`);
    }
    const entity = this.repo.create({
      ten_nhom: label,
      mo_ta: dto.mo_ta ?? null,
      thu_tu: dto.thu_tu ?? 0,
    });
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateNhomLonDuocLyDto): Promise<NhomLonDuocLy> {
    const item = await this.findOne(id);
    if (dto.ten_nhom != null) {
      const label = formatCatalogLabel(dto.ten_nhom);
      if (!label) throw new BadRequestException('Tên nhóm lớn không được để trống');
      const key = catalogKey(label);
      const rows = await this.repo.find();
      if (rows.find((r) => r.id !== id && catalogKey(r.ten_nhom) === key)) {
        throw new BadRequestException(`Đã có nhóm lớn trùng tên: «${label}»`);
      }
      item.ten_nhom = label;
    }
    if (dto.mo_ta !== undefined) item.mo_ta = dto.mo_ta;
    if (dto.thu_tu !== undefined) item.thu_tu = dto.thu_tu;
    await this.repo.save(item);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
