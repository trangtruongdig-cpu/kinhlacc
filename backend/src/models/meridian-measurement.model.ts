import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Dữ liệu đo kinh lạc: 12 ô chi trên (C10-C15) + chi dưới (F10-F15).
 * Thay thế cách cũ: lưu trong JSONB generic inputData.
 *
 * Mỗi lần khám (examination) có thể có 1+ lần đo kinh lạc (1:N).
 * Schema rõ ràng → dễ join, filter, aggregate trên DB.
 */
@Entity('meridian_measurements')
export class MeridianMeasurement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  examinationId: number;

  // ============================================================================
  // 12 ô đo: Chi Trên (C10-C15) + Chi Dưới (F10-F15)
  // ============================================================================
  // Giá trị: 0-100 hoặc NULL nếu không đo
  // Các giá trị này feed trực tiếp vào BenhDongYExcel rule engine

  // Chi trên: Tay phải / tay trái, 6 ô
  @Column({ type: 'int', nullable: true })
  chiTrenC10: number | null; // Huyệt Thiên Tỉnh (Thiên Khí)

  @Column({ type: 'int', nullable: true })
  chiTrenC11: number | null;

  @Column({ type: 'int', nullable: true })
  chiTrenC12: number | null;

  @Column({ type: 'int', nullable: true })
  chiTrenC13: number | null;

  @Column({ type: 'int', nullable: true })
  chiTrenC14: number | null;

  @Column({ type: 'int', nullable: true })
  chiTrenC15: number | null;

  // Chi dưới: Chân phải / chân trái, 6 ô
  @Column({ type: 'int', nullable: true })
  chiDuoiF10: number | null;

  @Column({ type: 'int', nullable: true })
  chiDuoiF11: number | null;

  @Column({ type: 'int', nullable: true })
  chiDuoiF12: number | null;

  @Column({ type: 'int', nullable: true })
  chiDuoiF13: number | null;

  @Column({ type: 'int', nullable: true })
  chiDuoiF14: number | null;

  @Column({ type: 'int', nullable: true })
  chiDuoiF15: number | null;

  // ============================================================================
  // Raw data từ máy đo (giữ lại để reference, debug)
  // ============================================================================
  @Column({ type: 'jsonb', nullable: true })
  measurementsRaw: Record<string, any> | null;

  // ============================================================================
  // Timestamps
  // ============================================================================
  @Column({ type: 'timestamp' })
  measuredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ============================================================================
  // Relations
  // ============================================================================
  @ManyToOne('Examination', (e) => e.meridianMeasurements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examination_id' })
  examination: any; // Avoid circular import
}
