import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { BaiThuocChiTiet } from './bai-thuoc-chi-tiet.model';
import { BaiThuocPhapTri } from './bai-thuoc-phap-tri.model';
import { TrieuChung } from './trieu-chung.model';

@Entity('bai_thuoc')
export class BaiThuoc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ten_bai_thuoc: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nguon_goc: string; // Tên tác giả hoặc cổ phương

  @Column({ type: 'text', nullable: true })
  cong_dung: string;

  @Column({ type: 'text', nullable: true })
  cach_dung: string;

  @Column({ type: 'text', nullable: true })
  ghi_chu: string;

  @Column({ type: 'text', nullable: true })
  chung_trang: string; // Chứng trạng (biện chứng + pháp trị gộp, tự do / phân tách bằng dấu phẩy)

  @Column({ type: 'text', nullable: true })
  the_benh: string; // Thể bệnh (danh sách chip chọn từ danh mục, phân tách bằng dấu phẩy)

  @Column({ type: 'text', nullable: true })
  trieu_chung: string; // Triệu chứng (comma-separated)

  /** Nguồn dữ liệu chuẩn cho triệu chứng của bài thuốc. */
  @ManyToMany(() => TrieuChung)
  @JoinTable({
    name: 'bai_thuoc_trieu_chung',
    joinColumn: { name: 'id_bai_thuoc', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_trieu_chung', referencedColumnName: 'id' },
  })
  trieuChungList: TrieuChung[];

  @OneToMany(() => BaiThuocChiTiet, (detail) => detail.baiThuoc)
  chiTietViThuoc: BaiThuocChiTiet[];

  @OneToMany(() => BaiThuocPhapTri, (link) => link.baiThuoc)
  phapTriLinks: BaiThuocPhapTri[];
}
