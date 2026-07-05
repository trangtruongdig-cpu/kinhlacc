import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Ghi đè tay (Hybrid) cho "bệnh cơ" của một thể bệnh/pháp trị.
 * Engine luôn TỰ SUY từ dữ liệu khách quan; bảng này chỉ lưu chỗ người dùng CHỈNH LẠI.
 * Khoá theo id_phap_tri (1 pháp trị ↔ tối đa 1 bản ghi đè).
 */
@Entity('thuong_han_benh_co')
export class ThuongHanBenhCo {
  @PrimaryColumn({ type: 'int' })
  id_phap_tri!: number;

  /** 'luc-kinh' (thương hàn) hoặc 'on-benh' (Vệ-Khí-Dinh-Huyết). */
  @Column({ type: 'varchar', length: 12, nullable: true })
  he!: string | null;

  /** slug Lục Kinh (thai-duong…) hoặc tên phận ("Khí Phận"…). */
  @Column({ type: 'varchar', length: 40, nullable: true })
  giai_doan_slug!: string | null;

  @Column({ type: 'text', nullable: true })
  tang_phu!: string | null;

  @Column({ type: 'text', nullable: true })
  khi!: string | null;

  @Column({ type: 'text', nullable: true })
  ghi_chu!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  nguoi_sua!: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updated_at!: Date;
}
