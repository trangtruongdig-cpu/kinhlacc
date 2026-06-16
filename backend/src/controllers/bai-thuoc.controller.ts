import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, EntityManager } from 'typeorm';
import { BaiThuoc } from '../models/bai-thuoc.model';
import { BaiThuocChiTiet } from '../models/bai-thuoc-chi-tiet.model';
import { BaiThuocPhapTri } from '../models/bai-thuoc-phap-tri.model';
import { PhapTri } from '../models/phap-tri.model';
import { ViThuoc } from '../models/vi-thuoc.model';
import { TrieuChung } from '../models/trieu-chung.model';
import { CreateBaiThuocDto, UpdateBaiThuocDto } from '../models/dongy-thuoc.dto';
import {
  analyzeFormula,
  parseLieuToGram,
  type AnalysisHerbInput,
  type FormulaAnalysis,
} from './tcm-analysis.util';

@Injectable()
export class BaiThuocService {
  constructor(
    @InjectRepository(BaiThuoc)
    private repo: Repository<BaiThuoc>,
    @InjectRepository(BaiThuocChiTiet)
    private detailRepo: Repository<BaiThuocChiTiet>,
    @InjectRepository(ViThuoc)
    private viThuocRepo: Repository<ViThuoc>,
    private dataSource: DataSource,
  ) {}

  private static readonly BT_VI_RELATIONS = [
    'chiTietViThuoc',
    'chiTietViThuoc.viThuoc',
    'chiTietViThuoc.viThuoc.congDungLinks',
    'chiTietViThuoc.viThuoc.congDungLinks.congDung',
    'chiTietViThuoc.viThuoc.chuTriLinks',
    'chiTietViThuoc.viThuoc.chuTriLinks.chuTri',
    'chiTietViThuoc.viThuoc.kiengKyLinks',
    'chiTietViThuoc.viThuoc.kiengKyLinks.kiengKy',
    'chiTietViThuoc.viThuoc.tenGoiKhacList',
    'phapTriLinks',
    'phapTriLinks.phapTri',
    'phapTriLinks.phapTri.trieu_chung_list',
    'trieuChungList',
  ] as const;

  private static dtoHasPhapTriIds(dto: object): dto is { phap_tri_ids: number[] | undefined } {
    return Object.prototype.hasOwnProperty.call(dto, 'phap_tri_ids');
  }

  private static dtoHasTrieuChungIds(dto: object): dto is { trieu_chung_ids: number[] | undefined } {
    return Object.prototype.hasOwnProperty.call(dto, 'trieu_chung_ids');
  }

  private formatTrieuChungText(list: TrieuChung[]): string {
    return list.map((x) => x.ten_trieu_chung.trim()).filter(Boolean).join(', ');
  }

  private async applyTrieuChung(
    manager: EntityManager,
    bt: BaiThuoc,
    dto: CreateBaiThuocDto | UpdateBaiThuocDto,
    mode: 'create' | 'update',
  ): Promise<void> {
    const hasIds = BaiThuocService.dtoHasTrieuChungIds(dto);
    const hasText = Object.prototype.hasOwnProperty.call(dto, 'trieu_chung');
    if (mode === 'update' && !hasIds && !hasText) return;
    if (hasText) {
      throw new BadRequestException('Không hỗ trợ ghi trực tiếp trieu_chung dạng text. Vui lòng gửi trieu_chung_ids.');
    }
    if (!hasIds) {
      throw new BadRequestException('Thiếu trieu_chung_ids.');
    }

    let list: TrieuChung[] = [];
    const ids = [...new Set((dto.trieu_chung_ids ?? []).map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0))];
    list = ids.length ? await manager.findBy(TrieuChung, { id: In(ids) }) : [];

