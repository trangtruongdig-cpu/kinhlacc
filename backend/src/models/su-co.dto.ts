import type { LoaiSuCo, LaneSuCo, HangSuCo } from '../utils/su-co-van-tay.util';
import type { TrangThaiCum } from './su-co-cum.model';

/** Một tín hiệu do máy khách (hoặc bộ lọc lỗi của backend) gửi lên. */
export interface BaoSuCoDto {
  loai: LoaiSuCo;
  /** Route lúc xảy ra. Frontend gửi đường dẫn trang; backend gửi route HTTP. */
  route?: string;
  thongDiep: string;
  stack?: string;
  maLoi?: string;
  httpStatus?: number;
  /** 20 thao tác cuối trước khi lỗi xảy ra. */
  breadcrumbs?: unknown[];
  nguCanh?: Record<string, unknown>;
  trinhDuyet?: string;
  phienBanApp?: string;
  /** Người dùng KHÔNG hoàn tất được việc đang làm (lưu ca khám, đặt lịch…). */
  chanThaoTac?: boolean;
  /** Góp ý: mô tả người dùng tự gõ. */
  moTaNguoiDung?: string;
  /** Góp ý: tiêu đề ngắn, dùng làm tên cụm. */
  tieuDe?: string;
  /** Thời điểm xảy ra ở máy khách (ISO). Không tin tuyệt đối — chỉ để đối chiếu. */
  xayRaLuc?: string;
}

/** Máy khách gom nhiều tín hiệu trong 5 giây rồi gửi một lượt. */
export interface BaoSuCoLoDto {
  danhSach: BaoSuCoDto[];
}

export interface LocCumDto {
  trangThai?: TrangThaiCum | 'dang_mo' | 'tat_ca';
  lane?: LaneSuCo | 'tat_ca';
  loai?: LoaiSuCo | 'tat_ca';
  hang?: HangSuCo | 'tat_ca';
  /** Tìm theo khu vực / route / vân tay / tóm tắt. */
  q?: string;
  trang?: number;
  moiTrang?: number;
}

export interface CapNhatCumDto {
  trangThai?: TrangThaiCum;
  ghiChu?: string;
}

/** Dòng hiển thị trên danh sách cụm. */
export interface CumTomLuocDto {
  id: number;
  vanTay: string;
  loai: LoaiSuCo;
  lane: LaneSuCo;
  hang: HangSuCo;
  trangThai: TrangThaiCum;
  khuVuc: string;
  routeChuan: string;
  tomTat: string;
  thongDiepGoc: string | null;
  soLan: number;
  soNguoi: number;
  lanDau: string;
  lanCuoi: string;
  /** Cụm từng được đánh "đã sửa" rồi xuất hiện lại — đáng chú ý hơn cụm mới. */
  taiPhat: boolean;
}

export interface ThongKeSuCoDto {
  dangMo: number;
  moi24h: number;
  hangNang: number;
  daSuaTuanNay: number;
  /** Số cụm chưa ai đụng tới — dùng cho chấm đỏ trên thanh điều hướng. */
  chuaXem: number;
}
