import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { ViThuoc } from '../models/vi-thuoc.model';
import { ViThuocCongDung } from '../models/vi-thuoc-cong-dung.model';
import { ViThuocChuTri } from '../models/vi-thuoc-chu-tri.model';
import { ViThuocKiengKy } from '../models/vi-thuoc-kieng-ky.model';
import { ViThuocTenGoiKhac } from '../models/vi-thuoc-ten-goi-khac.model';
import { ViThuocKinhMach } from '../models/vi-thuoc-kinh-mach.model';
import { KinhMach } from '../models/kinh-mach.model';
import { NhomNhoViThuoc } from '../models/nhom-nho-vi-thuoc.model';
import { CreateViThuocDto, UpdateViThuocDto } from '../models/dongy-thuoc.dto';
import { catalogKey, formatCatalogLabel } from '../utils/catalog-label.util';

const VI_THUOC_RELATIONS = {
  congDungLinks: { congDung: true },
  chuTriLinks: { chuTri: true },
  kiengKyLinks: { kiengKy: true },
  tenGoiKhacList: true,
  kinhMachLinks: { kinhMach: true },
} as const;

@Injectable()
export class ViThuocService {
  constructor(
    @InjectRepository(ViThuoc)
    private repo: Repository<ViThuoc>,
  ) {}

  findAll(): Promise<ViThuoc[]> {
    return this.repo.find({
      relations: VI_THUOC_RELATIONS,
      order: { ten_vi_thuoc: 'ASC' },
    });
  }

