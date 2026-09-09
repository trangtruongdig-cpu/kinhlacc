import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

/** Cột NUMERIC của pg đọc ra là chuỗi; đưa về number để API trả số đúng kiểu (giống examination.model.ts). */
const soThapPhan = {
  to: (v: number | null | undefined) => (v === null || v === undefined ? null : v),
  from: (v: string | number | null): number | null => {
    if (v === null || v === undefined) return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  },
};

/**
 * Dữ liệu đo kinh lạc: 12 tạng phủ (Thập Nhị Kinh) × 2 bên (phải/trái) = 24 cột.
 * Backfill từ inputData JSONB cũ — xem backend/sql/add-meridian-measurements.sql.
 *
 * KHỚP NGUYÊN VĂN với bảng thật trên DB (snake_case, đã có ~9.5k dòng dữ liệu) — đừng đổi
 * tên cột/thêm cột mới ở đây mà không kiểm tra bảng thật trước, TypeORM synchronize sẽ cố
 * ALTER TABLE và vỡ NOT NULL constraint trên dữ liệu đã có (đã xảy ra 1 lần với examinationId).
 *
 * Mỗi lần khám (examination) có thể có 1+ lần đo kinh lạc (1:N).
 */
@Entity('meridian_measurements')
export class MeridianMeasurement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'examination_id' })
  examinationId: number;

  // ============================================================================
  // 12 tạng phủ × phải/trái — giá trị đo kinh lạc, feed vào BenhDongYExcel rule engine
  // ============================================================================
  @Column({ type: 'numeric', nullable: true, name: 'phe_phai', transformer: soThapPhan })
  phePhai: number | null;
  @Column({ type: 'numeric', nullable: true, name: 'phe_trai', transformer: soThapPhan })
  pheTrai: number | null;

  @Column({ type: 'numeric', nullable: true, name: 'daitrang_phai', transformer: soThapPhan })
  daiTrangPhai: number | null;
  @Column({ type: 'numeric', nullable: true, name: 'daitrang_trai', transformer: soThapPhan })
  daiTrangTrai: number | null;

  @Column({ type: 'numeric', nullable: true, name: 'vi_phai', transformer: soThapPhan })
  viPhai: number | null;
  @Column({ type: 'numeric', nullable: true, name: 'vi_trai', transformer: soThapPhan })
  viTrai: number | null;

  @Column({ type: 'numeric', nullable: true, name: 'ty_phai', transformer: soThapPhan })
  tyPhai: number | null;
  @Column({ type: 'numeric', nullable: true, name: 'ty_trai', transformer: soThapPhan })
  tyTrai: number | null;

  @Column({ type: 'numeric', nullable: true, name: 'tam_phai', transformer: soThapPhan })
  tamPhai: number | null;
  @Column({ type: 'numeric', nullable: true, name: 'tam_trai', transformer: soThapPhan })
  tamTrai: number | null;

  @Column({ type: 'numeric', nullable: true, name: 'tieutruong_phai', transformer: soThapPhan })
  tieuTruongPhai: number | null;
  @Column({ type: 'numeric', nullable: true, name: 'tieutruong_trai', transformer: soThapPhan })
  tieuTruongTrai: number | null;

  @Column({ type: 'numeric', nullable: true, name: 'bangquang_phai', transformer: soThapPhan })
  bangQuangPhai: number | null;
  @Column({ type: 'numeric', nullable: true, name: 'bangquang_trai', transformer: soThapPhan })
  bangQuangTrai: number | null;

  @Column({ type: 'numeric', nullable: true, name: 'than_phai', transformer: soThapPhan })
  thanPhai: number | null;
  @Column({ type: 'numeric', nullable: true, name: 'than_trai', transformer: soThapPhan })
  thanTrai: number | null;

  @Column({ type: 'numeric', nullable: true, name: 'tambao_phai', transformer: soThapPhan })
  tamBaoPhai: number | null;
  @Column({ type: 'numeric', nullable: true, name: 'tambao_trai', transformer: soThapPhan })
  tamBaoTrai: number | null;

  @Column({ type: 'numeric', nullable: true, name: 'tamtieu_phai', transformer: soThapPhan })
  tamTieuPhai: number | null;
  @Column({ type: 'numeric', nullable: true, name: 'tamtieu_trai', transformer: soThapPhan })
  tamTieuTrai: number | null;

  @Column({ type: 'numeric', nullable: true, name: 'can_phai', transformer: soThapPhan })
  canPhai: number | null;
  @Column({ type: 'numeric', nullable: true, name: 'can_trai', transformer: soThapPhan })
  canTrai: number | null;

  @Column({ type: 'numeric', nullable: true, name: 'dam_phai', transformer: soThapPhan })
  damPhai: number | null;
  @Column({ type: 'numeric', nullable: true, name: 'dam_trai', transformer: soThapPhan })
  damTrai: number | null;

  // ============================================================================
  // Timestamps + audit
  // ============================================================================
  @Column({ type: 'timestamp', nullable: true, name: 'measured_at' })
  measuredAt: Date | null;

  @Column({ type: 'uuid', nullable: true, name: 'measured_by_admin_id' })
  measuredByAdminId: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'created_at' })
  createdAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'updated_at' })
  updatedAt: Date | null;

  // ============================================================================
  // Relations
  // ============================================================================
  @ManyToOne('Examination', (e: any) => e.meridianMeasurements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examination_id' })
  examination: any; // Avoid circular import
}
