import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn
} from 'typeorm';

/** Cột NUMERIC của pg đọc ra là chuỗi; đưa về number để API trả số đúng kiểu. */
const soThapPhan = {
  to: (v: number | null | undefined) => (v === null || v === undefined ? null : v),
  from: (v: string | number | null): number | null => {
    if (v === null || v === undefined) return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  },
};

/** Chẩn đoán đã lưu từ luồng "Hỏi & Chẩn đoán" (D5) — kết luận thầy thuốc + bằng chứng. */
export interface ChanDoanLuu {
  /** Tên thể bệnh kết luận (gộp nhiều thể bằng ", " khi chọn nhiều thể). */
  ket_luan: string;
  /** Khóa ứng viên của thể đầu tiên (tdo:<id> hoặc kep:...) — giữ tương thích bản cũ. */
  ket_luan_key?: string;
  /** Danh sách thể kết luận khi chốt NHIỀU thể bệnh (mỗi thể: nhãn + khóa). */
  ket_luan_items?: { label: string; key: string }[];
  /** Bảng xếp hạng theo lời kể lúc chốt (snapshot bằng chứng). */
  xep_hang: { label: string; percent: number; is_kep: boolean }[];
  /** Triệu chứng đã hỏi + câu trả lời (chỉ những câu đã trả lời). */
  trieu_chung: { id: number; ten: string; nhom: string | null; tra_loi: 'co' | 'khong' | 'kho' }[];
  /** Ghi chú thầy thuốc. */
  ghi_chu?: string;
  /** Thời điểm lưu (ISO). */
  luu_luc: string;
}

/**
 * Đơn thuốc TÙY CHỈNH (thang đặc trị) cho 1 ca khám — gộp vị thuốc từ các bài thuốc
 * của các thể bệnh khớp (bỏ trùng), thầy thuốc tích chọn/bỏ vị và chỉnh liều.
 */
export interface DonThuocLuu {
  items: {
    /** id vị thuốc (null nếu bài nguồn chưa gắn vị chuẩn). */
    id_vi_thuoc: number | null;
    /** Tên vị thuốc hiển thị. */
    ten: string;
    /** Liều lượng (thầy thuốc chỉnh; mặc định gợi ý từ bài nguồn). */
    lieu_luong?: string | null;
    /** Vai trò Quân/Thần/Tá/Sứ (nếu có). */
    vai_tro?: string | null;
    /** Số bài thuốc nguồn có chứa vị này (dùng xếp thông dụng → đặc trị). */
    so_bai: number;
    /** Tên các bài thuốc nguồn chứa vị này. */
    tu_bai?: string[];
    /** Thầy thuốc có đưa vị này vào đơn không. */
    chon: boolean;
  }[];
  /** Ghi chú thầy thuốc. */
  ghi_chu?: string;
  /** Thời điểm lưu (ISO). */
  luu_luc: string;
}

@Entity('examinations')
export class Examination {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  patientId: number;

  @Column({ type: 'jsonb' })
  inputData: Record<string, number>;

  @Column({ type: 'varchar', length: 50 })
  amDuong: string;

  @Column({ type: 'varchar', length: 50 })
  khi: string;

  @Column({ type: 'varchar', length: 50 })
  huyet: string;

  // Hư-Thực: cương ĐỘC LẬP (biên độ/diện rộng phản ứng toàn thân), KHÔNG gắn Khí/Huyết ở trên —
  // nullable vì các ca đo TRƯỚC khi thêm cột này chưa có giá trị.
  @Column({ type: 'varchar', length: 50, nullable: true })
  huThuc: string;

  @Column({ type: 'jsonb' })
  flags: Array<{
    channelIndex: number;
    channelName: string;
    L: number;
    R: number;
    Avg: number;
    c8: number;
    c10: number;
    c11: number;
    c12: number;
  }>;

  @Column({ type: 'jsonb', default: [] })
  syndromes: Array<Record<string, any>>;

  @Column({ type: 'jsonb', default: [] })
  selectedModelIds: number[];

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // ----- Bối cảnh môi trường + địa điểm lúc đo (điền tự động từ GPS máy đang khám) -----
  // pg trả kiểu NUMERIC về dạng chuỗi -> transformer đưa lại về number cho frontend.

  /** Nhiệt độ môi trường (°C) tại thời điểm đo. */
  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, transformer: soThapPhan })
  nhietDoMoiTruong: number | null;

  /** Độ ẩm tương đối (%) tại thời điểm đo. */
  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, transformer: soThapPhan })
  doAmMoiTruong: number | null;

  /** Tỉnh/Thành phố nơi đo (hành chính 2 cấp). */
  @Column({ type: 'varchar', length: 120, nullable: true })
  tinhThanh: string | null;

  /** Phường/Xã nơi đo (hành chính 2 cấp). */
  @Column({ type: 'varchar', length: 120, nullable: true })
  phuongXa: string | null;

  @Column({ type: 'double precision', nullable: true })
  viDo: number | null;

  @Column({ type: 'double precision', nullable: true })
  kinhDo: number | null;

  /**
   * Thời điểm khám THỰC TẾ (thầy thuốc nhập/sửa được, lùi hoặc tiến).
   * Khác `createdAt` — mốc bấm nút lưu, do hệ thống ghi và không sửa. Danh sách lịch sử
   * khám sắp xếp và hiển thị theo cột này để ca nhập bù nằm đúng vị trí thời gian.
   */
  // Cùng kiểu `timestamp` (không múi giờ) với createdAt để hai mốc luôn quy chiếu giống nhau.
  @Column({ type: 'timestamp', nullable: true })
  thoiDiemKham: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  chanDoan: ChanDoanLuu | null;

  @Column({ type: 'jsonb', nullable: true })
  donThuoc: DonThuocLuu | null;

  @CreateDateColumn()
  createdAt: Date;
}
