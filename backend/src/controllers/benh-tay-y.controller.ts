import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BenhTayY } from '../models/benh-tay-y.model';
import { BaiThuoc } from '../models/bai-thuoc.model';
import { TrieuChung } from '../models/trieu-chung.model';
import { ThietChan } from '../models/thiet-chan.model';
import { MachChan } from '../models/mach-chan.model';
import { PhapTri } from '../models/phap-tri.model';
import type { BaiThuocPhapTri } from '../models/bai-thuoc-phap-tri.model';
import { CreateBenhTayYDto, UpdateBenhTayYDto } from '../models/benh-tay-y.dto';

interface PhapTriBaiThuocRow {
  id_phap_tri: number;
  id_bai_thuoc: number;
  thu_tu: number;
  ten_bai_thuoc: string;
}

interface ThietChanRow {
  id_benh_tay_y: number;
  id: number;
  ten_thiet_chan: string;
}

interface MachChanRow {
  id_benh_tay_y: number;
  id: number;
  ten_mach_chan: string;
}

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

  /**
   * Gắn ĐẦY ĐỦ bài thuốc của mỗi pháp trị (bảng bai_thuoc_phap_tri) vào phapTri.bai_thuoc_links —
   * KHÔNG chỉ những bài đã gắn riêng vào benh_tay_y (bảng benh_tay_y_bai_thuoc, độc lập với pháp trị).
   * Một pháp trị có thể có nhiều bài thuốc; nếu chỉ 1 trong số đó được gắn trực tiếp vào bệnh Tây Y,
   * FE sẽ hiểu lầm là "thiếu bài thuốc" dù pháp trị thực có đủ. Chạy 1 query riêng (không JOIN thêm
   * vào chuỗi relations sẵn có) để tránh nhân bản dòng khi 1 pháp trị vừa có nhiều triệu chứng vừa có
   * nhiều bài thuốc (bài học từ vụ findWithRelationsFast ở benh-dong-y-excel.controller.ts).
   */
  private async attachPhapTriBaiThuoc(items: BenhTayY[]): Promise<void> {
    const ptIds = new Set<number>();
    for (const item of items) {
      for (const p of item.phapTriList ?? []) ptIds.add(p.id);
      for (const b of item.baiThuocList ?? []) {
        for (const link of b.phapTriLinks ?? [])
          if (link.phapTri) ptIds.add(link.phapTri.id);
      }
    }
    if (!ptIds.size) return;

    const rows: PhapTriBaiThuocRow[] = await this.phapTriRepo.query(
      `SELECT bpt.id_phap_tri, bpt.id_bai_thuoc, bpt.thu_tu, bt.ten_bai_thuoc
       FROM bai_thuoc_phap_tri bpt
       JOIN bai_thuoc bt ON bt.id = bpt.id_bai_thuoc
       WHERE bpt.id_phap_tri = ANY($1)
       ORDER BY bpt.id_phap_tri, bpt.thu_tu`,
      [[...ptIds]],
    );

    const byPhapTri = new Map<number, BaiThuocPhapTri[]>();
    for (const r of rows) {
      const arr = byPhapTri.get(r.id_phap_tri) ?? [];
      arr.push({
        idBaiThuoc: r.id_bai_thuoc,
        idPhapTri: r.id_phap_tri,
        doanChungTrang: null,
        thuTu: r.thu_tu,
        baiThuoc: {
          id: r.id_bai_thuoc,
          ten_bai_thuoc: r.ten_bai_thuoc,
        } as BaiThuoc,
      } as BaiThuocPhapTri);
      byPhapTri.set(r.id_phap_tri, arr);
    }

    const apply = (p: PhapTri) => {
      p.bai_thuoc_links = byPhapTri.get(p.id) ?? [];
    };
    for (const item of items) {
      for (const p of item.phapTriList ?? []) apply(p);
      for (const b of item.baiThuocList ?? []) {
        for (const link of b.phapTriLinks ?? [])
          if (link.phapTri) apply(link.phapTri);
      }
    }
  }

  /**
   * Gắn thietChanList + machChanList qua 2 query riêng (không thêm vào chuỗi relations) —
   * findLite() đã có sẵn baiThuocList × phapTriLinks × phapTri.trieu_chung_list (nhiều tầng
   * one-to-many lồng nhau); thêm thẳng 2 quan hệ many-to-many nữa vào cùng 1 querybuilder sẽ
   * nhân bản dòng theo tích số lượng của TẤT CẢ quan hệ cùng lúc. Tách riêng để chắc chắn an toàn,
   * không cần đo mới biết (cùng bài học với attachPhapTriBaiThuoc ở trên).
   */
  private async attachThietChanMachChan(items: BenhTayY[]): Promise<void> {
    const ids = items.map((x) => x.id);
    if (!ids.length) return;

    const [thietRows, machRows] = await Promise.all([
      this.repo.query(
        `SELECT j.id_benh_tay_y, tc.id, tc.ten_thiet_chan
         FROM benh_tay_y_thiet_chan j
         JOIN thiet_chan tc ON tc.id = j.id_thiet_chan
         WHERE j.id_benh_tay_y = ANY($1)`,
        [ids],
      ) as Promise<ThietChanRow[]>,
      this.repo.query(
        `SELECT j.id_benh_tay_y, mc.id, mc.ten_mach_chan
         FROM benh_tay_y_mach_chan j
         JOIN mach_chan mc ON mc.id = j.id_mach_chan
         WHERE j.id_benh_tay_y = ANY($1)`,
        [ids],
      ) as Promise<MachChanRow[]>,
    ]);

    const thietByBty = new Map<number, ThietChan[]>();
    for (const r of thietRows) {
      const arr = thietByBty.get(r.id_benh_tay_y) ?? [];
      arr.push({ id: r.id, ten_thiet_chan: r.ten_thiet_chan } as ThietChan);
      thietByBty.set(r.id_benh_tay_y, arr);
    }
    const machByBty = new Map<number, MachChan[]>();
    for (const r of machRows) {
      const arr = machByBty.get(r.id_benh_tay_y) ?? [];
      arr.push({ id: r.id, ten_mach_chan: r.ten_mach_chan } as MachChan);
      machByBty.set(r.id_benh_tay_y, arr);
    }

    for (const item of items) {
      item.thietChanList = thietByBty.get(item.id) ?? [];
      item.machChanList = machByBty.get(item.id) ?? [];
    }
  }

  async findAll(): Promise<BenhTayY[]> {
    const data = await this.repo.find({
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
    await this.attachPhapTriBaiThuoc(data);
    return data;
  }

  /**
   * Lightweight, paginated list cho tab Bệnh Tây Y.
   * - thietChanList, machChanList nạp qua query riêng (attachThietChanMachChan), không thêm vào
   *   chuỗi relations, để không cộng dồn vào tích số dòng đã có từ baiThuocList/phapTriList.
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
    const idChungBenh = Number.isFinite(opts.idChungBenh as number)
      ? Number(opts.idChungBenh)
      : null;
    const focusId = Number.isFinite(opts.focusId as number)
      ? Number(opts.focusId)
      : null;

    const applyFilters = (
      qb: ReturnType<Repository<BenhTayY>['createQueryBuilder']>,
    ) => {
      if (q) qb.andWhere('bty.ten_benh ILIKE :term', { term: `%${q}%` });
      if (idChungBenh != null)
        qb.andWhere('bty.id_chung_benh = :cbId', { cbId: idChungBenh });
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
      await Promise.all([this.attachPhapTriBaiThuoc(data), this.attachThietChanMachChan(data)]);
    }

    // Count theo chủng bệnh (toàn DB) cho sub-tab filter.
    const countRows: Array<{ id_chung_benh: number; cnt: string }> =
      await this.repo.query(
        'SELECT id_chung_benh, COUNT(*)::text AS cnt FROM benh_tay_y GROUP BY id_chung_benh',
      );
    const countsByChungBenh: Record<number, number> = {};
    for (const r of countRows)
      countsByChungBenh[Number(r.id_chung_benh)] = Number(r.cnt);

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
    await this.attachPhapTriBaiThuoc([item]);
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
      item.baiThuocList =
        dto.bai_thuoc_ids.length > 0
          ? await this.baiThuocRepo.findBy({ id: In(dto.bai_thuoc_ids) })
          : [];
    }

    if (dto.trieu_chung_ids !== undefined) {
      item.trieuChungList =
        dto.trieu_chung_ids.length > 0
          ? await this.trieuChungRepo.findBy({ id: In(dto.trieu_chung_ids) })
          : [];
    }

    if (dto.thiet_chan_ids !== undefined) {
      item.thietChanList =
        dto.thiet_chan_ids.length > 0
          ? await this.thietChanRepo.findBy({ id: In(dto.thiet_chan_ids) })
          : [];
    }

    if (dto.mach_chan_ids !== undefined) {
      item.machChanList =
        dto.mach_chan_ids.length > 0
          ? await this.machChanRepo.findBy({ id: In(dto.mach_chan_ids) })
          : [];
    }

    if (dto.phap_tri_ids !== undefined) {
      item.phapTriList =
        dto.phap_tri_ids.length > 0
          ? await this.phapTriRepo.findBy({ id: In(dto.phap_tri_ids) })
          : [];
    }

    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
