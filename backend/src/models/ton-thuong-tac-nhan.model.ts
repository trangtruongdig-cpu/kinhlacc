import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ton_thuong_tac_nhan')
export class TonThuongTacNhan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  ten: string;

  /**
   * Trục phân loại theo chuẩn Thương Hàn/Ôn bệnh:
   *  gd-luc-kinh · gd-on-benh · gd-khac (① giai đoạn/định vị)
   *  tn-luc-khi · tn-noi-sinh (② tác nhân/khí)
   *  tinh (③ tính tổn thương — bát cương/chính khí)
   */
  @Column({ type: 'varchar', length: 30, nullable: true })
  nhom: string | null;

  @Column({ type: 'text', nullable: true })
  ghi_chu: string | null;
}
