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
