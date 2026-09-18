import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, DataSource } from 'typeorm';
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
import { SseService, toPublicSlot, PublicSlotView } from './sse.service';

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
    private readonly sseService: SseService,
    private readonly dataSource: DataSource,
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

  /**
   * Bảng giờ trong ngày cho BỆNH NHÂN tự đặt lịch.
   *
   * Trả về tất cả ca trong ngày để lưới giờ không bị khuyết, nhưng CHỈ gồm trường công khai
   * (giờ + trạng thái trống/đã đặt/đã đóng). Tuyệt đối không kèm patientId / reason / notes:
   * endpoint này bất kỳ tài khoản bệnh nhân nào cũng gọi được, kèm vào là bệnh nhân A đọc
   * được lý do đi khám của bệnh nhân B.
   */
  async findAvailable(date: string): Promise<PublicSlotView[]> {
    const slots = await this.slotRepo.find({
      where: { slotDate: date },
      order: { slotTime: 'ASC' },
      select: ['id', 'slotDate', 'slotTime', 'status'],
    });
    return slots.map(toPublicSlot);
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
    const saved = await this.slotRepo.save(slot);
    this.sseService.emitEvent({ type: 'SLOT_UPDATED', slot: toPublicSlot(saved) });
    return saved;
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
    const saved = await this.slotRepo.save(slot);
    this.sseService.emitEvent({ type: 'SLOT_UPDATED', slot: toPublicSlot(saved) });
    return saved;
  }

  async book(id: number, dto: BookSlotDto): Promise<AppointmentSlot> {
    if (!dto.patientId) {
      throw new BadRequestException('Thiếu patientId');
    }
    // verify patient exists
    const patient = await this.patientsService.findOne(dto.patientId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedSlot: AppointmentSlot;
    try {
      // Dùng pessimistic_write để lock dòng vé (Chống Race Condition - Trùng vé)
      const slot = await queryRunner.manager.findOne(AppointmentSlot, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!slot) {
        throw new NotFoundException(`Vé #${id} không tồn tại`);
      }

      if (slot.status !== 'OPEN' && slot.status !== 'CANCELLED') {
        throw new ConflictException(
          `Vé không khả dụng (trạng thái: ${slot.status})`,
        );
      }

      slot.patientId = dto.patientId;
      slot.reason = dto.reason ?? null;
      slot.notes = dto.notes ?? null;
      slot.status = 'BOOKED';

      savedSlot = await queryRunner.manager.save(slot);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // Từ đây trở xuống vé ĐÃ ghi thành công. Mọi việc phụ (đẩy thông báo, bắn SSE) phải nằm
    // NGOÀI khối try/catch của transaction: nếu để bên trong, một lỗi Firebase sẽ kích hoạt
    // rollbackTransaction() trên transaction đã commit → ném TransactionNotStartedError, đè mất
    // lỗi thật và báo cho bệnh nhân là đặt lịch hỏng trong khi vé đã đặt xong.
    const saved = savedSlot;
    try {
      // notifyStatusChange hiện đã tự nuốt lỗi bên trong; bọc thêm ở đây để nếu sau này ai đó
      // bỏ khối catch đó đi thì việc đặt lịch vẫn không bị báo hỏng oan.
      await this.notifyStatusChange(saved);
    } catch (err) {
      console.error(`Không gửi được thông báo cho vé #${saved.id}:`, err);
    }

    const patientName = patient?.fullName || 'Khách hàng';
    this.sseService.emitEvent({
      type: 'NEW_BOOKING',
      slot: toPublicSlot(saved),
      // Câu có họ tên → chỉ nhân viên nhận (SseController lọc theo vai trò).
      staffMessage: `${patientName} vừa đặt lịch vào lúc ${saved.slotTime} ngày ${saved.slotDate}`,
    });

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
    this.sseService.emitEvent({ type: 'SLOT_UPDATED', slot: toPublicSlot(saved) });
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
    this.sseService.emitEvent({ type: 'SLOT_UPDATED', slot: toPublicSlot(saved) });
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
