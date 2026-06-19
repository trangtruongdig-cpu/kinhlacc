import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BenhDongYExcel } from './benh-dong-y-excel.model';

/**
 * Nguyên nhân CÓ CẤU TRÚC của một thể đo (benh_dong_y_excel) — song song với phap_tri_nguyen_nhan.
 * nhom: tinh-than (yếu tố tinh thần) | sinh-hoat (chế độ sinh hoạt) | tang-phu (ảnh hưởng tạng phủ khác).
 */
@Entity('benh_dong_y_excel_nguyen_nhan')
export class BenhDongYExcelNguyenNhan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_benh_dong_y_excel' })
  idBenhDongYExcel: number;

  @Column({ type: 'varchar', length: 40, nullable: true })
  nhom: string | null;

  @Column({ type: 'text', nullable: true })
  noi_dung: string | null;

  @Column({ type: 'int', default: 0 })
  thu_tu: number;

  @ManyToOne(() => BenhDongYExcel, (b) => b.nguyen_nhan_list, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_benh_dong_y_excel' })
  benhDongYExcel: BenhDongYExcel;
}
