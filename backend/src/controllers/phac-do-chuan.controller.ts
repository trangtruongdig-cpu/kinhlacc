import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhacDoChuan, PhacDoChuanHuyet } from '../models/phac-do-chuan.model';
import {
  CreatePhacDoChuanDto,
  UpdatePhacDoChuanDto,
} from '../models/phac-do-chuan.dto';

export type HuyetHieuLucRow = {
  id_huyet: number;
  thu_tu: number;
  vai_tro_huyet: string | null;
  phuong_phap_tac_dong: string | null;
  ghi_chu_ky_thuat: string | null;
  tu_ke_thua: boolean;
  huyetVi?: unknown;
};

@Injectable()
export class PhacDoChuanService {
  constructor(
    @InjectRepository(PhacDoChuan)
    private readonly chuanRepo: Repository<PhacDoChuan>,
    @InjectRepository(PhacDoChuanHuyet)
    private readonly lineRepo: Repository<PhacDoChuanHuyet>,
  ) {}

  private async assertNoCycle(
    ownId: number | null,
    idKeThua: number | null,
  ): Promise<void> {
    if (idKeThua == null) return;
    if (ownId != null && idKeThua === ownId) {
      throw new BadRequestException('Phác đồ không được kế thừa chính nó');
    }
    const visited = new Set<number>();
    let cur: number | null = idKeThua;
    const max = 48;
    for (let steps = 0; cur != null && steps < max; steps++) {
      if (ownId != null && cur === ownId) {
        throw new BadRequestException('Vòng kế thừa phác đồ');
      }
      if (visited.has(cur)) {
        throw new BadRequestException('Chu trình trong chuỗi phác đồ cha');
      }
      visited.add(cur);
      const parent = await this.chuanRepo.findOne({
        where: { id: cur },
        select: ['id', 'idKeThua'],
      });
      if (!parent) break;
      cur = parent.idKeThua;
    }
  }

  /** Từ gốc → lá (bản ghi id), không quan hệ đầy đủ */
  private async chainRootToLeaf(id: number): Promise<PhacDoChuan[]> {
    const up: PhacDoChuan[] = [];
    const seen = new Set<number>();
    let cur: PhacDoChuan | null = await this.chuanRepo.findOne({
      where: { id },
    });
    if (!cur) throw new NotFoundException(`Phác đồ #${id} không tồn tại`);
    let guard = 0;
    while (cur && guard++ < 48) {
      if (seen.has(cur.id)) {
        throw new BadRequestException('Chu trình kế thừa trong CSDL');
      }
      seen.add(cur.id);
      up.push(cur);
      if (cur.idKeThua == null) break;
      cur = await this.chuanRepo.findOne({ where: { id: cur.idKeThua } });
    }
    return up.reverse();
  }

  async computeHuyetHieuLuc(id: number): Promise<HuyetHieuLucRow[]> {
    const chain = await this.chainRootToLeaf(id);
    const leafId = chain[chain.length - 1].id;
    const orderedIds: number[] = [];
    const map = new Map<number, HuyetHieuLucRow>();

    for (const node of chain) {
      const tuKeThua = node.id !== leafId;
      const lines = await this.lineRepo.find({
        where: { idPhacDoChuan: node.id },
        relations: ['huyetVi', 'huyetVi.kinhMach'],
        order: { thuTu: 'ASC', id: 'ASC' },
      });
      for (const ln of lines) {
        const hid = ln.idHuyet;
        if (map.has(hid)) {
          const idx = orderedIds.indexOf(hid);
          if (idx >= 0) orderedIds.splice(idx, 1);
        }
        orderedIds.push(hid);
        map.set(hid, {
          id_huyet: hid,
          thu_tu: ln.thuTu,
          vai_tro_huyet: ln.vai_tro_huyet,
          phuong_phap_tac_dong: ln.phuong_phap_tac_dong,
          ghi_chu_ky_thuat: ln.ghi_chu_ky_thuat,
          tu_ke_thua: tuKeThua,
          huyetVi: ln.huyetVi,
        });
      }
    }

    return orderedIds.map((hid) => map.get(hid)!).filter(Boolean);
  }