  /**
   * Lightweight, paginated list cho tab Vị thuốc.
   * - Bỏ congDungLinks/chuTriLinks/kiengKyLinks/tenGoiKhacList để query nhanh.
   * - Giữ kinhMachLinks vì UI cần để render quy kinh & mở modal sửa.
   * - Hỗ trợ filter theo nhóm nhỏ dược lý (idNhomNho) hoặc nhóm lớn (idNhomLon) qua bảng nối.
   */
  async findLite(opts: {
    page?: number;
    limit?: number;
    q?: string;
    idNhomNho?: number | null;
    idNhomLon?: number | null;
  }): Promise<{ data: ViThuoc[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Math.floor(opts.page ?? 1));
    const limit = Math.max(1, Math.min(200, Math.floor(opts.limit ?? 12)));
    const q = (opts.q ?? '').trim();
    const idNhomNho = Number.isFinite(opts.idNhomNho as number) ? Number(opts.idNhomNho) : null;
    const idNhomLon = Number.isFinite(opts.idNhomLon as number) ? Number(opts.idNhomLon) : null;

    const qb = this.repo.createQueryBuilder('vt');
    if (q) {
      const term = `%${q}%`;
      qb.andWhere(
        '(vt.ten_vi_thuoc ILIKE :term OR vt.tinh ILIKE :term OR vt.vi ILIKE :term OR vt.quy_kinh ILIKE :term OR vt.lieu_dung ILIKE :term OR vt.ten_khoa_hoc ILIKE :term OR vt.ten_han ILIKE :term OR vt.ten_pinyin ILIKE :term OR vt.bo_phan_dung ILIKE :term)',
        { term },
      );
    }
    if (idNhomNho != null) {
      qb.andWhere(
        '(EXISTS (SELECT 1 FROM nhom_nho_vi_thuoc nnvt WHERE nnvt.id_vi_thuoc = vt.id AND nnvt.id_nhom_nho = :nnId))',
        { nnId: idNhomNho },
      );
    } else if (idNhomLon != null) {
      qb.andWhere(
        '(EXISTS (SELECT 1 FROM nhom_nho_vi_thuoc nnvt JOIN nhom_nho_duoc_ly nnd ON nnd.id = nnvt.id_nhom_nho WHERE nnvt.id_vi_thuoc = vt.id AND nnd.id_nhom_lon = :nlId))',
        { nlId: idNhomLon },
      );
    }

    const [items, total] = await qb
      .orderBy('vt.ten_vi_thuoc', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    let data: ViThuoc[] = [];
    if (items.length) {
      const ids = items.map((x) => x.id);
      data = await this.repo.find({
        where: { id: In(ids) },
        relations: { kinhMachLinks: { kinhMach: true } },
        order: { ten_vi_thuoc: 'ASC' },
      });
    }

    return { data, total, page, limit };
  }

  findOne(id: number): Promise<ViThuoc | null> {
    return this.repo.findOne({
      where: { id },
      relations: VI_THUOC_RELATIONS,
    });
  }

  private pickScalar(dto: Partial<CreateViThuocDto>): Partial<ViThuoc> {
    const o: Partial<ViThuoc> = {};
    if (dto.ten_vi_thuoc !== undefined) o.ten_vi_thuoc = dto.ten_vi_thuoc;
    if (dto.tinh !== undefined) o.tinh = dto.tinh;
    if (dto.vi !== undefined) o.vi = dto.vi;
    if (dto.quy_kinh !== undefined) o.quy_kinh = dto.quy_kinh;
    if (dto.lieu_dung !== undefined) o.lieu_dung = dto.lieu_dung;
    if (dto.ten_khoa_hoc !== undefined) o.ten_khoa_hoc = dto.ten_khoa_hoc;
    if (dto.ten_han !== undefined) o.ten_han = dto.ten_han;
    if (dto.ten_pinyin !== undefined) o.ten_pinyin = dto.ten_pinyin;
    if (dto.bo_phan_dung !== undefined) o.bo_phan_dung = dto.bo_phan_dung;
    return o;
  }

  private async syncLinkedRows(
    mgr: EntityManager,
    viId: number,
    dto: Partial<CreateViThuocDto>,
    isCreate: boolean,
  ): Promise<void> {
    const patchCd = dto.cong_dung_links;
    if (patchCd !== undefined || isCreate) {
      await mgr.delete(ViThuocCongDung, { id_vi_thuoc: viId });
      const byCd = new Map<number, { ghi_chu?: string }>();
      for (const row of patchCd ?? []) {
        const idCd = Number(row.id_cong_dung);
        if (!Number.isFinite(idCd)) continue;
        byCd.set(idCd, { ghi_chu: row.ghi_chu });
      }
      for (const [idCd, row] of byCd) {
        const note = row.ghi_chu?.trim() ? formatCatalogLabel(row.ghi_chu) : null;
        await mgr.insert(ViThuocCongDung, {
          id_vi_thuoc: viId,
          id_cong_dung: idCd,
          ghi_chu: note || null,
        });
      }
    }

    const patchCt = dto.chu_tri_links;
    if (patchCt !== undefined || isCreate) {
      await mgr.delete(ViThuocChuTri, { id_vi_thuoc: viId });
      const byCt = new Map<number, { ghi_chu?: string }>();
      for (const row of patchCt ?? []) {
        const idCt = Number(row.id_chu_tri);
        if (!Number.isFinite(idCt)) continue;
        byCt.set(idCt, { ghi_chu: row.ghi_chu });
      }
      for (const [idCt, row] of byCt) {
        const note = row.ghi_chu?.trim() ? formatCatalogLabel(row.ghi_chu) : null;
        await mgr.insert(ViThuocChuTri, {
          id_vi_thuoc: viId,
          id_chu_tri: idCt,
          ghi_chu: note || null,
        });
      }
    }

    const patchKk = dto.kieng_ky_links;
    if (patchKk !== undefined || isCreate) {
      await mgr.delete(ViThuocKiengKy, { id_vi_thuoc: viId });
      const byKk = new Map<number, { ghi_chu?: string }>();
      for (const row of patchKk ?? []) {
        const idKk = Number(row.id_kieng_ky);
        if (!Number.isFinite(idKk)) continue;
        byKk.set(idKk, { ghi_chu: row.ghi_chu });
      }
      for (const [idKk, row] of byKk) {
        const note = row.ghi_chu?.trim() ? formatCatalogLabel(row.ghi_chu) : null;
        await mgr.insert(ViThuocKiengKy, {
          id_vi_thuoc: viId,
          id_kieng_ky: idKk,
          ghi_chu: note || null,
        });
      }
    }

    const patchAliases = dto.ten_goi_khac_list;
    if (patchAliases !== undefined || isCreate) {
      await mgr.delete(ViThuocTenGoiKhac, { id_vi_thuoc: viId });
      const seenAlias = new Set<string>();
      for (const raw of patchAliases ?? []) {
        const t = formatCatalogLabel(String(raw ?? ''));
        if (!t) continue;
        const k = catalogKey(t);
        if (seenAlias.has(k)) continue;
        seenAlias.add(k);
        await mgr.insert(ViThuocTenGoiKhac, {
          id_vi_thuoc: viId,
          ten_goi_khac: t,
        });
      }
    }

    const patchKm = dto.kinh_mach_ids;
    if (patchKm !== undefined || isCreate) {
      await mgr.delete(ViThuocKinhMach, { id_vi_thuoc: viId });
      const seenKm = new Set<number>();
      const orderedIds: number[] = [];
      for (const raw of patchKm ?? []) {
        const idKm = Number(raw);
        if (!Number.isFinite(idKm) || seenKm.has(idKm)) continue;
        seenKm.add(idKm);
        orderedIds.push(idKm);
        await mgr.insert(ViThuocKinhMach, {
          id_vi_thuoc: viId,
          id_kinh_mach: idKm,
        });
      }
      // Sync denormalized text column `quy_kinh` so existing analytics keep working.
      if (patchKm !== undefined) {
        const rows = orderedIds.length
          ? await mgr.find(KinhMach, {
              where: orderedIds.map((id) => ({ idKinhMach: id })),
            })
          : [];
        const byId = new Map(rows.map((r) => [r.idKinhMach, r]));
        const text = orderedIds
          .map((id) => byId.get(id)?.ten_kinh_mach?.trim())
          .filter((s): s is string => !!s)
          .join(', ');
        await mgr.update(ViThuoc, viId, { quy_kinh: text || null } as any);
      }
    }

    const patchNn = dto.nhom_nho_ids;
    if (patchNn !== undefined || isCreate) {
      await mgr.delete(NhomNhoViThuoc, { idViThuoc: viId });
      const seenNn = new Set<number>();
      for (const raw of patchNn ?? []) {
        const idNn = Number(raw);
        if (Number.isFinite(idNn) && idNn > 0) seenNn.add(idNn);
      }
      if (seenNn.size) {
        const rows = Array.from(seenNn).map((idNhomNho) => ({
          idNhomNho,
          idViThuoc: viId,
          thu_tu: 0,
        }));
        await mgr
          .createQueryBuilder()
          .insert()
          .into(NhomNhoViThuoc)
          .values(rows)
          .orIgnore()
          .execute();
      }
    }
  }

  async create(dto: CreateViThuocDto): Promise<ViThuoc> {
    return this.repo.manager.transaction(async (mgr) => {
      const item = mgr.create(ViThuoc, this.pickScalar(dto) as ViThuoc);
      const saved = await mgr.save(item);
      await this.syncLinkedRows(mgr, saved.id, dto, true);
      return (await mgr.findOne(ViThuoc, {
        where: { id: saved.id },
        relations: VI_THUOC_RELATIONS,
      })) as ViThuoc;
    });
  }

  async update(id: number, dto: UpdateViThuocDto): Promise<ViThuoc | null> {
    const patch = this.pickScalar(dto);
    if (Object.keys(patch).length > 0) {
      await this.repo.update(id, patch);
    }
    await this.repo.manager.transaction(async (mgr) => {
      await this.syncLinkedRows(mgr, id, dto, false);
    });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
