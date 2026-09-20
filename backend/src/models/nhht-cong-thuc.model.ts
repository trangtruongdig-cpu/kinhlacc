import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * CÔNG THỨC Ngũ Hành Hồi Tác — tri thức nằm Ở ĐÂY, không nằm ẩn trong hàm.
 *
 * 120 bản = 12 kinh × {hư, thực} × 5 khung hồi tác. Engine ở frontend/src/lib/nguHanhHoiTac.ts
 * SINH ra bộ chuẩn (kết tinh ở data/nhht-cong-thuc.ts), service nạp vào bảng này lúc khởi động
 * và CHỈ thêm mã còn thiếu — bản thầy thuốc đã sửa không bao giờ bị đè.
 *
 * Ca bệnh không tự luận lại: đo xong → định gốc (kinh + hư/thực) → TRA đúng một công thức ở đây
 * → hiện phương châm + ba trục huyệt. Nhờ vậy mỗi phiếu đo đều truy được "theo công thức nào".
 */
@Entity('nhht_cong_thuc')
export class NhhtCongThuc {
  /** VD: NHHT-TY-HU-THUONGHA (kinh · trạng thái · khung). */
  @PrimaryColumn({ type: 'varchar', length: 60 })
  ma!: string;

  @Column({ type: 'varchar', length: 40 })
  kinh!: string;

  @Column({ type: 'varchar', length: 20 })
  hanh!: string;

  /** 'hư' | 'thực' */
  @Column({ name: 'trang_thai', type: 'varchar', length: 10 })
  trang_thai!: string;

  /** bieuly | thuongha | phuthe | tyngo | lackhi */
  @Column({ type: 'varchar', length: 20 })
  khung!: string;

  @Column({ name: 'khung_ten', type: 'varchar', length: 40 })
  khung_ten!: string;

  /** Kinh bạn trong khung đang dùng. */
  @Column({ name: 'kinh_ban', type: 'varchar', length: 40, nullable: true })
  kinh_ban!: string | null;

  /** Câu chỉ đạo trị một dòng. */
  @Column({ name: 'chi_dao', type: 'text', nullable: true })
  chi_dao!: string | null;

  /** Mệnh lệnh có bậc chính/tá/kiêm — [{bac,tacDong,hanh,kinh,huyet,vaiTro,phap}]. */
  @Column({ name: 'menh_lenh', type: 'jsonb', nullable: true })
  menh_lenh!: unknown;

  /** Trục ① Ngũ Du theo NHHT (bổ + tả, hai kinh). */
  @Column({ name: 'huyet_ngu_du', type: 'jsonb', nullable: true })
  huyet_ngu_du!: unknown;

  /** Trục ① phụ — Nạn Kinh 69 (bổ mẫu / tả tử trên chính kinh gốc). */
  @Column({ name: 'huyet_nan_kinh', type: 'jsonb', nullable: true })
  huyet_nan_kinh!: unknown;

  /** Trục ② Nguyên–Lạc chủ–khách (theo cặp biểu-lý, độc lập với khung). */
  @Column({ name: 'huyet_nguyen_lac', type: 'jsonb', nullable: true })
  huyet_nguyen_lac!: unknown;

  /** Các pháp trị ngũ hành cổ điển hợp với ca này — để tra, không phải mệnh lệnh. */
  @Column({ name: 'phap_co_dien', type: 'jsonb', nullable: true })
  phap_co_dien!: unknown;

  /** Ghi chú lâm sàng của thầy thuốc. */
  @Column({ name: 'ghi_chu', type: 'text', nullable: true })
  ghi_chu!: string | null;

  /** true = đã sửa tay → seed KHÔNG đụng vào nữa, và UI báo "khác bộ chuẩn". */
  @Column({ name: 'sua_tay', type: 'boolean', default: false })
  sua_tay!: boolean;

  @Column({ name: 'nguoi_sua', type: 'varchar', length: 80, nullable: true })
  nguoi_sua!: string | null;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updated_at!: Date;
}
