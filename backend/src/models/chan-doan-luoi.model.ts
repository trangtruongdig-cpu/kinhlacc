import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('chan_doan_luoi')
export class ChanDoanLuoi {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_benh_nhan', type: 'int', nullable: true })
  idBenhNhan: number | null;

  @Column({ name: 'ngay_kham', type: 'timestamptz', default: () => 'now()' })
  ngayKham: Date;

  @Column({ name: 'mau_chat', type: 'varchar', length: 50, nullable: true })
  mauChat: string | null;

  @Column({ name: 'hinh_dang', type: 'text', nullable: true })
  hinhDang: string | null;

  @Column({ name: 'do_am', type: 'varchar', length: 50, nullable: true })
  doAm: string | null;

  @Column({ name: 'mau_reu', type: 'varchar', length: 50, nullable: true })
  mauReu: string | null;

  @Column({ name: 'tinh_chat_reu', type: 'text', nullable: true })
  tinhChatReu: string | null;

  @Column({ name: 'phan_bo_reu', type: 'text', nullable: true })
  phanBoReu: string | null;

  @Column({ name: 'vung_bat_thuong', type: 'text', nullable: true })
  vungBatThuong: string | null;

  @Column({ name: 'ket_qua_dong_y', type: 'text', nullable: true })
  ketQuaDongY: string | null;

  @Column({ name: 'ghi_chu', type: 'text', nullable: true })
  ghiChu: string | null;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
