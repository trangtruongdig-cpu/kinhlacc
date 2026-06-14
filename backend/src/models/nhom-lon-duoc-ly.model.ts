import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import type { NhomNhoDuocLy } from './nhom-nho-duoc-ly.model';

@Entity('nhom_lon_duoc_ly')
export class NhomLonDuocLy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ten_nhom: string;

  @Column({ type: 'text', nullable: true })
  mo_ta: string | null;

  @Column({ type: 'int', default: 0 })
  thu_tu: number;

  @OneToMany('NhomNhoDuocLy', 'nhomLon')
  nhomNhoList: NhomNhoDuocLy[];
}
