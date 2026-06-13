import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ClinicScheduleConfig } from '../models/clinic-schedule-config.model';
import { ClinicDayOverride } from '../models/clinic-day-override.model';
import { AppointmentSlot } from '../models/appointment-slot.model';
import {
  UpdateClinicScheduleConfigDto,
  UpsertClinicDayOverrideDto,
} from '../models/clinic-schedule.dto';

const CONFIG_ID = 1;
const DEFAULT_CONFIG = {
  openTime: '08:00',
  closeTime: '17:00',
  breakStart: '12:00' as string | null,
  breakEnd: '13:30' as string | null,
  slotDurationMinutes: 45,
};

export interface EffectiveSchedule {
  isClosed: boolean;
  openTime: string;
  closeTime: string;
  breakStart: string | null;
  breakEnd: string | null;
  slotDurationMinutes: number;
}

// "HH:mm" hoặc "HH:mm:ss" → phút từ 00:00
function toMinutes(t: string): number {
  const [h, m] = t.split(':').map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

function toTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function normalizeTime(t: string | null | undefined): string | null {
  if (!t) return null;
  // "08:00:00" → "08:00"
  return t.slice(0, 5);
}

@Injectable()
export class ClinicScheduleService {
  constructor(
    @InjectRepository(ClinicScheduleConfig)
    private readonly configRepo: Repository<ClinicScheduleConfig>,
    @InjectRepository(ClinicDayOverride)
    private readonly overrideRepo: Repository<ClinicDayOverride>,
    @InjectRepository(AppointmentSlot)
    private readonly slotRepo: Repository<AppointmentSlot>,
  ) {}

  async getConfig(): Promise<ClinicScheduleConfig> {
    let cfg = await this.configRepo.findOneBy({ id: CONFIG_ID });
    if (!cfg) {
      cfg = this.configRepo.create({ id: CONFIG_ID, ...DEFAULT_CONFIG });
      cfg = await this.configRepo.save(cfg);
    }
    return this.normalizeConfig(cfg);
  }

  async updateConfig(
    dto: UpdateClinicScheduleConfigDto,
  ): Promise<ClinicScheduleConfig> {
    const cfg = await this.getConfig();
    Object.assign(cfg, dto);
    this.validateWindow(
      cfg.openTime,
      cfg.closeTime,
      cfg.breakStart,
      cfg.breakEnd,
    );
    if (cfg.slotDurationMinutes <= 0) {
      throw new BadRequestException('slotDurationMinutes phải > 0');
    }
    const saved = await this.configRepo.save(cfg);
    return this.normalizeConfig(saved);
  }

  async listOverrides(from?: string, to?: string): Promise<ClinicDayOverride[]> {
    const qb = this.overrideRepo
      .createQueryBuilder('o')
      .orderBy('o.date', 'ASC');
    if (from) qb.andWhere('o.date >= :from', { from });
    if (to) qb.andWhere('o.date <= :to', { to });
    const rows = await qb.getMany();
    return rows.map((r) => this.normalizeOverride(r));
  }

  async getOverride(date: string): Promise<ClinicDayOverride | null> {
    const row = await this.overrideRepo.findOneBy({ date });
    return row ? this.normalizeOverride(row) : null;
  }

  async upsertOverride(
    date: string,
    dto: UpsertClinicDayOverrideDto,
  ): Promise<ClinicDayOverride> {
    let row = await this.overrideRepo.findOneBy({ date });
    if (!row) {
      row = this.overrideRepo.create({ date, isClosed: false });
    }
    Object.assign(row, dto);
    if (!row.isClosed) {
      // chỉ validate nếu có cả open + close (override partial là hợp lệ)
      const cfg = await this.getConfig();
      const openT = normalizeTime(row.openTime) ?? cfg.openTime;
      const closeT = normalizeTime(row.closeTime) ?? cfg.closeTime;
      const bStart = normalizeTime(row.breakStart);
      const bEnd = normalizeTime(row.breakEnd);
      this.validateWindow(openT, closeT, bStart, bEnd);
    }
    const saved = await this.overrideRepo.save(row);
    return this.normalizeOverride(saved);
  }

  async deleteOverride(date: string): Promise<void> {
    await this.overrideRepo.delete({ date });
  }

  async getEffectiveSchedule(date: string): Promise<EffectiveSchedule> {
    const cfg = await this.getConfig();
    const override = await this.getOverride(date);
    if (override?.isClosed) {
      return {
        isClosed: true,
        openTime: cfg.openTime,
        closeTime: cfg.closeTime,
        breakStart: cfg.breakStart,
        breakEnd: cfg.breakEnd,
        slotDurationMinutes: cfg.slotDurationMinutes,
      };
    }
    return {
      isClosed: false,
      openTime: normalizeTime(override?.openTime) ?? cfg.openTime,
      closeTime: normalizeTime(override?.closeTime) ?? cfg.closeTime,
      breakStart:
        override?.breakStart !== undefined
          ? normalizeTime(override.breakStart)
          : cfg.breakStart,
      breakEnd:
        override?.breakEnd !== undefined
          ? normalizeTime(override.breakEnd)
          : cfg.breakEnd,
      slotDurationMinutes: cfg.slotDurationMinutes,
    };
  }

  computeSlotTimes(schedule: EffectiveSchedule): string[] {
    if (schedule.isClosed) return [];
    const open = toMinutes(schedule.openTime);
    const close = toMinutes(schedule.closeTime);
    const dur = schedule.slotDurationMinutes;
    const breakStart = schedule.breakStart ? toMinutes(schedule.breakStart) : null;
    const breakEnd = schedule.breakEnd ? toMinutes(schedule.breakEnd) : null;
    const times: string[] = [];
    for (let t = open; t + dur <= close; t += dur) {
      if (breakStart !== null && breakEnd !== null) {
        // skip slot nếu giao với khoảng nghỉ
        const slotEnd = t + dur;
        if (slotEnd > breakStart && t < breakEnd) continue;
      }
      times.push(toTimeString(t));
    }
    return times;
  }

  async generateSlotsForDate(
    date: string,
    reconcile = false,
  ): Promise<{ created: number; skipped: number; closed: number; total: number }> {
    const schedule = await this.getEffectiveSchedule(date);
    const expectedTimes = this.computeSlotTimes(schedule);

    const existing = await this.slotRepo.find({ where: { slotDate: date } });
    const existingMap = new Map<string, AppointmentSlot>();
    for (const s of existing) {
      existingMap.set(normalizeTime(s.slotTime) ?? s.slotTime, s);
    }

    const toCreate: Partial<AppointmentSlot>[] = [];
    let skipped = 0;
    for (const time of expectedTimes) {
      if (existingMap.has(time)) {
        skipped++;
      } else {
        toCreate.push({ slotDate: date, slotTime: time, status: 'OPEN' });
      }
    }
    if (toCreate.length > 0) {
      await this.slotRepo.save(this.slotRepo.create(toCreate));
    }

    let closed = 0;
    if (reconcile) {
      const expectedSet = new Set(expectedTimes);
      const orphans = existing.filter(
        (s) =>
          s.status === 'OPEN' &&
          !expectedSet.has(normalizeTime(s.slotTime) ?? s.slotTime),
      );
      if (orphans.length > 0) {
        await this.slotRepo.update(
          { id: In(orphans.map((o) => o.id)) },
          { status: 'CLOSED' },
        );
        closed = orphans.length;
      }
    }

    return {
      created: toCreate.length,
      skipped,
      closed,
      total: expectedTimes.length,
    };
  }

  async generateSlotsForRange(
    from: string,
    to: string,
    reconcile = false,
  ): Promise<{ date: string; created: number; total: number }[]> {
    const start = new Date(from);
    const end = new Date(to);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Ngày không hợp lệ');
    }
    if (end < start) {
      throw new BadRequestException('to phải >= from');
    }
    const results: { date: string; created: number; total: number }[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const ymd = cur.toISOString().slice(0, 10);
      const r = await this.generateSlotsForDate(ymd, reconcile);
      results.push({ date: ymd, created: r.created, total: r.total });
      cur.setDate(cur.getDate() + 1);
    }
    return results;
  }

  private validateWindow(
    openTime: string,
    closeTime: string,
    breakStart: string | null | undefined,
    breakEnd: string | null | undefined,
  ): void {
    const o = toMinutes(openTime);
    const c = toMinutes(closeTime);
    if (c <= o) {
      throw new BadRequestException('closeTime phải sau openTime');
    }
    if (breakStart && breakEnd) {
      const bs = toMinutes(breakStart);
      const be = toMinutes(breakEnd);
      if (be <= bs) {
        throw new BadRequestException('breakEnd phải sau breakStart');
      }
      if (bs < o || be > c) {
        throw new BadRequestException(
          'Khoảng nghỉ phải nằm trong khung giờ mở/đóng cửa',
        );
      }
    } else if (Boolean(breakStart) !== Boolean(breakEnd)) {
      throw new BadRequestException(
        'breakStart và breakEnd phải cùng có hoặc cùng trống',
      );
    }
  }

  private normalizeConfig(cfg: ClinicScheduleConfig): ClinicScheduleConfig {
    cfg.openTime = normalizeTime(cfg.openTime) ?? cfg.openTime;
    cfg.closeTime = normalizeTime(cfg.closeTime) ?? cfg.closeTime;
    cfg.breakStart = normalizeTime(cfg.breakStart);
    cfg.breakEnd = normalizeTime(cfg.breakEnd);
    return cfg;
  }

  private normalizeOverride(o: ClinicDayOverride): ClinicDayOverride {
    o.openTime = normalizeTime(o.openTime);
    o.closeTime = normalizeTime(o.closeTime);
    o.breakStart = normalizeTime(o.breakStart);
    o.breakEnd = normalizeTime(o.breakEnd);
    return o;
  }
}
