import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { ymdDateTransformer } from './_date-transformer';

export type AppointmentSlotStatus =
  | 'OPEN'
  | 'CLOSED'
  | 'BOOKED'
  | 'COMPLETED'
  | 'CANCELLED';

@Entity('appointment_slots')
@Unique('appointment_slots_unique_slot', ['slotDate', 'slotTime'])
export class AppointmentSlot {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'date', transformer: ymdDateTransformer })
  slotDate: string;

  @Column({ type: 'time' })
  slotTime: string;

  @Column({ type: 'varchar', length: 20, default: 'OPEN' })
  status: AppointmentSlotStatus;

  @Index()
  @Column({ type: 'int', nullable: true })
  patientId: number | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
