import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import { BenhDongYExcel } from '../models/benh-dong-y-excel.model';
import {
  CreateBenhDongYExcelDto,
  InputChiSo,
  UpdateBenhDongYExcelDto,
} from '../models/benh-dong-y-excel.dto';
import { TrieuChung } from '../models/trieu-chung.model';
import { BaiThuoc } from '../models/bai-thuoc.model';
import { PhapTri } from '../models/phap-tri.model';
import { evaluateLogicExpression } from '../utils/excel-rule-engine';
import { isKepName } from '../utils/the-do-match.util';
import { TrieuChungService } from './trieu-chung.controller';

@Injectable()
export class BenhDongYExcelService {
  private static readonly RELATIONS = {
    phapTriList: true,
    trieuChungList: true,
    baiThuocList: true,
    nguyen_nhan_list: true,
  } as const;

  constructor(
    @InjectRepository(BenhDongYExcel)
    private readonly repo: Repository<BenhDongYExcel>,
    @InjectRepository(TrieuChung)
    private readonly trieuChungRepo: Repository<TrieuChung>,
    @InjectRepository(BaiThuoc)
    private readonly baiThuocRepo: Repository<BaiThuoc>,
    @InjectRepository(PhapTri)
    private readonly phapTriRepo: Repository<PhapTri>,
    private readonly trieuChungService: TrieuChungService,
  ) {}

  private static isUniqueViolation(err: unknown): boolean {
    return (
      err instanceof QueryFailedError &&
      (err as QueryFailedError & { driverError?: { code?: string } }).driverError?.code === '23505'
    );
  }

  private static hasKey(dto: object, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(dto, key);
  }

