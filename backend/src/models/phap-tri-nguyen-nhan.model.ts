import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PhapTri } from './phap-tri.model';

/**
 * Nguyên nhân CÓ CẤU TRÚC của một pháp trị (thể bệnh Đông Y).
 * nhom: tinh-than (yếu tố tinh thần) | sinh-hoat (chế độ sinh hoạt) | tang-phu (ảnh hưởng tạng phủ khác).
 */
@Entity('phap_tri_nguyen_nhan')
export class PhapTriNguyenNhan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_phap_tri' })
  idPhapTri: number;

  @Column({ type: 'varchar', length: 40, nullable: true })
  nhom: string | null;

  @Column({ type: 'text', nullable: true })
  noi_dung: string | null;

  @Column({ type: 'int', default: 0 })
  thu_tu: number;

  @ManyToOne(() => PhapTri, (pt) => pt.nguyen_nhan_list, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_phap_tri' })
  phapTri: PhapTri;
}
