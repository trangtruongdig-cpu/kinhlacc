import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BaiThuocChiTiet } from './bai-thuoc-chi-tiet.model';
import { ViThuocCongDung } from './vi-thuoc-cong-dung.model';
import { ViThuocChuTri } from './vi-thuoc-chu-tri.model';
import { ViThuocKiengKy } from './vi-thuoc-kieng-ky.model';
import { ViThuocTenGoiKhac } from './vi-thuoc-ten-goi-khac.model';
import { ViThuocKinhMach } from './vi-thuoc-kinh-mach.model';

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

  @OneToMany(() => BaiThuocChiTiet, (detail) => detail.viThuoc)
  baiThuocDetails: BaiThuocChiTiet[];

  @OneToMany(() => ViThuocCongDung, (link) => link.viThuoc)
  congDungLinks: ViThuocCongDung[];

  @OneToMany(() => ViThuocChuTri, (link) => link.viThuoc)
  chuTriLinks: ViThuocChuTri[];

  @OneToMany(() => ViThuocKiengKy, (link) => link.viThuoc)
  kiengKyLinks: ViThuocKiengKy[];

  @OneToMany(() => ViThuocTenGoiKhac, (row) => row.viThuoc)
  tenGoiKhacList: ViThuocTenGoiKhac[];

  @OneToMany(() => ViThuocKinhMach, (link) => link.viThuoc)
  kinhMachLinks: ViThuocKinhMach[];
}
