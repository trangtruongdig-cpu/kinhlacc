import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ViThuoc } from './vi-thuoc.model';
import { ChuTri } from './chu-tri.model';

@Entity('vi_thuoc_chu_tri')
export class ViThuocChuTri {
  @PrimaryColumn({ name: 'id_vi_thuoc' })
  id_vi_thuoc: number;

  @PrimaryColumn({ name: 'id_chu_tri' })
  id_chu_tri: number;

  @Column({ name: 'ghi_chu', type: 'text', nullable: true })
  ghi_chu: string | null;

  @ManyToOne(() => ViThuoc, (v) => v.chuTriLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_vi_thuoc' })
  viThuoc: ViThuoc;

  @ManyToOne(() => ChuTri, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_chu_tri' })
  chuTri: ChuTri;
}
