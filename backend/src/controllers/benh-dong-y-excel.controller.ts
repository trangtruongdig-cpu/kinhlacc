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

@Injectable()
export class BenhDongYExcelService {
  private static readonly RELATIONS = {
    phapTriList: true,
    trieuChungList: true,
    baiThuocList: true,
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
      return this.findOne(saved.id);
    } catch (err) {
      if (BenhDongYExcelService.isUniqueViolation(err)) {
        throw new ConflictException(`Mã code "${entity.code}" đã tồn tại.`);
      }
      throw err;
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
