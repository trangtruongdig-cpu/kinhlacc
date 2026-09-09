import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

/**
 * Audit log cho bệnh nhân: track mỗi lần sửa thông tin.
 * Bắt buộc theo quy định YHCT: phải lưu lịch sử thay đổi bệnh nhân.
 *
 * Khi admin sửa fullName, medicalHistory, phone, ... → tự động log:
 * - Trường nào thay đổi
 * - Giá trị cũ / mới
 * - Ai sửa (admin ID hoặc patient ID tự sửa)
 * - Khi nào
 */
@Entity('patient_audit_log')
export class PatientAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  patientId: number;

  // ============================================================================
  // Trường thay đổi & giá trị cũ/mới
  // ============================================================================
  @Column({ type: 'varchar', length: 255 })
  fieldName: string;

  @Column({ type: 'text', nullable: true })
  oldValue: string | null;

  @Column({ type: 'text', nullable: true })
  newValue: string | null;

  // ============================================================================
  // Audit: Ai sửa (MUTUALLY EXCLUSIVE)
  // ============================================================================
  // Case 1: Admin sửa → changedByAdminId SET, changedByPatientId NULL
  // Case 2: Patient tự sửa → changedByPatientId SET, changedByAdminId NULL
  @Column({ type: 'int', nullable: true, name: 'changed_by_admin_id' })
  changedByAdminId: number | null;

  @Column({ type: 'int', nullable: true, name: 'changed_by_patient_id' })
  changedByPatientId: number | null;

  // ============================================================================
  // Khi nào thay đổi
  // ============================================================================
  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;

  // ============================================================================
  // Relations
  // ============================================================================
  @ManyToOne('Patient', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: any; // Avoid circular import

  // ============================================================================
  // Helper: Get who made the change (admin or patient)
  // ============================================================================
  get changedBy(): string {
    if (this.changedByAdminId) {
      return `admin:${this.changedByAdminId}`;
    }
    if (this.changedByPatientId) {
      return `patient:${this.changedByPatientId}`;
    }
    return 'unknown';
  }

  // ============================================================================
  // Helper: Format for display
  // ============================================================================
  formatChange(): string {
    const timestamp = this.changedAt.toISOString().split('T')[0];
    const who = this.changedBy;
    const field = this.fieldName;
    const oldVal = this.oldValue ? `"${this.oldValue}"` : 'NULL';
    const newVal = this.newValue ? `"${this.newValue}"` : 'NULL';
    return `[${timestamp}] ${who}: ${field} ${oldVal} → ${newVal}`;
  }
}
