import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ton_thuong_tac_nhan')
export class TonThuongTacNhan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  ten: string;

  @Column({ type: 'text', nullable: true })
  ghi_chu: string | null;
}
