import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MeridianSyndrome } from './meridian-syndrome.model';
import { HuyetVi } from './huyet-vi.model';

@Entity('phac_do_dieu_tri')
export class PhacDoDieuTri {
  @PrimaryGeneratedColumn({ name: 'id_phac_do' })
  idPhacDo: number;

  @Column({ type: 'int', name: 'id_benh' })
  idBenh: number;

  @Column({ type: 'int', name: 'id_huyet' })
  idHuyet: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vai_tro_huyet: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phuong_phap_tac_dong: string;

  @Column({ type: 'text', nullable: true })
  ghi_chu_ky_thuat: string;

  @ManyToOne(() => MeridianSyndrome, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_benh' })
  benh: MeridianSyndrome;

  @ManyToOne(() => HuyetVi, (h) => h.phacDoList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_huyet' })
  huyetVi: HuyetVi;
}