  private static uniqueIds(ids: unknown): number[] {
    if (!Array.isArray(ids)) return [];
    const set = new Set<number>();
    for (const v of ids) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) set.add(n);
    }
    return Array.from(set);
  }

  private async resolveTrieuChung(ids: number[]): Promise<TrieuChung[]> {
    if (!ids.length) return [];
    return this.trieuChungRepo.findBy({ id: In(ids) });
  }

  private async resolveBaiThuoc(ids: number[]): Promise<BaiThuoc[]> {
    if (!ids.length) return [];
    return this.baiThuocRepo.findBy({ id: In(ids) });
  }

  private async resolvePhapTri(ids: number[]): Promise<PhapTri[]> {
    if (!ids.length) return [];
    return this.phapTriRepo.findBy({ id: In(ids) });
  }

  async findAll(): Promise<BenhDongYExcel[]> {
    return this.repo.find({ order: { id: 'ASC' }, relations: BenhDongYExcelService.RELATIONS });
  }

  /**
   * Lightweight paginated list cho UI quy tắc excel.
   * - Search trên code/name/outputCell/excelFormula.
   * - Giữ đủ relations cho list view (phapTriList, trieuChungList, baiThuocList).
   */
  async findLite(opts: {
    page?: number;
    limit?: number;
    q?: string;
  }): Promise<{ data: BenhDongYExcel[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Math.floor(opts.page ?? 1));
    const limit = Math.max(1, Math.min(200, Math.floor(opts.limit ?? 12)));
    const q = (opts.q ?? '').trim();

    const qb = this.repo.createQueryBuilder('r');
    if (q) {
      qb.andWhere(
        '(r.code ILIKE :term OR r.name ILIKE :term OR r.outputCell ILIKE :term OR r.excelFormula ILIKE :term)',
        { term: `%${q}%` },
      );
    }
    const [items, total] = await qb
      .orderBy('r.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    let data: BenhDongYExcel[] = [];
    if (items.length) {
      const ids = items.map((x) => x.id);
      data = await this.repo.find({
        where: { id: In(ids) },
        relations: BenhDongYExcelService.RELATIONS,
        order: { id: 'ASC' },
      });
    }

    return { data, total, page, limit };
  }

  /**
   * Dữ liệu Hỏi & Chẩn đoán TỪ thể đo (D4): mỗi thể đo → (bridge) → pháp trị →
   * gom triệu chứng (nhóm + IDF) + nguyên nhân. Thể kép nối ≥2 pháp trị → components
   * để FE tính điểm min. Tái dùng TrieuChungService.phanBietByPhapTriIds cho phần nặng.
   */
  async phanBiet(rawTheDoIds: number[]): Promise<{
    symptoms: Array<{ id: number; ten: string; weight: number; nhom: string | null }>;
    phapTriMeta: Record<number, { nguyen_nhan: string | null; mach_chan: string | null; chat_luoi: string | null }>;
    phapTriNguyenNhan: Record<number, Array<{ nhom: string | null; noi_dung: string }>>;
    candidates: Array<{
      theDoId: number;
      name: string;
      is_kep: boolean;
      phapTriIds: number[];
      symptomIds: number[];
      components: Array<{ phapTriId: number; label: string; symptomIds: number[] }>;
    }>;
  }> {
    const ids = BenhDongYExcelService.uniqueIds(rawTheDoIds);
    const empty = { symptoms: [], phapTriMeta: {}, phapTriNguyenNhan: {}, candidates: [] };
    if (!ids.length) return empty;

    const rows = await this.repo.find({
      where: { id: In(ids) },
      relations: { phapTriList: true, trieuChungList: true },
      order: { id: 'ASC' },
    });
    if (!rows.length) return empty;

    const allPtIds = [
      ...new Set(rows.flatMap((r) => (r.phapTriList ?? []).map((p) => p.id))),
    ];
    const base = await this.trieuChungService.phanBietByPhapTriIds(allPtIds);
    // byPhapTri: pháp trị id → triệu chứng ids (để gom theo thể đo / thành phần).
    const byPhapTri = base.byPhapTri;

    // Triệu chứng RIÊNG của thể đo (benh_dong_y_excel_trieu_chung) — gộp thêm, khử trùng
    // theo id (trùng hiện 1, khác bổ sung). Tính IDF cho triệu chứng riêng chưa có trong pháp trị.
    const symById = new Map(base.symptoms.map((s) => [s.id, s]));
    const ownByTheDo = new Map<number, number[]>();
    const missingOwn = new Map<number, { id: number; ten: string; nhom: string | null }>();
    for (const r of rows) {
      const own: number[] = [];
      for (const t of r.trieuChungList ?? []) {
        own.push(t.id);
        if (!symById.has(t.id) && !missingOwn.has(t.id)) {
          missingOwn.set(t.id, { id: t.id, ten: t.ten_trieu_chung, nhom: t.nhom ?? null });
        }
      }
      ownByTheDo.set(r.id, own);
    }
    if (missingOwn.size) {
      const nRow: Array<{ n: string }> = await this.repo.query(
        `SELECT COUNT(DISTINCT id_phap_tri)::text AS n FROM phap_tri_trieu_chung`,
      );
      const N = Number(nRow[0]?.n ?? 0);
      const dfRows: Array<{ tc: number; df: string }> = await this.repo.query(
        `SELECT id_trieu_chung AS tc, COUNT(DISTINCT id_phap_tri)::text AS df
         FROM phap_tri_trieu_chung WHERE id_trieu_chung = ANY($1) GROUP BY id_trieu_chung`,
        [[...missingOwn.keys()]],
      );
      const dfMap = new Map<number, number>(dfRows.map((d) => [Number(d.tc), Number(d.df)]));
      for (const m of missingOwn.values()) {
        const df = dfMap.get(m.id) ?? 0;
        const weight = df > 0 ? Math.round(Math.log(1 + N / df) * 1000) / 1000 : 0;
        const sym = { id: m.id, ten: m.ten, weight, nhom: m.nhom };
        symById.set(m.id, sym);
        base.symptoms.push(sym);
      }
    }

    const candidates = rows.map((r) => {
      const pts = r.phapTriList ?? [];
      const phapTriIds = pts.map((p) => p.id);
      const fromPt = phapTriIds.flatMap((pt) => byPhapTri[pt] ?? []);
      const symptomIds = [...new Set([...fromPt, ...(ownByTheDo.get(r.id) ?? [])])];
      const components = pts.map((p) => ({
        phapTriId: p.id,
        label: p.chung_trang ?? '',
        symptomIds: [...new Set(byPhapTri[p.id] ?? [])],
      }));
      return {
        theDoId: r.id,
        name: r.name,
        is_kep: isKepName(r.name),
        phapTriIds,
        symptomIds,
        components,
      };
    });

    return {
      symptoms: base.symptoms,
      phapTriMeta: base.phapTriMeta,
      phapTriNguyenNhan: base.phapTriNguyenNhan,
      candidates,
    };
  }

  async findOne(id: number): Promise<BenhDongYExcel> {
    const row = await this.repo.findOne({ where: { id }, relations: BenhDongYExcelService.RELATIONS });
    if (!row) {
      throw new NotFoundException(`Không tìm thấy quy tắc id=${id}`);
    }
    return row;
  }

  async create(dto: CreateBenhDongYExcelDto): Promise<BenhDongYExcel> {
    const required: (keyof CreateBenhDongYExcelDto)[] = [
      'code',
      'name',
      'outputCell',
      'excelFormula',
      'logicExpression',
      'sqlCaseText',
      'sqlCaseBoolean',
    ];
    for (const k of required) {
      const v = dto[k];
      if (v === undefined || v === null || (typeof v === 'string' && !v.trim())) {
        throw new BadRequestException(`Thiếu hoặc rỗng trường bắt buộc: ${String(k)}`);
      }
    }

    const phapTriIds = BenhDongYExcelService.uniqueIds(dto.id_phap_tri_list);
    const trieuChungIds = BenhDongYExcelService.uniqueIds(dto.id_trieu_chung_list);
    const baiThuocIds = BenhDongYExcelService.uniqueIds(dto.id_bai_thuoc_list);
    const entity = this.repo.create({
      code: dto.code.trim(),
      name: dto.name.trim(),
      outputCell: dto.outputCell.trim(),
      excelFormula: dto.excelFormula,
      logicExpression: dto.logicExpression,
      sqlCaseText: dto.sqlCaseText,
      sqlCaseBoolean: dto.sqlCaseBoolean,
      phapTriList: await this.resolvePhapTri(phapTriIds),
      trieuChungList: await this.resolveTrieuChung(trieuChungIds),
      baiThuocList: await this.resolveBaiThuoc(baiThuocIds),
    });
    try {
      const saved = await this.repo.save(entity);
      await this.applyNguyenNhanList(saved.id, dto);
      return this.findOne(saved.id);
    } catch (err) {
      if (BenhDongYExcelService.isUniqueViolation(err)) {
        throw new ConflictException(`Mã code "${entity.code}" đã tồn tại.`);
      }
      throw err;
    }
  }

  /** Đồng bộ nguyên nhân có cấu trúc (xoá cũ → chèn mới theo thứ tự). Chỉ đổi khi body có key. */
  private async applyNguyenNhanList(
    benhId: number,
    dto: CreateBenhDongYExcelDto | UpdateBenhDongYExcelDto,
  ): Promise<void> {
    if (!BenhDongYExcelService.hasKey(dto, 'nguyen_nhan_list')) return;
    await this.repo.query(`DELETE FROM benh_dong_y_excel_nguyen_nhan WHERE id_benh_dong_y_excel = $1`, [benhId]);
    const items = (dto.nguyen_nhan_list ?? []).filter((x) => x && String(x.noi_dung ?? '').trim());
    let ord = 0;
    for (const it of items) {
      await this.repo.query(
        `INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) VALUES ($1, $2, $3, $4)`,
        [benhId, (it.nhom ?? '').trim() || null, String(it.noi_dung).trim(), Number.isFinite(it.thu_tu as number) ? it.thu_tu : ord],
      );
      ord += 1;
    }
  }

  async update(id: number, dto: UpdateBenhDongYExcelDto): Promise<BenhDongYExcel> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: BenhDongYExcelService.RELATIONS,
    });
    if (!entity) {
      throw new NotFoundException(`Không tìm thấy quy tắc id=${id}`);
    }
    if (dto.code !== undefined) entity.code = dto.code.trim();
    if (dto.name !== undefined) entity.name = dto.name.trim();
    if (dto.outputCell !== undefined) entity.outputCell = dto.outputCell.trim();
    if (dto.excelFormula !== undefined) entity.excelFormula = dto.excelFormula;
    if (dto.logicExpression !== undefined) entity.logicExpression = dto.logicExpression;
    if (dto.sqlCaseText !== undefined) entity.sqlCaseText = dto.sqlCaseText;
    if (dto.sqlCaseBoolean !== undefined) entity.sqlCaseBoolean = dto.sqlCaseBoolean;
    if (BenhDongYExcelService.hasKey(dto, 'id_phap_tri_list')) {
      entity.phapTriList = await this.resolvePhapTri(
        BenhDongYExcelService.uniqueIds(dto.id_phap_tri_list),
      );
    }
    if (BenhDongYExcelService.hasKey(dto, 'id_trieu_chung_list')) {
      entity.trieuChungList = await this.resolveTrieuChung(
        BenhDongYExcelService.uniqueIds(dto.id_trieu_chung_list),
      );
    }
    if (BenhDongYExcelService.hasKey(dto, 'id_bai_thuoc_list')) {
      entity.baiThuocList = await this.resolveBaiThuoc(
        BenhDongYExcelService.uniqueIds(dto.id_bai_thuoc_list),
      );
    }
    try {
      await this.repo.save(entity);
      await this.applyNguyenNhanList(id, dto);
      return this.findOne(id);
    } catch (err) {
      if (BenhDongYExcelService.isUniqueViolation(err)) {
        throw new ConflictException(`Mã code "${entity.code}" đã tồn tại.`);
      }
      throw err;
    }
  }

  async remove(id: number): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) {
      throw new NotFoundException(`Không tìm thấy quy tắc id=${id}`);
    }
  }

  private normalizeInput(raw: Record<string, unknown>): InputChiSo {
    const result: InputChiSo = {};

    for (const [key, value] of Object.entries(raw)) {
      if (value === null || value === undefined || value === '') continue;
      if (typeof value === 'number') {
        if (Number.isFinite(value)) result[key.toUpperCase()] = value;
        continue;
      }
      // Giữ chuỗi (vd. B10="+"/"-"/"0"); engine tự coerce chuỗi số khi cần.
      result[key.toUpperCase()] = String(value);
    }

    return result;
  }

  private evaluateRule(logicExpression: string, input: InputChiSo): boolean {
    return evaluateLogicExpression(logicExpression, input);
  }

  async diagnose(rawInput: Record<string, unknown>) {
    const input = this.normalizeInput(rawInput);
    if (!Object.keys(input).length) {
      throw new BadRequestException('Thiếu chỉ số đầu vào hợp lệ.');
    }

    const rules = await this.repo.find({ order: { id: 'ASC' } });
    const matched = rules
      .filter((rule) => this.evaluateRule(rule.logicExpression, input))
      .map((rule) => ({
        id: rule.id,
        code: rule.code,
        name: rule.name,
        outputCell: rule.outputCell,
        logicExpression: rule.logicExpression,
      }));

    return {
      success: true,
      total_rules: rules.length,
      matched_count: matched.length,
      matched,
    };
  }
}
