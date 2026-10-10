import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

/**
 * SỔ KHOÁ CHỐNG LẶP cho thao tác GHI.
 *
 * Vì sao cần: `fetch` ném "Failed to fetch" cho mọi kiểu đứt đường và KHÔNG nói được máy chủ đã
 * nhận lệnh hay chưa. Người dùng thấy báo lỗi thì bấm lại — mà lần đầu có thể đã thành công.
 * Đo thật 09/10/2026: vé chuyển xong trên máy chủ (b#86, movedAt 18:21:33) rồi ba lời gọi kế
 * tiếp chết trong 387 ms. Trước đây chống bằng một `alert()` nhờ người dùng tự kỷ luật; nay
 * chống bằng máy.
 *
 * Khoá do MÁY KHÁCH sinh, một lần cho mỗi Ý ĐỊNH (mở hộp thoại Chuyển vé → sinh khoá; mọi lần
 * thử lại dùng CÙNG khoá; đổi ca đích → khoá mới).
 */
@Entity('thao_tac_ghi')
@Index('idx_thao_tac_ghi_tao_luc', ['taoLuc'])
export class ThaoTacGhi {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  khoa: string;

  @Column({ type: 'varchar', length: 80 })
  route: string;

  /** Thân phản hồi của lần làm THẬT, để lần bấm lại nhận lại y hệt. */
  @Column({ name: 'ket_qua', type: 'jsonb', nullable: true })
  ketQua: unknown | null;

  @CreateDateColumn({ name: 'tao_luc', type: 'timestamptz' })
  taoLuc: Date;
}
