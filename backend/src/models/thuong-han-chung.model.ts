import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * CHỨNG–PHƯƠNG Thương Hàn Luận — tầng giữa "6 kinh" và kho bài thuốc, lưu ở ĐÂY để tra và sửa được.
 *
 * Cùng lối với `nhht_cong_thuc`: bộ chuẩn do `data/thuong-han-chung.ts` giữ, service seed idempotent
 * lúc khởi động và ĐỒNG BỘ lại bản thầy thuốc chưa đụng vào; bản có cờ `sua_tay` thì không bao giờ
 * bị đè. Ca bệnh chỉ TRA bảng này, không tự luận — nên luôn truy được "bài thuốc này ra từ chứng nào,
 * điều văn nào".
 */
@Entity('thuong_han_chung')
export class ThuongHanChungModel {
  /** vd: td-trung-phong-bieu-hu */
  @PrimaryColumn({ type: 'varchar', length: 60 })
  slug!: string;

  /** thai-duong · duong-minh · thieu-duong · thai-am · thieu-am · quyet-am */
  @Column({ type: 'varchar', length: 40 })
  kinh!: string;

  /** kinh-chung | phu-chung | bien-chung | kiem-chung */
  @Column({ name: 'phan_loai', type: 'varchar', length: 20 })
  phan_loai!: string;

  @Column({ type: 'varchar', length: 160 })
  ten!: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  han!: string | null;

  /** Số điều trong Tống bản 398 điều — để tra ngược nguyên văn. */
  @Column({ name: 'dieu_van', type: 'jsonb', nullable: true })
  dieu_van!: unknown;

  @Column({ name: 'de_cuong', type: 'text', nullable: true })
  de_cuong!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  mach!: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  luoi!: string | null;

  /** Câu hỏi QUYẾT ĐỊNH — máy định vị tới kinh, người định vị tới chứng. */
  @Column({ name: 'cau_hoi_chot', type: 'jsonb', nullable: true })
  cau_hoi_chot!: unknown;

  @Column({ name: 'trieu_chung', type: 'jsonb', nullable: true })
  trieu_chung!: unknown;

  @Column({ name: 'phap_tri', type: 'text', nullable: true })
  phap_tri!: string | null;

  /** {ten, han, dang, viThuoc:[{ten, lieuGoc, lieuGram, vaiTro, canhBaoLieu}], cachDung} */
  @Column({ name: 'chu_phuong', type: 'jsonb', nullable: true })
  chu_phuong!: unknown;

  @Column({ name: 'gia_giam', type: 'jsonb', nullable: true })
  gia_giam!: unknown;

  /** Cấm kỵ — phần Thương Hàn Luận dặn kỹ nhất. */
  @Column({ name: 'cam_ky', type: 'jsonb', nullable: true })
  cam_ky!: unknown;

  @Column({ name: 'truyen_sang', type: 'jsonb', nullable: true })
  truyen_sang!: unknown;

  /**
   * Dấu hiệu đã KHỚP VÀO DANH MỤC CHUẨN của app (trieu_chung · mach_chan · thiet_chan) —
   * {trieuChung:[{id,ten}], mach:[{id,ten}], luoi:[{id,ten}]}. Nhờ nó giao diện bày được checklist
   * tick thay vì câu hỏi văn xuôi, và chấm được chứng nào khớp với dấu hiệu người bệnh đang có.
   */
  @Column({ name: 'dau_hieu', type: 'jsonb', nullable: true })
  dau_hieu!: unknown;

  /** Bài trong kho `bai_thuoc` khớp chủ phương (dò theo THÀNH PHẦN lúc seed). */
  @Column({ name: 'id_bai_thuoc', type: 'int', nullable: true })
  id_bai_thuoc!: number | null;

  /** % khớp thành phần của bài đã gắn — để thầy thuốc biết độ chắc của liên kết. */
  @Column({ name: 'khop_phan_tram', type: 'int', nullable: true })
  khop_phan_tram!: number | null;

  @Column({ name: 'ghi_chu', type: 'text', nullable: true })
  ghi_chu!: string | null;

  @Column({ name: 'sua_tay', type: 'boolean', default: false })
  sua_tay!: boolean;

  @Column({ name: 'nguoi_sua', type: 'varchar', length: 80, nullable: true })
  nguoi_sua!: string | null;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updated_at!: Date;
}
