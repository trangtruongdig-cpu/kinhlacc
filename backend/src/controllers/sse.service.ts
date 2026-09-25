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

/**
 * Phần cụm sự cố phát qua SSE cho NHÂN VIÊN. Cố ý không có stack/ngữ cảnh: đây chỉ là tiếng
 * chuông, chi tiết nằm sau `QuanTriGuard` ở tab "Góp Ý & Lỗi".
 */
export interface SuCoEventView {
  id: number;
  vanTay: string;
  hang: string;
  lane: string;
  khuVuc: string;
  tomTat: string;
  taiPhat: boolean;
}

export interface SlotEvent {
  type:
    | 'NEW_BOOKING'
    | 'SLOT_UPDATED'
    | 'SLOT_REMOVED'
    | 'DAY_REGENERATED'
    | 'APPOINTMENT_REMINDER'
    | 'SU_CO_MOI';
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
  /**
   * Sự kiện RIÊNG của một bệnh nhân — SseController chỉ gửi cho đúng người này, không phát
   * cho ai khác (kể cả nhân viên).
   *
   * Có trường này thì sự kiện KHÔNG còn là quảng bá. Lọc phải nằm ở SERVER: xoá bớt trường
   * rồi vẫn gửi là sai, vì bản thân việc "bệnh nhân B nhận được lời nhắc của bệnh nhân A"
   * đã rò thông tin.
   */
  targetPatientId?: number;

  /** Nội dung nhắc hẹn, đi cùng APPOINTMENT_REMINDER. */
  message?: string;

  /**
   * Cụm sự cố mới, đi cùng SU_CO_MOI. CHỈ nhân viên nhận được — lọc ở SseController.
   * Tên khu vực và tóm tắt lỗi là chuyện nội bộ, bệnh nhân không có việc gì phải biết.
   */
  suCo?: SuCoEventView;

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
    // Sự kiện RIÊNG của một người KHÔNG được đánh số: nó bị lọc khỏi luồng của mọi người khác,
    // nên nếu đánh số chung thì với họ dãy số sẽ nhảy cóc, và máy khách hiểu nhầm là "mình vừa
    // bỏ lỡ sự kiện" rồi tải lại toàn bộ dữ liệu một cách vô ích.
    if (event.targetPatientId != null) {
      this.events.next(event);
      return;
    }
    this.seq += 1;
    this.events.next({ ...event, seq: this.seq });
  }

  getEventStream() {
    return this.events.asObservable();
  }
}
