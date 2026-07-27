import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BenhCauThanh } from '../models/benh-cau-thanh.model';
import { CreateBenhCauThanhDto, UpdateBenhCauThanhDto } from '../models/benh-cau-thanh.dto';

/** Bản ghi cấu thành đã kèm tên chứng (đủ cho FE gộp phương huyệt theo tên). */
export interface BenhCauThanhView {
  id: number;
  compound_id: number;
  component_id: number;
  thu_tu: number;
  ghi_chu: string | null;
  compound: { id: number; tieuket: string | null; chung_trang: string | null } | null;
  component: { id: number; tieuket: string | null; chung_trang: string | null } | null;
}

@Injectable()
export class BenhCauThanhService {
  constructor(
    @InjectRepository(BenhCauThanh)
    private readonly repo: Repository<BenhCauThanh>,
  ) {}

  private view(x: BenhCauThanh): BenhCauThanhView {
    return {
      id: x.id,
      compound_id: x.compoundId,
      component_id: x.componentId,
      thu_tu: x.thu_tu,
      ghi_chu: x.ghi_chu ?? null,
      compound: x.compound
        ? { id: x.compound.id, tieuket: x.compound.tieuket ?? null, chung_trang: x.compound.chung_trang ?? null }
        : null,
      component: x.component
        ? { id: x.component.id, tieuket: x.component.tieuket ?? null, chung_trang: x.component.chung_trang ?? null }
        : null,
    };
  }

  async findAll(compoundId?: number): Promise<BenhCauThanhView[]> {
    const rows = await this.repo.find({
      where: compoundId ? { compoundId } : {},
      relations: ['compound', 'component'],
      order: { compoundId: 'ASC', thu_tu: 'ASC', id: 'ASC' },
    });
    return rows.map((r) => this.view(r));
  }

  async create(dto: CreateBenhCauThanhDto): Promise<BenhCauThanhView> {
    const entity = this.repo.create({
      compoundId: dto.compound_id,
      componentId: dto.component_id,
      thu_tu: dto.thu_tu ?? 0,
      ghi_chu: dto.ghi_chu ?? null,
    });
    const saved = await this.repo.save(entity);
    const full = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['compound', 'component'],
    });
    return this.view(full ?? saved);
  }

  async update(id: number, dto: UpdateBenhCauThanhDto): Promise<BenhCauThanhView> {
    const item = await this.repo.findOne({ where: { id }, relations: ['compound', 'component'] });
    if (!item) throw new NotFoundException(`Cấu thành #${id} không tồn tại`);
    if (dto.compound_id !== undefined) item.compoundId = dto.compound_id;
    if (dto.component_id !== undefined) item.componentId = dto.component_id;
    if (dto.thu_tu !== undefined) item.thu_tu = dto.thu_tu;
    if (dto.ghi_chu !== undefined) item.ghi_chu = dto.ghi_chu ?? null;
    const saved = await this.repo.save(item);
    return this.view(saved);
  }

  async remove(id: number): Promise<void> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Cấu thành #${id} không tồn tại`);
    await this.repo.remove(item);
  }
}
