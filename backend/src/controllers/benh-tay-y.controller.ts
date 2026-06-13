import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BenhTayY } from '../models/benh-tay-y.model';
import { BaiThuoc } from '../models/bai-thuoc.model';
import { TrieuChung } from '../models/trieu-chung.model';
import { ThietChan } from '../models/thiet-chan.model';
import { MachChan } from '../models/mach-chan.model';
import { PhapTri } from '../models/phap-tri.model';
import { CreateBenhTayYDto, UpdateBenhTayYDto } from '../models/benh-tay-y.dto';

@Injectable()
export class BenhTayYService {
  constructor(
    @InjectRepository(BenhTayY)
    private readonly repo: Repository<BenhTayY>,
    @InjectRepository(BaiThuoc)
    private readonly baiThuocRepo: Repository<BaiThuoc>,
    @InjectRepository(TrieuChung)
    private readonly trieuChungRepo: Repository<TrieuChung>,
    @InjectRepository(ThietChan)
    private readonly thietChanRepo: Repository<ThietChan>,
    @InjectRepository(MachChan)
    private readonly machChanRepo: Repository<MachChan>,
    @InjectRepository(PhapTri)
    private readonly phapTriRepo: Repository<PhapTri>,
  ) {}

  findAll(): Promise<BenhTayY[]> {
    return this.repo.find({
      relations: [
        'chungBenh',
        'baiThuocList',
        'baiThuocList.phapTriLinks',
        'baiThuocList.phapTriLinks.phapTri',
        'baiThuocList.phapTriLinks.phapTri.trieu_chung_list',
        'trieuChungList',
        'thietChanList',
        'machChanList',
        'phapTriList',
        'phapTriList.trieu_chung_list',
      ],
      order: { id: 'ASC' },
    });
  }

