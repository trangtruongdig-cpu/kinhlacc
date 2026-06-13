import { Entity, PrimaryColumn, Column } from 'typeorm';

/**
 * Điểm CHỐT "Chấm Tay" của Đồ Hình Kinh Lạc 3D.
 *
 * Mỗi dòng = 1 huyệt CHỐT do người dùng tự đặt trên mô hình 3D (toạ độ đã
 * chuẩn-hoá theo chiều cao thân, x/y/z thường nằm trong khoảng -1..1).
 * Đây là dữ liệu DÙNG CHUNG (golden) cho cả phòng khám — không gắn theo người
 * dùng hay bệnh nhân — nên mọi máy đăng nhập đều thấy cùng một bộ chốt.
 *
 * Engine map3d.js chỉ cần các CHỐT này; các huyệt nằm giữa được nội suy theo
 * tỉ lệ thốn ngay trên trình duyệt (TẦNG 2), nên không cần lưu toàn bộ huyệt.
 */
@Entity('kinh_mach_3d_anchor')
export class KinhMach3dAnchor {
  /** Mã huyệt, vd "LU2", "CV4". */
  @PrimaryColumn({ type: 'varchar', length: 16 })
  code: string;

  @Column({ type: 'double precision' })
  x: number;

  @Column({ type: 'double precision' })
  y: number;

  @Column({ type: 'double precision' })
  z: number;

  @Column({
    type: 'timestamptz',
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;
}
