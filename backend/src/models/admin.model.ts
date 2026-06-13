import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VaiTro } from './vai-tro.model';

/**
 * Tài khoản nhân viên (UI gọi là "Người Dùng"). Giữ tên bảng `admins` để
 * không phá login & dữ liệu cũ. Mỗi tài khoản gắn 1 vai trò qua `vaiTroId`.
 */
@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'varchar', nullable: true })
  hoTen: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'uuid', nullable: true })
  vaiTroId: string | null;

  @ManyToOne(() => VaiTro, { nullable: true, eager: true })
  @JoinColumn({ name: 'vaiTroId' })
  vaiTro: VaiTro | null;

  // TRUE = đang hoạt động, FALSE = bị khoá (không đăng nhập được).
  @Column({ default: true })
  trangThai: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
