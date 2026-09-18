import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, DataSource, EntityManager } from 'typeorm';
import {
  AppointmentSlot,
  AppointmentSlotStatus,
} from '../models/appointment-slot.model';
import {
  AppointmentBooking,
  AppointmentBookingStatus,
} from '../models/appointment-booking.model';
import { BookSlotDto, UpdateSlotDto } from '../models/appointment-slot.dto';
import { FirebaseService } from './firebase.controller';
import { PatientsService } from './patient.controller';
import { SseService, toPublicSlot, PublicSlotView } from './sse.service';
import { ClinicScheduleService } from './clinic-schedule.controller';
import { buildIcsCalendar, IcsEvent, IcsAlarm } from './ics.util';
import { randomBytes, timingSafeEqual } from 'crypto';

/**
 * So khớp khoá theo thời gian HẰNG ĐỊNH.
 *
 * `===` trên chuỗi thoát ra ngay ở byte đầu khác nhau, nên thời gian phản hồi rò rỉ từng byte
 * của khoá đúng. Khoá này lại nằm ở endpoint công khai, đoán được là đọc trọn lịch hẹn.
 */
function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  // timingSafeEqual ném lỗi nếu khác độ dài — so độ dài trước (độ dài không phải bí mật).
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export interface PaginatedSlots {
  data: AppointmentSlot[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Một LƯỢT ĐẶT như frontend nhìn thấy.
 *
 * `id` là id lượt đặt (khoá duy nhất để render — một ô giờ có thể được đặt nhiều lần nên
 * dùng id ô giờ làm khoá sẽ trùng). Muốn thao tác lên ô giờ (huỷ) thì dùng `slotId`.
 */
export interface PatientBookingView {
  id: number;
  slotId: number;
  slotDate: string;
  slotTime: string;
  status: AppointmentBookingStatus;
  patientId: number;
  reason: string | null;
  notes: string | null;
  cancelledBy: 'PATIENT' | 'STAFF' | null;
  cancelledAt: Date | null;
  createdAt: Date;
}

/**
 * Nhắc trước giờ trị liệu: 1 tiếng, 30 phút, 15 phút.
 *
 * Cùng bộ mốc với cron nhắc hẹn (appointment-reminder.service.ts) để khách nhận nhắc như nhau
 * dù họ theo dõi bằng ứng dụng của phòng chẩn trị hay bằng lịch/báo thức trên điện thoại.
 */
/** Giữ lượt đã huỷ trong feed bao nhiêu ngày để lệnh huỷ chắc chắn tới được máy khách. */
const ICS_CANCELLED_KEEP_DAYS = 30;

const REMINDER_ALARMS: IcsAlarm[] = [
  {
    minutesBefore: 60,
    description: 'Còn 1 tiếng nữa tới giờ trị liệu — Kinh Lạc Gia Minh',
  },
  {
    minutesBefore: 30,
    description: 'Còn 30 phút nữa tới giờ trị liệu — Kinh Lạc Gia Minh',
  },
  {
    minutesBefore: 15,
    description: 'Còn 15 phút nữa tới giờ trị liệu — Kinh Lạc Gia Minh',
  },
];

function toBookingView(b: AppointmentBooking): PatientBookingView {
  return {
    id: b.id,
    slotId: b.slotId,
    slotDate: b.slotDate,
    slotTime: b.slotTime,
    status: b.status,
    patientId: b.patientId,
    reason: b.reason,
    notes: b.notes,
    cancelledBy: b.cancelledBy,
    cancelledAt: b.cancelledAt,
    createdAt: b.createdAt,
  };
}

@Injectable()
export class AppointmentSlotsService {
  constructor(
    @InjectRepository(AppointmentSlot)
    private readonly slotRepo: Repository<AppointmentSlot>,
    @InjectRepository(AppointmentBooking)
    private readonly bookingRepo: Repository<AppointmentBooking>,
    private readonly firebaseService: FirebaseService,
    private readonly patientsService: PatientsService,
    private readonly sseService: SseService,
    private readonly clinicScheduleService: ClinicScheduleService,
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

  /**
   * Lịch sử của BỆNH NHÂN — đọc ở bảng lượt đặt, KHÔNG đọc ở ô giờ.
   *
   * Ô giờ bị dùng lại (người sau đặt vào ô người trước đã huỷ) nên lọc theo
   * `appointment_slots.patientId` sẽ làm lượt đặt cũ biến mất khỏi lịch sử.
   */
  async findMy(patientId: number): Promise<PatientBookingView[]> {
    const rows = await this.bookingRepo.find({
      where: { patientId },
      order: { slotDate: 'DESC', slotTime: 'DESC' },
    });
    return rows.map(toBookingView);
  }

  /**
   * Lượt đặt của MỘT NGÀY — cho bảng ngày của nhân viên.
   *
   * Ô giờ nay luôn về OPEN sau khi huỷ, nên nhìn ô giờ không còn biết nó từng bị huỷ hay chưa.
   * Dấu "⟲ từng huỷ" trên bảng ngày đọc từ đây. Chỉ nhân viên gọi được (có patientId/reason).
   */
  async findBookingsByDate(date: string): Promise<PatientBookingView[]> {
    const rows = await this.bookingRepo.find({
      where: { slotDate: date },
      order: { slotTime: 'ASC', createdAt: 'ASC' },
    });
    return rows.map(toBookingView);
  }

  // Admin: toàn bộ lượt đặt của 1 bệnh nhân (mới nhất trước).
  // Dùng cho hồ sơ bệnh nhân để đếm số buổi trị liệu + liệt kê lịch sử.
  async findByPatient(patientId: number): Promise<PatientBookingView[]> {
    return this.findMy(patientId);
  }

  /**
   * Bảng giờ trong ngày cho BỆNH NHÂN tự đặt lịch.
   *
   * Trả về tất cả ca trong ngày để lưới giờ không bị khuyết, nhưng CHỈ gồm trường công khai
   * (giờ + trạng thái trống/đã đặt/đã đóng). Tuyệt đối không kèm patientId / reason / notes:
   * endpoint này bất kỳ tài khoản bệnh nhân nào cũng gọi được, kèm vào là bệnh nhân A đọc
   * được lý do đến của bệnh nhân B.
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

  /** Lượt đặt đang còn hiệu lực của một ô giờ (nhiều nhất 1 — có unique index chặn ở DB). */
  private activeBooking(
    manager: EntityManager,
    slotId: number,
  ): Promise<AppointmentBooking | null> {
    return manager.findOne(AppointmentBooking, {
      where: { slotId, status: 'BOOKED' },
    });
  }

  async update(id: number, dto: UpdateSlotDto): Promise<AppointmentSlot> {
    const slot = await this.findOne(id);
    if (dto.reason !== undefined) slot.reason = dto.reason;
    if (dto.notes !== undefined) slot.notes = dto.notes;
    const saved = await this.slotRepo.save(slot);

    // Ghi cùng nội dung sang lượt đặt để lịch sử không lệch với ô giờ.
    const booking = await this.activeBooking(this.slotRepo.manager, id);
    if (booking) {
      if (dto.reason !== undefined) booking.reason = dto.reason;
      if (dto.notes !== undefined) booking.notes = dto.notes;
      await this.bookingRepo.save(booking);
    }
    this.sseService.emitEvent({
      type: 'SLOT_UPDATED',
      slot: toPublicSlot(saved),
      staffSlot: saved,
    });
    return saved;
  }

  /**
   * Chạy một thao tác đổi trạng thái ô giờ TRONG transaction có khoá dòng.
   *
   * Đọc-rồi-ghi mà không khoá thì hai nhân viên bấm cùng lúc (hoặc nhân viên bấm Đóng đúng
   * lúc bệnh nhân bấm Đặt) sẽ đè lên nhau: cả hai đọc cùng một bản cũ, người ghi sau thắng,
   * và kiểm tra trạng thái ở giữa trở thành vô nghĩa.
   */
  private async withLockedSlot<T>(
    id: number,
    fn: (slot: AppointmentSlot, manager: EntityManager) => Promise<T> | T,
  ): Promise<{ slot: AppointmentSlot; result: T }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const slot = await queryRunner.manager.findOne(AppointmentSlot, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!slot) throw new NotFoundException(`Vé #${id} không tồn tại`);

      const result = await fn(slot, queryRunner.manager);
      const saved = await queryRunner.manager.save(slot);
      await queryRunner.commitTransaction();
      return { slot: saved, result };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async close(id: number): Promise<AppointmentSlot> {
    const { slot: saved } = await this.withLockedSlot(id, (slot) => {
      if (slot.status === 'BOOKED') {
        throw new ConflictException(
          'Vé này đã có bệnh nhân đặt, huỷ trước khi đóng',
        );
      }
      if (slot.status === 'COMPLETED') {
        throw new ConflictException('Vé đã hoàn thành, không thể đóng');
      }
      slot.status = 'CLOSED';
    });
    this.sseService.emitEvent({
      type: 'SLOT_UPDATED',
      slot: toPublicSlot(saved),
      staffSlot: saved,
    });
    return saved;
  }

  async open(id: number): Promise<AppointmentSlot> {
    const { slot: saved } = await this.withLockedSlot(
      id,
      async (slot, manager) => {
        // 'CANCELLED' chỉ còn gặp ở dữ liệu CŨ (huỷ nay trả ô giờ thẳng về OPEN) — vẫn nhận
        // để nhân viên có lối thoát cho những vé tồn từ trước migration.
        if (slot.status !== 'CLOSED' && slot.status !== 'CANCELLED') {
          throw new ConflictException(
            `Không thể mở lại vé đang ở trạng thái ${slot.status}`,
          );
        }
        // Phòng xa: vé cũ có thể còn lượt đặt treo. Đóng nó lại rồi mới mở ô giờ, không thì
        // unique index chặn lượt đặt mới và không ai đặt được ô này nữa.
        const booking = await this.activeBooking(manager, id);
        if (booking) {
          booking.status = 'CANCELLED';
          booking.cancelledBy = 'STAFF';
          booking.cancelledAt = new Date();
          await manager.save(booking);
        }
        slot.status = 'OPEN';
        slot.patientId = null;
        slot.reason = null;
        // `notes` TRƯỚC ĐÂY KHÔNG được xoá ở đây → ghi chú riêng của bệnh nhân trước còn dính
        // nguyên trên ô giờ và lộ sang lượt đặt của người sau. Nội dung cũ đã lưu ở lượt đặt rồi.
        slot.notes = null;
        slot.reminded1h = false;
        slot.reminded30m = false;
        slot.reminded15m = false;
      },
    );
    this.sseService.emitEvent({
      type: 'SLOT_UPDATED',
      slot: toPublicSlot(saved),
      staffSlot: saved,
    });
    return saved;
  }

  async book(
    id: number,
    dto: BookSlotDto,
  ): Promise<{ slot: AppointmentSlot; booking: PatientBookingView }> {
    if (!dto.patientId) {
      throw new BadRequestException('Thiếu patientId');
    }
    // verify patient exists
    const patient = await this.patientsService.findOne(dto.patientId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedSlot: AppointmentSlot;
    let savedBooking: AppointmentBooking;
    try {
      // Dùng pessimistic_write để lock dòng vé (Chống Race Condition - Trùng vé)
      const slot = await queryRunner.manager.findOne(AppointmentSlot, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!slot) {
        throw new NotFoundException(`Vé #${id} không tồn tại`);
      }

      // CHỈ nhận OPEN. Trước đây nhận cả 'CANCELLED', mà ô giờ CANCELLED vẫn còn giữ
      // patientId của người huỷ → đặt đè lên là xoá sổ lượt đặt của họ. Nay huỷ đã trả ô giờ
      // về OPEN và dọn sạch, nên không còn lý do gì để nhận CANCELLED nữa.
      if (slot.status !== 'OPEN') {
        throw new ConflictException(
          `Vé không khả dụng (trạng thái: ${slot.status})`,
        );
      }

      slot.patientId = dto.patientId;
      slot.reason = dto.reason ?? null;
      slot.notes = dto.notes ?? null;
      slot.status = 'BOOKED';
      // Ô giờ được bán lại → cờ nhắc hẹn của lượt trước phải reset, không thì
      // bệnh nhân mới mất luôn tin nhắn nhắc giờ.
      slot.reminded1h = false;
      slot.reminded30m = false;
      slot.reminded15m = false;

      savedSlot = await queryRunner.manager.save(slot);

      // Mở một LƯỢT ĐẶT mới. Unique index `ux_appt_booking_active` chặn ở tầng DB nếu ô giờ
      // này đã có lượt đặt còn hiệu lực → an toàn cả khi chạy nhiều tiến trình backend.
      const booking = queryRunner.manager.create(AppointmentBooking, {
        slotId: slot.id,
        patientId: dto.patientId,
        slotDate: slot.slotDate,
        slotTime: slot.slotTime,
        status: 'BOOKED' as AppointmentBookingStatus,
        reason: dto.reason ?? null,
        notes: dto.notes ?? null,
        cancelledBy: null,
        cancelledAt: null,
      });
      savedBooking = await queryRunner.manager.save(booking);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if ((err as { code?: string }).code === '23505') {
        throw new ConflictException(
          'Vé vừa có người khác đặt mất, mời chọn giờ khác',
        );
      }
      throw err;
    } finally {
      await queryRunner.release();
    }

    const saved = savedSlot;

    // Bắn SSE NGAY, TRƯỚC khi gọi Firebase. Trước đây thứ tự ngược lại: `await notifyStatusChange`
    // (lần đầu phải nạp firebase-admin ~45MB) chặn cả broadcast realtime lẫn phản hồi HTTP.
    this.sseService.emitEvent({
      type: 'NEW_BOOKING',
      slot: toPublicSlot(saved),
      staffSlot: saved,
      // Câu có họ tên → chỉ nhân viên nhận (SseController lọc theo vai trò).
      staffMessage: `${patient?.fullName || 'Khách hàng'} vừa đặt lịch vào lúc ${saved.slotTime} ngày ${saved.slotDate}`,
    });

    // Thông báo đẩy chạy NỀN — không ai phải chờ nó, và lỗi của nó không được làm
    // việc đặt lịch báo hỏng oan (vé đã ghi thành công từ trước khối này).
    this.notifyPatient(
      dto.patientId,
      saved.slotDate,
      saved.slotTime,
      saved.id,
      'BOOKED',
    );

    return { slot: saved, booking: toBookingView(savedBooking) };
  }

  /**
   * Huỷ một lượt đặt.
   *
   * Ô giờ được TRẢ VỀ TRỐNG (không còn mang dấu vết bệnh nhân), lượt đặt được đánh dấu
   * CANCELLED và ở lại vĩnh viễn trong lịch sử. Trước đây ô giờ giữ nguyên patientId ở trạng thái
   * CANCELLED, rồi người sau đặt vào chính ô đó là ghi đè mất lượt đặt cũ.
   */
  async cancel(
    id: number,
    by: 'PATIENT' | 'STAFF' = 'STAFF',
  ): Promise<{ slot: AppointmentSlot; booking: PatientBookingView | null }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedSlot: AppointmentSlot;
    let savedBooking: AppointmentBooking | null = null;
    try {
      const slot = await queryRunner.manager.findOne(AppointmentSlot, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!slot) throw new NotFoundException(`Vé #${id} không tồn tại`);
      if (slot.status !== 'BOOKED') {
        throw new ConflictException(
          `Chỉ có thể huỷ vé đang BOOKED (hiện: ${slot.status})`,
        );
      }

      const booking = await this.activeBooking(queryRunner.manager, id);
      if (booking) {
        booking.status = 'CANCELLED';
        booking.cancelledBy = by;
        booking.cancelledAt = new Date();
        savedBooking = await queryRunner.manager.save(booking);
      }

      // LUÔN về OPEN, kể cả ngày đã qua. 'CANCELLED' là chuyện của LƯỢT ĐẶT, không phải của
      // ô giờ — dán nhãn đó lên ô giờ chính là thứ đẻ ra nút "Mở lại" thủ công, và là đường đi
      // đã làm mất lịch sử. Ai huỷ / lúc nào nay đọc ở appointment_bookings.
      slot.status = 'OPEN';
      slot.patientId = null;
      slot.reason = null;
      slot.notes = null;
      slot.reminded1h = false;
      slot.reminded30m = false;
      slot.reminded15m = false;
      savedSlot = await queryRunner.manager.save(slot);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    this.sseService.emitEvent({
      type: 'SLOT_UPDATED',
      slot: toPublicSlot(savedSlot),
      staffSlot: savedSlot,
    });

    if (savedBooking) {
      this.notifyPatient(
        savedBooking.patientId,
        savedBooking.slotDate,
        savedBooking.slotTime,
        savedSlot.id,
        'CANCELLED',
      );
    }

    return {
      slot: savedSlot,
      booking: savedBooking ? toBookingView(savedBooking) : null,
    };
  }

  async cancelMy(
    id: number,
    patientId: number,
  ): Promise<{ slot: AppointmentSlot; booking: PatientBookingView }> {
    // Kiểm quyền trên LƯỢT ĐẶT còn hiệu lực (nguồn sự thật), không dựa vào ô giờ.
    const booking = await this.activeBooking(this.slotRepo.manager, id);
    if (!booking || booking.patientId !== patientId) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên vé này');
    }
    const res = await this.cancel(id, 'PATIENT');
    if (!res.booking) {
      throw new NotFoundException('Không tìm thấy lượt đặt để huỷ');
    }
    return { slot: res.slot, booking: res.booking };
  }

  async complete(id: number): Promise<AppointmentSlot> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedSlot: AppointmentSlot;
    let savedBooking: AppointmentBooking | null = null;
    try {
      const slot = await queryRunner.manager.findOne(AppointmentSlot, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!slot) throw new NotFoundException(`Vé #${id} không tồn tại`);
      if (slot.status !== 'BOOKED') {
        throw new ConflictException(
          `Chỉ có thể hoàn thành vé đang BOOKED (hiện: ${slot.status})`,
        );
      }

      const booking = await this.activeBooking(queryRunner.manager, id);
      if (booking) {
        booking.status = 'COMPLETED';
        savedBooking = await queryRunner.manager.save(booking);
      }

      // Ô giờ giữ nguyên patientId: buổi đã đo xong thì ô giờ đó thuộc về bệnh nhân đó,
      // bảng ngày của nhân viên vẫn cần hiện tên.
      slot.status = 'COMPLETED';
      savedSlot = await queryRunner.manager.save(slot);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    this.sseService.emitEvent({
      type: 'SLOT_UPDATED',
      slot: toPublicSlot(savedSlot),
      staffSlot: savedSlot,
    });

    if (savedBooking) {
      this.notifyPatient(
        savedBooking.patientId,
        savedBooking.slotDate,
        savedBooking.slotTime,
        savedSlot.id,
        'COMPLETED',
      );
    }

    return savedSlot;
  }

  async remove(id: number): Promise<void> {
    const slot = await this.findOne(id);
    if (slot.status === 'BOOKED' || slot.status === 'COMPLETED') {
      throw new ConflictException(
        'Không thể xoá vé đang có booking, huỷ trước',
      );
    }
    const booking = await this.activeBooking(this.slotRepo.manager, id);
    if (booking) {
      throw new ConflictException(
        'Vé này còn lượt đặt đang hiệu lực, huỷ trước khi xoá',
      );
    }
    await this.slotRepo.remove(slot);
    // Vé biến mất khỏi lưới giờ → phải báo cho máy khác, không thì họ vẫn thấy vé đã xoá.
    this.sseService.emitEvent({
      type: 'SLOT_REMOVED',
      slot: {
        id,
        slotDate: slot.slotDate,
        slotTime: slot.slotTime,
        status: 'REMOVED',
      },
    });
  }

  async bookMy(
    id: number,
    patientId: number,
    dto: BookSlotDto,
  ): Promise<{ slot: AppointmentSlot; booking: PatientBookingView }> {
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
      .getRawMany<{
        date: string;
        status: AppointmentSlotStatus;
        count: string;
      }>();

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

  // ───────────────────────── Lịch .ics đăng ký được ─────────────────────────

  /**
   * Lấy (hoặc tạo lười) khoá bí mật cho đường dẫn lịch của bệnh nhân.
   *
   * Tạo lười thay vì sinh sẵn cho mọi bệnh nhân: ai không dùng thì không có khoá nào tồn tại
   * để mà rò.
   */
  async getOrCreateIcsToken(patientId: number): Promise<string> {
    const existing = await this.patientsService.getIcsToken(patientId);
    if (existing) return existing;

    const token = randomBytes(32).toString('hex');
    await this.patientsService.setIcsToken(patientId, token);
    return token;
  }

  /** Đổi khoá = mọi đăng ký cũ ngừng hoạt động ngay. */
  async resetIcsToken(patientId: number): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await this.patientsService.setIcsToken(patientId, token);
    return token;
  }

  /**
   * Nội dung lịch .ics cho một bệnh nhân.
   *
   * Cố ý CHỈ gồm ngày/giờ hẹn — KHÔNG có họ tên, KHÔNG có lý do đến. Đường dẫn này xác thực
   * bằng khoá trong URL, mà URL thì nằm trong ứng dụng lịch, đồng bộ qua nhiều thiết bị, và
   * dễ lọt ra ngoài hơn một phiên đăng nhập. Không đưa thông tin bệnh vào đó.
   *
   * Lượt đã huỷ được BỎ HẲN khỏi feed: ứng dụng lịch thay toàn bộ nội dung mỗi lần làm mới,
   * nên vắng mặt = sự kiện biến mất khỏi lịch của khách. Đó chính là "huỷ thì đồng bộ theo".
   */
  async buildPatientIcs(patientId: number, token: string): Promise<string> {
    // Bệnh nhân không tồn tại cũng phải trả về Y HỆT khoá sai. Nếu để lọt NotFoundException,
    // 404-hay-403 trở thành máy dò: kẻ tấn công quét id là biết được id nào có bệnh nhân thật.
    let stored: string | null = null;
    try {
      stored = await this.patientsService.getIcsToken(patientId);
    } catch {
      stored = null;
    }
    // Phải KHỚP CHÍNH XÁC và bệnh nhân phải CÓ khoá — nếu không, một chuỗi rỗng hay null
    // sẽ mở toang lịch của người khác.
    if (!stored || !token || !timingSafeEqualStr(stored, token)) {
      throw new ForbiddenException('Đường dẫn lịch không hợp lệ');
    }

    // Lấy CẢ lượt đã huỷ gần đây, không chỉ lượt còn hiệu lực.
    //
    // Chỉ BỎ sự kiện khỏi feed là chưa đủ: một số ứng dụng lịch vẫn giữ bản đã tải trước đó.
    // Gửi hẳn một VEVENT mang STATUS:CANCELLED là lệnh huỷ TƯỜNG MINH nên chắc ăn hơn. Sau
    // ICS_CANCELLED_KEEP_DAYS thì thôi, không giữ mãi cho feed phình ra.
    const bookings = await this.bookingRepo.find({
      where: { patientId },
      order: { slotDate: 'ASC', slotTime: 'ASC' },
    });

    const config = await this.clinicScheduleService.getConfig();
    const duration = config?.slotDurationMinutes || 60;

    const cutoff = new Date(Date.now() - ICS_CANCELLED_KEEP_DAYS * 86_400_000);
    const events: IcsEvent[] = [];
    for (const b of bookings) {
      if (b.status === 'COMPLETED') continue; // buổi đã đo xong, không cần nằm trên lịch nữa
      const cancelled = b.status === 'CANCELLED';
      if (cancelled) {
        const at = b.cancelledAt
          ? new Date(b.cancelledAt)
          : new Date(b.updatedAt);
        if (at < cutoff) continue;
      }
      events.push({
        // UID gắn với LƯỢT ĐẶT, không phải ô giờ: một ô giờ đặt đi đặt lại nhiều lần thì phải là
        // nhiều sự kiện khác nhau, không thì ứng dụng lịch coi là cùng một cái và ghi đè.
        uid: `booking-${b.id}@kinhlacgiaminh.vn`,
        ymd: b.slotDate,
        hms: b.slotTime,
        durationMinutes: duration,
        summary: 'Lịch trị liệu - Kinh Lạc Gia Minh',
        location: 'Phòng chẩn trị Kinh Lạc Gia Minh',
        // SEQUENCE lấy theo mốc sửa gần nhất — thiếu nó thì bản cập nhật bị coi là trùng và bỏ
        // qua, tức lệnh huỷ sẽ không bao giờ tới nơi.
        sequence: Math.floor(new Date(b.updatedAt).getTime() / 1000),
        status: cancelled ? 'CANCELLED' : 'CONFIRMED',
        alarms: cancelled ? undefined : REMINDER_ALARMS,
      });
    }

    return buildIcsCalendar(events, {
      calendarName: 'Lịch trị liệu - Kinh Lạc Gia Minh',
      // Ứng dụng lịch chỉ COI ĐÂY LÀ GỢI Ý. Apple nhìn con số này nhưng nhịp thật vẫn do người
      // dùng chọn trong Cài đặt; Google bỏ qua hẳn và tự quyết (thường 8-24 tiếng). Để 15 phút
      // là xin nhịp nhanh nhất có thể, chứ không bảo đảm được.
      refreshIntervalMinutes: 15,
    });
  }

  /**
   * Đẩy thông báo cho bệnh nhân — CHẠY NỀN, cố ý KHÔNG await ở nơi gọi.
   *
   * Lần gửi đầu tiên sau mỗi lần khởi động backend phải nạp firebase-admin (~45MB) nên tốn vài
   * giây. Trước đây việc này nằm trên đường đi của request nên cả SSE lẫn phản hồi HTTP đều bị
   * chặn theo — đúng triệu chứng "huỷ xong mà mãi mới thấy".
   */
  private notifyPatient(
    patientId: number,
    slotDate: string,
    slotTime: string,
    slotId: number,
    status: AppointmentSlotStatus,
  ): void {
    void (async () => {
      try {
        const patient = await this.patientsService.findOne(patientId);
        if (!patient?.fcmToken) return;
        await this.firebaseService.sendNotification(
          patient.fcmToken,
          'Cập nhật lịch hẹn',
          `Lịch hẹn ngày ${slotDate} lúc ${slotTime} của bạn đã chuyển sang: ${this.getStatusText(status)}`,
          { slotId: String(slotId), type: 'APPOINTMENT_UPDATE' },
        );
      } catch (error) {
        console.error(`Không gửi được thông báo cho vé #${slotId}:`, error);
      }
    })();
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
