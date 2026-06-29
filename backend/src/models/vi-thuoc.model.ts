import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
// import type chỉ dùng cho TypeScript type checking, không tạo runtime circular dep
import type { BaiThuocChiTiet } from './bai-thuoc-chi-tiet.model';
import type { ViThuocCongDung } from './vi-thuoc-cong-dung.model';
import type { ViThuocChuTri } from './vi-thuoc-chu-tri.model';
import type { ViThuocKiengKy } from './vi-thuoc-kieng-ky.model';
import type { ViThuocTenGoiKhac } from './vi-thuoc-ten-goi-khac.model';
import type { ViThuocKinhMach } from './vi-thuoc-kinh-mach.model';

@Entity('vi_thuoc')
export class ViThuoc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ten_vi_thuoc: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tinh: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vi: string;

  @Column({ type: 'text', nullable: true })
  quy_kinh: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lieu_dung: string;

  // Tên khoa học Latin (vd. "Radix Paeoniae Alba")
  @Column({ type: 'varchar', length: 400, nullable: true })
  ten_khoa_hoc: string;

  // Tên Hán / chữ Trung (vd. "白芍")
  @Column({ type: 'varchar', length: 150, nullable: true })
  ten_han: string;

  // Phiên âm Pinyin (vd. "Bái Sháo")
  @Column({ type: 'varchar', length: 150, nullable: true })
  ten_pinyin: string;

  // Bộ phận dùng (vd. "rễ", "vỏ thân", "hạt", "toàn cây")
  @Column({ type: 'varchar', length: 255, nullable: true })
  bo_phan_dung: string;

  // Số BÀI THUỐC vị này xuất hiện (đếm sẵn từ phuong_thang) → sắp "vị thường dùng" lên đầu + badge.
  @Column({ type: 'int', default: 0 })
  so_bai_thuoc: number;

  // ---- Nội dung y văn (nhập từ từ điển Đông Y cũ "Thuynhan DBF") — văn bản nguyên văn theo mục ----
  @Column({ type: 'varchar', length: 500, nullable: true })
  xuat_xu: string | null; // Xuất xứ (vd "Khai Bảo Bản Thảo")
  @Column({ type: 'varchar', length: 500, nullable: true })
  ho_khoa_hoc: string | null; // Họ khoa học (vd "Họ Bàng (Combretaceae)")
  @Column({ type: 'text', nullable: true })
  ten_khac: string | null; // Tên khác (nguyên văn, kèm nguồn)
  @Column({ type: 'text', nullable: true })
  mo_ta: string | null;
  @Column({ type: 'text', nullable: true })
  thanh_phan: string | null;
  @Column({ type: 'text', nullable: true })
  duoc_ly: string | null;
  @Column({ type: 'text', nullable: true })
  tinh_vi_quy_kinh: string | null; // bản y văn (khác cột tinh/vi/quy_kinh có cấu trúc)
  @Column({ type: 'text', nullable: true })
  nuoi_duong: string | null;
  @Column({ type: 'text', nullable: true })
  bao_che: string | null;
  @Column({ type: 'text', nullable: true })
  don_thuoc: string | null;
  @Column({ type: 'text', nullable: true })
  chu_tri: string | null; // bản y văn (khác bảng liên kết chuTriLinks)
  @Column({ type: 'text', nullable: true })
  tham_khao: string | null;

  // Dùng string reference để tránh circular import với các child models
  @OneToMany('BaiThuocChiTiet', 'viThuoc')
  baiThuocDetails: BaiThuocChiTiet[];

  @OneToMany('ViThuocCongDung', 'viThuoc')
  congDungLinks: ViThuocCongDung[];

  @OneToMany('ViThuocChuTri', 'viThuoc')
  chuTriLinks: ViThuocChuTri[];

  @OneToMany('ViThuocKiengKy', 'viThuoc')
  kiengKyLinks: ViThuocKiengKy[];

  @OneToMany('ViThuocTenGoiKhac', 'viThuoc')
  tenGoiKhacList: ViThuocTenGoiKhac[];

  @OneToMany('ViThuocKinhMach', 'viThuoc')
  kinhMachLinks: ViThuocKinhMach[];
}
