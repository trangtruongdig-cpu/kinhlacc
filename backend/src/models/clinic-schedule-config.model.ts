import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('clinic_schedule_config')
export class ClinicScheduleConfig {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'time' })
  openTime: string;

  @Column({ type: 'time' })
  closeTime: string;

  @Column({ type: 'time', nullable: true })
  breakStart: string | null;

  @Column({ type: 'time', nullable: true })
  breakEnd: string | null;

  @Column({ type: 'int', default: 45 })
  slotDurationMinutes: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
