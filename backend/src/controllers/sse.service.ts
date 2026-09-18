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
  /** Trạng thái ô giờ, hoặc 'REMOVED' khi ô giờ vừa bị xoá hẳn. */
  status: string;
}

export interface SlotEvent {
  type: 'NEW_BOOKING' | 'SLOT_UPDATED' | 'SLOT_REMOVED' | 'DAY_REGENERATED';
  /**
   * Luôn phát cho mọi người — chỉ chứa trường công khai.
   * Vắng mặt ở DAY_REGENERATED: sự kiện đó nói về CẢ NGÀY, không về một ô giờ cụ thể.
   */
  slot?: PublicSlotView;
  /** Chỉ có ở DAY_REGENERATED — ngày vừa được sinh lại vé (YYYY-MM-DD). */
  date?: string;
  /** CHỈ nhân viên nhận được (có thể chứa họ tên bệnh nhân). */
  staffMessage?: string;
  /**
   * Bản ĐẦY ĐỦ của vé — CHỈ nhân viên nhận được (có patientId/reason/notes).
   *
   * Cần vì bảng ngày của nhân viên hiển thị tên bệnh nhân từ `patientId`. Nếu vá bảng bằng
   * `slot` (bản công khai, đã cắt mất patientId) thì mỗi sự kiện SSE lại xoá trắng tên bệnh
   * nhân trên màn hình nhân viên cho tới khi tải lại cả ngày.
   */
  staffSlot?: AppointmentSlot;
  /** Số thứ tự do SseService gán lúc phát — xem chú thích `seq` trong SseService. */
  seq?: number;
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

  /**
   * Số thứ tự tăng dần cho mỗi sự kiện, phát kèm làm `id:` của SSE.
   *
   * Dùng để máy khách biết mình có BỎ LỠ sự kiện nào trong lúc mất kết nối hay không: nối lại
   * mà số nhảy cóc (không liền mạch) thì tải lại dữ liệu cho chắc. Đếm lại từ 0 mỗi lần backend
   * khởi động — máy khách thấy số TỤT cũng coi như đứt mạch và tải lại.
   */
  private seq = 0;

  emitEvent(event: SlotEvent) {
    this.seq += 1;
    this.events.next({ ...event, seq: this.seq });
  }

  getEventStream() {
    return this.events.asObservable();
  }
}