    bt.trieuChungList = list;
    bt.trieu_chung = this.formatTrieuChungText(list);
    await manager.save(bt);
  }

  /** Cập nhật bảng bai_thuoc_phap_tri; update chỉ khi body có key phap_tri_ids. */
  private async applyPhapTriLinks(
    manager: EntityManager,
    idBaiThuoc: number,
    dto: CreateBaiThuocDto | UpdateBaiThuocDto,
    mode: 'create' | 'update',
  ): Promise<void> {
    if (mode === 'update' && !BaiThuocService.dtoHasPhapTriIds(dto)) return;
    const raw = BaiThuocService.dtoHasPhapTriIds(dto) ? dto.phap_tri_ids : undefined;
    if (mode === 'create' && raw === undefined) return;

    if (mode === 'update') {
      await manager.delete(BaiThuocPhapTri, { idBaiThuoc });
    }

    const ids = (raw ?? []).filter((x): x is number => Number.isFinite(x));
    if (!ids.length) return;

    const uniq: number[] = [...new Set(ids)];
    const found = await manager.find(PhapTri, { where: { id: In(uniq) }, select: ['id'] });
    const allowed = new Set(found.map((e) => e.id));
    let ord = 0;
    for (const ptId of uniq) {
      if (!allowed.has(ptId)) continue;
      await manager.save(
        manager.create(BaiThuocPhapTri, {
          idBaiThuoc,
          idPhapTri: ptId,
          thuTu: ord,
          doanChungTrang: null,
        }),
      );
      ord += 1;
    }
  }

  findAll(): Promise<BaiThuoc[]> {
    return this.repo.find({
      relations: [...BaiThuocService.BT_VI_RELATIONS],
      order: { ten_bai_thuoc: 'ASC' },
    });
  }

  /**
   * Trả full danh sách id + tên dùng cho dropdown picker.
   * Không relations, không pagination — dữ liệu rất nhẹ nên đủ an toàn để gọi unbounded.
   */
  findOptions(): Promise<Array<Pick<BaiThuoc, 'id' | 'ten_bai_thuoc'>>> {
    return this.repo.find({
      select: ['id', 'ten_bai_thuoc'],
      order: { ten_bai_thuoc: 'ASC' },
    });
  }

  /**
   * Lightweight, paginated list for the medicines tab.
   * - Cắt 4 cấp relations nặng (congDungLinks/chuTriLinks/kiengKyLinks/tenGoiKhacList) để query nhanh.
   * - Hỗ trợ search server-side trên các cột text + category filter (đông y / tây y).
   * - Hai-query pattern: count IDs trước, sau đó load lại với relations qua `In(ids)`
   *   để tránh `LIMIT` bị méo do JOIN.
   */
  async findLite(opts: {
    page?: number;
    limit?: number;
    q?: string;
    category?: 'all' | 'dong-y' | 'tay-y';
    chungBenhId?: number | null;
    tangPhuIds?: number[];
    tonThuongTacNhans?: string[];
    focusId?: number | null;
  }): Promise<{
    data: BaiThuoc[];
    total: number;
    page: number;
    limit: number;
    statsByCategory: { all: number; 'dong-y': number; 'tay-y': number };
    tangPhuStats: Array<{ id: number; name: string; count: number }>;
    tonThuongStats: Array<{ id: number; name: string; count: number }>;
  }> {
    let page = Math.max(1, Math.floor(opts.page ?? 1));
    const limit = Math.max(1, Math.min(200, Math.floor(opts.limit ?? 12)));
    const q = (opts.q ?? '').trim();
    const category = opts.category ?? 'all';
    const chungBenhId = Number.isFinite(opts.chungBenhId as number) ? Number(opts.chungBenhId) : null;
    const tangPhuIds = [...new Set((opts.tangPhuIds ?? []).filter((n) => Number.isFinite(n) && n > 0))];
    const tonThuongTacNhans = [...new Set((opts.tonThuongTacNhans ?? []).map((s) => s.trim()).filter(Boolean))];
    const focusId = Number.isFinite(opts.focusId as number) && Number(opts.focusId) > 0 ? Number(opts.focusId) : null;

    const baseQb = this.repo.createQueryBuilder('bt');
    if (q) {
      const term = `%${q}%`;
      baseQb.andWhere(
        '(bt.ten_bai_thuoc ILIKE :term OR bt.nguon_goc ILIKE :term OR bt.cach_dung ILIKE :term OR bt.trieu_chung ILIKE :term OR bt.the_benh ILIKE :term OR bt.chung_trang ILIKE :term)',
        { term },
      );
    }

    // EXISTS / NOT EXISTS dựa trên bảng nối benh_tay_y_bai_thuoc.
    const tayYExists = '(SELECT 1 FROM benh_tay_y_bai_thuoc bty_bt';
    if (category === 'tay-y') {
      if (chungBenhId != null) {
        baseQb.andWhere(
          `EXISTS ${tayYExists} JOIN benh_tay_y bty ON bty.id = bty_bt.id_benh_tay_y WHERE bty_bt.id_bai_thuoc = bt.id AND bty.id_chung_benh = :cbId)`,
          { cbId: chungBenhId },
        );
      } else {
        baseQb.andWhere(`EXISTS ${tayYExists} WHERE bty_bt.id_bai_thuoc = bt.id)`);
      }
    } else if (category === 'dong-y') {
      baseQb.andWhere(`NOT EXISTS ${tayYExists} WHERE bty_bt.id_bai_thuoc = bt.id)`);
    }
    if (category !== 'all') {
      if (tangPhuIds.length > 0) {
        baseQb.andWhere(
          `EXISTS (
             SELECT 1 FROM bai_thuoc_phap_tri btpt
             JOIN phap_tri_kinh_mach pkm ON pkm.id_phap_tri = btpt.id_phap_tri
             WHERE btpt.id_bai_thuoc = bt.id AND pkm.id_kinh_mach IN (:...tangPhuIds)
           )`,
          { tangPhuIds },
        );
      }
      if (tonThuongTacNhans.length > 0) {
        baseQb.andWhere(
          `EXISTS (
             SELECT 1 FROM bai_thuoc_phap_tri btpt
             JOIN phap_tri pt2 ON pt2.id = btpt.id_phap_tri
             WHERE btpt.id_bai_thuoc = bt.id
               AND pt2.luc_kinh IS NOT NULL
               AND EXISTS (
                 SELECT 1 FROM unnest(string_to_array(pt2.luc_kinh, ',')) AS tt(name)
                 WHERE LOWER(TRIM(tt.name)) IN (:...tonThuongNames)
               )
           )`,
          { tonThuongNames: tonThuongTacNhans.map((s) => s.toLowerCase()) },
        );
      }
    }

    // Deep-link focus: nếu có focusId, nhảy tới trang chứa bài thuốc đó
    // (theo đúng filter hiện tại + thứ tự ten_bai_thuoc ASC, id ASC) để frontend scroll/highlight được.
    if (focusId != null) {
      const target = await this.repo.findOne({
        where: { id: focusId },
        select: { id: true, ten_bai_thuoc: true },
      });
      if (target) {
        const exists = await baseQb.clone().andWhere('bt.id = :fid', { fid: focusId }).getCount();
        if (exists > 0) {
          const before = await baseQb
            .clone()
            .andWhere(
              '(bt.ten_bai_thuoc < :ften OR (bt.ten_bai_thuoc = :ften AND bt.id < :fid))',
              { ften: target.ten_bai_thuoc, fid: focusId },
            )
            .getCount();
          page = Math.floor(before / limit) + 1;
        }
      }
    }

    const [items, total] = await baseQb
      .orderBy('bt.ten_bai_thuoc', 'ASC')
      .addOrderBy('bt.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    let data: BaiThuoc[] = [];
    if (items.length) {
      const ids = items.map((x) => x.id);
      data = await this.repo.find({
        where: { id: In(ids) },
        relations: [
          'chiTietViThuoc',
          'chiTietViThuoc.viThuoc',
          'phapTriLinks',
          'phapTriLinks.phapTri',
          'phapTriLinks.phapTri.trieu_chung_list',
          'trieuChungList',
        ],
        order: { ten_bai_thuoc: 'ASC', id: 'ASC' },
      });
    }

    // Counts toàn bộ (không apply search) để hiển thị badge "Đông Y / Tây Y / Tất cả".
    const totalAll = await this.repo.count();
    const totalTayY = await this.repo
      .createQueryBuilder('bt')
      .where(`EXISTS ${tayYExists} WHERE bty_bt.id_bai_thuoc = bt.id)`)
      .getCount();

    // Pool filter dùng cho stats: phản ánh category (+ chungBenhId khi tay-y), bỏ qua filter tangPhu/tonThuong
    // để các option luôn hiển thị đầy đủ theo pool.
    const tayYExistsBare = chungBenhId != null
      ? `EXISTS (SELECT 1 FROM benh_tay_y_bai_thuoc bty_bt
                JOIN benh_tay_y bty ON bty.id = bty_bt.id_benh_tay_y
                WHERE bty_bt.id_bai_thuoc = bt.id AND bty.id_chung_benh = $1)`
      : `EXISTS (SELECT 1 FROM benh_tay_y_bai_thuoc bty_bt WHERE bty_bt.id_bai_thuoc = bt.id)`;
    let poolFilter = '';
    const statsParams: unknown[] = [];
    if (category === 'tay-y') {
      poolFilter = `AND ${tayYExistsBare}`;
      if (chungBenhId != null) statsParams.push(chungBenhId);
    } else if (category === 'dong-y') {
      poolFilter = `AND NOT EXISTS (SELECT 1 FROM benh_tay_y_bai_thuoc bty_bt WHERE bty_bt.id_bai_thuoc = bt.id)`;
    }

    // Stats theo Tạng phủ (kinh mạch) trên pool hiện tại — đi qua phap_tri.
    const tangPhuStatsRows: Array<{ id: number; name: string; cnt: number }> = await this.repo.query(
      `SELECT km.id_kinh_mach AS id,
              km.ten_kinh_mach AS name,
              COUNT(DISTINCT bt.id)::int AS cnt
       FROM bai_thuoc bt
       JOIN bai_thuoc_phap_tri btpt ON btpt.id_bai_thuoc = bt.id
       JOIN phap_tri_kinh_mach pkm ON pkm.id_phap_tri = btpt.id_phap_tri
       JOIN kinh_mach km ON km.id_kinh_mach = pkm.id_kinh_mach
       WHERE 1=1 ${poolFilter}
       GROUP BY km.id_kinh_mach, km.ten_kinh_mach
       HAVING COUNT(DISTINCT bt.id) > 0
       ORDER BY km.ten_kinh_mach`,
      statsParams,
    );
    const tangPhuStats = tangPhuStatsRows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      count: Number(r.cnt),
    }));

    // Stats theo Tổn thương - Tác nhân trên pool hiện tại.
    const tonThuongStatsRows: Array<{ id: number; name: string; cnt: number }> = await this.repo.query(
      `SELECT tt.id AS id, tt.ten AS name,
              COUNT(DISTINCT bt.id)::int AS cnt
       FROM ton_thuong_tac_nhan tt
       LEFT JOIN bai_thuoc bt
         ON EXISTS (
           SELECT 1 FROM bai_thuoc_phap_tri btpt
           JOIN phap_tri pt ON pt.id = btpt.id_phap_tri
           WHERE btpt.id_bai_thuoc = bt.id
             AND pt.luc_kinh IS NOT NULL
             AND EXISTS (
               SELECT 1 FROM unnest(string_to_array(pt.luc_kinh, ',')) AS u(v)
               WHERE LOWER(TRIM(u.v)) = LOWER(TRIM(tt.ten))
             )
         )
         ${poolFilter}
       GROUP BY tt.id, tt.ten
       HAVING COUNT(DISTINCT bt.id) > 0
       ORDER BY tt.ten`,
      statsParams,
    );
    const tonThuongStats = tonThuongStatsRows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      count: Number(r.cnt),
    }));

    return {
      data,
      total,
      page,
      limit,
      statsByCategory: {
        all: totalAll,
        'dong-y': totalAll - totalTayY,
        'tay-y': totalTayY,
      },
      tangPhuStats,
      tonThuongStats,
    };
  }

  findOne(id: number): Promise<BaiThuoc | null> {
    return this.repo.findOne({
      where: { id },
      relations: [...BaiThuocService.BT_VI_RELATIONS],
    });
  }

  /** Cache bài thuốc + phân tích cho trang DEMO công khai (tính 1 lần/đời tiến trình). */
  private demoFormulaCache: { baiThuoc: BaiThuoc; analysis: any } | null = null;
  /** Cache danh sách bài thuốc cho slider DEMO (nhiều bài) — quét 1 lần rồi giữ lại. */
  private demoFormulasCache: BaiThuoc[] | null = null;

  /**
   * Bài thuốc GẮN VỚI BỆNH TÂY Y ưu tiên cho demo công khai: tên quen thuộc + bệnh Tây Y
   * dễ nhận biết (Cao Huyết Áp, Hen Suyễn, Sỏi Thận, Viêm Gan…). Match nới lỏng bằng ILIKE,
   * chỉ nhận bài thật sự có liên kết bệnh Tây Y + có chứng trạng (để phần "5) Tổng Hợp" hiện).
   */
  private static readonly DEMO_TAY_Y_PREFERRED = [
    'Thiên Ma Câu Đằng Ẩm', // Bệnh Thận Tăng Huyết Áp (Cao Huyết Áp)
    'Tiểu Thanh Long Thang', // Hen Suyễn
    'Nhân Trần Cao Thang', // Viêm Gan Virus
    'Long Đởm Tả Can', // Zona Thần Kinh / Viêm — Can Hỏa
    'Quy Tỳ Thang', // Ung Thư Tuyến Vú
    'Ngân Kiều Tán', // Cảm Cúm / Viêm Phổi
    'Thạch Vi Tán', // Sỏi Thận
    'Kim Quỹ Thận Khí', // Bệnh Thận Tăng Huyết Áp
    'Bán Hạ Bạch Truật Thiên Ma', // Cao Huyết Áp (đàm thấp)
    'Tiêu Phong Tán', // Thấp Chẩn / Viêm Da
    'Nhân Sâm Bạch Hổ', // Sốt cao
    'Trúc Diệp Thạch Cao', // Bỏng / Lupus Ban Đỏ
  ];

  /** Bỏ hậu tố kỹ thuật " (12)" ở cuối tên bài thuốc khi DEMO (dữ liệu gốc giữ nguyên). */
  private cleanDemoName(name: string | null | undefined): string {
    return (name || '').replace(/\s*\(\d+\)\s*$/, '').trim();
  }

  /** Tên các bệnh Tây Y mà bài thuốc điều trị — đổ vào phần "Tổng Hợp" của demo. */
  private async getBenhTayYNames(baiThuocId: number): Promise<string[]> {
    const rows: { ten_benh: string }[] = await this.dataSource.query(
      `SELECT DISTINCT bty.ten_benh
         FROM benh_tay_y_bai_thuoc x
         JOIN benh_tay_y bty ON bty.id = x.id_benh_tay_y
        WHERE x.id_bai_thuoc = $1
        ORDER BY bty.ten_benh`,
      [baiThuocId],
    );
    return rows.map((r) => (r.ten_benh || '').trim()).filter(Boolean);
  }

  /** ID 1 bài thuốc Tây Y "đẹp" theo tên gợi ý (đủ vị + có chứng trạng để phần Tổng Hợp hiện). */
  private async findTayYDemoIdByName(name: string): Promise<number | null> {
    const rows: { id: number }[] = await this.dataSource.query(
      `SELECT bt.id
         FROM bai_thuoc bt
        WHERE bt.ten_bai_thuoc ILIKE $1
          AND EXISTS (SELECT 1 FROM benh_tay_y_bai_thuoc x WHERE x.id_bai_thuoc = bt.id)
          AND (SELECT COUNT(*) FROM bai_thuoc_chi_tiet c WHERE c.id_bai_thuoc = bt.id) >= 3
          AND EXISTS (SELECT 1 FROM bai_thuoc_phap_tri l JOIN phap_tri pt ON pt.id = l.id_phap_tri
                      WHERE l.id_bai_thuoc = bt.id AND length(trim(coalesce(pt.the_benh, ''))) > 0)
        ORDER BY (SELECT COUNT(*) FROM bai_thuoc_chi_tiet c WHERE c.id_bai_thuoc = bt.id) DESC, bt.id
        LIMIT 1`,
      [`%${name}%`],
    );
    return rows[0]?.id ?? null;
  }

  /** Bù danh sách ID bài thuốc Tây Y "đẹp" (loại placeholder trùng tên triệu chứng). */
  private async fallbackTayYDemoIds(limit: number): Promise<number[]> {
    if (limit <= 0) return [];
    const rows: { id: number }[] = await this.dataSource.query(
      `SELECT bt.id
         FROM bai_thuoc bt
        WHERE EXISTS (SELECT 1 FROM benh_tay_y_bai_thuoc x WHERE x.id_bai_thuoc = bt.id)
          AND (SELECT COUNT(*) FROM bai_thuoc_chi_tiet c WHERE c.id_bai_thuoc = bt.id) >= 4
          AND EXISTS (SELECT 1 FROM bai_thuoc_phap_tri l JOIN phap_tri pt ON pt.id = l.id_phap_tri
                      WHERE l.id_bai_thuoc = bt.id AND length(trim(coalesce(pt.the_benh, ''))) > 0)
          AND bt.ten_bai_thuoc !~ '\\((Biểu|Ngoại|Tiết Niệu|Phụ Khoa|Nhi Khoa|Ngũ Quan)\\)'
        ORDER BY (SELECT COUNT(*) FROM bai_thuoc_chi_tiet c WHERE c.id_bai_thuoc = bt.id) DESC, bt.id
        LIMIT $1`,
      [limit],
    );
    return rows.map((r) => r.id);
  }

  /** Thứ tự ID bài thuốc Tây Y cho demo: ưu tiên gợi ý, bù sau; tôn trọng DEMO_BAI_THUOC_ID. */
  private async resolveDemoTayYIds(want: number): Promise<number[]> {
    const ids: number[] = [];
    const seen = new Set<number>();
    const push = (id: number | null | undefined) => {
      if (id && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    };

    const pinned = process.env.DEMO_BAI_THUOC_ID ? Number(process.env.DEMO_BAI_THUOC_ID) : null;
    if (pinned && Number.isFinite(pinned)) push(pinned);

    for (const name of BaiThuocService.DEMO_TAY_Y_PREFERRED) {
      if (ids.length >= want) break;
      push(await this.findTayYDemoIdByName(name));
    }
    if (ids.length < want) {
      for (const id of await this.fallbackTayYDemoIds(want - ids.length + 5)) {
        if (ids.length >= want) break;
        push(id);
      }
    }
    return ids.slice(0, want);
  }

  /** Nạp đủ chi tiết 1 bài thuốc cho demo: gắn tên bệnh Tây Y + làm sạch tên hiển thị. */
  private async loadDemoFormula(id: number): Promise<BaiThuoc | null> {
    const bt = await this.findOne(id);
    if (!bt) return null;
    bt.ten_bai_thuoc = this.cleanDemoName(bt.ten_bai_thuoc);
    (bt as unknown as { benhTayY: string[] }).benhTayY = await this.getBenhTayYNames(id);
    return bt;
  }

  /**
   * Chọn 1 bài thuốc GẮN VỚI BỆNH TÂY Y để DEMO công khai (khách chưa đăng nhập xem thử
   * phân tích tính vị quy kinh + Quân–Thần–Tá–Sứ + bệnh Tây Y ở phần Tổng Hợp).
   * - Có thể chỉ định cứng qua biến môi trường DEMO_BAI_THUOC_ID.
   * - Mặc định: ưu tiên bài Tây Y quen thuộc (xem DEMO_TAY_Y_PREFERRED), bù bằng bài Tây Y khác.
   */
  async findDemoFormula(): Promise<{ baiThuoc: BaiThuoc; analysis: any }> {
    if (this.demoFormulaCache) return this.demoFormulaCache;

    const [id] = await this.resolveDemoTayYIds(1);
    if (!id) {
      throw new NotFoundException('Chưa có bài thuốc Tây Y nào để demo');
    }

    const baiThuoc = await this.loadDemoFormula(id);
    if (!baiThuoc) {
      throw new NotFoundException('Không tìm thấy bài thuốc demo');
    }
    const analysis = await this.analyzeBaiThuoc(id);
    this.demoFormulaCache = { baiThuoc, analysis };
    return this.demoFormulaCache;
  }

  /**
   * Chọn VÀI bài thuốc GẮN VỚI BỆNH TÂY Y cho slider DEMO công khai (khách lướt xem nhiều bài).
   * Ưu tiên bài Tây Y quen thuộc, đủ vị + có chứng trạng để phần "5) Tổng Hợp" sinh động;
   * thiếu thì bù bằng bài Tây Y khác. Mỗi bài đã gắn tên bệnh Tây Y + làm sạch tên hiển thị.
   */
  async findDemoFormulas(count = 5): Promise<BaiThuoc[]> {
    const want = Math.max(1, Math.min(count, 12));
    if (this.demoFormulasCache) return this.demoFormulasCache.slice(0, want);

    const ids = await this.resolveDemoTayYIds(want);
    if (!ids.length) {
      throw new NotFoundException('Chưa có bài thuốc Tây Y nào để demo');
    }

    const list: BaiThuoc[] = [];
    for (const id of ids) {
      const full = await this.loadDemoFormula(id);
      if (full) list.push(full);
    }
    this.demoFormulasCache = list;
    return list;
  }

  async create(dto: CreateBaiThuocDto): Promise<BaiThuoc> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { chi_tiet, phap_tri_ids: _pt, trieu_chung_ids: _tcIds, ...rest } = dto;
      const bt = this.repo.create(rest);
      const savedBt = await queryRunner.manager.save(bt);

      if (chi_tiet && chi_tiet.length > 0) {
        const details = chi_tiet.map((d) =>
          this.detailRepo.create({
            idBaiThuoc: savedBt.id,
            idViThuoc: d.id_vi_thuoc,
            lieu_luong: d.lieu_luong,
            vai_tro: d.vai_tro,
            ghi_chu: d.ghi_chu,
            tinh_vi: d.tinh_vi,
            quy_kinh: d.quy_kinh,
          }),
        );
        await queryRunner.manager.save(details);
      }
      await this.applyPhapTriLinks(queryRunner.manager, savedBt.id, dto, 'create');
      await this.applyTrieuChung(queryRunner.manager, savedBt, dto, 'create');
      await queryRunner.commitTransaction();
      return this.findOne(savedBt.id) as Promise<BaiThuoc>;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, dto: UpdateBaiThuocDto): Promise<BaiThuoc | null> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { chi_tiet, phap_tri_ids: _pt, trieu_chung_ids: _tcIds, ...rest } = dto;
      await queryRunner.manager.update(BaiThuoc, id, rest);
      const savedBt = await queryRunner.manager.findOneByOrFail(BaiThuoc, { id });

      if (chi_tiet) {
        await queryRunner.manager.delete(BaiThuocChiTiet, { idBaiThuoc: id });
        const details = chi_tiet.map((d) =>
          this.detailRepo.create({
            idBaiThuoc: id,
            idViThuoc: d.id_vi_thuoc,
            lieu_luong: d.lieu_luong,
            vai_tro: d.vai_tro,
            ghi_chu: d.ghi_chu,
            tinh_vi: d.tinh_vi,
            quy_kinh: d.quy_kinh,
          }),
        );
        await queryRunner.manager.save(details);
      }
      await this.applyPhapTriLinks(queryRunner.manager, id, dto, 'update');
      await this.applyTrieuChung(queryRunner.manager, savedBt, dto, 'update');
      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  // ─── PHÂN TÍCH BÀI THUỐC (engine ở tcm-analysis.util.ts) ─────────────────────
  /**
   * Phân tích đầy đủ một bài thuốc: Tứ Khí, Ngũ Vị, Quy Kinh, Thăng-Giáng-Phù-Trầm,
   * Quân-Thần-Tá-Sứ, chứng trạng & kiêng kỵ. Toàn bộ tính toán nằm ở backend (nguồn sự thật).
   *
   * @param overrides Tùy chọn gram theo từng vị (mô phỏng "kéo gram" từ UI) — key = id vị thuốc.
   */
  async analyzeBaiThuoc(
    id: number,
    overrides?: Array<{ idViThuoc: number; gram: number }>,
  ): Promise<
    | (FormulaAnalysis & { success: true; tuongPhan: TuongPhanWarning[] })
    | { success: false; error: string }
  > {
    const baiThuoc = await this.findOne(id);
    if (!baiThuoc || !baiThuoc.chiTietViThuoc || baiThuoc.chiTietViThuoc.length === 0) {
      return { success: false, error: 'Không tìm thấy bài thuốc hoặc bài thuốc chưa có vị thuốc.' };
    }

    // Map override gram theo id vị thuốc (chỉ nhận số hữu hạn, >= 0).
    const gramOverride = new Map<number, number>();
    for (const o of overrides ?? []) {
      const vid = Number(o?.idViThuoc);
      const g = Number(o?.gram);
      if (Number.isFinite(vid) && Number.isFinite(g) && g >= 0) gramOverride.set(vid, g);
    }

    // Chuẩn hoá chi tiết → input thuần cho engine (gram đã giải quyết, quy kinh ưu tiên vị thuốc).
    const herbs: AnalysisHerbInput[] = [];
    for (const d of baiThuoc.chiTietViThuoc) {
      const vt = d.viThuoc;
      if (!vt) continue;
      const gram = gramOverride.has(vt.id) ? gramOverride.get(vt.id)! : parseLieuToGram(d.lieu_luong);
      herbs.push({
        id: vt.id,
        ten_vi_thuoc: vt.ten_vi_thuoc || '',
        tinh: vt.tinh || '',
        vi: vt.vi || '',
        quy_kinh: vt.quy_kinh || d.quy_kinh || '',
        gram,
        vai_tro_nhap: d.vai_tro || '',
        congNang: (vt.congDungLinks ?? [])
          .map((l) => (l.congDung?.ten_cong_dung || '').trim())
          .filter(Boolean),
      });
    }
    if (!herbs.length) {
      return { success: false, error: 'Không có dữ liệu vị thuốc để phân tích.' };
    }

    // Chứng trạng: gộp từ bài thuốc + pháp trị liên kết (distinct).
    const ctParts = [
      (baiThuoc.chung_trang || '').trim(),
      ...[...(baiThuoc.phapTriLinks ?? [])]
        .sort((a, b) => (a.thuTu ?? 0) - (b.thuTu ?? 0))
        .map((l) => (l.phapTri?.chung_trang || '').trim()),
    ].filter(Boolean);
    const chungTrang = [
      ...new Set(ctParts.join(', ').split(/[,;]+/).map((s) => s.trim()).filter(Boolean)),
    ].join(', ');

    // Kiêng kỵ: gộp trực tiếp từ các vị thuốc.
    const seenKk = new Set<string>();
    const kiengKy: string[] = [];
    for (const d of baiThuoc.chiTietViThuoc) {
      for (const l of d.viThuoc?.kiengKyLinks ?? []) {
        const n = (l.kiengKy?.ten_kieng_ky || '').trim();
        if (!n) continue;
        const g = (l.ghi_chu || '').trim();
        const display = g ? `${n} (${g})` : n;
        const key = display.toLowerCase();
        if (seenKk.has(key)) continue;
        seenKk.add(key);
        kiengKy.push(display);
      }
    }

    const analysis = analyzeFormula({ ten: baiThuoc.ten_bai_thuoc, herbs, chungTrang, kiengKy });

    // Cấm kỵ phối ngũ: quét mọi cặp vị trong bài trúng bảng tương phản/tương úy.
    const tuongPhan = await this.scanTuongPhan(herbs.map((h) => h.id));

    return { success: true, ...analysis, tuongPhan };
  }

  /**
   * So sánh nhiều bài thuốc: phân tích từng bài + đối chiếu thành phần vị thuốc.
   * Trả radar (qua từng analysis) để UI chồng lên, và bảng diff vị chung / chỉ-ở-A / chỉ-ở-B.
   */
  async compareBaiThuoc(ids: number[]): Promise<{
    formulas: Array<FormulaAnalysis & { id: number }>;
    composition: Array<{ id: number; ten: string; grams: Array<number | null> }>;
  }> {
    const uniq = [...new Set(ids.filter((x) => Number.isFinite(x) && x > 0))].slice(0, 4);
    if (uniq.length < 2) {
      throw new BadRequestException('Cần ít nhất 2 bài thuốc để so sánh (ids=a,b).');
    }
    const analyses = await Promise.all(uniq.map((id) => this.analyzeBaiThuoc(id)));

    const formulas: Array<FormulaAnalysis & { id: number }> = [];
    const okIndex: number[] = []; // index trong uniq của các bài phân tích thành công
    analyses.forEach((a, i) => {
      if (a && (a as { success: boolean }).success) {
        const { success: _ok, tuongPhan: _tp, ...rest } = a as FormulaAnalysis & {
          success: true;
          tuongPhan: unknown;
        };
        formulas.push({ id: uniq[i], ...(rest as FormulaAnalysis) });
        okIndex.push(i);
      }
    });
    if (formulas.length < 2) {
      throw new BadRequestException('Không đủ bài thuốc hợp lệ (có vị thuốc) để so sánh.');
    }

    // Bảng đối chiếu thành phần: hợp tất cả vị thuốc, mỗi cột là gram trong từng bài (null nếu vắng).
    const merged = new Map<number, { ten: string; grams: Array<number | null> }>();
    formulas.forEach((f, col) => {
      for (const v of f.viThuocList) {
        let row = merged.get(v.id);
        if (!row) {
          row = { ten: v.ten, grams: new Array<number | null>(formulas.length).fill(null) };
          merged.set(v.id, row);
        }
        row.grams[col] = v.gram;
      }
    });
    const composition = [...merged.entries()]
      .map(([id, r]) => ({ id, ten: r.ten, grams: r.grams }))
      .sort((a, b) => {
        // Vị chung (xuất hiện ≥2 bài) lên trước, rồi theo tên.
        const ca = a.grams.filter((g) => g != null).length;
        const cb = b.grams.filter((g) => g != null).length;
        return cb - ca || a.ten.localeCompare(b.ten, 'vi');
      });

    return { formulas, composition };
  }

  /** Quét cặp vị thuốc tương phản (18 phản) / tương úy (19 úy) trong một tập vị thuốc. */
  private async scanTuongPhan(viThuocIds: number[]): Promise<TuongPhanWarning[]> {
    const ids = [...new Set(viThuocIds.filter((x) => Number.isFinite(x) && x > 0))];
    if (ids.length < 2) return [];
    try {
      const rows: Array<{ loai: string; ghi_chu: string | null; ten_a: string; ten_b: string }> =
        await this.repo.query(
          `SELECT tp.loai, tp.ghi_chu, a.ten_vi_thuoc AS ten_a, b.ten_vi_thuoc AS ten_b
           FROM vi_thuoc_tuong_phan tp
           JOIN vi_thuoc a ON a.id = tp.id_vi_thuoc_a
           JOIN vi_thuoc b ON b.id = tp.id_vi_thuoc_b
           WHERE tp.id_vi_thuoc_a = ANY($1) AND tp.id_vi_thuoc_b = ANY($1)`,
          [ids],
        );
      return rows.map((r) => ({
        loai: r.loai === 'úy' ? 'úy' : 'phản',
        tenA: r.ten_a,
        tenB: r.ten_b,
        ghiChu: (r.ghi_chu || '').trim() || null,
      }));
    } catch {
      // Bảng chưa được tạo (chưa chạy migration) → coi như không có cảnh báo.
      return [];
    }
  }
}

/** Cảnh báo một cặp vị thuốc kỵ nhau trong bài. */
export interface TuongPhanWarning {
  loai: 'phản' | 'úy';
  tenA: string;
  tenB: string;
  ghiChu: string | null;
}
