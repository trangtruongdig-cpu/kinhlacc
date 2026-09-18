import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ymdDateTransformer } from './_date-transformer';

export type AppointmentBookingStatus = 'BOOKED' | 'CANCELLED' | 'COMPLETED';

/**
 * LƯỢT ĐẶT VÉ — tách khỏi `appointment_slots` (Ô GIỜ).
 *
 * Vì sao phải tách: một ô giờ được DÙNG LẠI. Chị A đặt 9h thứ 5 rồi huỷ, anh B đặt đúng ô đó.
 * Trước đây `appointment_slots.patientId` bị ghi đè → lượt đặt của chị A biến mất khỏi "Lịch của
 * tôi" của chị, và phòng khám mất luôn bằng chứng ai từng đặt / ai từng huỷ.
 *
 * Từ nay: ô giờ giữ TRẠNG THÁI HIỆN TẠI (còn trống hay không), bảng này giữ LỊCH SỬ (bất biến,
 * mỗi lượt đặt một dòng). Lịch sử bệnh nhân luôn đọc ở đây, không đọc ở ô giờ.
 *
 * Cố ý KHÔNG đặt khoá ngoại cứng tới appointment_slots: xoá một ô giờ cũ không được phép làm bốc
 * hơi lịch sử khám của bệnh nhân. slotDate/slotTime là ẢNH CHỤP tại lúc đặt, đọc lại vẫn đúng kể
 * cả khi ô giờ đã bị đổi hoặc xoá.
 */
@Entity('appointment_bookings')
export class AppointmentBooking {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  slotId: number;

  @Index()
  @Column({ type: 'int' })
  patientId: number;

  // Ảnh chụp giờ hẹn tại thời điểm đặt (xem chú thích đầu lớp).
  @Column({ type: 'date', transformer: ymdDateTransformer })
  slotDate: string;

  @Column({ type: 'time' })
  slotTime: string;

  @Column({ type: 'varchar', length: 20, default: 'BOOKED' })
  status: AppointmentBookingStatus;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /** Ai bấm huỷ — để phòng khám phân biệt khách tự huỷ với phòng khám huỷ. */
  @Column({ type: 'varchar', length: 10, nullable: true })
  cancelledBy: 'PATIENT' | 'STAFF' | null;

  // TIMESTAMPTZ — khớp với appointment_slots."createdAt"/"updatedAt" (xem
  // backend/sql/rebuild-appointment-system.sql). KHÔNG dùng `timestamp` trần: backfill chép
  // thẳng từ cột timestamptz sang sẽ quy đổi theo múi giờ phiên làm việc và lệch 7 tiếng.
  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
