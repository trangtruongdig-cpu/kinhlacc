import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { NhomNhoDuocLy } from '../models/nhom-nho-duoc-ly.model';
import { NhomLonDuocLy } from '../models/nhom-lon-duoc-ly.model';
import { NhomNhoViThuoc } from '../models/nhom-nho-vi-thuoc.model';
import { NhomNhoChuTri } from '../models/nhom-nho-chu-tri.model';
import { ViThuoc } from '../models/vi-thuoc.model';
import { ChuTri } from '../models/chu-tri.model';
import {
  CreateNhomNhoDuocLyDto,
  UpdateNhomNhoDuocLyDto,
} from '../models/duoc-ly.dto';
import { formatCatalogLabel } from '../utils/catalog-label.util';

@Injectable()
export class NhomNhoDuocLyService {
  constructor(
    @InjectRepository(NhomNhoDuocLy)
    private readonly repo: Repository<NhomNhoDuocLy>,
    @InjectRepository(NhomLonDuocLy)
    private readonly nhomLonRepo: Repository<NhomLonDuocLy>,
    private readonly dataSource: DataSource,
  ) {}

  private static readonly RELATIONS = [
    'nhomLon',
    'viThuocLinks',
    'viThuocLinks.viThuoc',
    'chuTriLinks',
    'chuTriLinks.chuTri',
  ] as const;

  findAll(): Promise<NhomNhoDuocLy[]> {
    return this.repo.find({
      relations: [...NhomNhoDuocLyService.RELATIONS],
      order: { thu_tu: 'ASC', ten_nhom: 'ASC' },
    });
  }

  async findOne(id: number): Promise<NhomNhoDuocLy> {
    const item = await this.repo.findOne({
      where: { id },
      relations: [...NhomNhoDuocLyService.RELATIONS],
    });
    if (!item) throw new NotFoundException(`Nhóm nhỏ dược lý #${id} không tồn tại`);
    return item;
  }

  findByNhomLon(idNhomLon: number): Promise<NhomNhoDuocLy[]> {
    return this.repo.find({
      where: { idNhomLon },
      relations: [...NhomNhoDuocLyService.RELATIONS],
      order: { thu_tu: 'ASC', ten_nhom: 'ASC' },
    });
  }

  async create(dto: CreateNhomNhoDuocLyDto): Promise<NhomNhoDuocLy> {
    const label = formatCatalogLabel(dto.ten_nhom ?? '');
    if (!label) throw new BadRequestException('Tên nhóm nhỏ không được để trống');
    if (!dto.id_nhom_lon || !Number.isFinite(dto.id_nhom_lon)) {
      throw new BadRequestException('Thiếu id_nhom_lon');
    }
    const nhomLon = await this.nhomLonRepo.findOneBy({ id: dto.id_nhom_lon });
    if (!nhomLon) throw new BadRequestException(`Nhóm lớn #${dto.id_nhom_lon} không tồn tại`);

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const entity = this.repo.create({
        idNhomLon: dto.id_nhom_lon,
        ten_nhom: label,
        lieu_luong: dto.lieu_luong ?? null,
        mo_ta: dto.mo_ta ?? null,
        thu_tu: dto.thu_tu ?? 0,
      });
      const saved = await qr.manager.save(entity);
      await this.applyViThuocLinks(qr.manager, saved.id, dto.vi_thuoc_ids);
      await this.applyChuTriLinks(qr.manager, saved.id, dto.chu_tri_ids);
      await qr.commitTransaction();
      return this.findOne(saved.id);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async update(id: number, dto: UpdateNhomNhoDuocLyDto): Promise<NhomNhoDuocLy> {
    const existing = await this.findOne(id);
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      if (dto.id_nhom_lon != null) {
        const nhomLon = await qr.manager.findOneBy(NhomLonDuocLy, { id: dto.id_nhom_lon });
        if (!nhomLon) throw new BadRequestException(`Nhóm lớn #${dto.id_nhom_lon} không tồn tại`);
        existing.idNhomLon = dto.id_nhom_lon;
      }
      if (dto.ten_nhom != null) {
        const label = formatCatalogLabel(dto.ten_nhom);
        if (!label) throw new BadRequestException('Tên nhóm nhỏ không được để trống');
        existing.ten_nhom = label;
      }
      if (dto.lieu_luong !== undefined) existing.lieu_luong = dto.lieu_luong;
      if (dto.mo_ta !== undefined) existing.mo_ta = dto.mo_ta;
      if (dto.thu_tu !== undefined) existing.thu_tu = dto.thu_tu;
      await qr.manager.save(existing);

      if (dto.vi_thuoc_ids !== undefined) {
        await qr.manager.delete(NhomNhoViThuoc, { idNhomNho: id });
        await this.applyViThuocLinks(qr.manager, id, dto.vi_thuoc_ids);
      }
      if (dto.chu_tri_ids !== undefined) {
        await qr.manager.delete(NhomNhoChuTri, { idNhomNho: id });
        await this.applyChuTriLinks(qr.manager, id, dto.chu_tri_ids);
      }
      await qr.commitTransaction();
      return this.findOne(id);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }

  private async applyViThuocLinks(
    manager: EntityManager,
    idNhomNho: number,
    ids: number[] | undefined,
  ): Promise<void> {
    if (!ids?.length) return;
    const uniq = [...new Set(ids.filter((x) => Number.isFinite(x) && x > 0))];
    if (!uniq.length) return;
    const found = await manager.find(ViThuoc, { where: { id: In(uniq) }, select: ['id'] });
    const allowed = new Set(found.map((v) => v.id));
    const rows: NhomNhoViThuoc[] = [];
    let order = 0;
    for (const idViThuoc of uniq) {
      if (!allowed.has(idViThuoc)) continue;
      rows.push(
        manager.create(NhomNhoViThuoc, { idNhomNho, idViThuoc, thu_tu: order }),
      );
      order += 1;
    }
    if (!rows.length) return;
    // Bulk insert (1 round-trip) thay vì N save() — quan trọng với group lớn.
    await manager
      .createQueryBuilder()
      .insert()
      .into(NhomNhoViThuoc)
      .values(rows)
      .orIgnore()
      .execute();
  }

  private async applyChuTriLinks(
    manager: EntityManager,
    idNhomNho: number,
    ids: number[] | undefined,
  ): Promise<void> {
    if (!ids?.length) return;
    const uniq = [...new Set(ids.filter((x) => Number.isFinite(x) && x > 0))];
    if (!uniq.length) return;
    const found = await manager.find(ChuTri, { where: { id: In(uniq) }, select: ['id'] });
    const allowed = new Set(found.map((c) => c.id));
    const rows: NhomNhoChuTri[] = [];
    let order = 0;
    for (const idChuTri of uniq) {
      if (!allowed.has(idChuTri)) continue;
      rows.push(
        manager.create(NhomNhoChuTri, { idNhomNho, idChuTri, thu_tu: order }),
      );
      order += 1;
    }
    if (!rows.length) return;
    await manager
      .createQueryBuilder()
      .insert()
      .into(NhomNhoChuTri)
      .values(rows)
      .orIgnore()
      .execute();
  }
}
