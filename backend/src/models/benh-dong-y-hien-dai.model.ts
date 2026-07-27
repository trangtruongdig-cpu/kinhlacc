import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('benh_dong_y_hien_dai')
export class BenhDongYHienDai {
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

  /** Tên gọi khác (bí danh) — vd khi gộp 2 thể trùng công thức từ app gốc thành 1 thể chính,
   * tên thể bị gộp được giữ lại đây để không mất dấu vết, hiển thị ở màn chi tiết. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  aliases: string[];
}