  findAll(): Promise<PhacDoChuan[]> {
    return this.chuanRepo.find({
      relations: [
        'keThua',
        'benhDongY',
        'huyetDong',
        'huyetDong.huyetVi',
        'huyetDong.huyetVi.kinhMach',
      ],
      order: { thuTuHienThi: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number, withHieuLuc: boolean) {
    const item = await this.chuanRepo.findOne({
      where: { id },
      relations: ['keThua', 'benhDongY', 'huyetDong', 'huyetDong.huyetVi'],
    });
    if (!item) throw new NotFoundException(`Phác đồ #${id} không tồn tại`);
    if (!withHieuLuc) return item;
    const huyet_hieu_luc = await this.computeHuyetHieuLuc(id);
    return { ...item, huyet_hieu_luc };
  }

  private normalizeHuyetLines(
    lines: CreatePhacDoChuanDto['huyet'],
  ): { id_huyet: number; thu_tu: number; vai_tro_huyet: string | null; phuong_phap_tac_dong: string | null; ghi_chu_ky_thuat: string | null }[] {
    if (!lines?.length) return [];
    const byHuyet = new Map<
      number,
      {
        id_huyet: number;
        thu_tu: number;
        vai_tro_huyet: string | null;
        phuong_phap_tac_dong: string | null;
        ghi_chu_ky_thuat: string | null;
      }
    >();
    let i = 0;
    for (const row of lines) {
      const idHuyet = row.id_huyet;
      if (typeof idHuyet !== 'number' || !Number.isFinite(idHuyet)) continue;
      byHuyet.set(idHuyet, {
        id_huyet: idHuyet,
        thu_tu: row.thu_tu ?? i,
        vai_tro_huyet: row.vai_tro_huyet ?? null,
        phuong_phap_tac_dong: row.phuong_phap_tac_dong ?? null,
        ghi_chu_ky_thuat: row.ghi_chu_ky_thuat ?? null,
      });
      i += 1;
    }
    return Array.from(byHuyet.values());
  }

  private async replaceLines(
    idPhacDo: number,
    lines: CreatePhacDoChuanDto['huyet'],
  ): Promise<void> {
    await this.lineRepo.delete({ idPhacDoChuan: idPhacDo });
    const norm = this.normalizeHuyetLines(lines);
    for (const row of norm) {
      const ln = this.lineRepo.create({
        idPhacDoChuan: idPhacDo,
        idHuyet: row.id_huyet,
        thuTu: row.thu_tu,
        vai_tro_huyet: row.vai_tro_huyet,
        phuong_phap_tac_dong: row.phuong_phap_tac_dong,
        ghi_chu_ky_thuat: row.ghi_chu_ky_thuat,
      });
      await this.lineRepo.save(ln);
    }
  }

  async create(dto: CreatePhacDoChuanDto): Promise<PhacDoChuan> {
    const ten = (dto.ten || '').trim();
    if (!ten) throw new BadRequestException('Thiếu tên phác đồ');
    await this.assertNoCycle(null, dto.id_ke_thua ?? null);

    const entity = this.chuanRepo.create({
      ten,
      idKeThua: dto.id_ke_thua ?? null,
      idBenhDongY: dto.id_benh_dong_y ?? null,
      ghi_chu: dto.ghi_chu ?? null,
      thuTuHienThi: dto.thu_tu_hien_thi ?? 0,
    });
    const saved = await this.chuanRepo.save(entity);
    await this.replaceLines(saved.id, dto.huyet);
    const out = await this.chuanRepo.findOne({
      where: { id: saved.id },
      relations: ['keThua', 'benhDongY', 'huyetDong', 'huyetDong.huyetVi'],
    });
    if (!out) throw new NotFoundException(`Phác đồ #${saved.id} không tồn tại sau khi tạo`);
    return out;
  }

  async update(id: number, dto: UpdatePhacDoChuanDto): Promise<PhacDoChuan> {
    const item = await this.chuanRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Phác đồ #${id} không tồn tại`);

    const nextKeThua =
      dto.id_ke_thua !== undefined ? dto.id_ke_thua : item.idKeThua;
    await this.assertNoCycle(id, nextKeThua);

    if (dto.ten !== undefined) {
      const t = (dto.ten || '').trim();
      if (!t) throw new BadRequestException('Tên phác đồ không được rỗng');
      item.ten = t;
    }
    if (dto.id_ke_thua !== undefined) item.idKeThua = dto.id_ke_thua;
    if (dto.id_benh_dong_y !== undefined) item.idBenhDongY = dto.id_benh_dong_y;
    if (dto.ghi_chu !== undefined) item.ghi_chu = dto.ghi_chu;
    if (dto.thu_tu_hien_thi !== undefined) item.thuTuHienThi = dto.thu_tu_hien_thi;

    await this.chuanRepo.save(item);
    if (dto.huyet !== undefined) await this.replaceLines(id, dto.huyet);

    const out = await this.chuanRepo.findOne({
      where: { id },
      relations: ['keThua', 'benhDongY', 'huyetDong', 'huyetDong.huyetVi'],
    });
    if (!out) throw new NotFoundException(`Phác đồ #${id} không tồn tại`);
    return out;
  }

  async remove(id: number): Promise<void> {
    const item = await this.chuanRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Phác đồ #${id} không tồn tại`);
    await this.chuanRepo.remove(item);
  }
}
