import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ViThuoc } from './vi-thuoc.model';

/**
 * ViThuocAnh — ẢNH DƯỢC LIỆU do người dùng TỰ UPLOAD (khác ảnh tĩnh trong public/vi-thuoc/).
 * File nằm ở thư mục upload của backend, phục vụ tại URL `/uploads/vi-thuoc/<id>/<file>`.
 * `url` lưu đường dẫn tương đối đó; frontend ghép với API base để hiển thị.
 */
@Entity('vi_thuoc_anh')
export class ViThuocAnh {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_vi_thuoc' })
  id_vi_thuoc: number;

  @Column({ type: 'text' })
  url: string; // vd "/uploads/vi-thuoc/66/1720000000-abc.webp"

  @Column({ type: 'varchar', length: 255, nullable: true })
  giai_doan: string | null; // giai đoạn: "Cây tươi", "Dược liệu (phiến)", "Thành phẩm"…

  @Column({ type: 'text', nullable: true })
  mo_ta: string | null;

  @Column({ type: 'int', default: 0 })
  thu_tu: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => ViThuoc, (v) => v.anhUploads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_vi_thuoc' })
  viThuoc: ViThuoc;
}
