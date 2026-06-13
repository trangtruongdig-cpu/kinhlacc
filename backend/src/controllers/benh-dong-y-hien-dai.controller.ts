import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { BenhDongYHienDai } from '../models/benh-dong-y-hien-dai.model';
import {
  CreateBenhDongYHienDaiDto,
  InputChiSo,
  UpdateBenhDongYHienDaiDto,
} from '../models/benh-dong-y-hien-dai.dto';
import { evaluateLogicExpression } from '../utils/excel-rule-engine';

@Injectable()
export class BenhDongYHienDaiService {
  constructor(
    @InjectRepository(BenhDongYHienDai)
    private readonly repo: Repository<BenhDongYHienDai>,
  ) {}

  private static isUniqueViolation(err: unknown): boolean {
    return (
      err instanceof QueryFailedError &&
      (err as QueryFailedError & { driverError?: { code?: string } }).driverError?.code === '23505'
    );
  }

  async findAll(): Promise<BenhDongYHienDai[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<BenhDongYHienDai> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Không tìm thấy quy tắc id=${id}`);
    }
    return row;
  }

  async create(dto: CreateBenhDongYHienDaiDto): Promise<BenhDongYHienDai> {
    const required: (keyof CreateBenhDongYHienDaiDto)[] = [
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

    const entity = this.repo.create({
      code: dto.code.trim(),
      name: dto.name.trim(),
      outputCell: dto.outputCell.trim(),
      excelFormula: dto.excelFormula,
      logicExpression: dto.logicExpression,
      sqlCaseText: dto.sqlCaseText,
      sqlCaseBoolean: dto.sqlCaseBoolean,
    });
    try {
      const saved = await this.repo.save(entity);
      return this.findOne(saved.id);
    } catch (err) {
      if (BenhDongYHienDaiService.isUniqueViolation(err)) {
        throw new ConflictException(`Mã code "${entity.code}" đã tồn tại.`);
      }
      throw err;
    }
  }

  async update(id: number, dto: UpdateBenhDongYHienDaiDto): Promise<BenhDongYHienDai> {
    const entity = await this.repo.findOne({ where: { id } });
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
    try {
      await this.repo.save(entity);
      return this.findOne(id);
    } catch (err) {
      if (BenhDongYHienDaiService.isUniqueViolation(err)) {
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
      // Giữ nguyên chuỗi cho các ô dấu (B*/G* = "+"/"-"/"0"); engine sẽ tự
      // coerce chuỗi số ("5", "-1.2") khi cần so sánh số học.
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
