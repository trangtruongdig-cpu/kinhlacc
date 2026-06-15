// ViThuoc DTOs — nhóm dược lý qua tab Danh mục / API riêng; công dụng & chủ trị & kiêng kỵ qua bảng liên kết
export class CreateViThuocDto {
  ten_vi_thuoc: string;
  tinh?: string;
  vi?: string;
  quy_kinh?: string;
  lieu_dung?: string;
  /** Tên khoa học Latin (vd. "Radix Paeoniae Alba"). */
  ten_khoa_hoc?: string;
  /** Tên Hán / chữ Trung (vd. "白芍"). */
  ten_han?: string;
  /** Phiên âm Pinyin (vd. "Bái Sháo"). */
  ten_pinyin?: string;
  /** Bộ phận dùng (vd. "rễ", "vỏ thân", "hạt"). */
  bo_phan_dung?: string;
  /** Mỗi phần tử: id_cong_dung + ghi_chu (ghi chú gắn với vị thuốc này). */
  cong_dung_links?: { id_cong_dung: number; ghi_chu?: string }[];
  chu_tri_links?: { id_chu_tri: number; ghi_chu?: string }[];
  kieng_ky_links?: { id_kieng_ky: number; ghi_chu?: string }[];
  ten_goi_khac_list?: string[];
  /** IDs các kinh mạch quy nạp. Cột text `quy_kinh` sẽ được sync tự động từ danh sách này. */
  kinh_mach_ids?: number[];
  /** IDs các nhóm nhỏ dược lý mà vị thuốc thuộc về. */
  nhom_nho_ids?: number[];
}
export class UpdateViThuocDto extends CreateViThuocDto {}

// BaiThuoc DTOs
export class CreateBaiThuocDto {
  ten_bai_thuoc: string;
  nguon_goc?: string;
  cong_dung?: string;
  cach_dung?: string;
  ghi_chu?: string;
  chung_trang?: string;
  the_benh?: string;
  trieu_chung?: string;
  /** Chuẩn hóa: nguồn chính cho triệu chứng của bài thuốc. */
  trieu_chung_ids?: number[];
  /** Thứ tự mảng = thứ tự liên kết (thu_tu). Gửi [] để xóa hết; bỏ key khi update nếu không đổi liên kết. */
  phap_tri_ids?: number[];
  chi_tiet?: {
    id_vi_thuoc: number;
    lieu_luong?: string;
    vai_tro?: string;
    ghi_chu?: string;
    tinh_vi?: string; // Legacy
    quy_kinh?: string; // Supports multiple via comma
  }[];
}
export class UpdateBaiThuocDto extends CreateBaiThuocDto {}
