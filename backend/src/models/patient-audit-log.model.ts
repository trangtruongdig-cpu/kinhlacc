import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Audit log mỗi lần thay đổi thông tin bệnh nhân.
 * Ghi tự động trong PatientsService.update() - bác sĩ không cần làm gì thêm.
 * Dùng để tra lịch sử: ai, khi nào, thay đổi trường gì, từ giá trị gì thành giá trị gì.
 */
@Entity('patient_audit_log')
@Index('idx_patient_audit_patient_id', ['patientId'])
@Index('idx_patient_audit_changed_at', ['changedAt'])
export class PatientAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  patientId: number;

  /** Admin đã thực hiện thay đổi (null nếu admin đã bị xóa). */
  @Column({ type: 'int', nullable: true })
  changedByAdminId: number | null;

  /** Tên trường đã thay đổi (ví dụ: 'fullName', 'phone', 'medicalHistory'). */
  @Column({ type: 'varchar', length: 50 })
  changedField: string;

  /** Giá trị cũ (null nếu lần đầu set). */
  @Column({ type: 'text', nullable: true })
  oldValue: string | null;

  /** Giá trị mới. */
  @Column({ type: 'text', nullable: true })
  newValue: string | null;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;
}
