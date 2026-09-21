import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { HuyetVi } from '../models/huyet-vi.model';
import { ViThuoc } from '../models/vi-thuoc.model';
import { CreateHuyetViDto, UpdateHuyetViDto } from '../models/huyet-vi.dto';

@Injectable()
export class HuyetViService {
  constructor(
    @InjectRepository(HuyetVi)
    private readonly repo: Repository<HuyetVi>,
    @InjectRepository(ViThuoc)
    private readonly viThuocRepo: Repository<ViThuoc>,
  ) {}

  /**
   * Gắn kèm tên + chữ Hán của vị thuốc đã ghép, để phiếu huyệt in được cột "vị thuốc tương ứng"
   * mà không phải gọi thêm API. Cố tình KHÔNG dùng relation TypeORM: `id_vi_thuoc` không có khoá
   * ngoại (xem huyet-vi.model.ts), nên vị thuốc đã bị xoá chỉ làm trường này về null, không lỗi.
   */
  private async ganViThuoc<T extends HuyetVi>(items: T[]): Promise<T[]> {
    const ids = [...new Set(items.map((x) => x.id_vi_thuoc).filter((x): x is number => !!x))];
    if (!ids.length) return items;
    const list = await this.viThuocRepo.find({
      where: { id: In(ids) },
      select: ['id', 'ten_vi_thuoc', 'ten_han'],
    });
    const byId = new Map(list.map((v) => [v.id, v]));
    for (const it of items) {
      const v = it.id_vi_thuoc != null ? byId.get(it.id_vi_thuoc) : undefined;
      (it as unknown as { viThuoc: unknown }).viThuoc = v
        ? { id: v.id, ten_vi_thuoc: v.ten_vi_thuoc, ten_han: v.ten_han }
        : null;
    }
    return items;
  }

  findAll(): Promise<HuyetVi[]> {
    return this.repo.find({
      relations: ['kinhMach'],
      order: { idHuyet: 'ASC' },
    });
  }

  /** Paginated + search; filter theo kinh mạch nếu cần. */
  async findLite(opts: {
    page?: number;
    limit?: number;
    q?: string;
    idKinhMach?: number | null;
  }): Promise<{ data: HuyetVi[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Math.floor(opts.page ?? 1));
    const limit = Math.max(1, Math.min(200, Math.floor(opts.limit ?? 12)));
    const q = (opts.q ?? '').trim();
    const idKinhMach = Number.isFinite(opts.idKinhMach as number) ? Number(opts.idKinhMach) : null;

    const qb = this.repo.createQueryBuilder('hv');
    if (q) {
      qb.andWhere(
        '(hv.ten_huyet ILIKE :term OR hv.ma_huyet ILIKE :term OR hv.vi_tri_giai_phau ILIKE :term OR hv.tac_dung ILIKE :term OR hv.loai_huyet ILIKE :term OR hv.chong_chi_dinh ILIKE :term)',
        { term: `%${q}%` },
      );
    }
    if (idKinhMach != null) {
      qb.andWhere('hv.id_kinh_mach = :kmId', { kmId: idKinhMach });
    }
    const [items, total] = await qb
      .orderBy('hv.idHuyet', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    let data: HuyetVi[] = [];
    if (items.length) {
      const ids = items.map((x) => x.idHuyet);
      data = await this.repo.find({
        where: { idHuyet: In(ids) },
        relations: ['kinhMach'],
        order: { idHuyet: 'ASC' },
      });
    }
    return { data: await this.ganViThuoc(data), total, page, limit };
  }

  async findOne(id: number): Promise<HuyetVi> {
    const item = await this.repo.findOne({
      where: { idHuyet: id },
      relations: ['kinhMach'],
    });
    if (!item) throw new NotFoundException(`Huyệt vị #${id} không tồn tại`);
    return (await this.ganViThuoc([item]))[0];
  }

  async findByKinhMach(idKinhMach: number): Promise<HuyetVi[]> {
    return this.repo.find({
      where: { idKinhMach },
      relations: ['kinhMach'],
      order: { idHuyet: 'ASC' },
    });
  }

  create(dto: CreateHuyetViDto): Promise<HuyetVi> {
    const entity = this.repo.create({
      ten_huyet: dto.ten_huyet,
      idKinhMach: dto.id_kinh_mach || dto.idKinhMach,
      ma_huyet: dto.ma_huyet,
      vi_tri_giai_phau: dto.vi_tri_giai_phau,
      tac_dung: dto.tac_dung,
      loai_huyet: dto.loai_huyet,
      chong_chi_dinh: dto.chong_chi_dinh,
      id_vi_thuoc: dto.id_vi_thuoc ?? null,
      cong_nang_ghep: dto.cong_nang_ghep ?? null,
    });
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateHuyetViDto): Promise<HuyetVi> {
    const item = await this.findOne(id);
    
    if (dto.ten_huyet !== undefined) item.ten_huyet = dto.ten_huyet;
    
    // Check both potential field names
    const newKinhMachId = dto.id_kinh_mach ?? dto.idKinhMach;
    if (newKinhMachId !== undefined) {
      // Critical fix: Nullify the relation object so TypeORM doesn't return the cached one
      if (item.idKinhMach !== newKinhMachId) {
        (item as any).kinhMach = null;
        item.idKinhMach = newKinhMachId;
      }
    }
    
    if (dto.ma_huyet !== undefined) item.ma_huyet = dto.ma_huyet;
    if (dto.vi_tri_giai_phau !== undefined) item.vi_tri_giai_phau = dto.vi_tri_giai_phau;
    if (dto.tac_dung !== undefined) item.tac_dung = dto.tac_dung;
    if (dto.loai_huyet !== undefined) item.loai_huyet = dto.loai_huyet;
    if (dto.chong_chi_dinh !== undefined) item.chong_chi_dinh = dto.chong_chi_dinh;
    if (dto.id_vi_thuoc !== undefined) item.id_vi_thuoc = dto.id_vi_thuoc;
    if (dto.cong_nang_ghep !== undefined) item.cong_nang_ghep = dto.cong_nang_ghep;
    if (dto.id_tu_dien !== undefined) item.id_tu_dien = dto.id_tu_dien;
    
    await this.repo.save(item);
    
    // Final verification: Reload to ensure relations are fresh
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
