import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ViThuoc } from './vi-thuoc.model';

@Entity('vi_thuoc_ten_goi_khac')
export class ViThuocTenGoiKhac {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_vi_thuoc' })
  id_vi_thuoc: number;

  @Column({ type: 'varchar', length: 255 })
  ten_goi_khac: string;

  @ManyToOne(() => ViThuoc, (v) => v.tenGoiKhacList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_vi_thuoc' })
  viThuoc: ViThuoc;
}
