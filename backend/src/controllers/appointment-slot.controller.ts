import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  AppointmentSlot,
  AppointmentSlotStatus,
} from '../models/appointment-slot.model';
import {
  BookSlotDto,
  UpdateSlotDto,
} from '../models/appointment-slot.dto';
import { FirebaseService } from './firebase.controller';
import { PatientsService } from './patient.controller';

export interface PaginatedSlots {
  data: AppointmentSlot[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AppointmentSlotsService {
  constructor(
    @InjectRepository(AppointmentSlot)
    private readonly slotRepo: Repository<AppointmentSlot>,
    private readonly firebaseService: FirebaseService,
    private readonly patientsService: PatientsService,
  ) {}

  async findByDate(date: string): Promise<AppointmentSlot[]> {
    return this.slotRepo.find({
      where: { slotDate: date },
      order: { slotTime: 'ASC' },
    });
  }

  async findByRange(from: string, to: string): Promise<AppointmentSlot[]> {
    return this.slotRepo.find({
      where: { slotDate: Between(from, to) },
      order: { slotDate: 'ASC', slotTime: 'ASC' },
    });
  }

  async findMy(patientId: number): Promise<AppointmentSlot[]> {
    return this.slotRepo.find({
      where: { patientId },
      order: { slotDate: 'DESC', slotTime: 'DESC' },
    });
  }

  // Admin: lấy toàn bộ vé của 1 bệnh nhân bất kỳ (mới nhất trước).
  // Dùng cho hồ sơ bệnh nhân để đếm số buổi trị liệu + liệt kê lịch sử.
  async findByPatient(patientId: number): Promise<AppointmentSlot[]> {
    return this.slotRepo.find({
      where: { patientId },
      order: { slotDate: 'DESC', slotTime: 'DESC' },
    });
  }

  async findOne(id: number): Promise<AppointmentSlot> {
    const slot = await this.slotRepo.findOneBy({ id });
    if (!slot) throw new NotFoundException(`Vé #${id} không tồn tại`);
    return slot;
  }

  async update(id: number, dto: UpdateSlotDto): Promise<AppointmentSlot> {
    const slot = await this.findOne(id);
    if (dto.reason !== undefined) slot.reason = dto.reason;
    if (dto.notes !== undefined) slot.notes = dto.notes;
    return this.slotRepo.save(slot);
  }

  async close(id: number): Promise<AppointmentSlot> {
    const slot = await this.findOne(id);
    if (slot.status === 'BOOKED') {
      throw new ConflictException(
        'Vé này đã có bệnh nhân đặt, huỷ trước khi đóng',
      );
    }
    if (slot.status === 'COMPLETED') {
      throw new ConflictException('Vé đã hoàn thành, không thể đóng');
    }
    slot.status = 'CLOSED';
    return this.slotRepo.save(slot);
  }

  async open(id: number): Promise<AppointmentSlot> {
    const slot = await this.findOne(id);
    if (slot.status !== 'CLOSED' && slot.status !== 'CANCELLED') {
      throw new ConflictException(
        `Không thể mở lại vé đang ở trạng thái ${slot.status}`,
      );
    }
    slot.status = 'OPEN';
    slot.patientId = null;
    slot.reason = null;
    return this.slotRepo.save(slot);
  }

  async book(id: number, dto: BookSlotDto): Promise<AppointmentSlot> {
    if (!dto.patientId) {
      throw new BadRequestException('Thiếu patientId');
    }
    const slot = await this.findOne(id);
    if (slot.status !== 'OPEN') {
      throw new ConflictException(
        `Vé không khả dụng (trạng thái: ${slot.status})`,
      );
    }
    // verify patient exists — sẽ throw NotFoundException nếu không có
    await this.patientsService.findOne(dto.patientId);

    slot.patientId = dto.patientId;
    slot.reason = dto.reason ?? null;
    slot.notes = dto.notes ?? null;
    slot.status = 'BOOKED';
    const saved = await this.slotRepo.save(slot);
    await this.notifyStatusChange(saved);
    return saved;
  }

  async cancel(id: number): Promise<AppointmentSlot> {
    const slot = await this.findOne(id);
    if (slot.status !== 'BOOKED') {
      throw new ConflictException(
        `Chỉ có thể huỷ vé đang BOOKED (hiện: ${slot.status})`,
      );
    }
    slot.status = 'CANCELLED';
    const saved = await this.slotRepo.save(slot);
    await this.notifyStatusChange(saved);
    return saved;
  }

  async cancelMy(id: number, patientId: number): Promise<AppointmentSlot> {
    const slot = await this.findOne(id);
    if (slot.patientId !== patientId) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên vé này');
    }
    return this.cancel(id);
  }

  async complete(id: number): Promise<AppointmentSlot> {
    const slot = await this.findOne(id);
    if (slot.status !== 'BOOKED') {
      throw new ConflictException(
        `Chỉ có thể hoàn thành vé đang BOOKED (hiện: ${slot.status})`,
      );
    }
    slot.status = 'COMPLETED';
    const saved = await this.slotRepo.save(slot);
    await this.notifyStatusChange(saved);
    return saved;
  }

  async remove(id: number): Promise<void> {
    const slot = await this.findOne(id);
    if (slot.status === 'BOOKED' || slot.status === 'COMPLETED') {
      throw new ConflictException(
        'Không thể xoá vé đang có booking, huỷ trước',
      );
    }
    await this.slotRepo.remove(slot);
  }

  async bookMy(
    id: number,
    patientId: number,
    dto: BookSlotDto,
  ): Promise<AppointmentSlot> {
    return this.book(id, { ...dto, patientId });
  }

  async summaryByDate(
    from: string,
    to: string,
  ): Promise<Record<string, Record<AppointmentSlotStatus, number>>> {
    const rows = await this.slotRepo
      .createQueryBuilder('s')
      .select('s.slotDate', 'date')
      .addSelect('s.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('s.slotDate BETWEEN :from AND :to', { from, to })
      .groupBy('s.slotDate')
      .addGroupBy('s.status')
      .getRawMany<{ date: string; status: AppointmentSlotStatus; count: string }>();

    const out: Record<string, Record<AppointmentSlotStatus, number>> = {};
    for (const r of rows) {
      // pg parse `date` thành JS Date local midnight. Dùng getFullYear/Month/Date
      // để lấy đúng wall-clock day, tránh lệch khi qua toISOString() (UTC).
      let date: string;
      if (typeof r.date === 'string') {
        date = r.date;
      } else {
        const d = r.date as Date;
        date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      if (!out[date]) {
        out[date] = {
          OPEN: 0,
          CLOSED: 0,
          BOOKED: 0,
          COMPLETED: 0,
          CANCELLED: 0,
        };
      }
      out[date][r.status] = parseInt(r.count, 10);
    }
    return out;
  }

  private async notifyStatusChange(slot: AppointmentSlot) {
    if (!slot.patientId) return;
    try {
      const patient = await this.patientsService.findOne(slot.patientId);
      if (patient?.fcmToken) {
        const title = 'Cập nhật lịch hẹn';
        const body = `Lịch hẹn ngày ${slot.slotDate} lúc ${slot.slotTime} của bạn đã chuyển sang: ${this.getStatusText(slot.status)}`;
        await this.firebaseService.sendNotification(patient.fcmToken, title, body, {
          slotId: slot.id.toString(),
          type: 'APPOINTMENT_UPDATE',
        });
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  private getStatusText(status: AppointmentSlotStatus): string {
    switch (status) {
      case 'OPEN':
        return 'Đang mở';
      case 'CLOSED':
        return 'Đã đóng';
      case 'BOOKED':
        return 'Đã đặt';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'CANCELLED':
        return 'Đã huỷ';
      default:
        return status;
    }
  }
}
