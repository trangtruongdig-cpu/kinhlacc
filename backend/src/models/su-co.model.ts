import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import type { LoaiSuCo } from '../utils/su-co-van-tay.util';

/**
 * MỘT LẦN sự cố xảy ra. Nhiều dòng ở đây trỏ về một dòng `su_co_cum`.
 *
 * Giữ 30 ngày rồi dọn (xem SuCoService.donDep). Quá ngưỡng chống bão thì cụm chỉ tăng bộ đếm
 * và KHÔNG sinh thêm dòng ở bảng này — lần thứ 201 không nói thêm được gì so với lần thứ 200.
 */
@Entity('su_co')
@Index('idx_su_co_cum_id', ['cumId'])
@Index('idx_su_co_xay_ra_luc', ['xayRaLuc'])
export class SuCo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cum_id', type: 'int' })
  cumId: number;

  @Column({ name: 'xay_ra_luc', type: 'timestamptz' })
  xayRaLuc: Date;

  @Column({ type: 'varchar', length: 10 })
  loai: LoaiSuCo;

  /** Route THÔ (đã che query nhạy cảm) — cần để biết ID thật lúc tái hiện. */
  @Column({ name: 'route_tho', type: 'text', nullable: true })
  routeTho: string | null;

  @Column({ name: 'route_chuan', type: 'text' })
  routeChuan: string;

  @Column({ name: 'thong_diep', type: 'text' })
  thongDiep: string;

  @Column({ type: 'text', nullable: true })
  stack: string | null;

  @Column({ name: 'ma_loi', type: 'varchar', length: 80, nullable: true })
  maLoi: string | null;

  @Column({ name: 'http_status', type: 'int', nullable: true })
  httpStatus: number | null;

  /**
   * 20 thao tác cuối trước khi lỗi xảy ra. Đây là thứ biến "lỗi không tái hiện được"
   * thành "lỗi tái hiện được" — quý hơn stack trace trong phần lớn trường hợp.
   */
  @Column({ type: 'jsonb', nullable: true })
  breadcrumbs: unknown;

  /** Ngữ cảnh thêm, ĐÃ QUA bộ che ở cả máy khách lẫn máy chủ. */
  @Column({ name: 'ngu_canh', type: 'jsonb', nullable: true })
  nguCanh: unknown;

  @Column({ name: 'trinh_duyet', type: 'varchar', length: 250, nullable: true })
  trinhDuyet: string | null;

  /** 'quan_tri' | 'y_sy' | 'le_tan' | 'benh_nhan' | 'khach' */
  @Column({
    name: 'vai_tro_nguoi_dung',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  vaiTroNguoiDung: string | null;

  @Column({
    name: 'nguoi_dung_hash',
    type: 'varchar',
    length: 16,
    nullable: true,
  })
  nguoiDungHash: string | null;

  @Column({
    name: 'phien_ban_app',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  phienBanApp: string | null;

  /** IP đã cắt nhóm cuối (vd 1.2.3.*) — đủ để nhận ra spam, không đủ để truy ra người. */
  @Column({ name: 'ip_rut_gon', type: 'varchar', length: 45, nullable: true })
  ipRutGon: string | null;

  /** Với góp ý người dùng: mô tả họ gõ + loại họ chọn. */
  @Column({ name: 'mo_ta_nguoi_dung', type: 'text', nullable: true })
  moTaNguoiDung: string | null;
}
