import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
} from 'typeorm';
import { BenhTayY } from './benh-tay-y.model';

@Entity('trieu_chung')
export class TrieuChung {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ten_trieu_chung: string;

  /** Nhóm triệu chứng (tinh-than | tieu-hoa | than-kinh-co-the | phu-khoa | luoi-mach | toan-trang | khac). */
  @Column({ type: 'varchar', length: 40, nullable: true })
  nhom: string | null;

  @ManyToMany(() => BenhTayY, (b) => b.trieuChungList)
  benhTayYList: BenhTayY[];
}
