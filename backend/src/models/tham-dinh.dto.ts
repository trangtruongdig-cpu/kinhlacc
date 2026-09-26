/**
 * Kiểu dữ liệu của bệnh án mục từ.
 *
 * ⚠️ DTO ở repo này là *type* TS thuần nên biến mất khi biên dịch — không có gì kiểm thân
 * request. Endpoint nào nhận dữ liệu ngoài phải gắn `@Body(new ZodPipe(...))`.
 * Kế hoạch này chỉ có endpoint không thân request nên chưa cần.
 */

export type HangHoSo = 'tot' | 'tam_duoc' | 'yeu' | 'hong';
export type LopSoi = 'may' | 'thay_thuoc' | 'seo';
export type TrangThaiNhanXet = 'moi' | 'da_duyet' | 'da_ap' | 'bo_qua';

export interface HoSoMuc {
  id?: number;
  bo: string;
  ma: string;
  slug: string;
  tieuDe: string;
  vanTayNoiDung: string;
  diemSach: number;
  diemMachLac: number | null;
  diemDuPhan: number;
  diemLienKet: number | null;
  diemSeo: number | null;
  hang: HangHoSo;
  uuTien: number;
  soiMayLuc: Date | null;
  soiThayThuocLuc: Date | null;
  soiSeoLuc: Date | null;
}

/** Kết quả một ca soi, trả về cho người bấm chạy tay. */
export interface LuocKeCa {
  batDau: string;
  ketThuc: string;
  soMucDoc: number;
  soMucBoQua: number;
  soNhanXet: number;
  soCum: number;
  soCumNop: number;
  loi: string[];
}

export interface LocHoSo {
  bo?: string;
  hang?: HangHoSo;
  q?: string;
  trang?: number;
  moiTrang?: number;
}

export interface ThongKeThamDinh {
  tongMuc: number;
  theoHang: Record<HangHoSo, number>;
  theoBo: Array<{ bo: string; soMuc: number; diemTrungBinh: number }>;
  soiLanCuoi: string | null;
}
