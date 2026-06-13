import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { NhomNhoDuocLy } from './nhom-nho-duoc-ly.model';
import { ViThuoc } from './vi-thuoc.model';

@Entity('nhom_nho_vi_thuoc')
export class NhomNhoViThuoc {
  @PrimaryColumn({ name: 'id_nhom_nho' })
  idNhomNho: number;

  @PrimaryColumn({ name: 'id_vi_thuoc' })
  idViThuoc: number;

  @Column({ type: 'int', default: 0 })
  thu_tu: number;

  @ManyToOne(() => NhomNhoDuocLy, (n) => n.viThuocLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_nhom_nho' })
  nhomNho: NhomNhoDuocLy;

  @ManyToOne(() => ViThuoc, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_vi_thuoc' })
  viThuoc: ViThuoc;
}
