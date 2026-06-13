import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type SeoUrlTrangThai = 'cho' | 'da_phan_tich' | 'loi' | 'ngoai_nganh';

/** Một URL blog gom từ sitemap đối thủ + kết quả AI bóc tách (chủ đề / từ khoá / tóm tắt). */
@Entity('seo_url')
export class SeoUrl {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int', name: 'doi_thu_id' })
  doi_thu_id: number;

  @Column({ type: 'text' })
  url: string;

  /** cho = chờ · da_phan_tich = xong · loi = lỗi · ngoai_nganh = không thuộc ngách Đông Y (bỏ qua, khỏi tốn AI). */
  @Index()
  @Column({ type: 'varchar', length: 20, default: 'cho' })
  trang_thai: SeoUrlTrangThai;

  @Column({ type: 'text', nullable: true })
  chu_de: string | null;

  @Column({ type: 'text', nullable: true })
  tu_khoa: string | null;

  @Column({ type: 'text', nullable: true })
  tom_tat: string | null;

  @Column({ type: 'text', nullable: true })
  loi: string | null;

  @Column({ type: 'timestamptz', name: 'analyzed_at', nullable: true })
  analyzed_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;
}
