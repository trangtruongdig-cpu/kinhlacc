import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ViThuoc } from './vi-thuoc.model';
import { KiengKy } from './kieng-ky.model';

@Entity('vi_thuoc_kieng_ky')
export class ViThuocKiengKy {
  @PrimaryColumn({ name: 'id_vi_thuoc' })
  id_vi_thuoc: number;

  @PrimaryColumn({ name: 'id_kieng_ky' })
  id_kieng_ky: number;

  @Column({ name: 'ghi_chu', type: 'text', nullable: true })
  ghi_chu: string | null;

  @ManyToOne(() => ViThuoc, (v) => v.kiengKyLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_vi_thuoc' })
  viThuoc: ViThuoc;

  @ManyToOne(() => KiengKy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_kieng_ky' })
  kiengKy: KiengKy;
}
