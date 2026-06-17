import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn
} from 'typeorm';
import { ymdDateTransformer } from './_date-transformer';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  fullName: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender: string | null;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column({ type: 'varchar', nullable: true })
  timeOfBirth: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', nullable: true })
  province: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  medicalHistory: string | null;

  @Column({ type: 'varchar', nullable: true })
  passwordHash: string | null;

  @Column({ type: 'text', nullable: true })
  fcmToken: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Liệu trình hiện tại: số buổi mục tiêu + ngày bắt đầu.
  // Số buổi "đã trị" được đếm động từ appointment_slots (COMPLETED), không lưu ở đây.
  @Column({ type: 'int', nullable: true })
  treatmentTarget: number | null;

  // transformer giữ ngày dạng 'YYYY-MM-DD' (giống slotDate), tránh bị serialize thành ISO/UTC.
  @Column({ type: 'date', nullable: true, transformer: ymdDateTransformer })
  treatmentCourseStart: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Soft delete: bệnh nhân tự yêu cầu xoá tài khoản (qua app / trang /xoa-tai-khoan).
  // TypeORM tự thêm điều kiện `deletedAt IS NULL` cho find/findOne/QueryBuilder, nên
  // tài khoản đã xoá KHÔNG đăng nhập được và biến mất khỏi các danh sách; dữ liệu vẫn
  // được giữ lại trong DB để tuân thủ quy định lưu hồ sơ khám chữa bệnh (xoá hẳn theo lịch).
  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
