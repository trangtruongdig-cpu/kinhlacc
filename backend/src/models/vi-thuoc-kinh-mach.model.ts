import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ViThuoc } from './vi-thuoc.model';
import { KinhMach } from './kinh-mach.model';

@Entity('vi_thuoc_kinh_mach')
export class ViThuocKinhMach {
  @PrimaryColumn({ name: 'id_vi_thuoc' })
  id_vi_thuoc: number;

  @PrimaryColumn({ name: 'id_kinh_mach' })
  id_kinh_mach: number;

  @ManyToOne(() => ViThuoc, (v) => v.kinhMachLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_vi_thuoc' })
  viThuoc: ViThuoc;

  @ManyToOne(() => KinhMach, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_kinh_mach' })
  kinhMach: KinhMach;
}
