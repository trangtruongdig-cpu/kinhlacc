import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * 6 kinh của Lục Kinh biện chứng (Thương Hàn Luận) — dữ liệu giàu, tái dùng cho lớp ⑤
 * và cho công cụ biện chứng lâm sàng ở giai đoạn sau.
 * Xếp theo BIỂU-LÝ đối xứng tâm (deg): mỗi kinh Dương đối diện kinh Âm biểu-lý.
 */
@Entity('thuong_han_luc_kinh')
export class ThuongHanLucKinh {
  @PrimaryGeneratedColumn()
  id: number;

  /** thai-duong · duong-minh · thieu-duong · thai-am · thieu-am · quyet-am */
  @Column({ type: 'varchar', length: 40, unique: true })
  slug: string;

  @Column({ type: 'int', default: 0 })
  thu_tu: number;

  @Column({ type: 'varchar', length: 60 })
  ten: string;

  @Column({ name: 'ten_han', type: 'varchar', length: 20, nullable: true })
  ten_han: string | null;

  /** duong | am */
  @Column({ type: 'varchar', length: 10, default: 'duong' })
  nhom: string;

  /** Vị trí trên vòng (độ) — dùng cho đồ hình biểu-lý. */
  @Column({ type: 'int', default: 0 })
  deg: number;

  @Column({ name: 'ban_khi', type: 'varchar', length: 40, nullable: true })
  ban_khi: string | null;

  @Column({ name: 'ban_khi_han', type: 'varchar', length: 20, nullable: true })
  ban_khi_han: string | null;

  /** moc | hoaT | hoaQ | tho | kim | thuy */
  @Column({ type: 'varchar', length: 10, nullable: true })
  hanh: string | null;

  /** ban | ban-tieu | trung (标本从化) */
  @Column({ name: 'tong_hoa', type: 'varchar', length: 20, nullable: true })
  tong_hoa: string | null;

  @Column({ name: 'tong_hoa_note', type: 'text', nullable: true })
  tong_hoa_note: string | null;

  /** khai | hap | xu (開闔樞) */
  @Column({ name: 'khai_hap_xu', type: 'varchar', length: 10, nullable: true })
  khai_hap_xu: string | null;

  @Column({ name: 'trung_kien', type: 'varchar', length: 80, nullable: true })
  trung_kien: string | null;

  @Column({ name: 'tang_phu_dich', type: 'varchar', length: 80, nullable: true })
  tang_phu_dich: string | null;

  @Column({ name: 'tang_phu_han', type: 'varchar', length: 40, nullable: true })
  tang_phu_han: string | null;

  /** tang | phu */
  @Column({ name: 'tang_phu_type', type: 'varchar', length: 10, nullable: true })
  tang_phu_type: string | null;

  @Column({ name: 'tang_phu_sub', type: 'text', nullable: true })
  tang_phu_sub: string | null;

  @Column({ name: 'trieu_chung', type: 'text', nullable: true })
  trieu_chung: string | null;

  @Column({ name: 'tri_phap', type: 'varchar', length: 120, nullable: true })
  tri_phap: string | null;

  @Column({ name: 'truyen_bien', type: 'text', nullable: true })
  truyen_bien: string | null;

  /** Trỏ bài thuốc sẵn có trong app (deep-link) — dạng [{ id?, ten }]. */
  @Column({ name: 'bai_thuoc_refs', type: 'jsonb', nullable: true })
  bai_thuoc_refs: unknown | null;
}
