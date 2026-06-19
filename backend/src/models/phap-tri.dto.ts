/** Một dòng nguyên nhân có cấu trúc của pháp trị. */
export interface NguyenNhanInput {
  nhom?: string | null; // tinh-than | sinh-hoat | tang-phu
  noi_dung?: string | null;
  thu_tu?: number | null;
}

export class CreatePhapTriDto {
  chung_trang?: string | null;
  the_benh?: string | null;
  nguyen_tac?: string | null;
  y_nghia_co_che?: string | null;
  bat_phap?: string | null;
  bat_cuong?: string | null;
  luc_dam?: string | null;
  luc_kinh?: string | null;
  am_duong?: string | null;
  ton_thuong?: string | null;
  tac_nhan?: string | null;
  ban_chat?: string | null;
  vi_tri_tien_trinh?: string | null;
  mach_chan?: string | null;
  chat_luoi?: string | null;
  nguyen_nhan?: string | null;
  trieu_chung_mo_ta?: string | null;
  id_bai_thuoc?: number | null;
  /** Nhiều bài thuốc tham chiếu (ưu tiên hơn id_bai_thuoc khi có trong body) */
  id_bai_thuoc_list?: number[];
  /** Một chiều FK → benh_dong_y (tiểu kết) */
  id_benh_dong_y?: number | null;
  /** Cho phép cùng một pháp trị gắn nhiều bệnh Đông y. */
  id_benh_dong_y_list?: number[];
  /** Danh sách id kinh mạch (tạng phủ) */
  id_kinh_mach_list?: number[];
  /** Danh sách id triệu chứng (bảng trieu_chung) — ưu tiên đồng bộ quan hệ + trieu_chung_mo_ta */
  id_trieu_chung_list?: number[];
  /** Nguyên nhân có cấu trúc theo nhóm. */
  nguyen_nhan_list?: NguyenNhanInput[];
}

export class UpdatePhapTriDto {
  chung_trang?: string | null;
  the_benh?: string | null;
  nguyen_tac?: string | null;
  y_nghia_co_che?: string | null;
  bat_phap?: string | null;
  bat_cuong?: string | null;
  luc_dam?: string | null;
  luc_kinh?: string | null;
  am_duong?: string | null;
  ton_thuong?: string | null;
  tac_nhan?: string | null;
  ban_chat?: string | null;
  vi_tri_tien_trinh?: string | null;
  mach_chan?: string | null;
  chat_luoi?: string | null;
  nguyen_nhan?: string | null;
  trieu_chung_mo_ta?: string | null;
  id_bai_thuoc?: number | null;
  id_bai_thuoc_list?: number[];
  id_benh_dong_y?: number | null;
  id_benh_dong_y_list?: number[];
  id_kinh_mach_list?: number[];
  id_trieu_chung_list?: number[];
  nguyen_nhan_list?: NguyenNhanInput[];
}
