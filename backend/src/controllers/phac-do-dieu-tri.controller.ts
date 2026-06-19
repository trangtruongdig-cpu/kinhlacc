import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhacDoDieuTri } from '../models/phac-do-dieu-tri.model';
import { MeridianSyndrome } from '../models/meridian-syndrome.model';
import { CreatePhacDoDieuTriDto, UpdatePhacDoDieuTriDto } from '../models/phac-do-dieu-tri.dto';

@Injectable()
export class PhacDoDieuTriService {
  constructor(
    @InjectRepository(PhacDoDieuTri)
    private readonly repo: Repository<PhacDoDieuTri>,
    @InjectRepository(MeridianSyndrome)
    private readonly synRepo: Repository<MeridianSyndrome>,
  ) {}

  findAll(): Promise<PhacDoDieuTri[]> {
    return this.repo.find({
      relations: ['benh', 'huyetVi', 'huyetVi.kinhMach'],
      order: { idPhacDo: 'ASC' },
    });
  }

  /**
   * Phương huyệt GOM THEO THỂ BỆNH cho màn Phương Huyệt: trả mọi thể bệnh (benh_dong_y)
   * có phương huyệt CẤU TRÚC (phac_do_dieu_tri) HOẶC phương huyệt NGUYÊN VĂN (phuyet_chamcuu
   * từ dữ liệu cũ). Mỗi thể kèm văn bản gốc + giải nghĩa + danh sách huyệt cấu trúc (nếu có).
   */
  async findPhuongHuyetTheBenh(): Promise<
    Array<{
      idBenh: number;
      benh: {
        id: number;
        tieuket: string | null;
        chung_trang: string | null;
        phuyet_chamcuu: string | null;
        giainghia_phuyet: string | null;
      };
      items: PhacDoDieuTri[];
    }>
  > {
    const phacDo = await this.repo.find({
      relations: ['huyetVi', 'huyetVi.kinhMach'],
      order: { idPhacDo: 'ASC' },
    });
    const byBenh = new Map<number, PhacDoDieuTri[]>();
    for (const p of phacDo) {
      const arr = byBenh.get(p.idBenh) ?? [];
      arr.push(p);
      byBenh.set(p.idBenh, arr);
    }
    const syns = await this.synRepo.find({ order: { id: 'ASC' } });
    const out: Array<{
      idBenh: number;
      benh: { id: number; tieuket: string | null; chung_trang: string | null; phuyet_chamcuu: string | null; giainghia_phuyet: string | null };
      items: PhacDoDieuTri[];
    }> = [];
    for (const s of syns) {
      const items = byBenh.get(s.id) ?? [];
      const hasText = !!(s.phuyet_chamcuu && String(s.phuyet_chamcuu).trim());
      if (!items.length && !hasText) continue;
      out.push({
        idBenh: s.id,
        benh: {
          id: s.id,
          tieuket: s.tieuket ?? null,
          chung_trang: s.chung_trang ?? null,
          phuyet_chamcuu: s.phuyet_chamcuu ?? null,
          giainghia_phuyet: s.giainghia_phuyet ?? null,
        },
        items,
      });
    }
    return out;
  }

  async findOne(id: number): Promise<PhacDoDieuTri> {
    const item = await this.repo.findOne({
      where: { idPhacDo: id },
      relations: ['benh', 'huyetVi', 'huyetVi.kinhMach'],
    });
    if (!item) throw new NotFoundException(`Phác đồ #${id} không tồn tại`);
    return item;
  }

  async findByBenh(idBenh: number): Promise<PhacDoDieuTri[]> {
    return this.repo.find({
      where: { idBenh },
      relations: ['benh', 'huyetVi', 'huyetVi.kinhMach'],
      order: { idPhacDo: 'ASC' },
    });
  }

  create(dto: CreatePhacDoDieuTriDto): Promise<PhacDoDieuTri> {
    const entity = this.repo.create({
      idBenh: dto.id_benh,
      idHuyet: dto.id_huyet,
      vai_tro_huyet: dto.vai_tro_huyet,
      phuong_phap_tac_dong: dto.phuong_phap_tac_dong,
      ghi_chu_ky_thuat: dto.ghi_chu_ky_thuat,
    });
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdatePhacDoDieuTriDto): Promise<PhacDoDieuTri> {
    const item = await this.findOne(id);
    if (dto.id_benh !== undefined) item.idBenh = dto.id_benh;
    if (dto.id_huyet !== undefined) item.idHuyet = dto.id_huyet;
    if (dto.vai_tro_huyet !== undefined) item.vai_tro_huyet = dto.vai_tro_huyet;
    if (dto.phuong_phap_tac_dong !== undefined) item.phuong_phap_tac_dong = dto.phuong_phap_tac_dong;
    if (dto.ghi_chu_ky_thuat !== undefined) item.ghi_chu_ky_thuat = dto.ghi_chu_ky_thuat;
    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
