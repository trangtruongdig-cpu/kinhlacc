import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { PhapTri } from './phap-tri.model';
import { TrieuChung } from './trieu-chung.model';
import { BaiThuoc } from './bai-thuoc.model';
import type { BenhDongYExcelNguyenNhan } from './benh-dong-y-excel-nguyen-nhan.model';

@Entity('benh_dong_y_excel')
export class BenhDongYExcel {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 120, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20, name: 'output_cell' })
  outputCell: string;

  @Column({ type: 'text', name: 'excel_formula' })
  excelFormula: string;

  @Column({ type: 'text', name: 'logic_expression' })
  logicExpression: string;

  @Column({ type: 'text', name: 'sql_case_text' })
  sqlCaseText: string;

  @Column({ type: 'text', name: 'sql_case_boolean' })
  sqlCaseBoolean: string;

  @ManyToMany(() => PhapTri)
  @JoinTable({
    name: 'benh_dong_y_excel_phap_tri',
    joinColumn: { name: 'id_benh_dong_y_excel', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_phap_tri', referencedColumnName: 'id' },
  })
  phapTriList: PhapTri[];

  @ManyToMany(() => TrieuChung)
  @JoinTable({
    name: 'benh_dong_y_excel_trieu_chung',
    joinColumn: { name: 'id_benh_dong_y_excel', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_trieu_chung', referencedColumnName: 'id' },
  })
  trieuChungList: TrieuChung[];

  @ManyToMany(() => BaiThuoc)
  @JoinTable({
    name: 'benh_dong_y_excel_bai_thuoc',
    joinColumn: { name: 'id_benh_dong_y_excel', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_bai_thuoc', referencedColumnName: 'id' },
  })
  baiThuocList: BaiThuoc[];

  /** Nguyên nhân có cấu trúc (theo nhóm tinh-than / sinh-hoat / tang-phu). */
  @OneToMany('BenhDongYExcelNguyenNhan', 'benhDongYExcel')
  nguyen_nhan_list: BenhDongYExcelNguyenNhan[];
}
