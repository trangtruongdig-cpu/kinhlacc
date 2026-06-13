import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

/** Một domain đối thủ cần "soi" — hoặc site của chính mình (la_cua_minh=true) để làm mốc so sánh. */
@Entity('seo_doi_thu')
export class SeoDoiThu {
  @PrimaryGeneratedColumn()
  id: number;

  /** Domain đã chuẩn hoá: không http, không www, không path (vd "dokinhlac.com.vn"). */
  @Column({ type: 'varchar', length: 255 })
  domain: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ten: string | null;

  /** true = site của mình (dùng làm mốc cho gap analysis). */
  @Column({ type: 'boolean', default: false })
  la_cua_minh: boolean;

  @Column({ type: 'text', nullable: true })
  ghi_chu: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;
}
