import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { MeridianSyndrome } from './meridian-syndrome.model';
import { HuyetVi } from './huyet-vi.model';

@Entity('phac_do_chuan')
export class PhacDoChuan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ten: string;

  // 'chung_benh' (mặc định — 42 bản ghi gốc, gắn id_benh_dong_y) | 'phoi_huyet_kinh_dien' (Nguyên-
  // Lạc, Bát Mạch Giao Hội, Du-Mộ, Tứ Quan… — kiến thức chuẩn hoá, không cần gắn bệnh) |
  // 'bai_thuoc_tuong_duong' (nhóm huyệt ứng 1 bài thuốc cổ phương, vd Thập Toàn Đại Bổ).
  @Column({ type: 'varchar', length: 40, default: 'chung_benh' })
  loai: string;

  @Column({ type: 'int', nullable: true, name: 'id_ke_thua' })
  idKeThua: number | null;

  @ManyToOne(() => PhacDoChuan, (p) => p.phuThuoc, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'id_ke_thua' })
  keThua: PhacDoChuan | null;

  @OneToMany(() => PhacDoChuan, (p) => p.keThua)
  phuThuoc: PhacDoChuan[];

  @Column({ type: 'int', nullable: true, name: 'id_benh_dong_y' })
  idBenhDongY: number | null;

  @ManyToOne(() => MeridianSyndrome, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'id_benh_dong_y' })
  benhDongY: MeridianSyndrome | null;

  @Column({ type: 'text', nullable: true })
  ghi_chu: string | null;

  @Column({ type: 'int', default: 0, name: 'thu_tu_hien_thi' })
  thuTuHienThi: number;

  @OneToMany(() => PhacDoChuanHuyet, (h) => h.phacDo)
  huyetDong: PhacDoChuanHuyet[];
}

@Entity('phac_do_chuan_huyet')
export class PhacDoChuanHuyet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'id_phac_do_chuan' })
  idPhacDoChuan: number;

  @Column({ type: 'int', name: 'id_huyet' })
  idHuyet: number;

  @Column({ type: 'int', default: 0, name: 'thu_tu' })
  thuTu: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vai_tro_huyet: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phuong_phap_tac_dong: string | null;

  @Column({ type: 'text', nullable: true })
  ghi_chu_ky_thuat: string | null;

  @ManyToOne(() => PhacDoChuan, (p) => p.huyetDong, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_phac_do_chuan' })
  phacDo: PhacDoChuan;

  @ManyToOne(() => HuyetVi, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_huyet', referencedColumnName: 'idHuyet' })
  huyetVi: HuyetVi;
}
