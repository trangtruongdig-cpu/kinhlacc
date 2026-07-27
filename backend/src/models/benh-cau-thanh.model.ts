import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MeridianSyndrome } from './meridian-syndrome.model';

/**
 * Cấu thành thể kép: 1 chứng "kép / lưỡng hư" (compound) GỒM những chứng ĐƠN (component).
 * Khi hiển thị phương huyệt cho thể kép → gộp phương huyệt của các thể đơn + huyệt riêng
 * của thể kép (khử trùng theo huyệt). Thay cho bảng alias gán cứng trước đây ở frontend.
 * Cả compound lẫn component đều là bản ghi trong benh_dong_y (MeridianSyndrome).
 */
@Entity('benh_cau_thanh')
export class BenhCauThanh {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'compound_id' })
  compoundId: number;

  @Column({ type: 'int', name: 'component_id' })
  componentId: number;

  @Column({ type: 'int', default: 0 })
  thu_tu: number;

  @Column({ type: 'text', nullable: true })
  ghi_chu: string | null;

  @ManyToOne(() => MeridianSyndrome, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'compound_id' })
  compound: MeridianSyndrome;

  @ManyToOne(() => MeridianSyndrome, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'component_id' })
  component: MeridianSyndrome;
}
