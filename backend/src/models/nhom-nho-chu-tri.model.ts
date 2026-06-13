import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { NhomNhoDuocLy } from './nhom-nho-duoc-ly.model';
import { ChuTri } from './chu-tri.model';

@Entity('nhom_nho_chu_tri')
export class NhomNhoChuTri {
  @PrimaryColumn({ name: 'id_nhom_nho' })
  idNhomNho: number;

  @PrimaryColumn({ name: 'id_chu_tri' })
  idChuTri: number;

  @Column({ type: 'int', default: 0 })
  thu_tu: number;

  @ManyToOne(() => NhomNhoDuocLy, (n) => n.chuTriLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_nhom_nho' })
  nhomNho: NhomNhoDuocLy;

  @ManyToOne(() => ChuTri, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_chu_tri' })
  chuTri: ChuTri;
}
