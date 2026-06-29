import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * Nguon — SỔ CÁI TRÍCH DẪN THỐNG NHẤT (Thư Mục Nguồn).
 * Một mục = một sách/y văn (loai='sach') hoặc một tác giả người (loai='tac_gia').
 * Tham chiếu 2 chiều qua 3 bảng link (nguon_huyet / nguon_vi_thuoc / nguon_phuong_thang) — truy vấn raw trong service.
 */
@Entity('nguon')
export class Nguon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  slug: string;

  @Column({ type: 'text' })
  ten: string;

  @Column({ type: 'text', default: 'sach' })
  loai: string; // 'sach' | 'tac_gia'

  @Column({ type: 'text' })
  norm_key: string;

  @Column({ type: 'text', nullable: true })
  ten_khac: string | null;

  @Column({ type: 'text', nullable: true })
  tac_gia: string | null;

  @Column({ type: 'text', nullable: true })
  nien_dai: string | null;

  @Column({ type: 'text', nullable: true })
  link: string | null;

  @Column({ type: 'text', nullable: true })
  ghi_chu: string | null;

  @Column({ type: 'text', nullable: true })
  mo_ta: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
