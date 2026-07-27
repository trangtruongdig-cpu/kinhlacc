export class CreatePhacDoDieuTriDto {
  id_benh: number;
  id_huyet: number;
  vai_tro_huyet?: string;
  phuong_phap_tac_dong?: string;
  ghi_chu_ky_thuat?: string;
  y_nghia_huyet?: string | null;
}

export class UpdatePhacDoDieuTriDto {
  id_benh?: number;
  id_huyet?: number;
  vai_tro_huyet?: string;
  phuong_phap_tac_dong?: string;
  ghi_chu_ky_thuat?: string;
  y_nghia_huyet?: string | null;
}
