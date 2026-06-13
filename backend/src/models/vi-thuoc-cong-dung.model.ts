import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ViThuoc } from './vi-thuoc.model';
import { CongDung } from './cong-dung.model';

@Entity('vi_thuoc_cong_dung')
export class ViThuocCongDung {
  @PrimaryColumn({ name: 'id_vi_thuoc' })
  id_vi_thuoc: number;

  @PrimaryColumn({ name: 'id_cong_dung' })
  id_cong_dung: number;

  /** Ghi chú theo từng vị thuốc — công dụng cụ thể / lưu ý dùng thuốc. */
  @Column({ name: 'ghi_chu', type: 'text', nullable: true })
  ghi_chu: string | null;

  @ManyToOne(() => ViThuoc, (v) => v.congDungLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_vi_thuoc' })
  viThuoc: ViThuoc;

  @ManyToOne(() => CongDung, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_cong_dung' })
  congDung: CongDung;
}
