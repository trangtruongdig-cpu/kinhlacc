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
 * Chẩn đoán: Kết quả suy luận từ dữ liệu kinh lạc + BenhDongYExcel rule engine.
 * Normalize từ cách cũ: lưu JSONB chanDoanLuu trong examinations table.
 *
 * Mỗi examination có thể có 1+ diagnoses (nếu bác sĩ review nhiều lần).
 * Lưu: bệnh chính + danh sách ứng viên + score + triệu chứng + ghi chú.
 */
@Entity('diagnoses')
export class Diagnosis {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'examination_id' })
  examinationId: number;

  // ============================================================================
  // Bệnh Y học hiện đại chính (primary diagnosis)
  // ============================================================================
  @Column({
    type: 'varchar',
    length: 120,
    nullable: true,
    name: 'primary_disease_code',
  })
  primaryDiseaseCode: string | null;

  // ============================================================================
  // Confidence score (0-100)
  // ============================================================================
  // Độ tin cậy của công thức rule engine
  // VD: khớp rule 78% → score = 78
  @Column({ type: 'int', default: 0, name: 'confidence_score' })
  confidenceScore: number;

  // ============================================================================
  // Matched diseases (JSONB)
  // ============================================================================
  // Danh sách TẤT CẢ bệnh Y học khớp rule engine
  // Format: [
  //   { code: "gout", name: "Gout", score: 78, is_primary: true },
  //   { code: "ra", name: "Rheumatoid Arthritis", score: 65, is_primary: false },
  //   ...
  // ]
  @Column({ type: 'jsonb', nullable: true, name: 'matched_diseases' })
  matchedDiseases: Array<{
    code: string;
    name: string;
    score: number;
    is_primary: boolean;
  }> | null;

  // ============================================================================
  // Concluded patterns (YHCT patterns selected by doctor)
  // ============================================================================
  // Danh sách thể bệnh (YHCT) bác sĩ chốt kết luận
  // Format: [
  //   { label: "Khí hư", key: "tdo:123" },
  //   { label: "Huyết hư", key: "tdo:456" },
  //   ...
  // ]
  @Column({ type: 'jsonb', nullable: true, name: 'concluded_patterns' })
  concludedPatterns: Array<{
    label: string;
    key: string;
  }> | null;

  // ============================================================================
  // Symptoms answered (triệu chứng đã hỏi & câu trả lời)
  // ============================================================================
  // Snapshot từ khi chốt chẩn đoán - để reference lần sau
  // Format: [
  //   { id: 1, ten: "Sốt", nhom: "Biểu Chứng", tra_loi: "co" },
  //   { id: 2, ten: "Ho", nhom: "Phổi Chứng", tra_loi: "khong" },
  //   ...
  // ]
  @Column({ type: 'jsonb', nullable: true, name: 'symptoms_answered' })
  symptomsAnswered: Array<{
    id: number;
    ten: string;
    nhom: string | null;
    tra_loi: 'co' | 'khong' | 'kho';
  }> | null;

  // ============================================================================
  // Ranking (xếp hạng ứng viên thể bệnh)
  // ============================================================================
  // Snapshot từ khi chốt - hiển thị tại sao chọn thể này
  // Format: [
  //   { label: "Khí hư", percent: 78, is_kep: false },
  //   { label: "Huyết hư", percent: 65, is_kep: false },
  //   ...
  // ]
  @Column({ type: 'jsonb', nullable: true })
  ranking: Array<{
    label: string;
    percent: number;
    is_kep: boolean;
  }> | null;

  // ============================================================================
  // Ghi chú bác sĩ
  // ============================================================================
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // ============================================================================
  // Audit: Ai đã chốt chẩn đoán
  // ============================================================================
  // ID của admin đã chốt (nếu có)
  // Nếu NULL = chưa được bác sĩ xác nhận, chỉ là gợi ý từ rule engine
  @Column({ type: 'int', nullable: true, name: 'diagnosed_by_admin_id' })
  diagnosedByAdminId: number | null;

  @Column({ type: 'timestamp', nullable: true, name: 'diagnosed_at' })
  diagnosedAt: Date | null;

  // ============================================================================
  // Timestamps
  // ============================================================================
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ============================================================================
  // Relations
  // ============================================================================
  @ManyToOne('Examination', (e) => e.diagnoses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examination_id' })
  examination: any; // Avoid circular import
}
