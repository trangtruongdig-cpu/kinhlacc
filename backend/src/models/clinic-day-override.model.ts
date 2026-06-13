import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ymdDateTransformer } from './_date-transformer';

@Entity('clinic_day_overrides')
export class ClinicDayOverride {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'date', transformer: ymdDateTransformer })
  date: string;

  @Column({ type: 'boolean', default: false })
  isClosed: boolean;

  @Column({ type: 'time', nullable: true })
  openTime: string | null;

  @Column({ type: 'time', nullable: true })
  closeTime: string | null;

  @Column({ type: 'time', nullable: true })
  breakStart: string | null;

  @Column({ type: 'time', nullable: true })
  breakEnd: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
