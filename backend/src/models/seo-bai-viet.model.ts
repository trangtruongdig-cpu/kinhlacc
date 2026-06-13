import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type SeoBaiVietRuiRo = 'an_toan' | 'rui_ro';
export type SeoBaiVietTrangThai = 'nhap' | 'da_duyet' | 'bo_qua' | 'da_dang';

/** Một bản nháp blog do AI sinh (Phase 2 — Lò Viết Bài). Xuất ra content/blog/<slug>.md để pipeline build. */
@Entity('seo_bai_viet')
export class SeoBaiViet {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int', name: 'cum_id', nullable: true })
  cum_id: number | null;

  @Column({ type: 'varchar', length: 500, default: '' })
  tieu_de: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  slug: string | null;

  @Column({ type: 'text', nullable: true })
  meta_description: string | null;

  /** Từ khoá cách nhau dấu phẩy → xuất thành mảng keywords[] trong frontmatter. */
  @Column({ type: 'text', nullable: true })
  tu_khoa: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cta: string | null;

  /** JSON [{q,a}] cho FAQPage schema. */
  @Column({ type: 'text', nullable: true })
  faq: string | null;

  /** JSON [{title, url?}] nguồn tham khảo uy tín (E-E-A-T) → xuất ra frontmatter `sources`. */
  @Column({ type: 'text', nullable: true })
  nguon_tham_khao: string | null;

  @Column({ type: 'text', default: '' })
  noi_dung_md: string;

  /** Van an toàn YMYL: an_toan = dữ kiện tra cứu · rui_ro = có lời khuyên chẩn đoán/điều trị. */
  @Column({ type: 'varchar', length: 20, default: 'an_toan' })
  do_rui_ro: SeoBaiVietRuiRo;

  @Column({ type: 'text', nullable: true })
  ly_do_rui_ro: string | null;

  /** Checklist kiểm duyệt thủ công (JSON {yKhoa,seo,nguon,anh}). Đủ 4 mục mới cho chuyển "da_duyet". */
  @Column({ type: 'text', nullable: true })
  kiem_duyet: string | null;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'nhap' })
  trang_thai: SeoBaiVietTrangThai;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;
}
