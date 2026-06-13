import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn
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
}
