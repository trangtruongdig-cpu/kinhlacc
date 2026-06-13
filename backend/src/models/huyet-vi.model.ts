import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { KinhMach } from './kinh-mach.model';
import { PhacDoDieuTri } from './phac-do-dieu-tri.model';

@Entity('huyet_vi')
export class HuyetVi {
  @PrimaryGeneratedColumn({ name: 'id_huyet' })
  idHuyet: number;

  @Column({ type: 'int', name: 'id_kinh_mach' })
  idKinhMach: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ten_huyet: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ma_huyet: string;

  @Column({ type: 'text', nullable: true })
  vi_tri_giai_phau: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  loai_huyet: string;

  @Column({ type: 'text', nullable: true })
  chong_chi_dinh: string;

  @ManyToOne(() => KinhMach, (k) => k.huyetViList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_kinh_mach' })
  kinhMach: KinhMach;

  @OneToMany(() => PhacDoDieuTri, (p) => p.huyetVi)
  phacDoList: PhacDoDieuTri[];
}
