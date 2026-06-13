import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Vai trò (nhóm quyền). Phân quyền theo TRANG: `trangCho` là danh sách key trang
 * mà vai trò được phép vào (vd: ['home','patients','appointments']).
 * - `laQuanTri = true`  -> full quyền, bỏ qua `trangCho`.
 * - `laHeThong = true`  -> vai trò mặc định, không cho xoá.
 */
@Entity('vai_tro')
export class VaiTro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  ma: string;

  @Column()
  ten: string;

  @Column({ type: 'text', default: '' })
  moTa: string;

  @Column({ default: false })
  laQuanTri: boolean;

  @Column({ default: false })
  laHeThong: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  trangCho: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
