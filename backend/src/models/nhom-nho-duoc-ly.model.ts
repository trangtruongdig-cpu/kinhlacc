import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { NhomLonDuocLy } from './nhom-lon-duoc-ly.model';
import { NhomNhoViThuoc } from './nhom-nho-vi-thuoc.model';
import { NhomNhoChuTri } from './nhom-nho-chu-tri.model';

@Entity('nhom_nho_duoc_ly')
export class NhomNhoDuocLy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_nhom_lon' })
  idNhomLon: number;

  @Column({ type: 'varchar', length: 255 })
  ten_nhom: string;

  /** Liều lượng dùng chung cho toàn bộ vị thuốc trong nhóm nhỏ (ví dụ "8-12g"). */
  @Column({ type: 'varchar', length: 255, nullable: true })
  lieu_luong: string | null;

  @Column({ type: 'text', nullable: true })
  mo_ta: string | null;

  @Column({ type: 'int', default: 0 })
  thu_tu: number;

  @ManyToOne(() => NhomLonDuocLy, (lon) => lon.nhomNhoList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_nhom_lon' })
  nhomLon: NhomLonDuocLy;

  @OneToMany(() => NhomNhoViThuoc, (link) => link.nhomNho, { cascade: true })
  viThuocLinks: NhomNhoViThuoc[];

  @OneToMany(() => NhomNhoChuTri, (link) => link.nhomNho, { cascade: true })
  chuTriLinks: NhomNhoChuTri[];
}
