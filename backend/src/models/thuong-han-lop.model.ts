import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Một "lớp" trong hành trình bóc lớp Thương Hàn Tạp Luận Bệnh:
 * Âm Dương → Ngũ Hành → Tạng Phủ → Lục Khí → Lục Kinh (→ Lâm sàng sau).
 * Nội dung giảng giải (khái niệm / ví dụ / vì sao / liên hệ app) lưu ở đây để sửa được trong DB.
 */
@Entity('thuong_han_lop')
export class ThuongHanLop {
  @PrimaryGeneratedColumn()
  id: number;

  /** am-duong · ngu-hanh · tang-phu · luc-khi · luc-kinh */
  @Column({ type: 'varchar', length: 40, unique: true })
  slug: string;

  @Column({ type: 'int', default: 0 })
  thu_tu: number;

  @Column({ type: 'varchar', length: 120 })
  ten: string;

  @Column({ name: 'ten_han', type: 'varchar', length: 40, nullable: true })
  ten_han: string | null;

  @Column({ type: 'text', nullable: true })
  tom_tat: string | null;

  @Column({ type: 'text', nullable: true })
  khai_niem: string | null;

  @Column({ type: 'text', nullable: true })
  vi_du: string | null;

  @Column({ type: 'text', nullable: true })
  vi_sao: string | null;

  @Column({ name: 'lien_he_app', type: 'text', nullable: true })
  lien_he_app: string | null;

  /** Dữ liệu cấu trúc riêng của lớp (tuỳ chọn, dùng cho popover chi tiết về sau). */
  @Column({ type: 'jsonb', nullable: true })
  du_lieu: unknown | null;
}
