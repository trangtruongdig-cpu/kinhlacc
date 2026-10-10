import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ymdDateTransformer } from './_date-transformer';

/**
 * MOVED = vé đã CHUYỂN sang ca khác (khách bận, xin đổi giờ). Khác hẳn CANCELLED: vé vẫn sống,
 * chỉ là dòng này ghi lại ca CŨ; vé ở ca mới là dòng khác có `movedFromId` trỏ về đây.
 */
export type AppointmentBookingStatus =
  | 'BOOKED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'MOVED';

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

  // TIMESTAMPTZ — nay đã khớp với appointment_slots."createdAt"/"updatedAt" (xem
  // backend/sql/rebuild-appointment-system.sql). KHÔNG dùng `timestamp` trần: backfill chép
  // thẳng từ cột timestamptz sang sẽ quy đổi theo múi giờ phiên làm việc và lệch 7 tiếng.
  //
  // ⚠️ Câu "khớp với appointment_slots" ở trên chỉ ĐÚNG TỪ 10/10/2026. Trước đó bảng kia là
  // `timestamp` TRẦN, tức hai bảng của cùng một nghiệp vụ nằm ở hai hệ quy chiếu và mọi phép so
  // trộn chúng lệch 7 giờ. Xem sql/dong-nhat-moc-thoi-gian-appointment-slots.sql.
  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  // ── Chuyển vé ── Dòng ca cũ ghi nơi vé đi tới (ẢNH CHỤP giờ lúc chuyển, như slotDate/slotTime),
  // dòng ca mới ghi nơi vé đi từ. Giữ cả hai chiều để thẻ ca cũ hiện được "đã chuyển sang 17:45"
  // mà không phải nạp ngày khác.
  @Column({ type: 'int', nullable: true })
  movedToId: number | null;

  @Column({ type: 'date', nullable: true, transformer: ymdDateTransformer })
  movedToDate: string | null;

  @Column({ type: 'time', nullable: true })
  movedToTime: string | null;

  @Column({ type: 'int', nullable: true })
  movedFromId: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  movedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
