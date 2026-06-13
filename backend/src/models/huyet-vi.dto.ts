export class CreateHuyetViDto {
  id_kinh_mach: number;
  idKinhMach?: number; // Support alternative naming
  ten_huyet: string;
  ma_huyet?: string;
  vi_tri_giai_phau?: string;
  loai_huyet?: string;
  chong_chi_dinh?: string;
}

export class UpdateHuyetViDto {
  id_kinh_mach?: number;
  idKinhMach?: number; // Support alternative naming
  ten_huyet?: string;
  ma_huyet?: string;
  vi_tri_giai_phau?: string;
  loai_huyet?: string;
  chong_chi_dinh?: string;
}
