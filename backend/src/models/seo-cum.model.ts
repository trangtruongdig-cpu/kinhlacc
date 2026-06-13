import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type SeoCumTrangThai = 'de_xuat' | 'da_chon' | 'da_viet' | 'bo_qua';

/** Một cụm chủ đề AI gợi ý nên viết — kết quả của gap analysis (so đối thủ ↔ mình). */
@Entity('seo_cum')
export class SeoCum {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ten_cum: string;

  /** Điểm ưu tiên tổng (càng cao càng nên viết trước). */
  @Column({ type: 'int', default: 0 })
  diem_uu_tien: number;

  @Column({ type: 'text', nullable: true })
  tu_khoa_muc_tieu: string | null;

  @Column({ type: 'text', nullable: true })
  y_tuong_noi_dung: string | null;

  @Column({ type: 'text', nullable: true })
  ly_do: string | null;

  /** Khoảng trống này tìm ra khi so với đối thủ nào (để gom nhóm theo đối thủ). null = gộp tất cả. */
  @Index()
  @Column({ type: 'int', nullable: true })
  doi_thu_id: number | null;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'de_xuat' })
  trang_thai: SeoCumTrangThai;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;
}
