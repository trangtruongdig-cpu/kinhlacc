export class CreateHuyetViDto {
  // Ghép "huyệt ⇄ vị thuốc" cho phiếu huyệt (xem huyet-vi.model.ts).
  id_vi_thuoc?: number | null;
  cong_nang_ghep?: string | null;
  id_kinh_mach: number;
  idKinhMach?: number; // Support alternative naming
  ten_huyet: string;
  ma_huyet?: string;
  vi_tri_giai_phau?: string;
  tac_dung?: string;
  loai_huyet?: string;
  chong_chi_dinh?: string;
}

export class UpdateHuyetViDto {
  id_vi_thuoc?: number | null;
  cong_nang_ghep?: string | null;
  // Link sang Từ Điển 1059 huyệt (window.ACUPOINTS) — xem huyet-vi.model.ts.
  id_tu_dien?: number | null;
  id_kinh_mach?: number;
  idKinhMach?: number; // Support alternative naming
  ten_huyet?: string;
  ma_huyet?: string;
  vi_tri_giai_phau?: string;
  tac_dung?: string;
  loai_huyet?: string;
  chong_chi_dinh?: string;
}
