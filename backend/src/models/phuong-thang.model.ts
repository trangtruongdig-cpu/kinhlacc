import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/** Một vị trong bài thuốc; `id` = vi_thuoc.id khớp được (để tra ngược sang từ điển dược liệu). */
export interface ThanhPhanItem {
  ten: string;
  lieu: string;
  id: number | null;
}

/**
 * PhuongThang — TỪ ĐIỂN BÀI THUỐC / CỔ PHƯƠNG (công khai, chỉ đọc), nguồn app Đông Y Dược 2004.
 * Tách khỏi `bai_thuoc` (admin curated). Thành phần liên kết ngược tới `vi_thuoc` qua field id.
 */
@Entity('phuong_thang')
export class PhuongThang {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  ten: string;

  @Column({ type: 'text' })
  slug: string;

  @Column({ type: 'text', nullable: true })
  xuat_xu: string;

  @Column({ type: 'text', nullable: true })
  tac_gia: string;

  /** [{ ten, lieu, id }] — id là vi_thuoc.id (null nếu chưa khớp). */
  @Column({ type: 'jsonb', nullable: true })
  thanh_phan: ThanhPhanItem[];

  @Column({ type: 'text', nullable: true })
  cach_dung: string;

  @Column({ type: 'text', nullable: true })
  thanh_phan_raw: string;

  @Column({ type: 'text', nullable: true })
  tac_dung: string;

  @Column({ type: 'text', nullable: true })
  ghi_chu: string;

  // Điểm "thông dụng" = tổng so_bai_thuoc của các vị trong bài (bài gồm toàn vị hay dùng → cao). Sắp giảm dần.
  @Column({ type: 'int', default: 0 })
  diem_pho_bien: number;

  // Số BỆNH (Đông y) có y văn điều trị nhắc tới bài này → bài thực sự dùng trị bệnh ưu tiên lên đầu.
  @Column({ type: 'int', default: 0 })
  so_benh: number;
}