  /**
   * Lightweight, paginated list cho tab Bệnh Tây Y.
   * - Bỏ thietChanList, machChanList — chỉ load khi xem chi tiết.
   * - Vẫn load chuỗi baiThuocList.phapTriLinks.phapTri.trieu_chung_list + phapTriList.trieu_chung_list
   *   vì card cần hiển thị Pháp trị (gộp trực tiếp + qua bài thuốc) kèm triệu chứng của từng pháp trị.
   * - Search server-side trên ten_benh (text column).
   * - Filter idChungBenh để hỗ trợ sub-tab "Chủng bệnh".
   */
  async findLite(opts: {
    page?: number;
    limit?: number;
    q?: string;
    idChungBenh?: number | null;
    focusId?: number | null;
  }): Promise<{
    data: BenhTayY[];
    total: number;
    page: number;
    limit: number;
    countsByChungBenh: Record<number, number>;
  }> {
    let page = Math.max(1, Math.floor(opts.page ?? 1));
    const limit = Math.max(1, Math.min(200, Math.floor(opts.limit ?? 12)));
    const q = (opts.q ?? '').trim();
    const idChungBenh = Number.isFinite(opts.idChungBenh as number) ? Number(opts.idChungBenh) : null;
    const focusId = Number.isFinite(opts.focusId as number) ? Number(opts.focusId) : null;

    const applyFilters = (qb: ReturnType<Repository<BenhTayY>['createQueryBuilder']>) => {
      if (q) qb.andWhere('bty.ten_benh ILIKE :term', { term: `%${q}%` });
      if (idChungBenh != null) qb.andWhere('bty.id_chung_benh = :cbId', { cbId: idChungBenh });
      return qb;
    };

    // Nếu có focusId, tính trang chứa bản ghi đó (thứ hạng theo id ASC dưới cùng bộ lọc)
    // để client có thể nhảy thẳng tới đúng trang và focus.
    if (focusId != null) {
      const rank = await applyFilters(this.repo.createQueryBuilder('bty'))
        .andWhere('bty.id <= :focusId', { focusId })
        .getCount();
      if (rank > 0) page = Math.ceil(rank / limit);
    }

    const qb = applyFilters(this.repo.createQueryBuilder('bty'));
    const [items, total] = await qb
      .orderBy('bty.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    let data: BenhTayY[] = [];
    if (items.length) {
      const ids = items.map((x) => x.id);
      data = await this.repo.find({
        where: { id: In(ids) },
        relations: [
          'chungBenh',
          'baiThuocList',
          'baiThuocList.phapTriLinks',
          'baiThuocList.phapTriLinks.phapTri',
          'baiThuocList.phapTriLinks.phapTri.trieu_chung_list',
          'trieuChungList',
          'phapTriList',
          'phapTriList.trieu_chung_list',
        ],
        order: { id: 'ASC' },
      });
    }

    // Count theo chủng bệnh (toàn DB) cho sub-tab filter.
    const countRows: Array<{ id_chung_benh: number; cnt: string }> = await this.repo.query(
      'SELECT id_chung_benh, COUNT(*)::text AS cnt FROM benh_tay_y GROUP BY id_chung_benh',
    );
    const countsByChungBenh: Record<number, number> = {};
    for (const r of countRows) countsByChungBenh[Number(r.id_chung_benh)] = Number(r.cnt);

    return { data, total, page, limit, countsByChungBenh };
  }

  async findOne(id: number): Promise<BenhTayY> {
    const item = await this.repo.findOne({
      where: { id },
      relations: [
        'chungBenh',
        'baiThuocList',
        'baiThuocList.phapTriLinks',
        'baiThuocList.phapTriLinks.phapTri',
        'baiThuocList.phapTriLinks.phapTri.trieu_chung_list',
        'trieuChungList',
        'thietChanList',
        'machChanList',
        'phapTriList',
        'phapTriList.trieu_chung_list',
      ],
    });
    if (!item) {
      throw new NotFoundException(`Bệnh Tây Y #${id} không tồn tại`);
    }
    return item;
  }

  async create(dto: CreateBenhTayYDto): Promise<BenhTayY> {
    const entity = this.repo.create({
      ten_benh: dto.ten_benh,
      idChungBenh: dto.id_chung_benh,
    });

    if (dto.bai_thuoc_ids && dto.bai_thuoc_ids.length > 0) {
      entity.baiThuocList = await this.baiThuocRepo.findBy({
        id: In(dto.bai_thuoc_ids),
      });
    }

    if (dto.trieu_chung_ids && dto.trieu_chung_ids.length > 0) {
      entity.trieuChungList = await this.trieuChungRepo.findBy({
        id: In(dto.trieu_chung_ids),
      });
    }

    if (dto.thiet_chan_ids && dto.thiet_chan_ids.length > 0) {
      entity.thietChanList = await this.thietChanRepo.findBy({
        id: In(dto.thiet_chan_ids),
      });
    }

    if (dto.mach_chan_ids && dto.mach_chan_ids.length > 0) {
      entity.machChanList = await this.machChanRepo.findBy({
        id: In(dto.mach_chan_ids),
      });
    }

    if (dto.phap_tri_ids && dto.phap_tri_ids.length > 0) {
      entity.phapTriList = await this.phapTriRepo.findBy({
        id: In(dto.phap_tri_ids),
      });
    }

    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateBenhTayYDto): Promise<BenhTayY> {
    const item = await this.findOne(id);

    if (dto.ten_benh !== undefined) item.ten_benh = dto.ten_benh;
    if (dto.id_chung_benh !== undefined) {
      item.idChungBenh = dto.id_chung_benh;
      // Trích xuất entity liên quan để TypeORM cập nhật đúng quan hệ bằng ID mới
      (item as any).chungBenh = undefined;
    }

    if (dto.bai_thuoc_ids !== undefined) {
      item.baiThuocList = dto.bai_thuoc_ids.length > 0
        ? await this.baiThuocRepo.findBy({ id: In(dto.bai_thuoc_ids) })
        : [];
    }

    if (dto.trieu_chung_ids !== undefined) {
      item.trieuChungList = dto.trieu_chung_ids.length > 0
        ? await this.trieuChungRepo.findBy({ id: In(dto.trieu_chung_ids) })
        : [];
    }

    if (dto.thiet_chan_ids !== undefined) {
      item.thietChanList = dto.thiet_chan_ids.length > 0
        ? await this.thietChanRepo.findBy({ id: In(dto.thiet_chan_ids) })
        : [];
    }

    if (dto.mach_chan_ids !== undefined) {
      item.machChanList = dto.mach_chan_ids.length > 0
        ? await this.machChanRepo.findBy({ id: In(dto.mach_chan_ids) })
        : [];
    }

    if (dto.phap_tri_ids !== undefined) {
      item.phapTriList =
        dto.phap_tri_ids.length > 0 ? await this.phapTriRepo.findBy({ id: In(dto.phap_tri_ids) }) : [];
    }

    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
