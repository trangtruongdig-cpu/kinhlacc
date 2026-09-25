import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { LoaiSuCo, LaneSuCo, HangSuCo } from '../utils/su-co-van-tay.util';

export type TrangThaiCum = 'moi' | 'dang_sua' | 'da_sua' | 'bo_qua';

/**
 * Một CỤM sự cố — nhiều lần xảy ra cùng một nguyên nhân, gộp bằng `vanTay`.
 *
 * Đây là thứ người đọc nhìn thấy trên tab "Góp Ý & Lỗi": danh sách VIỆC PHẢI SỬA,
 * không phải danh sách lần xảy ra. Chi tiết từng lần nằm ở bảng `su_co`.
 */
@Entity('su_co_cum')
@Index('idx_su_co_cum_trang_thai', ['trangThai'])
@Index('idx_su_co_cum_lan_cuoi', ['lanCuoi'])
export class SuCoCum {
  @PrimaryGeneratedColumn()
  id: number;

  /** sha1(loai|route_chuan|thong_diep_chuan) — 16 hex. Danh tính của cụm. */
  @Column({ name: 'van_tay', type: 'varchar', length: 16, unique: true })
  vanTay: string;

  @Column({ type: 'varchar', length: 10 })
  loai: LoaiSuCo;

  @Column({ type: 'varchar', length: 10 })
  lane: LaneSuCo;

  /** Khu vực nghiệp vụ suy ra từ route: patients, kinh-mach-3d, tu-dien… */
  @Column({ name: 'khu_vuc', type: 'varchar', length: 60 })
  khuVuc: string;

  @Column({ name: 'route_chuan', type: 'text' })
  routeChuan: string;

  /** Thông điệp đã chuẩn hoá — dùng để gom cụm. */
  @Column({ name: 'tom_tat', type: 'text' })
  tomTat: string;

  /** Một bản thông điệp GỐC (chưa chuẩn hoá) để người đọc hiểu nhanh. */
  @Column({ name: 'thong_diep_goc', type: 'text', nullable: true })
  thongDiepGoc: string | null;

  @Column({ name: 'so_lan', type: 'int', default: 0 })
  soLan: number;

  /** Số NGƯỜI khác nhau dính lỗi — chỉ số quan trọng hơn số lần rất nhiều. */
  @Column({ name: 'so_nguoi', type: 'int', default: 0 })
  soNguoi: number;

  /**
   * Băm của người dùng đã dính lỗi này (tối đa 50). Lưu băm chứ không lưu ID:
   * vẫn đếm được "dính bao nhiêu người" mà bảng lỗi không thành đường truy ra bệnh nhân.
   */
  @Column({ name: 'nguoi_dung_hashes', type: 'jsonb', default: () => "'[]'" })
  nguoiDungHashes: string[];

  /** Lỗi làm người dùng KHÔNG hoàn tất được việc đang làm → nâng hạng. */
  @Column({ name: 'chan_thao_tac', type: 'boolean', default: false })
  chanThaoTac: boolean;

  @Column({ type: 'varchar', length: 6, default: 'nhe' })
  hang: HangSuCo;

  @Column({ name: 'trang_thai', type: 'varchar', length: 12, default: 'moi' })
  trangThai: TrangThaiCum;

  /**
   * Cụm đã từng được đánh "đã sửa" rồi xuất hiện LẠI.
   *
   * Đáng chú ý hơn cụm mới: nó có nghĩa là bản vá trước không trúng, hoặc trúng rồi bị một
   * thay đổi sau đó phá lại. Cờ này không tự tắt — chỉ tắt khi người xử lý đóng cụm lần nữa.
   */
  @Column({ name: 'tai_phat', type: 'boolean', default: false })
  taiPhat: boolean;

  @Column({ name: 'lan_dau', type: 'timestamptz' })
  lanDau: Date;

  @Column({ name: 'lan_cuoi', type: 'timestamptz' })
  lanCuoi: Date;

  /** Ghi chú của người xử lý (vì sao bỏ qua, đã sửa ở commit nào…). */
  @Column({ name: 'ghi_chu', type: 'text', nullable: true })
  ghiChu: string | null;

  /** Kết quả "Nhờ AI phân tích" — lưu lại để khỏi gọi lại tốn tiền. */
  @Column({ name: 'ho_so_ai', type: 'text', nullable: true })
  hoSoAi: string | null;

  @Column({ name: 'ho_so_ai_luc', type: 'timestamptz', nullable: true })
  hoSoAiLuc: Date | null;

  @Column({
    name: 'phien_ban_app',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  phienBanApp: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
