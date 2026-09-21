import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { KinhMach } from './kinh-mach.model';
import type { PhacDoDieuTri } from './phac-do-dieu-tri.model';

@Entity('huyet_vi')
export class HuyetVi {
  @PrimaryGeneratedColumn({ name: 'id_huyet' })
  idHuyet: number;

  @Column({ type: 'int', name: 'id_kinh_mach' })
  idKinhMach: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ten_huyet: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ma_huyet: string;

  @Column({ type: 'text', nullable: true })
  vi_tri_giai_phau: string;

  @Column({ type: 'text', nullable: true })
  tac_dung: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  loai_huyet: string;

  @Column({ type: 'text', nullable: true })
  chong_chi_dinh: string;

  // ID huyệt trong bộ Từ Điển 1059 (window.ACUPOINTS). Dùng để LINK sang Từ Điển cho các huyệt
  // KHÔNG có toạ độ trên đồ hình 3D (kỳ huyệt / nhĩ châm) — thay cho nút "xem trên 3D".
  @Column({ type: 'int', name: 'id_tu_dien', nullable: true })
  id_tu_dien: number | null;

  // Vị thuốc ứng với huyệt này trên "phiếu huyệt" (xem SchemaBootstrap: ghép mặc định, sửa được
  // lúc soạn phiếu). Không đặt ràng buộc khoá ngoại: vị thuốc bị xoá thì cột chỉ trỏ trượt, không
  // kéo theo việc xoá huyệt.
  @Column({ type: 'int', name: 'id_vi_thuoc', nullable: true })
  id_vi_thuoc: number | null;

  // Câu công năng ngắn in trên phiếu ("Đại bổ nguyên khí, an thần").
  @Column({ type: 'varchar', length: 255, nullable: true })
  cong_nang_ghep: string | null;

  @ManyToOne(() => KinhMach, (k) => k.huyetViList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_kinh_mach' })
  kinhMach: KinhMach;

  @OneToMany('PhacDoDieuTri', 'huyetVi')
  phacDoList: PhacDoDieuTri[];
}
