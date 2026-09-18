import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { AppointmentSlot } from '../models/appointment-slot.model';

/**
 * Phần vé được phép phát cho MỌI người đăng nhập (kể cả bệnh nhân) qua SSE.
 * Cố ý KHÔNG có patientId / reason / notes — đó là dữ liệu riêng của từng bệnh nhân.
 */
export interface PublicSlotView {
  id: number;
  slotDate: string;
  slotTime: string;
  status: string;
}

export interface SlotEvent {
  type: 'NEW_BOOKING' | 'SLOT_UPDATED';
  /** Luôn phát cho mọi người — chỉ chứa trường công khai. */
  slot: PublicSlotView;
  /** CHỈ nhân viên nhận được (có thể chứa họ tên bệnh nhân). */
  staffMessage?: string;
}

/** Cắt bản ghi vé xuống đúng phần công khai. Dùng ở MỌI chỗ phát SSE. */
export function toPublicSlot(slot: AppointmentSlot): PublicSlotView {
  return {
    id: slot.id,
    slotDate: slot.slotDate,
    slotTime: slot.slotTime,
    status: slot.status,
  };
}

@Injectable()
export class SseService {
  private events = new Subject<SlotEvent>();

  emitEvent(event: SlotEvent) {
    this.events.next(event);
  }

  getEventStream() {
    return this.events.asObservable();
  }
}
